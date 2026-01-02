import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PATCH - Update additive
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const resolvedParams = await params;
    const name = decodeURIComponent(resolvedParams.name);
    const body = await req.json();
    const { category, weight, regex } = body;

    if (!category || weight === undefined || !regex) {
      return NextResponse.json(
        { error: 'Missing required fields: category, weight, regex' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('additive_rules')
      .update({
        category,
        weight,
        regex,
      })
      .eq('name', name)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete additive
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const resolvedParams = await params;
    const name = decodeURIComponent(resolvedParams.name);

    const { error } = await supabase
      .from('additive_rules')
      .delete()
      .eq('name', name);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

