import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { User, Wrench, Check, ChevronRight, ChevronDown, Calendar, VenusAndMars } from "lucide-react";

export const Route = createFileRoute("/role")({
  head: () => ({
    meta: [
      { title: "Choose Your Role | Budgam Services" },
      { name: "description", content: "Pick whether you want to book services or offer them, and finish setting up your account." },
      { property: "og:title", content: "Choose Your Role | Budgam Services" },
      { property: "og:description", content: "Book local services or grow your business as a service man." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RolePage,
});

type Role = "customer" | "pro";

function Row({ icon, children, chevron }: { icon: ReactNode; children: ReactNode; chevron?: boolean }) {
  return (
    <label className="relative flex h-14 items-center gap-4 rounded-2xl bg-sheet/80 px-5 shadow-md shadow-mint-deep/5">
      <span className="text-mint-deep">{icon}</span>
      <span className="h-7 w-px bg-mint-deep/15" />
      {children}
      {chevron && <ChevronDown size={20} className="pointer-events-none text-mint-ink/60" />}
    </label>
  );
}

function RolePage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role | null>(null);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const ages = Array.from({ length: 83 }, (_, i) => i + 18);

  const cards = [
    { k: "customer" as const, t: "Non Professional", s: "Book local services, get help from verified professionals.", Icon: User },
    { k: "pro" as const, t: "Service Man", s: "Offer your services, get bookings and grow your business.", Icon: Wrench },
  ];

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: role === "pro" ? "/pro" : "/" });
  };

  const sel = "min-w-0 flex-1 appearance-none bg-transparent text-[15px] outline-none";

  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-md overflow-hidden bg-gradient-to-b from-mint via-mint-soft to-mint px-5 pb-10 text-mint-ink">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-96 rotate-[-18deg] rounded-[50%] bg-mint-deep/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-96 rotate-[-18deg] rounded-[50%] bg-mint-deep/10 blur-2xl" />

      <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="pt-14 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight">Welcome</h1>
          <p className="mt-3 text-lg text-mint-ink/70">Great to see you again!</p>
        </div>

        <div className="mt-9 space-y-4">
          {cards.map(({ k, t, s, Icon }, i) => {
            const on = role === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setRole(k)}
                style={{ animationDelay: `${150 + i * 100}ms` }}
                className={`flex w-full items-center gap-4 rounded-[24px] border-2 p-4 text-left shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 fill-mode-both active:scale-[0.98] ${on ? "border-mint-deep/50 bg-mint/70 shadow-mint-deep/15" : "border-transparent bg-sheet/70 shadow-mint-deep/5"}`}
              >
                <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-full transition-colors duration-300 ${on ? "bg-mint-deep text-sheet" : "bg-mint text-mint-deep"}`}>
                  <Icon size={28} />
                </span>
                <span className="flex-1">
                  <span className={`block text-lg font-bold transition-colors ${on ? "text-mint-deep" : ""}`}>{t}</span>
                  <span className="text-sm leading-snug text-mint-ink/60">{s}</span>
                </span>
                {on ? (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-mint-deep text-sheet animate-in zoom-in duration-300"><Check size={16} strokeWidth={3} /></span>
                ) : (
                  <ChevronRight className="text-mint-ink/50" />
                )}
              </button>
            );
          })}
        </div>

        <form onSubmit={go} className="mt-9 animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-700" style={{ animationDelay: "350ms" }}>
          <h2 className="text-2xl font-extrabold">Create Your Account</h2>
          <p className="mt-1 text-mint-ink/60">Choose a username and add a few details to get started.</p>
          <div className="mt-6 space-y-4">
            <Row icon={<User size={22} />}>
              <input required placeholder="Username" className={`${sel} placeholder:text-mint-ink/50`} />
            </Row>
            <Row icon={<Calendar size={22} />} chevron>
              <select required value={age} onChange={(e) => setAge(e.target.value)} className={`${sel} ${age ? "" : "text-mint-ink/50"}`}>
                <option value="" disabled>Age</option>
                {ages.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Row>
            <Row icon={<VenusAndMars size={22} />} chevron>
              <select required value={gender} onChange={(e) => setGender(e.target.value)} className={`${sel} ${gender ? "" : "text-mint-ink/50"}`}>
                <option value="" disabled>Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </Row>
          </div>
          <button disabled={!role} className="mt-7 h-14 w-full rounded-2xl bg-gradient-to-b from-mint-deep to-primary text-lg font-bold text-primary-foreground shadow-lg shadow-mint-deep/30 transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100">{role ? "Continue" : "Select a role to continue"}</button>
          <p className="mt-5 text-center text-sm text-mint-ink/70">Already have an account? <Link to="/welcome" className="font-bold text-mint-deep">Log In</Link></p>
        </form>
      </div>
    </div>
  );
}
