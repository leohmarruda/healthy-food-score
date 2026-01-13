import type { FoodFormData } from '@/types/food';

/**
 * Preserve optional numeric fields (null/undefined handling)
 */
export function preserveOptionalFields(
  sanitized: Record<string, any>,
  formData: FoodFormData,
  optionalFields: (keyof FoodFormData)[]
): Record<string, any> {
  const result = { ...sanitized };
  
  optionalFields.forEach(field => {
    if (formData[field] === null || formData[field] === undefined) {
      result[field] = formData[field];
    } else if (formData[field] !== 0) {
      result[field] = Number(formData[field]);
    }
  });
  
  return result;
}




