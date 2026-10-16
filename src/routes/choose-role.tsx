import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthFlow, type AuthFlowStep } from "@/components/auth-flow";
import {
  getStoredUser,
  type AppUserRole,
  type StoredAuthUser,
} from "@/lib/firebase";

export const Route = createFileRoute("/choose-role")({
  head: () => ({
    meta: [
      { title: "Log In & Sign Up | Budgam Services" },
      {
        name: "description",
        content:
          "Log in or create your account to access trusted local services in Budgam.",
      },
    ],
  }),
  component: ChooseRoleRouteComponent,
});

export type RoleOption = "customer" | "provider";

export function ChooseRolePage({
  initialStep = "login",
  onRoleChosen,
}: {
  initialStep?: AuthFlowStep;
  onRoleChosen?: (role: RoleOption) => void;
}) {
  const navigate = useNavigate();

  // If already authenticated, redirect to appropriate destination
  useEffect(() => {
    const existing = getStoredUser();
    if (existing) {
      if (onRoleChosen) {
        onRoleChosen(existing.role);
      } else {
        if (existing.role === "customer") {
          navigate({ to: "/" });
        } else {
          navigate({ to: "/pro" });
        }
      }
    }
  }, [navigate, onRoleChosen]);

  const handleAuthSuccess = (user: StoredAuthUser) => {
    if (onRoleChosen) {
      onRoleChosen(user.role);
    } else {
      if (user.role === "customer") {
        navigate({ to: "/" });
      } else {
        navigate({ to: "/pro" });
      }
    }
  };

  return (
    <AuthFlow
      initialStep={initialStep}
      onAuthSuccess={handleAuthSuccess}
    />
  );
}

function ChooseRoleRouteComponent() {
  return <ChooseRolePage />;
}
