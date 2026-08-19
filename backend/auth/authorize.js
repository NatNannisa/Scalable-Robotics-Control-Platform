const { hasPermission, supplierScopeFor } = require("./permissions");
const demoSession = require("./demoSession");

class HttpError extends Error {
  constructor(statusCode, code, message) {
    super(message || code);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function authorize(request, permission) {
  const session = demoSession.sessionFromRequest(request);
  if (!session) throw new HttpError(401, "authentication_required", "A valid demo session is required.");
  if (!hasPermission(session.user.role, permission)) {
    throw new HttpError(403, "forbidden", "This demo role cannot access the requested resource.");
  }
  return { session, supplierScope: supplierScopeFor(session) };
}

module.exports = { HttpError, authorize };
