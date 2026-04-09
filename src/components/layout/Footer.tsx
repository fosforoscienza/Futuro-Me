import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-surface-container-low mt-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto w-full pt-12 pb-24 px-8 text-sm">
        <div>
          <p className="font-[var(--font-plus-jakarta)] font-bold text-secondary text-xl mb-4">
            Il Futuro Me
          </p>
          <p className="text-secondary/60 max-w-xs leading-relaxed">
            {t("description")}
          </p>
          <p className="text-secondary/40 text-xs mt-4">{t("fundedBy")}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <p className="font-bold text-secondary uppercase tracking-widest text-[10px]">
              {t("project")}
            </p>
            <Link
              href="/progetto"
              className="block text-secondary/60 hover:text-secondary transition-colors"
            >
              {t("alphaPhase")}
            </Link>
            <Link
              href="/progetto"
              className="block text-secondary/60 hover:text-secondary transition-colors"
            >
              {t("roadmap")}
            </Link>
          </div>
          <div className="space-y-3">
            <p className="font-bold text-secondary uppercase tracking-widest text-[10px]">
              {t("connect")}
            </p>
            <Link
              href="/contatti"
              className="block text-secondary/60 hover:text-secondary transition-colors"
            >
              {t("feedback")}
            </Link>
            <a
              href="#"
              className="block text-secondary/60 hover:text-secondary transition-colors"
            >
              {t("privacy")}
            </a>
          </div>
        </div>

        <div className="md:col-span-2 pt-8 border-t border-secondary/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-secondary/60">{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
