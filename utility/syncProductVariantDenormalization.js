const Product = require('../models/product');
const ProductVariant = require('../models/productVariant');
const CategoryAttribute = require('../models/categoryAttribute');

// Keeps two denormalized facts on Product in sync with its ProductVariant
// documents, so getProducts' attribute filter (which only ever queries
// Product, never ProductVariant — see controllers/shop.js) still matches
// correctly on variant-axis values like Renk:
//   - Product.hasVariants (does this product have any variants at all)
//   - the union of variant-axis attribute values actually used across this
//     product's current variants, folded into Product.attributes
//
// Plain (non-variant-axis) attribute entries — the ones ProductForm's own
// "specs" section manages — are left untouched; only entries whose
// attribute is a variant-axis attribute for one of this product's
// categories get rebuilt from scratch each call.
async function syncProductVariantDenormalization(productId) {
    const product = await Product.findById(productId);
    if (!product) return;

    const [variants, axisAttributes] = await Promise.all([
        ProductVariant.find({ product: productId }).lean(),
        CategoryAttribute.find({ category: { $in: product.categories }, isVariantAxis: true }).select('_id').lean()
    ]);

    const axisAttributeIds = new Set(axisAttributes.map(a => a._id.toString()));

    const union = new Map(); // attributeId -> Set of values
    for (const variant of variants) {
        for (const av of variant.attributes) {
            const key = av.attribute.toString();
            if (!union.has(key)) union.set(key, new Set());
            union.get(key).add(av.value);
        }
    }

    const preservedEntries = product.attributes.filter(a => !axisAttributeIds.has(a.attribute.toString()));
    const variantEntries = [];
    for (const [attributeId, values] of union) {
        for (const value of values) {
            variantEntries.push({ attribute: attributeId, value });
        }
    }

    product.attributes = [...preservedEntries, ...variantEntries];
    product.hasVariants = variants.length > 0;
    await product.save();
}

module.exports = syncProductVariantDenormalization;
