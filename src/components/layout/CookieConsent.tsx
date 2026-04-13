"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

const CONSENT_KEY = "futuro-me-cookie-consent";

export function CookieConsent() {
  const t = useTranslations("cookieConsent");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  function reject() {
    localStorage.setItem(CONSENT_KEY, "rejected");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-surface-container-highest rounded-[1.5rem] p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center gap-4">
        <p className="text-sm text-on-surface flex-1 leading-relaxed">
          {t("message")}{" "}
          <Link
            href="/privacy"
            className="text-primary font-bold underline underline-offset-2"
          >
            {t("learnMore")}
          </Link>
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={reject}
            className="px-5 py-2 rounded-full text-sm font-bold text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            {t("reject")}
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 rounded-full text-sm font-bold text-on-primary bg-primary hover:bg-primary-container transition-colors cursor-pointer"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
