import type { Curso, Modulo, ContentBlock } from '@/types/curso'

interface ManualParticipanteProps {
  curso: Curso
  modulos: Modulo[]
  blocksMap: Record<string, ContentBlock[]>
}

export default function ManualParticipante({ curso, modulos, blocksMap }: ManualParticipanteProps) {
  return (
    <div className="space-y-8 text-sm" style={{ color: 'var(--text)' }}>
      {/* Cover */}
      <div
        className="p-8 rounded-xl text-white text-center"
        style={{ background: 'var(--gradient)' }}
      >
        <p className="text-xs opacity-75 mb-2 uppercase tracking-widest">Manual del Participante</p>
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-montserrat)' }}>
          {curso.name}
        </h1>
        {curso.norm_reference && (
          <p className="text-sm opacity-90">{curso.norm_reference}</p>
        )}
        <div className="mt-4 pt-4 border-t border-white/20 text-xs opacity-75">
          iCurs@ Consultoría y Formación de Talento
        </div>
      </div>

      {/* Table of contents */}
      <div className="border rounded-xl overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
        <div className="px-4 py-3 font-bold text-white text-xs uppercase tracking-wide" style={{ background: '#1E3C72' }}>
          Contenido
        </div>
        <div className="p-4">
          {modulos.map((mod) => (
            <div key={mod.id} className="flex justify-between py-1.5 border-b last:border-0" style={{ borderColor: '#F0F4FF' }}>
              <span>{mod.number}. {mod.title}</span>
              <span style={{ color: 'var(--muted)' }}>{mod.hours}h</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modules */}
      {modulos.map((mod) => {
        const blocks = blocksMap[mod.id] ?? []
        return (
          <div key={mod.id} className="border rounded-xl overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
            <div className="px-4 py-3 font-bold text-white" style={{ background: '#1E3C72', fontFamily: 'var(--font-montserrat)' }}>
              Módulo {mod.number}: {mod.title}
            </div>
            <div className="p-4 space-y-4">
              {mod.objectives.length > 0 && (
                <div className="p-3 rounded-lg" style={{ background: 'rgba(30,60,114,0.05)' }}>
                  <p className="font-semibold mb-2" style={{ color: '#1E3C72' }}>Objetivos:</p>
                  <ul className="space-y-1">
                    {mod.objectives.map((o, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#1E3C72' }} />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {blocks.length > 0 ? (
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Este módulo contiene {blocks.length} bloque{blocks.length !== 1 ? 's' : ''} de contenido generados.
                  Exporta a PDF para ver el contenido completo.
                </p>
              ) : (
                <p className="text-xs italic" style={{ color: 'var(--muted)' }}>
                  Contenido pendiente de generar con IA.
                </p>
              )}

              {/* Activities */}
              <div className="border-t pt-3" style={{ borderColor: '#E2E8F0' }}>
                <p className="font-semibold mb-2" style={{ color: '#1E3C72' }}>Actividades de aprendizaje:</p>
                <ul className="space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#6C3FC5' }} />
                    Participación en dinámicas grupales
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#6C3FC5' }} />
                    Análisis de casos prácticos
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#6C3FC5' }} />
                    Ejercicios individuales y en equipo
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
