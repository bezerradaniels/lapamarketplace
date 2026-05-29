import { useState } from 'react'
import { getImageUrl, type ImageTransformOptions } from '@/lib/image'

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string | null | undefined
  transform?: ImageTransformOptions
}

/**
 * Drop-in <img> replacement that:
 * - Serves WebP via Supabase image transforms (smaller, faster)
 * - Falls back to the original URL automatically if the transform fails
 *   (e.g. project not on Supabase Pro)
 * - Passes all standard img props through unchanged
 */
export function OptimizedImage({ src, transform, onError, ...props }: Props) {
  const resolved = getImageUrl(src, transform) ?? src ?? ''
  const [imgSrc, setImgSrc] = useState(resolved)

  // Reset to the resolved source when `src` changes (e.g. carousel navigation),
  // adjusting state during render instead of in an effect to avoid an extra pass.
  const [prevSrc, setPrevSrc] = useState(src)
  if (src !== prevSrc) {
    setPrevSrc(src)
    setImgSrc(resolved)
  }

  const handleError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    if (src && imgSrc !== src) {
      setImgSrc(src)
    }
    onError?.(e)
  }

  if (!imgSrc) return null

  return <img {...props} src={imgSrc} onError={handleError} />
}
