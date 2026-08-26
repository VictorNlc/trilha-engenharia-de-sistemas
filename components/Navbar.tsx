import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";

export default async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    role = profile?.role ?? null;
  }

  return (
    <header className="border-b border-line bg-surface">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="font-display font-semibold text-lg text-ink">
          Trilha<span style={{ color: "var(--accent-ink)" }}>Sistemas</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/trilha/engenharia-de-sistemas" className="text-inkSoft hover:text-ink">
            Trilha
          </Link>
          {user && (
            <Link href="/perfil" className="text-inkSoft hover:text-ink">
              Meu progresso
            </Link>
          )}
          {role === "admin" && (
            <Link href="/admin/revisao" className="text-inkSoft hover:text-ink font-mono text-xs badge" style={{ background: "var(--warm-tint)", color: "var(--warm)" }}>
              revisão pendente
            </Link>
          )}
          {user ? (
            <form action={signOut}>
              <button className="text-inkSoft hover:text-ink" type="submit">
                Sair
              </button>
            </form>
          ) : (
            <Link href="/login" className="rounded px-3 py-1.5 text-sm font-medium" style={{ background: "var(--accent)", color: "var(--surface)" }}>
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
