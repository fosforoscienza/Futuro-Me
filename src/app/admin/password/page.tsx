import type { Metadata } from "next";
import { connection } from "next/server";
import { Shell, requireStaff } from "../shell";
import { ChangePasswordForm } from "../studenti/components";

export const metadata: Metadata = { title: "La mia password | Il Futuro Me" };

export default async function PasswordPage() {
  await connection();
  const account = await requireStaff();
  return (
    <Shell account={account} title="La mia password" current="/admin/password">
      <p className="text-sm text-on-surface-variant mb-6 max-w-xl">
        Admin e gestore non possono reimpostarsi la password a vicenda: se la dimentichi, si
        reimposta dal server con <code>scripts/staff-account.mjs</code> (vedi docs/account-studenti.md).
      </p>
      <ChangePasswordForm />
    </Shell>
  );
}
