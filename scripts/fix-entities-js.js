const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fix() {
  console.log('Fetching products to fix entities...');
  const { data: products, error } = await supabase
    .from('carta_products')
    .select('id, name_ca, name_en, name_fr, description_ca, description_en, description_fr');
  
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  function decode(text) {
    if (!text) return text;
    return text.replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  }

  for (const p of products) {
    const updates = {};
    let changed = false;

    const fields = ['name_ca', 'name_en', 'name_fr', 'description_ca', 'description_en', 'description_fr'];
    for (const field of fields) {
      const original = p[field];
      const fixed = decode(original);
      if (fixed !== original) {
        updates[field] = fixed;
        changed = true;
      }
    }

    if (changed) {
      console.log(`Fixing product ${p.id}...`);
      const { error: upError } = await supabase.from('carta_products').update(updates).eq('id', p.id);
      if (upError) console.error('Error updating:', upError);
    }
  }

  console.log('Done.');
}

fix();
