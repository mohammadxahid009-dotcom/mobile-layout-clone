import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
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
import {
  validateEmail,
  validatePassword,
  validateUsername,
  validatePhone,
  validateAge,
  sanitizeText,
} from "./auth-validation";

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

export interface UserProfileDetails {
  role: AppUserRole;
  displayName?: string | null;
  username?: string;
  phone?: string;
  age?: string | number;
  gender?: string;
}

export interface StoredAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: AppUserRole;
  providerId: string;
  username?: string;
  phone?: string;
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
 * Persist or update user document in Firestore database with input sanitization.
 * Saves username, age, gender, phone, email, and role securely under `/users/{uid}`.
 */
export async function syncUserToFirestore(
  fbUser: FirebaseUser,
  details: UserProfileDetails,
  required = false
): Promise<void> {
  try {
    const userDocRef = doc(db, "users", fbUser.uid);

    // Sanitize fields before writing to Firestore
    const safeUsername = details.username ? sanitizeText(details.username) : undefined;
    const safePhone = details.phone ? sanitizeText(details.phone) : undefined;
    const safeGender = details.gender ? sanitizeText(details.gender) : undefined;
    const safeAge = details.age !== undefined && details.age !== "" ? String(details.age) : undefined;
    const safeDisplayName = details.displayName ? sanitizeText(details.displayName) : undefined;

    const dataToSave: Record<string, any> = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: safeDisplayName || safeUsername || fbUser.displayName || "User",
      photoURL: fbUser.photoURL || null,
      role: details.role,
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (safeUsername) dataToSave.username = safeUsername;
    if (safePhone) dataToSave.phone = safePhone;
    if (safeAge) dataToSave.age = safeAge;
    if (safeGender) dataToSave.gender = safeGender;

    // Use setDoc with merge to avoid overwriting existing properties
    await setDoc(userDocRef, dataToSave, { merge: true });
  } catch (error) {
    // Firestore rules might restrict if user is unauthenticated or rules misconfigured
    console.warn("Could not sync user to Firestore database:", error);
    if (required) throw error;
  }
}

/**
 * Fetch profile data from Firestore for a given UID
 */
export async function fetchUserFromFirestore(uid: string): Promise<Record<string, any> | null> {
  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (userSnap.exists()) {
      return userSnap.data();
    }
  } catch (err) {
    console.warn("Could not fetch user profile from Firestore:", err);
  }
  return null;
}

/**
 * Sign Up with Email and Password.
 * Validates credentials, creates Firebase Auth account, stores profile in Firestore,
 * updates Auth display name, and initiates persistent session.
 */
export async function signUpWithEmail(params: {
  email: string;
  password: string;
  username: string;
  displayName?: string;
  role: AppUserRole;
  phone?: string;
  age?: string | number;
  gender?: string;
}): Promise<StoredAuthUser> {
  // Validate and sanitize inputs strictly
  const emailVal = validateEmail(params.email);
  if (!emailVal.valid) throw new Error(emailVal.error);

  const pwVal = validatePassword(params.password);
  if (!pwVal.valid) throw new Error(pwVal.error);

  const userVal = validateUsername(params.username);
  if (!userVal.valid) throw new Error(userVal.error);

  const phoneVal = validatePhone(params.phone);
  if (!phoneVal.valid) throw new Error(phoneVal.error);

  const ageVal = validateAge(params.age);
  if (!ageVal.valid) throw new Error(ageVal.error);

  const cleanRole: AppUserRole = params.role === "provider" ? "provider" : "customer";
  const cleanUsername = userVal.sanitized!;
  const cleanPhone = phoneVal.sanitized || undefined;
  const cleanAge = ageVal.sanitized || undefined;
  const cleanGender = params.gender ? sanitizeText(params.gender) : undefined;

  // Create user in Firebase Auth
  const cred = await createUserWithEmailAndPassword(auth, emailVal.sanitized!, params.password);
  const fbUser = cred.user;

  // Update Firebase Auth profile displayName
  try {
    await updateProfile(fbUser, { displayName: cleanUsername });
  } catch {
    // non-fatal
  }

  // Persist all user details into Firestore database under /users/{uid}
  await syncUserToFirestore(fbUser, {
    role: cleanRole,
    displayName: params.displayName ? sanitizeText(params.displayName) : cleanUsername,
    username: cleanUsername,
    phone: cleanPhone,
    age: cleanAge,
    gender: cleanGender,
  }, true);

  const storedUser: StoredAuthUser = {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: params.displayName ? sanitizeText(params.displayName) : cleanUsername,
    photoURL: fbUser.photoURL || null,
    role: cleanRole,
    providerId: "password",
    username: cleanUsername,
    phone: cleanPhone,
    age: cleanAge,
    gender: cleanGender,
  };

  saveStoredUser(storedUser);
  notifyAuthListeners(storedUser);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("budgam_auth_change", { detail: storedUser }));
  }

  return storedUser;
}

/**
 * Sign In with Email and Password.
 * Resolves user profile and role from Firestore, then sets active persistent session.
 */
export async function signInWithEmail(emailInput: string, passwordInput: string): Promise<StoredAuthUser> {
  const emailVal = validateEmail(emailInput);
  if (!emailVal.valid) throw new Error(emailVal.error);

  const pwVal = validatePassword(passwordInput);
  if (!pwVal.valid) throw new Error(pwVal.error);

  const cred = await signInWithEmailAndPassword(auth, emailVal.sanitized!, passwordInput);
  const fbUser = cred.user;

  // Read saved profile and role from Firestore
  let resolvedRole: AppUserRole = "customer";
  let resolvedUsername: string | undefined = undefined;
  let resolvedPhone: string | undefined = undefined;
  let resolvedAge: string | number | undefined = undefined;
  let resolvedGender: string | undefined = undefined;

  const profile = await fetchUserFromFirestore(fbUser.uid);
  if (profile) {
    if (profile.role === "provider" || profile.role === "customer") {
      resolvedRole = profile.role;
    }
    resolvedUsername = profile.username;
    resolvedPhone = profile.phone;
    resolvedAge = profile.age;
    resolvedGender = profile.gender;
  }

  const storedUser: StoredAuthUser = {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName:
      resolvedUsername ||
      fbUser.displayName ||
      fbUser.email?.split("@")[0] ||
      "User",
    photoURL: fbUser.photoURL || null,
    role: resolvedRole,
    providerId: "password",
    username: resolvedUsername,
    phone: resolvedPhone,
    age: resolvedAge,
    gender: resolvedGender,
  };

  saveStoredUser(storedUser);
  notifyAuthListeners(storedUser);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("budgam_auth_change", { detail: storedUser }));
  }

  // Update last login timestamp in Firestore
  syncUserToFirestore(fbUser, {
    role: resolvedRole,
    displayName: storedUser.displayName,
    username: resolvedUsername,
    phone: resolvedPhone,
    age: resolvedAge,
    gender: resolvedGender,
  }).catch(() => {});

  return storedUser;
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(
  options: {
    targetRole?: AppUserRole;
    username?: string;
    phone?: string;
    age?: string | number;
    gender?: string;
  } = {}
): Promise<StoredAuthUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;

  // Check if user record already exists in Firestore
  let resolvedRole: AppUserRole = options.targetRole || "customer";
  let resolvedUsername: string | undefined = options.username;
  let resolvedPhone: string | undefined = options.phone;
  let resolvedAge: string | number | undefined = options.age;
  let resolvedGender: string | undefined = options.gender;

  const profile = await fetchUserFromFirestore(fbUser.uid);
  if (profile) {
    if (profile.role && !options.targetRole) {
      resolvedRole = profile.role as AppUserRole;
    }
    if (profile.username && !resolvedUsername) {
      resolvedUsername = profile.username;
    }
    if (profile.phone && !resolvedPhone) {
      resolvedPhone = profile.phone;
    }
    if (profile.age && !resolvedAge) {
      resolvedAge = profile.age;
    }
    if (profile.gender && !resolvedGender) {
      resolvedGender = profile.gender;
    }
  }

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
    phone: resolvedPhone,
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
    phone: resolvedPhone,
    age: resolvedAge,
    gender: resolvedGender,
  }).catch(() => {});

  return storedUser;
}

/** Send a Firebase password reset email to an existing account. */
export async function sendPasswordReset(emailInput: string): Promise<void> {
  const emailVal = validateEmail(emailInput);
  if (!emailVal.valid) throw new Error(emailVal.error);
  await sendPasswordResetEmail(auth, emailVal.sanitized!);
}

/**
 * Sign out user cleanly and immediately notify all app listeners
 */
export async function logOutUser(): Promise<void> {
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
  const unsubInternal = subscribeAuth(onUserChange);

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
        phone: existing?.phone,
        age: existing?.age,
        gender: existing?.gender,
      };
      saveStoredUser(updated);
      onUserChange(updated);
      notifyAuthListeners(updated);
    } else {
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
