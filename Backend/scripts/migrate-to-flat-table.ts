/**
 * Migrate existing extraction jobs to flat table
 * Run: npx tsx scripts/migrate-to-flat-table.ts
 */

import { PrismaClient } from '../src/generated/prisma';
import { flatteningService } from '../src/services/flatteningService';

const prisma = new PrismaClient();

async function migrateExistingData() {
    console.log('🚀 Starting migration of existing extraction jobs to flat table...\n');

    // Get all completed extraction jobs
    const jobs = await prisma.extractionJob.findMany({
        where: { status: 'COMPLETED' },
        select: { id: true },
        orderBy: { createdAt: 'asc' }
    });

    console.log(`📊 Found ${jobs.length} completed extraction jobs\n`);

    if (jobs.length === 0) {
        console.log('✅ No jobs to migrate');
        await prisma.$disconnect();
        return;
    }

    // Batch process in chunks of 100
    const BATCH_SIZE = 100;
    const jobIds = jobs.map(j => j.id);

    for (let i = 0; i < jobIds.length; i += BATCH_SIZE) {
        const batch = jobIds.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(jobIds.length / BATCH_SIZE);

        console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} jobs)...`);

        await flatteningService.flattenMultipleJobs(batch);
    }

    // Verify migration
    const flatCount = await prisma.extractionResultFlat.count();

    console.log(`\n\n✅ Migration Complete!`);
    console.log(`   Total jobs: ${jobs.length}`);
    console.log(`   Flat records: ${flatCount}`);
    console.log(`   Success rate: ${((flatCount / jobs.length) * 100).toFixed(1)}%`);

    await prisma.$disconnect();
}

migrateExistingData()
    .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    });
