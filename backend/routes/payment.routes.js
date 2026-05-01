const router = require("express").Router();
const controller = require("../controllers/payment.controller");

router.get("/", controller.getPayments);
router.post("/", controller.createPayment);

module.exports = router;
