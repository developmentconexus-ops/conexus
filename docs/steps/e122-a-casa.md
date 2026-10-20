# Etapa 12.2: A casa

## A página do fundador

**No fim desta etapa** você entra e cai direto na sua empresa, com uma barra só à esquerda; o dono
novo prepara a empresa em quatro passos; Pessoas e contas de modelo ficam em Configurações.

**O roteiro de uso.**

1. Na Central (agora com a sua própria barra: Clientes, Estado do Hub), cadastre "Padaria Teste"
   com um e-mail seu de teste. Pelo convite, crie a senha: abre **Passo 1 de 4 · Sua empresa**,
   com o nome e o apelido sugerido. Salve.
2. Passo 2, **Ligue uma conta de modelo**: **Fazer depois**. Passo 3, **Convide sua equipe**:
   convide a Ana como membro. Passo 4: só **Ir para o início**.
3. No Início: à esquerda a barra (Padaria Teste, Início, Configurações, sua conta); em cima o
   cartão **Termine de preparar a empresa** com "Conta de modelo" faltando; depois **O que vamos
   construir?**. Crie "Encomendas": o Projeto abre e a barra vira ícones; volte ao Início e ela abre.
4. **Continuar** no cartão abre Configurações › Contas de modelo, com o índice **Você** e
   **Padaria Teste**. Ligue uma conta como na 11; volte: o cartão sumiu.
5. Como Ana, aceite: cai no Início da Padaria Teste, sem passos nem cartão. Em Contas de modelo,
   lê quem pode mudar.
6. Ana troca para a Empresa A, sai e entra: abre a A. No celular (390 px), abra a gaveta; mude
   para o tema escuro.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. No fim: faz o roteiro,
diz o que viu e aprova os textos das telas.

**As suas respostas de 2026-10-19.** "Aprovado tudo": F1 a F7, A. A F2 muda a D1 de 17/10.

**Fica de fora.** O compositor que cria Projeto e o passo 4 de verdade (13); o estado nos cartões
(14); Publicar (17); Sistemas da empresa (19), Conectores (24); Memória, Atividade e Uso, que pedem
cartão. Buscar com Ctrl K. Trocar o nome da empresa ou o seu: não há escrita para isso. O
Impeccable no repositório (F6) entra no fechamento (L20). Issues `next-card`: da 39, os itens 11 e
22; o resto, e a 25 e a 45, são de outras pastas.

**A decisão sua pedida nesta etapa, respondida em 2026-10-20: "A e sim para 13.1".** Até a 13, sob
"O que vamos construir?", ficam **Nome do projeto** e **Criar projeto**: cria o Projeto vazio e o
abre, como hoje; a 13 troca o campo pelo compositor. A última empresa e os Projetos recentes ficam
lembrados no navegador, como o tema (você não recusou).

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | A lista de empresas só com as que a pessoa abre | `hub/identity/` (servidor), `hub-api/src/companies.ts` | segurança | — | — |
| U2 | A moldura: barra lateral, Central, entrada | `ui/`, `platform/`, `routes/_app/` (moldura, `/`, Central), `hub/identity/`, `hub/projects/`, `hub/status/` | web | shadcn | 12.1 fechada |
| U3 | O Início e Todos os projetos | `routes/…/$companyId/index.tsx`, `projects/index.tsx`, `hub/projects/` | design | shadcn | U2 |
| U4 | Configurações com índice | `routes/…/$companyId_/settings/`, `hub/identity/`, `builder/model-accounts/`, `platform/theme.ts` | web | shadcn | U2 |
| U5 | A primeira entrada e o cartão de preparo | `routes/…/$companyId_/welcome/`, `hub/identity/`, `ui/welcome-frame.tsx` | design | shadcn | U3, U4 |
| U6 | Percursos, capturas, roteiro | `tests/e2e/`, `apps/web/*.test.ts`, `sweep-*.ts` | testes | — | U5 |

U1 corre ao lado; U3 e U4 em paralelo. Sem checagem nova. Do Impeccable, só `layout`,
`adapt`, `harden`, `clarify` e, na U5, `onboard` (F6).

**Orçamento de código alterado** (sem testes nem gerados; o copiado conta): U1 40; U2 1.400 (600
da barra copiada); U3 350; U4 600; U5 550; U6 80. Total **3.020**, teto 4.000 (L2). Sai a moldura
de hoje, com o que a 12.1 lhe somar.

## A árvore de rotas

Layouts nativos do TanStack Router 1.170.44; `$companyId_`, rota não aninhada, fica fora da
moldura da casa, com a guarda numa função.

```text
_app/route.tsx                        sessão (W15); só Outlet: a moldura sai daqui
_app/index.tsx                        "/": redireciona (abaixo), ou "Nenhuma empresa"
_app/companies/$companyId/route.tsx   (era $companyId.tsx) guarda; onEnter lembra; moldura da casa
  index.tsx                           Início
  projects/index.tsx                  Todos os projetos
  projects/$projectId…                da 12.1, intocadas
  model-account.tsx                   redireciona a settings/my-model-accounts
_app/companies/$companyId_/settings/route.tsx   guarda; onEnter; moldura com o índice
  index.tsx → account; account, my-model-accounts, appearance (Você)
  general, people, model-accounts (a empresa)
_app/companies/$companyId_/welcome/route.tsx    guarda do dono; moldura dos passos
  index.tsx → o passo que falta; company, model-account, team, build
_app/operations/route.tsx             só o operador; moldura da Central
  index.tsx → clients; clients/…; status.tsx (Estado do Hub)
```

`/` redireciona, nesta ordem: a última empresa lembrada que está na primeira página da lista; a
primeira da lista; o operador sem empresa, à Central. Saem `people.tsx`, `setup.tsx` e `companies.tsx`.

**Quem é dono de cada fato**, além dos campos da matriz.

| Fato | Dono | Quem lê |
| --- | --- | --- |
| Empresa, papel, entrada sem apelido | `enterCompany` (`hub/identity`), chamada pelas três guardas | molduras, passos |
| Barra em ícones | a moldura da casa, pela presença da rota do Projeto | `Frame` |
| Última empresa, Projetos recentes | `hub/identity`, `hub/projects`, sobre `platform/remembered.ts` | `/`, barra |
| Passos feitos | `preparationOf` (`hub/identity`) | passos, cartão |

Seção nova: um arquivo com `staticData.section`. Ordens reservadas: Sistemas 40 (19), Conectores
50 (24), Memória 60, Atividade 70, Uso 80. Aba nova do Projeto é da 12.1.

## O que a 12.1 deixa intocado

Base: o cartão da 12.1 em `432cc15`. A 12.2 constrói depois do merge dela, com o `tooltip` e o
`collapsible` dela. A 12.1 só toca, fora do Projeto: o `ui/frame.tsx`, para
encolher a barra de hoje no Projeto (critério 13 dela); `setup.tsx` e `model-account.tsx`, para o
modelo `{id, efforts}`. A 12.2 reescreve a moldura e mantém esse comportamento, e leva essa forma
do modelo para as seções. A 12.1 não toca: `routes/_app/route.tsx`, `index.tsx`;
`companies/$companyId.tsx`, `index.tsx`, `projects/index.tsx`, `people.tsx`; a troca de empresa, o
menu da conta e o `company-setup.tsx`. Mantém os ids `/_app/companies/$companyId/projects/$projectId…`
e o `staticData.place`; mede o Projeto pelo contêiner, nunca pela barra de 56 px. Se mudar algo
disso, este cartão volta (L7).

## Os critérios de aceite

Servidor: `npm run test -w @conexus/server`. Tela: `npm run test -w @conexus/web`. Percurso: `npm run e2e`.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `GET /api/companies`: membro e admin não recebem empresa sem apelido; o dono recebe; com apelido, todos. `GET /api/companies/{id}` dela, para membro ou admin: 404, como desconhecida (S10) | `companies.test.ts` | must |
| 2 | U2 | `/`: uma empresa, o Início dela; duas, a última aberta neste navegador; a lembrada sumida, a primeira; nenhuma, "Você ainda não está em nenhuma empresa." e **Sair do Conexus**; operador sem empresa, a Central | `routes/_app/index.test.tsx` | must |
| 3 | U2 | De 768 px para cima, sem barra no topo; à esquerda: empresa, Início, Projetos recentes (os abertos por último que seguem na lista, completados pelos primeiros até cinco), Todos os projetos, Configurações, conta | `companies/$companyId/route.test.tsx` | must |
| 4 | U2 | No Projeto a barra vira ícones com dica; Ctrl+B ou o trilho a abre; ao sair, volta aberta. O critério 13 da 12.1 segue passando; o teste dele só muda se lia o DOM de hoje, e passa a ler por papel (T7) | idem, `layout.test.ts` | must |
| 5 | U2 | 390 px: topo com **Abrir navegação**, a marca e o lugar; a gaveta tem tudo da barra e fecha ao seguir um link (V56) | `layout.test.ts` | must |
| 6 | U2 | A troca lista as empresas de U1; com uma, só o nome; escolher abre o Início da outra, a nova última | `company-switcher.test.tsx` | must |
| 7 | U2 | Conta, no pé: nome, e-mail, tema, **Central** (só operador), **Sair do Conexus** | `account-menu.test.tsx` | must |
| 8 | U2 | Central: Clientes, Estado do Hub (`/operations/status`, fora de Clientes), **Ir para uma empresa**; quem não opera: "Página não encontrada" | `clients.test.tsx`, `status-page.test.tsx` | must |
| 9 | U2 | Carregando: a moldura já, o conteúdo em esqueleto (W17); erro na área, **Tentar de novo**; não encontrado: na área, **Voltar ao início**, sem rolagem (o `main` dentro do `main` de hoje); empresa desconhecida: sem barra | `states.test.tsx`, `layout.test.ts` | must |
| 10 | U3 | Início: "O que vamos construir?", **Nome do projeto**, **Criar projeto** (decisão A), que abre o Projeto (W24); nome repetido: o erro da 7 no campo | `home.test.tsx` | must |
| 11 | U3 | Cartões com nome e "Criado em 19/10/2026", que abrem o Projeto; vazio: "Nenhum projeto ainda."; banco indisponível: o aviso da 7; Todos os projetos: página no endereço (W18) | idem, `projects.test.tsx` | must |
| 12 | U4 | Configurações: **Voltar**, busca, **Você** (Minha conta, Minhas contas de modelo, Aparência) e a empresa (Geral, Pessoas e convites, Contas de modelo); nenhuma reservada | `settings.test.tsx` | must |
| 13 | U4 | A busca acha por nome e palavras ("convite" › Pessoas e convites), sem acento; nada: "Nenhuma seção encontrada." | idem | must |
| 14 | U4 | Um roteador de teste, o `routeTree` mais uma filha de `settings` com `staticData.section`, mostra a seção na sua ordem pela moldura, sem mudar o índice | idem | must |
| 15 | U4 | Membro: Contas de modelo diz "Só o dono ou um administrador muda as contas de modelo da empresa." (`mayManage`), com link a Minhas contas de modelo; Pessoas e Geral, leitura (V29) | `company-accounts.test.tsx`, `people.test.tsx` | must |
| 16 | U4 | Aparência: Claro, Escuro, Como o sistema; fica ao recarregar (V9) | `theme.test.tsx` | must |
| 17 | U4 | `/companies/$id/model-account` leva a Minhas contas de modelo; `/people`, `/setup`: "Página não encontrada" | `settings.test.tsx` | must |
| 18 | U5 | Dono, empresa sem apelido: todo endereço dela leva a **Passo 1 de 4 · Sua empresa**, nome só leitura, apelido sugerido; membro ou admin: não encontrado | `welcome.test.tsx` | must |
| 19 | U5 | Passo 1: as recusas da 4 no campo; `COMPANY_NICKNAME_SET` segue ao passo 2; salvo, o passo 1 não volta | idem | must |
| 20 | U5 | Passo 2: as três formas da 11 e as recusas dela; ligada uma, **Continuar**; **Fazer depois** vai ao 3 | idem | must |
| 21 | U5 | Passo 3: convite com as recusas da 4; **Voltar**, **Fazer depois**. Passo 4: só **Ir para o início**. Quem não é dono, em `welcome/*`: o Início | idem | must |
| 22 | U5 | Cartão: dono e admin, enquanto falta conta da empresa ou equipe (outro membro ou convite pendente); **Continuar** abre a seção que falta; some com tudo feito | `preparation.test.tsx` | must |
| 23 | U5 | Membro convidado aceita e cai no Início, sem passos nem cartão; ela vira a última | `invitation.test.tsx` | must |
| 24 | U6 | O roteiro, Hub real | `tests/e2e/house.test.ts` | must |
| 25 | U6 | Os percursos de hoje passam pela moldura nova | `tests/e2e/*` | must |
| 26 | U6 | 390 px, 200 %, dois temas, sem rolagem lateral nem erro de CSP; Tab pela barra, Ctrl+B, Esc fecha a gaveta e devolve o foco (V30); a varredura abre a conta e a troca (issue 39, 22) | `layout.test.ts`, `sweep.test.ts`, `keyboard.test.ts` | must |
| 27 | U6 | Capturas de cada tela nova ao lado do desenho que implementa, a 1280 e 390 px, claro e escuro, em cada estado da matriz | o pull request, olhadas (T23) | must |
| 28 | U6 | Publicado: o roteiro | firstmate, fundador (L17) | must |

## As telas

Desenhos do estudo de 2026-10-19, fora do repositório (L21); estados: `wf-e1` a `wf-e5`.

| Tela | Desenho | O que se vê primeiro | Entra por | Sai para |
| --- | --- | --- | --- | --- |
| Moldura da casa | `wf-v2`, `wf-navm` | a empresa no topo da barra | `/`, a troca | Início, Projeto, Configurações, Central, Sair |
| Início | `wf-h1` a `wf-h3`, `wf-h1m` | o cartão, senão "O que vamos construir?" | barra, `/`, passo 4, convite | Projeto, Todos os projetos, seção do cartão |
| Todos os projetos | `wf-h1` | os cartões | barra | Projeto, página seguinte |
| Configurações | `wf-s1`, `wf-s1m` | o índice e a seção | barra, cartão, conta | **Voltar** ao Início, outra seção |
| Passos 1 a 4 | `wf-o1` a `wf-o4`, `wf-o2m` | "Passo n de 4" e o título | convite do dono, a empresa | passo seguinte, Início, Sair |
| Central | `wf-c1` | Clientes | conta (operador), `/` sem empresa | cliente, Estado do Hub, empresa |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Barra | os cinco primeiros | só Início | esqueleto do grupo | o grupo some | — | Central só ao operador | sessão vencida: entrar (W15) |
| `/` | — | "Nenhuma empresa" | a partilhada | a de `ui/` | lembrada sumida: a primeira | — | — |
| Início | passo 4, cartão | "Nenhum projeto ainda." | esqueleto dos cartões | na área | empresa: sem barra | membro: sem cartão | banco indisponível: o aviso da 7 |
| Todos os projetos | — | idem | idem | idem | página além do fim: a primeira | — | idem |
| Configurações | — | "Nenhuma seção encontrada." | esqueleto | na área | seção desconhecida | membro: frase e link (V29) | recusas da 4 e da 11 |
| Passos | passo 1 | — | a partilhada | no formulário | — | não dono: Início | recusas da 4 e da 11 |
| Cartão | — | some com tudo feito | não aparece | não aparece | — | membro: nunca | — |
| Central | — | sem clientes: o de hoje | a partilhada | na área | cliente desconhecido | não operador: não encontrado | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `listCompanies.companies` (filtrado) | o Hub (U1) | troca, `/` |
| `staticData.place` | cada rota | topo do celular |
| `staticData.section {group, label, order, keywords}` | cada rota de seção | índice, busca |
| lembrado `companies`, `projects.<empresa>` | `onEnter` das três molduras; a moldura da casa, pela rota do Projeto | `/`, barra |
| `Accounts.mayManage`, `Accounts.company` | o Hub (11) | Contas de modelo, `preparationOf` |
| membros e convites pendentes | o Hub (4) | `preparationOf` |
| `CompanyDetail.nickname` | passo 1 | `enterCompany`, Geral |

## A tabela de falhas

| Gravação ou comando | Duas vezes | Recusada no meio | Dependência fora | Imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Lembrar empresa e Projeto (navegador) | a última escrita vale, sem repetir | recusado: nada lembrado, `/` abre a primeira | nenhuma | nada | 2, 3 |
| Tema (navegador) | idem | vale só nesta página | nenhuma | nada | 16 |
| `setCompanyNickname`, do passo 1 (da 4) | `COMPANY_NICKNAME_SET` segue ao passo 2 | a da 4 | 503: o aviso da 4 | o da 4 | 19 |
| Ligar conta, do passo 2 e da seção (da 11) | a da 11 | a da 11 | a da 11 | o da 11 | 20 |
| `createInvitation`, do passo 3 (da 4) | chave de tentativa (W24) | a da 4 | a da 4 | o da 4 | 21 |
| `createProject`, do Início (da 7) | chave de tentativa (W24) | a da 7 | a da 7 | o da 7 | 10 |

## O que nasce novo e o que é trazido

| Parte | Nativo, trazido ou nosso | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Barra lateral | trazido: `sidebar` do shadcn, estilo `base-nova` (registro lido em 2026-10-19, CLI 4.22.1), por `npx shadcn add` | `ui/sidebar.tsx`, `ui/use-mobile.ts` | sem `style`: `--sidebar-width` do provedor e da gaveta e `--skeleton-width` viram tokens de contêiner em `brand/tokens.css` (V17, V23); sem o cookie `sidebar_state`; `cn` pelo `ui/cn.ts`; o que o knip achar sem uso sai | 768 px e Ctrl+B: do shadcn |
| Composição da barra | modelo: o bloco `sidebar-07` | `company-switcher.tsx`, `account-menu.tsx`, `recent-projects.tsx` | peças nossas | — |
| Layouts, guarda, lugar | nativo: layouts, rotas não aninhadas, `onEnter`, `staticData`, os componentes de espera, erro e não encontrado | `routes/` | — | — |
| Índice de Configurações | nosso, lido de `router.routesById`; modelo: `settingsSections.ts` do Mastra Factory (fork `ce7e9c30`) | `ui/settings-index.tsx` | — | Você e a empresa (F3, F4) |
| Passos, progresso | nosso; modelo: a primeira entrada do Linear | `ui/welcome-frame.tsx`, `hub/identity/welcome-*.tsx` | o apelido sai de `company-setup.tsx` | quatro passos, 2 e 3 se pulam (F7) |
| Lembrados | nosso, como o tema | `platform/remembered.ts` | — | — |

**A medida do transplante.** Do Conexus OS (`e0353c36`), só desenhos: é novo (`conexus-study`,
passo 5).

**A dívida.** Última empresa e Projetos recentes só da primeira página da lista (50); um Projeto
apagado sai dos recentes ao reler a lista. A barra aberta à mão não fica
lembrada. A W1 ainda diz que a moldura é o componente de `_app/route.tsx`: muda no fechamento (L20).

## U1 A lista de empresas

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `server/src/hub/identity/companies.ts` (`readMemberships`, `readCompany`), `companies.test.ts` | o filtro, o cursor e a leitura | `company-routes.ts` |
| `hub-api/src/companies.ts` | o `summary` | OpenAPI, web |

### Os contratos que a unidade cria

Mesma forma; o `summary`: "Lists the companies the person can open."

### A ordem do trabalho

O filtro `role = 'owner' or nickname is not null` na lista, no cursor e em `readCompany`. Regras: S10, D20, C26.

### Como se prova

1, pela rota.

## U2 A moldura

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `web/src/ui/sidebar.tsx`, `separator.tsx`, `use-mobile.ts`, `frame.tsx`, `states.tsx` (e o que o `add` trouxer: `button`, `input`, `sheet`, `skeleton`, `tooltip` já existentes, comparados); `brand/tokens.css` | cria; reescreve `Frame`; `NotFound` único (issue 39, item 11) | as molduras |
| `web/src/platform/remembered.ts` | cria | `hub/identity`, `hub/projects` |
| `routes/_app/route.tsx`, `route.test.tsx`, `index.tsx`, `companies/$companyId/route.tsx` (de `$companyId.tsx`), `companies/$companyId/model-account.tsx`, `operations/route.tsx`, `index.tsx`, `status.tsx`; `main.tsx` (`StaticDataRouteOption`) | muda, cria | `routeTree.gen.ts` |
| `hub/identity/` `company-switcher.tsx`, `account-menu.tsx`, `enter-company.ts`, `no-company.tsx`, `public.ts`; `companies.tsx`, `greeting.tsx` saem | cria, muda, apaga | as rotas |
| `hub/projects/recent-projects.tsx`, `public.ts`; `hub/status/`, `hub/operations/clients.tsx`, `guard.ts` | cria, muda | as rotas |
| `apps/web/package.json`, `package-lock.json` | só se o `add` pedir pacote (L16) | build |

### Os contratos que a unidade cria

`Frame(props: {header: ReactNode; nav: ReactNode; footer: ReactNode; place: string; compact:
boolean; children: ReactNode})`; `Column` fica. `remember(list: string, personId: PersonId, id:
string, keep: number): void`; `recall(list: string, personId: PersonId): string[]`.
`enterCompany(context: RouterContext, companyId: CompanyId): Promise<{company: CompanyDetail; role:
Role}>`; `companyParams` (o `parse` de hoje). `lastCompanyOf(personId): CompanyId | undefined`,
`rememberCompany(personId, companyId)`; `RecentProjects({companyId})`,
`rememberProject(personId, companyId, projectId)`. `StaticDataRouteOption`: `place?: string;
section?: {group: 'you' | 'company'; label: string; order: number; keywords?: readonly string[]}`.

### A ordem do trabalho

1. `npx shadcn add` da `sidebar` `base-nova` fora da árvore; ler, copiar, refatorar (W21, W22, V17,
   V22, V23, V26, 0033).
2. Molduras e guardas; `/`. Regras: W1, W4 a W8, W15, W17, C26, S10.
3. Barra, troca, conta, recentes, Central. Regras: V5, V28, V30, V31, V34, V35, V39, V56.
4. A gaveta e as dicas sob a CSP; recusadas, voltam ao cartão (L7). Regras: W22, T23.

### Como se prova

2 a 9. Capturas: `wf-v2`, `wf-navm`, `wf-c1`, `wf-e1` a `wf-e5`, e `now-18`, `now-26`.

## U3 O Início

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `routes/_app/companies/$companyId/index.tsx`, `projects/index.tsx` | muda | `routeTree.gen.ts` |
| `hub/projects/home.tsx`, `project-cards.tsx`, `create-project-form.tsx`, `projects.tsx`, `public.ts` | cria, muda | as rotas |

### Os contratos que a unidade cria

`Home({companyId, aside?: ReactNode})`, onde a U5 põe o cartão; `ProjectCards({companyId, page})`.

### A ordem do trabalho

Regras: W17, W18, W24, V19, V22 (`card`), V35, V39. Capturas: `wf-h1`, `wf-h2`, `wf-h3`, `wf-h1m`.

### Como se prova

10, 11.

## U4 Configurações

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `routes/_app/companies/$companyId_/settings/` (as oito rotas); `$companyId/people.tsx`, `setup.tsx` saem | cria, apaga | `routeTree.gen.ts` |
| `ui/settings-index.tsx` | cria | a moldura de Configurações |
| `hub/identity/my-account.tsx`, `company-general.tsx`, `people.tsx`, `public.ts` | cria, muda | as rotas |
| `builder/model-accounts/company-accounts.tsx`, `my-accounts.tsx` e os testes `mine`, `model-accounts`, `connect`, `model-fallback` | `getRouteApi` passa à rota da seção (W8); a frase de `mayManage`; os endereços novos | as rotas |
| `platform/theme.ts`, `ui/theme-choice.tsx` | `choice: 'light' \| 'dark' \| 'system'` | conta, Aparência |

### Os contratos que a unidade cria

`SettingsIndex({sections: {to; label; group; keywords}[]; groupName: string})`; `useTheme():
{theme; choice; choose(choice)}`.

### A ordem do trabalho

Regras: W4, W6, W8, W18, V9, V29, V31, V39, C26. Capturas: `wf-s1`, `wf-s1m`; `os-55` a `os-59`.

### Como se prova

12 a 17.

## U5 A primeira entrada

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `routes/_app/companies/$companyId_/welcome/` (seis rotas); `companies/$companyId/route.tsx`, `index.tsx` | cria; a entrada sem apelido; o cartão no Início | `routeTree.gen.ts` |
| `ui/welcome-frame.tsx` | cria | as rotas |
| `hub/identity/preparation.ts`, `preparation-card.tsx`, `welcome-company.tsx`, `welcome-team.tsx`, `invitation.tsx`, `public.ts`; `company-setup.tsx` e o teste saem | cria, muda, apaga | as rotas |
| `builder/model-accounts/public.ts` | exporta a escolha de forma da 11 | o passo 2 |

### Os contratos que a unidade cria

`preparationOf(input: {nickname: CompanyNickname | null; others: number; pending: number;
companyAccounts: number}): {company: boolean; modelAccount: boolean; team: boolean}`;
`PreparationCard({companyId, companyAccounts})`; `WelcomeFrame({step: 1 | 2 | 3 | 4; back?:
LinkProps; children})`.

### A ordem do trabalho

Regras: W15, W23, W24, C48, V29, V30, V39. Capturas: `wf-o1` a `wf-o4`, `wf-o2m`; `now-23`,
`now-94` ao lado.

### Como se prova

18 a 23.

## U6 Percursos, capturas, roteiro

`house.test.ts` faz o roteiro; percursos e varredura (`live-hub.ts`, `hub-window.ts`,
`sweep-states.ts`) andam pela barra nova. 28 após o Release (L17).
