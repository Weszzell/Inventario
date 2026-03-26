import { createError } from "h3";
import { prisma } from "../../../../../utils/prisma";
import { requireSessionUser } from "../../../../../utils/auth";

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

  const record = await prisma.inventoryRecord.findFirst({
    where: {
      id: recordId,
      dataset: {
        name: datasetName,
      },
    },
    include: {
      dataset: true,
    },
  });

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: "Registro nao encontrado",
    });
  }

  await prisma.inventoryRecord.delete({
    where: { id: record.id },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      actorName: user.displayName || user.username,
      action: "record_deleted",
      targetType: "inventory_record",
      targetId: String(record.id),
      details: {
        dataset: datasetName,
        recordId: record.id,
        recordKey: record.recordKey,
      },
    },
  });

  return {
    ok: true,
  };
});