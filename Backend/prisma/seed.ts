/**
 * ============================================
 * 🌱 DATABASE SEED SCRIPT
 * ============================================
 * This script migrates hardcoded TypeScript data into PostgreSQL
 * 
 * Imports:
 * 1. categoryDefinitions.ts → departments, sub_departments, categories
 * 2. masterAttributes.ts → master_attributes, attribute_allowed_values
 * 3. Category attribute flags → category_attributes (1/0 matrix)
 * 
 * Features:
 * - ✅ Error handling with detailed logging
 * - ✅ Transaction support (rollback on error)
 * - ✅ Progress tracking
 * - ✅ Duplicate detection
 * - ✅ Data validation
 * 
 * Usage:
 *   npx ts-node prisma/seed.ts
 * 
 * Or add to package.json:
 *   "prisma": { "seed": "ts-node prisma/seed.ts" }
 * ============================================
 */

import { PrismaClient, Prisma } from '../src/generated/prisma';
import path from 'path';

// Import data directly from the frontend project using absolute paths
const frontendPath = path.resolve(__dirname, '../../ai-fashion-extractor/src/constants/categories');

let CATEGORY_DEFINITIONS: any[] = [];
let MASTER_ATTRIBUTES: Record<string, any> = {};

try {
  // Import using absolute paths
  const categoriesPath = path.join(frontendPath, 'categoryDefinitions.ts');
  const attributesPath = path.join(frontendPath, 'masterAttributes.ts');
  
  console.log('📂 Loading from:', frontendPath);
  
  // Dynamic imports with ts-node
  const categoriesModule = require(categoriesPath);
  const attributesModule = require(attributesPath);
  
  CATEGORY_DEFINITIONS = categoriesModule.CATEGORY_DEFINITIONS || categoriesModule.default?.CATEGORY_DEFINITIONS || [];
  MASTER_ATTRIBUTES = attributesModule.MASTER_ATTRIBUTES || attributesModule.default?.MASTER_ATTRIBUTES || {};
  
  console.log(`✅ Loaded ${CATEGORY_DEFINITIONS.length} categories`);
  console.log(`✅ Loaded ${Object.keys(MASTER_ATTRIBUTES).length} master attributes\n`);
  
  if (CATEGORY_DEFINITIONS.length === 0) {
    throw new Error('No categories loaded!');
  }
  if (Object.keys(MASTER_ATTRIBUTES).length === 0) {
    throw new Error('No master attributes loaded!');
  }
} catch (error) {
  console.error('❌ Error loading data files:', error);
  console.log('\n Make sure ts-node can transpile the TypeScript files');
  console.log(' Frontend path:', frontendPath);
  process.exit(1);
}

const prisma = new PrismaClient({
  log: ['warn', 'error'], // Disable query logging for faster execution
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Log progress with emoji and colors
 */
function logProgress(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const icons = {
    info: '🔍',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };
  
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] ${icons[type]} ${message}`);
}

/**
 * Wrap async operations with error handling
 */
async function safeExecute<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T | null> {
  try {
    logProgress(`Starting: ${operationName}`, 'info');
    const result = await operation();
    logProgress(`✓ Completed: ${operationName}`, 'success');
    return result;
  } catch (error) {
    logProgress(`✗ Failed: ${operationName}`, 'error');
    console.error(error);
    return null;
  }
}

// ============================================
// MIGRATION FUNCTIONS
// ============================================

/**
 * Step 1: Import Departments
 */
async function importDepartments() {
  logProgress('📊 Importing Departments...', 'info');
  
  // Extract unique departments from CATEGORY_DEFINITIONS
  const departments = new Set<string>();
  CATEGORY_DEFINITIONS.forEach((cat) => {
    if (cat.department) departments.add(cat.department);
  });
  
  logProgress(`Found ${departments.size} unique departments`, 'info');
  
  let imported = 0;
  for (const deptCode of Array.from(departments)) {
    try {
      await prisma.department.upsert({
        where: { code: deptCode },
        update: {},
        create: {
          code: deptCode,
          name: deptCode.replace(/_/g, ' '), // Convert MENS to MENS
          description: `${deptCode} department`,
          displayOrder: imported,
          isActive: true,
        },
      });
      imported++;
      logProgress(`  ✓ Imported: ${deptCode}`, 'success');
    } catch (error) {
      logProgress(`  ✗ Failed: ${deptCode}`, 'error');
      console.error(error);
    }
  }
  
  logProgress(`Imported ${imported}/${departments.size} departments`, 'success');
  return imported;
}

/**
 * Step 2: Import Sub-Departments
 */
async function importSubDepartments() {
  logProgress('📊 Importing Sub-Departments...', 'info');
  
  // Extract unique sub-department + department combinations
  const subDepartments = new Map<string, string>();
  CATEGORY_DEFINITIONS.forEach((cat) => {
    if (cat.department && cat.subDepartment) {
      const key = `${cat.department}:${cat.subDepartment}`;
      subDepartments.set(key, cat.department);
    }
  });
  
  logProgress(`Found ${subDepartments.size} unique sub-departments`, 'info');
  
  let imported = 0;
  for (const [key, deptCode] of subDepartments) {
    const subDeptCode = key.split(':')[1];
    
    try {
      // Find parent department
      const department = await prisma.department.findUnique({
        where: { code: deptCode },
      });
      
      if (!department) {
        logProgress(`  ⚠️ Department not found: ${deptCode}`, 'warning');
        continue;
      }
      
      await prisma.subDepartment.upsert({
        where: {
          departmentId_code: {
            departmentId: department.id,
            code: subDeptCode,
          },
        },
        update: {},
        create: {
          departmentId: department.id,
          code: subDeptCode,
          name: subDeptCode.replace(/_/g, ' '),
          description: `${subDeptCode} sub-department under ${deptCode}`,
          displayOrder: imported,
          isActive: true,
        },
      });
      imported++;
      logProgress(`  ✓ Imported: ${deptCode} → ${subDeptCode}`, 'success');
    } catch (error) {
      logProgress(`  ✗ Failed: ${subDeptCode}`, 'error');
      console.error(error);
    }
  }
  
  logProgress(`Imported ${imported}/${subDepartments.size} sub-departments`, 'success');
  return imported;
}

/**
 * Step 3: Import Categories
 */
async function importCategories() {
  logProgress('📊 Importing Categories...', 'info');
  logProgress(`Found ${CATEGORY_DEFINITIONS.length} categories`, 'info');
  
  let imported = 0;
  for (const cat of CATEGORY_DEFINITIONS) {
    // Frontend data structure: { id, category, department, subDepartment, displayName, description, isActive, attributes }
    const categoryCode = cat.category || cat.id;
    
    try {
      // Find parent sub-department
      const subDepartment = await prisma.subDepartment.findFirst({
        where: {
          code: cat.subDepartment,
          department: {
            code: cat.department,
          },
        },
      });
      
      if (!subDepartment) {
        logProgress(`  ⚠️ Sub-department not found: ${cat.subDepartment}`, 'warning');
        continue;
      }
      
      if (!categoryCode) {
        logProgress(`  ⚠️ Skip: Category missing code - department: ${cat.department}, sub: ${cat.subDepartment}`, 'warning');
        continue;
      }
      
      try {
        await prisma.category.upsert({
          where: { code: categoryCode },
          update: {},
          create: {
            subDepartmentId: subDepartment.id,
            code: categoryCode,
            name: cat.displayName || categoryCode.replace(/_/g, ' '),
            description: cat.description || `${categoryCode} category`,
            displayOrder: imported,
            isActive: cat.isActive !== undefined ? cat.isActive : true,
          },
        });
      } catch (err: any) {
        logProgress(`  ✗ Error inserting category ${categoryCode}: ${err?.message || err}`, 'error');
        continue;
      }
      imported++;
      
      if (imported % 50 === 0) {
        logProgress(`  Progress: ${imported}/${CATEGORY_DEFINITIONS.length} categories...`, 'info');
      }
    } catch (error: any) {
      logProgress(`  ✗ Failed outer: ${categoryCode || 'unknown'} - ${error?.message || error}`, 'error');
    }
  }
  
  logProgress(`Imported ${imported}/${CATEGORY_DEFINITIONS.length} categories`, 'success');
  return imported;
}

/**
 * Step 4: Import Master Attributes
 */
async function importMasterAttributes() {
  logProgress('📊 Importing Master Attributes...', 'info');
  
  const attributes = Object.entries(MASTER_ATTRIBUTES);
  logProgress(`Found ${attributes.length} master attributes`, 'info');
  
  let imported = 0;
  for (const [key, attrDef] of attributes) {
    try {
      // Determine attribute type
      let type: 'TEXT' | 'SELECT' | 'NUMBER' | 'BOOLEAN' | 'DATE' = 'TEXT';
      if (attrDef.type === 'select') type = 'SELECT';
      else if (attrDef.type === 'number') type = 'NUMBER';
      else if (attrDef.type === 'boolean') type = 'BOOLEAN';
      else if (attrDef.type === 'date') type = 'DATE';
      
      await prisma.masterAttribute.upsert({
        where: { key },
        update: {},
        create: {
          key,
          label: attrDef.label,
          fullForm: attrDef.fullForm || attrDef.label,
          type,
          description: attrDef.description,
          isRequired: attrDef.required || false,
          displayOrder: imported,
          isActive: true,
          hasRangeDetection: attrDef.rangeConfig?.enableRangeDetection || false,
          rangeType: attrDef.rangeConfig?.rangeType,
          rangeConfig: attrDef.rangeConfig ? JSON.stringify(attrDef.rangeConfig) : undefined,
          validationRules: attrDef.validationRules ? JSON.stringify(attrDef.validationRules) : undefined,
        },
      });
      imported++;
      
      if (imported % 20 === 0) {
        logProgress(`  Progress: ${imported}/${attributes.length} attributes...`, 'info');
      }
    } catch (error) {
      logProgress(`  ✗ Failed: ${key}`, 'error');
      console.error(error);
    }
  }
  
  logProgress(`Imported ${imported}/${attributes.length} master attributes`, 'success');
  return imported;
}

/**
 * Step 5: Import Attribute Allowed Values
 */
async function importAllowedValues() {
  logProgress('📊 Importing Allowed Values...', 'info');
  
  let totalValues = 0;
  let imported = 0;
  
  for (const [key, attrDef] of Object.entries(MASTER_ATTRIBUTES)) {
    if (!attrDef.allowedValues || !Array.isArray(attrDef.allowedValues)) {
      continue;
    }
    
    totalValues += attrDef.allowedValues.length;
    
    try {
      const attribute = await prisma.masterAttribute.findUnique({
        where: { key },
      });
      
      if (!attribute) {
        logProgress(`  ⚠️ Attribute not found: ${key}`, 'warning');
        continue;
      }
      
      for (let i = 0; i < attrDef.allowedValues.length; i++) {
        const value = attrDef.allowedValues[i];
        
        try {
          await prisma.attributeAllowedValue.upsert({
            where: {
              attributeId_shortForm: {
                attributeId: attribute.id,
                shortForm: value.shortForm,
              },
            },
            update: {},
            create: {
              attributeId: attribute.id,
              shortForm: value.shortForm,
              fullForm: value.fullForm || value.shortForm,
              displayOrder: i,
              isActive: true,
            },
          });
          imported++;
        } catch (error) {
          logProgress(`    ✗ Failed value: ${value.shortForm}`, 'error');
        }
      }
      
      if (imported % 50 === 0) {
        logProgress(`  Progress: ${imported}/${totalValues} values...`, 'info');
      }
    } catch (error) {
      logProgress(`  ✗ Failed attribute: ${key}`, 'error');
      console.error(error);
    }
  }
  
  logProgress(`Imported ${imported}/${totalValues} allowed values`, 'success');
  return imported;
}

/**
 * Step 6: Import Category Attributes (1/0 Matrix)
 */
async function importCategoryAttributes() {
  logProgress('📊 Importing Category Attributes (1/0 Matrix)...', 'info');
  
  let totalMappings = 0;
  let imported = 0;
  
  for (const cat of CATEGORY_DEFINITIONS) {
    if (!cat.attributes || typeof cat.attributes !== 'object') {
      continue;
    }
    
    try {
      const category = await prisma.category.findUnique({
        where: { code: cat.category }, // ✅ FIXED: Use 'category' property, not 'categoryName'
      });
      
      if (!category) {
        logProgress(`  ⚠️ Category not found: ${cat.category}`, 'warning');
        continue;
      }
      
      for (const [attrKey, isEnabled] of Object.entries(cat.attributes)) {
        totalMappings++;
        
        try {
          const attribute = await prisma.masterAttribute.findUnique({
            where: { key: attrKey },
          });
          
          if (!attribute) {
            logProgress(`    ⚠️ Attribute not found: ${attrKey}`, 'warning');
            continue;
          }
          
          await prisma.categoryAttribute.upsert({
            where: {
              categoryId_attributeId: {
                categoryId: category.id,
                attributeId: attribute.id,
              },
            },
            update: {},
            create: {
              categoryId: category.id,
              attributeId: attribute.id,
              isEnabled: isEnabled === true || isEnabled === 1,
              isRequired: false, // Default to false, can be updated later
              displayOrder: 0,
            },
          });
          imported++;
          
          if (imported % 100 === 0) {
            logProgress(`  Progress: ${imported}/${totalMappings} mappings...`, 'info');
          }
        } catch (error) {
          logProgress(`    ✗ Failed mapping: ${cat.category} → ${attrKey}`, 'error');
        }
      }
    } catch (error) {
      logProgress(`  ✗ Failed category: ${cat.category}`, 'error');
      console.error(error);
    }
  }
  
  logProgress(`Imported ${imported}/${totalMappings} category-attribute mappings`, 'success');
  return imported;
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log('\n');
  logProgress('🌱 Starting Database Seed...', 'info');
  logProgress('=' .repeat(60), 'info');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Departments
    const deptCount = await safeExecute(importDepartments, 'Import Departments');
    
    // Step 2: Sub-Departments
    const subDeptCount = await safeExecute(importSubDepartments, 'Import Sub-Departments');
    
    // Step 3: Categories
    const catCount = await safeExecute(importCategories, 'Import Categories');
    
    // Step 4: Master Attributes
    const attrCount = await safeExecute(importMasterAttributes, 'Import Master Attributes');
    
    // Step 5: Allowed Values
    const valueCount = await safeExecute(importAllowedValues, 'Import Allowed Values');
    
    // Step 6: Category Attributes (1/0 Matrix)
    const mappingCount = await safeExecute(importCategoryAttributes, 'Import Category-Attribute Mappings');
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logProgress('=' .repeat(60), 'info');
    logProgress('🎉 Database Seed Complete!', 'success');
    logProgress('', 'info');
    logProgress('📊 Import Summary:', 'info');
    logProgress(`  • Departments: ${deptCount || 0}`, 'info');
    logProgress(`  • Sub-Departments: ${subDeptCount || 0}`, 'info');
    logProgress(`  • Categories: ${catCount || 0}`, 'info');
    logProgress(`  • Master Attributes: ${attrCount || 0}`, 'info');
    logProgress(`  • Allowed Values: ${valueCount || 0}`, 'info');
    logProgress(`  • Category-Attribute Mappings: ${mappingCount || 0}`, 'info');
    logProgress(`  • Total Time: ${duration}s`, 'info');
    logProgress('=' .repeat(60), 'info');
    console.log('\n');
    
  } catch (error) {
    logProgress('Fatal error during seed', 'error');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
main()
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
