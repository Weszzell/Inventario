<script setup lang="ts">
defineProps<{
  activeDatasetName: string;
  datasets: Array<{ id: number; name: string }>;
  datasetQuery: string;
  datasetCards: Array<{ id: number; name: string; recordCount: number; fieldCount: number }>;
  datasetError: string;
  datasetsLoading: boolean;
  loading: boolean;
  activeDataset: { records: unknown[] } | null;
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
}>();
</script>

<template>
  <div class="inventory-records-stack horizontal-records-stack">
    <div class="inventory-dataset-ribbon-column">
      <InventoryDatasetOverview :active-dataset-name="activeDatasetName" :dataset-cards="datasetCards" />
    </div>

    <div class="inventory-records-main-column">
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
        @update:datasetQuery="emit('update:datasetQuery', $event)"
        @update:activeDatasetName="emit('update:activeDatasetName', $event)"
        @update-field="emit('update-field', $event)"
        @delete-record="emit('delete-record', $event)"
      />
    </div>
  </div>
</template>
