# Archived Migrations

This folder contains old migration files that have been consolidated into newer versions.

**⚠️ DO NOT APPLY THESE MIGRATIONS** - They are kept for historical reference only.

---

## 📦 Archived Files

### Categories Migrations (Consolidated into 007)

| Original File                   | Date Archived | Consolidated Into             | Reason                       |
| ------------------------------- | ------------- | ----------------------------- | ---------------------------- |
| `007_add_category_ordering.sql` | 2025-10-27    | `007_categories_complete.sql` | Multiple incremental changes |
| `008_add_category_images.sql`   | 2025-10-27    | `007_categories_complete.sql` | Related to same table        |
| `009_add_category_seo.sql`      | 2025-10-27    | `007_categories_complete.sql` | Related to same table        |

---

## 🔄 What Happened

These three migrations all modified the `categories` table incrementally:

1. **007_add_category_ordering.sql** added:
   - `display_order` column
   - `bg_color` column
   - `is_active` column
   - Admin RLS policies

2. **008_add_category_images.sql** added:
   - `image_url` column
   - `get_category_products()` function
   - `v_categories_with_counts` view

3. **009_add_category_seo.sql** added:
   - `seo_title` column
   - `seo_description` column
   - `seo_keywords` column
   - `meta_robots` column
   - `canonical_url` column
   - `og_title` column
   - `og_description` column
   - `og_image` column

**Problem:** Too many small migrations for one table = harder to maintain

**Solution:** Consolidated all category enhancements into one comprehensive migration (`007_categories_complete.sql`)

---

## ✅ New Structure

The new `007_categories_complete.sql` includes **everything** from the three old migrations plus:

- Better organization
- All columns in one ALTER statement
- Comprehensive comments
- Better indexes
- Improved RLS policies

---

## 🎯 For Reference Only

Keep these files if you need to:

- Understand the history of changes
- Debug issues from incremental migrations
- Compare old vs new structure

---

## 🚀 For New Databases

**Do NOT run these files.** Instead, run the consolidated migration:

```sql
-- Run this instead:
supabase/migrations/007_categories_complete.sql
```

This single file contains all the changes from migrations 007, 008, and 009.

---

## 📝 Consolidation Date

**Archived:** 2025-10-27  
**Reason:** Too many incremental changes to same table  
**Replaced By:** `007_categories_complete.sql`

---

**Questions?** See `supabase/migrations/README.md` for full migration documentation.
