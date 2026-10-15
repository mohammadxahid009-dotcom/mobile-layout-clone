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
export type Job = Booking & {
  proStatus: JobStatus;
  amount: number;
  completedAt?: string | undefined;
  customer: string;
  customerPhone?: string | undefined;
  when: Date | null;
};

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
  addJob: (data: {
    customer: string;
    customerPhone?: string;
    service: string;
    date: string;
    time: string;
    location: string;
    description?: string;
    amount?: number;
    status?: JobStatus;
  }) => string;
  deleteJob: (id: string) => void;
  logPayment: (data: {
    customer: string;
    service: string;
    amount: number;
    date?: string;
    notes?: string;
  }) => string;
  addTestBooking: () => string;
  addTestReview: (review?: { author?: string; service?: string; rating?: number; text?: string }) => void;
};

const ProContext = createContext<Ctx | null>(null);
const KEY = "budgam-pro-v1";
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Booking dates are stored like "Tomorrow, 15 Oct" or "Thu, 16 Oct" or "8 Apr 2025" or YYYY-MM-DD. */
export function parseJobDate(s: string): Date | null {
  if (!s) return null;
  // If it's standard ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  const m = s.match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s*(\d{4})?/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2]!.toLowerCase());
  if (month < 0) return null;
  const now = new Date();
  let year = m[3] ? Number(m[3]) : now.getFullYear();
  const d = new Date(year, month, Number(m[1]));
  // No year given and the date looks far in the past: it's next year.
  if (!m[3] && d.getTime() < now.getTime() - 1000 * 60 * 60 * 24 * 180) {
    year += 1;
    d.setFullYear(year);
  }
  return d;
}

export const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export function ProStoreProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const [state, setState] = useState<ProState>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Purge legacy mock data references b1, b2 from stored meta
        if (parsed.meta) {
          delete parsed.meta["b1"];
          delete parsed.meta["b2"];
        }
        setState({ ...initial, ...parsed });
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  const jobs = useMemo<Job[]>(() => {
    return store.bookings.map(b => {
      const m = state.meta[b.id] ?? {};
      const fallback: JobStatus = b.status === "Pending" ? "Pending" : b.status;
      // Customer cancellations always win over the provider's saved status.
      const proStatus: JobStatus = b.status === "Cancelled" ? "Cancelled" : m.status ?? fallback;
      const svc = state.services.find(s => s.name.toLowerCase() === b.service.toLowerCase());
      return {
        ...b,
        proStatus,
        amount: m.amount ?? svc?.rate ?? 0,
        completedAt: m.completedAt,
        customer: b.customerName || (store.user.name && store.user.name !== "Haroon Rashid" ? store.user.name : "Customer"),
        customerPhone: b.customerPhone,
        when: parseJobDate(b.date),
      };
    });
  }, [store.bookings, store.user.name, state.meta, state.services]);

  const patchMeta = (id: string, p: JobMeta) =>
    setState(s => ({ ...s, meta: { ...s.meta, [id]: { ...s.meta[id], ...p } } }));

  const value: Ctx = {
    ...state,
    jobs,
    setJobStatus: (id, status) => {
      patchMeta(id, {
        status,
        ...(status === "Completed" ? { completedAt: new Date().toISOString() } : {}),
      });
      store.setStatus(id, status === "Completed" ? "Completed" : status === "Cancelled" ? "Cancelled" : "Pending");
    },
    setAmount: (id, amount) => patchMeta(id, { amount }),
    saveService: svc =>
      setState(s =>
        svc.id
          ? { ...s, services: s.services.map(x => (x.id === svc.id ? { ...x, ...svc, id: x.id } : x)) }
          : { ...s, services: [...s.services, { ...svc, id: crypto.randomUUID() }] }
      ),
    removeService: id => setState(s => ({ ...s, services: s.services.filter(x => x.id !== id) })),
    setAvailable: available => setState(s => ({ ...s, available })),
    setHours: hours => setState(s => ({ ...s, hours })),
    setProfile: profile => setState(s => ({ ...s, profile })),
    reportIssue: text =>
      setState(s => ({
        ...s,
        issues: [{ id: crypto.randomUUID(), text, date: new Date().toLocaleDateString("en-GB") }, ...s.issues],
      })),
    addJob: data => {
      const id = "job-" + crypto.randomUUID().slice(0, 8);
      const proStatus: JobStatus = data.status || "Pending";
      const bookingStatus = proStatus === "Completed" ? "Completed" : proStatus === "Cancelled" ? "Cancelled" : "Pending";
      
      store.addBooking({
        id,
        providerId: state.profile.name ? state.profile.name.toLowerCase().replace(/\s+/g, "-") : "pro-direct",
        service: data.service,
        date: data.date,
        time: data.time,
        location: data.location,
        description: data.description || "",
        status: bookingStatus,
        customerName: data.customer,
        customerPhone: data.customerPhone,
      });

      patchMeta(id, {
        status: proStatus,
        amount: data.amount,
        completedAt: proStatus === "Completed" ? new Date().toISOString() : undefined,
      });

      return id;
    },
    deleteJob: id => {
      store.deleteBooking(id);
      setState(s => {
        const nextMeta = { ...s.meta };
        delete nextMeta[id];
        return { ...s, meta: nextMeta };
      });
    },
    logPayment: data => {
      const id = "pay-" + crypto.randomUUID().slice(0, 8);
      const todayFormatted = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      const jobDate = data.date || todayFormatted;

      store.addBooking({
        id,
        providerId: state.profile.name ? state.profile.name.toLowerCase().replace(/\s+/g, "-") : "pro-direct",
        service: data.service,
        date: jobDate,
        time: "Completed Service",
        location: state.profile.area || "Budgam",
        description: data.notes || "Completed payment recorded directly",
        status: "Completed",
        customerName: data.customer,
      });

      patchMeta(id, {
        status: "Completed",
        amount: data.amount,
        completedAt: new Date().toISOString(),
      });

      return id;
    },
    addTestBooking: () => {
      const id = "job-" + crypto.randomUUID().slice(0, 8);
      const sampleNames = ["Bashir Ahmad", "Shabir Mir", "Tariq Lone", "Farooq Dar", "Bilal Wani"];
      const sampleServices = ["House Wiring", "Switchboard Repair", "Light & Fan Installation", "MCB Box Fixing", "Inverter Wiring"];
      const sampleAreas = ["Chadoora, Budgam", "Beerwah, Budgam", "Charar-i-Sharief, Budgam", "Magam, Budgam", "Ompora, Budgam"];

      const customer = sampleNames[Math.floor(Math.random() * sampleNames.length)]!;
      const service = sampleServices[Math.floor(Math.random() * sampleServices.length)]!;
      const location = sampleAreas[Math.floor(Math.random() * sampleAreas.length)]!;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = `Tomorrow, ${tomorrow.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

      store.addBooking({
        id,
        providerId: "pro-direct",
        service,
        date: dateStr,
        time: "10:00 AM - 12:00 PM",
        location,
        description: "Need inspection and complete repair work.",
        status: "Pending",
        customerName: customer,
        customerPhone: "+91 94190 " + Math.floor(10000 + Math.random() * 90000),
      });

      patchMeta(id, {
        status: "Pending",
        amount: 450,
      });

      return id;
    },
    addTestReview: review => {
      const sampleReviews = [
        { author: "Bashir Ahmad", service: "House Wiring", rating: 5, text: "Excellent and very neat work. Arrived on time and solved the issue quickly!" },
        { author: "Ghulam Nabi", service: "Switchboard Repair", rating: 5, text: "Very polite professional. Fixed all short circuits safely." },
        { author: "Mohammad Ashraf", service: "Inverter Wiring", rating: 4, text: "Good service, fair pricing and knowledgeable expert." },
      ];
      const pick = review || sampleReviews[Math.floor(Math.random() * sampleReviews.length)]!;
      store.addReview({
        bookingId: "test-rev-" + crypto.randomUUID().slice(0, 6),
        providerId: "pro-direct",
        service: pick.service || "Home Service",
        rating: pick.rating || 5,
        text: pick.text || "Great experience with this service provider!",
        author: pick.author || "Local Customer",
      });
    },
  };

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro() {
  const ctx = useContext(ProContext);
  if (!ctx) throw new Error("usePro must be inside ProStoreProvider");
  return ctx;
}

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
