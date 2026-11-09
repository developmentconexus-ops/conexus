# Etapa 23: As outras empresas

O roteiro chama esta etapa de "23 As outras empresas. Empresas além da sua usam o Conexus". Ela
depende da 22 e pede de você "Os riscos aceitos. O plano pago", com "A seção 11 da arquitetura"
como conhecimento trazido; na tabela do que você fornece: "O aviso do que sai do Brasil, com uma
linha: o ditado no Chrome passa pelo Google | Nenhum novo". Sua ordem, 2026-10-30: "eu vou começar
na minha empresa ... depois disso ... eu vou jogar para as outras empresas".

Escrito sobre o `main` em `44fb4040` (2026-11-09), com `@mastra/core` 1.82.0, `@mastra/memory`
1.41.0, `@mastra/pg` 1.35.0, `better-auth` 1.7.8 e `@neon/sdk` 7.3.0. A 24.5 ainda não fechou, e a
24.6, a 24.7, a 21.1, a 16 e a 22 vêm antes desta: o construtor de cada unidade reabre as linhas
citadas no `main` do dia, e a seção "O que os cartões de antes mudam aqui" diz o que muda quando
cada um fechar. Este cartão espera a vaga do trilho da fronteira (delivery L5).

## A página do fundador

**No fim desta etapa** uma empresa de fora entra no Conexus pelo convite da Central e, antes de
criar a senha, lê e aceita por escrito o que sai do Brasil. Você vê na ficha dela, na Central,
quem aceitou, quando e qual versão. A sua empresa aceita o mesmo aviso no Início. Qualquer pessoa
lê o aviso numa página pública, sem entrar. E o Neon já está no plano pago, porque o plano grátis
derrubaria todas as empresas perto do dia 16 de cada mês.

Hoje o Conexus já cadastra uma empresa de fora (etapa 4.2), convida o dono, separa os dados de
cada empresa no banco (etapa 5) e deixa você abrir as assinaturas de modelo por empresa (etapa 11).
O que falta é o aviso, o plano pago, a prova de que nada vaza com mais empresas, e os riscos que
você aceita escritos.

**O roteiro de uso.** Na instalação da nuvem, sem terminal.

1. Na Central, em Clientes, você cadastra a "Empresa B" com CNPJ, razão social e o e-mail do
   administrador dela. O convite sai por e-mail, como hoje.
2. O administrador abre o convite. Acima do nome e da senha aparece "O que sai do Brasil": a lista
   de quem recebe dados fora do país, o que vai e para onde, com a linha do ditado no Chrome. Ele
   marca "Li e aceito em nome da Empresa B", cria a senha e entra. Sem marcar, o botão "Criar senha"
   não segue.
3. Na Central, a ficha da Empresa B mostra "Aviso do que sai do Brasil: aceito em 09/11/2026 por
   <nome>, versão de 09/11/2026". Na mesma ficha, em "Tipos de conta", só a chave de API está ligada.
4. Na sua empresa, o Início mostra o cartão "Leia o que sai do Brasil". Você lê e aceita em nome da
   sua empresa; o cartão some.
5. Numa janela anônima, você abre `/egress-notice` e lê o mesmo aviso, sem entrar.
6. Entrando como você na sua empresa, nada da Empresa B aparece: nem Projeto, nem pessoa, nem
   conversa, nem integração. Na Central você vê da B só o que já via (ficha, pessoas, convites).

**O que você faz, e quando.** Antes: escolhe o plano do Neon (decisão E) e o liga no console do
Neon, nas duas organizações, seguindo `docs/how-to/paid-plans.md` que a U3 escreve; nenhuma conta
nova. No começo: aprova esta página. No fim: faz o roteiro, diz o que viu e aprova o texto do
aviso. O primeiro uso com uma empresa de fora publica a versão `v1.0.0` (delivery L17).

**Fica de fora.**

- **Cobrança dentro do Conexus.** As referências cobram com uma tabela de plano e o Stripe, mas o
  preço do Conexus ainda não existe (documento do sócio, "a decidir"). Sem preço não há o que
  construir; o contrato e a cobrança ficam fora do produto por agora.
- **Termos de uso, contrato e cláusulas da LGPD.** A ANPD pede que o controlador publique para
  onde os dados vão (Resolução CD/ANPD 19/2024, resumo de escritório); a página pública desta etapa
  é esse lugar. Se o Conexus precisa de cláusulas-padrão com cada fornecedor é pergunta para um
  advogado, não para o código.
- **Uma página de status, entrar na conta do cliente para dar suporte, e a E2B paga**, se você
  seguir as recomendações H1, G1 e F1.
- **O que os cartões de antes trazem.** O Telegram (24.7) entra no aviso como uma linha nova
  quando a 24.7 fechar: é o primeiro caso da decisão B.

**As decisões suas nesta etapa.** As letras não usam C, D, L, S, T, V e W, que são as regras dos
guias.

**A. Onde a empresa aceita o aviso.** O caso: a Empresa B entra; a decisão 0032 diz que ela é
avisada por escrito antes de entrar ("8. A", 2026-10-13). O objetivo: ninguém de fora usa o
Conexus sem ter lido para onde vão os dados.

- **A1 (recomendado).** No convite do primeiro dono, acima da senha, com a marca "Li e aceito em
  nome da empresa". Exemplo: o roteiro, passo 2. O Twenty guarda o acordo de cada workspace com a
  versão do modelo (`dpa-agreement.entity.ts:29-45`, `twenty@b76d0217`); o aceite do Conexus vai
  junto do aceite do convite que o Better Auth já faz (`crud-invites.mjs:262-300`, 1.7.8). Nativo
  do convite, mais uma tabela nossa.
- **A2.** No primeiro passo da Preparação, depois de entrar, e a Preparação não segue sem aceitar.
  Exemplo: ele cria a senha, entra e vê o aviso antes de dar nome à empresa. Mais simples no
  convite, mas ele já entrou antes de ler.
- **A3.** Fora do Conexus: você manda o aviso por e-mail e guarda a resposta. Exemplo: um PDF
  anexado. Nada a construir, mas o Conexus não sabe quem aceitou.

**B. Quando o aviso muda.** O caso: a 24.7 põe o Telegram, que fica fora do Brasil; a empresa que
aceitou a versão antiga não leu essa linha. O objetivo: toda empresa sabe da mudança sem perder o
trabalho do dia.

- **B1 (recomendado).** O dono e o administrador veem no Início o cartão "O aviso mudou: entrou o
  Telegram" até um deles aceitar; nada trava. A Supabase versiona a lista de suboperadores por data
  e avisa quem pede, sem travar a conta (captura `supabase-subprocessors-1280.png`).
- **B2.** A empresa fica travada até aceitar. Exemplo: segunda de manhã ninguém usa o Conexus até
  o dono entrar.
- **B3.** Só a página pública muda; a empresa não é avisada.

**E. O plano pago do Neon.** O caso: desde a 24.2 a agenda das automações mantém o banco do Hub
acordado; o plano grátis dá 100 CU-hora por projeto por mês e suspende o banco ao esgotar
(neon.com, lido em 2026-11-09). Acordado o mês todo, o Hub gasta cerca de 182 CU-hora, então o
Neon o suspende perto do dia 16: todas as empresas param. O grátis também guarda só 6 horas de
histórico. O objetivo: o Conexus não para por cota e um erro visto no dia seguinte ainda volta.

- **E1 (recomendado).** Launch nas duas organizações, a do Hub e a das empresas, antes da primeira
  empresa de fora. Sem mínimo mensal; US$ 0,106 por CU-hora, US$ 0,35 por GB-mês, 7 dias de
  histórico, 100 projetos. Estimado: cerca de US$ 19 por mês o Hub, mais perto de US$ 2 por mês
  por empresa que usa pouco. Neon recomenda um projeto por cliente, como o Conexus já faz
  (`neon-for-agent-platforms@028b69b`, `SKILL.md:211`).
- **E2.** Launch só no Hub. As empresas ficam no grátis, com 6 horas de histórico cada.
- **E3.** Scale nas duas: US$ 0,222 por CU-hora, 30 dias de histórico e SLA (sem número na
  página). Mais que o dobro por hora acordada.

**F. A E2B.** O caso: uma conta só, a sua, para as máquinas de todas as empresas. No Hobby: crédito
único de US$ 100, depois o uso é pago; sessão de 1 hora; 20 máquinas ao mesmo tempo. No Pro: US$
150 por mês mais uso; 24 horas; 100 máquinas (e2b.dev, lido em 2026-11-09). Os termos não proíbem
uso comercial no Hobby. O objetivo: uma empresa não ocupa as máquinas de outra.

- **F1 (recomendado).** Fica no Hobby. Gatilho para o Pro: uma conversa recusada por falta de
  máquina, ou uma sessão cortada em 1 hora, que você vê na Atividade da 21.1.
- **F2.** Pro desde a primeira empresa de fora.

**G. O suporte.** O caso: o administrador da Empresa B diz "o agente não aparece". O objetivo:
você ajuda sem ver o que não deve.

- **G1 (recomendado).** O Conexus não entra na conta de ninguém; você ajuda pela Central (ficha,
  pessoas, convites, tipos de conta) e por uma chamada com a tela dele. É o que a regra S11 já diz:
  o operador nunca é membro da empresa de um cliente. Dify, n8n e Activepieces não têm entrar como
  outra pessoa.
- **G2.** Você entra como a pessoa, com o consentimento dela, por uma hora, registrado. O Better
  Auth instalado já tem isso (`admin/routes.mjs:559`, 1 hora em `:598`), como o Twenty, que
  registra cada entrada (`impersonation.service.ts:145`). Pede reabrir a S11.

**H. A página de status.** O caso: o servidor para; hoje só você recebe o e-mail do monitor. O
objetivo: a empresa sabe que o problema não é dela.

- **H1 (recomendado).** Nenhuma por agora; você avisa os administradores por e-mail. Com poucas
  empresas, uma pessoa avisa todas.
- **H2.** Uma página pública do monitor (a StatusCake que já usa; se o plano grátis a inclui não
  foi verificado) com o endereço no rodapé da entrada, como a Supabase faz na sua faixa
  (`StatusPageBanner.tsx:7`, `supabase@cb52c0f4`).

**J. Os riscos aceitos.** A lista completa está na tabela "Os riscos, um por um", abaixo da
página. Em resumo, com uma empresa de fora:

- já tratados: a assinatura de modelo (só a chave fica ligada para uma empresa nova; você abre o
  resto por empresa), o banco que não dorme e as 6 horas (decisão E);
- que ficam, porque consertar não muda o risco: a chave dos apps, a chave de selo e o runner no
  servidor alcançam todas as empresas se alguém tomar o servidor; um servidor só, que para todas
  juntas; um app em laço que atrasa os de outras empresas até o número da 22; o aplicativo do
  Mercado Livre e o ritmo de convites divididos por todas;
- escritos agora: o banco do Mastra não separa empresas sozinho; quem separa é o guarda do
  Conexus, com teste (provado nesta etapa).

- **J1 (recomendado).** Aceita a lista como está.
- **J2.** Diz qual risco quer consertado antes da primeira empresa de fora.

## Os riscos, um por um

A seção 11 da arquitetura no `main` de hoje, linha a linha. A U3 a reescreve com as suas respostas.

| Risco | Uma segunda empresa muda? | Aceitar quer dizer | O que conserta |
| --- | --- | --- | --- |
| Termos proíbem entrar por assinatura | Sim: a conta bloqueada é a do cliente | O cliente pode perder a assinatura sem aviso | Já está: só a chave de API vem ligada (`builder/model-accounts/kinds.ts:12-19`); você abre as outras por empresa |
| Duas gravações numa ação | Não | A segunda falha e a primeira fica | A skill do Builder |
| A chave dos logins de app vaza | Sim: abre todo app de toda empresa | Quem tomar o servidor lê tudo | Rotação (`docs/how-to/apps-token-and-key.md`) |
| CPU em segundos, com tolerância | Sim: entre empresas | Um app em laço atrasa outros | O teste de carga da 22 |
| O banco do Hub não dorme | Sim: a suspensão para todas | | Decisão E |
| Seis horas de histórico | Sim | | Decisão E |
| O servidor para | Sim: param todas | Um servidor | Decisão H |
| Betas | Não | | Versões fixas |
| Uma chave da E2B | Sim: máquinas e crédito divididos | Uma empresa ocupa as máquinas de outra | Decisão F |
| O runner como root; segredos no servidor | Sim: alcança todas | Já aceito | Fica |
| Código transplantado | Não | | `conexus-study` |
| Página com instruções escondidas | Não: fica na conversa da empresa | Já aceito, 2026-10-19 | Fica |
| Projeto Neon que sobra | Sim: mais apagamentos | | A exclusão em fases; a U3 prova que nada sobra |
| **Novo**: o banco do Mastra sem política de linha | Sim | O Mastra devolve a conversa de outra empresa a quem não passa o dono (provado) | O guarda (`builder/conversation/guard.ts:175-186`) e seus testes; a U3 o escreve |
| **Novo**: uma chave de selo | Sim | Quem tomar o servidor abre as credenciais de todas | Rotação (`docs/how-to/seal-keys.md`) |
| **Novo**: um aplicativo OAuth por fornecedor | Sim: cota dividida | Uma empresa gasta a cota de outra | [0058] |
| **Novo**: o ritmo de convites e entradas é da instalação | Sim | Muitos convites de uma atrasam os de outra | [0039] B6 |

## O que os cartões de antes mudam aqui

- **24.7, Canais** (https://github.com/developmentconexus-ops/conexus/pull/890): o Telegram é um
  destino fora do Brasil. Se a 24.7 fechar antes da U1, a U1 já põe a linha; se fechar depois, a
  24.7 muda a constante e o aviso ganha versão nova (decisão B).
- **24.6, Workflows** (https://github.com/developmentconexus-ops/conexus/pull/842): as agendas e as
  definições no Mastra; o teste de exclusão da U3 conta as agendas da empresa apagada.
- **21.1, Ver o que acontece** (https://github.com/developmentconexus-ops/conexus/pull/892): o
  Grafana fica no Brasil, então não entra no aviso; a tabela `activity.entry` entra na varredura de
  exclusão da U3.
- **16 e 22**: nada por empresa; a 22 dá o número do risco de CPU.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 O aviso e o aceite | A constante do aviso, a tabela do aceite, o aceite no convite e a rota da versão nova, o aceite na ficha da Central | `packages/hub-api/src`, `apps/server/src/hub/identity`, `apps/server/src/hub/operations`, `apps/server/migrations`, `apps/server/database-grants.sql` | [data](../guides/data.md) | nada |
| U2 As telas do aviso | O aviso no convite, a página pública, o cartão no Início, a linha na ficha da Central | `apps/web/src/hub/notice` (nova), `apps/web/src/hub/identity`, `apps/web/src/hub/projects`, `apps/web/src/hub/operations`, `packages/hub-api/src/pages.ts` | [web](../guides/web.md) | U1 |
| U3 Duas empresas, provadas | A varredura das rotas, as chaves estrangeiras com a empresa, a varredura da exclusão, a seção 11 e o how-to dos planos | `apps/server/src/platform`, `apps/server/src/hub/operations`, `apps/server/migrations`, `docs/architecture.md`, `docs/how-to/paid-plans.md`, `docs/index.md` | [testing](../guides/testing.md) | U1 (migração antes) |

A U2 e a U3 correm em paralelo depois da U1: não dividem pasta. A U3 vem depois da U1 porque as
duas mudam o retrato do catálogo das migrações.

**Orçamento de código alterado.** U1: 420 linhas. U2: 480 linhas. U3: 160 linhas de código e
migração, mais os documentos. Total da etapa: cerca de 1.060 linhas, abaixo do teto da L2.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | O aviso tem uma versão e uma linha por destino fora do Brasil da arquitetura, seção 3, mais a linha do ditado no Chrome; a web e o servidor leem a mesma constante | `packages/hub-api/src/egress-notice.test.ts`: cada fornecedor da tabela tem linha; a do ditado existe | must |
| 2 | U1 | O primeiro dono de uma empresa sem aceite aceita o convite com a versão atual: entra, e a empresa fica com o aceite (versão, pessoa, hora). Sem a versão, `PUT /api/invitations/{id}/acceptance` responde 409 `NOTICE_REQUIRED` e não cria o membro; com uma versão velha, 409 `NOTICE_STALE` | `apps/server/src/hub/identity/notice-acceptance.test.ts` | must |
| 3 | U1 | Uma pessoa convidada para uma empresa que já aceitou a versão atual aceita o convite sem mandar versão, como hoje | o mesmo arquivo, caso "segundo convidado" | must |
| 4 | U1 | `PUT /api/companies/{companyId}/egress-notice` com a versão atual, pelo dono ou administrador, grava o aceite e responde o estado `CURRENT`; repetido, responde o mesmo e não cria outra linha; um membro, uma pessoa de outra empresa ou uma empresa que não existe recebem o mesmo 404 `NOT_FOUND`; uma versão velha, 409 `NOTICE_STALE` | o mesmo arquivo | must |
| 5 | U1 | `GET /api/companies/{companyId}` devolve `notice` com `NEVER`, `BEHIND` ou `CURRENT` para o dono e o administrador | o mesmo arquivo | must |
| 6 | U1 | `GET /api/clients/{companyId}` devolve o último aceite da empresa ao operador; uma pessoa que não é operadora recebe 404 | `apps/server/src/hub/operations/client-reads.test.ts` | must |
| 7 | U1 | Sem escopo, ou no escopo de outra empresa, a tabela do aceite lê zero e recusa gravar (42501) | `apps/server/src/platform/isolation-notice.test.ts` | must |
| 8 | U1 | Apagar a empresa apaga os aceites dela | `apps/server/src/hub/operations/client-deletion-database.test.ts` | must |
| 9 | U2 | O convite do primeiro dono mostra o aviso acima do nome; "Criar senha" fica desligado até marcar "Li e aceito em nome de <empresa>"; um `NOTICE_STALE` mostra o aviso novo e pede para marcar de novo | `apps/web/src/hub/notice/invitation-notice.test.tsx` | must |
| 10 | U2 | `/egress-notice` abre sem sessão, com o aviso, a versão em data brasileira e nenhum dado de empresa | `apps/web/src/hub/notice/public-notice.test.tsx`; `pages.ts` tem a rota | must |
| 11 | U2 | O Início mostra o cartão do aviso ao dono e ao administrador quando `notice` é `NEVER` ou `BEHIND`, e não ao membro; aceitar tira o cartão sem recarregar | `apps/web/src/hub/notice/home-notice.test.tsx` | must |
| 12 | U2 | A ficha do cliente na Central mostra "Aceito em <data> por <nome>, versão de <data>" ou "Ainda não aceito" | `apps/web/src/hub/operations/client.test.tsx` | must |
| 13 | U3 | Toda rota `/api/` com `:companyId`, chamada por uma pessoa da empresa A com o id da empresa B, responde o mesmo status e código que com o id de uma empresa que não existe, e nunca 2xx; a lista vem das rotas registradas, então uma rota nova entra sozinha | `apps/server/src/platform/isolation-routes.test.ts` | must |
| 14 | U3 | Nenhuma chave estrangeira entre duas tabelas com `company_id` deixa a empresa de fora; inserir na A uma linha que aponte para um id da B é recusado (23503) | `apps/server/src/platform/catalog.test.ts`, caso novo, e `isolation-versions.test.ts` | must |
| 15 | U3 | Depois de apagar uma empresa, nenhuma tabela com `company_id` tem linha dela, o Mastra não tem conversa nem agenda com recurso dela, e o balde de Git não tem chave `git/<empresa>/` | `apps/server/src/hub/operations/client-deletion-sweep.test.ts` | must |
| 16 | U3 | A seção 11 da arquitetura tem a tabela com as respostas do fundador; `docs/how-to/paid-plans.md` diz o que ligar no Neon; `npm run docs` passa | `npm run docs` | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Convite do primeiro dono | o aviso aberto acima do nome, marca desmarcada | não há | o formulário de hoje carregando | a frase de `DATABASE_UNAVAILABLE` de hoje | o convite inexistente de hoje | não há: o convite é público pelo link | `NOTICE_STALE`: "O aviso mudou. Leia de novo e marque para seguir", com o aviso novo; o convite vencido de hoje |
| Página pública do aviso | o aviso inteiro | não há: o texto é fixo no código | não há: nada a buscar | não há | não há | não há: é pública | não há |
| Cartão no Início | `NEVER`: "Leia o que sai do Brasil antes de convidar a empresa" | some em `CURRENT` | some enquanto carrega | "Não foi possível aceitar agora. Tente de novo." e o botão volta | não há | o membro não vê o cartão | `BEHIND`: "O aviso mudou: <o que entrou>"; `NOTICE_STALE` ao aceitar recarrega o aviso |
| Ficha da Central | "Ainda não aceito" | igual | a ficha de hoje carregando | a frase de hoje | o cliente inexistente de hoje | só o operador | "Aceito em <data> por <nome>, versão de <data>; há versão nova" |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `EGRESS_NOTICE.version`, `destinations`, `dictation` | o código (`packages/hub-api/src/egress-notice.ts`) | a U2 (convite, página, cartão); o servidor ao conferir o aceite |
| `notice_acceptance.version`, `person_id`, `accepted_at` | a U1 no aceite do convite e na rota da versão nova | `getCompany` (`notice`), `getClient` (`notice`) |
| `CompanyDetail.notice` (`NoticeState`) | o servidor | o Início (U2) |
| `Client.notice` (`ClientNotice`) | o servidor | a ficha da Central (U2) |
| corpo `acceptInvitation.notice` | o convite (U2) | o servidor (U1) |

**As caixas, a 1280 e a 390 px.** As capturas de hoje das telas que mudam e das referências estão
fora do repositório, ao lado do estudo (`invitation-page-before-password-*`,
`company-inicio-first-time-*`, `central-client-*`, `supabase-subprocessors-*`); o produto antigo não
tinha esta tela.

Convite do primeiro dono, 1280 (coluna de 384 px de hoje, centrada):

```text
            [logo Conexus]
            Conexus convidou você para ser o primeiro dono de Empresa B.
            Válido até 11/11/2026, 01:36.
            ┌ O que sai do Brasil · versão de 09/11/2026 ─────────┐
            │ Quem          O que vai                 Para onde   │
            │ Anthropic     a conversa e o que ela lê  EUA         │
            │ ...                                                  │
            │ O ditado no Chrome manda o áudio ao Google.          │
            └──────────────────────────────────────────────────────┘
            [ ] Li e aceito em nome de Empresa B
            Nome [                    ]
            Senha [                   ]  8 caracteres ou mais
            Confirmar senha [         ]
            [ Criar senha ] (desligado até marcar)
            [ Recusar convite ]
```

Convite, 390: a mesma ordem numa coluna; a tabela vira uma lista, cada destino com três linhas
(quem, o que vai, para onde).

Início, 1280: o cartão no topo da coluna principal, antes de "Projetos", com o título, uma linha
do que mudou (`BEHIND`) e os botões "Ler o aviso" (abre o aviso numa caixa de diálogo) e
"Aceitar em nome de <empresa>". 390: o mesmo cartão, botões empilhados.

Ficha da Central: uma linha nova "Aviso do que sai do Brasil" no bloco de dados (CNPJ, razão
social, cadastrado em), igual às outras.

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Aceite do convite com o aviso (U1, mais o `acceptInvitation` do Better Auth) | A trava da empresa de hoje (`lockCompany`, `invitation-response.ts:211`) serializa; a segunda vê o convite aceito e responde como hoje, sem outro aceite (`on conflict do nothing` na chave empresa e versão) | A gravação do aceite e a do membro estão na mesma transação de biblioteca; se o Better Auth recusar, nada fica | `DATABASE_UNAVAILABLE`; o cliente repete o mesmo pedido, que é idempotente | `INVITATION_ACCEPTED` com `noticeVersion` | 2, 3 |
| `PUT /api/companies/{companyId}/egress-notice` (U1) | Os dois gravam a mesma chave; o segundo não cria linha e responde `CURRENT` | Uma instrução só | `DATABASE_UNAVAILABLE`; repetir é seguro | `EGRESS_NOTICE_ACCEPTED` com `companyId`, `version` | 4 |
| A migração das chaves estrangeiras (U3) | Não há: roda uma vez antes do programa (data D9) | Uma transação por migração; uma linha que já viola a chave nova falha a migração inteira, e o programa não sobe | O banco fora: a publicação para antes de subir | a saída do migrador | 14 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cadastrar uma empresa de fora e convidar o dono | fica de fora: já existe (4.2) | `apps/server/src/hub/operations/clients.ts:127` `insertClient`; `packages/hub-api/src/operations.ts:94` `registerClient` | `twenty@b76d0217` `twenty-config/config-variables.ts:583-589`; `dify-latest@208a2489` `api/commands/account.py:75` | Twenty: só o administrador do servidor cria workspace, por padrão; Dify: comando de operador `create-tenant` (lido) | nativo: `allowUserToCreateOrganization: false` (`hub/identity/organization.ts:49`; padrão `true` em `better-auth@1.7.8` `organization/routes/crud-org.mjs:56`) | | 4.2 aprovada em 2026-10-16 | nenhum |
| Um e-mail em várias empresas | fica de fora: já existe | `hub/identity/tables.ts:226` membro único por (empresa, pessoa); `apps/web/src/hub/identity/company-switcher.tsx` | `better-auth@1.7.8` `organization/adapter.mjs:474-485` `listOrganizations` | membro por (organização, pessoa) (lido) | nativo; `activeOrganizationId` (`tables.ts:122`) sem leitor, porque a empresa vem no caminho | | não precisa | nenhum |
| O texto do aviso | U1 | nenhum; tabela da arquitetura, seção 3 | nenhuma faz, entre as bibliotecas; produtos: `supabase@cb52c0f4` `apps/studio/components/interfaces/Organization/Documents/DPA.tsx:17-31`; lista de suboperadores com data (captura); ANPD, Resolução 19/2024 (resumo de escritório, 2026-11-09) | Supabase: documento por organização e lista datada; ANPD: o controlador publica país de destino e finalidade (documentado) | remendo: nenhuma biblioteca tem aviso de transferência; é texto do produto, com um dono (C26) | critério 1; `docs/decisions/0032-data-leaving-brazil-told.md` | 0032, "8. A", 2026-10-13; o roteiro pede a linha do ditado | `packages/hub-api/src/egress-notice.ts` |
| O aceite do aviso | U1 | nenhum | `twenty@b76d0217` `packages/twenty-server/src/engine/core-modules/dpa/entities/dpa-agreement.entity.ts:29-45`; `better-auth@1.7.8` `organization/routes/crud-invites.mjs:262-300` | Twenty guarda o acordo por workspace com `templateVersion` e quem assinou; Better Auth aceita o convite conferindo o e-mail da sessão (`:269`) (lido) | embrulhado: o aceite vai na mesma transação do `acceptInvitation` do plugin, numa tabela da empresa com política de linha | critérios 2 a 8 | decisão A | `apps/server/src/hub/identity/notice.ts`, migração |
| O ditado no Chrome | U1 (texto) | `apps/web/src/ui/speech-input.tsx:45`, `processLocally` desligado | developer.chrome.com, Web Speech API (documentado, 2026-11-09) | o Chrome manda o áudio a um servidor do Google e devolve só o texto | nativo do navegador; só o texto é nosso | | o roteiro, tabela do que você fornece | nenhum |
| A página pública | U2 | nenhuma; o acesso `page` (S48) e `PAGES` (`packages/hub-api/src/pages.ts:6`) | captura `supabase-subprocessors-1280.png`, `n8n-legal-1280.png`, `calcom-legal-1280.png` | página pública, sem entrar, com data da versão | nativo do Hub: uma rota de tela | | não precisa | `apps/web/src/hub/notice/public-notice.tsx` |
| O aviso no convite | U2 | `apps/web/src/hub/identity/invitation.tsx`, `set-password-form.tsx` (captura `invitation-page-before-password-*`) | `better-auth` aceite por e-mail | | embrulhado: peças de `apps/web/src/ui/` | | decisão A | `apps/web/src/hub/notice/invitation-notice.tsx` |
| O cartão no Início | U2 | `apps/web/src/hub/projects/home.tsx` (captura `company-inicio-first-time-*`) | Supabase avisa a mudança da lista por e-mail, sem travar (captura) | | embrulhado | | decisão B | `apps/web/src/hub/notice/home-notice.tsx` |
| O aceite na ficha da Central | U1, U2 | `apps/web/src/hub/operations/client.tsx`; `getClient` (`operations.ts:83`) (captura `central-client-*`) | Twenty, o acordo por workspace | | embrulhado | | não precisa | campo `notice` de `Client` |
| Rotas por empresa recusam outra | U3 | `hub/identity/admission.ts:316,339` (o mesmo `NOT_FOUND`); testes por família em `apps/server/src/platform/isolation*.test.ts` | `flowise@9291856` `packages/server/src/utils/ControllerServiceUtils.ts:6` `getWorkspaceSearchOptions` | um ajudante lança erro sem escopo (lido) | nativo do teste: Fastify `printRoutes` lista as rotas registradas | rodado no estudo: 106 rotas, todas iguais a "empresa que não existe"; 30 recusam antes pela forma do corpo | não precisa | `apps/server/src/platform/isolation-routes.test.ts` |
| Política de linha em toda tabela de empresa | fica de fora: já existe | `apps/server/src/platform/catalog.test.ts:200-232` | basejump, teste `rls_enabled` | o catálogo falha sem RLS (lido) | nativo (PostgreSQL) | rodado no estudo: os 28 testes de isolamento e do guarda passam | 0039 | nenhum |
| Chaves estrangeiras com a empresa | U3 | 12 chaves entre tabelas de empresa sem `company_id`, ex. `apps/server/src/hub/apps/tables.ts:111-115` `app_project_id_fkey` | PostgreSQL: a checagem da chave estrangeira não passa pela política de linha | uma linha da A aponta para um id da B e é aceita (rodado no estudo: a lista das 12) | nativo: chave composta `(company_id, …)` | critério 14 | não precisa | migração; `catalog.test.ts` |
| As conversas do Mastra por empresa | fica de fora: já existe | `builder/controller-kit/kinds.ts:56-57` `resourceOf`; `builder/conversation/guard.ts:175-186` | `@mastra/memory@1.41.0` `recall`; `@mastra/pg@1.35.0` `getThreadById` | só confere o dono quando recebe `resourceId`; sem ele devolve a conversa; nenhuma das 39 tabelas tem RLS (rodado no estudo) | embrulhado: o guarda confere pessoa e admissão | `guard.test.ts`, 3 de 3 | 0050 | nenhum |
| Apagar uma empresa não deixa nada | U3 | `hub/operations/clients.ts:212-242` | `twenty`, exportação do workspace no painel (relay do leitor) | | nativo do teste: catálogo, Mastra e balde depois de apagar | critério 15 | etapa 5 | `apps/server/src/hub/operations/client-deletion-sweep.test.ts` |
| O plano pago do Neon | U3 (documento); você no console | 0009; `docs/how-to/hub-company-databases.md` | `neon-for-agent-platforms@028b69b` `skills/neon-postgres-agent-platforms/SKILL.md:211`; neon.com/pricing (2026-11-09) | um projeto por cliente; Launch sem mínimo (documentado) | nativo | | decisão E | `docs/how-to/paid-plans.md` |
| As contas de modelo de outra empresa | fica de fora: já existe | `builder/model-accounts/kinds.ts:12-19` `openKindsOf`; `setKinds` só do operador | | só a chave de API vale para uma empresa nova | nativo do Conexus (0049) | | 0049 | nenhum |
| Suporte | fica de fora com G1 | `hub/identity/auth.ts:339` `admin()` sem rota de personificação | `better-auth@1.7.8` `admin/routes.mjs:559,598`; `twenty@b76d0217` `impersonation/services/impersonation.service.ts:145` | personificação de 1 hora, registrada (lido) | nativo se G2 | | decisão G | nenhum com G1 |
| Página de status | fica de fora com H1 | StatusCake grátis, e-mail ao fundador (`docs/how-to/hub-server.md:33-35`) | `supabase@cb52c0f4` `apps/studio/components/layouts/AppLayout/StatusPageBanner.tsx:7`; `langfuse@8ee97c4` `web/src/features/cloud-status-notification/server/cloud-status-router.ts:49-55` | faixa no produto com o link de uma página de terceiro (lido) | nativo de terceiro se H2 | | decisão H | nenhum com H1 |

**A medida do transplante.** Nada é trazido do produto antigo: ele não tinha aviso (busca em
`e0353c36`).

**A dívida.** Vai para a seção 11 na U3:

- O aviso diz "fora do Brasil", sem país, onde a página do fornecedor não diz a região (a E2B).
- A página pública não tem histórico das versões; só a atual.
- 30 rotas recusam pela forma do corpo antes da admissão; a varredura não exercita a admissão delas
  com corpo válido.

## U1 O aviso e o aceite

**Base e modelo.** O `main` do dia em que a etapa abrir. Sonnet: uma tabela, uma rota e um campo
em duas leituras, no padrão das tabelas de empresa.

### As linhas da tabela

- O texto do aviso, o aceite do aviso, o ditado no Chrome, o aceite na ficha da Central (parte do
  servidor).
- Ler na base: `apps/server/src/hub/identity/invitation-response.ts:173-240` (`acceptedCompany`,
  `acceptCommand`), `hub/identity/admission.ts:59-120` (`ACTIONS`), `hub/identity/tables.ts:187-330`
  (as tabelas da empresa e o `policy`), `hub/operations/clients.ts:54-125` (`clientsOf`,
  `clientOf`), `docs/architecture.md` seção 3 (a lista dos destinos).
- API nativa: `better-auth@1.7.8` `auth.api.acceptInvitation` (`crud-invites.mjs:262-300`), que a
  U1 continua chamando como hoje; a conferência do aviso vem antes, como a da revisão (`invitation-response.ts:181`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/egress-notice.ts` | Cria | a U2; `hub/identity/notice.ts` |
| `packages/hub-api/src/companies.ts` | Muda: `acceptInvitation` (corpo e falhas), `CompanyDetail.notice`, `acceptEgressNotice` | `apps/web` |
| `packages/hub-api/src/operations.ts` | Muda: `Client.notice` | `apps/web/src/hub/operations` |
| `packages/hub-api/src/identity-failures.ts` | Muda: `NOTICE_REQUIRED`, `NOTICE_STALE` | `failures.ts` |
| `apps/server/src/hub/identity/` | Cria `notice.ts`; muda `invitation-response.ts`, `company-routes.ts`, `admission.ts`, `tables.ts`, `roles.ts`, `public.ts` | `hub/operations/clients.ts` |
| `apps/server/src/hub/operations/clients.ts` | Muda: lê o aceite pelo porto de identity | rotas da Central |
| `apps/server/migrations/` e `apps/server/database-grants.sql` | Cria a migração e as permissões; muda o retrato do catálogo | `catalog.test.ts` |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/egress-notice.ts
export const NoticeVersion = z.iso.date().brand<'NoticeVersion'>()
export type NoticeVersion = z.infer<typeof NoticeVersion>
export type EgressDestination = Readonly<{ who: string; what: string; where: string }>
export const EGRESS_NOTICE: Readonly<{
  version: NoticeVersion
  /** Uma linha por destino fora do Brasil; o que mudou desde a versão anterior, para o cartão. */
  destinations: readonly EgressDestination[]
  dictation: string
  changed: string | null
}>
export const NoticeState = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('NEVER') }),
  z.object({ kind: z.literal('BEHIND'), accepted: NoticeVersion }),
  z.object({ kind: z.literal('CURRENT') }),
])
export const ClientNotice = z.object({
  version: NoticeVersion,
  acceptedAt: z.iso.datetime(),
  personName: PersonName,
  current: z.boolean(),
}).nullable()
```

- `acceptInvitation`: corpo `Revision.extend({ notice: NoticeVersion.optional() })`; falhas
  novas `NOTICE_REQUIRED` (409) e `NOTICE_STALE` (409). Só o convite de empresa (sem
  `projectId`) de uma empresa sem aceite da versão atual pede a versão; o convite de app não muda.
- `acceptEgressNotice`: `PUT /api/companies/{companyId}/egress-notice`, acesso `session`, corpo
  `{ version: NoticeVersion }`, 200 `{ notice: NoticeState }`; falhas `NOT_FOUND`,
  `NOTICE_STALE`, `SESSION_REQUIRED`, `DATABASE_UNAVAILABLE`. Ação nova em `ACTIONS`:
  `acceptEgressNotice: { by: 'MEMBER', statement: { company: ['notice'] }, locks: true }`; a
  afirmação é fixa do dono e do administrador no kit de papéis (`roles.ts`), fora dos papéis
  editáveis.
- `CompanyDetail.notice: NoticeState`, preenchido para quem pode aceitar; `null` para os outros.
- `Client.notice: ClientNotice`.
- Tabela `auth.egress_notice_acceptance`: `company_id text not null` (FK para `auth.company` com
  `on delete cascade`), `version text not null` (check de data), `person_id text not null`,
  `accepted_at timestamptz not null default now()`, chave `(company_id, version)`. Política: o
  escopo da empresa lê e grava a própria; o do convite grava a da sua empresa (como a A2 da 0039);
  o do operador lê todas. Sem `UPDATE` nem `DELETE` para o login do Hub.
- O dono de cada fato: o texto e a versão, a constante (C26); o aceite, a tabela de identity; a
  Central lê pelo porto de identity, sem tabela própria (data D17).
- O modelo a seguir: `hub/operations/tables.ts:11-41` para a política com `policy(...)`; cumpre
  C21 (sem estado em texto livre), C23 (`CompanyId`, `PersonId` com marca) e C26.

### As skills e a leitura

`better-auth-best-practices` e `organization-best-practices` (linha `better-auth` do
`docs/reference/stack.md`); `drizzle` do `drizzle-kit` para a migração; `fastify-best-practices`.

### A ordem do trabalho

1. `egress-notice.ts`: a constante, com uma linha por destino da tabela da seção 3 da arquitetura
   que diz "Yes" em "Leaves Brazil", mais a do ditado. Regras: C26, L23 (texto em português).
2. A tabela e a migração; as permissões em `database-grants.sql`; o retrato do catálogo. Regras:
   data D6, D9, D11; decisão 0038.
3. `hub/identity/notice.ts`: `noticeOf(tx, companyId)` devolve o `NoticeState`; `accept(tx, …)`
   grava com `on conflict do nothing`.
4. `invitation-response.ts`: em `acceptedCompany`, antes de `auth.api.acceptInvitation`, se a
   empresa não tem a versão atual: sem `notice`, `NOTICE_REQUIRED`; diferente da atual,
   `NOTICE_STALE`; igual, grava o aceite na mesma transação. Regras: S8, S12.
5. A rota `acceptEgressNotice` em `company-routes.ts`; o log `EGRESS_NOTICE_ACCEPTED` só com ids e
   versão (S41).
6. `getCompany` e `getClient` leem o estado.

### Como se prova

Os critérios 1 a 8, cada um pelo seu arquivo, através das rotas (testing T5). O teste do critério
2 falha hoje: o corpo não tem `notice`. `npm run test -w @conexus/server` só nos arquivos tocados,
mais `typecheck` e `lint`.

### Parar se

- O kit de papéis não aceita uma afirmação fixa fora dos papéis editáveis: pare e relate.
- O texto de uma linha do aviso pede um fato que o estudo não leu (o país de um fornecedor): escreva
  "fora do Brasil", nunca um país inventado.

## U2 As telas do aviso

**Base e modelo.** Depois da U1. Sonnet: telas com peças existentes.

### As linhas da tabela

A página pública, o aviso no convite, o cartão no Início, o aceite na ficha da Central (a tela).
Ler na base: `apps/web/src/hub/identity/invitation.tsx`, `set-password-form.tsx`,
`apps/web/src/hub/projects/home.tsx`, `apps/web/src/hub/operations/client.tsx`,
`packages/hub-api/src/pages.ts`, e as capturas de hoje ao lado do estudo.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/notice/` | Cria: `notice-table.tsx`, `invitation-notice.tsx`, `public-notice.tsx`, `home-notice.tsx`, `queries.ts`, `public.ts` | identity, projects, o roteador |
| `apps/web/src/hub/identity/invitation.tsx`, `set-password-form.tsx` | Muda | |
| `apps/web/src/hub/projects/home.tsx` | Muda: põe o cartão | |
| `apps/web/src/hub/operations/client.tsx` | Muda: a linha do aceite | |
| `packages/hub-api/src/pages.ts` | Muda: `/egress-notice` | o teste do roteador (W1) |
| o roteador da web | Muda: a rota pública | |

### A ordem do trabalho

1. `notice-table.tsx`: a tabela a 1280 e a lista a 390, das peças de `apps/web/src/ui/`. Regras:
   W1, V39.
2. O convite: o aviso acima do nome e a marca; o botão desligado sem ela; o `notice` no corpo do
   aceite; `NOTICE_STALE` recarrega a constante e desmarca.
3. A página pública, sem sessão, no acesso `page` (S48).
4. O cartão no Início, só com `notice` `NEVER` ou `BEHIND`; aceitar invalida a leitura da empresa.
5. A linha na ficha da Central.
6. `impeccable detect` nos arquivos mudados (`docs/reference/impeccable.md`).

### Como se prova

Os critérios 9 a 12, com os testes de tela; o QA da etapa anda o roteiro a 1366 e 390 px nos dois
temas.

### Parar se

Os textos das telas são os do cartão; uma frase nova vai para a rodada de textos do fundador.

## U3 Duas empresas, provadas

**Base e modelo.** Depois da U1. Sonnet; a varredura de rotas já rodou no estudo.

### As linhas da tabela

Rotas por empresa recusam outra; chaves estrangeiras com a empresa; apagar uma empresa não deixa
nada; o plano pago do Neon (o documento). Ler na base: `apps/server/src/hub/identity/test-hub.ts`
(`hubOn`, `personOn`, `plantCompany`, `call`, `post`, `codeOf`), `platform/catalog.test.ts:200-232`,
`hub/operations/clients.ts:212-242`, `hub/operations/client-deletion-database.test.ts`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/` | Cria `isolation-routes.test.ts`; muda `catalog.test.ts` | |
| `apps/server/migrations/` | Cria a migração das 12 chaves estrangeiras compostas, com as chaves únicas `(company_id, id)` que elas pedem | `catalog.test.ts` |
| `apps/server/src/hub/*/tables.ts` das 12 chaves | Muda a declaração da chave | |
| `apps/server/src/hub/operations/` | Cria `client-deletion-sweep.test.ts` | |
| `docs/architecture.md`, `docs/how-to/paid-plans.md`, `docs/index.md` | Muda a seção 11 e a 7; cria o how-to | |

### Os contratos que a unidade cria

Nenhum de rota. As 12 chaves, como o estudo as achou no `main` de `44fb4040`: `apps.app` para
`app_version` (três) e para `projects.project`; `apps.app_version` para `apps.app`;
`apps.version_file` para `apps.app_version`; `builder.agent_tool` para `builder.tool_version`;
`builder.assistant_conversation` e `builder.conversation` para `projects.project`;
`builder.model_account_assignee` para `builder.model_account`; `notifications.request_notice` para
`requests.request`; `requests.request` para `projects.project`. Cada uma passa a levar
`company_id` primeiro.

### A ordem do trabalho

1. `isolation-routes.test.ts`: lê `app.printRoutes({ commonPrefix: false })`, pega as rotas
   `/api/` com `:companyId`, chama cada uma como a pessoa da A com o id da B e com um id que não
   existe, e compara status e código. O começo está no estudo (`proof/route-sweep.test.ts`, fora do
   repositório).
2. O caso novo em `catalog.test.ts`: nenhuma chave estrangeira entre tabelas com `company_id` sem a
   coluna. Ele falha hoje com as 12.
3. A migração das chaves compostas e as declarações em Drizzle. Regras: data D6 (só adiciona; a
   chave velha sai depois da nova), D9.
4. `client-deletion-sweep.test.ts`: planta uma empresa com Projeto, conversa, automação e versão,
   apaga pela Central e varre o catálogo, o Mastra (`listThreads` por recurso, `schedules.list`) e
   o balde dobrado (`test-bucket.ts`).
5. A seção 11 da arquitetura com as respostas; a seção 7 com o plano escolhido;
   `docs/how-to/paid-plans.md` com os passos do console e os preços lidos com data. Regras: L24.

### Como se prova

Os critérios 13 a 16. O 14 falha hoje (as 12 chaves); o 13 passa hoje e passa a guardar toda rota
nova.

### Parar se

- A migração acha uma linha que já aponta para outra empresa: pare, não apague; relate com a
  contagem por tabela (sem dados).
- A varredura de exclusão acha uma sobra: é um defeito da etapa 5 ou do cartão que criou a tabela;
  relate com o nome da tabela, não conserte fora do raio.
