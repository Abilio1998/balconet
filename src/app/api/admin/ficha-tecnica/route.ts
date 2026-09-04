import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import React from 'react';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = createAdminClient();

  try {
    // 1. Fetch Carta Categories and Products separately
    const { data: categories } = await supabase
      .from('carta_categories')
      .select('*')
      .order('order_index');

    const { data: products } = await supabase
      .from('carta_products')
      .select('*')
      .order('order_index');

    // 2. Assemble dishes
    let allDishes: any[] = [];

    if (categories && products) {
      categories.forEach((cat: any) => {
        // Skip if category is explicitly hidden from Ficha
        if (cat.show_in_ficha === false) {
          return;
        }

        const catProducts = products.filter((p: any) => p.category_id === cat.id);
        if (catProducts.length > 0) {
          catProducts
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .forEach((p: any) => {
              if (p.is_visible !== false && p.show_in_ficha !== false) {
                allDishes.push({
                  id: `carta-${p.id}`,
                  name: p.name,
                  categoryName: cat.name,
                  allergens: p.allergens || [],
                  source: 'carta'
                });
              }
            });
        }
      });
    }

    // Do not sort alphabetically, keep the original order index from Carta

    // Get logo
    let logoData = null;
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoData = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }

    // 🔥 IMPORTS DINÁMICOS
    let ReactPdf;
    if (process.env.NODE_ENV === 'development') {
      ReactPdf = await (new Function("return import('@react-pdf/renderer')"))();
    } else {
      ReactPdf = await import('@react-pdf/renderer');
    }
    
    const { renderToBuffer } = ReactPdf;
    const { FichaTecnicaPDF } = await import('@/lib/FichaTecnicaPDF');

    // Preload Allergen Icons
    const allergenIcons: Record<string, string> = {};
    const ALLERGENS_LIST = ['cereales.png', 'crustaceo.png', 'huevos.png', 'pescado.png', 'cacahuetes.png', 'soja.png', 'lacteos.png', 'frutos-secos.png', 'apio.png', 'mostaza.png', 'sesamo.png', 'sulfitos.png', 'altramuz.png', 'moluscos.png'];
    
    for (const file of ALLERGENS_LIST) {
      const p = path.join(process.cwd(), 'public', 'Alergenos', file);
      if (fs.existsSync(p)) {
        allergenIcons[file] = `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
      }
    }

    // Generate PDF Buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(FichaTecnicaPDF, { dishes: allDishes, logoData, ReactPdf, allergenIcons }) as any
    );

    const dateStr = new Date().toISOString().split('T')[0];
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Ficha_Tecnica_Alergenos_${dateStr}.pdf"`
      }
    });
  } catch (error: any) {
    console.error('Error generating Ficha Tecnica PDF:', error);
    return new NextResponse(error.message || 'Error generating PDF', { status: 500 });
  }
}
