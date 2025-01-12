const express = require("express")
const app = express()
const bodyParser = require('body-parser')
const path = require('path')
const mongoConnect = require("./utility/database").mongoConnect;

const adminRoutes = require("./routes/admin")
const userRoutes = require('./routes/shop')

const User = require("./models/user")

app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static(path.join(__dirname,"public")));

app.use((req,res,next) => {
    User.findByUserName('mkaragoz')
        .then(user => {
            req.user = new User(user.name, user.email, user._id)
            next();
        })
        .catch(err => {console.log(err);})
})

app.use('/admin',adminRoutes);
app.use(userRoutes);
//app.use(errorController.get404Page)

app.set('view engine', 'pug');
app.set('views', './views');

mongoConnect(()=>{

    User.findByUserName('mkaragoz')
        .then(user => {
            if(!user){
                user = new User('mkaragoz','mkaragoz@gmail.com')
                return user.save();
            }
            return user;
        })
        .then(user => {
            console.log(user)
            app.listen(3000);
        })
        .catch(err => {
            console.log(err);
        })
})
