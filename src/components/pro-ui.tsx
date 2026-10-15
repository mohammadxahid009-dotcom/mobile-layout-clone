import { Link, useRouter } from "@tanstack/react-router";
import { BottomNav } from "@/components/app-ui";
import { ArrowLeft, House, CalendarDays, MessageSquare, UserRound, Wrench, CalendarClock, MapPin, IndianRupee } from "lucide-react";
import type { ReactNode } from "react";
import type { Job, JobStatus } from "@/lib/pro-store";
import { rupees } from "@/lib/pro-store";

const tabs = [
  { name: "Home", to: "/pro", icon: House },
  { name: "Bookings", to: "/pro/bookings", icon: CalendarDays },
  { name: "Messages", to: "/pro/messages", icon: MessageSquare },
  { name: "Profile", to: "/pro/profile", icon: UserRound },
] as const;
export type ProTab = (typeof tabs)[number]["name"];

export function ProPage({ children, tab, title, right, back = true, className = "" }: { children: ReactNode; tab?: ProTab; title?: string; right?: ReactNode; back?: boolean; className?: string }) {
  return (
    <div className={`pro-provider-app mx-auto min-h-svh max-w-[480px] bg-background pb-32 text-foreground ${className}`}>
      {title && (
        <header className="pro-header sticky top-0 z-10 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 bg-background/95 px-5 py-4 backdrop-blur">
          {back ? <ProBack /> : <span />}
          <h1 className="truncate text-xl font-bold">{title}</h1>
          {right ?? <span />}
        </header>
      )}
      {children}
      {tab && <BottomNav active={tab} serviceProfessional />}
    </div>
  );
}

function ProBack() {
  const router = useRouter();
  return (
    <button type="button" aria-label="Go back" className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
      onClick={() => (window.history.length > 1 ? router.history.back() : router.navigate({ to: "/pro" }))}>
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}

export function ProNav({ active }: { active: ProTab }) {
  return (
    <nav aria-label="Service provider navigation" className="pro-provider-nav fixed inset-x-0 bottom-4 z-20 mx-auto grid w-[calc(100%-2rem)] max-w-[448px] grid-cols-4 rounded-3xl border border-border bg-card p-2 shadow-[0_12px_32px_-12px_color-mix(in_oklab,var(--foreground)_30%,transparent)]">
      {tabs.map(({ name, to, icon: Icon }) => {
        const on = name === active;
        return (
          <Link key={name} to={to} aria-current={on ? "page" : undefined}
            className={`pro-provider-nav-item flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors ${on ? "pro-provider-nav-active bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon className="h-5 w-5" fill={on ? "currentColor" : "none"} />
            {name}
          </Link>
        );
      })}
    </nav>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`pro-card rounded-2xl border p-4 ${className}`}>{children}</div>;
}

const statusTone: Record<JobStatus, string> = {
  Pending: "bg-[var(--electrician-circle)] text-[var(--carpenter-ink)]",
  Confirmed: "bg-primary/10 text-primary",
  "In Progress": "bg-[var(--plumber-circle)] text-[var(--plumber-ink)]",
  Completed: "bg-primary/10 text-primary",
  Cancelled: "bg-destructive/10 text-destructive",
};
export function StatusChip({ status }: { status: JobStatus }) {
  return <span className={`pro-chip shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone[status]}`}>{status}</span>;
}

export function IconTile({ children }: { children: ReactNode }) {
  return <div className="pro-icon-tile grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-primary-foreground">{children}</div>;
}

export function JobSummary({ job }: { job: Job }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3">
      <IconTile><Wrench className="h-5 w-5" /></IconTile>
      <div className="min-w-0">
        <h3 className="truncate font-semibold">{job.service}</h3>
        <p className="truncate text-sm text-muted-foreground">{job.customer}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{job.date}, {job.time}</span></p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{job.location}</span></p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <StatusChip status={job.proStatus} />
        <span className="flex items-center text-sm font-bold">{job.amount ? rupees(job.amount) : <span className="flex items-center text-xs font-normal text-muted-foreground"><IndianRupee className="h-3 w-3" />Set price</span>}</span>
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="pro-empty rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{children}</div>;
}

export const btn = "pro-btn inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors";
export const btnPrimary = `${btn} bg-primary text-primary-foreground hover:bg-primary/90`;
export const btnOutline = `${btn} border border-primary text-primary hover:bg-primary/5`;
export const btnDanger = `${btn} border border-destructive text-destructive hover:bg-destructive/5`;
export const inputCls = "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

export function proHead(title: string, description: string) {
  const t = `${title} | Budgam Services Pro`;
  return { meta: [{ title: t }, { name: "description", content: description }, { property: "og:title", content: t }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
}
