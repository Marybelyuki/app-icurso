'use client'

import { useState } from 'react'
import { Link2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface LinkAdderProps {
  courseId: string
  onAdded: () => void
}

export default function LinkAdder({ courseId, onAdded }: LinkAdderProps) {
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isVideo = url.includes('youtube.com') || url.includes('youtu.be')

  async function handleAdd() {
    if (!url.trim()) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/knowledge/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: isVideo ? 'video' : 'link',
        url: url.trim(),
        name: name.trim() || url.trim(),
        courseId,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      setError(err.error ?? 'Error al agregar enlace')
    } else {
      setUrl('')
      setName('')
      onAdded()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-3 p-4 bg-white rounded-xl border" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2">
        {isVideo ? (
          <Play size={16} style={{ color: '#E63B8F' }} />
        ) : (
          <Link2 size={16} style={{ color: 'var(--muted)' }} />
        )}
        <h3 className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          Agregar {isVideo ? 'video de YouTube' : 'enlace web'}
        </h3>
      </div>

      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        type="url"
      />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre descriptivo (opcional)"
      />

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <Button
        onClick={handleAdd}
        disabled={loading || !url.trim()}
        size="sm"
        className="text-white"
        style={{ background: 'var(--primary)' }}
      >
        {loading ? 'Agregando...' : 'Agregar'}
      </Button>
    </div>
  )
}
