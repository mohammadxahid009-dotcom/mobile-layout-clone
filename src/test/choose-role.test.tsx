// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChooseRolePage } from "@/routes/choose-role";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: any) => config,
  useNavigate: () => vi.fn(),
}));

describe("ChooseRolePage", () => {
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

  it("selects roles and invokes onRoleChosen callback on continue", () => {
    const onRoleChosen = vi.fn();
    render(<ChooseRolePage onRoleChosen={onRoleChosen} />);

    const customerBtn = screen.getByText("Non Professional").closest("button")!;
    fireEvent.click(customerBtn);

    const continueBtn = screen.getByText("Continue");
    fireEvent.click(continueBtn);

    expect(onRoleChosen).toHaveBeenCalledWith("customer");
  });
});
