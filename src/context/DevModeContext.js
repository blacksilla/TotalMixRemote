import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadDevMode, saveDevMode } from '../storage/settings';

const DevModeContext = createContext(null);

export function DevModeProvider({ children }) {
  const [devMode, setDevMode] = useState(false);

  // Load dev mode on mount
  useEffect(() => {
    loadDevMode().then((dm) => {
      setDevMode(dm.enabled);
    });
  }, []);

  const toggleDevMode = useCallback(async (enabled) => {
    setDevMode(enabled);
    await saveDevMode({ enabled, screenIndex: 0 });
  }, []);

  return (
    <DevModeContext.Provider value={{ devMode, toggleDevMode }}>
      {children}
    </DevModeContext.Provider>
  );
}

export function useDevMode() {
  const ctx = useContext(DevModeContext);
  if (!ctx) throw new Error('useDevMode must be used inside DevModeProvider');
  return ctx;
}
