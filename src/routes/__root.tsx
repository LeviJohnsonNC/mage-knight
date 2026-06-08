import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { GameProvider } from "../lib/mk/store";
import { CommunityProvider } from "../lib/mk/communityStore";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center panel-steel rounded-lg p-10 gold-trim">
        <h1 className="text-6xl text-gold font-display">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">This path is uncharted.</p>
        <a href="/" className="mt-6 inline-block rounded bg-gold-gradient px-4 py-2 text-sm font-medium text-primary-foreground">Return to camp</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center panel-steel rounded-lg p-10 gold-trim">
        <h2 className="font-display text-xl text-gold">A shadow fell across the page</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded bg-gold-gradient px-4 py-2 text-sm font-medium text-primary-foreground"
          >Try again</button>
          <a href="/" className="rounded border border-border px-4 py-2 text-sm">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=1280" },
      { title: "Mage Knight — Digital Companion (Fan Project)" },
      { name: "description", content: "A polished, desktop-only solo digital companion for the Mage Knight board game. Fan project — bring your own component data." },
      { property: "og:title", content: "Mage Knight — Digital Companion (Fan Project)" },
      { property: "og:description", content: "Solo digital board game implementation. Import your own rules and components." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" },
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
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <GameProvider>
        <CommunityProvider>
          <Outlet />
          <Toaster theme="dark" />
        </CommunityProvider>
      </GameProvider>
    </QueryClientProvider>
  );
}
