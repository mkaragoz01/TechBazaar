const { Mongoose } = require("mongoose");
const Category = require("../models/category");
const Product = require("../models/product")

exports.getProducts = (req,res,next) => {
    Product.find()
    .populate('userId','name -_id')
    .select('name price imgUrl userId')
    .then((products) => {
        res.render('admin/products',
            {
                title: 'Admin Products',
                products: products,
                path: "/admin/products",
                action: req.query.action,
                isAuthenticated: req.session.isAuthenticated
            }
        )
    }).catch((err) => {
        console.log(err);
    })
}

exports.getAddProducts = (req,res,next)=>{

    res.render("admin/add-product",
        {
            title: "New Product",
            path: "/admin/add-product",
            categories: categories,
            isAuthenticated: req.session.isAuthenticated
        }
    )
}

exports.postAddProducts = (req,res,next)=>{ 

    const name = req.body.name;
    const price = req.body.price;
    const imgUrl = req.body.imgUrl;
    const description = req.body.description;

    const product = new Product(
        {
            name: name,
            price: price,
            imgUrl: imgUrl,
            description: description,
            userId: req.user._id
        }
    )
  
    product.save()
        .then(() => {
            res.redirect('/admin/products')
        })
        .catch(err => {
            console.log(err);
        })
}


exports.getEditProducts = (req,res,next)=>{

    Product.findById(req.params.productid)
        .then(product => {
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
                        isAuthenticated: req.session.isAuthenticated
                    })
                })
        })
        .catch(err => {console.log(err)})
}

exports.postEditProducts = (req,res,next)=>{

    const id = req.body.id;
    const name = req.body.name;
    const price = req.body.price;
    const imgUrl = req.body.imgUrl;
    const description = req.body.description;
    const ids = req.body.categoryids;

    Product.updateOne({_id:id},{
        $set: {
            name: name,
            price: price,
            imgUrl: imgUrl,
            description: description,
            categories: ids,
            isAuthenticated: req.session.isAuthenticated
        }
    })
    .then(()=>{
        res.redirect("/admin/products?action=edit&success=true");
    })
    .catch(err => {console.log(err)})
}
    

exports.postDeleteProduct = (req,res,next) => {

    const id = req.body.productid

    Product.findByIdAndRemove(id)
        .then(() => {
            res.redirect("/admin/products?action=delete");
        })
        .catch((err) => {
            console.log(err);
        })
}

exports.getAddCategory = (req,res,next) => {
    res.render("admin/add-category",{
        title: "New Category",
        path: "/admin/add-category"
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
        .catch(err => console.log(err))
}

exports.getCategories = (req,res,next) => {
    Category.find()
        .then(categories => {
            res.render("admin/categories",{
                title: "Categories",
                path: "/admin/categories",
                categories: categories,
                action: req.query.action,
                isAuthenticated: req.session.isAuthenticated
            })
        }).catch(err => console.log(err))
}

exports.getEditCategory = (req,res,next)=>{

    Category.findById(req.params.categoryid)
        .then(category => {
            res.render('admin/edit-category',{
                title: 'Edit Categories',
                path: '/admin/categories',
                category: category,
                isAuthenticated: req.session.isAuthenticated
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
        console.log(err);
    })
}

exports.postDeleteCategory = (req,res,next)=> {
    const id = req.body.categoryid;
    Category.deleteOne({ _id: id})
    .then((result) => {
        res.redirect("/admin/categories?action=delete");
    })
    .catch(err => {
        console.log(err);
    })
}