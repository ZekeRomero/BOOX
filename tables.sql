CREATE TABLE user (
  user_id SERIAL PRIMARY KEY /* the primary key for each entry */,
  user_name VARCHAR(100) NOT NULL
);


CREATE TABLE book (
  book_id SERIAL PRIMARY KEY /* the primary key for each entry */,
  book_name VARCHAR(100) NOT NULL,
  year_of_release SMALLINT NOT NULL,
  author VARCHAR(100) NOT NULL
);

CREATE TABLE bookshelf (
  shelf_id SERIAL PRIMARY KEY /* the primary key for each entry */,
  shelf_name VARCHAR(100) NOT NULL
);

CREATE TABLE collections (
  user_id PRIMARY KEY /* the primary key for each entry */,
  shelf_id PRIMARY KEY,
  book_id INT NOT NULL
);

