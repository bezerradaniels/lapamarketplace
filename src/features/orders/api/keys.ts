export const ordersKeys = {
  all: ['orders'] as const,
  list: (storeId: string) => [...ordersKeys.all, 'list', storeId] as const,
  byId: (id: string) => [...ordersKeys.all, 'byId', id] as const,
}
