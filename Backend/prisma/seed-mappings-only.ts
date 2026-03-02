/**
 * Fast Seed Script - Category-Attribute Mappings Only
 * 
 * This script ONLY seeds the category_attributes junction table.
 * All other data (departments, categories, attributes) should already exist.
 */

import { PrismaClient } from '../src/generated/prisma';
import path from 'path';

const prisma = new PrismaClient();

// Load category definitions from frontend
const FRONTEND_ROOT = path.resolve(__dirname, '../../ai-fashion-extractor/src/constants/categories');
console.log(`📂 Loading from: ${FRONTEND_ROOT}`);

// Dynamic import with proper typing
const categoryDefinitionsPath = path.join(FRONTEND_ROOT, 'categoryDefinitions.ts');
const { CATEGORY_DEFINITIONS } = require(categoryDefinitionsPath);

console.log(`✅ Loaded ${CATEGORY_DEFINITIONS.length} category definitions\n`);

async function seedCategoryAttributeMappings() {
  console.log('Starting Category-Attribute Mappings Import...\n');
  
  let totalMappings = 0;
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  const startTime = Date.now();

  for (const cat of CATEGORY_DEFINITIONS) {
    if (!cat.attributes || typeof cat.attributes !== 'object') {
      continue;
    }

    // Find category by code
    const category = await prisma.category.findUnique({
      where: { code: cat.category },
    });

    if (!category) {
      console.log(`  ⚠️  Category not found in DB: ${cat.category}`);
      errors++;
      continue;
    }

    // Process all attributes for this category
    for (const [attrKey, isEnabled] of Object.entries(cat.attributes)) {
      totalMappings++;

      // Find attribute by key
      const attribute = await prisma.masterAttribute.findUnique({
        where: { key: attrKey },
      });

      if (!attribute) {
        console.log(`    ⚠️  Attribute not found: ${attrKey}`);
        errors++;
        continue;
      }

      try {
        // Check if mapping already exists
        const existing = await prisma.categoryAttribute.findUnique({
          where: {
            categoryId_attributeId: {
              categoryId: category.id,
              attributeId: attribute.id,
            },
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create the mapping
        await prisma.categoryAttribute.create({
          data: {
            categoryId: category.id,
            attributeId: attribute.id,
            isEnabled: Boolean(isEnabled),
            isRequired: false, // Default value
            displayOrder: totalMappings, // Use counter as order
            defaultValue: null,
          },
        });
        
        imported++;

        // Progress indicator every 100 mappings
        if (imported % 100 === 0) {
          console.log(`  ✅ Progress: ${imported} mappings imported...`);
        }
      } catch (error: any) {
        errors++;
        if (errors < 10) { // Only show first 10 errors
          console.log(`    ❌ Error creating mapping: ${cat.category} → ${attrKey}`);
          console.log(`       ${error.message}`);
        }
      }
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Category-Attribute Mappings Import Complete!');
  console.log('='.repeat(60));
  console.log(`✅ Imported:     ${imported.toLocaleString()} new mappings`);
  console.log(`⏭️  Skipped:      ${skipped.toLocaleString()} existing mappings`);
  console.log(`❌ Errors:       ${errors.toLocaleString()}`);
  console.log(`📊 Total:        ${totalMappings.toLocaleString()} attributes processed`);
  console.log(`⏱️  Duration:     ${duration}s`);
  console.log('='.repeat(60) + '\n');
}

async function main() {
  try {
    await seedCategoryAttributeMappings();
  } catch (error) {
    console.error('❌ Fatal Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('❌ Unhandled Error:', error);
    process.exit(1);
  });
