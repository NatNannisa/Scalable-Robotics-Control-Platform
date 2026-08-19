const registry = require("../adapters/registry");
const { nowBangkok } = require("../canonical/models");

function logAdapterFailure(adapter, method, error) {
  console.error(JSON.stringify({
    level: "error",
    code: "supplier_adapter_failure",
    supplier_id: adapter.supplierId,
    operation: method,
    error: error?.message || String(error),
    error_type: error?.constructor?.name || typeof error,
    timestamp: new Date().toISOString()
  }));
}

async function collect(method, accessContext, args = []) {
  const supplierScope = accessContext.supplierScope;
  if (supplierScope != null && !Array.isArray(supplierScope)) {
    throw new TypeError("accessContext.supplierScope must be an array, null, or undefined.");
  }

  const adapters = registry.listAdapters(supplierScope);
  const results = await Promise.all(adapters.map(async (adapter) => {
    try {
      await adapter.authenticate();
      const rows = await adapter[method](...args);
      return { supplierId: adapter.supplierId, rows: Array.isArray(rows) ? rows : [], error: null };
    } catch (error) {
      logAdapterFailure(adapter, method, error);
      return {
        supplierId: adapter.supplierId,
        rows: [],
        error: { supplier_id: adapter.supplierId, status: "OFFLINE", operation: method, message: "Supplier data is temporarily unavailable." }
      };
    }
  }));

  return {
    rows: results.flatMap((result) => result.rows),
    errors: results.flatMap((result) => result.error ? [result.error] : [])
  };
}

function responseMeta(accessContext, errors = []) {
  return {
    generated_at: nowBangkok(),
    supplier_scope: accessContext.supplierScope || "ALL",
    partial: errors.length > 0,
    adapter_errors: errors
  };
}

function normalizeSupplierIds(branch) {
  // Canonical models return an array, but tolerate malformed or bypassed adapter output.
  const value = branch.supplier_ids;
  let supplierIds = [];
  if (Array.isArray(value)) {
    supplierIds = value;
  } else if (typeof value === "string") {
    supplierIds = [value];
  } else if (typeof branch.supplier_id === "string") {
    supplierIds = [branch.supplier_id];
  }

  return [...new Set(supplierIds.filter((supplierId) => typeof supplierId === "string" && supplierId.length > 0))];
}

function mergeBranches(rows) {
  const merged = new Map();
  for (const branch of rows) {
    const supplierIds = normalizeSupplierIds(branch);
    const existing = merged.get(branch.branch_id);
    if (!existing) {
      merged.set(branch.branch_id, { ...branch, supplier_ids: supplierIds });
      continue;
    }
    existing.supplier_ids = [...new Set([...existing.supplier_ids, ...supplierIds])];
    if (!existing.location && branch.location) existing.location = branch.location;
  }
  return [...merged.values()].sort((a, b) => a.branch_name.localeCompare(b.branch_name));
}

module.exports = { collect, responseMeta, mergeBranches, logAdapterFailure };
