-- site_content RLS 정책에 'blog-snapshot' id 허용 추가
-- (블로그 글 DB 스냅샷 저장/조회가 RLS에 막히지 않도록)
-- Supabase SQL Editor에 붙여넣어 1회 실행. 멱등.

drop policy if exists "Anyone can read site content" on public.site_content;
create policy "Anyone can read site content"
  on public.site_content
  for select
  to anon, authenticated
  using (id in ('homepage', 'account', 'estimate', 'landing-pages', 'privacy', 'diagnosis', 'site-settings', 'blog-snapshot'));

drop policy if exists "Admins can insert site content" on public.site_content;
create policy "Admins can insert site content"
  on public.site_content
  for insert
  to authenticated
  with check (
    id in ('homepage', 'account', 'estimate', 'landing-pages', 'privacy', 'diagnosis', 'site-settings', 'blog-snapshot')
    and private.is_admin_user()
  );

drop policy if exists "Admins can update site content" on public.site_content;
create policy "Admins can update site content"
  on public.site_content
  for update
  to authenticated
  using (
    id in ('homepage', 'account', 'estimate', 'landing-pages', 'privacy', 'diagnosis', 'site-settings', 'blog-snapshot')
    and private.is_admin_user()
  )
  with check (
    id in ('homepage', 'account', 'estimate', 'landing-pages', 'privacy', 'diagnosis', 'site-settings', 'blog-snapshot')
    and private.is_admin_user()
  );

drop policy if exists "Admins can delete site content" on public.site_content;
create policy "Admins can delete site content"
  on public.site_content
  for delete
  to authenticated
  using (
    id in ('homepage', 'account', 'estimate', 'landing-pages', 'privacy', 'diagnosis', 'site-settings', 'blog-snapshot')
    and private.is_admin_user()
  );
