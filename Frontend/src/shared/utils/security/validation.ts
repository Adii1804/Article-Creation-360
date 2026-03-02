/**
 * 🔒 Validation Schemas for Admin Panel
 * Ensures data integrity and prevents invalid inputs
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════
// DEPARTMENT SCHEMAS
// ═══════════════════════════════════════════════════════

export const departmentSchema = z.object({
  code: z.string()
    .min(1, 'Code is required')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Z_]+$/, 'Code must contain only uppercase letters and underscores'),
  name: z.string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less')
    .trim(),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  displayOrder: z.number()
    .int('Display order must be an integer')
    .min(0, 'Display order must be 0 or greater')
    .default(0),
  isActive: z.boolean().default(true),
});

// ═══════════════════════════════════════════════════════
// SUB-DEPARTMENT SCHEMAS
// ═══════════════════════════════════════════════════════

export const subDepartmentSchema = z.object({
  departmentId: z.number()
    .int('Department ID must be an integer')
    .positive('Department ID must be positive'),
  code: z.string()
    .min(1, 'Code is required')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Z0-9_]+$/, 'Code must contain only uppercase letters, numbers, and underscores'),
  name: z.string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less')
    .trim(),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  displayOrder: z.number()
    .int('Display order must be an integer')
    .min(0, 'Display order must be 0 or greater')
    .default(0),
  isActive: z.boolean().default(true),
});

// ═══════════════════════════════════════════════════════
// CATEGORY SCHEMAS
// ═══════════════════════════════════════════════════════

export const categorySchema = z.object({
  subDepartmentId: z.number()
    .int('Sub-department ID must be an integer')
    .positive('Sub-department ID must be positive'),
  code: z.string()
    .min(1, 'Code is required')
    .max(100, 'Code must be 100 characters or less')
    .regex(/^[A-Z0-9_]+$/, 'Code must contain only uppercase letters, numbers, and underscores'),
  name: z.string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less')
    .trim(),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  displayOrder: z.number()
    .int('Display order must be an integer')
    .min(0, 'Display order must be 0 or greater')
    .default(0),
  isActive: z.boolean().default(true),
});

// ═══════════════════════════════════════════════════════
// MASTER ATTRIBUTE SCHEMAS
// ═══════════════════════════════════════════════════════

export const attributeTypeEnum = z.enum(['TEXT', 'SELECT', 'NUMBER'], {
  message: 'Type must be TEXT, SELECT, or NUMBER'
});

export const masterAttributeSchema = z.object({
  key: z.string()
    .min(1, 'Key is required')
    .max(100, 'Key must be 100 characters or less')
    .regex(/^[A-Z0-9_]+$/, 'Key must contain only uppercase letters, numbers, and underscores'),
  label: z.string()
    .min(1, 'Label is required')
    .max(200, 'Label must be 200 characters or less')
    .trim(),
  type: attributeTypeEnum,
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  displayOrder: z.number()
    .int('Display order must be an integer')
    .min(0, 'Display order must be 0 or greater')
    .default(0),
  isActive: z.boolean().default(true),
});

// ═══════════════════════════════════════════════════════
// ALLOWED VALUE SCHEMAS
// ═══════════════════════════════════════════════════════

export const allowedValueSchema = z.object({
  attributeId: z.number()
    .int('Attribute ID must be an integer')
    .positive('Attribute ID must be positive'),
  value: z.string()
    .min(1, 'Value is required')
    .max(200, 'Value must be 200 characters or less')
    .trim(),
  label: z.string()
    .min(1, 'Label is required')
    .max(200, 'Label must be 200 characters or less')
    .trim(),
  displayOrder: z.number()
    .int('Display order must be an integer')
    .min(0, 'Display order must be 0 or greater')
    .default(0),
  isActive: z.boolean().default(true),
});

// ═══════════════════════════════════════════════════════
// CATEGORY-ATTRIBUTE MAPPING SCHEMAS
// ═══════════════════════════════════════════════════════

export const categoryAttributeMappingSchema = z.object({
  categoryId: z.number()
    .int('Category ID must be an integer')
    .positive('Category ID must be positive'),
  attributeId: z.number()
    .int('Attribute ID must be an integer')
    .positive('Attribute ID must be positive'),
  isEnabled: z.boolean().default(false),
  isRequired: z.boolean().default(false),
  displayOrder: z.number()
    .int('Display order must be an integer')
    .min(0, 'Display order must be 0 or greater')
    .default(0),
  defaultValue: z.string()
    .max(500, 'Default value must be 500 characters or less')
    .nullable()
    .optional(),
});

// ═══════════════════════════════════════════════════════
// EXTRACTION SCHEMAS
// ═══════════════════════════════════════════════════════

export const imageFileSchema = z.object({
  name: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name must be 255 characters or less')
    .regex(/\.(jpg|jpeg|png|gif|webp)$/i, 'File must be an image (jpg, jpeg, png, gif, webp)'),
  size: z.number()
    .positive('File size must be positive')
    .max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  type: z.string()
    .regex(/^image\/(jpeg|png|gif|webp)$/, 'File type must be a valid image MIME type'),
});

export const extractionRequestSchema = z.object({
  categoryCode: z.string()
    .min(1, 'Category code is required')
    .max(100, 'Category code must be 100 characters or less')
    .regex(/^[A-Z0-9_]+$/, 'Invalid category code format'),
  discoveryMode: z.boolean().default(false),
  minConfidence: z.number()
    .min(0, 'Confidence must be between 0 and 100')
    .max(100, 'Confidence must be between 0 and 100')
    .default(70),
});

// ═══════════════════════════════════════════════════════
// SEARCH/FILTER SCHEMAS
// ═══════════════════════════════════════════════════════

export const searchQuerySchema = z.object({
  query: z.string()
    .max(200, 'Search query must be 200 characters or less')
    .trim(),
  department: z.string()
    .max(50, 'Department filter must be 50 characters or less')
    .optional(),
  limit: z.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be 100 or less')
    .default(20),
  offset: z.number()
    .int('Offset must be an integer')
    .min(0, 'Offset must be 0 or greater')
    .default(0),
});

// ═══════════════════════════════════════════════════════
// EXPORT SCHEMAS
// ═══════════════════════════════════════════════════════

export const exportFormatEnum = z.enum(['json', 'csv', 'excel'], {
  message: 'Format must be json, csv, or excel'
});

export const exportRequestSchema = z.object({
  format: exportFormatEnum.default('json'),
  includeInactive: z.boolean().default(false),
  department: z.string()
    .max(50, 'Department filter must be 50 characters or less')
    .optional(),
});

// ═══════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════

export type DepartmentInput = z.infer<typeof departmentSchema>;
export type SubDepartmentInput = z.infer<typeof subDepartmentSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type MasterAttributeInput = z.infer<typeof masterAttributeSchema>;
export type AllowedValueInput = z.infer<typeof allowedValueSchema>;
export type CategoryAttributeMappingInput = z.infer<typeof categoryAttributeMappingSchema>;
export type ImageFileInput = z.infer<typeof imageFileSchema>;
export type ExtractionRequestInput = z.infer<typeof extractionRequestSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type ExportRequestInput = z.infer<typeof exportRequestSchema>;

// ═══════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════

/**
 * Validate data against a schema and return formatted errors
 */
export const validateData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.issues.map((err: z.ZodIssue) => 
    `${err.path.join('.')}: ${err.message}`
  );
  
  return { success: false, errors };
};

/**
 * Validate and sanitize form data
 */
export const validateFormData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { valid: boolean; data?: T; error?: string } => {
  try {
    const validated = schema.parse(data);
    return { valid: true, data: validated };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const firstError = err.issues[0];
      return {
        valid: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }
    return { valid: false, error: 'Validation failed' };
  }
};
