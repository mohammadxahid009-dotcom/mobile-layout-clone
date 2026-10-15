import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { User, Wrench, Check, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/choose-role")({
  head: () => ({
    meta: [
      { title: "Choose Your Role | Budgam Services" },
      { name: "description", content: "Select how you want to use the app as a Customer or Service Provider." },
    ],
  }),
  component: ChooseRolePage,
});

type RoleOption = "customer" | "provider";

function ChooseRolePage() {
  const [selectedRole, setSelectedRole] = useState<RoleOption>("provider");
  const navigate = useNavigate();
  const { setLoggedIn } = useStore();

  const handleContinue = () => {
    setLoggedIn(true);
    if (selectedRole === "customer") {
      navigate({ to: "/" });
    } else {
      navigate({ to: "/pro" });
    }
  };

  return (
    <div className="mobile-app plain choose-role-screen">
      {/* Decorative ambient background blur shapes for soft corner gradients */}
      <div className="bg-corner-top-left" aria-hidden="true" />
      <div className="bg-corner-bottom-right" aria-hidden="true" />

      <main className="choose-role-container">
        {/* Title & Subtitle */}
        <div className="role-text-header">
          <h1 className="role-title">Choose Your Role</h1>
          <p className="role-subtitle">
            Tell us how you want to use the app. This helps us show you the right features and opportunities.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="role-cards-group" role="radiogroup" aria-label="Choose your role">
          {/* Non Professional / Customer Card */}
          <button
            type="button"
            role="radio"
            aria-checked={selectedRole === "customer"}
            className={`role-card ${selectedRole === "customer" ? "selected" : ""}`}
            onClick={() => setSelectedRole("customer")}
          >
            <div className="role-card-icon-wrap customer-icon">
              <User className="role-icon" />
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
                  <Check className="check-icon" />
                </div>
              ) : (
                <ChevronRight className="chevron-icon" />
              )}
            </div>
          </button>

          {/* Service Man / Service Provider Card */}
          <button
            type="button"
            role="radio"
            aria-checked={selectedRole === "provider"}
            className={`role-card ${selectedRole === "provider" ? "selected" : ""}`}
            onClick={() => setSelectedRole("provider")}
          >
            <div className="role-card-icon-wrap provider-icon">
              <Wrench className="role-icon" />
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
                  <Check className="check-icon" />
                </div>
              ) : (
                <ChevronRight className="chevron-icon" />
              )}
            </div>
          </button>
        </div>

        {/* Continue Action Button */}
        <div className="role-action-area">
          <button type="button" className="continue-btn" onClick={handleContinue}>
            Continue
          </button>
        </div>
      </main>
    </div>
  );
}
