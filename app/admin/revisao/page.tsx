import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ReviewCard from "@/components/ReviewCard";

export default async function AdminReviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <p className="text-inkSoft">Esta área é restrita a administradores.</p>
      </div>
    );
  }

  const admin = createAdminClient();

  const { data: pending } = await admin
    .from("attempt_answers")
    .select(
      "id, answer_text, attempt_id, attempt:attempts(user_id, module_id, module:modules(title)), question:questions(id, prompt, points)"
    )
    .eq("review_status", "pending")
    .order("id");

  const userIds = Array.from(new Set((pending ?? []).map((p: any) => p.attempt?.user_id).filter(Boolean)));
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] as any[] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const questionIds = (pending ?? []).map((p: any) => p.question?.id).filter(Boolean);
  // gabarito de referência do revisor — só lido aqui, nunca exposto ao aluno
  const { data: keys } = questionIds.length
    ? await admin.from("question_answers").select("question_id, model_answer").in("question_id", questionIds)
    : { data: [] as any[] };
  const modelAnswerByQuestion = new Map((keys ?? []).map((k) => [k.question_id, k.model_answer]));

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--warm)" }}>
        Fila de revisão
      </p>
      <h1 className="font-display text-3xl font-semibold mt-2">Respostas escritas pendentes</h1>
      <p className="text-inkSoft mt-2">{(pending ?? []).length} resposta(s) aguardando correção.</p>

      <div className="mt-8 space-y-4">
        {(pending ?? []).map((p: any) => (
          <ReviewCard
            key={p.id}
            answerId={p.id}
            studentName={nameById.get(p.attempt?.user_id) ?? "aluno"}
            moduleTitle={p.attempt?.module?.title ?? ""}
            prompt={p.question?.prompt ?? ""}
            answerText={p.answer_text ?? ""}
            maxPoints={p.question?.points ?? 0}
            modelAnswer={modelAnswerByQuestion.get(p.question?.id) ?? null}
          />
        ))}
        {(pending ?? []).length === 0 && <p className="text-inkFaint text-sm">Fila vazia — tudo revisado. 🎉</p>}
      </div>
    </div>
  );
}
