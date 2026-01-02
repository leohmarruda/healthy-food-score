/**
 * Utility functions for converting between serving size and 100g standard
 */

export interface ConversionParams {
  servingSize?: number;
  servingUnit?: string;
  density?: number;
}

/**
 * Calculate conversion factor from serving size to 100g
 * Handles ml -> g conversion using density
 */
export function getConversionFactor(params: ConversionParams): number {
  const { servingSize = 100, servingUnit = 'g', density = 1 } = params;
  
  // If unit is ml, convert ml to g using density
  let servingSizeInGrams = servingSize;
  if (servingUnit.toLowerCase() === 'ml' && density > 0) {
    servingSizeInGrams = servingSize * density;
  }
  
  // Convert from serving to 100g
  if (servingSizeInGrams > 0) {
    return 100 / servingSizeInGrams;
  }
  return 1;
}

/**
 * Convert value from serving size to 100g
 */
export function convertTo100g(value: number | undefined | null, params: ConversionParams): number | undefined {
  if (value === undefined || value === null) return undefined;
  const factor = getConversionFactor(params);
  const converted = value * factor;
  return Math.round(converted * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert value from 100g back to serving size
 */
export function convertFrom100g(value: number | undefined | null, params: ConversionParams): number | undefined {
  if (value === undefined || value === null) return undefined;
  const factor = getConversionFactor(params);
  const converted = value / factor;
  return Math.round(converted * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert multiple nutrient fields from serving to 100g
 */
export function convertNutrientsTo100g(
  nutrients: Record<string, number | undefined | null>,
  fields: string[],
  params: ConversionParams
): Record<string, number> {
  const converted: Record<string, number> = {};
  const factor = getConversionFactor(params);
  
  fields.forEach(field => {
    const value = nutrients[field];
    if (value !== undefined && value !== null) {
      const convertedValue = value * factor;
      converted[field] = Math.round(convertedValue * 100) / 100; // Round to 2 decimal places
    } else {
      converted[field] = 0;
    }
  });
  
  return converted;
}

/**
 * Convert multiple nutrient fields from 100g back to serving
 */
export function convertNutrientsFrom100g(
  nutrients: Record<string, number | undefined | null>,
  fields: string[],
  params: ConversionParams
): Record<string, number> {
  const converted: Record<string, number> = {};
  const factor = getConversionFactor(params);
  
  fields.forEach(field => {
    const value = nutrients[field];
    if (value !== undefined && value !== null) {
      const convertedValue = value / factor;
      converted[field] = Math.round(convertedValue * 100) / 100; // Round to 2 decimal places
    } else {
      converted[field] = 0;
    }
  });
  
  return converted;
}

