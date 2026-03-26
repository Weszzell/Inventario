import { createError, getQuery } from "h3";
import { prisma } from "../../../utils/prisma";
import { requireSessionUser } from "../../../utils/auth";

export default defineEventHandler(async (event) => {
  await requireSessionUser(event);

  const datasetName = decodeURIComponent(event.context.params?.name || "");
  if (!datasetName) {
    throw createError({
      statusCode: 400,
      statusMessage: "Base nao informada",
    });
  }

  const query = String(getQuery(event).q || "").trim().toLowerCase();

  const dataset = await prisma.dataset.findUnique({
    where: { name: datasetName },
    include: {
      fields: {
        orderBy: [{ position: "asc" }, { fieldKey: "asc" }],
      },
      records: {
        orderBy: [{ position: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Base nao encontrada",
    });
  }

  const records = dataset.records
    .map((record) => ({
      id: record.id,
      recordKey: record.recordKey,
      data: record.data as Record<string, unknown>,
    }))
    .filter((record) => {
      if (!query) return true;
      return Object.values(record.data || {}).some((value) =>
        String(value ?? "").toLowerCase().includes(query),
      );
    });

  return {
    dataset: {
      id: dataset.id,
      name: dataset.name,
      fields: dataset.fields.map((field) => field.fieldKey),
      records,
    },
  };
});
