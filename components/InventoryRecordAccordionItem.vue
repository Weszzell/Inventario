<script setup lang="ts">
import { formatFieldLabel } from "~/utils/field-label";

defineProps<{
  record: { id: number; identifier: string; data: Record<string, unknown> };
  tableHeaders: string[];
  inventorySaving: boolean;
  expanded?: boolean;
}>();

const emit = defineEmits<{
  (e: "update-field", payload: { recordId: number; field: string; event: Event }): void;
  (e: "delete-record", recordId: number): void;
  (e: "expanded-change", payload: { recordId: number; expanded: boolean }): void;
}>();
</script>

<template>
  <details class="record-accordion" :open="expanded" @toggle="emit('expanded-change', { recordId: record.id, expanded: ($event.target as HTMLDetailsElement).open })">
    <summary class="record-accordion-head">
      <div>
        <p class="metric-label">Identificacao</p>
        <strong class="record-accordion-title">{{ record.identifier }}</strong>
      </div>
      <span class="record-accordion-action">Ver detalhes</span>
    </summary>

    <div class="record-accordion-body">
      <div class="record-fields-grid">
        <label v-for="field in tableHeaders" :key="`${record.id}-${field}`" class="field-block">
          <span>{{ formatFieldLabel(field) }}</span>
          <input
            class="table-cell-input"
            :value="String(record.data[field] ?? '')"
            type="text"
            :placeholder="formatFieldLabel(field)"
            @change="emit('update-field', { recordId: record.id, field, event: $event })"
          />
        </label>
      </div>

      <div class="record-accordion-footer">
        <button class="danger-cta" type="button" :disabled="inventorySaving" @click="emit('delete-record', record.id)">
          Excluir registro
        </button>
      </div>
    </div>
  </details>
</template>
