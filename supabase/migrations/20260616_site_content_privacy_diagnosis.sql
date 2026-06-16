-- site_content RLS 정책에 'privacy', 'diagnosis' id 허용 추가
-- (자기진단·개인정보처리방침 편집기 저장이 RLS에 막혀 안 되던 문제 해결)
-- Supabase SQL Editor에 그대로 붙여넣어 1회 실행하면 됩니다. 멱등(여러 번 실행해도 안전).

drop policy if exists "Anyone can read site content" on public.site_content;
create policy "Anyone can read site content"
  on public.site_content
  for select
  to anon, authenticated
  using (id in ('homepage', 'account', 'estimate', 'landing-pages', 'privacy', 'diagnosis'));

drop policy if exists "Admins can insert site content" on public.site_content;
create policy "Admins can insert site content"
  on public.site_content
  for insert
  to authenticated
  with check (
    id in ('homepage', 'account', 'estimate', 'landing-pages', 'privacy', 'diagnosis')
    and private.is_admin_user()
  );

drop policy if exists "Admins can update site content" on public.site_content;
create policy "Admins can update site content"
  on public.site_content
  for update
  to authenticated
  using (
    id in ('homepage', 'account', 'estimate', 'landing-pages', 'privacy', 'diagnosis')
    and private.is_admin_user()
  )
  with check (
    id in ('homepage', 'account', 'estimate', 'landing-pages', 'privacy', 'diagnosis')
    and private.is_admin_user()
  );

drop policy if exists "Admins can delete site content" on public.site_content;
create policy "Admins can delete site content"
  on public.site_content
  for delete
  to authenticated
  using (
    id in ('homepage', 'account', 'estimate', 'landing-pages', 'privacy', 'diagnosis')
    and private.is_admin_user()
  );
