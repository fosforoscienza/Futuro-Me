/**
 * Il cast di avatar usato nelle pagine del sito: ogni personaggio è una
 * selezione del configuratore, quindi resta coerente con quello che gli
 * studenti possono costruire nella pagina avatar.
 *
 * Ausili e impianto acustico sono sospesi dal 9/11/2026: la pilota di droni
 * aveva le stampelle e la studentessa l'impianto. Per riattivarli, rimetti
 * `ausilio: "stampelle"` e `impianto: "si"` e riesporta le due immagini.
 */
import { DEFAULT_SELECTION, fitToBody, type AvatarSelection } from "./config";

export type CastId =
  | "aiDev"
  | "dataAnalyst"
  | "solarTech"
  | "doctor"
  | "cyber"
  | "creator"
  | "teacher"
  | "student"
  | "biotech"
  | "firefighter"
  | "dronePilot";

export type CastMember = {
  id: CastId;
  /** Lavoro di oggi o emergente, oppure mestiere classico. */
  kind: "attuale" | "classico";
  /** Ha un loop animato (public/avatar/cast/<id>.anim.webp). */
  animated: boolean;
  selection: AvatarSelection;
};

const make = (sel: Partial<AvatarSelection>): AvatarSelection =>
  fitToBody({ ...DEFAULT_SELECTION, ambiente: "nessuno", ...sel });

export const CAST: Record<CastId, CastMember> = {
  aiDev: {
    id: "aiDev",
    kind: "attuale",
    animated: false,
    selection: make({
      corpo: "F",
      pelle: "nero",
      capelli: "afro",
      coloreCapelli: "neri",
      occhiali: "squadrati",
      torso: "felpa",
      gambe: "jeans",
      scarpe: "jordan",
    }),
  },
  dataAnalyst: {
    id: "dataAnalyst",
    kind: "attuale",
    animated: false,
    selection: make({
      corpo: "M",
      pelle: "oliva",
      capelli: "undercut",
      coloreCapelli: "castano_scuri",
      occhiali: "leggeri",
      torso: "camicia",
      gambe: "eleganti",
      scarpe: "sneakers",
      braccia: ["orologio"],
    }),
  },
  solarTech: {
    id: "solarTech",
    kind: "attuale",
    animated: false,
    selection: make({
      corpo: "F",
      pelle: "bianco_pallido",
      capelli: "coda",
      coloreCapelli: "biondo",
      cappello: "casco",
      torso: "catarifrangente",
      gambe: "militari",
      scarpe: "antinfortunistiche",
    }),
  },
  doctor: {
    id: "doctor",
    kind: "classico",
    animated: false,
    selection: make({
      corpo: "M",
      pelle: "marrone",
      capelli: "buzz",
      coloreCapelli: "neri",
      torso: "camice",
      gambe: "eleganti",
      scarpe: "eleganti",
      oggetti: ["stetoscopio"],
    }),
  },
  cyber: {
    id: "cyber",
    kind: "attuale",
    animated: true,
    selection: make({
      corpo: "F",
      pelle: "rosa",
      capelli: "bob",
      coloreCapelli: "viola",
      occhiali: "geek",
      altro: ["cuffie"],
      torso: "pelle",
      gambe: "jeans",
      scarpe: "anfibi",
      oggetti: ["laptop"],
    }),
  },
  creator: {
    id: "creator",
    kind: "attuale",
    animated: true,
    selection: make({
      corpo: "F",
      pelle: "oliva",
      cappello: "hijab",
      torso: "tshirt_colorata",
      gambe: "palazzo",
      scarpe: "jordan",
      oggetti: ["smartphone"],
    }),
  },
  teacher: {
    id: "teacher",
    kind: "classico",
    animated: false,
    selection: make({
      corpo: "M",
      pelle: "rosa",
      capelli: "ricci_medi",
      coloreCapelli: "grigi",
      occhiali: "tondi",
      torso: "girocollo",
      gambe: "eleganti",
      scarpe: "eleganti",
      oggetti: ["mappamondo"],
    }),
  },
  student: {
    id: "student",
    kind: "classico",
    animated: false,
    selection: make({
      corpo: "F",
      pelle: "bianco_pallido",
      capelli: "caschetto",
      coloreCapelli: "ramato",
      torso: "felpa",
      gambe: "jeans",
      scarpe: "sneakers",
      oggetti: ["zaino"],
    }),
  },
  biotech: {
    id: "biotech",
    kind: "attuale",
    animated: false,
    selection: make({
      corpo: "M",
      pelle: "bianco_pallido",
      capelli: "ciuffo",
      coloreCapelli: "rosso",
      occhiali: "tondi",
      torso: "camice",
      gambe: "jeans",
      scarpe: "sneakers",
      oggetti: ["microscopio"],
    }),
  },
  firefighter: {
    id: "firefighter",
    kind: "classico",
    animated: false,
    selection: make({
      corpo: "F",
      pelle: "marrone",
      capelli: "chignon",
      coloreCapelli: "neri",
      torso: "vigile",
      gambe: "vigile",
      scarpe: "antinfortunistiche",
      oggetti: ["estintore"],
    }),
  },
  dronePilot: {
    id: "dronePilot",
    kind: "attuale",
    animated: false,
    selection: make({
      corpo: "M",
      pelle: "nero",
      capelli: "treccine",
      coloreCapelli: "neri",
      occhiali: "veloce",
      torso: "militare",
      gambe: "jeans",
      scarpe: "anfibi",
      oggetti: ["drone"],
    }),
  },
};
