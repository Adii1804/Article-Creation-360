/**
 * FAST DATABASE SEED SCRIPT
 * Uses batch operations for 100x speed improvement
 */

import { PrismaClient } from '../src/generated/prisma';
import path from 'path';

const frontendPath = path.resolve(__dirname, '../../ai-fashion-extractor/src/constants/categories');

let CATEGORY_DEFINITIONS: any[] = [];
let MASTER_ATTRIBUTES: Record<string, any> = {};

try {
  const categoriesPath = path.join(frontendPath, 'categoryDefinitions.ts');
  const attributesPath = path.join(frontendPath, 'masterAttributes.ts');
  
  const categoriesModule = require(categoriesPath);
  const attributesModule = require(attributesPath);
  
  CATEGORY_DEFINITIONS = categoriesModule.CATEGORY_DEFINITIONS || [];
  MASTER_ATTRIBUTES = attributesModule.MASTER_ATTRIBUTES || {};
  
  console.log(`✅ Loaded ${CATEGORY_DEFINITIONS.length} categories`);
  console.log(`✅ Loaded ${Object.keys(MASTER_ATTRIBUTES).length} master attributes\n`);
} catch (error) {
  console.error('❌ Error loading data:', error);
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  console.log('Starting FAST database seed...\n');
  
  try {
    // Step 1: Extract unique departments
    console.log('📊 Step 1/5: Departments...');
    const deptSet = new Set<string>();
    CATEGORY_DEFINITIONS.forEach(cat => cat.department && deptSet.add(cat.department));
    const departments = Array.from(deptSet).map((code, i) => ({
      code,
      name: code.replace(/_/g, ' '),
      description: `${code} department`,
      displayOrder: i,
      isActive: true,
    }));
    
    await prisma.department.createMany({ data: departments, skipDuplicates: true });
    console.log(`✅ Inserted ${departments.length} departments\n`);
    
    // Step 2: Extract unique subdepartments
    console.log('📊 Step 2/5: Sub-Departments...');
    const subDeptMap = new Map<string, { dept: string, code: string }>();
    CATEGORY_DEFINITIONS.forEach(cat => {
      if (cat.department && cat.subDepartment) {
        const key = `${cat.department}:${cat.subDepartment}`;
        if (!subDeptMap.has(key)) {
          subDeptMap.set(key, { dept: cat.department, code: cat.subDepartment });
        }
      }
    });
    
    // Get department IDs
    const deptRecords = await prisma.department.findMany();
    const deptMap = new Map(deptRecords.map((d: { code: any; id: any; }) => [d.code, d.id]));
    
    const subDepartments = Array.from(subDeptMap.values()).map((sd, i) => ({
      departmentId: deptMap.get(sd.dept)!,
      code: sd.code,
      name: sd.code.replace(/_/g, ' '),
      description: `${sd.code} sub-department`,
      displayOrder: i,
      isActive: true,
    })).filter(sd => sd.departmentId); // Only include if parent dept exists
    
    await prisma.subDepartment.createMany({ data: subDepartments, skipDuplicates: true });
    console.log(`✅ Inserted ${subDepartments.length} sub-departments\n`);
    
    // Step 3: Insert categories in batches
    console.log('📊 Step 3/5: Categories (283 items)...');
    
    // Get subdepartment IDs
    const subDeptRecords = await prisma.subDepartment.findMany({ include: { department: true } });
    const subDeptLookup = new Map(
      subDeptRecords.map((sd: { department: { code: any; }; code: any; id: any; }) => [`${sd.department.code}:${sd.code}`, sd.id])
    );
    
    const categories = CATEGORY_DEFINITIONS.map((cat, i) => {
      const categoryCode = cat.category || cat.id;
      const key = `${cat.department}:${cat.subDepartment}`;
      const subDeptId = subDeptLookup.get(key);
      
      if (!categoryCode || !subDeptId) return null;
      
      return {
        subDepartmentId: subDeptId,
        code: categoryCode,
        name: cat.displayName || categoryCode.replace(/_/g, ' '),
        description: cat.description || `${categoryCode} category`,
        displayOrder: i,
        isActive: cat.isActive !== false,
      };
    }).filter(Boolean);
    
    // Insert in batches of 50 for better performance
    const BATCH_SIZE = 50;
    for (let i = 0; i < categories.length; i += BATCH_SIZE) {
      const batch = categories.slice(i, i + BATCH_SIZE);
      await prisma.category.createMany({ data: batch as any, skipDuplicates: true });
      process.stdout.write(`\r   Progress: ${Math.min(i + BATCH_SIZE, categories.length)}/${categories.length}`);
    }
    console.log(`\n✅ Inserted ${categories.length} categories\n`);
    
    // Step 4: Insert master attributes
    console.log('📊 Step 4/5: Master Attributes...');
    const attributes = Object.values(MASTER_ATTRIBUTES).map((attr: any, i) => ({
      key: attr.key,
      label: attr.label,
      type: attr.type?.toUpperCase() || 'TEXT', // Convert to uppercase for Prisma enum
      description: attr.description || `${attr.label} attribute`,
      displayOrder: i,
      isActive: true,
    }));
    
    await prisma.masterAttribute.createMany({ data: attributes, skipDuplicates: true });
    console.log(`✅ Inserted ${attributes.length} master attributes\n`);
    
    // Step 5: Insert allowed values
    console.log('📊 Step 5/5: Attribute Allowed Values...');
    
    // Get attribute IDs
    const attrRecords = await prisma.masterAttribute.findMany();
    const attrMap = new Map(attrRecords.map((a: { key: any; id: any; }) => [a.key, a.id]));
    
    const allowedValues: any[] = [];
    Object.values(MASTER_ATTRIBUTES).forEach((attr: any) => {
      const attrId = attrMap.get(attr.key);
      if (attrId && attr.allowedValues && Array.isArray(attr.allowedValues)) {
        attr.allowedValues.forEach((val: any, i: number) => {
          allowedValues.push({
            attributeId: attrId, // Correct field name from schema
            shortForm: val.shortForm || val.value || String(val),
            fullForm: val.fullForm || val.label || val.shortForm || String(val),
            displayOrder: i,
            isActive: true,
          });
        });
      }
    });
    
    // Insert in batches
    for (let i = 0; i < allowedValues.length; i += 100) {
      const batch = allowedValues.slice(i, i + 100);
      await prisma.attributeAllowedValue.createMany({ data: batch, skipDuplicates: true });
      process.stdout.write(`\r   Progress: ${Math.min(i + 100, allowedValues.length)}/${allowedValues.length}`);
    }
    console.log(`\n✅ Inserted ${allowedValues.length} allowed values\n`);
    
    // Final summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 DATABASE SEED COMPLETED!');
    console.log('═══════════════════════════════════════');
    const stats = await Promise.all([
      prisma.department.count(),
      prisma.subDepartment.count(),
      prisma.category.count(),
      prisma.masterAttribute.count(),
      prisma.attributeAllowedValue.count(),
    ]);
    console.log(`📊 Departments:        ${stats[0]}`);
    console.log(`📊 Sub-Departments:    ${stats[1]}`);
    console.log(`📊 Categories:         ${stats[2]}`);
    console.log(`📊 Master Attributes:  ${stats[3]}`);
    console.log(`📊 Allowed Values:     ${stats[4]}`);
    console.log('═══════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
