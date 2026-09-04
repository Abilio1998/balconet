import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, query } = body
    const supabaseAdmin = createAdminClient()

    if (action === 'search') {
       if (!query || query.length < 3) {
         return NextResponse.json({ error: 'La consulta debe tener al menos 3 caracteres' }, { status: 400 })
       }

       // Buscamos reservas coincidentes
       const { data: reservations, error: resError } = await supabaseAdmin
         .from('reservations')
         .select('*')
         .or(`client_phone.ilike.%${query}%,client_name.ilike.%${query}%`)
         .order('reservation_date', { ascending: false })

       if (resError) throw resError

       // Buscamos perfiles de fidelización
       const { data: loyaltyClients, error: loyError } = await supabaseAdmin
         .from('loyalty_clients')
         .select('*')
         .or(`phone.ilike.%${query}%,name.ilike.%${query}%`)
         
       if (loyError) throw loyError

       // Agrupamos por número de teléfono para crear Identidades Únicas
       const profilesMap = new Map<string, any>()

       if (reservations) {
         reservations.forEach(r => {
           const phone = r.client_phone || 'Sin Teléfono'
           if (!profilesMap.has(phone)) {
             profilesMap.set(phone, {
               phone,
               name: r.client_name,
               reservations: [],
               loyalty: null
             })
           }
           profilesMap.get(phone).reservations.push(r)
         })
       }

       if (loyaltyClients) {
         // Gather loyalty rewards using a single query for all matched clients if needed,
         // but for now we just attach the profile. The PDF doesn't show standard rewards anyway,
         // just points.
         for (const l of loyaltyClients) {
           const phone = l.phone || 'Sin Teléfono'
           if (!profilesMap.has(phone)) {
             profilesMap.set(phone, {
               phone,
               name: l.name,
               reservations: [],
               loyalty: null
             })
           } else {
             // Prefer the loyalty name if it's longer/better
             if (l.name && profilesMap.get(phone).name.length < l.name.length) {
               profilesMap.get(phone).name = l.name
             }
           }
           profilesMap.get(phone).loyalty = l
         }
       }

       // Ordenar perfiles por la cantidad de reservas (mayor a menor)
       const profiles = Array.from(profilesMap.values()).sort((a, b) => b.reservations.length - a.reservations.length)

       return NextResponse.json({ success: true, profiles })
    }

    if (action === 'search_all') {
       // Obtenemos los últimos 3000 registros para construir el directorio
       const { data: reservations, error: resError } = await supabaseAdmin
         .from('reservations')
         .select('*')
         .order('reservation_date', { ascending: false })
         .limit(3000)

       if (resError) throw resError

       const { data: loyaltyClients, error: loyError } = await supabaseAdmin
         .from('loyalty_clients')
         .select('*')
         .limit(1000)
         
       if (loyError) throw loyError

       const profilesMap = new Map<string, any>()

       if (reservations) {
         reservations.forEach(r => {
           const phone = r.client_phone || 'Sin Teléfono'
           if (phone === '000000000') return // Ignorar ya anonimizados
           
           if (!profilesMap.has(phone)) {
             profilesMap.set(phone, {
               phone,
               name: r.client_name,
               reservations: [],
               loyalty: null
             })
           }
           profilesMap.get(phone).reservations.push(r)
         })
       }

       if (loyaltyClients) {
         for (const l of loyaltyClients) {
           const phone = l.phone || 'Sin Teléfono'
           if (!profilesMap.has(phone)) {
             profilesMap.set(phone, {
               phone,
               name: l.name,
               reservations: [],
               loyalty: null
             })
           } else {
             if (l.name && profilesMap.get(phone).name.length < l.name.length) {
               profilesMap.get(phone).name = l.name
             }
           }
           profilesMap.get(phone).loyalty = l
         }
       }

       const profiles = Array.from(profilesMap.values()).sort((a, b) => b.reservations.length - a.reservations.length)

       return NextResponse.json({ success: true, profiles })
    }

    if (action === 'anonymize') {
       const { clientPhones, loyaltyId } = body
       
       let reservationsAffected = 0
       
       // Anonimizar reservas
       if (clientPhones && clientPhones.length > 0) {
          for (const phone of clientPhones) {
             const { data, error } = await supabaseAdmin.from('reservations').update({
                client_name: 'Usuario Anonimizado (RGPD)',
                client_phone: '000000000',
                notes: 'Eliminado por RGPD'
             }).eq('client_phone', phone).select()
             
             if (error) console.error('Error RGPD Anonymize:', error)
             if (data) reservationsAffected += data.length
          }
       }

       // Borrado real de fidelidad
       let loyaltyDeleted = false
       if (loyaltyId) {
          const { error } = await supabaseAdmin.from('loyalty_clients').delete().eq('id', loyaltyId)
          if (!error) loyaltyDeleted = true
       }

       return NextResponse.json({ success: true, stats: { reservationsAffected, loyaltyDeleted } })
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  } catch (error: any) {
    console.error('RGPD API Error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
