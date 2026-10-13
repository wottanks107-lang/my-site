# Supabase: база, доступы и Storage

В этой папке лежит всё, что нужно для базы Personal OS.

```
supabase/migrations/0001_schema.sql   таблицы, enum'ы, индексы, триггеры updated_at
supabase/migrations/0002_rls.sql      правила доступа (Row Level Security)
supabase/migrations/0003_storage.sql  bucket site-assets для картинок
```

## Порядок запуска

Файлы запускаются **по очереди, в порядке номеров** в Supabase → SQL Editor.
Каждый файл идемпотентный: повторный запуск не ломает базу.

1. Открой проект → **SQL Editor** → New query.
2. Вставь содержимое `0001_schema.sql` → **Run**.
3. То же для `0002_rls.sql`.
4. То же для `0003_storage.sql`.
5. Перенеси данные: `npm run migrate` (см. ниже).

## Архитектура доступа

| | Кто читает | Кто пишет |
|---|---|---|
| Публичные данные | анонимно, через anon-ключ | только сервер |
| Приватные данные | никто, кроме сервера | только сервер |

- **Публичные таблицы** (`profiles`, `site_settings`, `social_links`, `timeline_events`,
  `skills`, `projects`, `project_tasks`, `project_media`, `project_changelog`, `books`)
  имеют политику `select` для ролей `anon` и `authenticated`, с учётом флага `is_public`.
- **Приватные таблицы** (`schedule_events`, `homework`, `homework_checklist`, `notes`,
  `note_tags`, `goals`, `goal_tasks`, `workouts`, `workout_exercises`, `finance_months`, `media`)
  имеют включённый RLS и **ни одной политики**. Это значит: анонимный ключ не вернёт
  ни строки и не сможет ничего записать. Даже если ключ утечёт — данные закрыты.
- **Запись запрещена всем** ролям `anon` и `authenticated`. Пишет только сервер
  через `service_role`, который обходит RLS.
- `service_role` key лежит только в `.env.local` и используется исключительно
  в серверном коде (`lib/supabase/client.ts`). Клиентского Supabase-клиента в проекте
  нет вообще — все чтения идут в серверных компонентах, все записи через route handlers.
- В коде нет переменной с префиксом `NEXT_PUBLIC_`, содержащей секрет.

## Bucket для файлов

Bucket `site-assets` создаётся в `0003_storage.sql`:

- публичный на чтение — картинки открываются по URL;
- лимит 10 МБ на файл, разрешены jpeg, png, webp, gif, avif и pdf;
- политик на загрузку нет, поэтому загружать может только сервер.

Структура папок внутри bucket'а: `profile/`, `projects/`, `notes/`, `homework/`.

## Перенос данных

```bash
npm run migrate -- --dry-run   # посмотреть, что будет перенесено
npm run migrate                # перенести
```

Скрипт читает `data/content.json`, раскладывает старые данные по новым таблицам
и создаёт строку профиля. Запускать повторно безопасно: таблицы очищаются перед вставкой.
