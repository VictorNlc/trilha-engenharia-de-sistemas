"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
      return;
    }
    router.push(params.get("next") ?? "/trilha/engenharia-de-sistemas");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-20">
      <h1 className="font-display text-2xl font-semibold mb-1">Entrar</h1>
      <p className="text-inkSoft text-sm mb-6">Continue de onde parou na trilha.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="E-mail" type="email" value={email} onChange={setEmail} />
        <Field label="Senha" type="password" value={password} onChange={setPassword} />
        {error && <p className="text-sm" style={{ color: "var(--bad)" }}>{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded px-4 py-2.5 font-medium disabled:opacity-60"
          style={{ background: "var(--accent)", color: "var(--surface)" }}
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="text-sm text-inkSoft mt-5">
        Ainda não tem conta?{" "}
        <Link href="/signup" className="underline" style={{ color: "var(--accent-ink)" }}>
          Criar conta grátis
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm text-inkSoft mb-1 block">{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-line bg-surface px-3 py-2 text-ink"
      />
    </label>
  );
}
