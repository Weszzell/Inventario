<script setup lang="ts">
defineProps<{
  eyebrow: string;
  title: string;
  description: string;
  chips?: string[];
  compact?: boolean;
}>();
</script>

<template>
  <section class="page-hero">
    <div class="hero-intro-card" :class="{ compact: compact }">
      <p class="eyebrow">{{ eyebrow }}</p>
      <h2>{{ title }}</h2>
      <p class="hero-copy">{{ description }}</p>
      <div v-if="chips?.length" class="hero-chip-row">
        <span v-for="chip in chips" :key="chip" class="hero-chip">{{ chip }}</span>
      </div>
    </div>
  </section>
</template>
