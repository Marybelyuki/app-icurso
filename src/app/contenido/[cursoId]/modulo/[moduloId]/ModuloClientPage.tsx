'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ContentGenerator from '@/components/contenido/ContentGenerator'
import ContentBlock from '@/components/contenido/ContentBlock'
import ReferencesList from '@/components/contenido/ReferencesList'
import ExportBar from '@/components/contenido/ExportBar'
import type { Modulo, ContentBlock as ContentBlockType, Curso } from '@/types/curso'

interface Reference {
  id: string
  type: string
  title: string
  author?: string | null
  year?: string | null
  url?: string | null
  citation: string
}

interface Props {
  modulo: Modulo
  curso: Curso
  initialBlocks: ContentBlockType[]
  initialReferences: Reference[]
  cursoId: string
}

export default function ModuloClientPage({ modulo, curso, initialBlocks, initialReferences, cursoId }: Props) {
  const router = useRouter()
  const [blocks] = useState(initialBlocks)
  const [references] = useState(initialReferences)

  function handleComplete() {
    router.refresh()
  }

  async function handleBlockUpdate(id: string, content: Record<string, unknown>) {
    await fetch(`/api/content/blocks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
  }

  return (
    <div className="space-y-6">
      {/* Generator */}
      <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text)', fontFamily: 'var(--font-montserrat)' }}>
          Generación con IA
        </h2>
        <ContentGenerator
          modulo={modulo}
          courseName={curso.name}
          onComplete={handleComplete}
        />
      </div>

      {/* Content blocks */}
      {blocks.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border space-y-8" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-montserrat)' }}>
              Contenido generado
            </h2>
            <ExportBar moduleId={modulo.id} courseId={cursoId} moduleName={modulo.title} />
          </div>

          <div className="pl-8 space-y-8">
            {blocks.map((block) => (
              <ContentBlock key={block.id} block={block} onUpdate={handleBlockUpdate} />
            ))}
          </div>
        </div>
      )}

      {/* References */}
      {references.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'var(--border)' }}>
          <ReferencesList references={references} />
        </div>
      )}
    </div>
  )
}
