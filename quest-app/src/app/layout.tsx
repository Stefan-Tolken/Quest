import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link"; // Import Link from Next.js
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quest - Admin Panel",
  description: "Page builder for creating artefact pages.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Navigation Bar */}
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
          </ul>
        </nav>

        {/* Main Content */}
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
}
