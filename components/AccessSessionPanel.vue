<script setup lang="ts">
defineProps<{
  sessionUser: {
    displayName: string;
    username: string;
    role: string;
    active: boolean;
  } | null;
}>();
</script>

<template>
  <section class="surface-card access-session-surface compact-session-surface">
    <div class="surface-head compact-head">
      <div>
        <p class="eyebrow">Sessao</p>
        <h3>Sessao atual</h3>
      </div>
    </div>

    <div v-if="sessionUser" class="compact-session-card session-inline-card">
      <div>
        <strong>{{ sessionUser.displayName }}</strong>
        <p class="surface-copy compact-copy">{{ sessionUser.username }} - {{ sessionUser.role }}</p>
      </div>
      <span class="status-tag" :class="sessionUser.active ? 'is-active' : 'is-inactive'">
        {{ sessionUser.active ? 'Ativo' : 'Bloqueado' }}
      </span>
    </div>
  </section>
</template>
