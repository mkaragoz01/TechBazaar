exports.getLogin = (req, res) => {
    res.render('account/login', {
        path: '/login',
        title: 'Login',
    });
}

exports.postLogin = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
        return res.redirect('/login');
    }

    if (email === "karagozmuhammet45@gmail.com" && password === "1234") {
        req.isAuthenticated = true;
        res.redirect('/');
    } else {
        req.isAuthenticated = false;
        res.redirect('/login');
    }
}


exports.getRegister = (req, res) => {
    res.render('account/register', {
        path: '/register',
        title: 'Register',
    });
}

exports.postRegister = (req, res) => {
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