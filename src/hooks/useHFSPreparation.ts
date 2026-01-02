import { useState, useCallback } from 'react';
import { prepareInitialScores } from '@/utils/hfs';
import type { FoodFormData } from '@/types/food';

interface HFSPreparationResult {
  scores?: any;
  servingSize?: number;
  servingUnit?: string;
  density?: number;
}

/**
 * Hook to prepare HFS data for input modal
 */
export function useHFSPreparation() {
  const [preparationData, setPreparationData] = useState<HFSPreparationResult>({});

  const prepareForV1 = useCallback(async (formData: FoodFormData) => {
    const initialData = await prepareInitialScores(formData, 'v1');
    setPreparationData({
      scores: initialData.scores || {},
      servingSize: initialData.servingSize,
      servingUnit: initialData.servingUnit,
      density: initialData.density,
    });
    return initialData;
  }, []);

  const prepareForV2 = useCallback((formData: FoodFormData): HFSPreparationResult => {
    setPreparationData({
      scores: undefined,
      servingSize: formData.serving_size_value,
      servingUnit: formData.serving_size_unit,
      density: formData.density,
    });
    return {
      scores: undefined,
      servingSize: formData.serving_size_value,
      servingUnit: formData.serving_size_unit,
      density: formData.density,
    };
  }, []);

  const prepare = useCallback(async (formData: FoodFormData, version: string): Promise<HFSPreparationResult> => {
    if (version === 'v1') {
      return await prepareForV1(formData);
    } else {
      return prepareForV2(formData);
    }
  }, [prepareForV1, prepareForV2]);

  return {
    preparationData,
    prepare,
    prepareForV1,
    prepareForV2,
  };
}

