import { PrismaClient } from '../src/generated/prisma';

interface TableInfo {
    table_name: string;
}

interface ColumnInfo {
    column_name: string;
    data_type: string;
    is_nullable: string;
}

const EXPECTED_TABLES = [
    'departments',
    'sub_departments',
    'categories',
    'master_attributes',
    'attribute_allowed_values',
    'category_attributes',
    'extraction_jobs',
    'extraction_results',
    'users',
    'audit_logs',
    'api_keys',
    'change_history',
    'cost_summary'
];

async function checkDatabaseSync() {
    const prisma = new PrismaClient();

    try {
        console.log('🔍 Checking Supabase Database Schema Synchronization...\n');

        // 1. Test connection
        console.log('📡 Testing database connection...');
        await prisma.$connect();
        console.log('✅ Connected to Supabase successfully!\n');

        // 2. Get all tables from database
        console.log('📋 Fetching existing tables from Supabase...');
        const tables = await prisma.$queryRaw<TableInfo[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

        const existingTables = tables.map(t => t.table_name);
        console.log(`Found ${existingTables.length} tables in database\n`);

        // 3. Compare with expected tables
        console.log('🔎 Comparing with Prisma schema...\n');

        const missingTables: string[] = [];
        const extraTables = existingTables.filter(t => !EXPECTED_TABLES.includes(t));

        console.log('Expected Tables Status:');
        console.log('─'.repeat(50));

        for (const expectedTable of EXPECTED_TABLES) {
            const exists = existingTables.includes(expectedTable);
            if (exists) {
                console.log(`✅ ${expectedTable.padEnd(30)} SYNCED`);
            } else {
                console.log(`❌ ${expectedTable.padEnd(30)} MISSING`);
                missingTables.push(expectedTable);
            }
        }

        // 4. Show extra tables (not in schema)
        if (extraTables.length > 0) {
            console.log('\n⚠️  Extra tables in database (not in Prisma schema):');
            extraTables.forEach(table => console.log(`   - ${table}`));
        }

        // 5. Check specific table structures for critical tables
        console.log('\n📊 Checking critical table structures...\n');

        const criticalTables = ['extraction_jobs', 'users', 'categories'];
        for (const tableName of criticalTables) {
            if (existingTables.includes(tableName)) {
                const columns = await prisma.$queryRaw<ColumnInfo[]>`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
          ORDER BY ordinal_position;
        `;

                console.log(`Table: ${tableName}`);
                console.log(`  Columns: ${columns.length}`);

                // Check for imageUrl column in extraction_jobs
                if (tableName === 'extraction_jobs') {
                    const hasImageUrl = columns.some(c => c.column_name === 'image_url');
                    console.log(`  Has image_url column: ${hasImageUrl ? '✅' : '❌'}`);
                }
                console.log('');
            }
        }

        // 6. Summary
        console.log('═'.repeat(50));
        console.log('SUMMARY');
        console.log('═'.repeat(50));
        console.log(`Total Expected Tables: ${EXPECTED_TABLES.length}`);
        console.log(`Tables in Database: ${existingTables.length}`);
        console.log(`Missing Tables: ${missingTables.length}`);
        console.log(`Extra Tables: ${extraTables.length}`);

        if (missingTables.length === 0) {
            console.log('\n✅ DATABASE IS FULLY SYNCED!');
            console.log('All expected tables exist in Supabase.');
        } else {
            console.log('\n⚠️  DATABASE NEEDS MIGRATION!');
            console.log('\nMissing tables:');
            missingTables.forEach(table => console.log(`  - ${table}`));
            console.log('\nTo fix this, run:');
            console.log('  npx prisma migrate deploy');
            console.log('  OR');
            console.log('  npx prisma db push');
        }

    } catch (error: any) {
        console.error('❌ Error checking database:', error.message);
        console.error('\nFull error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the check
checkDatabaseSync().catch(console.error);
