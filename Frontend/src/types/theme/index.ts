/**
 * Theme Types
 * All type definitions related to theming and UI preferences
 */

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
}
