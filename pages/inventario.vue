<script setup lang="ts">
const {
  status,
  summary,
  sessionUser,
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
  loginForm,
  newRecordForm,
  newFieldName,
  tableHeaders,
  tableRows,
  activeExpandableConfig,
  expandableRows,
  bootstrap,
  handleLogin,
  createRecord,
  updateField,
  deleteRecord,
  addField,
  importDatasetFile,
  bindInventoryWatchers,
} = useWebInventory();

const heroChips = computed(() => {
  const items = [
    status.value?.database?.connected ? "Banco conectado" : "Conexao pendente",
    `${summary.value?.totalRecords ?? status.value?.stats?.records ?? 0} registros`,
  ];

  if (summary.value?.generatedAt) {
    items.push(`Resumo ${new Date(summary.value.generatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`);
  }

  return items;
});

onMounted(async () => {
  bindInventoryWatchers();
  await bootstrap();
});
</script>

<template>
  <main class="page-shell inventory-page">
    <UiHeroSection
      eyebrow="Inventario"
      title="Controle de equipamentos"
      description="Consulta e operacao direta da base ativa."
      :chips="heroChips"
      compact
    />

    <AuthLoginCard
      v-if="!sessionUser"
      title="Entrar para usar o inventario"
      :username="loginForm.username"
      :password="loginForm.password"
      :pending="loginPending"
      :error="sessionError"
      @update:username="loginForm.username = $event"
      @update:password="loginForm.password = $event"
      @submit="handleLogin"
    />

    <template v-else>
      <section class="inventory-layout-flat">
        <InventoryWorkspace
          :active-dataset-name="activeDatasetName"
          :active-dataset="activeDataset"
          :table-headers="tableHeaders"
          :new-record-form="newRecordForm"
          :new-field-name="newFieldName"
          :inventory-saving="inventorySaving"
          @update:new-field-name="newFieldName = $event"
          @update:new-record-field="newRecordForm[$event.field] = $event.value"
          @create-record="createRecord"
          @add-field="addField"
        />
        <section v-if="inventoryFeedback || inventoryError" class="feedback-banner surface-card horizontal-feedback-card">
          <p v-if="inventoryFeedback" class="success-copy">{{ inventoryFeedback }}</p>
          <p v-if="inventoryError" class="error-copy">{{ inventoryError }}</p>
        </section>

        <InventoryRecordList
          :active-dataset-name="activeDatasetName"
          :datasets="datasets"
          :dataset-query="datasetQuery"
          :dataset-error="datasetError"
          :datasets-loading="datasetsLoading"
          :loading="loading"
          :active-dataset="activeDataset"
          :active-expandable-config="activeExpandableConfig"
          :expandable-rows="expandableRows"
          :table-headers="tableHeaders"
          :table-rows="tableRows"
          :inventory-saving="inventorySaving"
          @update:datasetQuery="datasetQuery = $event"
          @update:activeDatasetName="activeDatasetName = $event"
          @update-field="updateField($event.recordId, $event.field, $event.event)"
          @delete-record="deleteRecord"
          @import-dataset="importDatasetFile($event.file, $event.mode)"
        />
      </section>
    </template>
  </main>
</template>
