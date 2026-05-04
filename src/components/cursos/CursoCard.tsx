import Link from 'next/link'
import { Clock, User } from 'lucide-react'
import type { Curso } from '@/types/curso'

interface CursoCardProps {
  curso: Curso
}

const instructorColors: Record<string, string> = {
  MARIBEL: '#1E3C72',
  CESAR: '#6C3FC5',
  AMBOS: '#27AE60',
}

export default function CursoCard({ curso }: CursoCardProps) {
  return (
    <Link href={`/contenido/${curso.id}`}>
      <div
        className="group bg-white rounded-xl p-5 border cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 h-full flex flex-col"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {curso.norm_reference && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
              style={{ background: 'var(--hot)' }}
            >
              {curso.norm_reference}
            </span>
          )}
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
            style={{ background: instructorColors[curso.instructor] ?? '#6B7280' }}
          >
            {curso.instructor}
          </span>
        </div>

        {/* Name */}
        <h3
          className="font-semibold text-sm leading-snug mb-3 flex-1 group-hover:text-primary transition-colors"
          style={{ color: 'var(--text)', fontFamily: 'var(--font-montserrat)' }}
        >
          {curso.name}
        </h3>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-auto pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
            <Clock size={12} />
            <span>{curso.total_hours}h</span>
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
            <User size={12} />
            <span>{curso.category}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
