interface GammaGenerateParams {
  title: string
  bullets: string[]
  courseContext: string
}

interface GammaResult {
  url: string
  id: string
}

export async function generateGammaPresentation(params: GammaGenerateParams): Promise<GammaResult> {
  const apiKey = process.env.GAMMA_API_KEY
  if (!apiKey) throw new Error('GAMMA_API_KEY not configured')

  const prompt = `${params.title}\n\n${params.bullets.map((b) => `- ${b}`).join('\n')}\n\nContexto: ${params.courseContext}`

  const res = await fetch('https://api.gamma.app/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      title: params.title,
      language: 'es',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gamma API error: ${err}`)
  }

  const data = await res.json()
  return { url: data.url ?? data.shareUrl, id: data.id }
}
