import { getSessionUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const configured = Boolean(process.env.DATABASE_URL);
  const config = useRuntimeConfig(event);
  const appEnv = String(config.public?.appEnv || process.env.NODE_ENV || "development").toLowerCase();
  const isProduction = appEnv === "production";
  const statusPublicDetails = String(process.env.STATUS_PUBLIC_DETAILS || String(config.statusPublicDetails)).toLowerCase() === "true";

  let sessionUser = null;
  try {
    sessionUser = await getSessionUser(event);
  } catch {
    sessionUser = null;
  }

  const canShowDetails = !isProduction || statusPublicDetails || sessionUser?.role === "ADMIN";

  try {
    const { prisma } = await import("../../utils/prisma");
    const [datasetCount, userCount, recordCount, meta] = await Promise.all([
      prisma.dataset.count(),
      prisma.user.count(),
      prisma.inventoryRecord.count(),
      prisma.appMeta.findMany(),
    ]);

    const payload = {
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
      timestamp: new Date().toISOString(),
    };

    if (!canShowDetails) {
      return payload;
    }

    return {
      ...payload,
      stats: {
        datasets: datasetCount,
        users: userCount,
        records: recordCount,
      },
      meta: Object.fromEntries(meta.map((entry) => [entry.key, entry.value])),
      viewer: {
        role: sessionUser?.role || null,
      },
    };
  } catch (error) {
    const payload = {
      app: {
        mode: "nuxt-prisma-pending",
      },
      database: {
        provider: "postgresql",
        configured,
        connected: false,
      },
      orm: "Prisma",
      docker: "ready",
      timestamp: new Date().toISOString(),
    };

    if (!canShowDetails) {
      return payload;
    }

    return {
      ...payload,
      database: {
        ...payload.database,
        error: error instanceof Error ? error.message : "Falha ao consultar banco",
      },
      viewer: {
        role: sessionUser?.role || null,
      },
    };
  }
});
