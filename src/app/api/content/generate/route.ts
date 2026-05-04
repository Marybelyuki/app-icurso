import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateModuleContent } from '@/lib/ai/claude'
import type { GenerateRequest, GeneratedContent } from '@/types/content'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body: GenerateRequest = await request.json()
  const { moduleId } = body

  if (!moduleId) {
    return new Response('moduleId is required', { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullText = ''

        await generateModuleContent(
          body,
          (chunk) => {
            const data = `data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`
            controller.enqueue(encoder.encode(data))
          },
          async (text) => {
            fullText = text
          }
        )

        // Parse and save to DB
        try {
          const jsonMatch = fullText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed: GeneratedContent = JSON.parse(jsonMatch[0])

            // Delete existing blocks and references
            await supabase.from('content_blocks').delete().eq('module_id', moduleId)
            await supabase.from('references').delete().eq('module_id', moduleId)

            // Insert new blocks
            if (parsed.blocks && parsed.blocks.length > 0) {
              const blocks = parsed.blocks.map((b, i) => ({
                module_id: moduleId,
                type: b.type,
                content: b.content,
                order: i,
              }))
              await supabase.from('content_blocks').insert(blocks)
            }

            // Insert references
            if (parsed.references && parsed.references.length > 0) {
              const refs = parsed.references.map((r) => ({
                module_id: moduleId,
                type: r.type,
                title: r.title,
                author: r.author,
                year: r.year,
                url: r.url,
                citation: r.citation,
              }))
              await supabase.from('references').insert(refs)
            }

            // Mark module as generated
            await supabase.from('modules').update({ generated: true }).eq('id', moduleId)

            const doneData = `data: ${JSON.stringify({ type: 'done', blocks: parsed.blocks?.length ?? 0 })}\n\n`
            controller.enqueue(encoder.encode(doneData))
          } else {
            throw new Error('No valid JSON found in response')
          }
        } catch (parseError) {
          const errMsg = parseError instanceof Error ? parseError.message : 'Parse error'
          const errData = `data: ${JSON.stringify({ type: 'error', message: errMsg })}\n\n`
          controller.enqueue(encoder.encode(errData))
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Generation error'
        const errData = `data: ${JSON.stringify({ type: 'error', message: errMsg })}\n\n`
        controller.enqueue(encoder.encode(errData))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
