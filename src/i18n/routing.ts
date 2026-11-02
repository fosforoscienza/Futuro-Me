import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["it", "en"],
  defaultLocale: "it",
  // hreflang solo nell'HTML (src/lib/seo.ts): l'header Link del middleware non
  // sa quali pagine sono private o non tradotte.
  alternateLinks: false,
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
