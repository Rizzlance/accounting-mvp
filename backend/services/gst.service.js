const db = require("../config/db");

const money = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

class GSTService {
  static calculateGST(items, placeOfSupply, companyState) {
    const sameState = String(placeOfSupply || "").toLowerCase() === String(companyState || "").toLowerCase();

    return items.reduce(
      (acc, item) => {
        const taxable = money(Number(item.taxable_amount ?? item.total ?? 0));
        const rate = Number(item.gst_rate ?? item.gst ?? 0);
        const tax = money(taxable * (rate / 100));

        acc.taxable += taxable;
        if (sameState) {
          acc.cgst += money(tax / 2);
          acc.sgst += money(tax / 2);
        } else {
          acc.igst += tax;
        }
        acc.totalTax += tax;
        acc.total += taxable + tax;

        return acc;
      },
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, total: 0 }
    );
  }

  static async getSummary(companyId, month, year) {
    const params = [companyId];
    const filters = ["i.company_id = $1", "COALESCE(i.status, 'POSTED') <> 'VOID'"];

    if (month) {
      params.push(month);
      filters.push(`EXTRACT(MONTH FROM i.invoice_date) = $${params.length}`);
    }

    if (year) {
      params.push(year);
      filters.push(`EXTRACT(YEAR FROM i.invoice_date) = $${params.length}`);
    }

    const result = await db.query(
      `
      SELECT
        COALESCE(SUM(i.taxable_amount), 0) AS taxable_value,
        COALESCE(SUM(i.gst_amount), 0) AS gst_total,
        COALESCE(SUM(i.cgst_amount), 0) AS cgst,
        COALESCE(SUM(i.sgst_amount), 0) AS sgst,
        COALESCE(SUM(i.igst_amount), 0) AS igst,
        COALESCE(SUM(i.total_amount), 0) AS invoice_total
      FROM invoices i
      WHERE ${filters.join(" AND ")}
      `,
      params
    );

    const row = result.rows[0] || {};

    return {
      taxable_value: money(row.taxable_value),
      gst_total: money(row.gst_total),
      cgst: money(row.cgst),
      sgst: money(row.sgst),
      igst: money(row.igst),
      invoice_total: money(row.invoice_total),
    };
  }

  static async getGSTR1(companyId, month, year) {
    const params = [companyId];
    const filters = ["i.company_id = $1", "COALESCE(i.status, 'POSTED') <> 'VOID'"];

    if (month) {
      params.push(month);
      filters.push(`EXTRACT(MONTH FROM i.invoice_date) = $${params.length}`);
    }

    if (year) {
      params.push(year);
      filters.push(`EXTRACT(YEAR FROM i.invoice_date) = $${params.length}`);
    }

    const result = await db.query(
      `
      SELECT
        i.invoice_number,
        i.invoice_date,
        c.name AS customer_name,
        c.gstin AS customer_gstin,
        i.place_of_supply,
        i.taxable_amount,
        i.cgst_amount AS cgst,
        i.sgst_amount AS sgst,
        i.igst_amount AS igst,
        i.gst_amount AS total_tax,
        i.total_amount
      FROM invoices i
      LEFT JOIN customers c ON c.id = i.customer_id
      WHERE ${filters.join(" AND ")}
      ORDER BY i.invoice_date DESC, i.id DESC
      `,
      params
    );

    return result.rows;
  }
}

module.exports = GSTService;
