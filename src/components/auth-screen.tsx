import { useState } from "react";
import { User, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  signInWithGoogle,
  type AppUserRole,
  type StoredAuthUser,
} from "@/lib/firebase";

interface AuthScreenProps {
  role: AppUserRole;
  onSuccess: (user: StoredAuthUser) => void;
  onBack?: () => void;
}

export function AuthScreen({ role, onSuccess, onBack }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  // Google Sign-In via Firebase
  const handleGoogleSignIn = async () => {
    if (loadingGoogle) return;
    setLoadingGoogle(true);
    try {
      toast.info("Connecting to Google...", { duration: 2500 });
      const user = await signInWithGoogle(role);
      toast.success(`Welcome back, ${user.displayName || "there"}!`);
      onSuccess(user);
    } catch (error: any) {
      console.error("Google Sign-In error:", error);
      if (error?.code === "auth/popup-closed-by-user") {
        toast.info("Sign-in popup was closed.");
      } else if (error?.code === "auth/cancelled-popup-request") {
        // Ignored
      } else {
        toast.error(
          error?.message || "Google Sign-In failed. Please try again."
        );
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  // Email / Password submission
  const handleEmailSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailOrUser.trim() || !password.trim()) {
      toast.error("Please enter both username/email and password.");
      return;
    }

    setLoadingEmail(true);
    // User noted: only Google sign-in is setup currently in Firebase console
    setTimeout(() => {
      setLoadingEmail(false);
      toast.info(
        "Google Sign-In is active! Tap the (G) icon below to log in with your Google account.",
        { duration: 4500 }
      );
    }, 400);
  };

  const handleFingerprint = () => {
    toast.info(
      "Biometric fingerprint login is not enabled on this device. Please use Google Sign-In below."
    );
  };

  const handleFacebook = () => {
    toast.info(
      "Facebook sign-in is not configured yet. Please sign in with Google."
    );
  };

  const handleForgotPassword = () => {
    toast.info(
      "Password reset is available for registered email accounts. For now, please use Google Sign-In."
    );
  };

  return (
    <div className="mobile-app plain auth-screen-page">
      {/* Top Emerald Header */}
      <div className="auth-header-wrapper">
        {/* Status Bar simulation */}
        <div className="auth-status-bar" aria-hidden="true">
          <span className="auth-status-time">16:04</span>
          <div className="auth-status-icons">
            {/* Cellular bars */}
            <svg className="w-3.5 h-3" viewBox="0 0 17 12" fill="currentColor">
              <rect x="0" y="8" width="3" height="4" rx="0.5" />
              <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" />
              <rect x="9" y="3" width="3" height="9" rx="0.5" />
              <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
            </svg>
            {/* WiFi */}
            <svg className="w-3.5 h-3" viewBox="0 0 16 12" fill="currentColor">
              <path d="M8 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-4.95-3.46a7 7 0 0 1 9.9 0l-.7.7a6 6 0 0 0-8.5 0l-.7-.7zm-2.12-2.13a10 10 0 0 1 14.14 0l-.7.7a9 9 0 0 0-12.73 0l-.7-.7z" />
            </svg>
            {/* Battery */}
            <svg className="w-5 h-2.5" viewBox="0 0 24 12" fill="currentColor">
              <rect x="1" y="1" width="19" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <rect x="3" y="3" width="14" height="6" rx="1" />
              <path d="M22 4.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Back navigation button if available */}
        {onBack && (
          <button
            type="button"
            className="auth-back-btn"
            onClick={onBack}
            aria-label="Back to role selection"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs font-semibold">Change Role</span>
          </button>
        )}

        {/* Welcome Title */}
        <h1 className="auth-welcome-title">Welcome</h1>
      </div>

      {/* Main Card */}
      <main className="auth-card-sheet">
        <form onSubmit={handleEmailSubmit} className="auth-form-container">
          {/* Field 1: Username Or Email */}
          <div className="auth-field-group">
            <label className="auth-label" htmlFor="auth-username">
              Username Or Email
            </label>
            <div className="auth-pill-input-wrap">
              <User className="auth-input-icon" />
              <input
                id="auth-username"
                type="text"
                className="auth-pill-input"
                placeholder="example@example.com"
                value={emailOrUser}
                onChange={(e) => setEmailOrUser(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Field 2: Password */}
          <div className="auth-field-group">
            <label className="auth-label" htmlFor="auth-password">
              Password
            </label>
            <div className="auth-pill-input-wrap">
              <Lock className="auth-input-icon" />
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                className="auth-pill-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <Eye className="w-5 h-5 text-[#0EA363]" />
                ) : (
                  <EyeOff className="w-5 h-5 text-[#0EA363]" />
                )}
              </button>
            </div>
          </div>

          {/* Primary Action Button: Log In */}
          <div className="auth-action-center">
            <button
              type="submit"
              disabled={loadingEmail}
              className="auth-btn-primary"
            >
              {loadingEmail ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" />
              ) : mode === "login" ? (
                "Log In"
              ) : (
                "Sign Up"
              )}
            </button>
          </div>

          {/* Forgot Password link */}
          <div className="auth-action-center">
            <button
              type="button"
              className="auth-link-forgot"
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </button>
          </div>

          {/* Secondary Action Button: Sign Up */}
          <div className="auth-action-center">
            <button
              type="button"
              className="auth-btn-secondary"
              onClick={() => {
                if (mode === "login") {
                  setMode("signup");
                } else {
                  handleEmailSubmit();
                }
              }}
            >
              {mode === "login" ? "Sign Up" : "Log In"}
            </button>
          </div>

          {/* Use Fingerprint To Access */}
          <div className="auth-fingerprint-wrap">
            <button
              type="button"
              className="auth-fingerprint-btn"
              onClick={handleFingerprint}
            >
              Use <span className="auth-fingerprint-highlight">Fingerprint</span>{" "}
              To Access
            </button>
          </div>

          {/* Divider: or sign up with */}
          <p className="auth-divider-text">
            {mode === "login" ? "or sign up with" : "or log in with"}
          </p>

          {/* Social circular icons */}
          <div className="auth-social-row">
            {/* Facebook circle */}
            <button
              type="button"
              className="auth-social-circle"
              onClick={handleFacebook}
              aria-label="Sign in with Facebook"
            >
              <span className="auth-fb-letter">f</span>
            </button>

            {/* Google circle (Active with Firebase Google Sign-In) */}
            <button
              type="button"
              className={`auth-social-circle ${loadingGoogle ? "opacity-75 pointer-events-none" : ""}`}
              onClick={handleGoogleSignIn}
              aria-label="Sign in with Google"
              title="Sign in with Google"
            >
              {loadingGoogle ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#0EA363]" />
              ) : (
                <span className="auth-google-letter">G</span>
              )}
            </button>
          </div>

          {/* Bottom account toggle link */}
          <div className="auth-bottom-row">
            {mode === "login" ? (
              <p className="auth-bottom-text">
                Don't have an account?{" "}
                <button
                  type="button"
                  className="auth-bottom-highlight"
                  onClick={() => setMode("signup")}
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p className="auth-bottom-text">
                Already have an account?{" "}
                <button
                  type="button"
                  className="auth-bottom-highlight"
                  onClick={() => setMode("login")}
                >
                  Log In
                </button>
              </p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
