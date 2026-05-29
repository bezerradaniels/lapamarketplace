export const billingKeys = {
  all: ['billing'] as const,
  subscription: (storeId: string) =>
    [...billingKeys.all, 'subscription', storeId] as const,
  invoices: (storeId: string) =>
    [...billingKeys.all, 'invoices', storeId] as const,
  planFeatures: () => [...billingKeys.all, 'plan-features'] as const,
  catalogStatus: (storeId: string) =>
    [...billingKeys.all, 'catalog-status', storeId] as const,
}
