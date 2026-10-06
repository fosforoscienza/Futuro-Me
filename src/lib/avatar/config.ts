/**
 * Configurazione dell'avatar "Il Futuro Me": livelli, gruppi di scelta e
 * opzioni, come nella prima parte del documento di progetto (prima metà
 * delle opzioni). Le immagini sono in public/avatar, descritte da assets.json.
 */

export type Body = "F" | "M";
export type RGB = [number, number, number];

export type Choice = {
  id: string;
  label: string;
  /** Pezzo grafico (chiave in assets.json); assente = nessun pezzo. */
  layer?: string;
  /** Colore del campione (per incarnato, capelli, occhi). */
  color?: RGB;
};

export type Group = {
  id: keyof AvatarSelection;
  label: string;
  hint?: string;
  kind: "single" | "multi" | "swatch";
  max?: number;
  choices: Choice[];
};

export type Level = {
  id: string;
  number: number;
  title: string;
  intro: string;
  groups: Group[];
};

export type AvatarSelection = {
  corpo: Body | "";
  pelle: string;
  capelli: string;
  coloreCapelli: string;
  occhi: string;
  coloreOcchi: string;
  trucco: string;
  ciglia: string;
  sopracciglia: string;
  naso: string;
  bocca: string;
  cappello: string;
  occhiali: string;
  gioielli: string[];
  altro: string;
  torso: string;
  braccia: string[];
  gambe: string;
  scarpe: string;
  oggetti: string[];
  ambiente: string;
  ausilio: string;
  impianto: string;
};

export const DEFAULT_SELECTION: AvatarSelection = {
  corpo: "",
  pelle: "oliva",
  capelli: "nessuno",
  coloreCapelli: "castano_scuri",
  occhi: "mandorla",
  coloreOcchi: "castani",
  trucco: "nessuno",
  ciglia: "medie",
  sopracciglia: "medie",
  naso: "dritto",
  bocca: "sottili",
  cappello: "nessuno",
  occhiali: "nessuno",
  gioielli: [],
  altro: "nessuno",
  torso: "base",
  braccia: [],
  gambe: "base",
  scarpe: "scalzo",
  oggetti: [],
  ambiente: "nessuno",
  ausilio: "nessuno",
  impianto: "no",
};

const none = (label = "Nessuno"): Choice => ({ id: "nessuno", label });
const items = (cat: string, list: [string, string][]): Choice[] =>
  list.map(([id, label]) => ({ id, label, layer: `${cat}/${id}` }));

export const SKIN: Choice[] = [
  { id: "bianco_pallido", label: "Bianco pallido", color: [232, 196, 178] },
  { id: "rosa", label: "Rosa", color: [222, 168, 148] },
  { id: "oliva", label: "Oliva", color: [193, 146, 113] },
  { id: "marrone", label: "Marrone", color: [138, 92, 66] },
  { id: "nero", label: "Nero", color: [80, 52, 38] },
];

export const HAIR_COLORS: Choice[] = [
  { id: "neri", label: "Neri", color: [34, 28, 26] },
  { id: "castano_scuri", label: "Castano scuri", color: [74, 50, 36] },
  { id: "castano_chiaro", label: "Castano chiaro", color: [132, 92, 62] },
  { id: "biondo", label: "Biondo", color: [205, 160, 95] },
  { id: "biondo_platino", label: "Biondo platino", color: [232, 222, 196] },
  { id: "rosso", label: "Rosso", color: [176, 56, 32] },
  { id: "ramato", label: "Ramato", color: [166, 88, 46] },
  { id: "blu", label: "Blu", color: [42, 72, 180] },
  { id: "viola", label: "Viola", color: [108, 56, 162] },
  { id: "verde", label: "Verde", color: [42, 136, 82] },
  { id: "rosa", label: "Rosa", color: [232, 122, 162] },
  { id: "grigi", label: "Grigi", color: [166, 164, 160] },
];

export const EYE_COLORS: Choice[] = [
  { id: "castani", label: "Castani", color: [92, 58, 36] },
  { id: "neri", label: "Neri", color: [36, 27, 23] },
  { id: "azzurri", label: "Azzurri", color: [96, 160, 214] },
  { id: "blu", label: "Blu", color: [42, 82, 172] },
  { id: "verdi", label: "Verdi", color: [72, 136, 86] },
  { id: "ambra", label: "Ambra", color: [186, 126, 46] },
  { id: "grigi", label: "Grigi", color: [136, 146, 156] },
];

/** Oggetti: posizione nella scena (in mano o a terra) e altezza in pixel. */
export const OBJECT_PLACEMENT: Record<string, { slot: "hand" | "floor"; size: number }> = {
  calcio: { slot: "floor", size: 120 },
  basket: { slot: "floor", size: 125 },
  chitarra: { slot: "floor", size: 420 },
  zaino: { slot: "floor", size: 280 },
  trolley: { slot: "floor", size: 360 },
  "24ore": { slot: "hand", size: 170 },
  borsa: { slot: "hand", size: 170 },
  stetoscopio: { slot: "hand", size: 170 },
  tennis: { slot: "floor", size: 300 },
  tavolozza: { slot: "hand", size: 190 },
  boxe: { slot: "hand", size: 190 },
  estintore: { slot: "floor", size: 270 },
  macchina_foto: { slot: "hand", size: 150 },
  mappamondo: { slot: "floor", size: 230 },
  pacco: { slot: "floor", size: 190 },
  cloche: { slot: "hand", size: 170 },
  cane: { slot: "floor", size: 300 },
  gatto: { slot: "floor", size: 210 },
  microfono: { slot: "floor", size: 520 },
  skateboard: { slot: "floor", size: 380 },
};

export const LEVELS: Level[] = [
  {
    id: "lv0",
    number: 0,
    title: "Chi sei?",
    intro:
      "Prima di iniziare, crea la base del tuo avatar: sarà il “te” del futuro, tra 15 anni. Potrai usare tutti i vestiti e gli accessori qualunque corpo sceglierai.",
    groups: [
      {
        id: "corpo",
        label: "Genere",
        kind: "single",
        choices: [
          { id: "M", label: "Uomo" },
          { id: "F", label: "Donna" },
        ],
      },
    ],
  },
  {
    id: "lv1",
    number: 1,
    title: "Il viso",
    intro: "Hai sbloccato il viso! Scegli come sarà il tuo volto tra 15 anni.",
    groups: [
      { id: "pelle", label: "Colore incarnato", kind: "swatch", choices: SKIN },
      {
        id: "capelli",
        label: "Capelli",
        kind: "single",
        choices: [
          none("No capelli"),
          ...items("hair", [
            ["buzz", "Buzz cut"],
            ["undercut", "Rasati ai lati, lunghi sopra"],
            ["ciuffo", "Medi (ciuffo)"],
            ["bob", "Bob cut"],
            ["frangetta", "Corti con frangetta"],
            ["lisci_lunghi", "Lisci lunghi sciolti"],
            ["coda", "Lisci lunghi raccolti (coda)"],
            ["mossi", "Mossi lunghi sciolti"],
            ["ricci_medi", "Ricci medi"],
            ["ricci_lunghi", "Ricci lunghi"],
            ["treccine", "Treccine afro"],
            ["chignon", "Chignon"],
          ]),
        ],
      },
      { id: "coloreCapelli", label: "Colore dei capelli", kind: "swatch", choices: HAIR_COLORS },
      {
        id: "occhi",
        label: "Forma degli occhi",
        kind: "single",
        choices: [
          { id: "mandorla", label: "A mandorla" },
          ...items("eyes", [
            ["tondi_grandi", "Tondi grandi"],
            ["allungati_piccoli", "Allungati piccoli"],
          ]),
        ],
      },
      { id: "coloreOcchi", label: "Colore degli occhi", kind: "swatch", choices: EYE_COLORS },
      {
        id: "trucco",
        label: "Trucco",
        hint: "Rossetto, ombretto, eyeliner, blush",
        kind: "single",
        choices: [none(), ...items("makeup", [["leggero", "Leggero"], ["intenso", "Intenso"]])],
      },
      {
        id: "ciglia",
        label: "Ciglia",
        kind: "single",
        choices: [{ id: "medie", label: "Medie" }, ...items("lashes", [["lunghe", "Lunghe"]])],
      },
      {
        id: "sopracciglia",
        label: "Sopracciglia",
        kind: "single",
        choices: [
          { id: "medie", label: "Medie" },
          ...items("brows", [["sottili", "Sottili"], ["folte", "Folte"]]),
        ],
      },
      {
        id: "naso",
        label: "Naso",
        kind: "single",
        choices: [
          { id: "dritto", label: "Dritto" },
          ...items("nose", [["patata", "A patata"], ["aquilino", "Aquilino"]]),
        ],
      },
      {
        id: "bocca",
        label: "Bocca",
        kind: "single",
        choices: [{ id: "sottili", label: "Labbra sottili" }, ...items("mouth", [["carnose", "Labbra carnose"]])],
      },
      {
        id: "cappello",
        label: "Cappelli",
        kind: "single",
        choices: [
          none(),
          ...items("hat", [
            ["visiera", "Cappello con visiera"],
            ["lana", "Cappello di lana"],
            ["casco", "Casco antinfortunistico"],
            ["cuoco", "Cappello da cuoco"],
            ["hijab", "Hijab"],
          ]),
        ],
      },
      {
        id: "occhiali",
        label: "Occhiali",
        kind: "single",
        choices: [
          none(),
          ...items("glasses", [
            ["wayfarer", "Da sole Wayfarer"],
            ["aviatore", "Da sole da aviatore"],
            ["geek", "Da vista “geek”"],
            ["tondi", "Tondi sottili metallici"],
          ]),
        ],
      },
      {
        id: "gioielli",
        label: "Gioielli",
        hint: "Puoi sceglierne più di uno",
        kind: "multi",
        choices: [
          ...items("jewel", [
            ["cerchio", "Orecchini a cerchio piccoli"],
            ["pendenti", "Orecchini pendenti"],
            ["naso_anello", "Piercing al naso (anello)"],
            ["sopracciglio", "Piercing al sopracciglio"],
          ]),
          ...items("neck", [
            ["catenina", "Catenina elegante"],
            ["catena_trap", "Catena grossa (stile trap)"],
          ]),
        ],
      },
      {
        id: "altro",
        label: "Altro",
        kind: "single",
        choices: [
          none(),
          ...items("other", [
            ["cuffie", "Cuffie per la musica"],
            ["bandana", "Bandana sulla fronte"],
            ["corona", "Corona di fiori"],
          ]),
        ],
      },
    ],
  },
  {
    id: "lv2",
    number: 2,
    title: "Il busto",
    intro: "Livello 2 sbloccato! Come ti vestirai?",
    groups: [
      {
        id: "torso",
        label: "Vestiti",
        kind: "single",
        choices: [
          { id: "base", label: "T-shirt grigia" },
          ...items("torso", [
            ["tshirt_bianca", "T-shirt bianca"],
            ["tshirt_nera", "T-shirt nera"],
            ["tshirt_rock", "T-shirt gruppo rock"],
            ["righe", "Maglia a righe"],
            ["canotta_basket", "Canotta da basket"],
            ["top", "Top"],
            ["camicia", "Camicia elegante"],
            ["hawaiana", "Camicia hawaiana"],
            ["collo_alto", "Maglione collo alto"],
            ["felpa", "Felpa con cappuccio"],
            ["pelle", "Giacca di pelle"],
            ["blazer", "Camicia + giacca elegante"],
            ["camice", "Camice da dottore"],
            ["vigile", "Giacca da vigile del fuoco"],
            ["cuoco", "Giacca da cuoco"],
            ["catarifrangente", "T-shirt + giubbotto catarifrangente"],
          ]),
        ],
      },
      {
        id: "braccia",
        label: "Braccia",
        hint: "Puoi sceglierne più di uno",
        kind: "multi",
        choices: items("arms", [
          ["tatuaggi", "Tatuaggi"],
          ["orologio", "Orologio"],
          ["bracciale", "Bracciale"],
        ]),
      },
    ],
  },
  {
    id: "lv3",
    number: 3,
    title: "Le gambe",
    intro: "Livello 3 sbloccato! Pantaloni, gonne e scarpe.",
    groups: [
      {
        id: "gambe",
        label: "Vestiti",
        kind: "single",
        choices: [
          { id: "base", label: "Pantaloncini grigi" },
          ...items("legs", [
            ["jeans", "Jeans"],
            ["completo", "Pantaloni eleganti"],
            ["corti", "Pantaloni corti"],
            ["tuta", "Pantaloni della tuta"],
            ["gonna_lunga", "Gonna elegante lunga"],
            ["gonna_corta", "Gonna colorata corta"],
            ["vigile", "Pantaloni da vigile del fuoco"],
            ["cuoco", "Pantaloni da cuoco"],
          ]),
        ],
      },
      {
        id: "scarpe",
        label: "Scarpe",
        kind: "single",
        choices: [
          { id: "scalzo", label: "Scalzo/a" },
          ...items("shoes", [
            ["sneakers", "Sneakers bianche"],
            ["jordan", "Sneakers colorate"],
            ["anfibi", "Anfibi"],
            ["eleganti", "Scarpe eleganti"],
            ["tacchi", "Scarpe col tacco"],
            ["infradito", "Infradito"],
            ["antinfortunistiche", "Scarpe antinfortunistiche"],
          ]),
        ],
      },
    ],
  },
  {
    id: "lv4",
    number: 4,
    title: "Oggetti e hobby",
    intro: "Livello 4 sbloccato! Cosa porti con te? Scegli fino a 2 oggetti.",
    groups: [
      {
        id: "oggetti",
        label: "Oggetti",
        hint: "Al massimo 2",
        kind: "multi",
        max: 2,
        choices: (
          [
            ["calcio", "Pallone da calcio"],
            ["basket", "Pallone da basket"],
            ["chitarra", "Chitarra"],
            ["zaino", "Zaino da trekking"],
            ["trolley", "Valigia / trolley"],
            ["24ore", "Valigetta 24 ore"],
            ["borsa", "Borsa piccola"],
            ["stetoscopio", "Stetoscopio"],
            ["tennis", "Racchetta da tennis"],
            ["tavolozza", "Tavolozza e pennello"],
            ["boxe", "Guantoni da boxe"],
            ["estintore", "Estintore"],
            ["macchina_foto", "Macchina fotografica"],
            ["mappamondo", "Mappamondo"],
            ["pacco", "Pacco postale"],
            ["cloche", "Cloche del ristorante"],
            ["cane", "Cane"],
            ["gatto", "Gatto"],
            ["microfono", "Microfono"],
            ["skateboard", "Skateboard"],
          ] as [string, string][]
        ).map(([id, label]) => ({ id, label })),
      },
    ],
  },
  {
    id: "lv5",
    number: 5,
    title: "L'ambiente",
    intro: "Livello 5 sbloccato! Dove ti vedi tra 15 anni?",
    groups: [
      {
        id: "ambiente",
        label: "Ambiente",
        kind: "single",
        choices: [
          { id: "nessuno", label: "Sfondo semplice" },
          ...(
            [
              ["metropoli", "Metropoli"],
              ["campagna", "Campagna"],
              ["montagna", "Montagna"],
              ["classe", "Classe di una scuola"],
              ["palco", "Palco di un concerto"],
              ["laboratorio", "Laboratorio"],
              ["ospedale", "Corsia d'ospedale"],
              ["ufficio", "Ufficio"],
              ["cucina", "Cucina di ristorante"],
              ["officina", "Officina"],
            ] as [string, string][]
          ).map(([id, label]) => ({ id, label })),
        ],
      },
    ],
  },
  {
    id: "lv6",
    number: 6,
    title: "Inclusione",
    intro:
      "Ultimo livello. Se vuoi, puoi aggiungere al tuo avatar un ausilio: il futuro è di tutte e tutti.",
    groups: [
      {
        id: "ausilio",
        label: "Ausili per muoversi",
        hint: "La carrozzina arriverà nella prossima versione.",
        kind: "single",
        choices: [
          none(),
          ...items("incl", [
            ["stampelle", "Stampelle"],
            ["bastone", "Bastone bianco"],
          ]),
        ],
      },
      {
        id: "impianto",
        label: "Impianto acustico",
        kind: "single",
        choices: [
          { id: "no", label: "No" },
          { id: "si", label: "Sì", layer: "incl/impianto" },
        ],
      },
    ],
  },
];

const ALL_GROUPS = LEVELS.flatMap((l) => l.groups);

export function findChoice(groupId: keyof AvatarSelection, id: string) {
  return ALL_GROUPS.find((g) => g.id === groupId)?.choices.find((c) => c.id === id);
}

/** Controlla una selezione arrivata dal client: solo id esistenti, limiti rispettati. */
export function validateAvatar(input: unknown): AvatarSelection | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const group of ALL_GROUPS) {
    const value = raw[group.id];
    const ids = group.choices.map((c) => c.id);
    if (group.kind === "multi") {
      if (!Array.isArray(value)) return null;
      const list = [...new Set(value)];
      if (!list.every((v) => typeof v === "string" && ids.includes(v))) return null;
      if (group.max && list.length > group.max) return null;
      out[group.id] = list;
    } else {
      if (typeof value !== "string" || !ids.includes(value)) return null;
      out[group.id] = value;
    }
  }
  return out as AvatarSelection;
}
