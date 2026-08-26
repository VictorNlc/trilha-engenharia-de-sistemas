"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="max-w-sm mx-auto px-6 py-20">
        <h1 className="font-display text-2xl font-semibold mb-2">Confirme seu e-mail</h1>
        <p className="text-inkSoft text-sm">
          Enviamos um link de confirmação para <b>{email}</b>. Clique nele para ativar sua conta e começar a
          trilha.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-20">
      <h1 className="font-display text-2xl font-semibold mb-1">Criar conta</h1>
      <p className="text-inkSoft text-sm mb-6">Grátis. Sem certificado vazio — só progresso real.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm text-inkSoft mb-1 block">Nome</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-line bg-surface px-3 py-2 text-ink"
          />
        </label>
        <label className="block">
          <span className="text-sm text-inkSoft mb-1 block">E-mail</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-line bg-surface px-3 py-2 text-ink"
          />
        </label>
        <label className="block">
          <span className="text-sm text-inkSoft mb-1 block">Senha (mín. 6 caracteres)</span>
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-line bg-surface px-3 py-2 text-ink"
          />
        </label>
        {error && <p className="text-sm" style={{ color: "var(--bad)" }}>{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded px-4 py-2.5 font-medium disabled:opacity-60"
          style={{ background: "var(--accent)", color: "var(--surface)" }}
        >
          {loading ? "Criando…" : "Criar conta"}
        </button>
      </form>
      <p className="text-sm text-inkSoft mt-5">
        Já tem conta?{" "}
        <Link href="/login" className="underline" style={{ color: "var(--accent-ink)" }}>
          Entrar
        </Link>
      </p>
    </div>
  );
}
