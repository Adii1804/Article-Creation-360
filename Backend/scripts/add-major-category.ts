import { PrismaClient } from '../src/generated/prisma';

async function addMajorCategoryAttribute() {
    const prisma = new PrismaClient();

    try {
        console.log('🔧 Adding major_category attribute to master_attributes...\n');

        // Check if it already exists
        const existing = await prisma.masterAttribute.findFirst({
            where: { key: 'major_category' }
        });

        if (existing) {
            console.log('✅ major_category already exists!');
            console.log(`   ID: ${existing.id}`);
            console.log(`   Key: ${existing.key}`);
            console.log(`   Label: ${existing.label}\n`);
            return;
        }

        // Create the attribute
        const majorCategory = await prisma.masterAttribute.create({
            data: {
                key: 'major_category',
                label: 'Major Category',
                fullForm: 'Major Product Category',
                type: 'SELECT',
                category: 'Classification',
                description: 'The primary category of the garment (e.g., Topwear, Bottomwear, Dress)',
                isRequired: true,
                displayOrder: 1,
                isActive: true,
                aiExtractable: true,
                visibleFromDistance: true,
                extractionPriority: 100, // Highest priority
                confidenceThreshold: 0.80
            }
        });

        console.log('✅ Successfully created major_category attribute!');
        console.log(`   ID: ${majorCategory.id}`);
        console.log(`   Key: ${majorCategory.key}`);
        console.log(`   Label: ${majorCategory.label}\n`);

        // Add common allowed values
        console.log('📝 Adding common major category values...');

        const commonCategories = [
            { short: 'Topwear', full: 'Topwear' },
            { short: 'Bottomwear', full: 'Bottomwear' },
            { short: 'Dress', full: 'Dress' },
            { short: 'Innerwear', full: 'Innerwear' },
            { short: 'Outerwear', full: 'Outerwear' },
            { short: 'Footwear', full: 'Footwear' },
            { short: 'Accessories', full: 'Accessories' },
            { short: 'Sportswear', full: 'Sportswear' }
        ];

        for (const cat of commonCategories) {
            await prisma.attributeAllowedValue.create({
                data: {
                    attributeId: majorCategory.id,
                    shortForm: cat.short,
                    fullForm: cat.full,
                    isActive: true
                }
            });
            console.log(`   ✓ Added: ${cat.full}`);
        }

        console.log('\n✅ All done! major_category is now ready to use.\n');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

addMajorCategoryAttribute().catch(console.error);
