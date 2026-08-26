import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Garante que o usuário tenha uma linha de progresso para o primeiro módulo
 * da trilha (desbloqueado). Chamado toda vez que o usuário abre a página da
 * trilha — idempotente, não faz nada se já existir progresso.
 */
export async function ensureEnrollment(supabase: SupabaseClient, userId: string, trackId: string) {
  const { data: firstModule } = await supabase
    .from("modules")
    .select("id")
    .eq("track_id", trackId)
    .eq("order_index", 1)
    .maybeSingle();

  if (!firstModule) return;

  const { data: existing } = await supabase
    .from("progress")
    .select("id")
    .eq("user_id", userId)
    .eq("module_id", firstModule.id)
    .maybeSingle();

  if (!existing) {
    await supabase
      .from("progress")
      .upsert(
        { user_id: userId, module_id: firstModule.id, unlocked: true, completed: false },
        { onConflict: "user_id,module_id" }
      );
  }
}
