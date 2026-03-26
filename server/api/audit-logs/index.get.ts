import { prisma } from "../../utils/prisma";
import { requireAdminUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  await requireAdminUser(event);

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      actorName: true,
      action: true,
      targetType: true,
      targetId: true,
      details: true,
      createdAt: true,
    },
  });

  return {
    logs: logs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    })),
  };
});
