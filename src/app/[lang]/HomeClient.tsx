'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

import FoodCard from '@/components/FoodCard';
import FoodProfileModal from '@/components/FoodProfileModal';
import FoodTable from '@/components/FoodTable';
import { supabase } from '@/lib/supabase';
import { downloadAsCSV } from '@/utils/export';
import type { Food } from '@/types/food';

type ViewMode = 'grid' | 'table';
type SortKey = 'name' | 'energy_kcal' | 'protein_g' | 'hfs';
type SortOrder = 'asc' | 'desc';

export default function HomeClient({ dict, lang, initialFoodId }: { dict: any, lang: string, initialFoodId?: string }) {
  // Hooks
  const router = useRouter();
  const pathname = usePathname();
  
  // Persist home state to survive remounts
  const homeStateKey = `home-state-${lang}`;
  const getPersistedHomeState = () => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = sessionStorage.getItem(homeStateKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };
  
  // Load persisted state on mount
  const persistedState = getPersistedHomeState();
  
  // State - Home state is preserved when modal opens/closes
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchTerm, setSearchTerm] = useState(persistedState?.searchTerm || '');
  const [loading, setLoading] = useState(true);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(persistedState?.viewMode || 'grid');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>(
    persistedState?.sortConfig || {
      key: 'hfs',
      order: 'desc'
    }
  );
  
  // Modal state - only these change when modal opens/closes
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Refs
  const hasInitializedRef = useRef(false);
  const isClosingRef = useRef(false);
  const foodsRef = useRef<Food[]>([]); // Keep foods in ref to avoid dependency issues
  
  const saveHomeState = () => {
    if (typeof window === 'undefined') return;
    try {
      // Only persist UI state, not data (foods can be large)
      sessionStorage.setItem(homeStateKey, JSON.stringify({
        searchTerm,
        viewMode,
        sortConfig
      }));
    } catch {
      // Ignore storage errors
    }
  };

  // Derived values
  const t = dict.home || { 
    searchPlaceholder: 'Search foods...',
    loading: 'Loading library...',
    noFoods: 'No foods found',
    addFirst: 'Add your first food item',
    protein: 'Protein',
    grid: 'Grid',
    table: 'Table'
  };

  // Extract food ID from URL pathname
  const getFoodIdFromPath = () => {
    if (pathname.includes('/view/')) {
      const match = pathname.match(/\/view\/([^/]+)/);
      return match ? match[1] : null;
    }
    return null;
  };

  // Check if we're on home route
  const isOnHomeRoute = () => {
    return pathname === `/${lang}/home` || pathname === `/${lang}`;
  };

  // Load full library
  const loadLibrary = async () => {
    if (libraryLoaded) return; // Never reload if already loaded
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) {
        setFoods(data);
        foodsRef.current = data; // Update ref
        setLibraryLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching foods:', error);
      toast.error(t.loadError || 'Failed to load foods');
    } finally {
      setLoading(false);
    }
  };

  // Load single food by ID
  const loadSingleFood = async (foodId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .eq('id', foodId)
        .single();
      
      if (error) throw error;
      if (data) {
        setSelectedFood(data);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching food:', error);
      toast.error(t.loadError || 'Failed to load food');
    } finally {
      setLoading(false);
    }
  };

  // Initial load: check if we're on /view/[id] or /home
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const foodId = initialFoodId || getFoodIdFromPath();

    if (foodId) {
      // Direct URL access to /view/[id]: load only this food, don't load library yet
      loadSingleFood(foodId);
    } else {
      // On /home: load full library
      loadLibrary();
    }
  }, []); // Only run once on mount

  // Sync modal state with URL - URL is the single source of truth
  // Home state (searchTerm, viewMode, sortConfig, foods) is NEVER modified here
  useEffect(() => {
    // Skip if we're closing modal manually
    if (isClosingRef.current) return;

    const foodId = getFoodIdFromPath();
    const onHome = isOnHomeRoute();

    if (foodId) {
      // URL has food ID - open modal with this food
      // Check if already correct to avoid unnecessary updates
      if (selectedFood?.id === foodId && isModalOpen) {
        return;
      }
      
      if (libraryLoaded) {
        // Library is loaded, find food from it
        // Use ref to avoid dependency on foods array
        const food = foodsRef.current.find(f => f.id === foodId) || foods.find(f => f.id === foodId);
        if (food) {
          // Only update modal state, preserve home state
          setSelectedFood(food);
          setIsModalOpen(true);
        }
      } else if (!selectedFood || selectedFood.id !== foodId) {
        // Library not loaded and food not selected or different - load just this food
        loadSingleFood(foodId);
      }
    } else if (onHome) {
      // URL has no food ID and we're on home - ensure modal is closed
      // Only update modal state if needed, never touch home state
      if (isModalOpen) {
        setIsModalOpen(false);
      }
      if (selectedFood) {
        setSelectedFood(null);
      }
      // Home state (searchTerm, viewMode, sortConfig, foods) is NEVER modified here
    }
  }, [pathname, libraryLoaded, lang]); // Removed foods dependency to prevent re-execution

  // Update ref when foods change
  useEffect(() => {
    foodsRef.current = foods;
  }, [foods]);

  // Persist home state whenever it changes (only UI state, not data)
  useEffect(() => {
    saveHomeState();
  }, [searchTerm, viewMode, sortConfig, lang]);

  // Computed values - uses home state which is preserved
  const processedFoods = useMemo(() => {
    const filtered = foods.filter((food) =>
      food.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Grid view: sort alphabetically by name
    if (viewMode === 'grid') {
      return [...filtered].sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        return aName.localeCompare(bName);
      });
    }

    // Table view: use sortConfig
    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? 0;
      const bValue = b[sortConfig.key] ?? 0;

      if (aValue < bValue) return sortConfig.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [foods, searchTerm, sortConfig, viewMode]);

  const filteredFoods = foods.filter((food) =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Event handlers
  const toggleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleFoodClick = (food: Food) => {
    // Don't do anything if this food is already selected and modal is open
    if (selectedFood?.id === food.id && isModalOpen) {
      return;
    }

    // Only update URL - useEffect will detect change and open modal after URL changes
    // Home state (searchTerm, viewMode, sortConfig, foods) is preserved
    router.replace(`/${lang}/view/${food.id}`);
  };

  const handleCloseModal = async () => {
    // Mark as closing to prevent useEffect from interfering
    isClosingRef.current = true;
    
    // Close modal and clear modal state only
    // Home state (searchTerm, viewMode, sortConfig, foods) is preserved
    setIsModalOpen(false);
    setSelectedFood(null);
    
    // Navigate back to /home - this will trigger useEffect but it will be blocked by isClosingRef
    router.replace(`/${lang}/home`);
    
    // Wait a bit for navigation to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Load library if not already loaded (only when closing modal from direct /view/[id] access)
    // This happens AFTER closing modal to ensure state is preserved
    // Never reload if already loaded
    if (!libraryLoaded) {
      await loadLibrary();
    }
    
    // Clear closing flag after everything is done
    // The useEffect will verify state but won't change anything since we're on /home
    setTimeout(() => {
      isClosingRef.current = false;
    }, 200);
  };

  return (
    <main className="max-w-6xl mx-auto p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-text-main">{dict.common.title}</h1>
        <div className="flex gap-4 w-full md:w-auto">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-card border border-text-main/20 text-text-main p-2 px-4 rounded-theme w-full md:w-64 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
          />
        </div>
      </div>

      {loading || !hasInitializedRef.current ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="text-text-main/70">
            {getFoodIdFromPath() ? (dict?.home?.loadingView || 'Loading...') : t.loading}
          </p>
        </div>
      ) : filteredFoods.length === 0 ? (
        <div className="text-center py-20 text-text-main/70 bg-card rounded-theme border border-text-main/20 border-dashed">
          <p className="text-lg font-medium">{t.noFoods} {searchTerm && `"${searchTerm}"`}</p>
          {!searchTerm && (
            <Link href={`/${lang}/new-food`} className="text-primary hover:underline mt-2 inline-block">
              {t.addFirst} →
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6 gap-4">
            <div className="flex gap-2">
              <button 
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-theme font-medium transition ${
                  viewMode === 'grid' ? 'bg-primary text-white' : 'bg-card text-text-main'
                }`}
              >
                {t.grid}
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-theme font-medium transition ${
                  viewMode === 'table' ? 'bg-primary text-white' : 'bg-card text-text-main'
                }`}
              >
                {t.table}
              </button>
            </div>
            
            <button 
              onClick={() => downloadAsCSV(filteredFoods, 'food-library-export')}
              className="px-4 py-2 bg-primary text-white rounded-theme hover:opacity-90 transition flex items-center gap-2 text-sm font-medium shadow-md"
            >
              📊 {t.export}
            </button>
          </div>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedFoods.map((food) => (
                <div key={food.id} onClick={() => handleFoodClick(food)}>
                  <FoodCard food={food as any} dict={dict} />
                </div>
              ))}
            </div>
          ) : (
            <FoodTable 
              foods={processedFoods} 
              onFoodClick={handleFoodClick} 
              dict={dict}
              sortConfig={sortConfig}
              onSort={toggleSort}
            />
          )}
        </>
      )}

      <FoodProfileModal 
        food={selectedFood}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        dict={dict}
      />
    </main>
  );
}
