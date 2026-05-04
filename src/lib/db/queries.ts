import { createClient } from '@/lib/supabase/server'
import type { Curso, Modulo, ContentBlock } from '@/types/curso'
import type { KnowledgeItem } from '@/types/knowledge'

// ── Courses ──────────────────────────────────────────────────────────────────

export async function getCourses(): Promise<Curso[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('category')
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []) as Curso[]
}

export async function getCourseById(id: string): Promise<Curso | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Curso
}

export async function createCourse(course: Omit<Curso, 'id' | 'created_at' | 'updated_at'>): Promise<Curso> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .insert(course)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Curso
}

export async function updateCourse(id: string, updates: Partial<Curso>): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('courses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteCourse(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Modules ───────────────────────────────────────────────────────────────────

export async function getModules(courseId: string): Promise<Modulo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', courseId)
    .order('number')

  if (error) throw new Error(error.message)
  return (data ?? []) as Modulo[]
}

export async function getModuleById(id: string): Promise<Modulo | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Modulo
}

export async function createModule(mod: Omit<Modulo, 'id' | 'created_at' | 'generated'>): Promise<Modulo> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modules')
    .insert({ ...mod, generated: false })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Modulo
}

export async function updateModule(id: string, updates: Partial<Modulo>): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('modules').update(updates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteModule(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('modules').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function markModuleGenerated(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('modules').update({ generated: true }).eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Content Blocks ────────────────────────────────────────────────────────────

export async function getContentBlocks(moduleId: string): Promise<ContentBlock[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('content_blocks')
    .select('*')
    .eq('module_id', moduleId)
    .order('order')

  if (error) throw new Error(error.message)
  return (data ?? []) as ContentBlock[]
}

export async function createContentBlock(block: Omit<ContentBlock, 'id' | 'created_at'>): Promise<ContentBlock> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('content_blocks')
    .insert(block)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as ContentBlock
}

export async function updateContentBlock(id: string, content: Record<string, unknown>): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('content_blocks').update({ content }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteContentBlocks(moduleId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('content_blocks').delete().eq('module_id', moduleId)
  if (error) throw new Error(error.message)
}

// ── References ────────────────────────────────────────────────────────────────

export async function getReferences(moduleId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('references')
    .select('*')
    .eq('module_id', moduleId)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createReferences(refs: Array<{
  module_id: string
  type: string
  title: string
  author?: string
  year?: string
  url?: string
  citation: string
}>): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('references').insert(refs)
  if (error) throw new Error(error.message)
}

export async function deleteReferences(moduleId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('references').delete().eq('module_id', moduleId)
  if (error) throw new Error(error.message)
}

// ── Knowledge Base ────────────────────────────────────────────────────────────

export async function getKnowledgeItems(courseId: string): Promise<KnowledgeItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as KnowledgeItem[]
}

export async function deleteKnowledgeItem(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('knowledge_base').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Course Formats ────────────────────────────────────────────────────────────

export async function getCourseFormat(courseId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('course_formats')
    .select('*')
    .eq('course_id', courseId)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  return data
}

export async function upsertCourseFormat(courseId: string, updates: Record<string, unknown>): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('course_formats')
    .upsert({ course_id: courseId, ...updates, updated_at: new Date().toISOString() })

  if (error) throw new Error(error.message)
}
