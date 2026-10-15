import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BadgeCheck, Bell, CalendarCheck, ChevronRight, Clock, MessageSquare, ShieldCheck, UserRound, Wallet, Wrench, Star } from "lucide-react";
import { Card, ProPage, proHead } from "@/components/pro-ui";
import { rupees, sameDay, usePro } from "@/lib/pro-store";
import { useStore } from "@/lib/store";
import { getStoredUser } from "@/lib/firebase";

export const Route = createFileRoute("/pro/")({
  head: () => proHead("Dashboard", "Today's earnings, next booking and quick actions for service professionals."),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
}

function Dashboard() {
  const { jobs, profile, services } = usePro();
  const { reviews } = useStore();
  const [authName, setAuthName] = useState<string | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    if (u?.displayName) setAuthName(u.displayName);
  }, []);
  const today = new Date();
  const doneToday = jobs.filter(j => j.proStatus === "Completed" && j.completedAt && sameDay(new Date(j.completedAt), today));
  const pending = jobs.filter(j => j.proStatus === "Pending").length;
  const upcoming = jobs.filter(j => ["Pending", "Confirmed", "In Progress"].includes(j.proStatus))
    .sort((a, b) => (a.when?.getTime() ?? Infinity) - (b.when?.getTime() ?? Infinity));
  const next = upcoming[0];
  const profileIncomplete = !profile.name || !profile.phone || services.length === 0;

  const actions = [
    { label: "View Bookings", to: "/pro/bookings", icon: CalendarCheck },
    { label: "My Schedule", to: "/pro/schedule", icon: Clock },
    { label: "Earnings", to: "/pro/earnings", icon: Wallet },
    { label: "My Services", to: "/pro/services", icon: Wrench },
    { label: "Messages", to: "/pro/messages", icon: MessageSquare },
    { label: "Reviews", to: "/pro/reviews", icon: Star },
  ] as const;

  return (
    <ProPage tab="Home">
      <section className="pro-dashboard-header rounded-b-[2rem] bg-primary px-5 pb-6 pt-8 text-primary-foreground">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <p className="text-sm opacity-80">{greeting()},</p>
            <h1 className="truncate text-2xl font-bold">{authName || profile.name || "Service Professional"}</h1>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-foreground px-2.5 py-1 text-xs font-semibold text-primary"><BadgeCheck className="h-3.5 w-3.5" />Service Provider</span>
          </div>
          <Link to="/pro/bookings" aria-label="Pending requests" className="relative grid h-10 w-10 place-items-center rounded-full bg-primary-foreground/15">
            <Bell className="h-5 w-5" />
            {pending > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{pending}</span>}
          </Link>
        </div>
        <Link to="/pro/earnings" className="pro-earnings-card mt-5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-primary-foreground/12 p-4 ring-1 ring-primary-foreground/20">
          <Wallet className="h-8 w-8 opacity-90" />
          <div className="min-w-0">
            <p className="text-xs opacity-80">Today's Earnings</p>
            <p className="text-2xl font-bold">{rupees(doneToday.reduce((s, j) => s + j.amount, 0))}</p>
            <p className="text-xs opacity-80">{doneToday.length} completed jobs • {pending} pending</p>
          </div>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </section>

      <div className="space-y-5 px-5 pt-5">
        {next ? (
          <Link to="/pro/booking/$id" params={{ id: next.id }}>
            <Card className="pro-next-booking grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <div className="pro-next-booking-icon grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><CalendarCheck className="h-5 w-5" /></div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Next Booking</p>
                <p className="truncate font-semibold">{next.date} • {next.time}</p>
                <p className="truncate text-xs text-muted-foreground">{next.service} • {next.location}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Card>
          </Link>
        ) : (
          <Link to="/pro/bookings">
            <Card className="pro-next-booking grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <div className="pro-next-booking-icon grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Next Booking</p>
                <p className="truncate font-semibold">No upcoming bookings</p>
                <p className="truncate text-xs text-muted-foreground">Tap to view bookings or record a job</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Card>
          </Link>
        )}

        <section>
          <h2 className="mb-3 font-bold">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            {actions.map(({ label, to, icon: Icon }) => (
              <Link key={label} to={to} className="pro-action-tile flex flex-col items-center gap-2 rounded-2xl bg-primary/5 p-4 text-center text-xs font-medium transition-colors hover:bg-primary/10">
                <span className="pro-action-icon"><Icon className="h-6 w-6" /></span>{label}
              </Link>
            ))}
          </div>
        </section>

        <Link to="/pro/profile">
          <Card className="pro-complete-profile grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 bg-primary/5">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div className="min-w-0">
              <p className="font-semibold text-primary">{profileIncomplete ? "Complete your profile" : "Stay Professional"}</p>
              <p className="text-xs text-muted-foreground">{profileIncomplete ? "Add your name, phone and services so customers can trust you" : "Keep your profile and services updated"}</p>
            </div>
            <UserRound className="h-5 w-5 text-muted-foreground" />
          </Card>
        </Link>
        <p className="text-center text-xs text-muted-foreground">{reviews.length} reviews • <Link to="/" onClick={() => { try { sessionStorage.setItem("selected_role", "customer"); } catch {} }} className="text-primary underline">Switch to customer app</Link></p>
      </div>
    </ProPage>
  );
}
