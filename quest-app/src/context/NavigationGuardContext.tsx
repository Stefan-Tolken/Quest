// contexts/NavigationGuardContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface NavigationGuardContextType {
  guardNavigation: (targetPath: string) => void;
  registerGuard: (shouldBlock: boolean, currentPath: string) => void;
  unregisterGuard: () => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType | null>(null);

export const useNavigationGuardContext = () => {
  const context = useContext(NavigationGuardContext);
  if (!context) {
    throw new Error('useNavigationGuardContext must be used within a NavigationGuardProvider');
  }
  return context;
};

interface NavigationGuardProviderProps {
  children: ReactNode;
}

export const NavigationGuardProvider: React.FC<NavigationGuardProviderProps> = ({ children }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [activeGuard, setActiveGuard] = useState<{shouldBlock: boolean; path: string} | null>(null);
  
  // This will be called by the router when navigation is attempted
  const guardNavigation = useCallback((targetPath: string) => {
    if (activeGuard && activeGuard.shouldBlock && activeGuard.path !== targetPath) {
      setPendingNavigation(targetPath);
      setShowConfirmation(true);
      return;
    }
    
    // If no guard or guard is not blocking, proceed with navigation
    window.location.href = targetPath;
  }, [activeGuard]);
  
  // Components can register themselves to block navigation
  const registerGuard = useCallback((shouldBlock: boolean, currentPath: string) => {
    setActiveGuard({ shouldBlock, path: currentPath });
  }, []);
  
  // Components should unregister when unmounting
  const unregisterGuard = useCallback(() => {
    setActiveGuard(null);
  }, []);
  
  // Handle confirmation dialog responses
  const handleConfirmNavigation = useCallback(() => {
    setShowConfirmation(false);
    
    if (pendingNavigation) {
      // Proceed with navigation
      window.location.href = pendingNavigation;
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);
  
  const handleCancelNavigation = useCallback(() => {
    setShowConfirmation(false);
    setPendingNavigation(null);
  }, []);
  
  return (
    <NavigationGuardContext.Provider value={{
      guardNavigation,
      registerGuard,
      unregisterGuard
    }}>
      {children}
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={handleCancelNavigation}
        onConfirm={handleConfirmNavigation}
        title="Leave Page?"
        message="You have unsaved changes. If you leave now, your progress will be lost."
        confirmText="Leave Page"
        cancelText="Stay Here"
        variant="warning"
      />
    </NavigationGuardContext.Provider>
  );
};