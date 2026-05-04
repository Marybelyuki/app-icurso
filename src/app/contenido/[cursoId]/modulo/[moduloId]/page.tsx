import { getCourseById, getModuleById, getContentBlocks, getReferences } from '@/lib/db/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Clock, BookOpen } from 'lucide-react'
import ModuloClientPage from './ModuloClientPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ cursoId: string; moduloId: string }>
}

export default async function ModuloPage({ params }: Props) {
  const { cursoId, moduloId } = await params

  const [curso, modulo, blocks, references] = await Promise.all([
    getCourseById(cursoId),
    getModuleById(moduloId),
    getContentBlocks(moduloId),
    getReferences(moduloId),
  ])

  if (!curso || !modulo) notFound()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-5" style={{ color: 'var(--muted)' }}>
        <Link href="/contenido" className="hover:opacity-75">Catálogo</Link>
        <span>/</span>
        <Link href={`/contenido/${cursoId}`} className="hover:opacity-75">{curso.name}</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>Módulo {modulo.number}</span>
      </div>

      {/* Module header */}
      <div className="bg-white rounded-2xl p-6 border mb-6" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>
              MÓDULO {modulo.number}
            </p>
            <h1
              className="text-2xl font-bold mb-3"
              style={{ color: 'var(--text)', fontFamily: 'var(--font-montserrat)' }}
            >
              {modulo.title}
            </h1>
            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--muted)' }}>
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span>{modulo.hours}h</span>
              </div>
              {modulo.objectives.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <BookOpen size={14} />
                  <span>{modulo.objectives.length} objetivo{modulo.objectives.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>

          <Link
            href={`/contenido/${cursoId}/conocimiento`}
            className="text-xs px-3 py-1.5 rounded-lg border hover:opacity-75 transition-opacity"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            Base de conocimiento
          </Link>
        </div>

        {modulo.objectives.length > 0 && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              Objetivos de aprendizaje
            </p>
            <ul className="space-y-1">
              {modulo.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text)' }}>
                  <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white" style={{ background: 'var(--primary)' }}>
                    {i + 1}
                  </span>
                  {obj}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ModuloClientPage
        modulo={modulo}
        curso={curso}
        initialBlocks={blocks}
        initialReferences={references}
        cursoId={cursoId}
      />
    </div>
  )
}
