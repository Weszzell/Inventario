import { prisma } from "../../utils/prisma";
import { requireSessionUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  await requireSessionUser(event);

  const [datasets, totalRecords] = await Promise.all([
    prisma.dataset.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            records: true,
            fields: true,
          },
        },
      },
    }),
    prisma.inventoryRecord.count(),
  ]);

  return {
    datasets: datasets.map((dataset) => ({
      id: dataset.id,
      name: dataset.name,
      position: dataset.position,
      recordCount: dataset._count.records,
      fieldCount: dataset._count.fields,
    })),
    totalDatasets: datasets.length,
    totalRecords,
  };
});
