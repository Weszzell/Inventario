import { requireAdminUser } from "../../utils/auth";
import { getMonitoringSnapshot } from "../../utils/monitoring";

export default defineEventHandler(async (event) => {
  const user = await requireAdminUser(event);
  const snapshot = getMonitoringSnapshot();

  return {
    app: {
      env: useRuntimeConfig(event).public.appEnv,
    },
    viewer: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    monitoring: snapshot,
    timestamp: new Date().toISOString(),
  };
});
