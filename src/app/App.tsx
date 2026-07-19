import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/clerk-react";
import { AppProviders } from "@/app/providers";
import { router } from "@/app/router";
import { Button } from "@/components/ui/button";
import { setTokenGetter } from "@/features/dataroom/storage/auth-token";

function ClerkTokenBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  return null;
}

function SignInPrompt() {
  return (
    <div className="flex h-svh flex-col items-center justify-center gap-4">
      <div className="text-center">
        <h1 className="text-lg font-semibold">Data Room</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to view your documents.
        </p>
      </div>
      <SignInButton mode="modal">
        <Button>Sign in</Button>
      </SignInButton>
    </div>
  );
}

export function App() {
  return (
    <AppProviders>
      <SignedIn>
        <ClerkTokenBridge />
        <RouterProvider router={router} />
      </SignedIn>
      <SignedOut>
        <SignInPrompt />
      </SignedOut>
    </AppProviders>
  );
}
