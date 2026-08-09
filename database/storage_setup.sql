-- ============================================================
-- Supabase Storage buckets (run after creating buckets in Dashboard)
-- Dashboard > Storage > New Bucket, then run these policies here.
-- Free tier = 1GB storage, 2GB bandwidth/month — fine for documents/photos.
-- ============================================================

-- Create these buckets in the Supabase Dashboard UI (Storage tab):
--   1. avatars        (public)   -- profile photos
--   2. documents       (private) -- circulars, labour law PDFs, minutes
--   3. receipts        (private) -- finance receipts
--   4. complaint-files (private) -- complaint attachments
--   5. salary-slips    (private) -- salary slip PDFs

-- Example policies (repeat pattern per bucket, adjust bucket_id):

-- Public read for avatars, owner can upload/update their own
create policy "avatar_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatar_owner_write" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatar_owner_update" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Documents bucket: any logged-in user can read, only admins can write
create policy "documents_bucket_read" on storage.objects
  for select using (bucket_id = 'documents' and auth.uid() is not null);

create policy "documents_bucket_admin_write" on storage.objects
  for insert with check (bucket_id = 'documents' and is_admin());

-- Complaint files: uploader (folder = their uid) or admin can read
create policy "complaint_files_read" on storage.objects
  for select using (
    bucket_id = 'complaint-files' and
    (auth.uid()::text = (storage.foldername(name))[1] or is_admin())
  );
create policy "complaint_files_write" on storage.objects
  for insert with check (
    bucket_id = 'complaint-files' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Receipts & salary slips: admin only read/write, except employee reads own salary slip
create policy "receipts_admin_only" on storage.objects
  for all using (bucket_id = 'receipts' and is_admin()) with check (bucket_id = 'receipts' and is_admin());

create policy "salary_slip_owner_or_admin_read" on storage.objects
  for select using (
    bucket_id = 'salary-slips' and
    (auth.uid()::text = (storage.foldername(name))[1] or is_admin())
  );
create policy "salary_slip_admin_write" on storage.objects
  for insert with check (bucket_id = 'salary-slips' and is_admin());

-- Recommended folder convention when uploading from the app:
--   avatars/{member_id}/photo.jpg
--   documents/{category}/{filename}.pdf
--   complaint-files/{member_id}/{ticket_no}/{filename}
--   receipts/{transaction_id}/{filename}
--   salary-slips/{member_id}/{year}-{month}.pdf
