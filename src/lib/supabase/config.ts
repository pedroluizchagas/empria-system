/**
 * O app roda em "modo prévia" (sem autenticação nem dados) enquanto o
 * Supabase não estiver configurado — veja .env.example e README.md.
 */
export function isSupabaseConfigurado(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
