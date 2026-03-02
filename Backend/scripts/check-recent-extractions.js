
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkRecentData() {
    try {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        console.log('--- Checking for ExtractionJob records created in the last 10 minutes ---');
        const jobs = await prisma.extractionJob.findMany({
            where: {
                createdAt: {
                    gt: tenMinutesAgo
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true
                    }
                },
                category: {
                    select: {
                        name: true
                    }
                }
            }
        });

        console.log(`Found ${jobs.length} recent jobs.`);
        jobs.forEach(job => {
            console.log(`Job ID: ${job.id}, Status: ${job.status}, User: ${job.user?.email || 'Anonymous'}, Category: ${job.category?.name || 'N/A'}`);
        });

        console.log('\n--- Checking for ExtractionResultFlat records created in the last 10 minutes ---');
        const flatRecords = await prisma.extractionResultFlat.findMany({
            where: {
                createdAt: {
                    gt: tenMinutesAgo
                }
            }
        });

        console.log(`Found ${flatRecords.length} recent flat records.`);
        flatRecords.forEach(record => {
            console.log(`Flat ID: ${record.id}, JobID: ${record.jobId}, User: ${record.userName || 'N/A'}, Division: ${record.division || 'N/A'}`);
        });

    } catch (error) {
        console.error('Error checking recent data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecentData();
