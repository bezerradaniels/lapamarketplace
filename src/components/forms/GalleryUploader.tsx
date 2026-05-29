import { useCallback, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { HugeiconsIcon } from '@hugeicons/react'
import { ImageAddIcon, DeleteIcon, ReloadIcon } from '@hugeicons/core-free-icons'
import { uploadImage, deleteImageByUrl, UploadError } from '@/lib/supabase'
import { Button } from '@/components/ui'

const MAX_IMAGES = 10

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
  rotCtx.drawImage(image, safeArea / 2 - image.width * 0.5, safeArea / 2 - image.height * 0.5)

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
    0, 0, outCanvas.width, outCanvas.height,
  )

  return new Promise((resolve, reject) => {
    outCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas vazio'))),
      'image/webp',
      0.92,
    )
  })
}

type Props = {
  storeId: string
  value: string[]
  onChange: (urls: string[]) => void
}

export function GalleryUploader({ storeId, value, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [srcUrl, setSrcUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canAdd = value.length < MAX_IMAGES

  const pick = () => {
    if (!canAdd) return
    fileInputRef.current?.click()
  }

  const [queue, setQueue] = useState<File[]>([])

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (fileInputRef.current) fileInputRef.current.value = ''
    const remaining = MAX_IMAGES - value.length
    const batch = files.slice(0, remaining)
    if (batch.length === 0) return
    const [first, ...rest] = batch
    setQueue(rest)
    setSrcUrl(URL.createObjectURL(first))
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)
    document.body.style.overflow = 'hidden'
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
      const file = new File([blob], 'gallery.webp', { type: 'image/webp' })
      const url = await uploadImage('store-logos', storeId, file)
      const newValue = [...value, url]
      onChange(newValue)
      URL.revokeObjectURL(srcUrl)

      if (queue.length > 0 && newValue.length < MAX_IMAGES) {
        const [next, ...rest] = queue
        setQueue(rest)
        setSrcUrl(URL.createObjectURL(next))
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setRotation(0)
        setCroppedAreaPixels(null)
        // body overflow stays locked — still showing next crop
      } else {
        handleCancel() // restores body overflow
      }
    } catch (err) {
      setError(err instanceof UploadError ? err.message : 'Não foi possível enviar a imagem.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    if (srcUrl) URL.revokeObjectURL(srcUrl)
    setSrcUrl(null)
    setQueue([])
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)
    document.body.style.overflow = ''
  }

  const remove = (index: number) => {
    const url = value[index]
    deleteImageByUrl('store-logos', url).catch(() => {})
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-z-text-hint">As fotos serão exibidas na página "Sobre" do seu catálogo.</p>

        {/* Grid de miniaturas */}
        {value.length > 0 && (
          <div className="grid grid-cols-6 gap-1">
            {value.map((url, i) => (
              <div key={url} className="group relative aspect-square w-32 overflow-hidden rounded-lg border border-z-border bg-z-bg2">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <HugeiconsIcon icon={DeleteIcon} size={14} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Botão adicionar */}
        {canAdd && (
          <button
            type="button"
            onClick={pick}
            className="flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-85"
            style={{ backgroundColor: '#10b981' }}
          >
            <HugeiconsIcon icon={ImageAddIcon} size={16} />
            Adicionar foto ({value.length}/{MAX_IMAGES})
          </button>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={onFileSelect}
        />
      </div>

      {/* Modal de crop */}
      {srcUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 touch-none overscroll-none">
          <div className="flex w-full max-w-xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Recortar imagem</h3>
              {queue.length > 0 && (
                <span className="text-xs text-z-text-hint">+{queue.length} na fila</span>
              )}
            </div>

            <div className="relative h-72 overflow-hidden rounded-xl bg-neutral-900" style={{ willChange: 'transform' }}>
              <Cropper
                image={srcUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={4 / 3}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

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
