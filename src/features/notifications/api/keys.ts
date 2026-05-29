export const notificationsKeys = {
  all: ['notifications'] as const,
  list: (storeId: string) => [...notificationsKeys.all, 'list', storeId] as const,
  unread: (storeId: string) =>
    [...notificationsKeys.all, 'unread', storeId] as const,
}
