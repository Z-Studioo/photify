-- Migration: Add storage policy for guest collage uploads
-- Created: 2024
-- Description: Allow anonymous users to upload collage images to photify/collages/ folder

-- This policy is REQUIRED for the Photo Collage Creator to work for guest users
-- Without this, guests will get "Failed to upload collage" errors

BEGIN;

-- Allow public (anonymous/guest) uploads to collages folder ONLY
-- This is secure because:
-- 1. Only applies to the collages folder (not categories, products, etc.)
-- 2. Users can still only read their own collages via the public URL
-- 3. Old collages can be cleaned up via a cron job if needed

DROP POLICY IF EXISTS "Allow public uploads to collages folder" ON storage.objects;

CREATE POLICY "Allow public uploads to collages folder"
ON storage.objects 
FOR INSERT 
TO anon
WITH CHECK (
  bucket_id = 'photify' 
  AND (storage.foldername(name))[1] = 'collages'
);

COMMIT;

-- Verify the policy was created
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname = 'Allow public uploads to collages folder';

