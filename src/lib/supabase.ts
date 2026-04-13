import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Browser/client-side Supabase client (uses anon key, respects RLS). */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-only Supabase client with elevated privileges.
 * Uses the service role key — never expose to the browser.
 * Call this inside API routes or server actions only.
 */
export function createServerSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

/**
 * Database tables (to be created in Supabase):
 *
 * news_articles:
 *   - id: uuid (PK)
 *   - slug: text (unique)
 *   - title: text
 *   - excerpt: text
 *   - content: text
 *   - category: text (ai, jobs, training, skills)
 *   - source: text
 *   - source_url: text
 *   - status: text (draft, published, archived)
 *   - locale: text (it, en)
 *   - published_at: timestamptz
 *   - created_at: timestamptz
 *
 * survey_results:
 *   - id: uuid (PK)
 *   - year: int
 *   - school: text
 *   - type: text (initial, mid, final)
 *   - data: jsonb
 *   - uploaded_at: timestamptz
 *
 * activity_uploads:
 *   - id: uuid (PK)
 *   - title: text
 *   - description: text
 *   - file_url: text
 *   - file_type: text
 *   - year: int
 *   - uploaded_at: timestamptz
 */
