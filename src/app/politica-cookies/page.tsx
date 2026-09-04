import React from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PoliticaCookies() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <div className="pt-32 pb-20 max-w-4xl mx-auto px-6 font-sans">
        <h1 className="text-4xl md:text-5xl font-serif text-[#D4AF37] mb-8">Política de Cookies</h1>
        
        <div className="space-y-6 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. ¿Qué son las Cookies?</h2>
            <p>Una cookie es un fichero que se descarga en su equipo (ordenador, smartphone, tablet) al acceder a determinadas páginas web. Las cookies permiten a una página web, entre otras cosas, almacenar y recuperar información sobre los hábitos de navegación de un usuario o de su equipo y, dependiendo de la información que contengan y de la forma en que utilice su equipo, pueden utilizarse para reconocer al usuario.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Tipos de cookies utilizadas en esta web</h2>
            <p>El Balconet utiliza los siguientes tipos de cookies:</p>
            <ul className="list-disc pl-6 mt-3 text-white/70 space-y-4">
              <li><strong>Cookies Técnicas y Estrictamente Necesarias:</strong> Son aquellas que permiten al usuario la navegación a través de la página web y la utilización de las diferentes opciones o servicios que en ella existen, como, por ejemplo, el acceso seguro al "Panel de Sala" para empleados mediante token de sesión segura (NextAuth JWT) o el almacenamiento de su aceptación legal en el banner de cookies. Su uso es esencial para el funcionamiento de la web.</li>
              <li><strong>Cookies Analíticas (Opcionales):</strong> Si usted lo consiente en el banner de aviso, utilizamos herramientas de medición para entender cómo los usuarios interactúan con la página, a fin de mejorar la experiencia y las capacidades de nuestro servidor.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Revocación y Configuración</h2>
            <p>En cualquier momento puede revocar su consentimiento para el uso de cookies borrando el historial/caché de su navegador. También puede restringir, bloquear o borrar las cookies de El Balconet configurando las opciones del navegador instalado en su ordenador (Chrome, Firefox, Safari, Edge).</p>
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
