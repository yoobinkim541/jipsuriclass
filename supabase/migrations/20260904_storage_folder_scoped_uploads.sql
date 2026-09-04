-- jipsuri-media 버킷 업로드 정책을 폴더별로 분리한다.
-- 기존 정책은 bucket_id만 검사해 inquiries/(고객 공개 업로드, 익명 허용 의도)와
-- homepage/·cases/(관리자 전용 편집 업로드)가 동일 권한이었다 — 로그인 없이도
-- storage API를 직접 호출하면 관리자 전용 폴더에도 업로드가 가능했다.
-- Supabase SQL Editor에 붙여넣어 1회 실행하면 됩니다. 멱등(여러 번 실행해도 안전).

drop policy if exists "Anyone can upload jipsuri media" on storage.objects;

drop policy if exists "Anyone can upload inquiry attachments" on storage.objects;
create policy "Anyone can upload inquiry attachments"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'jipsuri-media'
    and (storage.foldername(name))[1] = 'inquiries'
  );

drop policy if exists "Admins can upload site media" on storage.objects;
create policy "Admins can upload site media"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'jipsuri-media'
    and (storage.foldername(name))[1] in ('homepage', 'cases')
    and private.is_admin_user()
  );
