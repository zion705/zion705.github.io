create extension if not exists pgcrypto;

create table if not exists public.guestbook_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 24),
  message text not null check (char_length(trim(message)) between 1 and 180),
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists guestbook_messages_created_at_idx
  on public.guestbook_messages (created_at desc);

alter table public.guestbook_messages enable row level security;

drop policy if exists "Public can read visible guestbook messages"
  on public.guestbook_messages;
create policy "Public can read visible guestbook messages"
  on public.guestbook_messages
  for select
  to anon, authenticated
  using (is_visible = true);

drop policy if exists "Public can create guestbook messages"
  on public.guestbook_messages;
create policy "Public can create guestbook messages"
  on public.guestbook_messages
  for insert
  to anon, authenticated
  with check (
    is_visible = true
    and char_length(trim(name)) between 1 and 24
    and char_length(trim(message)) between 1 and 180
  );

revoke all on table public.guestbook_messages from anon, authenticated;
grant select on table public.guestbook_messages to anon, authenticated;
grant insert (name, message)
  on table public.guestbook_messages to anon, authenticated;
