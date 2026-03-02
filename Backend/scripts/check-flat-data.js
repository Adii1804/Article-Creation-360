
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkFlatData() {
    try {
        const totalCount = await prisma.extractionResultFlat.count();
        console.log(`Total records in ExtractionResultFlat: ${totalCount}`);

        if (totalCount === 0) {
            console.log('Table is empty.');
            return;
        }

        const statuses = await prisma.extractionResultFlat.groupBy({
            by: ['extractionStatus'],
            _count: {
                extractionStatus: true,
            },
        });

        console.log('Status breakdown:', JSON.stringify(statuses, null, 2));

        // Also check sample record
        const sample = await prisma.extractionResultFlat.findFirst();
        console.log('Sample record:', JSON.stringify(sample, null, 2));

    } catch (error) {
        console.error('Error checking flat data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkFlatData();
