-- site_content RLS 정책에 'site-settings' id 허용 추가
-- (관리자 '사이트 설정'의 영업 정보·대표 자격증 저장이 RLS에 막히지 않도록)
-- Supabase SQL Editor에 붙여넣어 1회 실행하면 됩니다. 멱등(여러 번 실행해도 안전).

drop policy if exists "Anyone can read site content" on public.site_content;
create policy "Anyone can read site content"
  on public.site_content
  for select
  to anon, authenticated
  using (id in ('homepage', 'account', 'estimate', 'landing-pages', 'privacy', 'diagnosis', 'site-settings'));

drop policy if exists "Admins can insert site content" on public.site_content;
create policy "Admins can insert site content"
  on public.site_content
  for insert
  to authenticated
  with check (
    id in ('homepage', 'account', 'estimate', 'landing-pages', 'privacy', 'diagnosis', 'site-settings')
    and private.is_admin_user()
  );

drop policy if exists "Admins can update site content" on public.site_content;
create policy "Admins can update site content"
  on public.site_content
  for update
  to authenticated
  using (
    id in ('homepage', 'account', 'estimate', 'landing-pages', 'privacy', 'diagnosis', 'site-settings')
    and private.is_admin_user()
  )
  with check (
    id in ('homepage', 'account', 'estimate', 'landing-pages', 'privacy', 'diagnosis', 'site-settings')
    and private.is_admin_user()
  );

drop policy if exists "Admins can delete site content" on public.site_content;
create policy "Admins can delete site content"
  on public.site_content
  for delete
  to authenticated
  using (
    id in ('homepage', 'account', 'estimate', 'landing-pages', 'privacy', 'diagnosis', 'site-settings')
    and private.is_admin_user()
  );
