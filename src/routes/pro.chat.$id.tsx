import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { ProPage, inputCls, proHead } from "@/components/pro-ui";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/pro/chat/$id")({
  head: () => proHead("Chat", "Reply to your customer."),
  component: Chat,
});

function Chat() {
  const { id } = Route.useParams();
  const { chats, reply, user } = useStore();
  const msgs = chats[id] ?? [];
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  return (
    <ProPage title={user.name || "Customer"}>
      <div className="space-y-2 px-5 pb-24">
        {msgs.map(m => {
          const mine = m.from === "them"; // provider's own messages
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted"}`}>
                {m.text}<p className="mt-0.5 text-right text-[10px] opacity-70">{m.time}</p>
              </div>
            </div>
          );
        })}
        {msgs.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Start the conversation.</p>}
        <div ref={end} />
      </div>
      <form className="fixed inset-x-0 bottom-0 mx-auto flex max-w-[480px] gap-2 border-t border-border bg-background p-4"
        onSubmit={e => { e.preventDefault(); if (!text.trim()) return; reply(id, text.trim()); setText(""); }}>
        <input className={inputCls} placeholder="Type a message" value={text} onChange={e => setText(e.target.value)} />
        <button aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><SendHorizontal className="h-5 w-5" /></button>
      </form>
    </ProPage>
  );
}
