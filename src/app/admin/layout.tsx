import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";

export const metadata: Metadata = {
  title: "Console news | Il Futuro Me",
  robots: { index: false, follow: false },
};

/** Layout della console admin: fuori da [locale], senza navbar del sito. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it" className="antialiased">
      <body className="min-h-screen bg-background text-on-surface">
        {children}
      </body>
    </html>
  );
}
