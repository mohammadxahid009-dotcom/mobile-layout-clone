import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ChevronRight, Headset, HelpCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { Card, ProPage, btnPrimary, inputCls, proHead } from "@/components/pro-ui";
import { usePro } from "@/lib/pro-store";

export const Route = createFileRoute("/pro/help")({
  head: () => proHead("Help & Support", "Contact support, read FAQs or report an issue."),
  component: Help,
});

const faqs = [
  ["How do I accept a booking?", "Open the booking from My Bookings and tap Accept. The customer sees it as confirmed."],
  ["How are earnings calculated?", "Each completed job adds its price to your earnings. Set the price on the booking before completing it."],
  ["Can I pause bookings?", "Yes. Turn off 'Available for bookings' in My Schedule."],
  ["How do customers review me?", "After you mark a job completed, the customer can rate it from their bookings."],
];

function Help() {
  const { reportIssue, issues } = usePro();
  const [panel, setPanel] = useState<"faq" | "report" | null>(null);
  const [text, setText] = useState("");
  const rows = [
    { key: "contact", label: "Contact Support", sub: "Talk to our support team", icon: Phone },
    { key: "faq", label: "Frequently Asked Questions", sub: "Find answers to common questions", icon: HelpCircle },
    { key: "report", label: "Report an Issue", sub: "Let us know about any problem", icon: AlertTriangle },
  ] as const;

  return (
    <ProPage tab="Profile" title="Help & Support">
      <div className="space-y-4 px-5">
        <div className="py-4 text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-primary/10 text-primary"><Headset className="h-12 w-12" /></div>
          <h2 className="mt-3 text-lg font-bold">We're here to help</h2>
          <p className="text-sm text-muted-foreground">Get quick support for any issues or questions you may have.</p>
        </div>
        {rows.map(({ key, label, sub, icon: Icon }) => (
          <div key={key}>
            {key === "contact" ? (
              <a href="mailto:support@budgamservices.app"><Row label={label} sub={sub} Icon={Icon} /></a>
            ) : (
              <button className="w-full text-left" onClick={() => setPanel(panel === key ? null : key)}><Row label={label} sub={sub} Icon={Icon} /></button>
            )}
            {panel === "faq" && key === "faq" && (
              <div className="mt-2 space-y-2">{faqs.map(([q, a]) => <details key={q} className="rounded-xl bg-muted p-3 text-sm"><summary className="cursor-pointer font-medium">{q}</summary><p className="mt-2 text-muted-foreground">{a}</p></details>)}</div>
            )}
            {panel === "report" && key === "report" && (
              <form className="mt-2 space-y-2" onSubmit={e => { e.preventDefault(); if (!text.trim()) return; reportIssue(text.trim()); setText(""); toast.success("Issue reported. We'll get back to you."); }}>
                <textarea className={inputCls} rows={3} placeholder="Describe the problem" value={text} onChange={e => setText(e.target.value)} />
                <button className={`${btnPrimary} w-full`}>Submit</button>
                {issues.length > 0 && <p className="text-xs text-muted-foreground">{issues.length} issue{issues.length > 1 ? "s" : ""} reported</p>}
              </form>
            )}
          </div>
        ))}
      </div>
    </ProPage>
  );
}

function Row({ label, sub, Icon }: { label: string; sub: string; Icon: typeof Phone }) {
  return (
    <Card className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0"><p className="font-semibold">{label}</p><p className="text-xs text-muted-foreground">{sub}</p></div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Card>
  );
}
