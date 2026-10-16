import { useState } from "react";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Calendar,
  ChevronDown,
  Check,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  signInWithGoogle,
  type AppUserRole,
  type StoredAuthUser,
} from "@/lib/firebase";

export type AuthFlowStep = "login" | "signup_details" | "signup_auth";

interface AuthFlowProps {
  initialStep?: AuthFlowStep;
  initialRole?: AppUserRole;
  onAuthSuccess: (user: StoredAuthUser) => void;
}

export function AuthFlow({
  initialStep = "login",
  initialRole = "provider",
  onAuthSuccess,
}: AuthFlowProps) {
  const [step, setStep] = useState<AuthFlowStep>(initialStep);
  const [role, setRole] = useState<AppUserRole>(initialRole);
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const handleGoogleAuth = async (isSignUp: boolean) => {
    if (loadingGoogle) return;
    setLoadingGoogle(true);
    try {
      toast.info("Connecting to Google...", { duration: 2000 });
      const user = await signInWithGoogle({
        targetRole: role,
        username: isSignUp ? username.trim() : undefined,
        age: isSignUp ? age : undefined,
        gender: isSignUp ? gender : undefined,
      });
      toast.success(
        `Welcome ${isSignUp ? "to Budgam Services" : "back"}, ${user.displayName || "there"}!`
      );
      onAuthSuccess(user);
    } catch (error: any) {
      console.error("Google Auth error:", error);
      if (
        error?.code === "auth/popup-closed-by-user" ||
        error?.code === "auth/cancelled-popup-request"
      ) {
        toast.info("Sign-in popup was closed.");
      } else {
        toast.error(error?.message || "Google Authentication failed. Please try again.");
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleEmailSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }
    setLoadingSubmit(true);
    setTimeout(() => {
      setLoadingSubmit(false);
      toast.info(
        "Google Sign-In is active! Tap the (G) icon below to continue with your Google account.",
        { duration: 4500 }
      );
    }, 350);
  };

  const handleContinueDetails = () => {
    if (!username.trim()) return toast.error("Please enter your username to continue.");
    if (!age) return toast.error("Please select your age to continue.");
    if (!gender) return toast.error("Please select your gender to continue.");
    setStep("signup_auth");
  };

  const handleFacebook = () =>
    toast.info("Facebook sign-in is coming soon! Please sign in with Google.");
  const handleForgotPassword = () =>
    toast.info("Password reset is available for registered email accounts. For now, please use Google Sign-In.");

  const SocialButtons = ({ isSignUp }: { isSignUp: boolean }) => (
    <>
      <p className="auth-divider-center-text">{isSignUp ? "or log in with" : "or sign up with"}</p>
      <div className="auth-social-circles-row">
        <button type="button" className="auth-social-outline-btn" onClick={handleFacebook} aria-label={`${isSignUp ? "Sign up" : "Log in"} with Facebook`}>
          <span className="auth-fb-glyph">f</span>
        </button>
        <button
          type="button"
          className={`auth-social-outline-btn ${loadingGoogle ? "opacity-75 pointer-events-none" : ""}`}
          onClick={() => handleGoogleAuth(isSignUp)}
          aria-label={`${isSignUp ? "Sign up" : "Log in"} with Google`}
          title={`${isSignUp ? "Sign up" : "Log in"} with Google`}
        >
          {loadingGoogle ? <Loader2 className="w-5 h-5 animate-spin text-[#078B51]" /> : <span className="auth-google-glyph">G</span>}
        </button>
      </div>
    </>
  );

  const AccountToggle = ({ isSignUp }: { isSignUp: boolean }) => (
    <div className="auth-bottom-switch-row">
      <span className="auth-switch-label">{isSignUp ? "Already have an account? " : "Don't have an account? "}</span>
      <button
        type="button"
        className="auth-switch-action-green"
        onClick={() => setStep(isSignUp ? "login" : "signup_details")}
      >
        {isSignUp ? "Log In" : "Sign Up"}
      </button>
    </div>
  );

  const PasswordField = () => (
    <div className="auth-pill-field">
      <Lock className="auth-field-icon" />
      <input
        type={showPassword ? "text" : "password"}
        className="auth-field-input"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete={step === "login" ? "current-password" : "new-password"}
        aria-label="Password"
      />
      <button
        type="button"
        className="auth-eye-toggle"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <Eye className="w-5 h-5 text-[#078B51]" /> : <EyeOff className="w-5 h-5 text-[#078B51]" />}
      </button>
    </div>
  );

  const Header = ({ showBack }: { showBack?: boolean }) => (
    <div className="auth-mint-header">
      <div className="auth-header-radial-tl" aria-hidden="true" />
      <div className="auth-header-radial-br" aria-hidden="true" />
      {showBack && (
        <div className="auth-header-nav-bar">
          <button type="button" className="auth-circular-back-btn" onClick={() => setStep("signup_details")} aria-label="Back to details">
            <ArrowLeft className="w-5 h-5 text-[#013421]" />
          </button>
        </div>
      )}
      <div className="auth-header-text-block">
        <h1 className="auth-title-large">Welcome</h1>
        <p className="auth-subtitle-text">Great to see you again!</p>
      </div>
    </div>
  );

  return (
    <div className="auth-flow-wrapper">
      {(step === "login" || step === "signup_auth") && (
        <div key={step} className="auth-screen-container auth-fade-in">
          <Header showBack={step === "signup_auth"} />
          <main className="auth-white-sheet">
            <div className="auth-sheet-content">
              <h2 className="auth-sheet-title">{step === "login" ? "Log In" : "Sign Up"}</h2>
              <p className="auth-sheet-subtitle">
                {step === "login" ? "Welcome back! Please login to your account." : "Create your account to get started."}
              </p>
              <form onSubmit={handleEmailSubmit} className="auth-sheet-form">
                <div className="auth-pill-field">
                  <User className="auth-field-icon" />
                  <input
                    type="email"
                    className="auth-field-input"
                    placeholder="example@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    aria-label="Email address"
                  />
                </div>
                <PasswordField />
                <button type="submit" disabled={loadingSubmit} className="auth-btn-solid-green">
                  {loadingSubmit ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : step === "login" ? "Log In" : "Sign Up"}
                </button>
                <div className="text-center pt-1">
                  <button type="button" className="auth-link-forgot-green" onClick={handleForgotPassword}>Forgot Password?</button>
                </div>
                <SocialButtons isSignUp={step === "signup_auth"} />
                <AccountToggle isSignUp={step === "signup_auth"} />
              </form>
            </div>
          </main>
        </div>
      )}

      {step === "signup_details" && (
        <div key="signup-details" className="auth-screen-container auth-details-bg auth-slide-in-right">
          <div className="auth-header-radial-tl" aria-hidden="true" />
          <div className="auth-header-radial-br" aria-hidden="true" />
          <div className="auth-details-content-wrap">
            <Header />
            <div className="role-selection-group" role="radiogroup" aria-label="Select role">
              <button
                type="button"
                role="radio"
                aria-checked={role === "customer"}
                className={`role-option-box ${role === "customer" ? "selected" : ""}`}
                onClick={() => setRole("customer")}
              >
                <div className="role-avatar-circle customer-tint">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                    <circle cx="12" cy="7.2" r="4.3" />
                    <path d="M4.5 19.3c0-3.8 3.3-6.3 7.5-6.3s7.5 2.5 7.5 6.3c0 .4-.3.7-.7.7H5.2c-.4 0-.7-.3-.7-.7z" />
                  </svg>
                </div>
                <div className="role-box-copy">
                  <h3 className="role-box-heading">Non Professional</h3>
                  <p className="role-box-sub">Book local services, get help from verified professionals.</p>
                </div>
                <div className="role-box-action">
                  {role === "customer" ? <div className="role-check-bubble"><Check className="w-4 h-4 text-white" strokeWidth={3.5} /></div> : <ChevronRight className="w-5 h-5 text-[#2C5240]/60" />}
                </div>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={role === "provider"}
                className={`role-option-box ${role === "provider" ? "selected" : ""}`}
                onClick={() => setRole("provider")}
              >
                <div className="role-avatar-circle provider-solid">
                  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                </div>
                <div className="role-box-copy">
                  <h3 className="role-box-heading">Service Man</h3>
                  <p className="role-box-sub">Offer your services, get bookings and grow your business.</p>
                </div>
                <div className="role-box-action">
                  {role === "provider" ? <div className="role-check-bubble"><Check className="w-4 h-4 text-white" strokeWidth={3.5} /></div> : <ChevronRight className="w-5 h-5 text-[#2C5240]/60" />}
                </div>
              </button>
            </div>
            <div className="auth-details-section">
              <h2 className="auth-details-title">Create Your Account</h2>
              <p className="auth-details-subtitle">Choose a username and add a few details to get started.</p>
              <div className="auth-details-fields-stack">
                <div className="auth-pill-field-divided">
                  <User className="auth-field-icon" />
                  <div className="auth-field-divider" />
                  <input type="text" className="auth-field-input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} aria-label="Username" />
                </div>
                <div className="auth-pill-field-divided">
                  <Calendar className="auth-field-icon" />
                  <div className="auth-field-divider" />
                  <select className="auth-field-select" value={age} onChange={(e) => setAge(e.target.value)} aria-label="Age">
                    <option value="" disabled>Age</option>
                    {Array.from({ length: 83 }, (_, i) => i + 18).map((num) => <option key={num} value={num}>{num}</option>)}
                  </select>
                  <ChevronDown className="auth-select-arrow" />
                </div>
                <div className="auth-pill-field-divided">
                  <svg viewBox="0 0 24 24" className="auth-field-icon" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="10" cy="14" r="5" /><path d="M19 5l-5.4 5.4" /><path d="M15 5h4v4" />
                  </svg>
                  <div className="auth-field-divider" />
                  <select className="auth-field-select" value={gender} onChange={(e) => setGender(e.target.value)} aria-label="Gender">
                    <option value="" disabled>Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  <ChevronDown className="auth-select-arrow" />
                </div>
                <button type="button" className="auth-btn-solid-green mt-2" onClick={handleContinueDetails}>Continue</button>
                <div className="auth-bottom-switch-row pt-2 pb-6">
                  <span className="auth-switch-label">Already have an account? </span>
                  <button type="button" className="auth-switch-action-green" onClick={() => setStep("login")}>Log In</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
