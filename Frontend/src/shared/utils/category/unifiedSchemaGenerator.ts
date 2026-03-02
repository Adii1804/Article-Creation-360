import type { SchemaItem } from '../../types/extraction/ExtractionTypes';
import { logger } from '../common/logger';
import type { CategoryAttribute, MasterAttribute } from '../../../services/hierarchyService';

export class UnifiedSchemaGenerator {
  /**
   * ✅ DATABASE-AWARE: Convert category attributes from database to schema items
   * No need for MASTER_ATTRIBUTES lookup - all data comes from database
   */
  public static deriveSchemaFromDatabaseAttributes(categoryAttributes: CategoryAttribute[]): SchemaItem[] {
    const schema: SchemaItem[] = [];

    for (const catAttr of categoryAttributes) {
      if (!catAttr.isEnabled || !catAttr.attribute) continue;

      const attr: MasterAttribute = catAttr.attribute;

      schema.push({
        key: attr.key,
        label: attr.label,
        fullForm: attr.label, // MasterAttribute doesn't have fullForm, use label
        type: attr.type.toLowerCase() as 'text' | 'select' | 'number',
        allowedValues: attr.allowedValues?.map(v => ({
          shortForm: v.shortForm,
          fullForm: v.fullForm || v.shortForm,
        })) || [],
        required: catAttr.isRequired,
        description: attr.description || UnifiedSchemaGenerator.formatLabel(attr.key),
      });
    }

    logger.info('Generated schema from database attributes', {
      totalAttributes: categoryAttributes.length,
      enabledAttributes: schema.length,
      requiredAttributes: schema.filter(s => s.required).length,
    });

    return schema;
  }

  /**
   * Simple utility: format camelCase or snake_case keys to readable labels
   */
  private static formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }
}
