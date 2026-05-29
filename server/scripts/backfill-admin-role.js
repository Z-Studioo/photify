#!/usr/bin/env node

/**
 * Backfill `user_metadata.role = 'admin'` on every existing Supabase Auth user.
 *
 * This is a ONE-TIME migration run when the role model is introduced. After
 * this, the `adminAuth` middleware enforces `role === 'admin'`, so any
 * account created before today must be stamped with the role.
 *
 * Usage:
 *   cd server
 *   node scripts/backfill-admin-role.js
 *
 * Affiliate users are NOT touched by this script — they are stamped with
 * `role: 'affiliate'` when an admin approves their application (see
 * affiliate approve controller).
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in server/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('🔎 Listing all Supabase Auth users…\n');

  const perPage = 1000;
  let page = 1;
  let updated = 0;
  let skipped = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error('Failed to list users:', error);
      process.exit(1);
    }
    if (!data.users.length) break;

    for (const user of data.users) {
      const currentRole = user.user_metadata && user.user_metadata.role;

      if (currentRole) {
        skipped++;
        continue;
      }

      const { error: updErr } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: Object.assign({}, user.user_metadata || {}, { role: 'admin' }),
      });

      if (updErr) {
        console.error(`Failed to update ${user.email}:`, updErr);
        continue;
      }

      console.log(`✓ Stamped admin role on ${user.email}`);
      updated++;
    }

    if (data.users.length < perPage) break;
    page++;
  }

  console.log(`\nDone. Updated: ${updated}, skipped (already had a role): ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
