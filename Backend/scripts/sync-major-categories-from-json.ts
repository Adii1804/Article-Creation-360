import { PrismaClient } from '../src/generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

type RawMajorCategoryRow = {
  SN?: number | string;
  'MC\nCD'?: number | string;
  'SR.NO'?: number | string;
  DIV?: string;
  SUB_DIV?: string;
  MAJ_CAT_NM?: string;
  MAJ_CAT?: string;
  MC_CD?: number | string;
};

type NormalizedMajorCategoryRow = {
  mcCode: string;
  division: string;
  subDivision: string;
  name: string;
};

type McCodeLookupRow = {
  'mc code': string;
  'mc des': string;
  division: string;
  'sub division': string;
};

const prisma = new PrismaClient();

const repoRoot = path.resolve(__dirname, '../..');
const sourceJsonPath = path.join(repoRoot, 'MAJ_CAT_NEW.json');
const backendLookupPath = path.join(repoRoot, 'Backend/src/data/mc-code-list-major-category.json');
const frontendLookupPath = path.join(repoRoot, 'Frontend/src/data/mc-code-list-major-category.json');
const watcherMappingPath = path.join(repoRoot, 'watcher/categoryMapping.json');

const stripBom = (value: string): string => value.replace(/^\uFEFF/, '');

const normalizeText = (value?: string | number | null): string =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');

const normalizeName = (value?: string | null): string =>
  normalizeText(value).toUpperCase().replace(/\s+/g, '_');

const readJsonFile = <T>(filePath: string): T => {
  const raw = stripBom(fs.readFileSync(filePath, 'utf8')).trim();
  try {
    return JSON.parse(raw) as T;
  } catch {
    return JSON.parse(`[${raw.replace(/^\[|\]$/g, '')}]`) as T;
  }
};

const normalizeSourceRows = (rows: RawMajorCategoryRow[]): NormalizedMajorCategoryRow[] => {
  const byName = new Map<string, NormalizedMajorCategoryRow>();

  for (const row of rows) {
    const name = normalizeName(row.MAJ_CAT ?? row.MAJ_CAT_NM);
    const mcCode = normalizeText(row.MC_CD ?? row['MC\nCD']);
    const division = normalizeText(row.DIV).toUpperCase();
    const subDivision = normalizeText(row.SUB_DIV).toUpperCase();

    if (!name || !mcCode) {
      continue;
    }

    if (!byName.has(name)) {
      byName.set(name, {
        name,
        mcCode,
        division,
        subDivision
      });
    }
  }

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const toLookupRows = (rows: NormalizedMajorCategoryRow[]): McCodeLookupRow[] =>
  rows.map((row) => ({
    'mc code': row.mcCode,
    'mc des': row.name,
    division: row.division,
    'sub division': row.subDivision
  }));

const writeLookupFile = (filePath: string, rows: McCodeLookupRow[]) => {
  fs.writeFileSync(filePath, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
};

const writeWatcherMappingFile = (filePath: string, rows: NormalizedMajorCategoryRow[]) => {
  const mapping = rows.reduce<Record<string, { sub_division: string; mc_code: string; division: string }>>((acc, row) => {
    acc[row.name] = {
      sub_division: row.subDivision,
      mc_code: row.mcCode,
      division: row.division
    };
    return acc;
  }, {});

  fs.writeFileSync(filePath, `${JSON.stringify(mapping, null, 2)}\n`, 'utf8');
};

async function syncDatabase(rows: NormalizedMajorCategoryRow[]) {
  const majorCategoryAttr = await prisma.masterAttribute.findUnique({
    where: { key: 'major_category' }
  });

  if (!majorCategoryAttr) {
    throw new Error('MasterAttribute with key "major_category" was not found.');
  }

  const existingValues = await prisma.attributeAllowedValue.findMany({
    where: { attributeId: majorCategoryAttr.id }
  });

  const existingByShortForm = new Map(
    existingValues.map((item) => [item.shortForm.trim().toUpperCase(), item])
  );

  const incomingNames = new Set(rows.map((row) => row.name));

  let inserted = 0;
  let updated = 0;
  let deactivated = 0;

  for (const [index, row] of rows.entries()) {
    const aliases = [row.mcCode, row.division, row.subDivision].filter(Boolean);
    const existing = existingByShortForm.get(row.name);

    if (existing) {
      const shouldUpdate =
        existing.fullForm !== row.name ||
        existing.displayOrder !== index ||
        existing.isActive !== true ||
        JSON.stringify(existing.aliases ?? []) !== JSON.stringify(aliases);

      if (shouldUpdate) {
        await prisma.attributeAllowedValue.update({
          where: { id: existing.id },
          data: {
            fullForm: row.name,
            aliases,
            displayOrder: index,
            isActive: true
          }
        });
        updated += 1;
      }

      continue;
    }

    await prisma.attributeAllowedValue.create({
      data: {
        attributeId: majorCategoryAttr.id,
        shortForm: row.name,
        fullForm: row.name,
        aliases,
        displayOrder: index,
        isActive: true
      }
    });
    inserted += 1;
  }

  for (const existing of existingValues) {
    const key = existing.shortForm.trim().toUpperCase();
    if (incomingNames.has(key) || existing.isActive === false) {
      continue;
    }

    await prisma.attributeAllowedValue.update({
      where: { id: existing.id },
      data: {
        isActive: false
      }
    });
    deactivated += 1;
  }

  return {
    inserted,
    updated,
    deactivated,
    totalIncoming: rows.length
  };
}

async function main() {
  console.log(`Reading major categories from ${sourceJsonPath}`);

  const sourceRows = readJsonFile<RawMajorCategoryRow[]>(sourceJsonPath);
  const normalizedRows = normalizeSourceRows(sourceRows);

  if (normalizedRows.length === 0) {
    throw new Error('No major category rows were found in MajorCategory.json');
  }

  writeLookupFile(backendLookupPath, toLookupRows(normalizedRows));
  writeLookupFile(frontendLookupPath, toLookupRows(normalizedRows));
  writeWatcherMappingFile(watcherMappingPath, normalizedRows);

  const dbSummary = await syncDatabase(normalizedRows);

  console.log(`Synced ${normalizedRows.length} major categories from MAJ_CAT_NEW.json`);
  console.log(`Backend lookup updated: ${backendLookupPath}`);
  console.log(`Frontend lookup updated: ${frontendLookupPath}`);
  console.log(`Watcher mapping updated: ${watcherMappingPath}`);
  console.log(
    `DB summary: inserted ${dbSummary.inserted}, updated ${dbSummary.updated}, deactivated ${dbSummary.deactivated}`
  );
}

main()
  .catch((error) => {
    console.error('Failed to sync major categories:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
