const router = require("express").Router();
const db = require("../config/db");
const accounting = require("../services/accounting.service");

router.post("/", async (req, res) => {
  const client = await db.connect();

  try {
    const { company_name, gst_number, address, state } = req.body;

    if (!company_name) {
      return res.status(400).json({ error: "Company name is required" });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `
      INSERT INTO companies (user_id, company_name, gst_number, address, state)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [req.user.id, company_name, gst_number || null, address || null, state || null]
    );

    await accounting.ensureDefaultLedgers(result.rows[0].id, client);

    await client.query("COMMIT");

    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM companies WHERE user_id = $1 ORDER BY id DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const requestedUserId = Number(req.params.userId);
    if (requestedUserId !== Number(req.user.id)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const result = await db.query(
      `SELECT * FROM companies WHERE user_id = $1 ORDER BY id DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
