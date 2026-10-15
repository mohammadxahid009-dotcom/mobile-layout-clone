import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Check, ChevronRight } from "lucide-react";
import { AuthScreen } from "@/components/auth-screen";
import {
  getStoredUser,
  type AppUserRole,
  type StoredAuthUser,
} from "@/lib/firebase";

export const Route = createFileRoute("/choose-role")({
  head: () => ({
    meta: [
      { title: "Choose Your Role | Budgam Services" },
      {
        name: "description",
        content:
          "Select how you want to use the app as a Customer or Service Provider.",
      },
    ],
  }),
  component: ChooseRoleRouteComponent,
});

export type RoleOption = "customer" | "provider";

export function ChooseRolePage({
  onRoleChosen,
}: {
  onRoleChosen?: (role: RoleOption) => void;
}) {
  const [step, setStep] = useState<"role" | "auth">("role");
  const [selectedRole, setSelectedRole] = useState<RoleOption>("provider");
  const [slideDirection, setSlideDirection] = useState<"right" | "left">("right");
  const navigate = useNavigate();

  // If user is already logged in, respect their role
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

  const handleContinue = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selected_role", selectedRole);
    }
    // Smooth transition from role picker to auth screen
    setSlideDirection("right");
    setStep("auth");
  };

  const handleBackToRole = () => {
    setSlideDirection("left");
    setStep("role");
  };

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
    <div className="onboarding-slider-container">
      {step === "role" ? (
        <div
          key="step-role"
          className={`onboarding-screen-step ${
            slideDirection === "left" ? "onboarding-slide-in-left" : ""
          }`}
        >
          <div className="mobile-app plain choose-role-screen">
            {/* Soft curved gradient shapes in top-left and bottom-right corners */}
            <svg
              className="bg-curve-top-left"
              viewBox="0 0 280 250"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0 0 H240 C180 45 130 110 85 165 C45 210 20 235 0 250 Z"
                fill="url(#gradTL)"
              />
              <defs>
                <linearGradient id="gradTL" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#B4E7CA" stopOpacity="0.9" />
                  <stop offset="45%" stopColor="#D4F3E2" stopOpacity="0.6" />
                  <stop offset="85%" stopColor="#EAF8F0" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#F7FCF9" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            <svg
              className="bg-curve-bottom-right"
              viewBox="0 0 320 300"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M320 300 H80 C145 250 210 185 250 120 C290 65 310 25 320 0 Z"
                fill="url(#gradBR)"
              />
              <defs>
                <linearGradient id="gradBR" x1="100%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#B0E5C6" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#D2F2DF" stopOpacity="0.55" />
                  <stop offset="85%" stopColor="#EAF8F0" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#F7FCF9" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            <main className="choose-role-container">
              {/* Title & Subtitle */}
              <div className="role-text-header">
                <h1 className="role-title">Choose Your Role</h1>
                <p className="role-subtitle">
                  Tell us how you want to use the app. This helps us show you
                  the right features and opportunities.
                </p>
              </div>

              {/* Role Selection Cards */}
              <div
                className="role-cards-group"
                role="radiogroup"
                aria-label="Choose your role"
              >
                {/* Non Professional / Customer Card */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedRole === "customer"}
                  className={`role-card ${
                    selectedRole === "customer" ? "selected" : ""
                  }`}
                  onClick={() => setSelectedRole("customer")}
                >
                  <div className="role-card-icon-wrap customer-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="role-icon"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="7.2" r="4.3" />
                      <path d="M4.5 19.3c0-3.8 3.3-6.3 7.5-6.3s7.5 2.5 7.5 6.3c0 .4-.3.7-.7.7H5.2c-.4 0-.7-.3-.7-.7z" />
                    </svg>
                  </div>
                  <div className="role-card-content">
                    <h2 className="role-card-title">Non Professional</h2>
                    <p className="role-card-desc">
                      Book local services, get help from verified professionals.
                    </p>
                  </div>
                  <div className="role-card-indicator">
                    {selectedRole === "customer" ? (
                      <div className="check-badge">
                        <Check className="check-icon" strokeWidth={3.4} />
                      </div>
                    ) : (
                      <ChevronRight className="chevron-icon" strokeWidth={2.2} />
                    )}
                  </div>
                </button>

                {/* Service Man / Service Provider Card */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedRole === "provider"}
                  className={`role-card ${
                    selectedRole === "provider" ? "selected" : ""
                  }`}
                  onClick={() => setSelectedRole("provider")}
                >
                  <div className="role-card-icon-wrap provider-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                      className="role-icon"
                      aria-hidden="true"
                    >
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                  </div>
                  <div className="role-card-content">
                    <h2 className="role-card-title">Service Man</h2>
                    <p className="role-card-desc">
                      Offer your services, get bookings and grow your business.
                    </p>
                  </div>
                  <div className="role-card-indicator">
                    {selectedRole === "provider" ? (
                      <div className="check-badge">
                        <Check className="check-icon" strokeWidth={3.4} />
                      </div>
                    ) : (
                      <ChevronRight className="chevron-icon" strokeWidth={2.2} />
                    )}
                  </div>
                </button>
              </div>

              {/* Continue Action Button */}
              <div className="role-action-area">
                <button
                  type="button"
                  className="continue-btn"
                  onClick={handleContinue}
                >
                  Continue
                </button>
              </div>
            </main>
          </div>
        </div>
      ) : (
        <div
          key="step-auth"
          className="onboarding-screen-step onboarding-slide-in-right"
        >
          <AuthScreen
            role={selectedRole}
            onSuccess={handleAuthSuccess}
            onBack={handleBackToRole}
          />
        </div>
      )}
    </div>
  );
}

function ChooseRoleRouteComponent() {
  return <ChooseRolePage />;
}
