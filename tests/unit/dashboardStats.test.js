const { bucketOrders, computeKpis } = require('../../utility/dashboardStats');

describe('bucketOrders', () => {
    it('sums each order into the day bucket it falls in', () => {
        const now = new Date('2026-07-20T12:00:00');
        const orders = [
            { createdAt: '2026-07-20T09:00:00', netTotal: 10000 },
            { createdAt: '2026-07-20T18:00:00', netTotal: 5000 },
            { createdAt: '2026-07-19T08:00:00', netTotal: 20000 }
        ];
        const buckets = bucketOrders(orders, 'day', 7, now);
        expect(buckets).toHaveLength(7);
        expect(buckets[6].value).toBe(150); // today: (10000+5000)/100
        expect(buckets[5].value).toBe(200); // yesterday: 20000/100
    });

    it('returns zero-value buckets when there are no matching orders', () => {
        const buckets = bucketOrders([], 'month', 6, new Date('2026-07-20'));
        expect(buckets).toHaveLength(6);
        expect(buckets.every(b => b.value === 0)).toBe(true);
    });

    it('produces distinct labels per unit', () => {
        const now = new Date('2026-07-20');
        expect(bucketOrders([], 'year', 3, now).map(b => b.label)).toEqual(['2024', '2025', '2026']);
        expect(bucketOrders([], 'month', 3, now).every(b => typeof b.label === 'string' && b.label.length > 0)).toBe(true);
    });
});

describe('computeKpis', () => {
    const now = new Date('2026-07-20T12:00:00');

    it('computes all-time totals and a week-over-week delta', () => {
        const orders = [
            { createdAt: '2026-07-19T10:00:00', netTotal: 20000, status: 'delivered' }, // this week
            { createdAt: '2026-07-08T10:00:00', netTotal: 10000, status: 'delivered' }  // last week
        ];
        const kpis = computeKpis(orders, now);
        expect(kpis.totalRevenue).toBe(30000);
        expect(kpis.totalOrders).toBe(2);
        expect(kpis.avgOrderValue).toBe(15000);
        expect(kpis.totalRevenueDeltaPct).toBe(100); // 20000 vs 10000 = +100%
        expect(kpis.orderCountDelta).toBe(0); // 1 this week, 1 last week
    });

    it('returns null delta when there is nothing to compare against', () => {
        const orders = [{ createdAt: now.toISOString(), netTotal: 5000, status: 'pending' }];
        const kpis = computeKpis(orders, now);
        expect(kpis.totalRevenueDeltaPct).toBeNull();
        expect(kpis.avgOrderValueDeltaPct).toBeNull();
    });

    it('reports the count and age of the oldest pending order', () => {
        const orders = [
            { createdAt: '2026-07-19T00:00:00', netTotal: 1000, status: 'pending' },
            { createdAt: '2026-07-18T00:00:00', netTotal: 2000, status: 'pending' },
            { createdAt: '2026-07-19T00:00:00', netTotal: 3000, status: 'delivered' }
        ];
        const kpis = computeKpis(orders, now);
        expect(kpis.pendingCount).toBe(2);
        expect(kpis.oldestPendingHours).toBe(60); // 2026-07-18 00:00 -> 2026-07-20 12:00 = 60h
    });

    it('reports null oldestPendingHours when nothing is pending', () => {
        const orders = [{ createdAt: now.toISOString(), netTotal: 1000, status: 'delivered' }];
        expect(computeKpis(orders, now).oldestPendingHours).toBeNull();
    });
});
