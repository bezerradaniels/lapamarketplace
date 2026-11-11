/**
 * Origem pública do site (ex.: https://lapamarketplace.com.br).
 *
 * Atrás do proxy da Hostinger, `request.url` traz o endereço interno do
 * processo Node (ex.: https://0.0.0.0:3000), que não serve para redirecionar
 * o navegador. Ordem de preferência:
 * 1. Cabeçalhos `x-forwarded-host` / `x-forwarded-proto` do proxy
 * 2. `NEXT_PUBLIC_SITE_URL`
 * 3. Origem da própria requisição (desenvolvimento local)
 */
export function getPublicOrigin(request: Request): string {
  const requestOrigin = new URL(request.url).origin;

  if (process.env.NODE_ENV === "development") {
    return requestOrigin;
  }

  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  if (forwardedHost && !isInternalHost(forwardedHost)) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      "https";
    return `${proto}://${forwardedHost}`;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      return new URL(siteUrl).origin;
    } catch {
      // valor inválido: cai para a origem da requisição
    }
  }

  return requestOrigin;
}

function isInternalHost(host: string): boolean {
  const hostname = host.replace(/:\d+$/, "");
  return (
    hostname === "0.0.0.0" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}

/** Monta uma URL absoluta no domínio público a partir de um caminho. */
export function publicUrl(request: Request, pathWithQuery: string): URL {
  return new URL(pathWithQuery, getPublicOrigin(request));
}
