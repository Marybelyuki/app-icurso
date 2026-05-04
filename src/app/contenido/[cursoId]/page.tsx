import { getCourseById, getModules } from '@/lib/db/queries'
import ModuloList from '@/components/cursos/ModuloList'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, FileText } from 'lucide-react'
import CourseActions from './CourseActions'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ cursoId: string }>
}

export default async function CursoDetailPage({ params }: Props) {
  const { cursoId } = await params
  const [curso, modulos] = await Promise.all([
    getCourseById(cursoId),
    getModules(cursoId),
  ])

  if (!curso) notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/contenido"
        className="flex items-center gap-2 text-sm mb-5 hover:opacity-75 transition-opacity"
        style={{ color: 'var(--muted)' }}
      >
        <ArrowLeft size={16} />
        Catálogo de cursos
      </Link>

      {/* Course header */}
      <div className="bg-white rounded-2xl p-6 border mb-6" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap gap-2 mb-3">
          {curso.norm_reference && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
              style={{ background: 'var(--hot)' }}
            >
              {curso.norm_reference}
            </span>
          )}
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
            style={{ background: 'var(--primary)' }}
          >
            {curso.category}
          </span>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(108,63,197,0.1)', color: 'var(--accent)' }}
          >
            {curso.instructor}
          </span>
        </div>

        <div className="flex items-start justify-between gap-4 mb-2">
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--text)', fontFamily: 'var(--font-montserrat)' }}
          >
            {curso.name}
          </h1>
          <CourseActions cursoId={cursoId} />
        </div>

        {curso.description && (
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            {curso.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--muted)' }}>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>{curso.total_hours} horas totales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText size={14} />
            <Link
              href={`/formatos/${cursoId}`}
              className="hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              Ver formatos EC0301/EC0217
            </Link>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'var(--border)' }}>
        <h2
          className="text-lg font-bold mb-4"
          style={{ color: 'var(--text)', fontFamily: 'var(--font-montserrat)' }}
        >
          Módulos del curso
        </h2>
        <ModuloList modulos={modulos} cursoId={cursoId} />
      </div>
    </div>
  )
}
