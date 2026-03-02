// Shared exports for the entire application

// Components
export * from './components';

// Hooks  
export * from './hooks/ui/useLocalStorage';
export * from './hooks/category/useCategorySelector';
export * from './hooks/extraction/useImageExtraction';

// Services
export * from '../services/api/backendApi';
export * from './services/storage/indexedDBService';

// Utils
export * from './utils/common/helpers';
export * from './utils/category/categoryHelpers';

// Types
export * from './types/extraction/ExtractionTypes';
export * from './types/core/CommonTypes';
export * from './types/category/CategoryTypes';

// Constants
export * from './constants/app/config';