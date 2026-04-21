import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function DELETE(request, { params }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Missing patient ID' }, { status: 400 });
  }

  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Patient deleted successfully' });
}
