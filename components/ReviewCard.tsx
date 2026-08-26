"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewCard({
  answerId,
  studentName,
  moduleTitle,
  prompt,
  answerText,
  maxPoints,
  modelAnswer,
}: {
  answerId: string;
  studentName: string;
  moduleTitle: string;
  prompt: string;
  answerText: string;
  maxPoints: number;
  modelAnswer: string | null;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [points, setPoints] = useState(maxPoints);
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function decide(decision: "approved" | "rejected") {
    setBusy(decision);
    const res = await fetch(`/api/admin/review/${answerId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, feedback, pointsAwarded: decision === "approved" ? points : 0 }),
    });
    setBusy(null);
    if (res.ok) {
      setDone(decision);
      router.refresh();
    }
  }

  if (done) {
    return (
      <div className="card p-5" style={{ opacity: 0.6 }}>
        <p className="text-sm">
          Revisado como <b>{done === "approved" ? "aprovado" : "rejeitado"}</b>.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <p className="font-mono text-[11px] text-inkFaint">
        {studentName} · {moduleTitle}
      </p>
      <p className="font-medium mt-2">{prompt}</p>

      <div className="mt-3 rounded p-3 text-sm whitespace-pre-wrap" style={{ background: "var(--surface-2)" }}>
        {answerText || <em className="text-inkFaint">(sem resposta)</em>}
      </div>

      {modelAnswer && (
        <details className="mt-3">
          <summary className="text-xs cursor-pointer" style={{ color: "var(--accent-ink)" }}>
            Ver gabarito de referência
          </summary>
          <p className="text-xs text-inkSoft mt-2">{modelAnswer}</p>
        </details>
      )}

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Feedback para o aluno (opcional, mas recomendado)"
        rows={2}
        className="w-full rounded border border-line bg-surface px-3 py-2 text-sm mt-4"
      />

      <div className="flex items-center gap-3 mt-3">
        <label className="text-xs text-inkFaint flex items-center gap-2">
          Pontos concedidos
          <input
            type="number"
            min={0}
            max={maxPoints}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="w-16 rounded border border-line bg-surface px-2 py-1 text-sm"
          />
          / {maxPoints}
        </label>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => decide("approved")}
          disabled={busy !== null}
          className="rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--good)", color: "var(--surface)" }}
        >
          {busy === "approved" ? "Aprovando…" : "Aprovar"}
        </button>
        <button
          onClick={() => decide("rejected")}
          disabled={busy !== null}
          className="rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--bad)", color: "var(--surface)" }}
        >
          {busy === "rejected" ? "Rejeitando…" : "Rejeitar"}
        </button>
      </div>
    </div>
  );
}
