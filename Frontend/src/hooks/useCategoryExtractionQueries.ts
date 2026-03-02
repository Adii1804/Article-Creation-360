/**
 * Category Extraction Hooks
 * 
 * React Query hooks for the new category-based extraction API.
 * These hooks use the Phase 2 endpoints that load schema from database.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import {
  getCategoryHierarchy,
  getCategorySchema,
  searchCategories,
  extractWithCategory,
  categoryExtractionQueryKeys,
  type CategoryHierarchyResponse,
  type CategorySchemaResponse,
  type CategorySearchResult,
  type CategoryExtractionRequest,
  type CategoryExtractionResponse,
} from '../services/categoryExtractionService';

// ===========================
// QUERY OPTIONS
// ===========================

const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const HIERARCHY_STALE_TIME = 10 * 60 * 1000; // 10 minutes (hierarchy changes less frequently)

// ===========================
// QUERY HOOKS
// ===========================

/**
 * Get the complete category hierarchy for dropdowns
 * This is perfect for the 3-level category selector
 */
export const useCategoryHierarchy = (
  options?: Omit<UseQueryOptions<CategoryHierarchyResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: categoryExtractionQueryKeys.hierarchy(),
    queryFn: getCategoryHierarchy,
    staleTime: HIERARCHY_STALE_TIME,
    ...options,
  });
};

/**
 * Get category schema with all attributes
 * Use this to get the schema before extraction
 */
export const useCategorySchema = (
  categoryCode: string,
  options?: Omit<UseQueryOptions<CategorySchemaResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: categoryExtractionQueryKeys.schema(categoryCode),
    queryFn: () => getCategorySchema(categoryCode),
    staleTime: DEFAULT_STALE_TIME,
    enabled: !!categoryCode,
    ...options,
  });
};

/**
 * Search categories by query string
 * Useful for autocomplete/search functionality
 */
export const useSearchCategories = (
  query: string,
  limit = 20,
  options?: Omit<UseQueryOptions<CategorySearchResult[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: categoryExtractionQueryKeys.search(query),
    queryFn: () => searchCategories(query, limit),
    staleTime: DEFAULT_STALE_TIME,
    enabled: query.length >= 2, // Only search if query is at least 2 characters
    ...options,
  });
};

// ===========================
// MUTATION HOOKS
// ===========================

/**
 * Extract attributes using category code
 * This mutation uses the new database-driven extraction endpoint
 */
export const useExtractWithCategory = (
  options?: UseMutationOptions<CategoryExtractionResponse, Error, CategoryExtractionRequest>
) => {
  return useMutation({
    mutationFn: extractWithCategory,
    ...options,
  });
};
