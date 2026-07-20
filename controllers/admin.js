const Category = require("../models/category");
const Brand = require("../models/brand");
const Campaign = require("../models/campaign");
const Product = require("../models/product")
const Order = require("../models/order");
const fs = require("fs")
const sanitizeDescription = require("../utility/sanitizeDescription")
const { parsePriceToKurus } = require("../utility/formatPrice")
const { bucketOrders, computeKpis } = require("../utility/dashboardStats")

const LOW_STOCK_THRESHOLD = 3

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
            isActive: req.body.isActive !== undefined ? asBoolean(req.body.isActive) : true
        });
        await product.save();
        res.status(201).json({ ok: true, product });
    } catch (err) {
        // The image was already written to disk by multer before this
        // handler ran — if the product itself never gets saved, that file
        // would otherwise sit in public/img/ forever with nothing pointing
        // to it.
        fs.unlink(`public/img/${image.filename}`, (unlinkErr) => {
            if (unlinkErr) console.log(unlinkErr);
        });
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
            if (image) fs.unlink(`public/img/${image.filename}`, (err) => { if (err) console.log(err); });
            return res.status(404).json({ error: 'Ürün bulunamadı.' });
        }
        if (Number.isNaN(priceInKurus)) {
            if (image) fs.unlink(`public/img/${image.filename}`, (err) => { if (err) console.log(err); });
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
        if (req.body.isActive !== undefined) {
            product.isActive = asBoolean(req.body.isActive);
        }

        const oldImgUrl = product.imgUrl;
        if (image) {
            product.imgUrl = image.filename;
        }

        await product.save();

        // Only remove the old image once the save actually succeeded — the
        // previous version deleted it upfront, so a failed save left the
        // product pointing at an old file that no longer existed.
        if (image && oldImgUrl) {
            fs.unlink(`public/img/${oldImgUrl}`, (err) => {
                if (err) console.log(err);
            });
        }

        res.json({ ok: true, product });
    } catch (err) {
        if (image) {
            fs.unlink(`public/img/${image.filename}`, (unlinkErr) => {
                if (unlinkErr) console.log(unlinkErr);
            });
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
        // The per-order revenue math (summing embedded item arrays, netting
        // out discounts) happens here in the DB rather than by pulling every
        // order's full item list into Node to loop over — see
        // utility/dashboardStats.js for the bucketing/comparison logic that
        // runs on this already-slim result.
        const orderSummaries = await Order.aggregate([
            {
                $project: {
                    createdAt: 1,
                    status: 1,
                    netTotal: {
                        $subtract: [
                            {
                                $sum: {
                                    $map: {
                                        input: '$items',
                                        as: 'item',
                                        in: { $multiply: ['$$item.product.price', '$$item.quantity'] }
                                    }
                                }
                            },
                            { $ifNull: ['$discountAmount', 0] }
                        ]
                    }
                }
            }
        ]);

        const kpis = computeKpis(orderSummaries);
        const chart = {
            day: bucketOrders(orderSummaries, 'day', 7),
            week: bucketOrders(orderSummaries, 'week', 8),
            month: bucketOrders(orderSummaries, 'month', 6),
            year: bucketOrders(orderSummaries, 'year', 3)
        };

        const [topProducts, recentOrders, lowStockProducts, pendingOrders] = await Promise.all([
            Order.aggregate([
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.product._id',
                        name: { $first: '$items.product.name' },
                        totalQuantity: { $sum: '$items.quantity' },
                        totalRevenue: { $sum: { $multiply: ['$items.product.price', '$items.quantity'] } }
                    }
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 5 }
            ]),
            Order.find().sort({ createdAt: -1 }).limit(5).lean(),
            Product.find({ isActive: true, stock: { $lte: LOW_STOCK_THRESHOLD } })
                .select('name stock')
                .sort({ stock: 1 })
                .limit(5)
                .lean(),
            Order.find({ status: 'pending' }).sort({ createdAt: 1 }).limit(5).lean()
        ]);

        res.json({ kpis, chart, topProducts, recentOrders, lowStockProducts, pendingOrders });
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

function campaignFieldsFromBody(body) {
    return {
        name: body.name,
        description: body.description,
        code: asOptionalTrimmed(body.code),
        conditionGroups: body.conditionGroups,
        discountType: body.discountType,
        discountValue: Number(body.discountValue),
        appliesTo: body.appliesTo,
        startDate: body.startDate || undefined,
        endDate: body.endDate || undefined,
        isActive: asBoolean(body.isActive)
    };
}

exports.getCampaigns = async (req, res, next) => {
    try {
        const campaigns = await Campaign.find().sort({ createdAt: -1 }).lean();
        res.json({ campaigns });
    } catch (err) {
        next(err);
    }
}

exports.getCampaign = async (req, res, next) => {
    try {
        const campaign = await Campaign.findById(req.params.campaignid).lean();
        if (!campaign) {
            return res.status(404).json({ error: 'Kampanya bulunamadı.' });
        }
        res.json({ campaign });
    } catch (err) {
        next(err);
    }
}

exports.postAddCampaign = async (req, res, next) => {
    try {
        const campaign = new Campaign(campaignFieldsFromBody(req.body));
        await campaign.save();
        res.status(201).json({ ok: true, campaign });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: validationMessage(err) });
        }
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Bu kampanya kodu zaten kullanılıyor.' });
        }
        next(err);
    }
}

exports.putEditCampaign = async (req, res, next) => {
    try {
        const campaign = await Campaign.findById(req.params.campaignid);
        if (!campaign) {
            return res.status(404).json({ error: 'Kampanya bulunamadı.' });
        }
        Object.assign(campaign, campaignFieldsFromBody(req.body));
        await campaign.save();
        res.json({ ok: true, campaign });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: validationMessage(err) });
        }
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Bu kampanya kodu zaten kullanılıyor.' });
        }
        next(err);
    }
}

exports.deleteCampaign = async (req, res, next) => {
    try {
        const result = await Campaign.deleteOne({ _id: req.params.campaignid });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Kampanya bulunamadı.' });
        }
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}
