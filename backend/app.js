const express = require("express");
const cors = require("cors");

const auth = require("./middleware/auth.middleware");
const company = require("./middleware/company.middleware");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-company-id"],
  })
);

app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "Accounting ERP Backend" });
});

app.use("/api/auth", require("./routes/auth.routes"));

app.use(auth);

app.use("/api/company", require("./routes/company.routes"));

app.use(company);

app.use("/api/customers", require("./routes/customer.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/invoices", require("./routes/invoice.routes"));
app.use("/api/stock", require("./routes/stock.routes"));
app.use("/api/gst", require("./routes/gst.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/reports", require("./routes/report.routes"));
app.use("/api/ledger", require("./routes/ledger.routes"));
app.use("/api/expenses", require("./routes/expense.routes"));
app.use("/api/payments", require("./routes/payment.routes"));

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

module.exports = app;
