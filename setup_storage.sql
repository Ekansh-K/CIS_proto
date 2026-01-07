-- 1. Create the storage bucket 'event_poster' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('event_poster', 'event_poster', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on objects (it usually is by default, but good to ensure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for the 'event_poster' bucket

-- Allow public read access (required for displaying images)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'event_poster' );

-- Allow authenticated users (Admin) to upload files
CREATE POLICY "Authenticated can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'event_poster' );

-- Allow authenticated users (Admin) to update files
CREATE POLICY "Authenticated can update"
ON storage.objects FOR UPDATE
TO authenticated
WITH CHECK ( bucket_id = 'event_poster' );

-- Allow authenticated users (Admin) to delete files
CREATE POLICY "Authenticated can delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'event_poster' );
