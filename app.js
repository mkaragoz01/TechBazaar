const express = require("express")
const app = express()
const bodyParser = require('body-parser')
const path = require('path')
const mongoConnect = require("./utility/database").mongoConnect;

const adminRoutes = require("./routes/admin")
const userRoutes = require('./routes/shop')

app.use(bodyParser.urlencoded({extended: false}))

app.use('/admin',adminRoutes);
app.use(userRoutes);

app.use(express.static(path.join(__dirname,"public")));

// app.use(errorController.get404Page)

app.set('view engine', 'pug');
app.set('views', './views');

mongoConnect(()=>{
    app.listen(3000);
})
