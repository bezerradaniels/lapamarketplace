/**
 * Rotates a source image by `degrees` (0 / 90 / 180 / 270) and returns a
 * new object-URL pointing to the rotated JPEG. The caller is responsible for
 * revoking the URL when no longer needed.
 */
export function rotateImage(src: string, degrees: number): Promise<string> {
  const normalized = ((degrees % 360) + 360) % 360
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const rad = (normalized * Math.PI) / 180
      const sin = Math.abs(Math.sin(rad))
      const cos = Math.abs(Math.cos(rad))
      const w = img.naturalWidth
      const h = img.naturalHeight
      const newW = Math.round(w * cos + h * sin)
      const newH = Math.round(w * sin + h * cos)
      const canvas = document.createElement('canvas')
      canvas.width = newW
      canvas.height = newH
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas indisponível'))
        return
      }
      ctx.translate(newW / 2, newH / 2)
      ctx.rotate(rad)
      ctx.drawImage(img, -w / 2, -h / 2)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Falha ao gerar imagem rotacionada'))
            return
          }
          resolve(URL.createObjectURL(blob))
        },
        'image/jpeg',
        0.95,
      )
    }
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem'))
    img.src = src
  })
}
