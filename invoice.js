const router = require('express').Router();
const auth = require('../middleware/auth');
const pool = require('../config/db');
const PDFDocument = require('pdfkit');


// ==============================
// ➕ CREATE INVOICE
// ==============================
router.post('/', auth, async (req, res) => {
  try {
    const company_id = parseInt(req.headers['x-company-id']);
    const { customer_id, items } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'Company ID missing' });
    }

    if (!customer_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Invalid invoice data' });
    }

    let subtotal = 0;
    let gst_total = 0;

    // CALCULATE TOTALS
    items.forEach(i => {
      const qty = Number(i.qty) || 0;
      const price = Number(i.price) || 0;
      const gst = Number(i.gst) || 0;

      const amount = qty * price;
      const gstAmount = amount * (gst / 100);

      subtotal += amount;
      gst_total += gstAmount;
    });

    const total = subtotal + gst_total;

    // INSERT INVOICE
    const invoiceRes = await pool.query(
      `INSERT INTO invoices (company_id, customer_id, subtotal, gst_amount, total_amount)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [company_id, customer_id, subtotal, gst_total, total]
    );

    const invoice = invoiceRes.rows[0];

    // INSERT ITEMS
    for (let i of items) {
      await pool.query(
        `INSERT INTO invoice_items (invoice_id, product_id, qty, price, gst)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          invoice.id,
          Number(i.product_id),
          Number(i.qty),
          Number(i.price),
          Number(i.gst)
        ]
      );
    }

    res.json(invoice);

  } catch (err) {
    console.error("INVOICE CREATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ==============================
// 📄 GENERATE PDF
// ==============================
router.get('/pdf/:id', auth, async (req, res) => {
  try {
    const invoiceId = req.params.id;

    // 🧾 FETCH INVOICE + CUSTOMER
    const invoiceRes = await pool.query(
      `SELECT i.*, c.name AS customer_name, c.phone, c.address
       FROM invoices i
       LEFT JOIN customers c ON c.id = i.customer_id
       WHERE i.id = $1`,
      [invoiceId]
    );

    if (invoiceRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceRes.rows[0];

    // 📦 FETCH ITEMS
    const itemsRes = await pool.query(
      `SELECT ii.*, p.name
       FROM invoice_items ii
       LEFT JOIN products p ON p.id = ii.product_id
       WHERE ii.invoice_id = $1`,
      [invoiceId]
    );

    const items = itemsRes.rows;

    // 📄 CREATE PDF
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${invoiceId}.pdf`
    );

    doc.pipe(res);

    // =========================
    // HEADER
    // =========================
    doc
      .fontSize(18)
      .text('YOUR COMPANY NAME', 40, 40);

    doc
      .fontSize(10)
      .text('Address Line 1, City', 40, 60)
      .text('GSTIN: 22AAAAA0000A1Z5', 40, 75);

    doc
      .fontSize(20)
      .text('TAX INVOICE', 400, 40);

    // =========================
    // CUSTOMER BOX
    // =========================
    doc.rect(40, 110, 520, 80).stroke();

    doc.fontSize(10)
      .text(`Customer: ${invoice.customer_name || '-'}`, 50, 120)
      .text(`Phone: ${invoice.phone || '-'}`, 50, 135)
      .text(`Address: ${invoice.address || '-'}`, 50, 150);

    doc.text(`Invoice No: ${invoice.id}`, 350, 120)
       .text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 350, 135);

    // =========================
    // TABLE HEADER
    // =========================
    let y = 210;

    doc.rect(40, y, 520, 25).stroke();

    doc.fontSize(10)
      .text('Item', 45, y + 8)
      .text('Qty', 250, y + 8)
      .text('Price', 300, y + 8)
      .text('GST%', 370, y + 8)
      .text('Amount', 450, y + 8);

    y += 25;

    // =========================
    // ITEMS
    // =========================
    items.forEach(i => {
      const total = i.qty * i.price;

      doc.rect(40, y, 520, 25).stroke();

      doc.text(i.name || '-', 45, y + 8);
      doc.text(i.qty.toString(), 250, y + 8);
      doc.text(i.price.toString(), 300, y + 8);
      doc.text(i.gst.toString(), 370, y + 8);
      doc.text(total.toFixed(2), 450, y + 8);

      y += 25;
    });

    // =========================
    // TOTAL BOX
    // =========================
    y += 20;

    doc.rect(300, y, 260, 80).stroke();

    doc.fontSize(10)
      .text(`Subtotal: ₹ ${invoice.subtotal}`, 310, y + 10)
      .text(`GST: ₹ ${invoice.gst_amount}`, 310, y + 30);

    doc
      .fontSize(14)
      .text(`Total: ₹ ${invoice.total_amount}`, 310, y + 55);

    // =========================
    // FOOTER
    // =========================
    doc
      .fontSize(10)
      .text('Thank you for your business!', 40, y + 120);

    doc.end();

  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 📥 GET ALL INVOICES
// ==============================
router.get('/', auth, async (req, res) => {
  try {
    const company_id = parseInt(req.headers['x-company-id']);

    const result = await pool.query(
      `SELECT i.id, i.total_amount, i.created_at,
              c.name AS customer_name
       FROM invoices i
       LEFT JOIN customers c ON c.id = i.customer_id
       WHERE i.company_id = $1
       ORDER BY i.id DESC`,
      [company_id]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("GET INVOICES ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ==============================
// ❌ DELETE INVOICE
// ==============================
router.delete('/:id', auth, async (req, res) => {
  try {
    const company_id = parseInt(req.headers['x-company-id']);
    const id = req.params.id;

    // delete items first
    await pool.query(
      `DELETE FROM invoice_items WHERE invoice_id = $1`,
      [id]
    );

    // delete invoice
    await pool.query(
      `DELETE FROM invoices WHERE id = $1 AND company_id = $2`,
      [id, company_id]
    );

    res.json({ message: 'Invoice deleted' });

  } catch (err) {
    console.error("DELETE INVOICE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;