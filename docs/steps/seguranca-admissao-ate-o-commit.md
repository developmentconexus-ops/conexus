# Segurança: a admissão segura o papel até o commit

## A página do fundador

**No fim desta etapa** quem perde o papel de dono ou administrador no meio de um pedido não
consegue mais iniciar nem parar uma cópia ou um tratamento, nem remover uma ligação, nem abrir um
login de conta de modelo. E o link de convite não lê mais a senha guardada de outra pessoa.

**O roteiro de uso.** Não há tela nova. O que você vê:

1. Na empresa de teste, a Ana (administradora) pede "Rodar agora" numa cópia; a rodada começa,
   como hoje.
2. Você tira o papel de administradora da Ana; ela pede "Rodar agora" de novo e recebe a mesma
   página de não encontrado que um estranho recebe.
3. Você convida uma pessoa nova; ela abre o link, define a senha e entra, como hoje.

A prova de que a corrida está fechada não cabe no seu tempo: são os testes dos critérios 1 a 6,
que ficam vermelhos no `main` de hoje e verdes depois.

**O que você faz, e quando.** No começo: aprova esta página e responde A e B. No fim: faz o
roteiro e diz o que viu.

**A visão.** "Uma ação fora do papel fica à vista, desligada, e diz quem pode": a etapa faz o
servidor valer o mesmo papel até a gravação. Não cruza nenhuma linha.

**Fica de fora.** A senha do convidado gravada pela volta do link de redefinição (achado A2 do
estudo de pacotes): é ela que obriga o papel `hub_invitation` a ler `auth.account`; trocá-la é
mudança de login, com cartão próprio. Os outros achados do estudo (A3 a A10, B1, B3 a B8, E1 a E4,
E9). As admissões do operador (`admitOperator`), que já agem na mesma transação. As árvores que a
limpeza do harness antigo (https://github.com/developmentconexus-ops/conexus/pull/1523) apaga (`agents/**` e
`harness/{machine,routes,spec,tools,turn,prompt}`): três delas têm o mesmo defeito
(`agents/agent-builder/routes.ts:29`, `agents/saved-agent/conversation-routes.ts:46`,
`harness/spec/admission.ts:19`) e saem com ela. A etapa se constrói depois que essa limpeza entra.

**As decisões suas nesta etapa.**

- **A. O que fazer com a leitura de `auth.account` e `auth.verification` pelo convite.** Você
  disse "tirar o SELECT". Lendo o código, o SELECT é usado: o convite define a senha dentro da
  transação do convite, e ali a biblioteca lê a conta para saber se já há senha
  (`hub/identity/auth.ts:252-256`), lê a conta com o hash para entrar
  (`better-auth@1.7.28` `dist/api/routes/sign-in.mjs:320`) e lê e apaga o código de redefinição
  (`dist/api/routes/password.mjs:59,154-157`). Sem o SELECT, ninguém convidado consegue entrar.
  - **(a) Recomendado, nativo.** Manter a permissão e ligar a regra por linha: o convite só vê a
    conta e o código da pessoa convidada (ou da pessoa da sessão). É o mesmo desenho que
    `auth.session` e `auth."user"` já têm (`hub/identity/tables.ts:68-75,128-138`). Nenhuma
    permissão muda, então não pede o pull request próprio da regra de dados D11.
  - **(b)** Tirar o SELECT, como você disse. Pede antes o cartão do A2 (a senha gravada pela API
    admin, sem a volta do link) e um pull request só da lista de permissões (D11).
- **B. Ações com efeito fora do banco antes da gravação.** Remover uma ligação apaga a cópia do
  lago e devolve a autorização ao provedor antes de apagar a linha
  (`hub/connectors/connections.ts:307-319`); salvar a cópia apaga tabelas do lago antes da
  gravação (`hub/copies/lake-copy.ts:266-278`); parar a cópia silencia o escritor antes de marcar
  a parada (`hub/copies/lake-stop.ts:56-57`). Hoje quem perdeu o papel no meio ainda causa esses
  efeitos; só a gravação final é recusada.
  - **(a) Recomendado.** A admissão fica aberta durante esses efeitos: a retirada do papel espera
    alguns segundos até o pedido terminar. É o que a regra S8 pede ("serializar com a revogação
    até o commit"). Custo: uma conexão do banco presa durante a chamada à AWS.
  - **(b)** Manter como está nesses três: admitir, agir, admitir de novo na gravação. A corrida
    fica aberta só para eles.

As suas respostas a este cartão: (a preencher pelo firstmate com as suas palavras, a data e o
commit; o arquivo de aprovação leva a linha `Cartão curto "Segurança: a admissão segura o papel
até o commit" (\`docs/steps/seguranca-admissao-ate-o-commit.md\`) aprovado em AAAA-MM-DD (commit
<sha>): "<suas palavras>"`).

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 | `commandAs`/`readAs` na identidade; as seis rotas com o defeito passam a admitir na transação que grava | `apps/server/src/hub/identity`, `hub/copies`, `hub/treatment`, `hub/connectors`, `harness/model-accounts`, `platform` | segurança | a limpeza do harness antigo em `main` |
| G1 | U2 | Toda outra rota de empresa que escreve passa a `commandAs`; as 12 cópias de `scopeOf` saem; `admitMember` deixa a porta da identidade | as mesmas, `harness/network`, `hub/projects`, `hub/requests`, `hub/apps`, `hub/data`, `hub/notifications` | segurança | U1 |
| G1 | U3 | Regra por linha nas sete tabelas sem ela; o convite vê só a conta e o código da pessoa convidada | `apps/server/src/hub/identity`, `hub/apps`, `hub/status`, `platform`, `apps/server/drizzle` | dados | — |

**Orçamento de código alterado.** U1: ~200. U2: ~300 (inferido de 22 arquivos com
`admitMember` fora da limpeza do harness antigo e 12 `scopeOf`). U3: ~60 mais a migração gerada. Total: ~560. Um pull
request (delivery L9). Com A (b), a U3 sai deste cartão.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | "Rodar agora" (`runLakeCopy`) com a retirada do papel ao mesmo tempo: a retirada espera o pedido terminar; com a retirada antes, o pedido recebe 404 e nenhuma rodada abre. Hoje a retirada passa na frente e a rodada abre | `hub/copies/lake-routes.test.ts`, caso novo de corrida | must |
| 2 | U1 | O mesmo para parar a cópia (`stopLakeCopyRun`) e salvar a cópia (`setLakeCopy`): com o papel retirado antes, 404 e nenhuma tabela apagada no lago | `hub/copies/lake-routes.test.ts` | must |
| 3 | U1 | O mesmo para "Tratar agora" (`runTreatmentNow`) e parar o tratamento (`stopTreatmentRun`) | `hub/treatment/treatment-access.test.ts`, casos novos de corrida | must |
| 4 | U1 | Remover uma ligação com o papel retirado no meio: 404, a cópia do lago fica e o provedor não é chamado | `hub/connectors/connection-links.test.ts`, caso novo | must |
| 5 | U1 | Abrir o login de uma conta de modelo (`startSignIn`) com o papel retirado no meio: 404 e nenhuma linha em `model_account_sign_in` | `harness/model-accounts/sign-ins.test.ts`, caso novo | must |
| 6 | U1, U2 | Nenhuma rota de empresa escreve com uma admissão de outra transação: `admitMember` não é exportado pela porta da identidade, e o verificador de tipos recusa uma chamada fora dela | `npm run check` (tipos); `hub/identity/identity.test.ts`, a porta sem `admitMember` | must |
| 7 | U2 | As respostas das rotas migradas não mudam: a suíte das rotas tocadas passa sem editar o que espera | os testes das pastas da U2, intocados nas asserções | must |
| 8 | U3 | Toda tabela tem regra por linha, salvo `drizzle.__drizzle_migrations` | `platform/catalog.test.ts`, `WITHOUT_POLICY` com uma linha só | must |
| 9 | U3 | No escopo de um convite, `auth.account` e `auth.verification` mostram só as linhas da pessoa convidada ou da pessoa da sessão; hoje mostram as de todos | `hub/identity/tables.test.ts`, caso novo | must |
| 10 | U3 | O convite ainda define a senha e entra; a recuperação de senha e o primeiro administrador ainda funcionam | `invitation-journey.test.ts`, `password-recovery.test.ts`, `first-person.test.ts`, intocados | must |

## A matriz de estados

Nenhuma tela. Nenhum campo de contrato muda.

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Banco ou terceiro fora | O que imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Abrir rodada de cópia (insere `lake_run`) | o índice da rodada aberta recusa a segunda, 200 `already` (como hoje) | a admissão falha: nada inserido, 404 | banco fora: 503 (como hoje) | `COPY_RUN_QUEUED` só depois do commit | 1 |
| Marcar parada (`lake_run.stopped_by`, `treatment_run.stopped_by`) | `coalesce` guarda o primeiro | 404 antes de silenciar o escritor (B a) | AWS fora durante o silêncio: a admissão cai junto, 503 | `LAKE_COPY_STOP_ASKED`, `TREATMENT_STOP_ASKED` | 2, 3 |
| Abrir rodada de tratamento (`openIn`) | `ALREADY_RUNNING` (como hoje) | 404, nada aberto | 503 | `TREATMENT_RUN_OPENED` | 3 |
| Salvar a cópia (`written`, `dropUnmarked`) | o `transactionLock` da ligação (como hoje) | 404 antes de apagar no lago (B a) | AWS fora: 503, a admissão cai | `LAKE_COPY_SET` | 2 |
| Remover ligação (`unlink`) | 200 igual para quem já sumiu (critério 13 do conector) | 404 antes de `leaveCopy` (B a) | provedor fora: a remoção segue (como hoje) | — | 4 |
| Abrir login de conta de modelo (`insertSignIn`) | duas linhas, uma por pedido (como hoje) | 404, nenhuma linha | fornecedor fora: 502 (como hoje), nada gravado | — | 5 |
| Retirar papel (`changeMemberRole`, `removeMember`) | o `for no key update` do papel (como hoje) | — | — | — | 1 a 5 |
| Migração da U3 | — | a migração é uma transação | — | — | 8 |

## A tabela de referência

| Peça | Arquivo do `main` (8ddbdd453) | Referência | Veredito | Prova | Unidade, arquivo novo |
| --- | --- | --- | --- | --- | --- |
| Admitir e escrever numa só transação | `hub/copies/lake-routes.ts:33-47,60-73`; `hub/treatment/routes.ts:33-35,55-57`; `hub/connectors/connections.ts:307-309`; `harness/model-accounts/sign-ins.ts:142-144` (admissão que confirma sozinha) | O próprio Hub: `hub/projects/projects.ts:244-300`, `hub/copies/lake-copy.ts:217-224` admitem na transação que escreve; PostgreSQL: `SELECT ... FOR SHARE` vale até o fim da transação (manual, "Explicit Locking", row-level locks) | nativo | critérios 1 a 5, vermelhos hoje | U1, `hub/identity/admission.ts` |
| Uma porta de admissão que devolve a transação | 12 `scopeOf` (lista em B2 do estudo) e os invólucros `admit`/`admitted` por assunto | O Hub já tem o `Scope` em `platform/database.ts:65-69` e a prova `MemberProof` que a regra S7 pede; falta só a função que os junta à transação | nativo | critério 6, `npm run check` | U1, U2 |
| `locks: true` | `hub/identity/admission.ts:105,118,312-327` | — (a tabela fica como está) | nativo | critérios 1 a 5 | U1 |
| Regra por linha do convite em `auth.account` e `auth.verification` | `database-grants.sql:226,284`; `hub/identity/tables.ts:142-174` sem política | Drizzle `pgPolicy` (`drizzle-orm` `pg-core/policies`), como `auth.session` em `hub/identity/tables.ts:128-138`; `better-auth@1.7.28` grava `value = user.id` no código de redefinição (`dist/api/routes/password.mjs:75-78`) | nativo | critérios 9 e 10 | U3, `hub/identity/tables.ts` |
| RLS nas cinco tabelas só do runtime | `hub/apps/tables.ts:35,67,85`; `hub/status/tables.ts:7`; `hub/identity/tables.ts:177` | `pgPolicy('runtime_all', { to: RUNTIME_LOGIN, using: OPEN })`, como `hub/identity/tables.ts:69,128` | nativo | critério 8 | U3 |

**A medida do transplante.** Nada vem do repositório antigo.

**A dívida.** `harness/model-accounts` mantém `flow.start()` (chamada ao fornecedor) antes da
admissão que grava: não toca dado da empresa, fica.

## As decisões do firstmate

| # | Decisão reversível | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | O trabalho que grava recebe quem abre a transação (`Writer`), em vez de cada função de rodada chamar `database.command` | O relógio (sem pessoa) e a rota (com pessoa) chamam a mesma `iniciarRodada` (`lake-run.ts:301`, `lake-copy.ts:291`, `conversations-of.ts:141`); só quem chama sabe se há admissão | Voltar `opened` a abrir a própria transação |
| 2 | Cartão da trilha de fronteira, sem linha `Trilho:` | Nenhum cartão de fronteira em `docs/steps/` (delivery L5) | Renomear |

## U1 A admissão até o commit

**Base e modelo.** `main` depois da limpeza do harness antigo. Opus: concorrência entre módulos.

### As linhas da tabela

As três primeiras linhas da tabela de referência.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `hub/identity/admission.ts`, `public.ts` | Cria `commandAs`, `readAs` | todas as rotas de empresa |
| `hub/copies/lake-routes.ts`, `lake-run.ts`, `lake-stop.ts`, `lake-copy.ts` | Muda | `main.ts`, `harness/copy-clock/workflow.ts`, `conversations-of.ts` |
| `hub/treatment/routes.ts`, `treatment-run.ts`, `treatment-stop.ts` | Muda | `main.ts` |
| `hub/connectors/connections.ts` | Muda `unlink` | `hub/connectors/routes.ts` |
| `harness/model-accounts/sign-ins.ts` | Muda `startSignIn`, `insertSignIn` | `harness/model-accounts/routes.ts` |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/identity/admission.ts, exportado pela porta em public.ts
export type Member = Readonly<{ personId: PersonId; companyId: CompanyId }>
commandAs<T>(who: Member, action: MemberAction,
  work: (tx: CommandTx, proof: MemberProof) => Promise<T>): Promise<T>
readAs<T>(who: Member, action: MemberAction,
  work: (tx: ReadTx, proof: MemberProof) => Promise<T>): Promise<T>
// apps/server/src/platform/database.ts
export function memberScope(who: Member): CompanyScope & { personId: PersonId }
export type Writer = <T>(work: (tx: CommandTx) => Promise<T>) => Promise<T>
```

Nenhuma rota, coluna, código de falha ou campo de contrato muda. `MemberProof` já tem marca
(`sealMember`, `admission.ts:330-333`). Arquivo modelo: `hub/projects/projects.ts` (C21, C23, C26).

### As skills e a leitura

`fastify-best-practices`, `better-auth-best-practices`, `better-auth-security-best-practices`,
`pstack:typescript-best-practices`; segurança S7, S8, S10.

### A ordem do trabalho

1. **Os testes de corrida, vermelhos.** Critérios: 1 a 5.
   - **Referência a seguir:** `hub/requests/races.test.ts:10-27` (`withOwnerLock`, `queued`) e
     `hub/identity/memberships-race.test.ts`.
   - **Testes:** prender a tabela da gravação (`lake_run`, `treatment_run`, `connection`,
     `model_account_sign_in`) com `withOwnerLock`, mandar o pedido, `queued(1)`, mandar a
     retirada do papel pela rota `changeMemberRole`, e esperar `queued(2)`: hoje não chega a 2.
2. **`commandAs` e `readAs`.** Critério: 6. Regras: S7, S8.
   - **O que entra:** abrem `database.command`/`read` em `memberScope(who)`, chamam o `admit`
     de hoje e passam a prova ao trabalho.
3. **As seis rotas.** Critérios: 1 a 5.
   - **O que entra:** `opened` (`lake-run.ts:254`, `treatment-run.ts:65`), a marca de parada
     (`lake-stop.ts:56`, `treatment-stop.ts:29`), `insertSignIn` e o `delete` de `unlink`
     recebem um `Writer`; o relógio passa `(w) => database.command(companyScope(id), w)`, a rota
     passa `(w) => identity.commandAs(who, action, (tx) => w(tx))`. Com B (a), os efeitos fora
     do banco de `unlink`, `set` e `stop` rodam dentro do `commandAs`.
   - **Mutações à mão:** em cada rota, voltar a admissão para a transação própria; o teste de
     corrida fica vermelho.

### Como se prova

Os critérios 1 a 5 pelos testes de corrida: vermelhos na base, verdes depois.

### Parar se

Um efeito mantido dentro do `commandAs` abre uma transação que espera um bloqueio da de fora
(40P01 ou o teste não termina): parar e reportar com o teste.

## U2 Uma porta para toda escrita de empresa

**Base e modelo.** U1. Sonnet: migração mecânica.

### As linhas da tabela

A segunda linha.

### O raio da mudança

Os 22 arquivos fora da limpeza do harness antigo que chamam `admitMember` (`git grep -l admitMember apps/server/src`),
e os 12 `scopeOf` da linha B2 do estudo.

### Os contratos que a unidade cria

Nenhum. Sai `admitMember` da porta (`hub/identity/public.ts:103`) e cada `scopeOf`.

### As skills e a leitura

As da U1.

### A ordem do trabalho

1. **Migrar e apagar numa onda.** Critérios: 6, 7. Cada `database.command(scope, tx => {
   admitMember(...); ... })` vira `identity.commandAs(who, action, (tx) => ...)`; o mesmo para
   leituras com `readAs`. Por último, `admitMember` sai da porta.

### Como se prova

`npm run check` e os testes das pastas tocadas, sem mudar asserções.

### Parar se

Uma rota admite com um escopo que não é `memberScope` (pessoa e empresa da sessão): reportar.

## U3 Regra por linha nas sete tabelas

**Base e modelo.** `main`. Sonnet.

### As linhas da tabela

As duas últimas linhas.

### O raio da mudança

| Pasta | Cria, muda ou apaga | Quem importa |
| --- | --- | --- |
| `hub/identity/tables.ts`, `hub/apps/tables.ts`, `hub/status/tables.ts` | Muda | `drizzle.config` |
| `apps/server/drizzle/` | Cria uma migração gerada | `migrate` |
| `platform/catalog.test.ts` | Muda `WITHOUT_POLICY` | — |

### Os contratos que a unidade cria

Políticas, nenhuma coluna. Em `account`: `runtime_all` (runtime, `true`) e, para `hub_invitation`,
`user_id = scoped.personId or exists (select 1 from auth.invitation i join auth."user" u on
u.email = lower(i.email) where i.id = scoped.invitationId and u.id = account.user_id)`. Em
`verification`, o mesmo com `value` no lugar de `user_id`. Nas outras cinco, só `runtime_all`.
Nenhum `GRANT` muda.

### As skills e a leitura

`node_modules/drizzle-kit/skills/`, `neon:neon-postgres`; dados D7, D10, D11, D12.

### A ordem do trabalho

1. **O teste do convite, vermelho.** Critério 9: duas pessoas com senha e um convite; no escopo
   do convite, `select count(*) from auth.account` dá 2 hoje.
2. **As políticas e a migração** (`npm run generate`). Critérios: 8, 9, 10.
   - **Mutações à mão:** tirar a cláusula `or exists` da política de `account`: o critério 10
     fica vermelho (o convidado novo não entra).

### Como se prova

Critérios 8 a 10 pelos testes citados; `check-migrations` local.

### Parar se

Um caminho da biblioteca lê `auth.verification` no escopo do convite com `value` que não é um id
de pessoa: reportar com a chamada.

## G1 O ponto de conferência

Servidor de pé com os dublês, o roteiro da página feito pela API (`runLakeCopy` antes e depois
de `changeMemberRole`; convite até a sessão), a migração aplicada num banco limpo e `npm run
check:local` em segundo plano.
