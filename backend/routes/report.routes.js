const router = require("express").Router();
const controller = require("../controllers/report.controller");

router.get("/trial-balance", controller.trialBalance);
router.get("/profit-loss", controller.profitLoss);
router.get("/balance-sheet", controller.balanceSheet);
router.get("/cash-flow", controller.cashFlow);

module.exports = router;
