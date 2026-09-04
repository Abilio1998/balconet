'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Star } from 'lucide-react'

type Review = {
  id: string
  author_name: string
  gender: 'male' | 'female' | 'neutral'
  rating: number
  text: string
  relative_time_description: string
  order: number
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetch('/api/public/reviews')
      .then(res => res.json())
      .then(data => {
        if (data.reviews && data.reviews.length > 0) {
          setReviews(data.reviews)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviews)
      })
      if (!res.ok) throw new Error('Error al guardar las reseñas')
      setMessage({ type: 'success', text: '✓ Reseñas actualizadas correctamente en la web.' })
      
      // Auto dismiss message
      setTimeout(() => setMessage(null), 4000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const addReview = () => {
    const newReview: Review = {
      id: crypto.randomUUID(),
      author_name: '',
      gender: 'neutral',
      rating: 5,
      text: '',
      relative_time_description: 'Hace 1 semana',
      order: reviews.length
    }
    setReviews([...reviews, newReview])
  }

  const removeReview = (id: string) => {
    setReviews(reviews.filter(r => r.id !== id))
  }

  const updateReview = (id: string, field: keyof Review, value: any) => {
    setReviews(reviews.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-white mb-2">Reseñas de Google</h1>
          <p className="text-white/40">Gestiona y selecciona a mano las mejores reseñas que aparecerán en la web.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-gold flex items-center gap-2 whitespace-nowrap"
        >
          <Save size={18} />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {message && (
        <div className={`p-4 mb-8 border rounded-sm ${message.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6 mb-8">
        {reviews.map((review, index) => (
          <div key={review.id} className="bg-[#111111] border border-white/10 rounded-sm p-6 relative group transition-all hover:border-white/20 shadow-2xl">
            <div className="absolute top-4 left-4 bg-black/50 text-white/40 px-3 py-1 text-xs rounded-full border border-white/5">
              #{index + 1}
            </div>
            
            <button
              onClick={() => removeReview(review.id)}
              className="absolute top-4 right-4 text-white/20 hover:text-red-500 transition-colors p-2"
              title="Eliminar reseña"
            >
              <Trash2 size={20} />
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="text-white/50 text-xs uppercase tracking-widest mb-2 block">Nombre del Cliente *</label>
                <input
                  type="text"
                  value={review.author_name}
                  onChange={e => updateReview(review.id, 'author_name', e.target.value)}
                  className="admin-input"
                  placeholder="Ej: Laura Martínez"
                />
              </div>

              <div>
                <label className="text-white/50 text-xs uppercase tracking-widest mb-2 block">Avatar / Género *</label>
                <select
                  value={review.gender}
                  onChange={e => updateReview(review.id, 'gender', e.target.value)}
                  className="admin-input w-full"
                >
                  <option value="male">Hombre - Avatar Genérico</option>
                  <option value="female">Mujer - Avatar Genérico</option>
                  <option value="neutral">Color Neutro e Iniciales</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-white/50 text-xs uppercase tracking-widest mb-2 block">Texto de la Reseña *</label>
                <textarea
                  value={review.text}
                  onChange={e => updateReview(review.id, 'text', e.target.value)}
                  className="admin-input min-h-[100px]"
                  placeholder="Escribe lo que dijo el cliente..."
                />
              </div>

              <div>
                <label className="text-white/50 text-xs uppercase tracking-widest mb-2 block">Estrellas</label>
                <div className="flex items-center h-[42px] px-4 border border-white/10 rounded-sm bg-white/5 disabled:opacity-50 text-white gap-2">
                  <Star size={16} className="text-[#D4AF37] fill-[#D4AF37]" />
                  <span className="text-sm">5 (Automático)</span>
                </div>
              </div>

              <div>
                <label className="text-white/50 text-xs uppercase tracking-widest mb-2 block">Fecha de Publicación *</label>
                <input
                  type="text"
                  value={review.relative_time_description}
                  onChange={e => updateReview(review.id, 'relative_time_description', e.target.value)}
                  className="admin-input"
                  placeholder="Ej: Hace 2 semanas"
                />
              </div>
            </div>
          </div>
        ))}
        
        {reviews.length === 0 && (
          <div className="text-center py-16 border border-dashed border-white/20 rounded-sm bg-white/5">
            <Star size={48} className="text-white/10 mx-auto mb-4" />
            <h3 className="text-white text-lg mb-2">No tienes habilitada ninguna reseña</h3>
            <p className="text-white/40 mb-6 max-w-sm mx-auto">Tus clientes verán una web sin sección de reseñas hasta que decidas añadir la primera.</p>
            <button
              onClick={addReview}
              className="px-6 py-2 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors inline-flex items-center gap-2 rounded-sm"
            >
              <Plus size={16} /> Añadir la Primera Reseña
            </button>
          </div>
        )}
      </div>

      {reviews.length > 0 && (
        <button
          onClick={addReview}
          className="w-full py-5 border border-dashed border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors flex items-center justify-center gap-2 rounded-sm"
        >
          <Plus size={20} />
          Añadir Otra Reseña Adicional
        </button>
      )}
    </div>
  )
}
