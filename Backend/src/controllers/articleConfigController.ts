import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

/** GET /api/article-config/fields — all active field configs */
export async function getFieldConfigs(req: Request, res: Response) {
  try {
    const fields = await prisma.sapFieldConfig.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        section: true,
        uiLabel: true,
        dbField: true,
        sapField: true,
        displayOrder: true,
      },
    });
    res.json({ success: true, data: fields });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch field configs' });
  }
}

/**
 * GET /api/article-config/values?majorCategory=X
 * Returns allowed values for every active field, scoped to the given major category.
 * Response shape: { dbField: string[] }
 */
export async function getAttributeValues(req: Request, res: Response) {
  const majorCategory = (req.query.majorCategory as string | undefined)?.trim();

  try {
    const where = majorCategory
      ? { isActive: true, majorCategory }
      : { isActive: true, majorCategory: null };

    const rows = await prisma.sapAttributeValue.findMany({
      where,
      orderBy: [{ fieldConfigId: 'asc' }, { displayOrder: 'asc' }],
      select: {
        value: true,
        displayOrder: true,
        fieldConfig: { select: { dbField: true } },
      },
    });

    const grouped: Record<string, string[]> = {};
    for (const row of rows) {
      const key = row.fieldConfig.dbField;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row.value);
    }

    res.json({ success: true, majorCategory: majorCategory ?? null, data: grouped });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch attribute values' });
  }
}
