import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { User, UserPlus, Lock, Mail, Eye, EyeOff, ChevronRight, Leaf } from "lucide-react";
import { signInWithGoogle, signInWithEmail, sendPasswordReset } from "@/lib/firebase";
import { formatFirebaseAuthError, validateEmail } from "@/lib/auth-validation";
import { toast } from "sonner";

export const Route = createFileRoute("/welcome")({
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
  const [sheet, setSheet] = useState<Sheet>(null);
  const [shown, setShown] = useState<Exclude<Sheet, null>>("login");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Email login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const open = (s: Exclude<Sheet, null>) => {
    setShown(s);
    setSheet(s);
  };

  const handleGoogleAuth = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      toast.success("Signed in with Google!");
      navigate({ to: user.role === "provider" ? "/pro" : "/" });
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

    if (!loginEmail.trim() || !loginPassword) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const user = await signInWithEmail(loginEmail, loginPassword);
      toast.success("Welcome back!");
      navigate({ to: user.role === "provider" ? "/pro" : "/" });
    } catch (err: any) {
      toast.error(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const emailVal = validateEmail(loginEmail);
    if (!emailVal.valid) {
      toast.error("Please type your email address into the email field first.");
      return;
    }
    try {
      await sendPasswordReset(loginEmail);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      toast.error(formatFirebaseAuthError(err));
    }
  };

  const eye = (
    <button
      type="button"
      onClick={() => setShowPw((v) => !v)}
      className="text-mint-deep hover:opacity-80"
      aria-label={showPw ? "Hide password" : "Show password"}
    >
      {showPw ? <Eye size={20} /> : <EyeOff size={20} />}
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
                icon={<Mail size={22} />}
                placeholder="Email address"
                type="email"
                name="email"
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
              <Field
                icon={<Lock size={22} />}
                placeholder="Password"
                type={showPw ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                trailing={eye}
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
              className="mx-auto mt-4 block text-sm font-medium text-mint-deep hover:underline"
            >
              Forgot Password?
            </button>
            <Social onGoogleClick={handleGoogleAuth} />
            <p className="mt-6 text-center text-sm text-mint-ink/70">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setSheet(null);
                  navigate({ to: "/role" });
                }}
                className="font-bold text-mint-deep"
              >
                Sign Up
              </button>
            </p>
          </form>
        ) : (
          <div key="s" className="animate-in fade-in duration-500">
            <h2 className="text-4xl font-extrabold">Sign Up</h2>
            <p className="mt-2 text-mint-ink/70">Pick your role and profile details to create your account.</p>
            <button
              type="button"
              onClick={() => {
                setSheet(null);
                navigate({ to: "/role" });
              }}
              className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-mint-deep to-primary text-lg font-bold text-primary-foreground shadow-lg shadow-mint-deep/30 transition hover:brightness-105 active:scale-[0.98]"
            >
              <span>Continue to Role & Details</span>
              <ChevronRight size={20} />
            </button>
            <Social onGoogleClick={handleGoogleAuth} />
            <p className="mt-6 text-center text-sm text-mint-ink/70">
              Already have an account?{" "}
              <button type="button" onClick={() => open("login")} className="font-bold text-mint-deep">
                Log In
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
