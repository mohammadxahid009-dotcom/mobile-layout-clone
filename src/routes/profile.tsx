import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import {
  Settings,
  ClipboardList,
  Star,
  Heart,
  CircleHelp,
  Info,
  ShieldCheck,
  FileText,
  ChevronRight,
  X,
  SquarePen,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/app-ui";
import { getProvider, userPhoto } from "@/lib/data";
import { useStore } from "@/lib/store";
import { getStoredUser, logOutUser, type StoredAuthUser } from "@/lib/firebase";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile | Budgam Services" },
      {
        name: "description",
        content: "Manage your account, saved providers, reviews and settings.",
      },
      {
        property: "og:title",
        content: "My Profile | Budgam Services",
      },
      {
        property: "og:description",
        content: "Manage your Budgam Services account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

type Panel =
  | "settings"
  | "saved"
  | "help"
  | "about"
  | "privacy"
  | "terms"
  | "logout"
  | null;

function ProfilePage() {
  const { user, setUser, saved, toggleSaved, loggedIn, setLoggedIn } = useStore();
  const navigate = useNavigate();
  const [panel, setPanel] = useState<Panel>(null);
  const [draft, setDraft] = useState(user);
  const [authUser, setAuthUser] = useState<StoredAuthUser | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setAuthUser(stored);
      if (stored.displayName && user.name === "Haroon Rashid") {
        setUser({
          name: stored.displayName,
          email: stored.email || user.email,
        });
      }
    }
  }, []);

  const handleLogout = async () => {
    await logOutUser();
    setLoggedIn(false);
    setPanel(null);
    toast.success("Logged out successfully");
    navigate({ to: "/" });
  };

  const displayName = authUser?.displayName || user.name;
  const displayEmail = authUser?.email || user.email;
  const avatarSrc = authUser?.photoURL || userPhoto;

  const items: {
    label: string;
    icon: typeof Star;
    tint: string;
    action: () => void;
  }[] = [
    {
      label: "Switch to Service Provider",
      icon: ShieldCheck,
      tint: "tint-green",
      action: () => {
        try {
          sessionStorage.setItem("selected_role", "provider");
        } catch {}
        navigate({ to: "/pro" });
      },
    },
    {
      label: "My Bookings",
      icon: ClipboardList,
      tint: "tint-green",
      action: () => navigate({ to: "/bookings" }),
    },
    {
      label: "Saved Providers",
      icon: Heart,
      tint: "tint-pink",
      action: () => setPanel("saved"),
    },
    {
      label: "Help & Support",
      icon: CircleHelp,
      tint: "tint-blue",
      action: () => setPanel("help"),
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
    Exclude<Panel, null>,
    { title: string; body: ReactNode }
  > = {
    settings: {
      title: "Edit Profile",
      body: (
        <form
          className="sheet-form"
          onSubmit={(e) => {
            e.preventDefault();
            setUser(draft);
            setPanel(null);
            toast.success("Profile updated");
          }}
        >
          <label className="field">
            <span>Full name</span>
            <input
              className="input"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              className="input"
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              required
            />
          </label>
          <button className="primary-btn">Save</button>
        </form>
      ),
    },
    saved: {
      title: "Saved Providers",
      body: saved.length ? (
        <div className="sheet-list">
          {saved.map((id) => {
            const p = getProvider(id);
            if (!p) return null;
            return (
              <div key={id} className="sheet-row">
                <img
                  src={p.photo}
                  alt=""
                  className="avatar-sm"
                  width={816}
                  height={816}
                />
                <Link to="/provider/$id" params={{ id }} className="grow">
                  <strong>{p.name}</strong>
                  <p className="muted">
                    {p.role} • {p.area}
                  </p>
                </Link>
                <button
                  className="icon-btn heart-on"
                  aria-label="Remove"
                  onClick={() => toggleSaved(id)}
                >
                  <Heart fill="currentColor" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="panel-copy">Tap the heart on a provider to save them here.</p>
      ),
    },
    help: {
      title: "Help & Support",
      body: (
        <div className="faq">
          <details>
            <summary>How do I book a service?</summary>
            <p>Pick a service on Home, choose a provider and tap Book Now.</p>
          </details>
          <details>
            <summary>Can I cancel a booking?</summary>
            <p>Yes — open My Bookings and tap Cancel on any upcoming booking.</p>
          </details>
          <details>
            <summary>Are providers verified?</summary>
            <p>
              Providers with a green Verified badge are background checked.
            </p>
          </details>
          <a href="mailto:support@budgamservices.in" className="primary-btn">
            Contact Support
          </a>
        </div>
      ),
    },
    about: {
      title: "About Us",
      body: (
        <p className="panel-copy">
          Budgam Services connects you with trusted local electricians, plumbers,
          carpenters, mechanics and more across Budgam district.
        </p>
      ),
    },
    privacy: {
      title: "Privacy Policy",
      body: (
        <p className="panel-copy">
          We only use your name, contact details and location to connect you with
          providers you choose. We never sell your data.
        </p>
      ),
    },
    terms: {
      title: "Terms & Conditions",
      body: (
        <p className="panel-copy">
          Prices shown are approximate. Final charges are agreed directly between
          you and the provider before work begins.
        </p>
      ),
    },
    logout: {
      title: "Log out?",
      body: (
        <>
          <p className="panel-copy">
            You'll need to sign back in with your account to access your bookings.
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
    <div className="mobile-app plain profile-page">
      <header className="profile-head">
        <div className="avatar-wrap">
          <img
            src={avatarSrc}
            alt={displayName}
            className="avatar-xl rounded-full object-cover"
            width={816}
            height={816}
          />
          <button
            className="edit-badge"
            aria-label="Edit profile"
            onClick={() => {
              setDraft({ name: displayName, email: displayEmail });
              setPanel("settings");
            }}
          >
            <SquarePen />
          </button>
        </div>
        <div>
          <h1>{displayName}</h1>
          <p className="muted">{displayEmail}</p>
        </div>
        <button
          className="icon-btn"
          aria-label="Settings"
          onClick={() => {
            setDraft({ name: displayName, email: displayEmail });
            setPanel("settings");
          }}
        >
          <Settings />
        </button>
      </header>
      <main>
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
        <button className="logout-btn" onClick={() => setPanel("logout")}>
          <LogOut />
          Log Out
        </button>
      </main>
      <BottomNav active="Profile" />
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
    </div>
  );
}
