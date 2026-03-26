import { createError, getRouterParam, readBody } from "h3";
import { UserRole } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { requireAdminUser } from "../../utils/auth";
import { writeAuditLog } from "../../utils/audit";

export default defineEventHandler(async (event) => {
  const admin = await requireAdminUser(event);
  const rawId = getRouterParam(event, "id");
  const userId = Number(rawId);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Usuario invalido" });
  }

  const body = await readBody<{ displayName?: string; role?: UserRole; active?: boolean }>(event);
  const data: { displayName?: string; role?: UserRole; active?: boolean } = {};

  if (typeof body?.displayName === "string" && body.displayName.trim()) {
    data.displayName = body.displayName.trim();
  }

  if (body?.role === "ADMIN" || body?.role === "EDITOR") {
    data.role = body.role;
  }

  if (typeof body?.active === "boolean") {
    if (userId === admin.id && body.active === false) {
      throw createError({ statusCode: 400, statusMessage: "Voce nao pode bloquear sua propria conta" });
    }
    data.active = body.active;
  }

  if (!Object.keys(data).length) {
    throw createError({ statusCode: 400, statusMessage: "Nenhuma alteracao foi enviada" });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  }).catch(() => null);

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "Usuario nao encontrado" });
  }

  await writeAuditLog({
    actorUserId: admin.id,
    actorName: admin.username,
    action: typeof data.active === "boolean" ? (data.active ? "user_activated" : "user_blocked") : "user_updated",
    targetType: "user",
    targetId: String(user.id),
    details: data,
  });

  return {
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
  };
});
