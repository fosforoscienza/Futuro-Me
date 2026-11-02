// Partenariato del progetto, come da Scheda Progetto "Il Futuro Me"
// (Bando Direzione Giovani 2024, sezione 9). I nomi sono quelli ufficiali del bando.

export type PartnerGroup = "lead" | "thirdSector" | "schools" | "universities";

export interface Partner {
  name: string;
  group: PartnerGroup;
  /** Logo in /public/partners; assente se il partner non ne pubblica uno. */
  logo?: { src: string; width: number; height: number };
}

export const partners: Partner[] = [
  {
    name: "Fondazione Caritas Senigallia ETS",
    group: "lead",
    logo: { src: "/partners/fondazione-caritas-senigallia.png", width: 564, height: 240 },
  },
  {
    name: "Associazione Culturale NEXT ETS",
    group: "thirdSector",
    logo: { src: "/partners/associazione-next.png", width: 542, height: 240 },
  },
  {
    name: "Associazione Nazionale Dipendenze Tecnologiche, GAP e Cyberbullismo – Di.Te. ETS",
    group: "thirdSector",
    logo: { src: "/partners/associazione-dite.png", width: 471, height: 240 },
  },
  {
    name: "IIS Corinaldesi Padovano",
    group: "schools",
    logo: { src: "/partners/iis-corinaldesi-padovano.png", width: 243, height: 240 },
  },
  {
    name: "Istituto Comprensivo Ostra",
    group: "schools",
  },
  {
    name: "IC Senigallia Centro – Fagnani",
    group: "schools",
    logo: { src: "/partners/ic-senigallia-centro-fagnani.png", width: 190, height: 188 },
  },
  {
    name: "Liceo Scientifico Enrico Medi",
    group: "schools",
    logo: { src: "/partners/liceo-enrico-medi.png", width: 230, height: 232 },
  },
  {
    name: "Università Politecnica delle Marche",
    group: "universities",
    logo: { src: "/partners/univpm.png", width: 634, height: 240 },
  },
  {
    name: "Università di Camerino",
    group: "universities",
    logo: { src: "/partners/unicam.png", width: 200, height: 240 },
  },
];

export const partnerGroups: PartnerGroup[] = ["lead", "thirdSector", "schools", "universities"];
