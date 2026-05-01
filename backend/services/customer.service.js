const repo = require("../repositories/customer.repo");

exports.createCustomer = async (companyId, data) => {
  if (!data.name) throw new Error("Customer name is required");
  return repo.createCustomer(companyId, data);
};

exports.getCustomers = async (companyId) => {
  return repo.getCustomers(companyId);
};

exports.updateCustomer = async (companyId, id, data) => {
  if (!data.name) throw new Error("Customer name is required");

  const customer = await repo.updateCustomer(companyId, id, data);
  if (!customer) throw new Error("Customer not found");

  return customer;
};

exports.deleteCustomer = async (companyId, id) => {
  const customer = await repo.deleteCustomer(companyId, id);
  if (!customer) throw new Error("Customer not found");

  return customer;
};
