const express = require("express")
const app = express()
const bodyParser = require('body-parser')
const path = require('path')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const mongoDbStore = require('connect-mongodb-session')(session)
const csurf = require('csurf')

const errorController = require('./controllers/error')
const adminRoutes = require("./routes/admin")
const userRoutes = require('./routes/shop')
const accountRoutes = require('./routes/account')
const connectionString = 'mongodb://localhost/node-app';

const User = require("./models/user")

var store = new mongoDbStore({
    uri: connectionString,
    collection: 'MySessions'
})

app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use(session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 3600000 },
    store: store
})),
app.use(express.static(path.join(__dirname,"public")));

app.use((req, res, next) => {
    if (!req.session.user || !req.session.user._id) {
        return next();
    }

    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                return next(); // kullanıcı bulunamazsa devam et
            }
            req.user = user;
            next();
        })
        .catch(err => {
            console.log(err);
            next(err);
        });
});

app.use(csurf())
app.use('/admin',adminRoutes);
app.use(userRoutes);
app.use(accountRoutes);
app.use(errorController.get404Page);

app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).render('error/500', { title: 'Error' });
});


app.set('view engine', 'pug');
app.set('views', './views');

mongoose.connect(connectionString)
    .then(()=> {
        console.log('Connected to MongoDB')
        app.listen(3000, () => {
            console.log('Server is running on port 3000')
        })
    })
    .catch(err => {
        console.log(err);
    })
