import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validatePassword,
  validateUsername,
  validatePhone,
  validateAge,
  sanitizeText,
  formatFirebaseAuthError,
} from "../lib/auth-validation";

describe("auth-validation security helpers", () => {
  it("sanitizes malicious text and drops html tags / control characters", () => {
    const malicious = "<script>alert('xss')</script>John Doe\u0000";
    const cleaned = sanitizeText(malicious);
    expect(cleaned).toBe("scriptalert('xss')/scriptJohn Doe");
    expect(cleaned.includes("<")).toBe(false);
    expect(cleaned.includes(">")).toBe(false);
  });

  it("validates legitimate and catches invalid emails", () => {
    expect(validateEmail("user@example.com").valid).toBe(true);
    expect(validateEmail("admin' OR '1'='1").valid).toBe(false);
    expect(validateEmail("not-an-email").valid).toBe(false);
    expect(validateEmail("").valid).toBe(false);
  });

  it("enforces strong password length", () => {
    expect(validatePassword("short").valid).toBe(false);
    expect(validatePassword("validPassword123").valid).toBe(true);
    expect(validatePassword("").valid).toBe(false);
  });

  it("validates safe usernames against injection & invalid chars", () => {
    expect(validateUsername("haroon_01").valid).toBe(true);
    expect(validateUsername("ro").valid).toBe(false); // too short
    expect(validateUsername("admin'; DROP TABLE users;--").valid).toBe(false);
    expect(validateUsername("../../../etc/passwd").valid).toBe(false);
  });

  it("validates age constraints", () => {
    expect(validateAge("25").valid).toBe(true);
    expect(validateAge("15").valid).toBe(false); // below 18
    expect(validateAge("150").valid).toBe(false); // unrealistic
  });

  it("maps Firebase error codes to user-friendly messages", () => {
    expect(formatFirebaseAuthError({ code: "auth/invalid-credential" })).toBe(
      "Invalid email or password. Please try again."
    );
    expect(formatFirebaseAuthError({ code: "auth/email-already-in-use" })).toBe(
      "An account with this email already exists. Please log in."
    );
  });
});
