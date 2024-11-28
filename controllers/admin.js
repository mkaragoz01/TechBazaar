const Category = require("../models/category");
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

    Category.findAll()
                .then((categories) => {
                    res.render("admin/add-product",
                        {
                            title: "New Product",
                            path: "/admin/add-product",
                            categories: categories
                        }
                    )
                })
}

exports.postAddProducts = (req,res,next)=>{ 

    const name = req.body.name;
    const price = req.body.price;
    const imgUrl = req.body.imgUrl;
    const description = req.body.description;
    const categoryid = req.body.categoryid;

    Product.create({
        name: name,
        price: price,
        imgUrl: imgUrl,
        description: description,
        categoryId: categoryid
    })
    .then(result => {
        console.log(result)
        res.redirect('/')
    })
    .catch(err => {
        console.log(err);
    })
}


exports.getEditProducts = (req,res,next)=>{

    Product.findByPk(req.params.productid)
        .then((product) => {
            if(!product){
                return res.redirect('/');
            }
            Category.findAll()
                .then((categories) => {
                    res.render('admin/edit-product',{
                        title: 'Edit Product',
                        path: '/admin/products',
                        product: product,
                        categories: categories
                    })
                }).catch((err) => {
                    console.log(err)
                })
        }).catch((err) => {
            console.log(err);
        })
}

exports.postEditProducts = (req,res,next)=>{

    const id = req.body.id;
    const name = req.body.name;
    const price = req.body.price;
    const imgUrl = req.body.imgUrl;
    const description = req.body.description;
    const categoryid = req.body.categoryid;

    Product.findByPk(id)
        .then(product =>{
            product.name = name,
            product.price = price,
            product.imgUrl = imgUrl,
            product.description = description,
            product.categoryId = categoryid,
            product.save();
        })
        .then((result) => {
            console.log('Updated');
            res.redirect("/admin/products?action=edit&success=true");
        })
        .catch(err => {
            console.log(err);
        })
}
    

exports.postDeleteProduct = (req,res,next) => {

    const id = req.body.productid

    Product.destroy({where:{id:id}})
        .then(() => {
            res.redirect("/admin/products?action=delete");
        })
        .catch((err) => {
            console.log(err);
        })
}