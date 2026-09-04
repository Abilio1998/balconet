
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Explicitly load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in environment.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
  const date = '2026-03-26'
  console.log(`--- Diagnostic for ${date} ---`)

  // 1. Check Settings
  const { data: settings, error: sErr } = await supabase.from('reservation_settings').select('*').single()
  if (sErr) console.error("Settings Error:", sErr)
  console.log('Current Settings:', {
    max_inside: settings?.max_capacity_inside,
    max_terrace: settings?.max_capacity_terrace,
    max_per_slot: settings?.max_capacity_per_slot,
    interval: settings?.slot_interval_minutes
  })

  // 2. Check Reservations
  const { data: reservations, error: rErr } = await supabase
    .from('reservations')
    .select('id, client_name, reservation_time, guests, zone, status')
    .eq('reservation_date', date)
    .neq('status', 'cancelled')

  if (rErr) {
    console.error('Reservations Error:', rErr)
    return
  }

  console.log(`\nFound ${reservations?.length || 0} active reservations for today.`)
  
  const slots: Record<string, { total: number, inside: number, terrace: number }> = {}

  reservations?.forEach(res => {
    // Standardize time format (handle HH:MM:00)
    const time = res.reservation_time.substring(0, 5)
    if (!slots[time]) slots[time] = { total: 0, inside: 0, terrace: 0 }
    
    slots[time].total += (res.guests || 0)
    if (res.zone === 'terrace') {
      slots[time].terrace += (res.guests || 0)
    } else {
      // Default to inside if zone is null or 'inside'
      slots[time].inside += (res.guests || 0)
    }
  })

  console.log('\n--- OCCUPANCY SUMMARY ---')
  console.log('| Time  | Inside | Terrace | Limit (In) | Status      |')
  console.log('|-------|--------|---------|------------|-------------|')
  
  Object.entries(slots).sort().forEach(([time, data]) => {
    const limit = settings?.max_capacity_inside || settings?.max_capacity_per_slot || 20
    const isFull = data.inside >= limit
    console.log(`| ${time} | ${data.inside.toString().padEnd(6)} | ${data.terrace.toString().padEnd(7)} | ${limit.toString().padEnd(10)} | ${isFull ? '🔥 FULL' : '✅ OK'}`)
  })
}

debug().catch(console.error)
