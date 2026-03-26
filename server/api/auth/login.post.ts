import { createError } from "h3";
import { authenticateUser, createSession, readLoginBody } from "../../utils/auth";
import { writeAuditLog } from "../../utils/audit";

export default defineEventHandler(async (event) => {
  const { username, password } = await readLoginBody(event);
  const user = await authenticateUser(username, password);

  if (!user) {
    await writeAuditLog({
      actorName: String(username || "desconhecido").trim().toLowerCase() || "desconhecido",
      action: "login_failed",
      targetType: "auth",
      details: { username: String(username || "").trim().toLowerCase() },
    });

    throw createError({
      statusCode: 401,
      statusMessage: "Usuario ou senha invalidos",
    });
  }

  await createSession(event, user.id);

  await writeAuditLog({
    actorUserId: user.id,
    actorName: user.username,
    action: "login_success",
    targetType: "auth",
    targetId: String(user.id),
    details: { role: user.role },
  });

  return { user };
});
