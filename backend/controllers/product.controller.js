const db = require("../config/db");
const stockService = require("../services/stock.service");

const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const productSelect = `
  SELECT
    p.*,
    COALESCE(SUM(sl.qty_in), 0) - COALESCE(SUM(sl.qty_out), 0) AS live_stock
  FROM products p
  LEFT JOIN stock_ledger sl ON sl.product_id = p.id AND sl.company_id = p.company_id
`;

exports.createProduct = async (req, res) => {
  const client = await db.connect();

  try {
    const {
      name,
      sku,
      hsn_code,
      unit,
      purchase_price,
      gst_rate,
    } = req.body;

    const salePrice = number(req.body.sale_price ?? req.body.price);
    const openingStock = number(req.body.opening_stock ?? req.body.stock);

    if (!name) {
      return res.status(400).json({ error: "Product name is required" });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `
      INSERT INTO products
      (company_id, name, sku, hsn_code, unit, sale_price, price, purchase_price, gst_rate, opening_stock, stock, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $9, true)
      RETURNING *
      `,
      [
        req.companyId,
        name,
        sku || null,
        hsn_code || null,
        unit || "Nos",
        salePrice,
        number(purchase_price),
        number(gst_rate),
        openingStock,
      ]
    );

    const product = result.rows[0];

    if (openingStock > 0) {
      await stockService.addEntry({
        companyId: req.companyId,
        productId: product.id,
        type: "OPENING",
        quantity: openingStock,
        rate: number(purchase_price || salePrice),
        reference_id: product.id,
        reference_type: "PRODUCT_OPENING",
        notes: "Opening stock",
        client,
      });
    }

    await client.query("COMMIT");

    res.status(201).json({ message: "Product created", product });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed to create product", details: err.message });
  } finally {
    client.release();
  }
};

exports.getProducts = async (req, res) => {
  try {
    const result = await db.query(
      `
      ${productSelect}
      WHERE p.company_id = $1 AND COALESCE(p.is_active, true) = true
      GROUP BY p.id
      ORDER BY p.id DESC
      `,
      [req.companyId]
    );

    const products = result.rows.map((product) => ({
      ...product,
      price: Number(product.sale_price || product.price || 0),
      sale_price: Number(product.sale_price || product.price || 0),
      purchase_price: Number(product.purchase_price || 0),
      gst_rate: Number(product.gst_rate || 0),
      stock: Number(product.live_stock || 0),
    }));

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products", details: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const result = await db.query(
      `
      ${productSelect}
      WHERE p.id = $1 AND p.company_id = $2
      GROUP BY p.id
      `,
      [req.params.id, req.companyId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = result.rows[0];

    res.json({
      ...product,
      price: Number(product.sale_price || product.price || 0),
      sale_price: Number(product.sale_price || product.price || 0),
      purchase_price: Number(product.purchase_price || 0),
      gst_rate: Number(product.gst_rate || 0),
      stock: Number(product.live_stock || 0),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product", details: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const salePrice = number(req.body.sale_price ?? req.body.price);

    const result = await db.query(
      `
      UPDATE products
      SET
        name = $1,
        sku = $2,
        hsn_code = $3,
        unit = $4,
        sale_price = $5,
        price = $5,
        purchase_price = $6,
        gst_rate = $7,
        updated_at = NOW()
      WHERE id = $8 AND company_id = $9
      RETURNING *
      `,
      [
        req.body.name,
        req.body.sku || null,
        req.body.hsn_code || null,
        req.body.unit || "Nos",
        salePrice,
        number(req.body.purchase_price),
        number(req.body.gst_rate),
        req.params.id,
        req.companyId,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product updated", product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update product", details: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const result = await db.query(
      `
      UPDATE products
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND company_id = $2
      RETURNING id
      `,
      [req.params.id, req.companyId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product archived" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product", details: err.message });
  }
};
