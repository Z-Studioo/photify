-- Migration: Baseline public schema
-- Version: 001
-- Description: Single-file baseline of the entire `public` schema as it
--              existed on the linked Supabase project (mhlmbpnyckrqyznwmbwo)
--              on 2026-05-14. Generated via `supabase db dump --linked
--              --schema public`. Supersedes the 32 incremental migrations
--              now archived under
--              `supabase/archive-old/migrations-pre-baseline-2026-05-14/`.
-- Date: 2026-05-14
--
-- NOTE: This file captures schema only (no row data). Seed data (categories,
-- sizes, aspect ratios, etc.) lives in `supabase/seeds/` or must be pulled
-- from the live DB. Running `supabase db reset` against a fresh local DB
-- will leave most reference tables empty.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


-- ============================================================================
-- Extensions
-- ============================================================================
-- These are pre-installed on Supabase-hosted projects but must be created
-- explicitly for the baseline to apply on a fresh local DB.
-- `vector` (pgvector) is installed in the `public` schema because the
-- `search_products_semantic` function references it as `public.vector`.

CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";



CREATE OR REPLACE FUNCTION "public"."apply_promotion_to_order"("promotion_code" character varying, "order_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    promo_id UUID;
BEGIN
    -- Get promotion ID
    SELECT id INTO promo_id
    FROM promotions
    WHERE code = promotion_code
    AND is_active = true;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Increment used count
    UPDATE promotions
    SET used_count = used_count + 1
    WHERE id = promo_id;

    RETURN true;
END;
$$;


ALTER FUNCTION "public"."apply_promotion_to_order"("promotion_code" character varying, "order_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."apply_promotion_to_order"("promotion_code" character varying, "order_uuid" "uuid") IS 'Increments promotion usage count when applied to an order';



CREATE OR REPLACE FUNCTION "public"."count_products_with_tag"("tag_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  product_count INTEGER;
  art_product_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO product_count
  FROM product_tags
  WHERE tag_id = tag_uuid;
  
  SELECT COUNT(*) INTO art_product_count
  FROM art_product_tags
  WHERE tag_id = tag_uuid;
  
  RETURN product_count + art_product_count;
END;
$$;


ALTER FUNCTION "public"."count_products_with_tag"("tag_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_order_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_order_number TEXT;
  attempts INT := 0;
  max_attempts INT := 10;
BEGIN
  WHILE attempts < max_attempts LOOP
    -- Generate short format: PH-XXXXXX (e.g., PH-123456)
    new_order_number := 'PH-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- Check if this order number already exists
    IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_order_number) THEN
      RETURN new_order_number;
    END IF;

    attempts := attempts + 1;
  END LOOP;

  -- Fallback: use timestamp if we somehow can't find a unique number
  new_order_number := 'PH-' || TO_CHAR(NOW(), 'YYYYMMDD-HHMMSS');

  RETURN new_order_number;
END;
$$;


ALTER FUNCTION "public"."generate_order_number"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_order_number"() IS 'Generates short order numbers in format PH-XXXXXX (9 characters total). Retries up to 10 times to find a unique number.';



CREATE OR REPLACE FUNCTION "public"."get_art_product_tags"("art_product_uuid" "uuid") RETURNS TABLE("id" "uuid", "name" character varying, "slug" character varying, "color" character varying, "description" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, t.slug, t.color, t.description
  FROM tags t
  INNER JOIN art_product_tags apt ON t.id = apt.tag_id
  WHERE apt.art_product_id = art_product_uuid
  ORDER BY t.name;
END;
$$;


ALTER FUNCTION "public"."get_art_product_tags"("art_product_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_category_products"("category_uuid" "uuid") RETURNS TABLE("id" "uuid", "name" character varying, "slug" character varying, "description" "text", "price" numeric, "old_price" numeric, "images" "text"[], "is_featured" boolean, "product_type" "text", "active" boolean, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.name, p.slug, p.description, p.price, p.old_price, 
    p.images, p.is_featured, p.product_type, p.active, p.created_at
  FROM products p
  INNER JOIN product_categories pc ON p.id = pc.product_id
  WHERE pc.category_id = category_uuid
  ORDER BY p.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_category_products"("category_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_product_categories"("product_uuid" "uuid") RETURNS TABLE("id" "uuid", "name" character varying, "slug" character varying, "description" "text", "icon" character varying, "image_url" "text", "bg_color" character varying)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.slug, c.description, c.icon, c.image_url, c.bg_color
  FROM categories c
  INNER JOIN product_categories pc ON c.id = pc.category_id
  WHERE pc.product_id = product_uuid;
END;
$$;


ALTER FUNCTION "public"."get_product_categories"("product_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_product_min_price"("product_uuid" "uuid") RETURNS numeric
    LANGUAGE "sql" STABLE
    AS $$
  select min(pp.fixed_price)
  from public.product_pricings pp
  where pp.product_id = product_uuid
    and pp.active = true
    and exists (
      select 1 from public.sizes s
      where s.id = pp.size_id
        and s.active = true
    );
$$;


ALTER FUNCTION "public"."get_product_min_price"("product_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_product_min_price"("product_uuid" "uuid") IS 'Returns the minimum fixed price for a product across all active sizes';



CREATE OR REPLACE FUNCTION "public"."get_product_min_size_price"("product_uuid" "uuid") RETURNS numeric
    LANGUAGE "sql" STABLE
    AS $$
  SELECT MIN(s.fixed_price)
  FROM products p
  CROSS JOIN LATERAL jsonb_array_elements_text(
    COALESCE(p.config->>'allowedSizes', '[]')::jsonb
  ) AS size_id
  INNER JOIN sizes s ON s.id::text = size_id
  WHERE p.id = product_uuid
    AND p.active = true
    AND s.fixed_price IS NOT NULL
    AND s.active = true;
$$;


ALTER FUNCTION "public"."get_product_min_size_price"("product_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_product_min_size_price"("product_uuid" "uuid") IS 'Returns the minimum fixed_price from all sizes enabled for a product';



CREATE OR REPLACE FUNCTION "public"."get_product_pricings"("product_uuid" "uuid") RETURNS TABLE("pricing_id" "uuid", "size_id" "uuid", "fixed_price" numeric, "display_label" "text", "width_in" integer, "height_in" integer, "long_side_in" integer, "short_side_in" integer)
    LANGUAGE "sql" STABLE
    AS $$
  select
    pp.id as pricing_id,
    pp.size_id,
    pp.fixed_price,
    s.display_label,
    s.width_in,
    s.height_in,
    s.long_side_in,
    s.short_side_in
  from public.product_pricings pp
  inner join public.sizes s on s.id = pp.size_id
  where pp.product_id = product_uuid
    and pp.active = true
    and s.active = true
  order by pp.fixed_price;
$$;


ALTER FUNCTION "public"."get_product_pricings"("product_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_product_pricings"("product_uuid" "uuid") IS 'Returns all active pricings with size details for a given product';



CREATE OR REPLACE FUNCTION "public"."get_product_reviews"("product_uuid" "uuid", "limit_count" integer DEFAULT 10, "offset_count" integer DEFAULT 0) RETURNS TABLE("review_id" "uuid", "rating" integer, "title" character varying, "review_text" "text", "customer_name" character varying, "verified_purchase" boolean, "helpful_count" integer, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as review_id,
        r.rating,
        r.title,
        r.review_text,
        r.customer_name,
        r.verified_purchase,
        r.helpful_count,
        r.created_at
    FROM product_reviews r
    WHERE (r.product_id = product_uuid OR r.art_product_id = product_uuid)
    AND r.status = 'approved'
    ORDER BY r.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;


ALTER FUNCTION "public"."get_product_reviews"("product_uuid" "uuid", "limit_count" integer, "offset_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_product_reviews"("product_uuid" "uuid", "limit_count" integer, "offset_count" integer) IS 'Returns approved reviews for a specific product';



CREATE OR REPLACE FUNCTION "public"."get_product_search_text"("product_id" "uuid") RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT 
    p.name || ' ' || 
    COALESCE(p.description, '') || ' ' ||
    COALESCE(
      (
        SELECT string_agg(c.name, ' ')
        FROM categories c
        INNER JOIN product_categories pc ON c.id = pc.category_id
        WHERE pc.product_id = p.id
      ),
      ''
    )
  FROM products p
  WHERE p.id = product_id;
$$;


ALTER FUNCTION "public"."get_product_search_text"("product_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_product_search_text"("product_id" "uuid") IS 'Get searchable text for a product including category name';



CREATE OR REPLACE FUNCTION "public"."get_product_tags"("product_uuid" "uuid") RETURNS TABLE("id" "uuid", "name" character varying, "slug" character varying, "color" character varying, "description" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, t.slug, t.color, t.description
  FROM tags t
  INNER JOIN product_tags pt ON t.id = pt.tag_id
  WHERE pt.product_id = product_uuid
  ORDER BY t.name;
END;
$$;


ALTER FUNCTION "public"."get_product_tags"("product_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_products_with_min_size_price"("product_ids" "uuid"[]) RETURNS TABLE("product_id" "uuid", "min_size_price" numeric)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    p.id,
    MIN(s.fixed_price) as min_size_price
  FROM unnest(product_ids) AS product_id
  INNER JOIN products p ON p.id = product_id
  CROSS JOIN LATERAL jsonb_array_elements_text(
    COALESCE(p.config->>'allowedSizes', '[]')::jsonb
  ) AS size_id
  INNER JOIN sizes s ON s.id::text = size_id
  WHERE p.active = true
    AND s.fixed_price IS NOT NULL
    AND s.active = true
  GROUP BY p.id;
$$;


ALTER FUNCTION "public"."get_products_with_min_size_price"("product_ids" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_products_with_min_size_price"("product_ids" "uuid"[]) IS 'Returns multiple products with their minimum size prices';



CREATE OR REPLACE FUNCTION "public"."get_rating_distribution"("product_uuid" "uuid") RETURNS TABLE("rating" integer, "count" bigint, "percentage" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH rating_counts AS (
        SELECT 
            r.rating,
            COUNT(*) as count
        FROM product_reviews r
        WHERE (r.product_id = product_uuid OR r.art_product_id = product_uuid)
        AND r.status = 'approved'
        GROUP BY r.rating
    ),
    total AS (
        SELECT SUM(count) as total_reviews FROM rating_counts
    )
    SELECT 
        rc.rating,
        rc.count,
        CASE 
            WHEN t.total_reviews > 0 THEN (rc.count::DECIMAL / t.total_reviews * 100)
            ELSE 0
        END as percentage
    FROM rating_counts rc
    CROSS JOIN total t
    ORDER BY rc.rating DESC;
END;
$$;


ALTER FUNCTION "public"."get_rating_distribution"("product_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_rating_distribution"("product_uuid" "uuid") IS 'Returns rating distribution (1-5 stars) for a product';



CREATE OR REPLACE FUNCTION "public"."get_room_hotspots"("room_uuid" "uuid") RETURNS TABLE("hotspot_id" "uuid", "position_x" numeric, "position_y" numeric, "display_order" integer, "product_name" character varying, "product_slug" character varying, "product_price" character varying, "thumbnail_image" "text", "product_type" character varying)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id as hotspot_id,
        h.position_x,
        h.position_y,
        h.display_order,
        COALESCE(h.label, p.name, a.name)::VARCHAR as product_name,
        COALESCE(p.slug, a.slug)::VARCHAR as product_slug,
        COALESCE(p.price::TEXT, a.price) as product_price,
        COALESCE(p.images[1], a.images[1]) as thumbnail_image,
        CASE 
            WHEN p.id IS NOT NULL THEN 'customizable'
            WHEN a.id IS NOT NULL THEN 'art'
            ELSE 'unknown'
        END::VARCHAR as product_type
    FROM room_hotspots h
    LEFT JOIN products p ON h.product_id = p.id
    LEFT JOIN art_products a ON h.art_product_id = a.id
    WHERE h.room_id = room_uuid
    AND h.is_active = true
    ORDER BY h.display_order;
END;
$$;


ALTER FUNCTION "public"."get_room_hotspots"("room_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_room_hotspots"("room_uuid" "uuid") IS 'Returns all active hotspots for a specific room with product details';



CREATE OR REPLACE FUNCTION "public"."get_setting"("key" character varying, "default_value" "jsonb" DEFAULT NULL::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT setting_value INTO result
    FROM site_settings
    WHERE setting_key = key;
    
    IF NOT FOUND THEN
        RETURN default_value;
    END IF;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_setting"("key" character varying, "default_value" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_setting"("key" character varying, "default_value" "jsonb") IS 'Retrieves a setting value by key, returns default if not found';



CREATE OR REPLACE FUNCTION "public"."is_promotion_valid"("promotion_code" character varying, "order_total" numeric, "order_categories" "text"[] DEFAULT ARRAY['all'::"text"]) RETURNS TABLE("valid" boolean, "discount_amount" numeric, "error_message" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    promo RECORD;
    calculated_discount DECIMAL(10, 2);
BEGIN
    -- Find promotion
    SELECT * INTO promo
    FROM promotions
    WHERE code = promotion_code
    AND is_active = true
    AND start_date <= CURRENT_DATE
    AND end_date >= CURRENT_DATE;

    -- Check if promotion exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10, 2), 'Invalid or expired promotion code';
        RETURN;
    END IF;

    -- Check if max uses reached
    IF promo.max_uses IS NOT NULL AND promo.used_count >= promo.max_uses THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10, 2), 'Promotion code has reached maximum uses';
        RETURN;
    END IF;

    -- Check minimum order value
    IF order_total < promo.min_order THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10, 2), 
            'Order total must be at least £' || promo.min_order::TEXT;
        RETURN;
    END IF;

    -- Calculate discount
    CASE promo.type
        WHEN 'percentage' THEN
            calculated_discount := (order_total * promo.value / 100);
        WHEN 'fixed_amount' THEN
            calculated_discount := LEAST(promo.value, order_total); -- Can't exceed order total
        WHEN 'free_shipping' THEN
            calculated_discount := 0; -- Handled separately in checkout
        ELSE
            calculated_discount := 0;
    END CASE;

    -- Return success
    RETURN QUERY SELECT true, calculated_discount, ''::TEXT;
END;
$$;


ALTER FUNCTION "public"."is_promotion_valid"("promotion_code" character varying, "order_total" numeric, "order_categories" "text"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_promotion_valid"("promotion_code" character varying, "order_total" numeric, "order_categories" "text"[]) IS 'Validates a promotion code and calculates discount amount';



CREATE OR REPLACE FUNCTION "public"."search_products_semantic"("query_embedding" "public"."vector", "match_threshold" double precision DEFAULT 0.1, "match_count" integer DEFAULT 8) RETURNS TABLE("id" "uuid", "name" character varying, "slug" character varying, "description" "text", "images" "text"[], "price" numeric, "is_featured" boolean, "category_name" character varying, "similarity" double precision)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.images,
    p.price,
    p.is_featured,
    (
      SELECT c.name 
      FROM categories c
      INNER JOIN product_categories pc ON c.id = pc.category_id
      WHERE pc.product_id = p.id
      LIMIT 1
    ) as category_name,
    1 - (p.name_embedding <=> query_embedding) as similarity
  FROM products p
  WHERE 
    p.active = true
    AND p.name_embedding IS NOT NULL
    AND 1 - (p.name_embedding <=> query_embedding) > match_threshold
  ORDER BY p.name_embedding <=> query_embedding ASC
  LIMIT match_count;
$$;


ALTER FUNCTION "public"."search_products_semantic"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."search_products_semantic"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) IS 'Semantic search using vector similarity (cosine distance)';



CREATE OR REPLACE FUNCTION "public"."set_setting"("key" character varying, "value" "jsonb", "type" character varying DEFAULT 'json'::character varying, "category_name" character varying DEFAULT 'general'::character varying, "description_text" "text" DEFAULT NULL::"text", "public" boolean DEFAULT false) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description, is_public)
    VALUES (key, value, type, category_name, description_text, public)
    ON CONFLICT (setting_key) 
    DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        setting_type = EXCLUDED.setting_type,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        is_public = EXCLUDED.is_public,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."set_setting"("key" character varying, "value" "jsonb", "type" character varying, "category_name" character varying, "description_text" "text", "public" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_setting"("key" character varying, "value" "jsonb", "type" character varying, "category_name" character varying, "description_text" "text", "public" boolean) IS 'Inserts or updates a setting value';



CREATE OR REPLACE FUNCTION "public"."sync_featured_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.featured_index IS NOT NULL THEN
    NEW.is_featured := true;
  ELSE
    NEW.is_featured := false;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_featured_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_product_pricings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_product_pricings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_product_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update for regular products
    IF NEW.product_id IS NOT NULL THEN
        UPDATE products
        SET 
            average_rating = (
                SELECT AVG(rating)::DECIMAL(3, 2)
                FROM product_reviews
                WHERE product_id = NEW.product_id
                AND status = 'approved'
            ),
            review_count = (
                SELECT COUNT(*)
                FROM product_reviews
                WHERE product_id = NEW.product_id
                AND status = 'approved'
            )
        WHERE id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_product_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_product_rating_on_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update for regular products
    IF OLD.product_id IS NOT NULL THEN
        UPDATE products
        SET 
            average_rating = (
                SELECT AVG(rating)::DECIMAL(3, 2)
                FROM product_reviews
                WHERE product_id = OLD.product_id
                AND status = 'approved'
            ),
            review_count = (
                SELECT COUNT(*)
                FROM product_reviews
                WHERE product_id = OLD.product_id
                AND status = 'approved'
            )
        WHERE id = OLD.product_id;
    END IF;
    
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."update_product_rating_on_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_products_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_products_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_rooms_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_rooms_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."art_product_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "art_product_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."art_product_tags" OWNER TO "postgres";


COMMENT ON TABLE "public"."art_product_tags" IS 'Junction table for many-to-many relationship between art_products and tags';



COMMENT ON COLUMN "public"."art_product_tags"."art_product_id" IS 'Reference to the art product';



COMMENT ON COLUMN "public"."art_product_tags"."tag_id" IS 'Reference to the tag';



CREATE TABLE IF NOT EXISTS "public"."art_products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "description" "text",
    "image" "text" NOT NULL,
    "category" character varying(100) NOT NULL,
    "price" character varying(50) NOT NULL,
    "size" character varying(100) NOT NULL,
    "is_bestseller" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "images" "text"[] DEFAULT ARRAY[]::"text"[],
    "product_type" character varying(50) DEFAULT 'Canvas'::character varying,
    "customization_product_id" "uuid",
    "allow_customization" boolean DEFAULT false,
    "meta_title" "text",
    "meta_description" "text",
    "meta_keywords" "text"[],
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "specifications" "jsonb" DEFAULT '[]'::"jsonb",
    "trust_badges" "jsonb" DEFAULT '[]'::"jsonb",
    "available_sizes" "jsonb" DEFAULT '[]'::"jsonb",
    "stock_quantity" integer DEFAULT 0,
    "status" character varying(20) DEFAULT 'active'::character varying,
    CONSTRAINT "art_products_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'draft'::character varying])::"text"[])))
);


ALTER TABLE "public"."art_products" OWNER TO "postgres";


COMMENT ON COLUMN "public"."art_products"."images" IS 'Array of image URLs (Supabase Storage), reorderable';



COMMENT ON COLUMN "public"."art_products"."product_type" IS 'Canvas, T-shirt, Poster, Framed Print, Mug, etc.';



COMMENT ON COLUMN "public"."art_products"."customization_product_id" IS 'Links to products table for customization redirect';



COMMENT ON COLUMN "public"."art_products"."features" IS 'JSONB array of feature strings';



COMMENT ON COLUMN "public"."art_products"."specifications" IS 'JSONB array of {label, value} objects';



COMMENT ON COLUMN "public"."art_products"."available_sizes" IS 'JSONB: [{"size_id": "uuid", "price": 29.99, "image_url": "https://..."}] - Each size has its own image';



CREATE TABLE IF NOT EXISTS "public"."aspect_ratios" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "label" "text" NOT NULL,
    "width_ratio" integer NOT NULL,
    "height_ratio" integer NOT NULL,
    "orientation" "text" NOT NULL,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "aspect_ratios_orientation_check" CHECK (("orientation" = ANY (ARRAY['portrait'::"text", 'landscape'::"text", 'square'::"text"])))
);


ALTER TABLE "public"."aspect_ratios" OWNER TO "postgres";


COMMENT ON TABLE "public"."aspect_ratios" IS 'Stores aspect ratios for product sizing (e.g., 2:3, 16:9)';



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "slug" character varying(100) NOT NULL,
    "description" "text",
    "icon" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "display_order" integer DEFAULT 0,
    "bg_color" character varying(7) DEFAULT '#e8e4df'::character varying,
    "is_active" boolean DEFAULT true,
    "image_url" "text",
    "seo_title" "text",
    "seo_description" "text",
    "seo_keywords" "text"[],
    "meta_robots" "text" DEFAULT 'index, follow'::"text",
    "canonical_url" "text",
    "og_title" "text",
    "og_description" "text",
    "og_image" "text"
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


COMMENT ON COLUMN "public"."categories"."image_url" IS 'URL of the category image (replaces icon for visual representation)';



CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "name" character varying(255) NOT NULL,
    "phone" character varying(50),
    "total_orders" integer DEFAULT 0,
    "total_spent" numeric(10,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid",
    "product_id" "uuid",
    "product_name" character varying(255) NOT NULL,
    "product_image" "text",
    "quantity" integer NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "size" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_number" character varying(50) NOT NULL,
    "customer_email" character varying(255) NOT NULL,
    "customer_name" character varying(255) NOT NULL,
    "customer_phone" character varying(50),
    "shipping_address" "jsonb" NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "subtotal" numeric(10,2) NOT NULL,
    "shipping_cost" numeric(10,2) DEFAULT 0,
    "total" numeric(10,2) NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "items" "jsonb" DEFAULT '[]'::"jsonb",
    "stripe_session_id" "text",
    "stripe_payment_intent_id" "text",
    "payment_status" "text" DEFAULT 'pending'::"text",
    "video_permission" boolean DEFAULT false,
    "estimated_delivery" "date",
    "paid_at" timestamp with time zone,
    "shipped_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "shipping_postcode" character varying(50),
    "hosted_invoice_url" "text",
    "remarks" "text",
    "cancelled_at" timestamp with time zone,
    CONSTRAINT "orders_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'failed'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


COMMENT ON COLUMN "public"."orders"."items" IS 'JSONB array of order items with product details';



COMMENT ON COLUMN "public"."orders"."stripe_session_id" IS 'Stripe Checkout Session ID';



COMMENT ON COLUMN "public"."orders"."stripe_payment_intent_id" IS 'Stripe Payment Intent ID';



COMMENT ON COLUMN "public"."orders"."payment_status" IS 'Payment status: pending, paid, failed, refunded';



COMMENT ON COLUMN "public"."orders"."video_permission" IS 'Customer consent for order preparation video';



COMMENT ON COLUMN "public"."orders"."hosted_invoice_url" IS 'Hosted invoice URL for the order';



COMMENT ON COLUMN "public"."orders"."remarks" IS 'Optional remarks for the order';



COMMENT ON COLUMN "public"."orders"."cancelled_at" IS 'Timestamp when order was cancelled';



CREATE TABLE IF NOT EXISTS "public"."photify_uploads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image" "text" NOT NULL,
    "ratio" "text" DEFAULT '1:1'::"text",
    "ordered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "inches" "text" DEFAULT ''::"text",
    "edge_type" "text" DEFAULT ''::"text",
    "quantity" integer DEFAULT 1,
    "total_price" numeric(10,2) DEFAULT 0,
    "total_price_after_discount" numeric(10,2) DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."photify_uploads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."product_categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."product_categories" IS 'Junction table for many-to-many relationship between products and categories';



COMMENT ON COLUMN "public"."product_categories"."product_id" IS 'Reference to the product';



COMMENT ON COLUMN "public"."product_categories"."category_id" IS 'Reference to the category';



CREATE TABLE IF NOT EXISTS "public"."product_pricings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "size_id" "uuid" NOT NULL,
    "fixed_price" numeric(10,2) NOT NULL,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_pricings" OWNER TO "postgres";


COMMENT ON TABLE "public"."product_pricings" IS 'Stores pricing for product-size combinations';



COMMENT ON COLUMN "public"."product_pricings"."product_id" IS 'Reference to the product';



COMMENT ON COLUMN "public"."product_pricings"."size_id" IS 'Reference to the size option';



COMMENT ON COLUMN "public"."product_pricings"."fixed_price" IS 'Fixed price for this product-size combination';



COMMENT ON COLUMN "public"."product_pricings"."active" IS 'Whether this pricing is currently active';



COMMENT ON COLUMN "public"."product_pricings"."created_at" IS 'Timestamp when the pricing was created';



COMMENT ON COLUMN "public"."product_pricings"."updated_at" IS 'Timestamp when the pricing was last updated';



CREATE TABLE IF NOT EXISTS "public"."product_reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid",
    "art_product_id" "uuid",
    "customer_id" "uuid",
    "order_id" "uuid",
    "customer_name" character varying(255) NOT NULL,
    "customer_email" character varying(255) NOT NULL,
    "rating" integer NOT NULL,
    "title" character varying(255),
    "review_text" "text",
    "verified_purchase" boolean DEFAULT false,
    "helpful_count" integer DEFAULT 0,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "admin_response" "text",
    "admin_responded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "product_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "review_has_product" CHECK ((("product_id" IS NOT NULL) OR ("art_product_id" IS NOT NULL)))
);


ALTER TABLE "public"."product_reviews" OWNER TO "postgres";


COMMENT ON TABLE "public"."product_reviews" IS 'Customer reviews and ratings for products';



COMMENT ON COLUMN "public"."product_reviews"."product_id" IS 'Reference to customizable products';



COMMENT ON COLUMN "public"."product_reviews"."art_product_id" IS 'Reference to art collection products';



COMMENT ON COLUMN "public"."product_reviews"."rating" IS 'Star rating from 1 to 5';



COMMENT ON COLUMN "public"."product_reviews"."verified_purchase" IS 'True if customer actually purchased this product';



COMMENT ON COLUMN "public"."product_reviews"."helpful_count" IS 'Number of users who found this review helpful';



COMMENT ON COLUMN "public"."product_reviews"."status" IS 'Moderation status: pending, approved, or rejected';



CREATE TABLE IF NOT EXISTS "public"."product_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_tags" OWNER TO "postgres";


COMMENT ON TABLE "public"."product_tags" IS 'Junction table for many-to-many relationship between products and tags';



COMMENT ON COLUMN "public"."product_tags"."product_id" IS 'Reference to the product';



COMMENT ON COLUMN "public"."product_tags"."tag_id" IS 'Reference to the tag';



CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "old_price" numeric(10,2),
    "images" "text"[],
    "is_featured" boolean DEFAULT false,
    "is_bestseller" boolean DEFAULT false,
    "stock_quantity" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "product_type" "text" DEFAULT 'canvas'::"text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "config_status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "config_version" integer DEFAULT 1 NOT NULL,
    "config_updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "seo_title" "text",
    "seo_description" "text",
    "seo_keywords" "text"[],
    "meta_robots" "text" DEFAULT 'index,follow'::"text",
    "canonical_url" "text",
    "og_title" "text",
    "og_description" "text",
    "og_image" "text",
    "content_sections" "jsonb" DEFAULT '[]'::"jsonb",
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "specifications" "jsonb" DEFAULT '[]'::"jsonb",
    "trust_badges" "jsonb" DEFAULT '[]'::"jsonb",
    "average_rating" numeric(2,1) DEFAULT 0.0,
    "review_count" integer DEFAULT 0,
    "featured_index" integer,
    "featured_image" "text",
    "fixed_price" numeric(10,2),
    CONSTRAINT "products_config_active_check" CHECK ((("config_status" <> 'active'::"text") OR (("jsonb_typeof"("config") = 'object'::"text") AND ("config" <> '{}'::"jsonb")))),
    CONSTRAINT "products_config_status_check" CHECK (("config_status" = ANY (ARRAY['draft'::"text", 'active'::"text"]))),
    CONSTRAINT "products_featured_index_check" CHECK ((("featured_index" >= 1) AND ("featured_index" <= 4))),
    CONSTRAINT "products_product_type_check" CHECK (("product_type" = ANY (ARRAY['canvas'::"text", 'framed_canvas'::"text", 'metal_print'::"text"])))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON COLUMN "public"."products"."price" IS 'Base price per square inch for this product type';



COMMENT ON COLUMN "public"."products"."old_price" IS 'Old/discounted price per square inch (optional)';



COMMENT ON COLUMN "public"."products"."product_type" IS 'Type of product: canvas, framed_canvas, or metal_print';



COMMENT ON COLUMN "public"."products"."active" IS 'Whether the product is active and visible to customers';



COMMENT ON COLUMN "public"."products"."config" IS 'JSONB configuration for product variants, pricing, and options';



COMMENT ON COLUMN "public"."products"."config_status" IS 'Configuration status: draft or active';



COMMENT ON COLUMN "public"."products"."config_version" IS 'Version number for config changes tracking';



COMMENT ON COLUMN "public"."products"."config_updated_at" IS 'Timestamp of last config update';



COMMENT ON COLUMN "public"."products"."seo_title" IS 'SEO optimized title (50-60 chars)';



COMMENT ON COLUMN "public"."products"."seo_description" IS 'Meta description (150-160 chars)';



COMMENT ON COLUMN "public"."products"."seo_keywords" IS 'Array of SEO keywords';



COMMENT ON COLUMN "public"."products"."meta_robots" IS 'Robots meta tag directives';



COMMENT ON COLUMN "public"."products"."canonical_url" IS 'Canonical URL for SEO';



COMMENT ON COLUMN "public"."products"."og_title" IS 'Open Graph title';



COMMENT ON COLUMN "public"."products"."og_description" IS 'Open Graph description';



COMMENT ON COLUMN "public"."products"."og_image" IS 'Open Graph image URL';



COMMENT ON COLUMN "public"."products"."content_sections" IS 'Flexible content sections for product page';



COMMENT ON COLUMN "public"."products"."features" IS 'Array of product features';



COMMENT ON COLUMN "public"."products"."specifications" IS 'Array of product specifications {label, value}';



COMMENT ON COLUMN "public"."products"."trust_badges" IS 'Trust badges/USPs to display';



COMMENT ON COLUMN "public"."products"."average_rating" IS 'Average rating (0-5)';



COMMENT ON COLUMN "public"."products"."review_count" IS 'Total number of reviews';



COMMENT ON COLUMN "public"."products"."featured_index" IS 'Homepage featured position (1=large left, 2=top right, 3=top right, 4=bottom right). NULL if not featured.';



COMMENT ON COLUMN "public"."products"."featured_image" IS 'Dedicated image for featured display. Index 1: 14:9 ratio, Index 2-3: 1:1 ratio, Index 4: 21:9 ratio';



CREATE TABLE IF NOT EXISTS "public"."promotions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "code" character varying(50) NOT NULL,
    "description" "text",
    "type" character varying(50) NOT NULL,
    "value" numeric(10,2) DEFAULT 0 NOT NULL,
    "min_order" numeric(10,2) DEFAULT 0,
    "max_uses" integer,
    "used_count" integer DEFAULT 0,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "is_active" boolean DEFAULT true,
    "categories" "text"[] DEFAULT ARRAY['all'::"text"],
    "excluded_product_ids" "uuid"[] DEFAULT ARRAY[]::"uuid"[],
    "first_order_only" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_featured" boolean DEFAULT false
);


ALTER TABLE "public"."promotions" OWNER TO "postgres";


COMMENT ON TABLE "public"."promotions" IS 'Promotional discount codes and campaigns';



COMMENT ON COLUMN "public"."promotions"."code" IS 'Unique promotion code (e.g., SAVE20, FREESHIP)';



COMMENT ON COLUMN "public"."promotions"."type" IS 'Discount type: percentage, fixed_amount, or free_shipping';



COMMENT ON COLUMN "public"."promotions"."value" IS 'Discount value: percentage (e.g., 20 for 20%) or fixed amount (e.g., 10 for £10)';



COMMENT ON COLUMN "public"."promotions"."min_order" IS 'Minimum order value required to use promotion';



COMMENT ON COLUMN "public"."promotions"."max_uses" IS 'Maximum number of times promotion can be used (NULL = unlimited)';



COMMENT ON COLUMN "public"."promotions"."used_count" IS 'Number of times promotion has been used';



COMMENT ON COLUMN "public"."promotions"."categories" IS 'Array of category slugs or [''all''] for all categories';



COMMENT ON COLUMN "public"."promotions"."excluded_product_ids" IS 'Array of product IDs excluded from promotion';



COMMENT ON COLUMN "public"."promotions"."first_order_only" IS 'If true, only valid for customers'' first order';



CREATE TABLE IF NOT EXISTS "public"."room_hotspots" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "room_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "art_product_id" "uuid",
    "position_x" numeric(5,2) NOT NULL,
    "position_y" numeric(5,2) NOT NULL,
    "display_order" integer DEFAULT 0,
    "label" character varying(255),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "art_size_id" "uuid",
    CONSTRAINT "hotspot_has_product" CHECK ((("product_id" IS NOT NULL) OR ("art_product_id" IS NOT NULL))),
    CONSTRAINT "room_hotspots_position_x_check" CHECK ((("position_x" >= (0)::numeric) AND ("position_x" <= (100)::numeric))),
    CONSTRAINT "room_hotspots_position_y_check" CHECK ((("position_y" >= (0)::numeric) AND ("position_y" <= (100)::numeric)))
);


ALTER TABLE "public"."room_hotspots" OWNER TO "postgres";


COMMENT ON TABLE "public"."room_hotspots" IS 'Interactive product markers on room inspiration images';



COMMENT ON COLUMN "public"."room_hotspots"."room_id" IS 'Reference to rooms table';



COMMENT ON COLUMN "public"."room_hotspots"."product_id" IS 'Reference to customizable products';



COMMENT ON COLUMN "public"."room_hotspots"."art_product_id" IS 'Reference to art collection products';



COMMENT ON COLUMN "public"."room_hotspots"."position_x" IS 'Horizontal position as percentage (0-100) from left';



COMMENT ON COLUMN "public"."room_hotspots"."position_y" IS 'Vertical position as percentage (0-100) from top';



COMMENT ON COLUMN "public"."room_hotspots"."display_order" IS 'Order in which hotspots appear (lower = first)';



COMMENT ON COLUMN "public"."room_hotspots"."label" IS 'Optional custom label for hotspot (overrides product name)';



COMMENT ON COLUMN "public"."room_hotspots"."art_size_id" IS 'Selected size for art products from sizes table (required if art_product_id is set)';



CREATE TABLE IF NOT EXISTS "public"."rooms" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "image" "text" NOT NULL,
    "product_count" integer DEFAULT 0,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "seo_title" "text",
    "seo_description" "text",
    "seo_keywords" "text"[],
    "canonical_url" "text",
    "og_title" "text",
    "og_description" "text",
    "og_image" "text"
);


ALTER TABLE "public"."rooms" OWNER TO "postgres";


COMMENT ON COLUMN "public"."rooms"."seo_title" IS 'SEO optimized page title (50-60 characters recommended)';



COMMENT ON COLUMN "public"."rooms"."seo_description" IS 'SEO meta description (150-160 characters recommended)';



COMMENT ON COLUMN "public"."rooms"."seo_keywords" IS 'Array of SEO keywords for the room';



COMMENT ON COLUMN "public"."rooms"."canonical_url" IS 'Canonical URL for the room page';



COMMENT ON COLUMN "public"."rooms"."og_title" IS 'Open Graph title for social media sharing';



COMMENT ON COLUMN "public"."rooms"."og_description" IS 'Open Graph description for social media sharing';



COMMENT ON COLUMN "public"."rooms"."og_image" IS 'Open Graph image URL for social media sharing';



CREATE TABLE IF NOT EXISTS "public"."site_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "setting_key" character varying(100) NOT NULL,
    "setting_value" "jsonb" NOT NULL,
    "setting_type" character varying(50) NOT NULL,
    "category" character varying(50) NOT NULL,
    "description" "text",
    "is_public" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."site_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."site_settings" IS 'Centralized site configuration and settings';



COMMENT ON COLUMN "public"."site_settings"."setting_key" IS 'Unique key for the setting (e.g., shipping_flat_rate)';



COMMENT ON COLUMN "public"."site_settings"."setting_value" IS 'JSONB value allowing flexible data types';



COMMENT ON COLUMN "public"."site_settings"."setting_type" IS 'Data type: text, number, boolean, json, email';



COMMENT ON COLUMN "public"."site_settings"."category" IS 'Setting category for organization';



COMMENT ON COLUMN "public"."site_settings"."is_public" IS 'If true, setting can be read by unauthenticated users';



CREATE TABLE IF NOT EXISTS "public"."sizes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "aspect_ratio_id" "uuid" NOT NULL,
    "width_in" integer NOT NULL,
    "height_in" integer NOT NULL,
    "display_label" "text" NOT NULL,
    "area_in2" numeric GENERATED ALWAYS AS (("width_in" * "height_in")) STORED,
    "long_side_in" integer GENERATED ALWAYS AS (GREATEST("width_in", "height_in")) STORED,
    "short_side_in" integer GENERATED ALWAYS AS (LEAST("width_in", "height_in")) STORED,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "fixed_price" numeric(10,2)
);


ALTER TABLE "public"."sizes" OWNER TO "postgres";


COMMENT ON TABLE "public"."sizes" IS 'Specific dimensional sizes derived from aspect ratios';



COMMENT ON COLUMN "public"."sizes"."area_in2" IS 'Computed area in square inches';



COMMENT ON COLUMN "public"."sizes"."long_side_in" IS 'Computed longest side dimension';



COMMENT ON COLUMN "public"."sizes"."short_side_in" IS 'Computed shortest side dimension';



CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "slug" character varying(50) NOT NULL,
    "color" character varying(20) DEFAULT '#f63a9e'::character varying,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


COMMENT ON TABLE "public"."tags" IS 'Product tags for categorization and filtering';



COMMENT ON COLUMN "public"."tags"."name" IS 'Display name of the tag';



COMMENT ON COLUMN "public"."tags"."slug" IS 'URL-friendly slug';



COMMENT ON COLUMN "public"."tags"."color" IS 'Badge color for display (hex or Tailwind class)';



CREATE OR REPLACE VIEW "public"."v_categories_with_counts" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::character varying(100) AS "name",
    NULL::character varying(100) AS "slug",
    NULL::"text" AS "description",
    NULL::character varying(50) AS "icon",
    NULL::timestamp with time zone AS "created_at",
    NULL::timestamp with time zone AS "updated_at",
    NULL::integer AS "display_order",
    NULL::character varying(7) AS "bg_color",
    NULL::boolean AS "is_active",
    NULL::"text" AS "image_url",
    NULL::bigint AS "product_count",
    NULL::bigint AS "active_product_count";


ALTER VIEW "public"."v_categories_with_counts" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_product_pricings_with_sizes" AS
 SELECT "pp"."id" AS "pricing_id",
    "pp"."product_id",
    "pp"."size_id",
    "pp"."fixed_price",
    "pp"."active" AS "pricing_active",
    "pp"."created_at" AS "pricing_created_at",
    "pp"."updated_at" AS "pricing_updated_at",
    "s"."display_label" AS "size_label",
    "s"."width_in",
    "s"."height_in",
    "s"."area_in2",
    "s"."long_side_in",
    "s"."short_side_in",
    "s"."active" AS "size_active",
    "ar"."label" AS "aspect_ratio_label"
   FROM (("public"."product_pricings" "pp"
     JOIN "public"."sizes" "s" ON (("s"."id" = "pp"."size_id")))
     JOIN "public"."aspect_ratios" "ar" ON (("ar"."id" = "s"."aspect_ratio_id")));


ALTER VIEW "public"."v_product_pricings_with_sizes" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_product_pricings_with_sizes" IS 'Product pricings joined with size and aspect ratio label';



CREATE OR REPLACE VIEW "public"."v_product_reviews_with_details" AS
 SELECT "r"."id",
    "r"."rating",
    "r"."title",
    "r"."review_text",
    "r"."customer_name",
    "r"."verified_purchase",
    "r"."helpful_count",
    "r"."status",
    "r"."admin_response",
    "r"."created_at",
    "p"."id" AS "product_id",
    "p"."name" AS "product_name",
    "p"."slug" AS "product_slug",
    "a"."id" AS "art_product_id",
    "a"."name" AS "art_product_name",
    "a"."slug" AS "art_product_slug",
    COALESCE("p"."name", "a"."name") AS "item_name",
    COALESCE("p"."slug", "a"."slug") AS "item_slug"
   FROM (("public"."product_reviews" "r"
     LEFT JOIN "public"."products" "p" ON (("r"."product_id" = "p"."id")))
     LEFT JOIN "public"."art_products" "a" ON (("r"."art_product_id" = "a"."id")))
  WHERE (("r"."status")::"text" = 'approved'::"text")
  ORDER BY "r"."created_at" DESC;


ALTER VIEW "public"."v_product_reviews_with_details" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_product_reviews_with_details" IS 'Approved reviews with full product details';



CREATE OR REPLACE VIEW "public"."v_products_with_min_price" AS
 SELECT "id",
    "name",
    "slug",
    "images",
    "price",
    "fixed_price",
    "is_featured",
    "active",
    "product_type",
    "config",
    "public"."get_product_min_size_price"("id") AS "min_size_price",
    COALESCE(NULLIF("public"."get_product_min_size_price"("id"), (0)::numeric), "fixed_price", "price") AS "display_price"
   FROM "public"."products" "p"
  WHERE ("active" = true);


ALTER VIEW "public"."v_products_with_min_price" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_room_hotspots_with_products" AS
 SELECT "h"."id",
    "h"."room_id",
    "h"."position_x",
    "h"."position_y",
    "h"."display_order",
    "h"."label",
    "h"."is_active",
    "p"."id" AS "product_id",
    "p"."name" AS "product_name",
    "p"."slug" AS "product_slug",
    "p"."price" AS "product_price",
    "p"."images" AS "product_images",
    'product'::"text" AS "product_type",
    "a"."id" AS "art_product_id",
    "a"."name" AS "art_product_name",
    "a"."slug" AS "art_product_slug",
    "a"."price" AS "art_product_price",
    "a"."images" AS "art_product_images",
    COALESCE("h"."label", "p"."name", "a"."name") AS "display_name",
    COALESCE("p"."slug", "a"."slug") AS "product_link",
    COALESCE("p"."images"[1], "a"."images"[1]) AS "thumbnail_image"
   FROM (("public"."room_hotspots" "h"
     LEFT JOIN "public"."products" "p" ON (("h"."product_id" = "p"."id")))
     LEFT JOIN "public"."art_products" "a" ON (("h"."art_product_id" = "a"."id")))
  WHERE ("h"."is_active" = true)
  ORDER BY "h"."room_id", "h"."display_order";


ALTER VIEW "public"."v_room_hotspots_with_products" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_room_hotspots_with_products" IS 'Room hotspots with full product details for easy querying';



CREATE OR REPLACE VIEW "public"."v_settings_by_category" AS
 SELECT "category",
    "setting_key",
    "setting_value",
    "setting_type",
    "description",
    "is_public",
    "updated_at"
   FROM "public"."site_settings"
  ORDER BY "category", "setting_key";


ALTER VIEW "public"."v_settings_by_category" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_settings_by_category" IS 'Settings organized by category for easy browsing';



CREATE OR REPLACE VIEW "public"."v_sizes_with_ratios" AS
 SELECT "s"."id",
    "s"."width_in",
    "s"."height_in",
    "s"."display_label",
    "s"."area_in2",
    "s"."long_side_in",
    "s"."short_side_in",
    "s"."active",
    "s"."created_at",
    "ar"."label" AS "ratio_label",
    "ar"."width_ratio",
    "ar"."height_ratio",
    "ar"."orientation"
   FROM ("public"."sizes" "s"
     JOIN "public"."aspect_ratios" "ar" ON (("s"."aspect_ratio_id" = "ar"."id")));


ALTER VIEW "public"."v_sizes_with_ratios" OWNER TO "postgres";


ALTER TABLE ONLY "public"."art_product_tags"
    ADD CONSTRAINT "art_product_tags_art_product_id_tag_id_key" UNIQUE ("art_product_id", "tag_id");



ALTER TABLE ONLY "public"."art_product_tags"
    ADD CONSTRAINT "art_product_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."art_products"
    ADD CONSTRAINT "art_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."art_products"
    ADD CONSTRAINT "art_products_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."aspect_ratios"
    ADD CONSTRAINT "aspect_ratios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_order_number_key" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photify_uploads"
    ADD CONSTRAINT "photify_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_product_id_category_id_key" UNIQUE ("product_id", "category_id");



ALTER TABLE ONLY "public"."product_pricings"
    ADD CONSTRAINT "product_pricings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_pricings"
    ADD CONSTRAINT "product_pricings_product_size_unique" UNIQUE ("product_id", "size_id");



ALTER TABLE ONLY "public"."product_reviews"
    ADD CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_tags"
    ADD CONSTRAINT "product_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_tags"
    ADD CONSTRAINT "product_tags_product_id_tag_id_key" UNIQUE ("product_id", "tag_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."promotions"
    ADD CONSTRAINT "promotions_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."promotions"
    ADD CONSTRAINT "promotions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."room_hotspots"
    ADD CONSTRAINT "room_hotspots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_setting_key_key" UNIQUE ("setting_key");



ALTER TABLE ONLY "public"."sizes"
    ADD CONSTRAINT "sizes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_slug_key" UNIQUE ("slug");



CREATE INDEX "idx_art_product_tags_art_product" ON "public"."art_product_tags" USING "btree" ("art_product_id");



CREATE INDEX "idx_art_product_tags_tag" ON "public"."art_product_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_art_products_bestseller" ON "public"."art_products" USING "btree" ("is_bestseller");



CREATE INDEX "idx_art_products_category" ON "public"."art_products" USING "btree" ("category");



CREATE INDEX "idx_art_products_customization" ON "public"."art_products" USING "btree" ("customization_product_id");



CREATE INDEX "idx_art_products_features" ON "public"."art_products" USING "gin" ("features");



CREATE INDEX "idx_art_products_product_type" ON "public"."art_products" USING "btree" ("product_type");



CREATE INDEX "idx_art_products_sizes" ON "public"."art_products" USING "gin" ("available_sizes");



CREATE INDEX "idx_art_products_status" ON "public"."art_products" USING "btree" ("status");



CREATE INDEX "idx_aspect_ratios_active" ON "public"."aspect_ratios" USING "btree" ("active");



CREATE INDEX "idx_aspect_ratios_orientation" ON "public"."aspect_ratios" USING "btree" ("orientation");



CREATE INDEX "idx_categories_display_order" ON "public"."categories" USING "btree" ("display_order");



CREATE INDEX "idx_order_items_order" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_orders_cancelled_at" ON "public"."orders" USING "btree" ("cancelled_at" DESC);



CREATE INDEX "idx_orders_customer_email" ON "public"."orders" USING "btree" ("customer_email");



CREATE INDEX "idx_orders_paid_at" ON "public"."orders" USING "btree" ("paid_at" DESC);



CREATE INDEX "idx_orders_payment_status" ON "public"."orders" USING "btree" ("payment_status");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_stripe_session_id" ON "public"."orders" USING "btree" ("stripe_session_id");



CREATE INDEX "idx_photify_uploads_metadata" ON "public"."photify_uploads" USING "gin" ("metadata");



CREATE INDEX "idx_photify_uploads_ordered_at" ON "public"."photify_uploads" USING "btree" ("ordered_at" DESC);



CREATE INDEX "idx_product_categories_category" ON "public"."product_categories" USING "btree" ("category_id");



CREATE INDEX "idx_product_categories_product" ON "public"."product_categories" USING "btree" ("product_id");



CREATE INDEX "idx_product_pricings_active" ON "public"."product_pricings" USING "btree" ("active");



CREATE INDEX "idx_product_pricings_product_active" ON "public"."product_pricings" USING "btree" ("product_id", "active");



CREATE INDEX "idx_product_pricings_product_id" ON "public"."product_pricings" USING "btree" ("product_id");



CREATE INDEX "idx_product_pricings_size_active" ON "public"."product_pricings" USING "btree" ("size_id", "active");



CREATE INDEX "idx_product_pricings_size_id" ON "public"."product_pricings" USING "btree" ("size_id");



CREATE INDEX "idx_product_reviews_art_product_id" ON "public"."product_reviews" USING "btree" ("art_product_id");



CREATE INDEX "idx_product_reviews_created_at" ON "public"."product_reviews" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_product_reviews_customer_id" ON "public"."product_reviews" USING "btree" ("customer_id");



CREATE INDEX "idx_product_reviews_order_id" ON "public"."product_reviews" USING "btree" ("order_id");



CREATE INDEX "idx_product_reviews_product_id" ON "public"."product_reviews" USING "btree" ("product_id");



CREATE INDEX "idx_product_reviews_rating" ON "public"."product_reviews" USING "btree" ("rating");



CREATE INDEX "idx_product_reviews_status" ON "public"."product_reviews" USING "btree" ("status");



CREATE INDEX "idx_product_reviews_verified" ON "public"."product_reviews" USING "btree" ("verified_purchase");



CREATE INDEX "idx_product_tags_product" ON "public"."product_tags" USING "btree" ("product_id");



CREATE INDEX "idx_product_tags_tag" ON "public"."product_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_products_active" ON "public"."products" USING "btree" ("active");



CREATE INDEX "idx_products_bestseller" ON "public"."products" USING "btree" ("is_bestseller");



CREATE INDEX "idx_products_canonical_url" ON "public"."products" USING "btree" ("canonical_url");



CREATE INDEX "idx_products_config_gin" ON "public"."products" USING "gin" ("config");



CREATE INDEX "idx_products_config_status" ON "public"."products" USING "btree" ("config_status");



CREATE INDEX "idx_products_featured" ON "public"."products" USING "btree" ("is_featured");



CREATE INDEX "idx_products_featured_index" ON "public"."products" USING "btree" ("featured_index") WHERE ("featured_index" IS NOT NULL);



CREATE UNIQUE INDEX "idx_products_featured_index_unique" ON "public"."products" USING "btree" ("featured_index") WHERE ("featured_index" IS NOT NULL);



CREATE INDEX "idx_products_is_featured" ON "public"."products" USING "btree" ("is_featured") WHERE ("is_featured" = true);



CREATE INDEX "idx_products_product_type" ON "public"."products" USING "btree" ("product_type");



CREATE INDEX "idx_products_seo_title" ON "public"."products" USING "btree" ("seo_title");



CREATE UNIQUE INDEX "idx_products_slug_unique" ON "public"."products" USING "btree" ("slug");



CREATE INDEX "idx_promotions_code" ON "public"."promotions" USING "btree" ("code");



CREATE INDEX "idx_promotions_dates" ON "public"."promotions" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_promotions_is_active" ON "public"."promotions" USING "btree" ("is_active");



CREATE INDEX "idx_promotions_type" ON "public"."promotions" USING "btree" ("type");



CREATE INDEX "idx_room_hotspots_art_product_id" ON "public"."room_hotspots" USING "btree" ("art_product_id");



CREATE INDEX "idx_room_hotspots_art_size_id" ON "public"."room_hotspots" USING "btree" ("art_size_id");



CREATE INDEX "idx_room_hotspots_display_order" ON "public"."room_hotspots" USING "btree" ("room_id", "display_order");



CREATE INDEX "idx_room_hotspots_is_active" ON "public"."room_hotspots" USING "btree" ("is_active");



CREATE INDEX "idx_room_hotspots_product_id" ON "public"."room_hotspots" USING "btree" ("product_id");



CREATE INDEX "idx_room_hotspots_room_id" ON "public"."room_hotspots" USING "btree" ("room_id");



CREATE INDEX "idx_rooms_seo_keywords" ON "public"."rooms" USING "gin" ("seo_keywords");



CREATE INDEX "idx_site_settings_category" ON "public"."site_settings" USING "btree" ("category");



CREATE INDEX "idx_site_settings_is_public" ON "public"."site_settings" USING "btree" ("is_public");



CREATE INDEX "idx_site_settings_key" ON "public"."site_settings" USING "btree" ("setting_key");



CREATE INDEX "idx_sizes_active" ON "public"."sizes" USING "btree" ("active");



CREATE INDEX "idx_sizes_aspect_ratio_id" ON "public"."sizes" USING "btree" ("aspect_ratio_id");



CREATE INDEX "idx_sizes_long_side" ON "public"."sizes" USING "btree" ("long_side_in");



CREATE INDEX "idx_sizes_short_side" ON "public"."sizes" USING "btree" ("short_side_in");



CREATE INDEX "idx_tags_slug" ON "public"."tags" USING "btree" ("slug");



CREATE OR REPLACE VIEW "public"."v_categories_with_counts" AS
 SELECT "c"."id",
    "c"."name",
    "c"."slug",
    "c"."description",
    "c"."icon",
    "c"."created_at",
    "c"."updated_at",
    "c"."display_order",
    "c"."bg_color",
    "c"."is_active",
    "c"."image_url",
    "count"(DISTINCT "pc"."product_id") AS "product_count",
    "count"(DISTINCT
        CASE
            WHEN ("p"."active" = true) THEN "pc"."product_id"
            ELSE NULL::"uuid"
        END) AS "active_product_count"
   FROM (("public"."categories" "c"
     LEFT JOIN "public"."product_categories" "pc" ON (("c"."id" = "pc"."category_id")))
     LEFT JOIN "public"."products" "p" ON (("pc"."product_id" = "p"."id")))
  GROUP BY "c"."id";



CREATE OR REPLACE TRIGGER "product_pricings_updated_at" BEFORE UPDATE ON "public"."product_pricings" FOR EACH ROW EXECUTE FUNCTION "public"."update_product_pricings_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_products_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_sync_featured_status" BEFORE INSERT OR UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."sync_featured_status"();



CREATE OR REPLACE TRIGGER "trigger_update_product_rating_delete" AFTER DELETE ON "public"."product_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_product_rating_on_delete"();



CREATE OR REPLACE TRIGGER "trigger_update_product_rating_insert" AFTER INSERT ON "public"."product_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_product_rating"();



CREATE OR REPLACE TRIGGER "trigger_update_product_rating_update" AFTER UPDATE ON "public"."product_reviews" FOR EACH ROW WHEN (((("old"."status")::"text" IS DISTINCT FROM ("new"."status")::"text") OR ("old"."rating" IS DISTINCT FROM "new"."rating"))) EXECUTE FUNCTION "public"."update_product_rating"();



CREATE OR REPLACE TRIGGER "trigger_update_rooms_updated_at" BEFORE UPDATE ON "public"."rooms" FOR EACH ROW EXECUTE FUNCTION "public"."update_rooms_updated_at"();



CREATE OR REPLACE TRIGGER "update_art_products_updated_at" BEFORE UPDATE ON "public"."art_products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_categories_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_customers_updated_at" BEFORE UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_photify_uploads_updated_at" BEFORE UPDATE ON "public"."photify_uploads" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_product_reviews_updated_at" BEFORE UPDATE ON "public"."product_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_promotions_updated_at" BEFORE UPDATE ON "public"."promotions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_room_hotspots_updated_at" BEFORE UPDATE ON "public"."room_hotspots" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_rooms_updated_at" BEFORE UPDATE ON "public"."rooms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_site_settings_updated_at" BEFORE UPDATE ON "public"."site_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tags_updated_at" BEFORE UPDATE ON "public"."tags" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."art_product_tags"
    ADD CONSTRAINT "art_product_tags_art_product_id_fkey" FOREIGN KEY ("art_product_id") REFERENCES "public"."art_products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."art_product_tags"
    ADD CONSTRAINT "art_product_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."art_products"
    ADD CONSTRAINT "art_products_customization_product_id_fkey" FOREIGN KEY ("customization_product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_pricings"
    ADD CONSTRAINT "product_pricings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_pricings"
    ADD CONSTRAINT "product_pricings_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "public"."sizes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_reviews"
    ADD CONSTRAINT "product_reviews_art_product_id_fkey" FOREIGN KEY ("art_product_id") REFERENCES "public"."art_products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_reviews"
    ADD CONSTRAINT "product_reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."product_reviews"
    ADD CONSTRAINT "product_reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."product_reviews"
    ADD CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_tags"
    ADD CONSTRAINT "product_tags_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_tags"
    ADD CONSTRAINT "product_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_hotspots"
    ADD CONSTRAINT "room_hotspots_art_product_id_fkey" FOREIGN KEY ("art_product_id") REFERENCES "public"."art_products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."room_hotspots"
    ADD CONSTRAINT "room_hotspots_art_size_id_fkey" FOREIGN KEY ("art_size_id") REFERENCES "public"."sizes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."room_hotspots"
    ADD CONSTRAINT "room_hotspots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."room_hotspots"
    ADD CONSTRAINT "room_hotspots_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sizes"
    ADD CONSTRAINT "sizes_aspect_ratio_id_fkey" FOREIGN KEY ("aspect_ratio_id") REFERENCES "public"."aspect_ratios"("id") ON DELETE CASCADE;



CREATE POLICY "Admin delete categories" ON "public"."categories" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Admin insert categories" ON "public"."categories" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Admin manage art_product_tags" ON "public"."art_product_tags" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admin manage aspect_ratios" ON "public"."aspect_ratios" USING (true) WITH CHECK (true);



CREATE POLICY "Admin manage product_tags" ON "public"."product_tags" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admin manage sizes" ON "public"."sizes" USING (true) WITH CHECK (true);



CREATE POLICY "Admin manage tags" ON "public"."tags" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admin update categories" ON "public"."categories" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Admins manage hotspots" ON "public"."room_hotspots" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admins manage promotions" ON "public"."promotions" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admins manage reviews" ON "public"."product_reviews" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admins manage settings" ON "public"."site_settings" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated delete products" ON "public"."products" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated insert products" ON "public"."products" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated manage art_products" ON "public"."art_products" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated manage aspect_ratios" ON "public"."aspect_ratios" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated manage categories" ON "public"."categories" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated manage rooms" ON "public"."rooms" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated manage sizes" ON "public"."sizes" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated update products" ON "public"."products" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to manage product_categories" ON "public"."product_categories" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public inserts to photify_uploads" ON "public"."photify_uploads" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public read access on product_categories" ON "public"."product_categories" FOR SELECT USING (true);



CREATE POLICY "Allow public reads from photify_uploads" ON "public"."photify_uploads" FOR SELECT USING (true);



CREATE POLICY "Anon can insert orders" ON "public"."orders" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Authenticated users can update status" ON "public"."orders" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Customers can create reviews" ON "public"."product_reviews" FOR INSERT WITH CHECK (true);



CREATE POLICY "Customers can update own pending reviews" ON "public"."product_reviews" FOR UPDATE USING (((("status")::"text" = 'pending'::"text") AND (("customer_email")::"text" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'email'::"text"))));



CREATE POLICY "Public insert customers" ON "public"."customers" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public insert order_items" ON "public"."order_items" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public insert orders" ON "public"."orders" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public read active art_products" ON "public"."art_products" FOR SELECT USING (((("status")::"text" = 'active'::"text") OR ("status" IS NULL)));



CREATE POLICY "Public read active aspect_ratios" ON "public"."aspect_ratios" FOR SELECT USING (("active" = true));



CREATE POLICY "Public read active hotspots" ON "public"."room_hotspots" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public read active promotions" ON "public"."promotions" FOR SELECT USING ((("is_active" = true) AND ("start_date" <= CURRENT_DATE) AND ("end_date" >= CURRENT_DATE)));



CREATE POLICY "Public read active sizes" ON "public"."sizes" FOR SELECT USING (("active" = true));



CREATE POLICY "Public read approved reviews" ON "public"."product_reviews" FOR SELECT USING ((("status")::"text" = 'approved'::"text"));



CREATE POLICY "Public read art_product_tags" ON "public"."art_product_tags" FOR SELECT USING (true);



CREATE POLICY "Public read categories" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Public read order_items" ON "public"."order_items" FOR SELECT USING (true);



CREATE POLICY "Public read own customer" ON "public"."customers" FOR SELECT USING (true);



CREATE POLICY "Public read own orders" ON "public"."orders" FOR SELECT USING (true);



CREATE POLICY "Public read product_tags" ON "public"."product_tags" FOR SELECT USING (true);



CREATE POLICY "Public read products" ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "Public read public settings" ON "public"."site_settings" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Public read rooms" ON "public"."rooms" FOR SELECT USING (true);



CREATE POLICY "Public read tags" ON "public"."tags" FOR SELECT USING (true);



CREATE POLICY "Service role can manage orders" ON "public"."orders" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can track orders with email" ON "public"."orders" FOR SELECT TO "authenticated", "anon" USING (((("customer_email")::"text" = (("current_setting"('request.headers'::"text", true))::json ->> 'x-customer-email'::"text")) OR true));



COMMENT ON POLICY "Users can track orders with email" ON "public"."orders" IS 'Allows customers to track their orders by providing order number and email';



ALTER TABLE "public"."art_product_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."art_products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."aspect_ratios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photify_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promotions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."room_hotspots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rooms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sizes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_promotion_to_order"("promotion_code" character varying, "order_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."apply_promotion_to_order"("promotion_code" character varying, "order_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_promotion_to_order"("promotion_code" character varying, "order_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."count_products_with_tag"("tag_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."count_products_with_tag"("tag_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_products_with_tag"("tag_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_art_product_tags"("art_product_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_art_product_tags"("art_product_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_art_product_tags"("art_product_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_category_products"("category_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_category_products"("category_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_category_products"("category_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_categories"("product_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_product_categories"("product_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_product_categories"("product_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_min_price"("product_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_product_min_price"("product_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_product_min_price"("product_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_min_size_price"("product_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_product_min_size_price"("product_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_product_min_size_price"("product_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_pricings"("product_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_product_pricings"("product_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_product_pricings"("product_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_reviews"("product_uuid" "uuid", "limit_count" integer, "offset_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_product_reviews"("product_uuid" "uuid", "limit_count" integer, "offset_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_product_reviews"("product_uuid" "uuid", "limit_count" integer, "offset_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_search_text"("product_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_product_search_text"("product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_product_search_text"("product_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_tags"("product_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_product_tags"("product_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_product_tags"("product_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_products_with_min_size_price"("product_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_products_with_min_size_price"("product_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_products_with_min_size_price"("product_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_rating_distribution"("product_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_rating_distribution"("product_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_rating_distribution"("product_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_room_hotspots"("room_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_room_hotspots"("room_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_room_hotspots"("room_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_setting"("key" character varying, "default_value" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."get_setting"("key" character varying, "default_value" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_setting"("key" character varying, "default_value" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_promotion_valid"("promotion_code" character varying, "order_total" numeric, "order_categories" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."is_promotion_valid"("promotion_code" character varying, "order_total" numeric, "order_categories" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_promotion_valid"("promotion_code" character varying, "order_total" numeric, "order_categories" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_products_semantic"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_products_semantic"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_products_semantic"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_setting"("key" character varying, "value" "jsonb", "type" character varying, "category_name" character varying, "description_text" "text", "public" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."set_setting"("key" character varying, "value" "jsonb", "type" character varying, "category_name" character varying, "description_text" "text", "public" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_setting"("key" character varying, "value" "jsonb", "type" character varying, "category_name" character varying, "description_text" "text", "public" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_featured_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_featured_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_featured_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_product_pricings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_product_pricings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_product_pricings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_product_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_product_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_product_rating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_product_rating_on_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_product_rating_on_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_product_rating_on_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_products_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_products_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_products_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_rooms_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_rooms_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_rooms_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."art_product_tags" TO "anon";
GRANT ALL ON TABLE "public"."art_product_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."art_product_tags" TO "service_role";



GRANT ALL ON TABLE "public"."art_products" TO "anon";
GRANT ALL ON TABLE "public"."art_products" TO "authenticated";
GRANT ALL ON TABLE "public"."art_products" TO "service_role";



GRANT ALL ON TABLE "public"."aspect_ratios" TO "anon";
GRANT ALL ON TABLE "public"."aspect_ratios" TO "authenticated";
GRANT ALL ON TABLE "public"."aspect_ratios" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."photify_uploads" TO "anon";
GRANT ALL ON TABLE "public"."photify_uploads" TO "authenticated";
GRANT ALL ON TABLE "public"."photify_uploads" TO "service_role";



GRANT ALL ON TABLE "public"."product_categories" TO "anon";
GRANT ALL ON TABLE "public"."product_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."product_categories" TO "service_role";



GRANT ALL ON TABLE "public"."product_pricings" TO "anon";
GRANT ALL ON TABLE "public"."product_pricings" TO "authenticated";
GRANT ALL ON TABLE "public"."product_pricings" TO "service_role";



GRANT ALL ON TABLE "public"."product_reviews" TO "anon";
GRANT ALL ON TABLE "public"."product_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."product_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."product_tags" TO "anon";
GRANT ALL ON TABLE "public"."product_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."product_tags" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."promotions" TO "anon";
GRANT ALL ON TABLE "public"."promotions" TO "authenticated";
GRANT ALL ON TABLE "public"."promotions" TO "service_role";



GRANT ALL ON TABLE "public"."room_hotspots" TO "anon";
GRANT ALL ON TABLE "public"."room_hotspots" TO "authenticated";
GRANT ALL ON TABLE "public"."room_hotspots" TO "service_role";



GRANT ALL ON TABLE "public"."rooms" TO "anon";
GRANT ALL ON TABLE "public"."rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."rooms" TO "service_role";



GRANT ALL ON TABLE "public"."site_settings" TO "anon";
GRANT ALL ON TABLE "public"."site_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."site_settings" TO "service_role";



GRANT ALL ON TABLE "public"."sizes" TO "anon";
GRANT ALL ON TABLE "public"."sizes" TO "authenticated";
GRANT ALL ON TABLE "public"."sizes" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."v_categories_with_counts" TO "anon";
GRANT ALL ON TABLE "public"."v_categories_with_counts" TO "authenticated";
GRANT ALL ON TABLE "public"."v_categories_with_counts" TO "service_role";



GRANT ALL ON TABLE "public"."v_product_pricings_with_sizes" TO "anon";
GRANT ALL ON TABLE "public"."v_product_pricings_with_sizes" TO "authenticated";
GRANT ALL ON TABLE "public"."v_product_pricings_with_sizes" TO "service_role";



GRANT ALL ON TABLE "public"."v_product_reviews_with_details" TO "anon";
GRANT ALL ON TABLE "public"."v_product_reviews_with_details" TO "authenticated";
GRANT ALL ON TABLE "public"."v_product_reviews_with_details" TO "service_role";



GRANT ALL ON TABLE "public"."v_products_with_min_price" TO "anon";
GRANT ALL ON TABLE "public"."v_products_with_min_price" TO "authenticated";
GRANT ALL ON TABLE "public"."v_products_with_min_price" TO "service_role";



GRANT ALL ON TABLE "public"."v_room_hotspots_with_products" TO "anon";
GRANT ALL ON TABLE "public"."v_room_hotspots_with_products" TO "authenticated";
GRANT ALL ON TABLE "public"."v_room_hotspots_with_products" TO "service_role";



GRANT ALL ON TABLE "public"."v_settings_by_category" TO "anon";
GRANT ALL ON TABLE "public"."v_settings_by_category" TO "authenticated";
GRANT ALL ON TABLE "public"."v_settings_by_category" TO "service_role";



GRANT ALL ON TABLE "public"."v_sizes_with_ratios" TO "anon";
GRANT ALL ON TABLE "public"."v_sizes_with_ratios" TO "authenticated";
GRANT ALL ON TABLE "public"."v_sizes_with_ratios" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







