<script setup lang="ts">
import { formatFieldLabel } from "~/utils/field-label";

defineProps<{
  activeDatasetName: string;
  activeDataset: { name: string } | null;
  tableHeaders: string[];
  newRecordForm: Record<string, string>;
  newFieldName: string;
  inventorySaving: boolean;
}>();

const emit = defineEmits<{
  (e: "update:newFieldName", value: string): void;
  (e: "update:newRecordField", payload: { field: string; value: string }): void;
  (e: "create-record"): void;
  (e: "add-field"): void;
}>();
</script>

<template>
  <div class="inventory-workspace-stack">
    <section class="inventory-operation-shell" v-if="activeDataset">
      <article class="surface-card workspace-card operation-card">
        <div class="surface-head compact-head compact-surface-head operation-head">
          <div>
            <p class="eyebrow">Operacao</p>
            <h3>{{ activeDataset.name }}</h3>
          </div>

          <form class="operation-inline-form" @submit.prevent="emit('add-field')">
            <label class="field-block field-block-wide">
              <span>Novo campo</span>
              <input :value="newFieldName" type="text" placeholder="Ex: patrimonio, garantia, local" @input="emit('update:newFieldName', ($event.target as HTMLInputElement).value)" />
            </label>
            <button class="secondary-cta" type="submit" :disabled="inventorySaving">
              {{ inventorySaving ? 'Salvando...' : 'Criar campo' }}
            </button>
          </form>
        </div>

        <div class="workspace-panel-body">
          <p class="surface-copy">Preencha apenas o que precisar para adicionar um novo registro.</p>

          <form class="form-grid-compact" @submit.prevent="emit('create-record')">
            <label v-for="field in tableHeaders" :key="`new-${field}`" class="field-block">
              <span>{{ formatFieldLabel(field) }}</span>
              <input :value="newRecordForm[field] ?? ''" type="text" :placeholder="`Digite ${formatFieldLabel(field)}`" @input="emit('update:newRecordField', { field, value: ($event.target as HTMLInputElement).value })" />
            </label>

            <div class="form-actions-bar full-width-actions">
              <button class="primary-cta" type="submit" :disabled="inventorySaving">
                {{ inventorySaving ? 'Salvando...' : 'Adicionar registro' }}
              </button>
            </div>
          </form>
        </div>
      </article>
    </section>
  </div>
</template>
