import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { User, UserPlus, Lock, Mail, Eye, EyeOff, ChevronRight, Leaf } from "lucide-react";
import { initiateGoogleAuth, signInWithEmail, sendPasswordReset } from "@/lib/firebase";
import { formatFirebaseAuthError, validateEmail, validatePassword, sanitizeText } from "@/lib/auth-validation";
import { setPendingSignup } from "@/lib/pending-signup";
import { toast } from "sonner";

export const Route = createFileRoute("/welcome")({
  validateSearch: (search: Record<string, unknown>) => ({
    sheet: (search.sheet as "login" | "signup" | undefined) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Welcome | Budgam Services" },
      { name: "description", content: "Log in or create an account to book trusted local services in Budgam." },
      { property: "og:title", content: "Welcome | Budgam Services" },
      { property: "og:description", content: "Your local services, just a tap away." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Welcome,
});

type Sheet = "login" | "signup" | null;

interface FieldProps {
  icon: ReactNode;
  placeholder: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  name?: string;
  autoComplete?: string;
  trailing?: ReactNode;
}

function Field({
  icon,
  placeholder,
  type = "text",
  value,
  onChange,
  required,
  name,
  autoComplete,
  trailing,
}: FieldProps) {
  return (
    <label className="flex h-14 items-center gap-3 rounded-full bg-mint px-5 transition focus-within:ring-2 focus-within:ring-mint-deep/30">
      <span className="text-mint-deep">{icon}</span>
      <span className="h-6 w-px bg-mint-deep/25" />
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-mint-ink outline-none placeholder:text-mint-ink/50"
      />
      {trailing}
    </label>
  );
}

function Social({ onGoogleClick }: { onGoogleClick?: () => void }) {
  return (
    <>
      <div className="mt-6 flex items-center gap-4 px-10 text-sm text-mint-ink/50">
        <span className="h-px flex-1 bg-mint-deep/20" />or<span className="h-px flex-1 bg-mint-deep/20" />
      </div>
      <p className="mt-3 text-center text-sm text-mint-ink/70">Continue with</p>
      <div className="mt-3 flex justify-center gap-5">
        {["f", "G"].map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => {
              if (l === "G") {
                onGoogleClick?.();
              } else {
                toast.info("Facebook login is not configured yet. Please continue with Google or Email.");
              }
            }}
            className="grid h-12 w-12 place-items-center rounded-full border-2 border-mint-deep text-lg font-bold text-mint-deep transition hover:bg-mint-deep/10 active:scale-95"
            aria-label={l === "G" ? "Continue with Google" : "Continue with Facebook"}
          >
            {l}
          </button>
        ))}
      </div>
    </>
  );
}

export function Welcome() {
  const navigate = useNavigate();
  const search = useRouterState({ select: (s) => (s.location.search as Record<string, any>) }) || {};
  const [sheet, setSheet] = useState<Sheet>(() => search.sheet || null);
  const [shown, setShown] = useState<Exclude<Sheet, null>>(() => search.sheet || "login");

  useEffect(() => {
    if (search.sheet) {
      setSheet(search.sheet);
      setShown(search.sheet);
    }
  }, [search.sheet]);
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
      const res = await signInWithEmail(emailTrimmed, loginPassword);
      if (!res.emailVerified) {
        toast.info("Please verify your email before logging in.");
        navigate({
          to: "/verify-email",
          search: { email: res.email || emailTrimmed },
        });
        return;
      }
      toast.success("Welcome back!");
      navigate({ to: res.user!.role === "provider" ? "/pro" : "/" });
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
    <div className="relative mx-auto h-[100dvh] max-w-md overflow-hidden bg-gradient-to-b from-mint via-mint-soft to-mint text-mint-ink">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-96 rotate-[-18deg] rounded-[50%] bg-mint-deep/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-96 rotate-[-18deg] rounded-[50%] bg-mint-deep/10 blur-2xl" />

      {/* Header */}
      <div className="absolute inset-x-0 text-center transition-all duration-700" style={{ top: sheet ? "8%" : "18%", transitionTimingFunction: ease }}>
        <h1 className="text-5xl font-extrabold tracking-tight text-mint-ink">Welcome</h1>
        <p className="mt-3 text-lg text-mint-ink/70">
          {sheet === "login" ? "Great to see you again!" : sheet === "signup" ? "Let's get you started!" : "Your local services, just a tap away"}
        </p>
      </div>

      {/* Cards */}
      <div className="absolute inset-x-5 top-[32%] space-y-5 transition-all duration-500" style={{ opacity: sheet ? 0 : 1, transform: sheet ? "scale(0.96)" : "none" }}>
        {([
          ["login", "Log In", "Already have an account?", User],
          ["signup", "Sign Up", "Create a new account", UserPlus],
        ] as const).map(([k, t, s, Icon]) => (
          <button key={k} onClick={() => open(k)} className="flex w-full items-center gap-4 rounded-[28px] border border-mint-deep/15 bg-sheet/70 p-4 text-left shadow-lg shadow-mint-deep/10 transition active:scale-[0.98]">
            <span className={`grid h-16 w-16 place-items-center rounded-full ${k === "login" ? "bg-mint-deep text-sheet" : "bg-mint text-mint-deep"}`}><Icon size={28} /></span>
            <span className="h-10 w-px bg-mint-deep/15" />
            <span className="flex-1"><span className="block text-xl font-bold">{t}</span><span className="text-sm text-mint-ink/60">{s}</span></span>
            <ChevronRight className="text-mint-deep" />
          </button>
        ))}
        <div className="pt-16 text-center text-sm text-mint-ink/60">
          <div className="mb-3 flex items-center justify-center gap-4"><span className="h-px w-16 bg-mint-deep/30" /><Leaf size={18} className="text-mint-deep" /><span className="h-px w-16 bg-mint-deep/30" /></div>
          Local help. Real people. Better together.
        </div>
      </div>

      {/* Backdrop */}
      <div onClick={() => setSheet(null)} className="absolute inset-0 transition-opacity duration-500" style={{ opacity: sheet ? 1 : 0, pointerEvents: sheet ? "auto" : "none" }} />

      {/* Sheet */}
      <div
        className="absolute inset-x-0 bottom-0 top-[21%] overflow-y-auto rounded-t-[40px] bg-sheet px-7 pb-10 pt-8 shadow-[0_-10px_40px_-10px] shadow-mint-deep/25 transition-transform duration-700"
        style={{ transform: sheet ? "translateY(0)" : "translateY(105%)", transitionTimingFunction: ease }}
      >
        <div className="mx-auto mb-5 h-1.5 w-12 cursor-pointer rounded-full bg-mint-deep/20" onClick={() => setSheet(null)} />
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
