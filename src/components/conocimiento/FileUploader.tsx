'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Loader2 } from 'lucide-react'

interface FileUploaderProps {
  courseId: string
  onUploaded: () => void
}

export default function FileUploader({ courseId, onUploaded }: FileUploaderProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    setUploading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('courseId', courseId)

    const res = await fetch('/api/knowledge/upload', { method: 'POST', body: formData })

    if (!res.ok) {
      const err = await res.json()
      setError(err.error ?? 'Error al subir archivo')
    } else {
      onUploaded()
    }
    setUploading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all"
        style={{
          borderColor: dragging ? 'var(--accent)' : 'var(--border)',
          background: dragging ? 'rgba(108,63,197,0.03)' : 'transparent',
        }}
      >
        {uploading ? (
          <>
            <Loader2 size={32} className="animate-spin mb-3" style={{ color: 'var(--accent)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Procesando archivo...</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Extrayendo texto y generando embedding</p>
          </>
        ) : (
          <>
            {dragging ? (
              <Upload size={32} className="mb-3" style={{ color: 'var(--accent)' }} />
            ) : (
              <FileText size={32} className="mb-3" style={{ color: 'var(--muted)' }} />
            )}
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              Arrastra un archivo o haz clic para seleccionar
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Cualquier archivo — máx. 50MB
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="*"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}
    </div>
  )
}
