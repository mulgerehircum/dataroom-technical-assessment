import { useAuth, SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { RouterProvider } from "react-router-dom";
import { AppProviders } from "@/app/providers";
import { router, demoRouter } from "@/app/router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentsSkeleton } from "@/features/dataroom/components/ContentsSkeleton";
import { setTokenGetter } from "@/features/dataroom/storage/auth-token";

function AuthBootSkeleton() {
  return (
    <div
      className="flex h-svh flex-col bg-background"
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-40" />
        </div>
        <Skeleton className="h-9 w-full max-w-sm rounded-lg" />
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
        <ContentsSkeleton />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function AuthenticatedApp() {
  const { getToken, isLoaded } = useAuth();

  // Set during render (not in an effect) so folder queries that mount in the
  // same commit always see a live getter — useEffect races TanStack Query.
  setTokenGetter(getToken);

  if (!isLoaded) return <AuthBootSkeleton />;

  return <RouterProvider router={router} />;
}

function SignInPrompt() {
  return (
    <div className="flex h-svh flex-col items-center justify-center gap-4 bg-background">
      <div className="text-center">
        <p className="text-[12px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
          Acme Data Room
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
          Sign in
        </h1>
        <p className="mt-2 text-[13.5px] text-muted-foreground">
          Sign in to view your documents.
        </p>
      </div>
      <SignInButton mode="modal">
        <Button className="rounded-lg px-4 font-bold tracking-[0.02em] uppercase">
          Sign in
        </Button>
      </SignInButton>
      <a
        href="/demo"
        className="text-[13.5px] font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Or view a live demo — no sign in required
      </a>
    </div>
  );
}

/** Read/write demo seeded with sample folders and PDFs, no Clerk session involved. */
function DemoApp() {
  return <RouterProvider router={demoRouter} />;
}

export function App() {
  // A plain pathname check (not a route match) so /demo works whether or
  // not the visitor is signed in — it never goes through the Clerk gate.
  const isDemoRoute =
    typeof window !== "undefined" && window.location.pathname.startsWith("/demo");

  if (isDemoRoute) {
    return (
      <AppProviders>
        <DemoApp />
      </AppProviders>
    );
  }

  return (
    <AppProviders>
      <SignedIn>
        <AuthenticatedApp />
      </SignedIn>
      <SignedOut>
        <SignInPrompt />
      </SignedOut>
    </AppProviders>
  );
}
