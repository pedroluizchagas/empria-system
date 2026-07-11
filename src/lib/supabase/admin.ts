import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente com service role — ignora RLS. USO EXCLUSIVO em Server Actions
 * já autorizadas (ex.: convidar pessoa). Nunca importar em client components.
 */
export function isServiceRoleConfigurado(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
