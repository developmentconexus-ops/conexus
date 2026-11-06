# Etapa 24.4: Ferramentas em código

O roteiro chama esta etapa de "24.4 Ferramentas em código. Código que calcula.", depois da 24.3.4
(o "Os pedidos" da tabela é a etapa Papéis e pedidos, fechada) e antes de Papéis da empresa. O
`docs/steps/` do `main` guarda hoje o cartão da Assinatura ChatGPT, que tem a vaga da fronteira (ordem do
fundador, 2026-11-05: Assinatura ChatGPT, depois esta 24.4, depois a 24.3.5). Pela regra L5 este cartão
espera em rascunho a vaga e só a toma, trocando o arquivo da trilha, quando a Assinatura ChatGPT fechar. Cada linha
citada foi relida no `main` em `0d535e2a`, com `@mastra/core` 1.82.0, `@mastra/e2b` 0.16.1, `e2b`
2.63.0 e `wrangler` 4.151.1; o construtor de cada unidade a reabre no `main` do dia. O lugar de cada
tipo de código foi decidido antes deste cartão (o fundador, 2026-11-05, à combinação do estudo:
"Concordo e aprovo"; a frase entra no livro de aprovações com a aprovação desta página, L6); o
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
   num mês." A conversa mostra "Escrevendo e testando uma ferramenta"; ao fim o Construtor diz "Testei
   com as vendas de setembro: 5 vendedores" e a ferramenta aparece na aba **Ferramentas** marcada
   **Em código**. Um toque nela abre a versão 1 com o código e o resultado do teste.
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

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página (as decisões A e B já estão respondidas). Na U3: autoriza na Cloudflare o que ela pede e a conta do Conexus ainda não tem (o segundo
namespace de Workers for Platforms, uma aplicação do Cloudflare Access com um token de serviço, e o
que o token do Release precisa a mais); o construtor da U3 traz a lista de passos. No fim: faz o
roteiro, diz o que viu e aprova os textos das telas.

**O que o protótipo mostrou** (2026-11-05, desta máquina no Brasil; de São Paulo os números serão
parecidos, não iguais). **Medido** saiu de uma execução aqui, pelo menos 3 vezes; **herdado** vem de
uma prova anterior; **documentado** é a página do fornecedor; **conta** é uma conta sobre esses.

- **A ferramenta salva na Cloudflare** (medido): quente, 35 ms do pedido à resposta, com uma leitura
  de dados de mentira dentro da própria Cloudflare (95% abaixo de 52 ms); a primeira chamada de uma
  versão nova, 289 ms; subir uma versão, ~1,1 s. O trecho até o Hub para ler o Sankhya não rodou aqui:
  a prova da decisão 0041 mediu 31 a 40 ms quente e 72 a 119 ms na primeira (herdado). O caminho
  inteiro, Hub, ferramenta, dados no Hub e volta, fica em ~70 a 100 ms mais a leitura do Sankhya
  (conta).
- **A máquina** (medido): liga em ~0,9 s, pausa em ~0,4 s, volta da pausa em ~1,1 s; 5 juntas subiram
  em ~0,9 s. Ligada custa uns US$ 0,13 por hora (conta); pausada não cobra CPU (documentado). O plano
  grátis do E2B deixa 20 máquinas ligadas ao mesmo tempo, uma partida por segundo e 1 hora por sessão
  (documentado).
- **O modo código na máquina** (medido): o programa chama as ferramentas do agente, que continuam no
  Hub; o limite de 50 chamadas por resposta segurou (50 passaram, 10 recusadas); a internet ficou
  fechada. Cada chamada em série custa uma ida e volta ao E2B (0,2 a 0,6 s): 10 em paralelo levam
  ~1,7 s, 10 em série ~3,7 s, e 60 em série passaram de 30 s numa de três vezes.
- **Uma máquina pausada fica guardada para sempre** no E2B se ninguém a matar (documentado; visto no
  protótipo). Por isso o agente apagado, e o Projeto ou a empresa removidos, desligam as máquinas das suas conversas.
- **Não medido:** quantos pedidos saem certos com o modo código contra só ferramentas, com modelo de
  verdade. A conta Google do Gemini respondeu, já na primeira chamada, que o serviço foi desativado por
  violação dos Termos de Serviço, e você deixou o Google de lado por agora (2026-11-05). Essa medida
  passa a ser o primeiro passo da U5, numa conta da OpenAI quando ela existir no Hub; um estudo à parte
  cuida da OpenAI. O caminho do modo código, o limite de 50 e os tempos acima foram medidos com um
  modelo de mentira, que manda o programa pronto.

**Fica de fora.**

- **Python numa ferramenta salva.** A ferramenta salva é TypeScript; os três pedidos de exemplo são
  somas, filtros e divisões. Python roda na máquina do agente (passo 4).
- **Uma ferramenta que lê duas ligações.** Como a biblioteca de hoje, cada ferramenta lê uma ligação
  (várias leituras dela). Entra quando um pedido de verdade cruzar dois sistemas.
- **Ferramenta que escreve** no Sankhya: é a 24.5, que soma "Aprovar?".
- **Execução agendada de um agente** e o painel que fica: a agenda de agentes é a 24.6, e o cartão dela
  leva a regra que o protótipo mediu (quem abre a máquina de uma execução sem conversa a mata no fim);
  o painel que a equipe abre todo dia vai ao Builder pelo botão da 24.3.2.
- **Plano pago do E2B.** O grátis cabe no seu uso de hoje; o pago (US$ 150 por mês) entra quando o uso
  pedir, como o roteiro já diz.
- **Os outros avisos guardados para um cartão.** Esta etapa conserta os dois que caem no código que
  ela muda: a gravação repetida de uma ferramenta cuja ligação saiu do Projeto (#712) e a segunda aba
  que grava uma versão de ferramenta sobre uma lida antes (#707). Os outros (116 abertos hoje) tocam
  telas e partes que esta etapa não muda e esperam o seu gatilho.

**As decisões suas nesta etapa.** O fundador respondeu em 2026-11-05: "2 A1 e B1".

- **A. O modo código só com Computador ligado (`A1`).** O agente com Computador ganha também o modo
  código, na mesma máquina. Um agente sem Computador faz contas pelas ferramentas salvas. Nativo:
  `createCodeMode` com `E2BCodeModeTransport` do `@mastra/e2b`. Custo: a máquina liga na primeira conta
  da conversa (~1 s) e cada chamada em série soma ~0,3 s.
- **B. A máquina do agente alcança os mesmos três endereços do Assistente (`B1`).** Decisão 0059:
  `registry.npmjs.org`, `pypi.org` e `files.pythonhosted.org`; a máquina não tem senha nenhuma. O agente
  instala a biblioteca de gráfico que pedir, em Python ou em JavaScript. A máquina do Construtor fica
  como está, só o primeiro (decisão 0051): ele escreve TypeScript.

Não há decisão aberta do fundador neste cartão; falta a aprovação desta página (L6).

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 A forma | A avaliação da arquitetura do código de hoje para a 24.4, e o que se move ou se apaga antes: o dono das máquinas de conversa e o `show_file` com a sua rota de arquivo saem de `builder/assistant/` para `builder/machine/`, servindo Assistente, Construtor e agentes; a linha do `show_file` na conversa sai das do Assistente para uma compartilhada; o cartão ganha os nomes finais de pastas, módulos e assinaturas das U2 a U5 | `apps/server/src/builder/{machine,assistant,agents,tools,construtor}/`, `apps/edge/src/`, `packages/{hub-api,app-contract}/src/`, `apps/web/src/builder/conversation/`, `docs/steps/e244-ferramentas-em-codigo.md` | [architecture](../architecture.md) | esta página aprovada |
| U2 A ferramenta em código, escrita | O tipo `CODE` na biblioteca e na leitura do agente, a versão com código, leituras declaradas e teste; o Construtor com máquina escreve, confere, testa e grava; as rotas da pessoa recusam `CODE`; os avisos #712 e #707; a aba Ferramentas mostra **Em código**, a página da versão mostra o código e o teste, e a conversa do Construtor mostra a linha da ferramenta | `packages/hub-api/src/{tools,construtor,agent-failures}.ts`, `apps/server/src/builder/{tools,construtor,agents}/`, `apps/server/migrations/`, `apps/web/src/builder/{tools,agents,conversation}/`, `docs/reference/screens.md` | [data](../guides/data.md) | U1 |
| U3 A ferramenta em código, chamada | O namespace das ferramentas e o host delas na borda; a subida de `t-<versão>` ao gravar, a nova subida quando o Worker some e a remoção ao apagar; a rota de ferramenta atrás do Access, com a capability `data`; a operação de borda que lê pelo Hub com escopo e o limite de 50; a ferramenta fina no agente | `apps/edge/{src,wrangler.jsonc}`, `packages/{hub-api,app-contract}/src/`, `apps/server/src/platform/`, `apps/server/src/hub/{connectors,apps}/`, `apps/server/src/{main,conversations-of}.ts`, `apps/server/src/builder/{tools,agents}/`, `infra/`, `docs/how-to/apps-edge.md`, `.dependency-cruiser.cjs` | [security](../guides/security.md) | U2 |
| U4 O Computador do agente | O campo `machine` na configuração do agente; o agente com Computador recebe o workspace do dono de máquinas, a rede da decisão B e `show_file`, com a rota de arquivo da conversa do agente; a linha **Computador** nas Ferramentas do Conexus; o agente apagado e o Projeto ou a empresa removidos matam as máquinas das suas conversas | `packages/hub-api/src/agents.ts`, `apps/server/src/builder/{agents,construtor,machine}/`, `apps/web/src/builder/{agents,conversation}/` | [web](../guides/web.md) | U1 |
| U5 O modo código | `execute_typescript` sobre as ferramentas do agente com Computador (decisão A), pelo `E2BCodeModeTransport`, dentro do limite de 50; a chamada **Programa** na conversa; a medida de acerto contra só ferramentas | `apps/server/src/builder/{agents,machine}/`, `apps/web/src/builder/{agents,conversation}/` | [testing](../guides/testing.md) | U4, U3 |

A U2 e a U4 correm em paralelo depois da U1. Elas dividem `builder/agents/` em arquivos separados (a
U2 muda `agents/frozen.ts` e `tools/choice.ts`, a leitura das ferramentas; a U4 muda `agent.ts`, `controller.ts` e
`release.ts`, a máquina) e `web/builder/conversation/` em linhas separadas; o dono de máquinas e o
`show_file`, que as duas usam, saem prontos da U1. A U3 espera a U2 (lê a versão com código e entra na
gravação dela); a U5 espera a U4 (a máquina) e a U3 (a ferramenta salva também entra no programa).

**O método das unidades.** Cada unidade segue o `pstack:poteto-mode` como as skills do repositório já
o chamam ([`conexus-scope`](../../.agents/skills/conexus-scope/SKILL.md), passo 4;
[`conexus-build`](../../.agents/skills/conexus-build/SKILL.md);
[`conexus-review`](../../.agents/skills/conexus-review/SKILL.md)): `how` para ler o código de hoje,
`architect` para a forma (tipos, assinaturas, módulos) antes do código, e os princípios que ele nomeia
(subtract before you add, model the domain, boundary discipline, migrate callers then delete legacy
APIs). O cartão não repete o método.

**Orçamento de código alterado.** U1: ~550 (o dono de máquinas e o `show_file` com a rota e a linha da
conversa mudam de lugar, com os chamadores, e as emendas do cartão). U2: ~1.350 (contrato e união,
migração, a leitura do agente, as recusas, a conferência de estado de módulo, a ferramenta do
Construtor e o seu teste na máquina, os dois avisos, as três telas). U3: ~1.150 (o namespace, o host e
o Access, a subida, a nova subida e a remoção, a rota e a capability na borda, a operação de borda no
Hub, a ferramenta fina). U4: ~600 (o campo, o workspace, a rota de arquivo do agente, as mortes de
máquina, a linha na tela). U5: ~300. Total da etapa: ~3.950, no limite da regra L2: se a avaliação da
U1 somar mais, a etapa se divide antes da U2 (U5 vira a etapa seguinte).

**O que a avaliação da U1 mediu** (2026-11-05). A U1 mudou ~430 linhas de código fora dos testes, dos
scripts e da documentação (248 somadas, 183 tiradas, contadas com os arquivos movidos como movidos, com
a rodada de conserto da revisão), abaixo das ~550. O raio de hoje deixava de fora ~150 a 250 linhas que as unidades seguintes precisam e que as
seções abaixo agora nomeiam: parar a máquina no fim do turno e no fim do Hub no Construtor e nos agentes
(U2, U4, ~40), a ligação em `main.ts` e `conversations-of.ts`, `removeWorkers` saindo de `hub/apps/` e
as chaves de configuração (U3, ~100 a 150), `Plan.machine` (U4, ~10) e o transporte do modo código em
`builder/machine/` (U5, ~15). A etapa fica entre ~3.950 e ~4.150: na linha da regra L2, sem passar dela
com folga. Fica a saída que este cartão já dá: se a U3 passar de ~1.250, a U5 vira a etapa seguinte.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Depois da U1, o Assistente abre, pausa e mata a máquina de uma conversa e mostra um arquivo como antes (os testes de hoje passam sem mudar a asserção); o dono de máquinas e o `show_file` vivem em `builder/machine` e se importam pelo `public.ts` dele; um import de `builder/assistant/machine.ts` ou `show-file.ts` não resolve mais | os testes de `builder/assistant/{machine*,show-file,file*}.test.ts` de hoje, movidos sem mudar asserção; `npm run deps` | must |
| 2 | U2 | O Construtor grava uma ferramenta `CODE` só depois de o teste dela passar na máquina; uma ferramenta cujo teste falha não entra na biblioteca e o Construtor diz o erro | `builder/construtor/code-tool.test.ts`, pela porta `test-construtor.ts`: teste que passa grava a versão 1; teste que falha devolve `TOOL_TEST_FAILED` e nenhuma linha | must |
| 3 | U2 | Uma versão de ferramenta `CODE` nunca muda depois de gravada; uma mudança grava a versão seguinte, e o agente publicado abre e continua na que prendeu | `builder/construtor/code-tool.test.ts`: `tool_code_save` duas vezes pela porta do Construtor, depois o agente publicado aberto pela leitura de `frozen.ts` | must |
| 4 | U2 | A página da versão mostra o código e o resultado do teste; quem não pode ver Ferramentas (o membro) recebe 404, como hoje | `apps/web/src/builder/tools/tool-page.test.tsx`; `builder/tools/routes.test.ts`, rota com sessão de membro | must |
| 5 | U2 | A ferramenta `CODE` declara as leituras de uma ligação; gravar com uma ligação que o Projeto não recebeu é recusado como hoje, `TOOL_REFUSED` com `{ field: 'connectionId', reason: 'NOT_OFFERED' }` (`check.ts:56-58`) | `builder/construtor/code-tool.test.ts`, pela porta do Construtor | must |
| 6 | U2 | As rotas da pessoa, criar ferramenta e gravar versão, recusam uma ferramenta `CODE` com `TOOL_REFUSED` e `reason: 'CODE_BY_CONSTRUTOR'`; nada muda | `builder/tools/routes.test.ts`, pela porta HTTP | must |
| 7 | U2 | Um código que guarda estado mutável no nível do módulo (um `let` ou `var` de fora da função, uma coleção de fora que a função muda) é recusado antes do teste com `TOOL_REFUSED` e `reason: 'MODULE_STATE'`; nada é gravado | `builder/construtor/code-tool.test.ts`, pela porta do Construtor, com a regra rodando de verdade no kit dublê | must |
| 8 | U2 | Uma versão gravada sobre uma versão que não é mais a última (duas abas, ou o Construtor e uma aba) é recusada com `TOOL_REFUSED` e `reason: 'STALE_VERSION'`, e a tela diz que há versão mais nova (#707); a gravação repetida de uma ferramenta cuja ligação saiu do Projeto devolve `TOOL_NOT_FOUND`, não 500 (#712) | `builder/tools/routes.test.ts`; `apps/web/src/builder/agents/tool-form.test.tsx` | must |
| 9 | U3 | O agente chama a ferramenta salva e recebe o resultado calculado na Cloudflare; a versão sobe ao gravar como `t-<toolVersionId>`, sem binding e sem segredo | `apps/edge/src/tools.test.ts` (Miniflare, namespace dublê que guarda os metadados da subida) e `builder/agents/code-tool.test.ts` pela porta do Hub | must |
| 10 | U3 | A ferramenta que pede uma leitura que não declarou recebe `NOT_DECLARED`; a que tenta a internet recebe 403 da parede; a que passa da CPU devolve ao modelo `TOOL_FAILED`, e o agente segue | `apps/edge/src/tools.test.ts`; os três casos provados no protótipo (`Worker exceeded CPU time limit.`, 403, `NOT_DECLARED`) | must |
| 11 | U3 | A 51ª leitura de dados de uma resposta, somando `connector_read` e as ferramentas salvas, é recusada; uma leitura cujo `toolVersionId` não é da empresa ou do agente do turno é recusada com `NOT_DECLARED` | `hub/connectors/tool-door.test.ts`: a chave do turno chega à borda e volta | must |
| 12 | U3 | Um pedido ao host das ferramentas sem o `Cf-Access-Jwt-Assertion` do Access, com outro público ou vencido, é recusado com 403 antes de chegar a um Worker | `apps/edge/src/tools.test.ts` (Miniflare, chaves de teste no lugar das do Access) | must |
| 13 | U3 | Uma versão cujo Worker sumiu ("Worker not found.") sobe de novo do módulo gravado e responde; com a Cloudflare fora, devolve ao modelo `TOOL_UNAVAILABLE`, e a ferramenta de conector do mesmo agente continua funcionando | `builder/agents/code-tool.test.ts` | must |
| 14 | U3 | Apagar uma ferramenta `CODE` tira os Workers das versões dela antes das linhas; com a Cloudflare fora, a remoção é recusada com `TOOL_UNAVAILABLE` e nada muda; a remoção da empresa tira os Workers de ferramenta dela | `builder/tools/routes.test.ts`; o teste da remoção da empresa de hoje, com o caso novo | must |
| 15 | U4 | O agente com Computador roda um comando, escreve um arquivo e o mostra com `show_file`, e o arquivo aparece ao lado da conversa do agente; um caminho fora da pasta da conversa é recusado (`SHOW_REFUSED`), e a rota de arquivo dá 404 a quem não pode ler a conversa; a máquina só liga na primeira ferramenta que precisa dela, e um agente sem Computador não recebe nenhuma ferramenta de máquina | `builder/agents/machine.test.ts` (kit dublê); `apps/web/src/builder/conversation/shown-file.test.tsx` | must |
| 16 | U4 | A máquina do agente recebe a lista da decisão B; um endereço de fora da lista é recusado | `builder/agents/machine.test.ts`, a lista passada ao kit; caso opcional com o E2B de verdade, que tenta um endereço de fora (T13) | must |
| 17 | U4 | Apagar o agente, remover o Projeto ou a empresa mata a máquina de cada conversa que vai embora, a do Construtor também; repetir não falha | `builder/agents/release.test.ts` e o teste de remoção do Construtor, pela rota de apagar agente e pela remoção da empresa, com o kit dublê contando as mortes | must |
| 18 | U4 | Uma versão publicada antes desta etapa abre com Computador desligado | `builder/agents/frozen.test.ts`, uma configuração sem o campo | must |
| 19 | U5 | O agente com Computador recebe `execute_typescript`; o programa chama as ferramentas do agente pelo Hub, com o mesmo limite de 50; um agente sem Computador não o recebe | `builder/agents/code-mode.test.ts`, com o transporte padrão do Mastra sobre o `LocalSandbox`; caso opcional com o E2B de verdade e o `E2BCodeModeTransport` | must |
| 20 | U5 | A conversa mostra a chamada **Programa** com o resultado; um programa que falha mostra o erro e o agente responde sem inventar o número | `apps/web/src/builder/conversation/program-call.test.tsx` | must |
| 21 | U5 | Numa conta da OpenAI no Hub, os três pedidos de exemplo rodam 3 vezes com modo código e 3 só com ferramentas; o relatório da unidade traz acertos, tokens e tempo, antes do código da U5 | relatório da U5, fora do repositório (L21) | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Aba Ferramentas, a linha **Em código** | a linha nova, com o selo | a lista de hoje, sem linha | o esqueleto de hoje | a falha de leitura de hoje | — | o membro não vê a aba, como hoje | — |
| Página da versão de uma ferramenta `CODE` | o código e "Teste passou" | — | esqueleto | falha de leitura com Tentar de novo | 404 de hoje | 404 para o membro | — |
| A linha da ferramenta do Construtor na conversa | "Escrevendo e testando uma ferramenta" | — | a mesma frase, com o tempo | "O teste não passou" e o erro | — | — | a recusa dita pelo Construtor (`NOT_OFFERED`, `MODULE_STATE`, `STALE_VERSION`) |
| Nova versão de uma ferramenta, na aba | a de hoje | — | a de hoje | a de hoje | — | — | "Há uma versão mais nova" com Recarregar (#707) |
| **Computador** nas Ferramentas do Conexus | desligado | — | — | a falha de gravar do rascunho de hoje | — | o que a linha **Pesquisar na web** faz hoje para quem não muda o rascunho | — |
| O arquivo ao lado da conversa do agente | o arquivo, como no Assistente | — | "Preparando um arquivo para mostrar" | "Não conseguiu mostrar o arquivo" | o arquivo que a máquina não tem mais | — | o caminho recusado, dito pelo agente |
| Chamada **Programa** na conversa | a chamada com o resultado | — | "Rodando o programa" | a mensagem de erro do programa | — | — | "O programa passou do tempo" |

O desenho da linha **Computador** é o da linha **Pesquisar na web** (`chooser.tsx:256-265`,
`tools-section.tsx:23-35`), com o ícone de computador; o arquivo ao lado é o do Assistente
(`assistant-specs.ts:25`, `assistant/file.tsx`), que a U1 torna compartilhado; o selo **Em código** e o
bloco de código da versão são peças novas, desenhadas na U2 pela [Pauta](../../DESIGN.md), e as caixas
abaixo.

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
| `ToolSummary.kind` (`PRESET` ou `CODE`) | U2, o serviço de ferramentas | a aba Ferramentas (o selo); o Construtor (`tool_search` acha as `CODE`, e `agent_set` as põe num rascunho como as outras) |
| `CodeToolVersion.source` | U2, o Construtor | a página da versão |
| `CodeToolVersion.module` (o JavaScript empacotado) | U2, na máquina | U3, a subida e a nova subida; nunca a leitura do agente (`frozen.ts`) |
| `CodeToolVersion.reads` | U2 | U3, a porta do Hub (relida pelo `toolVersionId`) |
| `CodeToolVersion.test` (passou, linhas lidas, quando) | U2 | a página da versão |
| `CodeToolVersion.inputSchema`, `outputSchema` (JSON Schema) | U2 | U3, a ferramenta fina no agente |
| `AgentConfig.machine` | U4, o rascunho e a publicação | U4, `agentOf`; U5, o modo código; a tela |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Gravar a versão de uma ferramenta `CODE` (U2) | a mesma tentativa: a chave é o id da chamada do Construtor (`construtor/tools.ts:78-84`) e a segunda acha a primeira; duas gravações diferentes da mesma ferramenta: a única `tool_version_tool_id_number_key` (`tables.ts:61`) deixa uma, e a outra recebe `STALE_VERSION` | o teste passou e o banco caiu: nada gravado, o Construtor tenta de novo com a mesma chave | máquina fora: `MACHINE_UNAVAILABLE`, nada gravado | `TOOL_TEST_FAILED`, `TOOL_REFUSED` com a razão ou `MACHINE_UNAVAILABLE`, sem o código | 2, 3, 5, 7, 8 |
| Subir `t-<toolVersionId>` ao gravar (U3) | o PUT é idempotente pelo nome do script | gravou e a subida falhou: a versão fica, e a primeira chamada sobe de novo do `module` | Cloudflare fora: a versão fica gravada e a chamada devolve `TOOL_UNAVAILABLE` | o código de falha da Cloudflare, sem o token (S36) | 9, 13 |
| Chamar a ferramenta (U3) | duas chamadas são dois pedidos; o código não guarda estado de módulo (critério 7) | o Worker respondeu e a resposta se perdeu (502, corte): a leitura não escreve, o modelo pode repetir | a borda ou o Hub fora: `TOOL_UNAVAILABLE`; prazo de 10 s da 0047 | `TOOL_FAILED`, `TOOL_UNAVAILABLE`, sem a entrada | 10, 11, 12, 13 |
| Apagar uma ferramenta `CODE` (U3) | os Workers saem pelo nome `t-<toolVersionId>` de cada versão, e tirar duas vezes não falha | tirou os Workers e a linha não saiu (em uso, 23503): a ferramenta fica, e a próxima chamada sobe de novo | Cloudflare fora: `TOOL_UNAVAILABLE`, nada muda | `TOOL_DELETED` com a contagem de Workers | 14 |
| Gravar `machine` no rascunho do agente (U4) | a revisão do rascunho de hoje | o de hoje | o de hoje | o de hoje | 18 |
| Ligar a máquina do agente (U4, `E2BSandbox.start`) | a fila por conversa do dono de máquinas (`inLane`) | ligou e o turno caiu: a máquina pausa no fim do turno ou no timeout | E2B fora ou 429: `MACHINE_UNAVAILABLE`; o SDK espera o `Retry-After` | `MACHINE_UNAVAILABLE` com a razão | 15 |
| Ler o arquivo da máquina para a tela (U4) | duas leituras leem o mesmo arquivo | a máquina pausou: a leitura a religa pela fila | E2B fora: "Não conseguiu mostrar o arquivo" | `MACHINE_UNAVAILABLE`, sem o caminho completo | 15 |
| Matar a máquina de uma conversa que sai (U4) | matar duas vezes não falha (`releaseThreads`, `controller-kit/release.ts:14-25`) | a sessão saiu e a morte falhou: a remoção seguinte acha a conversa de novo | E2B fora: a remoção falha e se repete | a contagem de conversas removidas | 17 |
| Rodar o programa (U5, `execute_typescript`) | cada programa é um processo seu na máquina | passou de 30 s: `TimeoutError`, o modelo recebe o erro | a máquina caiu: o `retryOnDead` do transporte, depois erro | o erro do programa, sem os dados | 19, 20 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Onde mora o dono das máquinas de conversa | U1 | `apps/server/src/builder/assistant/machine.ts:251-282` (workspace, `sandboxCacheKey`) | `mastra@6e8dfcb8` `mastracode/factory/src/workspace.ts:1669-1698` | O Factory monta um `Workspace` por sessão com o `sessionSandbox`, um dono só (lido) | nativo (só muda de lugar) | — | não precisa | `apps/server/src/builder/machine/conversation.ts` |
| Mostrar o arquivo da máquina | U1, U4 | `builder/assistant/show-file.ts:59-64` (recebe a pasta e o `serving` de `AssistantMachines`); `assistant/file-route.ts`, `routes.ts:320`; `packages/hub-api/src/assistant.ts:15,93,322-327`; `web/builder/conversation/assistant-specs.ts:25` | nenhuma faz (Mastra, Factory: a interface lê o arquivo) | — | embrulhado (o do Assistente, um dono só depois da U1) | — | "H1 / W1 / Ba / Sa", 2026-10-31 | `apps/server/src/builder/machine/{show-file,conversation-file,file-route}.ts`; `packages/hub-api/src/machine.ts`; `apps/web/src/builder/conversation/{shown-file.tsx,machine-specs.ts}` |
| A ferramenta em código no contrato da biblioteca | U2 | `packages/hub-api/src/tools.ts:76-90`; `builder/tools/tables.ts:19-21` (`kind`, "`CODE` joins with step 24.4"; `operation` `notNull`) | `@mastra/core@1.82.0` `createTool` (`dist/docs/references/reference-tools-create-tool.md`) | Uma ferramenta é id, descrição, esquemas e `execute` (lido) | nativo | — | não precisa | `packages/hub-api/src/tools.ts` |
| A leitura do agente com uma ferramenta `CODE` | U2 | `builder/agents/frozen.ts:30-33,45-58` (`ToolVersionConfigSchema.parse`, `OperationId.parse` em cada versão) | o mesmo `createTool` | Cada ferramenta do agente é uma variante pelo `kind` (C21) | nativo | — | não precisa | — |
| O Construtor escreve e testa na máquina | U2 | `builder/construtor/construtor.ts:221` ("with no machine"); `builder/assistant/machine.ts` | `@mastra/e2b@0.16.1` `E2BSandbox`; `@mastra/core` `Workspace` com resolver (`docs-sandbox-overview.md:185-224`) | A máquina por conversa vem de um resolver com `sandboxCacheKey` (lido; provado no item 7) | nativo | — | não precisa | `apps/server/src/builder/construtor/code-tool.ts` |
| Conferir o estado de módulo | U2 | nenhum: a S5 cita "the Builder's lint", que não existe no `main` | Biome com regra GritQL, a forma das regras do repositório (`scripts/conexus-code.grit`, `biome.json:255`) | Uma regra de forma recusa o código antes do teste (lido) | nativo | — | não precisa | a regra da ferramenta, nome na U2 |
| Empacotar a ferramenta | U2 | nenhum | `esbuild` (`@mastra/e2b@0.16.1` o usa, `dist/index.js:2974` `transformSync`) | `esbuild` transforma TS em um módulo (lido) | nativo | — | não precisa | — |
| Guardar a versão com código | U2 | `builder/tools/tables.ts:44-70` (`tool_version.config jsonb`) | o estudo de carga `C3` ("code in the Hub DB (version)"); o estudo do Construtor `3.3` dizia Git e R2, antes da biblioteca da empresa (`T1`, 2026-11-02) | A versão é imutável e guarda o que roda (lido) | nativo (Drizzle) | — | `T1`, 2026-11-02 | migração nova |
| A aba e a página da ferramenta | U2 | `apps/web/src/builder/tools/{tools-tab,tool-page}.tsx` | nenhuma no código instalado; o estudo do Construtor `1.6` diz que o Studio do Mastra mostra o código em leitura | — | nativo (as peças da Pauta) | — | não precisa | — |
| Subir a versão como Worker | U3 | `apps/server/src/platform/cloudflare.ts:200-219,276-293` (`v-<id>`, `bindings: []`, `limits`, `tags`) | `vibesdk@9da158d` `worker/services/deployer/api/cloudflare-api.ts:131`; Cloudflare WfP (documentado) | PUT do script no namespace (lido; provado no item 1: p50 1.084 ms) | nativo | — | não precisa | `apps/server/src/platform/cloudflare.ts` |
| Tirar os Workers de uma ferramenta | U3 | `hub/apps/prune.ts:85-96` (`removeWorkers`); `hub/apps/removal.ts:116` (`removeCompanyWorkers`); `builder/tools/tools.ts:233-250` (`remove`) | o mesmo `removeWorkers` dos apps | Um DELETE por nome de script, fora da transação (lido) | nativo | — | não precisa | — |
| O namespace e o host das ferramentas | U3 | `apps/edge/wrangler.jsonc:7-16` (`conexus-apps`, saída `conexus-outbound`, rota `*.conexusapp.tech/*`); `packages/hub-api/src/address.ts:39-46` (um app tem rótulo de duas partes) | estudo de runtime `(a)`: um namespace à parte; WfP (documentado) | Um segundo binding de namespace com a mesma parede (provado no item 1); o host `tools.conexusapp.tech`, de uma parte só, nunca é de um app | nativo | — | não precisa | `apps/edge/wrangler.jsonc` |
| Despachar a ferramenta com a capability | U3 | `apps/edge/src/dispatch.ts:124-170` (`DISPATCHER.get`, `props`, `limits`, prazo); `dispatcher.ts:39-56` (`Connectors`) | Cloudflare WfP, `get(nome, args, { outbound, limits })` e `ctx.exports` (documentado); `vibesdk@9da158d` `worker/index.ts:202-205` (só o `get` sem `props`) | A capability é um `WorkerEntrypoint` em `props` (provado no item 1, fora do repositório) | nativo | — | não precisa | `apps/edge/src/tools.ts` |
| A capability `data` lê pelo Hub | U3 | `apps/edge/src/connectors.ts:26-48`; `packages/hub-api/src/project-connections.ts:128-145` (`callAppConnector`, `access: 'edge'`); `hub/apps/routes.ts:86-87` (S48) | a mesma forma da capability dos apps (herdado, 0041) | Workers VPC até o ouvinte de borda do Hub (herdado) | nativo | — | não precisa | `packages/hub-api/src/project-connections.ts` |
| O Hub chama a borda | U3 | nenhum: hoje só a borda chama o Hub | Cloudflare Access, token de serviço diante do host, e o Worker confere o `Cf-Access-Jwt-Assertion` contra as chaves da equipe e o público (documentado; não rodado) | O Access recusa sem token; o Worker recusa sem JWT válido | nativo, a provar no passo 1 da U3 | se o Access não servir, volta ao fundador com a prova antes do código | não precisa, se nativo | `apps/server/src/platform/edge-tools.ts` |
| A ferramenta fina no agente | U3 | `builder/agents/agent.ts:186-207` (`tools`), `builder/agents/tools.ts:33` (`presetTools`) | `@mastra/core@1.82.0` `createTool` (`reference-tools-create-tool.md`) | `execute` chama a borda e devolve o resultado (lido) | embrulhado: o nosso põe o escopo e a chave do turno | — | não precisa | `apps/server/src/builder/agents/code-tools.ts` |
| O limite de 50 leituras | U3, U5 | `hub/connectors/builder-port.ts:18-60` (`CONNECTOR_CALLS_PER_TURN`); `controller-kit/turns.ts:99-114` | `@mastra/core@1.82.0` `tools-BVDic2bB.js:478-486` (o modo código passa `requestContext`) | A chave do turno vem do `requestContext` (lido; provado no item 5) | nativo | — | não precisa | — |
| A chave Computador | U4 | `packages/hub-api/src/agents.ts:21-36` (`web`, `appData`); `builder/agents/agent.ts:172-209` (sem `workspace`); o Assistente passa `workspace` em `assistant.ts:336` | `@mastra/core@1.82.0` `workspace` por pedido (`docs-sandbox-overview.md:52-56,228-230`) | Quem recebe um `workspace` ganha as ferramentas de máquina (lido) | nativo | — | "Concordo e aprovo", 2026-11-05 | `packages/hub-api/src/agents.ts` |
| A máquina do agente e a rede | U4 | `builder/machine/e2b.ts:15-32`; `builder/machine/kit.ts` (`PACKAGE_HOSTS`, 0059, desde a U1; antes `ASSISTANT_HOSTS` em `assistant/machine.ts:22`); `machine/kit.ts:24` (0051) | `@mastra/e2b@0.16.1` `E2BSandbox({ network, lifecycle })` | rede negada menos a lista; pausa no timeout (lido; provado nos itens 2 e 5) | nativo | — | decisão B | — |
| Quem mata a máquina de uma conversa que sai | U4 | `builder/assistant/release.ts:28` e `routes.ts:245` (`releaseThreads` com `machines.kill`); `builder/agents/open.ts:77`, `controller.ts:235` e `construtor/construtor.ts:267` (`releaseThreads` sem matar) | `@mastra/core@1.82.0` `docs-sandbox-overview.md:224,305` ("Your application owns sandboxes returned by a resolver"); E2B, pausada "indefinitely" (documentado) | O dono destrói; o provedor não mata a pausada (provado no item 7) | nativo | — | não precisa | — |
| O modo código | U5 | nenhum; o `@mastra/e2b` só entra por `builder/machine/` (`.dependency-cruiser.cjs:116-123`, `e2b-only-in-the-machine`) | `@mastra/core@1.82.0` `createCodeMode` (`docs-agents-code-mode.md:30,137-149`; `reference-tools-create-code-mode.md:61,67`); `@mastra/e2b@0.16.1` `E2BCodeModeTransport` | O programa roda isolado; as ferramentas, no host; o transporte é o segundo argumento (lido; provado no item 5) | nativo | — | decisão A | `apps/server/src/builder/agents/code-mode.ts` |
| A chamada Programa na conversa | U5 | `apps/web/src/builder/conversation/` (as chamadas de hoje, `assistant-specs.ts`, `construtor-specs.ts`) | as chamadas de hoje | Uma chamada como as outras (lido) | nativo | — | não precisa | — |

Procurado: Mastra instalado (`node_modules/@mastra/{core,e2b}/dist` e `dist/docs`), a estante
`mastra-1.82` (`6e8dfcb8`, Factory), `vibesdk` (`9da158d`), `cloudflare-agents` (`786d30e`, codemode),
docs da Cloudflare (WfP, Access, preços), docs do E2B (persistência, limites, preços), e os estudos
`agent-machine-study`, `agent-runtime-study`, `agent-runtime-load` e `construtor-study`. O que mudou
desde eles: a máquina do template tem ~2 GB, não 4 GiB (medido); o Factory monta o workspace em
`workspace.ts:1669-1698`, não `1694-1714`; a ferramenta em código mora na biblioteca da empresa (`T1`),
então o código fica na versão, não no Git de um Projeto; o modo código pela máquina custa uma ida e
volta por chamada (medido).

**Depois da U1** (a emenda é lida como delta, L9). As linhas "Hoje no main" das duas primeiras peças
são o `main` de antes da U1; depois dela: o dono é `builder/machine/conversation.ts`
(`createConversationMachines`, tipo `ConversationMachines`), o `locate` e o `withFile` são
`builder/machine/conversation-file.ts`, o `show_file` é `builder/machine/show-file.ts` (`showFileTool`),
a rota de arquivo é `builder/machine/file-route.ts` (`registerFile`), e `ShownFile`, `SHOWN_TEXT_MAX`,
`ShowFileInput`, `MACHINE_TOOL`, `MachineFileQuery` e `MACHINE_FILE_FAILURES` são
`packages/hub-api/src/machine.ts`; na web, o painel é `conversation/shown-file.tsx` (`FilePanel`) e a
linha do `show_file` é `conversation/machine-specs.ts` (`MACHINE_SPECS`). Linhas que andaram no `main`
de `866fca4d`: `hub-api/src/assistant.ts:93` é `assistantFilePath` (as peças que saíram eram `:65-91`);
`ASSISTANT_FILE` é `:321-340`; `builder/tools/tables.ts:44-67`; `hub/connectors/builder-port.ts:18-67`;
`builder/tools/tools.ts:233-251`; `platform/cloudflare.ts:274-293`; `choice.ts` é `builder/tools/choice.ts`,
não `builder/agents/`. As outras linhas citadas conferem.

**A medida do transplante.** Nada vem do produto antigo. O dono de máquinas e o `show_file` do
Assistente mudam de lugar na U1 com os seus testes, sem mudar o que fazem.

**A dívida.**

- A arquitetura (§8) lista uma limpeza diária de máquinas ociosas que não achei no `main` em
  `0d535e2a` (`killStale`, `machine/kit.ts:171`, mata só as de um template velho da mesma conversa); a
  U1 confirmou (os únicos chamadores de `killStale` são as partidas de máquina, e nenhum relógio do
  servidor toca máquinas), e a falta é a issue #778, com o label `next-card`. Esta etapa mata as máquinas das conversas
  que saem (critério 17), não as que ficam paradas.
- A S5 cita "the Builder's lint", que não existe no `main`; a regra da U2 cobre a ferramenta, e a
  emenda do guia vai ao fechamento. A `S4` fala só do handler de app; a ferramenta gerada recebe só
  `data`; a emenda vai ao mesmo fechamento.
- A arquitetura (§5, `docs/architecture.md:94`) só desenha o Hub subindo versões para a borda; a U3 soma
  o Hub chamando a borda (`edge-tools.ts`). É emenda de texto da §5 no fechamento, não uma fronteira
  nova: nenhuma peça desta etapa pede um módulo entre Hub e Builder (avaliação da U1).
- Na mesma instância de `E2BSandbox`, `start()` depois de `stop()` não religou (medido); o Hub usa
  instância nova e não é afetado. Fica anotado em `stack.md` no fechamento.

## U1 A forma

**Base e modelo.** `main` do dia. Opus: é desenho entre módulos (máquinas, ferramentas, agentes, borda).

### As linhas da tabela

"Onde mora o dono das máquinas de conversa" e "Mostrar o arquivo da máquina". Ler
`builder/assistant/{machine,machine-file,show-file,file-route,routes,release,assistant}.ts`, `kit.ts`,
`machine/public.ts`, `machine/machines.ts` (o dono das máquinas do Builder), o `Workspace` do Factory
(`mastracode/factory/src/workspace.ts:1669-1698`) e, na web, `conversation/assistant-specs.ts` e
`assistant/file.tsx`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/machine/` | Cria o dono das máquinas de conversa e o `show_file` com a rota de arquivo | Assistente; depois Construtor (U2) e agentes (U4) |
| `apps/server/src/builder/assistant/` | Apaga `machine.ts`, `machine-file.ts` e `show-file.ts` daqui, troca os imports; a rota de arquivo passa a ser registrada pelo dono novo | `assistant.ts:336`, `routes.ts:320`, `release.ts` |
| `packages/hub-api/src/` | Move `ShownFile` e o limite do texto mostrado de `assistant.ts` para um módulo da máquina; `ASSISTANT_TOOL.showFile` passa a ler o id compartilhado | servidor, web |
| `apps/web/src/builder/conversation/` | Move a linha do `show_file` de `assistant-specs.ts` para uma compartilhada, e o arquivo ao lado de `assistant/file.tsx` para `conversation/` | Assistente; depois agentes (U4) |
| `docs/steps/e244-ferramentas-em-codigo.md` | Muda as seções U2 a U5 | os construtores das unidades |
| `apps/server/src/builder/runs/{ports,public,test-runs}.ts` (emenda da U1) | Muda: a porta da máquina de conversa e a sua sintonia passam a `conversationMachine` e `machineTuning`, do tipo `ConversationMachine`; a dublagem sai para `machine/test-conversation-machines.ts` | `main.ts`, os testes |
| `apps/server/src/{main,conversations-of}.ts` (emenda da U1) | Muda: só o tipo e o nome da porta (`machine: deps.conversationMachine`) | o Hub |
| `tests/e2e/live-hub.ts` (emenda da U1) | Muda: o Hub de ponta a ponta passa `conversationMachine` de `testBuilderPorts` | os testes de ponta a ponta |
| `.dependency-cruiser.cjs` (emenda da U1) | Muda: a dublagem nova entra nas portas de teste | — |
| `scripts/{removals,server-test-seconds}.json` (emenda da U1) | Muda: as linhas de remoção e os tempos dos testes que mudaram de arquivo | CI |
| `apps/web/src/builder/assistant/{conversation.tsx,text.ts}` (emenda da U1) | Muda: `conversation.tsx` passa `urlOf` ao `FilePanel`; `FILE_EMPTY` sai de `text.ts` para `conversation/text.ts` | o Assistente |
| `docs/approvals.md` (emenda da U1) | Muda: a linha de aprovação desta emenda (L6, L9) | `npm run approval` |

Apaga: os três arquivos do Assistente acima, na mesma onda dos chamadores.

### Os contratos que a unidade cria

- O dono das máquinas de conversa, um tipo só (C26), com `workspace(requestContext)`, `stop`,
  `stopAll`, `kill`, `serving` e `folder` como hoje (`AssistantMachines`), parametrizado pela lista de
  rede e pela marca de quem o usa. Construído (emenda da U1): `createConversationMachines(deps:
  ConversationMachine & { log: FailureLog; hosts: readonly string[]; marksOf(requestContext:
  RequestContext): Promise<Record<string, string> | undefined> }, tuning?: MachineTuning):
  ConversationMachines`. Quem usa passa a sua lista (`PACKAGE_HOSTS`, 0059, ou `ALLOWED_HOSTS`, 0051) e
  as suas marcas (S36); `undefined` fora de uma conversa sua, que não ganha máquina. A união
  `'assistant' | 'construtor' | 'agents'` não foi criada: nada ramifica por ela, e cada usuário passa
  os seus valores (laziness: um parâmetro a menos). `AssistantMachine` e `AssistantMachineApi` de
  `machine/kit.ts` viraram `ConversationMachine` e `ConversationMachineApi`.
- `show_file` e a rota de arquivo, parametrizados pelo dono da conversa: a rota de cada dono confere
  quem pode ler aquela conversa, e o `show_file` só lê dentro da pasta dela (`SHOW_REFUSED` fora).
  Construído: `showFileTool(machines: Pick<ConversationMachines, 'folder' | 'serving'>)`, id
  `MACHINE_TOOL.showFile`; `registerFile(app, { route, machines, log, served, ownConversation })`,
  `route` com `url`, `params`, `query` e `failures` do contrato (o do Assistente, `ASSISTANT_FILE`, lê
  `MachineFileQuery` e `MACHINE_FILE_FAILURES`), `served` a linha do log (C54). Na web,
  `FilePanel({ urlOf: (path) => string, shown, onClose?, inSheet? })`.
- Os nomes finais e as assinaturas descem às seções U2 a U5.
- O arquivo tomado como modelo: `builder/assistant/machine.ts` cumpre C21 (o `found` da sessão), C23
  (`ConversationId` marcado) e C26 (um dono); sai dele sem mudar a forma.

### As skills e a leitura

`mastra` (`@mastra/core`, `@mastra/e2b`: `node_modules/@mastra/{core,e2b}/dist/docs/` primeiro);
`fastify-best-practices` para a rota de arquivo; o `shadcn` só se a linha da web mudar de peça.

### A ordem do trabalho

1. `how` sobre `builder/machine`, `builder/assistant/machine.ts`, `show-file.ts`, `builder/agents`,
   `builder/tools`, `apps/edge/src` e `platform/cloudflare.ts`, contra `docs/architecture.md`,
   `docs/reference/stack.md`, os guias de código (C3 a C8, C26, C56) e de segurança (S4, S5, S36, S48)
   e as referências da tabela.
2. Escreve, no pull request, a avaliação: para cada peça da 24.4, a pasta e o módulo onde entra, o que
   se move ou se apaga antes, e a forma nativa (`architect`).
3. Move o dono das máquinas e o `show_file` para `builder/machine/`, migra os chamadores e apaga o
   lugar antigo na mesma onda; move a linha da web. Rodam os testes de hoje do Assistente.
4. Emenda as seções U2 a U5 deste cartão com os nomes e as assinaturas; a emenda é lida como delta
   ([delivery L9](../guides/delivery.md)).

### Como se prova

Critério 1: os testes de máquina, de arquivo e de `show_file` do Assistente passam sem mudar asserção,
nas gravações de hoje (nenhuma nova); `npm run deps` passa com os imports novos, e um import do lugar
antigo falha porque o arquivo não existe. Hoje nenhum teste falha: a unidade não muda comportamento.

### Parar se

A avaliação mostrar que uma peça precisa de um lugar que muda uma fronteira da arquitetura (um módulo
novo entre Hub e Builder), ou que a etapa passa de ~4.000 linhas: volta ao cartão antes da U2.

## U2 A ferramenta em código, escrita

**Base e modelo.** Depois da U1. Sonnet.

### As linhas da tabela

"A ferramenta em código no contrato", "A leitura do agente com uma ferramenta `CODE`", "O Construtor
escreve e testa na máquina", "Conferir o estado de módulo", "Empacotar", "Guardar a versão com código",
"A aba e a página da ferramenta". Ler `packages/hub-api/src/{tools,construtor,agent-failures}.ts`,
`builder/tools/{tables,store,tools,check,routes,choice}.ts`, `builder/agents/frozen.ts`,
`builder/construtor/{tools,construtor,test-construtor}.ts`, `apps/web/src/builder/tools/`,
`apps/web/src/builder/agents/tool-form.tsx` e `web/builder/conversation/construtor-specs.ts`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/tools.ts` | Muda: `ToolKind`, a versão como união, `CodeToolVersion`, as razões novas de `TOOL_REFUSED` | servidor, web |
| `packages/hub-api/src/construtor.ts` | Muda: `CONSTRUTOR_TOOL.toolCodeSave` | servidor, web |
| `packages/hub-api/src/agent-failures.ts` | Muda: `TOOL_TEST_FAILED` | servidor, web |
| `apps/server/src/builder/tools/` | Muda: a versão `CODE`, a trava de `kind`, a recusa das rotas da pessoa, `STALE_VERSION`, #712 em `store.ts:112-113` | Construtor, agentes |
| `apps/server/src/builder/agents/` | Muda: `frozen.ts` lê a união | o agente |
| `apps/server/src/builder/tools/choice.ts` | Muda: a escolha lê a união | o agente |
| `apps/server/migrations/` | Cria duas migrações (abaixo) | — |
| `apps/server/src/builder/construtor/` | Cria `code-tool.ts`, a ferramenta `tool_code_save`, e a regra de estado de módulo; muda `construtor.ts`: o dono de máquinas da U1, o fim do turno que o para, `close` e `ends.onPhase` | o Construtor |
| `apps/web/src/builder/tools/` | Muda: selo, página da versão | — |
| `apps/web/src/builder/agents/tool-form.tsx` | Muda: "Há uma versão mais nova" (#707) | — |
| `apps/web/src/builder/conversation/construtor-specs.ts` | Muda: a linha de `tool_code_save` | — |
| `infra/e2b/template.ts` | Muda: o Biome no template, para a regra de estado de módulo | o Construtor |
| `docs/reference/screens.md` | Muda: as telas novas | — |
| `.dependency-cruiser.cjs` | Muda, se a porta de teste nova pedir | — |

Apaga: nada.

### Os contratos que a unidade cria

- `ToolKind = 'PRESET' | 'CODE'` em `ToolSummary.kind`.
- A versão é uma união pelo `kind` (C21): `PRESET` com `ToolVersionConfig` de hoje; `CODE` com
  `{ description, source, module, reads: OperationId[], inputSchema, outputSchema, test: { passed:
  true, rows: number, at: string } }`, `source` e `module` com um tamanho máximo que a U2 fixa sobre a
  maior ferramenta do teste e abaixo do limite de script da Cloudflare, com a razão. Os esquemas são
  JSON Schema gerados do Zod do código pelo `z.toJSONSchema` na máquina; o Hub os valida com Zod na
  entrada (C27).
- `FrozenVersion.tools` vira uma união pelo `kind`: `PRESET` como hoje; `CODE` com
  `{ toolVersionId, slug, connectionId, reads, description, inputSchema, outputSchema }`, sem `module`
  nem `source` (a leitura do agente não carrega o código).
- `tool.operation`: a primeira migração o torna opcional e soma a trava `(kind = 'PRESET') =
  (operation IS NOT NULL)`, com a linha `-- contract: a ferramenta CODE lê várias operações, guardadas
  na versão`; a segunda troca a trava de `kind` por uma que aceita `CODE`, com a sua linha `--
  contract: a trava passa a aceitar CODE`. Nenhuma linha de hoje muda.
- `tool_code_save` do Construtor: `{ slug: ToolSlug, connectionId: ConnectionId, reads: OperationId[],
  description: string, source: string }` e, para uma versão nova, `{ toolId: ToolId, basedOn: number }`
  juntos (uma união, C21: sem `toolId` é ferramenta nova; com ele, `basedOn` é obrigatório), marcas
  conferidas na entrada (C23). A chave de tentativa é a da chamada (`construtor/tools.ts:78-84`).
- `addVersion` passa a receber a versão em que a pessoa se baseou; outra vira `STALE_VERSION`.
- A máquina do Construtor (emenda da U1): `createConversationMachines({ ...machine, log, hosts:
  ALLOWED_HOSTS, marksOf })` de `builder/machine/public.ts`, onde `machine` é o `ConversationMachine`
  que `conversationsOf` já recebe (`conversations-of.ts:81`, de `builderPortsOf` em `runs/ports.ts`
  pelo `conversationMachine` de `main.ts`), com as marcas `MARK.company` e
  `MARK.project` da conversa (`CONSTRUTOR_MARK`, `construtor.ts:124-126`). O controlador do Construtor
  não recebe `workspace`: o Hub roda os comandos, não o modelo, e o modelo não ganha as ferramentas de
  máquina. `tool_code_save` abre a máquina por `(await machines.workspace(requestContext))?.resolveSandbox({
  requestContext })` (`@mastra/core` `workspace.d.ts:581`) e roda comandos fixos. O fim do turno a para
  (`sessionTurns({ ended: (id) => void machines.stop(id) })`, como `assistant/turn.ts`), e a parte do
  Construtor ganha `close: () => machines.stopAll()` e `ends.onPhase`, como `assistant/assistant.ts`.
- `codeToolSave(deps: { machines: ConversationMachines; tools: Tools; connectors; log: FailureLog })`,
  id `CONSTRUTOR_TOOL.toolCodeSave`; `toolWorkerOf(id: ToolVersionId)` ao lado de `appWorkerOf` em
  `hub-api` (o nome `t-<toolVersionId>` que a U3 sobe).
- Falhas: `TOOL_TEST_FAILED` (nova); `TOOL_REFUSED` com as razões novas `CODE_BY_CONSTRUTOR`,
  `MODULE_STATE` e `STALE_VERSION`; `TOOL_REFUSED` com `NOT_OFFERED`, como hoje.
- Nenhuma permissão nova do banco: as tabelas são as da 24.3.1.
- O arquivo tomado como modelo: `builder/tools/check.ts` (a recusa com `named`) cumpre C21 e C26;
  `frozen.ts` hoje não cumpre C21 para mais de um `kind`, e é o que esta unidade conserta: `FrozenTool =
  PresetFrozenTool | CodeFrozenTool`, um `switch` no `kind` onde hoje `toolsBy` lê toda versão como
  `PRESET` (`frozen.ts:45-58`).

### As skills e a leitura

`mastra` (`createTool`, `Workspace`); `drizzle` (no pacote `drizzle-kit`) para as migrações;
`fastify-best-practices`; `shadcn` para o selo e o bloco de código.

### A ordem do trabalho

1. O contrato, as duas migrações (data D6, com a linha `-- contract:`) e a união em `frozen.ts` e
   `choice.ts`.
2. As recusas das rotas da pessoa (`CODE_BY_CONSTRUTOR`), `STALE_VERSION` e o #712.
3. O Construtor abre a máquina pelo dono da U1 (`createConversationMachines`, `hosts: ALLOWED_HOSTS`), escreve `tool.ts` e `tool.test.ts`,
   roda a regra de estado de módulo, lê uma vez pelo Hub a leitura declarada e grava a resposta como
   fixture na máquina (a máquina não tem segredo; a fixture são linhas reais da empresa, ficam só na
   máquina da conversa e saem dela depois do teste), roda o typecheck e o teste, empacota com
   `esbuild` e devolve fonte, módulo e resultado. O Hub roda os comandos, não o modelo; a regra de
   estado de módulo roda pelo Biome que o template da máquina passa a trazer, na versão do
   repositório.
4. Grava a versão só com o teste passando.
5. As telas: selo **Em código**, a página da versão, a linha do Construtor, o aviso do #707.

### Como se prova

- Critério 2: `code-tool.test.ts` pela porta `test-construtor.ts`, kit dublê (`machine/test-machine.ts`)
  rodando o teste de verdade; grava `tool` e `tool_version`; recusa `TOOL_TEST_FAILED` sem linha. Hoje
  falha: a ferramenta não existe.
- Critério 3: o mesmo teste, duas gravações e a leitura do agente publicado por `frozen.ts`; hoje
  `frozen.ts` lança na primeira versão `CODE`.
- Critério 4: `tool-page.test.tsx` e `routes.test.ts` com sessão de membro; só lê.
- Critério 5: pela porta do Construtor, recusa `NOT_OFFERED` sem linha.
- Critério 6: `routes.test.ts` pela porta HTTP; nada gravado; hoje a rota aceitaria.
- Critério 7: pela porta do Construtor, um código com `let` no módulo; nada gravado.
- Critério 8: `routes.test.ts` (duas versões sobre a mesma base; a gravação repetida com a ligação
  fora) e `tool-form.test.tsx`; grava uma versão só; hoje a segunda grava e a repetição dá 500.

### Parar se

O teste da ferramenta precisar de uma rede além da 0051, ou de um segredo: volta ao cartão.

## U3 A ferramenta em código, chamada

**Base e modelo.** Depois da U2. Opus: concorrência de borda, escopo de dados e a nova direção Hub →
borda.

### As linhas da tabela

"Subir a versão como Worker", "Tirar os Workers de uma ferramenta", "O namespace e o host das
ferramentas", "Despachar a ferramenta com a capability", "A capability data lê pelo Hub", "O Hub chama
a borda", "A ferramenta fina no agente", "O limite de 50 leituras". O protótipo (fora do repositório)
tem o despachante e a capability que funcionaram: `env.DISPATCHER.get(script, { props: { data:
ctx.exports.ToolData({ props: { reads } }) } }, { outbound: {}, limits: { cpuMs: 50, subRequests: 50 }
})`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/edge/wrangler.jsonc` | Muda: segundo namespace `conexus-tools`, mesma saída; as variáveis do Access (equipe e público) | — |
| `apps/edge/src/` | Cria `tools.ts` (o host `tools.conexusapp.tech`, a conferência do JWT, a rota e `ToolData`); muda `dispatcher.ts` (o `fetch`, `:59-66`, manda esse host antes do rótulo de app, e exporta `ToolData`) e `dispatch.ts` (a leitura do rótulo, `:189-195`) | o Hub |
| `packages/app-contract/src/` | Cria `ToolProps = { data }` (versionado) | o Worker da ferramenta |
| `packages/hub-api/src/project-connections.ts` | Cria `callToolConnector` (operação de borda) | a borda |
| `apps/server/src/hub/connectors/` | Muda: a porta que lê para uma ferramenta, com escopo e a chave do turno; a porta de teste nova | a rota de borda |
| `apps/server/src/platform/` | Muda `cloudflare.ts` (subir e tirar no namespace das ferramentas, e `removeWorkers`, que sai de `hub/apps/prune.ts:85-96`: `hub/apps/public.ts` não o exporta, e `builder/tools` não o alcança, C4) e `config.ts` (o namespace, o host, o token de serviço); cria `edge-tools.ts` (o Hub chama a borda) | ferramentas, agentes, apps |
| `apps/server/src/hub/apps/{prune,removal}.ts` | Muda: chamam `removeWorkers` de `platform/` com `appWorkerOf` (`prune.ts:124`; `removal.ts:49`, `:87`, `:136`) | — |
| `apps/server/src/{main,conversations-of}.ts` | Muda: a porta que relê a versão pelo `toolVersionId` entra no Hub como `door` entra hoje (`main.ts:173`); a remoção da empresa tira os Workers de ferramenta por `releaseFirst` (`conversations-of.ts:149-154`) | o Hub |
| `apps/server/src/builder/tools/` | Muda: subir ao gravar; tirar os Workers ao apagar e na remoção da empresa | o serviço de ferramentas |
| `apps/server/src/builder/agents/` | Cria `code-tools.ts`; muda `agent.ts` `tools` | o agente |
| `infra/` | Muda: o token de serviço do Access no servidor, pelo runner (0035, 0042); `compose.yaml` | — |
| `docs/how-to/apps-edge.md` | Muda: o namespace e o Access | — |
| `.dependency-cruiser.cjs` | Muda: as portas de teste novas | — |

Apaga: nada.

### Os contratos que a unidade cria

- Worker `t-<toolVersionId>`, tags `company-<CompanyId>`, `tool-<ToolId>`, `kind-tool`, `bindings: []`,
  `limits.cpu_ms` de `APP_CALL_LIMITS` (0047). Sobe depois que a versão grava, fora da transação (data
  D22); a presença do Worker não é gravada: "Worker not found." sobe de novo do `module` e chama uma
  vez mais.
- Apagar uma ferramenta: confere que não está em uso, tira o Worker `t-<toolVersionId>` de cada versão
  pelo nome, como `removeWorkers` (`hub/apps/prune.ts:85-96`), depois apaga as linhas. A remoção da
  empresa tira os das versões `CODE` dela da mesma forma, ao lado de `removeCompanyWorkers`; um Worker
  que a Cloudflare não confirmou deixa a remoção pendente, como hoje.
- O Hub chama `https://tools.conexusapp.tech/<toolVersionId>` com o token de serviço do Access; o
  Worker confere o `Cf-Access-Jwt-Assertion` (equipe e público das variáveis) e só então despacha.
- `ToolProps = { data: { read(operation: string, input: unknown): Promise<ConnectorAnswer> } }`: a
  operação e a entrada chegam do código gerado e entram como `string` e `unknown` de propósito; o Hub as
  analisa na porta (C27).
- Os `props` da capability (só na borda): `{ toolVersionId: ToolVersionId, turn: string, endsAt:
  number }`. O Hub não confia neles além do id: relê pelo `toolVersionId` a empresa, a ferramenta, a
  ligação e `reads`, confere que o turno é de um agente da mesma empresa que prende aquela versão, e
  conta a chave `turn` com as de `connector_read`.
- Falhas ao modelo: `TOOL_FAILED`, `TOOL_UNAVAILABLE`, `NOT_DECLARED`, `CONNECTOR_CALLS_SPENT`.
- Os nomes (emenda da U1): `createCloudflareTools(deps: { config: Config; log: FailureLog }):
  CloudflareApps` (o mesmo tipo, `cloudflare.ts:34-41`, sobre o segundo namespace);
  `removeWorkers<Id>(cloudflare: CloudflareApps, ids: readonly Id[], workerOf: (id: Id) => string,
  budget?: AbortSignal): Promise<{ removed: Id[]; left: number }>` em `platform/cloudflare.ts`, que
  devolve os ids marcados (C23) para `deleteVersionRows` (`prune.ts:132`) e `removal.ts:49` sem
  mapear nomes de volta; chamado por `hub/apps/prune.ts` e `hub/apps/removal.ts` (`:49`, `:87`, `:136`)
  com `appWorkerOf`, e pelas ferramentas com o nome `t-<toolVersionId>`; `createEdgeTools(deps: {
  config: Config; log: FailureLog }): EdgeTools`, com `call(input: { toolVersionId: ToolVersionId; turn:
  TurnKey; input: unknown; signal: AbortSignal }): Promise<EdgeToolAnswer>` (C56: o único `fetch` do Hub
  à borda); na borda, `export class ToolData extends WorkerEntrypoint<Env, ToolDataProps>` e
  `serveTool(request, env, exports): Promise<Response>`; no agente, `codeTools(deps: { edge: EdgeTools;
  tools: readonly CodeFrozenTool[]; turnOf(requestContext: RequestContext): TurnKey }): ToolsInput`, o
  esquema guardado lido uma vez por `z.fromJSONSchema` (zod 4.6.5) para o `createTool` (C27).
- O arquivo tomado como modelo: `apps/edge/src/dispatch.ts` (prazo, `limits`, `props`) e
  `hub/apps/prune.ts` (`removeWorkers` fora da transação) cumprem C21, C23 e C26.

### As skills e a leitura

`cloudflare:wrangler` e `cloudflare:workers-best-practices` (`wrangler`, `apps/edge`); `mastra`
(`createTool`); `fastify-best-practices`.

### A ordem do trabalho

1. **Prova do Access** (fora do repositório, como as provas da 0041), depois de o fundador autorizar a
   aplicação do Access: um token de serviço diante de um host de teste; sem token, o Worker não é
   chamado; com token, o Worker recebe um JWT que confere. Se não servir, parar.
2. O contrato em `app-contract` e `hub-api`, e o namespace no `wrangler.jsonc`.
3. A subida ao gravar, a nova subida e a remoção, em `cloudflare.ts` e `builder/tools/`.
4. O host, a conferência do JWT, a rota e a capability em `apps/edge/src/tools.ts`.
5. A operação de borda e a porta no Hub, com a releitura pelo `toolVersionId` e a chave do turno.
6. A ferramenta fina no agente, que chama `edge-tools.ts`.

Regras: S36, S48, C56, C57 (o prazo de 10 s da 0047), D22.

### Como se prova

- Critério 9: `tools.test.ts` (Miniflare) guarda os metadados da subida e mostra `bindings: []`;
  `code-tool.test.ts` pela porta do Hub grava uma versão e recebe a conta. Hoje falha: não há rota.
- Critério 10: os três casos do protótipo em `tools.test.ts`.
- Critério 11: `tool-door.test.ts`, 51 leituras e um `toolVersionId` de outra empresa.
- Critério 12: `tools.test.ts`, sem JWT, com outro público e vencido.
- Critério 13: `code-tool.test.ts` com o namespace dublê sem o Worker, e com a Cloudflare dublê fora.
- Critério 14: `routes.test.ts` (apagar, com a Cloudflare dublê fora) e o teste da remoção da empresa;
  as linhas só saem depois dos Workers.

### Parar se

O Access não recusar o pedido sem token (passo 1), ou a contagem de 50 não chegar à borda pela chave do
turno.

### Emenda técnica antes do passo 2 (2026-11-06)

O fundador autorizou em 2026-11-06 ("Autorizo, pode fazer prova com nomes finais, pode ser 1 ano") a
equipe do Zero Trust, o namespace `conexus-tools`, o token de serviço `conexus-hub-tools` (1 ano) e a
aplicação do Access em `tools.conexusapp.tech`, com a política Service Auth; o Firstmate os criou. A
emenda abaixo lê-se como delta das seções acima (L9); a página do fundador não muda.

**O passo 1 rodou** fora do repositório, com os nomes finais e um Worker de prova `cx-e244-access` numa
rota mais específica que a do despachante, apagado no fim (nada `cx-` sobrou). Sem token: 403 do
Access, e o Worker não rodou. Segredo errado: 401 do Access. Token certo: o Worker recebeu o
`Cf-Access-Jwt-Assertion`, que conferiu (RS256, as chaves da equipe, o emissor e a AUD), e o
`ctx.access.aud` nativo chegou com a AUD da aplicação; os cabeçalhos do token não chegam ao Worker. O
mesmo JWT conferido contra outra AUD foi recusado (o token de prova não cria uma segunda aplicação do
Access; o caso volta no teste da borda). Tempo, 30 chamadas desta máquina: com o Access e a conferência
nativa, p50 28 ms e p95 45 ms, contra 27 e 43 ms sem o Access; conferir o JWT à mão, buscando as chaves
a cada chamada, levou p50 155 ms.

- **A conferência do Access é nativa** (C75): a borda recusa com 403, antes de qualquer Worker, o
  pedido ao host das ferramentas cujo `ctx.access` falta ou traz outra `aud` que a da variável
  `TOOLS_ACCESS_AUD` do `wrangler.jsonc`. É o caminho que a página "Validate JWTs" da Cloudflare dá para
  um Worker atrás do Access; o `jose` não entra. O critério 12 lê-se assim: sem `ctx.access` (o Access
  não autenticou: sem token, token errado, JWT vencido) ou com outra AUD, 403; a assinatura e o prazo
  do JWT são do Access, provados no passo 1. O teste dá a `serveTool` o `access` do contexto.
- **`ToolProps`** (B.1): `{ data: { read(operation: string, input: unknown): Promise<unknown> } }`,
  versão 1. `read` resolve com a resposta inteira da leitura, a mesma que a fixture do teste da U2
  guardou (`construtor/code-tool.ts`, `fixtures[operation] = answered.whole`), e rejeita, com o código
  como mensagem, qualquer resposta que não seja `OK` (`NOT_DECLARED`, `CALLS_SPENT`, `NOT_GRANTED`, a
  ligação recusada ou fora, o prazo). Uma ferramenta que não trata a rejeição falha, e o modelo ouve
  `TOOL_FAILED` com o código: o `NOT_DECLARED` do critério 10 chega ao modelo como a razão do
  `TOOL_FAILED`. O Worker da ferramenta sobe com `APP_COMPATIBILITY_DATE[1]` (B.8), a data do contrato
  dos apps da mesma versão.
- **A chave da chamada** (B.3). A `TurnKey` é um uuid sem empresa nem agente. Antes de cada `fetch` à
  borda, a ferramenta fina abre no Hub, em memória, uma chamada viva: uma chave nova (`ToolCallKey`,
  uuid) com o escopo da conversa, o `toolVersionId`, a ligação, as leituras declaradas e a chave do
  turno, todos tirados da versão que o agente prende (`frozen.ts`, relida do banco no começo do turno);
  a chamada fecha no `finally`. Os `props` da capability passam a ser `{ toolVersionId, call, endsAt }`:
  a borda não vê a chave do turno. A porta de leitura de ferramenta recusa com `NOT_DECLARED` a chave
  que não está aberta, a que é de outro `toolVersionId` e a operação que a versão não declarou. O dono
  é `hub/connectors/tool-door.ts` (`createToolDoor`), exposto por `createConnectors` como `tools`.
- **Um só limite de 50** (B.4): a leitura da ferramenta passa pelo mesmo
  `connectors.assistant.read(scope, { connectionId, operation, input, turn })` que o `connector_read`
  dos agentes, com o mesmo `spend` da mesma instância; a chave do turno conta as duas juntas. O código
  é o de hoje, `CALLS_SPENT` (não `CONNECTOR_CALLS_SPENT`).
- **A operação de borda** `callToolConnector`, `access: 'edge'`, `POST /api/tool-connector-calls`, corpo
  `{ toolVersionId, call, operation, input, deadlineMs }`; responde 200 com `ToolDataAnswer`: `OK` com
  `value` (a resposta inteira), `NOT_DECLARED`, `CALLS_SPENT`, ou as outras não-`OK` do
  `ConnectorAnswer`, como `callAppConnector` responde as suas como dado.
- **O Hub chama a borda**: `POST https://tools.conexusapp.tech/<toolVersionId>` com
  `CF-Access-Client-Id` e `CF-Access-Client-Secret`, corpo `ToolCall = { call, input }`; a borda
  responde `ToolCallAnswer`: `OK` com `value` (o JSON da ferramenta), `FAILED` com `reason` (a CPU,
  o prazo, uma resposta que não é JSON, ou o código da rejeição), ou `MISSING` ("Worker not found."). Os
  dois tipos moram em `packages/hub-api/src/tools.ts`, ao lado de `ToolWorker`. O modelo ouve o valor,
  `TOOL_FAILED` com a razão, ou `TOOL_UNAVAILABLE` (a borda ou o Hub fora, o Access recusado, o prazo do
  Hub); `MISSING` sobe de novo uma vez e chama outra.
- **A releitura do módulo** (B.5): `tools.workerOf(companyId, toolVersionId)` em `builder/tools/` lê
  `tool_version.config.module` da versão `CODE` da empresa e devolve o `WorkerUpload`; a subida ao
  gravar e a nova subida usam o mesmo. `CodeFrozenTool` passa a ser exportado de `frozen.ts`.
- **A remoção da empresa** (B.6): os Workers de ferramenta saem em `releaseAgents`
  (`builder/agents/release.ts`), que já é a parte do `releaseFirst` (`conversations-of.ts`) que a
  remoção da empresa chama, antes de apagar os agentes; um Worker que a Cloudflare não confirmou lança
  `CLIENT_DELETION_PENDING`, e a remoção se repete. Uma empresa sem banco da empresa não tem Projeto
  (`hub/projects/projects.ts`, `create` só grava o Projeto depois do banco), logo não tem ferramenta; o
  ramo sem banco de `hub/operations/clients.ts` não precisa do gancho.
- **O servidor** (B.7): dois segredos em `/etc/conexus/secrets/`, `hub_tools_access_client_id` e
  `hub_tools_access_client_secret`, lidos por `HUB_TOOLS_ACCESS_CLIENT_ID_FILE` e
  `HUB_TOOLS_ACCESS_CLIENT_SECRET_FILE` (`infra/compose.yaml`, a lista de `require_secrets` em
  `infra/deploy.sh`); `HUB_TOOLS_NAMESPACE: conexus-tools` e `HUB_TOOLS_ORIGIN:
  https://tools.conexusapp.tech` no `compose.yaml`. O token da API do Hub é o mesmo nos dois
  namespaces. O runner não muda.
- **Apagar uma ferramenta** confere o uso antes (`usedBy`, `TOOL_IN_USE`), tira os Workers fora da
  transação e só então apaga as linhas; um Worker que fica devolve `TOOL_UNAVAILABLE` (novo em
  `agent-failures.ts`, 503) e nada muda.
- **Arquivos fora das pastas do cartão** (L7): `apps/edge/worker-configuration.d.ts`, que `wrangler types`
  gera de novo do `wrangler.jsonc`; `packages/hub-api/src/agent-failures.ts`, a falha nova.

## U4 O Computador do agente

**Base e modelo.** Depois da U1, ao lado da U2. Sonnet.

### As linhas da tabela

"A chave Computador", "A máquina do agente e a rede", "Mostrar o arquivo da máquina", "Quem mata a
máquina de uma conversa que sai". Ler `builder/agents/{agent,frozen,controller,open,release}.ts`,
`builder/construtor/construtor.ts:260-270`, `builder/controller-kit/release.ts`, o dono de máquinas e
o `show_file` da U1, e `apps/web/src/builder/agents/{chooser,tools-section,draft-panel}.tsx`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/agents.ts` | Muda: `AgentConfig.machine: boolean`, padrão `false` ao ler versão antiga; `AGENT_FILE`, a rota de arquivo da conversa do agente, com `MachineFileQuery` e `MACHINE_FILE_FAILURES` de `machine.ts` | servidor, web |
| `apps/server/src/builder/agents/` | Muda: `Plan` ganha `machine` (`agent.ts:95-100`: o resolver do controlador só vê `planOf`); o controlador com `workspace` e `show_file` quando `machine`; o fim do turno para a máquina, a parte ganha `close` e `ends.onPhase`; `open.ts`, `controller.ts` e `release.ts` matam a máquina | o controlador dos agentes |
| `apps/server/src/builder/construtor/` | Muda: a remoção das conversas do Construtor mata a máquina | a remoção |
| `apps/server/src/builder/machine/kit.ts` | Muda: `MARK.agent = 'conexus_agent'`; a lista da decisão B é `PACKAGE_HOSTS` (0059), a mesma do Assistente, que já mora aqui desde a U1 | agentes |
| `apps/web/src/builder/agents/` | Muda: a linha **Computador** | — |
| `apps/web/src/builder/conversation/` | Muda: o arquivo ao lado na conversa do agente, `FilePanel` com `urlOf` do `AGENT_FILE`; a linha do `show_file` já é `MACHINE_SPECS` | — |

Apaga: nada.

### Os contratos que a unidade cria

- `AgentConfig.machine: z.boolean().default(false)` (C27 na leitura da versão).
- A marca da máquina do agente: empresa, Projeto, agente e conversa (S36).
- A rota de arquivo da conversa do agente, `GET`, com a mesma forma da do Assistente
  (`ASSISTANT_FILE`, `packages/hub-api/src/assistant.ts:321-340` antes da U1), para quem pode ler a
  conversa: `registerFile(app, { route: AGENT_FILE, machines, log, served: 'AGENT_FILE_READ',
  ownConversation })` de `builder/machine/public.ts`.
- A máquina do agente: `createConversationMachines({ ...machine, log, hosts: PACKAGE_HOSTS, marksOf })`,
  com `marksOf` dando `MARK.company`, `MARK.project` e `MARK.agent` e `undefined` quando o plano do
  turno não tem `machine`. O `workspace` entra em `controllerOf` de `createAgentConversations`
  (`controller.ts:222-231`); o resolver lê `controller` do `requestContext` antes de `resolvedOf`, que
  lança fora de uma conversa (`controller.ts:213-218`), para que listar agentes não ligue nada.
  `agentOf` sozinho (o teste do rascunho pelo Construtor) não recebe máquina.
- Cada `releaseThreads` de agentes e do Construtor recebe a morte da máquina como o Assistente
  (`releaseThreads(deps, ids, (id) => machines.kill(id))`).
- O arquivo tomado como modelo: `builder/assistant/release.ts` cumpre C21, C23 e C26.

### As skills e a leitura

`mastra` (`Workspace`, `@mastra/e2b`); `fastify-best-practices`; `shadcn` para a linha.

### A ordem do trabalho

1. O campo e a leitura antiga.
2. O controlador dos agentes recebe `workspace` pelo dono da U1 onde o Assistente o recebe
   (`assistant.ts:336`), com a rede da decisão B; `show_file` e a rota de arquivo do agente.
3. As mortes de máquina nos `releaseThreads` dos agentes e do Construtor.
4. A linha **Computador** e o arquivo ao lado da conversa.

### Como se prova

- Critério 15: `machine.test.ts` (kit dublê) e `shown-file.test.tsx`; um caminho fora da pasta é
  recusado. Hoje falha: o agente não recebe máquina.
- Critério 16: a lista passada ao kit; o caso opcional com o E2B de verdade tenta um endereço de fora.
- Critério 17: `release.test.ts` e o teste das rotas do Construtor contam as mortes no kit dublê; hoje
  nenhuma.
- Critério 18: `frozen.test.ts` com uma configuração sem o campo.

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
| `apps/server/src/builder/machine/` | Muda: `e2b.ts` cria o `E2BCodeModeTransport` (`createE2bCodeMode(): CodeModeTransport`), e `ConversationMachine` ganha `codeMode: CodeModeTransport`; só `builder/machine/` importa `@mastra/e2b` (`.dependency-cruiser.cjs:116-123`) | agentes |
| `apps/web/src/builder/{agents,conversation}/` | Muda: a chamada **Programa** | — |

Apaga: nada.

### Os contratos que a unidade cria

`createCodeMode({ tools, timeout }, transport)` sobre as ferramentas do agente (conector, recortes,
ferramentas em código, dados do app), sem `sandbox` fixo: o modo código pega a máquina do workspace do
agente (`ctx.workspace.resolveSandbox`, `tools-BVDic2bB.js:472-477`). Como `createCodeMode` fixa os ids
das ferramentas ao ser criado (`tools-BVDic2bB.js:449-465`) e `agentOf` monta as ferramentas por pedido
(`agent.ts:186-207`), o modo código e as suas `instructions` são montados dentro desse mesmo resolver;
as ferramentas diretas continuam ao lado dele. O `transport` é uma dependência, `ConversationMachine.codeMode`: em produção, o
`E2BCodeModeTransport` que `builder/machine/e2b.ts` cria; nos testes, o padrão do Mastra sobre o `LocalSandbox`
(`docs-agents-code-mode.md:137`), porque o `E2BCodeModeTransport` exige um `E2BSandbox`
(`@mastra/e2b/dist/index.js:2961`). O `timeout` fica no padrão do Mastra (30 s) até a medida do
critério 21 pedir outro, com a razão. O nome: `codeModeOf(tools: ToolsInput, transport: CodeModeTransport): { tool: Tool; instructions:
string }` em `builder/agents/code-mode.ts`. O arquivo tomado como modelo: `builder/agents/tools.ts`
(`presetTools`) cumpre C21 e C26.

### As skills e a leitura

`mastra` (`dist/docs/references/docs-agents-code-mode.md`, `reference-tools-create-code-mode.md`);
`shadcn` para a chamada.

### A ordem do trabalho

1. A medida do critério 21, antes do código, numa conta da OpenAI no Hub (sem ela, a U5 espera e o
   firstmate é avisado; as U1 a U4 não dependem dela): os três pedidos de exemplo do protótipo, com as linhas sintéticas, 3 vezes cada modo.
2. `code-mode.ts` e a ligação no `agentOf` só quando `machine`.
3. A chamada **Programa** na conversa.

### Como se prova

- Critério 19: `code-mode.test.ts` com o transporte padrão, 51 chamadas no programa e a recusa da 51ª;
  o caso opcional com o E2B de verdade roda o `E2BCodeModeTransport`, o único que prova o transporte
  que vai para produção. Hoje falha: o agente não tem `execute_typescript`.
- Critério 20: `program-call.test.tsx`, o resultado e o erro.
- Critério 21: o relatório da unidade.

### Parar se

A medida do passo 1 mostrar o modo código errando mais que só ferramentas: volta ao fundador com os
números, antes do código.
