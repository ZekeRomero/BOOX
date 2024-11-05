app.get('/collections', (req, res) => {
    const genres = ['Horror', 'Comedy', 'Romance', 'Sci-Fi', 'Fantasy', 'Mystery']
    res.render('collections', { genres })
})

// this just gets the different buttons to show up... need to make it so each collection leads to a new page of the books