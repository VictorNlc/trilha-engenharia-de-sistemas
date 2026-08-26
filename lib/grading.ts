import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Recalcula o resultado de uma tentativa a partir das respostas já gravadas.
 * - Se ainda existir alguma resposta discursiva "pending", a tentativa fica
 *   em pending_review (não dá pra saber se passa ou não até a revisão).
 * - Caso contrário, soma os pontos e aplica a regra dos >=80% (ou o
 *   pass_threshold do módulo) para decidir passou/reprovou.
 * - Se passou, desbloqueia o próximo módulo da trilha e marca o atual como
 *   concluído.
 *
 * Chamado tanto pela rota de submissão da prova quanto pela rota de revisão
 * do admin (depois de aprovar/rejeitar uma resposta discursiva).
 */
export async function recomputeAttempt(admin: SupabaseClient, attemptId: string) {
  const { data: attempt, error: attemptErr } = await admin
    .from("attempts")
    .select("id, user_id, module_id, status")
    .eq("id", attemptId)
    .single();
  if (attemptErr || !attempt) throw attemptErr ?? new Error("Tentativa não encontrada");

  const { data: mod, error: modErr } = await admin
    .from("modules")
    .select("id, track_id, order_index, pass_threshold")
    .eq("id", attempt.module_id)
    .single();
  if (modErr || !mod) throw modErr ?? new Error("Módulo não encontrado");

  const { data: answers, error: ansErr } = await admin
    .from("attempt_answers")
    .select("id, is_correct, points_awarded, review_status, question:questions(points)")
    .eq("attempt_id", attemptId);
  if (ansErr) throw ansErr;

  const stillPending = (answers ?? []).some((a: any) => a.review_status === "pending");

  if (stillPending) {
    await admin.from("attempts").update({ status: "pending_review" }).eq("id", attemptId);
    return { status: "pending_review" as const, score: null };
  }

  const totalPoints = (answers ?? []).reduce((sum: number, a: any) => sum + (a.question?.points ?? 0), 0);
  const awarded = (answers ?? []).reduce((sum: number, a: any) => sum + (a.points_awarded ?? 0), 0);
  const pct = totalPoints > 0 ? (awarded / totalPoints) * 100 : 0;
  const passed = pct >= (mod.pass_threshold ?? 80);
  const finalStatus = passed ? "passed" : "failed";

  await admin
    .from("attempts")
    .update({ status: finalStatus, score: pct, submitted_at: new Date().toISOString() })
    .eq("id", attemptId);

  await admin
    .from("progress")
    .upsert(
      { user_id: attempt.user_id, module_id: attempt.module_id, unlocked: true, completed: passed },
      { onConflict: "user_id,module_id" }
    );

  if (passed) {
    const { data: nextMod } = await admin
      .from("modules")
      .select("id")
      .eq("track_id", mod.track_id)
      .eq("order_index", mod.order_index + 1)
      .maybeSingle();

    if (nextMod) {
      await admin
        .from("progress")
        .upsert(
          { user_id: attempt.user_id, module_id: nextMod.id, unlocked: true, completed: false },
          { onConflict: "user_id,module_id" }
        );
    }
  }

  return { status: finalStatus as "passed" | "failed", score: pct };
}
