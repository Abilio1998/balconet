'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Eye, EyeOff, Calendar, Download, Edit2, FileText, Wand2, Printer, Info, AlertTriangle, Globe, ChevronUp, ChevronDown } from 'lucide-react'
// PDF generation will be imported dynamically to avoid Turbopack panics on client-side bundling

type Course = 'first' | 'second' | 'dessert'
type Dish = { 
  id: string; name: string; description: string; course: Course; order_index: number; supplement: number | '';
  allergens: string[];
  name_ca?: string; name_en?: string; name_fr?: string;
  description_ca?: string; description_en?: string; description_fr?: string;
}

const EMPTY_DISH = (course: Course, idx: number): Dish => ({
  id: crypto.randomUUID(),
  name: '',
  description: '',
  course,
  order_index: idx,
  supplement: '',
  allergens: [],
})

const ALLERGENS = [
  { id: 'gluten', label: 'Gluten', icon: '🌾' },
  { id: 'crustaceans', label: 'Crustáceos', icon: '🦐' },
  { id: 'eggs', label: 'Huevos', icon: '🥚' },
  { id: 'fish', label: 'Pescado', icon: '🐟' },
  { id: 'peanuts', label: 'Cacahuetes', icon: '🥜' },
  { id: 'soybeans', label: 'Soja', icon: '🌿' },
  { id: 'dairy', label: 'Lácteos', icon: '🥛' },
  { id: 'nuts', label: 'Frutos de cáscara', icon: '🌰' },
  { id: 'celery', label: 'Apio', icon: '🥬' },
  { id: 'mustard', label: 'Mostaza', icon: '🟡' },
  { id: 'sesame', label: 'Sésamo', icon: '🌱' },
  { id: 'sulphites', label: 'Sulfitos', icon: '🍷' },
  { id: 'lupin', label: 'Altramuces', icon: '🌼' },
  { id: 'molluscs', label: 'Moluscos', icon: '🐙' }
]

const COURSE_LABELS: Record<Course, string> = {
  first: 'Primeros Platos',
  second: 'Segundos Platos',
  dessert: 'Postres',
}

export default function AdminMenuPage() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [endDate, setEndDate] = useState('')
  const [price, setPrice] = useState<number>(14)
  const [priceExterior, setPriceExterior] = useState<number | ''>('')
  const [published, setPublished] = useState(false)
  const [isHoliday, setIsHoliday] = useState(false)
  const [dishes, setDishes] = useState<Dish[]>([
    EMPTY_DISH('first', 0),
    EMPTY_DISH('second', 0),
    EMPTY_DISH('dessert', 0),
  ])
  const [saving, setSaving] = useState(false)
  const [batchTranslating, setBatchTranslating] = useState(false)
  const [spellingCheck, setSpellingCheck] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [history, setHistory] = useState<any[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [openDownload, setOpenDownload] = useState<string | null>(null)
  const [openPrint, setOpenPrint] = useState<string | null>(null)
  const [showTranslations, setShowTranslations] = useState<Record<string, boolean>>({})

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true)
      const res = await fetch('/api/admin/menu')
      const data = await res.json()
      setHistory(data.menus || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const addDish = (course: Course) => {
    const courseDishes = dishes.filter((d) => d.course === course)
    setDishes((prev) => [...prev, EMPTY_DISH(course, courseDishes.length)])
  }

  const removeDish = (id: string) => {
    setDishes((prev) => prev.filter((d) => d.id !== id))
  }

  const moveDish = (id: string, direction: 'up' | 'down') => {
    setDishes(prev => {
      const dishIndex = prev.findIndex(d => d.id === id);
      if (dishIndex === -1) return prev;
      
      const dish = prev[dishIndex];
      const courseDishes = prev.filter(d => d.course === dish.course);
      const courseIndex = courseDishes.findIndex(d => d.id === id);
      
      if (direction === 'up' && courseIndex > 0) {
        const swapTargetId = courseDishes[courseIndex - 1].id;
        const targetIndex = prev.findIndex(d => d.id === swapTargetId);
        
        const newDishes = [...prev];
        const temp = newDishes[dishIndex];
        newDishes[dishIndex] = newDishes[targetIndex];
        newDishes[targetIndex] = temp;
        
        return newDishes;
      } else if (direction === 'down' && courseIndex < courseDishes.length - 1) {
        const swapTargetId = courseDishes[courseIndex + 1].id;
        const targetIndex = prev.findIndex(d => d.id === swapTargetId);
        
        const newDishes = [...prev];
        const temp = newDishes[dishIndex];
        newDishes[dishIndex] = newDishes[targetIndex];
        newDishes[targetIndex] = temp;
        
        return newDishes;
      }
      return prev;
    });
  }

  const updateDish = (id: string, field: keyof Dish, value: string | number | string[]) => {
    setDishes((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      const updated = { ...d, [field]: value };
      
      // If name or description changes, invalidate translations
      if ((field === 'name' || field === 'description') && value !== d[field]) {
        updated.name_ca = '';
        updated.name_en = '';
        updated.name_fr = '';
      }
      return updated;
    }))
  }

  const toggleAllergen = (dishId: string, allergenId: string) => {
    setDishes(prev => prev.map(d => {
      if (d.id !== dishId) return d;
      const hasAllergen = d.allergens.includes(allergenId);
      const newAllergens = hasAllergen
        ? d.allergens.filter(a => a !== allergenId)
        : [...d.allergens, allergenId];
      return { ...d, allergens: newAllergens };
    }));
  }

  const toggleTranslations = (dishId: string) => {
    setShowTranslations(prev => ({ ...prev, [dishId]: !prev[dishId] }))
  }

  const handleSave = async () => {
    const filledFirsts = dishes.filter(d => d.course === 'first' && d.name.trim() !== '');
    const filledSeconds = dishes.filter(d => d.course === 'second' && d.name.trim() !== '');
    const filledDesserts = dishes.filter(d => d.course === 'dessert' && d.name.trim() !== '');
    const filledDishes = dishes.filter(d => d.name.trim() !== '');
    const untranslatedDishes = filledDishes.filter(d => !d.name_ca || !d.name_en || !d.name_fr);

    if (filledFirsts.length === 0 || filledSeconds.length === 0 || filledDesserts.length === 0) {
      if (!window.confirm('Aviso: Falta añadir al menos un plato en cada categoría (Primeros, Segundos y Postres).\n\n¿Deseas guardar de todos modos?')) {
        return;
      }
    }

    setSaving(true)
    setMessage(null)
    
    let finalDishes = [...dishes];

    try {
      if (untranslatedDishes.length > 0) {
        setBatchTranslating(true);
        // Translate missing dishes sequentially to avoid rate limits (429)
        for (const dish of untranslatedDishes) {
          try {
            const res = await fetch('/api/admin/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: dish.name, description: dish.description?.trim() || undefined })
            });
            const data = await res.json();
            if (res.ok && data.success) {
              const i = finalDishes.findIndex(d => d.id === dish.id);
              if (i !== -1) {
                finalDishes[i] = {
                  ...finalDishes[i],
                  name_ca: data.translations.ca?.name,
                  description_ca: data.translations.ca?.description,
                  name_en: data.translations.en?.name,
                  description_en: data.translations.en?.description,
                  name_fr: data.translations.fr?.name,
                  description_fr: data.translations.fr?.description,
                };
              }
            }
          } catch (e) {
            console.error(`Error auto-translating ${dish.name} during batch:`, e);
          }
        }
        // Update local state so UI reflects translations
        setDishes(finalDishes);
        setBatchTranslating(false);
      }

      // Proceed to save the fully translated payload
      const payload: Record<string, any> = {
        date,
        price: Number(price),
        price_exterior: priceExterior !== '' ? Number(priceExterior) : undefined,
        published,
        is_holiday: isHoliday,
        dishes: finalDishes.filter((d) => d.name.trim()).map((d, index) => ({
          ...d,
          supplement: d.supplement === '' ? 0 : Number(d.supplement),
          order_index: index
        })),
      };

      if (endDate) {
        payload.endDate = endDate;
      }

      const res = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) {
        const err = result
        throw new Error(err.error ?? 'Error al guardar')
      }

      const count = result.count ?? 1
      if (count > 1) {
        setMessage({ type: 'success', text: `✓ Menú guardado para ${count} días (${new Date(date).toLocaleDateString('es-ES')} al ${new Date(endDate).toLocaleDateString('es-ES')}) con traducción automática.` })
      } else {
        setMessage({ type: 'success', text: '✓ Menú guardado y traducido correctamente.' })
      }
      
      // Reset the form to a clean state after saving
      setDate(today)
      setEndDate('')
      setPrice(14)
      setPriceExterior('')
      setPublished(false)
      setIsHoliday(false)
      setDishes([
        EMPTY_DISH('first', 0),
        EMPTY_DISH('second', 0),
        EMPTY_DISH('dessert', 0),
      ])
      setShowTranslations({})
      fetchHistory()
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error desconocido' })
    } finally {
      setSaving(false)
      setBatchTranslating(false)
    }
  }

  const handleForceTranslate = () => {
    if (!window.confirm('¿Estás seguro de que quieres borrar TODAS las traducciones existentes y forzar al sistema a re-traducir todo usando el nuevo motor de IA de Alta Precisión?\n\nDeberás hacer clic en "Guardar Menú" después de esto para ejecutar la traducción.')) return;
    
    setDishes(prev => prev.map(d => {
      if (!d.name.trim()) return d;
      return {
        ...d,
        name_ca: '',
        name_en: '',
        name_fr: '',
        description_ca: '',
        description_en: '',
        description_fr: ''
      };
    }));
    
    setMessage({ type: 'success', text: 'Traducciones borradas. Haz clic en "Guardar Menú" para generar las nuevas.' });
  };

  const handleSpellcheck = async () => {
    setSpellingCheck(true)
    setMessage(null)
    try {
      const filledDishes = dishes.filter(d => d.name.trim() !== '')
      if (filledDishes.length === 0) {
        setSpellingCheck(false)
        return
      }

      const res = await fetch('/api/admin/spellcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: filledDishes })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error en corrección')
      }

      let changesMade = 0

      setDishes(prev => prev.map(d => {
        const corrected = data.items.find((i: any) => i.id === d.id)
        if (corrected) {
          const nameChanged = corrected.name !== d.name;
          const descChanged = corrected.description !== d.description;
          
          if (nameChanged || descChanged) changesMade++;

          return {
            ...d,
            name: corrected.name,
            description: corrected.description,
            // Only wipe translations if they are actually empty, don't destroy manual work
            name_ca: d.name_ca || (nameChanged || descChanged ? '' : d.name_ca),
            name_en: d.name_en || (nameChanged || descChanged ? '' : d.name_en),
            name_fr: d.name_fr || (nameChanged || descChanged ? '' : d.name_fr),
          }
        }
        return d
      }))

      if (changesMade > 0) {
        setMessage({ type: 'success', text: `✓ Ortografía revisada. Se han corregido ${changesMade} plato(s).` })
      } else {
        setMessage({ type: 'success', text: '✓ Ortografía revisada. Todo parece estar escrito correctamente.' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al corregir ortografía' })
    } finally {
      setSpellingCheck(false)
    }
  }

  const handleDeleteMenu = async (id: string, menuDate: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el menú del ${new Date(menuDate).toLocaleDateString('es-ES')}?`)) return

    try {
      const res = await fetch(`/api/admin/menu?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      
      setMessage({ type: 'success', text: '✓ Menú eliminado.' })
      fetchHistory()
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al eliminar el menú' })
    }
  }

  const handleDeleteRange = async () => {
    if (!endDate) {
      setMessage({ type: 'error', text: 'Debes seleccionar una "Fecha Hasta" para borrar un tramo.' })
      return
    }
    if (!window.confirm(`¿⚠️ PELIGRO: Estás seguro de querer eliminar TODOS los menús desde el ${new Date(date).toLocaleDateString('es-ES')} hasta el ${new Date(endDate).toLocaleDateString('es-ES')} inclusive?`)) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/menu?start_date=${date}&end_date=${endDate}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar tramo')
      
      setMessage({ type: 'success', text: `✓ Todos los menús del tramo ${date} al ${endDate} han sido eliminados correctamente.` })
      fetchHistory()
      setEndDate('')
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al eliminar el tramo seleccionado.' })
    } finally {
      setSaving(false)
    }
  }

  const handleEditMenu = (menuToEdit: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setDate(menuToEdit.date)
    setEndDate('') // Reset end date when editing
    setPrice(menuToEdit.price)
    setPriceExterior(menuToEdit.price_exterior ?? '')
    setPublished(menuToEdit.published)
    setIsHoliday(menuToEdit.is_holiday ?? false)
    setDishes(menuToEdit.dishes?.map((d: any) => ({
      ...d,
      name: d.name ?? '',
      description: d.description ?? '',
      supplement: d.supplement ?? '',
      allergens: d.allergens ?? [],
      name_ca: d.name_ca ?? '',
      name_en: d.name_en ?? '',
      name_fr: d.name_fr ?? '',
      description_ca: d.description_ca ?? '',
      description_en: d.description_en ?? '',
      description_fr: d.description_fr ?? '',
    })) || [])
    setMessage({ type: 'success', text: `Cargado el menú del ${new Date(menuToEdit.date).toLocaleDateString()}. Puedes editarlo y volver a guardar.` })
  }

  const handleDownloadPDF = async (menu: any, lang: 'es' | 'ca' | 'en' | 'fr') => {
    try {
      setMessage({ type: 'success', text: 'Generando PDF en el servidor...' })
      
      const isWeekend = new Date(menu.date).getDay() === 0 || new Date(menu.date).getDay() === 6 || menu.is_holiday
      const folder = isWeekend ? 'fin-de-semana' : 'diario'
      
      const res = await fetch('/api/admin/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu, lang, folder })
      })

      if (!res.ok) {
        throw new Error('Error al generar el PDF en el servidor')
      }

      const blob = await res.blob()
      
      // Trigger local download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Menu_${folder}_${menu.date}_${lang.toUpperCase()}.pdf`
      link.click()
      URL.revokeObjectURL(url)

      setMessage({ type: 'success', text: `✓ PDF generado y guardado en la carpeta "${folder}"` })
    } catch (err) {
      console.error('Error generating PDF:', err)
      setMessage({ type: 'error', text: 'Error al generar el PDF' })
    }
  }

  const handlePrintPDF = async (menu: any, lang: 'es' | 'ca' | 'en' | 'fr') => {
    try {
      setMessage({ type: 'success', text: 'Preparando documento para imprimir...' })
      
      const isWeekend = new Date(menu.date).getDay() === 0 || new Date(menu.date).getDay() === 6 || menu.is_holiday
      const folder = isWeekend ? 'fin-de-semana' : 'diario'
      
      const res = await fetch('/api/admin/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu, lang, folder })
      })

      if (!res.ok) {
        throw new Error('Error al generar el PDF para imprimir')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      
      // Open in a new tab and trigger system print dialog
      const printWindow = window.open(url, '_blank')
      if (printWindow) {
        // Some browsers need a tiny bit of time for the PDF content to be accessible
        setTimeout(() => {
          printWindow.print()
          // We don't revoke immediately to allow print to finish
          setTimeout(() => URL.revokeObjectURL(url), 60000)
        }, 1000)
        setMessage({ type: 'success', text: '✓ Documento abierto para imprimir.' })
      } else {
        throw new Error('El navegador bloqueó la ventana emergente de impresión. Por favor, actívalas para este sitio.')
      }
    } catch (err) {
      console.error('Error printing PDF:', err)
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error al imprimir el PDF' })
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
      <div className="xl:col-span-2">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-white mb-1">Menú del Día</h1>
        <p className="text-white/40 text-sm">Crea o edita el menú diario y reprodúcelo en varios días.</p>
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-sm flex items-start gap-3">
          <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-200/70">
            <strong className="text-blue-400 tracking-wide">MANTENIMIENTO AUTOMÁTICO:</strong> Para garantizar un rendimiento óptimo de carga en la plataforma, los menús diarios que tengan <strong className="text-white">más de 30 días de antigüedad</strong> desde su fecha de publicación son eliminados permanentemente por el sistema de limpieza de la base de datos de manera automática.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-3 p-4 mb-6 text-sm border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Meta */}
      <div className="bg-[#111111] border border-white/10 rounded-sm p-6 mb-6">
        <h2 className="text-white font-medium mb-4">Configuración del Menú</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="md:col-span-1 grid grid-cols-2 gap-2">
            <div>
              <label className="text-white/50 text-[10px] uppercase tracking-widest mb-2 block text-nowrap">Desde (Inicio)</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="admin-input"
              />
            </div>
            <div>
               <label className="text-white/50 text-[10px] uppercase tracking-widest mb-2 block text-nowrap">Hasta (Opcional)</label>
               <input
                 type="date"
                 value={endDate}
                 onChange={(e) => setEndDate(e.target.value)}
                 min={date}
                 className="admin-input"
               />
            </div>
          </div>
          <div className="md:col-span-1 grid grid-cols-2 gap-2">
            <div>
              <label className="text-white/50 text-[10px] uppercase tracking-widest mb-2 block">Interior (€)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min="1"
                max="100"
                step="0.5"
                className="admin-input"
              />
            </div>
            <div>
              <label className="text-white/50 text-[10px] uppercase tracking-widest mb-2 block">Exterior (€)</label>
              <input
                type="number"
                value={priceExterior ?? ''}
                onChange={(e) => setPriceExterior(e.target.value ? Number(e.target.value) : '')}
                min="1"
                max="100"
                step="0.5"
                placeholder="Opcional"
                className="admin-input"
              />
            </div>
          </div>
          <div className="md:col-span-1 grid grid-cols-2 gap-2">
            <div>
              <label className="text-white/50 text-[10px] uppercase tracking-widest mb-2 block">Estado</label>
              <button
                type="button"
                onClick={() => setPublished(!published)}
                className={`flex items-center justify-center gap-2 px-3 py-3 text-xs border transition-all duration-200 w-full ${
                  published
                    ? 'border-green-500/50 bg-green-500/10 text-green-400'
                    : 'border-white/20 text-white/40 hover:border-white/40'
                }`}
              >
                {published ? <Eye size={14} /> : <EyeOff size={14} />}
                {published ? 'Público' : 'Oculto'}
              </button>
            </div>
            <div>
              <label className="text-white/50 text-[10px] uppercase tracking-widest mb-2 block text-nowrap">Diseño PDF</label>
              <button
                type="button"
                onClick={() => setIsHoliday(!isHoliday)}
                className={`flex items-center justify-center gap-2 px-3 py-3 text-[10px] uppercase tracking-widest font-bold border transition-all duration-200 w-full ${
                  isHoliday
                    ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]'
                    : 'border-white/20 text-white/40 hover:border-white/40'
                }`}
                title="Si lo activas, usará la plantilla dorada de Fin de Semana aunque sea entre semana."
              >
                {isHoliday ? 'Finde' : 'Diario'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Bulk Delete Feature */}
        {endDate && (
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
             <button
                onClick={handleDeleteRange}
                disabled={saving || spellingCheck}
                className="text-xs px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center gap-2 rounded-sm transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} /> Eliminar el tramo completo de menús creados ({new Date(date).toLocaleDateString('es-ES')} - {new Date(endDate).toLocaleDateString('es-ES')})
             </button>
          </div>
        )}
      </div>

      {/* Dishes by course */}
      {(['first', 'second', 'dessert'] as Course[]).map((course) => (
        <div key={course} className="bg-[#111111] border border-white/10 rounded-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#D4AF37] font-medium text-sm tracking-widest uppercase">
              {COURSE_LABELS[course]}
            </h3>
            <button
              onClick={() => addDish(course)}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-[#D4AF37] transition-colors"
            >
              <Plus size={14} />
              Añadir plato
            </button>
          </div>

          <div className="space-y-3">
            {dishes.filter((d) => d.course === course).map((dish) => (
              <div key={dish.id} className="flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px] gap-2">
                  <input
                    type="text"
                    value={dish.name}
                    onChange={(e) => updateDish(dish.id, 'name', e.target.value)}
                    placeholder="Nombre del plato"
                    className="admin-input"
                    maxLength={200}
                  />
                  <input
                    type="text"
                    value={dish.description}
                    onChange={(e) => updateDish(dish.id, 'description', e.target.value)}
                    placeholder="Descripción (opcional)"
                    className="admin-input"
                    maxLength={500}
                  />
                  <input
                    type="number"
                    value={dish.supplement}
                    onChange={(e) => updateDish(dish.id, 'supplement', e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="+ Sup (€)"
                    className="admin-input"
                    min="0"
                    step="0.5"
                  />
                  {/* Allergens Selection & Translations Toggle */}
                  <div className="col-span-1 sm:col-span-3 mt-1 flex justify-between items-center bg-black/20 rounded p-2 border border-white/5 flex-wrap gap-2">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-white/30 uppercase tracking-widest hidden sm:inline-block mr-2">Alérgenos:</span>
                      {ALLERGENS.map(a => {
                        const isActive = dish.allergens.includes(a.id);
                        return (
                          <button
                            key={a.id}
                            onClick={() => toggleAllergen(dish.id, a.id)}
                            className={`text-xs px-2 py-0.5 rounded-sm transition-colors border ${
                              isActive
                                ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]'
                                : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'
                            }`}
                            title={a.label}
                          >
                            {a.icon} {a.label}
                          </button>
                        )
                      })}
                    </div>
                    <button
                      onClick={() => toggleTranslations(dish.id)}
                      className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm border transition-colors flex items-center gap-1 ${showTranslations[dish.id] ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10 hover:text-white'}`}
                    >
                      <Globe size={12} />
                      Traducciones
                    </button>
                  </div>
                  
                  {/* Translations Inputs */}
                  {showTranslations[dish.id] && (
                    <div className="col-span-1 sm:col-span-3 mt-1 grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-blue-500/5 rounded border border-blue-500/20 animate-in fade-in slide-in-from-top-2">
                      {(['ca', 'en', 'fr'] as const).map(lang => (
                        <div key={lang} className="space-y-2">
                           <div className="flex justify-between items-center">
                             <label className="text-[10px] text-blue-300/70 uppercase tracking-widest font-bold">
                               {lang === 'ca' ? 'Catalán (CA)' : lang === 'en' ? 'Inglés (EN)' : 'Francés (FR)'}
                             </label>
                           </div>
                           <input
                             type="text"
                             value={dish[`name_${lang}`] || ''}
                             onChange={(e) => updateDish(dish.id, `name_${lang}` as keyof Dish, e.target.value)}
                             placeholder={`Nombre manual`}
                             className="w-full bg-black/40 border border-white/10 rounded-sm px-3 py-1.5 text-white focus:border-blue-500/50 outline-none transition-all text-xs"
                           />
                           <input
                             type="text"
                             value={dish[`description_${lang}`] || ''}
                             onChange={(e) => updateDish(dish.id, `description_${lang}` as keyof Dish, e.target.value)}
                             placeholder={`Descripción manual`}
                             className="w-full bg-black/40 border border-white/10 rounded-sm px-3 py-1.5 text-white/70 focus:border-blue-500/50 outline-none transition-all text-[10px]"
                           />
                        </div>
                      ))}
                      <div className="col-span-1 md:col-span-3 flex justify-end">
                        <p className="text-[9px] text-white/30 italic">
                          Nota: Deja en blanco para traducción automática con IA Llama-3 (Alta precisión gastronómica).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 mt-1 border-l border-white/10 pl-3">
                  <button onClick={() => moveDish(dish.id, 'up')} className="text-white/20 hover:text-white transition-colors" title="Mover arriba">
                    <ChevronUp size={16} />
                  </button>
                  <button onClick={() => moveDish(dish.id, 'down')} className="text-white/20 hover:text-white transition-colors" title="Mover abajo">
                    <ChevronDown size={16} />
                  </button>
                  <button
                    onClick={() => removeDish(dish.id)}
                    className="text-white/20 hover:text-red-400 transition-colors mt-2"
                    title="Eliminar plato"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end mt-6 gap-3">
        <button
          onClick={handleForceTranslate}
          disabled={saving || spellingCheck}
          className="px-4 py-3 border border-blue-500/30 text-blue-400 text-sm hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-w-[180px]"
          title="Borrar traducciones existentes para re-traducir todo al guardar"
        >
          <Globe size={15} />
          Forzar Traducción
        </button>

        <button
          onClick={handleSpellcheck}
          disabled={saving || spellingCheck}
          className="px-4 py-3 border border-[#D4AF37]/50 text-[#D4AF37] text-sm hover:bg-[#D4AF37]/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-w-[200px]"
        >
          {spellingCheck ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Revisando...
            </span>
          ) : (
            <>
              <Wand2 size={15} />
              Revisar Ortografía
            </>
          )}
        </button>

        <button
          onClick={handleSave}
          disabled={saving || spellingCheck}
          className="btn-gold disabled:opacity-50 min-w-[200px]"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {endDate ? 'Guardando tramo...' : 'Guardando...'}
            </span>
          ) : (
            <>
              <Save size={15} />
              {endDate ? `Guardar Tramo (${date} → ${endDate})` : 'Guardar Menú'}
            </>
          )}
        </button>
      </div>
      </div>

      {/* Sidebar: Menu History */}
      <div className="bg-[#111111] border border-white/10 rounded-sm p-6 sticky top-6">
        <h2 className="text-white font-medium mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-[#D4AF37]" />
          Historial de Menús
        </h2>
        
        {loadingHistory ? (
          <p className="text-white/40 text-sm">Cargando historial...</p>
        ) : history.length === 0 ? (
          <p className="text-white/40 text-sm italic">No hay menús guardados todavía.</p>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {history.map((m) => (
              <div key={m.id} className="p-4 border border-white/5 bg-white/[0.02] rounded-sm group relative">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[#D4AF37] text-sm tracking-widest font-mono">
                    {new Date(m.date).toLocaleDateString('es-ES')}
                  </span>
                  <div className="flex items-center gap-2">
                    {m.published ? (
                      <span className="w-2 h-2 rounded-full bg-green-500" title="Publicado" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-yellow-500" title="Borrador" />
                    )}

                    {/* Download PDF Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => { setOpenDownload(openDownload === m.id ? null : m.id); setOpenPrint(null) }}
                        className={`transition-colors flex items-center ${openDownload === m.id ? 'text-[#D4AF37]' : 'text-[#D4AF37]/60 hover:text-[#D4AF37]'}`}
                        title="Descargar PDF"
                      >
                        <FileText size={14} />
                      </button>
                      {openDownload === m.id && (
                        <div className="absolute right-0 top-full mt-1 bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-sm shadow-xl z-20 flex flex-col min-w-[80px]">
                          {(['es', 'ca', 'en', 'fr'] as const).map(lang => (
                            <button
                              key={lang}
                              onClick={() => { handleDownloadPDF(m, lang); setOpenDownload(null) }}
                              className="text-[10px] text-left px-3 py-2 text-white/60 hover:text-[#D4AF37] hover:bg-white/5 transition-colors uppercase tracking-widest border-b border-white/5 last:border-0"
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Print PDF Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => { setOpenPrint(openPrint === m.id ? null : m.id); setOpenDownload(null) }}
                        className={`transition-colors flex items-center ml-2 ${openPrint === m.id ? 'text-[#D4AF37]' : 'text-[#D4AF37]/60 hover:text-[#D4AF37]'}`}
                        title="Imprimir directamente"
                      >
                        <Printer size={14} />
                      </button>
                      {openPrint === m.id && (
                        <div className="absolute right-0 top-full mt-1 bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-sm shadow-xl z-20 flex flex-col min-w-[80px]">
                          {(['es', 'ca', 'en', 'fr'] as const).map(lang => (
                            <button
                              key={lang}
                              onClick={() => { handlePrintPDF(m, lang); setOpenPrint(null) }}
                              className="text-[10px] text-left px-3 py-2 text-white/60 hover:text-[#D4AF37] hover:bg-white/5 transition-colors uppercase tracking-widest border-b border-white/5 last:border-0"
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleEditMenu(m)}
                      className="text-white/20 hover:text-green-400 transition-colors ml-1"
                      title="Editar menú"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      onClick={() => handleDeleteMenu(m.id, m.date)}
                      className="text-white/20 hover:text-red-400 transition-colors ml-1"
                      title="Eliminar menú"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-white/60 text-xs">
                  {m.dishes?.length || 0} platos configurados
                </p>
                <p className="text-white/40 text-xs mt-1">
                  Sala: {m.price}€ {m.price_exterior ? `| Terraza: ${m.price_exterior}€` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Immersive Loading Overlay for Batch Translations / Saving */}
      {(saving || batchTranslating) && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
          <div className="flex flex-col items-center animate-pulse">
            <img src="/logo.png" alt="El Balconet" className="w-48 md:w-64 h-auto mb-8 opacity-90" />
            <h2 className="text-[#D4AF37] font-serif text-2xl md:text-3xl mb-4 text-center">
              {batchTranslating ? 'Creando menú y traduciendo...' : 'Guardando menú...'}
            </h2>
            <div className="flex flex-col items-center gap-3 text-[#333333]">
              <svg className="animate-spin w-8 h-8 text-[#D4AF37]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span className="text-sm font-medium tracking-widest uppercase text-center mt-2">
                {batchTranslating ? 'Espera unos segundos' : 'Un momento por favor'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
