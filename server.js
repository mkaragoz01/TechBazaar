require('dotenv').config()
const mongoose = require('mongoose')
const createApp = require('./app')

const connectionString = process.env.MONGODB_URI || 'mongodb://localhost/node-app';
const app = createApp(connectionString);

mongoose.connect(connectionString)
    .then(() => {
        console.log('Connected to MongoDB')
        app.listen(5000, () => {
            console.log('Server is running on port 5000')
        })
    })
    .catch(err => {
        console.log(err);
    })
