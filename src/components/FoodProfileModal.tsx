'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import NutritionLabel from './NutritionLabel';
import HFSLabel from './HFSLabel';
import type { Food } from '@/types/food';

interface FoodProfileModalProps {
  food: Food | null;
  isOpen: boolean;
  onClose: () => void;
  dict: any;
}

export default function FoodProfileModal({ food, isOpen, onClose, dict }: FoodProfileModalProps) {
  const params = useParams();
  const lang = (params?.lang as string) || 'pt';

  if (!isOpen || !food || !dict) return null;

  const [multiplier, setMultiplier] = useState(1);
  const t = dict?.components?.foodProfileModal || {};
  const tm = dict?.pages?.manage || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="relative bg-card rounded-theme shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-50 text-text-main/60 hover:text-text-main text-3xl font-light w-10 h-10 flex items-center justify-center rounded-full hover:bg-text-main/10 transition"
        >
          ×
        </button>
        <div className="md:w-5/12 bg-background p-6 overflow-y-auto border-r border-text-main/10 flex flex-col items-center">
          <div className="w-full h-48 bg-card rounded-theme mb-6 shadow-sm flex items-center justify-center p-4">
            <img src={food.front_photo_url} className="max-h-full object-contain" alt={food.product_name} />
          </div>
          <div className="scale-90 origin-top">
                    <NutritionLabel 
                        data={food} 
                        multiplier={multiplier} 
                        usePortion={true}
                        onMultiplierChange={setMultiplier}
                        dict={dict}
                    />
          </div>
        </div>
        <div className="flex-1 p-8 flex flex-col justify-between min-w-0 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                {food.brand || t.noBrand || 'Generic'}
              </span>
              <h2 className="text-3xl font-black text-text-main leading-tight">
                {food.product_name}
                {(food as any).net_content_g_ml != null && (
                  <span className="text-xl font-normal text-text-main/70 ml-2">
                    ({(food as any).net_content_g_ml} g ou ml)
                  </span>
                )}
              </h2>
              <p className="text-text-main/60 italic text-sm mt-1">
                {(food.category && dict.categories) 
                  ? (dict.categories[food.category as keyof typeof dict.categories] || food.category)
                  : food.category}
              </p>
              {((food as any).price != null || food.location) && (
                <p className="text-lg font-semibold text-text-main mt-2">
                  {(food as any).price != null && (
                    <span>
                      {typeof (food as any).price === 'number' 
                        ? `R$ ${(food as any).price.toFixed(2).replace('.', ',')}`
                        : (food as any).price}
                    </span>
                  )}
                  {(food as any).price != null && food.location && <span> - </span>}
                  {food.location && <span>{food.location}</span>}
                </p>
              )}
            </div>

            {/* HFS Score - Enhanced */}
            <div className="p-5 bg-gradient-to-br from-background to-background/50 rounded-theme border-2 border-text-main/10 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-bold text-text-main uppercase">{t.hfsScore || 'HFS Score'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {food.hfs_score?.v2?.hfs_score !== undefined && (
                  <HFSLabel 
                    food={{ ...food, hfs_score: { v2: food.hfs_score.v2 } }} 
                    variant="card" 
                    className="text-base" 
                    dict={dict} 
                  />
                )}
                {(food.hfs_score?.v1?.HFS !== undefined || food.hfs_score?.v1?.HFSv1 !== undefined) && (
                  <HFSLabel 
                    food={{ ...food, hfs_score: { v1: food.hfs_score.v1 } }} 
                    variant="card" 
                    className="text-base" 
                    dict={dict} 
                  />
                )}
                {(!food.hfs_score?.v1 && !food.hfs_score?.v2) && (
                  <HFSLabel food={food} variant="card" className="text-base" dict={dict} />
                )}
              </div>
            </div>

            {/* Typical Portion */}
            {(food.serving_size_value || food.serving_size_unit) && (
              <div className="p-4 bg-background rounded-theme border border-text-main/10">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-bold text-text-main uppercase">{t.typicalPortion || 'Typical Portion'}</span>
                </div>
                <p className="text-lg font-semibold text-text-main">
                  {food.serving_size_value || 100}{food.serving_size_unit || 'g'}
                </p>
                <p className="text-xs text-text-main/60 mt-1">
                  {t.portionSizeDeclared || 'Portion size as declared on package'}
                </p>
              </div>
            )}

            {/* Ingredients */}
            {((food as any).ingredients_list && Array.isArray((food as any).ingredients_list) && (food as any).ingredients_list.length > 0) || food.ingredients_raw ? (
              <div className="p-4 bg-background rounded-theme border border-text-main/10">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-sm font-bold text-text-main uppercase">{t.ingredients || 'Ingredients'}</span>
                </div>
                {(food as any).ingredients_list && Array.isArray((food as any).ingredients_list) && (food as any).ingredients_list.length > 0 ? (
                  <ul className="space-y-1">
                    {(food as any).ingredients_list.map((ingredient: string, idx: number) => (
                      <li key={idx} className="text-sm text-text-main/80 flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="flex-1">{String(ingredient || '').trim()}</span>
                      </li>
                    ))}
                  </ul>
                ) : food.ingredients_raw ? (
                  <p className="text-sm text-text-main/80 leading-relaxed whitespace-pre-wrap">
                    {food.ingredients_raw}
                  </p>
                ) : null}
              </div>
            ) : null}


          </div>
          <div className="space-y-3 pt-8">
            <div className="mt-6 pt-4 border-t border-text-main/10 flex items-center justify-between">
              <div className="text-[10px] text-text-main/50 italic">
                {dict?.pages?.edit?.lastUpdatedLabel || dict?.pages?.home?.lastUpdate || 'Last update'}: {(food.last_update || food.created_at)
                  ? new Date(food.last_update || food.created_at || '').toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US') 
                  : (t.manualEntry || 'Manual Entry')}
              </div>
              <Link
                href={`/${lang}/edit/${food.id}`}
                className="flex items-center justify-center w-full bg-primary text-white py-4 rounded-theme font-bold text-lg hover:opacity-90 shadow-lg transition active:scale-95"
              >
                ✏️ {tm?.edit || 'Edit Record'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}