# Etapa 6: Tirar uma pessoa

## A página do fundador

**No fim desta etapa** o dono tira alguém, uma pessoa sai sozinha, e a Central muda pessoas e
papéis de qualquer empresa, sem deixá-la sem dono. Quem esqueceu a senha recebe um link, e uma
senha vazada é recusada sem gastar o link.

**O roteiro de uso.** No Hub publicado, sem terminal. Antes: a Empresa A ativa, com o dono na
segunda caixa; ele convida a terceira caixa como administradora; ela aceita e convida um e-mail
qualquer.

1. Na janela do dono, em **Pessoas**, clique **Sair da empresa**: "A empresa precisa de pelo menos
   um dono. Torne outra pessoa dona antes de sair."
2. Ainda como dono, tire a administradora. A confirmação avisa: "O convite que ela enviou será
   cancelado." Na janela dela, recarregue: **Página não encontrada**, e A some de **Suas
   empresas**. Ela ainda entra com a senha dela.
3. Na Central, abra A: **Pessoas** mostra o dono. Convide a terceira caixa como dona; ela aceita.
   Na Central, torne o dono antigo administrador.
4. Na janela do dono antigo, clique **Sair da empresa**: sai e vai para Suas empresas.
5. Numa janela anônima, **Esqueci minha senha** com a terceira caixa. No e-mail, abra o link e
   tente `123456789`: "Esta senha apareceu em vazamentos de dados." O link continua valendo.
   Escolha outra senha e entre. A janela antiga dela, recarregada, pede para entrar de novo.

**O que você faz.** Antes de U1: a palavra sobre o grant (D11). No fim: o roteiro e os textos.

**Decisões já dadas** (2026-10-17): 1A, 2A, 3A, 4A, 5A, 6A, 7B, T1A, T2A, T3A, T4B, e "Tudo A"
para as quatro perguntas seguintes, aqui P1 a P4:

- **P1.** A Central age nas pessoas como um dono, sem virar membro: lê nome e e-mail de todas,
  muda papéis, tira, convida dono; o último dono vale para ela; nunca mexe em senha ou sessão.
- **P2.** Todo link de senha vale 1 hora. **Isto muda a sua aprovação da etapa 3** ("vale 15
  minutos"), pelo seu "Tudo A": o link da primeira pessoa passa a 1 hora.
- **P3.** Um e-mail de recuperação por pessoa por minuto.
- **P4.** Uma etapa só: o grant primeiro, em PR próprio; depois duas frentes ao mesmo tempo, 6a
  (vínculos, Pessoas, Central) e 6b (recuperação, senha vazada, sessões). O orçamento caiu para
  cerca de 3.700 linhas, abaixo do teto, e esse formato fica.

**Consequências, sem palavra nova.** Quem sai também cancela os convites que enviou, como quem é
tirado (2A); a confirmação avisa: "Os {n} convites que você enviou serão cancelados." Tirar, sair
e mudar papel usam as gravações do adaptador do Better Auth, não as rotas nativas: estas exigem que
quem age seja membro, e a Central não é; e a regra nativa do último dono conta sem trava. A regra
fica uma só, no Hub, sob a trava da empresa.

**O grant que você aprova em U1.** Às rotas da empresa: apagar um vínculo e mudar o papel dele.
Ao link de convite: apagar sessões, porque trocar a senha encerra as outras (4A). Menos que a
explicação: o adaptador não grava a empresa ativa da sessão, e a Central já age pelas rotas da
empresa. Junto, uma regra no banco que limita os dois às sessões da própria pessoa (issue 57).

**Fica de fora.** Banir no Conexus inteiro (3A). Avisar o dono do que a Central muda.

**Quem muda o papel de quem** ("Respondo: A"). O dono e a Central mudam qualquer papel, sem
deixar a empresa sem dono; a administradora, só entre administrador e membro, também a si; o
membro, nenhum.

## O que mudou desde o estudo

Em `841fdec` (o estudo leu `10c4e0f`): a 5 deu `DELETE` em `auth.member` só a `hub_operator`, e
`company_all` já cobre `ALL`; a fase 2 manteve `runtime_sign_in` (`20261017141753`); a senha do
convite roda em `hub_invitation` (`invitation-response.ts:69-93`); a Central convida dono pelas
rotas da empresa, só sem membro (`admission.ts:153-166`); a validade é uma opção só
(`password.mjs:70`).

## As issues abertas

| Issue | Na etapa 6? | Por quê |
| --- | --- | --- |
| 57 sessões sem política | Sim, só `auth.session` | U1 amplia a escrita nela |
| 62 cliente ativo sem dono | Sim | Critério 6 |
| 39, item 12 (`next-card`) | Sim | U3 reescreve `people.tsx` e tira o `.catch` em volta de `mutateAsync` |
| 56, 66 política exigindo membro | Não | A Central não é membro (P1); a admissão decide (S7) |
| 59, 68 portas sem escopo | Não | `libraryInstallation`, que a recuperação chama, só alcança as tabelas do login; a cerca é um check (L20) |
| 60 operador promovido | Não | Fora do tema |
| 76, 78 renovação | Não | Fora do tema |
| 45, 25, o resto da 39; 58, 61, 63, 64, 67, 69–74, 79 | Não | Fora do tema |

**Seguimentos** (issue futura): a senha checada antes do link; o tempo do 202; a issue 60.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | Grant e política de sessões (PR próprio, D11) | migrações, grants, `identity/tables.ts` | dados | neon-postgres | palavra do fundador |
| U2 | 6a: vínculos no servidor | contrato, identidade, operações | segurança | organization-best-practices | U1 |
| U3 | 6a: Pessoas e Central | web identidade e operações | web | shadcn | U2 |
| U4 | 6b: recuperação no servidor | contrato, identidade, correio | segurança | email-and-password-best-practices, better-auth-security-best-practices | U1 |
| U5 | 6b: senha vazada | identidade | segurança | better-auth-security-best-practices | U1 |
| U6 | 6b: telas de recuperação | web identidade, rotas públicas | web | shadcn | U4, U5 |
| U7 | Percurso e remoções | e2e, `scripts/` | testes | nenhuma | 6a e 6b no ramo da etapa |

**As frentes.** Depois de U1, 6a (U2, U3) e 6b (U4–U6) correm em ramos saídos do ramo da etapa.
6a entra nele primeiro; 6b refaz sobre ele só a tabela abaixo; os outros arquivos são de uma
frente só. Depois U7, uma revisão e um merge (L9, L13).

| Arquivo compartilhado | 6a muda | 6b muda |
| --- | --- | --- |
| `packages/hub-api/src/failures.ts` | `LAST_OWNER`, `MEMBER_STALE`, no fim | `PASSWORD_COMPROMISED`, `PASSWORD_CHECK_UNAVAILABLE`, `RECOVERY_ATTEMPTS_EXCEEDED` após `PASSWORD_LINK_INVALID`, e a ação deste |
| `packages/hub-api/src/companies.ts` | `removeMember`, `changeMemberRole`, `Member` | só as falhas de `createInvitationPassword` |
| `packages/hub-api/src/index.ts` | o bloco de `companies.ts` | o bloco de `identity.ts` |
| `apps/web/src/hub/identity/queries.ts` | as mutações de vínculo | `requestRecovery`, junto de `choosePassword` |
| `apps/web/src/platform/test-hub.tsx` | as operações de vínculo | as de recuperação |
| `docs/reference/boundaries.md` | o adaptador nos vínculos | o serviço de senhas e a recuperação |
| `scripts/removals.json` | as linhas de U2 | as de U4 e U5 |

**Orçamento de código alterado** (sem testes nem gerados): U1 **150**; U2 **800**; U3 **1.000**;
U4 **650**; U5 **250**; U6 **450**; U7 **100**; e **300** espalhados. Total: **3.700**, teto
4.000 (L2).

## Os critérios de aceite

| # | Unidade | Critério observável, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `hub_company` ganha `DELETE` e `UPDATE(role)` em `auth.member`; `hub_invitation`, `DELETE` em `auth.session`; `hub_operator` nada; `auth.session` tem RLS com as três políticas de U1 | `catalog.test.ts`; `isolation.test.ts` “sessões” | must |
| 2 | U1 | Sem filtro, o escopo do convite não apaga sessão de outra pessoa nem a de quem convidou, e o da empresa não muda a de outra | `isolation.test.ts` “sessões” | must |
| 3 | U2 | Dono tira qualquer um; administrador tira administrador e membro, dono dá 404; membro só a si; quem não é da empresa: 404 (S10). 204; a tirada lê a empresa: 404 | `memberships.test.ts` “quem tira quem” | must |
| 4 | U2 | Tirar ou sair cancela os convites pendentes que a pessoa enviou nessa empresa, pelo cancelamento de 4.1 (a revisão avança); `listMembers` os conta; uma recusa plantada entre apagar e cancelar não deixa nada | `memberships.test.ts` “convites do tirado” | must |
| 5 | U2 | Um caso por célula e por resultado da tabela de U2, o 409 também para a Central; `from` velho: 412 | `memberships.test.ts` “papel” | must |
| 6 | U2 | Sob corrida (dois rebaixamentos, duas remoções, sair contra rebaixar, Central contra dono), 20 de 20 terminam com dono; a empresa ativa nunca volta a aguardando, e a Central a lê sem 500 (issue 62) | `memberships.test.ts` “último dono sob corrida” | must |
| 7 | U2 | A Central, sem virar membro, lista pessoas e convites de empresa ativa, muda papéis, tira, convida dono; o último dono a recusa igual; outro: 404 | `memberships.test.ts` “Central”; `owner-invitation.test.ts` | must |
| 8 | U2 | Sair com a sessão apontando a empresa funciona; o campo fica, sem leitor | `memberships.test.ts` “sair” | must |
| 9 | U2 | `MEMBER_REMOVED`, `MEMBER_ROLE_CHANGED`: ids e papel, nunca nome ou e-mail (S41) | `memberships.test.ts` “log” | must |
| 10 | U3 | Cada célula da matriz renderiza; as ações vêm de `mayRemove` e `mayChangeTo`; corte, 502 ou 503 mantém o diálogo; T23 | `people.test.tsx`, `client.test.tsx`, navegador | must |
| 11 | U4 | `POST /api/password-recoveries`: 202 vazio com conta, sem conta, sem senha e no minuto do ritmo; só com senha, uma vez por minuto, envia, também com dois pedidos juntos; o link anterior para | `password-recovery.test.ts` | must |
| 12 | U4 | Quarto pedido da mesma rede em 60 s: 429 | `password-recovery.test.ts` “limite” | must |
| 13 | U4 | O e-mail sai depois do commit e da resposta; correio fora: 202 e `MAIL_UNAVAILABLE` | `password-recovery.test.ts` “correio” | must |
| 14 | U4 | O link vale 1 hora; trocar a senha apaga as outras sessões na mesma transação; o mesmo link de novo: 422 `PASSWORD_LINK_INVALID`; a senha do convite segue funcionando | `password-recovery.test.ts` “sessões”; suítes de 4.1 | must |
| 15 | U5 | Senha vazada em `PUT /api/passwords` e `PUT /api/invitations/{id}/password`: 422 `PASSWORD_COMPROMISED`, link e convite intactos, a senha limpa depois passa | `password-check.test.ts` | must |
| 16 | U5 | Serviço fora, com erro ou sem resposta em 3 s: 503 `PASSWORD_CHECK_UNAVAILABLE`, link intacto, nenhuma transação aberta | `password-check.test.ts` “fora” | must |
| 17 | U6 | Cada célula da matriz das telas de recuperação e do login; T23 | `forgot-password-form.test.tsx`, `set-password-form.test.tsx`, navegador | must |
| 18 | U7 | Tirar qualquer proteção com linha em `removals.json` faz o teste do seu critério falhar; grants e validade são literais (critérios 1, 14) | `npm run removals` | must |
| 19 | U7 | O roteiro | `tests/e2e/remove-person.test.ts` | must |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido, recusado ou concorrência |
| --- | --- | --- | --- | --- | --- |
| Pessoas, linha | nome, e-mail, papel; **Mudar papel** e **Tirar da empresa** só se o contrato permitir; na própria, **Sair da empresa** | 4.1 | 4.1 | a empresa: `NotFound` de 4.1 | relê a lista depois de cada ação |
| Mudar papel (diálogo) | os papéis de `mayChangeTo`, o atual marcado | “Salvando…” | corte, 502, 503: “Não confirmamos a mudança. Veja a lista.” | pessoa já tirada: fecha e relê | 412: “Esta pessoa mudou de papel enquanto você olhava.”; 409 `LAST_OWNER` |
| Tirar (diálogo) | “Tirar {nome} de {empresa}? Perde o acesso agora. A conta continua.”; com convites, “Os {n} convites que {nome} enviou serão cancelados.” ou, com um, “O convite que {nome} enviou será cancelado.” | “Tirando…” | como acima | já tirada: 204, relê | 409 `LAST_OWNER` |
| Sair (diálogo) | “Sair de {empresa}? Você perde o acesso agora.”; com convites, “Os {n} convites que você enviou serão cancelados.” | “Saindo…” | como acima | — | 409: “Torne outra pessoa dona antes de sair.”; sucesso: Suas empresas |
| Central, cliente ativo | 4.2, mais **Pessoas** (a mesma lista, ações e convites; convite só de dono) | 4.2 | 4.2 | 404 | como Pessoas |
| Esqueci minha senha | campo de e-mail | “Enviando…” | 429 `RECOVERY_ATTEMPTS_EXCEEDED` | — | corte, 502, 503: o texto do enviado |
| Enviado | “Se houver uma conta com esse e-mail, enviamos um link. Ele vale por 1 hora.” | — | — | — | — |
| Criar senha nova | senha e confirmação, regra visível | “Salvando…” | 422 vazada; 503 serviço fora; o link continua | 422 `PASSWORD_LINK_INVALID` com **Pedir outro link** | — |
| Login | **Esqueci minha senha** | 4.1 | 4.1 | — | depois da troca: “Senha trocada. Entre com a nova senha.” |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Member.mayRemove`, `Member.mayChangeTo: Role[]` | `readMembers`, pela tabela de U2 | linha de Pessoas e da Central |
| `Member.invitationsSent` | `readMembers`, pendentes vivos enviados por ela | diálogos de tirar e sair |
| `changeMemberRole` corpo `{role, from}` | diálogo | comando, sob a trava |
| `requestPasswordRecovery` corpo `{email}`; 202 sem corpo | formulário | comando |

Falhas novas (C48), USER e settles salvo dito: `LAST_OWNER` 409 (o texto do roteiro); `MEMBER_STALE`
412; `PASSWORD_COMPROMISED` 422, “… vazamentos de dados.” / “Escolha outra senha.”;
`PASSWORD_CHECK_UNAVAILABLE` 503 THIRD_PARTY, não settles, RETRY, o texto da 6A;
`RECOVERY_ATTEMPTS_EXCEEDED` 429 (U4). `PASSWORD_LINK_INVALID` passa à ação “Peça um link novo.”.

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Dependência fora | O que imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Tirar ou sair: `deleteMember` do adaptador; o cancelamento de 4.1 por convite do tirado | `lockCompany`: a segunda vê o vínculo sumido, 204 | rollback do vínculo e dos convites | banco: 503 | `MEMBER_REMOVED` | 3, 4, 6 |
| Mudar papel: `updateMember` do adaptador | `lockCompany` e `from`: 412 | rollback | banco: 503 | `MEMBER_ROLE_CHANGED` | 5, 6 |
| Convite de dono pela Central numa empresa ativa | `lockCompany`; `OWNER_INVITATION_OPEN` | como em 4.2 | como em 4.2 | códigos de 4.2 | 7 |
| Pedir recuperação: DELETE e INSERT em `auth.verification` | trava do endereço; o segundo no minuto não envia | rollback, nada enviado | banco: 503; correio: 202 e log | `PASSWORD_RECOVERY_REQUESTED`, `MAIL_UNAVAILABLE` | 11–13 |
| Trocar a senha: gasta o link, apaga sessões, grava a senha (nativo) | o link é gasto uma vez; o segundo: 422 | uma transação: nada fica | banco: 503 | `PASSWORD_SET` | 14 |
| `isPasswordCompromised` | sem estado | antes de qualquer transação | 3 s ou erro: 503, link intacto | `PASSWORD_CHECK_UNAVAILABLE` | 15, 16 |
| Migração de U1 | uma vez no `migrate` (D9) | uma transação: o Hub não sobe | `migrate` falha | código do `migrate` | 1, 2 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |
| Vínculos e último dono | nova | `memberships.ts`, `admission.ts`, `client.tsx` | — | `lockOwners` vira `lockCompany` (T2A); 7B |
| Recuperação, senha vazada | nova | `password-recovery.ts`, `password-check.ts` | — | link só ao comando; T1A |

**A medida do transplante.** Zero linhas. **A dívida.** Nenhuma.

## U1 Grant e política de sessões

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/migrations/` | cria a migração | `migrate`, `catalog.test.ts` |
| `apps/server/database-grants.sql` | muda, dono do retrato | `catalog.test.ts` |
| `apps/server/src/hub/identity/tables.ts` | `auth.session` com `withRLS` e as três políticas | migrações |
| `apps/server/src/platform/isolation.test.ts` | caso “sessões” | — |
| `scripts/removals.json` | `session-row-policy` | `npm run removals` |

### Os contratos que a unidade cria

`GRANT DELETE, UPDATE(role) ON auth.member TO hub_company`; `GRANT DELETE ON auth.session TO
hub_invitation`. Políticas em `auth.session`: `runtime_all` para `hub_runtime` (`true`);
`company_all` para `hub_company`, `user_id = conexus.person_id`; `invitation_all` para
`hub_invitation`, `user_id = conexus.person_id` ou o usuário cujo e-mail é o do convite do escopo,
só o convidado, nunca quem convidou. O cabeçalho da migração diz o que o `pgRole` do Drizzle não
gera (issue 72).

### A ordem do trabalho

PR próprio, à espera da palavra (D11); a suíte verde antes das frentes. Regras: D5–D7, D10–D12,
S15. Funções: drizzle-orm 1.0.0-rc.4 `pgPolicy`, `table.withRLS`.

### Como se prova

1, 2: `npm run test -w @conexus/server`, `npm run migrations -- --base origin/main`.

## U2 Vínculos no servidor (6a)

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/` | `companies.ts`, `failures.ts`, `index.ts` | servidor, web, OpenAPI |
| `apps/server/src/hub/identity/` | cria `memberships.ts`; muda `admission.ts`, `admission.check.ts`, `companies.ts`, `company-routes.ts`, `invitations.ts`, `invitation-management.ts` (o cancelamento) | rotas, operações |
| `apps/server/src/hub/operations/` | `owner-invitation.test.ts`, os casos da Central | — |
| `scripts/removals.json` | `member-company-lock`, `member-last-owner`, `member-actor-rank`, `member-role-from`, `removed-person-invitations` | `npm run removals` |
| `docs/reference/boundaries.md` | vínculos pelo adaptador | revisores |

### Os contratos que a unidade cria

- `removeMember`: DELETE `/api/companies/{companyId}/members/{personId}`, `session`; 204; 401,
  404, 409 `LAST_OWNER`, 503. A própria pessoa é “sair”.
- `changeMemberRole`: PUT `/api/companies/{companyId}/members/{personId}`, `session`, corpo
  `{role: Role, from: Role}`, limite 1024; 200 `{member: Member}`; 401, 404, 409 `LAST_OWNER`, 412
  `MEMBER_STALE`, 503.
- `Member` ganha `mayRemove: boolean`, `mayChangeTo: Role[]`, `invitationsSent: number`.
- `ACTIONS` ganha `removeMember` e `changeRole`. `OWNER_INVITER` vira `COMPANY_OPERATOR`, o
  operador numa empresa, com ou sem membro, admitido só em `readMembers`, `readInvitations`,
  `invite` (só papel dono), cancelar e renovar convite, `removeMember` e `changeRole`.
- `rankAllows(actor: Role | 'OPERATOR', target: Role, next?: Role): boolean`. Tirar: a tabela de
  1A. Mudar papel, pela resposta A (a regra nativa de `crud-members.mjs:292` onde se aplica):

| Quem muda | Dono a outro papel | Administrador e membro entre si | Alguém a dono |
| --- | --- | --- | --- |
| Dono ou Central | 200; o único dono: 409 `LAST_OWNER` | 200 | 200 |
| Administrador | 404 | 200, também a si | 404 |
| Membro | 404 | 404 | 404 |

### A ordem do trabalho

1. Numa `libraryCommand` `COMPANY`: `lockCompany`; admissão; o alvo (ausente: 204 em tirar, 404
   em mudar); `from` (412); `rankAllows` (404, S10); donos que sobram (409); `deleteMember` ou
   `updateMember` do adaptador; os convites pendentes do tirado, pelo cancelamento de 4.1; commit;
   log. Membro e operador pelo mesmo caminho (C26, D16); não `auth.api.removeMember` nem
   `leaveOrganization`, que pedem vínculo e dão o código enganoso (`crud-members.mjs:178,195`).
   Regras: C26, C38, C48, C50, C52, C65, C75, D16, D18, D22, S6–S8, S10, S11, S41. Funções:
   better-auth 1.7.8 `getOrgAdapter`: `deleteMember`, `updateMember`
   (`organization/adapter.mjs:295,305`).
2. `admitOwnerInviter` perde o “sem membro”; `readMembers` calcula as colunas pela mesma tabela.

### Como se prova

3–9: `npm run test -w @conexus/server` (T6, T10), corrida com barreira (K6, K7); `npm run openapi`.

## U3 Pessoas e Central (6a)

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/identity/` | muda `people.tsx`, `queries.ts`, `public.ts`; cria `member-actions.tsx` e teste | rota da empresa, Central |
| `apps/web/src/hub/operations/` | muda `client.tsx` e teste | rota do cliente |
| `apps/web/src/platform/test-hub.tsx` | o fake | testes |

### A ordem do trabalho

A Central importa Pessoas por `public.ts` (C4). Regras: W9–W13, W15, W17, W21–W24, W28, V23.
`hubMutation` sem retry; depois, `invalidateQueries` da lista; sair tira a empresa do cache. Base
UI 1.9.0 por `ui/alert-dialog.tsx` e `ui/select.tsx`.

### Como se prova

10: `npm run test -w @conexus/web`; navegador real (T23).

## U4 Recuperação no servidor (6b)

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/` | `identity.ts`, `index.ts`, `failures.ts` | web, OpenAPI |
| `apps/server/src/hub/identity/` | cria `password-recovery.ts`, `password-recovery-email.tsx`; muda `auth.ts`, `routes.ts`, `public.ts`, `messages.ts` | `main.ts` |
| `docs/how-to/hub-server.md` | 15 minutos vira 1 hora (P2) | o fundador |
| `scripts/removals.json` | `recovery-pace-per-person`, `recovery-attempt-path`, `recovery-mail-after-commit`, `revoke-sessions-on-reset` | `npm run removals` |

### Os contratos que a unidade cria

`requestPasswordRecovery`: POST `/api/password-recoveries`, `entry`, corpo `{email: Email}`,
limite 1024; 202 sem corpo; 400, 429 `RECOVERY_ATTEMPTS_EXCEEDED` (“Muitos pedidos deste computador
ou rede.” / “Espere um minuto e tente de novo.”), 503. `auth.ts`: `PASSWORD_LINK_SECONDS = 3600`,
`revokeSessionsOnPasswordReset: true`, o caminho de contagem `/password-recovery-attempt` com 3
por 60 s, o número nativo de `/request-password-reset`. O terminal da primeira pessoa lê “Vale 1
hora.” (`messages.ts`, conferido em `first-person.test.ts`).

### A ordem do trabalho

1. `auth.handler` no caminho de contagem (o padrão de `INVITATION_ATTEMPTS`; S28–S30); depois, em
   `libraryInstallation`: `transactionLock` do endereço; a pessoa com senha, senão nada; um link
   dela criado há menos de um minuto, senão nada (P3); `forgetLinks`;
   `linkTokenOf(requestPasswordReset)`; commit. Depois da resposta, o e-mail com
   `/set-password#token=…&kind=recovery` pela porta de `platform/mail.ts` (T3A, D22).
   Regras: C37, C50, C56, C57, D22, S10, S28–S30, S36, S41. Funções: better-auth 1.7.8
   `requestPasswordReset`, `resetPasswordTokenExpiresIn`, `revokeSessionsOnPasswordReset`
   (`utils/password.mjs:34`).

### Como se prova

11–14: `npm run test -w @conexus/server`, o correio falso de 4.1.

## U5 Senha vazada (6b)

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/` | cria `password-check.ts`; muda `routes.ts` (`setPassword`), `invitation-response.ts` (`passwordCommand`) | rotas |
| `packages/hub-api/src/` | `failures.ts`; as falhas em `setPassword` e `createInvitationPassword` | web |
| `scripts/removals.json` | `password-check-before-link`, `password-check-deadline` | `npm run removals` |
| `docs/reference/boundaries.md` | o serviço, os 5 caracteres de hash que saem do Brasil | revisores |

### Os contratos que a unidade cria

`checkPassword(password: string): Promise<void>`, que lança `PASSWORD_COMPROMISED` ou
`PASSWORD_CHECK_UNAVAILABLE`; prazo `PASSWORD_CHECK_SECONDS = 3`.

### A ordem do trabalho

`isPasswordCompromised` de `better-auth/plugins/haveibeenpwned` (1.7.8, `index.mjs:28-43,81`)
contra 3 s, antes da transação (T1A); sem `signal`, o pedido segue sozinho. Sem o plugin.
Regras: C50, C52, C57, D22, S36, S41. Os testes plantam o `fetch`; nunca o serviço real (T14).

### Como se prova

15, 16: `npm run test -w @conexus/server`.

## U6 Telas de recuperação (6b)

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/identity/` | cria `forgot-password-form.tsx` e teste; muda `sign-in-form.tsx`, `set-password-form.tsx`, `queries.ts` | rotas |
| `apps/web/src/routes/_public/` | cria `forgot-password.tsx`; muda `login.tsx`, `set-password.tsx` | roteador |

### A ordem do trabalho

Regras: W9–W13, W15, W21–W24, V23. Depois de trocar, vai ao login com o e-mail e o aviso.

### Como se prova

17: `npm run test -w @conexus/web`; navegador real (T23).

## U7 Percurso e remoções

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `tests/e2e/` | cria `remove-person.test.ts`; muda `live-hub.ts` se precisar | `npm run e2e` |
| `package.json` | a lista de arquivos do `e2e` | `npm run e2e` |
| `scripts/removals.json` | confere as linhas de U1, U2, U4 e U5 | `npm run removals` |

### Como se prova

18, 19: `npm run e2e`, `npm run removals`. Regras: T5, T6, T12, T14, T23.
