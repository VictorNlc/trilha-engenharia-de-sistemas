import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Inicia (ou retoma) uma tentativa de prova para um módulo.
// Só permite iniciar se o módulo estiver desbloqueado para o usuário.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { moduleId } = await request.json();
  if (!moduleId) return NextResponse.json({ error: "moduleId obrigatório" }, { status: 400 });

  const { data: progress } = await supabase
    .from("progress")
    .select("unlocked")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (!progress?.unlocked) {
    return NextResponse.json({ error: "Este módulo ainda não foi desbloqueado" }, { status: 403 });
  }

  // reaproveita uma tentativa já em andamento, se existir
  const { data: existing } = await supabase
    .from("attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (existing) return NextResponse.json({ attemptId: existing.id });

  const { data: created, error } = await supabase
    .from("attempts")
    .insert({ user_id: user.id, module_id: moduleId, status: "in_progress" })
    .select("id")
    .single();

  if (error || !created) {
    return NextResponse.json({ error: error?.message ?? "Erro ao criar tentativa" }, { status: 500 });
  }

  return NextResponse.json({ attemptId: created.id });
}
