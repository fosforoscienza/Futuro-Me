import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/account/AuthShell";
import { SignupForm } from "@/components/account/AuthForms";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("signupTitle"), robots: { index: false, follow: false } };
}

export default async function RegistratiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const account = await getSession();
  if (account) redirect(account.ruolo === "studente" ? `/${locale}/area` : "/admin");

  const t = await getTranslations("account");
  return (
    <AuthShell eyebrow={t("areaEyebrow")} title={t("signupTitle")} subtitle={t("signupSubtitle")}>
      <SignupForm />
    </AuthShell>
  );
}
