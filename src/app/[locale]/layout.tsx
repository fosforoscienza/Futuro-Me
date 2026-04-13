import type { Metadata } from "next";
import { NextIntlClientProvider, useMessages } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Plus_Jakarta_Sans, Manrope } from "next/font/google";
import { routing } from "@/i18n/routing";
import { locales } from "@/i18n/config";
import { BASE_URL } from "@/lib/constants";
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

const ogLocaleMap: Record<string, string> = { it: "it_IT", en: "en_GB" };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const meta = messages.meta as Record<string, string>;

  const url = `${BASE_URL}/${locale}`;

  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = `${BASE_URL}/${l}`;
  }

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      template: `%s | Il Futuro Me`,
      default: meta.title,
    },
    description: meta.description,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      siteName: "Il Futuro Me",
      locale: ogLocaleMap[locale] ?? "it_IT",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
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
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${plusJakarta.variable} ${manrope.variable} antialiased`}
    >
      <body className="min-h-screen bg-background text-on-surface font-[var(--font-manrope)]">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Il Futuro Me",
            url: BASE_URL,
            description:
              "Piattaforma di orientamento per giovani 12-16 anni.",
            foundingOrganization: {
              "@type": "EducationalOrganization",
              name: "Fondazione Caritas Senigallia ETS",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Senigallia",
                addressRegion: "AN",
                addressCountry: "IT",
              },
            },
          }}
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
