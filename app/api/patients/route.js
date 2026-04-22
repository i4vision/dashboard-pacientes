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
    const requiredFields = ['nombres', 'apellidos', 'genero', 'documento', 'telefono', 'especialidad', 'especialidad_tipo', 'plan_medico', 'clinica', 'especialista', 'fecha'];
    for (const field of requiredFields) {
      if (!body[field]) {
        console.error(`Patient Upload Rejected: Missing required field: ${field}`);
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Auto-capitalize enums so 'femenino' or 'PALMA REAL' resolves cleanly
    const capitalizeEnum = (str) => {
      if (!str) return str;
      return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    body.genero = capitalizeEnum(body.genero);
    body.especialidad_tipo = capitalizeEnum(body.especialidad_tipo);
    body.clinica = capitalizeEnum(body.clinica);

    if (!['Femenino', 'Masculino'].includes(body.genero)) {
       console.error(`Patient Upload Rejected: Invalid genero enum - ${body.genero}`);
       return NextResponse.json({ error: 'invalid genero enum' }, { status: 400 });
    }
    if (!['Especialista', 'Estudio Clinico'].includes(body.especialidad_tipo)) {
       console.error(`Patient Upload Rejected: Invalid especialidad_tipo enum - ${body.especialidad_tipo}`);
       return NextResponse.json({ error: 'invalid especialidad_tipo enum' }, { status: 400 });
    }
    if (!['Farallones', 'Palma Real'].includes(body.clinica)) {
       console.error(`Patient Upload Rejected: Invalid clinica enum - ${body.clinica}`);
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
          especialidad: body.especialidad,
          cita_tipo: body.especialidad_tipo,
          entidad: body.plan_medico,
          clinica: body.clinica,
          especialista: body.especialista,
          fecha: body.fecha,
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
