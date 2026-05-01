const router = require("express").Router();
const controller = require("../controllers/ledger.controller");

router.post("/ensure-defaults", controller.ensureDefaults);
router.get("/", controller.listLedgers);
router.post("/", controller.createLedger);
router.post("/entry", controller.createEntry);
router.get("/entries", controller.listEntries);
router.get("/balance/:ledgerId", controller.getBalance);
router.get("/statement/:ledgerId", controller.getStatement);

module.exports = router;
