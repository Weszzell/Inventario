<script setup lang="ts">
defineProps<{
  title: string;
  username: string;
  password: string;
  pending: boolean;
  error: string;
}>();

const emit = defineEmits<{
  (e: "update:username", value: string): void;
  (e: "update:password", value: string): void;
  (e: "submit"): void;
}>();
</script>

<template>
  <section class="surface-card login-surface">
    <div class="surface-head">
      <div>
        <p class="eyebrow">Acesso</p>
        <h3>{{ title }}</h3>
      </div>
    </div>

    <form class="login-form-grid" @submit.prevent="emit('submit')">
      <label class="field-block">
        <span>Usuario</span>
        <input :value="username" type="text" autocomplete="username" @input="emit('update:username', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="field-block">
        <span>Senha</span>
        <input :value="password" type="password" autocomplete="current-password" @input="emit('update:password', ($event.target as HTMLInputElement).value)" />
      </label>
      <button class="primary-cta" type="submit" :disabled="pending">
        {{ pending ? 'Entrando...' : 'Entrar' }}
      </button>
      <p v-if="error" class="error-copy">{{ error }}</p>
    </form>
  </section>
</template>