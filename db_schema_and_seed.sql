-- MySQL schema and seed for mini_erp
CREATE DATABASE IF NOT EXISTS mini_erp;
USE mini_erp;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  quantity INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150),
  amount DECIMAL(12,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed products
INSERT INTO products (name, price, quantity) VALUES
('Gaming Mouse', 120.00, 10),
('Mechanical Keyboard', 350.00, 5),
('Headset', 220.00, 8);

-- Example sales (these will reduce stock if you run them through the API; included as reference only)
-- INSERT INTO sales (product_id, quantity, unit_price, subtotal, tax_rate, tax_amount, total) VALUES (1, 2, 120.00, 240.00, 15.00, 36.00, 276.00);

-- Example expense
-- INSERT INTO expenses (title, amount) VALUES ('Office Rent', 1500.00);