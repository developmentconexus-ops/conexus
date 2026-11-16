# Cada papel lê só o seu

Trilha Dados, segunda etapa do que a spec da camada de dados ainda não construiu, no caminho do marco
`D2` do [roteiro](../roadmap.md). O cartão segue o modelo do cartão anterior (o fundador, 2026-11-15:
"A"): um cartão só, com a ficha de cada unidade. A ordem é a dele, no mesmo dia: "A Essas juntas", a
linha principal e, ao lado, o explorador e a passada semanal. Ele espera, num pull request em
rascunho, o fim da etapa em construção da trilha (delivery L5).

A entrada já estava estudada e aprovada: a spec da parte 4 em
[dados-spec/](trilhas/dados-spec/README.md), com as emendas de 2026-11-15 (a tabela que o papel não lê
fica escondida; nenhuma regra de dado pessoal), os itens do explorador e da passada semanal, e as telas
da proposta aprovada. Os estudos e as capturas das plataformas de referência ficam fora do repositório
(delivery L21); a tabela de referência diz a situação e o que elas fazem sem nomeá-las. Cada linha
citada foi lida no `main` em `b2c23dc0`, com `@mastra/core` 1.82.0.

Este cartão substitui, da spec do repositório, a parte 4, grupos 4, 6 e 7, com as emendas do item
(d) que o texto do repositório ainda não tem; e, de fora dela, o explorador, grupo 3, itens 1 e 2, e a
passada semanal, grupo 4. Os grupos 1 a 3 da parte 4 (as tabelas e as permissões) e o contrato sem
`withheld` já estão no `main`. O que a spec ainda guarda para a etapa seguinte (o Registro de dados, a
conformidade contra a implementação real, Seguir, a seção Avisos e o aviso na primeira falha) fica nela
até o cartão 3.

A medida, conferida no `main`: cerca de 1.365 linhas alteradas em 12 unidades, abaixo das 4.000 da
delivery L2. A divisão estimava 3.600. O firstmate decidiu, em 2026-11-15, manter a etapa como a divisão
aprovada, sem juntá-la à etapa 3. A emenda de 2026-11-16 (a cópia nova sem leitores além de Dono e
Administrador, e a poda) tirou cerca de 165 linhas.

## A página do fundador

**No fim desta etapa** cada pessoa da empresa, e cada agente que conversa com ela, lê só as tabelas
copiadas que o papel dela lê, e o banco da empresa é quem garante isso. Em Configurações, Papéis, você
marca em cada papel quais tabelas ele lê, sistema por sistema. Uma cópia nova nasce lida só por Dono e
Administrador; os outros papéis leem depois que você os marca. Na página de cada tabela aparece quem a
lê. Um membro passa a ver a página Dados, só com as tabelas do papel dele. O Desenvolvedor, que
administra as cópias, continua vendo todas na lista, com as rodadas, mas só lê as linhas das que o
papel dele lê. Uma tabela que o papel não lê fica escondida: não aparece na lista, o endereço dela dá
"não encontrado", e o Assistente diz que não achou. Na página da tabela entra o botão **Perguntar ao
Assistente**. E quando uma cópia falha porque o sistema recusou, a aba Rodadas mostra o que o sistema
disse, e o Assistente sabe explicar a causa.

**O que mudou desde a versão anterior desta página.**

- Quem lê uma cópia nova. Antes, a cópia nascia marcada para os papéis que leem o sistema dela (a sua
  N3b-1), e por isso o Desenvolvedor e o Membro liam toda cópia nova. Agora ela nasce lida só por Dono
  e Administrador, como faz a plataforma de catálogo: quem é dono da tabela e quem administra leem, e os
  outros recebem concessão. Exemplo: você liga a cópia da folha de pagamento, e só você e o
  Administrador a leem até você marcá-la no Financeiro. A N3b-1 fica substituída por esta regra, com as
  suas palavras de 2026-11-16: "O que eu fiz é que deu no resolve, por exemplo. Vamos analisar como um
  contexto, como potato mode, redesign from zero, o que for, para a gente realmente implementar o
  simples e o completo, seguindo as referências, sem querer inventar coisas que até agora nem tem tanto
  impacto. Focar em executar."
- Com isso sai do cartão a semeadura das cópias que já existem: elas continuam sem leitor além de Dono
  e Administrador, como no `main` de hoje.
- As suas letras entraram: `A1`, `B1` e `F1` no quadro, em 2026-11-16, e `C1`, `D1` e `E1` ("CDE Segue seu
  recomendado").
- A poda tirou o que nenhuma referência faz e o roteiro não usa: a linha Quem lê do painel Detalhes;
  "lida com o seu papel" na linha da cópia; e "Não lê nenhuma tabela" na lista de papéis. A contagem
  de pessoas na aba Quem lê e a frase do topo da página Dados do membro ficam: estão na letra escolhida
  e na tela aprovada.

**O roteiro de uso.** Na empresa de teste do Hub no ar, com o Sankhya e as cópias de vendas e de
clientes, e uma segunda pessoa convidada com o papel Membro.

1. Em Configurações, Papéis, abra Membro. No Sankhya aparece o bloco **Dados copiados**, com as
   tabelas copiadas, nenhuma marcada. Marque `sankhya_vendas`, desmarque a leitura ao vivo de clientes
   nas operações do Sankhya (o Membro começa lendo ao vivo todo o sistema) e toque em **Salvar**.
2. Em Dados, abra `sankhya_vendas`. A aba **Quem lê** lista Dono, Administrador e Membro, com quantas
   pessoas cada um tem, e o Membro leva a ele em Papéis.
3. Entre como a pessoa do papel Membro, noutra janela. Em Dados aparece só `sankhya_vendas`, sem
   **Ligar uma cópia**. Cole o endereço da tabela de clientes, copiado da sua janela: aparece
   "não encontrado".
4. Ainda como ela, abra `sankhya_vendas` e toque em **Perguntar ao Assistente**. O Início abre com
   "Sobre a tabela sankhya_vendas: " na caixa. Complete com "quanto vendemos ontem?" e envie: vem o
   número com a origem. Pergunte depois "quantos clientes nós temos?": o Assistente diz que não achou
   uma tabela de clientes e não mostra nenhum dado deles.
5. Como dono, abra a aba Rodadas de uma cópia cuja última rodada o sistema recusou (o firstmate prepara
   uma na conferência no ar). Embaixo da frase da falha aparece o que o sistema disse, por exemplo
   "401 · Sessão expirada". Pergunte ao Assistente "por que a cópia de vendas falhou?": ele lê as
   rodadas e responde com a causa.
6. Diga o que viu e aprove os textos das telas.

**O que você faz, e quando.** Antes: nada; o firstmate convida a segunda pessoa e prepara a rodada
recusada. No começo: aprova esta página. No fim: faz o roteiro, diz o que viu e aprova os textos das
telas, que cada PR lista.

**Fica de fora.**

- O Registro de dados, a conformidade contra a implementação real, Seguir uma cópia, a seção Avisos e
  o aviso na primeira falha. São a etapa 3.
- O agente salvo continua lendo pela liberação do Projeto dele, mesmo quando um membro conversa com ele,
  como você decidiu na P1. Ler com o papel de quem conversa é a parte 7. Até lá, quem conversa num
  Projeto lê por ele uma cópia liberada ao Projeto que o papel dele não lê fora dali.
- Desmarcar uma tabela não tira a leitura ao vivo do sistema, que segue as operações marcadas do
  papel. As duas referências separam as duas permissões do mesmo jeito. A tela Papéis diz isso.
- Das pendências guardadas para o próximo cartão, esta etapa toma uma como prova: a 943 (os estados de
  erro e o papel Membro que a conferência no ar não forçou), que o passo 5 e a QA percorrem. As outras
  que tocam esta etapa esperam. A 946 (a coluna interna `_pass` num `select *`) e a 830 (o limite de
  papéis por empresa) pedem uma palavra sua que esta etapa não muda: o login por papel lê as mesmas
  tabelas que o login de hoje, e um papel a mais custa um login a mais no banco da empresa, o que não
  muda o gatilho da 830. A 828 (o cache de papéis) espera a etapa em que um papel decide uma escrita. A
  944, a 938 e a 254 são de telas e regras que esta etapa não toca.

**As decisões suas nesta etapa.** Todas escolhidas. Esta página não tem mais decisão aberta além da
aprovação. Uma linha por letra, com o que ela fixa:

- **`A1`** (quadro, 2026-11-16). O endereço direto de uma tabela que o papel não lê dá "não encontrado",
  a mesma página de um endereço que não existe (security S10).
- **`B1`** (quadro, 2026-11-16). A aba Quem lê só mostra. Para quem pode mudar papéis, cada papel leva a
  ele em Papéis. Todo membro a vê nas tabelas que o papel dele lê, com todos os papéis e quantas pessoas cada
  um tem, sem nomes. Mudar fica num lugar só, o papel.
- **`C1`** ("CDE Segue seu recomendado"). **Perguntar ao Assistente** abre o Início com "Sobre a tabela
  {nome}: " já na caixa, e a pessoa completa a pergunta.
- **`D1`** ("CDE Segue seu recomendado"). Um agente que consulte o catálogo interno do banco vê o nome de
  uma tabela escondida, nunca uma linha dela. A U3 mede isso num banco de teste e registra.
- **`E1`** ("CDE Segue seu recomendado"). O que o sistema disse aparece embaixo da frase da falha, na linha
  da rodada, com o status e a mensagem cortada em 1.000 caracteres, sem página nova. O corte já está no
  `main`, numa regra da tabela das rodadas.
- **`F1`** (quadro, 2026-11-16). O membro vê na página Dados as tabelas do papel e as rodadas delas, e os
  botões de quem administra (**Ligar uma cópia**, **Rodar agora**, o menu da tabela) não aparecem, como a
  tela `p1-11`. A página diz no topo "Você vê as tabelas que o papel {papel} lê.". A camada Apps também
  não aparece para ele. O guia das telas é emendado no fechamento
  desta etapa (delivery L20).

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 O banco garante (um PR) | U1 `roleLogin`, `roleAddress`, o livro, o bilhete e `reconcileReaders` | Um login de leitura por papel editável (`conexus_role_<id>`), com `SELECT` só nas tabelas dadas; o livro `sync._readers_applied` e a sequência `sync.readers_ticket`; o bilhete e a aplicação que abandona a de bilhete mais velho (`SUPERSEDED`); `ROLES_LOCK` em `grantCopy` e `revokeCopy`; três portas no mundo de teste | `apps/server/src/platform/`, `scripts/rerun-never.json` | data (D10, D22); testing (T5, T13, T27); S41 | nada além do `main` em `b2c23dc0` (o `ROLES_LOCK` e o `ensureReader` do PR 1078) |
| G1 | U2 A porta da identidade, `reconciled` e `readers_set` fora do esquema | A cópia nova sem linha em `copies.copy_reader` (só Dono e Administrador a leem); `reconciled` no fim de toda rodada; `companyRoleRows`; `readersSet` sai do esquema do Hub (a migração é da U3, data D6) | `apps/server/src/hub/identity/`, `apps/server/src/hub/copies/`, `scripts/rerun-never.json` | data (D6, D16, D22); testing (T5, T10, T27); S41 | U1. Em `ended`, a U2 vai antes da U10 (decisão G4.7) |
| G2 O catálogo e as rotas por papel (um PR) | U3 O catálogo filtrado, a leitura pelo login do papel e o conserto em `42501` | O catálogo por papel no lugar Empresa, com `NOT_IN_CATALOG` para a tabela de fora pedida pelo nome; a leitura pelo login do papel (`conexus_read` para Dono e Administrador), com o conserto em `42501` e `NO_LOGIN`; a sonda da decisão D; a migração que apaga `readers_set` | `apps/server/src/hub/copies/`, `apps/server/src/hub/data/`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `scripts/rerun-never.json` | data (D6, D22); testing (T4, T5, T10, T27); S10, S41 | G1 mesclado. Não depende do G3 do cartão 1 |
| G2 | U4 As rotas `listCopyReaders` e `setRoleCopies` | `GET .../copy-readers` (decisão B) e `PUT .../roles/{role}/copies`, o Hub primeiro, com a reposição e o 503 quando tirar falha; a ação `seeData` | `packages/hub-api/src/`, `apps/server/src/hub/copies/`, `apps/server/src/hub/identity/`, `scripts/rerun-never.json` | data (D22); testing (T5, T6, T10, T27); S8, S10, S41; code C65 | U3 (o conserto do critério 47) |
| G2 | U5 O membro: `seeData`, `listCopies`, `listCopyRuns` e `sampleCopy` por papel | As listas, as rodadas e a amostra por papel (`seeData`), sem propostas ao membro; 404 para a tabela de outro papel (decisão A); `COPY_NOT_IN_ROLE` ao desenvolvedor fora do papel; `readCopyRows` sai | `apps/server/src/hub/identity/`, `apps/server/src/hub/copies/`, `packages/hub-api/src/`, `apps/web/src/platform/test-may.ts`, `apps/web/src/hub/copies/`, `apps/web/src/routes/_app/companies/$companyId/data.$copyId.tsx`, `scripts/rerun-never.json` | web; testing (T5, T10, T27); S10 | U3 (`readCopyTable` com o leitor), U4 (`seeData`). O G4 parte deste PR |
| G3 As telas de quem lê (um PR; depois dele, a QA, T25) | U6 A tela Papéis com o bloco Dados copiados (`p4-01`) | O bloco **Dados copiados** em cada sistema do papel aberto; **Salvar** grava o papel e depois as tabelas; Dono e Administrador só leem; a frase da leitura ao vivo | `apps/web/src/routes/_app/companies/$companyId_/settings/` (só `roles.tsx`), `apps/web/src/hub/identity/`, `apps/web/src/hub/copies/` (só `queries.ts` e `public.ts`), `apps/web/` (só `sweep-roles-states.ts`), `docs/reference/` (só `screens.md`) | web, design, testing | G2 mesclado (U4) |
| G3 | U7 A aba Quem lê e a página Dados do membro (`p4-02`, `p1-11`, `v10`) | Dados, a árvore e a página da tabela para o membro, só com as tabelas do papel; a aba **Quem lê {n}**; a recusa na Amostra do desenvolvedor | `apps/web/src/hub/copies/`, `apps/web/src/routes/_app/companies/$companyId/` (`route.tsx`, `data.index.tsx`, `data.$copyId.tsx`), `apps/web/` (só `sweep-table-states.ts`), `docs/reference/` (só `screens.md`), `scripts/rerun-never.json` | web, design, testing; S10 | U6 (`copyReadersQuery`); G2 mesclado (U4, U5) |
| G3 | U8 A tabela escondida na conversa (`p4-03`), só testes | Dois casos do servidor e um da tela provam que `data_describe` e a linha da conversa não nomeiam a tabela que o papel não lê (critérios 84 a 86) | `apps/server/src/builder/data-tools/` (só o teste), `apps/web/src/builder/assistant/` (só o teste), `scripts/rerun-never.json` | testing (T5, T27) | o servidor: só o `main`; a tela: o G3 do cartão 1 (U5: `REFUSED_TEXT`, critério 37 dele) |
| G3 | U9 Perguntar ao Assistente (`v10`) | O link **Perguntar ao Assistente** no topo da tabela, para todo membro: abre o Início com "Sobre a tabela {nome}: " na caixa, sem enviar | `apps/web/src/builder/assistant/`, `apps/web/src/hub/copies/` (só `copy-detail.tsx`), `apps/web/src/routes/_app/companies/$companyId/` (só `data.$copyId.tsx`) | web, design, testing | U7 (o topo da página) |
| G4 A causa da falha (um PR) | U10 A mensagem do sistema, do conector até a rodada | A recusa do sistema de origem guarda o que ele disse (status, código, mensagem sem NUL e cortada em 1.000, nunca o corpo) nas colunas `system_*` de `copies.copy_run`; todo outro `ERROR` leva `system: null` | `apps/server/src/hub/connectors/` (`copy-port.ts`), `apps/server/src/hub/copies/`, `packages/hub-api/src/` (`CopySystemMessage`), `packages/connectors/src/sankhya/` (o interruptor do falso) | security (S40, S41); testing (T4, T5, T26, T27) | nada de outro grupo para o código: as colunas e as permissões já estão no `main` (PR 1088 e PR 1098, `apps/server/src/hub/copies/tables.ts:116-119`, `apps/server/database-grants.sql:419-421`); `ended` (`apps/server/src/hub/copies/run.ts:105-153`) como a U2 o deixou (decisão G4.7) |
| G4 | U11 A mensagem do sistema na aba Rodadas | `system` no `ERROR` da rota de rodadas; "{status} · {mensagem}" (ou o código) embaixo da frase da falha, no computador e no celular | `packages/hub-api/src/`, `apps/server/src/hub/copies/`, `apps/server/src/builder/data-tools/` (só o mundo de teste), `apps/web/src/hub/copies/`, `apps/web/sweep-copies-states.ts` | web; testing (T5) | U10; G3 mesclado (`copy-detail.tsx` e `text.ts`) |
| G4 | U12 A ferramenta `copy_runs` e a sua linha na conversa | `copy_runs` para todo papel: pelo nome da tabela, a cópia e as cinco últimas rodadas; para a tabela fora do papel, o `NOT_FOUND` de um nome que não existe; a linha na conversa | `packages/hub-api/src/` (`ASSISTANT_TOOL`), `apps/server/src/builder/assistant/`, `apps/server/src/conversations-of.ts`, `apps/web/src/builder/conversation/`, `scripts/rerun-never.json` | security (S10); testing (T4, T5, T10) | U11 (o `system` de `runOf`); U5 (`seeData` e o filtro por papel, decisão G4.1); U4 (a rota que marca as tabelas, usada no teste) |

Quatro grupos, um pull request cada ([delivery L9](../guides/delivery.md)), um commit por unidade. Na ordem do trabalho, o passo sem **O que sai** não tira nada; o sem **Mutações à mão** não tem mutação; o sem **Referência a seguir** segue as linhas citadas na unidade; o sem **Pronto quando** termina com os seus casos passando.

- **A linha principal.** G1, G2 e G3, nesta ordem. G2 muda `packages/hub-api/src/copies.ts`, que a
  trilha Agentes e Apps lê (L27). O caso de tela da U8 espera o G3 do cartão anterior.
- **Ao lado.** G4 parte do `main` com G2 mesclado (decisão G4.7); a U11 rebaseia sobre o G3 mesclado,
  e o PR do G4 mescla depois dele.
- **Quem corre junto.** Depois de G2, G3 e G4 correm em paralelo, com uma exceção: a U11 muda
  `copy-detail.tsx` e `text.ts` de `apps/web/src/hub/copies/`, como a U7 e a U9, e começa depois do
  merge de G3. Dentro do grupo, a ordem da tabela (U7 usa a consulta de U6; U9
  muda o topo que U7 abre ao membro); a U8 corre ao lado.
- **A QA** ([testing T25](../guides/testing.md)) roda depois de G3 e de G4, pelo roteiro de uso e
  pela matriz de estados.
- **Os modelos.** U1 a U4 em Opus; as outras em Sonnet (Base e modelo de cada uma).

**Orçamento de código alterado.** A estimativa de cada unidade, em linhas, sem testes nem gerados.

- U1: ~190 (`copy-reader.ts` ~110, com `readSettingsOf` extraída e o `REVOKE` do livro em `ensureReader`; `copy-sql.ts` ~30; `test-app-ports.ts` 8; `test-company-postgres.ts` 8).
- U2: ~110 (`role-rows.ts` 35, `identity/public.ts` 1, `readers.ts` ~70, `run.ts` 3, `tables.ts` −2).
- U3: ~205 (`readers.ts` ~85; `read-table.ts` −25 e +15; `catalog-view.ts` +15; `service.ts` +8; `sample.ts` +4; `catalog.ts` ~20 trocadas; `rows.ts` +15; `query.ts` ~30 trocadas; `database-grants.sql` −3). A migração gerada não conta.
- U4: ~198 (`hub-api/copies.ts` +32; `company-roles.ts` +1; `readers.ts` ~128; `role-rows.ts` +15, `identity/public.ts` +1, `admission.ts` +2; `service.ts` +4; `routes.ts` +12). O `openapi` gerado não conta.
- U5: ~90 (`list.ts` +35; `sample.ts` +20; `copy-failures.ts` +8; `connection-copies.ts` +1; `admission.ts` −3; `companies.ts` −1; `roles.ts` −1; `copy-detail.tsx` e a rota −12). `test-roles.ts`, `developer.test.ts` e `test-may.ts` não contam.
- U6: ~145 (`roles.tsx` da rota +35; `identity/roles.tsx` +4; `role-tables.tsx` novo ≈48; `role-editor.tsx` +30; `role-picker.tsx` +4; `hub/copies/queries.ts` +6; `hub/copies/public.ts` +2; `screens.md` 1 linha).
- U7: ~195 (`copy-readers.tsx` novo ≈75; `copy-detail.tsx` +22; `copy-sample.tsx` +8; `text.ts` +14; `search.ts` +1; `data-page.tsx` +10; `raw-layer.tsx` +20; `copy-list.tsx` +6; `data-tree.tsx` +8; `public.ts` −5; `route.tsx` −4; `data.index.tsx` −2; `data.$copyId.tsx` −2; `screens.md` 2 linhas).
- U8: 0 linhas de produção (≈60 de teste e uma linha de `rerun-never.json`).
- U9: ~35 (`ask-about-table.tsx` novo ≈20; `builder/assistant/public.ts` +1; o texto +2; `copy-detail.tsx` +6; `data.$copyId.tsx` +4).
- U10: ~55 (`copy-port.ts` 25; `store.ts` 1; `source-pass.ts` 4; `run.ts` 10; `packages/hub-api/src/copies.ts` 6; `packages/connectors/src/sankhya/fake.ts` 5).
- U11: ~30 (`copies.ts` 1, `list.ts` 8, `copy-detail.tsx` 12, `text.ts` 5, `sweep-copies-states.ts` 1; os ajudantes de teste não contam).
- U12: ~110 (`copy-runs.ts` 65, `ports.ts` 14, `assistant.ts` 4, `conversations-of.ts` 4, `packages/hub-api/src/assistant.ts` 1, `assistant-specs.ts` 10, `scripts/rerun-never.json` 2).

**Total da etapa:** cerca de 1.365 linhas alteradas (eram 1.530 antes da emenda de 2026-11-16).

## Os critérios de aceite

Cada grupo tem a sua faixa de números (G1 de 1 a 29, G2 de 30 a 59, G3 de 60 a 89, G4 de 90 a 119); os números que sobram ficam livres para um critério que a leitura do cartão acrescentar.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Com papéis A e B e três tabelas em `sync`, depois de `reconcileReaders`, `conexus_role_<A>` lê as de A e recebe `42501` na de B, e vice-versa. Recusa: `select` de um login na tabela do outro papel | `apps/server/src/platform/copy-role-readers.test.ts`, "cada login de papel lê as suas tabelas e é recusado nas outras com 42501" | must |
| 2 | U1 | `reconcileReaders` duas vezes com o mesmo pedido (bilhetes crescentes) deixa `pg_class.relacl` das três tabelas e as linhas `conexus_role_%` de `pg_roles` como na primeira | `copy-role-readers.test.ts`, "reconciliar duas vezes deixa o banco igual" | must |
| 3 | U1 | Tirada uma tabela do conjunto de um papel e reconciliado, o login do papel recebe `42501` nela; as outras continuam lidas | `copy-role-readers.test.ts`, "tirar uma tabela do conjunto recusa a leitura seguinte" | must |
| 4 | U1 | Um login de papel fora do pedido perde `SELECT` e `USAGE` em `sync` e some de `pg_roles`; o de outro banco no mesmo servidor, sem `USAGE` no `sync` deste, fica intocado | `copy-role-readers.test.ts`, "um login de papel fora da lista perde tudo e é apagado" e "o login de outra empresa no mesmo servidor fica" | must |
| 5 | U1 | O ataque direto (T13), como o login de um papel: `SET ROLE conexus_sync`, `select set_config('role','conexus_sync',true), query_to_xml('select * from sync.b', true, false, '')`, um `insert` numa tabela dele e um `select` da de outro papel; o banco recusa cada um (`42501`; `25006` na escrita, transação só de leitura) | `copy-role-readers.test.ts`, "o login de um papel não troca de papel, não escreve e não lê a tabela de outro papel" | must |
| 6 | U1 | `information_schema.tables`, como o login de um papel, lista em `sync` só as tabelas dele | `copy-role-readers.test.ts`, "o information_schema do login lista só as tabelas dele" | must |
| 7 | U1 | `roleLogin` aceita o id de 32 letras e dígitos da biblioteca e o uuid dos semeados; além de 63 bytes, lança `Failure('INTERNAL_UNEXPECTED')` com `details.reason` `COPY_READER_NAME`, sem login. Recusa: `reconcileReaders` com esse id não manda instrução ao banco | `copy-role-readers.test.ts`, "o id da biblioteca e o uuid cabem; um id que passa de 63 bytes falha sem login" | must |
| 8 | U1 | Pelo endereço de `roleAddress(host, roleId)`, `select current_user` devolve `conexus_role_<id>`, com a caixa do id | `copy-role-readers.test.ts`, "roleAddress entra como o login do papel" | must |
| 9 | U1 | Com `t1 < t2`, `reconcileReaders(t2, A)` e depois `reconcileReaders(t1, B)`: a segunda devolve `{ kind: 'SUPERSEDED' }`, e `pg_class.relacl` e a linha de `sync._readers_applied` ficam como depois da primeira (propriedade 9 da spec). O mesmo bilhete duas vezes: a segunda também `SUPERSEDED` | `copy-role-readers.test.ts`, "a reconciliação mais velha aplicada depois da mais nova não muda nada" e "o mesmo bilhete duas vezes também é abandonado" | must |
| 10 | U1 | Para `conexus_read` e cada login de papel, `information_schema.tables` não lista `_readers_applied`, e `select * from sync._readers_applied` e `select nextval('sync.readers_ticket')` dão `42501`, também com `ensureReader` rodado depois do livro | `copy-role-readers.test.ts`, "o livro não aparece para nenhum login de leitura" | must |
| 11 | U1 | `ensureSync` duas vezes cria a sequência, a tabela e a linha única do livro uma vez, sem erro na segunda; num `sync` criado sem o livro, `takeReadersTicket` devolve o bilhete `1` e cria o livro | `copy-role-readers.test.ts`, "ensureSync duas vezes cria o livro uma vez" e "o bilhete numa empresa sem livro cria o livro e devolve 1" | must |
| 12 | U1 | `Promise.all` de `reconcileReaders(t1, A)`, `reconcileReaders(t2, B)` e `grantCopy` de uma tabela que A e B também dão, a um login de app, 20 vezes: nenhuma resposta `REFUSED`, uma reconciliação `DONE` e a outra `DONE` ou `SUPERSEDED`, e `pg_class.relacl` dos logins de papel igual ao de B | `copy-role-readers.test.ts`, "duas reconciliações e um grantCopy ao mesmo tempo terminam sem erro" | must |
| 13 | U1 | Um pedido com uma tabela que ainda não existe em `sync` responde `DONE`, e o login lê as outras; criada a tabela e reconciliado de novo, o login a lê | `copy-role-readers.test.ts`, "a tabela pedida que ainda não existe fica de fora sem erro" | must |
| 14 | U1 | Depois de `copy-role-readers.test.ts` e `readers.test.ts`, nenhum login `conexus_role_%` fica no servidor de teste: o fim de cada banco descartável os derruba | conferência, sem teste: a consulta `select rolname from pg_roles where rolname like 'conexus_role_%'` no ponto de conferência do G1, depois dos dois arquivos | should |
| 15 | U2 | Ligar uma cópia de modelo (`copies.enable`) não grava nenhuma linha em `copies.copy_reader` para ela, com "Vendas" segurando todas as leituras da porta do conector | `apps/server/src/hub/copies/readers.test.ts`, "a cópia ligada nasce sem linha em copy_reader" | must |
| 16 | U2 | Aceitar uma proposta de versão 2 não grava nenhuma linha em `copies.copy_reader` para a cópia aceita | `readers.test.ts`, "a proposta aceita nasce sem linha em copy_reader" | must |
| 17 | U2 | Depois de ligar e da primeira rodada, o login de Vendas, com a senha derivada, recebe `42501` na tabela da cópia; com uma linha de `copy_reader` de Vendas posta como dono e a reconciliação do fim da rodada seguinte, o mesmo login lê. Recusa: `select` como o login de Vendas antes da marca | `readers.test.ts`, "a cópia nova recusa o papel com 42501 até a marca, e depois da marca o papel lê" | must |
| 21 | U2 | `DELETE /api/companies/{companyId}/roles/{role}` de um papel sem membro apaga as marcas dele em `copy_reader`; depois da rodada seguinte, o login `conexus_role_<id>` some do banco da empresa | `readers.test.ts`, "apagar o papel apaga a marca e a rodada seguinte apaga o login" | must |
| 22 | U2 | R1 pega o bilhete, lê o Hub com `sankhya_clientes` no Financeiro e para antes de aplicar; a marca sai como dono e uma R2 de bilhete maior roda inteira; solta, R1 recebe `SUPERSEDED` sem erro, e o Financeiro tem `42501` em `sankhya_clientes` (propriedade 9) | `readers.test.ts`, "a reconciliação mais velha aplicada depois da mais nova não muda nada" | must |
| 23 | U2 | Uma linha de `copy_reader` acrescentada como dono enquanto a primeira aplicação espera: `takeReadersTicket` é chamado duas vezes, e no fim o login lê a tabela nova | `readers.test.ts`, "o Hub mudou entre a leitura e a aplicação: uma segunda volta com bilhete novo" | must |
| 26 | U2 | Com `reconcileReaders` dublado para `NO_ANSWER`, a rodada tem o mesmo resultado e `COPY_READERS_FAILED`; numa rodada `DATABASE_DOWN` sem dono, `COPY_READERS_FAILED` com `reason` `NO_OWNER` | `readers.test.ts`, "a falha da reconciliação no fim da rodada só loga" | must |
| 27 | U2 | Um papel cujo login passa de 63 bytes (`identity.companyRoleRows` dublado) faz a reconciliação lançar `INTERNAL_UNEXPECTED`, com `COPY_READER_NAME` e o `companyId` no log, sem login criado | `readers.test.ts`, "o nome longo demais diz COPY_READER_NAME" | must |
| 28 | U2 | Só os papéis com linha em `auth.organization_role` ganham login: depois de uma rodada, o banco tem `conexus_role_<id>` do desenvolvedor, do membro e de cada papel próprio, com `USAGE` em `sync` mesmo sem tabela; dono e administrador leem tudo por `conexus_read`, sem login | `readers.test.ts`, "dono e administrador leem por conexus_read e não ganham login de papel" | must |
| 29 | U2 | `copy-role-readers.test.ts` e `readers.test.ts` estão em `files` de `scripts/rerun-never.json`, sem segunda rodada (T4) | `scripts/rerun-exempt.test.ts` | should |
| 30 | U3 | No lugar Empresa, `tables` no `describe` de Bruno (Vendas: vendas, itens de venda, vendedores, produtos) e no de Carla (Financeiro: clientes) tem exatamente os nomes que `information_schema.tables` (esquema `sync`) mostra ao login do papel. Recusa: sem o filtro do papel em `catalogOf`, as cinco tabelas no catálogo de Bruno | `apps/server/src/hub/data/catalog-role.test.ts`, "o catálogo de um papel lista exatamente as tabelas que o login do papel lê" | must |
| 31 | U3 | A resposta de `describe` de Bruno, serializada, não contém `sankhya_clientes`, e nenhuma linha de `tables` tem o rótulo "Clientes" (fora de `tables` não se confere: `systems[].reads` traz a leitura ao vivo `clientes`, `apps/server/src/hub/connectors/catalog-systems.ts:12-28`, `packages/connectors/src/sankhya/operations/cadastros.ts:29-36`). Recusa: devolver em `catalogOf` cópias que o papel não lê | `catalog-role.test.ts`, "a tabela que o papel não lê não aparece no catálogo" | must |
| 32 | U3 | `read({ kind: 'TABLE', table: 'sankhya_clientes' })` de Bruno responde exatamente `{ kind: 'NOT_IN_CATALOG' }`, a mesma resposta de `sankhya_nao_existe` (S10), e `companyPostgres.readCopies` não é chamado. Recusa: o `read` do contrato pela porta `createCompanyData` | `catalog-role.test.ts`, "Bruno pede sankhya_clientes pelo nome e recebe NOT_IN_CATALOG, sem linha, a mesma resposta de sankhya_nao_existe" | must |
| 33 | U3 | A consulta de Bruno que junta `sync.sankhya_vendas` e `sync.sankhya_clientes` responde `{ kind: 'NOT_IN_ROLE' }`, sem `rows`; o log tem `DATA_READ_REFUSED` com `companyId` e `personId`, e nenhuma linha de log contém o texto SQL (S41). Recusa: `read({ kind: 'QUERY' })` do contrato | `catalog-role.test.ts`, "uma consulta de Bruno que junta vendas e clientes é recusada pelo banco e não devolve linha" e "DATA_READ_REFUSED leva a pessoa e não leva a consulta" | must |
| 34 | U3 | Bruno lê `sankhya_vendas` pela tabela (`read TABLE`, até 200 linhas) e pela consulta, e as duas leituras chegam ao banco da empresa pelo login `conexus_role_<id do papel Vendas>` (o usuário do endereço passado a `companyPostgres.readCopies`); Ana, a dona, lê pelo `conexus_read` | `catalog-role.test.ts`, "o papel lê com o seu login e o dono com conexus_read" | must |
| 35 | U3 | O banco que perdeu o `GRANT` (um `REVOKE` à mão como `conexus_sync`) é consertado na primeira leitura: a consulta de Bruno a `sankhya_vendas` passa, com `COPY_READERS_REPAIRED` uma vez | `catalog-role.test.ts`, "o banco que perdeu o GRANT é consertado na primeira leitura" | must |
| 37 | U3 | Ana e o Administrador têm as cinco tabelas no catálogo, e a consulta que junta vendas e clientes devolve linhas | `catalog-role.test.ts`, "o dono lê tudo com conexus_read" | must |
| 38 | U3 | No lugar Projeto, o catálogo de Bruno traz as cópias liberadas ao Projeto, também uma fora do papel Vendas, e a consulta vai pelo login do Projeto (decisão do fundador, P1 opção a) | `catalog-role.test.ts`, "no Projeto, o catálogo traz as cópias liberadas e o login é o do Projeto" | must |
| 40 | U3 | A sonda da decisão D, como Bruno: `read({ kind: 'QUERY', sql: "select relname from pg_class where relnamespace = 'sync'::regnamespace" })` dá `QUERY` com linhas que nomeiam `sankhya_clientes`, e `select count(*) from sync.sankhya_clientes` dá `NOT_IN_ROLE` (decisão G2.11) | `catalog-role.test.ts`, "decisão D: o login do papel lê os nomes de sync em pg_class e não as linhas" | should |
| 42 | U3 | Com a reconciliação dublada para `DONE` sem aplicar, a página de `sankhya_vendas` recusada de novo dá `{ kind: 'TABLE_UNAVAILABLE' }`, com `DATA_ROWS_FAILED` e `reason: 'NOT_IN_ROLE'`; a consulta, `NOT_IN_ROLE`; nenhuma linha volta | `catalog-role.test.ts`, "a recusa que repete depois do conserto não devolve linha" | must |
| 43 | U4 | `PUT /api/companies/{companyId}/roles/{financeiro}/copies` de Ana com `{ copies: [<id de clientes>] }` responde 200 e `{ copies: [<id>] }`, e o login do Financeiro passa a ler `sync.sankhya_clientes` | `apps/server/src/hub/copies/readers-routes.test.ts`, "o dono marca clientes para o Financeiro e Carla passa a ler" | must |
| 44 | U4 | Tirar a tabela (`{ copies: [] }`) responde 200, e o login do Financeiro recebe `42501` na leitura seguinte | `readers-routes.test.ts`, "tirar uma tabela recusa a leitura seguinte" | must |
| 45 | U4 | Com `reconcileReaders` mudo, tirar responde 503 `COPY_DATABASE_UNAVAILABLE`; a linha volta a `copy_reader` com o mesmo `granted_by` e `granted_at`, o login segue lendo, e o log de erro tem `COPY_READERS_FAILED` | `readers-routes.test.ts`, "o banco calado ao tirar responde 503 e nada muda" | must |
| 46 | U4 | Com `reconcileReaders` mudo e a reposição dublada para lançar, tirar dá 503; o log de erro tem `COPY_READERS_PENDING` com `companyId` e `role`; a linha não está no Hub; sem o dublê, depois de uma rodada inteira o login recebe `42501` | `readers-routes.test.ts`, "a reposição que falha diz COPY_READERS_PENDING como erro e a rodada seguinte conserta" | must |
| 47 | U4 | Com `reconcileReaders` mudo, dar responde 200 e o log tem `COPY_READERS_PENDING` como `info`; o login ainda não lê; tirado o dublê, a primeira consulta de Carla passa pelo conserto da U3, com `COPY_READERS_REPAIRED` | `readers-routes.test.ts`, "o banco calado ao dar responde 200, diz COPY_READERS_PENDING e o conserto libera" | must |
| 48 | U4 | Propriedade 1: dar e tirar com `reconcileReaders` mudo na primeira chamada e de volta na segunda, com a reposição passando: depois de cada resposta, as tabelas que o login do papel lê estão nas linhas de `copy_reader` do papel | `readers-routes.test.ts`, "com o banco falhando, a resposta nunca deixa o login lendo mais do que o Hub diz" | must |
| 49 | U4 | A ordem da rodada 3, item 1(c): uma reconciliação parada depois de ler o Hub com `sankhya_clientes` no Financeiro; o `PUT` que a tira responde 200; solta, ela volta `SUPERSEDED`, e o Financeiro recebe `42501` em `sankhya_clientes` (propriedades 1 e 9) | `readers-routes.test.ts`, "a ordem da rodada 3, item 1(c): uma reconciliação que leu o Hub antes de tirar e aplicou depois não devolve o GRANT" | must |
| 50 | U4 | O `PUT` para Dono ou Administrador dá 409 `ROLE_FIXED`; para um papel inexistente, 404 `ROLE_NOT_FOUND`; nenhuma linha muda | `readers-routes.test.ts`, "Dono e Administrador respondem ROLE_FIXED, e o papel que não existe ROLE_NOT_FOUND" | must |
| 51 | U4 | O `PUT` de um membro, de um desenvolvedor ou de outra empresa responde 404 `NOT_FOUND`; com uma cópia de outra empresa no corpo, 404 `COPY_NOT_FOUND`; com a sessão vencida, 401 `SESSION_REQUIRED`; com 201 ids, 400 `REQUEST_MALFORMED` (`ROLE_COPIES_MAX`) (T10) | `readers-routes.test.ts`, "quem não muda papéis, outra empresa, a cópia de outra empresa, a sessão vencida e o corpo grande demais são recusados" | must |
| 52 | U4 | `GET .../copy-readers` de Ana dá, por cópia, Dono e Administrador e depois cada papel que a lê, com `role`, `label` e `members` (a contagem); a de Carla, só as cópias que o Financeiro lê, com todos os papéis que as leem e nenhum nome de pessoa (decisão B); outra empresa recebe 404 `NOT_FOUND`; `npm run openapi` lista as duas rotas | `readers-routes.test.ts`, "listCopyReaders dá Dono, Administrador e cada papel com a contagem de pessoas" e "o membro vê quem lê só as cópias do seu papel" | must |
| 53 | U4 | Dois `PUT` juntos para o mesmo papel dão 200 e o estado de um deles, sem `23505`; repetido, o `PUT` responde 200 sem mudar nada; um id repetido no corpo conta uma vez | `readers-routes.test.ts`, "dois PUT ao mesmo tempo terminam com o estado de um deles, e repetir não muda nada" | should |
| 54 | U5 | `GET /api/companies/{companyId}/copies` de Carla (Financeiro) responde 200 só com `sankhya_clientes` e `proposals: []`, mesmo com uma proposta aberta; `GET .../copy-models` de Carla continua 404 `NOT_FOUND` (`readCopies`) | `apps/server/src/hub/copies/member-data.test.ts`, "o membro lista só as tabelas do papel dele e nenhuma proposta" | must |
| 55 | U5 | Carla abre `GET .../copies/{clientes}/runs` (200, com a cópia e as rodadas); a de `sankhya_vendas` responde 404 com o mesmo corpo de uma cópia que não existe (decisão A, S10); quem não é da empresa recebe 404 `NOT_FOUND` | `member-data.test.ts`, "o membro abre as rodadas de uma tabela que o papel lê", "o membro abre uma tabela que o papel não lê e recebe 404" e "quem não é da empresa recebe 404" | must |
| 56 | U5 | O desenvolvedor lista as cinco tabelas e abre as rodadas de todas; a amostra de uma tabela fora do papel dele responde 403 `COPY_NOT_IN_ROLE`, e `sentenceOfCode('COPY_NOT_IN_ROLE')` dá "Seu papel não lê esta tabela. Peça a quem administra a empresa." | `member-data.test.ts`, "o desenvolvedor vê todas as tabelas e as rodadas" e "o desenvolvedor pede a amostra de uma tabela que o papel não lê e recebe COPY_NOT_IN_ROLE" | must |
| 57 | U5 | A amostra de Carla de `sankhya_clientes` tem 5 linhas, pelo login do Financeiro; a de `sankhya_vendas` dá 404 `COPY_NOT_FOUND`, como uma que não existe | `member-data.test.ts`, "a amostra do membro vem pelo login do papel" | must |
| 59 | U5 | `getCompany` dá `may` sem a chave `readCopyRows` para os quatro papéis; na tela, a aba Amostra aparece para o desenvolvedor e, com a recusa `COPY_NOT_IN_ROLE`, mostra a frase do critério 56; `git grep -n readCopyRows -- apps packages` não mostra nada (conferência, sem teste) | `apps/server/src/hub/identity/developer.test.ts` (o caso de `:100-118`); `apps/web/src/hub/copies/copy-sample.test.tsx`, "o desenvolvedor vê a aba Amostra e a frase do Hub numa tabela fora do papel" (no lugar de "o desenvolvedor não vê a aba Amostra", `:54`); o `git grep` no ponto de conferência | must |
| 60 | U6 | O Financeiro aberto mostra, na seção Sankhya, "Dados copiados" e uma linha por tabela copiada do Sankhya, com o nome em mono e, abaixo, o que ela guarda; `sankhya_clientes` (fora do Financeiro) desmarcada e `sankhya_vendas` marcada. Recusa: nenhuma tabela de outro sistema aparece na seção Sankhya | `apps/web/src/hub/identity/roles.test.tsx`, caso "o papel Financeiro mostra Dados copiados no Sankhya com sankhya_clientes desmarcada" | must |
| 61 | U6 | Marcar `sankhya_clientes` e tocar **Salvar** manda, nesta ordem, `PATCH .../roles/financeiro` (`updateRole`) e `PUT .../roles/financeiro/copies` com o corpo exato `{ "copies": [<vendas>, <clientes>] }`, e volta à lista. Recusa: inverter os dois envios | `roles.test.tsx`, "marcar e salvar manda updateRole e depois setRoleCopies com a tabela" | must |
| 62 | U6 | Com `setRoleCopies` em 503 `COPY_DATABASE_UNAVAILABLE`, a tela fica no papel com a frase do Hub (`sentenceOf`) e a marca de `sankhya_clientes`; **Salvar** de novo manda os dois envios. Uma resposta perdida mostra "Não confirmamos a gravação. Veja a lista de papéis." | `roles.test.tsx`, "o banco calado ao salvar mostra a frase do Hub e mantém a marca" | must |
| 63 | U6 | Dono e Administrador mostram todas as tabelas marcadas e desabilitadas, sob a frase de hoje ("Dono e Administrador usam tudo…", `role-editor.tsx:130-134`), sem **Salvar**; nenhum envio sai. Recusa: nenhuma caixa muda ao clicar | `roles.test.tsx`, "Dono mostra todas as tabelas marcadas e nenhuma caixa que mude" | must |
| 64 | U6 | Um sistema do kit sem cópia na empresa mostra "Dados copiados" e "Nenhuma tabela copiada" | `roles.test.tsx`, "um sistema sem cópia diz Nenhuma tabela copiada" | must |
| 65 | U6 | Abaixo das seções dos sistemas, uma vez, em todo papel aberto (Dono e Administrador também): "Desmarcar uma tabela não tira a leitura ao vivo do sistema. Ela segue as operações marcadas acima." | `roles.test.tsx`, "o bloco diz que desmarcar não tira a leitura ao vivo" | must |
| 67 | U6 | Se `listCopies` ou `listCopyReaders` falha ao abrir Papéis, a página diz "Não deu para carregar os papéis." com **Tentar de novo**, que lê outra vez | `roles.test.tsx`, caso novo "as tabelas não carregam: Não deu para carregar os papéis. e Tentar de novo lê outra vez" | must |
| 68 | U6 | O papel aberto com o bloco, a 1366, 390 e 320 px e nos dois temas, não rola de lado, e cada caixa tem o contorno no Tab | `apps/web/sweep.test.ts`, estado novo "Papéis, o Financeiro com Dados copiados" de `sweep-roles-states.ts` | must |
| 69 | U6 | `apps/web/src/hub/identity/` não importa nada de `hub/copies/`: as tabelas chegam por propriedade da rota, como o kit (`settings/roles.tsx:58-62`) | conferência, sem teste: o ponto de conferência: `git grep -n "copies/" -- apps/web/src/hub/identity` sem resultado | should |
| 70 | U7 | O membro (Vendas) vê **Dados** no trilho; a página lista só as tabelas que o Hub devolve, agrupadas pelos sistemas delas, com a linha "Você vê as tabelas que o papel Vendas lê."; sem **Ligar uma cópia**, propostas nem o menu da linha. Recusa: nenhum botão **Rodar agora**, **Pausar** ou **Intervalo** na página | `apps/web/src/hub/copies/copy-list.test.tsx`, "o membro vê Dados no trilho e só as tabelas do papel, sem Ligar e sem menu" (no lugar de `:22-27`) | must |
| 71 | U7 | O membro no endereço de uma tabela fora do papel vê a página de não encontrado de um id que não existe (o Hub responde 404 `COPY_NOT_FOUND`; S10), sem o nome da tabela | `copy-list.test.tsx`, "o membro que abre uma tabela de outro papel vê a página de não encontrado" | must |
| 72 | U7 | Na página de uma tabela do papel, o membro vê as abas Visão geral, Colunas, Amostra, Rodadas e Quem lê, e não vê **Rodar agora** nem o menu **⋯** (decisão F); o desenvolvedor e o dono veem os dois | `apps/web/src/hub/copies/copy-detail.test.tsx`, "o membro na página da tabela não vê Rodar agora nem o menu" | must |
| 73 | U7 | Em Dados, o membro tem a árvore no lugar das conversas, com Bruto e só as tabelas do papel, sem o grupo nem a camada Apps (decisão F); com `?layer=apps` no endereço, a página mostra a camada Bruto | `apps/web/src/hub/copies/data-tree.test.tsx`, "a árvore: o membro em Dados vê só as tabelas do papel" (no lugar de `:50-55`) | must |
| 74 | U7 | O membro sem tabela no papel vê, na página e na árvore, "Seu papel ainda não lê nenhuma tabela. Peça a quem administra a empresa.", sem o link **Ligar um sistema** e sem "Nenhum sistema ligado ainda" | `copy-list.test.tsx`, "o membro sem tabela no papel" | must |
| 75 | U7 | A aba **Quem lê 3**, depois de Rodadas, mostra na ordem do Hub uma linha por papel com o nome, as pessoas e como lê: "Dono · 1 · sempre", "Administrador · 1 · sempre", "Financeiro · 2 · marcado em Papéis"; abaixo, "Quem lê esta tabela pela conversa e pelos agentes." | `apps/web/src/hub/copies/copy-readers.test.tsx` (novo), "a aba Quem lê lista Dono, Administrador e Financeiro com as pessoas" | must |
| 76 | U7 | Com `manageRoles` (dono, administrador), cada papel editável tem **Abrir em Papéis** para `/companies/<e>/settings/roles?role=<papel>`, e a frase ganha "Para mudar, abra o papel."; o desenvolvedor e o membro não veem link nem frase | `copy-readers.test.tsx`, "Abrir em Papéis aparece para o dono e não para o desenvolvedor" | must |
| 77 | U7 | Se `listCopyReaders` falha, a aba Quem lê mostra a frase do Hub com **Tentar de novo**, e o gatilho fica "Quem lê" sem número; as outras abas funcionam | `copy-readers.test.tsx`, "a leitura de quem lê falhou" | must |
| 78 | U7 | `?tab=readers` abre Quem lê, e trocar de aba põe o valor no endereço (W18) | `copy-readers.test.tsx`, "a aba Quem lê fica no endereço" | must |
| 81 | U7 | O desenvolvedor na Amostra de uma tabela fora do papel dele vê "Seu papel não lê esta tabela. Peça a quem administra a empresa.", sem **Tentar de novo** e sem grade | `apps/web/src/hub/copies/copy-sample.test.tsx`, "o desenvolvedor vê a recusa do papel na aba Amostra" | must |
| 82 | U7 | A aba Quem lê e a página Dados do membro, a 1366, 390 e 320 px e nos dois temas, não rolam de lado, e cada parada do Tab tem o contorno | `apps/web/sweep.test.ts`, estados novos "A tabela, quem lê" e "Dados, o membro" de `sweep-table-states.ts` | must |
| 83 | U7 | `copy-readers.test.tsx` está em `scripts/rerun-never.json` e a lista confere com os arquivos | `scripts/rerun-exempt.test.ts` | should |
| 84 | U8 | `data_describe` sem tabela, sobre o catálogo de um papel que não lê `clientes`, devolve um resultado sem `clientes` no texto e sem o rótulo da tabela em `tables` | `apps/server/src/builder/data-tools/tools.test.ts`, "data_describe sem tabela não nomeia a tabela que o papel não lê" | must |
| 85 | U8 | `data_describe({ table: 'clientes' })` sobre o mesmo catálogo lança `NOT_IN_CATALOG` com a mesma razão de `nao_existe` e não pede linha (`reached.rows` e `reached.query` vazios). Recusa: a ferramenta, para a tabela escondida | `tools.test.ts`, "data_describe com a tabela que o papel não lê devolve NOT_IN_CATALOG e não lê linha" | must |
| 86 | U8 | Na conversa de Bruno, a linha de `data_describe` com `sankhya_clientes` recusada diz "Essa tabela não está no catálogo.", e a linha, fechada e aberta, não contém `sankhya_clientes` (espera o G3 do cartão anterior) | `apps/web/src/builder/assistant/refusals.test.tsx`, "a tabela que o papel não lê mostra Essa tabela não está no catálogo." | must |
| 87 | U8 | `tools.test.ts` está em `scripts/rerun-never.json` e a lista confere com os arquivos | `scripts/rerun-exempt.test.ts` | should |
| 88 | U9 | Na página da tabela, à direita do título e antes de **Rodar agora**, o link **Perguntar ao Assistente**, também para o membro; tocá-lo abre o Início com "Sobre a tabela sankhya_vendas: " na caixa, sem `POST` de conversa | `apps/web/src/builder/assistant/ask-about-table.test.tsx` (novo), "Perguntar ao Assistente abre o Início com a tabela na caixa, sem enviar" | must |
| 89 | U9 | O rascunho que já estava na caixa fica: com "Oi" nela, o toque deixa "Oi" e, na linha seguinte, "Sobre a tabela sankhya_vendas: "; tocar duas vezes não repete a linha | `ask-about-table.test.tsx`, "o rascunho que já havia fica, e a linha não se repete" | must |
| 90 | U10 | Com o Sankhya falso recusando `consultar` (o envelope `status: "0"`, "Serviço recusado"), `copies.run` dá `{ kind: 'ERROR', code: 'COPY_SOURCE_REFUSED', system: { status: 200, code: '0', message: 'Serviço recusado' } }`, e a rodada em `copies.copy_run` tem `system_status = 200`, `system_code = '0'`, `system_message = 'Serviço recusado'` | `apps/server/src/hub/copies/run.test.ts`, `'a recusa guarda o que o sistema disse'` | must |
| 91 | U10 | Um `ERROR` sem resposta do sistema termina com `system: null` e as três colunas nulas: o sistema mudo (`switches.silent`, `COPY_SOURCE_UNREACHABLE`), o banco da empresa mudo (`COPY_DATABASE_UNAVAILABLE`) e o teto da leitura (`COPY_SOURCE_CEILING`); a rodada completa depois de uma recusada também | `run.test.ts`, `'sem resposta, sem mensagem'`, e os casos de hoje ajustados: `'o erro não vira vazio'` (`run.test.ts:200-216`), `'o teto da leitura'` (`run-v2.test.ts:155-158`), `'o banco da empresa cai ao preencher'` (`describe.test.ts:110-120`) | must |
| 92 | U10 | Uma mensagem de 1.500 caracteres com um NUL no meio fica com 1.000 e sem o NUL, e o check `copy_run_system_message` (`tables.ts:136-139`) aceita a linha; sem o corte, o check recusa e a rodada não fecha | `run.test.ts`, `'a mensagem longa é cortada'` | must |
| 93 | U10 | Uma resposta sem código nem mensagem (o corpo que nenhum esquema lê, `switches.malformed`) termina `COPY_SOURCE_UNREADABLE` com `system: null` (decisão G4.4) | `run.test.ts`, `'o erro não vira vazio'`, a asserção de `:207` com `system: null` | must |
| 94 | U10 | Depois da recusa, nenhuma linha do log do Hub leva o texto "Serviço recusado" (S41): `COPY_RUN_ENDED` segue com `outcome`, `reason` e as contagens. Recusa: gravar a mensagem no log | `run.test.ts`, `'a mensagem não vai ao log'` (em `tests` de `scripts/rerun-never.json`) | must |
| 100 | U11 | `GET .../copies/{id}/runs` devolve, na rodada recusada, `outcome: { kind: 'ERROR', code: 'COPY_SOURCE_REFUSED', system: { status: 200, code: '0', message: 'Serviço recusado' } }`, e numa rodada `ERROR` sem resposta do sistema, `system: null`; as outras rodadas não têm o campo | `apps/server/src/hub/copies/routes.test.ts`, `'as rodadas dizem o que o sistema disse'` | must |
| 101 | U11 | Na aba Rodadas, a rodada `ERROR` com `system: { status: 401, code: null, message: 'Sessão expirada' }` mostra "401 · Sessão expirada" embaixo da frase da falha, em `text-2`, na tabela do computador e na linha do celular | `apps/web/src/hub/copies/copy-detail.test.tsx`, `'as rodadas: o que o sistema disse aparece embaixo da frase'` e `'as rodadas: o que o sistema disse aparece na linha do celular'` | must |
| 102 | U11 | A mensagem vem antes do código: `{ status: 403, code: 'NO_ACCESS', message: 'Sem permissão' }` mostra "403 · Sem permissão" e não mostra "NO_ACCESS"; sem mensagem, `{ status: 200, code: '0', message: null }` mostra "200 · 0" | `copy-detail.test.tsx`, `'as rodadas: a mensagem do sistema vem antes do código'` | must |
| 103 | U11 | Uma rodada `ERROR` com `system: null` não mostra nada embaixo da frase | `copy-detail.test.tsx`, o caso de hoje `'as rodadas: cada uma em palavras, na aba Rodadas'` (`:15`), com `system: null` e a asserção de que a célula do erro tem só a frase | must |
| 110 | U12 | O modelo do Assistente recebe `copy_runs` (entrada `{ table: string }`) para a dona e para o membro; a lista exata das ferramentas da dona ganha só `copy_runs` | `apps/server/src/builder/assistant/assistant.test.ts`, o caso da lista exata (`:68-100`); `apps/server/src/builder/assistant/copy-runs.test.ts`, `'o membro também recebe copy_runs'` | must |
| 111 | U12 | Depois de uma rodada completa e uma recusada, `copy_runs` com `{ table: 'sankhya_vendas' }`, pela dona, dá `kind: 'RUNS'` com a cópia (`name`, os nomes das conexões, `schedule`, `interval`) e as rodadas, da mais nova à mais velha; a recusada tem `outcome: 'ERROR'`, `failure: { code: 'COPY_SOURCE_REFUSED', phrase: 'O sistema recusou a leitura.', action: 'Confira a conexão.' }`, `whole: false` e `system: { status: 200, code: '0', message: 'Serviço recusado' }`; a completa tem `failure: null` e `system: null`. Nenhum id de conexão no resultado | `copy-runs.test.ts`, `'a causa de uma cópia parada'` | must |
| 112 | U12 | Com sete rodadas, o resultado tem cinco, a mais nova primeiro | `copy-runs.test.ts`, `'cinco rodadas no máximo'` | must |
| 113 | U12 | Um papel que lê `sankhya_vendas` recebe as rodadas dela pela ferramenta | `copy-runs.test.ts`, `'quem lê a tabela pelo papel lê as rodadas'` | must |
| 114 | U12 | A pessoa de um papel sem `manageCopies` pede `sankhya_clientes` (fora do papel) e `nao_existe`: as duas dão o mesmo erro da ferramenta, `{ kind: 'NOT_FOUND', status: null, code: null, message: null, body: null, reason }`, byte a byte, sem nomear a tabela (S10). Recusa: a ferramenta `copy_runs` | `copy-runs.test.ts`, `'a tabela que o papel não lê responde como a que não existe'` (em `tests` de `scripts/rerun-never.json`) | must |
| 118 | U12 | O desenvolvedor, num papel que não lê `sankhya_clientes`, recebe pela ferramenta as rodadas dela (`kind: 'RUNS'`), como na aba Rodadas que ele administra; as linhas dela continuam recusadas (critério 56) | `copy-runs.test.ts`, `'o desenvolvedor lê as rodadas de toda cópia, como a lista'` | must |
| 115 | U12 | A dona pede `nao_existe` e recebe a mesma falha `NOT_FOUND` do critério 114 | `copy-runs.test.ts`, `'a tabela que não existe'` | must |
| 116 | U12 | Na conversa, a linha de `copy_runs` diz "Lendo as rodadas da cópia" enquanto roda, "Leu as rodadas da cópia" ao terminar e "Não conseguiu ler as rodadas" na falha, com o ícone `HistoryIcon` | `apps/web/src/builder/conversation/tool-row.test.tsx`, o caso de hoje `'cada ferramenta do conjunto fechado e do Assistente tem frase e abre no corpo da tabela'` (`:185`) e o caso novo `'copy_runs: as frases da linha e o ícone de histórico'` | must |
| 117 | U12 | A ferramenta não importa nada de `hub/copies`: `npm run deps` passa na regra `agents-and-apps-reach-data-only-through-the-contract` (`.dependency-cruiser.cjs:101-110`) sem pôr `assistant/copy-runs` a `CONTRACT_MIGRATION` (`:22-54`, "nothing joins the list") | `npm run deps`; `scripts/rules-doors.test.ts` passa sem mudança | must |

## A matriz de estados

Cada grupo traz as suas telas e os campos de contrato que cria.

### G1

O G1 não tem tela.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `copies.copy_reader` (linha por cópia e papel; já no `main`) | só `setRoleCopies` (U4); a cópia nova não ganha linha | `wantedOf` (U2); `copiesReadBy` (U3), `readersOf` e `listCopyReaders` (U4) |
| `copies.copy.readers_set` (já no `main`, sem leitor nem escritor) | ninguém: sai do esquema na U2 e do banco na U3 (data D6) | ninguém |
| `sync._readers_applied.ticket` e `sync.readers_ticket` (banco da empresa, do login `conexus_sync`) | `readersLedger` (U1, por `ensureSync` e `takeReadersTicket`), `reconcileOnce` (U1) | o bloco `DO` de `reconcileOnce` (U1) |
| Logins `conexus_role_<id>` e o `SELECT` deles | só `reconcileReaders` (U1) | `roleAddress` (U1); `readAs` (U3) |
| `ReadersAnswer` (`SqlAnswer` ou `{ kind: 'SUPERSEDED' }`) | `reconcileReaders` (U1) | `appliedOnce` e `reconciled` (U2) |
| `WantedReader` (`{ roleId, tables }`) | `wantedOf` (U2) | `reconcileReaders` (U1) |
| `CompanyRoleRow` (`{ id, role, label, members }`) | `companyRoleRows` (U2) | `wantedOf` (U2, `id`); `copiesReadBy`, `readerOf` (U3, `id`, `role`); `listedReaders` (U4, `label`, `members`) |
| `reconciled` → `'DONE' \| 'FAILED'` | `reconciled` (U2) | `ended` (U2); `readAs` (U3); `setRoleCopies` (U4) |

### G2

G2 não cria tela. Muda um estado da aba Amostra (`v10`), que passa a aparecer a quem abre a tabela; o estado final da recusa é do G3 (U7).

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Aba Amostra da tabela (desenvolvedor, depois da U5) | como hoje | "A cópia ainda não tem linhas." (de hoje) | `Skeleton` (de hoje) | `ReadFailure` com a frase do Hub e **Tentar de novo** (de hoje) | a de hoje | tabela fora do papel: `ReadFailure` com "Seu papel não lê esta tabela. Peça a quem administra a empresa."; o **Tentar de novo** fica até a U7 | sessão vencida: o de hoje da plataforma |

1280 px:

```
+-- Dados > Sankhya > sankhya_clientes ---------------+-- Detalhes ------+
| [Visão geral] [Colunas 9] [Amostra] [Rodadas]       | Sistema  Sankhya |
| +-------------------------------------------------+ | ...              |
| | Seu papel não lê esta tabela. Peça a quem       | |                  |
| | administra a empresa.        [Tentar de novo]   | |                  |
| +-------------------------------------------------+ |                  |
+-----------------------------------------------------+------------------+
```

390 px:

```
+-- sankhya_clientes ------------+
| [Visão] [Colunas] [Amostra] .. |
| Seu papel não lê esta tabela.  |
| Peça a quem administra a       |
| empresa.                       |
| [Tentar de novo]               |
| Detalhes ...                   |
+--------------------------------+
```

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `ReaderLogin` (`ALL`, `ROLE` com `roleId`, `NONE`), em `hub/copies/readers.ts` | `readerOf` (U3) | `readAs` (U3); `rowsOf`, `queryOf` (U3); `sampleOf` (U5) |
| `CopiesData.readers` (`copiesReadBy`, `readerOf`, `readAs`), em `service.ts` | U3 | `catalogOf`, `rowsOf`, `queryOf` (`hub/data`, U3) |
| `catalogTables` com `only: { copies }` | U3, `catalog-view.ts` | `catalogOf` (U3) |
| `TableRead` com `NOT_IN_ROLE` | `readCopyTable` (U3) | `rowsOf` (U3, vira `TABLE_UNAVAILABLE`); `sampleOf` (U5, vira `COPY_NOT_IN_ROLE`) |
| `CopyReaders` e `listCopyReaders` | U4, `packages/hub-api/src/copies.ts` | G3 (a aba Quem lê, U7; a tela Papéis, U6) |
| `setRoleCopies`, `ROLE_COPIES_MAX` | U4 | G3 (U6, **Salvar** da tela Papéis) |
| A ação `seeData` | U4, `admission.ts` | `listedReaders` (U4); `summaries`, `listed`, `runs`, `sampleOf` (U5); `copy_runs` (G4, U12) |
| `COPY_NOT_IN_ROLE` (`FailureRow`) | U5, `copy-failures.ts` | `sampleCopy` (U5); a aba Amostra por `sentenceOf` (U5; o estado final na U7) |
| `CompanyMay.readCopyRows` | sai (U5) | ninguém depois da U5 (`git grep`, critério 59) |

### G3

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Papéis, papel aberto (U6, `p4-01`) | a empresa sem cópia: cada seção diz "Dados copiados" e "Nenhuma tabela copiada" (64) | um sistema sem cópia: "Nenhuma tabela copiada" (64) | o carregador da rota (papéis, conexões, cópias e leitores), como hoje | as cópias ou os leitores não carregam: "Não deu para carregar os papéis." e **Tentar de novo** (67); `setRoleCopies` recusado: a frase do Hub, a marca fica (62) | `?role=` de um papel apagado: "Este papel não existe mais.", como hoje | desenvolvedor e membro: sem o item, e o endereço é não encontrado, como hoje (`settings/roles.tsx:33`); Dono e Administrador: tudo marcado, só leitura (63) | resposta perdida ao salvar: "Não confirmamos a gravação. Veja a lista de papéis." (62) |
| Dados, o membro (U7, `p1-11`) | o papel sem tabela: "Seu papel ainda não lê nenhuma tabela. Peça a quem administra a empresa." (74) | idem; a busca sem resposta: `NO_MATCH`, como hoje | o `Loading` do carregador, como hoje | o `DataReadFailure` com **Tentar de novo**, como hoje | — | o membro vê só as tabelas do papel, sem **Ligar uma cópia**, propostas nem menu (70); o desenvolvedor, como o dono | — |
| A árvore de Dados (U7) | o membro sem tabela: a frase curta "Seu papel ainda não lê nenhuma tabela." (74) | idem | três esqueletos, como hoje | `CATALOG_FAILED` com **Tentar de novo**, como hoje | — | o membro tem a árvore, com só as tabelas do papel (73) | — |
| Página da tabela, topo (U7, U9, `v10`) | sem rodada: a linha de hoje | — | o `Skeleton` de hoje | `ReadFailure`, como hoje | outra tabela do membro, ou um id inválido: `NotFound` com "Voltar ao início" (71) | o membro sem **Rodar agora** e sem menu, com **Perguntar ao Assistente** (72, 88) | rodada aberta, erro, pausada: como hoje |
| Aba Quem lê (U7, `p4-02`) | a cópia nova nasce com Dono e Administrador; os outros papéis entram quando marcados em Papéis (75) | não acontece: Dono e Administrador sempre leem | `Skeleton` na aba; o gatilho sem número (77) | a frase do Hub com **Tentar de novo** (77) | — | sem `manageRoles`: sem **Abrir em Papéis** e sem "Para mudar, abra o papel." (76) | — |
| Aba Amostra (U7) | — | "A cópia ainda não tem linhas.", como hoje | `Skeleton`, como hoje | `ReadFailure` com **Tentar de novo**, como hoje | — | o desenvolvedor fora do papel: "Seu papel não lê esta tabela. Peça a quem administra a empresa." sem **Tentar de novo** (81); o membro tem a aba (U5) | — |
| Linha de `data_describe` na conversa (U8, `p4-03` emendada) | — | — | "Vendo …", do cartão 1 | "Não conseguiu ler a tabela agora.", do cartão 1 | a tabela que o papel não lê: "Essa tabela não está no catálogo.", sem o nome dela (86) | idem | fora do esquema: a linha genérica, do cartão 1 |
| Início com o rascunho (U9) | a caixa vazia recebe "Sobre a tabela {nome}: " (88) | — | a caixa de hoje | a caixa de hoje | — | sem conta de modelo: o Início de hoje (`StartWithoutAccount`), com o rascunho guardado na aba | o envio recusado devolve o rascunho, como hoje (`draft.ts:70-73`) |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `listCopyReaders`, `readers[].copyId` e `readers[].roles[]` (`role`, `label`, `members`) | o Hub (U4) | `tablesOf` da rota Papéis (U6: as marcas); a aba Quem lê, o gatilho e "Você vê as tabelas que o papel {papel} lê." (U7) |
| `setRoleCopies`, corpo `copies` (a lista inteira das cópias que o papel lê) | o **Salvar** do papel aberto (U6) | o Hub (U4) |
| `setRoleCopies`, resposta `copies` | o Hub (U4) | a tela Papéis (U6): as caixas voltam ao conjunto gravado que a resposta traz; a invalidação de `copyReadersQuery` relê o resto (W12) |
| `COPY_NOT_IN_ROLE`, a falha da amostra fora do papel (decisão G2.2) | `sampleCopy` (U5) | `CopySample` (U7) |
| O `tab` do endereço, agora com `readers` | o `onValueChange` das abas (`copy-detail.tsx:217-225`) | `TableSearch` (`search.ts:16-20`), `CopyDetail` |
| O rascunho `start:<empresa>` (`draft.ts:11`) | o link **Perguntar ao Assistente** (U9), por `append` | a caixa do Início (`home.tsx:129-131`) |

**Papéis, papel aberto, a 1280 px** (o índice de Configurações à esquerda; `p4-01`):

```
┌ ← Voltar ────┬────────────────────────────────────────────────────────┐
│ [⌕ Buscar…]  │ ← Papéis                                                │
│ Você …       │ Financeiro                                              │
│ Lume …       │ ┌ [l] Sankhya ─────────────────────────────────────┐   │
│ ▌Papéis      │ │ [ ] Cadastros  2 de 6                  Detalhe   │   │
│              │ │ [x] Financeiro 3 de 3                  Detalhe   │   │
│              │ │ Dados copiados                                    │   │
│              │ │ [x] sankhya_vendas                                │   │
│              │ │     Pedidos e notas de venda, um por linha…       │   │
│              │ │ [ ] sankhya_clientes                              │   │
│              │ │     Cadastro de clientes e parceiros.             │   │
│              │ └───────────────────────────────────────────────────┘   │
│              │ ┌ [l] Mercado Livre  Não usa ───────────────────────┐   │
│              │ │ Dados copiados                                    │   │
│              │ │ Nenhuma tabela copiada                            │   │
│              │ └───────────────────────────────────────────────────┘   │
│              │ Desmarcar uma tabela não tira a leitura ao vivo do      │
│              │ sistema. Ela segue as operações marcadas acima.         │
│              │ [Salvar]                                [Apagar papel]  │
└──────────────┴────────────────────────────────────────────────────────┘
```

**A 390 px** (a página na largura toda, como hoje):

```
┌──────────────────────────────┐
│ ← Papéis                     │
│ Financeiro                   │
│ ┌ [l] Sankhya ─────────────┐ │
│ │ [x] Financeiro 3 de 3 [D]│ │
│ │ Dados copiados           │ │
│ │ [x] sankhya_vendas       │ │
│ │     Pedidos e notas…     │ │
│ │ [ ] sankhya_clientes     │ │
│ │     Cadastro de clien…   │ │
│ └──────────────────────────┘ │
│ Desmarcar uma tabela não     │
│ tira a leitura ao vivo…      │
│ [Salvar]                     │
└──────────────────────────────┘
```

**A página da tabela, aba Quem lê, a 1280 px** (`v10` com o que esta etapa traz, e a aba de `p4-02`):

```
┌──┬──────────────┬──────────────────────────────────────────────┬──────────────┐
│▣ │[⌕ Buscar …  ]│ Dados › Sankhya › sankhya_clientes                          │
│⌂ │ Negócio    0 │ [l] sankhya_clientes ● Em dia                               │
│▤ │ Bruto      5 │        [Perguntar ao Assistente] [↻ Rodar agora] [⋯]        │
│⏚ │ ▾ Sankhya  5 │ Copiada do Sankhya em 14/11, 08:44 · 1.312 linhas           │
│◷ │ ▌clientes …  │ Visão geral │ Colunas 22 │ Amostra │ Rodadas │ Quem lê 4     │
│▦◀│  vendas …    ├──────────────────────────────────────────────┬──────────────┤
│  │ Apps         │ Papel          Pessoas  Como lê               │ Detalhes     │
│  │              │ Dono                 1  sempre                │ Sistema      │
│  │              │ Administrador        1  sempre                │ Frequência   │
│  │              │ Financeiro           2  marcado em Papéis  [Abrir em Papéis] │
│  │              │ Vendas               4  marcado em Papéis  [Abrir em Papéis] │
│  │              │ Quem lê esta tabela pela conversa e pelos     │ Linhas       │
│  │              │ agentes. Para mudar, abra o papel.            │              │
└──┴──────────────┴──────────────────────────────────────────────┴──────────────┘
```

**A 390 px** (o rail e a árvore na gaveta, V56; a lista em linhas; o painel abaixo):

```
┌──────────────────────────────┐
│ [☰] Lume Acabamentos         │
├──────────────────────────────┤
│ Dados › Sankhya › sankhya_…  │
│ [l] sankhya_clientes         │
│ ● Em dia                     │
│ [Perguntar ao Assistente]    │
│ [↻ Rodar agora] [⋯]          │
│ Copiada do Sankhya em …      │
│ Visão geral│Colunas 22│Amos… │
│ Rodadas│Quem lê 4            │
│ Financeiro                   │
│ 2 pessoas · marcado em Papéis│
│ [Abrir em Papéis]            │
│ …                            │
│ Detalhes …                   │
└──────────────────────────────┘
```

**A página Dados do membro, a 1280 px** (`p1-11`, sobre a árvore do explorador; o membro de hoje não tinha esta tela):

```
┌──┬──────────────┬──────────────────────────────────────────────────────────┐
│▣ │[⌕ Buscar …  ]│ Dados                                                    │
│⌂ │ Negócio    0 │ O que os agentes e os apps da empresa podem ler…         │
│▤ │ Bruto      4 │ Você vê as tabelas que o papel Vendas lê.                │
│⏚ │ ▾ Sankhya  4 │ ─ [l] Sankhya · Matriz · 4 tabelas ───────────────────── │
│◷ │  vendas …    │ sankhya_vendas      ● Em dia hoje, 08:45   2.184  30 min │
│▦◀│  …           │ …                   (sem ⋯ na linha)                     │
│  │              │ ─ [l] Mercado Livre · Loja oficial · 1 tabela ────────── │
└──┴──────────────┴──────────────────────────────────────────────────────────┘
```

**A 390 px:** o título, a frase, a linha do papel, as tabelas em linhas (`CopyPhoneRow` sem o menu) e a árvore na gaveta.

As telas que seguem: `p4-01`, `p4-02`, `p1-11` do escopo aprovado e a `v10` da proposta aprovada. Ficam
fora: a aba Leituras de `p4-02` (o Registro de dados é da etapa
seguinte), a aba Qualidade, Conceito e Descrições da `v10` (etapas seguintes; W31). Não há produto
antigo para estas telas. Os protótipos e as capturas ficam fora do repositório (L21).

### G4

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Aba Rodadas, a linha da rodada (U11) | sem mudança: `NO_RUNS_YET` | sem mudança | sem mudança | sem mudança (a falha da leitura das rodadas) | sem mudança | sem mudança (a admissão de `listCopyRuns`, `seeData` pela U5) | a rodada que o sistema recusou mostra a frase da falha e, embaixo, "{status} · {mensagem}" (critérios 101 a 103) |
| Conversa, a linha de `copy_runs` (U12) | — | — | "Lendo as rodadas da cópia" | "Não conseguiu ler as rodadas" (o erro da ferramenta, como em `data_query`) | "Não conseguiu ler as rodadas" (a tabela inexistente ou fora do papel, critério 114) | a mesma linha do não encontrado (S10) | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `CopySystemMessage` (`packages/hub-api/src/copies.ts`) | `systemOf` (U10) | `CopyRead`, `CopyOutcome` (U10); `CopyRun` (U11); `copy_runs` (U12) |
| `CopyRead` `FAILED.system` (`copy-port.ts`) | `refusedRead` e os três `FAILED` de `copy-port.ts:280-298` (U10) | `stepOf` em `source-pass.ts:166-172` (U10) |
| `CopyOutcome` `ERROR.system` (`store.ts:78-83`) | `stepOf`, `DATABASE_DOWN` (U10) | `ended` (U10) |
| `copies.copy_run.system_status`, `system_code`, `system_message` | `ended` (U10) | `runOf` (U11) |
| `CopyRun.outcome` `ERROR.system` | `runOf` (U11) | `RunRow` e `RunPhoneRow` (U11); `copy_runs` (U12); o contrato de dados em `kept.lastRun` (`packages/hub-api/src/company-data.ts:40`), de que `data_describe` lê só o `kind` (`apps/server/src/builder/data-tools/tools.ts:105`) |
| Resultado de `copy_runs` (`RUNS`, as rodadas) | `copyRunsTool` (U12) | o modelo; a linha da conversa abre no resultado (`body: 'generic'`) |
| Falha `NOT_FOUND` de `copy_runs` | `copyRunsTool` (U12) | o modelo; a linha lê a falha como as de `data_query` |

A linha da rodada, a 1280 px, segue a captura `b1-rodadas-sistema` da spec da passada; a decisão E fixa o lugar:

```
┌ Rodadas ─────────────────────────────────────────────────────────────────┐
│ Início        Duração   Lidas   Gravadas   Resultado                      │
│ 02/11 10:00   42 s      500     500        O sistema recusou a leitura.   │
│                                            200 · Serviço recusado (text-2)│
│ 02/11 09:30   40 s      1.204   1.204      Completa                       │
└──────────────────────────────────────────────────────────────────────────┘
```

A 390 px:

```
┌─────────────────────────────────┐
│ 02/11 10:00 · 42 s              │
│ 500 lidas · 500 gravadas ·      │ text-2
│ O sistema recusou a leitura.    │
│ 200 · Serviço recusado          │ text-2
└─────────────────────────────────┘
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `DELETE .../roles/{role}` (já existe), que agora apaga as marcas de `copy_reader` por cascata (U2) | A segunda remoção responde como hoje, papel não encontrado | Uma transação do Hub: o papel e as marcas saem juntos ou ficam | Banco da empresa calado: o login do papel sobra sem marca; a rodada seguinte ou a próxima mudança de papéis o derruba (`reconciled`) | `COPY_READERS_FAILED` no log, sem nome de tabela | 21 |
| `takeReadersTicket` (U1, `nextval` como `conexus_sync`) | `ROLES_LOCK` as enfileira; cada uma tem o seu bilhete | Uma transação: nada fica; um número gasto não pesa (só a ordem importa) | Banco da empresa calado: `NO_ANSWER`; o livro faltando (`42P01`): a mesma chamada com `readersLedger()` antes, uma vez | `reconciled` loga `COPY_READERS_FAILED` com o `code` | 9, 11, 26 |
| `reconcileReaders` (U1, uma chamada, uma transação) | `ROLES_LOCK` primeiro; a de bilhete menor ou igual ao do livro volta `SUPERSEDED`; `42710`, `XX000`, `23505`, `42P07` e `42P01` ganham uma nova tentativa só | `CXR01` ou qualquer erro desfaz a transação inteira, `DROP ROLE` incluídos | Banco da empresa calado: `NO_ANSWER` ou `TIMEOUT` pelo `budget()` (code C57) | o chamador loga | 2, 4, 9, 12, 13 |
| `ensureSync` com o livro (U1) | `ROLES_LOCK` (já hoje); `IF NOT EXISTS` e `ON CONFLICT DO NOTHING` | Uma transação: o esquema e o livro nascem juntos ou não nascem | Como hoje: `COPY_DATABASE_FAILED` no chamador | o de hoje | 11 |
| `grantCopy` e `revokeCopy` com `ROLES_LOCK` (U1) | Em fila com as reconciliações; sem `XX000` | Como hoje | Como hoje | o de hoje | 12 |
| `reconciled` no fim da rodada (U2, em `ended`, depois de `COPY_RUN_ENDED`) | Duas rodadas da empresa: pelo bilhete | O lease já foi solto em `ended` (`claimToken: null`) | O resultado da rodada não muda | `COPY_READERS_FAILED`; `COPY_READERS_SUPERSEDED` quando um bilhete maior já aplicou (U2) | 17, 22, 23, 26 |
| A migração que apaga `readers_set` e o seu `GRANT` (U3) | o `migrate` de hoje roda uma vez, antes do Hub (data D9) | uma transação: a coluna sai ou fica | banco do Hub fora: o programa não sobe, como hoje | o de hoje | conferência: `npm run migrations -- --base origin/main` no ponto do G2 |
| `roleLogin` com nome longo demais (U1, chamado por `reconcileReaders`) | — | Lança antes de qualquer instrução | — | `COPY_READER_NAME` no `appliedOnce` | 7, 27 |
| `setRoleCopies` (U4): a transação do Hub, depois `reconciled` | `lockCompany` (como `apps/server/src/hub/projects/projects.ts:151`) serializa as transações do Hub; cada uma reconcilia depois do commit, e o bilhete ordena (U1). Repetir o pedido responde 200 sem mudar nada | antes do commit, nenhuma marca muda; depois, `reconciled` `FAILED`: ao tirar, a reposição e 503; ao dar, 200 pendente | Hub fora: 503 `DATABASE_UNAVAILABLE` antes de mudar; banco da empresa ou Neon fora: `reconciled` `FAILED` (U2) e as linhas acima; a reposição fora: 503 e o pendente | `COPY_READERS_SET` (info, `companyId`, `role`, `by`, `added`, `removed`); `COPY_READERS_FAILED` (error); `COPY_READERS_PENDING` (info ao dar, error quando a reposição falha, com `companyId` e `role`) | 43 a 49, 53 |
| `listCopyReaders` (U4, só leitura) | duas leituras independentes | nada a desfazer | Hub fora: 503 `DATABASE_UNAVAILABLE` | nada novo | 52 |
| O conserto de `readAs` (U3): `reconciled` e uma nova tentativa em `queryOf`, `rowsOf` e `sampleOf` | duas recusas pedem duas reconciliações; o bilhete as ordena (U1) | `reconciled` `FAILED`: volta a resposta da primeira leitura (`42501` vira `NOT_IN_ROLE`; `NO_LOGIN` vira `TABLE_UNAVAILABLE`) | banco da empresa fora: `UNAVAILABLE` já na primeira leitura, sem conserto | `COPY_READERS_REPAIRED` (info, `companyId`, `personId`); `DATA_READ_REFUSED` (info, `companyId`, `personId`, sem a consulta); `COPY_READER_MADE` (o conserto do `conexus_read`, de hoje) | 33, 35, 42 |
| `sampleCopy` (U5, só leitura) | independentes | o sinal da chamada corta, como hoje | banco da empresa fora: 503 `COPY_DATABASE_UNAVAILABLE` com `COPY_SAMPLE_FAILED`, como hoje | nada novo | 56, 57 |
| **Salvar** do papel aberto: `updateRole` e depois `setRoleCopies` (U6; a rota é da U4) | o botão pendente no envio (`SubmitButton`); em duas abas, o último `PUT` vence (troca a lista inteira) | `updateRole` gravou e `setRoleCopies` foi recusado: a tela fica no papel com a frase do Hub e as marcas, e **Salvar** de novo manda os dois | banco da empresa calado: 503 `COPY_DATABASE_UNAVAILABLE` e a frase do Hub; Hub sem resposta: "Não confirmamos a gravação. Veja a lista de papéis." | a tela nada; o Hub, `COPY_READERS_FAILED` ou `COPY_READERS_PENDING` (U4) | 61, 62 |
| **Perguntar ao Assistente** (U9): escreve o rascunho `start:<empresa>` da aba | dois toques: `append` não repete a linha (`draft.ts:55-59`) | — (nenhuma chamada ao Hub) | sem `sessionStorage`, o rascunho fica no `Map` da página (`draft.ts:6-7`) e a caixa abre com ele | nada | 88, 89 |
| `ended` com as três colunas `system_*` no mesmo `.set` (U10) | Só quem segura a concessão grava (`held(claimed)`, `run.ts:120`); a outra sai por `lost`, como hoje | O check `copy_run_system_message` recusaria uma mensagem acima de 1.000 caracteres e a transação voltaria; o corte em `systemOf` impede (critério 92); o check `copy_run_system` só aceita as colunas num `ERROR`, e só nele `systemColumnsOf` as preenche | Hub fora: a falha de hoje em `deps.database.command` | `COPY_RUN_ENDED` com o código e as contagens, nunca a mensagem; `COPY_CLAIM_LOST` como hoje | 90, 91, 92, 94 |
| A chamada `copy_runs` (U12), só leitura | independentes; nenhuma grava | A cópia que some entre `list` e `runs` (`COPY_NOT_FOUND`, `list.ts:205`) vira o mesmo `NOT_FOUND` | O banco do Hub fora: a `Failure('DATABASE_UNAVAILABLE')` de `deps.database.read` sobe como erro da ferramenta (code C79) | nada novo | 111, 114, 115 |

## A tabela de referência

Uma linha por peça do roteiro de uso. "Como as referências fazem" diz o que fazem a plataforma de
ingestão, a de catálogo e a de operações, sem nomeá-las; a citação literal fica no relatório do
firstmate, fora do repositório (L21), pela peça entre parênteses (P1 a P14, `E1` a `E5`). Onde a peça
destoa das referências ou não tem referência, a coluna Decisão nomeia a decisão do fundador (letras A a
F da página) ou a tela aprovada que a traz (L28).

| Peça | Unidade | Hoje no main | Como as referências fazem | Veredito | Prova, se não for nativo | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O banco garante: a leitura com a permissão de quem pergunta, recusada pelo motor | U1 | `grantCopy` por Projeto, `apps/server/src/platform/copy-sql.ts:354-368`; `ensureReader` de `conexus_read`, `apps/server/src/platform/copy-reader.ts:21-53` | As duas restringem pelo controle de acesso, com a identidade de quem pergunta, não pela leitura do SQL (`E1`; documentado) | nativo (papéis e `GRANT` do PostgreSQL; a prova da spec foi rodada no Postgres 18) | — | Um login por papel, sem `SET ROLE` (o papel assumido na consulta vaza; spec da parte 4, `C2`); a referência mais próxima é um papel do PostgreSQL por pessoa (`E1`, parcial) | `copy-role-readers.test.ts` |
| O bilhete, o livro e a aplicação que abandona a mais velha | U1, U2 | nenhum | Sem referência: nenhuma mantém dois bancos de acordo (`E2`) | embrulhado: sequência, trava consultiva e bloco `DO` do PostgreSQL | os critérios da U1, U2 | ideia nossa, da spec da parte 4 (`C2`, "Uma ordem só: o Hub primeiro, sempre"); sem tela | nenhum |
| A trava das permissões de `sync` | U1 | `ROLES_LOCK`, `copy-sql.ts:113-118`, em `ensureSync` (`:133`) e `ensureReader` (`copy-reader.ts:30`) | Sem referência; o PostgreSQL recusa dois `ALTER ROLE` ou `GRANT` simultâneos no mesmo objeto com `XX000` (`copy-sql.ts:113-117`) | nativo (`pg_advisory_xact_lock`) | — | decisão G1.1 | nenhum |
| Dono e administrador leem tudo | U2 | `conexus_read`, `copy-reader.ts:21-53`; `readRoles` monta os dois de `set.allOperations`, `apps/server/src/hub/identity/company-roles.ts:104-110` | O administrador passa por cima de toda permissão de recurso (P1; documentado) | nativo | — | igual | nenhum |
| A cópia nova nasce lida só por Dono e Administrador | U2 | nenhuma linha em `copy_reader` ao ligar nem ao aceitar (`insertedCopy`, `apps/server/src/hub/copies/accept.ts:61-90`); `conexus_read` lê toda tabela nova de `sync` por `ALTER DEFAULT PRIVILEGES` (`apps/server/src/platform/copy-reader.ts:41-45`) | A cópia nasce lida por quem é dono da tabela e quem administra; os outros recebem concessão (a plataforma de catálogo, por documentação) | nativo (nada a gravar) | — | (b2), do fundador em 2026-11-16, que substitui a N3b-1 | `readers.ts`, `readers.test.ts` |
| A porta da identidade (`companyRoleRows`) | U2 | `readRoles`, `company-roles.ts:82-129` | Sem referência (`organization_role`, a linha da biblioteca) | nativo (a linha da biblioteca, lida como em `readRoles`) | — | decisão G1.9 (a marca `RoleId`) | `role-rows.ts` |
| O fim da rodada conserta o que ficou pendente | U2 | `ended`, `apps/server/src/hub/copies/run.ts:105-153` | Sem referência (`E2`) | embrulhado | os critérios da U2 | ideia nossa, da spec da parte 4 (`C2`, "Quem conserta o que ficou pendente"); prazo: o intervalo da cópia, `COPY_INTERVAL_DEFAULT` `'30m'` (`packages/hub-api/src/copies.ts:22`) | nenhum |
| O catálogo mostra só o que o papel lê | U3 | `catalogOf`, `apps/server/src/hub/data/catalog.ts:17-22` (todas para quem tem `readCopyRows`, nenhuma para os outros) | A listagem do servidor de agente devolve só as tabelas acessíveis; o esquema de informação filtra pelo privilégio de quem lê (P2; documentado) | nativo (o `GRANT` do PostgreSQL decide; o catálogo do Hub o espelha, critério 30) | — | esconder, palavra do fundador ("tem que esconder", 2026-11-15) | `apps/server/src/hub/data/catalog-role.test.ts` |
| O nome pedido responde como inexistente | U3 | `sourceOf`, `packages/hub-api/src/company-data.ts:251-263` (`NOT_IN_CATALOG`) | Revogada, a tabela sai da listagem e da descrição; a prévia dá erro (P3 (iii); documentado) | nativo | — | sem mudança no contrato (G1 do cartão 1) | nenhum |
| A consulta recusada pelo banco | U3 | `pageOf`, `apps/server/src/hub/data/query.ts:101-109` (`42501` vira `NOT_IN_ROLE`) | A consulta a uma tabela inacessível dá erro do controle de acesso do banco (P3 (iv); documentado) | nativo (o `42501` do PostgreSQL) | — | — | nenhum |
| Ler com o login do papel de quem pergunta | U3 | `readCopyTable`, `apps/server/src/hub/copies/read-table.ts:72-91`, e `readAs` local, `query.ts:57-82`, sempre `conexus_read` no lugar Empresa | Como na primeira linha (`E1`; documentado) | nativo (um login PostgreSQL por papel, U1) | — | o único lugar que escolhe o endereço passa a ser `readAs` de `hub/copies/readers.ts` | nenhum |
| O conserto em `42501` e `NO_LOGIN` | U3 | o conserto de `NO_LOGIN` do `conexus_read`, `readAfterLogin`, `read-table.ts:21-41`, e `query.ts:68-81` | Sem referência (`E2`) | embrulhado (o `42501` do PostgreSQL, com uma nova tentativa depois de `reconciled`) | os critérios da U3 | parte 4, `C2` "O conserto" | nenhum |
| Os nomes de `sync` em `pg_class` | U3 | nenhuma sonda; `query.test.ts:109` já mostra que o catálogo do sistema não conta como tabela lida | O esquema de informação filtra; o catálogo do PostgreSQL não está provado (`E1`, lacuna) | nativo (o PostgreSQL como é) | — | decisão D; a U3 registra a sonda (critério 40) | nenhum |
| No Projeto, pela liberação do Projeto | U3 | `query.ts:63-66` (`readAddress` do Projeto) | O app de uma referência tem acesso próprio que todos usam; o agente de dados de outra cruza com a permissão de quem pergunta (P11) | nativo | — | decisão do fundador (P1, opção a); a regra por papel do agente salvo é da parte 7 | nenhum |
| `listCopyReaders`, a lista de quem lê | U4 | nenhuma; a contagem por papel em `readRoles`, `apps/server/src/hub/identity/company-roles.ts:94-99` | A página da tabela tem a aba de permissões; uma mostra a quem não é dono só as próprias concessões (P4; documentado) | nativo (uma leitura do Hub) | — | só mostra (decisão B); a contagem é ideia nossa, na letra escolhida (`B1`) e na tela aprovada `p4-02` | `apps/server/src/hub/copies/readers-routes.test.ts` |
| `setRoleCopies`, a permissão por tabela dada a um papel | U4 | nenhuma; `updateRole`, `packages/hub-api/src/company-roles.ts:83-100` | Permissão por tabela a pessoa ou grupo; dono e administrador passam por cima e não são marcáveis (P1 e P5; documentado) | nativo (`copy_reader` e o `GRANT`, U1 e U2) | — | só a papel, como a parte 4 (N3b) | nenhum |
| O Hub primeiro, a reposição e o 503 | U4 | `grantCopy` do Hub, `apps/server/src/hub/copies/grants.ts:74-101` (a linha e depois o banco) | Sem referência (`E2`) | embrulhado | os critérios da U4 | parte 4, `C2` "Uma ordem só" | nenhum |
| A vez de quem muda os papéis | U4 | `admitted`, `company-roles.ts:173-181`, e `enterCreation`, `projects.ts:150-151` (`lockCompany` antes da admissão) | Sem referência | nativo (`pg_advisory_xact_lock` pela trava da empresa, code C65) | — | decisão G2.4 | nenhum |
| O membro vê Dados só com as tabelas do papel e as rodadas delas | U5 | `summaries`, `listed`, `runs`, `apps/server/src/hub/copies/list.ts:129-228`, só com `readCopies` | Quem lê vê as tabelas com acesso e as rodadas; ver um pipeline pede leitura nas tabelas dele; acrescentar fontes é só de quem edita (P14; documentado) | nativo | — | — | `apps/server/src/hub/copies/member-data.test.ts` |
| O endereço direto de uma tabela que o papel não lê | U5 | `runs` responde `COPY_NOT_FOUND` só à cópia que não existe (`list.ts:205`) | Na API, um recurso fora do alcance responde como não encontrado; outras oferecem pedir acesso no link direto (P3 (ii)) | nativo (S10) | — | "não encontrado" (decisão A) | nenhum |
| A amostra do desenvolvedor numa tabela fora do papel | U5 | `sampleOf`, `apps/server/src/hub/copies/sample.ts:10-40` (`readCopyRows`) | Uma recomenda deixar todos verem o objeto e pedirem acesso, sem ler as linhas (P2; documentado) | nativo (o `42501` vira a recusa com frase) | — | código novo `COPY_NOT_IN_ROLE` (decisão G2.2); o texto é o do escopo (requisito 4.10) | nenhum |
| `CompanyMay` sem `readCopyRows` | U5 | `packages/hub-api/src/roles.ts:52`, `apps/server/src/hub/identity/companies.ts:103` | Sem referência | nativo (code C26: a tela lê o que a rota admite) | — | a mudança do contrato das telas vai no corpo do PR (parte 1, decisão `L6`) | nenhum |
| As tabelas marcáveis dentro do papel | U6 | `OpenRole`, `apps/web/src/hub/identity/role-editor.tsx:117-161`; `ConnectorPicker`, `role-picker.tsx:104-131`; o kit chega por propriedade, `settings/roles.tsx:58-62` | A plataforma de ingestão marca as tabelas numa página por pessoa e por grupo, em árvore por camada e pasta, sem dono e administrador (leem tudo); a de catálogo não tem a tela (P5) | nativo (as peças de `apps/web/src/ui/`: `Checkbox`, `ui/checkbox.tsx:8`) | — | dentro do papel, por sistema, sem nível; Dono e Administrador só leem (tela `p4-01`) | `apps/web/src/hub/identity/role-tables.tsx` |
| Desmarcar não tira a leitura ao vivo | U6 | `sourceOf`, `packages/hub-api/src/company-data.ts:264-265`: a leitura que nenhuma tabela do catálogo guarda cai na leitura ao vivo | As duas separam a permissão da tabela da permissão da conexão ao vivo; nenhuma escreve a frase na tela (P12) | nativo | — | a frase é nossa, pedida pelo requisito 4.13 da spec aprovada, uma vez abaixo dos sistemas (decisão G3.7) | — |
| A aba Quem lê | U7 | a página da tabela, `copy-detail.tsx:214-255`; `TableTab`, `search.ts:12` | As duas têm a aba, editável, na página da tabela; uma mostra só o dado direto, a outra a lista inteira só a quem administra o objeto; nenhuma conta pessoas (P4) | nativo (`Tabs`, `Table`, `List` de `apps/web/src/ui/`) | — | só mostra, com **Abrir em Papéis** a quem muda papéis (decisão B, decisão G3.5); a contagem e "Como lê" são ideia nossa, na letra escolhida (`B1`) e na tela aprovada `p4-02` | `apps/web/src/hub/copies/copy-readers.tsx` |
| O membro vê Dados com as tabelas do papel | U7 | o item do trilho sob `may.manageCopies`, `route.tsx:88-95`; `manageCopiesOrNotFound`, `hub/copies/public.ts:24-27`, usado em `data.index.tsx:16` e `data.$copyId.tsx:15` | Como na linha da U5 (P14) | nativo | — | sem **Ligar**, propostas, **Rodar agora** e menu (tela `p1-11`; spec parte 4, 7.2) | — |
| A árvore de Dados para o membro | U7 | `inData && may.manageCopies`, `route.tsx:141` | sem referência; a árvore troca as conversas em Dados (W30, fundador, 2026-11-15) | nativo (`DataTree` de hoje) | — | todo membro em Dados tem a árvore, com a lista filtrada pelo Hub | — |
| O endereço de uma tabela que o papel não lê | U7 | o carregador já transforma 404 em não encontrado (`readOrNotFound`, `apps/web/src/platform/hub.ts:273-280`) | Como na linha do endereço direto da U5 (P3) | nativo | — | "não encontrado" (decisão A; S10) | — |
| A recusa da amostra ao desenvolvedor | U7 | `CopySample`, `copy-sample.tsx:29-31` (`ReadFailure` com **Tentar de novo**) | O motor recusa e a ferramenta devolve o erro (P3, item (iv)) | nativo (uma linha de `COPY_FAILURES`, code C26) | — | a frase do código da U5, sem **Tentar de novo** (decisão G3.4) | — |
| A tabela escondida na conversa | U8 | `tabled`, `apps/server/src/builder/data-tools/tools.ts:145-150`; o contrato, `company-data.ts:251-254` | Como nas linhas do catálogo e do nome pedido da U3 (P3 (iii), E5) | nativo | — | nenhum código muda (emenda (d)) | — |
| Perguntar ao Assistente | U9 | o rascunho do Início, `useDraft('start:<empresa>')`, `apps/web/src/builder/assistant/home.tsx:129-131`, `builder/conversation/draft.ts:38-75`; nenhum botão na página da tabela | Uma abre o assistente ao lado da tabela, com a tabela como etiqueta e o campo vazio; a outra leva ao editor de consultas, onde um assistente ajuda; `@mastra/core@1.82.0` não tem parâmetro de mensagem pronta (P10) | nativo (o rascunho de hoje e um `Link`) | — | um link que abre o Início com "Sobre a tabela {nome}: " na caixa, sem enviar (decisão C); o botão chega à página pela rota (decisão G3.1) | `apps/web/src/builder/assistant/ask-about-table.tsx` |
| Guardar o que o sistema disse na rodada | U10 | perdido: `refusedRead` devolve só o código (`apps/server/src/hub/connectors/copy-port.ts:178-182`); o `native` da recusa (`packages/connectors/src/kernel/operation.ts:39-56`; no leitor, `apps/server/src/hub/connectors/read.ts:41-45`) é descartado; as colunas e as permissões já existem (`tables.ts:116-119`, `database-grants.sql:419-421`) | a plataforma de ingestão guarda uma mensagem de erro por fluxo de cada execução e a mostra no detalhe dela (P8, E3); na de catálogo falta a prova (P8, achado) | embrulhado (o `native` que o kit já entrega, limpo e cortado) | os critérios da U10 | o que se guarda é a decisão do fundador da passada (requisito 3); sem código nem mensagem não se guarda nada (decisão G4.4) | — |
| A limpeza e o corte de 1.000 | U10 | `storable` privada e recursiva em `apps/server/src/hub/connectors/write-record.ts:314-321`; `SYSTEM_MESSAGE_MAX` em `packages/hub-api/src/copies.ts:44` | sem referência (E3) | embrulhado (a limpeza de `storable`, numa função de texto em `copy-port.ts`) | os critérios da U10 | decisão E (`E1`); o corte já está no `main`: o check `copy_run_system_message` (`apps/server/src/hub/copies/tables.ts:136-139`) recusa mais de `SYSTEM_MESSAGE_MAX`, e `systemOf` corta para a rodada fechar | — |
| A mensagem na linha da rodada | U11 | `RunRow` e `RunPhoneRow` em `apps/web/src/hub/copies/copy-detail.tsx:40-66`; `outcomeText` em `text.ts`; `systemText` já existe com outro sentido (`text.ts:37`) | a plataforma de ingestão a mostra no detalhe da execução, com os registros inteiros (P8, parcial no lugar) | nativo (a linha e o `text-2` que já existem) | — | decisão E: na linha, embaixo da frase | — |
| A ferramenta que explica a causa | U12 | não existe; nada em `apps/server/src/builder/assistant/` lê rodadas | a plataforma de ingestão dá ao agente uma ferramenta que lê a última execução de um fluxo e devolve as linhas de erro e uma análise, para "por que a última execução falhou?" (E4; a de catálogo não tem); `@mastra/core@1.82.0` `createTool` com `description`, `inputSchema` e `execute(input, { requestContext })` (`dist/docs/references/reference-tools-create-tool.md:59`, `:93`) | nativo (`createTool`, como `overviewTool`, `overview.ts:18-46`) | — | o modelo explica pelas rodadas, sem análise pronta (passada (b), C8) | `apps/server/src/builder/assistant/copy-runs.ts` |
| Quem lê as rodadas pela ferramenta | U12 | `listCopies` e `listCopyRuns` admitem `readCopies` (`list.ts:136`, `:204`); a U5 troca por `seeData` com o filtro por papel | ver uma execução pede leitura em toda tabela que ela lê (P14) | nativo (a admissão da U5) | — | decisão G4.1 | — |
| A porta das cópias pela raiz | U12 | `ConversationsDeps.copies` já recebe uma função que devolve o `Pick` de `CopyService` com `run` e `projectView` (`apps/server/src/conversations-of.ts:162`); a porta atrasada `handOffs` (`assistant.ts:128`); o molde estrutural `AssistantProjects` (`ports.ts:5-18`) | as portas que o Assistente já recebe | nativo | — | decisão G4.2 | — |
| A linha da ferramenta na conversa | U12 | `ASSISTANT_SPECS` em `apps/web/src/builder/conversation/assistant-specs.ts:16-71`, tipado por `ASSISTANT_TOOL` | a linha de `conexus_overview` (`:24-32`); `lucide-react` 1.57.0 exporta `HistoryIcon` | nativo | — | — | — |

**A medida do transplante.** Nenhuma parte vem do repositório antigo.

**A dívida.** Nenhuma nova; as pendências que esperam estão na página do fundador.

## As decisões do firstmate

Numeradas pelo grupo que as tomou (G1.1 é a primeira do G1).

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| G1.1 | Uma trava só: `ROLES_LOCK` também em `takeReadersTicket`, `reconcileOnce`, `grantCopy` e `revokeCopy`, no lugar do `READERS_LOCK` novo da spec | `ROLES_LOCK` já existe: "the acts of one company's database take turns" (`apps/server/src/platform/copy-sql.ts:113-118`), e já é a primeira instrução de `ensureSync` (`:133`) e `ensureReader` (`apps/server/src/platform/copy-reader.ts:30`). Duas chaves deixariam os dois darem `GRANT` juntos em `sync` | A segunda chave, primeira nas quatro chamadas |
| G1.2 | O código novo da U1 mora em `copy-reader.ts`; só `readersLedger` e as constantes do livro ficam em `copy-sql.ts` | `CompanyPostgres` já herda `CopyReader` por `...copyReader(context)` (`apps/server/src/platform/company-postgres.ts:199`, `:349`): as portas novas entram sem tocar a fachada. `ensureSync` cria o livro, e `copy-reader.ts` já importa `copy-sql.ts` (`copy-reader.ts:5-12`): o livro ali faria um ciclo (`no-circular`, `.dependency-cruiser.cjs:62`) | Mover as funções para `copy-sql.ts` |
| G1.3 | O arquivo de teste da U1 é `copy-role-readers.test.ts`, não `copy-readers.test.ts` | `apps/server/src/platform/copy-reader.test.ts` já existe | Renomear o arquivo e a linha de `scripts/rerun-never.json` |
| G1.5 | A U2 entrega só o que a U2 chama: `reconciled` (com `wantedOf` e `appliedOnce` dentro do arquivo). `copiesReadBy`, `readerOf`, `readAs` e a porta `data.readers` de `service.ts` entram na U3, `readersOf` na U4, com o primeiro chamador | `npm run check` roda `knip` (`package.json:15`), que recusa exportação sem uso | As funções e a porta na U2, cada uma com um caso |
| G1.6 | Os testes da U2 chegam a `reconciled` pelas portas públicas de `hub/copies` (`copies.enable` e `copies.run`, `apps/server/src/hub/copies/test-copies.ts:191-202`), sem o `reconcile` exportado da spec | T5; o fim da rodada já reconcilia, e a decisão G1.5 tira `data.readers` da U2 | Exportar `reconcile` em `service.ts` e chamá-lo nos testes |
| G1.7 | `reconcileOnce` dá `GRANT` só às tabelas pedidas que existem em `sync` (lidas na mesma consulta de antes que lê os logins), e `42P01` entra nas corridas de uma nova tentativa | A cópia nasce no Hub antes da sua tabela no banco da empresa (`enableCopy`, `apps/server/src/hub/copies/enable.ts:151` grava a linha, `:167-173` cria a tabela); outro ato nesse meio daria `42P01` no `GRANT`; a marca posta nesse meio ganha o `GRANT` no fim da primeira rodada | Tirar o filtro; a reconciliação falha nesse meio e a seguinte conserta |
| G1.8 | `test-app-ports.ts` ganha as três portas: `takeReadersTicket` direto, `reconcileReaders` dentro de `withRoleLock`, `roleAddress` por `addressOn(host, roleLogin(roleId))` | O mundo de teste implementa `CompanyPostgres` à mão (`apps/server/src/platform/test-app-ports.ts:40-82`); a limpeza de outro arquivo derruba logins sob a mesma trava (`:69-76`) | Nenhum: é consequência do tipo |
| G1.9 | O id do papel ganha a marca `RoleId` em `packages/hub-api/src/company-roles.ts`, ao lado de `ConnectorId`, e `companyRoleRows` a cria por parse; os conectores usam o `ConnectorId` que já existe | `scripts/conexus-code.grit:75-89` recusa `\w*Id: string` em `apps/server/src`; não havia marca para o papel | nenhum: sem a marca o `npm run check` recusa |
| G2.1 | O lado G2 da decisão G1.5: a U3 cria as funções de leitura e a porta `data.readers`; a U4, `readersOf` | decisão G1.5 | Como em G1.5 |
| G2.2 | A recusa da amostra ao desenvolvedor é o código novo `COPY_NOT_IN_ROLE` em `COPY_FAILURES` (`packages/hub-api/src/copy-failures.ts:4`), com a linha do contrato da U5 | `NOT_IN_ROLE` já é a recusa de ferramenta de agente, 409, com "Seu papel não pode usar a ferramenta {operation}." (`packages/hub-api/src/failures.ts:265-272`); `sentenceOfCode` junta frase e ação (`apps/web/src/platform/hub.ts:242-244`), o texto do requisito 4.10; 403 porque o desenvolvedor vê a tabela na lista, como `APP_ACCESS_REFUSED` (`packages/hub-api/src/app-failures.ts:22-28`) | Trocar o código da falha em `sampleOf` e na lista de `sampleCopy` |
| G2.3 | O leitor do Hub se chama `ReaderLogin`, não `CopyReader` | `CopyReader` já é o tipo da plataforma (`apps/server/src/platform/copy-reader.ts:113`) | Renomear |
| G2.4 | `setRoleCopies` e a sua reposição tomam `lockCompany` antes da admissão | `apps/server/src/hub/identity/company-roles.ts:172-181`; sem ela, dois `PUT` do mesmo papel dariam `23505` no `insert` (code C65); apagar um papel toma a mesma trava | Tirar a trava e tratar `23505` com `.onConflictDoNothing()` |
| G2.5 | A ação `seeData` nasce na U4, com o seu primeiro chamador (`listedReaders`); a U5 passa as listas e a amostra a ela e tira `readCopyRows` | A spec usa `seeData` em `listedReaders` (6.2) e a cria na 6.3: a U4 não compilaria | Juntar U4 e U5 num commit |
| G2.6 | Dono e Administrador entram em `listCopyReaders` por uma porta nova da identidade, `readingAll`, em `role-rows.ts` | `companyRoleRows` só tem as linhas de `organization_role`, e Dono e Administrador não têm linha (`company-roles.ts:104-110`); o rótulo é `ROLE_LABELS` da identidade (`:8`, `:65`), que `hub/copies` não importa (code C8) | Pôr os dois em `companyRoleRows`, com `id` nulo |
| G2.7 | `OfRole` sai exportado de `packages/hub-api/src/company-roles.ts:48` e `copies.ts` o importa | code C26 | Duplicar a linha |
| G2.8 | Um id repetido no corpo de `setRoleCopies` conta uma vez, e a resposta é o conjunto pedido, na ordem do pedido | sem isso, o `insert` repetiria a chave | Recusar a repetição no esquema com `REQUEST_MALFORMED` |
| G2.9 | O conserto do `conexus_read` fica um só, o de `readAfterLogin` (por `companyOwner`, com `COPY_READER_MADE`), dentro de `readAs`; os dois casos de `query-failures.test.ts:134-153` passam a esperar as causas `NO_OWNER` e `READER_42501`, e o primeiro confere `COPY_DATABASE_FAILED` com `reason: 'OWNER_NO_ANSWER'` | Hoje há dois consertos do mesmo login (`read-table.ts:31-39` e `query.ts:69-80`); `companyOwner` já registra a causa (`apps/server/src/hub/copies/store.ts:162-187`) | Manter as causas da consulta em `readAs` |
| G2.10 | A função local `readAs` de `query.ts` fica só com o lugar Projeto e se chama `projectRead` | colide com `readers.readAs` | Nenhum: só o nome |
| G2.11 | A sonda da decisão D é um caso de teste que fixa o que o banco faz hoje (critério 40) | o caso falha se o banco mudar | Tirar o caso e registrar a sonda só no corpo do PR |
| G2.13 | O caso web da aba Amostra fica em `copy-sample.test.tsx`, não em `copy-detail.test.tsx` | o caso que esconde a aba está em `apps/web/src/hub/copies/copy-sample.test.tsx:54` | — |
| G2.14 | A U5 muda também `apps/web/src/routes/_app/companies/$companyId/data.$copyId.tsx` | A prop `mayReadRows` vem de `may.readCopyRows` ali (`:37`) | — |
| G3.1 | **Perguntar ao Assistente** vive em `apps/web/src/builder/assistant/` e chega à página da tabela pela rota, num espaço `ask` de `CopyDetail`; `hub/copies` não importa o rascunho | W4 e a regra `hub-does-not-import-builder` do `.dependency-cruiser.cjs` (de `^apps/(server|web)/src/hub/` para `^apps/$1/src/builder/`): `useDraft` em `hub/copies` (decisão C) quebra `npm run deps`; a rota liga os dois pela porta (W6), como Papéis passa o kit (`settings/roles.tsx:58-62`) | o botão volta a `hub/copies` quando a regra mudar |
| G3.2 | O link usa `append`, não `change` | `change` apaga o rascunho do Início (`draft.ts:53`); `append` acrescenta uma linha e não a repete (`draft.ts:55-59`) | trocar por `change`; o critério 89 cai |
| G3.3 | A recusa da amostra ao desenvolvedor usa o código `COPY_NOT_IN_ROLE` que a U5 cria (decisão G2.2) | code C26 | Seguir a desfeita da decisão G2.2 |
| G3.4 | A recusa da amostra aparece num `Alert`, sem **Tentar de novo** | a linha da falha é `settles: true` (como `COPY_NOT_FOUND`, `copy-failures.ts:5-12`); V29 | voltar ao `ReadFailure` |
| G3.5 | A aba Quem lê segue as colunas de `p4-02` (Papel, Pessoas, Como lê) e o link por papel da spec (7.2), no lugar do botão único de `p4-02`; "Para mudar, abra o papel." só para quem tem `manageRoles` | a spec pede o link para `?role=<papel>` (`settings/roles.tsx:10-13`); a decisão B dá o caminho a quem pode mudar papéis | um botão só para `/settings/roles`, como `p4-02` |
| G3.6 | A linha da tabela no bloco Dados copiados mostra o nome em mono e, abaixo, o que ela guarda (`describedAs`: a descrição, senão o rótulo) | a tela `p4-01` aprovada; a spec dizia "o rótulo e, abaixo, o nome". O mesmo par está na lista de Dados (`copy-list.tsx:214-216`) | trocar a ordem |
| G3.7 | A frase da leitura ao vivo aparece uma vez, abaixo das seções dos sistemas | "sob o bloco, em todo papel" da spec a repetiria em cada sistema do kit | uma por seção |
| G3.9 | Para o membro, a página Dados agrupa só os sistemas que têm uma tabela do papel dele | `p1-11`; hoje `systemsOf` lista também o sistema sem cópia (`raw-layer.tsx:145`), que diria ao membro "Nenhuma tabela copiada" de tabelas que ele não lê | listar todos os sistemas |
| G3.10 | `CopyDetail`, `DataPage` e `DataTree` leem `may` por `getRouteApi('/_app/companies/$companyId')` (W8), como `copy-proposal-card.tsx:71`; a prop `mayReadRows` já saiu na U5 | a prop repetiria o contexto da rota em três telas | passar `mayManage` por prop |
| G3.11 | O valor do endereço da aba é `readers` | os valores de `TableTab` são em inglês (`search.ts:12`) | outro nome; o critério 78 muda |
| G3.12 | Os casos de servidor da U8 usam as tabelas do mundo de teste (`clientes` fora do catálogo), não `sankhya_clientes` | o mundo de `tools.test.ts` é `vendas`, `clientes`, `juntas` (`test-world.ts:47-54`); o caso da tela usa `sankhya_clientes` | criar um mundo do Sankhya |
| G4.1 | `copy_runs` admite por `seeData`, pelo `listCopies` e `listCopyRuns` da U5, e a tabela que o papel não lê responde `NOT_FOUND`, como um nome que não existe | A palavra do fundador "tem que esconder" e S10; depois da U5, `copies.list` só traz as cópias do papel (spec da parte 4, 6.3), e a recusa do papel da passada (b) não alcança o membro (E4, achado de costura) | Admitir por `readCopies` na ferramenta e recusar o papel antes de procurar |
| G4.2 | A ferramenta recebe a porta `AssistantCopies` (`builder/assistant/ports.ts`), ligada pela raiz em `conversations-of.ts` ao `CopyService` que já chega atrasado, e não importa `hub/copies` | A regra `agents-and-apps-reach-data-only-through-the-contract` barra o import (`.dependency-cruiser.cjs:101-110`, `tsPreCompilationDeps: true` em `:303`) e "nothing joins the list" (`:22`); o molde é `AssistantProjects` (`ports.ts:5-18`) e `handOffs` (`assistant.ts:128`) | Pôr as rodadas no contrato `CompanyData` (`packages/hub-api/src/company-data.ts`) e ler por ele |
| G4.3 | `NOT_FOUND` sai como erro da ferramenta (um `Error` com o JSON `{ kind, status, code, message, body, reason }`), não como resultado; e a ferramenta não tem o caso `NOT_IN_ROLE` | As ferramentas de dado já recusam assim (`apps/server/src/builder/data-tools/tools.ts:16-49`, code C79), e a linha da conversa lê igual; com `seeData`, todo membro é admitido, e quem não é membro não chega a um turno | Devolver `{ kind: 'NOT_FOUND' }` como resultado, como a spec da passada escreve |
| G4.4 | `systemOf` devolve `null` quando a recusa não traz código nem mensagem | Requisito 3 da passada ("o que o sistema disse"); um 200 sem texto (o corpo que nenhum esquema lê, `packages/connectors/src/sankhya/answers.ts:148-153`) mostraria só "200" embaixo de "O sistema mandou uma resposta que o Conexus não entende" | Guardar o status sozinho e mostrar só o número |
| G4.5 | A função de texto da linha se chama `systemSaid`, não `systemText` | `systemText(system, accounts, tables)` já existe em `apps/web/src/hub/copies/text.ts:37` (code C26) | Renomear a de hoje |
| G4.6 | O resultado diz da cópia `name`, os nomes das conexões, `schedule` e `interval` | O requisito 7 pede "nome, sistema, estado, intervalo"; `CopySummary` dá `sources[].connection.name` e `schedule` (`packages/hub-api/src/copies.ts:72-91`, `copy-shown.ts:6-8`), e o modelo nunca recebe um id de conexão (como `DataOrigin`, `packages/hub-api/src/assistant.ts:95-107`) | Trocar os campos em `copyRunsTool` |
| G4.7 | O G4 mescla depois do G2, e a U10 parte de `ended` como a U2 o deixou | A U12 depende da U5; a U2 muda `ended` depois do log (`run.ts:149`), a U10 no `.set` de `:125-129`, trechos que não se cruzam | A U12 num PR próprio, logo depois do G2 |

## U1 `roleLogin`, `roleAddress`, o livro, o bilhete e `reconcileReaders`

**Base e modelo.** O `main` em `b2c23dc0` (com o PR 1078). Opus: concorrência no banco da empresa (trava, bilhete, transação abandonada) e um teste de corrida.

### As linhas da tabela

- **O banco garante.** Leia na base `ensureReader` (`apps/server/src/platform/copy-reader.ts:21-53`: as quatro `ALTER ROLE ... SET` em `:32-39`, `SET LOCAL ROLE` do `conexus_sync`, `GRANT` e `ALTER DEFAULT PRIVILEGES` em `:41-45`), `readerAddress` (`:55-61`), `readCopies` (`:81`), `copyReader` e o tipo `CopyReader` (`:113-134`); `ensureSync` (`apps/server/src/platform/copy-sql.ts:124-144`, a nova tentativa só em `42710`, `:142`), `syncAddress` (`:146-152`), `grantCopy` (`:354-368`), `revokeCopy` (`:381-399`, `NOTHING_TO_REVOKE` em `:375`), `tableOf` (`:100-102`), `budget` (`:105-108`); `missingLogins` e `quoted` (`apps/server/src/platform/app-sql.ts:72-87`, `:46-48`). O transporte: uma chamada, uma transação (`sql.transaction`, `apps/server/src/platform/company-postgres.ts:131`, `:140`; `BEGIN` e `COMMIT` em `apps/server/src/platform/test-company-postgres.ts:53`, `:71`), o SQLSTATE em `REFUSED.code` por `answerOf` (`company-postgres.ts:46-60`), e `CONNECTION_LOST` (`:40`), que `CXR01` não casa. PostgreSQL 18: `GRANT`, `REVOKE`, `DROP ROLE` (recusa com `2BP01` quem ainda segura permissão).
- **A trava.** `ROLES_LOCK` (`copy-sql.ts:113-118`), decisão G1.1.
- **O bilhete.** Sem referência; a ordem é a da spec da parte 4, `C2`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/company-roles.ts` | Muda (a marca `RoleId`, decisão G1.9) | `copy-reader.ts`; a U2 (`companyRoleRows`) |
| `apps/server/src/platform/copy-reader.ts` (dono de `CopyReader`) | Muda: `roleLogin`, `roleAddress`, `takeReadersTicket`, `reconcileReaders`, `readSettingsOf`; três métodos em `CopyReader` | `company-postgres.ts:349` (fachada); a U2 por `deps.companyPostgres` |
| `apps/server/src/platform/copy-sql.ts` | Muda: `readersLedger`, `LEDGER`, `TICKETS`; o livro em `ensureSync`; `ROLES_LOCK` em `grantCopy` e `revokeCopy` | `copy-reader.ts`, `company-postgres.ts`, `hub/copies` pela fachada |
| `apps/server/src/platform/test-app-ports.ts` | Muda: três portas | `apps/server/src/hub/copies/test-copies.ts:176` (o mundo de teste do Hub) |
| `apps/server/src/platform/test-company-postgres.ts` | Muda: a expressão dos logins a derrubar (`:133`); `roleLoginOf` novo, como `readLoginOf` (`:345-347`) | os testes da plataforma e da U2 |
| `apps/server/src/platform/copy-role-readers.test.ts` | Cria | — |
| `scripts/rerun-never.json` | Muda: uma linha em `files` | `scripts/rerun-exempt.ts`, `scripts/test-run.ts` |

### Os contratos que a unidade cria

```ts
// apps/server/src/platform/copy-sql.ts
export const LEDGER: string                       // `${SYNC_SCHEMA}._readers_applied`
export const TICKETS: string                      // `${SYNC_SCHEMA}.readers_ticket`
/** O livro das reconciliações, do conexus_sync, repetível; nenhum login de leitura o lê. */
export function readersLedger(): SqlStatement[]

// packages/hub-api/src/company-roles.ts
/** O id da linha do papel em auth.organization_role; criado só por parse (C23). */
export const RoleId = z.string().regex(LIBRARY_ID).brand('RoleId')

// apps/server/src/platform/copy-reader.ts
/** `conexus_role_<id>`; lança Failure('INTERNAL_UNEXPECTED', { details: { reason: 'COPY_READER_NAME' } }) além de 63 bytes. */
export function roleLogin(roleId: RoleId): string
export type WantedReader = Readonly<{ roleId: RoleId; tables: readonly string[] }>
export type ReadersAnswer = SqlAnswer | Readonly<{ kind: 'SUPERSEDED' }>
export type CopyReader = {
  // ... os três de hoje
  /** Um bilhete, numa chamada curta: quem pega depois lê o Hub depois. */
  takeReadersTicket(owner: DatabaseUrl): Promise<SqlAnswer>
  /** O banco igual ao pedido do bilhete, numa transação; o de bilhete menor ou igual ao do livro volta SUPERSEDED. */
  reconcileReaders(owner: DatabaseUrl, ticket: bigint, wanted: readonly WantedReader[]): Promise<ReadersAnswer>
  /** Onde o Hub alcança o login de um papel, pelo host gravado, sem chamar a Neon. */
  roleAddress(host: string, roleId: RoleId): Promise<DatabaseUrl>
}

// apps/server/src/platform/test-company-postgres.ts
export function roleLoginOf(owner: DatabaseUrl, key: AppLoginKey, roleId: RoleId): Promise<DatabaseUrl>
```

O SQLSTATE nosso `CXR01` (constante `SUPERSEDED`, não exportada) só vive em `reconcileReaders`. Nenhuma rota, coluna do Hub ou código de `failures.ts` muda.

- **Cada estado.** `ReadersAnswer` é união em `kind` (code C21): as variantes de `SqlAnswer` e `SUPERSEDED`.
- **Cada id.** `roleId` é o id de `auth.organization_role` (uuid nos semeados, `apps/server/src/hub/identity/company-roles.ts:61`; 32 letras e dígitos nos próprios), sempre por `quoted` (guarda a caixa); `roleLogin` confere o tamanho.
- **O dono de cada fato.** A trava, `ROLES_LOCK`; o nome do livro, `LEDGER` e `TICKETS`; as quatro configurações de leitura, `readSettingsOf`, extraída de `ensureReader` sem mudança (code C26).
- **O esquema Zod.** O bilhete volta como texto, lido pela U2 com `z.coerce.bigint()` (code C27).
- **O arquivo modelo.** `copy-reader.ts`: `ensureReader` e `readerAddress` cumprem C21 e C26; o id do papel é a marca nova `RoleId` (C23, decisão G1.9).

### As skills e a leitura

Linhas de `docs/reference/stack.md`: PostgreSQL (`:100`, `postgresql.org/docs/18/`, skill `neon:neon-postgres`), `pg` (`:43`), Node (`:101`, skill `node`). Ler primeiro `copy-reader.ts` inteiro e `copy-sql.ts:100-152`, `:354-399`.

### A ordem do trabalho

1. **O livro e a trava nas chamadas de hoje.** Critérios: 10 (a parte de `conexus_read`; a dos logins de papel fecha no passo 3), 11.
   - **Arquivos:** muda `copy-sql.ts`, `copy-reader.ts`; cria `copy-role-readers.test.ts`.
   - **Referência a seguir:** `ensureSync` (`copy-sql.ts:124-144`); o comentário de `ROLES_LOCK` (`:113-117`).
   - **O que entra:** `readersLedger()` como na spec da parte 4 (`CREATE SEQUENCE IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS` com a linha única, `INSERT ... ON CONFLICT DO NOTHING`, `REVOKE ALL ... FROM PUBLIC` na tabela e na sequência, e o bloco `DO` que tira de `conexus_read`). Em `ensureSync`, depois do `CREATE SCHEMA` (`:136`): `SET LOCAL ROLE` do `conexus_sync` e `...readersLedger()`. `ROLES_LOCK` primeiro em `grantCopy` e nos dois ramos de `revokeCopy`. Em `ensureReader`, depois do `GRANT SELECT ON ALL TABLES` (`copy-reader.ts:42`): o bloco `DO` que tira `_readers_applied` de `conexus_read` se a tabela existir. Regras: D10, code C26.
   - **Testes:** os do critério 10 e o primeiro do 11.
   - **Mutações à mão:** tirar o `REVOKE` de `conexus_read` em `readersLedger`: critério 10; tirar o bloco `DO` de `ensureReader`: critério 10, no ramo "com `ensureReader` rodado depois".
   - **Pronto quando:** os dois casos passam com o banco descartável.
2. **O login do papel e o endereço.** Critérios: 7, 8.
   - **Arquivos:** muda `copy-reader.ts`, `test-company-postgres.ts`.
   - **Referência a seguir:** `readerAddress` (`copy-reader.ts:55-61`), `loginOf` (`test-company-postgres.ts:325-330`).
   - **O que entra:** `roleLogin`, `roleAddress`, `roleLoginOf`; a expressão de `:133` passa a `'^(app_.*_(run|migrate|read)|conexus_sync|conexus_read|conexus_role_.*)$'`. Regras: code C23.
   - **Testes:** os dos critérios 7 e 8.
   - **Mutações à mão:** trocar `login` por `READ_LOGIN` em `roleAddress`: critério 8; `> 63` por `>= 128`: critério 7.
3. **O bilhete e a aplicação.** Critérios: 1 a 6, 9, 11, 12, 13.
   - **Arquivos:** muda `copy-reader.ts`.
   - **Referência a seguir:** `ensureReader` (a nova tentativa e o `SET LOCAL ROLE`), `revokeCopy` (`REVOKE ALL` e `REVOKE USAGE` antes do `DROP ROLE`).
   - **O que sai:** de `ensureReader`, as quatro `ALTER ROLE ... SET` em linha, que passam a `readSettingsOf(READ_LOGIN)`.
   - **O que entra:** `takeReadersTicket` (`ROLES_LOCK`, `SET LOCAL ROLE` do `conexus_sync`, `nextval`; `42P01` repete a chamada com `readersLedger()` antes, uma vez). `reconcileReaders` e `reconcileOnce` na ordem da spec da parte 4 (`C2`, `docs/steps/trilhas/dados-spec/04-governanca-minima/design.md:110-225`: o bloco `DO` com o bilhete, a leitura dos logins, o `REVOKE ALL` e o `GRANT` por login, e o `UPDATE` do livro), com `ROLES_LOCK` (decisão G1.1) e a consulta de antes lendo também as tabelas de `sync`:
     ```ts
     const found = await context.transport(owner, [
       { text: `SELECT rolname FROM pg_roles WHERE rolname LIKE 'conexus\\_role\\_%'
                  AND has_schema_privilege(oid, 'sync', 'USAGE')` },
       { text: `SELECT relname FROM pg_class WHERE relnamespace = 'sync'::regnamespace AND relkind IN ('r', 'p')` },
     ], signal)
     ```
     e cada `GRANT SELECT` nomeia só as pedidas da segunda lista (decisão G1.7). `RACES` = `42710`, `XX000`, `23505`, `42P07`, `42P01`. O bilhete entra no bloco `DO` como número literal (`ticket.toString()` de um `bigint`). Regras: D10, code C21, C57.
   - **Testes:** os dos critérios 1 a 6, 9, 12, 13 e o segundo do 11. O de corrida: `Promise.all` de três chamadas, 20 voltas, sobre `testCompanyPostgres` (T5), como `apps/server/src/platform/copy-reader.test.ts:160-180`; o ataque direto lê com `asLogin` copiado de `company-postgres.test.ts:42-55` e o endereço de `roleLoginOf`; as tabelas criadas como `conexus_sync` (`copy-sql.test.ts:18-26`).
   - **Mutações à mão:** `>=` por `>` no bloco `DO`: critério 9 (o mesmo bilhete); tirar o `UPDATE` do livro: critério 9; tirar `ROLES_LOCK` de `grantCopy`: critério 12, com `XX000` numa das voltas; tirar o ramo `42P01` de `takeReadersTicket`: critério 11; tirar o `REVOKE ALL` antes do `GRANT`: critério 3; tirar `has_schema_privilege`: critério 4, com `2BP01`; tirar o filtro das tabelas que existem: critério 13, com `42P01`.
   - **Pronto quando:** `copy-role-readers.test.ts` passa inteiro no comando do servidor.
4. **As portas no mundo de teste e a lista de isolamento.** Critérios: 14 (fecha com `readers.test.ts`, da U2), 29 (a U2 acrescenta `readers.test.ts`).
   - **Arquivos:** muda `test-app-ports.ts`, `scripts/rerun-never.json`.
   - **Referência a seguir:** `ensureReader`, `readerAddress` e `syncAddress` em `test-app-ports.ts:75-81`.
   - **O que entra:** as três linhas da decisão G1.8; `apps/server/src/platform/copy-role-readers.test.ts` em `files`, em ordem alfabética. Regras: T4.
   - **Testes:** `node scripts/test-run.ts scripts/rerun-exempt.test.ts`; `npm run typecheck`.
   - **Mutações à mão:** tirar `roleAddress` de `test-app-ports.ts`: o `typecheck` recusa.
   - **Pronto quando:** o `typecheck` passa e a consulta do critério 14 não mostra login nenhum.

### Como se prova

- 1 a 13: a fachada `testCompanyPostgres` sobre um banco descartável, lido como o login (T5, T13); hoje falham. Só o 12 mostra a trava (`XX000` numa das 20 voltas sem ela).
- 14: a consulta no ponto de conferência; 29: `rerun-exempt.test.ts`.

### Parar se

- `scripts/check-migrations.ts` (`SESSION_STATE`, `:17-22`) recusar algum texto de `copy-reader.ts` ou `copy-sql.ts`: reporte qual; não mude o padrão.
- O caso de corrida falhar com um SQLSTATE fora de `RACES`: pare e reporte o código e a volta; não o acrescente à lista.
- O ataque direto passar em algum dos quatro comandos: pare.

## U2 A porta da identidade, `reconciled` e `readers_set` fora do esquema

**Base e modelo.** O `main` com a U1 (mesmo PR); `ended` muda antes da U10 (decisão G4.7). Opus: corrida entre Hub e banco da empresa.

### As linhas da tabela

- **A cópia nova sem leitor.** `insertedCopy` (`apps/server/src/hub/copies/accept.ts:61-90`) e `enableCopy` (`apps/server/src/hub/copies/enable.ts:148-193`) ficam como estão: não gravam linha em `copy_reader`. Dono e Administrador leem a tabela nova por `conexus_read`, que já tem `ALTER DEFAULT PRIVILEGES` em `sync` (`apps/server/src/platform/copy-reader.ts:41-45`).
- **A porta da identidade.** `readRoles` (`apps/server/src/hub/identity/company-roles.ts:82-129`), `seededRoles` (`:57-68`), `ports` (`apps/server/src/hub/identity/public.ts:98-125`).
- **A reconciliação.** `companyOwner` (`apps/server/src/hub/copies/store.ts:162-187`), `ended` (`apps/server/src/hub/copies/run.ts:105-153`; o lease solto em `:117`, `COPY_RUN_ENDED` em `:149`, o `return` em `:152`), `ensuredSync` (`run.ts:168-179`, o `createdBy` como pessoa); `copyReader` (`apps/server/src/hub/copies/tables.ts:175`), com `ON DELETE CASCADE` ao papel (`apps/server/migrations/20261115071412_copy_reader/migration.sql:14`).
- **A coluna que sai.** `readersSet` (`tables.ts:76-77`), que ninguém escreve nem lê fora do `select()` de hoje (`apps/server/src/hub/copies/list.ts:141`, `catalog-view.ts:20`). Data D6 manda apagar só depois que nenhuma imagem em uso a lê: a U2 a tira do esquema, e a U3 (G2) gera a migração que a apaga.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/role-rows.ts` | Cria `companyRoleRows`, `CompanyRoleRow` | `identity/public.ts` (`ports`) |
| `apps/server/src/hub/identity/public.ts` (dono de `IdentityPorts`, `:51`) | Muda: uma porta | `hub/copies` (`CopiesDeps.identity`, `store.ts:97`); `hub/data` (U3) |
| `apps/server/src/hub/copies/readers.ts` | Cria `reconciled` | `run.ts`; U3 e U4 |
| `apps/server/src/hub/copies/run.ts` | Muda | `service.ts` (`run`) |
| `apps/server/src/hub/copies/tables.ts` | Muda: sai `readersSet` | todo `select()` de `copy` |
| `apps/server/src/hub/copies/readers.test.ts` | Cria | — |
| `scripts/rerun-never.json` | Muda: uma linha em `files` | `scripts/rerun-exempt.ts` |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/identity/role-rows.ts
export type CompanyRoleRow = Readonly<{ id: RoleId; role: Role; label: string; members: number }>
/** As linhas de papel da empresa (desenvolvedor, membro e os próprios), com quantas pessoas cada uma tem. Dono e Administrador não têm linha. */
export async function companyRoleRows(tx: ReadTx, companyId: CompanyId): Promise<CompanyRoleRow[]>
// identity/public.ts, em ports: companyRoleRows

// apps/server/src/hub/copies/readers.ts
/** A reconciliação inteira de uma empresa; o banco da empresa calado não lança. */
export async function reconciled(deps: CopiesDeps, input: InCompany): Promise<'DONE' | 'FAILED'>
```

O que se apaga: `readersSet` de `copy` em `tables.ts` (a coluna fica no banco até a migração da U3). Os passos de `reconciled` são os da spec da parte 4 (`C2`, "A reconciliação inteira"), sem a semeadura: `companyOwner`; até duas voltas de bilhete, leitura curta do Hub (`wantedOf`), `reconcileReaders`, releitura. `wantedOf` devolve cada linha de `companyRoleRows` com os nomes das cópias que ela lê em `copy_reader`, ordenados.

Logs novos (S41, só escalares): `COPY_READERS_SUPERSEDED` (`companyId`), `COPY_READERS_FAILED` (`companyId`, `code` ou `reason: 'NO_OWNER'`), `COPY_READER_NAME` (`companyId`). `COPY_READERS_PENDING` nasce na U4.

- **Cada estado.** `reconciled` dá `'DONE' | 'FAILED'`; `SUPERSEDED` é `'DONE'` (code C21).
- **Cada id.** `RoleId` sai de `organization_role.id` por parse (decisão G1.9); `CopyId` com a sua marca, como hoje (C23).
- **O dono de cada fato.** Quem lê, `copy_reader`; o pedido ao banco, só `wantedOf` (C26).
- **O esquema Zod.** `Role.parse` e `RoleId.parse` da linha; `z.coerce.bigint()` do bilhete (C27).
- **O arquivo modelo.** `apps/server/src/hub/copies/grants.ts` (a linha primeiro, `:74-91`, depois o banco, `:93`): cumpre C21 e C26; C23 pelo `CopyId`.

### As skills e a leitura

`stack.md`: `drizzle-orm` (`:41`, `orm.drizzle.team/llms.txt`), `better-auth` (`:45`, skill `organization-best-practices`: a linha de papel da biblioteca), `zod` (`:34`), Node (`:101`, skill `node`). Ler primeiro `company-roles.ts:82-129` e `run.ts:105-153`.

### A ordem do trabalho

1. **A porta da identidade e a coluna fora do esquema.** Critérios: 15, 16, 28.
   - **Arquivos:** cria `role-rows.ts`; muda `identity/public.ts`, `tables.ts`.
   - **Referência a seguir:** `readRoles` (a leitura das linhas e a contagem por `member.role` em `:94-99`).
   - **O que sai:** `readersSet` e o seu comentário em `tables.ts:76-77`. Não gere migração nesta unidade (data D6).
   - **O que entra:** os contratos acima. Regras: D6, D16, code C26, C27.
   - **Testes:** os do passo 2, que chamam a porta; `enable.test.ts`, `accept.test.ts` e `accept-v2.test.ts` seguem passando sem mudança.
   - **Pronto quando:** `npm run typecheck` passa e `git grep -n readersSet -- apps` não mostra nada.
2. **`reconciled`, o bilhete e o fim da rodada.** Critérios: 15 a 17, 21 a 23, 26 a 29.
   - **Arquivos:** cria `readers.ts`, `readers.test.ts`; muda `run.ts`, `scripts/rerun-never.json`.
   - **Referência a seguir:** `grantCopy` do Hub (`grants.ts:62-101`); `ended` (`run.ts:105-153`).
   - **O que entra:** `reconciled` com `wantedOf` e `appliedOnce`; em `ended`, depois do log `COPY_RUN_ENDED` e antes do `return`: `await reconciled(deps, { companyId, personId: claimed.copy.createdBy })`, sem mudar o resultado da rodada. O bilhete antes de ler o Hub; a segunda volta só se a releitura difere. `appliedOnce` loga `COPY_READER_NAME` e relança a falha com esse `reason`, e nenhuma outra. `readers.test.ts` em `files`. Regras: D22, code C21, S41, T4.
   - **Testes:** `readers.test.ts`, os casos dos critérios 15 a 17, 21 a 23 e 26 a 28, com `copiesOn` (`test-copies.ts:139-206`), os papéis criados por `POST /api/companies/{companyId}/roles` como `ATENDENTE` (`apps/server/src/hub/identity/test-roles.ts:26`), `memberOn` (`apps/server/src/hub/identity/test-hub.ts:329`), `test-proposals.ts` para a versão 2, as marcas postas como dono no Hub de teste (a rota é da U4), `roleLoginOf` (U1) e o dublê por `t.mock.method` como `grants.test.ts:81-83`; `run.test.ts` continua passando.
   - **Mutações à mão:** pegar o bilhete depois de ler o Hub: critério 22; tirar a segunda volta: critério 23; tirar a chamada de `ended`: critérios 17 e 26; tirar o `ON DELETE CASCADE` de `copy_reader_role_fkey` na migração `20261115071412_copy_reader`, num banco de teste: critério 21.
   - **Pronto quando:** `readers.test.ts`, `run.test.ts` e `rerun-exempt.test.ts` passam; `npm run deps` e `npm run knip` passam.

### Como se prova

- 15 e 16: `copies.enable` e o aceite pela porta de `hub/copies` (T5), `copy_reader` lida no Hub; hoje passam, e o caso fixa que continua assim.
- 17, 21 a 23, 26 a 28: `copies.run` termina e reconcilia, o banco lido como o login; 22 e 23 param a aplicação com um dublê que espera uma promessa do teste e chama a real; 21 apaga o papel pela rota; hoje falham.
- 29: `rerun-exempt.test.ts`.

### Parar se

- `companyRoleRows` precisar de linha para o dono ou o administrador: não há (`company-roles.ts:104-110`); pare e reporte.
- `npm run migrations` ou `drizzle-kit check` recusar o esquema sem `readersSet` antes da migração da U3: pare e reporte; não gere a migração aqui.
- Um teste pedir `reconcile` exportado: pare (decisão G1.6).

## G1 O ponto de conferência

Depois de U2, antes do PR, os passos 6 e 7 do `conexus-build`, após `npm ci` e `npm run build -w @conexus/server`, com o Postgres local do formato da CI: `apps/server/src/platform/copy-role-readers.test.ts`, `copy-sql.test.ts`, `company-postgres.test.ts`, `copy-reader.test.ts`; `apps/server/src/hub/copies/readers.test.ts`, `enable.test.ts`, `accept.test.ts`, `accept-v2.test.ts`, `run.test.ts`, `grants.test.ts`; `apps/server/src/hub/identity/roles.test.ts`, `roles-delete.test.ts`; `node scripts/test-run.ts scripts/rerun-exempt.test.ts`; a consulta do critério 14; `npm run typecheck`, `npm run deps`, `npm run knip`, `npm run migrations -- --base origin/main` e `npm run check`. A reconciliação à mão num banco descartável, com `select rolname from pg_roles` e `relacl` antes e depois; as mutações (T27). O corpo do PR declara as decisões G1.1, G1.5 e G1.7.

## U3 O catálogo filtrado, a leitura pelo login do papel e o conserto em `42501`

**Base e modelo.** O `main` com o G1 mesclado. Opus: cruza `hub/copies` e `hub/data`, e `readAs` reconcilia sob corrida.

### As linhas da tabela

- **O catálogo.** `catalogOf` (`apps/server/src/hub/data/catalog.ts:7-30`, a admissão em `:11-14`, o `catch` em `:25-29`); `catalogTables` e `copiesOf` (`apps/server/src/hub/copies/catalog-view.ts:12-57`); `DataDeps.copies` (`apps/server/src/hub/data/deps.ts:15`); `data` em `apps/server/src/hub/copies/service.ts:59-62`.
- **A leitura.** `readCopyTable`, `readAfterLogin`, `tableReadOf`, `TableRead` (`apps/server/src/hub/copies/read-table.ts:7-91`); `tableRowsByName` (`catalog-view.ts:59-73`); `rowsOf` (`apps/server/src/hub/data/rows.ts:10-32`); `queryOf`, `readAs` local, `pageOf`, `refused` (`apps/server/src/hub/data/query.ts:51-145`, a recusa de "outro papel" em `:136-138`).
- **As peças do G1.** `reconciled`, `companyRoleRows` (U2); `roleAddress`, `roleLoginOf` (U1); `companyOwner` (`apps/server/src/hub/copies/store.ts:162-187`); `readerAddress`, `readCopies`, `ensureReader` (`apps/server/src/platform/copy-reader.ts:21-81`).
- **A admissão.** `admit` (`apps/server/src/hub/identity/admission.ts:358-368`), `MemberProof.role` (`:199-213`).
- **O contrato.** `sourceOf` (`packages/hub-api/src/company-data.ts:251-263`), `queried` (`:273-293`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/readers.ts` | Muda: `ReaderLogin`, `copiesReadBy`, `readerOf`, `readAs` | `service.ts`; U4, U5 |
| `apps/server/src/hub/copies/read-table.ts`, `catalog-view.ts`, `sample.ts` | Muda; `readAfterLogin` sai | `service.ts` |
| `apps/server/src/hub/copies/service.ts` (dono de `CopyService['data']`) | Muda: `data.readers`, a assinatura de `data.tableRows` | `hub/data` (`deps.ts:15`) |
| `apps/server/src/hub/data/` | Muda `catalog.ts`, `query.ts`, `rows.ts`; cria `catalog-role.test.ts`; muda `data.test.ts`, `query.test.ts`, `query-failures.test.ts` | `createCompanyData` (`public.ts:31-37`) |
| `apps/server/migrations/` | Cria: a migração que apaga `readers_set` | o `migrate` do programa (data D9) |
| `apps/server/database-grants.sql` | Muda: sai `GRANT UPDATE(readers_set)` e o seu comentário (`:394-396`) | o catálogo de permissões do banco do Hub |
| `scripts/rerun-never.json` | Muda: uma linha em `files` | `scripts/rerun-exempt.ts` |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/copies/readers.ts
/** Com que login uma pessoa lê na empresa: conexus_read para Dono e Administrador, o do papel para os outros. */
export type ReaderLogin = Readonly<{ kind: 'ALL' } | { kind: 'ROLE'; roleId: RoleId } | { kind: 'NONE' }>
export async function copiesReadBy(deps: Pick<CopiesDeps, 'identity'>, tx: ReadTx,
  input: { companyId: CompanyId; role: Role }): Promise<'ALL' | CopyId[]>
export async function readerOf(deps: Pick<CopiesDeps, 'identity'>, tx: ReadTx,
  input: { companyId: CompanyId; role: Role }): Promise<ReaderLogin>
/** Lê como o login de quem pergunta, com o conserto: o único lugar que escolhe o endereço de leitura na empresa. */
export async function readAs(deps: CopiesDeps, input: InCompany & { host: string; reader: ReaderLogin;
  statements: readonly SqlStatement[]; signal: AbortSignal }): Promise<SyncRead | { kind: 'NOT_IN_ROLE' }>

// apps/server/src/hub/copies/catalog-view.ts
type Place = 'ALL' | { projectId: ProjectId } | { copies: readonly CopyId[] }
export async function tableRowsByName(deps: CopiesDeps, input: { companyId: CompanyId; personId: PersonId;
  name: string; limit: number; signal: AbortSignal; reader: ReaderLogin }): Promise<TableRead | { kind: 'NO_COPY' }>

// apps/server/src/hub/copies/read-table.ts
export type TableRead = /* os três de hoje */ | { kind: 'NOT_IN_ROLE' }
// Reading ganha personId e reader

// apps/server/src/hub/copies/service.ts, em data:
readers: Object.freeze({ copiesReadBy, readerOf, readAs: (input) => readAs(full, input) })
```

`copiesReadBy`: Dono e Administrador (os papéis fixos, pelo `Role` da prova) dão `'ALL'`; a linha do papel por `companyRoleRows`, e sem linha `[]`; senão as cópias de `copy_reader` do papel. `readerOf`: `ALL`, `ROLE` com o id da linha, ou `NONE` sem linha. `readAs`:

- `NONE` → `NOT_IN_ROLE`, com `DATA_READ_REFUSED`.
- `ALL` → `readerAddress(host)`; `NO_LOGIN` → `companyOwner`, `ensureReader`, `COPY_READER_MADE`, uma nova tentativa (o que `readAfterLogin` faz hoje; causas `NO_OWNER` e `READER_<código>`, decisão G2.9).
- `ROLE` → `roleAddress(host, roleId)`; `REFUSED 42501` ou `NO_LOGIN` com `copiesReadBy` não vazio → `reconciled`; `FAILED` devolve a primeira resposta; senão uma nova tentativa, só uma, e a que passa loga `COPY_READERS_REPAIRED`. `42501` ou `NO_LOGIN` sem tabela, ou `42501` de novo na segunda → `NOT_IN_ROLE`, com `DATA_READ_REFUSED` (`companyId`, `personId`, sem a consulta). `readAs` nunca roda dentro de uma transação do Hub (D22).

- **Cada estado.** `ReaderLogin` e `TableRead` são uniões com `kind`, e cada `switch` termina em `satisfies never` (code C21).
- **Cada id.** `roleId` vem de `organization_role.id` por `companyRoleRows`; `CopyId` com a marca (C23).
- **O dono de cada fato.** Quem lê qual cópia: `copy_reader`, só em `readers.ts`; qual login: só `readAs` (C26).
- **Esquemas Zod.** Nenhuma entrada externa nova.
- **O arquivo modelo.** `grants.ts`, como na U2.

### As skills e a leitura

`stack.md`: `drizzle-orm` (`:41`), `pg` (`:43`, os testes leem como o login), `zod` (`:34`). Ler primeiro `query.ts:51-145` e `read-table.ts:21-91`, e a seção `readers.ts` da U2.

### A ordem do trabalho

1. **O leitor e a leitura por ele em `hub/copies`.** Critérios: 34, 35, 42.
   - **Arquivos:** muda `readers.ts`, `read-table.ts`, `catalog-view.ts`, `service.ts`, `sample.ts`, `rows.ts`.
   - **Referência a seguir:** `readAfterLogin` e `tableReadOf` (`read-table.ts:21-69`); `query.ts:57-82`.
   - **O que sai:** `readAfterLogin` (`read-table.ts:21-41`) e o endereço fixo `readerAddress` de `readCopyTable` (`:78`), que passam a `readAs`.
   - **O que entra:** os contratos acima. `readCopyTable` lê por `readAs`; `NOT_IN_ROLE` vira `TableRead` `NOT_IN_ROLE`. `sampleOf` passa `{ kind: 'ALL' }` (a U5 troca), e o seu `switch` ganha `NOT_IN_ROLE` como `Failure('INTERNAL_UNEXPECTED', { details: { reason: 'NOT_IN_ROLE' } })`, inalcançável com `ALL`. `catalogTables` com `{ copies: [] }` devolve `[]` sem consulta. `rows.ts` passa `personId` e `{ kind: 'ALL' }` à nova assinatura de `tableRows` (o passo 3 troca o leitor), para o typecheck passar. Regras: code C8, C21, C26; D22; S41.
   - **Testes:** os do passo 3; `catalog-view.test.ts` e `sample.test.ts` seguem passando.
   - **Mutações à mão:** `readerOf` devolve `ALL` para todo papel: critério 33; tire a nova tentativa depois de `reconciled`: critério 35.
   - **Pronto quando:** `npm run typecheck` passa e `sample.test.ts` passa no comando do servidor.
2. **O catálogo por papel.** Critérios: 30, 31, 32, 37, 38.
   - **Arquivos:** muda `catalog.ts`, `data.test.ts`.
   - **Referência a seguir:** `catalog.ts:7-30`.
   - **O que sai:** a regra `allows(proof.role, 'readCopyRows') ? ALL : []` (`catalog.ts:20-22`).
   - **O que entra:** na mesma leitura, `reads = copiesReadBy(proof.role)` no lugar Empresa e `catalogTables` com `'ALL'` ou `{ copies: reads }`. A admissão continua `readCompany`. Regras: S10.
   - **Testes:** `catalog-role.test.ts`, os casos dos critérios 30 a 32, 37 e 38; `data.test.ts` (o caso de `:49`, "o desenvolvedor e o membro não") passa sem mudança: sem marca, os dois papéis não leem a cópia.
   - **Mutações à mão:** tire o filtro `{ copies: reads }`: critério 30.
   - **Pronto quando:** os casos e `data.test.ts` passam.
3. **A consulta e a página pelo papel, a sonda e a lista.** Critérios: 33, 34, 35, 40, 42.
   - **Arquivos:** muda `query.ts`, `rows.ts`, `query.test.ts`, `query-failures.test.ts`, `catalog-role.test.ts`, `scripts/rerun-never.json`.
   - **Referência a seguir:** `queryOf` (`query.ts:122-145`), `rowsOf` (`rows.ts:10-32`).
   - **O que sai:** em `queryOf`, a recusa de "outro papel" (`query.ts:136-138`) e o ramo Empresa da `readAs` local (`:66`, `:74`), que vira `projectRead` (decisão G2.10).
   - **O que entra:** `queryOf` lê `readerOf(proof.role)` na mesma leitura do Hub; Empresa → `readers.readAs({ companyId, personId, host, reader, statements, signal })`; `NOT_IN_ROLE` → `{ kind: 'NOT_IN_ROLE' }` (já logado); o resto do `switch` igual. `rowsOf`: Projeto → `{ kind: 'ALL' }`; Empresa → uma leitura do Hub com `admitMember(readCompany)` e `readerOf`; `tableRows` com `personId` e `reader`; `NOT_IN_ROLE` cai no `DATA_ROWS_FAILED` de hoje (`rows.ts:29-31`) com `reason: 'NOT_IN_ROLE'`. `catalog-role.test.ts` em `files`. Regras: S41; T4.
   - **Testes:** `catalog-role.test.ts`, os casos dos critérios 33 a 35, 40 e 42, sobre o mundo da U2 (`copiesOn`, `apps/server/src/hub/copies/test-copies.ts:139`, com as cinco cópias; Vendas e Financeiro no molde `ATENDENTE`, `apps/server/src/hub/identity/test-roles.ts:26`; Bruno e Carla trocados de papel), as marcas de `copy_reader` plantadas no Hub de teste (a rota é da U4), `roleLoginOf` e o dublê de `apps/server/src/hub/copies/grants.test.ts:81-83`, pela porta `createCompanyData` (T5). `query.test.ts:214` ("o membro no Início não lê: NOT_IN_ROLE") passa sem mudança, agora pelo login do papel sem tabela; `query-failures.test.ts:134-153` muda (G2.9).
   - **Mutações à mão:** devolva `NOT_IN_ROLE` como `TABLE_UNAVAILABLE` em `queryOf`: critério 33; leia `rowsOf` sempre com `ALL`: critério 42 devolve linhas; troque o endereço `ROLE` por `readerAddress`: critério 34.
   - **Pronto quando:** `catalog-role.test.ts`, os testes de `apps/server/src/hub/data/` e `scripts/rerun-exempt.test.ts` passam.
4. **`readers_set` sai do banco.** Critérios: nenhum; a conferência do G2.
   - **Arquivos:** cria a migração em `apps/server/migrations/`; muda `apps/server/database-grants.sql`.
   - **Referência a seguir:** `apps/server/migrations/20261023011406_e142_drop_run_event/migration.sql:1` (a linha `-- contract:`).
   - **O que entra:** `npm run generate -w @conexus/server -- --name copy_readers_set_drop` (o `drizzle-kit generate` de `apps/server/package.json:11`), que lê o esquema sem `readersSet` (U2) e escreve o `DROP COLUMN`; na primeira linha, `-- contract: o G1 tirou readers_set do esquema, e nenhuma imagem desde então a lê nem escreve (data D6).`, que `scripts/check-migrations.ts:49-52` exige. Sai de `database-grants.sql` o `GRANT UPDATE(readers_set)` e o seu comentário (`:394-396`). Regras: D5, D6, D7, D30.
   - **Pronto quando:** `npm run migrations -- --base origin/main` passa e a migração tem só o `DROP COLUMN`.

### Como se prova

- 30 a 35, 37, 38, 40 e 42: o contrato real por `createCompanyData` sobre o banco de teste do Hub e o descartável da empresa; o 35 dá o `REVOKE` como `conexus_sync` por `asSync` (`test-copies.ts:251`). Hoje falham: o catálogo do membro vem vazio, toda leitura é `conexus_read`, e o 40 para em `NOT_IN_ROLE` (`query.ts:136-138`).
- A migração: `npm run migrations -- --base origin/main` no ponto de conferência do G2, e o banco de teste migrado sem a coluna (`information_schema.columns` de `copies.copy`).

### Parar se

- A sonda do critério 40 esconder os nomes de `sync` ao login do papel: pare e reporte com a saída (decisão D).
- `companyRoleRows` sem a linha do desenvolvedor ou do membro numa empresa de antes de `seedRoles`: pare e reporte; não crie linha.
- Uma reconciliação pedida por `readAs` precisar rodar dentro de uma transação do Hub para fechar uma corrida: pare; D22.
- A migração gerada trouxer algo além do `DROP COLUMN` de `readers_set`: pare e reporte a diferença; não a edite à mão.

## U4 As rotas `listCopyReaders` e `setRoleCopies`

**Base e modelo.** O `main` com o G1 e a U3 (mesmo PR, commit anterior). Opus: a ordem Hub e banco, a reposição e as corridas (critérios 48, 49, 53).

### As linhas da tabela

- **O contrato.** `listCopies` e `READ_FAILURES` (`packages/hub-api/src/copies.ts:160-182`); `OfRole`, `updateRole` (`packages/hub-api/src/company-roles.ts:48`, `:83-100`); `PLATFORM_FAILURES` (`packages/hub-api/src/operation.ts:54-60`).
- **As rotas.** `registerCopyRoutes` (`apps/server/src/hub/copies/routes.ts:34-104`); `serve` e `answer` (`apps/server/src/platform/http.ts`).
- **A ordem.** `grantCopy` do Hub (`apps/server/src/hub/copies/grants.ts:74-101`); `admitted` (`apps/server/src/hub/identity/company-roles.ts:172-181`); `manageRoles` com `locks: true` (`apps/server/src/hub/identity/admission.ts:127`), o `.for('share')` (`:328`), que a transação só de leitura recusa (`apps/server/src/platform/database.ts:203`).
- **A contagem.** `readRoles` (`company-roles.ts:82-129`, a contagem em `:94-99`, os fixos em `:101-114`).
- **Os testes.** `call` e `post` (`apps/server/src/hub/identity/test-hub.ts:253-290`), `codeOf` (`:292`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/copies.ts` | Muda: `CopyReaders`, `listCopyReaders`, `ROLE_COPIES_MAX`, `setRoleCopies` | `routes.ts`; G3 (`queries.ts` da web); o `openapi` |
| `packages/hub-api/src/company-roles.ts` | Muda: `OfRole` exportado | `copies.ts` |
| `apps/server/src/hub/identity/` | Muda `admission.ts` (`seeData`), `role-rows.ts` e `public.ts` (`readingAll`) | `hub/copies` (`CopiesDeps.identity`) |
| `apps/server/src/hub/copies/readers.ts`, `service.ts`, `routes.ts` | Muda: `readersOf`, `listedReaders`, `setRoleCopies` | `registerCopyRoutes` |
| `apps/server/src/hub/copies/readers-routes.test.ts`, `scripts/rerun-never.json` | Cria; muda | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/copies.ts
export const CopyReaders = z.object({ copyId: CopyId,
  roles: z.array(z.object({ role: Role, label: z.string(), members: z.int().min(0) })) })
export const listCopyReaders = defineOperation({ id: 'listCopyReaders', access: 'session', method: 'GET',
  path: '/api/companies/{companyId}/copy-readers', bodyLimit: 1024, input: { params: InCompany },
  success: { status: 200, body: z.object({ readers: z.array(CopyReaders) }) }, failures: READ_FAILURES })
export const ROLE_COPIES_MAX = 200
export const setRoleCopies = defineOperation({ id: 'setRoleCopies', access: 'session', method: 'PUT',
  path: '/api/companies/{companyId}/roles/{role}/copies', bodyLimit: 16384,
  input: { params: OfRole, body: z.object({ copies: z.array(CopyId).max(ROLE_COPIES_MAX) }) },
  success: { status: 200, body: z.object({ copies: z.array(CopyId) }) },
  failures: [...READ_FAILURES, 'ROLE_FIXED', 'ROLE_NOT_FOUND', 'COPY_NOT_FOUND', 'COPY_DATABASE_UNAVAILABLE'] })

// apps/server/src/hub/identity/admission.ts, em ACTIONS, ao lado de readCompany (:67)
seeData: { by: 'MEMBER', statement: undefined, locks: false },
// apps/server/src/hub/identity/role-rows.ts (em ports)
/** Dono e Administrador, que leem toda cópia, com o rótulo e quantas pessoas cada um tem. */
export async function readingAll(tx: ReadTx, companyId: CompanyId): Promise<{ role: Role; label: string; members: number }[]>

// apps/server/src/hub/copies/readers.ts
export async function readersOf(tx: ReadTx, companyId: CompanyId): Promise<Map<CopyId, string[]>>
export async function listedReaders(deps: CopiesDeps, input: InCompany): Promise<CopyReaders[]>
export async function setRoleCopies(deps: CopiesDeps,
  input: InCompany & { role: Role; copies: readonly CopyId[] }): Promise<CopyId[]>
```

`listedReaders`: `database.read`, `admitMember(seeData)`, `companyRoleRows`, `readingAll`, `readersOf`; sem `manageCopies`, só as cópias de `copiesReadBy`; cada cópia com `readingAll` primeiro e depois as linhas que a leem. `setRoleCopies`:

1. Papel fixo de Dono ou Administrador → `ROLE_FIXED`.
2. `database.command`: `lockCompany`, `admitMember(manageRoles)`, a linha do papel (senão `ROLE_NOT_FOUND`), cada cópia da empresa (senão `COPY_NOT_FOUND`); `tirado` e `novo` contra as linhas do papel; `delete ... returning` de `tirado` com `granted_by` e `granted_at`; `insert` de `novo` (`granted_by` = quem pede, `granted_at` = `statement_timestamp()`).
3. Depois do commit, `reconciled`; se ela lançar, a reposição do passo 5 e o mesmo erro relançado.
4. `DONE` → `COPY_READERS_SET` e 200 com o pedido (decisão G2.8).
5. `FAILED` com `tirado` → numa transação com `lockCompany`, as linhas de `tirado` de volta com os valores guardados (`.onConflictDoNothing()`) e as de `novo` apagadas; passou → `COPY_READERS_FAILED` e 503 `COPY_DATABASE_UNAVAILABLE`; lançou → `COPY_READERS_PENDING` como erro e 503.
6. `FAILED` sem `tirado` → `COPY_READERS_PENDING` como `info` e 200.

Nenhuma transação do Hub fica aberta na chamada ao banco da empresa (D22); o log leva só ids e contagens (S41). Logs novos: `COPY_READERS_SET` (`companyId`, `role`, `by`, `added`, `removed`) e `COPY_READERS_PENDING` (`companyId`, `role`).

- **Cada estado.** O resultado de `reconciled` (`'DONE' | 'FAILED'`) decide por um `switch` com `satisfies never` (code C21).
- **Cada id.** `Role` e `CopyId` pelo esquema da rota (C23, C27).
- **O dono de cada fato.** `ROLE_COPIES_MAX`; a ordem: `setRoleCopies`; `OfRole` em `company-roles.ts` (decisão G2.7).
- **O arquivo modelo.** `grants.ts` e `company-roles.ts` (`admitted`).

### As skills e a leitura

`stack.md`: `fastify` (`:35`, skill `fastify-best-practices`), `drizzle-orm` (`:41`), `zod` (`:34`). A linha de `better-auth` (`:45`) não se aplica: nenhuma chamada da biblioteca muda.

### A ordem do trabalho

1. **Os contratos e a ação.** Critérios: 51, 52.
   - **Arquivos:** muda `packages/hub-api/src/copies.ts`, `company-roles.ts`, `apps/server/src/hub/identity/admission.ts`.
   - **Referência a seguir:** `listCopies` e `updateRole`.
   - **O que entra:** os contratos acima; `seeData` com o comentário no molde dos vizinhos. Regras: code C26, C27, C28.
   - **Testes:** os do passo 3.
   - **Mutações à mão:** `ROLE_COPIES_MAX` por 10.000: critério 51 (o corpo grande).
   - **Pronto quando:** `npm run typecheck` e `npm run openapi > /dev/null` passam.
2. **`listCopyReaders`.** Critérios: 52.
   - **Arquivos:** muda `role-rows.ts`, `identity/public.ts`, `readers.ts`, `service.ts`, `routes.ts`.
   - **Referência a seguir:** `readRoles` (a contagem e os rótulos dos fixos); `serve(app, listCopies, ...)` (`routes.ts:35-37`).
   - **O que entra:** `readingAll`, `readersOf`, `listedReaders`, `copies.readers` em `service.ts` e `serve(app, listCopyReaders, ...)`. Regras: code C8; S10.
   - **Testes:** os casos do critério 52.
   - **Mutações à mão:** tire o filtro de `copiesReadBy` para quem não gere cópias: critério 52 (o membro).
3. **`setRoleCopies`.** Critérios: 43 a 51, 53.
   - **Arquivos:** muda `readers.ts`, `service.ts`, `routes.ts`; cria `readers-routes.test.ts`; muda `scripts/rerun-never.json`.
   - **Referência a seguir:** `grantCopy` do Hub; `admitted`.
   - **O que entra:** os seis passos acima; `serve(app, setRoleCopies, ...)`; o arquivo em `files`. Regras: D22; code C65; S8, S41; T4.
   - **Testes:** `readers-routes.test.ts` pela porta HTTP do Hub de teste (`call`), com estado e corpo literais (T6, T10), o mundo da U3 e o dublê de `reconcileReaders` por `t.mock.method`; o 49 para a primeira aplicação numa promessa aberta pelo teste, depois chama a real; o 46 roda a cópia por `on.copies.run`.
   - **Mutações à mão:** tire a reposição: critério 45; responda 200 no passo 5: critério 45; chame `reconciled` dentro da transação: critério 49 e D22; `log.error` por `log.info` em `COPY_READERS_PENDING`: critério 46; `database.command` por `database.read`: todo caso falha com `25006`; tire `lockCompany`: critério 53 com `23505`.
   - **Pronto quando:** `readers-routes.test.ts`, `roles.test.ts`, `roles-delete.test.ts` e `scripts/rerun-exempt.test.ts` passam.

### Como se prova

- 43 a 53: a rota HTTP do Hub de teste, o banco da empresa lido como o login do papel e `copy_reader` lida no Hub; o 52 também pelo `openapi`. Hoje: 404 do Fastify.

### Parar se

- `reconciled` lançar algo além de `INTERNAL_UNEXPECTED` por `COPY_READER_NAME`: pare e reporte (a reposição só cobre isso).
- Apagar um papel não tomar `lockCompany` no caminho de hoje: pare (decisão G2.4, `company-roles.ts:172-181`).
- O critério 49 só passar com o bilhete pego dentro da transação: pare.

## U5 O membro: `seeData`, `listCopies`, `listCopyRuns` e `sampleCopy` por papel

**Base e modelo.** O `main` com o G1, a U3 e a U4 (mesmo PR). Sonnet: uma admissão, um filtro e um código, no molde da U3 e da U4.

### As linhas da tabela

- **As listas.** `summaries`, `listed`, `runs`, `ofProject` (`apps/server/src/hub/copies/list.ts:129-263`; as admissões `readCopies` em `:136`, `:180`, `:204`, `:250`; `COPY_NOT_FOUND` em `:150`, `:205`); `summaryOf` (`apps/server/src/hub/copies/schedule.ts:92-98`), chamado depois de escritas de quem gere.
- **A amostra.** `sampleOf` (`apps/server/src/hub/copies/sample.ts:10-40`); `sampleCopy` (`packages/hub-api/src/connection-copies.ts:48-69`); `COPY_FAILURES` (`packages/hub-api/src/copy-failures.ts:4`).
- **O que sai.** `readCopyRows` em `admission.ts:122-124`; `CompanyMay` (`packages/hub-api/src/roles.ts:47-56`); `may` (`apps/server/src/hub/identity/companies.ts:98-106`); `NO_MAY` (`apps/server/src/hub/identity/test-roles.ts:122-130`); `developer.test.ts:100-118`; `mayOf` (`apps/web/src/platform/test-may.ts:1-20`); `mayReadRows` (`apps/web/src/hub/copies/copy-detail.tsx:134-136`, `:154`, `:233`, `:244`); a rota (`apps/web/src/routes/_app/companies/$companyId/data.$copyId.tsx:37`).
- **A tela.** `CopySample` e `ReadFailure` (`apps/web/src/hub/copies/copy-sample.tsx:20-31`); `sentenceOfCode` (`apps/web/src/platform/hub.ts:242-244`); o caso de hoje (`copy-sample.test.tsx:54-58`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/list.ts`, `sample.ts`, `service.ts` | Muda | `routes.ts`; `schedule.ts` |
| `apps/server/src/hub/identity/` | Muda: `readCopyRows` sai de `ACTIONS` e de `may` | `getCompany`; os testes |
| `packages/hub-api/src/roles.ts` (dono de `CompanyMay`) | Muda: o campo sai | a web (`may` do contexto da rota) |
| `packages/hub-api/src/copy-failures.ts`, `connection-copies.ts` | Muda: `COPY_NOT_IN_ROLE` | `sampleCopy`; a web por `sentenceOf` |
| `apps/web/src/hub/copies/`, a rota `data.$copyId.tsx`, `apps/web/src/platform/test-may.ts` | Muda | `CopyDetail` |
| `apps/server/src/hub/copies/member-data.test.ts`, `scripts/rerun-never.json` | Cria; muda | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/copy-failures.ts, em COPY_FAILURES (decisão G2.2)
COPY_NOT_IN_ROLE: { category: 'USER', settles: true, status: 403,
  phrase: 'Seu papel não lê esta tabela.', action: 'Peça a quem administra a empresa.', actionKind: 'NONE' },
// packages/hub-api/src/connection-copies.ts: sampleCopy ganha 'COPY_NOT_IN_ROLE' nas falhas
// packages/hub-api/src/roles.ts: CompanyMay perde readCopyRows
```

`summaries`: `admitMember(seeData)`; `manages = allows(role, 'manageCopies')`; `reads = manages ? 'ALL' : copiesReadBy`; `stored` filtrado por `reads`; `only` fora de `reads` → `COPY_NOT_FOUND`. `listed`: quem não gere recebe `proposals: []`, sem ler propostas. `runs`: a mesma conferência antes da página. `sampleOf`: `admitMember(seeData)`; fora de `copiesReadBy`, quem não gere → `COPY_NOT_FOUND` e quem gere → `COPY_NOT_IN_ROLE`; `readerOf`, `NONE` → `COPY_NOT_IN_ROLE`; `TableRead` `NOT_IN_ROLE` → `COPY_NOT_IN_ROLE`. `listCopyModels` e `ofProject` continuam `readCopies`.

- **Cada estado.** O `switch` de `TableRead` em `sampleOf` termina em `satisfies never` (code C21).
- **O dono de cada fato.** A frase: a linha de `COPY_FAILURES`; o que a tela pode: o que a rota admite (C26).
- **O arquivo modelo.** `list.ts` de hoje.

### As skills e a leitura

`stack.md`: `drizzle-orm` (`:41`); na web, `@tanstack/react-query` (`:61`), `vitest` (`:85`), `msw` (`:89`) e o guia web.

### A ordem do trabalho

1. **As listas por papel.** Critérios: 54, 55, 56.
   - **Arquivos:** muda `list.ts`; cria `member-data.test.ts`; muda `scripts/rerun-never.json`.
   - **Referência a seguir:** `summaries` e `runs`; o filtro do catálogo (U3, passo 2).
   - **O que sai:** as admissões `readCopies` de `summaries`, `listed` e `runs` (`list.ts:136`, `:180`, `:204`).
   - **O que entra:** o filtro e as propostas vazias acima. Regras: S10.
   - **Testes:** `member-data.test.ts`, os casos dos critérios 54 a 56 (menos a amostra), pela porta HTTP, com o mundo da U3 e as marcas pela rota da U4; `routes.test.ts` continua passando.
   - **Mutações à mão:** `seeData` por `readCopies`: critério 54 com 404; tire o filtro de `reads`: critério 54 com a tabela a mais; `COPY_NOT_FOUND` por `COPY_NOT_IN_ROLE` para o membro: critério 55.
   - **Pronto quando:** os casos e `routes.test.ts` passam.
2. **A amostra pelo papel.** Critérios: 56, 57.
   - **Arquivos:** muda `sample.ts`, `service.ts`, `copy-failures.ts`, `connection-copies.ts`, `sample.test.ts`.
   - **Referência a seguir:** `sampleOf`; a linha `APP_ACCESS_REFUSED`.
   - **O que sai:** a admissão `readCopyRows` (`sample.ts:20`) e o leitor `{ kind: 'ALL' }` posto pela U3.
   - **O que entra:** o leitor do papel e as recusas acima. Regras: code C21, C26.
   - **Testes:** os casos da amostra em `member-data.test.ts`; `sample.test.ts:45` passa a "a amostra: o membro sem a marca e quem não é da empresa recebem não encontrado": o desenvolvedor sai do caso, porque recebe `COPY_NOT_IN_ROLE` (decisão G2.2).
   - **Mutações à mão:** leia com `ALL` para todo papel: critério 57 (a amostra de Carla não passa pelo login do papel); devolva `COPY_NOT_FOUND` ao desenvolvedor: critério 56.
   - **Pronto quando:** `member-data.test.ts` e `sample.test.ts` passam.
3. **`readCopyRows` sai.** Critérios: 59.
   - **Arquivos:** muda `admission.ts`, `companies.ts`, `test-roles.ts`, `developer.test.ts`, `roles.ts`, `test-may.ts`, `copy-detail.tsx`, a rota `data.$copyId.tsx`, `copy-sample.test.tsx`.
   - **O que sai:** `readCopyRows` de `ACTIONS`, de `CompanyMay`, de `may`, de `NO_MAY`, de `developer.test.ts`, de `mayOf`; a prop `mayReadRows` e as três condições dela; a passagem na rota.
   - **O que entra:** a aba Amostra sempre entre Colunas e Rodadas. O corpo do PR diz que o contrato das telas muda (parte 1, decisão `L6`).
   - **Testes:** `developer.test.ts`; `copy-sample.test.tsx`, o caso do critério 59 com `refusal('COPY_NOT_IN_ROLE')` (`apps/web/src/platform/test-hub.tsx`).
   - **Mutações à mão:** devolva a condição da aba: critério 59.
   - **Pronto quando:** `npm run typecheck`, `developer.test.ts`, `npm run test:unit -w @conexus/web -- src/hub/copies/copy-sample.test.tsx` passam e o `git grep` do critério 59 não mostra nada.

### Como se prova

- 54 a 57: a rota HTTP do Hub de teste e o banco da empresa; hoje o membro recebe 404 em tudo (`readCopies`).
- 59: `getCompany` pela rota; a tela com msw; hoje o desenvolvedor não vê a aba.

### Parar se

- `summaryOf` ser chamado por uma escrita de quem não gere cópias: pare e reporte.
- O critério 59 pedir outro estado que não o `ReadFailure` de hoje: pare; o estado final é da U7.

## G2 O ponto de conferência

Depois de U5, antes do PR, os passos 6 e 7 do `conexus-build`, preparados como no G1: os testes de `apps/server/src/hub/data/` (com `catalog-role.test.ts`); `apps/server/src/hub/copies/readers-routes.test.ts`, `member-data.test.ts`, `readers.test.ts`, `routes.test.ts`, `sample.test.ts`, `catalog-view.test.ts`; `apps/server/src/hub/identity/roles.test.ts`, `roles-delete.test.ts`, `developer.test.ts`; `copy-sample.test.tsx` na web; `scripts/rerun-exempt.test.ts`; `npm run typecheck`, `npm run deps`, `npm run knip`, `npm run openapi > /dev/null`, `npm run migrations -- --base origin/main` e `npm run check`. No Hub local com o dublê do Sankhya: `PUT .../roles/{role}/copies`, o banco da empresa lido como o login do papel (`information_schema.tables`) e a página Dados do membro só com as tabelas dele; uma cópia ligada depois do G2 não aparece ao membro até a marca. As duas leis do papel passam no mundo falso de `packages/hub-api/src/company-data.test.ts`, sem `skip`. pstack `deslop` e `no-comments`; as mutações (T27). O corpo do PR registra a sonda da decisão D com a saída, a mudança de `CompanyMay` e as decisões G2.1, G2.2, G2.5 e G2.9.

## U6 A tela Papéis com o bloco Dados copiados

**Base e modelo.** O `main` com o G2 mesclado. Sonnet: uma tela.

### As linhas da tabela

- **As tabelas marcáveis dentro do papel.** Ler `OpenRole` (`role-editor.tsx:117-161`: a frase do
  Dono em `:130-134`, o envio em `:137-150`, `SubmitButton` só fora de Dono e Administrador em `:155`),
  `Picked` (`:30-51`), `ConnectorPicker` (`role-picker.tsx:104-131`), `Roles`
  (`identity/roles.tsx:92-122`) e a rota (`settings/roles.tsx:28-63`). Seguir o kit passado
  por propriedade (`settings/roles.tsx:58-62`) e `Checkbox` (`ui/checkbox.tsx:8`).
- **Desmarcar não tira a leitura ao vivo.** Ler `sourceOf`, `company-data.ts:250-266`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/routes/_app/companies/$companyId_/settings/roles.tsx` | Muda | o roteador |
| `apps/web/src/hub/identity/roles.tsx`, `role-editor.tsx`, `role-picker.tsx` | Mudam | a rota, por `identity/public.ts:28` |
| `apps/web/src/hub/identity/role-tables.tsx` | Cria | `role-editor.tsx`, `roles.tsx` |
| `apps/web/src/hub/copies/queries.ts`, `public.ts` | Mudam | a rota Papéis; `copy-readers.tsx` (U7) |
| `apps/web/src/hub/identity/roles.test.tsx`, `test-roles.tsx` | Mudam | — |
| `apps/web/sweep-roles-states.ts` | Muda | `sweep-states.ts:38` → `sweep.test.ts` |
| `docs/reference/screens.md` | Muda (`:32`) | — |

### Os contratos que a unidade cria

Nenhuma rota, coluna ou tipo do `hub-api` (são da U4). Na tela:

```ts
// apps/web/src/hub/copies/queries.ts
export function copyReadersQuery(companyId: CompanyId) // hubQuery(listCopyReaders, { params: { companyId } })
export const sendRoleCopies = hubMutation(setRoleCopies)
// apps/web/src/hub/copies/public.ts: export { copiesQuery, copyReadersQuery, sendRoleCopies }

// apps/web/src/hub/identity/role-tables.tsx
export type RoleTable = Readonly<{ id: CopyId; name: string; about: string; readers: readonly Role[] }>
/** By connector id of the kit, the copies of that connector. */
export type RoleTables = Readonly<Record<string, readonly RoleTable[]>>
export type SaveTables = (role: Role, copies: readonly CopyId[]) => Promise<void>
export function CopiedTables(props: {
  tables: readonly RoleTable[]; marked: ReadonlySet<CopyId>; readOnly: boolean
  onChange: (id: CopyId, on: boolean) => void
}): ReactNode
export const LIVE_STAYS: string // a frase da leitura ao vivo

// apps/web/src/hub/identity/roles.tsx
export function Roles(props: {
  kit: readonly ConnectorEntry[]; logo: (entry: ConnectorEntry) => ReactNode
  tables: RoleTables; saveTables: SaveTables
}): ReactNode
// role-picker.tsx: ConnectorPicker ganha children?: ReactNode, desenhado depois dos assuntos
```

- **Cada estado.** As marcas são um `Set<CopyId>` fora do formulário de `updateRole` (W23); o envio tem dois passos e um erro só (`setWriteError`).
- **Cada id.** `CopyId` e `Role` chegam marcados de `listCopyReaders` (C23).
- **O dono de cada fato.** "Dados copiados", "Nenhuma tabela copiada" e
  `LIVE_STAYS` em `role-tables.tsx` (a identidade não importa os textos de `hub/copies`); a lista de leitores, dona `listCopyReaders` (C26).
- **O esquema Zod.** As respostas passam pelo esquema do contrato em `hubQuery` (C27).
- **O arquivo modelo.** `role-picker.tsx` (C21, C23, C26), para `role-tables.tsx`.

### As skills e a leitura

`stack.md`, `apps/web/src`: `router-core` para o carregador e o
endereço (`?role=`), `@base-ui/react` (`node_modules/@base-ui/react/docs/`) para a caixa de marcar,
`react-hook-form` pelo `Form` de `ui/form.tsx`. Impeccable: `layout`, `adapt` e `detect` nos arquivos mudados (`docs/reference/impeccable.md`). Ler antes: W8, W12, W23, W29, W34;
V29; T5, T23, T27.

### A ordem do trabalho

1. **As duas leituras e o envio no lado das cópias.** Critérios: 61, 67.
   - **Arquivos:** muda `hub/copies/queries.ts`, `hub/copies/public.ts`.
   - **Referência a seguir:** `copyModelsQuery` (`hub/copies/queries.ts:66-68`).
   - **O que entra:** `copyReadersQuery` e `sendRoleCopies`; o `MutationCache` de hoje invalida as leituras da empresa (W12). Regras: W10, W11.
   - **Testes:** nenhum próprio; os do passo 3.
   - **Pronto quando:** `npm run typecheck` passa.

2. **A rota passa as tabelas e o envio.** Critérios: 60, 67.
   - **Arquivos:** muda `settings/roles.tsx`.
   - **Referência a seguir:** o carregador `:28-40` e `RolesPage` `:59-63`.
   - **O que entra:** o carregador também garante `copiesQuery` e `copyReadersQuery` no mesmo
     `Promise.all`; `RolesPage` monta `tablesOf(copies, readers)` (por `copy.sources[0].connection.connector`;
     cada cópia com `about = copy.shown.description ?? copy.label` e os `role` que a leem) e
     `saveTables` com `useMutation(sendRoleCopies)`. Regras: W6, W8, W17.
   - **Testes:** o passo 4.
   - **Pronto quando:** a página abre como hoje.

3. **O bloco, as marcas e o envio em duas etapas.** Critérios: 60, 61, 62, 63, 64, 65.
   - **Arquivos:** cria `role-tables.tsx`; muda `role-editor.tsx`, `role-picker.tsx`, `identity/roles.tsx`.
   - **Referência a seguir:** `Subject` e o uso da caixa em `role-picker.tsx`; o envio de `OpenRole`
     (`role-editor.tsx:137-150`); `setWriteError` com `UNCONFIRMED` (`:26`, `:148`).
   - **O que entra:** `Roles` recebe `tables` e `saveTables` e passa a `OpenRole`. Em `OpenRole`, o
     estado das marcas começa com as cópias cujo `readers` tem `role.role`; com `fixed`, todas, e
     `readOnly`. `Picked` passa a `ConnectorPicker`, como `children`, um `CopiedTables` por entrada do
     kit (`tables[entry.id] ?? []`). Abaixo de `Picked`, `<p className="text-text-2">{LIVE_STAYS}</p>`.
     O envio:
     ```ts
     await send.mutateAsync({ params: { companyId, role: role.role }, body: { ... } })
     await saveTables(role.role, [...marked])
     onDone()
     ```
     dentro do mesmo `try`; o `catch` é o `setWriteError(form, error, UNCONFIRMED)` de hoje.  Regras: C21, C26, C37, V29.
   - **Testes:** `roles.test.tsx`, critérios 60 a 65; `test-roles.tsx` serve `listCopies`, `listCopyReaders` e `setRoleCopies` pelo `msw` e anota a ordem dos envios.
   - **Mutações à mão:** inverter os dois `await`: critério 61. tirar `readOnly` do bloco com `fixed`: critério 63. chamar `onDone()` antes de `saveTables`: critério 62.

4. **A falha da leitura, a varredura e a linha de tela.** Critérios: 67, 68, 69.
   - **Arquivos:** muda `identity/roles.tsx`, `roles.test.tsx`, `apps/web/sweep-roles-states.ts`,
     `docs/reference/screens.md`.
   - **Referência a seguir:** o caso de hoje "a lista de papéis não abre" (`roles.test.tsx:261`).
   - **O que entra:** na varredura, o estado do Financeiro aberto.
     Em `screens.md:32`, depois de "the action Publicar agente que escreve sozinho", "the copied tables
     of each system, to mark (read only for Dono and Administrador), and the sentence that unmarking
     does not take the live read away". Regras: W29, W34.
   - **Testes:** `roles.test.tsx`, o caso do critério 67.
   - **Pronto quando:** `npm run test:unit -w @conexus/web -- src/hub/identity/roles.test.tsx` passa e
     `git grep -n "copies/" -- apps/web/src/hub/identity` não acha nada.

### Como se prova

Sem gravação nesta unidade (T26 cabe à U4). 60 a 65 e 67: a página pelo roteador com `msw` (T5); o Hub falso anota os envios e a ordem; hoje falham. 68: `npm run
test:sweep -w @conexus/web` no ponto de conferência, ou a CI. 69: o `git grep` no ponto de conferência.

### Parar se

- `listCopyReaders` no `main` sem Dono e Administrador ou sem `members`: seguir o `main` e reportar; não completar na tela.
- `ConnectorPicker` com `children` mudar a ordem do Tab das operações (V30): pôr o bloco depois do
  `ul` e anotar; não reescrever o seletor.
- Um texto novo parecer errado: vai ao corpo do PR; não trocar.

## U7 A aba Quem lê e a página Dados do membro

**Base e modelo.** O commit da U6 no mesmo ramo, sobre o `main` com o G2 mesclado (U5). Sonnet: telas e regras de exibição.

### As linhas da tabela

- **A aba Quem lê.** Ler `CopyDetail` (`copy-detail.tsx:128-258`: as abas em `:214-255`, o gatilho
  Colunas com a contagem em `:229-232`), `Runs` para a tabela e o celular (`:69-110`), `TableTab`
  (`search.ts:12-20`).
- **O membro vê Dados.** O trilho, `route.tsx:88-95`; a árvore, `route.tsx:141`; as guardas em
  `data.index.tsx:16` e `data.$copyId.tsx:15`; `manageCopiesOrNotFound`, `hub/copies/public.ts:24-27`;
  `DataPage` (`data-page.tsx:35-57`, **Ligar uma cópia** em `:47`); `RawLayer` e `NoSystem`
  (`raw-layer.tsx:104-171`); o menu da linha em `copy-list.tsx:257-259` e `:357`; `RunNowButton` e
  `CopyMenu` no topo, `copy-detail.tsx:187-198`; o vazio da árvore, `data-tree.tsx:225-227`.
- **O endereço de outra tabela.** `readOrNotFound`, `platform/hub.ts:266-280`.
- **A recusa da amostra.** `CopySample`, `copy-sample.tsx:20-31`; `ReadFailure`, `ui/states.tsx:75-82`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/copies/copy-detail.tsx`, `copy-sample.tsx`, `text.ts`, `search.ts` | Mudam | a rota `data.$copyId.tsx`, por `public.ts` |
| `apps/web/src/hub/copies/copy-readers.tsx` | Cria | `copy-detail.tsx` |
| `apps/web/src/hub/copies/data-page.tsx`, `raw-layer.tsx`, `copy-list.tsx`, `data-tree.tsx` | Mudam | `data.index.tsx`; `route.tsx` (a árvore) |
| `apps/web/src/hub/copies/public.ts` | Muda (sai `manageCopiesOrNotFound`) | `data.index.tsx`, `data.$copyId.tsx` |
| `apps/web/src/routes/_app/companies/$companyId/route.tsx`, `data.index.tsx`, `data.$copyId.tsx` | Mudam | o roteador |
| `apps/web/src/hub/copies/test-hub.tsx` e os testes de `hub/copies/` | Mudam e cria `copy-readers.test.tsx` | — |
| `apps/web/sweep-table-states.ts` | Muda | `sweep-states.ts` → `sweep.test.ts` |
| `docs/reference/screens.md` | Muda (`:23`, `:24`) | — |
| `scripts/rerun-never.json` | Muda (uma linha em `files`) | `scripts/rerun-exempt.ts` |

### Os contratos que a unidade cria

Nenhuma rota, coluna ou tipo do `hub-api`. Na tela:

```ts
// apps/web/src/hub/copies/search.ts
export const TableTab = z.enum(['overview', 'columns', 'sample', 'runs', 'readers'])

// apps/web/src/hub/copies/text.ts
export const READERS_TITLE = 'Quem lê'
export const READER_HEADS = ['Papel', 'Pessoas', 'Como lê'] as const
export const READS_ALWAYS = 'sempre'
export const READS_MARKED = 'marcado em Papéis'
export const READERS_NOTE = 'Quem lê esta tabela pela conversa e pelos agentes.'
export const READERS_CHANGE = 'Para mudar, abra o papel.'
export const OPEN_IN_ROLES = 'Abrir em Papéis'
export const NO_TABLE_OF_ROLE = 'Seu papel ainda não lê nenhuma tabela. Peça a quem administra a empresa.'
export const NO_TABLE_OF_ROLE_SHORT = 'Seu papel ainda não lê nenhuma tabela.'
export function peopleText(members: number): string          // "1 pessoa", "2 pessoas"
export function roleTablesText(label: string): string        // "Você vê as tabelas que o papel Vendas lê."

// apps/web/src/hub/copies/copy-readers.tsx
export function ReadersTab(props: {
  companyId: CompanyId; read: UseQueryResult<CopyReaders>; mayChange: boolean
}): ReactNode
export function readersOf(readers: CopyReaders | undefined, copyId: CopyId): CopyReaders['readers'][number]['roles'] | undefined

// apps/web/src/hub/copies/copy-detail.tsx
export function CopyDetail(props: {
  companyId: CompanyId; copyId: CopyId; tab: TableTab | undefined; page?: string; q?: string
}): ReactNode   // may pela rota da empresa (W8)
```



- **Cada estado.** A leitura dos leitores é o `UseQueryResult` (pendente, erro, dado); "Como lê" sai de
  `isFixedRole` restrito a `owner` e `admin` (`packages/hub-api/src/roles.ts:4-41`), nunca do rótulo (C22).
- **Cada id.** `CopyId`, `Role` e `CompanyId` vêm marcados (C23).
- **O dono de cada fato.** As palavras em `text.ts` (C26); quem lê, `listCopyReaders`; a frase da recusa da amostra, a linha de `COPY_FAILURES` (U5).
- **O esquema Zod.** `TableTab` com `.catch(undefined)` em `TableSearch` (C27).
- **O arquivo modelo.** `copy-detail.tsx` (a tabela e as linhas de `Runs`) cumpre C21, C23 e C26.

### As skills e a leitura

`stack.md`, `apps/web/src`: `router-core` (`validateSearch`,
`getRouteApi`, `notFound`), `@tanstack/react-query`, `@base-ui/react` para as abas; `lucide-react`.
Impeccable: `layout`, `adapt` e `detect` nos arquivos mudados. Ler antes: W8, W18, W29,
W30, W31, W34; V29, V34; S10; T5, T23, T27.

### A ordem do trabalho

1. **Apagar as guardas do membro.** Critérios: 70, 71, 73.
   - **Arquivos:** muda `hub/copies/public.ts`, `data.index.tsx`, `data.$copyId.tsx`, `route.tsx`.
   - **O que sai:** `manageCopiesOrNotFound` e os dois `beforeLoad`; `may.manageCopies &&` do item Dados
     (`route.tsx:88`); `&& may.manageCopies` da árvore (`route.tsx:141`). Os testes contrários saem no passo 5.
   - **O que entra:** o 404 do Hub vira não encontrado pelo `readOrNotFound` dos carregadores (`public.ts:36-46`). Regras: C75, S10.
   - **Pronto quando:** `npm run typecheck` passa.

2. **O membro na página Dados, na árvore e no topo da tabela.** Critérios: 70, 72, 73, 74.
   - **Arquivos:** muda `data-page.tsx`, `raw-layer.tsx`, `copy-list.tsx`, `data-tree.tsx`, `copy-detail.tsx`, `text.ts`.
   - **Referência a seguir:** `getRouteApi('/_app/companies/$companyId')` e `useRouteContext()`, como
     `copy-proposal-card.tsx:71`.
   - **O que entra:** com `may.manageCopies` falso: `DataPage` sem `NewCopy`, com
     `roleTablesText(label)` (o rótulo do papel em `copyReadersQuery`); `RawLayer` sem
     `Proposals`, com os sistemas só das cópias e, sem nenhuma, `NO_TABLE_OF_ROLE`
     no lugar de `NoSystem`; `CopyTableRow` e `CopyPhoneRow` recebem `menu: boolean` e sem ele não desenham
     `CopyMenu`; `DataTree` diz `NO_TABLE_OF_ROLE_SHORT` no lugar de `NO_SYSTEM` e
     `NO_TABLE_COPIED`; `CopyDetail` não desenha `RunNowButton` nem `CopyMenu`. Com `may.viewAppData` falso (decisão F, `F1`): `DataTree` não desenha o grupo Apps e `DataPage` não desenha `AppsLayer` (`data-page.tsx:54`); um `?layer=apps` digitado mostra a camada Bruto. Regras: W34, V29.
   - **Testes:** `copy-list.test.tsx`, casos dos critérios 70 e 74; `copy-detail.test.tsx`, 72;
     `data-tree.test.tsx`, 73. `test-hub.tsx` serve `listCopyReaders`.
   - **Mutações à mão:** devolver a condição ao item do trilho: critério 70. desenhar o menu da linha sempre: critério 70. desenhar `RunNowButton` sempre: o caso 72
     falha.

3. **A aba Quem lê.** Critérios: 75, 76, 77, 78.
   - **Arquivos:** cria `copy-readers.tsx`; muda `search.ts`, `text.ts`, `copy-detail.tsx`.
   - **Referência a seguir:** `Runs` (`copy-detail.tsx:69-110`: `Table` no computador, `List` e `Row`
     no celular por `useIsMobile`); o gatilho com contagem (`:229-232`).
   - **O que entra:** em `CopyDetail`, `const readers = useQuery(copyReadersQuery(companyId))` e
     `roles = readersOf(readers.data, copyId)`; o gatilho `READERS_TITLE` depois de Rodadas, com `{' '}`
     e o número só quando `roles` existe; `<TabsContent value={TableTab.enum.readers}>`. `ReadersTab`:
     pendente, `Skeleton`; erro, `ReadFailure` com `sentenceOf`; a tabela com `READER_HEADS`, as pessoas
     em número no computador e `peopleText` no celular, "Como lê" por papel fixo; com `mayChange`
     (`may.manageRoles`), o `Link` `OPEN_IN_ROLES` para `/companies/$companyId/settings/roles` com
     `search={{ role }}` nos papéis que não são `owner` nem `admin`, e `READERS_CHANGE` depois de
     `READERS_NOTE`.
     Regras: C22, W18, W31.
   - **Testes:** `copy-readers.test.tsx` (novo), os casos de 75 a 78.
   - **Mutações à mão:** mostrar o link sem `manageRoles`: critério 76. tirar `readers` do `TableTab`: critério 78. contar só os papéis editáveis no gatilho: critério 75.

4. **A recusa da amostra.** Critérios: 81.
   - **Arquivos:** muda `copy-sample.tsx`.
   - **Referência a seguir:** `deleteFailureText` (`copy-delete.tsx:18-22`) para ler um código.
   - **O que entra:** em `CopySample`, o `HubFailure` com o código da U5 vira `<Alert>{sentenceOf(read.error)}</Alert>`, sem botão; os outros seguem no `ReadFailure`.
     Regras: C26, C48, V29.
   - **Testes:** `copy-sample.test.tsx`, 81.
   - **Mutações à mão:** devolver o `ReadFailure` para o código da U5: critério 81 (aparece **Tentar de novo**).

5. **Os testes que a mudança quebra, a varredura, a lista e a linha de tela.** Critérios: 71, 82, 83.
   - **Arquivos:** muda `copy-list.test.tsx`, `data-tree.test.tsx`, `apps/web/sweep-table-states.ts`,
     `scripts/rerun-never.json`, `docs/reference/screens.md`.
   - **Referência a seguir:** os estados de `sweep-table-states.ts:149-212`.
   - **O que sai:** `copy-list.test.tsx:22-27` ("o membro não tem a entrada e o endereço dá não
     encontrado") e `data-tree.test.tsx:50-55` ("o membro no endereço de Dados fica com as conversas").
   - **O que entra:** o caso 71 (o Hub de teste dá 404 `COPY_NOT_FOUND` à cópia de outro papel;
     a tela, `NotFound` sem o nome); os estados "A tabela, quem lê" e "Dados, o membro"; a linha de
     `copy-readers.test.tsx` em `files`, em ordem; em `screens.md:23` e `:24`, a coluna de quem vê passa a
     "every member (the tables of the role; owner, administrator, developer: all, with Ligar, Rodar
     agora and the row menu)", e a `:24` ganha "the tab Quem lê (the roles that read it, with their
     people and Abrir em Papéis for owner and administrator)". Regras: W29, T5.
   - **Mutações à mão:** responder a cópia de outro papel com o corpo dela: critério 71.
   - **Pronto quando:** `npm run test:unit -w @conexus/web -- src/hub/copies` e `scripts/rerun-exempt.test.ts` passam.

### Como se prova

Sem gravação (T26 não se aplica). 70 a 78 e 81: a tela pelo roteador com `openCopies(server, held, path, role)` (`test-hub.tsx:311-322`), T5; o Hub de teste devolve ao membro a lista já filtrada (a filtragem é da U5, `member-data.test.ts`). Hoje falham (`route.tsx:88`). 82: `npm run test:sweep -w @conexus/web`, ou a CI. 83: `scripts/rerun-exempt.test.ts`.

### Parar se

- A U5 sem tirar `mayReadRows` (`copy-detail.tsx:134`, `data.$copyId.tsx:37`) ou sem o código da recusa: parar e reportar; não criá-lo aqui.
- A camada Apps recusa o membro (`listAppTables` admite quem constrói, `apps/server/src/hub/apps/app-data.ts:47-58`).
  Pela decisão F (`F1`), o grupo e a camada Apps não aparecem a quem a web não deixa construir (o `may` que já guarda a construção de apps; confira o nome no `main`; critério 73).
- O membro de um papel sem tabela não tiver rótulo para `roleTablesText` (nenhuma cópia lista o papel
  dele): mostrar só `NO_TABLE_OF_ROLE` (critério 74) e anotar.
- A varredura a 320 px rolar de lado com cinco abas apesar do `flex-wrap`
  (`copy-detail.tsx:227`): parar com a captura.

## U8 A tabela escondida na conversa, só testes

**Base e modelo.** Os dois casos do servidor: o `main` em `b2c23dc0`. O caso da tela: o `main` com o G3 do
cartão 1 mesclado (U5: `REFUSED_TEXT` e a leitura da recusa por `thrownOf`). Sonnet.

### As linhas da tabela

- **A tabela escondida na conversa.** Ler `tabled` (`apps/server/src/builder/data-tools/tools.ts:145-160`;
  a recusa em `:150`, a razão em `:26`), `listed` (`:128-143`), o mundo de teste (`test-world.ts:47-108`)
  e o caso de hoje "describe de tabela fora do catálogo" (`tools.test.ts:77-87`). Na tela, o bloco "a
  leitura que não passou" (`apps/web/src/builder/assistant/refusals.test.tsx:30-56`) e o caso "cada
  recusa diz o seu texto" da U5 do cartão 1.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/data-tools/tools.test.ts` | Muda (dois casos) | — |
| `apps/web/src/builder/assistant/refusals.test.tsx` | Muda (um caso) | — |
| `scripts/rerun-never.json` | Muda (`tools.test.ts` em `files`) | `scripts/rerun-exempt.ts` |

### Os contratos que a unidade cria

Nenhum. Nenhum arquivo de código muda (emenda (d)). O catálogo de Bruno no teste é o `CATALOG` sem a
tabela `clientes`, montado no próprio arquivo com `Catalog.parse` (o `table` e o `catalogOf` de `test-world.ts` não são exportados).

### As skills e a leitura

`node:test` e `node:assert` no servidor; `vitest`, `@testing-library/react` e `msw` na tela. Ler antes:
T5, T6, T10, T27; S10.

### A ordem do trabalho

1. **Os dois casos do servidor.** Critérios: 84, 85, 87.
   - **Arquivos:** muda `tools.test.ts`, `scripts/rerun-never.json`.
   - **Referência a seguir:** `tools.test.ts:77-87` e `:56-63` (`CatalogShape.parse`).
   - **O que entra:** o caso do critério 84, com `JSON.stringify(result)` sem `clientes` e nenhum `tables[].label` igual ao da tabela; o do 85, com o `thrown` de `clientes` igual, em `kind` e `reason`, ao de `nao_existe`, com `reached.rows` e `reached.query` vazios. O mundo devolve linhas a qualquer tabela (`test-world.ts:76-84`): só o catálogo esconde.
   - **Mutações à mão:** pôr `clientes` no catálogo de Bruno: critérios 84 e 85. em `tools.ts:150`, trocar `NOT_IN_CATALOG` por `NOT_IN_ROLE`: critério 85.
   - **Pronto quando:** `node --test apps/server/src/builder/data-tools/tools.test.ts` passa, pelo
     comando do pacote.

2. **O caso da tela.** Critério: 86.
   - **Arquivos:** muda `refusals.test.tsx`.
   - **Referência a seguir:** `reading(result)` e `toolSaid` (`refusals.test.tsx:21-28`); o caso da U5
     do cartão 1 que grava a recusa lançada.
   - **O que entra:** uma conversa de Bruno com `data_describe({ table: 'sankhya_clientes' })` recusada
     `NOT_IN_CATALOG`; o caso confere a frase e a linha, fechada e aberta, sem `sankhya_clientes`.
   - **Mutações à mão:** fazer o texto da recusa citar a tabela pedida: critério 86.
   - **Pronto quando:** `npm run test:unit -w @conexus/web -- src/builder/assistant/refusals.test.tsx` passa.

### Como se prova

84 e 85: a porta pública das ferramentas (`dataTools`, `runOn`) sobre o contrato real `companyData` com fontes falsas (T5), sem gravação; passam já no primeiro commit (no `main` desde o G1 do cartão 1). 86: a conversa pela tela.

### Parar se

- A linha de `data_describe` da U5 do cartão 1 mostrar, na recusa, o nome da tabela que o agente pediu
  ("Vendo sankhya_clientes"): o critério 86 cai por um texto da U5. Parar e reportar ao firstmate (ponto do fundador: o nome que o agente escreveu pode aparecer?); não mudar `data-specs.ts` aqui.
- O G3 do cartão 1 ainda não estiver no `main`: entrar só com o passo 1 e anotar no PR que o 86 espera.

## U9 Perguntar ao Assistente

**Base e modelo.** O commit da U7 no mesmo ramo. Sonnet.

### As linhas da tabela

- **Perguntar ao Assistente.** Ler `useDraft` (`apps/web/src/builder/conversation/draft.ts:38-75`,
  `append` em `:55-59`), a porta `builder/conversation/public.ts:7`, a caixa do Início
  (`builder/assistant/home.tsx:129-131`), `NewConversation` (`sidebar-conversations.tsx:40-52`), e o
  topo da tabela (`copy-detail.tsx:181-199`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/assistant/ask-about-table.tsx` | Cria | a rota `data.$copyId.tsx`, por `builder/assistant/public.ts` |
| `apps/web/src/builder/assistant/public.ts` | Muda (uma exportação) | rotas |
| `apps/web/src/hub/copies/copy-detail.tsx` | Muda (o espaço `ask`) | a rota |
| `apps/web/src/routes/_app/companies/$companyId/data.$copyId.tsx` | Muda | o roteador |
| `apps/web/src/builder/assistant/ask-about-table.test.tsx` | Cria | — |

### Os contratos que a unidade cria

```ts
// apps/web/src/builder/assistant/ask-about-table.tsx
export const ASK_ASSISTANT = 'Perguntar ao Assistente'
export function aboutTable(name: string): string // "Sobre a tabela sankhya_vendas: "
export function AskAboutTable(props: { companyId: CompanyId; table: string }): ReactNode
// um Link para /companies/$companyId; no clique, useDraft(`start:${companyId}`).append(aboutTable(table))

// apps/web/src/hub/copies/copy-detail.tsx: CopyDetail ganha
ask?: (table: string) => ReactNode   // desenhado antes de Rodar agora, para todo membro
```

- **Cada estado.** O rascunho de hoje.
- **O dono de cada fato.** A frase e o rótulo do link, no Assistente (C26); as chaves, `DraftKey` (`draft.ts:9-14`).
- **O arquivo modelo.** `sidebar-conversations.tsx` (`NewConversation`): cumpre C21, C23 e C26.

### As skills e a leitura

`router-core` para `Link`; `lucide-react` para o ícone (`SendIcon`, como a `v10`). Impeccable `detect` no
arquivo novo. Ler antes: W4, W6, W31; V29, V34; T5, T27.

### A ordem do trabalho

1. **O link no Assistente e o espaço na página.** Critérios: 88, 89.
   - **Arquivos:** cria `ask-about-table.tsx`, `ask-about-table.test.tsx`; muda `builder/assistant/public.ts`,
     `copy-detail.tsx`, `data.$copyId.tsx`.
   - **Referência a seguir:** `NewConversation` (`sidebar-conversations.tsx:40-52`); o kit por propriedade
     (`settings/roles.tsx:58-62`).
   - **O que entra:** `AskAboutTable` com `buttonVariants({ variant: 'secondary' })` (o contorno da `v10`) e `onClick` com `append` antes de o `Link` navegar; a rota passa
     `ask={(table) => <AskAboutTable companyId={companyId} table={table} />}`; `CopyDetail` desenha
     `props.ask?.(copy.name)` antes de `RunNowButton`, fora da condição de `manageCopies`. Regras: W4, W6,
     `hub-does-not-import-builder`, V34.
   - **Testes:** `ask-about-table.test.tsx`, os casos 88 e 89, com o Hub de `hub/copies/test-hub.tsx` e o
     do Assistente (`builder/assistant/test-hub.tsx`), a tabela aberta como membro.
   - **Mutações à mão:** trocar `append` por `change`: critério 89. desenhar o link só com `manageCopies`: critério 88 (como membro).
   - **Pronto quando:** os dois casos passam e `npm run deps` passa.

### Como se prova

Sem gravação (T26 não se aplica). 88 e 89: o roteador, a página da tabela, o Início e a caixa (T5); hoje falham. `npm run deps` prova que `hub/` não
importa `builder/`.

### Parar se

- Os dois Hubs de teste não se compõem num caso só: provar 88 em dois casos (o link leva ao Início; o Início abre com o rascunho `start:` escrito antes, caso novo em `home.test.tsx`) e anotar no PR.
- O Início sem conta de modelo não mostrar o rascunho: anotar com a captura.

## G3 O ponto de conferência

Depois da U9, antes do PR: `npm run test:unit -w @conexus/web -- src/hub/identity/roles.test.tsx
src/hub/copies src/builder/assistant`, os testes de `apps/server/src/builder/data-tools/`,
`scripts/rerun-exempt.test.ts`, `npm run typecheck`, `npm run deps` e `npm run check`;
`npm run test:browser -w @conexus/web -- roles.layout.test.ts tables.layout.test.ts` e
`npm run test:sweep -w @conexus/web` para os critérios 68 e 82 (ou a CI, dito no PR); `git grep -n "copies/" -- apps/web/src/hub/identity` vazio (critério 69).
`npm run quality` inteiro em segundo plano (a CI roda só `quality --fast`). Os passos 6 e 7 da `conexus-build`: `deslop`, `no-comments`, as mutações com o resultado (T27), `impeccable detect` nos arquivos mudados. No Hub local com os dublês, a 1280 e 390 px nos dois temas: como dona, Papéis com o Financeiro aberto, marcar
`sankhya_clientes` e salvar (comparar com `p4-01`); a aba Quem lê de `sankhya_clientes` (`p4-02`); como
Bruno (Vendas), a página Dados e o endereço de `sankhya_clientes` (`p1-11`, não encontrado), a página de
`sankhya_vendas` sem **Rodar agora**, e **Perguntar ao Assistente** até a caixa do Início; como
desenvolvedor, a Amostra de uma tabela fora do papel; como Bruno, "Quantos clientes novos entraram no
mês?" e nenhuma linha da conversa nomeia `sankhya_clientes` (`p4-03` emendada). O corpo do PR lista os textos novos para a palavra do fundador e as linhas da tabela de referência do grupo, e diz que a página Dados do membro troca W30 e W34 (o guia muda no fechamento, L20). Depois do PR, a QA (`conexus-qa`) por um agente que não construiu.

## U10 A mensagem do sistema, do conector até a rodada

**Base e modelo.** O `main` com o G1 e o G2 mesclados (decisão G4.7); o código desta unidade só pede o `main` em `b2c23dc0`. Sonnet: um campo por quatro tipos conhecidos.

### As linhas da tabela

- **O que o kit entrega.** `Native` e `Failure` em `packages/connectors/src/kernel/operation.ts:39-56`; no leitor do Hub, `ReadAnswer` em `apps/server/src/hub/connectors/read.ts:41-45` (só `REFUSED`, `AUTH_REFUSED` e `UNREADABLE` têm `native`; `TOKEN_EXPIRED` chega como `AUTH_REFUSED`, `:59-60`; `BUSY`, `UNREACHABLE` e `DEADLINE` não têm); `NotInRole` em `:35`, sem `native`.
- **O Sankhya falso.** A recusa de `consultar` responde `envelope(service, '0')` (`packages/connectors/src/sankhya/fake.ts:145-146`) com `statusMessage = 'Serviço recusado'` (`fake-data.ts:66-77`), que `gatewayAnswer` lê como `REFUSED { status: 200, code: '0', message: 'Serviço recusado' }` (`answers.ts:168-177`); o corpo ilegível sai `UNREADABLE` com `nativeOf(answer)` (`answers.ts:148-153`); os interruptores em `fake.ts:23-50` e `:216-230`.
- **A recusa até a rodada.** `CopyRefusal` (`copy-port.ts:34`), `CopyRead` (`:45-59`), `sourceFailureOf` (`:160-176`), `refusedRead` (`:178-182`), os outros `FAILED` (`:280-298`); `CopyOutcome` (`apps/server/src/hub/copies/store.ts:78-83`); `DATABASE_DOWN` e `stepOf` (`source-pass.ts:49`, `:166-172`); `ended` (`run.ts:105-153`, o `.set` em `:125-129`, o log em `:140-150`).
- **A limpeza.** `storable` em `apps/server/src/hub/connectors/write-record.ts:314-321`, privada e sobre `unknown`.
- **A tabela.** As colunas e os checks `copy_run_system` e `copy_run_system_message` em `tables.ts:116-139`; `SYSTEM_MESSAGE_MAX` em `packages/hub-api/src/copies.ts:44`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/copies.ts` | Cria `CopySystemMessage` | o servidor (`copy-port.ts`, `store.ts`); a U11 e a U12 |
| `apps/server/src/hub/connectors/` (`copy-port.ts`) | Muda (`CopyRead` `FAILED`, `refusedRead`) | `source-pass.ts`, a prova do Builder (`list-proof.ts`, que lê só o código) |
| `apps/server/src/hub/copies/` (`store.ts`, `source-pass.ts`, `run.ts`, `test-copies.ts`, `run.test.ts`, `run-v2.test.ts`, `run-whole.test.ts`, `describe.test.ts`) | Muda | `copies.run`, o relógio, a prova `describe` |
| `packages/connectors/src/sankhya/fake.ts` | Muda (o interruptor `refuseMessage`) | os testes do servidor e a QA |
| `scripts/rerun-never.json` | Muda (um caso em `tests`) | `scripts/rerun-exempt.test.ts` |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/copies.ts, depois de SYSTEM_MESSAGE_MAX
export const CopySystemMessage = z.object({
  status: z.int(),
  code: z.string().nullable(),
  message: z.string().max(SYSTEM_MESSAGE_MAX).nullable(),
})
export type CopySystemMessage = z.infer<typeof CopySystemMessage>

// apps/server/src/hub/connectors/copy-port.ts, em CopyRead
| Readonly<{ kind: 'FAILED'; code: CopySourceFailure | 'COPY_SOURCE_CEILING'; system: CopySystemMessage | null }>
function systemOf(refusal: CopyRefusal): CopySystemMessage | null   // privada
function storableText(text: string): string                          // privada: sem NUL, sem meio caractere

// apps/server/src/hub/copies/store.ts, em CopyOutcome
| { kind: 'ERROR'; code: CopyRunFailureCode; system: CopySystemMessage | null }

// apps/server/src/hub/copies/run.ts
function systemColumnsOf(outcome: CopyOutcome):
  { systemStatus: number | null; systemCode: string | null; systemMessage: string | null }  // privada

// packages/connectors/src/sankhya/fake.ts, em SankhyaSwitches
/** The `statusMessage` a refused door service answers; the envelope's own when null (passed on as `refuseMessage ?? undefined`, so the default of `fake-data.ts:66-70` holds). */
refuseMessage: string | null
```

- **Cada estado:** `system` é obrigatório em todo `ERROR` (C21, C22): `null` diz que o erro não veio do sistema, ou veio sem código nem mensagem.
- **O dono:** `SYSTEM_MESSAGE_MAX` e `CopySystemMessage` em `packages/hub-api/src/copies.ts` (C26), o número do check.
- **O arquivo modelo:** `copy-port.ts` cumpre C21 e C26.

### As skills e a leitura

`docs/reference/stack.md`: `drizzle-orm` (`apps/server/src`), `orm.drizzle.team/llms.txt`, sem skill; `zod` (`zod.dev/llms.txt`). Ler S40 e S41, T4, T26 e T27.

### A ordem do trabalho

1. **A mensagem na recusa e na rodada.** Critérios: 90, 91, 92, 93.
   - **Arquivos:** muda `packages/hub-api/src/copies.ts`, `copy-port.ts`, `store.ts`, `source-pass.ts`, `run.ts`, `packages/connectors/src/sankhya/fake.ts`, `test-copies.ts` (`runsOf`, `:291-300`, lê as três colunas), `run.test.ts`.
   - **Referência a seguir:** `refusedRead` (`copy-port.ts:178-182`); `storable` (`write-record.ts:314-321`); o `.set` de `ended` (`run.ts:125-129`).
   - **O que entra:** `systemOf`: sem `native`, `null`; com `native`, código e mensagem passam por `storableText`, a mensagem cortada em `SYSTEM_MESSAGE_MAX` e de novo por `toWellFormed()` (o corte pode partir um caractere); sem código nem mensagem, `null`. `refusedRead` leva `system: systemOf(refusal)`; os `FAILED` de `:280-298` levam `system: null`; `stepOf` passa `read.system`; `NO_CONNECTION` e `DATABASE_DOWN` levam `system: null`; `ended` espalha `systemColumnsOf(outcome)` no `.set`. No falso, `refuseMessage` (nulo por padrão) é o quarto argumento de `envelope` na recusa de um serviço da porta. Regras: C21, C27, S41.
   - **Testes:** `run.test.ts`, os casos dos critérios 90 a 92 (`refuse.add('consultar')`, `switches.silent`, `refuseMessage` com 1.500 caracteres e um `\0`), lidos por `runsOf`. Ajuste: as dez asserções `{ kind: 'ERROR', code }` do servidor ganham `system` (`describe.test.ts:119`, `run-v2.test.ts:63`, `:158`, `run-whole.test.ts:73`, `run.test.ts:163`, `:204`, `:207`, `:210`, `:215`, e o `down` de `:280`); só `:163`, `:204` e `run-whole.test.ts:73` levam a mensagem do Sankhya falso; `run-v2.test.ts:165` lê pela rota e muda na U11. Ache-as com `git grep -n "kind: 'ERROR', code" apps/server/src`.
   - **Mutações à mão:** em `systemOf`, `null` para `REFUSED`: critério 90. Tire o corte: critério 92, no check `copy_run_system_message`. Devolva `{ status, code: null, message: null }` em vez de `null` sem texto: critério 93 (`:207`). Tire `storableText`: critério 92, pelo NUL.
   - **Pronto quando:** `run.test.ts`, `run-v2.test.ts`, `run-whole.test.ts`, `describe.test.ts` e `npm run typecheck` passam.
2. **A mensagem fora do log.** Critério: 94.
   - **Arquivos:** muda `run.test.ts`, `scripts/rerun-never.json`.
   - **Referência a seguir:** `hubLog` (`test-copies.ts:210-215`); o caso `'o erro não vira vazio'`, que já procura dados em `JSON.stringify(on.hub.lines)` (`run.test.ts:269`).
   - **O que entra:** o caso do critério 94, por `JSON.stringify(line)` de cada linha de `on.hub.lines`, em `tests` de `scripts/rerun-never.json` (T4). Regras: S41.
   - **Testes:** o caso acima.
   - **Mutações à mão:** ponha `systemMessage` nos campos de `COPY_RUN_ENDED`: critério 94.
   - **Pronto quando:** o caso e `scripts/rerun-exempt.test.ts` passam.

### Como se prova

- 90 a 93: `copies.run` sobre o Sankhya falso e o banco da empresa de teste; a prova é a linha de `copies.copy_run` por `runsOf` (T26). Hoje 90, 92 e 93 falham (colunas nulas); 91 passa, e o tipo novo obriga o campo.
- 94: o log capturado do Hub de teste; hoje passa, e o caso a guarda.

### Parar se

- Um log que esta unidade não escreve (por exemplo `CONNECTOR_CALLED`) já levar "Serviço recusado": pare e reporte; não mude o log do executor.
- O corpo ilegível do falso chegar com um código ou uma mensagem em `native`: o critério 93 usa outro caso sem texto; reporte qual.
- Um `FAILED` ou `ERROR` no `main` além dos citados leva `system: null`, e o PR diz qual.

## U11 A mensagem do sistema na aba Rodadas

**Base e modelo.** O `main` do G4 com a U10 (mesmo PR, commit anterior), rebaseado sobre o G3 mesclado, que muda
`copy-detail.tsx` e `text.ts` antes. Sonnet: um campo e uma linha na tela, como a "Passada inteira" do cartão 1.

### As linhas da tabela

- `CopyRun` em `packages/hub-api/src/copies.ts:46-60` (o `ERROR` em `:55`).
- `runOf` em `apps/server/src/hub/copies/list.ts:37-59` (o `ERROR` em `:54-55`); o caso `'a lista e as rodadas'` em `routes.test.ts:123`.
- `RunRow` e `RunPhoneRow` em `apps/web/src/hub/copies/copy-detail.tsx:40-66`; `outcomeText` e `systemText` em `text.ts`; `copyRun` em `test-hub.tsx:46-57`; os casos de `copy-detail.test.tsx:15`, `:55` e `:65`.
- As rodadas escritas à mão: `copy-detail.test.tsx:23`, `:138`, `:153`, `copy-details.test.tsx:55`, `copy-list.test.tsx:64`, `apps/web/sweep-copies-states.ts:39`, `apps/server/src/builder/data-tools/test-world.ts:50`, `run-v2.test.ts:165`.
- A captura do kit `b1-rodadas-sistema` (spec da passada, matriz da QA).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/copies.ts` | Muda (`CopyRun.outcome` `ERROR`) | o servidor e a web; o contrato de dados o leva em `kept.lastRun` (`company-data.ts:40`), lido pela trilha Agentes e Apps (L27) |
| `apps/server/src/hub/copies/` (`list.ts`, `routes.test.ts`, `run-v2.test.ts`) | Muda | as rotas de cópias e de rodadas |
| `apps/server/src/builder/data-tools/test-world.ts` | Muda (o `ERROR` de `:50` ganha `system: null`) | os testes das ferramentas de dado |
| `apps/web/src/hub/copies/` (`copy-detail.tsx`, `text.ts`, `copy-detail.test.tsx`, `copy-details.test.tsx`, `copy-list.test.tsx`) | Muda | a página da tabela |
| `apps/web/sweep-copies-states.ts` | Muda (`system: null`) | a varredura das cópias |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/copies.ts, em CopyRun.outcome
z.object({ kind: z.literal('ERROR'), code: CopyRunFailureCode, system: CopySystemMessage.nullable() })

// apps/web/src/hub/copies/text.ts
/** What the source system said, as the run line shows it: "{status} · {message}", or its code without a message. */
export function systemSaid(system: CopySystemMessage): string
```

- **Cada estado:** o `ERROR` separa "o sistema disse" (objeto) de "não disse" (`null`) (C22).
- **O dono do texto:** `systemSaid` em `text.ts` (C26); "{status} · {mensagem}" é do requisito 3 da passada, aprovado pelo fundador no fim da etapa (`text.ts:12`).
- **O esquema:** `runOf` passa as três colunas por `CopySystemMessage.parse` (C27).
- **O arquivo modelo:** `list.ts` (`runOf`) cumpre C21 e C27.

### As skills e a leitura

`docs/reference/stack.md`: `react`, `@tanstack/react-query` (`apps/web/src`); `@shadcn/react` (`apps/web/src/ui`), skill `shadcn`, só para a `TableCell`. Ler as regras W de texto e de estado da página da tabela e code C79 (a mensagem do sistema como veio).

### A ordem do trabalho

1. **O campo no contrato e na rota.** Critério: 100.
   - **Arquivos:** muda `packages/hub-api/src/copies.ts`, `list.ts`, `routes.test.ts`, `run-v2.test.ts` (`:165`), `test-world.ts`, `apps/web/sweep-copies-states.ts` e cada rodada escrita à mão que o `typecheck` apontar.
   - **Referência a seguir:** `runOf`, `list.ts:54-55`; o caso de rodadas de `routes.test.ts:123` e `runsPage`.
   - **O que entra:** no `ERROR` de `runOf`, `system` é `null` com `systemStatus` nulo; senão `CopySystemMessage.parse({ status, code, message })` das colunas. O PR cita L27. Regras: C27.
   - **Testes:** `routes.test.ts`, o caso do critério 100: uma rodada recusada (`on.fake.switches.refuse.add('consultar')`) e uma sem resposta (`switches.silent`).
   - **Mutações à mão:** `system: null` fixo em `runOf`: critério 100.
   - **Pronto quando:** o caso, `npm test -w @conexus/hub-api` e `npm run typecheck` passam.
2. **A linha embaixo da frase.** Critérios: 101, 102, 103.
   - **Arquivos:** muda `copy-detail.tsx`, `text.ts`, `copy-detail.test.tsx`, `copy-details.test.tsx`, `copy-list.test.tsx`.
   - **Referência a seguir:** o `text-text-2` e a marca `WHOLE_PASS` em `copy-detail.tsx:49` e `:61`.
   - **O que entra:** `systemSaid` junta com " · " o status e `message ?? code`, sem os nulos. Em `RunRow`, com `run.outcome.kind === 'ERROR'` e `system` não nulo, um `<span className="block text-text-2">` com `systemSaid` depois do resultado e da marca; em `RunPhoneRow`, um terceiro `<span className="break-words text-text-2">`. Regras: C26, C79, as regras W de texto.
   - **Testes:** os casos dos critérios 101 a 103, na forma de `:55` e `:65`.
   - **Mutações à mão:** mostre o código antes da mensagem: critério 102. Mostre a linha também com `system: null`: critério 103. Tire a linha do celular: critério 101.
   - **Pronto quando:** `npm run test:unit -w @conexus/web -- copy-detail.test.tsx copy-details.test.tsx copy-list.test.tsx` passa.

### Como se prova

- 100: a rota de rodadas sobre a gravação da U10, pela porta HTTP do Hub de teste; hoje falha.
- 101 a 103: a tela com o servidor falso do Hub (`openCopies`); hoje falham.

### Parar se

- A célula do resultado com marca de outra unidade: a linha vai por último; informe.
- A mensagem longa quebrar a largura da tabela a 1280 px: não corte na tela; reporte com a captura (decisão E).

## U12 A ferramenta `copy_runs` e a sua linha na conversa

**Base e modelo.** O `main` do G4 com a U11 (mesmo PR), sobre o G2 mesclado. Sonnet: uma ferramenta como `overviewTool` e uma porta como as do Assistente; a admissão é a da U5.

### As linhas da tabela

- **A ferramenta.** `overviewTool` em `apps/server/src/builder/assistant/overview.ts:18-46` (o escopo por `scopeOf(requestContext)`, a falha sem conversa em `:31-36`); `@mastra/core@1.82.0` `dist/docs/references/reference-tools-create-tool.md:59` e `:93`.
- **A montagem.** `Deps` em `assistant.ts:112-130` (`handOffs` atrasado em `:128`); `overviewTool(...)` em `:207-217`; `tools:` em `:251-264`; `AVAILABLE_TOOLS` em `:85-101`, que já espalha `Object.values(ASSISTANT_TOOL)` (`:94`); `ASSISTANT_TOOL` em `packages/hub-api/src/assistant.ts:13-20`.
- **A porta pela raiz.** `ConversationsDeps.copies` em `apps/server/src/conversations-of.ts:161-162`; `createAssistant(...)` em `:191-197`; `copies: lateCopies` em `apps/server/src/main.ts:163`; `AssistantProjects` em `ports.ts:5-18`; a regra em `.dependency-cruiser.cjs:20-22`, `:101-110`.
- **O que a ferramenta lê.** `listed` e `runs` em `apps/server/src/hub/copies/list.ts:174-228` (como a U5 os deixa); `createCopyService` em `service.ts:49`, `:52`; `COPY_FAILURES` em `packages/hub-api/src/copy-failures.ts:4`; `CopySummary` em `copies.ts:72-91`; `CopySource` em `copy-shown.ts:6-8`.
- **A recusa.** `DataRefused` e `refused` em `apps/server/src/builder/data-tools/tools.ts:16-49`.
- **O teste.** `assisting` (`apps/server/src/builder/assistant/test-assistant.ts:74-141`, o segundo argumento dá os passos do modelo; o terceiro, o Sankhya servido); `releasing` (`apps/server/src/hub/copies/test-released.ts:49-91`); `tool` (`builder/conversation/test-questions.ts`); `toolResults` (`apps/server/src/platform/test-anthropic-body.ts:38`, `:145`); o uso em `apps/server/src/builder/data-tools/mounted.test.ts:56-60`, `:106-107`; `memberOn` (`hub/identity/test-hub.ts`); o papel criado e marcado como os testes da U5 fazem.
- **A linha.** `ASSISTANT_SPECS` em `apps/web/src/builder/conversation/assistant-specs.ts:16-71` (a de `conexus_overview` em `:24-32`); o caso de `tool-row.test.tsx:185-216`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/assistant.ts` | Muda (`ASSISTANT_TOOL.copyRuns`) | o servidor (`AVAILABLE_TOOLS`, a ferramenta) e a web (`ASSISTANT_SPECS`, `tool-row.test.tsx`) |
| `apps/server/src/builder/assistant/` | Cria `copy-runs.ts`, `copy-runs.test.ts`; muda `ports.ts`, `assistant.ts`, `assistant.test.ts` (a lista exata ganha `copy_runs`) | `conversations-of.ts:191` |
| `apps/server/src/conversations-of.ts` | Muda (`ConversationsDeps.copies` ganha `list` e `runs`; `createAssistant` recebe `copies`) | `main.ts:158` |
| `apps/web/src/builder/conversation/` (`assistant-specs.ts`, `tool-row.test.tsx`) | Muda | a linha da conversa |
| `scripts/rerun-never.json` | Muda (o caso do critério 114 em `tests`) | `scripts/rerun-exempt.test.ts` |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/assistant.ts, em ASSISTANT_TOOL
copyRuns: 'copy_runs',

// apps/server/src/builder/assistant/ports.ts
/** What the Assistant reads of the company's copies, through the copies' service wired at the root (code C4). */
export type AssistantCopies = {
  list(input: { companyId: CompanyId; personId: PersonId; named: readonly CopyProposalId[] }):
    Promise<{ copies: CopySummary[] }>
  runs(input: { companyId: CompanyId; personId: PersonId; copyId: CopyId; page: string | undefined }):
    Promise<{ copy: CopySummary; runs: CopyRun[] }>
}

// apps/server/src/builder/assistant/assistant.ts, em Deps
/** The copies are made after the conversations; a turn comes long after both. */
copies: () => AssistantCopies

// apps/server/src/conversations-of.ts, em ConversationsDeps
copies: () => Pick<CopyService, 'run' | 'projectView' | 'list' | 'runs'>

// apps/server/src/builder/assistant/copy-runs.ts
export function copyRunsTool(deps: {
  scopeOf: (requestContext: RequestContext) => Promise<SessionScope | undefined>
  copies: () => AssistantCopies
}): Tool                                   // id ASSISTANT_TOOL.copyRuns; inputSchema z.object({ table: z.string().min(1).max(63) })
type CopyRunsAnswer = {
  kind: 'RUNS'
  copy: { name: string; connections: string[]; schedule: CopySchedule; interval: CopyInterval | null }
  runs: ToolRun[]                          // no máximo 5, a mais nova primeiro
}
type ToolRun = {
  startedAt: string; endedAt: string | null
  outcome: CopyRun['outcome']['kind']
  failure: { code: CopyRunFailureCode; phrase: string; action: string } | null   // de COPY_FAILURES, só no ERROR
  whole: boolean
  system: CopySystemMessage | null
}
// a falha: class CopyRunsRefused extends Error, a mensagem é o JSON
// { kind: 'NOT_FOUND', status: null, code: null, message: null, body: null, reason }
```

A descrição para o modelo, em inglês como as outras: "The latest runs of one of the company's copies, by its table name in sync: when each ran, how it ended, the Conexus sentence and what to do, whether it reread everything, and what the source system said when it refused. Use it when someone asks why a copy failed or stopped." O `reason` do `NOT_FOUND`: "No copy has this table name. Call data_describe to list the tables."

- **Cada estado:** o resultado é um só (`RUNS`); a recusa é a falha da ferramenta (C21, code C79).
- **Cada id:** a cópia achada pelo nome passa `CopySummary.id` a `runs` (C23); o modelo nunca vê id.
- **O dono:** `phrase` e `action` de `COPY_FAILURES` (C26), o texto da aba Rodadas.
- **O arquivo modelo:** `overview.ts` cumpre C21 e C26.

### As skills e a leitura

`docs/reference/stack.md`: `@mastra/core` (`apps/server/src/builder`), skill `mastra`, `node_modules/@mastra/core/dist/docs/`; `lucide-react` (`apps/web/src`), `lucide.dev/llms.txt`. Ler S10, T4, T5 e T10, code C4 e C79.

### A ordem do trabalho

1. **A porta e a montagem.** Critérios: 110, 117.
   - **Arquivos:** muda `packages/hub-api/src/assistant.ts`, `ports.ts`, `assistant.ts`, `conversations-of.ts`, `assistant.test.ts`; cria `copy-runs.ts` com o esqueleto.
   - **Referência a seguir:** `handOffs: () => handOffsOf(...)` (`conversations-of.ts:196`); `const overview = overviewTool(...)` (`assistant.ts:207`).
   - **O que entra:** `copies: deps.copies` em `createAssistant`; em `assistant.ts`, `copyRunsTool({ scopeOf, copies: deps.copies })` uma vez, e `[ASSISTANT_TOOL.copyRuns]: copyRuns` em `tools:` para todo papel, ao lado de `overview`. `main.ts` não muda (`lateCopies` já entrega o `CopyService`). Regras: code C4.
   - **Testes:** os do critério 110 (o membro conversa como em `member.test.ts:13-33`; `Sent.tools` tem `copy_runs`).
   - **Mutações à mão:** monte a ferramenta só com `may.manageCopies`: critério 110 (o membro). Importe o tipo `CopyService` em `copy-runs.ts`: critério 117.
   - **Pronto quando:** os dois casos, `npm run deps` e `npm run typecheck` passam.
2. **As rodadas e a recusa.** Critérios: 111, 112, 113, 114, 115.
   - **Arquivos:** muda `copy-runs.ts`, `copy-runs.test.ts`, `scripts/rerun-never.json`.
   - **Referência a seguir:** `overview.ts:30-41`; `refused` (`data-tools/tools.ts:40-49`).
   - **O que entra:** sem escopo, a falha `INTERNAL_UNEXPECTED` com `reason: 'COPY_RUNS_WITHOUT_CONVERSATION'`, como `overview.ts:31-36`. Com escopo, `copies().list({ companyId, personId, named: [] })`; nenhuma cópia com `name === table` lança `NOT_FOUND`; achada, `copies().runs({ ..., copyId, page: undefined })`, e um `COPY_NOT_FOUND` dela lança o mesmo `NOT_FOUND`; as outras falhas sobem como vieram. O resultado leva as cinco primeiras rodadas por `toolRunOf`. O caso do critério 114 entra em `tests` de `scripts/rerun-never.json`. Regras: S10, code C53, C79.
   - **Testes:** `copy-runs.test.ts`, pela porta HTTP do Hub de teste, com o modelo em passos (`[[tool('copy_runs', { table })], [said('Pronto.')]]`) e o resultado ou a falha em `toolResults` da última chamada, os casos dos critérios 111 a 115: o 111 com o Sankhya falso servido a `assisting`, `releasing` de `vendas` e `clientes`, uma rodada completa e uma com `refuse.add('consultar')` por `hub.copies.run`; o 113 e o 114 com um papel criado que lê `sankhya_vendas` e não `sankhya_clientes`, marcado pela rota da U4.
   - **Mutações à mão:** procure a tabela em todas as cópias da empresa, não na lista do papel: critério 114. `slice(0, 7)`: critério 112. Responda `COPY_NOT_FOUND` em vez de `NOT_FOUND`: critério 114 (corpos diferentes).
   - **Pronto quando:** `copy-runs.test.ts`, `assistant.test.ts` e `scripts/rerun-exempt.test.ts` passam.
3. **A linha na conversa.** Critério: 116.
   - **Arquivos:** muda `assistant-specs.ts`, `tool-row.test.tsx`.
   - **Referência a seguir:** a entrada `conexus_overview` (`assistant-specs.ts:24-32`).
   - **O que entra:** `[ASSISTANT_TOOL.copyRuns]` com `icon: HistoryIcon`, `running: 'Lendo as rodadas da cópia'`, `done: 'Leu as rodadas da cópia'`, `failed: 'Não conseguiu ler as rodadas'`, `verb: 'leu as rodadas'`, `body: 'generic'`, `groups: true`. Regras: C26.
   - **Testes:** os do critério 116.
   - **Mutações à mão:** troque `done`: critério 116.
   - **Pronto quando:** `npm run test:unit -w @conexus/web -- tool-row.test.tsx` passa.

### Como se prova

- 110: o corpo mandado ao dublê do modelo (`Sent.tools`). 111 a 115: um turno do Assistente pela porta HTTP do Hub de teste, com as rodadas da U10 e a admissão da U5; a prova é o `tool_result` devolvido ao modelo (T26). 116: a linha na tela com o dublê da conversa. Hoje todos falham.
- 117: `npm run deps`.

### Parar se

- `assisting` não aceitar o Sankhya falso com os interruptores (o terceiro argumento): use o falso do ajudante, reporte o que falta e não monte o Hub à mão.
- A U5 deixar o membro de papel fixo sem como ler uma tabela no teste: use o papel criado e informe.
- `copies.list` pesar demais num turno de empresa grande: reporte com a medida; não acrescente leitura ao `CopyService`.
- A ferramenta precisar de uma frase nas instruções do Assistente: pare; a descrição é o lugar (`reference-tools-create-tool.md:59`).

## G4 O ponto de conferência

Depois da U12, os passos 6 e 7 do `conexus-build`: `run.test.ts`, `run-v2.test.ts`, `run-whole.test.ts`, `describe.test.ts`, `routes.test.ts`, `copy-runs.test.ts`, `assistant.test.ts`, `mounted.test.ts` (o `kept.lastRun` com o campo novo); `copy-detail.test.tsx`, `copy-details.test.tsx`, `copy-list.test.tsx`, `tool-row.test.tsx`; `npm test -w @conexus/hub-api`; `scripts/rerun-exempt.test.ts`; `npm run deps` e `npm run check`. No Hub local, com o Sankhya falso recusando `consultar`, a aba Rodadas mostra "200 · Serviço recusado" a 1366 e 390 px, nos dois temas, ao lado da captura `b1-rodadas-sistema`; o Assistente, perguntado "por que a cópia de vendas parou?", chama `copy_runs` e a linha diz "Leu as rodadas da cópia". pstack `deslop` e `no-comments`; as mutações, com o resultado no PR (T27). O PR cita L27 (`CopyRun` e `ASSISTANT_TOOL`). As três frases da linha e "{status} · {mensagem}" vão à palavra do fundador no fim da etapa.
