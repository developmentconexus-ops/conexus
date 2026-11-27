# A qualidade que trava

Trilha Dados, a etapa `T2` do tratamento do lago, na ordem que o fundador decidiu em 2026-11-25 (Q8
do quadro do estudo do tratamento, [aprovação](../approvals/o-primeiro-modelo-vira-tabela-tratada.md))
e em 2026-11-26 ("A": a `T1`, depois A passada inteira agendada). A pergunta: "Quando o número não
bate, a tabela de ouro não troca, e eu recebo o aviso com o motivo?"

O estudo fica fora do repositório (delivery L21): `conexus-lago-t2-estudo`, de 2026-11-27. `EST:N` é a
linha `N` do relatório `data/conexus-lago-t2-estudo/report.md` do firstmate; `U1T1:N`, o registro da
U1 da `T1` (`data/conexus-lago-t1-u1/report.md`); `N:<página>:N`, a cópia da documentação da Nekt de
2026-11-14. As decisões A a E estão em aberto: o cartão está escrito com a opção (a) de cada uma, e
cada seção que uma resposta muda diz onde.

Cada linha do `main` citada foi lida em `57400a0c2`, o merge do pull request 1492 (a v0.24.136, que
publica a `T1`). As versões que a construção usa são as da `T1`: `dbt-core` 1.12.7, `dbt-athena`
1.11.2, `dbt-adapters` 1.24.6, `dbt-common` 1.39.0, `botocore` 1.44.10; nenhum pacote novo.

**O que o cartão mudou sobre o estudo.** A conferência no `main` mudou três pontos do cartão proposto
(`EST`, seção 7):

1. A seleção mora em `apps/server/src/hub/treatment/select.ts:16-42`, não em `treatment-rows.ts`, e
   já escolhe todo modelo cujo último estado não é `BUILT` (`:35`). `HELD` entra sem lógica nova; só
   o tipo `LastStatus` (`:9`) cresce.
2. A receita anterior não pede uma segunda lista. O lago cuja receita não está em `treatable` já é
   `OUTDATED` (`apps/server/src/hub/treatment/models.ts:178`): o tratamento recusa com
   `LAKE_NOT_READY`, e a Central diz "Este lago é de uma receita anterior. Para tratar o dado, apague e
   crie o lago de novo." (`apps/web/src/hub/operations/lake.tsx:19-20`). Com a decisão E (a), a receita
   da `T1` não entra em `TREATABLE_BEFORE` (`apps/server/src/platform/config-aws.ts:91-98`), e é só
   isso (a decisão F10).
3. O cartão de A passada inteira agendada (pull request 1463, aprovado em 2026-11-26) vem antes desta
   etapa e já tira do lago o que sumiu do Sankhya quando a passada está ligada. A régua contra o
   sistema (decisão B) continua fora, mas pelo motivo de agora: a tarefa da cópia não conta nada na
   fonte (`apps/extraction/src/conexus_extraction/target.py:226-233`).

As unidades usam números, sem letras.

**Antes da construção.**

1. **Os ajustes de tela da `T1`** (https://github.com/developmentconexus-ops/conexus/issues/1491)
   fecham com a `T1`, antes da U7, que muda as mesmas telas.
2. **A U1, a prova no laboratório** (decisão A). A U2 e a U4 não começam antes dela: o que ela medir
   fixa a lista do papel e a troca.
3. **A passada inteira agendada** muda `apps/extraction/src/conexus_extraction/entry.py` e
   `update.py`. A U4 muda `treat.py` e cria `swap.py`; ela espera o merge da passada se tocar um arquivo
   que a passada mude (delivery L1).

## A página do fundador

**No fim desta etapa** cada tabela tratada e cada tabela do Negócio têm os seus testes. Depois de
cada cópia, o Conexus monta a tabela nova ao lado, roda os testes nela, e só troca se nenhum teste que
trava falhar. Quando um falha, a versão anterior continua no ar. Dados diz qual teste falhou e em
quantas linhas, e você recebe o aviso no sino e por e-mail.

**O roteiro de uso.**

1. Na Central, você apaga e cria o lago de novo (decisão E) e marca as tabelas do Sankhya em Dados.
   Depois da primeira cópia, em Tratado, Notas e pedidos tem a aba **Testes**: "Número da nota: não
   vazio · Trava · do molde" e "Número da nota: único · Trava · do molde", todos "Passou".
2. Em Venda, você clica **Propor mudança** e, em Testes, acrescenta "Tipo de movimento: valores
   aceitos V, P · Trava" e a **Conferência**: "A soma de Valor bate com" um `SELECT` de controle sobre
   Copiado (o firstmate o escreve com você). Salva e liga. O cartão Ligar mostra os testes.
3. Você clica **Tratar agora**. A Venda troca, com a hora, e a aba Testes mostra "Passou" em cada um.
4. O firstmate propõe um controle que não bate, e você o liga. Na rodada seguinte, Venda mostra
   "Travada: segue a versão das <HH:MM>. Conferência: o número não bateu." O sino mostra "Venda
   travou", e chega um e-mail com o link para Venda.
5. Você liga de novo o controle certo e trata. Venda troca, e chega "Venda voltou".
6. Um teste **Avisa** que falha mostra "Trocou, com 1 aviso", sem e-mail.

**O que você faz, e quando.** Antes: responde A a E. Depois da U1: confirma a lista de permissões que
ela mediu. Depois do G1: apaga e cria o lago de novo (passo 1). No G2: aprova as permissões da tabela
nova do aviso (data D11). No fim: faz o roteiro na nuvem, diz o que viu e aprova os textos das telas e
do e-mail.

**A visão.**

- "Um número calculado no lago mostra a regra e as fontes de que saiu, e não toma o lugar do número
  do ERP" (`VISION.md:24`, O dado é verdadeiro e diz de onde veio): a conferência compara o número com a cópia do
  sistema, e a tabela não troca quando ele não bate.
- "O que um agente aprendeu aparece como proposta, não como fato" (`VISION.md:58`, Conexus Data & Context):
  os testes do Negócio entram na versão, com o mesmo sim.
- "O lago é a única fonte dele" (`VISION.md:51`): a tabela nova, os testes e a troca ficam no lago.

Nada cruza a visão.

**Fica de fora.**

- **A régua contra o sistema ao vivo** (decisão B): ela pede que a tarefa da cópia conte na fonte, o
  que nenhuma etapa traz ainda; entra com a etapa 7 ou com o cartão que a pedir.
- **As linhas que falharam, guardadas e vistas** (decisão C): com o Explorer da T3a, que as mostra.
- **O lembrete por dia** de uma tabela travada: é do cartão do aviso de cópia parada.
- **Atualizar a receita no lugar** (decisão E).
- **Renomear um tratamento**: o nome fica fixo depois de criado, como o da tabela copiada.
- **Mudar os testes do molde pela tela**: o molde é código revisado, como na `T1`.
- **Testes por histórico** (a contagem de hoje contra a média), o Glue Data Quality e tirar a linha
  ruim e publicar o resto.
- **As issues `next-card` das pastas da etapa.** Nenhuma tem gatilho nas peças novas. Esperam: a #1263
  e a #1264, do diário da criação do lago (a U2 não muda o caminho da criação); a #1460, que é o
  cartão da passada inteira; a #1124 e a #1125, pela etapa 3; a #1237, a #1220, a #1218, a #1217 e a
  #1215, do Registro de dados, que esta etapa não toca; a #1226, pelo Lago 3.

**As decisões suas nesta etapa.** Nenhuma tem a sua palavra ainda. O cartão está escrito com a
opção (a) de cada uma, a recomendada.

- **A. O gasto da prova U1.** *Pendente da sua palavra; o cartão segue (a).* (a) O firstmate roda a
  prova na conta de laboratório, com teto de US$ 1 e só dado inventado, como na `T1`. Ela mede a lista
  mínima do papel para trocar, as duas renomeações seguidas, os testes na tabela nova, o teste em SQL
  no Athena, a gravação das linhas que falharam (para a T3a) e se a etiqueta do Lake Formation segue a
  troca (para o Lago 3). (b) Sem prova: o construtor da U2 adivinha a lista, e a U4 descobre na nuvem.
  Veredito: nativo; a medida é a da U1 da `T1`.
- **B. Contra o que a conferência confere.** Exemplo: a Venda de novembro soma R$ 1,2 milhão.
  *Pendente; o cartão segue (a).* (a) Contra a cópia no lago: você escreve um `SELECT` de controle
  sobre Copiado (a soma do total das notas de venda do mês), e a Venda só troca se o número bater. É o
  que o `AggregateMatch` do Glue, o GX e o teste em SQL do dbt fazem: todas comparam duas tabelas da
  mesma plataforma (`EST`, seção 3.4). (b) Contra o Sankhya ao vivo, a cada rodada: nenhuma referência
  faz isso na transformação, e a cópia hoje não conta nada na fonte. Veredito: nativo; como nativo,
  um teste em SQL do dbt sobre a tabela nova e a cópia.
- **C. As linhas que falharam.** Exemplo: 12 itens de nota sem número de nota. *Pendente; o cartão
  segue (a).* (a) A tabela trava (ou avisa, pelo nível), Dados mostra "Falhou: 12 linhas", e as
  linhas guardadas entram com o Explorer da T3a, que as mostra. (b) Guardar as linhas já nesta etapa,
  numa área `qualidade` do lago, sem tela que as mostre até a T3a. (c) Tirar as linhas e publicar o
  resto, como o `drop` do Databricks: o número de ouro muda sem ninguém decidir, e só o Databricks e o
  job ETL do Glue fazem isso. Veredito: (a) nativo (a contagem do dbt); (c) diverge do dbt, do GX e da
  Nekt no que a pessoa vê.
- **D. Quem recebe o aviso.** *Pendente; o cartão segue (a).* (a) O sino e o e-mail de Dono e
  Administradores (quem aprova tratamento), um aviso quando uma tabela trava e um quando ela volta,
  como o alerta global da Nekt para donos e administradores (`N:workspaces__alerts:13`, `:22-26`).
  (b) Só quem ligou a versão. (c) Uma lista de e-mails por tratamento, como a Nekt por recurso: pede
  uma tela a mais. Veredito: nativo; o molde do aviso dos pedidos (`requestNotice`) e o e-mail da
  automação.
- **E. O lago da receita anterior.** A troca pede permissões novas na receita do lago. *Pendente; o
  cartão segue (a).* (a) Apagar e criar o lago de novo, uma vez, como na `T1`; os tratamentos e as
  versões ficam no Hub e rodam na primeira cópia. A atualização no lugar ganha etapa própria antes da
  conta oficial da AWS, onde apagar não serve mais. (b) Construir a atualização no lugar
  (https://github.com/developmentconexus-ops/conexus/issues/1424) nesta etapa: cerca de 700 linhas a
  mais, uma lista das receitas que trocam, e a etapa se divide em duas. Veredito: nativo (o caminho de
  hoje).

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| — | U1 A prova da troca no lago | a lista mínima do papel para trocar, as duas renomeações, os testes na tabela nova, o teste em SQL, a gravação das falhas, a etiqueta depois da troca, e as gravações para a U4 | `apps/extraction/tests/recordings/` | testing | a decisão A |
| G1 | U2 A receita que troca | as concessões curinga e a `RenameTable` no papel do tratamento | `infra/aws/` | security | U1 |
| G1 | U3 Os testes do molde | `moldTests` (a chave e o que o molde declara) e os do Sankhya | `packages/connectors/src/kernel/`, `packages/connectors/src/sankhya/` | data | — |
| G1 | U4 A tarefa que testa e troca | os testes no projeto dbt, as ondas, a troca, `HELD` e os testes no resultado | `apps/extraction/`, `apps/server/src/hub/treatment/treat-task.ts`, `docs/reference/boundaries.md` | testing | U1, U3 |
| G2 | U5 Os testes no Hub | os testes na versão e na conferência do SQL; `HELD` e `model_run.tests`; a lista | `apps/server/src/hub/treatment/`, `packages/hub-api/src/treatment*.ts`, uma migração | data | G1 |
| G2 | U6 O aviso | `notifications.treatment_notice`, o sino e o e-mail, por passagem | `apps/server/src/hub/notifications/`, `apps/server/src/hub/treatment/treatment-notice.ts`, `packages/hub-api/src/notifications.ts`, `apps/server/database-grants.sql`, uma migração | data | U5 |
| G2 | U7 Os testes em Dados | a aba Testes, Travada e Com aviso, os testes no formulário e no cartão Ligar, o aviso no sino | `apps/web/src/hub/treatment/`, `apps/web/src/hub/notifications/` | web | U5, U6 |

Dois pull requests (delivery L9), um commit por unidade. A U1 não tem código de produto: o registro
fica no `conexus-estudos` e as gravações entram com a U4.

**Orçamento de código alterado** (estimado por analogia com as unidades da `T1`, sem testes nem
gerados). U1: 0. U2: 120. U3: 220. U4: 600. U5: 850. U6: 550. U7: 1.000. Total: 3.340, dentro da
delivery L2. Com a decisão E (b), entra uma unidade de cerca de 700 linhas e a etapa se divide em duas.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Na conta de laboratório, `RenameTable(<t> → <t>__velha)`, `RenameTable(<t>__nova → <t>)` e `DeleteTable(<t>__velha)` pelo papel do tratamento, com a lista mínima medida; o registro mede a janela do leitor (dez vezes) e diz se a concessão curinga basta para o tratamento ler, apagar e trocar de novo a tabela trocada | o registro da U1 | must |
| 2 | U1 | Um `dbt build` com `alias='<t>__nova'` roda os testes genéricos e os em SQL contra `<t>__nova`; um `UNIQUE` de duas colunas e um `MATCH` falham com `failures` igual ao número de linhas plantadas | o registro da U1; `apps/extraction/tests/recordings/treat-tests-*.jsonl` | must |
| 3 | U1 | `store_failures_as: table`, com `schema` numa área que existe e `catalog_name: lago`, grava a tabela das falhas, ou o registro diz o erro (para a T3a) | o registro da U1 | should |
| 4 | U1 | O registro diz se uma etiqueta do Lake Formation numa tabela segue a `RenameTable` (para o Lago 3) | o registro da U1 | should |
| 5 | U2 | O papel do tratamento tem, em `tratado` e `negocio`, as concessões curinga que a U1 mediu e o fundador confirmou, e `s3tables:RenameTable` só nas tabelas dessas áreas; nada novo em `raw` e `current`; o papel da cópia segue sem `RenameTable` | `infra/aws/test/treater.test.ts`, "a troca"; `infra/aws/test/lake.test.ts` | must |
| 6 | U2 | Um lago da receita da `T1` é de receita anterior: Tratar agora e Propor recusam com `LAKE_NOT_READY`, Tratado mostra a receita anterior, e a Central mostra a frase de hoje; um lago da receita nova trata e troca | `apps/server/src/hub/treatment/treatment-routes.test.ts`, "receita anterior"; `apps/web/src/hub/operations/lake.test.tsx` (sem mudança) | must |
| 7 | U3 | `moldTests` dá, para cada coluna da chave da tabela, um `NOT_NULL` e, para a chave inteira, um `UNIQUE`, os dois `BLOCK`, pelo `as` da coluna do molde de mesma `column`; uma chave sem coluna no molde é recusada pela conformidade | `packages/connectors/src/kernel/tables-treated.test.ts`; `conformance-tables.test.ts` | must |
| 8 | U3 | A conformidade recusa um teste do molde com coluna fora do molde, um `RELATIONSHIP` para uma tabela sem molde e um `id` repetido | `packages/connectors/src/kernel/conformance-tables.test.ts` | must |
| 9 | U3 | O Sankhya declara as relações de itens com notas e de notas com parceiros, `BLOCK`, e um `ACCEPTED_VALUES` no tipo de movimento, `WARN` | `packages/connectors/src/sankhya/copy-tables.test.ts` | must |
| 10 | U4 | Com testes que passam, a tarefa constrói `<t>__nova`, troca, conta e manda `BUILT` com cada teste `PASS`; `<t>__nova` e `<t>__velha` não ficam no lago | `apps/extraction/tests/test_treat.py`, "troca" | must |
| 11 | U4 | Um teste `BLOCK` que falha deixa `<t>` como estava, apaga `<t>__nova` e manda `HELD` com o teste `FAIL` e `failures`; um modelo que depende dele, numa onda seguinte, vem `SKIPPED` e não roda | `test_treat.py`, "trava" | must |
| 12 | U4 | Um teste `WARN` que falha troca e manda `BUILT` com o teste `FAIL`; um teste que dá erro no Athena (uma coluna que não existe) vem `ERROR` e decide como `FAIL` no nível dele | `test_treat.py`, "avisa" | must |
| 13 | U4 | Um filho numa onda seguinte lê a tabela já trocada pelo pai na mesma rodada | `test_treat.py`, "ondas" | must |
| 14 | U4 | A segunda renomeação que falha volta `<t>__velha` a `<t>` e manda `FAILED` com `TREAT_SWAP_FAILED`; um `<t>__velha` sem `<t>`, deixado por uma tarefa caída, volta a `<t>` antes da onda | `test_treat.py`, "troca pela metade" | must |
| 15 | U4 | O resultado leva só ids, estados e contagens: nenhum valor de célula, nem o texto do Athena (F7 da `T1`, security S41); um controle com `{{`, `{%` ou `{#` termina em `TREAT_SPEC_INVALID` | `test_treat.py`, "só contagens"; `apps/server/src/hub/treatment/treat-task.test.ts` | must |
| 16 | U4 | A rodada de cópia e um modelo sem testes seguem iguais (o modelo sem testes troca) | `apps/extraction/tests/test_entry.py`, os casos de hoje; `test_treat.py`, "sem testes" | must |
| 17 | U5 | Propor uma versão com testes guarda os testes na versão e no hash; o mesmo SQL com outro teste é outra versão, e a versão ligada não muda até o sim | `treatment-routes.test.ts`, "testes na versão" | must |
| 18 | U5 | A proposta é recusada, sem gravar: teste com coluna fora do formato ou id repetido (`TREATMENT_TEST_INVALID`, com o índice), `RELATIONSHIP` para uma tabela que a empresa não tem (`TREATMENT_INPUT_UNKNOWN`), controle de `MATCH` que não é um `SELECT` ou que lê fora de `current`, `tratado` e `negocio` (os códigos do SQL de hoje, no campo do controle), e mais de 30 testes | `treatment-routes.test.ts`, um caso por código | must |
| 19 | U5 | O `TREAT_RESULT` grava `HELD` e os testes em `model_run.tests`; um resultado repetido não grava de novo; a seleção põe `HELD` na próxima cópia que toca uma entrada e no Tratar agora | `treatment-run.test.ts`; `select.test.ts` | must |
| 20 | U5 | A lista e o modelo trazem os testes do molde e os da versão ligada, cada um com o último resultado; quando a última rodada é `HELD`, a linha diz travada, com a hora da última boa | `treatment-list.test.ts` | must |
| 21 | U6 | O fechamento que passa um modelo de `BUILT`, ou de nunca gravado, para `HELD` grava um aviso "travou" para cada pessoa que aprova tratamento e manda um e-mail a cada uma; a volta de `HELD` para `BUILT` grava "voltou"; duas rodadas `HELD` seguidas não avisam de novo; um resultado repetido não avisa | `apps/server/src/hub/treatment/treatment-notice.test.ts` | must |
| 22 | U6 | O e-mail que falha (`MAIL_UNAVAILABLE`) não desfaz o aviso nem o fechamento; o aviso é só da pessoa (a política de linha recusa ler o de outra pessoa e o de outra empresa) | `treatment-notice.test.ts`; `apps/server/src/hub/notifications/tables.test.ts` | must |
| 23 | U7 | A aba Testes lista cada teste com o rótulo, o nível e o último resultado ("Passou", "Falhou: 12 linhas", "Avisou: 3 linhas", "Deu erro ao rodar", "Não rodou"); os do molde dizem "do molde" e não se editam | `apps/web/src/hub/treatment/treated-tests.test.tsx` | must |
| 24 | U7 | Uma tabela travada mostra "Travada: segue a versão das <HH:MM>" e o primeiro teste que falhou; uma que nunca trocou e travou mostra "Ainda sem versão: <teste> falhou"; "Trocou, com <n> aviso(s)" para os `WARN` | `treated-table.test.tsx`; `treated-layer.test.tsx` | must |
| 25 | U7 | Novo tratamento e Propor mudança acrescentam, mudam e tiram testes e a conferência; cada recusa do critério 18 aparece no teste dela; o cartão Ligar lista os testes | `new-treatment.test.tsx`; `approve.test.tsx` | must |
| 26 | U7 | O sino mostra "<tabela> travou" e "<tabela> voltou", com o link para a tabela; o de uma tabela que saiu diz "Esta tabela não existe mais" | `apps/web/src/hub/notifications/bell.test.tsx` | must |
| 27 | U7 | A 390 px, a aba Testes, o formulário com testes e o cartão cabem sem rolagem lateral, nos dois temas | a QA (testing T25) | should |
| 28 | todas | O roteiro de uso, feito na nuvem pelo fundador, sem terminal | o uso | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Aba Testes | "Não rodou" em cada teste | "Esta tabela não tem testes." (Negócio: e o caminho para Propor mudança) | o esqueleto das abas da `T1` | `CATALOG_FAILED`, como as abas da `T1` | a da `T1` | a da `T1` | a receita anterior: a frase de hoje |
| Tratado e Negócio, a linha da tabela | as da `T1` | as da `T1` | as da `T1` | Travada; Ainda sem versão; Trocou, com aviso | as da `T1` | as da `T1` | as da `T1` |
| Formulário, seção Testes | vazia, ou os da versão ligada | "Nenhum teste" e Acrescentar | Salvar ocupado | a recusa no teste dela | — | o formulário não abre | `TREATMENT_VERSION_CHANGED` |
| Cartão Ligar | os testes da proposta | "Sem testes" | o de hoje | o de hoje | o de hoje | o de hoje | `TREATMENT_VERSION_CHANGED` |
| Sino | — | o de hoje | o de hoje | o de hoje | "Esta tabela não existe mais" | o de hoje | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `TreatedTable.tests` | U3, cada conector | U3 (`moldTests`) |
| `moldTests(declaration)` | U3 | U5 (a especificação e a lista) |
| `TreatModel.tests` | U5 (da versão e de `moldTests`) | U4 (o `schema.yml` e os testes em SQL) |
| `TreatTaskResult.models[].tests`, `HELD` | U4 | U5 (grava), U6 (a passagem) |
| `treatment.version.tests` | U5, ao salvar | U5 (o hash, a especificação), U7 (o formulário, o cartão, a aba) |
| `treatment.model_run.tests` | U5 | U5 (a lista), U7 (a aba Testes, Travada) |
| `notifications.treatment_notice` | U6 | U6 (a página do sino), U7 (o sino) |
| `NotificationRow` `TREATMENT_HELD`, `TREATMENT_BACK` | U6 | U7 |

O desenho, a 1280 px:

    ┌ Venda ─────────────────────────────────────────── [Propor mudança] ─┐
    │ Travada: segue a versão das 14:05 · Conferência: o número não bateu  │
    │ [Visão geral] [SQL] [Testes] [De onde vem] [Quem lê] [Versões]       │
    │  Tipo de movimento   valores aceitos V, P   Trava   Passou           │
    │  Conferência         soma de Valor          Trava   Falhou           │
    │  Cliente             existe em Parceiros    Avisa   Avisou: 3 linhas │
    └──────────────────────────────────────────────────────────────────────┘

A 390 px, cada teste quebra em duas linhas:

    ┌ Venda ───────────── [Propor] ┐
    │ Travada: segue a das 14:05   │
    │ [Testes ▾]                   │
    │  Conferência · Trava         │
    │  soma de Valor      Falhou   │
    │  Cliente · Avisa             │
    │  existe em Parceiros Avisou 3│
    └──────────────────────────────┘

Peças de `ui/`: as da `T1` mais `badge` para o nível e o resultado; nenhuma peça nova. O modelo de
tela é a aba Expectations da Nekt (`N:catalog__expectations:9-19`), que a QA abre ao lado da captura.

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio | Uma dependência fora | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `RenameTable` e `DeleteTable` da troca (U4) | uma rodada aberta por empresa (o índice da `T1`); o `versionToken` recusa uma troca sobre outra | a segunda renomeação que falha desfaz a primeira; a tarefa caída entre as duas deixa `__velha`, que a onda seguinte volta | a AWS fora: `FAILED` com `TREAT_SWAP_FAILED`; a tabela anterior fica | `TREAT_SWAPPED` com o modelo; `TREAT_SWAP_FAILED` com o tipo do erro | 10, 14 |
| O `dbt build` de uma onda (U4, da biblioteca) | idem | uma onda que cai: as seguintes não rodam, e os modelos que não trocaram vêm `SKIPPED` | o Athena fora: o teste dá `error` e decide como `FAIL` | o log do dbt ao log da tarefa, como hoje | 11, 12 |
| `DeleteTable(<t>__nova)` depois de um `HELD` (U4) | idem | a tarefa caída deixa `__nova`, que o `drop_relation` do dbt apaga na próxima | a AWS fora: a próxima rodada apaga | `TREAT_HELD` com o modelo e os ids dos testes | 11 |
| `UPDATE` do fechamento com `HELD` e `model_run.tests` (U5) | a condição `ended_at is null` da `T1` | uma transação (data D22) | `DATABASE_UNAVAILABLE`: a mensagem volta à fila | `TREATMENT_RUN_CLOSED` com a contagem de `HELD` | 19 |
| `INSERT` de `treatment_notice` (U6) | o índice único `(run_id, name, person_id)` e `on conflict do nothing` | na mesma transação do fechamento | o banco fora: como o fechamento | `TREATMENT_NOTICE` com o modelo e a passagem | 21 |
| O e-mail do aviso (U6) | um por aviso gravado | depois da transação | `MAIL_UNAVAILABLE`: o aviso fica no sino | `MAIL_FAILED`, como hoje | 22 |
| `INSERT` da versão com testes (U5) | os índices da `T1` | uma transação | `DATABASE_UNAVAILABLE` | `TREATMENT_PROPOSED` | 17, 18 |

## A tabela de referência

A do estudo (`EST`, seção 5), com a unidade e o arquivo novo de cada linha. Veredito pelo código C75.

| # | Peça | O que o fundador já decidiu | Hoje no `main` (`57400a0c2`) | Referência (situação) | Veredito | Prova, se não for nativo | Unidade e arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Os testes de dado como declaração | Q2 (a) da `T1` (a Fábrica escreve a limpeza); `T2` na trilha | nenhum | dbt genéricos e `data_tests:` (`dbt-core@1.12.7 include/global_project/macros/generic_test_sql/*.sql`, `parser/generic_test_builders.py:253`); ODCS `quality` (`docs/data-quality.md:73-80`) | nativo | — | U4: `treat.py` gera o `schema.yml`; contrato em `treat-task.ts` |
| 2 | Os dois níveis, Trava e Avisa | nada registrado | nenhum | `severity: warn` não propaga (`dbt-core task/test.py:293-327`); Soda `level: warn` (`contract_yaml.py:740-762`); Databricks `warn` e `fail` | nativo | — | U4 e U5 |
| 3 | Os testes do molde, da chave | Q2 (a) | `TableDeclaration.key` (`packages/connectors/src/kernel/tables.ts:93`) sem teste | staging do dbt com `unique` e `not_null` na chave (`dbt-docs@fc5b50c best-practices/how-we-structure/2-staging.md`); Glue `IsPrimaryKey` | nativo | — | U3: `moldTests` em `kernel/tables-treated.ts` |
| 4 | O `UNIQUE` de várias colunas | — | nenhum | `dbt_utils.unique_combination_of_columns` (não instalado); teste em SQL puro (compilado no rascunho do estudo) | embrulhado | compilou no `dbt-core` 1.12.7; a U1 o roda no Athena | U4 |
| 5 | Os testes do Negócio na versão | Q7 (a) da `T1` (a versão no Hub, com o sim) | `treatment.version` sem testes (`hub/treatment/tables.ts:57-90`); o hash de `{sql, inputs}` (`versions.ts:56`) | a regra anda com o código: dbt yml, GX suíte, Databricks decorador | nativo | — | U5: coluna `tests` na versão, no hash |
| 6 | A conferência (`MATCH`) contra Copiado | a decisão B | nenhuma | Glue `AggregateMatch`; GX `expect_table_row_count_to_equal_other_table` (`expectations/core/expect_table_row_count_to_equal_other_table.py:68-199`); teste em SQL do dbt | embrulhado | compilou; a U1 o roda | U4 (gera), U5 (confere o controle ao salvar, por `readModelSql`, `sql.ts:67`) |
| 7 | A régua contra o sistema ao vivo | a decisão B | `target.py:226-233` conta só o lido e o gravado | régua da chegada (`EST/medalhao:340`); reconciliação do Soda fora do núcleo (`common/yaml.py:625-631`) | nativo (fica de fora) | — | fica de fora (decisão B) |
| 8 | A troca segura | decisão 5 da `T1`: "a troca pelo RenameTable nasce na `T2` com os testes" | `dbt-athena@1.11.2 table.sql:102-112` apaga e cria; a entrada `dbt-athena 1.11.2` de `docs/reference/boundaries.md` | `dbt-adapters@1.24.6 macros/materializations/models/table.sql:30-59` (renomear para o lado, trocar, apagar); Databricks rollback atômico; `RenameTable` (`U1T1:190-204`) | embrulhado (o dbt constrói e testa, a tarefa troca pela API) | `U1T1`: 272 ms, 409 num nome que existe, a mesma ARN; a U1 mede as duas renomeações | U4: `apps/extraction/src/conexus_extraction/swap.py`; a entrada de `boundaries.md` muda |
| 9 | As ondas | — | `treat.py:124-131`, um `build` só | o dbt troca dentro do nó do modelo (`dbt-core compilation.py:237-247`), e nenhuma referência constrói em ondas; é o custo de não haver WAP no dbt | remendo | com `dbt-core` 1.12.7 e `dbt-athena` 1.11.2, a U1: um filho numa onda seguinte lê a tabela já trocada; a entrada em `boundaries.md` (rever quando o dbt-athena trocar no `S3 Tables`) | U4 |
| 10 | As concessões curinga e a `RenameTable` no papel | decisão 4.2 (a) da `T1` (o papel próprio) | `infra/aws/lib/treater.ts:114-145` sem curinga nas áreas que escreve; `treaterStatements` (`:37-97`) sem `s3tables:*` | a doc do Lake Formation: "Don't specify a table"; `U1T1:196-204` | nativo | a U1 mede a lista mínima | U2: `infra/aws/lib/treater.ts` |
| 11 | A receita anterior | decisão 2 (b) da `T1`; a decisão E | `OUTDATED` por `treatable` (`models.ts:178`, `config-aws.ts:91-98`); a frase (`lake.tsx:19-20`) | apagar e criar, como na `T1`; ou `UpdateStack` (issue 1424) | nativo (o de hoje) | — | U2: nenhum arquivo; a receita da `T1` não entra em `TREATABLE_BEFORE` (F10) |
| 12 | O estado `HELD` e a seleção | a regra da `T1`: os que não gravaram por último entram na próxima | `MODEL_STATUSES` (`tables.ts:22`); `selection` (`select.ts:16-42`) | Databricks "Manual intervention" no `fail`; Nekt falha a rodada | nativo | — | U5: `HELD` em `model_run`; `LastStatus` ganha `HELD` |
| 13 | O resultado dos testes | F7 da `T1` (só o tipo, nunca o texto) | `TreatTaskResult` (`treat-task.ts:58-77`) | `RunResult.status`, `failures` (`dbt artifacts/schemas/results.py:58-86`); `attached_node` (`artifacts/resources/v1/generic_test.py:30`) | nativo | — | U4 (manda), U5 (grava `model_run.tests`) |
| 14 | As linhas que falharam | a decisão C | nenhuma | `store_failures` (`dbt-core materializations/tests/test.sql:11-47`); Databricks duas visões; GX `get_unexpected_rows` | nativo (a contagem); as linhas guardadas ficam de fora | — | U4 conta; as linhas: T3a (decisão C) |
| 15 | O aviso | "a unidade é a parada" (cópia parada, 2026-11-21); a decisão D | `requestNotice` (`notifications/tables.ts:121-147`), `noticeRequests` (`request-notices.ts:13-25`), `membersAllowed` (`requests/requests.ts:122`), o e-mail da automação (`notifications/notifications.ts:150-175`, `mail.ts:16-24`) | Nekt e-mail a donos e administradores (`N:workspaces__alerts:13`, `:22-26`); Databricks notificação de job; GX ações | nativo (o molde do Hub) | — | U6: `notifications.treatment_notice`, `apps/server/src/hub/treatment/treatment-notice.ts` |
| 16 | A aba Testes e o estado Travada em Dados | Q1 (a) da `T1` (as camadas em Dados) | `treated-table.tsx:267` (abas), `treated-layer.tsx` | a aba Expectations da Nekt (`N:catalog__expectations:9-19`); a aba Data quality do Databricks | nativo | — | U7: `apps/web/src/hub/treatment/treated-tests.tsx` |
| 17 | Os testes no formulário e no cartão Ligar | Q7 (a) | `new-treatment.tsx:209` (`PROPOSE_CHANGE`), `approve.tsx` | Nekt "Add Expectations"; o cartão mostra o que roda (linha 19 da `T1`) | nativo | — | U7 |
| 18 | A etiqueta do Lake Formation depois da troca | 0078 | — | não medido | nativo (só a medida) | a U1 mede | U1 (só a medida); o Lago 3 decide |
| 19 | A tabela nova que sobra | — | o `drop_relation` do dbt apaga a candidata velha (`dbt-athena table.sql:106`) | `dbt-adapters` apaga o backup no fim (`table.sql:59`) | nativo | — | U4 (passo 4) |

**A medida do transplante.** Nada vem do repositório antigo.

**A dívida.**

- As ondas existem porque o dbt troca dentro do nó (linha 9): a entrada em `docs/reference/boundaries.md`
  diz quando rever (um dbt-athena que troque no `S3 Tables`).
- O `SELECT` de controle é escrito pela pessoa; a conferência só pega a regra errada se o controle for
  escrito de outro jeito (`EST/medalhao`, 6.1).
- A etiqueta do Lake Formation depois da troca (critério 4) é do Lago 3.
- Uma coluna de teste do Negócio só é conferida na rodada (F9).

## As decisões do firstmate

| # | Decisão reversível (delivery L6) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| F1 | Dois níveis, `BLOCK` e `WARN` | todas as referências convergem em dois (`EST`, 3.4); tirar a linha é a decisão C | um terceiro nível no enum |
| F2 | Os testes são os quatro genéricos do dbt, o `UNIQUE` de várias colunas e o `MATCH`, como união | os genéricos são do core (`generic_test_sql/*.sql`); o resto, em SQL puro; nenhum pacote novo | acrescentar uma variante |
| F3 | A chave do kit dá os testes do molde sozinha | a chave já é declarada (`kernel/tables.ts:93`) e é a regra do staging do dbt; um dono só (C26) | a Fábrica declarar à mão |
| F4 | Os testes do Negócio moram na versão, no hash | Q7 (a) da `T1`; a regra anda com o código no dbt, no GX e no Databricks | uma tabela própria de testes, fora da versão |
| F5 | A tarefa troca pela API em ondas, no molde do `dbt-adapters` (para o lado, trocar, apagar) | o dbt troca dentro do nó (`dbt-athena table.sql:102-112`), e o SQL da pessoa lê nomes literais; renomear para o lado antes de apagar deixa sempre uma versão para voltar (`dbt-adapters table.sql:30-59`) | o apagar e renomear da U1 da `T1`, mais curto e sem volta |
| F6 | Um teste que dá erro vem `ERROR` e decide como `FAIL` no nível dele | um teste que não roda não prova nada; o `error` do dbt também propaga (`dbt-core task/build.py:38-43`) | tratar `ERROR` como aviso |
| F7 | `HELD` entra na seleção como os outros não gravados | `selection` já escolhe todo modelo cujo último estado não é `BUILT` (`select.ts:35`) | esperar a próxima cópia da entrada |
| F8 | O aviso é por passagem, não por rodada | a unidade é a parada (o fundador, cópia parada); a Nekt avisa por rodada que falha, e por isso a diferença é nossa e declarada | um aviso por rodada `HELD` |
| F9 | Uma coluna de teste do Negócio só é conferida na rodada | o Hub não sabe as colunas de saída do SQL da pessoa antes de rodar (nenhum `DESCRIBE` no Hub); um teste com coluna que não existe dá `ERROR` e trava | ler as colunas na T3a, que roda o SQL com teto |
| F10 | Com a decisão E (a), a receita da `T1` não entra em `TREATABLE_BEFORE`, e o lago dela fica `OUTDATED` pelo caminho de hoje | a lista diz quais receitas têm o que o tratamento precisa (`config-aws.ts:90-94`); a da `T1` não tem as concessões da troca; o estado `OUTDATED`, a recusa e a frase já existem (`models.ts:178`, `lake.tsx:19-20`); uma segunda lista ou um caminho sem troca seria lógica paralela | com a decisão E (b), a lista das receitas que trocam e a atualização no lugar |
| F11 | Quem recebe o aviso são as pessoas que podem `approveTreatment`, por `identity.membersAllowed` | é como os pedidos acham quem decide (`requests/requests.ts:122`); com a decisão D (a), são Dono e Administradores | outra ação, pela decisão D |

## U1 A prova da troca no lago

**Base e modelo.** `57400a0c2`. O firstmate, com Sonnet, na conta de laboratório, com teto de US$ 1 e
só dado inventado (decisão A); nenhuma linha de produto.

### As linhas da tabela

As linhas 4, 6, 8, 9, 10, 14 e 18. A receita da U2 em rascunho segue `infra/aws/lib/treater.ts:114-145`;
a troca, `dbt-adapters@1.24.6 table.sql:30-59`; a `RenameTable`, o modelo de serviço do `s3tables` em
`botocore` 1.44.10 (`tableBucketARN`, `namespace`, `name`, `newNamespaceName`, `newName`,
`versionToken`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/extraction/tests/recordings/` | Cria as gravações `treat-tests-*.jsonl` e `treat-swap-*.jsonl`, que entram no commit da U4 | `tests/athena_double.py` (U4) |

### Os contratos que a unidade cria

Nenhum. O registro vai para `conexus-estudos/estudos/conexus-lago-t2-u1/` (delivery L21).

### As skills e a leitura

`aws-sdk-python-usage`, `aws-iam`, `aws-cdk` (as linhas de `infra/aws` e `boto3` do `stack.md`); o
guia de testes.

### A ordem do trabalho

1. **Uma pilha de laboratório com a receita da U2 em rascunho**: as concessões curinga e
   `s3tables:RenameTable`. Critério: 1.
2. **A troca**, dez vezes, numa tabela inventada de 450 colunas e 100 mil linhas: as duas renomeações e
   o apagar; a janela do leitor; a lista mínima, tirando uma permissão por vez. Critério: 1.
3. **Os testes na tabela nova**: um projeto dbt à mão com `alias='<t>__nova'`, os quatro genéricos,
   um `UNIQUE` de duas colunas e um `MATCH`, cada um com linhas plantadas. Critério: 2.
4. **`store_failures_as: table`** numa área criada só para a prova. Critério: 3.
5. **A etiqueta** do Lake Formation numa tabela, antes e depois da troca. Critério: 4.
6. **Gravar** as respostas do Athena, do Glue e do `S3 Tables`, com os valores inventados, para os
   testes da U4.

### Como se prova

O registro, com cada chamada, a resposta e o tempo; nenhuma conta, nenhum segredo.

### Parar se

- A concessão curinga não deixa o tratamento ler ou apagar a tabela trocada: a troca volta ao estudo
  com a medida.
- A janela do leitor nas duas renomeações passa de 10 s.
- O gasto passa de US$ 1.

## U2 A receita que troca

**Base e modelo.** `57400a0c2`, depois da U1. Sonnet.

### As linhas da tabela

- **10.** `infra/aws/lib/treater.ts:114-145` (`treaterGrants`): as áreas que o tratamento escreve
  ganham o `tableWildcard` com a lista da U1 (o estudo espera `SELECT`, `DESCRIBE`, `INSERT`,
  `DELETE`, `ALTER`, `DROP`); `treaterStatements` (`:37-97`) ganha `s3tables:RenameTable` e
  `s3tables:GetTable` só nas tabelas de `tratado` e `negocio`, pela condição `s3tables:namespace`, como
  o papel da cópia faz nas dele.
- **11.** Nenhum arquivo: `TREATABLE_BEFORE` fica vazia (F10).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `infra/aws/lib/treater.ts` | Muda `treaterGrants` e `treaterStatements` | `infra/aws/lib/lake.ts:104` |
| `infra/aws/lake.template.json` | Gerado de novo | `apps/server/src/platform/config-aws.ts` (`LAKE_TEMPLATE`, o sha) |
| `infra/aws/test/` | Muda `treater.test.ts`, `lake.test.ts` | — |

### Os contratos que a unidade cria

Nenhum tipo. A receita do lago muda; o sha novo é o da imagem, e a receita da `T1` passa a
`OUTDATED` (critério 6).

### As skills e a leitura

`aws-cdk`, `aws-iam` (as linhas de `infra/aws` do `stack.md`, "Read first": o README de
`aws-cdk-lib`, `assertions`, e os tipos L1 de `aws-lakeformation`); o guia de segurança.

### A ordem do trabalho

1. **As concessões e a `RenameTable`.** Critério: 5. **Arquivos:** `treater.ts`, `lake.template.json`.
   **Referência a seguir:** `treater.ts:126-140` (o `grant` e o `tableWildcard` das áreas que lê).
   **Testes:** `treater.test.ts`, "a troca": o modelo da receita tem o curinga nas duas áreas e a
   `RenameTable` só nelas. **Mutações à mão:** dar `RenameTable` ao papel da cópia, ou o curinga em
   `current`, e o teste fica vermelho.
2. **A receita anterior.** Critério: 6. **Testes:** `treatment-routes.test.ts`, "receita anterior",
   com um lago gravado com o sha da receita da `T1`: Tratar agora e Propor recusam com
   `LAKE_NOT_READY`. **Mutações à mão:** pôr o sha da `T1` em `TREATABLE_BEFORE`, e o caso fica
   vermelho.

### Como se prova

O 5 pelo modelo da receita gerada (`aws-cdk-lib/assertions`), sem a AWS; o 6 pela porta do Hub
(T5), com o lago gravado no banco de teste.

### Parar se

- A U1 mediu que a concessão curinga não basta.

## U3 Os testes do molde

**Base e modelo.** `57400a0c2`. Sonnet.

### As linhas da tabela

- **3.** `packages/connectors/src/kernel/tables.ts:88-100` (`TableDeclaration.key`, `treated`);
  `kernel/tables-treated.ts:26-33` (`treatedSelect`, o dono do `SELECT` do molde); a conformidade em
  `kernel/conformance-tables.ts`.
- O Sankhya: `packages/connectors/src/sankhya/copy-tables.ts:44-50` (itens, chave
  `['NUNOTA', 'SEQUENCIA']`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/tables-treated.ts` | Cria `TreatedTest`, `moldTests`; muda `TreatedTable` | U5 (`apps/server/src/hub/treatment/models.ts`) |
| `packages/connectors/src/kernel/conformance-tables.ts` | Muda: as recusas do critério 8 | os testes de conformidade de cada conector |
| `packages/connectors/src/sankhya/copy-tables.ts` | Muda: os testes declarados | o Hub, pelo kit |

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/tables-treated.ts
export type TreatedTestLevel = 'BLOCK' | 'WARN'
export type TreatedTest =
  | Readonly<{ id: string; level: TreatedTestLevel; kind: 'NOT_NULL'; column: string }>
  | Readonly<{ id: string; level: TreatedTestLevel; kind: 'UNIQUE'; columns: readonly string[] }>
  | Readonly<{ id: string; level: TreatedTestLevel; kind: 'ACCEPTED_VALUES'; column: string; values: readonly string[] }>
  | Readonly<{ id: string; level: TreatedTestLevel; kind: 'RELATIONSHIP'; column: string; to: Readonly<{ table: TableName; column: string }> }>
export type TreatedTable = Readonly<{ description: string; columns: readonly TreatedColumn[]; tests?: readonly TreatedTest[] }>
/** O único dono dos testes de um molde: os da chave, mais os declarados. */
export function moldTests(declaration: TableDeclaration): readonly TreatedTest[]
```

As colunas são os `as` do molde. Sem `MATCH`: no molde, a conferência contra Copiado é igual por
construção, porque o molde lê `current` sem filtro nem junção (`tables-treated.ts:26`). O `id` dos
testes da chave é `chave_nao_vazia_<as>` e `chave_unica`. O `RELATIONSHIP` aponta para uma tabela do
mesmo conector com molde; o Hub a traduz para a área `tratado`. O estado é a união pelo `kind` (C21);
o dono dos testes do molde é `moldTests` (C26). O arquivo modelo é `tables-treated.ts`, que cumpre C26.

### As skills e a leitura

As linhas de `packages/connectors` do `stack.md`; `conexus-connector` (o kit); o guia de dados.

### A ordem do trabalho

1. **`moldTests`.** Critério: 7. **Testes:** `tables-treated.test.ts`, "a chave dá os testes".
   **Mutações à mão:** tirar o `NOT_NULL` da chave, e o teste fica vermelho.
2. **A conformidade.** Critério: 8. **Testes:** `conformance-tables.test.ts`, um caso por recusa.
3. **O Sankhya.** Critério: 9. **Testes:** `copy-tables.test.ts`.

### Como se prova

Pela porta do kit (o conector declarado e a conformidade), sem o Hub.

### Parar se

- Uma tabela do Sankhya com molde não tem a coluna da chave no molde: a U3 não acrescenta a coluna;
  leva ao firstmate.

## U4 A tarefa que testa e troca

**Base e modelo.** `57400a0c2`, no ramo do G1 depois da U3, e depois do merge da passada inteira se
ela mudou `entry.py`. Opus: a troca e as ondas são concorrência e recuperação de falha (a regra do
fundador, 2026-09-12).

### As linhas da tabela

- **1, 2, 4, 6.** `dbt-core@1.12.7 include/global_project/macros/generic_test_sql/*.sql`,
  `parser/generic_test_builders.py:253` (`arguments:`), `artifacts/resources/v1/config.py:176-241`
  (`severity`); o teste em SQL com a linha `-- depends_on` (`treat.py:92`).
- **8, 9, 19.** `dbt-adapters@1.24.6 macros/materializations/models/table.sql:30-59`;
  `dbt-athena@1.11.2 macros/materializations/models/table/table.sql:102-112`; `botocore` 1.44.10,
  `s3tables` `RenameTable` (`versionToken`) e `DeleteTable`.
- **13.** `dbt-core artifacts/schemas/results.py:58-86`; `generic_test.py:30` (`attached_node`); o
  `depends_on.nodes` do teste em SQL.
- Na base: `treat.py:96-108` (`_write_project`), `:122-131` (`_built`), `:138-150` (`_end`), `:169-182`
  (`treated`); `apps/extraction/tests/athena_double.py`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/treatment/treat-task.ts` | Muda: `TreatTest`, `TreatModel.tests`, o resultado com `HELD` e `TestEnd` | U5; `apps/extraction/contract/treat-task.schema.json` (gerado) |
| `apps/extraction/src/conexus_extraction/` | Muda `treat.py`, `contract.py`; cria `swap.py` | a tarefa |
| `apps/extraction/tests/` | Muda `athena_double.py`, `test_treat.py`; entram as gravações da U1 | — |
| `docs/reference/boundaries.md` | Muda a seção `dbt-athena 1.11.2`: a saída nativa vira a troca em ondas, e o "rever quando" | `check-docs` |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/treatment/treat-task.ts
export const TestLevel = z.enum(['BLOCK', 'WARN'])
export const TestId = z.string().regex(/^[a-z][a-z0-9_]{0,40}$/).brand('TestId')
const Column = z.string().regex(/^[a-z][a-z0-9_]{0,59}$/)
export const TreatTest = z.discriminatedUnion('kind', [
  z.object({ id: TestId, level: TestLevel, kind: z.literal('NOT_NULL'), column: Column }),
  z.object({ id: TestId, level: TestLevel, kind: z.literal('UNIQUE'), columns: z.array(Column).min(1).max(8) }),
  z.object({ id: TestId, level: TestLevel, kind: z.literal('ACCEPTED_VALUES'), column: Column,
    values: z.array(z.string().max(100)).min(1).max(100) }),
  z.object({ id: TestId, level: TestLevel, kind: z.literal('RELATIONSHIP'), column: Column,
    to: z.object({ layer: z.enum(['tratado', 'negocio']), table: LakeTableName, column: Column }) }),
  z.object({ id: TestId, level: TestLevel, kind: z.literal('MATCH'),
    measure: z.discriminatedUnion('kind', [z.object({ kind: z.literal('COUNT') }),
                                           z.object({ kind: z.literal('SUM'), column: Column })]),
    control: z.string().max(5_000).regex(NoTemplate) }),     // um SELECT que devolve um número
])
// TreatModel ganha `tests: z.array(TreatTest).max(30)`.
export const TestEnd = z.discriminatedUnion('outcome', [
  z.object({ id: TestId, outcome: z.literal('PASS') }),
  z.object({ id: TestId, outcome: z.literal('FAIL'), failures: z.int().min(1) }),
  z.object({ id: TestId, outcome: z.literal('ERROR') }),     // só o estado; o texto do Athena fica no log
])
// O resultado de cada modelo:
//   BUILT   { rows, tests: TestEnd[] }   trocou; um WARN que falhou aparece em tests
//   HELD    { tests: TestEnd[] }         um BLOCK falhou ou deu erro; a versão anterior fica
//   FAILED  { failure, line }            como hoje; TREAT_SWAP_FAILED é um failure novo
//   SKIPPED                              como hoje: um modelo de que ele depende não trocou
```

O estado de cada modelo e de cada teste é união pelo campo que separa (C21). `TestId` é conferido
pelo esquema na entrada da tarefa (C23, C27). O dono da decisão (trocar ou travar) é uma função só
em `treat.py` (C26). O modelo de arquivo é `lake-task.ts`, como na `T1` (cumpre C21, C23 e C26).

### As skills e a leitura

As linhas de `apps/extraction` do `stack.md`: `boto3` (`aws-sdk-python-usage`), `uv`, `ruff`, `mypy`,
`pytest`, `duckdb`, `jsonschema`, `dbt-core` e `dbt-athena` (lidos da fonte instalada); o guia de
testes.

### A ordem do trabalho

1. **O contrato.** Critério: 15. **Arquivos:** `treat-task.ts`, o esquema gerado, `contract.py`.
   **Testes:** `treat-task.test.ts`: o esquema tem o `pattern` do controle. **Mutações à mão:** tirar o
   `regex` do controle, e o teste fica vermelho.
2. **Os testes no projeto.** Critérios: 2 (pela gravação), 12. **Arquivos:** `treat.py`. **O que
   entra:** um `models/<camada>/schema.yml` com `data_tests:`, cada teste com `name:
   <modelo>__<id>` e `config: {severity: error | warn}`; o `UNIQUE` de várias colunas e o `MATCH` como
   testes em SQL em `tests/<modelo>__<id>.sql`, com a linha `-- depends_on: {{ ref('<modelo>') }}`. O
   resultado de cada teste se liga ao modelo pelo nome dado, nunca pelo nome com hash.
3. **As ondas.** Critérios: 11, 13. **O que entra:** a profundidade pelo `after`; um `dbt build
   --select <onda>` por onda, com `alias='<t>__nova'`; um modelo cujo `after` não trocou nesta rodada
   vem `SKIPPED` e não roda.
4. **A troca.** Critérios: 10, 14. **Arquivos:** cria `swap.py`. **Referência a seguir:**
   `dbt-adapters table.sql:30-59`. **O que entra:** `RenameTable(<t> → <t>__velha)` se `<t>` existe;
   `RenameTable(<t>__nova → <t>)`; `DeleteTable(<t>__velha)`; na falha da segunda, a volta; antes de
   cada onda, um `<t>__velha` sem `<t>` volta a `<t>` (principle-make-operations-idempotent). Um
   `HELD` apaga `<t>__nova`. **Mutações à mão:** apagar antes de renomear, e o caso "troca pela metade"
   fica vermelho.
5. **O resultado.** Critérios: 15, 16. **Arquivos:** `treat.py`, `boundaries.md`. **O que entra:** as
   linhas de `<t>` depois da troca, como hoje (`treat.py:134-135`); os testes só com id, estado e
   contagem.

### Como se prova

`test_treat.py` entra pela porta da tarefa, a função de `entry.py` que o `conexus-copy` chama, com
`CONEXUS_TREAT_OBJECT` apontando para um objeto do dublê, como na `T1`. O `dbt build` roda de verdade
contra o dublê do Athena e do Glue (`tests/athena_double.py`), que responde com as gravações da U1, e
o dublê do `s3tables` responde às renomeações (T26). Hoje o 10 e o 11 falham: a tarefa não constrói
ao lado.

### Parar se

- Um teste genérico não lê `<t>__nova` (o `alias` não chega ao teste): volta ao firstmate.
- O dublê precisa de mais de vinte chamadas novas do dbt-athena para um `build` com testes.

## G1 O ponto de conferência

Depois da U4, antes do pull request: o `cdk synth` da receita e o diff contra o de `57400a0c2`, com as
concessões e a `RenameTable` e nada mais; `test_treat.py` sobre as gravações da U1 e os testes de hoje
de `apps/extraction`; `npm run check` e os testes de `infra/aws`, `packages/connectors` e
`apps/server/src/hub/treatment`; a linha de remoção de cada proteção tocada.

## U5 Os testes no Hub

**Base e modelo.** o ramo do G2, sobre o G1. Sonnet.

### As linhas da tabela

- **5.** `apps/server/src/hub/treatment/tables.ts:57-90` (`treatmentVersion`);
  `versions.ts:50-58` (`checkedProposal`, o hash), `:60-72` (`insertVersion`).
- **6.** `sql.ts:67` (`readModelSql`) para o controle do `MATCH`.
- **12, 13.** `tables.ts:22` (`MODEL_STATUSES`), `:134-175` (`treatmentModelRun`);
  `treatment-rows.ts:205` (`closedIn`); `select.ts:9` (`LastStatus`); `models.ts:185` (a última rodada
  de cada modelo).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/treatment/` | Muda `tables.ts`, `versions.ts`, `treatment-rows.ts`, `models.ts`, `select.ts`, `treatment-start.ts` (a especificação com os testes) | `routes.ts`; U6 |
| `packages/hub-api/src/treatment.ts`, `treatment-failures.ts` | Muda: os testes na proposta, na versão e na lista; `TREATMENT_TEST_INVALID` | `apps/web/src/hub/treatment/` (U7) |
| uma migração em `apps/server` | Cria | — |

### Os contratos que a unidade cria

| Tabela | Coluna | Tipo | Restrição | Ao apagar |
| --- | --- | --- | --- | --- |
| `treatment.version` | `tests` | `jsonb not null default '[]'` | `jsonb_typeof = 'array'`; entra no hash | a versão, como hoje (`cascade` do modelo) |
| `treatment.model_run` | `status` | o de hoje | ganha `HELD` | — |
| `treatment.model_run` | `tests` | `jsonb` | `null` só em `FAILED` e `SKIPPED`; o `check` de `rows` fica `status = 'BUILT'`, e `HELD` não tem `rows` | a rodada, como hoje (`cascade`) |

O hash passa a ser de `{ sql, inputs, tests }`; uma versão antiga, sem testes, guarda o hash que tem.
`TREATMENT_TEST_INVALID` em `packages/hub-api/src/treatment-failures.ts`, com o índice do teste, e a
frase aprovada pelo fundador. Os testes da proposta passam pelo esquema `TreatTest` da U4 sem o `id`
de marca (C27); o `RELATIONSHIP` passa pela mesma conferência das entradas do SQL. Nenhuma chave
estrangeira nova.

### As skills e a leitura

As linhas de `apps/server/src` do `stack.md`: `fastify` (`fastify-best-practices`), `drizzle-orm`,
`drizzle-kit` (a skill do pacote); `pstack:typescript-best-practices`; o guia de dados.

### A ordem do trabalho

1. **Os testes na versão.** Critérios: 17, 18. **Mutações à mão:** tirar `tests` do hash, e o caso
   "outro teste é outra versão" fica vermelho.
2. **A especificação.** Critério: 20. **O que entra:** `TreatModel.tests` é `moldTests` (U3) para um
   modelo `tratado` e os da versão ligada para um `negocio`.
3. **O fechamento e a seleção.** Critério: 19. **O que entra:** `HELD` e `tests` em `closedIn`;
   `LastStatus` com `HELD`, sem mudar `selection`.
4. **A lista.** Critério: 20.

### Como se prova

Pela porta do Hub (T5): as rotas de proposta e de lista, e o `TREAT_RESULT` pela fila de teste, com o
banco de teste (T26). Hoje o 17 falha: a proposta não aceita testes.

### Parar se

- O hash novo muda o hash de uma versão já gravada: a migração não reescreve versões; leva ao
  firstmate.

## U6 O aviso

**Base e modelo.** o ramo do G2, depois da U5. Sonnet.

### As linhas da tabela

- **15.** `apps/server/src/hub/notifications/tables.ts:116-147` (`requestNotice` e
  `noticeIndexAndPolicies`, `:37-52`); `request-notices.ts:13-25` (`noticeRequests`, `on conflict do
  nothing`), `:32` (a página do sino); `requests/requests.ts:122` (`membersAllowed`);
  `notifications.ts:150-175` (o e-mail que não desfaz a notificação); `mail.ts:16-24`
  (`automationMail`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/notifications/` | Muda `tables.ts`, `notifications.ts` (a página do sino junta os avisos), `mail.ts`, `notification-render.mjs`; cria `treatment-notices.ts`, `treatment-email.tsx` | U7 pela rota do sino |
| `apps/server/src/hub/treatment/treatment-notice.ts` | Cria: a passagem, chamada no fechamento | `treatment-run.ts` |
| `packages/hub-api/src/notifications.ts` | Muda: `NotificationRow` ganha `TREATMENT_HELD` e `TREATMENT_BACK` | U7 |
| `apps/server/database-grants.sql` e uma migração | Cria a tabela e as permissões | — |

### Os contratos que a unidade cria

| Tabela | Coluna | Tipo | Restrição | Ao apagar |
| --- | --- | --- | --- | --- |
| `notifications.treatment_notice` | `id` | `uuid` | chave | — |
| | `company_id`, `person_id` | `text not null` | chave estrangeira para o membro, como `request_notice_member_fkey` | `cascade` |
| | `run_id` | `text not null` | chave estrangeira para `treatment.run(company_id, id)` | `cascade` |
| | `name` | `text not null` | o `ModelName` | — |
| | `kind` | `text not null` | `in ('HELD', 'BACK')` | — |
| | `created_at`, `read_at` | `timestamptz` | como `request_notice` | — |

O índice único `(run_id, name, person_id)`; o índice e as políticas por `noticeIndexAndPolicies`. As
permissões no `database-grants.sql`, aprovadas pelo fundador (data D11). `NotificationRow`:
`{ kind: 'TREATMENT_HELD' | 'TREATMENT_BACK', layer, table, label, at }`, sem nenhum valor do dado. A
passagem é uma função só, `noticesOf(before, after)`, dona da regra "um aviso por passagem" (C26).

### As skills e a leitura

As linhas de `apps/server/src` do `stack.md` (`fastify-best-practices`, `drizzle-orm`, `drizzle-kit`;
`react-email` lido da fonte); `pstack:typescript-best-practices`; o guia de dados.

### A ordem do trabalho

1. **A passagem.** Critério: 21. **O que entra:** no fechamento, na mesma transação, o último estado
   de cada modelo antes da rodada contra o de agora; os que passaram para `HELD` ou de volta para
   `BUILT` gravam um aviso por pessoa de `membersAllowed(..., 'approveTreatment')`. **Mutações à mão:**
   avisar em toda rodada `HELD`, e o caso "duas seguidas" fica vermelho.
2. **O e-mail.** Critério: 22. **O que entra:** depois da transação, pelo `sendMail` de hoje, como
   `notifications.ts:150-175`; o e-mail leva o nome da tabela e o link, nada do dado.
3. **O sino.** Critério: 26 (o lado do servidor). A página do sino junta os avisos de tratamento.

### Como se prova

Pela porta do Hub: o `TREAT_RESULT` pela fila de teste e a rota do sino, com o correio de teste e o
banco de teste (T26). Hoje o 21 falha: o fechamento não avisa ninguém.

### Parar se

- O correio de teste não alcança o e-mail sem mudar `platform/mail.ts`.

## U7 Os testes em Dados

**Base e modelo.** o ramo do G2, depois da U6. Sonnet.

### As linhas da tabela

- **16.** `apps/web/src/hub/treatment/treated-table.tsx:267` (as abas), `treated-layer.tsx`,
  `business-layer.tsx`.
- **17.** `new-treatment.tsx:209` (`PROPOSE_CHANGE`), `approve.tsx`.
- O sino: `apps/web/src/hub/notifications/bell.tsx`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/treatment/` | Cria `treated-tests.tsx`; muda `treated-table.tsx`, `treated-layer.tsx`, `business-layer.tsx`, `new-treatment.tsx`, `approve.tsx`, `text.ts` | as rotas de Dados |
| `apps/web/src/hub/notifications/` | Muda `bell.tsx` | o cabeçalho |

### Os contratos que a unidade cria

Nenhum; lê os da U5 e da U6. Os textos, para o fundador aprovar: "Testes"; "Trava", "Avisa"; "do
molde"; "Passou", "Falhou: <n> linhas", "Avisou: <n> linhas", "Deu erro ao rodar", "Não rodou";
"Travada: segue a versão das <HH:MM>"; "Ainda sem versão: <teste> falhou"; "Trocou, com <n>
aviso(s)"; "Esta tabela não tem testes."; "Nenhum teste"; "Acrescentar teste"; "Conferência"; "A soma
de <coluna> bate com"; "A contagem bate com"; "<tabela> travou"; "<tabela> voltou"; "Esta tabela não
existe mais".

### As skills e a leitura

As linhas de `apps/web/src` do `stack.md`: `@tanstack/react-router` (as skills de
`@tanstack/router-core`), `@tanstack/react-query`, `@shadcn/react` (`shadcn`), `react-hook-form`,
`vitest`, `msw`; `impeccable`; `pstack:typescript-best-practices`; o guia web.

### A ordem do trabalho

1. **A aba Testes.** Critério: 23.
2. **Travada e Com aviso.** Critério: 24.
3. **O formulário e o cartão.** Critério: 25.
4. **O sino.** Critério: 26.

Cada passo com o seu teste pela tela (Testing Library e o `msw` sobre os contratos do `hub-api`), e
uma mutação à mão por passo: trocar o primeiro teste que falhou pelo último, e o 24 fica vermelho.

### Como se prova

Pelos testes de tela; o 27 pela QA a 1280 e 390 px, nos dois temas.

### Parar se

- A aba Testes pede uma peça de `ui/` que não existe (design V62).

## G2 O ponto de conferência

Depois da U7, antes do pull request: a migração no banco de teste e o `check-migrations`; as rotas da
proposta, da lista e do sino; o `TREAT_RESULT` pela fila de teste com `HELD`; as telas a 1280 e 390 px
nos dois temas; `npm run check`, os testes de `apps/server/src/hub/treatment`,
`apps/server/src/hub/notifications`, `apps/web/src/hub/treatment`, `apps/web/src/hub/notifications` e
`packages/hub-api`; o build do servidor (o `notification-render.mjs`); a linha de remoção de cada
proteção tocada.
