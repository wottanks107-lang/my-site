-- ============================================================================
--  Personal OS — полная настройка базы одним файлом.
--
--  Это последовательно 0001_schema.sql, 0002_rls.sql и 0003_storage.sql.
--  Вставь ВЕСЬ этот файл в Supabase → SQL Editor → New query → Run.
--  Файл идемпотентный: повторный запуск не ломает базу.
--
--  Отдельные файлы остались в supabase/migrations/ — они удобнее, если нужно
--  менять схему по частям.
-- ============================================================================

-- ########## 0001_schema.sql ##########

-- ============================================================================
--  0001_schema.sql — структура базы Personal OS
--  Идемпотентно: файл можно запускать повторно без ошибок.
--  Запускать в Supabase → SQL Editor целиком.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Перечисления (enum). Каждое обёрнуто в DO, чтобы повторный запуск не падал.
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.project_status as enum ('idea', 'experiment', 'building', 'in_progress', 'paused', 'done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.goal_status as enum ('not_started', 'in_progress', 'done', 'paused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.homework_status as enum ('new', 'in_progress', 'done', 'overdue');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.priority_level as enum ('low', 'normal', 'high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.repeat_kind as enum ('none', 'daily', 'weekdays', 'weekly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.workout_kind as enum ('gym', 'swim', 'run', 'home', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.book_status as enum ('want', 'reading', 'done', 'dropped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.media_kind as enum ('image', 'file');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Общий триггер: обновлять updated_at при любом UPDATE.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ===========================================================================
--  ПУБЛИЧНЫЕ ДАННЫЕ
-- ===========================================================================

-- Профиль владельца. Одна строка: id = 1.
create table if not exists public.profiles (
  id                   smallint primary key default 1 check (id = 1),
  name                 text not null default 'Арсений',
  age                  int  check (age is null or (age > 0 and age < 120)),
  city                 text,
  tagline              text,                       -- короткая фраза под именем
  short_bio            text,                       -- 1–2 предложения для блока «обо мне»
  bio_paragraphs       text[] not null default '{}', -- абзацы раздела «обо мне»
  status               text,                       -- «чем занимаюсь сейчас»
  directions           text[] not null default '{}', -- AI, CODE, BUSINESS, SPORT
  email                text,
  photo_url            text,
  photo_position       text not null default 'center', -- object-position для фото
  hero_bg_url          text,
  primary_button_label text not null default 'Мои проекты',
  secondary_button_label text not null default 'Открыть Dashboard',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Настройки сайта. Одна строка: id = 1.
create table if not exists public.site_settings (
  id               smallint primary key default 1 check (id = 1),
  site_title       text not null default 'Arseniy — My Journey',
  site_description text not null default 'Личный сайт Арсения. AI, code, business, sport, development and life.',
  og_image_url     text,
  accent_color     text not null default '#E5202E',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.social_links (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  url        text not null,
  icon       text,                       -- имя иконки lucide, например 'send'
  username   text,
  sort_order int  not null default 0,
  is_public  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.timeline_events (
  id         uuid primary key default gen_random_uuid(),
  period     text not null,              -- «15 лет», «2026», «Сейчас»
  title      text not null,
  body       text,
  sort_order int not null default 0,
  is_public  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  level      text,
  value      int not null default 0 check (value between 0 and 10),
  sort_order int not null default 0,
  is_public  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  summary      text,
  description  text,
  status       public.project_status not null default 'idea',
  progress     int not null default 0 check (progress between 0 and 100),
  tech         text[] not null default '{}',
  github_url   text,
  demo_url     text,
  cover_url    text,
  started_on   date,
  period_label text,                     -- «2026», если точная дата неизвестна
  is_public    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.project_tasks (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title      text not null,
  done       boolean not null default false,
  sort_order int not null default 0
);

create table if not exists public.project_media (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  url        text not null,
  caption    text,
  sort_order int not null default 0
);

create table if not exists public.project_changelog (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  happened_on date not null default current_date,
  body       text not null
);

create table if not exists public.books (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  author      text,
  status      public.book_status not null default 'want',
  percent     int not null default 0 check (percent between 0 and 100),
  rating      smallint check (rating is null or rating between 1 and 5),
  note        text,
  cover_url   text,
  started_on  date,
  finished_on date,
  is_public   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ===========================================================================
--  ПРИВАТНЫЕ ДАННЫЕ (RLS включён, публичных политик нет — см. 0002)
-- ===========================================================================

create table if not exists public.schedule_events (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  category         text,
  color            text,
  day_of_week      smallint check (day_of_week is null or day_of_week between 1 and 7), -- 1 = Пн
  event_date       date,
  start_time       time not null,
  end_time         time,
  repeat           public.repeat_kind not null default 'none',
  repeat_until     date,
  reminder_minutes int,
  status           text not null default 'planned',
  location         text,
  url              text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint schedule_events_target check (
    (repeat = 'none' and event_date is not null) or
    (repeat <> 'none' and day_of_week is not null)
  ),
  constraint schedule_events_time_order check (end_time is null or end_time > start_time)
);

create table if not exists public.homework (
  id             uuid primary key default gen_random_uuid(),
  subject        text not null,
  subject_color  text,
  topic          text,
  description    text,
  assigned_on    date,
  due_date       date,
  due_time       time,
  priority       public.priority_level not null default 'normal',
  status         public.homework_status not null default 'new',
  url            text,
  attachment_url text,
  note           text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.homework_checklist (
  id          uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework(id) on delete cascade,
  title       text not null,
  done        boolean not null default false,
  sort_order  int not null default 0
);

create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text,
  category   text,
  note_date  date not null default current_date,
  pinned     boolean not null default false,
  image_url  text,
  links      text[] not null default '{}',
  is_public  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.note_tags (
  id      uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  tag     text not null,
  unique (note_id, tag)
);

create table if not exists public.goals (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  category    text,
  description text,
  deadline    date,
  progress    int not null default 0 check (progress between 0 and 100),
  status      public.goal_status not null default 'not_started',
  priority    public.priority_level not null default 'normal',
  metric_from text,                      -- «0 ₽», «B1», «0»
  metric_to   text,                      -- «50 000 ₽/мес», «B2», «100%»
  is_public   boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.goal_tasks (
  id         uuid primary key default gen_random_uuid(),
  goal_id    uuid not null references public.goals(id) on delete cascade,
  title      text not null,
  done       boolean not null default false,
  sort_order int not null default 0
);

create table if not exists public.workouts (
  id           uuid primary key default gen_random_uuid(),
  workout_date date not null default current_date,
  workout_time time,
  kind         public.workout_kind not null default 'gym',
  duration_min int check (duration_min is null or duration_min > 0),
  comment      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.workout_exercises (
  id         uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  name       text not null,
  sets       int check (sets is null or sets > 0),
  reps       int check (reps is null or reps > 0),
  weight_kg  numeric(6, 2) check (weight_kg is null or weight_kg >= 0),
  sort_order int not null default 0
);

create table if not exists public.finance_months (
  id         uuid primary key default gen_random_uuid(),
  month      text not null,
  income     numeric(12, 2) not null default 0,
  expense    numeric(12, 2) not null default 0,
  sales      int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===========================================================================
--  МЕДИА
-- ===========================================================================

create table if not exists public.media (
  id         uuid primary key default gen_random_uuid(),
  bucket     text not null default 'site-assets',
  path       text not null,
  url        text not null,
  kind       public.media_kind not null default 'image',
  mime       text,
  size_bytes bigint,
  folder     text,                       -- profile / projects / notes / homework
  created_at timestamptz not null default now(),
  unique (bucket, path)
);

-- ===========================================================================
--  ИНДЕКСЫ
-- ===========================================================================
create index if not exists idx_social_links_order      on public.social_links (sort_order);
create index if not exists idx_timeline_events_order   on public.timeline_events (sort_order);
create index if not exists idx_skills_order            on public.skills (sort_order);
create index if not exists idx_projects_order          on public.projects (sort_order);
create index if not exists idx_projects_public         on public.projects (is_public);
create index if not exists idx_project_tasks_project   on public.project_tasks (project_id, sort_order);
create index if not exists idx_project_media_project   on public.project_media (project_id, sort_order);
create index if not exists idx_project_log_project     on public.project_changelog (project_id, happened_on desc);
create index if not exists idx_books_order             on public.books (sort_order);

create index if not exists idx_schedule_day            on public.schedule_events (day_of_week);
create index if not exists idx_schedule_date           on public.schedule_events (event_date);
create index if not exists idx_homework_due            on public.homework (due_date);
create index if not exists idx_homework_status         on public.homework (status);
create index if not exists idx_homework_checklist      on public.homework_checklist (homework_id, sort_order);
create index if not exists idx_notes_date              on public.notes (note_date desc);
create index if not exists idx_notes_pinned            on public.notes (pinned);
create index if not exists idx_note_tags_note          on public.note_tags (note_id);
create index if not exists idx_note_tags_tag           on public.note_tags (tag);
create index if not exists idx_goals_status            on public.goals (status);
create index if not exists idx_goals_order             on public.goals (sort_order);
create index if not exists idx_goal_tasks_goal         on public.goal_tasks (goal_id, sort_order);
create index if not exists idx_workouts_date           on public.workouts (workout_date desc);
create index if not exists idx_workout_exercises       on public.workout_exercises (workout_id, sort_order);
create index if not exists idx_finance_month           on public.finance_months (month);
create index if not exists idx_media_folder            on public.media (folder);

-- ===========================================================================
--  ТРИГГЕРЫ updated_at
-- ===========================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'site_settings', 'social_links', 'timeline_events', 'skills', 'projects',
    'books', 'schedule_events', 'homework', 'notes', 'goals', 'workouts', 'finance_months'
  ] loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$I', t);
    execute format('create trigger trg_%1$s_updated before update on public.%1$I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;


-- ########## 0002_rls.sql ##########

-- ============================================================================
--  0002_rls.sql — правила доступа (Row Level Security)
--
--  Принцип:
--    • публичные таблицы  — чтение разрешено анонимно (с учётом is_public);
--    • приватные таблицы  — RLS включён, политик нет вообще, значит анонимный
--      ключ не вернёт ни одной строки и не сможет ничего записать;
--    • запись вообще нигде не разрешена ролям anon/authenticated.
--      Пишет только сервер через service_role, а он обходит RLS.
--
--  Это значит: даже если публичный (anon) ключ утечёт — приватные данные
--  (расписание, ДЗ, заметки, цели, тренировки, финансы, медиа) недоступны.
--
--  Запускать после 0001_schema.sql. Файл идемпотентный.
-- ============================================================================

-- Включаем RLS на всех таблицах.
alter table public.profiles            enable row level security;
alter table public.site_settings       enable row level security;
alter table public.social_links        enable row level security;
alter table public.timeline_events     enable row level security;
alter table public.skills              enable row level security;
alter table public.projects            enable row level security;
alter table public.project_tasks       enable row level security;
alter table public.project_media       enable row level security;
alter table public.project_changelog   enable row level security;
alter table public.books               enable row level security;
alter table public.schedule_events     enable row level security;
alter table public.homework            enable row level security;
alter table public.homework_checklist  enable row level security;
alter table public.notes               enable row level security;
alter table public.note_tags           enable row level security;
alter table public.goals               enable row level security;
alter table public.goal_tasks          enable row level security;
alter table public.workouts            enable row level security;
alter table public.workout_exercises   enable row level security;
alter table public.finance_months      enable row level security;
alter table public.media               enable row level security;

-- ---------------------------------------------------------------------------
--  Публичное чтение
-- ---------------------------------------------------------------------------
drop policy if exists "profiles: public read" on public.profiles;
create policy "profiles: public read" on public.profiles
  for select to anon, authenticated using (true);

drop policy if exists "site_settings: public read" on public.site_settings;
create policy "site_settings: public read" on public.site_settings
  for select to anon, authenticated using (true);

drop policy if exists "social_links: public read" on public.social_links;
create policy "social_links: public read" on public.social_links
  for select to anon, authenticated using (is_public);

drop policy if exists "timeline_events: public read" on public.timeline_events;
create policy "timeline_events: public read" on public.timeline_events
  for select to anon, authenticated using (is_public);

drop policy if exists "skills: public read" on public.skills;
create policy "skills: public read" on public.skills
  for select to anon, authenticated using (is_public);

drop policy if exists "projects: public read" on public.projects;
create policy "projects: public read" on public.projects
  for select to anon, authenticated using (is_public);

drop policy if exists "project_tasks: public read" on public.project_tasks;
create policy "project_tasks: public read" on public.project_tasks
  for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.is_public));

drop policy if exists "project_media: public read" on public.project_media;
create policy "project_media: public read" on public.project_media
  for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.is_public));

drop policy if exists "project_changelog: public read" on public.project_changelog;
create policy "project_changelog: public read" on public.project_changelog
  for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.is_public));

drop policy if exists "books: public read" on public.books;
create policy "books: public read" on public.books
  for select to anon, authenticated using (is_public);

-- ---------------------------------------------------------------------------
--  Приватные таблицы: политик СОЗНАТЕЛЬНО нет.
--  RLS включён → anon и authenticated не видят ничего и не могут писать.
--
--    schedule_events, homework, homework_checklist, notes, note_tags,
--    goals, goal_tasks, workouts, workout_exercises, finance_months, media
--
--  Если однажды понадобится отдавать что-то из них наружу — добавляй политику
--  осознанно, например:
--
--    create policy "goals: public read" on public.goals
--      for select to anon using (is_public);
-- ---------------------------------------------------------------------------


-- ########## 0003_storage.sql ##########

-- ============================================================================
--  0003_storage.sql — bucket для картинок и файлов
--
--  Bucket публичный на чтение (картинки должны открываться по URL),
--  но загружать в него может только сервер через service_role:
--  политик на insert/update/delete для anon/authenticated нет.
--
--  Запускать после 0002_rls.sql. Файл идемпотентный.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-assets',
  'site-assets',
  true,
  10485760, -- 10 МБ
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'application/pdf']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Публичное чтение файлов bucket'а.
drop policy if exists "site-assets: public read" on storage.objects;
create policy "site-assets: public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'site-assets');

-- Политик на запись нет намеренно: загрузка идёт с сервера (service_role).

