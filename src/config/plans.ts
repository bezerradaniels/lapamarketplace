import type { PlanId } from '@/types/domain'

export type PlanConfig = {
  id: PlanId
  name: string
  priceInCents: number
  priceInCentsAnnual: number
  maxProducts: number | null
  maxSellers: number
  maxCoupons: number | null
  hasFeaturedProducts: boolean
  hasPdfExport: boolean
  hasCustomTheme: boolean
  hasAiHelpers: boolean
  stripePriceId: string
  stripePriceIdAnnual: string
}

export const PLANS: Record<PlanId, PlanConfig> = {
  basico: {
    id: 'basico',
    name: 'Básico',
    priceInCents: 990,
    priceInCentsAnnual: 10692,
    maxProducts: 10,
    maxSellers: 0,
    maxCoupons: 1,
    hasFeaturedProducts: false,
    hasPdfExport: false,
    hasCustomTheme: false,
    hasAiHelpers: false,
    stripePriceId: 'price_1TbMQb1oLw5d2Hz3YJfgWwv9',
    stripePriceIdAnnual: 'price_1TbMQg1oLw5d2Hz3SXpCAriP',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceInCents: 1990,
    priceInCentsAnnual: 19104,
    maxProducts: 100,
    maxSellers: 3,
    maxCoupons: 5,
    hasFeaturedProducts: false,
    hasPdfExport: true,
    hasCustomTheme: true,
    hasAiHelpers: true,
    stripePriceId: 'price_1TbMQb1oLw5d2Hz3pvTSPKMz',
    stripePriceIdAnnual: 'price_1TbMQg1oLw5d2Hz34oXnpGtp',
  },
  premium: {
    id: 'premium',
    name: 'Ilimitado',
    priceInCents: 2990,
    priceInCentsAnnual: 25116,
    maxProducts: null,
    maxSellers: Infinity,
    maxCoupons: Infinity,
    hasFeaturedProducts: true,
    hasPdfExport: true,
    hasCustomTheme: true,
    hasAiHelpers: true,
    stripePriceId: 'price_1TbMQb1oLw5d2Hz3Fl8g9l6B',
    stripePriceIdAnnual: 'price_1TbMQh1oLw5d2Hz3cls8wmCQ',
  },
}

export const TRIAL_DAYS = 7
