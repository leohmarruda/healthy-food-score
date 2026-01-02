import { useState, useCallback } from 'react';

import { cleanFoodData, extractImageUrls, isFormDirty } from '@/utils/form-helpers';
import type { FoodFormData } from '@/types/food';

// Constants
const initialState: FoodFormData = {
  product_name: '',
  brand: '',
  category: '',
  hfs_score: null,
  energy_kcal: 0,
  protein_g: 0,
  carbs_total_g: 0,
  fat_total_g: 0,
  sodium_mg: 0,
  fiber_g: 0,
  saturated_fat_g: 0,
  trans_fat_g: 0,
  serving_size_value: 0,
  serving_size_unit: 'g',
  ingredients_list: [],
  ingredients_raw: '',
  nutrition_raw: '',
  declared_special_nutrients: '',
  declared_processes: '',
  location: '',
  price: undefined,
  abv_percentage: undefined,
  certifications: '',
  hfs_version: 'v2',
  NOVA: undefined,
  last_update: ''
};

export function useFoodForm() {
  // State
  const [formData, setFormData] = useState<FoodFormData>(initialState);
  const [originalData, setOriginalData] = useState<FoodFormData>(initialState);
  const [images, setImages] = useState<Record<string, string>>({});

  // Derived values
  const dirty = isFormDirty(formData, originalData);

  // Callbacks
  const initializeForm = useCallback((data: any) => {
    const cleanData = cleanFoodData(data);
    setFormData(cleanData);
    setOriginalData(cleanData);
    setImages(extractImageUrls(data));
  }, []);

  const updateField = useCallback((field: keyof FoodFormData, value: string | string[] | any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateFormData = useCallback((data: Partial<FoodFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const updateImage = useCallback((tab: string, url: string) => {
    setImages(prev => ({ ...prev, [tab]: url }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(originalData);
  }, [originalData]);

  return {
    formData,
    originalData,
    images,
    dirty,
    initializeForm,
    updateField,
    updateFormData,
    updateImage,
    resetForm,
    setFormData,
    setOriginalData
  };
}

