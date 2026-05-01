const router = require("express").Router();
const controller = require("../controllers/stock.controller");

router.post("/in", controller.stockIn);
router.post("/out", controller.stockOut);
router.get("/summary", controller.summary);
router.get("/ledger/:productId", controller.ledger);

module.exports = router;
