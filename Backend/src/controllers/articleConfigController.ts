import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

/** GET /api/article-config/fields — all active field configs */
export async function getFieldConfigs(req: Request, res: Response) {
  try {
    const fields = await prisma.sapFieldConfig.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, section: true, uiLabel: true, dbField: true, sapField: true, displayOrder: true },
    });
    res.json({ success: true, data: fields });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch field configs' });
  }
}

/**
 * GET /api/article-config/values?division=MENS
 *    or ?majorCategory=MENS   (alias, same behaviour)
 *
 * Returns: { dbField: string[] } — allowed values scoped to the given division.
 * Divisions: MENS | LADIES | KIDS
 */
export async function getAttributeValues(req: Request, res: Response) {
  // Accept both `division` and `majorCategory` as the scope key
  const scope = (
    (req.query.division as string) ||
    (req.query.majorCategory as string)
  )?.trim().toUpperCase();

  if (!scope) {
    res.status(400).json({ success: false, message: 'division is required (MENS | LADIES | KIDS)' });
    return;
  }

  try {
    const rows = await prisma.sapAttributeValue.findMany({
      where: { majorCategory: scope, isActive: true },
      orderBy: [{ fieldConfigId: 'asc' }, { displayOrder: 'asc' }],
      select: { value: true, fieldConfig: { select: { dbField: true } } },
    });

    const grouped: Record<string, string[]> = {};
    for (const row of rows) {
      const key = row.fieldConfig.dbField;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row.value);
    }

    res.json({ success: true, division: scope, data: grouped });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch attribute values' });
  }
}
