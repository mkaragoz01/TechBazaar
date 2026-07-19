const Category = require("../models/category");
const Brand = require("../models/brand");
const Product = require("../models/product")
const Order = require("../models/order");
const fs = require("fs")
const sanitizeDescription = require("../utility/sanitizeDescription")
const { parsePriceToKurus } = require("../utility/formatPrice")

function validationMessage(err) {
    return Object.values(err.errors).map(e => e.message).join(' ');
}

function asArray(value) {
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
}

function asBoolean(value) {
    return value === 'true' || value === true || value === 'on';
}

// sku is unique+sparse: an empty string would still collide across products,
// so a blank submission has to become "no field" rather than "".
function asOptionalTrimmed(value) {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    return trimmed === '' ? undefined : trimmed;
}

exports.getProducts = async (req, res, next) => {
    try {
        const products = await Product.find({ userId: req.user._id }).lean();
        res.json({ products });
    } catch (err) {
        next(err);
    }
}

exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findOne({ _id: req.params.productid, userId: req.user._id }).lean();
        if (!product) {
            return res.status(404).json({ error: 'Ürün bulunamadı.' });
        }
        res.json({ product });
    } catch (err) {
        next(err);
    }
}

exports.postAddProduct = async (req, res, next) => {
    const name = req.body.name;
    const price = req.body.price;
    const image = req.file;
    const description = req.body.description;
    const categoryIds = asArray(req.body.categoryids);
    const priceInKurus = parsePriceToKurus(price);

    if (!image) {
        return res.status(400).json({ error: 'Lütfen bir resim yükleyin.' });
    }
    if (Number.isNaN(priceInKurus)) {
        return res.status(400).json({ error: 'Lütfen geçerli bir fiyat girin.' });
    }

    try {
        const product = new Product({
            name,
            price: priceInKurus,
            imgUrl: image.filename,
            description: sanitizeDescription(description),
            categories: categoryIds,
            brand: asOptionalTrimmed(req.body.brand),
            sku: asOptionalTrimmed(req.body.sku),
            stock: req.body.stock !== undefined ? Number(req.body.stock) : 0,
            isNewArrival: asBoolean(req.body.isNewArrival),
            isFeatured: asBoolean(req.body.isFeatured),
            userId: req.user._id,
            isActive: true
        });
        await product.save();
        res.status(201).json({ ok: true, product });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: validationMessage(err) });
        }
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Bu SKU zaten kullanılıyor.' });
        }
        next(err);
    }
}

exports.putEditProduct = async (req, res, next) => {
    const id = req.params.productid;
    const name = req.body.name;
    const price = req.body.price;
    const image = req.file;
    const description = req.body.description;
    const categoryIds = asArray(req.body.categoryids);
    const priceInKurus = parsePriceToKurus(price);

    try {
        const product = await Product.findOne({ _id: id, userId: req.user._id });
        if (!product) {
            return res.status(404).json({ error: 'Ürün bulunamadı.' });
        }
        if (Number.isNaN(priceInKurus)) {
            return res.status(400).json({ error: 'Lütfen geçerli bir fiyat girin.' });
        }

        product.name = name;
        product.price = priceInKurus;
        product.description = sanitizeDescription(description);
        product.categories = categoryIds;
        product.brand = asOptionalTrimmed(req.body.brand);
        product.sku = asOptionalTrimmed(req.body.sku);
        if (req.body.stock !== undefined) {
            product.stock = Number(req.body.stock);
        }
        product.isNewArrival = asBoolean(req.body.isNewArrival);
        product.isFeatured = asBoolean(req.body.isFeatured);

        if (image) {
            const oldImgUrl = product.imgUrl;
            product.imgUrl = image.filename;
            fs.unlink(`public/img/${oldImgUrl}`, (err) => {
                if (err) console.log(err);
            });
        }

        await product.save();
        res.json({ ok: true, product });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: validationMessage(err) });
        }
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Bu SKU zaten kullanılıyor.' });
        }
        next(err);
    }
}

exports.deleteProduct = async (req, res, next) => {
    try {
        const result = await Product.updateOne(
            { _id: req.params.productid, userId: req.user._id },
            { isActive: false }
        );
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Ürün bulunamadı.' });
        }
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}

exports.getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find().lean();
        res.json({ categories });
    } catch (err) {
        next(err);
    }
}

exports.getCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.categoryid).lean();
        if (!category) {
            return res.status(404).json({ error: 'Kategori bulunamadı.' });
        }
        res.json({ category });
    } catch (err) {
        next(err);
    }
}

exports.postAddCategory = async (req, res, next) => {
    const name = req.body.name;
    const description = req.body.description;

    try {
        const category = new Category({ name, description: sanitizeDescription(description) });
        await category.save();
        res.status(201).json({ ok: true, category });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: validationMessage(err) });
        }
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Bu isimde bir kategori zaten var.' });
        }
        next(err);
    }
}

exports.putEditCategory = async (req, res, next) => {
    const id = req.params.categoryid;
    const name = req.body.name;
    const description = req.body.description;

    try {
        const result = await Category.updateOne(
            { _id: id },
            { $set: { name, description: sanitizeDescription(description) } },
            { runValidators: true }
        );
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Kategori bulunamadı.' });
        }
        res.json({ ok: true });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: validationMessage(err) });
        }
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Bu isimde bir kategori zaten var.' });
        }
        next(err);
    }
}

exports.deleteCategory = async (req, res, next) => {
    try {
        const result = await Category.deleteOne({ _id: req.params.categoryid });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Kategori bulunamadı.' });
        }
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}

exports.getBrands = async (req, res, next) => {
    try {
        const brands = await Brand.find().lean();
        res.json({ brands });
    } catch (err) {
        next(err);
    }
}

exports.getBrand = async (req, res, next) => {
    try {
        const brand = await Brand.findById(req.params.brandid).lean();
        if (!brand) {
            return res.status(404).json({ error: 'Marka bulunamadı.' });
        }
        res.json({ brand });
    } catch (err) {
        next(err);
    }
}

exports.postAddBrand = async (req, res, next) => {
    const name = req.body.name;
    const description = req.body.description;

    try {
        const brand = new Brand({ name, description: sanitizeDescription(description) });
        await brand.save();
        res.status(201).json({ ok: true, brand });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: validationMessage(err) });
        }
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Bu isimde bir marka zaten var.' });
        }
        next(err);
    }
}

exports.putEditBrand = async (req, res, next) => {
    const id = req.params.brandid;
    const name = req.body.name;
    const description = req.body.description;

    try {
        const result = await Brand.updateOne(
            { _id: id },
            { $set: { name, description: sanitizeDescription(description) } },
            { runValidators: true }
        );
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Marka bulunamadı.' });
        }
        res.json({ ok: true });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: validationMessage(err) });
        }
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Bu isimde bir marka zaten var.' });
        }
        next(err);
    }
}

exports.deleteBrand = async (req, res, next) => {
    try {
        const result = await Brand.deleteOne({ _id: req.params.brandid });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Marka bulunamadı.' });
        }
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}

exports.getDashboard = async (req, res, next) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).lean();
        res.json({ orders });
    } catch (err) {
        next(err);
    }
}

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered'];

exports.getOrders = async (req, res, next) => {
    try {
        const status = req.query.status;
        const filter = {};
        if (status && ORDER_STATUSES.includes(status)) {
            filter.status = status;
        }
        const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
        res.json({ orders });
    } catch (err) {
        next(err);
    }
}

exports.putOrderStatus = async (req, res, next) => {
    try {
        const status = req.body.status;
        if (!ORDER_STATUSES.includes(status)) {
            return res.status(400).json({ error: 'Geçersiz sipariş durumu.' });
        }
        const result = await Order.updateOne({ _id: req.params.orderid }, { $set: { status } });
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Sipariş bulunamadı.' });
        }
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}
