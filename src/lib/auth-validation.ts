/**
 * Security, sanitization, and input validation utilities for authentication & user profiles.
 * Protects against SQL/NoSQL injection, script tags, abnormal lengths, and invalid payloads.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Basic string sanitization: removes control characters and dangerous formatting.
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // remove control chars
    .replace(/[<>]/g, "") // strip html brackets
    .trim();
}

/**
 * Validates and normalizes email format.
 */
export function validateEmail(email: unknown): ValidationResult {
  const sanitized = sanitizeText(email).toLowerCase();
  if (!sanitized) {
    return { valid: false, error: "Email address is required." };
  }
  // Standard RFC 5322 regex pattern check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(sanitized) || sanitized.length > 254) {
    return { valid: false, error: "Please enter a valid email address." };
  }
  return { valid: true, sanitized };
}

/**
 * Validates password strength & security.
 * Enforces minimum length to mitigate brute force & credential stuffing.
 */
export function validatePassword(password: unknown): ValidationResult {
  if (typeof password !== "string" || !password) {
    return { valid: false, error: "Password is required." };
  }
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long." };
  }
  if (password.length > 128) {
    return { valid: false, error: "Password cannot exceed 128 characters." };
  }
  return { valid: true, sanitized: password };
}

/**
 * Validates usernames: alphanumeric, underscores, dots, hyphens (3-30 chars).
 * Prevents directory traversal, script injection, and query syntax tampering.
 */
export function validateUsername(username: unknown): ValidationResult {
  const sanitized = sanitizeText(username);
  if (!sanitized) {
    return { valid: false, error: "Username is required." };
  }
  const usernameRegex = /^[a-zA-Z0-9._-]{3,30}$/;
  if (!usernameRegex.test(sanitized)) {
    return {
      valid: false,
      error: "Username must be 3-30 characters and contain only letters, numbers, dots, hyphens, or underscores.",
    };
  }
  return { valid: true, sanitized };
}

/**
 * Validates phone numbers (standard international / local digits format).
 */
export function validatePhone(phone: unknown): ValidationResult {
  if (!phone || typeof phone !== "string") {
    return { valid: true, sanitized: "" }; // Optional
  }
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  if (!phoneRegex.test(cleaned)) {
    return { valid: false, error: "Please enter a valid phone number." };
  }
  return { valid: true, sanitized: cleaned };
}

/**
 * Validates age between 18 and 100.
 */
export function validateAge(age: unknown): ValidationResult {
  if (age === undefined || age === null || age === "") {
    return { valid: true, sanitized: "" };
  }
  const num = Number(age);
  if (isNaN(num) || num < 18 || num > 100) {
    return { valid: false, error: "Age must be between 18 and 100." };
  }
  return { valid: true, sanitized: String(num) };
}

/**
 * Friendly translation of Firebase Auth error codes.
 */
export function formatFirebaseAuthError(error: any): string {
  const code = error?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "The email address is invalid.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Please log in.";
    case "auth/weak-password":
      return "Password is too weak. Please choose a stronger password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes before trying again.";
    case "auth/network-request-failed":
      return "Network connection issue. Please check your internet connection.";
    case "auth/popup-closed-by-user":
      return "Sign in popup was closed.";
    default:
      return error?.message || "An unexpected error occurred. Please try again.";
  }
}
