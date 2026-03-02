import { PrismaClient } from '../src/generated/prisma';

async function checkMajorCategory() {
    const prisma = new PrismaClient();

    try {
        console.log('🔍 Checking if major_category is being saved...\n');

        // 1. Check if major_category attribute exists
        const majorCategoryAttr = await prisma.masterAttribute.findFirst({
            where: {
                OR: [
                    { key: 'major_category' },
                    { key: 'majorCategory' },
                    { label: { contains: 'Major Category', mode: 'insensitive' } }
                ]
            }
        });

        if (!majorCategoryAttr) {
            console.log('❌ major_category attribute NOT FOUND in master_attributes table!');
            console.log('   This needs to be added first.\n');
            return;
        }

        console.log(`✅ major_category attribute exists (ID: ${majorCategoryAttr.id}, Key: ${majorCategoryAttr.key})\n`);

        // 2. Check extraction results for this attribute
        const majorCategoryResults = await prisma.extractionResult.findMany({
            where: {
                attributeId: majorCategoryAttr.id
            },
            include: {
                job: {
                    select: {
                        id: true,
                        createdAt: true
                    }
                }
            },
            take: 5,
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`📊 Found ${majorCategoryResults.length} extraction results with major_category\n`);

        if (majorCategoryResults.length > 0) {
            console.log('Recent major_category values:');
            majorCategoryResults.forEach((result, i) => {
                console.log(`  ${i + 1}. ${result.finalValue || result.rawValue || '(empty)'} - Job: ${result.jobId}`);
            });
        } else {
            console.log('❌ NO major_category values found in extraction_results!');
            console.log('   The backend is NOT saving major_category to the database.\n');
        }

        // 3. Check total extraction jobs vs results with major_category
        const totalJobs = await prisma.extractionJob.count({
            where: { status: 'COMPLETED' }
        });

        const jobsWithMajorCategory = await prisma.extractionResult.count({
            where: { attributeId: majorCategoryAttr.id }
        });

        console.log(`\n📈 Statistics:`);
        console.log(`   Total completed jobs: ${totalJobs}`);
        console.log(`   Jobs with major_category: ${jobsWithMajorCategory}`);
        console.log(`   Missing major_category: ${totalJobs - jobsWithMajorCategory}`);

        if (jobsWithMajorCategory < totalJobs) {
            console.log(`\n⚠️  ${totalJobs - jobsWithMajorCategory} jobs are missing major_category!`);
            console.log('   This confirms the backend is NOT properly saving major_category.\n');
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkMajorCategory().catch(console.error);
