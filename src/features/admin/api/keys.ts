export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  stores: () => [...adminKeys.all, 'stores'] as const,
  store: (id: string) => [...adminKeys.all, 'store', id] as const,
}
