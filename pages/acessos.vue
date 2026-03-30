<script setup lang="ts">
type AccessRole = "ADMIN" | "EDITOR";

const {
  status,
  sessionUser,
  users,
  auditLogs,
  loading,
  loginPending,
  sessionError,
  accessFeedback,
  accessError,
  accessSaving,
  backupPending,
  restorePending,
  backupPreview,
  loginForm,
  userForm,
  passwordForm,
  isAdmin,
  bootstrap,
  handleLogin,
  createUser,
  exportSystemBackup,
  selectRestoreFile,
  restoreSystemBackup,
  changeOwnPassword,
  toggleUserActive,
  updateUserRole,
  resetUserPassword,
} = useWebInventory();

const heroChips = computed(() => [
  `${users.value.length || (status.value?.stats?.users ?? 0)} usuarios`,
  sessionUser.value ? "Sessao ativa" : "Sessao inativa",
]);

function handleUserFormUpdate(payload: { field: string; value: string }) {
  (userForm.value as Record<string, string>)[payload.field] = payload.value;
}

function handlePasswordFormUpdate(payload: { field: string; value: string }) {
  (passwordForm.value as Record<string, string>)[payload.field] = payload.value;
}

function handleRoleUpdate(payload: { userId: number; role: AccessRole }) {
  const user = users.value.find((item) => item.id === payload.userId);
  if (!user) return;
  updateUserRole(user, payload.role);
}

function handleToggleUser(userId: number) {
  const user = users.value.find((item) => item.id === userId);
  if (!user) return;
  toggleUserActive(user);
}

function handleResetUserPassword(payload: { userId: number; password: string }) {
  resetUserPassword(payload.userId, payload.password);
}

onMounted(bootstrap);
</script>

<template>
  <main class="page-shell access-page">
    <UiHeroSection
      eyebrow="Acessos"
      title="Controle de acessos"
      description="Gestao direta de usuarios, sessao e backup."
      :chips="heroChips"
      compact
    />

    <AuthLoginCard
      v-if="!sessionUser"
      title="Entrar no sistema"
      :username="loginForm.username"
      :password="loginForm.password"
      :pending="loginPending"
      :error="sessionError"
      @update:username="loginForm.username = $event"
      @update:password="loginForm.password = $event"
      @submit="handleLogin"
    />

    <template v-else>
      <section class="access-horizontal-layout">
        <div class="access-primary-column">
          <AccessSessionPanel :session-user="sessionUser" />
          <AccessAdminPanel
            :session-user="sessionUser"
            :is-admin="isAdmin"
            :user-form="userForm"
            :password-form="passwordForm"
            :access-saving="accessSaving"
            :access-feedback="accessFeedback"
            :access-error="accessError"
            :backup-pending="backupPending"
            :restore-pending="restorePending"
            :backup-preview="backupPreview"
            @update:user-form="handleUserFormUpdate"
            @update:password-form="handlePasswordFormUpdate"
            @create-user="createUser"
            @change-password="changeOwnPassword"
            @export-backup="exportSystemBackup"
            @select-restore-file="selectRestoreFile"
            @restore-backup="restoreSystemBackup"
          />
        </div>

        <div class="access-secondary-column">
          <AccessUsersPanel
            :loading="loading"
            :session-user="sessionUser"
            :is-admin="isAdmin"
            :users="users"
            :access-saving="accessSaving"
            @toggle-user="handleToggleUser"
            @update-user-role="handleRoleUpdate"
            @reset-user-password="handleResetUserPassword"
          />

          <AuditLogPanel :loading="loading" :session-user="sessionUser" :is-admin="isAdmin" :audit-logs="auditLogs" />
        </div>
      </section>
    </template>
  </main>
</template>
