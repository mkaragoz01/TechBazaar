exports.get404Page = (req, res) => {
    res.status(404).json({ error: 'Kaynak bulunamadı.' })
}
