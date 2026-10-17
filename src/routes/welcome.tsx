import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { User, Lock, Mail, Eye, EyeOff, Leaf } from "lucide-react";
import { initiateGoogleAuth, signInWithEmail, sendPasswordReset } from "@/lib/firebase";
import { formatFirebaseAuthError, validateEmail, validatePassword, sanitizeText } from "@/lib/auth-validation";
import { setPendingSignup } from "@/lib/pending-signup";
import { toast } from "sonner";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome | Budgam Services" },
      { name: "description", content: "Sign in or create an account for Budgam Services to book or offer local services." },
      { property: "og:title", content: "Welcome | Budgam Services" },
      { property: "og:description", content: "Your local services companion in Budgam." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Welcome,
});

type Sheet = "login" | "signup" | null;

function Field({
  icon,
  trailing,
  ...props
}: {
  icon: ReactNode;
  trailing?: ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="relative flex h-14 items-center gap-4 rounded-2xl bg-sheet/80 px-5 shadow-md shadow-mint-deep/5 transition focus-within:ring-2 focus-within:ring-mint-deep/30">
      <span className="text-mint-deep">{icon}</span>
      <span className="h-7 w-px bg-mint-deep/15" />
      <input
        {...props}
        className="min-w-0 flex-1 appearance-none bg-transparent text-[15px] outline-none placeholder:text-mint-ink/50"
      />
      {trailing}
    </label>
  );
}

function Social({ onGoogleClick }: { onGoogleClick?: () => void }) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-mint-deep/15" />
        <span className="text-xs font-semibold uppercase tracking-wider text-mint-ink/60">
          Or continue with
        </span>
        <span className="h-px flex-1 bg-mint-deep/15" />
      </div>
      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={onGoogleClick}
          aria-label="Continue with Google"
          className="flex h-12 w-full max-w-[280px] items-center justify-center gap-3 rounded-2xl border border-mint-deep/20 bg-sheet/90 px-4 shadow-sm transition hover:bg-sheet active:scale-95"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="text-sm font-semibold text-mint-ink">Google</span>
        </button>
      </div>
    </div>
  );
}

export function Welcome() {
  const navigate = useNavigate();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [shown, setShown] = useState<Exclude<Sheet, null>>("login");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showSignupConfirmPw, setShowSignupConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Email login state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Sign up state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  const open = (s: Exclude<Sheet, null>) => {
    setShown(s);
    setSheet(s);
  };

  const handleGoogleAuth = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { isNewUser, user } = await initiateGoogleAuth();
      if (isNewUser) {
        toast.info("Please select your role and set your username, age, and gender.");
        setSheet(null);
        navigate({ to: "/role" });
      } else {
        toast.success("Welcome back!");
        navigate({ to: user.role === "provider" ? "/pro" : "/" });
      }
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        toast.error("Google sign in failed: " + formatFirebaseAuthError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const emailTrimmed = loginIdentifier.trim();
    if (!emailTrimmed || !loginPassword) {
      toast.error("Please enter both email and password.");
      return;
    }

    const emailCheck = validateEmail(emailTrimmed);
    if (!emailCheck.valid) {
      toast.error(emailCheck.error);
      return;
    }

    setLoading(true);
    try {
      const user = await signInWithEmail(emailTrimmed, loginPassword);
      toast.success("Welcome back!");
      navigate({ to: user.role === "provider" ? "/pro" : "/" });
    } catch (err: any) {
      toast.error(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = sanitizeText(signupName);
    const emailTrimmed = signupEmail.trim();

    if (!nameTrimmed) {
      toast.error("Please enter your full name.");
      return;
    }

    const emailCheck = validateEmail(emailTrimmed);
    if (!emailCheck.valid) {
      toast.error(emailCheck.error);
      return;
    }

    const pwCheck = validatePassword(signupPassword);
    if (!pwCheck.valid) {
      toast.error(pwCheck.error);
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast.error("Passwords do not match. Please verify your confirm password.");
      return;
    }

    // Keep pending credentials in memory only while the user completes role/profile details.
    setPendingSignup({
      fullName: nameTrimmed,
      email: emailCheck.sanitized!,
      password: signupPassword,
    });

    setSheet(null);
    navigate({ to: "/role" });
  };

  const handleForgotPassword = async () => {
    const emailVal = validateEmail(loginIdentifier);
    if (!emailVal.valid) {
      toast.error("Please enter your email address into the input field first.");
      return;
    }
    try {
      await sendPasswordReset(loginIdentifier);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      toast.error(formatFirebaseAuthError(err));
    }
  };

  const loginEye = (
    <button
      type="button"
      onClick={() => setShowLoginPw((v) => !v)}
      className="text-mint-deep hover:opacity-80"
      aria-label={showLoginPw ? "Hide password" : "Show password"}
    >
      {showLoginPw ? <Eye size={20} /> : <EyeOff size={20} />}
    </button>
  );

  const signupEye = (
    <button
      type="button"
      onClick={() => setShowSignupPw((v) => !v)}
      className="text-mint-deep hover:opacity-80"
      aria-label={showSignupPw ? "Hide password" : "Show password"}
    >
      {showSignupPw ? <Eye size={20} /> : <EyeOff size={20} />}
    </button>
  );

  const signupConfirmEye = (
    <button
      type="button"
      onClick={() => setShowSignupConfirmPw((v) => !v)}
      className="text-mint-deep hover:opacity-80"
      aria-label={showSignupConfirmPw ? "Hide password" : "Show password"}
    >
      {showSignupConfirmPw ? <Eye size={20} /> : <EyeOff size={20} />}
    </button>
  );

  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col justify-between overflow-hidden bg-primary px-7 pb-10 pt-16 text-primary-foreground">
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-mint-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-mint-deep/30 blur-3xl" />

      <div className="relative animate-in fade-in duration-700">
        <div className="inline-flex items-center gap-2 rounded-full bg-mint-tint/20 px-4 py-1.5 backdrop-blur-md">
          <Leaf size={16} className="text-mint-tint" />
          <span className="text-xs font-semibold tracking-wider text-mint-tint uppercase">
            Budgam Services
          </span>
        </div>
        <h1 className="mt-8 text-5xl font-black leading-[1.08] tracking-tight">
          Everything<br />you need,<br />nearby.
        </h1>
        <p className="mt-4 max-w-xs text-base text-primary-foreground/80">
          Book trusted professionals or find local work in your area. Simple, fast, and local.
        </p>
      </div>

      <div className="relative space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
        <button
          onClick={() => open("login")}
          className="h-14 w-full rounded-2xl bg-sheet text-lg font-bold text-mint-ink shadow-xl shadow-black/10 transition active:scale-[0.98]"
        >
          Log In
        </button>
        <button
          onClick={() => open("signup")}
          className="h-14 w-full rounded-2xl border-2 border-primary-foreground/30 bg-primary-foreground/10 text-lg font-bold text-primary-foreground backdrop-blur-sm transition hover:bg-primary-foreground/15 active:scale-[0.98]"
        >
          Sign Up
        </button>
        <p className="pt-2 text-center text-xs text-primary-foreground/60">
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </div>

      {/* Backdrop */}
      <div
        onClick={() => setSheet(null)}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${sheet ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      />

      {/* Slide-up sheet */}
      <div
        style={{
          transform: sheet ? "translateY(0)" : "translateY(105%)",
          transition: `transform 420ms ${ease}`,
        }}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] max-w-md overflow-y-auto rounded-t-[36px] bg-gradient-to-b from-mint via-mint-soft to-mint px-7 pb-10 pt-4 text-mint-ink shadow-2xl"
      >
        <div className="flex justify-center pb-5">
          <div className="h-1.5 w-12 rounded-full bg-mint-deep/20" />
        </div>

        {shown === "login" ? (
          <form onSubmit={handleEmailLogin} key="l" className="animate-in fade-in duration-500">
            <h2 className="text-4xl font-extrabold">Log In</h2>
            <p className="mt-2 text-mint-ink/70">Welcome back! Please login to your account.</p>
            <div className="mt-7 space-y-4">
              <Field
                icon={<User size={22} />}
                placeholder="Username Or Email"
                type="text"
                name="identifier"
                autoComplete="username"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                required
              />
              <Field
                icon={<Lock size={22} />}
                placeholder="Password"
                type={showLoginPw ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                trailing={loginEye}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-7 h-14 w-full rounded-full bg-gradient-to-b from-mint-deep to-primary text-lg font-bold text-primary-foreground shadow-lg shadow-mint-deep/30 transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Log In"}
            </button>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="mx-auto mt-4 block text-center text-sm font-medium text-mint-deep hover:underline"
            >
              Forgot Password?
            </button>
            <Social onGoogleClick={handleGoogleAuth} />
            <p className="mt-6 text-center text-sm text-mint-ink/70">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => open("signup")}
                className="font-bold text-mint-deep"
              >
                Sign Up
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} key="s" className="animate-in fade-in duration-500">
            <h2 className="text-4xl font-extrabold">Sign Up</h2>
            <p className="mt-2 text-mint-ink/70">Create your account to get started.</p>
            <div className="mt-7 space-y-4">
              <Field
                icon={<User size={22} />}
                placeholder="Full Name"
                type="text"
                name="fullname"
                autoComplete="name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                required
              />
              <Field
                icon={<Mail size={22} />}
                placeholder="Email"
                type="email"
                name="email"
                autoComplete="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
              <Field
                icon={<Lock size={22} />}
                placeholder="Password"
                type={showSignupPw ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
                trailing={signupEye}
              />
              <Field
                icon={<Lock size={22} />}
                placeholder="Confirm Password"
                type={showSignupConfirmPw ? "text" : "password"}
                name="confirmPassword"
                autoComplete="new-password"
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                required
                trailing={signupConfirmEye}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-7 h-14 w-full rounded-full bg-gradient-to-b from-mint-deep to-primary text-lg font-bold text-primary-foreground shadow-lg shadow-mint-deep/30 transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
            >
              Sign Up
            </button>
            <Social onGoogleClick={handleGoogleAuth} />
            <p className="mt-6 text-center text-sm text-mint-ink/70">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => open("login")}
                className="font-bold text-mint-deep"
              >
                Log In
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
