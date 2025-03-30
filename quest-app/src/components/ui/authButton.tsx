"use client";

import { useAuthState } from "@/lib/useAuth";
import { Button } from "./button";

export default function AuthButton() {
  const { isAuthenticated, isLoading, signin, signout, user } = useAuthState();

  if (isLoading) return <p>Loading...</p>;

  return isAuthenticated ? (
    <div>
      <p>Welcome, {user?.profile.email}</p>
      <Button variant={"destructive"} onClick={() => signout()}>Sign out</Button>
    </div>
  ) : (
    <Button variant={"default"} onClick={() => signin()}>Sign in</Button>
  );
}