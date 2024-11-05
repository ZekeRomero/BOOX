
const user_reviews = `
  SELECT DISTINCT
    reviews.review_id,
    reviews.course_name,
    reviews.book_name,
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
    const review_id = parseInt(req.body.review_id);
    db.tx(async t => {
      await t.none(
        'INSERT INTO book_reviews(review_id) VALUES ($1);',
        [course_id, req.session.user.student_id]
      );
      return t.any(user_reviews, [req.session.user.review_id]);
    })
      .then(courses => {
        res.render('pages/reviews', {
          email: user.email,
          reviews,
          message: `Successfully added review ${req.body.review_id}`,
        });
      })
      .catch(err => {
        res.render('pages/reviews', {
          email: user.email,
          courses: [],
          error: true,
          message: err.message,
        });
      });
  });