// <const Category = require("../models/category");
const Product = require("../models/product")

exports.getProducts = (req,res,next) => {
    Product.findAll()
    .then((products) => {
        res.render('admin/products',
            {
                title: 'Admin Products',
                products: products,
                path: "/admin/products",
                action: req.query.action
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
            // categories: categories
        }
    )
}

exports.postAddProducts = (req,res,next)=>{ 

    const name = req.body.name;
    const price = req.body.price;
    const imgUrl = req.body.imgUrl;
    const description = req.body.description;

    const product = new Product(name , price, description, imgUrl)
    // const categoryid = req.body.categoryid;
    // const user = req.user;

    // user.createProduct({
    //     name: name,
    //     price: price,
    //     imgUrl: imgUrl,
    //     description: description,
    //     categoryId: categoryid,
    // })
    product.save()
        .then(result => {
            res.redirect('/admin/products')
        })
        .catch(err => {
            console.log(err);
        })
}


exports.getEditProducts = (req,res,next)=>{

    Product.findById(req.params.productid)
        .then(product => {
            console.log(product)
            res.render('admin/edit-product',{
                title: 'Edit Product',
                path: '/admin/products',
                product: product,
                // categories: categories
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
    //const categoryid = req.body.categoryid;

    const product = new Product(name,price,description,imgUrl,id)

    product.save()
        .then((result) => {
            res.redirect("/admin/products?action=edit&success=true");
        })
        .catch(err => {
            console.log(err);
        })
}
    

exports.postDeleteProduct = (req,res,next) => {

    const id = req.body.productid

    Product.deleteById(id)
        .then(() => {
            res.redirect("/admin/products?action=delete");
        })
        .catch((err) => {
            console.log(err);
        })
}