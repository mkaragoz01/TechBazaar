const Product = require("../models/product")
const Category = require("../models/category")
const Order = require("../models/order")

exports.getIndex = (req,res,next) => {

    Promise.all([Product.find(), Category.find()])
    .then(([products, categories]) => {
        res.render('shop/index', {
            title: 'Shopping',
            products: products,
            path: "/",
            categories: categories
        });
    })
    .catch(err => next(err));

}

exports.getProducts = (req,res,next) => {

    Promise.all([Product.find(), Category.find()])
    .then(([products, categories]) => {
        res.render('shop/products',
            {
                title: 'Products',
                products: products,
                path: req.path,
                categories: categories
            }
        )
    })
    .catch((err) => {
        next(err);
    })
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
        .populate('cart.items.productId') // populate doğrudan çalışır
        .then(user => {
            const order = new Order({
                user: {
                    userId: req.user._id,
                    name: req.user.name,
                    email: req.user.email
                },
                items: user.cart.items.map(p => {
                    return {
                        product: {
                            _id: p.productId._id,
                            name: p.productId.name,
                            price: p.productId.price,
                            imgUrl: p.productId.imgUrl
                        },
                        quantity: p.quantity
                    }
                })
            });
            return order.save();
        })
        .then(() => {
            return req.user.clearCart(); // Sepeti temizlemek için
        })
        .then(() => {
            res.redirect('/orders'); // Sipariş başarıyla kaydedildikten sonra yönlendirme
        })
        .catch(err => {
            next(err); // Hata varsa bir sonraki middleware'e yönlendir
        });
};
