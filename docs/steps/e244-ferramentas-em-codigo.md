# Etapa 24.4: Ferramentas em código

O roteiro chama esta etapa de "24.4 Ferramentas em código. Código que calcula.", depois da 24.3.4
(o "Os pedidos" da tabela é a etapa Papéis e pedidos, fechada) e antes de Papéis da empresa. O
`docs/steps/` do `main` não tem cartão: pela regra L5 este entra com o seu pull request. Cada linha
citada foi relida no `main` em `0d535e2a`, com `@mastra/core` 1.82.0, `@mastra/e2b` 0.16.1, `e2b`
2.63.0 e `wrangler` 4.151.1; o construtor de cada unidade a reabre no `main` do dia. O lugar de cada
tipo de código foi decidido antes deste cartão (o fundador, 2026-11-05: "Concordo e aprovo"); o
cartão diz como construir, não reabre a escolha.

## A página do fundador

**No fim desta etapa** você pede ao Construtor uma ferramenta que calcula, vê o código que ele
escreveu e o teste que ele rodou, põe a ferramenta num agente e o agente responde com a conta feita
por ela, na Cloudflare, sem nenhuma senha. E um agente com **Computador** ligado faz contas na hora
num programa curto e desenha um gráfico, que aparece ao lado da conversa.

**Onde cada código roda.**

| O quê | Exemplo | Onde roda | O que você vê |
| --- | --- | --- | --- |
| Ferramenta salva, que o Construtor escreve | "vendas de um mês por vendedor" | Workers for Platforms, como os apps | Na aba **Ferramentas**, marcada **Em código**, com o código e o teste |
| Conta feita na hora | "compare setembro e outubro e diga quem cresceu" | Modo código do Mastra, na máquina do agente | Uma chamada **Programa** na conversa, com o resultado |
| Trabalho pesado | "faça um gráfico das vendas" | A máquina do agente (E2B), a mesma do Assistente | O arquivo ao lado da conversa |

**O roteiro de uso.** Padaria Sol, Projeto "Encomendas", com a ligação do Sankhya e o agente "Vendas"
publicado na versão 1. Você é a Ana (dona).

1. Em **Agentes › Construtor**, você pede: "Crie uma ferramenta que soma as vendas de cada vendedor
   num mês." O Construtor mostra que está escrevendo e testando; ao fim diz "Testei com as vendas de
   setembro: 5 vendedores" e a ferramenta aparece na aba **Ferramentas** marcada **Em código**. Um
   toque nela abre a versão 1 com o código e o resultado do teste.
2. O Construtor põe a ferramenta no rascunho do "Vendas". No teste do rascunho você pergunta "Quanto
   cada vendedor vendeu em setembro?": a chamada da ferramenta aparece na conversa, com a entrada e o
   resultado, e a resposta traz os totais.
3. Você publica a versão 2 e faz a mesma pergunta na conversa do agente: a resposta chega em segundos
   e é a mesma.
4. Nas ferramentas do rascunho você liga **Computador** (no grupo das Ferramentas do Conexus, ao lado
   de **Pesquisar na web**) e publica a versão 3. Pede "faça um gráfico das vendas de setembro por
   vendedor": o gráfico aparece ao lado da conversa.
5. Pergunta "Compare setembro e outubro de cada vendedor e diga quem cresceu mais": a conversa mostra
   uma chamada **Programa**, que leu os dois meses pela ferramenta e fez a conta, e a resposta diz quem
   cresceu.
6. Você pede ao Construtor para a ferramenta arredondar para reais inteiros: ele grava a versão 2 da
   ferramenta. O "Vendas" publicado continua na versão 1 dela até você publicar o agente de novo.

**O que você faz, e quando.** Antes: nada; a conta da Cloudflare e a chave do E2B já estão no ar. No
começo: aprova esta página e responde à decisão A. No fim: faz o roteiro, diz o que viu e aprova os
textos das telas.

**O que o protótipo mediu** (2026-11-05, desta máquina no Brasil; números de São Paulo serão
parecidos, não iguais).

- **Ferramenta salva na Cloudflare:** quente, 35 ms do pedido à resposta, com uma leitura de dados
  (95% abaixo de 52 ms); a primeira chamada de uma versão nova, 289 ms; subir uma versão, ~1,1 s. O
  trecho de volta ao Hub para ler o Sankhya soma 31 a 40 ms (medido na 0041). Uma ferramenta que gasta
  CPU demais é cortada, uma que tenta a internet recebe 403, uma que pede um dado que não declarou é
  recusada.
- **A máquina:** liga em ~0,9 s, pausa em ~0,4 s, volta da pausa em ~1,1 s. Ligada custa uns US$ 0,13
  por hora; pausada não cobra CPU. O plano grátis do E2B deixa 20 máquinas ligadas ao mesmo tempo e uma
  partida por segundo; 5 juntas subiram em ~0,9 s.
- **O modo código na máquina:** o programa chama as ferramentas do agente, que continuam no Hub; o
  limite de 50 chamadas por resposta segurou (50 passaram, 10 recusadas); a internet ficou fechada.
  Cada chamada em série custa uma ida e volta ao E2B (0,2 a 0,6 s): 10 em paralelo levam ~1,7 s, 10 em
  série ~3,7 s, e 60 em série passaram de 30 s numa de três vezes.
- **Uma máquina pausada fica guardada para sempre** no E2B, se ninguém a matar. Por isso quem abre a
  máquina de uma execução a mata no fim, e uma varredura pela marca pega a que sobrar.
- **Não medido:** quantos pedidos saem certos com o modo código contra só ferramentas, com modelo de
  verdade. A conta Google do Gemini respondeu, já na primeira chamada, que o serviço foi desativado por
  violação dos Termos de Serviço. Essa medida passa a ser o primeiro passo da U5, numa conta que
  funcione.

**Fica de fora.**

- **Python numa ferramenta salva.** A ferramenta salva é TypeScript; os três pedidos de exemplo são
  somas, filtros e divisões. Python roda na máquina do agente (passo 4).
- **Uma ferramenta que lê duas ligações.** Como a biblioteca de hoje, cada ferramenta lê uma ligação
  (várias leituras dela). Entra quando um pedido de verdade cruzar dois sistemas.
- **Ferramenta que escreve** no Sankhya: é a 24.5, que soma "Aprovar?".
- **Execução agendada de um agente** e o painel que fica: a agenda de agentes é a 24.6; o painel que a
  equipe abre todo dia vai ao Builder pelo botão da 24.3.2. Esta etapa já deixa escrita a regra de quem
  mata a máquina de uma execução sem conversa (a U4).
- **Plano pago do E2B.** O grátis cabe no seu uso de hoje; o pago (US$ 150 por mês) entra quando o uso
  pedir, como o roteiro já diz.

**As decisões suas nesta etapa.**

**A. O modo código num agente sem Computador.** O modo código precisa de um lugar isolado para rodar
o programa que o modelo escreve. O caminho que você aprovou é a máquina do agente.

- **`A1`. Só com Computador ligado (recomendo).** O agente com Computador ganha também o modo código,
  na mesma máquina. Um agente sem Computador faz contas pelas ferramentas salvas. Nativo:
  `createCodeMode` com `E2BCodeModeTransport` do `@mastra/e2b`. Custo: a máquina liga na primeira conta
  da conversa (~1 s) e cada chamada em série soma ~0,3 s.
- `A2`. Todo agente ganha o modo código, rodando dentro do Hub num isolamento do Mastra
  (`@mastra/quickjs`: sem arquivo, sem rede, só as ferramentas do agente). Mais rápido (no próprio
  processo, 60 chamadas levaram 55 ms) e sem máquina, mas põe código escrito pelo modelo dentro do
  servidor que guarda tudo, o que nenhuma decisão de hoje permite: pede uma decisão nova e um pacote
  novo. Nativo do Mastra; o pacote não está instalado e não foi medido.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 A forma | A avaliação da arquitetura do código de hoje para a 24.4, e o que se move ou se apaga antes: o dono das máquinas de conversa sai de `builder/assistant/` para `builder/machine/`, servindo Assistente, Construtor e agentes; o cartão ganha os nomes finais de pastas, módulos e assinaturas das U2 a U5 | `apps/server/src/builder/{machine,assistant,agents,tools,construtor}/`, `apps/edge/src/`, `packages/{hub-api,app-contract}/src/`, `docs/steps/e244-ferramentas-em-codigo.md` | [architecture](../architecture.md) | esta página aprovada |
| U2 A ferramenta em código, escrita | O tipo `CODE` na biblioteca, a versão com código, leituras declaradas e teste; o Construtor com máquina escreve, testa e grava; a aba Ferramentas mostra **Em código** e a página da versão mostra o código e o teste | `packages/hub-api/src/tools.ts`, `apps/server/src/builder/{tools,construtor}/`, `apps/server/migrations/`, `apps/web/src/builder/tools/`, `docs/reference/screens.md` | [data](../guides/data.md) | U1 |
| U3 A ferramenta em código, chamada | O namespace das ferramentas, a subida de `t-<versão>` sem binding, a rota de ferramenta na borda com a capability `data`, a operação de borda que lê pelo Hub com escopo e o limite de 50, e a ferramenta fina no agente | `apps/edge/{src,wrangler.jsonc}`, `packages/{hub-api,app-contract}/src/`, `apps/server/src/platform/cloudflare.ts`, `apps/server/src/hub/connectors/`, `apps/server/src/builder/agents/`, `infra/` | [security](../guides/security.md) | U2 |
| U4 O Computador do agente | O campo `machine` na configuração do agente; o agente com Computador recebe o workspace do dono de máquinas, a rede da 0059 e `show_file`; a linha **Computador** nas Ferramentas do Conexus; a regra e o teste de quem mata a máquina de uma execução sem conversa | `packages/hub-api/src/agents.ts`, `apps/server/src/builder/{agents,machine}/`, `apps/web/src/builder/agents/` | [web](../guides/web.md) | U1 |
| U5 O modo código | `execute_typescript` sobre as ferramentas do agente com Computador (decisão A), pelo `E2BCodeModeTransport`, dentro do limite de 50; a chamada **Programa** na conversa; a medida de acerto contra só ferramentas | `apps/server/src/builder/agents/`, `apps/web/src/builder/{agents,conversation}/` | [testing](../guides/testing.md) | U4, U3 |

A U2 e a U4 correm em paralelo depois da U1: não dividem pasta (a U2 fica em `builder/{tools,construtor}`
e `web/builder/tools`; a U4 em `builder/agents` e `web/builder/agents`; o dono de máquinas, que as duas
usam, sai pronto da U1). A U3 espera a U2 (lê a versão com código); a U5 espera a U4 (a máquina) e a
U3 (a ferramenta salva também entra no programa).

**O método das unidades.** Cada unidade segue o `pstack:poteto-mode` como as skills do repositório já
o chamam ([`conexus-scope`](../../.agents/skills/conexus-scope/SKILL.md), passo 4;
[`conexus-build`](../../.agents/skills/conexus-build/SKILL.md);
[`conexus-review`](../../.agents/skills/conexus-review/SKILL.md)): `how` para ler o código de hoje,
`architect` para a forma (tipos, assinaturas, módulos) antes do código, e os princípios que ele nomeia
(subtract before you add, model the domain, boundary discipline, migrate callers then delete legacy
APIs). O cartão não repete o método.

**Orçamento de código alterado.** U1: ~400 (mudança de lugar do dono de máquinas, com os chamadores,
e as emendas do cartão). U2: ~1.100 (contrato, migração da trava de `kind`, a ferramenta do Construtor
e o seu teste na máquina, o armazenamento, as duas telas). U3: ~1.100 (o namespace e a subida, a rota e
a capability na borda, a operação de borda no Hub, a ferramenta fina, o acesso do Hub à borda). U4:
~650 (o campo, o workspace e `show_file` no agente, a linha na tela, a regra de quem mata). U5: ~300.
Total da etapa: ~3.550, dentro da regra L2.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Depois da U1, o Assistente abre, pausa e mata a máquina de uma conversa como antes (os testes de hoje passam sem mudar a asserção), e o dono de máquinas vive num módulo só, importado pelo Assistente pelo `public.ts` de `builder/machine` | os testes de `builder/assistant/machine*.test.ts` de hoje, movidos sem mudar asserção; dependency-cruiser | must |
| 2 | U2 | O Construtor grava uma ferramenta `CODE` só depois de o teste dela passar na máquina; uma ferramenta cujo teste falha não entra na biblioteca e o Construtor diz o erro | `builder/construtor/code-tool.test.ts`: teste que passa grava a versão 1; teste que falha devolve `TOOL_TEST_FAILED` e nenhuma linha | must |
| 3 | U2 | Uma versão de ferramenta `CODE` nunca muda depois de gravada; uma mudança grava a versão seguinte, e o agente publicado continua na que prendeu | `builder/tools/code-version.test.ts`, pela rota de salvar duas vezes e pela leitura do agente publicado | must |
| 4 | U2 | A página da versão mostra o código e o resultado do teste; quem não pode ver Ferramentas (o membro) recebe 404, como hoje | `apps/web/src/builder/tools/tool-page.test.tsx`; rota com sessão de membro | must |
| 5 | U2 | A ferramenta `CODE` declara as leituras de uma ligação; gravar com uma ligação que o Projeto não recebeu é recusado com `TOOL_CONNECTION_NOT_GRANTED` | `builder/tools/routes.test.ts`, caso novo | must |
| 6 | U3 | O agente chama a ferramenta salva e recebe o resultado calculado na Cloudflare; a versão roda como `t-<toolVersionId>` sem binding e sem segredo | `apps/edge/src/tools.test.ts` (Miniflare, namespace dublê) e `builder/agents/code-tool.test.ts` pela porta do Hub | must |
| 7 | U3 | A ferramenta que pede uma leitura que não declarou recebe `NOT_DECLARED`; a que tenta a internet recebe 403 da parede; a que passa da CPU devolve ao modelo `TOOL_FAILED`, e o agente segue | `apps/edge/src/tools.test.ts`; os três casos provados no protótipo (`Worker exceeded CPU time limit.`, 403, `NOT_DECLARED`) | must |
| 8 | U3 | A 51ª leitura de dados de uma resposta, somando `connector_read` e as ferramentas salvas, é recusada | `hub/connectors/tool-door.test.ts`: a chave do turno chega à borda e volta | must |
| 9 | U3 | Um pedido à rota de ferramenta da borda sem a credencial do Hub é recusado antes de chegar a um Worker | `apps/edge/src/tools.test.ts`, pedido sem credencial e com credencial errada | must |
| 10 | U3 | A versão cujo Worker sumiu ("Worker not found.") devolve ao modelo `TOOL_UNAVAILABLE`, e a ferramenta de conector do mesmo agente continua funcionando | `builder/agents/code-tool.test.ts` | must |
| 11 | U4 | O agente com Computador roda um comando, escreve um arquivo e o mostra com `show_file`; a máquina só liga na primeira ferramenta que precisa dela, e um agente sem Computador não recebe nenhuma ferramenta de máquina | `builder/agents/machine.test.ts` (kit dublê) | must |
| 12 | U4 | A máquina do agente só alcança `registry.npmjs.org`, `pypi.org` e `files.pythonhosted.org` (0059) | `builder/agents/machine.test.ts`, a lista passada ao kit | must |
| 13 | U4 | Uma execução sem conversa mata a sua máquina no fim, também quando falha; a varredura pela marca mata uma máquina pausada que sobrou | `builder/machine/run-machine.test.ts`: caminho A e caminho B do protótipo, com o dublê | must |
| 14 | U4 | Uma versão publicada antes desta etapa abre com Computador desligado | `builder/agents/frozen.test.ts`, uma configuração sem o campo | must |
| 15 | U5 | O agente com Computador recebe `execute_typescript`; o programa chama as ferramentas do agente pelo Hub, com o mesmo limite de 50; um agente sem Computador não o recebe | `builder/agents/code-mode.test.ts` | must |
| 16 | U5 | A conversa mostra a chamada **Programa** com o resultado; um programa que falha mostra o erro e o agente responde sem inventar o número | `apps/web/src/builder/conversation/program-call.test.tsx` | must |
| 17 | U5 | Numa conta de modelo que funcione, os três pedidos de exemplo rodam 3 vezes com modo código e 3 só com ferramentas; o relatório da unidade traz acertos, tokens e tempo | relatório da U5, fora do repositório (L21) | should |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Aba Ferramentas, a linha **Em código** | a linha nova, com o selo | a lista de hoje, sem linha | o esqueleto de hoje | a falha de leitura de hoje | — | o membro não vê a aba (W34) | — |
| Página da versão de uma ferramenta `CODE` | o código e "Teste passou" | — | esqueleto | falha de leitura com Tentar de novo | 404 de hoje | 404 para o membro | — |
| **Computador** nas Ferramentas do Conexus | desligado | — | — | a falha de gravar do rascunho de hoje | — | quem não muda o rascunho não vê o botão | — |
| Chamada **Programa** na conversa | a chamada com o resultado | — | "Rodando o programa" | a mensagem de erro do programa | — | — | "O programa passou do tempo" |

O desenho da linha **Computador** é o da linha **Pesquisar na web** (`chooser.tsx:256-265`,
`tools-section.tsx:23-35`), com o ícone de computador; o selo **Em código** e o bloco de código da
versão são peças novas, desenhadas na U2 pela [Pauta](../../DESIGN.md), e as caixas abaixo.

```text
1280 px, página da versão                 390 px
+--------------------------------------+  +----------------------+
| vendas_por_vendedor  v1   Em código  |  | vendas_por_vendedor  |
| Soma as vendas de cada vendedor...   |  | v1  Em código        |
| Lê: Sankhya · Notas                  |  | Lê: Sankhya · Notas  |
| +----------------------------------+ |  | +------------------+ |
| | export default { async fetch(... | |  | | export default { | |
| +----------------------------------+ |  | +------------------+ |
| Teste passou · 251 notas, 5 vended.  |  | Teste passou         |
+--------------------------------------+  +----------------------+
```

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `ToolSummary.kind` (`PRESET` ou `CODE`) | U2, o serviço de ferramentas | a aba Ferramentas (o selo), o Construtor (`tool_search`) |
| `CodeToolVersion.source` | U2, o Construtor | a página da versão; a U3, que sobe o módulo |
| `CodeToolVersion.module` (o JavaScript empacotado) e `sha256` | U2, na máquina | U3, a subida |
| `CodeToolVersion.reads` | U2 | U3, a capability e a porta do Hub |
| `CodeToolVersion.test` (passou, linhas lidas, quando) | U2 | a página da versão |
| `CodeToolVersion.inputSchema`, `outputSchema` (JSON Schema) | U2 | U3, a ferramenta fina no agente |
| `AgentConfig.machine` | U4, o rascunho e a publicação | U4, `agentOf`; U5, o modo código; a tela |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Gravar a versão de uma ferramenta `CODE` (U2) | a chave de tentativa é o id da chamada do Construtor (`construtor/tools.ts:78-84`): a segunda acha a primeira | o teste passou e o banco caiu: nada gravado, o Construtor tenta de novo com a mesma chave | máquina fora: `MACHINE_UNAVAILABLE`, nada gravado | `TOOL_TEST_FAILED` ou `MACHINE_UNAVAILABLE`, sem o código | 2, 3 |
| Subir `t-<toolVersionId>` (U3) | o PUT é idempotente pelo nome do script | subiu e a gravação do estado falhou: a próxima chamada acha o Worker pelo nome (`exists`, `cloudflare.ts:268-271`) | Cloudflare fora: a versão fica gravada e a chamada devolve `TOOL_UNAVAILABLE` | o código de falha da Cloudflare, sem o token (S36) | 6, 10 |
| Chamar a ferramenta (U3) | duas chamadas são dois pedidos, sem estado (S5) | o Worker respondeu e a resposta se perdeu (502, corte): a leitura não escreve, o modelo pode repetir | a borda ou o Hub fora: `TOOL_UNAVAILABLE`; prazo de 10 s da 0047 | `TOOL_FAILED`, `TOOL_UNAVAILABLE`, sem a entrada | 7, 8, 9, 10 |
| Ligar a máquina do agente (U4, `E2BSandbox.start`) | a fila por conversa do dono de máquinas (`inLane`, `assistant/machine.ts`) | ligou e o turno caiu: a máquina pausa no fim do turno ou no timeout | E2B fora ou 429: `MACHINE_UNAVAILABLE`; o SDK espera o `Retry-After` | `MACHINE_UNAVAILABLE` com a razão | 11 |
| Matar a máquina de uma execução sem conversa (U4) | matar duas vezes não falha | o dono caiu antes de matar: a máquina pausa e a varredura pela marca a mata | E2B fora: a varredura seguinte tenta de novo | a contagem de máquinas mortas | 13 |
| Rodar o programa (U5, `execute_typescript`) | cada programa é um processo seu na máquina | passou de 30 s: `TimeoutError`, o modelo recebe o erro | a máquina caiu: o `retryOnDead` do transporte, depois erro | o erro do programa, sem os dados | 15, 16 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Onde mora o dono das máquinas de conversa | U1 | `apps/server/src/builder/assistant/machine.ts:251-282` (workspace, `sandboxCacheKey`) | `mastra@6e8dfcb8` `mastracode/factory/src/workspace.ts:1669-1698` | O Factory monta um `Workspace` por sessão com o `sessionSandbox`, um dono só (lido) | nativo | — | não precisa | `apps/server/src/builder/machine/conversation.ts` (nome na U1) |
| A ferramenta em código no contrato da biblioteca | U2 | `packages/hub-api/src/tools.ts:76-90`; `builder/tools/tables.ts:19-20` (`kind`, "`CODE` joins with step 24.4") | `@mastra/core@1.82.0` `createTool` (Zod de entrada e saída) | Uma ferramenta é id, descrição, esquemas e `execute` (lido) | nativo | — | não precisa | `packages/hub-api/src/tools.ts` |
| O Construtor escreve e testa na máquina | U2 | `builder/construtor/construtor.ts:221` ("with no machine"); `builder/assistant/machine.ts` | `@mastra/e2b@0.16.1` `E2BSandbox`; `@mastra/core` `Workspace` com resolver (`docs-sandbox-overview.md:185-224`) | A máquina por conversa vem de um resolver com `sandboxCacheKey` (lido; provado no item 7) | nativo | — | não precisa | `apps/server/src/builder/construtor/code-tool.ts` |
| Empacotar a ferramenta | U2 | nenhum | `esbuild` (já dependência; `@mastra/e2b` o usa, `index.js` `transformSync`) | `esbuild` transforma TS em um módulo (lido) | nativo | — | não precisa | — |
| Guardar a versão com código | U2 | `builder/tools/tables.ts:44-70` (`tool_version.config jsonb`) | o estudo de carga `C3` ("code in the Hub DB (version)"); o estudo do Construtor `3.3` dizia Git e R2, antes da biblioteca da empresa (`T1`, 2026-11-02) | A versão é imutável e guarda o que roda (lido) | nativo (Drizzle) | — | `T1`, 2026-11-02 | migração nova |
| A aba e a página da ferramenta | U2 | `apps/web/src/builder/tools/{tools-tab,tool-page}.tsx` | o Studio do Mastra mostra o código da ferramenta (estudo do Construtor `1.6`) | Mostra o código em leitura (lido no estudo; design trazido: não, peça nova) | nativo | — | não precisa | — |
| Subir a versão como Worker | U3 | `apps/server/src/platform/cloudflare.ts:200-219,276-293` (`v-<id>`, `bindings: []`, `limits`, `tags`) | `vibesdk@9da158d` `worker/services/deployer/api/cloudflare-api.ts:131`; Cloudflare WfP (documentado) | PUT do script no namespace (lido; provado no item 1: p50 1.084 ms) | nativo | — | não precisa | `apps/server/src/platform/cloudflare.ts` |
| O namespace das ferramentas | U3 | `apps/edge/wrangler.jsonc:10-16` (`conexus-apps`, saída `conexus-outbound`) | estudo de runtime `(a)`: um namespace à parte; WfP tags (documentado) | Um segundo binding de namespace com a mesma parede (provado no item 1) | nativo | — | não precisa | `apps/edge/wrangler.jsonc` |
| Despachar a ferramenta com a capability | U3 | `apps/edge/src/dispatch.ts:124-170` (`DISPATCHER.get`, `props`, `limits`, prazo); `dispatcher.ts:39-56` (`Connectors`) | `vibesdk@9da158d` `worker/index.ts:202-205`; `cloudflare-agents@786d30e` `packages/codemode/src/executor.ts:311` | `DISPATCHER.get(nome)` e a chamada; a capability é um `WorkerEntrypoint` em `props` (lido; provado no item 1) | nativo | — | não precisa | `apps/edge/src/tools.ts` |
| A capability `data` lê pelo Hub | U3 | `apps/edge/src/connectors.ts:26-48`; `packages/hub-api/src/project-connections.ts:128` (`callAppConnector`); `hub/apps/routes.ts:86-87` (S48) | a mesma forma da capability dos apps (herdado, 0041: 31–40 ms quente) | Workers VPC até o ouvinte de borda do Hub (herdado) | nativo | — | não precisa | `packages/hub-api/src/project-connections.ts` |
| O Hub chama a borda | U3 | nenhum: hoje só a borda chama o Hub | Cloudflare Access, token de serviço diante da rota (documentado, não rodado) | O Access confere `CF-Access-Client-Id` e `-Secret` antes do Worker | nativo, a provar no passo 1 da U3 | se o Access não servir, um remendo (assinatura nossa) volta ao fundador com a prova | não precisa, se nativo | `apps/server/src/platform/edge-tools.ts` |
| A ferramenta fina no agente | U3 | `builder/agents/agent.ts:186-207` (`tools`), `builder/agents/tools.ts:33` (`presetTools`) | `@mastra/core@1.82.0` `createTool` | `execute` chama a borda e devolve o resultado (lido) | embrulhado: o nosso põe o escopo e a chave do turno | — | não precisa | `apps/server/src/builder/agents/code-tools.ts` |
| O limite de 50 leituras | U3, U5 | `hub/connectors/builder-port.ts:18-60` (`CONNECTOR_CALLS_PER_TURN`); `controller-kit/turns.ts:99-114` | `@mastra/core@1.82.0` `tools-BVDic2bB.js:478-486` (o modo código passa `requestContext`) | A chave do turno vem do `requestContext` (lido; provado no item 5) | nativo | — | não precisa | — |
| A chave Computador | U4 | `packages/hub-api/src/agents.ts:21-36` (`web`, `appData`); `builder/agents/agent.ts:172-209` (sem `workspace`) | `@mastra/core@1.82.0` `Agent({ workspace })` (`docs-sandbox-overview.md:52-56,228-230`); `reference-editor-sandbox-provider.md:9,34` | O agente com `workspace` ganha as ferramentas de máquina; a ficha guarda o provedor (lido) | nativo | — | "Concordo e aprovo", 2026-11-05 | `packages/hub-api/src/agents.ts` |
| A máquina do agente e a rede | U4 | `builder/machine/e2b.ts:15-32`; `builder/assistant/machine.ts:22` (`ASSISTANT_HOSTS`) | `@mastra/e2b@0.16.1` `E2BSandbox({ network, lifecycle })` | rede negada menos a lista; pausa no timeout (lido; provado nos itens 2 e 5) | nativo | — | 0059 | — |
| Mostrar o arquivo da máquina | U4 | `builder/assistant/show-file.ts:59-61` | nenhuma faz (Mastra, Factory: a interface lê o arquivo) | — | embrulhado (herdado do Assistente) | — | "H1 / W1 / Ba / Sa", 2026-10-31 | — |
| Quem mata a máquina de uma execução sem conversa | U4 | `builder/assistant/release.ts:28` (mata ao apagar a conversa); a arquitetura §8 diz "idle machines, daily", que não achei no `main` | `@mastra/core@1.82.0` `docs-sandbox-overview.md:224,305` ("Your application owns sandboxes returned by a resolver"); E2B, pausada "indefinitely" (documentado) | O dono destrói e limpa o cache; o provedor não mata a pausada (provado no item 7) | nativo | — | não precisa | `apps/server/src/builder/machine/run-machine.ts` |
| O modo código | U5 | nenhum | `@mastra/core@1.82.0` `createCodeMode` (`docs-agents-code-mode.md:30,139-149`); `@mastra/e2b@0.16.1` `E2BCodeModeTransport`; `cloudflare-agents@786d30e` `packages/codemode/src/executor.ts:311` | O programa roda isolado; as ferramentas, no host (lido; provado no item 5) | nativo | — | decisão A | `apps/server/src/builder/agents/code-mode.ts` |
| A chamada Programa na conversa | U5 | `apps/web/src/builder/conversation/` (as chamadas de hoje) | Mastra Factory, a chamada de ferramenta com entrada e saída | Uma chamada como as outras (lido) | nativo | — | não precisa | — |

Procurado: Mastra instalado (`node_modules/@mastra/{core,e2b}/dist` e `dist/docs`), a estante
`mastra-1.82` (`6e8dfcb8`, Factory), `vibesdk` (`9da158d`), `cloudflare-agents` (`786d30e`, codemode),
docs da Cloudflare (WfP, Access, preços), docs do E2B (persistência, limites, preços), e os estudos
`agent-machine-study`, `agent-runtime-study`, `agent-runtime-load` e `construtor-study`. O que mudou
desde eles: a máquina do template tem ~2 GB, não 4 GiB (medido); o Factory monta o workspace em
`workspace.ts:1669-1698`, não `1694-1714`; a ferramenta em código mora na biblioteca da empresa (`T1`),
então o código fica na versão, não no Git de um Projeto; o modo código pela máquina custa uma ida e
volta por chamada (medido).

**A medida do transplante.** Nada vem do produto antigo. O dono de máquinas do Assistente muda de lugar
na U1 com os seus testes, sem mudar o que faz.

**A dívida.**

- A arquitetura (§8) lista uma limpeza diária de máquinas ociosas que não achei no `main` em
  `0d535e2a`; a U1 confirma, e a falta vira issue com o label `next-card` (o E2B guarda a pausada para
  sempre).
- `S4` fala só do handler de app; a ferramenta gerada recebe só `data`. A emenda vai ao fechamento.
- Na mesma instância de `E2BSandbox`, `start()` depois de `stop()` não religou (medido); o Hub usa
  instância nova e não é afetado. Fica anotado em `stack.md` no fechamento.

## U1 A forma

**Base e modelo.** `main` do dia. Opus: é desenho entre módulos (máquinas, ferramentas, agentes, borda).

### As linhas da tabela

"Onde mora o dono das máquinas de conversa". Ler `builder/assistant/machine.ts` inteiro, `kit.ts`,
`machine/public.ts`, `machine/machines.ts` (o dono das máquinas do Builder) e o `Workspace` do Factory
(`mastracode/factory/src/workspace.ts:1669-1698`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/machine/` | Cria o dono das máquinas de conversa | Assistente; depois Construtor (U2) e agentes (U4) |
| `apps/server/src/builder/assistant/` | Apaga `machine.ts` daqui, troca o import | `assistant.ts:336`, `routes.ts`, `release.ts` |
| `docs/steps/e244-ferramentas-em-codigo.md` | Muda as seções U2 a U5 | os construtores das unidades |

### Os contratos que a unidade cria

O dono das máquinas de conversa, um tipo só (C26), com `workspace(requestContext)`, `stop`, `stopAll`,
`kill`, `serving` como hoje (`AssistantMachines`), parametrizado pela lista de rede e pela marca de quem
o usa. Os nomes finais e as assinaturas descem às seções U2 a U5.

### A ordem do trabalho

1. `how` sobre `builder/machine`, `builder/assistant/machine.ts`, `builder/agents`, `builder/tools`,
   `apps/edge/src` e `platform/cloudflare.ts`, contra `docs/architecture.md`, `docs/reference/stack.md`,
   os guias de código (C3 a C8, C26, C56) e de segurança (S4, S36, S48) e as referências da tabela.
2. Escreve, no pull request, a avaliação: para cada peça da 24.4, a pasta e o módulo onde entra, o que
   se move ou se apaga antes, e a forma nativa (`architect`).
3. Move o dono das máquinas para `builder/machine/`, migra os chamadores e apaga o lugar antigo na mesma
   onda. Rodam os testes de hoje do Assistente.
4. Emenda as seções U2 a U5 deste cartão com os nomes e as assinaturas; a emenda é lida como delta
   ([delivery L9](../guides/delivery.md)).

### Como se prova

Critério 1: os testes de máquina do Assistente passam sem mudar asserção; `npm run deps` (dependency-cruiser)
passa com o import novo.

### Parar se

A avaliação mostrar que uma peça precisa de um lugar que muda uma fronteira da arquitetura (um módulo
novo entre Hub e Builder): volta ao cartão antes da U2.

## U2 A ferramenta em código, escrita

**Base e modelo.** Depois da U1. Sonnet.

### As linhas da tabela

"A ferramenta em código no contrato", "O Construtor escreve e testa na máquina", "Empacotar",
"Guardar a versão com código", "A aba e a página da ferramenta". Ler `packages/hub-api/src/tools.ts`,
`builder/tools/{tables,store,tools,check}.ts`, `builder/construtor/{tools,construtor}.ts` e
`apps/web/src/builder/tools/`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/tools.ts` | Muda: `ToolKind`, `CodeToolVersion` | servidor, web |
| `apps/server/src/builder/tools/` | Muda: a versão `CODE`, a trava de `kind` | Construtor, agentes (`frozen.ts:25,45-58`) |
| `apps/server/migrations/` | Cria: a trava `tool_kind` passa a aceitar `CODE`; `operation` só para `PRESET` | — |
| `apps/server/src/builder/construtor/` | Cria `code-tool.ts`, a ferramenta `tool_code_save` | o Construtor |
| `apps/web/src/builder/tools/` | Muda: selo, página da versão | — |

### Os contratos que a unidade cria

- `ToolKind = 'PRESET' | 'CODE'` em `ToolSummary.kind`.
- A versão é uma união pelo `kind` (C21): `PRESET` com `ToolVersionConfig` de hoje; `CODE` com
  `{ description, source, module, sha256, reads: OperationId[], inputSchema, outputSchema, test: {
  passed: true, rows: number, at: string } }`. Os esquemas são JSON Schema gerados do Zod do código
  pelo `z.toJSONSchema` na máquina; o Hub os valida com Zod na entrada (C27).
- `tool_code_save` do Construtor: `{ toolId?, slug, connectionId, reads, description, source }`. A
  chave de tentativa é a da chamada (`construtor/tools.ts:78-84`).
- Falhas novas: `TOOL_TEST_FAILED`, `TOOL_CONNECTION_NOT_GRANTED`.
- Nenhuma permissão nova do banco: as tabelas são as da 24.3.1.

### A ordem do trabalho

1. O contrato e a migração (data D6: só soma; a trava muda por `drop`/`add` da `check`).
2. O Construtor abre a máquina pelo dono da U1, escreve `tool.ts` e `tool.test.ts`, lê uma vez pelo
   Hub a leitura declarada e grava a resposta como fixture na máquina (a máquina não tem segredo, 0059),
   roda o typecheck e o teste, empacota com `esbuild` e devolve fonte, módulo e resultado.
3. Grava a versão só com o teste passando.
4. A tela: selo **Em código** na linha, a página da versão com o código em leitura e o teste.

### Como se prova

Critérios 2 a 5. O teste do Construtor usa o kit dublê da máquina (`machine/test-machine.ts`).

### Parar se

O teste da ferramenta precisar de uma rede além da 0059, ou de um segredo: volta ao cartão.

## U3 A ferramenta em código, chamada

**Base e modelo.** Depois da U2. Opus: concorrência de borda, escopo de dados e a nova direção Hub →
borda.

### As linhas da tabela

"Subir a versão como Worker", "O namespace das ferramentas", "Despachar a ferramenta com a
capability", "A capability data lê pelo Hub", "O Hub chama a borda", "A ferramenta fina no agente",
"O limite de 50 leituras". O protótipo (fora do repositório) tem o despachante e a capability que
funcionaram: `env.DISPATCHER.get(script, { props: { data: ctx.exports.ToolData({ props: { reads } }) } },
{ outbound: {}, limits: { cpuMs: 50, subRequests: 50 } })`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/edge/wrangler.jsonc` | Muda: segundo namespace `conexus-tools`, mesma saída | — |
| `apps/edge/src/` | Cria `tools.ts` (rota e `ToolData`); muda `dispatcher.ts` | o Hub |
| `packages/app-contract/src/` | Cria `ToolProps = { data }` (versionado) | o Worker da ferramenta |
| `packages/hub-api/src/project-connections.ts` | Cria `callToolConnector` (operação de borda) | a borda |
| `apps/server/src/hub/connectors/` | Muda: a porta que lê para uma ferramenta, com escopo e a chave do turno | a rota de borda |
| `apps/server/src/platform/cloudflare.ts` | Muda: subir no namespace das ferramentas | U2 (ao gravar), a ferramenta fina |
| `apps/server/src/builder/agents/` | Cria `code-tools.ts`; muda `agent.ts` `tools` | o agente |
| `infra/` | Muda: o segredo do Access no servidor, pelo runner (0035, 0042) | — |

### Os contratos que a unidade cria

- Worker `t-<toolVersionId>`, tags `company-<id>`, `agent-<id>`, `kind-tool`, `bindings: []`,
  `limits.cpu_ms` de `APP_CALL_LIMITS` (0047).
- `ToolProps = { data: { read(operation: string, input: unknown): Promise<ConnectorAnswer> } }`.
- Os `props` da capability (só na borda): `{ companyId, projectId, agentId, toolVersionId, reads,
  turn, endsAt }`. O Hub confere empresa, Projeto, que a ligação está no Projeto, que a leitura está em
  `reads` e conta a chave `turn` com as de `connector_read`.
- Falhas ao modelo: `TOOL_FAILED`, `TOOL_UNAVAILABLE`, `NOT_DECLARED`, `CONNECTOR_CALLS_SPENT`.

### A ordem do trabalho

1. **Prova do Access** (fora do repositório, como as provas da 0041): um token de serviço diante de uma
   rota de teste; sem token, o Worker não é chamado. Se não servir, parar.
2. O namespace e a subida; a rota e a capability na borda; a operação de borda no Hub; a ferramenta
   fina. Regras: S36, S48, C56, C57 (o prazo de 10 s da 0047).

### Como se prova

Critérios 6 a 10. Os casos de recusa repetem os três do protótipo.

### Parar se

O Access não recusar o pedido sem token (passo 1), ou a contagem de 50 não chegar à borda pela chave do
turno.

## U4 O Computador do agente

**Base e modelo.** Depois da U1, ao lado da U2. Sonnet.

### As linhas da tabela

"A chave Computador", "A máquina do agente e a rede", "Mostrar o arquivo da máquina", "Quem mata a
máquina de uma execução sem conversa". Ler `builder/agents/{agent,frozen,controller}.ts`,
`builder/assistant/{assistant,show-file}.ts` e `apps/web/src/builder/agents/{chooser,tools-section,draft-panel}.tsx`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/agents.ts` | Muda: `AgentConfig.machine: boolean`, padrão `false` ao ler versão antiga | servidor, web |
| `apps/server/src/builder/agents/` | Muda: `agentOf` com `workspace` e `show_file` quando `machine` | o controlador dos agentes |
| `apps/server/src/builder/machine/` | Cria `run-machine.ts` (matar no fim de execução sem conversa; varredura pela marca) | a 24.6 |
| `apps/web/src/builder/agents/` | Muda: a linha **Computador** | — |

### Os contratos que a unidade cria

- `AgentConfig.machine: z.boolean().default(false)` (C27 na leitura da versão).
- A marca da máquina do agente: empresa, Projeto, agente e conversa (S36).
- `runMachine(run, work)`: abre pelo resolver, roda, e no `finally` destrói e limpa o cache
  (`workspace.clearSandboxCache`).

### A ordem do trabalho

1. O campo e a leitura antiga.
2. `agentOf` recebe `workspace` pelo dono da U1, com a rede da 0059; `show_file` como no Assistente.
3. A regra de quem mata, com o caminho A e o B do protótipo no dublê.
4. A linha na tela.

### Como se prova

Critérios 11 a 14.

### Parar se

O `workspace` do agente ligar máquina ao listar agentes (`docs-sandbox-overview.md:228-230`): o
resolver não pode ligar nada fora de uma ferramenta.

## U5 O modo código

**Base e modelo.** Depois da U4 e da U3. Sonnet.

### As linhas da tabela

"O modo código", "O limite de 50 leituras", "A chamada Programa na conversa".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/agents/` | Cria `code-mode.ts`; muda `agentOf` (instruções e ferramentas) | o agente |
| `apps/web/src/builder/{agents,conversation}/` | Muda: a chamada **Programa** | — |

### Os contratos que a unidade cria

`createCodeMode({ tools, timeout }, new E2BCodeModeTransport())` sobre as ferramentas do agente
(conector, recortes, ferramentas em código, dados do app), sem `sandbox` fixo: o modo código pega a
máquina do workspace do agente (`ctx.workspace.resolveSandbox`, `tools-BVDic2bB.js:472-477`). O
`timeout` fica no padrão do Mastra (30 s) até a medida do critério 17 pedir outro, com a razão.

### A ordem do trabalho

1. A medida do critério 17, antes do código, numa conta de modelo que funcione: os três pedidos de
   exemplo do protótipo, com as linhas sintéticas, 3 vezes cada modo.
2. `code-mode.ts` e a ligação no `agentOf` só quando `machine`.
3. A chamada **Programa** na conversa.

### Como se prova

Critérios 15 a 17.

### Parar se

A medida do passo 1 mostrar o modo código errando mais que só ferramentas: volta ao fundador com os
números, antes do código.
