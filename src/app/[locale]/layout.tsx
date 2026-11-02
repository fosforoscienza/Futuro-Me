import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Plus_Jakarta_Sans, Manrope } from "next/font/google";
import { routing } from "@/i18n/routing";
import { BASE_URL, SITE_NAME } from "@/lib/constants";
import { siteGraph } from "@/lib/seo";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { JsonLd } from "@/components/seo/JsonLd";
import "../globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = { themeColor: "#962e16" };

// Valori di base: ogni pagina pubblica imposta canonical, hreflang e Open Graph
// con pageMetadata (src/lib/seo.ts). Qui niente canonical, che le pagine erediterebbero.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const meta = messages.meta as Record<string, string>;

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      template: `%s | ${SITE_NAME}`,
      default: meta.title,
    },
    description: meta.description,
    applicationName: SITE_NAME,
    openGraph: {
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Senza questo controllo /llms.txt o /qualsiasi diventavano pagine con lang="qualsiasi".
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations({ locale });

  return (
    <html
      lang={locale}
      className={`${plusJakarta.variable} ${manrope.variable} antialiased`}
    >
      <body className="min-h-screen bg-background text-on-surface font-[var(--font-manrope)]">
        <JsonLd
          data={siteGraph({
            description: `${t("project.subtitle")} ${t("project.overview")}`,
            fundedBy: t("footer.fundedBy"),
            audience: t("meta.audience"),
          })}
        />
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="pt-24">{children}</main>
          <Footer />
          <MobileNav />
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
