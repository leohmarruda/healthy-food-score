'use client';
import React from 'react'; // Importação explícita do React
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { Food } from '@/types/food';
import { getDictionary } from '@/lib/get-dictionary';
import { useParams } from 'next/navigation'; 
import FoodProfileModal from '@/components/FoodProfileModal';

export default function ManageFoods() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [dict, setDict] = useState<any>(null);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const params = useParams();
  const lang = (params?.lang as string) || 'pt';

  useEffect(() => {
      // Carrega o dicionário e os alimentos ao mesmo tempo
      async function init() {
        try {
          const dictionary = await getDictionary(lang as 'pt' | 'en');
          setDict(dictionary);
          await fetchFoods();
        } catch (error) {
          console.error('Init error:', error);
        }
      }
      init();
    }, [lang]);

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
      alert('Failed to load foods');
    } finally {
      setLoading(false);
    }
  }

  const handleFoodClick = (food: Food) => {
    setSelectedFood(food);
    setIsModalOpen(true);
  };

  const t = dict?.manage || {};

  async function handleDelete(id: string) {
    if (!confirm(t.confirmDelete || "Are you sure?")) return;

    try {
      const res = await fetch(`/api/foods/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFoods(foods.filter(f => f.id !== id));
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(error.message || 'Failed to delete entry');
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">{t.title}</h1>
        <Link href="/add-food" className="bg-primary text-white px-4 py-2 rounded-theme text-sm hover:opacity-90 transition">
          + {t.addNew}
        </Link>
      </div>

      <div className="bg-card shadow rounded-theme overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-text-main/5 border-b border-text-main/10">
            <tr>
              <th className="px-6 py-3 text-text-main/70 font-bold">{t.name}</th>
              <th className="px-6 py-3 text-text-main/70 font-bold">{t.calories}</th>
              <th className="px-6 py-3 text-right text-text-main/70 font-bold">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-text-main/10">
            {loading ? (
              // Loading skeleton
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : foods.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-text-main/60">
                {t.noFoods}
                </td>
              </tr>
            ) : (
              foods.map((food) => (
                <tr key={food.id} className="hover:bg-text-main/5 transition-colors bg-card">
                  <td 
                    className="px-6 py-4 font-medium text-text-main" 
                    onClick={() => handleFoodClick(food)}
                  >
                    {food.name}
                  </td>
                  <td 
                    className="px-6 py-4 text-text-main/70" 
                    onClick={() => handleFoodClick(food)}
                  >
                    {food.energy_kcal || 0} kcal</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <Link 
                        href={`/edit/${food.id}`} 
                        className="text-primary hover:opacity-80 hover:underline font-medium transition"
                      >
                      {t.edit}
                      </Link>
                      <button 
                        onClick={() => handleDelete(food.id)} 
                        className="text-red-600 hover:text-red-700 hover:underline font-medium transition"
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
    </div>
  );
}