# 🗄️ Photify Migration Management Guide

Complete guide for managing database migrations in the Photify project.

---

## 📂 Current Structure

```
supabase/
├── migrations/
│   ├── README.md                           # Detailed migration index
│   ├── 001_initial_schema.sql             # Core tables & RLS
│   ├── 002_aspect_ratios_sizes_variants.sql # Product sizing
│   ├── 003_alter_products_config.sql      # Product configuration
│   ├── 004_product_categories_many_to_many.sql # Category relations
│   ├── 005_add_admin_policies.sql         # Admin RLS policies
│   ├── 006_add_product_seo_content.sql    # Product SEO
│   ├── 007_categories_complete.sql        # ✨ Categories (consolidated)
│   └── archive/
│       ├── README.md                       # Archive explanation
│       ├── 007_add_category_ordering.sql  # Archived (merged into 007)
│       ├── 008_add_category_images.sql    # Archived (merged into 007)
│       └── 009_add_category_seo.sql       # Archived (merged into 007)
│
├── seed-*.sql                              # Seed data files
├── setup-categories-complete.sql           # Complete category setup
└── add-category-seo-columns.sql           # Quick fixes
```

---

## 🎯 Migration Philosophy

### Core Principles

1. **Sequential Numbering** - Migrations are numbered 001, 002, 003...
2. **Idempotent** - Can be run multiple times safely (use `IF NOT EXISTS`)
3. **Documented** - Every migration has clear comments
4. **Consolidated** - Related changes to same table are merged
5. **Archived** - Old versions kept for reference, not execution

### When to Create New Migration

✅ **Create new migration when:**

- Adding new table
- Adding columns to different tables
- Adding indexes or constraints
- Modifying RLS policies
- Creating views or functions

❌ **Consolidate instead when:**

- Making 3+ changes to same table within short period
- Previous migration to same table is recent (< 1 week)
- Changes are all related to same feature
- Multiple incremental additions that should be one logical change

---

## 🔄 Migration Lifecycle

### 1. Creating New Migration

```sql
-- File: supabase/migrations/008_add_user_profiles.sql

-- Migration: Add User Profiles
-- Version: 008
-- Description: Adds user profile table with avatar and bio
-- Date: 2025-10-27
-- Author: [Your Name]

BEGIN;

-- ============================================
-- Create Table
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id
ON user_profiles(user_id);

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE user_profiles IS 'User profile information';
COMMENT ON COLUMN user_profiles.avatar_url IS 'URL to user avatar in Supabase Storage';

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
ON user_profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMIT;
```

### 2. Documenting Migration

Update `supabase/migrations/README.md`:

```markdown
### 008 - User Profiles

**Tables Created:**

- `user_profiles` - User profile information

**Changes:**

- Added display_name, avatar_url, bio fields
- RLS policies for public read, user update

**Purpose:**

- Enable user profile customization
- Avatar and bio functionality
```

### 3. Testing Migration

```sql
-- Test in Supabase SQL Editor
-- 1. Run the migration
-- 2. Verify table created:
SELECT * FROM information_schema.tables WHERE table_name = 'user_profiles';

-- 3. Test insert:
INSERT INTO user_profiles (user_id, display_name) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Test User');

-- 4. Verify RLS works:
-- Try selecting as anonymous user
```

### 4. Applying to Production

```bash
# Method 1: Supabase Dashboard
# Copy migration file → Paste in SQL Editor → Run

# Method 2: Supabase CLI (if installed)
supabase db push

# Method 3: Direct psql
psql -h YOUR_HOST -d YOUR_DB -f supabase/migrations/008_add_user_profiles.sql
```

---

## 🔀 Consolidation Process

### When to Consolidate

**Example Scenario:**
You created three migrations in one week:

- `007_add_category_ordering.sql` (Monday)
- `008_add_category_images.sql` (Wednesday)
- `009_add_category_seo.sql` (Friday)

All modify the `categories` table → **Time to consolidate!**

### Consolidation Steps

#### Step 1: Create New Consolidated Migration

```sql
-- File: 007_categories_complete.sql
-- Consolidates: 007, 008, 009

BEGIN;

-- All changes in one place
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS display_order INTEGER,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS seo_title TEXT;
-- ... rest of columns

COMMIT;
```

#### Step 2: Archive Old Migrations

```bash
# Create archive folder if doesn't exist
mkdir -p supabase/migrations/archive

# Move old migrations
mv supabase/migrations/007_add_category_ordering.sql supabase/migrations/archive/
mv supabase/migrations/008_add_category_images.sql supabase/migrations/archive/
mv supabase/migrations/009_add_category_seo.sql supabase/migrations/archive/
```

#### Step 3: Document Archive

Create `supabase/migrations/archive/README.md`:

```markdown
# Archived Migrations

## Categories Migrations (Consolidated into 007)

- `007_add_category_ordering.sql` → `007_categories_complete.sql`
- `008_add_category_images.sql` → `007_categories_complete.sql`
- `009_add_category_seo.sql` → `007_categories_complete.sql`

**Archived:** 2025-10-27
**Reason:** Multiple incremental changes to same table
```

#### Step 4: Update Migration Index

Update `supabase/migrations/README.md` with new consolidated migration.

#### Step 5: Test Consolidated Migration

```sql
-- On fresh database, run:
-- 001, 002, 003, 004, 005, 006, 007_categories_complete

-- Verify all columns exist:
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;
```

---

## 📊 Migration Checklist

### Before Creating Migration

- [ ] Check if similar changes were made recently
- [ ] Consider consolidating with recent migrations
- [ ] Review existing table structure
- [ ] Plan indexes and constraints
- [ ] Design RLS policies

### When Writing Migration

- [ ] Use sequential numbering
- [ ] Add descriptive header comments
- [ ] Wrap in BEGIN/COMMIT transaction
- [ ] Use `IF NOT EXISTS` for idempotency
- [ ] Add column comments with `COMMENT ON`
- [ ] Create appropriate indexes
- [ ] Set up RLS policies
- [ ] Grant necessary permissions

### After Writing Migration

- [ ] Test on local/staging database first
- [ ] Verify idempotency (run twice)
- [ ] Check RLS policies work correctly
- [ ] Update `migrations/README.md`
- [ ] Update `.cursor/rules/` files if new patterns established
- [ ] Commit migration file to git

### For Consolidation

- [ ] Create new consolidated migration
- [ ] Test consolidated version thoroughly
- [ ] Move old migrations to `archive/`
- [ ] Create/update `archive/README.md`
- [ ] Update main `migrations/README.md`
- [ ] Update `.cursor/rules/` files if patterns changed
- [ ] Commit all changes

---

## 🛠️ Common Patterns

### Adding Column to Existing Table

```sql
BEGIN;

ALTER TABLE table_name
ADD COLUMN IF NOT EXISTS column_name TYPE DEFAULT value;

COMMENT ON COLUMN table_name.column_name IS 'Description';

CREATE INDEX IF NOT EXISTS idx_table_column
ON table_name(column_name);

COMMIT;
```

### Creating New Table with RLS

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS table_name (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
ON table_name FOR SELECT
USING (true);

CREATE POLICY "Authenticated write access"
ON table_name FOR INSERT
TO authenticated
WITH CHECK (true);

COMMIT;
```

### Adding Junction Table (Many-to-Many)

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS table1_table2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table1_id UUID NOT NULL REFERENCES table1(id) ON DELETE CASCADE,
    table2_id UUID NOT NULL REFERENCES table2(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(table1_id, table2_id)
);

CREATE INDEX IF NOT EXISTS idx_table1_table2_table1
ON table1_table2(table1_id);

CREATE INDEX IF NOT EXISTS idx_table1_table2_table2
ON table1_table2(table2_id);

ALTER TABLE table1_table2 ENABLE ROW LEVEL SECURITY;

COMMIT;
```

### Creating View

```sql
BEGIN;

CREATE OR REPLACE VIEW v_view_name AS
SELECT
  t1.id,
  t1.name,
  COUNT(t2.id) as count
FROM table1 t1
LEFT JOIN table2 t2 ON t1.id = t2.table1_id
GROUP BY t1.id;

GRANT SELECT ON v_view_name TO authenticated, anon;

COMMIT;
```

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't Do This

```sql
-- No transaction
ALTER TABLE products ADD COLUMN price DECIMAL;

-- Not idempotent
CREATE TABLE categories (...);

-- No comments
ALTER TABLE users ADD COLUMN status TEXT;

-- Forgetting RLS
CREATE TABLE sensitive_data (...);
-- Missing: ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;

-- No indexes
ALTER TABLE products ADD COLUMN category_id UUID;
-- Missing: CREATE INDEX idx_products_category ON products(category_id);
```

### ✅ Do This Instead

```sql
BEGIN;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.00;

COMMENT ON COLUMN products.price IS 'Product price per square inch';

CREATE INDEX IF NOT EXISTS idx_products_price
ON products(price);

COMMIT;
```

---

## 📈 Migration Strategy

### For Development

1. Create migrations as needed
2. Test locally with `supabase db reset`
3. Keep migrations small and focused
4. Consolidate before merging to main

### For Staging

1. Apply migrations in order
2. Test with production-like data
3. Verify performance with indexes
4. Check RLS policies thoroughly

### For Production

1. **Always backup first!**
2. Apply during low-traffic window
3. Monitor for errors
4. Have rollback plan ready
5. Test critical features after migration

---

## 🔍 Verification Queries

### Check All Tables

```sql
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Check Table Columns

```sql
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'your_table'
ORDER BY ordinal_position;
```

### Check Indexes

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Check RLS Policies

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Check Views

```sql
SELECT
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;
```

---

## 📞 Troubleshooting

### Migration Failed Mid-way

```sql
-- Check current state
SELECT * FROM information_schema.tables WHERE table_name = 'your_table';

-- Rollback if in transaction
ROLLBACK;

-- Or manually undo changes
ALTER TABLE your_table DROP COLUMN IF EXISTS problematic_column;
```

### Column Already Exists Error

**Solution:** Always use `IF NOT EXISTS`:

```sql
ALTER TABLE table_name
ADD COLUMN IF NOT EXISTS column_name TYPE;
```

### RLS Blocking Access

```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Temporarily disable RLS for debugging (local only!)
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;

-- Remember to re-enable after fixing
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

### Index Creation Slow

```sql
-- Create index concurrently (doesn't lock table)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_name ON table(column);
```

---

## 🎯 Quick Reference

**Current migration number:** 007  
**Next migration number:** 008  
**Last consolidated:** 007_categories_complete.sql  
**Archive folder:** `supabase/migrations/archive/`

**Key Files:**

- `supabase/migrations/README.md` - Full migration index
- `supabase/migrations/archive/README.md` - Archive explanation
- `.cursorrules` - Master rules file
- `.cursor/rules/database-workflows.mdc` - Database development patterns

---

**For questions or issues:** Check the migration README or archived files for reference.
