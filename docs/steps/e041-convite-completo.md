# Etapa 4.1: Convite completo

## A página do fundador

**No fim desta etapa** você convida alguém por um e-mail com botão; essa pessoa cria a senha ali,
sem segundo e-mail, e decide se aceita. Você também reenvia e cancela convites.

**O roteiro de uso.** Na instalação publicada, sem terminal:

1. Convide uma pessoa sem senha. Ela recebe HTML e texto, com o botão **Ver convite**. Abrir não
   aceita. Ela preenche Nome, Senha e Confirmar senha; lê **Senha criada. Você já entrou.** Só
   **Aceitar convite** a coloca na empresa. Atualizar o link, depois de sair, diz apenas
   **Este convite já foi usado.**
2. Convide outra pessoa. Ela abre e escolhe **Recusar convite**, sem criar conta. O link passa a
   dizer **Este convite foi recusado.**, sem revelar a empresa.
3. Em Pessoas, reenvie um pendente: o mesmo link ganha dois dias a partir do reenvio. Cancele
   outro, confirmando o e-mail: o link deixa de permitir ações. A lista mostra somente pendentes
   e vencidos. Num vencido, **Reenviar** cria outro link; o antigo continua dizendo que venceu.
4. Abra um convite usando outra conta: não aparece a empresa; aparece que foi enviado a outro
   e-mail, com **Sair e abrir o convite**. Saia e veja o convite certo.
5. Confira o novo e-mail também na sua caixa corporativa Microsoft 365. Se cair no Lixo, a sua TI
   libera o domínio na Tenant Allow/Block List e você repete a entrega. Formatação não promete
   vencer reputação. O teste real de entrega continua necessário.

**Quando você age.** Antes: fornece caixas de teste e combina a liberação com a TI, se necessária.
No começo: aprova esta página. No fim: usa e aprova textos. O ensaio prepara o caso vencido.

**Decisões já dadas, 2026-10-16.** “Ok, eu aprovo e concordo com todas as suas recomendações.”
O link prova o e-mail; o aceite é separado da senha; recusar não exige conta; senha tem 8 a 128
caracteres, sem composição obrigatória. A resposta posterior **“B”** corrige o estudo: reenviar
vivo mantém o link, reenviar vencido cria outro. React Email renderiza ao enviar; você aceitou
empacotar somente o módulo de e-mail, gerado no build, não versionado. A medição desse módulo
ficou abaixo de 1 MB. Envio incerto não se repete automaticamente; use Reenviar.

**Fica de fora.** Histórico, recuperação de senha, senha vazada, remoção de pessoas e apagar empresa
(esta última fica em Duas empresas). Das issues `next-card`, entram 39 itens 1–4 e 24, e 32 itens
3 e 8; 39 itens 5–7 são preparação de ferramentas, em outro PR antes do código, não nesta etapa.
Os demais itens de 39 e os dois restantes de 25 esperam: não são necessários ao convite; não entra
trabalho autônomo novo que peça repetir a prova de banco dormindo. O rótulo de migração sai quando
v0.1.x deixar as dez versões retidas; não há data de calendário comprovada para prometer aqui.

**A decisão sua pedida nesta etapa.** Nenhuma nova; a aprovação deste commit ainda não foi dada.

## As unidades

Base: `main` `a44b6dd`; estudo corrigido de 2026-10-16. Guias: código + indicado.
Revisão: [checklist](../reference/checklist.md) e template.

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |
| U1 | Link público, senha, sessão, aceite separado, recusa | contrato, servidor e telas de identidade | segurança | email-and-password-best-practices, organization-best-practices, better-auth-security-best-practices, fastify-best-practices | preparação |
| U2 | Cancelar e reenviar; pendentes/vencidos; replay fechado | contrato, identidade, migrações | dados | organization-best-practices, fastify-best-practices | U1 |
| U3 | HTML/texto com render em execução e bundle de e-mail | identidade, mail, build e imagem | design | cloudflare:cloudflare-email-service | U2 |
| U4 | Notice, nomes distintos, senha sem piscada, destino inicial | identidade web, rotas, ui, falhas | web | shadcn | U3 |
| U5 | Percurso integrado, imagem e modo da pasta do deploy | testes, infra, referências | testes | nenhuma | U4 |

Sem paralelismo: U1–U4 compartilham identidade; U3/U5, infra. Contratos/consumidores compilam juntos.

**Orçamento de código alterado**, adições mais remoções, sem testes nem gerados: U1 **1.700**;
U2 **950**; U3 **400**; U4 **400**; U5 **120**. **Total: 3.570**, teto de planejamento 4.000 (L2).
Acima disso, voltar ao cartão; não cortar uma recusa silenciosamente.

**Preparação externa.** 39 itens 5–7, PR próprio L20: orçamento informativo, raio pasta/dono,
`e041` identificado como **4.1**, sem reutilizar aprovação da 4. Este PR só contém cartão; código após L6.

## Os critérios de aceite

Critérios **must**, futuros. HTTP: Hub/PostgreSQL descartável; tela: MSW validado.

| # | Unidade | Critério observável e recusa | Teste e nível |
| --- | --- | --- | --- |
| A1 | U1 | GET do link cobre a matriz abaixo; id inválido/desconhecido dá 404; nenhum GET aceita, cria pessoa ou muda convite | `invitation-journey.test.ts`, HTTP must |
| A2 | U1 | Senha cria/verifica pessoa e abre sessão, sem e-mail de senha nem membro; 7/129 caracteres recusados, 8/128 aceitos; conta com senha não é sobrescrita | `password-write.test.ts`, HTTP must |
| A3 | U1 | Duas senhas concorrentes, inclusive convites de empresas distintas para o mesmo e-mail, não criam duas contas nem trocam a senha vencedora; recusa depois de cada escrita desfaz tudo; cookie só após commit | `password-write.test.ts`, HTTP must |
| A4 | U1 | Só acceptance cria membro; resposta perdida, repetição com revisão original dá 200/mesma empresa sem escrita; sessão alheia, vencido/encerrado ou membro removido não ganham membro | `invitation-acceptance.test.ts`, HTTP must |
| A5 | U1 | declination sem sessão/conta; resposta perdida, repetir revisão original dá 204 sem escrita; sessão alheia recusada; aceite/recusa concorrentes têm um vencedor | `invitation-journey.test.ts`, HTTP must |
| A6 | U1 | Nas escritas password/declination/acceptance: origem ausente/externa, mídia, sessão revogada onde exigida e limite nativo são recusados; log não contém id secreto, link, senha ou nomes | `identity.test.ts`, `invitation-journey.test.ts`, HTTP/log must |
| A7 | U2 | DELETE só dono/admin atual da empresa; resposta perdida, repetir revisão original dá 204 sem escrita; sem permissão não repete; aceito/recusado não vira cancelado; corrida serializa | `invitations.test.ts`, HTTP must |
| A8 | U2 | PUT de reenvio vivo mantém id e renova dois dias; POST de reemissão do vencido cria id diferente, mantém antigo legível como EXPIRED; repetir chave de criação não cria outro nem devolve cancelado como pendente | `invitation-replay.test.ts`, HTTP must |
| A9 | U2 | Lista só pending/expired, preserva paginação após 50; nova transição com revisão obsoleta dá 412 sem efeito, salvo replay terminal abaixo; empresa/membro alheio recusados; limites permanecem | `invitations.test.ts`, HTTP must |
| A10 | U3 | Mail capturado tem HTML/texto, Ver convite, endereço reserva, remetente e prazo; dados hostis são escapados; não sai segundo e-mail ao criar senha | `invitation-journey.test.ts`, HTTP/fake SMTP-API must |
| A11 | U3/U5 | Imagem final envia pelo módulo empacotado, sem CLI instalada; timeout/bounce/corte não provocam retry automático nem sucesso falso; banco fora da marca não causa novo envio automático | `invitation-journey.test.ts`, imagem/fake provedor must |
| A12 | U4 | Cada célula da matriz renderiza ações e dados permitidos; confirmação divergente só reclama no blur/envio; senha criada continua visível enquanto sessão/cache atualizam | `invitation.test.tsx`, tela must |
| A13 | U4 | Salvar senha e navegar não produz alerta transitório; Notice comum serve login/convite/senha; nomes de ações/paginadores identificam contexto; inicial não promete home a quem vai entrar | `set-password-form.test.tsx`, `people.test.tsx`, `states.test.tsx`, tela must |
| A14 | U5 | Roteiro com navegador no Hub, alertas observados durante transições; larguras/temas/teclado de T23, sem erro não tratado/CSP; e-mail real chega nas caixas, inclusive M365 após liberação se necessária | `tests/e2e/invitation.test.ts`, `apps/web/layout.test.ts`, uso real must |
| A15 | U5 | Setup cria a pasta de ambiente 0711 root e segredos 0700 root; preflight sob usuário do deploy lê o arquivo permitido, não segredos | `scripts/setup-server.test.ts`, `scripts/deploy.test.ts`, execução must |

## A matriz de estados

Dono: Hub. `pending` vivo → PENDING; vencido → EXPIRED; `accepted` → ACCEPTED; `rejected` → DECLINED;
`canceled` → CANCELED, salvo U2. Unknown: 404. Biblioteca normaliza e-mail. Link é credencial.

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- |
| Convite | não aplicável | Loading comum; sem ações antigas | falha pelo código; mantém formulário | NotFound comum | frases abaixo, sem formulário |
| Senha no convite | campos vazios e regra visível | Criando…; bloqueia duplo envio | falha no campo/formulário; preserva valores | como convite | não permite gravar |
| Pessoas/convites | Empty, sem histórico | Loading; envio/cancelamento em andamento | Error comum; sem fingir envio | empresa indisponível | Vencido, Reenviar e Cancelar |
| Confirmar cancelamento | não aplicável | Cancelando… | falha comum, não fecha como sucesso | atualiza lista | vencido pode cancelar |
| Login de retorno | e-mail preenchido somente pelo convite público vivo | Entrando… | recusa comum, sem enumerar contas | retorno validado ou início | não reabre ação encerrada |
| /set-password | formulário; token capturado no carregamento | Criando… e navegação | falha comum | link inválido pela tabela | link gasto/expirado sem transição vermelha falsa |
| Página desconhecida/inicial | não aplicável | estado do roteador | Error comum | destino inicial explícito | não aplicável |

| Estado do link | Deslogado sem senha | Deslogado com senha | Sessão convidada | Outra sessão |
| --- | --- | --- | --- | --- |
| PENDING | quem/empresa/papel/prazo; Nome, Senha, Confirmar senha, Criar senha e Recusar convite | mesmos dados; Entrar com retorno; Recusar convite | mesmos dados; Aceitar convite e Recusar convite | só outro endereço e seu e-mail; Sair e abrir o convite |
| EXPIRED | Este convite venceu. | igual | igual | mesma mensagem de outra sessão |
| ACCEPTED | Este convite já foi usado. | igual | membro atual: empresa/Abrir empresa; sem vínculo: CLOSED/ACCEPTED, sem empresa | mesma mensagem de outra sessão |
| DECLINED | Este convite foi recusado. | igual | igual | mesma mensagem de outra sessão |
| CANCELED | Este convite foi cancelado. | igual | igual | mesma mensagem de outra sessão |
| UNKNOWN | 404 comum | 404 comum | 404 comum | 404 comum |

Encerrados deslogados não têm empresa, convidante, papel, e-mail destinatário ou formulário.
Pós-senha: **Senha criada. Você já entrou.**, Aceitar convite/Recusar convite, na mesma página.
Recusa permanece no link. Aceito aparece em Pessoas; encerrados saem de convites.

## Contratos e campos

Sem pstack: compara-se objeto com opcionais independentes (estudo) à união por `kind`;
escolhe-se união (C21/C22), sem campos fora da matriz. Dono: `packages/hub-api/src/companies.ts`.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `InvitationView.kind`: NEW, HAS_PASSWORD, INVITED, OTHER, CLOSED, JOINED | leitura de identidade | loader/tela convite |
| NEW/HAS_PASSWORD/INVITED: `company.{id,name}`, `inviterName`, `role`, `expiresAt`, `revision` | leitura admitida pelo link | convite, retorno login, comandos |
| NEW/HAS_PASSWORD: `email` | convite | login preenchido |
| OTHER: `signedInAs` | sessão no acesso | botão sair e explicação |
| CLOSED: `state` EXPIRED/ACCEPTED/DECLINED/CANCELED | leitura/relógio | frase encerrada |
| JOINED: `company.{id,name}` | convidado aceito e membro atual; sem vínculo → CLOSED/ACCEPTED | Abrir empresa |
| password: `name`, `password`, `revision` | formulário; revisão do GET | comando senha; biblioteca |
| demais escritas: `revision` | tela a partir da leitura | comando, antes de escrever |
| list/create/reissue/renew: `invitation.{id,email,role,expiresAt,state,revision}` | servidor | Pessoas, reenvio/cancelamento |
| `next.kind`, `next.page` quando MORE; query `page` | servidor / endereço | paginador / leitura |
| create: `email`, `role`, `Idempotency-Key`, `replaces? {id,revision}` | formulário / Reenviar vencido | createInvitation e replay |
| acceptance: `company.{id,name}` | comando/plugin | navegação à empresa |
| password: `Set-Cookie`; sem corpo | Better Auth, resposta após commit | navegador, getSession/cache |
| falhas: `code`, `status`, `type`, `title`, `traceId`; tabela `actionKind`, `settles` | tratamento central | leitor compartilhado e attempt key |

`revision`: inteiro não negativo, coluna de auth.invitation, default 0; Hub incrementa após cada
comando efetivo na mesma transação. Leitura escreve o campo HTTP; comandos o comparam. Não autoriza.
Recusa de revisão: `INVITATION_STALE`, 412 USER, settles=true, NONE, “Este convite mudou.” /
“Recarregue a página.” Conta com senha: `INVITATION_PASSWORD_EXISTS`, 409 USER, settles=true,
SIGN_IN, “Este e-mail já tem senha.” / “Entre com a sua senha.” Sem expor conta por e-mail solto.

## A tabela de falhas

Cada célula aponta seu critério. Toda falha deixa código/trace id, nunca a credencial do convite.
Não prometer exatamente uma entrega: Cloudflare não participa da transação. Não repetir envio
ambíguo automaticamente; novo Reenviar é ação deliberada. Nenhum envio segura lock.

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada depois de instrução/chamada | Dependência fora | O que imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| createUser, emailVerified, requestPasswordReset, resetPassword, forgetLinks, signInEmail/session | empresa depois e-mail serializados; perdedor não sobrescreve | mesma transação desfaz conta, token, senha, verificação e sessão | banco: 503, sem cookie | código/trace | A2,A3,A6 |
| rateLimit nativo | contador persistente da biblioteca | tentativa recusada continua contada fora da transação de negócio | banco: 503, nunca libera tentativa | código/trace | A6 |
| acceptInvitation/member | lock; aceito + destinatário/membro atual: 200 antes da revisão, sem escrita | rollback inclusive compensação nativa | banco: 503 | código/trace | A4,A6 |
| recusa pública/status rejected | lock; rejected + link/sessão permitidos: 204 antes da revisão, sem escrita | rollback | banco: 503 | código/trace | A5,A6 |
| cancelInvitation/status canceled | lock; cancelado explícito + admissão atual: 204 antes da revisão, sem escrita | rollback | banco: 503 | código/trace | A7,A9 |
| createInvitation/reemissão + marcador do vencido | chave existente; payload diferente 409; lock empresa/pessoa | rollback de cancelamento, marcador e novo convite | banco: 503; provedor após commit mantém linha | código/trace | A8,A9 |
| renew com resend:true/expiresAt | revisão fecha corrida; repetido stale 412 sem outro envio | rollback; commit já feito não é desfeito pelo correio | banco: 503; mail falha sem retry automático | código/trace | A8,A9,A11 |
| reserva deliveryStartedAt, envio, mailedAt | uma reserva por entrega; replay ambíguo não envia | falha de render não envia; bounce marcado; reserva sem resposta permanece incerta | timeout/corte: MAIL_UNAVAILABLE; marca falhou: 503 | código/trace | A10,A11 |
| revokeSession/signOut | revoga antes de limpar cookie | não anuncia saída se delete falhou | banco: 503 | código/trace | A6,A12 |
| setup pasta/modo | segunda execução preserva modos | teste de falha não anuncia deploy aprovado | comando falhou: saída não zero | código sem conteúdo do ambiente | A15 |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas, base |
| --- | --- | --- | --- | --- |
| Leitura pelo link | nova, muda etapa 4 | `apps/server/src/hub/identity/invitation-reads.ts` | substitui leitura só com sessão | S10 relido pela resposta C |
| Senha pelo convite | nova | `apps/server/src/hub/identity/invitations.ts` | elimina passwordLinkCommand | linkTokenOf/forgetLinks: S35, purpose |
| Recusar/cancelar/reenviar | nova | `invitations.ts`, `company-routes.ts`, na mesma pasta | inclui rejected e replay encerrado | prazo/limites: respostas da etapa 4; reenvio corrigido em 2026-10-16 |
| HTML/texto | nova | `messages.ts`, `invitation-mail.ts`, modelo de identidade; `platform/mail.ts` | protótipo orienta, não é transplantado | Conexus remetente: resposta de 2026-10-15 |
| Telas | nova, muda etapa 4 | identidade web: `invitation.tsx`, `people.tsx`, `set-password-form.tsx` | une fluxo público e remove segundo e-mail | aceite explícito: decisão do fundador |

**Transplante:** zero; protótipo visual. Fica passwordLinkMail/primeiro dono; saem putPasswordLink,
ritmo de 20 s e testes/removal rows correspondentes. **Dívida:** nenhuma nova; riscos existentes ficam.

## U1 Link, senha e resposta

### O raio da mudança

| Pasta, ou dono de contrato | Mudança | Quem importa/chama |
| --- | --- | --- |
| `packages/hub-api/src/` | união, operações/falhas; dono contrato HTTP | server serve, web hub, OpenAPI |
| `apps/server/src/hub/identity/` | leituras, comandos, rotas, admission, testes | public.ts → main; acesso chama leitor sessão |
| `apps/server/src/platform/` | acesso/serve: sessão opcional só nos convites public/entry | outras rotas inalteradas |
| `apps/web/src/hub/identity/` | consumidor completo do novo fluxo, queries, testes | public.ts → rotas |
| `apps/web/src/routes/` | loaders públicos e retorno; elimina rota duplicada de aceite | roteador |
| `apps/server/migrations/` | revision integer NOT NULL DEFAULT 0 | migrate; comandos/leitura |
| `apps/server/` | dono database-grants.sql; snapshot sem ampliar privilégios | catalog |
| `docs/reference/` | boundaries das extensões, dono das exceções | builders/revisores |

### Contratos e ordem

1. `getInvitation`: GET `/api/invitations/{invitationId}`, public, 200 `{invitation: InvitationView}`;
   404/503. Acesso fornece sessão opcional só nestes convites public/entry; cookie inválido é
   deslogado, banco fora não. C33/C34, S10/S48: registrar no fechamento exceção do link e sessão
   opcional restrita, sem generalizar public/entry nem mudar guias agora (L20/L27).
2. `createInvitationPassword`: PUT `…/{invitationId}/password`, entry, body acima, limite 4096,
   204 + cookie; 404/409/412/429/503. `declineInvitation`: PUT `…/declination`, entry, revisão,
   limite 1024, 204; 404/412/422/429/503. Outra sessão não pode agir. S12/S17/S24, C48/C50.
3. `acceptInvitation` conserva PUT `…/acceptance`, session, adiciona revisão; 200 `{company}`;
   401/404/409/412/422/503. Elimina putPasswordLink dos três consumidores juntos (C45).
4. Better Auth **1.7.8**: createUser, requestPasswordReset/resetPassword, signInEmail; ids opacos
   padrão; disableSignUp=true (default false), senha 8/128, token 900 s; onAPIError.throw=true.
   Limitação deve passar pelo router nativo: auth.api sozinho pula rateLimit. Separar admissão
   da tentativa e transação; contador não pode sumir no rollback. S23/S28, C64/C65.
5. Accept/decline/cancel: entrada/acesso, lock empresa, releitura/admissão atual; antes da revisão, no-op
   só no mesmo convite/operação: aceito + destinatário/membro atual → 200/empresa; rejected +
   link/sessão ausente ou convidada → 204; canceled explícito (sem superseded_at) + admissão
   atual → 204. Sem escrita/incremento. Acesso inválido: 401/404, sem replay. Outro terminal
   ou aceito sem membro: INVITATION_CLOSED. Nova transição permitida: revisão divergente → 412;
   igual → executar. A4/A5/A7: resposta perdida/revisão original, nenhuma escrita; A4/A7: revogação;
   A5: sessão alheia; A9: nova transição stale. C38/C64/C65.
6. Nativo 1.7.8 não resolve: aceite/reject recusam terminal (`crud-invites.mjs:268,377`); cancel
   regrava status/hooks (`:450`). Hub reconhece no-op; reject sem sessão também é Hub (`:352`).
   Leitura terminal nativa não serve (`:503`). Registrar C75.

**Prova:** A1–A6/A12: `npm run test -w @conexus/server`, `npm run test -w @conexus/web`,
`npm run openapi`, `npm run typecheck`. T5/T8/T10/T12.

## U2 Ciclo no painel

### O raio da mudança

| Pasta, ou dono de contrato | Mudança | Quem importa/chama |
| --- | --- | --- |
| `packages/hub-api/src/` | dono list/create/renew/cancel e revisão | Hub e Pessoas |
| `apps/server/src/hub/identity/` | commands, schema e testes | company-routes → public |
| `apps/server/migrations/` | timestamps nullable superseded_at/delivery_started_at em auth.invitation | migrate; leitura/replay |
| `apps/server/` | dono `database-grants.sql`, snapshot se afetado; sem ampliar privilégios | catalog.test.ts |
| `apps/web/src/hub/identity/` | lista, confirmação, ações e queries | rotas de Pessoas |
| `docs/reference/` | dono das boundaries de reemissão/replay | builder/revisor |

**Contratos:** cancelInvitation DELETE `/api/companies/{companyId}/invitations/{invitationId}`,
session, body revisão, 1024, 204, falhas 401/404/412/422/503. renewInvitation PUT no mesmo recurso,
session, body revisão, 1024, 200 `{invitation}`, falhas anteriores + 409/429/MAIL_BOUNCED/
MAIL_UNAVAILABLE. Reemitir vencido usa createInvitation existente, POST na coleção com email/role
originais, chave nova e `replaces: {id,revision}`; sob lock exige exatamente o vencido indicado,
ou 412. Convite inicial omite replaces. Replay encerrado responde INVITATION_CLOSED, não pendente falso.

**Ordem:** D5/D21–D26, C38/C64/C65. Cancel só após conferir estado sob lock; nativo não confere
(`crud-invites.mjs:428-450`). Vivo: createInvitation com resend=true, prazo de 172800 s desde agora.
Vencido: cancelamento nativo, grava superseded_at, criação nativa numa transação.
Escritor: reemissão; leitor: GET antigo → EXPIRED. Cancelamento
explícito, mesmo vencido, continua CANCELED. `findPendingInvitation` exclui vencidos
(`adapter.mjs:753-770`); não alterar adapter nem a expiração antiga. A migração fica com seu dono de
snapshot; mudança de privilégios inesperada exige PR próprio D11, não ampliação nesta unidade.

**Prova:** A7–A9, comandos U1, migrações/catalog e remoções (L20). Ordem de replay de U1 vale
para cancel: não chama cancelInvitation no no-op. `deliveryStartedAt`: coordenador reserva antes do envio;
replay lê a reserva. Sem mailedAt, responde MAIL_UNAVAILABLE, sem redisparar. Reenviar deliberado
renova a revisão e limpa as marcas. Reserva/mailedAt são commits próprios, nunca lock durante fetch.

## U3 Mail em execução, sem CLI na imagem

### O raio da mudança

| Pasta, ou dono de contrato | Mudança | Quem importa/chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/` | modelo JSX e port de render; consumidor messages | invitation-mail e primeiro dono preservado |
| `apps/server/src/platform/` | dono SendMail/Mail ganha html, text fica obrigatório | identidade/main |
| `apps/server/` | manifesto, tsconfig e geração local | start/test/typecheck |
| `infra/` | hub.Dockerfile gera e copia bundle | imagem final |
| `./` | package.json, package-lock.json, .gitignore, biome.json, knip.json | workspaces/build; ignora somente gerados |
| `.github/workflows/` | exercício da imagem existente usa bundle | CI |
| `docs/reference/` | boundaries e componentes de e-mail | revisão |

**Contratos:** renderInvitation(props `{companyName,inviterName,roleLabel,link,expiresOn,to}`)
→ Promise de `{html,text}`; Mail `{to,subject,text,html?}`; SendMail mantém sinal/deadline.
Props escritos por identidade, lidos só pelo renderizador; html/text pelo adapter Cloudflare.

**Ordem:** C56–C59/C75, V3/V8/V38–V43. React Email **6.11.0**, renderer **2.1.0**, React/DOM
**19.2.4**, esbuild **0.28.2**: lock/build. Render recebe props no envio; text vem do mesmo modelo.
Bundle só desse módulo: ESM Node, minificado, JSX automático, sem template/substituição de strings.
Imagem e prestart/pretest local geram; nunca commitado. Tipos derivados do port; teste executa artefato.

Medição: instalação direta 117 pacotes/68.136.787 bytes; bundle executado **997.746 bytes**,
**19 origens**; mesma base Node: +**310.574 bytes** `.Size`. Camada medida, não Hub inteiro; A11 integra.
Boundary compara documenso `cd0cc5f`, `packages/email/render.tsx:6,65,92`: render em execução;
instalar o runtime completo é alternativa de 117 pacotes/68 MB medida aqui. Esbuild remove a CLI,
não o render em execução. Inline/tabelas/fallback de fontes do e-mail não viram padrão das telas;
conflitos V3/V14/V17 ficam no fechamento L27. Sem CDN, tracking ou serviço de envio novo.

**Prova:** A10/A11, servidor/imagem U5; prazo no e-mail. Entrega Outlook só no uso autorizado.

## U4 Estados visíveis

### O raio da mudança

| Pasta, ou dono de contrato | Mudança | Quem importa/chama |
| --- | --- | --- |
| `apps/web/src/ui/` | dono Notice e estado inicial | login, convite, senha |
| `apps/web/src/hub/identity/` | Notice, nomes, confirmação e transições | rotas |
| `apps/web/src/routes/` | token estável, retorno e inicial | roteador |
| `apps/web/src/platform/` | leitor de ação inicial, cache/sessão | ui e identidade |
| `packages/hub-api/src/` | dono actionKind INITIAL na falha NOT_FOUND | leitor web |
| `docs/reference/` | componentes/boundaries | builders |

**Contratos:** Notice `{children}` → status acessível; `actionKind` ganha INITIAL em NOT_FOUND.
O loader fornece o destino inicial: deslogado, “Entrar” → login; logado, “Voltar ao início” → lista.
Não nasce outra landing page. Exceção V43/C48 vai ao fechamento (L20/L27).

**Ordem:** W15–W17/W22–W24/W28; V28–V32. Sucesso na mesma página; regra visível “8 caracteres ou
mais”; confirmação apenas local; mostrar senha acessível. Captura token uma vez no carregamento
em /set-password, não via useLocation durante navegação. Remove status escritos à mão em login,
invite-form e invitation; botões por linha incluem e-mail no nome acessível; paginadores incluem
lista. Não replica sessão na tela: renderiza a variante entregue pelo loader.

**Prova:** A12/A13, comandos web; observar alertas durante navegação.

## U5 Integração e uso

### O raio da mudança

| Pasta, ou dono de contrato | Mudança | Quem importa/chama |
| --- | --- | --- |
| `tests/e2e/` | percurso, sem referência ao cartão apagado da 4 | npm run e2e |
| `apps/web/` | layout.test.ts e capturas externas | teste de navegador |
| `apps/server/src/hub/identity/` | porta HTTP da imagem com provedor fake | imagem publicada localmente |
| `infra/` | setup 0711; não toca segredos 0700 | deploy |
| `scripts/` | testes setup/deploy existentes | test:scripts |
| `docs/how-to/` | roteiro de entrega M365 | fundador |
| `docs/decisions/` | 0017: resultado real quando autorizado | fechamento |

**Contratos:** nenhum. T14/T16/T22/T23. `npm run verify`, `npm run e2e` e HTTP da imagem final:
conta/convite pelo Hub, fake recebe HTML/texto do bundle, sem instalar dependências na imagem.
Setup mede diretório criado/preflight sem root. S40; capturas/trace externos. A14/A15 terminam no uso.
