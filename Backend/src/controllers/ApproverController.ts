import { Request, Response } from 'express';
import { PrismaClient, ApprovalStatus, SapSyncStatus } from '../generated/prisma';

const prisma = new PrismaClient();

export class ApproverController {
    // Get items for approver dashboard
    // Filters: approvalStatus (default: PENDING), division, date range, search
    static async getItems(req: Request, res: Response) {
        try {
            const { status, division, subDivision, startDate, endDate, search, page = 1, limit = 50 } = req.query;

            const where: any = {};

            // RBAC: Enforce Division/SubDivision for Approvers
            if (req.user?.role === 'APPROVER') {
                if (req.user.division) {
                    where.division = req.user.division;
                }
                if (req.user.subDivision) {
                    where.subDivision = req.user.subDivision;
                }
            } else if (req.user?.role === 'ADMIN') {
                // Admins can filter freely
                if (division && division !== 'ALL') where.division = division as string;
                if (subDivision && subDivision !== 'ALL') where.subDivision = subDivision as string;
            }

            // Status Filtering (Multi-select support)
            if (status && status !== 'ALL') {
                const statuses = (status as string).split(',').map(s => s.trim()) as ApprovalStatus[];
                if (statuses.length > 0) {
                    where.approvalStatus = { in: statuses };
                }
            }

            // Date Range Filtering
            if (startDate && endDate) {
                where.createdAt = {
                    gte: new Date(startDate as string),
                    lte: new Date(endDate as string)
                };
            }

            // Text Search
            if (search) {
                const searchTerm = search as string;
                where.OR = [
                    { articleNumber: { contains: searchTerm, mode: 'insensitive' } },
                    { designNumber: { contains: searchTerm, mode: 'insensitive' } },
                    { vendorName: { contains: searchTerm, mode: 'insensitive' } },
                    { pptNumber: { contains: searchTerm, mode: 'insensitive' } },
                    { referenceArticleNumber: { contains: searchTerm, mode: 'insensitive' } }
                ];
            }

            const skip = (Number(page) - 1) * Number(limit);

            const items = await prisma.extractionResultFlat.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    job: {
                        select: {
                            status: true
                        }
                    }
                }
            });

            const total = await prisma.extractionResultFlat.count({ where });

            return res.json({
                data: items,
                meta: {
                    total,
                    page: Number(page),
                    div: Number(limit), // limit
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error) {
            console.error('Error fetching approver items:', error);
            return res.status(500).json({ error: 'Failed to fetch items' });
        }
    }

    // Get master attributes for dropdowns
    static async getAttributes(req: Request, res: Response) {
        try {
            const attributes = await prisma.masterAttribute.findMany({
                where: { isActive: true },
                include: {
                    allowedValues: {
                        where: { isActive: true },
                        orderBy: { displayOrder: 'asc' }
                    }
                },
                orderBy: { displayOrder: 'asc' }
            });
            return res.json(attributes);
        } catch (error) {
            console.error('Error fetching attributes:', error);
            return res.status(500).json({ error: 'Failed to fetch attributes' });
        }
    }

    // Update item details (Edit)
    static async updateItem(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const rawData = req.body;

            // Whitelist allowed fields to prevent overwriting metadata
            // and sanitize types
            const allowedFields = [
                'articleNumber', 'division', 'subDivision', 'majorCategory', 'vendorName', 'designNumber',
                'pptNumber', 'rate', 'size', 'yarn1', 'yarn2', 'fabricMainMvgr', 'weave',
                'composition', 'finish', 'gsm', 'shade', 'lycra', 'neck', 'neckDetails',
                'collar', 'placket', 'sleeve', 'bottomFold', 'frontOpenStyle', 'pocketType',
                'fit', 'pattern', 'length', 'colour', 'drawcord', 'button', 'zipper',
                'zipColour', 'printType', 'printStyle', 'printPlacement', 'patches',
                'patchesType', 'embroidery', 'embroideryType', 'wash', 'fatherBelt', 'childBelt',
                'referenceArticleNumber', 'referenceArticleDescription',
                // New business fields
                'vendorCode', 'mrp', 'mcCode', 'segment', 'season',
                'hsnTaxCode', 'articleDescription', 'fashionGrid', 'year', 'articleType'
            ];

            const data: any = {};

            for (const field of allowedFields) {
                if (rawData[field] !== undefined) {
                    let value = rawData[field];

                    // Handle numeric/decimal fields (rate, mrp)
                    if (field === 'rate' || field === 'mrp') {
                        if (value === '' || value === null || value === undefined) {
                            value = null;
                        } else {
                            // Strip suffixes like "/-", "/", "-", currency symbols
                            const cleaned = String(value)
                                .replace(/[₹$€£¥]/g, '')
                                .replace(/\s+/g, '')
                                .replace(/\/-$/, '')
                                .replace(/\/$/, '')
                                .replace(/-$/, '')
                                .trim();
                            const match = cleaned.match(/^-?\d+(\.\d+)?/);
                            const num = match ? parseFloat(match[0]) : NaN;
                            value = isNaN(num) ? null : num;
                        }
                    } else if (value === '') {
                        // Convert empty strings to null for optional text fields
                        // Actually extractionResultFlat fields are mostly nullable strings, so '' might be okay or null preference.
                        // Let's stick to null for empty strings to be cleaner
                        value = null;
                    }

                    data[field] = value;
                }
            }

            // RBAC: Check access for Approvers & Validate Status
            const existingItem = await prisma.extractionResultFlat.findUnique({
                where: { id },
                select: {
                    id: true,
                    approvalStatus: true,
                    division: true,
                    subDivision: true
                }
            });

            if (!existingItem) {
                return res.status(404).json({ error: 'Item not found' });
            }

            // Prevent updating approved items
            if (existingItem.approvalStatus === 'APPROVED') {
                return res.status(403).json({ error: 'Cannot update an approved item. It is locked for SAP sync.' });
            }

            if (req.user?.role === 'APPROVER') {
                if (req.user.division && existingItem.division !== req.user.division) {
                    return res.status(403).json({ error: 'Access denied: Division mismatch' });
                }
                if (req.user.subDivision && existingItem.subDivision !== req.user.subDivision) {
                    return res.status(403).json({ error: 'Access denied: Sub-Division mismatch' });
                }
            }

            const updated = await prisma.extractionResultFlat.update({
                where: { id },
                data
            });

            return res.json(updated);
        } catch (error) {
            console.error('Error updating item:', error);
            return res.status(500).json({ error: 'Failed to update item' });
        }
    }

    // Approve items
    static async approveItems(req: Request, res: Response) {
        try {
            const { ids } = req.body; // Array of UUIDs
            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ error: 'No items selected' });
            }

            // @ts-ignore - Assuming userId is added to req by auth middleware
            const userId = req.user?.id;

            const whereClause: any = {
                id: { in: ids },
                approvalStatus: 'PENDING'
            };

            // RBAC: Enforce Division/SubDivision for Approvers
            if (req.user?.role === 'APPROVER') {
                if (req.user.division) whereClause.division = req.user.division;
                if (req.user.subDivision) whereClause.subDivision = req.user.subDivision;
            }

            const result = await prisma.extractionResultFlat.updateMany({
                where: whereClause,
                data: {
                    approvalStatus: 'APPROVED',
                    approvedBy: userId ? Number(userId) : null,
                    approvedAt: new Date(),
                    sapSyncStatus: 'NOT_SYNCED' // Ready for sync
                }
            });

            return res.json({
                message: 'Items approved successfully',
                count: result.count
            });
        } catch (error) {
            console.error('Error approving items:', error);
            return res.status(500).json({ error: 'Failed to approve items' });
        }
    }

    // Reject items
    static async rejectItems(req: Request, res: Response) {
        try {
            const { ids } = req.body;
            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ error: 'No items selected' });
            }

            // @ts-ignore
            const userId = req.user?.id;

            const whereClause: any = {
                id: { in: ids }
            };

            // RBAC: Enforce Division/SubDivision for Approvers
            if (req.user?.role === 'APPROVER') {
                if (req.user.division) whereClause.division = req.user.division;
                if (req.user.subDivision) whereClause.subDivision = req.user.subDivision;
            }

            const result = await prisma.extractionResultFlat.updateMany({
                where: whereClause,
                data: {
                    approvalStatus: 'REJECTED',
                    approvedBy: userId ? Number(userId) : null,
                    approvedAt: new Date()
                }
            });

            return res.json({
                message: 'Items rejected',
                count: result.count
            });
        } catch (error) {
            console.error('Error rejecting items:', error);
            return res.status(500).json({ error: 'Failed to reject items' });
        }
    }
}
