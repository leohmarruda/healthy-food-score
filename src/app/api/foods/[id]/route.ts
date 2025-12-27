import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Define as a Promise
) {
    const resolvedParams = await params;
    const id = resolvedParams.id;

  const { error } = await supabase
    .from('foods')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}