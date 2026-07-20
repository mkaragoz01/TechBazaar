// Pure functions — no DB access — so they're easy to unit test and reuse
// between the cart preview, checkout, and order-placement code paths.
//
// MVP scope (see PROJECT_ANALYSIS.md Faz D madde 11/11a): a campaign's
// conditions are a single implicit AND group. The OR-of-ANDs layer and the
// productName/contains condition type are deferred to a follow-up pass.

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

// Does this campaign apply to this cart/user right now, ignoring whether a
// code was entered? (Callers decide separately whether a code is required.)
function campaignMatches(campaign, context, now = new Date()) {
    if (!campaign.isActive) return false;
    if (!isWithinDateRange(campaign, now)) return false;
    return campaign.conditions.every(condition => evaluateCondition(condition, context));
}

function itemsMatchingProductConditions(campaign, cartItems) {
    const productConditions = campaign.conditions.filter(c => c.type === 'product');
    if (productConditions.length === 0) {
        return cartItems;
    }
    return cartItems.filter(item =>
        productConditions.some(condition => evaluateCondition(condition, { cartItems: [item] }))
    );
}

// Discount amount in kuruş for a campaign already known to match.
function computeDiscountAmount(campaign, cartItems) {
    const base = campaign.appliesTo === 'matchingItems'
        ? cartTotal(itemsMatchingProductConditions(campaign, cartItems))
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
        if (!campaignMatches(campaign, context, now)) continue;

        const amount = computeDiscountAmount(campaign, context.cartItems);
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
    if (!campaign || !campaignMatches(campaign, context, now)) return null;

    return { campaign, amount: computeDiscountAmount(campaign, context.cartItems) };
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
    computeDiscountAmount,
    pickBestAutomaticCampaign,
    findCampaignByCode,
    pickBestMarketingCampaign
};
