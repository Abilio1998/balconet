import React from 'react';
import fs from 'fs';
import path from 'path';

// Types
export interface Dish {
  id: string;
  name: string;
  name_ca?: string | null;
  name_en?: string | null;
  name_fr?: string | null;
  description: string;
  description_ca?: string | null;
  description_en?: string | null;
  description_fr?: string | null;
  course: 'first' | 'second' | 'dessert';
  supplement?: number;
  allergens?: string[];
}

export interface DailyMenu {
  id: string;
  date: string;
  price: number;
  price_exterior?: number;
  is_holiday?: boolean;
  dishes: Dish[];
}

interface MenuPDFProps {
  menu: DailyMenu;
  lang: string;
  logoData?: any;
  ReactPdf: any;
}

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
      Font.register({
        family: 'Georgia',
        fonts: fontSources as any
      });
      (global as any)[FONT_REGISTER_KEY] = true;
    } catch (e) {
      console.warn('Error registering fonts:', e);
    }
  }
};

const goldColor = '#D4AF37';
const lightGray = '#666666';

const COURSE_LABELS: any = {
  es: { first: 'PRIMEROS PLATOS', second: 'SEGUNDOS PLATOS', dessert: 'PARA ACABAR UN TOQUE DULCE...', firstDaily: 'PRIMEROS A ELEGIR', secondDaily: 'SEGUNDOS A ELEGIR', dessertDaily: 'POSTRES', subtitleDaily: '(HORARIO DE MENÚ DE LUNES A VIERNES DE 13:00H A 16:00H)', titleDaily: 'MENÚ DIARIO', titleWeekend: 'CAPS DE SETMANA - FIN DE SEMANA', price: 'PRECIO', terrace: 'TERRAZA', tax: 'IVA INCLUIDO', includesDaily: 'Incluye: pan, bebida, postre o café', includesWeekend: 'Incluye: pan de la casa (bebida no incluida)', turiaNoteDaily: 'Turia y carajillos 1,50€ más', allergy: 'AVISO: personas con alergias o intolerancias. Consulte a nuestro personal', terraceLabel: 'TERRAZA' },
  ca: { first: 'PRIMERS PLATS', second: 'SEGONS PLATS', dessert: 'PER ACABAR UN TOC DOLÇ...', firstDaily: 'PRIMER A TRIAR', secondDaily: 'SEGONS A TRIAR', dessertDaily: 'POSTRES', subtitleDaily: '(HORARI DE MENU DE DILLUNS A DIVENDRES DE 13:00H A 16:00H)', titleDaily: 'MENÚ DIARI', titleWeekend: 'CAPS DE SETMANA - FIN DE SEMANA', price: 'PREU', terrace: 'TERRASSA', tax: 'IVA INCLÒS', includesDaily: 'Inclou: pa, 1 beguda per cap, postre o cafè', includesWeekend: 'Inclou: pa de la casa (beguda no inclosa)', turiaNoteDaily: 'Turia i carajillos 1,50€ més', allergy: 'AVÍS: persones amb al·lèrgies o intoleràncies. Consulteu al nostre personal', terraceLabel: 'TERRASSA' },
  en: { first: 'FIRST COURSES', second: 'MAIN COURSES', dessert: 'TO FINISH WITH A SWEET TOUCH...', firstDaily: 'FIRST TO CHOOSE', secondDaily: 'MAIN TO CHOOSE', dessertDaily: 'DESSERTS', subtitleDaily: '(MENU SERVED MONDAY TO FRIDAY FROM 1:00 PM TO 4:00 PM)', titleDaily: 'DAILY MENU', titleWeekend: 'WEEKEND SPECIAL', price: 'PRICE', terrace: 'TERRACE', tax: 'VAT INCL.', includesDaily: 'Includes: bread, drink, dessert or coffee', includesWeekend: 'Includes: house bread (drink not included)', turiaNoteDaily: 'Turia and carajillos +1.50€', allergy: 'NOTICE: people with allergies or intolerances. Please consult our staff', terraceLabel: 'TERRACE' },
  fr: { first: 'ENTRÉES', second: 'PLATS PRINCIPAUX', dessert: 'POUR FINIR SUR UNE NOTE DOUCE...', firstDaily: 'PREMIER AU CHOIX', secondDaily: 'DEUXIÈME AU CHOIX', dessertDaily: 'DESSERTS', subtitleDaily: '(MENU SERVI DU LUNDI AU VENDREDI DE 13H00 À 16H00)', titleDaily: 'MENU DU JOUR', titleWeekend: 'SPÉCIAL WEEK-END', price: 'PRIX', terrace: 'TERRASSE', tax: 'TVA INCLUSE', includesDaily: 'Comprend : pain, boisson, dessert o café', includesWeekend: 'Comprend : pain maison (boisson non incluse)', turiaNoteDaily: 'Turia et carajillos +1,50€', allergy: 'AVIS : personnes allergiques ou intolérantes. Veuillez consulter notre personnel', terraceLabel: 'TERRASSE' }
};

const AllergenIcon = ({ id, ImageComp }: { id: string, ImageComp: any }) => {
  const map: any = {
    gluten: "cereales", crustaceans: "crustaceo", eggs: "huevos", fish: "pescado",
    peanuts: "cacahuetes", soybeans: "soja", dairy: "lacteos", nuts: "frutos-secos",
    celery: "apio", mustard: "mostaza", sesame: "sesamo", sulphites: "sulfitos",
    lupin: "altramuz", molluscs: "moluscos"
  };

  const fileName = map[id];
  if (!fileName) return null;

  const iconPath = path.join(process.cwd(), "public", "Alergenos", `${fileName}.png`);
  if (!fs.existsSync(iconPath)) return null;

  try {
    const imageBuffer = fs.readFileSync(iconPath);
    return <ImageComp src={imageBuffer as any} style={{ width: 16, height: 16, marginLeft: 6, marginBottom: -2 }} />;
  } catch (e) {
    return null;
  }
};

const FooterIcon = ({ file, ImageComp }: { file: string, ImageComp: any }) => {
  const iconPath = path.join(process.cwd(), "public", "icons", file);
  if (!fs.existsSync(iconPath)) return null;

  try {
    const buffer = fs.readFileSync(iconPath);
    return <ImageComp src={buffer as any} style={{ width: 10, height: 10, marginRight: 4 }} />;
  } catch (e) {
    return null;
  }
};

export const MenuPDF = ({ menu, lang, logoData, ReactPdf }: MenuPDFProps) => {
  const { Document, Page, Text, View, StyleSheet, Font, Image, Svg, Rect, Defs, LinearGradient, Stop } = ReactPdf;

  const totalDishes = menu.dishes.length;
  
  const isWeekend = new Date(menu.date).getDay() === 0 || new Date(menu.date).getDay() === 6 || menu.is_holiday;
  
  // Dynamic Scaling Logic for Super Aesthetics (handles up to 21 dishes flawlessly for weekday)
  let dishNameSize = 10.5;
  let dishDescSize = 8.5;
  let dishMargin = 8;
  let courseTitleSize = 13.5;
  let courseTitleMargin = 12;
  let mainPadding = 25; 
  let mainJustify: 'space-around' | 'center' | 'space-between' | 'flex-start' = 'space-between';
  let courseMarginBottom = 0;

  // Unified scaling logic for both menus
  if (totalDishes >= 21) {
    dishNameSize = 10;
    dishDescSize = 8.5;
    dishMargin = 3.5;
    courseTitleSize = 13;
    courseTitleMargin = 4;
    mainPadding = 0;
    mainJustify = 'flex-start';
    courseMarginBottom = 8;
  } else if (totalDishes >= 19) {
    dishNameSize = 10.5;
    dishDescSize = 9;
    dishMargin = 5;
    courseTitleSize = 14;
    courseTitleMargin = 6;
    mainPadding = 5;
    mainJustify = 'flex-start';
    courseMarginBottom = 12;
  } else if (totalDishes >= 15) {
    dishNameSize = 11.5;
    dishDescSize = 9.5;
    dishMargin = 6;
    courseTitleSize = 15;
    courseTitleMargin = 8;
    mainPadding = 10;
    mainJustify = 'flex-start';
    courseMarginBottom = 16;
  } else if (totalDishes >= 11) {
    dishNameSize = 12.5;
    dishDescSize = 10;
    dishMargin = 7;
    courseTitleSize = 16;
    courseTitleMargin = 10;
    mainPadding = 15;
    mainJustify = 'flex-start';
    courseMarginBottom = 20;
  } else if (totalDishes >= 8) {
    dishNameSize = 13.5;
    dishDescSize = 10.5;
    dishMargin = 9;
    courseTitleSize = 17.5;
    courseTitleMargin = 12;
    mainPadding = 25;
    mainJustify = 'flex-start';
    courseMarginBottom = 25;
  } else {
    dishNameSize = 15;
    dishDescSize = 11.5;
    dishMargin = 13;
    courseTitleSize = 19;
    courseTitleMargin = 16;
    mainPadding = 35;
    mainJustify = 'flex-start';
    courseMarginBottom = 30;
  }

  const styles = StyleSheet.create({
    page: {
      paddingTop: 190,
      paddingBottom: 52,
      paddingLeft: 45,
      paddingRight: 45,
      fontFamily: 'Georgia',
      position: 'relative',
      backgroundColor: '#FFFFFF',
      flexDirection: 'column'
    },
    logoContainer: {
      position: 'absolute',
      top: 2,
      left: 0,
      right: 0,
      alignItems: 'center'
    },
    logoBox: {
      padding: 10,
      backgroundColor: '#FFFFFF',
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 120
    },
    logo: {
      width: 90,
      height: 56,
    },
    header: {
      alignItems: 'center',
      marginBottom: totalDishes > 16 ? 5 : 10
    },
    title: {
      fontSize: 18,
      textAlign: 'center',
      color: '#D4AF37',
      fontWeight: 'bold',
      letterSpacing: 1.5,
      marginBottom: 2
    },
    goldLineContainer: {
      width: '100%',
      alignItems: 'center',
      marginBottom: totalDishes > 16 ? 8 : 15
    },
    mainContent: {
      flex: 1,
      justifyContent: mainJustify,
      paddingVertical: mainPadding
    },
    courseSection: {
      alignItems: 'center',
      marginBottom: courseMarginBottom
    },
    courseTitle: {
      // Replaced by inline styles for simpler rendering without SVG
    },
    dishItem: {
      marginBottom: dishMargin,
      alignItems: 'center',
      width: '95%'
    },
    dishName: {
      fontSize: dishNameSize,
      textAlign: 'center',
      color: '#333333'
    },
    dishDesc: {
      fontSize: dishDescSize,
      color: lightGray,
      textAlign: 'center',
      marginTop: 2,
      fontStyle: 'italic'
    },
    priceSection: {
      alignItems: 'center',
      paddingTop: totalDishes > 16 ? 6 : 12,
      paddingBottom: 8,
      marginBottom: totalDishes > 16 ? 10 : 20
    },
    priceText: {
      fontSize: 9.5,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#333333'
    },
    footer: {
      position: 'absolute',
      bottom: 18,
      left: 45,
      right: 45,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 8
    },
    footerItem: {
      fontSize: 7,
      color: lightGray
    },
  });

  const formatText = (str: string) => {
    if (!str) return '';
    const clean = str.trim();
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  };

  registerFonts(Font);

  // We already calculated isWeekend above
  const labels = COURSE_LABELS[lang] || COURSE_LABELS.es;

  let finalLogo = logoData;
  if (!finalLogo) {
    const localLogoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(localLogoPath)) {
      try {
        finalLogo = fs.readFileSync(localLogoPath);
      } catch (e) {
        console.warn('Error reading logo file:', e);
      }
    }
  }

  let bgBuffer: any = null;
  const bgPath = path.join(process.cwd(), "public", "menu_diario_bg.jpeg");
  if (!isWeekend && fs.existsSync(bgPath)) {
    try {
      bgBuffer = fs.readFileSync(bgPath);
    } catch (e) {
      console.warn('Error reading background file:', e);
    }
  }

  let bgBufferWeekend: any = null;
  const bgPathWeekend = path.join(process.cwd(), "public", "menu_fin_de_semana_bg.jpeg");
  if (isWeekend && fs.existsSync(bgPathWeekend)) {
    try {
      bgBufferWeekend = fs.readFileSync(bgPathWeekend);
    } catch (e) {
      console.warn('Error reading weekend background file:', e);
    }
  }
  
  const activeBgBuffer = isWeekend ? bgBufferWeekend : bgBuffer;



  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {activeBgBuffer && (
          <View fixed style={{ position: 'absolute', top: 15, left: 15, right: 15, bottom: 15, zIndex: -2 }}>
            <Image 
              src={activeBgBuffer} 
              style={{ width: '100%', height: '100%' }} 
            />
          </View>
        )}

        <View style={[styles.header, { marginBottom: courseMarginBottom / 2 }]}>
          {isWeekend ? null : (
            <Text style={{
              fontSize: 10.5,
              textAlign: 'center',
              color: '#4A4A4A',
              fontWeight: 'normal',
              letterSpacing: 1.5,
              fontFamily: 'Georgia'
            }}>
              {labels.subtitleDaily}
            </Text>
          )}
        </View>

        <View style={styles.mainContent}>
          {(['first', 'second', 'dessert'] as const).map((course) => {
            const courseDishes = menu.dishes.filter((d) => d.course === course);
            if (courseDishes.length === 0) return null;
            
            const courseLabel = isWeekend 
              ? labels[course] 
              : labels[`${course}Daily`];

            return (
              <View key={course} style={styles.courseSection}>
                <Text style={{
                    fontSize: courseTitleSize,
                    fontWeight: 'bold',
                    color: '#B58E33',
                    letterSpacing: 1.5,
                    marginBottom: courseTitleMargin,
                    textAlign: 'center',
                    fontFamily: 'Georgia'
                }}>
                  {courseLabel}
                </Text>
                {courseDishes.map((dish, i) => {
                  const dishNameRaw = lang === 'es' ? dish.name : (dish[`name_${lang as 'ca' | 'en' | 'fr'}`] || dish.name);
                  const dishDescRaw = lang === 'es' ? dish.description : (dish[`description_${lang as 'ca' | 'en' | 'fr'}`] || dish.description);
                  const supplementText = dish.supplement && dish.supplement > 0 ? ` (+${dish.supplement.toFixed(2)}€)` : '';

                  const dishName = formatText(dishNameRaw);
                  const dishDesc = dishDescRaw ? formatText(dishDescRaw) : '';

                  return (
                    <View key={i} style={styles.dishItem} wrap={false}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Text style={styles.dishName}>{dishName + supplementText}</Text>
                        {dish.allergens?.map(allergenId => (
                          <AllergenIcon key={allergenId} id={allergenId} ImageComp={Image} />
                        ))}
                      </View>
                      {dishDesc && <Text style={styles.dishDesc}>{`(${dishDesc})`}</Text>}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

        <View style={styles.priceSection}>
          <Text style={{ fontSize: 10.5, color: '#4A4A4A', fontStyle: 'italic', marginBottom: !isWeekend ? 2 : 6, fontFamily: 'Georgia' }}>
            {formatText(isWeekend ? labels.includesWeekend : labels.includesDaily)}
          </Text>
          {!isWeekend && labels.turiaNoteDaily ? (
            <Text style={{ fontSize: 9, color: '#4A4A4A', fontStyle: 'italic', marginBottom: 6, fontFamily: 'Georgia' }}>
              {labels.turiaNoteDaily}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, color: '#2A2A2A', fontWeight: 'bold', fontFamily: 'Georgia' }}>
              {formatText(labels.price)}: {menu.price.toFixed(2)}€
            </Text>
            {menu.price_exterior ? (
              <>
                <Text style={{ fontSize: 13, color: '#B58E33', marginHorizontal: 8, fontFamily: 'Georgia' }}>|</Text>
                <Text style={{ fontSize: 13, color: '#2A2A2A', fontWeight: 'bold', fontFamily: 'Georgia' }}>
                  {formatText(labels.terraceLabel)}: {menu.price_exterior.toFixed(2)}€
                </Text>
              </>
            ) : null}
            <Text style={{ fontSize: 9.5, color: '#666666', marginLeft: 6, fontFamily: 'Georgia' }}>
              ({formatText(labels.tax)})
            </Text>
          </View>
        </View>


      </Page>
    </Document>
  );
};
