import { useCallback, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { HugeiconsIcon } from '@hugeicons/react'
import { ImageIcon, UploadIcon, DeleteIcon, ReloadIcon } from '@hugeicons/core-free-icons'
import { uploadImage, deleteImageByUrl, UploadError } from '@/lib/supabase'
import type { StorageBucket } from '@/lib/supabase'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

type Props = {
  bucket: StorageBucket
  storeId: string
  value: string | null
  onChange: (url: string | null) => void
  /** Width / height ratio. 1 = square logo, 1.6 = 16:10 banner. */
  aspect?: number
  label?: string
  hint?: string
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

async function cropToBlob(imageSrc: string, pixelCrop: Area, rotation: number): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const maxSize = Math.max(image.width, image.height)
  const safeArea = Math.ceil(2 * ((maxSize / 2) * Math.sqrt(2)))

  const rotCanvas = document.createElement('canvas')
  rotCanvas.width = safeArea
  rotCanvas.height = safeArea
  const rotCtx = rotCanvas.getContext('2d')!
  rotCtx.translate(safeArea / 2, safeArea / 2)
  rotCtx.rotate((rotation * Math.PI) / 180)
  rotCtx.translate(-safeArea / 2, -safeArea / 2)
  rotCtx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5,
  )

  const scale = pixelCrop.width < 800 ? 800 / pixelCrop.width : 1
  const outCanvas = document.createElement('canvas')
  outCanvas.width = Math.round(pixelCrop.width * scale)
  outCanvas.height = Math.round(pixelCrop.height * scale)
  const outCtx = outCanvas.getContext('2d')!
  outCtx.imageSmoothingEnabled = true
  outCtx.imageSmoothingQuality = 'high'
  outCtx.drawImage(
    rotCanvas,
    Math.round(safeArea / 2 - image.width * 0.5 + pixelCrop.x),
    Math.round(safeArea / 2 - image.height * 0.5 + pixelCrop.y),
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outCanvas.width,
    outCanvas.height,
  )

  return new Promise((resolve, reject) => {
    outCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas vazio'))),
      'image/webp',
      0.92,
    )
  })
}

export function ImageCropUploader({
  bucket,
  storeId,
  value,
  onChange,
  aspect = 1,
  label = 'Imagem',
  hint,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [srcUrl, setSrcUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = () => fileInputRef.current?.click()

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileInputRef.current) fileInputRef.current.value = ''
    const url = URL.createObjectURL(file)
    setSrcUrl(url)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!srcUrl || !croppedAreaPixels) return
    setError(null)
    setIsUploading(true)
    try {
      const blob = await cropToBlob(srcUrl, croppedAreaPixels, rotation)
      const file = new File([blob], 'image.webp', { type: 'image/webp' })
      if (value) deleteImageByUrl(bucket, value).catch(() => {})
      const url = await uploadImage(bucket, storeId, file)
      onChange(url)
      handleCancel()
    } catch (err) {
      setError(
        err instanceof UploadError ? err.message : 'Não foi possível enviar a imagem.',
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    if (srcUrl) URL.revokeObjectURL(srcUrl)
    setSrcUrl(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)
  }

  const remove = () => {
    if (!value) return
    deleteImageByUrl(bucket, value).catch(() => {})
    onChange(null)
  }

  const thumbH = aspect >= 2 ? 'h-16' : 'h-20'
  const thumbW = aspect >= 2 ? 'w-32' : aspect === 1 ? 'w-20' : 'w-28'

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold text-z-text-hint">
          {label}
        </span>

        {value ? (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'shrink-0 overflow-hidden rounded-lg border border-z-border bg-z-bg2',
                thumbH,
                thumbW,
              )}
            >
              <img src={value} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={pick}
                className="flex items-center gap-1.5 rounded-lg border border-z-border bg-white px-3 py-1.5 text-xs font-medium hover:bg-z-bg2"
              >
                <HugeiconsIcon icon={UploadIcon} size={13} />
                Substituir
              </button>
              <button
                type="button"
                onClick={remove}
                className="flex items-center gap-1.5 rounded-lg border border-z-primary/30 bg-z-primary/10 px-3 py-1.5 text-xs font-medium text-z-primary hover:bg-z-primary/15"
              >
                <HugeiconsIcon icon={DeleteIcon} size={13} />
                Remover
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={pick}
            className="flex w-fit items-center gap-2 rounded-lg border border-dashed border-z-green bg-z-green/5 px-4 py-2 text-xs font-medium text-z-green transition-colors hover:bg-z-green/10"
          >
            <HugeiconsIcon icon={ImageIcon} size={15} />
            Clique para enviar
          </button>
        )}

        {hint && <span className="text-[11px] text-z-text-hint">{hint}</span>}
        {error && <p className="text-xs text-destructive">{error}</p>}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onFileSelect}
        />
      </div>

      {/* Crop modal */}
      {srcUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="flex w-full max-w-xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold">Recortar imagem</h3>

            {/* Crop area — fixed height, image pans inside */}
            <div className="relative h-72 overflow-hidden rounded-xl bg-neutral-900">
              <Cropper
                image={srcUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            {/* Zoom slider */}
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-[11px] text-z-text-muted">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-z-green"
              />
            </div>

            {/* Rotation */}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setRotation((r) => r - 90)}
                disabled={isUploading}
                className="flex items-center gap-1.5 rounded-lg border border-z-border bg-white px-3 py-1.5 text-xs font-medium hover:bg-z-bg2 disabled:opacity-60"
              >
                <HugeiconsIcon icon={ReloadIcon} size={14} className="-scale-x-100" />
                Girar esquerda
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => r + 90)}
                disabled={isUploading}
                className="flex items-center gap-1.5 rounded-lg border border-z-border bg-white px-3 py-1.5 text-xs font-medium hover:bg-z-bg2 disabled:opacity-60"
              >
                <HugeiconsIcon icon={ReloadIcon} size={14} />
                Girar direita
              </button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleCancel} disabled={isUploading}>
                Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={isUploading || !croppedAreaPixels}>
                {isUploading ? 'Enviando...' : 'Confirmar recorte'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
