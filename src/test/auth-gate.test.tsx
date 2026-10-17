import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getStoredUser,
  saveStoredUser,
  logOutUser,
  type StoredAuthUser,
  AUTH_STORAGE_KEY,
} from "@/lib/firebase";

describe("Authentication & GlobalAuthGate session handling", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("returns null when no session is in storage", () => {
    expect(getStoredUser()).toBeNull();
  });

  it("persists and retrieves user session from storage", () => {
    const mockUser: StoredAuthUser = {
      uid: "user_test_123",
      email: "haroon@example.com",
      displayName: "Haroon Rashid",
      photoURL: "https://example.com/avatar.jpg",
      role: "customer",
      providerId: "google.com",
      username: "haroon_dev",
      age: 26,
      gender: "Male",
    };

    saveStoredUser(mockUser);
    const retrieved = getStoredUser();

    expect(retrieved).not.toBeNull();
    expect(retrieved?.uid).toBe("user_test_123");
    expect(retrieved?.email).toBe("haroon@example.com");
    expect(retrieved?.role).toBe("customer");
  });

  it("logOutUser completely clears stored user and triggers auth reset", async () => {
    const mockUser: StoredAuthUser = {
      uid: "user_test_pro",
      email: "pro@example.com",
      displayName: "Pro Worker",
      photoURL: null,
      role: "provider",
      providerId: "google.com",
    };

    saveStoredUser(mockUser);
    expect(getStoredUser()).not.toBeNull();

    let customEventFired = false;
    let eventDetail: any = "unset";
    window.addEventListener("budgam_auth_change", (e: any) => {
      customEventFired = true;
      eventDetail = e.detail;
    });

    await logOutUser();

    expect(getStoredUser()).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(customEventFired).toBe(true);
    expect(eventDetail).toBeNull();
  });
});
