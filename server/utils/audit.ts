import { prisma } from "./prisma";

type AuditInput = {
  actorUserId?: number | null;
  actorName: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, unknown>;
};

export async function writeAuditLog(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      actorName: input.actorName,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      details: input.details ?? {},
    },
  });
}
