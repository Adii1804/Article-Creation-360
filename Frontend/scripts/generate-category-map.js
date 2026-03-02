const fs = require('fs');
const path = require('path');

const categoriesPath = path.join(__dirname, '../../categories.json');
const outputPath = path.join(__dirname, '../src/data/majorCategoryMap.ts');

try {
    const data = fs.readFileSync(categoriesPath, 'utf8');
    const categories = JSON.parse(data);

    const tsContent = `export const MAJOR_CATEGORY_ALLOWED_VALUES = ${JSON.stringify(categories, null, 4)};`;

    fs.writeFileSync(outputPath, tsContent);
    console.log(`Successfully generated ${outputPath}`);
} catch (error) {
    console.error('Error generating map:', error);
    process.exit(1);
}
