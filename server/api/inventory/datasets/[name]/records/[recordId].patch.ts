import { createError, readBody } from "h3";
import { prisma } from "../../../../../utils/prisma";
import { requireSessionUser } from "../../../../../utils/auth";

type JsonRecord = Record<string, unknown>;

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event);
  const datasetName = decodeURIComponent(event.context.params?.name || "").trim();
  const recordId = Number(event.context.params?.recordId || 0);

  if (!datasetName || !Number.isInteger(recordId) || recordId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Registro invalido",
    });
  }

  const body = await readBody<{ changes?: Record<string, unknown> }>(event);
  const changes = body?.changes ?? {};
  const changedEntries = Object.entries(changes);

  if (!changedEntries.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Nenhuma alteracao enviada",
    });
  }

  const record = await prisma.inventoryRecord.findFirst({
    where: {
      id: recordId,
      dataset: {
        name: datasetName,
      },
    },
    include: {
      dataset: {
        include: {
          fields: true,
        },
      },
    },
  });

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: "Registro nao encontrado",
    });
  }

  const allowedFields = new Set(record.dataset.fields.map((field) => field.fieldKey));
  const currentData = (record.data ?? {}) as JsonRecord;
  const nextData: JsonRecord = { ...currentData };

  for (const [field, value] of changedEntries) {
    if (!allowedFields.has(field)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Campo invalido: ${field}`,
      });
    }
    nextData[field] = value ?? "";
  }

  const updatedRecord = await prisma.inventoryRecord.update({
    where: { id: record.id },
    data: {
      data: nextData,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      actorName: user.displayName || user.username,
      action: "record_updated",
      targetType: "inventory_record",
      targetId: String(record.id),
      details: {
        dataset: datasetName,
        recordId: record.id,
        fields: changedEntries.map(([field]) => field),
      },
    },
  });

  return {
    ok: true,
    record: {
      id: updatedRecord.id,
      recordKey: updatedRecord.recordKey,
      data: updatedRecord.data,
    },
  };
});