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
}

export const AUTH_STORAGE_KEY = "budgam_auth_user";
export const ROLE_STORAGE_KEY = "selected_role";

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
  role: AppUserRole
): Promise<void> {
  try {
    const userDocRef = doc(db, "users", fbUser.uid);
    await setDoc(
      userDocRef,
      {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
        role,
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    // Firestore security rules might restrict until configured, don't block auth
    console.warn("Could not sync user to Firestore database:", error);
  }
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(
  targetRole: AppUserRole = "customer"
): Promise<StoredAuthUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;

  // Check if role was previously saved in Firestore
  let resolvedRole: AppUserRole = targetRole;
  try {
    const userSnap = await getDoc(doc(db, "users", fbUser.uid));
    if (userSnap.exists() && userSnap.data()?.role) {
      resolvedRole = userSnap.data().role as AppUserRole;
    }
  } catch {
    // Fall back to targetRole
  }

  const storedUser: StoredAuthUser = {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
    photoURL: fbUser.photoURL,
    role: resolvedRole,
    providerId: result.providerId || "google.com",
  };

  saveStoredUser(storedUser);
  syncUserToFirestore(fbUser, resolvedRole).catch(() => {});

  return storedUser;
}

/**
 * Sign out user cleanly
 */
export async function logOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } finally {
    saveStoredUser(null);
  }
}

/**
 * Listen to auth changes and keep storage in sync
 */
export function initAuthListener(onUserChange: (user: StoredAuthUser | null) => void) {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      const existing = getStoredUser();
      const role: AppUserRole = existing?.role || "customer";
      const updated: StoredAuthUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
        photoURL: fbUser.photoURL,
        role,
        providerId: fbUser.providerData[0]?.providerId || "google.com",
      };
      saveStoredUser(updated);
      onUserChange(updated);
    } else {
      // If Firebase says logged out and there was no persistent user
      // or if signout was called
      const current = getStoredUser();
      if (!current) {
        onUserChange(null);
      }
    }
  });
}
