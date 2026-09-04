import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const currentYear = new Date().getFullYear().toString()
    const year = searchParams.get('year') || currentYear
    
    const supabaseAdmin = createAdminClient()
    
    // Fetch all billing data for the year
    const firstDay = `${year}-01-01`
    const lastDay = `${year}-12-31`
    
    const { data: billingData, error: billingError } = await supabaseAdmin
      .from('daily_billing')
      .select('date, amount')
      .gte('date', firstDay)
      .lte('date', lastDay)
    
    if (billingError) throw billingError
    
    // Fetch billing settings (global + specific months of this year)
    const monthKeys = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('billing_settings')
      .select('*')
      // Note: we fetch all and filter in memory since Supabase OR with nulls can be tricky.
    
    if (settingsError) throw settingsError
    
    // Find the global default setting
    const globalSetting = settingsData?.find(s => s.month_year === null)
    const defaultMonthlyGoal = (globalSetting?.monthly_goal_morning || 25000) + (globalSetting?.monthly_goal_evening || 25000)
    
    const months = []
    let annualTotalBilled = 0
    let annualTotalGoal = 0
    
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthNumberStr = String(monthIndex + 1).padStart(2, '0')
      const monthPrefix = `${year}-${monthNumberStr}`
      
      // Calculate billed for this month
      const monthBilled = (billingData || [])
        .filter(entry => entry.date.startsWith(monthPrefix))
        .reduce((sum, entry) => sum + Number(entry.amount), 0)
        
      // Determine the goal for this month
      const specificSetting = settingsData?.find(s => s.month_year === monthPrefix)
      let monthGoal = 0 // If no specific budget is configured, set to 0 as requested
      if (specificSetting) {
        monthGoal = Number(specificSetting.monthly_goal_morning) + Number(specificSetting.monthly_goal_evening)
      }
      
      months.push({
        monthIndex,
        monthPrefix,
        billed: monthBilled,
        goal: monthGoal,
        difference: monthBilled - monthGoal,
        percentage: monthGoal > 0 ? (monthBilled / monthGoal) * 100 : 0
      })
      
      annualTotalBilled += monthBilled
      annualTotalGoal += monthGoal
    }
    
    return NextResponse.json({
      year,
      months,
      annual: {
        totalBilled: annualTotalBilled,
        totalGoal: annualTotalGoal,
        difference: annualTotalBilled - annualTotalGoal,
        percentage: annualTotalGoal > 0 ? (annualTotalBilled / annualTotalGoal) * 100 : 0
      }
    })
  } catch (err: any) {
    console.error('Billing Annual GET error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
