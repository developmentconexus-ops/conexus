# Lago e AWS

Onde mora o dado copiado de cada empresa: o lago na AWS, a pilha por empresa, a leitura pelo Athena,
a permissão pelo Lake Formation e a tarefa de cópia no Fargate. O que a cópia lê de cada sistema está
em [Extração Singer](extracao-singer.md). As etapas estão na [Trilha Dados](../steps/trilhas/dados.md).

## Decidido

- [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md), aceito em 2026-11-19: o dado copiado mora num lago na AWS, em São Paulo.
- [0072](../decisions/0072-the-lab-aws-account-is-provisional.md), aceito em 2026-11-20: a conta de laboratório da AWS é provisória.
- [0073](../decisions/0073-platform-by-cdk-one-stack-per-company.md), aceito em 2026-11-20: a plataforma por CDK, uma pilha CloudFormation por empresa.
- [0075](../decisions/0075-how-the-hub-reaches-aws.md), aceito em 2026-11-20: como o Hub chega à AWS, de fora dela.
- [0076](../decisions/0076-a-copy-runs-as-a-fargate-task-ending-by-a-queue.md), aceito em 2026-11-20: uma cópia roda numa tarefa Fargate, e o fim chega por uma fila.
- [0078](../decisions/0078-how-the-lake-knows-who-reads.md), aceito em 2026-11-21: o Hub decide quem lê, e a AWS impõe em cada consulta, por etiqueta
  de sessão e Lake Formation.
- [0079](../decisions/0079-the-agent-reads-the-lake-neon-serves-apps.md), aceito em 2026-11-20: o agente lê o lago; o Neon da empresa serve os apps.
- [0080](../decisions/0080-copy-declared-per-table-raw-appends.md), aceito para o modo incremental e proposto para a janela e a passada inteira: a camada bruta
  só acrescenta, e o Athena refaz a camada atual.
- [0063](../decisions/0063-copy-models-proof.md), aceito em 2026-11-10: os modelos de cópia provados no Sankhya do fundador, só contando.
- Aprovações: [o-lago-da-empresa-nasce-e-some](../approvals/o-lago-da-empresa-nasce-e-some.md), com
  as decisões F, G e H do Lago 1, e
  [a-primeira-copia-chega-ao-lago](../approvals/a-primeira-copia-chega-ao-lago.md).
- A bruta guarda a linha só até entrar na atual; a NF-e fica sem histórico (fundador,
  2026-11-24).

## Provado

| O que | O número | Estudo |
| --- | --- | --- |
| O caminho inteiro em duas pilhas trocáveis | 30 tabelas e 1,76 milhão de linhas iguais à fonte, três vezes; a régua pegou três erros plantados | `conexus-fase0-trilho` |
| Contra a Nekt, mesmo banco e mesma máquina | 1.763.606 linhas em 9,8 min contra 35 min, 30 de 30 tabelas iguais; o limite é a CPU | `conexus-p1-comparacao-nekt` |
| `S3 Tables`, Athena e Lake Formation na AWS real | o papel sem direito recebe `TABLE_NOT_FOUND`; nove tentativas de cruzar empresas recusadas | `conexus-fase1` |
| A escala | 55 milhões de linhas em 233 s, sem diferença; o `MERGE` do Athena falha a partir de 231 colunas | `conexus-fase1-escala` |
| O Hub de fora da AWS | só assume o papel da empresa pela etiqueta de sessão transitiva, 33 de 33 testes | `conexus-fase1b` |
| Do servidor do Hub | 24 de 24 chamadas aceitas, 3 de 3 recusadas de outro IP; 0,3 a 0,56 s por pergunta | `conexus-p3-hub-vps` |
| Empresas por conta | 100; o `S3 Tables` recusa o 101º bucket. Cadastrar leva 36 s, remover 26 s | `conexus-fases-2a4` |
| A pilha por empresa | criada em 23 a 27 s, apagada em 15 a 21 s, desfeita sozinha numa falha | `conexus-lago1-estudo`, `conexus-aws-infra-prova` |
| O fim da rodada sem lease | 22 testes e 45 execuções seguidas fecham os seis jeitos de terminar | `conexus-p3-fim-da-rodada` |
| O fim na AWS real | 19 cenários; o aviso de parada leva cerca de 24 s; a tarefa órfã para em 5 a 7 s | `conexus-p4-fim-na-aws` |
| Regravar a tabela inteira | 1.503 mudanças regravaram 28,68 MB; o `MERGE` do Athena gravou 53 KB | `conexus-achados-auditoria` |
| Um bucket que não existe | responde 403, não `NotFound`; o Hub lê o diário da pilha primeiro | `conexus-lago1-sobra-pelo-diario` |

## Lido

- AWS: `S3 Tables`, Athena, Lake Formation, IAM com etiqueta de sessão, CloudFormation,
  ParallelCluster, SQS e EventBridge. A conta grátis não tem
  IAM Roles Anywhere nem CUR 2.0 (`conexus-alinhamento-hub-aws`).
- PyIceberg 0.12, DuckDB 2.0.0, DuckLake e Lakekeeper 0.15.1: medidos na fase de candidatas, antes
  da [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) (`conexus-e1-armazenamento`, `conexus-e1-concorrencia-docs`, `conexus-passada-inteira`).
- Prefect, Dagster, Airflow, Meltano e Temporal: quem copia escreve o próprio resultado
  (`conexus-copia-lease-token`).
- 14 de 15 referências guardam um registro por cliente fora da nuvem, escrito só pelo plano de
  controle (`conexus-lago1-g-referencias`).
- Nekt, documentação de 2026-11-19: a pilha CloudFormation no cliente cria papéis, Lambda e VPC
  (`conexus-nekt-lambda`). Nekt e Databricks: 107 capacidades contadas
  (`conexus-data-layer-coverage`).
- dbt-athena, SQLMesh e o medalhão: o medalhão é recomendação, não requisito
  (`conexus-tratamento-medalhao`).

## Superado

- As candidatas de lugar e formato (VPS, R2, DuckDB, DuckLake, Iceberg num catálogo nosso, Google)
  caíram com a [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md).
- A cópia no banco Neon da empresa (a Capacidade 2, a spec de dados e o `conexus-dados-spec-3`)
  caiu com a [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) e a [0079](../decisions/0079-the-agent-reads-the-lake-neon-serves-apps.md). O Neon da empresa fica só para os apps.
- "Não ter lakehouse", de `conexus-databricks-study` (2026-11-10), caiu com a [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md).
- O dbt sobre o Athena (`conexus-tratamento-medalhao`) caiu com a [0080](../decisions/0080-copy-declared-per-table-raw-appends.md), que refaz a camada atual
  em três comandos.
- O Unity Catalog como modelo de regra (`conexus-unity-catalog-study`) caiu com a [0078](../decisions/0078-how-the-lake-knows-who-reads.md).

## Aberto

- A fila justa de consultas no Hub, peça nossa sem referência (delivery L28): quando a segunda
  empresa entrar.
- A coluna por leitor e a linha por pessoa no lago; com a permissão de quem o agente lê quando roda
  sozinho. Ver a [Trilha Dados](../steps/trilhas/dados.md).
- A comparação de código e deploy com a Nekt na AWS (`conexus-comparacao-nekt`): pedido sem
  relatório.

## Estudos de origem

Uma linha por estudo, da data mais nova para a mais velha. "Virou" é o registro, a aprovação, o cartão ou o PR em que o estudo deu.

| Data | Estudo | Estado | Virou | Em uma frase |
| --- | --- | --- | --- | --- |
| 2026-11-22 | `conexus-lago1-sobra-pelo-diario` | decidido | PR 1255; emenda de o-lago-da-empresa-nasce-e-some.md | Depósito ausente responde 403, não NotFound; pela opção d o Hub lê o diário da pilha e só procura o depósito quando ele não diz apagado. |
| 2026-11-22 | `conexus-lago1-g-referencias` | decidido | [o-lago-da-empresa-nasce-e-some](../approvals/o-lago-da-empresa-nasce-e-some.md) (decisão G) | A G (a) é a forma convergente: 14 de 15 referências guardam um registro por cliente fora da nuvem, escrito só pelo plano de controle. |
| 2026-11-22 | `conexus-lago1-fix-orcamento` | superado, por conexus-lago1-fix-orcamento-2 | - | Primeira tentativa de tirar o nome fixo do orçamento; parou com trabalho parcial, refeita no conserto seguinte. |
| 2026-11-22 | `conexus-lago1-f-verificacao` | decidido | [o-lago-da-empresa-nasce-e-some](../approvals/o-lago-da-empresa-nasce-e-some.md) (decisão F) | A F (a), receita por endereço fixo presa por cloudformation:TemplateUrl, é conforme à orientação da AWS com quatro ajustes e dois reforços nomeados. |
| 2026-11-22 | `conexus-lago1-cartao-fgh` | decidido | [o-lago-da-empresa-nasce-e-some](../approvals/o-lago-da-empresa-nasce-e-some.md); PR 1231 | Fechou F (a) com os ajustes da verificação, G (a) e H (a) no cartão do Lago 1, com as palavras do fundador. |
| 2026-11-22 | `conexus-lago1-cartao` | decidido | [o-lago-da-empresa-nasce-e-some](../approvals/o-lago-da-empresa-nasce-e-some.md); PR 1231 | Cartão do Lago 1: 6 unidades em 3 grupos, 23 linhas de referência e as decisões F, G e H novas na página do fundador. |
| 2026-11-21 | `conexus-roadmap-lakehouse` | decidido | docs/steps/trilhas/dados.md; [o-lago-da-empresa-nasce-e-some](../approvals/o-lago-da-empresa-nasce-e-some.md) | A validação fechou com prova por peça; a trilha segue em etapas finas: o lago nasce e some, a primeira cópia chega, o agente responde pelo lago. |
| 2026-11-21 | `conexus-roadmap-generalidade` | decidido | [0080](../decisions/0080-copy-declared-per-table-raw-appends.md); docs/steps/trilhas/dados.md | O lago serve a qualquer fonte, mas a porta de entrada tinha a forma do Sankhya (páginas de 5.000, janela de mês); faltava o conector declarar a cópia por tabela. |
| 2026-11-21 | `conexus-permissoes-lago` | decidido | [0078](../decisions/0078-how-the-lake-knows-who-reads.md) | Três camadas: o Hub decide, a AWS impõe em cada consulta; a etiqueta de sessão leva quem lê, e a chave de API é credencial do Hub, não da AWS. |
| 2026-11-21 | `conexus-lago1-estudo` | decidido | [o-lago-da-empresa-nasce-e-some](../approvals/o-lago-da-empresa-nasce-e-some.md) | Lago por empresa numa pilha CloudFormation por botão; no modelo de 7 recursos criar levou 23 a 27 s e apagar 15 a 21 s. |
| 2026-11-21 | `conexus-b0-lakehouse` | decidido | [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md); [0071](../decisions/0071-connectors-kit-live-copies-singer.md); [0072](../decisions/0072-the-lab-aws-account-is-provisional.md); [0073](../decisions/0073-platform-by-cdk-one-stack-per-company.md); [0074](../decisions/0074-python-for-extraction-in-apps-extraction.md); [0075](../decisions/0075-how-the-hub-reaches-aws.md); [0076](../decisions/0076-a-copy-runs-as-a-fargate-task-ending-by-a-queue.md); [0077](../decisions/0077-how-a-credential-reaches-the-copy-task.md); [0078](../decisions/0078-how-the-lake-knows-who-reads.md); [0079](../decisions/0079-the-agent-reads-the-lake-neon-serves-apps.md); [0080](../decisions/0080-copy-declared-per-table-raw-appends.md) | PR só de documentos com os registros do lago e as emendas, cada um com a palavra do fundador e a prova que o sustenta. |
| 2026-11-20 | `conexus-p4-fim-na-aws` | decidido | [0076](../decisions/0076-a-copy-runs-as-a-fargate-task-ending-by-a-queue.md) | Na AWS real, 19 cenários fecharam com o fim verdadeiro; o aviso de parada levou cerca de 24 s e a tarefa órfã parou em 5 a 7 s. |
| 2026-11-20 | `conexus-p3-hub-vps` | decidido | [0075](../decisions/0075-how-the-hub-reaches-aws.md) | Do servidor, 24 de 24 chamadas aceitas e de outro IP 3 de 3 recusadas; sessão de 15 min vence; São Paulo custa 0,3 a 0,56 s por pergunta. |
| 2026-11-20 | `conexus-p3-fim-da-rodada` | decidido | [0076](../decisions/0076-a-copy-runs-as-a-fargate-task-ending-by-a-queue.md) | Sem lease, uma cópia nunca fica com duas rodadas abertas: 22 testes e 45 execuções seguidas fecharam os seis jeitos de terminar. |
| 2026-11-20 | `conexus-p1-comparacao-nekt` | decidido | [0076](../decisions/0076-a-copy-runs-as-a-fargate-task-ending-by-a-queue.md) | Mesmo banco e máquina da Nekt: 30 tabelas e 1.763.606 linhas em 9,8 min contra 35 min, 30 de 30 iguais à fonte; o limite é a CPU. |
| 2026-11-20 | `conexus-fases-2a4` | decidido | [0073](../decisions/0073-platform-by-cdk-one-stack-per-company.md); [0076](../decisions/0076-a-copy-runs-as-a-fargate-task-ending-by-a-queue.md); [0078](../decisions/0078-how-the-lake-knows-who-reads.md) | Cabem 100 empresas por conta (o `S3 Tables` recusa o 101º bucket); cadastrar leva 36 s, remover 26 s; fila justa no Hub zera recusas de cota do Athena. |
| 2026-11-20 | `conexus-copia-lease-token` | superado, por conexus-copia-nativa-causa-raiz | [0076](../decisions/0076-a-copy-runs-as-a-fargate-task-ending-by-a-queue.md) | Em Prefect, Dagster, Airflow, Meltano e Temporal quem copia escreve o próprio resultado; a rodada fecha pelo aviso da AWS com o resultado vindo pela fila. |
| 2026-11-20 | `conexus-alinhamento-repo-plano` | decidido | [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md); [0071](../decisions/0071-connectors-kit-live-copies-singer.md); [0072](../decisions/0072-the-lab-aws-account-is-provisional.md); [0073](../decisions/0073-platform-by-cdk-one-stack-per-company.md); [0074](../decisions/0074-python-for-extraction-in-apps-extraction.md); [0075](../decisions/0075-how-the-hub-reaches-aws.md); [0076](../decisions/0076-a-copy-runs-as-a-fargate-task-ending-by-a-queue.md); [0077](../decisions/0077-how-a-credential-reaches-the-copy-task.md); [0078](../decisions/0078-how-the-lake-knows-who-reads.md); [0079](../decisions/0079-the-agent-reads-the-lake-neon-serves-apps.md) | A direção é coerente, mas as peças finais nunca rodaram juntas; propôs quatro provas pequenas e o B0 com os registros do lago. |
| 2026-11-19 | `conexus-tratamento-medalhao` | superado, por [0080](../decisions/0080-copy-declared-per-table-raw-appends.md) | - | Medalhão é recomendação, não requisito; com o bruto fiel de todas as colunas a camada tratada vira necessária; recomendava dbt-athena, a única ferramenta SQL com `S3 Tables` nativo. |
| 2026-11-19 | `conexus-plano-validacao` | superado, por conexus-plano-sistema | - | Plano de validar quatro candidatas inteiras de lugar e formato (VPS ou AWS, DuckLake ou Iceberg) pelo caminho de ponta a ponta mais curto, antes de qualquer teste. |
| 2026-11-19 | `conexus-plano-sistema` | decidido | [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md); [0078](../decisions/0078-how-the-lake-knows-who-reads.md); [0080](../decisions/0080-copy-declared-per-table-raw-appends.md) | Plano de testes multiempresa das finalistas P0 Postgres, P1 BigQuery e P2 Athena com `S3 Tables` e Lake Formation; nenhum teste reprova por tempo; extração Singer sob Meltano. |
| 2026-11-19 | `conexus-pilhas-sintese` | decidido | [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | Quatro finalistas: só Postgres como controle, AWS com Athena, BigQuery e DuckDB nosso; a permissão por papel tem de ser imposta pelo motor; protótipo local mostrou o DuckDB gravando Iceberg. |
| 2026-11-19 | `conexus-pilhas-opus` | decidido | [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | Requisitos sem nome de ferramenta e pilhas inteiras lado a lado; o DuckDB entrou por um critério do servidor de hoje; finalistas com Postgres como controle, Athena, BigQuery e DuckDB. |
| 2026-11-19 | `conexus-pilhas-fable` | decidido | [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | O DuckDB entrou como premissa sem requisito; a pergunta real é alugar ou rodar o motor, e as falhas já medidas caem todas do lado de rodar. |
| 2026-11-19 | `conexus-passada-inteira` | superado, por [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | - | Estudo e protocolo revisado da passada inteira com MERGE grande em DuckLake e Iceberg, pausado pelo fundador antes da bateria medida; só ensaios de fumaça, n=1. |
| 2026-11-19 | `conexus-nekt-lambda` | aberto | - | Trecho da documentação da Nekt: a pilha CloudFormation no cliente cria papéis, funções Lambda e uma VPC; o webhook entra por API Gateway, Lambda e SQS. |
| 2026-11-19 | `conexus-lab-trilho` | decidido | [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md), [0079](../decisions/0079-the-agent-reads-the-lake-neon-serves-apps.md), [0080](../decisions/0080-copy-declared-per-table-raw-appends.md) | Código do trilho das fases 0 e 1: oito passos por pilha, P0 em Postgres e Neon, P2 em Iceberg no `S3 Tables` com Athena e Lake Formation. |
| 2026-11-19 | `conexus-lab-infra` | decidido | [0076](../decisions/0076-a-copy-runs-as-a-fargate-task-ending-by-a-queue.md) | Desenho D-fila: o relógio do Hub chama RunTask e o fim chega por EventBridge e SQS; a versão 2 corrige o fim perdido na DLQ e a tarefa esquecida. |
| 2026-11-19 | `conexus-fase1b` | decidido | [0075](../decisions/0075-how-the-hub-reaches-aws.md); [0079](../decisions/0079-the-agent-reads-the-lake-neon-serves-apps.md) | Provas `V1` a V8: o Hub, de fora da AWS, só assume papéis da empresa pela etiqueta de sessão transitiva, 33 de 33 testes; o agente lê pelo Athena. |
| 2026-11-19 | `conexus-fase1-escala` | decidido | [0080](../decisions/0080-copy-declared-per-table-raw-appends.md) | 55 milhões de linhas carregadas em 233 s com régua sem diferença no Athena; o incremental pelo Athena funciona, mas o MERGE falha a partir de 231 colunas. |
| 2026-11-19 | `conexus-fase1` | decidido | [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md); [0075](../decisions/0075-how-the-hub-reaches-aws.md); [0078](../decisions/0078-how-the-lake-knows-who-reads.md) | Caminho inteiro na AWS real com `S3 Tables`, Athena e Lake Formation: o papel sem direito recebeu TABLE_NOT_FOUND, e nove tentativas de cruzar foram recusadas pela AWS. |
| 2026-11-19 | `conexus-fase0-trilho` | decidido | [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | Um trilho roda o caminho da empresa em duas pilhas trocáveis; 30 tabelas e 1,76 milhão de linhas iguais à fonte três vezes; a régua pegou três erros plantados. |
| 2026-11-19 | `conexus-e1-armazenamento` | superado, por [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | - | DuckLake e Iceberg REST iguais à fonte em 1x; em 10x o MERGE de 10,1 milhões de itens falhou por memória com 1 GB nos dois, atômico e sem perda. |
| 2026-11-19 | `conexus-dados-topologia` | superado, por [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | - | Propôs medir três topologias com os mesmos dados: tudo na VPS, tudo na AWS em São Paulo, VPS com arquivos no R2; o Google saiu; venceu a AWS. |
| 2026-11-19 | `conexus-dados-principios` | superado, por [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | - | Princípios do fundador: validar a arquitetura e não tecnologias soltas, experimentos comparáveis com falha e recuperação; DuckDB, DuckLake, Iceberg, R2 e VPS eram candidatos. |
| 2026-11-19 | `conexus-dados-planejamento` | decidido | [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md); [0071](../decisions/0071-connectors-kit-live-copies-singer.md); [0079](../decisions/0079-the-agent-reads-the-lake-neon-serves-apps.md) | Com o lago na AWS o banco da empresa deixa de guardar a cópia, a [0069](../decisions/0069-connectors-one-source-the-kit.md) pede emenda para taps Singer, e as provas `V1` a V8 vêm antes. |
| 2026-11-19 | `conexus-comparacao-nekt` | aberto | - | Só o pedido do fundador: comparar a arquitetura de código e deploy na AWS (Fargate, ECS) com a Nekt; não há relatório nesta pasta. |
| 2026-11-19 | `conexus-aws-infra-prova` | decidido | [0073](../decisions/0073-platform-by-cdk-one-stack-per-company.md); [0076](../decisions/0076-a-copy-runs-as-a-fargate-task-ending-by-a-queue.md); [0077](../decisions/0077-how-a-credential-reaches-the-copy-task.md) | Pilha CloudFormation por empresa em 27 s, desfeita sozinha numa falha; o SDK direto deixava sobras e o papel só servia 10 s depois. |
| 2026-11-19 | `conexus-arquitetura-repensar-fable` | decidido | [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | O lado operacional passa no teste do zero; o lado analítico nasceu na VPS e no R2 por inércia, e é ali que vale reestruturar. |
| 2026-11-19 | `conexus-arquitetura-repensar` | decidido | [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | Cloudflare não guarda dado na América do Sul nem tem Postgres; cinco peças só se sustentam por terem sido feitas assim. |
| 2026-11-19 | `conexus-alinhamento-hub-aws` | decidido | [0072](../decisions/0072-the-lab-aws-account-is-provisional.md); [0075](../decisions/0075-how-the-hub-reaches-aws.md) | A conta grátis não tem IAM Roles Anywhere nem CUR 2.0; o isolamento por bucket, etiqueta de sessão e Lake Formation é igual na conta oficial. |
| 2026-11-19 | `conexus-achados-auditoria` | decidido | [0080](../decisions/0080-copy-declared-per-table-raw-appends.md) | O target regravava a tabela inteira por escolha nossa: 1.503 mudanças regravaram 28,68 MB; MERGE do Athena gravou 53 KB e só acrescentar 62 KB. |
| 2026-11-18 | `conexus-e1-concorrencia-docs` | superado, por [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | - | O 409 do Iceberg na escrita concorrente é o prometido; com novas tentativas gravaram 39 e 40 de 40; o DuckLake repete o commit em silêncio e trava. |
| 2026-11-18 | `conexus-base-dados-estudo` | superado, por [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | - | Um lado analítico em colunas e um operacional em Postgres; copiar sozinho deu 5 de 10 respostas, e a prata errada levou a 0 de 10. |
| 2026-11-17 | `conexus-dados-revisao-fable` | superado, por conexus-base-dados-estudo | - | Mais de cem citações do estudo de dados reabertas se sustentam; o rascunho parou quando o fundador pediu um estudo completo novo, e o veredito ficou sem conferência. |
| 2026-11-17 | `conexus-dados-onde-estamos` | superado, por [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | - | O caminho do dado existia só para o Sankhya, cinco tabelas no banco da empresa; sem camadas bronze, prata e ouro; a qualidade de dados era o maior buraco. |
| 2026-11-15 | `conexus-dados-spec-3` | superado, por [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | - | Spec 3 sobre a cópia na Neon: explorador em árvore, passada semanal com aviso e causa, regra de qualidade que só conta e emendas às partes 3 e 4. |
| 2026-11-14 | `conexus-nekt-transformations-study` | aberto | - | Na Nekt cada fonte, consulta, notebook e histórico é um pipeline com um gatilho; o grafo usa React Flow 12, a mesma biblioteca do Mastra Studio. |
| 2026-11-14 | `conexus-nekt-structure-study` | superado, por [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | - | A Nekt organiza dado e contexto em dois andares; propunha o dado ficar no banco de cada empresa, com o catálogo como dobradiça. |
| 2026-11-14 | `conexus-nekt-rea` | aberto | - | Leitura do app, da API e do MCP da Nekt no trial, com 138 capturas e só a forma dos dados gravada, sem valores nem segredos. |
| 2026-11-14 | `conexus-data-layer-synthesis` | decidido | conexus-data-layer-scoping; docs/steps/trilhas/dados-spec | Nekt e Databricks guardam o bruto, descrevem no catálogo e põem o significado por cima; o Conexus tinha o contrato de três verbos, mas ninguém o implementava nem chamava. |
| 2026-11-14 | `conexus-data-layer-spec` | decidido | docs/steps/trilhas/dados-spec | Spec no formato Kiro em quatro partes, 34 requisitos e 260 critérios, com uma prova num PostgreSQL 18 descartável que trocou o login de leitura por papel. |
| 2026-11-14 | `conexus-data-layer-scoping` | decidido | docs/steps/trilhas/dados-spec | Escopo em quatro partes (dado guardado e catálogo, conector, leitura para análise, governança mínima); a página Cópias vira Dados com Bruto, Negócio e Apps. |
| 2026-11-14 | `conexus-data-layer-coverage` | decidido | [a-pergunta-respondida-com-a-origem](../approvals/a-pergunta-respondida-com-a-origem.md) | 107 capacidades vistas na Nekt e no Databricks: 37 na spec, 37 em spec futura, 17 já existem, 2 buracos (a causa da falha e a qualidade). |
| 2026-11-10 | `conexus-databricks-study` | superado, por [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | - | Conexus e Databricks se parecem só na cópia para um Postgres liberada por grupo; recomendou não ter lakehouse, Delta nem Spark. |
