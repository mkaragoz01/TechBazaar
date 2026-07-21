const CategoryAttribute = require('../models/categoryAttribute');
const Product = require('../models/product');
const ProductVariant = require('../models/productVariant');

function validationMessage(err) {
    return Object.values(err.errors).map(e => e.message).join(' ');
}

function asBoolean(value) {
    return value === 'true' || value === true || value === 'on';
}

function normalizeFields(body) {
    const valueType = body.valueType === 'text' ? 'text' : 'select';
    const rawOptions = Array.isArray(body.options)
        ? body.options
        : String(body.options || '').split(',');
    const options = valueType === 'select'
        ? rawOptions.map(o => String(o).trim()).filter(Boolean)
        : [];

    return {
        category: body.category,
        name: body.name,
        valueType,
        options,
        unit: body.unit ? String(body.unit).trim() : undefined,
        // Serbest metin özellikler filtrelenemez/varyant ekseni olamaz —
        // admin formu bunu UI'da zaten kısıtlıyor, burada da zorlanıyor
        // (schema validator'ı da aynı kuralı tekrar kontrol ediyor).
        isVariantAxis: valueType === 'select' ? asBoolean(body.isVariantAxis) : false,
        isFilterable: valueType === 'select' ? asBoolean(body.isFilterable ?? true) : false,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : 0
    };
}

exports.getCategoryAttributes = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.category) {
            filter.category = req.query.category;
        }
        const attributes = await CategoryAttribute.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
        res.json({ attributes });
    } catch (err) {
        next(err);
    }
}

exports.getCategoryAttribute = async (req, res, next) => {
    try {
        const attribute = await CategoryAttribute.findById(req.params.attributeid).lean();
        if (!attribute) {
            return res.status(404).json({ error: 'Özellik bulunamadı.' });
        }
        res.json({ attribute });
    } catch (err) {
        next(err);
    }
}

exports.postAddCategoryAttribute = async (req, res, next) => {
    try {
        const attribute = new CategoryAttribute(normalizeFields(req.body));
        await attribute.save();
        res.status(201).json({ ok: true, attribute });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: validationMessage(err) });
        }
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Bu kategoride bu isimde bir özellik zaten var.' });
        }
        next(err);
    }
}

exports.putEditCategoryAttribute = async (req, res, next) => {
    try {
        const attribute = await CategoryAttribute.findById(req.params.attributeid);
        if (!attribute) {
            return res.status(404).json({ error: 'Özellik bulunamadı.' });
        }

        const wasVariantAxis = attribute.isVariantAxis;
        Object.assign(attribute, normalizeFields(req.body));

        // isVariantAxis'i true'dan false'a çevirmek, o özelliği eksen
        // olarak kullanan varyantları anlamsız bırakır — engellensin.
        if (wasVariantAxis && !attribute.isVariantAxis) {
            const variantCount = await ProductVariant.countDocuments({ 'attributes.attribute': attribute._id });
            if (variantCount > 0) {
                return res.status(409).json({ error: 'Bu özelliği kullanan varyantlar var, önce onları kaldırın.' });
            }
        }

        await attribute.save();
        res.json({ ok: true, attribute });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: validationMessage(err) });
        }
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Bu kategoride bu isimde bir özellik zaten var.' });
        }
        next(err);
    }
}

exports.deleteCategoryAttribute = async (req, res, next) => {
    try {
        const attribute = await CategoryAttribute.findById(req.params.attributeid);
        if (!attribute) {
            return res.status(404).json({ error: 'Özellik bulunamadı.' });
        }

        if (attribute.isVariantAxis) {
            const variantCount = await ProductVariant.countDocuments({ 'attributes.attribute': attribute._id });
            if (variantCount > 0) {
                return res.status(409).json({ error: 'Bu özelliği kullanan varyantlar var, önce onları kaldırın.' });
            }
        }

        await CategoryAttribute.deleteOne({ _id: attribute._id });
        await Product.updateMany(
            { 'attributes.attribute': attribute._id },
            { $pull: { attributes: { attribute: attribute._id } } }
        );

        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}
