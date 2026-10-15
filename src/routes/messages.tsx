import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, MessageSquare } from "lucide-react";
import { BottomNav } from "@/components/app-ui";
import { getProvider } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [
    { title: "Messages | Budgam Services" },
    { name: "description", content: "Chat with your local service providers." },
    { property: "og:title", content: "Messages | Budgam Services" },
    { property: "og:description", content: "Chat with your local service providers." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: MessagesPage,
});

const tabs = ["All", "Unread", "Providers"] as const;

function MessagesPage() {
  const { chats, bookings } = useStore();
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [search, setSearch] = useState("");

  const threads = Object.entries(chats)
    .filter(([, msgs]) => msgs.length > 0)
    .map(([id, msgs]) => {
      const p = getProvider(id);
      const relatedBooking = bookings.find(b => b.providerId === id);
      const name = p?.name ?? relatedBooking?.service ?? "Service Professional";
      const role = p?.role ?? relatedBooking?.service ?? "Support & Service";
      const photo = p?.photo;
      const last = msgs[msgs.length - 1]!;
      const unread = last.from === "them";
      return { id, name, role, photo, last, unread };
    })
    .filter(t => {
      if (tab === "Unread") return t.unread;
      return true;
    })
    .filter(t => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.last.text.toLowerCase().includes(q) || t.role.toLowerCase().includes(q);
    });

  return (
    <div className="mobile-app plain messages-page">
      <header className="page-head">
        <h1>Messages</h1>
      </header>

      {/* Filter and search options */}
      <div className="messages-controls">
        <div className="pill-row">
          {tabs.map(t => (
            <button
              key={t}
              type="button"
              className={`pill ${tab === t ? "pill-active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="messages-search-wrap">
          <Search className="messages-search-icon" />
          <input
            type="search"
            className="messages-search-input"
            placeholder="Search chats or providers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <main className="thread-list">
        {threads.map(t => (
          <Link key={t.id} to="/chat/$id" params={{ id: t.id }} className="thread">
            <span className="avatar-wrap">
              {t.photo ? (
                <img src={t.photo} alt={t.name} className="avatar-md" loading="lazy" width={816} height={816} />
              ) : (
                <div className="avatar-md grid place-items-center bg-primary/10 text-primary font-bold text-base rounded-full">
                  {t.name.slice(0, 1)}
                </div>
              )}
              <i className="online-dot" />
            </span>
            <div>
              <div className="thread-top">
                <h2>{t.name}</h2>
                <time>{t.last.time}</time>
              </div>
              <p className={t.unread ? "font-medium text-foreground" : ""}>
                {t.last.from === "me" ? "You: " : ""}{t.last.text}
              </p>
            </div>
            {t.unread && <span className="unread-indicator" />}
          </Link>
        ))}

        {threads.length === 0 && (
          <div className="empty messages-empty">
            <div className="empty-icon-circle">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <h3 className="empty-title">No messages yet</h3>
            <p className="empty-desc">
              {search
                ? `No conversations match "${search}".`
                : tab === "Unread"
                ? "You're all caught up! No unread messages."
                : "Connect with local service professionals directly from their profiles or bookings."}
            </p>
            <Link to="/" className="primary-btn">
              Browse services
            </Link>
          </div>
        )}
      </main>

      <BottomNav active="Messages" />
    </div>
  );
}
