<script setup lang="ts">
defineProps<{
  activeDatasetName: string;
  datasetCards: Array<{ id: number; name: string; recordCount: number; fieldCount: number }>;
}>();
</script>

<template>
  <section class="inventory-overview-shell">
    <div class="surface-card dataset-surface">
    <div class="surface-head compact-head">
      <div>
        <p class="eyebrow">Panorama das bases</p>
        <h3>Volume por conjunto</h3>
      </div>
    </div>

    <div class="dataset-pills-grid">
      <article
        v-for="dataset in datasetCards"
        :key="dataset.id"
        class="dataset-pill-card"
        :class="{ active: dataset.name === activeDatasetName }"
      >
        <p class="metric-label">{{ dataset.name }}</p>
        <strong class="metric-value compact">{{ dataset.recordCount }}</strong>
        <p class="metric-note">{{ dataset.fieldCount }} campos</p>
      </article>
    </div>
      </div>
  </section>
</template>
