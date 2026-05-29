export const couponsKeys = {
  all: ['coupons'] as const,
  list: (storeId: string) => [...couponsKeys.all, 'list', storeId] as const,
}
