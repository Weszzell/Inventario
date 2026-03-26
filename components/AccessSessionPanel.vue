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
  <section class="surface-card access-session-surface">
    <div class="surface-head compact-head">
      <div>
        <p class="eyebrow">Sessao</p>
        <h3>{{ sessionUser ? sessionUser.displayName : 'Entrar no sistema' }}</h3>
      </div>
      <p class="surface-copy">Use esta area para autenticar e liberar a administracao da plataforma.</p>
    </div>

    <div v-if="sessionUser" class="session-overview-grid">
      <article class="mini-stat-card">
        <span class="metric-label">Usuario</span>
        <strong>{{ sessionUser.username }}</strong>
      </article>
      <article class="mini-stat-card">
        <span class="metric-label">Perfil</span>
        <strong>{{ sessionUser.role }}</strong>
      </article>
      <article class="mini-stat-card">
        <span class="metric-label">Status</span>
        <strong>{{ sessionUser.active ? 'Ativo' : 'Bloqueado' }}</strong>
      </article>
    </div>
  </section>
</template>
