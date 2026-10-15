import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, Clock, MapPin, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { TopBar, Rating, Verified } from "@/components/app-ui";
import { getProvider } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/book/$id")({
  loader: ({ params }) => { const p = getProvider(params.id); if (!p) throw notFound(); return { provider: p }; },
  head: ({ loaderData }) => {
    const t = loaderData ? `Book ${loaderData.provider.name} | Budgam Services` : "Not found";
    const d = "Choose a service, date, time and location to send a booking request.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  component: BookPage,
});

const times = ["8:00 AM - 10:00 AM", "10:00 AM - 12:00 PM", "12:00 PM - 2:00 PM", "2:00 PM - 4:00 PM", "4:00 PM - 6:00 PM", "6:00 PM - 8:00 PM"];
const locations = ["Chadoora, Budgam", "Beerwah, Budgam", "Magam, Budgam", "Khansahib, Budgam", "Budgam Town"];

function BookPage() {
  const { provider: p } = Route.useLoaderData();
  const { addBooking } = useStore();
  const navigate = useNavigate();
  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return i === 0 ? `Tomorrow, ${label}` : `${d.toLocaleDateString("en-GB", { weekday: "short" })}, ${label}`;
  }), []);
  const [service, setService] = useState<string>(p.services[0] ?? "");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<string>(dates[0] ?? "");
  const [time, setTime] = useState<string>(times[1]!);
  const [location, setLocation] = useState<string>(locations[0]!);

  const submit = () => {
    addBooking({ providerId: p.id, service, description, date: date.replace(/ \d{4}$/, ""), time, location });
    toast.success("Booking request sent", { description: `${p.name} will confirm shortly.` });
    navigate({ to: "/bookings" });
  };

  return (
    <div className="mobile-app plain with-cta">
      <TopBar title="Book Service" />
      <main className="form-content">
        <div className="mini-card">
          <img src={p.photo} alt={p.name} className="avatar-lg" width={816} height={816} />
          <div><h2>{p.name}</h2><Rating value={p.rating} reviews={p.reviews} />{p.verified && <Verified />}</div>
        </div>
        <h3 className="form-title">Service Details</h3>
        <Field label="Service type"><Select value={service} onChange={setService} options={p.services} /></Field>
        <Field label="Description (optional)"><textarea className="input" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Need to fix wiring for kitchen and install one ceiling light." /></Field>
        <Field label="Preferred Date" big><Select icon={<CalendarDays />} value={date} onChange={setDate} options={dates} /></Field>
        <Field label="Preferred Time" big><Select icon={<Clock />} value={time} onChange={setTime} options={times} /></Field>
        <Field label="Location" big><Select icon={<MapPin fill="currentColor" />} value={location} onChange={setLocation} options={locations} /></Field>
      </main>
      <div className="sticky-cta"><button className="primary-btn" onClick={submit}>Send Booking Request</button></div>
    </div>
  );
}

function Field({ label, big, children }: { label: string; big?: boolean; children: React.ReactNode }) {
  return <label className={`field ${big ? "field-big" : ""}`}><span>{label}</span>{children}</label>;
}

function Select({ value, onChange, options, icon }: { value: string; onChange: (v: string) => void; options: string[]; icon?: React.ReactNode }) {
  return (
    <div className="select-wrap">
      {icon}
      <select value={value} onChange={e => onChange(e.target.value)} className={icon ? "has-icon" : ""}>{options.map(o => <option key={o}>{o}</option>)}</select>
      <ChevronDown className="chev" />
    </div>
  );
}

