import { useAuth, SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { RouterProvider } from "react-router-dom";
import { AppProviders } from "@/app/providers";
import { router } from "@/app/router";
import { Button } from "@/components/ui/button";
import { setTokenGetter } from "@/features/dataroom/storage/auth-token";

function AuthenticatedApp() {
  const { getToken, isLoaded } = useAuth();

  // Set during render (not in an effect) so folder queries that mount in the
  // same commit always see a live getter — useEffect races TanStack Query.
  setTokenGetter(getToken);

  if (!isLoaded) return null;

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
    </div>
  );
}

export function App() {
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
