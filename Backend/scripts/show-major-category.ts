import { PrismaClient } from '../src/generated/prisma';

async function showMajorCategoryData() {
    const prisma = new PrismaClient();

    try {
        console.log('📋 Major Category Attribute Data\n');

        // Get the attribute
        const attr = await prisma.masterAttribute.findFirst({
            where: { key: 'major_category' },
            include: {
                allowedValues: {
                    orderBy: { shortForm: 'asc' }
                }
            }
        });

        if (!attr) {
            console.log('❌ major_category not found!');
            return;
        }

        console.log('🏷️  Attribute Details:');
        console.log('─'.repeat(60));
        console.log(`ID:                  ${attr.id}`);
        console.log(`Key:                 ${attr.key}`);
        console.log(`Label:               ${attr.label}`);
        console.log(`Full Form:           ${attr.fullForm}`);
        console.log(`Type:                ${attr.type}`);
        console.log(`Category:            ${attr.category}`);
        console.log(`Description:         ${attr.description}`);
        console.log(`Required:            ${attr.isRequired ? 'Yes' : 'No'}`);
        console.log(`AI Extractable:      ${attr.aiExtractable ? 'Yes' : 'No'}`);
        console.log(`Extraction Priority: ${attr.extractionPriority}`);
        console.log(`Display Order:       ${attr.displayOrder}`);

        console.log('\n📝 Allowed Values:');
        console.log('─'.repeat(60));

        if (attr.allowedValues.length === 0) {
            console.log('   (No predefined values)');
        } else {
            attr.allowedValues.forEach((val, i) => {
                console.log(`${(i + 1).toString().padStart(2)}. ${val.shortForm.padEnd(20)} (Full: ${val.fullForm})`);
            });
        }

        console.log('\n' + '═'.repeat(60));
        console.log(`Total Allowed Values: ${attr.allowedValues.length}`);
        console.log('═'.repeat(60) + '\n');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

showMajorCategoryData().catch(console.error);
