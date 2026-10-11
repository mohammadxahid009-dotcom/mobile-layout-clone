import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, MapPin, ChevronDown, Search, Zap, Droplet, Wrench, Hammer, Smartphone, CarFront, ShieldCheck, ChevronRight, House, CalendarDays, MessageSquare, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import lake from "@/assets/kashmir-lake.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Budgam Services | Trusted Local Professionals" },
    { name: "description", content: "Find local electricians, plumbers, carpenters and other service professionals in Budgam." },
    { property: "og:title", content: "Budgam Services | Trusted Local Professionals" },
    { property: "og:description", content: "Find trusted local service providers in Budgam." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

const services = [
  { name: "Electrician", icon: Zap, tone: "electrician" },
  { name: "Plumber", icon: Droplet, tone: "plumber" },
  { name: "Appliance Repair", icon: Wrench, tone: "appliance" },
  { name: "Carpenter", icon: Hammer, tone: "carpenter" },
  { name: "Mobile & Telecom", icon: Smartphone, tone: "mobile" },
  { name: "Mechanic", icon: CarFront, tone: "mechanic" },
];

function Index() {
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState<string | null>(null);
  const [location, setLocation] = useState("Budgam");
  const filtered = services.filter(service => service.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="mobile-app">
      <header className="landscape-header">
        <img className="landscape-photo" src={lake} alt="Snow-capped mountains and a forest-lined lake in Kashmir" width={1024} height={1024} />
        <div className="landscape-shade" />
        <div className="header-content">
          <div className="location-row">
            <Button variant="ghost" className="location-button" onClick={() => setPanel("Location")}><MapPin fill="currentColor" /><span>{location}</span><ChevronDown /></Button>
            <Button variant="ghost" size="icon" className="notification-button" aria-label="Notifications" onClick={() => setPanel("Notifications")}><Bell /><span className="notification-dot" /></Button>
          </div>
          <div className="greeting"><h1>Hi there!</h1><p>Find trusted local service providers<br className="wide-break" /> in {location}</p></div>
          <div className="search-field"><Search aria-hidden="true" /><input aria-label="Search for a service" placeholder="Search for a service (e.g. electrician)" value={query} onChange={event => setQuery(event.target.value)} />{query && <Button variant="ghost" size="icon" aria-label="Clear search" onClick={() => setQuery("")}><X /></Button>}</div>
        </div>
      </header>
      <main className="home-content">
        <div className="section-heading"><h2>Popular Services</h2><Button variant="link" onClick={() => { setQuery(""); setPanel("All Services"); }}>See all</Button></div>
        <div className="service-grid">
          {filtered.map(({ name, icon: Icon, tone }) => <Button key={name} variant="ghost" className={`service-tile service-${tone}`} onClick={() => setPanel(name)}><span className="service-icon"><Icon strokeWidth={2.8} /></span><span className="service-name">{name}</span></Button>)}
        </div>
        {filtered.length === 0 && <p className="no-results">No services found for “{query}”.</p>}
        <Button variant="ghost" className="verified-strip" onClick={() => setPanel("Verified Professionals")}><ShieldCheck className="verified-shield" fill="currentColor" /><span><strong>Verified Professionals</strong><small>Background checked &amp; trusted</small></span><ChevronRight className="verified-arrow" /></Button>
      </main>
      <nav className="bottom-nav" aria-label="Main navigation">
        {[{ name: "Home", icon: House }, { name: "Bookings", icon: CalendarDays }, { name: "Messages", icon: MessageSquare }, { name: "Profile", icon: UserRound }].map(({ name, icon: Icon }) => <Button key={name} variant="ghost" className={`nav-item ${name === "Home" ? "nav-active" : ""}`} aria-current={name === "Home" ? "page" : undefined} onClick={() => { if (name === "Home") { setPanel(null); setQuery(""); } else setPanel(name); }}><Icon fill={name === "Home" ? "currentColor" : "none"} /><span>{name}</span>{name === "Home" && <i />}</Button>)}
      </nav>
      {panel && <div className="panel-backdrop" onClick={() => setPanel(null)}><section className="detail-panel" role="dialog" aria-modal="true" aria-label={panel} onClick={event => event.stopPropagation()}><div className="panel-heading"><h2>{panel}</h2><Button variant="ghost" size="icon" aria-label="Close" onClick={() => setPanel(null)}><X /></Button></div>
        {panel === "Location" ? <label className="location-label">Your location<input value={location} onChange={event => setLocation(event.target.value)} /><Button onClick={() => setPanel(null)}>Done</Button></label> : panel === "All Services" ? <div className="all-services">{services.map(({ name, icon: Icon }) => <Button variant="outline" key={name} onClick={() => setPanel(name)}><Icon />{name}<ChevronRight /></Button>)}</div> : <p className="panel-copy">{panel === "Notifications" ? "You're all caught up. No notifications yet." : panel === "Bookings" ? "You have no bookings yet." : panel === "Messages" ? "You have no messages yet." : panel === "Profile" ? "Your profile is not set up yet." : panel === "Verified Professionals" ? "Background checked & trusted local professionals." : `No ${panel.toLowerCase()} providers listed in ${location} yet.`}</p>}
      </section></div>}
    </div>
  );
}
