'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Curso } from '@/types/curso'

export default function EditCourseForm({ curso }: { curso: Curso }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      category: (form.elements.namedItem('category') as HTMLInputElement).value,
      instructor: (form.elements.namedItem('instructor') as HTMLSelectElement).value,
      total_hours: parseInt((form.elements.namedItem('total_hours') as HTMLInputElement).value) || 0,
      description: (form.elements.namedItem('description') as HTMLTextAreaElement).value || null,
      norm_reference: (form.elements.namedItem('norm_reference') as HTMLInputElement).value || null,
    }

    const res = await fetch(`/api/courses/${curso.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      setError('Error al actualizar el curso')
      setLoading(false)
      return
    }

    router.push(`/contenido/${curso.id}`)
    router.refresh()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        href={`/contenido/${curso.id}`}
        className="flex items-center gap-2 text-sm mb-6 hover:opacity-75 transition-opacity"
        style={{ color: 'var(--muted)' }}
      >
        <ArrowLeft size={16} />
        Regresar al curso
      </Link>

      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text)', fontFamily: 'var(--font-montserrat)' }}>
        Editar curso
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl p-6 border" style={{ borderColor: 'var(--border)' }}>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
            Nombre del curso *
          </label>
          <Input name="name" required defaultValue={curso.name} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
              Categoría *
            </label>
            <Input name="category" required defaultValue={curso.category} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
              Instructor
            </label>
            <select
              name="instructor"
              defaultValue={curso.instructor}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
              style={{ borderColor: 'var(--border)' }}
            >
              <option value="AMBOS">Ambos</option>
              <option value="MARIBEL">Maribel</option>
              <option value="CESAR">César</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
              Horas totales
            </label>
            <Input name="total_hours" type="number" min="0" defaultValue={curso.total_hours} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
              Norma de referencia
            </label>
            <Input name="norm_reference" defaultValue={curso.norm_reference || ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
            Descripción
          </label>
          <Textarea name="description" rows={3} defaultValue={curso.description || ''} />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 text-white"
            style={{ background: 'var(--gradient)' }}
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          <Link href={`/contenido/${curso.id}`}>
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
