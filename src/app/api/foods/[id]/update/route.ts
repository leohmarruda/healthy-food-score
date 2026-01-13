import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await req.json();

    const { error } = await supabase
      .from('foods')
      .update({
        product_name: body.product_name,
        brand: body.brand,
        category: body.category,
        hfs_score: body.hfs_score,
        energy_kcal: body.energy_kcal,
        protein_g: body.protein_g,
        carbs_total_g: body.carbs_total_g,
        fat_total_g: body.fat_total_g,
        sodium_mg: body.sodium_mg,
        fiber_g: body.fiber_g,
        saturated_fat_g: body.saturated_fat_g,
        trans_fat_g: body.trans_fat_g,
        sugars_total_g: body.sugars_total_g,
        sugars_added_g: body.sugars_added_g,
        serving_size_value: body.serving_size_value,
        serving_size_unit: body.serving_size_unit,
        ingredients_list: body.ingredients_list, 
        ingredients_raw: body.ingredients_raw, 
        nutrition_raw: body.nutrition_raw, 
        declared_special_nutrients: body.declared_special_nutrients, 
        declared_processes: body.declared_processes,
        declared_warnings: body.declared_warnings,
        location: body.location,
        price: body.price,
        abv_percentage: body.abv_percentage,
        density: body.density,
        net_content_g_ml: body.net_content_g_ml,
        certifications: body.certifications,
        NOVA: body.NOVA,
        nutrition_parsed: body.nutrition_parsed,
        last_update: body.last_update        
      })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}