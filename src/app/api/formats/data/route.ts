import { NextRequest, NextResponse } from 'next/server'
import { getCourseFormat } from '@/lib/db/queries'

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

function enforceEvaluationQuestionLimits(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload
  const data = payload as Record<string, unknown>
  const diagnostica = Array.isArray(data.evaluacion_diagnostica) ? data.evaluacion_diagnostica : []
  const sumativa = Array.isArray(data.evaluacion_sumativa) ? data.evaluacion_sumativa : []
  data.evaluacion_diagnostica = diagnostica.slice(0, 5)
  data.evaluacion_sumativa = sumativa.slice(0, 10)
  return data
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
    return NextResponse.json({ success: true, data: enforceEvaluationQuestionLimits(cleaned) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
