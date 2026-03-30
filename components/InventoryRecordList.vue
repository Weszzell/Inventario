<script setup lang="ts">
import { formatFieldLabel } from "~/utils/field-label";

type TablePreferences = {
  pageSize: number;
  sortField: string;
  sortDirection: "asc" | "desc";
};

type ImportPreview = {
  fileName: string;
  totalRows: number;
  headers: string[];
  sampleRows: Record<string, string>[];
  newFields: string[];
  existingFields: string[];
  ignoredColumns: string[];
};

const props = defineProps<{
  activeDatasetName: string;
  datasets: Array<{ id: number; name: string }>;
  datasetQuery: string;
  datasetError: string;
  datasetsLoading: boolean;
  loading: boolean;
  activeDataset: { records: unknown[]; fields?: string[] } | null;
  activeExpandableConfig: unknown;
  expandableRows: Array<{ id: number; identifier: string; data: Record<string, unknown> }>;
  tableHeaders: string[];
  tableRows: Array<{ id: number; data: Record<string, unknown> }>;
  inventorySaving: boolean;
}>();

const emit = defineEmits<{
  (e: "update:datasetQuery", value: string): void;
  (e: "update:activeDatasetName", value: string): void;
  (e: "update-field", payload: { recordId: number; field: string; event: Event }): void;
  (e: "delete-record", recordId: number): void;
  (e: "import-dataset", payload: { file: File; mode: "append" | "replace" }): void;
}>();

const naturalCollator = new Intl.Collator("pt-BR", {
  numeric: true,
  sensitivity: "base",
  ignorePunctuation: true,
});

const preferenceStoragePrefix = "web-inventory:table-prefs:";
const defaultPageSize = 25;

const sortField = ref("");
const sortDirection = ref<"asc" | "desc">("asc");
const currentPage = ref(1);
const pageSize = ref(defaultPageSize);
const pageSizeOptions = [25, 50, 100];
const importMode = ref<"append" | "replace">("append");
const importFile = ref<File | null>(null);
const exportPending = ref(false);
const importPreview = ref<ImportPreview | null>(null);
const importPreviewError = ref("");
const importPreviewPending = ref(false);
const expandedRecordIds = ref<number[]>([]);

const preferenceStorageKey = computed(() => {
  const datasetKey = (props.activeDatasetName || "base")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "base";

  return `${preferenceStoragePrefix}${datasetKey}`;
});

const sortOptions = computed(() => {
  const options = props.tableHeaders.map((field) => ({ value: field, label: formatFieldLabel(field) }));
  if (props.activeExpandableConfig) {
    return [{ value: "__identifier", label: "Identificacao" }, ...options];
  }
  return options;
});

const visibleTableHeaders = computed(() => props.tableHeaders);
const existingDatasetFields = computed(() => props.activeDataset?.fields ?? props.tableHeaders);
const canSubmitImport = computed(() => Boolean(importFile.value) && Boolean(importPreview.value) && !importPreviewError.value);
const tableShellClass = computed(() => [] as string[]);
const importModeLabel = computed(() => (importMode.value === "append" ? "Acrescentar" : "Substituir"));
const resultSummary = computed(() => {
  if (!totalItems.value) return "Sem registros para a combinacao atual.";
  return `Mostrando ${pageStart.value}-${pageEnd.value} de ${totalItems.value} registro(s).`;
});
const totalVisibleColumns = computed(() => props.tableHeaders.length);
const allPagedAccordionExpanded = computed(() => Boolean(pagedExpandableRows.value.length) && pagedExpandableRows.value.every((record) => expandedRecordIds.value.includes(record.id)));

function normalizeValue(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeFieldKey(value: string) {
  const compact = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .trim();

  if (!compact) return "";

  const parts = compact.split(/\s+/);
  return parts
    .map((part, index) => {
      const lower = part.toLowerCase();
      return index === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

function getSortValue(record: { identifier?: string; data: Record<string, unknown> }) {
  if (sortField.value === "__identifier") {
    return normalizeValue(record.identifier);
  }

  if (!sortField.value) {
    return normalizeValue(record.identifier);
  }

  return normalizeValue(record.data?.[sortField.value]);
}

function sortRecords<T extends { identifier?: string; data: Record<string, unknown> }>(records: T[]) {
  return [...records].sort((left, right) => {
    const comparison = naturalCollator.compare(getSortValue(left), getSortValue(right));
    if (comparison === 0) {
      const fallback = naturalCollator.compare(normalizeValue(left.identifier), normalizeValue(right.identifier));
      return sortDirection.value === "asc" ? fallback : fallback * -1;
    }
    return sortDirection.value === "asc" ? comparison : comparison * -1;
  });
}

const filteredExpandableRows = computed(() => props.expandableRows);
const filteredTableRows = computed(() => props.tableRows);
const sortedExpandableRows = computed(() => sortRecords(filteredExpandableRows.value));
const sortedTableRows = computed(() => sortRecords(filteredTableRows.value));
const totalItems = computed(() => (props.activeExpandableConfig ? sortedExpandableRows.value.length : sortedTableRows.value.length));
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)));
const pageStart = computed(() => (totalItems.value ? (currentPage.value - 1) * pageSize.value + 1 : 0));
const pageEnd = computed(() => Math.min(currentPage.value * pageSize.value, totalItems.value));

const pagedExpandableRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return sortedExpandableRows.value.slice(start, start + pageSize.value);
});

const pagedTableRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return sortedTableRows.value.slice(start, start + pageSize.value);
});

function createDefaultPreferences(): TablePreferences {
  return {
    pageSize: defaultPageSize,
    sortField: props.activeExpandableConfig ? "__identifier" : props.tableHeaders[0] ?? "",
    sortDirection: "asc",
  };
}

function syncSortField() {
  const available = sortOptions.value.map((option) => option.value);
  if (!available.length) {
    sortField.value = "";
    return;
  }

  if (!available.includes(sortField.value)) {
    sortField.value = available[0];
  }
}

function readStoredPreferences() {
  if (!import.meta.client) return createDefaultPreferences();

  try {
    const raw = window.localStorage.getItem(preferenceStorageKey.value);
    if (!raw) return createDefaultPreferences();

    const parsed = JSON.parse(raw) as Partial<TablePreferences>;
    return {
      pageSize: pageSizeOptions.includes(Number(parsed.pageSize)) ? Number(parsed.pageSize) : defaultPageSize,
      sortField: typeof parsed.sortField === "string" ? parsed.sortField : createDefaultPreferences().sortField,
      sortDirection: parsed.sortDirection === "desc" ? "desc" : "asc",
    };
  } catch {
    return createDefaultPreferences();
  }
}

function applyPreferences(preferences: TablePreferences) {
  pageSize.value = preferences.pageSize;
  sortField.value = preferences.sortField;
  sortDirection.value = preferences.sortDirection;
  syncSortField();
}

function persistPreferences() {
  if (!import.meta.client) return;

  const payload: TablePreferences = {
    pageSize: pageSize.value,
    sortField: sortField.value,
    sortDirection: sortDirection.value,
  };

  window.localStorage.setItem(preferenceStorageKey.value, JSON.stringify(payload));
}

watch(
  () => [props.activeDatasetName, props.tableHeaders.join("|"), props.activeExpandableConfig ? "expandable" : "table"],
  () => {
    currentPage.value = 1;
    applyPreferences(readStoredPreferences());
  },
  { immediate: true },
);

watch([totalItems, pageSize], () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value;
  }
});

watch([currentPage, pageSize, () => props.activeDatasetName], () => {
  expandedRecordIds.value = [];
});

watch([pageSize, sortField, sortDirection], () => {
  persistPreferences();
}, { deep: true });

function toggleSort(field: string) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
    return;
  }

  sortField.value = field;
  sortDirection.value = "asc";
}

function goToPreviousPage() {
  currentPage.value = Math.max(1, currentPage.value - 1);
}

function goToNextPage() {
  currentPage.value = Math.min(totalPages.value, currentPage.value + 1);
}

function handleImportModeChange(event: Event) {
  importMode.value = ((event.target as HTMLSelectElement).value || "append") as "append" | "replace";
}

function handleSortDirectionChange(event: Event) {
  sortDirection.value = ((event.target as HTMLSelectElement).value || "asc") as "asc" | "desc";
}

function handlePageSizeChange(event: Event) {
  pageSize.value = Number((event.target as HTMLSelectElement).value) || defaultPageSize;
}

async function buildImportPreview(file: File) {
  importPreviewPending.value = true;
  importPreviewError.value = "";
  importPreview.value = null;

  try {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const firstSheet = firstSheetName ? workbook.Sheets[firstSheetName] : null;

    if (!firstSheetName || !firstSheet) {
      throw new Error("Arquivo sem planilha valida.");
    }

    const sheetRows = XLSX.utils.sheet_to_json<Array<string | number | boolean | null | undefined>>(firstSheet, {
      header: 1,
      defval: "",
      blankrows: false,
    });

    if (!sheetRows.length) {
      throw new Error("A planilha enviada esta vazia.");
    }

    const rawHeaders = (sheetRows[0] ?? []).map((value) => String(value ?? "").trim());
    const normalizedHeaders = rawHeaders.map((header) => normalizeFieldKey(header));
    const duplicateHeaders = normalizedHeaders.filter((header, index) => header && normalizedHeaders.indexOf(header) != index);

    if (!normalizedHeaders.some(Boolean)) {
      throw new Error("A planilha precisa ter uma linha de cabecalho valida.");
    }

    if (duplicateHeaders.length) {
      throw new Error(`Cabecalhos duplicados encontrados: ${duplicateHeaders.join(", ")}`);
    }

    const ignoredColumns = rawHeaders.filter((_, index) => !normalizedHeaders[index]);
    const rows = sheetRows
      .slice(1)
      .filter((row) => row.some((value) => String(value ?? "").trim()))
      .map((row) => Object.fromEntries(
        normalizedHeaders
          .map((fieldKey, index) => [fieldKey, String(row[index] ?? "").trim()] as const)
          .filter(([fieldKey]) => Boolean(fieldKey)),
      ));

    if (!rows.length) {
      throw new Error("A planilha nao possui linhas de dados para importar.");
    }

    const incomingFields = normalizedHeaders.filter(Boolean);
    const existingFieldSet = new Set(existingDatasetFields.value);
    const existingFields = incomingFields.filter((field) => existingFieldSet.has(field));
    const newFields = incomingFields.filter((field) => !existingFieldSet.has(field));
    const sampleRows = rows.slice(0, 5).map((row) => Object.fromEntries(incomingFields.map((field) => [field, String(row[field] ?? "")])));

    importPreview.value = {
      fileName: file.name,
      totalRows: rows.length,
      headers: incomingFields,
      sampleRows,
      newFields,
      existingFields,
      ignoredColumns,
    };
  } catch (error: any) {
    importPreviewError.value = error?.message || "Falha ao ler o arquivo antes da importacao.";
  } finally {
    importPreviewPending.value = false;
  }
}

async function handleImportFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  importFile.value = input.files?.[0] ?? null;

  if (!importFile.value) {
    importPreview.value = null;
    importPreviewError.value = "";
    return;
  }

  await buildImportPreview(importFile.value);
}

function submitImport() {
  if (!importFile.value || !canSubmitImport.value) return;
  emit("import-dataset", { file: importFile.value, mode: importMode.value });
}

function isRecordExpanded(recordId: number) {
  return expandedRecordIds.value.includes(recordId);
}

function handleExpandedChange(payload: { recordId: number; expanded: boolean }) {
  if (payload.expanded) {
    if (!expandedRecordIds.value.includes(payload.recordId)) {
      expandedRecordIds.value = [...expandedRecordIds.value, payload.recordId];
    }
    return;
  }

  expandedRecordIds.value = expandedRecordIds.value.filter((item) => item != payload.recordId);
}

function expandPagedRows() {
  expandedRecordIds.value = Array.from(new Set([...expandedRecordIds.value, ...pagedExpandableRows.value.map((record) => record.id)]));
}

function collapsePagedRows() {
  const currentIds = new Set(pagedExpandableRows.value.map((record) => record.id));
  expandedRecordIds.value = expandedRecordIds.value.filter((item) => !currentIds.has(item));
}

function escapeCsvValue(value: unknown) {
  const normalized = String(value ?? "").replace(/"/g, '""');
  return `"${normalized}"`;
}

function getExportRows() {
  const rows = props.activeExpandableConfig ? sortedExpandableRows.value : sortedTableRows.value;
  const headers = props.activeExpandableConfig ? ["Identificacao", ...visibleTableHeaders.value] : visibleTableHeaders.value;
  const records = rows.map((record) =>
    props.activeExpandableConfig
      ? {
          Identificacao: record.identifier ?? "",
          ...Object.fromEntries(visibleTableHeaders.value.map((field) => [field, record.data?.[field] ?? ""])),
        }
      : Object.fromEntries(visibleTableHeaders.value.map((field) => [field, record.data?.[field] ?? ""])),
  );

  return { headers, records };
}

function getExportBaseName() {
  return (props.activeDatasetName || "base")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "base";
}

function exportCurrentViewToCsv() {
  const { headers, records } = getExportRows();
  const csvLines = [
    headers.map((header) => escapeCsvValue(header)).join(";"),
    ...records.map((record) => headers.map((header) => escapeCsvValue(record[header])).join(";")),
  ];

  const csvContent = `\uFEFF${csvLines.join("\r\n")}`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const baseName = getExportBaseName();
  link.href = url;
  link.download = `${baseName || "base"}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function exportCurrentViewToExcel() {
  if (exportPending.value) return;

  exportPending.value = true;

  try {
    const { headers, records } = getExportRows();
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(records, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Base ativa");
    XLSX.writeFileXLSX(workbook, `${getExportBaseName()}.xlsx`);
  } finally {
    exportPending.value = false;
  }
}
</script>

<template>
  <section class="inventory-data-shell">
    <div class="surface-card data-surface integrated-data-surface">
      <div class="surface-head compact-head integrated-data-head">
        <div>
          <p class="eyebrow">Base ativa</p>
          <h3>{{ activeDatasetName || 'Registros' }}</h3>
        </div>
        <div class="integrated-data-controls">
          <label class="field-block field-block-wide">
            <span>Buscar na base</span>
            <input :value="datasetQuery" type="search" placeholder="Nome, patrimonio, serial, hostname, area..." @input="emit('update:datasetQuery', ($event.target as HTMLInputElement).value)" />
          </label>
          <label class="field-block field-block-narrow">
            <span>Base</span>
            <select :value="activeDatasetName" @change="emit('update:activeDatasetName', ($event.target as HTMLSelectElement).value)">
              <option v-for="dataset in datasets" :key="dataset.id" :value="dataset.name">
                {{ dataset.name }}
              </option>
            </select>
          </label>
        </div>
      </div>

      <p v-if="datasetError" class="error-copy">{{ datasetError }}</p>
      <p v-else-if="datasetsLoading || loading" class="surface-copy">Carregando registros...</p>
      <p v-else-if="activeDataset && !activeDataset.records.length" class="surface-copy">Nenhum registro encontrado para esta busca.</p>

      <template v-else-if="activeDataset">
        <div class="inventory-ux-summary">
          <span class="header-chip">{{ totalVisibleColumns }} coluna(s)</span>
          <span class="header-chip">Importacao em modo {{ importModeLabel }}</span>
          <span class="header-chip">{{ resultSummary }}</span>
        </div>

        <div class="import-surface">
          <div class="column-filters-head">
            <div>
              <p class="eyebrow">Importacao</p>
              <p class="surface-copy">Envie CSV, XLS ou XLSX para acrescentar ou substituir os registros da base ativa.</p>
            </div>
          </div>

          <div class="import-grid">
            <label class="field-block field-block-wide">
              <span>Arquivo da planilha</span>
              <input type="file" accept=".csv,.xls,.xlsx" @change="handleImportFileChange" />
            </label>

            <label class="field-block toolbar-inline-field-compact">
              <span>Modo</span>
              <select :value="importMode" @change="handleImportModeChange">
                <option value="append">Acrescentar</option>
                <option value="replace">Substituir</option>
              </select>
            </label>

            <div class="import-actions">
              <button class="primary-cta" type="button" :disabled="!canSubmitImport || inventorySaving || importPreviewPending" @click="submitImport">
                {{ inventorySaving ? 'Importando...' : importPreviewPending ? 'Lendo arquivo...' : 'Importar arquivo' }}
              </button>
            </div>
          </div>

          <p v-if="importPreviewError" class="error-copy">{{ importPreviewError }}</p>

          <div v-else-if="importPreview" class="import-preview-surface">
            <div class="import-preview-head">
              <div>
                <p class="metric-label">Arquivo pronto para revisao</p>
                <strong>{{ importPreview.fileName }}</strong>
              </div>
              <div class="import-preview-stats">
                <span class="header-chip">{{ importPreview.totalRows }} linha(s)</span>
                <span class="header-chip">{{ importPreview.headers.length }} coluna(s)</span>
              </div>
            </div>

            <div class="import-preview-grid">
              <article class="preview-info-card">
                <p class="metric-label">Colunas reconhecidas</p>
                <div class="preview-chip-list">
                  <span v-for="field in importPreview.headers" :key="field" class="header-chip">{{ formatFieldLabel(field) }}</span>
                </div>
              </article>

              <article class="preview-info-card">
                <p class="metric-label">Validacao</p>
                <p class="surface-copy">
                  {{ importPreview.existingFields.length }} coluna(s) ja existentes
                  <span v-if="importPreview.newFields.length"> e {{ importPreview.newFields.length }} nova(s)</span>
                </p>
                <div v-if="importPreview.newFields.length" class="preview-chip-list">
                  <span v-for="field in importPreview.newFields" :key="field" class="status-tag is-active">Novo: {{ formatFieldLabel(field) }}</span>
                </div>
                <div v-if="importPreview.ignoredColumns.length" class="preview-chip-list">
                  <span v-for="field in importPreview.ignoredColumns" :key="field" class="status-tag is-inactive">Ignorado: {{ field ? formatFieldLabel(field) : 'Sem titulo' }}</span>
                </div>
              </article>
            </div>

            <div class="preview-table-shell">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th v-for="field in importPreview.headers" :key="field">{{ formatFieldLabel(field) }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in importPreview.sampleRows" :key="index">
                    <td v-for="field in importPreview.headers" :key="`${index}-${field}`">{{ row[field] || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="data-toolbar">
          <div class="data-toolbar-meta">
            <strong>{{ totalItems }}</strong>
            <span>registro(s)</span>
            <span v-if="totalItems">mostrando {{ pageStart }}-{{ pageEnd }}</span>
          </div>

          <div class="data-toolbar-actions">
            <div v-if="activeExpandableConfig" class="accordion-toolbar-actions">
              <button class="secondary-cta" type="button" :disabled="!pagedExpandableRows.length || allPagedAccordionExpanded" @click="expandPagedRows">
                Expandir pagina
              </button>
              <button class="secondary-cta" type="button" :disabled="!pagedExpandableRows.length || !expandedRecordIds.length" @click="collapsePagedRows">
                Recolher pagina
              </button>
            </div>
            <label class="toolbar-inline-field">
              <span>Ordenar por</span>
              <select :value="sortField" @change="sortField = ($event.target as HTMLSelectElement).value">
                <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="toolbar-inline-field toolbar-inline-field-compact">
              <span>Ordem</span>
              <select :value="sortDirection" @change="handleSortDirectionChange">
                <option value="asc">Crescente</option>
                <option value="desc">Decrescente</option>
              </select>
            </label>

            <label class="toolbar-inline-field toolbar-inline-field-compact">
              <span>Por pagina</span>
              <select :value="String(pageSize)" @change="handlePageSizeChange">
                <option v-for="size in pageSizeOptions" :key="size" :value="String(size)">
                  {{ size }}
                </option>
              </select>
            </label>

            <button class="secondary-cta" type="button" @click="exportCurrentViewToCsv">
              Exportar CSV
            </button>

            <button class="secondary-cta" type="button" :disabled="exportPending" @click="exportCurrentViewToExcel">
              {{ exportPending ? 'Gerando Excel...' : 'Exportar Excel' }}
            </button>

            <div class="pagination-controls">
              <button class="secondary-cta" type="button" :disabled="currentPage === 1" @click="goToPreviousPage">
                Anterior
              </button>
              <span>Pagina {{ currentPage }} de {{ totalPages }}</span>
              <button class="secondary-cta" type="button" :disabled="currentPage === totalPages" @click="goToNextPage">
                Proxima
              </button>
            </div>
          </div>
        </div>

        <div v-if="activeExpandableConfig" class="record-stack" :class="tableShellClass">
          <InventoryRecordAccordionItem
            v-for="record in pagedExpandableRows"
            :key="record.id"
            :record="record"
            :table-headers="visibleTableHeaders"
            :inventory-saving="inventorySaving"
            :expanded="isRecordExpanded(record.id)"
            @expanded-change="handleExpandedChange"
            @update-field="emit('update-field', $event)"
            @delete-record="emit('delete-record', $event)"
          />

          <p v-if="!pagedExpandableRows.length" class="surface-copy empty-state-copy">
            Nenhum registro encontrado nesta pagina com os filtros atuais.
          </p>
        </div>

        <div v-else class="data-table-shell">
          <table class="inventory-table-next">
            <thead>
              <tr>
                <th>Acoes</th>
                <th v-for="field in visibleTableHeaders" :key="field">
                  <button class="table-sort-button" type="button" @click="toggleSort(field)">
                    <span>{{ formatFieldLabel(field) }}</span>
                    <span class="sort-indicator" :class="{ active: sortField === field }">
                      {{ sortField === field ? (sortDirection === 'asc' ? 'A-Z' : 'Z-A') : 'A/Z' }}
                    </span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in pagedTableRows" :key="record.id">
                <td>
                  <button class="danger-cta" type="button" :disabled="inventorySaving" @click="emit('delete-record', record.id)">
                    Excluir
                  </button>
                </td>
                <td v-for="field in visibleTableHeaders" :key="`${record.id}-${field}`">
                  <input
                    class="table-cell-input"
                    :value="String(record.data[field] ?? '')"
                    type="text"
                    :placeholder="formatFieldLabel(field)"
                    @change="emit('update-field', { recordId: record.id, field, event: $event })"
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <p v-if="!pagedTableRows.length" class="surface-copy empty-state-copy">
            Nenhum registro encontrado nesta pagina com os filtros atuais.
          </p>
        </div>
      </template>
    </div>
  </section>
</template>




