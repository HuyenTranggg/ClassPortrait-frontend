import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ClassPortrait_Invigilators';

export function useInvigilators() {
  const [invigilators, setInvigilators] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setInvigilators(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading invigilators from localStorage', error);
      }
    };

    loadFromStorage();

    // Lắng nghe sự kiện storage (thay đổi từ tab khác)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadFromStorage();
      }
    };
    
    // Lắng nghe custom event (thay đổi trong cùng tab)
    const handleCustomChange = () => {
      loadFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('invigilators_updated', handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('invigilators_updated', handleCustomChange);
    };
  }, []);

  const updateInvigilator = useCallback((classId: string, name: string) => {
    setInvigilators((prev) => {
      const updated = { ...prev };
      if (name === '') {
        delete updated[classId];
      } else {
        updated[classId] = name;
      }
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        // Phát sự kiện để báo cho các component khác (cùng tab)
        window.dispatchEvent(new Event('invigilators_updated'));
      } catch (error) {
        console.error('Error saving invigilator to localStorage', error);
      }
      return updated;
    });
  }, []);

  return { invigilators, updateInvigilator };
}
