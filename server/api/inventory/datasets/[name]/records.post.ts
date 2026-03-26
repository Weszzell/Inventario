import { randomUUID } from "node:crypto";
import { createError, readBody } from "h3";
import { prisma } from "../../../../utils/prisma";
import { requireSessionUser } from "../../../../utils/auth";

function slugify(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event);
  const datasetName = decodeURIComponent(event.context.params?.name || "").trim();

  if (!datasetName) {
    throw createError({
      statusCode: 400,
      statusMessage: "Base invalida",
    });
  }

  const body = await readBody<{ record?: Record<string, unknown> }>(event);
  const incomingRecord = body?.record ?? {};

  const dataset = await prisma.dataset.findUnique({
    where: { name: datasetName },
    include: {
      fields: {
        orderBy: { position: "asc" },
      },
      _count: {
        select: { records: true },
      },
    },
  });

  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Base nao encontrada",
    });
  }

  const data = Object.fromEntries(
    dataset.fields.map((field) => [field.fieldKey, incomingRecord[field.fieldKey] ?? ""]),
  );

  const record = await prisma.inventoryRecord.create({
    data: {
      datasetId: dataset.id,
      position: dataset._count.records,
      recordKey: `${slugify(dataset.name)}-${randomUUID().slice(0, 8)}`,
      data,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      actorName: user.displayName || user.username,
      action: "record_created",
      targetType: "inventory_record",
      targetId: String(record.id),
      details: {
        dataset: dataset.name,
        recordId: record.id,
      },
    },
  });

  return {
    ok: true,
    record: {
      id: record.id,
      recordKey: record.recordKey,
      data: record.data,
    },
  };
});