-- iCurs@ Schema
-- Execute in Supabase Dashboard → SQL Editor

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  instructor text DEFAULT 'AMBOS',
  total_hours integer DEFAULT 0,
  description text,
  norm_reference text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  number integer NOT NULL,
  title text NOT NULL,
  hours integer DEFAULT 0,
  objectives text[] DEFAULT '{}',
  generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES modules(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('text','table','diagram','infographic','schema','highlight','formula')),
  content jsonb NOT NULL DEFAULT '{}',
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES modules(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('ley','norma','libro','web','dependencia','revista')),
  title text NOT NULL,
  author text,
  year text,
  url text,
  citation text NOT NULL
);

CREATE TABLE knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('file','link','video')),
  name text NOT NULL,
  url text,
  file_path text,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE course_formats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE UNIQUE,
  general_data jsonb DEFAULT '{}',
  objectives jsonb DEFAULT '{}',
  evaluation_pcts jsonb DEFAULT '{"diagnostica": 0, "formativa": 60, "sumativa": 40, "criterio": "80% mínimo"}',
  apertura jsonb DEFAULT '{}',
  cierre jsonb DEFAULT '{}',
  requirements jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX ON knowledge_base USING ivfflat (embedding vector_cosine_ops);

-- Función para búsqueda semántica por similitud coseno
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_course_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  type text,
  file_path text,
  url text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    kb.id,
    kb.name,
    kb.type,
    kb.file_path,
    kb.url,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE
    (p_course_id IS NULL OR kb.course_id = p_course_id)
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- RLS Policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE references ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_formats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access on courses" ON courses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access on modules" ON modules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access on content_blocks" ON content_blocks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access on references" ON references FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access on knowledge_base" ON knowledge_base FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access on course_formats" ON course_formats FOR ALL TO authenticated USING (true) WITH CHECK (true);
