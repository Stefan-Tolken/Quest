// hooks/useNavigationGuard.ts
'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface UseNavigationGuardProps {
  shouldBlock: boolean;
  onNavigationAttempt: (targetPath: string) => Promise<boolean>;
}

export const useNavigationGuard = ({ 
  shouldBlock, 
  onNavigationAttempt 
}: UseNavigationGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const isBlockingRef = useRef(false);
  const pendingNavigationRef = useRef<string | null>(null);

  // Block browser back/forward and page refresh
  useEffect(() => {
    if (!shouldBlock) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return 'You have unsaved changes. Are you sure you want to leave?';
    };

    const handlePopState = (e: PopStateEvent) => {
      if (isBlockingRef.current) {
        // Push the current state back to prevent navigation
        window.history.pushState(null, '', pathname);
        
        // Show confirmation dialog for back/forward navigation
        onNavigationAttempt('back').then((shouldProceed) => {
          if (shouldProceed) {
            isBlockingRef.current = false;
            window.history.back();
          }
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    // Set initial history state
    window.history.pushState(null, '', pathname);
    isBlockingRef.current = true;

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      isBlockingRef.current = false;
    };
  }, [shouldBlock, pathname, onNavigationAttempt]);

  // Create a guarded navigation function
  const guardedNavigate = useCallback(async (path: string) => {
    if (!shouldBlock) {
      router.push(path);
      return;
    }

    const shouldProceed = await onNavigationAttempt(path);
    if (shouldProceed) {
      isBlockingRef.current = false;
      router.push(path);
    }
  }, [shouldBlock, router, onNavigationAttempt]);

  // Function to disable the guard temporarily
  const disableGuard = useCallback(() => {
    isBlockingRef.current = false;
  }, []);

  return {
    guardedNavigate,
    disableGuard
  };
};