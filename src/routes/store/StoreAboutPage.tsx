import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft02Icon,
  WhatsappIcon,
  StoreLocationIcon,
  InstagramIcon,
  LinkSquare02Icon,
} from '@hugeicons/core-free-icons'
import type { Store } from '@/types/domain'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { buildStorePath } from '@/lib/tenant'
import { ImageCarousel, ImageCarouselThumbnails } from '@/components/ui/ImageCarousel'

export default function StoreAboutPage() {
  const store = useOutletContext<Store>()
  const homePath = buildStorePath(store.slug)
  const [galleryActive, setGalleryActive] = useState(0)

  const whatsappUrl = store.whatsapp_phone
    ? buildWhatsAppLink(store.whatsapp_phone, `Olá! Vi o catálogo da ${store.name}.`)
    : null

  const instagramHandle = store.social_links?.instagram?.replace(/^@/, '').trim()
  const instagramUrl = instagramHandle
    ? `https://instagram.com/${instagramHandle}`
    : null

  const customLinks = store.custom_links?.filter((l) => l.label && l.url) ?? []

  return (
    <div className="mx-auto max-w-[728px] px-4 py-5 sm:px-6">
      <div className="mb-4">
        <Link
          to={homePath}
          className="inline-flex items-center gap-1 text-sm text-z-text-muted hover:text-z-text"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={14} />
          Voltar
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {/* Identidade — estilo LinkedIn */}
        <section className="overflow-hidden rounded-2xl border border-z-border bg-white">
          {/* Banner */}
          <div className="relative h-32 sm:h-40 bg-z-bg2">
            {store.banner_url ? (
              <img src={store.banner_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full" style={{ background: 'var(--store-primary)', opacity: 0.15 }} />
            )}
          </div>

          {/* Logo sobreposta */}
          <div className="relative px-5 pb-5">
            <div className="absolute -top-10 left-5">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="h-20 w-20 rounded-xl object-cover ring-4 ring-white"
                />
              ) : (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-xl text-white ring-4 ring-white"
                  style={{ background: 'var(--store-primary)' }}
                >
                  <HugeiconsIcon icon={StoreLocationIcon} size={32} />
                </div>
              )}
            </div>

            <div className="pt-12">
              <h1 className="text-[20px] font-bold leading-tight tracking-tight">{store.name}</h1>
              {store.slogan && (
                <p className="mt-1 text-sm text-z-text-muted">{store.slogan}</p>
              )}
              {(store.address_city && store.address_state) && (
                <p className="mt-1 text-xs text-z-text-hint">
                  {[
                    store.address_street && store.address_number
                      ? `${store.address_street}, ${store.address_number}`
                      : store.address_street,
                    store.address_neighborhood,
                    `${store.address_city}, ${store.address_state}`,
                  ].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Menu âncora */}
        {((whatsappUrl || instagramUrl) || store.gallery_images?.length > 0 || store.about_us || customLinks.length > 0) && (
          <nav className="flex flex-wrap gap-2">
            {(whatsappUrl || instagramUrl) && (
              <a
                href="#contato"
                className="rounded-full border border-z-border bg-white px-3.5 py-1.5 text-sm font-medium text-z-text transition-colors hover:bg-z-bg2"
              >
                Contato
              </a>
            )}
            {store.gallery_images?.length > 0 && (
              <a
                href="#fotos"
                className="rounded-full border border-z-border bg-white px-3.5 py-1.5 text-sm font-medium text-z-text transition-colors hover:bg-z-bg2"
              >
                Fotos
              </a>
            )}
            {store.about_us && (
              <a
                href="#sobre"
                className="rounded-full border border-z-border bg-white px-3.5 py-1.5 text-sm font-medium text-z-text transition-colors hover:bg-z-bg2"
              >
                Sobre
              </a>
            )}
            {customLinks.length > 0 && (
              <a
                href="#links"
                className="rounded-full border border-z-border bg-white px-3.5 py-1.5 text-sm font-medium text-z-text transition-colors hover:bg-z-bg2"
              >
                Links
              </a>
            )}
          </nav>
        )}

        {/* Contato */}
        {(whatsappUrl || instagramUrl) && (
          <section id="contato" className="flex flex-col gap-2 rounded-2xl border border-z-border bg-white p-5 scroll-mt-24">
            <h2 className="mb-1 text-[15px] font-bold">Contato</h2>
            <div className="flex gap-2">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25d366] py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-85"
                >
                  <HugeiconsIcon icon={WhatsappIcon} size={18} />
                  WhatsApp
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-85"
                >
                  <HugeiconsIcon icon={InstagramIcon} size={18} />
                  Instagram
                </a>
              )}
            </div>
          </section>
        )}

        {/* Galeria */}
        {store.gallery_images?.length > 0 && (
          <div id="fotos" className="flex flex-col gap-2 scroll-mt-24">
            <h2 className="text-[15px] font-bold">Galeria da loja</h2>
            <section className="overflow-hidden rounded-2xl border border-z-border bg-white">
              <ImageCarousel images={store.gallery_images} alt={store.name} hideThumbnails active={galleryActive} onActiveChange={setGalleryActive} />
            </section>
            <ImageCarouselThumbnails images={store.gallery_images} active={galleryActive} onSelect={setGalleryActive} />
          </div>
        )}

        {/* Descrição */}
        {store.about_us && (
          <section id="sobre" className="rounded-2xl border border-z-border bg-white p-5 scroll-mt-24">
            <h2 className="mb-2 text-[15px] font-bold">Sobre a loja</h2>
            <p className="text-sm leading-relaxed text-z-text-muted whitespace-pre-line">
              {store.about_us}
            </p>
          </section>
        )}

        {/* Links customizados */}
        {customLinks.length > 0 && (
          <section id="links" className="flex flex-col gap-2 rounded-2xl border border-z-border bg-white p-5 scroll-mt-24">
            <h2 className="mb-1 text-[15px] font-bold">Links</h2>
            {customLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-z-border py-3 text-[15px] font-semibold text-z-text transition-colors hover:bg-z-bg2"
              >
                <HugeiconsIcon icon={LinkSquare02Icon} size={18} className="text-z-text-hint" />
                {link.label}
              </a>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
