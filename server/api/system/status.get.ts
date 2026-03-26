export default defineEventHandler(async () => {
  const configured = Boolean(process.env.DATABASE_URL);

  try {
    const { prisma } = await import("../../utils/prisma");
    const [datasetCount, userCount, recordCount, meta] = await Promise.all([
      prisma.dataset.count(),
      prisma.user.count(),
      prisma.inventoryRecord.count(),
      prisma.appMeta.findMany(),
    ]);

    return {
      app: {
        mode: "nuxt-prisma-connected",
      },
      database: {
        provider: "postgresql",
        configured,
        connected: true,
      },
      orm: "Prisma",
      docker: "ready",
      stats: {
        datasets: datasetCount,
        users: userCount,
        records: recordCount,
      },
      meta: Object.fromEntries(meta.map((entry) => [entry.key, entry.value])),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      app: {
        mode: "nuxt-prisma-pending",
      },
      database: {
        provider: "postgresql",
        configured,
        connected: false,
        error: error instanceof Error ? error.message : "Falha ao consultar banco",
      },
      orm: "Prisma",
      docker: "ready",
      timestamp: new Date().toISOString(),
    };
  }
});