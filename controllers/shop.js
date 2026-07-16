const Product = require("../models/product")
const Category = require("../models/category")
const Order = require("../models/order")
const sorted_all = require("../public/js/sorted")

exports.getCategoriesJson = (req,res,next) => {
    Category.find().lean()
        .then(categories => res.json({ categories }))
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

    const filter = { isActive: true };
    if (categoryId) {
        filter.categories = categoryId;
    }

    Promise.all([Product.find(filter).lean(), Category.find().lean()])
    .then(([products, categories]) => {
        const sortedProducts = sorted_all.sortProducts(products, sortOption);

        res.json({
            products: sortedProducts,
            categories: categories,
            selectedSort: sortOption,
            selectedCategory: categoryId || null
        });
    })
    .catch(err => next(err));
}

exports.getProduct = (req,res,next) => {
    Product.findOne({_id: req.params.productid, isActive: true})
        .populate('categories')
        .then((product) => {
            if (!product) {
                return res.status(404).json({ error: 'Ürün bulunamadı.' });
            }

            res.json({
                product: {
                    _id: product._id,
                    name: product.name,
                    price: product.price,
                    description: product.description,
                    imgUrl: product.imgUrl,
                    stock: product.stock,
                    categories: product.categories.map(c => c._id),
                },
                categoryName: product.categories[0]?.name
            });
        }).catch((err) => next(err));
}

exports.getCart = (req,res,next) => {
    req.user
        .getCart()
        .then(items => res.json({ items }))
        .catch(err => next(err));
}

exports.postCart = (req,res,next) => {
    const productId = req.body.productId;
    Product.findById(productId)
        .then(product => {
            if (!product) {
                return res.status(404).json({ error: 'Ürün bulunamadı.' });
            }
            return req.user.addToCart(product);
        })
        .then(() => res.json({ ok: true }))
        .catch(err => next(err));
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

exports.postOrder = (req, res, next) => {
    req.user
        .getCart()
        .then(products => {
            if (!products || products.length === 0) {
                return res.status(400).json({ error: 'Sepetinizde ürün bulunmamaktadır.' });
            }

            const order = new Order({
                user: {
                    userId: req.user._id,
                    name: req.user.name,
                    email: req.user.email
                },
                items: products.map(p => ({
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

            return order.save()
                .then(() => req.user.clearCart())
                .then(() => res.json({ ok: true }));
        })
        .catch(err => next(err));
};

exports.getNewestProducts = (req, res, next) => {
    Promise.all([
        Product.find({ isActive: true })
            .sort({ date: -1 })
            .limit(12)
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
        Product.aggregate([
            { $match: { isActive: true } },
            { $sample: { size: 12 } }
        ]),
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
