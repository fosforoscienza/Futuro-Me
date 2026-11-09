import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { LogoutForm } from "@/components/account/LogoutForm";
import { getSession, type SessionAccount } from "@/lib/auth/session";

/** Solo admin e gestore: gli altri (anche i vecchi account studente) vanno al login. */
export async function requireStaff(): Promise<SessionAccount> {
  const account = await getSession();
  if (!account || account.ruolo === "studente") redirect("/it/accedi");
  return account;
}

const TABS = [
  { href: "/admin/studenti", label: "Questionario", adminOnly: false },
  { href: "/admin", label: "News", adminOnly: true },
  { href: "/admin/password", label: "La mia password", adminOnly: false },
];

export function Shell({
  account,
  title,
  current,
  children,
}: {
  account: SessionAccount;
  title: string;
  current: string;
  children: ReactNode;
}) {
  const tabs = TABS.filter((tab) => !tab.adminOnly || account.ruolo === "admin");
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10">
      <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs">Il Futuro Me</p>
          <h1 className="text-3xl font-extrabold text-secondary tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-on-surface-variant">
            <strong className="text-secondary">{account.username}</strong> · {account.ruolo}
          </p>
          <LogoutForm
            locale="it"
            className="rounded-full px-4 py-2 text-sm font-bold bg-surface-container-highest hover:bg-secondary/10 cursor-pointer disabled:opacity-60"
          >
            Esci
          </LogoutForm>
        </div>
      </header>
      <nav aria-label="Sezioni della console" className="flex flex-wrap gap-2 mb-10">
        {tabs.map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            aria-current={tab.href === current ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              tab.href === current
                ? "bg-secondary text-white"
                : "bg-surface-container-highest text-on-surface hover:bg-secondary/10"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </nav>
      {children}
    </div>
  );
}
