const { Mongoose } = require("mongoose");
const Category = require("../models/category");
const Product = require("../models/product")
const Orders = require("../models/order");
const fs = require("fs")

exports.getProducts = (req,res,next) => {
    Product
    .find({userId: req.user._id})
    .populate('userId','name -_id')
    .select('name price imgUrl userId')
    .then((products) => {
        res.render('admin/products',
            {
                title: 'Admin Products',
                products: products,
                path: "/admin/products",
                action: req.query.action,
                
            }
        )
    }).catch((err) => {
        next(err)
    })
}

exports.getAddProducts = (req,res,next)=>{

    Category.find()
        .then(categories => {
            res.render("admin/add-product",
                {
                    title: "New Product",
                    path: "/admin/add-product",
                    inputs: {
                        name: '',
                        price: '',
                        description: ''
                    }
                    ,categories: categories,
                }
            )
        }).catch(err => next(err))
}

exports.postAddProducts = (req,res,next)=>{ 

    const name = req.body.name;
    const price = req.body.price;
    const image = req.file;
    const description = req.body.description;
    const categories = req.body.categoryids;

    if(!image){

        Category.find()
        .then(categories => {
            res.render("admin/add-product",
                {
                    title: "New Product",
                    path: "/admin/add-product",
                    errorMessage: "Lütfen bir resim yükleyin",
                    inputs: {
                        name: name,
                        price: price,
                        description: description,
                        imgUrl: undefined
                    },categories: categories
                }
            )
        }).catch(err => next(err))
        return
    }

    const product = new Product(
        {
            name: name,
            price: price,
            imgUrl: image.filename,
            description: description,
            categories: categories,
            userId: req.user._id,
            isActive: true
        }
    )
  
    product.save()
        .then(() => {
            res.redirect('/admin/products')
        })
        .catch(err => {
            
            if(err.name === "ValidationError"){
                let message = '';
                for(const key in err.errors){
                    message += err.errors[key].message + '<br>'
                }
                Category.find()
                .then(categories => {
                    res.render("admin/add-product",
                        {
                            title: "New Product",
                            path: "/admin/add-product",
                            errorMessage: message,
                            inputs: {
                                name: name,
                                price: price,
                                description: description
                            },categories: categories
                        }
                    )
                }).catch(err => next(err))
                
            }else{
                next(err)
            }

            
        })
}


exports.getEditProducts = (req,res,next)=>{

    Product.findOne({_id:req.params.productid,userId: req.user._id})
        .then(product => {
            if(!product) {
                return res.redirect('/')
            }
            return product;
        })
        .then(product => {

            Category.find()
                .then(categories=> {
                    console.log(categories)
                    categories = categories.map(category => {
                        if(product.categories){
                            product.categories.find(item => {
                                if(item.toString() === category._id.toString()){
                                    category.selected = true
                                }
                            })
                        }
                        
                        return category;
                    })
                    res.render('admin/edit-product',{
                        title: 'Edit Product',
                        path: '/admin/products',
                        product: product,
                        categories: categories,
                        
                    })
                })
        })
        .catch(err => {next(err)})
}

exports.postEditProducts = (req,res,next)=>{

    const id = req.body.id;
    const name = req.body.name;
    const price = req.body.price;
    const image = req.file;
    const description = req.body.description;
    const ids = req.body.categoryids;

    Product.findOne({_id:id, userId: req.user._id})
        .then(product => {
            if(!product) {
                return res.redirect('/')
            }
            product.name = name;
            product.price = price;
            product.description = description;
            product.categories = ids;

            if(image){
                fs.unlink(`public/img/${product.imgUrl}`, (err) => {
                    if(err){
                        console.log(err)
                    }
                })
                product.imgUrl = image.filename
            }
            return product.save()
        }).then(result => {
            res.redirect("/admin/products?action=edit");
        }).catch(err => {next(err)})
}
    

exports.postDeleteProduct = (req,res,next) => {

    const id = req.body.productid

    Product.findOne({_id: id, userId: req.user._id})
        .then(product => {
            if(!product) {
                return next(new Error("Ürün bulunamadı"))
            }
            fs.unlink(`public/img/${product.imgUrl}`, (err) => {
                if(err){
                    console.log(err)
                }
            })

            return Product.deleteOne({_id: id, userId: req.user._id})
                .then((result) => {
                    if(result.deletedCount === 0){
                        return next(new Error("Ürün bulunamadı"))
                    }
                    fs.unlink(`public/img/${product.imgUrl}`, (err) => {
                        if(err){
                            console.log(err)
                        }
                    })
                    res.redirect("/admin/products?action=delete");
                })
                .catch((err) => {
                    next(err);
                })
        })
}

exports.getAddCategory = (req,res,next) => {
    res.render("admin/add-category",{
        title: "New Category",
        path: "/admin/add-category",
        

    })
}

exports.postAddCategory = (req,res,next) => {
    const name = req.body.name;
    const description = req.body.description;

    const category = new Category({
        name: name,
        description: description
    })

    category.save()
        .then(result => {
            res.redirect("/admin/add-category?action:create");
        })
        .catch(err => next(err))
}

exports.getCategories = (req,res,next) => {
    Category.find()
        .then(categories => {
            res.render("admin/categories",{
                title: "Categories",
                path: "/admin/categories",
                categories: categories,
                action: req.query.action,
            })
        }).catch(err => next(err))
}

exports.getEditCategory = (req,res,next)=>{

    Category.findById(req.params.categoryid)
        .then(category => {
            res.render('admin/edit-category',{
                title: 'Edit Categories',
                path: '/admin/categories',
                category: category,
            })
        })
}

exports.postEditCategory = (req,res,next)=>{

    const id = req.body.id;
    const name = req.body.name;
    const description = req.body.description;

    Category.updateOne({_id: id},{
        $set: {
            name: name,
            description: description
        }
    })
    .then(() => {
        res.redirect("/admin/categories?action=edit");
    })
    .catch(err => {
        next(err);
    })
}

exports.postDeleteCategory = (req,res,next)=> {
    const id = req.body.categoryid;
    Category.deleteOne({ _id: id})
    .then((result) => {
        res.redirect("/admin/categories?action=delete");
    })
    .catch(err => {
        next(err);
    })
}

exports.getDashboards = async (req, res, next) => {
  try {
    const orders = await Orders.find()
    .populate('user.userId');
    console.log('Tüm Siparişler: ', orders);
    res.render('admin/dashboards', {
      pageTitle: 'Sipariş Panosu',
      orders : orders,
    });
  } catch (err) {
    console.error(err);
    next(err);
}}