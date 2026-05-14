-- Migration: Add storage policy for guest canvas uploads
-- Description: Allow anonymous users to upload canvas images to canvas-uploads folder
-- Required for: Single Canvas Creator (/customize/single-canvas)
-- Date: 2024-12-02

-- Allow public (guest) uploads to canvas-uploads folder ONLY
-- This enables the single canvas creator to work without authentication
DROP POLICY IF EXISTS "Allow public uploads to canvas-uploads folder" ON storage.objects;

CREATE POLICY "Allow public uploads to canvas-uploads folder"
ON storage.objects 
FOR INSERT 
TO anon
WITH CHECK (
  bucket_id = 'photify' 
  AND (storage.foldername(name))[1] = 'canvas-uploads'
);

-- Verify the policy was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public uploads to canvas-uploads folder'
  ) THEN
    RAISE NOTICE '✅ Canvas uploads policy created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create canvas uploads policy';
  END IF;
END $$;
