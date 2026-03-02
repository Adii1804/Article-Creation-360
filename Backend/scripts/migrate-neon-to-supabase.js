/**
 * Migrate Neon Database to Supabase
 * 
 * Steps:
 * 1. Dump data from Neon database
 * 2. Create schema in Supabase
 * 3. Import data to Supabase
 */

const { exec } = require('node:child_process');
const { promisify } = require('node:util');
const execAsync = promisify(exec);

// Your connection strings

const SUPABASE_URL = process.env.SUPABASE_DATABASE_URL || 'YOUR_SUPABASE_CONNECTION_STRING';

async function migrateDatabaseToSupabase() {
  console.log('🚀 Starting Neon → Supabase Migration\n');

  try {
    // Step 1: Export schema from Neon (structure only)
    console.log('📤 Step 1: Exporting schema from Neon...');
    await execAsync(`pg_dump "${NEON_URL}" --schema-only --no-owner --no-acl > neon_schema.sql`);
    console.log('✅ Schema exported to neon_schema.sql\n');

    // Step 2: Export data from Neon (data only)
    console.log('📤 Step 2: Exporting data from Neon...');
    await execAsync(`pg_dump "${NEON_URL}" --data-only --no-owner --no-acl > neon_data.sql`);
    console.log('✅ Data exported to neon_data.sql\n');

    // Step 3: Import schema to Supabase
    console.log('📥 Step 3: Importing schema to Supabase...');
    await execAsync(`psql "${SUPABASE_URL}" < neon_schema.sql`);
    console.log('✅ Schema imported to Supabase\n');

    // Step 4: Import data to Supabase
    console.log('📥 Step 4: Importing data to Supabase...');
    await execAsync(`psql "${SUPABASE_URL}" < neon_data.sql`);
    console.log('✅ Data imported to Supabase\n');

    console.log('🎉 Migration complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your .env file with Supabase connection strings');
    console.log('2. Run: npm run db:push (to sync Prisma schema)');
    console.log('3. Test your application');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('- Make sure pg_dump and psql are installed (PostgreSQL client tools)');
    console.error('- Verify both connection strings are correct');
    console.error('- Check network connectivity to both databases');
  }
}

// Run migration
await migrateDatabaseToSupabase();
