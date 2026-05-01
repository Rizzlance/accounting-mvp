const db = require("../config/db");

exports.createCustomer = async (companyId, data) => {
  const result = await db.query(
    `
    INSERT INTO customers
    (company_id, name, phone, email, gstin, address, place_of_supply, opening_balance)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      companyId,
      data.name,
      data.phone || null,
      data.email || null,
      data.gstin || null,
      data.address || null,
      data.place_of_supply || data.placeOfSupply || null,
      Number(data.opening_balance || data.openingBalance || 0),
    ]
  );

  return result.rows[0];
};

exports.getCustomers = async (companyId) => {
  const result = await db.query(
    `
    SELECT *
    FROM customers
    WHERE company_id = $1
    ORDER BY id DESC
    `,
    [companyId]
  );

  return result.rows;
};

exports.updateCustomer = async (companyId, id, data) => {
  const result = await db.query(
    `
    UPDATE customers
    SET
      name = $1,
      phone = $2,
      email = $3,
      gstin = $4,
      address = $5,
      place_of_supply = $6,
      opening_balance = $7,
      updated_at = NOW()
    WHERE company_id = $8 AND id = $9
    RETURNING *
    `,
    [
      data.name,
      data.phone || null,
      data.email || null,
      data.gstin || null,
      data.address || null,
      data.place_of_supply || data.placeOfSupply || null,
      Number(data.opening_balance || data.openingBalance || 0),
      companyId,
      id,
    ]
  );

  return result.rows[0];
};

exports.deleteCustomer = async (companyId, id) => {
  const result = await db.query(
    `DELETE FROM customers WHERE company_id = $1 AND id = $2 RETURNING id`,
    [companyId, id]
  );

  return result.rows[0];
};
