-- Migration number: 0001 	 2025-12-05T13:23:34.982Z
DROP TABLE IF EXISTS todos;
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  text TEXT, 
  completed BOOLEAN, 
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO todos (text, completed) VALUES ('Alfreds Futterkiste', 0), ('Around the Horn', 0), ('Bs Beverages', 0), ('Bs Beverages', 0);