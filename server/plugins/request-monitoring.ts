import { getRequestURL, getResponseStatus } from "h3";
import { recordRequestMetric } from "../utils/monitoring";

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("request", (event) => {
    event.context.monitoringStartedAt = Date.now();
  });

  nitroApp.hooks.hook("afterResponse", (event) => {
    const startedAt = Number(event.context.monitoringStartedAt || Date.now());
    const durationMs = Date.now() - startedAt;
    const slowThresholdMs = Number(process.env.MONITORING_SLOW_REQUEST_MS || 1000);
    const logRequests = String(process.env.MONITORING_LOG_REQUESTS || "false").toLowerCase() === "true";
    const path = getRequestURL(event).pathname;
    const method = event.method || "GET";
    const statusCode = getResponseStatus(event) || 200;

    recordRequestMetric({
      path,
      method,
      durationMs,
      statusCode,
      slowThresholdMs,
    });

    if (logRequests || durationMs >= slowThresholdMs || statusCode >= 500) {
      const level = statusCode >= 500 ? "error" : durationMs >= slowThresholdMs ? "warn" : "log";
      console[level](`[monitoring] ${method} ${path} -> ${statusCode} em ${durationMs}ms`);
    }
  });
});
