const db = require("../config/db");

module.exports = async function companyMiddleware(req, res, next) {
  try {
    const companyId = Number(req.headers["x-company-id"]);

    if (!companyId) {
      return res.status(400).json({ error: "Company context missing" });
    }

    const result = await db.query(
      `SELECT id FROM companies WHERE id = $1 AND user_id = $2`,
      [companyId, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(403).json({ error: "Company access denied" });
    }

    req.companyId = companyId;
    next();
  } catch (err) {
    return res.status(400).json({ error: "Invalid company context" });
  }
};
