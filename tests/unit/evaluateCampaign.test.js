const {
    evaluateCondition,
    campaignMatches,
    computeDiscountAmount,
    pickBestAutomaticCampaign,
    findCampaignByCode,
    pickBestMarketingCampaign
} = require('../../utility/evaluateCampaign');

function item(overrides = {}) {
    return { _id: 'p1', name: 'Ürün', price: 10000, quantity: 1, sku: 'SKU-1', categories: ['cat1'], brand: 'brand1', ...overrides };
}

function campaign(overrides = {}) {
    return {
        isActive: true,
        conditions: [],
        discountType: 'percentage',
        discountValue: 10,
        appliesTo: 'cartTotal',
        ...overrides
    };
}

describe('evaluateCondition', () => {
    it('matches a product by SKU', () => {
        const condition = { type: 'product', field: 'sku', operator: 'in', values: ['SKU-1'] };
        expect(evaluateCondition(condition, { cartItems: [item()] })).toBe(true);
        expect(evaluateCondition(condition, { cartItems: [item({ sku: 'OTHER' })] })).toBe(false);
    });

    it('matches a product by category', () => {
        const condition = { type: 'product', field: 'category', operator: 'in', values: ['cat1'] };
        expect(evaluateCondition(condition, { cartItems: [item()] })).toBe(true);
        expect(evaluateCondition(condition, { cartItems: [item({ categories: ['cat2'] })] })).toBe(false);
    });

    it('matches a product by brand', () => {
        const condition = { type: 'product', field: 'brand', operator: 'in', values: ['brand1'] };
        expect(evaluateCondition(condition, { cartItems: [item()] })).toBe(true);
        expect(evaluateCondition(condition, { cartItems: [item({ brand: 'brand2' })] })).toBe(false);
    });

    it('matches a user by id or email', () => {
        const condition = { type: 'user', operator: 'in', values: ['user@example.com'] };
        expect(evaluateCondition(condition, { cartItems: [], user: { _id: 'u1', email: 'user@example.com' } })).toBe(true);
        expect(evaluateCondition(condition, { cartItems: [], user: { _id: 'u1', email: 'other@example.com' } })).toBe(false);
        expect(evaluateCondition(condition, { cartItems: [] })).toBe(false);
    });

    it('matches cartTotal gte/lte', () => {
        const items = [item({ price: 30000, quantity: 1 })];
        expect(evaluateCondition({ type: 'cartTotal', operator: 'gte', value: 20000 }, { cartItems: items })).toBe(true);
        expect(evaluateCondition({ type: 'cartTotal', operator: 'gte', value: 40000 }, { cartItems: items })).toBe(false);
        expect(evaluateCondition({ type: 'cartTotal', operator: 'lte', value: 40000 }, { cartItems: items })).toBe(true);
    });
});

describe('campaignMatches', () => {
    it('requires ALL conditions to match (AND)', () => {
        const c = campaign({
            conditions: [
                { type: 'cartTotal', operator: 'gte', value: 5000 },
                { type: 'product', field: 'sku', operator: 'in', values: ['SKU-1'] }
            ]
        });
        expect(campaignMatches(c, { cartItems: [item()] })).toBe(true);
        expect(campaignMatches(c, { cartItems: [item({ sku: 'OTHER' })] })).toBe(false);
    });

    it('rejects an inactive campaign', () => {
        const c = campaign({ isActive: false, conditions: [{ type: 'cartTotal', operator: 'gte', value: 0 }] });
        expect(campaignMatches(c, { cartItems: [item()] })).toBe(false);
    });

    it('respects start/end date range', () => {
        const now = new Date('2026-06-15');
        const c = campaign({
            conditions: [{ type: 'cartTotal', operator: 'gte', value: 0 }],
            startDate: '2026-06-01',
            endDate: '2026-06-30'
        });
        expect(campaignMatches(c, { cartItems: [item()] }, now)).toBe(true);
        expect(campaignMatches(c, { cartItems: [item()] }, new Date('2026-07-01'))).toBe(false);
        expect(campaignMatches(c, { cartItems: [item()] }, new Date('2026-05-01'))).toBe(false);
    });
});

describe('computeDiscountAmount', () => {
    it('computes a percentage discount on the cart total', () => {
        const c = campaign({ discountType: 'percentage', discountValue: 10, appliesTo: 'cartTotal' });
        const items = [item({ price: 100000, quantity: 1 })];
        expect(computeDiscountAmount(c, items)).toBe(10000);
    });

    it('computes a fixed discount capped at the base amount', () => {
        const c = campaign({ discountType: 'fixed', discountValue: 999999, appliesTo: 'cartTotal' });
        const items = [item({ price: 5000, quantity: 1 })];
        expect(computeDiscountAmount(c, items)).toBe(5000);
    });

    it('applies only to matching items when appliesTo is matchingItems', () => {
        const c = campaign({
            discountType: 'percentage',
            discountValue: 50,
            appliesTo: 'matchingItems',
            conditions: [{ type: 'product', field: 'brand', operator: 'in', values: ['brand1'] }]
        });
        const items = [
            item({ _id: 'a', price: 10000, quantity: 1, brand: 'brand1' }),
            item({ _id: 'b', price: 10000, quantity: 1, brand: 'brand2' })
        ];
        // Only item 'a' (brand1) counts toward the discount base.
        expect(computeDiscountAmount(c, items)).toBe(5000);
    });
});

describe('pickBestAutomaticCampaign', () => {
    it('ignores code-based campaigns and picks the highest-discount match', () => {
        const cheap = campaign({ discountType: 'fixed', discountValue: 1000, conditions: [{ type: 'cartTotal', operator: 'gte', value: 0 }] });
        const generous = campaign({ discountType: 'fixed', discountValue: 3000, conditions: [{ type: 'cartTotal', operator: 'gte', value: 0 }] });
        const coded = campaign({ code: 'SECRET', discountType: 'fixed', discountValue: 9000, conditions: [{ type: 'cartTotal', operator: 'gte', value: 0 }] });
        const items = [item({ price: 10000, quantity: 1 })];

        const result = pickBestAutomaticCampaign([cheap, generous, coded], { cartItems: items });
        expect(result.campaign).toBe(generous);
        expect(result.amount).toBe(3000);
    });

    it('returns null when nothing matches', () => {
        const c = campaign({ conditions: [{ type: 'cartTotal', operator: 'gte', value: 999999999 }] });
        expect(pickBestAutomaticCampaign([c], { cartItems: [item()] })).toBeNull();
    });
});

describe('findCampaignByCode', () => {
    it('is case-insensitive and requires conditions to still match', () => {
        const c = campaign({ code: 'YAZ2026', conditions: [{ type: 'cartTotal', operator: 'gte', value: 5000 }] });
        const items = [item({ price: 10000, quantity: 1 })];

        expect(findCampaignByCode([c], 'yaz2026', { cartItems: items })).not.toBeNull();
        expect(findCampaignByCode([c], 'wrong-code', { cartItems: items })).toBeNull();
        expect(findCampaignByCode([c], 'YAZ2026', { cartItems: [item({ price: 1000, quantity: 1 })] })).toBeNull();
    });
});

describe('pickBestMarketingCampaign', () => {
    it('excludes code-based campaigns and picks the highest discountValue', () => {
        const low = campaign({ discountValue: 5 });
        const high = campaign({ discountValue: 20 });
        const coded = campaign({ code: 'X', discountValue: 90 });
        expect(pickBestMarketingCampaign([low, high, coded])).toBe(high);
    });

    it('returns null when no campaign is currently active/in range', () => {
        expect(pickBestMarketingCampaign([campaign({ isActive: false })])).toBeNull();
    });
});
