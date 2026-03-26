import { prisma } from "../../utils/prisma";
import { requireSessionUser } from "../../utils/auth";

type JsonRecord = Record<string, unknown>;

function asText(value: unknown) {
  return String(value ?? "").trim();
}

export default defineEventHandler(async (event) => {
  await requireSessionUser(event);

  const datasets = await prisma.dataset.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          records: true,
          fields: true,
        },
      },
      records: {
        select: {
          data: true,
        },
      },
    },
  });

  const counts = Object.fromEntries(
    datasets.map((dataset) => [dataset.name, dataset._count.records]),
  );

  const colaboradores = datasets.find((dataset) => dataset.name === "Colaboradores");
  const colaboradoresComNotebook = (colaboradores?.records ?? []).reduce((total, record) => {
    const data = (record.data ?? {}) as JsonRecord;
    return asText(data.notebook) ? total + 1 : total;
  }, 0);

  return {
    generatedAt: new Date().toISOString(),
    counts,
    totalDatasets: datasets.length,
    totalRecords: datasets.reduce((total, dataset) => total + dataset._count.records, 0),
    colaboradoresComNotebook,
    datasetCards: datasets.map((dataset) => ({
      id: dataset.id,
      name: dataset.name,
      position: dataset.position,
      recordCount: dataset._count.records,
      fieldCount: dataset._count.fields,
    })),
  };
});
