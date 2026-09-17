import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/ai/openai-client'
import { getCourseById, getModules, getKnowledgeItems, upsertCourseFormat } from '@/lib/db/queries'
import { mergeKnowledgeIntoFuentes } from '@/lib/formats/merge-knowledge-fuentes'
import { finalizeFormatPayload } from '@/lib/formats/finalize-format-payload'
import { enforceEvaluationQuestionLimits } from '@/lib/formats/enforce-evaluation-limits'

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanRedundantText(input: string): string {
  let text = input.replace(/\s+/g, ' ').trim()

  // Quita repeticiones consecutivas de la misma palabra
  text = text.replace(/\b([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\b(\s+\1\b)+/gi, '$1')

  // Corrige redundancias frecuentes detectadas en temas/subtemas
  const replacements: Array<[RegExp, string]> = [
    [/\badoptar\s+adopci[oó]n\s+de\b/gi, 'adoptar '],
    [/\badoptar\s+adopci[oó]n\b/gi, 'adoptar'],
    [/\breconocer\s+reconocimiento\s+de\b/gi, 'reconocer '],
    [/\breconocer\s+reconocimiento\b/gi, 'reconocer'],
    [/\bapreciar\s+reconocimiento\s+de\s+la\s+importancia\s+de\b/gi, 'apreciar la importancia de'],
    [/\bapreciar\s+reconocimiento\s+de\b/gi, 'apreciar '],
    [/\bimportancia\s+de\s+la\s+importancia\s+de\b/gi, 'importancia de'],
  ]

  for (let i = 0; i < 3; i++) {
    const before = text
    for (const [pattern, replacement] of replacements) {
      text = text.replace(pattern, replacement)
    }
    text = text.replace(/\s{2,}/g, ' ').trim()
    if (text === before) break
  }

  return text
}

function sanitizeGeneratedData(node: unknown): unknown {
  if (typeof node === 'string') return cleanRedundantText(node)

  if (Array.isArray(node)) {
    if (node.every(item => typeof item === 'string')) {
      const seen = new Set<string>()
      const cleanedList: string[] = []
      for (const raw of node as string[]) {
        const cleaned = cleanRedundantText(raw)
        const key = normalizeKey(cleaned)
        if (!cleaned || seen.has(key)) continue
        seen.add(key)
        cleanedList.push(cleaned)
      }
      return cleanedList
    }
    return node.map(item => sanitizeGeneratedData(item))
  }

  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      out[key] = sanitizeGeneratedData(value)
    }
    return out
  }

  return node
}

export async function POST(request: NextRequest) {
  let openai
  try {
    openai = getOpenAIClient()
  } catch {
    return NextResponse.json(
      { error: 'Servicio de IA no configurado. Añade OPENAI_API_KEY en icursa/.env.local.' },
      { status: 503 }
    )
  }

  const { courseId } = await request.json()
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

  const curso = await getCourseById(courseId)
  if (!curso) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const modulos = await getModules(courseId)
  let knowledgeItems: Awaited<ReturnType<typeof getKnowledgeItems>> = []
  try {
    knowledgeItems = await getKnowledgeItems(courseId)
  } catch {
    knowledgeItems = []
  }
  const knowledgeSourcesPrompt =
    knowledgeItems.length > 0
      ? `
FUENTES DE LA BASE DE CONOCIMIENTO DEL CURSO (OBLIGATORIO usarlas en fuentes_informacion):
${knowledgeItems
  .slice(0, 12)
  .map((k, i) => {
    const meta = (k.metadata || {}) as Record<string, unknown>
    const author = typeof meta.author === 'string' ? meta.author : ''
    const year = meta.year != null ? String(meta.year) : ''
    return `- [${i + 1}] título/nombre: "${k.name}"${author ? `; autor/institución: ${author}` : ''}${year ? `; año: ${year}` : ''}${k.url ? `; URL: ${k.url}` : ''}; tipo: ${k.type}`
  })
  .join('\n')}

REGLAS DE FUENTES (OBLIGATORIO):
- Genera entre 5 y 8 fuentes profesionales (normas, leyes, guías oficiales, convenios OIT, bibliografía verificable).
- PROHIBIDO usar nombres de archivo como título (ej. "En NOM035.docx", ".pdf", ".pptx").
- Si la base de conocimiento trae un archivo, CONVIÉRTELO a la cita real de la obra/norma (título oficial, autor/institución, editorial, URL pública).
- Combina: (1) referencias derivadas de la base de conocimiento y (2) 2 a 4 fuentes adicionales de investigación (gob.mx, DOF, STPS, CONOCER, OIT/ILO, diputados.gob.mx) alineadas al tema del curso.
- En url_o_referencia usa URLs reales oficiales (no inventes amazon.com ni marketplaces).
- Si faltan datos (editorial, país), completa solo lo razonable; no sustituyas la URL por Amazon.
`
      : `
FUENTES: No hay ítems en la base de conocimiento de este curso.
- Genera entre 5 y 8 referencias oficiales/técnicas verificables (gob.mx, DOF, CONOCER, STPS, OIT, normas).
- PROHIBIDO nombres de archivo (.docx/.pdf) como título_obra.
- PROHIBIDO amazon.com, marketplaces o URLs de compra como fuente principal.
`
  let modulesPrompt = "Genera de 5 a 10 módulos coherentes y lógicos para el diplomado/curso."
  const courseContext = `${curso.name} ${curso.norm_reference ?? ''}`.toUpperCase()
  const isNom029Course = courseContext.includes('NOM-029')
  const isNom027Course = courseContext.includes('NOM-027')
  const normSpecificPrompt = isNom029Course
    ? `
INSTRUCCIONES ESPECIALES PARA ESTE CURSO:
- Este curso está alineado con la NOM-029-STPS-2011. El desarrollo NO debe resumir los temas en frases genéricas.
- Si el usuario ya registró módulos, cada título debe respetarse de forma literal y usarse como eje del desarrollo temático. No los renombres, no los combines y no los sustituyas por temas introductorios genéricos.
- Para títulos normativos como "Campo de aplicación", "Referencias", "Definiciones", "Obligaciones del patrón", "Obligaciones de los trabajadores", "Plan de trabajo y determinación de riesgos potenciales", "Procedimientos de seguridad...", "Medidas de seguridad...", "Plan de atención a emergencias", "Capacitación", "Unidades de verificación", "Procedimiento para la evaluación de la conformidad", "Vigilancia" o "Concordancia con normas internacionales", desarrolla el contenido con profundidad práctica:
  1. alcance o propósito del tema dentro de la NOM;
  2. obligaciones, criterios o elementos que deben verificarse;
  3. ejemplos de aplicación en mantenimiento eléctrico;
  4. evidencia documental, controles o acciones preventivas asociadas.
- En la secuencia_didactica de cada módulo, desglosa el tema en subbloques útiles y concretos. Evita bloques vacíos o demasiado abstractos como "Introducción" o "Generalidades" salvo que el propio título del módulo lo requiera.
- En las actividades, menciona ejemplos de campo, análisis de riesgos, medidas preventivas, procedimientos, evidencias, formatos o decisiones operativas aplicables al mantenimiento de instalaciones eléctricas.
- En evaluacion_formativa (criterios por módulo): cada criterio debe describir una conducta observable en aula o taller (p. ej. verificación de ausencia de tensión, orden de bloqueo-etiquetado, selección de EPP o herramientas dieléctricas, identificación de riesgo según numeral de la NOM-029, registro de hallazgo). Evita como criterio principal: opiniones sobre "beneficios" de cumplir la norma, "evaluar efectividad" sin lista de verificación concreta, "actitud proactiva", "participar en discusiones" o "proponer mejoras al entorno" sin anclaje a procedimiento o apartado de la NOM-029.
`
    : ''
  const nom029CanonicalTopics = [
    'Campo de aplicación',
    'Referencias',
    'Definiciones',
    'Obligaciones del patrón',
    'Obligaciones de los trabajadores',
    'Plan de trabajo y determinación de riesgos potenciales',
    'Procedimientos de seguridad para realizar actividades de mantenimiento de las instalaciones eléctricas',
    'Medidas de seguridad generales para realizar trabajos de mantenimiento de las instalaciones eléctricas',
    'Condiciones de seguridad en el mantenimiento de las instalaciones eléctricas',
    'Medidas de seguridad para realizar trabajos de mantenimiento de las instalaciones eléctricas aéreas y subterráneas',
    'Medidas de seguridad para realizar trabajos de mantenimiento de las instalaciones eléctricas energizadas',
    'Plan de atención a emergencias',
    'Capacitación',
    'Unidades de verificación',
    'Procedimiento para la evaluación de la conformidad',
    'Vigilancia',
    'Concordancia con normas internacionales',
  ]
  const nom027SafetyTopics = [
    'Identificación de riesgos en trabajos de soldadura y corte',
    'Medidas preventivas contra incendios y explosiones',
    'Condiciones seguras del área de trabajo',
    'Control de materiales inflamables y combustibles',
    'Ventilación y extracción de humos metálicos',
    'Uso correcto del equipo de protección personal (EPP)',
    'Seguridad eléctrica y sistemas de puesta a tierra',
    'Inspección de máquinas, cables y conexiones',
    'Manejo seguro de cilindros y gases comprimidos',
    'Procedimientos para trabajos en espacios confinados',
    'Señalización y delimitación de áreas peligrosas',
    'Permisos para trabajos en caliente',
    'Atención a emergencias y uso de extintores',
    'Capacitación y responsabilidades del trabajador',
  ]

  // Para NOM-029, priorizamos estructura temática alineada a la norma.
  if (isNom029Course) {
    modulesPrompt = `Este curso es NOM-029-STPS-2011 y su nombre correcto de referencia es "Condiciones de Seguridad para el Mantenimiento de Instalaciones Eléctricas (NOM-029-STPS-2011)".
Genera EXACTAMENTE 4 módulos con estos títulos literales:
- Tema 1: Introducción a las Normativas de Seguridad Eléctrica
- Tema 2: Identificación de Riesgos y Medidas Preventivas
- Tema 3: Medidas de prevención en Mantenimiento Eléctrico
- Tema 4: Compromiso con la Seguridad Eléctrica

REQUISITO OBLIGATORIO EN DESARROLLO:
- Cada tema debe desglosarse en subtemas concretos dentro de la secuencia_didactica (nombre_bloque y actividades).
- No uses solo títulos generales sin subtema.
- Incluye explícitamente en los bloques, como mínimo, los siguientes subtemas:
  - Tema 1: normativas de seguridad eléctrica, actualización de normativas.
  - Tema 2: identificación de riesgos eléctricos, medidas preventivas en instalaciones.
  - Tema 3: uso de equipos de protección personal, prácticas seguras de desconexión, manejo de herramientas de seguridad, simulación de mantenimiento seguro.
  - Tema 4: compromiso con la seguridad, responsabilidad en el entorno laboral, actitud proactiva hacia el cumplimiento normativo, importancia de la seguridad eléctrica.

PROHIBIDO:
- Mencionar NOM-001-SEDE-2012 en este curso.
- Sustituir o renombrar la nomenclatura NOM-029-STPS-2011.
`
  } else if (isNom027Course) {
    const nom027Coverage = nom027SafetyTopics.map(topic => `- ${topic}`).join('\n')
    if (modulos && modulos.length > 0) {
      modulesPrompt = `¡ATENCIÓN! El usuario ya registró módulos. Debes conservar exactamente estos títulos y el mismo número de módulos:\n${modulos.map(m => `- ${m.title}`).join('\n')}

Este curso está alineado a NOM-027-STPS-2008 y es OBLIGATORIO distribuir con profundidad, sin omisiones, los siguientes temas de seguridad:\n${nom027Coverage}

REGLAS OBLIGATORIAS:
- NO repitas ideas entre bloques o módulos (evita redundancia semántica).
- Cada subtema se debe desarrollar una sola vez con enfoque práctico y evidencia verificable.
- Si un concepto aparece en más de un módulo, cambia el enfoque para que no duplique contenido (ej. prevención, operación, verificación, respuesta a emergencia).
- En secuencia_didactica, usa nombre_bloque específicos (no genéricos como "Generalidades" o "Introducción" repetida).`
    } else {
      modulesPrompt = `Este curso está alineado a NOM-027-STPS-2008.
Genera de 5 a 8 módulos técnicos, coherentes y sin redundancia temática.

Debes cubrir obligatoriamente estos temas específicos de seguridad:\n${nom027Coverage}

Reglas:
- Cada tema debe aparecer al menos una vez en el desarrollo del curso.
- Evita duplicidad entre temas/subtemas; no parafrasees el mismo contenido en dos módulos.
- Los nombres de bloque de la secuencia_didactica deben ser concretos, accionables y distintos entre sí.`
    }
  } else if (modulos && modulos.length > 0) {
    modulesPrompt = `¡ATENCIÓN! El usuario ya ha dado de alta los siguientes módulos en catálogo. DEBES generar el mismo número de módulos y usar ESTOS nombres exactos como títulos: \n${modulos.map(m => `- ${m.title}`).join('\n')}. Agrega sus actividades, duración, y desglose correspondientemente. Cada módulo debe sentirse amplio, específico y fiel al título dado por el usuario, sin resumirlo en una sola explicación corta.`
  }

  const duracionReal = (curso.total_hours && curso.total_hours > 1.5) ? curso.total_hours : 2;
  const totalMinutosCurso = Math.round(Number(duracionReal) * 60);

  const prompt = `
Eres un Diseñador Instruccional experto en estándares de competencia laboral EC0301 y EC0217.01 de CONOCER.
Diseña el desglose completo del contenido del curso titulado: "${curso.name}" que tiene una duración total oficial de ${duracionReal} horas (${totalMinutosCurso} MINUTOS en metadatos_tiempos.duracion_curso_total_minutos).

ECUACIÓN DE TIEMPOS (minutos enteros):
- El encuadre dura EXACTAMENTE 25 minutos fijos (metadatos_tiempos.tiempo_encuadre_minutos = 25).
- El cierre dura EXACTAMENTE 25 minutos fijos (metadatos_tiempos.tiempo_cierre_minutos = 25).
- Por lo tanto, la SUMA EXACTA de 'duracion_total_minutos' de todos los módulos DEBE SER EXACTAMENTE ${totalMinutosCurso - 50} MINUTOS.

La comprobación previa de recursos (30 min) va en metadatos_tiempos.comprobacion_previa_minutos y NO entra en el total oficial del curso.

Los contenidos deben permitir comprobar congruencia entre carta descriptiva, sesiones y evaluación (criterio de verificabilidad en aula), alineado a la lógica de EC0301 y a la práctica de EC0217.01.
${normSpecificPrompt}
${isNom029Course ? '\nRegla crítica de nomenclatura: usa exclusivamente "NOM-029-STPS-2011" y nunca "NOM-001-SEDE-2012".\n' : ''}
${isNom027Course ? `\nRegla crítica NOM-027: usa "NOM-027-STPS-2008" como referencia normativa principal para corte y soldadura, con foco en prevención de riesgos, incendios, atmósferas peligrosas, EPP, ventilación, permisos de trabajo en caliente y respuesta a emergencias.\n` : ''}

INSTRUCCIONES ESTRUCTURALES:
0. nombre_disenador: Nombre del diseñador instruccional responsable del diseño del curso (persona o puesto); puede coincidir con el instructor si aplica.
0b. perfil_participante: Describe en tres campos al grupo objetivo del curso "${curso.name}":
   - psicograficas: características del público (adultos, contexto laboral, motivación).
   - conocimientos: requisitos previos de conocimiento.
   - habilidades: habilidades básicas necesarias (lectura, uso de equipo, etc.).
1. Objetivo General (formato EC0301 — desglose obligatorio, NO un solo párrafo sin estructura): Devuelve objeto con tres campos que respondan a la carta descriptiva tipo CONOCER:
   - sujeto: Usa estrictamente la frase "El participante" o "adultos, generalmente empleados en la industria". NUNCA pongas rangos de edades o años específicos. Solo deja 'adultos'.
   - accion: Acción o comportamiento en futuro. OBLIGATORIO: DEBE iniciar exactamente con la frase "Al finalizar el curso, ". Qué demostrará al finalizar (conocimiento, desempeño o producto) integrando de forma natural los ámbitos cognitivo, psicomotor y/o afectivo que correspondan al curso.
   - condicion: Condición de operación en una o más oraciones: bajo qué marco normativo, método, datos o escenario se verifica el desempeño (específico al tema del curso).
2. Objetivos Particulares (EC0301 + verificabilidad EC0217.01): Genera exactamente 3 objetivos, uno por dominio: Cognitivo, Psicomotor y Afectivo. Cada uno se desglosa en "sujeto", "accion", "condicion" y "temas". La redacción debe ser tan detallada como en una carta descriptiva impresa: cada "accion" y cada "condicion" deben ser al menos una oración completa y sustantiva (no una sola línea escueta).

   REGLAS OBLIGATORIAS PARA OBJETIVOS PARTICULARES:
   - sujeto: Debe ser exactamente "El participante" (singular). No uses "los participantes", "el alumno" ni sinónimos.
   - accion: OBLIGATORIO: DEBE iniciar exactamente con la frase "Al finalizar el curso, ". Una o más oraciones en futuro de indicativo, tercera persona singular, que describan conducta OBSERVABLE y evaluable. Incluye alcance del desempeño. Está PROHIBIDO usar como verbo principal o único: "conocer", "saber", "entender", "aprender", "comprender".
   - Dominio cognitivo: verbos alineados a taxonomía de Bloom en nivel apropiado al curso (recordar/comprender/aplicar/analizar/evaluar/crear → en futuro: recordará, explicará, aplicará, analizará, evaluará, diseñará…).
   - Dominio psicomotor: verbos de ejecución, manipulación o desempeño observable (instalará, montará, simulará, calibrará, completará el formato…); cuando aplique, menciona herramienta, equipo o formato de trabajo en la acción o en la condición.
   - Dominio afectivo: verbos de actitud, valoración o compromiso observables (valorará, asumirá, manifestará disposición, adoptará criterios éticos…), no solo opiniones vagas.
   - condicion: Una o más oraciones que describan la condición de operación: con base en qué norma, documento, datos, escenario de aula o supuesto práctico se demuestra el logro. Debe ser específica al curso "${curso.name}". Evita frases vacías de una sola línea.
   - temas: Exactamente 4 ítems por dominio (salvo imposibilidad temática). Cada ítem es una frase breve con verbo observable en INFINITIVO o en futuro (ej. "Explicar los principios…" / "Explicará los principios…"). PROHIBIDO prefijar con la letra "A", "A.", "A)" ni "B)". PROHIBIDO duplicar el mismo aprendizaje. En la carta se presentarán como lista con viñetas. En cada dominio, NO repitas el mismo verbo al inicio de las cuatro viñetas: alterna verbos observables de la misma familia de Bloom (cognitivo: p. ej. reconocer, describir, distinguir, relacionar; psicomotor: ejecutar, demostrar, practicar, simular; afectivo: apreciar, asumir, adoptar, reconocer la importancia de).
   - Los tres objetivos particulares deben ser coherentes entre sí y derivar del objetivo general.

   EJEMPLO DE PATRÓN (curso ficticio; NO copies el tema ni el texto — solo la forma): Si el curso fuera de un tema técnico X, un cognitivo válido tendría accion de varias líneas (explicará y contrastará…), condicion con referencia concreta a normativa o casos; el psicomotor describiría la práctica observable; el afectivo, la valoración en contexto laboral.

3. Módulos / Desarrollo (EC0217.01 — técnicas instruccionales): ${modulesPrompt}
   - OBLIGATORIO ANTI-REDUNDANCIA: No repitas literalmente ni semánticamente el mismo tema o subtema entre módulos o bloques. Antes de finalizar, verifica que cada nombre_bloque, actividad clave y criterio formativo aporte información nueva.
   - Si el curso corresponde a NOM-027, garantiza cobertura explícita de estos temas: ${nom027SafetyTopics.join('; ')}.

   REGLAS DE TIEMPO (OBLIGATORIAS):
   - Expresa la duración de CADA bloque didáctico SOLO en MINUTOS ENTEROS (entero en duracion_minutos). NUNCA uses decimales tipo 0.5 horas para media hora; usa 30 minutos.
   - La suma de duracion_total_minutos de todos los módulos DEBE igualar exactamente a ${totalMinutosCurso - 50} minutos (que es la diferencia de restar encuadre y cierre fijos).
   - metadatos_tiempos.comprobacion_previa_minutos es siempre 30 y es EXCLUYENTE del total oficial del curso.
   - Cada módulo debe incluir secuencia_didactica: lista ORDENADA de bloques; cada bloque con tecnica_instruccional explícita.
   - Evalúa según la naturaleza del tema qué técnicas grupales/instruccionales aplicar (Expositiva, Demostrativa, Diálogo-Discusión, Energizante). NO es obligatorio usar todas en cada tema. Usa la técnica demostrativa / práctica y el diálogo-discusión SOLO si aplican a los objetivos y naturaleza del tema desarrollado.
   - OBLIGATORIO - SERVICIO DE CAFÉ (carta descriptiva / control de tiempos): Incluye UN bloque de pausa llamado "Receso - SERVICIO DE CAFÉ" con duracion_minutos de 3 minutos entre temas en la secuencia_didáctica de la carta. Es pausa de recuperación, NO un tema de aprendizaje: PROHIBIDO listarlo en el Temario del Manual del Participante, en COMPONENTES DEL TEMARIO ni como aprendizaje esperado.
   - OBLIGATORIO - MATERIAL DE APOYO: En todos los bloques de la secuencia_didáctica, el valor para "materiales_apoyo" debe ser estrictamente "Presentación PowerPoint, Laptop, Pantalla / TV", a menos que una técnica requiera obligatoriamente un formato o herramienta física extra (ej. para evaluación o práctica).
   - OBLIGATORIO - ACTIVIDADES: El texto de "actividades" debe ser EXTREMADAMENTE DETALLADO y estar ESTRICTAMENTE ACOMODADO y ENLISTADO usando saltos de línea explícitos (\n). Guíate ESTRICTAMENTE por este formato de ejemplo, preservando el orden y los saltos de línea para que la tabla sea legible:
     1. Aplicar técnica expositiva (o la que corresponda):
     a) Presentar objetivo de la actividad:
          [Comprender el objetivo específico].
     b) Recuperar experiencia previa:
          [¿Pregunta literal para el grupo?]
     c) Desarrollar contenido:
          [Explicación detallada de los temas y subtemas].
     d) Resolver dudas:
          [Aclarar conceptos confusos].
     e) Síntesis/Preguntas dirigidas:
          [¿Cómo aplicarías esta normativa en tu trabajo?]
   - OBLIGATORIO - AMPLITUD DEL DESARROLLO: Cada módulo debe tener suficiente desarrollo real para verse robusto en la tabla de DESARROLLO. Genera normalmente entre 2 y 4 bloques por módulo, y en cada bloque la sección "c) Desarrollar contenido" debe describir subtemas, criterios, ejemplos, controles y aplicaciones concretas; evita frases de relleno como "explicación general del tema" o "revisión básica".
   - OBLIGATORIO - CURSOS NORMATIVOS: Cuando el título del módulo haga referencia a obligaciones, procedimientos, medidas, condiciones, planes, evaluación, vigilancia o concordancia normativa, el bloque debe traducir ese título a acciones formativas concretas: qué revisar, qué aplicar, qué errores evitar, qué evidencia conservar y cómo se implementa en el trabajo real.
   - duracion_total_minutos de cada módulo = suma exacta de los duracion_minutos de sus bloques.

4. Preguntas Rompehielo y Activación: Genera 3 preguntas específicas vinculadas EXCLUSIVAMENTE a la industria y contexto puntual de la temática del curso (e.g Si es Alturas, pregunta si han usado arnés, no sobre RH).
5. Beneficios del Curso: Genera un párrafo atractivo explicando los beneficios del curso y su relación con la experiencia laboral y personal del participante. Este texto se usará en el encuadre.
6. Manual del Participante: Redacta un manual estructurado EXACTAMENTE con los siguientes 12 títulos de sección (cada uno en el campo "titulo" y su desarrollo en "contenido"):
   - "Introducción" (Párrafos de bienvenida al curso, explicando qué es el tema, por qué es importante conocerlo, y cómo el curso servirá como herramienta clave. Usa el tema "${curso.name}").
   - "Objetivos del Curso" (Incluye un Objetivo General y Objetivos Específicos/Particulares, redactados formalmente y dirigidos a "El Participante").
   - "Temario del Curso" (Lista numerada de Temas 1, 2, 3… con viñetas ● y subtemas con "o"; debe reflejar exactamente modulos[].titulo y nombre_bloque de secuencia_didactica. PROHIBIDO incluir "Receso", "SERVICIO DE CAFÉ" o pausas. PROHIBIDO duplicar el mismo subtema. NO uses la palabra "módulo").
   - "¿Qué Aprenderás en Este Curso?" (Lista HTML <ul><li>…</li></ul> de aprendizajes. Cada <li> inicia DIRECTAMENTE con un verbo observable en futuro o infinitivo, sin ninguna letra previa. PROHIBIDO: "A explicará…", "A. Identificar…", "A) Aplicar…", "• •". Ejemplo CORRECTO: "<ul><li>Explicará los principios del servicio al cliente.</li><li>Aplicará técnicas de escucha activa.</li></ul>". Ejemplo INCORRECTO: "<ul><li>A explicará los principios…</li></ul>").
   - "Metodología" (Cómo se abordará la teoría y la práctica en el curso, combinando ejercicios, discusión, etc.).
   - "Importancia de Conocer [Tema del curso]" (Relevancia técnica, legal o laboral del tema abordado).
   - "Beneficios de conocer [Tema del curso]" (Beneficios directos, control sobre derechos o mejoras profesionales para el participante).
   - "Conceptos Clave que Aprenderás" (Glosario en viñetas <ul><li><strong>Término:</strong> definición breve</li></ul>. PROHIBIDO repetir la lista de "¿Qué Aprenderás?" ni prefijos "A ". Cada ítem es Término + definición, no un objetivo conjugado).
   - "COMPONENTES DEL TEMARIO" o equivalente (desglose por tema: "Tema 1:", "Tema 2:", … con viñetas de subtemas; sin recesos/café; sin duplicar subtemas; sin la palabra "módulo").
   - "Ejercicio Práctico: [Aplicación/Cálculo del Tema]" (Instrucciones detalladas paso a paso para una práctica, simulación o cálculo, con componentes o fórmulas).
   - "Aplicación de [Tema del curso] en la Vida Laboral" (Casos de uso reales, impacto en el día a día, trámites o toma de decisiones).
   - "Conclusión" (Cierre y reflexión sobre cómo las herramientas brindadas protegerán, mejorarán o impactarán el futuro del participante).
   Asegúrate de que el contenido de cada sección sea MUY EXTENSO (como un manual impreso de participante: varias páginas en conjunto), literal y coherente con la carta descriptiva y el tema "${curso.name}". Cada sección (salvo el temario, que sigue el formato de lista 1./●/o) debe incluir introducción al bloque, desarrollo en varios párrafos, listados donde tenga sentido y un cierre breve. IMPORTANTE: Para "contenido", usa etiquetas HTML (<p>, <ul>, <li>, <strong>, <br>) cuando ayuden a la maquetación; también puedes usar muchas entradas de texto plano en el array si cada una es un párrafo largo. No uses listas vacías ni secciones de menos de 400 caracteres en total por sección. Reemplaza "[Tema del curso]" con el tema real del diplomado. Deja siempre un espacio antes de comillas angulares: escriba "curso «Título»", nunca "curso«Título»". PROHIBIDO repetir el mismo tema/subtema en Temario y en COMPONENTES; PROHIBIDO incluir "Receso - SERVICIO DE CAFÉ" fuera de la carta descriptiva (solo control de tiempos).
7. Manual del Instructor (OBLIGATORIO, estilo EC0217.01 / Manual del Instructor oficial tipo "Salario Diario Integrado"):
   - Genera UNA entrada por cada módulo principal del curso (típicamente 3 a 5). "titulo" EXACTO: "Parte 1", "Parte 2", "Parte 3", etc. (sin subtítulos largos).
   - "temas": 2 a 5 viñetas concretas del módulo, con verbos de aprendizaje (Conocer, Identificar, Aplicar, Calcular, Reflexionar…). PROHIBIDO genéricos vacíos como "Introducción al tema".
   - "sugerencias": 3 a 5 frases instructivas completas. DEBE incluir siempre: (1) Revisar el Manual del Participante…; (2) Usar la presentación Canva/PowerPoint del curso; (3) Apoyarse en ejemplos prácticos; (4) Revisar bibliografía/fuentes. Redacción tipo instructivo para el facilitador.
   - "tecnicas": 2 frases narrativas completas (NO solo el nombre de la técnica). Ejemplos correctos: "La técnica instruccional será expositiva." / "El instructor explicará los temas de forma clara y entendible, apoyándose con ejemplos reales." / "La técnica instruccional será diálogo-discusión."
   - "evaluacion": 2 a 3 viñetas que SIEMPRE indiquen: forma (diagnóstica / formativa / sumativa), "Tiempo para contestarla: X minutos máximo." y "Valor: X%". Regla: Parte 1 → diagnóstica Valor 0%; partes intermedias → formativa Valor 60%; última parte → sumativa Valor 40% (o la ponderación del curso si está definida).
   - "preguntas_refuerzo": 3 a 5 preguntas dirigidas concretas del tema, con signos ¿?, útiles para el instructor en aula.
   - PROHIBIDO: encoding roto (Ã, �), placeholders, texto en inglés genérico, o listas de una sola palabra.
8. Evaluaciones Diagnóstica, Formativa y Sumativa (OBLIGATORIO):
   - Diagnóstica: EXACTAMENTE 5 preguntas de opción múltiple (a, b, c, d), claras y directas. Nunca más de 5.
   - Sumativa: EXACTAMENTE 10 preguntas de opción múltiple (a, b, c, d). OBLIGATORIO: el arreglo evaluacion_sumativa debe tener length = 10 (ni 5 ni 8). Potentes, claras y orientadas a medir el conocimiento más importante de cada tema. Nunca más ni menos de 10.
   - Nivel de redacción para ambas: comprensible para personas con estudios de educación secundaria en adelante (lenguaje técnico básico, sin ambigüedad y sin tecnicismos innecesarios).
   - Las preguntas deben ser REALISTAS, TÉCNICAS y directamente alineadas al temario real del curso; evita reactivos genéricos, ambiguos o con doble interpretación.
   - Cada reactivo debe evaluar un concepto, procedimiento o criterio del curso y no incluir distractores absurdos o fuera de contexto.
   - Formativa (guía de observación / lista de cotejo): MÁXIMO 5 criterios observables EN TOTAL para todo el instrumento (reparte 1 criterio por módulo prioritario si hay varios módulos; no generes más de 5 criterios sumados).
   - En criterios formativos usa verbos observables: identifica, calcula, clasifica, aplica, documenta, argumenta, verifica, corrige, etc.
   - PROHIBIDO como núcleo del criterio formativo: "describe los beneficios de cumplir…", "evalúa la efectividad de las medidas" sin pasos observables, "manifiesta actitud…", "participa en discusiones…", "propone mejoras al entorno laboral" sin evidencia normativa o de checklist. Sustituye siempre por verificaciones alineadas al temario (procedimiento, riesgo, medida de la norma, EPP, orden de trabajo, evidencia escrita).
   - En todas las preguntas con signos españoles escribe ¿Qué…? y ¡Hola…! SIN espacio entre el signo y la letra.
9. Fuentes de Información:
${knowledgeSourcesPrompt}
   Cada fuente debe incluir siempre todos los campos del objeto: titulo_obra, autor_institucion, url_o_referencia, ano_publicacion (año como texto, ej. "2024"), ultima_reforma_consultada (año o "No aplica"), editorial (institución o editorial; si es norma en línea puede repetirse la institución), pais_origen (ej. "México").
   IMPORTANTE: fuentes_informacion debe tener MÍNIMO 5 y MÁXIMO 8 entradas. Nunca dejes una sola fuente. Nunca uses un nombre de archivo (.docx/.pdf) como titulo_obra.
10. Recursos de Continuidad: Sugiere de 3 a 5 recursos adicionales dinámicos (sitios web oficiales, manuales externos, dependencias de gobierno o certificaciones) relevantes a la temática del curso para el cierre. Preferir URLs de la base de conocimiento si existen.
Genera una respuesta en formato JSON de forma estricta.
`

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      preguntas_rompehielo: {
        type: "array",
        items: { type: "string" },
        description: "3 preguntas diseñadas para enganchar a los participantes, estrictamente del tema del curso."
      },
      beneficios_curso: {
        type: "string",
        description: "Párrafo atractivo explicando los beneficios del curso y su relación con la experiencia laboral y personal."
      },
      nombre_disenador: { type: "string", description: "Nombre del diseñador instruccional del curso." },
      perfil_participante: {
        type: "object",
        additionalProperties: false,
        properties: {
          psicograficas: { type: "string", description: "Perfil psicográfico del participante objetivo." },
          conocimientos: { type: "string", description: "Conocimientos previos requeridos." },
          habilidades: { type: "string", description: "Habilidades básicas requeridas." }
        },
        required: ["psicograficas", "conocimientos", "habilidades"]
      },
      objetivo_general: {
        type: "object",
        additionalProperties: false,
        properties: {
          sujeto: { type: "string", description: "Sujeto del objetivo; típicamente El participante." },
          accion: { type: "string", description: "Debe iniciar con 'Al finalizar el curso, '. Acción o comportamiento observable en futuro." },
          condicion: { type: "string", description: "Condición de operación verificable." }
        },
        required: ["sujeto", "accion", "condicion"]
      },
      objetivos_particulares: {
        type: "object",
        additionalProperties: false,
        properties: {
          cognitivo: { 
            type: "object",
            additionalProperties: false,
            properties: {
              sujeto: { type: "string", description: "Debe ser exactamente: El participante" },
              accion: { type: "string", description: "Debe iniciar con 'Al finalizar el curso, '. Una o más oraciones completas, futuro, conducta observable." },
              condicion: { type: "string", description: "Una o más oraciones: condición de operación verificable y específica al curso." },
              temas: { type: "array", items: { type: "string" }, description: "4 a 6 subtemas concretos alineados al temario." }
            },
            required: ["sujeto", "accion", "condicion", "temas"]
          },
          psicomotor: {
            type: "object",
            additionalProperties: false, 
            properties: {
              sujeto: { type: "string", description: "Debe ser exactamente: El participante" },
              accion: { type: "string", description: "Una o más oraciones: ejecución/manipulación observable; incluir procedimiento o herramienta cuando aplique." },
              condicion: { type: "string", description: "Una o más oraciones: lugar, formato, simulación o criterio de desempeño." },
              temas: { type: "array", items: { type: "string" }, description: "4 a 6 prácticas o subtemas psicomotores del curso." }
            },
            required: ["sujeto", "accion", "condicion", "temas"]
          },
          afectivo: {
            type: "object",
            additionalProperties: false,
            properties: {
              sujeto: { type: "string", description: "Debe ser exactamente: El participante" },
              accion: { type: "string", description: "Una o más oraciones: actitud, valoración o compromiso observable (Krathwohl)." },
              condicion: { type: "string", description: "Una o más oraciones: contexto ético, de trabajo o de sesión donde se evidencia." },
              temas: { type: "array", items: { type: "string" }, description: "4 a 6 actitudes o valores trabajados en el curso." }
            },
            required: ["sujeto", "accion", "condicion", "temas"]
          }
        },
        required: ["cognitivo", "psicomotor", "afectivo"]
      },
      metadatos_tiempos: {
        type: "object",
        additionalProperties: false,
        properties: {
          duracion_curso_total_minutos: { type: "integer", description: "Igual a horas del curso × 60." },
          tiempo_encuadre_minutos: { type: "integer", description: "Minutos del encuadre/apertura." },
          tiempo_cierre_minutos: { type: "integer", description: "Minutos del cierre." },
          comprobacion_previa_minutos: { type: "integer", description: "Siempre 30; tiempo previo al curso, no suma a duración oficial." }
        },
        required: ["duracion_curso_total_minutos", "tiempo_encuadre_minutos", "tiempo_cierre_minutos", "comprobacion_previa_minutos"]
      },
      modulos: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            titulo: { type: "string" },
            duracion_total_minutos: { type: "integer", description: "Suma de duracion_minutos de secuencia_didactica." },
            secuencia_didactica: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  nombre_bloque: { type: "string" },
                  tecnica_instruccional: { type: "string", description: "Ej. Técnica expositiva, Técnica demostrativa, Diálogo-discusión, Técnica energizante." },
                  actividades: { type: "string", description: "Desarrollo detallado del bloque." },
                  duracion_minutos: { type: "integer" },
                  materiales_apoyo: { type: "string" }
                },
                required: ["nombre_bloque", "tecnica_instruccional", "actividades", "duracion_minutos", "materiales_apoyo"]
              }
            }
          },
          required: ["titulo", "duracion_total_minutos", "secuencia_didactica"]
        }
      },
      manual_participante: {
        type: "array",
        items: {
            type: "object",
            additionalProperties: false,
            properties: {
                titulo: { type: "string" },
                contenido: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "Por sección: varios párrafos o ítems (típicamente 8 a 18 entradas). Cada entrada debe ser sustancial (varias oraciones o un bloque HTML <p>...</p>); evita respuestas de una sola frase. En secciones narrativas alterna párrafos con listas HTML (<ul><li>) cuando aplique. El temario debe seguir el formato de lista pedido en las instrucciones del sistema.",
                },
            },
            required: ["titulo", "contenido"]
        }
      },
      recursos_continuidad: {
        type: "array",
        items: { type: "string" },
        description: "3 a 5 sugerencias de recursos de continuidad del aprendizaje (ej. sitios web oficiales, normativas, instituciones, certificaciones)."
      },
      fuentes_informacion: {
        type: "array",
        minItems: 5,
        maxItems: 8,
        items: {
            type: "object",
            additionalProperties: false,
            properties: {
                titulo_obra: { type: "string", description: "Título oficial de la obra/norma. PROHIBIDO nombres de archivo (.docx/.pdf)." },
                autor_institucion: { type: "string" },
                url_o_referencia: { type: "string" },
                ano_publicacion: { type: "string", description: "Año de publicación de la obra o norma" },
                ultima_reforma_consultada: { type: "string", description: "Año de la última reforma consultada" },
                editorial: { type: "string" },
                pais_origen: { type: "string" }
            },
            required: [
              "titulo_obra",
              "autor_institucion",
              "url_o_referencia",
              "ano_publicacion",
              "ultima_reforma_consultada",
              "editorial",
              "pais_origen",
            ],
        }
      },
      manual_instructor: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            titulo: { type: "string", description: "Exactamente: Parte 1, Parte 2, Parte 3…" },
            temas: { type: "array", items: { type: "string" }, description: "Temas a desarrollar (viñetas con verbos de aprendizaje)" },
            sugerencias: { type: "array", items: { type: "string" }, description: "Sugerencias de apoyo: Manual del Participante, Canva/PPT, ejemplos, bibliografía" },
            tecnicas: { type: "array", items: { type: "string" }, description: "Frases narrativas: técnica instruccional + cómo la aplica el instructor" },
            evaluacion: { type: "array", items: { type: "string" }, description: "Forma + Tiempo para contestarla + Valor %" },
            preguntas_refuerzo: { type: "array", items: { type: "string" }, description: "Preguntas dirigidas con ¿?" }
          },
          required: ["titulo", "temas", "sugerencias", "tecnicas", "evaluacion", "preguntas_refuerzo"]
        }
      },
      evaluacion_diagnostica: {
        type: "array",
        minItems: 5,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            pregunta: { type: "string" },
            opcion_a: { type: "string" },
            opcion_b: { type: "string" },
            opcion_c: { type: "string" },
            opcion_d: { type: "string" },
            respuesta_correcta: { type: "string" }
          },
          required: ["pregunta", "opcion_a", "opcion_b", "opcion_c", "opcion_d", "respuesta_correcta"]
        }
      },
      evaluacion_sumativa: {
        type: "array",
        minItems: 10,
        maxItems: 10,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            pregunta: { type: "string" },
            opcion_a: { type: "string" },
            opcion_b: { type: "string" },
            opcion_c: { type: "string" },
            opcion_d: { type: "string" },
            respuesta_correcta: { type: "string" }
          },
          required: ["pregunta", "opcion_a", "opcion_b", "opcion_c", "opcion_d", "respuesta_correcta"]
        }
      },
      evaluacion_formativa: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            modulo_titulo: { type: "string" },
            criterios: {
              type: "array",
              minItems: 1,
              maxItems: 5,
              items: { type: "string", description: "Criterio observacional verificable en práctica o producto. Máximo 5 criterios en todo el instrumento formativo." }
            }
          },
          required: ["modulo_titulo", "criterios"]
        }
      }
    },
    required: ["preguntas_rompehielo", "beneficios_curso", "nombre_disenador", "perfil_participante", "objetivo_general", "objetivos_particulares", "metadatos_tiempos", "modulos", "manual_participante", "recursos_continuidad", "fuentes_informacion", "manual_instructor", "evaluacion_diagnostica", "evaluacion_sumativa", "evaluacion_formativa"]
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.7,
      // Respuesta JSON muy grande (manual participante + tablas); sin esto el modelo corta y quedan secciones vacías o cortas.
      max_completion_tokens: 16384,
      response_format: {
          type: 'json_schema',
          json_schema: {
              name: 'formato_curso',
              schema: schema,
              strict: true
          }
      }
    })

    const generatedText = response.choices[0].message.content
    if (!generatedText) throw new Error("Empty response from AI")
    
    let generatedData;
    try {
        generatedData = mergeKnowledgeIntoFuentes(
          finalizeFormatPayload(
            enforceEvaluationQuestionLimits(sanitizeGeneratedData(JSON.parse(generatedText)))
          ),
          knowledgeItems,
          { name: curso.name, norm_reference: curso.norm_reference }
        )
    }catch(e){
        throw new Error("Invalid formulation of JSON")
    }

    // Save strictly inside the AI generated scope to allow isolation
    await upsertCourseFormat(courseId, { objectives: { ai_payload: generatedData } })

    return NextResponse.json({ success: true, data: generatedData })

  } catch (err: any) {
    console.error("🔥 FALLO AL GENERAR IA:", err);
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}


