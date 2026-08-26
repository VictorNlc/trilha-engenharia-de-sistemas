import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Salva (upsert) a resposta de UMA questão dentro de uma tentativa em andamento.
// Não faz correção aqui — isso só acontece na submissão final (rota /submit),
// para que o gabarito nunca precise trafegar antes da hora.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const attemptId = params.id;
  const { data: attempt } = await supabase
    .from("attempts")
    .select("id, user_id, status")
    .eq("id", attemptId)
    .single();

  if (!attempt || attempt.user_id !== user.id) {
    return NextResponse.json({ error: "Tentativa não encontrada" }, { status: 404 });
  }
  if (attempt.status !== "in_progress") {
    return NextResponse.json({ error: "Esta tentativa já foi enviada" }, { status: 409 });
  }

  const { questionId, selectedOptionId, booleanAnswer, answerText } = await request.json();
  if (!questionId) return NextResponse.json({ error: "questionId obrigatório" }, { status: 400 });

  const { error } = await supabase.from("attempt_answers").upsert(
    {
      attempt_id: attemptId,
      question_id: questionId,
      selected_option_id: selectedOptionId ?? null,
      boolean_answer: typeof booleanAnswer === "boolean" ? booleanAnswer : null,
      answer_text: answerText ?? null,
    },
    { onConflict: "attempt_id,question_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
