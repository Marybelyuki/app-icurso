import OpenAI from 'openai'

/** Evita instanciar OpenAI al importar el módulo (necesario para `next build` en CI/Vercel sin clave). */
export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no está configurada')
  }
  return new OpenAI({ apiKey })
}
