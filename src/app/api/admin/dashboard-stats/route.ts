import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const getShiftFromTimestamp = (createdAt: string): 'morning' | 'evening' | null => {
  try {
    const dateInMadrid = new Date(createdAt).toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      hour: '2-digit',
      hour12: false
    });
    const hour = parseInt(dateInMadrid, 10);
    if (isNaN(hour)) return null;
    if (hour >= 8 && hour < 17) return 'morning';
    if (hour >= 17 && hour <= 23) return 'evening';
    return null;
  } catch {
    return null;
  }
};


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range') || 'month'
    const supabaseAdmin = createAdminClient()
    let topHour = 'N/A'

    // Define date range
    const now = new Date()
    const startDate = new Date()
    const endDate = new Date()
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    const isCustomDate = dateRegex.test(range)

    if (range === 'day') {
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
    } else if (range === 'yesterday') {
      startDate.setDate(startDate.getDate() - 1)
      startDate.setHours(0, 0, 0, 0)
      endDate.setDate(endDate.getDate() - 1)
      endDate.setHours(23, 59, 59, 999)
    } else if (isCustomDate) {
      const [y, m, d] = range.split('-').map(Number)
      startDate.setFullYear(y, m - 1, d)
      startDate.setHours(0, 0, 0, 0)
      endDate.setFullYear(y, m - 1, d)
      endDate.setHours(23, 59, 59, 999)
    } else if (range === 'week') {
      startDate.setDate(startDate.getDate() - 7)
    } else if (range === 'year') {
      startDate.setDate(startDate.getDate() - 365)
    } else {
      startDate.setDate(startDate.getDate() - 30) // Default month (last 30 days)
    }
    
    // Helper to get YYYY-MM-DD in local time
    const toLocalDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const startDateStr = toLocalDateStr(startDate)
    const endDateStr = toLocalDateStr(endDate)
    const startDateTimeStr = startDate.toISOString()
    const endDateTimeStr = endDate.toISOString()

    // 1. Get stats for reservations
    const reservationsQuery = supabaseAdmin
      .from('reservations')
      .select('id, reservation_date, reservation_time, guests, status')
      .gte('reservation_date', startDateStr)
      
    if (range === 'yesterday' || range === 'day' || isCustomDate) {
      reservationsQuery.eq('reservation_date', startDateStr)
    }

    const { data: reservations, error: resError } = await reservationsQuery

    if (resError) throw resError

    // 2. Aggregate dynamically based on range
    let chartStats: { day: string, count: number }[] = []
    let totalPax = 0
    
    // Default Day-Of-Week calculation for KPI summary
    const daysArr = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    const dayOfWeekStats = [0, 0, 0, 0, 0, 0, 0]

    reservations?.forEach(res => {
      totalPax += (res.guests || 0)
      const d = new Date(res.reservation_date)
      let dayIndex = d.getDay() - 1
      if (dayIndex < 0) dayIndex = 6 
      dayOfWeekStats[dayIndex] += (res.guests || 0)
    })

    const mostReservedDay = dayOfWeekStats.some(v => v > 0) 
      ? daysArr[dayOfWeekStats.indexOf(Math.max(...dayOfWeekStats))] 
      : 'N/A'

    // Calculate Top Specific Date
    let datePaxMap: Record<string, number> = {}
    reservations?.forEach(res => {
      datePaxMap[res.reservation_date] = (datePaxMap[res.reservation_date] || 0) + (res.guests || 0)
    })
    
    let topDate = 'N/A'
    let maxPax = 0
    Object.entries(datePaxMap).forEach(([date, pax]) => {
      if (pax > maxPax) {
        maxPax = pax
        topDate = date
      }
    })

    if (range === 'day' || range === 'yesterday' || isCustomDate) {
       // Afluencia por Horas
       const hourMap: Record<string, number> = {}
       const defaultHours = ['13:00', '14:00', '15:00', '20:00', '21:00', '22:00']
       defaultHours.forEach(h => hourMap[h] = 0)

       reservations?.forEach(res => {
         if (!res.reservation_time) return
         const hourPrefix = res.reservation_time.split(':')[0]
         const hourFormat = `${hourPrefix}:00`
         hourMap[hourFormat] = (hourMap[hourFormat] || 0) + (res.guests || 0)
       })

       const allKeys = Array.from(new Set([...defaultHours, ...Object.keys(hourMap)])).sort()
       chartStats = allKeys.map(h => ({ day: h, count: hourMap[h] }))
       
       // Calculate Top Hour
       let maxHour = 'N/A'
       let maxHourPax = 0
       Object.entries(hourMap).forEach(([h, p]) => {
         if (p > maxHourPax) {
           maxHourPax = p
           maxHour = h
         }
       })
       topHour = maxHour
    } else if (range === 'year') {
       // Afluencia por Meses
       const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
       const monthStats = new Array(12).fill(0)
       reservations?.forEach(res => {
         const m = new Date(res.reservation_date).getMonth()
         monthStats[m] += (res.guests || 0)
       })
       chartStats = monthNames.map((m, i) => ({ day: m, count: monthStats[i] }))
       
    } else {
       // Afluencia por Día Semana ('week' or 'month')
       chartStats = daysArr.map((d, i) => ({ day: d, count: dayOfWeekStats[i] }))
    }

    // 3. Get top liked products (all with >0 likes, we will slice in UI for top 5, or show all in modal)
    const { data: topProducts, error: prodError } = await supabaseAdmin
      .from('carta_products')
      .select('id, name, likes_count, is_featured, is_web_featured')
      .gt('likes_count', 0)
      .order('likes_count', { ascending: false })

    if (prodError) throw prodError

    // 3.5 Get liked menu dishes
    const { data: topMenuDishes, error: menuProdError } = await supabaseAdmin
      .from('dishes')
      .select('id, name, likes_count, daily_menus(date)')
      .gt('likes_count', 0)
      .order('likes_count', { ascending: false })

    if (menuProdError) throw menuProdError

    // 3.6 Get UNLIKED products (0 likes or null)
    const { data: unlikedProducts, error: unlikedProdError } = await supabaseAdmin
      .from('carta_products')
      .select('id, name, likes_count')
      .or('likes_count.eq.0,likes_count.is.null')

    if (unlikedProdError) throw unlikedProdError

    // 3.7 Get UNLIKED menu dishes (0 likes or null) from TODAY ONLY
    const todayStrFilter = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })
    const { data: unlikedMenuDishes, error: unlikedMenuError } = await supabaseAdmin
      .from('dishes')
      .select('id, name, likes_count, daily_menus!inner(date)')
      .eq('daily_menus.date', todayStrFilter)
      .or('likes_count.eq.0,likes_count.is.null')

    if (unlikedMenuError) throw unlikedMenuError

    // 4. Get total visits
    const visitQuery = supabaseAdmin
      .from('website_visits')
      .select('*', { count: 'exact' })
      .gte('created_at', startDateTimeStr)
      .lte('created_at', endDateTimeStr)

    const { count: totalVisits, error: visitError } = await visitQuery

    // 5. Get top referrers and QR scan analytics
    // IMPORTANTE: Supabase limita a 1000 filas por petición. 
    // Hacemos paginación en bucle para traer todas las visitas.
    let referrers: any[] = []
    let from = 0
    const step = 1000

    while (true) {
      const referrerQuery = supabaseAdmin
        .from('website_visits')
        .select('referrer, created_at')
        .gte('created_at', startDateTimeStr)
        .lte('created_at', endDateTimeStr)
        .range(from, from + step - 1)

      const { data: pageData, error: refError } = await referrerQuery
      if (refError) throw refError

      if (pageData && pageData.length > 0) {
        referrers.push(...pageData)
      }

      if (!pageData || pageData.length < step) {
        break
      }
      from += step
    }

    const referrerCounts: Record<string, number> = {}
    
    // QR Scan Shifts Analytics
    const qrShifts = {
      morning: { scans: 0, hours: {} as Record<string, number>, peakHour: 'N/A' }, // 08:00 - 16:59
      evening: { scans: 0, hours: {} as Record<string, number>, peakHour: 'N/A' }  // 17:00 - 23:59
    }

    referrers?.forEach(r => {
      let raw = r.referrer || 'Directo / Desconocido'
      let name = raw

      // Clean up common referrers
      if (raw === 'Escaneo QR (Físico)') {
        name = 'Escaneo QR (Físico)'
        
        // Process QR scan time in Europe/Madrid
        if (r.created_at) {
          // Format the UTC date to Europe/Madrid timezone and extract just the hour
          const dateInMadrid = new Date(r.created_at).toLocaleString('es-ES', { 
            timeZone: 'Europe/Madrid',
            hour: '2-digit',
            hour12: false
          });
          const hour = parseInt(dateInMadrid, 10);
          
          if (!isNaN(hour)) {
            const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
            if (hour >= 8 && hour < 17) {
              qrShifts.morning.scans++;
              qrShifts.morning.hours[hourLabel] = (qrShifts.morning.hours[hourLabel] || 0) + 1;
            } else if (hour >= 17 && hour <= 23) {
              qrShifts.evening.scans++;
              qrShifts.evening.hours[hourLabel] = (qrShifts.evening.hours[hourLabel] || 0) + 1;
            }
          }
        }
      } else if (raw.includes('instagram.com')) {
        name = 'Instagram'
      } else if (raw.includes('facebook.com') || raw.includes('fb.me')) {
        name = 'Facebook'
      } else if (raw.includes('t.co') || raw.includes('twitter.com')) {
        name = 'Twitter / X'
      } else if (raw.includes('google.')) {
        name = 'Google / Buscador'
      } else if (raw.includes('elbalconet.es') || raw.includes('localhost')) {
        name = 'Tráfico Interno'
      } else if (raw.startsWith('http')) {
        try {
          name = new URL(raw).hostname.replace('www.', '')
        } catch {
          name = raw
        }
      }

      referrerCounts[name] = (referrerCounts[name] || 0) + 1
    })

    // Calculate Peak Hours for QR Shifts
    const getPeakHour = (hours: Record<string, number>) => {
      let max = 0;
      let peak = 'N/A';
      for (const [h, count] of Object.entries(hours)) {
        if (count > max) { max = count; peak = h; }
      }
      return peak;
    };
    qrShifts.morning.peakHour = getPeakHour(qrShifts.morning.hours);
    qrShifts.evening.peakHour = getPeakHour(qrShifts.evening.hours);

    const allReferrersSorted = Object.entries(referrerCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const topReferrers = allReferrersSorted.slice(0, 10)

    // Si hay canales fuera del top 10, agruparlos en "Otros"
    const othersCount = allReferrersSorted.slice(10).reduce((sum, r) => sum + r.count, 0)
    if (othersCount > 0) {
      topReferrers.push({ name: 'Otros canales', count: othersCount })
    }

    // 6. Get allergen interaction stats
    const allergenQuery = supabaseAdmin
      .from('interaction_events')
      .select('event_value, created_at')
      .eq('event_type', 'allergen_filter')
      .gte('created_at', startDateTimeStr)
      .lte('created_at', endDateTimeStr)

    const { data: allergenEvents, error: allergenError } = await allergenQuery

    const allergenStats: Record<string, number> = {}
    const allergenStatsMorning: Record<string, number> = {}
    const allergenStatsEvening: Record<string, number> = {}

    allergenEvents?.forEach(e => {
      if (!e.event_value) return
      const allergenId = e.event_value
      allergenStats[allergenId] = (allergenStats[allergenId] || 0) + 1
      
      const shift = getShiftFromTimestamp(e.created_at)
      if (shift === 'morning') {
        allergenStatsMorning[allergenId] = (allergenStatsMorning[allergenId] || 0) + 1
      } else if (shift === 'evening') {
        allergenStatsEvening[allergenId] = (allergenStatsEvening[allergenId] || 0) + 1
      }
    })

    const formatAllergens = (statsMap: Record<string, number>) =>
      Object.entries(statsMap)
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count)

    const topAllergens = formatAllergens(allergenStats)
    const topAllergensByShift = {
      morning: formatAllergens(allergenStatsMorning),
      evening: formatAllergens(allergenStatsEvening)
    }

    // 7. Get Google Review Button clicks
    const googleQuery = supabaseAdmin
      .from('interaction_events')
      .select('*', { count: 'exact' })
      .eq('event_type', 'click')
      .eq('event_value', 'google_review_btn')
      .gte('created_at', startDateTimeStr)
      .lte('created_at', endDateTimeStr)
    const { count: googleClicks } = await googleQuery

    // 8. Get Engagement Stats (Hottest Sections)
    const engagementQuery = supabaseAdmin
      .from('interaction_events')
      .select('event_value, metadata, created_at')
      .eq('event_type', 'dwell_time')
      .gte('created_at', startDateTimeStr)
      .lte('created_at', endDateTimeStr)

    const { data: engagementEvents } = await engagementQuery

    // Fetch category likes to augment engagement data
    const { data: catLikes } = await supabaseAdmin.rpc('get_category_likes') 
    // Wait, I don't know if the RPC exists. Let's do it manually.
    
    const { data: allProducts } = await supabaseAdmin.from('carta_products').select('name, likes_count, category_id')
    const { data: allCategories } = await supabaseAdmin.from('carta_categories').select('id, name')
    
    const categoryLikesMap: Record<string, { total: number, topProducts: { name: string, likes: number }[] }> = {}
    allCategories?.forEach(cat => {
      const categoryProducts = allProducts?.filter(p => p.category_id === cat.id) || []
      const totalLikes = categoryProducts.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0
      
      const topProducts = categoryProducts
        .filter(p => (p.likes_count || 0) > 0)
        .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
        .slice(0, 3)
        .map(p => ({ name: p.name, likes: p.likes_count || 0 }))

      const slug = cat.name.toLowerCase().replace(/\s+/g, '-')
      const data = { total: totalLikes, topProducts }
      
      categoryLikesMap[`cat-${slug}`] = data
      categoryLikesMap[`carta: ${cat.name.toLowerCase()}`] = data
    })



    // Process engagement into three maps: all, morning, evening
    type EngagementBucket = Record<string, { totalTime: number, visits: number, likes: number, topLikedProducts: { name: string, likes: number }[] }>
    const engagementMapAll: EngagementBucket = {}
    const engagementMapMorning: EngagementBucket = {}
    const engagementMapEvening: EngagementBucket = {}

    const addToMap = (map: EngagementBucket, section: string, duration: number, catData: { total: number, topProducts: { name: string, likes: number }[] }) => {
      if (!map[section]) {
        map[section] = { totalTime: 0, visits: 0, likes: catData.total, topLikedProducts: catData.topProducts }
      }
      map[section].totalTime += duration
      map[section].visits += 1
    }

    engagementEvents?.forEach(e => {
      let section = (e as any).event_value
      if (!section) return
      section = String(section).toLowerCase().trim()
      const duration = (e as any).metadata?.duration || 0
      
      // Ignore interactions less than 2 seconds
      if (duration < 2) return

      const catData = categoryLikesMap[section] || { total: 0, topProducts: [] }

      // Add to ALL
      addToMap(engagementMapAll, section, duration, catData)

      // Add to shift-specific map
      const shift = getShiftFromTimestamp((e as any).created_at)
      if (shift === 'morning') addToMap(engagementMapMorning, section, duration, catData)
      else if (shift === 'evening') addToMap(engagementMapEvening, section, duration, catData)
    })

    const buildEngagementStats = (map: EngagementBucket) =>
      Object.entries(map)
        .map(([section, data]) => ({
          section,
          averageTime: Math.round(data.totalTime / data.visits),
          totalTime: Number(data.totalTime.toFixed(2)),
          visits: data.visits,
          likes: data.likes,
          topLikedProducts: data.topLikedProducts
        }))
        .sort((a, b) => b.totalTime - a.totalTime)

    const engagementStats = buildEngagementStats(engagementMapAll)
    const engagementStatsByShift = {
      morning: buildEngagementStats(engagementMapMorning),
      evening: buildEngagementStats(engagementMapEvening)
    }

    // 9. Get featured product (Marketing)
    const featuredProduct = topProducts?.find((p: any) => p.is_featured || p.is_web_featured) || topProducts?.[0]

    return NextResponse.json({
      summary: {
        totalPax: totalPax || 0,
        mostReservedDay: (range === 'day' || range === 'yesterday' || isCustomDate) ? topHour : mostReservedDay,
        topDate: topDate !== 'N/A' ? new Date(topDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'N/A',
        topHour: (topHour as any) || 'N/A',
        topDish: topProducts?.[0]?.name || 'N/A',
        reservationsCount: reservations?.length || 0,
        totalVisits: totalVisits || 0,
        googleReviewClicks: googleClicks || 0
      },
      dayStats: chartStats,
      topProducts: topProducts || [],
      topMenuDishes: topMenuDishes || [],
      unlikedProducts: unlikedProducts || [],
      unlikedMenuDishes: unlikedMenuDishes || [],
      topReferrers,
      topAllergens,
      topAllergensByShift,
      featuredProduct,
      engagementStats,
      engagementStatsByShift,
      qrShifts
    })
  } catch (err: any) {
    console.error('Dashboard stats error:', err)
    return NextResponse.json({
      summary: { totalPax: 0, mostReservedDay: 'N/A', topDish: 'N/A', reservationsCount: 0, totalVisits: 0, googleReviewClicks: 0 },
      dayStats: [],
      topProducts: [],
      topReferrers: [],
      topAllergens: [],
      topAllergensByShift: { morning: [], evening: [] },
      qrShifts: null
    })
  }
}

// PATCH: Toggle featured status or update image
export async function PATCH(req: Request) {
  try {
    const { productId, isFeatured, isWebFeatured, imageUrl } = await req.json()
    const supabaseAdmin = createAdminClient()

    const updateData: any = {}
    if (isFeatured !== undefined) updateData.is_featured = isFeatured
    if (isWebFeatured !== undefined) updateData.is_web_featured = isWebFeatured
    if (imageUrl !== undefined) updateData.image_url = imageUrl

    // Expert rule: Only one dish can be web featured at a time (Plato del Mes)
    if (isWebFeatured === true) {
      await supabaseAdmin
        .from('carta_products')
        .update({ is_web_featured: false })
        .not('id', 'eq', productId)
    }

    const { data, error } = await supabaseAdmin
      .from('carta_products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, product: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
