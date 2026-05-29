import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/ai/openai-client'
import {
  getCourseById,
  getCourseFormat,
} from '@/lib/db/queries'

export const runtime = 'nodejs'
export const maxDuration = 300

function buildPrompt(courseName: string, cartaDescriptiva: unknown) {
  return `
Eres un Diseñador Instruccional experto en EC0301, EC0217.01 y diseño de cursos para exposición presencial.

Desarrolla el contenido completo del curso "${courseName}" tomando como fuente obligatoria esta Carta Descriptiva generada:

${JSON.stringify(cartaDescriptiva, null, 2)}

OBJETIVO:
Generar un documento en Markdown listo para copiar y convertir en presentaciones de exposición. El contenido debe desarrollar TODOS los temas, subtemas, dinámicas, técnicas instruccionales, actividades y evaluaciones mencionadas en la Carta Descriptiva.

REGLAS OBLIGATORIAS:
- Respeta el objetivo general y cada objetivo particular. El contenido debe demostrar congruencia explícita con ellos.
- No inventes temas ajenos ni omitas temas de la Carta Descriptiva.
- Mantén el orden de los temas y subtemas de la Carta Descriptiva.
- Desarrolla cada tema con profundidad útil para el instructor, no solo con definiciones breves.
- Alinea conceptos, ejemplos, prácticas y evaluaciones con las técnicas expositivas, demostrativas, diálogo-discusión, energizantes o las que indique la carta.
- Incluye diagramas en bloques Mermaid cuando aporten valor. Usa sintaxis válida de Mermaid dentro de bloques \`\`\`mermaid.
- Escribe en español, con tono profesional, claro y didáctico.
- El resultado debe ser texto Markdown, no HTML.

ESTRUCTURA OBLIGATORIA:
1. Título del curso.
2. Resumen de alineación instruccional:
   - Objetivo general.
   - Objetivos particulares.
   - Cómo se refleja cada objetivo en el desarrollo.
3. Desarrollo por tema:
   - Tema.
   - Subtemas.
   - Conceptos clave.
   - Desarrollo conceptual amplio.
   - Diagrama o esquema Mermaid cuando aplique.
   - Ejemplos.
   - Ejemplos prácticos contextualizados.
   - Práctica o dinámica para participantes.
   - Guion sugerido para el expositor.
   - Actividad de aprendizaje.
   - Evaluación o evidencias observables.
   - Errores frecuentes y recomendaciones.
4. Integración final del curso:
   - Recapitulación.
   - Práctica integradora.
   - Criterios para verificar el logro de objetivos.
5. Banco de recursos para presentación:
   - Frases clave para diapositivas.
   - Ideas de esquemas visuales.
   - Preguntas detonadoras.

FORMATO DE RESPUESTA:
Devuelve estrictamente JSON estructurado. No devuelvas Markdown como documento único.
`
}

const topicSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    subtopics: { type: 'array', items: { type: 'string' } },
    key_concepts: { type: 'array', items: { type: 'string' } },
    conceptual_development: {
      type: 'string',
      description: 'Desarrollo amplio del tema con varios párrafos sustantivos.',
    },
    mermaid_diagram: {
      type: 'string',
      description: 'Código Mermaid sin cercas ```; si no aplica, devuelve un esquema Mermaid simple.',
    },
    examples: { type: 'array', items: { type: 'string' } },
    practical_examples: { type: 'array', items: { type: 'string' } },
    practice: { type: 'string' },
    facilitator_script: { type: 'string' },
    learning_activity: { type: 'string' },
    evaluation_evidence: { type: 'array', items: { type: 'string' } },
    common_errors: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'title',
    'subtopics',
    'key_concepts',
    'conceptual_development',
    'mermaid_diagram',
    'examples',
    'practical_examples',
    'practice',
    'facilitator_script',
    'learning_activity',
    'evaluation_evidence',
    'common_errors',
  ],
}

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    course_title: { type: 'string' },
    alignment: {
      type: 'object',
      additionalProperties: false,
      properties: {
        general_objective: { type: 'string' },
        particular_objectives: { type: 'array', items: { type: 'string' } },
        instructional_alignment: { type: 'array', items: { type: 'string' } },
      },
      required: ['general_objective', 'particular_objectives', 'instructional_alignment'],
    },
    topics: {
      type: 'array',
      items: topicSchema,
    },
    integration: {
      type: 'object',
      additionalProperties: false,
      properties: {
        recap: { type: 'string' },
        integrative_practice: { type: 'string' },
        objective_verification_criteria: { type: 'array', items: { type: 'string' } },
      },
      required: ['recap', 'integrative_practice', 'objective_verification_criteria'],
    },
    presentation_resources: {
      type: 'object',
      additionalProperties: false,
      properties: {
        slide_key_phrases: { type: 'array', items: { type: 'string' } },
        visual_scheme_ideas: { type: 'array', items: { type: 'string' } },
        trigger_questions: { type: 'array', items: { type: 'string' } },
      },
      required: ['slide_key_phrases', 'visual_scheme_ideas', 'trigger_questions'],
    },
  },
  required: ['course_title', 'alignment', 'topics', 'integration', 'presentation_resources'],
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

  const [course, format] = await Promise.all([
    getCourseById(courseId),
    getCourseFormat(courseId),
  ])

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const cartaDescriptiva = format?.objectives?.ai_payload
  if (!cartaDescriptiva) {
    return NextResponse.json(
      { error: 'Primero genera la Carta Descriptiva en la sección Formatos.' },
      { status: 409 }
    )
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: buildPrompt(course.name, cartaDescriptiva) }],
      temperature: 0.65,
      max_completion_tokens: 16384,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'desarrollo_contenido',
          strict: true,
          schema: responseSchema,
        },
      },
    })

    const generatedText = response.choices[0].message.content
    if (!generatedText) throw new Error('Empty response from AI')

    const development = JSON.parse(generatedText)
    return NextResponse.json({ success: true, development })
  } catch (err: unknown) {
    console.error('Fallo al generar desarrollo de contenido:', err)
    const message = err instanceof Error ? err.message : 'Error al generar desarrollo de contenido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
