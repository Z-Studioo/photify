#!/usr/bin/env node

/**
 * Database Setup Script
 * Runs the category setup SQL against your Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Make sure .env.local contains:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=your_url');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSetup() {
  console.log('🚀 Starting database setup...\n');

  // Read the setup SQL file
  const sqlFile = path.join(__dirname, '../supabase/setup-categories-complete.sql');
  
  if (!fs.existsSync(sqlFile)) {
    console.error('❌ Error: Could not find setup-categories-complete.sql');
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('📋 Running setup script...');
  console.log('   This will:');
  console.log('   - Add category ordering columns');
  console.log('   - Add image support');
  console.log('   - Create product count views');
  console.log('   - Insert 8 sample categories\n');

  try {
    // Note: Supabase JS client doesn't support raw SQL execution directly
    // We need to use the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ Setup completed successfully!\n');
    console.log('📊 Verifying categories...');

    // Verify by fetching categories
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (error) {
      console.error('⚠️  Warning: Could not verify categories:', error.message);
      console.log('\n💡 Please verify manually in Supabase dashboard');
    } else {
      console.log(`✅ Found ${categories.length} categories:`);
      categories.forEach(cat => {
        console.log(`   ${cat.display_order}. ${cat.name} (${cat.slug})`);
      });
    }

    console.log('\n🎉 All done! You can now use the admin categories page.');
    console.log('   Visit: http://localhost:3000/admin/categories\n');

  } catch (error) {
    console.error('❌ Error running setup:', error.message);
    console.error('\n💡 Alternative: Run the SQL manually in Supabase Dashboard');
    console.error('   1. Go to https://supabase.com/dashboard');
    console.error('   2. Open SQL Editor');
    console.error('   3. Copy contents of: supabase/setup-categories-complete.sql');
    console.error('   4. Paste and Run\n');
    process.exit(1);
  }
}

runSetup();

