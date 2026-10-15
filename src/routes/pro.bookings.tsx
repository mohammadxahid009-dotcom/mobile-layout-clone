import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Empty, JobSummary, ProPage, btnDanger, btnOutline, btnPrimary, inputCls, proHead } from "@/components/pro-ui";
import { usePro, type Job } from "@/lib/pro-store";

export const Route = createFileRoute("/pro/bookings")({
  head: () => proHead("My Bookings", "Accept, decline and manage customer booking requests."),
  component: ProBookings,
});

const tabs = ["Upcoming", "Completed", "Cancelled"] as const;
const inTab = (j: Job, t: (typeof tabs)[number]) =>
  t === "Upcoming" ? ["Pending", "Confirmed", "In Progress"].includes(j.proStatus) : j.proStatus === t;

function ProBookings() {
  const { jobs, setJobStatus, addJob, services } = usePro();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Upcoming");
  const [adding, setAdding] = useState(false);
  const [customer, setCustomer] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const saveJob = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customer.trim() || !service.trim() || !date || !time || !location.trim()) return;
    const start = new Date(`2000-01-01T${time}`);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    addJob({
      customer: customer.trim(),
      customerPhone: customerPhone.trim() || undefined,
      service: service.trim(),
      date: new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
      time: `${fmt(start)} - ${fmt(end)}`,
      location: location.trim(),
      description: description.trim(),
      amount: amount ? Number(amount) : undefined,
    });
    setCustomer(""); setCustomerPhone(""); setService(""); setLocation(""); setDescription(""); setAmount("");
    setAdding(false); setTab("Upcoming"); toast.success("Booking added to your schedule");
  };
  const list = jobs.filter(j => inTab(j, tab));

  return (
    <ProPage className="pro-bookings-page" tab="Bookings" title="My Bookings" back={false} right={<button className={`${btnPrimary} px-3 py-2`} onClick={() => setAdding(v => !v)}>{adding ? "Close" : "Add Booking"}</button>}>
      {adding && <div className="px-5 pb-4"><Card><form className="grid gap-3 sm:grid-cols-2" onSubmit={saveJob}>
        <input className={inputCls} required placeholder="Customer name" value={customer} onChange={e => setCustomer(e.target.value)} />
        <input className={inputCls} placeholder="Phone (optional)" inputMode="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
        <input className={inputCls} required placeholder="Service" list="pro-service-options" value={service} onChange={e => setService(e.target.value)} />
        <datalist id="pro-service-options">{services.map(s => <option key={s.id} value={s.name} />)}</datalist>
        <input className={inputCls} required type="date" value={date} onChange={e => setDate(e.target.value)} />
        <input className={inputCls} required type="time" value={time} onChange={e => setTime(e.target.value)} />
        <input className={`${inputCls} sm:col-span-2`} required placeholder="Service location" value={location} onChange={e => setLocation(e.target.value)} />
        <textarea className={`${inputCls} sm:col-span-2`} rows={2} placeholder="Job notes (optional)" value={description} onChange={e => setDescription(e.target.value)} />
        <input className={`${inputCls} sm:col-span-2`} inputMode="numeric" placeholder="Agreed price in ₹ (optional)" value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ""))} />
        <button className={`${btnPrimary} sm:col-span-2`}>Save Booking</button>
      </form></Card></div>}
      <div className="pro-booking-tabs flex gap-2 overflow-x-auto px-5 pb-4">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {t} ({jobs.filter(j => inTab(j, t)).length})
          </button>
        ))}
      </div>
      <div className="pro-booking-list space-y-3 px-5">
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
