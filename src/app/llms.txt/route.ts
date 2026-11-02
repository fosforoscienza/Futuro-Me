import { buildLlmsTxt, llmsResponse } from "@/lib/llms";

// Rigenerato al massimo ogni ora: le news settimanali entrano da sole.
export const revalidate = 3600;

export async function GET() {
  return llmsResponse(await buildLlmsTxt({ full: false }));
}
