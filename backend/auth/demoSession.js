const { randomUUID } = require("node:crypto");
const { ROLES } = require("./roles");

const SESSION_COOKIE = "cp_demo_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const DEMO_USERS = Object.freeze({
  "cp-admin-1": Object.freeze({ user_id: "cp-admin-1", display_name: "CP Admin Demo", role: ROLES.CP_ADMIN, supplier_id: null }),
  "cp-ops-1": Object.freeze({ user_id: "cp-ops-1", display_name: "CP Operation Demo", role: ROLES.CP_OPERATION, supplier_id: null }),
  "supplier-a-user-1": Object.freeze({ user_id: "supplier-a-user-1", display_name: "Supplier A Demo", role: ROLES.EXTERNAL_SUPPLIER, supplier_id: "supplier-a" }),
  "supplier-b-user-1": Object.freeze({ user_id: "supplier-b-user-1", display_name: "Supplier B Demo", role: ROLES.EXTERNAL_SUPPLIER, supplier_id: "supplier-b" }),
  "supplier-c-user-1": Object.freeze({ user_id: "supplier-c-user-1", display_name: "Supplier C Demo", role: ROLES.EXTERNAL_SUPPLIER, supplier_id: "supplier-c" })
});

const sessions = new Map();

function createSession(userId) {
  const user = DEMO_USERS[userId];
  if (!user) return null;
  const token = randomUUID();
  const session = {
    token,
    user: { ...user },
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString()
  };
  sessions.set(token, session);
  return session;
}

function getSession(token) {
  const session = token ? sessions.get(token) : null;
  if (!session) return null;
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

function tokenFromRequest(request) {
  const authorization = request.headers.authorization || "";
  if (authorization.startsWith("Bearer ")) return authorization.slice(7).trim();

  const cookies = Object.fromEntries(
    String(request.headers.cookie || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        return separator < 0 ? [part, ""] : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
      })
  );
  return cookies[SESSION_COOKIE] || null;
}

function sessionFromRequest(request) {
  return getSession(tokenFromRequest(request));
}

function sessionCookie(token) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}`;
}

module.exports = { DEMO_USERS, createSession, getSession, sessionFromRequest, sessionCookie };
