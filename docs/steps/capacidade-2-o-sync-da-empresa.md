# Capacidade 2: O Sync da empresa

O roteiro diz: "**Capacidade 2. O Sync da empresa.** Cada dado de uma fonte, o Sankhya primeiro, é
copiado uma vez para a empresa; cada Projeto recebe a liberação do que usa. Uma página mostra cada
cópia (fonte, dado, última rodada, duração, linhas, Projetos); você a pausa, roda ou muda o
intervalo." O fundador aprovou o desenho em 2026-11-09 ("1. Aprovo Capacidade 2"), antes de este
cartão ser escrito, depois de ler no chat o desenho do parecer de arquitetura de código sobre o
estudo, e deixou mesclar o cartão sem ver a página antes ("2. Mesclar pode"). O desafio que deu a
forma, no mesmo dia: "A gente não pode só pensar no Sankhya ... O Sankhya é o primeiro conector,
porque é o que minha empresa usa, mas não é a base do Conexus." Este cartão escreve esse desenho.
Cada linha citada foi lida no `main` em `f24c3fcf` (as do Sankhya reabertas em `69dfb179`, depois do
fechamento das buscas), com `@mastra/core` 1.82.0, `better-auth` 1.7.8,
`@neondatabase/serverless` 1.2.0, `drizzle-orm` 1.0.0-rc.4, `zod` 4.6.5, `@tanstack/react-router`
1.170.44, `@tanstack/react-query` 5.104.0 e PostgreSQL 18. O código da Capacidade 1 ainda não está
no `main`: o que este cartão cita dele é a sua unidade em construção (pull request 928). O construtor
de cada unidade reabre as linhas no `main` do dia.

## A página do fundador

**No fim desta capacidade** você abre **Cópias** na área da empresa, liga uma cópia de um dado do
seu Sankhya escolhendo a conexão e um modelo, vê cada rodada dela (quando, quanto durou, quantas
linhas), pausa, retoma, roda na hora e muda o intervalo, libera a cópia a um Projeto e a vê em
**Dados** desse Projeto, só para ler.

**Como é feito, em três peças, cada uma com um dono.**

1. **O motor é do Conexus e não conhece nenhum sistema.** O relógio, uma rodada por vez, até onde
   leu, o registro de cada rodada, a gravação no banco da empresa, a liberação por Projeto e a
   página Cópias. Serve igual para Sankhya, Oracle, MySQL ou uma API.
2. **A definição de cada cópia é dado da empresa.** Uma linha no banco do Conexus, da sua empresa:
   de qual conexão lê, qual consulta, quais colunas, qual é a chave e que janela relê. Cada empresa
   tem as suas, e uma definição própria de uma empresa cabe nessa linha sem mexer no motor.
3. **O conector só oferece duas coisas.** Uma leitura genérica em páginas e **modelos** para
   começar. O Sankhya traz cinco: **clientes**, **vendedores**, **produtos**, **vendas** e **itens
   de venda**. Quando alguém liga uma cópia, o modelo é copiado para a linha da empresa; dali em
   diante a definição é da empresa.

Um app nunca chama o Sankhya: só o Hub chama. O app lê a cópia, no banco da empresa, só leitura.

**O roteiro de uso.** Você é dono da empresa; a conexão Sankhya está ligada e funcionando, e o
Projeto "Vendedores" tem um app publicado.

1. Na faixa da empresa, ao lado de Automações e Agentes, clique em **Cópias**. A página abre vazia,
   com **Ligar uma cópia**.
2. Clique em **Ligar uma cópia**: escolha a conexão Sankhya, o modelo **Vendas** e o intervalo de
   30 minutos. A cópia aparece na lista, com a fonte, o dado, o estado, a última rodada, a duração,
   as linhas, o intervalo e os Projetos; a primeira rodada começa logo e a linha diz "Rodando…".
   Ligue também **Clientes**.
3. Clique na linha de Vendas: aparece o que ela copia (a consulta, a chave e a janela que relê) e as
   últimas rodadas, cada uma com quando começou, quanto durou, quantas linhas leu e gravou, e o
   resultado em palavras. Volte e, no menu da linha, toque **Rodar agora**: ela roda em seguida; se
   já estiver rodando, aparece que já está rodando e nada roda duas vezes. **Pausar** para o
   relógio, **Retomar** volta no próximo horário, e **Intervalo** muda o intervalo, de 15 minutos no
   mínimo.
4. No Projeto "Vendedores", em **Integrações**, libere **Vendas** e **Clientes**. Abra **Dados** do
   Projeto: além das tabelas do app, aparece **Cópias liberadas** com `vendas` e `clientes`, e as
   linhas de cada uma, só para ler. A coluna **Projetos** da página Cópias passa a mostrar
   "Vendedores".
5. Entre como uma pessoa que é **Membro** da empresa: **Cópias** não aparece na faixa, e o endereço
   da página mostra "não encontrado". Como **Desenvolvedor**, a página aparece e faz tudo o que o
   dono faz (sua resposta: "Dono e o admnistrador e desenvolvedor").

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página (já aprovou o desenho e
deixou mesclar sem ver). Antes de construir sobre os modelos: autoriza a prova só de leitura no seu
Sankhya, que traz só números e nenhum dado (a P1 diz o que ela mede). Quando a
lista de permissões do banco do Conexus ganhar as três tabelas das cópias: diz sim nesse pull
request, que vem sozinho (regra D11 do guia de dados). No fim: faz o roteiro, diz o que viu e
aprova os textos das telas.

**Fica de fora.**

- **Digitar SQL numa tela, e o Builder propor uma definição.** Uma definição diferente do modelo
  (as vendas do jeito da sua empresa, um campo `AD_`, outra tabela) já cabe na linha da cópia, mas
  quem a escreve é o Builder, investigando o ERP e propondo, e uma pessoa aceita: é a Capacidade 3
  ("O Builder aprende o Sync"). Nesta capacidade ninguém digita SQL numa tela.
- **Mudar a definição de uma cópia depois de ligada.** Ligar de novo o mesmo modelo não cria
  outra cópia; uma definição própria entra com a Capacidade 3.
- **Apagar uma cópia.** Pausar para o relógio; apagar entra quando você pedir.
- **Modelos de outras fontes** (Oracle, MySQL, outros ERPs, uma API). O motor já serve a elas; o
  roteiro deixa essas fontes sem ordem.
- **O vendedor ver só as suas linhas.** É a Capacidade 4; hoje o app filtra.
- **Avisos quando uma cópia falha.** A falha aparece na linha e na rodada.
- **Os avisos guardados para um cartão** (`next-card`, 137 abertos em 2026-11-10): dois tocam este
  assunto e esperam com a razão. A #819 (o dublê do Sankhya recusa o SQL no dialeto do Sankhya)
  não trava esta capacidade: a leitura em páginas usa a mesma forma de página das buscas, que o
  dublê já roda; a #754 (o teste do agendador das automações espera o relógio de verdade) é da
  etapa das automações, e o teste do relógio das cópias nasce sem esse defeito (critério 27).
  Nenhum outro toca as cópias, o banco da empresa ou a página Cópias.

**Os mecanismos que são nossos (remendo), com o nativo ao lado.** Nenhuma biblioteca instalada guarda
até onde uma cópia leu de um sistema de fora entre uma rodada e outra (o estado de um workflow do
Mastra vive dentro de uma rodada só). Por isso, como o ML-VIGIA e o Nango fazem, estes cinco são
nossos e estavam no desenho que você aprovou:

- **Até onde leu.** A posição dentro da passada fica salva a cada página; a marca da última passada
  completa só avança quando tudo foi lido. Nativo ao lado: a agenda do Mastra só sabe quando rodar.
- **Uma rodada por vez.** Uma trava com prazo na linha da cópia, com a senha de quem a pegou, como
  o Factory do Mastra faz por projeto. Nativo ao lado: o Mastra não impede duas rodadas da mesma
  agenda (o estudo provou quatro ao mesmo tempo).
- **Teto por rodada.** Uma rodada para antes da página seguinte depois de 200 páginas ou 10 minutos,
  e a próxima continua de onde parou. Nativo ao lado: nenhum.
- **O que sumiu do Sankhya.** Cada passada relê inteira a janela da definição (30 dias de vendas); o
  que não veio numa passada completa sai da cópia, e uma passada parcial nunca apaga. Nativo ao
  lado: nenhum; o Nango faz o mesmo no código dele.
- **O registro de cada rodada.** Uma tabela nossa, porque o Mastra não grava uma rodada pedida na
  hora. Nativo ao lado: os disparos guardados pela agenda do Mastra.

**As decisões suas nesta capacidade.** Nenhuma nova. A forma segue o que você já disse (a cópia é da
empresa; dono, administrador e desenvolvedor; não rígido, não só Sankhya) e o roteiro (o Builder
propõe na Capacidade 3). As frases das telas você aprova no fim, como em toda etapa.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| P1 A prova no Sankhya | A prova só de leitura no Sankhya do fundador, só contando, e o registro de decisão com o critério e o resultado | `docs/decisions/` (o registro 0063), `docs/index.md` | [testing](../guides/testing.md) | esta página aprovada; a autorização da chamada |
| U1 O kit da cópia | O tipo da definição e da leitura em páginas no kit (`kernel/copy.ts`); a leitura em páginas e os cinco modelos do Sankhya; o dublê e a gravação | `packages/connectors/src/{kernel,sankhya}/` | [testing](../guides/testing.md) | P1 |
| U2 O motor | O assunto `hub/copies` sem relógio: as três tabelas do Hub, ligar, a rodada com a trava, a liberação e o que se apaga com o Projeto; o SQL do banco da empresa em `platform/copy-sql.ts`; a porta da leitura em `hub/connectors/copy-port.ts` | `apps/server/src/hub/{copies,connectors,apps}/`, `apps/server/src/platform/`, `apps/server/migrations/`, `apps/server/database-grants.sql` | [data](../guides/data.md) | U1 |
| U3 A permissão, as rotas e o relógio | `copy: manage` para dono, administrador e desenvolvedor; o contrato `copies.ts` e as falhas; as rotas; o relógio em `builder/copy-clock/`; as ligações em `main.ts` e `conversations-of.ts` | `packages/hub-api/src/`, `apps/server/src/hub/{copies,identity}/`, `apps/server/src/builder/copy-clock/`, `apps/server/src/{main,conversations-of}.ts`, `apps/web/src/platform/test-may.ts`, `docs/architecture.md`, `docs/decisions/0058-provider-limits-and-queues.md` | [security](../guides/security.md) | U2 |
| U4 A página Cópias | As rotas `…/copies` e `…/copies/$copyId`; a lista, Ligar uma cópia, as ações da linha e as rodadas; a entrada **Cópias** na faixa | `apps/web/src/hub/copies/`, `apps/web/src/routes/_app/companies/$companyId/`, `packages/hub-api/src/pages.ts`, `docs/reference/screens.md` | [web](../guides/web.md) | U3 |
| U5 A liberação e as cópias em Dados | Liberar e tirar em Integrações do Projeto; **Cópias liberadas** na página Dados e as linhas de uma cópia | `apps/web/src/hub/{projects,apps}/`, `apps/web/src/routes/_app/companies/$companyId/projects/`, `apps/server/src/hub/apps/`, `packages/hub-api/src/`, `packages/hub-api/src/pages.ts`, `docs/reference/screens.md` | [web](../guides/web.md) | U3; a Capacidade 1 no `main` |

**Os grupos.** Grupo A, o servidor: U1, U2 e U3, num pull request de construção, um commit por
unidade, nessa ordem. Grupo B, as telas: U4 e U5, num segundo pull request, depois do A no `main`;
a U5 começa quando a Capacidade 1 estiver no `main`. O CI roda uma vez por pull request e o revisor
lê cada commit. É a mudança de método da L9 que o fundador pediu em 2026-11-09 ("Sim, por exemplo
U1, U2 e U3 seriam um PR por exemplo"), gravada no livro de aprovações e escrita na L9 e na L13
pela pull request https://github.com/developmentconexus-ops/conexus/pull/925; as cinco unidades em
dois grupos estão no desenho que ele aprovou para esta capacidade. Se a 925 ainda não estiver no
`main` quando o grupo A abrir, o fechamento ([delivery L20](../guides/delivery.md)) anota a emenda
da L9. Cada commit termina verde sozinho. Nenhuma unidade corre em paralelo com outra: cada uma lê o contrato da anterior.

**A lista de permissões, sozinha.** A migração da U2 com as três tabelas, as políticas por linha e
as permissões do login do Hub (`apps/server/database-grants.sql` e o `snapshot.json`) entra num pull
request só dela, antes do grupo A, com a palavra do fundador ([data D11](../guides/data.md)). Ela
não tem leitor até o grupo A: é a exceção que a D11 obriga, e o pull request diz isso.

**A prova antes.** A P1 é uma chamada a um serviço de fora: roda só com a autorização dessa chamada,
por quem a recebeu, fora do repositório; o repositório guarda só o critério e o resultado
([delivery L21](../guides/delivery.md)). Ela não gasta nome de versão ([delivery L17](../guides/delivery.md)).

**Os trilhos.** A U1 muda `packages/connectors/src/sankhya/`, que é do trilho do molde ([delivery
L27](../guides/delivery.md)): espera qualquer unidade aberta daquele trilho nos mesmos arquivos
([delivery L1](../guides/delivery.md)). A etapa "As buscas do Sankhya" fechou na pull request 931
(o fechamento mudou `fake-sales.ts`, `fake-data.ts` e `search-sql.ts`, que a U1 lê no `main` do
dia); nenhuma outra unidade daquele trilho está aberta nesses arquivos. A mudança de contrato do kit
(`kernel/copy.ts`, `kernel/definition.ts`) é lida pelo trilho de fronteira, que é o deste cartão. A
U4 e a U5 só importam peças de `apps/web/src/ui/` e não mudam nenhum arquivo de
`apps/web/src/{brand,ui}/` (o trilho de desenho); em `f24c3fcf` não há cartão de desenho em
`docs/steps/`. Se uma delas precisar mudar uma peça de `ui/`, para e espera a unidade de desenho.

**Orçamento de código alterado.** U1: ~420 linhas (`kernel/copy.ts` ~100, `definition.ts` ~25, a
leitura em páginas ~130, os cinco modelos ~150, índice e exportações ~15). U2: ~1.180 (tabelas ~110,
ligar ~140, a rodada ~280, as leituras da lista e das rodadas ~150, a liberação com o banco do
Projeto e o que sai com o Projeto ~160, `platform/copy-sql.ts` ~180, a porta em `hub/connectors` ~90, a remoção e o reparo
~50). U3: ~720 (permissão ~35, contrato e falhas ~280, rotas ~170, relógio ~160, ligações ~45,
documentos ~30). U4: ~820 (rotas ~70, lista ~230, detalhe ~190, Ligar ~150, intervalo ~60, consultas
e textos ~110, faixa ~10). U5: ~540 (Integrações ~160, Dados ~150, servidor e contrato ~190,
consultas ~40). Total da capacidade: ~3.680 linhas, abaixo do orçamento de [delivery
L2](../guides/delivery.md). Se a P1 mostrar que os modelos pedem mais, o modelo de itens de venda é
o primeiro a ficar para depois, e o cartão volta ao fundador ([delivery L7](../guides/delivery.md)).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | P1 | O registro 0063 traz, do Sankhya do fundador, só números e nomes de coluna: o dialeto, a presença de `DTALTER` nas cinco tabelas, a contagem de cada modelo e da janela de 30 dias, a forma de uma data e de um decimal inventados pela consulta, e o tamanho em bytes de uma página de 500 linhas; nenhum valor de linha | leitura do registro pelo revisor | must |
| 2 | U1 | `defineConnector` recusa um `copy` cuja leitura não é `read`, cujo id repete outra operação, cujo modelo repete um id, ou cuja definição a `CopyDefinition` recusa; aceita o Sankhya com os cinco modelos | `packages/connectors/src/kernel/copy.test.ts`, "o kit recusa uma cópia mal declarada" | must |
| 3 | U1 | A `CopyDefinition` recusa uma chave fora das colunas, uma chave que não é `bigint` (limite da versão 1), uma janela ou uma coluna de alteração (`changedSince`) fora das colunas ou que não é `date` nem `timestamp`, um nome de coluna fora de `^[A-Za-z_][A-Za-z0-9_]{0,59}$` e mais de 100 colunas; aceita nomes em minúsculas, como os de uma fonte MySQL ou PostgreSQL | `kernel/copy.test.ts`, "a definição" | must |
| 4 | U1 | A leitura em páginas do Sankhya, contra o dublê, devolve as linhas na ordem da chave, 500 por página, com `more` verdadeiro enquanto há mais; a página seguinte, a partir da última chave (composta também), traz cada linha uma vez; o filtro de datas é da leitura e não da consulta guardada: com `changedSince` e janela ela lê `(<alteração> >= since) OR (<janela> >= windowFrom)`, só com `changedSince` a primeira metade, sem `changedSince` a fonte inteira, cada data no literal que a P1 mediu; cada célula chega como o texto canônico do tipo da coluna (data `AAAA-MM-DD`, carimbo ISO, decimal com ponto, `true`/`false`) ou `null` | `packages/connectors/src/sankhya/copy-read.test.ts`, "páginas pela chave" e "datas e células" | must |
| 5 | U1 | Uma recusa gravada do Sankhya (T29) chega pela leitura em páginas como `REFUSED` com o corpo inteiro, como nas outras leituras; uma consulta que o filtro de leitura do Sankhya recusa volta recusada pela leitura, sem chamar o Sankhya | `copy-read.test.ts`, "a recusa gravada" e "o filtro de leitura" | must |
| 6 | U1 | Cada um dos cinco modelos lê contra o dublê pela leitura em páginas e devolve as colunas que declara | `copy-read.test.ts`, "os cinco modelos" | must |
| 7 | U2 | Ligar uma cópia grava a linha com a definição igual à do modelo, cria no banco da empresa o esquema `sync`, o login `conexus_sync` e a tabela `sync.<nome>` com as colunas tipadas, a chave primária e a coluna `_pass`; repetir a chamada com a mesma chave de tentativa não cria nada a mais; a mesma chave com outro corpo responde 409 `IDEMPOTENCY_CONFLICT` | `apps/server/src/hub/copies/enable.test.ts`, "ligar: a linha, o esquema e a tabela" | must |
| 8 | U2 | Ligar responde 409 `COPY_EXISTS` quando a empresa já tem uma cópia com o nome do modelo; 422 `COPY_MODEL_UNKNOWN` para um modelo que o conector da conexão não tem; 409 `COPY_CONNECTION_NOT_READY` para uma conexão que não está `ACTIVE`; 404 `NOT_FOUND` para uma conexão de outra empresa (S10) | `enable.test.ts`, "ligar: as recusas" | must |
| 9 | U2 | Com o banco da empresa sem resposta, ligar responde 503 `COPY_DATABASE_UNAVAILABLE`, a linha fica e a chave de tentativa vale; a mesma chamada, com o banco de volta, termina o que faltou e responde 201 | `enable.test.ts`, "ligar: o banco da empresa cai no meio" | must |
| 10 | U2 | Uma rodada lê todas as páginas, grava cada uma por chave (repetir uma página não duplica nem muda o resultado), fecha `COMPLETE` com as páginas, lidas e gravadas, guarda a contagem de linhas da tabela e avança a marca para a hora em que a passada começou | `apps/server/src/hub/copies/run.test.ts`, "a passada completa" | must |
| 11 | U2 | Duas rodadas da mesma cópia ao mesmo tempo: uma lê, a outra termina sem ler nada e sem linha nova de rodada | `run.test.ts`, "uma rodada por vez" | must |
| 12 | U2 | Uma rodada que acha a trava vencida e uma rodada aberta fecha essa como `INTERRUPTED` e continua da posição salva, sem reler as páginas já gravadas | `run.test.ts`, "a rodada órfã" | must |
| 13 | U2 | Uma rodada que perdeu a trava (outra a tomou com a senha dela) para antes da página seguinte e não grava posição, marca nem fechamento | `run.test.ts`, "a trava perdida" | must |
| 14 | U2 | Passadas 200 páginas ou 10 minutos (o teto injetado no teste), a rodada fecha `PARTIAL` com o motivo `CAP`, guarda a posição, não avança a marca, não apaga nada e pede outra rodada ao relógio; a seguinte termina a passada | `run.test.ts`, "o teto" | must |
| 15 | U2 | Numa passada completa sai da tabela o que está dentro da janela e não veio; numa passada parcial ou com erro nada sai; fora da janela nada sai nunca | `run.test.ts`, "a janela apaga o que sumiu" | must |
| 16 | U2 | Uma leitura recusada fecha `ERROR` com o código (`COPY_SOURCE_REFUSED`, `COPY_SOURCE_NEEDS_REAUTH`, `COPY_SOURCE_UNREACHABLE`, `COPY_SOURCE_UNREADABLE`), nunca "0 linhas"; o banco da empresa sem resposta fecha `ERROR` `COPY_DATABASE_UNAVAILABLE`; em nenhum dos dois a marca avança ou algo sai | `run.test.ts`, "o erro não vira vazio" | must |
| 17 | U2 | Com o Hub atualizando, a rodada para antes da página seguinte e fecha `PARTIAL` com o motivo `STOPPED` | `run.test.ts`, "o Hub vai desligar" | must |
| 18 | U2 | A leitura da cópia passa pela fila da conexão: uma leitura de um app que chega no meio de uma rodada espera no máximo uma página; a leitura fala como a versão declarada (`lerPagina` naquela conexão) e não como um papel | `apps/server/src/hub/connectors/copy-port.test.ts`, "a cópia toma a vez da conexão página a página" | must |
| 19 | U2 | Liberar grava a liberação e dá `SELECT` na tabela aos logins de execução e de leitura do app; o login de execução recebe recusa ao escrever na cópia; tirar faz o `REVOKE` antes de apagar a linha, e o login de leitura do app passa a receber recusa | `apps/server/src/hub/copies/grants.test.ts`, "liberar e tirar" | must |
| 20 | U2 | Liberar a um Projeto sem app cria o esquema e os logins dele pelo dono de hoje (`hub/apps`, `openAppDatabase` com `databaseReady: false`) e dá o `GRANT`; o login de leitura do Projeto lê a cópia; o primeiro envio do app depois acha os logins e não os recria. Com o banco da empresa sem resposta nesse passo, 503 `COPY_DATABASE_UNAVAILABLE`, a linha fica e repetir termina | `grants.test.ts`, "liberar a um Projeto sem app" | must |
| 21 | U2 | Apagar um Projeto com uma cópia liberada apaga o Projeto, os logins do app e a liberação; a cópia continua para os outros Projetos | `grants.test.ts`, "apagar o Projeto com a cópia liberada" | must |
| 22 | U2 | O registro de cada rodada e de cada ato leva só ids, contagens, códigos e milissegundos (`COPY_RUN_ENDED`, `COPY_ENABLED`, `COPY_GRANTED`), nunca a consulta, um nome de coluna lido nem uma linha (S41) | `run.test.ts`, "o registro não leva dado" | must |
| 23 | U3 | As rotas de `copies.ts` respondem ao dono, ao administrador e ao desenvolvedor; ao membro, a um papel próprio da empresa e a quem é de outra empresa, 404 `NOT_FOUND`, igual a uma cópia que não existe (S10) | `apps/server/src/hub/copies/routes.test.ts`, "cópias: quem vê e quem recebe não encontrado" | must |
| 24 | U3 | `getCompany` responde `may.manageCopies` verdadeiro para dono, administrador e desenvolvedor, falso para membro e papel próprio | `apps/server/src/hub/identity/developer.test.ts`, o caso de `may` | must |
| 25 | U3 | A lista traz cada cópia com a conexão, o dado, a agenda (`ACTIVE` com o próximo horário, `PAUSED` ou `MISSING`), a rodada aberta ou a última, as linhas, o intervalo, os Projetos e o que é copiado (a consulta, a chave, a janela); as rodadas vêm 20 por página, da mais nova, com a ficha | `routes.test.ts`, "a lista e as rodadas" | must |
| 26 | U3 | Pausar, retomar e mudar o intervalo respondem 200 com a cópia na agenda nova; repetir dá o mesmo resultado; o intervalo fora da lista é recusado pela entrada (400 `REQUEST_MALFORMED`); mudar o intervalo de uma pausada a mantém pausada; retomar uma `MISSING` cria a agenda com o intervalo padrão (`COPY_INTERVAL_DEFAULT`, 30 minutos), e mudar o intervalo de uma `MISSING` a cria com o intervalo pedido; uma `MISSING` vem na lista com `interval: null` | `routes.test.ts`, "a agenda" | must |
| 27 | U3 | Rodar agora responde 202 e a rodada acontece pelo workflow; numa cópia rodando responde 409 `COPY_RUNNING`; com o Hub atualizando, 503 `HUB_UPDATING`. O teste injeta a volta do agendador e não espera o relógio de verdade (T20) | `apps/server/src/builder/copy-clock/clock.test.ts`, "rodar agora e o disparo" | must |
| 28 | U3 | O workflow da cópia tem `autoRestartActiveRuns: false`: um Hub que reinicia com uma rodada aberta não a recomeça, e a próxima rodada a fecha `INTERRUPTED` | `clock.test.ts`, "a órfã não recomeça sozinha" | must |
| 29 | U3 | Apagar a empresa apaga as agendas das cópias dela antes das linhas | `clock.test.ts`, "a empresa apagada leva as agendas" | must |
| 30 | U4 | A faixa mostra **Cópias** depois de Agentes para quem tem `may.manageCopies`, e não mostra para o membro; o membro que abre `…/copies` vê "não encontrado" | `apps/web/src/hub/copies/copy-list.test.tsx`, "Cópias: a faixa e quem não vê" | must |
| 31 | U4 | `…/copies` mostra cada cópia com fonte, dado, estado em palavras ("Em dia", "Rodando…", "Pausada", "Com erro", "Sem relógio"), última rodada, duração, linhas em português, intervalo e Projetos; sem cópias, a frase de primeira vez e **Ligar uma cópia** | `copy-list.test.tsx`, "Cópias: a lista" | must |
| 32 | U4 | **Ligar uma cópia** pede conexão, modelo e intervalo; dois cliques mandam um pedido só; 503 mantém a chave e o diálogo aberto com a frase; 409 `COPY_EXISTS` mostra a frase no formulário | `apps/web/src/hub/copies/new-copy.test.tsx`, "Ligar: um pedido, as recusas" | must |
| 33 | U4 | As ações da linha (**Rodar agora**, **Pausar** ou **Retomar**, **Intervalo**) chamam a rota e a linha mostra o estado novo; 409 `COPY_RUNNING` mostra a frase; enquanto houver rodada aberta a lista se atualiza sozinha | `copy-list.test.tsx`, "Cópias: as ações" | must |
| 34 | U4 | `…/copies/$copyId` mostra o que é copiado (a consulta em mono, a chave, a janela) e as rodadas com quando, duração, lidas, gravadas e o resultado em palavras; **Ver mais** e **Primeira página**; uma cópia que não existe mostra "não encontrado" | `apps/web/src/hub/copies/copy-detail.test.tsx`, "a cópia e as rodadas" | must |
| 35 | U4 | A 390 px, a lista vira linhas que quebram como a de agentes, e a página não rola de lado (V18) | `copy-list.test.tsx`, "no celular"; captura de QA a 390 px | must |
| 36 | U4 | As duas rotas novas estão em `PAGES`, e o Hub abre a página das telas nelas | o teste da web que confere o roteador contra `PAGES` | must |
| 37 | U5 | Em Integrações do Projeto, a seção **Cópias** lista as cópias da empresa com **Liberar** ou **Tirar** para quem tem `may.manageCopies`; para os outros, só a lista e quem pode liberar (V29) | `apps/web/src/hub/projects/project-copies.test.tsx`, "liberar e tirar" | must |
| 38 | U5 | `GET …/projects/{p}/tables` traz também as cópias liberadas, com `schema: 'COPY'`, e nunca uma cópia não liberada; um Projeto sem app com cópia liberada responde `NO_APP` com `copies` (as liberadas), e sem liberação `NO_APP` com `copies` vazio | `apps/server/src/hub/apps/copy-data.test.ts`, "Dados: as cópias liberadas" | must |
| 39 | U5 | `GET …/projects/{p}/copy-tables/{table}/rows` lê as linhas de uma cópia liberada pelo mesmo caminho das tabelas do app (50 por página, célula cortada, a ficha); uma cópia não liberada ou que não existe responde 404 `NOT_FOUND` | `copy-data.test.ts`, "Dados: as linhas de uma cópia" | must |
| 40 | U5 | A página Dados separa **Tabelas do app** de **Cópias liberadas**; uma cópia abre em `…/data/copies/$table` com as linhas | `apps/web/src/hub/apps/data.test.tsx`, "Dados: as cópias liberadas" | must |
| 41 | U4, U5 | QA percorre o roteiro de uso nos dois temas, a 1366 e a 390 px | relatório de QA ([testing T25](../guides/testing.md)) | should |
| 42 | U2 | Numa passada completa, uma linha dentro da janela que não mudou desde a marca continua na cópia, e uma que sumiu da fonte sai; com os modelos `vendas` e `itens_venda` contra o dublê, na segunda passada | `run.test.ts`, "a janela relê o que não mudou" | must |
| 43 | U5 | A página Dados de um Projeto sem app com cópia liberada mostra a frase da Capacidade 1 em **Tabelas do app** e, abaixo, **Cópias liberadas** com as cópias, cada uma abrindo as suas linhas | `data.test.tsx`, "Dados: Projeto sem app com cópia liberada" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Cópias, a lista (`…/copies`) | Nenhuma cópia: título **Cópias**, a frase "Copie um dado de uma conexão para o banco da empresa e libere aos Projetos que usam." e **Ligar uma cópia** (`Empty`) | O mesmo da primeira vez | A moldura fica; esqueleto no conteúdo (`Loading`, W34) | Falha de leitura: a frase da linha e **Tentar de novo** (`RouteReadFailure`); uma cópia com erro: "Com erro" na linha e a frase da última rodada | Empresa de outro: `NotFound` | Membro ou papel próprio: sem a entrada na faixa; o endereço dá `NotFound` (W34, S10) | Uma conexão que pede nova ligação: a rodada fecha `COPY_SOURCE_NEEDS_REAUTH` e a linha mostra "Com erro" com a frase dela |
| Ligar uma cópia (o diálogo) | Sem conexão que tenha modelo: a frase "Ligue em Integrações uma conexão que ofereça cópias." com o link para Integrações | — | O botão **Ligar** ocupado, um pedido só (W24) | 503: a frase e o botão de novo, com a mesma chave; 409 `COPY_EXISTS` e `COPY_CONNECTION_NOT_READY`: a frase no formulário | — | Não abre: só quem vê a página a abre | 422 `COPY_MODEL_UNKNOWN`: a frase no formulário |
| Uma cópia (`…/copies/$copyId`) | Nenhuma rodada ainda: o que é copiado e "A primeira rodada ainda não terminou." | — | A moldura fica; esqueleto no conteúdo | Falha de leitura: a frase e **Tentar de novo** | Cópia que não existe ou de outra empresa: `NotFound` | Igual à lista | — |
| Integrações do Projeto, a seção Cópias | Nenhuma cópia na empresa: "A empresa ainda não tem cópias." com o link para Cópias, só para quem tem `may.manageCopies` | O mesmo | Esqueleto só na seção | 503 ao liberar ou tirar: a frase e o botão de novo | — | Sem `may.manageCopies`: a lista sem os botões e "Dono, administrador ou desenvolvedor libera uma cópia." (V29) | — |
| Dados, a lista (Capacidade 1) | Como na Capacidade 1; Projeto sem app com cópia liberada: a frase da Capacidade 1 em **Tabelas do app** e, abaixo, **Cópias liberadas** com as cópias | Projeto sem cópia liberada: a seção **Cópias liberadas** não aparece | Como na Capacidade 1 | Como na Capacidade 1 | Como na Capacidade 1 | Como na Capacidade 1 | não se aplica: só leitura |
| Dados, as linhas de uma cópia (`…/data/copies/$table`) | não se aplica: só se chega pela lista | Cópia sem linhas ainda: as colunas e "Esta cópia ainda não tem linhas." | Como na Capacidade 1 | Como na Capacidade 1 | Cópia não liberada ou que não existe: `NotFound` na área das linhas | Como na Capacidade 1 | não se aplica: só leitura |

As frases entre aspas são a proposta do cartão; o fundador aprova os textos das telas no fim
([delivery L23](../guides/delivery.md)).

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `CompanyMay.manageCopies` | U3, `hub/identity/companies.ts` por `allows(role, 'manageCopies')` | U4, a faixa (`route.tsx`); U5, a seção de Integrações |
| `CopySummary.id`, `name`, `label` | U2, a linha da cópia (o nome e o rótulo vêm da origem; hoje, o modelo) | U4, a linha e o link do detalhe |
| `CopySummary.connection` (`id`, `name`, `connector`) | U2, da conexão | U4, a coluna Fonte |
| `CopySummary.interval` (`null` em `MISSING`) | U3, da agenda (`metadata.interval`) | U4, a coluna Intervalo ("—" em `MISSING`) e o diálogo Intervalo |
| `CopySummary.schedule` (`ACTIVE`, `PAUSED`, `MISSING`) | U3, `CopyClock.states` | U4, o estado em palavras e Pausar ou Retomar |
| `CopySummary.run` (`null` ou `CopyRun`) | U2, a rodada aberta ou a última, pela linha da cópia | U4, Última rodada, Duração, o estado "Rodando…" ou "Com erro", e o `refetchInterval` |
| `CopySummary.rows` (`null` ou número) | U2, a contagem da última passada completa | U4, a coluna Linhas |
| `CopySummary.projects` | U2, as liberações | U4, a coluna Projetos |
| `CopySummary.shown` (`query`, `key`, `window`) | U2, da definição | U4, o detalhe ("o que é copiado") |
| `CopyRun.outcome` (`RUNNING`, `COMPLETE`, `PARTIAL`, `ERROR`, `INTERRUPTED`) | U2, a rodada | U4, o resultado em palavras |
| `CopyRun.startedAt`, `endedAt`, `read`, `written` | U2, a rodada | U4, quando, duração, lidas, gravadas |
| `listCopyRuns` → `next` | U2, `pageOf` | U4, `Pager` |
| `CopyModelSummary` (`connector`, `id`, `label`) | U3, dos modelos do kit pela porta | U4, o diálogo Ligar |
| `ProjectCopy.granted` | U2, a liberação | U5, Liberar ou Tirar |
| `AppTableSummary.schema` (`APP`, `COPY`) | U5, `hub/apps/app-tables.ts` | U5, a separação das duas seções em Dados |
| `listAppTables` → `NO_APP.copies` | U5, `hub/apps/app-tables.ts`, as cópias liberadas de um Projeto sem app | U5, **Cópias liberadas** abaixo da frase de Projeto sem app |

`CopyRun.pages` fica no servidor e no registro, não no contrato: nenhuma tela lê.

**O desenho de caixas.** O produto antigo não tinha Sync (estudo, `conexus-os@e0353c36`, busca vazia
nos `.ts`), então não há captura dele a seguir. As telas de Nango, Airbyte e do Studio do Mastra não
foram capturadas: pedem servidores próprios ou a CLI `mastra`, que o Conexus não instala (estudo,
§5). O modelo é o próprio Hub: a lista de agentes da Início (`apps/web/src/builder/agents/agent-list.tsx`),
a página de Automações e o seu histórico (`apps/web/src/builder/automations/page.tsx`, `runs.tsx`), e
a página Dados da Capacidade 1. O `critique` do Impeccable fica para a QA e a revisão da etapa, sobre
a tela construída ([Impeccable](../reference/impeccable.md)); o `shape` não rodou, porque o desenho
já tem a palavra do fundador e nenhuma pergunta nova vai a ele; o `onboard` fica coberto pela coluna
"Primeira vez" da matriz de estados.

```
1280 px, …/copies
┌ rail ┬ Início ────────────┬──────────────────────────────────────────────────────────────────────┐
│ ⌂    │ Nova conversa      │ Cópias                                         [ Ligar uma cópia ]   │
│ ▦    │ Conversas          │ Fonte    Dado     Estado      Última rodada Duração Linhas  Interv. Projetos │
│ ⚡   │                    │ Sankhya  Vendas   Em dia      hoje 14:30    42 s    118.402 30 min  Vendedores ⋮│
│ ⏲    │                    │ Sankhya  Clientes Rodando…    hoje 14:31    —       9.871   1 h     Vendedores ⋮│
│ 🤖   │                    │ Sankhya  Produtos Pausada     ontem 18:00   12 s    14.203  6 h     —          ⋮│
│ ⇄ ◀  │                    │                                                                      │
└──────┴────────────────────┴──────────────────────────────────────────────────────────────────────┘
  ⋮ = Rodar agora · Pausar | Retomar · Intervalo

1280 px, …/copies/<vendas>
│ ‹ Cópias                                                                                         │
│ Vendas · Sankhya · Em dia · a cada 30 min                     [ Rodar agora ] [ ⋮ ]              │
│ O que é copiado                                                                                  │
│ ┌ consulta (mono) ─────────────────────────────────────────────┐ Chave  NUNOTA                   │
│ │ SELECT NUNOTA, CODPARC, … FROM TGFCAB WHERE …                 │ Janela DTNEG, 30 dias           │
│ └───────────────────────────────────────────────────────────────┘                                │
│ Rodadas                                                                                          │
│ Quando        Duração  Lidas  Gravadas  Resultado                                                │
│ hoje 14:30    42 s     1.204  1.204     Completa                                                 │
│ hoje 14:00    —        500    500       O Sankhya não respondeu                                  │
│ Primeira página   Ver mais                                                                       │
```

```
390 px, …/copies                       390 px, …/copies/<vendas>
┌──────────────────────────┐          ┌──────────────────────────┐
│ ☰  Cópias  [Ligar]       │          │ ☰  ‹ Cópias              │
│ Vendas · Sankhya       ⋮ │          │ Vendas · Em dia          │
│ Em dia · hoje 14:30      │          │ [Rodar agora]   [⋮]      │
│ 118.402 linhas · 30 min  │          │ O que é copiado          │
│ Vendedores               │          │ ┌ SELECT NUNOTA… → ┐      │
│ Clientes · Sankhya     ⋮ │          │ └ (rola dentro)    ┘      │
│ Rodando… · hoje 14:31    │          │ Chave NUNOTA             │
│ 9.871 linhas · 1 h       │          │ hoje 14:30 · 42 s        │
└──────────────────────────┘          │ 1.204 lidas · Completa   │
                                      └──────────────────────────┘

1280 px, Integrações do Projeto           1280 px, Dados do Projeto (Capacidade 1)
│ Conexões   (como hoje)        │       │ ┌ Tabelas do app ─┐ ┌ vendas ───────────────┐ │
│ Cópias                        │       │ │ anotacoes    37 │ │ NUNOTA │ CODPARC │ …   │ │
│ Vendas    Sankhya   [ Tirar ] │       │ │ Cópias liberadas│ │ 1      │ 10      │ …   │ │
│ Clientes  Sankhya   [Liberar] │       │ │▌vendas  118.402 │ │ Primeira página Ver mais│ │
│ Produtos  Sankhya   [Liberar] │       │ │ clientes  9.871 │ └───────────────────────┘ │
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Ligar (`enableCopy`): a linha no Hub, depois o login, o esquema e a tabela no banco da empresa, depois a agenda | A chave de tentativa decide: a segunda acha a linha e termina o que falta, sem segunda linha; dois corpos diferentes, `IDEMPOTENCY_CONFLICT`; duas chaves com o mesmo modelo, a segunda `COPY_EXISTS` pela chave única `(company_id, name)` | Cada passo depois da linha é repetível (`CREATE … IF NOT EXISTS`, `missingLogins`, a agenda achada por id): a mesma chave retoma do passo que faltou | O banco da empresa ou o Neon sem resposta: 503 `COPY_DATABASE_UNAVAILABLE`, a chave fica; o banco do Mastra sem resposta: 503 `DATABASE_UNAVAILABLE`, a chave fica | `COPY_ENABLED` com ids; `COPY_ENABLE_FAILED` com o código e o passo | 7, 8, 9, 32 |
| A rodada: pegar a trava e fechar a órfã, gravar cada página no banco da empresa, salvar a posição no Hub, fechar | A trava com a senha: a segunda não pega e termina sem linha | Entre a página gravada na empresa e a posição salva no Hub, a página é relida na próxima rodada, e a gravação por chave não duplica; entre renovar e travar o processo, outra rodada pode gravar uma página a mais na empresa, que a passada seguinte relê (aceito) | O Sankhya: `ERROR` com o código da leitura; o banco da empresa: `ERROR` `COPY_DATABASE_UNAVAILABLE`; o banco do Hub: a rodada para e a trava vence sozinha | `COPY_RUN_ENDED` com ids, resultado, páginas, lidas, gravadas, ms; `COPY_CLAIM_LOST` | 10 a 18, 22, 28 |
| Fechar uma passada completa: apagar da janela, contar, avançar a marca | Só a dona da trava fecha (`WHERE claim_token = $senha`) | O `DELETE` e a contagem são uma transação na empresa; se a marca não avança no Hub, a próxima passada relê tudo desde a marca antiga e apaga de novo o que não veio (o mesmo resultado) | Como a rodada | `COPY_RUN_ENDED` | 10, 15 |
| Pausar, retomar, mudar o intervalo (a agenda do Mastra) | O Mastra grava a linha da agenda; repetir dá o mesmo estado | Uma chamada só ao Mastra | O banco do Mastra sem resposta: 503 `DATABASE_UNAVAILABLE` | `COPY_PAUSED`, `COPY_RESUMED`, `COPY_INTERVAL_CHANGED` | 26 |
| Rodar agora (`schedules.run`) | A trava decide na rodada: a segunda termina sem ler; a rota responde `COPY_RUNNING` quando a trava está viva | Publicado ou não: o Mastra tenta três vezes e chama `onError`, ligado ao registro | O banco do Mastra: 503 `DATABASE_UNAVAILABLE` | `COPY_RUN_REQUESTED`; `SCHEDULE_PUBLISH_FAILED` pelo `onError` | 27 |
| Liberar: a linha, depois o banco do Projeto (o esquema e os logins pelo dono de hoje, `hub/apps` `openAppDatabase` com `databaseReady: false`, quando o Projeto ainda não tem app), depois o `GRANT` | `ON CONFLICT DO NOTHING` na linha; `ensureApp` acha os logins que existem (`missingLogins`) e o esquema por `IF NOT EXISTS`; o `GRANT` é repetível | A linha fica sem o banco do Projeto ou sem o `GRANT`: repetir liberar refaz do passo que faltou; o reparo do primeiro envio do app (`applyGrants` depois de `ensureApp`) também | O banco da empresa ou o Neon: 503 `COPY_DATABASE_UNAVAILABLE`, a linha fica e o botão continua **Liberar** até o `GRANT` | `APP_DATABASE_READY` (de `hub/apps`); `COPY_GRANTED` | 19, 20, 37 |
| Tirar: o `REVOKE`, depois a linha | O `REVOKE` é repetível; a linha sai uma vez | O `REVOKE` feito e a linha não apagada: repetir tira de novo | O banco da empresa: 503, a linha fica e o botão continua **Tirar** | `COPY_REVOKED` | 19, 37 |
| Apagar um Projeto (herdado, `hub/apps/removal.ts`), agora com o `REVOKE` das cópias antes do `DROP ROLE` | Como hoje | O `REVOKE` é repetível; a remoção de hoje já retoma do passo que faltou | Como hoje | `COPY_REVOKED` com o Projeto | 21 |
| Apagar a empresa (herdado), com as agendas das cópias em `releaseFirst` | Como hoje | A agenda apagada é achada ausente na repetição | Como hoje | Como hoje | 29 |
| Criar o login `conexus_sync` e o esquema `sync` (uma vez por empresa) | `missingLogins` acha o que existe; o segundo `CREATE ROLE` recebe `42710` e lê de novo, como `ensureReadLogin` | Uma transação só, tudo ou nada | O dono não responde: `COPY_DATABASE_UNAVAILABLE` | `COPY_DATABASE_READY` | 7, 9 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A fonte é uma conexão da empresa | U2 | `apps/server/src/hub/connectors/tables.ts:33` `connection`; `packages/connectors/src/sankhya/definition.ts:78` `perProject: 'one'` | `nango@e6c6131` `packages/types/lib/sync/api.ts:12-27` (sync por conexão); `tooljet@aa67409` `UBIQUITOUS_LANGUAGE.md:101` "Global Data Source" | A cópia pertence à conexão; todos os consumidores leem dela | nativo: a conexão já existe (decisões 0056, 0057), a linha da cópia tem chave estrangeira para ela | | 2026-11-09: "da empresa faz mais sentido" | — |
| A definição é dado da empresa; o conector dá a leitura em páginas e os modelos | U1, U2 | `packages/connectors/src/kernel/definition.ts:53-54` (`operations` "the same for every company", `readDoor` "for what each company has of its own"); `sankhya/skill/SKILL.md:8`; `hub/connectors/tables.ts:57-59` (`notes`, o que se provou de cada empresa) | `nango@e6c6131` `packages/runner-sdk/lib/scripts.ts:64-145` (o roteiro de quem usa leva consulta, cursor e chave); `airbyte@8aed3123` `docs/platform/understanding-airbyte/airbyte-protocol.md:433-435,488-493` (o conector oferece, o usuário escolhe cursor e chave); `tooljet@aa67409` `server/src/entities/data_query.entity.ts:21-36`; `conexus-os@e0353c36` `docs/research/mitra/influence-on-conexus.md:969` (`DataLoader {query, tableName}`); `ml-vigia@0c0749f1` `ARCHITECTURE.md:205-209` | Nenhuma põe a definição dentro do conector: Nango copia um modelo do catálogo, Airbyte guarda a escolha do usuário por conexão | embrulhado: o tipo `CopyDefinition` no kit, uma linha por cópia com a definição em `jsonb`, o modelo copiado para ela ao ligar. O nosso acrescenta a forma da definição e a conferência dela a cada rodada | | 2026-11-09: "O Sankhya é o primeiro conector ... mas não é a base do Conexus"; "1. Aprovo Capacidade 2" | `packages/connectors/src/kernel/copy.ts`; `packages/connectors/src/sankhya/copies.ts` |
| A leitura em páginas | U1, U2 | `hub/connectors/read.ts:139-206` `readThrough`; `limits.ts:17-27` `inTurn`, uma chamada por conexão (0058); `sankhya/search-sql.ts:84-90` `pageSql`; `sankhya/door.ts:120-122` `queryRequest` | `conexus-os@e0353c36` `docs/research/mitra/influence-on-conexus.md:1308` (DbExplorer em páginas, abaixo do teto de 5.000); `ml-vigia@0c0749f1` `app/sincronizacao/recursos.py:157-160` | Consulta fixa ordenada pela chave, uma página por chamada | nativo: o nosso executor, a fila da conexão e a forma de página das buscas; a operação `lerPagina` em `Connector.copy`, fora de `operations` e da porta | | não precisa | `packages/connectors/src/sankhya/copy-read.ts`; `apps/server/src/hub/connectors/copy-port.ts` |
| Quem fala na leitura da cópia | U2 | `hub/identity/may-use.ts:22-27` `Speaker` `VERSION`; `:81-85` `declares` | `@mastra/core@1.82.0` não tem falante; `mastra-1.82@6e8dfcb8` `mastracode/factory/src/environment/build.ts:176` (o motor como função comum com dependências) | O Factory roda o trabalho agendado com as dependências que o montaram | nativo: `{ kind: 'VERSION', declared: [{ connectionId, operation: 'lerPagina' }] }`, conferido pelo `declares` de hoje; `ReadBy` ganha `'copy'` | | não precisa | — |
| O relógio de cada cópia | U3 | `builder/automations/automations.ts:162-180` uma agenda por automação; `builder/mastra/hub-mastra.ts:100-103` `startWorkers` | `@mastra/core@1.82.0` `dist/docs/references/reference-schedules-overview.md:55-209`; `mastra-1.82@6e8dfcb8` `mastracode/factory/src/environment/build-schedule.ts:1-6` ("one row per project ... the scheduler owns firing") | Uma agenda por item, `cron` e `timezone`; o motor só cria, pausa, retoma e lê a linha | nativo: `mastra.schedules.create` com `id` = o id da cópia, `workflowId: 'conexus-copy-run'`, `timezone: 'America/Sao_Paulo'` | | "a agenda do Mastra, gatilho de toda automação", roteiro | `apps/server/src/builder/copy-clock/clock.ts` |
| Pausar, retomar, rodar agora, mudar o intervalo | U3 | `builder/automations/automations.ts:220-232` (`resume`, `run`) | `@mastra/core@1.82.0` `reference-schedules-overview.md:160-201` | Estudo, prova P1: `pause` durável; `resume` recalcula do agora, sem atrasados; `update({ cron })` mantém a pausa; `run` dispara sem mudar a cadência | nativo | | "você a pausa, roda ou muda o intervalo", roteiro; 2026-11-09: mínimo 15 minutos | — |
| Uma rodada por cópia de cada vez | U2 | nenhum para cópia; trava com prazo já existe em `hub/apps/tables.ts:107` `claimedUntil` | `mastra-1.82@6e8dfcb8` `mastracode/factory/src/environment/build.ts:139-216` (`token = randomUUID()`, prazo de 10 min renovado, grava o resultado "while this run still holds it"); `nango@e6c6131` `packages/orchestrator/lib/clients/client.ts:256-262` | Trava com prazo na linha do item; quem acha a trava viva pula | remendo: `claim_token` e `claimed_until` na linha da cópia; posição, marca e fechamento só com `WHERE claim_token = $senha` | Estudo, prova P1 com `@mastra/core` 1.82.0: quatro rodadas da mesma agenda ao mesmo tempo (`scheduler-Me4rCjO2.js:340-372` não olha a rodada anterior); D25 proíbe trava de sessão | 2026-11-09: "1. Aprovo Capacidade 2" | `apps/server/src/hub/copies/run.ts` |
| A rodada órfã (o Hub caiu no meio) | U2, U3 | o Conexus não configura `recovery` em `builder/mastra/mastra.ts` | `@mastra/core@1.82.0` `dist/docs/references/reference-workflows-workflow.md:128` (`autoRestartActiveRuns`), `reference-core-mastra-class.md:138-142` (padrão `'auto'`), `docs-workflows-overview.md:503` ("The lease is advisory and doesn't fence writes"); `ml-vigia@0c0749f1` `app/sincronizacao/execucao.py:678-692` | O Mastra reinicia a rodada ativa no boot sem cerca de escrita; o ML-VIGIA fecha a órfã como parcial sem avançar o cursor | embrulhado: `autoRestartActiveRuns: false` no workflow da cópia; a próxima rodada que acha a trava vencida fecha a órfã `INTERRUPTED` e continua da posição salva | | não precisa | — |
| Até onde leu: posição por página, marca só na passada completa | U2 | nenhum | `ml-vigia@0c0749f1` `app/sincronizacao/execucao.py:289` (`promover = estado == "SUCESSO" and completa`), `:485-492` (`checkpoint_cursor`), `recursos.py:164-167` (desde um dia antes do início da última passada completa); `nango@e6c6131` `docs/guides/functions/syncs/checkpoints.mdx:26-36` | Duas coisas: a posição dentro da passada, salva a cada página, e a marca da última passada completa, só no fim; a releitura começa um dia antes do início da última passada completa | remendo: `position` (a última chave gravada) e `watermark` (a hora em que a última passada completa começou) na linha da cópia; a leitura em páginas monta o filtro `(<alteração> >= marca − 1 dia) OR (<janela> >= início da passada − dias)` a partir de `changedSince` e `window`, e a consulta guardada não leva filtro de data: toda linha da janela vem em toda passada, mudada ou não, e só a que sumiu deixa de vir; o motor nunca compara uma data vinda do ERP | Nenhuma biblioteca instalada guarda o cursor de uma fonte de fora entre rodadas: o estado de um workflow de `@mastra/core` 1.82.0 vive dentro de uma rodada (`dist/docs/docs-workflows-workflow-state.md`) | 2026-11-09: "1. Aprovo Capacidade 2" | `apps/server/src/hub/copies/run.ts` |
| Teto de páginas e de tempo por rodada | U2 | nenhum | `ml-vigia@0c0749f1` `recursos.py:157-160` (`PAGINAS_MAX_ERP = 200`), `execucao.py:150-154,328-333` (prazo conferido antes de cada página); `nango@e6c6131` `checkpoints.mdx:26-36` | O teto fecha parcial sem avançar a marca; a próxima continua | remendo: 200 páginas ou 10 minutos, conferidos antes de cada página; parcial por teto pede outra rodada ao relógio | Como a linha anterior: nada em `@mastra/core` 1.82.0 limita um passo por páginas lidas | 2026-11-09: "1. Aprovo Capacidade 2" | `apps/server/src/hub/copies/run.ts` |
| O que foi apagado na fonte | U2 | nenhum | `nango@e6c6131` `docs/guides/functions/syncs/deletion-detection.mdx:82-84` (`trackDeletesStart/End`); `ml-vigia@0c0749f1` `ARCHITECTURE.md:215` ("Ausência em coleta parcial não remove"), `recursos.py:173` (`JANELA_DE_RELEITURA = timedelta(days=30)`); `conexus-os@e0353c36` `influence-on-conexus.md:1316` (Mitra: "Zero DELETE") | As referências divergem: Nango apaga o ausente numa passada completa, Mitra nunca apaga | remendo: cada linha gravada leva `_pass`; no fim de uma passada completa, `DELETE … WHERE <janela> >= $de AND _pass <> $esta`, seguro porque a leitura trouxe a janela inteira (a linha anterior); parcial ou erro nunca apaga; fora da janela nunca apaga | Como a linha da posição: nenhuma peça de `@mastra/core` 1.82.0 nem de `@neondatabase/serverless` 1.2.0 sabe o que uma fonte de fora apagou | 2026-11-09: "1. Aprovo Capacidade 2" | `apps/server/src/platform/copy-sql.ts` |
| O registro de cada rodada | U2 | `builder/automations/run.ts:157-166` lê os gatilhos do Mastra e diz que um disparo manual não tem linha | `@mastra/core@1.82.0` `dist/docs/docs-workflows-scheduled-workflows.md:117-125` ("can leave no trigger row", `:119`); `ml-vigia@0c0749f1` `001_base.sql:19-35` (`sync_execucao`) e `app/sistema/consultas.py:488-500` (o `DISTINCT ON` sobre a tabela que só cresce) | O Mastra guarda disparos, não rodadas pedidas na hora; o ML-VIGIA guarda cada execução com início, fim, estado, lidos e gravados | remendo: a tabela `copies.copy_run`, a última rodada na linha da cópia (`last_run_id`), as 100 mais novas de cada cópia guardadas | Estudo, prova P1 com `@mastra/core` 1.82.0: o `run()` manual não gerou gatilho | 2026-11-09: "onde que ele está rodando, tipo, quanto tempo" | `apps/server/src/hub/copies/tables.ts` |
| Onde a cópia mora e quem escreve | U2 | o banco da empresa e os logins por SQL do dono (`platform/company-postgres.ts:184-194` `ensureApp`, decisão 0043); `platform/app-read.ts:28-35` `readAddress`, sem chamar o Neon; `platform/migration-outcome.ts` copia toda tabela do esquema do app | `conexus-os@e0353c36` `influence-on-conexus.md:969` (Mitra: a tabela local criada pela plataforma); `@neondatabase/serverless@1.2.0` `sql.transaction` | A cópia fica sob a plataforma, fora do espaço de cada app | embrulhado: um esquema `sync` por empresa, a tabela com o nome do modelo, dono o login `conexus_sync` com senha derivada (0043); cada página numa transação HTTP com `INSERT … SELECT … FROM jsonb_to_recordset($1) … ON CONFLICT (chave) DO UPDATE` | | 2026-11-09: "da empresa" | `apps/server/src/platform/copy-sql.ts` |
| A liberação a um Projeto | U2, U5 | `hub/connectors/tables.ts:172-201` `project_connection`; `hub/connectors/grants.ts`; `packages/hub-api/src/app-login.ts` (`app_<id>_run`, `_read`) | PostgreSQL 18 `GRANT SELECT` por tabela | A liberação é uma linha e o banco recusa o resto | embrulhado: a linha `copies.project_copy` e o `GRANT USAGE ON SCHEMA sync`/`GRANT SELECT ON sync.<t>` aos logins de execução e de leitura do app; tirar faz o `REVOKE` antes da linha | | "cada Projeto recebe a liberação do que usa", roteiro | `apps/server/src/hub/copies/grants.ts` |
| Apagar um Projeto com cópia liberada | U2 | `platform/company-postgres.ts:242-268` `dropApp` (`DROP ROLE` dos logins); `hub/apps/removal.ts:56-69` `dropAppDatabase` | PostgreSQL 18, `DROP ROLE` ("a role cannot be removed if it is still referenced in any database ... revoke any privileges the role has been granted on other objects") | O PostgreSQL recusa apagar um login com privilégio em outro objeto | nativo: `copies.revokeAllOf(projectId)` chamado por `removal.ts` antes de `dropAppDatabase` | | não precisa | — |
| Quem vê e quem mexe | U3 | `hub/identity/roles.ts:24-30` (`connection: ['manage']` só de dono e administrador), `:41-46` `BUILD`, `:98-103` o desenvolvedor; `admission.ts:96-99` `readAgents`/`manageAgents` | `better-auth@1.7.8` `createAccessControl`/`newRole` (uso em `roles.ts:67-109`) e `hasPermission` | O papel é a lista de permissões do plugin | nativo: `copy: ['manage']` em `BUILD` e em `createAccessControl`; as ações `readCopies` (sem trava) e `manageCopies` (com trava); um papel próprio cai em `member` (`admission.ts:142`) e não vê | | 2026-11-09: "Dono e o admnistrador e desenvolvedor" | — |
| A página Cópias | U4 | `apps/web/src/routes/_app/companies/$companyId/agents.index.tsx`, `automations.index.tsx`, `automations.$automationId.tsx`; `apps/web/src/builder/agents/agent-list.tsx` (a linha que quebra no celular); `apps/web/src/routes/_app/companies/$companyId/route.tsx:63-78` (a faixa) | `nango@e6c6131` `packages/types/lib/sync/api.ts:12-27` (`frequency`, `schedule_status`, `latest_sync`, `record_count`); `airbyte@8aed3123` `docs/platform/cloud/managing-airbyte-cloud/review-connection-status.md` (estados e últimas rodadas); `@mastra/core@1.82.0` `docs-workflows-scheduled-workflows.md:103-127` (Studio: lista com o próximo e o último; detalhe com Pause/Resume e histórico, atualizado a cada 5 s) | Uma linha por item com o estado, a última rodada e a próxima; o detalhe com o histórico | embrulhado: o estado e o próximo horário da agenda nativa; o nosso: a última rodada, as linhas, os Projetos e o que é copiado; `refetchInterval` do TanStack Query enquanto houver rodada aberta | | 2026-11-09: "uma tabela ... como a dos agentes"; "1. Aprovo Capacidade 2" | `apps/web/src/hub/copies/copy-list.tsx`, `copy-detail.tsx`, `new-copy.tsx`; `apps/web/src/routes/_app/companies/$companyId/copies.index.tsx`, `copies.$copyId.tsx` |
| Liberar em Integrações do Projeto | U5 | `apps/web/src/hub/projects/project-integrations.tsx` (a liberação das conexões) | — | — | nativo: uma seção ao lado da das conexões, com as peças de hoje | | 2026-11-09: "1. Aprovo Capacidade 2" | `apps/web/src/hub/projects/project-copies.tsx` |
| As cópias liberadas em Dados | U5 | Capacidade 1 em construção (pull request 928): `hub/apps/app-tables.ts` `TableSchema = 'APP'` e `SCHEMA_SQL: { APP: 'current_schema()' }`; o catálogo filtra por `has_table_privilege` | — | — | nativo: `TableSchema` ganha `'COPY'` (`'sync'`), a mesma leitura pelo login de leitura, que só enxerga as liberadas | | "visíveis do mesmo jeito depois", brief da Capacidade 1 | `apps/web/src/routes/_app/companies/$companyId/projects/$projectId_.data.copies.$table.tsx` |
| O banco acordado nas rodadas | U3 | D27 (`docs/guides/data.md:88-97`); `docs/architecture.md:206-216` (a tabela dos trabalhos) | `@mastra/core@1.82.0` `scheduler-Me4rCjO2.js:160-181` (dorme até o próximo `nextFireAt`) | O agendador dorme entre disparos | nativo: o agendador de hoje; a arquitetura ganha a linha das cópias | | 2026-11-09: mínimo 15 minutos | — |

**A medida do transplante.** Nenhuma peça vem do produto antigo: ele não tinha Sync (estudo, busca
`pg-boss|sincroniza` nos `.ts` de `conexus-os@e0353c36` vazia).

**A dívida.**

- Desligar uma conexão com cópias apaga as linhas das cópias pela chave estrangeira em cascata e
  deixa as tabelas em `sync` com as liberações; a rodada que acha a cópia ausente apaga a própria
  agenda. Uma issue futura, se alguém desligar uma conexão com cópias.
- O tamanho máximo de uma requisição HTTP ao Neon não está na documentação instalada do driver; a
  página de 500 linhas fica longe de qualquer teto plausível, e a P1 mede o tamanho da página.
- Uma rodada que renovou a trava e travou o processo pode, depois que outra assumiu, gravar uma
  página a mais na empresa; a gravação por chave não duplica e a passada seguinte relê a linha.
- A decisão 0058 diz "With the webhooks step: a Postgres queue (pg-boss)"; o roteiro tirou o
  pg-boss. A U3 emenda a 0058; a D27 e a W30 ganham as cópias no fechamento ([delivery
  L20](../guides/delivery.md)).

## P1 A prova no Sankhya

**Base e modelo.** `main` em `f24c3fcf`. Quem recebe a autorização da chamada roda a prova, fora do
repositório, pelo login de leitura do Sankhya da empresa; o resultado vai para o registro 0063,
escrito por Sonnet.

### As linhas da tabela

- **A leitura em páginas** e **A definição é dado da empresa**: o que a U1 vai escrever depende do
  que a P1 mede.

### O que se mede, só contando

Cada consulta passa pelo filtro de leitura do kit (`sankhya/read-only-sql.ts:105-109`) e devolve só
números, ou um valor que a própria consulta inventou:

1. O dialeto: `SELECT COUNT(*) AS N FROM DUAL` responde no Oracle e é recusado no SQL Server.
2. Para `TGFCAB`, `TGFITE`, `TGFPAR`, `TGFVEN` e `TGFPRO`: `SELECT COUNT(*) AS N FROM <t>` e
   `SELECT COUNT(*) AS N FROM <t> WHERE DTALTER IS NOT NULL` (a recusa diz que a coluna não existe).
3. A contagem de cada modelo como a U1 o escreve, com o filtro de vendas (`TIPMOV` de venda e de
   pedido de venda), e a da janela de 30 dias por `DTNEG`.
4. O literal de data que o DbExplorer aceita: a contagem com `DTALTER >= <literal>` na forma do
   dialeto (no Oracle, `TO_DATE('2026-10-01', 'YYYY-MM-DD')`).
5. A forma das células: `SELECT TO_DATE('2026-01-02 03:04:05', 'YYYY-MM-DD HH24:MI:SS') AS D,
   1234.5 AS V FROM DUAL` (os valores são inventados pela consulta).
6. O tamanho de uma página: a soma dos bytes das colunas de cada modelo sobre as 500 primeiras
   linhas pela chave (`VSIZE` no Oracle, `DATALENGTH` no SQL Server), contra o teto de 2 MiB do
   executor (decisão 0056).
7. A resposta do item 5, inteira, vira a gravação do envelope do DbExplorer para a leitura em
   páginas ([testing T29](../guides/testing.md)), com os valores inventados que já tem.

### Como se prova

O registro `docs/decisions/0063-copy-models-proof.md` (critério e resultado, [delivery
L21](../guides/delivery.md)) e a linha dele em `docs/index.md`. O critério 1.

### Parar se

- Uma das cinco tabelas não tiver `DTALTER`: o modelo dela nasce com `changedSince: null` (relido
  inteiro a cada passada), e a P1 diz o tamanho; se for vendas ou itens de venda, parar e voltar ao
  fundador, porque reler tudo a cada 30 minutos muda o custo.
- Uma página de 500 linhas passar de 1 MiB: a página cai para 250, e a P1 diz o número.

## U1 O kit da cópia

**Base e modelo.** `main` em `f24c3fcf`, depois da P1. Sonnet: tipos e uma operação no molde das
buscas.

### As linhas da tabela

- **A definição é dado da empresa.** Ler `packages/connectors/src/kernel/definition.ts:40-101`
  (`Connector`, `defineConnector`), `:103-106` (`declaredOf`), `kernel/operation.ts:139-192`
  (`Operation`, `defineOperation`). Referência: `airbyte@8aed3123`
  `docs/platform/understanding-airbyte/airbyte-protocol.md:488-493` (`default_cursor_field`).
- **A leitura em páginas.** Ler `sankhya/search-sql.ts:80-90` (`pageSql`), `sankhya/door.ts:102-142`
  (`ReadSql`, `QueriedRows`, `queryRequest`, `consultar`), `sankhya/read-only-sql.ts:105-109`,
  `sankhya/operations/buscas.ts:57-95` (o modelo de uma leitura com SQL nossa), `fake-sales.ts:160-162`
  (o dublê troca `OFFSET 0 ROWS FETCH NEXT` por `LIMIT`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Cria `copy.ts`, `copy.test.ts`; muda `definition.ts` (o campo `copy` e as conferências) | `sankhya/`, `index.ts` |
| `packages/connectors/src/sankhya/` | Cria `copy-read.ts`, `copies.ts`, `copy-read.test.ts`; muda `definition.ts` (o campo `copy`), o dublê (`fake-sales.ts` ou `fake-data.ts`, o que já guarda as tabelas) e a gravação nova ao lado das recusas | `index.ts` |
| `packages/connectors/src/index.ts` | Muda: exporta o que `kernel/copy.ts` declara | `apps/server/src/hub/connectors/` (só ele importa o kit) |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** nada.

`packages/connectors/src/kernel/copy.ts`:

```ts
/** A copy's name: the table it fills in the company's `sync` schema; a template gives it. */
export const CopyName = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/).brand<'CopyName'>()
export type CopyName = z.infer<typeof CopyName>

/** A column of the source as the source names it, in any case; quoted wherever it is written. */
export const CopyColumnName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]{0,59}$/)
export const CopyColumnType = z.enum(['text', 'numeric', 'bigint', 'date', 'timestamp', 'boolean'])

/** What a copy reads, the company's data from the moment it is turned on (version 1, one kind of source). */
export const CopyDefinition = z
  .object({
    version: z.literal(1),
    source: z.object({ kind: z.literal('QUERY'), sql: z.string().min(1).max(8000) }), // no date filter: the paged read adds it
    columns: z.array(z.object({ name: CopyColumnName, type: CopyColumnType })).min(1).max(100),
    key: z.array(CopyColumnName).min(1).max(4), // bigint columns, in page order (version 1)
    changedSince: z.object({ column: CopyColumnName }).nullable(), // when rows changed; none: every pass reads the whole source
    window: z.object({ column: CopyColumnName, days: z.int().min(1).max(90) }).optional(),
  })
  .superRefine(/* each key column is a bigint column of `columns`; the changedSince and window columns are date or timestamp columns of `columns` */)
export type CopyDefinition = z.infer<typeof CopyDefinition>

/** A starting point a connector offers; turning a copy on copies `definition` into the company's row. */
export type CopyModel = Readonly<{ id: CopyName; label: string; definition: CopyDefinition }>

/** One page: the definition, the last key read (none on a pass's first page), the two dates of the pass, and the size. */
export const PageInput = z.object({
  definition: CopyDefinition,
  after: z.array(z.int()).nullable(), // one per key column
  since: z.iso.date(), // the watermark less one day, or 1900-01-01 on the first pass
  windowFrom: z.iso.date().nullable(), // the pass's start less the window's days
  limit: z.int().min(1).max(500),
})
export type PageInput = z.infer<typeof PageInput>

/** The rows in the definition's column order, each cell its type's canonical text or null; `more` when another page follows. */
export type CopyPage = Readonly<{ rows: readonly (readonly (string | null)[])[]; more: boolean }>

/** What a connector offers for copies: the one paged read and its templates. */
export type ConnectorCopy = Readonly<{
  read: Operation<PageInput, CopyPage, 'read'>
  models: readonly CopyModel[]
}>
```

`Connector` ganha `copy?: ConnectorCopy` ao lado de `readDoor`. `defineConnector` confere que
`copy.read.class` é `read`, que o id dela não repete nenhum outro de `declaredOf`, que os ids dos
modelos não repetem, e parseia cada definição com `CopyDefinition`. A leitura da cópia **não** entra
em `operations`, na porta, em `subjects` nem em `inProbeOrder`: os papéis (`rolesFor`), a lista de
Papéis e as ferramentas dos agentes não a veem; só a porta da cópia no Hub a chama.

`packages/connectors/src/sankhya/copy-read.ts`: `lerPagina = defineOperation({ id: 'lerPagina',
class: 'read', subject: 'porta', idempotent: true, input: PageInput, output: CopyPageSchema, … })`.
O `request` monta, com o `pageSql` de hoje, `SELECT <colunas> FROM (<source.sql>) Q WHERE <datas>
AND <chave> > <after> ORDER BY <chave>` com `limit`, e passa por `queryRequest` (o filtro de
leitura julga a instrução inteira). **As datas são da leitura, nunca da consulta guardada**: com
`changedSince` e janela, `(Q.<alteração> >= since OR Q.<janela> >= windowFrom)`; só com
`changedSince`, `Q.<alteração> >= since`; sem `changedSince`, nenhum filtro (a fonte inteira). Assim
toda linha da janela vem em toda passada, mudada ou não, e o `DELETE` do fim da passada só apaga o
que sumiu da fonte (critério 42). A chave composta compara em ordem:
`(K1 > a) OR (K1 = a AND K2 > b)`. Os números de `after` vêm do esquema (inteiros), e as datas de
`since` e `windowFrom` do `z.iso.date()`, escritas no literal que a P1 mediu. O `answer` lê
`QueriedRows` (`door.ts:106-117`), tira a linha a mais (`EXTRA`, como as buscas) para dizer `more`,
e escreve cada célula no texto canônico do tipo da coluna, da forma que a P1 mediu. Cada nome de
coluna vai no dialeto do Sankhya (`"NOME"` quando não é a forma simples maiúscula).

`packages/connectors/src/sankhya/copies.ts`, os cinco modelos (as colunas exatas depois da P1; os
nomes que existem hoje estão em `operations/buscas.ts:70-80,146-156,203-204`):

| `id` | `label` | Fonte | Chave | `changedSince` | Janela |
| --- | --- | --- | --- | --- | --- |
| `clientes` | Clientes | `TGFPAR` (as colunas da busca de parceiros e `DTALTER`) | `CODPARC` | `DTALTER` | — |
| `vendedores` | Vendedores | `TGFVEN` (`CODVEND`, `APELIDO`, `ATIVO`, `DTALTER`) | `CODVEND` | `DTALTER` | — |
| `produtos` | Produtos | `TGFPRO` com `TGFGRU` (as colunas da busca de produtos e `DTALTER`) | `CODPROD` | `DTALTER` | — |
| `vendas` | Vendas | `TGFCAB` com `TIPMOV` de venda e de pedido de venda; o cabeçalho largo, com a TOP (`CODTIPOPER`), a data de negociação, o parceiro, o vendedor, o valor e o status | `NUNOTA` | `DTALTER` | `DTNEG`, 30 dias |
| `itens_venda` | Itens de venda | `TGFITE` com `TGFCAB` pelo `NUNOTA`, o mesmo filtro de vendas | `NUNOTA`, `SEQUENCIA` | o `DTALTER` do cabeçalho, como coluna da consulta | `DTNEG` do cabeçalho, 30 dias |

Nenhuma consulta de modelo leva filtro de data (`DTALTER >= …` ou `DTNEG >= …`): o filtro é da
leitura em páginas.

A regra da empresa (quais TOPs contam como venda) não entra no modelo: fica para quem lê, ou para a
definição própria da Capacidade 3 (`sankhya/skill/SKILL.md:8`).

A forma de cada coisa:

- **Estados.** `CopyPage.more` separa a última página das outras; a leitura devolve o `Answered` de
  sempre (`OK`, `REFUSED`, …), nunca uma lista vazia no lugar de uma falha (C22).
- **Ids.** `CopyName` com marca; `OperationId` `lerPagina` pelo `defineOperation` (C23).
- **Donos.** `CopyDefinition` é o único dono da forma de uma definição: o Hub a importa pela porta de
  `hub/connectors` e nunca a redeclara; o tamanho da página, 500, é de `copy.ts` (`PAGE_ROWS`) (C26).
- **Entrada externa.** A resposta do Sankhya por `QueriedRows`; a definição guardada é parseada de
  novo pela `CopyDefinition` a cada rodada, no Hub (C27).
- **Modelo.** `sankhya/operations/buscas.ts` (a busca de parceiros) cumpre C21, C23 e C26 e é o
  modelo da leitura.

### As skills e a leitura

- `zod` (`zod.dev/llms.txt`): `superRefine`, `brand`, `z.iso.date`.
- `typescript-magician`: o tipo de `Connector.copy` e a operação com `PageInput`.

### A ordem do trabalho

1. `kernel/copy.ts` e as conferências em `definition.ts`, com `copy.test.ts`. Regras: C21, C23,
   C24, C27.
2. `sankhya/copy-read.ts` sobre `pageSql` e `queryRequest`. Regras: C30, D20 (aqui não há valor
   ligado: o DbExplorer não aceita, `search-sql.ts:3-8`, e todo valor de fora é número ou data
   parseados).
3. `sankhya/copies.ts` com os cinco modelos e `copy: { read: lerPagina, models }` em
   `sankhya/definition.ts`.
4. O dublê: as linhas inventadas de `TGFCAB`, `TGFITE`, `TGFPAR`, `TGFVEN` e `TGFPRO` com `DTALTER`
   e `DTNEG`, e o literal de data que a P1 mediu, aceito pelo SQLite do dublê como `LIMIT` já é.
   A gravação da P1 ao lado das recusas ([testing T29](../guides/testing.md)).

### Como se prova

- Critérios 2 e 3: `kernel/copy.test.ts`, chamando `defineConnector` e `CopyDefinition` (a porta
  pública do kit).
- Critérios 4 a 6: `sankhya/copy-read.test.ts`, pela operação contra o dublê, como `search.test.ts`;
  o critério 4 confere o filtro de datas nas três formas (com janela, só alteração, nenhum).
- Os critérios falham hoje: `copy.ts` não existe.
- Local: os testes tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- O dublê precisar de outro dialeto além do `LIMIT` para o literal de data: parar e dizer; é a #819.
- A P1 mostrar um banco SQL Server: o literal e a soma de bytes mudam; seguir o que a P1 mediu e
  dizer no relatório.

## U2 O motor

**Base e modelo.** O commit da U1. Opus: concorrência (a trava, a rodada órfã, dois bancos) e
desenho entre módulos (`hub/copies`, `hub/connectors`, `hub/apps`, `platform/`).

### As linhas da tabela

- **Uma rodada por vez; a rodada órfã; até onde leu; o teto.** Ler `mastra-1.82@6e8dfcb8`
  `mastracode/factory/src/environment/build.ts:139-216` (a trava com senha, renovada, e só grava
  enquanto é a dona); `ml-vigia@0c0749f1` `app/sincronizacao/execucao.py:289,328-333,485-492,678-692`;
  `recursos.py:157-173`. No Conexus: `hub/apps/tables.ts:107` (`claimedUntil`), `docs/guides/data.md`
  D22 e D25.
- **O que foi apagado; onde a cópia mora.** Ler `platform/company-postgres.ts:68-108`
  (`neonTransport`), `:150-195` (`schemaStatements`, `ensureApp`), `platform/app-read.ts:28-35`
  (`readAddress`), `:76-100` (`ensureReadLogin`, o `42710`), `platform/app-sql.ts` (`quoted`,
  `missingLogins`, `existingRoles`), `hub/apps/app-database.ts:32-66` (`openAppDatabase`: o
  endereço do dono só para o ato, o host guardado). Referência: `nango@e6c6131`
  `docs/guides/functions/syncs/deletion-detection.mdx:82-84`.
- **A leitura em páginas; quem fala.** Ler `hub/connectors/read.ts:16-32,139-206`,
  `hub/connectors/testing.ts:28-45` (`openedIn`), `hub/connectors/rows.ts:17-33` (`Deps`, `Viewer`),
  `hub/connectors/public.ts:56-127` (`createConnectors`), `hub/identity/may-use.ts:22-27,81-91`.
- **A liberação; apagar um Projeto.** Ler `hub/connectors/tables.ts:172-201` (`project_connection`),
  `hub/connectors/grants.ts`, `hub/apps/removal.ts:56-118`, `platform/company-postgres.ts:242-268`
  (`dropApp`), `packages/hub-api/src/app-login.ts`.
- **O registro de cada rodada.** `builder/automations/run.ts:157-166` (por que o registro é nosso);
  `platform/pages.ts:12-41` (`pageOf`, `pageKey`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/` | Cria `tables.ts`, `public-tables.ts` se outro dono precisar da chave estrangeira, `store.ts`, `enable.ts`, `run.ts`, `grants.ts`, `public.ts` e os testes `enable.test.ts`, `run.test.ts`, `grants.test.ts`, `test-copies.ts` | `main.ts` (U3), `hub/apps/removal.ts`, `builder/copy-clock/` (U3) |
| `apps/server/src/hub/connectors/` | Cria `copy-port.ts`, `copy-port.test.ts`; muda `read.ts` (`ReadBy` ganha `'copy'`), `public.ts` (a porta `copies` e a reexportação de `CopyDefinition`, `CopyName`, `PageInput`) | `hub/copies` |
| `apps/server/src/hub/apps/` | Muda `removal.ts` (chama `revokeAllOf` antes de `dropAppDatabase`), `app-database.ts` (chama `applyGrants` depois de `ensureApp`, como reparo) e `public.ts` (a porta `projectDatabase`, que `hub/copies` chama ao liberar) | `hub/projects`, `hub/copies`, `main.ts` |
| `apps/server/src/platform/` | Cria `copy-sql.ts`; muda `company-postgres.ts` (as funções da cópia na porta `CompanyPostgres`) e o dublê `test-app-ports.ts` se ele implementar a porta | `hub/copies`, os testes |
| `apps/server/migrations/` | Cria a migração do esquema `copies` (gerada pelo Drizzle, com as políticas à mão) | `migrate` |
| `apps/server/database-grants.sql`, o `snapshot.json` | Muda, num pull request só dele (D11) | `catalog.test.ts` |
| `apps/server/src/schema.ts` ou o arquivo que junta os `tables.ts` | Muda, se a junção não for automática | as migrações |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** nada; é peça nova.

As tabelas, `apps/server/src/hub/copies/tables.ts`, esquema `copies`, com a coluna de empresa e a
política por linha como toda tabela do Hub (decisão 0039):

| Tabela | Colunas | Restrições |
| --- | --- | --- |
| `copy` | `id uuid`, `company_id`, `connection_id`, `name text`, `label text`, `model text`, `definition jsonb`, `created_by`, `created_at`, `body_hash text`, `claim_token uuid null`, `claimed_until timestamptz null`, `pass integer default 0`, `pass_started_at timestamptz null`, `position jsonb null`, `watermark timestamptz null`, `rows bigint null`, `last_run_id uuid null` | `primary key (id)`; `unique (company_id, name)`; `connection_id` → `connectors.connection` em cascata, `company_id` → a empresa em cascata; `check ((claim_token is null) = (claimed_until is null))` |
| `copy_run` | `id uuid`, `company_id`, `copy_id`, `started_at`, `ended_at null`, `outcome text null` (`COMPLETE`, `PARTIAL`, `ERROR`, `INTERRUPTED`), `reason text null` (`CAP`, `STOPPED` ou o código do erro), `pages`, `read`, `written` integer | `copy_id` → `copy` em cascata; `check ((ended_at is null) = (outcome is null))`; um índice parcial único `(copy_id) where ended_at is null` (uma rodada aberta por cópia) |
| `project_copy` | `company_id`, `project_id`, `copy_id`, `granted_by`, `granted_at` | `primary key (project_id, copy_id)`; `project_id` → o Projeto em cascata; `copy_id` → `copy` em cascata |

`id` da cópia: `CopyId` com marca, em `packages/hub-api/src/copies.ts` (U3 escreve o contrato; a U2
declara a marca ali primeiro, com `CopyRunId`).

`model` e `label` vêm da origem da definição: hoje só o modelo (o id e o rótulo dele). A Capacidade 3
acrescenta a sua origem sem mudar a rodada nem estas colunas.

`apps/server/src/hub/connectors/copy-port.ts`, exposto em `createConnectors` como `copies`:

```ts
export type CopyRead =
  | Readonly<{ kind: 'PAGE'; page: CopyPage }>
  | Readonly<{ kind: 'FAILED'; code: 'COPY_SOURCE_REFUSED' | 'COPY_SOURCE_NEEDS_REAUTH' | 'COPY_SOURCE_UNREACHABLE' | 'COPY_SOURCE_UNREADABLE' }>
  | Readonly<{ kind: 'NO_CONNECTION' }> // the connection is gone or not ACTIVE

/** The models of the connection's connector, none when it offers no copies. */
models(input: { companyId: CompanyId; connectionId: ConnectionId }): Promise<readonly CopyModel[] | undefined>
/** Every connector's models, for the dialog: the connector's id beside each. */
catalog(): readonly { connector: ConnectorId; model: CopyModel }[]
/** One page through `readThrough`: the connection's turn, its token, the deadline, the log line. */
readPage(input: {
  companyId: CompanyId; connectionId: ConnectionId; enabledBy: PersonId
  input: PageInput; signal: AbortSignal
}): Promise<CopyRead>
```

`readPage` abre a conexão por `openedIn` numa leitura do Hub e chama `readThrough` com `by: 'copy'`,
`viewer: { person: { id: enabledBy }, companyId }`, `speaker: { kind: 'VERSION', declared: [{
connectionId, operation: 'lerPagina' }] }` e `deadlineMs: callDeadlineMs` (`CALL_DEADLINE_MS`,
10 s). `REFUSED` vira `COPY_SOURCE_REFUSED`; `AUTH_REFUSED`, `COPY_SOURCE_NEEDS_REAUTH`;
`UNREACHABLE`, `DEADLINE` e `BUSY`, `COPY_SOURCE_UNREACHABLE`; `UNREADABLE`, `COPY_SOURCE_UNREADABLE`;
`NOT_IN_ROLE` (não acontece com o `declared` montado só com `lerPagina`, mas o `switch` exaustivo o
pede), `COPY_SOURCE_REFUSED`.

`apps/server/src/platform/copy-sql.ts`, pela porta `CompanyPostgres`:

```ts
/** The `sync` schema and the `conexus_sync` login that owns it, once per company, as its owner (0043). */
ensureSync(owner: DatabaseUrl): Promise<SqlAnswer>
/** The copy's table as `conexus_sync`: typed columns, the key as primary key, `_pass integer`, an index on the window's column. */
ensureCopyTable(sync: DatabaseUrl, input: { name: CopyName; definition: CopyDefinition }): Promise<SqlAnswer>
/** Where the Hub reaches `conexus_sync`, from the host it recorded, with no call to Neon (as `readAddress`). */
syncAddress(host: string): Promise<DatabaseUrl>
/** One page in one transaction: `INSERT … SELECT … FROM jsonb_to_recordset($1) … ON CONFLICT (key) DO UPDATE`, each row with `_pass`. */
writePage(sync: DatabaseUrl, input: { name: CopyName; definition: CopyDefinition; pass: number; rows: CopyPage['rows'] }, signal: AbortSignal): Promise<SqlAnswer>
/** The end of a complete pass: what the window held and this pass did not see leaves, then the count. */
closePass(sync: DatabaseUrl, input: { name: CopyName; definition: CopyDefinition; pass: number; windowFrom: string | null }, signal: AbortSignal): Promise<{ kind: 'DONE'; rows: number } | Exclude<SqlAnswer, { kind: 'DONE' }>>
/** `GRANT USAGE ON SCHEMA sync` and `GRANT SELECT ON sync.<name>` to the app's run and read logins, which the release made first. */
grantCopy(sync: DatabaseUrl, input: { name: CopyName; projectId: ProjectId }): Promise<SqlAnswer>
/** The `REVOKE` of the same. */
revokeCopy(sync: DatabaseUrl, input: { name: CopyName; projectId: ProjectId }): Promise<SqlAnswer>
```

Toda identificação de tabela e coluna vem da `CopyDefinition` parseada e do `CopyName`, citada por
`quoted` (`app-sql.ts`); todo valor (a página, o passe, a data) é ligado (D20).

`apps/server/src/hub/copies/public.ts`:

```ts
export function createCopies(deps: {
  database: Database; identity: IdentityPorts; projects: ProjectPorts; neon: NeonPorts
  companyPostgres: CompanyPostgres; connectors: () => Connectors['copies']
  apps: () => Apps['projectDatabase'] // the Projeto's schema and logins, made by their owner
  clock: () => CopyClock; log: FailureLog; updating: () => boolean; tuning?: CopyTuning
}): {
  routes(app: FastifyInstance): void              // U3
  /** One run of one copy; the clock's workflow calls it. */
  run(input: { companyId: CompanyId; copyId: CopyId }, signal: AbortSignal): Promise<CopyRunEnd>
  /** Before an app's logins are dropped: every release of the Projeto revoked. */
  revokeAllOf(input: { companyId: CompanyId; projectId: ProjectId }): Promise<SqlAnswer>
  /** After an app's logins are made: every release of the Projeto granted again (repair only; releasing makes the logins). */
  applyGrants(input: { companyId: CompanyId; projectId: ProjectId }): Promise<SqlAnswer>
}

/** What the clock does for a copy (U3 implements it in the Builder; the Hub never imports the Builder). */
export type CopyClock = {
  set(input: { companyId: CompanyId; copyId: CopyId; interval: CopyInterval }): Promise<void>
  pause(copyId: CopyId): Promise<void>
  resume(copyId: CopyId): Promise<void> // a MISSING copy is not resumed here: the service calls `set`
  runNow(copyId: CopyId): Promise<void>
  remove(copyId: CopyId): Promise<void>
  states(companyId: CompanyId): Promise<ReadonlyMap<CopyId, CopySchedule>>
}

export type CopyRunEnd =
  | { kind: 'RUNNING' } // another run holds the lease: nothing read, no run row
  | { kind: 'GONE' }    // no such copy: the clock removes its schedule
  | { kind: 'ENDED'; outcome: CopyOutcome }

export type CopyOutcome =
  | { kind: 'COMPLETE' }
  | { kind: 'PARTIAL'; reason: 'CAP' | 'STOPPED' }
  | { kind: 'ERROR'; code: CopyRunFailure }
  | { kind: 'INTERRUPTED' }
```

`CopyTuning` = `{ pageRows?: number; runPages?: number; runMs?: number; leaseMs?: number }`, para os
testes (T20); produção: 500 linhas, 200 páginas, 10 minutos, trava de 10 minutos renovada a cada
página.

A rodada, `hub/copies/run.ts`, em ordem (a forma do Factory, `build.ts:139-216`):

1. **Pega a trava**, numa transação do Hub: `UPDATE copy SET claim_token = $t, claimed_until = now()
   + $lease, pass_started_at = coalesce(pass_started_at, now()) WHERE id = $id AND company_id = $c
   AND (claimed_until IS NULL OR claimed_until < now()) RETURNING …`; nenhuma linha e a cópia
   existe: `RUNNING`; a cópia não existe: `GONE`. Na mesma transação, a rodada aberta que houver
   fecha `INTERRUPTED`, e a nova entra. A definição guardada passa pela `CopyDefinition` (C27).
2. **Antes de cada página**: `updating()` ou o sinal fecham `PARTIAL STOPPED`; o teto fecha `PARTIAL
   CAP` e pede `clock.runNow`. Nada para no meio de uma página.
3. **Lê a página** por `connectors.copies.readPage`, com `after = position`, `since = watermark − 1
   dia` (ou `1900-01-01`), `windowFrom = pass_started_at − window.days`; os dois valores ficam iguais
   em toda a passada. `FAILED` fecha `ERROR` com o código; `NO_CONNECTION`, `ERROR`
   `COPY_SOURCE_UNREACHABLE`.
4. **Grava a página** na empresa (`writePage`, `_pass = pass`); falhou: `ERROR`
   `COPY_DATABASE_UNAVAILABLE`.
5. **Salva a posição** no Hub: `UPDATE copy SET position = $ultima, claimed_until = now() + $lease
   WHERE id = $id AND claim_token = $t` e soma páginas, lidas e gravadas na rodada; nenhuma linha:
   a trava foi perdida, `COPY_CLAIM_LOST` no registro e a rodada para sem gravar mais nada.
6. **Fim da passada** (`more` falso): `closePass` na empresa; no Hub, `UPDATE copy SET watermark =
   pass_started_at, pass = pass + 1, pass_started_at = NULL, position = NULL, rows = $n, …` só com a
   senha; fecha `COMPLETE`.
7. **Fecha**: solta a trava (`claim_token = NULL`), grava o fim da rodada, aponta `last_run_id`, e
   apaga as rodadas da cópia além das 100 mais novas. `ERROR` e `PARTIAL` mantêm a posição e nunca
   apagam nem avançam a marca.

Ligar, `hub/copies/enable.ts`: o serviço recebe a origem da definição como união fechada, hoje só
`{ kind: 'MODEL'; model: CopyName }` (C22; C30, nada sem consumidor), e a rota a monta do corpo
`EnableCopy`; a Capacidade 3 acrescenta `{ kind: 'PROPOSAL'; id }` sem mexer na rodada. Admissão
`manageCopies` com trava e a conexão `ACTIVE` da empresa numa transação; a definição da origem (o
modelo pela porta, `models`), copiada na linha com o `model` e o `label` dela e a chave de tentativa
(`body_hash`, C37); depois, fora da transação (D22), o endereço do dono pelo Neon e o host como
`openAppDatabase` faz, `ensureSync`, `ensureCopyTable`, e por fim `clock.set` e `clock.runNow`. A
mesma chave retoma do passo que faltou. O registro: `COPY_ENABLED`.

Liberar, `hub/copies/grants.ts`: admissão `manageCopies` com trava; a linha `project_copy` (`ON
CONFLICT DO NOTHING`); depois, fora da transação (D22), o banco do Projeto pela porta
`apps().projectDatabase` de `hub/apps`, que chama o `openAppDatabase` de hoje com `databaseReady`
lido da linha `app` (falso quando o Projeto ainda não tem app): o esquema e os logins do app nascem
pelo seu dono, nunca por um segundo caminho; por fim `grantCopy`. `FAILED` responde 503
`COPY_DATABASE_UNAVAILABLE` e a linha fica; repetir termina. `applyGrants` depois de `ensureApp`
continua só como reparo de uma liberação cortada no meio.

```ts
// apps/server/src/hub/apps/public.ts, in createApps
/** The Projeto's schema and logins in the company's database, made by `openAppDatabase` when it has no app yet. */
projectDatabase(input: { companyId: CompanyId; personId: PersonId; projectId: ProjectId }): Promise<{ kind: 'OPEN' } | { kind: 'FAILED' }>
```

A forma de cada coisa:

- **Estados.** `CopyRunEnd`, `CopyOutcome`, `CopyRead` e as colunas `outcome`/`reason` como união
  no TypeScript; o `switch` termina em `satisfies never` (C21). A trava viva, vencida ou ausente se
  decide no `UPDATE`, nunca por um `if` sobre um valor lido antes (C65).
- **Ids.** `CopyId`, `CopyRunId`, `CopyName`, `ConnectionId`, `ProjectId` com marca (C23); a porta
  não recebe `string`.
- **Donos.** A definição e a sua forma: `CopyDefinition` do kit, pela porta de `hub/connectors`. A
  cadência, a pausa e o próximo horário: só a agenda do Mastra (`metadata.interval`), nunca uma
  coluna da cópia. A trava, a posição, a marca e as rodadas: `hub/copies`. Os tetos: `CopyTuning`
  com os padrões numa constante de `run.ts` (C26).
- **Entrada externa.** As linhas do Hub e a definição guardada por Zod; a resposta da empresa pelo
  `SqlAnswer` de hoje (C27).
- **Modelo.** `hub/connectors/grants.ts` (a liberação) e `hub/apps/app-database.ts` (o banco da
  empresa fora da transação) cumprem C21, C23 e C26. `builder/automations/run.ts` não é modelo da
  rodada: é um turno do Assistente, não uma cópia.

### As skills e a leitura

- `fastify-best-practices` (`apps/server/src`): só o índice.
- `neon:neon-postgres` (`@neondatabase/serverless`, `platform`): transação e valores ligados.
- `drizzle-kit` (`node_modules/drizzle-kit/skills/`): a migração gerada.
- `better-auth` não entra nesta unidade.
- PostgreSQL 18: `jsonb_to_recordset`, `INSERT … ON CONFLICT`, `GRANT`, `REVOKE`, `DROP ROLE`.

### A ordem do trabalho

1. **As tabelas**, num pull request só delas, com `database-grants.sql` e a palavra do fundador
   (D11). Regras: D4, D6, D10, D12, D15, D17.
2. **`platform/copy-sql.ts`** e as funções na porta `CompanyPostgres`. Regras: D19, D20, D22, C57
   (o sinal de cada chamada com `NEON_CALL_BUDGET_MS`).
3. **A porta da cópia** em `hub/connectors`. Regras: C4, C56 (só `hub/connectors` importa o kit).
4. **Ligar**, depois **a rodada**, depois **a liberação** e `revokeAllOf`/`applyGrants`. Regras:
   C37, D22, D25, S7, S8, S10.
5. **`hub/apps`**: a porta `projectDatabase` em `public.ts` sobre `openAppDatabase`; `removal.ts`
   chama `revokeAllOf` antes de `dropAppDatabase`; `app-database.ts` chama `applyGrants` depois de
   `ensureApp`, como reparo. A ligação das dependências fica para a U3 (`main.ts`);
   nesta unidade os testes montam `createCopies` por `test-copies.ts`.

### Como se prova

- Critérios 7 a 22 e 42: pelo Hub de teste, com o banco da empresa de `platform/test-company-postgres.ts`
  (`createCompanyDatabase`) e o dublê do Sankhya, como `builder/agents/app-data.test.ts:40-55`; a
  rodada chamada direto por `copies.run` (a porta pública do assunto, T5) e o relógio por um dublê
  da porta `CopyClock` que anota as chamadas. O teto, a trava e a rodada órfã com `CopyTuning`
  curto, nunca com o relógio de produção (T20). Duas rodadas ao mesmo tempo: duas chamadas a `run`
  com uma página do dublê que espera um sinal do teste.
- O critério 18 pela porta de `hub/connectors`, com uma leitura de app no meio.
- O critério 20 num Projeto criado sem app pelo Hub de teste: liberar, ler a cópia pelo login de
  leitura (`readAddress`), depois mandar a primeira versão e conferir que os logins não mudaram.
- O critério 42 com os modelos `vendas` e `itens_venda` contra o dublê: uma primeira passada, uma
  venda da janela que não muda e outra que some do dublê, a segunda passada.
- Os critérios falham hoje: `hub/copies` não existe.
- Local: os testes tocados, `npm run typecheck`, `npm run lint`, `node scripts/check-migrations.ts`.

### Parar se

- O `REVOKE` feito pelo `conexus_sync` não deixar o `DROP ROLE` de `dropApp` passar: parar e dizer
  o que o PostgreSQL respondeu; a ordem de apagar é premissa do cartão (critério 21).
- O dono da empresa não conseguir criar o `conexus_sync` e passar a ele o esquema como faz com o
  login de migração (`GRANT … TO CURRENT_USER WITH INHERIT FALSE, SET TRUE`): parar e dizer.
- Uma página de 500 linhas passar do teto de resposta do Neon no teste local: parar.

## U3 A permissão, as rotas e o relógio

**Base e modelo.** O commit da U2. Sonnet: o contrato está escrito abaixo e o relógio segue as
automações e o Factory.

### As linhas da tabela

- **Quem vê e quem mexe.** Ler `hub/identity/roles.ts:24-46,66-110`, `admission.ts:11-49` (as
  constantes e `ActionRule`), `:59-118` (`ACTIONS`), `:139-144` (`allows`), `companies.ts:90-106`
  (`may`), `packages/hub-api/src/roles.ts` (`CompanyMay`), `apps/web/src/platform/test-may.ts`.
  Modelo: `readAgents`/`manageAgents` (`admission.ts:96-99`).
- **O relógio; pausar, retomar, rodar agora, mudar o intervalo; a rodada órfã.** Ler
  `builder/automations/automations.ts:140-232` (criar, retomar, rodar), `run.ts:15-27` (o id do
  workflow como contrato guardado), `builder/mastra/hub-mastra.ts:95-127` (`start`, `settle`),
  `conversations-of.ts:140-191` (`workflows`, `releaseFirst`), `main.ts:130-175`. Referência:
  `@mastra/core@1.82.0` `dist/docs/references/reference-schedules-overview.md:55-209`,
  `reference-workflows-workflow.md:128`; `mastra-1.82@6e8dfcb8`
  `mastracode/factory/src/environment/build-schedule.ts:1-30`, `build-workflow.ts:68-73`.
- **O banco acordado.** `docs/architecture.md:206-216`; `docs/guides/data.md` D27.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/{copies,copy-failures,roles,failures,index}.ts` | Cria `copies.ts` e `copy-failures.ts`; muda os outros | `apps/server`, `apps/web` |
| `apps/server/src/hub/identity/{roles,admission,companies}.ts` | Muda | `hub/copies`, as rotas de identidade |
| `apps/server/src/hub/copies/` | Cria `routes.ts`, `routes.test.ts`; muda `public.ts` | `main.ts` |
| `apps/server/src/builder/copy-clock/` | Cria `clock.ts`, `workflow.ts`, `public.ts`, `clock.test.ts` | `conversations-of.ts` |
| `apps/server/src/conversations-of.ts` | Muda: o workflow `conexus-copy-run` no mapa e a remoção das agendas em `releaseFirst` | `main.ts` |
| `apps/server/src/main.ts` | Muda: monta `createCopies` e liga o relógio, como liga `connectors` e `apps` | — |
| `apps/server/src/hub/identity/developer.test.ts` | Muda (o caso de `may`) | — |
| `apps/web/src/platform/test-may.ts` | Muda (o campo novo, para a web compilar) | os testes da web |
| `docs/architecture.md` | Muda: a linha das cópias na tabela dos trabalhos | — |
| `docs/decisions/0058-provider-limits-and-queues.md` | Muda: a nota de que a cópia a reabre e de que o pg-boss saiu pelo roteiro | — |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** nada.

`packages/hub-api/src/copies.ts`, exportado por `index.ts`:

```ts
export const CopyId = z.uuid().brand<'CopyId'>()
export const CopyRunId = z.uuid().brand<'CopyRunId'>()
export const CopyInterval = z.enum(['15m', '30m', '1h', '2h', '6h', '24h']) // 15 minutes at least (founder, 2026-11-09)
export const COPY_INTERVAL_DEFAULT = '30m'

export const CopySchedule = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ACTIVE'), nextRunAt: z.iso.datetime() }),
  z.object({ kind: z.literal('PAUSED') }),
  z.object({ kind: z.literal('MISSING') }),
])
export const CopyRun = z.object({
  id: CopyRunId,
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime().nullable(),
  outcome: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('RUNNING') }),
    z.object({ kind: z.literal('COMPLETE') }),
    z.object({ kind: z.literal('PARTIAL'), reason: z.enum(['CAP', 'STOPPED']) }),
    z.object({ kind: z.literal('ERROR'), code: CopyRunFailureCode }),
    z.object({ kind: z.literal('INTERRUPTED') }),
  ]),
  read: z.int().min(0),
  written: z.int().min(0),
})
export const CopySummary = z.object({
  id: CopyId,
  name: z.string(), // the table, `sync.<name>`
  label: z.string(), // the label of what the definition came from (a template now)
  connection: z.object({ id: ConnectionId, name: z.string(), connector: ConnectorId }),
  interval: CopyInterval.nullable(), // null when the schedule is MISSING
  schedule: CopySchedule,
  run: CopyRun.nullable(), // the open run, else the last
  rows: z.int().min(0).nullable(), // after the last complete pass
  projects: z.array(z.object({ id: ProjectId, name: z.string() })),
  shown: z.object({
    query: z.string(),
    key: z.array(z.string()),
    window: z.object({ column: z.string(), days: z.int() }).nullable(),
  }),
})
export const CopyModelSummary = z.object({ connector: ConnectorId, id: z.string(), label: z.string() })
export const EnableCopy = z.object({ connectionId: ConnectionId, model: z.string().max(40), interval: CopyInterval })
```

As operações (`access: 'session'` em todas; a escrita que cria leva a chave de tentativa):

| Operação | Método e caminho | Entrada | Sucesso | Falhas além de `NOT_FOUND`, `SESSION_REQUIRED`, `DATABASE_UNAVAILABLE` |
| --- | --- | --- | --- | --- |
| `listCopies` | `GET /api/companies/{companyId}/copies` | — | 200 `{ copies: CopySummary[] }` | — |
| `listCopyModels` | `GET /api/companies/{companyId}/copy-models` | — | 200 `{ models: CopyModelSummary[] }` | — |
| `enableCopy` | `POST /api/companies/{companyId}/copies` | `EnableCopy`, `attemptKey: true` | 201 `{ copy: CopySummary }` | `IDEMPOTENCY_CONFLICT`, `COPY_EXISTS`, `COPY_MODEL_UNKNOWN`, `COPY_CONNECTION_NOT_READY`, `COPY_DATABASE_UNAVAILABLE`, `HUB_UPDATING` |
| `pauseCopy` | `POST /api/companies/{companyId}/copies/{copyId}/pause` | — | 200 `{ copy }` | `COPY_NOT_FOUND` |
| `resumeCopy` | `POST /api/companies/{companyId}/copies/{copyId}/resume` | — | 200 `{ copy }` | `COPY_NOT_FOUND`, `HUB_UPDATING` |
| `changeCopyInterval` | `PATCH /api/companies/{companyId}/copies/{copyId}` | `{ interval: CopyInterval }` | 200 `{ copy }` | `COPY_NOT_FOUND`, `REQUEST_MALFORMED` |
| `runCopy` | `POST /api/companies/{companyId}/copies/{copyId}/run` | — | 202 `{}` | `COPY_NOT_FOUND`, `COPY_RUNNING`, `HUB_UPDATING` |
| `listCopyRuns` | `GET /api/companies/{companyId}/copies/{copyId}/runs` | `Page` | 200 `{ copy: CopySummary, runs: CopyRun[], next: Next }` | `COPY_NOT_FOUND`, `REQUEST_MALFORMED` |
| `listProjectCopies` | `GET /api/companies/{companyId}/projects/{projectId}/copies` | — | 200 `{ copies: { copy: CopyModelSummary & { id: CopyId; name: string }; granted: boolean }[] }` | — |
| `grantProjectCopy` | `PUT /api/companies/{companyId}/projects/{projectId}/copies/{copyId}` | — | 200 `{ granted: true }` | `COPY_NOT_FOUND`, `COPY_DATABASE_UNAVAILABLE` |
| `revokeProjectCopy` | `DELETE /api/companies/{companyId}/projects/{projectId}/copies/{copyId}` | — | 200 `{ granted: false }` | `COPY_NOT_FOUND`, `COPY_DATABASE_UNAVAILABLE` |

`packages/hub-api/src/copy-failures.ts`, `COPY_FAILURES`, espalhado em `FAILURES` como
`AUTOMATION_FAILURES` (`automation-failures.ts`):

| Código | Categoria | `settles` | Status | Frase | Ação | `actionKind` |
| --- | --- | --- | --- | --- | --- | --- |
| `COPY_NOT_FOUND` | USER | sim | 404 | Não encontramos esta cópia. | Volte às cópias. | `INITIAL` |
| `COPY_EXISTS` | USER | sim | 409 | A empresa já tem esta cópia. | Abra a cópia na lista. | `NONE` |
| `COPY_MODEL_UNKNOWN` | USER | sim | 422 | Esta conexão não tem esse modelo de cópia. | Escolha outro modelo. | `NONE` |
| `COPY_CONNECTION_NOT_READY` | USER | sim | 409 | A conexão precisa ser testada de novo. | Abra a conexão em Integrações. | `NONE` |
| `COPY_RUNNING` | USER | sim | 409 | Esta cópia já está rodando. | Espere ela terminar. | `NONE` |
| `COPY_DATABASE_UNAVAILABLE` | THIRD_PARTY | não | 503 | O banco da empresa não respondeu. | Tente de novo em instantes. | `RETRY` |
| `COPY_SOURCE_REFUSED` | THIRD_PARTY | sim | 502 | O sistema recusou a leitura. | Confira a conexão. | `NONE` |
| `COPY_SOURCE_NEEDS_REAUTH` | USER | sim | 409 | A conexão precisa ser refeita. | Ligue a conexão de novo em Integrações. | `NONE` |
| `COPY_SOURCE_UNREACHABLE` | THIRD_PARTY | sim | 503 | O sistema não respondeu. | A próxima rodada tenta de novo. | `NONE` |
| `COPY_SOURCE_UNREADABLE` | THIRD_PARTY | sim | 502 | O sistema respondeu algo que não conseguimos ler. | A próxima rodada tenta de novo. | `NONE` |

As últimas quatro, com `INTERRUPTED` de `automation-failures.ts`, são as frases de uma rodada; não
saem de uma rota. `CopyRunFailureCode` é a união das quatro e de `COPY_DATABASE_UNAVAILABLE`.

`packages/hub-api/src/roles.ts`, `CompanyMay`: `manageCopies: z.boolean()`.

`apps/server/src/hub/identity/roles.ts`: `BUILD.copy` = `['manage']`; `createAccessControl` com
`copy: ['manage']`. `admission.ts`: `const MANAGE_COPIES = { copy: ['manage'] } as const`, na união
de `ActionRule`; `readCopies: { by: 'MEMBER', statement: MANAGE_COPIES, locks: false }` e
`manageCopies: { by: 'MEMBER', statement: MANAGE_COPIES, locks: true }`, com um comentário de uma
linha que cite esta capacidade e a palavra do fundador. `companies.ts`: `manageCopies:
allows(admitted.role, 'manageCopies')`. As leituras (`listCopies`, `listCopyModels`, `listCopyRuns`,
`listProjectCopies`) admitem `readCopies`; as escritas, `manageCopies`.

`apps/server/src/builder/copy-clock/clock.ts` implementa `CopyClock` sobre `mastra.schedules`:

- `set`: `schedules.get(copyId)`; ausente, `schedules.create({ id: copyId, workflowId:
  COPY_WORKFLOW, cron, timezone: 'America/Sao_Paulo', inputData: { version: 1, companyId, copyId },
  metadata: { companyId, interval } })`; presente, `schedules.update({ cron, metadata })`, que mantém
  a pausa (estudo, P1).
- `pause`, `resume`, `runNow`, `remove`: `schedules.pause/resume/run/delete`, nada mais.
- Uma cópia `MISSING` não tem agenda nem intervalo: o serviço de `hub/copies` a retoma chamando
  `set` com a empresa e `COPY_INTERVAL_DEFAULT`, e muda o intervalo dela chamando `set` com o
  intervalo pedido; nos dois casos a agenda nasce ativa (critério 26).
- `states`: `schedules.list({ workflowId: COPY_WORKFLOW })` filtrado por `metadata.companyId`; a
  cópia sem linha é `MISSING`.
- Os crons: `15m` `*/15 * * * *`, `30m` `*/30 * * * *`, `1h` `0 * * * *`, `2h` `0 */2 * * *`, `6h`
  `0 */6 * * *`, `24h` `0 3 * * *`.

`apps/server/src/builder/copy-clock/workflow.ts`: `COPY_WORKFLOW = 'conexus-copy-run'` (contrato
guardado, como `AUTOMATION_WORKFLOW`, `run.ts:22-27`); um workflow de um passo, `createWorkflow({
id: COPY_WORKFLOW, options: { autoRestartActiveRuns: false }, … })`, cujo passo parseia o
`inputData` e chama `copies.run({ companyId, copyId }, abortSignal)`; `GONE` chama `remove`.
`conversations-of.ts` põe o workflow no mapa (`:170`) e, em `releaseFirst`, a remoção das agendas
das cópias da empresa (`states` e `remove`). `main.ts` monta `createCopies` com `clock: () =>
copyClock`, `connectors: () => connectors.copies` e `apps: () => apps.projectDatabase`, como
`connectors()` já é ligado tarde. O
`scheduler.onError` do Mastra, se o Conexus ainda não o liga, vai ao registro central (C50).

A forma de cada coisa:

- **Estados.** `CopySchedule`, `CopyRun.outcome` por `kind` no contrato (C22).
- **Ids.** `CopyId` e `CopyRunId` com marca, conferidos pelo `serve` na entrada e pela admissão
  antes de qualquer chamada ao Mastra (C23); o id da agenda é o id da cópia.
- **Donos.** `CopyInterval` e o padrão de `copies.ts`; os crons só em `copy-clock/clock.ts`; as
  frases de `copy-failures.ts`; o id do workflow em `workflow.ts` (C26).
- **Entrada externa.** Os parâmetros pelo esquema do contrato, no `serve`; o `inputData` e o
  `metadata` da agenda parseados por Zod no passo e em `states` (C27).
- **Modelo.** `builder/automations/automations.ts` cumpre C21, C23 e C26 para a agenda;
  `hub/apps/app-versions.ts` para a admissão numa leitura do Hub.

### As skills e a leitura

- `mastra` (`@mastra/core`, `apps/server/src/builder`): `node_modules/@mastra/core/dist/docs/`,
  `reference-schedules-overview.md`, `docs-workflows-scheduled-workflows.md`,
  `reference-workflows-workflow.md`.
- `organization-best-practices` (`better-auth`, `apps/server/src/hub`): papéis e permissões.
- `fastify-best-practices` (`apps/server/src`): só as rotas, que entram por `serve`.

### A ordem do trabalho

1. **Permissão.** `roles.ts`, `admission.ts`, `companies.ts`, `CompanyMay`, `test-may.ts`,
   `developer.test.ts`. Regras: S6, S10. Funções: `better-auth@1.7.8`: `createAccessControl`,
   `newRole`.
2. **Contrato e falhas.** `copies.ts`, `copy-failures.ts`, `index.ts`. Regras: C28, C29, C35, C40,
   C44, C48.
3. **As rotas** em `hub/copies/routes.ts`. Cada handler admite e chama o serviço (C14). Rodar agora
   lê a trava e responde `COPY_RUNNING` quando viva, e `HUB_UPDATING` com o Hub atualizando, antes
   de `clock.runNow`.
4. **O relógio** em `builder/copy-clock/`, as ligações em `conversations-of.ts` e `main.ts`.
   Funções: `@mastra/core@1.82.0`: `mastra.schedules.create/get/update/pause/resume/run/delete/list`,
   `createWorkflow({ options: { autoRestartActiveRuns: false } })`.
5. **Documentos.** `docs/architecture.md:206-216`: a linha "Copies' schedules" com a mesma forma das
   automações; a 0058 ganha a nota da reabertura.

### Como se prova

- Critérios 23 a 26: `hub/copies/routes.test.ts`, pela porta HTTP do Hub de teste (T5), com os
  papéis de `test-roles.ts`.
- Critérios 27 a 29: `builder/copy-clock/clock.test.ts`, com o Mastra de `builder/mastra` sobre o
  banco de teste e `schedulerTickMs` curto, como `builder/automations/scheduler.test.ts`, mas
  disparando com `runNow` e com uma agenda cujo próximo horário já venceu, sem esperar um minuto do
  relógio (T20, a #754). O formato da linha da agenda que o teste lê vem de uma gravação de `npm run
  record` (T26), a primeira em `platform/recordings/mastra/` para agendas.
- O critério 24: `developer.test.ts`.
- Local: os testes tocados, `npm run typecheck`, `npm run lint`, `npm run docs`.

### Parar se

- `schedules.update` numa agenda pausada a retomar, ao contrário do que a P1 do estudo provou:
  parar e dizer.
- `autoRestartActiveRuns: false` não impedir o recomeço no boot com o armazenamento do Hub: parar;
  a rodada órfã é premissa do cartão.

## U4 A página Cópias

**Base e modelo.** O commit da U3 no `main` (grupo B). Sonnet: telas com peças que já existem.

### As linhas da tabela

- **A página Cópias.** Modelos: `routes/_app/companies/$companyId/automations.index.tsx` e
  `automations.$automationId.tsx` (a lista e o histórico), `agents.index.tsx`; as peças
  `builder/automations/page.tsx`, `runs.tsx`, `badge.tsx` e `builder/agents/agent-list.tsx` (a linha
  que quebra no celular). A faixa: `routes/_app/companies/$companyId/route.tsx:63-78`. Peças de
  `ui/`: `table.tsx`, `list.tsx` (`PageTitle`), `block.tsx`, `pager.tsx`, `states.tsx` (`Loading`,
  `Empty`, `RouteReadFailure`, `NotFound`), `dialog.tsx` no tamanho `form` (V23), `select.tsx`,
  `dropdown-menu.tsx`, `badge.tsx` (V35), `code-block.tsx` para a consulta. Referência:
  `@mastra/core@1.82.0` `docs-workflows-scheduled-workflows.md:127` (atualizar a cada 5 s).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/copies/` | Cria `queries.ts`, `copy-list.tsx`, `copy-detail.tsx`, `new-copy.tsx`, `interval.tsx`, `text.ts`, `public.ts` e os testes | as rotas novas |
| `apps/web/src/routes/_app/companies/$companyId/` | Cria `copies.index.tsx`, `copies.$copyId.tsx`; muda `route.tsx` (a entrada **Cópias**) | o roteador |
| `apps/web/src/routeTree.gen.ts` | Gerado pelo plugin, nunca à mão (W1) | o roteador |
| `packages/hub-api/src/pages.ts` | Muda: as duas rotas em `PAGES` | o servidor (`sendPage`), o teste da web |
| `docs/reference/screens.md` | Muda: as duas linhas novas, Empresa, "owner, administrator, developer" | — |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** nada.

`apps/web/src/hub/copies/queries.ts`, tudo por `hubQuery` e `hubMutation` (W10, W11):
`copiesQuery(companyId)`, `copyModelsQuery(companyId)`, `copyRunsQuery(companyId, copyId, page)`,
e as mutações `enableCopy` (com a chave de tentativa, W24), `pauseCopy`, `resumeCopy`,
`changeCopyInterval`, `runCopy`. `copiesQuery` leva `refetchInterval` de 5 s enquanto alguma
`run.outcome.kind` for `RUNNING`, e nenhum quando não houver.

| Arquivo | Endereço | `loader` | Componentes |
| --- | --- | --- | --- |
| `copies.index.tsx` | `/companies/<c>/copies` | `readOrNotFound` de `copiesQuery` | `CopyList`; `pendingComponent: Loading`; `errorComponent: RouteReadFailure` |
| `copies.$copyId.tsx` | `/companies/<c>/copies/<id>?page=<ficha>` | `readOrNotFound(queryClient.fetchQuery(copyRunsQuery(...)))`, fresco (W12) | `CopyDetail`; `notFoundComponent: NotFound` |

`staticData: { place: 'Cópias' }`. As duas rotas recusam quem não tem `may.manageCopies` com
`notFound()` no `beforeLoad`, como Automações e Agentes (W34).

A forma de cada coisa:

- **Estados.** `CopySchedule.kind` e `CopyRun.outcome.kind` escolhem o estado em palavras: "Em dia"
  (última `COMPLETE`), "Rodando…" (`RUNNING`), "Pausada" (`PAUSED`), "Com erro" (última `ERROR`),
  "Sem relógio" (`MISSING`, com **Retomar**); a frase de um `ERROR` vem de `FAILURES` pelo código;
  `PARTIAL CAP` "Parcial; a próxima continua", `PARTIAL STOPPED` e `INTERRUPTED` "O Conexus
  reiniciou no meio; a próxima continua de onde parou" (C22, V35).
- **Ids.** `CopyId` por `params` com `idOrNotFound`, nunca colado no texto do endereço.
- **Donos.** As frases de falha de `FAILURES` por código; as frases de estado, de primeira vez e os
  rótulos dos intervalos em `text.ts`, uma vez cada (C26).
- **Entrada externa.** A resposta do Hub conferida por `hubQuery` com o esquema do contrato.
- **Modelo.** `builder/automations/page.tsx` e `runs.tsx` cumprem C21, C23 e C26.

### As skills e a leitura

- `router-core` (`node_modules/@tanstack/router-core/skills/router-core/`): `data-loading`,
  `search-params`, `not-found-and-errors`.
- `router-plugin`: "Route Refactor Workflow".
- `shadcn`: as regras de tabela, diálogo e vazio.
- `tanstack.com/query/latest/llms.txt`: `refetchInterval` e `fetchQuery`.

### A ordem do trabalho

1. `queries.ts`, `text.ts`, `public.ts`.
2. As duas rotas e a entrada **Cópias** na faixa, depois de Agentes, sob `may.manageCopies`, com um
   ícone de `lucide-react`. Regras: W1, W17, W30, W34.
3. `copy-list.tsx`: `PageTitle` "Cópias" e **Ligar uma cópia**; uma linha por cópia com as oito
   colunas, os números com `toLocaleString('pt-BR')` em algarismos tabulares (V23), a hora pelos
   formatos de `platform/` (datas), o menu da linha com **Rodar agora**, **Pausar** ou **Retomar**
   e **Intervalo**. Regras: V18, V23, V32, V35, V58.
4. `new-copy.tsx`: o diálogo `form` com conexão (só as que têm modelo), modelo (os do conector da
   conexão) e intervalo (padrão 30 minutos); React Hook Form com o esquema `EnableCopy` (W23); a
   chave de tentativa (W24).
5. `interval.tsx`: o diálogo com o `Select` dos seis intervalos.
6. `copy-detail.tsx`: o título com o dado, a fonte, o estado e o intervalo; "O que é copiado" com a
   consulta num bloco de código que rola dentro da sua caixa (V11, V18), a chave e a janela; as
   rodadas numa tabela com `Pager` (`param="page"`).
7. `PAGES` e `docs/reference/screens.md`.

### Como se prova

- Critérios 30 a 35: os testes de `apps/web/src/hub/copies/`, pelo roteador de teste da web com o
  Hub dublê e `mayOf` de `platform/test-may.ts`, como `builder/automations/automations.test.tsx`.
- Critério 36: o teste da web que confere o roteador contra `PAGES`.
- Critério 41: QA ([testing T25](../guides/testing.md)).
- Local: os testes tocados, `npm run typecheck`, `npm run lint`; `impeccable detect` nos arquivos
  mudados ([Impeccable](../reference/impeccable.md)).

### Parar se

- Uma peça de `ui/` precisar mudar de aparência: parar; é do trilho de desenho.
- A lista não caber a 1280 px com as oito colunas sem rolar de lado: parar e mostrar a captura;
  quais colunas saem é do fundador.

## U5 A liberação e as cópias em Dados

**Base e modelo.** O commit da U4, com a Capacidade 1 no `main`. Sonnet.

### As linhas da tabela

- **Liberar em Integrações do Projeto.** Ler `apps/web/src/hub/projects/project-integrations.tsx`
  (a seção das conexões, o modelo) e o seu teste.
- **As cópias liberadas em Dados.** Ler, no `main` com a Capacidade 1: `hub/apps/app-tables.ts`
  (`TableSchema`, `SCHEMA_SQL`, `catalogSql`, `appTableOf`), `hub/apps/app-rows.ts` (`appRowsOf`),
  `hub/apps/routes.ts`, `packages/hub-api/src/app-data.ts` (`AppTableSummary`, `listAppRows`), e na
  web `hub/apps/data.tsx`, `data-rows.tsx` e as rotas `$projectId_.data*.tsx`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/apps/` | Muda `app-tables.ts` (`TableSchema` ganha `'COPY'`), `routes.ts` (a rota das linhas de uma cópia); cria `copy-data.test.ts` | `main.ts` |
| `packages/hub-api/src/app-data.ts` | Muda: `AppTableSummary.schema` e `listCopyRows` | `apps/server`, `apps/web` |
| `apps/web/src/hub/projects/` | Cria `project-copies.tsx` e o teste; muda `project-integrations.tsx` (a seção) e `queries.ts` | a rota de Integrações do Projeto |
| `apps/web/src/hub/apps/` | Muda `data.tsx` (as duas seções), `queries.ts`, `public.ts`, `data.test.tsx` | as rotas de Dados |
| `apps/web/src/routes/_app/companies/$companyId/projects/` | Cria `$projectId_.data.copies.$table.tsx` | o roteador |
| `packages/hub-api/src/pages.ts`, `docs/reference/screens.md` | Muda: a rota nova | — |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** nada.

`packages/hub-api/src/app-data.ts`: `AppTableSummary` ganha `schema: z.enum(['APP', 'COPY'])`;
`listAppTables` → `NO_APP` ganha `copies: AppTableSummary[]` (as liberadas, vazio sem liberação);
`listCopyRows` é `listAppRows` em `GET
/api/companies/{companyId}/projects/{projectId}/copy-tables/{table}/rows`, com a mesma entrada, o
mesmo sucesso e as mesmas falhas. O caminho é `copy-tables` e não `copies/{table}`, para não dividir
o segmento com `{copyId}` das liberações.

`apps/server/src/hub/apps/app-tables.ts`: `TableSchema = 'APP' | 'COPY'`, `SCHEMA_SQL.COPY =
"'sync'"`; a lista lê as duas instruções do catálogo (uma por esquema) pelo mesmo login de leitura
e marca cada tabela com o seu `schema`; o `has_table_privilege` de hoje deixa passar só as
liberadas. A rota nova chama `appRowsOf` com `schema: 'COPY'`. Um Projeto sem app com uma
liberação já tem os logins (criados ao liberar, critério 20): a lista e as linhas das cópias leem
pelo login de leitura no host que o Hub guardou (`readAddress`, sem chamar o Neon) quando há
`project_copy` do Projeto, mesmo sem a linha `app`; sem liberação e sem app, `NO_APP` com `copies`
vazio, como na Capacidade 1.

A forma de cada coisa:

- **Estados.** `AppTableSummary.schema` separa as duas seções (C22).
- **Ids.** `AppTableName` como na Capacidade 1; o esquema é uma união fechada, nunca texto de fora
  (C23, D20).
- **Donos.** A lista de tabelas continua de `hub/apps/app-tables.ts`, para a página e o Construtor
  (C26); a liberação é de `hub/copies`, que a web lê por `listProjectCopies`.
- **Entrada externa.** Como na Capacidade 1.
- **Modelo.** `project-integrations.tsx` e a página Dados da Capacidade 1.

### As skills e a leitura

- `router-core`: `data-loading`, `path-params`.
- `shadcn`: lista e botões.
- `fastify-best-practices`: só a rota nova.

### A ordem do trabalho

1. O servidor: `TableSchema`, a lista com as cópias, `listCopyRows` e a rota. Regras: C14, D20, S10.
2. `project-copies.tsx`: a seção **Cópias** em Integrações do Projeto, com **Liberar** e **Tirar**
   por `grantProjectCopy` e `revokeProjectCopy`, sob `may.manageCopies`; os outros veem a lista e
   quem pode liberar (V29).
3. `data.tsx`: **Tabelas do app** e **Cópias liberadas**; a rota `…/data/copies/$table` com o mesmo
   `DataRows` da Capacidade 1, lendo `listCopyRows`.
4. `PAGES` e `docs/reference/screens.md`.

### Como se prova

- Critérios 38 e 39: `hub/apps/copy-data.test.ts`, pela porta HTTP do Hub de teste, com uma cópia
  ligada e liberada pela porta de `hub/copies` e outra não liberada, num Projeto com app e num sem.
- Critério 37: `project-copies.test.tsx`; critérios 40 e 43: `data.test.tsx`.
- Critério 41: QA.
- Local: os testes tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- A Capacidade 1 entrar no `main` com outra forma para o esquema da tabela (não `TableSchema`):
  seguir a forma do `main` e dizer no relatório.
- O login de leitura do app não enxergar `sync.<t>` depois do `GRANT`: parar; é premissa do cartão
  (critério 19).
