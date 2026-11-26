# Conectores

O kit de conectores (`@conexus/connectors`), o ao vivo que o agente e os apps chamam, as escritas e
cada sistema: Sankhya, Mercado Livre e HubSpot. A cópia em massa está em
[Extração Singer](extracao-singer.md); o login e a renovação, em [Credenciais](credenciais.md).

## Decidido

- [0071](../decisions/0071-connectors-kit-live-copies-singer.md), aceito em 2026-11-21: o kit serve o ao vivo; a cópia roda como tap Singer, gerado do kit
  por um adaptador único. Emenda a [0069](../decisions/0069-connectors-one-source-the-kit.md).
- [0069](../decisions/0069-connectors-one-source-the-kit.md), aceito em 2026-11-14 e emendado em 2026-11-21: uma fonte de conectores, o kit. A Nango fica
  fora do código e só serve de referência de padrão. Substituiu a opção H5 (Nango mais kit).
- [0080](../decisions/0080-copy-declared-per-table-raw-appends.md), aceito para o modo incremental: cada conector declara, por tabela, a chave, a página, o modo
  de cópia e a descoberta.
- [0062](../decisions/0062-a-write-declares-its-provider-facts.md), aceito em 2026-11-08: uma escrita declara o que só o fornecedor sabe.
- [0058](../decisions/0058-provider-limits-and-queues.md): os limites do fornecedor, a espera do 429 e uma chamada por ligação.
- Na consulta livre do Sankhya, a escrita é recusada pelo gateway do Sankhya, e o filtro só de leitura
  do conector (`read-only-sql.ts`) é a outra camada (fundador, 2026-11-26). Nenhuma escrita foi tentada
  nesta etapa para provar a recusa.
- [0056](../decisions/0056-connectors-kit-and-one-executor.md), proposto em 2026-10-29: o kit de definições e um executor no Hub. Substituiu a [0031](../decisions/0031-connectors-single-executor.md).
- Os conectores do marco `D3`. O fundador, 2026-11-23: "Conector eu quero: - Sankhya - Mercado Livre - Hubspot - TOTVS - Gmail com Agenda - Outlook email - Outlook Calendar - google drive - Sharepoint - NF-e - Sicoob".
  São onze, e a lista substitui a recomendada na seção 1.5 de `conexus-ao-vivo-estudo` (a decisão D
  do estudo).
- O ao vivo refeito, ao estudo `conexus-ao-vivo-estudo`. O fundador, 2026-11-23: "Aprovado suas
  recomendacoes conector".
  - **A (a):** as pastas do Sankhya e do Mercado Livre são refeitas do zero, com os mesmos ids, e
    cada peça do Hub que diverge do decidido também. As que já são o decidido ficam: o executor, o
    login por autorização, as leituras como ferramentas e a escrita com o cartão. A Fábrica é provada
    no TOTVS.
  - **B (a):** gravar no Caderno pede o sim de quem gerencia a ligação; o Caderno sai na etapa do
    Negócio (0064).
  - **C (a):** uma etapa própria, O conector no padrão novo, entre a parte 0 e a parte 1 do Lago 2,
    com um pull request por conector.
  - **Uma tabela por ligação** (`conexus-n5-duas-ligacoes`): a segunda leva o nome da ligação.
- Os nomes no lago, ao estudo `conexus-conector-estilo-novo-estudo`, em 2026-11-23: o nome de negócio
  em português declarado no kit (`sankhya_notas`, "Notas e pedidos", origem `TGFCAB`); a tabela que o
  kit não declara fica com o código; o que lê o `sync` sai na parte 0 do Lago 2.
- Aprovações: [e19-conectores](../approvals/e19-conectores.md),
  [e191-ligar-por-oauth](../approvals/e191-ligar-por-oauth.md),
  [e20-app-com-dados](../approvals/e20-app-com-dados.md),
  [e245-os-agentes-escrevem](../approvals/e245-os-agentes-escrevem.md).

## Provado

| O que | O número | Estudo |
| --- | --- | --- |
| O kit gera o catálogo Singer completo do Sankhya | nenhuma linha do kit mudou | `conexus-kit-nango` |
| A página do gateway do Sankhya | 5.000 linhas por página, 11,3 s cada, 442 linhas/s numa sessão | `conexus-a0b-script-final` |
| Filtrar por mês no Sankhya | 7,3 vezes o ritmo: 3.275 contra 450 linhas/s | `conexus-a0c-sankhya-paginacao` |
| O limite era a página de 500 do kit, não o SQL | 397 contra 3.140 linhas/s | `conexus-a0d-sankhya-kit-mes` |
| O `NUMBER` do Sankhya chega exato e o `JSON.parse` perde dígitos | a partir do 16º dígito | `conexus-a0e-sankhya-decimal` |
| As fiscais sem coluna de alteração | o log nativo cobre 89 tabelas e guarda 7 dias | `conexus-a0-alteracao-fiscais` |
| O tamanho do kit | 2.193 linhas descrevem os sistemas; 6.210 protegem a empresa no Hub | `conexus-connector-sdk-adopt` |
| A Nango local rodou login, ação e sync com um Sankhya falso | rodou; depois a [0069](../decisions/0069-connectors-one-source-the-kit.md) tirou a Nango do código | `conexus-connector-cost-study` |

## Lido

- Nango (`nango@d6c912eb`) e Mastra Connect 1.4.1 (`mastra@10484e3b`): o Mastra Connect roda sobre
  a Nango. Do kit, faltavam o login por chave fixa, a nova tentativa em 5xx, a diferença entre novo e
  mudado e o gerador (`conexus-kit-nango`, `conexus-kit-vs-nango-study`).
- Licenças de Nango, n8n, Pipedream, Composio, Paragon, Activepieces e Airbyte: nenhum serve aberto
  e livre para um serviço como o Conexus (`conexus-credenciais-framework`, em
  [Credenciais](credenciais.md)).
- Catálogos alugados (Pipedream, Composio, Nango) e geração por OpenAPI: ninguém da categoria
  escreve à mão os conectores comuns (`conexus-connector-catalog-study`, 2026-11-14).
- Airbyte: 533 de 540 conectores de API declaram os campos à mão (`conexus-inventory-generality`).
- Documentação da Nekt guardada em 2026-11-19: o nome da tabela no lago é de negócio, o código do
  sistema fica ao lado (`conexus-conector-estilo-novo-estudo`). Fivetran, Airbyte, Databricks e Nekt
  separam ligações pela credencial (`conexus-n5-duas-ligacoes`).

- Sankhya: o pedido entra por `POST /v1/vendas/pedidos`, que exige nota modelo e tira dela a TOP, ou
  por `CACSP.incluirNota`, que recebe a TOP direto. O pedido a confirmar pode já reservar estoque e
  criar financeiro, conforme a TOP. O cartão de aprovação de uma escrita deve dizer o que a TOP faz
  (`conexus-e245-write-path-study`, `conexus-e245-live-order-study`, 2026-11-07 e 08).

## Superado

- Os seis estudos de conectores de 2026-11-14 (catálogo alugado, arquitetura, custo, SDK, ações e
  Nango contra o kit) recomendavam a Nango ao lado do kit. O fundador escolheu H5 e, na mesma noite,
  a [0069](../decisions/0069-connectors-one-source-the-kit.md) tirou a Nango do código. A comparação de licenças e de peças continua válida como leitura.
- A política de apagar na hora (`conexus-sync-delete-policy`) foi escrita para a cópia no banco da
  empresa, que a [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) tirou de lá.
- O motor de cópias de hoje, com o esquema `sync` e os modelos do Sankhya e do Mercado Livre, sai
  antes de o padrão novo entrar (`conexus-conector-estilo-novo-estudo`, 2026-11-23).

## Aberto

- **O aviso de cópia parada, por ligação**: um cartão próprio, o seguinte à primeira cópia.

A Nango e o Composio já foram lidos (as linhas de 2026-11-14 a 2026-11-20 abaixo). O firstmate parou
uma pesquisa nova deles no estudo do ao vivo, que reusou o decidido.

## Estudos de origem

Uma linha por estudo, da data mais nova para a mais velha. "Virou" é o registro, a aprovação, o cartão ou o PR em que o estudo deu.

| Data | Estudo | Estado | Virou | Em uma frase |
| --- | --- | --- | --- | --- |
| 2026-11-23 | `conexus-conector-estilo-novo-estudo` | decidido | PR 1260 (cartão do Lago 2) | O nome técnico no lago deve ser de negócio em português, declarado no kit (sankhya_notas), com TGFCAB só como origem; nenhum ERP da Nekt usa o código da tabela. |
| 2026-11-23 | `conexus-ao-vivo-estudo` | decidido | PR 1260 (a etapa O conector no padrão novo) | O ao vivo já está decidido nas [0056](../decisions/0056-connectors-kit-and-one-executor.md), [0057](../decisions/0057-connections-by-oauth.md) e [0062](../decisions/0062-a-write-declares-its-provider-facts.md); o código diverge em dez pontos; quatro decisões ao fundador: alcance, Caderno, onde entra, os dez do `D3`. |
| 2026-11-21 | `conexus-conectores-documentos` | decidido | [0071](../decisions/0071-connectors-kit-live-copies-singer.md) (G2 a) | A loja do Meltano não tem Drive, Outlook nem OneDrive; taps prontos ficam fora até um sistema pedir; documento: tabela no lago, original em Arquivos, texto no Knowledge. |
| 2026-11-20 | `conexus-a0e-sankhya-decimal` | decidido | [0071](../decisions/0071-connectors-kit-live-copies-singer.md) | O gateway manda o NUMBER como número JSON exato; o JSON.parse do kit perde dígitos a partir do 16º; ler pelo context.source. |
| 2026-11-20 | `conexus-a0d-sankhya-kit-mes` | decidido | [0080](../decisions/0080-copy-declared-per-table-raw-appends.md); [0063](../decisions/0063-copy-models-proof.md) | O limite é a página de 500 do kit, não o SQL: 397 contra 3.140 linhas/s; levou a subir a página para 5.000 linhas. |
| 2026-11-20 | `conexus-a0c-sankhya-paginacao` | decidido | [0080](../decisions/0080-copy-declared-per-table-raw-appends.md) | Filtrar por mês dá 7,3 vezes o ritmo do controle (3.275 contra 450 linhas/s); o custo era CPU do Oracle na varredura do índice, não disco nem gateway. |
| 2026-11-20 | `conexus-a0b-script-final` | decidido | [0080](../decisions/0080-copy-declared-per-table-raw-appends.md); [0063](../decisions/0063-copy-models-proof.md) | Leitura cronometrada no Sankhya real: página máxima de 5.000 linhas, 11,3 s cada, 442 linhas/s numa sessão; LogMiner impossível (NOARCHIVELOG). |
| 2026-11-20 | `conexus-a0-alteracao-fiscais` | decidido | [0080](../decisions/0080-copy-declared-per-table-raw-appends.md) | As sete tabelas fiscais dispensam coluna de alteração: as duas grandes recopiam a janela recente por data; o log nativo do Sankhya cobre 89 tabelas e guarda 7 dias. |
| 2026-11-19 | `conexus-kit-nango` | decidido | [0071](../decisions/0071-connectors-kit-live-copies-singer.md); K2 de 2026-11-19 | O kit gera o catálogo Singer completo do Sankhya sem mudar uma linha; Mercado Livre e HubSpot não têm colunas nem chave; K2: escolher na página da conexão, nada marcado. |
| 2026-11-19 | `conexus-conectores-fonte-agente` | aberto | - | Só o pedido: refazer todos os conectores no padrão novo e validar com Google Drive ou Gmail, fonte do lago contra conector do agente; não há relatório nesta pasta. |
| 2026-11-14 | `conexus-kit-vs-nango-study` | decidido | [0069](../decisions/0069-connectors-one-source-the-kit.md) | O kit atende os marcos e é mais seguro que a Nango; faltam login por chave fixa, nova tentativa em 5xx, novo contra mudado e o gerador. |
| 2026-11-14 | `conexus-connector-sdk-adopt` | superado, por [0069](../decisions/0069-connectors-one-source-the-kit.md) | - | O kit tem duas metades: a descrição do sistema (2.193 linhas), que os prontos cobrem, e a proteção da empresa no Hub (6.210 linhas), que nenhum faz. |
| 2026-11-14 | `conexus-connector-cost-study` | superado, por [0069](../decisions/0069-connectors-one-source-the-kit.md) | - | O fundador escolheu a Nango e H5 (Nango mais kit); um Sankhya falso rodou login, action e sync numa Nango local; a [0069](../decisions/0069-connectors-one-source-the-kit.md) tirou a Nango do código. |
| 2026-11-14 | `conexus-connector-catalog-study` | superado, por [0069](../decisions/0069-connectors-one-source-the-kit.md) | - | Ninguém da categoria escreve conectores comuns à mão: alugam catálogo (Pipedream, Composio, Nango) ou geram de OpenAPI; o G4 OS tem 38 no código, nenhum próprio. |
| 2026-11-14 | `conexus-connector-architecture-study` | superado, por [0069](../decisions/0069-connectors-one-source-the-kit.md) | - | Catálogo alugado guarda a chave no fornecedor, conector próprio a cifra no nosso banco; propôs catálogo alugado e kit lado a lado, com Automática, Pergunta antes ou Desligada. |
| 2026-11-14 | `conexus-connector-ac-study` | superado, por [0069](../decisions/0069-connectors-one-source-the-kit.md) | - | Nos três catálogos a ferramenta chega como nome, descrição e campos, e a permissão mora no nosso servidor; o fundador decidiu B1 (app de login nosso) e D1. |
| 2026-11-10 | `conexus-sync-delete-policy` | superado, por [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | [o-sync-de-qualquer-conector](../approvals/o-sync-de-qualquer-conector.md) | Quase todos os produtos apagam na hora após confirmar; só o Nango guarda dados sincronizados, por 1 dia; recomenda apagar na hora, com a restauração do Neon como rede. |
| 2026-11-09 | `conexus-write-answer-study` | decidido | [e245-os-agentes-escrevem](../approvals/e245-os-agentes-escrevem.md) (emenda, PR 915) | A causa não era retornoPedido, nome do esquema na doc; o mais provável é o número em texto; a origem foi tratar a página do fornecedor como verdade do sucesso. |
| 2026-10-28 | `conexus-connectors-deep` | decidido | [0056](../decisions/0056-connectors-kit-and-one-executor.md); [e19-conectores](../approvals/e19-conectores.md) | O conector vira kit nosso no Hub, com funções prontas para apps, ferramentas que pedem aprovação para escrever, caderno da ligação e Integrações na barra lateral. |
