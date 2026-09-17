/** Garantiza límites de evaluaciones: diagnóstica 5, formativa ≤5 criterios, sumativa exactamente 10. */

type Reactivo = {
  pregunta: string
  opcion_a: string
  opcion_b: string
  opcion_c: string
  opcion_d: string
  respuesta_correcta: string
}

function asReactivo(raw: unknown): Reactivo | null {
  if (!raw || typeof raw !== 'object') return null
  const q = raw as Record<string, unknown>
  const pregunta = String(q.pregunta || '').trim()
  if (!pregunta) return null
  return {
    pregunta,
    opcion_a: String(q.opcion_a || 'Opción A'),
    opcion_b: String(q.opcion_b || 'Opción B'),
    opcion_c: String(q.opcion_c || 'Opción C'),
    opcion_d: String(q.opcion_d || 'Opción D'),
    respuesta_correcta: String(q.respuesta_correcta || 'b').trim().toLowerCase().charAt(0) || 'b',
  }
}

function moduleTitles(data: Record<string, unknown>): string[] {
  const mods = Array.isArray(data.modulos) ? data.modulos : []
  const titles = mods
    .map((m) => {
      if (!m || typeof m !== 'object') return ''
      return String((m as Record<string, unknown>).titulo || '').trim()
    })
    .filter(Boolean)
  if (titles.length) return titles
  const mi = Array.isArray(data.manual_instructor) ? data.manual_instructor : []
  return mi
    .flatMap((parte) => {
      if (!parte || typeof parte !== 'object') return []
      const temas = (parte as Record<string, unknown>).temas
      return Array.isArray(temas) ? temas.map((t) => String(t || '').trim()) : []
    })
    .filter(Boolean)
}

function buildPadReactivo(tema: string, index: number): Reactivo {
  const t = tema || `el tema ${index + 1} del curso`
  const variants: Reactivo[] = [
    {
      pregunta: `¿Cuál es la aplicación correcta de «${t}» en el entorno laboral?`,
      opcion_a: 'Omitir el procedimiento y actuar por intuición',
      opcion_b: 'Aplicar el criterio técnico y documentar la evidencia',
      opcion_c: 'Delegar sin verificar el resultado',
      opcion_d: 'Posponer la acción sin justificar',
      respuesta_correcta: 'b',
    },
    {
      pregunta: `¿Qué debe verificar el participante al trabajar con «${t}»?`,
      opcion_a: 'Solo el costo de la actividad',
      opcion_b: 'La opinión informal del equipo',
      opcion_c: 'Los requisitos, riesgos y pasos del procedimiento',
      opcion_d: 'Únicamente el tiempo disponible',
      respuesta_correcta: 'c',
    },
    {
      pregunta: `¿Cuál es un error frecuente al aplicar «${t}»?`,
      opcion_a: 'Seguir el procedimiento paso a paso',
      opcion_b: 'Registrar evidencias de la actividad',
      opcion_c: 'Consultar la norma o política aplicable',
      opcion_d: 'Saltar controles críticos por ahorrar tiempo',
      respuesta_correcta: 'd',
    },
    {
      pregunta: `¿Para qué sirve dominar «${t}» en este curso?`,
      opcion_a: 'Mejorar la toma de decisiones con base técnica',
      opcion_b: 'Evitar cualquier registro documental',
      opcion_c: 'Eliminar la comunicación con el equipo',
      opcion_d: 'Ignorar los indicadores de calidad',
      respuesta_correcta: 'a',
    },
  ]
  return variants[index % variants.length]
}

function padSumativaToTen(data: Record<string, unknown>, existing: Reactivo[]): Reactivo[] {
  const out = existing.slice(0, 10)
  if (out.length >= 10) return out

  const seen = new Set(out.map((q) => q.pregunta.toLowerCase()))
  const titles = moduleTitles(data)
  const seeds = titles.length
    ? titles
    : [
        'el contenido del curso',
        'los procedimientos del temario',
        'los criterios de evaluación',
        'las buenas prácticas del oficio',
        'la normatividad aplicable',
      ]

  let i = 0
  while (out.length < 10 && i < 40) {
    const tema = seeds[i % seeds.length]
    const candidate = buildPadReactivo(tema, i)
    const key = candidate.pregunta.toLowerCase()
    i += 1
    if (seen.has(key)) continue
    seen.add(key)
    out.push(candidate)
  }

  while (out.length < 10) {
    const n = out.length + 1
    out.push({
      pregunta: `¿Cuál es el criterio correcto para el reactivo sumativo ${n} del curso?`,
      opcion_a: 'Actuar sin procedimiento',
      opcion_b: 'Aplicar el aprendizaje del temario con evidencia',
      opcion_c: 'Omitir la verificación final',
      opcion_d: 'Ignorar las instrucciones del instructor',
      respuesta_correcta: 'b',
    })
  }

  return out.slice(0, 10)
}

export function enforceEvaluationQuestionLimits(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload
  const data = payload as Record<string, unknown>

  const diagnostica = (Array.isArray(data.evaluacion_diagnostica) ? data.evaluacion_diagnostica : [])
    .map(asReactivo)
    .filter((q): q is Reactivo => !!q)
  const sumativa = (Array.isArray(data.evaluacion_sumativa) ? data.evaluacion_sumativa : [])
    .map(asReactivo)
    .filter((q): q is Reactivo => !!q)
  const formativa = Array.isArray(data.evaluacion_formativa) ? data.evaluacion_formativa : []

  data.evaluacion_diagnostica = diagnostica.slice(0, 5)
  // Siempre exactamente 10 en sumativa (completa si la IA o un payload viejo trae menos)
  data.evaluacion_sumativa = padSumativaToTen(data, sumativa)

  let remaining = 5
  const formativaOut: Array<Record<string, unknown>> = []
  for (const mod of formativa) {
    if (!mod || typeof mod !== 'object') continue
    const m = mod as Record<string, unknown>
    const criterios = Array.isArray(m.criterios) ? m.criterios : []
    const take = criterios.slice(0, Math.max(0, remaining))
    remaining -= take.length
    if (take.length > 0) formativaOut.push({ ...m, criterios: take })
    if (remaining <= 0) break
  }
  data.evaluacion_formativa = formativaOut

  return data
}
