-- Migration: Create photify storage bucket with all required folders
-- Description: Provisions the `photify` storage bucket, seeds placeholder
--              objects so each folder is visible in the Supabase dashboard,
--              and sets up read/write RLS policies.
-- Date: 2026-05-13
--
-- Folders created:
--   public/             -- Public site assets (logo, favicon, etc.)
--   products/           -- Admin: product images
--   categories/         -- Admin: category images
--   rooms/              -- Admin: room images
--   room-backgrounds/   -- Admin: room backgrounds for customizer
--   featured-products/  -- Admin: featured product images
--   art-products/       -- Admin: art product images & size variants
--   canvas-uploads/     -- Guest: single canvas customer uploads
--   poster-uploads/     -- Guest: event canvas/poster uploads
--   collages/           -- Guest: generated collage images
--   cart-images/        -- Guest: cart preview images

BEGIN;

-- ============================================================================
-- 1. Create the bucket (public read access)
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
-- 2. Seed placeholder objects so each folder shows up in the dashboard
--    (Supabase storage folders are virtual; they only exist when an object
--     with that prefix exists.)
-- ============================================================================

INSERT INTO storage.objects (bucket_id, name, owner, metadata)
SELECT
  'photify',
  folder || '/.keep',
  NULL,
  jsonb_build_object(
    'mimetype', 'text/plain',
    'size', 0,
    'cacheControl', 'no-cache'
  )
FROM (
  VALUES
    ('public'),
    ('products'),
    ('categories'),
    ('rooms'),
    ('room-backgrounds'),
    ('featured-products'),
    ('art-products'),
    ('canvas-uploads'),
    ('poster-uploads'),
    ('collages'),
    ('cart-images')
) AS f(folder)
ON CONFLICT (bucket_id, name) DO NOTHING;

-- ============================================================================
-- 3. RLS policies
-- ============================================================================

-- Public read access for every object in the bucket
DROP POLICY IF EXISTS "Public read access for photify bucket" ON storage.objects;
CREATE POLICY "Public read access for photify bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'photify');

-- Authenticated users (admins) can manage every folder
DROP POLICY IF EXISTS "Authenticated users can upload to photify" ON storage.objects;
CREATE POLICY "Authenticated users can upload to photify"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photify');

DROP POLICY IF EXISTS "Authenticated users can update photify objects" ON storage.objects;
CREATE POLICY "Authenticated users can update photify objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'photify')
WITH CHECK (bucket_id = 'photify');

DROP POLICY IF EXISTS "Authenticated users can delete photify objects" ON storage.objects;
CREATE POLICY "Authenticated users can delete photify objects"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'photify');

-- Guest (anonymous) uploads, restricted to specific customer-facing folders.
-- NOTE: collages/ and canvas-uploads/ already have policies in migrations
-- 027 and 028. We re-create them here idempotently so a fresh DB has them all.

DROP POLICY IF EXISTS "Allow public uploads to collages folder" ON storage.objects;
CREATE POLICY "Allow public uploads to collages folder"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'photify'
  AND (storage.foldername(name))[1] = 'collages'
);

DROP POLICY IF EXISTS "Allow public uploads to canvas-uploads folder" ON storage.objects;
CREATE POLICY "Allow public uploads to canvas-uploads folder"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'photify'
  AND (storage.foldername(name))[1] = 'canvas-uploads'
);

DROP POLICY IF EXISTS "Allow public uploads to poster-uploads folder" ON storage.objects;
CREATE POLICY "Allow public uploads to poster-uploads folder"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'photify'
  AND (storage.foldername(name))[1] = 'poster-uploads'
);

DROP POLICY IF EXISTS "Allow public uploads to cart-images folder" ON storage.objects;
CREATE POLICY "Allow public uploads to cart-images folder"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'photify'
  AND (storage.foldername(name))[1] = 'cart-images'
);

COMMIT;

-- ============================================================================
-- 4. Verification
-- ============================================================================

DO $$
DECLARE
  v_folder_count INT;
  v_policy_count INT;
BEGIN
  SELECT COUNT(*) INTO v_folder_count
  FROM storage.objects
  WHERE bucket_id = 'photify' AND name LIKE '%/.keep';

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname IN (
      'Public read access for photify bucket',
      'Authenticated users can upload to photify',
      'Authenticated users can update photify objects',
      'Authenticated users can delete photify objects',
      'Allow public uploads to collages folder',
      'Allow public uploads to canvas-uploads folder',
      'Allow public uploads to poster-uploads folder',
      'Allow public uploads to cart-images folder'
    );

  RAISE NOTICE 'photify bucket: % folders seeded, % policies active', v_folder_count, v_policy_count;

  IF v_folder_count < 11 THEN
    RAISE WARNING 'Expected 11 folder placeholders, found %', v_folder_count;
  END IF;

  IF v_policy_count < 8 THEN
    RAISE WARNING 'Expected 8 policies, found %', v_policy_count;
  END IF;
END $$;
