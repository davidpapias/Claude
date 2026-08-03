-- 0008 — private photo storage.
--
-- Requires the Supabase storage schema (`supabase start` / hosted project).
-- The bucket is private: clients read photos through signed URLs only, so a
-- leaked path is not a leaked photo.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 8388608,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Object paths are `<user-id>/<uuid>.<ext>`: a user can only write inside their
-- own folder.
create policy "own folder insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own folder update" on storage.objects
  for update to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own folder delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Reading someone else's photo is never a direct object read: the app requests
-- a signed URL from the server after `get_public_profile` authorized the view.
create policy "own folder select" on storage.objects
  for select to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "staff select" on storage.objects
  for select to authenticated
  using (bucket_id = 'profile-photos' and is_staff('moderator'));
