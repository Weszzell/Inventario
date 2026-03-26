import { createError } from "h3";
import { prisma } from "../../utils/prisma";
import { requireAdminUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const user = await requireAdminUser(event);

  const [users, datasets, auditLogs, appMeta] = await Promise.all([
    prisma.user.findMany({
      orderBy: { id: "asc" },
    }),
    prisma.dataset.findMany({
      orderBy: { position: "asc" },
      include: {
        fields: {
          orderBy: { position: "asc" },
        },
        records: {
          orderBy: { position: "asc" },
        },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { id: "asc" },
    }),
    prisma.appMeta.findMany({
      orderBy: { key: "asc" },
    }),
  ]);

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    exportedBy: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    },
    stats: {
      users: users.length,
      datasets: datasets.length,
      records: datasets.reduce((total, dataset) => total + dataset.records.length, 0),
      auditLogs: auditLogs.length,
      appMeta: appMeta.length,
    },
    data: {
      users: users.map((item) => ({
        id: item.id,
        username: item.username,
        displayName: item.displayName,
        passwordHash: item.passwordHash,
        role: item.role,
        active: item.active,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      datasets: datasets.map((dataset) => ({
        id: dataset.id,
        name: dataset.name,
        position: dataset.position,
        createdAt: dataset.createdAt.toISOString(),
        updatedAt: dataset.updatedAt.toISOString(),
        fields: dataset.fields.map((field) => ({
          id: field.id,
          datasetId: field.datasetId,
          fieldKey: field.fieldKey,
          position: field.position,
        })),
        records: dataset.records.map((record) => ({
          id: record.id,
          datasetId: record.datasetId,
          recordKey: record.recordKey,
          position: record.position,
          data: record.data,
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
        })),
      })),
      auditLogs: auditLogs.map((log) => ({
        id: log.id,
        actorUserId: log.actorUserId,
        actorName: log.actorName,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        details: log.details,
        createdAt: log.createdAt.toISOString(),
      })),
      appMeta: appMeta.map((item) => ({
        key: item.key,
        value: item.value,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    },
  };

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      actorName: user.displayName || user.username,
      action: "system_backup_exported",
      targetType: "system",
      targetId: null,
      details: {
        stats: backup.stats,
      },
    },
  });

  setHeader(event, "content-type", "application/json; charset=utf-8");
  setHeader(event, "content-disposition", `attachment; filename="web-inventory-backup-${backup.exportedAt.slice(0, 19).replace(/[:T]/g, '-')}.json"`);

  return backup;
});
