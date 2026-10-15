import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Card, Empty, ProPage, StatusChip, btnPrimary, inputCls, proHead } from "@/components/pro-ui";
import { sameDay, usePro } from "@/lib/pro-store";

export const Route = createFileRoute("/pro/schedule")({
  head: () => proHead("My Schedule", "Weekly calendar of jobs, availability and working hours."),
  component: Schedule,
});

function startOfWeek(d: Date) { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0); return x; }

function Schedule() {
  const { jobs, available, setAvailable, hours, setHours } = usePro();
  const [selected, setSelected] = useState(() => new Date());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(hours);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const shift = (n: number) => { const w = new Date(weekStart); w.setDate(w.getDate() + n * 7); setWeekStart(w); setSelected(w); };
  const dayJobs = jobs.filter(j => j.when && sameDay(j.when, selected) && j.proStatus !== "Cancelled");
  const fmt = (t: string) => new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const isToday = sameDay(selected, new Date());

  return (
    <ProPage tab="Bookings" title="My Schedule">
      <div className="space-y-5 px-5">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">{weekStart.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
            <div className="flex gap-1">
              <button aria-label="Previous week" className="rounded-full p-1.5 hover:bg-muted" onClick={() => shift(-1)}><ChevronLeft className="h-5 w-5" /></button>
              <button aria-label="Next week" className="rounded-full p-1.5 hover:bg-muted" onClick={() => shift(1)}><ChevronRight className="h-5 w-5" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {days.map(d => {
              const on = sameDay(d, selected);
              const has = jobs.some(j => j.when && sameDay(j.when, d) && j.proStatus !== "Cancelled");
              return (
                <button key={d.toISOString()} onClick={() => setSelected(d)} className="flex flex-col items-center gap-1 py-1">
                  <span className="text-[11px] text-muted-foreground">{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                  <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-semibold ${on ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{d.getDate()}</span>
                  <span className={`h-1 w-1 rounded-full ${has ? "bg-primary" : "bg-transparent"}`} />
                </button>
              );
            })}
          </div>
        </Card>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">{isToday ? "Today's Schedule" : selected.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}</h3>
            <Link to="/pro/bookings" className="text-sm font-medium text-primary">View All</Link>
          </div>
          <div className="space-y-3">
            {dayJobs.map(j => (
              <Link key={j.id} to="/pro/booking/$id" params={{ id: j.id }}>
                <Card className="mb-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Clock className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{j.time}</p>
                    <p className="truncate text-xs text-muted-foreground">{j.service}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" />{j.location}</p>
                  </div>
                  <StatusChip status={j.proStatus} />
                </Card>
              </Link>
            ))}
            {dayJobs.length === 0 && <Empty>No jobs on this day.</Empty>}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">Availability</h3>
            <button className="text-sm font-medium text-primary" onClick={() => { setDraft(hours); setEditing(e => !e); }}>{editing ? "Close" : "Edit"}</button>
          </div>
          <Card className="space-y-4">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-primary" />Available for bookings</span>
              <button type="button" role="switch" aria-checked={available} onClick={() => { setAvailable(!available); toast(available ? "You're now unavailable" : "You're available for bookings"); }}
                className={`relative h-6 w-11 rounded-full transition-colors ${available ? "bg-primary" : "bg-muted-foreground/30"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${available ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </label>
            <div className="flex items-center gap-3 text-sm"><Clock className="h-5 w-5 text-primary" /><div><p>Working Hours</p><p className="text-xs text-muted-foreground">{fmt(hours.from)} - {fmt(hours.to)}</p></div></div>
            {editing && (
              <form className="grid grid-cols-2 gap-3" onSubmit={e => { e.preventDefault(); if (draft.from >= draft.to) { toast.error("End time must be after start time"); return; } setHours(draft); setEditing(false); toast.success("Working hours saved"); }}>
                <input type="time" aria-label="Start time" className={inputCls} value={draft.from} onChange={e => setDraft({ ...draft, from: e.target.value })} />
                <input type="time" aria-label="End time" className={inputCls} value={draft.to} onChange={e => setDraft({ ...draft, to: e.target.value })} />
                <button className={`${btnPrimary} col-span-2`}>Save Hours</button>
              </form>
            )}
          </Card>
        </section>
      </div>
    </ProPage>
  );
}
