-- Migration: Add Admin Policies for Products Management
-- Description: Adds RLS policies to allow authenticated users to update products

BEGIN;

-- ============================================
-- ADMIN POLICIES FOR PRODUCTS TABLE
-- ============================================

-- Allow authenticated users (admins) to update products
CREATE POLICY "Allow authenticated update products" 
ON products 
FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users (admins) to insert products
CREATE POLICY "Allow authenticated insert products" 
ON products 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users (admins) to delete products
CREATE POLICY "Allow authenticated delete products" 
ON products 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- ============================================
-- ADMIN POLICIES FOR CATEGORIES TABLE
-- ============================================

-- Allow authenticated users (admins) to manage categories
CREATE POLICY "Allow authenticated manage categories" 
ON categories 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- ADMIN POLICIES FOR PRODUCT_CATEGORIES TABLE
-- ============================================

-- Allow authenticated users (admins) to manage product categories
CREATE POLICY "Allow authenticated manage product_categories" 
ON product_categories 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- ADMIN POLICIES FOR ART_PRODUCTS TABLE
-- ============================================

-- Allow authenticated users (admins) to manage art products
CREATE POLICY "Allow authenticated manage art_products" 
ON art_products 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- ADMIN POLICIES FOR ROOMS TABLE
-- ============================================

-- Allow authenticated users (admins) to manage rooms
CREATE POLICY "Allow authenticated manage rooms" 
ON rooms 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- ADMIN POLICIES FOR ASPECT_RATIOS TABLE
-- ============================================

-- Allow authenticated users (admins) to manage aspect ratios
CREATE POLICY "Allow authenticated manage aspect_ratios" 
ON aspect_ratios 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- ADMIN POLICIES FOR SIZES TABLE
-- ============================================

-- Allow authenticated users (admins) to manage sizes
CREATE POLICY "Allow authenticated manage sizes" 
ON sizes 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all policies on products table
-- SELECT * FROM pg_policies WHERE tablename = 'products';

-- Test update as authenticated user (run after login)
-- UPDATE products SET config = '{"test": true}'::jsonb WHERE id = 'your-product-id';

