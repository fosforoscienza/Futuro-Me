import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import {
  TrendingUp,
  Brain,
  Cpu,
  Stethoscope,
  Code,
  Leaf,
  Shield,
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

  const topJobs = [
    { icon: Code, title: "Sviluppatore Software", growth: "+35%", demand: "Alta" },
    { icon: Brain, title: "Specialista AI/ML", growth: "+45%", demand: "Molto Alta" },
    { icon: Shield, title: "Cybersecurity Analyst", growth: "+28%", demand: "Alta" },
    { icon: Stethoscope, title: "Professionista Sanitario", growth: "+22%", demand: "Alta" },
    { icon: Leaf, title: "Green Economy Specialist", growth: "+30%", demand: "In crescita" },
    { icon: BarChart3, title: "Data Analyst", growth: "+38%", demand: "Molto Alta" },
  ];

  const aiImpactAreas = [
    {
      title: "Automazione Processi",
      desc: "Il 30% delle attività lavorative potrebbe essere automatizzato entro il 2030, ma nuovi ruoli emergeranno per gestire e supervisionare i sistemi AI.",
      percentage: 30,
    },
    {
      title: "Nuove Professioni",
      desc: "Prompt engineer, AI trainer, ethics officer — professioni che non esistevano 5 anni fa e che oggi sono tra le più ricercate.",
      percentage: 65,
    },
    {
      title: "Competenze Ibride",
      desc: "La combinazione di competenze tecniche e soft skills diventa essenziale. Il 78% delle aziende cerca profili 'T-shaped'.",
      percentage: 78,
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
                      <TrendingUp size={14} /> {job.growth}
                    </span>
                  </div>
                  <h3 className="font-[var(--font-plus-jakarta)] font-bold text-secondary mb-1">
                    {job.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Domanda: {job.demand}
                  </p>
                </div>
              );
            })}
          </div>
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
                      Impatto
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
          <div className="bg-surface-container-low p-8 rounded-[1.5rem]">
            <p className="text-4xl font-[var(--font-plus-jakarta)] font-extrabold text-primary mb-2">
              16,7%
            </p>
            <p className="text-sm text-on-surface-variant">
              Tasso NEET a Senigallia (2019), sopra la media UE del 9%
            </p>
          </div>
          <div className="bg-surface-container-low p-8 rounded-[1.5rem]">
            <p className="text-4xl font-[var(--font-plus-jakarta)] font-extrabold text-primary mb-2">
              51,3%
            </p>
            <p className="text-sm text-on-surface-variant">
              Tasso di inattività giovanile (18-29 anni) nella Provincia di
              Ancona
            </p>
          </div>
          <div className="bg-surface-container-low p-8 rounded-[1.5rem]">
            <p className="text-4xl font-[var(--font-plus-jakarta)] font-extrabold text-primary mb-2">
              54,8%
            </p>
            <p className="text-sm text-on-surface-variant">
              Studenti che seguono il consiglio orientativo nella scelta della
              scuola superiore
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
