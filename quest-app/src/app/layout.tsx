"use client";

import { AuthProvider } from "react-oidc-context";
import { CognitoAuthConfig } from "@/lib/auth";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import RegisterSW from "./sw-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Move viewport logic into a client-side effect
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider {...CognitoAuthConfig}>
      <html lang="en">
        <head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1"
          />
          <meta name="theme-color" content="#000000" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <nav className="p-4 bg-gray-200">
            <ul className="flex gap-4">
              <li>
                <Link href="/" className="text-blue-600 hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/page-builder"
                  className="text-blue-600 hover:underline"
                >
                  Page Builder
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/challenge-maker"
                  className="text-blue-600 hover:underline"
                >
                  Challenge Maker
                </Link>
              </li>
            </ul>
          </nav>

          {/* Main Content */}
          <main className="p-4">
            {children}
            <RegisterSW />
          </main>
        </body>
      </html>
    </AuthProvider>
  );
}
