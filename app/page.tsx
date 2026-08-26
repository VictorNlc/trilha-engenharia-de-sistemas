import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createClient();
  const { data: tracks } = await supabase
    .from("tracks")
    .select("slug, title, description")
    .eq("published", true);

  return (
    <div>
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16">
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--accent-ink)" }}>
          Trilha aberta &middot; prova para avançar &middot; mentor de verdade
        </p>
        <h1 className="font-display text-5xl md:text-6xl font-semibold mt-4 max-w-2xl leading-[1.05]">
          Aprenda sistemas de verdade, um módulo por vez.
        </h1>
        <p className="text-lg text-inkSoft mt-5 max-w-xl">
          Cada módulo só libera o próximo depois de uma prova real — com questões objetivas corrigidas
          na hora e questões escritas revisadas por uma pessoa em até 24h. Sem pular etapa, sem certificado
          vazio.
        </p>
        <div className="flex flex-wrap gap-3 mt-8">
          <Link href="/signup" className="rounded px-5 py-3 font-medium" style={{ background: "var(--accent)", color: "var(--surface)" }}>
            Começar agora — grátis
          </Link>
          <Link href="/trilha/engenharia-de-sistemas" className="rounded px-5 py-3 font-medium border border-line text-ink">
            Ver a trilha
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-5">
        <Feature title="Não dá pra pular" text="Cada questão precisa ser respondida antes da próxima. Sem 'pular pergunta', sem chutar sem pensar." />
        <Feature title="80% pra avançar" text="Só desbloqueia o próximo módulo quem acerta pelo menos 80% da prova — incluindo as questões escritas, revisadas por uma pessoa." />
        <Feature title="Dúvida com gente de verdade" text="Cada módulo tem um mural de dúvidas aberto, mais um link para a comunidade — sem depender só de vídeo." />
      </section>

      <section className="max-w-5xl mx-auto px-6 py-14">
        <h2 className="font-display text-2xl font-semibold mb-6">Trilhas disponíveis</h2>
        <div className="grid gap-4">
          {(tracks ?? []).map((t) => (
            <Link
              key={t.slug}
              href={`/trilha/${t.slug}`}
              className="card p-6 block hover:shadow-md transition-shadow"
            >
              <h3 className="font-display text-xl font-semibold">{t.title}</h3>
              <p className="text-inkSoft mt-2 text-sm">{t.description}</p>
            </Link>
          ))}
          {(!tracks || tracks.length === 0) && (
            <p className="text-inkFaint text-sm">
              Nenhuma trilha publicada ainda — rode <code className="font-mono">supabase/seed.sql</code> no seu
              banco para carregar a trilha de exemplo.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="card p-6">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="text-inkSoft text-sm mt-2">{text}</p>
    </div>
  );
}
