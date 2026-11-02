"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

const NOTICE_KEY = "futuro-me-cookie-consent";
const NOTICE_EVENT = "futuro-me-cookie-notice";
let dismissed = false;

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(NOTICE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(NOTICE_EVENT, onChange);
  };
}

function isDismissed() {
  if (dismissed) return true;
  try {
    return localStorage.getItem(NOTICE_KEY) !== null;
  } catch {
    return false;
  }
}

export function CookieConsent() {
  const t = useTranslations("cookieConsent");
  const hidden = useSyncExternalStore(subscribe, isDismissed, () => true);

  function dismiss() {
    dismissed = true;
    try {
      localStorage.setItem(NOTICE_KEY, "dismissed");
    } catch {
      // The notice can still close when browser storage is unavailable.
    }
    window.dispatchEvent(new Event(NOTICE_EVENT));
  }

  if (hidden) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-surface-container-highest rounded-[1.5rem] p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center gap-4">
        <p className="text-sm text-on-surface flex-1 leading-relaxed">
          {t("message")}{" "}
          <Link href="/privacy" className="text-primary font-bold underline underline-offset-2">
            {t("learnMore")}
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 px-5 py-2 rounded-full text-sm font-bold text-on-primary bg-primary hover:bg-primary-container transition-colors cursor-pointer"
        >
          {t("dismiss")}
        </button>
      </div>
    </div>
  );
}
