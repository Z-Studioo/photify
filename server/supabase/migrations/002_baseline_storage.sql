-- Migration: Photify storage bucket + RLS policies (baseline)
-- Version: 002
-- Description: Provisions the `photify` storage bucket and the RLS policies
--              on `storage.objects` that the app relies on. This is the only
--              project-specific bit of the `storage` schema; everything else
--              in `storage` is managed by Supabase itself.
-- Date: 2026-05-14
--
-- NOTE: This file deliberately does NOT redefine the `storage` schema,
-- functions, or tables — those are provisioned by Supabase. We only own
-- the bucket row and our custom policies on `storage.objects`.

BEGIN;

-- ============================================================================
-- 1. Create the photify bucket (idempotent)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photify',
  'photify',
  true,
  52428800, -- 50 MB per object
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 2. RLS policies on storage.objects for the photify bucket
-- ============================================================================
-- Drop-and-recreate pattern for idempotency.

DROP POLICY IF EXISTS "Allow public reads from photify" ON storage.objects;
CREATE POLICY "Allow public reads from photify"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photify');

DROP POLICY IF EXISTS "Public read access for photify bucket" ON storage.objects;
CREATE POLICY "Public read access for photify bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photify');

DROP POLICY IF EXISTS "Allow public uploads to photify" ON storage.objects;
CREATE POLICY "Allow public uploads to photify"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photify');

DROP POLICY IF EXISTS "Allow public uploads to collages folder" ON storage.objects;
CREATE POLICY "Allow public uploads to collages folder"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'photify'
    AND (storage.foldername(name))[1] = 'collages'
  );

DROP POLICY IF EXISTS "Allow public uploads to multi-canvas-uploads folder" ON storage.objects;
CREATE POLICY "Allow public uploads to multi-canvas-uploads folder"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'photify'
    AND (storage.foldername(name))[1] = 'multi-canvas-uploads'
  );

DROP POLICY IF EXISTS "Allow public updates to photify" ON storage.objects;
CREATE POLICY "Allow public updates to photify"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'photify')
  WITH CHECK (bucket_id = 'photify');

DROP POLICY IF EXISTS "Authenticated users can upload to photify" ON storage.objects;
CREATE POLICY "Authenticated users can upload to photify"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'photify');

DROP POLICY IF EXISTS "Authenticated users can update photify" ON storage.objects;
CREATE POLICY "Authenticated users can update photify"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'photify')
  WITH CHECK (bucket_id = 'photify');

DROP POLICY IF EXISTS "Authenticated users can delete from photify" ON storage.objects;
CREATE POLICY "Authenticated users can delete from photify"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'photify');

COMMIT;
