import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { User, Wrench, Check, ChevronRight, ChevronDown, Calendar, VenusAndMars, Loader2 } from "lucide-react";
import { auth, isUsernameAvailable, signUpWithEmail, signInWithGoogle, completeUserProfile } from "@/lib/firebase";
import { formatFirebaseAuthError, validateUsername } from "@/lib/auth-validation";
import { clearPendingSignup, getPendingSignup, type PendingSignupData } from "@/lib/pending-signup";
import { toast } from "sonner";

export const Route = createFileRoute("/role")({
  head: () => ({
    meta: [
      { title: "Choose Your Role | Budgam Services" },
      { name: "description", content: "Pick whether you want to book services or offer them, and finish setting up your account." },
      { property: "og:title", content: "Choose Your Role | Budgam Services" },
      { property: "og:description", content: "Book local services or grow your business as a service man." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RolePage,
});

type Role = "customer" | "pro";
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

function Row({ icon, children, chevron }: { icon: ReactNode; children: ReactNode; chevron?: boolean }) {
  return (
    <label className="relative flex h-14 items-center gap-4 rounded-2xl bg-sheet/80 px-5 shadow-md shadow-mint-deep/5 transition focus-within:ring-2 focus-within:ring-mint-deep/30">
      <span className="text-mint-deep">{icon}</span>
      <span className="h-7 w-px bg-mint-deep/15" />
      {children}
      {chevron && <ChevronDown size={20} className="pointer-events-none text-mint-ink/60" />}
    </label>
  );
}

export function RolePage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role | null>(null);
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameError, setUsernameError] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [pendingSignup, setPendingSignup] = useState<PendingSignupData | null>(null);
  const [loading, setLoading] = useState(false);
  const ages = Array.from({ length: 83 }, (_, i) => i + 18);

  // Retrieve pending sign-up data from memory; do NOT provide any prefilled suggested username
  useEffect(() => {
    const parsed = getPendingSignup();
    if (parsed) {
      setPendingSignup(parsed);
    }
    // Field starts empty as explicitly requested
    setUsername("");
  }, []);

  // Debounced fast database availability check once user stops typing
  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameStatus("idle");
      setUsernameError("");
      return;
    }

    const val = validateUsername(trimmed);
    if (!val.valid) {
      setUsernameStatus("invalid");
      setUsernameError(val.error || `'${trimmed}' is not available`);
      return;
    }

    setUsernameStatus("checking");
    let active = true;

    const timer = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(trimmed);
        if (!active) return;
        if (available) {
          setUsernameStatus("available");
          setUsernameError("");
        } else {
          setUsernameStatus("taken");
          setUsernameError(`'${trimmed}' is not available`);
        }
      } catch (err) {
        if (!active) return;
        console.warn("Username availability check error:", err);
        setUsernameStatus("idle");
      }
    }, 280);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [username]);

  const cards = [
    { k: "customer" as const, t: "Non Professional", s: "Book local services, get help from verified professionals.", Icon: User },
    { k: "pro" as const, t: "Service Man", s: "Offer your services, get bookings and grow your business.", Icon: Wrench },
  ];

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      toast.info("Please select a role to continue");
      return;
    }

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      toast.error("Please enter a username.");
      return;
    }

    const usernameCheck = validateUsername(trimmedUsername);
    if (!usernameCheck.valid) {
      toast.error(usernameCheck.error);
      return;
    }

    if (usernameStatus === "taken" || usernameStatus === "invalid") {
      toast.error(`'${trimmedUsername}' is not available. Please choose another username.`);
      return;
    }

    if (!age) {
      toast.error("Please select your age.");
      return;
    }

    if (!gender) {
      toast.error("Please select your gender.");
      return;
    }

    const targetRole = role === "pro" ? "provider" : "customer";
    setLoading(true);

    try {
      // Final confirmation check to avoid race conditions
      const available = await isUsernameAvailable(trimmedUsername);
      if (!available) {
        setUsernameStatus("taken");
        setUsernameError(`'${trimmedUsername}' is not available`);
        toast.error(`'${trimmedUsername}' is not available.`);
        setLoading(false);
        return;
      }

      if (pendingSignup?.email && pendingSignup?.password) {
        // Complete email & password registration with all details saved in Firestore
        const registeredEmail = pendingSignup.email;
        await signUpWithEmail({
          email: registeredEmail,
          password: pendingSignup.password,
          username: usernameCheck.sanitized!,
          displayName: pendingSignup.fullName || usernameCheck.sanitized!,
          age,
          gender,
          role: targetRole,
        });

        clearPendingSignup();
        toast.success("Account created! Please check your email to verify your account.");
        navigate({
          to: "/verify-email",
          search: { email: registeredEmail },
        });
      } else if (auth.currentUser) {
        // User already authenticated with Google (or another provider)
        const user = await completeUserProfile(auth.currentUser, {
          role: targetRole,
          username: usernameCheck.sanitized!,
          displayName: auth.currentUser.displayName || usernameCheck.sanitized!,
          age,
          gender,
        });

        clearPendingSignup();
        toast.success("Account created successfully!");
        navigate({ to: user.role === "provider" ? "/pro" : "/" });
      } else {
        // Fallback for Google sign-in
        const user = await signInWithGoogle({
          targetRole,
          username: usernameCheck.sanitized!,
          age,
          gender,
        });

        clearPendingSignup();
        toast.success("Account created successfully!");
        navigate({ to: user.role === "provider" ? "/pro" : "/" });
      }
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        toast.error(formatFirebaseAuthError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const sel = "min-w-0 flex-1 appearance-none bg-transparent text-[15px] outline-none";
  const isUsernameBad = usernameStatus === "taken" || usernameStatus === "invalid";

  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-md overflow-hidden bg-gradient-to-b from-mint via-mint-soft to-mint px-5 pb-10 text-mint-ink">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-96 rotate-[-18deg] rounded-[50%] bg-mint-deep/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-96 rotate-[-18deg] rounded-[50%] bg-mint-deep/10 blur-2xl" />

      <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="pt-14 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight">Welcome</h1>
          <p className="mt-3 text-lg text-mint-ink/70">Great to see you again!</p>
        </div>

        <div className="mt-9 space-y-4">
          {cards.map(({ k, t, s, Icon }, i) => {
            const on = role === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setRole(k)}
                style={{ animationDelay: `${150 + i * 100}ms` }}
                className={`flex w-full items-center gap-4 rounded-[24px] border-2 p-4 text-left shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 fill-mode-both active:scale-[0.98] ${on ? "border-mint-deep/50 bg-mint/70 shadow-mint-deep/15" : "border-transparent bg-sheet/70 shadow-mint-deep/5"}`}
              >
                <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-full transition-colors duration-300 ${on ? "bg-mint-deep text-sheet" : "bg-mint text-mint-deep"}`}>
                  <Icon size={28} />
                </span>
                <span className="flex-1">
                  <span className={`block text-lg font-bold transition-colors ${on ? "text-mint-deep" : ""}`}>{t}</span>
                  <span className="text-sm leading-snug text-mint-ink/60">{s}</span>
                </span>
                {on ? (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-mint-deep text-sheet animate-in zoom-in duration-300"><Check size={16} strokeWidth={3} /></span>
                ) : (
                  <ChevronRight className="text-mint-ink/50" />
                )}
              </button>
            );
          })}
        </div>

        <form onSubmit={go} className="mt-9 animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-700" style={{ animationDelay: "350ms" }}>
          <h2 className="text-2xl font-extrabold">Create Your Account</h2>
          <p className="mt-1 text-mint-ink/60">Choose a username and add a few details to get started.</p>
          <div className="mt-6 space-y-4">
            {/* Live-checked Username field */}
            <div>
              <div
                className={`relative flex h-14 items-center gap-4 rounded-2xl px-5 shadow-md transition ${
                  isUsernameBad
                    ? "border-2 border-red-500 bg-red-50/70 shadow-red-500/10 focus-within:ring-2 focus-within:ring-red-400/40"
                    : usernameStatus === "available"
                    ? "border-2 border-emerald-500/50 bg-sheet/80 shadow-mint-deep/5 focus-within:ring-2 focus-within:ring-emerald-400/30"
                    : "border border-transparent bg-sheet/80 shadow-mint-deep/5 focus-within:ring-2 focus-within:ring-mint-deep/30"
                }`}
              >
                <span className={isUsernameBad ? "text-red-500" : "text-mint-deep"}>
                  <User size={22} />
                </span>
                <span className={`h-7 w-px ${isUsernameBad ? "bg-red-300" : "bg-mint-deep/15"}`} />
                <input
                  required
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`${sel} ${isUsernameBad ? "text-red-700" : ""} placeholder:text-mint-ink/50`}
                />
                {usernameStatus === "checking" && (
                  <Loader2 size={18} className="animate-spin text-mint-deep/60 shrink-0" />
                )}
                {usernameStatus === "available" && (
                  <span className="shrink-0 text-emerald-500 animate-in zoom-in-50 duration-200" title="Username is available">
                    <Check size={20} strokeWidth={2.8} />
                  </span>
                )}
                {isUsernameBad && (
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-500 text-[11px] font-black leading-none text-white shadow-sm shadow-red-500/30 animate-in zoom-in-50 duration-200"
                    title="Username is not available"
                  >
                    !
                  </span>
                )}
              </div>
              {isUsernameBad && (
                <p className="mt-1.5 px-2 text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
                  {usernameError || `'${username.trim()}' is not available`}
                </p>
              )}
            </div>

            <Row icon={<Calendar size={22} />} chevron>
              <select required value={age} onChange={(e) => setAge(e.target.value)} className={`${sel} ${age ? "" : "text-mint-ink/50"}`}>
                <option value="" disabled>Age</option>
                {ages.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Row>
            <Row icon={<VenusAndMars size={22} />} chevron>
              <select required value={gender} onChange={(e) => setGender(e.target.value)} className={`${sel} ${gender ? "" : "text-mint-ink/50"}`}>
                <option value="" disabled>Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </Row>
          </div>
          <button
            type="submit"
            disabled={!role || loading || isUsernameBad}
            className="mt-7 h-14 w-full rounded-2xl bg-gradient-to-b from-mint-deep to-primary text-lg font-bold text-primary-foreground shadow-lg shadow-mint-deep/30 transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? "Creating account..." : role ? "Continue" : "Select a role to continue"}
          </button>
          <p className="mt-5 text-center text-sm text-mint-ink/70">Already have an account? <Link to="/welcome" className="font-bold text-mint-deep">Log In</Link></p>
        </form>
      </div>
    </div>
  );
}
