import { PrismaClient } from '../src/generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function importMajorCategories() {
    const prisma = new PrismaClient();

    try {
        console.log('📥 Importing major categories from categories.json...\n');

        // Read the categories JSON file
        const categoriesPath = path.join(__dirname, '../../categories.json');
        const categoriesData: Array<{ shortForm: string; fullForm: string }> = JSON.parse(
            fs.readFileSync(categoriesPath, 'utf-8')
        );

        console.log(`✅ Loaded ${categoriesData.length} categories from JSON\n`);

        // Get the major_category attribute
        const majorCategoryAttr = await prisma.masterAttribute.findFirst({
            where: { key: 'major_category' }
        });

        if (!majorCategoryAttr) {
            console.log('❌ major_category attribute not found!');
            console.log('   Run add-major-category.ts first.\n');
            return;
        }

        console.log(`✅ Found major_category attribute (ID: ${majorCategoryAttr.id})\n`);

        // DELETE old incorrect values
        console.log('🗑️  Deleting old incorrect values...');
        const deleted = await prisma.attributeAllowedValue.deleteMany({
            where: { attributeId: majorCategoryAttr.id }
        });
        console.log(`   Deleted ${deleted.count} old values\n`);

        // INSERT new values from JSON (skip duplicates)
        console.log('📝 Inserting new category values...');

        const seen = new Set<string>();
        let inserted = 0;
        let skipped = 0;

        for (const category of categoriesData) {
            // Skip duplicates
            if (seen.has(category.shortForm)) {
                skipped++;
                continue;
            }

            await prisma.attributeAllowedValue.create({
                data: {
                    attributeId: majorCategoryAttr.id,
                    shortForm: category.shortForm,
                    fullForm: category.fullForm,
                    isActive: true
                }
            });

            seen.add(category.shortForm);
            inserted++;

            // Show progress every 50 items
            if (inserted % 50 === 0) {
                console.log(`   Inserted ${inserted}/${categoriesData.length - skipped}...`);
            }
        }

        console.log(`\n✅ Successfully inserted ${inserted} category values!`);
        if (skipped > 0) {
            console.log(`⚠️  Skipped ${skipped} duplicate entries\n`);
        } else {
            console.log('');
        }

        // Show sample of what was inserted
        console.log('📋 Sample categories:');
        const samples = categoriesData.slice(0, 5);
        samples.forEach((cat, i) => {
            console.log(`   ${i + 1}. ${cat.shortForm} → ${cat.fullForm}`);
        });
        console.log(`   ... and ${categoriesData.length - 5} more\n`);

        console.log('🎉 Import complete!\n');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

importMajorCategories().catch(console.error);
