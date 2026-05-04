'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, Trash2, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import type { Modulo } from '@/types/curso'

interface ModuloListProps {
  modulos: Modulo[]
  cursoId: string
}

export default function ModuloList({ modulos: initial, cursoId }: ModuloListProps) {
  const [modulos, setModulos] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [hours, setHours] = useState('')
  const [objectives, setObjectives] = useState('')
  const [loading, setLoading] = useState(false)

  const generated = modulos.filter((m) => m.generated).length
  const progress = modulos.length > 0 ? Math.round((generated / modulos.length) * 100) : 0

  async function addModule() {
    if (!title.trim()) return
    setLoading(true)

    const res = await fetch('/api/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_id: cursoId,
        number: modulos.length + 1,
        title: title.trim(),
        hours: parseInt(hours) || 0,
        objectives: objectives.split('\n').map((o) => o.trim()).filter(Boolean),
      }),
    })

    if (res.ok) {
      const mod = await res.json()
      setModulos((prev) => [...prev, mod])
      setTitle('')
      setHours('')
      setObjectives('')
      setShowForm(false)
    }
    setLoading(false)
  }

  async function deleteModule(id: string) {
    const res = await fetch(`/api/modules?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setModulos((prev) => prev.filter((m) => m.id !== id))
    }
  }

  return (
    <div>
      {/* Progress */}
      {modulos.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span style={{ color: 'var(--muted)' }}>Módulos generados</span>
            <span className="font-medium" style={{ color: 'var(--primary)' }}>
              {generated}/{modulos.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Module list */}
      <div className="space-y-2 mb-4">
        {modulos.length === 0 && (
          <div className="text-center py-8 rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            <p className="text-sm">Aún no hay módulos. Agrega el primero.</p>
          </div>
        )}
        {modulos.map((mod) => (
          <div
            key={mod.id}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border group"
            style={{ borderColor: 'var(--border)' }}
          >
            {mod.generated ? (
              <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
            ) : (
              <Circle size={20} style={{ color: 'var(--border)' }} />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>
                {mod.number}. {mod.title}
              </p>
              {mod.hours > 0 && (
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{mod.hours}h</p>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => deleteModule(mod.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                style={{ color: 'var(--destructive)' }}
              >
                <Trash2 size={14} />
              </button>
              <Link
                href={`/contenido/${cursoId}/modulo/${mod.id}`}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: 'var(--muted)' }}
              >
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add module form */}
      {showForm ? (
        <div className="bg-white rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Nuevo módulo</h3>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del módulo"
          />
          <Input
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            type="number"
            min="0"
            placeholder="Horas (opcional)"
          />
          <textarea
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            placeholder={'Objetivos (uno por línea)\nEj: El participante identificará...'}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none"
            style={{ borderColor: 'var(--border)' }}
          />
          <div className="flex gap-2">
            <Button
              onClick={addModule}
              disabled={loading || !title.trim()}
              className="text-white text-sm"
              style={{ background: 'var(--primary)' }}
              size="sm"
            >
              {loading ? 'Guardando...' : 'Guardar módulo'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} className="mr-2" />
          Agregar módulo
        </Button>
      )}
    </div>
  )
}
