'use client'

import { useState } from 'react'
import { FileDown, FileText, Presentation } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExportBarProps {
  moduleId: string
  courseId: string
  moduleName: string
}

export default function ExportBar({ moduleId, courseId, moduleName }: ExportBarProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function exportPDF(type: 'module' | 'course') {
    setLoading(type === 'module' ? 'pdf-module' : 'pdf-course')
    try {
      const id = type === 'module' ? moduleId : courseId
      const res = await fetch(`/api/export/pdf?id=${id}&type=${type}`)
      if (!res.ok) throw new Error('Error en exportación')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${moduleName}-${type}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  async function exportWord() {
    setLoading('word')
    try {
      const res = await fetch(`/api/export/word?moduleId=${moduleId}`)
      if (!res.ok) throw new Error('Error en exportación')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${moduleName}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  async function exportGamma() {
    setLoading('gamma')
    try {
      const res = await fetch('/api/export/gamma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId }),
      })
      if (!res.ok) throw new Error('Error en exportación')
      const { url } = await res.json()
      window.open(url, '_blank')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportPDF('module')}
        disabled={!!loading}
        className="text-xs"
      >
        <FileDown size={14} className="mr-1.5" />
        {loading === 'pdf-module' ? 'Exportando...' : 'PDF Módulo'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportPDF('course')}
        disabled={!!loading}
        className="text-xs"
      >
        <FileDown size={14} className="mr-1.5" />
        {loading === 'pdf-course' ? 'Exportando...' : 'PDF Curso'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportWord}
        disabled={!!loading}
        className="text-xs"
      >
        <FileText size={14} className="mr-1.5" />
        {loading === 'word' ? 'Exportando...' : 'Word'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportGamma}
        disabled={!!loading}
        className="text-xs"
        style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
      >
        <Presentation size={14} className="mr-1.5" />
        {loading === 'gamma' ? 'Generando...' : 'Gamma'}
      </Button>
    </div>
  )
}
