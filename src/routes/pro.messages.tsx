import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, UserRound } from "lucide-react";
import { Empty, ProPage, inputCls, proHead } from "@/components/pro-ui";
import { useStore } from "@/lib/store";
import { getProvider } from "@/lib/data";

export const Route = createFileRoute("/pro/messages")({
  head: () => proHead("Messages", "Conversations with your customers."),
  component: Messages,
});

function Messages() {
  const { chats, user } = useStore();
  const [q, setQ] = useState("");
  const threads = Object.entries(chats).filter(([, m]) => m.length > 0)
    .map(([id, m]) => ({ id, last: m[m.length - 1]!, service: getProvider(id)?.role ?? "Customer chat", unread: m[m.length - 1]!.from === "me" }))
    .filter(t => !q || t.last.text.toLowerCase().includes(q.toLowerCase()) || user.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <ProPage className="pro-messages-page" tab="Messages" title="Messages" back={false}>
      <div className="pro-message-content px-5">
        <div className="relative mb-3"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input className={`${inputCls} pl-9`} placeholder="Search messages" value={q} onChange={e => setQ(e.target.value)} /></div>
        <div className="divide-y divide-border">
          {threads.map(t => (
            <Link key={t.id} to="/pro/chat/$id" params={{ id: t.id }} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></div>
              <div className="min-w-0"><p className="truncate font-semibold">{user.name || "Customer"}</p><p className="truncate text-sm text-muted-foreground">{t.last.from === "them" ? "You: " : ""}{t.last.text}</p></div>
              <div className="flex flex-col items-end gap-1"><span className="text-[11px] text-muted-foreground">{t.last.time}</span>{t.unread && <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-label="Awaiting reply" />}</div>
            </Link>
          ))}
        </div>
        {threads.length === 0 && <Empty>No conversations yet.</Empty>}
      </div>
    </ProPage>
  );
}
