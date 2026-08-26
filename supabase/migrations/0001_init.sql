-- =========================================================================
-- Trilha Engenharia de Sistemas — schema inicial
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase
-- (ou via `supabase db push` se estiver usando a CLI).
-- =========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- PERFIS (1:1 com auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('student','mentor','admin')),
  created_at timestamptz not null default now()
);

-- cria o perfil automaticamente quando um usuário se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- TRILHAS e MÓDULOS (conteúdo)
-- ---------------------------------------------------------------------
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  community_url text, -- link externo (Discord/Telegram) para a trilha
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks(id) on delete cascade,
  slug text not null,
  order_index int not null,
  phase_label text,          -- ex: "Fase 1"
  title text not null,
  content_md text not null,  -- conteúdo da "ficha" em markdown
  pass_threshold int not null default 80, -- % mínimo para passar
  published boolean not null default true,
  created_at timestamptz not null default now(),
  unique (track_id, slug),
  unique (track_id, order_index)
);

-- ---------------------------------------------------------------------
-- QUESTÕES (públicas: enunciado/opções — SEM gabarito)
-- ---------------------------------------------------------------------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  order_index int not null,
  type text not null check (type in ('multiple_choice','true_false','discursive')),
  prompt text not null,
  options jsonb, -- para multiple_choice: [{"id":"a","label":"..."}, ...]
  points int not null default 1,
  min_chars int default 0, -- para discursive: tamanho mínimo exigido
  created_at timestamptz not null default now(),
  unique (module_id, order_index)
);

-- GABARITO (isolado — nenhuma policy de select concede acesso a authenticated/anon;
-- só é lido pelas rotas de servidor com a service_role key)
create table if not exists public.question_answers (
  question_id uuid primary key references public.questions(id) on delete cascade,
  correct_option_id text,      -- para multiple_choice
  correct_boolean boolean,     -- para true_false
  model_answer text            -- para discursive: gabarito de referência do revisor
);

-- ---------------------------------------------------------------------
-- PROGRESSO (o que cada aluno já desbloqueou/concluiu)
-- ---------------------------------------------------------------------
create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  unlocked boolean not null default false,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, module_id)
);

-- ---------------------------------------------------------------------
-- TENTATIVAS DE PROVA
-- ---------------------------------------------------------------------
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  status text not null default 'in_progress'
    check (status in ('in_progress','pending_review','passed','failed')),
  score numeric,
  started_at timestamptz not null default now(),
  submitted_at timestamptz
);

create table if not exists public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option_id text,
  boolean_answer boolean,
  answer_text text,
  is_correct boolean,
  points_awarded numeric,
  review_status text not null default 'auto'
    check (review_status in ('auto','pending','approved','rejected')),
  reviewer_id uuid references auth.users(id),
  reviewer_feedback text,
  reviewed_at timestamptz,
  unique (attempt_id, question_id)
);

-- ---------------------------------------------------------------------
-- MURAL DE DÚVIDAS (fórum por módulo)
-- ---------------------------------------------------------------------
create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================
alter table public.profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.modules enable row level security;
alter table public.questions enable row level security;
alter table public.question_answers enable row level security; -- sem policies = ninguém via anon/authenticated
alter table public.progress enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_replies enable row level security;

-- helper: sou admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- profiles: qualquer autenticado pode ver nome/role de todos (necessário para
-- atribuir autoria no mural de dúvidas) — só o próprio dono pode atualizar.
create policy "profiles: leitura autenticada" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles: atualizar o próprio" on public.profiles
  for update using (auth.uid() = id);

-- tracks / modules / questions: leitura pública para usuários logados
create policy "tracks: leitura autenticada" on public.tracks
  for select using (auth.role() = 'authenticated' and published = true);
create policy "modules: leitura autenticada" on public.modules
  for select using (auth.role() = 'authenticated' and published = true);
create policy "questions: leitura autenticada" on public.questions
  for select using (auth.role() = 'authenticated');
-- question_answers: NENHUMA policy → bloqueado para anon/authenticated,
-- acessível apenas via service_role (rotas app/api/**).

-- admin pode gerenciar conteúdo
create policy "tracks: admin escreve" on public.tracks for all using (public.is_admin());
create policy "modules: admin escreve" on public.modules for all using (public.is_admin());
create policy "questions: admin escreve" on public.questions for all using (public.is_admin());

-- progress: cada um vê/edita o próprio; admin vê tudo
create policy "progress: dono ou admin" on public.progress
  for select using (auth.uid() = user_id or public.is_admin());
create policy "progress: dono escreve o próprio" on public.progress
  for all using (auth.uid() = user_id or public.is_admin());

-- attempts: dono ou admin
create policy "attempts: dono ou admin vê" on public.attempts
  for select using (auth.uid() = user_id or public.is_admin());
create policy "attempts: dono cria" on public.attempts
  for insert with check (auth.uid() = user_id);
create policy "attempts: dono ou admin atualiza" on public.attempts
  for update using (auth.uid() = user_id or public.is_admin());

-- attempt_answers: dono ou admin
create policy "attempt_answers: dono ou admin vê" on public.attempt_answers
  for select using (
    public.is_admin() or exists (
      select 1 from public.attempts a where a.id = attempt_id and a.user_id = auth.uid()
    )
  );
create policy "attempt_answers: dono escreve" on public.attempt_answers
  for insert with check (
    exists (select 1 from public.attempts a where a.id = attempt_id and a.user_id = auth.uid())
  );
create policy "attempt_answers: dono atualiza a própria resposta" on public.attempt_answers
  for update using (
    exists (select 1 from public.attempts a where a.id = attempt_id and a.user_id = auth.uid())
    and review_status in ('auto')
  );
create policy "attempt_answers: admin revisa" on public.attempt_answers
  for update using (public.is_admin());

-- fórum: qualquer autenticado lê e posta; autor edita/apaga o próprio
create policy "forum_threads: leitura autenticada" on public.forum_threads
  for select using (auth.role() = 'authenticated');
create policy "forum_threads: autor cria" on public.forum_threads
  for insert with check (auth.uid() = user_id);
create policy "forum_threads: autor ou admin apaga" on public.forum_threads
  for delete using (auth.uid() = user_id or public.is_admin());

create policy "forum_replies: leitura autenticada" on public.forum_replies
  for select using (auth.role() = 'authenticated');
create policy "forum_replies: autor cria" on public.forum_replies
  for insert with check (auth.uid() = user_id);
create policy "forum_replies: autor ou admin apaga" on public.forum_replies
  for delete using (auth.uid() = user_id or public.is_admin());

-- =========================================================================
-- Fim do schema. Veja supabase/seed.sql para dados de exemplo
-- (1 trilha + 3 módulos + questões reais de Engenharia de Sistemas).
-- =========================================================================
