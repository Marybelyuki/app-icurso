import { getCourseById, getKnowledgeItems } from '@/lib/db/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import KnowledgeClientSection from './KnowledgeClientSection'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ cursoId: string }>
}

export default async function ConocimientoPage({ params }: Props) {
  const { cursoId } = await params
  const [curso, items] = await Promise.all([
    getCourseById(cursoId),
    getKnowledgeItems(cursoId),
  ])

  if (!curso) notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link
        href={`/contenido/${cursoId}`}
        className="flex items-center gap-2 text-sm mb-5 hover:opacity-75 transition-opacity"
        style={{ color: 'var(--muted)' }}
      >
        <ArrowLeft size={16} />
        {curso.name}
      </Link>

      <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text)', fontFamily: 'var(--font-montserrat)' }}>
        Base de conocimiento
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        Los archivos y enlaces subidos aquí se usarán como contexto para la generación IA de este curso.
      </p>

      <div className="grid grid-cols-1 gap-6">
        {/* Upload */}
        <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Subir archivo</h2>
          <KnowledgeClientSection courseId={cursoId} initialItems={items} />
        </div>
      </div>
    </div>
  )
}
