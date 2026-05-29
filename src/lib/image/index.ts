/**
 * Supabase Storage image transform utility.
 *
 * Converts regular storage URLs to the render/image endpoint which serves
 * WebP-encoded, resized images from Supabase's CDN.
 *
 * Requires Supabase Pro plan or higher. The OptimizedImage component handles
 * fallback to the original URL automatically when transforms are unavailable.
 *
 * Docs: https://supabase.com/docs/guides/storage/serving/image-transformations
 */

const STORAGE_OBJECT_RE = /\/storage\/v1\/object\/public\//

export type ImageTransformOptions = {
  /** Target width in pixels. Height is calculated automatically. */
  width?: number
  /** Quality 1–100. Defaults to 85 (visually lossless for WebP). */
  quality?: number
}

/**
 * Returns a WebP-transformed URL for Supabase Storage assets.
 * Non-Supabase URLs are returned unchanged.
 */
export function getImageUrl(
  url: string | null | undefined,
  opts: ImageTransformOptions = {},
): string | null {
  if (!url) return null
  if (!STORAGE_OBJECT_RE.test(url)) return url

  const { width = 1200, quality = 85 } = opts
  const renderUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/',
  )
  const u = new URL(renderUrl)
  u.searchParams.set('width', String(width))
  u.searchParams.set('quality', String(quality))
  u.searchParams.set('format', 'webp')
  // Without 'contain', Supabase defaults to 'cover' which square-crops
  // when only width is specified. 'contain' preserves aspect ratio.
  u.searchParams.set('resize', 'contain')
  return u.toString()
}
