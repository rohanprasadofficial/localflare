-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  published INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert sample data
INSERT INTO users (email, name, role) VALUES
  ('alice@example.com', 'Alice Johnson', 'admin'),
  ('bob@example.com', 'Bob Smith', 'user'),
  ('charlie@example.com', 'Charlie Brown', 'user'),
  ('diana@example.com', 'Diana Prince', 'moderator');

INSERT INTO posts (user_id, title, content, published) VALUES
  (1, 'Welcome to Localflare', 'This is a sample post to demonstrate the D1 database explorer.', 1),
  (1, 'Getting Started Guide', 'Learn how to use Localflare for local Cloudflare development.', 1),
  (2, 'My First Post', 'Hello world! This is my first post on the platform.', 1),
  (3, 'Draft Post', 'This is a draft that has not been published yet.', 0);

INSERT INTO comments (post_id, user_id, content) VALUES
  (1, 2, 'Great introduction! Looking forward to using Localflare.'),
  (1, 3, 'This is exactly what I needed for local development.'),
  (2, 4, 'Very helpful guide, thanks for sharing!');
