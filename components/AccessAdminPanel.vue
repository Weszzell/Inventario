<script setup lang="ts">
type AccessRole = "ADMIN" | "EDITOR";

defineProps<{
  sessionUser: {
    id: number;
    role: string;
  } | null;
  isAdmin: boolean;
  userForm: {
    displayName: string;
    username: string;
    password: string;
    role: AccessRole;
  };
  passwordForm: {
    currentPassword: string;
    nextPassword: string;
    confirmPassword: string;
  };
  accessSaving: boolean;
  accessFeedback: string;
  accessError: string;
  backupPending: boolean;
  restorePending: boolean;
  backupPreview: {
    fileName: string;
    version: number;
    exportedAt: string;
    users: number;
    datasets: number;
    records: number;
    auditLogs: number;
    appMeta: number;
  } | null;
}>();

const emit = defineEmits<{
  (e: "update:user-form", payload: { field: string; value: string }): void;
  (e: "update:password-form", payload: { field: string; value: string }): void;
  (e: "create-user"): void;
  (e: "change-password"): void;
  (e: "export-backup"): void;
  (e: "select-restore-file", file: File | null): void;
  (e: "restore-backup"): void;
}>();

function handleRestoreFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  emit("select-restore-file", input.files?.[0] ?? null);
}
</script>

<template>
  <div class="access-admin-stack">
    <section class="surface-card access-password-surface" v-if="sessionUser">
      <div class="surface-head compact-head">
        <div>
          <p class="eyebrow">Seguranca</p>
          <h3>Minha senha</h3>
        </div>
      </div>

      <form class="access-form-grid" @submit.prevent="emit('change-password')">
        <label class="field-block">
          <span>Atual</span>
          <input
            :value="passwordForm.currentPassword"
            type="password"
            autocomplete="current-password"
            @input="emit('update:password-form', { field: 'currentPassword', value: ($event.target as HTMLInputElement).value })"
          />
        </label>
        <label class="field-block">
          <span>Nova</span>
          <input
            :value="passwordForm.nextPassword"
            type="password"
            autocomplete="new-password"
            @input="emit('update:password-form', { field: 'nextPassword', value: ($event.target as HTMLInputElement).value })"
          />
        </label>
        <label class="field-block">
          <span>Confirmar</span>
          <input
            :value="passwordForm.confirmPassword"
            type="password"
            autocomplete="new-password"
            @input="emit('update:password-form', { field: 'confirmPassword', value: ($event.target as HTMLInputElement).value })"
          />
        </label>
        <div class="form-actions-bar">
          <button class="primary-cta" type="submit" :disabled="accessSaving">
            {{ accessSaving ? 'Salvando...' : 'Salvar senha' }}
          </button>
        </div>
      </form>
    </section>

    <section class="surface-card access-create-user-surface" v-if="isAdmin">
      <div class="surface-head compact-head">
        <div>
          <p class="eyebrow">Administracao</p>
          <h3>Novo usuario</h3>
        </div>
      </div>

      <form class="access-form-grid" @submit.prevent="emit('create-user')">
        <label class="field-block">
          <span>Nome</span>
          <input
            :value="userForm.displayName"
            type="text"
            @input="emit('update:user-form', { field: 'displayName', value: ($event.target as HTMLInputElement).value })"
          />
        </label>
        <label class="field-block">
          <span>Usuario</span>
          <input
            :value="userForm.username"
            type="text"
            @input="emit('update:user-form', { field: 'username', value: ($event.target as HTMLInputElement).value })"
          />
        </label>
        <label class="field-block">
          <span>Senha</span>
          <input
            :value="userForm.password"
            type="password"
            autocomplete="new-password"
            @input="emit('update:user-form', { field: 'password', value: ($event.target as HTMLInputElement).value })"
          />
        </label>
        <label class="field-block field-block-narrow">
          <span>Perfil</span>
          <select :value="userForm.role" @change="emit('update:user-form', { field: 'role', value: ($event.target as HTMLSelectElement).value })">
            <option value="EDITOR">Editor</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </label>
        <div class="form-actions-bar">
          <button class="primary-cta" type="submit" :disabled="accessSaving">
            {{ accessSaving ? 'Salvando...' : 'Criar' }}
          </button>
        </div>
      </form>
    </section>

    <section class="surface-card access-backup-surface backup-surface-rebuilt" v-if="isAdmin">
      <div class="surface-head compact-head">
        <div>
          <p class="eyebrow">Backup</p>
          <h3>Exportar e restaurar</h3>
        </div>
      </div>

      <label class="field-block backup-file-field backup-file-field-full">
        <span>Arquivo JSON</span>
        <input type="file" accept="application/json,.json" @change="handleRestoreFileChange" />
      </label>

      <div class="backup-action-row">
        <button class="secondary-cta" type="button" :disabled="backupPending" @click="emit('export-backup')">
          {{ backupPending ? 'Gerando backup...' : 'Exportar backup' }}
        </button>

        <button class="primary-cta" type="button" :disabled="!backupPreview || restorePending" @click="emit('restore-backup')">
          {{ restorePending ? 'Restaurando...' : 'Restaurar backup' }}
        </button>
      </div>

      <div v-if="backupPreview" class="backup-preview-card compact-backup-preview">
        <div class="backup-preview-head">
          <strong>{{ backupPreview.fileName }}</strong>
          <span class="header-chip">Versao {{ backupPreview.version }}</span>
        </div>
        <div class="backup-preview-stats">
          <span class="header-chip">{{ backupPreview.users }} usuarios</span>
          <span class="header-chip">{{ backupPreview.datasets }} bases</span>
          <span class="header-chip">{{ backupPreview.records }} registros</span>
        </div>
      </div>
    </section>

    <section v-if="accessFeedback || accessError" class="feedback-banner">
      <p v-if="accessFeedback" class="success-copy">{{ accessFeedback }}</p>
      <p v-if="accessError" class="error-copy">{{ accessError }}</p>
    </section>
  </div>
</template>
