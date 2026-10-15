import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Paperclip, SendHorizontal, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { BackButton } from "@/components/app-ui";
import { getProvider } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/chat/$id")({
  loader: ({ params }) => { const p = getProvider(params.id); if (!p) throw notFound(); return { provider: p }; },
  head: ({ loaderData }) => {
    const t = loaderData ? `Chat with ${loaderData.provider.name} | Budgam Services` : "Not found";
    const d = "Message your service provider about updates or questions.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  component: ChatPage,
});

function ChatPage() {
  const { provider: p } = Route.useLoaderData();
  const { chats, send } = useStore();
  const msgs = chats[p.id] ?? [];
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!text.trim()) return; send(p.id, text.trim()); setText(""); };

  return (
    <div className="mobile-app plain chat-app">
      <header className="chat-head">
        <BackButton />
        <Link to="/provider/$id" params={{ id: p.id }} className="chat-who">
          <img src={p.photo} alt={p.name} className="avatar-sm" width={816} height={816} />
          <div><h1>{p.name}</h1><p><i className="online-dot inline" />Online</p></div>
        </Link>
      </header>
      <main className="chat-body">
        <p className="chat-hint">You can message the provider here<br />for any updates or questions.</p>
        {msgs.map(m => (
          <div key={m.id} className={`bubble ${m.from === "me" ? "bubble-me" : "bubble-them"}`}>
            <p>{m.text}</p><span>{m.time}{m.from === "me" && <CheckCheck />}</span>
          </div>
        ))}
        <div ref={end} />
      </main>
      <form className="composer" onSubmit={submit}>
        <button type="button" className="icon-btn" aria-label="Attach file" onClick={() => file.current?.click()}><Paperclip /></button>
        <input ref={file} type="file" hidden onChange={e => { const f = e.target.files?.[0]; if (f) { send(p.id, `📎 ${f.name}`); toast.success("File shared"); } e.target.value = ""; }} />
        <input className="composer-input" placeholder="Type a message..." value={text} onChange={e => setText(e.target.value)} aria-label="Message" />
        <button type="submit" className="send-btn" aria-label="Send" disabled={!text.trim()}><SendHorizontal /></button>
      </form>
    </div>
  );
}

