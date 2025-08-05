import { useEffect } from 'react';

/**
 * Custom hook for cross-tab synchronization
 * Listens for localStorage changes and data updates across browser tabs
 */
export const useTabSync = (onDataUpdate, onTokenChange) => {
  useEffect(() => {
    // Handle localStorage changes (token updates, logout from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (e.newValue === null && e.oldValue !== null) {
          // Token was removed (logout from another tab)
          console.log('Token removed in another tab, logging out...');
          if (onTokenChange) {
            onTokenChange(null);
          }
          window.location.href = '/login';
        } else if (e.newValue !== null && e.oldValue === null) {
          // Token was added (login from another tab)
          console.log('Token added in another tab, refreshing...');
          if (onTokenChange) {
            onTokenChange(e.newValue);
          }
          window.location.reload();
        }
      }
    };

    // Handle custom data update events
    const handleDataUpdate = (e) => {
      console.log('Data updated in another tab:', e.detail);
      if (onDataUpdate) {
        onDataUpdate(e.detail);
      }
    };

    // Listen for storage events (cross-tab)
    window.addEventListener('storage', handleStorageChange);
    // Listen for custom data update events
    window.addEventListener('dataUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dataUpdated', handleDataUpdate);
    };
  }, [onDataUpdate, onTokenChange]);
};

/**
 * Utility function to trigger data refresh across all tabs
 */
export const triggerDataRefresh = (context = 'general') => {
  // Dispatch custom event
  window.dispatchEvent(new CustomEvent('dataUpdated', { 
    detail: { 
      context,
      timestamp: Date.now()
    } 
  }));
  
  // Also trigger storage event for older browsers
  const event = new StorageEvent('storage', {
    key: 'dataRefresh',
    newValue: JSON.stringify({ context, timestamp: Date.now() }),
    url: window.location.href
  });
  window.dispatchEvent(event);
};
