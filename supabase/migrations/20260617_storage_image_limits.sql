-- jipsuri-media 스토리지 버킷에 이미지 전용 + 10MB 상한 적용
-- (익명 업로드가 임의 파일 타입/대용량을 올리지 못하도록 제한)
-- Supabase SQL Editor에 붙여넣어 1회 실행. 멱등.

update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
where id = 'jipsuri-media';
