import { NextRequest, NextResponse } from 'next/server'
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import type { ContentDevelopment, DevelopedTopic } from '@/types/content-development'

export const runtime = 'nodejs'

function sanitizeFilename(value: string): string {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').replace(/\s+/g, ' ').trim()
}

function heading(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 260, after: 120 },
  })
}

function paragraph(text: string) {
  return new Paragraph({
    children: [new TextRun({ text })],
    spacing: { after: 160 },
  })
}

function bullets(items: string[]) {
  return items.map(
    (item) =>
      new Paragraph({
        text: item,
        bullet: { level: 0 },
        spacing: { after: 80 },
      })
  )
}

function topicParagraphs(topic: DevelopedTopic, index: number): Paragraph[] {
  return [
    heading(`Tema ${index + 1}: ${topic.title}`, HeadingLevel.HEADING_1),
    heading('Subtemas'),
    ...bullets(topic.subtopics),
    heading('Conceptos clave'),
    ...bullets(topic.key_concepts),
    heading('Desarrollo conceptual'),
    ...topic.conceptual_development
      .split(/\n{2,}/)
      .filter(Boolean)
      .map((text) => paragraph(text)),
    heading('Diagrama Mermaid'),
    new Paragraph({
      children: [new TextRun({ text: topic.mermaid_diagram, font: 'Courier New', size: 18 })],
      spacing: { after: 160 },
    }),
    heading('Ejemplos'),
    ...bullets(topic.examples),
    heading('Ejemplos prácticos'),
    ...bullets(topic.practical_examples),
    heading('Práctica o dinámica'),
    paragraph(topic.practice),
    heading('Guion sugerido para el expositor'),
    paragraph(topic.facilitator_script),
    heading('Actividad de aprendizaje'),
    paragraph(topic.learning_activity),
    heading('Evaluación y evidencias observables'),
    ...bullets(topic.evaluation_evidence),
    heading('Errores frecuentes y recomendaciones'),
    ...bullets(topic.common_errors),
  ]
}

export async function POST(request: NextRequest) {
  try {
    const { courseName, development } = (await request.json()) as {
      courseName?: string
      development?: ContentDevelopment
    }

    if (!courseName || !development) {
      return NextResponse.json({ error: 'courseName and development are required' }, { status: 400 })
    }

    const children: Paragraph[] = [
      new Paragraph({
        text: 'Desarrollo de Contenido',
        heading: HeadingLevel.TITLE,
        spacing: { after: 160 },
      }),
      new Paragraph({
        children: [new TextRun({ text: courseName, bold: true, size: 30 })],
        spacing: { after: 360 },
      }),
      heading('Objetivo general', HeadingLevel.HEADING_1),
      paragraph(development.alignment.general_objective),
      heading('Objetivos particulares'),
      ...bullets(development.alignment.particular_objectives),
      heading('Congruencia instruccional'),
      ...bullets(development.alignment.instructional_alignment),
      ...development.topics.flatMap((topic, index) => topicParagraphs(topic, index)),
      heading('Integración final del curso', HeadingLevel.HEADING_1),
      heading('Recapitulación'),
      paragraph(development.integration.recap),
      heading('Práctica integradora'),
      paragraph(development.integration.integrative_practice),
      heading('Criterios para verificar el logro de objetivos'),
      ...bullets(development.integration.objective_verification_criteria),
      heading('Banco de recursos para presentación', HeadingLevel.HEADING_1),
      heading('Frases clave para diapositivas'),
      ...bullets(development.presentation_resources.slide_key_phrases),
      heading('Ideas de esquemas visuales'),
      ...bullets(development.presentation_resources.visual_scheme_ideas),
      heading('Preguntas detonadoras'),
      ...bullets(development.presentation_resources.trigger_questions),
    ]

    const doc = new Document({ sections: [{ children }] })
    const buffer = await Packer.toBuffer(doc)
    const filename = sanitizeFilename(`Desarrollo de Contenido - ${courseName}.docx`)

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al generar Word'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
