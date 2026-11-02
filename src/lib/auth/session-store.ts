import type { SupabaseClient } from "@supabase/supabase-js";

/** Do not confirm logout locally unless the shared session was revoked. */
export async function revokeSession(db: SupabaseClient, tokenHash: string): Promise<void> {
  const { error } = await db.from("sessioni").delete().eq("token_hash", tokenHash);
  if (error) throw new Error("Revoca sessione non riuscita");
}
