import type { Food, FoodFormData } from '@/types/food';

/**
 * Cleans and normalizes food data from database
 */
export function cleanFoodData(data: any): FoodFormData {
  // Fields that should remain as null/undefined when null (numeric optional fields)
  const optionalNumericFields = ['abv_percentage', 'density', 'net_content_g_ml'];
  
  return Object.keys(data).reduce((acc: any, key) => {
    if (key === 'ingredients_list') {
      acc[key] = data[key] || [];
    } else if (key === 'density') {
      // Default density to 1.0 if null or undefined
      acc[key] = data[key] ?? 1.0;
    } else if (key === 'price') {
      // Keep price as-is (no default value)
      acc[key] = data[key] ?? undefined;
    } else if (optionalNumericFields.includes(key)) {
      // Keep null/undefined for other optional numeric fields
      acc[key] = data[key] ?? undefined;
    } else if (key === 'hfs_score') {
      // Keep hfs_score as-is (JSON object)
      acc[key] = data[key] || null;
    } else if (key === 'location') {
      // Default location to "Brasil" if empty or null
      acc[key] = data[key] && data[key].trim() ? data[key] : 'Brasil';
    } else if (key === 'brand') {
      // Default brand to "(sem marca)" if empty or null
      acc[key] = data[key] && data[key].trim() ? data[key] : '(sem marca)';
    } else {
      acc[key] = data[key] === null ? "" : data[key];
    }
    return acc;
  }, {}) as FoodFormData;
}

/**
 * Extracts image URLs from food data
 */
export function extractImageUrls(data: Food): Record<string, string> {
  return {
    front: data.front_photo_url || '',
    nutrition: data.nutrition_label_url || '',
    ingredients: data.ingredients_photo_url || '',
    back: data.back_photo_url || ''
  };
}

/**
 * Validates required form fields
 */
export function validateFormData(data: FoodFormData): { valid: boolean; error?: string } {
  if (!data.product_name || !data.product_name.trim()) {
    return { valid: false, error: 'Product name is required.' };
  }
  return { valid: true };
}

/**
 * Sanitizes numeric fields in form data
 * Returns all fields from data, with numeric fields sanitized
 */
export function sanitizeNumericFields(
  data: FoodFormData,
  fields: (keyof FoodFormData)[]
): Record<string, any> {
  // Start with all fields from data
  const sanitized = { ...data } as Record<string, any>;
  
  // Only sanitize the specified numeric fields
  fields.forEach(field => {
    const value = sanitized[field];
    sanitized[field] = (value === "" || value === null || value === undefined) ? 0 : Number(value);
  });
  
  return sanitized;
}

/**
 * Checks if form data has been modified
 */
export function isFormDirty(
  current: FoodFormData,
  original: FoodFormData,
  ignoredFields: string[] = ['last_update', 'created_at', 'id']
): boolean {
  return Object.keys(current).some(key => {
    if (ignoredFields.includes(key)) return false;
    
    const currentValue = JSON.stringify(current[key as keyof FoodFormData]);
    const originalValue = JSON.stringify(original[key as keyof FoodFormData]);
    
    return currentValue !== originalValue;
  });
}

/**
 * Extracts HFS score from hfs_score JSON
 * Always returns the highest version available (v2 > v1)
 */
export function extractHFSScore(hfsScore: any): { score: number; version: string } {
  if (!hfsScore || typeof hfsScore !== 'object') {
    return { score: -1, version: 'v2' };
  }
  
  // Check v2 first (highest version)
  if (hfsScore.v2) {
    // For v2, use hfs_score from the JSON (mock value 0)
    const score = hfsScore.v2.hfs_score !== undefined ? hfsScore.v2.hfs_score : 0;
    // Use HFS_version if available, otherwise default to 'v2'
    const version = hfsScore.v2.HFS_version || 'v2';
    return { score, version };
  }
  
  // Fallback to v1 if v2 doesn't exist
  if (hfsScore.v1?.HFS !== undefined) {
    const score = hfsScore.v1.HFS;
    // Use HFS_version if available, otherwise default to 'v1'
    const version = hfsScore.v1.HFS_version || 'v1';
    return { score, version };
  }
  if (hfsScore.v1?.HFSv1 !== undefined) {
    const score = hfsScore.v1.HFSv1;
    // Use HFS_version if available, otherwise default to 'v1'
    const version = hfsScore.v1.HFS_version || 'v1';
    return { score, version };
  }
  
  return { score: -1, version: 'v2' };
}

/**
 * Formats HFS score for display
 */
export function formatHFSScore(hfsScore: any, isDirty: boolean): string {
  // Always show the score, even when form is dirty
  if (!hfsScore || typeof hfsScore !== 'object') {
    return '—';
  }
  
  // Format the entire JSON object for display
  try {
    return JSON.stringify(hfsScore, null, 2);
  } catch (e) {
    return '—';
  }
}

