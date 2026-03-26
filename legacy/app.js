const HIDDEN_FIELDS = new Set([
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

const loginOverlay = document.querySelector("#login-overlay");
const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");
const loginUsername = document.querySelector("#login-username");
const loginPassword = document.querySelector("#login-password");
const currentUser = document.querySelector("#current-user");
const logoutButton = document.querySelector("#logout-button");
const navInventoryButton = document.querySelector("#nav-inventory");
const navAccessButton = document.querySelector("#nav-access");
const generatedAt = document.querySelector("#generated-at");
const datasetSelect = document.querySelector("#dataset-select");
const searchInput = document.querySelector("#search-input");
const summaryGrid = document.querySelector("#summary-grid");
const tableHead = document.querySelector("#inventory-table thead");
const tableBody = document.querySelector("#inventory-table tbody");
const emptyStateTemplate = document.querySelector("#empty-state-template");
const addForm = document.querySelector("#add-form");
const addFields = document.querySelector("#add-fields");
const formTitle = document.querySelector("#form-title");
const formHint = document.querySelector("#form-hint");
const editorEyebrow = document.querySelector("#editor-eyebrow");
const fieldForm = document.querySelector("#field-form");
const fieldNameInput = document.querySelector("#field-name");
const editorTabRecord = document.querySelector("#editor-tab-record");
const editorTabField = document.querySelector("#editor-tab-field");
const editorPanelRecord = document.querySelector("#editor-panel-record");
const editorPanelField = document.querySelector("#editor-panel-field");
const resetButton = document.querySelector("#reset-storage");
const saveBadge = document.querySelector("#save-badge");
const passwordForm = document.querySelector("#password-form");
const passwordFeedback = document.querySelector("#password-feedback");
const usersSection = document.querySelector("#users-section");
const userForm = document.querySelector("#user-form");
const usersList = document.querySelector("#users-list");
const userFeedback = document.querySelector("#user-feedback");
const resetUserPasswordForm = document.querySelector("#reset-user-password-form");
const resetUserId = document.querySelector("#reset-user-id");
const resetUserFeedback = document.querySelector("#reset-user-feedback");
const auditSection = document.querySelector("#audit-section");
const auditList = document.querySelector("#audit-list");
const inventoryView = document.querySelector("#inventory-view");
const accessView = document.querySelector("#access-view");

const state = {
  payload: null,
  activeDataset: "",
  query: "",
  user: null,
  users: [],
  auditLogs: [],
  currentView: "inventory",
  currentEditorPanel: "record",
};

const EXPANDABLE_DATASET_CONFIG = {
  Notebooks: {
    identifierField: "hostname",
  },
  "DT Notebooks": {
    identifierField: "hostname",
  },
  Monitores: {
    identifierField: "local",
  },
  "Monitores HO": {
    identifierField: "alocado",
  },
  Colaboradores: {
    identifierFields: ["alocadoPara", "nome"],
  },
};

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLabel(key) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function escapeAttribute(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function showLogin(message = "") {
  loginOverlay.classList.remove("hidden");
  loginError.textContent = message;
  currentUser.textContent = "Visitante";
  usersSection.classList.add("hidden");
  state.user = null;
}

function hideLogin() {
  loginOverlay.classList.add("hidden");
  loginError.textContent = "";
}

function renderCurrentView() {
  const showingAccess = state.currentView === "access";
  inventoryView.classList.toggle("hidden", showingAccess);
  accessView.classList.toggle("hidden", !showingAccess);
  navInventoryButton.classList.toggle("active-nav", !showingAccess);
  navAccessButton.classList.toggle("active-nav", showingAccess);
}

function renderEditorPanel() {
  const showingField = state.currentEditorPanel === "field";
  editorPanelRecord.classList.toggle("hidden", showingField);
  editorPanelField.classList.toggle("hidden", !showingField);
  editorTabRecord.classList.toggle("active-editor-tab", !showingField);
  editorTabField.classList.toggle("active-editor-tab", showingField);
  editorEyebrow.textContent = showingField ? "Estrutura" : "Novo registro";
  formTitle.textContent = showingField
    ? `Adicionar campo em ${state.activeDataset}`
    : `Novo registro em ${state.activeDataset}`;
  formHint.textContent = showingField
    ? "Crie novos campos para a base ativa sem sair desta area."
    : "Os dados sao salvos no banco e ficam disponiveis para os usuarios autorizados.";
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) {
    showLogin(payload.error || "Sua sessao expirou. Entre novamente.");
    throw new Error(payload.error || "Nao autenticado");
  }
  if (!response.ok) {
    throw new Error(payload.error || "Falha ao processar requisicao.");
  }
  return payload;
}

function updateSaveBadge(payload) {
  saveBadge.textContent = `Salvo no banco em ${formatDateTime(
    payload.updatedAt || payload.generatedAt,
  )}`;
}

function applyPayload(payload) {
  const previousDataset = state.activeDataset;
  state.payload = payload;
  generatedAt.textContent = formatDateTime(payload.generatedAt);
  renderSummary(payload.summary);
  renderDatasetOptions(payload.datasets, previousDataset);
  renderForm();
  renderTable();
  updateSaveBadge(payload);
}

function renderSummary(summary) {
  const cards = [
    {
      label: "Colaboradores",
      value: summary.counts.Colaboradores || 0,
      footnote: "Registros da alocacao atual",
    },
    {
      label: "Notebooks",
      value: summary.counts.Notebooks || 0,
      footnote: "Inventario principal de notebooks",
    },
    {
      label: "Monitores",
      value: (summary.counts.Monitores || 0) + (summary.counts["Monitores HO"] || 0),
      footnote: "Somando escritorio e home office",
    },
    {
      label: "Com notebook",
      value: summary.colaboradoresComNotebook || 0,
      footnote: "Colaboradores com maquina associada",
    },
  ];

  summaryGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="summary-card">
          <p class="summary-label">${card.label}</p>
          <p class="summary-value">${card.value}</p>
          <p class="summary-footnote">${card.footnote}</p>
        </article>
      `,
    )
    .join("");
}

function renderDatasetOptions(datasets, previousDataset) {
  const names = Object.keys(datasets);
  state.activeDataset = names.includes(previousDataset) ? previousDataset : names[0] || "";
  datasetSelect.innerHTML = names
    .map((name) => `<option value="${name}">${name}</option>`)
    .join("");
  datasetSelect.value = state.activeDataset;
}

function getDatasetItems() {
  return state.payload?.datasets[state.activeDataset] || [];
}

function getVisibleColumns() {
  const fields = state.payload?.fields?.[state.activeDataset] || [];
  return fields.filter((key) => !HIDDEN_FIELDS.has(key));
}

function getExpandableConfig() {
  return EXPANDABLE_DATASET_CONFIG[state.activeDataset] || null;
}

function getRecordIdentifier(item, config) {
  if (config.identifierField) {
    return String(item[config.identifierField] || "").trim();
  }

  if (Array.isArray(config.identifierFields)) {
    return config.identifierFields
      .map((field) => String(item[field] || "").trim())
      .filter(Boolean)
      .join(" ");
  }

  return "";
}

function getFilteredItems() {
  const items = getDatasetItems();
  if (!state.query) return items;
  const query = state.query.toLowerCase();
  return items.filter((item) =>
    Object.entries(item).some(([key, value]) => {
      if (key === "_recordId") return false;
      return String(value || "").toLowerCase().includes(query);
    }),
  );
}

function renderForm() {
  const columns = getVisibleColumns();
  fieldNameInput.value = "";

  addFields.innerHTML = columns
    .map(
      (key) => `
        <label class="field">
          <span>${formatLabel(key)}</span>
          <input name="${key}" type="text" placeholder="Digite ${formatLabel(key).toLowerCase()}" />
        </label>
      `,
    )
    .join("");

  renderEditorPanel();
}

function renderUsers() {
  if (state.user?.role !== "admin") {
    usersSection.classList.add("hidden");
    auditSection.classList.add("hidden");
    return;
  }

  usersSection.classList.remove("hidden");
  const eligibleUsers = state.users.filter((user) => String(user.username).toLowerCase() !== "admin");
  resetUserId.innerHTML = eligibleUsers
    .map((user) => `<option value="${user.id}">${user.displayName} (${user.username})</option>` )
    .join("");

  usersList.innerHTML = state.users
    .map(
      (user) => `
        <article class="user-card" data-user-id="${user.id}">
          <div>
            <strong>${user.displayName}</strong>
            <p>${user.username}</p>
          </div>
          <div class="user-meta">
            <span class="role-badge ${user.role}">${user.role}</span>
            <span class="status-badge ${user.active ? "active" : "inactive"}">${user.active ? "ativo" : "bloqueado"}</span>
            <span>Criado em ${formatDateTime(user.createdAt)}</span>
            <span>Ultimo acesso: ${formatDateTime(user.lastLoginAt)}</span>
            ${String(user.username).toLowerCase() === "admin" ? "" : `<button class="ghost-button small-button" type="button" data-action="toggle-user">${user.active ? "Bloquear" : "Desbloquear"}</button>`}
          </div>
        </article>
      `,
    )
    .join("");
}


function formatAuditAction(log) {
  const labels = {
    record_created: 'Criou registro',
    record_updated: 'Editou registro',
    record_deleted: 'Excluiu registro',
    field_added: 'Adicionou campo',
    user_created: 'Criou usuario',
    user_blocked: 'Bloqueou usuario',
    user_unblocked: 'Desbloqueou usuario',
    password_reset: 'Redefiniu senha',
    password_changed: 'Trocou a propria senha',
    login_succeeded: 'Entrou no sistema',
    login_failed: 'Falhou ao entrar',
    logout: 'Saiu do sistema',
  };
  return labels[log.action] || log.action;
}

function renderAuditLogs() {
  if (state.user?.role !== 'admin') {
    auditSection.classList.add('hidden');
    return;
  }
  auditSection.classList.remove('hidden');
  auditList.innerHTML = state.auditLogs
    .map(
      (log) => `
        <article class="audit-item">
          <div>
            <strong>${log.actorName}</strong>
            <p>${formatAuditAction(log)} em <span>${log.targetType}</span>${log.targetId ? ` (${log.targetId})` : ''}</p>
          </div>
          <time>${formatDateTime(log.createdAt)}</time>
        </article>
      `,
    )
    .join('');
}

function renderTable() {
  const items = getFilteredItems();
  const columns = getVisibleColumns();
  const expandableConfig = getExpandableConfig();

  if (!columns.length) {
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";
    return;
  }

  if (expandableConfig) {
    renderExpandableTable(items, columns, expandableConfig);
    return;
  }

  tableHead.innerHTML = `<tr>
    <th>Acoes</th>
    ${columns.map((key) => `<th>${formatLabel(key)}</th>`).join("")}
  </tr>`;

  if (!items.length) {
    tableBody.innerHTML = "";
    tableBody.append(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  tableBody.innerHTML = items
    .map(
      (item) => `
        <tr data-record-id="${item._recordId}">
          <td class="actions-cell">
            <button class="action-button danger" type="button" data-action="delete">
              Excluir
            </button>
          </td>
          ${columns
            .map(
              (key) => `
                <td>
                  <input
                    class="cell-input"
                    type="text"
                    data-field="${key}"
                    value="${escapeAttribute(item[key] || "")}" 
                  />
                </td>
              `,
            )
            .join("")}
        </tr>
      `,
    )
    .join("");
}

function renderExpandableTable(items, columns, config) {
  tableHead.innerHTML = `<tr>
    <th>Registro</th>
  </tr>`;

  if (!items.length) {
    tableBody.innerHTML = "";
    tableBody.append(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  tableBody.innerHTML = items
    .map((item) => {
      const identifier = getRecordIdentifier(item, config) || "Sem identificacao";
      const detailFields = columns
        .map(
          (key) => `
            <label class="field inline-field">
              <span>${formatLabel(key)}</span>
              <input
                class="cell-input"
                type="text"
                data-field="${key}"
                value="${escapeAttribute(item[key] || "")}"
              />
            </label>
          `,
        )
        .join("");

      return `
        <tr class="expandable-row">
          <td>
            <details class="record-details" data-record-id="${item._recordId}">
              <summary class="record-summary">
                <div>
                  <strong class="record-title">${identifier}</strong>
                  <p class="record-subtitle">Clique para visualizar e editar os dados deste notebook.</p>
                </div>
              </summary>
              <div class="record-body">
                <div class="record-fields-grid">
                  ${detailFields}
                </div>
                <div class="record-actions">
                  <button class="action-button danger" type="button" data-action="delete">
                    Excluir
                  </button>
                </div>
              </div>
            </details>
          </td>
        </tr>
      `;
    })
    .join("");
}


async function loadAuditLogs() {
  if (state.user?.role !== 'admin') {
    state.auditLogs = [];
    renderAuditLogs();
    return;
  }
  const payload = await requestJson('/api/audit-logs');
  state.auditLogs = payload.logs;
  renderAuditLogs();
}

async function loadUsers() {
  if (state.user?.role !== "admin") {
    state.users = [];
    renderUsers();
    return;
  }
  const payload = await requestJson("/api/users");
  state.users = payload.users;
  renderUsers();
}

async function handleCellEdit(event) {
  const input = event.target.closest(".cell-input");
  if (!input) return;

  const row = input.closest("[data-record-id]");
  const recordId = row?.dataset.recordId;
  if (!recordId) return;

  try {
    const payload = await requestJson(
      `/api/datasets/${encodeURIComponent(state.activeDataset)}/records/${encodeURIComponent(recordId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          changes: { [input.dataset.field]: input.value.trim() },
        }),
      },
    );
    applyPayload(payload);
    await loadAuditLogs();
  } catch (error) {
    if (error.message !== "Nao autenticado") {
      alert(error.message);
    }
  }
}

async function handleDelete(event) {
  const button = event.target.closest('[data-action="delete"]');
  if (!button) return;

  const row = button.closest("[data-record-id]") || button.closest("tr");
  const recordId = row?.dataset.recordId;
  if (!recordId) return;

  try {
    const payload = await requestJson(
      `/api/datasets/${encodeURIComponent(state.activeDataset)}/records/${encodeURIComponent(recordId)}`,
      { method: "DELETE" },
    );
    applyPayload(payload);
    await loadAuditLogs();
  } catch (error) {
    if (error.message !== "Nao autenticado") {
      alert(error.message);
    }
  }
}

async function handleAddRecord(event) {
  event.preventDefault();
  const fields = getVisibleColumns();
  const formData = new FormData(addForm);
  const record = {};

  for (const key of fields) {
    record[key] = String(formData.get(key) || "").trim();
  }

  try {
    const payload = await requestJson(
      `/api/datasets/${encodeURIComponent(state.activeDataset)}/records`,
      {
        method: "POST",
        body: JSON.stringify({ record }),
      },
    );
    applyPayload(payload);
    await loadAuditLogs();
    addForm.reset();
  } catch (error) {
    if (error.message !== "Nao autenticado") {
      alert(error.message);
    }
  }
}

async function addCustomField(event) {
  event.preventDefault();
  const rawName = fieldNameInput.value.trim();
  if (!rawName) return;

  const fieldKey = slugify(rawName)
    .replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase())
    .replace(/^-/, "");

  if (!fieldKey) return;

  try {
    const payload = await requestJson(
      `/api/datasets/${encodeURIComponent(state.activeDataset)}/fields`,
      {
        method: "POST",
        body: JSON.stringify({ fieldKey }),
      },
    );
    applyPayload(payload);
    await loadAuditLogs();
  } catch (error) {
    if (error.message !== "Nao autenticado") {
      alert(error.message);
    }
  }
}

async function handlePasswordChange(event) {
  event.preventDefault();
  const formData = new FormData(passwordForm);
  try {
    await requestJson("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword: String(formData.get("currentPassword") || ""),
        newPassword: String(formData.get("newPassword") || ""),
      }),
    });
    passwordFeedback.textContent = "Senha alterada com sucesso.";
    passwordForm.reset();
  } catch (error) {
    passwordFeedback.textContent = error.message;
  }
}


async function handleResetOtherUserPassword(event) {
  event.preventDefault();
  const formData = new FormData(resetUserPasswordForm);
  try {
    await requestJson(`/api/users/${encodeURIComponent(String(formData.get("userId") || ""))}/reset-password`, {
      method: "POST",
      body: JSON.stringify({
        newPassword: String(formData.get("newPassword") || ""),
      }),
    });
    resetUserFeedback.textContent = "Senha redefinida com sucesso.";
    resetUserPasswordForm.reset();
    renderUsers();
    await loadAuditLogs();
  } catch (error) {
    resetUserFeedback.textContent = error.message;
  }
}

async function handleUserListClick(event) {
  const button = event.target.closest('[data-action="toggle-user"]');
  if (!button) return;
  const card = button.closest('[data-user-id]');
  const userId = card?.dataset.userId;
  if (!userId) return;
  const user = state.users.find((item) => String(item.id) === String(userId));
  if (!user) return;

  try {
    const payload = await requestJson(`/api/users/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !user.active }),
    });
    state.users = payload.users;
    renderUsers();
    await loadAuditLogs();
  } catch (error) {
    userFeedback.textContent = error.message;
  }
}

async function handleUserCreate(event) {
  event.preventDefault();
  const formData = new FormData(userForm);
  try {
    const payload = await requestJson("/api/users", {
      method: "POST",
      body: JSON.stringify({
        displayName: String(formData.get("displayName") || "").trim(),
        username: String(formData.get("username") || "").trim(),
        password: String(formData.get("password") || ""),
        role: String(formData.get("role") || "editor"),
      }),
    });
    state.users = payload.users;
    userFeedback.textContent = "Usuario cadastrado com sucesso.";
    renderUsers();
    await loadAuditLogs();
    userForm.reset();
  } catch (error) {
    userFeedback.textContent = error.message;
  }
}

async function loadInventory() {
  const payload = await requestJson("/api/inventory");
  applyPayload(payload);
}

async function ensureSession() {
  const payload = await requestJson("/api/auth/session");
  state.user = payload.user;
  currentUser.textContent = `${payload.user.displayName || payload.user.username} (${payload.user.role})`;
  state.currentView = "inventory";
  renderCurrentView();
  hideLogin();
}

async function handleLogin(event) {
  event.preventDefault();
  loginError.textContent = "";
  try {
    const payload = await requestJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: loginUsername.value.trim(),
        password: loginPassword.value,
      }),
    });
    state.user = payload.user;
    currentUser.textContent = `${payload.user.displayName || payload.user.username} (${payload.user.role})`;
    hideLogin();
    loginPassword.value = "";
    await loadInventory();
    await loadUsers();
    await loadAuditLogs();
  } catch (error) {
    loginError.textContent = error.message;
  }
}

async function handleLogout() {
  try {
    await requestJson("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore logout errors
  }
  state.users = [];
  usersList.innerHTML = "";
  showLogin("Entre novamente para continuar.");
}

async function bootstrap() {
  try {
    await ensureSession();
    await loadInventory();
    await loadUsers();
    await loadAuditLogs();
  } catch (error) {
    showLogin(error.message === "Nao autenticado" ? "" : error.message);
  }
}

datasetSelect.addEventListener("change", (event) => {
  state.activeDataset = event.target.value;
  renderForm();
  renderTable();
});

navInventoryButton.addEventListener("click", () => {
  state.currentView = "inventory";
  renderCurrentView();
});

navAccessButton.addEventListener("click", () => {
  state.currentView = "access";
  renderCurrentView();
});

editorTabRecord.addEventListener("click", () => {
  state.currentEditorPanel = "record";
  renderEditorPanel();
});

editorTabField.addEventListener("click", () => {
  state.currentEditorPanel = "field";
  renderEditorPanel();
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value.trim();
  renderTable();
});

tableBody.addEventListener("change", handleCellEdit);
tableBody.addEventListener("click", handleDelete);
addForm.addEventListener("submit", handleAddRecord);
fieldForm.addEventListener("submit", addCustomField);
userForm.addEventListener("submit", handleUserCreate);
resetUserPasswordForm.addEventListener("submit", handleResetOtherUserPassword);
usersList.addEventListener("click", handleUserListClick);
passwordForm.addEventListener("submit", handlePasswordChange);
resetButton.addEventListener("click", loadInventory);
loginForm.addEventListener("submit", handleLogin);
logoutButton.addEventListener("click", handleLogout);

bootstrap();
