import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function checkCostData() {
    try {
        const latestExtraction = await prisma.extractionResultFlat.findFirst({
            orderBy: { createdAt: 'desc' },
            select: {
                jobId: true,
                inputTokens: true,
                outputTokens: true,
                totalTokens: true,
                apiCost: true,
                extractionDate: true
            }
        });

        console.log('Latest extraction from flat table:');
        console.log(JSON.stringify(latestExtraction, null, 2));

        const summary = await prisma.extractionResultFlat.aggregate({
            _sum: {
                inputTokens: true,
                outputTokens: true,
                totalTokens: true,
                apiCost: true
            },
            _count: true
        });

        console.log('\nSummary of all extractions:');
        console.log(JSON.stringify(summary, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCostData();
