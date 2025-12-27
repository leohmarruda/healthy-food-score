'use client';
import { useState } from 'react';
import Link from 'next/link';
import NutritionLabel from './NutritionLabel';
import type { Food } from '@/types/food';

interface FoodProfileModalProps {
  food: Food | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FoodProfileModal({ food, isOpen, onClose }: FoodProfileModalProps) {
  const [multiplier, setMultiplier] = useState(1);

  if (!isOpen || !food) return null;

  // Calculate nutrition values based on portion size and multiplier
  const baseRatio = (food.portion_size_value || 100) / 100;
  const totalRatio = baseRatio * multiplier;

  const getPortionTotal = (value100g: number) => value100g * totalRatio;
  const calculateCalories = (num: number) => (num ? Math.round(num * totalRatio) : 0);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
        <div 
            className="relative bg-card rounded-theme shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Close Button */}
            <button
            onClick={onClose}
            className="absolute top-5 right-5 z-50 text-text-main/60 hover:text-text-main text-3xl font-light w-10 h-10 flex items-center justify-center rounded-full hover:bg-text-main/10 transition"
            >
            ×
            </button>
          
            {/* LEFT COLUMN: Visuals & Label */}
            <div className="md:w-5/12 bg-background p-6 overflow-y-auto border-r border-text-main/10 flex flex-col items-center">
            
                {/* Product Image */}
                <div className="w-full h-48 bg-card rounded-theme mb-6 shadow-sm flex items-center justify-center p-4">
                    <img src={food.front_photo_url} className="max-h-full object-contain" alt={food.name} />
                </div>

                {/* Nutrition Label with Serving Controls */}
                <div className="scale-90 origin-top">
                    <NutritionLabel 
                        data={food} 
                        multiplier={multiplier} 
                        usePortion={true}
                        onMultiplierChange={setMultiplier}
                    />
                </div>
            </div>

            {/* RIGHT SIDE: Details & Summary */}
            <div className="flex-1 p-8 flex flex-col justify-between min-w-0">
                <div className="space-y-6">
                    <div>
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">
                            {food.brand || 'Generic Brand'}
                        </span>
                        <h2 className="text-3xl font-black text-text-main leading-tight">{food.name}</h2>
                        <p className="text-text-main/60 italic text-sm mt-1">{food.category}</p>
                    </div>

                    {/* HFS SCORE Visualizer */}
                    <div className="p-4 bg-background rounded-theme border border-text-main/10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-text-main uppercase">HFS Score</span>
                            <span className={`text-lg font-black ${
                            food.hfs > 7 ? 'text-green-600' : food.hfs > 4 ? 'text-orange-500' : 'text-red-600'
                            }`}>
                            {food.hfs}/10
                            </span>
                        </div>
                        <div className="w-full bg-text-main/10 h-3 rounded-full overflow-hidden">
                            <div 
                            className={`h-full transition-all duration-700 ${
                                food.hfs > 7 ? 'bg-green-500' : food.hfs > 4 ? 'bg-orange-400' : 'bg-red-500'
                            }`}
                            style={{ width: `${(food.hfs || 0) * 10}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Total Summary Card */}
                    <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-lg transform transition hover:scale-[1.02]">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-3">Total for current consumption</p>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Calories</p>
                                <span className="text-5xl font-black text-white">
                                {calculateCalories(food.energy_kcal)}
                                </span>
                                <span className="ml-2 text-gray-400 font-bold uppercase text-xs tracking-widest">kcal</span>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-blue-400">
                                {getPortionTotal(food.protein_g).toFixed(1)}g
                                </span>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Protein</p>
                            </div>
                        </div>
                </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-8">
                    <div className="mt-6 pt-4 border-t border-text-main/10 flex items-center justify-between">
                        <div className="text-[10px] text-text-main/50 italic">
                            Last update: {food.last_update 
                            ? new Date(food.last_update).toLocaleDateString('pt-BR') 
                            : 'Manual Entry'}
                        </div>
                        
                        <Link
                        href={`/edit/${food.id}`}
                        className="flex items-center justify-center w-full bg-primary text-white py-4 rounded-theme font-bold text-lg hover:opacity-90 shadow-lg transition active:scale-95"
                        >
                        ✏️ Edit Record
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}