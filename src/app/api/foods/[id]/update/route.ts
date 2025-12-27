import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Define as a Promise
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await req.json();

    const { error } = await supabase
      .from('foods')
      .update({
        name: body.name,
        calories: body.calories,
        protein: body.protein,
        health_score: body.health_score,
        ingredients: body.ingredients // Assuming this is a comma-separated string or array
      })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}