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
