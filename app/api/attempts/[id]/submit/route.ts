import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recomputeAttempt } from "@/lib/grading";

// Finaliza uma tentativa: corrige as questões objetivas (multiple_choice /
// true_false) contra o gabarito, marca as discursivas como "pending" para
// revisão manual, e recalcula o resultado final (>=80% para passar).
// Roda com a service_role key porque é o único lugar que pode ler
// question_answers (o gabarito nunca é exposto ao navegador).
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const attemptId = params.id;
  const { data: attempt } = await supabase
    .from("attempts")
    .select("id, user_id, module_id, status")
    .eq("id", attemptId)
    .single();

  if (!attempt || attempt.user_id !== user.id) {
    return NextResponse.json({ error: "Tentativa não encontrada" }, { status: 404 });
  }
  if (attempt.status !== "in_progress") {
    return NextResponse.json({ error: "Esta tentativa já foi enviada" }, { status: 409 });
  }

  const admin = createAdminClient();

  const { data: questions } = await admin
    .from("questions")
    .select("id, type, points")
    .eq("module_id", attempt.module_id);

  const { data: answers } = await admin
    .from("attempt_answers")
    .select("id, question_id, selected_option_id, boolean_answer, answer_text")
    .eq("attempt_id", attemptId);

  const answeredIds = new Set((answers ?? []).map((a) => a.question_id));
  const missing = (questions ?? []).filter((q) => !answeredIds.has(q.id));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Faltam ${missing.length} questão(ões) sem resposta — não é possível pular questões.` },
      { status: 400 }
    );
  }

  const { data: answerKeys } = await admin
    .from("question_answers")
    .select("question_id, correct_option_id, correct_boolean")
    .in("question_id", (questions ?? []).map((q) => q.id));

  const keyByQuestion = new Map((answerKeys ?? []).map((k) => [k.question_id, k]));
  const questionById = new Map((questions ?? []).map((q) => [q.id, q]));

  for (const answer of answers ?? []) {
    const question = questionById.get(answer.question_id);
    if (!question) continue;
    const key = keyByQuestion.get(answer.question_id);

    if (question.type === "multiple_choice") {
      const correct = answer.selected_option_id === key?.correct_option_id;
      await admin
        .from("attempt_answers")
        .update({ is_correct: correct, points_awarded: correct ? question.points : 0, review_status: "auto" })
        .eq("id", answer.id);
    } else if (question.type === "true_false") {
      const correct = answer.boolean_answer === key?.correct_boolean;
      await admin
        .from("attempt_answers")
        .update({ is_correct: correct, points_awarded: correct ? question.points : 0, review_status: "auto" })
        .eq("id", answer.id);
    } else {
      // discursive: aguarda revisão humana (até 24h)
      await admin
        .from("attempt_answers")
        .update({ review_status: "pending", is_correct: null, points_awarded: null })
        .eq("id", answer.id);
    }
  }

  const result = await recomputeAttempt(admin, attemptId);
  return NextResponse.json(result);
}
