import { randomUUID } from "node:crypto";
import { createError, readMultipartFormData } from "h3";
import * as XLSX from "xlsx";
import { prisma } from "../../../../utils/prisma";
import { requireSessionUser } from "../../../../utils/auth";

type SheetRow = Array<string | number | boolean | null | undefined>;

type JsonRecord = Record<string, unknown>;

function slugify(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeFieldKey(value: string) {
  const compact = String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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

function parseWorkbookRows(fileBuffer: Buffer) {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];

  if (!firstSheetName || !firstSheet) {
    throw createError({
      statusCode: 400,
      statusMessage: "Arquivo sem planilha valida",
    });
  }

  const sheetRows = XLSX.utils.sheet_to_json<SheetRow>(firstSheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  if (!sheetRows.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "A planilha enviada esta vazia",
    });
  }

  const rawHeaders = (sheetRows[0] ?? []).map((value) => String(value ?? "").trim());
  const normalizedHeaders = rawHeaders.map((header) => normalizeFieldKey(header));

  if (!normalizedHeaders.some(Boolean)) {
    throw createError({
      statusCode: 400,
      statusMessage: "A planilha precisa ter uma linha de cabecalho valida",
    });
  }

  const duplicateHeaders = normalizedHeaders.filter((header, index) => header && normalizedHeaders.indexOf(header) !== index);
  if (duplicateHeaders.length) {
    throw createError({
      statusCode: 400,
      statusMessage: `Cabecalhos duplicados encontrados: ${duplicateHeaders.join(", ")}`,
    });
  }

  const rows = sheetRows
    .slice(1)
    .filter((row) => row.some((value) => String(value ?? "").trim()))
    .map((row) => {
      const data: JsonRecord = {};
      normalizedHeaders.forEach((fieldKey, index) => {
        if (!fieldKey) return;
        data[fieldKey] = String(row[index] ?? "").trim();
      });
      return data;
    });

  return {
    rows,
    incomingFields: normalizedHeaders.filter(Boolean),
  };
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

  const parts = await readMultipartFormData(event);
  const filePart = parts?.find((part) => part.name === "file" && part.data);
  const modePart = parts?.find((part) => part.name === "mode");
  const mode = String(modePart?.data?.toString("utf8") || "append").trim().toLowerCase() === "replace" ? "replace" : "append";

  if (!filePart?.data) {
    throw createError({
      statusCode: 400,
      statusMessage: "Selecione um arquivo para importar",
    });
  }

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

  const { rows, incomingFields } = parseWorkbookRows(filePart.data);
  const existingFields = dataset.fields.map((field) => field.fieldKey);
  const fieldsToAdd = incomingFields.filter((field) => !existingFields.includes(field));
  const allFields = [...existingFields, ...fieldsToAdd];
  const startPosition = mode === "replace" ? 0 : dataset._count.records;

  await prisma.$transaction(async (tx) => {
    for (const [index, fieldKey] of fieldsToAdd.entries()) {
      await tx.datasetField.create({
        data: {
          datasetId: dataset.id,
          fieldKey,
          position: existingFields.length + index,
        },
      });
    }

    if (mode === "replace") {
      await tx.inventoryRecord.deleteMany({
        where: { datasetId: dataset.id },
      });
    }

    if (rows.length) {
      await tx.inventoryRecord.createMany({
        data: rows.map((row, index) => ({
          datasetId: dataset.id,
          recordKey: `${slugify(dataset.name)}-${randomUUID().slice(0, 8)}`,
          position: startPosition + index,
          data: Object.fromEntries(allFields.map((field) => [field, row[field] ?? ""])),
        })),
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        actorName: user.displayName || user.username,
        action: "dataset_imported",
        targetType: "dataset",
        targetId: String(dataset.id),
        details: {
          dataset: dataset.name,
          importedRows: rows.length,
          mode,
          addedFields: fieldsToAdd,
          filename: filePart.filename || "arquivo",
        },
      },
    });
  });

  return {
    ok: true,
    dataset: dataset.name,
    importedRows: rows.length,
    mode,
    addedFields: fieldsToAdd,
  };
});
