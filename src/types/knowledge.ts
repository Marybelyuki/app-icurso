export interface KnowledgeItem {
  id: string
  course_id: string | null
  type: 'file' | 'link' | 'video'
  name: string
  url: string | null
  file_path: string | null
  embedding: number[] | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface FileUpload {
  file: File
  courseId: string
}

export interface KnowledgeSearchResult {
  id: string
  name: string
  type: string
  content: string
  similarity: number
}
