# Plano de desenvolvimento

## Direcao tecnica definida

O projeto passa a considerar como stack-alvo:

- `Nuxt 4` para frontend e servidor da aplicacao
- `Prisma` como ORM e camada de acesso a dados
- `PostgreSQL` como banco principal
- `Docker` e `Docker Compose` para ambiente de desenvolvimento e testes locais

## Estado atual

Hoje o sistema ainda opera com:

- frontend em `HTML + CSS + JavaScript`
- backend em `Node.js` com servidor customizado
- persistencia em `SQLite`

Essa base continua valida durante a transicao, mas novas etapas devem priorizar a migracao para a stack-alvo.

## Plano revisado

### Fase 7 - Fundacao da nova stack

- criar estrutura inicial em `Nuxt 4`
- configurar `Prisma`
- modelar o schema inicial no `PostgreSQL`
- definir variaveis de ambiente
- criar containers para `app` e `postgres`

### Fase 8 - Migracao de dominio

- migrar estruturas de inventario para modelos Prisma
- migrar usuarios, perfis e auditoria
- mapear bases atuais para tabelas normalizadas
- definir estrategia de importacao do `inventory.json`

### Fase 9 - Migracao de interface

- reconstruir a interface atual em componentes `Nuxt`
- migrar tabela expansivel
- migrar painel de acessos
- manter a experiencia visual ja refinada no projeto atual

### Fase 10 - Persistencia e seguranca

- substituir rotas atuais por rotas server do Nuxt
- integrar autenticacao na nova stack
- portar historico de auditoria
- revisar permissoes de `admin` e `editor`

### Fase 11 - Operacao e deploy local

- validar fluxo completo via Docker
- executar migrations Prisma
- testar importacao de dados
- consolidar documentacao operacional

## Containers preparados nesta etapa

Arquivos adicionados:

- [docker-compose.dev.yml](c:\Projeto\docker-compose.dev.yml)
- [Dockerfile](c:\Projeto\docker\nuxt\Dockerfile)
- [.dockerignore](c:\Projeto\.dockerignore)

Objetivo desses arquivos:

- subir um `PostgreSQL` local para desenvolvimento
- preparar um container de aplicacao para a futura base `Nuxt 4`
- padronizar o ambiente para os proximos passos da migracao

## Observacao importante

Os containers ja foram preparados, mas a migracao completa para `Nuxt 4 + Prisma + PostgreSQL` ainda nao foi executada nesta etapa.

Isso significa:

- o ambiente Docker esta pronto para a proxima fase
- o projeto atual continua rodando na estrutura antiga
- a proxima entrega deve iniciar o scaffold real do Nuxt e do Prisma

## Andamento atual

O scaffold inicial da nova stack foi iniciado com:

- [nuxt.config.ts](c:\Projeto\nuxt.config.ts)
- [app.vue](c:\Projeto\app.vue)
- [index.vue](c:\Projeto\pages\index.vue)
- [main.css](c:\Projeto\assets\css\main.css)
- [status.get.ts](c:\Projeto\server\api\system\status.get.ts)
- [schema.prisma](c:\Projeto\prisma\schema.prisma)
- [.env.example](c:\Projeto\.env.example)

Validacoes realizadas:

- `npm install` executado com sucesso
- `npx prisma generate` executado com sucesso
- `npx nuxi prepare` executado com sucesso
- `docker compose config` validado com sucesso

Bloqueio atual:

- o container nao pode ser iniciado neste ambiente porque o Docker Desktop nao estava em execucao no momento do teste

