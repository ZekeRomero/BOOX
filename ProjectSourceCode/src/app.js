const user_reviews = `
  SELECT DISTINCT
    reviews.review_id,
    reviews.book_name,
    reviews.author,
    reviews.rating,
    reviews.review_id = $1 AS "taken"
  FROM
    reviews
    JOIN  ON 
    JOIN  ON 
  WHERE 
  ORDER BY reviews.review_id ASC;`;

app.get('/reviews', (req, res) => {
    const taken = req.query.taken;
  
    db.any(taken ? reviews : all_courses, [req.session.user.student_id])
      .then(courses => {
        console.log(courses)
        res.render('pages/reviews', {
          email: user.email,
          reviews,
          action: req.query.taken ? 'delete' : 'add',
        });
      })
      .catch(err => {
        res.render('pages/reviews', {
          reviews: [],
          email: user.email,
          error: true,
          message: err.message,
        });
      });
});

app.post('/reviews/add', (req, res) => {
  const review_id = parseInt(req.body.review_id); // Review ID from user input
  const review_content = req.body.review_content; // Review content from user input
  
  db.tx(async t => {
    // Insert the new review into the reviews table
    await t.none(
      'INSERT INTO reviews(review_id, review_content) VALUES ($1, $2, $3);',
      [review_id, review_content] 
    );
    
    // reviews for the current user
    return t.any('SELECT * FROM reviews WHERE student_id = $1;', [student_id]);
  })
  .then(reviews => {
    // If successful, reviews page with the updated list of reviews
    res.render('pages/reviews', {
      email: req.session.user.email, 
      reviews, 
      message: `Successfully added review ${review_id}`, 
    });
  })
  .catch(err => {
    // If an error occurs, render the page with the error message
    res.render('pages/reviews', {
      email: req.session.user.email, 
      reviews: [], 
      error: true, 
      message: err.message, 
    });
  });
});

app.get('/collections', (req, res) => {
    const genres = ['Horror', 'Comedy', 'Romance', 'Sci-Fi', 'Fantasy', 'Mystery']
    res.render('collections', { genres })
})

// this just gets the different buttons to show up... need to make it so each collection leads to a new page of the books
