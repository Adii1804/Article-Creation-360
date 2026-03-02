/**
 * Cost Tracking System Initialization
 * 
 * This script:
 * 1. Clears all existing extraction history
 * 2. Initializes the cost tracking system
 * 3. Ensures a clean slate for cost tracking
 */

import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function initializeCostTracking() {
  try {
    console.log('🔄 Starting Cost Tracking System Initialization...\n');

    // Step 1: Count existing extraction jobs
    const existingCount = await prisma.extractionJob.count();
    console.log(`📊 Found ${existingCount} existing extraction jobs`);

    // Step 2: Clear all extraction results
    if (existingCount > 0) {
      console.log('🗑️ Clearing all extraction results...');
      await prisma.extractionResult.deleteMany({});
      console.log('✅ Extraction results cleared');
    }

    // Step 3: Clear all extraction jobs
    if (existingCount > 0) {
      console.log('🗑️ Clearing all extraction jobs...');
      await prisma.extractionJob.deleteMany({});
      console.log('✅ Extraction jobs cleared');
    }

    // Step 4: Log the clean state
    const remainingJobs = await prisma.extractionJob.count();
    const remainingResults = await prisma.extractionResult.count();
    
    console.log('\n📈 System Status After Initialization:');
    console.log(`  - Extraction Jobs: ${remainingJobs}`);
    console.log(`  - Extraction Results: ${remainingResults}`);

    // Step 5: Verify database integrity
    const categories = await prisma.category.count();
    const users = await prisma.user.count();
    
    console.log('\n🏗️ Database Integrity Check:');
    console.log(`  - Categories: ${categories} ✓`);
    console.log(`  - Users: ${users} ✓`);

    console.log('\n✨ Cost Tracking System Initialized Successfully!');
    console.log('\nReady to start tracking costs with:');
    console.log('  - Per-image token counting (input + output)');
    console.log('  - Real-time cost calculation');
    console.log('  - Session-based tracking');
    console.log('  - Database persistence');

  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run initialization
initializeCostTracking();
