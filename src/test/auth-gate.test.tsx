// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AUTH_STORAGE_KEY } from "@/lib/firebase";
import { ChooseRolePage } from "@/routes/choose-role";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: any) => config,
  useNavigate: () => vi.fn(),
  useRouter: () => ({ navigate: vi.fn() }),
  Outlet: () => <div data-testid="protected-content">Protected Content</div>,
}));

describe("Authentication barrier", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("blocks unauthenticated users and presents the Choose Role / Login screen", () => {
    // When no user is stored in localStorage
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();

    render(<ChooseRolePage />);

    // Screen displays Choose Your Role / Login screen
    expect(screen.getByText("Choose Your Role")).toBeDefined();
    expect(screen.queryByTestId("protected-content")).toBeNull();
  });
});
