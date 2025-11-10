// src/contexts/SettingsContext.tsx theme police
import React, { createContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { AppTheme, darkTheme, lightTheme } from '../constants/theme';
import StorageService from '../services/StorageService';

type SettingsContextType = {
  theme: AppTheme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  fontSize: number;
  setFontSize: (size: number) => void;
};

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [fontSize, setFontSize] = useState(16); // Taille de base

  // Charger les paramètres sauvegardés au démarrage
  useEffect(() => {
    const loadSettings = async () => {
      const savedTheme = await StorageService.get('theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }

      const savedSound = await StorageService.get('sound');
      if (savedSound !== null) {
        setIsSoundEnabled(savedSound === 'on');
      }
      
      const savedFont = await StorageService.get('fontSize');
      if (savedFont !== null) {
        setFontSize(parseInt(savedFont, 10));
      }
    };
    loadSettings();
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    StorageService.set('theme', newMode ? 'dark' : 'light');
  };

  const toggleSound = () => {
    const newSound = !isSoundEnabled;
    setIsSoundEnabled(newSound);
    StorageService.set('sound', newSound ? 'on' : 'off');
  };
  
  const handleSetFontSize = (size: number) => {
    const newSize = Math.max(12, Math.min(24, size)); // Clamp entre 12 et 24
    setFontSize(newSize);
    StorageService.set('fontSize', newSize.toString());
  };

  const theme = useMemo(() => (isDarkMode ? darkTheme : lightTheme), [isDarkMode]);

  return (
    <SettingsContext.Provider
      value={{
        theme,
        isDarkMode,
        toggleTheme,
        isSoundEnabled,
        toggleSound,
        fontSize,
        setFontSize: handleSetFontSize,
      }}>
      {children}
    </SettingsContext.Provider>
  );
};