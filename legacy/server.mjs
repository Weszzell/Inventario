import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { createInventoryDatabase } from "../lib/inventory-db.mjs";

const root = resolve(process.cwd(), "legacy");
const port = Number(process.env.PORT || 3000);
const inventoryDb = createInventoryDatabase();
const sessions = new Map();

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function sendFile(pathname, response) {
  const safePath = normalize(join(root, pathname));
  if (!safePath.startsWith(root) || !existsSync(safePath) || statSync(safePath).isDirectory()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Arquivo nao encontrado");
    return;
  }

  const ext = extname(safePath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": contentTypes[ext] || "application/octet-stream",
    "Cache-Control": "no-cache",
  });
  createReadStream(safePath).pipe(response);
}

function sendJson(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-cache",
    ...extraHeaders,
  });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("JSON invalido"));
      }
    });
    request.on("error", reject);
  });
}

function parseCookies(cookieHeader = "") {
  const cookies = {};
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (!key) continue;
    cookies[key] = decodeURIComponent(rest.join("="));
  }
  return cookies;
}

function createSession(user) {
  const token = randomBytes(24).toString("hex");
  sessions.set(token, {
    userId: user.id,
    createdAt: Date.now(),
  });
  return token;
}

function destroySession(request) {
  const cookies = parseCookies(request.headers.cookie || "");
  if (cookies.session) {
    sessions.delete(cookies.session);
  }
}

function getAuthenticatedUser(request) {
  const cookies = parseCookies(request.headers.cookie || "");
  const session = cookies.session ? sessions.get(cookies.session) : null;
  if (!session) return null;
  return inventoryDb.getUserById(session.userId);
}

function requireAuth(request) {
  const user = getAuthenticatedUser(request);
  if (!user) {
    const error = new Error("Nao autenticado");
    error.statusCode = 401;
    throw error;
  }
  return user;
}

function requireAdmin(user) {
  if (user.role !== "admin") {
    const error = new Error("Apenas administradores podem acessar esta area");
    error.statusCode = 403;
    throw error;
  }
}

async function handleApi(request, response, url) {
  const { pathname } = url;

  if (request.method === "POST" && pathname === "/api/auth/login") {
    const body = await readJsonBody(request);
    const attemptedUsername = String(body.username || "").trim();
    const user = inventoryDb.authenticateUser(body.username, body.password);
    if (!user) {
      inventoryDb.logAction({
        actorName: attemptedUsername || "Desconhecido",
        action: "login_failed",
        targetType: "auth",
        targetId: attemptedUsername,
        details: { username: attemptedUsername },
      });
      sendJson(response, 401, { error: "Usuario ou senha invalidos" });
      return true;
    }
    const token = createSession(user);
    inventoryDb.logAction({
      actorUserId: user.id,
      actorName: user.displayName || user.username,
      action: "login_succeeded",
      targetType: "user",
      targetId: String(user.id),
      details: { username: user.username },
    });
    sendJson(
      response,
      200,
      { user },
      { "Set-Cookie": `session=${token}; HttpOnly; Path=/; SameSite=Lax` },
    );
    return true;
  }

  if (request.method === "POST" && pathname === "/api/auth/logout") {
    const currentUser = getAuthenticatedUser(request);
    if (currentUser) {
      inventoryDb.logAction({
        actorUserId: currentUser.id,
        actorName: currentUser.displayName || currentUser.username,
        action: "logout",
        targetType: "user",
        targetId: String(currentUser.id),
        details: { username: currentUser.username },
      });
    }
    destroySession(request);
    sendJson(
      response,
      200,
      { ok: true },
      { "Set-Cookie": "session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0" },
    );
    return true;
  }
  if (request.method === "GET" && pathname === "/api/auth/session") {
    const user = getAuthenticatedUser(request);
    if (!user) {
      sendJson(response, 401, { error: "Nao autenticado" });
      return true;
    }
    sendJson(response, 200, { user });
    return true;
  }

  let authUser = null;
  if (pathname.startsWith("/api/")) {
    authUser = requireAuth(request);
  }

  if (request.method === "POST" && pathname === "/api/auth/change-password") {
    const body = await readJsonBody(request);
    inventoryDb.changePassword(authUser.id, body.currentPassword, body.newPassword, authUser);
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/audit-logs") {
    requireAdmin(authUser);
    sendJson(response, 200, { logs: inventoryDb.listAuditLogs() });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/users") {
    requireAdmin(authUser);
    sendJson(response, 200, { users: inventoryDb.listUsers() });
    return true;
  }

  const userMatch = pathname.match(/^\/api\/users\/(\d+)$/);
  if (request.method === "PATCH" && userMatch) {
    requireAdmin(authUser);
    const targetUserId = Number(userMatch[1]);
    const body = await readJsonBody(request);
    sendJson(response, 200, {
      users: inventoryDb.setUserActive(targetUserId, Boolean(body.active), authUser),
    });
    return true;
  }

  const resetUserPasswordMatch = pathname.match(/^\/api\/users\/(\d+)\/reset-password$/);
  if (request.method === "POST" && resetUserPasswordMatch) {
    requireAdmin(authUser);
    const targetUserId = Number(resetUserPasswordMatch[1]);
    const body = await readJsonBody(request);
    inventoryDb.adminResetPassword(targetUserId, body.newPassword, authUser);
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (request.method === "POST" && pathname === "/api/users") {
    requireAdmin(authUser);
    const body = await readJsonBody(request);
    sendJson(response, 200, {
      users: inventoryDb.createUser(body, authUser),
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/inventory") {
    sendJson(response, 200, inventoryDb.getInventoryPayload());
    return true;
  }

  const addRecordMatch = pathname.match(/^\/api\/datasets\/([^/]+)\/records$/);
  if (request.method === "POST" && addRecordMatch) {
    const dataset = decodeURIComponent(addRecordMatch[1]);
    const body = await readJsonBody(request);
    sendJson(response, 200, inventoryDb.addRecord(dataset, body.record || {}, authUser));
    return true;
  }

  const recordMatch = pathname.match(/^\/api\/datasets\/([^/]+)\/records\/([^/]+)$/);
  if (request.method === "PATCH" && recordMatch) {
    const dataset = decodeURIComponent(recordMatch[1]);
    const recordId = decodeURIComponent(recordMatch[2]);
    const body = await readJsonBody(request);
    sendJson(response, 200, inventoryDb.updateRecord(dataset, recordId, body.changes || {}, authUser));
    return true;
  }

  if (request.method === "DELETE" && recordMatch) {
    const dataset = decodeURIComponent(recordMatch[1]);
    const recordId = decodeURIComponent(recordMatch[2]);
    sendJson(response, 200, inventoryDb.deleteRecord(dataset, recordId, authUser));
    return true;
  }

  const fieldMatch = pathname.match(/^\/api\/datasets\/([^/]+)\/fields$/);
  if (request.method === "POST" && fieldMatch) {
    const dataset = decodeURIComponent(fieldMatch[1]);
    const body = await readJsonBody(request);
    sendJson(response, 200, inventoryDb.addField(dataset, body.fieldKey || "", authUser));
    return true;
  }

  return false;
}

createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  try {
    if (await handleApi(request, response, url)) {
      return;
    }
  } catch (error) {
    sendJson(response, error.statusCode || 400, {
      error: error instanceof Error ? error.message : "Falha ao processar requisicao",
    });
    return;
  }
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  sendFile(pathname, response);
}).listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log("Login inicial: admin / admin123");
});

