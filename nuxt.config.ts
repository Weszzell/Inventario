export default defineNuxtConfig({
  compatibilityDate: "2026-03-24",
  devtools: { enabled: process.env.NODE_ENV !== "production" },
  css: ["~/assets/css/main.css"],
  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 250,
      },
    },
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || "",
    sessionCookieName: process.env.SESSION_COOKIE_NAME || "web_inventory_session",
    sessionMaxAge: Number(process.env.SESSION_MAX_AGE || 60 * 60 * 12),
    sessionSecure: process.env.SESSION_SECURE === "true",
    sessionSameSite: process.env.SESSION_SAME_SITE || "lax",
    sessionDomain: process.env.SESSION_DOMAIN || "",
    allowInsecureLocalhostSession: process.env.ALLOW_INSECURE_LOCALHOST_SESSION === "true",
    strictEnvValidation: process.env.STRICT_ENV_VALIDATION === "true",
    statusPublicDetails: process.env.STATUS_PUBLIC_DETAILS === "true",
    monitoringLogRequests: process.env.MONITORING_LOG_REQUESTS === "true",
    monitoringSlowRequestMs: Number(process.env.MONITORING_SLOW_REQUEST_MS || 1000),
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || "Web Inventory",
      appEnv: process.env.NUXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "development",
    },
  },
  app: {
    head: {
      title: "Web Inventory",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "Sistema web de inventario em migracao para Nuxt 4, Prisma e PostgreSQL.",
        },
      ],
    },
  },
});
