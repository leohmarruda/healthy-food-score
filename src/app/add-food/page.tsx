'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { processImages } from '@/utils/api';
import type { Food } from '@/types/food';

const SLOTS = [
  { id: 'front', label: 'Front of Pack', key: 'front_photo_url' },
  { id: 'back', label: 'Back of Pack (optional)', key: 'back_photo_url' },
  { id: 'nutrition', label: 'Nutrition Table', key: 'nutrition_label_url' },
  { id: 'ingredients', label: 'Ingredients List (if table doesn\'t contain ingredients)', key: 'ingredients_photo_url' },
];

export default function AddFood() {
  const [files, setFiles] = useState<{ [key: string]: File | null }>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const router = useRouter();

  const handleFileChange = (slotId: string, file: File) => {
    setFiles(prev => ({ ...prev, [slotId]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('Uploading images...');
    
    try {
      const urls: { [key: string]: string | null } = {};
  
      // 1. UPLOAD TO STORAGE
      for (const slot of SLOTS) {
        const file = files[slot.id];
        if (!file) { urls[slot.key] = null; continue; }
  
        const fileName = `${Date.now()}-${slot.id}-${file.name.replace(/[^a-z0-9]/gi, '_')}`;
        const { data, error } = await supabase.storage.from('food-images').upload(fileName, file);
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage.from('food-images').getPublicUrl(data.path);
        urls[slot.key] = publicUrl;
      }
  
      // 2. UNIFIED AI PROCESSING
      setStatus('AI is extracting label data...');
      const aiData = await processImages(Object.values(urls).filter(Boolean) as string[], 'full-scan');

      // 3. SAVE TO DATABASE (Original Values)
      setStatus('Saving to database...');
      const { error: dbError } = await supabase.from('foods').insert([{
        name: aiData.product_name,
        brand: aiData.brand,
        ingredients_raw: aiData.ingredients_raw,
        nutrition_raw: aiData.nutrition_raw,
        declared_special_nutrients: aiData.declared_special_nutrients, // New field!
        portion_size_value: parseFloat(aiData.portion_size_value) || 100,
        portion_unit: aiData.portion_unit || 'g',
        
        // Store values exactly as they appear on the label
        energy_kcal: parseFloat(aiData.energy_kcal) || 0,
        protein_g: parseFloat(aiData.protein_g) || 0,
        carbs_total_g: parseFloat(aiData.carbs_total_g) || 0,
        fat_total_g: parseFloat(aiData.fat_total_g) || 0,
        sodium_mg: parseFloat(aiData.sodium_mg) || 0,
        
        // Photos mapping
        front_photo_url: urls.front_photo_url, 
        back_photo_url: urls.back_photo_url,
        nutrition_label_url: urls.nutrition_label_url,
        ingredients_photo_url: urls.ingredients_photo_url,
      }]);
  
      if (dbError) throw dbError;
      router.push('/manage');
      router.refresh();
    } catch (error: any) {
      console.error('Submission error:', error);
      alert(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-main mb-2">Add New Food</h1>
        <p className="text-text-main/70">Upload specific photos for higher AI accuracy.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SLOTS.map((slot) => (
          <div key={slot.id} className="border-2 border-dashed border-text-main/20 rounded-theme p-4 flex flex-col items-center bg-card min-h-[220px]">
            <span className="text-sm font-semibold mb-3 text-text-main">{slot.label}</span>
            
            {/* PREVIEW IMAGE BLOCK */}
            {files[slot.id] ? (
              <div className="relative w-full h-32 mb-3 group">
                <img 
                  src={URL.createObjectURL(files[slot.id] as File)} 
                  className="w-full h-full object-cover rounded-theme border border-text-main/10"
                  alt="Preview"
                />
                {/* Remove button to clear the slot */}
                <button 
                  onClick={() => setFiles(prev => ({ ...prev, [slot.id]: null }))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg opacity-0 group-hover:opacity-100 transition"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="w-full h-32 flex items-center justify-center bg-text-main/5 rounded-theme mb-3 border border-text-main/10">
                <span className="text-text-main/40 text-xs">No image selected</span>
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

        {status && (
          <div className="bg-primary/10 border border-primary/20 text-primary p-4 rounded-theme text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              <span className="font-medium">{status}</span>
            </div>
          </div>
        )}
        <button 
          type="submit"
          disabled={loading || !files.front || !files.nutrition}
          className="w-full bg-primary text-white py-4 rounded-theme font-bold hover:opacity-90 disabled:bg-text-main/20 disabled:text-text-main/50 disabled:cursor-not-allowed shadow-md transition"
        >
          {loading ? 'Processing...' : 'Process & Save Data'}
        </button>
      </form>
    </div>
  );
}