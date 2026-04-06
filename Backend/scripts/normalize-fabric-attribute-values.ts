import { PrismaClient } from '../src/generated/prisma';
import { mvgrMappingService } from '../src/services/mvgrMappingService';

const prisma = new PrismaClient();

const WEAVE_CORRECTIONS = [
  { invalidShortForm: 'CH_TWL', canonicalShortForm: 'CHN_TWL', canonicalFullForm: 'CHINA TWILL' },
  { invalidShortForm: 'CHINA_TWL', canonicalShortForm: 'CHN_TWL', canonicalFullForm: 'CHINA TWILL' }
];

async function normalizeMfab2() {
  await mvgrMappingService.initialize();

  const canonicalRows = mvgrMappingService.getAllWeave2();
  const canonicalByCode = new Map(
    canonicalRows.map((row, index) => [
      row.code.trim().toUpperCase(),
      {
        shortForm: row.code.trim(),
        fullForm: row.fullForm.trim(),
        displayOrder: index
      }
    ])
  );

  const attribute = await prisma.masterAttribute.findFirst({
    where: {
      key: {
        in: ['M_FAB2', 'WEAVE_2']
      }
    }
  });

  if (!attribute) {
    throw new Error('M_FAB2 master attribute was not found.');
  }

  if (attribute.key === 'WEAVE_2') {
    await prisma.masterAttribute.update({
      where: { id: attribute.id },
      data: {
        key: 'M_FAB2',
        label: 'M FAB 2',
        type: 'SELECT',
        category: 'FABRIC',
        aiExtractable: true
      }
    });
  }

  const activeValues = await prisma.attributeAllowedValue.findMany({
    where: {
      attributeId: attribute.id,
      isActive: true
    }
  });

  const activeByShortForm = new Map(
    activeValues.map((value) => [value.shortForm.trim().toUpperCase(), value])
  );

  let inserted = 0;
  let updated = 0;
  let deactivated = 0;

  for (const [key, canonical] of canonicalByCode.entries()) {
    const existing = activeByShortForm.get(key);
    if (!existing) {
      await prisma.attributeAllowedValue.create({
        data: {
          attributeId: attribute.id,
          shortForm: canonical.shortForm,
          fullForm: canonical.fullForm,
          displayOrder: canonical.displayOrder,
          isActive: true
        }
      });
      inserted += 1;
      continue;
    }

    if (
      existing.fullForm !== canonical.fullForm ||
      existing.displayOrder !== canonical.displayOrder ||
      existing.isActive !== true
    ) {
      await prisma.attributeAllowedValue.update({
        where: { id: existing.id },
        data: {
          fullForm: canonical.fullForm,
          displayOrder: canonical.displayOrder,
          isActive: true
        }
      });
      updated += 1;
    }
  }

  for (const value of activeValues) {
    const key = value.shortForm.trim().toUpperCase();
    if (canonicalByCode.has(key)) {
      continue;
    }

    await prisma.attributeAllowedValue.update({
      where: { id: value.id },
      data: {
        isActive: false
      }
    });
    deactivated += 1;
  }

  return { inserted, updated, deactivated, total: canonicalByCode.size };
}

async function normalizeWeave() {
  const attribute = await prisma.masterAttribute.findFirst({
    where: {
      key: {
        equals: 'WEAVE',
        mode: 'insensitive'
      }
    }
  });

  if (!attribute) {
    throw new Error('WEAVE master attribute was not found.');
  }

  const activeValues = await prisma.attributeAllowedValue.findMany({
    where: {
      attributeId: attribute.id,
      isActive: true
    }
  });

  const activeByShortForm = new Map(
    activeValues.map((value) => [value.shortForm.trim().toUpperCase(), value])
  );

  let ensuredCanonical = 0;
  let deactivated = 0;

  for (const correction of WEAVE_CORRECTIONS) {
    const canonicalKey = correction.canonicalShortForm.toUpperCase();
    const invalidKey = correction.invalidShortForm.toUpperCase();
    const canonical = activeByShortForm.get(canonicalKey);

    if (!canonical) {
      await prisma.attributeAllowedValue.create({
        data: {
          attributeId: attribute.id,
          shortForm: correction.canonicalShortForm,
          fullForm: correction.canonicalFullForm,
          isActive: true
        }
      });
      ensuredCanonical += 1;
    } else if (canonical.fullForm !== correction.canonicalFullForm || canonical.isActive !== true) {
      await prisma.attributeAllowedValue.update({
        where: { id: canonical.id },
        data: {
          fullForm: correction.canonicalFullForm,
          isActive: true
        }
      });
      ensuredCanonical += 1;
    }

    const invalid = activeByShortForm.get(invalidKey);
    if (invalid) {
      await prisma.attributeAllowedValue.update({
        where: { id: invalid.id },
        data: {
          isActive: false
        }
      });
      deactivated += 1;
    }
  }

  return { ensuredCanonical, deactivated };
}

async function main() {
  const mfab2Summary = await normalizeMfab2();
  const weaveSummary = await normalizeWeave();

  console.log('Normalized fabric attribute values successfully.');
  console.log(
    `M_FAB2 summary: inserted ${mfab2Summary.inserted}, updated ${mfab2Summary.updated}, deactivated ${mfab2Summary.deactivated}, canonical total ${mfab2Summary.total}`
  );
  console.log(
    `WEAVE summary: canonical ensured ${weaveSummary.ensuredCanonical}, deactivated ${weaveSummary.deactivated}`
  );
}

main()
  .catch((error) => {
    console.error('Failed to normalize fabric attribute values:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
