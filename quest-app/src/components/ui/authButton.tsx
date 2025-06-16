"use client";

import { useAuthState } from "@/lib/useAuth";
import { Button } from "./button";

export default function AuthButton() {
  const { isAuthenticated, isLoading, signin, signup, signout } = useAuthState();

  if (isLoading) return <p>Loading...</p>;

  return isAuthenticated ? (
    <Button variant={"destructive"} onClick={() => signout()}>Sign out</Button>
  ) : (
    <div className="flex flex-col w-full gap-4">
      <Button variant={"glassDark"} onClick={() => signin()}>Sign in</Button>
      <Button variant={"glass"} onClick={() => signup()}>Sign up</Button>
    </div>
  );
}