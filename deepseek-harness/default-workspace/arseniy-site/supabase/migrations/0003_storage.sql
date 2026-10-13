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
