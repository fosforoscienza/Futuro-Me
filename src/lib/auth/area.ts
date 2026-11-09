import type { SupabaseClient } from "@supabase/supabase-js";

/** Le due fasi: stesso questionario, a inizio e a fine progetto. */
export const FASI = ["inizio", "fine"] as const;
export type Fase = (typeof FASI)[number];

export function isFase(value: unknown): value is Fase {
  return FASI.includes(value as Fase);
}

/** "Fine progetto" si apre solo quando l'admin la attiva: da quel momento i token compilano la fase finale. */
export async function isFaseFineAttiva(db: SupabaseClient): Promise<boolean> {
  const { data } = await db
    .from("impostazioni")
    .select("valore")
    .eq("chiave", "fase_fine_attiva")
    .maybeSingle();
  return data?.valore === true;
}
