const User = require('../models/user');
const Login = require('../models/login');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto')
require("dotenv").config();

const WEB_ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:3000';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL,
        pass: process.env.PW,
    }
});

function validationMessage(err) {
    return Object.values(err.errors).map(e => e.message).join(' ');
}

// The stored password is a bcrypt hash, so a Mongoose minlength validator on
// the schema field would only ever measure the ~60-char hash — this has to
// run on the raw password, before hashing, in the controller.
function isValidPassword(password) {
    return typeof password === 'string' && password.length >= 6;
}
const PASSWORD_LENGTH_ERROR = 'Parola en az 6 karakter olmalıdır.';

exports.getMe = (req, res) => {
    if (!req.session.isAuthenticated || !req.user) {
        return res.status(401).json({ error: 'Giriş yapılmamış.' });
    }

    res.json({
        user: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            isAdmin: req.user.isAdmin,
        }
    });
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const loginModel = new Login({ email, password });

    loginModel.validate()
        .then(() => User.findOne({ email }))
        .then(user => {
            if (!user) {
                return res.status(401).json({ error: 'Bu mail adresi ile kayıtlı bir kullanıcı bulunamadı.' });
            }

            return bcrypt.compare(password, user.password)
                .then(isSuccess => {
                    if (!isSuccess) {
                        return res.status(401).json({ error: 'Yanlış şifre!' });
                    }

                    req.session.user = user;
                    req.session.isAuthenticated = true;
                    req.session.isAdmin = user.isAdmin;
                    return req.session.save(err => {
                        if (err) return next(err);
                        res.json({
                            user: {
                                _id: user._id,
                                name: user.name,
                                email: user.email,
                                isAdmin: user.isAdmin,
                            }
                        });
                    });
                });
        })
        .catch(err => {
            if (err.name === "ValidationError") {
                return res.status(400).json({ error: validationMessage(err) });
            }
            next(err);
        });
};

exports.postRegister = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    if (!isValidPassword(password)) {
        return res.status(400).json({ error: PASSWORD_LENGTH_ERROR });
    }

    User.findOne({ email })
        .then(user => {
            if (user) {
                return res.status(409).json({ error: 'Bu mail adresi üzerine kayıtlı kullanıcı bulunmaktadır.' });
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
                .then(() => {
                    const mailOptions = {
                        from: '"TechStore" <karagozmuhammet45@gmail.com>',
                        to: email,
                        subject: 'Hesap Oluşturuldu',
                        html: '<h1>Hesap Oluşturuldu</h1><p>Hesabınız başarıyla oluşturuldu.</p>',
                        text: 'Hesabınız başarıyla oluşturuldu.'
                    };

                    transporter.sendMail(mailOptions)
                        .then(() => console.log('Mail gönderildi.'))
                        .catch(err => console.error('Mail gönderme hatası:', err));

                    res.status(201).json({ ok: true });
                });
        })
        .catch(err => {
            if (err.name === "ValidationError") {
                return res.status(400).json({ error: validationMessage(err) });
            }
            next(err);
        });
}

exports.postReset = (req, res, next) => {
    const email = req.body.email;

    crypto.randomBytes(32, (err, buffer) => {
        if (err) return next(err);
        const token = buffer.toString('hex')

        User.findOne({ email })
            .then(user => {
                if (!user) {
                    return res.status(404).json({ error: 'Bu mail adresi ile kayıtlı bir kullanıcı bulunamadı.' });
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;

                return user.save().then(() => {
                    res.json({ ok: true });

                    const mailOptions = {
                        from: '"TechStore" <karagozmuhammet45@gmail.com>',
                        to: email,
                        subject: 'Parola Sıfırlama',
                        html: `<p>Parolanızı güncellemek için aşağıdaki linke tıklayınız.</p>
                               <p>
                                <a href="${WEB_ORIGIN}/reset-password/${token}">Parola Sıfırlama Linki</a>
                               </p>`,
                        text: 'Parolanızı sıfırlamak için maildeki linke tıklayınız.'
                    };

                    transporter.sendMail(mailOptions)
                        .then(() => console.log('Mail gönderildi.'))
                        .catch(err => console.error('Mail gönderme hatası:', err));
                });
            })
            .catch(err => next(err));
    })
}

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err) return next(err);
        res.json({ ok: true });
    });
}

exports.getNewPasswordToken = (req, res, next) => {
    const token = req.params.token;

    User.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() }
    })
    .then(user => {
        if (!user) {
            return res.status(400).json({ error: 'Parola sıfırlama linki geçersiz veya süresi dolmuş.' });
        }

        res.json({ userId: user._id.toString(), passwordToken: token });
    })
    .catch(err => next(err));
};

exports.postNewPassword = (req, res, next) => {
    const userId = req.body.userId;
    const newPassword = req.body.password;
    const token = req.body.passwordToken;

    if (!isValidPassword(newPassword)) {
        return res.status(400).json({ error: PASSWORD_LENGTH_ERROR });
    }

    User.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId
    })
        .then(user => {
            if (!user) {
                return res.status(400).json({ error: 'Parola sıfırlama linki geçersiz veya süresi dolmuş.' });
            }

            return bcrypt.hash(newPassword, 10)
                .then(hashedPassword => {
                    user.password = hashedPassword;
                    user.resetToken = undefined;
                    user.resetTokenExpiration = undefined;
                    return user.save();
                })
                .then(() => {
                    res.json({ ok: true });
                });
        })
        .catch(err => next(err));
}
