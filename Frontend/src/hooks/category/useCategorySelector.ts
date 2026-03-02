import { useState, useCallback, useEffect, useMemo } from "react";
import type { CategoryConfig } from "../../types/category/CategoryTypes";
import { logger } from "../../utils/common/logger";
import type { SchemaItem } from "../../types/extraction/ExtractionTypes";
import { UnifiedSchemaGenerator } from "../../utils/category/unifiedSchemaGenerator";
import {
  useDepartmentCodes,
  useSubDepartmentCodes,
  useCategoriesByDeptAndSubDept,
  useCategoryConfig,
} from "../useHierarchyQueries";
import { useCategoryWithAttributes } from "../useHierarchyQueries";


// Hook state interface
interface CategorySelectorState {
  selectedCategory: CategoryConfig | null;
  selectedDepartment: string | null;
  selectedSubDepartment: string | null;
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
  selectionHistory: CategoryConfig[];
}

// Hook return interface
interface UseCategorySelectorReturn {
  // State
  selectedCategory: CategoryConfig | null;
  selectedDepartment: string | null;
  selectedSubDepartment: string | null;
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
  selectionHistory: CategoryConfig[];
  schema: SchemaItem[];

  // Derived data
  departments: string[];
  subDepartments: string[];
  availableCategories: CategoryConfig[];

  // Loading states for each level
  isDepartmentsLoading: boolean;
  isSubDepartmentsLoading: boolean;
  isCategoriesLoading: boolean;

  // Actions
  handleCategorySelect: (category: CategoryConfig | null) => void;
  handleDepartmentChange: (department: string) => void;
  handleSubDepartmentChange: (subDept: string) => void;
  resetSelection: () => void;
  goToPreviousCategory: () => void;
  validateCategory: (categoryCode: string) => boolean;

  // Utilities
  getCategoryPath: () => string[];
  isValidSelection: () => boolean;
}

export const useCategorySelector = (): UseCategorySelectorReturn => {
  // Initialize state
  const [state, setState] = useState<CategorySelectorState>({
    selectedCategory: null,
    selectedDepartment: null,
    selectedSubDepartment: null,
    isComplete: false,
    isLoading: false,
    error: null,
    selectionHistory: [],
  });

  // Fetch departments from database
  const { data: departmentsData = [], isLoading: isDepartmentsLoading } = useDepartmentCodes();

  // Fetch sub-departments for selected department
  const { data: subDepartmentsData = [], isLoading: isSubDepartmentsLoading } = useSubDepartmentCodes(
    state.selectedDepartment || '',
    { enabled: !!state.selectedDepartment }
  );

  // Fetch categories for selected department and sub-department
  const { data: categoriesData = [], isLoading: isCategoriesLoading } = useCategoriesByDeptAndSubDept(
    state.selectedDepartment || '',
    state.selectedSubDepartment || '',
    { enabled: !!state.selectedDepartment && !!state.selectedSubDepartment }
  );

  // Fetch selected category config (used for validation)
  const { data: validationCategory } = useCategoryConfig(
    state.selectedCategory?.category || '',
    { enabled: !!state.selectedCategory?.category }
  );

  // Sync loading states
  useEffect(() => {
    const isLoading = isDepartmentsLoading || isSubDepartmentsLoading || isCategoriesLoading;
    setState(prev => ({ ...prev, isLoading }));
  }, [isDepartmentsLoading, isSubDepartmentsLoading, isCategoriesLoading]);

  const departments = departmentsData;
  const subDepartments = subDepartmentsData;
  const availableCategories = categoriesData;

  // Handle department change
  const handleDepartmentChange = useCallback((department: string): void => {
    logger.debug("Department changed", { department });
    setState((prevState) => ({
      ...prevState,
      selectedDepartment: department,
      selectedSubDepartment: null,
      selectedCategory: null,
      isComplete: false,
      error: null,
    }));
  }, []);

  // Handle sub-department change
  const handleSubDepartmentChange = useCallback((subDept: string): void => {
    logger.debug("Sub-department changed", { subDept });
    setState((prevState) => ({
      ...prevState,
      selectedSubDepartment: subDept,
      selectedCategory: null,
      isComplete: false,
      error: null,
    }));
  }, []);

  // Fetch selected category with full attributes from database
  const { data: selectedCategoryWithAttributes } = useCategoryWithAttributes(
    state.selectedCategory?.category || '',
    { enabled: !!state.selectedCategory?.category }
  );

  // Derive schema from selected category using the database-aware schema generator
  const schema = useMemo(() => {
    if (!selectedCategoryWithAttributes || !selectedCategoryWithAttributes.attributes) {
      return [];
    }
    // Use the new database-aware method that doesn't need MASTER_ATTRIBUTES
    return UnifiedSchemaGenerator.deriveSchemaFromDatabaseAttributes(selectedCategoryWithAttributes.attributes);
  }, [selectedCategoryWithAttributes]);

  // Handle category selection
  const handleCategorySelect = useCallback(
    (category: CategoryConfig | null): void => {
      logger.debug("Category selection requested", {
        categoryCode: category?.category,
        displayName: category?.displayName,
      });

      setState((prevState) => {
        if (category === null) {
          logger.info("Category selection reset");
          return {
            selectedCategory: null,
            selectedDepartment: null,
            selectedSubDepartment: null,
            isComplete: false,
            isLoading: false,
            error: null,
            selectionHistory: [],
          };
        }

        // Category will be validated via the validationCategory query
        // Update history immutably (keep last 5 selections)
        const newHistory = [
          category,
          ...prevState.selectionHistory.filter(
            (c) => c.category !== category.category
          ),
        ].slice(0, 5);

        logger.info("Category selected successfully", {
          category: category.category,
          displayName: category.displayName,
          department: category.department,
        });

        return {
          ...prevState,
          selectedCategory: category,
          selectedDepartment: category.department,
          selectedSubDepartment: category.subDepartment,
          isComplete: true,
          isLoading: false,
          error: null,
          selectionHistory: newHistory,
        };
      });
    },
    []
  );

  // Reset selection
  const resetSelection = useCallback((): void => {
    logger.info("Resetting category selection");
    setState({
      selectedCategory: null,
      selectedDepartment: null,
      selectedSubDepartment: null,
      isComplete: false,
      isLoading: false,
      error: null,
      selectionHistory: [],
    });
  }, []);

  // Go back to previous category
  const goToPreviousCategory = useCallback((): void => {
    setState((prevState) => {
      if (prevState.selectionHistory.length === 0) {
        logger.warn("No previous category to go back to");
        return prevState;
      }

      const [, ...remainingHistory] = prevState.selectionHistory;
      const previousCategory = remainingHistory[0] || null;

      logger.info("Going back to previous category", {
        previousCategory: previousCategory?.category,
      });

      return {
        ...prevState,
        selectedCategory: previousCategory,
        selectedDepartment: previousCategory?.department || null,
        selectedSubDepartment: previousCategory?.subDepartment || null,
        isComplete: !!previousCategory,
        selectionHistory: remainingHistory,
        error: null,
      };
    });
  }, []);

  // Validate category code (uses React Query cache or fetches from DB)
  const validateCategory = useCallback((categoryCode: string): boolean => {
    try {
      // The validation happens via the validationCategory query
      // For immediate validation, we can check the cache
      return !!validationCategory;
    } catch (error) {
      logger.error("Category validation failed", { categoryCode, error });
      return false;
    }
  }, [validationCategory]);

  // Get category breadcrumb path
  const getCategoryPath = useCallback((): string[] => {
    if (!state.selectedCategory) return [];

    const category = state.selectedCategory;
    const path: string[] = [];

    if (category.department) {
      path.push(category.department);
    }

    if (category.subDepartment) {
      path.push(category.subDepartment);
    }

    path.push(category.displayName);
    return path;
  }, [state.selectedCategory]);

  // Check if current selection is valid
  const isValidSelection = useCallback((): boolean => {
    return !!(state.selectedCategory && state.isComplete && !state.error);
  }, [state.selectedCategory, state.isComplete, state.error]);

  // Error cleanup on timeout
  useEffect(() => {
    if (state.error) {
      logger.error("Category selector error", { error: state.error });
      const timer = setTimeout(() => {
        setState((prevState) => ({
          ...prevState,
          error: null,
        }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  return {
    // State
    selectedCategory: state.selectedCategory,
    selectedDepartment: state.selectedDepartment,
    selectedSubDepartment: state.selectedSubDepartment,
    isComplete: state.isComplete,
    isLoading: state.isLoading,
    error: state.error,
    selectionHistory: state.selectionHistory,
    schema,

    // Derived data
    departments,
    subDepartments,
    availableCategories,

    // Loading states for each level
    isDepartmentsLoading,
    isSubDepartmentsLoading,
    isCategoriesLoading,

    // Actions
    handleCategorySelect,
    handleDepartmentChange,
    handleSubDepartmentChange,
    resetSelection,
    goToPreviousCategory,
    validateCategory,

    // Utilities
    getCategoryPath,
    isValidSelection,
  };
};
