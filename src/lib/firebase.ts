import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

// Web app's Firebase configuration from Google Firebase Console
export const firebaseConfig = {
  apiKey: "AIzaSyDpcgQOtxC8Jo75RLYszXjY7dHTAmZm3tw",
  authDomain: "service-app-e4415.firebaseapp.com",
  projectId: "service-app-e4415",
  storageBucket: "service-app-e4415.firebasestorage.app",
  messagingSenderId: "97545768193",
  appId: "1:97545768193:web:f35a5f965850f1d01d1f00",
  measurementId: "G-FVSE3Q14N0",
};

// Initialize Firebase (SSR safe, singleton)
export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Google Auth Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export type AppUserRole = "customer" | "provider";

export interface StoredAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: AppUserRole;
  providerId: string;
  username?: string;
  age?: string | number;
  gender?: string;
}

export const AUTH_STORAGE_KEY = "budgam_auth_user";
export const ROLE_STORAGE_KEY = "selected_role";

// Centralized in-memory auth subscribers for instant reactive updates across routes
type AuthListener = (user: StoredAuthUser | null) => void;
const authListeners = new Set<AuthListener>();

export function subscribeAuth(listener: AuthListener): () => void {
  authListeners.add(listener);
  return () => {
    authListeners.delete(listener);
  };
}

export function notifyAuthListeners(user: StoredAuthUser | null) {
  authListeners.forEach((listener) => {
    try {
      listener(user);
    } catch (err) {
      console.error("Auth listener error:", err);
    }
  });
}

/**
 * Get cached auth user synchronously from localStorage
 */
export function getStoredUser(): StoredAuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuthUser;
  } catch {
    return null;
  }
}

/**
 * Save user to localStorage for instant persistent sessions
 */
export function saveStoredUser(user: StoredAuthUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(ROLE_STORAGE_KEY, user.role);
      sessionStorage.setItem(ROLE_STORAGE_KEY, user.role);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(ROLE_STORAGE_KEY);
      sessionStorage.removeItem(ROLE_STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable
  }
}

/**
 * Persist or update user document in Firestore database
 */
export async function syncUserToFirestore(
  fbUser: FirebaseUser,
  details: {
    role: AppUserRole;
    displayName?: string | null;
    username?: string;
    age?: string | number;
    gender?: string;
  }
): Promise<void> {
  try {
    const userDocRef = doc(db, "users", fbUser.uid);
    const dataToSave: Record<string, any> = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: details.displayName || fbUser.displayName || details.username || "User",
      photoURL: fbUser.photoURL,
      role: details.role,
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (details.username) dataToSave.username = details.username;
    if (details.age) dataToSave.age = details.age;
    if (details.gender) dataToSave.gender = details.gender;

    await setDoc(userDocRef, dataToSave, { merge: true });
  } catch (error) {
    // Firestore security rules might restrict until configured, don't block auth
    console.warn("Could not sync user to Firestore database:", error);
  }
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(
  options: {
    targetRole?: AppUserRole;
    username?: string;
    age?: string | number;
    gender?: string;
  } = {}
): Promise<StoredAuthUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;

  // Check if user record already exists in Firestore
  let resolvedRole: AppUserRole = options.targetRole || "customer";
  let resolvedUsername: string | undefined = options.username;
  let resolvedAge: string | number | undefined = options.age;
  let resolvedGender: string | undefined = options.gender;

  try {
    const userSnap = await getDoc(doc(db, "users", fbUser.uid));
    if (userSnap.exists()) {
      const data = userSnap.data();
      if (data?.role) {
        resolvedRole = data.role as AppUserRole;
      }
      if (data?.username && !resolvedUsername) {
        resolvedUsername = data.username;
      }
      if (data?.age && !resolvedAge) {
        resolvedAge = data.age;
      }
      if (data?.gender && !resolvedGender) {
        resolvedGender = data.gender;
      }
    }
  } catch {
    // Fall back to targetRole
  }

  // If user signed up with new details, prefer them
  if (options.targetRole) {
    resolvedRole = options.targetRole;
  }

  const storedUser: StoredAuthUser = {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName:
      resolvedUsername ||
      fbUser.displayName ||
      fbUser.email?.split("@")[0] ||
      "User",
    photoURL: fbUser.photoURL,
    role: resolvedRole,
    providerId: result.providerId || "google.com",
    username: resolvedUsername,
    age: resolvedAge,
    gender: resolvedGender,
  };

  saveStoredUser(storedUser);
  notifyAuthListeners(storedUser);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("budgam_auth_change", { detail: storedUser })
    );
  }

  syncUserToFirestore(fbUser, {
    role: resolvedRole,
    displayName: storedUser.displayName,
    username: resolvedUsername,
    age: resolvedAge,
    gender: resolvedGender,
  }).catch(() => {});

  return storedUser;
}

/**
 * Sign out user cleanly and immediately notify all app listeners
 */
export async function logOutUser(): Promise<void> {
  // Synchronously wipe storage and trigger reactive state
  saveStoredUser(null);
  notifyAuthListeners(null);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("budgam_auth_change", { detail: null })
    );
  }

  try {
    await signOut(auth);
  } catch (err) {
    console.warn("Firebase signOut notice:", err);
  }
}

/**
 * Listen to auth changes and keep storage in sync
 */
export function initAuthListener(onUserChange: (user: StoredAuthUser | null) => void) {
  // Register with internal listener list
  const unsubInternal = subscribeAuth(onUserChange);

  // Also listen to Firebase auth changes
  const unsubFb = onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      const existing = getStoredUser();
      const role: AppUserRole = existing?.role || "customer";
      const updated: StoredAuthUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName:
          existing?.displayName ||
          fbUser.displayName ||
          fbUser.email?.split("@")[0] ||
          "User",
        photoURL: fbUser.photoURL,
        role,
        providerId: fbUser.providerData[0]?.providerId || "google.com",
        username: existing?.username,
        age: existing?.age,
        gender: existing?.gender,
      };
      saveStoredUser(updated);
      onUserChange(updated);
      notifyAuthListeners(updated);
    } else {
      // Firebase reports no user
      const existing = getStoredUser();
      if (!existing) {
        onUserChange(null);
        notifyAuthListeners(null);
      }
    }
  });

  return () => {
    unsubInternal();
    unsubFb();
  };
}
