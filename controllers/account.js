const User = require('../models/user');
const Login = require('../models/login');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto')
require("dotenv").config();


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL,
        pass: process.env.PW,
    }
});

exports.getLogin = (req, res) => {
    var errorMessage = req.session.errorMessage;
    delete req.session.errorMessage

    res.render('account/login', {
        path: '/login',
        title: 'Login',
        errorMessage: errorMessage,
    });
}

exports.postLogin = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const loginModel = new Login({
        email: email,
        password: password
    });

    loginModel.validate()
        .then(() => {
            return User.findOne({ email: email });
        })
        .then(user => {
            if (!user) {
                req.session.errorMessage = 'Bu mail adresi ile kayıtlı bir kullanıcı bulunamadı.';
                return req.session.save(err => {
                    if (err) console.log(err);
                    return res.redirect('/login');
                });
            }

            return bcrypt.compare(password, user.password)
                .then(isSuccess => {
                    if (isSuccess) {
                        req.session.user = user;
                        req.session.isAuthenticated = true;
                        req.session.isAdmin = user.isAdmin;
                        return req.session.save(err => {
                            if (err) console.log(err);
                            const url = req.session.redirectTo || '/';
                            delete req.session.redirectTo;
                            return res.redirect(url);
                        });
                    }
                    
                    req.session.errorMessage = 'Yanlış şifre!';
                    return req.session.save(err => {
                        if (err) console.log(err);
                        return res.redirect('/login');
                    });
                });
        })
        .catch(err => {
            if (err.name === "ValidationError") {
                let message = '';
                for (const key in err.errors) {
                    message += err.errors[key].message + '<br>';
                }

                return res.render('account/login', {
                    path: '/login',
                    title: 'Login',
                    errorMessage: message,
                });
            } else {
                next(err);
            }
        });
};



exports.getRegister = (req, res) => {
    var errorMessage = req.session.errorMessage;
    delete req.session.errorMessage

    res.render('account/register', {
        path: '/register',
        title: 'Register',
        isAuthenticated: req.session.isAuthenticated,
        errorMessage: errorMessage,
    });
}

exports.postRegister = (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({email : email})
        .then(user => {
            if(user){
                req.session.errorMessage = 'Bu mail adresi üzerine kayıtlı kullanıcı bulunmaktadır.';
                req.session.save(function (err) {
                    console.log(err);
                        return res.redirect('/register');
                });}
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
            const mailOptions = {
                from: '"TechStore" <karagozmuhammet45@gmail.com>',
                to: email,
                subject: 'Hesap Oluşturuldu',
                html: '<h1>Hesap Oluşturuldu</h1><p>Hesabınız başarıyla oluşturuldu.</p>',
                text: 'Hesabınız başarıyla oluşturuldu.'
            };

            transporter.sendMail(mailOptions)
                .then(() => {
                    console.log('Mail gönderildi.');
                })
                .catch(err => {
                    console.error('Mail gönderme hatası:', err);
                });

        })
        .catch(err => {
            if (err.name === "ValidationError") {
                let message = '';
                for (const key in err.errors) {
                    message += err.errors[key].message + '<br>';
                }

                return res.render('account/register', {
                    path: '/register',
                    title: 'Register',
                    errorMessage: message,
                });
            } else {
                next(err);
            }
        });

        res.redirect('/login');
}

exports.getReset = (req, res) => {
    var errorMessage = req.session.errorMessage;
    delete req.session.errorMessage

    res.render('account/reset', {
        path: '/reset-password',
        title: 'Reset Password',
        errorMessage: errorMessage,
    });
}

exports.postReset = (req, res) => {
    const email = req.body.email;

    crypto.randomBytes(32,(err,buffer)=>{
        if(err){
            
            return res.redirect('/reset-password')
        }
        const token = buffer.toString('hex')

        User.findOne({email:email})
            .then(user=>{
                if(!user){
                    req.session.errorMessage = 'Bu mail adresi ile kayıtlı bir kullanıcı bulunamadı.';
                    req.session.save(function (err) {
                        ;
                            return res.redirect('/reset-password');
                    });
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;

                return user.save()
            }).then(result=> {
                res.redirect('/')

                const mailOptions = {
                    from: '"TechStore" <karagozmuhammet45@gmail.com>',
                    to: email,
                    subject: 'Parola Sıfırlama',
                    html: `<p>Parolanızı güncellemek için aşağıdaki linke tıklayınız.</p>
                           <p>
                            <a href="http://localhost:3000/reset-password/${token}">Parola Sıfırlama Linki</a>
                           </p>`,
                    text: 'Hesabınız başarıyla oluşturuldu.'
                };
    
                transporter.sendMail(mailOptions)
                    .then(() => {
                        console.log('Mail gönderildi.');
                    })
                    .catch(err => {
                        console.error('Mail gönderme hatası:', err);
                    });
            })
    })
}

exports.getLogout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            next(err);
        }
        res.redirect('/');
    });
}

exports.getNewPassword = (req, res) => {
    const token = req.params.token;
    errorMessage = req.session.errorMessage;
    delete req.session.errorMessage;

    User.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() }
    })
    .then(user => {
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/reset-password');
        }

        var errorMessage = req.session.errorMessage;
        delete req.session.errorMessage;

        res.render('account/new-password', {
            path: '/new-password',
            title: 'New Password',
            errorMessage: errorMessage,
            userId: user._id.toString(),
            passwordToken: token
        });
    })
    .catch(err => {
        console.error(err);
        req.flash('error', 'An error occurred. Please try again.');
        res.redirect('/reset-password');
    });
};

exports.postNewPassword = (req, res) => {
    const userId = req.body.userId;
    const newPassword = req.body.password;
    const token = req.body.passwordToken;
    let _user;

    User.findOne({
        resetToken:token,resetTokenExpiration:{
            $gt:Date.now()
        },
        _id: userId
    })
        .then(user => {
            _user = user;
            return bcrypt.hash(newPassword, 10);
        })
        .then(hashedPassword => {
            _user.password = hashedPassword;
            _user.resetToken = undefined;
            _user.resetTokenExpiration = undefined;
            return _user.save();
        })
        .then(()=> {
            res.redirect('/login')
        }).catch(err => console.log(err))
}