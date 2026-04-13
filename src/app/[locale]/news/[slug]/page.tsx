import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { newsArticles, getArticleBySlug } from "@/lib/news-data";

export function generateStaticParams() {
  return newsArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.excerpt,
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return <ArticleContent article={article} />;
}

function ArticleContent({
  article,
}: {
  article: NonNullable<ReturnType<typeof getArticleBySlug>>;
}) {
  const t = useTranslations("news");

  return (
    <div className="pb-24 md:pb-12">
      <div className="max-w-3xl mx-auto px-6">
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
            {new Date(article.date).toLocaleDateString("it-IT", {
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

        {/* Source */}
        <div className="flex items-center gap-2 text-sm text-outline mb-10 pb-10 border-b border-outline-variant/30">
          <span>
            {t("source")}:{" "}
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-bold hover:underline"
            >
              {article.source}
            </a>
          </span>
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

        {/* Related */}
        <div className="mt-16 pt-10 border-t border-outline-variant/30">
          <h3 className="text-lg font-[var(--font-plus-jakarta)] font-bold text-secondary mb-6">
            {t("relatedNews")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {newsArticles
              .filter((a) => a.slug !== article.slug)
              .slice(0, 2)
              .map((related) => (
                <Link
                  key={related.slug}
                  href={`/news/${related.slug}` as "/news/[slug]"}
                  className="bg-surface-container-lowest p-6 rounded-[1.5rem] hover:translate-y-[-2px] transition-transform group"
                >
                  <span className="bg-tertiary-container text-on-tertiary-container text-xs font-bold px-3 py-1 rounded-full">
                    {t(`categories.${related.category}`)}
                  </span>
                  <h4 className="font-[var(--font-plus-jakarta)] font-bold text-secondary mt-3 group-hover:text-primary transition-colors">
                    {related.title}
                  </h4>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
