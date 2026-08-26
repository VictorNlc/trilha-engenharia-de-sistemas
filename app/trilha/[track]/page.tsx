import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureEnrollment } from "@/lib/enroll";

export default async function TrackPage({ params }: { params: { track: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // middleware já redireciona para /login

  const { data: track } = await supabase
    .from("tracks")
    .select("id, title, description, community_url")
    .eq("slug", params.track)
    .single();

  if (!track) notFound();

  await ensureEnrollment(supabase, user.id, track.id);

  const { data: modules } = await supabase
    .from("modules")
    .select("id, slug, order_index, phase_label, title, pass_threshold")
    .eq("track_id", track.id)
    .order("order_index");

  const { data: progressRows } = await supabase
    .from("progress")
    .select("module_id, unlocked, completed")
    .eq("user_id", user.id);

  const { data: pendingAttempts } = await supabase
    .from("attempts")
    .select("module_id, status")
    .eq("user_id", user.id)
    .eq("status", "pending_review");

  const progressByModule = new Map((progressRows ?? []).map((p) => [p.module_id, p]));
  const pendingByModule = new Set((pendingAttempts ?? []).map((a) => a.module_id));

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--accent-ink)" }}>
        Trilha
      </p>
      <h1 className="font-display text-4xl font-semibold mt-2">{track.title}</h1>
      <p className="text-inkSoft mt-3 max-w-xl">{track.description}</p>

      {track.community_url && (
        <a
          href={track.community_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-5 rounded px-4 py-2 text-sm font-medium border border-line text-ink"
        >
          Tirar dúvidas na comunidade ↗
        </a>
      )}

      <ol className="mt-10 space-y-3">
        {(modules ?? []).map((m, i) => {
          const p = progressByModule.get(m.id);
          const unlocked = !!p?.unlocked;
          const completed = !!p?.completed;
          const pending = pendingByModule.has(m.id);

          const content = (
            <div
              className="card p-5 flex items-center justify-between gap-4"
              style={{ opacity: unlocked ? 1 : 0.55 }}
            >
              <div className="flex items-center gap-4">
                <span
                  className="font-mono text-sm w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: completed ? "var(--good-tint)" : "var(--surface-2)",
                    color: completed ? "var(--good)" : "var(--ink-faint)",
                  }}
                >
                  {completed ? "✓" : i + 1}
                </span>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wide text-inkFaint">{m.phase_label}</p>
                  <h2 className="font-display font-semibold text-lg">{m.title}</h2>
                </div>
              </div>
              <span className="font-mono text-xs text-inkFaint shrink-0">
                {completed ? "concluído" : pending ? "em revisão" : unlocked ? "disponível" : "bloqueado"}
              </span>
            </div>
          );

          return (
            <li key={m.id}>
              {unlocked ? (
                <Link href={`/trilha/${params.track}/${m.slug}`}>{content}</Link>
              ) : (
                <div aria-disabled className="cursor-not-allowed">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
