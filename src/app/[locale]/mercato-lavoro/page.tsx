import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import {
  TrendingUp,
  Cpu,
  Stethoscope,
  HeartPulse,
  Code,
  Wrench,
  Handshake,
  BarChart3,
  Zap,
  Users,
  Lightbulb,
  MessageSquare,
  Target,
  Puzzle,
  MapPin,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const market = messages.market as Record<string, string>;
  return { title: market.title, description: market.subtitle };
}

export default async function MercatoLavoroPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MercatoContent />;
}

function MercatoContent() {
  const t = useTranslations("market");

  // Fonti: ogni dato numerico della pagina ha la sua fonte accanto.
  const EXCELSIOR = {
    name: "Unioncamere – Ministero del Lavoro, Sistema Excelsior: previsioni dei fabbisogni occupazionali 2025-2029 (II aggiornamento, 2026), tab. 5.2",
    url: "https://excelsior.unioncamere.net/sites/default/files/pubblicazioni/2025/report_previsivo_2025-29_agg.pdf",
  };
  const WEF = {
    name: "World Economic Forum, Future of Jobs Report 2025",
    url: "https://reports.weforum.org/docs/WEF_Future_of_Jobs_Report_2025.pdf",
  };

  // Lavoratori richiesti in Italia nel 2025-2029 (scenario negativo – positivo).
  const topJobs = [
    { icon: Stethoscope, title: "Tecnici della salute", need: "157.100 – 166.700" },
    { icon: BarChart3, title: "Specialisti in scienze gestionali, commerciali e bancarie", need: "102.600 – 110.100" },
    { icon: Handshake, title: "Tecnici dei rapporti con i mercati", need: "84.600 – 94.800" },
    { icon: Wrench, title: "Ingegneri", need: "55.100 – 61.300" },
    { icon: HeartPulse, title: "Medici", need: "55.000 – 59.400" },
    { icon: Code, title: "Analisti e specialisti nella progettazione di applicazioni", need: "29.700 – 31.600" },
  ];

  const aiImpactAreas = [
    {
      title: "Competenze che cambiano",
      desc: "Le imprese prevedono che il 39% delle competenze richieste oggi cambierà o diventerà superato tra il 2025 e il 2030. Nello stesso periodo si stimano 170 milioni di nuovi posti di lavoro nel mondo e 92 milioni sostituiti: un saldo di +78 milioni.",
      percentage: 39,
      label: "Competenze che cambiano entro il 2030",
    },
    {
      title: "AI e trattamento dei dati",
      desc: "L'86% delle imprese si aspetta che intelligenza artificiale e trattamento delle informazioni trasformino la propria attività entro il 2030. Da sole, queste tecnologie creeranno 11 milioni di posti e ne sostituiranno 9 milioni.",
      percentage: 86,
      label: "Imprese che si aspettano una trasformazione",
    },
    {
      title: "Pensiero analitico",
      desc: "Sette imprese su dieci considerano il pensiero analitico la competenza fondamentale; seguono resilienza, flessibilità e agilità, poi leadership e influenza sociale. L'85% dei datori di lavoro punta a far crescere le competenze dei propri dipendenti.",
      percentage: 69,
      label: "Imprese che lo ritengono essenziale",
    },
  ];

  const localStats = [
    {
      value: "10,8%",
      desc: "Giovani 15-29 anni NEET (né al lavoro né in studio o formazione) nelle Marche nel 2025: in Italia sono il 13,3%, nell'Unione europea l'11,0%. Nel 2019 nelle Marche erano il 15,3%.",
      source: {
        name: "Eurostat, edat_lfse_22 (dati ISTAT, Rilevazione forze di lavoro), 2025",
        url: "https://ec.europa.eu/eurostat/databrowser/view/edat_lfse_22/default/table",
      },
    },
    {
      value: "14,4%",
      desc: "Tasso di disoccupazione dei giovani 15-29 anni nelle Marche nel 2025, uguale alla media italiana (14,4%); nell'Unione europea è l'11,7%.",
      source: {
        name: "Eurostat, lfst_r_lfu3rt, 2025",
        url: "https://ec.europa.eu/eurostat/databrowser/view/lfst_r_lfu3rt/default/table",
      },
    },
    {
      value: "50,6%",
      desc: "Assunzioni previste dalle imprese della Provincia di Ancona che sono di difficile reperimento: una su due, nel 2024. Il tasso di occupazione 15-64 anni in provincia è del 66,2%.",
      source: {
        name: "Camera di Commercio delle Marche, Dataview 2025 – Mercato del lavoro (dati 2024)",
        url: "https://www.marche.camcom.it/la-camera/novita-ed-eventi/novita/dataview-infografiche-e-dati-statistici-delleconomia-marchigiana/dataview-2025/mercato_lavoro_marche.pdf/view",
      },
    },
  ];

  const skills = [
    { icon: Lightbulb, name: "Pensiero Critico" },
    { icon: MessageSquare, name: "Comunicazione" },
    { icon: Puzzle, name: "Problem Solving" },
    { icon: Users, name: "Collaborazione" },
    { icon: Zap, name: "Adattabilità" },
    { icon: Target, name: "Creatività" },
  ];

  return (
    <div className="pb-24 md:pb-12">
      {/* Header */}
      <header className="px-6 max-w-7xl mx-auto pt-12 pb-16">
        <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4">
          Report
        </p>
        <h1 className="text-5xl md:text-7xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tighter max-w-3xl leading-[0.9]">
          {t("title")}
        </h1>
        <p className="mt-8 text-xl text-on-surface-variant max-w-2xl leading-relaxed">
          {t("subtitle")}
        </p>
      </header>

      {/* Top Jobs */}
      <section className="bg-surface-container-low py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-[var(--font-plus-jakarta)] font-bold text-secondary mb-10">
            {t("topJobsTitle")}
          </h2>
          <p className="text-on-surface-variant mb-8 max-w-2xl text-sm">
            Lavoratori richiesti in Italia dal 2025 al 2029 (tra scenario
            prudente e scenario positivo), per le professioni con il
            fabbisogno più alto tra quelle qualificate.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {topJobs.map((job) => {
              const Icon = job.icon;
              return (
                <div
                  key={job.title}
                  className="bg-surface-container-lowest p-6 rounded-[1.5rem] hover:translate-y-[-4px] transition-transform"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-secondary-container p-3 rounded-xl">
                      <Icon
                        size={24}
                        className="text-on-secondary-container"
                      />
                    </div>
                    <span className="text-primary font-bold text-sm flex items-center gap-1">
                      <TrendingUp size={14} /> {job.need}
                    </span>
                  </div>
                  <h3 className="font-[var(--font-plus-jakarta)] font-bold text-secondary mb-1">
                    {job.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    lavoratori richiesti 2025-2029
                  </p>
                </div>
              );
            })}
          </div>
          <SourceNote source={EXCELSIOR} />
        </div>
      </section>

      {/* AI Impact */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center gap-3 mb-2">
          <Cpu size={24} className="text-primary" />
          <h2 className="text-2xl font-[var(--font-plus-jakarta)] font-bold text-secondary">
            {t("aiImpactTitle")}
          </h2>
        </div>
        <p className="text-on-surface-variant mb-10 max-w-2xl">
          {t("aiImpactDesc")}
        </p>

        <div className="space-y-6">
          {aiImpactAreas.map((area) => (
            <div
              key={area.title}
              className="bg-surface-container-low p-8 rounded-[1.5rem]"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <h3 className="font-[var(--font-plus-jakarta)] font-bold text-lg text-secondary mb-2">
                    {area.title}
                  </h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    {area.desc}
                  </p>
                </div>
                <div className="md:w-48 shrink-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-secondary">
                      {area.label}
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {area.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${area.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <SourceNote source={WEF} />
      </section>

      {/* Key Skills */}
      <section className="bg-secondary py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-[var(--font-plus-jakarta)] font-bold text-white mb-10">
            {t("skillsTitle")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {skills.map((skill) => {
              const Icon = skill.icon;
              return (
                <div
                  key={skill.name}
                  className="bg-white/10 backdrop-blur-sm p-6 rounded-[1.5rem] flex items-center gap-4 text-white"
                >
                  <Icon size={24} />
                  <span className="font-bold">{skill.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Local Context */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center gap-3 mb-2">
          <MapPin size={24} className="text-primary" />
          <h2 className="text-2xl font-[var(--font-plus-jakarta)] font-bold text-secondary">
            {t("localContextTitle")}
          </h2>
        </div>
        <p className="text-on-surface-variant mb-10 max-w-2xl">
          {t("localContextDesc")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {localStats.map((stat) => (
            <div
              key={stat.value}
              className="bg-surface-container-low p-8 rounded-[1.5rem] flex flex-col"
            >
              <p className="text-4xl font-[var(--font-plus-jakarta)] font-extrabold text-primary mb-2">
                {stat.value}
              </p>
              <p className="text-sm text-on-surface-variant">{stat.desc}</p>
              <p className="text-xs text-outline mt-auto pt-4">
                Fonte:{" "}
                <a
                  href={stat.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary"
                >
                  {stat.source.name}
                </a>
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SourceNote({ source }: { source: { name: string; url: string } }) {
  return (
    <p className="text-xs text-outline mt-6">
      Fonte:{" "}
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-primary"
      >
        {source.name}
      </a>
    </p>
  );
}
