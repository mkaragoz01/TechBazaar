const express = require("express")
const app = express()
const bodyParser = require('body-parser')
const path = require('path')
const mongoose = require('mongoose')

const adminRoutes = require("./routes/admin")
const userRoutes = require('./routes/shop')

const User = require("./models/user")

app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static(path.join(__dirname,"public")));

app.use((req,res,next) => {
    User.findOne({name: 'mkaragoz'})
        .then(user => {
            req.user = user
            next();
        })
        .catch(err => {console.log(err);})
})

app.use('/admin',adminRoutes);
app.use(userRoutes);
//app.use(errorController.get404Page)

app.set('view engine', 'pug');
app.set('views', './views');

mongoose.connect('mongodb://localhost/node-app')
    .then(()=> {
        console.log('Connected to MongoDB')
        
        
        User.findOne({name: 'mkaragoz'})
            .then(user => {
                if(!user){
                    user = new User({
                        name: "mkaragoz",
                        email: "karagozmuhammet45@gmail.com",
                        cart:{
                            items: []
                        }
                            
                    })
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
    .catch(err => {
        console.log(err);
    })
