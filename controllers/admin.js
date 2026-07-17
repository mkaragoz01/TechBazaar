const Category = require("../models/category");
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
            userId: req.user._id,
            isActive: true
        });
        await product.save();
        res.status(201).json({ ok: true, product });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: validationMessage(err) });
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

exports.getDashboard = async (req, res, next) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).lean();
        res.json({ orders });
    } catch (err) {
        next(err);
    }
}
