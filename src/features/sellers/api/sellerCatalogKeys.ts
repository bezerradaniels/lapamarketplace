export const sellerCatalogKeys = {
  all: ['sellerCatalogs'] as const,
  list: (storeId: string) => [...sellerCatalogKeys.all, 'list', storeId] as const,
  detail: (id: string) => [...sellerCatalogKeys.all, 'detail', id] as const,
}
