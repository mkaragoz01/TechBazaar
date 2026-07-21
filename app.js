require('dotenv').config()
const express = require("express")
const bodyParser = require('body-parser')
const path = require('path')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const mongoDbStore = require('connect-mongodb-session')(session)
const helmet = require('helmet')
const requireApiClient = require('./middleware/requireApiClient')

const errorController = require('./controllers/error')
const adminRoutes = require("./routes/admin")
const userRoutes = require('./routes/shop')
const accountRoutes = require('./routes/account')
const checkoutRoutes = require('./routes/checkout')

const User = require("./models/user")
const ErrorLog = require("./models/errorLog")

// Built as a factory (rather than a module-level singleton) so tests can
// point the session store at an isolated in-memory MongoDB instance instead
// of the real dev/prod database — see tests/helpers/testApp.js.
function createApp(connectionString) {
    const app = express()

    const store = new mongoDbStore({
        uri: connectionString,
        collection: 'MySessions'
    })

    // Express is now a pure JSON API (/api/*) plus a static host for uploaded
    // product images (/img/*) — the storefront/admin UI all lives in web/
    // (Next.js) as a separate app, so there's no more HTML/inline-script here
    // for helmet's default CSP to conflict with.
    app.use(helmet())
    app.use(bodyParser.urlencoded({extended: false}))
    app.use(express.json())
    app.use(cookieParser())
    app.use(session({
        secret: process.env.SESSION_SECRET || 'mysecret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 3600000,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        },
        store: store
    }))
    app.use(express.static(path.join(__dirname, "public")));

    app.use((req, res, next) => {
        if (!req.session.user || !req.session.user._id) {
            return next();
        }

        User.findById(req.session.user._id)
            .then(user => {
                if (!user) {
                    return next();
                }
                req.user = user;
                next();
            })
            .catch(err => {
                console.log(err);
                next(err);
            });
    });

    app.use('/api', requireApiClient)
    app.use(adminRoutes);
    app.use(userRoutes);
    app.use(accountRoutes);
    app.use(checkoutRoutes);
    app.use(errorController.get404Page);

    app.use((error, req, res, next) => {
        console.error(error);
        // Fire-and-forget — a logging failure must never delay or break the
        // error response itself.
        ErrorLog.create({
            message: error.message,
            stack: error.stack,
            method: req.method,
            path: req.originalUrl,
            statusCode: error.status || 500,
            userId: req.user ? req.user._id : undefined
        }).catch(logErr => console.error('Error log yazılamadı:', logErr));
        res.status(500).json({ error: 'Beklenmedik bir sunucu hatası oluştu.' });
    });

    return app;
}

module.exports = createApp;
