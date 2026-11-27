# A qualidade que trava

Trilha Dados, a etapa `T2` do tratamento do lago, na ordem que o fundador decidiu em 2026-11-25 (Q8
do quadro do estudo do tratamento, [aprovação](../approvals/o-primeiro-modelo-vira-tabela-tratada.md))
e em 2026-11-26 ("A": a `T1`, depois A passada inteira agendada). A pergunta: "Quando o número não
bate, a tabela de ouro não troca, e eu recebo o aviso com o motivo?"

O estudo fica fora do repositório (delivery L21): `conexus-lago-t2-estudo`, de 2026-11-27. `EST:N` é a
linha `N` do relatório `data/conexus-lago-t2-estudo/report.md` do firstmate; `U1T1:N`, o registro da
U1 da `T1` (`data/conexus-lago-t1-u1/report.md`); `N:<página>:N`, a cópia da documentação da Nekt de
2026-11-14. As decisões A a F estão em aberto: o cartão está escrito com a opção (a) de cada uma, e
cada seção que uma resposta muda diz onde.

Cada linha do `main` citada foi lida em `57400a0c2`, o merge do pull request 1492 (a v0.24.136, que
publica a `T1`). As versões que a construção usa são as da `T1`: `dbt-core` 1.12.7, `dbt-athena`
1.11.2, `dbt-adapters` 1.24.6, `dbt-common` 1.39.0, `botocore` 1.44.10; nenhum pacote novo.

**O que o cartão mudou sobre o estudo.** A conferência no `main` mudou cinco pontos do cartão proposto
(`EST`, seção 7):

1. A seleção mora em `apps/server/src/hub/treatment/select.ts:16-41`, não em `treatment-rows.ts`, e
   já escolhe todo modelo cujo último estado não é `BUILT` (`:35`). `HELD` entra sem regra nova na
   seleção, mas a leitura do último estado recusa hoje tudo o que não é `BUILT`, `FAILED` ou `SKIPPED`
   (`lastOf`, `treatment-rows.ts:46-56`, o `z.enum` de `:54`): ela e o tipo `LastStatus` (`select.ts:9`)
   ganham `HELD`.
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
4. A `RenameTable` não basta no papel: o teto que a plataforma põe em todo papel de empresa
   (`boundaryPolicy`, `infra/aws/lib/platform.ts:125-174`) só dá ao `s3tables` a lista do escritor
   (`WRITER_TABLE_ACTIONS`, `infra/aws/lib/actions.ts:21-32`). A U2 muda também o teto, como a `T1`
   mudou para o `glue:DeleteTable`, e a pilha da plataforma sobe antes de você apagar e criar o lago.
5. A candidata se chama `0n_<t>` e a anterior, durante a troca, `0v_<t>`: nenhum nome de tabela do
   lago começa por um algarismo (`LAKE_TABLE_NAME_PATTERN`, `packages/hub-api/src/lake-copies.ts:7`),
   então elas não colidem com uma tabela de verdade (a decisão F12). O estudo usava um sufixo
   `__nova`, que uma tabela de mesmo nome tomaria.

As unidades usam números, sem letras.

**Antes da construção.**

1. **Os ajustes de tela da `T1`** (https://github.com/developmentconexus-ops/conexus/issues/1491)
   fecham com a `T1`, antes da U8, que muda as mesmas telas.
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

1. Em Dados, no lago que você recriou depois do G1 (decisão E), você abre Notas e pedidos em Tratado,
   depois da primeira rodada com o G2 publicado. A aba **Testes** mostra "nunota: não vazio · Trava ·
   do molde" e "nunota: único · Trava · do molde", todos "Passou".
2. Em Venda, você clica **Propor mudança** e, em Testes, acrescenta "tipmov: valores aceitos V, P ·
   Trava" e a **Conferência**: "A soma de Valor bate com" um `SELECT` de controle sobre
   Copiado (o firstmate o escreve com você). Salva e liga. O cartão Ligar mostra os testes.
3. Você clica **Tratar agora**. A Venda troca, com a hora, e a aba Testes mostra "Passou" em cada um.
4. O firstmate propõe um controle que não bate, e você o liga. Na rodada seguinte, Venda mostra
   "Travada: segue a versão das <HH:MM>. Conferência: o número não bateu." O sino mostra "Venda
   travou", e chega um e-mail com o link para Venda.
5. Você liga de novo o controle certo e trata. Venda troca, e chega "Venda voltou".
6. Um teste **Avisa** que falha mostra "Trocou, com 1 aviso", sem e-mail.

**O que você faz, e quando.** Antes: responde A a F. Depois da U1: confirma a lista de permissões que
ela mediu. Depois do G1, na primeira publicação que o leve (a nota de versão diz) e com a pilha da
plataforma no teto novo: apaga e cria o lago de novo, uma vez só, e marca as tabelas do Sankhya em
Dados. Antes do G2: aprova, no pull request próprio, as permissões da tabela nova do aviso (data D11).
No fim, com o G2 publicado: faz o roteiro na nuvem, diz o que viu e aprova os textos das telas e do
e-mail.

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
  #1215, do Registro de dados, que esta etapa não toca; a #1226, pelo Lago 3; a #755 (quem vira Dono
  ou Administrador depois de um aviso aberto não o recebe), porque o aviso desta etapa é por passagem:
  quem chega depois recebe a próxima.

**As decisões suas nesta etapa.** Nenhuma tem a sua palavra ainda. O cartão está escrito com a
opção (a) de cada uma, a recomendada. A F vem do método (delivery L28), e não do estudo.

- **A. O gasto da prova U1.** Exemplo: uma tabela inventada de 100 mil linhas, trocada dez vezes na
  conta de laboratório. *Pendente da sua palavra; o cartão segue (a).* (a) O firstmate roda a
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
- **D. Quem recebe o aviso.** Exemplo: a Venda trava às 14h, e o Dono e os Administradores veem o
  sino e recebem o e-mail. *Pendente; o cartão segue (a).* (a) O sino e o e-mail de Dono e
  Administradores (quem aprova tratamento), um aviso quando uma tabela trava e um quando ela volta,
  como o alerta global da Nekt para donos e administradores (`N:workspaces__alerts:13`, `:22-26`).
  (b) Só quem ligou a versão. (c) Uma lista de e-mails por tratamento, como a Nekt por recurso: pede
  uma tela a mais. A lista de e-mails da empresa (`notifications.alert_recipient`) não entra: a sua
  decisão de 2026-11-23, "Por ligação, na janela" (`docs/steps/trilhas/dados.md`), a trocou pelos
  e-mails da ligação, e ela espera o cartão da cópia parada. Veredito: nativo; o molde do aviso dos
  pedidos (`requestNotice`) e o e-mail da automação.
- **E. O lago da receita anterior.** A troca pede permissões novas na receita do lago. Exemplo: o
  lago que você usa hoje para de tratar até você apagar e criar de novo na Central. *Pendente; o cartão
  segue (a).* (a) Apagar e criar o lago de novo, uma vez, como na `T1`; os tratamentos e as
  versões ficam no Hub e rodam na primeira cópia. A atualização no lugar ganha etapa própria antes da
  conta oficial da AWS, onde apagar não serve mais. (b) Construir a atualização no lugar
  (https://github.com/developmentconexus-ops/conexus/issues/1424) nesta etapa: cerca de 700 linhas a
  mais, uma lista das receitas que trocam, e a etapa se divide em duas. Veredito: nativo (o caminho de
  hoje).
- **F. As ondas.** *Pendente; o cartão segue (a).* O SQL da Venda lê Notas pelo nome. Para a Venda
  ler a Notas já trocada na mesma rodada, a tarefa roda o dbt uma vez por camada de dependência (a
  "onda"), e não uma vez só. Nenhuma referência faz assim, porque o dbt troca a tabela dentro da
  própria construção e não tem a troca depois dos testes; é o preço de travar a troca. (a) As ondas,
  com a prova da U1 e a revisão quando o dbt-athena trocar no `S3 Tables`. (b) Sem ondas: um filho lê
  a versão anterior do pai, e a Venda fica uma rodada atrás das Notas. Veredito: remendo (a linha 9
  da tabela de referência).

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| — | U1 A prova da troca no lago | a lista mínima do papel para trocar, as duas renomeações, os testes na tabela nova, o teste em SQL, a gravação das falhas, a etiqueta depois da troca, e as gravações para a U4 | `apps/extraction/tests/recordings/` | testing | a decisão A |
| G1 | U2 A receita que troca | as concessões curinga e a `RenameTable` no papel do tratamento e no teto da plataforma | `infra/aws/` | security | U1 |
| G1 | U3 Os testes do molde | `moldTests` (a chave e o que o molde declara) e os do Sankhya | `packages/connectors/src/kernel/`, `packages/connectors/src/sankhya/` | data | — |
| G1 | U4 A tarefa que testa e troca | os testes no projeto dbt, as ondas, a troca, `HELD` (no resultado e no Hub) e os testes no resultado | `apps/extraction/`, `apps/server/src/hub/treatment/`, `packages/hub-api/src/treatment.ts`, uma migração, `docs/reference/boundaries.md` | testing | U1, U3 |
| G2 | U5 Os testes no Hub | os testes na versão e na conferência do SQL; a especificação; `model_run.tests`; a lista | `apps/server/src/hub/treatment/`, `packages/hub-api/src/treatment*.ts`, uma migração | data | G1 |
| — | U6 As permissões do aviso | a tabela `notifications.treatment_notice`, a migração, as políticas por linha e as permissões | `apps/server/src/hub/notifications/tables.ts`, `apps/server/src/hub/treatment/public-tables.ts`, `apps/server/database-grants.sql`, uma migração | data | G1 |
| G2 | U7 O aviso | o sino e o e-mail, por passagem | `apps/server/src/hub/notifications/`, `apps/server/src/hub/treatment/`, `apps/server/src/main.ts`, `packages/hub-api/src/notifications.ts` | data | U5, U6 |
| G2 | U8 Os testes em Dados | a aba Testes, Travada e Com aviso, os testes no formulário e no cartão Ligar, o aviso no sino | `apps/web/src/hub/treatment/`, `apps/web/src/hub/notifications/` | web | U5, U7 |

Três pull requests, um commit por unidade, nesta ordem: o G1; a U6 sozinha, no pull request próprio
que a data D11 pede; e o G2, com a U5, a U7 e a U8. A U1 não tem código de produto: o registro fica no
`conexus-estudos` e as gravações entram com a U4.

**Orçamento de código alterado** (estimado por analogia com as unidades da `T1`, sem testes nem
gerados). U1: 0. U2: 160. U3: 220. U4: 700. U5: 850. U6: 150. U7: 500. U8: 1.050. Total:
3.630, dentro da delivery L2. Com a decisão E (b), entra uma unidade de cerca de 700 linhas e a etapa se divide em duas.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Na conta de laboratório, `RenameTable(<t> → 0v_<t>)`, `RenameTable(0n_<t> → <t>)` e o apagar de `0v_<t>` pelo papel do tratamento, com a lista mínima medida; o papel tem o teto da plataforma com a mudança da U2; o registro mede a janela do leitor (dez vezes), diz se a concessão curinga basta para o tratamento ler, apagar e trocar de novo a tabela trocada, e mostra que um `SELECT` pelo nome literal, logo depois da troca, lê a tabela nova (a prova da linha 9) | o registro da U1 | must |
| 2 | U1 | Um `dbt build` com `alias='0n_<t>'` roda os testes genéricos e os em SQL contra `0n_<t>`, e o Athena aceita o nome que começa por algarismo; um `UNIQUE` de duas colunas falha com `failures` igual ao número de chaves repetidas plantadas, um `MATCH` que não bate falha com `failures` 1, e um `relationships` com `to` literal (`"tratado"."<tabela>"`) roda sem aresta para o pai | o registro da U1; `apps/extraction/tests/recordings/treat-tests-*.jsonl` | must |
| 3 | U1 | `store_failures_as: table`, com `schema` numa área que existe e `catalog_name: lago`, grava a tabela das falhas, ou o registro diz o erro (para a T3a) | o registro da U1 | should |
| 4 | U1 | O registro diz se uma etiqueta do Lake Formation numa tabela segue a `RenameTable` (para o Lago 3) | o registro da U1 | should |
| 5 | U2 | O papel do tratamento tem, em `tratado` e `negocio`, as concessões curinga que a U1 mediu e o fundador confirmou, e `s3tables:RenameTable` só nas tabelas dessas áreas; o teto da plataforma dá a `RenameTable` só nessas áreas; nada novo em `raw` e `current`; o papel da cópia segue sem `RenameTable` | `infra/aws/test/treater.test.ts`, "a troca"; `infra/aws/test/platform.test.ts`; `infra/aws/test/lake.test.ts` | must |
| 6 | U2 | Um lago da receita da `T1` é de receita anterior: Tratar agora e Propor recusam com `LAKE_NOT_READY`, Tratado mostra a receita anterior, e a Central mostra a frase de hoje; um lago da receita nova trata e troca | `apps/server/src/hub/treatment/treatment-routes.test.ts`, "receita anterior"; `apps/web/src/hub/operations/lake.test.tsx` (sem mudança) | must |
| 7 | U3 | `moldTests` dá, para cada coluna da chave da tabela, um `NOT_NULL` e, para a chave inteira, um `UNIQUE`, os dois `BLOCK`, pelo `as` da coluna do molde de mesma `column`; o casamento da chave com a `column` não olha a caixa (a chave é `NUNOTA`, a coluna é `nunota`); uma chave sem coluna no molde é recusada pela conformidade | `packages/connectors/src/kernel/tables-treated.test.ts`; `conformance-tables.test.ts` | must |
| 8 | U3 | A conformidade recusa um teste do molde com coluna fora do molde, um `RELATIONSHIP` para uma tabela sem molde e um `id` repetido | `packages/connectors/src/kernel/conformance-tables.test.ts` | must |
| 9 | U3 | O Sankhya declara as relações de itens com notas e de notas com parceiros e um `ACCEPTED_VALUES` em `tipmov`, os três `WARN`: as cópias são incrementais e uma tabela pode chegar antes da outra, e travar por isso seria um aviso à toa (a decisão F13) | `packages/connectors/src/sankhya/copy-tables.test.ts` | must |
| 10 | U4 | Com testes que passam, a tarefa constrói `0n_<t>`, troca, conta e manda `BUILT` com cada teste `PASS`; `0n_<t>` e `0v_<t>` não ficam no lago | `apps/extraction/tests/test_treat.py`, "troca" | must |
| 11 | U4 | Um teste `BLOCK` que falha deixa `<t>` como estava, apaga `0n_<t>` e manda `HELD` com o teste `FAIL` e `failures`; um modelo cujo `after` está em `select` e não trocou vem `SKIPPED` e não roda; um pai fora de `select` não pula o filho | `test_treat.py`, "trava" | must |
| 12 | U4 | Um teste `WARN` que falha troca e manda `BUILT` com o teste `FAIL`; um teste que dá erro no Athena (uma coluna que não existe) vem `ERROR` e decide como `FAIL` no nível dele | `test_treat.py`, "avisa" | must |
| 13 | U4 | Um filho numa onda seguinte lê a tabela já trocada pelo pai na mesma rodada | `test_treat.py`, "ondas" | must |
| 14 | U4 | A segunda renomeação que falha volta `0v_<t>` a `<t>` e manda `FAILED` com `TREAT_SWAP_FAILED`; antes da onda, um `0v_<t>` sem `<t>`, deixado por uma tarefa caída, volta a `<t>`, e um `0v_<t>` ao lado de `<t>` é apagado; os resultados de modelo e de teste se separam pelo `resource_type` e pelo nó a que o teste se liga, nunca só pelo nome | `test_treat.py`, "troca pela metade"; "nomes parecidos" | must |
| 15 | U4 | O resultado leva só ids, estados e contagens: nenhum valor de célula, nem o texto do Athena (F7 da `T1`, security S41); um controle com `{{`, `{%` ou `{#` termina em `TREAT_SPEC_INVALID` | `test_treat.py`, "só contagens"; `apps/server/src/hub/treatment/treat-task.test.ts` | must |
| 16 | U4 | A rodada de cópia e um modelo sem testes seguem iguais (o modelo sem testes troca) | `apps/extraction/tests/test_entry.py`, os casos de hoje; `test_treat.py`, "sem testes" | must |
| 17 | U5 | Propor uma versão com testes guarda os testes na versão e no hash; o mesmo SQL com outro teste é outra versão, e a versão ligada não muda até o sim | `treatment-routes.test.ts`, "testes na versão" | must |
| 18 | U5 | A proposta é recusada, sem gravar: teste com coluna fora do formato ou id repetido (`TREATMENT_TEST_INVALID`, com o índice), `RELATIONSHIP` para uma tabela que a empresa não tem (`TREATMENT_INPUT_UNKNOWN`), controle de `MATCH` que não é um `SELECT` ou que lê fora de `current`, `tratado` e `negocio` (os códigos do SQL de hoje, no campo do controle), e mais de 30 testes | `treatment-routes.test.ts`, um caso por código | must |
| 19 | U4 | O `TREAT_RESULT` com `HELD` grava o modelo como `HELD`, sem linhas; um resultado repetido não grava de novo; depois de um `HELD`, a cópia seguinte que toca uma entrada abre a rodada com o modelo travado, e o Tratar agora também | `treatment-run.test.ts`, "duas rodadas depois de um HELD" | must |
| 20 | U5 | A lista e o modelo trazem os testes do molde e os da versão ligada, cada um com o último resultado; quando a última rodada é `HELD`, a linha diz travada, com a hora da última boa | `treatment-list.test.ts` | must |
| 29 | U5 | A especificação mandada à tarefa leva, num modelo `tratado`, os testes do molde, com o `RELATIONSHIP` no nome que a tabela de destino tem no lago e sem o teste cujo destino a empresa não copia; num `negocio`, os da versão ligada; a lista mostra os mesmos testes | `treatment-start.test.ts`, "os testes na especificação"; `treatment-list.test.ts` | must |
| 30 | U5 | O `TREAT_RESULT` grava os testes em `model_run.tests` nos modelos `BUILT` e `HELD`; a migração roda sobre as linhas `BUILT` já gravadas, que ficam sem testes | `treatment-run.test.ts`, "os testes gravados"; `treatment/tables.test.ts` | must |
| 31 | U6 | O `database-grants.sql` aprovado é o do banco migrado; a política de linha de `treatment_notice` recusa ler o aviso de outra pessoa e o de outra empresa | `apps/server/src/platform/catalog.test.ts`; `apps/server/src/hub/notifications/tables.test.ts` | must |
| 21 | U7 | O fechamento que passa um modelo de `BUILT`, ou de nunca gravado, para `HELD` grava um aviso "travou" para cada pessoa que aprova tratamento e manda um e-mail a cada uma; a volta de `HELD` para `BUILT` grava "voltou" e manda o e-mail também; o estado de antes é o último que não é `SKIPPED`, então `HELD`, `SKIPPED`, `HELD` não avisa de novo e `HELD`, `SKIPPED`, `BUILT` avisa "voltou"; duas rodadas `HELD` seguidas não avisam; um resultado repetido não avisa | `apps/server/src/hub/treatment/treatment-notice.test.ts` | must |
| 22 | U7 | O e-mail que falha (`MAIL_UNAVAILABLE`) não desfaz o aviso nem o fechamento; a página do sino, a contagem de não lidos e o marcar como lido juntam os avisos de tratamento aos de hoje, na ordem e com a continuação de hoje (code C44), e marcar um como lido grava `read_at` só nele | `treatment-notice.test.ts`; `notifications.test.ts`, "avisos de tratamento" | must |
| 23 | U8 | A aba Testes lista cada teste com o rótulo, o nível e o último resultado ("Passou", "Falhou: 12 linhas", "Avisou: 3 linhas", "Deu erro ao rodar", "Não rodou"); a conferência diz "Falhou: o número não bateu", sem contagem; os do molde dizem "do molde" e não se editam | `apps/web/src/hub/treatment/treated-tests.test.tsx` | must |
| 24 | U8 | Uma tabela travada mostra "Travada: segue a versão das <HH:MM>" e o primeiro teste que falhou; uma que nunca trocou e travou mostra "Ainda sem versão: <teste> falhou"; "Trocou, com <n> aviso(s)" para os `WARN`; um `TREAT_SWAP_FAILED` mostra "A troca da tabela falhou; a versão anterior segue no ar.", e não o código | `treated-table.test.tsx`; `treated-layer.test.tsx` | must |
| 25 | U8 | Novo tratamento e Propor mudança acrescentam, mudam e tiram testes e a conferência; cada recusa do critério 18 aparece no teste dela; o cartão Ligar lista os testes | `new-treatment.test.tsx`; `approve.test.tsx` | must |
| 26 | U8 | O sino mostra "<tabela> travou" e "<tabela> voltou", com o link para a tabela; o de uma tabela que saiu diz "Esta tabela não existe mais" | `apps/web/src/hub/notifications/bell.test.tsx` | must |
| 27 | U8 | A 390 px, a aba Testes, o formulário com testes e o cartão cabem sem rolagem lateral, nos dois temas | a QA (testing T25) | should |
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
| `TreatTaskResult.models[].tests`, `HELD` | U4 | U4 (grava o `HELD`), U5 (grava os testes), U7 (a passagem) |
| `treatment.version.tests` | U5, ao salvar | U5 (o hash, a especificação), U8 (o formulário, o cartão, a aba) |
| `treatment.model_run.tests` | U5 | U5 (a lista), U8 (a aba Testes, Travada) |
| `notifications.treatment_notice` | U6 (cria); U7 (o fechamento grava; o marcar como lido grava `read_at`) | U7 (a página do sino e a contagem de não lidos), U8 (o sino) |
| `ProposeTreatment.tests`, `VersionView.tests` (`hub-api`) | U8 (o formulário), U5 (a versão) | U5 (guarda), U8 (o cartão Ligar, a aba) |
| `ModelRunView` com `HELD` e `tests`, `lastBuiltAt` (`hub-api`) | U5 | U8 (a aba Testes, Travada, a hora da última boa) |
| `TestView`: o teste, a origem e o último resultado (`hub-api`) | U5 | U8 (a aba Testes) |
| `NotificationRow` `TREATMENT_HELD`, `TREATMENT_BACK` | U7 | U8 |

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
| `RenameTable` e o apagar da anterior, na troca (U4) | uma rodada aberta por empresa (o índice da `T1`): duas trocas da mesma tabela não acontecem juntas | a segunda renomeação que falha desfaz a primeira; a tarefa caída entre as duas deixa `0v_<t>`, que a próxima rodada volta; caída depois da segunda, deixa `0v_<t>` ao lado de `<t>`, que a próxima apaga | a AWS fora: `FAILED` com `TREAT_SWAP_FAILED`; a tabela anterior fica | `TREAT_SWAPPED` com o modelo; `TREAT_SWAP_FAILED` com o tipo do erro | 10, 14 |
| O `dbt build` de uma onda (U4, da biblioteca) | idem | uma onda que cai: as seguintes não rodam, e os modelos que não trocaram vêm `SKIPPED` | o Athena fora: o teste dá `error` e decide como `FAIL` | o log do dbt ao log da tarefa, como hoje | 11, 12 |
| O apagar de `0n_<t>` depois de um `HELD` (U4) | idem | a tarefa caída deixa `0n_<t>`, que o `drop_relation` do dbt apaga na próxima | a AWS fora: a próxima rodada apaga | `TREAT_HELD` com o modelo e os ids dos testes | 11 |
| `UPDATE` do fechamento com `HELD` e `model_run.tests` (U4, U5) | a condição `ended_at is null` da `T1` | uma transação (data D22) | `DATABASE_UNAVAILABLE`: a mensagem volta à fila | `TREATMENT_RUN_CLOSED` com a contagem de `HELD` | 19, 30 |
| `INSERT` de `treatment_notice` (U7) | o índice único `(run_id, name, person_id)` e `on conflict do nothing` | na mesma transação do fechamento | o banco fora: como o fechamento | `TREATMENT_NOTICE` com o modelo e a passagem | 21 |
| O e-mail do aviso (U7) | um por aviso gravado | depois da transação | `MAIL_UNAVAILABLE`: o aviso fica no sino | `MAIL_FAILED`, como hoje | 22 |
| `UPDATE read_at` de `treatment_notice` (U7) | o mesmo valor duas vezes: o segundo não muda nada | uma instrução | `DATABASE_UNAVAILABLE`, como o marcar de hoje | o de hoje | 22 |
| As migrações do `HELD`, das colunas novas e da tabela do aviso (U4, U5, U6) | o `drizzle-kit` em ordem, como hoje | uma transação por migração | o banco fora: a migração não roda e o Hub não sobe | o de hoje | 17, 19, 30, 31 |
| `INSERT` da versão com testes (U5) | os índices da `T1` | uma transação | `DATABASE_UNAVAILABLE` | `TREATMENT_PROPOSED` | 17, 18 |

## A tabela de referência

A do estudo (`EST`, seção 5), com a unidade e o arquivo novo de cada linha. Veredito pelo código C75.

| # | Peça | O que o fundador já decidiu | Hoje no `main` (`57400a0c2`) | Referência (situação) | Veredito | Prova, se não for nativo | Unidade e arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Os testes de dado como declaração | Q2 (a) da `T1` (a Fábrica escreve a limpeza); `T2` na trilha | nenhum | dbt genéricos e `data_tests:` (`dbt-core@1.12.7 include/global_project/macros/generic_test_sql/*.sql`, `parser/generic_test_builders.py:253`); ODCS `quality` (`docs/data-quality.md:73-80`) | nativo | — | U4: `treat.py` gera o `schema.yml`; contrato em `treat-task.ts` |
| 2 | Os dois níveis, Trava e Avisa | nada registrado | nenhum | `severity: warn` não propaga (`dbt-core task/test.py:293-327`); Soda `level: warn` (`contract_yaml.py:740-762`); Databricks `warn` e `fail` | nativo | — | U4 e U5 |
| 3 | Os testes do molde, da chave | Q2 (a) | `TableDeclaration.key` (`packages/connectors/src/kernel/tables.ts:94`) sem teste | staging do dbt com `unique` e `not_null` na chave (`dbt-docs@fc5b50c best-practices/how-we-structure/2-staging.md`); Glue `IsPrimaryKey` | nativo | — | U3: `moldTests` em `kernel/tables-treated.ts` |
| 4 | O `UNIQUE` de várias colunas | — | nenhum | `dbt_utils.unique_combination_of_columns` (não instalado); teste em SQL puro (compilado no rascunho do estudo) | embrulhado | compilou no `dbt-core` 1.12.7; a U1 o roda no Athena | U4 |
| 5 | Os testes do Negócio na versão | Q7 (a) da `T1` (a versão no Hub, com o sim) | `treatment.version` sem testes (`hub/treatment/tables.ts:57-90`); o hash de `{sql, inputs}` (`versions.ts:56`) | a regra anda com o código: dbt yml, GX suíte, Databricks decorador | nativo | — | U5: coluna `tests` na versão, no hash |
| 6 | A conferência (`MATCH`) contra Copiado | a decisão B | nenhuma | Glue `AggregateMatch`; GX `expect_table_row_count_to_equal_other_table` (`expectations/core/expect_table_row_count_to_equal_other_table.py:68-199`); teste em SQL do dbt | embrulhado | compilou; a U1 o roda | U4 (gera), U5 (confere o controle ao salvar, por `readModelSql`, `sql.ts:67`) |
| 7 | A régua contra o sistema ao vivo | a decisão B | `target.py:226-233` conta só o lido e o gravado | régua da chegada (`EST/medalhao:340`); reconciliação do Soda fora do núcleo (`common/yaml.py:625-631`) | nativo (fica de fora) | — | fica de fora (decisão B) |
| 8 | A troca segura | decisão 5 da `T1`: "a troca pelo RenameTable nasce na `T2` com os testes" | `dbt-athena@1.11.2 table.sql:102-112` apaga e cria (o comentário "does not support ALTER TABLE RENAME"); a entrada `dbt-athena 1.11.2` de `docs/reference/boundaries.md` | `dbt-adapters@1.24.6 macros/materializations/models/table.sql:30-59` (renomear para o lado, trocar, apagar); Databricks rollback atômico; `RenameTable` (`U1T1:190-204`) | embrulhado (o dbt constrói e testa, a tarefa troca pela API) | `U1T1`: 272 ms, 409 num nome que existe, a mesma ARN; a U1 mede as duas renomeações | U4: `apps/extraction/src/conexus_extraction/swap.py`; a entrada de `boundaries.md` muda |
| 9 | As ondas | — | `treat.py:124-131`, um `build` só | o dbt troca dentro da materialização do modelo (`dbt-athena@1.11.2 table.sql:102-112`), e o teste é um nó depois dele (`dbt-core compilation.py:237-247`); nenhuma referência constrói em ondas; é o custo de não haver WAP no dbt | remendo | com `dbt-core` 1.12.7 e `dbt-athena` 1.11.2, o critério 1 da U1: um `SELECT` pelo nome literal lê a tabela trocada; a entrada em `boundaries.md` (rever quando o dbt-athena trocar no `S3 Tables`); a decisão F do fundador (delivery L28) e a F5 | U4 |
| 10 | As concessões curinga e a `RenameTable` no papel | decisão 4.2 (a) da `T1` (o papel próprio) | `infra/aws/lib/treater.ts:114-145` sem curinga nas áreas que escreve; `treaterStatements` (`:37-97`) sem `s3tables:*`; o teto `boundaryPolicy` (`platform.ts:125-174`) com só `WRITER_TABLE_ACTIONS` (`actions.ts:21-32`) | a doc do Lake Formation: "Don't specify a table"; `U1T1:196-204` | nativo | a U1 mede a lista mínima | U2: `infra/aws/lib/treater.ts`, `platform.ts`, `actions.ts` |
| 11 | A receita anterior | decisão 2 (b) da `T1`; a decisão E | `OUTDATED` por `treatable` (`models.ts:178`, `config-aws.ts:91-98`); a frase (`lake.tsx:19-20`) | apagar e criar, como na `T1`; ou `UpdateStack` (issue 1424) | nativo (o de hoje) | — | U2: nenhum arquivo; a receita da `T1` não entra em `TREATABLE_BEFORE` (F10) |
| 12 | O estado `HELD` e a seleção | a regra da `T1`: os que não gravaram por último entram na próxima | `MODEL_STATUSES` (`tables.ts:22`); `selection` (`select.ts:16-41`); `lastOf` (`treatment-rows.ts:46-56`) | Databricks "Manual intervention" no `fail`; Nekt falha a rodada | nativo | — | U4: `HELD` em `model_run`, por migração; `lastOf` e `LastStatus` ganham `HELD` |
| 13 | O resultado dos testes | F7 da `T1` (só o tipo, nunca o texto) | `TreatTaskResult` (`treat-task.ts:58-77`) | `RunResult.status`, `failures` (`dbt artifacts/schemas/results.py:58-86`); `attached_node` (`artifacts/resources/v1/generic_test.py:30`) | nativo | — | U4 (manda), U5 (grava `model_run.tests`) |
| 14 | As linhas que falharam | a decisão C | nenhuma | `store_failures` (`dbt-core materializations/tests/test.sql:11-47`); Databricks duas visões; GX `get_unexpected_rows` | nativo (a contagem); as linhas guardadas ficam de fora | — | U4 conta; as linhas: T3a (decisão C) |
| 15 | O aviso | "a unidade é a parada" (cópia parada, 2026-11-21); a decisão D | `requestNotice` (`notifications/tables.ts:121-147`), `noticeRequests` (`request-notices.ts:13-25`), `membersAllowed` (`requests/requests.ts:122`), o e-mail da automação (`notifications/notifications.ts:150-175`, `mail.ts:16-24`) | Nekt e-mail a donos e administradores (`N:workspaces__alerts:13`, `:22-26`); Databricks notificação de job; GX ações | nativo (o molde do Hub) | — | U6: `notifications.treatment_notice`; U7: `apps/server/src/hub/treatment/treatment-notice.ts` |
| 16 | A aba Testes e o estado Travada em Dados | Q1 (a) da `T1` (as camadas em Dados) | `treated-table.tsx:267` (abas), `treated-layer.tsx` | a aba Expectations da Nekt (`N:catalog__expectations:9-19`); a aba Data quality do Databricks | nativo | — | U8: `apps/web/src/hub/treatment/treated-tests.tsx` |
| 17 | Os testes no formulário e no cartão Ligar | Q7 (a) | `new-treatment.tsx:209` (`PROPOSE_CHANGE`), `approve.tsx` | Nekt "Add Expectations"; o cartão mostra o que roda (linha 19 da `T1`) | nativo | — | U8 |
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
- Uma tarefa que cai entre as duas renomeações deixa `<t>` fora do ar até a próxima rodada, que a
  volta antes de tudo (critério 14); até lá, quem lê `<t>` não a acha. A janela é a de uma tarefa
  caída, não a de toda troca.
- A concessão curinga é só do papel do tratamento; o leitor do lago nas áreas tratadas é do Lago 3.

## As decisões do firstmate

| # | Decisão reversível (delivery L6) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| F1 | Dois níveis, `BLOCK` e `WARN` | todas as referências convergem em dois (`EST`, 3.4); tirar a linha é a decisão C | um terceiro nível no enum |
| F2 | Os testes são os quatro genéricos do dbt, o `UNIQUE` de várias colunas e o `MATCH`, como união | os genéricos são do core (`generic_test_sql/*.sql`); o resto, em SQL puro; nenhum pacote novo | acrescentar uma variante |
| F3 | A chave do kit dá os testes do molde sozinha | a chave já é declarada (`kernel/tables.ts:94`) e é a regra do staging do dbt; um dono só (C26) | a Fábrica declarar à mão |
| F4 | Os testes do Negócio moram na versão, no hash | Q7 (a) da `T1`; a regra anda com o código no dbt, no GX e no Databricks | uma tabela própria de testes, fora da versão |
| F5 | A tarefa troca pela API em ondas, no molde do `dbt-adapters` (para o lado, trocar, apagar) | o dbt troca dentro do nó (`dbt-athena table.sql:102-112`), e o SQL da pessoa lê nomes literais; renomear para o lado antes de apagar deixa sempre uma versão para voltar (`dbt-adapters table.sql:30-59`) | o apagar e renomear da U1 da `T1`, mais curto e sem volta |
| F6 | Um teste que dá erro vem `ERROR` e decide como `FAIL` no nível dele | um teste que não roda não prova nada; o `error` do dbt também propaga (`dbt-core task/build.py:38-43`) | tratar `ERROR` como aviso |
| F7 | `HELD` entra na seleção como os outros não gravados | `selection` já escolhe todo modelo cujo último estado não é `BUILT` (`select.ts:35`) | esperar a próxima cópia da entrada |
| F8 | O aviso é por passagem, não por rodada | a unidade é a parada (o fundador, cópia parada); a Nekt avisa por rodada que falha, e por isso a diferença é nossa e declarada | um aviso por rodada `HELD` |
| F9 | Uma coluna de teste do Negócio só é conferida na rodada | o Hub não sabe as colunas de saída do SQL da pessoa antes de rodar (nenhum `DESCRIBE` no Hub); um teste com coluna que não existe dá `ERROR` e trava | ler as colunas na T3a, que roda o SQL com teto |
| F10 | Com a decisão E (a), a receita da `T1` não entra em `TREATABLE_BEFORE`, e o lago dela fica `OUTDATED` pelo caminho de hoje | a lista diz quais receitas têm o que o tratamento precisa (`config-aws.ts:90-94`); a da `T1` não tem as concessões da troca; o estado `OUTDATED`, a recusa e a frase já existem (`models.ts:178`, `lake.tsx:19-20`); uma segunda lista ou um caminho sem troca seria lógica paralela | com a decisão E (b), a lista das receitas que trocam e a atualização no lugar |
| F11 | Quem recebe o aviso são as pessoas que podem `approveTreatment`, por `identity.membersAllowed` | é como os pedidos acham quem decide (`requests/requests.ts:122`); com a decisão D (a), são Dono e Administradores | outra ação, pela decisão D |
| F12 | A candidata é `0n_<t>` e a anterior, na troca, `0v_<t>` | `LAKE_TABLE_NAME_PATTERN` começa por letra (`lake-copies.ts:7`), então nenhuma tabela do lago toma esses nomes; um sufixo `__nova` colidiria com uma tabela chamada assim; o padrão do nome de tabela do `S3 Tables` é `[0-9a-z_]*` (`botocore` 1.44.10, `TableName`), e a U1 prova que o serviço, o dbt-athena e o Athena aceitam o algarismo no começo | se a U1 recusar, os nomes de tabela recusam o sufixo reservado (o "Parar se" da U1) |
| F13 | As relações do Sankhya são `WARN`, e só os testes da chave são `BLOCK` | as cópias são incrementais e independentes: um item pode chegar antes da nota dele, e travar a Venda por isso seria um aviso à toa | subir a relação a `BLOCK` no molde |
| F14 | A troca apaga a anterior pelo Athena (`DROP TABLE`), como o `drop_relation` do dbt, e renomeia pela API do `S3 Tables` | o apagar pelo Glue já está no papel e no teto (`TREAT_CHANGE_ACTIONS`, `actions.ts:48`); só a `RenameTable` não tem caminho no SQL do Athena | `s3tables:DeleteTable` no papel e no teto |
| F15 | O dono de `TreatTest` é `packages/hub-api/src/treatment.ts`; `treat-task.ts` o importa, e o kit declara o seu `TreatedTest`, menor | a proposta (a web), a especificação (o Hub) e a tarefa leem a mesma forma (C26); o kit não importa o `hub-api`, e o teste do molde aponta para uma tabela do conector, não para uma área | uma forma só no kit, se o kit passar a depender do `hub-api` |
| F16 | O teste de relação do molde só vai quando a mesma ligação copia a tabela de destino | o kit aponta para a tabela do conector (`TableName`), e o Hub só acha o nome no lago de uma tabela marcada (`copy-source.ts:152-171`); sem a cópia, o teste daria erro em toda rodada | mandar o teste e mostrar "Não rodou" |

## U1 A prova da troca no lago

**Base e modelo.** `57400a0c2`. O firstmate, com Sonnet, na conta de laboratório, com teto de US$ 1 e
só dado inventado (decisão A); nenhuma linha de produto.

### As linhas da tabela

As linhas 4, 6, 8, 9, 10, 14 e 18. A receita da U2 em rascunho segue `infra/aws/lib/treater.ts:114-145`
e o teto `boundaryPolicy` (`infra/aws/lib/platform.ts:125-174`); a troca, `dbt-adapters@1.24.6
table.sql:30-59`; a `RenameTable`, o modelo de serviço do `s3tables` em `botocore` 1.44.10
(`tableBucketARN`, `namespace`, `name`, `newNamespaceName`, `newName`, `versionToken`; `PUT
.../rename`); o apagar, o `DROP TABLE` do Athena que o `drop_relation` do dbt manda.

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

1. **Uma pilha de laboratório com a receita da U2 em rascunho e o teto da plataforma mudado**: as
   concessões curinga e `s3tables:RenameTable` no papel e no teto, que o papel do laboratório usa como
   em produção. Critério: 1.
2. **A troca**, dez vezes, numa tabela inventada de 450 colunas e 100 mil linhas: as duas renomeações e
   o apagar pelo Athena; a janela do leitor; a lista mínima, tirando uma permissão por vez; e, logo
   depois de cada troca, um `SELECT` pelo nome literal `"tratado"."<t>"` que lê a tabela nova (a prova
   das ondas). Critério: 1.
3. **Os testes na tabela nova**: um projeto dbt à mão com `alias='0n_<t>'`, os quatro genéricos (o
   `relationships` com `to` literal), um `UNIQUE` de duas colunas e um `MATCH` com `{{ config(severity=
   ...) }}` no arquivo, cada um com linhas plantadas, e uma onda 2 com `--indirect-selection cautious`.
   Critério: 2.
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
- O dbt-athena ou o Athena recusam o nome que começa por algarismo: a F12 cai para o sufixo reservado,
  e a U5 ganha a recusa desse sufixo nos nomes; leva ao firstmate.

## U2 A receita que troca

**Base e modelo.** `57400a0c2`, depois da U1. Sonnet.

### As linhas da tabela

- **10.** `infra/aws/lib/treater.ts:114-145` (`treaterGrants`): as áreas que o tratamento escreve
  ganham o `tableWildcard` com a lista da U1 (o estudo espera `SELECT`, `DESCRIBE`, `INSERT`,
  `DELETE`, `ALTER`, `DROP`); `treaterStatements` (`:37-97`) ganha `s3tables:RenameTable` e
  `s3tables:GetTable` só nas tabelas de `tratado` e `negocio`, pela condição `s3tables:namespace`, como
  o papel da cópia faz nas dele; o recurso sai do nome do depósito, que `treaterStatements` já recebe
  (o `catalog` de `:41`).
- **10, o teto.** `infra/aws/lib/platform.ts:125-174` (`boundaryPolicy`): uma declaração nova com a
  lista de tabela do tratamento (`TREAT_TABLE_ACTIONS` em `infra/aws/lib/actions.ts`, ao lado de
  `WRITER_TABLE_ACTIONS`, `:21-32`) nas tabelas de `tratado` e `negocio`, pela condição
  `s3tables:namespace`, como o papel da cópia faz nas dele (`writer.ts:86-91`). É uma declaração nova
  no teto, como a `ChangeTheTreatedTables` (`:145-150`) que a `T1` pôs para o `glue:DeleteTable`.
- **11.** Nenhum arquivo: `TREATABLE_BEFORE` fica vazia (F10).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `infra/aws/lib/treater.ts` | Muda `treaterGrants` e `treaterStatements` | `infra/aws/lib/lake.ts:104` |
| `infra/aws/lib/platform.ts`, `infra/aws/lib/actions.ts` | Muda o teto; cria `TREAT_TABLE_ACTIONS` | a pilha da plataforma; `treater.ts` |
| `infra/aws/lake.template.json` | Gerado de novo | `apps/server/src/platform/config-aws.ts` (`LAKE_TEMPLATE`, o sha) |
| `infra/aws/test/` | Muda `treater.test.ts`, `lake.test.ts`, `platform.test.ts` | — |

### Os contratos que a unidade cria

Nenhum tipo. A receita do lago muda; o sha novo é o da imagem, e a receita da `T1` passa a
`OUTDATED` (critério 6).

### As skills e a leitura

`aws-cdk`, `aws-iam` (as linhas de `infra/aws` do `stack.md`, "Read first": o README de
`aws-cdk-lib`, `assertions`, e os tipos L1 de `aws-lakeformation`); o guia de segurança.

### A ordem do trabalho

1. **As concessões e a `RenameTable`.** Critério: 5. **Arquivos:** `treater.ts`, `platform.ts`,
   `actions.ts`, `lake.template.json`.
   **Referência a seguir:** `treater.ts:126-140` (o `grant` e o `tableWildcard` das áreas que lê).
   **Testes:** `treater.test.ts`, "a troca": o modelo da receita tem o curinga nas duas áreas e a
   `RenameTable` só nelas; `platform.test.ts`: o teto dá `TREAT_TABLE_ACTIONS` só nas duas áreas, e
   `treater.test.ts` avalia o papel contra o teto (`:86`, `:113`). **Mutações à mão:** dar `RenameTable`
   ao papel da cópia, ou o curinga em `current`, ou tirar a declaração nova do teto, e um dos testes
   fica vermelho.
2. **A receita anterior.** Critério: 6. **Testes:** `treatment-routes.test.ts`, "receita anterior",
   com um lago gravado com o sha da receita da `T1`: Tratar agora e Propor recusam com
   `LAKE_NOT_READY`. **Mutações à mão:** pôr o sha da `T1` em `TREATABLE_BEFORE`, e o caso fica
   vermelho.

### Como se prova

O 5 pelo modelo da receita gerada (`aws-cdk-lib/assertions`), sem a AWS; o 6 pela porta do Hub
(T5), com o lago gravado no banco de teste (T19).

### Parar se

- A U1 mediu que a concessão curinga não basta.
- O papel avaliado contra o teto continua sem `RenameTable` depois da declaração nova.

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
| `packages/connectors/src/index.ts` | Muda: exporta `moldTests` e `TreatedTest`, ao lado de `treatedSelect` (`:127-129`) | `apps/server/src/hub/connectors/copy-source.ts` (`treatedLookup`, `:152-171`), que a U5 estende |

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/tables-treated.ts
export type TreatedTestLevel = 'BLOCK' | 'WARN'
export type TreatedTest =
  | Readonly<{ id: TreatedTestId; level: TreatedTestLevel; kind: 'NOT_NULL'; column: string }>
  | Readonly<{ id: TreatedTestId; level: TreatedTestLevel; kind: 'UNIQUE'; columns: readonly string[] }>
  | Readonly<{ id: TreatedTestId; level: TreatedTestLevel; kind: 'ACCEPTED_VALUES'; column: string; values: readonly string[] }>
  | Readonly<{ id: TreatedTestId; level: TreatedTestLevel; kind: 'RELATIONSHIP'; column: string; to: Readonly<{ table: TableName; column: string }> }>
export const TreatedTestId = z.string().regex(/^[a-z][a-z0-9_]{0,79}$/).brand('TreatedTestId')
export type TreatedTestId = z.infer<typeof TreatedTestId>   // o molde escreve TreatedTestId.parse('...')
export type TreatedTable = Readonly<{ description: string; columns: readonly TreatedColumn[]; tests?: readonly TreatedTest[] }>
/** O único dono dos testes de um molde: os da chave, mais os declarados. */
export function moldTests(declaration: TableDeclaration): readonly TreatedTest[]
```

As colunas são os `as` do molde. A chave da declaração casa com a `column` do molde sem olhar a caixa
(a chave é `NUNOTA`, a `column` é `nunota`, `copy-tables.ts:31`, `:36`), e o teste usa o `as` dela. A
aba mostra o `as` da coluna, que é o nome que a pessoa lê no SQL; nenhum rótulo novo. Sem `MATCH`: no molde, a conferência contra Copiado é igual por
construção, porque o molde lê `current` sem filtro nem junção (`tables-treated.ts:26`). O `id` dos
testes da chave é `chave_nao_vazia_<as>` e `chave_unica`. O `RELATIONSHIP` aponta para uma tabela do
mesmo conector com molde; a U5 a traduz para o nome que essa tabela tem no lago, na mesma ligação
(F16). O estado é a união pelo `kind` (C21); o `id` tem
marca e nasce por parse, como o `LakeTableName` (C23, C24); o dono dos testes do molde é `moldTests`
(C26). O `hub-api` tem o seu `TreatTest` (F15). O arquivo modelo é `tables-treated.ts`, que cumpre C26.

### As skills e a leitura

As linhas de `packages/connectors` do `stack.md`; `conexus-connector` (o kit); o guia de dados.

### A ordem do trabalho

1. **`moldTests`.** Critério: 7. **Testes:** `tables-treated.test.ts`, "a chave dá os testes".
   **Mutações à mão:** tirar o `NOT_NULL` da chave, e o teste fica vermelho.
2. **A conformidade.** Critério: 8. **Testes:** `conformance-tables.test.ts`, um caso por recusa.
   **Mutações à mão:** aceitar um `id` repetido, e o caso fica vermelho.
3. **O Sankhya.** Critério: 9. **Testes:** `copy-tables.test.ts`. **Mutações à mão:** subir uma
   relação a `BLOCK`, e o caso fica vermelho.

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
  `s3tables` `RenameTable` (`PUT .../rename`, medido no modelo de serviço instalado); o apagar pelo
  Athena, como `drop_relation`.
- **13.** `dbt-core artifacts/schemas/results.py:58-86`; `generic_test.py:30` (`attached_node`); o
  `depends_on.nodes` do teste em SQL.
- **12.** `apps/server/src/hub/treatment/tables.ts:22` (`MODEL_STATUSES`), `:160` (o `check` do
  estado); `treatment-rows.ts:46-56` (`lastOf`, o `z.enum` de `:54`) e `modelRunsWritten`;
  `select.ts:9` (`LastStatus`); `treatment-run.ts` (`countsOf`).
- Na base: `treat.py:96-106` (`_write_project`), `:124-131` (`_built`), `:138-150` (`_end`), `:172-185`
  (`treated`, e o `ended` por `node.node.name` de `:180`, que hoje só vê modelos);
  `entry.py:370-395` (`_treatment`, que cria o `Athena` em `:388` e onde nasce o cliente `s3tables`);
  `apps/extraction/tests/athena_double.py`; o servidor de teste de `tests/conftest.py:172-189`, que
  hoje só responde `GET` e `POST` pelo `X-Amz-Target`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/treatment.ts` | Cria `TreatTest`, `TestLevel`, `TestId` (o dono, F15) | `treat-task.ts`; U5; U8 |
| `apps/server/src/hub/treatment/treat-task.ts` | Muda: `TreatModel.tests`, o resultado com `HELD` e `TestEnd` | U5; `apps/extraction/contract/treat-task.schema.json` (gerado) |
| `apps/server/src/hub/treatment/tables.ts`, `treatment-rows.ts`, `select.ts`, `treatment-run.ts`; uma migração | Muda: `HELD` em `model_run` e no `check`; `lastOf` e `LastStatus`; a contagem de `HELD` no fechamento | U5 |
| `apps/extraction/src/conexus_extraction/` | Muda `treat.py`, `contract.py`, `entry.py` (o cliente `s3tables` em `_treatment`, a única linha); cria `swap.py` | a tarefa |
| `apps/extraction/tests/` | Muda `athena_double.py`, `conftest.py` (o `PUT .../rename` do `s3tables`), `test_treat.py`; entram as gravações da U1 | — |
| `docs/reference/boundaries.md` | Muda a seção `dbt-athena 1.11.2`: a saída nativa vira a troca em ondas, e o "rever quando" | `check-docs` |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/treatment.ts (o dono; treat-task.ts importa)
export const TestLevel = z.enum(['BLOCK', 'WARN'])
export const TestId = z.string().regex(/^[a-z][a-z0-9_]{0,79}$/).brand('TestId')
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
// apps/server/src/hub/treatment/treat-task.ts
// TreatModel ganha `tests: z.array(TreatTest).max(30).default([])`; a `version: 1` da especificação fica.
export const TestEnd = z.discriminatedUnion('outcome', [
  z.object({ id: TestId, outcome: z.literal('PASS') }),
  z.object({ id: TestId, outcome: z.literal('FAIL'), failures: z.int().min(1) }),
  z.object({ id: TestId, outcome: z.literal('ERROR') }),     // só o estado; o texto do Athena fica no log
])
const ModelEnd = z.discriminatedUnion('status', [
  z.object({ name: ModelName, status: z.literal('BUILT'), rows: z.int().min(0), tests: z.array(TestEnd) }),
  z.object({ name: ModelName, status: z.literal('HELD'), tests: z.array(TestEnd).min(1) }),
  z.object({ name: ModelName, status: z.literal('FAILED'), failure: TreatFailureCode,
    line: z.int().min(1).nullable() }),                      // TREAT_SWAP_FAILED é um failure novo
  z.object({ name: ModelName, status: z.literal('SKIPPED') }),
])
// TreatTaskResult.models passa a ser z.array(ModelEnd); o resto de treat-task.ts:58-77 fica.
```

O estado de cada modelo e de cada teste é união pelo campo que separa (C21). `TestId` é conferido
pelo esquema na entrada da tarefa (C23, C27). O dono da decisão (trocar ou travar) é uma função só
em `treat.py` (C26). O modelo de arquivo é `lake-task.ts`, como na `T1` (cumpre C21, C23 e C26).

Em `treatment.model_run`, `status` ganha `HELD`, por uma migração que troca o `check` do estado; o
`check` de `rows` fica `status = 'BUILT'`, e `HELD` não tem `rows`. No G1 o Hub não manda testes
(`models.ts:115` monta o modelo, e `tests` fica vazio pelo padrão), então nenhum `HELD` chega antes da
U5.

### As skills e a leitura

As linhas de `apps/extraction` do `stack.md`: `boto3` (`aws-sdk-python-usage`), `uv`, `ruff`, `mypy`,
`pytest`, `duckdb`, `jsonschema`, `dbt-core` e `dbt-athena` (lidos da fonte instalada); para o passo 6,
`drizzle-orm` e `drizzle-kit`; os guias de testes e de dados.

### A ordem do trabalho

1. **O contrato.** Critério: 15. **Arquivos:** `treat-task.ts`, o esquema gerado, `contract.py`.
   **Testes:** `treat-task.test.ts`: o esquema tem o `pattern` do controle. **Mutações à mão:** tirar o
   `regex` do controle, e o teste fica vermelho.
2. **Os testes no projeto.** Critérios: 2 (pela gravação), 12. **Arquivos:** `treat.py`. **O que
   entra:** um `models/<camada>/schema.yml` com `data_tests:`, cada teste com `name:
   <modelo>__<id>` e `config: {severity: error | warn}`; o `relationships` com `to` literal
   (`"<área>"."<tabela>"`), sem `ref`, para não criar aresta com o pai; o `UNIQUE` de várias colunas e o
   `MATCH` como testes em SQL em `tests/<modelo>__<id>.sql`, com `{{ config(severity=...) }}` e a linha
   `-- depends_on: {{ ref('<modelo>') }}`. Os resultados se separam pelo `resource_type` e pelo nó a que
   o teste se liga (`attached_node` ou `depends_on.nodes`), nunca só pelo nome (critério 14).
   **Mutações à mão:** ligar o teste ao modelo pelo nome do nó, e o caso "nomes parecidos" fica
   vermelho.
3. **As ondas.** Critérios: 11, 13. **O que entra:** a profundidade pelo `after`; um `dbt build
   --select <onda> --indirect-selection cautious` por onda, com `alias='0n_<t>'`; um modelo cujo
   `after` está em `select` e não trocou nesta rodada vem `SKIPPED` e não roda; um pai fora de `select`
   não pula o filho. **Mutações à mão:** um `build` só para todas as ondas, e o caso "ondas" fica
   vermelho.
4. **A troca.** Critérios: 10, 14. **Arquivos:** cria `swap.py`. **Referência a seguir:**
   `dbt-adapters table.sql:30-59`. **O que entra:** `RenameTable(<t> → 0v_<t>)` se `<t>` existe;
   `RenameTable(0n_<t> → <t>)`; o apagar de `0v_<t>` pelo `DROP TABLE` do Athena (F14); na falha da segunda, a volta;
   antes de cada onda, um `0v_<t>` sem `<t>` volta a `<t>`, e um `0v_<t>` ao lado de `<t>` é apagado
   (principle-make-operations-idempotent). Um `HELD` apaga `0n_<t>`. **Mutações à mão:** apagar antes de renomear, ou deixar o `0v_<t>` ao lado de
   `<t>`, e o caso "troca pela metade" fica vermelho.
5. **O resultado.** Critérios: 15, 16. **Arquivos:** `treat.py`, `boundaries.md`. **O que entra:** as
   linhas de `<t>` depois da troca, como hoje (`treat.py:134-135`); os testes só com id, estado e
   contagem.
6. **O Hub guarda o `HELD`.** Critério: 19. **Arquivos:** `tables.ts`, uma migração,
   `treatment-rows.ts`, `select.ts`, `treatment-run.ts`. **O que entra:** `HELD` em `MODEL_STATUSES` e
   no `check`; o `z.enum` de `lastOf` e `LastStatus` com `HELD`, sem mudar `selection`; a contagem no
   fechamento. **Testes:** `treatment-run.test.ts`, "duas rodadas depois de um HELD". **Mutações à
   mão:** tirar `HELD` do `z.enum` de `lastOf`, e o caso fica vermelho.

### Como se prova

`test_treat.py` entra pela porta da tarefa, a função de `entry.py` que o `conexus-copy` chama, com
`CONEXUS_TREAT_OBJECT` apontando para um objeto do dublê, como na `T1`. O `dbt build` roda de verdade
contra o dublê do Athena e do Glue (`tests/athena_double.py`), que responde com as gravações da U1, e
o servidor de teste de `conftest.py` responde ao `PUT .../rename` do `s3tables` com a forma gravada
pela U1 (T26). Hoje o 10 e o 11 falham: a tarefa não constrói ao lado. O 19 entra pela porta do Hub
(o `TREAT_RESULT` pela fila de teste, no banco de teste, T19) e falha hoje: o contrato recusa `HELD`.

### Parar se

- Um teste genérico não lê `0n_<t>` (o `alias` não chega ao teste): volta ao firstmate.
- O dublê precisa de mais de vinte chamadas novas do dbt-athena para um `build` com testes.
- A passada inteira ainda não entrou no `main` e muda `entry.py` perto de `_treatment`: a U4 espera.

## G1 O ponto de conferência

Depois da U4, antes do pull request: o `cdk synth` da receita e o da plataforma, e o diff contra os de
`57400a0c2`, com as concessões, a `RenameTable` e a declaração nova do teto, e nada mais; `test_treat.py` sobre as gravações da U1 e os testes de hoje
de `apps/extraction`; a migração no banco de teste e o `check-migrations`; `npm run check` e os testes
de `infra/aws`, `packages/connectors` e `apps/server/src/hub/treatment`; a linha de remoção de cada proteção tocada.

## U5 Os testes no Hub

**Base e modelo.** o ramo do G2, sobre o G1. Sonnet.

### As linhas da tabela

- **5.** `apps/server/src/hub/treatment/tables.ts:57-90` (`treatmentVersion`);
  `versions.ts:50-58` (`checkedProposal`, o hash), `:60-72` (`insertVersion`).
- **6.** `sql.ts:67` (`readModelSql`) para o controle do `MATCH`.
- **13.** `tables.ts:134-175` (`treatmentModelRun`); `treatment-rows.ts` (`modelRunsWritten`, e
  `closedIn` em `:205`); `models.ts:185-198` (a última rodada de cada modelo, que já ignora
  `SKIPPED`).
- **3.** `apps/server/src/hub/connectors/copy-source.ts:152-171` (`treatedLookup`), por onde o Hub lê o
  molde do kit, ganha `moldTests`, com o destino de cada `RELATIONSHIP` como a fonte da tabela, para o
  Hub achar o nome dela no lago pela mesma ligação.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/treatment/` | Muda `tables.ts`, `versions.ts`, `treatment-rows.ts`, `models.ts`, `treatment-start.ts` (a especificação com os testes) | `routes.ts`; U7 |
| `apps/server/src/hub/connectors/copy-source.ts`, `public.ts` | Muda: `treatedLookup` devolve também os testes do molde | `apps/server/src/hub/treatment/models.ts` |
| `packages/hub-api/src/treatment.ts`, `treatment-failures.ts` | Muda: os testes na proposta, na versão e na lista; `ModelRunView` com `HELD`; `TREATMENT_TEST_INVALID` | `apps/web/src/hub/treatment/` (U8) |
| uma migração em `apps/server` | Cria | — |

### Os contratos que a unidade cria

| Tabela | Coluna | Tipo | Restrição | Ao apagar |
| --- | --- | --- | --- | --- |
| `treatment.version` | `tests` | `jsonb not null default '[]'` | `jsonb_typeof = 'array'`; entra no hash | a versão, como hoje (`cascade` do modelo) |
| `treatment.model_run` | `tests` | `jsonb` | `check`: `tests` só em `BUILT` e `HELD`; as linhas gravadas antes da migração ficam nulas | a rodada, como hoje (`cascade`) |

```ts
// packages/hub-api/src/treatment.ts
// ProposeTreatment e ProposeTreatmentVersion ganham `tests: z.array(TreatTest).max(30).default([])`.
// VersionView ganha `tests: z.array(TreatTest)`.
export const TestView = z.object({ test: TreatTest, origin: z.enum(['MOLD', 'VERSION']),
  last: TestEnd.nullable() })                                // null: "Não rodou"
// ModelRunView (:49-59) ganha a variante { status: 'HELD', at, tests: TestEnd[] }, e as de hoje
// ganham `tests` quando houver.
// O item de Tratado e de Negócio (:90-102) ganha `tests: z.array(TestView)` e
// `lastBuiltAt: z.iso.datetime().nullable()`, a hora da última rodada BUILT (a "versão das HH:MM").
```

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
2. **A especificação.** Critério: 29. **O que entra:** `TreatModel.tests` é `moldTests` (U3) para um
   modelo `tratado`, com o `RELATIONSHIP` no nome da tabela de destino no lago e sem o de destino que a
   empresa não copia (F16), e os da versão ligada para um `negocio`.
   **Mutações à mão:** dar a um modelo `negocio` os testes do molde, e o 29 fica vermelho.
3. **Os testes no fechamento.** Critério: 30. **O que entra:** a coluna `model_run.tests`, por
   migração, e a gravação dela em `modelRunsWritten`. **Testes:** `treatment-run.test.ts`, "os testes
   gravados". **Mutações à mão:** não gravar `tests` num `HELD`, e o caso fica vermelho.
4. **A lista.** Critério: 20. **Mutações à mão:** `lastBuiltAt` pela última rodada, e não pela última
   `BUILT`, e o caso da travada fica vermelho.

### Como se prova

Pela porta do Hub (T5): as rotas de proposta e de lista, e o `TREAT_RESULT` pela fila de teste, com o
banco de teste (T19). Hoje o 17 falha: a proposta não aceita testes, e o 30 falha: o fechamento não grava testes.

### Parar se

- O hash novo muda o hash de uma versão já gravada: a migração não reescreve versões; leva ao
  firstmate.

## U6 As permissões do aviso

**Base e modelo.** o `main` com o G1. Sonnet. Entra no seu pull request próprio, antes do G2 (data
D11).

### As linhas da tabela

- **15.** `apps/server/src/hub/notifications/tables.ts:116-147` (`requestNotice`) e `:37-52`
  (`noticeIndexAndPolicies`); `requests/public-tables.ts` (a tabela de outro dono para a chave
  estrangeira, code C8).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/notifications/tables.ts` | Cria `treatmentNotice` | U7 |
| `apps/server/src/hub/treatment/public-tables.ts` | Cria, com `treatmentRun`, como `requests/public-tables.ts` | `notifications/tables.ts` |
| `apps/server/database-grants.sql` e uma migração | Muda e cria: a tabela, as políticas e as permissões | `catalog.test.ts` |

### Os contratos que a unidade cria

| Tabela | Coluna | Tipo | Restrição | Ao apagar |
| --- | --- | --- | --- | --- |
| `notifications.treatment_notice` | `id` | `uuid` | chave | — |
| | `company_id`, `person_id` | `text not null` | chave estrangeira para o membro, como `request_notice_member_fkey` | `cascade` |
| | `run_id` | `text not null` | chave estrangeira para `treatment.run(company_id, id)` | `cascade` |
| | `name` | `text not null` | o `ModelName` | — |
| | `kind` | `text not null` | `in ('HELD', 'BACK')` | — |
| | `created_at`, `read_at` | `timestamptz` | como `request_notice` | — |

O índice único `(run_id, name, person_id)`; o índice e as políticas por `noticeIndexAndPolicies`. A
chave para `treatment.run` vem de `treatment/public-tables.ts` (code C8). As permissões no
`database-grants.sql` pedem a palavra do fundador (data D11).

### As skills e a leitura

As linhas `drizzle-orm`, `drizzle-kit` (a skill do pacote) e PostgreSQL do `stack.md`;
`pstack:typescript-best-practices`; os guias de dados e de segurança.

### A ordem do trabalho

1. **A tabela e as permissões.** Critério: 31. **Referência a seguir:** `tables.ts:116-147`.
   **Testes:** `catalog.test.ts`; `notifications/tables.test.ts`. **Mutações à mão:** tirar a política
   da pessoa, e o caso de ler o aviso de outra pessoa fica vermelho.

### Como se prova

Pelo banco de teste (T19): o retrato do catálogo contra o `database-grants.sql` e a leitura recusada
pela política. Hoje o 31 falha: a tabela não existe.

### Parar se

- O fundador não aprovar as permissões: a U7 espera.

## U7 O aviso

**Base e modelo.** o ramo do G2, depois da U5, sobre o `main` com a U6. Sonnet.

### As linhas da tabela

- **15.** `apps/server/src/hub/notifications/tables.ts:116-147` (`requestNotice`);
  `request-notices.ts:13-25` (`noticeRequests`, `on conflict do
  nothing`), `:32` (a página do sino); `requests/requests.ts:122` (`membersAllowed`);
  `notifications.ts:150-175` (o e-mail que não desfaz a notificação), `:227-283` (a página e a
  contagem de não lidos, que hoje juntam duas tabelas), `:285` (`markRead`); `mail.ts:16-24`
  (`automationMail`); `main.ts:211-212` (o `noticeRequests` passado aos pedidos, a porta que a
  `treatment` também recebe); `treatment-run.ts:95` (o fechamento).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/notifications/` | Muda `notifications.ts` (a página do sino junta os avisos), `mail.ts`, `notification-render.mjs`; cria `treatment-notices.ts`, `treatment-email.tsx` | U7 pela rota do sino |
| `apps/server/src/hub/treatment/treatment-notice.ts` | Cria: a passagem e os tipos das duas portas; `closedIn` a chama no fechamento | `treatment-rows.ts`, `notifications/` |
| `apps/server/src/hub/treatment/treatment-rows.ts`, `treatment-run.ts` | Muda: `closedIn` grava os avisos na transação e os devolve; `close` manda os e-mails depois dela | — |
| `apps/server/src/hub/treatment/public.ts` | Muda: as portas nas dependências; o rótulo e a existência de uma tabela, para o sino | `notifications/` |
| `apps/server/src/main.ts` | Muda: passa `noticeTreatment` e `mailTreatmentNotices` da `notifications` à `treatment`, como `:211-212` | — |
| `packages/hub-api/src/notifications.ts` | Muda: `NotificationRow` ganha `TREATMENT_HELD` e `TREATMENT_BACK` | U8 |

### Os contratos que a unidade cria

A tabela é a da U6. As duas portas, no molde do `NoticeRequests`: quem consome define o tipo
(`requests/requests.ts:18`, exportado em `requests/public.ts:6`), e a `notifications` implementa
(`request-notices.ts:13`).

```ts
// apps/server/src/hub/treatment/treatment-notice.ts, exportado por treatment/public.ts;
// implementado em apps/server/src/hub/notifications/treatment-notices.ts
export type TreatmentNotice = Readonly<{ companyId: CompanyId; personId: PersonId;
  runId: TreatmentRunId; name: ModelName; kind: 'HELD' | 'BACK' }>
// na transação do fechamento
export type NoticeTreatment = (tx: CommandTx, notices: readonly TreatmentNotice[]) => Promise<void>
// depois do commit; uma falha é impressa e não lança
export type MailTreatmentNotices = (notices: readonly TreatmentNotice[]) => Promise<void>
```

`NotificationRow`:
`{ kind: 'TREATMENT_HELD' | 'TREATMENT_BACK', layer, table, label, at }`, sem nenhum valor do dado. A
passagem é uma função só, `noticesOf(before, after)`, dona da regra "um aviso por passagem" (C26); o
"antes" é o último estado que não é `SKIPPED`, como `models.ts:185-198`. O sino lê o rótulo e se a
tabela ainda existe pela `treatment/public.ts`, na hora de mostrar; a de uma tabela que saiu diz "Esta
tabela não existe mais".

### As skills e a leitura

As linhas de `apps/server/src` do `stack.md` (`fastify-best-practices`, `drizzle-orm`, `drizzle-kit`;
`react-email` lido da fonte); `pstack:typescript-best-practices`; o guia de dados.

### A ordem do trabalho

1. **A passagem.** Critério: 21. **O que entra:** no fechamento, na mesma transação, o último estado
   de cada modelo antes da rodada contra o de agora; os que passaram para `HELD` ou de volta para
   `BUILT` gravam um aviso por pessoa de `membersAllowed(..., 'approveTreatment')`. **Mutações à mão:**
   avisar em toda rodada `HELD`, e o caso "duas seguidas" fica vermelho; contar `SKIPPED` como o
   "antes", e o caso `HELD`, `SKIPPED`, `BUILT` fica vermelho.
2. **O e-mail.** Critérios: 21, 22. **O que entra:** depois da transação, pelo `sendMail` de hoje, como
   `notifications.ts:150-175`; o e-mail leva o nome da tabela e o link, nada do dado. **Mutações à
   mão:** mandar o e-mail dentro da transação, e o caso do `MAIL_UNAVAILABLE` fica vermelho;
   mandar só no "travou", e o caso do "voltou" fica vermelho.
3. **O sino.** Critérios: 22, 26 (o lado do servidor). A página, a contagem de não lidos e o
   `markRead` juntam a terceira tabela, com a continuação de hoje (code C44). **Mutações à mão:**
   deixar a contagem de não lidos sem a tabela nova, e o caso "avisos de tratamento" fica vermelho.

### Como se prova

Pela porta do Hub: o `TREAT_RESULT` pela fila de teste e a rota do sino, com o correio de teste e o
banco de teste (T19). Hoje o 21 falha: o fechamento não avisa ninguém.

### Parar se

- O correio de teste não alcança o e-mail sem mudar `platform/mail.ts`.

## U8 Os testes em Dados

**Base e modelo.** o ramo do G2, depois da U7. Sonnet.

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

Nenhum; lê os da U5 e da U7. Os textos, para o fundador aprovar: "Testes"; "Trava", "Avisa"; "do
molde"; "Passou", "Falhou: <n> linhas", "Avisou: <n> linhas", "Deu erro ao rodar", "Não rodou";
"Travada: segue a versão das <HH:MM>"; "Ainda sem versão: <teste> falhou"; "Trocou, com <n>
aviso(s)"; "Esta tabela não tem testes."; "Nenhum teste"; "Acrescentar teste"; "Conferência"; "A soma
de <coluna> bate com"; "A contagem bate com"; "Falhou: o número não bateu"; "A troca da tabela
falhou; a versão anterior segue no ar." (o `TREAT_SWAP_FAILED` em `text.ts`, ao lado de
`modelReasonText`, `:78-86`); "<tabela> travou"; "<tabela> voltou"; "Esta tabela não existe mais".

### As skills e a leitura

As linhas de `apps/web/src` do `stack.md`: `@tanstack/react-router` (as skills de
`@tanstack/router-core`), `@tanstack/react-query`, `@shadcn/react` (`shadcn`), `react-hook-form`,
`vitest`, `msw`; `impeccable`; `pstack:typescript-best-practices`; o guia web.

### A ordem do trabalho

1. **A aba Testes.** Critério: 23. **Mutações à mão:** mostrar "Passou" num teste sem resultado, e o
   23 fica vermelho.
2. **Travada e Com aviso.** Critério: 24. **Mutações à mão:** trocar o primeiro teste que falhou pelo
   último, e o 24 fica vermelho.
3. **O formulário e o cartão.** Critério: 25. **Mutações à mão:** mandar a proposta sem os testes, e o
   25 fica vermelho.
4. **O sino.** Critério: 26. **Mutações à mão:** dar o link da tabela ao aviso de uma tabela que saiu,
   e o 26 fica vermelho.

Cada passo com o seu teste pela tela (Testing Library e o `msw` sobre os contratos do `hub-api`).

### Como se prova

Pelos testes de tela; o 27 pela QA a 1280 e 390 px, nos dois temas.

### Parar se

- A aba Testes pede uma peça de `ui/` que não existe (design V62).

## G2 O ponto de conferência

Depois da U8, antes do pull request: a migração no banco de teste e o `check-migrations`; as rotas da
proposta, da lista e do sino; o `TREAT_RESULT` pela fila de teste com `HELD`; as telas a 1280 e 390 px
nos dois temas; `npm run check`, os testes de `apps/server/src/hub/treatment`,
`apps/server/src/hub/notifications`, `apps/web/src/hub/treatment`, `apps/web/src/hub/notifications` e
`packages/hub-api`; o build do servidor (o `notification-render.mjs`); a linha de remoção de cada
proteção tocada.
