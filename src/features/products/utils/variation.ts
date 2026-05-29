import type { Product, VariationOption } from '@/types/domain'

export function getVariationOption(
  product: Pick<Product, 'variation_options'>,
  selectedVariation?: string | null,
): VariationOption | null {
  if (!selectedVariation) return null
  return (
    (product.variation_options ?? []).find(
      (option) => option.name === selectedVariation,
    ) ?? null
  )
}

export function getVariationImage(
  product: Pick<Product, 'variation_options' | 'images'>,
  selectedVariation?: string | null,
): string | null {
  const option = getVariationOption(product, selectedVariation)
  return option?.image_url ?? product.images[0] ?? null
}

export function getVariationStock(
  product: Pick<Product, 'has_variations' | 'variation_options' | 'stock'>,
  selectedVariation?: string | null,
): number | null {
  if (!product.has_variations) return product.stock ?? null
  const option = getVariationOption(product, selectedVariation)
  return option?.stock ?? null
}

export function getTotalVariationStock(
  product: Pick<Product, 'variation_options'>,
): number | null {
  const stocks = (product.variation_options ?? [])
    .map((option) => option.stock)
    .filter((stock): stock is number => stock != null)

  if (stocks.length === 0) return null
  return stocks.reduce((sum, stock) => sum + stock, 0)
}
