import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { newsArticles, type NewsArticle } from "@/lib/news-data";
import { getAllNews, getNewsBySlug } from "@/lib/news/repository";
import { NewsImage } from "@/components/news/NewsImage";
import { JsonLd } from "@/components/seo/JsonLd";
import { BASE_URL, SITE_NAME } from "@/lib/constants";
import { pageMetadata, pageUrl, webPageNodes } from "@/lib/seo";

// Le news statiche sono prerenderizzate; quelle del job vengono generate alla
// prima visita e aggiornate dopo ogni pubblicazione.
export const revalidate = 3600;

export function generateStaticParams() {
  return newsArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getNewsBySlug(slug, locale);
  if (!article) return {};
  const t = await getTranslations({ locale, namespace: "news" });
  const lang = article.lang ?? "it";

  return pageMetadata({
    locale,
    path: `/news/${slug}`,
    title: article.title,
    description: article.excerpt,
    languages: article.languages ?? ["it"],
    // Senza traduzione la pagina inglese ripete il testo italiano: canonical sull'originale.
    canonicalLocale: lang !== locale ? lang : undefined,
    article: {
      publishedTime: article.publishedAt ?? article.date,
      section: t(`categories.${article.category}`),
    },
  });
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const all = await getAllNews(locale);
  const article = all.find((a) => a.slug === slug);
  if (!article) notFound();

  const related = all
    .filter((a) => a.slug !== article.slug)
    .sort(
      (a, b) =>
        Number(b.category === article.category) -
        Number(a.category === article.category)
    )
    .slice(0, 2);

  return <ArticleContent article={article} related={related} locale={locale} />;
}

function ArticleContent({
  article,
  related: relatedNews,
  locale,
}: {
  article: NewsArticle;
  related: NewsArticle[];
  locale: string;
}) {
  const t = useTranslations("news");
  const tNav = useTranslations("nav");
  const lang = article.lang ?? "it";
  const path = `/news/${article.slug}`;
  const url = pageUrl(lang, path);

  // La fonte resta sempre citata: l'articolo è una sintesi dell'originale.
  const jsonLd = [
    ...webPageNodes({
      locale: lang,
      path,
      name: article.title,
      description: article.excerpt,
      homeName: tNav("home"),
      breadcrumbs: [
        { name: t("title"), path: "/news" },
        { name: article.title, path },
      ],
    }),
    {
      "@type": "NewsArticle",
      "@id": `${url}#article`,
      headline: article.title.length > 110 ? `${article.title.slice(0, 109)}…` : article.title,
      description: article.excerpt,
      inLanguage: lang,
      url,
      mainEntityOfPage: { "@id": `${url}#webpage` },
      datePublished: article.publishedAt ?? article.date,
      articleSection: t(`categories.${article.category}`),
      image: article.imageUrl ? [article.imageUrl] : [`${pageUrl(lang)}/opengraph-image`],
      author: { "@type": "Organization", name: SITE_NAME, url: BASE_URL },
      publisher: { "@type": "Organization", name: SITE_NAME, url: BASE_URL },
      isBasedOn: {
        "@type": "CreativeWork",
        url: article.sourceUrl,
        datePublished: article.date,
        publisher: { "@type": "Organization", name: article.source },
      },
      citation: article.sourceUrl,
      ...(article.auto ? { abstract: t("autoNote") } : {}),
    },
  ];

  return (
    <div className="pb-24 md:pb-12">
      <JsonLd data={jsonLd} />
      <div className="max-w-3xl mx-auto px-6" lang={lang}>
        {/* Back link */}
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all mt-4 mb-10"
        >
          <ArrowLeft size={16} /> {t("title")}
        </Link>

        {/* Category & date */}
        <div className="flex items-center gap-3 mb-6">
          <span className="bg-tertiary-container text-on-tertiary-container text-xs font-bold px-3 py-1 rounded-full">
            {t(`categories.${article.category}`)}
          </span>
          <span className="text-sm text-on-surface-variant">
            {t("publishedOn")}{" "}
            {new Date(article.date).toLocaleDateString(locale === "en" ? "en-GB" : "it-IT", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-[var(--font-plus-jakarta)] font-extrabold text-secondary tracking-tighter leading-[1.1] mb-8">
          {article.title}
        </h1>

        {/* Photo */}
        <figure className="mb-8">
          <NewsImage
            src={article.imageUrl}
            alt={article.title}
            category={article.category}
            showCredit={false}
            className="aspect-[16/9] w-full rounded-[1.5rem]"
          />
          {article.imageUrl && (
            <figcaption className="mt-2 text-xs text-outline">
              {t("photo")}:{" "}
              <a
                href={article.imageCreditUrl ?? article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {article.imageCredit ?? article.source}
              </a>
            </figcaption>
          )}
        </figure>

        {/* Source */}
        <div className="text-sm text-outline mb-10 pb-10 border-b border-outline-variant/30 space-y-3">
          <p>
            {t("source")}:{" "}
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-bold hover:underline"
            >
              {article.source}
            </a>
          </p>
          {article.auto && (
            <p className="text-xs text-on-surface-variant">{t("autoNote")}</p>
          )}
        </div>

        {/* Content */}
        <div className="prose-custom space-y-6">
          {article.content.split("\n\n").map((paragraph, i) => {
            if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
              const text = paragraph.slice(2, -2);
              return (
                <h2
                  key={i}
                  className="text-xl font-[var(--font-plus-jakarta)] font-bold text-secondary mt-10 mb-4"
                >
                  {text}
                </h2>
              );
            }

            const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
            return (
              <p
                key={i}
                className="text-on-surface-variant leading-relaxed text-[1.05rem]"
              >
                {parts.map((part, j) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                      <strong key={j} className="text-secondary font-bold">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return <span key={j}>{part}</span>;
                })}
              </p>
            );
          })}
        </div>

        {/* Original article */}
        <a
          href={article.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex items-center gap-2 bg-secondary text-white font-bold text-sm px-5 py-3 rounded-full hover:bg-secondary/90 transition-colors"
        >
          {t("readOriginal")} ({article.source})
          <ExternalLink size={16} aria-hidden />
        </a>

        {/* Related */}
        <div className="mt-16 pt-10 border-t border-outline-variant/30">
          <h3 className="text-lg font-[var(--font-plus-jakarta)] font-bold text-secondary mb-6">
            {t("relatedNews")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedNews.map((related) => (
              <Link
                key={related.slug}
                href={`/news/${related.slug}` as "/news/[slug]"}
                className="bg-surface-container-lowest rounded-[1.5rem] overflow-hidden hover:translate-y-[-2px] transition-transform group"
              >
                <NewsImage
                  src={related.imageUrl}
                  alt=""
                  category={related.category}
                  credit={related.imageCredit ?? related.source}
                  className="aspect-[16/9] w-full"
                />
                <div className="p-6">
                  <span className="bg-tertiary-container text-on-tertiary-container text-xs font-bold px-3 py-1 rounded-full">
                    {t(`categories.${related.category}`)}
                  </span>
                  <h4 className="font-[var(--font-plus-jakarta)] font-bold text-secondary mt-3 group-hover:text-primary transition-colors">
                    {related.title}
                  </h4>
                  <p className="text-xs text-outline mt-2">
                    {t("source")}: {related.source}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
