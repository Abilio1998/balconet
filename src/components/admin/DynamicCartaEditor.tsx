'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Plus, Trash2, Save, Wand2, Loader2, Star,
  ChevronUp, ChevronDown, ChevronRight, UtensilsCrossed, Clock, Info,
  Search, X, Sun, Moon, Camera, Image as ImageIcon, Coffee,
  Copy, ArrowRightLeft, Eye, EyeOff, ArrowUp, Printer, FileDown, Sparkles, FileText, Globe, CalendarClock
} from 'lucide-react'
import FeaturedDishModal from '@/components/FeaturedDishModal'

type Product = {
  id?: string
  name: string
  name_ca?: string | null
  name_en?: string | null
  name_fr?: string | null
  description: string
  description_ca?: string | null
  description_en?: string | null
  description_fr?: string | null
  price?: number | null
  price_exterior?: number | null
  allergens: string[]
  order_index: number
  is_featured?: boolean
  is_web_featured?: boolean
  show_in_lunch?: boolean
  show_in_dinner?: boolean
  show_in_breakfast?: boolean
  show_in_ficha?: boolean
  available_days?: string[]
  image_url?: string | null
  image_alt?: string | null
  supplements?: {
    name: string
    name_ca?: string | null
    name_en?: string | null
    name_fr?: string | null
    price: number
  }[]
  promo_schedules?: {
    start: string
    end: string
    days: string[]
  }[]
}

type Category = {
  id?: string
  name: string
  name_ca?: string | null
  name_en?: string | null
  name_fr?: string | null
  is_visible?: boolean
  hide_in_full?: boolean
  show_in_ficha?: boolean
  pdf_layout_lunch?: string
  pdf_layout_dinner?: string
  order_index: number
  products: Product[]
}

type SettingsData = {
  id?: string
  lunch_start: string
  lunch_end: string
  dinner_start: string
  dinner_end: string
  lunch_menu_active?: boolean
  dinner_menu_active?: boolean
  breakfast_start: string
  breakfast_end: string
  breakfast_menu_active?: boolean
  lunch_full_weekend?: boolean
  dinner_full_weekend?: boolean
}

const ALLERGENS = [
  { id: 'gluten', icon: '🌾', label: 'Gluten' },
  { id: 'crustaceans', icon: '🦐', label: 'Crustáceos' },
  { id: 'eggs', icon: '🥚', label: 'Huevos' },
  { id: 'fish', icon: '🐟', label: 'Pescado' },
  { id: 'peanuts', icon: '🥜', label: 'Cacahuetes' },
  { id: 'soybeans', icon: '🌿', label: 'Soja' },
  { id: 'dairy', icon: '🥛', label: 'Lácteos' },
  { id: 'nuts', icon: '🌰', label: 'Frutos de cáscara' },
  { id: 'celery', icon: '🥬', label: 'Apio' },
  { id: 'mustard', icon: '🟡', label: 'Mostaza' },
  { id: 'sesame', icon: '🌱', label: 'Sésamo' },
  { id: 'sulphites', icon: '🍷', label: 'Sulfitos' },
  { id: 'lupin', icon: '🌼', label: 'Altramuces' },
  { id: 'molluscs', icon: '🐙', label: 'Moluscos' }
]

const WEEKDAYS = [
  { id: 'mon', label: 'L', name: 'Lunes' },
  { id: 'tue', label: 'M', name: 'Martes' },
  { id: 'wed', label: 'X', name: 'Miércoles' },
  { id: 'thu', label: 'J', name: 'Jueves' },
  { id: 'fri', label: 'V', name: 'Viernes' },
  { id: 'sat', label: 'S', name: 'Sábado' },
  { id: 'sun', label: 'D', name: 'Domingo' }
]

export default function DynamicCartaEditor({ onDirtyChange }: { onDirtyChange?: (isDirty: boolean) => void }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [translatingSection, setTranslatingSection] = useState<number | null>(null)
  const [translationProgress, setTranslationProgress] = useState<{ total: number; current: number } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [spellingCheck, setSpellingCheck] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [uploadingProd, setUploadingProd] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [activeMoveMenu, setActiveMoveMenu] = useState<{ catIdx: number; prodIdx: number } | null>(null)
  const [activePromoEditor, setActivePromoEditor] = useState<{ catIdx: number; prodIdx: number } | null>(null)
  const [previewPromoProduct, setPreviewPromoProduct] = useState<any | null>(null)
  const [showPromoSummary, setShowPromoSummary] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportLang, setExportLang] = useState('es')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cartaRes, settingsRes] = await Promise.all([
          fetch('/api/admin/carta-dynamic'),
          fetch('/api/admin/reservations?date=' + new Date().toISOString().split('T')[0])
        ])
        const cartaData = await cartaRes.json()
        const settingsData = await settingsRes.json()

        if (cartaData.carta) setCategories(cartaData.carta)
        if (settingsData.settings) setSettings(settingsData.settings)
        // Solo resetear isDirty tras cargar los datos iniciales
        setTimeout(() => setIsDirty(false), 100)
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Prevent leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = '' // Required for Chrome
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  // Track settings changes to activate the Save button when schedules/toggles change.
  // We use a ref to store the "clean" (server-loaded) version and only set dirty
  // when the user actually changes something after the initial load.
  const initialSettingsRef = useRef<SettingsData | null>(null)
  const settingsLoadedRef = useRef(false)

  useEffect(() => {
    if (!settings) return

    // First time settings arrive from server → store as baseline, don't mark dirty
    if (!settingsLoadedRef.current) {
      initialSettingsRef.current = settings
      settingsLoadedRef.current = true
      return
    }

    // Any subsequent change → mark dirty so Save button lights up
    setIsDirty(true)
  }, [settings])

  const addCategory = () => {
    const newCategory: Category = {
      name: '',
      order_index: categories.length,
      pdf_layout_lunch: 'classic',
      pdf_layout_dinner: 'classic',
      products: []
    }
    setCategories([...categories, newCategory])
    setIsDirty(true)
  }

  const removeCategory = (index: number) => {
    if (!confirm('¿Eliminar esta sección completa y todos sus platos?')) return
    setCategories(categories.filter((_, i) => i !== index))
    setIsDirty(true)
  }

  const updateCategory = (index: number, field: keyof Category, value: any) => {
    const newCategories = [...categories]
    const updated = { ...newCategories[index], [field]: value }

    if (field === 'name' && value !== newCategories[index].name) {
      updated.name_ca = ''
      updated.name_en = ''
      updated.name_fr = ''
    }

    newCategories[index] = updated
    setCategories(newCategories)
    setIsDirty(true)
  }

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === categories.length - 1) return

    const newCategories = [...categories]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newCategories[index]
    newCategories[index] = newCategories[targetIndex]
    newCategories[targetIndex] = temp

    newCategories.forEach((cat, i) => cat.order_index = i)
    setCategories(newCategories)
    setIsDirty(true)
  }

  const addProduct = (catIndex: number) => {
    const newProduct: Product = {
      name: '',
      description: '',
      allergens: [],
      order_index: categories[catIndex].products.length,
      show_in_lunch: true,
      show_in_dinner: true,
      show_in_breakfast: true,
      available_days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    }
    const newCategories = [...categories]
    newCategories[catIndex].products.push(newProduct)
    setCategories(newCategories)
    setIsDirty(true)
  }

  const removeProduct = (catIndex: number, prodIndex: number) => {
    if (!confirm('¿Seguro que quieres eliminar este plato?')) return
    const newCategories = [...categories]
    newCategories[catIndex].products = newCategories[catIndex].products.filter((_, i) => i !== prodIndex)
    setCategories(newCategories)
    setIsDirty(true)
  }

  const duplicateProduct = (catIndex: number, prodIndex: number) => {
    const newCategories = [...categories]
    const prod = { ...newCategories[catIndex].products[prodIndex] }
    // Remove ID to ensure it's created as a new record in DB
    delete prod.id
    // Mark as copy in name for clarity
    prod.name = `${prod.name} (Copia)`

    newCategories[catIndex].products.splice(prodIndex + 1, 0, prod)
    // Update order indices
    newCategories[catIndex].products.forEach((p, i) => p.order_index = i)
    setCategories(newCategories)
    setIsDirty(true)
  }

  const moveProductToCategory = (catIndex: number, prodIndex: number, targetCatIndex: number) => {
    if (catIndex === targetCatIndex) return
    const newCategories = [...categories]
    const [prod] = newCategories[catIndex].products.splice(prodIndex, 1)
    newCategories[targetCatIndex].products.push(prod)

    // Update order indices for both categories
    newCategories[catIndex].products.forEach((p, i) => p.order_index = i)
    newCategories[targetCatIndex].products.forEach((p, i) => p.order_index = i)
    setCategories(newCategories)
    setIsDirty(true)
  }

  const toggleCategory = (index: number) => {
    const newSet = new Set(expandedCategories)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    setExpandedCategories(newSet)
  }

  const updateProduct = (catIndex: number, prodIndex: number, field: keyof Product, value: any) => {
    const newCategories = [...categories]
    const prod = newCategories[catIndex].products[prodIndex]
    const updated = { ...prod, [field]: value }

    if ((field === 'name' || field === 'description') && value !== prod[field]) {
      updated.name_ca = ''
      updated.name_en = ''
      updated.name_fr = ''
      updated.description_ca = ''
      updated.description_en = ''
      updated.description_fr = ''
    }

    newCategories[catIndex].products[prodIndex] = updated
    setCategories(newCategories)
    setIsDirty(true)
  }

  // Web Featured toggle is now handled by the advanced Promo Schedules modal,
  // but we can keep the basic toggle logic for fallback if we want, or just leave it.
  // Actually, setting is_web_featured might still be useful as a boolean fallback.
  const toggleWebFeatured = (catIdx: number, prodIdx: number) => {
    setActivePromoEditor({ catIdx, prodIdx })
  }

  const moveProduct = (catIndex: number, prodIndex: number, direction: 'up' | 'down') => {
    const products = categories[catIndex].products
    if (direction === 'up' && prodIndex === 0) return
    if (direction === 'down' && prodIndex === products.length - 1) return

    const newProducts = [...products]
    const targetIndex = direction === 'up' ? prodIndex - 1 : prodIndex + 1
    const temp = newProducts[prodIndex]
    newProducts[prodIndex] = newProducts[targetIndex]
    newProducts[targetIndex] = temp
    newProducts.forEach((p, i) => p.order_index = i)
    const newCategories = [...categories]
    newCategories[catIndex].products = newProducts
    setCategories(newCategories)
    setIsDirty(true)
  }

  // Bulk actions: toggle all lunch / all dinner
  const toggleAllSession = (session: 'lunch' | 'dinner' | 'breakfast', value: boolean) => {
    const sessionName = session === 'lunch' ? 'Mediodía' : session === 'dinner' ? 'Noche' : 'Desayuno';

    if (value) {
      // Confirmación para ACTIVAR TODOS
      if (!confirm(`¿Estás seguro de que quieres ACTIVAR TODOS los platos para la sesión de ${sessionName}? Esto hará que toda la carta sea visible para esa sesión en la web.`)) return;
    } else {
      // Confirmación para QUITAR TODOS
      if (!confirm(`¿Estás seguro de que quieres QUITAR TODOS los platos de la sesión de ${sessionName}? Esto dejará la carta vacía para esa sesión en la web.`)) return;
    }

    setCategories(prev => prev.map(cat => ({
      ...cat,
      products: cat.products.map(p => ({
        ...p,
        show_in_lunch: session === 'lunch' ? value : p.show_in_lunch,
        show_in_dinner: session === 'dinner' ? value : p.show_in_dinner,
        show_in_breakfast: session === 'breakfast' ? value : p.show_in_breakfast,
      }))
    })))
  }

  const getBreakfastState = () => {
    const all = categories.flatMap(c => c.products)
    const activeCount = all.filter(p => p.show_in_breakfast !== false).length
    return activeCount === 0 ? 'none' : activeCount === all.length ? 'all' : 'some'
  }

  const getLunchState = () => {
    const all = categories.flatMap(c => c.products)
    const activeCount = all.filter(p => p.show_in_lunch !== false).length
    return activeCount === 0 ? 'none' : activeCount === all.length ? 'all' : 'some'
  }

  const getDinnerState = () => {
    const all = categories.flatMap(c => c.products)
    const activeCount = all.filter(p => p.show_in_dinner !== false).length
    return activeCount === 0 ? 'none' : activeCount === all.length ? 'all' : 'some'
  }

  const handleProductImageUpload = async (catIndex: number, prodIndex: number, file: File) => {
    const prodId = `${catIndex}-${prodIndex}`
    setUploadingProd(prodId)

    try {
      // 1. Compress Image (Max width 1200px, 0.8 quality)
      const compressedFile = await new Promise<File>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height

            const MAX_WIDTH = 1200
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx?.drawImage(img, 0, 0, width, height)

            canvas.toBlob((blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }))
              } else {
                reject(new Error('Compression failed'))
              }
            }, 'image/jpeg', 0.8)
          }
          img.src = e.target?.result as string
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // 2. Upload
      const formData = new FormData()
      formData.append('file', compressedFile)
      formData.append('type', 'dish')

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (data.url) {
        updateProduct(catIndex, prodIndex, 'image_url', data.url)
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (err: any) {
      console.error('Error uploading product image:', err)
      alert('Error al subir la imagen: ' + err.message)
    } finally {
      setUploadingProd(null)
    }
  }

  const handleSpellcheck = async () => {
    setSpellingCheck(true)
    setMessage(null)
    try {
      const itemsToCorrect: any[] = []

      categories.forEach((cat, catIdx) => {
        if (cat.name.trim()) {
          itemsToCorrect.push({ id: `cat-${catIdx}`, name: cat.name, type: 'category' })
        }
        cat.products.forEach((prod, prodIdx) => {
          if (prod.name.trim()) {
            itemsToCorrect.push({
              id: `prod-${catIdx}-${prodIdx}`,
              name: prod.name,
              description: prod.description,
              type: 'product'
            })
          }
        })
      })

      if (itemsToCorrect.length === 0) {
        setSpellingCheck(false)
        return
      }

      const res = await fetch('/api/admin/spellcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToCorrect })
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Error en corrección')

      let changesMade = 0
      const newCategories = [...categories]

      data.items.forEach((corrected: any) => {
        const [type, catIdxStr, prodIdxStr] = corrected.id.split('-')
        const catIdx = parseInt(catIdxStr)

        if (type === 'cat') {
          if (newCategories[catIdx].name !== corrected.name) {
            newCategories[catIdx].name = corrected.name
            newCategories[catIdx].name_ca = ''
            newCategories[catIdx].name_en = ''
            newCategories[catIdx].name_fr = ''
            changesMade++
          }
        } else {
          const prodIdx = parseInt(prodIdxStr)
          const p = newCategories[catIdx].products[prodIdx]
          if (p.name !== corrected.name || p.description !== corrected.description) {
            newCategories[catIdx].products[prodIdx] = {
              ...p,
              name: corrected.name,
              description: corrected.description,
              name_ca: '', name_en: '', name_fr: '',
              description_ca: '', description_en: '', description_fr: ''
            }
            changesMade++
          }
        }
      })

      setCategories(newCategories)
      if (changesMade > 0) {
        setMessage({ type: 'success', text: `✓ Ortografía revisada. Se han corregido ${changesMade} elemento(s). Las traducciones se actualizarán al guardar.` })
      } else {
        setMessage({ type: 'success', text: '✓ Ortografía revisada. Todo parece estar escrito correctamente.' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al corregir ortografía' })
    } finally {
      setSpellingCheck(false)
    }
  }

  const handleExportPDF = async (session: 'breakfast' | 'lunch' | 'dinner') => {
    setExportingPdf(true)
    try {
      const res = await fetch('/api/admin/export-session-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories,
          lang: exportLang,
          session: session
        })
      })

      if (!res.ok) throw new Error('Fallo al generar PDF')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const names: any = { breakfast: 'Desayuno', lunch: 'Mediodia', dinner: 'Noche' }
      a.download = `Carta_${names[session]}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setMessage({ type: 'success', text: `✓ PDF de ${names[session]} generado con éxito.` })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Error al exportar el PDF.' })
    } finally {
      setExportingPdf(false)
    }
  }

  // ── TRADUCIR SECCIÓN COMPLETA ──────────────────────────────────────
  // Traduce todos los platos de una sección que no tengan traducción.
  // Si todos ya tienen, pregunta si quiere re-traducir todos.
  const handleTranslateSection = async (catIdx: number) => {
    const cat = categories[catIdx]
    if (!cat) return

    const allProducts = cat.products.filter(p => p.name.trim())
    if (allProducts.length === 0) {
      alert('Esta sección no tiene platos con nombre para traducir.')
      return
    }

    const untranslated = allProducts.filter(p => !p.name_ca || !p.name_en || !p.name_fr)
    const toTranslate = untranslated.length > 0
      ? untranslated
      : (() => {
          if (!confirm(`Todos los platos de "${cat.name}" ya tienen traducción.\n\n¿Quieres re-traducir todos (${allProducts.length} platos) desde cero?`)) return []
          return allProducts
        })()

    if (toTranslate.length === 0) return

    setTranslatingSection(catIdx)
    const updatedCategories = [...categories]
    const updatedProducts = [...updatedCategories[catIdx].products]

    let translated = 0
    for (const prod of toTranslate) {
      const realIdx = updatedProducts.findIndex(p => p === prod || (p.name === prod.name && p.order_index === prod.order_index))
      if (realIdx === -1) continue

      try {
        const res = await fetch('/api/admin/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: prod.name,
            description: prod.description?.trim() || undefined,
            supplements: prod.supplements?.map(s => s.name)
          })
        })
        const data = await res.json()
        if (res.ok && data.success) {
          updatedProducts[realIdx] = {
            ...updatedProducts[realIdx],
            name_ca: data.translations.ca?.name || updatedProducts[realIdx].name_ca,
            name_en: data.translations.en?.name || updatedProducts[realIdx].name_en,
            name_fr: data.translations.fr?.name || updatedProducts[realIdx].name_fr,
            description_ca: data.translations.ca?.description || updatedProducts[realIdx].description_ca,
            description_en: data.translations.en?.description || updatedProducts[realIdx].description_en,
            description_fr: data.translations.fr?.description || updatedProducts[realIdx].description_fr,
          }
          translated++
        }
      } catch (e) {
        console.error(`Error translating "${prod.name}":`, e)
      }
    }

    // También traducir el nombre de la sección si no tiene traducción o si el usuario forzó re-traducción total
    const forceTranslateSection = untranslated.length === 0 && toTranslate.length > 0;
    if (forceTranslateSection || !cat.name_ca || !cat.name_en || !cat.name_fr) {
      try {
        const res = await fetch('/api/admin/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cat.name })
        })
        const data = await res.json()
        if (res.ok && data.success) {
          updatedCategories[catIdx] = {
            ...updatedCategories[catIdx],
            name_ca: data.translations.ca?.name || updatedCategories[catIdx].name_ca,
            name_en: data.translations.en?.name || updatedCategories[catIdx].name_en,
            name_fr: data.translations.fr?.name || updatedCategories[catIdx].name_fr,
          }
        }
      } catch (e) {
        console.error('Error translating section name:', e)
      }
    }

    updatedCategories[catIdx] = { ...updatedCategories[catIdx], products: updatedProducts }
    setCategories(updatedCategories)
    setIsDirty(true)
    setTranslatingSection(null)
    setMessage({ type: 'success', text: `✓ Sección "${cat.name}": ${translated} plato(s) traducidos. Guarda para confirmar.` })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      if (settings) {
        await fetch('/api/admin/reservations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        })
      }

      const categoriesToTranslate = categories.filter(c => c.name && !c.name_ca)
      const productsToTranslate = categories.flatMap(c => c.products).filter(p => p.name && !p.name_ca)

      const totalToTranslate = categoriesToTranslate.length + productsToTranslate.length

      const updatedCategories = [...categories]

      if (totalToTranslate > 0) {
        setTranslationProgress({ total: totalToTranslate, current: 0 })

        for (let i = 0; i < updatedCategories.length; i++) {
          const cat = updatedCategories[i]
          // Solo traducir si el nombre existe y no tiene traducción al catalán (indicador de que falta traducir)
          if (cat.name && !cat.name_ca) {
            const res = await fetch('/api/admin/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: cat.name })
            })
            const data = await res.json()
            if (data.success) {
              updatedCategories[i].name_ca = data.translations.ca.name
              updatedCategories[i].name_en = data.translations.en.name
              updatedCategories[i].name_fr = data.translations.fr.name
            }
            setTranslationProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null)
          }

          for (let j = 0; j < updatedCategories[i].products.length; j++) {
            const prod = updatedCategories[i].products[j]
            // Solo traducir si el nombre existe y no tiene traducción (o si se ha modificado y se han limpiado las traducciones)
            if (prod.name && !prod.name_ca) {
              const res = await fetch('/api/admin/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: prod.name,
                  description: prod.description,
                  supplements: prod.supplements?.map(s => s.name)
                })
              })
              const data = await res.json()
              if (data.success) {
                updatedCategories[i].products[j].name_ca = data.translations.ca.name
                updatedCategories[i].products[j].name_en = data.translations.en.name
                updatedCategories[i].products[j].name_fr = data.translations.fr.name
                updatedCategories[i].products[j].description_ca = data.translations.ca.description
                updatedCategories[i].products[j].description_en = data.translations.en.description
                updatedCategories[i].products[j].description_fr = data.translations.fr.description

                // Translate supplements names
                if (prod.supplements && data.translations.ca.supplements) {
                  updatedCategories[i].products[j].supplements = prod.supplements.map((s, sIdx) => ({
                    ...s,
                    name_ca: data.translations.ca.supplements[sIdx],
                    name_en: data.translations.en.supplements[sIdx],
                    name_fr: data.translations.fr.supplements[sIdx],
                  }))
                }
              }
              setTranslationProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null)
            }
          }
        }
      }

      const res = await fetch('/api/admin/carta-dynamic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCategories)
      })

      if (!res.ok) {
        const errorData = await res.json()
        const detailMsg = errorData.details
          ? (Array.isArray(errorData.details)
            ? errorData.details.map((d: any) => `${d.path?.join('.')} ${d.message}`).join(', ')
            : (typeof errorData.details === 'object' ? JSON.stringify(errorData.details) : errorData.details))
          : (errorData.error || 'Error desconocido')
        throw new Error(`Error del servidor: ${detailMsg}`)
      }

      setCategories(updatedCategories)
      setMessage({ type: 'success', text: '✓ Carta guardada y traducida automáticamente con éxito.' })
      setIsDirty(false)

      setTimeout(() => setMessage(null), 5000)

    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Error al guardar los cambios.' })
    } finally {
      setSaving(false)
      setTranslationProgress(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={32} className="text-[#D4AF37] animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif text-white mb-1 flex items-center gap-2">
            <UtensilsCrossed size={18} className="text-[#D4AF37]" />
            Editor de Carta Dinámica
          </h2>
          <p className="text-white/40 text-sm">Gestiona secciones, platos y alérgenos. Todo se traduce al guardar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={addCategory}
            className="px-4 py-3 border border-white/20 text-white/70 text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2 rounded-sm"
          >
            <Plus size={16} /> Añadir Sección
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSpellcheck}
              disabled={saving || spellingCheck}
              className="px-4 py-3 border border-[#D4AF37]/50 text-[#D4AF37] text-sm hover:bg-[#D4AF37]/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {spellingCheck ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Revisando...
                </span>
              ) : (
                <>
                  <Wand2 size={16} /> Revisar Ortografía
                </>
              )}
            </button>

            <button
              onClick={() => setShowPromoSummary(true)}
              className="px-4 py-3 border border-white/20 text-[#D4AF37] text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2 rounded-sm"
            >
              <CalendarClock size={16} /> Ver Promociones
            </button>

            <button
              onClick={handleSave}
              disabled={saving || spellingCheck || !isDirty}
              className={`px-8 py-3 flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 rounded-sm ${isDirty ? 'btn-gold shadow-[#D4AF37]/20 border border-[#D4AF37]' : 'bg-white/5 text-white/40 border border-white/10'}`}
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {translationProgress ? `Traduciendo...` : 'Guardando...'}
                </>
              ) : (
                <>
                  <Save size={18} /> {isDirty ? 'GUARDAR CAMBIOS *' : 'GUARDADO'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 border text-sm rounded-sm ${message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Bulk session actions toolbar */}
      <div className="flex flex-wrap items-center gap-y-3 gap-x-2 p-4 bg-white/[0.02] border border-white/5 rounded-sm">
        <div className="flex flex-wrap items-center gap-2 mr-2">
          <Coffee size={13} className="text-orange-400" />
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Desayuno:</span>
          <button
            onClick={() => toggleAllSession('breakfast' as any, true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[10px] font-bold uppercase tracking-widest transition-all ${getBreakfastState() === 'all' ? 'bg-orange-400/20 border-orange-400/50 text-orange-300' : 'border-white/10 text-white/40 hover:text-orange-300 hover:border-orange-400/30'
              }`}
          >
            Activar todos
          </button>
          <button
            onClick={() => toggleAllSession('breakfast' as any, false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[10px] font-bold uppercase tracking-widest transition-all ${getBreakfastState() === 'none' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30'
              }`}
          >
            <X size={11} /> Quitar todos
          </button>
        </div>

        <span className="w-px h-5 bg-white/10 hidden sm:block" />

        <div className="flex flex-wrap items-center gap-2 mr-2">
          <Sun size={13} className="text-yellow-400" />
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Mediodía:</span>
          <button
            onClick={() => toggleAllSession('lunch', true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[10px] font-bold uppercase tracking-widest transition-all ${getLunchState() === 'all' ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300' : 'border-white/10 text-white/40 hover:text-yellow-300 hover:border-yellow-400/30'
              }`}
          >
            Activar todos
          </button>
          <button
            onClick={() => toggleAllSession('lunch', false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[10px] font-bold uppercase tracking-widest transition-all ${getLunchState() === 'none' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30'
              }`}
          >
            <X size={11} /> Quitar todos
          </button>
        </div>

        <span className="w-px h-5 bg-white/10 hidden sm:block" />

        <div className="flex flex-wrap items-center gap-2">
          <Moon size={13} className="text-blue-400" />
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Noche:</span>
          <button
            onClick={() => toggleAllSession('dinner', true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[10px] font-bold uppercase tracking-widest transition-all ${getDinnerState() === 'all' ? 'bg-blue-400/20 border-blue-400/50 text-blue-300' : 'border-white/10 text-white/40 hover:text-blue-300 hover:border-blue-400/30'
              }`}
          >
            Activar todos
          </button>
          <button
            onClick={() => toggleAllSession('dinner', false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[10px] font-bold uppercase tracking-widest transition-all ${getDinnerState() === 'none' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30'
              }`}
          >
            <X size={11} /> Quitar todos
          </button>
        </div>

        <span className="w-px h-5 bg-white/10 hidden sm:block" />

        {/* PDF Export Action */}
        {/* PDF Export Action */}
        {/* PDF Export Action */}
        <div className="flex flex-wrap items-center gap-3 bg-white/5 p-2 rounded-sm border border-white/5">
          <div className="flex items-center gap-1">
            {['es', 'ca', 'en', 'fr'].map((l) => (
              <button
                key={l}
                onClick={() => setExportLang(l)}
                className={`px-2.5 py-1.5 text-[10px] font-bold uppercase rounded-sm transition-all ${exportLang === l ? 'bg-[#D4AF37] text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="flex gap-2 border-l border-white/10 pl-3">
            <button
              onClick={() => handleExportPDF('breakfast')}
              disabled={exportingPdf}
              className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 text-orange-400 rounded-sm hover:bg-orange-500/40 transition-all disabled:opacity-50"
              title="Exportar PDF Desayuno"
            >
              <Coffee size={16} />
              <span className="text-[9px] font-bold uppercase hidden sm:inline">Desayuno</span>
            </button>
            <button
              onClick={() => handleExportPDF('lunch')}
              disabled={exportingPdf}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-sm hover:bg-yellow-500/40 transition-all disabled:opacity-50"
              title="Exportar PDF Mediodía"
            >
              <Sun size={16} />
              <span className="text-[9px] font-bold uppercase hidden sm:inline">Comida</span>
            </button>
            <button
              onClick={() => handleExportPDF('dinner')}
              disabled={exportingPdf}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-sm hover:bg-blue-500/40 transition-all disabled:opacity-50"
              title="Exportar PDF Noche"
            >
              <Moon size={16} />
              <span className="text-[9px] font-bold uppercase hidden sm:inline">Cena</span>
            </button>
          </div>
        </div>
      </div>


      <div className="sticky top-0 z-30 py-4 -mt-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#D4AF37] transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o sección (ej: Postres, Crema Catalana...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111111] border border-white/10 rounded-sm py-4 pl-12 pr-12 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all placeholder:text-white/10"
          />
          {searchTerm && (
            <div className="absolute right-14 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold bg-[#D4AF37]/10 px-2 py-1 rounded-full">
              {categories.reduce((acc, cat) => {
                const count = cat.products.filter(p =>
                  p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  cat.name.toLowerCase().includes(searchTerm.toLowerCase())
                ).length
                return acc + count
              }, 0)} resultados
            </div>
          )}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {settings && (
        <div className="bg-[#111111] border border-white/10 rounded-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-serif text-lg flex items-center gap-2">
              <Clock size={18} className="text-[#D4AF37]" />
              Horarios de Sesiones Gastronómicas
            </h3>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-[#D4AF37] text-xs uppercase tracking-widest hover:underline"
            >
              {showSettings ? 'Ocultar Configuración' : 'Editar Horarios'}
            </button>
          </div>

          {showSettings && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-white/30 text-[10px] uppercase tracking-widest mb-2 block">Inicio Desayuno</label>
                  <input
                    type="time"
                    value={settings.breakfast_start || '08:00'}
                    onChange={e => setSettings({ ...settings, breakfast_start: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="text-white/30 text-[10px] uppercase tracking-widest mb-2 block">Fin Desayuno</label>
                  <input
                    type="time"
                    value={settings.breakfast_end || '12:00'}
                    onChange={e => setSettings({ ...settings, breakfast_end: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-white/30 text-[10px] uppercase tracking-widest mb-2 block">Inicio Almuerzo</label>
                  <input
                    type="time"
                    value={settings.lunch_start}
                    onChange={e => setSettings({ ...settings, lunch_start: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="text-white/30 text-[10px] uppercase tracking-widest mb-2 block">Fin Almuerzo</label>
                  <input
                    type="time"
                    value={settings.lunch_end}
                    onChange={e => setSettings({ ...settings, lunch_end: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-white/30 text-[10px] uppercase tracking-widest mb-2 block">Inicio Cena</label>
                  <input
                    type="time"
                    value={settings.dinner_start}
                    onChange={e => setSettings({ ...settings, dinner_start: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="text-white/30 text-[10px] uppercase tracking-widest mb-2 block">Fin Cena</label>
                  <input
                    type="time"
                    value={settings.dinner_end}
                    onChange={e => setSettings({ ...settings, dinner_end: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="md:col-span-1 flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-sm">
                <div className="flex flex-col">
                  <span className="text-white text-xs font-medium">Carta Desayuno</span>
                  <button onClick={() => setSettings({ ...settings, breakfast_menu_active: !settings.breakfast_menu_active })} className={`w-10 h-5 rounded-full p-1 transition-colors mt-1 ${settings.breakfast_menu_active ? 'bg-orange-500' : 'bg-white/10'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${settings.breakfast_menu_active ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <div className="md:col-span-1 flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-sm">
                <div className="flex flex-col">
                  <span className="text-white text-xs font-medium">Carta Mediodía</span>
                  <button onClick={() => setSettings({ ...settings, lunch_menu_active: !settings.lunch_menu_active })} className={`w-10 h-5 rounded-full p-1 transition-colors mt-1 ${settings.lunch_menu_active ? 'bg-yellow-400' : 'bg-white/10'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${settings.lunch_menu_active ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <div className="md:col-span-1 flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-sm">
                <div className="flex flex-col">
                  <span className="text-white text-xs font-medium">Carta Noche</span>
                  <button onClick={() => setSettings({ ...settings, dinner_menu_active: !settings.dinner_menu_active })} className={`w-10 h-5 rounded-full p-1 transition-colors mt-1 ${settings.dinner_menu_active ? 'bg-blue-500' : 'bg-white/10'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${settings.dinner_menu_active ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 flex items-center justify-between p-4 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-sm">
                <div className="flex flex-col">
                  <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Fines de Semana: Carta Completa</span>
                  <p className="text-[9px] text-white/40 mt-1">Si se desactiva, se mostrará la mini-carta (Sol/Luna) también en sábados y domingos.</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[8px] text-white/30 uppercase font-bold">Mediodía</span>
                    <button onClick={() => setSettings({ ...settings, lunch_full_weekend: !settings.lunch_full_weekend })} className={`w-10 h-5 rounded-full p-1 transition-colors ${settings.lunch_full_weekend !== false ? 'bg-[#D4AF37]' : 'bg-white/10'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${settings.lunch_full_weekend !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[8px] text-white/30 uppercase font-bold">Noche</span>
                    <button onClick={() => setSettings({ ...settings, dinner_full_weekend: !settings.dinner_full_weekend })} className={`w-10 h-5 rounded-full p-1 transition-colors ${settings.dinner_full_weekend !== false ? 'bg-[#D4AF37]' : 'bg-white/10'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${settings.dinner_full_weekend !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 p-3 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-sm">
                <p className="text-[10px] text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                  <Info size={12} />
                  Estos horarios definen cuándo se muestra la "Mini-Carta" seleccionada en la web.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-12">
        {categories.map((cat, catIdx) => {
          const filteredProducts = searchTerm.trim() === ''
            ? cat.products
            : cat.products.filter(p =>
              p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              cat.name.toLowerCase().includes(searchTerm.toLowerCase())
            )

          if (searchTerm.trim() !== '' && filteredProducts.length === 0) return null

          return (
            <div key={catIdx} className="bg-[#111111] border border-white/10 rounded-sm p-4 md:p-6 relative group/cat transition-all hover:border-white/20">
              <div className="flex flex-col gap-4 mb-4 pb-4 border-b border-white/5">
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => toggleCategory(catIdx)}
                    className="p-2 text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-sm transition-colors"
                    title={expandedCategories.has(catIdx) ? "Contraer sección" : "Expandir sección"}
                  >
                    {expandedCategories.has(catIdx) ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                  </button>
                  <div className="flex-1">
                    <label className="text-white/30 text-[10px] uppercase tracking-widest mb-1 block">Nombre de la Sección (Es)</label>
                    <input
                      type="text"
                      value={cat.name}
                      onChange={e => updateCategory(catIdx, 'name', e.target.value)}
                      placeholder="Ej: Para Picar, Carnes, Postres..."
                      className="bg-transparent text-2xl font-serif text-[#D4AF37] focus:outline-none w-full border-b border-transparent focus:border-[#D4AF37]/30 py-1 mb-3"
                    />
                    
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex flex-col xs:flex-row xs:items-center gap-1.5 xs:gap-2">
                        <label className="text-white/40 text-[9px] uppercase tracking-widest w-20 shrink-0">Mediodía:</label>
                        <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => updateCategory(catIdx, 'pdf_layout_lunch', 'classic')}
                          className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm transition-colors border ${(cat.pdf_layout_lunch === 'classic' || !cat.pdf_layout_lunch) ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-white/30 border-white/5 hover:border-white/10'}`}
                        >
                          📄 Clásico
                        </button>
                        <button
                          onClick={() => updateCategory(catIdx, 'pdf_layout_lunch', 'primary')}
                          className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm transition-colors border ${cat.pdf_layout_lunch === 'primary' ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]' : 'bg-transparent text-white/30 border-white/5 hover:border-white/10'}`}
                        >
                          ✨ Destacado
                        </button>
                        <button
                          onClick={() => updateCategory(catIdx, 'pdf_layout_lunch', 'secondary')}
                          className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm transition-colors border ${cat.pdf_layout_lunch === 'secondary' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-transparent text-white/30 border-white/5 hover:border-white/10'}`}
                        >
                          ⏸ Secundario
                        </button>
                        <button
                          onClick={() => updateCategory(catIdx, 'pdf_layout_lunch', 'dessert')}
                          className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm transition-colors border ${cat.pdf_layout_lunch === 'dessert' ? 'bg-pink-500/20 text-pink-400 border-pink-500/50' : 'bg-transparent text-white/30 border-white/5 hover:border-white/10'}`}
                        >
                          🍰 Postres
                        </button>
                        </div>
                      </div>
                      <div className="flex flex-col xs:flex-row xs:items-center gap-1.5 xs:gap-2">
                        <label className="text-white/40 text-[9px] uppercase tracking-widest w-20 shrink-0">Cenas:</label>
                        <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => updateCategory(catIdx, 'pdf_layout_dinner', 'classic')}
                          className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm transition-colors border ${(cat.pdf_layout_dinner === 'classic' || !cat.pdf_layout_dinner) ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-white/30 border-white/5 hover:border-white/10'}`}
                        >
                          📄 Clásico
                        </button>
                        <button
                          onClick={() => updateCategory(catIdx, 'pdf_layout_dinner', 'primary')}
                          className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm transition-colors border ${cat.pdf_layout_dinner === 'primary' ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]' : 'bg-transparent text-white/30 border-white/5 hover:border-white/10'}`}
                        >
                          ✨ Destacado
                        </button>
                        <button
                          onClick={() => updateCategory(catIdx, 'pdf_layout_dinner', 'secondary')}
                          className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm transition-colors border ${cat.pdf_layout_dinner === 'secondary' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-transparent text-white/30 border-white/5 hover:border-white/10'}`}
                        >
                          ⏸ Secundario
                        </button>
                        <button
                          onClick={() => updateCategory(catIdx, 'pdf_layout_dinner', 'dessert')}
                          className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm transition-colors border ${cat.pdf_layout_dinner === 'dessert' ? 'bg-pink-500/20 text-pink-400 border-pink-500/50' : 'bg-transparent text-white/30 border-white/5 hover:border-white/10'}`}
                        >
                          🍰 Postres
                        </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Section action buttons */}
                <div className="flex flex-wrap items-center gap-1.5 self-start md:self-center">
                  <button
                    onClick={() => updateCategory(catIdx, 'is_visible', cat.is_visible !== false ? false : true)}
                    className={`p-2 transition-colors ${cat.is_visible !== false ? 'text-[#D4AF37] hover:text-[#D4AF37]/80' : 'text-white/20 hover:text-white'}`}
                    title={cat.is_visible !== false ? 'Sección Visible Globalmente (Click para ocultar)' : 'Sección Oculta Globalmente (Click para mostrar)'}
                  >
                    {cat.is_visible !== false ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                  <button
                    onClick={() => updateCategory(catIdx, 'hide_in_full', !cat.hide_in_full)}
                    className={`p-2 transition-colors ${!cat.hide_in_full ? 'text-[#D4AF37] hover:text-[#D4AF37]/80' : 'text-red-400 hover:text-red-300'}`}
                    title={!cat.hide_in_full ? 'Visible en Carta Completa (Click para ocultar)' : 'Oculto en Carta Completa (Click para mostrar)'}
                  >
                    <div className="relative">
                      {cat.hide_in_full ? <EyeOff size={20} /> : <Eye size={20} />}
                      <span className="absolute -top-2 -right-2 text-[7px] bg-black/60 px-1 rounded-full border border-white/10 font-bold uppercase tracking-tighter">Full</span>
                    </div>
                  </button>
                  <button
                    onClick={() => updateCategory(catIdx, 'show_in_ficha', cat.show_in_ficha !== false ? false : true)}
                    className={`p-2 transition-colors ${cat.show_in_ficha !== false ? 'text-green-400 hover:text-green-300' : 'text-white/20 hover:text-white'}`}
                    title={cat.show_in_ficha !== false ? 'Incluido en Ficha Técnica (Click para excluir)' : 'Excluido de Ficha Técnica (Click para incluir)'}
                  >
                    <div className="relative">
                      <FileText size={20} />
                      {cat.show_in_ficha === false && <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-red-500 -rotate-45 transform origin-center" />}
                    </div>
                  </button>
                  <button
                    onClick={() => moveCategory(catIdx, 'up')}
                    disabled={catIdx === 0}
                    className="p-2 text-white/30 hover:text-white disabled:opacity-0 transition-colors"
                    title="Mover Sección Arriba"
                  >
                    <ChevronUp size={20} />
                  </button>
                  <button
                    onClick={() => moveCategory(catIdx, 'down')}
                    disabled={catIdx === categories.length - 1}
                    className="p-2 text-white/30 hover:text-white disabled:opacity-0 transition-colors"
                    title="Mover Sección Abajo"
                  >
                    <ChevronDown size={20} />
                  </button>
                  <button
                    onClick={() => handleTranslateSection(catIdx)}
                    disabled={translatingSection !== null}
                    className="p-2 text-blue-400/60 hover:text-blue-400 transition-colors disabled:opacity-40"
                    title={`Traducir todos los platos de "${cat.name || 'esta sección'}"`}
                  >
                    {translatingSection === catIdx
                      ? <Loader2 size={20} className="animate-spin" />
                      : <Globe size={20} />}
                  </button>
                  <button
                    onClick={() => removeCategory(catIdx)}
                    className="p-2 text-white/20 hover:text-red-500 transition-colors"
                    title="Eliminar Sección"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {expandedCategories.has(catIdx) && (
                <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                  {filteredProducts.map((prod, prodIdx) => {
                    const realProdIdx = cat.products.findIndex(p => p === prod)

                    return (
                      <div key={prodIdx} className="bg-white/[0.02] border border-white/5 p-5 rounded-sm relative group/prod hover:border-[#D4AF37]/20 transition-all">
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Image and Alt Text Column */}
                          <div className="flex flex-col gap-3">
                            <div className="w-full lg:w-48 h-48 lg:h-auto bg-black/40 border border-white/10 rounded-sm relative overflow-hidden group/img flex-shrink-0 min-h-[120px]">
                              {prod.image_url ? (
                                <>
                                  <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <label className="p-2 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer transition-colors">
                                      <Camera size={16} className="text-white" />
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleProductImageUpload(catIdx, realProdIdx, e.target.files[0])}
                                      />
                                    </label>
                                    <button
                                      onClick={() => updateProduct(catIdx, realProdIdx, 'image_url', null)}
                                      className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full transition-colors"
                                    >
                                      <Trash2 size={16} className="text-red-500" />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors group/label">
                                  {uploadingProd === `${catIdx}-${realProdIdx}` ? (
                                    <Loader2 size={24} className="text-[#D4AF37] animate-spin" />
                                  ) : (
                                    <>
                                      <ImageIcon size={24} className="text-white/10 group-hover/label:text-[#D4AF37] transition-colors mb-2" />
                                      <span className="text-[9px] uppercase tracking-widest text-white/20 group-hover/label:text-white/40">Añadir Foto</span>
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleProductImageUpload(catIdx, realProdIdx, e.target.files[0])}
                                  />
                                </label>
                              )}
                            </div>
                            <div className="w-full lg:w-48">
                              <label className="text-white/20 text-[9px] uppercase tracking-widest mb-1 block">Texto Alt (SEO)</label>
                              <input
                                type="text"
                                value={prod.image_alt || ''}
                                onChange={e => updateProduct(catIdx, realProdIdx, 'image_alt', e.target.value)}
                                placeholder="Describa la imagen..."
                                className="w-full bg-black/40 border border-white/10 rounded-sm py-2 px-3 text-[10px] text-white focus:outline-none focus:border-[#D4AF37]/50"
                                title="Texto que aparecerá si la imagen no carga y para lectores de pantalla. Mejora el SEO."
                              />
                            </div>
                          </div>

                          <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        <div className="md:col-span-8">
                                          <label className="text-white/20 text-[10px] uppercase tracking-[0.2em] mb-1.5 block">Nombre del Plato</label>
                                          <input
                                            type="text"
                                            value={prod.name}
                                            onChange={e => updateProduct(catIdx, realProdIdx, 'name', e.target.value)}
                                            placeholder="Ej: Patatas Bravas"
                                            className="admin-input"
                                          />
                                        </div>
                                        <div className="md:col-span-2">
                                          <label className="text-white/20 text-[10px] uppercase tracking-[0.2em] mb-1.5 block">Precio (€)</label>
                                          <input
                                            type="number"
                                            step="0.1"
                                            value={prod.price || ''}
                                            onChange={e => updateProduct(catIdx, realProdIdx, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                                            placeholder="12.50"
                                            className="admin-input"
                                          />
                                        </div>
                                        <div className="md:col-span-2">
                                          <label className="text-white/20 text-[10px] uppercase tracking-[0.2em] mb-1.5 block">Terraza (€)</label>
                                          <input
                                            type="number"
                                            step="0.1"
                                            value={prod.price_exterior || ''}
                                            onChange={e => updateProduct(catIdx, realProdIdx, 'price_exterior', e.target.value ? parseFloat(e.target.value) : null)}
                                            placeholder="13.00"
                                            className="admin-input"
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <label className="text-white/20 text-[10px] uppercase tracking-[0.2em] mb-1.5 block">Descripción (Ingredientes, elaboración...)</label>
                                        <textarea
                                          value={prod.description || ''}
                                          onChange={e => updateProduct(catIdx, realProdIdx, 'description', e.target.value)}
                                          placeholder="Con nuestra salsa brava casera ahumada..."
                                          className="admin-input min-h-[60px] resize-none"
                                        />
                                      </div>

                                      {/* Suplementos Section */}
                                      <div className="space-y-3 pt-4 border-t border-white/5">
                                        <div className="flex items-center justify-between mb-2">
                                          <label className="text-white/40 text-[9px] uppercase tracking-[0.2em] font-bold">Suplementos / Extras</label>
                                          <button
                                            onClick={() => {
                                              const current = prod.supplements || []
                                              updateProduct(catIdx, realProdIdx, 'supplements', [...current, { name: '', price: 0 }])
                                            }}
                                            className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-[#D4AF37] hover:text-white transition-colors"
                                          >
                                            <Plus size={12} /> Añadir Suplemento
                                          </button>
                                        </div>
                                        {(prod.supplements || []).map((sup, sIdx) => (
                                          <div key={sIdx} className="flex gap-3 items-center animate-in fade-in slide-in-from-left-2 duration-200">
                                            <div className="flex-1">
                                              <input
                                                type="text"
                                                value={sup.name}
                                                onChange={e => {
                                                  const newSups = [...(prod.supplements || [])]
                                                  newSups[sIdx] = { ...newSups[sIdx], name: e.target.value, name_ca: '', name_en: '', name_fr: '' }
                                                  updateProduct(catIdx, realProdIdx, 'supplements', newSups)
                                                }}
                                                placeholder="Ej: Con Foie"
                                                className="admin-input py-2 text-sm"
                                              />
                                            </div>
                                            <div className="w-28 relative">
                                              <input
                                                type="number"
                                                step="0.1"
                                                value={sup.price || ''}
                                                onChange={e => {
                                                  const newSups = [...(prod.supplements || [])]
                                                  newSups[sIdx] = { ...newSups[sIdx], price: parseFloat(e.target.value) || 0 }
                                                  updateProduct(catIdx, realProdIdx, 'supplements', newSups)
                                                }}
                                                placeholder="0.00"
                                                className="admin-input py-2 pl-7 text-sm"
                                              />
                                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-xs">+</span>
                                            </div>
                                            <button
                                              onClick={() => {
                                                const newSups = (prod.supplements || []).filter((_, i) => i !== sIdx)
                                                updateProduct(catIdx, realProdIdx, 'supplements', newSups)
                                              }}
                                              className="p-2 text-white/20 hover:text-red-500 transition-colors"
                                              title="Eliminar suplemento"
                                            >
                                              <Trash2 size={16} />
                                            </button>
                                          </div>
                                        ))}
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <label className="text-white/20 text-[10px] uppercase tracking-[0.2em] mb-3 block">Días Disponible</label>
                                          <div className="flex flex-wrap gap-2">
                                            {WEEKDAYS.map(day => {
                                              // Retrocompatibility: If undefined, assume everyday
                                              const currentDays = prod.available_days || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
                                              const isActive = currentDays.includes(day.id)

                                              return (
                                                <button
                                                  key={day.id}
                                                  onClick={() => {
                                                    const newVal = isActive
                                                      ? currentDays.filter(d => d !== day.id)
                                                      : [...currentDays, day.id]
                                                    updateProduct(catIdx, realProdIdx, 'available_days', newVal)
                                                  }}
                                                  className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-bold transition-all ${isActive
                                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                                                    : 'bg-white/5 border border-white/5 text-white/30 hover:text-white/60 hover:border-white/20'
                                                    }`}
                                                  title={day.name}
                                                >
                                                  {day.label}
                                                </button>
                                              )
                                            })}
                                          </div>
                                        </div>

                                        <div>
                                          <label className="text-white/20 text-[10px] uppercase tracking-[0.2em] mb-3 block">Alérgenos</label>
                                          <div className="flex flex-wrap gap-2">
                                            {ALLERGENS.map(allergen => (
                                              <button
                                                key={allergen.id}
                                                onClick={() => {
                                                  const current = prod.allergens || []
                                                  const newVal = current.includes(allergen.id)
                                                    ? current.filter(a => a !== allergen.id)
                                                    : [...current, allergen.id]
                                                  updateProduct(catIdx, realProdIdx, 'allergens', newVal)
                                                }}
                                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] transition-all ${(prod.allergens || []).includes(allergen.id)
                                                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                                                  : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'
                                                  }`}
                                                title={allergen.label}
                                              >
                                                <span className={(prod.allergens || []).includes(allergen.id) ? 'grayscale-0' : 'grayscale'}>{allergen.icon}</span>
                                                <span className="uppercase tracking-widest">{allergen.label}</span>
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex md:flex-col justify-end md:justify-start gap-2 border-l border-white/5 pl-4 md:border-l-0">
                                      <div className="flex md:flex-col gap-1">
                                        <button
                                          onClick={() => moveProduct(catIdx, realProdIdx, 'up')}
                                          disabled={realProdIdx === 0}
                                          className="p-1.5 text-white/30 hover:text-white disabled:opacity-0 transition-colors"
                                        >
                                          <ChevronUp size={18} />
                                        </button>
                                        <button
                                          onClick={() => moveProduct(catIdx, realProdIdx, 'down')}
                                          disabled={realProdIdx === cat.products.length - 1}
                                          className="p-1.5 text-white/30 hover:text-white disabled:opacity-0 transition-colors"
                                        >
                                          <ChevronDown size={18} />
                                        </button>
                                        <button
                                          onClick={() => toggleWebFeatured(catIdx, realProdIdx)}
                                          className={`p-1.5 transition-colors ${prod.promo_schedules && prod.promo_schedules.length > 0 ? 'text-[#D4AF37]' : 'text-white/20 hover:text-[#D4AF37]/50'}`}
                                          title={'Configurar Sugerencia del Chef (Horarios)'}
                                        >
                                          <Star size={18} fill={prod.promo_schedules && prod.promo_schedules.length > 0 ? 'currentColor' : 'none'} />
                                        </button>
                                        <button
                                          onClick={() => updateProduct(catIdx, realProdIdx, 'is_featured', !prod.is_featured)}
                                          className={`p-1.5 transition-colors ${prod.is_featured ? 'text-[#D4AF37]' : 'text-white/20 hover:text-[#D4AF37]/50'}`}
                                          title={prod.is_featured ? 'Quitar de Recomendaciones del Chef' : 'Añadir a Recomendaciones del Chef'}
                                        >
                                          <Sparkles size={18} fill={prod.is_featured ? 'currentColor' : 'none'} />
                                        </button>
                                        <button
                                          onClick={() => updateProduct(catIdx, realProdIdx, 'show_in_breakfast', !prod.show_in_breakfast)}
                                          className={`p-1.5 transition-colors ${prod.show_in_breakfast ? 'text-orange-400' : 'text-white/20 hover:text-orange-400/50'}`}
                                          title={prod.show_in_breakfast ? 'Quitar de Desayuno' : 'Añadir a Desayuno (08:00-12:00)'}
                                        >
                                          <Coffee size={18} fill={prod.show_in_breakfast ? 'currentColor' : 'none'} />
                                        </button>
                                        <button
                                          onClick={() => updateProduct(catIdx, realProdIdx, 'show_in_lunch', !prod.show_in_lunch)}
                                          className={`p-1.5 transition-colors ${prod.show_in_lunch ? 'text-yellow-400' : 'text-white/20 hover:text-yellow-400/50'}`}
                                          title={prod.show_in_lunch ? 'Quitar de Mediodía' : 'Añadir a Mediodía (13:00-16:00)'}
                                        >
                                          <Sun size={18} fill={prod.show_in_lunch ? 'currentColor' : 'none'} />
                                        </button>
                                        <button
                                          onClick={() => updateProduct(catIdx, realProdIdx, 'show_in_dinner', !prod.show_in_dinner)}
                                          className={`p-1.5 transition-colors ${prod.show_in_dinner ? 'text-blue-400' : 'text-white/20 hover:text-blue-400/50'}`}
                                          title={prod.show_in_dinner ? 'Quitar de Noche' : 'Añadir a Noche (20:00-00:00)'}
                                        >
                                          <Moon size={18} fill={prod.show_in_dinner ? 'currentColor' : 'none'} />
                                        </button>
                                        <button
                                          onClick={() => updateProduct(catIdx, realProdIdx, 'show_in_ficha', prod.show_in_ficha !== false ? false : true)}
                                          className={`p-1.5 transition-colors ${prod.show_in_ficha !== false ? 'text-green-400' : 'text-white/20 hover:text-green-400/50'}`}
                                          title={prod.show_in_ficha !== false ? 'Incluido en Ficha Técnica' : 'Excluido de Ficha Técnica'}
                                        >
                                          <div className="relative">
                                            <FileText size={18} />
                                            {prod.show_in_ficha === false && <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-red-500 -rotate-45 transform origin-center" />}
                                          </div>
                                        </button>
                                      </div>
                                      <div className="flex flex-col gap-2 mt-auto">
                                        <button
                                          onClick={() => duplicateProduct(catIdx, realProdIdx)}
                                          className="p-1.5 text-white/20 hover:text-blue-400 transition-colors"
                                          title="Duplicar este plato"
                                        >
                                          <Copy size={18} />
                                        </button>

                                        <div className="relative">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              if (activeMoveMenu?.catIdx === catIdx && activeMoveMenu?.prodIdx === realProdIdx) {
                                                setActiveMoveMenu(null)
                                              } else {
                                                setActiveMoveMenu({ catIdx, prodIdx: realProdIdx })
                                              }
                                            }}
                                            className={`p-1.5 transition-colors ${activeMoveMenu?.catIdx === catIdx && activeMoveMenu?.prodIdx === realProdIdx ? 'text-[#D4AF37] bg-white/10' : 'text-white/20 hover:text-[#D4AF37]'}`}
                                            title="Mover a otra sección"
                                          >
                                            <ArrowRightLeft size={18} />
                                          </button>
                                          {activeMoveMenu?.catIdx === catIdx && activeMoveMenu?.prodIdx === realProdIdx && (
                                            <div className="absolute right-0 bottom-full mb-2 bg-[#1A1A1A] border border-white/10 rounded-sm shadow-2xl z-50 py-2 min-w-[200px] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                              <div className="flex items-center justify-between px-4 py-1 border-b border-white/5 mb-1">
                                                <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Mover a...</p>
                                                <button onClick={() => setActiveMoveMenu(null)} className="text-white/20 hover:text-white">
                                                  <X size={10} />
                                                </button>
                                              </div>
                                              <div className="max-h-[200px] overflow-y-auto">
                                                {categories.map((targetCat, targetIdx) => (
                                                  <button
                                                    key={targetIdx}
                                                    onClick={() => {
                                                      moveProductToCategory(catIdx, realProdIdx, targetIdx)
                                                      setActiveMoveMenu(null)
                                                    }}
                                                    disabled={catIdx === targetIdx}
                                                    className={`w-full text-left px-4 py-2 text-xs transition-colors ${catIdx === targetIdx ? 'text-white/10 cursor-not-allowed' : 'text-white/60 hover:text-[#D4AF37] hover:bg-white/5'}`}
                                                  >
                                                    {targetCat.name || `Sección ${targetIdx + 1}`}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        <button
                                          onClick={() => removeProduct(catIdx, realProdIdx)}
                                          className="p-1.5 text-white/20 hover:text-red-500 transition-colors"
                                          title="Eliminar plato"
                                        >
                                          <Trash2 size={18} />
                                        </button>
                                      </div>
                                    </div>
                                </div>
                              </div>
                            )
                    })}

                            <button
                              onClick={() => addProduct(catIdx)}
                              className="w-full py-4 border border-dashed border-white/10 text-white/40 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-all flex items-center justify-center gap-2 text-sm rounded-sm"
                            >
                              <Plus size={16} /> Añadir Plato a "{cat.name || 'Nueva Sección'}"
                            </button>
                          </div>
                )}
                        </div>
                        )
          })}

                        <button
                          onClick={addCategory}
                          className="w-full py-8 border-2 border-dashed border-[#D4AF37]/20 text-[#D4AF37]/60 hover:text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all flex flex-col items-center justify-center gap-3 rounded-sm"
                        >
                          <div className="w-12 h-12 rounded-full border border-[#D4AF37]/30 flex items-center justify-center">
                            <Plus size={24} />
                          </div>
                          <span className="uppercase tracking-[0.3em] text-xs font-semibold">Nueva Sección en la Carta</span>
                        </button>
                      </div>

        {/* Immersive Loading Overlay - Consistent with Menu Section */ }
                    {
                      (saving || spellingCheck) && (
                        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white animate-in fade-in duration-300">
                          <div className="flex flex-col items-center animate-pulse">
                            <img src="/logo.png" alt="El Balconet" className="w-48 md:w-64 h-auto mb-8 opacity-90" />
                            <h2 className="text-[#D4AF37] font-serif text-2xl md:text-3xl mb-4 text-center">
                              {spellingCheck ? 'Revisando ortografía...' : (translationProgress ? 'Traduciendo carta...' : 'Guardando cambios...')}
                            </h2>
                            <div className="flex flex-col items-center gap-3 text-[#333333]">
                              <Loader2 size={32} className="animate-spin text-[#D4AF37]" />
                              <span className="text-sm font-medium tracking-widest uppercase text-center mt-2">
                                {translationProgress
                                  ? `Procesando ${translationProgress.current} de ${translationProgress.total}`
                                  : 'Un momento por favor'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    {/* Floating Back to Top Button */ }
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="fixed bottom-8 right-8 p-4 bg-[#D4AF37] text-black rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-[100] group"
                      title="Subir arriba"
                    >
                      <ArrowUp size={24} strokeWidth={3} />
                      <span className="absolute right-full mr-4 px-3 py-1 bg-black text-white text-[10px] uppercase tracking-widest rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        Subir Arriba
                      </span>
                    </button>

      {/* Promo Editor Modal */}
      {activePromoEditor && (() => {
        const p = categories[activePromoEditor.catIdx].products[activePromoEditor.prodIdx]
        const schedules = p.promo_schedules || []

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/10 rounded-sm w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="text-xl font-serif text-white">Programar Promoción</h3>
                <button onClick={() => setActivePromoEditor(null)} className="text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                <div>
                  <h4 className="text-[#D4AF37] font-serif text-lg mb-1">{p.name}</h4>
                  <p className="text-white/50 text-sm">Añade tramos horarios para que este plato aparezca automáticamente como Sugerencia del Chef en la web pública.</p>
                </div>

                <div className="space-y-4">
                  {schedules.map((sched, sIdx) => (
                    <div key={sIdx} className="bg-white/5 border border-white/10 p-4 rounded-sm space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="grid grid-cols-2 gap-4 flex-1">
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5">Hora Inicio</label>
                            <input
                              type="time"
                              value={sched.start}
                              onChange={(e) => {
                                const newScheds = [...schedules]
                                newScheds[sIdx].start = e.target.value
                                updateProduct(activePromoEditor.catIdx, activePromoEditor.prodIdx, 'promo_schedules', newScheds)
                              }}
                              className="w-full bg-black border border-white/10 p-2 text-white focus:border-[#D4AF37] outline-none rounded-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5">Hora Fin</label>
                            <input
                              type="time"
                              value={sched.end}
                              onChange={(e) => {
                                const newScheds = [...schedules]
                                newScheds[sIdx].end = e.target.value
                                updateProduct(activePromoEditor.catIdx, activePromoEditor.prodIdx, 'promo_schedules', newScheds)
                              }}
                              className="w-full bg-black border border-white/10 p-2 text-white focus:border-[#D4AF37] outline-none rounded-sm"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const newScheds = schedules.filter((_, i) => i !== sIdx)
                            updateProduct(activePromoEditor.catIdx, activePromoEditor.prodIdx, 'promo_schedules', newScheds)
                          }}
                          className="mt-5 p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-sm self-start"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Días Activo</label>
                        <div className="flex flex-wrap gap-2">
                          {WEEKDAYS.map(day => {
                            const isActive = sched.days.includes(day.id)
                            return (
                              <button
                                key={day.id}
                                onClick={() => {
                                  const newScheds = [...schedules]
                                  if (isActive) {
                                    newScheds[sIdx].days = newScheds[sIdx].days.filter(d => d !== day.id)
                                  } else {
                                    newScheds[sIdx].days = [...newScheds[sIdx].days, day.id]
                                  }
                                  updateProduct(activePromoEditor.catIdx, activePromoEditor.prodIdx, 'promo_schedules', newScheds)
                                }}
                                className={`w-8 h-8 flex items-center justify-center rounded-full text-[11px] font-bold transition-all ${isActive
                                  ? 'bg-[#D4AF37] text-black'
                                  : 'bg-black border border-white/20 text-white/40 hover:border-[#D4AF37]'
                                }`}
                              >
                                {day.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const newSched = { start: '08:00', end: '12:00', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] }
                    updateProduct(activePromoEditor.catIdx, activePromoEditor.prodIdx, 'promo_schedules', [...schedules, newSched])
                  }}
                  className="w-full py-3 border border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2 rounded-sm"
                >
                  <Plus size={16} /> Añadir Horario
                </button>
              </div>
              
              <div className="p-6 border-t border-white/10 bg-black/50 flex gap-4">
                <button
                  onClick={() => setPreviewPromoProduct(p)}
                  className="flex-1 py-3 bg-white/10 text-white font-bold tracking-widest uppercase hover:bg-white/20 transition-colors rounded-sm flex items-center justify-center gap-2"
                >
                  <Eye size={16} /> Vista Previa
                </button>
                <button
                  onClick={() => setActivePromoEditor(null)}
                  className="flex-1 py-3 bg-[#D4AF37] text-black font-bold tracking-widest uppercase hover:bg-[#b0902c] transition-colors rounded-sm"
                >
                  Hecho
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Promo Summary Modal */}
      {showPromoSummary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-sm w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-serif text-white flex items-center gap-2">
                <CalendarClock className="text-[#D4AF37]" size={20} /> Promociones Programadas
              </h3>
              <button onClick={() => setShowPromoSummary(false)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {(() => {
                type SchedulePromo = {
                  start: string;
                  end: string;
                  days: string[];
                  productName: string;
                  categoryName: string;
                  catIdx: number;
                  prodIdx: number;
                }
                const allSchedules: SchedulePromo[] = []
                categories.forEach((c, catIdx) => {
                  c.products.forEach((p, prodIdx) => {
                    if (p.promo_schedules && p.promo_schedules.length > 0) {
                      p.promo_schedules.forEach(sched => {
                        allSchedules.push({
                          start: sched.start,
                          end: sched.end,
                          days: sched.days,
                          productName: p.name,
                          categoryName: c.name || `Sección ${catIdx + 1}`,
                          catIdx,
                          prodIdx
                        })
                      })
                    }
                  })
                })

                if (allSchedules.length === 0) {
                  return (
                    <div className="py-12 text-center text-white/40">
                      <CalendarClock size={40} className="mx-auto mb-4 opacity-20" />
                      <p>No hay promociones programadas.</p>
                    </div>
                  )
                }

                allSchedules.sort((a, b) => {
                  if (a.start !== b.start) return a.start.localeCompare(b.start)
                  if (a.end !== b.end) return a.end.localeCompare(b.end)
                  return a.productName.localeCompare(b.productName)
                })

                return allSchedules.map((sched, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-sm flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between">
                    <div className="flex-shrink-0 w-full sm:w-[200px]">
                      <div className="flex items-center gap-2 text-lg text-[#D4AF37] font-mono mb-2">
                        <Clock size={16} />
                        <span>{sched.start} - {sched.end}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {WEEKDAYS.map(d => (
                          <span key={d.id} className={`text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-bold ${sched.days.includes(d.id) ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-white/20'}`}>
                            {d.label.slice(0, 1)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-6 w-full">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">{sched.categoryName}</p>
                      <h4 className="text-base sm:text-lg text-white font-serif">{sched.productName}</h4>
                    </div>

                    <button
                      onClick={() => {
                        setShowPromoSummary(false)
                        setActivePromoEditor({ catIdx: sched.catIdx, prodIdx: sched.prodIdx })
                      }}
                      className="px-6 py-2.5 sm:py-2 border border-white/20 text-white/70 text-xs hover:bg-[#D4AF37]/20 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-colors rounded-sm shrink-0 whitespace-nowrap mt-2 sm:mt-0 w-full sm:w-auto text-center"
                    >
                      Editar Horarios
                    </button>
                  </div>
                ))
              })()}
            </div>
            
            <div className="p-6 border-t border-white/10 bg-black/50">
              <button
                onClick={() => setShowPromoSummary(false)}
                className="w-full py-3 bg-[#D4AF37] text-black font-bold tracking-widest uppercase hover:bg-[#b0902c] transition-colors rounded-sm"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Featured Dish Preview */}
      {previewPromoProduct && (
        <div className="fixed inset-0 z-[1000] pointer-events-none">
          <FeaturedDishModal
            previewProduct={previewPromoProduct}
            onClosePreview={() => setPreviewPromoProduct(null)}
          />
        </div>
      )}
    </div>
  )
}
