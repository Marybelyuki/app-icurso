export interface GeneratedContent {
  blocks: ContentBlockData[]
  references: Reference[]
}

export interface ContentBlockData {
  type: 'text' | 'table' | 'diagram' | 'infographic' | 'schema' | 'highlight' | 'formula'
  content: TextContent | TableContent | DiagramContent | HighlightContent | Record<string, unknown>
}

export interface TextContent {
  html: string
}

export interface TableContent {
  headers: string[]
  rows: string[][]
  caption?: string
}

export interface DiagramContent {
  mermaid: string
  caption?: string
}

export interface HighlightContent {
  title?: string
  body: string
  variant?: 'info' | 'warning' | 'success'
}

export interface Reference {
  type: 'ley' | 'norma' | 'libro' | 'web' | 'dependencia' | 'revista'
  title: string
  author?: string
  year?: string
  url?: string
  citation: string
}

export interface GenerateRequest {
  moduleId: string
  courseName: string
  moduleTitle: string
  objectives: string[]
  knowledgeContext?: string
  outputTypes?: string[]
}
