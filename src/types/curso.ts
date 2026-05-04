export interface Curso {
  id: string
  name: string
  category: string
  instructor: 'MARIBEL' | 'CESAR' | 'AMBOS'
  total_hours: number
  description: string | null
  norm_reference: string | null
  created_at: string
  updated_at: string
}

export interface Modulo {
  id: string
  course_id: string
  number: number
  title: string
  hours: number
  objectives: string[]
  generated: boolean
  created_at: string
}

export interface ContentBlock {
  id: string
  module_id: string
  type: 'text' | 'table' | 'diagram' | 'infographic' | 'schema' | 'highlight' | 'formula'
  content: Record<string, unknown>
  order: number
  created_at: string
}

export interface CursoWithModules extends Curso {
  modules: Modulo[]
}
