import type { SupabaseClient } from "@supabase/supabase-js";
import type { AvatarSelection } from "@/lib/avatar/config";

/** Le due fasi dell'area personale: stesso questionario, a inizio e a fine progetto. */
export const FASI = ["inizio", "fine"] as const;
export type Fase = (typeof FASI)[number];

export function isFase(value: unknown): value is Fase {
  return FASI.includes(value as Fase);
}

export type Compilazione = { created_at: string; avatar: AvatarSelection };

/** "Fine progetto" si apre solo quando l'admin la attiva dalla console. */
export async function isFaseFineAttiva(db: SupabaseClient): Promise<boolean> {
  const { data } = await db
    .from("impostazioni")
    .select("valore")
    .eq("chiave", "fase_fine_attiva")
    .maybeSingle();
  return data?.valore === true;
}

export async function isFaseAperta(db: SupabaseClient, fase: Fase): Promise<boolean> {
  return fase === "inizio" || isFaseFineAttiva(db);
}

export async function getCompilazioni(
  db: SupabaseClient,
  accountId: string
): Promise<Partial<Record<Fase, Compilazione>>> {
  const { data } = await db
    .from("questionario_risposte")
    .select("fase, created_at, avatar")
    .eq("account_id", accountId);
  const result: Partial<Record<Fase, Compilazione>> = {};
  for (const row of data ?? []) {
    if (isFase(row.fase)) result[row.fase] = { created_at: row.created_at, avatar: row.avatar };
  }
  return result;
}
