import { createError, readBody } from "h3";
import { requireSessionUser, verifyCurrentUserPassword, hashPassword } from "../../utils/auth";
import { prisma } from "../../utils/prisma";
import { writeAuditLog } from "../../utils/audit";

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event);
  const body = await readBody<{ currentPassword?: string; nextPassword?: string }>(event);

  const currentPassword = String(body?.currentPassword || "");
  const nextPassword = String(body?.nextPassword || "");

  if (nextPassword.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: "A nova senha precisa ter pelo menos 6 caracteres",
    });
  }

  const valid = await verifyCurrentUserPassword(user.id, currentPassword);
  if (!valid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Senha atual invalida",
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(nextPassword) },
  });

  await writeAuditLog({
    actorUserId: user.id,
    actorName: user.username,
    action: "password_changed",
    targetType: "user",
    targetId: String(user.id),
    details: {},
  });

  return { ok: true };
});
