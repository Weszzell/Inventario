type AccessRole = "ADMIN" | "EDITOR";

type StatusPayload = {
  app?: { mode?: string };
  database?: { provider?: string; configured?: boolean; connected?: boolean };
  orm?: string;
  docker?: string;
  stats?: { datasets?: number; users?: number; records?: number };
  meta?: Record<string, string>;
};

type SessionUser = {
  id: number;
  username: string;
  displayName: string;
  role: "ADMIN" | "EDITOR";
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type ListedUser = SessionUser;

type AuditLogItem = {
  id: number;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
};

type DatasetSummary = {
  id: number;
  name: string;
  position: number;
  recordCount: number;
  fieldCount: number;
};

type InventorySummary = {
  generatedAt: string;
  counts: Record<string, number>;
  totalDatasets: number;
  totalRecords: number;
  colaboradoresComNotebook: number;
  datasetCards: DatasetSummary[];
};

type DatasetRecord = {
  id: number;
  recordKey: string;
  data: Record<string, unknown>;
};

type DatasetPayload = {
  dataset: {
    id: number;
    name: string;
    fields: string[];
    records: DatasetRecord[];
  };
};

type ExpandableConfig = {
  identifierField?: string;
  identifierFields?: string[];
};

type SystemBackupPayload = {
  version: number;
  exportedAt: string;
  exportedBy?: {
    id: number;
    username: string;
    displayName: string;
  };
  stats?: {
    users: number;
    datasets: number;
    records: number;
    auditLogs: number;
    appMeta: number;
  };
  data: {
    users: unknown[];
    datasets: Array<{ records?: unknown[] }>;
    auditLogs: unknown[];
    appMeta: unknown[];
  };
};

type BackupPreview = {
  fileName: string;
  version: number;
  exportedAt: string;
  users: number;
  datasets: number;
  records: number;
  auditLogs: number;
  appMeta: number;
};

const hiddenFields = new Set([
  "id",
  "ram",
  "notaFiscal",
  "campo1774361537972",
  "campo1774361604201",
  "headset",
  "teclado",
  "mouse",
  "suporte",
  "smartphone",
]);

const expandableDatasetConfig: Record<string, ExpandableConfig> = {
  Notebooks: { identifierField: "hostname" },
  "DT Notebooks": { identifierField: "hostname" },
  Monitores: { identifierField: "local" },
  "Monitores HO": { identifierField: "alocado" },
  Colaboradores: { identifierFields: ["alocadoPara", "nome"] },
};

const naturalCollator = new Intl.Collator("pt-BR", {
  numeric: true,
  sensitivity: "base",
  ignorePunctuation: true,
});

export function useWebInventory() {
  const status = useState<StatusPayload | null>("wi-status", () => null);
  const summary = useState<InventorySummary | null>("wi-summary", () => null);
  const sessionUser = useState<SessionUser | null>("wi-session-user", () => null);
  const users = useState<ListedUser[]>("wi-users", () => []);
  const auditLogs = useState<AuditLogItem[]>("wi-audit-logs", () => []);
  const datasets = useState<DatasetSummary[]>("wi-datasets", () => []);
  const activeDatasetName = useState<string>("wi-active-dataset-name", () => "");
  const activeDataset = useState<DatasetPayload["dataset"] | null>("wi-active-dataset", () => null);
  const datasetQuery = useState<string>("wi-dataset-query", () => "");
  const loading = useState<boolean>("wi-loading", () => true);
  const datasetsLoading = useState<boolean>("wi-datasets-loading", () => false);
  const loginPending = useState<boolean>("wi-login-pending", () => false);
  const sessionError = useState<string>("wi-session-error", () => "");
  const datasetError = useState<string>("wi-dataset-error", () => "");
  const inventoryFeedback = useState<string>("wi-inventory-feedback", () => "");
  const inventoryError = useState<string>("wi-inventory-error", () => "");
  const inventorySaving = useState<boolean>("wi-inventory-saving", () => false);
  const accessFeedback = useState<string>("wi-access-feedback", () => "");
  const accessError = useState<string>("wi-access-error", () => "");
  const accessSaving = useState<boolean>("wi-access-saving", () => false);
  const backupPending = useState<boolean>("wi-backup-pending", () => false);
  const restorePending = useState<boolean>("wi-restore-pending", () => false);
  const backupPreview = useState<BackupPreview | null>("wi-backup-preview", () => null);
  const restorePayload = useState<SystemBackupPayload | null>("wi-restore-payload", () => null);
  const loginForm = useState("wi-login-form", () => ({ username: "admin", password: "admin123" }));
  const newRecordForm = useState<Record<string, string>>("wi-new-record-form", () => ({}));
  const newFieldName = useState<string>("wi-new-field-name", () => "");
  const userForm = useState<{ displayName: string; username: string; password: string; role: AccessRole }>("wi-user-form", () => ({
    displayName: "",
    username: "",
    password: "",
    role: "EDITOR",
  }));
  const passwordForm = useState<{ currentPassword: string; nextPassword: string; confirmPassword: string }>("wi-password-form", () => ({
    currentPassword: "",
    nextPassword: "",
    confirmPassword: "",
  }));

  const topCards = computed(() => {
    if (!summary.value) {
      return [
        { label: "Colaboradores", value: "0", note: "Registros da alocacao atual" },
        { label: "Notebooks", value: "0", note: "Inventario principal de notebooks" },
        { label: "Monitores", value: "0", note: "Somando escritorio e home office" },
        { label: "Com notebook", value: "0", note: "Colaboradores com maquina associada" },
      ];
    }

    return [
      {
        label: "Colaboradores",
        value: String(summary.value.counts.Colaboradores ?? 0),
        note: "Registros da alocacao atual",
      },
      {
        label: "Notebooks",
        value: String(summary.value.counts.Notebooks ?? 0),
        note: "Inventario principal de notebooks",
      },
      {
        label: "Monitores",
        value: String((summary.value.counts.Monitores ?? 0) + (summary.value.counts["Monitores HO"] ?? 0)),
        note: "Somando escritorio e home office",
      },
      {
        label: "Com notebook",
        value: String(summary.value.colaboradoresComNotebook ?? 0),
        note: "Colaboradores com maquina associada",
      },
    ];
  });

  const datasetCards = computed(() => summary.value?.datasetCards ?? datasets.value);
  const visibleFields = computed(() => (activeDataset.value?.fields ?? []).filter((field) => !hiddenFields.has(field)));
  const tableHeaders = computed(() => visibleFields.value);
  const inventoryReady = computed(() => Boolean(sessionUser.value));
  const activeExpandableConfig = computed(() => expandableDatasetConfig[activeDatasetName.value] ?? null);
  const tableRows = computed(() => {
    const records = activeDataset.value?.records ?? [];

    return [...records].sort((left, right) => {
      const leftValue = getRecordSortValue(left.data);
      const rightValue = getRecordSortValue(right.data);
      return naturalCollator.compare(leftValue, rightValue);
    });
  });
  const expandableRows = computed(() => {
    if (!activeExpandableConfig.value) return [];

    return tableRows.value
      .map((record) => ({
        ...record,
        identifier: getRecordIdentifier(record.data, activeExpandableConfig.value),
      }))
      .sort((left, right) => naturalCollator.compare(left.identifier, right.identifier));
  });
  const isAdmin = computed(() => sessionUser.value?.role === "ADMIN");

  function getRecordIdentifier(data: Record<string, unknown>, config: ExpandableConfig) {
    if (config.identifierField) {
      const value = String(data?.[config.identifierField] ?? "").trim();
      return value || "Sem identificacao";
    }

    if (Array.isArray(config.identifierFields)) {
      const value = config.identifierFields
        .map((field) => String(data?.[field] ?? "").trim())
        .filter(Boolean)
        .join(" ");
      return value || "Sem identificacao";
    }

    return "Sem identificacao";
  }

  function getRecordSortValue(data: Record<string, unknown>) {
    if (activeExpandableConfig.value) {
      return getRecordIdentifier(data, activeExpandableConfig.value);
    }

    for (const field of visibleFields.value) {
      const value = String(data?.[field] ?? "").trim();
      if (value) return value;
    }

    return "";
  }

  function resetNewRecordForm(fields: string[]) {
    newRecordForm.value = Object.fromEntries(fields.map((field) => [field, ""]));
  }

  function clearInventoryMessages() {
    inventoryFeedback.value = "";
    inventoryError.value = "";
  }

  function clearAccessMessages() {
    accessFeedback.value = "";
    accessError.value = "";
  }

  function clearRestoreSelection() {
    backupPreview.value = null;
    restorePayload.value = null;
  }

  async function exportSystemBackup() {
    if (!isAdmin.value) return;

    backupPending.value = true;
    clearAccessMessages();

    try {
      const payload = await $fetch<SystemBackupPayload>("/api/system/backup");
      if (import.meta.client) {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const stamp = (payload.exportedAt || new Date().toISOString()).slice(0, 19).replace(/[\:T]/g, "-");
        link.href = url;
        link.download = `web-inventory-backup-${stamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      accessFeedback.value = "Backup exportado com sucesso.";
      await refreshAuditLogs();
    } catch (error: any) {
      accessError.value = error?.data?.statusMessage || error?.data?.message || "Falha ao exportar backup.";
    } finally {
      backupPending.value = false;
    }
  }

  async function selectRestoreFile(file: File | null) {
    clearAccessMessages();
    clearRestoreSelection();

    if (!file) return;

    try {
      const raw = await file.text();
      const payload = JSON.parse(raw) as SystemBackupPayload;

      if (!payload || typeof payload !== "object" || typeof payload.version !== "number" || !payload.data) {
        throw new Error("Arquivo de backup invalido.");
      }

      restorePayload.value = payload;
      backupPreview.value = {
        fileName: file.name,
        version: payload.version,
        exportedAt: payload.exportedAt,
        users: payload.data.users?.length ?? 0,
        datasets: payload.data.datasets?.length ?? 0,
        records: (payload.data.datasets ?? []).reduce((total, dataset) => total + (dataset.records?.length ?? 0), 0),
        auditLogs: payload.data.auditLogs?.length ?? 0,
        appMeta: payload.data.appMeta?.length ?? 0,
      };
    } catch (error: any) {
      accessError.value = error?.message || "Falha ao ler o arquivo de backup.";
    }
  }

  async function restoreSystemBackup() {
    if (!isAdmin.value || !restorePayload.value || !backupPreview.value) return;
    if (!confirm(`Deseja restaurar o backup ${backupPreview.value.fileName}? Esta acao substitui a base atual.`)) return;

    restorePending.value = true;
    clearAccessMessages();

    try {
      await $fetch("/api/system/restore", {
        method: "POST",
        body: restorePayload.value,
      });
      clearRestoreSelection();
      accessFeedback.value = "Backup restaurado com sucesso.";
      await refreshStatus();
      await refreshSession();
      await refreshUsers();
      await refreshAuditLogs();
      await refreshSummary();
      await refreshOverview();
      await refreshDataset();
    } catch (error: any) {
      accessError.value = error?.data?.statusMessage || error?.data?.message || "Falha ao restaurar backup.";
    } finally {
      restorePending.value = false;
    }
  }

  async function refreshStatus() {
    status.value = await $fetch<StatusPayload>("/api/system/status");
  }

  async function refreshSummary() {
    if (!sessionUser.value) {
      summary.value = null;
      return;
    }
    summary.value = await $fetch<InventorySummary>("/api/inventory/summary");
  }

  async function refreshSession() {
    const payload = await $fetch<{ user: SessionUser | null }>("/api/auth/session");
    sessionUser.value = payload.user;
  }

  async function refreshUsers() {
    if (!isAdmin.value) {
      users.value = [];
      return;
    }
    try {
      const payload = await $fetch<{ users: ListedUser[] }>("/api/users");
      users.value = payload.users;
    } catch {
      users.value = [];
    }
  }

  async function refreshAuditLogs() {
    if (!isAdmin.value) {
      auditLogs.value = [];
      return;
    }
    try {
      const payload = await $fetch<{ logs: AuditLogItem[] }>("/api/audit-logs");
      auditLogs.value = payload.logs;
    } catch {
      auditLogs.value = [];
    }
  }

  async function refreshOverview() {
    if (!sessionUser.value) {
      datasets.value = [];
      activeDatasetName.value = "";
      activeDataset.value = null;
      return;
    }

    const payload = await $fetch<{ datasets: DatasetSummary[] }>("/api/inventory/overview");
    datasets.value = payload.datasets;
    if (!activeDatasetName.value && payload.datasets.length) {
      activeDatasetName.value = payload.datasets[0].name;
    }
  }

  async function refreshDataset() {
    if (!sessionUser.value || !activeDatasetName.value) {
      activeDataset.value = null;
      return;
    }

    datasetsLoading.value = true;
    datasetError.value = "";

    try {
      const payload = await $fetch<DatasetPayload>(`/api/inventory/datasets/${encodeURIComponent(activeDatasetName.value)}`, {
        query: datasetQuery.value ? { q: datasetQuery.value } : undefined,
      });
      activeDataset.value = payload.dataset;
      resetNewRecordForm(payload.dataset.fields.filter((field) => !hiddenFields.has(field)));
    } catch (error: any) {
      activeDataset.value = null;
      datasetError.value = error?.data?.statusMessage || error?.data?.message || "Falha ao carregar base.";
    } finally {
      datasetsLoading.value = false;
    }
  }

  async function bootstrap() {
    loading.value = true;
    await refreshStatus();
    await refreshSession();
    await refreshUsers();
    await refreshAuditLogs();
    await refreshSummary();
    await refreshOverview();
    await refreshDataset();
    loading.value = false;
  }

  async function handleLogin() {
    loginPending.value = true;
    sessionError.value = "";

    try {
      const payload = await $fetch<{ user: SessionUser }>("/api/auth/login", {
        method: "POST",
        body: loginForm.value,
      });
      sessionUser.value = payload.user;
      await refreshStatus();
      await refreshUsers();
      await refreshAuditLogs();
      await refreshSummary();
      await refreshOverview();
      await refreshDataset();
    } catch (error: any) {
      sessionError.value = error?.data?.statusMessage || error?.data?.message || "Falha ao entrar.";
    } finally {
      loginPending.value = false;
    }
  }

  async function handleLogout() {
    await $fetch("/api/auth/logout", { method: "POST" });
    sessionUser.value = null;
    summary.value = null;
    users.value = [];
    auditLogs.value = [];
    datasets.value = [];
    activeDataset.value = null;
    activeDatasetName.value = "";
    datasetQuery.value = "";
    clearInventoryMessages();
    clearAccessMessages();
    newFieldName.value = "";
    passwordForm.value = { currentPassword: "", nextPassword: "", confirmPassword: "" };
    await refreshStatus();
  }

  async function createRecord() {
    if (!activeDataset.value || !activeDatasetName.value) return;

    inventorySaving.value = true;
    clearInventoryMessages();

    try {
      await $fetch(`/api/inventory/datasets/${encodeURIComponent(activeDatasetName.value)}/records`, {
        method: "POST",
        body: { record: newRecordForm.value },
      });
      inventoryFeedback.value = "Registro criado com sucesso.";
      await refreshSummary();
      await refreshOverview();
      await refreshDataset();
      await refreshAuditLogs();
    } catch (error: any) {
      inventoryError.value = error?.data?.statusMessage || error?.data?.message || "Falha ao criar registro.";
    } finally {
      inventorySaving.value = false;
    }
  }

  async function updateField(recordId: number, field: string, event: Event) {
    if (!activeDatasetName.value) return;

    const input = event.target as HTMLInputElement;
    const nextValue = input.value ?? "";
    const currentRecord = activeDataset.value?.records.find((record) => record.id === recordId);
    const currentValue = String(currentRecord?.data?.[field] ?? "");

    if (nextValue === currentValue) return;

    inventorySaving.value = true;
    clearInventoryMessages();

    try {
      await $fetch(`/api/inventory/datasets/${encodeURIComponent(activeDatasetName.value)}/records/${recordId}`, {
        method: "PATCH",
        body: { changes: { [field]: nextValue } },
      });
      inventoryFeedback.value = "Alteracao salva no banco.";
      await refreshSummary();
      await refreshDataset();
      await refreshAuditLogs();
    } catch (error: any) {
      input.value = currentValue;
      inventoryError.value = error?.data?.statusMessage || error?.data?.message || "Falha ao atualizar campo.";
    } finally {
      inventorySaving.value = false;
    }
  }

  async function deleteRecord(recordId: number) {
    if (!activeDatasetName.value) return;
    if (!confirm("Deseja excluir este registro?")) return;

    inventorySaving.value = true;
    clearInventoryMessages();

    try {
      await $fetch(`/api/inventory/datasets/${encodeURIComponent(activeDatasetName.value)}/records/${recordId}`, {
        method: "DELETE",
      });
      inventoryFeedback.value = "Registro excluido com sucesso.";
      await refreshSummary();
      await refreshOverview();
      await refreshDataset();
      await refreshAuditLogs();
    } catch (error: any) {
      inventoryError.value = error?.data?.statusMessage || error?.data?.message || "Falha ao excluir registro.";
    } finally {
      inventorySaving.value = false;
    }
  }

  async function addField() {
    if (!activeDatasetName.value) return;

    inventorySaving.value = true;
    clearInventoryMessages();

    try {
      await $fetch(`/api/inventory/datasets/${encodeURIComponent(activeDatasetName.value)}/fields`, {
        method: "POST",
        body: { fieldKey: newFieldName.value },
      });
      newFieldName.value = "";
      inventoryFeedback.value = "Campo criado com sucesso.";
      await refreshSummary();
      await refreshOverview();
      await refreshDataset();
      await refreshAuditLogs();
    } catch (error: any) {
      inventoryError.value = error?.data?.statusMessage || error?.data?.message || "Falha ao criar campo.";
    } finally {
      inventorySaving.value = false;
    }
  }

  async function importDatasetFile(file: File, mode: "append" | "replace") {
    if (!activeDatasetName.value) return;

    inventorySaving.value = true;
    clearInventoryMessages();

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const payload = await $fetch<{ importedRows: number; mode: string; addedFields: string[] }>(
        `/api/inventory/datasets/${encodeURIComponent(activeDatasetName.value)}/import`,
        {
          method: "POST",
          body: formData,
        },
      );

      const importedRows = payload.importedRows ?? 0;
      const addedFields = payload.addedFields?.length ? ` Campos novos: ${payload.addedFields.join(", ")}.` : "";
      inventoryFeedback.value = `Importacao concluida em modo ${payload.mode === "replace" ? "substituir" : "acrescentar"} com ${importedRows} registro(s).${addedFields}`;
      await refreshSummary();
      await refreshOverview();
      await refreshDataset();
      await refreshAuditLogs();
    } catch (error: any) {
      inventoryError.value = error?.data?.statusMessage || error?.data?.message || "Falha ao importar arquivo.";
    } finally {
      inventorySaving.value = false;
    }
  }

  async function createUser() {
    accessSaving.value = true;
    clearAccessMessages();

    try {
      await $fetch("/api/users", {
        method: "POST",
        body: userForm.value,
      });
      userForm.value = { displayName: "", username: "", password: "", role: "EDITOR" };
      accessFeedback.value = "Usuario criado com sucesso.";
      await refreshStatus();
      await refreshUsers();
      await refreshAuditLogs();
    } catch (error: any) {
      accessError.value = error?.data?.statusMessage || error?.data?.message || "Falha ao criar usuario.";
    } finally {
      accessSaving.value = false;
    }
  }

  async function changeOwnPassword() {
    if (passwordForm.value.nextPassword !== passwordForm.value.confirmPassword) {
      accessError.value = "A confirmacao da nova senha nao confere.";
      return;
    }

    accessSaving.value = true;
    clearAccessMessages();

    try {
      await $fetch("/api/auth/change-password", {
        method: "POST",
        body: {
          currentPassword: passwordForm.value.currentPassword,
          nextPassword: passwordForm.value.nextPassword,
        },
      });
      passwordForm.value = { currentPassword: "", nextPassword: "", confirmPassword: "" };
      accessFeedback.value = "Senha atualizada com sucesso.";
      await refreshAuditLogs();
    } catch (error: any) {
      accessError.value = error?.data?.statusMessage || error?.data?.message || "Falha ao trocar senha.";
    } finally {
      accessSaving.value = false;
    }
  }

  async function toggleUserActive(user: ListedUser) {
    accessSaving.value = true;
    clearAccessMessages();

    try {
      await $fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        body: { active: !user.active },
      });
      accessFeedback.value = user.active ? "Usuario bloqueado com sucesso." : "Usuario ativado com sucesso.";
      await refreshUsers();
      await refreshAuditLogs();
    } catch (error: any) {
      accessError.value = error?.data?.statusMessage || error?.data?.message || "Falha ao atualizar usuario.";
    } finally {
      accessSaving.value = false;
    }
  }

  async function updateUserRole(user: ListedUser, role: AccessRole) {
    if (user.role === role) return;

    accessSaving.value = true;
    clearAccessMessages();

    try {
      await $fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        body: { role },
      });
      accessFeedback.value = "Perfil atualizado com sucesso.";
      await refreshUsers();
      await refreshAuditLogs();
    } catch (error: any) {
      accessError.value = error?.data?.statusMessage || error?.data?.message || "Falha ao atualizar perfil.";
    } finally {
      accessSaving.value = false;
    }
  }

  async function resetUserPassword(userId: number, nextPassword: string) {
    accessSaving.value = true;
    clearAccessMessages();

    try {
      await $fetch(`/api/users/${userId}/reset-password`, {
        method: "POST",
        body: { password: nextPassword },
      });
      accessFeedback.value = "Senha redefinida com sucesso.";
      await refreshAuditLogs();
    } catch (error: any) {
      accessError.value = error?.data?.statusMessage || error?.data?.message || "Falha ao redefinir senha.";
    } finally {
      accessSaving.value = false;
    }
  }

  function bindInventoryWatchers() {
    watch(activeDatasetName, async () => {
      if (!loading.value) {
        clearInventoryMessages();
        newFieldName.value = "";
        await refreshDataset();
      }
    });

    let searchTimeout: ReturnType<typeof setTimeout> | null = null;
    watch(datasetQuery, () => {
      if (loading.value) return;
      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        refreshDataset();
      }, 220);
    });
  }

  return {
    status,
    summary,
    sessionUser,
    users,
    auditLogs,
    datasets,
    activeDatasetName,
    activeDataset,
    datasetQuery,
    loading,
    datasetsLoading,
    loginPending,
    sessionError,
    datasetError,
    inventoryFeedback,
    inventoryError,
    inventorySaving,
    accessFeedback,
    accessError,
    accessSaving,
    backupPending,
    restorePending,
    backupPreview,
    loginForm,
    newRecordForm,
    newFieldName,
    userForm,
    passwordForm,
    topCards,
    datasetCards,
    visibleFields,
    tableHeaders,
    tableRows,
    inventoryReady,
    activeExpandableConfig,
    expandableRows,
    isAdmin,
    bootstrap,
    handleLogin,
    handleLogout,
    createRecord,
    updateField,
    deleteRecord,
    addField,
    importDatasetFile,
    createUser,
    exportSystemBackup,
    selectRestoreFile,
    restoreSystemBackup,
    changeOwnPassword,
    toggleUserActive,
    updateUserRole,
    resetUserPassword,
    refreshUsers,
    refreshAuditLogs,
    refreshStatus,
    refreshSummary,
    refreshOverview,
    refreshDataset,
    bindInventoryWatchers,
  };
}
