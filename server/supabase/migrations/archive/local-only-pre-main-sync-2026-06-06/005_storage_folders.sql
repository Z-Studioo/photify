-- Migration: Photify storage bucket + RLS policies + folder scaffolding
-- Version: 005
-- Description: Self-contained, idempotent provisioning of the `photify` storage
--              bucket, the RLS policies on `storage.objects` that uploads/reads
--              depend on, and placeholders for every folder the app uses.
--
--              Supabase Storage has no real folder concept — "folders" are just
--              path prefixes on objects in `storage.objects`. To make a folder
--              appear (in the dashboard and for `list()` calls) before any real
--              file lands in it, we insert a zero-byte placeholder object named
--              `.emptyFolderPlaceholder` (Supabase's own convention) at each
--              prefix.
-- Date: 2026-06-03
--
-- WHY THE POLICIES ARE REPEATED HERE (also in 002_baseline_storage.sql):
--   The "new row violates row-level security policy" upload error happens in any
--   environment where the storage policies were never applied (e.g. a fresh
--   `supabase db reset` or a new project). Re-declaring them here with a
--   drop-and-recreate pattern makes this migration fix that on its own.
--
-- NOTE: This does NOT redefine the `storage` schema/functions/tables — those are
-- owned by Supabase. We only own the bucket row, our policies, and our objects.

BEGIN;

-- ============================================================================
-- 1. Ensure the photify bucket exists (idempotent)
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
-- 2. RLS policies on storage.objects for the photify bucket (idempotent)
-- ============================================================================
-- These mirror 002_baseline_storage.sql. The broad public INSERT/UPDATE/SELECT
-- policies are what let both anonymous customers (configurators, cart) and the
-- admin UI upload into the bucket.

-- Public read (anyone can view objects in a public bucket).
DROP POLICY IF EXISTS "Public read access for photify bucket" ON storage.objects;
CREATE POLICY "Public read access for photify bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photify');

-- Public (anon + authenticated) uploads anywhere in the bucket.
DROP POLICY IF EXISTS "Allow public uploads to photify" ON storage.objects;
CREATE POLICY "Allow public uploads to photify"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photify');

-- Public updates (needed for `upsert: true` overwrites).
DROP POLICY IF EXISTS "Allow public updates to photify" ON storage.objects;
CREATE POLICY "Allow public updates to photify"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'photify')
  WITH CHECK (bucket_id = 'photify');

-- Authenticated (admin) deletes.
DROP POLICY IF EXISTS "Authenticated users can delete from photify" ON storage.objects;
CREATE POLICY "Authenticated users can delete from photify"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'photify');

-- ============================================================================
-- 3. Materialize the folders used by the app
-- ============================================================================
-- Each entry becomes `<folder>/.emptyFolderPlaceholder` in the photify bucket.
-- WHERE NOT EXISTS keeps this safe to re-run (no duplicate placeholder rows).

DO $$
DECLARE
  v_bucket text := 'photify';
  v_placeholder text := '.emptyFolderPlaceholder';
  v_folder text;
  -- Folders the app writes to. Keep this list in sync with the upload call
  -- sites in app/src (storage.ts + admin editors + product configurators).
  v_folders text[] := ARRAY[
    -- Admin / authenticated uploads
    'products',
    'categories',
    'rooms',
    'room-backgrounds',
    'featured-products',
    'art-products',
    'art-product-mockups',
    -- Public / anonymous uploads (customer-facing configurators & cart)
    'collages',
    'multi-canvas-uploads',
    'poster-uploads',
    'canvas-uploads',
    'cart-images'
  ];
BEGIN
  FOREACH v_folder IN ARRAY v_folders
  LOOP
    INSERT INTO storage.objects (bucket_id, name, owner, metadata)
    SELECT
      v_bucket,
      v_folder || '/' || v_placeholder,
      NULL,
      jsonb_build_object(
        'mimetype', 'application/octet-stream',
        'size', 0,
        'cacheControl', 'no-cache'
      )
    WHERE NOT EXISTS (
      SELECT 1
      FROM storage.objects o
      WHERE o.bucket_id = v_bucket
        AND o.name = v_folder || '/' || v_placeholder
    );
  END LOOP;
END $$;

COMMIT;
