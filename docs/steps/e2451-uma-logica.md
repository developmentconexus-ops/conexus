# Etapa 24.5.1: Uma lógica

Rascunho. O fundador respondeu às seis decisões em 2026-11-08 (1A, 2 aceita, 3A, 4A, 5A, 6A), e
ainda não aprovou esta página. A
etapa vem do pedido dele de 2026-11-08 e da auditoria de coesão de 2026-11-07, refeita por um estudo
que tratou cada item da auditoria como hipótese. Cada linha citada foi lida no `main` em `a4e69677`,
com `@mastra/core` 1.82.0, `@mastra/server` 1.82.0, `@mastra/memory` 1.41.0, `@mastra/pg` 1.35.0,
`better-auth` 1.7.8, `drizzle-orm` 1.0.0-rc.4 e `@tanstack/react-query` 5.104.0. O construtor de
cada unidade reabre as linhas no `main` do dia.

As regras de escrita que valem aqui são as da 24.5 como estão no `main`: a `D1-a` (só quem tem
**Publicar agente que escreve sozinho** deixa uma escrita em **Faz sozinho**), a `D2-a` (volta a
perguntar quando quem responde pela versão perde a ação, a escrita ou sai), a `D3-a` (quem aprova
precisa da escrita no próprio papel) e a opção A de 2026-11-07 (restaurar conta como publicar). A
opção (b) de 2026-11-08 (quem restaura responde pela versão ativa, `agent.active_by`) entrou no
`main` pela https://github.com/developmentconexus-ops/conexus/pull/846.

## A página do fundador

**No fim desta etapa** nada muda no que você vê, com uma exceção: a data de "Conversa de …". Muda
por dentro. Cada coisa que as quatro conversas (Builder, Assistente, agentes e Construtor) dividem
passa a ter uma casa só. A regra "pergunta antes ou faz sozinho" passa a ter um dono só. A 24.6
começa sem copiar nada disso.

**O que você me pediu, e o que o estudo achou.** Você disse: "ver se não tem coisa nativa, se isso
não é patch ou gambiarra". Conferi cada item da auditoria no código e no Mastra instalado.

- **"Pergunta antes ou faz sozinho."**
  - **A mecânica é do Mastra e continua dele.** Cada ferramenta carrega a sua regra
    (`requireApproval` como função), e o Mastra trata essa regra como a palavra final. Também são
    do Mastra o cartão **Aprovar?**, a espera, o **Aprovar** e o **Recusar**, e o recusar quando
    você manda outra mensagem.
  - **As suas regras são nossas, e precisam ser.** Papel, quem publicou, "Faz sozinho" e quem pode
    aprovar não têm como ficar no Mastra. Procurei, e a única regra de quem aprova que ele tem é a
    dos Canais: "só quem pediu".
  - **A prova que decide.** Num workflow do Mastra (a 24.6), o passo feito de uma ferramenta **não**
    consulta a regra dela e roda direto. Eu medi. A mesma regra vai então ter dois chamadores com
    duas mecânicas: a regra da ferramenta, na conversa, e o "parar e esperar" do passo, no workflow.
  - **Por isso ela ganha um lugar só**, no Hub, ao lado do funil de escrita. Esse lugar só responde
    "pergunta" ou "faz", "pode aprovar" ou "não pode". Se guardasse o cartão ou a espera, seria
    gambiarra, e não guarda.
- **O kit de conversa.**
  - **Ele já existe e é usado** pelas quatro conversas: abrir, dono, tentativa, turnos e apagar.
  - **Ele não é a casa de tudo que é comum.** Uma parte mora dentro do Builder e do Assistente, e
    os agentes e o Construtor pegam de lá.
  - **O que se repete fora dele** é uma cola de três linhas em volta de algo que o Mastra já faz:
    "esta conversa é sua?", listar as conversas, o texto fixo do prompt e a frase do título.
    As cópias viram uma.
- **O que saiu da lista da auditoria.**
  - "Criar conversa" na tela: o nativo já é usado nos sete lugares.
  - A casca da conversa na tela: a 24.6 não cria conversa nova; fica para depois.
  - Unificar as ids derivadas: as das conversas estão gravadas, e trocar o jeito de calcular abriria
    conversas novas onde hoje se reabre a mesma.
  - O "nunca pergunta" das leituras: é um remendo com prova (o defeito #27831 do Mastra perdia 12
    de 200 leituras; com a regra em cada ferramenta, 0 de 200) e fica.

**O roteiro de uso.** Você é a Ana (dona), no Conexus da nuvem.

1. Abra o Assistente e uma conversa sem título que você começou ontem. Em **Conversas**, ela
   aparece como "Conversa de <o dia e a hora em que você a começou>". Mande uma mensagem e volte à
   lista: a data não muda.
2. Faça o mesmo numa conversa com o agente "Pedidos" e numa conversa com o Construtor: a mesma
   regra.
3. Refaça o roteiro da 24.5 com o "Pedidos":
   - em **Pergunta antes**, o cartão aparece, e **Aprovar** lança;
   - **Recusar** não lança;
   - outra mensagem recusa o cartão aberto;
   - em **Faz sozinho**, lança sem cartão.

   Tudo igual a antes.

**O que você faz, e quando.** Antes: nada. No começo: responde às decisões abaixo e aprova esta
página. No fim: faz o roteiro e diz o que viu.

**Fica de fora.**

- **A casca da conversa na tela e "criar conversa" num lugar só.** A 24.6 não cria tela de
  conversa nova.
- **Mudar o jeito de calcular as ids derivadas.** Elas estão gravadas, e mudar abriria conversas
  novas.
- **Migrar as dez criações antigas para o mesmo jeito de conferir a repetição.** As antigas
  funcionam. Só as novas, a começar pela 24.6, usam o jeito comum.
- **Os dois gerentes de máquina, as duas portas de leitura de conector, o lease copiado e a cola
  de admissão.** A 24.6 não os copia. Ficam para uma arrumação depois da 24.6.1.
- **As regras de fronteira** (C8, a raiz do servidor, as portas aninhadas, a lista de ajudantes de
  teste). São método, e uma regra nova entra num PR só dela, antes desta etapa (L20). É a decisão
  2.
- **Apagar e renomear conversas fora do Assistente.** É produto (decisão 6).
- **Ler o contexto do controlador do Mastra num lugar só.** Cada leitor lê um pedaço diferente,
  alguns ao vivo; um leitor só mudaria o que eles leem. Fica como está.
- **Mover para o kit o bloco da conversa (`speakersOf`, `blockOf`), a pergunta à pessoa
  (`createAskUserTool`) e as habilidades (`skillOf`).** Cada um depende de uma peça do Assistente
  ou do Builder que teria de ir junto. Fica para a arrumação depois da 24.6.1.
- **Os avisos guardados para um cartão** (`next-card`): nenhum toca nestes arquivos.

**As decisões suas nesta etapa.** Nenhuma é de produto, salvo a 4. Todas vêm da auditoria e foram
refeitas pelo estudo. As respostas são as suas, de 2026-11-08, com as suas palavras.

- **1. Onde entra a arrumação.**
  - `1A`: nesta etapa própria, antes da 24.6.
  - `1B`: como a primeira unidade da 24.6.
  - `1C`: depois da 24.6.

  O estudo recomendou `1A`: a 24.6 já passa da L2 (~4.750 linhas no cartão dela), e a U2 daqui
  tira ~150 de lá. **Sua resposta: "A".** A linha "24.5.1 Uma lógica" entra no roteiro.
- **2. As regras de fronteira, conferidas pela máquina.** **Sua resposta: "pra mim isso já era
  dentro dos nossos guias, isso. De não importar a tabela de outro dono, de ter o... Por exemplo,
  você tem um módulo, mas tudo que pode usar só tá no public, por exemplo, isso tudo é conforme
  nosso stack desde o começo, nossas regras e nossos guias. Então, tem que verificar isso, mas eu
  concordo. Aceito."**

  A verificação, regra por regra, no `main` em `a4e69677`:

  | Regra | O que o guia já diz | O que a máquina confere hoje | O que o PR de método faz |
  | --- | --- | --- | --- |
  | Não importar a tabela de outro dono | C8 ([code](../guides/code.md)): um módulo não importa o objeto de tabela de outro dono, salvo a chave estrangeira e o arquivo que junta o esquema. A etiqueta diz `[dependency-cruiser, review]` | nada: nenhuma regra de `.dependency-cruiser.cjs` nomeia a C8, embora o comentário da linha 1 diga "C3 to C8". O dependency-cruiser vê o arquivo importado, não o nome, e as tabelas saem pelo `public.ts` do dono (`hub/requests/public.ts:7` exporta `request`) | a máquina passa a conferir: as tabelas saem por uma porta própria, que só o arquivo do esquema pode importar. Conserta a única violação achada: `hub/notifications/request-notices.ts:5,38` importa `request` e faz `innerJoin` na tabela dos pedidos; passa a chamar uma operação de `hub/requests` |
  | Outro sujeito só pelo `public.ts` | C4: outro sujeito ou módulo só pelo seu `public.ts`, e o Hub não importa o Builder. `[dependency-cruiser]` | confere só de dentro de `hub/` e `builder/` (regra `subject-only-through-public`, `from` em `^apps/(server\|web)/src/(hub\|builder)/`) | igual |
  | A raiz do servidor também | a C4 vale para todo código; o guia não abre exceção para a raiz | nada: `main.ts`, `conversations-of.ts` e `first-person-arguments.ts`, na raiz de `apps/server/src`, ficam fora do `from` da regra. Hoje os três só importam `public.ts` e `platform/` | a regra passa a valer também na raiz. Nenhum conserto |
  | As portas aninhadas | a C4 diz "seu `public.ts`" sem dizer se um módulo dentro de um sujeito tem porta própria | a máquina aceita um `public.ts` em qualquer profundidade (`PUBLIC_DOOR`, linha 9). Existe um: `hub/identity/mail/public.tsx`, importado por `hub/notifications/automation-email.tsx:9` | a máquina aceita só o `public.ts` da raiz do sujeito, e o guia diz isso na C4. O e-mail passa a sair por `hub/identity/public.ts` |
  | Os ajudantes de teste | T5 ([testing](../guides/testing.md)): o teste entra pela porta pública e não importa o miolo, salvo o banco de teste, `platform/test-neon.ts` e `hub/identity/test-hub.ts` | a máquina aceita mais do que o guia: uma lista de ~50 nomes (`TEST_DATABASE`, linha 10) | aqui o PR muda o texto da T5: a exceção passa a ser a convenção `test-*.ts`, que é o que a lista já faz. Nenhum teste muda |
  | Um fato, um dono | C26: cada fato tem um dono. `[review; npm run quality]`, com o jscpd para cópias | o jscpd pega cópia de texto, não a mesma regra escrita duas vezes | a habilidade de revisão pergunta, a cada peça nova, "isso já existe noutro sujeito?" |

  Então o PR de método faz a máquina conferir o que o guia já manda (C8, a raiz, as portas
  aninhadas), conserta a violação de `request-notices.ts:38`, escreve na T5 a convenção que a
  lista já segue, põe a pergunta da C26 na revisão e escreve na C4 a frase da decisão 3. Entra
  antes desta etapa, num PR só dele (L20).
- **3. O vocabulário do Builder no contrato.** Você perguntou "O que é isso?", e a explicação
  abaixo foi a resposta.

  Em palavras simples: o Hub (a parte que guarda empresas, papéis e conectores) não deve depender
  do Builder (a parte que cria agentes e apps). Mas o pacote de contrato, que as duas partes e as
  telas leem, já tem nomes do Builder, como o número de um agente (`AgentId`), de uma conversa
  (`ConversationId`) e de uma Automação (`AutomationId`), e o Hub já os usa
  (`hub/connectors/write-record.ts:3`, `hub/notifications/notifications.ts:3`). A pergunta é se
  isso vale.
  - `3A`: vale. O contrato é a língua comum de todos, e isso se escreve na C4.
  - `3B`: não vale. O Hub nunca cita um nome do Builder, nem pelo contrato.

  O estudo recomendou `3A`. A U2 põe a regra de escrita no Hub (`hub/connectors/approval.ts`), e ela
  recebe a conversa onde a escrita acontece (`ConversationId`); a 24.6 acrescenta a corrida de um
  workflow. Com `3B`, a regra teria de voltar para o Builder, e o Hub teria de trocar os nomes que
  já usa. **Sua resposta: "A".**

  A C4 ([code](../guides/code.md)) ganha a frase, no PR de método da decisão 2: "O contrato
  (`@conexus/hub-api`) é o vocabulário comum dos programas e dos sujeitos: o Hub pode usar os tipos
  dele, os do Builder inclusive, sem que isso conte como importar o Builder."
- **4. A data de "Conversa de …" quando a conversa não tem título.** Hoje o Builder mostra o dia
  da criação, e o Assistente, os agentes e o Construtor mostram a última mensagem. A mesma
  conversa sem título muda de nome a cada mensagem.
  - `4A`: a criação, um rótulo que não muda.
  - `4B`: a última mudança.

  **Sua resposta: "A".** Exemplo: uma conversa começada em 7/11 às 10h12 se chama "Conversa de
  07/11/2026, 10:12" para sempre, até ganhar um título.
- **5. O dublê de modelo nos testes.** O estudo recomendou `5A`, como na auditoria: a regra de
  teste T24 passa a aceitar o gerador de stream como dublê, e as gravações provam o gerador. É de
  método, e esta etapa não muda isso. **Sua resposta: "A".**
- **6. Apagar e renomear conversas fora do Assistente.** O estudo recomendou `6A`: numa etapa de
  produto futura, pelo kit. **Sua resposta: "A".**

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 O kit como casa comum | O modelo e a memória das conversas movidos para `controller-kit/`; `ownThread`, `listOwned`, `fixedSystem` e as frases do título no kit; as cópias apagadas | `apps/server/src/builder/controller-kit/`, `builder/conversation/`, `builder/assistant/`, `builder/agents/`, `builder/construtor/` | [testing](../guides/testing.md) | esta página aprovada |
| U2 A regra de escrita com um dono | `hub/connectors/approval.ts` (`mustAsk`, `mayApprove`, `mayLeaveAlone`, `publisherLeavesAlone`) com os autores de hoje; `speakerOf` em identity no lugar das montagens; `builder/agents/` chama o dono | `apps/server/src/hub/connectors/`, `apps/server/src/hub/identity/`, `apps/server/src/builder/agents/` | [security](../guides/security.md) | a U1 no `main` |
| U3 Um hash de tentativa | `platform/attempt.ts` com `bodyHashOf`; os seis importadores passam a ele | `apps/server/src/platform/`, `builder/conversation/`, `builder/agents/agents.ts`, `builder/tools/`, `builder/automations/automations.ts` | [data](../guides/data.md) | esta página aprovada |
| U4 Frases e título | `unconfirmedText` ao lado de `writeFailureText`; um `titleOf`; os três resumos de conversa com `title` anulável e `createdAt` | `apps/web/src/platform/`, `apps/web/src/builder/`, `apps/web/src/hub/`, `packages/hub-api/src/{assistant,agents,construtor}.ts`, `apps/server/src/builder/{assistant/routes.ts, agents/conversation-routes.ts, construtor/routes.ts}` | [web](../guides/web.md) | a U1 no `main`; a decisão 4 |
| U5 Dois ajudantes de teste | `stepped` e `forward` no lugar das cópias que cabem neles | `apps/server/src/builder/conversation/test-questions.ts`, `builder/construtor/test-construtor.ts`, `apps/server/src/hub/connectors/{test-connections,test-rows,test-write}.ts` | [testing](../guides/testing.md) | esta página aprovada |

A U1, a U3 e a U5 correm em paralelo. A U3 toca `builder/conversation/store.ts`,
`builder/conversation/public.ts` e `builder/conversation/routes.ts`, que a U1 não muda. A U2 e a U4
começam com a U1 no `main`: a U2 porque `builder/agents/agent.ts` e `controller.ts` são da U1 e
dela, e a U4 porque `agents/conversation-routes.ts` e `construtor/routes.ts` também são das duas.

**O que cada unidade apaga.**

- **U1:** as colas de dono de `assistant/routes.ts:72-77`, `construtor/open.ts:62-73` e
  `agents/conversation-routes.ts:102-104,140-145`; a lista repetida de
  `construtor/routes.ts:72-79`; os três `CACHED`; as frases de título de `assistant/memory.ts:5-8`
  e `agents/controller.ts:47-50`, que eram a mesma.
- **U2:** a montagem `roleOf → { kind: 'PERSON' }` em seis lugares; `roleNow`, `holdsWrite`,
  `publisherLeavesAlone` e `mayLeaveAlone` saem de `builder/agents/publish.ts`; `aloneByPublisher`
  e a dependência `leavesAlone` saem de `builder/agents/tools.ts`.
- **U3:** `bodyHashOf` sai de `builder/conversation/store.ts` e da porta da conversa.
- **U4:** os três `titleOf` viram um; as constantes `UNCONFIRMED*` repetidas saem.
- **U5:** `stepping` e `scripted`; o bloco de encaminhar de três dublês.

**Orçamento de código alterado.** U1: ~150 (~80 a menos). U2: ~170. U3: ~40. U4: ~160. U5: ~80,
só de teste. Total da etapa: ~520 de código, mais ~80 de teste. Cabe na L2.

## Os critérios de aceite

Os testes do servidor rodam com `node --test` pelo script do pacote (`npm test -w apps/server --
<arquivo>`); os da web, com o Vitest do pacote da web.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Os testes das quatro conversas passam sem mudar a asserção. Abrir, ler ou mandar à conversa de outra pessoa, de outro tipo ou que não existe responde `CONVERSATION_NOT_FOUND` (404), como hoje, também pela rota nativa do Mastra | `builder/conversation/guard.test.ts`, `builder/assistant/routes.test.ts`, `builder/agents/conversation-routes.test.ts`, `builder/agents/conversation.test.ts`, `builder/construtor/routes.test.ts` (os de hoje) | must |
| 2 | U1 | `npm run deps` sai 0. Nenhum arquivo fora de `builder/conversation/` importa `conversationMemory`, `sessionModel`, `routedModel`, `toolsOf` ou `turnOfOwner` da porta da conversa: todos vêm de `controller-kit/public.ts` | `npm run deps`; `rg` mostrado no relatório do build | must |
| 3 | U1 | A lista de conversas com um agente e a do Construtor devolvem as conversas da pessoa, a última mudança primeiro, como hoje | `builder/agents/conversation.test.ts` ("abrir: … a lista é só da pessoa", `:40`); `builder/construtor/routes.test.ts` (os de hoje) | must |
| 4 | U1 | O pedido que o dublê da Anthropic recebe do Assistente, de um agente e do Construtor leva o texto fixo com `cacheControl` `ephemeral` de `1h`, como hoje | `builder/assistant/instructions.test.ts` e `builder/model-accounts/claude/prompt-cache.test.ts` (os de hoje); um caso novo para o agente e o Construtor em `builder/agents/conversation.test.ts` ("as ferramentas", `:85`), pelo pedido que o dublê guarda | must |
| 5 | U2 | Pelo mundo de aprovação da 24.5 (`builder/agents/test-approval.ts`), na conversa de um agente: em **Pergunta antes** o cartão aparece. Em **Faz sozinho**: o cartão aparece quando quem responde pela versão perdeu a ação ou a escrita no papel, ou saiu, e também com uma escrita aberta da mesma ligação e operação; senão a escrita roda sem cartão. Na conversa de teste (o rascunho) em **Faz sozinho**, a escrita roda sem cartão mesmo que o dono tenha perdido a ação. Os testes de hoje da `D2-a`, da `D3-a` e do "quem restaura responde" (PR 846) passam sem mudar | `builder/agents/autonomy.test.ts` (os de hoje e um caso novo do rascunho, se ainda não houver) | must |
| 6 | U2 | Aprovar pela rota nativa `POST …/sessions/:id/tool-approval` sem a escrita no papel responde `NOT_IN_ROLE` com a operação e nada roda; recusar não confere papel. Publicar ou restaurar com uma escrita em **Faz sozinho** sem a ação responde `NOT_IN_ROLE` com o rótulo da escrita. Igual a hoje | `builder/agents/autonomy.test.ts`; `builder/agents/publish.test.ts` (os de hoje) | must |
| 7 | U2 | Ler e escrever com um conector como pessoa, e publicar uma versão que declara leituras, dão as mesmas respostas de hoje, `NOT_IN_ROLE` e `NOT_GRANTED` incluídos | `hub/connectors/role-doors.test.ts`, `assistant-port.test.ts`, `write.test.ts`, `publish.test.ts` (os de hoje) | must |
| 8 | U3 | Repetir a criação de uma conversa, de um agente, de uma ferramenta e de uma Automação com a mesma chave e o mesmo corpo devolve o mesmo objeto; com outro corpo, `IDEMPOTENCY_CONFLICT`. Igual a hoje, e os hashes gravados continuam valendo | os testes de hoje das quatro criações | must |
| 9 | U4 | Uma conversa sem título se chama "Conversa de <data>" pela mesma regra nas listas do Builder, do Assistente, dos agentes e do Construtor, com a data da decisão 4 (com `4A`, a criação: mandar uma mensagem não muda o rótulo) | `apps/web/src/builder/conversation/text.test.ts` (novo); as listas de hoje de cada conversa, pelo `test-hub.tsx` de cada uma | must |
| 10 | U4 | Os três resumos de conversa (`AssistantConversationSummary`, `AgentConversationSummary`, `ConstrutorConversationSummary`) trazem `title: null` quando o Mastra não deu título e `createdAt`; o contrato diz `z.string().nullable()` e `z.iso.datetime()` | `builder/assistant/routes.test.ts`, `builder/agents/conversation-routes.test.ts`, `builder/construtor/routes.test.ts` | must |
| 11 | U4 | Cada texto "Não confirmamos …" que a pessoa lê é o mesmo de hoje, letra por letra, e sai de `unconfirmedText` | `apps/web/src/platform/hub.test.ts` (novo caso: cada texto da lista da U4 igual ao de hoje, escrito por extenso no teste) | must |
| 12 | U5 | Os testes que usavam `stepping`, `scripted` e os três dublês passam sem mudar a asserção | os testes de hoje | must |

## A matriz de estados

A etapa não cria tela. A única coisa que muda numa tela é o rótulo de uma conversa sem título.

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| As listas e os títulos de conversa (Builder, Assistente, agente, Construtor) | igual | igual | igual | igual | igual | igual | igual; só o rótulo de uma conversa sem título segue a decisão 4 |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `AssistantConversationSummary.createdAt` e o mesmo campo na vista de uma conversa do Assistente (`packages/hub-api/src/assistant.ts:34-38`, `ConversationHead`) | `builder/assistant/routes.ts:98-106` e `:191-197` (`thread.createdAt.toISOString()`) | `titleOf` |
| `AgentConversationSummary.title` (anulável) e `.createdAt` (`packages/hub-api/src/agents.ts:166-173`) | `builder/agents/conversation-routes.ts:47-55` (`thread.title \|\| null`) | `titleOf` |
| `ConstrutorConversationSummary.title` (anulável) e `.createdAt` (`packages/hub-api/src/construtor.ts:97-101`) | `builder/construtor/routes.ts:36-42` (`thread.title \|\| null`) | `titleOf` |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio | Uma dependência fora | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| nenhuma nova: a U3 move um hash sem mudar o que ele calcula, a U2 move regras sem mudar o que elas leem, e a U4 muda uma leitura | — | — | — | o mesmo de hoje | 5 a 8 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A ferramenta decide se pergunta | U2 (só o chamador muda) | `builder/agents/tools.ts:137-147` | `@mastra/core@1.82.0` `packages/core/src/loop/workflows/agentic-execution/tool-approval-verdict.ts:60-94` (`6e8dfcb8`) | a função da ferramenta é final; se lança erro, pergunta | nativo | — | não precisa | — |
| As leituras e o Computador nunca perguntam | fica de fora | `tools.ts:24`, `agent.ts:221-230`, `controller.ts:270`, `machine/conversation.ts:289` | `packages/core/src/agent-controller/session.ts:4768-4789`, `:6459-6504` (`6e8dfcb8`) | o "nunca pergunta" nativo é `allow`, que suspende e aprova na hora (defeito #27831) | remendo | `@mastra/core` 1.82.0 e `@mastra/pg` 1.35.0, Postgres: 12 de 200 leituras perdidas com `allow`, 0 de 200 com a regra (estudo da 24.5); causa em `agent/agent.ts:8522` | resposta A da 24.5; a entrada de `boundaries.md` é do fechamento da 24.5 | — |
| A regra de negócio "pergunta ou faz" | U2 | `tools.ts:112-147`, `publish.ts:166-178,209-262` | nenhuma referência instalada tem papel nem autor de versão | — | embrulhado: alimenta a função nativa da ferramenta | P1 do estudo: num workflow, `createStep(tool)` não chama `requireApproval` (`status: success`, `requireApprovalCalled: 0`); a 24.6 tem um segundo chamador | `D1-a`, `D2-a`, `D3-a`; opção A de restaurar; "b" de 2026-11-08 | `hub/connectors/approval.ts` |
| Quem pode aprovar | U2 | `guard.ts:204-256`, `write-of.ts:47-65`, `publish.ts:216-225` | Mastra: só `toolApprovers` nos Canais (`packages/core/src/channels/agent-channels.ts:684-960`) | "quem pediu" ou "qualquer um" | embrulhado: a resposta é do Mastra (`respondToToolApproval`) | `autonomy.test.ts` | `D3-a` | `hub/connectors/approval.ts` |
| "Pode usar a operação X" | U2 | `hub/identity/may-use.ts:48-115` e as montagens em `publish.ts:89-103`, `publish-check.ts:42-50`, `write.ts:81-98`, `speaking.ts:12-21`, `assistant-port.ts:109-118` | better-auth 1.7.8 `hasPermission` | o papel guardado da empresa | nativo, com `speakerOf` como dono da montagem | — | não precisa | `hub/identity/may-use.ts` (muda) |
| O modelo e a memória das conversas | U1 | `conversation/builder.ts:38-64,104-146`, `conversation/turn-of.ts:41-45,104-110` (com `ownerIn`) | `@mastra/memory@1.41.0` `Memory`; o roteador de modelos do Mastra | — | embrulhado, na casa errada | — | não precisa | `builder/controller-kit/model.ts`, `builder/controller-kit/memory.ts` |
| O bloco, a pergunta à pessoa e as habilidades | fica de fora | `assistant/assistant.ts:110` (`speakersOf`), `assistant/instructions.ts:36-60`, `conversation/plan-tools.ts:46`, `conversation/instructions.ts:69` | `@mastra/core` `askUserTool`, `createSkill` | — | embrulhado, na casa errada | cada um depende da admissão do Assistente ou de peças do Builder | não precisa | — |
| "Esta conversa é sua?" | U1 | `assistant/routes.ts:72-77`, `construtor/open.ts:62-73`, `agents/conversation-routes.ts:102-104,140-145` | `@mastra/memory@1.41.0` `getThreadById({ threadId, resourceId })`; `@mastra/pg` 1.35.0 filtra no SQL | devolve `null` quando não é do recurso | nativo, com a cola num lugar | — | não precisa | `builder/controller-kit/thread.ts` |
| Os títulos do Builder | fica de fora | `conversation/history.ts:6-24` | `getThreadById` | devolve `null` | nativo | `history.ts` lê títulos e mantém a linha do índice quando não há thread (`conversation/routes.ts:36-53`); não é cola de dono | não precisa | — |
| Listar conversas | U1 | `agents/conversation-routes.ts:122-129`, `construtor/routes.ts:72-79` | `Memory.listThreads({ filter: { resourceId, metadata }, perPage, orderBy })` | filtro por `metadata` (JSONB) | nativo | — | não precisa | `builder/controller-kit/thread.ts` |
| Listar conversas do Assistente e do Builder | fica de fora | `assistant/routes.ts:139-185`; o índice do Hub (decisão 0050) | o Mastra não busca por título | — | embrulhado com razão própria | — | não precisa | — |
| O texto fixo e o cache | U1 | `assistant/instructions.ts:21,88`, `agents/agent.ts:54,336`, `construtor/construtor.ts:72,202` | AI SDK `providerOptions.anthropic.cacheControl` | — | nativo | — | não precisa | `builder/controller-kit/instructions.ts` |
| A frase do título | U1 | `assistant/memory.ts:5-8`, `agents/controller.ts:47-50`, `construtor/construtor.ts:61-64`, `conversation/builder.ts:31-35` | `@mastra/memory@1.41.0` `generateTitle: { model, instructions }` | — | nativo | — | não precisa | `builder/controller-kit/instructions.ts` |
| Ler o contexto do controlador | fica de fora | 12 leituras de `requestContext.get('controller')` | `@mastra/core@1.82.0` `AgentControllerRequestContext` (`dist/agent-controller/types.d.ts:999`), lido pelo próprio Mastra com *cast* (`packages/core/src/agent-controller/agent-controller.ts:2268`) | — | nativo | cada leitor lê um pedaço diferente, alguns ao vivo (`session.state.get()`, `emitEvent`) e alguns testes montam só `{ sessionId }`; um esquema só mudaria o comportamento (leitura do cartão, 2026-11-08) | não precisa | — |
| Turno e fim do turno | fica de fora | `assistant/turn.ts:28`, `construtor/construtor.ts:260`, `controller-kit/turns.ts:74` | `AgentController` (`@mastra/core@1.82.0`) | — | embrulhado, com cópias | a 24.6 não abre turno novo | não precisa | — |
| Apagar no Builder | fica de fora | `conversation/public.ts:43-58` | `Memory.deleteThread` (`@mastra/memory@1.41.0`) | — | embrulhado: o Builder tem passos a mais | a ordem pede prova nos testes de remoção | não precisa | — |
| O hash da tentativa | U3 | `builder/conversation/store.ts:30-32` (`bodyHashOf`) | drizzle-orm `onConflictDoNothing`; calcom `54343aa` `packages/prisma/extensions/booking-idempotency-key.ts`; trigger.dev `41ad199` `internal-packages/database/prisma/schema.prisma:1397` | o índice único dá o "uma vez"; comparar o corpo é de quem escreve | embrulhado | — | não precisa | `platform/attempt.ts` |
| As ids derivadas | fica de fora | `controller-kit/open.ts:17-24`, `builder/tools/derived.ts:7-12`, `apps/web/src/platform/attempt-key.ts:34-42` | RFC 9562 v8 | — | embrulhado sobre `node:crypto`; as ids estão gravadas | trocar o layout de `attemptIdOf` abre conversa nova numa repetição (`automations/run.ts:112`) | não precisa | — |
| "Não confirmamos …" | U4 | ~25 lugares em `apps/web/src` (lista na U4) | `packages/hub-api/src/failures.ts:306` (`phraseOf`) é dono das falhas que assentam; estas aparecem quando nada assentou | — | embrulhado: ao lado de `writeFailureText`, que lê o `phraseOf` | — | não precisa | `apps/web/src/platform/hub.ts` (muda) |
| "Conversa de …" | U4 | `apps/web/src/builder/{conversation/text.ts:86, assistant/text.ts:69, agents/text.ts:128}` | `@mastra/memory@1.41.0` `generateTitle` dá o título | o rótulo da falta de título é nosso | embrulhado, com um defeito: três regras | — | `4A`, 2026-11-08 | `apps/web/src/builder/conversation/text.ts` (muda) |
| "Criar conversa" na tela | fica de fora | sete fluxos com `useMutation` e `useAttemptKey` | TanStack Query 5.104 `useMutation` | — | nativo já em uso | — | não precisa | — |
| A casca da conversa na tela | fica de fora | `assistant/conversation.tsx`, `agents/agent-chat.tsx`, `agents/construtor-chat.tsx` | o `Chat` do Conexus (`builder/conversation/`) | — | embrulhado, com cópias | a 24.6 não cria tela de conversa | não precisa | — |
| O modelo de roteiro dos testes | U5 | `conversation/test-questions.ts:48-57` (`stepping`), `construtor/test-construtor.ts:13-24` (`scripted`) | `ai@6.0.309` `MockLanguageModelV3` fica acima do provedor; o dublê do Conexus fica no fio (T24) | — | embrulhado sobre o `plantAnthropic` | — | não precisa | `builder/conversation/test-questions.ts` (muda) |
| O encaminhar do dublê de conector | U5 | `hub/connectors/test-connections.ts:181-195`, `test-rows.ts:33-46`, `test-write.ts:52-66` | `fetch` do Node | — | embrulhado | — | não precisa | `hub/connectors/test-connections.ts` (muda) |
| As regras de fronteira | fica de fora (PR de método, decisão 2) | `.dependency-cruiser.cjs:1,9,10`; a violação `hub/notifications/request-notices.ts:38` | dependency-cruiser 18.4 não vê o nome importado (`types/cruise-result.d.mts:200-290`) | regras de caminho | nativo (configuração do dependency-cruiser) | — | decisão 2, aceita em 2026-11-08 | — |

**A medida do transplante.** Nada vem do produto antigo.

**A dívida.**

- O comentário de `hub/connectors/write-record.ts:197` diz "U2's gate sets `approvedBy`", mas quem
  o põe é `builder/agents/tools.ts:158`. A U2 corrige o comentário.
- O comentário "same bytes as the Assistant's first part" de `construtor/construtor.ts:66` e de
  `agents/agent.ts:49` é falso. A U1 o apaga com o `CACHED`.

## U1 O kit como casa comum

**Base e modelo.** O `main` do dia. Sonnet: movimentos e colas sobre APIs nativas já usadas, sem
concorrência nova.

### As linhas da tabela

"O modelo e a memória das conversas", "Esta conversa é sua?", "Listar conversas", "O texto fixo e
o cache", "A frase do título".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/controller-kit/` | Cria `model.ts`, `memory.ts`, `thread.ts`, `instructions.ts`; muda `public.ts` | as quatro conversas |
| `builder/conversation/{builder,turn-of,public}.ts` | Muda: o que se move sai daqui; `createBuilder` importa do kit | `builder/agents/`, `builder/assistant/`, `builder/construtor/` |
| `builder/assistant/{routes,memory,instructions}.ts`, `builder/agents/{agent,controller,conversation-routes,frozen}.ts`, `builder/construtor/{construtor,open,routes}.ts`, `builder/assistant/{assistant,turn}.ts` | Muda: chamam o kit | — |

O kit já importa `model-accounts/public.ts` (`controller-kit/open.ts`, `turns.ts`), e
`model-accounts` não importa o kit nem a conversa fora dos testes: os movimentos abaixo não fecham
ciclo.

### Os contratos que a unidade cria

```ts
// builder/controller-kit/model.ts — movidos de conversation/builder.ts:38-64, sem mudar o corpo
export function sessionModel(requestContext: RequestContext): ModelId & `${string}/${string}`
export function routedModel(modelId: ModelId): ModelId & `${string}/${string}`
export function toolsOf(modelId: ModelId): ToolsInput

// builder/controller-kit/memory.ts — movidos de conversation/builder.ts:95-146 e turn-of.ts, sem mudar o corpo
export function conversationMemory(deps: { storage: PostgresStore; queue: QueueDeps; title: string; observer: string; recall: boolean }): Memory
export async function turnOfOwner(queue: QueueDeps, owner: Owner): Promise<Turn>
export function sideTurn(queue: QueueDeps): (requestContext: RequestContext) => Promise<Turn | undefined>

// builder/controller-kit/thread.ts
/** A conversa do tipo e do dono; senão CONVERSATION_NOT_FOUND (S10). */
export async function ownThread(memory: Memory, kind: ControllerKind, owner: Owner, threadId: ConversationId): Promise<StorageThreadType>
/** As conversas do dono com as marcas dadas, a última mudança primeiro, sem página. */
export async function listOwned(memory: Memory, kind: ControllerKind, owner: Owner, marks: Readonly<Record<string, string>>): Promise<StorageThreadType[]>

// builder/controller-kit/instructions.ts
/** O texto fixo de um tipo como mensagem de sistema, com o cache de 1 h da Anthropic. */
export function fixedSystem(text: string): Readonly<{ role: 'system'; content: string; providerOptions: typeof CACHED }>
/** As frases de título, uma por assunto: a pergunta (Assistente, agentes), o app (Builder), o agente (Construtor). */
export const TITLE: Readonly<Record<'ask' | 'app' | 'agent', Readonly<{ title: string; observer: string }>>>
```

- `Memory` é a classe de `@mastra/memory`, cujo `getThreadById` aceita `resourceId`, como nos
  chamadores de hoje. A classe abstrata `MastraMemory` não aceita.
- **Dono de cada fato** (C26): o cache e as frases do título, só em `instructions.ts`; a cola de
  dono e de lista, só em `thread.ts`.
- **O arquivo tomado como modelo:** `builder/controller-kit/release.ts` (uma função, as
  dependências por parâmetro). Cumpre C21, C23 e C26.

### As skills e a leitura

A linha de `docs/reference/stack.md` para `apps/server/src/builder/`: a skill `mastra`. Leia antes
`node_modules/@mastra/memory/dist/docs` sobre `getThreadById`, `listThreads` e `generateTitle`.

### A ordem do trabalho

1. **Mover sem mudar o corpo.**
   - `isRouterId`, `SEARCH_PROVIDERS`, `sessionModel`, `routedModel` e `toolsOf` saem de
     `conversation/builder.ts:38-64` para `controller-kit/model.ts`.
   - `conversationMemory` sai de `conversation/builder.ts:95-146` (com o comentário de cima) para
     `controller-kit/memory.ts`.
   - `turnOfOwner` (`conversation/turn-of.ts:41-45`), `sideTurn` (`:104-110`) e o `ownerIn` que
     `sideTurn` chama vão para `controller-kit/memory.ts`. `turn-of.ts` passa a importá-los do kit.
   - `conversation/public.ts:22` e `:33` deixam de reexportá-los, e cada importador passa a
     `controller-kit/public.ts`: `agents/agent.ts`, `agents/controller.ts`, `agents/frozen.ts`,
     `assistant/assistant.ts`, `assistant/memory.ts`, `assistant/turn.ts` e
     `construtor/construtor.ts` (grep pelos cinco nomes).

   Regras: C3, C26. Um commit só para o movimento, com `npm run deps` e `npm run typecheck` verdes
   antes do passo 2.
2. **`ownThread`.** O corpo é o de `construtor/open.ts:62-73`, com o tipo como parâmetro. Ele
   substitui `assistant/routes.ts:72-77`, `construtor/open.ts:62-73` (`threadOf` passa a chamá-lo
   ou sai) e as duas leituras de `agents/conversation-routes.ts`. Em `:102-104` a troca é direta.
   Em `:140-145` o `null` se junta a `run === undefined` na mesma recusa: chame
   `ownThread(...).catch(...)` ou deixe a leitura direta, e escolha o que mantém uma recusa só.
   `guard.ts:174` fica: ele lê o dono **a partir** do thread. `conversation/history.ts` também
   fica: ele lê títulos e devolve `null` de propósito.
3. **`listOwned`.** O corpo é o de `agents/conversation-routes.ts:122-129`, com a marca como
   parâmetro. O Construtor (`construtor/routes.ts:72-79`) passa a chamá-lo. `summaryOf` continua em
   cada rota.
4. **`fixedSystem` e `TITLE`.**
   - Os três `CACHED` e as três montagens `{ role: 'system', content: FIXED, providerOptions:
     CACHED }` (`assistant/instructions.ts:21,88`, `agents/agent.ts:54,336`,
     `construtor/construtor.ts:72,202`) passam a `fixedSystem(FIXED)`.
   - O texto continua lido por cada tipo.
   - As frases de `assistant/memory.ts:5-8` e de `agents/controller.ts:47-50` passam a
     `TITLE.ask`; as de `conversation/builder.ts:31-35`, a `TITLE.app`; as de
     `construtor/construtor.ts:61-64`, a `TITLE.agent`. O texto não muda.
   - Apague o comentário falso "same bytes as the Assistant's first part" de `construtor.ts:66` e de
     `agents/agent.ts:49`: o texto fixo do Assistente junta vários arquivos
     (`assistant/instructions.ts:15-18`).

### Como se prova

- Critérios 1 a 4: `npm run deps`, `npm run typecheck` e o lint.
- Os testes das pastas tocadas, um arquivo de cada vez, pelo script do pacote do servidor.
- Nenhuma asserção muda.

### Parar se

- Um movimento do passo 1 cria um ciclo que `npm run deps` recusa. Pare e mostre o ciclo.
- Uma asserção de teste precisa mudar.
- `listOwned` precisa de outra ordem ou de outro filtro para um dos dois tipos.

## U2 A regra de escrita com um dono

**Base e modelo.** O `main` com a U1. Opus: a unidade cruza módulos (`builder/agents` e
`hub/connectors`) e mexe numa regra de segurança, a de quem escreve sozinho.

### As linhas da tabela

"A ferramenta decide se pergunta" (só o chamador muda), "A regra de negócio 'pergunta ou faz'",
"Quem pode aprovar", "Pode usar a operação X".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `hub/connectors/approval.ts` | Cria | `builder/agents/` (e a U2 da 24.6) |
| `hub/connectors/public.ts` | Muda: exporta `mustAsk`, `mayApprove`, `mayLeaveAlone`, `publisherLeavesAlone`, `Ask`, `WriteAuthorOf`, `WriteTarget`, `ApprovalDeps` | `builder/agents/` |
| `hub/identity/may-use.ts`, `hub/identity/public.ts` | Muda: `speakerOf` e `personOf` | `hub/connectors/`, `builder/agents/` |
| `hub/connectors/{write,publish-check,speaking,assistant-port}.ts` | Muda: chamam `speakerOf` ou `personOf` | — |
| `hub/connectors/write-record.ts` | Muda: só o comentário de `:197` | — |
| `builder/agents/{tools,publish,write-of,agent,choose}.ts` | Muda: chamam `approval.ts` | o controlador do agente |

### Os contratos que a unidade cria

Em `hub/connectors/approval.ts`. É o contrato da U2 do cartão da 24.6, com os autores de hoje. A
24.6 acrescenta o autor `WORKFLOW`, o `where` e o `callKey`, e adota os nomes daqui:
`answeredBy` (no lugar de `publishedBy`, porque desde o PR 846 quem responde pela versão ativa é
`agent.active_by`) e `threadId` (que a 24.6 transforma em `where`).

```ts
/** A operação que a regra confere: a ligação, o conector do kit e a operação (o Target de identity). */
export type WriteTarget = Readonly<{ connectionId: ConnectionId; connectorId: ConnectorId; operationId: OperationId }>
export type ApprovalDeps = Readonly<{
  database: Database
  identity: Pick<IdentityPorts, 'roleOf' | 'mayUse' | 'mayPublishUnattended'>
  openWrites: (key: OpenWritesKey) => Promise<readonly OpenWrite[]>
}>
/** Quem escreve: o rascunho (a pessoa que conversa) ou uma versão publicada, com quem responde por ela. */
export type WriteAuthorOf =
  | Readonly<{ kind: 'DRAFT' }>
  | Readonly<{ kind: 'PUBLISHED'; answeredBy: PersonId | null }>
export type Ask =
  | Readonly<{ kind: 'DO' }>
  | Readonly<{ kind: 'ASK'; reason: 'CHOSEN' | 'PUBLISHER_LOST_RIGHT' | 'OPEN_WRITE' }>
export async function mustAsk(deps: ApprovalDeps, a: Readonly<{
  companyId: CompanyId
  choice: 'ASK' | 'AUTO'
  author: WriteAuthorOf
  scope: SessionScope
  threadId: ConversationId
  target: WriteTarget
}>): Promise<Ask>
/** D3-a: quem aprova tem a escrita no próprio papel, lido agora (o holdsWrite de hoje). */
export async function mayApprove(deps: Pick<ApprovalDeps, 'database' | 'identity'>, a: Readonly<{ companyId: CompanyId; personId: PersonId; target: WriteTarget }>): Promise<boolean>
/** D2-a: quem responde pela versão ainda está, e o papel dele tem a ação e a escrita, lidos agora. */
export async function publisherLeavesAlone(deps: Pick<ApprovalDeps, 'database' | 'identity'>, companyId: CompanyId, answeredBy: PersonId | null, target: WriteTarget): Promise<boolean>
/** D1-a: quem salva, publica ou restaura pode deixar a escrita em Faz sozinho; senão NOT_IN_ROLE com o rótulo. */
export async function mayLeaveAlone(identity: Pick<IdentityPorts, 'roleOf' | 'mayPublishUnattended'>, tx: ReadTx, a: Readonly<{ companyId: CompanyId; personId: PersonId; write: WriteTarget & { slug: string } }>): Promise<void>
```

Em `hub/identity/may-use.ts`, exportados por `hub/identity/public.ts`:

```ts
/** A pessoa como o papel que tem agora, lido na transação de quem chama; nenhum para quem não é membro. */
export async function speakerOf(tx: ReadTx, companyId: CompanyId, personId: PersonId): Promise<PersonSpeaker | undefined>
/** A pessoa com um papel que quem chama já leu (a admissão do Assistente). */
export function personOf(personId: PersonId, role: Role): PersonSpeaker
export type PersonSpeaker = Extract<Speaker, { kind: 'PERSON' }>
```

Em `builder/agents/publish.ts`, que fica dono da leitura das tabelas do agente (C8):

```ts
/** Quem responde pela versão hoje: agent.active_by para a ativa, agent_version.published_by para outra (PR 846). */
export async function publisherOf(deps: Holding, companyId: CompanyId, version: { agentId: AgentId; number: number }): Promise<PersonId | null>
```

- A recusa **não** se unifica. `mayLeaveAlone` lança `Failure('NOT_IN_ROLE')` com o rótulo, para a
  tela. `mustAsk` e `mayApprove` devolvem valores. O funil de escrita continua respondendo ao modelo
  só o tipo, com a razão no log (S10).
- **O arquivo tomado como modelo:** `hub/identity/may-use.ts`: funções sobre portas, sem tabela
  alheia. Cumpre C21, C23 e C26.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `hub/identity/` (a skill de better-auth) e para
`builder/` (a skill `mastra`). Leia `node_modules/@mastra/core/dist/docs` sobre "Conditional
approval with a function", e a seção U2 do cartão da 24.6 (PR 842), de onde este contrato vem.

### A ordem do trabalho

1. **`speakerOf` e `personOf`** em `may-use.ts`. Troque as montagens:
   - `publish.ts:89-103` (`refuseByRole`) e `publish-check.ts:42-50` passam a `speakerOf`; o caso
     sem papel continua o mesmo de hoje em cada um;
   - `write.ts:81-98`: o papel é lido na transação junto da ligação; passa a `speakerOf` na mesma
     transação;
   - `speaking.ts:12-21`: `personSpeaker` passa a chamar `speakerOf` dentro da sua leitura;
   - `assistant-port.ts:109-118`: o papel vem da admissão, e a montagem passa a `personOf`, sem
     segunda leitura.

   Regras: C26, S10.
2. **`approval.ts`.**
   - `holdsWrite` (`publish.ts:216-225`) vem como `mayApprove`, e `roleNow` (`:209-214`) vem
     sem exportar; os corpos não mudam.
   - `publisherLeavesAlone` vem **sem a leitura de tabela**: o `select` de `publish.ts:241-252`
     fica em `publish.ts` como `publisherOf`, e o resto do corpo (`:253-260`) vem para
     `approval.ts` recebendo `answeredBy`.
   - `mayLeaveAlone` (`publish.ts:166-178`) vem com o parâmetro `a` acima, e o rótulo passa a
     `operationLabel(write.connectorId, write.operationId)` de `hub/connectors/role-kit.ts`, a
     mesma função que `labelOf` chama hoje (`publish.ts:139-141`).
   - `choose.ts:56` e `refuseUnheld` (`publish.ts:184-188`) chamam o novo `mayLeaveAlone`.
3. **`mustAsk`.** O corpo junta a função `requireApproval` de hoje (`tools.ts:137-147`) e
   `aloneByPublisher` (`tools.ts:117-121`):

   ```ts
   if (a.choice === 'ASK') return { kind: 'ASK', reason: 'CHOSEN' }
   if (a.author.kind === 'PUBLISHED' && !(await publisherLeavesAlone(deps, a.companyId, a.author.answeredBy, a.target)))
     return { kind: 'ASK', reason: 'PUBLISHER_LOST_RIGHT' }
   const open = await deps.openWrites({ scope: a.scope, threadId: a.threadId, connectionId: a.target.connectionId, operation: a.target.operationId })
   return open.length > 0 ? { kind: 'ASK', reason: 'OPEN_WRITE' } : { kind: 'DO' }
   ```

4. **`builder/agents/tools.ts`.**
   - Em `Deps` (`tools.ts:40-50`), `leavesAlone` dá lugar a `publisherOf: (version:
     Extract<WriteAuthor, { kind: 'VERSION' }>) => Promise<PersonId | null>` e a `approval:
     ApprovalDeps`.
   - `agent.ts:264-269` passa a encher os dois: `publisherOf` chama o de `publish.ts`, e
     `approval` leva `database`, `identity` e `openWrites` (a mesma `deps.connectors.openWrites`
     que `tools.ts:142` chama hoje).
   - `writeTool.requireApproval` guarda as duas recusas de hoje: a ligação que o lugar não oferece
     mais (`targetOf` dá `undefined`) e o `threadId` que não vem no `requestContext` perguntam.
   - Depois, ela é `(await mustAsk(deps.approval, { companyId, choice: tool.approval, author, scope,
     threadId, target })).kind === 'ASK'`, com `author` `{ kind: 'DRAFT' }` ou `{ kind:
     'PUBLISHED', answeredBy: await deps.publisherOf(deps.author) }`.
   - `aloneByPublisher` sai. A mecânica continua do Mastra.
5. `write-of.ts:62` chama `mayApprove`. Corrija o comentário de `write-record.ts:197`.

### Como se prova

- Critérios 5 a 7, pela porta pública (T5): os mundos `test-approval.ts` e `test-agents.ts` e os
  testes de `hub/connectors`. Nenhuma asserção muda. `reason` não sai pela porta; quem o confere é
  o efeito (cartão ou não).
- Mutações na frente do construtor, cada uma derrubando um teste:
  1. tirar o ramo do `DRAFT` (o caso do rascunho do critério 5);
  2. tirar a consulta de `openWrites` (o caso da escrita aberta);
  3. ler `publishedBy` no lugar de `publisherOf` (o caso "quem restaura responde" do PR 846).

### Parar se

- Um teste da 24.5 precisa mudar a asserção.
- Um lugar das montagens do passo 1 faria uma segunda leitura do papel.
- `mustAsk` precisaria de um campo que a função `requireApproval` não tem na hora (o contexto dela
  é uma cópia simples do `requestContext`, sem a pessoa, `@mastra/core@1.82.0`
  `packages/core/src/tools/types.ts:814`).

## U3 Um hash de tentativa

**Base e modelo.** O `main` do dia. Sonnet.

### As linhas da tabela

"O hash da tentativa".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `platform/attempt.ts` | Cria | `builder/conversation/routes.ts:19`, `builder/tools/tools.ts:15`, `builder/tools/versions.ts:13`, `builder/tools/choice.ts:5`, `builder/agents/agents.ts:16`, `builder/automations/automations.ts:19` (e a 24.6) |
| `builder/conversation/store.ts`, `builder/conversation/public.ts:31` | Muda: `bodyHashOf` sai | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/platform/attempt.ts
/** O hash pelo qual uma Idempotency-Key repetida é comparada (C37): nunca o corpo. sha256, base64url. */
export function bodyHashOf(body: unknown): string
```

- O corpo é o de `builder/conversation/store.ts:30-32`, sem mudança: os hashes gravados continuam
  valendo.
- O `hashOf` hex de `hub/connectors/write-record.ts:72` **fica**. Ele está gravado em
  `connector_write.input_hash`, e trocar a codificação faria a repetição de uma linha antiga
  responder conflito.
- `attemptIdOf` (`controller-kit/open.ts:17`) e `derivedUuid` (`builder/tools/derived.ts:7`)
  ficam. A U3 acrescenta, acima de cada um, uma linha dizendo por que são dois: as ids de
  `attemptIdOf` estão gravadas.

### A ordem do trabalho

1. Crie `platform/attempt.ts` com o corpo de hoje. Regras: C37 e C7 (o `platform/` não tem
   sujeito).
2. Troque os seis importadores e tire `bodyHashOf` de `store.ts` e da porta da conversa.

### Como se prova

Critério 8: os testes de hoje das quatro criações; `npm run deps`.

### Parar se

Um importador precisa de outro algoritmo de hash.

## U4 Frases e título

**Base e modelo.** O `main` com a U1, e a decisão 4 respondida. Sonnet.

### As linhas da tabela

"Não confirmamos …", "Conversa de …".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/platform/hub.ts` | Muda: `unconfirmedText` ao lado de `writeFailureText` (`:256`) | as telas abaixo |
| as telas da lista de frases abaixo | Muda: as constantes passam a `unconfirmedText` | — |
| `apps/web/src/builder/conversation/text.ts` | Muda: o `titleOf` único | `builder/conversation/{panel,conversation-switch}.tsx`, `builder/assistant/{conversation-row,home,conversation-menu,day,conversation}.tsx`, `builder/agents/{rows,construtor-chat}.tsx` |
| `packages/hub-api/src/assistant.ts:34-38`, `agents.ts:166-173`, `construtor.ts:97-101` | Muda: `createdAt`; `title` anulável nos dois últimos | `builder/assistant/routes.ts:98-106,191-197`, `builder/agents/conversation-routes.ts:47-55`, `builder/construtor/routes.ts:36-42`, os dublês da web `builder/agents/test-hub.tsx` e `builder/assistant/test-hub.tsx` |

### Os contratos que a unidade cria

```ts
// apps/web/src/platform/hub.ts
/** "Não confirmamos <o quê>. <depois>": o texto de uma escrita cujo fim não se sabe (C37, C48). */
export function unconfirmedText(what: string | undefined, next: string): string

// apps/web/src/builder/conversation/text.ts
/** O rótulo de uma conversa: o título, ou "Conversa de <data>" pela regra da decisão 4. */
export function titleOf(conversation: Readonly<{ title: string | null; createdAt: string }>): string
```

- Com `4B`, o campo é `updatedAt`, e o resumo do Builder (`packages/hub-api/src/conversations.ts:62-66`,
  hoje só `createdAt`) ganha `updatedAt`. Pare se o índice do Hub não tiver a coluna.
- `next` é texto livre de propósito: cada tela diz o próximo passo dela.
- **As frases de hoje**, que não mudam letra por letra (caminhos em `apps/web/src/`):
  - `builder/conversation/text.ts:20,28-29,51,53`
  - `builder/assistant/text.ts:64,66,93,118`
  - `builder/agents/text.ts:34,35,37,38`
  - `builder/automations/text.ts:8,9`
  - `builder/model-accounts/text.ts:26,35` e `key-form.tsx:16`
  - `hub/identity/role-editor.tsx:25` e `member-actions.tsx:16`
  - `hub/projects/delete-project-dialog.tsx:14` e `name-step.tsx:20`
  - `hub/connectors/link-dialog.tsx:32` e `unlink-dialog.tsx:11`
  - `hub/requests/text.ts:6`
  - `hub/operations/register-client-form.tsx:19` e `delete-client-dialog.tsx:14`
- "Não confirmamos a criação da conversa. Tente de novo." vira uma constante só, em
  `builder/conversation/text.ts`; os agentes e o Assistente a importam.
- O dublê de teste `builder/conversation/test-start.tsx:20` fica como está.

### A ordem do trabalho

1. **`unconfirmedText`.** Cada constante passa a `unconfirmedText('<o quê>', '<depois>')`, com as
   duas partes copiadas da frase de hoje. A de `builder/assistant/text.ts:93` ("Não confirmamos.
   Veja a lista.") passa a `unconfirmedText(undefined, 'Veja a lista.')`. Regras: C48, C26.
2. **Os contratos.** Mudam os três resumos; os servidores passam a `thread.title || null` e
   `thread.createdAt.toISOString()`, como `assistant/routes.ts:102` já faz com o título. Os dois
   dublês da web ganham o campo.
3. **Um `titleOf`**, em `builder/conversation/text.ts`. Os de `builder/assistant/text.ts:69` e
   `builder/agents/text.ts:128` saem, e os importadores da tabela do raio passam ao único.

### Como se prova

Critérios 9 a 11: `text.test.ts` novo, com uma conversa sem título antes e depois de uma
mensagem; `hub.test.ts` com cada frase da lista escrita por extenso; os testes de rota dos três
servidores com `title: null` e `createdAt`.

### Parar se

- Um texto mudaria uma letra.
- A decisão 4 não foi respondida.
- Um leitor do resumo fora do raio aparece no `npm run typecheck`. Acrescente-o e diga no relatório
  (L7); se ele muda o que a pessoa vê, pare.

## U5 Dois ajudantes de teste

**Base e modelo.** O `main` do dia. Sonnet.

### As linhas da tabela

"O modelo de roteiro dos testes", "O encaminhar do dublê de conector".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `builder/conversation/test-questions.ts` | Muda: `stepped` no lugar de `stepping` | os testes que chamam `stepping` e `builder/construtor/test-construtor.ts` |
| `builder/construtor/test-construtor.ts` | Muda: `scripted` passa a `stepped` | os testes do Construtor |
| `hub/connectors/test-connections.ts` | Muda: `forward` | `test-rows.ts`, `test-write.ts` |

### Os contratos que a unidade cria

```ts
// builder/conversation/test-questions.ts; Sent e Anthropic de platform/test-anthropic.ts (como o arquivo já importa), Block de platform/test-anthropic-stream.ts
/** Os passos do modelo em ordem, depois `Pronto.`; o pedido sem stream responde `Título`; cada chamada vai para `calls`, quando dado. */
export function stepped(steps: readonly ((asked: Sent) => Block[])[], calls?: Sent[]): Anthropic['answer']

// hub/connectors/test-connections.ts
/** Encaminha um pedido ao dublê de conector, sem o cabeçalho host e com redirect manual; devolve a resposta para quem chama escrever, ler ou cortar. */
export async function forward(origin: string, incoming: IncomingMessage, body: Buffer | undefined): Promise<Readonly<{ status: number; headers: Record<string, string>; body: Buffer }>>
```

### A ordem do trabalho

1. **`stepped`.** O corpo junta `stepping` (`test-questions.ts:48-57`) e `scripted`
   (`test-construtor.ts:13-24`). `stepping(steps, calls)` passa a `stepped(steps.map((blocks) => ()
   => blocks), calls)`, e `scripted(steps)` passa a `stepped(steps)`. Os dois nomes saem.
   `writing`, `versionWriting`, `researching`, `citing` e `answering` ficam: respondem pelo texto
   ou por outra forma.
2. **`forward`.** O corpo é o bloco de `test-connections.ts:181-195` sem a escrita da resposta.
   `test-connections.ts`, `test-rows.ts:33-46` e `test-write.ts:52-66` passam a chamá-lo, e cada um
   escreve, lê ou corta a resposta como hoje. `test-sales.ts` (monta um `Request`) e
   `limits.test.ts:102` (sem `redirect: 'manual'`) ficam como estão.

### Como se prova

Critério 12: os testes de cada arquivo tocado, sem mudar a asserção.

### Parar se

Um teste passa a depender da ordem dos passos de outro jeito.
