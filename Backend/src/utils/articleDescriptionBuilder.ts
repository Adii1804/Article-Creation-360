type ArticleDescriptionSource = {
  yarn1?: unknown;
  weave?: unknown;
  mFab2?: unknown;
  fabricMainMvgr?: unknown;
  lycra?: unknown;
  neck?: unknown;
  sleeve?: unknown;
  fatherBelt?: unknown;
  fit?: unknown;
  pattern?: unknown;
  length?: unknown;
  printType?: unknown;
  printPlacement?: unknown;
  printStyle?: unknown;
  embroidery?: unknown;
  pocketType?: unknown;
  vendorCode?: unknown;
  designNumber?: unknown;
  size?: unknown;
};

const ARTICLE_DESCRIPTION_MAX_LENGTH = 40;

// Order as specified: YARN-WEAVE-M_FAB2-FABRIC_MAIN_MVGR-LYCRA-NECK-SLEEVES-
// FATHER BELT-FIT-PATTERN-LENGTH-PRINT_TYPE-PRINT_PLACEMENT-PRINT_STYLE-
// EMBROIDERY-POCKET-VND-DZN NO-SIZE
// Fallback: if an attribute is empty, skip it and use the next available one
const ARTICLE_DESCRIPTION_FIELDS: Array<keyof ArticleDescriptionSource> = [
  'yarn1',
  'weave',
  'mFab2',
  'fabricMainMvgr',
  'lycra',
  'neck',
  'sleeve',
  'fatherBelt',
  'fit',
  'pattern',
  'length',
  'printType',
  'printPlacement',
  'printStyle',
  'embroidery',
  'pocketType',
  'vendorCode',
  'designNumber',
  'size',
];

const toShortToken = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const text = String(value)
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase();

  return text || null;
};

export const buildArticleDescription = (
  source: ArticleDescriptionSource,
  maxLength: number = ARTICLE_DESCRIPTION_MAX_LENGTH
): string | null => {
  let description = '';

  for (const field of ARTICLE_DESCRIPTION_FIELDS) {
    const token = toShortToken(source[field]);
    if (!token) continue; // fallback: skip empty, use next

    if (!description) {
      description = token.length > maxLength ? token.slice(0, maxLength) : token;
      if (description.length >= maxLength) break;
      continue;
    }

    const candidate = `${description}-${token}`;
    if (candidate.length > maxLength) {
      const remaining = maxLength - description.length;
      if (remaining > 0) {
        description = `${description}-${token}`.slice(0, maxLength);
      }
      break;
    }

    description = candidate;
  }

  return description || null;
};

export const ARTICLE_DESCRIPTION_SOURCE_FIELDS = ARTICLE_DESCRIPTION_FIELDS;
