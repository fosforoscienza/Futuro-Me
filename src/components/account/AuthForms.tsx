"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Link } from "@/i18n/routing";
import { login, signup, type AuthState } from "@/lib/auth/actions";

const input =
  "w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-base text-on-surface focus:outline-2 focus:outline-secondary";
const label = "block text-sm font-bold text-secondary mb-2";
const hint = "mt-2 text-xs text-on-surface-variant leading-relaxed";
const submit =
  "w-full px-6 py-3.5 rounded-full font-bold text-sm inline-flex items-center justify-center gap-2 bg-primary text-on-primary hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-60";

function ErrorMessage({ state }: { state: AuthState }) {
  const t = useTranslations("account.errors");
  if (!state) return null;
  return (
    <p role="alert" className="text-sm font-bold text-primary bg-primary-fixed/50 rounded-xl px-4 py-3">
      {t(state.error)}
    </p>
  );
}

function PasswordInput({
  id,
  autoComplete,
  describedBy,
  minLength,
}: {
  id: string;
  autoComplete: string;
  describedBy?: string;
  minLength?: number;
}) {
  const t = useTranslations("account");
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        maxLength={72}
        aria-describedby={describedBy}
        className={`${input} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? t("hidePassword") : t("showPassword")}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 px-4 text-on-surface-variant hover:text-secondary cursor-pointer"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export function LoginForm() {
  const t = useTranslations("account");
  const locale = useLocale();
  const [state, action, pending] = useActionState(login, null);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label htmlFor="username" className={label}>
          {t("username")}
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          maxLength={64}
          defaultValue={state?.values?.username}
          key={state?.values?.username}
          className={input}
        />
      </div>
      <div>
        <label htmlFor="password" className={label}>
          {t("password")}
        </label>
        <PasswordInput id="password" autoComplete="current-password" />
      </div>
      <ErrorMessage state={state} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? t("loginPending") : t("loginButton")} <ArrowRight size={16} />
      </button>
      <p className={hint}>
        {t("forgotPassword")}{" "}
        <Link href="/contatti" className="font-bold text-secondary underline underline-offset-2">
          {t("passwordHelp")}
        </Link>
      </p>
      <p className="text-sm text-on-surface-variant pt-2 border-t border-outline-variant/60">
        {t("noAccount")}{" "}
        <Link href="/registrati" className="font-bold text-secondary underline underline-offset-4">
          {t("signupLink")}
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const t = useTranslations("account");
  const locale = useLocale();
  const [state, action, pending] = useActionState(signup, null);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label htmlFor="codice" className={label}>
          {t("classCode")}
        </label>
        <input
          id="codice"
          name="codice"
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          required
          maxLength={20}
          placeholder={t("classCodePlaceholder")}
          defaultValue={state?.values?.codice}
          key={`c-${state?.values?.codice}`}
          className={`${input} uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal`}
        />
      </div>
      <div>
        <label htmlFor="username" className={label}>
          {t("username")}
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          minLength={3}
          maxLength={24}
          pattern="[a-zA-Z0-9._]{3,24}"
          aria-describedby="username-hint"
          defaultValue={state?.values?.username}
          key={`u-${state?.values?.username}`}
          className={input}
        />
        <p id="username-hint" className={hint}>
          {t("usernameHint")}
        </p>
      </div>
      <div>
        <label htmlFor="password" className={label}>
          {t("password")}
        </label>
        <PasswordInput id="password" autoComplete="new-password" describedBy="password-hint" minLength={8} />
        <p id="password-hint" className={hint}>
          {t("passwordHint")}
        </p>
      </div>
      <div>
        <label htmlFor="password2" className={label}>
          {t("passwordConfirm")}
        </label>
        <PasswordInput id="password2" autoComplete="new-password" minLength={8} />
      </div>
      <ErrorMessage state={state} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? t("signupPending") : t("signupButton")} <ArrowRight size={16} />
      </button>
      <p className={hint}>
        {t.rich("privacyNote", {
          link: (chunks) => (
            <Link href="/privacy" className="underline underline-offset-2 text-secondary">
              {chunks}
            </Link>
          ),
        })}
      </p>
      <p className="text-sm text-on-surface-variant pt-2 border-t border-outline-variant/60">
        {t("haveAccount")}{" "}
        <Link href="/accedi" className="font-bold text-secondary underline underline-offset-4">
          {t("loginLink")}
        </Link>
      </p>
    </form>
  );
}
