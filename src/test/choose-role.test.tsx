// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChooseRolePage } from "@/routes/choose-role";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: any) => config,
  useNavigate: () => vi.fn(),
}));

describe("Pixel-perfect 3-step Auth & Onboarding flow", () => {
  it("renders Screen #1 (Login page) as the very first screen without a back button", () => {
    render(<ChooseRolePage />);

    // Screen #1 headers & form
    expect(screen.getByText("Welcome")).toBeDefined();
    expect(screen.getByText("Great to see you again!")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Log In" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Log In" })).toBeDefined();
    expect(
      screen.getByText("Welcome back! Please login to your account.")
    ).toBeDefined();
    expect(screen.getByPlaceholderText("example@example.com")).toBeDefined();
    expect(screen.getByText("Forgot Password?")).toBeDefined();
    expect(screen.getByText("or sign up with")).toBeDefined();
    expect(screen.getByText("f")).toBeDefined();
    expect(screen.getByText("G")).toBeDefined();
    expect(screen.getByText("Don't have an account?")).toBeDefined();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeDefined();

    // Verify NO back arrow button on Screen #1
    expect(screen.queryByLabelText("Back to details")).toBeNull();
  });

  it("transitions to Screen #2 (Role selection + Details) when clicking Sign Up", () => {
    render(<ChooseRolePage />);

    // Click Sign Up on Screen #1
    const signUpBtn = screen.getByRole("button", { name: "Sign Up" });
    fireEvent.click(signUpBtn);

    // Now on Screen #2: Role cards + Create Your Account + Username, Age, Gender
    expect(screen.getByText("Non Professional")).toBeDefined();
    expect(screen.getByText("Service Man")).toBeDefined();
    expect(screen.getByText("Create Your Account")).toBeDefined();
    expect(
      screen.getByText("Choose a username and add a few details to get started.")
    ).toBeDefined();
    expect(screen.getByPlaceholderText("Username")).toBeDefined();
    expect(screen.getByLabelText("Age")).toBeDefined();
    expect(screen.getByLabelText("Gender")).toBeDefined();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDefined();
    expect(screen.getByText("Already have an account?")).toBeDefined();
  });

  it("advances to Screen #3 (Sign Up with Back button) when details are entered and Continue is clicked", () => {
    render(<ChooseRolePage />);

    // Go to Screen #2
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    // Enter required details
    const usernameInput = screen.getByPlaceholderText("Username");
    fireEvent.change(usernameInput, { target: { value: "haroon99" } });

    const ageSelect = screen.getByLabelText("Age");
    fireEvent.change(ageSelect, { target: { value: "25" } });

    const genderSelect = screen.getByLabelText("Gender");
    fireEvent.change(genderSelect, { target: { value: "Male" } });

    // Click Continue
    const continueBtn = screen.getByRole("button", { name: "Continue" });
    fireEvent.click(continueBtn);

    // Now on Screen #3 (Image #3)
    expect(screen.getByRole("heading", { name: "Sign Up" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeDefined();
    expect(screen.getByText("Create your account to get started.")).toBeDefined();
    expect(screen.getByLabelText("Back to details")).toBeDefined();
    expect(screen.getByText("or log in with")).toBeDefined();
    expect(screen.getByText("f")).toBeDefined();
    expect(screen.getByText("G")).toBeDefined();

    // Clicking Back button returns to Screen #2 with details intact
    const backBtn = screen.getByLabelText("Back to details");
    fireEvent.click(backBtn);
    expect(screen.getByText("Create Your Account")).toBeDefined();
    expect(
      (screen.getByPlaceholderText("Username") as HTMLInputElement).value
    ).toBe("haroon99");
  });
});
