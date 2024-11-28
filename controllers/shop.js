const Product = require("../models/product")
const Category = require("../models/category")

exports.getIndex = (req,res,next) => {

    Product.findAll(
        {
            attiributes: ['id','name','price','imgUrl'],
        }
    )
    .then((products) => {
        Category.findAll()
        .then((categories) => {
            res.render('shop/index',
                {
                    title: 'Shopping',
                    products: products,
                    categories: categories,
                    path: "/"
                }
            )
        }).catch((err) => {
            console.log(err);
        })
    }).catch((err) => {
        console.log(err);
    })
}

exports.getProducts = (req,res,next) => {

    Product.findAll(
        {
            attiributes: ['id','name','price','imgUrl','description'],
        }
    )
    .then((products) => {
        Category.findAll()
        .then((categories) => {
            res.render('shop/products',
                {
                    title: 'Products',
                    products: products,
                    categories: categories,
                    path: "/"
                }
            )
        })
        .catch((err) => {
            console.log(err);
        })
    }).catch((err) => {
        console.log(err);
    })
}

exports.getProductsByCategoryId = (req,res,next) => {
    const categoryid = req.params.categoryid;
    const categories = Category.getAll();
    const products = Product.getProductsByCategoryId(categoryid);
    console.log(products,categories)
    res.render('shop/products',
        {
            title: 'Products',
            products: products,
            categories: categories[0],
            selectedCategory: categoryid,
            path: "/products"
        }
    )
}

exports.getProduct = (req,res,next) => {

    Product.findAll(
        {
            attiributes: ['id','name','price','imgUrl','description'],
            where: {id: req.params.productid}
        })
        .then((products) => {
            res.render('shop/product-detail',{
                title: products[0].name,
                product: products[0],
                path: '/products'
            })
        }).catch((err) => {
            console.log(err);
        })
    // Product.findByPk(req.params.productid)
    //     .then((product) => {
    //         res.render('shop/product-detail',{
    //             title: product.name,
    //             product: product,
    //             path: '/products'
    //         })
    //     }).catch((err) => {
    //         console.log(err);
    //     })
}

exports.getCart = (req,res,next) => {
    const products = Product.getAll();
    res.render('shop/cart',
        {
            title: 'Carts',
            path: "/carts"
        }
    )
}

exports.getProductOrders = (req,res,next) => {
    const products = Product.getAll();
    res.render('shop/orders',
        {
            title: 'Orders',
            path: "/orders"
        }
    )
}
