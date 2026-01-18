# Photify Seed Data

This folder contains all seed data files for populating your Supabase database with initial/sample data.

---

## 📋 Seed Files Index

| File                              | Purpose                        | Dependencies       | Status      |
| --------------------------------- | ------------------------------ | ------------------ | ----------- |
| `seed.sql`                        | Complete initial seed (legacy) | Migration 001      | ⚠️ Legacy   |
| `seed-aspect-ratios.sql`          | Aspect ratios data             | Migration 002      | ✅ Use this |
| `seed-categories.sql`             | Basic categories               | Migration 001, 007 | ✅ Use this |
| `seed-categories-with-images.sql` | Categories with images         | Migration 007      | ✅ Better   |
| `seed-products.sql`               | Products with config           | Migrations 001-006 | ✅ Use this |
| `seed-single-canvas-seo.sql`      | Single Canvas SEO              | Migration 006      | ✅ Use this |

---

## 🚀 Quick Start

### For Fresh Database

**Recommended Order:**

1. **Apply all migrations first** (001-007)
2. **Then run seeds:**

```sql
-- 1. Aspect Ratios & Sizes
\i supabase/seeds/seed-aspect-ratios.sql

-- 2. Categories (with images - better)
\i supabase/seeds/seed-categories-with-images.sql

-- 3. Products
\i supabase/seeds/seed-products.sql

-- 4. Single Canvas SEO (optional)
\i supabase/seeds/seed-single-canvas-seo.sql
```

**Or use Supabase Dashboard:**

1. Copy contents of each seed file
2. Paste in SQL Editor
3. Run in order

---

## 📖 Detailed Seed Information

### 1. `seed.sql` (Legacy - Complete Initial Seed)

**⚠️ Status:** Legacy file, use specific seeds instead

**What it contains:**

- Basic categories (no ordering, images, or SEO)
- Sample products
- Art products
- Rooms
- AI tools
- Print sizes
- Sample customers
- Sample orders

**When to use:**

- Initial setup of old database
- Quick testing with basic data

**Dependencies:**

- Migration 001 (initial schema)

**Note:** This file doesn't include modern features (category ordering, product configuration, SEO). Use specific seed files instead.

---

### 2. `seed-aspect-ratios.sql` ✅ **Recommended**

**What it contains:**

- 15+ aspect ratios (1:1, 4:3, 16:9, 3:2, 5:4, etc.)
- 100+ sizes for each aspect ratio
- Computed area in square inches
- Orientation detection (landscape/portrait/square)
- Display labels

**Example data:**

```sql
-- Aspect Ratio: 1:1 (Square)
INSERT INTO aspect_ratios VALUES
('11111111-1111-1111-1111-111111111111', '1:1', 1, 1, 'square', true);

-- Sizes for 1:1
INSERT INTO sizes VALUES
-- Small
('a1000001-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111',
 6, 6, '6" × 6"', 36.00, true),
-- Medium
('a1000001-0001-0001-0001-000000000010', '11111111-1111-1111-1111-111111111111',
 12, 12, '12" × 12"', 144.00, true),
-- ... more sizes
```

**Dependencies:**

- Migration 002 (aspect_ratios and sizes tables)

**When to use:**

- Always run this for product configuration
- Required for Single Canvas customizer
- Required for admin product configurator

**Run:**

```sql
\i supabase/seeds/seed-aspect-ratios.sql
```

---

### 3. `seed-categories.sql` ✅ **Basic Version**

**What it contains:**

- 8 categories with icons
- Display ordering (1-8)
- Background colors
- Active/inactive flags

**Categories included:**

1. Custom Frames
2. Gallery Walls
3. Canvas Prints
4. Art Collection
5. Photo Prints
6. Posters
7. Photo Books
8. Gift Sets

**Features:**

- ✅ Display order for drag-and-drop
- ✅ Background colors
- ✅ Icons (Lucide icon names)
- ❌ No images
- ❌ No SEO fields

**Dependencies:**

- Migration 001 (categories table)
- Migration 007 (ordering, bg_color, is_active columns)

**When to use:**

- Quick setup without images
- Testing category ordering
- Development environment

**Run:**

```sql
\i supabase/seeds/seed-categories.sql
```

---

### 4. `seed-categories-with-images.sql` ✅✅ **Better Version**

**What it contains:**

- Same 8 categories as above
- **Plus:** Image URLs from Unsplash
- Display ordering
- Background colors
- Active/inactive flags

**Categories with images:**

1. Custom Frames → Frame photo
2. Gallery Walls → Gallery wall setup
3. Canvas Prints → Canvas print
4. Art Collection → Abstract art
5. Photo Prints → Photo prints
6. Posters → Poster design
7. Photo Books → Photo book
8. Gift Sets → Gift packaging

**Features:**

- ✅ Display order for drag-and-drop
- ✅ Background colors
- ✅ Icons (Lucide icon names)
- ✅ **Image URLs** (high-quality Unsplash photos)
- ❌ No SEO fields (can be added via admin)

**Dependencies:**

- Migration 001 (categories table)
- Migration 007 (ordering, images, SEO columns)

**When to use:**

- **Recommended** for production-like setup
- When you want visual category representation
- For testing category images in UI

**Run:**

```sql
\i supabase/seeds/seed-categories-with-images.sql
```

**Note:** Uses external Unsplash URLs. For production, upload images to Supabase Storage and update URLs.

---

### 5. `seed-products.sql` ✅ **Modern Products**

**What it contains:**

- Multiple products with full configuration
- Product types (canvas, framed_canvas, metal_print)
- Product configurations (JSONB)
- SEO fields (title, description, keywords)
- Features, specifications, trust badges
- Multiple images per product
- Proper pricing (per square inch)

**Example products:**

```sql
-- Single Canvas (ID: 00845beb-23c6-4d3b-8f55-a62eb956f182)
config: {
  "allowedRatios": ["1:1", "4:3", "16:9"],
  "allowedSizes": ["12x12", "16x16", "20x15"]
}
price: 0.15  -- per square inch
seo_title: "Single Canvas Prints | Custom Photo Canvas"
features: ["Premium Quality", "Ready to Hang", "Lifetime Warranty"]
```

**Features:**

- ✅ Modern product structure
- ✅ JSONB configuration
- ✅ SEO optimized
- ✅ Content management ready
- ✅ Proper product types
- ✅ Per-square-inch pricing

**Dependencies:**

- Migration 001 (products table)
- Migration 003 (config columns)
- Migration 006 (SEO & content columns)
- `seed-aspect-ratios.sql` (for config to work)
- `seed-categories-with-images.sql` or `seed-categories.sql`

**When to use:**

- Always use for modern product setup
- Required for admin configurator
- Required for customer customizer

**Important:**

- ⚠️ Truncates existing products!
- Sets proper config for Single Canvas
- Includes placeholder data for other products

**Run:**

```sql
\i supabase/seeds/seed-products.sql
```

---

### 6. `seed-single-canvas-seo.sql` ✅ **SEO Enhancement**

**What it contains:**

- Complete SEO data for Single Canvas product
- Meta tags, descriptions, keywords
- Open Graph data for social media
- Twitter card data
- Features, specifications, trust badges
- Content sections

**SEO Fields:**

```sql
seo_title: "Single Canvas Prints | Custom Photo Canvas | Photify"
seo_description: "Transform your photos into stunning canvas prints..."
seo_keywords: ["canvas prints", "custom canvas", "photo canvas", ...]
canonical_url: "https://photify.com/product/single-canvas"
og_title: "Create Your Perfect Canvas Print"
og_image: "https://..."
```

**Content Fields:**

```sql
features: [
  {"text": "Premium Quality Canvas"},
  {"text": "Ready to Hang"},
  ...
]
specifications: [
  {"label": "Material", "value": "380gsm Cotton Canvas"},
  ...
]
trust_badges: [
  {"icon": "Shield", "title": "Quality Guarantee"},
  ...
]
```

**Dependencies:**

- Migration 006 (SEO & content columns)
- `seed-products.sql` (must run first)

**When to use:**

- After running seed-products.sql
- To populate SEO data for Single Canvas
- For testing WordPress-like content editor

**Run:**

```sql
\i supabase/seeds/seed-single-canvas-seo.sql
```

---

## 🎯 Recommended Seed Order

### **Minimal Setup (Development)**

```bash
# 1. Apply migrations (001-007)

# 2. Essential seeds only:
psql ... -f supabase/seeds/seed-aspect-ratios.sql
psql ... -f supabase/seeds/seed-categories.sql
psql ... -f supabase/seeds/seed-products.sql
```

### **Complete Setup (Production-like)**

```bash
# 1. Apply migrations (001-007)

# 2. All recommended seeds:
psql ... -f supabase/seeds/seed-aspect-ratios.sql
psql ... -f supabase/seeds/seed-categories-with-images.sql
psql ... -f supabase/seeds/seed-products.sql
psql ... -f supabase/seeds/seed-single-canvas-seo.sql
```

### **Quick Test Setup**

```bash
# Use legacy seed for quick testing
psql ... -f supabase/seeds/seed.sql
```

---

## 📦 What Each Seed Populates

### Tables Populated

| Seed File                         | Tables Populated                                                                    |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| `seed.sql`                        | categories, products, art_products, rooms, ai_tools, print_sizes, customers, orders |
| `seed-aspect-ratios.sql`          | aspect_ratios, sizes                                                                |
| `seed-categories.sql`             | categories                                                                          |
| `seed-categories-with-images.sql` | categories (with images)                                                            |
| `seed-products.sql`               | products, product_categories                                                        |
| `seed-single-canvas-seo.sql`      | products (SEO update)                                                               |

---

## ⚠️ Important Notes

### Before Running Seeds

1. **Apply migrations first!** Seeds depend on proper schema
2. **Check dependencies** - Some seeds require others
3. **Backup if needed** - Some seeds use TRUNCATE

### TRUNCATE Warnings

These seeds clear existing data:

- ❌ `seed-categories.sql` - Truncates categories
- ❌ `seed-categories-with-images.sql` - Truncates categories
- ❌ `seed-products.sql` - Truncates products
- ✅ `seed-aspect-ratios.sql` - Safe (uses INSERT ... ON CONFLICT)

### Production Considerations

1. **Don't use seed data in production!**
2. **Replace Unsplash URLs** with your own images in Supabase Storage
3. **Update product data** via admin panel
4. **Add real SEO content** for your products
5. **Remove sample customers/orders** from seed.sql

---

## 🔧 Customizing Seeds

### Adding New Category

Edit `seed-categories-with-images.sql`:

```sql
INSERT INTO categories (id, name, slug, icon, image_url, bg_color, display_order, is_active, description) VALUES
('99999999-9999-9999-9999-999999999999',
 'Your Category',
 'your-category',
 'Icon',
 'https://your-image-url.com/image.jpg',
 '#e8e4df',
 9,
 true,
 'Your category description');
```

### Adding New Aspect Ratio

Edit `seed-aspect-ratios.sql`:

```sql
-- Add aspect ratio
INSERT INTO aspect_ratios VALUES
('new-uuid', '21:9', 21, 9, 'landscape', true);

-- Add sizes for it
INSERT INTO sizes VALUES
('size-uuid', 'aspect-ratio-uuid', 21, 9, '21" × 9"', 189.00, true);
```

### Adding New Product

Edit `seed-products.sql`:

```sql
INSERT INTO products (
  id, name, slug, description, price, product_type, active,
  images, config, config_status
) VALUES (
  'your-product-uuid',
  'Your Product Name',
  'your-product-slug',
  'Description...',
  0.20,  -- price per sq inch
  'canvas',
  true,
  ARRAY['image1.jpg', 'image2.jpg'],
  '{"allowedRatios": ["1:1"], "allowedSizes": ["12x12"]}'::jsonb,
  'active'
);
```

---

## 🧹 Cleaning Up

### Remove All Seed Data

```sql
-- Clear in reverse dependency order
TRUNCATE orders CASCADE;
TRUNCATE customers CASCADE;
TRUNCATE products CASCADE;
TRUNCATE product_categories CASCADE;
TRUNCATE categories CASCADE;
TRUNCATE sizes CASCADE;
TRUNCATE aspect_ratios CASCADE;
TRUNCATE rooms CASCADE;
TRUNCATE ai_tools CASCADE;
TRUNCATE art_products CASCADE;
```

### Reset to Fresh State

```bash
# Option 1: Supabase CLI
supabase db reset

# Option 2: Manual
# 1. Drop all tables
# 2. Reapply migrations 001-007
# 3. Run seeds again
```

---

## 🎯 Seed Strategy

### Development

- Use `seed-categories.sql` (basic, fast)
- Use `seed-aspect-ratios.sql` (essential)
- Use `seed-products.sql` (testing)

### Staging

- Use `seed-categories-with-images.sql` (visual testing)
- Use `seed-aspect-ratios.sql` (essential)
- Use `seed-products.sql` (complete data)
- Use `seed-single-canvas-seo.sql` (SEO testing)

### Production

- **Don't use seeds!**
- Populate via admin panel
- Upload real images to Supabase Storage
- Write real SEO content

---

## 📊 Data Summary

### Categories

- **Basic seed:** 8 categories with icons and colors
- **With images:** 8 categories with Unsplash images
- **Display order:** 1-8 (drag-and-drop ready)

### Aspect Ratios & Sizes

- **Aspect ratios:** 15+ ratios (1:1, 4:3, 16:9, 3:2, etc.)
- **Sizes per ratio:** 10-15 sizes
- **Total sizes:** 100+ options

### Products

- **Sample products:** 6-8 products
- **Configured product:** Single Canvas (fully configured)
- **Product types:** canvas, framed_canvas, metal_print

---

## 🔍 Verification Queries

### Check Categories

```sql
SELECT name, slug, display_order,
       image_url IS NOT NULL as has_image,
       is_active
FROM categories
ORDER BY display_order;
```

### Check Aspect Ratios

```sql
SELECT ar.label, ar.orientation, COUNT(s.id) as size_count
FROM aspect_ratios ar
LEFT JOIN sizes s ON ar.id = s.aspect_ratio_id
GROUP BY ar.id, ar.label, ar.orientation
ORDER BY ar.label;
```

### Check Products

```sql
SELECT name, slug, product_type,
       config IS NOT NULL as has_config,
       config_status,
       active
FROM products
ORDER BY created_at;
```

### Check Product-Category Associations

```sql
SELECT p.name as product, c.name as category
FROM products p
JOIN product_categories pc ON p.id = pc.product_id
JOIN categories c ON pc.category_id = c.id
ORDER BY p.name, c.name;
```

---

## 📞 Need Help?

**Seed not working?**

1. Check migrations are applied (001-007)
2. Check dependencies for that seed
3. Look for error messages in output
4. Verify table exists

**Data looks wrong?**

1. Check if you ran seeds in correct order
2. Verify migrations match seed expectations
3. Check for TRUNCATE warnings

**Want to customize?**

1. Copy seed file
2. Modify data
3. Test on local database first

---

**For setup scripts that include migrations + seeds, see:** `supabase/setup/`
