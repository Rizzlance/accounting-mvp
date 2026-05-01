const service = require("../services/customer.service");

exports.createCustomer = async (req, res) => {
  try {
    const customer = await service.createCustomer(req.companyId, req.body);
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const customers = await service.getCustomers(req.companyId);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const customer = await service.updateCustomer(req.companyId, req.params.id, req.body);
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    await service.deleteCustomer(req.companyId, req.params.id);
    res.json({ message: "Customer deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
