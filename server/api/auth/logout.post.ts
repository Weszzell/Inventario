import { destroySession, getSessionUser } from "../../utils/auth";
import { writeAuditLog } from "../../utils/audit";

export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event);

  if (user) {
    await writeAuditLog({
      actorUserId: user.id,
      actorName: user.username,
      action: "logout",
      targetType: "auth",
      targetId: String(user.id),
      details: { role: user.role },
    });
  }

  await destroySession(event);
  return { ok: true };
});
