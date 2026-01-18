# Database Migrations

This directory contains all database migrations for the Photify application.

## Migration Files

Migrations are numbered sequentially and should be applied in order:

1. `001_initial_schema.sql` - Initial database schema
2. `002_*.sql` - Additional migrations...
3. ...
4. `022_add_seo_fields_to_rooms.sql` - **NEW**: Adds SEO fields to rooms table

## Latest Migration (022)

### Add SEO Fields to Rooms Table

**File**: `022_add_seo_fields_to_rooms.sql`  
**Date**: 2025-10-29

Adds the following SEO metadata fields to the `rooms` table:

- `seo_title` - SEO optimized page title (50-60 chars recommended)
- `seo_description` - SEO meta description (150-160 chars recommended)
- `seo_keywords` - Array of SEO keywords
- `canonical_url` - Canonical URL for the page
- `og_title` - Open Graph title for social sharing
- `og_description` - Open Graph description for social sharing
- `og_image` - Open Graph image URL for social sharing

**Related Seed File**: `seeds/seed-rooms-seo.sql`

## Applying Migrations

### Local Development

```bash
# Reset local database (applies all migrations)
npx supabase db reset --local

# Or apply specific migration
npx supabase migration up --local
```

### Production

```bash
# Push migrations to production
npx supabase db push
```

## Seed Data

After applying migrations, seed data can be loaded from the `seeds/` directory.

## Notes

- Always test migrations locally before pushing to production
- Migrations are irreversible - use caution with DROP statements
- Document all schema changes in this README
