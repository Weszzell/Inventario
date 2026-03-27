type MonitoringState = {
  startedAt: number;
  totals: {
    requests: number;
    errors: number;
    slowRequests: number;
  };
  routes: Record<
    string,
    {
      requests: number;
      errors: number;
      slowRequests: number;
      lastDurationMs: number;
      maxDurationMs: number;
      lastStatusCode: number;
      lastSeenAt: string | null;
    }
  >;
  lastError: {
    path: string;
    method: string;
    statusCode: number;
    at: string;
  } | null;
};

const globalMonitoring = globalThis as typeof globalThis & {
  __webInventoryMonitoringState?: MonitoringState;
};

const monitoringState = globalMonitoring.__webInventoryMonitoringState || {
  startedAt: Date.now(),
  totals: {
    requests: 0,
    errors: 0,
    slowRequests: 0,
  },
  routes: {},
  lastError: null,
};

globalMonitoring.__webInventoryMonitoringState = monitoringState;

function getRouteBucket(path: string) {
  const routeKey = path || "/";
  if (!monitoringState.routes[routeKey]) {
    monitoringState.routes[routeKey] = {
      requests: 0,
      errors: 0,
      slowRequests: 0,
      lastDurationMs: 0,
      maxDurationMs: 0,
      lastStatusCode: 0,
      lastSeenAt: null,
    };
  }

  return monitoringState.routes[routeKey];
}

export function recordRequestMetric(input: {
  path: string;
  method: string;
  durationMs: number;
  statusCode: number;
  slowThresholdMs: number;
}) {
  const bucket = getRouteBucket(input.path);
  const isError = input.statusCode >= 500;
  const isSlow = input.durationMs >= input.slowThresholdMs;

  monitoringState.totals.requests += 1;
  if (isError) monitoringState.totals.errors += 1;
  if (isSlow) monitoringState.totals.slowRequests += 1;

  bucket.requests += 1;
  if (isError) bucket.errors += 1;
  if (isSlow) bucket.slowRequests += 1;
  bucket.lastDurationMs = input.durationMs;
  bucket.maxDurationMs = Math.max(bucket.maxDurationMs, input.durationMs);
  bucket.lastStatusCode = input.statusCode;
  bucket.lastSeenAt = new Date().toISOString();

  if (isError) {
    monitoringState.lastError = {
      path: input.path,
      method: input.method,
      statusCode: input.statusCode,
      at: new Date().toISOString(),
    };
  }
}

export function getMonitoringSnapshot() {
  const uptimeSeconds = Math.floor((Date.now() - monitoringState.startedAt) / 1000);
  const memory = process.memoryUsage();

  return {
    startedAt: new Date(monitoringState.startedAt).toISOString(),
    uptimeSeconds,
    totals: { ...monitoringState.totals },
    memory: {
      rss: memory.rss,
      heapTotal: memory.heapTotal,
      heapUsed: memory.heapUsed,
      external: memory.external,
    },
    lastError: monitoringState.lastError,
    routes: Object.entries(monitoringState.routes)
      .map(([path, data]) => ({
        path,
        ...data,
      }))
      .sort((left, right) => right.requests - left.requests)
      .slice(0, 25),
  };
}
