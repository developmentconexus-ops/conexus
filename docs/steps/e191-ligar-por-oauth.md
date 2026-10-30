# Etapa 19.1: Ligar por OAuth

## A página do fundador

**No fim desta etapa** a Ana liga o Mercado Livre da Padaria Sol em **Integrações** sem colar chave
nenhuma: toca **Ligar**, entra no Mercado Livre com a conta da loja, autoriza o Conexus e volta
vendo o que o Conexus lê, assunto por assunto. Quando o Mercado Livre recusa a ligação, ela vê "O
Mercado Livre pediu para conectar de novo." e um toque em **Conectar de novo** resolve. Por trás, o
**OAuth vira uma capacidade do kit**, que qualquer conector declara: o pedido de autorização, a
volta, a chave guardada e renovada uma vez só (mesmo com duas cópias do Hub) e o **Conectar de
novo**, que serve também ao Sankhya (abre a janela das chaves na mesma ligação). O Mercado Livre é o
primeiro conector a usar o OAuth; nada no Hub nem na tela é do Mercado Livre.

**O roteiro de uso.** Padaria Sol: Ana (dona) e Bruno (membro). No computador e no celular, com a
sua conta de vendedor do Mercado Livre (a conta principal, não a de um colaborador).

1. A Ana abre **Integrações** e vê o Mercado Livre em "Para ligar", com o seu logotipo,
   "Marketplace", uma linha do que ele é e **Ligar**.
2. Ela toca **Ligar**. A janela pede só o nome da ligação (já vem "Mercado Livre") e tem
   **Continuar no Mercado Livre**. Ela toca, entra no Mercado Livre com a conta principal e autoriza
   o Conexus. Com a conta de um colaborador, o Mercado Livre recusa, e a volta mostra a frase do
   Conexus e, embaixo, o que o Mercado Livre respondeu, como veio.
3. Volta ao Conexus, na página da ligação: "Mercado Livre", "conta PADARIASOL", "ligada por Ana em
   29/10", e o teste começa sozinho: "Testando as 27 leituras, uma por vez…". Aparecem os assuntos:
   Conta, Anúncios, Vendas, Envios, Perguntas, Mensagens, Reclamações, Promoções, Métricas,
   Faturamento e Mercado. Uma leitura que o app do Conexus não tem permissão de fazer diz "Recusada
   pelo Mercado Livre"; um assunto vazio diz "Lê, mas não havia nada para olhar".
4. Se você tiver uma segunda conta do Mercado Livre, a Ana toca **Ligar** de novo, dá o nome "Loja
   2" e autoriza com a outra conta: duas ligações do Mercado Livre na mesma empresa. Depois, numa
   segunda empresa sua, tenta ligar a conta da Padaria Sol: o Conexus recusa com "Essa conta já
   está ligada no Conexus. Use outra conta, ou desligue a outra ligação primeiro.",
   sem dizer de qual empresa.
5. Você tira a permissão do Conexus na sua conta do Mercado Livre e a Ana toca **Testar**: "O
   Mercado Livre pediu para conectar de novo." com **Conectar de novo**. Um toque, uma autorização,
   e o teste volta a funcionar na mesma ligação, com o mesmo nome.
6. O Bruno abre **Integrações** e a ligação: vê o estado e o último teste, sem botões, e, com a
   ligação recusada, "O Mercado Livre pediu para conectar de novo. Peça ao dono ou a um
   administrador."
7. A Ana toca **Desligar** e confirma: a ligação sai e as chaves saem do Hub.

**O que você faz, e quando.**
- **Antes do teste com o Hub de verdade** (não antes do código, que roda com um Mercado Livre de
  mentira):
  - **O app do Conexus no Mercado Livre** (`W1`), criado por você no DevCenter
    (`developers.mercadolivre.com.br`, "Minhas aplicações"), com a conta da empresa dona do Conexus,
    de preferência pessoa jurídica e com os dados validados (cada conta validada no Brasil cria um
    app só). Nele:
    - nome "Conexus" (o Mercado Livre não aceita "mercado" nem "livre" no nome), uma descrição de
      até 150 letras (é o que a loja lê ao autorizar) e o logotipo;
    - o endereço de volta: `https://<o endereço do Hub>/integrations/return`, exatamente assim;
    - **PKCE ligado**;
    - os escopos de `S1`: leitura e acesso offline, sem escrita;
    - as permissões de `T1`: Usuários; Publicação e sincronização; Vendas e envios; Comunicação pré
      e pós-venda; Métricas do negócio; Promoções, cupons e descontos; Faturamento;
    - nenhum tópico de notificação e nenhum escopo do Mercado Pago.
  - **O Client ID e o Client Secret** desse app, que você põe num arquivo de segredo do servidor de
    São Paulo, ao lado dos outros segredos do Hub (o firstmate diz o nome e o formato do arquivo na
    hora). Nunca no chat, num commit ou no repositório.
  - **A sua conta de vendedor** para o roteiro (a principal), e uma segunda conta, se tiver, para o
    passo 4.
- **No começo:** aprova esta página. A sua aprovação é também a palavra que a regra de dados D11
  pede para a lista de permissões do banco ganhar a tabela da autorização em andamento (a U1).
- **No fim:** faz o roteiro no computador e no celular, diz o que viu e aprova os textos da tela.

**Fica de fora.**
- **Escrever no Mercado Livre** (responder perguntas, mensagens, estoque e preço): a 20.1. Pela sua
  `S1`, o app pede só leitura agora; na 20.1 cada empresa toca **Conectar de novo** uma vez para dar
  a escrita.
- **O app próprio de uma empresa** (`W1`): o app é um só, o do Conexus. O kit já diz de quem é o
  app, então o "app próprio" entra depois, empresa por empresa, quando uma pedir, sem que as outras
  autorizem de novo. Antes de ele entrar, perguntamos por escrito ao suporte de integradores do
  Mercado Livre se o Conexus pode guardar o Secret de uma empresa.
- **Uma renovação automática das chaves paradas.** A chave de renovação do Mercado Livre dura 6
  meses; uma ligação que ninguém usa nesse tempo pede **Conectar de novo**. Um serviço que acordasse
  só para renovar manteria o banco acordado (regra D27). Volta com o executor de tarefas da 20.2.
- **Os avisos do Mercado Livre** (tópicos): a 20.2. **O limite de chamadas por app**: a 20, quando os
  apps chamarem. Nesta etapa só o Testar chama: 27 leituras por teste.
- **As leituras de `T1` que ficam de fora**: Publicidade (Mercado Ads), os dados pessoais do
  comprador (CPF, e-mail, telefone: a resposta os apaga, como o RH do Sankhya), os pagamentos do
  Mercado Pago (outro app), Flex, Turbo, etiquetas, anexos, imóveis, veículos e serviços. Cada uma
  entra quando uma empresa pedir.
- **Uma frase própria para cada recusa do Mercado Livre na autorização** (o colaborador, por
  exemplo): a tela mostra a frase geral e o que o Mercado Livre respondeu, como veio. Uma frase
  própria entra se, no roteiro, a resposta dele não bastar.
- **Renomear uma ligação**, como na 19.
- **Das pendências marcadas para o próximo cartão:** nenhuma toca o OAuth. A #470 (o status 4 do
  Sankhya) é do fechamento da 19.

**As decisões suas nesta etapa.**

Dadas em 2026-10-29, ao estudo da 19.1: "Decisões: `S1` / `T1` / `U1` / `V2`, tem muitas pessoas ou
empresas que podem ter mais de uma conta no mercado livre, isso não pode ser limite. E isso não é
sobre mercado livre, temos que tomar muito cuidado e seguir nossa metodologia [...] e não ficar
preso ao especifico ao mercado livre sendo que temos uma plataforma de conectores para
desenvolver". E, ao estudo do app, `W1`. O cartão os segue assim:
- **`S1`**: o app pede leitura e acesso offline. O Mercado Livre bloqueia apps "quando usar apenas
  dados de leitura, sem consumo de apis que gerem valor" (`INTEGRATORS_DATA_INFRACTION`); a 20.1 traz
  a escrita. O gatilho para rever: um bloqueio do app com esse motivo.
- **`T1`**: 27 leituras em 11 assuntos (a lista está na U0).
- **`U1`**, para todo conector que diz de que conta é a chave: a mesma conta do fornecedor fica numa
  ligação só em todo o Conexus. O Conexus só sabe qual é a conta depois que a pessoa autoriza; se o
  Mercado Livre derrubar a chave antiga quando a mesma conta autoriza de novo (é uma hipótese: a
  documentação diz só que vale a última chave de renovação), a outra ligação passa a pedir
  **Conectar de novo**, mesmo com a segunda recusada.
- **`V2`**: **Conectar de novo** com outra conta do fornecedor é aceito e troca a conta da ligação; a
  página mostra a conta nova. Uma conta já ligada em outro lugar é recusada como no `U1`.
- **`W1`**: um app do Conexus; as chaves dele vêm de um lugar só, que responde de quem é o app.
- A regra da 19 vale aqui: várias ligações do mesmo conector, cada uma com o seu nome. E a do erro
  nativo: toda recusa do fornecedor aparece com o que ele respondeu, e nenhum erro é engolido.

**`Y`. O que o Desligar faz no fornecedor.** O Desligar da 19 apaga a ligação e as chaves do Hub, sem
chamar ninguém. Com o OAuth, a autorização continua na conta do Mercado Livre da loja até ela mesma a
tirar (o Magis5, por exemplo, chama o Mercado Livre para tirar a autorização ao desligar).
- **`Y1` (aprovada com a página, 2026-10-29: "Aprovado 19.1"):** o Desligar continua só no Hub, como na 19:
  nunca falha porque o fornecedor está fora, e serve a todo conector igual. Ligar a mesma conta de
  novo depois funciona. Tirar a autorização no fornecedor entra quando um conector declarar como (o
  Mercado Livre tem uma rota para isso, ainda não lida a fundo).
- **`Y2`:** o Desligar pede ao fornecedor que tire a autorização antes de apagar; com o fornecedor
  fora, o Desligar falha ou apaga mesmo assim.
- Veredito: `Y1` nativo (o Desligar da 19); `Y2` embrulhado, um passo a mais no kit.

**O tamanho.** Cerca de 2.650 linhas de código, abaixo do teto de 4.000 da regra L2.

**O que mudou depois da aprovação** (2026-10-30, a opção B do estudo do Sankhya de verdade, decidida
pelo firstmate sob as suas palavras "Fazer o básico bem feito [...] em vez de querer complicar"):
cada leitura do Mercado Livre diz só a rota, a entrada, onde está a lista e como pagina, e as linhas
chegam como o Mercado Livre as mandou, com o envelope conferido; não há um formato campo a campo
escrito por nós, que o fornecedor de verdade desmentiria (o Sankhya desmentiu). Os dados pessoais do
comprador continuam saindo. O formato real das páginas do Mercado Livre é medido no seu primeiro uso
(o roteiro, passo 3), e o dublê passa a ter esse formato. Por isso o código fica menor.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U0 | O OAuth no kit (o tipo, a autorização, a troca, a renovação, a leitura da resposta, a conta reportada, a conta no pedido) e o Mercado Livre: a definição, 27 leituras em 11 assuntos, o dublê, a conferência contra a documentação, a skill por assunto | `packages/connectors/` | [testing](../guides/testing.md) | a 19 no `main` (já está: PRs 449 e 453) |
| U1 | A ligação ganha `revision`, `refresh_until`, `account_ref`, `account_label` e a chave única da conta; a tabela `connectors.connection_sign_in`; as permissões do banco (D11) | `apps/server/migrations/`, `apps/server/src/hub/connectors/tables.ts`, `apps/server/database-grants.sql`, `apps/server/src/platform/catalog.test.ts` | [data](../guides/data.md) | a 19 no `main` |
| U2 | As rotas da autorização, a chave e a sua renovação com a trava, o executor que troca e renova, o Testar do OAuth, o Conectar de novo dos dois tipos, as chaves do app na configuração, as falhas e a decisão 0057 | `apps/server/src/hub/connectors/`, `apps/server/src/platform/config.ts`, `packages/hub-api/src/`, `tests/e2e/live-hub.ts`, `docs/decisions/` | [security](../guides/security.md) | U0, U1 |
| U3 | O Ligar sem campos, a página da volta, a conta na ligação, o Conectar de novo dos dois tipos, as frases | `apps/web/src/hub/connectors/`, `apps/web/src/routes/_app/integrations/`, `packages/hub-api/src/pages.ts` | [web](../guides/web.md) | U2; a U4 da 19 (https://github.com/developmentconexus-ops/conexus/pull/454) no `main` |

U0 e U1 correm em paralelo: não dividem pasta. Podem começar logo depois da aprovação desta página
(regra L1), porque o kit e o Hub da 19 já estão no `main`; uma unidade cujo arquivo a rodada de
consertos da 19 tocar espera essa rodada entrar. A U3 espera a U4 da 19 entrar no `main`.

**Orçamento de código alterado.** U0: ~1.320 (kit OAuth ~150, definição e respostas ~120, 27
leituras ~620, dublê ~350, conferência ~80). U1: ~120. U2: ~830. U3: ~380. Total da etapa:
~2.650. A skill, os testes e os gerados ficam fora da conta.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U0 | `oauth2Code` recusa, ao declarar, uma URL de autorização que não é `https://` e uma mesma resposta de erro em `grant` e em `app`; `defineConnector` recusa `account.kind: 'reported'` com um `auth` que não é `oauth2_code` | `packages/connectors/src/kernel/oauth.test.ts`, "a declaração recusa" | must |
| 2 | U0 | `authorizeUrl` leva `response_type=code`, `client_id`, o `redirect_uri` exato, `state`, `code_challenge` pelo método SHA-256, e nunca o Secret; com `origin` dado, a mesma rota sobre a origem do dublê | `kernel/oauth.test.ts`, "o endereço de autorização" | must |
| 3 | U0 | `codeRequest` e `refreshRequest` mandam tudo no corpo de formulário, nada na URL; `readGrant` dá `GRANT_REFUSED` para cada erro de `grant`, `APP_REFUSED` para cada um de `app`, e `UNREADABLE` para outro erro ou um 2xx fora do esquema, sem carregar o corpo de um 2xx | `kernel/oauth.test.ts`, "a troca e a renovação" | must |
| 4 | U0 | A conformidade passa o Mercado Livre com o seu dublê: cada leitura é `GET` na origem fixa, com classe, assunto, sonda e parte da skill; o dublê recusa um código usado duas vezes, um verificador errado, um `redirect_uri` diferente e uma chave de renovação usada ou antiga | `packages/connectors/src/mercado-livre/mercado-livre.test.ts`, `runConformance` e "o dublê recusa" | must |
| 5 | U0 | O dublê dá uma chave de renovação nova a cada renovação e só aceita a última; uma nova autorização da mesma conta derruba a chave anterior (a hipótese de `U1`, modelada) | `mercado-livre/fake.test.ts` | must |
| 6 | U2 | `POST …/connection-sign-ins` pela dona dá `{ url }` na origem de autorização configurada; o membro recebe 404; sem as chaves do app na configuração, `CONNECTOR_NOT_CONFIGURED`; para um conector `client_credentials`, `CONNECTOR_UNKNOWN`; um nome já usado, `CONNECTION_NAME_TAKEN`, sem linha criada | `apps/server/src/hub/connectors/sign-ins.test.ts`, "começar" | must |
| 7 | U2 | Completar com o código do dublê cria a ligação (`NEW`, o nome, `account.label`) e responde `LINKED`. A mesma autorização de novo, de outra pessoa, de outra empresa, ou passados 600 s: `CONNECTION_SIGN_IN_EXPIRED`, nada criado | `sign-ins.test.ts`, "completar" | must |
| 8 | U2 | `{ refused: true }` encerra a autorização sem criar nada; o dublê recusando a troca dá `REFUSED` com o que ele respondeu (`native`); nenhum dos dois cria ligação | `sign-ins.test.ts`, "recusada" | must |
| 9 | U2 | Nenhuma resposta, log ou erro leva uma chave: o teste planta a chave de renovação e o código do dublê e não os acha no log do Hub nem na lista; o selo copiado para outra linha é `SEAL_REFUSED` | `connections-oauth-logs.test.ts` | must |
| 10 | U2 | O Hub sobe sem `HUB_CONNECTOR_APPS_FILE`; com o arquivo vazio, ilegível ou fora do formato, não sobe (`CONFIG_INVALID`, S31); com um conector que o kit não tem, ou que não é `oauth2_code`, também não sobe | `apps/server/src/platform/config.test.ts`, "as chaves dos apps" (o formato); `connections.test.ts`, um Hub de `spawnHub` com esse arquivo (os dois conectores) | must |
| 11 | U2 | Dois Testar ao mesmo tempo com a chave de acesso vencida: o dublê conta **uma** renovação, os dois `WORKING` | `connections-refresh.test.ts`, "uma renovação" | must |
| 12 | U2 | Dois processos do Hub (`spawnHub` duas vezes, um banco), cada um com um Testar na mesma ligação vencida: o dublê conta **uma** renovação | `connections.test.ts`, "entre cópias do Hub", no molde do seu `spawnHub` (`connections.test.ts:263`): o mesmo ambiente com o dublê e o arquivo de apps nos dois, a sessão e a ligação criadas pelo primeiro | must |
| 13 | U2 | Quem espera e tem o prazo acabando enquanto a renovação do dublê demora responde `UNREACHABLE` no seu prazo, não nos 30 s da trava; a renovação de quem a tem ainda grava, e a próxima chamada usa a chave nova | `connections-refresh.test.ts`, "o prazo de quem espera": o Hub de teste com `testDeadlineMs` de 1 s e o dublê com `slow(2000)`; a renovação tem o seu próprio prazo de 10 s, então quem a tem grava aos 2 s; um terceiro Testar não renova (o contador fica em 1) | must |
| 14 | U2 | O dublê tira a autorização: Testar → 401 → uma renovação forçada → `invalid_grant` → `AUTH_REFUSED` com `native`, a ligação `NEEDS_REAUTH`; um segundo Testar recusa sem renovar | `connections-refresh.test.ts`, "recusada pelo fornecedor" | must |
| 15 | U2 | O dublê responde `invalid_client` à renovação: Testar dá `APP_REFUSED` com `native`, o estado não muda e o log tem `CONNECTOR_APP_REFUSED` em nível de erro; 429 ou 5xx na renovação: `UNREACHABLE`; uma resposta que o kit não lê: `UNREADABLE`; nos dois, estado e chaves sem mudar e a trava solta | `connections-refresh.test.ts`, "o app recusado" | must |
| 16 | U2 | Conectar de novo numa ligação `NEEDS_REAUTH` troca o selo, sobe `revision`, põe `NEW`, limpa o último teste e mantém o id e o nome. Com outra conta do fornecedor (`V2`), a ligação passa a essa conta; com uma conta já ligada em outra ligação, `CONNECTION_ACCOUNT_ELSEWHERE` e nada muda | `sign-ins.test.ts`, "conectar de novo" | must |
| 17 | U2 | Conectar de novo no Sankhya (`PUT …/credential`) troca as chaves da mesma ligação, põe `NEW`, mantém id e nome; chaves fora do esquema: `CONNECTION_CREDENTIAL_INVALID`, nada muda | `connections-reconnect.test.ts` | must |
| 18 | U1, U2 | A mesma conta do fornecedor ligada por uma segunda empresa, ou uma segunda vez na mesma: `CONNECTION_ACCOUNT_ELSEWHERE`, sem nomear a outra empresa; o banco recusa direto uma segunda linha com a mesma conta | `tables.test.ts`, "a conta numa ligação só"; `sign-ins.test.ts`, "outra empresa" | must |
| 19 | U2 | Testar com o dublê recusando um grupo de permissão (403 `PA_UNAUTHORIZED_RESULT_FROM_POLICIES`): essas leituras `REFUSED` com `native`, as outras `READS`, o resultado `WORKING` | `connections-refresh.test.ts`, "uma permissão faltando" | must |
| 20 | U3 | Num navegador de verdade (Chrome e WebKit, 1366 e 390, os dois temas): **Ligar** vai ao consentimento do dublê e volta; a página mostra a conta e testa sozinha; a autorização recusada no dublê mostra a frase e o `native`; a ligação recusada mostra **Conectar de novo** e volta a funcionar; o membro não tem botões | QA (`conexus-qa`), o relatório do pull request da etapa | must |
| 21 | U0 | Cada leitura tem a sua rota na página da documentação que ela cita, baixada na hora; uma operação cuja rota não está na página falha | `mercado-livre/docs.test.ts` (`MERCADO_LIVRE_DOCS_ONLINE=1`, `npm run test:docs -w @conexus/connectors`) | must |
| 22 | U0 | `mensagensDoPacote` sempre manda `mark_as_read=false`; tirar o parâmetro faz um teste falhar | `mercado-livre/operations.test.ts`, "não marca como lida" | must |
| 23 | U0 | Cada leitura devolve as linhas como vieram, com o envelope conferido (`{ linhas, temMais }`): um campo a mais ou de outro tipo numa linha passa; a lista faltando ou de outro tipo é `UNREADABLE`; e nenhuma linha leva e-mail, telefone, CPF ou CNPJ do comprador, mesmo quando o dublê os manda | `mercado-livre/operations.test.ts`, "sem dados do comprador" | must |
| 24 | U3 | A volta com `state` faltando ou estragado mostra "Esse endereço não é de uma ligação." e não chama o Hub; a volta com `error=access_denied` manda `{ refused: true }` e mostra "Você não autorizou o Conexus no <conector>."; a página troca o seu endereço na história antes de chamar o Hub, então voltar não manda o código de novo | `apps/web/src/hub/connectors/sign-in-return.test.tsx` | must |
| 25 | U3 | Um conector `oauth2_code` abre a janela só com o nome e **Continuar no <conector>**, nunca campos; um `client_credentials` com `NEEDS_REAUTH` abre a janela das chaves com o nome travado e manda `PUT …/credential` | `apps/web/src/hub/connectors/integrations-oauth.test.tsx` | must |
| 26 | Fundador | O roteiro, passos 1 a 7, no Hub de verdade com o app e a conta dele (fora da CI, S40) | o uso, no livro de aprovações | must |
| 27 | U3 | A volta com a sessão vencida: o `_app` manda ao login com `redirect` igual ao endereço inteiro, com `code` e `state` (`apps/web/src/routes/_app/route.tsx:9`); depois de entrar, a tela volta a esse endereço e completa a ligação; um `redirect` de outra origem é recusado pelo login (`SameOriginPath`, `routes/_public/login.tsx:13`) | `sign-in-return.test.tsx`, "sessão vencida" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Janela de ligar, OAuth | o nome com o nome do conector | — | **Continuar no <conector>** ocupado até o `url` chegar | a frase da falha (`CONNECTOR_NOT_CONFIGURED`, `DATABASE_UNAVAILABLE`) na janela; `CONNECTION_NAME_*` no campo | — | o membro não vê **Ligar** | — |
| A volta (`/integrations/return`) | "Voltando da autorização…" | — | o mesmo, até a resposta | `REFUSED`, `APP_REFUSED`, `UNREACHABLE`: a frase e o `native`, com "Voltar a Integrações" | `state` ruim: "Esse endereço não é de uma ligação." | `NOT_FOUND` da rota (outra empresa): "Esse endereço não é de uma ligação." | `CONNECTION_SIGN_IN_EXPIRED`, `CONNECTION_ACCOUNT_ELSEWHERE`, a recusa da pessoa: a frase, com "Voltar a Integrações" |
| Página da ligação | `NEW`: "ainda não testada", e o teste começa sozinho quando a tela vem da volta | — | "Testando as 27 leituras, uma por vez…" (da 19) | `APP_REFUSED`: "O app do Conexus foi recusado pelo <conector>. Avise o suporte." e o `native` | da 19 | da 19, mais sem **Conectar de novo** | `NEEDS_REAUTH`: OAuth "O <conector> pediu para conectar de novo."; chaves "As chaves foram recusadas pelo <conector>."; os dois com **Conectar de novo**; o membro, a frase com "Peça ao dono ou a um administrador." |
| Lista | da 19 | da 19 | da 19 | da 19 | — | da 19 | o selo de `NEEDS_REAUTH` por tipo: "Pede para conectar de novo" (OAuth), "Chaves recusadas" (chaves) |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `ConnectorEntry.auth` (`'client_credentials'` ou `'oauth2_code'`) | U2, de `connector.auth.kind` | U3: qual janela abre, qual selo e frase de `NEEDS_REAUTH` |
| `Connection.account` (`{ label } \| null`) | U2, de `account_label` | U3: "conta PADARIASOL" na página e na lista |
| `connection.account_ref` | U2, na volta e no Conectar de novo | o banco (a chave única); U2 (`Account.ref` no pedido) |
| `connection.revision`, `refresh_until` | U2 (`tokens.ts`; o Conectar de novo sobe `revision`) | U2 (`tokens.ts`) |
| `connection_sign_in.*` | U2 (`startSignIn`) | U2 (`take`, uma vez) |
| `SignInStarted.url` | U2 | U3: `location.assign` |
| `SignInCompleted` (`LINKED`, `REFUSED`, `APP_REFUSED`, `UNREACHABLE`, `UNREADABLE`, `CANCELLED`; `connector` nos que não são `LINKED`) | U2 | U3: a página da volta, a frase e o nome do conector |
| `TestResult` `APP_REFUSED` | U2 | U3: a frase da página da ligação |

Uma etapa com tela leva o desenho de caixas. A volta e a janela são novas; a lista e a página são as
da 19 com duas linhas a mais.

```text
1280 px, a janela de ligar (OAuth)           1280 px, a volta
  [M] Ligar o Mercado Livre                         Voltando da autorização…
  Nome da ligação                               (recusada)
  [ Mercado Livre            ]                  O Mercado Livre recusou a autorização.
  Você vai ao Mercado Livre entrar com a        Mercado Livre respondeu 400, código
  conta da loja e autorizar o Conexus.          invalid_operator_user_id: …
           [Cancelar] [Continuar no Mercado Livre]          [Voltar a Integrações]

1280 px, a página da ligação                 390 px, a página da ligação
  < Integrações                                 < Integrações
  [M] Mercado Livre · Marketplace               [M] Mercado Livre
  Loja 2 · conta PADARIASOL                     Loja 2 · conta PADARIASOL
  Ligada por Ana em 29/10   [Testar] [⋯]        O Mercado Livre pediu para
  O Mercado Livre pediu para conectar de novo.  conectar de novo.
                         [Conectar de novo]     [Conectar de novo]
```

Nenhuma captura do produto antigo: ele não tinha OAuth de conector (o estudo, `e0353c36`). A
janela segue `link-dialog.tsx` da U4 da 19; a volta segue a página de estado de `ui/states.tsx`.

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Começar a autorização (`INSERT connection_sign_in`) | cada uma a sua linha; as vencidas da pessoa saem (S22) | uma instrução: nada fica pela metade | banco: `DATABASE_UNAVAILABLE`; nenhum terceiro é chamado | `CONNECTION_SIGN_IN_STARTED` (empresa, conector, pessoa) | 6 |
| Completar (`DELETE … RETURNING`, a troca, a conta, `INSERT` ou `UPDATE connection`) | a linha é tomada uma vez: a segunda recebe `CONNECTION_SIGN_IN_EXPIRED` | tomada primeiro e trocada sem transação aberta (D22): uma troca recusada não deixa nada; uma gravação recusada depois da troca (nome tomado, conta em outra ligação) deixa a autorização gasta e a pessoa começa de novo | o fornecedor fora: `UNREACHABLE` com o que ele disse; a autorização está gasta; banco fora na gravação: `DATABASE_UNAVAILABLE` e a chave trocada se perde (o fornecedor a esquece em 6 meses) | `CONNECTION_LINKED` ou `CONNECTION_RECONNECTED`; `CONNECTION_SIGN_IN_REFUSED` com status e código | 7, 8, 16, 18 |
| Renovar a chave (`UPDATE … refresh_until`, a renovação, `UPDATE … sealed, revision`) | a trava: um só renova, os outros releem a cada 200 ms até `revision` mudar, a trava cair ou o próprio prazo | **a resposta perdida depois de o fornecedor girar a chave** (prazo, 5xx depois de processar, banco fora no `store`): a chave nova se perde e a velha já morreu; a próxima renovação é `invalid_grant` → `NEEDS_REAUTH`. Nenhum fornecedor dá idempotência aqui; a gravação segue a resposta num comando curto | o fornecedor fora antes de responder: chaves sem mudar, `UNREACHABLE`; sem as chaves do app na configuração: `CONNECTOR_NOT_CONFIGURED`, nada chamado; banco fora: `DATABASE_UNAVAILABLE` | `CONNECTION_TOKEN_REFRESHED`; `CONNECTION_REFRESH_UNANSWERED` (aviso); `CONNECTOR_APP_REFUSED` e `CONNECTION_REFRESH_UNREAD` (erro) | 11 a 15 |
| Conectar de novo, OAuth | como completar; duas na mesma ligação: a primeira a gravar vence pela `revision` (C38) e a outra recebe `CONNECTION_SIGN_IN_EXPIRED`; se a perdedora era a última autorização que o fornecedor aceita, a chave guardada morre na próxima renovação e a ligação pede Conectar de novo outra vez (duas pessoas reconectando a mesma ligação no mesmo minuto) | uma transação para a troca | como completar | `CONNECTION_RECONNECTED` | 16 |
| Conectar de novo, chaves (`UPDATE connection SET sealed, linked_at`) | as duas gravam; vale a última, como a última que a pessoa colou; um Testar em andamento com as chaves velhas não grava por cima (`linked_at`) | uma instrução | banco: `DATABASE_UNAVAILABLE` | `CONNECTION_RECONNECTED` | 17 |
| Desligar durante uma renovação | o `store` com `revision` não acha a linha: nada se grava, a chave nova se perde junto com a ligação | — | — | da 19 | nenhum novo: o `store` sem linha não grava nada, e o Desligar é o da 19 (o seu critério 13) |

## A tabela de referência

As referências estão na estante de estudo (`~/conexus-study/refs/`, `MANIFEST.md`): Nango `e6c6131`,
n8n `2e855356`, Activepieces `f34c43cd`, Airbyte `8aed3123`; o OS em `e0353c36`. A documentação do
Mercado Livre foi lida inteira em 2026-10-29 (221 páginas do menu brasileiro, `developers.mercadolivre.com.br/pt_br/<página>`)
e conferida pelo Context7 (`/websites/developers_mercadolivre_br_pt_br`). Nenhuma das ferramentas da
estante tem conector do Mercado Livre.

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O tipo OAuth no kit | U0 | `packages/connectors/src/kernel/auth.ts:19-31`: só `ClientCredentialsAuth` | Nango `packages/providers/providers.yaml:186-200` (`auth_mode: OAUTH2`, `authorization_url`, `token_url`); Airbyte `airbyte-integrations/connectors/source-mercado-ads/manifest.yaml:1227-1251` (a URL de troca, `offline_access`, `invalid_grant` e `invalid_client` como erro de configuração) | a URL de autorização, a rota da troca e os erros que pedem autorizar de novo, declarados | embrulhado: `oauth2Code({ app, authorize, token, answer, refusals })` ao lado de `clientCredentials`, e funções puras que montam os pedidos; o kit nunca guarda segredo (S36) | critérios 1 a 3 | `W1` | `kernel/oauth.ts` |
| De quem é o app | U0, U2 | `platform/config.ts` lê segredos de arquivos (S31) | o estudo do app: todos os hubs têm um app só (Magis5, Omie.Hub, AM Gestor); o Odoo, o app da empresa | o app do integrador, autorizado por cada loja | embrulhado: `app: { from: 'installation' }` no kit e `appKeysOf` no Hub como o único lugar das chaves; `HUB_CONNECTOR_APPS_FILE` (um arquivo, um par por conector) | critérios 6, 10 | `W1` | `hub/connectors/apps.ts` |
| Os fatos do OAuth do Mercado Livre | U0 | nenhum | `autenticacao-e-autorizacao` (atualizada em 29/12/2025) | **documentado**: a chave dura 6 h; a de renovação, 6 meses, uso único, só a última; `redirect_uri` fixo e `https`; o corpo no formulário (`desenvolvimento-seguro`) | nativo (o do fornecedor) | critérios 2, 4, 5 | não precisa | `mercado-livre/definition.ts` |
| PKCE | U0, U2 | `apps/server/src/builder/model-accounts/claude/sign-in.ts:41-55` (SHA-256, `randomBytes(32)`) | o Mercado Livre: opcional, obrigatório quando ligado no app, SHA-256 | **documentado** | nativo: SHA-256, como o `main` | critério 4 (o dublê recusa um verificador errado) | o fundador liga "PKCE" no app | — |
| A autorização em andamento | U1, U2 | `builder.model_account_sign_in` (`model-accounts/tables.ts:193-226`) tomada uma vez por `DELETE … RETURNING` (`model-accounts/sign-ins.ts:109-138`) | n8n `packages/cli/src/oauth/oauth.service.ts:481-506` (o `state` em cache, 5 min, preso ao usuário); Nango, uma linha apagada no primeiro uso | uma linha por tentativa, vida curta, presa à pessoa, usada uma vez | embrulhado (a forma do `main`): `connectors.connection_sign_in`, 600 s (`CODE_SECONDS`, decisão 0049) | critérios 6, 7 | não precisa | `hub/connectors/tables.ts`, `sign-ins.ts` |
| A volta | U2, U3 | `serve()` por tipo de acesso; `page` responde qualquer endereço fora de `/api/` sem olhar o site de origem (`platform/access.ts:141`, S48); `POST …/model-account-sign-ins/{signInId}` completa | o Mercado Livre: `redirect_uri` estático, sem parte variável, o `state` leva o resto | **documentado** | embrulhado: uma página da tela (`/integrations/return`, `page`, sem efeito, C36) lê `code`, `state` e `error`, troca o próprio endereço na história e chama `POST …/connection-sign-ins/{signInId}` (`session`, Origin conferida, S24) | critérios 7, 8, 24 | não precisa | `apps/web/src/routes/_app/integrations/return.tsx` |
| A sessão na volta | U3 | better-auth 1.7.8, cookie `sameSite: "lax"` (`node_modules/better-auth/dist/cookies/index.mjs:35`) | — | uma navegação de topo vinda do fornecedor leva o cookie Lax | nativo | — | não precisa | — |
| Onde a chave fica | U1, U2 | `connectors.connection.sealed`, contexto `{ purpose: 'connection', kind, provider }` (`hub/connectors/rows.ts:97`) | o Mercado Livre `gestao-de-identidades-e-acessos-oauth-e-tokens`: criptografada em repouso, nunca em log nem URL | **documentado** | nativo (S32): a mesma coluna guarda `{ access, refresh, expiresAt }` inteiro; a conta em colunas abertas `account_ref` e `account_label` | critério 9 | não precisa | — |
| A renovação com várias chamadas e várias cópias | U1, U2 | `builder/model-accounts/claude/store.ts:19-20` (`LEASE_MS`, `WAIT_STEP_MS`), `:50-66` (`reserve`), `:68-85` (`store`), `:91-99` (`release`), `:130-142` (quem espera) | Nango `SET NX PX 10000` em Redis (`packages/server/lib/services/connections/credentials/refresh.ts:445-452`, os 10 s em `:449-451`); n8n `leaseTtlMs 30_000` e, no fim do prazo, renova sem coordenar (`oauth.ts:305-309`); Activepieces Redlock 60 s | um só renova; os outros releem depois | nativo do `main`: a mesma forma em `connectors.connection`; quem espera para no menor entre o fim da trava e o próprio prazo. O "renova mesmo assim" do n8n fica de fora: com chave de uso único, derruba a autorização | **provado** no estudo: `claude-refresh.test.ts`, 10 de 10 em `81ca579a`; critérios 11 a 13 | não precisa | `hub/connectors/tokens.ts` |
| Quando renovar | U2 | `EARLY_MS = 300_000` (`claude/sign-in.ts:22`) | Nango e Activepieces 15 min; n8n 60 s e no 401; o Mercado Livre "renove … somente quando perder validade" | uma folga antes de vencer, e no 401 | embrulhado: 5 min antes, e uma vez forçada quando uma leitura responde 401 | critérios 11, 14 | não precisa | — |
| A recusa do fornecedor → `NEEDS_REAUTH` | U0, U2 | o estado `NEEDS_REAUTH` existe; S34 | os erros do Mercado Livre: `invalid_grant`, `unauthorized_client` (a autorização); `invalid_client`, `unauthorized_application`, `invalid_scope` (o app) | **documentado** | embrulhado: o conector declara as duas listas (`refusals`); a da autorização grava `NEEDS_REAUTH`; a do app não muda o estado e vai ao log como erro | critérios 14, 15 | não precisa | — |
| Conectar de novo | U2, U3 | a 19 o prometeu "para todos os tipos" (o seu cartão, "Fica de fora") | Mastra Connect `needs_reauth`; Composio `EXPIRED` | autorizar de novo a mesma ligação | embrulhado: OAuth, uma autorização com `connectionId`; chaves, `PUT …/credential` na mesma ligação | critérios 16, 17, 25 | `V2` | — |
| Uma conta do fornecedor numa ligação só | U1, U2 | `Connector.account` só `{ kind: 'none' }` (`kernel/definition.ts:14-18`) | Activepieces `getConnectionIdentifier` (`packages/pieces/framework/src/lib/property/authentication/common.ts:23`), sem chave única; o Mercado Livre "Permitimos usar apenas o último REFRESH_TOKEN gerado" | o conector diz de que conta é a chave | embrulhado: `{ kind: 'reported', exclusive: true, who }`; chave única `(connector_id, account_ref)`; o 23505 vira `CONNECTION_ACCOUNT_ELSEWHERE` sem nomear a outra empresa (S10) | critério 18 | `U1` | — |
| O Testar de uma ligação OAuth | U2 | `hub/connectors/probe.ts:58-143`: `executor.login`, cada leitura em ordem, `TOKEN_EXPIRED` → login de novo uma vez | Airbyte `check`; Nango `verification.endpoints` | — | embrulhado: o login vira "a chave de acesso" (`tokens.ts`), a selada enquanto vive, senão uma renovação com trava; 401 → uma renovação forçada → repete | critérios 14, 19 | não precisa | — |
| As leituras | U0 | as 23 do Sankhya (`sankhya/operations/*`) | as páginas do Mercado Livre, 2026-10-29 (a lista na U0) | — | nativo: 27 leituras em 11 assuntos, cada uma com a rota, a entrada, a chave da lista e a paginação, e as linhas como vieram com o envelope conferido (a opção B do estudo do Sankhya de verdade, 2026-10-30); o id do vendedor chega pelo segundo argumento de `request` | critérios 4, 21 | `T1` | `mercado-livre/operations/{conta,anuncios,vendas,envios,perguntas,mensagens,reclamacoes,promocoes,metricas,faturamento,mercado,index}.ts` |
| A conferência com a documentação | U0 | `sankhya/spec-source.ts:4-6`: as páginas baixadas na hora, nunca guardadas | nenhuma faz: o Mercado Livre não publica OpenAPI nem `llms.txt` (`/llms.txt` 404; nenhum `openapi` nas 221 páginas) | — | remendo: um teste baixa, na hora, a página que cada leitura cita e confere que a rota está no texto; mais fraco que o do Sankhya (sem esquema de resposta) | `docs/decisions/0057` (escrita pela U2), critério 21 | a palavra da 19, "não guardar e baixar na hora" | `mercado-livre/docs-source.ts`, `docs.test.ts` |
| O Mercado Livre de mentira | U0 | `sankhya/fake.ts` (`node:http` em 127.0.0.1) | o Mercado Livre não tem ambiente de testes (`realizacao-de-testes`) | — | embrulhado: `fake.ts` com `/authorization`, `/oauth/token`, `/users/me` e as 27 leituras, com chaves para cada recusa | critérios 4, 5, 11 a 15 | não precisa | `mercado-livre/fake.ts`, `fake-data.ts` |
| Uma leitura que escreve | U0 | — | o Mercado Livre, `mensagens-post-venda`: "as mensagens serão marcadas como lidas. Caso você não queira … mark_as_read=false" | **documentado** | embrulhado: a leitura manda sempre `mark_as_read=false` | critério 22 | não precisa | — |
| Os dados pessoais do comprador | U0 | o RH do Sankhya ficou de fora | `/questions/{id}` traz e-mail, telefone e nome do comprador; `/orders/billing-info` o CPF/CNPJ | **documentado** | embrulhado: os esquemas de saída não têm esses campos; `billing-info` não é leitura | critério 23 | `T1` | — |
| A tela Integrações | U3 | U4 da 19 (https://github.com/developmentconexus-ops/conexus/pull/454): `apps/web/src/hub/connectors/link-dialog.tsx`, `text.ts` (`stateBadge` "Chaves recusadas") | o cartão da 19 | — | embrulhado: por `auth`, a janela só com o nome; a conta na ligação; **Conectar de novo** nos dois tipos | critérios 20, 25 | o fundador aprova os textos no fim | `apps/web/src/hub/connectors/*` |
| Uma biblioteca de OAuth | fica de fora | nenhuma instalada | Nango, ELv2 e preso ao seu servidor; `@n8n/client-oauth2`, licença de uso sustentável | só as chamadas HTTP | embrulhado, rejeitado: o kit já monta os pedidos e o executor os manda; uma biblioteca seria um segundo remetente ao lado do executor (S36) | — | não precisa | — |
| Tirar a autorização no fornecedor ao desligar | fica de fora | o Desligar da 19 só apaga no Hub (`hub/connectors/connections.ts:142-151`) | Magis5 chama o Mercado Livre ao desligar ("Revogar Acesso") | — | nativo, o da 19 (`Y1`) | — | **`Y`** | — |

**A medida do transplante.** Nada vem do código antigo: o OS não tinha OAuth de conector. A forma
vem do próprio `main` (a autorização e a trava da assinatura do Claude), escrita de novo em
`hub/connectors`: a regra `hub-does-not-import-builder` proíbe importar `builder/model-accounts`, e o
`jscpd` recusa a cópia. Por isso a U2 escreve a mesma forma com os nomes da ligação, não copia o
arquivo.

**A dívida.** Cada uma vai para a seção 11 da arquitetura no fechamento:
- Uma ligação parada por 6 meses pede Conectar de novo (D27). Gatilho: o primeiro `NEEDS_REAUTH`
  por isso, ou o executor de tarefas da 20.2.
- Uma resposta de renovação perdida depois do giro força Conectar de novo. Gatilho: um
  `CONNECTION_REFRESH_UNANSWERED` seguido de `NEEDS_REAUTH` no log.
- A forma real das páginas do Mercado Livre não foi medida (nenhuma chamada ao Mercado Livre antes
  do uso). Gatilho: o primeiro uso do fundador, que a mede; o dublê passa a ela.
- A conferência com a documentação não tem esquema de resposta. Gatilho: uma leitura falhando numa
  conta de verdade; a resposta, sem dado da empresa, vira dado do dublê.
- A troca do Secret do app: trocar o arquivo e reiniciar dentro dos 7 dias em que o Mercado Livre
  aceita os dois. Gatilho: a primeira troca; a linha do procedimento se escreve então.
- A segunda autorização da mesma conta pode derrubar a primeira, mesmo recusada (`U1`, hipótese).
  Gatilho: o roteiro do fundador (passo 4) ou um caso visto.

## U0 O OAuth no kit e o Mercado Livre

**Base e modelo.** `main` no commit em que a página for aprovada. Sonnet: o Sankhya é o modelo de
cada parte.

### As linhas da tabela

O tipo OAuth no kit; de quem é o app (a parte do kit); os fatos do OAuth do Mercado Livre; PKCE (o
dublê); a recusa do fornecedor (as listas); uma conta numa ligação só (a declaração); as leituras; a
conferência com a documentação; o Mercado Livre de mentira; uma leitura que escreve; os dados
pessoais do comprador.

Leia antes: `packages/connectors/src/kernel/auth.ts` inteiro (o modelo de `oauth2Code`),
`kernel/definition.ts:14-65` (`AccountIdentity` e `defineConnector`), `kernel/operation.ts:65-99`
(`Operation.request`, `requestOf`), `kernel/conformance.ts` (o `Fake` e o `login`),
`sankhya/definition.ts`, `sankhya/fake.ts`, `sankhya/spec-source.ts` e um arquivo de operações
(`sankhya/operations/vendas.ts`). `auth.ts` cumpre C21 (`kind` literal), C26 (o esquema da
credencial nasce dos campos) e C27 (a resposta pelo `answer` Zod); é o modelo. `definition.ts`
cumpre C23 (`ConnectorId` marcado por parse).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Muda `auth.ts` (a união `Auth`), `definition.ts` (`AccountIdentity`), `operation.ts` (`request` com a conta), `conformance.ts` (o OAuth); cria `oauth.ts` | `apps/server/src/hub/connectors/` (U2) |
| `packages/connectors/src/mercado-livre/` | Cria | `src/index.ts` |
| `packages/connectors/src/index.ts` | Muda: `CONNECTORS = [sankhya, mercadoLivre]`, as exportações novas | o Hub |
| `packages/connectors/package.json` | Muda: `test:docs` roda as duas conferências | — |

### Os contratos que a unidade cria

```ts
// kernel/oauth.ts
export type AppKeys = Readonly<{ clientId: string; clientSecret: string }>
/** Whose app the connection authorizes (W1): the installation's now; `{ from: 'connection'; fields }` later. */
export type AppSource = Readonly<{ from: 'installation' }>
export type OAuth2CodeAuth = Readonly<{
  kind: 'oauth2_code'
  app: AppSource
  authorize: Readonly<{
    url: `https://${string}`         // the browser's page, never fetched
    pkce: 'S256'
    params: Readonly<Record<string, string>> // fixed extras, `scope` among them; {} for Mercado Livre (scopes live on its app)
  }>
  token: Readonly<{ path: `/${string}` }> // on the connector's origin (a token on another host is out of 19.1), form body
  // refreshToken absent: the provider keeps the old one (RFC 6749 §6), and the Hub keeps it too
  answer: z.ZodType<Readonly<{ accessToken: string; refreshToken?: string; expiresInSeconds: number }>>
  refusals: Readonly<{ grant: readonly string[]; app: readonly string[] }> // the body's `error` (RFC 6749 §5.2)
}>
export function oauth2Code(auth: Omit<OAuth2CodeAuth, 'kind'>): OAuth2CodeAuth
export function authorizeUrl(
  auth: OAuth2CodeAuth,
  a: Readonly<{ clientId: string; redirectUri: string; state: string; challenge: string }>,
  origin?: string, // a double's origin: the authorize path placed on it
): URL
export function codeRequest(
  auth: OAuth2CodeAuth, app: AppKeys,
  a: Readonly<{ code: string; redirectUri: string; verifier: string }>,
): TokenRequest
export function refreshRequest(auth: OAuth2CodeAuth, app: AppKeys, refreshToken: string): TokenRequest
export type GrantAnswered =
  | Readonly<{ kind: 'OK'; accessToken: string; refreshToken: string | null; expiresInSeconds: number }>
  | Readonly<{ kind: 'GRANT_REFUSED' | 'APP_REFUSED' | 'UNREADABLE'; native: Native }>
export function readGrant(auth: OAuth2CodeAuth, answer: ProviderAnswer): GrantAnswered

// kernel/auth.ts
export type Auth = ClientCredentialsAuth | OAuth2CodeAuth

// kernel/definition.ts
// One path segment, never `/`, `?` or `#`: it goes into request paths (C23, parsed in `who.answer`)
export const AccountRef = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/).brand('AccountRef')
export type AccountOf = Readonly<{ ref: AccountRef; label: string }>
type AccountIdentity =
  | Readonly<{ kind: 'none' }>
  // The provider says whose the grant is; `exclusive`: one connection per account in all of Conexus (U1).
  | Readonly<{ kind: 'reported'; exclusive: true; who: Readonly<{ path: `/${string}`; answer: z.ZodType<AccountOf> }> }>

// kernel/operation.ts
export type Account = Readonly<{ ref: AccountRef | null }> // the connection's account_ref, parsed again when opened; null for `none`
request(input: I, account: Account): ProviderRequest
export function requestOf<I>(operation: Operation<I, unknown>, input: unknown, account: Account): ProviderRequest
```

- **Os estados:** `GrantAnswered` separa por `kind` (C21). `Auth` por `kind`.
- **Os ids:** `AccountRef` marcado, criado só por parse (`who.answer` e, no Hub, ao abrir a ligação); `ConnectorId` e `OperationId` como estão.
- **O dono de cada fato:** os fatos do Mercado Livre (URLs, listas de recusa, `who`) em
  `mercado-livre/definition.ts`; a regra "uma conta numa ligação só" é `exclusive: true`, lida pelo
  Hub (U1, U2), nunca escrita em outro lugar.
- **O esquema Zod de cada entrada de fora:** `answer` (`access_token`, `refresh_token`,
  `expires_in`, `user_id` ignorado), `who.answer` (`/users/me`: `id` como texto, `nickname`), e o
  envelope de cada leitura: `z.looseObject` com a chave da lista e a paginação; cada linha
  `z.looseObject({})`, sem esquema por campo; a saída é `{ linhas: Record<string, unknown>[],
  temMais: boolean | null }`, a mesma das leituras do Sankhya depois da opção B da 19. O ajudante
  que monta essa saída é um só, no kit (C26): se a correção da 19 o deixou em `sankhya/`, a U0 o
  move para `kernel/rows.ts` sem mudar o que ele faz. Um objeto único (`/users/me`, `/orders/{id}`)
  vem como lista de uma linha. Os campos de identidade que um `probe` lê (`id`, `pack_id`,
  `shipping.id`, `user_product_id`, `key`) são lidos com o seu próprio esquema, com coerção de
  texto e número.
- `readGrant` lê o `error` do corpo (texto); 2xx no esquema é `OK`; 2xx fora do esquema é
  `UNREADABLE` com `body: null` (como `readToken`, `auth.ts:91-95`); fora de 2xx, `error` na lista
  `grant` → `GRANT_REFUSED`, na lista `app` → `APP_REFUSED`, senão `UNREADABLE`, sempre com `native`
  (`locateOf` e mais o `error` como `code` quando `code` falta).

### As skills e a leitura

`packages/connectors/` não tem linha em `docs/reference/stack.md` além de `zod` (`zod.dev/llms.txt`,
sem skill). Leia `pstack:typescript-best-practices` para os tipos.

### A ordem do trabalho

1. **Apagar antes de somar:** nada a apagar. O comentário "OAuth comes in 19.1" de `auth.ts:19` e o de
   `definition.ts:16-17` saem.
2. `kernel/oauth.ts`: os contratos acima. `oauth2Code` congela e confere (`https://`, as duas listas
   sem repetição entre elas). `codeRequest`: `grant_type=authorization_code`, `client_id`,
   `client_secret`, `code`, `redirect_uri`, `code_verifier`, num `TokenRequest` (`form`, `headers:
   { accept: 'application/json' }`, `query: {}`). `authorizeUrl` põe os `params` antes dos seus. `refreshRequest`:
   `grant_type=refresh_token`, `client_id`, `client_secret`, `refresh_token`. Regras: C21, C27, S36.
   O teste do kernel declara também um conector OAuth inventado, que não é o Mercado Livre (outra
   rota de troca, `params` com `scope`, outras listas de recusa), e passa os critérios 1 a 3 com ele:
   prova que nada do OAuth está preso ao Mercado Livre.
3. `kernel/definition.ts`: `AccountIdentity` com `reported`; `defineConnector` recusa `reported` sem
   `oauth2_code`. `kernel/operation.ts`: `request(input, account)` e `requestOf(…, account)`; as 23 do
   Sankhya não mudam (um parâmetro a menos é aceito pelo TypeScript).
4. `kernel/conformance.ts`: o `Fake` ganha uma variante OAuth; a conformidade do OAuth faz o caminho
   inteiro contra o dublê: `authorizeUrl` → o dublê responde 302 com `code` e `state` → `codeRequest`
   → `who` → cada leitura com a conta. As provas de credencial nos pedidos ("puts no credential value
   in any request but the login") valem com o Secret e as chaves no lugar dos campos.
5. `mercado-livre/definition.ts`: `id: 'mercado-livre'`, `name: 'Mercado Livre'`, `category:
   'Marketplace'`, `origin: 'https://api.mercadolibre.com'`, `authorize.url:
   'https://auth.mercadolivre.com.br/authorization'`, `token.path: '/oauth/token'`, `refusals: { grant:
   ['invalid_grant', 'unauthorized_client'], app: ['invalid_client', 'unauthorized_application',
   'invalid_scope'] }`, `account: { kind: 'reported', exclusive: true, who: { path: '/users/me', … } }`,
   `oneRequestAtATime: false`, o logotipo oficial em `logo.svg`: só o símbolo quadrado, sem o nome
   escrito (a regra do fundador para todo conector, 2026-10-29: "a logo do Mercado Livre é só a
   logo, sem escrita"), da página de marca do Mercado Livre, como o do Sankhya; `version: '1.0.0'`.
6. `mercado-livre/operations/*.ts`: as 27 leituras, um arquivo por assunto, como o Sankhya. Cada uma
   cita a sua página (`docs: 'slug'`) para a conferência. A lista (`T1`; ● são as do núcleo):

| Assunto | Leitura | Pedido | Página |
| --- | --- | --- | --- |
| Conta | ● `conta` | `GET /users/me` | `usuarios-e-aplicativos` |
| Anúncios | ● `anuncios` | `GET /users/{seller}/items/search` (`status`, `seller_sku`, `offset`, `limit` ≤100; `search_type=scan` além de 1000) | `itens-e-buscas` |
| | ● `anunciosDetalhe` | `GET /items/bulk?ids=` (≤20) | `itens-e-buscas` |
| | `descricao` | `GET /items/{id}/description` | `descricao-de-produtos` |
| | `estoque` | `GET /user-products/{up}/stock` (100 por minuto) | `convivencia-full-e-flex` |
| | `qualidade` | `GET /item/{id}/performance` | `qualidade-das-publicacoes` |
| Vendas | ● `pedidos` | `GET /orders/search?seller=` (`order.status`, datas, `sort`, `offset`, `limit`) | `gerenciamento-de-vendas` |
| | ● `pedido` | `GET /orders/{id}` | `gerenciamento-de-vendas` |
| | `pacote` | `GET /packs/{id}` | `gerenciamento-de-pacotes` |
| Envios | ● `envio` | `GET /shipments/{id}` com `x-format-new: true` | `gerenciamento-de-envios` |
| | `prazoDoEnvio` | `GET /shipments/{id}/sla` | `gerenciamento-de-envios` |
| | `estoqueFull` | `GET /inventories/{id}/stock/fulfillment` | `estoque-full` |
| Perguntas | ● `perguntas` | `GET /questions/search?seller_id=&api_version=4` | `gerenciamento-perguntas-respostas` |
| | `tempoDeResposta` | `GET /users/{seller}/questions/response_time` | `gerenciamento-perguntas-respostas` |
| Mensagens | `mensagensNaoLidas` | `GET /messages/unread?role=seller&tag=post_sale` | `mensagens-post-venda` |
| | `mensagensDoPacote` | `GET /messages/packs/{pack}/sellers/{seller}?tag=post_sale&mark_as_read=false` | `mensagens-post-venda` |
| Reclamações | ● `reclamacoes` | `GET /post-purchase/v1/claims/search?players.user_id=&players.role=respondent&status=opened` | `gerenciar-reclamacoes` |
| | `reclamacao` | `GET /post-purchase/v1/claims/{id}` | `gerenciar-reclamacoes` |
| | `devolucao` | `GET /post-purchase/v2/claims/{id}/returns` | `gerenciar-devolucoes` |
| Promoções | `promocoes` | `GET /seller-promotions/users/{seller}?app_version=v2` | `gerenciar-promocoes` |
| Métricas | ● `visitas` | `GET /users/{seller}/items_visits?date_from&date_to` (≤150 dias) | `metricas-visitas` |
| Faturamento | `periodosDeFaturamento` | `GET /billing/integration/monthly/periods?group=ML` | `faturamento-relatorios` |
| | `cobrancasDoPeriodo` | `GET /billing/integration/periods/key/{key}/summary/details?group=ML` | `faturamento-relatorios` |
| | `notaFiscalDoPedido` | `GET /users/{seller}/invoices/orders/{order}` | `faturador` |
| Mercado | ● `tendencias` | `GET /trends/MLB` | `tendencias` |
| | `maisVendidos` | `GET /highlights/MLB/category/{id}` | `mais-vendidos` |
| | ● `tarifaDeVenda` | `GET /sites/MLB/listing_prices?price&category_id&listing_type_id` | `custos-por-vender` |

   As páginas são os nomes que o estudo leu; o builder confere cada um ao escrever a conferência
   (passo 8) e corrige o nome, nunca a rota. `{seller}` vem de `account.ref`; um id de outra leitura
   vem por `from` (`pedido` parte de `pedidos`, `envio` de `pedido`, `pacote` de `pedido`,
   `mensagensDoPacote` de `pacote`, `reclamacao` e `devolucao` de `reclamacoes`, `cobrancasDoPeriodo`
   de `periodosDeFaturamento`, `notaFiscalDoPedido` de `pedidos`, `anunciosDetalhe`, `descricao` e
   `qualidade` de `anuncios`, `estoque` de `anunciosDetalhe`, `estoqueFull` de `anunciosDetalhe`,
   `maisVendidos` e `tarifaDeVenda` de `anunciosDetalhe`). As respostas: 401 → `TOKEN_EXPIRED`; 403
   → `REFUSED`; o 206 com `X-Content-Missing` em pedidos → `UNREADABLE`, nunca lista vazia; 404 de
   "não encontrado" só onde a página o documenta, como o Sankhya (`answers.ts`). Cada leitura declara
   a chave da lista (`results`, `orders`, `questions`, `data`… como a página escreve) e a
   paginação: `paging.total` com `offset` e `limit` (anúncios, pedidos, perguntas, reclamações),
   `scroll_id` na busca `scan`, ou nenhuma (`temMais: null`). Os dados do comprador saem por uma
   lista `omit` de chaves da leitura (`buyer.email`, `buyer.phone`, `buyer.billing_info`…), aplicada
   a cada linha antes de ela sair; o resto da linha passa como veio.
7. `mercado-livre/fake.ts` e `fake-data.ts`: `node:http` em 127.0.0.1, como `sankhya/fake.ts`;
   `/authorization` responde 302 para o `redirect_uri` com `code` e `state` (chaves: `refuse` →
   `error=access_denied`; `operator` → a troca dá 400 `invalid_operator_user_id`; `account(ref,
   label)` escolhe a conta); `/oauth/token` (o código uma vez, o verificador, o `redirect_uri` exato;
   a renovação de uso único, só a última, e uma nova autorização da mesma conta derruba a anterior;
   chaves `revoke`, `invalidClient`, `slow(ms)`, `rateLimited`; um contador de renovações);
   `/users/me`; as 27 leituras com dados inventados (S40), um grupo de permissão recusável (403
   `PA_UNAUTHORIZED_RESULT_FROM_POLICIES`), e `expireAccess()` → 401. Os dados do comprador vão no
   dublê (para o critério 23 provar que saem). As linhas do dublê têm a forma das páginas da
   documentação até o primeiro uso do fundador; nesse uso, a forma real de cada página (as chaves e
   os tipos, nunca um valor) é medida e o dublê passa a ela, num pull request de conserto (S40).
8. `mercado-livre/docs-source.ts` e `docs.test.ts`: como `sankhya/spec-source.ts` (as páginas
   públicas baixadas na hora com intervalo, teto de tempo e de bytes; nada guardado), com
   `MERCADO_LIVRE_DOCS_ONLINE=1`; cada leitura tem a sua rota (o método e o caminho, com os `{…}` como
   o texto da página os escreve) no texto da página que cita.
9. A skill em `mercado-livre/skill/`, `SKILL.md` e uma referência por assunto, como a do Sankhya:
   o que cada leitura responde, os limites de página, as janelas (pedidos 12 meses, perguntas sem
   resposta 7 meses), que as linhas vêm como o Mercado Livre as manda (o app parseia o que usa na
   sua fronteira, C27) e o aviso de que nenhuma escrita existe.

### Como se prova

`npm run test -w @conexus/connectors` (os critérios 1 a 5, 22 e 23); `npm run test:docs -w
@conexus/connectors` uma vez, à mão, com a saída no pull request (critério 21). Os critérios 1 e 3 e
o 22 falham hoje porque `oauth.ts` e as leituras não existem. Cada teste chama o kit pela sua porta
(`src/index.ts`) ou pela conformidade (T5).

### Parar se

- Uma página citada não traz a rota que o estudo leu: a leitura sai da lista com o motivo no pull
  request, e o firstmate leva ao fundador (é `T1`).
- O logotipo oficial não passa a conformidade da 19: pare e reporte.

## U1 A tabela da ligação OAuth

**Base e modelo.** `main` no commit aprovado. Sonnet.

### As linhas da tabela

A autorização em andamento (a tabela); onde a chave fica (as colunas da conta); a renovação (as
colunas da trava); uma conta numa ligação só (a chave única).

Leia antes: `apps/server/src/hub/connectors/tables.ts`, a migração
`apps/server/migrations/20261029024246_e19_connection` e a de permissões
`20261029024300_e19_connection_grants`, `apps/server/database-grants.sql` (a parte de
`connectors`), `builder/model-accounts/tables.ts:51-99` e `:193-226` (o modelo da conta com
`revision` e `refresh_until`, e o da autorização em andamento). `connection` cumpre C21 (`state` com
`CHECK`) e C26 (`CONNECTION_STATES` de `hub-api`); é o modelo.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/connectors/tables.ts` | Muda `connection`; cria `connectionSignIn` | U2 |
| `apps/server/migrations/` | Cria duas: a das tabelas e a das permissões | o `migrate` |
| `apps/server/database-grants.sql`, `apps/server/src/platform/catalog.test.ts` | Muda | a CI (D11) |
| `apps/server/src/hub/connectors/tables.test.ts` | Muda | — |

### Os contratos que a unidade cria

```ts
// connection, colunas novas
revision: integer('revision').notNull().default(0),
refreshUntil: instant('refresh_until'),
accountRef: text('account_ref'),     // the provider's account id (AccountRef); null for `none`
accountLabel: text('account_label'), // its name as the provider shows it (nickname)
// CHECK connection_account: (account_ref IS NULL) = (account_label IS NULL), account_label 1..120
// UNIQUE INDEX connection_account_key ON (connector_id, account_ref) WHERE account_ref IS NOT NULL

// connectors.connection_sign_in
id: uuid pk, companyId: text, personId: text, connectorId: text,
connectionId: uuid null → connection(id) ON DELETE CASCADE, // set for Conectar de novo
name: text null,          // the name for a first link; null when connectionId is set
connectionRevision: integer null, // the connection's revision when Conectar de novo started (C38)
sealed: bytea, keyId: text, // the PKCE verifier, sealed to the row
expiresAt: timestamptz
// FK (company_id, person_id) → member ON DELETE CASCADE, as model_account_sign_in_member_fkey
// CHECK connection_sign_in_target: (connection_id IS NULL) <> (name IS NULL),
//   and (connection_id IS NULL) = (connection_revision IS NULL)
// RLS: company_id = scoped company and person_id = scoped person, as model_account_sign_in
```

A chave única vale entre empresas: o índice não olha a política da linha, e o 23505 não diz qual
linha bateu.

### As skills e a leitura

As linhas de `drizzle-orm` e `drizzle-kit` em `docs/reference/stack.md`: `orm.drizzle.team/llms.txt`
e a skill `drizzle` do pacote (só a linha de comando).

### A ordem do trabalho

1. As colunas e a tabela em `tables.ts`; a migração gerada pelo `drizzle-kit`, conferida à mão (o
   índice parcial, os `CHECK`). Regras: D1, D33, C21.
2. A migração de permissões, num pull request só dela dentro da unidade, como a 19 fez (D11): o papel
   da empresa (`hub_company`) ganha `SELECT, INSERT, DELETE` em `connection_sign_in`, `SELECT` e
   `UPDATE` nas quatro colunas novas de `connection` (as permissões são por coluna,
   `database-grants.sql:245-263`) e `UPDATE` em `linked_by` e `linked_at`, que o Conectar de novo
   troca (as outras já têm); nada mais. `database-grants.sql` e o
   instantâneo do catálogo mudam juntos. Rode `npm run check-migrations` (a memória do projeto: ele
   recusa um `SET` solto em qualquer `.ts`).
3. `tables.test.ts`: a segunda linha com a mesma conta, em outra empresa, é recusada pelo banco
   (critério 18); o `CHECK` de alvo da autorização.

### Como se prova

`node --test apps/server/src/hub/connectors/tables.test.ts` e `catalog.test.ts`, com o Postgres local
de superusuário `postgres` e `conexus_owner` sem superusuário, como a CI. O critério 18 falha hoje: a
coluna não existe.

### Parar se

- O papel da empresa precisa ler `sealed` de `connection` para alguma coisa desta etapa: não pode
  (a 19 o fechou); pare e reporte.

## U2 A ligação OAuth no Hub

**Base e modelo.** `main` com U0 e U1. **Opus**: concorrência entre processos sobre uma chave de uso
único, e um contrato que cruza o kit, o Hub e a tela.

### As linhas da tabela

De quem é o app (a parte do Hub); PKCE (o começo); a autorização em andamento; a volta (a rota);
onde a chave fica; a renovação; quando renovar; a recusa do fornecedor; Conectar de novo; uma conta
numa ligação só; o Testar do OAuth; a conferência com a documentação (a decisão 0057).

Leia antes: `hub/connectors/` inteiro (`connections.ts`, `executor.ts`, `probe.ts`, `testing.ts`,
`rows.ts`, `routes.ts`, `public.ts`), `builder/model-accounts/claude/store.ts` inteiro (o modelo da
trava, que cumpre C21 com `state` e C26 com `LEASE_MS`), `builder/model-accounts/sign-ins.ts:57-138`
(começar e tomar), `packages/hub-api/src/connectors.ts` e `connector-failures.ts`,
`platform/config.ts:186-235`, `platform/test-hub-process.ts:86` (`spawnHub`). Não importe nada de
`builder/` (`hub-does-not-import-builder`); escreva a forma de novo.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/connectors/` | Cria `apps.ts`, `tokens.ts`, `sign-ins.ts`; muda `executor.ts`, `probe.ts`, `testing.ts`, `connections.ts`, `rows.ts`, `routes.ts`, `public.ts` | o servidor (`public.ts`) |
| `apps/server/src/platform/config.ts` | Muda: `HUB_CONNECTOR_APPS_FILE` | o Hub, `tests/e2e/live-hub.ts` |
| `packages/hub-api/src/connectors.ts`, `connector-failures.ts`, `pages.ts` (só `REDIRECT_PATH`) | Muda | o servidor, a tela (U3) |
| `tests/e2e/live-hub.ts` | Muda: o dublê do Mercado Livre e o arquivo de apps inventado | o QA |
| `docs/decisions/0057-connections-by-oauth.md`, `docs/index.md` | Cria, muda | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/connectors.ts
export const ConnectionSignInId = z.uuid().brand('ConnectionSignInId')
ConnectorEntry: + auth: z.enum(['client_credentials', 'oauth2_code'])   // fields: [] for oauth2_code
Connection:     + account: z.object({ label: z.string() }).nullable()
TestResult:     + z.object({ result: z.literal('APP_REFUSED'), native: Native, connection: Connection })
testConnection: failures + CONNECTOR_NOT_CONFIGURED (a refresh needs the app keys)

startConnectionSignIn  POST /api/companies/{companyId}/connection-sign-ins   session
  body { connector: string, name: string } | { connectionId: ConnectionId }
  201 { url: z.url() }   // the sign-in id travels only in `state`
  failures: READ_FAILURES, CONNECTOR_UNKNOWN (also a client_credentials connector), CONNECTOR_NOT_CONFIGURED,
            CONNECTION_NAME_INVALID, CONNECTION_NAME_TAKEN, CONNECTION_NOT_FOUND
completeConnectionSignIn  POST /api/companies/{companyId}/connection-sign-ins/{signInId}   session
  body { code: string ≤ 2048 } | { refused: true }
  200 SignInCompleted =
    | { result: 'LINKED', connection: Connection }
    | { result: 'REFUSED' | 'APP_REFUSED' | 'UNREADABLE', connector: string, native: Native }
    | { result: 'UNREACHABLE', connector: string, native: Native.nullable() }
    | { result: 'CANCELLED', connector: string }              // { refused: true }
  failures: READ_FAILURES, CONNECTION_SIGN_IN_EXPIRED, CONNECTION_ACCOUNT_ELSEWHERE,
            CONNECTION_NAME_TAKEN, CONNECTION_NOT_FOUND, CONNECTOR_NOT_CONFIGURED, SEAL_REFUSED
reconnectConnection  PUT /api/companies/{companyId}/connections/{connectionId}/credential   session
  body { credential: PastedCredential }
  200 { connection: Connection }
  failures: READ_FAILURES, CONNECTION_NOT_FOUND, CONNECTION_CREDENTIAL_INVALID, CONNECTOR_UNKNOWN (an oauth2_code connector)

// connector-failures.ts, rows (category, status, phrase)
CONNECTOR_NOT_CONFIGURED     SYSTEM 503 'Esse conector ainda não está disponível neste Conexus. Avise o suporte.'
CONNECTION_SIGN_IN_EXPIRED   USER   410 'Essa autorização venceu ou já foi usada. Ligue de novo.'
CONNECTION_ACCOUNT_ELSEWHERE USER   409 'Essa conta já está ligada no Conexus. Use outra conta, ou desligue a outra ligação primeiro.'

// apps/server/src/platform/config.ts
HUB_CONNECTOR_APPS_FILE?: path → connectorApps: ReadonlyMap<string, AppKeys>
//  the file: JSON { "<connector id>": { "clientId": "...", "clientSecret": "..." } }, strict, nonempty values

// hub/connectors/apps.ts: the one place that answers whose app it is (W1)
export function appKeysOf(apps: ReadonlyMap<ConnectorId, AppKeys>, connector: Connector): AppKeys
//  'installation' → the map, else Failure('CONNECTOR_NOT_CONFIGURED')

// hub/connectors/executor.ts
OpenedConnection: + revision: number, accountRef: string | null
Executor: + grant(where: Where, connector: Connector, request: TokenRequest, secrets: readonly string[], deadlineMs: number)
              : Promise<GrantAnswered | Unreachable>
          + who(where: Where, connector: Connector, token: BearerToken, deadlineMs: number)
              : Promise<{ kind: 'OK'; account: AccountOf } | Unreadable | Unreachable>
// `Where` = { connectionId } | { signInId } plus the connector: what a log line carries

// hub/connectors/tokens.ts
export type Access = {
  /** The bearer for one call: client_credentials logs in; oauth2_code the sealed one, or one leased refresh. */
  token(opened: OpenedConnection, a: { force: boolean; deadlineMs: number }): Promise<Login | AppRefused>
}
type AppRefused = Readonly<{ kind: 'APP_REFUSED'; native: Native }>
const LEASE_MS = 30_000, WAIT_STEP_MS = 200, EARLY_MS = 300_000
const ConnectionTokens = z.object({ access: z.string().min(1), refresh: z.string().min(1), expiresAt: z.number() })

// hub/connectors/sign-ins.ts
const SIGN_IN_SECONDS = 600
export function startSignIn(deps, input: Viewer & ({ connector: string; name: string } | { connectionId: ConnectionId }))
export function completeSignIn(deps, input: Viewer & { signInId: ConnectionSignInId; answer: { code: string } | { refused: true } })
```

- **Os estados:** `SignInCompleted` e `TestResult` por `result`; o resultado de `token` por `kind`.
- **Os ids:** `ConnectionSignInId` marcado, conferido no parse da rota; a linha tomada só com a pessoa
  e a empresa da sessão (C23).
- **O dono de cada fato:** `appKeysOf` é o único leitor de `connectorApps`; `tokens.ts` o único que
  escreve `revision` e `refresh_until` fora do Conectar de novo; `REDIRECT_PATH = '/integrations/return'`
  em `hub-api/src/pages.ts`, escrito pela U2, lido pelo Hub (`${publicOrigin}${REDIRECT_PATH}`) e pela tela (C26).
- **O `state`:** `<companyId>.<signInId>`; nada mais viaja nele.
- **O esquema de cada entrada de fora:** o arquivo de apps (`z.strictObject` por conector); as
  respostas do fornecedor pelo kit (`answer`, `who.answer`); o selo aberto por `ConnectionTokens`
  (um que não passa é `SEAL_REFUSED`, como `valuesOf`, `executor.ts:60-68`).

### As skills e a leitura

As linhas de `fastify` e `drizzle-orm` de `docs/reference/stack.md`: a skill `fastify-best-practices`
e `orm.drizzle.team/llms.txt`.

### A ordem do trabalho

1. **Apagar antes de somar:** `refusedKeysText`, que manda desligar e ligar, deixa de ser a frase do
   dono (U3); no Hub, nada sai.
2. `config.ts`: `HUB_CONNECTOR_APPS_FILE` opcional, lido por `readSecret` (S31); `createConnectors`
   recusa um id fora do kit ou de um conector que não é `oauth2_code`, como faz com
   `HUB_CONNECTOR_ORIGINS` (`public.ts:36-42`). `apps.ts`: `appKeysOf`.
3. `executor.ts`: `send` passa a receber `where` em vez da ligação; `grant` manda o `TokenRequest` e
   lê `readGrant`; um 429 é `UNREACHABLE`, como um 5xx; o corpo de uma resposta fora de 2xx sai com
   o Secret, o código, o verificador e a chave de renovação apagados, mas o de um 2xx vai ao kit
   inteiro, porque o fornecedor pode devolver a mesma chave de renovação e ela se gravaria
   apagada (o kit nunca carrega um 2xx em `native`, critério 3); `who` faz `GET who.path` com a chave e lê `who.answer`; `call` manda
   `requestOf(operation, input, { ref: connection.accountRef })`, com a chave de acesso entre os
   segredos; `valuesOf` e `login` só servem a `client_credentials` (estreite por `auth.kind`). `redirect: 'error'`, o teto de
   256 KB e o log só de escalares continuam. Regras: S36, S41, C50.
4. `tokens.ts`, a forma de `claude/store.ts` com a ligação:
   - a chave selada enquanto falta mais de `EARLY_MS` e `force` é falso;
   - senão `reserve`: `UPDATE connection SET refresh_until = statement_timestamp() + 30 s WHERE id
     AND revision = opened.revision AND state IN ('NEW','ACTIVE') AND (refresh_until IS NULL OR
     refresh_until < now())`;
   - quem reservou: `executor.grant(refreshRequest(…))` com o seu próprio prazo, `CALL_DEADLINE_MS`
     (10 s, abaixo dos 30 s da trava), nunca o que resta do Testar: a renovação que o fornecedor já
     girou tem de chegar ao `store`; `OK` → `store` (selo novo, a chave de renovação nova ou a velha
     quando a resposta não traz, `revision + 1`,
     `refresh_until = null`, `WHERE revision = opened.revision`) e log `CONNECTION_TOKEN_REFRESHED`;
     `GRANT_REFUSED` → `release` com `state = 'NEEDS_REAUTH'` e devolve `AUTH_REFUSED`;
     `APP_REFUSED` → `release` sem estado, log de erro `CONNECTOR_APP_REFUSED` com status e código,
     devolve `APP_REFUSED`; `UNREACHABLE` → `release`, log de aviso `CONNECTION_REFRESH_UNANSWERED`,
     devolve `UNREACHABLE`; `UNREADABLE` → `release`, log de erro `CONNECTION_REFRESH_UNREAD` com status
     e código, devolve `UNREADABLE`;
   - quem não reservou: relê a cada `WAIT_STEP_MS` até `revision` mudar (abre e devolve a chave),
     `state = 'NEEDS_REAUTH'` (`AUTH_REFUSED`), a trava cair ou o **próprio** `deadlineMs` acabar
     (`UNREACHABLE`). A trava caída com `revision` igual (quem renovava terminou em `APP_REFUSED`,
     `UNREACHABLE` ou `UNREADABLE`) dá `UNREACHABLE` a quem espera; a causa está no log e na resposta
     de quem renovava.
   Cada passo é um comando curto, sem transação aberta durante a chamada (D22, D25). Regra: S34.
5. `probe.ts` e `testing.ts`: `probed` recebe `access.token` em vez de `executor.login`;
   `TOKEN_EXPIRED` pede `token({ force: true })` uma vez; `APP_REFUSED` termina o teste como
   `UNREACHABLE` termina (nada se grava, `recorded` só lê). `opened` lê `revision` e `account_ref`.
6. `sign-ins.ts`:
   - **começar:** admitido com `manageConnections`; o conector `oauth2_code` ou `CONNECTOR_UNKNOWN`;
     `appKeysOf`; com `name`, `ConnectionName` e o nome livre na empresa (a mesma consulta que o
     índice); com `connectionId`, a ligação da empresa e do mesmo conector; o verificador
     `randomBytes(32).toString('base64url')` e o desafio SHA-256 (`claude/sign-in.ts:41-55`); o selo
     com contexto `{ purpose: 'connection-sign-in', rowId, companyId, personId, kind, provider }`;
     apaga as vencidas da pessoa e insere (`sign-ins.ts:78-100` do `main`); `url` por `authorizeUrl`
     com `redirect_uri = ${publicOrigin}${REDIRECT_PATH}` e a origem do dublê quando configurada;
   - **completar:** toma a linha (`DELETE … RETURNING`, a pessoa, a empresa, viva; senão
     `CONNECTION_SIGN_IN_EXPIRED`); `{ refused: true }` → `CANCELLED`; troca o código com
     `executor.grant` (fora de transação); `who`; numa transação, admitido de novo: sem
     `connectionId`, insere a ligação (`state NEW`, o selo `ConnectionTokens`, a conta, um
     `attempt_key` novo); com `connectionId`, `UPDATE … SET sealed, key_id, revision = revision + 1,
     refresh_until = null, state = 'NEW', account_ref, account_label, linked_by, linked_at,
     tested_at = null, tested_by = null, last_test = null WHERE id AND company AND revision =
     <a lida ao começar>` (C38; a linha de autorização guarda essa `revision`, coluna
     `connection_revision` da U1). Nenhuma linha: a ligação saiu (`CONNECTION_NOT_FOUND`) ou mudou
     no meio (`CONNECTION_SIGN_IN_EXPIRED`). `V2`: a conta pode mudar;
     `violatedConstraint === 'connection_account_key'` → `CONNECTION_ACCOUNT_ELSEWHERE`;
     `connection_name_key` → `CONNECTION_NAME_TAKEN`. Logs `CONNECTION_LINKED` ou
     `CONNECTION_RECONNECTED`, e `CONNECTION_SIGN_IN_REFUSED` com status e código. Regras: S22, D22,
     C37 (a linha tomada uma vez faz o papel da chave de tentativa).
7. `connections.ts`: `entryOf` dá `auth` e `fields: []` para OAuth; `link` recusa um conector
   `oauth2_code` (`CONNECTOR_UNKNOWN`); `reconnect` (chaves): admitido, o conector
   `client_credentials`, as chaves pelo esquema dele, o selo novo, `state NEW`, `revision + 1`,
   `linked_by` e `linked_at` novos (o Testar em andamento com as chaves velhas confere `linked_at`,
   `testing.ts`, `recorded`, e não grava por cima), `last_test` e `tested_*` nulos. `rows.ts`: `columns` e `viewOf` com `account`.
8. `routes.ts`: as três rotas novas. `tests/e2e/live-hub.ts`: o dublê do Mercado Livre na origem de
   `HUB_CONNECTOR_ORIGINS` e um arquivo de apps inventado (S40).
9. `docs/decisions/0057-connections-by-oauth.md` (até 350 palavras): uma linha de autorização tomada
   uma vez, a renovação com trava no banco, a volta como página, as chaves do app num lugar só, e a
   conferência do Mercado Livre como remendo (a prova, critério 21). A linha em `docs/index.md`.

### Como se prova

Os testes entram pela porta do Hub (T5), com o dublê do Mercado Livre em `HUB_CONNECTOR_ORIGINS`:
`sign-ins.test.ts` (6, 7, 8, 16, 18), `connections-refresh.test.ts` (11, 13 a 15, 19),
`connections.test.ts` (10, 12, com `spawnHub`), `connections-reconnect.test.ts` (17),
`connections-oauth-logs.test.ts` (9, no molde de `model-accounts-log.test.ts`),
`platform/config.test.ts` (10). Cada um falha hoje: as rotas não existem. Rode só esses, mais
`typecheck` e `lint` (a regra local); a suíte inteira é da CI.

### Parar se

- O 12 não fecha uma renovação só com dois processos: não troque a trava por outra coisa; reporte
  com o log dos dois.
- O Mercado Livre de mentira precisa de um comportamento que a documentação não diz (por exemplo, o
  erro de uma autorização recusada além de `access_denied`): siga o padrão OAuth e anote no pull
  request; o roteiro do fundador o confirma.
- Uma rota precisa de um tipo de acesso novo (S48): pare; nenhum guia muda nesta etapa (L20).

## U3 A tela do OAuth

**Base e modelo.** `main` com a U2 e a U4 da 19. Sonnet.

### As linhas da tabela

A volta (a página); a sessão na volta; Conectar de novo (a tela); a tela Integrações.

Leia antes: `apps/web/src/hub/connectors/` inteiro (`integrations.tsx`, `link-dialog.tsx`,
`test-hub.tsx`, `test-result.tsx`, `text.ts`, `queries.ts`), `routes/_app/companies/$companyId/
integrations.$connectionId.tsx`, `ui/states.tsx`, `packages/hub-api/src/pages.ts`, e o cartão da 19,
U4, "A tela escolhida". `link-dialog.tsx` cumpre C26 (os campos vêm do catálogo); é o modelo.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/connectors/` | Muda `link-dialog.tsx`, `integrations.tsx`, `connection-page.tsx` (a frase das chaves recusadas e o Conectar de novo), `test-hub.tsx`, `text.ts`, `queries.ts`; cria `sign-in-return.tsx` | as rotas |
| `apps/web/src/routes/_app/integrations/return.tsx` | Cria | o roteador (`routeTree.gen.ts`, gerado) |
| `packages/hub-api/src/pages.ts` | Muda: `'/integrations/return'` em `PAGES` (a constante `REDIRECT_PATH` é da U2) | o teste das páginas (W1) |

### Os contratos que a unidade cria

Nenhum de API. Na tela: `stateBadge` e as frases de `NEEDS_REAUTH` passam a depender de `auth` do
catálogo, não do conector (C26: `text.ts` é o dono das frases). Frases novas, todas com o nome do
conector, nenhuma do Mercado Livre:

- selo: "Pede para conectar de novo" (OAuth); "Chaves recusadas" (chaves, como está);
- dono: "O <conector> pediu para conectar de novo." (OAuth); "As chaves foram recusadas pelo
  <conector>." (chaves); os dois com **Conectar de novo**;
- membro: a mesma frase e "Peça ao dono ou a um administrador.";
- `APP_REFUSED`: "O app do Conexus foi recusado pelo <conector>. Avise o suporte.";
- a volta: "Voltando da autorização…" (antes da resposta, o conector não é conhecido); com a resposta, cada resultado traz `connector` e a frase usa o nome do catálogo; `REFUSED` e `UNREADABLE`: "O <conector> recusou a
  autorização."; `UNREACHABLE`: a frase da 19 (`unreachableText`); `CANCELLED`: "Você não autorizou
  o Conexus no <conector>."; `state` ruim: "Esse endereço não é de uma ligação."; todas com
  "Voltar a Integrações"; a linha do `native` com `nativeText`, como o Testar;
- a janela: "Você vai ao <conector> entrar com a conta e autorizar o Conexus." e **Continuar no
  <conector>**; a conta: "conta <label>".

### As skills e a leitura

As linhas de `react` e `@tanstack/react-router` de `docs/reference/stack.md`: `react.dev/llms.txt`
e as skills `router-core` de `node_modules/@tanstack/router-core/skills/`; `impeccable` para a
janela e a volta.

### A ordem do trabalho

1. **Apagar antes de somar:** a frase "Desligue e ligue de novo com chaves novas." sai do dono (o
   Conectar de novo a substitui).
2. `link-dialog.tsx`: com `auth === 'oauth2_code'`, só o nome e **Continuar no <conector>**, que
   chama `startConnectionSignIn` e faz `location.assign(url)`; com `connectionId` (Conectar de novo
   OAuth), sem campo nenhum, direto. Com `client_credentials` e `NEEDS_REAUTH`, a janela das chaves com
   o nome travado chama `reconnectConnection` e, com 200, o Testar (o "Ligar e testar" da 19).
3. `return.tsx` (sob `_app`, que exige a sessão) e `sign-in-return.tsx`: lê `code`, `state` e
   `error` uma vez; `history.replaceState` para `/integrations/return` sem a busca **antes** de chamar
   o Hub; separa `state` em `CompanyId` e `ConnectionSignInId` por parse (ruim → a frase, sem
   chamada); `error` → `{ refused: true }`; senão `{ code }`; `LINKED` → navega para a página da
   ligação e chama o Testar, como o Ligar e testar da 19; os outros resultados e falhas → a frase da
   matriz. Regras: W1 (a página na lista), C36 (a página não muda nada sozinha; o POST muda).
4. `integrations.tsx`, `connection-page.tsx`, `test-hub.tsx`: a conta ("conta <label>") na lista e na página; o selo e a
   frase por `auth`; **Conectar de novo** em `NEEDS_REAUTH` para quem gerencia; `APP_REFUSED` no
   resultado do Testar. `hintText` passa a depender de `auth`: a dica de `REFUSED` com chaves continua
   ("O usuário de integração não tem acesso…"); com OAuth, "O app do Conexus não tem permissão para
   esta parte no <conector>." Nenhuma frase do Sankhya numa ligação OAuth.
5. `pages.ts`: `'/integrations/return'` em `PAGES`, junto com a rota (W1).

### Como se prova

`sign-in-return.test.tsx` (24, 27) e `integrations-oauth.test.tsx` (25), pela tela de teste da U4
(`test-hub.tsx`), com as respostas do Hub pelos esquemas de `hub-api` que a U2 deu; o QA do critério 20 depois da
última unidade, com `tests/e2e/live-hub.ts` e o dublê. Os dois testes falham hoje: a página não
existe.

### Parar se

- A política de conteúdo da página recusa a navegação para a origem de autorização: não afrouxe a
  política; reporte.
