// context/NavigationGuardContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface NavigationGuardContextProps {
  registerGuard: (shouldBlock: boolean, pathname: string) => void;
  unregisterGuard: () => void;
  guardNavigation: (targetPath: string) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextProps | undefined>(undefined);

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const [guardedPaths, setGuardedPaths] = useState<Map<string, boolean>>(new Map());
  const router = useRouter();
  const currentPathname = usePathname();

  // Register a path that should be guarded
  const registerGuard = useCallback((shouldBlock: boolean, pathname: string) => {
    setGuardedPaths(prev => {
      const newMap = new Map(prev);
      newMap.set(pathname, shouldBlock);
      return newMap;
    });
  }, []);

  // Unregister a path from being guarded
  const unregisterGuard = useCallback(() => {
    setGuardedPaths(prev => {
      const newMap = new Map(prev);
      newMap.delete(currentPathname);
      return newMap;
    });
  }, [currentPathname]);

  // Handle navigation with guard check
  const guardNavigation = useCallback((targetPath: string) => {
    const isGuarded = guardedPaths.get(currentPathname);
    
    // If not guarded or navigating to the same path without changes, proceed
    if (!isGuarded) {
      router.push(targetPath);
      return;
    }
    
    // Store the pending navigation target in window
    (window as any).pendingNavigationPath = targetPath;
    
    // Trigger the confirmation dialog by setting window property
    // This will be detected by the page component
    (window as any).navigationAttempted = true;
    
    // Use a custom event to notify components about navigation attempt
    const event = new CustomEvent('navigationAttempt', { 
      detail: { targetPath } 
    });
    window.dispatchEvent(event);
  }, [guardedPaths, currentPathname, router]);

  const contextValue = {
    registerGuard,
    unregisterGuard,
    guardNavigation
  };

  return (
    <NavigationGuardContext.Provider value={contextValue}>
      {children}
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuardContext() {
  const context = useContext(NavigationGuardContext);
  if (!context) {
    throw new Error('useNavigationGuardContext must be used within a NavigationGuardProvider');
  }
  return context;
}