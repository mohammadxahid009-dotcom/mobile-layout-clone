// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChooseRolePage } from "@/routes/choose-role";
import { AuthScreen } from "@/components/auth-screen";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: any) => config,
  useNavigate: () => vi.fn(),
}));

describe("ChooseRolePage & Auth flow", () => {
  it("renders role options and headings correctly", () => {
    render(<ChooseRolePage />);

    expect(screen.getByText("Choose Your Role")).toBeDefined();
    expect(
      screen.getByText(
        "Tell us how you want to use the app. This helps us show you the right features and opportunities."
      )
    ).toBeDefined();
    expect(screen.getByText("Non Professional")).toBeDefined();
    expect(screen.getByText("Service Man")).toBeDefined();
    expect(screen.getByText("Continue")).toBeDefined();
  });

  it("advances smoothly to the Welcome / Login screen on Continue", () => {
    render(<ChooseRolePage />);

    const customerBtn = screen.getByText("Non Professional").closest("button")!;
    fireEvent.click(customerBtn);

    const continueBtn = screen.getByText("Continue");
    fireEvent.click(continueBtn);

    // After clicking Continue, user sees the Welcome / Login screen matching the design
    expect(screen.getByText("Welcome")).toBeDefined();
    expect(screen.getByText("Username Or Email")).toBeDefined();
    expect(screen.getByText("Password")).toBeDefined();
    expect(screen.getByText("Log In")).toBeDefined();
    expect(screen.getAllByText("Sign Up").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("or sign up with")).toBeDefined();
    expect(screen.getByText("Change Role")).toBeDefined();
  });

  it("renders AuthScreen with required fields and social options", () => {
    const onSuccess = vi.fn();
    render(<AuthScreen role="customer" onSuccess={onSuccess} />);

    expect(screen.getByText("Welcome")).toBeDefined();
    expect(screen.getByText("Username Or Email")).toBeDefined();
    expect(screen.getByText("Password")).toBeDefined();
    expect(screen.getByText("Log In")).toBeDefined();
    expect(screen.getAllByText("Sign Up").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Forgot Password?")).toBeDefined();
    expect(screen.getByText("Fingerprint")).toBeDefined();
  });
});
