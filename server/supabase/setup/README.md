# Photify Setup Scripts

This folder contains **complete setup scripts** that combine migrations + seed data for quick database initialization.

---

## 📋 Setup Scripts

| File                            | Purpose                      | What It Includes                       | Use Case             |
| ------------------------------- | ---------------------------- | -------------------------------------- | -------------------- |
| `setup-categories.sql`          | Basic category setup         | Migration 007 + Basic seeds            | Quick category setup |
| `setup-categories-complete.sql` | **Complete category system** | Migration 007 + Images + Views + Seeds | ⭐ Recommended       |

---

## 🎯 What Are Setup Scripts?

Setup scripts are **all-in-one** files that include:

- ✅ Migration SQL (ALTER TABLE, CREATE INDEX, etc.)
- ✅ Seed data (INSERT statements)
- ✅ Helper functions
- ✅ Views
- ✅ Verification queries

**Benefit:** Run one file instead of multiple migrations + seeds.

**Use When:**

- Setting up fresh database
- Resetting specific feature
- Quick testing
- Onboarding new developers

---

## 📖 Setup Scripts Details

### 1. `setup-categories.sql` - Basic Setup

**What it does:**

```
1. Adds display_order, bg_color, is_active columns to categories
2. Creates index on display_order
3. Sets up RLS policies for admin
4. Seeds 8 basic categories with icons
```

**When to use:**

- Quick category setup
- Don't need images or views
- Testing category ordering

**Includes:**

- Migration 007 (partial - ordering only)
- Basic category seeds (no images)

**Run:**

```sql
-- In Supabase SQL Editor
-- Copy and paste entire file
-- Click Run
```

**Result:**

- 8 categories with display order
- Background colors
- Icons (Lucide icon names)
- No images, no views

---

### 2. `setup-categories-complete.sql` ⭐ **Recommended**

**What it does:**

```
1. Adds ALL category columns (ordering, images, SEO)
2. Creates indexes (3 indexes)
3. Sets up RLS policies (4 policies)
4. Creates get_category_products() function
5. Creates v_categories_with_counts view
6. Seeds 8 categories with Unsplash images
7. Creates product_categories junction table (if missing)
8. Includes verification queries
```

**When to use:**

- **Recommended** for complete setup
- Fresh database initialization
- Want full category system working
- Testing all category features

**Includes:**

- Migration 007 (complete)
- Categories with images seed
- Product association setup
- Helper functions and views

**Run:**

```sql
-- In Supabase SQL Editor
-- Copy and paste entire file
-- Click Run (takes ~5-10 seconds)
```

**Result:**

- 8 categories with images
- Display ordering (drag-and-drop ready)
- Background colors
- Icons
- SEO fields (empty, can be filled via admin)
- Product count views
- Product association function

**Verification:**

```sql
-- Included at end of script
SELECT
  name,
  slug,
  has_image,
  display_order,
  is_active,
  product_count
FROM v_categories_with_counts
ORDER BY display_order;
```

---

## 🚀 Usage Guide

### Scenario 1: Fresh Database

```bash
# Step 1: Apply core migrations first
# Run migrations 001-006 in order

# Step 2: Run complete category setup
# In Supabase SQL Editor:
# - Open setup-categories-complete.sql
# - Copy entire contents
# - Paste in SQL Editor
# - Click Run

# Step 3: Apply other seeds
# Run seed-aspect-ratios.sql
# Run seed-products.sql
```

### Scenario 2: Existing Database (Add Categories)

```bash
# If you have existing database without category features:

# Option A: Basic setup only
# Run setup-categories.sql

# Option B: Complete setup (recommended)
# Run setup-categories-complete.sql
```

### Scenario 3: Reset Categories Only

```bash
# WARNING: This will delete all categories!

# Run setup-categories-complete.sql
# It includes TRUNCATE TABLE categories CASCADE
# This will clear and reseed all categories
```

---

## ⚠️ Important Warnings

### `setup-categories-complete.sql`

**⚠️ TRUNCATE WARNING:**

```sql
-- This script includes:
TRUNCATE TABLE categories CASCADE;

-- This will:
-- ❌ Delete all existing categories
-- ❌ Delete all product-category associations
-- ✅ Reseed with 8 default categories
```

**Before running:**

1. Backup important category data
2. Make sure you want to reset categories
3. Understand product associations will be lost

**After running:**

- You'll need to reassociate products with categories
- Can be done via admin panel
- Or manually via product_categories table

---

## 🔄 Setup Script vs Migration + Seed

### Option 1: Individual Files (More Control)

```bash
# Migrations first
supabase/migrations/007_categories_complete.sql

# Then seeds
supabase/seeds/seed-categories-with-images.sql
```

**Pros:**

- ✅ More control
- ✅ Can skip seeds if needed
- ✅ Better for version control
- ✅ Standard approach

**Cons:**

- ⚠️ More files to manage
- ⚠️ Must remember order
- ⚠️ More steps

### Option 2: Setup Script (Convenience)

```bash
# All in one
supabase/setup/setup-categories-complete.sql
```

**Pros:**

- ✅ One file = less confusion
- ✅ Perfect for onboarding
- ✅ Quick testing
- ✅ Self-contained

**Cons:**

- ⚠️ Less granular control
- ⚠️ Includes TRUNCATE
- ⚠️ Not version controlled as well

---

## 🎯 When to Use What

### Use Individual Migrations + Seeds

- ✅ Production deployments
- ✅ When you need precise control
- ✅ Applying changes to existing database
- ✅ Version-controlled deployments
- ✅ CI/CD pipelines

### Use Setup Scripts

- ✅ Fresh database setup
- ✅ Local development initialization
- ✅ Quick testing
- ✅ Onboarding new developers
- ✅ Demo/staging environments
- ✅ Resetting features

---

## 📦 What's Included

### `setup-categories.sql`

**Size:** ~80 lines

**Contents:**

```sql
-- Migrations (partial)
ALTER TABLE categories ADD COLUMN display_order...
CREATE INDEX...
CREATE POLICY...

-- Seeds
INSERT INTO categories VALUES
('Custom Frames', ...),
('Gallery Walls', ...),
...
```

**Time to run:** ~1-2 seconds

---

### `setup-categories-complete.sql`

**Size:** ~250 lines

**Contents:**

```sql
-- STEP 1: Add all columns
ALTER TABLE categories ADD COLUMN display_order...
ALTER TABLE categories ADD COLUMN image_url...
ALTER TABLE categories ADD COLUMN seo_title...

-- STEP 2: Ensure product_categories table exists
CREATE TABLE IF NOT EXISTS product_categories...

-- STEP 3: Create functions
CREATE FUNCTION get_category_products()...

-- STEP 4: Create views
CREATE VIEW v_categories_with_counts...

-- STEP 5: Seed categories with images
INSERT INTO categories VALUES
('Custom Frames', 'https://unsplash.com/...'),
...

-- STEP 6: Verification
SELECT * FROM v_categories_with_counts...
```

**Time to run:** ~5-10 seconds

---

## 🔍 Verification

### After Running Setup Script

**Check categories exist:**

```sql
SELECT COUNT(*) FROM categories;
-- Should return: 8
```

**Check columns exist:**

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'categories'
  AND column_name IN ('display_order', 'image_url', 'seo_title');
-- Should return: 3 rows
```

**Check view exists:**

```sql
SELECT * FROM v_categories_with_counts LIMIT 1;
-- Should return: category with product counts
```

**Check function exists:**

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'get_category_products';
-- Should return: 1 row
```

---

## 🛠️ Troubleshooting

### Error: "column already exists"

**Cause:** Columns were added by previous migration

**Solution:** Setup scripts use `IF NOT EXISTS` - this is normal, not an error

### Error: "table product_categories does not exist"

**Cause:** Migration 004 not applied

**Solution:**

```sql
-- Run migration 004 first
\i supabase/migrations/004_product_categories_many_to_many.sql

-- Then run setup script
```

### Error: "function already exists"

**Cause:** Function created by previous setup

**Solution:** Script uses `CREATE OR REPLACE` - this overwrites safely

### Categories not showing in admin

**Cause:** RLS policies or view issue

**Solution:**

1. Check if categories exist: `SELECT * FROM categories;`
2. Check if view exists: `SELECT * FROM v_categories_with_counts;`
3. Run verification queries from setup script
4. Check browser console for errors

---

## 🔄 Updating Setup Scripts

### When to Update

Update setup scripts when:

- Migration 007 changes
- Default category data changes
- New features added to categories
- Better seed data available

### How to Update

1. Edit the setup script file
2. Test on fresh database
3. Update this README
4. Document changes in comments

---

## 📊 Setup Script Comparison

| Feature              | setup-categories.sql | setup-categories-complete.sql |
| -------------------- | -------------------- | ----------------------------- |
| Display ordering     | ✅                   | ✅                            |
| Background colors    | ✅                   | ✅                            |
| Icons                | ✅                   | ✅                            |
| Images               | ❌                   | ✅                            |
| SEO fields           | ❌                   | ✅                            |
| Product function     | ❌                   | ✅                            |
| Product counts view  | ❌                   | ✅                            |
| Junction table       | ❌                   | ✅                            |
| Categories seeded    | 8                    | 8                             |
| Image URLs           | No                   | Unsplash                      |
| Verification queries | No                   | ✅                            |
| Time to run          | ~1s                  | ~5s                           |
| Lines of code        | ~80                  | ~250                          |

---

## 🎯 Recommended Approach

### For New Projects

```bash
# 1. Run all core migrations (001-006)
# 2. Run complete category setup
\i supabase/setup/setup-categories-complete.sql

# 3. Run other seeds
\i supabase/seeds/seed-aspect-ratios.sql
\i supabase/seeds/seed-products.sql
```

### For Existing Projects

```bash
# Use individual migrations instead
\i supabase/migrations/007_categories_complete.sql

# Then seeds if needed
\i supabase/seeds/seed-categories-with-images.sql
```

---

## 📞 Need Help?

**Setup script failed?**

1. Check if migrations 001-006 are applied
2. Check Supabase logs for specific error
3. Try running in parts (copy sections separately)

**Want to customize?**

1. Copy setup script to new file
2. Modify seed data
3. Test on local database
4. Document your changes

**Need different categories?**

1. Edit seed data in setup script
2. Change icons, colors, names
3. Add/remove categories as needed
4. Update product associations

---

**For individual migrations, see:** `supabase/migrations/`  
**For individual seeds, see:** `supabase/seeds/`  
**For migration management guide, see:** `supabase/MIGRATION_GUIDE.md`
