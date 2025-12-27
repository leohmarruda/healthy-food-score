'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import FoodProfileModal from '@/components/FoodProfileModal';
import FoodTable from '@/components/FoodTable';
import { downloadAsCSV } from '@/utils/export';
import type { Food } from '@/types/food';

type ViewMode = 'grid' | 'table';

// Adicione o tipo do dicionário nas props
export default function HomeClient({ dict, lang }: { dict: any, lang: string }) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Use o dicionário para os textos da interface
  const t = dict.home || { 
    searchPlaceholder: lang === 'pt' ? 'Buscar alimentos...' : 'Search foods...',
    loading: lang === 'pt' ? 'Carregando biblioteca...' : 'Loading library...',
    noFoods: lang === 'pt' ? 'Nenhum alimento encontrado' : 'No foods found',
    addFirst: lang === 'pt' ? 'Adicione seu primeiro item' : 'Add your first food item',
    protein: lang === 'pt' ? 'Proteína' : 'Protein',
    grid: 'Grid',
    table: lang === 'pt' ? 'Tabela' : 'Table'
  };

  useEffect(() => {
    async function fetchFoods() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('foods')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (data) setFoods(data);
      } catch (error) {
        console.error('Error fetching foods:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFoods();
  }, []);

  const filteredFoods = foods.filter((food) =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFoodClick = (food: any) => {
    setSelectedFood(food);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFood(null);
  };

  return (
    <main className="max-w-6xl mx-auto p-8">
      {/* Header Section */}
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="text-text-main/70">{t.loading}</p>
        </div>
      ) : filteredFoods.length === 0 ? (
        <div className="text-center py-20 text-text-main/70 bg-card rounded-theme border border-text-main/20 border-dashed">
          <p className="text-lg font-medium">{t.noFoods} {searchTerm && `"${searchTerm}"`}</p>
          {!searchTerm && (
            <Link href={`/${lang}/add-food`} className="text-primary hover:underline mt-2 inline-block">
              {t.addFirst} →
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* View Controls */}
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

          {/* Grid Mode */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFoods.map((food) => (
                <div 
                  key={food.id} 
                  onClick={() => handleFoodClick(food)}
                  className="border border-text-main/20 rounded-theme overflow-hidden shadow-sm hover:shadow-lg transition-all bg-card cursor-pointer transform hover:-translate-y-1"
                >
                                    <div className="relative h-48 bg-text-main/5">
                    {food.front_photo_url ? (
                      <img 
                        src={food.front_photo_url} 
                        alt={food.name} 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-text-main/40">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-text-main mb-1">{food.name}</h3>
                    <div className="flex justify-between text-sm text-text-main/70">
                      <span>🔥 {food.energy_kcal || 0} kcal</span>
                      <span>💪 {food.protein_g || 0}g {t.protein}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <FoodTable foods={filteredFoods} onFoodClick={handleFoodClick} dict={dict} />
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