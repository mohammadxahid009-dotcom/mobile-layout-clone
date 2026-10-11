import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, House, CalendarDays, MessageSquare, UserRound, Star, BadgeCheck } from "lucide-react";
import type { ReactNode } from "react";

const tabs = [
  { name: "Home", to: "/", icon: House },
  { name: "Bookings", to: "/bookings", icon: CalendarDays },
  { name: "Messages", to: "/messages", icon: MessageSquare },
  { name: "Profile", to: "/profile", icon: UserRound },
] as const;

export function BottomNav({ active }: { active: (typeof tabs)[number]["name"] }) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {tabs.map(({ name, to, icon: Icon }) => (
        <Link key={name} to={to} className={`nav-item ${name === active ? "nav-active" : ""}`} aria-current={name === active ? "page" : undefined}>
          <Icon fill={name === active ? "currentColor" : "none"} /><span>{name}</span>{name === active && <i />}
        </Link>
      ))}
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
