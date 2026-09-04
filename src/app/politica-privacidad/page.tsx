import React from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PoliticaPrivacidad() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <div className="pt-32 pb-20 max-w-4xl mx-auto px-6 font-sans">
        <h1 className="text-4xl md:text-5xl font-serif text-[#D4AF37] mb-8">Política de Privacidad</h1>
        
        <div className="space-y-6 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Información al Usuario</h2>
            <p>El Balconet es el Responsable del tratamiento de los datos personales del Usuario y le informa de que estos datos serán tratados de conformidad con lo dispuesto en el Reglamento (UE) 2016/679 de 27 de abril de 2016 (RGPD) y la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Finalidad del tratamiento</h2>
            <p>Sus datos personales recogidos a través del formulario de reservas, la integración TPV o el alta en el portal de fidelización serán utilizados exclusivamente para:</p>
            <ul className="list-disc pl-6 mt-3 text-white/70 space-y-2">
              <li>Gestionar y confirmar su reserva de mesa en el restaurante.</li>
              <li>Mantener el <strong>Programa de Fidelización Digital</strong>, lo que implica la lectura de visitas realizadas para asignación de saldo, puntos y recompensas en su perfil de cliente.</li>
              <li>Contactarle vía telefónica o WhatsApp en relación a su reserva (ej. modificaciones o avisos de lista de espera).</li>
              <li>Cumplir con las obligaciones legales aplicables.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Conservación de los datos</h2>
            <p><strong>A. Datos de Fidelidad:</strong> Sus datos vinculados al perfil de fidelidad se mantienen activos indefinidamente mientras usted siga siendo usuario. Si solicita el borrado de sus datos, su perfil y saldo virtual serán destruidos de los servidores de forma inmediata.</p>
            <p className="mt-3"><strong>B. Datos de Reservas:</strong> Los históricos de reservas de sala se mantienen para fines fiscales y registros contables de afluencia. Sin embargo, cumpliendo con la <em>Ley Orgánica de Protección de Datos</em>, al ejercer su <strong>Derecho al Olvido</strong>, nuestro sistema sobreescribirá su Nombre, Correo, Teléfono y Notas Personales con un pseudónimo irreversible ("Usuario Anonimizado"). Esto garantiza la desvinculación absoluta de su identidad manteniendo la integridad de nuestra contabilidad.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Derechos del Usuario (ARCO)</h2>
            <p>Usted tiene derecho a:</p>
            <ul className="list-disc pl-6 mt-3 text-white/70 space-y-2">
              <li>Retirar el consentimiento en cualquier momento.</li>
              <li><strong>Derecho de Acceso:</strong> Puede solicitar en cualquier momento un informe en PDF con el histórico completo de sus reservas y estado financiero en el sistema de Fidelidad.</li>
              <li><strong>Derecho de Supresión (Derecho al Olvido):</strong> Eliminación y anonimización de su huella digital en nuestros servidores de forma automática e irreversible.</li>
              <li>Presentar una reclamación ante la autoridad de control (aepd.es) si considera que el tratamiento no se ajusta a la normativa vigente.</li>
            </ul>
            <p className="mt-4">Para ejercer sus derechos (Extraer Datos o Borrado Global), por favor escriba a la dirección del restaurante: <strong>info@elbalconet.es</strong> especificando el número de teléfono con el que hizo las reservas o se dio de alta.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Proveedores Tecnológicos y Servidores (Encargado del Tratamiento)</h2>
            <p>Para la total garantía técnica del sistema de reservas, El Balconet delega la estructura del motor web en la plataforma integral para la hostelería <strong>Gastrova</strong> (gastrova.es), operando en calidad de "Encargado del Tratamiento".</p>
            <p className="mt-2">Sus datos se guardan codificados en servidores modernos de bases de datos sujetos estrictamente a la jurisdicción de la UE. Gastrova no posee derechos comerciales ni explotará los teléfonos o correos registrados por usted en este porta; su papel se limita escrupulosa y unicamente a mantener viva y fluida la tecnología de reservas para el restaurante.</p>
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
