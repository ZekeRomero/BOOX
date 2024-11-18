
INSERT INTO users (user_id, username, fullname, password)
VALUES 
(1, 'thatguy', 'Johnny Johnathon', '$2a$10$sexsvH3pYFolIBbcK7uT0uCRE4ABSpF4./FndO/B/o73o2KWLRD/.');


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