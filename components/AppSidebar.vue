<script setup lang="ts">
defineProps<{
  navItems: Array<{ label: string; to: string; description: string }>;
  currentPath: string;
  sessionUser: { displayName: string; username: string; role: string } | null;
  onLogout: () => void;
}>();
</script>

<template>
  <header class="topbar-shell">
    <div class="topbar-panel">
      <div class="topbar-brand-row">
        <div class="brand-stack horizontal-brand-stack">
          <p class="brand-kicker">Web Inventory</p>
          <h1>Controle de equipamentos</h1>
          <p class="brand-copy">Leitura, operacao e administracao em uma faixa unica de trabalho.</p>
        </div>

        <nav class="topbar-nav">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="topbar-link"
            :class="{ active: currentPath === item.to }"
          >
            <strong>{{ item.label }}</strong>
            <span>{{ item.description }}</span>
          </NuxtLink>
        </nav>
      </div>

      <div class="topbar-user-card">
        <template v-if="sessionUser">
          <div class="topbar-user-copy">
            <p class="sidebar-user-label">Sessao atual</p>
            <strong>{{ sessionUser.displayName }}</strong>
            <span>{{ sessionUser.username }} | {{ sessionUser.role }}</span>
          </div>
          <button class="secondary-cta" type="button" @click="onLogout()">Encerrar sessao</button>
        </template>
        <template v-else>
          <div class="topbar-user-copy">
            <p class="sidebar-user-label">Sessao atual</p>
            <strong>Visitante</strong>
            <span>Entre para acessar os dados</span>
          </div>
        </template>
      </div>
    </div>
  </header>
</template>
