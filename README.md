# Web Inventory

Sistema web de inventario de equipamentos com interface de consulta, edicao, cadastro de registros e controle de acessos.

Stack-alvo de evolucao: Nuxt 4 + Prisma + PostgreSQL + Docker.

## Visao geral

O projeto nasceu a partir da planilha `Inventário.xlsx` e hoje funciona como um sistema web local com:

- frontend em HTML, CSS e JavaScript
- servidor local em Node.js
- persistencia real em SQLite
- autenticacao com usuario e senha
- administracao de usuarios
- historico de acoes

## Estrutura principal

- [index.html](c:\Projeto\index.html): estrutura da interface
- [styles.css](c:\Projeto\styles.css): identidade visual e layout
- [app.js](c:\Projeto\app.js): comportamento do frontend
- [server.mjs](c:\Projeto\server.mjs): servidor HTTP e rotas da API
- [lib/inventory-db.mjs](c:\Projeto\lib\inventory-db.mjs): banco SQLite, regras de negocio e auditoria
- [data/inventory.json](c:\Projeto\data\inventory.json): carga inicial dos dados
- [data/inventory.db](c:\Projeto\data\inventory.db): banco de dados local
- [scripts/extract_inventory.py](c:\Projeto\scripts\extract_inventory.py): conversao da planilha para JSON
- [codex-skills.md](c:\Projeto\docs\codex-skills.md): manifesto local das skills instaladas no ambiente Codex
- [development-plan.md](c:\Projeto\docs\development-plan.md): plano revisado de migracao para a nova stack
- [docker-compose.yml](c:\Projeto\docker-compose.yml): ambiente Docker de desenvolvimento
- [Dockerfile](c:\Projeto\docker\nuxt\Dockerfile): imagem base da futura aplicacao Nuxt
- [schema.prisma](c:\Projeto\prisma\schema.prisma): schema inicial do PostgreSQL com Prisma
- [seed.mjs](c:\Projeto\prisma\seed.mjs): importacao inicial do legado para o novo banco
- [status.get.ts](c:\Projeto\server\api\system\status.get.ts): endpoint de validacao da nova stack`r`n- [auth.ts](c:\Projeto\server\utils\auth.ts): utilitarios de autenticacao e sessao`r`n- [login.post.ts](c:\Projeto\server\api\auth\login.post.ts): login da nova stack`r`n- [session.get.ts](c:\Projeto\server\api\auth\session.get.ts): sessao atual`r`n- [logout.post.ts](c:\Projeto\server\api\auth\logout.post.ts): encerramento de sessao`r`n- [index.get.ts](c:\Projeto\server\api\users\index.get.ts): listagem protegida de usuarios`r`n- [overview.get.ts](c:\Projeto\server\api\inventory\overview.get.ts): visao geral das bases do inventario`r`n- [[name].get.ts](c:\Projeto\server\api\inventory\datasets\[name].get.ts): leitura de registros por base

## Stack alvo e migracao

O projeto atual ainda funciona na base antiga, mas o plano de desenvolvimento foi revisado para a seguinte stack:

- `Nuxt 4`
- `Prisma`
- `PostgreSQL`
- `Docker`

O detalhamento da migracao esta em [development-plan.md](c:\Projeto\docs\development-plan.md).

## Containers de desenvolvimento

Arquivos criados nesta etapa:

- [docker-compose.yml](c:\Projeto\docker-compose.yml)
- [Dockerfile](c:\Projeto\docker\nuxt\Dockerfile)
- [.dockerignore](c:\Projeto\.dockerignore)

### Subir os containers

```powershell
docker compose up -d
```

### Derrubar os containers

```powershell
docker compose down
```

### Ver logs

```powershell
docker compose logs -f
```

### O que sobe hoje

- container `postgres` pronto para desenvolvimento com `PostgreSQL 16`
- container `app` rodando `Nuxt 4` com `Prisma`

Observacao importante:

- nesta etapa os containers foram preparados e documentados
- a aplicacao atual ainda nao foi migrada integralmente para `Nuxt 4 + Prisma + PostgreSQL`
- o proximo passo tecnico e iniciar o scaffold real da nova aplicacao
- para testar os containers localmente, o Docker Desktop precisa estar em execucao

## Validacao da nova stack

Etapas ja concluidas:

- primeira migration do Prisma aplicada no PostgreSQL
- seed inicial executado com sucesso
- importacao de `5` bases e `474` registros
- usuario inicial criado no banco novo
- endpoint [status.get.ts](c:\Projeto\server\api\system\status.get.ts) validado com conexao real ao PostgreSQL`r`n- login, sessao e listagem de usuarios validados na nova stack`r`n- visao geral e leitura de bases do inventario validadas na nova stack

Resposta validada do endpoint:

- `datasets: 5`
- `users: 1`
- `records: 474`

## Nova estrutura inicial da stack

Arquivos da nova base criados nesta etapa:

- [nuxt.config.ts](c:\Projeto\nuxt.config.ts)
- [app.vue](c:\Projeto\app.vue)
- [index.vue](c:\Projeto\pages\index.vue)
- [main.css](c:\Projeto\assets\css\main.css)
- [status.get.ts](c:\Projeto\server\api\system\status.get.ts)
- [schema.prisma](c:\Projeto\prisma\schema.prisma)
- [.env.example](c:\Projeto\.env.example)

Scripts principais agora disponiveis em [package.json](c:\Projeto\package.json):

- `npm run dev`
- `npm run build`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:studio`
- `npm run db:seed`
- `npm run legacy:start`

## Versao legada preservada

Os arquivos antigos foram isolados em [legacy](c:\Projeto\legacy) para evitar conflito com o Nuxt.

Principais arquivos preservados:

- [server.mjs](c:\Projeto\legacy\server.mjs)
- [index.html](c:\Projeto\legacy\index.html)
- [app.js](c:\Projeto\legacy\app.js)
- [styles.css](c:\Projeto\legacy\styles.css)

## Como executar

1. Atualize a carga inicial se necessario:

```powershell
python .\scripts\extract_inventory.py "C:\Users\WebGlobal\Downloads\INVENT~1.XLS" ".\data\inventory.json"
```

2. Inicie o servidor:

```powershell
cmd /c npm start
```

3. Abra:

```text
http://localhost:3000
```

Na primeira execucao, o sistema cria automaticamente o banco `data/inventory.db` com base em `data/inventory.json`.

## Login inicial

- usuario: `admin`
- senha: `admin123`

## Funcionalidades atuais

### Inventario

- painel com contadores principais
- busca por qualquer campo textual
- seletor de base ativa
- cadastro de novos registros
- edicao direta dos campos
- exclusao de registros
- criacao de novos campos pela interface
- salvamento real no banco SQLite

### Tabela expansivel por base

As bases abaixo foram configuradas para exibicao em secoes expansivas:

- `Notebooks`: identificacao por `hostname`
- `DT Notebooks`: identificacao por `hostname`
- `Colaboradores`: identificacao por `alocadoPara + nome`
- `Monitores`: identificacao por `local`
- `Monitores HO`: identificacao por `alocado`

### Acessos e administracao

- login por usuario e senha
- sessao autenticada por cookie
- troca de senha do usuario logado
- cadastro de usuarios
- perfis `admin` e `editor`
- redefinicao de senha por administrador
- bloqueio e desbloqueio de usuarios
- lista de usuarios com ultimo acesso

### Auditoria

O historico registra eventos como:

- criacao, edicao e exclusao de registros
- criacao de campos
- criacao de usuarios
- bloqueio e desbloqueio de usuarios
- troca e redefinicao de senha
- login com sucesso
- tentativa de login invalida
- logout

## Regras e ajustes aplicados no projeto

- a base `WebAr` foi removida dos dados e da importacao
- alguns campos foram ocultados da interface para simplificar o uso
- o campo tecnico `id` nao aparece na tela
- o sistema foi reorganizado para separar `Inventario` e `Acessos`
- o cabecalho e o layout foram refinados varias vezes para melhorar a leitura

## Campos ocultos hoje na interface

Atualmente estes campos nao sao mostrados na tabela nem no formulario:

- `id`
- `ram`
- `notaFiscal`
- `campo1774361537972`
- `campo1774361604201`
- `headset`
- `teclado`
- `mouse`
- `suporte`
- `smartphone`

## APIs locais

Rotas principais:

- `GET /api/inventory`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `POST /api/auth/change-password`
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id`
- `POST /api/users/:id/reset-password`
- `GET /api/audit-logs`
- `POST /api/datasets/:dataset/records`
- `PATCH /api/datasets/:dataset/records/:recordId`
- `DELETE /api/datasets/:dataset/records/:recordId`
- `POST /api/datasets/:dataset/fields`

## Integracao com skills do Codex

As skills instaladas no ambiente do usuario foram registradas localmente em [codex-skills.md](c:\Projeto\docs\codex-skills.md).

Observacao:

- elas continuam hospedadas em `C:\Users\WebGlobal\.codex\skills`
- esta integracao e documental, para que o projeto saiba quais capacidades o ambiente do Codex ja possui
- se necessario, podemos evoluir isso depois para uma pagina interna ou um manifesto JSON

## Registro de implementacoes

### Fase 1 - Base inicial

- leitura da planilha e conversao para JSON
- tela inicial de inventario
- listagem de bases
- busca e resumo de dados

### Fase 2 - Edicao local

- tabela editavel no navegador
- formulario de novo registro
- criacao de novos campos
- armazenamento local temporario

### Fase 3 - Persistencia real

- migracao para Node.js
- servidor local com `npm start`
- banco SQLite
- API para leitura e escrita do inventario
- fim da dependencia de `localStorage` para o fluxo principal

### Fase 4 - Controle de acesso

- login com sessao
- usuario inicial `admin`
- area separada de acessos
- cadastro de usuarios
- perfis `admin` e `editor`
- troca de senha
- redefinicao de senha
- bloqueio e desbloqueio

### Fase 5 - Auditoria

- historico de acoes administrativas
- historico operacional do inventario
- rastreio de login, logout e falhas de autenticacao
- exibicao de ultimo acesso na lista de usuarios

### Fase 6 - Refinos de uso

- reorganizacao do cabecalho
- separacao visual entre inventario e acessos
- ajustes de espacamento e leitura
- tabela expansivel por base com identificacao principal

### Fase 7 - Inicio da migracao para a nova stack

- scaffold inicial em `Nuxt 4`
- configuracao base do `Prisma`
- schema inicial para `PostgreSQL`
- compose Docker de desenvolvimento
- rota inicial de status em server API do Nuxt`r`n- autenticacao inicial no Nuxt`r`n- listagem de usuarios protegida para admin`r`n- leitura inicial de datasets e registros no Nuxt
- preservacao da versao antiga via `npm run legacy:start`
- primeira migration aplicada
- seed inicial executado no PostgreSQL
- conexao real validada pelo endpoint de status

## Registro continuo

A partir deste ponto, novas entregas devem ser registradas nesta documentacao.

Formato recomendado para os proximos registros:

### Data ou etapa

- o que foi alterado
- quais arquivos principais foram mexidos
- impacto para o usuario
- observacoes importantes

## Proximos passos sugeridos

- iniciar scaffold real em `Nuxt 4`
- configurar `Prisma` com o schema inicial
- substituir `SQLite` por `PostgreSQL`
- migrar usuarios, auditoria e inventario para a nova base
- reconstruir a interface atual na nova stack




## Atualizacao continua

### 2026-03-24 - Painel e resumo no Nuxt

Etapas concluidas nesta fase:

- criacao da rota [summary.get.ts](c:\Projeto\server\api\inventory\summary.get.ts) para resumir as bases diretamente do PostgreSQL
- home do Nuxt atualizada em [index.vue](c:\Projeto\pages\index.vue) com cards principais de inventario
- integracao da busca e da selecao de base ao cabecalho da tabela ativa
- ajuste do texto da sessao para remover artefato de codificacao
- refinamento visual complementar em [main.css](c:\Projeto\assets\css\main.css)

Resumo novo exibido na interface:

- `Colaboradores`
- `Notebooks`
- `Monitores` somando `Monitores` e `Monitores HO`
- `Com notebook`

### 2026-03-25 - Cadastro e edicao inicial no Nuxt

Etapas concluidas nesta fase:

- criacao da rota [records.post.ts](c:\Projeto\server\api\inventory\datasets\[name]\records.post.ts) para cadastrar novos registros na base ativa
- criacao da rota [[recordId].patch.ts](c:\Projeto\server\api\inventory\datasets\[name]\records\[recordId].patch.ts) para editar campos diretamente na tabela
- formulario de novo registro integrado na home do Nuxt em [index.vue](c:\Projeto\pages\index.vue)
- edicao inline dos campos da tabela com salvamento direto no PostgreSQL
- feedback visual de sucesso e erro em [main.css](c:\Projeto\assets\css\main.css)

Fluxo novo disponivel:

- criar novo registro na base ativa
- editar campos da tabela pela interface
- atualizar resumo e listagem apos salvar

### 2026-03-25 - Exclusao e campos personalizados no Nuxt

Etapas concluidas nesta fase:

- criacao da rota [[recordId].delete.ts](c:\Projeto\server\api\inventory\datasets\[name]\records\[recordId].delete.ts) para excluir registros na base ativa
- criacao da rota [fields.post.ts](c:\Projeto\server\api\inventory\datasets\[name]\fields.post.ts) para criar novos campos no PostgreSQL
- formulario de criacao de campo adicionado na home do Nuxt em [index.vue](c:\Projeto\pages\index.vue)
- coluna de acoes com exclusao integrada na tabela do Nuxt
- novos estilos de edicao e acoes em [main.css](c:\Projeto\assets\css\main.css)

Fluxo novo disponivel:

- excluir registro pela tabela
- criar campo personalizado na base ativa
- refletir novo campo no formulario e na tabela apos salvar

### 2026-03-25 - Tabela expansivel no Nuxt

Etapas concluidas nesta fase:

- port da exibicao expansivel para [index.vue](c:\Projeto\pages\index.vue)
- configuracao de identificadores por base reaplicada no Nuxt
- manutencao de edicao e exclusao dentro do formato expansivel
- estilos novos para cards expansivos em [main.css](c:\Projeto\assets\css\main.css)

Bases com identificacao expansivel no Nuxt:

- `Notebooks`: `hostname`
- `DT Notebooks`: `hostname`
- `Colaboradores`: `alocadoPara + nome`
- `Monitores`: `local`
- `Monitores HO`: `alocado`

### 2026-03-25 - Separacao em paginas do Nuxt

Etapas concluidas nesta fase:

- criacao do composable [useWebInventory.ts](c:\Projeto\composables\useWebInventory.ts) para compartilhar sessao, status e inventario
- criacao da pagina [inventario.vue](c:\Projeto\pages\inventario.vue) com a area principal de bases e registros
- criacao da pagina [acessos.vue](c:\Projeto\pages\acessos.vue) para sessao e usuarios
- ajuste do [app.vue](c:\Projeto\app.vue) com navegacao principal entre paginas
- [index.vue](c:\Projeto\pages\index.vue) agora redireciona para `/inventario`

Resultado:

- `Inventario` e `Acessos` deixam de disputar a mesma tela
- a aplicacao passa a ter navegacao real no Nuxt
- a base para componentizacao futura fica mais limpa

### 2026-03-25 - Redesign geral da interface Nuxt

Etapas concluidas nesta fase:

- redesign completo do layout em [app.vue](c:\Projeto\app.vue), [inventario.vue](c:\Projeto\pages\inventario.vue) e [acessos.vue](c:\Projeto\pages\acessos.vue)
- nova navegacao lateral com foco em uso continuo e leitura pratica
- nova paleta visual em tons frios de verde e cinza claro para melhor contraste e menos cansaco visual
- reorganizacao da pagina de inventario em blocos mais claros para busca, cadastro, estrutura e tabela
- reorganizacao da pagina de acessos com sessao e usuarios em cards separados
- substituicao da folha de estilos em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- visual mais limpo e mais administrativo
- melhor separacao entre navegacao, operacao e leitura dos dados
- uso mais confortavel em consultas longas e manutencao diaria

### 2026-03-25 - Componentizacao inicial da interface

Etapas concluidas nesta fase:

- criacao de [AppSidebar.vue](c:\Projeto\components\AppSidebar.vue) para a navegacao lateral
- criacao de [UiHeroSection.vue](c:\Projeto\components\UiHeroSection.vue) para os heroes das paginas
- criacao de [AuthLoginCard.vue](c:\Projeto\components\AuthLoginCard.vue) para o formulario de login reutilizavel
- criacao de [InventoryWorkspace.vue](c:\Projeto\components\InventoryWorkspace.vue) para controle de base, novo registro e novo campo
- criacao de [InventoryRecordsPanel.vue](c:\Projeto\components\InventoryRecordsPanel.vue) para cards de bases e tabela/lista de registros
- paginas [inventario.vue](c:\Projeto\pages\inventario.vue), [acessos.vue](c:\Projeto\pages\acessos.vue) e [app.vue](c:\Projeto\app.vue) simplificadas para orquestrar os componentes

Resultado:

- menos duplicacao de layout
- paginas menores e mais legiveis
- base melhor para continuar refinando design e comportamento

### 2026-03-25 - Ajuste de estabilidade apos componentizacao

Etapas concluidas nesta fase:

- correcao da estrutura do componente [InventoryRecordsPanel.vue](c:\Projeto\components\InventoryRecordsPanel.vue) para manter raiz valida no Vue
- revisao da integracao entre [inventario.vue](c:\Projeto\pages\inventario.vue) e os componentes reutilizaveis criados na fase anterior
- nova validacao das rotas principais no ambiente Docker

Resultado:

- pagina /inventario volta a responder corretamente
- componentizacao permanece ativa sem quebrar a navegacao
- documentacao continua refletindo cada ajuste realizado


### 2026-03-25 - Componentizacao complementar de inventario e acessos

Etapas concluidas nesta fase:

- criacao de [InventoryDatasetOverview.vue](c:\Projeto\components\InventoryDatasetOverview.vue) para o panorama das bases
- criacao de [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue) para concentrar o comportamento da tabela e da lista expansivel
- criacao de [InventoryRecordAccordionItem.vue](c:\Projeto\components\InventoryRecordAccordionItem.vue) para cada registro expansivel
- criacao de [AccessSessionPanel.vue](c:\Projeto\components\AccessSessionPanel.vue) para resumir a sessao ativa
- criacao de [AccessUsersPanel.vue](c:\Projeto\components\AccessUsersPanel.vue) para a listagem de usuarios
- reorganizacao de [InventoryRecordsPanel.vue](c:\Projeto\components\InventoryRecordsPanel.vue) e [acessos.vue](c:\Projeto\pages\acessos.vue) para usar os novos componentes

Resultado:

- paginas mais curtas e mais faceis de manter
- separacao mais clara entre visualizacao, interacao e listagem
- base melhor para os proximos ajustes de design e regras de acesso


### 2026-03-25 - Administracao de acessos na nova stack

Etapas concluidas nesta fase:

- criacao da rota [change-password.post.ts](c:\Projeto\server\api\auth\change-password.post.ts) para troca da propria senha
- criacao das rotas [index.post.ts](c:\Projeto\server\api\users\index.post.ts), [[id].patch.ts](c:\Projeto\server\api\users\[id].patch.ts) e [reset-password.post.ts](c:\Projeto\server\api\users\[id]\reset-password.post.ts) para cadastro, bloqueio e redefinicao de senha
- criacao da rota [index.get.ts](c:\Projeto\server\api\audit-logs\index.get.ts) para leitura de auditoria
- adicao do utilitario [audit.ts](c:\Projeto\server\utils\audit.ts) e ampliacao de [auth.ts](c:\Projeto\server\utils\auth.ts) com hash e verificacao de senha
- ampliacao de [useWebInventory.ts](c:\Projeto\composables\useWebInventory.ts) com estado e acoes de usuarios, senha e historico
- criacao dos componentes [AccessAdminPanel.vue](c:\Projeto\components\AccessAdminPanel.vue) e [AuditLogPanel.vue](c:\Projeto\components\AuditLogPanel.vue)
- evolucao de [AccessUsersPanel.vue](c:\Projeto\components\AccessUsersPanel.vue) e [acessos.vue](c:\Projeto\pages\acessos.vue) para suportar cadastro, perfil, bloqueio, redefinicao e historico

Resultado:

- area de acessos agora permite trocar a propria senha
- administradores podem cadastrar usuarios, alterar perfil, bloquear e redefinir senha
- o historico recente aparece na interface nova
- login e logout passam a registrar eventos de auditoria no PostgreSQL

Validacao real:

- /acessos respondeu 200`r
- login admin validado na API
- cadastro, bloqueio e redefinicao de senha validados na API
- leitura de historico validada com aumento de 13 para 16 eventos

Observacao:

- a validacao criou o usuario 	estenux092639, que permaneceu bloqueado no banco para nao ficar ativo por engano


### 2026-03-25 - Simplificacao do topo do inventario

Etapas concluidas nesta fase:

- remocao dos cards de resumo Colaboradores, Notebooks, Monitores e Com notebook do hero em [inventario.vue](c:\Projeto\pages\inventario.vue)
- manutencao apenas do bloco principal com titulo, descricao e chips de status

Resultado:

- topo do inventario fica mais limpo e menos carregado
- a leitura inicial da pagina passa a priorizar a operacao da base ativa


### 2026-03-25 - Remocao definitiva dos cards do hero

Etapas concluidas nesta fase:

- simplificacao de [UiHeroSection.vue](c:\Projeto\components\UiHeroSection.vue) para remover a renderizacao de cards de resumo no topo
- manutencao apenas do titulo, descricao e chips no hero das paginas

Resultado:

- os cards Colaboradores, Notebooks, Monitores e Com notebook deixam de aparecer no topo do inventario


### 2026-03-25 - Redefinicao para layout mais horizontal

Etapas concluidas nesta fase:

- substituicao da antiga navegacao lateral por um cabecalho horizontal em [AppSidebar.vue](c:\Projeto\components\AppSidebar.vue)
- ampliacao da largura util da interface em [main.css](c:\Projeto\assets\css\main.css)
- reorganizacao visual da marca, navegacao e sessao em uma faixa superior continua

Resultado:

- o sistema fica mais horizontal e aproveita melhor a largura da tela
- a navegacao principal deixa de competir com a area de trabalho em formato de coluna lateral


### 2026-03-25 - Refino horizontal da area de trabalho

Etapas concluidas nesta fase:

- ampliacao adicional da largura util em [main.css](c:\Projeto\assets\css\main.css)
- transformacao do panorama das bases em faixa horizontal rolavel
- reorganizacao da busca, base, cadastro e estrutura para aproveitar mais colunas na mesma linha
- ajuste da tabela para leitura mais compacta e proxima de planilha

Resultado:

- o inventario fica visualmente mais horizontal e menos empilhado
- mais informacao aparece ao mesmo tempo na largura da tela
- a tabela ganha destaque como area principal de trabalho


### 2026-03-25 - Topo mais compacto e operacao em abas

Etapas concluidas nesta fase:

- reducao da altura visual do hero e dos cards de superficie em [main.css](c:\Projeto\assets\css\main.css)
- unificacao de Novo registro e Estrutura em um unico card com abas horizontais em [InventoryWorkspace.vue](c:\Projeto\components\InventoryWorkspace.vue)
- reorganizacao da area de estrutura para um formulario inline mais curto

Resultado:

- a parte superior ocupa menos altura
- a tabela ganha mais espaco util
- o fluxo de operacao fica mais limpo e menos fragmentado


### 2026-03-25 - Reorganizacao total para fluxo horizontal

Etapas concluidas nesta fase:

- reorganizacao de [inventario.vue](c:\Projeto\pages\inventario.vue) em duas colunas principais: operacao e dados
- reorganizacao de [InventoryRecordsPanel.vue](c:\Projeto\components\InventoryRecordsPanel.vue) com fita lateral de bases e area principal de registros
- reorganizacao de [acessos.vue](c:\Projeto\pages\acessos.vue) em colunas paralelas para sessao/administracao e usuarios/historico
- ajustes de [main.css](c:\Projeto\assets\css\main.css) para tornar o sistema prioritariamente horizontal

Resultado:

- o layout deixa de depender de pilhas verticais longas
- operacao e leitura passam a acontecer lado a lado
- a tabela e os dados ficam como foco principal da largura da tela


### 2026-03-25 - Integracao de base ativa com tabela

Etapas concluidas nesta fase:

- remocao do card separado de Base ativa em [InventoryWorkspace.vue](c:\Projeto\components\InventoryWorkspace.vue)
- incorporacao da busca e do seletor de base ao cabecalho da tabela em [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue)
- atualizacao de [InventoryRecordsPanel.vue](c:\Projeto\components\InventoryRecordsPanel.vue) e [inventario.vue](c:\Projeto\pages\inventario.vue) para o novo fluxo

Resultado:

- base ativa e tabela editavel passam a funcionar como uma unica area de trabalho
- a navegacao da base fica mais direta e contextual


### 2026-03-25 - Ajuste de hot reload no Docker

Etapas concluidas nesta fase:

- ativacao de CHOKIDAR_USEPOLLING=true e CHOKIDAR_INTERVAL=250 em [docker-compose.yml](c:\Projeto\docker-compose.yml)
- configuracao de usePolling: true no Vite em [nuxt.config.ts](c:\Projeto\nuxt.config.ts)
- reinicio do container pp para aplicar a nova estrategia de file watching

Resultado:

- o ambiente fica mais preparado para refletir alteracoes em tempo real no Docker Desktop no Windows


### 2026-03-25 - Troca da paleta para azul

Etapas concluidas nesta fase:

- atualizacao das variaveis e gradientes principais em [main.css](c:\Projeto\assets\css\main.css) para uma identidade azul
- ajuste dos estados ativos, chips, destaques e fundos suaves para acompanhar a nova paleta

Resultado:

- o design deixa de usar verde como cor principal
- a interface passa a ter uma leitura mais fria e azulada, mantendo o mesmo layout


### 2026-03-25 - Conversao dos blocos superiores para faixa horizontal

Etapas concluidas nesta fase:

- reorganizacao de [inventario.vue](c:\Projeto\pages\inventario.vue) para uma faixa superior com Operacao e Panorama das bases lado a lado
- simplificacao do fluxo para deixar a tabela como bloco principal logo abaixo
- ajuste de [main.css](c:\Projeto\assets\css\main.css) para sustentar essa distribuicao horizontal

Resultado:

- os blocos antes estreitos e verticais passam a trabalhar horizontalmente
- a area principal fica mais equilibrada e menos empilhada


### 2026-03-25 - Conversao horizontal do panorama das bases

Etapas concluidas nesta fase:

- ajuste de [main.css](c:\Projeto\assets\css\main.css) para distribuir os cards do Panorama das bases em linha horizontal
- ampliacao da faixa superior para comportar melhor Operacao e Panorama das bases lado a lado

Resultado:

- o bloco Panorama das bases deixa de ficar em coluna estendida
- os cards passam a ser lidos horizontalmente



### 2026-03-25 - Centralizacao visual do panorama das bases

Etapas concluidas nesta fase:

- ajuste de [main.css](c:\Projetossets\css\main.css) para limitar a largura util do bloco Panorama das bases
- redefinicao da grade interna para cards mais compactos e alinhados ao centro

Resultado:

- o panorama deixa de parecer esticado para um lado
- os cards ficam mais centralizados dentro da faixa superior


### 2026-03-25 - Panorama reposicionado entre operacao e base ativa

Etapas concluidas nesta fase:

- reorganizacao de [inventario.vue](c:\Projeto\pages\inventario.vue) para posicionar o Panorama das bases abaixo de Operacao e acima da Base ativa
- ajuste de [main.css](c:\Projetossets\css\main.css) para estender o panorama na largura e centralizar os cards

Resultado:

- a leitura da pagina segue uma ordem mais natural: operacao, panorama e tabela
- os blocos do panorama ficam mais largos e centralizados na faixa horizontal


### 2026-03-25 - Centralizacao e harmonizacao geral da pagina

Etapas concluidas nesta fase:

- ajuste de [main.css](c:\Projetossets\css\main.css) para aplicar larguras consistentes e centralizadas aos blocos principais do inventario
- alinhamento visual do hero, operacao, panorama, feedback e base ativa na mesma faixa util de leitura

Resultado:

- a pagina fica mais harmonizada e menos deslocada lateralmente
- os blocos principais passam a seguir um eixo central mais consistente


### 2026-03-25 - Alinhamento da largura de operacao com o hero do inventario

Etapas concluidas nesta fase:

- ajuste de [main.css](c:\Projetossets\css\main.css) para ampliar a largura da area de Operacao
- alinhamento do card de Operacao com a mesma referencia horizontal do bloco principal de Inventario

Resultado:

- Operacao e Inventario passam a ocupar a mesma faixa visual
- a leitura da pagina fica mais reta e consistente


### 2026-03-26 - Expansao horizontal do bloco de operacao

Etapas concluidas nesta fase:

- ajuste de [main.css](c:\Projetossets\css\main.css) para remover a limitacao de largura do bloco de Operacao
- ampliacao da area de Operacao para preencher melhor a largura util da pagina

Resultado:

- o bloco de Operacao avanca mais para a direita
- a pagina fica com menos vazio lateral na area superior de trabalho


### 2026-03-26 - Operacao estendida por toda a largura util

Etapas concluidas nesta fase:

- ajuste de [main.css](c:\Projetossets\css\main.css) para remover o limite compartilhado de largura do bloco de Operacao
- manutencao dos demais blocos centralizados, com Operacao liberada para ocupar toda a faixa util da pagina

Resultado:

- o card de Operacao se estende por toda a pagina util
- o topo de trabalho fica mais amplo e com menos area vazia lateral


### 2026-03-26 - Padronizacao da largura total dos blocos principais

Etapas concluidas nesta fase:

- ajuste de [main.css](c:\Projetossets\css\main.css) para estender Panorama das bases e Base ativa por toda a largura util
- unificacao da largura de Operacao, Panorama e Base ativa no mesmo eixo horizontal da pagina

Resultado:

- os blocos principais passam a preencher a pagina de forma uniforme
- a composicao fica mais reta, ampla e consistente visualmente


### 2026-03-26 - Reducao da altura visual dos cards principais

Etapas concluidas nesta fase:

- ajuste de [main.css](c:\Projetossets\css\main.css) para reduzir padding e espacamento dos cards
- compactacao de campos, botoes e secoes expansivas para um fluxo mais horizontal

Resultado:

- a pagina fica menos alta e mais pratica para leitura lateral
- mais conteudo aparece ao mesmo tempo sem perder organizacao


### 2026-03-26 - Expansao for?ada do card de operacao no grid

Etapas concluidas nesta fase:

- ajuste de [main.css](c:\Projetossets\css\main.css) para forcar o estiramento do bloco de Operacao dentro do grid
- aplicacao de largura total e `justify-self: stretch` ao card e seus contenedores internos

Resultado:

- o card de Operacao acompanha melhor a largura total da pagina
- o comportamento fica menos dependente do tamanho do conteudo interno


### 2026-03-26 - Forcagem adicional de largura no bloco de operacao

Etapas concluidas nesta fase:

- ajuste de [main.css](c:\Projetossets\css\main.css) com regras mais fortes para expandir o bloco de Operacao
- aplicacao de largura total com prioridade maior no stack, grid e card interno da area operacional

Resultado:

- o bloco de Operacao passa a ter uma forcagem explicita para preencher toda a faixa horizontal disponivel
- o layout fica menos sujeito a restricoes residuais do grid


### 2026-03-26 - Simplificacao estrutural do bloco de operacao

Etapas concluidas nesta fase:

- ajuste de [InventoryWorkspace.vue](c:\Projeto\components\InventoryWorkspace.vue) para substituir a grade generica por um contenedor proprio da area de Operacao
- atualizacao de [main.css](c:\Projetossets\css\main.css) para acompanhar o novo contenedor e liberar melhor a largura do card
- alteracao da grade do formulario para `auto-fit`, aproveitando melhor o espaco horizontal

Resultado:

- o bloco de Operacao fica menos preso a regras antigas de grid
- a largura passa a responder melhor ao espaco util da pagina
- os campos internos se distribuem de forma mais flexivel na linha


### 2026-03-26 - Padronizacao estrutural de panorama e base ativa

Etapas concluidas nesta fase:

- ajuste de [InventoryDatasetOverview.vue](c:\Projeto\components\InventoryDatasetOverview.vue) para usar um contenedor proprio da area de Panorama
- ajuste de [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue) para usar um contenedor proprio da area de Base ativa
- atualizacao de [main.css](c:\Projetossets\css\main.css) para alinhar os tres blocos principais com a mesma logica estrutural de largura

Resultado:

- Operacao, Panorama e Base ativa passam a responder de forma mais uniforme
- a pagina fica com comportamento de largura mais previsivel e consistente


### 2026-03-26 - Remocao do limite visual de 20 itens por base

Etapas concluidas nesta fase:

- ajuste de [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue) para remover o corte artificial de 20 registros
- aplicacao da listagem completa tanto no modo expansivel quanto na tabela comum

Resultado:

- ao selecionar uma base, todos os itens passam a ser exibidos
- a interface deixa de esconder registros por limite de renderizacao


### 2026-03-26 - Ordenacao natural por identificacao nas bases

Etapas concluidas nesta fase:

- ajuste de [useWebInventory.ts](c:\Projeto\composables\useWebInventory.ts) para ordenar os registros por identificacao com `Intl.Collator`
- aplicacao de ordenacao alfabetica e numerica natural nas listas expansivas e na tabela comum

Resultado:

- os registros passam a aparecer em ordem mais intuitiva
- valores como `Item 2` ficam antes de `Item 10`, sem quebrar a ordem alfabetica


### 2026-03-26 - Usabilidade da tabela com ordenacao e paginacao

Etapas concluidas nesta fase:

- evolucao de [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue) com ordenacao, pagina??o e resumo de exibicao
- adicao de controles de ordenacao por campo, ordem crescente/decrescente e quantidade por pagina
- adicao de ordenacao clicavel nos cabecalhos da tabela comum
- ajuste visual dos novos controles em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- a navegacao por bases grandes fica mais pratica
- a tabela passa a ser navegavel sem listar tudo de uma vez na tela
- a ordenacao pode ser trocada de forma mais rapida no uso diario


### 2026-03-26 - Filtros por coluna na base ativa

Etapas concluidas nesta fase:

- evolucao de [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue) com filtros por coluna integrados a busca geral, ordenacao e paginacao
- inclusao de filtro por identificacao nas bases expansivas
- adicao de acao para limpar os filtros ativos
- ajuste visual da nova faixa de filtros em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- a base ativa pode ser refinada por campos especificos sem depender apenas da busca geral
- a navegacao em conjuntos grandes fica mais precisa e pratica no uso diario


### 2026-03-26 - Exportacao CSV da base ativa

Etapas concluidas nesta fase:

- evolucao de [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue) com exportacao da visualizacao atual para CSV
- exportacao considerando a base ativa com filtros e ordenacao aplicados
- ajuste do indicador visual de ordenacao para um formato textual mais estavel
- refinamento visual do botao e dos indicadores em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- a base ativa pode ser exportada rapidamente para CSV direto pela interface
- o arquivo gerado respeita o estado atual da listagem, incluindo filtros e ordenacao


### 2026-03-26 - Congelamento do cabecalho e da primeira coluna

Etapas concluidas nesta fase:

- ajuste de [main.css](c:\Projeto\assets\css\main.css) para manter o cabecalho da tabela fixo na rolagem vertical
- congelamento da primeira coluna de acoes durante a rolagem horizontal
- adaptacao da tabela para `border-collapse: separate` e controle de camadas com `z-index`

Resultado:

- a leitura de bases largas fica mais pratica
- os controles de acao permanecem visiveis mesmo com rolagem horizontal


### 2026-03-26 - Importacao de planilha pela interface

Etapas concluidas nesta fase:

- instalacao da dependencia `xlsx` em [package.json](c:\Projeto\package.json) para leitura de arquivos Excel
- criacao da rota [import.post.ts](c:\Projeto\server\api\inventory\datasets\[name]\import.post.ts) para importar `CSV`, `XLS` e `XLSX`
- evolucao de [useWebInventory.ts](c:\Projeto\composables\useWebInventory.ts) com o fluxo de upload e recarga automatica da base, resumo e auditoria
- evolucao de [inventario.vue](c:\Projeto\pages\inventario.vue) para conectar a importacao ao fluxo principal do inventario
- evolucao de [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue) com interface de upload e escolha de modo `Acrescentar` ou `Substituir`
- refinamento visual da faixa de importacao em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- a base ativa pode receber planilhas direto pela interface
- o sistema aceita importacao em modo seguro de acrescentar ou substituir registros
- campos novos presentes na planilha passam a ser adicionados automaticamente na base ativa


### 2026-03-26 - Filtros avancados por coluna

Etapas concluidas nesta fase:

- evolucao de [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue) com modos de filtro `Contem`, `Igual`, `Vazio` e `Preenchido`
- aplicacao dos filtros avancados tanto na tabela comum quanto nas bases expansivas
- manutencao da integracao com paginacao, ordenacao e exportacao CSV
- refinamento visual da nova grade de filtros em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- a base ativa pode ser analisada com filtros mais precisos por coluna
- campos vazios e preenchidos podem ser encontrados rapidamente sem depender de texto livre


### 2026-03-26 - Estabilizacao da tela de base ativa apos filtros avancados

Etapas concluidas nesta fase:

- correcao de [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue) para remover uma quebra de sintaxe no exportador CSV
- restauracao da renderizacao da pagina `/inventario` com os filtros avancados mantidos
- nova validacao da rota principal do inventario no ambiente Docker

Resultado:

- a tela da base ativa voltou a responder corretamente
- filtros avancados, importacao e exportacao CSV permanecem disponiveis sem derrubar a pagina


### 2026-03-26 - Exportacao Excel da base ativa

Etapas concluidas nesta fase:

- evolucao de [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue) com exportacao da visualizacao atual para `XLSX`
- reutilizacao da mesma base ativa, filtros e ordenacao ja aplicados na interface
- manutencao da exportacao `CSV` com geracao corrigida e nome de arquivo padronizado

Resultado:

- a base ativa agora pode ser baixada em `CSV` ou `Excel`
- o arquivo exportado respeita o estado atual da listagem, incluindo filtros e ordenacao


### 2026-03-26 - Preferencias da tabela por base

Etapas concluidas nesta fase:

- evolucao de [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue) com preferencias salvas por base no navegador
- adicao de controle para mostrar e ocultar colunas visiveis na tabela e nas listas expansivas
- persistencia de `colunas visiveis`, `ordenacao`, `direcao` e `quantidade por pagina`
- criacao de acao para restaurar o padrao da tabela
- refinamento visual da nova faixa de preferencias em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- cada base pode manter sua propria configuracao visual de colunas
- a pagina lembra as escolhas de exibicao e navegacao entre recargas
- a exportacao CSV e Excel passa a respeitar as colunas visiveis no momento


### 2026-03-26 - Pre-visualizacao e validacao antes da importacao

Etapas concluidas nesta fase:

- evolucao de [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue) com leitura local do arquivo antes do envio
- adicao de pre-visualizacao com colunas detectadas, amostra de linhas e total de registros
- validacao imediata de cabecalho vazio, planilha vazia, colunas duplicadas e linhas sem dados
- exibicao de colunas ja existentes, novos campos detectados e colunas ignoradas antes de importar
- refinamento visual da area de revisao em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- a importacao ficou mais segura e previsivel antes de gravar no banco
- o usuario consegue revisar a estrutura da planilha antes de confirmar o envio


### 2026-03-26 - Backup e restauracao do sistema

Etapas concluidas nesta fase:

- criacao das rotas [backup.get.ts](c:\Projeto\server\api\system\backup.get.ts) e [restore.post.ts](c:\Projeto\server\api\system\restore.post.ts) protegidas para administradores
- implementacao de backup logico em `JSON` contendo usuarios, bases, campos, registros, auditoria e metadados
- implementacao de restauracao completa com reposicao do conteudo e ajuste das sequencias do PostgreSQL
- evolucao de [useWebInventory.ts](c:\Projeto\composables\useWebInventory.ts) com exportacao, leitura de arquivo de restauracao e pre-visualizacao do backup
- evolucao de [AccessAdminPanel.vue](c:\Projeto\components\AccessAdminPanel.vue) e [acessos.vue](c:\Projeto\pages\acessos.vue) com a nova area administrativa de backup
- refinamento visual da area em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- administradores podem exportar um backup completo do sistema em `JSON`
- a restauracao agora pode ser feita pela interface com revisao do arquivo antes da confirmacao
- o sistema passa a ter um fluxo basico de protecao e recuperacao de dados para uso mais real


### 2026-03-26 - Preparacao para producao

Etapas concluidas nesta fase:

- evolucao de [nuxt.config.ts](c:\Projeto\nuxt.config.ts) com configuracoes de runtime para sessao, ambiente e nome publico da aplicacao
- evolucao de [auth.ts](c:\Projeto\server\utils\auth.ts) para usar nome de cookie, `sameSite`, `secure` e `maxAge` configuraveis por ambiente
- atualizacao de [Dockerfile](c:\Projeto\docker\nuxt\Dockerfile) para build em estagios e execucao em modo `production`
- criacao de [docker-compose.prod.yml](c:\Projeto\docker-compose.prod.yml) para subir `postgres` e `app` em modo de producao
- criacao de [.env.production.example](c:\Projeto\.env.production.example) e [.env.production](c:\Projeto\.env.production) com as variaveis necessarias para o ambiente produtivo
- validacao do compose de producao com `docker compose -f docker-compose.prod.yml config`

Resultado:

- o projeto agora tem uma base separada para desenvolvimento e producao
- cookies de sessao podem ser endurecidos para ambiente real
- o deploy em Docker fica mais previsivel e proximo de um cenario de uso externo

Observacao importante:

- o arquivo [.env.production](c:\Projeto\.env.production) foi criado com valores placeholder e precisa ter as credenciais trocadas antes de uso real


### 2026-03-26 - Sessao persistente no PostgreSQL

Etapas concluidas nesta fase:

- evolucao de [schema.prisma](c:\Projeto\prisma\schema.prisma) com a tabela `UserSession`
- evolucao de [auth.ts](c:\Projeto\server\utils\auth.ts) para criar, validar, expirar e destruir sessoes persistidas no banco
- ajuste de [login.post.ts](c:\Projeto\server\api\auth\login.post.ts) e [logout.post.ts](c:\Projeto\server\api\auth\logout.post.ts) para aguardar a escrita e remocao de sessao
- sincronizacao do schema no banco com `npx prisma generate` e `npx prisma db push` dentro do container da aplicacao

Resultado:

- o login deixa de depender de memoria do processo
- sessoes passam a sobreviver melhor a reinicios do app
- o sistema fica mais preparado para uso produtivo real


### 2026-03-26 - Melhoria da administracao de acessos

Etapas concluidas nesta fase:

- evolucao de [AccessUsersPanel.vue](c:\Projeto\components\AccessUsersPanel.vue) para remover o uso de `prompt` na redefinicao de senha
- adicao de formulario inline para nova senha diretamente na lista de usuarios
- adicao de busca e filtro por status na listagem de usuarios
- evolucao de [AuditLogPanel.vue](c:\Projeto\components\AuditLogPanel.vue) com busca, filtro por acao e filtro por alvo
- ajuste de [acessos.vue](c:\Projeto\pages\acessos.vue) para consumir o novo fluxo de redefinicao
- refinamento visual complementar em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- a administracao de usuarios fica mais profissional e menos dependente de dialogs do navegador
- o historico fica mais pratico para localizar eventos especificos
- a area de acessos ganha mais fluidez no uso diario


### 2026-03-26 - Refino final da tabela

Etapas concluidas nesta fase:

- evolucao de [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue) com ajustes de densidade e largura visual das colunas
- persistencia por base de `densidade` e `largura das colunas` junto das outras preferencias da tabela
- aplicacao dos ajustes tanto na tabela comum quanto na visualizacao expansivel
- refinamento visual complementar em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- a base ativa fica mais adaptavel a telas largas ou mais compactas
- a leitura e a edicao ganham mais conforto sem perder o estado salvo por base

### 2026-03-26 - Deploy real validado em Docker

Etapas concluidas nesta fase:

- ajuste de [Dockerfile](c:\Projeto\docker\nuxt\Dockerfile) para incluir [inventory.json](c:\Projeto\data\inventory.json) na imagem de producao
- validacao do compose de producao com `docker compose -f docker-compose.prod.yml config`
- build e subida real dos containers com `docker compose -f docker-compose.prod.yml up -d --build`
- inicializacao do banco de producao com `docker compose -f docker-compose.prod.yml exec app sh -lc "npx prisma db push"`
- carga inicial dos dados com `docker compose -f docker-compose.prod.yml exec app sh -lc "node prisma/seed.mjs"`
- validacao HTTP da aplicacao em `http://localhost:3001`

Resultado:

- ambiente de producao sobe com `postgres` e `app` separados do ambiente de desenvolvimento
- rota [status.get.ts](c:\Projeto\server\api\system\status.get.ts) passou a responder com `connected: true`
- banco de producao ficou carregado com `5` bases, `1` usuario e `474` registros
- pagina [/inventario](c:\Projeto\pages\inventario.vue) respondeu `200` na porta `3001`

Comandos principais de producao:

- subir: `docker compose -f docker-compose.prod.yml up -d --build`
- aplicar schema em banco novo: `docker compose -f docker-compose.prod.yml exec app sh -lc "npx prisma migrate deploy"`
- carregar dados iniciais: `docker compose -f docker-compose.prod.yml exec app sh -lc "node prisma/seed.mjs"`
- acompanhar status: `docker compose -f docker-compose.prod.yml ps`
- ver logs: `docker compose -f docker-compose.prod.yml logs -f app`
- acessar: `http://localhost:3001`


### 2026-03-26 - Migrations reais do Prisma

Etapas concluidas nesta fase:

- criacao da migration [20260326182000_add_user_sessions](c:\Projeto\prisma\migrations\20260326182000_add_user_sessions\migration.sql) para versionar a tabela `UserSession`
- validacao do diff entre o historico em [prisma\migrations](c:\Projeto\prisma\migrations) e o schema atual em [schema.prisma](c:\Projeto\prisma\schema.prisma)
- baseline do banco produtivo com `prisma migrate resolve --applied` para `20260324185302_init` e `20260326182000_add_user_sessions`
- validacao de `prisma migrate deploy` em um banco vazio temporario (`inventory_migrate_test`)
- rebuild da imagem de producao para incluir as migrations versionadas

Resultado:

- o projeto passa a ter historico de banco alinhado com o estado atual do schema
- o ambiente produtivo deixa de depender de `db push` como fluxo principal para bancos novos
- `prisma migrate deploy` aplicou com sucesso as `2` migrations em um banco vazio

Fluxo recomendado daqui para frente:

- banco novo: `docker compose -f docker-compose.prod.yml exec app sh -lc "npx prisma migrate deploy"`
- carga inicial opcional: `docker compose -f docker-compose.prod.yml exec app sh -lc "node prisma/seed.mjs"`
- bancos antigos que ja foram criados via `db push`: usar `prisma migrate resolve --applied` para baselinar antes de seguir com novas migrations

### 2026-03-27 - Endurecimento do ambiente de producao

Etapas concluidas nesta fase:

- evolucao de [nuxt.config.ts](c:\Projeto\nuxt.config.ts) com `SESSION_DOMAIN`, `STRICT_ENV_VALIDATION` e `STATUS_PUBLIC_DETAILS`
- endurecimento do cookie de sessao em [auth.ts](c:\Projeto\server\utils\auth.ts) com suporte a `domain` e reforco automatico de `secure` quando `sameSite=none`
- criacao do endpoint minimo [health.get.ts](c:\Projeto\server\api\system\health.get.ts) para healthcheck publico sem expor detalhes do banco
- evolucao de [status.get.ts](c:\Projeto\server\api\system\status.get.ts) para esconder `stats`, `meta` e erros detalhados em producao para usuarios nao administradores
- criacao do plugin [runtime-validation.ts](c:\Projeto\server\plugins\runtime-validation.ts) para alertar ou bloquear placeholders inseguros em producao
- endurecimento de [docker-compose.prod.yml](c:\Projeto\docker-compose.prod.yml) com `init: true`, `no-new-privileges` e healthcheck apontando para `/api/system/health`
- atualizacao de [.env.production.example](c:\Projeto\.env.production.example) com cookie `__Host-`, `SESSION_SAME_SITE=strict` e novas variaveis de validacao

Resultado:

- a aplicacao passa a expor um healthcheck publico mais seguro
- o endpoint de status fica mais discreto em producao para quem nao esta autenticado como admin
- o ambiente de producao ganha validacao explicita contra placeholders e configuracoes frageis
- o compose produtivo fica um pouco mais endurecido sem alterar o fluxo principal de deploy

### 2026-03-27 - Monitoramento basico

Etapas concluidas nesta fase:

- criacao do coletor em [monitoring.ts](c:\Projeto\server\utils\monitoring.ts) com contadores de requisicoes, erros, lentidao e uso de memoria
- criacao do plugin [request-monitoring.ts](c:\Projeto\server\plugins\request-monitoring.ts) para medir duracao de requests e registrar lentidao/erros no log do servidor
- criacao do endpoint protegido [metrics.get.ts](c:\Projeto\server\api\system\metrics.get.ts) para administradores consultarem metricas internas do processo
- atualizacao de [nuxt.config.ts](c:\Projeto\nuxt.config.ts) com `MONITORING_LOG_REQUESTS` e `MONITORING_SLOW_REQUEST_MS`
- atualizacao de [.env.example](c:\Projeto\.env.example) e [.env.production.example](c:\Projeto\.env.production.example) com defaults de monitoramento

Resultado:

- o sistema passa a medir volume de requisicoes, erros e requests lentas sem depender de servico externo
- administradores ganham uma rota protegida para inspecionar saude operacional do processo
- o servidor consegue registrar automaticamente requests lentas ou com erro nos logs de producao

### 2026-03-27 - Backup automatizado no host

Etapas concluidas nesta fase:

- criacao da pasta [backups](c:\Projeto\backups) para armazenar dumps e metadados fora do fluxo normal da aplicacao
- criacao do script [backup_prod.ps1](c:\Projeto\scripts\backup_prod.ps1) para gerar dump `pg_dump -Fc` do PostgreSQL de producao no host
- criacao do script [restore_prod.ps1](c:\Projeto\scripts\restore_prod.ps1) para restaurar um dump no banco produtivo com `pg_restore`
- criacao do script [cleanup_backups.ps1](c:\Projeto\scripts\cleanup_backups.ps1) para aplicar retencao por dias nos arquivos antigos
- atualizacao de [package.json](c:\Projeto\package.json) com os comandos `backup:prod`, `backup:restore` e `backup:cleanup`
- atualizacao de [\.gitignore](c:\Projeto\.gitignore) para ignorar dumps e metadados reais mantendo apenas [backups\.gitkeep](c:\Projeto\backups\.gitkeep)

Resultado:

- o projeto passa a ter uma rotina previsivel de backup fisico do banco em nivel de host
- o restore deixa de depender da interface e pode ser operado diretamente pelo terminal
- o cleanup permite manter uma retencao simples sem acumular arquivos antigos indefinidamente
- validacao real concluida com a criacao do dump `web-inventory-prod-20260327-091533.dump`

Comandos principais:

- criar backup: `npm run backup:prod`
- limpar backups antigos: `npm run backup:cleanup`
- restaurar backup: `powershell -ExecutionPolicy Bypass -File .\scripts\restore_prod.ps1 -BackupFile .\backups\NOME_DO_ARQUIVO.dump`

### 2026-03-27 - Polimento final de UX

Etapas concluidas nesta fase:

- evolucao de [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue) com faixa-resumo de uso, estados vazios mais claros e feedback visual melhor para o recorte atual da base
- evolucao de [AccessUsersPanel.vue](c:\Projeto\components\AccessUsersPanel.vue) com resumo do recorte atual de usuarios ativos e bloqueados
- evolucao de [AuditLogPanel.vue](c:\Projeto\components\AuditLogPanel.vue) com resumo do recorte atual do historico e estado vazio mais claro
- refinamento visual complementar em [main.css](c:\Projeto\assets\css\main.css) com toolbar fixa, hover states, faixas-resumo e leitura mais confortavel da tabela e dos cards

Resultado:

- a tabela ativa ficou mais orientada ao contexto atual de uso
- usuarios e historico passam a mostrar rapidamente o recorte visivel antes mesmo de ler os cards individualmente
- a leitura em inventario e acessos fica mais fluida para uso continuo e pesquisa diaria

### 2026-03-27 - Credenciais locais de producao rotacionadas

Etapas concluidas nesta fase:

- substituicao dos placeholders em [\.env.production](c:\Projeto\.env.production) por credencial forte local
- rotacao real da senha do usuario `inventory` no PostgreSQL de producao
- ativacao de `STRICT_ENV_VALIDATION=true` no ambiente produtivo local
- recriacao dos containers de producao para consumir as novas credenciais

Resultado:

- o ambiente local de producao deixa de usar `change-this-password`
- a validacao estrita de ambiente passa a bloquear configuracoes inseguras na subida
- a aplicacao continuou saudavel apos a rotacao, com `health` respondendo `ok: true`

Observacao:

- os valores reais permanecem somente em [\.env.production](c:\Projeto\.env.production), que continua fora do Git

### 2026-03-27 - Rotina agendada de backup no Windows

Etapas concluidas nesta fase:

- criacao do script [run_scheduled_backup.ps1](c:\Projeto\scripts\run_scheduled_backup.ps1) para executar `backup + cleanup` em sequencia com log mensal em [backups\logs](c:\Projeto\backups\logs)
- criacao do script [register_backup_task.ps1](c:\Projeto\scripts\register_backup_task.ps1) para registrar a tarefa diaria no Agendador do Windows via `schtasks`
- criacao do script [unregister_backup_task.ps1](c:\Projeto\scripts\unregister_backup_task.ps1) para remover a tarefa quando necessario
- atualizacao de [package.json](c:\Projeto\package.json) com `backup:run-scheduled`, `backup:schedule` e `backup:unschedule`
- validacao real da rotina completa com execucao manual de [run_scheduled_backup.ps1](c:\Projeto\scripts\run_scheduled_backup.ps1)
- registro real da tarefa `WebInventoryDailyBackup` para execucao diaria as `02:30`

Resultado:

- o projeto passa a ter backup diario automatico no Windows para o ambiente produtivo local
- cada execucao gera dump, metadados e log operacional da rotina
- a tarefa ficou registrada para o usuario atual com proxima execucao em `28/03/2026 02:30:00`

Comandos principais:

- rodar a rotina manualmente: `npm run backup:run-scheduled`
- registrar a tarefa: `npm run backup:schedule`
- remover a tarefa: `npm run backup:unschedule`
- consultar a tarefa: `schtasks /Query /TN WebInventoryDailyBackup /V /FO LIST`

### 2026-03-27 - Checklist final de operacao com sessao local corrigida

Etapas concluidas nesta fase:

- ajuste em [auth.ts](c:\Projeto\server\utils\auth.ts) para permitir sessao sem `secure` apenas em `localhost` quando `ALLOW_INSECURE_LOCALHOST_SESSION=true`
- exposicao do novo flag em [nuxt.config.ts](c:\Projeto\nuxt.config.ts) e documentacao em [\.env.production.example](c:\Projeto\.env.production.example)
- ajuste de validacao em [runtime-validation.ts](c:\Projeto\server\plugins\runtime-validation.ts) para aceitar a excecao controlada de ambiente local

- ajuste complementar em [inventario.vue](c:\Projeto\pages\inventario.vue) para o topo exibir o total real de registros vindo do resumo, sem depender do `status` publico minimo
- correção final da validacao em [runtime-validation.ts](c:\Projeto\server\plugins\runtime-validation.ts) para nao bloquear o fallback controlado de cookie local

Resultado:

- o ambiente produtivo local passa a manter sessao corretamente em `http://localhost:3001`
- a excecao fica restrita ao `localhost` e depende de flag explicita
- o comportamento seguro continua preservado para producao real com HTTPS

### 2026-03-27 - Branch principal alinhada para main

Etapas concluidas nesta fase:

- renomeacao da branch local de `master` para `main`
- preparacao do repositorio para seguir o padrao atual de branch principal

Resultado:

- o desenvolvimento passa a seguir na branch `main`
- a branch historica `master` pode ser mantida no remoto ate voce decidir remover ou trocar a branch padrao no GitHub


### 2026-03-27 - Rotulos de campos padronizados na interface

Etapas concluidas nesta fase:

- criacao de [field-label.ts](c:\Projeto\utils\field-label.ts) para centralizar a formatacao visual dos nomes de campos
- ajuste em [InventoryWorkspace.vue](c:\Projeto\components\InventoryWorkspace.vue), [InventoryRecordAccordionItem.vue](c:\Projeto\components\InventoryRecordAccordionItem.vue) e [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue)
- regra especial para `alocadoPara` ser exibido como `Alocado Para`
- demais campos agora passam a ser exibidos com a primeira letra maiuscula e separacao melhor de palavras em camelCase

### 2026-03-30 - Refino de usabilidade do inventario

Etapas concluidas nesta fase:

- evolucao de [inventario.vue](c:\Projeto\pages\inventario.vue) com faixa-resumo operacional da base ativa
- inclusao de cards de contexto para `base ativa`, `campos visiveis`, `visualizacao` e `busca atual`
- refinamento visual em [main.css](c:\Projeto\assets\css\main.css) para leitura horizontal mais clara da operacao

Resultado:

- a tela do inventario passa a mostrar contexto rapido sem depender de abrir a tabela
- o operador entende mais facilmente qual base esta ativa e em qual modo esta trabalhando
- o topo ficou mais orientado ao uso diario e a navegacao de operacao

### 2026-03-30 - Refino da tabela do inventario

Etapas concluidas nesta fase:

- evolucao de [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue) com resumo mais rico de colunas, filtros, densidade e largura atuais
- inclusao de acoes rapidas para `Expandir pagina` e `Recolher pagina` no modo expansivel
- ajuste em [InventoryRecordAccordionItem.vue](c:\Projeto\components\InventoryRecordAccordionItem.vue) para aceitar estado controlado de expansao
- refinamento visual complementar em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- a tabela informa melhor o estado atual do recorte e da visualizacao
- listas expansivas ficam mais praticas para abrir e fechar em lote na pagina atual
- o operador ganha mais contexto sem perder o foco da edicao

### 2026-03-30 - Refino de usabilidade dos acessos

Etapas concluidas nesta fase:

- evolucao de [acessos.vue](c:\Projeto\pages\acessos.vue) com faixa-resumo operacional da sessao, usuarios, historico e permissao atual
- inclusao de contexto rapido em [AccessAdminPanel.vue](c:\Projeto\components\AccessAdminPanel.vue)
- refinamento visual complementar em [main.css](c:\Projeto\assets\css\main.css) para leitura horizontal mais clara da area de acessos

Resultado:

- a tela de acessos passa a mostrar melhor o estado atual do ambiente e do perfil logado
- administracao, usuarios e historico ficam mais faceis de interpretar sem precisar percorrer toda a tela
- a pagina fica mais consistente com o inventario em termos de contexto operacional


### 2026-03-30 - Simplificacao da area da tabela

Etapas concluidas nesta fase:

- remocao da secao `Filtros por coluna` em [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue)
- remocao da secao `Preferencias da tabela` em [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue)
- limpeza do CSS associado em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- a base ativa ficou mais direta e com menos blocos auxiliares
- a operacao diaria passa a depender so da busca principal, ordenacao, paginacao e importacao/exportacao
- a tela ganha mais foco no que realmente esta sendo usado


### 2026-03-30 - Simplificacao do painel do inventario

Etapas concluidas nesta fase:

- remocao do bloco `Panorama das bases` em [inventario.vue](c:\Projeto\pages\inventario.vue)
- limpeza do CSS associado em [main.css](c:\Projetossets\css\main.css)

Resultado:

- a tela do inventario ficou mais focada em operacao direta
- o fluxo visual passou a priorizar cadastro, feedback e tabela
- a pagina ganhou mais respiro sem perder as funcoes principais


### 2026-03-30 - Simplificacao visual do inventario

Etapas concluidas nesta fase:

- remocao da faixa de destaques operacionais em [inventario.vue](c:\Projeto\pages\inventario.vue)
- limpeza do CSS associado em [main.css](c:\Projetossets\css\main.css)

Resultado:

- a tela do inventario ficou ainda mais direta
- o foco visual passou a ser so operacao, feedback e registros
- o conteudo auxiliar foi reduzido para evitar distracao


### 2026-03-30 - Compactacao do topo do inventario

Etapas concluidas nesta fase:

- compactacao visual do bloco principal em [UiHeroSection.vue](c:\Projeto\components\UiHeroSection.vue)
- ajuste de titulo e descricao em [inventario.vue](c:\Projeto\pages\inventario.vue)
- refinamento do CSS associado em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- o topo do inventario ocupa menos altura
- a tela entrega contexto rapido sem competir com a tabela
- o foco visual passa mais cedo para a operacao diaria


### 2026-03-30 - Simplificacao do bloco de operacao

Etapas concluidas nesta fase:

- remocao das abas `Novo registro` e `Estrutura` em [InventoryWorkspace.vue](c:\Projeto\components\InventoryWorkspace.vue)
- integracao do campo `Novo campo` no cabecalho do bloco de operacao
- refinamento visual do layout em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- a area de operacao ficou mais curta e mais direta
- criar campo e criar registro passaram a conviver no mesmo fluxo visual
- a tela perdeu etapas desnecessarias sem remover funcionalidade


### 2026-03-30 - Simplificacao da barra da tabela

Etapas concluidas nesta fase:

- reducao de elementos auxiliares na barra de controles em [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue)
- substituicao do seletor de ordem por alternancia direta
- refinamento visual complementar em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- a barra da tabela ficou mais direta
- o operador precisa tomar menos decisoes visuais para ordenar a base
- a area de controle passou a competir menos com os registros


### 2026-03-30 - Simplificacao da area de importacao

Etapas concluidas nesta fase:

- compactacao do bloco de importacao em [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue)
- remocao da tabela grande de amostra da planilha
- refinamento visual complementar em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- a importacao ficou mais curta e menos pesada visualmente
- a validacao principal continua visivel sem ocupar tanto espaco
- a tabela ganhou mais protagonismo na tela


### 2026-03-30 - Simplificacao do topo da tabela

Etapas concluidas nesta fase:

- remocao do resumo em chips acima da tabela em [InventoryRecordList.vue](c:\Projeto\components\InventoryRecordList.vue)
- integracao da paginacao na mesma linha do total de registros
- refinamento visual complementar em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- o topo da tabela ficou mais seco e direto
- a navegacao entre paginas continua visivel sem ocupar uma faixa separada
- a area de registros ganhou ainda mais protagonismo


### 2026-03-30 - Simplificacao visual dos acessos

Etapas concluidas nesta fase:

- remocao da faixa de destaques operacionais em [acessos.vue](c:\Projeto\pages\acessos.vue)
- compactacao do topo da pagina com [UiHeroSection.vue](c:\Projeto\components\UiHeroSection.vue)
- limpeza do CSS associado em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- a area de acessos ficou mais direta
- o foco visual passou mais cedo para sessao, usuarios e historico
- a pagina ficou mais coerente com a simplificacao ja feita no inventario


### 2026-03-30 - Simplificacao do bloco de backup

Etapas concluidas nesta fase:

- compactacao do painel de backup em [AccessAdminPanel.vue](c:\Projeto\components\AccessAdminPanel.vue)
- reorganizacao das acoes em linha unica
- refinamento visual complementar em [main.css](c:\Projeto\assets\css\main.css)

Resultado:

- exportar e restaurar ficaram mais diretos
- o preview do arquivo selecionado continua visivel, mas com menos peso visual
- a area administrativa passou a ocupar menos altura


### 2026-03-30 - Simplificacao da lista de usuarios

Etapas concluidas nesta fase:

- remocao do resumo em chips em [AccessUsersPanel.vue](c:\Projeto\components\AccessUsersPanel.vue)
- encurtamento do cabecalho do painel
- simplificacao dos textos de acao no painel de usuarios

Resultado:

- a lista de usuarios ficou mais objetiva
- o foco visual passou para busca, status e acoes principais
- o painel administrativo ganhou mais ritmo de leitura

### 2026-03-30 - Simplificacao da lista e do historico de acessos
- A lista de usuarios em AccessUsersPanel.vue ficou mais direta, sem destaque separado de perfil e com identificacao resumida em uma unica linha.
- O historico em AuditLogPanel.vue perdeu o bloco de resumo e o filtro de alvo, mantendo so busca e acao para leitura mais simples.


### 2026-03-30 - Compactacao dos formularios de acessos
- Os formularios de senha e de novo usuario em AccessAdminPanel.vue receberam rotulos mais curtos e uma grade mais horizontal para reduzir altura visual.


### 2026-03-30 - Compactacao do historico de acessos
- O historico em AuditLogPanel.vue foi reduzido para cards mais curtos, com alvo e data na mesma linha para acelerar a leitura.


### 2026-03-30 - Polimento final da tela de acessos
- A grade principal de `Acessos` foi reequilibrada em `main.css`, com colunas mais harmonizadas, menos espaco entre blocos e cards mais compactos.

### 2026-03-30 - Reorganizacao horizontal da administracao de acessos
- O bloco administrativo de `Acessos` em `main.css` passou a distribuir senha e novo usuario lado a lado, deixando backup e feedback ocuparem a largura total.

### 2026-03-30 - Ajuste do botao de restaurar backup
- O bloco de backup em `main.css` recebeu colunas mais equilibradas e largura minima maior para o botao de restauracao, evitando que ele fique espremido.

### 2026-03-30 - Contencao do bloco de restauracao de backup
- O layout do backup em `main.css` passou a limitar a largura interna e a quebrar o botao de restauracao para uma segunda linha em larguras intermediarias, evitando invasao da coluna vizinha.

### 2026-03-30 - Reestruturacao do bloco de backup
- O bloco de backup em `AccessAdminPanel.vue` foi redesenhado com arquivo em uma linha propria e botoes de exportar/restaurar em uma faixa separada, evitando disputa de espaco lateral.
