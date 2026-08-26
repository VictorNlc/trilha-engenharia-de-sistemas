import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();

  const { data: progress } = await supabase
    .from("progress")
    .select("completed, unlocked, module:modules(title, phase_label, track:tracks(title))")
    .eq("user_id", user.id);

  const completedCount = (progress ?? []).filter((p) => p.completed).length;

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--accent-ink)" }}>
        Meu progresso
      </p>
      <h1 className="font-display text-3xl font-semibold mt-2">{profile?.full_name ?? user.email}</h1>
      <p className="text-inkSoft mt-2">
        {completedCount} módulo(s) concluído(s) · conta: {profile?.role === "admin" ? "administrador" : "aluno"}
      </p>

      <div className="mt-8 space-y-2">
        {(progress ?? []).map((p: any, i: number) => (
          <div key={i} className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] text-inkFaint">{p.module?.phase_label}</p>
              <p className="font-medium">{p.module?.title}</p>
            </div>
            <span className="font-mono text-xs text-inkFaint">
              {p.completed ? "concluído" : p.unlocked ? "em andamento" : "bloqueado"}
            </span>
          </div>
        ))}
        {(progress ?? []).length === 0 && (
          <p className="text-inkFaint text-sm">Você ainda não começou nenhuma trilha.</p>
        )}
      </div>
    </div>
  );
}
