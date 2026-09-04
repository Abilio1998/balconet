import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrate() {
  console.log('--- MIGRACIÓN DE CAPACIDAD POR ZONAS ---')
  
  const sql = `
    -- 1. Añadir zona a las reservas
    ALTER TABLE public.reservations 
    ADD COLUMN IF NOT EXISTS zone TEXT DEFAULT 'inside' 
    CHECK (zone IN ('inside', 'terrace'));

    -- 2. Desglosar aforo en configuración
    ALTER TABLE public.reservation_settings 
    ADD COLUMN IF NOT EXISTS max_capacity_inside INTEGER DEFAULT 20,
    ADD COLUMN IF NOT EXISTS max_capacity_terrace INTEGER DEFAULT 10;

    -- 3. Habilitar Realtime para reservas (si no lo está)
    -- Nota: Esto suele hacerse en el dashboard de Supabase, pero intentamos asegurar la publicación
    ALTER TABLE public.reservations REPLICA IDENTITY FULL;
  `
  
  console.log('Por favor, ejecuta este SQL en el Editor de Supabase:\n')
  console.log(sql)
  console.log('\n--- FIN ---')
}

migrate()
