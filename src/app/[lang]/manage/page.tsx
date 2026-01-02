'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

import ConfirmModal from '@/components/ConfirmModal';
import FoodProfileModal from '@/components/FoodProfileModal';
import { getDictionary } from '@/lib/get-dictionary';
import { supabase } from '@/lib/supabase';
import type { Food } from '@/types/food';

export default function ManageFoods() {
  // Hooks
  const params = useParams();
  const lang = (params?.lang as string) || 'pt';

  // State
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [dict, setDict] = useState<any>(null);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; order: 'asc' | 'desc' }>({
    key: 'product_name',
    order: 'asc'
  });

  // Derived values
  const t = dict?.pages?.manage || {};

  // Effects
  useEffect(() => {
    async function init() {
      try {
        const dictionary = await getDictionary(lang as 'pt' | 'en');
        setDict(dictionary);
        await fetchFoods();
      } catch (error) {
        console.error('Init error:', error);
        toast.error('Failed to initialize page');
      }
    }
    init();
  }, [lang]);

  // Data fetching
  async function fetchFoods() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .order('product_name', { ascending: true });
      
      if (error) throw error;
      if (data) setFoods(data);
    } catch (error) {
      console.error('Error fetching foods:', error);
      toast.error(t.loadError || 'Failed to load foods');
    } finally {
      setLoading(false);
    }
  }

  // Sort handler
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Sort foods based on sortConfig
  const sortedFoods = [...foods].sort((a, b) => {
    const aValue = a[sortConfig.key as keyof Food];
    const bValue = b[sortConfig.key as keyof Food];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.order === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.order === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  // Render sort icon
  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <span className="ml-1 opacity-30 text-[10px]">↕</span>;
    return sortConfig.order === 'asc' 
      ? <span className="ml-1 text-primary text-[10px]">▲</span> 
      : <span className="ml-1 text-primary text-[10px]">▼</span>;
  };

  // Event handlers
  const confirmDeletion = (id: string) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleFoodClick = (food: Food) => {
    setSelectedFood(food);
    setIsModalOpen(true);
  };

  async function handleDelete() {
    if (!itemToDelete) return;
  
    const deletePromise = async () => {
      const res = await fetch(`/api/foods/${itemToDelete}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || t.deleteError || 'Failed to delete');
      }
      setFoods(prev => prev.filter(f => f.id !== itemToDelete));
      return res;
    };
  
    toast.promise(deletePromise(), {
      loading: t.deleteLoading || 'Deleting food item and images...',
      success: () => {
        setShowDeleteModal(false);
        setItemToDelete(null);
        return t.deleteSuccess || 'Food item removed successfully!';
      },
      error: (err) => {
        setShowDeleteModal(false);
        return `${t.deleteError || 'Failed to delete'}: ${err.message}`;
      },
    });
  }
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">{t.title}</h1>
        <div className="flex gap-3">
          <Link href={`/${lang}/manage/additives`} className="bg-text-main/10 text-text-main px-4 py-2 rounded-theme text-sm hover:bg-text-main/20 transition">
            {t.manageAdditives || 'Manage Additives'}
          </Link>
          <Link href={`/${lang}/new-food`} className="bg-primary text-white px-4 py-2 rounded-theme text-sm hover:opacity-90 transition">
            + {t.addNew}
          </Link>
        </div>
      </div>

      <div className="bg-card shadow rounded-theme overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-text-main/5 border-b border-text-main/10">
            <tr>
              <th className="px-6 py-3 text-text-main/70 font-bold w-16"></th>
              <th 
                className="px-6 py-3 text-text-main/70 font-bold cursor-pointer hover:bg-text-main/5 transition" 
                onClick={() => handleSort('product_name')}
              >
                <div className="flex items-center">
                  {t.name}
                  <SortIcon column="product_name" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-text-main/70 font-bold cursor-pointer hover:bg-text-main/5 transition" 
                onClick={() => handleSort('brand')}
              >
                <div className="flex items-center">
                  {dict?.components?.foodTable?.brand || 'Brand'}
                  <SortIcon column="brand" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-text-main/70 font-bold cursor-pointer hover:bg-text-main/5 transition" 
                onClick={() => handleSort('location')}
              >
                <div className="flex items-center">
                  {dict?.pages?.edit?.labelLocation || 'Location'}
                  <SortIcon column="location" />
                </div>
              </th>
              <th className="px-6 py-3 text-right text-text-main/70 font-bold">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-text-main/10">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : sortedFoods.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-text-main/60">
                {t.noFoods}
                </td>
              </tr>
            ) : (
              sortedFoods.map((food) => (
                <tr key={food.id} className="hover:bg-text-main/5 transition-colors bg-card">
                  <td className="px-6 py-4">
                    {food.front_photo_url ? (
                      <img 
                        src={food.front_photo_url} 
                        alt={food.product_name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-text-main/10 rounded flex items-center justify-center text-text-main/40 text-xs">
                        {dict?.components?.foodCard?.noPhoto || 'No Image'}
                      </div>
                    )}
                  </td>
                  <td 
                    className="px-6 py-4 font-medium text-text-main cursor-pointer" 
                    onClick={() => handleFoodClick(food)}
                  >
                    {food.product_name}
                  </td>
                  <td 
                    className="px-6 py-4 text-text-main/70 cursor-pointer" 
                    onClick={() => handleFoodClick(food)}
                  >
                    {food.brand || dict?.components?.foodProfileModal?.noBrand || '—'}
                  </td>
                  <td 
                    className="px-6 py-4 text-text-main/70 cursor-pointer" 
                    onClick={() => handleFoodClick(food)}
                  >
                    {food.location || '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <Link 
                        href={`/${lang}/edit/${food.id}`} 
                        className="text-primary hover:opacity-80 hover:underline font-medium transition"
                      >
                      {t.edit}
                      </Link>
                      <button 
                        onClick={() => confirmDeletion(food.id)} 
                        className="text-red-500/70 hover:text-red-600 font-bold text-sm transition"
                      >
                        {t.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {selectedFood && (
        <FoodProfileModal
          food={selectedFood}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          dict={dict}
        />
      )}
      <ConfirmModal 
        isOpen={showDeleteModal}
        title={t.confirmDeleteTitle || "Delete Record"}
        message={t.confirmDeleteMessage || "Are you sure you want to delete this food item? This action will permanently remove all data and images from the server."}
        variant="danger"
        confirmLabel={t.delete}
        dict={dict}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
      />
    </div>
  );
}