// Pure functions — the heavy per-order revenue math (summing embedded item
// arrays, subtracting discounts) happens in MongoDB via aggregation
// (controllers/admin.js getDashboard); everything here just buckets and
// compares the already-slim {createdAt, status, netTotal} summaries it
// returns, which is cheap regardless of order volume.

const MONTH_LABELS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function startOfUnit(date, unit) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (unit === 'day') return d;
    if (unit === 'week') {
        const day = d.getDay();
        const diffToMonday = day === 0 ? 6 : day - 1;
        d.setDate(d.getDate() - diffToMonday);
        return d;
    }
    if (unit === 'month') {
        d.setDate(1);
        return d;
    }
    if (unit === 'year') {
        d.setMonth(0, 1);
        return d;
    }
    throw new Error(`Bilinmeyen zaman birimi: ${unit}`);
}

function addUnit(date, unit, amount) {
    const d = new Date(date);
    if (unit === 'day') d.setDate(d.getDate() + amount);
    else if (unit === 'week') d.setDate(d.getDate() + amount * 7);
    else if (unit === 'month') d.setMonth(d.getMonth() + amount);
    else if (unit === 'year') d.setFullYear(d.getFullYear() + amount);
    else throw new Error(`Bilinmeyen zaman birimi: ${unit}`);
    return d;
}

function formatLabel(date, unit) {
    if (unit === 'year') return String(date.getFullYear());
    if (unit === 'month') return MONTH_LABELS[date.getMonth()];
    return `${date.getDate()} ${MONTH_LABELS[date.getMonth()]}`;
}

// Builds `count` consecutive buckets of `unit` size ending at the bucket
// containing `now`, and sums each matched order's netTotal into the bucket
// its createdAt falls into.
function bucketOrders(orderSummaries, unit, count, now = new Date()) {
    const currentBucketStart = startOfUnit(now, unit);
    const buckets = [];
    for (let i = count - 1; i >= 0; i--) {
        const start = addUnit(currentBucketStart, unit, -i);
        buckets.push({ start, end: addUnit(start, unit, 1), label: formatLabel(start, unit), value: 0 });
    }

    for (const order of orderSummaries) {
        if (!order.createdAt) continue;
        const created = new Date(order.createdAt);
        const bucket = buckets.find(b => created >= b.start && created < b.end);
        if (bucket) bucket.value += order.netTotal;
    }

    return buckets.map(b => ({ label: b.label, value: Math.round(b.value) / 100 }));
}

function sumNetTotal(orders) {
    return orders.reduce((sum, o) => sum + o.netTotal, 0);
}

function percentDelta(current, previous) {
    if (previous <= 0) return null;
    return Math.round(((current - previous) / previous) * 100);
}

// Business totals (all-time) paired with a week-over-week trend signal —
// not "this all-time total changed by X%", but "here's recent momentum."
function computeKpis(orderSummaries, now = new Date()) {
    const weekAgo = addUnit(now, 'day', -7);
    const twoWeeksAgo = addUnit(now, 'day', -14);

    const thisWeek = orderSummaries.filter(o => new Date(o.createdAt) >= weekAgo);
    const lastWeek = orderSummaries.filter(o => {
        const created = new Date(o.createdAt);
        return created >= twoWeeksAgo && created < weekAgo;
    });

    const totalRevenue = sumNetTotal(orderSummaries);
    const totalOrders = orderSummaries.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const thisWeekRevenue = sumNetTotal(thisWeek);
    const lastWeekRevenue = sumNetTotal(lastWeek);
    const thisWeekAvg = thisWeek.length > 0 ? thisWeekRevenue / thisWeek.length : 0;
    const lastWeekAvg = lastWeek.length > 0 ? lastWeekRevenue / lastWeek.length : 0;

    const pendingOrders = orderSummaries.filter(o => o.status === 'pending');
    const oldestPending = pendingOrders.length > 0
        ? pendingOrders.reduce((oldest, o) => (new Date(o.createdAt) < new Date(oldest.createdAt) ? o : oldest))
        : null;

    return {
        totalRevenue: Math.round(totalRevenue),
        totalRevenueDeltaPct: percentDelta(thisWeekRevenue, lastWeekRevenue),
        totalOrders,
        orderCountDelta: thisWeek.length - lastWeek.length,
        avgOrderValue: Math.round(avgOrderValue),
        avgOrderValueDeltaPct: percentDelta(thisWeekAvg, lastWeekAvg),
        pendingCount: pendingOrders.length,
        oldestPendingHours: oldestPending
            ? Math.round((now - new Date(oldestPending.createdAt)) / (1000 * 60 * 60))
            : null
    };
}

module.exports = { startOfUnit, addUnit, formatLabel, bucketOrders, computeKpis };
