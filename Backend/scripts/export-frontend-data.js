/**
 * Export frontend TypeScript data to JSON for database seeding
 * Run this before db:seed to generate JSON data files
 */

const fs = require('fs');
const path = require('path');

console.log('📦 Exporting frontend data to JSON...\n');

// Paths
const frontendSrcPath = path.join(__dirname, '../../ai-fashion-extractor/src');
const outputPath = path.join(__dirname, '../prisma/data');

// Create output directory
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
  console.log('✅ Created output directory:', outputPath);
}

// Read and parse TypeScript files
const categoryDefPath = path.join(frontendSrcPath, 'constants/categories/categoryDefinitions.ts');
const masterAttrPath = path.join(frontendSrcPath, 'constants/categories/masterAttributes.ts');

if (!fs.existsSync(categoryDefPath)) {
  console.error('❌ Error: categoryDefinitions.ts not found at:', categoryDefPath);
  process.exit(1);
}

if (!fs.existsSync(masterAttrPath)) {
  console.error('❌ Error: masterAttributes.ts not found at:', masterAttrPath);
  process.exit(1);
}

console.log('📖 Reading TypeScript files...');
const categoryDefContent = fs.readFileSync(categoryDefPath, 'utf8');
const masterAttrContent = fs.readFileSync(masterAttrPath, 'utf8');

// Extract JSON-like data using regex (simple approach)
// This works because the TS files export const with object literals

function extractExportedData(content, exportName) {
  // Remove imports and types
  let cleaned = content.replace(/import\s+.*?;/g, '');
  cleaned = cleaned.replace(/export\s+const\s+\w+:\s+[\w\[\]<>]+\s*=\s*/, 'module.exports = ');
  
  // For CATEGORY_DEFINITIONS
  if (exportName === 'CATEGORY_DEFINITIONS') {
    const match = content.match(/export const CATEGORY_DEFINITIONS[:\s\w\[\]<>]+= (\[[\s\S]+\]);/);
    if (match) {
      // Clean up TypeScript-specific syntax
      let data = match[1];
      data = data.replace(/new Date\(\)/g, '"' + new Date().toISOString() + '"');
      data = data.replace(/type:\s*['"](\w+)['"]/g, 'type: "$1"');
      return data;
    }
  }
  
  // For MASTER_ATTRIBUTES
  if (exportName === 'MASTER_ATTRIBUTES') {
    const match = content.match(/export const MASTER_ATTRIBUTES[:\s\w\[\]<>,{}]+= (\{[\s\S]+\});/);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

console.log('🔍 Extracting CATEGORY_DEFINITIONS...');
const categoryData = extractExportedData(categoryDefContent, 'CATEGORY_DEFINITIONS');

console.log('🔍 Extracting MASTER_ATTRIBUTES...');
const masterAttrData = extractExportedData(masterAttrContent, 'MASTER_ATTRIBUTES');

if (!categoryData) {
  console.error('❌ Failed to extract CATEGORY_DEFINITIONS');
  process.exit(1);
}

if (!masterAttrData) {
  console.error('❌ Failed to extract MASTER_ATTRIBUTES');
  process.exit(1);
}

// Write to JSON files
try {
  console.log('\n📝 Writing JSON files...');
  
  // Write categories
  const categoriesOutput = path.join(outputPath, 'categories.json');
  fs.writeFileSync(categoriesOutput, categoryData);
  console.log('✅ Wrote categories.json (' + (categoryData.length / 1024).toFixed(2) + ' KB)');
  
  // Write attributes
  const attributesOutput = path.join(outputPath, 'attributes.json');
  fs.writeFileSync(attributesOutput, masterAttrData);
  console.log('✅ Wrote attributes.json (' + (masterAttrData.length / 1024).toFixed(2) + ' KB)');
  
  console.log('\n🎉 Export complete! Run `npm run db:seed` to import data.');
} catch (error) {
  console.error('❌ Error writing JSON files:', error);
  process.exit(1);
}
