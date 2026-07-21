const mongoose = require("mongoose")
const Product = require("../models/product")
const Category = require("../models/category")
const Brand = require("../models/brand")
const Order = require("../models/order")
const Address = require("../models/address")
const PaymentMethod = require("../models/paymentMethod")
const Campaign = require("../models/campaign")
const CategoryAttribute = require("../models/categoryAttribute")
const ProductVariant = require("../models/productVariant")
const sorted_all = require("../public/js/sorted")
const { pickBestAutomaticCampaign, findCampaignByCode, pickBestMarketingCampaign } = require("../utility/evaluateCampaign")

// Shared between the cart preview and order placement so both always agree
// on what discount applies. A code the customer entered takes priority over
// an automatic campaign; if it no longer matches (cart changed, campaign
// ended) it's dropped silently rather than surfaced as an error — the
// customer didn't just do anything wrong.
async function computeCartDiscount(req, cartItems) {
    if (!cartItems || cartItems.length === 0) return null;

    const campaigns = await Campaign.find({ isActive: true }).lean();
    const context = { cartItems, user: req.user };

    if (req.session.campaignCode) {
        const codeResult = findCampaignByCode(campaigns, req.session.campaignCode, context);
        if (codeResult && codeResult.amount > 0) {
            return { campaignName: codeResult.campaign.name, amount: codeResult.amount, code: codeResult.campaign.code };
        }
        delete req.session.campaignCode;
    }

    const autoResult = pickBestAutomaticCampaign(campaigns, context);
    if (autoResult && autoResult.amount > 0) {
        return { campaignName: autoResult.campaign.name, amount: autoResult.amount };
    }

    return null;
}

exports.getCategoriesJson = (req,res,next) => {
    Category.find().lean()
        .then(categories => res.json({ categories }))
        .catch(err => next(err));
}

exports.getBrandsJson = (req,res,next) => {
    Brand.find().lean()
        .then(brands => res.json({ brands }))
        .catch(err => next(err));
}

// Only the filterable attributes for this category — the storefront's
// FilterPanel builds its checkbox groups from this, never from admin's
// full (unfiltered) attribute list.
exports.getCategoryAttributes = (req, res, next) => {
    CategoryAttribute.find({ category: req.params.categoryid, isFilterable: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean()
        .then(attributes => res.json({ attributes }))
        .catch(err => next(err));
}

exports.getIndex = (req,res,next) => {
    const sortOption = req.query.sort || 'price_desc';

    Promise.all([
        Product.find({ isActive: true }).lean(),
        Category.find().lean(),
        Campaign.find({ isActive: true }).lean()
    ])
    .then(([products, categories, campaigns]) => {
        const sortedProducts = sorted_all.sortProducts(products, sortOption);
        const banner = pickBestMarketingCampaign(campaigns);

        res.json({
            products: sortedProducts,
            categories: categories,
            selectedSort: sortOption,
            campaign: banner ? { name: banner.name, description: banner.description } : null
        });
    })
    .catch(err => next(err));
}

exports.getProducts = (req,res,next) => {
    const sortOption = req.query.sort || 'price_desc';
    const categoryId = req.query.category;
    const brandId = req.query.brand;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const q = req.query.q;

    const filter = { isActive: true };
    if (categoryId) {
        filter.categories = categoryId;
    }
    if (brandId) {
        filter.brand = brandId;
    }
    const priceFilter = {};
    if (minPrice !== undefined && !Number.isNaN(minPrice)) priceFilter.$gte = Math.round(minPrice * 100);
    if (maxPrice !== undefined && !Number.isNaN(maxPrice)) priceFilter.$lte = Math.round(maxPrice * 100);
    if (Object.keys(priceFilter).length > 0) {
        filter.price = priceFilter;
    }
    if (q) {
        filter.$text = { $search: q };
    }

    // ?attr[<attributeId>]=<value>&attr[<attributeId>]=<value2> — Express's
    // query parser turns this into an object, `{ "<id>": "value" | ["v1","v2"] }`.
    // Each attribute gets its own $elemMatch clause inside $and (AND across
    // different attributes; OR across a single attribute's own selected
    // values via $in) — a plain object can only hold one `attributes` key,
    // so a second selected attribute would otherwise silently clobber the
    // first instead of combining with it. Still a single Product.find —
    // no aggregation.
    const attrQuery = req.query.attr;
    if (attrQuery && typeof attrQuery === 'object') {
        const clauses = Object.entries(attrQuery)
            .filter(([attributeId]) => mongoose.isValidObjectId(attributeId))
            .map(([attributeId, rawValue]) => ({
                attributes: {
                    $elemMatch: {
                        attribute: new mongoose.Types.ObjectId(attributeId),
                        value: { $in: Array.isArray(rawValue) ? rawValue : [rawValue] }
                    }
                }
            }));
        if (clauses.length > 0) {
            filter.$and = clauses;
        }
    }

    Promise.all([Product.find(filter).lean(), Category.find().lean(), Brand.find().lean()])
    .then(([products, categories, brands]) => {
        const sortedProducts = sorted_all.sortProducts(products, sortOption);

        res.json({
            products: sortedProducts,
            categories: categories,
            brands: brands,
            selectedSort: sortOption,
            selectedCategory: categoryId || null,
            selectedBrand: brandId || null,
            selectedAttributes: attrQuery && typeof attrQuery === 'object' ? attrQuery : {}
        });
    })
    .catch(err => next(err));
}

exports.getProductSearchSuggestions = (req, res, next) => {
    const q = String(req.query.q || '').trim();
    if (!q) {
        return res.json({ products: [] });
    }

    Product.find({ isActive: true, $text: { $search: q } })
        .select('name imgUrl price')
        .limit(5)
        .lean()
        .then(products => res.json({ products }))
        .catch(err => next(err));
}

exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findOne({ _id: req.params.productid, isActive: true })
            .populate('categories')
            .populate('brand');
        if (!product) {
            return res.status(404).json({ error: 'Ürün bulunamadı.' });
        }

        const categoryIds = product.categories.map(c => c._id);

        const [related, variants] = await Promise.all([
            Product.find({
                _id: { $ne: product._id },
                isActive: true,
                categories: { $in: categoryIds }
            }).limit(8).lean(),
            product.hasVariants
                ? ProductVariant.find({ product: product._id, isActive: true })
                    .populate('attributes.attribute')
                    .lean()
                : Promise.resolve([])
        ]);

        res.json({
            product: {
                _id: product._id,
                name: product.name,
                price: product.price,
                description: product.description,
                imgUrl: product.imgUrl,
                stock: product.stock,
                categories: categoryIds,
                hasVariants: product.hasVariants
            },
            categoryName: product.categories[0]?.name,
            brandName: product.brand?.name,
            relatedProducts: related,
            variants
        });
    } catch (err) {
        next(err);
    }
}

exports.getCart = async (req, res, next) => {
    try {
        const items = await req.user.getCart();
        const discount = await computeCartDiscount(req, items);
        res.json({ items, discount });
    } catch (err) {
        next(err);
    }
}

exports.postApplyCampaignCode = async (req, res, next) => {
    try {
        const code = String(req.body.code || '').trim().toUpperCase();
        if (!code) {
            return res.status(400).json({ error: 'Bir kampanya kodu giriniz.' });
        }

        const cartItems = await req.user.getCart();
        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Sepetinizde ürün bulunmamaktadır.' });
        }

        const campaigns = await Campaign.find({ isActive: true }).lean();
        const result = findCampaignByCode(campaigns, code, { cartItems, user: req.user });
        if (!result || result.amount <= 0) {
            return res.status(400).json({ error: 'Geçersiz veya bu sepete uygulanamayan bir kampanya kodu.' });
        }

        req.session.campaignCode = code;
        res.json({ ok: true, discount: { campaignName: result.campaign.name, amount: result.amount, code } });
    } catch (err) {
        next(err);
    }
}

exports.postRemoveCampaignCode = (req, res) => {
    delete req.session.campaignCode;
    res.json({ ok: true });
}

exports.postCart = async (req, res, next) => {
    try {
        const productId = req.body.productId;
        const variantId = req.body.variantId || undefined;
        // Optional — the listing-card "add" button never sends this, so it
        // keeps behaving as a plain +1; the product-detail page's quantity
        // input sends an explicit amount to add in one call.
        const addQuantity = req.body.quantity !== undefined ? Number(req.body.quantity) : 1;
        if (!Number.isInteger(addQuantity) || addQuantity < 1) {
            return res.status(400).json({ error: 'Geçerli bir adet giriniz.' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Ürün bulunamadı.' });
        }
        if (product.hasVariants && !variantId) {
            return res.status(400).json({ error: 'Lütfen bir seçenek belirleyin.' });
        }

        let stockSource = product;
        if (variantId) {
            const variant = await ProductVariant.findOne({ _id: variantId, product: product._id, isActive: true });
            if (!variant) {
                return res.status(404).json({ error: 'Seçenek bulunamadı.' });
            }
            stockSource = variant;
        }

        const existing = req.user.cart.items.find(i =>
            i.productId.toString() === productId &&
            (i.variantId ? i.variantId.toString() : null) === (variantId || null)
        );
        const nextQuantity = (existing ? existing.quantity : 0) + addQuantity;
        if (stockSource.stock < nextQuantity) {
            return res.status(409).json({ error: 'Yeterli stok yok.' });
        }

        await req.user.addToCart(product, addQuantity, variantId);
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}

exports.postCartItemDelete = (req,res,next) => {
    const productid = req.body.productid;
    const variantId = req.body.variantId || undefined;
    req.user
        .deleteCartItem(productid, variantId)
        .then(() => res.json({ ok: true }))
        .catch(err => next(err));
}

exports.putCartItemQuantity = async (req, res, next) => {
    try {
        const productId = req.body.productId;
        const variantId = req.body.variantId || undefined;
        const quantity = Number(req.body.quantity);
        if (!Number.isInteger(quantity) || quantity < 0) {
            return res.status(400).json({ error: 'Geçerli bir adet giriniz.' });
        }

        if (quantity > 0) {
            const stockSource = variantId
                ? await ProductVariant.findById(variantId)
                : await Product.findById(productId);
            if (!stockSource) {
                return res.status(404).json({ error: variantId ? 'Seçenek bulunamadı.' : 'Ürün bulunamadı.' });
            }
            if (stockSource.stock < quantity) {
                return res.status(409).json({ error: 'Yeterli stok yok.' });
            }
        }

        await req.user.setCartItemQuantity(productId, quantity, variantId);
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}

exports.getCartCount = (req, res) => {
    res.json({ count: req.user.cart.items.length });
}

exports.getOrders = (req,res,next) => {
    Order
    .find({ "user.userId": req.user._id })
    .sort({ createdAt: -1 })
    .then(orders => res.json({ orders }))
    .catch(err => next(err));
}

exports.postOrder = async (req, res, next) => {
    try {
        const cartItems = await req.user.getCart();
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: 'Sepetinizde ürün bulunmamaktadır.' });
        }

        const { addressId, paymentMethodId } = req.body;
        if (!mongoose.isValidObjectId(addressId) || !mongoose.isValidObjectId(paymentMethodId)) {
            return res.status(400).json({ error: 'Geçerli bir teslimat adresi ve ödeme yöntemi seçmelisiniz.' });
        }
        const [address, paymentMethod] = await Promise.all([
            Address.findOne({ _id: addressId, userId: req.user._id }).lean(),
            PaymentMethod.findOne({ _id: paymentMethodId, userId: req.user._id }).lean()
        ]);
        if (!address) {
            return res.status(400).json({ error: 'Geçerli bir teslimat adresi seçmelisiniz.' });
        }
        if (!paymentMethod) {
            return res.status(400).json({ error: 'Geçerli bir ödeme yöntemi seçmelisiniz.' });
        }

        const discount = await computeCartDiscount(req, cartItems);

        // Decrement stock one product (or variant) at a time with an atomic
        // conditional update (stock check + decrement in one op, so
        // concurrent orders can't both succeed against the same last
        // unit). If a later item turns out to be out of stock, undo the
        // ones already decremented so a partially-failed order never
        // leaves stock counts wrong.
        const decremented = [];
        for (const item of cartItems) {
            const Model = item.variantId ? ProductVariant : Product;
            const targetId = item.variantId || item._id;
            const result = await Model.updateOne(
                { _id: targetId, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } }
            );
            if (result.matchedCount === 0) {
                for (const done of decremented) {
                    const DoneModel = done.variantId ? ProductVariant : Product;
                    await DoneModel.updateOne({ _id: done.variantId || done._id }, { $inc: { stock: done.quantity } });
                }
                return res.status(409).json({ error: `"${item.name}" için yeterli stok yok.` });
            }
            decremented.push(item);
        }

        const order = new Order({
            user: {
                userId: req.user._id,
                name: req.user.name,
                email: req.user.email
            },
            shippingAddress: {
                title: address.title,
                fullName: address.fullName,
                phone: address.phone,
                city: address.city,
                district: address.district,
                addressLine: address.addressLine,
                postalCode: address.postalCode
            },
            paymentDisplay: `${paymentMethod.brand} •••• ${paymentMethod.last4}`,
            discountAmount: discount ? discount.amount : 0,
            campaignName: discount ? discount.campaignName : undefined,
            items: cartItems.map(p => ({
                product: {
                    _id: p._id,
                    name: p.name,
                    price: p.price,
                    imgUrl: p.imgUrl
                },
                variant: p.variantId ? { _id: p.variantId, sku: p.sku, label: p.variantLabel } : undefined,
                quantity: p.quantity,
                date: new Date()
            }))
        });

        await order.save();
        await req.user.clearCart();
        delete req.session.campaignCode;
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
};

exports.getNewestProducts = (req, res, next) => {
    Promise.all([
        Product.find({ isActive: true, isNewArrival: true })
            .sort({ date: -1 })
            .lean(),
        Category.find().lean()
    ])
    .then(([products, categories]) => {
        res.json({ products, categories, selectedSort: null, selectedCategory: null });
    })
    .catch(err => next(err));
};

exports.getFavoriteProducts = (req, res, next) => {
    Promise.all([
        Product.find({ isActive: true, isFeatured: true }).lean(),
        Category.find().lean()
    ])
    .then(([products, categories]) => {
        res.json({ products, categories, selectedSort: null, selectedCategory: null });
    })
    .catch(err => next(err));
};

exports.getPremiumProducts = (req, res, next) => {
    Promise.all([
        Product.find({ isActive: true }).lean(),
        Category.find().lean()
    ])
    .then(([products, categories]) => {
        const sortedProducts = products
            .sort((a, b) => b.price - a.price)
            .slice(0, 12);

        res.json({ products: sortedProducts, categories, selectedSort: null, selectedCategory: null });
    })
    .catch(err => next(err));
};
