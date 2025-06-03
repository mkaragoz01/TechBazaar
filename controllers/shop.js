const Product = require("../models/product")
const Category = require("../models/category")
const Order = require("../models/order")
const sorted_all = require("../public/js/sorted")

exports.getIndex = (req,res,next) => {
    const sortOption = req.query.sort || 'price_desc';
    
    Promise.all([Product.find().lean(), Category.find()])
    .then(([products, categories]) => {
        // Ürünleri sırala
        const sortedProducts = sorted_all.sortProducts(products, sortOption);

        res.render('shop/index', {
            title: 'Shopping',
            products: sortedProducts,
            path: "/",
            categories: categories,
            selectedSort: sortOption
        });
    })
    .catch(err => next(err));
}

exports.getProducts = (req,res,next) => {
    const sortOption = req.query.sort || 'price_desc';

    Promise.all([Product.find().lean(), Category.find()])
    .then(([products, categories]) => {
        // Ürünleri sırala
        const sortedProducts = sorted_all.sortProducts(products, sortOption);

        res.render('shop/products', {
            title: 'Products',
            products: sortedProducts,
            path: req.path,
            categories: categories,
            selectedSort: sortOption
        });
    })
    .catch((err) => {
        next(err);
    });
}

exports.getProductsByCategoryId = (req, res, next) => {
    const categoryid = req.params.categoryid;
    const model = [];
    
    const sortOption = req.query.sort || 'price_desc';
    
    const getSort = () => {
        switch(sortOption) {
            case 'price_asc':
                return (a, b) => parseFloat(a.price.replace(/[^\d.-]/g, '')) - parseFloat(b.price.replace(/[^\d.-]/g, ''));
            case 'price_desc':
                return (a, b) => parseFloat(b.price.replace(/[^\d.-]/g, '')) - parseFloat(a.price.replace(/[^\d.-]/g, ''));
            default:
                return (a, b) => parseFloat(a.price.replace(/[^\d.-]/g, '')) - parseFloat(b.price.replace(/[^\d.-]/g, ''));
        }
    };

    Category.find()
        .then(categories => {
            model.categories = categories;
            return Product.find({ categories: categoryid }).lean();
        })
        .then(products => {
        
            const sortedProducts = products.sort(getSort());
            
            res.render('shop/products', {
                title: 'Products',
                products: sortedProducts,
                categories: model.categories,
                selectedCategory: categoryid,
                selectedSort: sortOption,
                path: "/products"
            });
        })
        .catch((err) => {
            next(err);
        });
};

exports.getProduct = (req,res,next) => {

    Product.findOne({_id: req.params.productid})
        .populate('categories')
        .then((products) => {
            res.render('shop/product-detail',{
                title: products.name,
                product: products,
                categoryName: products.categories[0]?.name,
                path: '/products'
            })
        }).catch((err) => {
            next(err);
        })
}

exports.getCart = (req,res,next) => {
    req.user
        .getCart()
        .then(products =>{
            res.render('shop/cart',
                {
                    title: 'Cart',
                    path: "/cart",
                    products: products,
                }
            )
        })
        .catch(err=>{
            next(err);
        })
}

exports.postCart = (req,res,next) => {
    const productId = req.body.productId;
    Product.findById(productId)
    .then(product => {
        return req.user.addToCart(product)
    })
    .then(()=>{
        res.redirect('/cart')
    })
    .catch(err => next(err))
}

exports.postCartItemDelete = (req,res,next) => {
    const productid = req.body.productid;
    req.user
        .deleteCartItem(productid)
        .then(() => {
            res.redirect("/cart");
        })
}

exports.getOrders = (req,res,next) => {
    Order
    .find({ "user.userId": req.user._id })
    .then(orders =>{
        res.render('shop/orders',
            {
                title: 'Orders',
                path: "/orders",
                orders: orders,
                
            }
        )
    })
    .catch(err=>{
        next(err);
    })
}

exports.postOrder = (req, res, next) => {
    req.user
        .getCart()
        .then(products => {
            if (!products || products.length === 0) {
                throw new Error('Sepetinizde ürün bulunmamaktadır.');
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

            return order.save();
        })
        .then(() => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => {
            console.error('Error in postOrder:', err);
            req.session.errorMessage = err.message;
            res.redirect('/cart');
        });
};

exports.getNewestProducts = (req, res, next) => {
    Promise.all([
        Product.find()
            .sort({ date: -1 })  
            .limit(12),        
        Category.find()
    ])
    .then(([products, categories]) => {
        res.render('shop/products', {
            title: 'En Yeni Ürünler',
            products: products,
            path: req.path,
            categories: categories
        });
    })
    .catch(err => next(err));
};

exports.getFavoriteProducts = (req, res, next) => {
    Promise.all([
        Product.aggregate([
            { $sample: { size: 12 } } 
        ]),
        Category.find()
    ])
    .then(([products, categories]) => {
        res.render('shop/products', {
            title: 'Favori Ürünler',
            products: products,
            path: req.path,
            categories: categories
        });
    })
    .catch(err => next(err));
};

exports.getPremiumProducts = (req, res, next) => {
    Promise.all([
        Product.find().lean(), 
        Category.find()
    ])
    .then(([products, categories]) => {
        const sortedProducts = products
            .sort((a, b) => {
                const priceA = parseFloat(a.price.replace(/[^\d.-]/g, ''));
                const priceB = parseFloat(b.price.replace(/[^\d.-]/g, ''));
                return priceB - priceA; 
            })
            .slice(0, 12); 

        res.render('shop/products', {
            title: 'Premium Ürünler',
            products: sortedProducts,
            path: req.path,
            categories: categories
        });
    })
    .catch(err => next(err));
};
