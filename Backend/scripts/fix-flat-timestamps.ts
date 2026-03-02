
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting timestamp backfill for ExtractionResultFlat...');

    // Get all flat results
    const flatResults = await prisma.extractionResultFlat.findMany({
        select: { id: true, jobId: true }
    });

    console.log(`Found ${flatResults.length} records to check.`);

    let updated = 0;
    let skipped = 0;

    for (const flat of flatResults) {
        if (!flat.jobId) {
            skipped++;
            continue;
        }

        // Find the job to get original timestamps
        const job = await prisma.extractionJob.findUnique({
            where: { id: flat.jobId },
            select: { createdAt: true, updatedAt: true }
        });

        if (job) {
            // Update the flat record with the job's timestamp
            await prisma.extractionResultFlat.update({
                where: { id: flat.id },
                data: {
                    createdAt: job.createdAt,
                    updatedAt: job.updatedAt
                }
            });
            updated++;
            if (updated % 50 === 0) process.stdout.write(`.`);
        } else {
            skipped++;
        }
    }

    console.log(`\n\n✅ Update complete!`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
}

main()
    .catch((e) => {
        console.error('Error running script:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
