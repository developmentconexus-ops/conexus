# Etapa 20: App com dados

## A página do fundador

**No fim desta etapa** um app da Padaria Sol **mostra dados do Sankhya e do Mercado Livre** da
empresa. A Ana libera cada ligação para um Projeto, na nova **barra do Projeto**, que toma o lugar
da barra da empresa, como no Conexus OS. O Builder lê poucas linhas reais para acertar o app e anota
no **caderno da ligação** o que descobriu. O Hub nunca trava porque um fornecedor está lento ou
pediu para esperar. Nada disso é do Sankhya nem do Mercado Livre: cada peça serve a qualquer
conector, e o que muda de um para outro o próprio conector declara.

**O roteiro de uso.** Padaria Sol: Ana (dona), Bruno (membro, constrói) e Carla (usa o app como
Vendedora, etapa 18). O Sankhya está ligado (19) e o Mercado Livre também (19.1). No computador e no
celular.

1. A Ana abre o Projeto "Vendas". A barra da esquerda vira a **barra do Projeto**: no alto, "Vendas"
   com a troca de Projeto; depois "← Padaria Sol" (volta para a empresa), **Construir** (a Prévia, o
   Código, as Alterações e a conversa), **Sobre**, **Quem usa o app** e **Integrações**; embaixo, a
   conta. No celular, tudo isso está na gaveta do botão do alto.
2. Em **Integrações** do Projeto ela vê "Sankhya: não liberado" e toca **Liberar para ler**. A frase
   diz: "O app e o Builder poderão ler o Sankhya da empresa. Quem usa o app vê o que o app mostrar."
   Se a empresa tivesse dois Sankhya ligados, ela escolheria qual, pelo nome: o Sankhya declara uma
   ligação por Projeto. Ela libera também as duas lojas do Mercado Livre: ele declara várias.
3. O Bruno pede ao Builder: "um painel com o faturamento do dia por vendedor e as perguntas sem
   resposta do Mercado Livre". O Builder lê poucas linhas do Sankhya, descobre que, na Padaria Sol, o
   vendedor está no campo próprio `AD_CODVEND`, prova isso com uma consulta e anota no caderno:
   "Vendedor do pedido: `TGFCAB.AD_CODVEND`". O caderno guarda nomes de campo e a consulta, nunca
   valores.
4. O app aparece na Prévia com os números de verdade. Em **Integrações** da empresa, na página do
   Sankhya, a Ana vê o **Caderno** com a anotação, quem a fez e quando, e pode **Apagar**.
5. O Bruno publica. A Carla abre o app: como Vendedora, vê só o faturamento dela, porque a operação
   do app tem o papel (18). Ela nunca vê chave nenhuma.
6. A Ana toca **Tirar** no Mercado Livre do Projeto. No clique seguinte, a parte do Mercado Livre
   mostra "O Mercado Livre não está liberado para este app."; o painel do Sankhya continua. Tirar não
   desliga a ligação: só **Desligar**, em Integrações da empresa, a apaga, e leva junto as liberações
   e o caderno.

**O que você faz, e quando.**
- **Antes do teste no Hub de verdade** (não antes do código, que roda com o Sankhya e o Mercado
  Livre de mentira): o Sankhya e o Mercado Livre ligados, como ficaram na 19 e na 19.1. Recomendado:
  um **usuário de integração só para o Conexus** no Sankhya (por exemplo "CONEXUS"), com perfil só de
  consulta, e o X-Token gerado para ele. O Sankhya dá ao Conexus exatamente o que esse usuário pode,
  e assim a tela de sessões do Sankhya mostra "Conexus" pelo nome. Use **Conectar de novo** no
  Sankhya com as chaves desse usuário.
- **No começo:** aprova esta página. A sua aprovação é também a palavra que a regra de dados D11
  pede para a lista de permissões do banco ganhar a tabela da liberação e o campo do caderno (a U2).
- **No fim:** faz o roteiro no computador e no celular, diz o que viu e aprova os textos das telas.

**Fica de fora.**
- **Escrever pelo app** (responder uma pergunta do Mercado Livre): a 20.1. Lá vem também a escolha
  operação por operação, que a sua `S1` deixou para a escrita.
- **Avisos do fornecedor e tarefas sozinhas** (o app que se atualiza): a 20.2, com a fila no banco
  (pg-boss). Até lá, toda chamada nasce de um clique ou de uma conversa.
- **Uma fila justa entre empresas** (`T-A`): nenhuma plataforma de referência tem. Fica a espera que
  o fornecedor pede, uma chamada por vez em cada ligação e uma linha de registro por chamada com a
  empresa. O gatilho para rever: o primeiro 429 do Mercado Livre no registro, um consumo acima da
  metade da cota do app, ou a 20.2.
- **Dados e Capacidades na barra do Projeto**: entram quando existirem, nunca como "em breve"
  (regra W31). Nenhuma das duas tem etapa ainda.
- **Um Projeto que lê dois Sankhya**: o Sankhya declara uma ligação por Projeto. Muda o conector, não
  o Hub, quando uma empresa pedir.
- **Das pendências marcadas para o próximo cartão:** entra a #470 (o status 4 do Sankhya: a fila de
  uma chamada por ligação, na U3, é a causa que ela pede). As outras não tocam conector, a porta do
  app, as ferramentas do Builder nem a moldura do Projeto, e esperam o fechamento de cada etapa
  delas.

**As decisões suas nesta etapa.**

Dadas em 2026-10-30, nas suas palavras: `S S1`, `2. R2`, `Ta`. O cartão as segue assim:
- **`S1`**: **Liberar para ler** vale para a ligação inteira, todas as leituras dela.
- **`R2`**: a barra do Projeto toma o lugar da barra da empresa, como o Conexus OS. As regras W30 e
  W31 do guia web mudam junto (a U0 escreve o texto novo; ele entra no guia no fechamento, porque um
  guia só muda num fechamento, regra L20).
- **`T-A`, com o ajuste**: (1) a liberação Projeto-ligação, sem teto; quantas ligações de um conector
  um Projeto usa, o conector declara (Sankhya uma, Mercado Livre várias; a sua nota de 2026-10-29);
  (2) sem fila justa: a espera do 429 (já no `main`), uma chamada por vez em cada ligação, e uma linha
  de registro por chamada com a empresa; (3) o caderno como um campo da própria ligação, como os
  metadados de ligação do Nango.
- A sua nota de 2026-10-29 sobre a barra ("banco de dados, capabilities e integrações e acessos"):
  Integrações e Quem usa o app entram agora; Dados e Capacidades entram com as suas etapas.

**`A`. Onde ficam as Versões.** Hoje a aba "Projeto", no alto do Projeto, tem Sobre, Versões e Quem
usa o app. Com a `R2`, Sobre e Quem usa o app viram entradas da barra.
- **`A1` (decidida pelo fundador, 2026-10-30: `2 A1`):** a aba "Projeto" do alto sai. **Sobre** abre uma
  página com duas partes, Sobre e Versões (e Publicação, quando vier). O Construir fica com Prévia,
  Código e Alterações. Exemplo: a Ana toca **Sobre** e vê o nome, a descrição e, ao lado, Versões com
  a lista e **Publicar esta**.
- **`A2`:** a aba "Projeto" do alto fica, só com Versões.
- Veredito: `A1` nativo (o Conexus OS: "Sobre" era a página de ajustes do Projeto, `e0353c36
  apps/web/src/app/shell.tsx:94-95`); `A2` deixa uma aba de uma parte só e repete a barra no alto.
  Como nativo: a página de Sobre com as abas da biblioteca de telas, como a aba Projeto faz hoje.

**O tamanho.** Cerca de 3.000 linhas de código, abaixo do teto de 4.000 da regra L2.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U0 | A barra do Projeto (`R2`): o alto com o nome e a troca de Projeto, "← empresa", Construir, Sobre (com Versões, `A1`), Quem usa o app; os endereços próprios e o antigo que redireciona; o texto novo de W30 e W31 | `apps/web/src/ui/frame.tsx`, `apps/web/src/hub/projects/`, `apps/web/src/routes/_app/companies/$companyId/`, `docs/reference/screens.md` | [web](../guides/web.md) | nada: começa já |
| U1 | O kit e o contrato do app: o conector declara `perProject`; toda ligação vai uma chamada por vez (sai `oneRequestAtATime`); o logout declarado do Sankhya; as leituras por nome com tipos (`@conexus/connectors/calls`); `AppProps.connectors`, `ConnectorAnswer`, `Manifest.connectors`; `defineConnectors` e o cliente tipado; a máquina recebe o kit; a skill `conexus-data` | `packages/connectors/`, `packages/app-contract/src/`, `packages/app/`, `infra/e2b/sdk.ts`, `.dependency-cruiser.cjs` | [testing](../guides/testing.md) | nada: começa já |
| U2 | A tabela `connectors.project_connection` e o campo `connection.notes`; as permissões do banco (D11) | `apps/server/migrations/`, `apps/server/src/hub/connectors/tables.ts`, `apps/server/database-grants.sql` | [data](../guides/data.md) | nada: começa já |
| U3 | O Hub: a fila de uma chamada por ligação e o dono do token (`limits.ts`), o banco solto durante a chamada e o `max` do pool, as rotas da liberação, a porta da borda para o app, o Publicar que recusa, a linha por chamada, a porta do Builder, o caderno no Hub, as decisões 0058 e 0056 corrigidas | `apps/server/src/hub/connectors/`, `apps/server/src/hub/apps/`, `apps/server/src/platform/database.ts`, `apps/server/src/main.ts`, `packages/hub-api/src/`, `docs/decisions/` | [security](../guides/security.md) | U1, U2 |
| U4 | O dispatcher: a entrada `Connectors` ao lado de `Db`, `hubOf.callAppConnector` e `listAppConnections` | `apps/edge/src/` | [security](../guides/security.md) | U3 |
| U5 | O Builder: as ferramentas de leitura e do caderno só com a liberação, o corte das leituras, a skill do conector por liberação, o bloco das ligações nas instruções, a linha do aviso 0032 | `apps/server/src/builder/connectors/`, `apps/server/src/builder/conversation/`, `apps/server/src/main.ts`, `packages/hub-api/src/tools.ts`, `docs/decisions/0032-data-leaving-brazil-told.md` | [code](../guides/code.md) (só ele) | U3 |
| U6 | As telas da liberação e do caderno: Integrações do Projeto (Liberar para ler, Tirar, a escolha pelo nome), a entrada Integrações na barra, o Caderno na página da ligação com Apagar | `apps/web/src/hub/connectors/`, `apps/web/src/hub/projects/`, `apps/web/src/routes/_app/companies/$companyId/`, `packages/hub-api/src/pages.ts`, `docs/reference/screens.md` | [web](../guides/web.md) | U0, U3 |

U0, U1 e U2 correm em paralelo desde a aprovação desta página: não dividem pasta. A U0 não toca
nenhum arquivo da 19.1. A U1 e a U2 tocam arquivos do kit e do Hub que a rodada de consertos da 19.1
ainda pode mudar (`kernel/definition.ts`, `sankhya/answers.ts`, `probe.ts`, `tables.ts`): pela regra
L1, cada uma começa só depois que a rodada que tocar esses arquivos entrar no `main`, e o que essa
rodada já fez (o logout do Testar, por exemplo) ela reusa. U4 e U5 correm em paralelo depois da U3. A U6
vem por último. Os arquivos que a 19.1 ainda mudar (`apps/server/src/hub/connectors/`,
`apps/web/src/hub/connectors/`) a U3 e a U6 tomam do `main` quando começam.

**Orçamento de código alterado.** U0: ~380. U1: ~480. U2: ~110. U3: ~900. U4: ~180. U5: ~480. U6:
~420. Total da etapa: ~2.950. Testes, a skill e os gerados ficam fora da conta. Hipótese, estimada
pelos arquivos vizinhos (a U2 da 19.1 com ~830; o protótipo R2 com +242).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U0 | Dentro de um Projeto a barra mostra o nome do Projeto com a troca, "← <empresa>", Construir, Sobre, Quem usa o app e a conta, e nenhuma entrada "em breve"; fora do Projeto, a barra da empresa como hoje; a 390 px, a gaveta tem as mesmas entradas | `apps/web/src/hub/projects/project-bar.test.tsx` | must |
| 2 | U0 | `?lens=project&section=access` leva a `/companies/<e>/projects/<p>/access`; `?lens=project&section=versions` a `/companies/<e>/projects/<p>/about?part=versions`; `?lens=project` (sem `section` ou com `section=about`) a `/companies/<e>/projects/<p>/about`, trocando o endereço na história (W18); um `lens` desconhecido abre a Prévia | `project-bar.test.tsx`, "o endereço antigo" | must |
| 3 | U0 | O membro sem papel de dono abre Quem usa o app só para ler, como na 18; um Projeto de outra empresa nos endereços novos dá a página de não encontrado | `apps/web/src/hub/projects/access.test.tsx` (mudado), `project-bar.test.tsx` | must |
| 4 | U1 | `defineConnector` recusa uma definição sem `perProject`; não existe mais `oneRequestAtATime`; `sankhya.perProject` é `'one'`, `mercadoLivre.perProject` é `'many'` | `packages/connectors/src/kernel/kernel.test.ts` | must |
| 5 | U1 | `ConnectorReads` dá a cada leitura do kit, pela chave igual ao `id` dela, a entrada e a saída; `readsOf` recusa uma chave diferente do `id`; o registro de cada conector é exatamente a porta mais as operações; `packages/app` importa só os tipos de `@conexus/connectors/calls`, e importar um valor do kit falha a parede | `kernel.test.ts`, "as leituras por nome"; `scripts/rules.test.ts` (o caso da parede) | must |
| 6 | U1 | Num app de exemplo, `connectors.sankhya.consultar({ sql: 'SELECT 1 FROM TSIEMP' })` passa o `tsc` com uma string comum; `connectors.sankhya.pedidos({ dataInicial: 1 })` falha (tipo errado), e `connectors.sankhya.inexistente()` também; uma operação que o app não declarou em `defineConnectors` não existe no cliente | `packages/app/src/types.check.ts` (os casos `@ts-expect-error`) | must |
| 7 | U1 | O passo do manifesto da checagem leva `connectors` (a lista declarada) ao `manifest.json`; um manifesto sem `connectors` continua válido (0019); `connectors` com conector repetido ou operação vazia é recusado | `packages/app-contract/src/manifest.test.ts`; `packages/app/src/check/check.test.ts`, "os conectores declarados" | must |
| 8 | U1 | `ConnectorAnswer` de cada tipo chega ao handler pelo cliente como veio; um `OK` leva o valor; nenhum leva `body` do fornecedor | `packages/app/src/runtime.test.ts`, "a resposta do conector" | must |
| 9 | U2 | Uma segunda liberação de outra ligação Sankhya no mesmo Projeto é recusada pelo banco (23505 em `project_connection_one_key`); duas do Mercado Livre entram; uma liberação de uma ligação de outra empresa é recusada pela chave composta; apagar a ligação apaga as liberações | `apps/server/src/hub/connectors/project-connection.test.ts`, "a liberação" | must |
| 10 | U2 | `notes` nasce `{}`; um valor que não é objeto, ou maior que 32 KB, é recusado pelo banco; o papel da empresa lê e muda `notes` e não muda `sealed` por esse caminho | `project-connection.test.ts`, "o caderno" | must |
| 11 | U3 | `PUT …/projects/{projectId}/connections/{connectionId}` pela dona libera e responde a liberação; o membro recebe 404; a segunda ligação Sankhya no mesmo Projeto dá `PROJECT_CONNECTION_TAKEN` e nada muda; `DELETE` tira, e tirar o que não existe responde 204 | `apps/server/src/hub/connectors/grants.test.ts` | must |
| 12 | U3 | `GET …/projects/{projectId}/connections` dá ao membro cada conector ligado, o seu `perProject` e cada ligação com o nome, o estado e a liberação (quem, quando) ou `null`; outra empresa, 404 | `grants.test.ts`, "a lista" | must |
| 13 | U3 | Pela porta da borda, um app com sessão válida e a ligação liberada lê com o dublê e recebe `OK` com as linhas; sem liberação, com outra empresa, com uma operação que não é do kit, com uma operação que a versão não declarou ou com a ligação `NEEDS_REAUTH`: `NOT_GRANTED`, a mesma resposta (S10) | `apps/server/src/hub/connectors/app-calls.test.ts` | must |
| 14 | U3 | Uma operação de classe que não é `read` nunca sai pela porta do app nem pela do Builder: `NOT_GRANTED` (a regra está no código, mesmo sem nenhuma no kit hoje: o teste usa um conector de teste com uma escrita) | `app-calls.test.ts`, "só leitura" | must |
| 15 | U3 | Dez leituras ao mesmo tempo na mesma ligação Sankhya: o dublê conta **um** login e nunca duas chamadas abertas juntas; numa segunda ligação, as leituras andam ao lado, sem esperar a primeira | `apps/server/src/hub/connectors/limits.test.ts`, "uma por vez" | must |
| 16 | U3 | Quem espera na fila e passa do próprio prazo responde `DEADLINE` no seu prazo; quem está com a vez segue | `limits.test.ts`, "o prazo de quem espera" | must |
| 17 | U3 | O token do Sankhya é reusado enquanto vale; antes de vencer (60 s de folga) o Hub faz o logout do velho e só depois o login; um 401 numa leitura derruba o token, renova uma vez e repete; no fim do Hub (`release`), cada token vivo recebe o logout; um logout que falha vai ao registro e não para nada | `limits.test.ts`, "o dono do token"; `connections-sessions.test.ts` (novo: o fim do Hub) | must |
| 18 | U3 | Com o dublê segurando cada resposta 5 s, vinte leituras ao mesmo tempo pela porta da borda, **cada uma numa ligação diferente** (vinte ligações liberadas, para a fila não as separar), e no meio `GET /api/app-sessions/current` responde em menos de 500 ms; as vinte respondem `OK` e nenhuma dá `DATABASE_UNAVAILABLE` | `apps/server/src/hub/connectors/app-calls-pool.test.ts` | must |
| 19 | U3 | (sai: o `max` do pool é provado pelo critério 18, não por um teste da constante) | — | — |
| 20 | U3 | O Publicar de uma versão cujo `Manifest.connectors` nomeia um conector sem ligação liberada no Projeto, ou uma operação que não é do kit, dá `CONNECTOR_NOT_GRANTED` com o conector, e a versão publicada não muda; a Prévia recebe a mesma versão sem recusa | `apps/server/src/hub/apps/publish.test.ts`, "os conectores" | must |
| 21 | U3 | Cada chamada a um fornecedor deixa uma linha `CONNECTOR_CALLED` com empresa, Projeto, ligação, conector, operação, quem (app ou Builder), resultado, ms, ms de espera na fila e bytes; o teste planta um valor na entrada e na resposta e não o acha no registro | `apps/server/src/hub/connectors/app-calls-logs.test.ts` | must |
| 22 | U3 | O envelope "4" do Sankhya (dublê forçado) vira `UNREADABLE` com o que veio e uma linha `CONNECTOR_CONCURRENCY_FAULT` em nível de erro, sem repetir a chamada (#470) | `limits.test.ts`, "o status 4" | must |
| 23 | U3 | `DELETE …/connections/{connectionId}/notes/{concept}` pela dona tira só aquela anotação; o membro, 404; a página da ligação (`getConnection`) mostra as anotações ao membro, sem botões | `apps/server/src/hub/connectors/notes.test.ts` | must |
| 24 | U4 | O app recebe em `props.connectors` um objeto que só sabe `call` e `connections`; nas props dele não há sessão, chave nem endereço do Hub | `apps/edge/src/dispatcher-connectors.test.ts`, "sem segredo" | must |
| 25 | U4 | Uma chamada depois do fim do prazo do clique não chega ao Hub e dá `DEADLINE`; uma em andamento é cortada no prazo; o prazo mandado ao Hub é o que resta do clique | `dispatcher-connectors.test.ts`, "o prazo" | must |
| 26 | U4 | A chamada conta no limite de 50 subpedidos do clique, junto com o `db` (0047) | `apps/edge/src/dispatcher-limits.test.ts`, um caso a mais | must |
| 27 | U4 | Uma resposta do Hub acima do teto, ilegível ou um Hub fora: o app recebe `UNREACHABLE`, e o dispatcher registra a razão sem dados | `dispatcher-connectors.test.ts`, "o Hub fora" | must |
| 28 | U5 | Uma conversa num Projeto sem liberação não tem ferramenta de conector nem skill de conector; com o Sankhya liberado, tem `connector_read`, `connector_notes` e `connector_note_save` e a skill `conexus-sankhya`; tirar a liberação entre dois turnos tira as duas no turno seguinte; num turno retomado, a ferramenta de conector deixa de ser oferecida, e só as ferramentas são provadas na retomada: o Mastra refaz as ferramentas, mas não as skills nem as instruções (fonte: revisão da PR 495, `@mastra/core` 1.79.0 `dist/agent-tuAMgHe3.js:41105`, `:40997` e `:41078`, `:27606-27629`) | `apps/server/src/builder/conversation/conversation-connectors.test.ts` | must |
| 29 | U5 | `connector_read` com o dublê devolvendo 500 linhas guarda na memória só 20 linhas, até 16 KB, com `complete: false`; um valor plantado na resposta não aparece na memória (a metade do rastro foi para a 21.1: o `TracingPolicy` do Mastra só tem `internal`, `@mastra/core` 1.79.0 `observability/types/tracing.d.ts:1874-1881`; fonte: revisão da PR 495) | `conversation-connectors.test.ts`, "o corte" | must |
| 30 | U5, U3 | `connector_note_save` sem consulta é recusado; com consulta, roda a consulta uma vez pela porta de leitura e guarda o mapa, a consulta, a data, o número de linhas e quem, nunca uma linha; uma consulta que a porta recusa recusa a anotação; a 51ª chamada de conector numa mesma execução do Builder (um turno) é recusada; o caderno cheio (acima de 32 KB) recusa a anotação com `NOTE_INVALID` | `conversation-connectors.test.ts`, "o caderno"; `notes.test.ts`, "guardar" | must |
| 31 | U6 | Num navegador de verdade (Chrome e WebKit, 1366 e 390, os dois temas): a barra do roteiro, Liberar para ler e Tirar, a escolha pelo nome com dois Sankhya, as duas lojas do Mercado Livre liberadas, o Caderno com Apagar, o membro sem botões | QA (`conexus-qa`), o relatório do pull request da etapa | must |
| 32 | U6 | Integrações do Projeto: a liberação certa por linha; a dona vê **Liberar para ler** e **Tirar**; o membro vê o estado e "Peça ao dono ou a um administrador."; num conector `one` com uma ligação liberada, as outras linhas não têm **Liberar para ler** e dizem qual tirar antes; num `many`, cada linha libera; uma ligação `NEEDS_REAUTH` mostra o selo e o caminho para Integrações da empresa | `apps/web/src/hub/projects/project-integrations.test.tsx` | must |
| 33 | U6 | A página da ligação mostra o Caderno (conceito, mapa, provado em, com quantas linhas, por quem); a dona apaga com confirmação; vazio, "O Builder ainda não anotou nada desta ligação." | `apps/web/src/hub/connectors/notes.test.tsx` | must |
| 34 | Fundador | O roteiro, passos 1 a 6, no Hub de verdade com o Sankhya e o Mercado Livre dele (fora da CI, S40) | o uso, no livro de aprovações | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A barra do Projeto | as entradas, Construir marcado | — | o nome do Projeto em esqueleto até a leitura chegar | o nome some e fica "Projeto"; as entradas valem | a página de não encontrado da casa | a pessoa só de app não entra (W29) | — |
| Sobre (com Versões) | Sobre aberto | Versões: "Nenhuma versão ainda." (da 17) | da 17 | da 17 | da 17 | o membro lê; Publicar esta, como na 17 | — |
| Quem usa o app | da 18 | da 18 | da 18 | da 18 | da 18 | da 18 | da 18 |
| Integrações do Projeto | a lista dos conectores ligados, cada ligação "não liberada" | "A empresa ainda não ligou nenhum sistema." com o caminho para Integrações da empresa (a dona) ou "Peça ao dono ou a um administrador." (o membro) | esqueleto das linhas | a frase da falha (`DATABASE_UNAVAILABLE`) com Tentar de novo | — | o membro vê o estado e a frase, sem botões | `NEEDS_REAUTH`: o selo da 19.1 e "Conectar de novo em Integrações da empresa"; num conector `one` com outra ligação liberada, as outras linhas dizem "O <conector> lê uma ligação por Projeto. Tire a <nome> antes.", sem **Liberar para ler** |
| A confirmação de Liberar para ler | a frase do roteiro, passo 2 | — | **Liberar** ocupado | a frase na janela | `CONNECTION_NOT_FOUND`: a frase da 19 | — | `PROJECT_CONNECTION_TAKEN`: a frase da falha na janela |
| O Caderno, na página da ligação | — | "O Builder ainda não anotou nada desta ligação." | da página | da página | da 19 | o membro lê, sem **Apagar** | — |
| O app (o que o Builder escreve) | — | `OK` com `empty` | o que o app mostra | `BUSY`: "O <conector> pediu para esperar.", com o tempo de `waitMs` quando vem (a frase da 0058); `UNREACHABLE`, `DEADLINE`: "O <conector> não respondeu a tempo. Tente de novo." | — | `NOT_GRANTED`: "O <conector> não está liberado para este app." | `AUTH_REFUSED`: "O <conector> pediu para conectar de novo." |

As frases do app são da skill `conexus-data`, que o Builder segue; o app é código da empresa, e os
textos dele são os do Builder.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Connector.perProject` | U1 (cada definição) | U3 (`exclusive` da liberação); U6 (qual linha pode liberar); U5 (pede o nome da ligação a um conector `many`) |
| `ConnectorReads` | U1 | U1 (`packages/app`, o cliente tipado) |
| `Manifest.connectors` | U1 (a checagem) | U3 (Publicar, e a admissão de cada chamada) |
| `AppProps.connectors` | U4 | o app, pelo cliente da U1 |
| `ConnectorAnswer` | U3 (a porta da borda) | U4 (passa); o app |
| `project_connection.*` | U3 (`grants.ts`) | U3 (admissão, lista, Publicar, porta do Builder) |
| `project_connection.exclusive` | U3, do `perProject` do conector | o banco (`project_connection_one_key`) |
| `connection.notes` | U3 (`notes.ts`, chamado pela U5 e pela rota de apagar) | U3 (`getConnection`, porta do Builder); U6 |
| `ProjectConnections` (a lista) | U3 | U6 |
| `Connection.notes` (na página da ligação) | U3 | U6 |
| `BuilderConnectors.granted` | U3 | U5 (ferramentas, skills, instruções) |
| `CONNECTOR_CALLED` (a linha) | U3 | quem opera (a cota do Mercado Livre, o gatilho do `T-A`) |

O desenho de caixas. A barra é a do protótipo `R2` (as capturas `r2-1280-integracoes-claro.png`,
`r2-1280-construir-claro.png` e `r2-390-gaveta-aberta-claro.png` do protótipo, guardadas fora do
repositório com o estudo, regra L21); a do Conexus OS é a de `e0353c36
apps/web/src/app/shell.tsx:78-106`, lida, não rodada.

```text
1280 px, Integrações do Projeto                     390 px, a gaveta aberta
 ┌────────────────┬───────────────────────────────┐  ┌──────────────────────┐
 │ [V] Vendas  ⌄  │ Integrações deste Projeto      │  │ [V] Vendas  ⌄        │
 │ ← Padaria Sol  │ [S] Sankhya · Matriz           │  │ ← Padaria Sol        │
 │ ▸ Construir    │   lê                  [Tirar]  │  │ Construir            │
 │   Sobre        │ [M] Mercado Livre · Loja 1     │  │ Sobre                │
 │   Quem usa o app│   lê                  [Tirar]  │  │ Quem usa o app       │
 │ ▸ Integrações  │ [M] Mercado Livre · Loja 2     │  │ Integrações          │
 │                │   não liberado [Liberar p/ ler]│  │ ──────────────────── │
 │ (Ana) ⌄        │                                │  │ (Ana) ⌄              │
 └────────────────┴───────────────────────────────┘  └──────────────────────┘

1280 px, o Caderno na página da ligação (Integrações da empresa › Sankhya · Matriz)
  Caderno
  Vendedor do pedido   TGFCAB.AD_CODVEND → TGFVEN.CODVEND   provado em 30/10 por Bruno   [Apagar]
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Liberar (`INSERT project_connection … ON CONFLICT (project_id, connection_id) DO NOTHING RETURNING`, e sem linha a releitura da existente) | a mesma ligação: uma linha só, e as duas respondem a liberação relida; duas ligações de um conector `one`: o banco aceita uma, a outra recebe 23505 em `project_connection_one_key`, que vira `PROJECT_CONNECTION_TAKEN`; um Desligar ou a remoção do Projeto ao mesmo tempo: 23503, que vira `CONNECTION_NOT_FOUND` ou `NOT_FOUND` | uma instrução | banco: `DATABASE_UNAVAILABLE`; nenhum fornecedor é chamado | `PROJECT_CONNECTION_GRANTED` (empresa, Projeto, ligação, pessoa) | 9, 11 |
| Tirar (`DELETE project_connection`) | as duas respondem 204 | uma instrução; uma chamada já admitida termina; a seguinte é `NOT_GRANTED` | banco: `DATABASE_UNAVAILABLE` | `PROJECT_CONNECTION_REVOKED` | 11, 13 |
| Uma chamada do app ou do Builder (tx 1: sessão, versão, liberação, selo; a chamada; tx 2: `NEEDS_REAUTH` só se o fornecedor recusou a chave) | a fila da ligação: uma por vez; quem passa do prazo esperando, `DEADLINE` | nenhuma conexão do banco presa durante a chamada (D22); um clique que acaba no meio corta a espera; o fornecedor que já respondeu não é chamado de novo | o fornecedor fora: `UNREACHABLE`; 429: a espera da 0058 e `BUSY`; banco fora na tx 1: `DATABASE_UNAVAILABLE` (a borda dá `UNREACHABLE` ao app) | `CONNECTOR_CALLED`; da 19 (`CONNECTOR_UNREACHABLE`) | 13 a 18, 21 |
| O login do Sankhya e o logout do token velho (no fornecedor) | um login por ligação: quem chega durante o login espera o mesmo | o logout sai antes do login, com prazo curto; um logout recusado ou sem resposta vai ao registro e o login segue | o fornecedor fora no login: `UNREACHABLE`, nenhum token guardado | `CONNECTOR_LOGGED_OUT`; `CONNECTOR_LOGOUT_FAILED` (aviso) | 15, 17 |
| O fim do Hub (`release`): o logout de cada token vivo | — | cada logout com o seu prazo dentro do prazo do fim; nenhum lança | o fornecedor fora: o aviso, e a sessão fica até o Sankhya a encerrar por inatividade | `CONNECTOR_LOGOUT_FAILED` | 17 |
| Guardar uma anotação (a consulta pela porta; `UPDATE connection SET notes = notes \|\| …`) | a mesma anotação: vale a última (uma instrução, a trava da linha); duas diferentes: as duas ficam | a consulta roda antes; uma consulta recusada não grava nada; o caderno acima de 32 KB: 23514, `NOTE_INVALID`, nada gravado | o fornecedor fora: a anotação é recusada com `UNREACHABLE`; banco fora: `DATABASE_UNAVAILABLE` | `CONNECTION_NOTE_SAVED` (ligação, conceito, linhas) | 30 |
| Apagar uma anotação (`UPDATE … SET notes = notes - $concept`) | as duas: a anotação some uma vez, as duas respondem 204 | uma instrução | banco: `DATABASE_UNAVAILABLE` | `CONNECTION_NOTE_DELETED` | 23 |
| Publicar com conectores (a leitura das liberações, depois o Publicar da 17) | da 17 | a leitura antes da gravação: uma recusa não muda nada | da 17 | `APP_VERSION_REFUSED` com o código | 20 |
| Desligar (da 19) e Conectar de novo (da 19.1): levam liberações e anotações; `limits.forget` faz o logout do token e solta a fila da ligação | da 19 | o `ON DELETE CASCADE` na mesma instrução; o logout depois da gravação, como aviso se falha | da 19; o fornecedor fora no logout: `CONNECTOR_LOGOUT_FAILED` | da 19; `CONNECTOR_LOGGED_OUT` | 9, 17 |
| O envelope "4" do Sankhya (que a fila torna impossível) | — | não se repete | — | `CONNECTOR_CONCURRENCY_FAULT` (erro): o Hub o reconhece pelo `native.code` que o kit dá a esse envelope | 22 |
| A chamada do dispatcher ao Hub (U4) | cada uma a sua | o clique acaba: o dispatcher corta e dá `DEADLINE` | o Hub fora, ou a resposta acima do teto ou ilegível: `UNREACHABLE` ao app | `CONNECTOR_HUB_NO_ANSWER` com a razão | 25, 27 |

## A tabela de referência

Referências na estante de estudo (`~/conexus-study/refs/`, `MANIFEST.md`): n8n `2e855356`, Nango
`e6c6131`, Activepieces `f34c43cd`, Composio `2c528ab`, Pipedream `05b24f0e`, vibesdk `9da158d`; o
Conexus OS em `e0353c36`; Mastra como instalado (`@mastra/core` 1.79.0, linhas de fonte da estante
`mastra-1.78` `6a465f9d`); `pg-pool` como instalado. "Lido" é linha reaberta pelos estudos; as outras
são do leitor (relay) e a unidade as reabre antes de usar.

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A liberação de uma ligação a um Projeto | U2, U3 | nenhum | n8n `packages/@n8n/db/src/entities/shared-credentials.ts:10-23` (lido); Activepieces `app-connection.entity.ts:46`, `app-connection-service.ts:153-166` (lido) | uma ligação "este projeto pode usar esta credencial", conferida quando o trabalho começa; nenhum teto de classe | nativo (o `SharedCredentials` do n8n): `connectors.project_connection`; só leitura pela `class` da própria operação | critérios 9, 11, 13, 14 | `T-A` (1), `S1`, D | `hub/connectors/grants.ts` |
| Quantas ligações de um conector um Projeto usa | U1, U2, U3 | `Connector` sem a declaração (`kernel/definition.ts:25-42`) | Activepieces `projectIds text[]` (uma ligação, vários projetos); nenhuma referência declara o número no conector | — | embrulhado: `perProject: 'one' \| 'many'` na definição; `exclusive` copiado na linha e um índice único parcial | critério 9 | `T-A` (1), nota de 2026-10-29 | — |
| `props.connectors` | U1, U4 | `AppProps = { caller, db }` (`packages/app-contract/src/props.ts:24`); `Db` (`apps/edge/src/dispatcher.ts:14-22`) | Workers RPC `WorkerEntrypoint` com `ctx.props` (0043); 0047, verificação 3: as chamadas ao stub contam em `limits.subRequests` (`docs/decisions/0047-*.md:38`, lido) | o dispatcher dá props que o app não muda; a chave fica no dispatcher | nativo (o desenho do `db`): a entrada `Connectors` ao lado de `Db` | critérios 24, 26 | não precisa | `apps/edge/src/connectors.ts` |
| A chamada do dispatcher ao Hub | U3, U4 | `HubPort` com `createAppSession` e `checkAppCall` (`apps/edge/src/hub.ts:23-28`), 5 s e 16 KB (`:32-33`) | Activepieces: o servidor tira o projeto do principal da máquina (`app-connection-worker-controller.ts:11-14`, relay) | o servidor nunca toma o projeto do corpo | embrulhado: duas operações `edge` novas (S48); o Hub confere a sessão do app como `checkAppCall`; prazo = o que resta do clique; teto da resposta 2 MiB, o mesmo do executor (`wire.ts:10`) | critérios 13, 25, 27 | não precisa | `hub/connectors/app-calls.ts` |
| O app declara o que usa | U1, U3 | `Manifest.roles` (`packages/app-contract/src/manifest.ts:37-43`), `defineRoles` (`packages/app/src/operations.ts:17`) | o `defineRoles` da 18 (herdado) | declara no código, a dona libera, o Hub confere | embrulhado: `defineConnectors` em `shared/operations.ts`, `Manifest.connectors`; Publicar recusa o não liberado; a chamada recusa o não declarado | critérios 7, 13, 20 | não precisa | — |
| O cliente tipado | U1 | `createApi` tipado por `Operations` (`packages/app/src/client.ts:88`) | Supabase `gen types` → `createClient<Database>` (relay) | tipos do esquema que manda | embrulhado: `@conexus/connectors/calls` (só tipos) e `connectorsOf(context, declared)` em `@conexus/app`; o kit vai à máquina como `packages/app` | critérios 5, 6 | não precisa | `packages/connectors/src/calls.ts`, `packages/app/src/connectors.ts` |
| A resposta como dado | U1, U3 | `Answered` do kit (`packages/connectors/src/kernel/operation.ts:50-58`); `DbResult` por código (`packages/app-contract/src/db.ts:9`) | OS: códigos fechados (`e0353c36 apps/hub/src/connectors/errors.ts`, relay) | a falha é um código, nunca linhas vazias | embrulhado: `ConnectorAnswer` = os resultados do kit sem o `body`, mais `NOT_GRANTED` e `DEADLINE` | critério 8 | não precisa | `packages/app-contract/src/connectors.ts` |
| O papel de quem usa o app | — | `mayRun` antes do handler (`packages/app-contract/src/runtime.ts:59-64`) | 18 `D` (herdado) | o papel da operação do app | nativo (nosso desde a 18): fica de fora, nada novo; a chamada ao conector roda dentro do handler | os testes da 18 | não precisa | — |
| Uma chamada por vez em cada ligação | U1, U3 | `oneRequestAtATime`, que nenhum código lê (só o comentário de `probe.ts:65`); o status 4 sem nome (#470) | Pipedream Bottleneck `maxConcurrent: 1` por conector (`components/airtable_oauth/airtable_oauth.app.mjs:3-10`, lido); OS uma fila por token (`e0353c36 apps/hub/src/connectors/token-cache.ts:22-30`, lido) | um teto por chave, em memória | embrulhado: uma fila de um por ligação em `limits.ts`, um processo do Hub (0058); sai `oneRequestAtATime` | critérios 15, 16, 22 | `T-A` (2) | `hub/connectors/limits.ts` |
| A espera do fornecedor | — | 429 → `BUSY` com a espera, uma vez dentro do prazo (`executor.ts:187-207`, decisão 0058) | Nango `retry.ts:10-15,60-137` (lido em parte) | espera o que o fornecedor pede, até um limite | nativo (já no `main`): fica de fora, nada novo; só a frase da 0058 muda | critérios da 0058 | `T-A` (2) | — |
| O dono do token do Sankhya | U1, U3 | o login a cada Testar, sem logout (`executor.ts:266-278`) | OS `token-cache.ts:55-110` (relay); o estudo das sessões do Sankhya, 2026-10-30: o logout `MobileLoginSP.logout` funciona no token do gateway e só enquanto ele vale | reusa até perto do fim; um login por vez; logout antes de renovar | embrulhado: em memória por ligação, folga de 60 s, logout antes do login, 401 derruba e renova uma vez, `closeAll` no fim | critério 17 | não precisa | `hub/connectors/limits.ts` |
| O banco solto durante a chamada | U3 | o pool sem `max` (`apps/server/src/platform/database.ts:15-19`) → 10 (`node_modules/pg-pool/index.js:89`) | Nango: `getConnection` e depois a chamada, sem transação aberta (`proxy.service.ts:219-345`, relay) | nenhuma conexão do banco durante a chamada | embrulhado: duas transações curtas (D22), `max` explícito | **provado** no estudo da 20 (seção 4.5: segurando o cliente, 4.817 ms por checagem e 10 falhas; com duas curtas, 1 ms) | não precisa | — |
| A linha por chamada | U3 | `CONNECTOR_UNREACHABLE` com escalares (`executor.ts:182,215`) | OS spans com ids, passo, resultado, status e bytes (`broker.ts:247-258`, relay) | só escalares | embrulhado: `CONNECTOR_CALLED` (S41) | critério 21 | `T-A` (2) | — |
| O caderno da ligação | U2, U3, U5, U6 | `connection.last_test` jsonb (`tables.ts:50-52`) como precedente | Nango `docs/getting-started/use-cases/customer-configuration.mdx:7,33`, `docs/guides/auth/connection-tags-configuration-metadata.mdx:17,294-298`, `packages/types/lib/connection/db.ts:35` (lidos) | um JSON por ligação, escrito por quem aprendeu | embrulhado: `connection.notes` jsonb, tipado por Zod no Hub, escrito por `connector_note_save` com a consulta que o provou | critérios 10, 23, 30, 33 | J1, `T-A` (3) | `hub/connectors/notes.ts` |
| As ferramentas de leitura do Builder | U5 | `tools: ({ requestContext }) => toolsOf(...)` (`builder.ts:166`) | `@mastra/core` `agent.ts:852,3489-3530` (`DynamicArgument`, resolvido a cada execução; um retorno vazio lança), `agent.ts:10560-10568` (a retomada resolve de novo; relay); OS `connector_fetch`, uma ferramenta, 50 chamadas por execução (`e0353c36 apps/hub/src/connectors/builder-tool.ts:15`, lido) | ferramentas do contexto do pedido | nativo: três ferramentas (`connector_read`, `connector_notes`, `connector_note_save`) só com uma liberação; a operação é um parâmetro, como o `connector_fetch` do OS, e não uma ferramenta por leitura (o Sankhya e o Mercado Livre somam mais de 50) | critério 28 | F1 | `builder/connectors/connector-tools.ts` |
| A skill do conector por liberação | U5 | `skills: APP_SKILLS` fixo (`builder.ts:164`) | `@mastra/core@1.79.0 dist/coding-agent/index.js:218-228` (lido: passa `skills` ao `Agent`); `skills` como função do `requestContext` (`agent.ts:1735-1767`, relay) | skills resolvidas por pedido | nativo: `skills: async ({ requestContext }) => [...APP_SKILLS, ...dos conectores liberados]`, cada uma com `directoryName` igual ao seu `name` | critério 28 | I1 | — |
| O corte da leitura antes do modelo | U3, U5 | nenhum | Mastra `toModelOutput` guarda o resultado cru (`tool-result-commit-core.ts:18-77`, relay); OS: só 256 KB (`builder-tool.ts:89-91` e `sankhya/gateway.ts:34`, relay) | nenhuma corta linhas | nativo: a porta do Builder devolve o valor já cortado (20 linhas, 16 KB, `complete`); `toModelOutput` rejeitado | critério 29 | F1 | — |
| O rastro das ferramentas | 21.1 | spans ao Grafana (0052) | Mastra `TOOL_CALL` com `input` e `output` (`tools/tool-builder/builder.ts:888-949`); o `TracingPolicy` só tem `internal` (`observability/types/tracing.d.ts:1874-1881`, 1.79.0); `hideInput` e `hideOutput` só no rastro todo | entrada e saída no span por padrão | embrulhado, movido para a 21.1 com o exportador de lista permitida (fonte: revisão da PR 495, decisão do firstmate, 2026-10-30) | — | não precisa | — |
| A barra do Projeto | U0 | abas no alto (`apps/web/src/hub/projects/area.tsx:37-64`); `Section` com `access` (`search.ts:5`); o `Frame` recolhe a ícones no Projeto (`apps/web/src/ui/frame.tsx:125-140`) | OS `e0353c36 apps/web/src/app/shell.tsx:78-106` (lido): no Projeto, a barra é do Projeto: "Voltar para <empresa>", Construir, Sobre, Integrações, e um bloco "Em breve" | a barra do Projeto no lugar da da empresa | embrulhado: `ProjectRail` no `nav` do `Frame` quando há Projeto, aberto; sem "em breve" (W31) | critérios 1 a 3, 31 | `R2` | `apps/web/src/hub/projects/project-rail.tsx` |
| Integrações do Projeto | U6 | nenhum | OS `/projects/$projectId/integrations` (`shell.tsx:97-98`, lido) | os sistemas da empresa com o estado da liberação | embrulhado: as peças da 19 (`ConnectorLogo`, `List`), **Liberar para ler** e **Tirar** | critérios 31, 32 | `R2`, `S1` | `apps/web/src/hub/projects/project-integrations.tsx` |
| Quem libera | U3 | `manageConnections` e `readConnections` (`apps/server/src/hub/identity/admission.ts:70-71`) | better-auth 1.7.8, controle de acesso (19) | papel → capacidade | nativo: as capacidades da 19 | critério 11 | D | — |

**A medida do transplante.** Nada entra do Conexus OS como código. Entram ideias reescritas: a ligação
como liberação (`e0353c36 apps/hub/src/connectors/store.ts:154-176`), a regra do token
(`token-cache.ts:55-110`), as 50 chamadas por conversa (`builder-tool.ts:15`), o formato da memória
(conceito, códigos, consulta, data, nunca valores) indo para `connection.notes`, e a barra do Projeto
(`shell.tsx:78-106`). Ficam de fora: a porta por soquete do OS (o RPC do Workers a substitui), a
projeção da transcrição (o corte na porta a dispensa), o "Em breve" da barra (W31) e a liberação por
ambiente (`store.ts:163`: a Prévia e o publicado leem o mesmo sistema da empresa, e uma segunda linha
não protegeria nada).

**A dívida.**
- A fila é por processo do Hub (0058): vale enquanto houver um só. Gatilho: o plano de um segundo
  processo.
- Uma chamada por vez também no Mercado Livre: um clique que lê muitas páginas pode acabar o prazo.
  Gatilho: um `DEADLINE` de fila no registro do Mercado Livre; então o conector declara um número
  maior.
- O tipo de entrada do cliente é o tipo já lido pelo esquema (o kit guarda `z.ZodType<I>`): um campo
  com valor padrão precisa ser passado. Gatilho: o Builder tropeçar nisso. (Uma marca, como a
  `ReadSql` do `consultar`, não é dívida: `ReadsOf` a tira, critério 6.)

## U0 A barra do Projeto

**Base e modelo.** `main` no commit em que esta página for aprovada. Sonnet: telas, sem desenho
entre módulos.

### As linhas da tabela

- **A barra do Projeto.** Ler `apps/web/src/ui/frame.tsx:125-175` (o `Frame`: `compact`, `open`,
  o `SidebarProvider`), `apps/web/src/routes/_app/companies/$companyId/route.tsx` (o `HouseFrame`:
  `header`, `nav`, `footer`, `compact={projectId !== undefined}`), `apps/web/src/hub/projects/area.tsx`
  (as abas e `Sections`), `search.ts`, `recent-projects.tsx` (os recentes, para a troca de Projeto).
  O protótipo `R2` (fora do repositório, com o estudo) mostrou a forma: `ProjectRailHead`,
  `ProjectRailNav`, e o `Frame` aberto dentro do Projeto. O OS (`shell.tsx:78-106`) dá a ordem das
  entradas.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/ui/frame.tsx` | Muda: o `Frame` deixa de abrir recolhido dentro do Projeto | o `HouseFrame` |
| `apps/web/src/hub/projects/` | Cria `project-rail.tsx`, `about.tsx`; muda `area.tsx` (sai a aba Projeto), `search.ts` (sai `Section`), `public.ts` | as rotas do Projeto |
| `apps/web/src/routes/_app/companies/$companyId/` | Muda `route.tsx`, `projects/$projectId.tsx` (o redirecionamento); cria `projects/$projectId_.about.tsx`, `projects/$projectId_.access.tsx` | o roteador (gera `routeTree.gen.ts`) |
| `docs/reference/screens.md` | Muda: as linhas de Sobre e Quem usa o app (W29) | — |

### Os contratos que a unidade cria

- **Endereços** (W18, W29: o andar Projeto): `/companies/<e>/projects/<p>` (Construir, como hoje),
  `/companies/<e>/projects/<p>/about` (Sobre, com `?part=versions` para Versões),
  `/companies/<e>/projects/<p>/access` (Quem usa o app). As duas rotas novas não ficam dentro do
  `Workbench` do Construir: o arquivo usa o sufixo `_` do TanStack Router (`$projectId_.about.tsx`),
  que tira a rota do aninhamento sem mudar o endereço.
- `search.ts`: `Lens = z.enum(['preview', 'code'])` (sai `project`); `Section` sai. O endereço antigo
  com `lens=project` é lido por um esquema próprio só no `beforeLoad` de `$projectId.tsx`, que
  redireciona com `replace: true`.
- `AboutPart = z.enum(['about', 'versions'])`, valor do endereço em `/about`.
- `ProjectRail(props: { companyId: string; projectId: string })` em `project-rail.tsx`: a cabeça
  (nome e troca de Projeto, com os recentes e "Todos os projetos") e as entradas. Exportado por
  `public.ts`. A entrada Integrações **não** entra aqui (W31: só quando existe; entra na U6).
- O que sai do `main`: a aba "Projeto" de `area.tsx` e `Sections`; `Section.enum.access`.
- **O texto novo das regras**, para o fechamento (L20: um guia muda só no fechamento):
  - **W30**, a frase "It collapses to icons inside a Projeto and returns on leaving" passa a ser:
    "Inside a Projeto the sidebar is the Projeto's own (founder, 2026-10-30, R2): the Projeto's name
    with its switcher, ← the company, Construir, Sobre, Quem usa o app and Integrações, then the
    account; it stays open and collapses to icons on demand. Leaving the Projeto brings the company's
    sidebar back."
  - **W31**, a frase "the tabs Prévia, Código, Alterações and Projeto in the middle" passa a "the tabs
    Prévia, Código and Alterações in the middle", e "The tab Projeto lists sections, each added by its
    step: Sobre, Versões, Quem usa o app, Dados da empresa, Publicação." passa a "Sobre lists its
    parts, each added by its step: Sobre, Versões, Publicação. Each other part of a Projeto is an
    entry of its sidebar, added by its step (Quem usa o app, Integrações, then Dados and
    Capacidades)."

### As skills e a leitura

`@tanstack/react-router` (`router-core` skills do pacote: `not-found`, `redirect`, rotas sem
aninhamento); `impeccable` só para conferir o que a QA vê ([Impeccable](../reference/impeccable.md));
`shadcn` para o `Sidebar` e as `Tabs`.

### A ordem do trabalho

1. Subtrair: `area.tsx` perde a aba Projeto e `Sections`; `search.ts` perde `Section` e `project`.
2. `project-rail.tsx`: a cabeça com `SidebarMenuButton` e um `DropdownMenu` com os recentes (a mesma
   leitura de `RecentProjects`) e "Todos os projetos"; as entradas com `FrameLink`. Regras: W30 (o
   texto novo), W31, V56 (a gaveta guarda cada destino).
3. `route.tsx`: com `projectId`, `header` e `nav` vêm do `ProjectRail`; `Frame` abre (`compact`
   continua dizendo "estou num Projeto", para o `h-dvh`). Sem Projeto, como hoje.
4. `$projectId_.about.tsx` com `about.tsx` (Sobre e Versões, a página de Versões da 17 movida);
   `$projectId_.access.tsx` com `Access` da 18, sem mudar `access.tsx`.
5. O redirecionamento em `$projectId.tsx` (W18).
6. `screens.md`: as linhas novas (W29).

### Como se prova

Critérios 1 a 3: `project-bar.test.tsx` (novo, no molde de `project.test.tsx`) e `access.test.tsx`
mudado, `npm test -w @conexus/web -- project-bar access`. Hoje falham: não há barra do Projeto. A QA
(critério 31) vê a barra a 1366 e 390.

### Parar se

- O `Frame` aberto no Construir quebra o alto da página em duas linhas a 1280 (o protótipo `R1`
  mostrou isso com duas barras; o `R2` não): mostrar a captura e parar, é decisão de desenho.
- Uma rota sem aninhamento não pega o `beforeLoad` do layout da empresa (a sessão, a empresa): parar
  e mostrar.

## U1 O kit e o contrato do app

**Base e modelo.** `main` no commit em que esta página for aprovada. Opus: um contrato que cruza três
pacotes e a máquina (o kit, o contrato do app, o SDK), com tipos derivados.

### As linhas da tabela

- **Quantas ligações por Projeto; uma chamada por vez.** `packages/connectors/src/kernel/definition.ts:25-42`
  (o tipo), `:53-74` (`defineConnector`), `sankhya/definition.ts:68`, `mercado-livre/definition.ts:60`.
- **O dono do token** (a parte do kit). `kernel/auth.ts` (`ClientCredentialsAuth`); o estudo das
  sessões: `POST /gateway/v1/mge/service.sbr?serviceName=MobileLoginSP.logout&outputType=json`, corpo
  `{"serviceName":"MobileLoginSP.logout","requestBody":{}}`, com o bearer; idempotente; um token
  vencido recebe 403; depois do logout, uma leitura com o token dá 401 `UNAUTHORIZED`. Se o conserto
  pequeno "o Testar faz logout" já estiver no `main`, esta parte já existe e a unidade só a usa.
- **O cliente tipado.** `packages/app/src/operations.ts`, `client.ts`, `index.ts`;
  `packages/connectors/src/sankhya/operations/index.ts` (a lista `sankhyaOperations`),
  `sankhya/door.ts`, `mercado-livre/operations/index.ts`; `infra/e2b/sdk.ts:7` (`SDK_FOLDERS`);
  `.dependency-cruiser.cjs:146-153` (`connectors-kit-only-in-the-executor`).
- **`props.connectors` e a resposta.** `packages/app-contract/src/props.ts:24`, `runtime.ts:7,143-173`
  (`Context`, `serveApp`), `manifest.ts:29-51`, `db.ts` (o molde de um dado de resposta por código).
- **O app declara o que usa.** `packages/app/src/check/manifest.ts:26-60` (`Answer`, `sharedOf`: as
  `roles` já vão ao manifesto assim).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Muda `definition.ts` (`perProject`; sai `oneRequestAtATime`), `auth.ts` (`logout`) | o Hub (`hub/connectors/`), as definições |
| `packages/connectors/src/{sankhya,mercado-livre}/` | Muda `definition.ts`, `operations/index.ts` (as leituras por nome), `sankhya/answers.ts` (o 401 de bearer, o envelope 4), `sankhya/fake.ts` (o logout) | o kit, os testes do Hub |
| `packages/connectors/src/calls.ts`, `package.json` | Cria; a entrada `./calls` | `packages/app` (só tipos) |
| `packages/app-contract/src/` | Cria `connectors.ts`; muda `props.ts`, `runtime.ts`, `manifest.ts`, `index.ts` | `apps/edge`, `packages/app`, `packages/hub-api` |
| `packages/app/src/` | Cria `connectors.ts`; muda `index.ts`, `check/manifest.ts`, `types.check.ts`; `package.json` ganha `@conexus/connectors` | os apps; a checagem na máquina |
| `packages/app/skills/conexus-data/` | Muda: a parte dos conectores | o Builder |
| `infra/e2b/sdk.ts` | Muda: `packages/connectors` entra em `SDK_FOLDERS` | `infra/e2b/template.ts` |
| `.dependency-cruiser.cjs`, `scripts/rules.test.ts` | Muda: a exceção da parede, só tipos | a CI |
| `apps/server/src/hub/connectors/probe.ts` | Muda: o comentário de `oneRequestAtATime` | — |
| os testes que montam um conector (`kernel/oauth.test.ts`, `mercado-livre/mercado-livre.test.ts` e os do Hub que usam `defineConnector`) | Muda: `perProject` no lugar de `oneRequestAtATime` | — |
| `package-lock.json` | Muda: a dependência de `packages/app` | — |

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/definition.ts: em Connector, no lugar de oneRequestAtATime
// How many of this connector's connections one Projeto may use (founder, 2026-10-29): a key, not code.
perProject: 'one' | 'many' // required, no default

// packages/connectors/src/kernel/auth.ts: em ClientCredentialsAuth
// The session's end, sent with the bearer while it lives (an expired token's logout is refused).
logout?: Readonly<{ path: `/${string}`; query: Readonly<Record<string, string>>; body: unknown }>

// packages/connectors/src/sankhya/operations/index.ts (e o mesmo no Mercado Livre)
/** Every read of the connector by its id, the door's included; the key is the operation's id (defineConnector checks). */
export const sankhyaReads = readsOf({ empresas, clientes, /* … */, consultar: sankhyaDoor.consultar, carregar: sankhyaDoor.carregar })

// packages/connectors/src/kernel/definition.ts
/** The record of a connector's reads by id; throws when a key is not its operation's id. */
export function readsOf<const R extends Readonly<Record<string, Operation<unknown, unknown, 'read'>>>>(reads: R): R

// packages/connectors/src/calls.ts: entrada "./calls", só tipos, nada que rode
// A brand (sankhya/door.ts:103, ReadSql) is the kit's own check: the app writes the plain string, and the Hub parses it.
type Unbranded<T> = T extends string & z.$brand<string> ? string : T extends object ? { [K in keyof T]: Unbranded<T[K]> } : T
type ReadsOf<R> = { readonly [K in keyof R]: R[K] extends Operation<infer I, infer O> ? Readonly<{ input: Unbranded<I>; output: O }> : never }
export type ConnectorReads = Readonly<{
  sankhya: ReadsOf<typeof sankhyaReads>
  'mercado-livre': ReadsOf<typeof mercadoLivreReads>
}>
export type PerProject = Readonly<{ sankhya: 'one'; 'mercado-livre': 'many' }> // conferido contra as definições num teste
```

```ts
// packages/app-contract/src/connectors.ts (dono de ConnectorAnswer, C26)
export const NativeSummary = z.strictObject({ status: z.int(), code: z.string().nullable(), message: z.string().nullable() })
export const ConnectorAnswer = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('OK'), value: z.unknown(), empty: z.literal(true).optional() }),
  z.strictObject({ kind: z.literal('NOT_GRANTED') }),
  z.strictObject({ kind: z.enum(['REFUSED', 'AUTH_REFUSED', 'UNREADABLE']), native: NativeSummary }),
  z.strictObject({ kind: z.literal('BUSY'), waitMs: z.int().nonnegative().nullable() }),
  z.strictObject({ kind: z.enum(['UNREACHABLE', 'DEADLINE']) }),
])
export type ConnectorAnswer = z.infer<typeof ConnectorAnswer>
/** The stub in props.connectors: `connection` is the connection's name, given only for a connector that allows many. */
export type Connectors = Readonly<{
  call(connector: string, operation: string, input: unknown, connection?: string): Promise<ConnectorAnswer>
  connections(connector: string): Promise<readonly string[]>
}>

// props.ts: AppProps = Readonly<{ caller: Caller; db: Db; connectors: Connectors }>
// runtime.ts: Context = Readonly<{ db: Db; caller: Caller; connectors: Connectors }>
// manifest.ts, no Manifest:
connectors: z.array(z.strictObject({
  connector: z.string().regex(/^[a-z][a-z0-9-]{1,31}$/),
  operations: z.array(z.string().regex(/^[a-z][a-zA-Z0-9]{1,39}$/)).min(1).max(100),
})).max(20).refine((list) => unique(list.map(({ connector }) => connector))).optional(),
```

```ts
// packages/app/src/connectors.ts
export type Declared = Readonly<{ [C in keyof ConnectorReads]?: readonly (keyof ConnectorReads[C] & string)[] }>
export function defineConnectors<const D extends Declared>(declared: D): D
/** What the handler calls: connectors.sankhya.pedidos(input), typed by the kit; a 'many' connector takes the connection's name. */
export function connectorsOf<const D extends Declared>(context: Context, declared: D): ClientOf<D>
```

`ClientOf<D>` dá a cada conector declarado as operações declaradas, cada uma
`(input: I, ...connection: PerProject[C] extends 'many' ? [name: string] : []) => Promise<Answered<O>>`,
com `Answered<O>` = `ConnectorAnswer` com `value: O` no `OK`, e `connections()` só num conector
`many`. Cada estado é a união por `kind` (C21, C22). O id de conector e de operação são os do kit,
conferidos pelo Hub (C23). O dono de `ConnectorAnswer` é `app-contract` (C26); o de `perProject`, a
definição do conector. Esquema de entrada externa: `Manifest.connectors` (C27); a entrada de cada
leitura é conferida pelo Hub com o Zod da operação. Modelo: `db.ts` e `DbResult` (cumpre C21 e C26;
não tem id).

### As skills e a leitura

`zod` (`zod.dev/llms.txt`: `discriminatedUnion`, `strictObject`); `typescript-magician` para
`ClientOf`; dependency-cruiser (a documentação de `dependencyTypes` e `type-only`); `e2b` (só o
`sdk.ts`, nenhuma chamada).

### A ordem do trabalho

1. Subtrair: `oneRequestAtATime` sai do tipo, das duas definições e do comentário de `probe.ts`.
2. `perProject` no tipo, `defineConnector` o exige; Sankhya `'one'`, Mercado Livre `'many'`.
3. `readsOf` em `kernel/definition.ts` (confere cada chave com o `id`), `sankhyaReads` e
   `mercadoLivreReads`. Os registros são a fonte dos tipos; as listas `sankhyaOperations` e
   `sankhyaDoor` continuam o que o `Connector` leva, e um teste confere que o registro é exatamente a
   porta mais as operações (sem a porta em `operations`, senão `inProbeOrder` repete ids). Regras:
   C26.
4. `logout` no `ClientCredentialsAuth` e na definição do Sankhya; o dublê responde ao logout e dá 401
   ao token encerrado; `sankhya/answers.ts`: um 401 numa leitura com bearer é `TOKEN_EXPIRED`; o
   envelope "4" é `UNREADABLE` com o que veio e `native.code` igual a `'4'` (#470: a fila torna isso um
   defeito nosso, e repetir o esconderia; o Hub, que registra, o reconhece por esse código). Se o conserto pequeno já está no `main`, só o envelope 4.
5. `calls.ts` e a entrada `./calls`; um teste confere `PerProject` contra as definições.
6. `app-contract/src/connectors.ts`; `props.ts`, `runtime.ts` (o `serveApp` passa
   `ctx.props.connectors` ao `Context`), `manifest.ts`.
7. `packages/app/src/connectors.ts`: `defineConnectors` e `connectorsOf` (um `Proxy` sobre
   `context.connectors.call`); `index.ts` exporta. A checagem: `check/manifest.ts` lê o export
   `connectors` de `shared/operations.ts` como lê `roles`, e o leva ao manifesto.
8. A parede: em `connectors-kit-only-in-the-executor`, `pathNot` ganha `^packages/app/src/`; uma regra
   nova `app-reads-kit-types-only` recusa de `^packages/app/` para `^packages/connectors/` todo
   import que não seja `type-only`, e todo alvo que não seja `src/calls.ts`. `scripts/rules.test.ts`
   ganha os dois casos.
9. `infra/e2b/sdk.ts`: `packages/connectors` em `SDK_FOLDERS` (o kit não tem segredo; os dublês e os
   dados de mentira também vão, e não são de empresa nenhuma).
10. A skill `conexus-data`: como declarar, como chamar, os estados da resposta e as frases da matriz;
    um conector `many` pede `connections()` e percorre, nunca um nome escrito no código.

### Como se prova

Critérios 4 a 8: `npm test -w @conexus/connectors`, `npm test -w @conexus/app`,
`npm test -w @conexus/app-contract`, `npm run typecheck -w @conexus/app` (o `types.check.ts`),
`npm run deps`. Hoje falham: nada disso existe.

### Parar se

- O `tsc` da máquina não acha os tipos de `@conexus/connectors/calls` pelo caminho da plataforma
  (`--platform ${OPT}/packages`): mostrar o erro; é a resolução de módulo da checagem, não um tipo.
- `typeof sankhyaReads` perde a entrada ou a saída de alguma leitura (vira `unknown`): parar e
  mostrar qual; não escrever os tipos à mão.

## U2 A liberação e o caderno no banco

**Base e modelo.** `main` no commit em que esta página for aprovada. Sonnet.

### As linhas da tabela

- **A liberação.** `apps/server/src/hub/connectors/tables.ts:29-106` (`connection`, a chave
  `connection_company_connector_id_key` em `:81`), `:114-158` (`connection_sign_in`, o molde da chave
  composta). n8n `shared-credentials.ts:10-23`.
- **O caderno.** `tables.ts:50-52` (`last_test` jsonb), `apps/server/database-grants.sql:251-261`
  (as permissões por coluna). Nango `packages/types/lib/connection/db.ts:35` (`metadata`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/connectors/tables.ts` | Cria `projectConnection`; muda `connection` (`notes`) | U3 |
| `apps/server/migrations/` | Cria a migração (drizzle-kit) | `migrate` |
| `apps/server/database-grants.sql` | Muda: a tabela nova e as colunas de `notes` | `platform/catalog.test.ts` (o confere, sem mudar) |

### Os contratos que a unidade cria

```ts
// tables.ts
/** A Projeto may use a connection (founder, S1, T-A): to read, the whole connection; no ceiling. */
export const projectConnection = connectors.table('project_connection', {
  projectId: text('project_id').notNull(),
  companyId: text('company_id').notNull(),
  connectorId: text('connector_id').notNull(),
  connectionId: uuid('connection_id').notNull(),
  // The connector's perProject is 'one': copied so the database holds one such grant per Projeto.
  exclusive: boolean('exclusive').notNull(),
  grantedBy: text('granted_by').notNull(), // no FK, as connection.linked_by
  grantedAt: instant('granted_at').notNull(),
}, (table) => [
  primaryKey({ columns: [table.projectId, table.connectionId] }),
  uniqueIndex('project_connection_one_key').on(table.projectId, table.connectorId).where(sql`${table.exclusive}`),
  foreignKey({ name: 'project_connection_connection_fkey',
    columns: [table.companyId, table.connectorId, table.connectionId],
    foreignColumns: [connection.companyId, connection.connectorId, connection.id] }).onDelete('cascade'),
  foreignKey({ name: 'project_connection_project_fkey', columns: [table.companyId, table.projectId],
    foreignColumns: [/* a chave (company_id, id) do Projeto, como app_access_company_id_project_id_fkey */] }).onDelete('cascade'),
  policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
])

// em connection:
// What the Builder proved about this company's system (founder, J1): names and codes, never values.
notes: jsonb('notes').notNull().default(sql`'{}'::jsonb`),
check('connection_notes', sql`jsonb_typeof(${table.notes}) = 'object' AND octet_length(${table.notes}::text) <= 32768`),
```

`notes` não sobe `revision` (só quem grava o selo sobe). Permissões (D11): `SELECT, INSERT, DELETE`
em `project_connection` e `SELECT(notes), UPDATE(notes)` em `connection` para o papel da empresa;
`hub_connection_seals` nada de novo. A palavra do fundador para D11 é a aprovação desta página.

### As skills e a leitura

`drizzle-kit` (skill `drizzle` do pacote, só a CLI); `neon:neon-postgres` para o índice parcial.

### A ordem do trabalho

1. As duas mudanças em `tables.ts`; a chave do Projeto é a mesma de
   `app_access_company_id_project_id_fkey` (`apps/server/src/hub/projects/tables.ts:93`), com a tabela
   `project` exportada por `hub/projects/public.ts`.
2. `npm run db:generate -w @conexus/server`; ler o SQL gerado. Regras: D1, D11, D33.
3. `database-grants.sql`; `platform/catalog.test.ts` o confere.

### Como se prova

Critérios 9 e 10: `project-connection.test.ts` (pelo banco de teste), e `platform/catalog.test.ts` confere `database-grants.sql`;
`npm run check:migrations` (a memória: ele recusa `SET` solto em qualquer `.ts` mudado).

### Parar se

- O Projeto não tem chave `(company_id, id)` para a chave composta: parar; criar uma chave num
  subject de outro é decisão de dados.

## U3 O Hub

**Base e modelo.** `main` depois de U1 e U2. Opus: concorrência (a fila, o dono do token, o fim do
Hub) e um contrato entre três assuntos (conectores, apps, Builder).

### As linhas da tabela

- **A liberação; quem libera.** `hub/connectors/routes.ts`, `connections.ts` (o molde das rotas da
  19: `serve`, a admissão, `ofCompany`), `rows.ts`; `hub/identity/admission.ts:70-71`.
- **A chamada do dispatcher.** `hub/apps/routes.ts` (`registerEdgeRoutes`), `hub/apps/handoff.ts`
  (`checkCall`: a sessão do app, a versão, o caller), `packages/hub-api/src/apps.ts:101-118`
  (`checkAppCall`), `apps/server/src/main.ts:96-104` (`createEdgeHub`).
- **Uma por vez; o dono do token.** `hub/connectors/executor.ts` (todo o arquivo: o único que manda),
  `tokens.ts` (o `Access` do OAuth, que continua), `probe.ts:71-157`; o estudo das sessões, seção 4.
- **O banco solto.** `apps/server/src/platform/database.ts:15-19,198`; D22.
- **Publicar.** `hub/apps/live.ts:15` (`publishVersion`), `versions.ts:251-262` (`publishedRolesOf`,
  o molde de ler o manifesto), `hub/apps/routes.ts:81`.
- **A linha por chamada.** `executor.ts:182,215`; S41.
- **O caderno.** Nango `connection-tags-configuration-metadata.mdx:294-298` (o `metadata` mesclado).
- **0058 e 0056.** `docs/decisions/0058-provider-limits-and-queues.md` ("Step 20: a short in-process
  fair queue per provider."); `0056-connectors-kit-and-one-executor.md` ("a 256 KB cap", e o
  executor tem 2 MiB, `wire.ts:10`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/connectors/` | Cria `limits.ts`, `grants.ts`, `app-calls.ts`, `notes.ts`, `builder-port.ts`; muda `executor.ts` (`logout`), `probe.ts` (pela fila), `connections.ts` (Desligar e Conectar de novo encerram o token; `getConnection` com `notes`), `routes.ts`, `public.ts` | `main.ts`; U5 por `public.ts` |
| `apps/server/src/hub/apps/` | Muda `live.ts` ou `send.ts` (o Publicar pergunta aos conectores), `routes.ts` (nada: a porta da borda é dos conectores), `public.ts` (a porta que dá a versão de uma sessão) | `hub/connectors` |
| `apps/server/src/platform/database.ts` | Muda: `max` | todos |
| `apps/server/src/main.ts` | Muda: `createEdgeHub` recebe os conectores; o `release` chama `closeAll` | — |
| `packages/hub-api/src/` | Muda `connectors.ts` (operações e tipos novos), `connector-failures.ts`, `app-failures.ts` (`CONNECTOR_NOT_GRANTED`), `apps.ts` (`publishAppVersion.failures`) | `apps/web`, `apps/edge` |
| `docs/decisions/` | Muda 0058 (a frase do passo 20) e 0056 (o teto) | — |
| `tests/e2e/live-hub.ts` | Muda: o Hub local com os dublês sabe liberar | a QA |

### Os contratos que a unidade cria

**Rotas** (`packages/hub-api/src/connectors.ts`):

| Operação | Acesso | Método e caminho | Entrada | Sucesso | Falhas |
| --- | --- | --- | --- | --- | --- |
| `listProjectConnections` | session, `readConnections` | `GET /api/companies/{companyId}/projects/{projectId}/connections` | params | 200 `ProjectConnections` | `NOT_FOUND`, `SESSION_REQUIRED`, `DATABASE_UNAVAILABLE` |
| `grantProjectConnection` | session, `manageConnections` | `PUT …/projects/{projectId}/connections/{connectionId}` | params | 200 `{ grant: Grant }` | `NOT_FOUND`, `CONNECTION_NOT_FOUND`, `PROJECT_CONNECTION_TAKEN` (409), `SESSION_REQUIRED`, `DATABASE_UNAVAILABLE` |
| `revokeProjectConnection` | session, `manageConnections` | `DELETE …/projects/{projectId}/connections/{connectionId}` | params | 204 | `NOT_FOUND`, `SESSION_REQUIRED`, `DATABASE_UNAVAILABLE` |
| `deleteConnectionNote` | session, `manageConnections` | `DELETE /api/companies/{companyId}/connections/{connectionId}/notes/{concept}` | params (`concept` 1 a 120) | 204 | `NOT_FOUND`, `SESSION_REQUIRED`, `DATABASE_UNAVAILABLE` |
| `callAppConnector` | edge (S48) | `POST /api/app-connector-calls` | cabeçalho `APP_SESSION_HEADER`; corpo `{ host, connector, operation, connection: string \| null, input: unknown, deadlineMs: int 1..10000 }`, `bodyLimit` 64 KB | 200 `ConnectorAnswer` | `APP_SESSION_INVALID`, `APP_ACCESS_REFUSED`, `APP_NOT_FOUND`, `APP_NOT_PUBLISHED`, `DATABASE_UNAVAILABLE` |
| `listAppConnections` | edge | `GET /api/app-connector-calls/connections?host&connector` | cabeçalho da sessão | 200 `{ names: string[] }` | os mesmos |

`getConnection` passa a responder `notes: ConnectionNote[]`. `publishAppVersion.failures` ganha
`CONNECTOR_NOT_GRANTED` (409, frase "Este app usa um sistema que o Projeto não liberou. Libere em
Integrações do Projeto.").

```ts
// packages/hub-api/src/connectors.ts
export const Grant = z.object({ by: z.string().nullable() /* nome; null quem saiu */, at: z.iso.datetime() })
export const ProjectConnections = z.object({ connectors: z.array(z.object({
  connector: ConnectorEntry.pick({ id: true, name: true, logo: true, category: true }),
  perProject: z.enum(['one', 'many']),
  connections: z.array(z.object({ id: ConnectionId, name: z.string(), state: z.enum(CONNECTION_STATES),
    account: z.object({ label: z.string() }).nullable(), grant: Grant.nullable() })),
})) })
export const ConnectionNote = z.object({ concept: z.string().min(1).max(120), mapping: z.string().min(1).max(500),
  provedAt: z.iso.datetime(), provedRows: z.int().nonnegative(), writtenBy: z.string().nullable() })
```

```ts
// apps/server/src/hub/connectors/notes.ts: o Hub lê notes por este esquema (C27)
const Note = z.strictObject({ mapping: z.string().min(1).max(500), provingQuery: z.string().min(1).max(4000),
  provedAt: z.iso.datetime(), provedRows: z.int().nonnegative(), writtenBy: z.string() })
export const Notes = z.record(z.string().min(1).max(120), Note) // a chave é o conceito

// apps/server/src/hub/connectors/limits.ts
/** One per Hub process (0058): each connection's calls one at a time, and a pasted-key connection's token reused, renewed with a logout first. */
export type Limits = {
  /** Runs `work` when the connection's turn comes; DEADLINE when `deadlineMs` passes in the queue. */
  inTurn<T>(connection: ConnectionId, deadlineMs: number, work: (waitedMs: number) => Promise<T>): Promise<T | Readonly<{ kind: 'DEADLINE' }>>
  /** The live token, or one login (the old token logged out first, while it lives). */
  token(opened: OpenedConnection, deadlineMs: number): Promise<Login>
  /** A 401 on `token`: dropped when it is still the current one. */
  invalidate(opened: OpenedConnection, token: BearerToken): void
  /** Desligar, Conectar de novo: log out and forget. */
  forget(connection: ConnectionId): Promise<void>
  /** The Hub's end: log out every live token, never throwing, within `deadlineMs`. */
  closeAll(deadlineMs: number): Promise<void>
}
type TokenState = Readonly<{ kind: 'NONE' }> | Readonly<{ kind: 'LIVE'; token: BearerToken; expiresAt: number }>
  | Readonly<{ kind: 'RENEWING'; done: Promise<Login> }>

// executor.ts: uma operação a mais, e o executor continua o único que manda (0056)
logout(connection: OpenedConnection, token: BearerToken, deadlineMs: number): Promise<'LOGGED_OUT' | 'REFUSED' | 'UNREACHABLE' | null> // null: o conector não declara

// apps/server/src/hub/connectors/builder-port.ts, exportado por public.ts
export type GrantedConnection = Readonly<{
  connectionId: ConnectionId; connector: string; name: string; perProject: 'one' | 'many'
  skill: Readonly<{ name: string; content: string; references: Readonly<Record<string, string>> }>
  reads: readonly Readonly<{ operation: string; summary: string }>[]
  notes: readonly string[] // os conceitos
}>
export type ShapedRead = Readonly<{ kind: 'OK'; value: unknown; complete: boolean }> | Exclude<ConnectorAnswer, { kind: 'OK' }>
export type BuilderConnectors = {
  granted(ids: OfProject): Promise<readonly GrantedConnection[]>
  read(ids: OfProject, a: { connectionId: ConnectionId; operation: string; input: unknown; personId: PersonId; runId: string }): Promise<ShapedRead | Readonly<{ kind: 'CALLS_SPENT' }>>
  notes(ids: OfProject, connectionId: ConnectionId): Promise<Readonly<Record<string, z.infer<typeof Note>>> | null>
  saveNote(ids: OfProject, a: { connectionId: ConnectionId; concept: string; mapping: string; provingQuery: string; personId: PersonId; runId: string }):
    Promise<Readonly<{ kind: 'SAVED'; provedRows: number }> | Exclude<ConnectorAnswer, { kind: 'OK' }> | Readonly<{ kind: 'NOTE_INVALID' }>>
}
```

A porta `apps → conectores` para o Publicar: `connectors.ungranted(ids: OfProject, declared:
Manifest['connectors']): Promise<readonly { connector: string; operation: string | null }[]>`, que
`hub/apps` recebe por `main.ts` (C4). A porta `conectores → apps` para a chamada do app: a de
`checkCall` que a 18 já tem, mais a versão (`versionId`) e o manifesto dela; `hub/apps/public.ts` a
exporta.

Cada estado é união por `kind` (C21). `ConnectionId`, `ProjectId`, `CompanyId` com a marca do
`hub-api`, conferidos na entrada da rota (C23); `OfProject` é `{ companyId: CompanyId; projectId: ProjectId }`,
exportado pelo `hub-api` (hoje é local em `projects.ts:213` e `versions.ts:94`: a U3 o move). Os donos (C26): `ConnectorAnswer` (`app-contract`),
`Notes` (`notes.ts`), o teto de 50 chamadas por conversa (`builder-port.ts`, `CONNECTOR_CALLS_PER_TURN`),
o corte (`builder-port.ts`, 20 linhas e 16 KB), o teto da resposta da borda (`hub-api`,
`APP_CONNECTOR_REPLY_BYTES = 2 MiB`, o mesmo número de `wire.ts`). Esquemas de entrada externa (C27):
o corpo da rota da borda, a entrada da operação (o Zod do kit, `requestOf`), `notes` lido do banco.
Modelo: `connections.ts` e `probe.ts` da 19 (cumprem C21, C23, C26).

### As skills e a leitura

`fastify-best-practices`; `better-auth-best-practices` (só as capacidades); `node` (concorrência em
memória, `AbortSignal.timeout`); `drizzle-orm` (`orm.drizzle.team/llms.txt`: `sql` com `||` e `-`
em jsonb); o guia de [security](../guides/security.md) (S10, S36, S41, S48).

### A ordem do trabalho

1. **0058 e 0056 primeiro** (a frase do passo 20 vira "Step 20: one call at a time per connection,
   in process; a waiter past its deadline answers DEADLINE."; o teto da 0056 vira o do executor,
   2 MiB). É a primeira unidade que toca o executor.
2. `executor.logout`. Regras: S36, S41.
3. `limits.ts`: um `Map<ConnectionId, { queue, token: TokenState }>`; `inTurn` é uma fila de um com
   espera cortada pelo prazo (`AbortSignal.timeout` na espera, a vez passa ao próximo); `token`
   renova com 60 s de folga, um login por vez (`RENEWING` guarda a promessa), logout do velho antes.
   O OAuth continua em `tokens.ts` (`Access`), chamado dentro de `inTurn`. Regra: C38 não se aplica
   (memória de um processo, 0058).
4. `probe.ts` passa por `limits.inTurn` e `limits.token`; o Testar nunca encontra uma chamada do app
   na mesma ligação.
5. `grants.ts` e as rotas da liberação: `ON CONFLICT (project_id, connection_id) DO NOTHING RETURNING` e,
   sem linha, a releitura (o molde do OS, `e0353c36 apps/hub/src/connectors/store.ts:154-176`); um
   `ON CONFLICT` sem alvo engoliria o 23505 de `project_connection_one_key`, que tem de virar
   `PROJECT_CONNECTION_TAKEN`; o 23503 de uma ligação ou Projeto apagado no meio vira
   `CONNECTION_NOT_FOUND` ou `NOT_FOUND`. Regras: S10 (o membro e outra empresa dão 404).
6. `app-calls.ts`: tx 1 curta (a sessão pela porta de apps, a versão e o manifesto, a liberação da
   ligação pelo nome ou a única do conector, `ACTIVE`, a `class` `read`, o selo); a chamada dentro de
   `inTurn`, com o prazo `min(deadlineMs, CALL_DEADLINE_MS)`; tx 2 só para `NEEDS_REAUTH`. Toda recusa
   de admissão é `NOT_GRANTED`. A rota da borda nos dois caminhos. Regras: D22, S10, S48.
7. `POOL_LIMITS.max = 20`, com o comentário da fonte (o limite do Neon na menor máquina, cerca de 104
   conexões, menos o pool do Mastra e as reservadas; conferir a página de limites do Neon ao
   escrever).
8. A linha `CONNECTOR_CALLED`, escrita uma vez por chamada em `app-calls.ts` e `builder-port.ts`.
9. Publicar: `hub/apps` pergunta `connectors.ungranted` antes de gravar.
10. `notes.ts` (`UPDATE … SET notes = notes || jsonb_build_object($1::text, $2::jsonb)`, `notes - $1::text`;
    o 23514 de `connection_notes`, o caderno cheio, vira `NOTE_INVALID`) e
    `builder-port.ts` (o corte, o teto de 50 por execução contado por `runId`, `saveNote` roda a
    consulta pela entrada `consultar` da porta de leitura do conector e guarda só o número de
    linhas). Um conector sem `readDoor` não tem caderno: `saveNote` dá `NOTE_INVALID`.
11. `main.ts`: `createEdgeHub` registra as rotas da borda dos conectores; `release` chama
    `limits.closeAll` antes de fechar o banco. A porta do Builder fica exportada por `public.ts`; quem a
    liga ao Builder é a U5.
12. `connections.ts`: Desligar e Conectar de novo chamam `limits.forget`.
13. `tests/e2e/live-hub.ts`: a liberação no Hub local.

### Como se prova

Critérios 11 a 23 e 30 (a parte do Hub): os testes nomeados, pelo Hub de teste e os dublês (T5),
`npm test -w @conexus/server -- grants app-calls limits notes publish connections-sessions`. O
critério 18 é o do estudo (seção 4.5) pela porta pública: o dublê do Sankhya com `slow(5000)`, vinte
ligações liberadas e um `POST /api/app-connector-calls` em cada, ao mesmo tempo, e `GET
/api/app-sessions/current` no meio. Hoje todos falham: nada
disso existe.

### Parar se

- A sessão do app não dá a versão nem o manifesto sem uma segunda leitura do banco: mostrar e
  parar; não duplicar `checkCall`.
- O dublê do Sankhya não reproduz o logout como o estudo das sessões mediu (401 depois do logout,
  403 com o token vencido): parar; o dublê é da U1.
- O `max` do pool precisa passar de 30 para o critério 18 passar: parar; o problema é a conexão
  presa, não o número.

## U4 O dispatcher

**Base e modelo.** `main` depois da U3. Sonnet: o desenho é o do `Db`.

### As linhas da tabela

- **`props.connectors`.** `apps/edge/src/dispatcher.ts:14-28` (`Db`, o `export default`),
  `dispatch.ts:37` (`Exports`), `:144-180` (`toApp`: as props, o prazo), `db.ts:1-40` (o prazo e a
  linha de registro de um `db` vencido).
- **A chamada ao Hub.** `apps/edge/src/hub.ts:13-109` (`HubAnswer`, `HubPort`, o teto em `:33`, `hubOf` em `:59`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/edge/src/` | Cria `connectors.ts`; muda `dispatcher.ts` (a entrada `Connectors`), `dispatch.ts` (`Exports`, as props), `hub.ts` (duas operações, o teto por operação) | o Worker do dispatcher |
| `apps/edge/wrangler.*` | Nada: a entrada sai de `ctx.exports`, como `Db` | — |

### Os contratos que a unidade cria

```ts
// apps/edge/src/connectors.ts
/** What the dispatcher binds one call's connectors to; the app reads none of it. */
export type ConnectorsProps = Readonly<{ host: HostLabel; session: AppSessionToken; endsAt: number }>
export function connectorsOf(hub: HubPort, props: ConnectorsProps): Connectors // a de app-contract

// dispatcher.ts
export class Connectors extends WorkerEntrypoint<Env, ConnectorsProps> {
  call(connector: string, operation: string, input: unknown, connection?: string): Promise<ConnectorAnswer>
  connections(connector: string): Promise<readonly string[]>
}

// hub.ts, em HubPort
callAppConnector(input: CallRequest & { session: AppSessionToken }, deadlineMs: number): Promise<HubAnswer<ConnectorAnswer>>
listAppConnections(input: { host: HostLabel; connector: string; session: AppSessionToken }): Promise<HubAnswer<{ names: string[] }>>
```

O teto da resposta passa a ser por operação: 16 KB para as da 18, `APP_CONNECTOR_REPLY_BYTES` para
`callAppConnector`. Um `REFUSED` ou `NO_ANSWER` do Hub dá ao app `UNREACHABLE` e uma linha
`CONNECTOR_HUB_NO_ANSWER` com a razão (S41). Modelo: `Db` e `dbOf` (cumprem C21 e C26).

### As skills e a leitura

`cloudflare:workers-best-practices`, `cloudflare:wrangler` (só a leitura de `WorkerEntrypoint` e
`ctx.exports`); a decisão 0047.

### A ordem do trabalho

1. `hub.ts`: as duas operações, o prazo dado por quem chama (o que resta do clique, nunca mais que
   ele), o teto por operação.
2. `connectors.ts`: antes de chamar, um clique vencido dá `DEADLINE` sem chamar o Hub (como `db.ts`);
   a resposta do Hub é conferida por `ConnectorAnswer` (C27).
3. `dispatcher.ts` e `dispatch.ts`: `Connectors` ao lado de `Db`; `toApp` dá
   `connectors: visit.exports.Connectors({ props: { host, session, endsAt } })` só a uma versão com
   banco (o app de exemplo não recebe). Regras: S4, S48, 0047.

### Como se prova

Critérios 24 a 27: `dispatcher-connectors.test.ts` (novo, no molde de `dispatcher.test.ts` e
`db.test.ts`) e um caso em `dispatcher-limits.test.ts`; `npm test -w @conexus/edge`. Hoje falham.

### Parar se

- O `ctx.exports.Connectors` não existe no `workerd` dos testes como existe `Db`: mostrar o erro.

## U5 O Builder

**Base e modelo.** `main` depois da U3. Sonnet: o desenho é o de `toolsOf` e de `skills`, nativos do
Mastra.

### As linhas da tabela

- **As ferramentas.** `apps/server/src/builder/conversation/builder.ts:69-74` (`toolsOf`), `:166`;
  `turn-of.ts:95` (`projectIn`: o Projeto da conversa); `permissions.ts:22-58` (`READ`,
  `TOOL_CLOSURE`); Mastra `agent.ts:3489-3530` (um `tools` que devolve vazio lança: devolver sempre o
  objeto com as fixas).
- **A skill.** `builder.ts:164`, `instructions.ts:55-78` (`skillOf`: `validateSkillContent` com
  `directoryName`); a skill do conector vem da porta da U3, com `name` (`conexus-sankhya`) e o
  `directoryName` igual a ele.
- **O corte.** A porta já corta; a ferramenta devolve a resposta dela. O rastro das ferramentas foi
  para a 21.1 (fonte: revisão da PR 495).
- **As instruções.** `instructions.ts` (`builderInstructions`, `fillPrompt`), `prompt/`.
- **O aviso 0032.** `docs/decisions/0032-data-leaving-brazil-told.md`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/connectors/` | Cria `connector-tools.ts` e `public.ts` | `builder/conversation/` |
| `apps/server/src/builder/conversation/` | Muda `builder.ts` (`tools`, `skills`, `createBuilder` recebe a porta), `public.ts` (`createConversations` a passa a `createBuilder`, `public.ts:49`), `permissions.ts` (as três em `READ`), `instructions.ts` e `prompt/` (o bloco das ligações) | `main.ts` |
| `apps/server/src/main.ts` | Muda: `createConversations` recebe `connectors.builder` | — |
| `packages/hub-api/src/tools.ts` | Muda: os três nomes em `BUILDER_TOOL` (a tela mostra a linha da ferramenta) | `apps/web` |
| `docs/decisions/0032-data-leaving-brazil-told.md` | Muda: uma linha | — |

### Os contratos que a unidade cria

```ts
// builder/connectors/connector-tools.ts
export const CONNECTOR_TOOLS = { read: 'connector_read', notes: 'connector_notes', noteSave: 'connector_note_save' } as const
/** The three tools for a conversation whose Projeto has at least one grant; {} otherwise. */
export function connectorTools(port: BuilderConnectors, granted: readonly GrantedConnection[], ids: OfProject & { personId: PersonId }): ToolsInput
```

- `connector_read`: entrada `{ connection: string /* o nome */, operation: z.enum(<as leituras liberadas, "conector.operação">), input: z.record(z.string(), z.unknown()) }`;
  a descrição lista cada leitura com o `summary`. A saída é a `ShapedRead` da porta.
- `connector_notes`: `{ connection }` → as anotações com a consulta de cada uma.
- `connector_note_save`: `{ connection, concept (1..120), mapping (1..500), provingQuery (1..4000) }`.
- `tools: async ({ requestContext }) => ({ ...toolsOf(...), ...connectorTools(...) })`;
  `skills: async ({ requestContext }) => [...APP_SKILLS, ...granted.map(skillOfConnector)]`.

### As skills e a leitura

`mastra` (a versão instalada: `node_modules/@mastra/core/dist/docs/`, ferramentas dinâmicas,
skills por pedido).

### A ordem do trabalho

1. `builder/connectors/connector-tools.ts` com a porta da U3; os três nomes em `BUILDER_TOOL` e em `READ`.
2. `builder.ts`: `tools` e `skills` como funções do `requestContext`, lendo o Projeto por `projectOf`
   e as liberações por `port.granted` (uma leitura por turno; o Mastra guarda as skills por
   `RequestContext`, e a retomada traz um novo).
3. O bloco das instruções: as ligações liberadas, o `perProject` e os conceitos do caderno; nenhum
   valor.
4. A linha do 0032: "trechos lidos das integrações liberadas vão ao fornecedor do modelo".

### Como se prova

Critérios 28 a 30: `conversation-connectors.test.ts` (novo, no molde de
`conversation-tools.test.ts`, pelo Hub de teste e o modelo gravado), `npm test -w @conexus/server --
conversation-connectors`. Hoje falham.

### Parar se

- (Retirado, fonte: revisão da PR 495.) O Mastra não resolve `skills` nem as instruções de novo num
  turno retomado (`@mastra/core` 1.79.0 `dist/agent-tuAMgHe3.js:40997`, `:41078`, `:27606-27629`); a
  retomada é provada só pelas ferramentas, refeitas a cada execução (`:41105`).
- O `availableTools` do modo recusa uma ferramenta que nasce por pedido: parar; o fechamento das
  ferramentas é da 14.2.

## U6 As telas da liberação e do caderno

**Base e modelo.** `main` depois de U0 e U3. Sonnet.

### As linhas da tabela

- **Integrações do Projeto.** `apps/web/src/hub/connectors/integrations.tsx`, `logo.tsx`,
  `queries.ts`, `text.ts` (as frases da 19); `apps/web/src/hub/projects/project-rail.tsx` (U0); o OS
  `shell.tsx:97-98`.
- **O Caderno.** `apps/web/src/hub/connectors/connection-page.tsx`, `unlink-dialog.tsx` (o molde da
  confirmação).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/connectors/` | Cria `notes.tsx`; muda `connection-page.tsx`, `queries.ts`, `text.ts`, `public.ts` | a página da ligação |
| `apps/web/src/hub/projects/` | Cria `project-integrations.tsx`, `grant-dialog.tsx` (a confirmação); muda `project-rail.tsx` (a entrada Integrações) | a rota nova |
| `apps/web/src/routes/_app/companies/$companyId/` | Cria `projects/$projectId_.integrations.tsx` | o roteador |
| `packages/hub-api/src/pages.ts` | Muda: as frases novas (`PROJECT_CONNECTION_TAKEN`, `CONNECTOR_NOT_GRANTED`) | a tela |
| `docs/reference/screens.md` | Muda: Integrações do Projeto (W29) | — |

### Os contratos que a unidade cria

Nenhum novo além da tela: lê `ProjectConnections`, `Connection.notes` e as rotas da U3. Endereço
`/companies/<e>/projects/<p>/integrations`. As frases: as da matriz de estados.

### As skills e a leitura

`shadcn` (`List`, `Dialog`, `AlertDialog`), `@tanstack/react-router`, `impeccable` como a U0.

### A ordem do trabalho

1. `project-integrations.tsx`: um grupo por conector ligado, uma linha por ligação (`ConnectorLogo`,
   o nome, a conta, "lê" ou "não liberado"); **Liberar para ler** abre a confirmação com a frase do
   roteiro; num conector `one` com outra ligação liberada, as outras linhas trocam o botão pela frase
   "O <conector> lê uma ligação por Projeto. Tire a <nome> antes." (a escolha é a linha: liberar uma
   é escolher qual, pelo nome). Regras: W31, V56.
2. A entrada Integrações em `project-rail.tsx`.
3. `notes.tsx` na página da ligação; **Apagar** com `AlertDialog`.
4. `screens.md`.

### Como se prova

Critérios 32 e 33 pelos testes de tela (no molde de `integrations.test.tsx`), `npm test -w
@conexus/web -- project-integrations notes`; o 31, a QA.

### Parar se

- A QA ou o fundador pedirem trocar a ligação `one` num toque, em vez de tirar e liberar: parar; é
  comportamento que o fundador vê, e volta à página dele.
