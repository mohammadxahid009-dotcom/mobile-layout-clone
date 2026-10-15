import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, CalendarDays, ChevronRight, CircleHelp, FileText, Info, Pencil, Repeat, ShieldCheck, Star, UserRound, Wallet, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Card, ProPage, btnOutline, btnPrimary, inputCls, proHead } from "@/components/pro-ui";
import { usePro } from "@/lib/pro-store";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/pro/profile")({
  head: () => proHead("Profile", "Your service provider profile, rating and settings."),
  component: Profile,
});

const info: Record<string, string> = {
  "About Us": "Budgam Services connects local customers with trusted professionals for home and business services.",
  "Privacy Policy": "Your profile and booking information is only shared with customers you work with.",
  "Terms & Conditions": "Providers agree to honour accepted bookings, quote fair prices and treat customers respectfully.",
};

function Profile() {
  const { profile, setProfile, jobs } = usePro();
  const { reviews } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [open, setOpen] = useState<string | null>(null);
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "–";
  const total = jobs.filter(j => j.proStatus === "Completed").length;

  const links = [
    { label: "My Services", to: "/pro/services", icon: Wrench },
    { label: "My Schedule", to: "/pro/schedule", icon: CalendarDays },
    { label: "Earnings", to: "/pro/earnings", icon: Wallet },
    { label: "Reviews", to: "/pro/reviews", icon: Star },
    { label: "Help & Support", to: "/pro/help", icon: CircleHelp },
  ] as const;

  return (
    <ProPage tab="Profile">
      <section className="rounded-b-[2rem] bg-primary px-5 pb-6 pt-8 text-primary-foreground">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary-foreground/15 ring-2 ring-primary-foreground/40"><UserRound className="h-8 w-8" /></div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">{profile.name || "Your name"}</h1>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-foreground px-2.5 py-0.5 text-xs font-semibold text-primary"><BadgeCheck className="h-3.5 w-3.5" />Service Provider</span>
          </div>
          <button aria-label="Edit profile" className="rounded-full p-2 hover:bg-primary-foreground/15" onClick={() => { setDraft(profile); setEditing(e => !e); }}><Pencil className="h-5 w-5" /></button>
        </div>
      </section>
      <div className="space-y-4 px-5 pt-4">
        <Card className="grid grid-cols-3 divide-x divide-border text-center">
          <div><p className="font-bold">{avg}</p><p className="text-xs text-muted-foreground">Rating</p></div>
          <div><p className="font-bold">{reviews.length}</p><p className="text-xs text-muted-foreground">Reviews</p></div>
          <div><p className="font-bold">{total}</p><p className="text-xs text-muted-foreground">Total Jobs</p></div>
        </Card>

        {editing && (
          <Card>
            <form className="space-y-3" onSubmit={e => { e.preventDefault(); setProfile(draft); setEditing(false); toast.success("Profile saved"); }}>
              <input className={inputCls} placeholder="Full name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
              <input className={inputCls} placeholder="Phone number" inputMode="tel" value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} />
              <input className={inputCls} placeholder="Service area, e.g. Chadoora, Budgam" value={draft.area} onChange={e => setDraft({ ...draft, area: e.target.value })} />
              <textarea className={inputCls} rows={3} placeholder="About your work" value={draft.bio} onChange={e => setDraft({ ...draft, bio: e.target.value })} />
              <div className="grid grid-cols-2 gap-3"><button type="button" className={btnOutline} onClick={() => setEditing(false)}>Cancel</button><button className={btnPrimary}>Save</button></div>
            </form>
          </Card>
        )}
        {!editing && (profile.phone || profile.area || profile.bio) && (
          <Card className="space-y-1 text-sm">{profile.phone && <p>📞 {profile.phone}</p>}{profile.area && <p>📍 {profile.area}</p>}{profile.bio && <p className="text-muted-foreground">{profile.bio}</p>}</Card>
        )}

        <Card className="divide-y divide-border p-0">
          {links.map(({ label, to, icon: Icon }) => (
            <Link key={label} to={to} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50"><Icon className="h-5 w-5 text-primary" /><span className="flex-1">{label}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>
          ))}
          {Object.keys(info).map(label => (
            <div key={label}>
              <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted/50" onClick={() => setOpen(open === label ? null : label)}>
                {label === "About Us" ? <Info className="h-5 w-5 text-primary" /> : label === "Privacy Policy" ? <ShieldCheck className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
                <span className="flex-1">{label}</span><ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${open === label ? "rotate-90" : ""}`} />
              </button>
              {open === label && <p className="px-4 pb-3 text-sm text-muted-foreground">{info[label]}</p>}
            </div>
          ))}
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary hover:bg-muted/50"><Repeat className="h-5 w-5" /><span className="flex-1">Switch to Customer App</span></Link>
        </Card>
      </div>
    </ProPage>
  );
}
