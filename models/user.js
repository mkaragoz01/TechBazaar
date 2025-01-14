const getDb = require("../utility/database").getdb;
const mongodb = require("mongodb");

class User{

    constructor(name,email,cart,id){
        this.name = name;
        this.email = email;
        this.cart = cart ? cart : {};
        this.cart.items = cart ? cart.items : [];
        this._id = id;

    }

    save(){
        const db = getDb();
        return db.collection('user')
            .insertOne(this);
    }

    getCart(){

    }

    addToCart(){

    }

    static findById(userid){
        const db = getDb();
        return db.collection('user')
            .findOne({_id: new mongodb.ObjectId(userid)})
            .then(user => {
                return user
            })
            .catch(err => {
                console.log(err)
            })
    }

    static findByUserName(username){
        const db = getDb();
        return db.collection('user')
            .findOne({name: username})
            .then(user => {
                return user
            })
            .catch(err => {
                console.log(err)
            })
    }
}

module.exports = User;