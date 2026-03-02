import type { Department, AttributeType, BaseEntity } from '../core/CommonTypes';

export interface AttributeDefinition {
  key: string;
  label: string;
  fullForm?: string;         // Added fullForm for AI context clarity
  type: AttributeType;
  allowedValues?: AllowedValue[];
  required?: boolean;
  description?: string;
  // SMART RANGE DETECTION
  rangeConfig?: RangeConfiguration;
}

export interface RangeConfiguration {
  enableRangeDetection: boolean;
  rangeType: 'size' | 'gsm' | 'numeric' | 'custom';
  sizeHierarchy?: string[];  // For size: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
  numericRanges?: NumericRange[];  // For GSM: [{min: 100, max: 150, label: '100-150G'}]
  customRanges?: string[];   // For custom patterns
  fallbackToRaw?: boolean;   // If no range found, return raw value
}

export interface NumericRange {
  min: number;
  max: number;
  label: string;
  unit?: string;
}

export interface AllowedValue {
  shortForm: string;
  fullForm?: string;
}

export interface AttributeFlags {
  [key: string]: boolean;
}

export interface CategoryConfig extends BaseEntity {
  department: Department;
  subDepartment: string;
  category: string;
  displayName: string;
  description?: string;
  attributes: AttributeFlags;
  isActive: boolean;
}

export interface CategoryHierarchy {
  [department: string]: {
    [subDepartment: string]: string[];
  };
}

export interface CategoryStats {
  total: number;
  departments: number;
  kids: number;
  mens: number;
  ladies: number;
  activeCategories: number;
}
