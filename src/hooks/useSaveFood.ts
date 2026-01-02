import { useState } from 'react';
import { toast } from 'sonner';

import { validateFormData, sanitizeNumericFields } from '@/utils/form-helpers';
import { checkHFSInput } from '@/utils/hfs';
import { preserveOtherVersions, extractNumericScore } from '@/utils/hfs-helpers';
import { preserveOptionalFields } from '@/utils/sanitization';
import type { FoodFormData } from '@/types/food';

// Constants
const NUMERIC_FIELDS: (keyof FoodFormData)[] = [
  'energy_kcal',
  'protein_g',
  'carbs_total_g',
  'fat_total_g',
  'sodium_mg',
  'fiber_g',
  'saturated_fat_g',
  'trans_fat_g',
  'serving_size_value',
  'price',
  'abv_percentage',
  'density'
];

export function useSaveFood(foodId: string, dict: any, onSuccess?: () => void) {
  // State
  const [isSaving, setIsSaving] = useState(false);

  // Functions
  const saveFood = async (formData: FoodFormData, hfsv1Score?: number, hfsVersion?: string) => {
    const validation = validateFormData(formData);
    if (!validation.valid) {
      toast.error(dict?.pages?.edit?.requiredFieldsError || 'Name and Brand are required.');
      return;
    }

    const saveAction = async () => {
      setIsSaving(true);

      // Clean ingredients list
      const cleanIngredientsList = Array.isArray(formData.ingredients_list)
        ? formData.ingredients_list.map(i => i.trim()).filter(Boolean)
        : [];

      // Calculate HFS score
      const version = hfsVersion || (formData.hfs_score?.v1 ? 'v1' : 
                        formData.hfs_score?.v2 ? 'v2' : 'v2');
      
      // Preserve other versions when calculating
      let hfsScoreJson = preserveOtherVersions(formData.hfs_score, version);
      
      // Note: HFS input validation is now done in handleHFSInputConfirm using modal data
      // This check is kept for backward compatibility but warnings are shown in the modal flow

      // Try to calculate HFS score - ONLY the selected version
      try {
        if (version === 'v1') {
          // For v1, calculate scores and update/add v1 in the JSON
          if (hfsv1Score !== undefined && hfsv1Score !== null) {
            const { calculateHFSScores } = await import('@/utils/hfs-calculations');
            const calculatedScores = calculateHFSScores({
              s1a: formData.s1a || 0,
              s1b: formData.s1b || 0,
              s2: formData.s2 || 0,
              s3a: formData.s3a || 0,
              s3b: formData.s3b || 0,
              s4: formData.s4 || 0,
              s5: formData.s5 || 0,
              s6: formData.s6 || 0,
              s7: formData.s7 || 0,
              s8: formData.s8 || 0,
            });
            // Update/add v1, preserving v2 if it exists
            hfsScoreJson = {
              ...hfsScoreJson,
              v1: {
                HFSv1: hfsv1Score,
                ...calculatedScores
              }
            };
          }
        } else if (version === 'v2') {
          // For v2, calculate and update/add v2 in the JSON
          const { calculateHFSV2Scores } = await import('@/utils/hfs-calculations');
          const v2Scores = await calculateHFSV2Scores({
            fiber_g: formData.fiber_g || 0,
            protein_g: formData.protein_g || 0,
            carbs_total_g: formData.carbs_total_g || 0,
            energy_kcal: formData.energy_kcal || 0,
            fat_total_g: formData.fat_total_g || 0,
            abv_percentage: formData.abv_percentage || 0,
            sugars_added_g: formData.sugars_added_g || 0,
            trans_fat_g: formData.trans_fat_g || 0,
            sodium_mg: formData.sodium_mg || 0,
            ingredients_list: formData.ingredients_list || [],
          });
          // Update/add v2, preserving v1 if it exists
          hfsScoreJson = {
            ...hfsScoreJson,
            v2: {
              hfs_score: 0,
              ...v2Scores
            }
          };
        }
      } catch (calcError: any) {
        const errorMessage = calcError?.message || 
          dict?.hfs?.calculationError ||
          dict?.pages?.edit?.hfsCalculationError ||
          "Error calculating Nutritional Score. Please check the entered values.";
        toast.error(errorMessage);
        // Don't throw - allow save to proceed with null hfs_score
        console.error('HFS calculation error:', calcError);
      }

      // Sanitize numeric fields
      const sanitizedPayload = sanitizeNumericFields(formData, NUMERIC_FIELDS);
      
      // Preserve optional fields
      const optionalFields: (keyof FoodFormData)[] = ['density', 'price', 'abv_percentage'];
      const finalPayload = preserveOptionalFields(sanitizedPayload, formData, optionalFields);
      
      // Extract numeric score
      const hfsNumericScore = extractNumericScore(hfsScoreJson);
      
      // Build complete payload
      const payload = {
        product_name: finalPayload.product_name || '',
        brand: finalPayload.brand || '',
        category: finalPayload.category || '',
        hfs_score: hfsScoreJson,
        energy_kcal: finalPayload.energy_kcal ?? 0,
        protein_g: finalPayload.protein_g ?? 0,
        carbs_total_g: finalPayload.carbs_total_g ?? 0,
        fat_total_g: finalPayload.fat_total_g ?? 0,
        sodium_mg: finalPayload.sodium_mg ?? 0,
        fiber_g: finalPayload.fiber_g ?? 0,
        saturated_fat_g: finalPayload.saturated_fat_g ?? 0,
        trans_fat_g: finalPayload.trans_fat_g ?? 0,
        serving_size_value: finalPayload.serving_size_value ?? 0,
        serving_size_unit: finalPayload.serving_size_unit || '',
        ingredients_list: cleanIngredientsList,
        ingredients_raw: finalPayload.ingredients_raw || '',
        nutrition_raw: finalPayload.nutrition_raw || '',
        declared_special_nutrients: finalPayload.declared_special_nutrients || '',
        declared_processes: finalPayload.declared_processes || '',
        declared_warnings: finalPayload.declared_warnings || '',
        location: finalPayload.location && finalPayload.location.trim() ? finalPayload.location : 'Brasil',
        price: finalPayload.price ?? null,
        abv_percentage: finalPayload.abv_percentage ?? null,
        density: finalPayload.density ?? null,
        certifications: finalPayload.certifications || '',
        NOVA: formData.NOVA ?? null,
        nutrition_parsed: finalPayload.nutrition_parsed || null,
        last_update: new Date().toISOString()
      };

      // Save to API
      const res = await fetch(`/api/foods/${foodId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(dict?.pages?.edit?.saveError || 'Error communicating with server');
      }

      setIsSaving(false);
      if (onSuccess) onSuccess();
      
      return { 
        score: hfsNumericScore, 
        scores: hfsScoreJson,
        servingSize: finalPayload.serving_size_value,
        servingUnit: finalPayload.serving_size_unit,
        density: finalPayload.density
      };
    };

    let resultPromise: Promise<{ score: number; scores: any; servingSize?: number; servingUnit?: string; density?: number }>;
    
    toast.promise(
      (resultPromise = saveAction()),
      {
        loading: dict?.pages?.edit?.saving || 'Calculating score and saving...',
        success: (result) => {
          let scoreMsg = '';
          if (result.score >= 0) {
            scoreMsg = ` (Score: ${result.score})`;
          } else if (result.scores?.v2) {
            scoreMsg = ' (HFS v2 calculated)';
          }
          return `${dict?.pages?.edit?.saveSuccess || 'Updated successfully!'}${scoreMsg}`;
        },
        error: (err) => {
          setIsSaving(false);
          return err.message;
        }
      }
    );
    
    return resultPromise;
  };

  return { saveFood, isSaving };
}

