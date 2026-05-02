const router = require('express').Router();
const contactModel = require('../models/contactModel');

router.post('/', async (req, res) => {
  try {
    const { company_id, name, type, phone, gst_number, address } = req.body;

    const contact = await contactModel.createContact(
      company_id,
      name,
      type,
      phone,
      gst_number,
      address
    );

    res.json(contact);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;