const Product = require("../models/product")
const Category = require("../models/category")
const Brand = require("../models/brand")
const Order = require("../models/order")
const Address = require("../models/address")
const PaymentMethod = require("../models/paymentMethod")
const sorted_all = require("../public/js/sorted")

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

exports.getIndex = (req,res,next) => {
    const sortOption = req.query.sort || 'price_desc';

    Promise.all([Product.find({ isActive: true }).lean(), Category.find().lean()])
    .then(([products, categories]) => {
        const sortedProducts = sorted_all.sortProducts(products, sortOption);

        res.json({
            products: sortedProducts,
            categories: categories,
            selectedSort: sortOption
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
    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined && !Number.isNaN(minPrice)) filter.price.$gte = Math.round(minPrice * 100);
        if (maxPrice !== undefined && !Number.isNaN(maxPrice)) filter.price.$lte = Math.round(maxPrice * 100);
    }
    if (q) {
        filter.$text = { $search: q };
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
            selectedBrand: brandId || null
        });
    })
    .catch(err => next(err));
}

exports.getProduct = (req,res,next) => {
    Product.findOne({_id: req.params.productid, isActive: true})
        .populate('categories')
        .populate('brand')
        .then((product) => {
            if (!product) {
                return res.status(404).json({ error: 'Ürün bulunamadı.' });
            }

            const categoryIds = product.categories.map(c => c._id);

            return Product.find({
                _id: { $ne: product._id },
                isActive: true,
                categories: { $in: categoryIds }
            })
                .limit(8)
                .lean()
                .then(related => {
                    res.json({
                        product: {
                            _id: product._id,
                            name: product.name,
                            price: product.price,
                            description: product.description,
                            imgUrl: product.imgUrl,
                            stock: product.stock,
                            categories: categoryIds,
                        },
                        categoryName: product.categories[0]?.name,
                        brandName: product.brand?.name,
                        relatedProducts: related
                    });
                });
        }).catch((err) => next(err));
}

exports.getCart = (req,res,next) => {
    req.user
        .getCart()
        .then(items => res.json({ items }))
        .catch(err => next(err));
}

exports.postCart = async (req, res, next) => {
    try {
        const productId = req.body.productId;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Ürün bulunamadı.' });
        }

        const existing = req.user.cart.items.find(i => i.productId.toString() === productId);
        const nextQuantity = (existing ? existing.quantity : 0) + 1;
        if (product.stock < nextQuantity) {
            return res.status(409).json({ error: 'Ürün stokta yok.' });
        }

        await req.user.addToCart(product);
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}

exports.postCartItemDelete = (req,res,next) => {
    const productid = req.body.productid;
    req.user
        .deleteCartItem(productid)
        .then(() => res.json({ ok: true }))
        .catch(err => next(err));
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

        // Decrement stock one product at a time with an atomic conditional
        // update (stock check + decrement in one op, so concurrent orders
        // can't both succeed against the same last unit). If a later item
        // turns out to be out of stock, undo the ones already decremented
        // so a partially-failed order never leaves stock counts wrong.
        const decremented = [];
        for (const item of cartItems) {
            const result = await Product.updateOne(
                { _id: item._id, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } }
            );
            if (result.matchedCount === 0) {
                for (const done of decremented) {
                    await Product.updateOne({ _id: done._id }, { $inc: { stock: done.quantity } });
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
            items: cartItems.map(p => ({
                product: {
                    _id: p._id,
                    name: p.name,
                    price: p.price,
                    imgUrl: p.imgUrl
                },
                quantity: p.quantity,
                date: new Date()
            }))
        });

        await order.save();
        await req.user.clearCart();
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
