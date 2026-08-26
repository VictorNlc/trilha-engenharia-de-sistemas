# Trilha Engenharia de Sistemas

Plataforma de estudo com trilha progressiva: cada módulo só libera o próximo depois de uma prova
real (≥80% de aproveitamento). Questões objetivas (múltipla escolha / verdadeiro-falso) são
corrigidas na hora; questões escritas ficam numa fila de revisão manual (até 24h) antes de contar
para a nota. Cada módulo tem um mural de dúvidas embutido + link para uma comunidade externa.

Stack: **Next.js 14 (App Router) + TypeScript + Tailwind + Supabase** (Postgres + Auth). Feito para
hospedar de graça na **Vercel** com um projeto Supabase gratuito.

## 1. Criar o banco de dados (Supabase)

1. Crie uma conta em [supabase.com](https://supabase.com) e um novo projeto (plano gratuito).
2. No painel do projeto, abra **SQL Editor** → cole o conteúdo de `supabase/migrations/0001_init.sql`
   → rode. Isso cria todas as tabelas, políticas de segurança (RLS) e triggers.
3. Ainda no SQL Editor, cole o conteúdo de `supabase/seed.sql` → rode. Isso carrega a trilha de
   exemplo "Engenharia de Sistemas" com 3 módulos e questões reais.
4. Em **Project Settings → API**, copie:
   - `Project URL` → vai virar `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → vai virar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (em **Reveal**) → vai virar `SUPABASE_SERVICE_ROLE_KEY` (secreta — nunca
     exponha no navegador; só é usada nas rotas `app/api/**`)

## 2. Rodar localmente

```bash
npm install
cp .env.example .env.local   # depois edite .env.local com as 3 chaves do passo 1
npm run dev
```

Abra http://localhost:3000, crie uma conta em `/signup` e confirme o e-mail (o Supabase envia o
link de confirmação automaticamente — em projetos novos, por padrão, ele já sai funcionando).

## 3. Virar administrador (pra revisar respostas escritas)

Depois de criar sua conta pelo site, volte ao **SQL Editor** do Supabase e rode (trocando o e-mail):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'seu-email@exemplo.com');
```

Com isso, o link **"revisão pendente"** aparece no menu, em `/admin/revisao`.

## 4. Deploy na Vercel

1. Suba este projeto para um repositório no GitHub (`git init && git add . && git commit -m "inicial"` e
   depois `git push` para um repo novo).
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório.
3. Em **Environment Variables**, adicione as mesmas 4 variáveis do `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `NEXT_PUBLIC_SITE_URL` — essa última já com a URL final, ex.: `https://sua-trilha.vercel.app`).
4. Deploy. Depois, no painel do Supabase → **Authentication → URL Configuration**, adicione a URL da
   Vercel em *Site URL* e *Redirect URLs* (para o link de confirmação de e-mail funcionar em produção).

## Como adicionar uma nova trilha ou módulo

Ainda não existe uma tela de administração de conteúdo — o jeito mais rápido hoje é copiar o padrão
de `supabase/seed.sql` (um `insert` em `tracks`, um em `modules` por módulo, um em `questions` +
`question_answers` por questão) e rodar no SQL Editor do Supabase. Cada módulo novo entra
automaticamente na trilha na ordem de `order_index` — o sistema de desbloqueio já funciona para
qualquer número de módulos, sem mexer em código.

Se o volume de conteúdo crescer bastante, o próximo passo natural é construir uma tela em
`/admin/conteudo` reaproveitando o mesmo padrão de RLS (`is_admin()`) já criado no schema.

## Como funciona a trava de progresso (resumo técnico)

- `progress` guarda, por aluno e por módulo, se está `unlocked` e `completed`.
- Ao entrar numa trilha pela 1ª vez, o primeiro módulo é desbloqueado automaticamente
  (`lib/enroll.ts`).
- Ao enviar uma prova (`app/api/attempts/[id]/submit`), questões objetivas são corrigidas na hora
  contra `question_answers` (tabela sem nenhuma política de leitura para `anon`/`authenticated` —
  só a `service_role` key, usada nas rotas de servidor, consegue lê-la). Questões discursivas viram
  `review_status = 'pending'`.
- Se não sobrar nenhuma pendência, `lib/grading.ts` calcula o percentual final; se ≥ `pass_threshold`
  (80% por padrão, configurável por módulo), desbloqueia o próximo módulo automaticamente.
- Quando o admin aprova/rejeita uma resposta pendente em `/admin/revisao`, o mesmo cálculo roda de
  novo — é assim que a prova "termina" depois da revisão manual, sem o aluno precisar fazer nada.

## Estrutura de pastas

```
app/
  page.tsx                          → landing page
  login/ signup/ auth/callback/     → autenticação
  trilha/[track]/                   → lista de módulos da trilha
  trilha/[track]/[modulo]/          → conteúdo do módulo + mural de dúvidas
  trilha/[track]/[modulo]/prova/    → quiz (não deixa pular questão)
  trilha/[track]/[modulo]/resultado/[attemptId]/  → resultado da tentativa
  admin/revisao/                    → fila de correção manual
  api/attempts/**                   → iniciar prova, salvar resposta, enviar prova
  api/admin/review/**               → aprovar/rejeitar resposta escrita
components/                         → QuizRunner, Forum, ReviewCard, Navbar, LoginForm
lib/supabase/                       → clientes (browser / server / admin com service_role)
lib/grading.ts                      → regra de correção e desbloqueio (>=80%)
supabase/migrations/0001_init.sql   → schema completo + RLS
supabase/seed.sql                   → trilha de exemplo com módulos e questões reais
```
