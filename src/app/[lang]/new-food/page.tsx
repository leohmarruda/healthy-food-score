'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';

import { getDictionary } from '@/lib/get-dictionary';
import { supabase } from '@/lib/supabase';
import { processImages } from '@/utils/api';

export default function NewFood() {
  // Hooks
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'pt';

  // State
  const [files, setFiles] = useState<{ [key: string]: File | null }>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [dict, setDict] = useState<any>(null);

  // Constants
  const SLOTS = [
    { id: 'front', label: dict?.pages?.addFood?.slotFront || 'Front of Pack', key: 'front_photo_url', required: true },
    { id: 'back', label: dict?.pages?.addFood?.slotBack || 'Back of Pack', key: 'back_photo_url', required: false },
    { id: 'nutrition', label: dict?.pages?.addFood?.slotNutrition || 'Nutrition Table', key: 'nutrition_label_url', required: true },
    { id: 'ingredients', label: dict?.pages?.addFood?.slotIngredients || 'Ingredients List', key: 'ingredients_photo_url', required: false },
  ];

  // Effects
  useEffect(() => {
    async function load() {
      const d = await getDictionary(lang as 'pt' | 'en');
      setDict(d);
    }
    load();
  }, [lang]);

  // Event handlers
  const handleFileChange = (slotId: string, file: File) => {
    setFiles(prev => ({ ...prev, [slotId]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(dict?.pages?.addFood?.statusUpload || 'Uploading images...');
    
    try {
      const urls: { [key: string]: string | null } = {};

      // Upload images to storage
      for (const slot of SLOTS) {
        const file = files[slot.id];
        if (!file) { urls[slot.key] = null; continue; }
  
        const fileName = `${Date.now()}-${slot.id}-${file.name.replace(/[^a-z0-9]/gi, '_')}`;
        const { data, error } = await supabase.storage.from('food-images').upload(fileName, file);
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage.from('food-images').getPublicUrl(data.path);
        urls[slot.key] = publicUrl;
      }

      // Process images with AI
      setStatus(dict?.pages?.addFood?.statusAI || 'AI is extracting data...');
      const aiData = await processImages(Object.values(urls).filter(Boolean) as string[], 'full-scan');

      // Extract nutrition data from nutrition_parsed object
      const nutritionParsed = aiData.nutrition_parsed || {};
      const metadata = nutritionParsed.metadata || {};

      // Save to database and get ID
      setStatus(dict?.pages?.addFood?.statusSave || 'Saving to database...');
      const { data: newFood, error: dbError } = await supabase
        .from('foods')
        .insert([{
          product_name: aiData.product_name || '',
          brand: aiData.brand || '',
          ingredients_raw: aiData.ingredients_raw || '',
          ingredients_list: aiData.ingredients_list || [],
          nutrition_raw: aiData.nutrition_raw || '',
          nutrition_parsed: nutritionParsed,
          // NOVA: aiData.NOVA ? parseInt(aiData.NOVA) : null, // TODO: Uncomment when NOVA column is added to database
          declared_special_nutrients: Array.isArray(aiData.declared_special_nutrients) ? aiData.declared_special_nutrients.join(', ') : (aiData.declared_special_nutrients || ''),
          declared_processes: Array.isArray(aiData.declared_processes) ? aiData.declared_processes.join(', ') : (aiData.declared_processes || ''),
          declared_warnings: Array.isArray(aiData.declared_warnings) ? aiData.declared_warnings.join(', ') : (aiData.declared_warnings || ''),
          certifications: Array.isArray(aiData.certifications) ? aiData.certifications.join(', ') : (aiData.certifications || ''),
          abv_percentage: nutritionParsed.abv_percentage ? parseFloat(nutritionParsed.abv_percentage) : null,
          fermentation_type: aiData.fermentation_type || null,
          serving_size_value: metadata.serving_size || 100,
          serving_size_unit: metadata.serving_size_unit || 'g',
          energy_kcal: nutritionParsed.energy_kcal ? parseFloat(nutritionParsed.energy_kcal) : 0,
          protein_g: nutritionParsed.proteins?.total_proteins_g ? parseFloat(nutritionParsed.proteins.total_proteins_g) : null,
          carbs_total_g: nutritionParsed.carbohydrates?.total_carbs_g ? parseFloat(nutritionParsed.carbohydrates.total_carbs_g) : null,
          fat_total_g: nutritionParsed.fats?.total_fats_g ? parseFloat(nutritionParsed.fats.total_fats_g) : null,
          sodium_mg: nutritionParsed.minerals_mg?.sodium_mg ? parseFloat(nutritionParsed.minerals_mg.sodium_mg) : null,
          fiber_g: nutritionParsed.fiber?.total_fiber_g ? parseFloat(nutritionParsed.fiber.total_fiber_g) : null,
          saturated_fat_g: nutritionParsed.fats?.saturated_fats_g ? parseFloat(nutritionParsed.fats.saturated_fats_g) : null,
          trans_fat_g: nutritionParsed.fats?.trans_fats_g ? parseFloat(nutritionParsed.fats.trans_fats_g) : null,
          front_photo_url: urls.front_photo_url, 
          back_photo_url: urls.back_photo_url,
          nutrition_label_url: urls.nutrition_label_url,
          ingredients_photo_url: urls.ingredients_photo_url,
        }])
        .select()
        .single();
      if (dbError) throw dbError;

      // Redirect to edit page for review
      if (newFood?.id) {
        router.push(`/${lang}/edit/${newFood.id}`);
        router.refresh();
      } else {
        router.push(`/${lang}/manage`);
      }

    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || dict?.pages?.addFood?.uploadError || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  if (!dict) return null;
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-main mb-2">{dict.pages?.addFood?.title}</h1>
        <p className="text-text-main/70">{dict.pages?.addFood?.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SLOTS.map((slot) => (
            <div key={slot.id} className={`border-2 border-dashed ${slot.required ? 'border-primary/40' : 'border-text-main/20'} rounded-theme p-4 flex flex-col items-center bg-card min-h-[220px]`}>
              <span className="text-sm font-semibold mb-3 text-text-main">
                {slot.label}
                {slot.required && <span className="text-red-500 ml-1">*</span>}
              </span>
              {files[slot.id] ? (
                <div className="relative w-full h-32 mb-3 group">
                  <img 
                    src={URL.createObjectURL(files[slot.id] as File)} 
                    className="w-full h-full object-cover rounded-theme border border-text-main/10"
                    alt={dict?.components?.forms?.imageGallery?.imageAltPreview || 'Image preview'}
                  />
                  <button 
                    onClick={() => setFiles(prev => ({ ...prev, [slot.id]: null }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-text-main/5 rounded-theme mb-3 border border-text-main/10">
                  <span className="text-text-main/40 text-xs">{dict.pages?.addFood?.noImage}</span>
                </div>
              )}
              <input 
              type="file" 
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileChange(slot.id, e.target.files[0])}
              className="text-xs text-text-main/70 file:mr-4 file:py-2 file:px-4 file:rounded-theme file:border-0 file:bg-primary/10 file:text-primary cursor-pointer"
            />
          </div>
        ))}
        </div>

        <button 
          type="submit"
          disabled={loading || !files.front || !files.nutrition}
          className="w-full bg-primary text-white py-4 rounded-theme font-bold hover:opacity-90 disabled:bg-text-main/20 disabled:text-text-main/50 disabled:cursor-not-allowed shadow-md transition relative flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="animate-spin">⏳</span>
          )}
          <span className={loading ? 'opacity-90' : ''}>
            {loading ? (status || dict.pages?.addFood?.btnProcessing) : dict.pages?.addFood?.btnSave}
          </span>
        </button>
      </form>
    </div>
  );
}