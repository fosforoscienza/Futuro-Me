import { ImageResponse } from "next/og";

export const alt = "Il Futuro Me — Orientamento e Carriere per Giovani";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const title = locale === "en" ? "Your Future, Explored." : "Il Tuo Futuro, Esplorato.";
  const subtitle =
    locale === "en"
      ? "Career guidance platform for youth aged 12-16"
      : "Piattaforma di orientamento per giovani 12-16 anni";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #fff9eb 0%, #e0dac7 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
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
          <span
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#306387",
              letterSpacing: "-0.02em",
            }}
          >
            Il Futuro Me
          </span>
        </div>

        <div
          style={{
            fontSize: "64px",
            fontWeight: 800,
            color: "#306387",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            marginBottom: "24px",
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: "28px",
            color: "#41474e",
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "80px",
            fontSize: "16px",
            color: "#72787f",
            fontWeight: 600,
          }}
        >
          ilfuturome.it
        </div>
      </div>
    ),
    { ...size }
  );
}
