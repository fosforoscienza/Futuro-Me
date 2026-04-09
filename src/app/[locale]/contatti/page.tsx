import { setRequestLocale } from "next-intl/server";
import { Mail, MapPin, ExternalLink } from "lucide-react";

export default async function ContattiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="pb-24 md:pb-12">
      <header className="px-6 max-w-7xl mx-auto pt-12 pb-16">
        <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4">
          Connettiti
        </p>
        <h1 className="text-5xl md:text-7xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tighter max-w-3xl leading-[0.9]">
          Contatti
        </h1>
        <p className="mt-8 text-xl text-on-surface-variant max-w-2xl leading-relaxed">
          Per informazioni sul progetto, collaborazioni o feedback, contattaci.
        </p>
      </header>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface-container-low p-8 rounded-[1.5rem]">
          <h2 className="text-xl font-[var(--font-plus-jakarta)] font-bold text-secondary mb-6">
            Ente Promotore
          </h2>
          <div className="space-y-4">
            <p className="font-bold text-secondary">
              Fondazione Caritas Senigallia ETS
            </p>
            <div className="flex items-center gap-3 text-on-surface-variant">
              <MapPin size={18} />
              <span className="text-sm">Senigallia, Provincia di Ancona</span>
            </div>
            <div className="flex items-center gap-3 text-on-surface-variant">
              <Mail size={18} />
              <span className="text-sm">info@ilfuturome.it</span>
            </div>
            <div className="flex items-center gap-3 text-on-surface-variant">
              <ExternalLink size={18} />
              <span className="text-sm">
                Bando Direzione Giovani 2024 — Fondazione Cariverona
              </span>
            </div>
          </div>
        </div>

        <div className="bg-secondary p-8 rounded-[1.5rem] text-white">
          <h2 className="text-xl font-[var(--font-plus-jakarta)] font-bold mb-6">
            Feedback sul Progetto
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-6">
            Il tuo contributo è fondamentale per migliorare la piattaforma.
            Condividi le tue idee, suggerimenti o segnalazioni.
          </p>
          <a
            href="mailto:feedback@ilfuturome.it"
            className="bg-white text-secondary px-6 py-3 rounded-full font-bold text-sm inline-flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Mail size={16} /> Invia Feedback
          </a>
        </div>
      </div>
    </div>
  );
}
