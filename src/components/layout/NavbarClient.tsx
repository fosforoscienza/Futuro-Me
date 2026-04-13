"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { useState } from "react";
import { Menu, X, Globe } from "lucide-react";

export function NavbarClient() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/progetto" as const, label: t("project") },
    { href: "/mercato-lavoro" as const, label: t("laborMarket") },
    { href: "/news" as const, label: t("news") },
    { href: "/archivio" as const, label: t("archive") },
  ];

  function switchLocale() {
    const next = locale === "it" ? "en" : "it";
    router.replace(pathname, { locale: next });
  }

  return (
    <>
      <div className="flex justify-between items-center px-6 h-20 max-w-7xl mx-auto font-[var(--font-plus-jakarta)] tracking-tight">
        <Link href="/" className="text-2xl font-bold text-secondary">
          Il Futuro Me
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors ${
                pathname === link.href
                  ? "text-secondary font-bold"
                  : "text-secondary/70 hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={switchLocale}
            className="hidden md:flex items-center gap-1 text-secondary/70 hover:text-secondary transition-colors cursor-pointer"
          >
            <Globe size={18} />
            <span className="text-sm font-bold uppercase">
              {locale === "it" ? "EN" : "IT"}
            </span>
          </button>
          <button className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2 rounded-xl font-bold active:scale-95 duration-200 cursor-pointer">
            {t("signIn")}
          </button>
          <button
            className="md:hidden text-secondary cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-surface/95 backdrop-blur-xl px-6 pb-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-secondary font-bold text-lg"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => {
              switchLocale();
              setMobileOpen(false);
            }}
            className="flex items-center gap-2 text-secondary/70 cursor-pointer"
          >
            <Globe size={18} />
            <span>{locale === "it" ? "English" : "Italiano"}</span>
          </button>
        </div>
      )}
    </>
  );
}
