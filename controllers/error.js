exports.get404Page = (req,res)=>{
    res.status(404).render("../views/error/404",{title: "Page Not Found"})
}