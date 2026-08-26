import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Troca o código de confirmação de e-mail (ou magic link) por uma sessão válida.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/trilha/engenharia-de-sistemas";

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
