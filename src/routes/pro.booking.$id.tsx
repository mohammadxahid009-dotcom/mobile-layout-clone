import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarClock, IndianRupee, MapPin, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Card, Empty, IconTile, ProPage, StatusChip, btnOutline, btnPrimary, btnDanger, inputCls, proHead } from "@/components/pro-ui";
import { rupees, usePro } from "@/lib/pro-store";
import { Wrench } from "lucide-react";

export const Route = createFileRoute("/pro/booking/$id")({
  head: () => proHead("Booking Details", "Service details, customer notes and job location for a booking."),
  component: BookingDetails,
});

function BookingDetails() {
  const { id } = Route.useParams();
  const { jobs, setJobStatus, setAmount } = usePro();
  const navigate = useNavigate();
  const job = jobs.find(j => j.id === id);
  const [price, setPrice] = useState("");

  if (!job) return <ProPage title="Booking Details" tab="Bookings"><div className="px-5"><Empty>This booking no longer exists.</Empty></div></ProPage>;

  const act = (s: Parameters<typeof setJobStatus>[1], msg: string) => { setJobStatus(job.id, s); toast.success(msg); };
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(job.location)}&output=embed`;

  return (
    <ProPage title="Booking Details" tab="Bookings">
      <div className="space-y-5 px-5">
        <Card className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <IconTile><Wrench className="h-5 w-5" /></IconTile>
          <div className="min-w-0"><h2 className="truncate font-bold">{job.service}</h2><p className="truncate text-sm text-muted-foreground">{job.customer}</p></div>
          <StatusChip status={job.proStatus} />
        </Card>

        <section className="space-y-3">
          <h3 className="font-bold">Service Details</h3>
          <p className="flex items-center gap-3 text-sm"><CalendarClock className="h-5 w-5 shrink-0 text-primary" />{job.date}, {job.time}</p>
          <p className="flex items-center gap-3 text-sm"><MapPin className="h-5 w-5 shrink-0 text-primary" />{job.location}</p>
          <div className="flex items-center gap-3 text-sm">
            <IndianRupee className="h-5 w-5 shrink-0 text-primary" />
            {job.amount ? <b>{rupees(job.amount)}</b> : <span className="text-muted-foreground">No price set</span>}
          </div>
          {job.proStatus !== "Completed" && job.proStatus !== "Cancelled" && (
            <form className="flex gap-2" onSubmit={e => { e.preventDefault(); const n = Number(price); if (n > 0) { setAmount(job.id, n); setPrice(""); toast.success("Price updated"); } }}>
              <input className={inputCls} inputMode="numeric" placeholder="Set job price (₹)" value={price} onChange={e => setPrice(e.target.value.replace(/\D/g, ""))} />
              <button className={btnOutline}>Save</button>
            </form>
          )}
        </section>

        <section>
          <h3 className="mb-2 font-bold">Customer Notes</h3>
          <p className="text-sm text-muted-foreground">{job.description ? `"${job.description}"` : "No notes from the customer."}</p>
        </section>

        <section>
          <h3 className="mb-2 font-bold">Job Location</h3>
          <div className="overflow-hidden rounded-2xl border border-border">
            <iframe title="Job location map" src={mapSrc} className="h-44 w-full" loading="lazy" />
            <p className="px-3 py-2 text-sm font-medium">{job.location}</p>
          </div>
        </section>

        <Link to="/pro/chat/$id" params={{ id: job.providerId }} className={`${btnOutline} w-full gap-2`}><MessageSquare className="h-4 w-4" />Message Customer</Link>

        <div className="grid grid-cols-2 gap-3">
          {job.proStatus === "Pending" && <>
            <button className={btnDanger} onClick={() => { act("Cancelled", "Booking declined"); navigate({ to: "/pro/bookings" }); }}>Decline</button>
            <button className={btnPrimary} onClick={() => act("Confirmed", "Booking accepted")}>Accept</button>
          </>}
          {job.proStatus === "Confirmed" && <>
            <button className={btnDanger} onClick={() => act("Cancelled", "Booking cancelled")}>Cancel</button>
            <button className={btnPrimary} onClick={() => act("In Progress", "Work started")}>Start Work</button>
          </>}
          {job.proStatus === "In Progress" && (
            <button className={`${btnPrimary} col-span-2`} onClick={() => { if (!job.amount) { toast.error("Set the job price first"); return; } act("Completed", "Job completed"); }}>Mark as Completed</button>
          )}
        </div>
      </div>
    </ProPage>
  );
}
