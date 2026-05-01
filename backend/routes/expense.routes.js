const router = require("express").Router();
const controller = require("../controllers/expense.controller");

router.get("/", controller.getExpenses);
router.post("/", controller.createExpense);

module.exports = router;
