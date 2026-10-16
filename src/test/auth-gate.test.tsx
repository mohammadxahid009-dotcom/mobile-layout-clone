// @vitest-environment jsdom
import { render, screen, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  AUTH_STORAGE_KEY,
  logOutUser,
  saveStoredUser,
  type StoredAuthUser,
} from "@/lib/firebase";
import { ChooseRolePage } from "@/routes/choose-role";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: any) => config,
  useNavigate: () => vi.fn(),
  useRouter: () => ({ navigate: vi.fn() }),
  Outlet: () => <div data-testid="protected-content">Protected Content</div>,
}));

describe("Authentication barrier & Logout", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("blocks unauthenticated users and presents Screen #1 (Login page)", () => {
    // When no user is stored
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();

    render(<ChooseRolePage />);

    // Screen displays Login page
    expect(screen.getByText("Welcome")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Log In" })).toBeDefined();
    expect(screen.queryByTestId("protected-content")).toBeNull();
  });

  it("logOutUser cleanly wipes session and dispatches global auth reset event", async () => {
    const dummyUser: StoredAuthUser = {
      uid: "test-user-123",
      email: "test@example.com",
      displayName: "Test User",
      photoURL: null,
      role: "customer",
      providerId: "google.com",
    };
    saveStoredUser(dummyUser);
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).not.toBeNull();

    let eventFired = false;
    window.addEventListener("budgam_auth_change", (e: any) => {
      if (e.detail === null) eventFired = true;
    });

    await act(async () => {
      await logOutUser();
    });

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(eventFired).toBe(true);
  });
});
