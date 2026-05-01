const db = require("../config/db");

const quantityInOut = (type, quantity) => {
  const qty = Number(quantity || 0);
  const normalized = String(type || "").toUpperCase();

  if (["PURCHASE", "OPENING", "ADJUSTMENT", "ADJUSTMENT_IN", "IN", "SALE_REVERSAL"].includes(normalized)) {
    return { qty_in: qty, qty_out: 0 };
  }

  if (["SALE", "OUT", "ADJUSTMENT_OUT", "PURCHASE_RETURN"].includes(normalized)) {
    return { qty_in: 0, qty_out: qty };
  }

  throw new Error(`Unsupported stock entry type: ${type}`);
};

const query = (client, text, params) => {
  return (client || db).query(text, params);
};

exports.addEntry = async ({
  companyId,
  productId,
  type,
  quantity,
  rate,
  reference_id,
  reference_type,
  notes,
  entry_date,
  client,
}) => {
  if (!companyId || !productId) {
    throw new Error("Company and product are required for stock entry");
  }

  const { qty_in, qty_out } = quantityInOut(type, quantity);

  await query(
    client,
    `
    INSERT INTO stock_ledger
    (company_id, product_id, entry_date, type, qty_in, qty_out, rate, reference_id, reference_type, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
    [
      companyId,
      productId,
      entry_date || new Date(),
      String(type).toUpperCase(),
      qty_in,
      qty_out,
      Number(rate || 0),
      reference_id || null,
      reference_type || null,
      notes || null,
    ]
  );
};

exports.addStock = async ({ companyId, productId, quantity, rate, notes }) => {
  return exports.addEntry({
    companyId,
    productId,
    type: "PURCHASE",
    quantity,
    rate,
    reference_type: "MANUAL",
    notes,
  });
};

exports.removeStock = async ({ companyId, productId, quantity, rate, notes }) => {
  return exports.addEntry({
    companyId,
    productId,
    type: "SALE",
    quantity,
    rate,
    reference_type: "MANUAL",
    notes,
  });
};

exports.getStock = async (companyId, productId) => {
  const result = await db.query(
    `
    SELECT COALESCE(SUM(qty_in), 0) - COALESCE(SUM(qty_out), 0) AS stock
    FROM stock_ledger
    WHERE company_id = $1 AND product_id = $2
    `,
    [companyId, productId]
  );

  return Number(result.rows[0]?.stock || 0);
};

exports.getStockSummary = async (companyId) => {
  const result = await db.query(
    `
    SELECT
      p.id,
      p.name,
      p.sku,
      p.unit,
      p.sale_price,
      p.purchase_price,
      COALESCE(SUM(sl.qty_in), 0) AS total_in,
      COALESCE(SUM(sl.qty_out), 0) AS total_out,
      COALESCE(SUM(sl.qty_in), 0) - COALESCE(SUM(sl.qty_out), 0) AS stock,
      (COALESCE(SUM(sl.qty_in), 0) - COALESCE(SUM(sl.qty_out), 0)) * COALESCE(NULLIF(p.purchase_price, 0), p.sale_price, 0) AS stock_value
    FROM products p
    LEFT JOIN stock_ledger sl ON sl.product_id = p.id AND sl.company_id = p.company_id
    WHERE p.company_id = $1 AND COALESCE(p.is_active, true) = true
    GROUP BY p.id
    ORDER BY p.name
    `,
    [companyId]
  );

  return result.rows.map((row) => ({
    ...row,
    total_in: Number(row.total_in || 0),
    total_out: Number(row.total_out || 0),
    stock: Number(row.stock || 0),
    stock_value: Number(row.stock_value || 0),
  }));
};

exports.getStockLedger = async (productId, companyId) => {
  const result = await db.query(
    `
    SELECT
      sl.*,
      p.name AS product_name
    FROM stock_ledger sl
    JOIN products p ON p.id = sl.product_id
    WHERE sl.company_id = $1 AND sl.product_id = $2
    ORDER BY sl.entry_date ASC, sl.id ASC
    `,
    [companyId, productId]
  );

  let running = 0;

  return result.rows.map((row) => {
    running += Number(row.qty_in || 0) - Number(row.qty_out || 0);
    return {
      ...row,
      qty_in: Number(row.qty_in || 0),
      qty_out: Number(row.qty_out || 0),
      running_stock: running,
    };
  });
};
