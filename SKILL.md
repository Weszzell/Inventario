# Skills do Codex ligadas a este projeto

Este projeto passa a manter um registro local das skills instaladas no ambiente do Codex do usuario.

Importante:

- essas skills continuam morando em `C:\Users\WebGlobal\.codex\skills`
- o sistema web de inventario nao executa essas skills diretamente
- este arquivo serve como manifesto de referencia para desenvolvimento e manutencao do projeto

## Diretorio de origem

- `C:\Users\WebGlobal\.codex\skills`

## Skills encontradas

### Skills de agente

#### `find-skills`

- origem: `C:\Users\WebGlobal\.codex\skills\.agents\skills\find-skills\SKILL.md`
- funcao: ajudar a descobrir e instalar skills quando o usuario quer ampliar capacidades do agente

#### `frontend-design`

- origem: `C:\Users\WebGlobal\.codex\skills\.agents\skills\frontend-design\SKILL.md`
- funcao: criar interfaces frontend com qualidade visual alta e identidade mais forte

#### `web-design-guidelines`

- origem: `C:\Users\WebGlobal\.codex\skills\.agents\skills\web-design-guidelines\SKILL.md`
- funcao: revisar interfaces com foco em diretrizes de UI, UX e boas praticas web

### Skills de sistema

#### `openai-docs`

- origem: `C:\Users\WebGlobal\.codex\skills\.system\openai-docs\SKILL.md`
- funcao: consultar documentacao oficial da OpenAI para uso de produtos e APIs

#### `skill-creator`

- origem: `C:\Users\WebGlobal\.codex\skills\.system\skill-creator\SKILL.md`
- funcao: criar ou estruturar novas skills

#### `skill-installer`

- origem: `C:\Users\WebGlobal\.codex\skills\.system\skill-installer\SKILL.md`
- funcao: instalar skills adicionais a partir de fontes suportadas

## Como essa integracao funciona no projeto

- o projeto agora documenta as skills disponiveis no ambiente local
- a equipe pode consultar este arquivo para saber quais capacidades extras o Codex ja possui
- futuras entregas podem referenciar essas skills quando fizer sentido no fluxo de desenvolvimento

## Observacao

Se voce quiser uma integracao mais profunda, existem dois caminhos:

- criar uma pagina no sistema web listando essas skills
- criar uma pasta local no projeto com manifestos customizados para uso interno da equipe
