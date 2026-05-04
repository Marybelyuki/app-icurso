import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/ai/openai-client'

async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient()
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  })
  return response.data[0].embedding
}

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())

  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    const pdfParseModule = await import('pdf-parse')
    const pdfParse = (pdfParseModule as unknown as { default: (buf: Buffer) => Promise<{ text: string }> }).default ?? pdfParseModule
    const result = await (pdfParse as (buf: Buffer) => Promise<{ text: string }>)(buffer)
    return result.text
  }

  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return buffer.toString('utf-8')
  }

  // Fallback: treat as text
  return buffer.toString('utf-8')
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contentType = request.headers.get('content-type') ?? ''

  // Handle JSON (links/videos)
  if (contentType.includes('application/json')) {
    const body = await request.json()
    const { type, url, name, courseId } = body

    let embedding: number[] | null = null
    try {
      embedding = await generateEmbedding(name + ' ' + url)
    } catch {
      // embedding optional
    }

    const { error } = await serviceSupabase.from('knowledge_base').insert({
      course_id: courseId,
      type,
      name,
      url,
      embedding,
      metadata: { url },
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Handle file upload
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const courseId = formData.get('courseId') as string

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Upload to storage
  const filePath = `${courseId}/${Date.now()}-${file.name}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await serviceSupabase.storage
    .from('knowledge-files')
    .upload(filePath, buffer, { contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Extract text
  let extractedText = ''
  try {
    extractedText = await extractText(file)
  } catch {
    extractedText = file.name
  }

  // Generate embedding
  let embedding: number[] | null = null
  try {
    embedding = await generateEmbedding(extractedText)
  } catch {
    // embedding optional
  }

  // Save to DB
  const { error: dbError } = await serviceSupabase.from('knowledge_base').insert({
    course_id: courseId,
    type: 'file',
    name: file.name,
    file_path: filePath,
    embedding,
    metadata: { size: file.size, mimeType: file.type, extractedLength: extractedText.length },
  })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
