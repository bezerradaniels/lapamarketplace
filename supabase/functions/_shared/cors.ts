// Shared CORS helpers for Edge Functions called from the SPA.

function resolveOrigin(req: Request): string {
  const origin = req.headers.get('origin') ?? ''
  if (origin === 'https://lapamarketplace.com.br') return origin
  if (origin === 'https://staging.lapamarketplace.com.br') return origin
  // localhost for local development
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return origin
  if (/^https?:\/\/[a-z0-9-]+\.localhost(:\d+)?$/.test(origin)) return origin
  return 'https://lapamarketplace.com.br'
}

export function getCorsHeaders(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': resolveOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

export function preflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }
  return null
}

export function jsonResponse(
  body: unknown,
  init: ResponseInit & { req?: Request } = {},
): Response {
  const { req, ...restInit } = init
  const cors = req ? getCorsHeaders(req) : { 'Access-Control-Allow-Origin': 'https://lapamarketplace.com.br', 'Vary': 'Origin' }
  return new Response(JSON.stringify(body), {
    ...restInit,
    headers: {
      ...cors,
      'Content-Type': 'application/json',
      ...(restInit.headers ?? {}),
    },
  })
}

// Legacy alias so existing functions that spread corsHeaders keep working
// without changes. New functions should use getCorsHeaders(req).
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://lapamarketplace.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
}
