const getDb = require("../utility/database").getdb;
const mongodb = require("mongodb");
const { getdb } = require("../utility/database");

class Product{
    constructor(name,price,description,imgUrl,categories,id,userId){
        this.name = name,
        this.price = price,
        this.description = description,
        this.imgUrl = imgUrl,
        this.categories = (categories && !Array.isArray(categories)) ? Array.of(categories) : categories
        this._id = id ? new mongodb.ObjectId(id) : null,
        this.userId = userId;
    }

    save(){
        let db = getDb();
        
        if(this._id){
            db = db.collection('products').updateOne({_id: this._id}, {$set: this})
        }else{
            db = db.collection('products').insertOne(this)
        }

        return db.then(result => {
            console.log(result);
        })
        .catch(err => {console.log(err)});
    }

    static findAll(){
        const db = getDb();
        return db.collection('products')
            .find()
            // .project({name:1, price:1, imgUrl:1}) istediklerimize 1 diyerek veya istenmeyene 0 diyerek yapılabilir.
            .toArray()
            .then(products => {
                return products;
            })
            .catch(err => {console.log(err)});
    }

    static findById(productid){
        const db = getDb();
        return db.collection('products')
            .findOne({_id: new mongodb.ObjectId(productid)})
            // .toArray()
            .then(products => {
                return products;
            })
            .catch(err => {console.log(err)});
    }

    static deleteById(productid){
        const db = getDb()

        return db.collection('products')
            .deleteOne({_id : new mongodb.ObjectId(productid)})
            .then(() => {
                console.log("Deleted");
            })
            .catch(err => {
                console.log(err);
            })
    }

    static findByCategoryId(categoryid){
        const db = getdb()
        return db.collection('products')
        .find({categories: categoryid})
        .toArray()
        .then(products => {
            return products;
        })
        .catch(err => {Console.log(err)})
    }
}

module.exports = Product;