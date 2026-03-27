import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { H3Event } from "h3";
import { useRuntimeConfig } from "#imports";
import { createError, deleteCookie, getCookie, getRequestURL, readBody, setCookie } from "h3";
import type { User, UserRole } from "@prisma/client";
import { prisma } from "./prisma";

export type SessionUser = {
  id: number;
  username: string;
  displayName: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const passwordHash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${passwordHash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, originalHash] = String(storedHash || "").split(":");
  if (!salt || !originalHash) return false;
  const candidateHash = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(originalHash, "hex"), Buffer.from(candidateHash, "hex"));
}

function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function getBooleanEnv(value: string | undefined, fallback: boolean) {
  if (typeof value !== "string" || !value.length) return fallback;
  return value.toLowerCase() === "true";
}

function isLocalHostname(hostname: string) {
  const normalized = String(hostname || "").trim().toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

function getSessionConfig(event: H3Event) {
  const config = useRuntimeConfig(event);
  const sameSiteSource = process.env.SESSION_SAME_SITE || String(config.sessionSameSite || "lax");
  const sameSite = ["lax", "strict", "none"].includes(String(sameSiteSource || "").toLowerCase())
    ? String(sameSiteSource).toLowerCase()
    : "lax";
  const domain = String(process.env.SESSION_DOMAIN || config.sessionDomain || "").trim();
  const configuredSecure = getBooleanEnv(process.env.SESSION_SECURE, config.sessionSecure === true);
  const allowInsecureLocalhost = getBooleanEnv(
    process.env.ALLOW_INSECURE_LOCALHOST_SESSION,
    Boolean(config.allowInsecureLocalhostSession),
  );
  const requestHostname = getRequestURL(event).hostname;
  const secure =
    (configuredSecure && !(allowInsecureLocalhost && isLocalHostname(requestHostname))) || sameSite === "none";
  const maxAge = Number(process.env.SESSION_MAX_AGE || config.sessionMaxAge || 60 * 60 * 12);

  return {
    cookieName: String(process.env.SESSION_COOKIE_NAME || config.sessionCookieName || "web_inventory_session"),
    maxAge,
    secure,
    sameSite: sameSite as "lax" | "strict" | "none",
    domain: domain || undefined,
  };
}

async function clearExpiredSessions() {
  await prisma.userSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

export async function authenticateUser(username: string, password: string) {
  const normalizedUsername = String(username || "").trim().toLowerCase();
  if (!normalizedUsername || !password) return null;

  const user = await prisma.user.findUnique({
    where: { username: normalizedUsername },
  });

  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return toSessionUser(user);
}

export async function verifyCurrentUserPassword(userId: number, password: string) {
  if (!password) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.active) {
    return false;
  }

  return verifyPassword(password, user.passwordHash);
}

export async function createSession(event: H3Event, userId: number) {
  const token = randomBytes(24).toString("hex");
  const sessionConfig = getSessionConfig(event);
  const expiresAt = new Date(Date.now() + sessionConfig.maxAge * 1000);

  await clearExpiredSessions();
  await prisma.userSession.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  setCookie(event, sessionConfig.cookieName, token, {
    httpOnly: true,
    sameSite: sessionConfig.sameSite,
    path: "/",
    secure: sessionConfig.secure,
    maxAge: sessionConfig.maxAge,
    domain: sessionConfig.domain,
  });
}

export async function destroySession(event: H3Event) {
  const sessionConfig = getSessionConfig(event);
  const token = getCookie(event, sessionConfig.cookieName);
  if (token) {
    await prisma.userSession.deleteMany({
      where: { token },
    });
  }
  deleteCookie(event, sessionConfig.cookieName, {
    path: "/",
    domain: sessionConfig.domain,
    sameSite: sessionConfig.sameSite,
    secure: sessionConfig.secure,
  });
}

export async function getSessionUser(event: H3Event) {
  const sessionConfig = getSessionConfig(event);
  const token = getCookie(event, sessionConfig.cookieName);
  if (!token) return null;

  const session = await prisma.userSession.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.userSession.delete({
      where: { token },
    });
    deleteCookie(event, sessionConfig.cookieName, {
      path: "/",
      domain: sessionConfig.domain,
      sameSite: sessionConfig.sameSite,
      secure: sessionConfig.secure,
    });
    return null;
  }

  if (!session.user.active) {
    await prisma.userSession.deleteMany({
      where: { userId: session.userId },
    });
    return null;
  }

  await prisma.userSession.update({
    where: { token },
    data: {
      lastSeenAt: new Date(),
    },
  });

  return toSessionUser(session.user);
}

export async function requireSessionUser(event: H3Event) {
  const user = await getSessionUser(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Nao autenticado",
    });
  }
  return user;
}

export async function requireAdminUser(event: H3Event) {
  const user = await requireSessionUser(event);
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Apenas administradores podem acessar esta area",
    });
  }
  return user;
}

export async function readLoginBody(event: H3Event) {
  const body = await readBody<{ username?: string; password?: string }>(event);
  return {
    username: String(body?.username || "").trim(),
    password: String(body?.password || ""),
  };
}
