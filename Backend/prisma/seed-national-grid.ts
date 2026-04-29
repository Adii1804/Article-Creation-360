/**
 * seed-national-grid.ts
 *
 * Inserts attribute values from NATIONAL_GRID_REVISED Excel (extracted to JSON).
 * Values are scoped by division: MENS | LADIES | KIDS.
 * Clears existing division-scoped values before inserting.
 *
 * Run: npx ts-node prisma/seed-national-grid.ts
 */

import { PrismaClient } from '../src/generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const BATCH_SIZE = 500;

async function main() {
  const jsonPath = path.join(__dirname, 'national-grid-values.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error('national-grid-values.json not found. Run the Python extraction script first.');
  }

  const gridData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as Record<
    string,
    Record<string, string[]>
  >;

  // Load all field configs into a dbField → id map
  const configs = await prisma.sapFieldConfig.findMany({ select: { id: true, dbField: true } });
  const fieldMap = new Map(configs.map((c) => [c.dbField, c.id]));
  console.log(`Loaded ${fieldMap.size} field configs.`);

  const divisions = Object.keys(gridData); // ['MENS', 'LADIES', 'KIDS']

  // Clear existing division-scoped values
  const deleted = await prisma.sapAttributeValue.deleteMany({
    where: { majorCategory: { in: divisions } },
  });
  console.log(`Cleared ${deleted.count} existing division-scoped values.`);

  let totalInserted = 0;

  for (const division of divisions) {
    const fieldValues = gridData[division];
    const rows: Array<{ fieldConfigId: number; value: string; majorCategory: string; displayOrder: number }> = [];
    const seen = new Set<string>();

    for (const [dbField, values] of Object.entries(fieldValues)) {
      const fieldConfigId = fieldMap.get(dbField);
      if (!fieldConfigId) {
        console.warn(`  ⚠ No fieldConfig for dbField: ${dbField}`);
        continue;
      }
      for (let i = 0; i < values.length; i++) {
        const value = values[i].trim();
        if (!value) continue;
        const key = `${fieldConfigId}|${value}|${division}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({ fieldConfigId, value, majorCategory: division, displayOrder: i });
      }
    }

    // Batch insert
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await prisma.sapAttributeValue.createMany({
        data: rows.slice(i, i + BATCH_SIZE),
        skipDuplicates: true,
      });
    }
    console.log(`  ✓ ${division}: ${rows.length} values inserted`);
    totalInserted += rows.length;
  }

  console.log(`\nDone. Total: ${totalInserted} values inserted.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
