export const parseNumericValue = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;

    const cleaned = String(value)
        .replace(/[₹$€£¥,]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\/-$/, '')
        .replace(/\/$/, '')
        .replace(/-$/, '')
        .trim();

    const match = cleaned.match(/-?\d+(\.\d+)?/);
    if (!match) return null;

    const parsed = parseFloat(match[0]);
    return Number.isNaN(parsed) ? null : parsed;
};

// MRP is now manually entered — no auto-derivation formula.
// Returns 1 as the default placeholder value when no explicit MRP is provided.
export const calculateMrpFromRate = (_rateOrCost: unknown): number => {
    return 1;
};
