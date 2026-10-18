import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Mail, Loader2 } from "lucide-react";
import {
  auth,
  fetchUserFromFirestore,
  saveStoredUser,
  notifyAuthListeners,
  sendUserEmailVerification,
  logOutUser,
  type StoredAuthUser,
  type AppUserRole,
} from "@/lib/firebase";
import { formatFirebaseAuthError } from "@/lib/auth-validation";
import { toast } from "sonner";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === "string" ? search.email : "",
  }),
  head: () => ({
    meta: [
      { title: "Check Your Email | Budgam Services" },
      { name: "description", content: "Verify your email to complete your registration." },
    ],
  }),
  component: VerifyEmailPage,
});

const RESEND_COOLDOWN_SECONDS = 60;
const COOLDOWN_STORAGE_KEY = "budgam_verify_cooldown_expiry";

/**
 * Envelope Illustration matching the reference design:
 * Open mint green envelope with peek-out document, radiating accent bursts,
 * frosted circular backdrop, and deep-emerald checkmark badge.
 */
function EnvelopeIllustration() {
  return (
    <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
      <svg
        width="220"
        height="220"
        viewBox="0 0 220 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm select-none"
      >
        {/* Radiating burst rays */}
        <rect x="50" y="34" width="4.5" height="14" rx="2.25" transform="rotate(-40 50 34)" fill="#52B788" />
        <rect x="74" y="21" width="4.5" height="14" rx="2.25" transform="rotate(-18 74 21)" fill="#52B788" />
        <rect x="144" y="21" width="4.5" height="14" rx="2.25" transform="rotate(18 144 21)" fill="#52B788" />
        <rect x="168" y="34" width="4.5" height="14" rx="2.25" transform="rotate(40 168 34)" fill="#52B788" />
        <rect x="15" y="105" width="14" height="4.5" rx="2.25" fill="#52B788" />
        <rect x="191" y="105" width="14" height="4.5" rx="2.25" fill="#52B788" />

        {/* Frosted circular halo backdrop */}
        <circle
          cx="110"
          cy="110"
          r="74"
          fill="#FFFFFF"
          fillOpacity="0.45"
          stroke="#FFFFFF"
          strokeWidth="2.5"
        />

        {/* Soft ground shadow beneath envelope */}
        <ellipse cx="110" cy="158" rx="52" ry="8" fill="#2D6A4F" fillOpacity="0.14" />

        {/* Open Back Flap of the envelope (triangle pointing up) */}
        <path d="M52 108 L110 65 L168 108 Z" fill="#2D6A4F" />

        {/* White Letter / Document poking out with rounded top */}
        <rect x="64" y="74" width="92" height="62" rx="8" fill="#FFFFFF" />
        {/* Placeholder text lines on the letter */}
        <rect x="76" y="87" width="56" height="5" rx="2.5" fill="#95D5B2" />
        <rect x="76" y="98" width="38" height="5" rx="2.5" fill="#95D5B2" />

        {/* Envelope Body / Pocket folds */}
        {/* Left side flap */}
        <path d="M50 102 L110 138 L50 156 Z" fill="#74C69D" />
        {/* Right side flap */}
        <path d="M170 102 L110 138 L170 156 Z" fill="#52B788" />
        {/* Bottom flap */}
        <path d="M50 156 L110 120 L170 156 Z" fill="#40916C" />
        {/* Crisp subtle envelope boundary */}
        <path
          d="M50 102 L170 102 L170 156 L50 156 Z"
          stroke="#2D6A4F"
          strokeOpacity="0.12"
          strokeWidth="1.2"
        />

        {/* Emerald Checkmark Badge on bottom-right corner */}
        <circle cx="154" cy="146" r="21" fill="#FFFFFF" />
        <circle cx="154" cy="146" r="18" fill="#2D6A4F" />
        <path
          d="M147 146 L152 151 L162 141"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(() => {
    if (typeof window === "undefined") return RESEND_COOLDOWN_SECONDS;
    try {
      const storedExpiry = sessionStorage.getItem(COOLDOWN_STORAGE_KEY);
      if (storedExpiry) {
        const remaining = Math.ceil((parseInt(storedExpiry, 10) - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
      }
      // If user just arrived from signup, start with 60s cooldown
      const newExpiry = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
      sessionStorage.setItem(COOLDOWN_STORAGE_KEY, String(newExpiry));
      return RESEND_COOLDOWN_SECONDS;
    } catch {
      return RESEND_COOLDOWN_SECONDS;
    }
  });

  const displayEmail =
    search.email ||
    auth.currentUser?.email ||
    "your email address";

  // Active cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          try {
            sessionStorage.removeItem(COOLDOWN_STORAGE_KEY);
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  // Automatic verification detection polling (every 3 seconds)
  const checkingRef = useRef(false);
  useEffect(() => {
    let active = true;

    const checkVerification = async () => {
      if (checkingRef.current) return;
      try {
        if (!auth.currentUser) return;
        checkingRef.current = true;
        await auth.currentUser.reload();

        if (auth.currentUser.emailVerified && active) {
          toast.success("Email verified successfully!");

          // Retrieve user profile from Firestore to route to appropriate dashboard
          const uid = auth.currentUser.uid;
          const profile = await fetchUserFromFirestore(uid);
          const resolvedRole: AppUserRole =
            profile?.role === "provider" ? "provider" : "customer";

          const storedUser: StoredAuthUser = {
            uid,
            email: auth.currentUser.email,
            displayName:
              profile?.displayName ||
              profile?.username ||
              auth.currentUser.displayName ||
              "User",
            photoURL: auth.currentUser.photoURL || null,
            role: resolvedRole,
            providerId: "password",
            username: profile?.username,
            phone: profile?.phone,
            age: profile?.age,
            gender: profile?.gender,
            emailVerified: true,
          };

          saveStoredUser(storedUser);
          notifyAuthListeners(storedUser);
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("budgam_auth_change", { detail: storedUser })
            );
          }

          navigate({ to: resolvedRole === "provider" ? "/pro" : "/" });
        }
      } catch (err) {
        // Silently tolerate background network hiccups
      } finally {
        checkingRef.current = false;
      }
    };

    const intervalId = setInterval(checkVerification, 3000);
    // Initial check on mount
    checkVerification();

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [navigate]);

  // Resend Email with error handling & cooldown reset
  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    try {
      await sendUserEmailVerification();
      const newExpiry = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
      try {
        sessionStorage.setItem(COOLDOWN_STORAGE_KEY, String(newExpiry));
      } catch {}
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success("Verification email resent! Check your inbox.");
    } catch (err: any) {
      toast.error(formatFirebaseAuthError(err));
    } finally {
      setResending(false);
    }
  };

  // Back to Login: clean logout and navigate to Welcome screen with login sheet open
  const handleBackToLogin = async () => {
    await logOutUser();
    navigate({
      to: "/welcome",
      search: { sheet: "login" },
    });
  };

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col justify-between overflow-hidden bg-gradient-to-b from-mint via-mint-soft to-mint px-6 py-10 text-mint-ink">
      {/* Ambient background mint-green gradient shapes */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-96 rotate-[-18deg] rounded-[50%] bg-mint-deep/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-96 rotate-[-18deg] rounded-[50%] bg-mint-deep/10 blur-2xl" />

      {/* Main Content Area */}
      <div className="relative pt-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Envelope Illustration */}
        <EnvelopeIllustration />

        {/* Heading */}
        <h1 className="mt-7 text-3xl font-extrabold tracking-tight text-mint-ink">
          Check Your Email
        </h1>

        {/* Instructions & User Email */}
        <p className="mt-3 text-[15px] text-mint-ink/80">
          We’ve sent a confirmation link to
        </p>
        <p className="mt-0.5 text-base font-bold text-mint-ink break-all px-2">
          {displayEmail}
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-mint-ink/80 max-w-xs mx-auto">
          Please open your email and click the link to verify your account.
        </p>

        {/* Help Card: Didn't receive the email? */}
        <div className="mt-8 flex items-start gap-4 rounded-3xl bg-sheet/85 p-5 shadow-lg shadow-mint-deep/5 border border-mint-deep/10 text-left">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mint text-mint-deep shadow-sm">
            <Mail size={22} strokeWidth={2.2} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[15px] text-mint-ink leading-tight">
              Didn’t receive the email?
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-mint-ink/70">
              Check your spam or junk folder. If you still don’t see it, you can resend the email.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative mt-8 space-y-3 pb-2 text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
        <button
          type="button"
          onClick={handleBackToLogin}
          className="h-14 w-full rounded-2xl bg-gradient-to-b from-mint-deep to-primary text-lg font-bold text-primary-foreground shadow-lg shadow-mint-deep/30 transition hover:brightness-105 active:scale-[0.98]"
        >
          Back to Login
        </button>

        <div>
          <button
            type="button"
            disabled={cooldown > 0 || resending}
            onClick={handleResend}
            className="inline-flex items-center justify-center py-2 text-sm font-bold text-mint-deep transition hover:underline disabled:opacity-50 disabled:hover:no-underline active:scale-95"
          >
            {resending ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Resending...
              </span>
            ) : cooldown > 0 ? (
              `Resend Email (${cooldown}s)`
            ) : (
              "Resend Email"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
