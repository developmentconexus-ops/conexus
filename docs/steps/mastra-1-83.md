# Atualização do Mastra: de 1.82.0 para 1.83.0

Cartão curto de uma atualização de versão, fora da ordem do roteiro, no formato do de
`docs/steps/mastra-1-82.md` (commit `bfe676da`). O pedido do fundador, em 2026-11-17, à pergunta
"Subo o Mastra para a 1.83 agora, num PR próprio?": "Sim". A avaliação que o antecede leu as notas
de cada pacote, comparou o código das tags `@mastra/core@1.82.0` e `@mastra/core@1.83.0`, e rodou 21
arquivos de teste do servidor na 1.83. Este cartão entra em `docs/steps/` pela regra L5 quando o
cartão da trilha sair no fechamento; até lá a verificação `second-card` pode ficar vermelha nele.

## A página do fundador

**No fim desta etapa** o Conexus roda na 1.83.0 do Mastra e nada muda para quem usa: as conversas, o
Parar e as respostas aos cartões de pergunta se comportam como hoje. Uma pergunta respondida depois
de o Hub reiniciar passa a achar a pergunta no banco, em vez de ser recusada. O custo por modelo no
rastro passa a sair no modelo que respondeu.

**O roteiro de uso.**

1. Numa conversa com o Builder, peça algo que o faça perguntar. Responda ao cartão: o Builder segue.
2. Aperte **Parar** quando o cartão aparecer: o cartão fecha e o Builder para.
3. Reinicie o Hub com um cartão de pergunta aberto, recarregue a conversa e responda: o Builder segue.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. No fim: faz o roteiro e
diz o que viu.

**Fica de fora.** O redesenho do Conexus AI e o que a 1.83 traz para ele (servidor MCP embutido,
`dispatchRoute`); regravar as gravações nativas (dívida T26, em issue à parte).

**As decisões suas nesta etapa.** Nenhuma. O `@mastra/pg` 1.36.0 cria, no schema `mastra`, tabelas
novas ao iniciar. Nenhuma tabela é apagada e nenhum dado se perde; o Hub não usa as novas (a seção
das tabelas está na tabela de falhas).

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | As versões novas, o motivo `not_pending` na segunda resposta ao mesmo cartão, as seções de `boundaries.md` e a linha de `stack.md` relidas na 1.83.0, as gravações da versão instalada | `package.json`, `package-lock.json`, `apps/server/package.json`, `apps/web/package.json`, `packages/app/package.json`, `apps/server/src/builder/`, `apps/server/src/platform/`, `docs/reference/` | testing | — |

Uma unidade só: a troca de versão e as seções de `boundaries.md` têm de entrar juntas, porque o
`npm run boundaries` do CI recusa uma versão escrita que o lockfile não instala.

**Orçamento de código alterado.** U1: 1 linha de teste mudada e 4 comentários; nenhuma linha de
produção. As gravações regravadas não contam.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Uma segunda resposta ao mesmo cartão recebe `{ ok: false, reason: 'not_pending' }`, o Builder segue uma só vez, e um id desconhecido ainda recebe `no_pending_suspension` | `builder/conversation/conversation-routes.test.ts`, a segunda resposta ao cartão | must |
| 2 | U1 | O que fica feito à mão continua provado na 1.83.0: o fim do turno, as rotas atrás do guarda, o fechamento dos streams, `slim` e `paced`, a leitura sem pergunta, o passo sem o corpo do pedido, a escolha de ligações na tabela do Hub, a busca na lista, a memória da empresa, o subagente de pesquisa | os testes de prova de cada seção de `boundaries.md`, sem mudar | must |
| 3 | U1 | Um só `e2b` instalado: o lockfile não tem `node_modules/@mastra/e2b/node_modules/e2b` | `npm ls e2b` mostra uma versão só | must |
| 4 | U1 | Nenhuma versão velha escrita: `npm run boundaries` passa, e `npm run typecheck`, `npm run lint` e `npm run knip` passam | CI, o job `check` | must |
| 5 | U1 | Um banco que o `@mastra/pg` 1.35.0 iniciou e o 1.36.0 atualizou fica igual a um criado direto na 1.36.0 (as quatro mudanças da tabela de falhas) | `pg_dump --schema-only -n mastra` dos dois bancos, sem diferença | must |
| 6 | U1 | As gravações nativas lidas pelos testes são da Mastra instalada | `platform/recordings.test.ts` | must |
| 7 | U1 | Os streams retomáveis ficam ligados, sem opção nossa, como no Mastra Code, e o caso "desligar para o turno em curso…" deixa de ser `todo` se passar três vezes seguidas | `builder/conversation/conversation-stream.test.ts` | should |

## A matriz de estados

Nenhuma tela nova nem mudada.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| — | — | — |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| O `init()` do `@mastra/pg` 1.36.0 ao subir o Hub, no schema `mastra`, com o login `mastra_runtime` dono das tabelas (decisão 0010): cria `mastra_workflow_runs` (+3 índices) e `mastra_workflow_run_entries` (+2 índices, um parcial), acrescenta `run_at` e `end_at` (anuláveis) a `mastra_schedules` e cria o índice GIN `mastra_threads_metadata_gin_idx` (`jsonb_path_ops`) em `mastra_threads` | dois Hubs subindo juntos: as colunas entram por `ADD COLUMN IF NOT EXISTS`; as tabelas e índices por `IF NOT EXISTS`; num banco que já existe o GIN sai por `CREATE INDEX CONCURRENTLY`, sem travar escrita (`@mastra/pg` `dist/index.js`, `#30086`, `#29092`) | o processo cai no meio: o próximo `init()` termina o que faltou | o banco do Mastra fora: o Hub não sobe, como hoje | o que o Mastra imprime hoje | 5 |

As duas tabelas novas só são usadas com `storageVersion: 2` dos workflows, que o Hub não liga. O
Knowledge não muda de formato (`KNOWLEDGE_STORAGE_SCHEMA_VERSION` continua 4). Nenhuma migração do
Hub, nada em `database-grants.sql`. Medido na avaliação: o `pg_dump` do banco atualizado é igual, linha
a linha, ao do banco criado direto na 1.36.0.

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| As versões alvo | U1 | `@mastra/core` 1.82.0, `server` 1.82.0, `fastify` 1.5.26, `memory` 1.41.0, `pg` 1.35.0, `observability` 1.23.1, `e2b` 0.16.1, `client-js` 1.59.0 (`apps/server/package.json:26-32`, `package.json:46-48`, `packages/app/package.json:30`, `apps/web/package.json:37`) | npm, as versões estáveis saídas juntas em 2026-11-12 (`@mastra/core@1.83.0` é `d60ba71b`) | `core` 1.83.0, `server` 1.83.0, `fastify` 1.5.27, `memory` 1.41.1, `pg` 1.36.0, `observability` 1.24.0, `e2b` 0.17.0, `client-js` 1.60.0; `memory`, `pg` e `fastify` pedem `core >=1.83.0`, e o `client-js` traz o `core` 1.83.0 exato | nativo | — | 2026-11-17 "Sim" | — |
| A segunda resposta ao mesmo cartão | U1 | `conversation-routes.test.ts:110` espera `no_pending_suspension` | `@mastra/server` 1.83.0 `agent-controller.ts` (`restoreStoredToolSuspension`), `@mastra/core` #30132 | procura a suspensão também no banco antes de reivindicar; a segunda resposta recebe `not_pending` | nativo | — | 2026-11-17 "Sim" | — |
| Os streams retomáveis | U1 | os quatro agentes não passam `durable` (`builder/construtor/construtor.ts`, `builder/agents/agent.ts`, `builder/agents/controller.ts`, `builder/assistant/assistant.ts`) | `@mastra/core` 1.83.0 `areAgentStreamsEnabled`; Mastra Code `mastracode/sdk/src/experimental-agent.ts:38-43` | ligados por padrão quando o agente está num `Mastra`; o Mastra Code só desliga com `MASTRACODE_AGENT_STREAMS=off` | nativo; sem opção nossa | — | 2026-11-17 "Sim" | — |
| `addAgent` com chave ocupada | U1 | `builder/agents/registry.ts` tira (`removeAgent`) antes de pôr | `@mastra/core` #29966 | lança `MASTRA_ADD_AGENT_DUPLICATE_KEY` para outro agente na mesma chave | nativo; muda só o comentário | `registry.test.ts` passa | não precisa | — |
| O `e2b` do Conexus | U1 | `e2b` 2.63.0 | `@mastra/e2b` 0.17.0 pede `e2b ^2.62.0` | um só `e2b` no `npm ls` | nativo | — | não precisa | — |
| As tabelas do `@mastra/pg` 1.36.0 | U1 | o login `mastra_runtime` é dono das tabelas do Mastra (decisão 0010) | `@mastra/pg` 1.36.0 `dist/index.js` (`init()`) | ver a tabela de falhas | nativo; nenhuma migração do Hub | `pg_dump` dos dois bancos, critério 5 | não precisa | — |
| As seções "remendo" de `boundaries.md` (eval gate, fim do turno, chamada quebrada, rotas atrás do guarda, stream da tela, leitura sem pergunta, passo sem o corpo, domínios do store, estado em tabela do Hub, busca na lista, memória da empresa, subagente de pesquisa) | U1 | `docs/reference/boundaries.md` | `@mastra/core` 1.83.0, 1.36.0 do `pg`, 1.41.1 da `memory` | nenhuma condição de revisitar se cumpriu; o `pg` trava a linha em `updateThread`, mas a memória ainda manda o metadado inteiro | remendo, fica; mudam a versão e as linhas de biblioteca | os testes de cada seção passam na 1.83.0 | não precisa | — |
| Os dois comentários com versão no código | U1 | `builder/mastra/mastra.ts:58`, `builder/model-accounts/providers.ts:14` | `@mastra/core` 1.83.0 | nada novo | remendo, fica com a versão nova | a releitura em `@mastra/core` 1.83.0 | não precisa | — |
| A linha do Mastra em `stack.md` e a prateleira | U1 | `docs/reference/stack.md:15,20` | a regra da própria linha 15 | o pull request que troca o pin troca a prateleira e esta linha | nativo | — | não precisa | — |
| As gravações nativas | U1 | `apps/server/src/platform/recordings.test.ts` exige as gravações da Mastra instalada | testing T26 | `npm run record` | nativo | critério 6 | não precisa | — |

**A medida do transplante.** Nada trazido do repositório antigo.

**A dívida.** A regravação das gravações `abort`, `tasks`, `cited` e `plan` (da 1.79.0) e do roteiro
`approval` (o dublê do Sankhya passou a exigir os campos de cada item, commit `c8188cca`) fica numa
issue à parte (T26); não entra na subida.

## U1 A versão 1.83.0

**Base e modelo.** O `main` em `e24ad499`. Sonnet: troca de versão com os passos e as provas escritos
aqui, sem desenho novo.

### As linhas da tabela

Todas as linhas da tabela de referência.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `package.json`, `package-lock.json`, `apps/server/package.json`, `apps/web/package.json`, `packages/app/package.json` | Muda os pins do Mastra | todo o repositório |
| `apps/server/src/builder/` | Muda um teste (`conversation-routes.test.ts`) e três comentários | — |
| `apps/server/src/platform/` | As gravações regravadas na 1.83.0, quando o `main` as deixar regravar | `recordings.test.ts` |
| `docs/reference/boundaries.md`, `docs/reference/stack.md`, `docs/approvals/` | Muda as seções da tabela | quem lê o limite |

### Os contratos que a unidade cria

Nenhum.

### As skills e a leitura

`mastra` (em `node_modules/@mastra/core/dist/docs` 1.83.0) e as linhas de `docs/reference/stack.md`
das pastas acima. Os changelogs de cada pacote, da 1.82.0 até a 1.83.0.

### A ordem do trabalho

1. Os pins nos quatro `package.json`; `npm install`; `npm ls e2b` mostra uma versão só (critério 3).
2. `conversation-routes.test.ts`: o motivo `not_pending` (critério 1).
3. `boundaries.md`: cada seção relida, com as versões e as linhas de biblioteca da 1.83.0; os dois
   comentários com versão; `stack.md` (critério 4).
4. As gravações da versão instalada (critério 6).

### Como se prova

Os critérios 1 a 7, cada um pelo seu teste. Medido na avaliação, numa cópia do `main` com as versões
novas: 109 de 110 casos em 21 arquivos do servidor (a falha era a expectativa do critério 1).

### Parar se

- Um teste de seção que fica passa a falhar: a linha de biblioteca mudou. Diga qual e pare.
- O `pg_dump` do banco atualizado difere do criado direto: pare.
