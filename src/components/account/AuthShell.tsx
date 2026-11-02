import type { ReactNode } from "react";
import { KeyRound } from "lucide-react";

const headline = "font-[var(--font-plus-jakarta)]";

/** Impaginazione comune di accesso e registrazione. */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="pb-28 md:pb-16">
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-10 md:pt-14">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={16} className="text-primary" />
          <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs">{eyebrow}</p>
        </div>
        <h1
          className={`text-4xl md:text-6xl ${headline} font-extrabold text-secondary tracking-tighter leading-[0.95]`}
        >
          {title}
        </h1>
        <p className="mt-5 text-lg text-on-surface-variant leading-relaxed">{subtitle}</p>
        <div className="mt-8 bg-surface-container-low p-6 sm:p-8 rounded-[1.5rem]">{children}</div>
      </div>
    </div>
  );
}
