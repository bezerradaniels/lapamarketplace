export const productsKeys = {
  all: ['products'] as const,
  list: (storeId: string) => [...productsKeys.all, 'list', storeId] as const,
  publicList: (storeId: string) =>
    [...productsKeys.all, 'publicList', storeId] as const,
  byId: (id: string) => [...productsKeys.all, 'byId', id] as const,
}
