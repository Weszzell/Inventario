import { createError, readBody } from "h3";
import { prisma } from "../../utils/prisma";
import { requireAdminUser } from "../../utils/auth";

type BackupUser = {
  id: number;
  username: string;
  displayName: string;
  passwordHash: string;
  role: "ADMIN" | "EDITOR";
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type BackupField = {
  id: number;
  datasetId: number;
  fieldKey: string;
  position: number;
};

type BackupRecord = {
  id: number;
  datasetId: number;
  recordKey: string;
  position: number;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type BackupDataset = {
  id: number;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  fields: BackupField[];
  records: BackupRecord[];
};

type BackupAuditLog = {
  id: number;
  actorUserId: number | null;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
};

type BackupAppMeta = {
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
};

type BackupPayload = {
  version: number;
  exportedAt: string;
  data: {
    users: BackupUser[];
    datasets: BackupDataset[];
    auditLogs: BackupAuditLog[];
    appMeta: BackupAppMeta[];
  };
};

function isValidPayload(payload: any): payload is BackupPayload {
  return Boolean(
    payload
      && typeof payload === "object"
      && typeof payload.version === "number"
      && payload.data
      && Array.isArray(payload.data.users)
      && Array.isArray(payload.data.datasets)
      && Array.isArray(payload.data.auditLogs)
      && Array.isArray(payload.data.appMeta),
  );
}

async function resetSequence(tableName: string, tx: typeof prisma) {
  await tx.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), COALESCE((SELECT MAX(id) FROM "${tableName}"), 1), COALESCE((SELECT MAX(id) FROM "${tableName}"), 0) > 0);`);
}

export default defineEventHandler(async (event) => {
  const actor = await requireAdminUser(event);
  const payload = await readBody<BackupPayload>(event);

  if (!isValidPayload(payload)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Arquivo de backup invalido",
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.auditLog.deleteMany();
    await tx.inventoryRecord.deleteMany();
    await tx.datasetField.deleteMany();
    await tx.dataset.deleteMany();
    await tx.appMeta.deleteMany();
    await tx.user.deleteMany();

    if (payload.data.users.length) {
      await tx.user.createMany({
        data: payload.data.users.map((item) => ({
          id: item.id,
          username: item.username,
          displayName: item.displayName,
          passwordHash: item.passwordHash,
          role: item.role,
          active: item.active,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        })),
      });
    }

    if (payload.data.datasets.length) {
      await tx.dataset.createMany({
        data: payload.data.datasets.map((dataset) => ({
          id: dataset.id,
          name: dataset.name,
          position: dataset.position,
          createdAt: new Date(dataset.createdAt),
          updatedAt: new Date(dataset.updatedAt),
        })),
      });

      const allFields = payload.data.datasets.flatMap((dataset) => dataset.fields.map((field) => ({
        id: field.id,
        datasetId: field.datasetId,
        fieldKey: field.fieldKey,
        position: field.position,
      })));

      if (allFields.length) {
        await tx.datasetField.createMany({
          data: allFields,
        });
      }

      const allRecords = payload.data.datasets.flatMap((dataset) => dataset.records.map((record) => ({
        id: record.id,
        datasetId: record.datasetId,
        recordKey: record.recordKey,
        position: record.position,
        data: record.data,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
      })));

      if (allRecords.length) {
        await tx.inventoryRecord.createMany({
          data: allRecords,
        });
      }
    }

    if (payload.data.appMeta.length) {
      await tx.appMeta.createMany({
        data: payload.data.appMeta.map((item) => ({
          key: item.key,
          value: item.value,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        })),
      });
    }

    if (payload.data.auditLogs.length) {
      await tx.auditLog.createMany({
        data: payload.data.auditLogs.map((log) => ({
          id: log.id,
          actorUserId: log.actorUserId,
          actorName: log.actorName,
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          details: log.details,
          createdAt: new Date(log.createdAt),
        })),
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: actor.id,
        actorName: actor.displayName || actor.username,
        action: "system_backup_restored",
        targetType: "system",
        targetId: null,
        details: {
          version: payload.version,
          exportedAt: payload.exportedAt,
          users: payload.data.users.length,
          datasets: payload.data.datasets.length,
          records: payload.data.datasets.reduce((total, dataset) => total + dataset.records.length, 0),
        },
      },
    });

    await resetSequence("User", tx);
    await resetSequence("Dataset", tx);
    await resetSequence("DatasetField", tx);
    await resetSequence("InventoryRecord", tx);
    await resetSequence("AuditLog", tx);
  });

  return {
    ok: true,
    restored: {
      users: payload.data.users.length,
      datasets: payload.data.datasets.length,
      records: payload.data.datasets.reduce((total, dataset) => total + dataset.records.length, 0),
      auditLogs: payload.data.auditLogs.length,
      appMeta: payload.data.appMeta.length,
    },
  };
});
