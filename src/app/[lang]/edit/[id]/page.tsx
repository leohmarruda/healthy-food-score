'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import NutritionLabel from '@/components/NutritionLabel';
import { processImages } from '@/utils/api';
import { getDictionary } from '@/lib/get-dictionary';
import type { Food, FoodFormData } from '@/types/food';

export default function EditFood() {
  const { id, lang } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('nutrition');
  const [dict, setDict] = useState<any>(null);
  
  const [formData, setFormData] = useState<FoodFormData>({
    name: '',
    brand: '',
    category: '',
    hfs: 0,
    energy_kcal: 0,
    protein_g: 0,
    carbs_total_g: 0,
    fat_total_g: 0,
    sodium_mg: 0,
    fiber_g: 0,
    saturated_fat_g: 0,
    trans_fat_g: 0,
    portion_size_value: 0,
    portion_unit: 'g',
    ingredients_raw: '',
    nutrition_raw: '',
    declared_special_nutrients: '',
    last_update: ''
  });

  const [images, setImages] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);

  useEffect(() => {
    async function init() {
      const [d, { data }] = await Promise.all([
        getDictionary(lang as 'pt' | 'en'),
        supabase.from('foods').select('*').eq('id', id).single()
      ]);

      setDict(d);

      if (data) {
        const cleanData = Object.keys(data).reduce((acc: any, key) => {
          acc[key] = data[key] === null ? "" : data[key];
          return acc;
        }, {}) as FoodFormData;
        setFormData(cleanData);
        setImages({
          front: data.front_photo_url,
          nutrition: data.nutrition_label_url,
          ingredients: data.ingredients_photo_url,
          back: data.back_photo_url
        });
      }
      setLoading(false);
    }
    init();
  }, [id, lang]);

  const tabToDbKey: Record<string, keyof Food> = {
    front: 'front_photo_url',
    nutrition: 'nutrition_label_url',
    ingredients: 'ingredients_photo_url',
    back: 'back_photo_url'
  };

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !dict) return;
    setUploading(true);
    try {
      const fileName = `${Date.now()}-${activeTab}-${file.name.replace(/[^a-z0-9]/gi, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('food-images').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('food-images').getPublicUrl(uploadData.path);
      const dbKey = tabToDbKey[activeTab];
      await supabase.from('foods').update({ [dbKey]: publicUrl }).eq('id', id);

      setImages((prev) => ({ ...prev, [activeTab]: publicUrl }));
      alert(dict.edit.uploadSuccess);
    } catch (error: any) {
      alert(dict.edit.uploadError);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRescan = async () => {
    setIsRescanning(true);
    try {
      const currentImage = images[activeTab]; // Only send the photo from the active tab
      if (!currentImage) return;
  
      const data = await processImages([currentImage], 'rescan');
      
      // Merge new fields while preserving existing data
      setFormData(prev => ({
        ...prev,
        ...data,
        ingredients_raw: data.ingredients_raw || prev.ingredients_raw,
        nutrition_raw: data.nutrition_raw || prev.nutrition_raw,
        declared_special_nutrients: data.declared_special_nutrients || prev.declared_special_nutrients
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsRescanning(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, last_update: new Date().toISOString() };
      const res = await fetch(`/api/foods/${id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      router.push(`/${lang}/manage`);
      router.refresh();
    } catch (error) {
      alert(dict?.edit?.saveError || 'Error');
    }
  };

  if (loading || !dict) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
      <p className="text-text-main/70 font-medium">Loading...</p>
    </div>
  );

  if (loading || !dict || !dict.edit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  const t = dict.edit; // Agora é seguro pois o if acima garantiu a existência

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* LEFT COLUMN: Visual Reference */}
        <div className="lg:w-1/3 space-y-6">
          <h2 className="text-xl font-bold border-b border-text-main/10 pb-2 text-text-main flex justify-between items-center">
              {t.imageTitle}
              <button 
                onClick={async () => {
                  setIsRescanning(true);
                  try {
                    const currentImage = images[activeTab];
                    if (!currentImage) return;
                    const data = await processImages([currentImage], 'rescan');
                    setFormData(prev => ({ ...prev, ...data }));
                  } finally { setIsRescanning(false); }
                }}
                disabled={isRescanning}
                className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-theme border border-primary/20 hover:bg-primary/20 disabled:opacity-50 transition"
              >
                {isRescanning ? t.scanning : `↺ ${t.btnReprocess}`}
              </button>
            </h2>

            {/* TAB SWITCHER */}
            <div className="flex bg-text-main/5 p-1 rounded-theme gap-1">
              {['front', 'nutrition', 'ingredients', 'back'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 text-[10px] uppercase font-bold py-2 rounded-theme transition ${
                    activeTab === tab 
                      ? 'bg-card text-primary shadow-sm' 
                      : 'text-text-main/60 hover:text-text-main'
                  }`}
                >
                  {/* Aqui é onde a tradução dinâmica acontece com proteção contra erros */}
                  {dict?.addFood?.[`slot${tab.charAt(0).toUpperCase() + tab.slice(1)}`] || tab}
                </button>
              ))}
            </div>

          {/* IMAGE DISPLAY */}
          <div className="space-y-4">
            <div className="relative group min-h-[300px] flex items-center justify-center bg-black rounded-lg overflow-hidden">
              {images[activeTab] ? (
                <img src={images[activeTab]} className="w-full object-contain max-h-[500px]" alt="Reference" />
              ) : (
                <div className="text-text-main/40 text-sm italic">{t.noPhoto} {activeTab}</div>
              )}
              <div className="absolute bottom-4 right-4">
                <label className="cursor-pointer bg-primary text-white px-4 py-2 rounded-theme shadow-lg hover:opacity-90 transition flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                  {uploading ? <span className="animate-spin">⏳</span> : <span>📤 {t.btnUpload}</span>}
                </label>
              </div>
            </div>
            <div className="pt-4 flex justify-center bg-background rounded-theme p-4 border border-text-main/10">
              <NutritionLabel data={formData} dict={dict} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:w-2/3 bg-card p-8 rounded-theme shadow-sm border border-text-main/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-text-main/10">
            <h2 className="text-2xl font-black text-text-main tracking-tight">{t.editorTitle}</h2>
            {formData.last_update && (
              <div className="flex items-center gap-3 bg-background px-4 py-2 rounded-theme border border-text-main/10">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-main/50 leading-none mb-1">{t.lastUpdatedLabel}</p>
                  <p className="text-xs font-mono text-text-main leading-none">
                    {new Date(formData.last_update).toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleUpdate} className="space-y-8">
            <section>
              <h3 className="text-lg font-bold mb-4 text-primary">1. {t.sectionBasic}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">{t.labelName}</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-background border border-text-main/20 text-text-main p-2 px-4 rounded-theme" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">{t.labelBrand}</label>
                  <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-background border border-text-main/20 text-text-main p-2 px-4 rounded-theme" />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-4 text-primary">2. {dict.nutrition.factsTitle}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: dict.home.portion || 'Portion', key: 'portion_size_value' },
                  { label: dict.home.unit, key: 'portion_unit' },
                  { label: dict.nutrition.calories, key: 'energy_kcal' },
                  { label: dict.nutrition.protein, key: 'protein_g' },
                  { label: dict.nutrition.carbs, key: 'carbs_total_g' },
                  { label: dict.nutrition.fat, key: 'fat_total_g' },
                  { label: dict.nutrition.sodium, key: 'sodium_mg' },
                  { label: dict.nutrition.fiber, key: 'fiber_g' },
                  { label: dict.nutrition.saturatedFat, key: 'saturated_fat_g' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-bold text-text-main/70">{field.label}</label>
                    <input 
                      type={field.key === 'portion_unit' ? 'text' : 'number'} 
                      step="0.1" 
                      value={formData[field.key as keyof FoodFormData] as any} 
                      onChange={e => setFormData({...formData, [field.key]: e.target.value})} 
                      className="w-full bg-background border border-text-main/20 text-text-main p-2 rounded-theme" 
                    />
                  </div>
                ))}
              </div>
            </section>

            <div className="flex gap-4 border-t border-text-main/10 pt-8">
              <button type="button" onClick={() => router.back()} className="px-6 py-3 border border-text-main/20 rounded-theme font-medium text-text-main hover:bg-text-main/5 transition">{t.btnCancel}</button>
              <button type="submit" className="flex-1 bg-primary text-white py-3 rounded-theme font-bold hover:opacity-90 shadow-md">{t.btnSave}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}