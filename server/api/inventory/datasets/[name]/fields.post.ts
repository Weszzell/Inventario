import { createError, readBody } from "h3";
import { prisma } from "../../../../utils/prisma";
import { requireSessionUser } from "../../../../utils/auth";

type JsonRecord = Record<string, unknown>;

function normalizeFieldKey(value: string) {
  const compact = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .trim();

  if (!compact) return "";

  const parts = compact.split(/\s+/);
  return parts
    .map((part, index) => {
      const lower = part.toLowerCase();
      return index === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
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

  const body = await readBody<{ fieldKey?: string }>(event);
  const fieldKey = normalizeFieldKey(body?.fieldKey || "");

  if (!fieldKey) {
    throw createError({
      statusCode: 400,
      statusMessage: "Informe um nome de campo valido",
    });
  }

  const dataset = await prisma.dataset.findUnique({
    where: { name: datasetName },
    include: {
      fields: {
        orderBy: { position: "asc" },
      },
      records: true,
    },
  });

  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Base nao encontrada",
    });
  }

  if (dataset.fields.some((field) => field.fieldKey === fieldKey)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Esse campo ja existe na base ativa",
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.datasetField.create({
      data: {
        datasetId: dataset.id,
        fieldKey,
        position: dataset.fields.length,
      },
    });

    for (const record of dataset.records) {
      const currentData = (record.data ?? {}) as JsonRecord;
      await tx.inventoryRecord.update({
        where: { id: record.id },
        data: {
          data: {
            ...currentData,
            [fieldKey]: "",
          },
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        actorName: user.displayName || user.username,
        action: "field_created",
        targetType: "dataset_field",
        targetId: `${dataset.id}:${fieldKey}`,
        details: {
          dataset: datasetName,
          fieldKey,
        },
      },
    });
  });

  return {
    ok: true,
    fieldKey,
  };
});