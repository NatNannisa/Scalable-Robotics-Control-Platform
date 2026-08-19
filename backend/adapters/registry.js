const SupplierAAdapter = require("./SupplierAAdapter");
const SupplierBAdapter = require("./SupplierBAdapter");
const SupplierCAdapter = require("./SupplierCAdapter");

const adapters = new Map([
  ["supplier-a", new SupplierAAdapter()],
  ["supplier-b", new SupplierBAdapter()],
  ["supplier-c", new SupplierCAdapter()]
]);

function getAdapter(supplierId) {
  return adapters.get(supplierId) || null;
}

function listAdapters(supplierScope = null) {
  const values = [...adapters.values()];
  return supplierScope ? values.filter((adapter) => supplierScope.includes(adapter.supplierId)) : values;
}

function listSuppliers(supplierScope = null) {
  // Reuse adapter filtering so supplier metadata follows the same authorization scope.
  return listAdapters(supplierScope).map((adapter) => ({ supplier_id: adapter.supplierId, supplier_name: adapter.supplierName }));
}

module.exports = { getAdapter, listAdapters, listSuppliers };
