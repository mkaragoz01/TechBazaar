const User = require('../models/user');
const bcrypt = require('bcrypt');

exports.getLogin = (req, res) => {
    res.render('account/login', {
        path: '/login',
        title: 'Login',
        isAuthenticated: req.session.isAuthenticated
    });
}

exports.postLogin = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({email: email})
        .then(user => {
            if(!user){
                return res.redirect('/login');
            }
            bcrypt.compare(password,user.password)
                .then(isSuccess => {
                    if (isSuccess) {                        
                        req.session.user = user;
                        req.session.isAuthenticated = true;
                        return req.session.save(err => {
                            console.log(err);
                            res.redirect('/');
                        });
                    }
                    res.redirect('/login');
                }).catch(err => console.log(err));
        }).catch(err => console.log(err));
}


exports.getRegister = (req, res) => {
    res.render('account/register', {
        path: '/register',
        title: 'Register',
        isAuthenticated: req.session.isAuthenticated
    });
}

exports.postRegister = (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({email : email})
        .then(user => {
            if (user) {
                return res.redirect('/register');
            }
            return bcrypt.hash(password, 10)
            .then(hashedPassword => {
                const newUser = new User({
                    name: name,
                    email: email,
                    password: hashedPassword,
                    cart: { items: [] }
                })
            return newUser.save();
            })
        }
        )
        .then(() => {
            res.redirect('/login');
        })
        .catch(err => {
            console.log(err);
        });

    res.redirect('/login');
}

exports.getReset = (req, res) => {
    res.render('account/reset', {
        path: '/reset',
        title: 'Reset',
    });
}

exports.postReset = (req, res) => {
    res.redirect('/login');
}

exports.getLogout = (req, res) => {
    res.redirect('/login');
}