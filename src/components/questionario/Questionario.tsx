"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ListOrdered,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  OTHER_MAX_LENGTH,
  WORD_MAX_LENGTH,
  allQuestions,
  isVisible,
  otherKey,
  sections,
  validateQuestion,
  type Answers,
  type Question,
  type RankingQuestion,
  type SingleQuestion,
  type WordQuestion,
} from "@/lib/questionario";
import {
  DEFAULT_SELECTION,
  LEVELS,
  type AvatarSelection,
} from "@/lib/avatar/config";
import { AvatarCanvas } from "@/components/avatar/AvatarCanvas";
import { AvatarLevel } from "@/components/avatar/AvatarLevel";

type Status = "intro" | "form" | "sending" | "done";

/**
 * Percorso: i livelli dell'avatar si sbloccano tra un blocco di domande e
 * l'altro, come nel documento (Lv0, domande 1-4, Lv1, domande 5-10, ...).
 */
type Step =
  | { kind: "avatar"; level: (typeof LEVELS)[number] }
  | { kind: "questions"; from: number; to: number };

const level = (id: string) => ({ kind: "avatar" as const, level: LEVELS.find((l) => l.id === id)! });
const block = (from: number, to: number) => ({ kind: "questions" as const, from, to });

const STEPS: Step[] = [
  level("lv0"),
  block(1, 4),
  level("lv1"),
  block(5, 10),
  level("lv2"),
  block(11, 14),
  level("lv3"),
  block(15, 20),
  level("lv4"),
  block(21, 26),
  level("lv5"),
  level("lv6"),
];

const sectionOf = new Map(
  sections.flatMap((s) => s.questions.map((q) => [q.id, s] as const))
);

const headline = "font-[var(--font-plus-jakarta)]";

export function Questionario() {
  const [status, setStatus] = useState<Status>("intro");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [avatar, setAvatar] = useState<AvatarSelection>(DEFAULT_SELECTION);
  const [showErrors, setShowErrors] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const topRef = useRef<HTMLDivElement>(null);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const visibleQuestions =
    step.kind === "questions"
      ? allQuestions.filter(
          (q) => q.number >= step.from && q.number <= step.to && isVisible(q, answers)
        )
      : [];
  const avatarError =
    step.kind === "avatar" && step.level.id === "lv0" && !avatar.corpo
      ? "Scegli il genere per continuare."
      : null;

  const setAnswer = (id: string, value: string | string[]) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const scrollToTop = () =>
    requestAnimationFrame(() =>
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );

  const goTo = (next: number) => {
    setStepIndex(next);
    setShowErrors(false);
    setSubmitError(null);
    scrollToTop();
  };

  const start = () => {
    setStatus("form");
    scrollToTop();
  };

  const restart = () => {
    setAnswers({});
    setAvatar(DEFAULT_SELECTION);
    setStepIndex(0);
    setShowErrors(false);
    setSubmitError(null);
    setStatus("intro");
    scrollToTop();
  };

  const submit = async () => {
    setStatus("sending");
    setSubmitError(null);
    try {
      const res = await fetch("/api/questionario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, avatar, website }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
      scrollToTop();
    } catch {
      setStatus("form");
      setSubmitError(
        "Non siamo riusciti a inviare le tue risposte. Controlla la connessione e riprova."
      );
    }
  };

  const next = () => {
    if (avatarError) {
      setShowErrors(true);
      return;
    }
    const firstInvalid = visibleQuestions.find((q) =>
      validateQuestion(q, answers)
    );
    if (firstInvalid) {
      setShowErrors(true);
      document
        .getElementById(`domanda-${firstInvalid.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (isLast) {
      submit();
    } else {
      goTo(stepIndex + 1);
    }
  };

  const answered = allQuestions.filter(
    (q) => isVisible(q, answers) && !validateQuestion(q, answers)
  ).length;
  const total = allQuestions.filter((q) => isVisible(q, answers)).length;

  return (
    <div className="pb-24 md:pb-12">
      <header className="px-6 max-w-5xl mx-auto pt-12 pb-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-primary" />
          <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs">
            Questionario anonimo
          </p>
        </div>
        <h1
          className={`text-5xl md:text-7xl ${headline} font-extrabold text-secondary tracking-tighter leading-[0.9]`}
        >
          Il Futuro Me
        </h1>
      </header>

      <div
        ref={topRef}
        className={`${step.kind === "avatar" || status === "done" ? "max-w-6xl" : "max-w-3xl"} mx-auto px-6 scroll-mt-28`}
      >
        {status === "intro" && <Intro onStart={start} />}

        {status === "done" && <Done avatar={avatar} onRestart={restart} />}

        {(status === "form" || status === "sending") && (
          <>
            <Progress
              step={stepIndex}
              title={step.kind === "avatar" ? step.level.title : "Domande"}
              answered={answered}
              total={total}
            />

            {step.kind === "avatar" ? (
              <AvatarLevel
                level={step.level}
                selection={avatar}
                onChange={setAvatar}
                error={showErrors ? avatarError : null}
              />
            ) : (
              <div className="mt-8 space-y-6">
                {visibleQuestions.map((q, i) => {
                  const section = sectionOf.get(q.id)!;
                  const newSection =
                    i === 0 || sectionOf.get(visibleQuestions[i - 1].id) !== section;
                  return (
                    <div key={q.id} className="space-y-6">
                      {newSection && (
                        <div className={i > 0 ? "pt-6" : ""}>
                          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                            Sezione {sections.indexOf(section) + 1}
                          </p>
                          <h2
                            className={`mt-1 text-3xl md:text-4xl ${headline} font-extrabold text-secondary tracking-tight`}
                          >
                            {section.title}
                          </h2>
                          {section.intro && (
                            <p className="mt-3 text-lg text-on-surface-variant">
                              {section.intro}
                            </p>
                          )}
                        </div>
                      )}
                      <QuestionCard
                        question={q}
                        answers={answers}
                        setAnswer={setAnswer}
                        error={showErrors ? validateQuestion(q, answers) : null}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Honeypot anti-bot: invisibile per le persone */}
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />

            {submitError && (
              <p
                role="alert"
                className="mt-8 bg-error-container text-on-error-container p-4 rounded-2xl text-sm font-bold"
              >
                {submitError}
              </p>
            )}

            <div className="mt-10 flex items-center justify-between gap-4">
              {stepIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => goTo(stepIndex - 1)}
                  disabled={status === "sending"}
                  className="px-6 py-3 rounded-full font-bold text-sm inline-flex items-center gap-2 bg-surface-container-highest text-on-surface hover:bg-secondary/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft size={16} /> Indietro
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={next}
                disabled={status === "sending"}
                className="px-6 py-3 rounded-full font-bold text-sm inline-flex items-center gap-2 bg-primary text-on-primary hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-70"
              >
                {status === "sending" ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" /> Invio…
                  </>
                ) : isLast ? (
                  <>
                    Invia risposte <Check size={16} />
                  </>
                ) : (
                  <>
                    Avanti <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="bg-surface-container-low p-8 md:p-10 rounded-[1.5rem] max-w-3xl">
      <h2 className={`text-2xl ${headline} font-bold text-secondary mb-4`}>
        Ciao!
      </h2>
      <p className="text-lg text-on-surface-variant leading-relaxed">
        Questo questionario è un&apos;istantanea dei tuoi pensieri, desideri e
        aspirazioni sul futuro. Ricorda: non ci sono risposte giuste o
        sbagliate, ma solo le tue risposte.
      </p>
      <p className="mt-4 text-lg text-on-surface-variant leading-relaxed">
        Mentre rispondi sbloccherai, livello dopo livello, il tuo avatar: come
        ti immagini tra 15 anni?
      </p>
      <ul className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <li className="bg-surface-container-lowest p-4 rounded-2xl flex items-center gap-3">
          <ShieldCheck size={20} className="text-secondary shrink-0" />
          <span className="text-sm font-bold text-secondary">
            Anonimo: non ti chiediamo il nome
          </span>
        </li>
        <li className="bg-surface-container-lowest p-4 rounded-2xl flex items-center gap-3">
          <ListOrdered size={20} className="text-secondary shrink-0" />
          <span className="text-sm font-bold text-secondary">
            26 domande e 7 livelli di avatar
          </span>
        </li>
        <li className="bg-surface-container-lowest p-4 rounded-2xl flex items-center gap-3">
          <Clock size={20} className="text-secondary shrink-0" />
          <span className="text-sm font-bold text-secondary">
            Circa 15 minuti
          </span>
        </li>
      </ul>
      <button
        type="button"
        onClick={onStart}
        className="mt-8 px-6 py-3 rounded-full font-bold text-sm inline-flex items-center gap-2 bg-primary text-on-primary hover:bg-primary-container transition-colors cursor-pointer"
      >
        Inizia <ArrowRight size={16} />
      </button>
    </div>
  );
}

function Done({
  avatar,
  onRestart,
}: {
  avatar: AvatarSelection;
  onRestart: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const download = () => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "il-mio-futuro-me.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[var(--avatar-w)_minmax(0,1fr)] gap-6 md:gap-8 items-start"
      style={
        {
          "--avatar-w": "min(calc((100vh - 10rem) * 848 / 1264), 590px)",
          "--avatar-w-mobile": "min(calc(62vh * 848 / 1264), calc(100vw - 3rem))",
        } as React.CSSProperties
      }
    >
      <AvatarCanvas
        selection={avatar}
        canvasRef={canvasRef}
        className="w-[var(--avatar-w-mobile)] md:w-[var(--avatar-w)] mx-auto"
      />
      <div className="bg-secondary text-white p-8 md:p-10 rounded-[1.5rem] relative overflow-hidden">
        <div className="relative z-10">
          <div className="bg-white/15 p-3 rounded-xl w-fit mb-6">
            <Check size={28} />
          </div>
          <h2 className={`text-3xl ${headline} font-extrabold mb-4`}>
            Grazie!
          </h2>
          <p className="text-white/80 text-lg leading-relaxed max-w-xl">
            Le tue risposte sono state inviate. Ecco il tuo Futuro Me: puoi
            salvarlo e tenerlo come ricordo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={download}
              className="bg-white text-secondary px-6 py-3 rounded-full font-bold text-sm inline-flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer"
            >
              <Download size={16} /> Scarica l&apos;avatar
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="bg-white/15 text-white px-6 py-3 rounded-full font-bold text-sm inline-flex items-center gap-2 hover:bg-white/25 transition-colors cursor-pointer"
            >
              <RotateCcw size={16} /> Nuova compilazione
            </button>
          </div>
        </div>
        <div className="absolute -right-6 -bottom-6 opacity-10">
          <Sparkles size={160} />
        </div>
      </div>
    </div>
  );
}

function Progress({
  step,
  title,
  answered,
  total,
}: {
  step: number;
  title: string;
  answered: number;
  total: number;
}) {
  const percent = Math.round(((step + 1) / STEPS.length) * 100);
  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          Passo {step + 1} di {STEPS.length}
          <span className="sr-only">: {title}</span>
        </p>
        <p className="text-xs font-bold text-on-surface-variant">
          {answered}/{total} risposte
        </p>
      </div>
      <div
        className="w-full bg-surface-container-highest rounded-full h-2"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Avanzamento del questionario"
      >
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

type CardProps<Q extends Question> = {
  question: Q;
  answers: Answers;
  setAnswer: (id: string, value: string | string[]) => void;
  error: string | null;
};

function QuestionCard(props: CardProps<Question>) {
  const { question, error } = props;
  const errorId = `errore-${question.id}`;

  return (
    <fieldset
      id={`domanda-${question.id}`}
      aria-describedby={error ? errorId : undefined}
      className={`bg-surface-container-lowest p-6 md:p-8 rounded-[1.5rem] scroll-mt-28 border-2 transition-colors ${
        error ? "border-error" : "border-transparent"
      }`}
    >
      <legend className="sr-only">
        Domanda {question.number}: {question.text}
      </legend>
      <div className="flex gap-4" aria-hidden="true">
        <span className="bg-secondary-container text-on-secondary-container w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm">
          {question.number}
        </span>
        <p
          className={`${headline} font-bold text-lg text-secondary leading-snug pt-1`}
        >
          {question.text}
        </p>
      </div>
      <p className="mt-2 md:pl-13 text-sm text-on-surface-variant">
        {question.hint ??
          (question.type === "single" ? "Scegli una sola risposta." : null)}
      </p>

      <div className="mt-5 md:pl-13">
        {question.type === "single" && (
          <SingleChoice {...(props as CardProps<SingleQuestion>)} />
        )}
        {question.type === "ranking" && (
          <Ranking {...(props as CardProps<RankingQuestion>)} />
        )}
        {question.type === "word" && (
          <WordInput {...(props as CardProps<WordQuestion>)} />
        )}
      </div>

      {error && (
        <p id={errorId} className="mt-4 md:pl-13 text-sm font-bold text-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}

const isShort = (q: SingleQuestion) =>
  q.options.every((o) => !o.hint && (o.label ?? o.value).length <= 32);

function SingleChoice({ question, answers, setAnswer }: CardProps<SingleQuestion>) {
  const selected = answers[question.id];
  const short = isShort(question);
  const chosen = question.options.find((o) => o.value === selected);

  return (
    <>
      {question.info && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {question.info.map((box) => (
            <div
              key={box.title}
              className="bg-surface-container-low p-5 rounded-2xl"
            >
              <p className="font-bold text-secondary text-sm mb-2">
                {box.title}
              </p>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {box.text}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className={short ? "flex flex-wrap gap-2" : "grid gap-2"}>
        {question.options.map((option) => {
          const checked = selected === option.value;
          return (
            <label
              key={option.value}
              className={`cursor-pointer transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                short
                  ? "px-4 py-2.5 rounded-full text-sm font-bold"
                  : "flex items-start gap-3 p-4 rounded-2xl"
              } ${
                checked
                  ? "bg-secondary text-white"
                  : "bg-surface-container text-on-surface hover:bg-secondary/10"
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={option.value}
                checked={checked}
                onChange={() => setAnswer(question.id, option.value)}
                className="sr-only"
              />
              {!short && (
                <span
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    checked ? "border-white bg-white" : "border-outline"
                  }`}
                  aria-hidden="true"
                >
                  {checked && (
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                  )}
                </span>
              )}
              <span>
                <span className={short ? "" : "font-bold text-sm"}>
                  {option.label ?? option.value}
                </span>
                {option.hint && (
                  <span
                    className={`block text-sm mt-1 ${
                      checked ? "text-white/80" : "text-on-surface-variant"
                    }`}
                  >
                    {option.hint}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      {chosen?.other && (
        <div className="mt-4">
          <label
            htmlFor={`${question.id}-altro`}
            className="block text-sm font-bold text-secondary mb-2"
          >
            Specifica cosa:
          </label>
          <input
            id={`${question.id}-altro`}
            type="text"
            maxLength={OTHER_MAX_LENGTH}
            value={(answers[otherKey(question.id)] as string) ?? ""}
            onChange={(e) => setAnswer(otherKey(question.id), e.target.value)}
            className="w-full bg-surface-container px-4 py-3 rounded-2xl text-on-surface outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}
    </>
  );
}

function Ranking({ question, answers, setAnswer }: CardProps<RankingQuestion>) {
  const ranked = (answers[question.id] as string[] | undefined) ?? [];
  const byValue = new Map(question.options.map((o) => [o.value, o]));
  const remaining = question.options.filter((o) => !ranked.includes(o.value));

  const update = (next: string[]) => setAnswer(question.id, next);
  const move = (index: number, delta: number) => {
    const next = [...ranked];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    update(next);
  };

  return (
    <div className="space-y-6">
      {ranked.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
            La tua classifica
          </p>
          <ol className="grid gap-2">
            {ranked.map((value, i) => (
              <li
                key={value}
                className="flex items-center gap-3 bg-secondary text-white p-3 pl-4 rounded-2xl"
              >
                <span className="bg-white/15 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                  {i + 1}
                </span>
                <span className="font-bold text-sm flex-1">
                  {byValue.get(value)?.label ?? value}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <RankButton
                    label={`Sposta ${value} più in alto`}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ChevronUp size={18} />
                  </RankButton>
                  <RankButton
                    label={`Sposta ${value} più in basso`}
                    disabled={i === ranked.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ChevronDown size={18} />
                  </RankButton>
                  <RankButton
                    label={`Togli ${value} dalla classifica`}
                    onClick={() => update(ranked.filter((v) => v !== value))}
                  >
                    <X size={18} />
                  </RankButton>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {remaining.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
            {ranked.length === 0
              ? "Scegli l'area che ti interessa di più"
              : `Scegli la n° ${ranked.length + 1}`}
          </p>
          <div className="grid gap-2">
            {remaining.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => update([...ranked, option.value])}
                className="text-left p-4 rounded-2xl bg-surface-container text-on-surface hover:bg-secondary/10 transition-colors cursor-pointer"
              >
                <span className="font-bold text-sm block">
                  {option.label ?? option.value}
                </span>
                {option.hint && (
                  <span className="block text-sm mt-1 text-on-surface-variant">
                    {option.hint}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RankButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
    >
      {children}
    </button>
  );
}

function WordInput({ question, answers, setAnswer }: CardProps<WordQuestion>) {
  return (
    <input
      type="text"
      aria-label={question.text}
      placeholder={question.placeholder}
      maxLength={WORD_MAX_LENGTH}
      autoComplete="off"
      value={(answers[question.id] as string) ?? ""}
      // Una sola parola: gli spazi non vengono accettati.
      onChange={(e) => setAnswer(question.id, e.target.value.replace(/\s/g, ""))}
      className="w-full sm:max-w-sm bg-surface-container px-4 py-3 rounded-2xl text-lg font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary"
    />
  );
}
