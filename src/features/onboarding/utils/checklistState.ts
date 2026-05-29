const DEFAULT_PRIMARY_COLOR = '#00a82d'

export type ChecklistState = {
  hasProduct: boolean
  hasLogo: boolean
  hasBanner: boolean
  hasColor: boolean
  hasAddress: boolean
  hasCategory: boolean
  hasCoupon: boolean
}

export function buildChecklistState({
  hasProducts,
  logoUrl,
  bannerUrl,
  primaryColor,
  addressCity,
  hasCategories,
  hasCoupons,
}: {
  hasProducts: boolean
  logoUrl: string | null | undefined
  bannerUrl: string | null | undefined
  primaryColor: string | undefined
  addressCity: string | null | undefined
  hasCategories: boolean
  hasCoupons: boolean
}): ChecklistState {
  return {
    hasProduct: hasProducts,
    hasLogo: !!logoUrl,
    hasBanner: !!bannerUrl,
    hasColor: !!primaryColor && primaryColor !== DEFAULT_PRIMARY_COLOR,
    hasAddress: !!addressCity,
    hasCategory: hasCategories,
    hasCoupon: hasCoupons,
  }
}
