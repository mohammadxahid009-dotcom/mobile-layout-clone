import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, House, CalendarDays, MessageSquare, UserRound, Star, BadgeCheck, ShieldCheck } from "lucide-react";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";

const tabs = [
  { name: "Home", to: "/", icon: House },
  { name: "Bookings", to: "/bookings", icon: CalendarDays },
  { name: "Messages", to: "/messages", icon: MessageSquare },
  { name: "Profile", to: "/profile", icon: UserRound },
] as const;

// The nav remounts on every route change, so remember where the highlight last was
// and glide it across instead of teleporting to the new tab.
let lastIndex = 0;
let mountedOnce = false;
const useBeforePaintEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function BottomNav({ active }: { active: (typeof tabs)[number]["name"] }) {
  const index = Math.max(0, tabs.findIndex((tab) => tab.name === active));
  const navRef = useRef<HTMLElement>(null);

  useBeforePaintEffect(() => {
    const from = lastIndex;
    const firstMount = !mountedOnce;
    mountedOnce = true;
    lastIndex = index;
    if (firstMount || from === index) return;
    const pills = navRef.current?.querySelectorAll<HTMLElement>("[data-slide]") ?? [];
    pills.forEach((pill) => {
      pill.style.transition = "none";
      pill.style.transform = `translateX(${from * 100}%)`;
    });
    // Commit the start position before releasing the transition, so the glide is visible.
    void navRef.current?.offsetWidth;
    pills.forEach((pill) => {
      pill.style.transition = "";
      pill.style.transform = `translateX(${index * 100}%)`;
    });
  }, [index]);

  const slide = { transform: `translateX(${index * 100}%)` };

  return (
    <nav ref={navRef} className="bottom-nav" aria-label="Main navigation">
      {/* Desktop brand header shown only in left panel mode */}
      <div className="desktop-nav-brand" aria-hidden="true">
        <div className="desktop-nav-logo">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div className="desktop-nav-title">
          <span className="desktop-brand-name">Budgam Services</span>
          <span className="desktop-brand-sub">Local Experts</span>
        </div>
      </div>

      <span className="nav-capsule" data-slide style={slide} aria-hidden="true" />
      <span className="nav-dot" data-slide style={slide} aria-hidden="true" />

      {tabs.map(({ name, to, icon: Icon }) => (
        <Link
          key={name}
          to={to}
          className={`nav-item ${name === active ? "nav-active" : ""}`}
          aria-current={name === active ? "page" : undefined}
        >
          <Icon fill={name === active ? "currentColor" : "none"} />
          <span>{name}</span>
        </Link>
      ))}

      {/* Desktop footer chip shown only in left panel mode */}
      <div className="desktop-nav-footer" aria-hidden="true">
        <span className="chip-verified">
          <BadgeCheck fill="currentColor" /> Verified
        </span>
      </div>
    </nav>
  );
}

export function BackButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  return <button type="button" className={`back-btn ${className}`} aria-label="Go back" onClick={() => (window.history.length > 1 ? router.history.back() : router.navigate({ to: "/" }))}><ArrowLeft /></button>;
}

export function TopBar({ title, sub, right }: { title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <header className="top-bar">
      <BackButton />
      <div className="top-bar-title"><h1>{title}</h1>{sub}</div>
      {right}
    </header>
  );
}

export function Rating({ value, reviews }: { value: number; reviews: number }) {
  return <span className="rating"><Star fill="currentColor" /><b>{value.toFixed(1)}</b><span>({reviews} reviews)</span></span>;
}

export function Verified({ label = "Verified" }: { label?: string }) {
  return <span className="chip-verified"><BadgeCheck fill="currentColor" />{label}</span>;
}
