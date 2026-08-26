import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { createClient } from "@/lib/supabase/server";
import Forum from "@/components/Forum";

export default async function ModulePage({ params }: { params: { track: string; modulo: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: track } = await supabase.from("tracks").select("id, title").eq("slug", params.track).single();
  if (!track) notFound();

  const { data: mod } = await supabase
    .from("modules")
    .select("id, slug, title, phase_label, content_md, pass_threshold")
    .eq("track_id", track.id)
    .eq("slug", params.modulo)
    .single();
  if (!mod) notFound();

  const { data: prog } = await supabase
    .from("progress")
    .select("unlocked, completed")
    .eq("user_id", user.id)
    .eq("module_id", mod.id)
    .maybeSingle();

  if (!prog?.unlocked) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="font-mono text-xs uppercase text-inkFaint">🔒 Módulo bloqueado</p>
        <h1 className="font-display text-2xl font-semibold mt-2">Conclua o módulo anterior primeiro</h1>
        <Link href={`/trilha/${params.track}`} className="inline-block mt-6 underline" style={{ color: "var(--accent-ink)" }}>
          Voltar para a trilha
        </Link>
      </div>
    );
  }

  const { data: lastAttempt } = await supabase
    .from("attempts")
    .select("id, status, score, submitted_at")
    .eq("user_id", user.id)
    .eq("module_id", mod.id)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const html = marked.parse(mod.content_md) as string;

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--accent-ink)" }}>
        {mod.phase_label}
      </p>
      <h1 className="font-display text-3xl font-semibold mt-2">{mod.title}</h1>

      <article
        className="prose-content mt-8 max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ lineHeight: 1.7 }}
      />

      <div className="card p-6 mt-10">
        <ExamCTA track={params.track} modulo={params.modulo} attempt={lastAttempt ?? null} threshold={mod.pass_threshold} />
      </div>

      <section className="mt-14">
        <h2 className="font-display text-xl font-semibold mb-4">Mural de dúvidas deste módulo</h2>
        <Forum moduleId={mod.id} />
      </section>
    </div>
  );
}

function ExamCTA({
  track,
  modulo,
  attempt,
  threshold,
}: {
  track: string;
  modulo: string;
  attempt: { id: string; status: string; score: number | null } | null;
  threshold: number;
}) {
  if (attempt?.status === "passed") {
    return (
      <p className="text-sm font-medium" style={{ color: "var(--good)" }}>
        ✓ Você passou nesta prova ({Math.round(attempt.score ?? 0)}%). Próximo módulo já está liberado.
      </p>
    );
  }
  if (attempt?.status === "pending_review") {
    return (
      <p className="text-sm" style={{ color: "var(--warm)" }}>
        ⏳ Sua prova tem questão(ões) escrita(s) aguardando revisão manual — em até 24h você recebe o resultado
        aqui mesmo.
      </p>
    );
  }
  return (
    <div>
      <p className="text-sm text-inkSoft mb-3">
        Prova com questões objetivas e discursivas. Não é possível pular questão, e você precisa de pelo menos{" "}
        <b>{threshold}%</b> de aproveitamento para liberar o próximo módulo.
        {attempt?.status === "failed" && " Sua tentativa anterior não atingiu a nota mínima — você pode refazer."}
      </p>
      <Link
        href={`/trilha/${track}/${modulo}/prova`}
        className="inline-block rounded px-5 py-2.5 font-medium"
        style={{ background: "var(--accent)", color: "var(--surface)" }}
      >
        {attempt?.status === "failed" ? "Refazer prova" : "Fazer prova"}
      </Link>
    </div>
  );
}
