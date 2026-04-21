-- Create patients table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    genero TEXT NOT NULL CHECK (genero IN ('Femenino', 'Masculino')),
    documento BIGINT NOT NULL,
    telefono BIGINT NOT NULL,
    cita TEXT NOT NULL,
    cita_tipo TEXT NOT NULL CHECK (cita_tipo IN ('Especialista', 'Estudio Clinico')),
    entidad TEXT NOT NULL,
    clinica TEXT NOT NULL CHECK (clinica IN ('Farallones', 'Palma Real')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: RLS (Row Level Security) could be enabled here if you need strict access controls,
-- but typically for an internal service container, table read/write policies are granted.
-- Example of opening the table for anon/service access if required:
-- ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable all for authenticated/anon" ON public.patients FOR ALL USING (true);
