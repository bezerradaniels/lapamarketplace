import { useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ArrowLeft02Icon, ArrowRight02Icon } from '@hugeicons/core-free-icons'
import { OptimizedImage } from '@/components/ui/OptimizedImage'

type Props = {
  images: string[]
  alt?: string
  hideThumbnails?: boolean
  active?: number
  onActiveChange?: (i: number) => void
}

export function ImageCarousel({ images, alt = '', hideThumbnails = false, active: activeProp, onActiveChange }: Props) {
  const [internalActive, setInternalActive] = useState(0)
  const active = activeProp ?? internalActive
  const setActive = (i: number | ((prev: number) => number)) => {
    const next = typeof i === 'function' ? i(active) : i
    setInternalActive(next)
    onActiveChange?.(next)
  }

  if (images.length === 0) return null

  const hasMultiple = images.length > 1

  const goPrev = () => setActive((i) => (i === 0 ? images.length - 1 : i - 1))
  const goNext = () => setActive((i) => (i === images.length - 1 ? 0 : i + 1))

  return (
    <div className="flex flex-col">
      {/* Imagem principal */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <span className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-sm">
          {active + 1}/{images.length} {images.length === 1 ? 'foto' : 'fotos'}
        </span>
        <OptimizedImage
          src={images[active]}
          transform={{ width: 900, quality: 88 }}
          alt={alt}
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover transition-all duration-300"
        />
        {hasMultiple && (
          <>
            <CarouselArrow direction="prev" icon={ArrowLeft02Icon} onClick={goPrev} />
            <CarouselArrow direction="next" icon={ArrowRight02Icon} onClick={goNext} />
          </>
        )}
      </div>

      {/* Thumbnails inline (quando não está em modo externo) */}
      {hasMultiple && !hideThumbnails && (
        <Thumbnails images={images} active={active} onSelect={setActive} />
      )}
    </div>
  )
}

type ThumbnailsProps = {
  images: string[]
  active?: number
  onSelect?: (i: number) => void
}

function Thumbnails({ images, active = 0, onSelect }: ThumbnailsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto p-3">
      {images.map((img, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect?.(i)}
          className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white transition-all"
          style={{
            border:
              active === i
                ? '2px solid var(--store-primary, #10b981)'
                : '1px solid rgba(0,0,0,0.08)',
          }}
          aria-label={`Foto ${i + 1}`}
        >
          <OptimizedImage
            src={img}
            transform={{ width: 128, quality: 80 }}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </button>
      ))}
    </div>
  )
}

export function ImageCarouselThumbnails({
  images,
  active,
  onSelect,
}: {
  images: string[]
  active: number
  onSelect: (i: number) => void
}) {
  if (images.length <= 1) return null
  return <Thumbnails images={images} active={active} onSelect={onSelect} />
}

function CarouselArrow({
  direction,
  icon,
  onClick,
}: {
  direction: 'prev' | 'next'
  icon: IconSvgElement
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Foto anterior' : 'Próxima foto'}
      className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-z-text shadow-z transition-colors hover:bg-white ${
        direction === 'prev' ? 'left-3' : 'right-3'
      }`}
    >
      <HugeiconsIcon icon={icon} size={18} />
    </button>
  )
}
