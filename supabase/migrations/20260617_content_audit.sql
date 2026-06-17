-- 편집 이력(content_audit) 테이블 + RLS
-- 관리자 편집기에서 콘텐츠를 저장할 때마다 한 줄씩 기록된다(편집 이력 탭).
-- Supabase SQL Editor에 붙여넣어 1회 실행. 멱등(여러 번 실행해도 안전).

create table if not exists public.content_audit (
  id uuid primary key default gen_random_uuid(),
  content_id text not null,
  label text,
  actor_email text,
  created_at timestamptz not null default now()
);

comment on table public.content_audit is '관리자 콘텐츠 편집 이력(편집 이력 탭)';
alter table public.content_audit enable row level security;
grant select, insert on public.content_audit to authenticated;

create index if not exists content_audit_created_at_idx on public.content_audit (created_at desc);

drop policy if exists "Admins can read content audit" on public.content_audit;
create policy "Admins can read content audit"
  on public.content_audit
  for select
  to authenticated
  using (private.is_admin_user());

drop policy if exists "Admins can insert content audit" on public.content_audit;
create policy "Admins can insert content audit"
  on public.content_audit
  for insert
  to authenticated
  with check (private.is_admin_user());
