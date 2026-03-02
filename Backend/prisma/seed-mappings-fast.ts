/**
 *  ULTRA-FAST Seed Script - Category-Attribute Mappings
 * 
 * Optimizations:
 * - Loads all categories and attributes into memory ONCE
 * - Uses Map for O(1) lookups
 * - Batches database inserts (100 at a time)
 * - Skips missing attributes silently
 */

import { PrismaClient } from '../src/generated/prisma';
import path from 'path';

const prisma = new PrismaClient();

// Load category definitions from frontend
const FRONTEND_ROOT = path.resolve(__dirname, '../../ai-fashion-extractor/src/constants/categories');
const categoryDefinitionsPath = path.join(FRONTEND_ROOT, 'categoryDefinitions.ts');
const { CATEGORY_DEFINITIONS } = require(categoryDefinitionsPath);

console.log(`📂 Loaded ${CATEGORY_DEFINITIONS.length} category definitions`);
console.log(`Starting ULTRA-FAST Category-Attribute Mappings Import...\n`);

async function seedCategoryAttributeMappingsFast() {
  const startTime = Date.now();

  //  STEP 1: Load ALL categories and attributes into memory (ONE query each)
  console.log(' Step 1: Loading all categories...');
  const allCategories = await prisma.category.findMany({
    select: { id: true, code: true }
  });
  const categoryMap = new Map(allCategories.map(c => [c.code, c.id]));
  console.log(`   ✅ Loaded ${allCategories.length} categories`);

  console.log(' Step 2: Loading all attributes...');
  const allAttributes = await prisma.masterAttribute.findMany({
    select: { id: true, key: true }
  });
  const attributeMap = new Map(allAttributes.map(a => [a.key, a.id]));
  console.log(`   ✅ Loaded ${allAttributes.length} attributes`);

  //  STEP 3: Load existing mappings to avoid duplicates
  console.log(' Step 3: Loading existing mappings...');
  const existingMappings = await prisma.categoryAttribute.findMany({
    select: { categoryId: true, attributeId: true }
  });
  const existingSet = new Set(
    existingMappings.map(m => `${m.categoryId}-${m.attributeId}`)
  );
  console.log(`   ✅ Found ${existingMappings.length} existing mappings\n`);

  //  STEP 4: Build mappings in memory
  console.log(' Step 4: Building mappings in memory...');
  const mappingsToCreate: any[] = [];
  let totalProcessed = 0;
  let skippedMissing = 0;
  let skippedExisting = 0;

  for (const cat of CATEGORY_DEFINITIONS) {
    if (!cat.attributes || typeof cat.attributes !== 'object') continue;

    const categoryId = categoryMap.get(cat.category);
    if (!categoryId) {
      skippedMissing++;
      continue;
    }

    for (const [attrKey, isEnabled] of Object.entries(cat.attributes)) {
      totalProcessed++;

      const attributeId = attributeMap.get(attrKey);
      if (!attributeId) {
        skippedMissing++;
        continue;
      }

      // Check if already exists
      const mapKey = `${categoryId}-${attributeId}`;
      if (existingSet.has(mapKey)) {
        skippedExisting++;
        continue;
      }

      mappingsToCreate.push({
        categoryId,
        attributeId,
        isEnabled: Boolean(isEnabled),
        isRequired: false,
        displayOrder: mappingsToCreate.length,
        defaultValue: null,
      });
    }
  }

  console.log(`   ✅ Built ${mappingsToCreate.length} new mappings to insert\n`);

  //  STEP 5: Batch insert (100 at a time for safety)
  if (mappingsToCreate.length === 0) {
    console.log('✅ No new mappings to insert. Database is up to date!\n');
  } else {
    console.log(` Step 5: Inserting ${mappingsToCreate.length} mappings in batches...`);
    const BATCH_SIZE = 100;
    let inserted = 0;

    for (let i = 0; i < mappingsToCreate.length; i += BATCH_SIZE) {
      const batch = mappingsToCreate.slice(i, i + BATCH_SIZE);
      
      await prisma.categoryAttribute.createMany({
        data: batch,
        skipDuplicates: true,
      });

      inserted += batch.length;
      
      // Progress indicator
      if (inserted % 500 === 0 || inserted === mappingsToCreate.length) {
        const progress = ((inserted / mappingsToCreate.length) * 100).toFixed(1);
        console.log(`   📊 Progress: ${inserted}/${mappingsToCreate.length} (${progress}%)`);
      }
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '═'.repeat(70));
  console.log('🎉 ULTRA-FAST Category-Attribute Mappings Import Complete!');
  console.log('═'.repeat(70));
  console.log(`✅ Inserted:         ${mappingsToCreate.length.toLocaleString()} new mappings`);
  console.log(`⏭️  Skipped (exists): ${skippedExisting.toLocaleString()} existing mappings`);
  console.log(`⏭️  Skipped (missing): ${skippedMissing.toLocaleString()} missing attributes`);
  console.log(`📊 Total processed:  ${totalProcessed.toLocaleString()} attributes`);
  console.log(` Duration:         ${duration}s (${(mappingsToCreate.length / parseFloat(duration)).toFixed(0)} mappings/sec)`);
  console.log('═'.repeat(70) + '\n');
}

async function main() {
  try {
    await seedCategoryAttributeMappingsFast();
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
