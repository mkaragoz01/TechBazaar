const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
let _db;

const mongoConnect = (callback) =>{
    //mongoClient.connect('mongodb+srv://mkaragoz:1234@cluster0.dke2l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    mongoClient.connect('mongodb://localhost:27017/node-app')
    .then(client => {
        console.log("Connected to MongoDB");
        _db = client.db()
        callback(client)
    })
    .catch(err => {
        console.log(err)
        throw err;
    })
}
const getdb = () =>{
    if (_db){
        return _db
    }
    throw 'No Database';
}

exports.mongoConnect = mongoConnect;
exports.getdb = getdb;