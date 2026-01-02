import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all additives
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('additive_rules')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new additive
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, weight, regex } = body;

    if (!name || !category || weight === undefined || !regex) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, weight, regex' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('additive_rules')
      .insert({
        name,
        category,
        weight,
        regex,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

