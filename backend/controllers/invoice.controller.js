const PDFDocument = require("pdfkit");
const db = require("../config/db");
const stockService = require("../services/stock.service");
const autoAccounting = require("../services/autoAccounting.service");
const accounting = require("../services/accounting.service");

const money = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const qty = (value) => Number(value || 0);

const normalizeState = (value) => String(value || "").trim().toLowerCase();

const getInvoiceItems = async (invoiceIds) => {
  if (!invoiceIds.length) return {};

  const result = await db.query(
    `
    SELECT
      ii.*,
      p.name AS product_name,
      p.hsn_code,
      p.unit
    FROM invoice_items ii
    LEFT JOIN products p ON p.id = ii.product_id
    WHERE ii.invoice_id = ANY($1::int[])
    ORDER BY ii.id ASC
    `,
    [invoiceIds]
  );

  return result.rows.reduce((acc, item) => {
    if (!acc[item.invoice_id]) acc[item.invoice_id] = [];
    acc[item.invoice_id].push({
      ...item,
      qty: Number(item.qty || item.quantity || 0),
      quantity: Number(item.quantity || item.qty || 0),
      price: Number(item.price || 0),
      gst: Number(item.gst || item.gst_rate || 0),
      gst_rate: Number(item.gst_rate || item.gst || 0),
      taxable_amount: Number(item.taxable_amount || 0),
      gst_amount: Number(item.gst_amount || 0),
      total_amount: Number(item.total_amount || 0),
    });
    return acc;
  }, {});
};

exports.createInvoice = async (req, res) => {
  const client = await db.connect();

  try {
    const { customer_id, items = [] } = req.body;

    if (!customer_id) {
      return res.status(400).json({ error: "Customer is required" });
    }

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "At least one invoice item is required" });
    }

    await client.query("BEGIN");

    const customerResult = await client.query(
      `SELECT * FROM customers WHERE id = $1 AND company_id = $2`,
      [customer_id, req.companyId]
    );

    if (!customerResult.rows.length) {
      throw new Error("Customer not found for this company");
    }

    const companyResult = await client.query(
      `SELECT * FROM companies WHERE id = $1`,
      [req.companyId]
    );

    const customer = customerResult.rows[0];
    const company = companyResult.rows[0] || {};
    const placeOfSupply = req.body.place_of_supply || customer.place_of_supply || company.state || "";
    const companyState = req.body.company_state || company.state || placeOfSupply;
    const isIntraState = normalizeState(placeOfSupply) === normalizeState(companyState);

    const productIds = items.map((item) => Number(item.product_id)).filter(Boolean);
    const productsResult = await client.query(
      `SELECT * FROM products WHERE company_id = $1 AND id = ANY($2::int[])`,
      [req.companyId, productIds]
    );

    const products = productsResult.rows.reduce((acc, product) => {
      acc[product.id] = product;
      return acc;
    }, {});

    const normalizedItems = items.map((item) => {
      const product = products[Number(item.product_id)];
      if (!product) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      const quantity = qty(item.quantity ?? item.qty);
      if (quantity <= 0) {
        throw new Error("Item quantity must be greater than zero");
      }

      const price = money(item.price ?? product.sale_price ?? product.price);
      const gstRate = money(item.gst_rate ?? item.gst ?? product.gst_rate);
      const taxable = money(quantity * price);
      const gstAmount = money(taxable * (gstRate / 100));

      return {
        product_id: product.id,
        description: item.description || product.name,
        quantity,
        price,
        gstRate,
        taxable,
        gstAmount,
        total: money(taxable + gstAmount),
      };
    });

    const subtotal = money(normalizedItems.reduce((sum, item) => sum + item.taxable, 0));
    const gstTotal = money(normalizedItems.reduce((sum, item) => sum + item.gstAmount, 0));
    const grandTotal = money(subtotal + gstTotal);
    const cgst = isIntraState ? money(gstTotal / 2) : 0;
    const sgst = isIntraState ? money(gstTotal / 2) : 0;
    const igst = isIntraState ? 0 : gstTotal;

    const invoiceResult = await client.query(
      `
      INSERT INTO invoices
      (company_id, customer_id, invoice_date, subtotal, taxable_amount, gst_amount, cgst_amount,
       sgst_amount, igst_amount, total, total_amount, grand_total, place_of_supply, status)
      VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9, $9, $9, $10, 'POSTED')
      RETURNING *
      `,
      [
        req.companyId,
        customer_id,
        req.body.invoice_date || new Date(),
        subtotal,
        gstTotal,
        cgst,
        sgst,
        igst,
        grandTotal,
        placeOfSupply || null,
      ]
    );

    let invoice = invoiceResult.rows[0];
    const invoiceNumber = req.body.invoice_number || `INV-${String(invoice.id).padStart(5, "0")}`;

    const updatedInvoice = await client.query(
      `UPDATE invoices SET invoice_number = $1 WHERE id = $2 RETURNING *`,
      [invoiceNumber, invoice.id]
    );

    invoice = updatedInvoice.rows[0];

    for (const item of normalizedItems) {
      await client.query(
        `
        INSERT INTO invoice_items
        (invoice_id, product_id, description, qty, quantity, price, gst, gst_rate, taxable_amount, gst_amount, total_amount)
        VALUES ($1, $2, $3, $4, $4, $5, $6, $6, $7, $8, $9)
        `,
        [
          invoice.id,
          item.product_id,
          item.description,
          item.quantity,
          item.price,
          item.gstRate,
          item.taxable,
          item.gstAmount,
          item.total,
        ]
      );

      await stockService.addEntry({
        companyId: req.companyId,
        productId: item.product_id,
        type: "SALE",
        quantity: item.quantity,
        rate: item.price,
        reference_id: invoice.id,
        reference_type: "INVOICE",
        client,
      });
    }

    const journal = await autoAccounting.handleSalesInvoice({
      companyId: req.companyId,
      invoiceId: invoice.id,
      subtotal,
      gstTotal,
      total: grandTotal,
      client,
    });

    await client.query("COMMIT");

    res.status(201).json({
      message: "Invoice created and posted",
      invoice,
      items: normalizedItems,
      journal,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed to create invoice", details: err.message });
  } finally {
    client.release();
  }
};

exports.getAllInvoices = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT
        i.*,
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.gstin AS customer_gstin
      FROM invoices i
      LEFT JOIN customers c ON c.id = i.customer_id
      WHERE i.company_id = $1 AND COALESCE(i.status, 'POSTED') <> 'VOID'
      ORDER BY i.id DESC
      `,
      [req.companyId]
    );

    const itemsByInvoice = await getInvoiceItems(result.rows.map((invoice) => invoice.id));

    res.json(
      result.rows.map((invoice) => ({
        ...invoice,
        subtotal: Number(invoice.subtotal || 0),
        gst_amount: Number(invoice.gst_amount || 0),
        total_amount: Number(invoice.total_amount || invoice.grand_total || invoice.total || 0),
        grand_total: Number(invoice.grand_total || invoice.total_amount || invoice.total || 0),
        items: itemsByInvoice[invoice.id] || [],
      }))
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch invoices", details: err.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT
        i.*,
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.email AS customer_email,
        c.gstin AS customer_gstin,
        c.address AS customer_address
      FROM invoices i
      LEFT JOIN customers c ON c.id = i.customer_id
      WHERE i.id = $1 AND i.company_id = $2
      `,
      [req.params.id, req.companyId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const itemsByInvoice = await getInvoiceItems([Number(req.params.id)]);

    res.json({
      ...result.rows[0],
      items: itemsByInvoice[req.params.id] || [],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch invoice", details: err.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const invoiceResult = await client.query(
      `
      SELECT *
      FROM invoices
      WHERE id = $1 AND company_id = $2 AND COALESCE(status, 'POSTED') <> 'VOID'
      FOR UPDATE
      `,
      [req.params.id, req.companyId]
    );

    if (!invoiceResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Invoice not found" });
    }

    const items = await client.query(
      `SELECT * FROM invoice_items WHERE invoice_id = $1`,
      [req.params.id]
    );

    for (const item of items.rows) {
      await stockService.addEntry({
        companyId: req.companyId,
        productId: item.product_id,
        type: "SALE_REVERSAL",
        quantity: Number(item.qty || item.quantity || 0),
        rate: Number(item.price || 0),
        reference_id: req.params.id,
        reference_type: "INVOICE_VOID",
        client,
      });
    }

    await accounting.reverseEntry(
      {
        companyId: req.companyId,
        reference_type: "INVOICE",
        reference_id: Number(req.params.id),
        description: `Invoice #${req.params.id} voided`,
      },
      { client }
    );

    await client.query(
      `UPDATE invoices SET status = 'VOID', updated_at = NOW() WHERE id = $1 AND company_id = $2`,
      [req.params.id, req.companyId]
    );

    await client.query("COMMIT");

    res.json({ message: "Invoice voided and accounting reversed" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed to delete invoice", details: err.message });
  } finally {
    client.release();
  }
};

exports.downloadPdf = async (req, res) => {
  try {
    const invoiceResult = await db.query(
      `
      SELECT
        i.*,
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.gstin AS customer_gstin,
        c.address AS customer_address,
        co.company_name,
        co.gst_number,
        co.address AS company_address
      FROM invoices i
      LEFT JOIN customers c ON c.id = i.customer_id
      LEFT JOIN companies co ON co.id = i.company_id
      WHERE i.id = $1 AND i.company_id = $2
      `,
      [req.params.id, req.companyId]
    );

    if (!invoiceResult.rows.length) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const invoice = invoiceResult.rows[0];
    const itemsByInvoice = await getInvoiceItems([Number(req.params.id)]);
    const items = itemsByInvoice[req.params.id] || [];

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${invoice.id}.pdf`);

    doc.pipe(res);

    doc.fontSize(18).text(invoice.company_name || "Company", 40, 40);
    doc.fontSize(9).text(invoice.company_address || "", 40, 64, { width: 260 });
    doc.text(`GSTIN: ${invoice.gst_number || "-"}`, 40, 94);

    doc.fontSize(18).text("TAX INVOICE", 380, 40, { align: "right" });
    doc.fontSize(10).text(`Invoice No: ${invoice.invoice_number || invoice.id}`, 380, 70, { align: "right" });
    doc.text(`Date: ${new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString()}`, 380, 86, { align: "right" });

    doc.moveTo(40, 120).lineTo(555, 120).stroke();
    doc.fontSize(11).text("Bill To", 40, 136);
    doc.fontSize(10).text(invoice.customer_name || "-", 40, 154);
    doc.text(invoice.customer_address || "", 40, 170, { width: 250 });
    doc.text(`Phone: ${invoice.customer_phone || "-"}`, 40, 200);
    doc.text(`GSTIN: ${invoice.customer_gstin || "-"}`, 40, 216);

    let y = 260;
    doc.fontSize(10).text("Item", 40, y);
    doc.text("Qty", 245, y, { width: 45, align: "right" });
    doc.text("Rate", 300, y, { width: 60, align: "right" });
    doc.text("GST", 370, y, { width: 45, align: "right" });
    doc.text("Amount", 455, y, { width: 100, align: "right" });
    y += 18;
    doc.moveTo(40, y).lineTo(555, y).stroke();
    y += 10;

    items.forEach((item) => {
      doc.text(item.product_name || item.description || "-", 40, y, { width: 190 });
      doc.text(String(item.qty), 245, y, { width: 45, align: "right" });
      doc.text(Number(item.price || 0).toFixed(2), 300, y, { width: 60, align: "right" });
      doc.text(`${Number(item.gst || item.gst_rate || 0).toFixed(2)}%`, 370, y, { width: 45, align: "right" });
      doc.text(Number(item.total_amount || 0).toFixed(2), 455, y, { width: 100, align: "right" });
      y += 22;
    });

    y += 15;
    doc.moveTo(320, y).lineTo(555, y).stroke();
    y += 12;
    doc.text("Subtotal", 350, y);
    doc.text(Number(invoice.subtotal || 0).toFixed(2), 455, y, { width: 100, align: "right" });
    y += 18;
    doc.text("GST", 350, y);
    doc.text(Number(invoice.gst_amount || 0).toFixed(2), 455, y, { width: 100, align: "right" });
    y += 22;
    doc.fontSize(12).text("Grand Total", 350, y);
    doc.text(`INR ${Number(invoice.total_amount || invoice.grand_total || 0).toFixed(2)}`, 455, y, { width: 100, align: "right" });

    doc.fontSize(9).text("This is a computer generated invoice.", 40, 760, { align: "center", width: 515 });
    doc.end();
  } catch (err) {
    res.status(500).json({ error: "Failed to generate PDF", details: err.message });
  }
};
