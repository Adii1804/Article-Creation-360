import { prismaClient as prisma } from './prisma';

/** Maps camelCase approver/extraction fields to 360article.article_360_flat columns */
export const FIELD_TO_360_COL: Record<string, string> = {
    articleNumber:               'article_number',
    sapArticleId:                'sap_article_id',
    division:                    'division',
    subDivision:                 'sub_division',
    majorCategory:               'major_category',
    designNumber:                'design_number',
    vendorName:                  'vendor_name',
    vendorCode:                  'vendor_code',
    referenceArticleNumber:      'reference_article_number',
    referenceArticleDescription: 'reference_article_description',
    mcCode:                      'mc_code',
    rate:                        'rate',
    mrp:                         'mrp',
    impAtrbt2:                   'imp_atrbt_2',
    macroMvgr:                   'macro_mvgr',
    yarn1:                       'yarn_1',
    mainMvgr:                    'main_mvgr',
    fabricMainMvgr:              'fabric_main_mvgr',
    weave:                       'weave',
    mFab2:                       'm_fab2',
    composition:                 'composition',
    fCount:                      'f_count',
    fConstruction:               'f_construction',
    lycra:                       'lycra',
    finish:                      'finish',
    gsm:                         'gsm',
    fOunce:                      'f_ounce',
    fWidth:                      'f_width',
    collar:                      'collar',
    collarStyle:                 'collar_style',
    neck:                        'neck',
    neckDetails:                 'neck_details',
    placket:                     'placket',
    fatherBelt:                  'father_belt',
    sleeve:                      'sleeve',
    sleeveFold:                  'sleeve_fold',
    bottomFold:                  'bottom_fold',
    noOfPocket:                  'no_of_pocket',
    pocketType:                  'pocket_type',
    extraPocket:                 'extra_pocket',
    fit:                         'fit',
    pattern:                     'body_style',
    length:                      'length',
    drawcord:                    'drawcord',
    dcShape:                     'dc_shape',
    button:                      'button',
    btnColour:                   'btn_colour',
    zipper:                      'zipper',
    zipColour:                   'zip_colour',
    patches:                     'patches',
    patchesType:                 'patches_type',
    printType:                   'print_type',
    printStyle:                  'print_style',
    printPlacement:              'print_placement',
    embroidery:                  'embroidery',
    embroideryType:              'embroidery_type',
    wash:                        'wash',
    approvalStatus:              'approval_status',
    sapSyncStatus:               'sap_sync_status',
    sapSyncMessage:              'sap_sync_message',
    imageUrl:                    'image_url',
};

/** Extra camelCase fields not in FIELD_TO_360_COL that map to 360article columns */
const EXTRA_FIELD_MAP: Record<string, string> = {
    jobId:            'job_id',
    imageName:        'image_name',
    extractionStatus: 'extraction_status',
    userId:           'user_id',
    userName:         'user_name',
    userEmail:        'user_email',
};

const FULL_FIELD_MAP: Record<string, string> = { ...EXTRA_FIELD_MAP, ...FIELD_TO_360_COL };

/**
 * Upsert a full row into "360article"."article_360_flat" from an extractionResultFlat-shaped object.
 * Uses ON CONFLICT (job_id) DO UPDATE. Never throws.
 */
export async function upsert360ArticleFlatRow(
    flatId: string,
    row: Record<string, unknown>
): Promise<void> {
    const cols: string[] = ['"flat_id"'];
    const vals: unknown[] = [flatId];

    for (const [camel, col] of Object.entries(FULL_FIELD_MAP)) {
        if (camel in row) {
            cols.push(`"${col}"`);
            vals.push(row[camel] ?? null);
        }
    }

    if (!('jobId' in row)) return; // job_id is required for upsert

    const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
    const updateParts = cols
        .filter(c => c !== '"flat_id"' && c !== '"job_id"')
        .map(c => `${c} = EXCLUDED.${c}`)
        .join(', ');

    const sql = `
        INSERT INTO "360article"."article_360_flat" (
            id, ${cols.join(', ')}, approval_status, sap_sync_status, created_at, updated_at
        ) VALUES (
            gen_random_uuid()::text, ${placeholders}, 'PENDING', 'NOT_SYNCED', now(), now()
        )
        ON CONFLICT (job_id) DO UPDATE SET ${updateParts}, updated_at = now()
    `;

    try {
        await prisma.$executeRawUnsafe(sql, ...vals);
    } catch (err) {
        console.error('⚠️  360article flat row upsert failed:', err);
    }
}

/**
 * Mirror a partial field update to "360article"."article_360_flat" by flat_id.
 * Never throws — errors are logged and swallowed so the main flow is never affected.
 */
export async function mirror360FlatUpdate(
    flatId: string,
    changes: Record<string, unknown>
): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];

    for (const [camel, value] of Object.entries(changes)) {
        const col = FIELD_TO_360_COL[camel];
        if (!col) continue;
        values.push(value ?? null);
        sets.push(`"${col}" = $${values.length}`);
    }

    if (sets.length === 0) return;

    values.push(flatId);
    const sql = `
        UPDATE "360article"."article_360_flat"
        SET ${sets.join(', ')}, updated_at = now()
        WHERE flat_id = $${values.length}
    `;

    try {
        await prisma.$executeRawUnsafe(sql, ...values);
    } catch (err) {
        console.error('⚠️  360article flat mirror update failed:', err);
    }
}
