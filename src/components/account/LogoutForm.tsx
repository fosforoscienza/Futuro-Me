"use client";

import { useActionState, type ReactNode } from "react";
import { logout } from "@/lib/auth/actions";

export function LogoutForm({ locale, className, children }: {
  locale: string; className: string; children: ReactNode;
}) {
  const [failed, action, pending] = useActionState(logout, false);
  return (
    <form action={action}>
      <input type="hidden" name="locale" value={locale} />
      <button type="submit" disabled={pending} className={className}>{children}</button>
      {failed && <p role="alert" className="mt-2 max-w-xs text-sm text-primary">
        {locale === "en"
          ? "Sign-out could not be completed. Your session may still be active. Please try again."
          : "Uscita non completata: la sessione potrebbe essere ancora attiva. Riprova."}
      </p>}
    </form>
  );
}
