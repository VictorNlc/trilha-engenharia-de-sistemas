import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  passed: { label: "Aprovado", color: "var(--good)", bg: "var(--good-tint)" },
  failed: { label: "Não atingiu a nota mínima", color: "var(--bad)", bg: "var(--bad-tint)" },
  pending_review: { label: "Aguardando revisão", color: "var(--warm)", bg: "var(--warm-tint)" },
  in_progress: { label: "Em andamento", color: "var(--ink-faint)", bg: "var(--surface-2)" },
};

export default async function ResultPage({
  params,
}: {
  params: { track: string; modulo: string; attemptId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: attempt } = await supabase
    .from("attempts")
    .select("id, user_id, module_id, status, score, submitted_at")
    .eq("id", params.attemptId)
    .single();

  if (!attempt || attempt.user_id !== user.id) notFound();

  const { data: mod } = await supabase.from("modules").select("title, pass_threshold").eq("id", attempt.module_id).single();

  const { data: answers } = await supabase
    .from("attempt_answers")
    .select("id, is_correct, review_status, reviewer_feedback, question:questions(prompt, type, points)")
    .eq("attempt_id", attempt.id);

  const style = STATUS_LABEL[attempt.status] ?? STATUS_LABEL.in_progress;

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <p className="font-mono text-xs uppercase tracking-widest text-inkFaint">{mod?.title}</p>
      <div className="mt-3 inline-block px-3 py-1 rounded-full font-mono text-xs" style={{ background: style.bg, color: style.color }}>
        {style.label}
      </div>
      <h1 className="font-display text-3xl font-semibold mt-3">
        {attempt.score !== null ? `${Math.round(attempt.score)}% de aproveitamento` : "Resultado pendente"}
      </h1>

      {attempt.status === "pending_review" && (
        <p className="text-inkSoft mt-3">
          Uma ou mais questões escritas ainda não foram revisadas. Você recebe o resultado final aqui mesmo, em
          até 24h — nenhuma ação sua é necessária até lá.
        </p>
      )}
      {attempt.status === "passed" && (
        <p className="text-inkSoft mt-3">
          Próximo módulo desbloqueado.{" "}
          <Link href={`/trilha/${params.track}`} className="underline" style={{ color: "var(--accent-ink)" }}>
            Voltar para a trilha
          </Link>
        </p>
      )}
      {attempt.status === "failed" && (
        <p className="text-inkSoft mt-3">
          Você precisa de pelo menos {mod?.pass_threshold}% para avançar. Revise o conteúdo e refaça a prova
          quando quiser.
        </p>
      )}

      <div className="mt-8 space-y-3">
        {(answers ?? []).map((a: any, i: number) => (
          <div key={a.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm">{a.question?.prompt}</p>
              <span
                className="badge shrink-0"
                style={
                  a.review_status === "pending"
                    ? { background: "var(--warm-tint)", color: "var(--warm)", border: "none" }
                    : a.is_correct
                    ? { background: "var(--good-tint)", color: "var(--good)", border: "none" }
                    : { background: "var(--bad-tint)", color: "var(--bad)", border: "none" }
                }
              >
                {a.review_status === "pending" ? "em revisão" : a.is_correct ? "correta" : "incorreta"}
              </span>
            </div>
            {a.reviewer_feedback && (
              <p className="text-xs text-inkSoft mt-2 border-t border-line pt-2">
                <b>Feedback do revisor:</b> {a.reviewer_feedback}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Link href={`/trilha/${params.track}/${params.modulo}`} className="underline text-sm" style={{ color: "var(--accent-ink)" }}>
          Voltar ao módulo
        </Link>
      </div>
    </div>
  );
}
