// Shared Gemini API client for all AI Edge Functions.
// Uses fetch directly (Deno-compatible). Model and base URL are centralized here.

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

export type GeminiResponse = { text: string }

export type GenerateOptions = {
  systemInstruction?: string
  temperature?: number
  maxOutputTokens?: number
  // Use 'application/json' to get structured output without markdown wrapping
  responseMimeType?: 'text/plain' | 'application/json'
}

/**
 * Calls the Gemini generateContent endpoint.
 * Pass `systemInstruction` to set a persistent persona/role for the model.
 * Pass `responseMimeType: 'application/json'` to get clean JSON without markdown fences.
 */
export async function generateContent(
  prompt: string,
  options: GenerateOptions = {},
): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) throw new Error('missing_gemini_api_key')

  const {
    systemInstruction,
    temperature = 0.7,
    maxOutputTokens = 1024,
    responseMimeType = 'text/plain',
  } = options

  const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens, responseMimeType },
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`gemini_api_error: ${res.status} ${err}`)
  }

  const data = await res.json()
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  if (!text) throw new Error('gemini_empty_response')

  return { text: text.trim() }
}
