import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recomputeAttempt } from "@/lib/grading";

// Admin aprova ou rejeita uma resposta discursiva pendente.
// Depois de decidir, recalcula a tentativa inteira — se essa era a última
// pendência, a prova finalmente vira "passed"/"failed" e (se passou) o
// próximo módulo é desbloqueado automaticamente.
export async function POST(request: Request, { params }: { params: { answerId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem revisar respostas" }, { status: 403 });
  }

  const { decision, feedback, pointsAwarded } = await request.json();
  if (decision !== "approved" && decision !== "rejected") {
    return NextResponse.json({ error: "decision deve ser 'approved' ou 'rejected'" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: answer } = await admin
    .from("attempt_answers")
    .select("id, attempt_id, question_id, question:questions(points)")
    .eq("id", params.answerId)
    .single();

  if (!answer) return NextResponse.json({ error: "Resposta não encontrada" }, { status: 404 });

  const maxPoints = (answer as any).question?.points ?? 0;
  const awarded = decision === "approved" ? (pointsAwarded ?? maxPoints) : 0;

  await admin
    .from("attempt_answers")
    .update({
      review_status: decision,
      is_correct: decision === "approved",
      points_awarded: awarded,
      reviewer_id: user.id,
      reviewer_feedback: feedback ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", params.answerId);

  const result = await recomputeAttempt(admin, answer.attempt_id);
  return NextResponse.json(result);
}
