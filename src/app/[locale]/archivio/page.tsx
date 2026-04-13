import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import {
  Brain,
  Rocket,
  Clock,
  FileText,
  Download,
  BarChart3,
  FileArchive,
  Table,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const archive = messages.archive as Record<string, string>;
  return { title: archive.title, description: archive.subtitle };
}

export default async function ArchivioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ArchivioContent />;
}

function ArchivioContent() {
  const t = useTranslations("archive");

  const timelineItems = [
    {
      icon: Brain,
      title: "Questionario Iniziale di Orientamento",
      subtitle: "Ottobre 2024 • 45 Domande",
      status: "complete" as const,
      iconBg: "bg-secondary-container",
      iconColor: "text-on-secondary-container",
      actions: [
        { icon: FileText, label: t("viewReport") },
        { icon: Download, label: t("downloadPdf") },
      ],
    },
    {
      icon: Rocket,
      title: "Report Evoluzione Competenze",
      subtitle: "Marzo 2025 • Revisione Semestrale",
      status: "complete" as const,
      iconBg: "bg-tertiary-container",
      iconColor: "text-on-tertiary-container",
      actions: [{ icon: BarChart3, label: "Visual Insights" }],
    },
    {
      icon: Clock,
      title: "Valutazione Finale Anno 1",
      subtitle: "Disponibile Luglio 2025",
      status: "upcoming" as const,
      iconBg: "bg-surface-container",
      iconColor: "text-outline",
      actions: [],
    },
  ];

  const documents = [
    { icon: FileText, name: "Summary_Y1.pdf", size: "2.4 MB", type: "PDF" },
    { icon: Table, name: "Competency_Matrix.csv", size: "128 KB", type: "CSV" },
    {
      icon: FileArchive,
      name: "Archive_Complete_2024.zip",
      size: "15.8 MB",
      type: "ZIP",
    },
  ];

  return (
    <div className="pb-24 md:pb-12">
      {/* Header */}
      <header className="px-6 max-w-7xl mx-auto pt-12 pb-16">
        <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4">
          Kinetic Archive
        </p>
        <h1 className="text-5xl md:text-7xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tighter max-w-3xl leading-[0.9]">
          {t("title")}
        </h1>
        <p className="mt-8 text-xl text-on-surface-variant max-w-2xl leading-relaxed">
          {t("subtitle")}
        </p>
      </header>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Timeline */}
        <section className="md:col-span-8">
          <div className="bg-surface-container-low rounded-[1.5rem] p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-[var(--font-plus-jakarta)] font-bold text-secondary">
                {t("timelineTitle")}
              </h2>
              <div className="flex gap-2">
                <span className="bg-surface-container-highest px-4 py-1 rounded-full text-xs font-bold text-secondary">
                  {t("year1")}
                </span>
                <span className="bg-tertiary-container px-4 py-1 rounded-full text-xs font-bold text-on-tertiary-container">
                  {t("currentPhase")}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {timelineItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={`p-6 rounded-[1.5rem] flex items-start gap-6 transition-all ${
                      item.status === "complete"
                        ? "bg-surface-container-lowest hover:translate-x-2"
                        : "bg-surface-container border-2 border-dashed border-outline-variant/40"
                    }`}
                  >
                    <div className={`${item.iconBg} p-3 rounded-xl`}>
                      <Icon size={24} className={item.iconColor} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-[var(--font-plus-jakarta)] font-bold text-lg text-secondary">
                            {item.title}
                          </h3>
                          <p className="text-on-surface-variant text-sm">
                            {item.subtitle}
                          </p>
                        </div>
                        <span
                          className={`font-bold text-sm ${
                            item.status === "complete"
                              ? "text-primary"
                              : "text-outline"
                          }`}
                        >
                          {t(item.status)}
                        </span>
                      </div>
                      {item.actions.length > 0 && (
                        <div className="mt-4 flex gap-4">
                          {item.actions.map((action) => {
                            const ActionIcon = action.icon;
                            return (
                              <button
                                key={action.label}
                                className="flex items-center gap-2 text-xs font-bold text-secondary bg-surface-container px-3 py-2 rounded-lg hover:bg-secondary hover:text-white transition-colors cursor-pointer"
                              >
                                <ActionIcon size={14} /> {action.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="md:col-span-4 space-y-8">
          {/* Quick Access */}
          <div className="bg-surface-container-high p-8 rounded-[1.5rem]">
            <h3 className="text-xl font-[var(--font-plus-jakarta)] font-bold text-secondary mb-6">
              {t("documentsTitle")}
            </h3>
            <div className="space-y-4">
              {documents.map((doc) => {
                const DocIcon = doc.icon;
                return (
                  <div
                    key={doc.name}
                    className="flex items-center gap-4 group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center group-hover:bg-secondary transition-colors">
                      <DocIcon
                        size={20}
                        className="text-secondary group-hover:text-white"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-secondary">
                        {doc.name}
                      </p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
                        {doc.size} • {doc.type}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Archive Status */}
          <div className="bg-surface-container-lowest p-6 rounded-[1.5rem]">
            <h4 className="font-[var(--font-plus-jakarta)] font-bold text-secondary">
              {t("archiveStatus")}
            </h4>
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-secondary">
                  {t("year1")}
                </span>
                <span className="text-xs font-bold text-primary">
                  45%
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: "45%" }}
                />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-secondary">
                  {t("year2")}
                </span>
                <span className="text-xs font-bold text-outline">
                  {t("upcoming")}
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2">
                <div
                  className="bg-outline-variant h-2 rounded-full"
                  style={{ width: "0%" }}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
