"use client";

import { useAuthState } from "@/lib/useAuth";
import { Button } from "./button";

export default function AuthButton() {
  const { user, isAuthenticated, isLoading, signin, signout } = useAuthState();
  const isAdmin = Array.isArray(user?.profile?.["cognito:groups"]) ? user.profile["cognito:groups"].includes("Admin") : false;

  if (isLoading) return <p>Loading...</p>;

  return isAuthenticated ? (
    <div className="flex flex-col w-full gap-4">
      <Button 
        variant={"glassDark"} 
        onClick={() => signout()}
      >
        Sign out
      </Button>
    </div>
  ) : (
    <div className="flex flex-col w-full max-w-2xl mx-auto gap-4">
      <Button variant={"glassDark"} onClick={() => signin()}>Sign in</Button>
    </div>
  );
}