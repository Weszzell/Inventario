<script setup lang="ts">
type AccessRole = "ADMIN" | "EDITOR";

const props = defineProps<{
  loading: boolean;
  sessionUser: { id: number } | null;
  isAdmin: boolean;
  users: Array<{
    id: number;
    role: string;
    displayName: string;
    username: string;
    active: boolean;
  }>;
  accessSaving: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle-user", userId: number): void;
  (e: "update-user-role", payload: { userId: number; role: AccessRole }): void;
  (e: "reset-user-password", payload: { userId: number; password: string }): void;
}>();

const passwordDrafts = ref<Record<number, string>>({});
const resetOpenUserId = ref<number | null>(null);
const userQuery = ref("");
const statusFilter = ref<"all" | "active" | "inactive">("all");

const filteredUsers = computed(() => {
  const query = userQuery.value.trim().toLocaleLowerCase("pt-BR");

  return props.users.filter((user) => {
    const matchesQuery = !query || `${user.displayName} ${user.username} ${user.role}`.toLocaleLowerCase("pt-BR").includes(query);
    const matchesStatus = statusFilter.value === "all"
      || (statusFilter.value === "active" && user.active)
      || (statusFilter.value === "inactive" && !user.active);

    return matchesQuery && matchesStatus;
  });
});

const activeUsersCount = computed(() => filteredUsers.value.filter((user) => user.active).length);
const inactiveUsersCount = computed(() => filteredUsers.value.filter((user) => !user.active).length);

function toggleResetPanel(userId: number) {
  resetOpenUserId.value = resetOpenUserId.value === userId ? null : userId;
}

function submitReset(userId: number) {
  const password = String(passwordDrafts.value[userId] ?? "").trim();
  if (!password) return;

  emit("reset-user-password", { userId, password });
  passwordDrafts.value = { ...passwordDrafts.value, [userId]: "" };
  resetOpenUserId.value = null;
}
</script>

<template>
  <section class="surface-card access-users-surface">
    <div class="surface-head compact-head">
      <div>
        <p class="eyebrow">Usuarios</p>
        <h3>Lista de acessos da base nova</h3>
      </div>
      <p class="surface-copy">A listagem completa permanece restrita a perfis administradores.</p>
    </div>

    <p v-if="loading" class="surface-copy">Carregando estado atual...</p>
    <p v-else-if="!sessionUser" class="surface-copy">Entre no sistema para visualizar esta area.</p>
    <p v-else-if="!isAdmin" class="surface-copy">Seu perfil atual nao tem permissao para listar todos os usuarios.</p>
    <template v-else>
      <div class="access-panel-summary">
        <span class="header-chip">{{ filteredUsers.length }} usuario(s) no recorte</span>
        <span class="header-chip">{{ activeUsersCount }} ativo(s)</span>
        <span class="header-chip">{{ inactiveUsersCount }} bloqueado(s)</span>
      </div>

      <div class="access-users-toolbar">
        <label class="field-block access-toolbar-search">
          <span>Buscar usuario</span>
          <input v-model="userQuery" type="search" placeholder="Nome, usuario ou perfil..." />
        </label>

        <label class="field-block field-block-narrow inline-field-block">
          <span>Status</span>
          <select v-model="statusFilter">
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Bloqueados</option>
          </select>
        </label>
      </div>

      <div class="access-user-grid">
        <article v-for="user in filteredUsers" :key="user.id" class="access-user-card stacked-user-card">
          <div class="access-user-main">
            <div>
              <p class="metric-label">{{ user.role }}</p>
              <strong>{{ user.displayName }}</strong>
              <p class="surface-copy compact-copy">{{ user.username }}</p>
            </div>
            <div class="access-user-meta">
              <span class="status-tag" :class="user.active ? 'is-active' : 'is-inactive'">
                {{ user.active ? 'Ativo' : 'Bloqueado' }}
              </span>
            </div>
          </div>

          <div class="access-user-actions">
            <label class="field-block field-block-narrow inline-field-block">
              <span>Perfil</span>
              <select
                :value="user.role"
                :disabled="accessSaving"
                @change="emit('update-user-role', { userId: user.id, role: ($event.target as HTMLSelectElement).value as AccessRole })"
              >
                <option value="EDITOR">Editor</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </label>

            <button class="secondary-cta" type="button" :disabled="accessSaving || sessionUser.id === user.id" @click="emit('toggle-user', user.id)">
              {{ user.active ? 'Bloquear' : 'Ativar' }}
            </button>

            <button class="secondary-cta" type="button" :disabled="accessSaving" @click="toggleResetPanel(user.id)">
              {{ resetOpenUserId === user.id ? 'Fechar senha' : 'Redefinir senha' }}
            </button>
          </div>

          <div v-if="resetOpenUserId === user.id" class="access-reset-panel">
            <label class="field-block">
              <span>Nova senha para {{ user.username }}</span>
              <input
                :value="passwordDrafts[user.id] ?? ''"
                type="password"
                autocomplete="new-password"
                @input="passwordDrafts = { ...passwordDrafts, [user.id]: ($event.target as HTMLInputElement).value }"
              />
            </label>

            <div class="form-actions-bar">
              <button class="primary-cta" type="button" :disabled="accessSaving || !(passwordDrafts[user.id] ?? '').trim()" @click="submitReset(user.id)">
                {{ accessSaving ? 'Salvando...' : 'Salvar nova senha' }}
              </button>
            </div>
          </div>
        </article>
      </div>

      <p v-if="!filteredUsers.length" class="surface-copy empty-state-copy">
        Nenhum usuario encontrado com os filtros atuais.
      </p>
    </template>
  </section>
</template>
