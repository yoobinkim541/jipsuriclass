-- 집수리 클라쓰 초기 Supabase 스키마
-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  service_area text,
  message text not null,
  attachments jsonb not null default '[]'::jsonb,
  intake jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  source text not null default 'website',
  user_id uuid,
  user_email text,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.inquiries is '웹사이트 간단 견적 문의';
comment on column public.inquiries.service_area is '고객이 입력한 지역. area는 Postgres 타입/함수와 혼동될 수 있어 service_area를 사용한다.';
comment on column public.inquiries.attachments is '견적 문의에 첨부된 사진 메타데이터';
comment on column public.inquiries.intake is '견적 설문에서 선택한 집 환경, 공사 유형, 예산, 상담 시간 등의 메타데이터';
comment on column public.inquiries.user_id is 'Supabase Auth user id';
comment on column public.inquiries.user_email is 'Supabase Auth email';
comment on column public.inquiries.notified_at is '관리자 알림 전송 시각';

alter table public.inquiries enable row level security;

create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is '관리자 로그인 allowlist';
alter table public.admin_users enable row level security;
grant select on public.admin_users to authenticated;

drop policy if exists "Authenticated users can read their admin row" on public.admin_users;
create policy "Authenticated users can read their admin row"
  on public.admin_users
  for select
  to authenticated
  using (email = (auth.jwt() ->> 'email'));

create schema if not exists private;

create or replace function private.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.admin_users
    where email = (auth.jwt() ->> 'email')
  );
$$;

revoke all on function private.is_admin_user() from public;
grant execute on function private.is_admin_user() to authenticated;

-- 방문자는 문의를 새로 남길 수만 있습니다. 조회/수정/삭제는 관리자 기능을 만들 때 별도 정책으로 추가합니다.
drop policy if exists "Anyone can create website inquiries" on public.inquiries;
create policy "Anyone can create website inquiries"
  on public.inquiries
  for insert
  to anon
  with check (
    source = 'website'
    and status = 'new'
    and length(trim(name)) between 1 and 80
    and length(trim(phone)) between 7 and 30
    and length(trim(message)) between 1 and 2000
  );

grant insert on public.inquiries to anon;
grant insert on public.inquiries to authenticated;
grant select, update on public.inquiries to authenticated;

drop policy if exists "Logged in users can create their inquiries" on public.inquiries;
create policy "Logged in users can create their inquiries"
  on public.inquiries
  for insert
  to authenticated
  with check (
    source = 'website'
    and status = 'new'
    and user_id = auth.uid()
    and length(trim(name)) between 1 and 80
    and length(trim(phone)) between 7 and 30
    and length(trim(message)) between 1 and 2000
  );

drop policy if exists "Admins can read inquiries" on public.inquiries;
create policy "Admins can read inquiries"
  on public.inquiries
  for select
  to authenticated
  using (private.is_admin_user());

drop policy if exists "Customers can read own inquiries" on public.inquiries;
create policy "Customers can read own inquiries"
  on public.inquiries
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Admins can update inquiries" on public.inquiries;
create policy "Admins can update inquiries"
  on public.inquiries
  for update
  to authenticated
  using (private.is_admin_user())
  with check (private.is_admin_user());

drop policy if exists "Customers can update own inquiries" on public.inquiries;
create policy "Customers can update own inquiries"
  on public.inquiries
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiries_notified_at_idx on public.inquiries (notified_at desc);
create index if not exists inquiries_user_id_idx on public.inquiries (user_id);

insert into storage.buckets (id, name, public)
values ('jipsuri-media', 'jipsuri-media', true)
on conflict (id) do update set public = excluded.public;

alter table storage.objects enable row level security;
drop policy if exists "Anyone can upload jipsuri media" on storage.objects;
create policy "Anyone can upload jipsuri media"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'jipsuri-media');
