export function filterPendingItems<T extends { deliveredAt: string | null }>(items: T[]): T[] {
  return items.filter((item) => !item.deliveredAt)
}
