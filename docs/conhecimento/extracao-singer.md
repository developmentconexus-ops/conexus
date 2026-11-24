# Extração Singer

Como uma tabela de um sistema chega ao lago: o tap Singer gerado do kit, o Meltano que o roda, o
target nosso que grava e o dinheiro exato. O lugar onde a tarefa roda e o lago estão em
[Lago e AWS](lago-e-aws.md); a definição de cada sistema, em [Conectores](conectores.md).

## Decidido

- [0071](../decisions/0071-connectors-kit-live-copies-singer.md), aceito em 2026-11-21: a cópia é um tap Singer sob o Meltano, na tarefa de cópia. O target é
  nosso, porque os prontos guardavam dinheiro como `double`. Um adaptador gera o tap do kit para
  todo sistema de API e não nomeia nenhum conector.
- [0074](../decisions/0074-python-for-extraction-in-apps-extraction.md), aceito em 2026-11-19: Python para a extração, em `apps/extraction`.
- [0080](../decisions/0080-copy-declared-per-table-raw-appends.md): a cópia é declarada por tabela (modo incremental aceito; janela e passada inteira
  propostos).
- O cartão do Lago 2, "A primeira cópia chega ao lago", está no PR 1260, à espera da aprovação.

## Provado

| O que | O número | Estudo |
| --- | --- | --- |
| Um tap do Sankhya no SDK do Meltano, sem fork | 86 linhas; 20.000 pedidos com contagem e soma iguais à fonte; na segunda rodada só as 5 mudadas; 27 testes de conformidade passaram | `conexus-extracao-singer` |
| O adaptador que gera o tap do kit | 112 linhas; o Meltano rodou o falso do HubSpot sem o token no ambiente | `conexus-implementacao-dados` |
| O adaptador com renovação | 4 renovações em 100 s no falso do Sankhya; a chave de 6 colunas da tabela fiscal foi recusada | `conexus-p2-adaptador-sankhya` |
| O dinheiro exato | 200.010 linhas com a soma igual dígito por dígito; com `double` a soma errava 2,40; o valor que não cabe falha a rodada | `conexus-dinheiro-exato` |
| O target de Parquet da loja | só acrescenta: a linha alterada fica duas vezes, a data vira texto, o dinheiro vira ponto flutuante | `conexus-extracao-singer` |
| O `target-ducklake` aberto | faz o merge certo e mantém os tipos, mas ignora as exclusões | `conexus-extracao-singer` |
| A cópia para um lago local | o adaptador copiou os falsos do Sankhya e do HubSpot pelo Meltano; o Sankhya trouxe só o que mudou | `conexus-lago2-estudo` |

## Lido

- Meltano 4.4.1 e `singer-sdk` 0.54.9: conector próprio sem fork, de um Git privado, com lugar
  próprio para o ponto de parada. Desde a 4.3.0, consultar a loja pede login no Meltano Cloud;
  rodar não pede (`conexus-extracao-singer`).
- O Meltano passou da Arch para a Matatika em 2026, fonte secundária (`conexus-extracao-singer`).
- `target-postgres` da MeltanoLabs faz upsert e exclusão; `reservoir-data/target-ducklake` é o
  desenho de um target pequeno; `target-jsonl` 0.1.4 serviu às provas (`conexus-kit-nango`).
- A Nekt: os conectores são taps Singer (`nekt-sdk-py@0b58fc7`). Não há tap público do Sankhya nem
  do TOTVS, nem dela nem de outro.
- Um tap no SDK tem de 310 a 1.438 linhas por sistema (`conexus-credenciais-framework`).
- Nenhuma carga incremental, nem Singer nem dlt, vê uma linha apagada na fonte. A passada inteira
  resolve ([0080](../decisions/0080-copy-declared-per-table-raw-appends.md)).

## Superado

- "Adotar Singer é adotar o Meltano", de `conexus-base-dados-estudo`: o Singer é um contrato de
  linha de comando e o Meltano é um dos programas que o rodam (`conexus-extracao-singer`).
- "Trocar o Singer pelo kit porque nenhum tap cobre o Sankhya", de `conexus-pilhas-opus`: a
  premissa é verdadeira, mas a Nekt também escreveu o dela. A [0071](../decisions/0071-connectors-kit-live-copies-singer.md) ficou com os dois.
- O Sync escrito pelo Builder e a cópia da empresa no Neon (`conexus-builder-authored-sync-study`,
  `conexus-cap2-study`): caíram com a [0071](../decisions/0071-connectors-kit-live-copies-singer.md) e a [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md).
- O primeiro estudo e o primeiro cartão do Lago 2: o modelo Vendas fugia do padrão, com regra de
  negócio e 11 de 450 colunas. O reestudo trouxe a tabela inteira, e o lago é a única fonte
  (`conexus-lago2-reestudo`, `conexus-lago2-cartao-2`).

## Aberto

- A aprovação do cartão do Lago 2, no PR https://github.com/developmentconexus-ops/conexus/pull/1260.
  As decisões dele já estão respondidas: as da página
  [Decisões do Lago 2](https://claude.ai/artifact/8BmoqomUhP9mMTrGtfk6Du), e o nome de negócio da
  tabela e uma tabela por ligação, em [Conectores](conectores.md).

## Estudos de origem

Uma linha por estudo, da data mais nova para a mais velha. "Virou" é o registro, a aprovação, o cartão ou o PR em que o estudo deu.

| Data | Estudo | Estado | Virou | Em uma frase |
| --- | --- | --- | --- | --- |
| 2026-11-23 | `conexus-n5-duas-ligacoes` | decidido | PR 1260 (cartão do Lago 2) | Uma tabela por ligação: as quatro referências separam pela credencial e juntam só na camada seguinte; uma tabela única quebraria a passada inteira da [0080](../decisions/0080-copy-declared-per-table-raw-appends.md). |
| 2026-11-23 | `conexus-lago2-reestudo` | decidido | PR 1260 (cartão em aprovação) | O modelo Vendas fugia do padrão: regra de negócio, 11 de 450 colunas e nome de negócio; a cópia traz a tabela inteira, e o lago é a única fonte. |
| 2026-11-23 | `conexus-lago2-estudo` | superado, por conexus-lago2-reestudo | PR 1260 | Estudo da primeira cópia no lago; um adaptador copiou os falsos do Sankhya e do HubSpot pelo Meltano até um lago local; o Sankhya trouxe só o que mudou. |
| 2026-11-23 | `conexus-lago2-cartao-2` | em curso | PR 1260 | Cartão reescrito com o lago como única fonte: 13 unidades, 69 critérios, 38 linhas de referência; a parte 0 tira a cópia do banco da empresa. |
| 2026-11-23 | `conexus-lago2-cartao` | superado, por conexus-lago2-cartao-2 | PR 1260 | Primeiro cartão da primeira cópia no lago: 12 unidades, 66 critérios e as decisões A a I abertas; o fundador recusou a decisão B. |
| 2026-11-20 | `conexus-p2-adaptador-sankhya` | decidido | [0071](../decisions/0071-connectors-kit-live-copies-singer.md), [0077](../decisions/0077-how-a-credential-reaches-the-copy-task.md) | O adaptador do kit copiou o falso do Sankhya pelo Meltano com 4 renovações em 100 s; a chave de 6 colunas da tabela fiscal ficou recusada. |
| 2026-11-20 | `conexus-dinheiro-exato` | decidido | [0071](../decisions/0071-connectors-kit-live-copies-singer.md) | Com o remendo a soma de 200.010 linhas no lago bate dígito por dígito com a fonte; com double errava 2,40; valor que não cabe falha a rodada. |
| 2026-11-19 | `conexus-implementacao-dados` | decidido | [0071](../decisions/0071-connectors-kit-live-copies-singer.md), [0073](../decisions/0073-platform-by-cdk-one-stack-per-company.md), [0074](../decisions/0074-python-for-extraction-in-apps-extraction.md) | Opção (b): o kit fica a única definição e um adaptador de 112 linhas gera o tap Singer; o Meltano rodou o falso do HubSpot sem o token no ambiente. |
| 2026-11-19 | `conexus-extracao-singer` | decidido | [0071](../decisions/0071-connectors-kit-live-copies-singer.md); [0074](../decisions/0074-python-for-extraction-in-apps-extraction.md) | Tap do Sankhya com o SDK do Meltano em 86 linhas, sem fork: 20.000 pedidos com contagem e soma iguais à fonte, depois só as 5 mudadas; 27 testes passaram. |
| 2026-11-10 | `conexus-builder-authored-sync-study` | superado, por [0071](../decisions/0071-connectors-kit-live-copies-singer.md) | [o-sync-de-qualquer-conector](../approvals/o-sync-de-qualquer-conector.md) | Separar como se lê uma lista (do conector) do que copiar (declaração do Builder): laboratório copiou 137 linhas, depois só as 26 alteradas. |
| 2026-11-09 | `conexus-cap2-study` | superado, por [0071](../decisions/0071-connectors-kit-live-copies-singer.md) | [capacidade-2-o-sync-da-empresa](../approvals/capacidade-2-o-sync-da-empresa.md) | Provado que o Mastra 1.82 não impede duas rodadas da mesma agenda e recupera rodadas órfãs por padrão; a cópia passa a ser da empresa. |
