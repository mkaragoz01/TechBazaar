const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
let _db;

const mongoConnect = (callback) =>{
    mongoClient.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/node-app')
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