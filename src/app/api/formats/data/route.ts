import { NextRequest, NextResponse } from 'next/server'
import { getCourseById, getCourseFormat, getKnowledgeItems } from '@/lib/db/queries'
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
  let text = String(input || '').replace(/\s+/g, ' ').trim()
  text = text.replace(/\b([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\b(\s+\1\b)+/gi, '$1')

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
    if (before === text) break
  }

  return text
}

function sanitizeGeneratedData(node: unknown): unknown {
  if (typeof node === 'string') return cleanRedundantText(node)

  if (Array.isArray(node)) {
    if (node.every(item => typeof item === 'string')) {
      const seen = new Set<string>()
      const cleaned: string[] = []
      for (const value of node as string[]) {
        const current = cleanRedundantText(value)
        const key = normalizeKey(current)
        if (!current || seen.has(key)) continue
        seen.add(key)
        cleaned.push(current)
      }
      return cleaned
    }
    return node.map(item => sanitizeGeneratedData(item))
  }

  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      out[key] = sanitizeGeneratedData(value)
    }
    return out
  }

  return node
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('courseId')

  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 })
  }

  try {
    const format = await getCourseFormat(courseId)

    if (!format || !format.objectives?.ai_payload) {
      return NextResponse.json({ error: 'Not generated yet' }, { status: 404 })
    }

    const cleaned = sanitizeGeneratedData(format.objectives.ai_payload)
    let knowledgeItems: Awaited<ReturnType<typeof getKnowledgeItems>> = []
    try {
      knowledgeItems = await getKnowledgeItems(courseId)
    } catch {
      knowledgeItems = []
    }
    const curso = await getCourseById(courseId).catch(() => null)
    // Reaplicar limpiezas + KB al cargar (corrige generaciones viejas con Amazon/A/café)
    const withKnowledge = mergeKnowledgeIntoFuentes(
      finalizeFormatPayload(enforceEvaluationQuestionLimits(cleaned)),
      knowledgeItems,
      { name: curso?.name, norm_reference: curso?.norm_reference }
    )
    return NextResponse.json({ success: true, data: withKnowledge })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al cargar formatos'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
