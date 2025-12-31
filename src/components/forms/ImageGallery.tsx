import { useState, useRef } from 'react';
import { toast } from 'sonner';

import NutritionLabel from '@/components/NutritionLabel';
import { supabase } from '@/lib/supabase';
import { processImages } from '@/utils/api';
import type { FoodFormData } from '@/types/food';

interface ImageGalleryProps {
  images: Record<string, string>;
  formData: FoodFormData;
  dict: any;
  lang: string;
  foodId: string;
  onImageUpdate: (tab: string, url: string) => void;
  onFormDataUpdate: (data: Partial<FoodFormData>) => void;
  lockedFields?: (field: string) => boolean;
}

// Constants
const TAB_CONFIG = [
  { id: 'front', dbKey: 'front_photo_url' },
  { id: 'back', dbKey: 'back_photo_url' },
  { id: 'nutrition', dbKey: 'nutrition_label_url' },
  { id: 'ingredients', dbKey: 'ingredients_photo_url' }
];

export default function ImageGallery({
  images,
  formData,
  dict,
  lang,
  foodId,
  onImageUpdate,
  onFormDataUpdate,
  lockedFields
}: ImageGalleryProps) {
  // State
  const [activeTab, setActiveTab] = useState('front');
  const [uploading, setUploading] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Event handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !dict) return;
    
    setUploading(true);
    try {
      const fileName = `${Date.now()}-${activeTab}-${file.name.replace(/[^a-z0-9]/gi, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('food-images')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('food-images')
        .getPublicUrl(uploadData.path);
      
      const dbKey = TAB_CONFIG.find(t => t.id === activeTab)?.dbKey;
      if (dbKey) {
        await supabase.from('foods').update({ [dbKey]: publicUrl }).eq('id', foodId);
        onImageUpdate(activeTab, publicUrl);
      }
      
      toast.success(dict.edit.uploadSuccess);
    } catch (error: any) {
      toast.error(dict.edit.uploadError);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRescan = async () => {
    // Collect all available images
    const allImages = TAB_CONFIG
      .map(tab => images[tab.id])
      .filter(Boolean) as string[];
    
    if (allImages.length === 0) {
      toast.error(dict?.edit?.noPhoto || 'No images available to rescan');
      return;
    }

    setIsRescanning(true);
    try {
      // Process all images
      const data = await processImages(allImages, 'rescan');
      
      // Filter out locked fields from update
      const updateData: Partial<FoodFormData> = {};
      const fieldsToUpdate: (keyof FoodFormData)[] = [
        'name', 'brand', 'portion_size_value', 'portion_unit',
        'ingredients_raw', 'ingredients_list', 'nutrition_raw',
        'declared_special_nutrients', 'declared_processes', 'certifications',
        'abv_percentage', 'energy_kcal', 'protein_g', 'carbs_total_g',
        'fat_total_g', 'sodium_mg', 'fiber_g', 'saturated_fat_g', 'trans_fat_g'
      ];
      
      fieldsToUpdate.forEach(field => {
        const fieldKey = String(field);
        if (!lockedFields || !lockedFields(fieldKey)) {
          if (data[field] !== undefined) {
            updateData[field] = data[field] as any;
          }
        } else {
          // Keep existing value for locked fields
          updateData[field] = formData[field] as any;
        }
      });
      
      // Always preserve existing values for locked fields
      if (lockedFields) {
        if (lockedFields('ingredients_raw')) updateData.ingredients_raw = formData.ingredients_raw || '';
        if (lockedFields('nutrition_raw')) updateData.nutrition_raw = formData.nutrition_raw || '';
        if (lockedFields('declared_special_nutrients')) updateData.declared_special_nutrients = formData.declared_special_nutrients || '';
      }
      
      onFormDataUpdate(updateData);
      toast.success(dict?.edit?.rescanSuccess || 'All images rescanned successfully');
    } catch (err) {
      console.error(err);
      toast.error(dict?.edit?.rescanError || 'Failed to rescan images');
    } finally {
      setIsRescanning(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 50, y: 50 });
  };

  return (
    <div className="lg:w-1/3 space-y-6">
      <h2 className="text-xl font-bold border-b border-text-main/10 pb-2 text-text-main flex justify-between items-center">
        {dict.edit.imageTitle}
        <button
          onClick={handleRescan}
          disabled={isRescanning}
          className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-theme border border-primary/20 hover:bg-primary/20 disabled:opacity-50 transition"
        >
          {isRescanning ? dict.edit.scanning : `↺ ${dict.edit.btnReprocess}`}
        </button>
      </h2>
      <div className="flex bg-text-main/5 p-1 rounded-theme gap-1">
        {TAB_CONFIG.map((tab) => {
          const hasImage = !!images[tab.id];
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 text-[10px] uppercase font-bold py-2 rounded-theme transition ${
                isActive
                  ? 'bg-card shadow-sm'
                  : ''
              } ${
                hasImage
                  ? isActive
                    ? 'text-primary'
                    : 'text-primary hover:text-primary/80'
                  : isActive
                    ? 'text-text-main/60'
                    : 'text-text-main/60 hover:text-text-main/80'
              }`}
            >
              {dict?.addFood?.[`slot${tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}`] || tab.id}
            </button>
          );
        })}
      </div>
      <div className="space-y-4">
        <div 
          ref={imageContainerRef}
          className="relative group min-h-[300px] flex items-center justify-center bg-black rounded-lg overflow-hidden cursor-zoom-in"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {images[activeTab] ? (
            <img
              src={images[activeTab]}
              className="w-full object-contain max-h-[500px] transition-transform duration-100 ease-out group-hover:scale-150 group-hover:z-10"
              style={{
                transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                transform: 'scale(1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.5)';
              }}
              onMouseMove={(e) => {
                if (!imageContainerRef.current) return;
                const rect = imageContainerRef.current.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                e.currentTarget.style.transformOrigin = `${x}% ${y}%`;
                e.currentTarget.style.transform = 'scale(1.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.transformOrigin = '50% 50%';
              }}
              alt={dict?.edit?.imageAltReference || 'Product image reference'}
            />
          ) : (
            <div className="text-text-main/40 text-sm italic">
              {dict.edit.noPhoto} {activeTab}
            </div>
          )}
          <div className="absolute bottom-2 right-2 z-50">
            <label className="cursor-pointer bg-primary text-white px-3 py-1.5 rounded-theme shadow-lg hover:opacity-90 transition flex items-center gap-1.5 text-xs">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
              {uploading ? (
                <span className="animate-spin text-xs">⏳</span>
              ) : (
                <span className="text-xs">📤 {dict.edit.btnUpload}</span>
              )}
            </label>
          </div>
        </div>
        <div className="pt-4 flex justify-center bg-background rounded-theme p-4 border border-text-main/10">
          <NutritionLabel data={formData} dict={dict} />
        </div>
      </div>
    </div>
  );
}

