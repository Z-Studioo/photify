-- Drop unused `products` columns and their dependent objects.
--
-- Audit (app/src + server/src only) found these columns have no active
-- references by name; matches elsewhere belong to other tables
-- (art_products.is_bestseller/stock_quantity, categories.meta_robots) or are
-- infrastructure with no live caller (semantic search via name_embedding /
-- search_text; the search modal uses ilike on name instead).

-- Dependent function: search_products_semantic reads products.name_embedding
-- and is not called anywhere in active code.
DROP FUNCTION IF EXISTS public.search_products_semantic(
  public.vector, double precision, integer
);

-- Dependent indexes.
DROP INDEX IF EXISTS public.idx_products_bestseller;
DROP INDEX IF EXISTS public.idx_products_name_embedding;
DROP INDEX IF EXISTS public.idx_products_search_text;

-- Columns.
ALTER TABLE public.products DROP COLUMN IF EXISTS content_sections;
ALTER TABLE public.products DROP COLUMN IF EXISTS stock_quantity;
ALTER TABLE public.products DROP COLUMN IF EXISTS is_bestseller;
ALTER TABLE public.products DROP COLUMN IF EXISTS meta_robots;
ALTER TABLE public.products DROP COLUMN IF EXISTS name_embedding;
ALTER TABLE public.products DROP COLUMN IF EXISTS search_text;
