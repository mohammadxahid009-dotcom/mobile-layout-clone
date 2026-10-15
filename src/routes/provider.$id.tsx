import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MapPin, BriefcaseBusiness, Clock, Phone, MessageSquareText, BadgeCheck, Star } from "lucide-react";
import { BackButton, Rating, Verified } from "@/components/app-ui";
import { getProvider } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/provider/$id")({
  loader: ({ params }) => { const p = getProvider(params.id); if (!p) throw notFound(); return { provider: p }; },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.provider.name} – ${loaderData.provider.role} | Budgam Services` : "Not found";
    const d = loaderData ? loaderData.provider.about : "";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" }] };
  },
  component: ProviderPage,
});

function ProviderPage() {
  const { provider: p } = Route.useLoaderData();
  const { saved, toggleSaved } = useStore();
  const isSaved = saved.includes(p.id);
  const [slide, setSlide] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? p.services : p.services.slice(0, 3);
  const extra = p.services.length - 3;

  const heart = <button className={`heart-btn ${isSaved ? "heart-on" : ""}`} aria-label={isSaved ? "Remove from saved" : "Save provider"} onClick={() => toggleSaved(p.id)}><Heart fill={isSaved ? "currentColor" : "none"} /></button>;
  const tags = <div className="tag-row">{shown.map(s => <span key={s} className="tag">{s}</span>)}{!showAll && extra > 0 && <button className="tag" onClick={() => setShowAll(true)}>+{extra} more</button>}</div>;

  if (p.gallery) {
    return (
      <div className="mobile-app plain with-cta">
        <div className="gallery" onClick={() => setSlide((slide + 1) % p.gallery!.length)}>
          <img src={p.gallery[slide]} alt={`${p.name} at work`} width={1024} height={768} />
          <BackButton className="floating left" />
          <div className="floating right" onClick={e => e.stopPropagation()}>{heart}</div>
          <span className="slide-count">{slide + 1}/{p.gallery.length}</span>
        </div>
        <section className="detail-block">
          <div className="name-row"><h1>{p.name}</h1>{p.verified && <Verified />}</div>
          <Rating value={p.rating} reviews={p.reviews} />
          <p className="meta lg">{p.years}+ years experience</p>
          <p className="meta lg"><MapPin />{p.area}</p>
          {tags}
        </section>
        <section className="detail-block bordered">
          <h2>About</h2>
          <p className="body-copy">{p.about}</p>
          <div className="hours"><Clock /><div><strong>Working Hours</strong><span>{p.hours}</span></div></div>
        </section>
        <div className="sticky-cta"><Link to="/book/$id" params={{ id: p.id }} className="primary-btn">Book Now</Link></div>
      </div>
    );
  }

  return (
    <div className="mobile-app plain with-cta">
      <div className="cover">
        <img src={p.cover} alt="" width={1024} height={1024} />
        <BackButton className="floating left ghost" />
        <div className="floating right">{heart}</div>
        <img src={p.photo} alt={p.name} className="cover-avatar" width={816} height={816} />
      </div>
      <section className="detail-block cover-pad">
        <div className="name-row"><h1>{p.name}</h1>{p.verified && <BadgeCheck className="inline-badge" fill="currentColor" />}</div>
        <p className="role">{p.role}</p>
        <span className="rating"><Star fill="currentColor" /><b>{p.rating.toFixed(1)}</b><span>({p.reviews} reviews)</span></span>
        <p className="meta lg"><BriefcaseBusiness />{p.years}+ years experience</p>
        <p className="meta lg"><MapPin />{p.area}</p>
      </section>
      <section className="detail-block bordered"><h2>Services</h2>{tags}</section>
      <section className="detail-block bordered">
        <h2>About</h2>
        <p className="body-copy">{p.about}</p>
        <div className="hours"><Clock /><div><strong>Working Hours</strong><span>{p.hours}</span></div></div>
        <Link to="/book/$id" params={{ id: p.id }} className="link-btn">Book a visit →</Link>
      </section>
      <div className="sticky-cta split">
        <a href="tel:+910000000000" className="outline-btn"><Phone fill="currentColor" />Call</a>
        <Link to="/chat/$id" params={{ id: p.id }} className="primary-btn"><MessageSquareText />Message</Link>
      </div>
    </div>
  );
}

