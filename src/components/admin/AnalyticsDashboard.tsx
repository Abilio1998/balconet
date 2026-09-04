'use client'

import { useState, useEffect } from 'react'
import { Calendar, Users, TrendingUp, Star, Heart, ExternalLink, MousePointer2, Camera, Loader2 as LoaderIcon, Download, FileText, BarChart3, Info, RefreshCw, Trash2, ShieldCheck, ShieldAlert, Lock, AlertTriangle, X, QrCode, Gift, Flame, Sun, Moon, Euro, UtensilsCrossed } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useI18n } from '@/context/I18nContext'
import dynamic from 'next/dynamic'
const BillingTab = dynamic(() => import('./BillingTab'), { ssr: false })

type StatSummary = {
  totalPax: number
  mostReservedDay: string
  topDate: string
  topHour: string
  topDish: string
  reservationsCount: number
  totalVisits: number
  googleReviewClicks: number
}

type DayStat = {
  day: string
  count: number
}

type Product = {
  id: string
  name: string
  likes_count: number
  is_featured?: boolean
  is_web_featured?: boolean
  image_url?: string | null
  daily_menus?: { date: string }
}

type EngagementStat = {
  section: string
  averageTime: number
  totalTime: number
  visits: number
  likes?: number
  topLikedProducts?: { name: string, likes: number }[]
}

export default function AnalyticsDashboard({ userRole }: { userRole?: string }) {
  const { t } = useI18n()
  const [stats, setStats] = useState<{
    summary: StatSummary
    dayStats: DayStat[]
    topProducts: Product[]
    topMenuDishes?: Product[]
    unlikedProducts?: Product[]
    unlikedMenuDishes?: Product[]
    topReferrers: { name: string, count: number }[]
    topAllergens: { id: string, count: number }[]
    topAllergensByShift?: {
      morning: { id: string, count: number }[]
      evening: { id: string, count: number }[]
    }
    featuredProduct?: Product
    engagementStats?: EngagementStat[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<string>('month')
  const [dateInput, setDateInput] = useState<string>('')
  const [uploading, setUploading] = useState<string | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showAllLikesModal, setShowAllLikesModal] = useState(false)
  const [resetType, setResetType] = useState<'analytics' | 'reservations'>('analytics')
  const [resetPassword, setResetPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'stats' | 'strategy' | 'billing'>('stats')
  const [refreshing, setRefreshing] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [engagementShift, setEngagementShift] = useState<'all' | 'morning' | 'evening'>('all')
  const [allergenShift, setAllergenShift] = useState<'all' | 'morning' | 'evening'>('all')

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const sectionNamesMap: Record<string, string> = {
    home: 'Inicio / Bienvenida',
    about: 'Nuestra Historia',
    featured: 'Plato Estrella',
    menu: 'Menú del Día',
    carta: 'La Carta (General)',
    reviews: 'Reseñas de Clientes',
    contact: 'Contacto y Mapa'
  }

  const getSectionNameStr = (sec: string) => {
    if (sec.startsWith('cat-')) return 'Carta: ' + sec.replace('cat-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    return sectionNamesMap[sec] || sec
  }

  const sortedEngagement = stats?.engagementStats
    ? [...stats.engagementStats].sort((a, b) => {
        const scoreA = ((a.averageTime * a.visits) / 10) + ((a.likes || 0) * 15)
        const scoreB = ((b.averageTime * b.visits) / 10) + ((b.likes || 0) * 15)
        return scoreB - scoreA
      })
    : [];

  const mostVisited = sortedEngagement.length > 0
    ? sortedEngagement.reduce((prev, current) => (prev.visits > current.visits) ? prev : current)
    : null;

  const highestRetention = sortedEngagement.length > 0
    ? sortedEngagement.reduce((prev, current) => (prev.averageTime > current.averageTime) ? prev : current)
    : null;

  const getRecommendationText = (eng: any, type: 'visits' | 'retention') => {
    if (!eng) return '';
    const isFoodSection = eng.section.startsWith('cat-') || eng.section === 'menu' || eng.section === 'carta' || eng.section === 'featured';

    if (type === 'visits') {
      if (eng.section === 'home') return `Esta es la primera impresión (${eng.visits} clics). Aprovecha este tráfico inyectando aquí tu producto más rentable o promocionando el plato estrella.`;
      if (eng.section === 'contact') return `Gran cantidad de usuarios buscan cómo llegar o reservar (${eng.visits} visitas). Asegúrate de que el botón de reservas, el teléfono y el horario sean sumamente claros y visibles.`;
      if (eng.section === 'reviews') return `Las opiniones de otros atraen mucho tráfico (${eng.visits} visitas). Usa tus mejores reseñas en redes sociales, el "boca a boca" digital es tu mayor activo aquí.`;
      if (eng.section === 'about') return `Tu historia genera interés inicial (${eng.visits} visitas). Es clave para conectar emocionalmente con el cliente antes de que vea los precios.`;
      if (isFoodSection) return `Esta es tu sección gastronómica más popular (${eng.visits} visitas). Aprovecha este escaparate para colocar primero los platos con mayor margen de beneficio, ya que tienes la atención garantizada.`;
      return `Sección muy popular (${eng.visits} visitas). Analiza qué atrae tanto a los usuarios aquí.`;
    } else {
      // Retention
      if (eng.section === 'home') return `Los clientes se quedan mucho tiempo en la portada (${eng.averageTime.toFixed(1)}s). Asegúrate de que el mensaje principal sea muy claro y no confuso.`;
      if (eng.section === 'contact') return `Pasan mucho tiempo en el contacto/mapa (${eng.averageTime.toFixed(1)}s promedio). Podría indicar que tienen dudas sobre cómo llegar o dónde aparcar. Considera añadir indicaciones claras sobre el aparcamiento cercano.`;
      if (eng.section === 'reviews') return `Leen detenidamente las reseñas (${eng.averageTime.toFixed(1)}s promedio). Buscan validación antes de reservar. Responde siempre a las opiniones (buenas y malas) para transmitir profesionalidad.`;
      if (eng.section === 'about') return `Tu historia los atrapa (${eng.averageTime.toFixed(1)}s promedio). Considera añadir detalles sobre proveedores locales o el origen de los ingredientes para justificar precios más premium.`;
      if (isFoodSection) return `Exploran detenidamente esta parte del menú (${eng.averageTime.toFixed(1)}s promedio). Esto indica un alto deseo de compra o indecisión. Asegúrate de que las descripciones sean apetecibles, usa fotos de alta calidad y considera hacer pruebas subiendo sutilmente los precios de los productos más demandados aquí.`;
      return `Alta retención en esta sección (${eng.averageTime.toFixed(1)}s). El contenido es muy interesante para ellos.`;
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/admin/dashboard-stats?range=${range}`)
      const data = await r.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [range])

  useEffect(() => {
    if (range.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setDateInput(range)
    } else {
      setDateInput('')
    }
  }, [range])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleReset = async () => {
    if (!resetPassword) return
    setResetLoading(true)
    setResetError(null)

    try {
      const res = await fetch('/api/admin/reset-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPassword, type: resetType })
      })
      const data = await res.json()

      if (res.ok) {
        setShowResetModal(false)
        setResetPassword('')
        fetchData() // Refresh to show zeros
      } else {
        setResetError(data.error || 'Error al resetear')
      }
    } catch (err) {
      setResetError('Error de conexión')
    } finally {
      setResetLoading(false)
    }
  }

  const generateQRKitPDF = async (type: 'menu' | 'loyalty') => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: type === 'menu' ? 'a6' : 'a5'
    })

    setUploading(type === 'menu' ? 'qr-menu' : 'qr-loyalty')

    try {
      const qrData = type === 'menu'
        ? `${window.location.origin}/menu?src=qr`
        : `${window.location.origin}/fidelidad`

      const qrUrl = `/api/admin/proxy-qr?data=${encodeURIComponent(qrData)}&t=${Date.now()}`

      if (type === 'loyalty') {
        // --- DISEÑO FLYER FIDELIDAD (LUXURY MINIMALIST & HIGH CONVERSION) ---
        // Fondo elegante oscuro infinito
        doc.setFillColor(10, 10, 12)
        doc.rect(0, 0, 148, 210, 'F')

        // Elemento gráfico superior - Círculos Coaxiales finos
        doc.setDrawColor(212, 175, 55)
        doc.setLineWidth(0.1)
        for (let i = 0; i < 6; i++) {
          doc.circle(74, 0, 30 + (i * 3), 'S')
        }

        // Título de Lujo (Espaciado focalizado)
        doc.setTextColor(212, 175, 55)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('C L U B    E X C L U S I V O', 74, 30, { align: 'center' })

        // Marca Principal
        doc.setTextColor(255, 255, 255)
        doc.setFont('serif', 'bold')
        doc.setFontSize(26)
        doc.text('EL BALCONET', 74, 45, { align: 'center' })

        // Slogan / Value Proposition Central
        doc.setTextColor(212, 175, 55)
        doc.setFont('serif', 'italic')
        doc.setFontSize(18)
        doc.text('Más que una cena, una experiencia.', 74, 57, { align: 'center' })

        // Separador Minimalista
        doc.setDrawColor(100, 100, 100)
        doc.setLineWidth(0.1)
        doc.line(64, 66, 84, 66)

        // Beneficios (Usando caracteres seguros para la fuente base de jsPDF y centrados)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)
        doc.setTextColor(220, 220, 220)

        doc.text('Acumula saldo gratuito en cada visita.', 74, 80, { align: 'center' })
        doc.text('Acceso privado a comidas o cenas.', 74, 88, { align: 'center' })
        doc.text('Disfruta de sorpresas y detalles de la casa.', 74, 96, { align: 'center' })

        // El marco del código QR - Detalles angulares premium
        doc.setFillColor(255, 255, 255)
        doc.setDrawColor(212, 175, 55)
        doc.setLineWidth(0.6)

        // Esquina Superior Izquierda
        doc.line(34, 110, 42, 110)
        doc.line(34, 110, 34, 118)
        // Esquina Superior Derecha
        doc.line(114, 110, 106, 110)
        doc.line(114, 110, 114, 118)
        // Esquina Inferior Izquierda
        doc.line(34, 190, 42, 190)
        doc.line(34, 190, 34, 182)
        // Esquina Inferior Derecha
        doc.line(114, 190, 106, 190)
        doc.line(114, 190, 114, 182)

        // Caja blanca del QR
        doc.roundedRect(36, 112, 76, 76, 1, 1, 'F')
        const qrImg = await loadImage(qrUrl)
        doc.addImage(qrImg, 'PNG', 39, 115, 70, 70)

        // Franja Dorada Inferior Sensación Urgencia / CTA Puro
        doc.setFillColor(212, 175, 55)
        doc.rect(0, 198, 148, 12, 'F')

        doc.setTextColor(10, 10, 10)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('COMIENZA AHORA  -  ESCANEA EL CÓDIGO', 74, 206, { align: 'center' })

        doc.save('QR_Mesa_Fidelidad_ElBalconet.pdf')

      } else {
        // --- DISEÑO FLYER CARTA (CLÁSICO, ELEGANTE) A6 ---
        // Background - Elegant Dark
        doc.setFillColor(10, 10, 10)
        doc.rect(0, 0, 105, 148, 'F')

        // Border
        doc.setDrawColor(212, 175, 55)
        doc.setLineWidth(0.5)
        doc.rect(4, 4, 97, 140)

        doc.setTextColor(212, 175, 55)
        doc.setFont('serif', 'bold')
        doc.setFontSize(18)
        doc.text('EL BALCONET', 52.5, 21, { align: 'center' })

        doc.setTextColor(255, 255, 255)
        doc.setFont('serif', 'bold')
        doc.setFontSize(16)
        doc.text('La nostra gastronomia', 52.5, 39, { align: 'center' })

        doc.setDrawColor(212, 175, 55)
        doc.setLineWidth(0.3)
        doc.line(38, 44, 67, 44)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(180, 180, 180)
        doc.text('Escaneja per descobrir el nostre Menú del Dia', 52.5, 53, { align: 'center' })
        doc.text('elaborat amb productes frescos del Maresme', 52.5, 58, { align: 'center' })
        doc.text("i la nostra selecció de tapes d'autor.", 52.5, 63, { align: 'center' })

        // QR Code Container
        doc.setFillColor(255, 255, 255)
        doc.roundedRect(27.5, 71, 50, 50, 2, 2, 'F')

        const qrImg = await loadImage(qrUrl)
        doc.addImage(qrImg, 'PNG', 31, 74.5, 43, 43)

        // Footer
        doc.setTextColor(212, 175, 55)
        doc.setFontSize(12)
        doc.setFont('serif', 'bold')
        doc.text('Bon profit!', 52.5, 129, { align: 'center' })

        doc.setFontSize(7)
        doc.setTextColor(100, 100, 100)
        doc.setFont('helvetica', 'normal')
        doc.text('EL BALCONET RESTAURANT', 52.5, 136, { align: 'center' })
        doc.text('Torrent Mateu Mas, 31, 08338 Premià de Dalt, Barcelona', 52.5, 140, { align: 'center' })

        doc.save('QR_Mesa_Carta_ElBalconet.pdf')
      }
    } catch (err) {
      console.error('Error generating QR Kit:', err)
      alert('Error al generar el PDF del QR')
    } finally {
      setUploading(null)
    }
  }

  const loadImage = async (url: string): Promise<string> => {
    // Add bypass for fetch cache too
    const response = await fetch(url, { cache: 'no-store' })
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const handleExportPerformancePDF = () => {
    if (!stats) return
    const doc = new jsPDF()
    const now = new Date().toLocaleString('es-ES')
    const rangeText = range === 'day' ? 'Hoy' : range === 'yesterday' ? 'Ayer' : range === 'week' ? 'Últimos 7 días' : range === 'month' ? 'Últimos 30 días' : 'Último Año'

    // Header
    doc.setFillColor(17, 17, 17)
    doc.rect(0, 0, 210, 40, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(212, 175, 55)
    doc.text('EL BALCONET', 14, 25)

    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text(`DASHBOARD DE RENDIMIENTO - ${rangeText.toUpperCase()}`, 14, 33)

    doc.setTextColor(150, 150, 150)
    doc.text(`Generado el: ${now}`, 140, 33)

    // KPI Section
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.text('Resumen de Rendimiento', 14, 55)

    autoTable(doc, {
      startY: 60,
      head: [['Métrica', 'Valor', 'Detalle']],
      body: [
        ['Visitas Totales', `${stats.summary.totalVisits}`, 'Usuarios únicos en la web'],
        ['Total Comensales (PAX)', `${stats.summary.totalPax}`, `En ${stats.summary.reservationsCount} reservas`],
        ['Tasa de Conversión', `${((stats.summary.reservationsCount / (stats.summary.totalVisits || 1)) * 100).toFixed(1)}%`, 'Visitas que reservan'],
        ['Día con más éxito', stats.summary.mostReservedDay, 'Mayor afluencia histórica'],
        ['Plato Estrella', stats.summary.topDish, 'Más valorado por clientes'],
        ['Clics Reseñas Google', `${stats.summary.googleReviewClicks || 0}`, 'Redirecciones a Google Maps']
      ],
      headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0] },
      styles: { font: 'helvetica', fontSize: 10 }
    })

    // Weekly Chart Table
    if (stats.dayStats && stats.dayStats.length > 0) {
      doc.text('Afluencia por Día de la Semana', 14, (doc as any).lastAutoTable.finalY + 15)
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Día', 'Comensales (PAX)']],
        body: stats.dayStats.map(d => [d.day, d.count]),
        headStyles: { fillColor: [60, 60, 60] },
        styles: { font: 'helvetica' }
      })
    }

    // Origin Table
    if (stats.topReferrers && stats.topReferrers.length > 0) {
      doc.text('Orígenes de Tráfico (Marketing)', 14, (doc as any).lastAutoTable.finalY + 15)
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Fuente / Canal', 'Clics totales']],
        body: stats.topReferrers.map(r => [r.name, r.count]),
        headStyles: { fillColor: [60, 60, 60] },
        styles: { font: 'helvetica' }
      })
    }

    // Top Allergens
    if (stats.topAllergens && stats.topAllergens.length > 0) {
      doc.text('Preocupaciones Gastronómicas (Filtros de Alérgenos)', 14, (doc as any).lastAutoTable.finalY + 15)

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Restricción / Alérgeno', 'Búsquedas registradas']],
        body: stats.topAllergens.map(a => [t(`allergens.${a.id}`) || a.id.toUpperCase(), a.count]),
        headStyles: { fillColor: [239, 68, 68] },
        styles: { font: 'helvetica' }
      })
      // Top Products
      if (stats.topProducts && stats.topProducts.length > 0) {
        const currentY = (doc as any).lastAutoTable.finalY;
        if (currentY > 250) { doc.addPage(); }

        const titleY = currentY > 250 ? 20 : currentY + 15;
        const tableY = currentY > 250 ? 25 : currentY + 20;

        doc.text('Platos Más Valorados / Promocionados', 14, titleY)
        autoTable(doc, {
          startY: tableY,
          head: [['Plato', 'Valoraciones (Likes)', 'Destacado Web', 'Destacado Fidelidad']],
          body: stats.topProducts.map(p => [
            p.name,
            `${p.likes_count}`,
            p.is_web_featured ? 'Sí' : 'No',
            p.is_featured ? 'Sí' : 'No'
          ]),
          headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0] },
        })
      }
    }

    doc.save(`dashboard_balconet_${range}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handleExportStrategyPDF = () => {
    if (!stats) return
    const doc = new jsPDF()
    const now = new Date().toLocaleString('es-ES')

    // Header Estratégico
    doc.setFillColor(17, 17, 17)
    doc.rect(0, 0, 210, 40, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(212, 175, 55)
    doc.text('EL BALCONET — AUDITORÍA ESTRATÉGICA IA', 14, 25)

    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text(`ANÁLISIS DE COMPORTAMIENTO Y ENGAGEMENT`, 14, 33)

    doc.setTextColor(150, 150, 150)
    doc.text(`Generado el: ${now}`, 140, 33)

    // Engagement Stats
    if (stats.engagementStats && stats.engagementStats.length > 0) {
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.text('Métricas de Interacción y Retención', 14, 55)

      autoTable(doc, {
        startY: 60,
        head: [['Sección / Categoría', 'Visitas Únicas', 'Tiempo Promedio', 'Puntuación Global']],
        body: sortedEngagement.map(eng => [
          getSectionNameStr(eng.section),
          `${eng.visits}`,
          `${eng.averageTime.toFixed(1)}s`,
          `${((eng.averageTime * eng.visits) / 10).toFixed(1)} pts`
        ]),
        headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0] },
        styles: { font: 'helvetica' }
      })

      // Recommendations
      doc.setFontSize(14)
      doc.setTextColor(212, 175, 55)
      doc.text('Recomendaciones de IA para Potenciar Ventas', 14, (doc as any).lastAutoTable.finalY + 15)

      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)

      let yPos = (doc as any).lastAutoTable.finalY + 25;

      const addRec = (title: string, text: string) => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.setFont('helvetica', 'bold')
        doc.text(title, 14, yPos)
        doc.setFont('helvetica', 'normal')
        const splitText = doc.splitTextToSize(text, 180)
        doc.text(splitText, 14, yPos + 6)
        yPos += 8 + (splitText.length * 5)
      }

      if (mostVisited) {
        addRec(`Alta visibilidad en: ${getSectionNameStr(mostVisited.section)}`,
          getRecommendationText(mostVisited, 'visits')
        )
      }

      if (highestRetention && highestRetention.section !== mostVisited?.section) {
        addRec(`Interés profundo en: ${getSectionNameStr(highestRetention.section)}`,
          getRecommendationText(highestRetention, 'retention')
        )
      }

      addRec(`Optimización del Ticket Medio`,
        `Instruye a los camareros para que ofrezcan proactivamente postres y bebidas premium a los clientes que hayan hecho la reserva online, ya que han demostrado un comportamiento de exploración activa en la carta digital.`
      )
    }

    doc.save(`estrategia_ia_balconet_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handleToggleFeatured = async (productId: string, currentStatus: boolean, type: 'loyalty' | 'web') => {
    try {
      const payload = type === 'loyalty'
        ? { productId, isFeatured: !currentStatus }
        : { productId, isWebFeatured: !currentStatus }

      const response = await fetch('/api/admin/dashboard-stats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setStats(prev => {
          if (!prev) return null

          const newProducts = prev.topProducts.map(p => {
            if (p.id !== productId) {
              if (type === 'web' && !currentStatus) {
                return { ...p, is_web_featured: false }
              }
              return p
            }
            return {
              ...p,
              ...(type === 'loyalty' ? { is_featured: !currentStatus } : { is_web_featured: !currentStatus })
            }
          })

          return {
            ...prev,
            topProducts: newProducts
          }
        })
      }
    } catch (err) {
      console.error('Error toggling featured:', err)
    }
  }

  const handleImageUpload = async (productId: string, file: File) => {
    setUploading(productId)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'promo')

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (data.url) {
        const patchRes = await fetch('/api/admin/dashboard-stats', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, imageUrl: data.url })
        })

        if (patchRes.ok) {
          setStats(prev => {
            if (!prev) return null
            return {
              ...prev,
              topProducts: prev.topProducts.map(p =>
                p.id === productId ? { ...p, image_url: data.url } : p
              )
            }
          })
        }
      }
    } catch (err) {
      console.error('Error uploading promo image:', err)
    } finally {
      setUploading(null)
    }
  }

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <div className="h-10 w-48 bg-white/5 rounded-sm animate-pulse" />
          <div className="h-10 w-32 bg-white/5 rounded-sm animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-32 bg-white/5 border border-white/10 rounded-sm animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const maxCount = Math.max(...(stats.dayStats || []).map(d => d.count), 1)

  return (
    <div className="space-y-8">
      {/* Action Header */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-[#111111] p-4 rounded-sm border border-white/5">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex bg-black/40 p-1 rounded-sm border border-white/5 overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 sm:px-4 py-2 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold transition-all rounded-sm whitespace-nowrap flex items-center gap-2 ${activeTab === 'stats' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
            >
              <BarChart3 size={12} /> Rendimiento
            </button>
            <button
              onClick={() => setActiveTab('strategy')}
              className={`px-3 sm:px-4 py-2 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold transition-all rounded-sm whitespace-nowrap flex items-center gap-2 ${activeTab === 'strategy' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              <Flame size={12} /> Estrategia IA
            </button>
            {userRole !== 'cocina' && (
              <button
                onClick={() => setActiveTab('billing')}
                className={`px-3 sm:px-4 py-2 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold transition-all rounded-sm whitespace-nowrap flex items-center gap-2 ${activeTab === 'billing' ? 'bg-green-500 text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                <Euro size={12} /> Facturación
              </button>
            )}
          </div>

          {/* Header - Buttons Group */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-[#D4AF37] border border-white/5 rounded-sm transition-all"
              title="Guía de Inteligencia"
            >
              <Info size={20} />
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`p-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-[#D4AF37] border border-white/5 rounded-sm transition-all ${refreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {activeTab !== 'billing' && (
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => { setResetType('analytics'); setShowResetModal(true); }}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2.5 rounded-sm border border-red-500/20 text-[9px] uppercase tracking-widest font-bold transition-all whitespace-nowrap"
            >
              <Trash2 size={12} /> Limpiar Analiticas
            </button>

            <button
              onClick={() => { setResetType('reservations'); setShowResetModal(true); }}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2.5 rounded-sm border border-red-500/20 text-[9px] uppercase tracking-widest font-bold transition-all whitespace-nowrap"
            >
              <Trash2 size={12} /> Vaciar Reservas
            </button>

            <button
              onClick={activeTab === 'stats' ? handleExportPerformancePDF : handleExportStrategyPDF}
              className="flex flex-1 lg:flex-none items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-sm border border-white/10 text-[10px] uppercase tracking-widest font-bold transition-all group shrink-0"
            >
              <Download size={16} className="text-[#D4AF37] group-hover:scale-110 transition-transform" />
              {activeTab === 'stats' ? 'PDF Rendimiento' : 'PDF Estrategia'}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'stats' && (
          <motion.div
            key="stats-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Range Selector (Solo en stats) */}
            <div className="flex justify-end flex-wrap items-center gap-3">
              <div className="relative">
                <input 
                  type="date"
                  title="Seleccionar día específico"
                  className="bg-black/80 border border-white/20 rounded-sm px-3 py-[7px] text-[#D4AF37] text-[11px] uppercase tracking-widest focus:outline-none focus:border-[#D4AF37]/80 appearance-none min-w-[130px] cursor-pointer"
                  value={dateInput}
                  onChange={(e) => {
                    const val = e.target.value
                    setDateInput(val)
                    if (val) {
                      const year = parseInt(val.split('-')[0], 10)
                      if (year > 2000) {
                        setRange(val)
                      }
                    } else {
                      setRange('month')
                    }
                  }}
                />
              </div>
              <div className="flex bg-black/40 p-1 rounded-sm border border-white/5 overflow-x-auto no-scrollbar">
                {([
                  { id: 'day', label: 'Hoy' },
                  { id: 'yesterday', label: 'Ayer' },
                  { id: 'week', label: '7 Días' },
                  { id: 'month', label: '30 Días' },
                  { id: 'year', label: 'Año' }
                ] as const).map(r => (
                  <button
                    key={r.id}
                    onClick={() => setRange(r.id)}
                    className={`px-3 sm:px-4 py-2 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold transition-all rounded-sm whitespace-nowrap ${range === r.id ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/20' : 'text-white/40 hover:text-white'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Top Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-[#111111] border border-white/10 p-5 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 bg-orange-500/5 rounded-bl-3xl group-hover:bg-orange-500/10 transition-colors">
                  <MousePointer2 size={14} className="text-orange-400" />
                </div>
                <p className="text-white/30 text-[10px] tracking-widest uppercase mb-1">Visitas</p>
                <h3 className="text-2xl font-serif text-white">{stats.summary?.totalVisits || 0}</h3>
                <p className="text-[9px] text-white/30 mt-2">Usuarios en la web</p>
              </div>

              <div className="bg-[#111111] border border-white/10 p-5 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 bg-green-500/5 rounded-bl-3xl group-hover:bg-green-500/10 transition-colors">
                  <TrendingUp size={14} className="text-green-400" />
                </div>
                <p className="text-white/30 text-[10px] tracking-widest uppercase mb-1">Principal Origen</p>
                <h3 className="text-xl font-medium text-white line-clamp-1 mt-1">
                  {stats.topReferrers?.[0]?.name || 'Directo'}
                </h3>
                <p className="text-[9px] text-white/30 mt-2">Canal con más tráfico</p>
              </div>

              <div className="bg-[#111111] border border-white/10 p-5 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 bg-[#D4AF37]/5 rounded-bl-3xl group-hover:bg-[#D4AF37]/10 transition-colors">
                  <Users size={14} className="text-[#D4AF37]" />
                </div>
                <p className="text-white/30 text-[10px] tracking-widest uppercase mb-1">Total PAX</p>
                <h3 className="text-2xl font-serif text-white">{stats.summary?.totalPax || 0}</h3>
                <p className="text-[9px] text-[#D4AF37] mt-2">En {stats.summary?.reservationsCount || 0} reservas</p>
              </div>

              <div className="bg-[#111111] border border-white/10 p-5 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 bg-blue-500/5 rounded-bl-3xl group-hover:bg-blue-500/10 transition-colors">
                  <Calendar size={14} className="text-blue-400" />
                </div>
                <p className="text-white/30 text-[10px] tracking-widest uppercase mb-1">
                  {(range === 'day' || range === 'yesterday' || range.match(/^\d{4}-\d{2}-\d{2}$/)) ? 'Hora Pico' : 'Mayor Afluencia'}
                </p>
                <h3 className="text-xl font-serif text-white flex items-baseline gap-2">
                  {(range === 'day' || range === 'yesterday' || range.match(/^\d{4}-\d{2}-\d{2}$/))
                    ? (stats.summary?.topHour || 'N/A')
                    : (stats.summary?.mostReservedDay || 'N/A')
                  }
                  {range !== 'day' && range !== 'yesterday' && !range.match(/^\d{4}-\d{2}-\d{2}$/) && stats.summary?.topDate && stats.summary.topDate !== 'N/A' && stats.summary.mostReservedDay !== 'N/A' && (
                    <span className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-bold">({stats.summary.topDate})</span>
                  )}
                </h3>
                <p className="text-[9px] text-white/30 mt-2">
                  {(range === 'day' || range === 'yesterday') ? 'Tramo con más PAX' : 'Máximo histórico en el periodo'}
                </p>
              </div>

              <div className="bg-[#111111] border border-white/10 p-5 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 bg-purple-500/5 rounded-bl-3xl group-hover:bg-purple-500/10 transition-colors">
                  <Heart size={14} className="text-purple-400" />
                </div>
                <p className="text-white/30 text-[10px] tracking-widest uppercase mb-1">Plato Estrella</p>
                <h3 className="text-lg font-medium text-white line-clamp-1 mt-1">{stats.summary?.topDish || 'N/A'}</h3>
                <p className="text-[9px] text-white/30 mt-2">Más valorado</p>
              </div>

              <div className="bg-[#111111] border border-[#D4AF37]/20 p-5 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 bg-[#D4AF37]/5 rounded-bl-3xl group-hover:bg-[#D4AF37]/10 transition-colors">
                  <Star size={14} className="text-[#D4AF37]" />
                </div>
                <p className="text-[#D4AF37]/60 text-[10px] tracking-widest uppercase mb-1">Google</p>
                <h3 className="text-2xl font-serif text-[#D4AF37]">{stats.summary?.googleReviewClicks || 0}</h3>
                <p className="text-[9px] text-[#D4AF37]/60 mt-2">Clics de Reseñas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart View */}
              <div className="lg:col-span-2 bg-[#111111] border border-white/10 p-8 rounded-sm">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="font-serif text-xl text-white flex items-center gap-2">
                      <BarChart3 className="text-[#D4AF37]" size={20} />
                      Intensidad por Día
                    </h2>
                    <p className="text-white/30 text-xs mt-1">Comparativa de comensales en el periodo seleccionado</p>
                  </div>
                </div>

                <div className="flex items-end justify-between h-48 gap-2 sm:gap-4 pt-10 text-center">
                  {(stats.dayStats || []).map((d, i) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Visualización permanente de cifras */}
                      <span className={`text-[10px] font-bold mb-2 transition-all duration-300 ${d.count > 0 ? 'text-[#D4AF37]' : 'text-white/20'}`}>
                        {d.count} <span className="text-[8px] opacity-70">PAX</span>
                      </span>

                      {/* Elemento de la Barra */}
                      <div className="w-full relative flex items-end justify-center h-full">
                        <div
                          className={`w-full max-w-[40px] rounded-t-sm transition-all duration-1000 ease-out relative ${d.count > 0
                            ? 'bg-gradient-to-t from-[#D4AF37]/10 to-[#D4AF37] border-t-2 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)] group-hover:shadow-[0_0_20px_rgba(212,175,55,0.5)]'
                            : 'bg-white/5 border-t-2 border-white/10'
                            }`}
                          style={{ height: `${d.count > 0 ? (d.count / maxCount) * 100 : 2}%`, minHeight: '4px' }}
                        />
                      </div>

                      {/* Etiqueta del día / hora */}
                      <span className={`text-[10px] tracking-tighter mt-4 rotate-[-45deg] lg:rotate-0 font-medium ${d.count > 0 ? 'text-white/80' : 'text-white/30'} ${d.day.includes(':') ? '' : 'uppercase'}`}>
                        {d.day.includes(':') ? d.day : d.day.slice(0, 3)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-12 pt-8 border-t border-white/5">
                  <h3 className="text-xs font-serif uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                    Canales de Adquisición
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {(stats.topReferrers || []).map((ref, idx) => (
                      <div key={idx} className="bg-white/5 p-3 rounded-sm border border-white/5">
                        <p className="text-[10px] text-white/30 uppercase truncate">{ref.name}</p>
                        <p className="text-lg font-serif text-white mt-1">{ref.count} <span className="text-[10px] font-sans text-white/20">clics</span></p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* QR Shift Stats */}
                {(stats as any).qrShifts && (
                  <div className="mt-8 pt-8 border-t border-white/5">
                    <h3 className="text-xs font-serif uppercase tracking-widest text-[#D4AF37] mb-6 flex items-center gap-2">
                      <QrCode size={14} /> Escaneos QR en Tiempo Real (Huso Horario ESP)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#111111] p-5 rounded-sm border border-white/5 relative overflow-hidden flex flex-col h-full">
                        <div className="absolute top-0 right-0 p-3 bg-orange-500/5 rounded-bl-3xl">
                           <span className="text-xl">☀️</span>
                        </div>
                        <h4 className="text-white/60 text-[10px] uppercase tracking-widest mb-1">Turno Mañana (08:00 - 16:59)</h4>
                        <div className="flex items-baseline gap-2 mb-3">
                           <p className="text-2xl font-serif text-white">{(stats as any).qrShifts.morning.scans}</p>
                           <p className="text-[10px] text-white/30">escaneos totales</p>
                        </div>
                        <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 p-2 rounded-sm w-max mb-2">
                           <span className="text-[10px] uppercase text-orange-400 font-bold tracking-widest">Hora Pico:</span>
                           <span className="text-sm font-serif text-white">{(stats as any).qrShifts.morning.peakHour}</span>
                        </div>
                        {Object.entries((stats as any).qrShifts.morning.hours || {}).length > 0 && (
                          <div className="mt-auto pt-3 border-t border-white/5 max-h-20 overflow-y-auto no-scrollbar pr-1">
                            <ul className="space-y-1.5">
                              {Object.entries((stats as any).qrShifts.morning.hours)
                                .sort((a: any, b: any) => b[1] - a[1])
                                .slice(0, 5)
                                .map(([hour, count]: any) => (
                                  <li key={hour} className="flex justify-between items-center text-[10px]">
                                    <span className="text-white/60 font-mono">{hour}</span>
                                    <span className="text-[#D4AF37] font-bold">{count} <span className="text-[8px] text-white/30 font-normal uppercase tracking-widest">veces</span></span>
                                  </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="bg-[#111111] p-5 rounded-sm border border-white/5 relative overflow-hidden flex flex-col h-full">
                        <div className="absolute top-0 right-0 p-3 bg-blue-500/5 rounded-bl-3xl">
                           <span className="text-xl">🌙</span>
                        </div>
                        <h4 className="text-white/60 text-[10px] uppercase tracking-widest mb-1">Turno Tarde/Noche (17:00 - 23:59)</h4>
                        <div className="flex items-baseline gap-2 mb-3">
                           <p className="text-2xl font-serif text-white">{(stats as any).qrShifts.evening.scans}</p>
                           <p className="text-[10px] text-white/30">escaneos totales</p>
                        </div>
                        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 p-2 rounded-sm w-max mb-2">
                           <span className="text-[10px] uppercase text-blue-400 font-bold tracking-widest">Hora Pico:</span>
                           <span className="text-sm font-serif text-white">{(stats as any).qrShifts.evening.peakHour}</span>
                        </div>
                        {Object.entries((stats as any).qrShifts.evening.hours || {}).length > 0 && (
                          <div className="mt-auto pt-3 border-t border-white/5 max-h-20 overflow-y-auto no-scrollbar pr-1">
                            <ul className="space-y-1.5">
                              {Object.entries((stats as any).qrShifts.evening.hours)
                                .sort((a: any, b: any) => b[1] - a[1])
                                .slice(0, 5)
                                .map(([hour, count]: any) => (
                                  <li key={hour} className="flex justify-between items-center text-[10px]">
                                    <span className="text-white/60 font-mono">{hour}</span>
                                    <span className="text-[#D4AF37] font-bold">{count} <span className="text-[8px] text-white/30 font-normal uppercase tracking-widest">veces</span></span>
                                  </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-12 pt-8 border-t border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h3 className="text-xs font-serif uppercase tracking-widest text-[#ef4444] flex items-center gap-2">
                      <Info size={14} /> Preocupaciones Gastronómicas (Alérgenos)
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-white/20 uppercase hidden md:inline">Interacciones con filtros de la carta</span>
                      <div className="flex bg-black/40 p-1 rounded-sm border border-white/5">
                        {([
                          { id: 'all' as const, label: 'Todos', icon: null },
                          { id: 'morning' as const, label: 'Mañana', icon: <Sun size={12} className="text-orange-400" /> },
                          { id: 'evening' as const, label: 'Noche', icon: <Moon size={12} className="text-blue-400" /> }
                        ]).map(s => (
                          <button
                            key={s.id}
                            onClick={() => setAllergenShift(s.id)}
                            className={`px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-all rounded-sm whitespace-nowrap flex items-center gap-1.5 ${
                              allergenShift === s.id
                                ? s.id === 'morning' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20'
                                  : s.id === 'evening' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/20'
                                : 'text-white/40 hover:text-white border border-transparent'
                            }`}
                          >
                            {s.icon} {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(() => {
                      const activeAllergens = allergenShift === 'all'
                        ? stats.topAllergens
                        : stats.topAllergensByShift?.[allergenShift] || []
                      
                      return activeAllergens && activeAllergens.length > 0 ? (
                        activeAllergens.map((all, i) => {
                          const allergenIcons: Record<string, string> = {
                            gluten: '🌾',
                            dairy: '🥛',
                            eggs: '🥚',
                            nuts: '🌰',
                            fish: '🐟',
                            crustaceans: '🦐',
                            peanuts: '🥜',
                            soybeans: '🌿',
                            celery: '🥬',
                            mustard: '🟡',
                            sesame: '🌱',
                            sulphites: '🍷',
                            lupin: '🌼',
                            molluscs: '🐙'
                          }
                          const icon = allergenIcons[all.id] || '⚠️'

                          return (
                            <div key={i} className="bg-red-500/5 p-4 rounded-sm border border-red-500/10 flex items-center justify-between group hover:bg-red-500/10 transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{icon}</span>
                                <div>
                                  <p className="text-[10px] text-white/40 uppercase tracking-widest leading-none mb-1">
                                    {t(`allergens.${all.id}`)}
                                  </p>
                                  <p className="text-xl font-serif text-white">{all.count}</p>
                                </div>
                              </div>
                              <div className="h-8 w-1 bg-red-500/20 rounded-full" />
                            </div>
                          )
                        })
                      ) : (
                        <div className="col-span-4 py-8 text-center border border-dashed border-white/5 rounded-sm">
                          <p className="text-white/20 text-[10px] uppercase tracking-[0.2em]">
                            {allergenShift === 'all'
                              ? 'Esperando datos de interacción...'
                              : allergenShift === 'morning'
                              ? 'Sin filtros de alérgenos en el turno de mañana'
                              : 'Sin filtros de alérgenos en el turno de noche'}
                          </p>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Top Menú del Día */}
                {(stats.topMenuDishes && stats.topMenuDishes.length > 0) && (
                  <>
                    <div className="mt-8 mb-4 pt-6 border-t border-white/5">
                      <h2 className="font-serif text-xl text-white flex items-center gap-2">
                        <UtensilsCrossed size={18} className="text-[#D4AF37]" /> Menú del Día
                      </h2>
                      <p className="text-white/30 text-xs mt-1">Platos más gustados</p>
                    </div>

                    <div className="space-y-3">
                      {stats.topMenuDishes.slice(0, 5).map((product, index) => (
                        <div
                          key={product.id}
                          className="relative overflow-hidden rounded-sm border bg-black/20 border-white/5"
                        >
                          <div className="relative p-4 flex items-center justify-between z-10">
                            <span className="text-[10px] text-white/20 font-serif w-4 text-center shrink-0">{index + 1}</span>
                            <div className="flex-1 min-w-0 w-full ml-4 flex items-center gap-2">
                              <h3 className="font-serif text-white text-base truncate" title={product.name}>
                                {product.name}
                              </h3>
                              {product.daily_menus?.date && (
                                <span className="text-[9px] text-white/30 font-mono bg-white/5 px-1 py-0.5 rounded-sm shrink-0">
                                  {new Date(product.daily_menus.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-sm shrink-0">
                              <Heart size={10} className="text-red-400 fill-current" />
                              <span className="text-[10px] font-bold text-red-400 tabular-nums">{product.likes_count}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setShowAllLikesModal(true)}
                      className="mt-6 pt-4 border-t border-white/5 flex w-full items-center justify-between text-[#D4AF37] hover:text-[#E8C84A] transition-colors group cursor-pointer"
                    >
                      <span className="text-[10px] uppercase tracking-widest font-bold">Resumen rápido de Likes</span>
                      <FileText size={16} className="group-hover:scale-110 transition-transform" />
                    </button>
                  </>
                )}
              </div>

              {/* Featured Dish Tool */}
              <div className="bg-[#111111] border border-white/10 p-8 rounded-sm flex flex-col">
                <div className="mb-8">
                  <h2 className="font-serif text-xl text-white flex items-center gap-2">
                    <Star size={18} className="text-[#D4AF37]" /> Promocionados
                  </h2>
                  <p className="text-white/30 text-xs mt-1">Más valorados por los comensales</p>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                  {(stats.topProducts || []).slice(0, 5).map((product, index) => {
                    const isHero = index === 0; // Force the true #1 most liked to be the Hero visually

                    return (
                      <div
                        key={product.id}
                        className={`relative overflow-hidden rounded-sm border transition-all duration-500 ${isHero
                          ? 'bg-[#1a1a1a] border-[#D4AF37]/40 shadow-[0_0_30px_rgba(212,175,55,0.05)]'
                          : 'bg-black/20 border-white/5 hover:bg-white/5'
                          }`}
                      >
                        {/* Hero Image Background if Featured and has Image */}
                        {isHero && product.image_url && (
                          <div
                            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity transition-opacity duration-700"
                            style={{ backgroundImage: `url(${product.image_url})` }}
                          />
                        )}
                        {isHero && product.image_url && (
                          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent z-0" />
                        )}

                        <div className={`relative p-5 flex flex-col justify-end z-10 ${isHero ? 'min-h-[140px] h-full' : 'h-full'}`}>
                          <div className={`flex w-full gap-4 ${isHero ? 'flex-col items-start justify-end mt-auto' : 'flex-row items-center justify-between'}`}>

                            {/* Ranking Number */}
                            {!isHero && (
                              <span className="text-[10px] text-white/20 font-serif w-4 text-center shrink-0">{index + 1}</span>
                            )}

                            <div className="flex-1 min-w-0 w-full">
                              {isHero && (
                                <div className="flex gap-2 flex-wrap mb-2">
                                  {product.is_web_featured && (
                                    <div className="text-[9px] uppercase tracking-[0.3em] text-white bg-black/60 backdrop-blur-md px-2 py-1 rounded-sm border border-white/10 font-bold flex items-center gap-1.5 inline-flex shadow-lg">
                                      <Star size={10} className="fill-[#D4AF37] text-[#D4AF37]" /> WEB
                                    </div>
                                  )}
                                  {product.is_featured && (
                                    <div className="text-[9px] uppercase tracking-[0.3em] text-[#D4AF37] font-bold flex items-center gap-1.5 inline-flex py-1 drop-shadow-md">
                                      <Star size={10} className="fill-[#D4AF37]" /> CUBIERTO
                                    </div>
                                  )}
                                </div>
                              )}
                              <h4 className={`truncate ${isHero ? 'text-xl font-serif text-white drop-shadow-md mb-2 break-words whitespace-normal' : 'text-sm font-medium text-white mb-1'}`}>
                                {product.name}
                              </h4>
                              <p className={`text-[10px] flex items-center gap-1.5 ${isHero ? 'text-white' : 'text-white/40'}`}>
                                <Heart size={10} className={isHero ? 'fill-[#D4AF37] text-[#D4AF37]' : 'fill-white/20 text-white/20'} />
                                {product.likes_count} valoraciones
                              </p>
                            </div>

                            <div className={`flex gap-2 shrink-0 ${isHero ? 'w-full flex-row items-stretch pt-2' : 'flex-col items-end'}`}>
                              <div className={`flex gap-2 ${isHero ? 'flex-row flex-1' : 'flex-col'}`}>
                                <button
                                  onClick={() => handleToggleFeatured(product.id, product.is_web_featured || false, 'web')}
                                  className={`flex-1 text-[9px] px-3 py-2 rounded-sm uppercase tracking-widest font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${product.is_web_featured
                                    ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:bg-white/80'
                                    : 'bg-transparent border border-white/10 text-white/40 hover:border-white/30 hover:text-white'
                                    }`}
                                >
                                  <Star size={10} className={product.is_web_featured ? 'text-black fill-black' : ''} />
                                  {product.is_web_featured ? 'WEB' : 'WEB'}
                                </button>

                                <button
                                  onClick={() => handleToggleFeatured(product.id, product.is_featured || false, 'loyalty')}
                                  className={`flex-1 text-[9px] px-3 py-2 rounded-sm uppercase tracking-widest font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${product.is_featured
                                    ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:bg-[#E8C84A]'
                                    : 'bg-transparent border border-white/10 text-white/40 hover:border-white/30 hover:text-white'
                                    }`}
                                >
                                  <Gift size={10} className={product.is_featured ? 'text-black' : ''} />
                                  {product.is_featured ? 'APP' : 'APP'}
                                </button>
                              </div>

                              {isHero && (
                                <label className="cursor-pointer group flex shrink-0">
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(product.id, e.target.files[0])}
                                  />
                                  <div className="text-[9px] text-white/50 group-hover:text-white transition-colors flex items-center justify-center gap-1.5 bg-black/60 px-3 py-2 rounded-sm border border-white/10 backdrop-blur-md h-full whitespace-nowrap flex-1 hover:bg-black/80">
                                    {uploading === product.id ? <LoaderIcon size={12} className="animate-spin" /> : <Camera size={12} />}
                                    {product.image_url ? 'Fondo' : 'Fondo'}
                                  </div>
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <button
                  onClick={() => setShowAllLikesModal(true)}
                  className="mt-8 pt-6 border-t border-white/5 flex w-full items-center justify-between text-[#D4AF37] hover:text-[#E8C84A] transition-colors group cursor-pointer"
                >
                  <span className="text-[10px] uppercase tracking-widest font-bold">Resumen rápido de Likes</span>
                  <FileText size={16} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* Engagement Section (Secciones más calientes - 3 Columns) */}
              <div className="lg:col-span-3 space-y-4">
                {/* Shift Toggle */}
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-lg text-white flex items-center gap-2">
                    <Flame size={18} className="text-[#D4AF37]" /> Secciones Más Calientes
                  </h2>
                  <div className="flex bg-black/40 p-1 rounded-sm border border-white/5">
                    {([
                      { id: 'all' as const, label: 'Todos', icon: null },
                      { id: 'morning' as const, label: 'Mañana', icon: <Sun size={12} className="text-orange-400" /> },
                      { id: 'evening' as const, label: 'Noche', icon: <Moon size={12} className="text-blue-400" /> }
                    ]).map(s => (
                      <button
                        key={s.id}
                        onClick={() => setEngagementShift(s.id)}
                        className={`px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-all rounded-sm whitespace-nowrap flex items-center gap-1.5 ${
                          engagementShift === s.id
                            ? s.id === 'morning' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20'
                              : s.id === 'evening' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                              : 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/20'
                            : 'text-white/40 hover:text-white border border-transparent'
                        }`}
                      >
                        {s.icon} {s.label}
                      </button>
                    ))}
                  </div>
                </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Mayor Retención',
                    subtitle: 'Más Segundos Promedio',
                    icon: <Flame size={16} className="text-orange-500" />,
                    sortFn: (a: any, b: any) => b.averageTime - a.averageTime,
                    maxProp: (stats: any[]) => Math.max(...stats.map(s => s.averageTime)),
                    valProp: (eng: any) => eng.averageTime
                  },
                  {
                    title: 'Más Interacción',
                    subtitle: 'Más Visitas Únicas',
                    icon: <MousePointer2 size={16} className="text-blue-500" />,
                    sortFn: (a: any, b: any) => b.visits - a.visits,
                    maxProp: (stats: any[]) => Math.max(...stats.map(s => s.visits)),
                    valProp: (eng: any) => eng.visits
                  },
                  {
                    title: 'Mejor Promedio',
                    subtitle: 'Score Global (Retención × Visitas + Valoración)',
                    icon: <Star size={16} className="text-[#D4AF37]" />,
                    sortFn: (a: any, b: any) => {
                      const scoreA = ((a.averageTime * a.visits) / 10) + ((a.likes || 0) * 15)
                      const scoreB = ((b.averageTime * b.visits) / 10) + ((b.likes || 0) * 15)
                      return scoreB - scoreA
                    },
                    maxProp: (stats: any[]) => Math.max(...stats.map(s => ((s.averageTime * s.visits) / 10) + ((s.likes || 0) * 15))),
                    valProp: (eng: any) => ((eng.averageTime * eng.visits) / 10) + ((eng.likes || 0) * 15)
                  }
                ].map((col, cIdx) => (
                  <div key={cIdx} className="bg-[#111111] border border-white/10 p-6 rounded-sm flex flex-col">
                    <div className="mb-6">
                      <h2 className="font-serif text-lg text-white flex items-center gap-2">
                        {col.icon} {col.title}
                      </h2>
                      <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1">{col.subtitle}</p>
                    </div>
                    <div className="space-y-6 flex-1">
                      {(() => {
                        const activeEngagement = engagementShift === 'all'
                          ? stats.engagementStats
                          : (stats as any).engagementStatsByShift?.[engagementShift] || []
                        return activeEngagement && activeEngagement.length > 0 ? (
                        [...activeEngagement].sort(col.sortFn).slice(0, 6).map((eng: any, idx: number) => {
                          const engagementScore = (((eng.averageTime * eng.visits) / 10) + ((eng.likes || 0) * 15)).toFixed(1)
                          const percentage = (col.valProp(eng) / (col.maxProp(activeEngagement!) || 1)) * 100

                          const sectionNames: Record<string, string> = {
                            home: 'Inicio / Bienvenida',
                            about: 'Nuestra Historia',
                            featured: 'Plato Estrella',
                            menu: 'Menú del Día',
                            carta: 'La Carta (General)',
                            reviews: 'Reseñas de Clientes',
                            contact: 'Contacto y Mapa'
                          }

                          let displayName = sectionNames[eng.section] || eng.section
                          if (eng.section.startsWith('cat-')) {
                            displayName = 'Carta: ' + eng.section.replace('cat-', '').replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                          }

                          const formatTimeVal = (secs: number) => {
                            if (secs < 60) return secs.toFixed(1)
                            const m = Math.floor(secs / 60)
                            const s = Math.floor(secs % 60)
                            return `${m}m ${s}s`
                          }

                          return (
                            <div key={eng.section} className="space-y-2 group/item">
                              <div className="flex justify-between items-end">
                                <div className="flex flex-col flex-1 pr-2">
                                  <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/60 font-bold group-hover/item:text-[#D4AF37] transition-colors line-clamp-1" title={displayName}>
                                    {idx + 1}. {displayName}
                                  </p>
                                  <p className="text-[8px] sm:text-[9px] text-white/20 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                    {eng.visits} {eng.visits === 1 ? 'visita' : 'clicks'} · {formatTimeVal(eng.averageTime)} prom 
                                    {(eng.likes || 0) > 0 && (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); toggleSection(eng.section) }}
                                        className={`ml-1 px-1.5 py-0.5 rounded-[2px] transition-all flex items-center gap-1 ${expandedSections[eng.section] ? 'bg-[#D4AF37] text-black font-bold' : 'bg-white/5 text-[#D4AF37]/80 hover:bg-white/10'}`}
                                      >
                                        · {eng.likes} likes {expandedSections[eng.section] ? '▲' : '▼'}
                                      </button>
                                    )}
                                  </p>
                                  <AnimatePresence>
                                    {expandedSections[eng.section] && eng.topLikedProducts && eng.topLikedProducts.length > 0 && (
                                      <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-3 pt-2 border-t border-white/5 space-y-1.5">
                                          <p className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold mb-2">Favoritos en esta sección:</p>
                                          {eng.topLikedProducts.map((p: any, pIdx: number) => (
                                            <p key={pIdx} className="text-[11px] text-white/90 italic flex items-center gap-2 leading-relaxed">
                                              <Heart size={10} className="fill-[#D4AF37] text-[#D4AF37]" /> {p.name} <span className="text-[10px] text-white/40 not-italic ml-auto">{p.likes} likes</span>
                                            </p>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs sm:text-sm text-[#D4AF37] font-bold">
                                    {col.title === 'Más Interacción' ? eng.visits : col.title === 'Mayor Retención' ? formatTimeVal(eng.averageTime) : engagementScore}
                                    <span className="text-[8px] sm:text-[9px] text-white/20 font-normal ml-1">
                                      {col.title === 'Más Interacción' ? 'pts' : col.title === 'Mayor Retención' ? (eng.averageTime < 60 ? 'seg' : '') : 'pts'}
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  className={`h-full bg-gradient-to-r shadow-[0_0_15px_rgba(249,115,22,0.2)] ${parseFloat(engagementScore) > 50 ? 'from-orange-600 to-orange-400' : 'from-orange-500/40 to-orange-500/80'
                                    }`}
                                />
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="py-12 text-center border border-dashed border-white/5 rounded-sm">
                          <p className="text-white/20 text-[10px] uppercase tracking-[0.2em]">
                            {engagementShift === 'all' ? 'Recopilando datos...' : engagementShift === 'morning' ? 'Sin datos del turno de mañana' : 'Sin datos del turno de noche'}
                          </p>
                        </div>
                      )
                      })()}
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>

            {/* QR & Marketing Resources - Oculto para cocina */}
            {userRole !== 'cocina' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <QrCode className="text-[#D4AF37]" size={20} />
                  <h2 className="font-serif text-xl text-white">Recursos de Marketing</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  <div className="bg-[#111111] border border-white/5 p-6 md:p-8 rounded-sm overflow-hidden relative group flex flex-col justify-between h-full">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl group-hover:bg-[#D4AF37]/10 transition-all duration-700" />

                    <div className="relative z-10 flex-1">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="bg-[#D4AF37]/10 p-3 rounded-sm border border-[#D4AF37]/20 flex-shrink-0">
                          <QrCode size={24} className="text-[#D4AF37]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-serif text-white leading-tight">Kit de Mesa: Carta</h3>
                          <p className="text-[#D4AF37] text-[10px] uppercase tracking-widest font-bold mt-1 opacity-60">QR Menú del Día + Carta</p>
                        </div>
                      </div>

                      <p className="text-white/40 text-[13px] mb-8 leading-relaxed">
                        Descarga un PDF profesional listo para imprimir. Incluye el código QR para que tus clientes vean la oferta gastronómica actual del local desde su móvil.
                      </p>
                    </div>

                    <button
                      onClick={() => generateQRKitPDF('menu')}
                      disabled={uploading === 'qr-menu'}
                      className="relative z-10 w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-4 rounded-sm text-[10px] uppercase font-bold tracking-[0.2em] transition-all disabled:opacity-50"
                    >
                      {uploading === 'qr-menu' ? <LoaderIcon size={14} className="animate-spin" /> : <Download size={14} />}
                      Descargar PDF Carta
                    </button>
                  </div>

                  <div className="bg-[#111111] border border-white/5 p-6 md:p-8 rounded-sm overflow-hidden relative group flex flex-col justify-between h-full">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl group-hover:bg-[#D4AF37]/10 transition-all duration-700" />

                    <div className="relative z-10 flex-1">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="bg-[#D4AF37]/10 p-3 rounded-sm border border-[#D4AF37]/20 flex-shrink-0">
                          <Star size={24} className="text-[#D4AF37]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-serif text-white leading-tight">Kit de Mesa: Fidelidad</h3>
                          <p className="text-[#D4AF37] text-[10px] uppercase tracking-widest font-bold mt-1 opacity-60">Registro de Clientes</p>
                        </div>
                      </div>

                      <p className="text-white/40 text-[13px] mb-8 leading-relaxed">
                        Genera un impreso listo para captar clientes en la mesa. Permite que se unan a tu programa de puntos escaneando el código QR directamente.
                      </p>
                    </div>

                    <button
                      onClick={() => generateQRKitPDF('loyalty')}
                      disabled={uploading === 'qr-loyalty'}
                      className="relative z-10 w-full flex items-center justify-center gap-3 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/20 py-4 rounded-sm text-[10px] uppercase font-bold tracking-[0.2em] transition-all disabled:opacity-50"
                    >
                      {uploading === 'qr-loyalty' ? <LoaderIcon size={14} className="animate-spin" /> : <Download size={14} />}
                      Descargar PDF Fidelización
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
        {activeTab === 'strategy' && (
          <motion.div
            key="strategy-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-[#111111] border border-[#D4AF37]/20 p-8 rounded-sm relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[100px]" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-[#D4AF37]/10 p-3 rounded-sm border border-[#D4AF37]/20">
                    <Flame size={24} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <h2 className="font-serif text-3xl text-white">Análisis Estratégico IA</h2>
                    <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-bold mt-1">Recomendaciones personalizadas basadas en comportamiento real</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                  {/* Card 1: Visibilidad */}
                  {mostVisited && (
                    <div className="bg-black/40 border border-white/5 p-6 rounded-sm hover:border-[#D4AF37]/30 transition-all group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 flex items-center justify-center bg-blue-500/10 text-blue-500 rounded-sm border border-blue-500/20">
                          <MousePointer2 size={14} />
                        </div>
                        <h3 className="text-white font-serif text-lg">Alta Visibilidad</h3>
                      </div>
                      <p className="text-[#D4AF37] text-[10px] uppercase tracking-widest font-bold mb-3">
                        Sección: {getSectionNameStr(mostVisited.section)}
                      </p>
                      <p className="text-white/60 text-sm leading-relaxed mb-6 italic border-l-2 border-[#D4AF37]/40 pl-4 py-1">
                        "{getRecommendationText(mostVisited, 'visits')}"
                      </p>
                      <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">
                        <span>{mostVisited.visits} Visitas</span>
                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                        <span>Pico de interés</span>
                      </div>
                    </div>
                  )}

                  {/* Card 2: Retención */}
                  {highestRetention && (
                    <div className="bg-black/40 border border-white/5 p-6 rounded-sm hover:border-[#D4AF37]/30 transition-all group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 flex items-center justify-center bg-orange-500/10 text-orange-500 rounded-sm border border-orange-500/20">
                          <Flame size={14} />
                        </div>
                        <h3 className="text-white font-serif text-lg">Interés Profundo</h3>
                      </div>
                      <p className="text-[#D4AF37] text-[10px] uppercase tracking-widest font-bold mb-3">
                        Sección: {getSectionNameStr(highestRetention.section)}
                      </p>
                      <p className="text-white/60 text-sm leading-relaxed mb-6 italic border-l-2 border-[#D4AF37]/40 pl-4 py-1">
                        "{getRecommendationText(highestRetention, 'retention')}"
                      </p>
                      <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">
                        <span>{highestRetention.averageTime.toFixed(1)}s Lectura</span>
                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                        <span>Deseo de compra</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botón de descarga PDF (Mismo que el header pero más prominente aquí) */}
                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3 text-white/40 text-xs">
                    <Info size={16} className="text-[#D4AF37]" />
                    <p>Este informe se actualiza dinámicamente según el periodo seleccionado en la pestaña de Rendimiento.</p>
                  </div>
                  <button
                    onClick={handleExportStrategyPDF}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#D4AF37] hover:bg-[#E8C84A] text-black px-8 py-4 rounded-sm text-[10px] uppercase font-bold tracking-[0.2em] transition-all shadow-xl shadow-[#D4AF37]/10"
                  >
                    <Download size={16} /> Descargar Auditoría Estratégica (PDF)
                  </button>
                </div>
              </div>
            </div>

            {/* Resumen de Datos Clave para Cocina en esta pestaña */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#111111] border border-white/5 p-6 rounded-sm">
                <h3 className="text-white/30 text-[9px] uppercase tracking-[0.2em] mb-4">Lo más deseado</h3>
                <p className="text-2xl font-serif text-white">{stats.summary?.topDish || 'N/A'}</p>
                <p className="text-[#D4AF37] text-[10px] uppercase tracking-widest mt-2">Plato Estrella</p>
              </div>
              <div className="bg-[#111111] border border-white/5 p-6 rounded-sm">
                <h3 className="text-white/30 text-[9px] uppercase tracking-[0.2em] mb-4">Tendencia de Alérgenos</h3>
                <p className="text-2xl font-serif text-white">
                  {stats.topAllergens?.[0] ? t(`allergens.${stats.topAllergens[0].id}`) : 'Ninguno'}
                </p>
                <p className="text-red-500/60 text-[10px] uppercase tracking-widest mt-2">Filtro más usado</p>
              </div>
              <div className="bg-[#111111] border border-white/5 p-6 rounded-sm">
                <h3 className="text-white/30 text-[9px] uppercase tracking-[0.2em] mb-4">Visitas Hoy</h3>
                <p className="text-2xl font-serif text-white">{stats.summary?.totalVisits || 0}</p>
                <p className="text-green-500/60 text-[10px] uppercase tracking-widest mt-2">Usuarios Únicos</p>
              </div>
              <div className="bg-[#111111] border border-white/5 p-6 rounded-sm">
                <h3 className="text-[#D4AF37]/50 text-[9px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Star size={12} /> Reseñas Google
                </h3>
                <p className="text-2xl font-serif text-[#D4AF37]">{stats.summary?.googleReviewClicks || 0}</p>
                <p className="text-[#D4AF37]/60 text-[10px] uppercase tracking-widest mt-2">Clics al botón flotante</p>
              </div>
            </div>
          </motion.div>
        )}
        {activeTab === 'billing' && (
          <BillingTab />
        )}
      </AnimatePresence>
      {/* Critical Reset Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111111] border border-red-500/30 p-8 rounded-sm max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
              
              <div className="flex items-center gap-3 mb-6 text-red-500">
                <ShieldAlert size={24} />
                <h3 className="text-xl font-serif uppercase tracking-wider">Acción Crítica</h3>
              </div>

              <p className="text-white/60 text-sm mb-8 leading-relaxed">
                Estás a punto de borrar todos los datos de {resetType === 'analytics' ? 'analíticas e interacciones' : 'reservas registradas'}. 
                Esta acción es <strong>irreversible</strong> y afectará a los informes históricos.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2 block">
                    Contraseña de Seguridad
                  </label>
                  <input
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Introducir contraseña..."
                    className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-white focus:border-red-500/50 outline-none transition-all font-mono"
                    autoFocus
                  />
                  {resetError && (
                    <p className="text-red-500 text-[10px] mt-2 uppercase tracking-widest font-bold animate-pulse">
                      {resetError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => { setShowResetModal(false); setResetPassword(''); setResetError(null); }}
                    className="flex-1 px-4 py-3 border border-white/5 hover:bg-white/5 text-white/40 hover:text-white transition-all text-[10px] uppercase font-bold tracking-widest"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={resetLoading || !resetPassword}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white transition-all text-[10px] uppercase font-bold tracking-widest disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    {resetLoading ? <RefreshCw className="animate-spin" size={14} /> : <Trash2 size={14} />}
                    {resetType === 'analytics' ? 'Borrar Analíticas' : 'Borrar Reservas'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guía de Inteligencia (Help Modal) */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-2xl bg-[#0A0A0A] border border-[#D4AF37]/20 rounded-sm shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="bg-[#D4AF37]/10 p-2 rounded-sm border border-[#D4AF37]/20">
                    <ShieldCheck size={18} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif text-white uppercase tracking-wider">Guía de Inteligencia Gastronómica</h3>
                    <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">Cómo entender los datos de tu negocio</p>
                  </div>
                </div>
                <button onClick={() => setShowHelp(false)} className="text-white/20 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                {/* Dwell Time & Heatmap */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <Flame size={16} />
                    <h4 className="text-[11px] uppercase tracking-[0.2em] font-bold">Mapa de Calor y Secciones Calientes</h4>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Este sistema mide con precisión milimétrica qué está mirando el cliente en su móvil. No solo cuenta clics, sino el <strong>tiempo real de lectura</strong> (Dwell Time) en cada bloque.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/5 p-4 rounded-sm border border-white/5">
                      <span className="text-orange-500 text-lg mb-2 block">🔥</span>
                      <h5 className="text-[10px] text-white font-bold uppercase mb-1">Alto Interés</h5>
                      <p className="text-[10px] text-white/40">Más de 15 segundos. El cliente está analizando los platos seriamente.</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-sm border border-white/5">
                      <span className="text-blue-400 text-lg mb-2 block">👁️</span>
                      <h5 className="text-[10px] text-white font-bold uppercase mb-1">Lectura</h5>
                      <p className="text-[10px] text-white/40">De 5 a 15 segundos. Revisión estándar de la oferta.</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-sm border border-white/5">
                      <span className="text-yellow-400 text-lg mb-2 block">⚡</span>
                      <h5 className="text-[10px] text-white font-bold uppercase mb-1">Vista Rápida</h5>
                      <p className="text-[10px] text-white/40">Menos de 5 segundos. Scroll rápido sin detenerse.</p>
                    </div>
                  </div>
                </section>

                {/* Sub-secciones de Carta */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <BarChart3 size={16} />
                    <h4 className="text-[11px] uppercase tracking-[0.2em] font-bold">Precisión por Categoría</h4>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Hemos dividido la carta en sub-secciones (Tapas, Carnes, Pescados, etc.). Esto permite al <strong>Jefe de Cocina</strong> saber exactamente qué familia de platos está generando más deseo, permitiendo ajustar el stock y la preparación diaria según la demanda en tiempo real.
                  </p>
                </section>

                {/* Tracking de Origen (QR) */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <QrCode size={16} />
                    <h4 className="text-[11px] uppercase tracking-[0.2em] font-bold">Detección de Origen Dinámico</h4>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">
                    El sistema detecta automáticamente si el cliente viene de un <strong>Escaneo QR en mesa</strong> o desde la web directa. Los datos de "Secciones más calientes" unifican ambos comportamientos para darte la visión más completa posible.
                  </p>
                </section>

                {/* Engagement Score */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <TrendingUp size={16} />
                    <h4 className="text-[11px] uppercase tracking-[0.2em] font-bold">¿Qué es el Engagement Score?</h4>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Es una nota del 0 al 10 que combina el <strong>tiempo promedio</strong> con el <strong>número de visitas</strong>. Una sección con Score alto significa que mucha gente la ve y, además, le dedica mucho tiempo.
                  </p>
                </section>
              </div>

              <div className="p-6 bg-[#D4AF37]/5 border-t border-[#D4AF37]/10 flex items-center gap-3">
                <Info size={16} className="text-[#D4AF37]" />
                <p className="text-[10px] text-[#D4AF37]/70 uppercase tracking-widest leading-relaxed">
                  Esta guía ayuda a la dirección y a la cocina a tomar decisiones basadas en datos reales de comportamiento.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Todos los Likes */}
      <AnimatePresence>
        {showAllLikesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-4xl bg-[#0A0A0A] border border-[#D4AF37]/20 rounded-sm shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="bg-[#D4AF37]/10 p-2 rounded-sm border border-[#D4AF37]/20">
                    <Heart size={18} className="text-[#D4AF37] fill-current" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif text-white uppercase tracking-wider">Resumen Global de Interacciones</h3>
                    <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">Todos los platos que han recibido "Me Gusta"</p>
                  </div>
                </div>
                <button onClick={() => setShowAllLikesModal(false)} className="text-white/20 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-12">
                
                {/* LIKED DISHES SECTION */}
                <div>
                  <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-6">Platos con Interacción</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Carta */}
                    <div>
                      <h4 className="font-serif text-xl text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                        <Star size={18} className="text-[#D4AF37]" /> Carta General
                      </h4>
                      {stats?.topProducts && stats.topProducts.length > 0 ? (
                        <div className="space-y-2">
                          {stats.topProducts.map((p, i) => {
                            const maxLikes = stats.topProducts[0].likes_count;
                            const minLikes = stats.topProducts[stats.topProducts.length - 1].likes_count;
                            const isMax = p.likes_count === maxLikes;
                            const isMin = p.likes_count === minLikes && maxLikes !== minLikes;
                            
                            return (
                              <div key={p.id} className={`flex items-center justify-between p-3 border rounded-sm transition-colors ${
                                isMax ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30' : 
                                isMin ? 'bg-red-500/5 border-red-500/20' : 
                                'bg-white/5 border-white/5 hover:bg-white/10'
                              }`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <span className={`font-mono text-[10px] w-4 ${isMax ? 'text-[#D4AF37]' : isMin ? 'text-red-500/60' : 'text-white/30'}`}>{i + 1}</span>
                                  <span className={`text-sm truncate ${isMax ? 'text-[#D4AF37] font-bold' : isMin ? 'text-red-400' : 'text-white'}`}>{p.name}</span>
                                </div>
                                <div className={`flex items-center gap-1.5 px-2 py-1 border rounded-sm shrink-0 ${
                                  isMax ? 'bg-[#D4AF37]/20 border-[#D4AF37]/40' : 
                                  isMin ? 'bg-red-500/10 border-red-500/20' : 
                                  'bg-white/10 border-white/10'
                                }`}>
                                  <Heart size={12} className={`fill-current ${isMax ? 'text-[#D4AF37]' : isMin ? 'text-red-500' : 'text-white/60'}`} />
                                  <span className={`text-xs font-bold tabular-nums ${isMax ? 'text-[#D4AF37]' : isMin ? 'text-red-500' : 'text-white'}`}>{p.likes_count}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-white/40 text-sm italic">No hay interacciones registradas en la carta.</p>
                      )}
                    </div>

                    {/* Menú del Día */}
                    <div>
                      <h4 className="font-serif text-xl text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                        <UtensilsCrossed size={18} className="text-[#D4AF37]" /> Menú del Día
                      </h4>
                      {stats?.topMenuDishes && stats.topMenuDishes.length > 0 ? (
                        <div className="space-y-2">
                          {stats.topMenuDishes.map((p, i) => {
                            const maxLikes = stats.topMenuDishes![0].likes_count;
                            const minLikes = stats.topMenuDishes![stats.topMenuDishes!.length - 1].likes_count;
                            const isMax = p.likes_count === maxLikes;
                            const isMin = p.likes_count === minLikes && maxLikes !== minLikes;
                            
                            return (
                              <div key={p.id} className={`flex items-center justify-between p-3 border rounded-sm transition-colors ${
                                isMax ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30' : 
                                isMin ? 'bg-red-500/5 border-red-500/20' : 
                                'bg-white/5 border-white/5 hover:bg-white/10'
                              }`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <span className={`font-mono text-[10px] w-4 ${isMax ? 'text-[#D4AF37]' : isMin ? 'text-red-500/60' : 'text-white/30'}`}>{i + 1}</span>
                                  <div className="flex items-center gap-2 truncate">
                                    <span className={`text-sm truncate ${isMax ? 'text-[#D4AF37] font-bold' : isMin ? 'text-red-400' : 'text-white'}`}>{p.name}</span>
                                    {p.daily_menus?.date && (
                                      <span className="text-[10px] text-white/30 font-mono whitespace-nowrap bg-white/5 px-1.5 py-0.5 rounded-sm">
                                        {new Date(p.daily_menus.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className={`flex items-center gap-1.5 px-2 py-1 border rounded-sm shrink-0 ${
                                  isMax ? 'bg-[#D4AF37]/20 border-[#D4AF37]/40' : 
                                  isMin ? 'bg-red-500/10 border-red-500/20' : 
                                  'bg-white/10 border-white/10'
                                }`}>
                                  <Heart size={12} className={`fill-current ${isMax ? 'text-[#D4AF37]' : isMin ? 'text-red-500' : 'text-white/60'}`} />
                                  <span className={`text-xs font-bold tabular-nums ${isMax ? 'text-[#D4AF37]' : isMin ? 'text-red-500' : 'text-white'}`}>{p.likes_count}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-white/40 text-sm italic">No hay interacciones registradas en el menú.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* UNLIKED DISHES SECTION */}
                <div className="pt-8 border-t border-white/10">
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-sm font-bold text-red-500/80 uppercase tracking-widest">Platos Sin Interacción (0 Likes)</h3>
                    <span className="text-[10px] text-white/30 uppercase">Menor visibilidad</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Unliked Carta */}
                    <div>
                      <h4 className="font-serif text-lg text-white/50 mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                        <Star size={14} className="text-white/20" /> Carta General
                      </h4>
                      <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {stats?.unlikedProducts && stats.unlikedProducts.length > 0 ? (
                          stats.unlikedProducts.map((p, i) => (
                            <div key={p.id} className="flex items-center justify-between p-2.5 bg-black/40 border border-white/5 rounded-sm">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <span className="text-white/20 text-xs truncate">{p.name}</span>
                              </div>
                              <span className="text-[9px] font-mono text-white/20">0 LIKES</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-white/20 text-xs italic">Todos los platos tienen likes.</p>
                        )}
                      </div>
                    </div>

                    {/* Unliked Menú */}
                    <div>
                      <h4 className="font-serif text-lg text-white/50 mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                        <UtensilsCrossed size={14} className="text-white/20" /> Menú del Día
                      </h4>
                      <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {stats?.unlikedMenuDishes && stats.unlikedMenuDishes.length > 0 ? (
                          stats.unlikedMenuDishes.map((p, i) => (
                            <div key={p.id} className="flex items-center justify-between p-2.5 bg-black/40 border border-white/5 rounded-sm">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <span className="text-white/20 text-xs truncate">{p.name}</span>
                              </div>
                              <span className="text-[9px] font-mono text-white/20">0 LIKES</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-white/20 text-xs italic">Todos los platos tienen likes.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

