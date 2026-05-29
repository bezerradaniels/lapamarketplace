import { useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ImageIcon, UploadIcon, DeleteIcon } from '@hugeicons/core-free-icons'
import { uploadImage, deleteImageByUrl, UploadError } from '@/lib/supabase'
import type { StorageBucket } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Props = {
  bucket: StorageBucket
  storeId: string
  value: string | null
  onChange: (url: string | null) => void
  /** Optional aspect hint: 'square' (default) or 'landscape'. */
  aspect?: 'square' | 'landscape'
  label?: string
}

export function ImageUploader({
  bucket,
  storeId,
  value,
  onChange,
  aspect = 'square',
  label = 'Imagem',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = () => inputRef.current?.click()

  const handleFile = async (file: File) => {
    setError(null)
    setIsUploading(true)
    try {
      const url = await uploadImage(bucket, storeId, file)
      if (value) {
        deleteImageByUrl(bucket, value).catch(() => {})
      }
      onChange(url)
    } catch (err) {
      setError(
        err instanceof UploadError
          ? err.message
          : 'Não foi possível enviar a imagem.',
      )
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const remove = () => {
    if (!value) return
    deleteImageByUrl(bucket, value).catch(() => {})
    onChange(null)
  }

  const box = aspect === 'square' ? 'aspect-square w-32' : 'aspect-[4/3] w-48'

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold text-z-text-hint">
        {label}
      </span>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={pick}
          disabled={isUploading}
          className={cn(
            box,
            'group relative overflow-hidden rounded-xl border border-z-border bg-z-bg2 transition-colors hover:border-z-green disabled:opacity-60',
          )}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-z-text-hint">
              <HugeiconsIcon icon={ImageIcon} size={22} />
              <span className="text-[11px]">Sem imagem</span>
            </div>
          )}
        </button>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={pick}
            disabled={isUploading}
            className="flex items-center gap-1.5 rounded-lg border border-z-border bg-white px-3 py-1.5 text-xs font-medium hover:bg-z-bg2 disabled:opacity-60"
          >
            <HugeiconsIcon icon={UploadIcon} size={14} />
            {isUploading ? 'Enviando...' : value ? 'Substituir' : 'Enviar imagem'}
          </button>
          {value && (
            <button
              type="button"
              onClick={remove}
              disabled={isUploading}
              className="flex items-center gap-1.5 rounded-lg border border-z-primary/30 bg-z-primary/10 px-3 py-1.5 text-xs font-medium text-z-primary hover:bg-z-primary/15 disabled:opacity-60"
            >
              <HugeiconsIcon icon={DeleteIcon} size={14} />
              Remover
            </button>
          )}
          <span className="text-[11px] text-z-text-hint">
            JPG, PNG, WEBP ou GIF. Máximo 5 MB.
          </span>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleFile(f)
        }}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
