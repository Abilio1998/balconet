import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function run() {
  const { error } = await supabaseAdmin.from('interaction_events').delete().eq('event_value', 'menu-tab-selector')
  console.log(error || 'Deleted')
}
run()
