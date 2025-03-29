"use client";

import React, { useState, useEffect, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const LoginPage = () => {
//   const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Add refs for the input fields
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Add useEffect for initial focus
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    console.log("Handle Form Submission");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mb-8 flex flex-row gap-5 justify-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Quest
        </h1>
      </div>

        <Card className="w-full w-md">
            <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
                Enter your email below to access your account
            </CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                )}

                <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    ref={emailInputRef}
                />
                </div>

                <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    ref={passwordInputRef}
                    />
                    <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                    >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                    </Button>
                </div>
                </div>

                <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Checkbox id="remember" />
                    <Label htmlFor="remember" className="text-sm font-normal">
                    Remember me
                    </Label>
                </div>
                {email ? <Button variant="link">Forgot Password</Button> : ""}
                </div>

                <Button type="submit" className="w-full">
                Sign In
                </Button>
            </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
            <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                <Separator />
                </div>
                <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
                    Don't have an account?
                </span>
                </div>
            </div>

            <Button variant="outline" className="w-full" asChild>
                <Link href="/signup">Create new account</Link>
            </Button>
            </CardFooter>
        </Card>
    </div>
  );
};

export default LoginPage;