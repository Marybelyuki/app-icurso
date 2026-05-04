import type { Curso, Modulo } from '@/types/curso'

interface ManualInstructorProps {
  curso: Curso
  modulos: Modulo[]
  format: Record<string, unknown>
}

export default function ManualInstructor({ curso, modulos, format }: ManualInstructorProps) {
  const apertura = (format.apertura ?? {}) as Record<string, string>
  const cierre = (format.cierre ?? {}) as Record<string, string>

  return (
    <div className="space-y-8 text-sm" style={{ color: 'var(--text)' }}>
      {/* Cover */}
      <div className="p-6 rounded-xl text-white" style={{ background: 'var(--gradient)' }}>
        <p className="text-xs opacity-75 mb-1 uppercase tracking-widest">Manual del Instructor</p>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-montserrat)' }}>{curso.name}</h1>
        <p className="text-xs opacity-75 mt-2">USO EXCLUSIVO DEL INSTRUCTOR — MATERIAL CONFIDENCIAL</p>
      </div>

      {/* Apertura */}
      <div className="border rounded-xl overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
        <div className="px-4 py-3 font-bold text-white text-xs uppercase tracking-wide" style={{ background: '#1E3C72' }}>
          Apertura del curso
        </div>
        <div className="p-4 space-y-3">
          <div>
            <p className="font-semibold text-xs mb-1" style={{ color: '#1E3C72' }}>Dinámica de bienvenida:</p>
            <p>{apertura.bienvenida ?? 'Presentación del instructor y participantes. Establecer acuerdos de trabajo.'}</p>
          </div>
          <div>
            <p className="font-semibold text-xs mb-1" style={{ color: '#1E3C72' }}>Encuadre del curso:</p>
            <p>{apertura.encuadre ?? 'Presentar objetivos, metodología, horarios y reglas de participación.'}</p>
          </div>
          <div>
            <p className="font-semibold text-xs mb-1" style={{ color: '#1E3C72' }}>Evaluación diagnóstica:</p>
            <p>{apertura.diagnostica ?? 'Aplicar evaluación diagnóstica para detectar conocimientos previos.'}</p>
          </div>
        </div>
      </div>

      {/* Module guides */}
      {modulos.map((mod) => (
        <div key={mod.id} className="border rounded-xl overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
          <div className="px-4 py-3 font-bold text-white" style={{ background: '#1E3C72' }}>
            Guía — Módulo {mod.number}: {mod.title}
          </div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr style={{ background: '#F0F4FF' }}>
                {['Tiempo', 'Actividad', 'Técnica didáctica', 'Materiales', 'Notas del instructor'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color: '#1E3C72' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td className="px-3 py-2">10 min</td>
                <td className="px-3 py-2">Introducción al tema</td>
                <td className="px-3 py-2">Exposición dialogada</td>
                <td className="px-3 py-2">Presentación, Manual</td>
                <td className="px-3 py-2">Conectar con experiencia del grupo</td>
              </tr>
              {mod.objectives.map((obj, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <td className="px-3 py-2">{mod.hours > 0 ? `${Math.round((mod.hours * 60) / Math.max(mod.objectives.length, 1))} min` : '—'}</td>
                  <td className="px-3 py-2">{obj}</td>
                  <td className="px-3 py-2">Aprendizaje activo</td>
                  <td className="px-3 py-2">Manual del participante</td>
                  <td className="px-3 py-2">Facilitar participación</td>
                </tr>
              ))}
              <tr style={{ background: '#F0F4FF' }}>
                <td className="px-3 py-2">10 min</td>
                <td className="px-3 py-2">Cierre y retroalimentación</td>
                <td className="px-3 py-2">Plenaria</td>
                <td className="px-3 py-2">—</td>
                <td className="px-3 py-2">Reforzar puntos clave</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}

      {/* Cierre */}
      <div className="border rounded-xl overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
        <div className="px-4 py-3 font-bold text-white text-xs uppercase tracking-wide" style={{ background: '#1E3C72' }}>
          Cierre del curso
        </div>
        <div className="p-4 space-y-3">
          <div>
            <p className="font-semibold text-xs mb-1" style={{ color: '#1E3C72' }}>Síntesis final:</p>
            <p>{cierre.sintesis ?? 'Recapitulación de los temas principales con participación del grupo.'}</p>
          </div>
          <div>
            <p className="font-semibold text-xs mb-1" style={{ color: '#1E3C72' }}>Evaluación sumativa:</p>
            <p>{cierre.evaluacion ?? 'Aplicar evaluación final y encuesta de satisfacción.'}</p>
          </div>
          <div>
            <p className="font-semibold text-xs mb-1" style={{ color: '#1E3C72' }}>Compromisos y seguimiento:</p>
            <p>{cierre.compromisos ?? 'Establecer compromisos de aplicación y plan de seguimiento.'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
