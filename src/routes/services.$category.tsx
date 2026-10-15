import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, SlidersHorizontal, BriefcaseBusiness, Phone, MessageSquareText, BadgeCheck, X } from "lucide-react";
import { TopBar, Rating, Verified } from "@/components/app-ui";
import { getCategory, providers } from "@/lib/data";

export const Route = createFileRoute("/services/$category")({
  loader: ({ params }) => { const c = getCategory(params.category); if (!c) throw notFound(); return { category: c }; },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.category.plural} in Budgam | Budgam Services` : "Not found";
    const d = loaderData ? `Compare verified ${loaderData.category.plural.toLowerCase()} in Budgam by rating, experience and price.` : "";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  component: ProviderList,
});

const segments = ["All", "Residential", "Commercial"] as const;
const sorts = ["Top rated", "Most experienced", "Lowest price"] as const;

function ProviderList() {
  const { category } = Route.useLoaderData();
  const [segment, setSegment] = useState<(typeof segments)[number]>("All");
  const [sort, setSort] = useState<(typeof sorts)[number]>("Top rated");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [todayOnly, setTodayOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const list = providers
    .filter(p => p.category === category.slug)
    .filter(p => segment === "All" || p.segments.includes(segment))
    .filter(p => !verifiedOnly || p.verified)
    .filter(p => !todayOnly || p.availableToday)
    .sort((a, b) => sort === "Top rated" ? b.rating - a.rating : sort === "Most experienced" ? b.years - a.years : a.rate - b.rate);

  return (
    <div className="mobile-app plain">
      <TopBar title={category.plural} sub={<p className="top-sub"><MapPin fill="currentColor" />Budgam</p>} right={<button className="icon-btn" aria-label="Filters" onClick={() => setFiltersOpen(true)}><SlidersHorizontal /></button>} />
      <div className="pill-row">
        {segments.map(s => <button key={s} className={`pill ${segment === s ? "pill-active" : ""}`} onClick={() => setSegment(s)}>{s}</button>)}
      </div>
      <main className="list-content">
        {list.map(p => (
          <article key={p.id} className="provider-card">
            <Link to="/provider/$id" params={{ id: p.id }} className="provider-card-link">
              <img src={p.photo} alt={p.name} className="avatar-lg" loading="lazy" width={816} height={816} />
              <div className="provider-info">
                <h2>{p.name}</h2>
                <Rating value={p.rating} reviews={p.reviews} />
                <p className="meta"><BriefcaseBusiness />{p.years}+ years experience</p>
                <div className="chips">{p.verified && <Verified />}{p.availableToday && <span className="chip-available"><span className="dot" />Available today</span>}</div>
                <p className="meta"><MapPin />{p.area}</p>
                <p className="price">₹{p.rate}/hr <small>(approx)</small></p>
              </div>
            </Link>
            <div className="card-actions">
              <a href="tel:+910000000000" className="round-call" aria-label={`Call ${p.name}`}><Phone fill="currentColor" /></a>
              <Link to="/chat/$id" params={{ id: p.id }} className="square-msg" aria-label={`Message ${p.name}`}><MessageSquareText /></Link>
            </div>
          </article>
        ))}
        {list.length === 0 && (
          <div className="empty">
            <p>No verified {category.plural.toLowerCase()} available yet in this area.</p>
            <Link to="/" className="primary-btn mt-3 inline-block">Browse all categories</Link>
          </div>
        )}
      </main>
      {filtersOpen && (
        <div className="panel-backdrop" onClick={() => setFiltersOpen(false)}>
          <section className="detail-panel" role="dialog" aria-modal="true" aria-label="Filters" onClick={e => e.stopPropagation()}>
            <div className="panel-heading"><h2>Filters</h2><button className="icon-btn" aria-label="Close" onClick={() => setFiltersOpen(false)}><X /></button></div>
            <p className="filter-label">Sort by</p>
            <div className="pill-row tight">{sorts.map(s => <button key={s} className={`pill ${sort === s ? "pill-active" : ""}`} onClick={() => setSort(s)}>{s}</button>)}</div>
            <label className="toggle-row"><span><BadgeCheck />Verified only</span><input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} /></label>
            <label className="toggle-row"><span><span className="dot" />Available today</span><input type="checkbox" checked={todayOnly} onChange={e => setTodayOnly(e.target.checked)} /></label>
            <button className="primary-btn" onClick={() => setFiltersOpen(false)}>Show {list.length} results</button>
          </section>
        </div>
      )}
    </div>
  );
}

