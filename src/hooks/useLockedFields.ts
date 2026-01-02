import { useState, useCallback } from 'react';

export function useLockedFields() {
  const [lockedFields, setLockedFields] = useState<Set<string>>(new Set());

  const toggleLock = useCallback((field: string) => {
    setLockedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  }, []);

  const isLocked = useCallback((field: string) => {
    return lockedFields.has(field);
  }, [lockedFields]);

  return { lockedFields, toggleLock, isLocked };
}



