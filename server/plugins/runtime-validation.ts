export default defineNitroPlugin(() => {
  const config = useRuntimeConfig();
  const appEnv = String(config.public?.appEnv || process.env.NODE_ENV || "development").toLowerCase();
  const isProduction = appEnv === "production";

  const warnings: string[] = [];

  if (isProduction) {
    const databaseUrl = String(process.env.DATABASE_URL || config.databaseUrl || "");
    const cookieName = String(process.env.SESSION_COOKIE_NAME || config.sessionCookieName || "");
    const sessionSecure = String(process.env.SESSION_SECURE || String(config.sessionSecure)).toLowerCase() === "true";
    const allowInsecureLocalhost = String(process.env.ALLOW_INSECURE_LOCALHOST_SESSION || String(config.allowInsecureLocalhostSession || false)).toLowerCase() === "true";
    const sameSite = String(process.env.SESSION_SAME_SITE || config.sessionSameSite || "").toLowerCase();

    if (!databaseUrl) {
      warnings.push("DATABASE_URL nao foi definido.");
    }

    if (databaseUrl.includes("change-this-password")) {
      warnings.push("DATABASE_URL ainda usa credencial placeholder.");
    }

    if (String(process.env.POSTGRES_PASSWORD || "").includes("change-this-password")) {
      warnings.push("POSTGRES_PASSWORD ainda usa valor placeholder.");
    }

    if (!sessionSecure && !allowInsecureLocalhost) {
      warnings.push("SESSION_SECURE esta desativado em producao.");
    }

    if (allowInsecureLocalhost && sameSite === "none") {
      warnings.push("ALLOW_INSECURE_LOCALHOST_SESSION nao pode ser usado com SESSION_SAME_SITE=none.");
    }

    if (sameSite === "none" && !sessionSecure) {
      warnings.push("SESSION_SAME_SITE=none exige SESSION_SECURE=true.");
    }

    if (!cookieName.startsWith("__Host-") && !cookieName.startsWith("__Secure-")) {
      warnings.push("Considere usar prefixo __Host- ou __Secure- no nome do cookie de sessao.");
    }
  }

  if (!warnings.length) return;

  const message = warnings.map((warning) => `[security] ${warning}`).join("\n");
  const strictValidation = String(process.env.STRICT_ENV_VALIDATION || String(config.strictEnvValidation)).toLowerCase() === "true";

  if (strictValidation) {
    throw new Error(`Validacao de ambiente falhou:\n${message}`);
  }

  console.warn(message);
});
