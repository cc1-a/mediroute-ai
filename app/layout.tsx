import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediRoute AI — Spidey-Powered Medical Triage",
  description: "AI-powered medical triage and doctor booking for Sri Lanka. Fast. Precise. Connected.",
};

import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=VT323&family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
