export default defineEventHandler(async (event) => {
  const configured = Boolean(process.env.DATABASE_URL);

  try {
    const { prisma } = await import("../../utils/prisma");
    await prisma.$queryRaw`SELECT 1`;

    return {
      ok: true,
      database: {
        configured,
        connected: true,
      },
      timestamp: new Date().toISOString(),
    };
  } catch {
    setResponseStatus(event, 503);

    return {
      ok: false,
      database: {
        configured,
        connected: false,
      },
      timestamp: new Date().toISOString(),
    };
  }
});
