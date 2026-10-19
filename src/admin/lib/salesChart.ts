import type { RevenueTrendPoint } from '@/admin/types/admin';

export function fillRevenueTrend(points: RevenueTrendPoint[], days = 30) {
  const map = new Map(points.map((p) => [p._id, p]));
  const result: { date: string; label: string; revenue: number; orders: number }[] = [];
  const end = new Date();
  end.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const row = map.get(key);
    result.push({
      date: key,
      label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      revenue: row?.revenue || 0,
      orders: row?.orders || 0,
    });
  }

  return result;
}
