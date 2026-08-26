"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; label: string };
type Question = {
  id: string;
  order_index: number;
  type: "multiple_choice" | "true_false" | "discursive";
  prompt: string;
  options: Option[] | null;
  points: number;
  min_chars: number | null;
};

type AnswerState = {
  selectedOptionId?: string | null;
  booleanAnswer?: boolean | null;
  answerText?: string | null;
};

export default function QuizRunner({
  moduleId,
  moduleTitle,
  trackSlug,
  moduleSlug,
  passThreshold,
  questions,
  initialAttemptId,
  initialAnswers,
}: {
  moduleId: string;
  moduleTitle: string;
  trackSlug: string;
  moduleSlug: string;
  passThreshold: number;
  questions: Question[];
  initialAttemptId: string | null;
  initialAnswers: Record<string, AnswerState>;
}) {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState<string | null>(initialAttemptId);
  const [starting, setStarting] = useState(!initialAttemptId);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(initialAnswers);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  useEffect(() => {
    if (attemptId) return;
    (async () => {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível iniciar a prova.");
        return;
      }
      setAttemptId(data.attemptId);
      setStarting(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const question = questions[index];
  const total = questions.length;

  const currentAnswer = answers[question?.id] ?? {};
  const minChars = question?.min_chars && question.min_chars > 0 ? question.min_chars : 20;

  const isAnswered = useMemo(() => {
    if (!question) return false;
    if (question.type === "multiple_choice") return !!currentAnswer.selectedOptionId;
    if (question.type === "true_false") return typeof currentAnswer.booleanAnswer === "boolean";
    if (question.type === "discursive") return (currentAnswer.answerText ?? "").trim().length >= minChars;
    return false;
  }, [question, currentAnswer, minChars]);

  const allAnswered = questions.every((q) => {
    const a = answers[q.id];
    if (!a) return false;
    if (q.type === "multiple_choice") return !!a.selectedOptionId;
    if (q.type === "true_false") return typeof a.booleanAnswer === "boolean";
    if (q.type === "discursive") return (a.answerText ?? "").trim().length >= (q.min_chars || 20);
    return false;
  });

  function setAnswer(patch: AnswerState) {
    setAnswers((prev) => ({ ...prev, [question.id]: { ...prev[question.id], ...patch } }));
  }

  async function saveCurrent() {
    if (!attemptId || !question) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/attempts/${attemptId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id, ...currentAnswer }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao salvar resposta.");
      return false;
    }
    return true;
  }

  async function goNext() {
    if (!isAnswered) return;
    const ok = await saveCurrent();
    if (!ok) return;
    if (index < total - 1) setIndex(index + 1);
  }

  async function handleSubmit() {
    if (!attemptId || !allAnswered) return;
    const ok = await saveCurrent();
    if (!ok) return;
    setSaving(true);
    const res = await fetch(`/api/attempts/${attemptId}/submit`, { method: "POST" });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao enviar a prova.");
      return;
    }
    router.push(`/trilha/${trackSlug}/${moduleSlug}/resultado/${attemptId}`);
  }

  if (starting) {
    return <p className="text-inkFaint">Preparando sua prova…</p>;
  }
  if (error && !attemptId) {
    return <p style={{ color: "var(--bad)" }}>{error}</p>;
  }
  if (!question) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-xs text-inkFaint">
          Questão {index + 1} de {total}
        </p>
        <p className="font-mono text-xs text-inkFaint">Mínimo para passar: {passThreshold}%</p>
      </div>
      <div className="w-full h-1.5 rounded-full mb-8" style={{ background: "var(--surface-2)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${((index + 1) / total) * 100}%`, background: "var(--accent)" }}
        />
      </div>

      <div className="card p-6">
        <span
          className="badge"
          style={{
            background: "var(--accent-tint)",
            color: "var(--accent-ink)",
            border: "none",
          }}
        >
          {question.type === "multiple_choice" ? "múltipla escolha" : question.type === "true_false" ? "verdadeiro ou falso" : "resposta escrita"}
        </span>
        <p className="font-display text-lg font-medium mt-4 leading-snug">{question.prompt}</p>

        {question.type === "multiple_choice" && (
          <div className="mt-5 space-y-2">
            {(question.options ?? []).map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-3 rounded border px-4 py-3 cursor-pointer"
                style={{
                  borderColor: currentAnswer.selectedOptionId === opt.id ? "var(--accent)" : "var(--line)",
                  background: currentAnswer.selectedOptionId === opt.id ? "var(--accent-tint)" : "transparent",
                }}
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={currentAnswer.selectedOptionId === opt.id}
                  onChange={() => setAnswer({ selectedOptionId: opt.id })}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === "true_false" && (
          <div className="mt-5 flex gap-3">
            {[
              { v: true, label: "Verdadeiro" },
              { v: false, label: "Falso" },
            ].map((opt) => (
              <button
                key={String(opt.v)}
                type="button"
                onClick={() => setAnswer({ booleanAnswer: opt.v })}
                className="flex-1 rounded border px-4 py-3 text-sm font-medium"
                style={{
                  borderColor: currentAnswer.booleanAnswer === opt.v ? "var(--accent)" : "var(--line)",
                  background: currentAnswer.booleanAnswer === opt.v ? "var(--accent-tint)" : "transparent",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {question.type === "discursive" && (
          <div className="mt-5">
            <textarea
              rows={6}
              value={currentAnswer.answerText ?? ""}
              onChange={(e) => setAnswer({ answerText: e.target.value })}
              placeholder="Escreva sua resposta com suas próprias palavras…"
              className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
            />
            <p className="text-xs text-inkFaint mt-1">
              {(currentAnswer.answerText ?? "").trim().length}/{minChars} caracteres mínimos · esta questão será
              revisada por uma pessoa em até 24h
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm mt-3" style={{ color: "var(--bad)" }}>
          {error}
        </p>
      )}

      <div className="flex items-center justify-between mt-6">
        <p className="text-xs text-inkFaint">
          {isAnswered ? "Resposta registrada — não é possível pular esta questão sem responder." : "Responda para continuar."}
        </p>
        {index < total - 1 ? (
          <button
            onClick={goNext}
            disabled={!isAnswered || saving}
            className="rounded px-5 py-2.5 font-medium disabled:opacity-40"
            style={{ background: "var(--accent)", color: "var(--surface)" }}
          >
            {saving ? "Salvando…" : "Próxima"}
          </button>
        ) : !confirmSubmit ? (
          <button
            onClick={() => setConfirmSubmit(true)}
            disabled={!isAnswered || saving}
            className="rounded px-5 py-2.5 font-medium disabled:opacity-40"
            style={{ background: "var(--accent)", color: "var(--surface)" }}
          >
            Revisar e enviar
          </button>
        ) : null}
      </div>

      {confirmSubmit && (
        <div className="card p-5 mt-4" style={{ borderColor: "var(--warm)" }}>
          <p className="text-sm">
            {allAnswered
              ? "Todas as questões foram respondidas. Depois de enviar, você não poderá mais editar as respostas."
              : "Ainda faltam questões sem resposta — volte e responda todas antes de enviar."}
          </p>
          <div className="flex gap-3 mt-3">
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || saving}
              className="rounded px-4 py-2 text-sm font-medium disabled:opacity-40"
              style={{ background: "var(--warm)", color: "var(--surface)" }}
            >
              {saving ? "Enviando…" : "Enviar prova definitivamente"}
            </button>
            <button onClick={() => setConfirmSubmit(false)} className="text-sm text-inkSoft underline">
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
