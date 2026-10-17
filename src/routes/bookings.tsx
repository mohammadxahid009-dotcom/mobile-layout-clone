import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/app-ui";
import { getProvider } from "@/lib/data";
import { useStore, type Booking } from "@/lib/store";

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [
    { title: "My Bookings | Budgam Services" },
    { name: "description", content: "Track upcoming, completed and cancelled service bookings." },
    { property: "og:title", content: "My Bookings | Budgam Services" },
    { property: "og:description", content: "Track your service bookings in Budgam." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: BookingsPage,
});

const tabs = ["Upcoming", "Completed", "Cancelled"] as const;
const tabStatus = { Upcoming: "Pending", Completed: "Completed", Cancelled: "Cancelled" } as const;

function BookingsPage() {
  const { bookings, setStatus } = useStore();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Upcoming");
  const [detail, setDetail] = useState<Booking | null>(null);
  const [confirm, setConfirm] = useState<Booking | null>(null);
  const list = bookings.filter(b => b.status === tabStatus[tab]);
  const display = list;

  return (
    <div className="mobile-app plain bookings-page">
      <header className="page-head"><h1>My Bookings</h1></header>
      <div className="pill-row">{tabs.map(t => <button key={t} className={`pill ${tab === t ? "pill-active" : ""}`} onClick={() => setTab(t)}>{t}</button>)}</div>
      <main className="list-content">
        {display.map(b => {
          const p = getProvider(b.providerId);
          const providerName = p?.name ?? "Service Professional";
          return (
            <article key={b.id} className="booking-card">
              <div className="booking-top">
                {p?.photo ? (
                  <img src={p.photo} alt={providerName} className="avatar-md" loading="lazy" width={816} height={816} />
                ) : (
                  <div className="avatar-md grid place-items-center bg-primary/10 text-primary font-semibold text-base rounded-full">
                    {providerName.slice(0, 1)}
                  </div>
                )}
                <div className="booking-info">
                  <h2>{providerName}</h2><p className="muted">{b.service}</p>
                  <p className="meta sm"><CalendarDays />{b.date} • {b.time.replace(" - ", " - ")}</p>
                  <p className="meta sm"><MapPin />{b.location}</p>
                </div>
              </div>
              <div className="status-row"><span className={`status status-${b.status.toLowerCase()}`}>{b.status}</span></div>
              {b.status === "Pending" ? (
                <div className="btn-pair"><button className="outline-btn btn-sm" onClick={() => setDetail(b)}>View Details</button><button className="danger-btn btn-sm" onClick={() => setConfirm(b)}>Cancel</button></div>
              ) : <button className="outline-btn btn-sm full" onClick={() => setDetail(b)}>View Details</button>}
            </article>
          );
        })}
        {display.length === 0 && <div className="empty"><p>No {tab.toLowerCase()} bookings.</p>{tab === "Upcoming" && <Link to="/" className="primary-btn">Find a service</Link>}</div>}
      </main>
      <BottomNav active="Bookings" />

      {detail && (() => {
        const p = getProvider(detail.providerId);
        const providerName = p?.name ?? "Service Professional";
        return (
          <div className="panel-backdrop" onClick={() => setDetail(null)}>
            <section className="detail-panel" role="dialog" aria-modal="true" aria-label="Booking details" onClick={e => e.stopPropagation()}>
              <div className="panel-heading"><h2>Booking Details</h2><button className="icon-btn" aria-label="Close" onClick={() => setDetail(null)}><X /></button></div>
              <dl className="detail-list">
                <div><dt>Provider</dt><dd>{providerName}</dd></div><div><dt>Service</dt><dd>{detail.service}</dd></div>
                <div><dt>Date</dt><dd>{detail.date}</dd></div><div><dt>Time</dt><dd>{detail.time}</dd></div>
                <div><dt>Location</dt><dd>{detail.location}</dd></div><div><dt>Status</dt><dd>{detail.status}</dd></div>
                {detail.description && <div><dt>Notes</dt><dd>{detail.description}</dd></div>}
              </dl>
              {detail.status === "Completed" && <RateForm booking={detail} onDone={() => setDetail(null)} />}
              <div className="btn-pair">
                <Link to="/chat/$id" params={{ id: detail.providerId }} className="outline-btn">Message</Link>
                {p ? (
                  <Link to="/provider/$id" params={{ id: p.id }} className="primary-btn">View Provider</Link>
                ) : (
                  <button className="primary-btn" onClick={() => setDetail(null)}>Close</button>
                )}
              </div>
            </section>
          </div>
        );
      })()}

      {confirm && (
        <div className="panel-backdrop" onClick={() => setConfirm(null)}>
          <section className="detail-panel" role="alertdialog" aria-modal="true" aria-label="Cancel booking" onClick={e => e.stopPropagation()}>
            <h2 className="panel-title">Cancel this booking?</h2>
            <p className="panel-copy">{getProvider(confirm.providerId)?.name || "The service professional"} will be notified.</p>
            <div className="btn-pair"><button className="outline-btn" onClick={() => setConfirm(null)}>Keep</button><button className="danger-solid" onClick={() => { setStatus(confirm.id, "Cancelled"); setConfirm(null); toast("Booking cancelled"); }}>Cancel Booking</button></div>
          </section>
        </div>
      )}
    </div>
  );
}


function RateForm({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const { addReview, reviews, user } = useStore();
  const existing = reviews.find(r => r.bookingId === booking.id);
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [text, setText] = useState(existing?.text ?? "");
  return (
    <form className="sheet-form" onSubmit={e => { e.preventDefault(); addReview({ bookingId: booking.id, providerId: booking.providerId, service: booking.service, rating, text, author: user.name }); toast.success("Thanks for your review"); onDone(); }}>
      <p className="muted">{existing ? "Update your review" : "Rate this service"}</p>
      <div style={{ display: "flex", gap: 6 }}>{[1, 2, 3, 4, 5].map(n => <button type="button" key={n} aria-label={`${n} stars`} onClick={() => setRating(n)} style={{ fontSize: 24, color: n <= rating ? "var(--electrician-ink)" : "var(--border)" }}>★</button>)}</div>
      <textarea className="input" rows={2} value={text} onChange={e => setText(e.target.value)} placeholder="How was the service?" />
      <button className="primary-btn" type="submit">Submit Review</button>
    </form>
  );
}
