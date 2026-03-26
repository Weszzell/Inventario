<script setup lang="ts">
const route = useRoute();
const { sessionUser, handleLogout } = useWebInventory();

const navItems = [
  { label: "Inventario", to: "/inventario", description: "Bases, registros e estrutura" },
  { label: "Acessos", to: "/acessos", description: "Sessao e usuarios" },
];
</script>

<template>
  <div class="app-shell">
    <AppSidebar :nav-items="navItems" :current-path="route.path" :session-user="sessionUser" :on-logout="handleLogout" />
    <div class="content-shell">
      <NuxtPage />
    </div>
  </div>
</template>