"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Thread = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  user_id: string;
  author?: string;
  replies: { id: string; body: string; created_at: string; user_id: string; author?: string }[];
};

export default function Forum({ moduleId }: { moduleId: string }) {
  const supabase = createClient();
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [openReply, setOpenReply] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [posting, setPosting] = useState(false);

  async function load() {
    const { data: threadRows } = await supabase
      .from("forum_threads")
      .select("id, title, body, created_at, user_id")
      .eq("module_id", moduleId)
      .order("created_at", { ascending: false });

    const ids = (threadRows ?? []).map((t) => t.id);
    const { data: replyRows } = ids.length
      ? await supabase
          .from("forum_replies")
          .select("id, thread_id, body, created_at, user_id")
          .in("thread_id", ids)
          .order("created_at", { ascending: true })
      : { data: [] as any[] };

    const userIds = Array.from(
      new Set([...(threadRows ?? []).map((t) => t.user_id), ...(replyRows ?? []).map((r) => r.user_id)])
    );
    const { data: profiles } = userIds.length
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] as any[] };
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

    const merged: Thread[] = (threadRows ?? []).map((t) => ({
      ...t,
      author: nameById.get(t.user_id) ?? "aluno",
      replies: (replyRows ?? [])
        .filter((r) => r.thread_id === t.id)
        .map((r) => ({ ...r, author: nameById.get(r.user_id) ?? "aluno" })),
    }));

    setThreads(merged);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  async function postThread(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setPosting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("forum_threads").insert({ module_id: moduleId, user_id: user.id, title, body });
      setTitle("");
      setBody("");
      await load();
    }
    setPosting(false);
  }

  async function postReply(threadId: string) {
    if (!replyBody.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("forum_replies").insert({ thread_id: threadId, user_id: user.id, body: replyBody });
      setReplyBody("");
      setOpenReply(null);
      await load();
    }
  }

  return (
    <div>
      <form onSubmit={postThread} className="card p-4 space-y-3 mb-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da sua dúvida"
          className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Descreva o que travou — quanto mais específico, mais fácil alguém ajudar."
          rows={3}
          className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
        />
        <button
          disabled={posting}
          className="rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
          style={{ background: "var(--accent)", color: "var(--surface)" }}
        >
          Postar dúvida
        </button>
      </form>

      {threads === null && <p className="text-sm text-inkFaint">Carregando…</p>}
      {threads?.length === 0 && (
        <p className="text-sm text-inkFaint">Nenhuma dúvida postada ainda neste módulo. Seja a primeira pessoa.</p>
      )}

      <div className="space-y-4">
        {threads?.map((t) => (
          <div key={t.id} className="card p-4">
            <p className="font-mono text-[11px] text-inkFaint">
              {t.author} · {new Date(t.created_at).toLocaleDateString("pt-BR")}
            </p>
            <h4 className="font-semibold mt-1">{t.title}</h4>
            <p className="text-sm text-inkSoft mt-1 whitespace-pre-wrap">{t.body}</p>

            {t.replies.length > 0 && (
              <div className="mt-3 pl-4 border-l-2 space-y-2" style={{ borderColor: "var(--line)" }}>
                {t.replies.map((r) => (
                  <div key={r.id}>
                    <p className="font-mono text-[11px] text-inkFaint">{r.author}</p>
                    <p className="text-sm text-inkSoft whitespace-pre-wrap">{r.body}</p>
                  </div>
                ))}
              </div>
            )}

            {openReply === t.id ? (
              <div className="mt-3 flex gap-2">
                <input
                  autoFocus
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Sua resposta…"
                  className="flex-1 rounded border border-line bg-surface px-3 py-1.5 text-sm"
                />
                <button
                  onClick={() => postReply(t.id)}
                  className="rounded px-3 py-1.5 text-sm font-medium"
                  style={{ background: "var(--accent)", color: "var(--surface)" }}
                >
                  Enviar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setOpenReply(t.id)}
                className="text-xs mt-3 underline"
                style={{ color: "var(--accent-ink)" }}
              >
                Responder
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
