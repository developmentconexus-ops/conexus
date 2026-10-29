# Etapa 18: Entrar num app

## A página do fundador

**No fim desta etapa** a Ana dá a uma pessoa de fora da empresa o acesso a um só app, com um papel
dentro dele, e tira esse acesso quando quiser. A pessoa entra pelo convite, cai direto no app e nunca
vê a empresa no Hub. O papel tranca o que ela pode fazer no app, e a troca de papel ou o "tirar"
valem no clique seguinte dela.

**O roteiro de uso.** Padaria Sol: Ana (dona), Bruno (membro, que constrói) e Carla (nova, só vai
usar o app). No computador e no celular, com um segundo e-mail seu no papel da Carla. O app
"Encomendas" já está publicado (etapa 17).

1. A Ana pede ao Builder: "Vendedor vê só as encomendas dele; gerente vê todas e aprova." O Builder
   pergunta o que estiver em aberto, e o app ganha dois papéis, Vendedor e Gerente. A Ana publica.
2. Em **Projeto › Quem usa o app**, a Ana vê os membros da empresa com "Todos os papéis". Ela escreve
   o e-mail da Carla, escolhe **Vendedor** e toca **Dar acesso**. A Carla aparece como convite
   pendente.
3. A Carla recebe o e-mail "Ana convidou você para usar o app Encomendas, da Padaria Sol.", cria a
   senha e cai no app. Ela cria uma encomenda e não vê o botão **Aprovar**. No endereço do Hub, ela
   vê só "Seus apps: Encomendas".
4. A Ana troca a Carla para **Gerente**. O clique seguinte da Carla já vale como Gerente; ao
   recarregar o app, ela vê todas as encomendas e o **Aprovar**.
5. Em **Configurações › Pessoas e convites**, a lista **Quem usa os apps** mostra a Carla com
   "Encomendas · Gerente". O Bruno, membro, vê as duas listas e não muda nada.
6. A Ana toca **Tirar acesso** na linha da Carla e confirma. No clique seguinte da Carla, o app dá
   lugar à página "Este app não existe ou você não tem acesso a ele."

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página; a sua
aprovação é também a palavra que a regra de dados D11 pede para a lista de permissões do banco
ganhar a tabela nova (a U1). No fim: faz o roteiro no computador e no celular, diz o que viu e aprova os textos novos (o
e-mail, a seção, a lista da empresa, "Seus apps" e as recusas).

**Fica de fora.**
- A barra lateral do Projeto: a sua `A` (Seção). Ela nasce com Dados, ao lado dos ícones da empresa,
  nunca no lugar deles; "Quem usa o app" é uma seção da aba Projeto até lá.
- Papéis da empresa criados na tela (um "Financeiro"): a biblioteca de login já tem isso pronto
  (controle de acesso dinâmico), e a capacidade `appAccess: manage` continua a mesma quando ligar.
  Volta quando alguém pedir um papel novo.
- Uma trava no banco que filtre "só as dele" sozinha (como a do Supabase): o Builder escreve o filtro
  na função do app. Volta quando um app esquecer o filtro.
- Ver o app como Vendedor, sendo membro: a sua `E1`. O membro usa todos os papéis.
- O histórico de quem tirou o acesso e quando: o "tirar" apaga a linha e o ato fica no log.
- "Seus apps" para quem também é membro de uma empresa: só aparece a quem não está em nenhuma.
- A checagem fora do Hub, com o servidor parado: a sua `G` (a decisão 0025 fica).
- Das pendências marcadas para o próximo cartão: nenhuma toca o acesso a um app. A #356 (a Prévia de
  outro membro que não recarrega) e a #237 (a admissão da rota de código) passam perto e esperam: a
  18 não muda a Prévia nem o Código.

**As decisões suas nesta etapa.**

Dadas em 2026-10-28, ao primeiro estudo: `E1` (o membro usa todos os papéis), `F1` (quem não está em
nenhuma empresa vê "Seus apps") e `G` (a checagem fica no Hub; 0041 e 0025 ficam).

Dadas em 2026-10-28, ao estudo fundo, "Aprovo tudo da Etapa 18 com seu recomendado":
- `A` Seção: "Quem usa o app" é uma seção da aba Projeto, com endereço próprio; a barra do Projeto
  nasce com Dados.
- `H` Pessoas: a lista da empresa, "Quem usa os apps", fica em Pessoas e convites.
- `B` Capacidade: dar e tirar é a capacidade `appAccess: manage`, que a dona e o administrador têm.
- `B2` Sim: o membro vê quem usa o app, sem mudar.
- `C` Tabela: uma tabela nossa, um papel por pessoa por app; tirar apaga a linha, cancela os
  convites pendentes daquele app e encerra as sessões.
- `D` D1: o app declara os papéis nas operações, o Builder os escreve, o pacote recusa com
  `ROLE_FORBIDDEN` antes de a função rodar, a seção oferece os papéis da versão publicada, e o Hub lê
  a linha a cada chamada.
- `D-a` Recusa: num app com papéis, a operação sem tranca reprova a checagem do app.

Dada em 2026-10-28, à decisão nova da revisão do cartão, "I1":

- `I` Onde mora o convite de um app. A biblioteca de login só conhece o convite que faz a pessoa
  membro da empresa (o nativo; o convite de time também faz membro). O convite de um app mora na
  mesma tabela de convites dela, marcado com o app e o papel, e o Hub mesmo o escreve, o aceita e o
  cancela: o link, o e-mail e a tela de criar senha são os de hoje. É um remendo nosso sobre a
  biblioteca, anotado nos limites dela. O que a Ana vê: a Carla pode ter um convite de cada app ao
  mesmo tempo; se a Ana convidar a Carla para a empresa, os convites de app abertos dela são
  cancelados, porque um membro já usa todos os apps (`E1`). As outras formas, que ele não escolheu:
  um convite aberto só por pessoa e empresa (a Ana não convida a Carla para um segundo app antes de
  ela aceitar o primeiro), ou uma tabela de convites nossa (outro link, outro e-mail, outra tela de
  senha).

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | A tabela `projects.app_access`; o convite que nomeia um Projeto e um papel; a função que lista os apps de uma pessoa; as permissões do banco e as políticas de linha (D11) | `apps/server/migrations/`, `apps/server/src/hub/projects/tables.ts`, `apps/server/src/hub/identity/tables.ts`, `apps/server/src/hub/identity/auth.ts`, `apps/server/database-grants.sql`, `apps/server/src/platform/catalog.test.ts` | dados | a 17 no `main` |
| U2 | Papéis no app: o app os declara, cada operação diz quem a chama, o pacote recusa com `ROLE_FORBIDDEN`, o manifesto os leva, o cliente lê quem chama, as skills e o exemplo ensinam ao Builder (`D`, `D-a`) | `packages/app-contract/src/`, `packages/app/{src,skills}/`, `packages/hub-api/src/apps.ts`, `apps/server/src/hub/apps/handoff.ts` (uma linha), os duplos de `apps/edge/` e o seu app de exemplo, o teste do contrato OpenAPI | código C27, decisão 0055 | a 17 no `main` |
| U3 | O acesso no Hub: a capacidade; o convite só para um app e o aceite que não faz membro; a admissão por linha; a troca, o tirar e o "tirar de todos"; as listas do Projeto, da empresa e "Seus apps"; o e-mail | `apps/server/src/hub/{identity,projects,apps}/`, `apps/server/src/main.ts`, `packages/hub-api/src/` | segurança | U1, U2 |
| U4 | As telas: a seção **Quem usa o app**, a lista **Quem usa os apps**, o convite que cai no app, "Seus apps" | `apps/web/src/hub/{projects,identity,apps}/`, `apps/web/src/platform/` | web | U3 |

**A entrega.** Cada unidade é o seu próprio pull request sobre o `main` com as anteriores dentro
([entrega L9](../guides/delivery.md)), juntada pelo firstmate ([L13](../guides/delivery.md)). A U1 e
a U2 correm ao mesmo tempo: não dividem pasta. A U1 é o único pull request que muda a lista de
permissões do banco, como a [regra D11](../guides/data.md) pede; a U2, a U3 e a U4 não mudam
nenhuma.

**Orçamento de código alterado.** U1 ~150 (a migração gerada fora); U2 ~320 mais o texto das skills;
U3 ~800; U4 ~500. Total da etapa: ~1.770 linhas sem testes, teto 4.000
([L2](../guides/delivery.md)). Nenhum pacote novo. Estimativas pelo tamanho dos arquivos vizinhos;
hipótese.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `projects.app_access` guarda uma linha por (Projeto, pessoa): a segunda dá `23505`; apagar o Projeto leva as linhas; o login de uma empresa não lê as linhas de outra (RLS); no escopo de um convite, só entra a linha que o convite nomeia (o Projeto, o papel, a pessoa do endereço), e outra dá `42501`; `projects.apps_of_person` dá à pessoa só os seus, sem os Projetos apagados nem as empresas marcadas para apagar; no escopo da empresa, o nome e o e-mail de quem tem uma linha nela se leem | `apps/server/src/hub/projects/tables.test.ts`, "o acesso a um app: uma linha por pessoa, some com o Projeto, cada empresa as suas" | must |
| 2 | U1 | Um convite aberto por empresa, endereço e Projeto: no banco, a Carla pode ter um convite da empresa e um de cada app ao mesmo tempo; dois do mesmo app dão `23505`; um convite com Projeto e papel da empresa, ou sem nenhum dos dois, dá `23514` | `apps/server/src/hub/identity/tables.test.ts`, "um convite aberto por empresa, endereço e Projeto" | must |
| 3 | U1 | A lista de permissões do banco é a do arquivo `database-grants.sql` com as linhas novas, e nenhuma outra muda | `apps/server/src/platform/catalog.test.ts` | must |
| 4 | U2 | `serveApp` de um app com papéis: o papel listado na operação passa; o papel fora dela recebe 403 `ROLE_FORBIDDEN` antes de a entrada ser lida e antes do handler; quem constrói passa em tudo; um papel que a versão não declara só passa nas operações `everyone` | `packages/app-contract/src/runtime.test.ts`, "papéis: a operação recusa o papel que não lista, antes do handler" | must |
| 5 | U2 | Num app com papéis, uma operação sem `roles`, ou com um papel que o app não declara, impede o `serveApp` de começar, e a checagem do app reprova com a frase que diz qual operação (`D-a`); um app sem papéis segue como hoje | `runtime.test.ts`, "papéis: operação sem tranca ou com papel desconhecido não sobe"; `packages/app/src/check/check.test.ts`, "a checagem recusa a operação sem papel" | must |
| 6 | U2 | A checagem escreve no manifesto os papéis declarados, com os rótulos; um manifesto sem `roles` continua válido (0019) | `check.test.ts`, "o manifesto leva os papéis"; `packages/app-contract/src/manifest.test.ts`, "roles é opcional" | must |
| 7 | U2 | `GET /api/caller` no app responde quem chama (`personName`, `access`); `can(access, 'gerente')` diz se o papel vale; o cliente mostra a frase de `ROLE_FORBIDDEN` | `packages/app/src/client.test.ts`, "quem chama e a frase do papel"; `runtime.test.ts`, "GET /api/caller"; `apps/edge/src/dispatcher.test.ts`, "GET /api/caller chega ao Worker com quem chama" | must |
| 8 | U2 | Pela porta do dispatcher (`checkAppCall`), um membro recebe `access: { kind: 'BUILDER' }` | `apps/server/src/hub/apps/app-handoff.test.ts`, o teste 3 com o `caller` novo | must |
| 9 | U3 | `POST /api/companies/{c}/projects/{p}/access/invitations` com `{ email, role }`, da dona ou do administrador: 201 e o e-mail sai; o membro recebe 404 `NOT_FOUND` (`B`, S10); o e-mail de um membro dá 409 `APP_ACCESS_MEMBER` (`E1`); de quem já usa o app, 409 `APP_ACCESS_EXISTS`; um papel que a publicada não declara, 409 `APP_ROLE_UNKNOWN`; sem versão publicada, 404 `APP_NOT_PUBLISHED`; com papéis declarados, `role` nulo dá 409 `APP_ROLE_UNKNOWN`; a mesma chave de tentativa com outro Projeto ou outro papel dá 409 `IDEMPOTENCY_CONFLICT` | `apps/server/src/hub/projects/app-access.test.ts`, "dar acesso: quem pode, e as recusas" | must |
| 10 | U3 | Aceitar o convite de um app (pelo link, criando a senha, ou já com conta) grava a linha e nenhum membro: `GET /api/companies` dá `[]`, Projetos e Pessoas dão 404, a Prévia (o passe da moldura) dá 404; a resposta traz o endereço do app | `apps/server/src/hub/identity/invitation-app.test.ts`, "o convite de um app: aceitar não faz membro, e leva ao app" | must |
| 11 | U3 | A jornada pelas portas do Hub e do dispatcher: sem linha, o passe dá 404; como Vendedor, `caller.access` é `{ kind: 'USER', role: 'vendedor' }`; trocado para Gerente, a chamada seguinte, na mesma sessão, já leva `gerente`; tirado, a sessão do app dela não existe mais: a chamada seguinte com o token velho dá 401 `APP_SESSION_INVALID` (o dispatcher a manda a `/apps/open`, que mostra a recusa do passo 6), e um passe novo dá 404 | `apps/server/src/hub/apps/app-access-journey.test.ts`, "papel no app, troca, tirar, na chamada seguinte" | must |
| 12 | U3 | Tirar o acesso cancela o convite pendente daquele app para o mesmo endereço: o link aberto depois mostra `CLOSED` e aceitar dá 409 `INVITATION_CLOSED` (a armadilha do OS, 0024) | `invitation-app.test.ts`, "tirar o acesso fecha o convite pendente" | must |
| 13 | U3 | Uma empresa marcada para apagar recusa quem só usa o app, como recusa o membro (403 `APP_ACCESS_REFUSED` com o motivo `DELETING`, a sessão ainda viva); um Projeto apagado leva as linhas, e o convite pendente de um Projeto apagado ou marcado dá 409 `INVITATION_CLOSED` ao aceitar | `app-access-journey.test.ts`, "empresa marcada e Projeto apagado" | must |
| 14 | U3 | `GET …/projects/{p}/access`: todo membro lê (`B2`); a lista traz os membros como quem constrói, as linhas com o papel e `roleDeclared`, os convites pendentes, os papéis da publicada e `mayManage`; quem não é membro recebe 404 | `app-access.test.ts`, "a lista do Projeto: o membro lê e não muda" | must |
| 15 | U3 | `PUT …/access/{personId}` troca o papel (só um papel declarado); `DELETE …/access/{personId}` tira e dá 204 também quando já não havia linha; `DELETE …/access/invitations/{invitationId}` cancela um convite pendente; o membro recebe 404 nas três | `app-access.test.ts`, "trocar, tirar e cancelar: as recusas e o de novo" | must |
| 16 | U3 | `GET /api/companies/{c}/app-access` lista cada pessoa de fora com os seus apps e papéis (todo membro lê; quem virou membro não aparece, e a linha dele fica inerte); `DELETE /api/companies/{c}/app-access/{personId}` tira de todos os apps da empresa, com os convites e as sessões | `app-access.test.ts`, "a lista da empresa e o tirar de todos" | must |
| 17 | U3 | `GET /api/apps` dá à pessoa os apps que ela usa, com o nome, a empresa e o endereço; a uma pessoa sem nenhum, `[]` | `invitation-app.test.ts`, "Seus apps" | must |
| 18 | U3 | Um papel que a versão publicada nova deixa de declarar, ou uma linha sem papel (dada quando o app não tinha papéis) num app que passa a tê-los: a linha fica, a lista a marca `roleDeclared: false`, e a chamada só passa nas operações `everyone` | `app-access-journey.test.ts`, "o papel que a versão deixa de declarar" | should |
| 19 | U4 | Em **Projeto › Quem usa o app**: os membros com "Todos os papéis"; cada pessoa com o papel num `Select`, "desde 28/10" e **Tirar acesso** com a confirmação; o convite pendente com **Cancelar convite**; o formulário e-mail, Papel e **Dar acesso**; o membro vê tudo sem os controles; sem versão publicada, "Publique o app para dar acesso a alguém."; cada recusa mostra a frase do código | `apps/web/src/hub/projects/access.test.tsx`, "Quem usa o app: dona, membro e as recusas" | must |
| 20 | U4 | Em **Pessoas e convites**, a lista **Quem usa os apps**, cada app levando à seção do Projeto, e **Tirar de todos** com a confirmação, só para quem gere | `apps/web/src/hub/identity/people.test.tsx`, "Quem usa os apps" | must |
| 21 | U4 | O link do convite de um app diz "Ana convidou você para usar o app Encomendas, da Padaria Sol."; depois da senha ou do aceite, o navegador vai para o endereço do app; quem não está em nenhuma empresa vê "Seus apps" com o link de cada um | `apps/web/src/hub/identity/invitation.test.tsx`, "o convite de um app leva ao app"; `apps/web/src/routes/_app/index.test.tsx`, "Seus apps" | must |
| 22 | U4 | Num navegador de verdade (Chrome e WebKit, 1366 e 390 px, os dois temas), o roteiro inteiro, com um segundo e-mail no papel da Carla | o teste das telas (`conexus-qa`) | must |
| 23 | U3 | Pelas rotas do Hub, com um convite de app aberto para a Carla: o convite da empresa para ela dá 201, e o link do de app mostra `CLOSED` (`I`); um convite de outro app dá 201 e o primeiro segue aberto; renovar ou cancelar um convite de app pelas rotas de convites da empresa dá 404, e a lista de convites da empresa não o mostra | `invitation-app.test.ts`, "o convite da empresa com um de app aberto" | must |
| 24 | U3 | Um convite de app vencido: o link mostra `CLOSED`, criar a senha e aceitar dão 409 `INVITATION_CLOSED`, e nenhuma linha nasce | `invitation-app.test.ts`, "o convite de app vencido não dá o app" | must |
| 25 | U2 | Uma chamada do cliente que o dispatcher responde com o redirecionamento ao Hub (a sessão do app apagada) ou com a sua página de recusa (4xx, sem JSON) recarrega a página, e o navegador vê a recusa; um 503 sem JSON segue `UNREACHABLE` | `packages/app/src/client.test.ts`, "a recusa da plataforma recarrega a página" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Quem usa o app (U4) | só os membros, e o formulário | sem versão publicada: a frase e nenhum formulário | `Loading`, como Versões | `ReadFailure`, como Versões | o Projeto apagado: a rota se relê, como hoje | o membro (`B2`): a lista sem `Select`, sem **Tirar acesso**, sem formulário | o papel que sumiu: a linha diz "Papel que a versão publicada não tem mais" e o `Select` pede outro; uma recusa ao salvar mostra a frase e relê |
| Quem usa os apps (U4) | a lista vazia: "Ninguém de fora da empresa usa os apps." | a mesma frase | `Loading`, como Pessoas | `ReadFailure`, como Pessoas | — | o membro: sem **Tirar de todos** | — |
| O convite de um app (U4) | "Ana convidou você para usar o app Encomendas, da Padaria Sol." | — | como hoje | como hoje | como hoje (`NOT_FOUND`) | `OTHER`: outra conta entrou, como hoje | `CLOSED`, como hoje: tirado antes de aceitar dá esta |
| Seus apps (U4) | a lista dos apps | "Você ainda não está em nenhuma empresa.", como hoje | como hoje | como hoje | — | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `projects.app_access` (a linha; quem deu fica no log, `by`) | o aceite do convite de um app; a troca; o tirar | `admitToApp` em cada chamada; as listas; `GET /api/apps` |
| `auth.invitation.project_id`, `app_role` | o convite de um app | `PendingRow`, que os separa do convite da empresa: o aceite; o link (`getInvitation`); o e-mail; o tirar, que cancela; o convite da empresa, que cancela os de app; a lista do Projeto; as rotas de convites da empresa, que não os veem |
| `Manifest.roles` | a checagem do app (U2) | o Hub: os papéis que a seção oferece, a recusa `APP_ROLE_UNKNOWN`, `roleDeclared` |
| `Caller.access` | `checkCall` pelo `admitToApp` | `serveApp` (a tranca); o handler do app (o filtro); `GET /api/caller` (a tela) |
| `AppAccessList.mayManage` | a lista do Projeto, por `allows(role, 'manageAppAccess')` | a seção: os controles |
| `AppEntry` (nome, empresa, endereço) | `GET /api/apps`; o aceite | "Seus apps"; o navegador depois do aceite |

**Desenho de caixas.** Não há captura do produto antigo: o estudo leu a tela do OS
(`application-access.tsx` em `e0353c36`) sem rodá-la, e o desenho é novo, com as peças que a tela de
Pessoas já usa (a lista como tabela, o `Select` do papel, o `AlertDialog`).

```text
1280 px, Projeto › Quem usa o app (a dona)
  Encomendas      [Prévia] [Código] [Projeto]              Versão 3 publicada  [Abrir app ↗]
  [Sobre] [Versões] [Quem usa o app]
  Pessoa                         Papel                  Desde
  Ana · ana@…                    Todos os papéis
  Bruno · bruno@…                Todos os papéis
  Carla · carla@…                [Vendedor ▾]           28/10        [Tirar acesso]
  carla2@… · convite pendente    Gerente                vence 04/11  [Cancelar convite]
  E-mail [______________]  Papel [Vendedor ▾]  [Dar acesso]

390 px
  [Prévia] [Código] [Projeto]                  [⇪] [↗]
  [Sobre] [Versões] [Quem usa o app]
  Carla
  carla@… · desde 28/10
  [Vendedor ▾]                      [Tirar acesso]
  …
  E-mail [__________]
  Papel [Vendedor ▾]
  [Dar acesso]

Configurações › Pessoas e convites, depois de Convites pendentes
  Quem usa os apps
  Carla · carla@…     Encomendas · Gerente     [Tirar de todos]
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Dar acesso (o convite de um app, `createInvitationCommand`) | a trava da empresa (`lockCompany`) e a chave de tentativa, como o convite de hoje: a segunda com a mesma chave devolve o mesmo convite; um convite aberto do mesmo app é cancelado pelo novo, como hoje (`cancelOpen`), pelo adaptador | uma transação; o e-mail sai depois, e a repetição com a mesma chave o manda de novo se ele não saiu, como hoje | o banco fora: `DATABASE_UNAVAILABLE`; o provedor de e-mail fora: `MAIL_UNAVAILABLE`, como hoje | `INVITATION_CREATED` com `projectId` | 9, 23 |
| O convite da empresa (o de hoje) com convites de app abertos para o endereço | a trava da empresa, como hoje | os convites de app saem pelo adaptador na mesma transação, antes de `createInvitation`, que recusaria o endereço (`I`) | como hoje | `INVITATION_CANCELED` com `projectId`, um por convite de app | 23 |
| Aceitar o convite de um app (`acceptCommand`, o ramo novo) | a trava da empresa, como hoje: o segundo aceite vê `accepted` e a linha, e devolve o mesmo fim; uma resposta cortada, 502 ou 503, repetida, dá o mesmo app | uma transação: a linha e o `accepted` juntos (D22); vencido ou não `pending`, nada muda | o banco fora: `DATABASE_UNAVAILABLE`, como hoje | `INVITATION_ACCEPTED` com `projectId` | 10, 12, 24 |
| Trocar o papel | a trava da empresa: a última vale | uma instrução | o banco fora: a frase, e a lista relida | `APP_ACCESS_CHANGED` com `by`, `projectId`, `personId`, `role` | 11, 15 |
| Tirar o acesso (a linha e os convites do app para o endereço; depois, as sessões do app) | a trava da empresa, a mesma do aceite: um aceite e um tirar ao mesmo tempo terminam sem linha e sem convite aberto, numa ordem ou na outra | a linha e os convites numa transação (D22); as sessões saem depois, pelo login do Hub sem escopo, como `checkCall` já as apaga (`handoff.ts:161`): se essa segunda instrução falhar, a chamada seguinte já é recusada pela admissão, e repetir o tirar dá 204 e apaga o que ficou | o banco fora: a frase; nada mudou | `APP_ACCESS_REVOKED` com `by`, `projectId`, `personId` | 11, 12, 15, 16 |
| Cancelar o convite de um app | a trava da empresa, a mesma do aceite: o aceite depois vê `CLOSED`; o aceite antes deixa a linha, e o cancelar dá 404 | uma instrução, pelo adaptador; repetido, dá 204 | o banco fora: a frase; nada mudou | `INVITATION_CANCELED` com `projectId` | 12, 15 |
| Tirar de todos | como o tirar, numa transação para todos os Projetos da empresa | como o tirar | como o tirar | `APP_ACCESS_REVOKED` uma vez por Projeto | 16 |
| A migração da U1 | o Hub sobe um por vez | uma transação | o Hub não sobe, como hoje | como hoje | 1, 2 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A linha "pessoa usa este app" | U1, U3 | nenhuma | Budibase `624d68a` `packages/types/src/documents/global/user.ts:134`; OS `e0353c36` `apps/hub/migrations/0022_application_access.sql:46-62` (armadilhas em `0024`, `0025`); basejump `7a1f95c` `account_user`; better-auth 1.7.8 times (`crud-invites.mjs:295-327`, `crud-team.mjs:637-640`) | cada análogo guarda (pessoa, app, nível) ele mesmo; o time da biblioteca exige um membro | remendo: `projects.app_access`, PK (Projeto, pessoa), RLS como `projects.project`, cascata no Projeto; a entrada em `boundaries.md` | provado no estudo fundo com better-auth 1.7.8: aceitar um convite de time cria o membro (o script da biblioteca), e a tabela no Hub faz a jornada | `C` | a migração `<data>_e18_app_access/` |
| Convite só para um app | U1, U3 | `identity/invitations.ts`, `invitation-response.ts:123-178` (o aceite chama `acceptInvitation`) | better-auth 1.7.8 `crud-invites.mjs:322` (o aceite sempre cria o membro), `:128-132` (`createInvitation` recusa o endereço com qualquer convite aberto na empresa, `adapter.mjs:753-768`), `:268` (o aceite confere o prazo); Budibase `backend-core/src/users/invites.ts:17`; OS `iam.application_invitation` | o convite carrega o app; o OS tinha a sua tabela | remendo: a linha de convite da biblioteca com dois campos do Hub (`project_id`, `app_role`) e `role` nulo, um tipo de convite que a biblioteca não conhece; o Hub o escreve, o aceita e o cancela pelo adaptador (`organizationAdapter`, `auth.ts:282`), confere ele mesmo o prazo, e cancela os convites de app do endereço antes do convite da empresa; a entrada em `boundaries.md` | a revisão do cartão leu 1.7.8: a forma "um convite aberto por endereço" tira da Ana o segundo app, e uma tabela nossa repete o link, o e-mail e a senha | `C`, `I` | a entrada em `docs/reference/boundaries.md` |
| Quem dá e tira | U3 | `admission.ts:38-71` `ACTIONS`; `roles.ts:10-37` | better-auth 1.7.8 `plugins/access/access.mjs:45-76`; cal.com `54343aa` `PERMISSIONS.md:3`; Documenso `cd0cc5f` `packages/lib/constants/teams.ts:31-34`; OS `0001_baseline.sql:103-111,852-860` | papéis mapeados para capacidades `recurso: ações` | nativo: `appAccess: ['manage']` em `ACCESS_CONTROL` e em `MANAGE_COMPANY`; as ações `manageAppAccess` e `readAppAccess` | provado no estudo fundo: dona sim, administrador sim, membro não | `B`, `B2` | — |
| Papéis da empresa criados na tela | fica de fora | `Role` é `z.enum` (`hub-api/src/companies.ts:15`) | better-auth 1.7.8 `dynamicAccessControl` (`organization.mjs:665-703`) | papéis por empresa numa tabela | nativo, quando vier: ligar `dynamicAccessControl`; fica de fora por não haver caso | — | não precisa | — |
| Quem pode abrir o app | U3 | `projects/hosts.ts:37-65` `admitToApp` = `admitMember(readProjects)` | Budibase `server/src/middleware/authorized.ts:65-81`; vibesdk `9da158d` `worker/index.ts:166-199` | a linha lida a cada pedido, a recusa esconde a existência | embrulhado: o membro como quem constrói, nas duas portas; senão a linha, só no ambiente `published`, com a empresa não marcada | provado no estudo fundo | não precisa | — |
| Onde a checagem vive | fica como está | `apps/handoff.ts` `checkCall`, 0041 | Cloudflare Access (docs); vibesdk pergunta ao banco a cada despacho | — | nativo (0041) | testes 1 a 9 de `app-handoff.test.ts` | `G` | — |
| Tirar o acesso | U3 | a remoção de um membro (`memberships.ts`) recusa a chamada seguinte | OS `application-access.ts` `revokeApplicationGrant`; Budibase `worker/.../users.ts:930`; Documenso `delete-envelope-recipient.ts:125` | apaga a linha; vale no pedido seguinte | embrulhado: apaga a linha, cancela os convites do app para o endereço e apaga as sessões do app, numa transação (S8, S13) | o teste 4 de hoje e a jornada do estudo fundo | `C` | — |
| Onde fica "Quem usa o app" | U4 | `projects/area.tsx` `Sections`; `search.ts:5` `Section` | OS `apps/web/src/app/shell.tsx:91-104`; Supabase `cb52c0f4`; Dify `8857292` | uma entrada do Projeto | embrulhado: um valor novo de `Section`, o endereço `?lens=project&section=access` (W18) | a crítica do estudo fundo | `A` | `apps/web/src/hub/projects/access.tsx` |
| Acessos da empresa | U4 | `Configurações › Pessoas e convites` (W32), `identity/people.tsx` | Retool, Cloudflare, Budibase (documentado) | a lista por pessoa, com os apps ao lado | embrulhado: uma terceira lista em `people.tsx` | a crítica do estudo fundo | `H` | — |
| Aceitar e cair no app | U3, U4 | `web/src/hub/identity/invitation.tsx:104` vai para a empresa | Budibase cai no portal; Mitra `returnTo` | — | nativo: o aceite responde o endereço, e a tela vai para ele | — | não precisa | — |
| O que a Carla vê no Hub | U3, U4 | `web/src/hub/identity/no-company.tsx:9` | Budibase `builder/src/pages/builder/apps/index.svelte:160`; Appsmith | o portal dos próprios apps | embrulhado: `GET /api/apps` na tela sem empresa, por uma função como `projects.project_of_host` | o teste 10 do primeiro estudo | `F1` | — |
| Entrar de novo | fica como está | `apps/routes.ts:30` 303 para `/login?redirect=` | Mitra `returnTo` | — | nativo: como hoje | o teste 13 de hoje | não precisa | — |
| Papéis declarados pelo app | U2 | `Operations` = `{input, output}` (`app-contract/src/runtime.ts:10`) | Mitra `createProfileMitra`, `setProfileServerFunctionsMitra` (OS `docs/research/mitra/full-study.md:1595-1626`); OS spec 0005 (`allow` por operação, AC-11, AC-13) | o app declara perfis; cada função diz quem a chama | embrulhado: `defineRoles` ao lado de `defineOperations`, `roles` em cada operação, lidos pelo `serveApp` e pela checagem | provado no estudo fundo (a tranca) | `D`, `D-a` | — |
| A recusa por papel | U2 | `serveApp` recusa só 404 e 400 (`runtime.ts:84-87`) | OS 0005 AC-13; Budibase `authorized.ts:65-81`; Clerk `has({ role })` | a plataforma recusa antes do código do app | embrulhado: 403 `ROLE_FORBIDDEN` antes da entrada | provado no estudo fundo | `D` | — |
| O papel de quem chama | U2, U3 | `Caller` sem papel (`props.ts:5-11`, `hub-api/src/apps.ts:21-27`) | Cloudflare `ctx.props` (0041); Supabase `auth.jwt()` | o papel chega com quem chama | nativo: `caller.access`, calculado por `admitToApp` em cada chamada; sem token, sem segredo no app | provado (0041 e o estudo fundo) | `E1` | — |
| O papel que uma versão deixa de declarar | U2, U3 | nenhum | OS 0005 AC-7 (as atribuições ficam inertes) | a linha fica, o papel não vale | embrulhado: a linha fica; o `serveApp` trata o papel não declarado como nenhum; a lista o marca | provado no estudo fundo (`200, 403, 403`) | não precisa | — |
| Linhas por pessoa | U2 | os handlers gravam `caller.personId` (`skills/conexus-data/references/handlers.ts:91-110`) | Mitra `:VAR_USER`; Supabase RLS `authorize()` | um filtro por quem chama | nativo: um filtro no handler por `caller.personId` e `can(caller.access, …)` | — | não precisa | — |
| A recusa no meio do app (passos 4 e 6) | U2 | `packages/app/src/client.ts:42-57`: o `fetch` segue o 303 do dispatcher (`apps/edge/src/dispatch.ts:49-53,205-207`) para o Hub, falha, e vira `UNREACHABLE`; a página de recusa (`:208-213`) não é JSON e também | WHATWG Fetch: `redirect: 'manual'` dá a resposta `opaqueredirect`; `location.reload()` | o navegador segue o redirecionamento numa navegação, onde o Hub mostra a recusa | embrulhado: `createApi` pede `redirect: 'manual'`; um `opaqueredirect`, ou um 4xx sem JSON, recarrega a página | a revisão do cartão leu o caminho; o critério 25 | não precisa | — |
| A tela esconde o que o papel não pode | U2 | `packages/app/src/client.ts` `createApi` | OS 0005 `useMe`, `useCan` | a tela lê quem chama; o servidor garante | embrulhado: `GET /api/caller` respondido pelo `serveApp`, e `readCaller` no cliente | — | não precisa | — |
| O Builder escreve o app com papéis | U2 | skills `conexus-data/SKILL.md:25-26`, `conexus-plan-new/SKILL.md:62`, `conexus-plan-change/SKILL.md:73`, `conexus-app` | Mitra (o agente cria os perfis por código); OS 0005 | — | embrulhado: as skills aprendem `defineRoles`, `roles`, `caller.access` e o 403 | — | `D` | — |
| Apagar Projeto ou empresa | U1 | a exclusão em fases; `app_session` | OS `purgeProject` (`application-access.ts:82-91`) | — | nativo: FK de `app_access` para o Projeto com cascata (contenção, D17); o convite guarda o Projeto sem FK, e o aceite recusa o de um Projeto que não está vivo | — | não precisa | — |
| Os testes LT1 a LT4 e LT9 do roteiro | U3 | LT1 e LT4 provados para membros (o primeiro estudo, `app-handoff.test.ts` testes 4 e 10) | a sonda `7f0e829` `proofs/P4-gate.md:87-96` | — | nativo: LT1 é o critério 10, LT4 o 11; LT2, LT3 e LT9 não mudam (nenhum cookie novo; tirar de todos é o "desligar" de quem só usa apps, critério 16) | os critérios 10, 11 e 16 | não precisa | — |
| Cookies entre apps vizinhos | fica como está | `apps/edge/src/headers.ts:5-7` | 0041, resultado 7 | — | nativo: nenhum cookie novo | provado (0041) | não precisa | — |

As referências estão na estante de estudo nos commits citados; Retool, Cloudflare e Mitra são
documentados, lidos pelos estudos da 18 e pelo estudo do OS em `e0353c36`.

**A medida do transplante.** Nenhum código trazido. As duas armadilhas da tabela do OS (o convite
pendente que devolvia o acesso; as sessões que sobreviviam) entram como critérios 11 e 12.

**A dívida.**
- O Builder pode esquecer o filtro "só as dele" num handler; a tranca por operação não o pega.
  Gatilho: o primeiro app que esquecer, ou o cartão que trouxer a trava no banco.
- "Seus apps" aparece só para quem não está em nenhuma empresa. Gatilho: um membro que use apps de
  outra empresa.
- O membro não vê o app como Vendedor (`E1`). Gatilho: o primeiro pedido.

**Para o fechamento.** A frase de W29 "A person who only uses an app never enters them" passa a
dizer que essa pessoa vê só "Seus apps" em `/`; `docs/architecture.md:227` ("Revisited in step 18")
recebe a resposta `G` (a checagem fica no Hub, 0025 fica); a decisão 0055 ganha `roles`; o remendo
`I` está em `boundaries.md` desde a U3.

## U1 A linha do acesso

**Base e modelo.** `main` com a 17, no commit em que o cartão for aprovado. Sonnet: uma tabela, duas
colunas e as permissões, por caminhos que já existem.

### As linhas da tabela

- **A linha "pessoa usa este app"**: `projects/tables.ts`, ao lado de `project`; o modelo é
  `project` (as políticas de linha) e `apps.app` (`apps/tables.ts:98-126`, a FK para o Projeto).
- **O que a Carla vê no Hub**: a função `projects.apps_of_person(person text)`, dona de um papel
  estreito e chamada pelo `hub_runtime`, como `projects.project_of_host` (`hosts.ts:12-25`): o nome
  do Projeto, o nome da empresa e o rótulo do endereço, só das linhas da pessoa, sem os Projetos
  apagados nem as empresas com `deleting_since`, que `admitToApp` recusaria.
- **Convite só para um app**: `invitation` (`identity/tables.ts:265-305`) ganha `project_id` e
  `app_role`, sem FK: `projects/tables.ts:12` já importa a identidade, e uma FK daqui fecharia o
  ciclo (C6); `auth.ts:264` ganha os dois em `additionalFields`, ou o adaptador os perde. O índice
  `invitation_pending_email_key` passa a incluir o Projeto, e um `check` separa os dois tipos: o
  convite da empresa tem `role` e nenhum Projeto; o de um app tem o Projeto e `role` nulo (D15).
- **Quem a empresa lê**: a política `COMPANY` de `auth."user"` (`identity/tables.ts:70-76`) lê hoje
  quem age, os membros e quem convidou. Ela passa a ler também quem tem uma linha de `app_access`
  na empresa, por SQL cru: sem isso, as listas e o tirar não leem o nome nem o e-mail da Carla. Ela
  alarga quem lê o nome de quem, e só isso: a pessoa de fora não lê ninguém (S6).
- **Apagar Projeto ou empresa**: a FK `on delete cascade` de `app_access` para `projects.project`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/projects/tables.ts` | Cria `appAccess` | U3 |
| `apps/server/src/hub/identity/tables.ts`, `auth.ts` | Muda `invitation` e os seus `additionalFields` | todo `hub/identity/` |
| `apps/server/migrations/<data>_e18_app_access/` | Cria `migration.sql` (gerado, mais a linha `-- contract:` da troca do índice) e `snapshot.json` | `npm run migrations` |
| `apps/server/migrations/<data>_e18_app_people_role/`, `<data>_e18_app_grants/` | Cria: o papel, a função e as permissões, em SQL nosso | `npm run migrations` |
| `apps/server/database-grants.sql`, `apps/server/src/platform/catalog.test.ts` | Muda: as permissões novas (D10, D11) | o catálogo |
| `apps/server/src/hub/projects/tables.test.ts`, `apps/server/src/hub/identity/tables.test.ts` | Muda: critérios 1 e 2 | — |
| `apps/server/src/hub/projects/hosts.ts` | Muda: `appsOfPerson`, a leitora da função, ao lado de `projectOfHost` | U3 |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/projects/tables.ts
/** A person who is not a member and uses this Projeto's app, with one role (step 18, C). */
export const appAccess = projects.table('app_access', {
  companyId: text('company_id').notNull(),
  projectId: text('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  personId: text('person_id').notNull(),
  // NULL when the published version declared no role; a role it stops declaring stays, inert.
  role: text('role'),
  grantedAt: instant('granted_at').notNull().default(sql`statement_timestamp()`),
}, (table) => [
  primaryKey({ columns: [table.projectId, table.personId] }),
  policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${companyId}`),
  // The acceptance writes only the row its invitation names, for the person its address is.
  policy(SCOPE_ROLES.INVITATION, 'insert', sql`exists (select 1 from auth.invitation i
    join auth."user" u on lower(u.email) = lower(i.email)
    where i.id = ${invitationId} and i.company_id = app_access.company_id
      and i.project_id = app_access.project_id and i.app_role is not distinct from app_access.role
      and u.id = app_access.person_id)`),
  // The function behind appsOfPerson reads the rows, as hosts_select does (projects/tables.ts:52-54).
  pgPolicy('app_people_select', { for: 'select', to: APP_PEOPLE, using: sql`true` }),
])
// As colunas de pessoa não têm FK para `auth.user`, como `app_session` (D17: a pessoa não é
// contida pelo Projeto); o tirar e a exclusão do Projeto as levam.

// apps/server/src/hub/identity/tables.ts, invitation:
  // The Projeto whose app the invitation gives, and the role in it; NULL for a company invitation.
  projectId: text('project_id'),
  appRole: text('app_role'),
// o índice: uniqueIndex('invitation_pending_email_key')
//   .on(organizationId, sql`lower(email)`, sql`coalesce(project_id, '')`).where(status = 'pending')
// check('invitation_kind', sql`(project_id is null) = (role is not null)`)
// auth."user", a política COMPANY ganha:
//   or exists (select 1 from projects.app_access a where a.person_id = "user".id and a.company_id = ${companyId})
```

- As permissões (D10, D11, D12), todas novas: `hub_company` `SELECT, INSERT, UPDATE, DELETE` em
  `projects.app_access`; `hub_invitation` `USAGE` no esquema `projects`, `SELECT, INSERT` em
  `projects.app_access` e `SELECT` em `projects.project` (o aceite confere o Projeto vivo; uma
  política `INVITATION` de `select` no `project` pela linha do convite); um papel novo,
  `hub_app_people`, dono de `projects.apps_of_person`, com `SELECT` nas três tabelas que ela lê, e
  `EXECUTE` dela só ao `hub_runtime`, como `hub_hosts` e `project_of_host`; `hub_app_people` lê sob
  as políticas de linha, então ganha uma política de `select` em `projects.app_access`,
  `projects.project` e `auth.company`, como `hosts_select` em `project` (`projects/tables.ts:52-54`). `apps.app_session` não
  ganha permissão: o tirar apaga as sessões pelo `hub_runtime`, que já pode (`:107`).
- O que o Drizzle não gera vai em SQL nosso, em migrações próprias depois da gerada, como
  `20261018101315_app_hosts_role` e `20261018101320_app_grants`: o papel `hub_app_people`, a
  função, o seu `REVOKE` e `GRANT EXECUTE`, as permissões e a troca de dono (D5, D10).
  `database-grants.sql` é só o instantâneo que o teste do catálogo compara.
- A política `INVITATION` de `insert` lê `auth.invitation` por SQL cru, sem importar a identidade
  além do que `projects/tables.ts:12` já importa.
- A troca do índice é `DROP INDEX` e `CREATE UNIQUE INDEX` na mesma migração, com a linha
  `-- contract: o índice só se alarga para o Projeto; o código de antes nunca escreve project_id`
  (data D6, `scripts/check-migrations.ts:51`).
- Modelo: `project` e `invitation` nas suas tabelas (cumprem C21 e C26; os ids são texto, como em
  todo o esquema).

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server` (`drizzle-kit`, a skill `drizzle` do
pacote; `pg`). Guia de dados D6, D10, D11, D12; segurança S6.

### A ordem do trabalho

1. Os testes dos critérios 1 e 2, falhando hoje.
2. As tabelas; `npx drizzle-kit generate --name e18_app_access`; a linha `-- contract:`.
3. As migrações de SQL nosso: o papel, a função, as permissões.
4. `database-grants.sql` e o instantâneo do catálogo; critério 3.

### Como se prova

`npm test -w @conexus/server -- src/hub/projects/tables.test.ts src/hub/identity/tables.test.ts
src/platform/catalog.test.ts`; `npm run migrations`; `node scripts/check-migrations.ts`.

### Parar se

- A migração gerada mexe em outra tabela além das duas e da política de `auth."user"`: parar e
  relatar.
- A função precisa de uma coluna além do nome do Projeto, do nome da empresa e do rótulo do
  endereço: relatar a coluna.

## U2 Papéis no app

**Base e modelo.** `main` com a 17. Sonnet: um campo a mais num contrato pequeno e a tranca antes do
handler, já rodada no estudo fundo (`proto/scratch.diff`).

### As linhas da tabela

- **Papéis declarados pelo app** e **A recusa por papel**: `runtime.ts:10` (`Operations`), `:21-43`
  (`servedOf`), `:72-104` (`serveApp`); `packages/app/src/operations.ts` (`defineOperations`).
- **O papel de quem chama**: `props.ts:5-14`; `hub-api/src/apps.ts:21-28` (`AppCaller`); em
  `handoff.ts` `checkCall`, o `caller` ganha `access: { kind: 'BUILDER' }` (só membros entram até a
  U3).
- **O papel que uma versão deixa de declarar**: em `mayRun`, um papel fora de `roles` do app não é
  papel.
- **A tela esconde o que o papel não pode**: `GET /api/caller` no `serveApp`; `client.ts`.
- **A recusa no meio do app**: `createApi` (`client.ts:42-57`) pede `redirect: 'manual'`. Uma
  resposta `opaqueredirect` (o 303 do dispatcher para o Hub, `apps/edge/src/dispatch.ts:205-207`)
  ou um 4xx sem JSON (a página de recusa, `:208-213`) é o dispatcher falando ao navegador, não o
  app: o cliente chama `location.reload()`, e a navegação mostra a recusa do Hub. Um 5xx sem JSON
  segue `UNREACHABLE`, porque recarregar não conserta o Hub fora.
- **O Builder escreve o app com papéis**: as cinco skills de `packages/app/skills/`.
- **Linhas por pessoa**: `skills/conexus-data/references/handlers.ts:91-110`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/app-contract/src/props.ts`, `runtime.ts`, `failures.ts`, `manifest.ts`, `index.ts` | Muda | `packages/app`, `apps/server`, `apps/edge` |
| `packages/app/src/operations.ts`, `client.ts`, `index.ts` | Muda: `defineRoles`, `can`, `readCaller`, a frase | as skills, o app |
| `packages/app/src/check/manifest.ts`, `build.ts` | Muda: o programa lê `roles` e o passa ao `serveApp`; o manifesto o leva | a checagem |
| `packages/app/skills/{conexus-plan-new,conexus-plan-change,conexus-data,conexus-app,conexus-build}/` | Muda: o texto e as referências | o Builder |
| `packages/hub-api/src/apps.ts` | Muda: `AppCaller.access` | servidor, edge |
| `apps/server/src/hub/apps/handoff.ts` | Muda: uma linha, `access` do membro | — |
| `apps/edge/src/test-edge.ts`, `apps/edge/example/src/index.ts`, `apps/edge/example/src/example.test.ts` | Muda: o `CALLER` dos duplos ganha `access`; a edge lê o `caller` pelo esquema do hub-api (`apps/edge/src/hub.ts:20,103`) | os testes da edge |
| `apps/server/src/openapi-contract.test.ts` | Muda: o corpo de `checkAppCall` no documento que `npm run openapi` emite (nenhum arquivo guardado) | — |
| testes: `packages/app-contract/src/runtime.test.ts`, `manifest.test.ts`, `packages/app/src/runtime.test.ts`, `check.test.ts`, `client.test.ts`, `skills.test.ts`, `apps/server/src/hub/apps/app-handoff.test.ts`, `apps/edge/src/dispatcher.test.ts` | Muda | — |

### Os contratos que a unidade cria

```ts
// packages/app-contract/src/props.ts: apaga "never … a role" do comentário de Caller
/** How the caller holds the app: a member builds it and holds every role (E1); a person given the app holds one, or none. */
export type CallerAccess = Readonly<{ kind: 'BUILDER' } | { kind: 'USER'; role: string | null }>
// Caller ganha
  access: CallerAccess

// packages/app-contract/src/runtime.ts
/** Who may call an operation: the app's roles it names, or everyone with access. */
export type OperationRoles = readonly string[] | 'everyone'
export type Operations = Readonly<Record<string, Readonly<{ input: z.ZodType; output: z.ZodType; roles?: OperationRoles }>>>
/** The app's roles, by name, with what a person reads in Quem usa o app. */
export type Roles = Readonly<Record<string, string>>
export function serveApp(app: Readonly<{ operations: Operations; handlers: Readonly<Record<string, Handler>>; roles?: Roles }>)
// GET /api/caller → 200 { personName, access }; um app com papéis e uma operação sem `roles`, ou
// com um papel fora de `roles`, lança ao começar (D-a), como o handler que falta lança hoje.

// packages/app-contract/src/failures.ts: APP_FAILURE_CODES ganha 'ROLE_FORBIDDEN'

// packages/app-contract/src/manifest.ts, Manifest ganha
  roles: z.array(z.strictObject({ name: RoleName, label: z.string().trim().min(1).max(40) })).max(20).optional(),
export const RoleName = z.string().regex(/^[a-z][a-z0-9_]{0,31}$/)

// packages/hub-api/src/apps.ts, AppCaller ganha
  access: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('BUILDER') }),
    z.object({ kind: z.literal('USER'), role: RoleName.nullable() }),
  ]),

// packages/app/src/operations.ts
export function defineRoles<const R extends Roles>(roles: R): R
// packages/app/src/client.ts
export function can(access: CallerAccess, role: string): boolean   // BUILDER: sempre
export function readCaller(fetcher?: typeof fetch): Promise<{ personName: string; access: CallerAccess }>
// failureText.ROLE_FORBIDDEN: 'Seu papel neste app não permite isto.'
// createApi: fetcher(`/api/${name}`, { ..., redirect: 'manual' }); opaqueredirect ou 4xx sem JSON → reload
```

- **O estado**: `CallerAccess` é união com `kind` (C21); o dono é `props.ts`, e o `AppCaller` do
  hub-api o satisfaz, como hoje (`satisfies z.ZodType<Caller>`).
- **O dono de cada fato**: a regra de quem roda uma operação é `mayRun` no `runtime.ts`, a única;
  `can` no cliente só a espelha para esconder um botão (C26: a garantia é o 403).
- **Entrada externa**: `roles` do manifesto, pelo `Manifest` (C27); o programa da checagem o lê da
  exportação `roles` de `shared/operations.ts`, que pode faltar (um app sem papéis).
- O programa da checagem (`manifest.ts:51-62`) e a entrada do Worker (`build.ts:35-38`) passam a
  importar `roles` de `shared/operations.ts` quando existe, e `serveApp({ operations, handlers,
  roles })`; o `Answer` ganha `roles`, e o manifesto os escreve com o rótulo.
- Modelo: `runtime.ts` (cumpre C21 e C26; `OperationName` é a marca de C23).
- A decisão 0055 se emenda no fechamento: o contrato passa a ter `roles`.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `packages/app` e `packages/app-contract` (`zod`).
Código C21, C26, C27; decisão 0055.

### A ordem do trabalho

1. `runtime.test.ts`, critérios 4, 5 e 7, falhando hoje.
2. `props.ts`, `runtime.ts` (`mayRun` como no estudo fundo, com `everyone` e a recusa ao começar),
   `failures.ts`, `manifest.ts`; `AppCaller`; a linha do `handoff.ts`; critério 8.
3. A checagem: `manifest.ts` e `build.ts`; critérios 5 e 6.
4. O cliente: `can`, `readCaller`, a frase, a recarga na recusa da plataforma; critérios 7 e 25.
5. As skills. `conexus-plan-new` (`:62`) e `conexus-plan-change` (`:73`): perguntar quem chama o quê
   e anotar os papéis no plano, e "todos com acesso" sem papéis. `conexus-data` (`:25-26`):
   `caller.access`, o filtro por `caller.personId` e `can`, e `roles` em cada operação quando o app
   tem papéis. `conexus-app`: esconder pelo `readCaller` com `useQuery`. `conexus-build`: a checagem
   recusa a operação sem papel. Um exemplo de dois papéis na referência de `conexus-data`.
   `docs/reference/builder-prompt.md` não muda: as skills levam isto.

### Como se prova

`npm test -w @conexus/app-contract`; `npm test -w @conexus/app -- src/client.test.ts
src/check/check.test.ts src/runtime.test.ts src/skills.test.ts`; `npm test -w @conexus/edge`; `npm
test -w @conexus/server -- src/hub/apps/app-handoff.test.ts src/openapi-contract.test.ts`; `npm run
openapi`.

### Parar se

- O `GET /api/caller` não chega ao Worker pelo dispatcher (os arquivos estáticos respondem antes,
  `apps/server/src/platform/cloudflare.ts:208`), ou colide com uma rota que o app de exemplo já
  serve: parar e relatar com o teste da edge.

## U3 O acesso no Hub

**Base e modelo.** `main` com a U1 e a U2. Opus: cruza identidade, Projetos e apps, com a trava da
empresa entre o aceite e o tirar; é o desenho entre módulos que a regra do modelo manda para o Opus.

### As linhas da tabela

- **Quem dá e tira**: `roles.ts:10-20` ganha `appAccess: ['manage']` em `ACCESS_CONTROL` e em
  `MANAGE_COMPANY`; `admission.ts` ganha `MANAGE_APP_ACCESS`, `manageAppAccess` (`MEMBER`, a
  capacidade, `locks: true`) e `readAppAccess` (`MEMBER`, sem capacidade, `B2`). O operador não gere
  o acesso aos apps de um cliente (S11): por isso `MEMBER`, não `COMPANY`.
- **Quem pode abrir o app**: `hosts.ts:37-65`, como o estudo fundo (`proto/scratch.diff`), com o
  ambiente na entrada e a recusa da empresa marcada no caminho da linha: uma porta nova de identidade,
  `admitAppUser(tx, { companyId })`, que chama `refuseIfDeleting` (`admission.ts:270`). O
  comentário "as they may read its Projects" (`hosts.ts:27`) muda. `checkCall` e `createHandoff`
  (`handoff.ts`) passam o ambiente; a moldura (`preview`) segue só para membros.
- **Convite só para um app** (o remendo `I`; a entrada em `boundaries.md` cita better-auth 1.7.8
  `crud-invites.mjs:128-132,268,322`): `createInvitationCommand` (`invitations.ts:282-349`) recebe
  `app?: { projectId; role }`. Com `app`, a admissão é `manageAppAccess`; o convite é escrito pelo
  adaptador (`invitations.ts:272-275`), com `role` nulo, porque o endpoint da biblioteca exige
  `invitation: create` e recusaria o endereço com outro convite aberto; antes de escrever, as recusas do critério 9, pelas portas de Projetos (o Projeto vivo, a
  linha que já existe) e de apps (os papéis da publicada). `openOf`, `checkRoom` e a contagem seguem
  como hoje, com o Projeto na chave: os convites de app contam no limite de convites abertos da
  empresa e no ritmo de quem convida, que são guardas contra abuso do envio de e-mail, não regra de
  produto. A comparação da chave de tentativa (`invitations.ts:300-306`) passa a incluir o Projeto e o
  papel do app.
- **O convite da empresa com convites de app abertos**: `createInvitationCommand` sem `app` cancela,
  pelo adaptador e antes de `written`, cada convite de app aberto do endereço na empresa, porque
  `createInvitation` da biblioteca (`crud-invites.mjs:128-132`, `findPendingInvitation`,
  `adapter.mjs:753-768`) recusaria o endereço com `USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION`, e
  o Hub não liga `cancelPendingInvitationsOnReInvite` (ele cancela só o primeiro, `:163-166`). Um
  membro usa todos os apps (`E1`), então o convite da empresa os substitui. `openOf` e `cancelOpen`
  seguem só para o convite da empresa.
- **Os leitores do convite**: `PendingRow` (`invitations.ts:39-45`) passa a ler `project_id` e
  `app_role` e separa os dois tipos numa união com `kind` (C21): `COMPANY` com `role: Role`, `APP`
  com `projectId` e `role: RoleName | null`. Cada leitor que hoje lê `role` escolhe pelo `kind`:
  `createdOf` e `invitation-mail.ts:45` (o e-mail do app), `invitation-reads.ts:128` (o link e os
  convites recebidos), `invitation-response.ts:22,43` (`lockedInvitation`, por onde passam
  `passwordCommand` e `declineCommand`), `invitation-management.ts:35,133` (a lista, renovar e
  cancelar da empresa, que respondem `NOT_FOUND` a um convite de app). `passwordCommand` então
  serve o convite de um app sem mudar: cria a conta e entra.
- **Cancelar o convite de um app**: pelo adaptador (`organizationAdapter(...).updateInvitation`,
  `invitations.ts:233-234`), depois de `manageAppAccess`: quem decide é a capacidade (`B`), não a
  `invitation: cancel` da biblioteca, que `auth.api.cancelInvitation` conferiria.
- **Aceitar e cair no app**: `acceptCommand` (`invitation-response.ts:123-178`) lê `projectId` com o
  convite; com ele, recusa um convite que não esteja `pending` ou não esteja vivo (`LIVE`,
  `invitations.ts:35-37`) com `INVITATION_CLOSED`, como a biblioteca faz no seu aceite
  (`crud-invites.mjs:268`), porque o ramo do app não a chama (S12); depois grava a linha e o
  `accepted` na mesma transação, e **nunca** chama `acceptInvitation`.
  `getInvitation` (`invitation-reads.ts`) dá o app no `OpenInvitation`.
- **Tirar o acesso**: o arquivo novo `apps/server/src/hub/projects/app-access.ts`, com a trava da
  empresa (`lockCompany`, a mesma do aceite); os convites do app para o endereço saem pelo
  adaptador, como o cancelar.
- **O que a Carla vê no Hub**: `GET /api/apps`, por `appsOfPerson` (U1).
- As listas da empresa e do Projeto deixam de fora quem é membro: a linha de um membro fica inerte,
  porque `admitToApp` admite o membro antes de ler a linha.
- **O papel que uma versão deixa de declarar**: a lista lê os papéis da publicada pelo manifesto
  (`apps/tables.ts:152`) e marca `roleDeclared`.
- O e-mail: `invitation-email.tsx` ganha a variante do app, pelo mesmo `mail-frame.tsx`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/roles.ts`, `admission.ts`, `public.ts` | Muda: a capacidade, as ações, `admitAppUser` | `projects`, `apps` |
| `apps/server/src/hub/identity/auth.ts` | Muda só se o adaptador pedir os campos novos na escrita (a U1 já os declarou) | — |
| `apps/server/src/hub/identity/invitations.ts`, `invitation-response.ts`, `invitation-reads.ts`, `invitation-management.ts`, `invitation-mail.ts`, `invitation-email.tsx` | Muda: `PendingRow` em união; o convite de um app; o convite da empresa cancela os de app; as rotas de convites da empresa só veem os sem Projeto | `routes.ts`, `company-routes.ts` |
| `apps/server/src/hub/projects/app-access.ts` | Cria: as listas, trocar, tirar, tirar de todos, `GET /api/apps` | `routes.ts` |
| `docs/reference/boundaries.md` | Muda: a entrada do convite de um app (o remendo `I`), com better-auth 1.7.8 e as linhas acima | — |
| `apps/server/src/hub/projects/hosts.ts`, `ports.ts`, `routes.ts`, `public.ts` | Muda: `admitToApp`; as portas dos papéis publicados e das sessões | `apps/handoff.ts`, `main.ts` |
| `apps/server/src/hub/apps/handoff.ts`, `versions.ts`, `public.ts` | Muda: o ambiente na admissão; `publishedRolesOf`; `endAppSessions` | `main.ts` |
| `apps/server/src/main.ts` | Muda: liga as portas novas | — |
| `packages/hub-api/src/projects.ts` (ou um `app-access.ts` novo), `companies.ts`, `people-failures.ts`, `index.ts` | Muda: as operações, `AppEntry`, os códigos | servidor, web |
| testes: `apps/server/src/hub/projects/app-access.test.ts`, `apps/server/src/hub/apps/app-access-journey.test.ts`, `apps/server/src/hub/identity/invitation-app.test.ts` (novos); `invitations.test.ts`, `invitation-acceptance.test.ts`, `app-handoff.test.ts`, `apps/server/src/openapi-contract.test.ts` | Cria ou muda | — |
| `apps/web/src/hub/identity/invitation.tsx`, `apps/web/src/platform/test-hub.tsx` | Muda só o que o tipo novo do aceite pede; a tela é da U4 | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api
export const AppEntry = z.object({ projectName: z.string().min(1), companyName: z.string().min(1), address: z.string().min(1) })
export const AppAccessRow = z.object({
  personId: PersonId, name: z.string().min(1), email: Email,
  role: RoleName.nullable(), roleDeclared: z.boolean(), grantedAt: z.iso.datetime(),
})
export const AppAccessInvitation = z.object({ id: InvitationId, email: Email, role: RoleName.nullable(), expiresAt: z.iso.datetime() })
export const AppAccessList = z.object({
  roles: z.array(z.object({ name: RoleName, label: z.string() })),   // da publicada; [] sem papéis
  published: z.boolean(),
  members: z.array(z.object({ personId: PersonId, name: z.string(), email: Email })),
  people: z.array(AppAccessRow),
  invitations: z.array(AppAccessInvitation),
  mayManage: z.boolean(),
})

listAppAccess    GET    /api/companies/{companyId}/projects/{projectId}/access                       200 AppAccessList
inviteToApp      POST   /api/companies/{companyId}/projects/{projectId}/access/invitations           201 { invitation: AppAccessInvitation }   attemptKey
                 body { email: Email, role: RoleName.nullable() }
changeAppAccess  PUT    /api/companies/{companyId}/projects/{projectId}/access/{personId}            200 { person: AppAccessRow }   body { role: RoleName }
revokeAppAccess  DELETE /api/companies/{companyId}/projects/{projectId}/access/{personId}            204
cancelAppInvitation DELETE /api/companies/{companyId}/projects/{projectId}/access/invitations/{invitationId}  204
listCompanyAppAccess GET /api/companies/{companyId}/app-access                                         200 { people: [{ personId, name, email, apps: [{ projectId, projectName, role, roleLabel }] }], next: Next }
revokeAllAppAccess DELETE /api/companies/{companyId}/app-access/{personId}                             204
listMyApps       GET    /api/apps                                                                      200 { apps: AppEntry[] }
// acceptInvitation: success ganha `app: AppEntry.nullable()`; InvitationView: OpenInvitation ganha
// `app: z.object({ projectName }).nullable()`, e JOINED ganha `app: AppEntry.nullable()`.
// falhas: NOT_FOUND, APP_NOT_PUBLISHED, APP_ACCESS_MEMBER (409), APP_ACCESS_EXISTS (409),
// APP_ROLE_UNKNOWN (409), as do convite de hoje, SESSION_REQUIRED, DATABASE_UNAVAILABLE.

// apps/server/src/hub/projects/hosts.ts
export type AppAdmission =
  | { kind: 'ADMITTED'; projectName: string; access: CallerAccess }
  | { kind: 'REFUSED'; reason: string }
  | { kind: 'NOT_FOUND' }
// o ambiente como o literal 'preview' | 'published': importar `AppEnvironment` de `apps/tables.ts`
// fecharia um ciclo (C6), porque `apps/tables.ts:20` importa `projects/public`
export function admitToApp(deps, input: { personId; companyId; projectId; environment: 'preview' | 'published' }): Promise<AppAdmission>

// apps/server/src/hub/projects/ports.ts
export type PublishedRolesOf = (tx: ReadTx, projectId: ProjectId) => Promise<{ published: boolean; roles: readonly { name: string; label: string }[] }>
// depois do commit do tirar, pelo login sem escopo, como `checkCall` (`handoff.ts:161`)
export type AppSessionsEnd = (ids: { projectId: ProjectId; personId: PersonId }) => Promise<void>
```

- As frases, no `people-failures.ts`: `APP_ACCESS_MEMBER` "Esta pessoa já é da empresa e usa o app
  com todos os papéis."; `APP_ACCESS_EXISTS` "Esta pessoa já usa o app. Troque o papel na lista.";
  `APP_ROLE_UNKNOWN` "Este papel não existe na versão publicada.". O fundador as aprova no fim.
- **Ids**: `PersonId`, `ProjectId`, `InvitationId` pelos esquemas do hub-api nas rotas (C23); o
  papel é `RoleName` do contrato do app.
- **Donos**: quem gere, `ACTIONS` (S6, C26); os papéis de um app, o manifesto da publicada; a regra
  "membro antes da linha", `admitToApp`, a única.
- **Entrada externa**: os corpos pelos esquemas das operações (C27); o manifesto guardado pelo
  `Manifest` ao ler `roles`.
- Modelo: `memberships.ts` (remover e trocar o papel de um membro, com a trava e a ação relida; cumpre
  C21, C23 e C26) e `invitations.ts` para o convite.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/server/src/hub` (`better-auth`: as skills
`organization-best-practices` e `better-auth-security-best-practices`; `fastify-best-practices`).
Segurança S6, S8, S10, S11, S13, S22; dados D22; código C26, C65.

### A ordem do trabalho

1. Os testes dos critérios 9 a 18, falhando hoje. A jornada (critério 11) segue o teste do estudo
   fundo (`e18-deep-scratch.test.ts`): `companyForVersions`, `send`, a rota `published-version`,
   `/apps/open` e `checkAppCall`, e chama o `serveApp` de um app de dois papéis com o `caller` que o
   Hub respondeu.
2. A capacidade e as ações (`roles.ts`, `admission.ts`).
3. `admitToApp` com o ambiente e a linha; `admitAppUser`; `checkCall` passa o `access`. Regras: S8
   (a linha relida a cada chamada), S10 (o mesmo 404).
4. `PendingRow` como união e os seus leitores; o convite de um app e o aceite, com o prazo; o convite
   da empresa que cancela os de app; o e-mail; as rotas de convites da empresa sem os de app;
   critérios 23 e 24. Regras: C21, D22, S12; o aceite nunca chama `acceptInvitation`.
5. `app-access.ts`: as listas, trocar, tirar (a linha, os convites, as sessões), tirar de todos,
   `GET /api/apps`; as portas em `main.ts`. Regras: S13, C65 (a trava da empresa).
6. `npm run openapi` e o teste do contrato, com as rotas novas.

### Como se prova

`npm test -w @conexus/server -- src/hub/projects/ src/hub/apps/app-access-journey.test.ts
src/hub/apps/app-handoff.test.ts src/hub/apps/handoff-route.test.ts src/hub/identity/
src/openapi-contract.test.ts`. Cada teste entra pela porta do Hub (T5): as rotas, `/apps/open`,
`checkAppCall`.

### Parar se

- O adaptador da biblioteca recusa `role` nulo num convite: parar e relatar; não gravar `member` no
  papel do convite.
- Um leitor do convite fora dos nomeados acima lê `role`: incluí-lo na união e relatar a linha.
- Um caminho que já existe chama `acceptInvitation` para um convite com Projeto: relatar a linha.
- O tirar precisa apagar algo além da linha, dos convites do app e das sessões do app: relatar.
- Uma lista que já existe (os convites recebidos, as Pessoas) mostra um convite de app como de
  empresa: relatar a lista e a linha.

## U4 As telas

**Base e modelo.** `main` com a U3. Sonnet: uma seção e uma lista ao lado das que existem.

### As linhas da tabela

- **Onde fica "Quem usa o app"**: `search.ts:5` `Section` ganha `access`; `area.tsx` `Sections`
  ganha a aba **Quem usa o app**; o arquivo novo `apps/web/src/hub/projects/access.tsx`. O endereço
  é `?lens=project&section=access` (W18): o endereço próprio da `A`; quando a barra do Projeto vier,
  muda a moldura e não a tela.
- **Acessos da empresa**: `people.tsx` ganha **Quem usa os apps**, depois de Convites pendentes, com
  `member-actions.tsx` como modelo do **Tirar de todos**.
- **Aceitar e cair no app**: `invitation.tsx:104` vai para `https://<address>/` quando o aceite traz
  `app`; o texto do convite diz o app.
- **O que a Carla vê no Hub**: `no-company.tsx` lê `listMyApps` e mostra "Seus apps".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/projects/access.tsx`, `area.tsx`, `search.ts`, `queries.ts` | Cria ou muda | a rota do Projeto |
| `apps/web/src/hub/identity/people.tsx`, `invitation.tsx`, `no-company.tsx`, `queries.ts` | Muda | as rotas de Configurações, do convite e `/` |
| `apps/web/src/platform/test-hub.tsx` (ou um `test-hub-access.tsx` novo) | Muda: os duplos das rotas novas | os testes |
| `docs/reference/screens.md` | Muda: a linha da seção nova e a linha de `/`, que passa a servir também quem só usa apps ("Seus apps", `F1`) (W29) | — |
| testes: `apps/web/src/hub/projects/access.test.tsx` (novo), `people.test.tsx`, `invitation.test.tsx`, `apps/web/src/routes/_app/index.test.tsx` | Cria ou muda | — |

### Os contratos que a unidade cria

```ts
// apps/web/src/hub/projects/access.tsx
/** Quem usa o app: members as builders, the people given the app with their role, the open invitations, and the form for whoever manages. */
export function Access(props: { companyId: CompanyId; projectId: ProjectId })
```

- Os textos: "Quem usa o app", "Todos os papéis", "desde <data>", "Tirar acesso", "Tirar o acesso
  da Carla? O próximo clique dela no app é recusado.", "Cancelar convite", "Dar acesso", "Publique o
  app para dar acesso a alguém.", "Papel que a versão publicada não tem mais", "Quem usa os apps",
  "Ninguém de fora da empresa usa os apps.", "Tirar de todos", "Seus apps", "Ana convidou você para
  usar o app Encomendas, da Padaria Sol.". O fundador os aprova no fim (L23).
- O sucesso invalida a lista (`hubMutation`); a troca de papel mostra o estado salvo na linha.
- Modelo: `people.tsx` e `member-actions.tsx` (cumprem C21 e C26).

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/web` (`shadcn` para o `Select`, o `AlertDialog` e
a tabela). Guia web W18, W29, W31, W32; a regra de telas do cartão
([screens](../../.agents/skills/conexus-scope/references/screens.md)).

### A ordem do trabalho

1. Os testes dos critérios 19 a 21, falhando hoje.
2. `access.tsx` e a seção; `people.tsx`; o convite; "Seus apps"; a linha de `screens.md`.
3. O roteiro no navegador com o Hub local (`conexus-qa` faz o critério 22).

### Como se prova

`npm test -w @conexus/web -- src/hub/projects/access.test.tsx src/hub/identity/people.test.tsx
src/hub/identity/invitation.test.tsx src/routes/_app/index.test.tsx`. O critério 22 é do teste das
telas, num navegador de verdade.

### Parar se

- As quatro abas da seção não cabem a 390 px: parar e mandar a captura; não esconder Quem usa o app.
- A lista do Projeto pede um dado que `AppAccessList` não traz: relatar, não ler outra rota.
