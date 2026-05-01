const router = require("express").Router();
const controller = require("../controllers/gst.controller");

router.get("/", controller.summary);
router.get("/report", controller.summary);
router.get("/gstr1", controller.gstr1);
router.post("/calculate", controller.calculate);
router.post("/", controller.calculate);

module.exports = router;
