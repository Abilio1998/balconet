export const BRAND_CONFIG = {
  // --------------------------------------------------------------------------
  // SWITCH THIS TO 'true' TO RECORD THE DEMO VIDEO WITHOUT THE RESTAURANT BRAND
  // --------------------------------------------------------------------------
  isDemoMode: false,

  real: {
    name: "El Balconet",
    fullName: "El Balconet Restaurant",
    logo: "/logo.png",
    address: "Torrent Mateu Mas, 31, 08338 Premià de Dalt, Barcelona",
    phone: "679 12 10 45",
    phoneUrl: "tel:+34679121045",
    instagram: "https://www.instagram.com/elbalconet_premiadedalt/",
    facebook: "https://www.facebook.com",
    metaTitle: "El Balconet | Restaurant en Premià de Dalt",
    metaDescription: "Cocina mediterránea auténtica con vistas al mar en Premià de Dalt. Disfruta de nuestra terraza, platos para compartir y producto local en el Maresme. El lugar ideal para celebrar.",
    aboutYear: "2020",
    aboutLocation: "Premià de Dalt",
    aboutDescription: "El Balconet de Premià de Dalt es un restaurante de cocina mediterránea con una propuesta basada en producto local, cocina honesta y platos pensados para disfrutar y compartir. Un espacio rodeado de naturaleza, con zonas exteriores y vistas al mar, que transmite una sensación tranquila y familiar. La comida como punto de encuentro, combinando gastronomía, naturaleza y celebración.",
    tagline: "Restaurant · Terrassa · Celebracions",
    googleMapsLink: "https://maps.google.com/?q=Torrent+Mateu+Mas+31,+08338+Premià+de+Dalt,+Barcelona",
    googleMapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2985.0!2d2.37!3d41.52!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDMxJzEyLjAiTiAywrAyMicxMi4wIkU!5e0!3m2!1ses!2ses",
    groupName: "Grup El Balconet",
    groupRestaurants: [
      { name: 'El Balconet', city: 'Premià de Dalt', desc: 'Nuestra sede principal con más de un siglo de tradición mediterránea.' },
      { name: 'El Balconet', city: 'Premià de Dalt', desc: 'Vistas al mar, terraza y cocina de proximidad.' },
      { name: 'Restaurant Sant Jaume', city: 'Premià de Dalt', desc: 'Tradición y sabor en el corazón del pueblo.' }
    ]
  },

  demo: {
    name: "Mediterranean Grill",
    fullName: "Restaurant & Gastronomy Experience",
    logo: null, // If null, we'll show a generic text/icon logo
    address: "Calle de la Gastronomía, 42, 08001 Barcelona",
    phone: "600 000 000",
    phoneUrl: "tel:+34600000000",
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    metaTitle: "Mediterranean Grill | Gourmet Experience",
    metaDescription: "Authentic Mediterranean cuisine with fresh local ingredients. The perfect place for your lunch and dinner.",
    aboutYear: "2010",
    aboutLocation: "Barcelona",
    aboutDescription: "Our restaurant is a haven for authentic Mediterranean flavors. With years of tradition, we invite you to enjoy our terrace and our local gastronomic offer, where quality and passion meet.",
    tagline: "Premium Gastronomy",
    googleMapsLink: "https://maps.google.com",
    googleMapsEmbed: null, // We'll show a placeholder in demo mode
    groupName: "Mediterranean Gourmet Group",
    groupRestaurants: [
      { name: 'The Grill House', city: 'Barcelona', desc: 'Premium steaks and local flavors.' },
      { name: 'Sea Breeze', city: 'Costa Brava', desc: 'Fresh seafood and relaxed atmosphere.' }
    ]
  }
}

/**
 * Accessor to get the current brand configuration based on the mode
 */
export const getBrand = () => {
  return BRAND_CONFIG.isDemoMode ? BRAND_CONFIG.demo : BRAND_CONFIG.real
}
