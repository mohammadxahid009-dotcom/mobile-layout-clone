import { AuthFlow, type AuthFlowStep } from "./auth-flow";
import type { AppUserRole, StoredAuthUser } from "@/lib/firebase";

export interface AuthScreenProps {
  role?: AppUserRole;
  initialStep?: AuthFlowStep;
  onSuccess: (user: StoredAuthUser) => void;
  onBack?: () => void;
}

export function AuthScreen({
  role = "provider",
  initialStep = "login",
  onSuccess,
}: AuthScreenProps) {
  return (
    <AuthFlow
      initialStep={initialStep}
      initialRole={role}
      onAuthSuccess={onSuccess}
    />
  );
}
