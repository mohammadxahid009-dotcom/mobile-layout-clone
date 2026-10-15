import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { StoreProvider } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import {
  getStoredUser,
  initAuthListener,
  type StoredAuthUser,
} from "@/lib/firebase";
import { ChooseRolePage } from "./choose-role";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
      },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Budgam Services" },
      { title: "Budgam Services" },
      { name: "description", content: "Trusted local services in Budgam." },
      { property: "og:title", content: "Budgam Services" },
      { property: "og:description", content: "Trusted local services in Budgam." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Global authentication barrier:
 * Nobody can access any page, feature, or route in the app without logging in first.
 * If unauthenticated, displays the Choose Role & Welcome/Login onboarding flow.
 */
function GlobalAuthGate() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<StoredAuthUser | null>(() =>
    getStoredUser()
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Read from localStorage synchronously on mount
    const stored = getStoredUser();
    if (stored) {
      setCurrentUser(stored);
    }

    // Keep active session in sync with Firebase Auth
    const unsubscribe = initAuthListener((fbUser) => {
      setCurrentUser(fbUser);
    });

    setReady(true);
    return () => unsubscribe();
  }, []);

  // SSR or before mount: if stored user is present, render outlet
  if (!ready) {
    if (currentUser) {
      return <Outlet />;
    }
    // Prevent unauthenticated flash during hydration
    return (
      <ChooseRolePage
        onRoleChosen={(chosenRole) => {
          const fresh = getStoredUser();
          setCurrentUser(fresh);
          if (chosenRole === "provider") {
            router.navigate({ to: "/pro" });
          } else {
            router.navigate({ to: "/" });
          }
        }}
      />
    );
  }

  // If user is authenticated, allow full access to all app routes
  if (currentUser) {
    return <Outlet />;
  }

  // If unauthenticated: completely lock out the app and show the role + login screen
  return (
    <ChooseRolePage
      onRoleChosen={(chosenRole) => {
        const fresh = getStoredUser();
        setCurrentUser(fresh);
        if (chosenRole === "provider") {
          router.navigate({ to: "/pro" });
        } else {
          router.navigate({ to: "/" });
        }
      }}
    />
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Keep the app at a fixed scale: no pinch, no double-tap, no ctrl+scroll zoom.
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    document.addEventListener("gesturestart", block);
    document.addEventListener("gesturechange", block);
    document.addEventListener("gestureend", block);
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", block);
      document.removeEventListener("gesturechange", block);
      document.removeEventListener("gestureend", block);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        {/* Protected by GlobalAuthGate: nobody can enter without logging in */}
        <GlobalAuthGate />
        <Toaster position="top-center" />
      </StoreProvider>
    </QueryClientProvider>
  );
}
