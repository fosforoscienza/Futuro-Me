import { ImageResponse } from "next/og";
import { getNewsBySlug } from "@/lib/news/repository";

// Anteprima propria di ogni news (titolo e fonte): niente foto delle testate,
// che restano nella pagina con il loro credito.
export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Fisso: con generateImageMetadata l'URL diventerebbe /opengraph-image/<id>.
export const alt = "Il Futuro Me — News";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const article = await getNewsBySlug(slug, locale);
  const title = article?.title ?? "News";
  const source = article ? `${locale === "en" ? "Source" : "Fonte"}: ${article.source}` : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #fff9eb 0%, #e0dac7 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "#962e16",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "24px",
              fontWeight: 800,
            }}
          >
            F
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "#306387" }}>
            Il Futuro Me · News
          </span>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 80 ? "48px" : "60px",
            fontWeight: 800,
            color: "#306387",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "22px",
            color: "#41474e",
            fontWeight: 600,
          }}
        >
          <span>{source}</span>
          <span style={{ color: "#72787f" }}>ilfuturome.it</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
