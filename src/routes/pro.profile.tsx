import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import {
  CalendarDays,
  ChevronRight,
  CircleHelp,
  FileText,
  Info,
  Repeat,
  ShieldCheck,
  Star,
  Wallet,
  Wrench,
  Settings,
  SquarePen,
  X,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { ProPage, proHead } from "@/components/pro-ui";
import { userPhoto } from "@/lib/data";
import { usePro } from "@/lib/pro-store";
import { useStore } from "@/lib/store";
import { getStoredUser, logOutUser, type StoredAuthUser } from "@/lib/firebase";

export const Route = createFileRoute("/pro/profile")({
  head: () =>
    proHead("Profile", "Your service provider profile, rating and settings."),
  component: Profile,
});

const infoContent: Record<string, string> = {
  about:
    "Budgam Services connects local customers with trusted professionals for home and business services across Budgam district.",
  privacy:
    "Your profile and booking information is only shared with customers you work with. We never sell your personal information.",
  terms:
    "Service providers agree to honour accepted bookings, quote fair prices, follow safety standards, and treat customers respectfully.",
};

type SheetPanel = "settings" | "about" | "privacy" | "terms" | "logout" | null;

function Profile() {
  const { profile, setProfile, jobs } = usePro();
  const { reviews } = useStore();
  const navigate = useNavigate();

  const [panel, setPanel] = useState<SheetPanel>(null);
  const [draft, setDraft] = useState(profile);
  const [authUser, setAuthUser] = useState<StoredAuthUser | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setAuthUser(stored);
      if (stored.displayName && !profile.name) {
        setProfile({
          ...profile,
          name: stored.displayName,
        });
      }
    }
  }, []);

  const handleLogout = async () => {
    await logOutUser();
    setPanel(null);
    toast.success("Logged out successfully");
    navigate({ to: "/" });
  };

  const displayName = authUser?.displayName || profile.name || "Haroon Rashid";
  const displayAvatar = authUser?.photoURL || userPhoto;

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "–";
  const total = jobs.filter((j) => j.proStatus === "Completed").length;

  const items: {
    label: string;
    icon: typeof Wrench;
    tint: string;
    action: () => void;
  }[] = [
    {
      label: "Switch to Customer App",
      icon: Repeat,
      tint: "tint-green",
      action: () => {
        try {
          sessionStorage.setItem("selected_role", "customer");
        } catch {}
        navigate({ to: "/" });
      },
    },
    {
      label: "My Services",
      icon: Wrench,
      tint: "tint-green",
      action: () => navigate({ to: "/pro/services" }),
    },
    {
      label: "My Schedule",
      icon: CalendarDays,
      tint: "tint-blue",
      action: () => navigate({ to: "/pro/schedule" }),
    },
    {
      label: "Earnings",
      icon: Wallet,
      tint: "tint-amber",
      action: () => navigate({ to: "/pro/earnings" }),
    },
    {
      label: "Reviews",
      icon: Star,
      tint: "tint-amber",
      action: () => navigate({ to: "/pro/reviews" }),
    },
    {
      label: "Help & Support",
      icon: CircleHelp,
      tint: "tint-blue",
      action: () => navigate({ to: "/pro/help" }),
    },
    {
      label: "About Us",
      icon: Info,
      tint: "tint-purple",
      action: () => setPanel("about"),
    },
    {
      label: "Privacy Policy",
      icon: ShieldCheck,
      tint: "tint-mint",
      action: () => setPanel("privacy"),
    },
    {
      label: "Terms & Conditions",
      icon: FileText,
      tint: "tint-blue",
      action: () => setPanel("terms"),
    },
  ];

  const sheets: Record<
    Exclude<SheetPanel, null>,
    { title: string; body: ReactNode }
  > = {
    settings: {
      title: "Edit Profile",
      body: (
        <form
          className="sheet-form"
          onSubmit={(e) => {
            e.preventDefault();
            setProfile(draft);
            setPanel(null);
            toast.success("Profile saved");
          }}
        >
          <label className="field">
            <span>Full name</span>
            <input
              className="input"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. Haroon Rashid"
              required
            />
          </label>
          <label className="field">
            <span>Phone number</span>
            <input
              className="input"
              type="tel"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              placeholder="e.g. +91 94190 12345"
            />
          </label>
          <label className="field">
            <span>Service area</span>
            <input
              className="input"
              value={draft.area}
              onChange={(e) => setDraft({ ...draft, area: e.target.value })}
              placeholder="e.g. Chadoora, Budgam"
            />
          </label>
          <label className="field">
            <span>About your work</span>
            <textarea
              className="input"
              rows={3}
              value={draft.bio}
              onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              placeholder="Describe your skills, experience, and service guarantees..."
            />
          </label>
          <button className="primary-btn" type="submit">
            Save Profile
          </button>
        </form>
      ),
    },
    about: {
      title: "About Us",
      body: <p className="panel-copy">{infoContent.about}</p>,
    },
    privacy: {
      title: "Privacy Policy",
      body: <p className="panel-copy">{infoContent.privacy}</p>,
    },
    terms: {
      title: "Terms & Conditions",
      body: <p className="panel-copy">{infoContent.terms}</p>,
    },
    logout: {
      title: "Log out?",
      body: (
        <>
          <p className="panel-copy">
            You'll need to sign back in with your account to access your provider dashboard.
          </p>
          <div className="btn-pair">
            <button className="outline-btn" onClick={() => setPanel(null)}>
              Stay
            </button>
            <button className="danger-solid" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </>
      ),
    },
  };

  return (
    <ProPage tab="Profile" className="profile-page">
      <header className="profile-head">
        <div className="avatar-wrap">
          <img
            src={displayAvatar}
            alt={displayName}
            className="avatar-xl rounded-full object-cover"
            width={816}
            height={816}
          />
          <button
            className="edit-badge"
            aria-label="Edit profile"
            onClick={() => {
              setDraft({ ...profile, name: displayName });
              setPanel("settings");
            }}
          >
            <SquarePen />
          </button>
        </div>
        <div>
          <h1>{displayName}</h1>
          <p className="muted">
            {profile.phone
              ? `${profile.phone} • ${profile.area || "Budgam"}`
              : "Service Professional • Budgam"}
          </p>
        </div>
        <button
          className="icon-btn"
          aria-label="Settings"
          onClick={() => {
            setDraft({ ...profile, name: displayName });
            setPanel("settings");
          }}
        >
          <Settings />
        </button>
      </header>

      <main className="space-y-4">
        {/* Quick performance stats bar */}
        <div className="mx-4 grid grid-cols-3 divide-x divide-border rounded-2xl border border-soft-line bg-card p-3 text-center shadow-sm">
          <div>
            <p className="text-lg font-bold text-primary">{avg}</p>
            <p className="text-[11px] font-medium text-muted-foreground">Rating</p>
          </div>
          <div>
            <p className="text-lg font-bold text-primary">{reviews.length}</p>
            <p className="text-[11px] font-medium text-muted-foreground">Reviews</p>
          </div>
          <div>
            <p className="text-lg font-bold text-primary">{total}</p>
            <p className="text-[11px] font-medium text-muted-foreground">Total Jobs</p>
          </div>
        </div>

        {profile.bio && (
          <div className="mx-4 rounded-2xl border border-soft-line bg-card p-3 text-xs text-muted-foreground shadow-sm">
            <p className="font-semibold text-foreground mb-1">About Me</p>
            <p>{profile.bio}</p>
          </div>
        )}

        <div className="menu">
          {items.map(({ label, icon: Icon, tint, action }) => (
            <button key={label} className="menu-row" onClick={action}>
              <span className={`menu-icon ${tint}`}>
                <Icon />
              </span>
              <span>{label}</span>
              <ChevronRight className="chev" />
            </button>
          ))}
        </div>

        <button className="logout-btn mx-4" onClick={() => setPanel("logout")}>
          <LogOut />
          Log Out
        </button>
      </main>

      {panel && (
        <div className="panel-backdrop" onClick={() => setPanel(null)}>
          <section
            className="detail-panel"
            role="dialog"
            aria-modal="true"
            aria-label={sheets[panel].title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-heading">
              <h2>{sheets[panel].title}</h2>
              <button
                className="icon-btn"
                aria-label="Close"
                onClick={() => setPanel(null)}
              >
                <X />
              </button>
            </div>
            {sheets[panel].body}
          </section>
        </div>
      )}
    </ProPage>
  );
}
