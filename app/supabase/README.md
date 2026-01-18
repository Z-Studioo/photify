# Photify Supabase Configuration

Complete Supabase setup for the Photify project - migrations, seeds, functions, and documentation.

---

## 📂 Folder Structure

```
supabase/
├── README.md                    # This file (overview)
├── MIGRATION_GUIDE.md          # Complete migration management guide
├── config.toml                 # Supabase CLI configuration
│
├── migrations/                 # Database migrations (version controlled)
│   ├── README.md              # Migration index & details
│   ├── 001_initial_schema.sql
│   ├── 002_aspect_ratios_sizes_variants.sql
│   ├── 003_alter_products_config.sql
│   ├── 004_product_categories_many_to_many.sql
│   ├── 005_add_admin_policies.sql
│   ├── 006_add_product_seo_content.sql
│   ├── 007_categories_complete.sql  ⭐ Latest
│   └── archive/               # Old consolidated migrations
│       ├── README.md
│       ├── 007_add_category_ordering.sql
│       ├── 008_add_category_images.sql
│       └── 009_add_category_seo.sql
│
├── seeds/                      # Seed data files
│   ├── README.md              # Seed data guide
│   ├── seed.sql               # Legacy complete seed
│   ├── seed-aspect-ratios.sql # Aspect ratios & sizes ✅
│   ├── seed-categories.sql    # Basic categories
│   ├── seed-categories-with-images.sql  # Categories with images ✅
│   ├── seed-products.sql      # Products with config ✅
│   └── seed-single-canvas-seo.sql  # Single Canvas SEO ✅
│
├── setup/                      # Complete setup scripts (migrations + seeds)
│   ├── README.md              # Setup script guide
│   ├── setup-categories.sql   # Basic category setup
│   └── setup-categories-complete.sql  # Complete category setup ⭐
│
├── archive-old/                # Archived one-off files
│   ├── README.md
│   ├── add-category-seo-columns.sql
│   └── restore-product-categories.sql
│
└── functions/                  # Supabase Edge Functions
    └── hello/
        └── index.ts           # Example function
```

---

## 🚀 Quick Start

### For Fresh Database (Recommended Path)

```bash
# Step 1: Apply all migrations in order
cd supabase/migrations
psql ... -f 001_initial_schema.sql
psql ... -f 002_aspect_ratios_sizes_variants.sql
psql ... -f 003_alter_products_config.sql
psql ... -f 004_product_categories_many_to_many.sql
psql ... -f 005_add_admin_policies.sql
psql ... -f 006_add_product_seo_content.sql
psql ... -f 007_categories_complete.sql

# Step 2: Run essential seeds
cd ../seeds
psql ... -f seed-aspect-ratios.sql
psql ... -f seed-categories-with-images.sql
psql ... -f seed-products.sql
psql ... -f seed-single-canvas-seo.sql
```

### Alternative: Use Supabase Dashboard

1. Go to **Supabase Dashboard → SQL Editor**
2. Copy migration file contents
3. Paste and click **Run**
4. Repeat for all migrations (001-007)
5. Repeat for seed files

### Alternative: Quick Setup Script

```bash
# One-command category setup (includes migration + seeds)
cd supabase/setup
psql ... -f setup-categories-complete.sql

# Still need to run other migrations (001-006) first!
```

---

## 📋 What Each Folder Contains

### 📁 `migrations/` - Database Migrations

**Purpose:** Version-controlled database schema changes

**Files:** 7 migrations (001-007)

**What they do:**

- Create tables
- Add/modify columns
- Create indexes
- Set up RLS policies
- Add views and functions

**Key File:** `README.md` - Complete migration index

**Latest:** `007_categories_complete.sql` - Categories with ordering, images, SEO

---

### 📁 `seeds/` - Seed Data

**Purpose:** Sample/initial data for populating tables

**Files:** 6 seed files + 1 legacy

**What they populate:**

- Categories (with/without images)
- Products (with configuration)
- Aspect ratios & sizes
- SEO data

**Key File:** `README.md` - Detailed seed guide

**Recommended:**

- `seed-aspect-ratios.sql` - Essential for product config
- `seed-categories-with-images.sql` - Categories with images
- `seed-products.sql` - Modern products with config
- `seed-single-canvas-seo.sql` - SEO data for Single Canvas

---

### 📁 `setup/` - Complete Setup Scripts

**Purpose:** All-in-one scripts (migration + seeds combined)

**Files:** 2 setup scripts

**What they do:**

- Apply migrations
- Seed data
- Create views/functions
- Verify setup

**Key File:** `README.md` - Setup script guide

**Best for:**

- Fresh database initialization
- Quick testing
- Onboarding new developers
- Resetting features

**⚠️ Warning:** Contains TRUNCATE - clears existing data

---

### 📁 `archive-old/` - Archived Files

**Purpose:** Historical reference for old/one-off files

**Files:** 2 archived files

**Status:** ⚠️ DO NOT USE

**Why archived:**

- Replaced by current migrations
- One-time emergency fixes
- Consolidated into better files

**Keep for:**

- Historical reference
- Understanding evolution
- Debugging similar issues

---

### 📁 `functions/` - Edge Functions

**Purpose:** Supabase serverless functions (TypeScript/Deno)

**Files:** Example hello function

**Deploy:**

```bash
supabase functions deploy hello
```

**Note:** Currently contains example only. Add production functions here.

---

## 🎯 Common Tasks

### 1. Set Up Fresh Database

```bash
# Apply migrations 001-007
# Run recommended seeds (aspect-ratios, categories, products)
# See "Quick Start" section above
```

### 2. Add Category System to Existing Database

```bash
# If you have migrations 001-006 already applied:
cd supabase/migrations
psql ... -f 007_categories_complete.sql

# Then seed categories:
cd ../seeds
psql ... -f seed-categories-with-images.sql
```

### 3. Reset Categories Only

```bash
# WARNING: Deletes existing categories!
cd supabase/setup
psql ... -f setup-categories-complete.sql
```

### 4. Add New Migration

```bash
# 1. Create new file
cd supabase/migrations
touch 008_your_feature.sql

# 2. Write migration (see MIGRATION_GUIDE.md for template)

# 3. Test locally

# 4. Update migrations/README.md

# 5. Apply to production
```

### 5. Create New Seed Data

```bash
# 1. Create new file
cd supabase/seeds
touch seed-your-data.sql

# 2. Write INSERT statements

# 3. Update seeds/README.md

# 4. Test on fresh database
```

---

## 📖 Documentation

### Must-Read Documentation

| File                       | Purpose                       | When to Read                     |
| -------------------------- | ----------------------------- | -------------------------------- |
| **`MIGRATION_GUIDE.md`**   | Complete migration management | Creating/managing migrations     |
| **`migrations/README.md`** | Migration index & details     | Understanding what migrations do |
| **`seeds/README.md`**      | Seed data guide               | Populating database              |
| **`setup/README.md`**      | Setup script usage            | Quick database initialization    |

### Documentation Highlights

**MIGRATION_GUIDE.md** (700+ lines):

- Migration lifecycle
- Consolidation process
- Best practices
- 40+ code examples
- Troubleshooting

**migrations/README.md** (250+ lines):

- All 7 migrations explained
- What each creates
- Verification queries
- Migration checklist

**seeds/README.md** (500+ lines):

- 6 seed files explained
- Dependencies
- Recommended order
- Customization guide

**setup/README.md** (400+ lines):

- 2 setup scripts explained
- When to use
- Warnings & gotchas
- Comparison table

---

## 🎓 Learning Path

### For New Developers

1. **Start here:** Read this README.md
2. **Understand migrations:** Read `migrations/README.md`
3. **Learn workflow:** Read `MIGRATION_GUIDE.md`
4. **Practice:** Set up local database using quick start
5. **Reference:** Use other READMEs as needed

### For Existing Developers

1. **Quick reference:** Use folder-specific READMEs
2. **Creating migration:** Follow `MIGRATION_GUIDE.md` template
3. **Troubleshooting:** Check verification queries in docs

---

## ✅ Verification

### Check Migrations Applied

```sql
-- Check tables exist
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';
-- Should return: 10+ tables

-- Check latest migration columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'categories'
  AND column_name IN ('display_order', 'image_url', 'seo_title');
-- Should return: 3 rows
```

### Check Seeds Applied

```sql
-- Check categories
SELECT COUNT(*) FROM categories;
-- Should return: 8 (if seeded)

-- Check aspect ratios
SELECT COUNT(*) FROM aspect_ratios;
-- Should return: 15+ (if seeded)

-- Check products
SELECT COUNT(*) FROM products;
-- Should return: 6-8 (if seeded)
```

### Check Functions & Views

```sql
-- Check views
SELECT COUNT(*) FROM information_schema.views
WHERE table_schema = 'public';
-- Should return: 1+ (v_categories_with_counts)

-- Check functions
SELECT COUNT(*) FROM information_schema.routines
WHERE routine_schema = 'public';
-- Should return: 1+ (get_category_products)
```

---

## 🚨 Troubleshooting

### Migration Failed

**Check:**

1. Are previous migrations applied?
2. Does table/column already exist?
3. Check Supabase logs for specific error

**Fix:**

- Use `IF NOT EXISTS` in migrations (already done)
- Check migration order
- See `MIGRATION_GUIDE.md` troubleshooting section

### Seed Failed

**Check:**

1. Are required migrations applied?
2. Does table exist?
3. Check for constraint violations

**Fix:**

- Apply migrations first
- Check dependencies in `seeds/README.md`
- Read error message carefully

### Function/View Missing

**Check:**

1. Did migration 007 run successfully?
2. Check function exists: `SELECT * FROM information_schema.routines`
3. Check view exists: `SELECT * FROM information_schema.views`

**Fix:**

- Run `007_categories_complete.sql`
- Or run `setup-categories-complete.sql`

### RLS Blocking Access

**Check:**

1. Are policies set up? `SELECT * FROM pg_policies`
2. Are you authenticated?
3. Is RLS enabled on table?

**Fix:**

- Check migration 005 (admin policies)
- Log in to admin panel
- See migration documentation for policy details

---

## 🎯 Current State

**Schema Version:** 7  
**Latest Migration:** `007_categories_complete.sql`  
**Total Migrations:** 7 (+ 3 archived)  
**Total Seeds:** 6 (+ 1 legacy)  
**Total Setup Scripts:** 2  
**Documentation Files:** 5 comprehensive READMEs

---

## 🛠️ Development Workflow

### Adding New Feature

```bash
# 1. Plan database changes
# - What tables/columns needed?
# - What indexes needed?
# - What RLS policies?

# 2. Create migration
cd supabase/migrations
touch 008_feature_name.sql

# 3. Write migration (use MIGRATION_GUIDE.md template)

# 4. Test locally
supabase db reset  # or apply migration only

# 5. Create seed data if needed
cd ../seeds
touch seed-feature-data.sql

# 6. Update documentation
# - migrations/README.md
# - seeds/README.md (if seed created)
# - .cursor/rules/ files (if new patterns established)

# 7. Test complete flow
# - Fresh database
# - Apply migrations
# - Run seeds
# - Verify in app

# 8. Commit
git add supabase/
git commit -m "feat: add feature_name database support"
```

### Applying Changes to Production

```bash
# 1. Backup production database
pg_dump ... > backup_YYYY-MM-DD.sql

# 2. Test on staging first

# 3. Apply during low-traffic window

# 4. Apply migrations in order
# - Use Supabase Dashboard SQL Editor
# - Copy migration contents
# - Run and verify

# 5. Run seeds if needed

# 6. Test critical flows

# 7. Monitor for errors
```

---

## 📊 Statistics

**Total SQL Files:** 20+  
**Total Documentation:** 2000+ lines  
**Migration Files:** 7 active, 3 archived  
**Seed Files:** 6 active, 1 legacy  
**Setup Scripts:** 2  
**Edge Functions:** 1 example

---

## 🔗 Related Documentation

**In Project Root:**

- `.cursorrules` - Master rules file
- `.cursor/rules/` - All development rules
- `docs/README.md` - Feature documentation index

**In Supabase Folder:**

- `MIGRATION_GUIDE.md` - Migration management (700+ lines)
- `migrations/README.md` - Migration index (250+ lines)
- `seeds/README.md` - Seed guide (500+ lines)
- `setup/README.md` - Setup script guide (400+ lines)
- `archive-old/README.md` - Archived files explanation

---

## 📞 Need Help?

### For Migrations

- Read `MIGRATION_GUIDE.md`
- Check `migrations/README.md`
- See consolidation examples in `migrations/archive/`

### For Seeds

- Read `seeds/README.md`
- Check dependencies section
- See customization examples

### For Setup

- Read `setup/README.md`
- Use setup scripts for quick start
- Check warnings before running

### For General Questions

- Check this README first
- See `.cursorrules` and `.cursor/rules/` for development guidance
- Review folder-specific READMEs

---

## 🎯 Best Practices

1. ✅ **Always apply migrations in order** (001→002→003...)
2. ✅ **Use `IF NOT EXISTS`** for idempotent migrations
3. ✅ **Document every migration** in README
4. ✅ **Test locally before production**
5. ✅ **Backup before destructive operations**
6. ✅ **Consolidate related migrations** (see MIGRATION_GUIDE.md)
7. ✅ **Keep documentation updated**
8. ✅ **Use setup scripts for fresh databases**
9. ✅ **Seed data after migrations**
10. ✅ **Verify with queries** after applying changes

---

## 🚀 Next Steps

1. **New to project?** → Read `MIGRATION_GUIDE.md`
2. **Setting up database?** → Follow "Quick Start" above
3. **Creating migration?** → Use template in `MIGRATION_GUIDE.md`
4. **Adding feature?** → Follow "Development Workflow" above
5. **Troubleshooting?** → Check "Troubleshooting" section

---

**Last Updated:** 2025-10-27  
**Schema Version:** 7  
**Status:** Production Ready  
**Documentation:** Complete

---

**For questions or issues:** See folder-specific READMEs or check `MIGRATION_GUIDE.md`
