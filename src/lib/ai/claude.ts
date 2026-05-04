import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from './prompts/system'
import type { GenerateRequest } from '@/types/content'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function generateModuleContent(
  params: GenerateRequest,
  onChunk: (chunk: string) => void,
  onDone: (fullText: string) => void
): Promise<void> {
  const { courseName, moduleTitle, objectives, knowledgeContext } = params

  const userPrompt = `
Genera el contenido didáctico completo para el siguiente módulo:

CURSO: ${courseName}
MÓDULO: ${moduleTitle}
OBJETIVOS DE APRENDIZAJE:
${objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

${knowledgeContext ? `CONTEXTO ADICIONAL (base de conocimiento):\n${knowledgeContext}\n` : ''}

Genera un JSON completo con bloques didácticos ricos: introducción, desarrollo temático, tablas comparativas, diagramas de proceso, puntos clave, resumen y referencias bibliográficas. El contenido debe ser suficiente para 2-3 horas de capacitación.
`

  let fullText = ''

  const stream = await anthropic.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      const text = chunk.delta.text
      fullText += text
      onChunk(text)
    }
  }

  onDone(fullText)
}
