import React from 'react';
import fs from 'fs';
import path from 'path';

export interface FichaDish {
  id: string;
  name: string;
  categoryName?: string;
  allergens: string[];
  source: 'carta' | 'menu';
}

interface FichaTecnicaProps {
  dishes: FichaDish[];
  logoData?: any;
  ReactPdf: any;
  allergenIcons: Record<string, string>;
}

const ALLERGEN_MAP = [
  { id: 'gluten', iconFile: 'cereales.png', label: 'Gluten' },
  { id: 'crustaceans', iconFile: 'crustaceo.png', label: 'Crustáceos' },
  { id: 'eggs', iconFile: 'huevos.png', label: 'Huevos' },
  { id: 'fish', iconFile: 'pescado.png', label: 'Pescado' },
  { id: 'peanuts', iconFile: 'cacahuetes.png', label: 'Cacahuetes' },
  { id: 'soybeans', iconFile: 'soja.png', label: 'Soja' },
  { id: 'dairy', iconFile: 'lacteos.png', label: 'Lácteos' },
  { id: 'nuts', iconFile: 'frutos-secos.png', label: 'Frutos cáscara' },
  { id: 'celery', iconFile: 'apio.png', label: 'Apio' },
  { id: 'mustard', iconFile: 'mostaza.png', label: 'Mostaza' },
  { id: 'sesame', iconFile: 'sesamo.png', label: 'Sésamo' },
  { id: 'sulphites', iconFile: 'sulfitos.png', label: 'Sulfitos' },
  { id: 'lupin', iconFile: 'altramuz.png', label: 'Altramuces' },
  { id: 'molluscs', iconFile: 'moluscos.png', label: 'Moluscos' }
];

const AllergenHeaderIcon = ({ iconFile, ImageComp, allergenIcons }: { iconFile: string, ImageComp: any, allergenIcons: Record<string, string> }) => {
  const dataUri = allergenIcons[iconFile];
  if (!dataUri) return null;
  return <ImageComp src={dataUri} style={{ width: 18, height: 18, marginBottom: 2 }} />;
};

const AllergenCheckIcon = ({ iconFile, ImageComp, allergenIcons }: { iconFile: string, ImageComp: any, allergenIcons: Record<string, string> }) => {
  const dataUri = allergenIcons[iconFile];
  if (!dataUri) return null;
  return <ImageComp src={dataUri} style={{ width: 14, height: 14 }} />;
};

// Global guard for font registration
const FONT_REGISTER_KEY = Symbol.for('elbalconet.fonts.georgia.v2');

const registerFonts = (Font: any) => {
  if ((global as any)[FONT_REGISTER_KEY]) return;

  const fontsDir = path.join(process.cwd(), 'public', 'fonts');
  const fontSources = [];
  const regular = path.join(fontsDir, 'georgia.ttf');
  const bold = path.join(fontsDir, 'georgiab.ttf');
  const italic = path.join(fontsDir, 'georgiai.ttf');
  const boldItalic = path.join(fontsDir, 'georgiaz.ttf');

  if (fs.existsSync(regular)) fontSources.push({ src: regular });
  if (fs.existsSync(bold)) fontSources.push({ src: bold, fontWeight: 'bold' });
  if (fs.existsSync(italic)) fontSources.push({ src: italic, fontStyle: 'italic' });
  if (fs.existsSync(boldItalic)) fontSources.push({ src: boldItalic, fontWeight: 'bold', fontStyle: 'italic' });

  if (fontSources.length > 0) {
    try {
      Font.register({ family: 'Georgia', fonts: fontSources as any });
      (global as any)[FONT_REGISTER_KEY] = true;
    } catch (e) {
      console.warn('Error registering fonts:', e);
    }
  }
};

export const FichaTecnicaPDF = ({ dishes, logoData, ReactPdf, allergenIcons }: FichaTecnicaProps) => {
  const { Document, Page, Text, View, StyleSheet, Image, Font } = ReactPdf;

  registerFonts(Font);

  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      paddingTop: 90,
      paddingLeft: 30,
      paddingRight: 30,
      paddingBottom: 80,
      fontFamily: 'Georgia',
    },
    header: {
      position: 'absolute',
      top: 30,
      left: 30,
      right: 30,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      borderBottomWidth: 2,
      borderBottomColor: '#D4AF37',
      paddingBottom: 10,
    },
    logo: {
      width: 120,
      height: 40,
      objectFit: 'contain',
    },
    titleContainer: {
      alignItems: 'flex-end',
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333333',
    },
    subtitle: {
      fontSize: 10,
      color: '#666666',
      marginTop: 2,
    },
    table: {
      width: '100%',
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: '#CCCCCC',
      marginBottom: 20,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#EEEEEE',
      minHeight: 24,
      alignItems: 'center',
    },
    tableHeader: {
      backgroundColor: '#F9F9F9',
      borderBottomWidth: 1,
      borderBottomColor: '#CCCCCC',
      minHeight: 40,
    },
    categoryHeader: {
      backgroundColor: '#E5E7EB',
      borderBottomWidth: 1,
      borderBottomColor: '#CCCCCC',
      width: '100%',
    },
    categoryHeaderText: {
      fontSize: 9,
      fontWeight: 'bold',
      color: '#111827',
      paddingHorizontal: 8,
      paddingVertical: 6,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    dishNameCol: {
      width: '30%',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRightWidth: 1,
      borderRightColor: '#EEEEEE',
      justifyContent: 'center',
    },
    allergenColHeader: {
      width: '5%',
      padding: 2,
      alignItems: 'center',
      justifyContent: 'flex-end',
      borderRightWidth: 1,
      borderRightColor: '#EEEEEE',
    },
    allergenCol: {
      width: '5%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      borderRightWidth: 1,
      borderRightColor: '#EEEEEE',
    },
    dishNameText: {
      fontSize: 8,
      color: '#333333',
    },
    allergenLabelText: {
      fontSize: 6,
      color: '#666666',
      textAlign: 'center',
    },
    footer: {
      position: 'absolute',
      bottom: 20,
      left: 30,
      right: 30,
      borderTopWidth: 1,
      borderTopColor: '#D4AF37',
      paddingTop: 10,
    },
    footerText: {
      fontSize: 8,
      color: '#666666',
      fontStyle: 'italic',
      textAlign: 'justify',
    }
  });

  const generatedDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (dishes.length === 0) {
    return (
      <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>FICHA TÉCNICA DE ALÉRGENOS</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#666666' }}>No hay platos configurados en la carta ni en el menú activo.</Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page} wrap>
        
        {/* Header */}
        <View style={styles.header} fixed>
          {logoData ? (
            <Image src={logoData} style={styles.logo} />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>El Balconet</Text>
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>FICHA TÉCNICA DE ALÉRGENOS</Text>
            <Text style={styles.subtitle}>DOCUMENTO DE DECLARACIÓN OBLIGATORIA (REGLAMENTO UE 1169/2011)</Text>
            <Text style={styles.subtitle}>Fecha de actualización: {generatedDate} | Total platos declarados: {dishes.length}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header Row */}
          <View style={[styles.tableRow, styles.tableHeader]} fixed>
            <View style={styles.dishNameCol}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#333333' }}>PLATO / PRODUCTO</Text>
            </View>
            {ALLERGEN_MAP.map((allergen, idx) => (
              <View key={allergen.id} style={[styles.allergenColHeader, idx === ALLERGEN_MAP.length - 1 && { borderRightWidth: 0 }]}>
                <AllergenHeaderIcon iconFile={allergen.iconFile} ImageComp={Image} allergenIcons={allergenIcons} />
                <Text style={styles.allergenLabelText}>{allergen.label}</Text>
              </View>
            ))}
          </View>

          {/* Table Data Rows (Grouped by Category) */}
          {dishes.reduce((acc: any[], dish, idx) => {
            const isNewCategory = idx === 0 || dish.categoryName !== dishes[idx - 1].categoryName;
            
            if (isNewCategory && dish.categoryName) {
              acc.push(
                <View key={`cat-${dish.categoryName}`} style={[styles.tableRow, styles.categoryHeader]} wrap={false}>
                  <Text style={styles.categoryHeaderText}>{dish.categoryName}</Text>
                </View>
              );
            }

            acc.push(
              <View key={dish.id} style={[styles.tableRow, idx % 2 !== 0 && { backgroundColor: '#FAFAFA' }]} wrap={false}>
                <View style={styles.dishNameCol}>
                  <Text style={styles.dishNameText}>{dish.name}</Text>
                </View>
                {ALLERGEN_MAP.map((allergen, aIdx) => {
                  const hasAllergen = dish.allergens.includes(allergen.id);
                  return (
                    <View key={`${dish.id}-${allergen.id}`} style={[styles.allergenCol, aIdx === ALLERGEN_MAP.length - 1 && { borderRightWidth: 0 }]}>
                      {hasAllergen ? (
                        <AllergenCheckIcon iconFile={allergen.iconFile} ImageComp={Image} allergenIcons={allergenIcons} />
                      ) : (
                        <Text style={{ color: '#E0E0E0', fontSize: 8 }}>-</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            );

            return acc;
          }, [])}
        </View>

        {/* Footer Legal Clause */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            AVISO LEGAL: De acuerdo con el Reglamento (UE) 1169/2011 sobre la información alimentaria facilitada al consumidor, se detalla en el presente documento la presencia de los 14 alérgenos de declaración obligatoria en los productos servidos por este establecimiento. Toda la información ha sido elaborada en base a los datos proporcionados por nuestros proveedores.
          </Text>
          <Text style={[styles.footerText, { marginTop: 4, fontWeight: 'bold', color: '#333333' }]}>
            ADVERTENCIA SOBRE CONTAMINACIÓN CRUZADA: Nuestro establecimiento elabora sus productos en unas únicas instalaciones preparadas para procesar alimentos. A pesar de aplicar buenas prácticas de manipulación, no podemos garantizar la ausencia absoluta de trazas derivadas de la contaminación cruzada en nuestra cocina. Por favor, comunique cualquier alergia o intolerancia a nuestro personal antes de realizar su pedido.
          </Text>
        </View>

      </Page>
    </Document>
  );
};
