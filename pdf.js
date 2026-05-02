const router = require('express').Router();
const PDFDocument = require('pdfkit');
const pool = require('../config/db');
const path = require('path');

// =========================================
// 📄 TALLY-STYLE PROFESSIONAL INVOICE PDF
// =========================================

router.get('/company/:companyId/invoice/:id/pdf', async (req, res) => {
  try {

    const invoiceId = req.params.id;

    // ================= FETCH DATA =================
    const invoiceRes = await pool.query(
      `SELECT * FROM invoices WHERE id = $1`,
      [invoiceId]
    );

    const itemsRes = await pool.query(
      `SELECT * FROM invoice_items WHERE invoice_id = $1`,
      [invoiceId]
    );

    const invoice = invoiceRes.rows[0];
    const items = itemsRes.rows;

    if (!invoice) {
      return res.status(404).send('Invoice not found');
    }

    // ================= PDF INIT =================
    const doc = new PDFDocument({ margin: 30 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${invoiceId}.pdf`
    );

    doc.pipe(res);

    // ================= LOGO =================
    const logoPath = path.join(__dirname, '../assets/logo.png');

    try {
      doc.image(logoPath, 30, 20, { width: 70 });
    } catch (err) {
      console.log('Logo not found');
    }

    // ================= COMPANY HEADER =================
    doc
      .fontSize(18)
      .text('MY BUSINESS PVT LTD', 120, 30);

    doc
      .fontSize(10)
      .text('GSTIN: 27ABCDE1234F1Z5', 120, 50)
      .text('Address: Pune, Maharashtra', 120, 65);

    // ================= INVOICE TITLE =================
    doc
      .fontSize(16)
      .text('TAX INVOICE', 0, 100, { align: 'center' });

    doc.moveDown(2);

    // ================= INVOICE INFO BOX =================
    doc
      .fontSize(10)
      .text(`Invoice No: ${invoice.id}`, 30, 130)
      .text(`Customer ID: ${invoice.customer_id}`, 30, 145)
      .text(`Date: ${new Date().toLocaleDateString()}`, 30, 160);

    doc.moveDown(2);

    // ================= TABLE HEADER (TALLY STYLE) =================
    const tableTop = 200;

    doc
      .fontSize(10)
      .text('Particulars', 30, tableTop)
      .text('Qty', 250, tableTop)
      .text('Rate', 300, tableTop)
      .text('Tax', 360, tableTop)
      .text('Amount', 450, tableTop);

    // LINE
    doc.moveTo(30, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // ================= ITEMS =================
    let y = tableTop + 25;

    let subtotal = 0;
    let totalGST = 0;

    items.forEach((item) => {

      const amount = item.quantity * item.rate;
      const gst = amount * 0.18;

      subtotal += amount;
      totalGST += gst;

      doc
        .fontSize(10)
        .text(`Product ${item.product_id}`, 30, y)
        .text(item.quantity, 250, y)
        .text(item.rate, 300, y)
        .text('18%', 360, y)
        .text((amount + gst).toFixed(2), 450, y);

      y += 20;
    });

    // ================= BORDER LINE =================
    doc.moveTo(30, y).lineTo(550, y).stroke();

    y += 10;

    // ================= TAX BREAKUP (TALLY STYLE) =================
    const cgst = totalGST / 2;
    const sgst = totalGST / 2;
    const grandTotal = subtotal + totalGST;

    doc
      .fontSize(10)
      .text(`Subtotal`, 350, y)
      .text(`₹ ${subtotal.toFixed(2)}`, 450, y);

    y += 15;

    doc
      .text(`CGST (9%)`, 350, y)
      .text(`₹ ${cgst.toFixed(2)}`, 450, y);

    y += 15;

    doc
      .text(`SGST (9%)`, 350, y)
      .text(`₹ ${sgst.toFixed(2)}`, 450, y);

    y += 15;

    doc
      .fontSize(12)
      .text(`GRAND TOTAL`, 350, y)
      .text(`₹ ${grandTotal.toFixed(2)}`, 450, y);

    // ================= FOOTER =================
    doc.moveDown(2);

    doc
      .fontSize(10)
      .text(
        'This is a computer generated invoice and does not require signature.',
        30,
        y + 60,
        { align: 'center', width: 500 }
      );

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).send('PDF generation failed');
  }
});

module.exports = router;