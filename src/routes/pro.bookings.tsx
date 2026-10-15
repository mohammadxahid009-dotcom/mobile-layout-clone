import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Empty, JobSummary, ProPage, btnDanger, btnOutline, btnPrimary, proHead } from "@/components/pro-ui";
import { usePro, type Job } from "@/lib/pro-store";

export const Route = createFileRoute("/pro/bookings")({
  head: () => proHead("My Bookings", "Accept, decline and manage customer booking requests."),
  component: ProBookings,
});

const tabs = ["Upcoming", "Completed", "Cancelled"] as const;
const inTab = (j: Job, t: (typeof tabs)[number]) =>
  t === "Upcoming" ? ["Pending", "Confirmed", "In Progress"].includes(j.proStatus) : j.proStatus === t;

function ProBookings() {
  const { jobs, setJobStatus } = usePro();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Upcoming");
  const list = jobs.filter(j => inTab(j, tab));

  return (
    <ProPage tab="Bookings" title="My Bookings" back={false}>
      <div className="flex gap-2 overflow-x-auto px-5 pb-4">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {t} ({jobs.filter(j => inTab(j, t)).length})
          </button>
        ))}
      </div>
      <div className="space-y-3 px-5">
        {list.map(j => (
          <Card key={j.id}>
            <JobSummary job={j} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link to="/pro/booking/$id" params={{ id: j.id }} className={btnPrimary}>View Details</Link>
              {j.proStatus === "Pending" ? (
                <button className={btnDanger} onClick={() => { setJobStatus(j.id, "Cancelled"); toast("Booking declined"); }}>Decline</button>
              ) : j.proStatus === "Confirmed" || j.proStatus === "In Progress" ? (
                <Link to="/pro/chat/$id" params={{ id: j.providerId }} className={btnOutline}>Message</Link>
              ) : <span />}
            </div>
          </Card>
        ))}
        {list.length === 0 && <Empty>No {tab.toLowerCase()} bookings yet.</Empty>}
      </div>
    </ProPage>
  );
}
