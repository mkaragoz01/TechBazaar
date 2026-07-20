// Pure functions — no DB access — so they're easy to unit test and reuse
// between the cart preview, checkout, and order-placement code paths.
//
// Second pass (see PROJECT_ANALYSIS.md Faz D madde 11/11a): a campaign's
// conditionGroups are OR'd together, and each group's conditions are AND'd.
// Campaign documents saved before this pass may still carry the old flat
// `conditions` array (single implicit AND group, no `conditionGroups`) —
// `groupsFor` treats that shape as a single-group campaign so old data
// keeps evaluating exactly as it did before, with no DB migration required
// for correctness (a one-off migration script still normalizes the shape
// for editing in the admin UI).

function cartTotal(cartItems) {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function evaluateCondition(condition, context) {
    const { cartItems, user } = context;

    switch (condition.type) {
        case 'product':
            return cartItems.some(item => {
                if (condition.field === 'sku') {
                    return item.sku && condition.values.includes(item.sku);
                }
                if (condition.field === 'category') {
                    const categoryIds = (item.categories || []).map(c => String(c));
                    return condition.values.some(v => categoryIds.includes(v));
                }
                if (condition.field === 'brand') {
                    return item.brand && condition.values.includes(String(item.brand));
                }
                return false;
            });
        case 'productName': {
            const needle = String(condition.text || '').trim().toLowerCase();
            if (!needle) return false;
            return cartItems.some(item => item.name && item.name.toLowerCase().includes(needle));
        }
        case 'user':
            if (!user) return false;
            return condition.values.includes(String(user._id)) || condition.values.includes(user.email);
        case 'cartTotal': {
            const total = cartTotal(cartItems);
            if (condition.operator === 'gte') return total >= condition.value;
            if (condition.operator === 'lte') return total <= condition.value;
            return false;
        }
        default:
            return false;
    }
}

function isWithinDateRange(campaign, now) {
    if (campaign.startDate && now < new Date(campaign.startDate)) return false;
    if (campaign.endDate && now > new Date(campaign.endDate)) return false;
    return true;
}

// Normalizes a campaign's condition shape to an array of groups, regardless
// of whether it uses the current `conditionGroups` field or the pre-second-
// pass flat `conditions` field.
function groupsFor(campaign) {
    if (Array.isArray(campaign.conditionGroups) && campaign.conditionGroups.length > 0) {
        return campaign.conditionGroups;
    }
    if (Array.isArray(campaign.conditions)) {
        return [{ conditions: campaign.conditions }];
    }
    return [];
}

// The first group (in declaration order) whose conditions are ALL satisfied
// — or null if no group matches, the campaign is inactive, or it's outside
// its date range. Returning the group (not just a boolean) lets callers know
// *which* product/productName conditions actually triggered the match, for
// `appliesTo: 'matchingItems'`.
function matchingGroupFor(campaign, context, now = new Date()) {
    if (!campaign.isActive) return null;
    if (!isWithinDateRange(campaign, now)) return null;
    return groupsFor(campaign).find(group => group.conditions.every(c => evaluateCondition(c, context))) || null;
}

// Does this campaign apply to this cart/user right now, ignoring whether a
// code was entered? (Callers decide separately whether a code is required.)
function campaignMatches(campaign, context, now = new Date()) {
    return matchingGroupFor(campaign, context, now) !== null;
}

function itemsMatchingProductConditions(group, cartItems) {
    const productLikeConditions = (group ? group.conditions : []).filter(
        c => c.type === 'product' || c.type === 'productName'
    );
    if (productLikeConditions.length === 0) {
        return cartItems;
    }
    return cartItems.filter(item =>
        productLikeConditions.some(condition => evaluateCondition(condition, { cartItems: [item] }))
    );
}

// Discount amount in kuruş for a campaign already known to match. `group`
// should be the group returned by `matchingGroupFor` for this context —
// when omitted (e.g. a caller that already confirmed a match some other
// way), falls back to the campaign's first group.
function computeDiscountAmount(campaign, cartItems, group) {
    const resolvedGroup = group || groupsFor(campaign)[0] || null;
    const base = campaign.appliesTo === 'matchingItems'
        ? cartTotal(itemsMatchingProductConditions(resolvedGroup, cartItems))
        : cartTotal(cartItems);

    if (base <= 0) return 0;

    const raw = campaign.discountType === 'percentage'
        ? Math.round((base * campaign.discountValue) / 100)
        : campaign.discountValue;

    return Math.max(0, Math.min(raw, base));
}

// Among campaigns with no code (automatic), the one giving the largest
// discount for this cart — campaigns aren't stacked in this MVP.
function pickBestAutomaticCampaign(campaigns, context, now = new Date()) {
    let best = null;
    let bestAmount = 0;

    for (const campaign of campaigns) {
        if (campaign.code) continue;
        const group = matchingGroupFor(campaign, context, now);
        if (!group) continue;

        const amount = computeDiscountAmount(campaign, context.cartItems, group);
        if (amount > bestAmount) {
            best = campaign;
            bestAmount = amount;
        }
    }

    return best ? { campaign: best, amount: bestAmount } : null;
}

// A specific code the customer entered — must exist, be active/in range,
// and have its conditions satisfied by the current cart/user.
function findCampaignByCode(campaigns, code, context, now = new Date()) {
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized) return null;

    const campaign = campaigns.find(c => c.code === normalized);
    if (!campaign) return null;

    const group = matchingGroupFor(campaign, context, now);
    if (!group) return null;

    return { campaign, amount: computeDiscountAmount(campaign, context.cartItems, group) };
}

// For the home page banner, which has no cart/user context yet — shown
// purely based on isActive/date range, not condition matching. Code-based
// campaigns are excluded since they're not meant to be broadcast.
function pickBestMarketingCampaign(campaigns, now = new Date()) {
    const eligible = campaigns.filter(c => c.isActive && !c.code && isWithinDateRange(c, now));
    if (eligible.length === 0) return null;
    return eligible.reduce((best, c) => (c.discountValue > best.discountValue ? c : best));
}

module.exports = {
    cartTotal,
    evaluateCondition,
    campaignMatches,
    matchingGroupFor,
    computeDiscountAmount,
    pickBestAutomaticCampaign,
    findCampaignByCode,
    pickBestMarketingCampaign
};
