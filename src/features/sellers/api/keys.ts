export const sellersKeys = {
  all: ['sellers'] as const,
  list: (storeId: string) => [...sellersKeys.all, 'list', storeId] as const,
}
