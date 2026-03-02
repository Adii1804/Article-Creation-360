/**
 * CategoryHelper - Database-Backed Version
 * 
 * ⚠️ MIGRATION NOTE:
 * This class now uses database queries instead of hardcoded CATEGORY_DEFINITIONS.
 * All methods are now async. For React components, use the hooks in useHierarchyQueries.ts instead.
 * 
 * This class is maintained for backward compatibility with non-React code.
 */

import type { CategoryConfig, CategoryStats } from '../../types/category/CategoryTypes';
import {
  getAllCategoriesAsConfigs,
  getCategoryConfigByCode,
  searchCategoriesInTree,
  getDepartmentCodes,
  getSubDepartmentCodes,
  getCategoriesByDeptAndSubDept,
  getHierarchyTree,
} from '../../../services/hierarchyService';

// Cache for synchronous fallback (populated on first async call)
let cachedConfigs: CategoryConfig[] | null = null;

export class CategoryHelper {
  /**
   * Get all department codes
   * @async Use useDepartmentCodes() hook in React components
   */
  static async getDepartments(): Promise<string[]> {
    return await getDepartmentCodes();
  }

  /**
   * Get sub-departments for a department
   * @async Use useSubDepartmentCodes() hook in React components
   */
  static async getSubDepartments(department: string): Promise<string[]> {
    return await getSubDepartmentCodes(department);
  }

  /**
   * Get categories for department and sub-department
   * @async Use useCategoriesByDeptAndSubDept() hook in React components
   */
  static async getCategories(department: string, subDepartment: string): Promise<CategoryConfig[]> {
    return await getCategoriesByDeptAndSubDept(department, subDepartment);
  }

  /**
   * Get all active categories
   * @async Use useAllCategoriesAsConfigs() hook in React components
   */
  static async getAllCategories(): Promise<CategoryConfig[]> {
    const configs = await getAllCategoriesAsConfigs();
    // Update cache for synchronous fallback
    cachedConfigs = configs;
    return configs;
  }

  /**
   * Get category configuration by code
   * @async Use useCategoryConfig() hook in React components
   */
  static async getCategoryConfig(categoryCode: string): Promise<CategoryConfig | null> {
    return await getCategoryConfigByCode(categoryCode);
  }

  /**
   * Search categories by query string
   * @async Use useSearchCategories() hook in React components
   */
  static async searchCategories(query: string): Promise<CategoryConfig[]> {
    return await searchCategoriesInTree(query);
  }

  /**
   * Get category statistics
   * @async Use custom hook or query hierarchy stats
   */
  static async getCategoryStats(): Promise<CategoryStats> {
    const tree = await getHierarchyTree();
    const allConfigs = await getAllCategoriesAsConfigs();
    
    return {
      total: tree.totalCategories,
      departments: tree.departments.filter(d => d.isActive).length,
      kids: allConfigs.filter(c => c.department === 'KIDS').length,
      mens: allConfigs.filter(c => c.department === 'MENS').length,
      ladies: allConfigs.filter(c => c.department === 'LADIES').length,
      activeCategories: tree.totalCategories,
    };
  }

  /**
   * Validate category configuration
   * This is synchronous and doesn't need database access
   */
  static validateCategory(categoryConfig: CategoryConfig): string[] {
    const errors: string[] = [];
    if (!categoryConfig.department) errors.push('Department is required');
    if (!categoryConfig.subDepartment) errors.push('Sub-department is required');
    if (!categoryConfig.category) errors.push('Category code is required');
    if (!categoryConfig.displayName) errors.push('Display name is required');
    return errors;
  }

  /**
   * Synchronous fallback methods (uses cached data)
   * ⚠️ These should only be used in non-React code where hooks aren't available
   * ⚠️ Call getAllCategories() first to populate cache
   */
  static getDepartmentsSync(): string[] {
    if (!cachedConfigs) {
      console.warn('CategoryHelper cache not initialized. Call getAllCategories() first.');
      return [];
    }
    return [...new Set(cachedConfigs.map(c => c.department))];
  }

  static getSubDepartmentsSync(department: string): string[] {
    if (!cachedConfigs) {
      console.warn('CategoryHelper cache not initialized. Call getAllCategories() first.');
      return [];
    }
    return [...new Set(
      cachedConfigs
        .filter(c => c.department === department && c.isActive)
        .map(c => c.subDepartment)
    )];
  }

  static getCategoriesSync(department: string, subDepartment: string): CategoryConfig[] {
    if (!cachedConfigs) {
      console.warn('CategoryHelper cache not initialized. Call getAllCategories() first.');
      return [];
    }
    return cachedConfigs.filter(c =>
      c.department === department &&
      c.subDepartment === subDepartment &&
      c.isActive
    );
  }

  static getAllCategoriesSync(): CategoryConfig[] {
    if (!cachedConfigs) {
      console.warn('CategoryHelper cache not initialized. Call getAllCategories() first.');
      return [];
    }
    return cachedConfigs.filter(c => c.isActive);
  }

  static getCategoryConfigSync(categoryCode: string): CategoryConfig | undefined {
    if (!cachedConfigs) {
      console.warn('CategoryHelper cache not initialized. Call getAllCategories() first.');
      return undefined;
    }
    return cachedConfigs.find(c => c.category === categoryCode && c.isActive);
  }
}
