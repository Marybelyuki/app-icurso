import type { Modulo } from '@/types/curso'

interface EvaluacionesProps {
  modulos: Modulo[]
  format: Record<string, unknown>
}

function QuestionCard({ number, question }: { number: number; question: string }) {
  return (
    <div className="flex gap-3 p-3 border rounded-lg" style={{ borderColor: '#E2E8F0' }}>
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ background: '#1E3C72' }}
      >
        {number}
      </span>
      <p className="text-sm" style={{ color: 'var(--text)' }}>{question}</p>
    </div>
  )
}

export default function Evaluaciones({ modulos, format }: EvaluacionesProps) {
  const evalPcts = (format.evaluation_pcts ?? { diagnostica: 0, formativa: 60, sumativa: 40, criterio: '80% mínimo' }) as Record<string, string | number>

  return (
    <div className="space-y-8">
      {/* Diagnóstica */}
      <section>
        <div className="px-4 py-3 rounded-t-xl font-bold text-white text-sm" style={{ background: '#1E3C72' }}>
          Evaluación Diagnóstica ({evalPcts.diagnostica}%)
        </div>
        <div className="border border-t-0 rounded-b-xl p-4 space-y-3" style={{ borderColor: '#E2E8F0' }}>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Aplicar antes del inicio del curso para detectar conocimientos previos.
          </p>
          {modulos.slice(0, 3).map((mod, i) => (
            <QuestionCard
              key={i}
              number={i + 1}
              question={`¿Qué conoce usted sobre "${mod.title}"?`}
            />
          ))}
          {modulos.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Agrega módulos al curso para generar preguntas diagnósticas.</p>
          )}
        </div>
      </section>

      {/* Formativa */}
      <section>
        <div className="px-4 py-3 rounded-t-xl font-bold text-white text-sm" style={{ background: '#1E3C72' }}>
          Evaluación Formativa ({evalPcts.formativa}%)
        </div>
        <div className="border border-t-0 rounded-b-xl p-4 space-y-3" style={{ borderColor: '#E2E8F0' }}>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Evaluación continua durante el curso. Criterio: {evalPcts.criterio}.
          </p>
          {modulos.map((mod) => (
            <div key={mod.id} className="border rounded-xl p-3" style={{ borderColor: '#E2E8F0' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#1E3C72' }}>
                Módulo {mod.number}: {mod.title}
              </p>
              {mod.objectives.slice(0, 2).map((obj, j) => (
                <QuestionCard key={j} number={j + 1} question={`Explique con sus palabras: ${obj}`} />
              ))}
              {mod.objectives.length === 0 && (
                <QuestionCard number={1} question={`¿Cuáles son los puntos más importantes de "${mod.title}"?`} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Sumativa */}
      <section>
        <div className="px-4 py-3 rounded-t-xl font-bold text-white text-sm" style={{ background: '#1E3C72' }}>
          Evaluación Sumativa ({evalPcts.sumativa}%)
        </div>
        <div className="border border-t-0 rounded-b-xl p-4 space-y-3" style={{ borderColor: '#E2E8F0' }}>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Evaluación final del curso. Criterio de acreditación: {evalPcts.criterio}.
          </p>
          {modulos.flatMap((mod) =>
            mod.objectives.map((obj, j) => ({
              mod,
              obj,
              idx: j,
            }))
          ).slice(0, 10).map((item, i) => (
            <QuestionCard
              key={i}
              number={i + 1}
              question={item.obj}
            />
          ))}
        </div>
      </section>

      {/* Satisfacción */}
      <section>
        <div className="px-4 py-3 rounded-t-xl font-bold text-white text-sm" style={{ background: '#1E3C72' }}>
          Encuesta de Satisfacción
        </div>
        <div className="border border-t-0 rounded-b-xl p-4 space-y-3" style={{ borderColor: '#E2E8F0' }}>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
            Escala del 1 al 5 donde 1 = Deficiente y 5 = Excelente
          </p>
          {[
            'El instructor dominó los temas del curso',
            'El material didáctico fue adecuado',
            'El curso cubrió mis expectativas',
            'El tiempo asignado fue suficiente',
            'La dinámica del curso fue apropiada',
            'Recomendaría este curso a un compañero',
          ].map((q, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg" style={{ borderColor: '#E2E8F0' }}>
              <p className="text-sm flex-1" style={{ color: 'var(--text)' }}>{q}</p>
              <div className="flex gap-2 ml-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs"
                    style={{ borderColor: '#1E3C72', color: '#1E3C72' }}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
