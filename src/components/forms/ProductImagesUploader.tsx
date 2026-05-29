import { useCallback, useEffect, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ImageIcon,
  PlusSignIcon,
  CameraAdd01Icon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  DeleteIcon,
  ReloadIcon,
} from '@hugeicons/core-free-icons'
import { uploadImage, deleteImageByUrl, UploadError } from '@/lib/supabase'
import { Badge, Button } from '@/components/ui'

type Props = {
  storeId: string
  value: string[]
  onChange: (urls: string[]) => void
  max?: number
}

function guessMimeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
    default:
      return ''
  }
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

  // Step 1: draw full image with rotation on a safe-size canvas
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

  // Step 2: extract crop area, upscaling if needed
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

export function ProductImagesUploader({
  storeId,
  value,
  onChange,
  max = 6,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [queue, setQueue] = useState<File[]>([])
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const pick = () => inputRef.current?.click()
  const pickCamera = () => cameraInputRef.current?.click()

  useEffect(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.setAttribute('capture', 'environment')
    }
  }, [])

  // Manages the object-URL lifecycle for the first queued file (created here,
  // revoked on cleanup), so it must live in an effect rather than render.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (queue.length === 0) {
      setImageSrc(null)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
      setCroppedAreaPixels(null)
      return
    }
    const url = URL.createObjectURL(queue[0])
    setImageSrc(url)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)
    return () => URL.revokeObjectURL(url)
  }, [queue])
  /* eslint-enable react-hooks/set-state-in-effect */

  const onCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleSelectFiles = (files: FileList) => {
    setError(null)
    const remaining = max - value.length
    const list = Array.from(files).slice(0, Math.max(0, remaining))
    if (list.length === 0) return

    for (const file of list) {
      const mime = file.type || guessMimeFromName(file.name)
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mime)) {
        setError('Formato inválido. Use JPG, PNG, WEBP ou GIF.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Imagem muito grande. Máximo 5 MB.')
        return
      }
    }

    setQueue(list)
  }

  const uploadBlob = async (blob: Blob) => {
    const file = new File([blob], 'image.webp', { type: 'image/webp' })
    const url = await uploadImage('product-images', storeId, file)
    onChange([...value, url])
    setQueue((q) => q.slice(1))
  }

  const handleConfirmCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setIsUploading(true)
    try {
      const blob = await cropToBlob(imageSrc, croppedAreaPixels, rotation)
      await uploadBlob(blob)
    } catch (err) {
      setError(
        err instanceof UploadError ? err.message : 'Não foi possível enviar a imagem.',
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleSkipCrop = async () => {
    if (!imageSrc) return
    setIsUploading(true)
    try {
      const img = await loadImage(imageSrc)
      const fullCrop: Area = { x: 0, y: 0, width: img.width, height: img.height }
      const blob = await cropToBlob(imageSrc, fullCrop, rotation)
      await uploadBlob(blob)
    } catch (err) {
      setError(
        err instanceof UploadError ? err.message : 'Não foi possível enviar a imagem.',
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => setQueue([])

  const remove = (url: string) => {
    deleteImageByUrl('product-images', url).catch(() => {})
    onChange(value.filter((u) => u !== url))
  }

  const move = (index: number, delta: number) => {
    const next = [...value]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const setAsCover = (index: number) => {
    const next = [...value]
    const [cover] = next.splice(index, 1)
    onChange([cover, ...next])
  }

  const canAdd = value.length < max

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-z-text-muted">
          <strong className="text-z-text">{value.length}</strong> de {max} imagens
        </span>
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
        {value.map((url, i) => (
          <li key={url} className="flex flex-col gap-1">
            <div className="group relative overflow-hidden rounded-xl border border-z-border bg-z-bg2">
              <img src={url} alt="" className="aspect-square w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5">
                  <Badge tone="green">Capa</Badge>
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-white/90 p-1 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-z-border bg-white hover:bg-z-bg2 disabled:opacity-40"
                  title="Mover para esquerda"
                >
                  <HugeiconsIcon icon={ArrowLeft02Icon} size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-z-border bg-white hover:bg-z-bg2 disabled:opacity-40"
                  title="Mover para direita"
                >
                  <HugeiconsIcon icon={ArrowRight02Icon} size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(url)}
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-z-primary/30 bg-z-primary/10 text-z-primary hover:bg-z-primary/15"
                  title="Remover"
                >
                  <HugeiconsIcon icon={DeleteIcon} size={12} />
                </button>
              </div>
            </div>
            {value.length > 1 && i !== 0 && (
              <button
                type="button"
                onClick={() => setAsCover(i)}
                className="text-center text-[10px] font-medium text-z-text-muted transition-colors hover:text-z-green"
              >
                Usar como capa
              </button>
            )}
          </li>
        ))}

        {canAdd && (
          <li className="col-span-full">
            <div className="grid w-full grid-cols-2 gap-3">
              <button
                type="button"
                onClick={pickCamera}
                disabled={isUploading}
                className="flex h-24 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-z-border bg-white text-z-text-muted transition-colors hover:border-z-green hover:bg-z-bg2 disabled:opacity-60"
              >
                <HugeiconsIcon icon={CameraAdd01Icon} size={20} />
                <span className="text-[11px] font-medium">Tirar foto</span>
              </button>
              <button
                type="button"
                onClick={pick}
                disabled={isUploading}
                className="flex h-24 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-z-border bg-white text-z-text-muted transition-colors hover:border-z-green hover:bg-z-bg2 disabled:opacity-60"
              >
                <HugeiconsIcon
                  icon={value.length === 0 ? ImageIcon : PlusSignIcon}
                  size={20}
                />
                <span className="text-[11px] font-medium">
                  {value.length === 0 ? 'Galeria' : 'Adicionar mais'}
                </span>
              </button>
            </div>
          </li>
        )}
      </ul>

      <span className="text-[11px] text-z-text-hint">
        JPG, PNG, WEBP ou GIF — máximo 5 MB por imagem. A primeira é a capa.
      </span>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0)
            handleSelectFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0)
            handleSelectFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Crop editor */}
      {imageSrc && queue.length > 0 && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
          <div className="flex w-full max-w-lg flex-col gap-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Recortar imagem</h3>
              <span className="text-xs text-z-text-muted">
                {queue.length > 1 ? `${queue.length} restantes` : 'Última imagem'}
              </span>
            </div>

            {/* Crop area — fixed height, image pans inside */}
            <div className="relative h-72 overflow-hidden rounded-xl bg-neutral-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
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

            <div className="grid grid-cols-3 gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isUploading}>
                Cancelar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkipCrop}
                disabled={isUploading}
              >
                Sem recorte
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmCrop}
                disabled={isUploading || !croppedAreaPixels}
              >
                {isUploading ? 'Enviando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
