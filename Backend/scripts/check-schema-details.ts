import { PrismaClient } from '../src/generated/prisma';

interface ColumnInfo {
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
}

async function checkSchemaDetails() {
    const prisma = new PrismaClient();

    try {
        console.log('🔍 Detailed Schema Analysis\n');

        await prisma.$connect();

        // Check ExtractionJob table structure
        console.log('📊 ExtractionJob Table Columns:');
        console.log('─'.repeat(80));
        const extractionJobCols = await prisma.$queryRaw<ColumnInfo[]>`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'extraction_jobs'
      ORDER BY ordinal_position;
    `;

        extractionJobCols.forEach(col => {
            console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        // Check if cost tracking fields exist
        console.log('\n💰 Cost Tracking Fields in ExtractionJob:');
        const costFields = ['input_tokens', 'output_tokens', 'api_cost'];
        costFields.forEach(field => {
            const exists = extractionJobCols.some(c => c.column_name === field);
            console.log(`  ${field.padEnd(20)} ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
        });

        // Check CostSummary table
        console.log('\n📈 CostSummary Table:');
        const costSummaryCols = await prisma.$queryRaw<ColumnInfo[]>`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'cost_summary'
      ORDER BY ordinal_position;
    `;

        if (costSummaryCols.length > 0) {
            console.log('✅ Table exists with columns:');
            costSummaryCols.forEach(col => {
                console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)}`);
            });
        } else {
            console.log('❌ Table does not exist or has no columns');
        }

        // Check for any recent schema changes
        console.log('\n🔄 Checking for schema drift...');
        console.log('Run this to see what would change:');
        console.log('  npx prisma db push --preview-feature\n');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkSchemaDetails().catch(console.error);
