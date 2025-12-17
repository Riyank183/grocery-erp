// app.js (backend)
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());


// Connect to MySQL
import mysql from "mysql2";

const db = mysql.createPool(process.env.DATABASE_URL);
export default db;





// Add a new sale and update inventory



// Routes

const PDFDocument = require('pdfkit');

app.get('/invoice/:saleId', async (req, res) => {
  try {
    const { saleId } = req.params;

    const [rows] = await db.query(`
      SELECT s.*, p.name AS product_name
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE s.id = ?
    `, [saleId]);

    if (!rows.length) return res.status(404).send('Invoice not found');

    const sale = rows[0];
const unitPrice = Number(sale.unit_price);
const subtotal  = Number(sale.subtotal);
const taxAmount = Number(sale.tax_amount);
const total     = Number(sale.total);


    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename=invoice-${saleId}.pdf`
    );

    doc.pipe(res);

    /* ---------- HEADER ---------- */
    const path = require("path");

const logoPath = path.join(__dirname, "public", "grocery.png");
doc.image(logoPath, 20, 25, { width: 120 });

    doc
  .fontSize(20)
  .text('INVOICE', 400, 50, { align: 'right' });

    doc
      .fontSize(10)
      .text(`Invoice #: ${saleId}`, 400, 80, { align: 'right' })
      .text(`Date: ${new Date(sale.created_at).toLocaleDateString()}`, { align: 'right' });

    doc.moveDown(2);

    /* ---------- TABLE HEADER ---------- */
    const tableTop = 150;

    doc
      .fontSize(11)
      .text('#', 50, tableTop)
      .text('Product', 80, tableTop)
      .text('Qty', 280, tableTop)
      .text('Unit Price', 330, tableTop)
      .text('Total', 430, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    /* ---------- TABLE ROW ---------- */
const rowY = tableTop + 25;

doc
  .fontSize(11)
  .text('1', 50, rowY)
  .text(sale.product_name, 80, rowY)
  .text(sale.quantity, 280, rowY)
  .text(`SAR ${unitPrice.toFixed(2)}`, 330, rowY)
  .text(`SAR ${subtotal.toFixed(2)}`, 430, rowY);

/* ---------- TOTALS ---------- */
const summaryTop = rowY + 50;

doc
  .fontSize(11)
  .text('Subtotal:', 350, summaryTop)
  .text(`SAR ${subtotal.toFixed(2)}`, 450, summaryTop, { align: 'right' });

doc
  .text('Tax:', 350, summaryTop + 20)
  .text(`SAR ${taxAmount.toFixed(2)}`, 450, summaryTop + 20, { align: 'right' });

doc
  .fontSize(13)
  .text('TOTAL:', 350, summaryTop + 45)
  .text(`SAR ${total.toFixed(2)}`, 450, summaryTop + 45, { align: 'right' });


    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to generate invoice');
  }
});



// Add expense
app.post('/add-expense', async (req, res) => {
  try {
    const { category, amount, note } = req.body;
    await db.query(
      "INSERT INTO expenses (category, amount, note) VALUES (?, ?, ?)",
      [category, amount, note || null]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all expenses
app.get('/get-expenses', async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM expenses ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit expense
app.put('/edit-expense/:id', async (req, res) => {
  try {
    const { category, amount, note } = req.body;
    const { id } = req.params;

    await db.query(
      `UPDATE expenses 
       SET category = ?, amount = ?, note = ?
       WHERE id = ?`,
      [category, amount, note || null, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
app.delete('/delete-expense/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM expenses WHERE id = ?', [id]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

app.use(express.static('public')); // serve frontend files


// Get all products
app.get('/get-products', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// Add a product
app.post('/add-product', async (req, res) => {
  try {
    const { name, price, quantity } = req.body;
    await db.query(
      'INSERT INTO products (name, price, quantity) VALUES (?, ?, ?)',
      [name, price, quantity]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// Edit product (FIXED)
app.put('/edit-product/:id', async (req, res) => {
  try {
    const { name, price, quantity } = req.body;
    const { id } = req.params;

    await db.query(
      `UPDATE products 
       SET name = ?, price = ?, quantity = ?
       WHERE id = ?`,
      [name, price, quantity, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// Delete a product
app.delete('/delete-product/:id', async (req, res) => {
  try {
    const id = req.params.id;

    await db.query("DELETE FROM products WHERE id=?", [id]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



// --- Get all sales ---
app.get('/get-sales', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.id, s.product_id, p.name AS product_name, s.quantity, s.unit_price, s.subtotal, s.tax_rate, s.tax_amount, s.total, s.created_at
      FROM sales s
      JOIN products p ON s.product_id = p.id
      ORDER BY s.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Edit sale
app.put('/edit-sale/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { quantity, tax_rate } = req.body;

    // Get sale & product
    const [saleRows] = await db.query(
      "SELECT * FROM sales WHERE id=?",
      [id]
    );
    const sale = saleRows[0];

    const [productRows] = await db.query(
      "SELECT * FROM products WHERE id=?",
      [sale.product_id]
    );
    const product = productRows[0];

    // Calculate stock adjustment
    const difference = quantity - sale.quantity; // + means more sold, - means refund
    if (product.quantity < difference)
      return res.status(400).json({ error: "Not enough stock" });

    // New calculations
    const unit_price = product.price;
    const subtotal = unit_price * quantity;
    const tax_amount = (subtotal * tax_rate) / 100;
    const total = subtotal + tax_amount;

    // Update sale
    await db.query(
      `UPDATE sales SET quantity=?, subtotal=?, tax_rate=?, tax_amount=?, total=? WHERE id=?`,
      [quantity, subtotal, tax_rate, tax_amount, total, id]
    );

    // Update stock
    await db.query(
      "UPDATE products SET quantity = quantity - ? WHERE id=?",
      [difference, sale.product_id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete sale (restore stock)
app.delete('/delete-sale/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // fetch sale
    const [rows] = await db.query("SELECT * FROM sales WHERE id=?", [id]);
    if (!rows.length) return res.status(400).json({ error: "Sale not found" });

    const sale = rows[0];

    // restore stock
    await db.query(
      "UPDATE products SET quantity = quantity + ? WHERE id=?",
      [sale.quantity, sale.product_id]
    );

    // delete row
    await db.query("DELETE FROM sales WHERE id=?", [id]);

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// --- Add a sale + update inventory (transactional, safe) ---
app.post('/add-sale', async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { product_id, quantity, tax_rate } = req.body;
    if (!product_id || !quantity) return res.status(400).json({ error: 'product_id and quantity required' });

    await conn.beginTransaction();

    const [prodRows] = await conn.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [product_id]);
    if (!prodRows.length) throw new Error('Product not found');

    const product = prodRows[0];
    if (product.quantity < quantity) throw new Error('Insufficient stock');

    const unit_price = Number(product.price);
    const subtotal = unit_price * quantity;
    const tax_amount = (subtotal * (tax_rate || 0)) / 100;
    const total = subtotal + tax_amount;

    await conn.query(
      `INSERT INTO sales (product_id, quantity, unit_price, subtotal, tax_rate, tax_amount, total, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [product_id, quantity, unit_price, subtotal, tax_rate || 0, tax_amount, total]
    );

    await conn.query(
      "UPDATE products SET quantity = quantity - ? WHERE id = ?",
      [quantity, product_id]
    );

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    conn.release();
  }
});

app.get('/dashboard-kpis', async (req, res) => {
  try {
    const [[{ total_products }]] = await db.query("SELECT COUNT(*) AS total_products FROM products");

    const [[{ total_sales }]] = await db.query("SELECT COUNT(*) AS total_sales FROM sales");

    const [[{ revenue }]] = await db.query("SELECT IFNULL(SUM(total),0) AS revenue FROM sales");

    const [[{ expenses }]] = await db.query("SELECT IFNULL(SUM(amount),0) AS expenses FROM expenses");

    res.json({ total_products, total_sales, revenue, expenses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/dashboard-sales-chart', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        SUM(total) AS total_sales
      FROM sales
      GROUP BY month
      ORDER BY month
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/dashboard-low-stock', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT name, quantity
      FROM products
      WHERE quantity <= 5
      ORDER BY quantity ASC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Dashboard: Top Selling Products (by quantity sold) ---
app.get('/dashboard/top-products', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.name AS product_name,
        SUM(s.quantity) AS total_sold
      FROM sales s
      JOIN products p ON s.product_id = p.id
      GROUP BY s.product_id
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load top products." });
  }
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mini ERP running on port ${PORT}`);
});
