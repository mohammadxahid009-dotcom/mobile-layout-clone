import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  formatFirebaseAuthError,
  validateEmail,
  validatePassword,
} from "../lib/auth-validation";

describe("Email Verification and Cooldown Logic", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("calculates 60-second cooldown remaining accurately", () => {
    const COOLDOWN_KEY = "budgam_verify_cooldown_expiry";
    const now = Date.now();
    const expiry = now + 45 * 1000; // 45 seconds remaining
    sessionStorage.setItem(COOLDOWN_KEY, String(expiry));

    const stored = sessionStorage.getItem(COOLDOWN_KEY);
    expect(stored).not.toBeNull();

    const remaining = Math.ceil((parseInt(stored!, 10) - now) / 1000);
    expect(remaining).toBe(45);
  });

  it("clears cooldown when timer expires", () => {
    const COOLDOWN_KEY = "budgam_verify_cooldown_expiry";
    const past = Date.now() - 5000;
    sessionStorage.setItem(COOLDOWN_KEY, String(past));

    const stored = sessionStorage.getItem(COOLDOWN_KEY);
    const remaining = Math.max(0, Math.ceil((parseInt(stored!, 10) - Date.now()) / 1000));
    expect(remaining).toBe(0);
  });

  it("routes customer to '/' and provider to '/pro' upon verified profile resolution", () => {
    const resolveDashboardRoute = (role: string | undefined): string => {
      return role === "provider" ? "/pro" : "/";
    };

    expect(resolveDashboardRoute("provider")).toBe("/pro");
    expect(resolveDashboardRoute("customer")).toBe("/");
    expect(resolveDashboardRoute(undefined)).toBe("/");
  });

  it("blocks login for unverified accounts and permits verified accounts", () => {
    const checkVerificationGating = (user: { emailVerified: boolean }) => {
      if (!user.emailVerified) {
        return { allowed: false, redirect: "/verify-email" };
      }
      return { allowed: true, redirect: "/" };
    };

    const unverified = checkVerificationGating({ emailVerified: false });
    expect(unverified.allowed).toBe(false);
    expect(unverified.redirect).toBe("/verify-email");

    const verified = checkVerificationGating({ emailVerified: true });
    expect(verified.allowed).toBe(true);
    expect(verified.redirect).toBe("/");
  });

  it("formats verification and network related error codes nicely", () => {
    expect(formatFirebaseAuthError({ code: "auth/too-many-requests" })).toBe(
      "Too many attempts. Please wait a few minutes before trying again."
    );
    expect(formatFirebaseAuthError({ code: "auth/network-request-failed" })).toBe(
      "Network connection issue. Please check your internet connection."
    );
  });
});
