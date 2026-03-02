/**
 * Theme Provider
 * Provides theme state and toggle functionality
 */

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Theme } from '../../types/theme';
import { ThemeContext } from './theme.context';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: Readonly<ThemeProviderProps>) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Load theme from localStorage on mount
    const storedTheme = localStorage.getItem('theme') as Theme;
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
