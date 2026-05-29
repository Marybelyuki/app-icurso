export interface DevelopedTopic {
  title: string
  subtopics: string[]
  key_concepts: string[]
  conceptual_development: string
  mermaid_diagram: string
  examples: string[]
  practical_examples: string[]
  practice: string
  facilitator_script: string
  learning_activity: string
  evaluation_evidence: string[]
  common_errors: string[]
}

export interface ContentDevelopment {
  course_title: string
  alignment: {
    general_objective: string
    particular_objectives: string[]
    instructional_alignment: string[]
  }
  topics: DevelopedTopic[]
  integration: {
    recap: string
    integrative_practice: string
    objective_verification_criteria: string[]
  }
  presentation_resources: {
    slide_key_phrases: string[]
    visual_scheme_ideas: string[]
    trigger_questions: string[]
  }
}
