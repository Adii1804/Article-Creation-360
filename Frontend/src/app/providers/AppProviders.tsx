/**
 * App Providers
 * Combines all context providers for the application
 */

import type { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from '../contexts/authProvider';
import { ThemeProvider } from '../contexts/themeProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}