CREATE TABLE users (
  user_id SERIAL PRIMARY KEY /* the primary key for each entry */,
  username VARCHAR(100) NOT NULL,
  fullname VARCHAR(100) NOT NULL,
  password VARCHAR(100) NOT NULL
);

CREATE TABLE isbns (
    id SERIAL PRIMARY KEY,
    book_isbn VARCHAR(13) NOT NULL,
    book_name VARCHAR(100) NOT NULL
);


CREATE TABLE users_to_isbns (
    user_id INT NOT NULL,
    isbn_id INT NOT NULL
);

CREATE TABLE user_collections (
    user_id INT NOT NULL,
    store_type INT NOT NULL,
    book_isbn VARCHAR(13) NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
    review_id VARCHAR(36) PRIMARY KEY,
    book_name VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    rating NUMERIC(3, 1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
    message TEXT
);

CREATE INDEX idx_reviews_book_name ON reviews(book_name);
CREATE INDEX idx_reviews_author ON reviews(author);
CREATE INDEX idx_reviews_rating ON reviews(rating);