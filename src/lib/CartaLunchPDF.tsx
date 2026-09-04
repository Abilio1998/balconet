import React from 'react';
import fs from 'fs';
import path from 'path';

// Types derived from DynamicCartaEditor
export interface PDFProduct {
  name: string;
  name_ca?: string | null;
  name_en?: string | null;
  name_fr?: string | null;
  description: string | null;
  description_ca?: string | null;
  description_en?: string | null;
  description_fr?: string | null;
  price?: number | null;
  price_exterior?: number | null;
  allergens?: string[];
  show_in_lunch?: boolean;
  show_in_breakfast?: boolean;
  show_in_dinner?: boolean;
  is_featured?: boolean;
  supplements?: {
    name: string;
    name_ca?: string | null;
    name_en?: string | null;
    name_fr?: string | null;
    price: number;
  }[];
}

export interface PDFCategory {
  name: string;
  name_ca?: string | null;
  name_en?: string | null;
  name_fr?: string | null;
  pdf_layout_lunch?: string;
  pdf_layout_dinner?: string;
  products: PDFProduct[];
}

interface CartaLunchPDFProps {
  categories: PDFCategory[];
  lang: string;
  session?: 'breakfast' | 'lunch' | 'dinner';
  ReactPdf: any;
}

const goldColor = '#C5A059';

const LABELS: any = {
  es: { breakfast: 'CARTA DE DESAYUNOS', lunch: 'CARTA DE MEDIODÍA', dinner: 'CARTA DE CENAS', terrace: 'Ext', notice: 'PRECIOS CON IVA INCLUIDO', allergy: 'Alergias: consulte con personal', featured: 'RECOMENDADO' },
  ca: { breakfast: 'CARTA D\'ESMORZARS', lunch: 'CARTA DE MIGDIA', dinner: 'CARTA DE SOPARS', terrace: 'Ext', notice: 'PREUS AMB IVA INCLÒS', allergy: 'Al·lèrgies: consulteu al personal', featured: 'RECOMANAT' },
  en: { breakfast: 'BREAKFAST SELECTION', lunch: 'LUNCH SELECTION', dinner: 'DINNER SELECTION', terrace: 'Ext', notice: 'PRICES INCLUDE VAT', allergy: 'Allergies: please consult staff', featured: 'TOP SELLER' },
  fr: { breakfast: 'CARTE DES PETITS DÉJEUNERS', lunch: 'CARTE DU MIDI', dinner: 'CARTE DES DÎNERS', terrace: 'Ext', notice: 'PRIX TTC', allergy: 'Allergies: consultez notre personnel', featured: 'CONSEILLÉ' }
};

// Global guard for font registration
const FONT_REGISTER_KEY = Symbol.for('elbalconet.fonts.registered');

const registerFonts = (Font: any) => {
  if ((global as any)[FONT_REGISTER_KEY]) return;

  const fontsDir = path.join(process.cwd(), 'public', 'fonts');
  const regularFont = path.join(fontsDir, 'schlbk.ttf');
  const boldFont = path.join(fontsDir, 'schlbkb.ttf');

  const fontSources = [];
  if (fs.existsSync(regularFont)) {
    fontSources.push({ src: regularFont });
  } else if (fs.existsSync(boldFont)) {
    fontSources.push({ src: boldFont });
  }

  if (fs.existsSync(boldFont)) {
    fontSources.push({ src: boldFont, fontWeight: 'bold' });
  }

  if (fontSources.length > 0) {
    try {
      Font.register({
        family: 'Century Schoolbook',
        fonts: fontSources as any
      });
      (global as any)[FONT_REGISTER_KEY] = true;
    } catch (e) {
      console.warn('Error registering fonts:', e);
    }
  }
};

const AllergenIcon = ({ id, ImageComp }: { id: string, ImageComp: any }) => {
  if (!id) return null;
  
  // Mapa para traducir IDs de la base de datos a nombres de archivos en public/Alergenos
  const translationMap: Record<string, string> = {
    'gluten': 'cereales',
    'cereales': 'cereales',
    'crustaceans': 'crustaceo',
    'crustaceo': 'crustaceo',
    'eggs': 'huevos',
    'huevos': 'huevos',
    'fish': 'pescado',
    'pescado': 'pescado',
    'peanuts': 'cacahuetes',
    'cacahuetes': 'cacahuetes',
    'soybeans': 'soja',
    'soja': 'soja',
    'dairy': 'lacteos',
    'lacteos': 'lacteos',
    'nuts': 'frutos-secos',
    'frutos-secos': 'frutos-secos',
    'celery': 'apio',
    'apio': 'apio',
    'mustard': 'mostaza',
    'mostaza': 'mostaza',
    'sesame': 'sesamo',
    'sesamo': 'sesamo',
    'sulphites': 'sulfitos',
    'sulfitos': 'sulfitos',
    'lupin': 'altramuz',
    'altramuz': 'altramuz',
    'molluscs': 'moluscos',
    'moluscos': 'moluscos'
  };

  const normalizedId = id.toLowerCase().trim();
  const fileName = translationMap[normalizedId] || normalizedId;
  const localPath = path.join(process.cwd(), "public", "Alergenos", `${fileName}.png`);
  
  if (!fs.existsSync(localPath)) {
    return null;
  }
  
  try {
    const allergenBuffer = fs.readFileSync(localPath);
    return <ImageComp src={allergenBuffer} style={{ width: 10, height: 10, marginLeft: 2 }} />;
  } catch (error) {
    return null;
  }
};

const FooterIcon = ({ file, ImageComp }: { file: string, ImageComp: any }) => {
  const iconPath = path.join(process.cwd(), "public", file);
  if (fs.existsSync(iconPath)) {
    try {
      const buffer = fs.readFileSync(iconPath);
      return <ImageComp src={buffer} style={{ width: 8, height: 8, marginRight: 3 }} />;
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const CartaLunchPDF = ({ categories, lang, session = 'lunch', ReactPdf }: CartaLunchPDFProps) => {
  const { Document, Page, Text, View, StyleSheet, Font, Image } = ReactPdf;

  registerFonts(Font);
  const labels = LABELS[lang] || LABELS.es;
  const lightGray = '#666';

  const styles = StyleSheet.create({
    page: {
      padding: 22,
      paddingBottom: 65, // Safety margin for fixed footer
      backgroundColor: '#FDFDF9',
      fontFamily: 'Century Schoolbook',
      position: 'relative'
    },
    premiumBorder: {
      position: 'absolute',
      top: 10,
      left: 10,
      right: 10,
      bottom: 10,
      borderWidth: 3,
      borderColor: goldColor
    },
    mainTitle: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 2,
      fontWeight: 'bold',
      letterSpacing: 2,
      color: '#1a1a1a'
    },
    premiumLogoBox: {
      borderWidth: 3,
      borderColor: goldColor,
      padding: 2,
      backgroundColor: '#FDFDF9',
      marginTop: -12, // Moved down from -20 for better integration
      marginBottom: 10,
    },
    premiumLogoInnerBox: {
      borderWidth: 0.5,
      borderColor: goldColor,
      padding: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    premiumSectionRow: {
      flexDirection: 'row',
      width: '100%',
    },
    premiumCategoryCol: {
      width: 120,
      paddingRight: 20,
      justifyContent: 'center',
    },
    premiumSeparatorLine: {
      width: 0.8,
      backgroundColor: goldColor,
      height: '95%', // Restored to full height
      marginHorizontal: 25, // Maintains the separation
      alignSelf: 'center',
    },
    premiumProductsCol: {
      flex: 1,
      paddingLeft: 20,
    },
    premiumCategoryText: {
      fontSize: 8.5,
      fontWeight: 'bold',
      color: '#1a1a1a',
      textAlign: 'right',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    premiumCategoryTextSecondary: {
      fontSize: 7.5,
      fontWeight: 'normal',
      color: '#888',
      textAlign: 'right',
      letterSpacing: 1,
      textTransform: 'uppercase'
    },
    premiumProductRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
    },
    premiumProductName: {
      fontSize: 8,
      color: '#1a1a1a',
      fontWeight: 'bold'
    },
    premiumProductNameSecondary: {
      fontSize: 7,
      color: '#444'
    },
    premiumProductNameDessert: {
      fontSize: 8.5,
      color: '#B8860B',
      fontWeight: 'bold'
    },
    premiumProductPrice: {
      fontSize: 8.5,
      color: '#111',
      fontWeight: 'bold',
      marginLeft: 10
    },
    premiumProductPriceSecondary: {
      fontSize: 7,
      color: '#666',
      marginLeft: 10
    },
    premiumFeaturedBox: {
      backgroundColor: '#FAF7F0',
      borderWidth: 1.5,
      borderColor: goldColor,
      padding: 12,
      marginBottom: 10,
    },
    premiumCategoryTextDessert: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#B8860B',
      textAlign: 'center',
      letterSpacing: 4,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    premiumFullWidthRow: {
      width: '100%',
      marginBottom: 35,
    },
    premiumCenterRow: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 25,
      marginBottom: 35,
    },
    premiumGridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 15,
    },
    premiumSecondaryColumn: {
      width: '48%',
      marginBottom: 10,
    },
    premiumFeaturedTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#B8860B',
      textAlign: 'center',
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    featuredBadge: {
      fontSize: 6,
      color: '#B8860B',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4
    },
    premiumDessertHeader: {
      borderTopWidth: 1,
      borderTopColor: '#D4AF37',
      borderBottomWidth: 1,
      borderBottomColor: '#D4AF37',
      paddingVertical: 8,
      marginBottom: 15,
      alignItems: 'center',
    },
    premiumVerticalSeparator: {
      width: 0.5,
      backgroundColor: '#E0E0E0',
      marginHorizontal: 10,
    },
    premiumProductDivider: {
      borderBottomWidth: 0.3,
      borderBottomColor: '#E0E0E0',
      marginVertical: 6,
    },
    bottomNotice: {
      marginTop: 20,
      alignItems: 'center',
      borderTopWidth: 0.5,
      borderTopColor: '#ccc',
      paddingTop: 10,
    },
    footer: {
      position: 'absolute',
      bottom: 20,
      left: 25,
      right: 25,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 0.5,
      borderTopColor: goldColor,
      paddingTop: 10,
    },
    footerItem: {
      fontSize: 6.5,
      color: lightGray,
    }
  });

  const localLogoPath = path.join(process.cwd(), "public", "logo.png");
  let logoBuffer: any = null;
  if (fs.existsSync(localLogoPath)) {
    try {
      logoBuffer = fs.readFileSync(localLogoPath);
    } catch (e) { }
  }

  const allSessionCats = categories.map(cat => ({
    ...cat,
    products: cat.products.filter(p => {
      if (session === 'breakfast') return p.show_in_breakfast;
      if (session === 'dinner') return p.show_in_dinner;
      return p.show_in_lunch;
    })
  })).filter(cat => cat.products.length > 0);

  const getTranslatedName = (item: any) => {
    if (lang === 'es') return item.name;
    return item[`name_${lang}`] || item.name;
  };

  const getTranslatedDesc = (item: any) => {
    if (lang === 'es') return item.description;
    return item[`description_${lang}`] || item.description;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.premiumBorder} fixed />

        {/* LOGO INTEGRADO EN EL BORDE */}
        <View style={{ alignItems: 'center', zIndex: 10 }} fixed>
          <View style={styles.premiumLogoBox}>
            <View style={styles.premiumLogoInnerBox}>
              {logoBuffer && <Image src={logoBuffer} style={{ width: 80, height: 48 }} />}
            </View>
          </View>
        </View>

        <View style={{ alignItems: 'center', marginBottom: 25, marginTop: 15 }}>
          <Text style={[styles.mainTitle, { marginTop: 10 }]}>{labels[session]}</Text>
        </View>

        {/* ESPACIADOR DINÁMICO PARA PÁGINAS 2 EN ADELANTE */}
        <View render={({ pageNumber }: any) => (
          pageNumber > 1 ? <View style={{ height: 35 }} /> : null
        )} fixed />

        {(() => {
          const getLayoutType = (cat: PDFCategory) => {
            const currentLayout = session === 'lunch' ? cat.pdf_layout_lunch : cat.pdf_layout_dinner;
            
            if (currentLayout === 'dessert') return 'dessert';
            if (currentLayout === 'secondary') return 'secondary';
            if (currentLayout === 'primary') return 'primary';
            return 'classic';
          };

          const secondaryCats = allSessionCats.filter(c => getLayoutType(c) === 'secondary');
          const otherCats = allSessionCats.filter(c => getLayoutType(c) !== 'secondary');

          const result: any[] = [];
          
          const insertSecondaryGroup = () => {
            let secondaryGroup: any[] = [];
            secondaryCats.forEach(cat => {
              secondaryGroup.push(cat);
              if (secondaryGroup.length === 2) {
                result.push({ type: 'secondaryGroup', data: secondaryGroup });
                secondaryGroup = [];
              }
            });
            if (secondaryGroup.length > 0) {
              result.push({ type: 'secondaryGroup', data: secondaryGroup });
            }
          };

          if (otherCats.length === 0) {
            insertSecondaryGroup();
          } else {
            // Añadir todas las categorías normales excepto la última
            for (let i = 0; i < otherCats.length - 1; i++) {
              result.push({ type: 'single', data: otherCats[i], layout: getLayoutType(otherCats[i]) });
            }
            // Insertar el grupo secundario justo antes de la última sección
            insertSecondaryGroup();
            // Añadir la última categoría (normalmente los postres)
            const lastCat = otherCats[otherCats.length - 1];
            result.push({ type: 'single', data: lastCat, layout: getLayoutType(lastCat) });
          }

          return result.map((item: any, idx: number) => {
            if (item.type === 'secondaryGroup') {
              return (
                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                  {item.data.map((cat: PDFCategory, cIdx: number) => (
                    <React.Fragment key={cIdx}>
                      <View style={{ width: '47%' }}>
                        <View style={{ backgroundColor: '#FAF8F5', paddingHorizontal: 6, paddingVertical: 4, marginBottom: 8, borderLeftWidth: 2, borderLeftColor: goldColor }}>
                          <Text style={[styles.premiumCategoryTextSecondary, { textAlign: 'left', color: goldColor }]}>
                            {getTranslatedName(cat)}
                          </Text>
                        </View>
                        {cat.products.map((prod: PDFProduct, pIdx: number) => (
                          <View key={pIdx} style={{ marginBottom: 4 }} wrap={false}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <Text style={styles.premiumProductNameSecondary}>{getTranslatedName(prod)}</Text>
                                <View style={{ flexDirection: 'row', marginLeft: 4 }}>
                                  {prod.allergens?.map((aId: string) => <AllergenIcon key={aId} id={aId} ImageComp={Image} />)}
                                </View>
                              </View>
                              <Text style={styles.premiumProductPriceSecondary}>
                                {prod.price?.toFixed(2)}
                                {prod.price_exterior && prod.price_exterior > 0 && ` / ${labels.terrace}: ${prod.price_exterior.toFixed(2)}`}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                      {cIdx < item.data.length - 1 && <View style={styles.premiumVerticalSeparator} />}
                    </React.Fragment>
                  ))}
                </View>
              );
            }

            const cat: PDFCategory = item.data;
            const catLayout = item.layout;
            const isFeatured = catLayout === 'primary';
            const isDessert = catLayout === 'dessert';

            if (isDessert) {
              const isLunch = session === 'lunch';
              return (
                <View key={idx} style={styles.premiumCenterRow}>
                  <Text style={[
                    styles.premiumCategoryTextDessert, 
                    isLunch && { textAlign: 'left', marginLeft: 10, letterSpacing: 2 }
                  ]}>
                    {getTranslatedName(cat)}
                  </Text>
                  {cat.products.map((prod: PDFProduct, pIdx: number) => (
                    <View key={pIdx} style={{ 
                      marginBottom: 12, 
                      flexDirection: 'row', 
                      justifyContent: isLunch ? 'flex-start' : 'center', 
                      alignItems: 'center',
                      paddingLeft: isLunch ? 15 : 0
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.premiumProductNameDessert}>{getTranslatedName(prod)}</Text>
                        <View style={{ flexDirection: 'row', marginLeft: 6 }}>
                          {prod.allergens?.map((aId: string) => <AllergenIcon key={aId} id={aId} ImageComp={Image} />)}
                        </View>
                      </View>
                      <Text style={[styles.premiumProductPrice, { marginLeft: 12 }]}>
                        {prod.price?.toFixed(2)}
                        {prod.price_exterior && prod.price_exterior > 0 && ` / ${labels.terrace}: ${prod.price_exterior.toFixed(2)}`}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            }

            if (isFeatured) {
              const isLunch = session === 'lunch';
              return (
                <View key={idx} style={styles.premiumFullWidthRow}>
                  <Text style={[
                    styles.premiumFeaturedTitle, 
                    isLunch && { textAlign: 'left', marginLeft: 5 }
                  ]}>
                    {getTranslatedName(cat)}
                  </Text>
                  <View style={styles.premiumFeaturedBox}>
                    <Text style={styles.featuredBadge}>Recomendación del Chef</Text>
                    {cat.products.map((prod: PDFProduct, pIdx: number) => (
                      <View key={pIdx} wrap={false}>
                        <View style={[styles.premiumProductRow, { marginBottom: 4 }]}>
                          <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                            <Text style={[styles.premiumProductName, { fontSize: 10, color: '#8B4513' }]}>
                              {getTranslatedName(prod)}
                            </Text>
                            <View style={{ flexDirection: 'row', marginLeft: 4 }}>
                              {prod.allergens?.map((aId: string) => <AllergenIcon key={aId} id={aId} ImageComp={Image} />)}
                            </View>
                          </View>
                          <Text style={styles.premiumProductPrice}>
                            {prod.price?.toFixed(2)}
                            {prod.price_exterior && prod.price_exterior > 0 && ` / ${labels.terrace}: ${prod.price_exterior.toFixed(2)}`}
                          </Text>
                        </View>
                        {getTranslatedDesc(prod) && (
                          <Text style={{ fontSize: 7.5, color: '#444', marginTop: 1, marginBottom: 4 }}>{getTranslatedDesc(prod)}</Text>
                        )}
                        {pIdx < cat.products.length - 1 && <View style={styles.premiumProductDivider} />}
                      </View>
                    ))}
                  </View>
                </View>
              );
            }

            return (
              <View key={idx} style={[styles.premiumSectionRow, { marginBottom: 35 }]} minPresenceAhead={150}>
                <View style={styles.premiumCategoryCol}>
                  <Text style={[styles.premiumCategoryText, { fontSize: 9.5, letterSpacing: 1.2 }]} fixed>
                    {getTranslatedName(cat)}
                  </Text>
                </View>
                <View style={styles.premiumSeparatorLine} fixed />
                <View style={styles.premiumProductsCol}>
                  {cat.products.map((prod: PDFProduct, pIdx: number) => (
                    <View key={pIdx} style={{ marginBottom: 22 }} wrap={false}>
                      <View style={styles.premiumProductRow}>
                        <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                          <Text style={[styles.premiumProductName, { fontSize: 8.8 }]}>{getTranslatedName(prod)}</Text>
                          <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                            {prod.allergens?.map((aId: string) => <AllergenIcon key={aId} id={aId} ImageComp={Image} />)}
                          </View>
                        </View>
                        <Text style={styles.premiumProductPrice}>
                            {prod.price?.toFixed(2)}
                            {prod.price_exterior && prod.price_exterior > 0 && ` / ${labels.terrace}: ${prod.price_exterior.toFixed(2)}`}
                        </Text>
                      </View>
                      {getTranslatedDesc(prod) && (
                        <Text style={{ fontSize: 7.2, color: '#444', marginTop: 5, lineHeight: 1.3 }}>{getTranslatedDesc(prod)}</Text>
                      )}
                      {prod.supplements && prod.supplements.length > 0 && (
                        <View style={{ marginTop: 6, paddingLeft: 10 }}>
                          {prod.supplements.map((sup: any, sIdx: number) => {
                            const supName = lang === 'ca' ? sup.name_ca : lang === 'en' ? sup.name_en : lang === 'fr' ? sup.name_fr : sup.name;
                            return (
                              <View key={sIdx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                                <Text style={{ fontSize: 7, color: '#555' }}>+ {supName || sup.name}</Text>
                                <Text style={{ fontSize: 7, color: '#555', fontWeight: 'bold' }}>{sup.price.toFixed(2)}</Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            );
          });
        })()}

        <View style={styles.footer} fixed>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FooterIcon file="phone.png" ImageComp={Image} />
            <Text style={styles.footerItem}>679 12 10 45</Text>
          </View>

          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.footerItem, { fontWeight: 'bold' }]}>{labels.notice}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FooterIcon file="instagram.png" ImageComp={Image} />
            <Text style={styles.footerItem}>@elbalconet_premiadedalt</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', maxWidth: 160 }}>
            <FooterIcon file="warning.png" ImageComp={Image} />
            <Text style={styles.footerItem}>{labels.allergy}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
