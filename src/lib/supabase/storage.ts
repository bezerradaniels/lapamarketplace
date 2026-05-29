import { createBrowserClient } from './client'

export type StorageBucket = 'store-logos' | 'product-images'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export class UploadError extends Error {}

// Magic bytes for each allowed image format — verified before upload
const MAGIC: { bytes: number[]; mime: string; ext: string }[] = [
  { bytes: [0xff, 0xd8, 0xff], mime: 'image/jpeg', ext: 'jpg' },
  { bytes: [0x89, 0x50, 0x4e, 0x47], mime: 'image/png', ext: 'png' },
  { bytes: [0x52, 0x49, 0x46, 0x46], mime: 'image/webp', ext: 'webp' },
  { bytes: [0x47, 0x49, 0x46], mime: 'image/gif', ext: 'gif' },
]

async function detectMime(file: File): Promise<{ mime: string; ext: string } | null> {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  for (const { bytes, mime, ext } of MAGIC) {
    if (bytes.every((b, i) => header[i] === b)) return { mime, ext }
  }
  return null
}

/**
 * Uploads an image to a store-scoped folder and returns its public URL.
 * MIME type is verified via magic bytes — not the browser-supplied file.type —
 * to prevent forged content types.
 */
export async function uploadImage(
  bucket: StorageBucket,
  storeId: string,
  file: File,
): Promise<string> {
  if (file.size > MAX_SIZE_BYTES) {
    throw new UploadError('Imagem muito grande. Máximo 5 MB.')
  }

  const detected = await detectMime(file)
  if (!detected) {
    throw new UploadError('Formato inválido. Use JPG, PNG, WEBP ou GIF.')
  }

  const supabase = createBrowserClient()
  const path = `${storeId}/${crypto.randomUUID()}.${detected.ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: detected.mime,
  })
  if (error) throw new UploadError(error.message)

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Best-effort deletion by public URL. Silently no-ops if the URL doesn't
 * belong to the given bucket (e.g. legacy pasted URL).
 */
export async function deleteImageByUrl(
  bucket: StorageBucket,
  publicUrl: string,
): Promise<void> {
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return
  const path = publicUrl.slice(idx + marker.length)
  const supabase = createBrowserClient()
  await supabase.storage.from(bucket).remove([path])
}
