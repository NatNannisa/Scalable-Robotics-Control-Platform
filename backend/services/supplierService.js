const registry = require("../adapters/registry");
const models = require("../canonical/models");
const unified = require("./unifiedDataService");
const { HttpError } = require("../auth/authorize");

function supplierScopeFrom(accessContext) {
  const supplierScope = accessContext.supplierScope;
  if (supplierScope != null && !Array.isArray(supplierScope)) {
    throw new TypeError("accessContext.supplierScope must be an array, null, or undefined.");
  }
  return supplierScope;
}

async function getSuppliers(accessContext) {
  const supplierScope = supplierScopeFrom(accessContext);
  const suppliers = registry.listSuppliers(supplierScope).map((supplier) => models.createSupplier({ ...supplier, status: "ACTIVE" }));
  const healthResults = await Promise.all(registry.listAdapters(supplierScope).map(async (adapter) => {
    try {
      return { health: await adapter.healthCheck(), error: null };
    } catch (error) {
      unified.logAdapterFailure(adapter, "healthCheck", error);
      return {
        health: models.createAdapterHealth({ supplier_id: adapter.supplierId, status: "OFFLINE", checked_at: new Date(), message: "Adapter health check failed." }),
        error: { supplier_id: adapter.supplierId, operation: "healthCheck", status: "OFFLINE" }
      };
    }
  }));
  const healthBySupplier = new Map(healthResults.map((result) => [result.health.supplier_id, result.health]));
  const errors = healthResults.flatMap((result) => result.error ? [result.error] : []);
  return {
    suppliers: suppliers.map((supplier) => ({ ...supplier, adapter_health: healthBySupplier.get(supplier.supplier_id) })),
    meta: unified.responseMeta(accessContext, errors)
  };
}

async function getAdapterHealth(accessContext, supplierId) {
  const supplierScope = supplierScopeFrom(accessContext);
  // Authorize before lookup so callers cannot inspect adapters outside their scope.
  if (Array.isArray(supplierScope) && !supplierScope.includes(supplierId)) {
    throw new HttpError(403, "forbidden", "You do not have access to this supplier.");
  }

  const adapter = registry.getAdapter(supplierId);
  if (!adapter) throw new HttpError(404, "not_found", "Supplier adapter was not found.");
  try {
    return { adapter_health: await adapter.healthCheck(), meta: unified.responseMeta(accessContext) };
  } catch (error) {
    unified.logAdapterFailure(adapter, "healthCheck", error);
    return {
      adapter_health: models.createAdapterHealth({ supplier_id: supplierId, status: "OFFLINE", checked_at: new Date(), message: "Adapter health check failed." }),
      meta: unified.responseMeta(accessContext, [{ supplier_id: supplierId, operation: "healthCheck", status: "OFFLINE" }])
    };
  }
}

module.exports = { getSuppliers, getAdapterHealth };
