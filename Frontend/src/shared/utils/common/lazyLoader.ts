/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { lazy } from 'react';
import { logger } from './logger';

/**
 * Enhanced lazy loading utility with error handling and preloading
 */
export class LazyLoader {
  private static preloadedComponents = new Set<string>();
  
  /**
   * Create lazy component with error handling and loading states
   */
  public static createLazyComponent<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    componentName: string
  ) {
    return lazy(async () => {
      const startTime = performance.now();
      
      try {
        logger.debug(`Loading lazy component: ${componentName}`);
        
        const module = await importFn();
        const loadTime = performance.now() - startTime;
        
        logger.info(`Lazy component loaded: ${componentName}`, {
          loadTime: Math.round(loadTime),
          componentName,
        });
        
        return module;
      } catch (error) {
        const loadTime = performance.now() - startTime;
        
        logger.error(`Failed to load lazy component: ${componentName}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          loadTime: Math.round(loadTime),
          componentName,
        });
        
        // ✅ FIXED: Return proper error fallback component
        const ErrorFallback: React.FC = () => {
          return React.createElement('div', {
            style: { 
              padding: '24px', 
              textAlign: 'center',
              color: '#ff4d4f',
              border: '1px dashed #ff4d4f',
              borderRadius: '4px',
              background: '#fff2f0'
            }
          }, [
            React.createElement('p', { key: 'error-msg' }, `Failed to load component: ${componentName}`),
            React.createElement('button', { 
              key: 'retry-btn',
              onClick: () => window.location.reload(),
              style: { 
                padding: '4px 8px',
                border: '1px solid #ff4d4f',
                background: 'transparent',
                color: '#ff4d4f',
                borderRadius: '4px',
                cursor: 'pointer'
              }
            }, 'Retry')
          ]);
        };
        
        return {
          default: ErrorFallback as T,
        };
      }
    });
  }

  /**
   * Preload component for better UX
   */
  public static preloadComponent(
    importFn: () => Promise<any>,
    componentName: string
  ): void {
    if (this.preloadedComponents.has(componentName)) {
      return;
    }

    this.preloadedComponents.add(componentName);
    
    // Preload with low priority
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importFn().catch((error) => {
          logger.warn(`Preload failed for ${componentName}:`, error);
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        importFn().catch((error) => {
          logger.warn(`Preload failed for ${componentName}:`, error);
        });
      }, 100);
    }
  }
}

// ✅ FIXED: Create proper lazy components for your existing components
export const LazyExportManager = LazyLoader.createLazyComponent(
  () => import('../../../features/extraction/components/ExportButton').then(module => ({ default: module.ExportButton })),
  'ExportManager'
);

export const LazyDiscoveryPanel = LazyLoader.createLazyComponent(
  () => import('../../../features/extraction/components/DiscoveryPanel').then(module => ({ default: module.DiscoveryPanel })),
  'DiscoveryPanel'
);

export const LazyDiscoveryDetailModal = LazyLoader.createLazyComponent(
  () => import('../../../features/extraction/components/DiscoveryDetailModal').then(module => ({ default: module.DiscoveryDetailModal })),
  'DiscoveryDetailModal'
);

// ✅ BONUS: Preload critical components on app start
export const preloadCriticalComponents = () => {
  LazyLoader.preloadComponent(
    () => import('../../../features/extraction/components/ExportButton'),
    'ExportManager'
  );
  
  LazyLoader.preloadComponent(
    () => import('../../../features/extraction/components/DiscoveryPanel'),
    'DiscoveryPanel'
  );
};

// ✅ BONUS: Enhanced preloading with conditions
export const preloadOnUserInteraction = () => {
  const preloadOnEvent = (eventType: string) => {
    const handler = () => {
      preloadCriticalComponents();
      document.removeEventListener(eventType, handler);
    };
    document.addEventListener(eventType, handler, { once: true });
  };

  // Preload on first user interaction
  preloadOnEvent('mouseenter');
  preloadOnEvent('click');
  preloadOnEvent('keydown');
  preloadOnEvent('scroll');
};

// ✅ BONUS: Utility functions for better lazy loading
export const createLazyComponentWithRetry = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentName: string,
  maxRetries = 3
) => {
  return LazyLoader.createLazyComponent(async () => {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await importFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Lazy load attempt ${attempt} failed for ${componentName}`, { error: lastError });
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
    
    throw lastError!;
  }, componentName);
};

// ✅ BONUS: Component registry for better organization
export const ComponentRegistry = {
  ExportManager: LazyExportManager,
  DiscoveryPanel: LazyDiscoveryPanel,
  DiscoveryDetailModal: LazyDiscoveryDetailModal,
} as const;

export type ComponentName = keyof typeof ComponentRegistry;
