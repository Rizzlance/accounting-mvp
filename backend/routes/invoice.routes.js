const router = require("express").Router();
const controller = require("../controllers/invoice.controller");

router.post("/", controller.createInvoice);
router.get("/", controller.getAllInvoices);
router.get("/pdf/:id", controller.downloadPdf);
router.get("/:id/pdf", controller.downloadPdf);
router.get("/:id", controller.getInvoiceById);
router.delete("/:id", controller.deleteInvoice);

module.exports = router;
