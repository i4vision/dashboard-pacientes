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
    
    // Skipping required fields constraint to allow highly permissive uploading behavior

    // Auto-capitalize enums so 'femenino' or 'PALMA REAL' resolves cleanly
    const capitalizeEnum = (str) => {
      if (!str) return str;
      return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    body.genero = capitalizeEnum(body.genero);
    body.especialidad_tipo = capitalizeEnum(body.especialidad_tipo);
    body.clinica = capitalizeEnum(body.clinica);

    if (body.genero && !['Femenino', 'Masculino'].includes(body.genero)) {
       console.error(`Patient Upload Rejected: Invalid genero enum - ${body.genero}`);
       return NextResponse.json({ error: 'invalid genero enum' }, { status: 400 });
    }
    if (body.especialidad_tipo && !['Especialista', 'Estudio Clinico'].includes(body.especialidad_tipo)) {
       console.error(`Patient Upload Rejected: Invalid especialidad_tipo enum - ${body.especialidad_tipo}`);
       return NextResponse.json({ error: 'invalid especialidad_tipo enum' }, { status: 400 });
    }
    if (body.clinica && !['Farallones', 'Palma Real'].includes(body.clinica)) {
       console.error(`Patient Upload Rejected: Invalid clinica enum - ${body.clinica}`);
       return NextResponse.json({ error: 'invalid clinica enum' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('patients')
      .insert([
        {
          nombres: body.nombres || null,
          apellidos: body.apellidos || null,
          genero: body.genero || null,
          documento: body.documento ? Number(body.documento) : null,
          telefono: body.telefono ? Number(body.telefono) : null,
          especialidad: body.especialidad || null,
          cita_tipo: body.especialidad_tipo || null,
          entidad: body.plan_medico || null,
          clinica: body.clinica || null,
          especialista: body.especialista || null,
          fecha: body.fecha || null,
          vapi_call_id: body.vapi_call_id || null
        }
      ])
      .select();

    if (error) {
      console.error("Patient Upload Rejected: Database Insert Failed -", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Patient Upload Rejected: Invalid Request Body -", error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
