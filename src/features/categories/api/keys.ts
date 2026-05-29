export const categoriesKeys = {
  all: ['categories'] as const,
  list: (storeId: string) => [...categoriesKeys.all, 'list', storeId] as const,
}
