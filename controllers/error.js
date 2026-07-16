exports.get404Page = (req,res)=>{
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Kaynak bulunamadı.' })
    }
    res.status(404).render("error/404",{title: "Page Not Found"})
}

exports.get500Page = (req,res)=>{
    res.status(500).render("error/500",{title: "Bilinmeyen bir hata oluştu!"})
}