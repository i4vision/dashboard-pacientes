import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['nombres', 'apellidos', 'genero', 'documento', 'telefono', 'cita', 'cita_tipo', 'entidad', 'clinica', 'especialista', 'fecha'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    if (!['Femenino', 'Masculino'].includes(body.genero)) {
       return NextResponse.json({ error: 'invalid genero enum' }, { status: 400 });
    }
    if (!['Especialista', 'Estudio Clinico'].includes(body.cita_tipo)) {
       return NextResponse.json({ error: 'invalid cita_tipo enum' }, { status: 400 });
    }
    if (!['Farallones', 'Palma Real'].includes(body.clinica)) {
       return NextResponse.json({ error: 'invalid clinica enum' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('patients')
      .insert([
        {
          nombres: body.nombres,
          apellidos: body.apellidos,
          genero: body.genero,
          documento: Number(body.documento),
          telefono: Number(body.telefono),
          cita: body.cita,
          cita_tipo: body.cita_tipo,
          entidad: body.entidad,
          clinica: body.clinica,
          especialista: body.especialista,
          fecha: body.fecha
        }
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
