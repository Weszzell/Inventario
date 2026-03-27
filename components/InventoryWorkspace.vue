<script setup lang="ts">
import { formatFieldLabel } from "~/utils/field-label";

const activePanel = ref<"record" | "field">("record");

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
      <article class="surface-card workspace-card tabbed-workspace-card">
        <div class="surface-head compact-head compact-surface-head">
          <div>
            <p class="eyebrow">Operacao</p>
            <h3>{{ activeDataset.name }}</h3>
          </div>
          <div class="workspace-tabs" role="tablist" aria-label="Operacoes da base">
            <button class="workspace-tab" :class="{ active: activePanel === 'record' }" type="button" @click="activePanel = 'record'">
              Novo registro
            </button>
            <button class="workspace-tab" :class="{ active: activePanel === 'field' }" type="button" @click="activePanel = 'field'">
              Estrutura
            </button>
          </div>
        </div>

        <div v-if="activePanel === 'record'" class="workspace-panel-body">
          <p class="surface-copy">Os campos exibidos seguem a estrutura visivel da base ativa.</p>

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

        <div v-else class="workspace-panel-body structure-panel-body">
          <p class="surface-copy">Crie campos personalizados e mantenha a base preparada para novos controles.</p>

          <form class="structure-inline-form" @submit.prevent="emit('add-field')">
            <label class="field-block field-block-wide">
              <span>Nome do campo</span>
              <input :value="newFieldName" type="text" placeholder="Ex: patrimonio, garantia, local, etiqueta" @input="emit('update:newFieldName', ($event.target as HTMLInputElement).value)" />
            </label>
            <button class="secondary-cta" type="submit" :disabled="inventorySaving">
              {{ inventorySaving ? 'Salvando...' : 'Criar campo' }}
            </button>
          </form>
        </div>
      </article>
    </section>
  </div>
</template>
