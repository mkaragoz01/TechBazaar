const fs = require('fs');
const Product = require('../models/product');
const ProductVariant = require('../models/productVariant');
const CategoryAttribute = require('../models/categoryAttribute');
const syncProductVariantDenormalization = require('../utility/syncProductVariantDenormalization');

function validationMessage(err) {
    return Object.values(err.errors).map(e => e.message).join(' ');
}

function asBoolean(value) {
    return value === 'true' || value === true || value === 'on';
}

function attributeSetKey(attributes) {
    return attributes
        .map(a => `${a.attribute.toString()}:${a.value}`)
        .sort()
        .join('|');
}

// A variant's attributes must each reference a variant-axis
// CategoryAttribute belonging to one of the product's own categories, with
// a value that's actually one of that attribute's defined options — this
// is admin-facing but still a real API, not just a locked-down form.
async function parseAndValidateAttributes(rawAttributes, product) {
    let entries;
    try {
        entries = typeof rawAttributes === 'string' ? JSON.parse(rawAttributes) : rawAttributes;
    } catch {
        return { error: 'Geçersiz özellik verisi.' };
    }
    if (!Array.isArray(entries) || entries.length === 0) {
        return { error: 'Varyant en az bir özellik içermelidir.' };
    }

    const attributeIds = entries.map(e => e.attribute);
    const attributeDocs = await CategoryAttribute.find({
        _id: { $in: attributeIds },
        category: { $in: product.categories },
        isVariantAxis: true
    }).lean();

    if (attributeDocs.length !== new Set(attributeIds).size) {
        return { error: 'Geçersiz bir varyant özelliği seçildi.' };
    }

    const attributeById = new Map(attributeDocs.map(a => [a._id.toString(), a]));
    for (const entry of entries) {
        const attribute = attributeById.get(String(entry.attribute));
        if (!attribute || !attribute.options.includes(entry.value)) {
            return { error: `"${entry.value}" geçerli bir seçenek değil.` };
        }
    }

    return {
        attributes: entries.map(e => ({ attribute: e.attribute, value: e.value }))
    };
}

exports.getProductVariants = async (req, res, next) => {
    try {
        const variants = await ProductVariant.find({ product: req.params.productid })
            .sort({ createdAt: 1 })
            .lean();
        res.json({ variants });
    } catch (err) {
        next(err);
    }
}

exports.postAddProductVariant = async (req, res, next) => {
    const image = req.file;
    try {
        const product = await Product.findById(req.params.productid);
        if (!product) {
            return res.status(404).json({ error: 'Ürün bulunamadı.' });
        }

        const parsed = await parseAndValidateAttributes(req.body.attributes, product);
        if (parsed.error) {
            return res.status(400).json({ error: parsed.error });
        }

        const siblings = await ProductVariant.find({ product: product._id }).lean();
        const newKey = attributeSetKey(parsed.attributes);
        if (siblings.some(s => attributeSetKey(s.attributes) === newKey)) {
            return res.status(409).json({ error: 'Bu özellik kombinasyonuna sahip bir varyant zaten var.' });
        }

        const variant = new ProductVariant({
            product: product._id,
            sku: req.body.sku ? String(req.body.sku).trim() : undefined,
            attributes: parsed.attributes,
            priceOverride: req.body.priceOverride ? Number(req.body.priceOverride) : undefined,
            stock: req.body.stock !== undefined ? Number(req.body.stock) : 0,
            imgUrl: image ? image.filename : undefined,
            isActive: req.body.isActive !== undefined ? asBoolean(req.body.isActive) : true
        });
        await variant.save();
        await syncProductVariantDenormalization(product._id);

        res.status(201).json({ ok: true, variant });
    } catch (err) {
        if (image) {
            fs.unlink(`public/img/${image.filename}`, () => {});
        }
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: validationMessage(err) });
        }
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Bu SKU zaten kullanılıyor.' });
        }
        next(err);
    }
}

exports.putEditProductVariant = async (req, res, next) => {
    const image = req.file;
    try {
        const product = await Product.findById(req.params.productid);
        if (!product) {
            return res.status(404).json({ error: 'Ürün bulunamadı.' });
        }
        const variant = await ProductVariant.findOne({ _id: req.params.variantid, product: product._id });
        if (!variant) {
            return res.status(404).json({ error: 'Varyant bulunamadı.' });
        }

        const parsed = await parseAndValidateAttributes(req.body.attributes, product);
        if (parsed.error) {
            return res.status(400).json({ error: parsed.error });
        }

        const siblings = await ProductVariant.find({ product: product._id, _id: { $ne: variant._id } }).lean();
        const newKey = attributeSetKey(parsed.attributes);
        if (siblings.some(s => attributeSetKey(s.attributes) === newKey)) {
            return res.status(409).json({ error: 'Bu özellik kombinasyonuna sahip bir varyant zaten var.' });
        }

        const oldImage = variant.imgUrl;
        variant.sku = req.body.sku ? String(req.body.sku).trim() : undefined;
        variant.attributes = parsed.attributes;
        variant.priceOverride = req.body.priceOverride ? Number(req.body.priceOverride) : undefined;
        variant.stock = req.body.stock !== undefined ? Number(req.body.stock) : variant.stock;
        variant.isActive = req.body.isActive !== undefined ? asBoolean(req.body.isActive) : variant.isActive;
        if (image) {
            variant.imgUrl = image.filename;
        }
        await variant.save();
        await syncProductVariantDenormalization(product._id);

        if (image && oldImage) {
            fs.unlink(`public/img/${oldImage}`, () => {});
        }

        res.json({ ok: true, variant });
    } catch (err) {
        if (image) {
            fs.unlink(`public/img/${image.filename}`, () => {});
        }
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: validationMessage(err) });
        }
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Bu SKU zaten kullanılıyor.' });
        }
        next(err);
    }
}

exports.deleteProductVariant = async (req, res, next) => {
    try {
        const variant = await ProductVariant.findOne({ _id: req.params.variantid, product: req.params.productid });
        if (!variant) {
            return res.status(404).json({ error: 'Varyant bulunamadı.' });
        }

        await ProductVariant.deleteOne({ _id: variant._id });
        await syncProductVariantDenormalization(req.params.productid);

        if (variant.imgUrl) {
            fs.unlink(`public/img/${variant.imgUrl}`, () => {});
        }

        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}
