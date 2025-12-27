'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { Food } from '@/types/food';

export default function ManageFoods() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFoods();
  }, []);

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

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this entry?")) return;

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
        <h1 className="text-2xl font-bold text-text-main">Manage Library</h1>
        <Link href="/add-food" className="bg-primary text-white px-4 py-2 rounded-theme text-sm hover:opacity-90 transition">
          + Add New
        </Link>
      </div>

      <div className="bg-card shadow rounded-theme overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-text-main/5 border-b border-text-main/10">
            <tr>
              <th className="px-6 py-3 text-text-main/70 font-bold">Food Name</th>
              <th className="px-6 py-3 text-text-main/70 font-bold">Calories</th>
              <th className="px-6 py-3 text-right text-text-main/70 font-bold">Actions</th>
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
                  No foods found in your library.
                </td>
              </tr>
            ) : (
              foods.map((food) => (
                <tr key={food.id} className="hover:bg-text-main/5 transition-colors bg-card">
                  <td className="px-6 py-4 font-medium text-text-main">{food.name}</td>
                  <td className="px-6 py-4 text-text-main/70">{food.energy_kcal || 0} kcal</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <Link 
                        href={`/edit/${food.id}`} 
                        className="text-primary hover:opacity-80 hover:underline font-medium transition"
                      >
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(food.id)} 
                        className="text-red-600 hover:text-red-700 hover:underline font-medium transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}