INSERT INTO users (username, fullname, password)
VALUES ('thatguy', 'Johnny Johnathon', '$2a$10$sexsvH3pYFolIBbcK7uT0uCRE4ABSpF4./FndO/B/o73o2KWLRD/.'), --password is password
('otherguy', 'Name Name', '$2a$10$b.XhuOV5nWMw4XoAcKkDge42/2D8YuaK9zzXazfFtvLMdtMGLJ7Mi'); --password is 123

INSERT INTO isbns (id, book_isbn, book_name)
VALUES
(1, 0060935464, 'To Kill a Mockingbird'),
(2, 1781100489, 'Harry Potter and the Sorcerers Stone'),
(3, 1781100500, 'Harry Potter and the Chamber of Secrets'),
(4, 1781100527, 'Harry Potter and the Goblet of Fire'),
(5, 1781100519, 'Harry Potter and the Prisoner of Azkaban'),
(6, 1781100535, 'Harry Potter and the Order of the Phoenix'),
(7, 1781102430, 'Harry Potter and the Deathly Hallows');


INSERT INTO users_to_isbns(user_id, isbn_id)
VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4);


INSERT INTO reviews (review_id, book_name, author, rating)
VALUES 
('Y4:0', '1984', 'George Orwell', 4.5),
('G1:0', 'Goodnight Moon', 'Margaret Wise Brown', 4.8),
('L1:0', 'Little Prince', 'Antoine de Saint-Exupéry', 4.9);