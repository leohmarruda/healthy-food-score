/**
 * Core Food interface matching the database schema
 */
export interface Food {
  id: string;
  product_name: string; // Changed from 'name' to match database
  brand?: string;
  category?: string;
  hfs_score?: any; // Health Food Score JSON: { v1: {...} } or { v2: {...} }
  data_source?: string; // Default: 'label'
  NOVA?: number; // NOVA classification (1-4)
  
  // Image URLs
  front_photo_url?: string;
  back_photo_url?: string;
  nutrition_label_url?: string;
  ingredients_photo_url?: string;
  
  // Nutrition values (per 100g)
  energy_kcal: number;
  protein_g: number;
  carbs_total_g?: number;
  fat_total_g?: number;
  sodium_mg?: number;
  fiber_g?: number;
  saturated_fat_g?: number;
  trans_fat_g?: number;
  
  // Portion information
  serving_size_value?: number; // Changed from portion_size_value
  serving_size_unit?: string; // Changed from portion_unit
  density?: number;
  
  // Raw data fields
  ingredients_raw?: string;
  ingredients_list?: string[]; // Array of parsed ingredients
  nutrition_raw?: string;
  nutrition_parsed?: Record<string, any>; // JSONB parsed nutrition data
  declared_percentages?: string[]; // Array of declared percentages (changed to string[])
  
  // Processing and special information
  declared_special_nutrients?: string;
  declared_processes?: string;
  declared_warnings?: string; // Added
  fermentation_type?: string;
  certifications?: string;
  abv_percentage?: number; // Alcohol by volume percentage
  
  // Additional metadata
  website?: string;
  price?: number;
  location?: string;
  
  // Timestamps
  created_at?: string;
  last_update?: string;
}

/**
 * Food form data for editing
 */
export interface FoodFormData extends Omit<Food, 'id' | 'created_at'> {
  [key: string]: any; // Allow additional fields
}

/**
 * Image tab configuration
 */
export interface ImageTab {
  id: 'front' | 'nutrition' | 'ingredients' | 'back';
  label: string;
  dbKey: keyof Food;
}






