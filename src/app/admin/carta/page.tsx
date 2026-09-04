'use client'

import { useState, useEffect } from 'react'
import { Trash2, Plus, Image as ImageIcon, FileText, Eye } from 'lucide-react'
import Image from 'next/image'
import DynamicCartaEditor from '@/components/admin/DynamicCartaEditor'

type ImageType = 'carta' | 'hero' | 'carta_document' | 'dynamic'
type ImageItem = { id: string; url: string; alt: string; order_index: number }

export default function AdminCartaPage() {
  const [activeType, setActiveType] = useState<ImageType>('dynamic')
  const [isEditorDirty, setIsEditorDirty] = useState(false)
  const [images, setImages] = useState<ImageItem[]>([])
  const [newUrl, setNewUrl] = useState('')
  const [newAlt, setNewAlt] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchImages = async () => {
    try {
      if (activeType === 'carta_document') {
        const res = await fetch('/api/public/carta-pdf')
        const data = await res.json()
        if (data.documents && data.documents.length > 0) {
          setImages(data.documents.map((doc: any, i: number) => ({
            id: doc.id,
            url: doc.url,
            alt: `Página ${i + 1}`,
            order_index: i
          })))
        } else {
          setImages([])
        }
        return
      }

      if (activeType === 'dynamic') return

      const res = await fetch(`/api/admin/images?type=${activeType}`)
      const data = await res.json()
      setImages(data.images ?? [])
    } catch {}
  }

  useEffect(() => { fetchImages() }, [activeType])

  const handleAdd = async () => {
    if (!newUrl.trim()) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newUrl.trim(),
          alt: newAlt.trim() || 'Imagen El Balconet',
          order_index: images.length,
          type: activeType,
        }),
      })
      if (!res.ok) throw new Error('Error al añadir imagen')
      setNewUrl('')
      setNewAlt('')
      setMessage({ type: 'success', text: '✓ Imagen añadida correctamente.' })
      await fetchImages()
    } catch {
      setMessage({ type: 'error', text: 'Error al añadir la imagen.' })
    } finally {
      setLoading(false)
    }
  }

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new (window as any).Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const MAX_SIZE = 1600 // Máximo para SEO razonable

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width
              width = MAX_SIZE
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height
              height = MAX_SIZE
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob)
              else reject(new Error('Error al comprimir'))
            },
            'image/webp', // WebP es el estándar de oro para SEO
            0.8 // Calidad del 80%
          )
        }
      }
      reader.onerror = (err) => reject(err)
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0]
    if (!originalFile) return

    setCompressing(true)
    setMessage(null)

    try {
      if (activeType === 'carta_document') {
        setUploading(true)
        const formData = new FormData()
        formData.append('file', originalFile)
        
        const res = await fetch('/api/admin/upload-carta', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error al subir el documento')
        
        setMessage({ type: 'success', text: '✓ Carta física subida correctamente (reemplaza cualquier otra).' })
        await fetchImages()
        return
      }

      // SEO Optimization: Comprimir antes de subir (para hero y carta carousel)
      const compressedBlob = await compressImage(originalFile)
      setCompressing(false)
      setUploading(true)

      const formData = new FormData()
      // Cambiamos la extensión a .webp para el servidor
      const fileName = originalFile.name.split('.').slice(0, -1).join('.') + '.webp'
      formData.append('file', new File([compressedBlob], fileName, { type: 'image/webp' }))
      formData.append('type', activeType)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir')

      setNewUrl(data.url)
      if (!newAlt) {
        setNewAlt(originalFile.name.split('.').slice(0, -1).join('.'))
      }
      setMessage({ type: 'success', text: '✓ Imagen optimizada para SEO y subida correctamente.' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al procesar el archivo.' })
    } finally {
      setCompressing(false)
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este archivo?')) return

    if (activeType === 'carta_document') {
      try {
        await fetch('/api/admin/upload-carta', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: id }),
        })
        await fetchImages()
        setMessage({ type: 'success', text: '✓ Documento eliminado de la carta física.' })
      } catch {
        setMessage({ type: 'error', text: 'Error al eliminar.' })
      }
      return
    }

    try {
      await fetch('/api/admin/images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: activeType }),
      })
      await fetchImages()
      setMessage({ type: 'success', text: '✓ Imagen eliminada.' })
    } catch {
      setMessage({ type: 'error', text: 'Error al eliminar.' })
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-white mb-1">Gestión de la Carta</h1>
        <p className="text-white/40 text-sm">Administra los platos, precios y las imágenes decorativas</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { id: 'dynamic', label: 'Carta Dinámica (Platos)' },
          { id: 'carta', label: 'Fotos Galería' },
          { id: 'hero', label: 'Fotos Portada' },
          { id: 'carta_document', label: 'PDF / Foto Física' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (isEditorDirty) {
                if (!confirm('Tienes cambios sin guardar en la Carta Dinámica. ¿Estás seguro de que quieres cambiar de pestaña y perder los cambios?')) {
                  return
                }
                setIsEditorDirty(false) // Reset dirty state if they choose to leave
              }
              setActiveType(tab.id as ImageType)
            }}
            className={`px-6 py-3 text-[10px] tracking-[0.2em] uppercase font-bold border transition-all duration-300 ${
              activeType === tab.id
                ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white bg-white/[0.02]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeType === 'dynamic' ? (
        <DynamicCartaEditor onDirtyChange={setIsEditorDirty} />
      ) : (
        <>
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

          {/* Add image form */}
          <div className="bg-[#111111] border border-white/10 rounded-sm p-6 mb-8">
            <h2 className="text-white font-medium mb-4 flex items-center gap-2">
              {activeType === 'carta_document' ? (
                <><FileText size={16} className="text-[#D4AF37]" /> Subir PDF o Imagen de la Carta</>
              ) : (
                <><Plus size={16} className="text-[#D4AF37]" /> Añadir nueva imagen</>
              )}
            </h2>

            {activeType === 'carta_document' ? (
              <div className="flex flex-col gap-4">
                <p className="text-white/40 text-sm">Sube tu carta real como un solo PDF o como fotos sueltas ordenadas (hasta un máximo de 10). Los usuarios podrán deslizar hacia abajo para leerlas.</p>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={uploading}
                    className="px-6 py-3 border border-dashed border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <FileText size={20} />
                    {uploading ? 'Subiendo carta...' : 'Seleccionar Archivo (PDF o Foto)'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-white/50 text-xs uppercase tracking-widest mb-2 block">
                      URL de la imagen *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="https://..."
                        className="admin-input flex-1"
                      />
                      <div className="relative">
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          disabled={uploading}
                          className="h-full px-4 border border-white/20 text-white/60 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all flex items-center gap-2 bg-white/5"
                          title="Subir y optimizar imagen para SEO"
                        >
                          <ImageIcon size={16} />
                          <span className="hidden sm:inline">
                            {compressing ? 'Optimizando...' : (uploading ? 'Subiendo...' : 'Subir')}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-white/50 text-xs uppercase tracking-widest mb-2 block">
                      Descripción (alt)
                    </label>
                    <input
                      type="text"
                      value={newAlt}
                      onChange={(e) => setNewAlt(e.target.value)}
                      placeholder="Platos mediterráneos..."
                      className="admin-input"
                      maxLength={200}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white/30 text-xs">
                    💡 Ahora puedes subir fotos directas desde tu móvil o PC. Se guardarán en Supabase automáticamente.
                  </p>
                  <button
                    onClick={handleAdd}
                    disabled={loading || !newUrl.trim()}
                    className="btn-gold disabled:opacity-50"
                  >
                    {loading ? 'Añadiendo...' : (
                      <>
                        <Plus size={15} />
                        Añadir
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Image grid */}
          {images.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10">
              <ImageIcon size={40} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/30">No hay imágenes añadidas aún</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className={`relative group border border-white/10 overflow-hidden ${activeType === 'carta_document' ? 'aspect-[3/4]' : 'aspect-square'}`}
                >
                  {img.url.endsWith('.pdf') ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-white/50">
                      <FileText size={48} className="mb-2" />
                      <span className="text-xs uppercase tracking-widest text-[#D4AF37]">Documento PDF</span>
                    </div>
                  ) : (
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#D4AF37]/80 hover:bg-[#D4AF37] p-2 text-white transition-colors"
                      title="Ver documento"
                    >
                      <Eye size={16} />
                    </a>
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="bg-red-500/80 hover:bg-red-500 p-2 text-white transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 flex items-center gap-2">
                    {img.url.endsWith('.pdf') && <FileText size={10} className="text-[#D4AF37]" />}
                    <p className="text-white/60 text-xs truncate">{img.alt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
