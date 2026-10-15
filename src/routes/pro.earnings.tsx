import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TrendingUp, Wrench, BarChart3, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, Empty, ProPage, btnPrimary, inputCls, proHead } from "@/components/pro-ui";
import { rupees, usePro } from "@/lib/pro-store";

export const Route = createFileRoute("/pro/earnings")({
  head: () => proHead("Earnings", "Track earnings from completed jobs by week, month and all time."),
  component: Earnings,
});

const periods = ["This Week", "This Month", "All Time"] as const;
const DAY = 86400000;

function Earnings() {
  const { jobs, logPayment, services } = usePro();
  const [period, setPeriod] = useState<(typeof periods)[number]>("This Week");
  const [adding, setAdding] = useState(false);
  const [customer, setCustomer] = useState("");
  const [service, setService] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const done = jobs.filter(j => j.proStatus === "Completed");
  const at = (j: (typeof done)[number]) => (j.completedAt ? new Date(j.completedAt) : j.when ?? new Date(0)).getTime();
  const now = Date.now();
  const inPeriod = done.filter(j => period === "All Time" ? true : period === "This Week" ? now - at(j) <= 7 * DAY
    : new Date(at(j)).getMonth() === new Date().getMonth() && new Date(at(j)).getFullYear() === new Date().getFullYear());
  const total = inPeriod.reduce((s, j) => s + j.amount, 0);
  const last7 = done.filter(j => now - at(j) <= 7 * DAY).reduce((s, j) => s + j.amount, 0);
  const prev7 = done.filter(j => now - at(j) > 7 * DAY && now - at(j) <= 14 * DAY).reduce((s, j) => s + j.amount, 0);
  const change = prev7 ? Math.round(((last7 - prev7) / prev7) * 100) : null;

  const groups = Object.values(inPeriod.reduce<Record<string, { name: string; count: number; sum: number }>>((acc, j) => {
    const g = acc[j.service] ??= { name: j.service, count: 0, sum: 0 }; g.count++; g.sum += j.amount; return acc;
  }, {})).sort((a, b) => b.sum - a.sum);

  const savePayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = Number(amount);
    if (!customer.trim() || !service.trim() || value <= 0) return;
    logPayment({ customer: customer.trim(), service: service.trim(), amount: value, notes: notes.trim() });
    setCustomer(""); setService(""); setAmount(""); setNotes(""); setAdding(false);
    toast.success("Completed payment recorded");
  };

  return (
    <ProPage tab="Profile" title="Earnings" right={<button className={`${btnPrimary} gap-1 px-3 py-2`} onClick={() => setAdding(v => !v)}><Plus className="h-4 w-4" />{adding ? "Close" : "Record Payment"}</button>}>
      <div className="space-y-5 px-5">
        {adding && <Card><form className="grid gap-3 sm:grid-cols-2" onSubmit={savePayment}>
          <input className={inputCls} required placeholder="Customer name" value={customer} onChange={e => setCustomer(e.target.value)} />
          <input className={inputCls} required placeholder="Service provided" list="earnings-service-options" value={service} onChange={e => setService(e.target.value)} />
          <datalist id="earnings-service-options">{services.map(s => <option key={s.id} value={s.name} />)}</datalist>
          <input className={inputCls} required inputMode="numeric" placeholder="Amount received (₹)" value={amount} onChange={e => setAmount(e.target.value.replace(/\\D/g, ""))} />
          <input className={`${inputCls} sm:col-span-2`} placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
          <button className={`${btnPrimary} sm:col-span-2`}>Save Completed Payment</button>
          <p className="sm:col-span-2 text-xs text-muted-foreground">This creates a completed job record and updates your earnings on this device.</p>
        </form></Card>}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-primary p-5 text-primary-foreground">
          <div className="min-w-0">
            <p className="text-sm opacity-80">Total Earnings ({period})</p>
            <p className="text-3xl font-bold">{rupees(total)}</p>
            <p className="mt-1 flex items-center gap-1 text-xs opacity-80"><TrendingUp className="h-3.5 w-3.5" />{change === null ? `${rupees(last7)} in the last 7 days` : `${change >= 0 ? "+" : ""}${change}% vs previous 7 days`}</p>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-foreground/15"><BarChart3 className="h-7 w-7" /></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {periods.map(p => <button key={p} onClick={() => setPeriod(p)} className={`rounded-xl py-2.5 text-sm font-medium ${period === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{p}</button>)}
        </div>
        <div className="space-y-3">
          {groups.map(g => (
            <Card key={g.name} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Wrench className="h-5 w-5" /></div>
              <div className="min-w-0"><p className="truncate font-semibold">{g.name}</p><p className="text-xs text-muted-foreground">{g.count} booking{g.count > 1 ? "s" : ""} • Completed</p></div>
              <b>{rupees(g.sum)}</b>
            </Card>
          ))}
          {groups.length === 0 && <Empty>No completed jobs in this period yet. Record a completed payment when you finish a service.</Empty>}
        </div>
      </div>
    </ProPage>
  );
}
