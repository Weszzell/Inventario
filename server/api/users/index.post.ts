import { createError, readBody } from "h3";
import { UserRole } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { hashPassword, requireAdminUser } from "../../utils/auth";
import { writeAuditLog } from "../../utils/audit";

export default defineEventHandler(async (event) => {
  const admin = await requireAdminUser(event);
  const body = await readBody<{ username?: string; displayName?: string; password?: string; role?: UserRole }>(event);

  const username = String(body?.username || "").trim().toLowerCase();
  const displayName = String(body?.displayName || "").trim();
  const password = String(body?.password || "");
  const role = body?.role === "ADMIN" ? "ADMIN" : "EDITOR";

  if (!username || !displayName || password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: "Preencha nome, usuario e senha com pelo menos 6 caracteres",
    });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: "Ja existe um usuario com esse login",
    });
  }

  const user = await prisma.user.create({
    data: {
      username,
      displayName,
      passwordHash: hashPassword(password),
      role,
      active: true,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await writeAuditLog({
    actorUserId: admin.id,
    actorName: admin.username,
    action: "user_created",
    targetType: "user",
    targetId: String(user.id),
    details: { username: user.username, role: user.role },
  });

  return {
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
  };
});
