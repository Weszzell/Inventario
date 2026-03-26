import { createHash, randomBytes, scryptSync } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();
const inventoryPath = resolve(process.cwd(), "data", "inventory.json");

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createRecordKey(dataset, item, index) {
  const preferred =
    item.id ||
    item.hostname ||
    item.serviceTag ||
    item.codigo ||
    item.serial ||
    item.alocadoPara ||
    item.alocado ||
    item.usuario ||
    `${dataset}-${index}`;

  return `${slugify(dataset)}-${slugify(preferred) || createHash("sha1").update(`${dataset}-${index}`).digest("hex").slice(0, 10)}`;
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function collectFields(items) {
  const fields = [];
  const seen = new Set();

  for (const item of items) {
    for (const key of Object.keys(item || {})) {
      if (!seen.has(key)) {
        seen.add(key);
        fields.push(key);
      }
    }
  }

  return fields;
}

async function main() {
  const raw = readFileSync(inventoryPath, "utf8");
  const payload = JSON.parse(raw);
  const datasets = payload.datasets || {};
  const generatedAt = payload.generatedAt || new Date().toISOString();

  await prisma.auditLog.deleteMany();
  await prisma.inventoryRecord.deleteMany();
  await prisma.datasetField.deleteMany();
  await prisma.dataset.deleteMany();
  await prisma.appMeta.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      username: "admin",
      displayName: "Administrador",
      passwordHash: hashPassword("admin123"),
      role: UserRole.ADMIN,
      active: true,
    },
  });

  let totalRecords = 0;

  for (const [datasetName, items] of Object.entries(datasets)) {
    const dataset = await prisma.dataset.create({
      data: {
        name: datasetName,
        position: Object.keys(datasets).indexOf(datasetName),
      },
    });

    const fields = collectFields(items);
    if (fields.length) {
      await prisma.datasetField.createMany({
        data: fields.map((fieldKey, index) => ({
          datasetId: dataset.id,
          fieldKey,
          position: index,
        })),
      });
    }

    const keys = new Set();
    const records = items.map((item, index) => {
      let recordKey = createRecordKey(datasetName, item, index);
      let suffix = 1;
      while (keys.has(recordKey)) {
        recordKey = `${recordKey}-${suffix}`;
        suffix += 1;
      }
      keys.add(recordKey);
      totalRecords += 1;
      return {
        datasetId: dataset.id,
        recordKey,
        position: index,
        data: item,
      };
    });

    if (records.length) {
      await prisma.inventoryRecord.createMany({ data: records });
    }
  }

  await prisma.appMeta.createMany({
    data: [
      { key: "generatedAt", value: generatedAt },
      { key: "seededAt", value: new Date().toISOString() },
      { key: "source", value: "inventory.json" },
      { key: "totalDatasets", value: String(Object.keys(datasets).length) },
      { key: "totalRecords", value: String(totalRecords) },
    ],
  });

  console.log(`Seed concluido: ${Object.keys(datasets).length} bases e ${totalRecords} registros importados.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
