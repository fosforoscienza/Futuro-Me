"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Home, BarChart3, Newspaper, FolderArchive } from "lucide-react";

const navItems = [
  { href: "/" as const, icon: Home, labelKey: "home" },
  { href: "/mercato-lavoro" as const, icon: BarChart3, labelKey: "laborMarket" },
  { href: "/news" as const, icon: Newspaper, labelKey: "news" },
  { href: "/archivio" as const, icon: FolderArchive, labelKey: "archive" },
];

export function MobileNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface/70 backdrop-blur-xl flex justify-around items-center px-4 pb-6 pt-2 rounded-t-[1.5rem]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center p-2 ${
              isActive
                ? "bg-secondary text-white rounded-2xl scale-110"
                : "text-secondary"
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest mt-1">
              {t(item.labelKey)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
