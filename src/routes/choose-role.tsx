import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { User, Wrench, Check, ChevronRight } from "lucide-react";

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

  const handleContinue = () => {
    if (selectedRole === "customer") {
      navigate({ to: "/" });
    } else {
      navigate({ to: "/pro" });
    }
  };

  return (
    <div className="mobile-app plain choose-role-screen">
      <main className="choose-role-container">
        {/* Top Illustration Header */}
        <div className="illustration-wrapper">
          <svg
            viewBox="0 0 320 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="role-illustration"
            aria-hidden="true"
          >
            {/* Soft Green Circular Backgrounds */}
            <circle cx="160" cy="120" r="100" fill="#E8F8F2" />
            <circle cx="95" cy="150" r="18" fill="#D2F0E5" />
            <circle cx="215" cy="135" r="12" fill="#D2F0E5" />

            {/* Decorative Gear Icons in Background */}
            <g transform="translate(210, 35) scale(1.1)" fill="#41B382">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path fillRule="evenodd" clipRule="evenodd" d="M10.1 2.2a2 2 0 013.8 0 8 8 0 011.8.8 2 2 0 012.7 2.7 8 8 0 01.8 1.8 2 2 0 010 3.8 8 8 0 01-.8 1.8 2 2 0 01-2.7 2.7 8 8 0 01-1.8.8 2 2 0 01-3.8 0 8 8 0 01-1.8-.8 2 2 0 01-2.7-2.7 8 8 0 01-.8-1.8 2 2 0 010-3.8 8 8 0 01.8-1.8 2 2 0 012.7-2.7 8 8 0 011.8-.8zM12 6a6 6 0 100 12 6 6 0 000-12z" />
            </g>
            <g transform="translate(195, 95) scale(0.7)" fill="#41B382">
              <circle cx="12" cy="12" r="8" stroke="#41B382" strokeWidth="4" />
            </g>
            <g transform="translate(230, 105) scale(0.85)" fill="#41B382">
              <circle cx="12" cy="12" r="8" stroke="#41B382" strokeWidth="4" />
            </g>

            {/* Decorative Pole Icon */}
            <path d="M95 142v16M90 148h10M92 144h6" stroke="#41B382" strokeWidth="3" strokeLinecap="round" />

            {/* Service Man Character */}
            {/* Cap */}
            <path d="M128 35c0-8 12-12 28-12 14 0 26 4 28 12v6h-56v-6z" fill="#0A8140" />
            <path d="M150 23c10 0 25 1 35 7l2 4h-37v-11z" fill="#0D9E50" />
            <ellipse cx="156" cy="23" rx="15" ry="4" fill="#0A8140" />

            {/* Head & Face */}
            <path d="M138 40c0 0 4 38 20 38s20-38 20-38v-5h-40v5z" fill="#FFC59E" />
            <path d="M132 42c0-8 6-15 22-15 18 0 24 7 24 15 0 0-3 12-3 18 0 10-9 18-21 18-12 0-21-8-21-18 0-6-1-18-1-18z" fill="#FFD2B2" />
            {/* Hair */}
            <path d="M132 40c-2-6 2-12 8-14 0 0 5 6 16 6 12 0 18-5 18-5 4 4 6 9 4 13-3-2-8-3-12-3-8 0-14 3-18 3-5 0-13 0-16 0z" fill="#221C19" />
            {/* Ears */}
            <circle cx="132" cy="50" r="4" fill="#FFC59E" />
            <circle cx="180" cy="50" r="4" fill="#FFC59E" />
            {/* Facial Features */}
            <ellipse cx="148" cy="48" rx="2" ry="2.5" fill="#221C19" />
            <ellipse cx="164" cy="48" rx="2" ry="2.5" fill="#221C19" />
            <path d="M145 43c2-2 5-2 7 0M161 43c2-2 5-2 7 0" stroke="#221C19" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M154 53c1 2 3 2 4 0" stroke="#E29D72" strokeWidth="2" strokeLinecap="round" />
            <path d="M149 59c4 4 14 4 18 0" stroke="#221C19" strokeWidth="2" strokeLinecap="round" />
            <path d="M151 60c3 2 10 2 14 0" fill="#FFFFFF" />

            {/* Neck & Body/Shirt */}
            <path d="M148 72h16v12h-16z" fill="#FFC59E" />
            <path d="M112 80c0 0 15-10 44-10s44 10 44 10l12 70h-112l12-70z" fill="#0D9E50" />

            {/* Overalls Straps & Details */}
            <path d="M133 80l4 40h-10l-4-40h10zM173 80l-4 40h10l4-40h-10z" fill="#0A8140" />
            {/* Buckles */}
            <rect x="125" y="96" width="8" height="6" rx="1" fill="#C5D0D6" />
            <rect x="167" y="96" width="8" height="6" rx="1" fill="#C5D0D6" />
            {/* Pocket */}
            <rect x="138" y="102" width="24" height="22" rx="3" fill="#0A8140" stroke="#0D9E50" strokeWidth="1.5" />

            {/* Arms */}
            <path d="M102 84c-12 20-18 40-10 60 4 10 18 12 24 2" stroke="#FFD2B2" strokeWidth="14" strokeLinecap="round" />
            <path d="M102 84c-12 20-18 40-10 60 4 10 18 12 24 2" stroke="#0D9E50" strokeWidth="14" strokeLinecap="round" strokeDasharray="30 100" />

            <path d="M210 84c10 18 15 36 8 55-4 10-14 12-20 4" stroke="#FFD2B2" strokeWidth="14" strokeLinecap="round" />
            <path d="M210 84c10 18 15 36 8 55-4 10-14 12-20 4" stroke="#0D9E50" strokeWidth="14" strokeLinecap="round" strokeDasharray="25 100" />

            {/* Toolbox */}
            <rect x="175" y="132" width="60" height="34" rx="4" fill="#1C3D32" />
            <rect x="175" y="132" width="60" height="8" rx="2" fill="#295748" />
            <rect x="187" y="134" width="6" height="4" fill="#0D9E50" />
            {/* Toolbox Handle */}
            <path d="M193 126h24v8h-24z" fill="none" stroke="#1C3D32" strokeWidth="4" strokeLinejoin="round" />
          </svg>
        </div>

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
