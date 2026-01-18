# Archived/Legacy Files

This folder contains old or one-off SQL files that are no longer actively used but kept for reference.

**⚠️ DO NOT USE THESE FILES** - They are for historical reference only.

---

## 📦 Archived Files

| File                             | Date Archived | Purpose                           | Status             |
| -------------------------------- | ------------- | --------------------------------- | ------------------ |
| `add-category-seo-columns.sql`   | 2025-10-27    | Quick fix for missing SEO columns | ✅ Merged into 007 |
| `restore-product-categories.sql` | 2025-10-27    | Emergency restore script          | ⚠️ One-time use    |

---

## 📖 File Details

### `add-category-seo-columns.sql`

**Original Purpose:**

- Quick fix when SEO columns were missing
- Created when user got error: "Could not find 'canonical_url' column"
- Temporary solution before proper migration consolidation

**What it did:**

```sql
-- Added 8 SEO columns to categories
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
-- ... etc
```

**Why archived:**

- ✅ All SEO columns now included in `007_categories_complete.sql`
- ✅ Proper migration handles this now
- ✅ No longer needed as standalone file

**Replaced by:**

- `supabase/migrations/007_categories_complete.sql`

**Use instead:**

```sql
-- Don't use add-category-seo-columns.sql
-- Use this:
\i supabase/migrations/007_categories_complete.sql
```

---

### `restore-product-categories.sql`

**Original Purpose:**

- Emergency restore script
- Created when user accidentally deleted `product_categories` table
- Recreates table + policies + views + functions

**What it does:**

```sql
-- Recreates product_categories table
CREATE TABLE IF NOT EXISTS product_categories...

-- Recreates get_category_products function
CREATE OR REPLACE FUNCTION get_category_products()...

-- Recreates v_categories_with_counts view
CREATE OR REPLACE VIEW v_categories_with_counts...
```

**Why archived:**

- ⚠️ One-time emergency use only
- ✅ `007_categories_complete.sql` handles this now
- ✅ `setup-categories-complete.sql` includes this
- ✅ Migration 004 creates product_categories table properly

**When it was useful:**

- User accidentally ran `DROP TABLE product_categories`
- Needed quick restore without full database reset
- Before proper setup scripts existed

**Use instead:**

```sql
-- For fresh setup:
\i supabase/migrations/004_product_categories_many_to_many.sql
\i supabase/migrations/007_categories_complete.sql

-- Or use complete setup:
\i supabase/setup/setup-categories-complete.sql
```

**If you really need to restore:**

1. Check if table exists: `SELECT * FROM product_categories LIMIT 1;`
2. If missing, run migration 004 first
3. Then run 007 for views/functions
4. Don't use this file unless absolutely necessary

---

## 🚫 Why These Files Are Archived

### Problems with keeping them active:

1. **Confusion** - Multiple files doing same thing
2. **Duplication** - Same SQL in multiple places
3. **Maintenance** - Changes needed in multiple files
4. **Order issues** - Unclear which to run first
5. **Version control** - Hard to track what's current

### Solution: Consolidation

✅ One source of truth: `007_categories_complete.sql`  
✅ Complete setup script: `setup-categories-complete.sql`  
✅ Clear documentation: Migration README  
✅ Archived old files: For reference only

---

## 📋 Migration History

### Evolution of Category Setup

**Phase 1: Individual additions (Archived)**

```
007_add_category_ordering.sql    → Ordering columns
008_add_category_images.sql      → Image columns
009_add_category_seo.sql         → SEO columns
add-category-seo-columns.sql     → Quick fix
```

**Phase 2: Consolidated (Current)**

```
007_categories_complete.sql      → Everything in one file
```

**Phase 3: Emergency fixes (Archived)**

```
restore-product-categories.sql   → One-time restore
```

---

## 🎯 What to Use Instead

| Instead of...                    | Use...                                   |
| -------------------------------- | ---------------------------------------- |
| `add-category-seo-columns.sql`   | `migrations/007_categories_complete.sql` |
| `restore-product-categories.sql` | `migrations/004_*.sql` + `007_*.sql`     |
| Both files together              | `setup/setup-categories-complete.sql`    |

---

## 🔍 When to Reference These Files

### Good reasons to look at archived files:

✅ **Understanding history** - See how features evolved  
✅ **Debugging** - Compare with current implementation  
✅ **Learning** - See what problems occurred  
✅ **Documentation** - Understand why changes were made

### Bad reasons to use archived files:

❌ **Fresh setup** - Use current migrations instead  
❌ **Production** - Use consolidated files  
❌ **Emergency** - Check if current files solve it first  
❌ **Copying SQL** - Get it from current files

---

## 📝 How These Files Were Created

### `add-category-seo-columns.sql`

**Timeline:**

1. User implemented category SEO in admin UI
2. Clicked save → Error: "canonical_url column not found"
3. Migration 009 existed but wasn't applied
4. Created quick fix file for immediate solution
5. Later: Consolidated into 007_categories_complete.sql
6. Archived when consolidation was complete

**Lesson learned:**

- Setup documentation needed
- Migration tracking important
- Consolidation reduces errors

---

### `restore-product-categories.sql`

**Timeline:**

1. User asked: "I mistakenly deleted product_categories table"
2. Created emergency restore script
3. Script recreates table + policies + views + functions
4. Worked as emergency fix
5. Later: Proper migrations handle this
6. Archived as reference for similar scenarios

**Lesson learned:**

- Always backup before destructive operations
- Have restore procedures documented
- Proper migrations prevent accidents

---

## 🛠️ If You Need Similar Functionality

### For Missing SEO Columns

**Don't use:** `add-category-seo-columns.sql`

**Do this:**

```sql
-- Check if columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'categories'
  AND column_name LIKE '%seo%';

-- If missing, run proper migration
\i supabase/migrations/007_categories_complete.sql
```

---

### For Missing product_categories Table

**Don't use:** `restore-product-categories.sql`

**Do this:**

```sql
-- Check if table exists
SELECT * FROM information_schema.tables
WHERE table_name = 'product_categories';

-- If missing, run proper migrations
\i supabase/migrations/004_product_categories_many_to_many.sql
\i supabase/migrations/007_categories_complete.sql

-- Or use complete setup
\i supabase/setup/setup-categories-complete.sql
```

---

## 🚨 Emergency Use Only

If you absolutely must use these files (not recommended):

### Steps:

1. **Backup first!**

```sql
-- Export your current data
pg_dump ... > backup.sql
```

2. **Understand what it does**

- Read the file carefully
- Check for TRUNCATE or DROP statements
- Verify it matches your needs

3. **Test on local/staging first**

- Never test on production
- Verify results
- Check for side effects

4. **Consider alternatives**

- Can you use current migrations instead?
- Is there a setup script that does this?
- Check migration guide for proper way

5. **Document what you did**

- Why you used archived file
- What happened
- How to avoid in future

---

## 📊 Archive Statistics

**Files archived:** 2  
**Total lines:** ~200 lines  
**Date archived:** 2025-10-27  
**Reason:** Consolidation and proper migration organization

**Files replaced by:**

- `migrations/007_categories_complete.sql` (primary)
- `setup/setup-categories-complete.sql` (convenience)

---

## 📞 Questions?

**"Should I delete these?"**

- No, keep for reference
- They show history and evolution
- Useful for understanding problems
- Help with similar future issues

**"Can I use these?"**

- Not recommended
- Use current migrations instead
- Check setup scripts first
- See MIGRATION_GUIDE.md

**"I need to restore something"**

- Check current migrations first
- Use setup scripts if available
- See migration README for proper way
- Ask before using archived files

---

**For current migrations:** `supabase/migrations/`  
**For complete setups:** `supabase/setup/`  
**For seed data:** `supabase/seeds/`  
**For migration guide:** `supabase/MIGRATION_GUIDE.md`
