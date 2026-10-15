import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Card, Empty, ProPage, btnOutline, btnPrimary, inputCls, proHead } from "@/components/pro-ui";
import { rupees, usePro, type ProService } from "@/lib/pro-store";

export const Route = createFileRoute("/pro/services")({
  head: () => proHead("My Services", "Add, price and switch on or off the services you offer."),
  component: Services,
});

type Draft = { id?: string; name: string; rate: string; active: boolean };

function Services() {
  const { services, saveService, removeService } = usePro();
  const [draft, setDraft] = useState<Draft | null>(null);
  const edit = (s?: ProService) => setDraft(s ? { id: s.id, name: s.name, rate: String(s.rate), active: s.active } : { name: "", rate: "", active: true });

  return (
    <ProPage tab="Profile" title="My Services" right={<button className={`${btnPrimary} gap-1 px-3 py-2`} onClick={() => edit()}><Plus className="h-4 w-4" />Add Service</button>}>
      <div className="space-y-3 px-5">
        {draft && (
          <Card>
            <form className="space-y-3" onSubmit={e => {
              e.preventDefault();
              const rate = Number(draft.rate);
              if (!draft.name.trim() || !(rate > 0)) { toast.error("Enter a service name and rate"); return; }
              saveService({ ...(draft.id ? { id: draft.id } : {}), name: draft.name.trim(), rate, active: draft.active });
              setDraft(null); toast.success("Service saved");
            }}>
              <input className={inputCls} placeholder="Service name, e.g. Electrical Repair" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
              <input className={inputCls} inputMode="numeric" placeholder="Rate per hour (₹)" value={draft.rate} onChange={e => setDraft({ ...draft, rate: e.target.value.replace(/\D/g, "") })} />
              <div className="grid grid-cols-2 gap-3"><button type="button" className={btnOutline} onClick={() => setDraft(null)}>Cancel</button><button className={btnPrimary}>Save</button></div>
            </form>
          </Card>
        )}
        {services.map(s => (
          <Card key={s.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Wrench className="h-5 w-5" /></div>
            <div className="min-w-0"><p className="truncate font-semibold">{s.name}</p><p className="text-sm text-muted-foreground">{rupees(s.rate)}/hr</p></div>
            <div className="flex items-center gap-1">
              <button onClick={() => saveService({ ...s, active: !s.active })} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{s.active ? "Active" : "Paused"}</button>
              <button aria-label={`Edit ${s.name}`} className="rounded-full p-1.5 hover:bg-muted" onClick={() => edit(s)}><Pencil className="h-4 w-4" /></button>
              <button aria-label={`Delete ${s.name}`} className="rounded-full p-1.5 text-destructive hover:bg-destructive/10" onClick={() => { removeService(s.id); toast("Service removed"); }}><Trash2 className="h-4 w-4" /></button>
            </div>
          </Card>
        ))}
        {services.length === 0 && !draft && <Empty>No services yet. Tap "Add Service" to list what you offer.</Empty>}
      </div>
    </ProPage>
  );
}
