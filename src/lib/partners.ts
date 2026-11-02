// Partenariato del progetto, come da Scheda Progetto "Il Futuro Me"
// (Bando Direzione Giovani 2024, sezione 9). I nomi sono quelli ufficiali del bando.

export type PartnerGroup = "lead" | "thirdSector" | "schools" | "universities";

export interface Partner {
  name: string;
  group: PartnerGroup;
  /** Sito ufficiale, verificato a novembre 2026. */
  url: string;
  /** Logo in /public/partners; assente se il partner non ne pubblica uno. */
  logo?: { src: string; width: number; height: number };
}

/** Sito di Fondazione Cariverona, che sostiene il progetto. */
export const CARIVERONA_URL = "https://www.fondazionecariverona.org/";

export const partners: Partner[] = [
  {
    name: "Fondazione Caritas Senigallia ETS",
    url: "https://www.caritassenigallia.it/",
    group: "lead",
    logo: { src: "/partners/fondazione-caritas-senigallia.png", width: 564, height: 240 },
  },
  {
    name: "Associazione Culturale NEXT ETS",
    url: "https://www.fosforoscienza.it/",
    group: "thirdSector",
    logo: { src: "/partners/associazione-next.png", width: 542, height: 240 },
  },
  {
    name: "Associazione Nazionale Dipendenze Tecnologiche, GAP e Cyberbullismo – Di.Te. ETS",
    url: "https://www.dipendenze.com/",
    group: "thirdSector",
    logo: { src: "/partners/associazione-dite.png", width: 471, height: 240 },
  },
  {
    name: "IIS Corinaldesi Padovano",
    url: "https://www.corinaldesipadovano.it/",
    group: "schools",
    logo: { src: "/partners/iis-corinaldesi-padovano.png", width: 243, height: 240 },
  },
  {
    name: "Istituto Comprensivo Ostra",
    url: "https://www.iscostra.edu.it/",
    group: "schools",
  },
  {
    name: "IC Senigallia Centro – Fagnani",
    url: "https://icsenigalliacentro.edu.it/",
    group: "schools",
    logo: { src: "/partners/ic-senigallia-centro-fagnani.png", width: 190, height: 188 },
  },
  {
    name: "Liceo Scientifico Enrico Medi",
    url: "https://www.liceoenricomedi.edu.it/",
    group: "schools",
    logo: { src: "/partners/liceo-enrico-medi.png", width: 230, height: 232 },
  },
  {
    name: "Università Politecnica delle Marche",
    url: "https://www.univpm.it/",
    group: "universities",
    logo: { src: "/partners/univpm.png", width: 634, height: 240 },
  },
  {
    name: "Università di Camerino",
    url: "https://www.unicam.it/",
    group: "universities",
    logo: { src: "/partners/unicam.png", width: 200, height: 240 },
  },
];

export const partnerGroups: PartnerGroup[] = ["lead", "thirdSector", "schools", "universities"];
