"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    // Since register: true in next.config.ts, the SW is auto-registered
    // We just need to handle updates and provide user feedback
    
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          // Check if there's already a registration
          const registration = await navigator.serviceWorker.getRegistration();
          
          if (registration) {
            console.log('✅ Service Worker found:', registration);
            
            // Handle updates
            registration.addEventListener('updatefound', () => {
              const installingWorker = registration.installing;
              console.log('🔄 Service Worker update found');
              
              if (installingWorker) {
                installingWorker.addEventListener('statechange', () => {
                  console.log('📱 Service Worker state:', installingWorker.state);
                  
                  if (installingWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                      console.log('🆕 New content available! Please refresh.');
                      // You could show a toast notification here
                      // Example: toast.info('New version available! Refresh to update.');
                    } else {
                      console.log('💾 Content is cached for offline use.');
                    }
                  }
                });
              }
            });
          } else {
            console.log('⏳ Service Worker not yet registered, waiting...');
            // Wait a bit and check again (next-pwa handles the registration)
            setTimeout(registerSW, 1000);
          }
        } catch (error) {
          console.error('❌ Service Worker check failed:', error);
        }
      };

      // Start checking after page load
      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }

      return () => {
        window.removeEventListener('load', registerSW);
      };
    } else {
      console.log('❌ Service Workers not supported');
    }
  }, []);

  return null;
}