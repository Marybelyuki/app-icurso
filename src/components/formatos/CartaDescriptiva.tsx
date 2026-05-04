import type { Curso, Modulo } from '@/types/curso'

interface CartaDescriptivaProps {
  curso: Curso
  modulos: Modulo[]
  format: Record<string, unknown>
}

export default function CartaDescriptiva({ curso, modulos, format }: CartaDescriptivaProps) {
  const generalData = (format.general_data ?? {}) as Record<string, string>
  const objectives = (format.objectives ?? {}) as Record<string, string>
  const evalPcts = (format.evaluation_pcts ?? { diagnostica: 0, formativa: 60, sumativa: 40, criterio: '80% mínimo' }) as Record<string, string | number>
  const requirements = (format.requirements ?? {}) as Record<string, string>
  const hasNormInName = curso.norm_reference && curso.name.toUpperCase().includes(curso.norm_reference.toUpperCase())
  const displayCourseName = curso.norm_reference && !hasNormInName
    ? `${curso.name} (${curso.norm_reference})`
    : curso.name

  return (
    <div className="space-y-6 text-sm" style={{ color: 'var(--text)' }}>
      {/* Header */}
      <div className="border rounded-xl overflow-hidden" style={{ borderColor: '#1E3C72' }}>
        <div className="p-4 text-center text-white font-bold text-base" style={{ background: '#1E3C72', fontFamily: 'var(--font-montserrat)' }}>
          CARTA DESCRIPTIVA DEL CURSO
        </div>
        <table className="w-full border-collapse">
          <tbody>
            {[
              ['Nombre del curso:', displayCourseName],
              ['Categoría:', curso.category],
              ['Norma de referencia:', curso.norm_reference ?? '—'],
              ['Instructor responsable:', generalData.instructor ?? curso.instructor],
              ['Duración total:', `${curso.total_hours} horas`],
              ['Modalidad:', generalData.modalidad ?? 'Presencial'],
              ['Lugar de impartición:', generalData.lugar ?? '—'],
              ['Fecha:', generalData.fecha ?? '—'],
            ].map(([label, value], i) => (
              <tr key={i} style={{ borderBottom: '1px solid #E2E8F0', background: i % 2 === 0 ? 'white' : '#F8FAFC' }}>
                <td className="px-4 py-2.5 font-semibold w-48" style={{ color: '#1E3C72' }}>{label}</td>
                <td className="px-4 py-2.5">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Objectives */}
      <div className="border rounded-xl overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
        <div className="px-4 py-3 font-bold text-white text-xs uppercase tracking-wide" style={{ background: '#1E3C72' }}>
          Objetivo General del Curso
        </div>
        <div className="p-4">
          <p>{objectives.general ?? 'Definir objetivo general del curso en el formulario.'}</p>
        </div>
      </div>

      {/* Modules table */}
      <div className="border rounded-xl overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
        <div className="px-4 py-3 font-bold text-white text-xs uppercase tracking-wide" style={{ background: '#1E3C72' }}>
          Desarrollo temático
        </div>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr style={{ background: '#1E3C72' }}>
              {['No.', 'Tema / Módulo', 'Objetivos específicos', 'Técnicas didácticas', 'Horas'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold text-white">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modulos.map((mod, i) => (
              <tr key={mod.id} style={{ background: i % 2 === 0 ? 'white' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <td className="px-3 py-2.5">{mod.number}</td>
                <td className="px-3 py-2.5 font-medium">{mod.title}</td>
                <td className="px-3 py-2.5">
                  {mod.objectives.length > 0 ? (
                    <ul className="list-disc list-inside space-y-0.5">
                      {mod.objectives.map((o, j) => <li key={j}>{o}</li>)}
                    </ul>
                  ) : '—'}
                </td>
                <td className="px-3 py-2.5">Exposición dialogada, práctica</td>
                <td className="px-3 py-2.5">{mod.hours}h</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#F0F4FF', fontWeight: 600 }}>
              <td colSpan={4} className="px-3 py-2.5 text-right">Total:</td>
              <td className="px-3 py-2.5">{modulos.reduce((s, m) => s + m.hours, 0)}h</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Evaluation */}
      <div className="border rounded-xl overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
        <div className="px-4 py-3 font-bold text-white text-xs uppercase tracking-wide" style={{ background: '#1E3C72' }}>
          Criterios de evaluación
        </div>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr style={{ background: '#1E3C72' }}>
              {['Tipo', 'Porcentaje', 'Criterio de acreditación'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold text-white">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Diagnóstica', evalPcts.diagnostica + '%', '—'],
              ['Formativa', evalPcts.formativa + '%', evalPcts.criterio as string],
              ['Sumativa', evalPcts.sumativa + '%', evalPcts.criterio as string],
            ].map(([tipo, pct, criterio], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <td className="px-3 py-2.5">{tipo}</td>
                <td className="px-3 py-2.5">{pct}</td>
                <td className="px-3 py-2.5">{criterio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Requirements */}
      <div className="border rounded-xl overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
        <div className="px-4 py-3 font-bold text-white text-xs uppercase tracking-wide" style={{ background: '#1E3C72' }}>
          Requisitos y perfil de ingreso
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          {[
            ['Escolaridad mínima', requirements.escolaridad ?? '—'],
            ['Experiencia requerida', requirements.experiencia ?? '—'],
            ['Materiales necesarios', requirements.materiales ?? '—'],
            ['Infraestructura', requirements.infraestructura ?? '—'],
          ].map(([label, value]) => (
            <div key={label as string}>
              <p className="text-xs font-semibold mb-0.5" style={{ color: '#1E3C72' }}>{label}</p>
              <p>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
