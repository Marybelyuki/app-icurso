import OpenAI from 'openai'

/** Evita instanciar OpenAI al importar el módulo (útil para build sin OPENAI_API_KEY en entorno). */
export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no está configurada')
  }
  return new OpenAI({ apiKey })
}
