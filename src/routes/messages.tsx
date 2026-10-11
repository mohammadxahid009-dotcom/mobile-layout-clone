import { createFileRoute, Link } from "@tanstack/react-router";
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

function MessagesPage() {
  const { chats } = useStore();
  const threads = Object.entries(chats).filter(([, m]) => m.length);
  return (
    <div className="mobile-app plain">
      <header className="page-head"><h1>Messages</h1></header>
      <main className="thread-list">
        {threads.map(([id, msgs]) => { const p = getProvider(id); if (!p) return null; const last = msgs[msgs.length - 1]; return (
          <Link key={id} to="/chat/$id" params={{ id }} className="thread">
            <span className="avatar-wrap"><img src={p.photo} alt={p.name} className="avatar-md" loading="lazy" width={816} height={816} /><i className="online-dot" /></span>
            <div><div className="thread-top"><h2>{p.name}</h2><time>{last.time}</time></div><p>{last.from === "me" ? "You: " : ""}{last.text}</p></div>
          </Link>); })}
        {threads.length === 0 && <div className="empty"><p>No messages yet. Message a provider from their profile.</p><Link to="/" className="primary-btn">Browse services</Link></div>}
      </main>
      <BottomNav active="Messages" />
    </div>
  );
}
