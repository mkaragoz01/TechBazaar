const {
    evaluateCondition,
    campaignMatches,
    matchingGroupFor,
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

    it('matches a product name substring, case-insensitively', () => {
        const condition = { type: 'productName', operator: 'contains', text: 'pro' };
        expect(evaluateCondition(condition, { cartItems: [item({ name: 'iPhone Pro' })] })).toBe(true);
        expect(evaluateCondition(condition, { cartItems: [item({ name: 'PRODUCT X' })] })).toBe(true);
        expect(evaluateCondition(condition, { cartItems: [item({ name: 'Basic Model' })] })).toBe(false);
    });

    it('never matches an empty productName text', () => {
        const condition = { type: 'productName', operator: 'contains', text: '' };
        expect(evaluateCondition(condition, { cartItems: [item({ name: 'Anything' })] })).toBe(false);
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

    it('matches if ANY conditionGroup matches (OR), requiring ALL conditions within a group (AND)', () => {
        const c = campaign({
            conditions: undefined,
            conditionGroups: [
                { conditions: [{ type: 'cartTotal', operator: 'gte', value: 999999 }, { type: 'product', field: 'sku', operator: 'in', values: ['SKU-1'] }] },
                { conditions: [{ type: 'productName', operator: 'contains', text: 'pro' }] }
            ]
        });
        // First group: cartTotal fails even though the sku matches (AND) — no match via group 1.
        // Second group: productName matches on its own — campaign matches via group 2 (OR).
        expect(campaignMatches(c, { cartItems: [item({ name: 'iPhone Pro' })] })).toBe(true);
        // Neither group's conditions are satisfied.
        expect(campaignMatches(c, { cartItems: [item({ name: 'Basic', sku: 'OTHER' })] })).toBe(false);
    });

    it('matchingGroupFor returns the specific group that matched', () => {
        const c = campaign({
            conditions: undefined,
            conditionGroups: [
                { conditions: [{ type: 'cartTotal', operator: 'gte', value: 999999 }] },
                { conditions: [{ type: 'productName', operator: 'contains', text: 'pro' }] }
            ]
        });
        const group = matchingGroupFor(c, { cartItems: [item({ name: 'iPhone Pro' })] });
        expect(group).toBe(c.conditionGroups[1]);
        expect(matchingGroupFor(c, { cartItems: [item({ name: 'Basic' })] })).toBeNull();
    });

    it('still evaluates a pre-second-pass campaign that only has a flat `conditions` field', () => {
        const c = campaign({ conditions: [{ type: 'cartTotal', operator: 'gte', value: 5000 }] });
        expect(c.conditionGroups).toBeUndefined();
        expect(campaignMatches(c, { cartItems: [item({ price: 10000, quantity: 1 })] })).toBe(true);
        expect(campaignMatches(c, { cartItems: [item({ price: 1000, quantity: 1 })] })).toBe(false);
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

    it('with a group argument, only that group\'s product-like conditions decide matching items', () => {
        const c = campaign({
            conditions: undefined,
            discountType: 'percentage',
            discountValue: 50,
            appliesTo: 'matchingItems',
            conditionGroups: [
                // This group would match brand2 items, but it's not the group
                // that actually matched this cart/user context.
                { conditions: [{ type: 'product', field: 'brand', operator: 'in', values: ['brand2'] }] },
                { conditions: [{ type: 'productName', operator: 'contains', text: 'pro' }] }
            ]
        });
        const items = [
            item({ _id: 'a', name: 'iPhone Pro', price: 10000, quantity: 1, brand: 'brand2' }),
            item({ _id: 'b', name: 'Basic Model', price: 10000, quantity: 1, brand: 'brand2' })
        ];
        const matchedGroup = c.conditionGroups[1];
        // Only item 'a' (name contains "pro") counts — item 'b' would satisfy
        // group 1's brand condition, but group 1 isn't the one that matched.
        expect(computeDiscountAmount(c, items, matchedGroup)).toBe(5000);
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
