import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { CARIVERONA_URL, partnerGroups, partners } from "@/lib/partners";

const rowClass = "grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-3 lg:gap-8 items-start";
const labelClass = "font-bold text-secondary uppercase tracking-widest text-[10px] lg:pt-2";
const gridClass = "grid grid-cols-2 sm:grid-cols-4 gap-3";
const tileClass =
  "bg-surface-container-lowest rounded-2xl h-24 md:h-28 flex items-center justify-center transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_rgb(48_99_135/0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary";
/** Link ai siti dei partner: nuova scheda, senza passare il referrer. */
const external = { target: "_blank", rel: "noopener noreferrer" } as const;

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
            <Link
              href="/metodo"
              className="block text-secondary/60 hover:text-secondary transition-colors"
            >
              {t("method")}
            </Link>
            <Link
              href="/privacy"
              className="block text-secondary/60 hover:text-secondary transition-colors"
            >
              {t("privacy")}
            </Link>
          </div>
        </div>

        <section
          aria-labelledby="footer-partners-title"
          className="md:col-span-2 pt-10 border-t border-secondary/10 space-y-8"
        >
          <h2 id="footer-partners-title" className="sr-only">
            {t("partnersTitle")}
          </h2>

          <div className={rowClass}>
            <div>
              <h3 className={labelClass}>{t("supportTitle")}</h3>
              <p className="text-secondary/60 text-xs mt-2 max-w-[180px]">{t("fundedBy")}</p>
            </div>
            <div className={gridClass}>
              {/* Marchio "ENTI" ufficiale (kit Fondazione Cariverona, giugno 2023): include la
                  dicitura "con il sostegno di" e l'area di rispetto. Va usato così com'è, su
                  fondo bianco, senza filtri né ricolorazioni e non sotto i 30 mm di base. */}
              <a
                href={CARIVERONA_URL}
                {...external}
                aria-label={`${t("cariveronaAlt")} (${t("newTab")})`}
                className={`${tileClass} col-span-2 py-1`}
              >
                <Image
                  src="/partners/cariverona-con-il-sostegno-di.svg"
                  alt={t("cariveronaAlt")}
                  width={1000}
                  height={384}
                  className="h-full w-auto max-w-full object-contain"
                />
              </a>
            </div>
          </div>

          {partnerGroups.map((group) => (
            <div key={group} className={rowClass}>
              <h3 className={labelClass}>{t(`partnerGroups.${group}`)}</h3>
              <ul className={gridClass}>
                {partners
                  .filter((p) => p.group === group)
                  .map((partner) => (
                    <li key={partner.name}>
                      <a
                        href={partner.url}
                        {...external}
                        aria-label={`${partner.name} (${t("newTab")})`}
                        className={`${tileClass} p-4`}
                      >
                        {partner.logo ? (
                          <Image
                            src={partner.logo.src}
                            alt={partner.name}
                            title={partner.name}
                            width={partner.logo.width}
                            height={partner.logo.height}
                            sizes="160px"
                            className="max-h-full max-w-full w-auto h-auto object-contain"
                          />
                        ) : (
                          <span className="text-secondary text-xs font-bold text-center leading-snug">
                            {partner.name}
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </section>

        <div className="md:col-span-2 pt-8 border-t border-secondary/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-secondary/60">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
