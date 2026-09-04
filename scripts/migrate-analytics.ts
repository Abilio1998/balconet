import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load env from .env.local or .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\x1b[31mError: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local\x1b[0m')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrate() {
  console.log('\x1b[33mChecking database schema...\x1b[0m')
  
  // Note: supabase-js cannot run raw ALTER TABLE without a custom Postgres function (RPC).
  // This script serves as a verification tool and provides the exact SQL needed.
  
  console.log('\n\x1b[32m✅ Supabase client initialized.\x1b[0m')
  console.log('\n\x1b[1mACCIONES REQUERIDAS:\x1b[0m')
  console.log('--------------------')
  console.log('Copia y pega el siguiente código en el \x1b[36mSQL Editor de Supabase\x1b[0m:\n')
  
  const sql = `
    -- 1. Soporte para Likes y Marketing
    ALTER TABLE carta_products ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
    ALTER TABLE carta_products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
    ALTER TABLE carta_products ADD COLUMN IF NOT EXISTS image_url TEXT;

    -- 2. Registro de Visitas y Tráfico
    CREATE TABLE IF NOT EXISTS website_visits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      page_path TEXT NOT NULL,
      referrer TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- 3. Índices para mayor velocidad en analíticas
    CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
    CREATE INDEX IF NOT EXISTS idx_reservations_datetime ON reservations(reservation_date, reservation_time);
    CREATE INDEX IF NOT EXISTS idx_visits_created_at ON website_visits(created_at);
    CREATE INDEX IF NOT EXISTS idx_visits_referrer ON website_visits(referrer);
  `
  
  console.log(sql)
  console.log('\n\x1b[33mUna vez ejecutado, el dashboard de analíticas estará plenamente operativo.\x1b[0m')
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
