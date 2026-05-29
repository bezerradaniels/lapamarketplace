import { useState, useCallback } from 'react'
import type { Product, Store } from '@/types/domain'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function useCatalogPdf() {
  const [isGenerating, setIsGenerating] = useState(false)

  const download = useCallback(
    async (store: Store, products: Product[], storeUrl: string) => {
      setIsGenerating(true)
      try {
        const [{ pdf }, { createElement }, { CatalogPdf }] = await Promise.all([
          import('@react-pdf/renderer'),
          import('react'),
          import('./CatalogPdf'),
        ])
        const element = createElement(CatalogPdf, { store, products, storeUrl })
        // @react-pdf/renderer types its root element as DocumentProps; our
        // CatalogPdf renders a <Document>, so bridge through the pdf() input type.
        const blob = await pdf(element as Parameters<typeof pdf>[0]).toBlob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `catalogo-${slugify(store.name)}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      } finally {
        setIsGenerating(false)
      }
    },
    [],
  )

  return { download, isGenerating }
}
