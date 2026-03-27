<script setup lang="ts">
const props = defineProps<{
  loading: boolean;
  sessionUser: unknown;
  isAdmin: boolean;
  auditLogs: Array<{
    id: number;
    actorName: string;
    action: string;
    targetType: string;
    targetId: string | null;
    createdAt: string;
  }>;
}>();

const logQuery = ref("");
const actionFilter = ref("all");
const targetFilter = ref("all");

const actionOptions = computed(() => ["all", ...new Set(props.auditLogs.map((log) => log.action))]);
const targetOptions = computed(() => ["all", ...new Set(props.auditLogs.map((log) => log.targetType))]);

const filteredLogs = computed(() => {
  const query = logQuery.value.trim().toLocaleLowerCase("pt-BR");

  return props.auditLogs.filter((log) => {
    const matchesQuery = !query || `${log.actorName} ${log.action} ${log.targetType} ${log.targetId ?? ""}`.toLocaleLowerCase("pt-BR").includes(query);
    const matchesAction = actionFilter.value === "all" || log.action === actionFilter.value;
    const matchesTarget = targetFilter.value === "all" || log.targetType === targetFilter.value;

    return matchesQuery && matchesAction && matchesTarget;
  });
});

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function formatAction(value: string) {
  return value.replaceAll("_", " ");
}
</script>

<template>
  <section class="surface-card audit-surface">
    <div class="surface-head compact-head">
      <div>
        <p class="eyebrow">Historico</p>
        <h3>Acoes recentes</h3>
      </div>
      <p class="surface-copy">O painel registra autenticacao, administracao de usuarios e operacoes do inventario.</p>
    </div>

    <p v-if="loading" class="surface-copy">Carregando historico...</p>
    <p v-else-if="!sessionUser" class="surface-copy">Entre no sistema para visualizar esta area.</p>
    <p v-else-if="!isAdmin" class="surface-copy">Somente administradores podem consultar o historico completo.</p>
    <template v-else>
      <div class="access-panel-summary">
        <span class="header-chip">{{ filteredLogs.length }} evento(s) no recorte</span>
        <span class="header-chip">{{ actionOptions.length - 1 }} acao(oes)</span>
        <span class="header-chip">{{ targetOptions.length - 1 }} alvo(s)</span>
      </div>

      <div class="audit-toolbar">
        <label class="field-block access-toolbar-search">
          <span>Buscar no historico</span>
          <input v-model="logQuery" type="search" placeholder="Usuario, acao, alvo..." />
        </label>

        <label class="field-block field-block-narrow inline-field-block">
          <span>Acao</span>
          <select v-model="actionFilter">
            <option v-for="action in actionOptions" :key="action" :value="action">
              {{ action === 'all' ? 'Todas' : formatAction(action) }}
            </option>
          </select>
        </label>

        <label class="field-block field-block-narrow inline-field-block">
          <span>Alvo</span>
          <select v-model="targetFilter">
            <option v-for="target in targetOptions" :key="target" :value="target">
              {{ target === 'all' ? 'Todos' : target }}
            </option>
          </select>
        </label>
      </div>

      <div class="audit-log-list">
        <article v-for="log in filteredLogs" :key="log.id" class="audit-log-card">
          <div class="audit-log-topline">
            <strong>{{ log.actorName }}</strong>
            <span class="status-tag is-active">{{ formatAction(log.action) }}</span>
          </div>
          <p class="surface-copy compact-copy">{{ log.targetType }}<span v-if="log.targetId"> #{{ log.targetId }}</span></p>
          <p class="surface-copy compact-copy">{{ formatDate(log.createdAt) }}</p>
        </article>
      </div>

      <p v-if="!filteredLogs.length" class="surface-copy empty-state-copy">
        Nenhum evento encontrado com o recorte atual.
      </p>
    </template>
  </section>
</template>
