import React from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function AvisoLegal() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <div className="pt-32 pb-20 max-w-4xl mx-auto px-6 font-sans">
        <h1 className="text-4xl md:text-5xl font-serif text-[#D4AF37] mb-8">Aviso Legal</h1>
        
        <div className="space-y-6 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Datos Identificativos</h2>
            <p>En cumplimiento con el deber de información recogido en artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSICE), se reflejan los siguientes datos:</p>
            <ul className="list-disc pl-6 mt-3 text-white/70 space-y-2">
              <li><strong>Titular:</strong> [NOMBRE_DE_LA_EMPRESA_O_AUTÓNOMO]</li>
              <li><strong>CIF/NIF:</strong> [CIF_O_NIF]</li>
              <li><strong>Dirección:</strong> [DIRECCIÓN_FÍSICA_DEL_RESTAURANTE]</li>
              <li><strong>Correo Electrónico:</strong> [CORREO_DE_CONTACTO]</li>
              <li><strong>Sitio Web:</strong> [INSERTAR_DOMINIO]</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Usuarios</h2>
            <p>El acceso y/o uso de este portal atribuye la condición de USUARIO, que acepta, desde dicho acceso y/o uso, las Condiciones Generales de Uso aquí reflejadas.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Uso del Portal</h2>
            <p>Este sitio web proporciona acceso a información y servicios de reserva (en adelante, "los contenidos") en Internet pertenecientes a El Balconet. El USUARIO asume la responsabilidad del uso del portal. El USUARIO se compromete a hacer un uso adecuado de los contenidos y servicios que se ofrecen a través de su portal y con carácter enunciativo pero no limitativo, a no emplearlos para incurrir en actividades ilícitas, ilegales o contrarias a la buena fe y al orden público.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Propiedad Intelectual e Industrial</h2>
            <p>El Balconet por sí o como cesionaria, es titular de todos los derechos de propiedad intelectual e industrial de su página web, así como de los elementos contenidos en la misma (a título enunciativo, imágenes, sonido, audio, vídeo, software o textos; marcas o logotipos, combinaciones de colores, estructura y diseño). Todos los derechos reservados.</p>
          </section>

        </div>
        
        <div className="mt-12 pt-8 border-t border-white/10 flex justify-center">
          <Link href="/" className="text-[#D4AF37] hover:text-white transition-colors uppercase tracking-widest text-sm font-bold">
            ← Volver a Inicio
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  )
}
