import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase com a service_role key — IGNORA todas as políticas de RLS.
// Use SOMENTE dentro de rotas de servidor (app/api/**), nunca em código
// que roda no navegador. É assim que a rota de correção lê o gabarito
// (question_answers) sem nunca expô-lo ao cliente.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
