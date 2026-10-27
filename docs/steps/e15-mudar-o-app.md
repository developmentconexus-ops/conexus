# Etapa 15: Mudar o app

## A página do fundador

**No fim desta etapa** você pede ao Builder para mudar um app que já tem dados guardados (trocar
um campo, tirar um campo, tornar um campo obrigatório) e nada do que foi guardado se perde: o
**Voltar** para a versão de ontem continua abrindo. Quando uma mudança não entra, a conversa diz o
motivo em palavras, sem nenhum valor guardado, e um botão leva esse motivo ao Builder.

**O roteiro de uso.** Padaria Sol, com Ana (dona), no computador e no celular. O "Encomendas" está
na **Prévia** com três encomendas: Maria, (11) 99999-0000, bolo de cenoura; João, sem telefone;
Carla, (11) 99999-0000, torta de limão.

1. "Troque o telefone por WhatsApp." No plano, em **Dados salvos**: "o telefone de cada encomenda
   passa para o WhatsApp; nada é apagado". Ana aprova. A Prévia recarrega com a Maria e a Carla no
   WhatsApp e o João vazio.
2. "Tire o campo produto." O campo some das telas, e o plano diz "o que já foi guardado fica
   guardado".
3. "Telefone obrigatório." O formulário passa a pedir o WhatsApp numa encomenda nova. O João
   continua lá.
4. Na aba **Versões**, Ana volta para a versão de ontem com **Voltar**. Ela abre e grava como antes.
5. "Não pode repetir WhatsApp", com a Maria e a Carla no mesmo número. O banco recusa e nada muda.
   A conversa mostra "Prévia não atualizada", o motivo ("valor repetido, tabela encomenda, regra
   encomenda_whatsapp_key"), sem o número, e o botão **Pedir ao Builder para corrigir**. Ana toca
   nele, o motivo aparece na caixa de escrever, ela acrescenta "mantenha só a encomenda mais nova
   com esse número" e envia. No Neon, a tabela e a regra chegam só se o proxy as devolver, e isso se
   prova na 22; sem elas, o motivo diz só "valor repetido".
6. No celular, o mesmo.

Se o Builder escrever uma migração que apaga, renomeia, sobrescreve um valor salvo ou deixaria a
versão anterior sem abrir, a versão não entra e nada muda no banco: a conversa mostra o motivo e o
mesmo botão.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. No fim: faz o roteiro no
computador e no celular, diz o que viu e aprova os textos novos (o motivo e o botão). A garantia
roda no Neon de verdade pela primeira vez na verificação ao vivo ([L17](../guides/delivery.md)); se
ela recusar ali toda migração, a etapa não fecha e se conserta como `v0.15.1`.

**Fica de fora.**
- **O guia dentro do turno** (a recusa na conferência, com a saída segura por motivo): sai pela sua
  escolha "Enxuta", 2026-10-27. A skill ensina o jeito certo, o Hub garante no envio, e o botão traz
  o motivo de volta. O custo aceito: um erro do Builder custa à Ana uma volta com o botão, em vez de
  uma volta escondida no turno. Pelo mesmo motivo, a migração já aplicada que muda continua
  recusada no envio, como hoje, e não mais "já na máquina" (resposta 4 de 2026-10-22).
- **A prova ao vivo no Neon de teste (C)**: vai para a etapa 22, Ensaio geral; o fechamento desta
  etapa acrescenta a linha no roteiro. O primeiro envio da verificação ao vivo da 15
  ([entrega L17](../guides/delivery.md)) já roda a garantia no Neon de verdade.
- **Apagar de verdade** (a porta 15.1): na 15 nada se apaga; o Builder diz isso à pessoa (resposta
  de 2026-10-22, "B, a etapa seguinte").
- O ensaio da migração num ramo do Neon (resposta 3 de 2026-10-22), até a 17.
- Views: seguem recusadas (P3 de 2026-10-22); a #254 espera, porque nenhuma migração de app cria view.
- Das issues `next-card`: a #359 espera (lacuna aceita; o Hub a pega como migração mudada); a #274
  e a #275 são do `migrate` do Hub, não dos apps. As outras não tocam estas pastas.

**As decisões suas nesta etapa.** Todas dadas:
- **Enxuta**, 2026-10-27: só a garantia, o texto da skill e o botão.
- **A1**, embrulhado, "Aprovado", 2026-10-27: o botão sob a versão recusada põe na caixa o motivo
  (tabela, coluna e regra, nunca um valor), e a Ana manda. O erro nativo do Neon (`NeonDbError`)
  traz esses campos; o nosso filtro tira o resto. Assim faz o bolt.diy.
- **B na forma nova**, embrulhado, "Aprovado", 2026-10-27: a garantia é o resultado, conferido na
  transação do envio que já existe (uma foto antes das migrações pendentes, uma comparação depois).
  Uma lista fixa fica só para o que roda depois da transação: funções com poder, permissões,
  controle de transação. A lista diz o que pode passar, e o resto é recusado (a revisão do cartão
  achou que uma lista do que não pode deixava passar a segurança por linha). A skill ensina, o Hub
  garante; nada entra no prompt do Builder.
- **Preencher só o vazio (o caso Sa4), sim**, 2026-10-27: preencher só o que está vazio passa, porque nada se perde.
- As respostas de 2026-10-22 seguem valendo, menos a parte "já na máquina" da 4 (acima).

Nenhuma decisão aberta.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | A garantia no envio: a foto e a comparação na transação das migrações (`CX001`, `CX002`); a lista fixa do que pode passar, lida pelo Hub nas migrações pendentes, que substitui `SESSION_CONTROL` | `apps/server/src/platform/`, `apps/server/src/main.ts`, `apps/server/src/hub/apps/`, `apps/server/package.json`, `packages/hub-api/src/`, `packages/app-contract/src/manifest.ts`, `scripts/removals.json`, `docs/reference/stack.md`, `package-lock.json` | dados | — |
| U2 | O texto: a skill `conexus-data` ensina acrescentar e copiar; o plano de mudança perde "e só então remover" | `packages/app/skills/` | — | — |
| U3 | O motivo volta (A1): `table`, `column` e `constraint` da recusa, sem valor, na parte da Prévia; o botão que leva o motivo à caixa | `apps/server/src/platform/company-postgres.ts`, `apps/server/src/hub/apps/`, `packages/hub-api/src/`, `apps/web/src/builder/conversation/` | web | U1 |

**A entrega.** Cada unidade é o seu próprio pull request sobre o `main` com as anteriores já
dentro ([entrega L9](../guides/delivery.md)): CI verde, uma revisão por um revisor Opus, e o
firstmate a junta ao `main`, uma de cada vez ([L13](../guides/delivery.md)). A ordem é U1, U2, U3:
a U3 muda `company-postgres.ts` depois da U1. A U2 não divide pasta com nenhuma e pode ser
construída ao lado da U1.

**Orçamento de código alterado.** U1 ~200 (a garantia é SQL; −15 de `SESSION_CONTROL`); U2 ~12
linhas de texto; U3 ~150. Total da etapa: ~360 linhas sem testes, teto 4.000
([L2](../guides/delivery.md)). Pacote novo: `libpg-query` 18.1.5, exato, em `apps/server`
([L16](../guides/delivery.md)).

## Os critérios de aceite

Os casos vêm do estudo de casos (P1 a P9, O1 a O6, Sa1 a Sa6, cada um com a migração de hoje e a
reescrita, mais `truncate`, `doBlock`, `dropDefault`, `checkNotValid`, `P7_soltar`, `varcharWiden`,
`definer`, `fnDelete`, `grant`, `begin`, `set`, `view`) e da revisão do cartão (`json_noop`,
`json_add_column`, `json_overwrite`, `xml_point_kept`, `fkNotValid`, `textToVarchar3`, `intToBigint`,
e as sondas da lista do critério 4), num arquivo só de teste,
`apps/server/src/platform/test-migration-cases.ts`. O resultado da garantia está provado no
PostgreSQL 18.6 (45 casos, 45 certos com o SQL abaixo), e o da lista no `libpg-query` 18.1.5 (nenhum
dos 45 recusado; nenhuma sonda do lado errado).

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Uma versão cuja migração renomeia ou apaga uma coluna ou tabela salva (P1, P2, O1, O2, O5, Sa2, Sa3), ou a deixa obrigatória sem valor padrão (`dropDefault`), ou põe uma regra nova sobre coluna salva (`checkNotValid`, P7, a chave estrangeira `fkNotValid`), ou troca o tipo de uma coluna salva por um com limite ou que a versão anterior lê diferente (`textToVarchar3`, `intToBigint`), não entra: a transação recusa com `CX001`, o livro `conexus_migration` e as tabelas ficam como estavam | `apps/server/src/platform/company-postgres.test.ts`, "garantia: o que quebraria o Voltar é CX001 e nada muda" | must |
| 2 | U1 | Apagar linhas ou sobrescrever um valor salvo (P8, P9, `truncate`, `json_overwrite`) é recusado com `CX002` | `company-postgres.test.ts`, "garantia: valor salvo que some ou muda é CX002" | must |
| 3 | U1 | O que não perde nada passa e grava: todas as reescritas, O4, `varcharWiden`, Sa4 (`UPDATE … WHERE duracao_min IS NULL`), `P7_soltar`, Sa5, Sa6; uma tabela com colunas `json`, `point` e `xml` salvas não trava as migrações seguintes (`json_noop`, `json_add_column`, `xml_point_kept`); depois, a leitura e a gravação da versão anterior funcionam no banco migrado | `company-postgres.test.ts`, "garantia: as reescritas, O4, Sa4, soltar a regra e as colunas json passam, e a versão anterior lê e grava" | must |
| 4 | U1 | Passa só o que a lista permite: criar tabela comum, índice, gravar linhas, as mudanças de coluna e de regra de `ALTER TABLE`, renomear, apagar tabela ou índice, comentário, gatilho e função `sql` ou `plpgsql` que só lê, insere ou muda `NEW`. Todo o resto é recusado antes da transação, com o nó: `SECURITY DEFINER` (também por `ALTER FUNCTION`), função que apaga ou muda outra linha, gatilho que recusa (`RAISE EXCEPTION`) ou engole (`RETURN NULL`) a gravação (`trigRaise`, `trigNull`), função com `BEGIN ATOMIC` (`sql_body`), `EXECUTE` dinâmico, `GRANT`, `REVOKE`, `ALTER DEFAULT PRIVILEGES`, view, bloco `DO`, `BEGIN`, `COMMIT`, `SET`, `RESET`, `DISCARD`, `ENABLE` e `FORCE ROW LEVEL SECURITY`, `CREATE POLICY`, `CREATE RULE`, `ALTER SEQUENCE`, `SET UNLOGGED`, `OWNER TO`, tabela `UNLOGGED` ou `TEMP`, `SELECT INTO`, um nome com esquema, começado por `cx_` (a foto) ou `conexus_migration` (o livro), e um item com dois comandos. A resposta é `REFUSED_BY_RULE` com a migração e o comando, nada enviado ao banco; uma migração já aplicada não é relida (uma view aplicada antes da 15 não recusa a versão seguinte) | `company-postgres.test.ts`, "lista fixa: só passa o que a garantia vê" | must |
| 5 | U1 | O que o banco recusa sozinho (P3 e O6 `23502`, P4 e O3 `23505`, P5 `22P02`, P6 `22008`, Sa1 `2BP01`) volta como `REFUSED` com o SQLSTATE; o livro `conexus_migration` e as tabelas ficam como estavam | `company-postgres.test.ts`, "o banco recusa sozinho e nada muda" | must |
| 6 | U1 | Pela porta do envio do Builder, a versão com `RENAME COLUMN` fica `failed` com `APP_MIGRATION_FAILED` e a Prévia segue na anterior; a com `GRANT` fica `failed` com `APP_MIGRATION_REFUSED`; `npm run removals` tira a leitura da lista fixa e este teste falha | `apps/server/src/hub/apps/send-migrations.test.ts`, "o envio que quebraria o Voltar não entra" e "o envio com GRANT não entra" | must |
| 7 | U2 | A skill `conexus-data` lida pelo Builder diz que os dados só andam para a frente e as saídas (renomear é acrescentar e copiar; tirar é tirar das telas; dado antigo se corrige pela tela; lista fixa no Zod, e para mudar um `CHECK` de lista que existe, soltar o `CHECK`; nada se apaga nesta versão); recusa segurança por linha, políticas e regras; não fala em views; o plano de mudança não diz "only then remove the old fields" | `apps/server/src/builder/conversation/prompt.test.ts`, o caso das skills lidas | should |
| 8 | U3 | A recusa do banco do passo 5 (23505) chega na parte `data-conexus-preview` `failed` com `cause` `{ kind: 'database', sqlstate: '23505', table: 'encomenda', constraint: 'encomenda_whatsapp_key' }`; `CX001` e `CX002` chegam com `table` e `column`; a lista fixa chega como `{ kind: 'rule', migration, statement, subject }`; nem a parte nem o registro trazem o `detail` ou um valor | `send-migrations.test.ts`, "o motivo vai sem valor": lê a parte e o registro inteiros procurando `99999` | must |
| 9 | U3 | Sob "Prévia não atualizada", com `cause`: o motivo em palavras e o botão **Pedir ao Builder para corrigir**; o toque põe na caixa "A versão 7 não entrou: o banco recusou a migração (valor repetido, tabela encomenda, regra encomenda_whatsapp_key)." sem enviar; com a caixa já escrita, acrescenta numa linha nova; sem `cause`, nem motivo nem botão | `apps/web/src/builder/conversation/preview-line.test.tsx`, sobre uma parte `failed` gravada (T26) | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A linha da Prévia na conversa (U3) | — | — | "Subindo o app…", como hoje | `failed` sem `cause`: "Prévia não atualizada:" e a frase do código, como hoje | o Projeto apagado no meio: nada, como hoje (`app-versions.ts:40`) | — | `failed` com `cause`: a frase do código, o motivo em palavras e o botão |
| A caixa de escrever, depois do botão (U3) | — | o motivo vira o texto | — | — | — | — | com texto já escrito: o motivo numa linha nova |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `PreviewData` `failed.cause` (`MigrationCause`) | `sendFromBuilder` (`hub/apps/app-versions.ts`), do `Failure` do envio | web, `PreviewLine`: o motivo e o texto do botão |
| `SqlAnswer` `REFUSED` `table`, `column`, `constraint` | `neonTransport`, e `pgTransport` nos testes | `migrate` → `migrateApp` |
| `MigrateAnswer` `REFUSED_BY_RULE` | `migrate`, da lista fixa | `migrateApp` |
| `AppVersionFailure` `APP_MIGRATION_REFUSED` | `migrateApp` | Versões e a linha da Prévia: a frase do código |

**Desenho de caixas.** Muda só a linha da Prévia na mensagem do Builder (`preview-line.tsx:11-22`).
O botão é o `Button` de `ui/`, variante secundária, pequeno, como os da conversa.

```text
1280 px
  ⚠ Prévia não atualizada: Uma migração do app falhou no banco. Use o botão para pedir ao Builder que corrija.
    Motivo: valor repetido, tabela encomenda, regra encomenda_whatsapp_key.
    [Pedir ao Builder para corrigir]

390 px
  ⚠ Prévia não atualizada: Uma migração
    do app falhou no banco. Use o botão
    para pedir ao Builder que corrija.
    Motivo: valor repetido, tabela
    encomenda, regra
    encomenda_whatsapp_key.
    [Pedir ao Builder para corrigir]
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| A transação das migrações com a foto e a comparação (`migrate`, `@neondatabase/serverless` 1.2.0 `transaction`) | um envio por Projeto (a trava de `lockApp`, 14.1); uma linha que o app apaga entre a foto e a comparação conta como perdida e recusa: falha segura | qualquer recusa desfaz tudo, foto e livro incluídos (`ON COMMIT DROP`, uma transação, 0046) | o Neon fora ou a resposta cortada: `NO_ANSWER`, `APP_VERSION_FAILED`, como hoje (`app-database.ts:75-76`); o teto de 60 s (`neon.ts`, `NEON_CALL_BUDGET_MS`) cobre a cópia até ~1 milhão de linhas (provado, 7 a 15 s) | `APP_MIGRATION_FAILED` com `code`, `table`, `column`, `constraint`; nunca `detail` | 1 a 3, 5, 6, 8 |
| A leitura da lista fixa (lê, não grava) | — | recusa antes da transação: nada a desfazer | o WASM que não carrega: o Hub não sobe (carregado na partida) | `APP_MIGRATION_REFUSED` com a migração, o comando e o nó | 4, 6, 8 |
| O botão da A1 (escreve só no rascunho da caixa) | dois toques: o segundo vê a linha e não repete | — | — | nada no servidor | 9 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A garantia: o resultado conferido na transação | U1 | `company-postgres.ts:185-214` aplica as pendentes e o livro numa transação; nada confere o resultado | Atlas `ed994a7` `cmd/atlas/internal/migratelint/lint.go:292-322` (compara esquemas num banco de teste, sem dados); Prisma `d1b3f37` `schema-engine/connectors/sql-schema-connector/src/flavour/postgres/destructive_change_checker.rs:161,177` (conta linhas reais antes de avisar); pgroll `777a535` `pkg/roll/execute.go:151` (versão velha viva por views, só para operações próprias) | nenhuma confere "o dado ficou e a versão anterior funciona" sobre SQL livre; Atlas e Prisma trazem cada um metade | embrulhado: o catálogo (`pg_attribute`, `pg_constraint`, `pg_cast`) e a transação do PostgreSQL, mais a nossa comparação | provado no PostgreSQL 18.6: 45 casos (os 21 do estudo, as reescritas e os da revisão), 45 certos com o SQL abaixo; com o SQL do primeiro cartão, 28 recusados por engano pela coluna `json`, por isso a comparação é como texto; 1 mil linhas +9 ms, 100 mil +0,3 s | B nova forma, Sa4, 2026-10-27 | `apps/server/src/platform/migration-outcome.ts` |
| Os códigos da garantia | U1 | `answerOf` (`company-postgres.ts:32-36`) já lê qualquer SQLSTATE como `REFUSED` | PL/pgSQL `RAISE … USING ERRCODE, TABLE, COLUMN, CONSTRAINT` (PostgreSQL 18, "Errors and Messages") | um SQLSTATE nosso, classe `CX` | nativo | — | não precisa | — |
| A lista fixa do que pode passar, porque a garantia o vê | U1 | `packages/app-contract/src/manifest.ts:16-22,33` `SESSION_CONTROL` (regex da primeira palavra, na conferência e no Hub); funções, permissões e views só no texto (`conexus-data/SKILL.md:43-44`) | `libpg-query@18.1.5` `parseSync`, `parsePlPgSQLSync` (README; provado); squawk `4855ff5` não vê `DO`, `GRANT`, `SECURITY DEFINER` (provado na imagem 2.70.0); supabase-mcp `5ab9a98` `destructive-sql.ts:64` (regex) | o analisador oficial dá o nó; as referências usam regex ou não cobrem | embrulhado: o analisador do PostgreSQL, a nossa lista do que pode passar (a revisão do cartão: uma lista do que não pode deixava passar `ENABLE ROW LEVEL SECURITY` e `CREATE RULE`) | provado no `libpg-query` 18.1.5: nenhum dos 45 casos recusado; recusadas todas as sondas do critério 4, `rls`, `forceRls`, `policy`, `rule`, `alterFunctionDefiner`, `alterDefaultPrivileges`, `seqRestart`, `setUnlogged`, `ownerTo`, `cx_col`, `pg_temp.cx_col` entre elas; passam gatilho, comentário, identidade, coluna gerada, `ON CONFLICT DO NOTHING`, `VALIDATE CONSTRAINT`, `DROP INDEX`; nenhuma sonda do lado errado | resposta 6 estreitada, P3 de 2026-10-22; B, 2026-10-27 | `apps/server/src/platform/migration-rule.ts` |
| O guia dentro do turno | fica de fora | `processors.ts:84-111` `judge`; `check/run.ts:13-20` | `@mastra/core@1.79.0` `isTaskComplete` (`dist/agent-tuAMgHe3.js:29524-29545`); strong_migrations `02b8881` `error_messages.rb:109-117` | o motivo do juiz volta ao modelo; a mensagem ensina o caminho seguro | nativo: o caminho existe e não muda; nada se acrescenta a ele | o estudo: a garantia acertou os 21 casos medidos contra o Voltar; o que ela não vê (o que roda depois) a lista fixa do Hub recusa; o motivo volta pelo botão. O guia só pouparia uma volta da Ana | "Enxuta", 2026-10-27 | — |
| A migração aplicada não muda | fica como está | `company-postgres.ts:197-198` `CHANGED` no envio | Supabase `cb52c0f4` `database-migrations.mdx:462` (o livro decide, relay) | o livro decide no aplicar | nativo (o livro com SHA-256, 0046) | — | resposta 4, sem a parte "na máquina" ("Enxuta") | — |
| O motivo do banco, sem valor | U3 | `company-postgres.ts:62-66` guarda só `code`; `app-database.ts:72-74` | `@neondatabase/serverless@1.2.0` `index.d.ts:834-854` (`NeonDbError`: `table`, `column`, `constraint`, `detail`); `pg` `DatabaseError` os mesmos | o erro nativo traz os campos; `detail` traz o valor (provado: "Key (whatsapp)=((11) 99999-0000)") | embrulhado: só `code`, `table`, `column`, `constraint` (C52, S40) | critério 8; o proxy do Neon, na 22 | A1 | — |
| O motivo chega à pessoa e ao Builder | U3 | `conexus-parts.ts:71-76` `PreviewData` só com `code`; `preview-line.tsx:11-22` | bolt.diy `353b44c` `SupabaseAlert.tsx:70-71` (o erro vira mensagem que a pessoa manda); Mastra não manda partes `data-*` ao modelo (`@mastra/core@1.79.0` `dist/message-list-Dgn6bbqK.cjs:10822`) | o erro vira texto da conversa, pela mão da pessoa | embrulhado: a parte nossa e o rascunho da caixa (`draft.ts:30-64`) | critério 9 | A1 | — |
| O texto do Builder: só acrescenta | U2 | `conexus-data/SKILL.md:43-44`; `conexus-plan-change/references/plan-template.md:30` | Lovable `docs.lovable.dev/features/database` ("adding a new column and copying the data over. The old column stays in place", herdado); Chef `d8a6cb6` `outputInstructions.ts:164-172` | texto ao modelo | nativo (skills do Mastra, `instructions.ts:58-72`) | — | resposta 1 | — |
| Uma transação com livro e SHA-256 | fica de fora (já feito) | `company-postgres.ts:185-214` | Dyad `902829f` `neon_context.ts:217-222` `sql.transaction` | todas as pendentes numa transação | nativo | 0046 | P6 A de 2026-10-18 | — |
| Voltar sem migrar | fica de fora | `hub/apps/live.ts:10-11,40` só troca o ponteiro | Dyad volta o banco do ramo (`version_handlers.ts:788-794`, relay) | código e dados juntos, com prazo | nativo: herdado, mantido pela resposta 5; é por ele que a garantia confere a versão anterior | P1, P2 do estudo | resposta 5 | — |

As referências fora do `node_modules` estão na estante de estudo nos commits citados.

**A medida do transplante.** Nenhum código trazido.

**A dívida.**
- Colunas esquecidas acumulam (o custo da resposta 1); a 15.1 as limpa.
- Tabela de app acima de ~200 mil linhas: a foto passa de um segundo. Gatilho: a primeira tabela
  nesse tamanho; a saída é comparar por hash de coluna.
- Uma regra única tirada que um `ON CONFLICT` da versão anterior usava: a garantia aceita. Gatilho:
  a primeira migração que tire uma regra única.
- Uma regra única nova sem repetidos: a garantia aceita de propósito (o passo 5 do roteiro), e a
  versão anterior recebe `23505` se gravar um repetido. Gatilho: a primeira volta da Ana que tope
  com isso.
- Trocar valores entre duas linhas passa, porque a comparação é por coluna, não por linha (provado,
  `swapRows`). Gatilho: a primeira migração que mova valores entre linhas; a saída é comparar pela
  chave primária.
- `SELECT setval(…)` que volta uma sequência passa, porque a garantia não olha sequências, e a versão
  anterior recebe `23505` ao gravar (provado). Gatilho: a primeira migração com `setval`; a saída é
  comparar `last_value` antes e depois.
- A C (o proxy do Neon devolve `table` e os códigos `CX`): na 22.

## U1 A garantia no envio

**Base e modelo.** `main` no commit em que o cartão for aprovado. Opus: o SQL da comparação é o
algoritmo sutil da etapa, e um erro nele perde dado em silêncio.

### As linhas da tabela

- **A garantia**: `migrate` (`company-postgres.ts:185-214`), a lista mandada em `:202-212`. O SQL
  abaixo é o provado no PostgreSQL 18.6 (45 de 45), com estas escolhas que o teste prova: as cópias
  levam o `oid` da tabela no nome (um nome de 63 letras não corta); as funções do catálogo levam
  `pg_catalog.` (uma função de mesmo nome no esquema do app não as troca); o `RAISE` leva `TABLE`,
  `COLUMN` ou `CONSTRAINT`; os valores se comparam como texto (`json`, `point` e `xml` não têm
  igualdade, e sem isso travavam toda migração seguinte); um tipo novo só passa por um cast binário
  para um tipo sem limite (`varchar(3)` e `bigint` recusam); e a foto das regras leva `CHECK` e
  chave estrangeira.
- **Os códigos**: `answerOf` (`:32-36`) lê `CX001` e `CX002` como `REFUSED`; `migrateApp`
  (`app-database.ts:72-74`) os devolve como `APP_MIGRATION_FAILED`, sem mudança.
- **A lista fixa**: sai `SESSION_CONTROL` (`manifest.ts:16-22`) e o seu `refine` (`:33`); a leitura
  entra em `migrate` depois de achar as pendentes (`:200`), só sobre elas.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/migration-outcome.ts` | Cria | `company-postgres.ts` |
| `apps/server/src/platform/migration-rule.ts` | Cria | `company-postgres.ts`; `main.ts` (a carga na partida) |
| `apps/server/src/main.ts` | Muda: `await loadMigrationRule()` antes de servir | — |
| `apps/server/src/platform/company-postgres.ts` | Muda: `migrate` lê a lista fixa e manda a foto e a comparação; `MigrateAnswer` ganha `REFUSED_BY_RULE` | `migrateApp` (envio e reparação, `repair.ts:159`) |
| `apps/server/src/hub/apps/app-database.ts` | Muda: `REFUSED_BY_RULE` vira `APP_MIGRATION_REFUSED` | `prepare` |
| `packages/hub-api/src/apps.ts`, `app-failures.ts` | Muda: `APP_MIGRATION_REFUSED` e a sua frase | Versões, a linha da Prévia |
| `packages/app-contract/src/manifest.ts`, `manifest.test.ts` | Apaga `SESSION_CONTROL` e o seu caso | — |
| `apps/server/src/platform/test-migration-cases.ts` | Cria: os casos, as sementes e o resultado esperado | os testes |
| `apps/server/src/platform/company-postgres.test.ts` | Muda: critérios 1 a 5 | — |
| `apps/server/src/hub/apps/send-migrations.test.ts` | Cria: critério 6 | — |
| `scripts/removals.json` | Muda: `migration-rule` (T12, S2) | `npm run removals` |
| `apps/server/package.json`, `package-lock.json`, `docs/reference/stack.md` | Muda: `libpg-query` 18.1.5 e a sua linha | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/platform/migration-outcome.ts
/** The app schema before its pending migrations, copied in the same transaction (decision 0046). */
export const OUTCOME_BEFORE: SqlStatement = { text: BEFORE_SQL }
/** Refuses the transaction when a saved value or the previous version's schema did not survive. */
export const OUTCOME_AFTER: SqlStatement = { text: AFTER_SQL }

// apps/server/src/platform/migration-rule.ts
/** The statement the fixed list refuses: what may pass is what the outcome check sees (B, 2026-10-27). */
export type RuleBreak = Readonly<{ migration: string; statement: number; subject: string }>
/** Loads the parser's WASM; the Hub awaits it at start (libpg-query README: the `*Sync` need it). */
export function loadMigrationRule(): Promise<void>
/** The first statement of the pending migrations that the fixed list refuses, or none. */
export function ruleBreak(pending: readonly AppMigration[]): RuleBreak | undefined

// apps/server/src/platform/company-postgres.ts
type MigrateAnswer =
  | { kind: 'DONE'; applied: number }
  | { kind: 'CHANGED'; id: string }
  | { kind: 'REFUSED_BY_RULE'; rule: RuleBreak }
  | { kind: 'REFUSED'; code: string }
  | { kind: 'NO_ANSWER' }

// packages/hub-api/src/apps.ts: AppVersionFailure ganha 'APP_MIGRATION_REFUSED'
// packages/hub-api/src/app-failures.ts
APP_MIGRATION_REFUSED: {
  category: 'USER', settles: true, status: 422,
  phrase: 'Uma migração do app faz o que o Conexus não confere.',
  action: 'Peça ao Builder para corrigir a migração.',   // a frase de hoje; a U3 a troca
  actionKind: 'NONE',
},
```

- **O estado** é a união `MigrateAnswer` com `kind` (C21); `subject` é o nó (`GrantStmt`,
  `AT_EnableRowSecurity`, `SECURITY DEFINER`, `body DeleteStmt`, `name cx_col`), nunca texto da
  migração (S40).
- **Donos**: os nós permitidos vivem em `migration-rule.ts` (C26); os casos em
  `test-migration-cases.ts`.
- Modelo: `company-postgres.ts` (C21 em `SqlAnswer`, C26 em `LEDGER`).

A lista fixa, inteira (provada no `libpg-query` 18.1.5; o leitor de função é o do estudo de casos):

```ts
/** What the outcome check sees inside the transaction; every other node acts after it, or ends it. */
const ALLOWED = new Set([
  'CreateStmt', 'IndexStmt', 'InsertStmt', 'UpdateStmt', 'DeleteStmt', 'TruncateStmt',
  'AlterTableStmt', 'RenameStmt', 'DropStmt', 'CommentStmt', 'CreateTrigStmt', 'CreateFunctionStmt', 'SelectStmt',
])
const ALTER_ALLOWED = new Set([
  'AT_AddColumn', 'AT_DropColumn', 'AT_AlterColumnType', 'AT_ColumnDefault', 'AT_DropNotNull',
  'AT_SetNotNull', 'AT_AddConstraint', 'AT_DropConstraint', 'AT_ValidateConstraint',
])
const DROP_ALLOWED = new Set(['OBJECT_TABLE', 'OBJECT_INDEX'])

export function ruleBreak(pending: readonly AppMigration[]): RuleBreak | undefined {
  for (const one of pending) {
    for (const [at, text] of one.statements.entries()) {
      const subject = refused(text)
      if (subject !== undefined) return { migration: one.id, statement: at + 1, subject }
    }
  }
  return undefined
}

function refused(text: string): string | undefined {
  let stmts
  try { stmts = parseSync(text).stmts } catch { return 'UNREADABLE' }
  if (stmts.length !== 1) return 'NOT_ONE_STATEMENT'      // "One statement per item" (manifest.ts:26)
  const [kind, node] = Object.entries(stmts[0].stmt)[0]
  if (!ALLOWED.has(kind)) return kind
  const outside = outsideTheApp(node)   // a relname with a schema, starting with cx_ (the snapshot) or conexus_migration (the ledger)
  if (outside !== undefined) return `name ${outside}`
  switch (kind) {
    case 'CreateStmt': return node.relation.relpersistence === 'p' ? undefined : `CreateStmt ${node.relation.relpersistence}`
    case 'AlterTableStmt': return node.cmds.map(({ AlterTableCmd: c }) => c.subtype).find((one) => !ALTER_ALLOWED.has(one))
    case 'DropStmt': return DROP_ALLOWED.has(node.removeType) ? undefined : `DropStmt ${node.removeType}`
    case 'SelectStmt': return node.intoClause === undefined ? undefined : 'SelectStmt INTO'
    case 'CreateFunctionStmt': return functionPower(node)   // linguagem fora de sql/plpgsql, SECURITY DEFINER, EXECUTE, corpo que não seja SELECT, INSERT ou NEW, `RAISE EXCEPTION`, `RETURN` que não seja NEW, `sql_body` (`BEGIN ATOMIC`)
    default: return undefined
  }
}
```

O SQL da garantia, inteiro:

```sql
-- BEFORE_SQL
DO $cx$
DECLARE t record;
BEGIN
  CREATE TEMP TABLE cx_col ON COMMIT DROP AS
    SELECT c.oid AS rel, c.relname AS tab, a.attname AS col, a.atttypid AS typ, a.atttypmod AS typmod,
           pg_catalog.format_type(a.atttypid, a.atttypmod) AS typname,
           (a.attnotnull AND NOT a.atthasdef AND a.attidentity = '' AND a.attgenerated = '') AS required
    FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
    WHERE c.relnamespace = pg_catalog.current_schema()::regnamespace AND c.relkind = 'r'
      AND c.relname <> 'conexus_migration' AND a.attnum > 0 AND NOT a.attisdropped;
  CREATE TEMP TABLE cx_check ON COMMIT DROP AS
    SELECT conrelid, pg_catalog.pg_get_constraintdef(oid) AS def FROM pg_catalog.pg_constraint
    WHERE connamespace = pg_catalog.current_schema()::regnamespace AND contype IN ('c', 'f');
  FOR t IN SELECT DISTINCT rel, tab FROM cx_col LOOP
    EXECUTE format('CREATE TEMP TABLE %I ON COMMIT DROP AS SELECT * FROM %I', 'cx_rows_' || t.rel, t.tab);
  END LOOP;
END
$cx$

-- AFTER_SQL
DO $cx$
DECLARE c record; lost bigint; now_typ oid; now_mod int;
BEGIN
  FOR c IN SELECT * FROM cx_col LOOP
    SELECT a.atttypid, a.atttypmod INTO now_typ, now_mod FROM pg_catalog.pg_attribute a
      WHERE a.attrelid = pg_catalog.to_regclass(quote_ident(c.tab)) AND a.attname = c.col AND NOT a.attisdropped;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'previous version breaks: %.% is gone', c.tab, c.col
        USING ERRCODE = 'CX001', TABLE = c.tab, COLUMN = c.col;
    END IF;
    IF now_typ <> c.typ AND (now_mod <> -1 OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_cast
         WHERE castsource = c.typ AND casttarget = now_typ AND castmethod = 'b'))
       OR now_typ = c.typ AND now_mod <> -1 AND now_mod < c.typmod THEN
      RAISE EXCEPTION 'previous version breaks: %.% no longer takes every % value', c.tab, c.col, c.typname
        USING ERRCODE = 'CX001', TABLE = c.tab, COLUMN = c.col;
    END IF;
    BEGIN
      EXECUTE format('SELECT count(*) FROM (SELECT %1$I::text FROM %2$I WHERE %1$I IS NOT NULL
                      EXCEPT ALL SELECT %1$I::%3$s::text FROM %4$I WHERE %1$I IS NOT NULL) lost',
                     c.col, 'cx_rows_' || c.rel, c.typname, c.tab) INTO lost;
    EXCEPTION WHEN OTHERS THEN lost := -1;
    END;
    IF lost <> 0 THEN
      RAISE EXCEPTION 'data lost: % saved value(s) of %.% changed or removed',
        CASE WHEN lost < 0 THEN 'some' ELSE lost::text END, c.tab, c.col
        USING ERRCODE = 'CX002', TABLE = c.tab, COLUMN = c.col;
    END IF;
  END LOOP;
  FOR c IN SELECT a.attrelid::regclass::text AS tab, a.attname AS col FROM pg_catalog.pg_attribute a
           WHERE a.attrelid IN (SELECT pg_catalog.to_regclass(quote_ident(tab)) FROM cx_col)
             AND a.attnum > 0 AND NOT a.attisdropped
             AND a.attnotnull AND NOT a.atthasdef AND a.attidentity = '' AND a.attgenerated = ''
           EXCEPT SELECT tab, col FROM cx_col WHERE required LOOP
    RAISE EXCEPTION 'previous version breaks: %.% is now required with no default, and the previous version saves without it', c.tab, c.col
      USING ERRCODE = 'CX001', TABLE = c.tab, COLUMN = c.col;
  END LOOP;
  FOR c IN SELECT k.conrelid::regclass::text AS tab, k.conname FROM pg_catalog.pg_constraint k
           WHERE k.contype IN ('c', 'f') AND k.conrelid IN (SELECT pg_catalog.to_regclass(quote_ident(tab)) FROM cx_col)
             AND NOT EXISTS (SELECT 1 FROM cx_check o WHERE o.conrelid = k.conrelid
                             AND o.def = pg_catalog.pg_get_constraintdef(k.oid))
             AND EXISTS (SELECT 1 FROM pg_catalog.pg_attribute a JOIN cx_col o
                           ON o.tab = k.conrelid::regclass::text AND o.col = a.attname
                         WHERE a.attrelid = k.conrelid AND a.attnum = ANY (k.conkey)) LOOP
    RAISE EXCEPTION 'previous version breaks: new rule % on saved columns of %', c.conname, c.tab
      USING ERRCODE = 'CX001', TABLE = c.tab, CONSTRAINT = c.conname;
  END LOOP;
END
$cx$
```

`migrate` (`company-postgres.ts:200-214`), depois:

```ts
const pending = input.migrations.filter((one) => !done.has(one.id))
if (pending.length === 0) return { kind: 'DONE', applied: 0 }
// The outcome check cannot see what acts after the transaction: the fixed list refuses it first.
const rule = ruleBreak(pending)
if (rule !== undefined) return { kind: 'REFUSED_BY_RULE', rule }
const ran = await context.transport(
  url,
  [
    OUTCOME_BEFORE,
    ...pending.flatMap((one) => [
      ...one.statements.map((text) => ({ text })),
      { text: `INSERT INTO ${ledger} (id, sha256) VALUES ($1, $2)`, values: [one.id, digests.get(one.id)] },
    ]),
    OUTCOME_AFTER,
  ],
  signal,
)
```

O comentário de `migrate` (`:180-184`) ganha uma frase: a transação só se confirma se cada valor
salvo antes ainda está lá e a versão anterior ainda lê e grava.

### As skills e a leitura

`neon:neon-postgres` (linha de `@neondatabase/serverless` em `docs/reference/stack.md`); o README de
`libpg-query` 18.1.5; PostgreSQL 18, "PL/pgSQL Errors and Messages" e "System Catalogs". Guia de
dados D6, D22, D29; segurança S2.

### A ordem do trabalho

1. Subtrair: `manifest.ts` perde `SESSION_CONTROL` e o `refine` (`:33`); `manifest.test.ts` perde
   o caso.
2. `test-migration-cases.ts`: as sementes (Padaria, oficina, salão, dados inventados, S40) e os
   casos com o resultado provado.
3. `company-postgres.test.ts`: critérios 1 a 5 sobre `pgTransport` (`test-company-postgres.ts:17`) e
   o Postgres local, como os casos de hoje (`:50-131`); para o 3, a leitura e a gravação da versão
   anterior. Hoje P1 aplica: falha.
4. `migration-outcome.ts`, `migration-rule.ts` e `migrate`. `loadMigrationRule()` no começo de
   `main.ts`, antes de servir. Funções: `libpg-query@18.1.5` `loadModule`, `parseSync`,
   `parsePlPgSQLSync`.
5. `app-database.ts`, `apps.ts`, `app-failures.ts`: `APP_MIGRATION_REFUSED`.
6. `send-migrations.test.ts` pela porta do envio do Builder (`test-versions.ts:26` `MIGRATION`,
   `:148` `readyForVersions`); `removals.json` com `migration-rule`, que apaga a chamada a
   `ruleBreak`.
7. `stack.md`: a linha de `libpg-query` (Usado em `apps/server/src/platform`; Ler primeiro o README;
   Armadilha: carregar o WASM antes do primeiro `parseSync`).

### Como se prova

`npm test -w @conexus/server -- src/platform/company-postgres.test.ts
src/hub/apps/send-migrations.test.ts`; `npm run removals`; `npm test -w @conexus/app-contract`.

### Parar se

- Um caso dá um resultado diferente do provado no estudo: parar e relatar o caso e a saída; não
  ajustar o caso para passar.
- O login de migração não cria tabela temporária no Postgres local: parar e relatar.
- Uma sonda do critério 4 cai do lado errado da lista: parar e relatar o nó; não acrescentar à lista
  um nó que a garantia não vê.

## U2 O texto

**Base e modelo.** `main` no commit em que o cartão for aprovado. Sonnet: duas mudanças de texto.

### As linhas da tabela

**O texto do Builder: só acrescenta**: `packages/app/skills/conexus-data/SKILL.md:43-44` e
`packages/app/skills/conexus-plan-change/references/plan-template.md:30`. O `conexus-plan-new` não
tem a linha.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/app/skills/conexus-data/SKILL.md` | Muda: linhas 43-44 | o Builder |
| `packages/app/skills/conexus-plan-change/references/plan-template.md` | Muda: linha 30 | o Builder |
| `apps/server/src/builder/conversation/prompt.test.ts` | Muda: critério 7 | — |

### Os contratos que a unidade cria

Nenhum. As linhas 43-44 da `conexus-data` passam a ser (em inglês, como a skill):

> - Saved data only moves forward. A migration may add tables, columns, indexes and constraints, and
>   copy into what it added. It never drops, renames or retypes a saved column or table, never
>   deletes or overwrites saved rows (filling only empty ones, `WHERE column IS NULL`, is fine), and
>   never makes the previous version send a field it does not know. Conexus applies every pending
>   migration in one transaction and keeps it only if every saved value is still there and the
>   previous version still reads and writes; otherwise the version does not enter.
> - To rename, add the new column and copy. To remove a field, take it off the screens; what was
>   saved stays. A saved row is fixed on the app's screen, never by a migration. A fixed list lives
>   in Zod (`z.enum`), never in a `CHECK`; to change an existing `CHECK` list, drop the `CHECK` and keep
>   the list in Zod. Nothing is truly deleted in this version: say so to the person.
> - No functions with `SECURITY DEFINER` or `EXECUTE`, no function body that changes rows other
>   than inserting or setting `NEW`, no views, `DO` blocks, extensions, roles, grants or other
>   schemas, no row level security, policies or rules, and no transaction control (`BEGIN`, `COMMIT`, `SET`): they act after the transaction,
>   where Conexus cannot check them, and the version is refused.

E `plan-template.md:30`: "Dados salvos: when a table with saved data changes, add the new fields
and copy into them; the old fields stay, off the screens. Say in the person's part what is copied
and that nothing is deleted."

### As skills e a leitura

`mastra` (as skills do Builder, `instructions.ts:58-72`). Guia de dados D6.

### A ordem do trabalho

1. `prompt.test.ts`: o critério 7, falhando hoje (a skill fala em views).
2. As duas mudanças de texto.

### Como se prova

`npm test -w @conexus/server -- src/builder/conversation/prompt.test.ts`. O modelo real lendo o
texto se vê no roteiro ao vivo (L17).

### Parar se

- Outra skill do Builder manda remover campo ou criar view: relatar a linha; não mudar sem o cartão.

## U3 O motivo volta (A1)

**Base e modelo.** `main` com a U1. Sonnet: um campo que atravessa três camadas e uma tela.

### As linhas da tabela

- **O motivo do banco, sem valor**: `neonTransport` (`company-postgres.ts:54-67`), `answerOf`
  (`:32-36`), `pgTransport` (`test-company-postgres.ts:36-37`), `migrateApp`
  (`app-database.ts:57-80`).
- **O motivo chega à pessoa e ao Builder**: `prepare` devolve `FAILED` (`send.ts:129-130`);
  `sendVersion` lança o `Failure` (`:226-229`); `sendFromBuilder` o lê (`app-versions.ts:41-47`);
  `PreviewData` (`conexus-parts.ts:71-76`); `PreviewLine` (`preview-line.tsx:11-22`); o rascunho
  (`draft.ts:30-64`, `change`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/conexus-parts.ts` | Muda: `MigrationCause`, `PreviewData.failed.cause` | servidor (`end.ts`, `app-versions.ts`), web |
| `apps/server/src/platform/company-postgres.ts`, `test-company-postgres.ts` | Muda: `REFUSED` leva `table`, `column`, `constraint` | `migrate` |
| `apps/server/src/hub/apps/app-database.ts`, `send.ts`, `app-versions.ts` | Muda: o motivo segue até a parte | `sendFromBuilder` |
| `apps/server/src/hub/apps/repair.ts` | Muda: lê `{ failure, cause }` de `migrateApp` (`:159`) e segue só com `failure` | a reparação |
| `apps/server/src/hub/apps/send-migrations.test.ts` | Muda: critério 8 | — |
| `packages/hub-api/src/app-failures.ts` | Muda: a ação de `APP_MIGRATION_FAILED` e a de `APP_MIGRATION_REFUSED` | web (`sentenceOfCode`) |
| `apps/web/src/builder/conversation/migration-cause.ts` | Cria: as palavras do motivo, por SQLSTATE | `preview-line.tsx` |
| `apps/web/src/builder/conversation/preview-line.tsx` | Muda: o motivo e o botão | `builder-turn.tsx` |
| `apps/web/src/builder/conversation/builder-turn.tsx`, `transcript.tsx`, `panel.tsx` | Muda: `onAsk` desce do painel | — |
| `apps/web/src/builder/conversation/preview-line.test.tsx` | Cria: critério 9 | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/conexus-parts.ts: um dono, lido pelo servidor e pela tela (C26)
const Name = z.string().min(1).max(63)          // um identificador do PostgreSQL
export const MigrationCause = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('database'),
    sqlstate: z.string().regex(/^[0-9A-Z]{5}$/),  // 23505, 23502, 22P02, CX001, CX002…
    table: Name.optional(), column: Name.optional(), constraint: Name.optional(),
  }),
  z.object({
    kind: z.literal('rule'),
    migration: z.string(), statement: z.int().positive(), subject: z.string().max(60),
  }),
])
export type MigrationCause = z.infer<typeof MigrationCause>
// PreviewData, a variante failed:
z.object({ state: z.literal('failed'), number: z.int().positive(), code: PreviewFailure, cause: MigrationCause.optional() })

// apps/server/src/platform/company-postgres.ts
export type SqlAnswer =
  | { kind: 'DONE'; value: Row[][] }
  | { kind: 'REFUSED'; code: string; table?: string; column?: string; constraint?: string }
  | { kind: 'NO_ANSWER' }
/** A SQLSTATE refuses with the names it carries; never `detail`, which holds values (C52, S40). */
export function answerOf(error: Readonly<{ code?: string; table?: string; column?: string; constraint?: string }> | undefined): SqlAnswer

// apps/server/src/hub/apps/app-database.ts
export function migrateApp(…): Promise<{ failure: AppVersionFailure; cause?: MigrationCause } | undefined>

// apps/server/src/hub/apps/send.ts, Prepared:
| { kind: 'FAILED'; failure: AppVersionFailure; cause?: MigrationCause }
// e: new Failure(prepared.failure, { details: { companyId, projectId, versionId, cause } })

// apps/web/src/builder/conversation/preview-line.tsx
export function PreviewLine(props: { data: PreviewData; live: boolean; onAsk?: (text: string) => void })
```

- As palavras do motivo, um registro por SQLSTATE em `migration-cause.ts` (C26), nunca a mensagem do
  banco:
  `23505` "valor repetido", `23502` "campo vazio", `23514` "valor fora da regra", `22P02` e `22008`
  "valor que não converte", `2BP01` "outra tabela depende desta", `CX001` "a versão anterior
  deixaria de abrir", `CX002` "um valor salvo mudaria ou sumiria", outro "código <sqlstate>";
  `rule`: "a migração <id>, comando <n>, faz o que o Conexus não confere (<subject>)". As frases da
  tela são aprovadas pelo fundador no fim.
- A ação de `APP_MIGRATION_FAILED` e a de `APP_MIGRATION_REFUSED` passam a "Use o botão para pedir
  ao Builder que corrija."
- Modelo: `conexus-parts.ts` (C21 em `PreviewData`, C27 nas partes).

### As skills e a leitura

`neon:neon-postgres` (`NeonDbError`, `index.d.ts:834-854`); `pg` (`DatabaseError`); `shadcn` para o
`Button`. Guia web; segurança S40; código C21, C27, C52.

### A ordem do trabalho

1. `send-migrations.test.ts`: o critério 8, falhando hoje.
2. `answerOf` e os dois transportes; `migrate` e `migrateApp` levam o motivo; `prepare`,
   `sendVersion` e `sendFromBuilder` o levam até a parte; `repair.ts` lê a forma nova.
3. Web: `PreviewLine` com o motivo e o botão; `onAsk` desce de `panel.tsx` (`draft.change` com o
   texto atual e uma linha nova) por `Transcript` e `BuilderTurn`. `preview-line.test.tsx` sobre uma
   parte gravada (T26, T7: o papel `button` e o texto visível).

### Como se prova

`npm test -w @conexus/server -- src/hub/apps/send-migrations.test.ts`; `npm test -w @conexus/web --
src/builder/conversation/preview-line.test.tsx`. O critério 8 lê a parte e o registro inteiros
procurando o número do exemplo.

### Parar se

- O `pg` não traz `table` num caso: o campo fica ausente; não ler o `detail` nem a mensagem.
- O botão pede um estado novo no painel além do rascunho: parar e relatar.
