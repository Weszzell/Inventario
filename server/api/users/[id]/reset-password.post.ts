import { createError, getRouterParam, readBody } from "h3";
import { prisma } from "../../../utils/prisma";
import { hashPassword, requireAdminUser } from "../../../utils/auth";
import { writeAuditLog } from "../../../utils/audit";

export default defineEventHandler(async (event) => {
  const admin = await requireAdminUser(event);
  const rawId = getRouterParam(event, "id");
  const userId = Number(rawId);
  const body = await readBody<{ password?: string }>(event);
  const password = String(body?.password || "");

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Usuario invalido" });
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: "A nova senha precisa ter pelo menos 6 caracteres" });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashPassword(password) },
    select: {
      id: true,
      username: true,
      displayName: true,
    },
  }).catch(() => null);

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "Usuario nao encontrado" });
  }

  await writeAuditLog({
    actorUserId: admin.id,
    actorName: admin.username,
    action: "password_reset",
    targetType: "user",
    targetId: String(user.id),
    details: { username: user.username },
  });

  return { ok: true };
});
