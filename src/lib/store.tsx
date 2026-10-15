import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Booking = {
  id: string;
  providerId: string;
  service: string;
  date: string;
  time: string;
  location: string;
  description: string;
  status: "Pending" | "Completed" | "Cancelled";
  customerName?: string;
  customerPhone?: string;
};
export type Message = { id: string; from: "me" | "them"; text: string; time: string };
export type Review = { id: string; bookingId: string; providerId: string; service: string; rating: number; text: string; author: string; date: string };
type State = { reviews: Review[]; bookings: Booking[]; chats: Record<string, Message[]>; saved: string[]; user: { name: string; email: string }; loggedIn: boolean };

const initial: State = {
  reviews: [],
  bookings: [],
  chats: {},
  saved: [],
  user: { name: "Haroon Rashid", email: "haroonrashid@gmail.com" },
  loggedIn: true,
};

type Ctx = State & {
  addBooking: (b: Omit<Booking, "id" | "status"> & { id?: string; status?: Booking["status"] }) => string;
  deleteBooking: (id: string) => void;
  setStatus: (id: string, status: Booking["status"]) => void;
  send: (providerId: string, text: string) => void;
  reply: (providerId: string, text: string) => void;
  addReview: (r: Omit<Review, "id" | "date"> & { date?: string }) => void;
  toggleSaved: (id: string) => void;
  setUser: (u: State["user"]) => void;
  setLoggedIn: (v: boolean) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
};
const StoreContext = createContext<Ctx | null>(null);
const KEY = "budgam-services-v1";
const now = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const SIDEBAR_STORAGE_KEY = "budgam-services-sidebar-collapsed";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) {
        const val = stored === "true";
        setSidebarCollapsedState(val);
        if (val) {
          document.documentElement.setAttribute("data-sidebar-collapsed", "true");
        } else {
          document.documentElement.removeAttribute("data-sidebar-collapsed");
        }
      }
    } catch { /* ignore */ }
  }, []);

  const setSidebarCollapsed = (val: boolean) => {
    setSidebarCollapsedState(val);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(val));
      if (val) {
        document.documentElement.setAttribute("data-sidebar-collapsed", "true");
      } else {
        document.documentElement.removeAttribute("data-sidebar-collapsed");
      }
    } catch { /* ignore */ }
  };

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  // A phone that already saved the old sample profile is upgraded in place, so the new name shows there too.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        const user = { ...initial.user, ...saved.user };
        if (saved.user?.name === "Arif Hussain") user.name = initial.user.name;
        if (saved.user?.email === "arif@gmail.com") user.email = initial.user.email;
        // Remove known legacy sample bookings and conversations, while preserving bookings created by the user.
        const cleanBookings = (saved.bookings || []).filter((b: any) => b && b.id !== "b1" && b.id !== "b2");
        const cleanChats = { ...(saved.chats || {}) };
        if (cleanChats["sameer-electricals"] && cleanChats["sameer-electricals"].some((m: any) => m.id === "m1" || m.id === "m2")) {
          delete cleanChats["sameer-electricals"];
        }
        // Provider profiles are empty until real provider data is connected, so stale saved IDs cannot be displayed.
        setState({ ...initial, ...saved, bookings: cleanBookings, chats: cleanChats, saved: [], user });
      }
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(state)); }, [state, ready]);

  const value: Ctx = {
    ...state,
    addBooking: b => {
      const id = b.id || crypto.randomUUID();
      const item: Booking = { ...b, id, status: b.status || "Pending" };
      setState(s => ({ ...s, bookings: [item, ...s.bookings] }));
      return id;
    },
    deleteBooking: id => setState(s => ({ ...s, bookings: s.bookings.filter(b => b.id !== id) })),
    setStatus: (id, status) => setState(s => ({ ...s, bookings: s.bookings.map(b => b.id === id ? { ...b, status } : b) })),
    send: (providerId, text) => {
      setState(s => ({ ...s, chats: { ...s.chats, [providerId]: [...(s.chats[providerId] ?? []), { id: crypto.randomUUID(), from: "me", text, time: now() }] } }));
    },
    reply: (providerId, text) => {
      setState(s => ({ ...s, chats: { ...s.chats, [providerId]: [...(s.chats[providerId] ?? []), { id: crypto.randomUUID(), from: "them", text, time: now() }] } }));
    },
    addReview: r => setState(s => ({
      ...s,
      reviews: [
        {
          ...r,
          id: crypto.randomUUID(),
          date: r.date || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        },
        ...s.reviews.filter(x => x.bookingId && r.bookingId ? x.bookingId !== r.bookingId : true),
      ],
    })),
    toggleSaved: id => setState(s => ({ ...s, saved: s.saved.includes(id) ? s.saved.filter(x => x !== id) : [...s.saved, id] })),
    setUser: user => setState(s => ({ ...s, user })),
    setLoggedIn: loggedIn => setState(s => ({ ...s, loggedIn })),
    sidebarCollapsed,
    toggleSidebar,
    setSidebarCollapsed,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useSafeStore() {
  return useContext(StoreContext);
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}
