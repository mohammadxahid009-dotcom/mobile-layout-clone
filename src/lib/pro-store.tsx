import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useStore, type Booking } from "@/lib/store";

export type JobStatus = "Pending" | "Confirmed" | "In Progress" | "Completed" | "Cancelled";
export type ProService = { id: string; name: string; rate: number; active: boolean };
type JobMeta = { status?: JobStatus | undefined; amount?: number | undefined; completedAt?: string | undefined };
type ProState = {
  profile: { name: string; phone: string; area: string; bio: string };
  services: ProService[];
  available: boolean;
  hours: { from: string; to: string };
  meta: Record<string, JobMeta>;
  issues: { id: string; text: string; date: string }[];
};
export type Job = Booking & { proStatus: JobStatus; amount: number; completedAt?: string | undefined; customer: string; when: Date | null };

const initial: ProState = {
  profile: { name: "", phone: "", area: "", bio: "" },
  services: [],
  available: true,
  hours: { from: "08:00", to: "20:00" },
  meta: {},
  issues: [],
};

type Ctx = ProState & {
  jobs: Job[];
  setJobStatus: (id: string, status: JobStatus) => void;
  setAmount: (id: string, amount: number) => void;
  saveService: (s: Omit<ProService, "id"> & { id?: string }) => void;
  removeService: (id: string) => void;
  setAvailable: (v: boolean) => void;
  setHours: (h: ProState["hours"]) => void;
  setProfile: (p: ProState["profile"]) => void;
  reportIssue: (text: string) => void;
};

const ProContext = createContext<Ctx | null>(null);
const KEY = "budgam-pro-v1";
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Booking dates are stored like "Tomorrow, 15 Oct" or "Thu, 16 Oct" or "8 Apr 2025". */
export function parseJobDate(s: string): Date | null {
  const m = s.match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s*(\d{4})?/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2]!.toLowerCase());
  if (month < 0) return null;
  const now = new Date();
  let year = m[3] ? Number(m[3]) : now.getFullYear();
  const d = new Date(year, month, Number(m[1]));
  // No year given and the date looks far in the past: it's next year.
  if (!m[3] && d.getTime() < now.getTime() - 1000 * 60 * 60 * 24 * 180) { year += 1; d.setFullYear(year); }
  return d;
}

export const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export function ProStoreProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const [state, setState] = useState<ProState>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setState({ ...initial, ...JSON.parse(raw) }); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(state)); }, [state, ready]);

  const jobs = useMemo<Job[]>(() => store.bookings.map(b => {
    const m = state.meta[b.id] ?? {};
    const fallback: JobStatus = b.status === "Pending" ? "Pending" : b.status;
    // Customer cancellations always win over the provider's saved status.
    const proStatus: JobStatus = b.status === "Cancelled" ? "Cancelled" : m.status ?? fallback;
    const svc = state.services.find(s => s.name.toLowerCase() === b.service.toLowerCase());
    return { ...b, proStatus, amount: m.amount ?? svc?.rate ?? 0, completedAt: m.completedAt, customer: store.user.name || "Customer", when: parseJobDate(b.date) };
  }), [store.bookings, store.user.name, state.meta, state.services]);

  const patchMeta = (id: string, p: JobMeta) => setState(s => ({ ...s, meta: { ...s.meta, [id]: { ...s.meta[id], ...p } } }));

  const value: Ctx = {
    ...state,
    jobs,
    setJobStatus: (id, status) => {
      patchMeta(id, { status, ...(status === "Completed" ? { completedAt: new Date().toISOString() } : {}) });
      store.setStatus(id, status === "Completed" ? "Completed" : status === "Cancelled" ? "Cancelled" : "Pending");
    },
    setAmount: (id, amount) => patchMeta(id, { amount }),
    saveService: svc => setState(s => svc.id
      ? { ...s, services: s.services.map(x => x.id === svc.id ? { ...x, ...svc, id: x.id } : x) }
      : { ...s, services: [...s.services, { ...svc, id: crypto.randomUUID() }] }),
    removeService: id => setState(s => ({ ...s, services: s.services.filter(x => x.id !== id) })),
    setAvailable: available => setState(s => ({ ...s, available })),
    setHours: hours => setState(s => ({ ...s, hours })),
    setProfile: profile => setState(s => ({ ...s, profile })),
    reportIssue: text => setState(s => ({ ...s, issues: [{ id: crypto.randomUUID(), text, date: new Date().toLocaleDateString("en-GB") }, ...s.issues] })),
  };
  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro() {
  const ctx = useContext(ProContext);
  if (!ctx) throw new Error("usePro must be inside ProStoreProvider");
  return ctx;
}

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
