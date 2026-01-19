/**
 * Script to generate embeddings for all products
 * 
 * Usage:
 *   npx tsx scripts/generate-embeddings.ts
 * 
 * This script will:
 * 1. Fetch all active products from Supabase
 * 2. Generate embeddings for each product (name + category)
 * 3. Update the products table with embeddings
 * 
 * Prerequisites:
 * - Run migration 024_products_semantic_search.sql first
 * - Set OPENAI_API_KEY in .env.local
 * - Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase credentials are not set in environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize clients
// Note: Using SERVICE_ROLE_KEY to bypass RLS for admin operations
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface Product {
  id: string;
  name: string;
  description: string | null;
  embedding_needs_update?: boolean;
  product_categories?: Array<{
    categories: { name: string }[] | { name: string } | null;
  }> | null;
}

/**
 * Generate embedding for text
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Process a single product
 */
async function processProduct(product: Product): Promise<boolean> {
  try {
    // Generate search text: product name + all category names
    const categories = product.product_categories || [];
    const categoryNames = categories
      .map((pc) => {
        if (!pc.categories) return null;
        if (Array.isArray(pc.categories)) {
          return pc.categories.map(c => c.name).join(' ');
        }
        return pc.categories.name;
      })
      .filter(Boolean)
      .join(' ');
    const searchText = `${product.name} ${categoryNames}`.trim();

    console.log(`  Processing: ${product.name} (${categoryNames || 'No categories'})`);

    // Generate embedding
    const embedding = await generateEmbedding(searchText);

    // Update product with embedding and clear the update flag
    const { error } = await supabase
      .from('products')
      .update({ 
        name_embedding: embedding,
        embedding_needs_update: false 
      })
      .eq('id', product.id);

    if (error) {
      console.error(`  ❌ Failed to update: ${error.message}`);
      return false;
    }

    console.log(`  ✅ Updated with ${embedding.length}-dimensional embedding`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error processing product:`, error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n🚀 Starting embeddings generation...\n');

  // Fetch all active products that need embeddings
  // (either no embedding or marked for update)
  console.log('📥 Fetching products from Supabase...');
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select(`
      id, 
      name, 
      description,
      embedding_needs_update,
      product_categories(
        categories(name)
      )
    `)
    .eq('active', true)
    .or('name_embedding.is.null,embedding_needs_update.eq.true');

  if (fetchError) {
    console.error('❌ Failed to fetch products:', fetchError);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('⚠️  No active products found');
    process.exit(0);
  }

  console.log(`✅ Found ${products.length} active products\n`);

  // Process products
  console.log('🔄 Generating embeddings...\n');
  
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`[${i + 1}/${products.length}]`);

    const success = await processProduct(product as Product);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Rate limiting: wait 100ms between requests to avoid hitting OpenAI limits
    if (i < products.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('');
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`  Total products: ${products.length}`);
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  console.log(`  📈 Success rate: ${((successCount / products.length) * 100).toFixed(1)}%`);
  console.log('\n✨ Embeddings generation complete!\n');

  if (failCount > 0) {
    console.log('⚠️  Some products failed. Review the errors above and retry if needed.\n');
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

