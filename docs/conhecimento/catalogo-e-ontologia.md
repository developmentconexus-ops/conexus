# Catálogo e Ontologia

O catálogo que descreve o que cada sistema tem, a descoberta de tabelas e campos, a Ontologia (o
dicionário aprovado do negócio), o Brain e o Knowledge. O contrato de acesso (descrever, ler, agir)
está na [Trilha Dados](../steps/trilhas/dados.md).

## Decidido

- [0064](../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md), aceito em 2026-11-12: a Ontologia da empresa em tabelas do Hub, crescida por propostas
  aprovadas.
- [0065](../decisions/0065-brain-on-mastra-knowledge-behind-our-isolation.md), aceito em 2026-11-12 e emendado em 2026-11-13 (áreas): o Brain sobre o Knowledge do Mastra,
  atrás do nosso isolamento.
- [0067](../decisions/0067-ontology-metamodel-palantir-core-roles-and-named-links.md), aceito em 2026-11-12: o metamodelo da Ontologia, o núcleo do Palantir com papéis e ligações
  nomeadas.
- [0080](../decisions/0080-copy-declared-per-table-raw-appends.md): a descoberta é declarada por conector, por gancho ou por lista.
- Aprovação: [a-pergunta-respondida-com-a-origem](../approvals/a-pergunta-respondida-com-a-origem.md),
  com a emenda de 2026-11-15 (a cópia segue legível quando a conexão cai).

## Provado

| O que | O número | Estudo |
| --- | --- | --- |
| O isolamento do Knowledge do Mastra | no teste com duas empresas, a segunda não viu nada da primeira | `conexus-mastra-knowledge-study` |
| Um CRM sobre o Sankhya com três conceitos, de ponta a ponta | rodou; o exemplo pediu trinta escolhas, treze que o Builder adivinharia | `conexus-ontologia-example-study` |
| Um app com SQL livre sobre a política de linha | troca o `set_config` e lê vendas de outro | `conexus-unity-catalog-study` |
| A tabela da Nekt quando a fonte muda de estado | segue consultável com a fonte ativa, inativa e arquivada | `conexus-criterio-17-testes` |
| O laboratório de eval da Ontologia | 2 milhões de pedidos gerados em 193 s; o piloto espera dois logins | `conexus-lab-eval-ontologia-knowledge` |

## Lido

- O metamodelo do Palantir: conceito, campo, ligação com dois lados, estado, proposta e revisão
  (`conexus-ontology-metamodel-study`).
- Knowledge do Mastra 1.82: alfa, sem tipos, campos, validação nem aprovação; não garante
  isolamento entre áreas (`conexus-ontologia-dentro-ou-fora-knowledge`,
  `conexus-mastra-knowledge-study`).
- O agente do Databricks desce pelo catálogo (busca, descreve, amostra, consulta) com a permissão de
  quem pergunta; o Unity Catalog aberto não tem linhagem, tags nem auditoria
  (`conexus-databricks-rea`).
- O dicionário do Sankhya (`TDDTAB`, `TDDCAM`, `TDDINS`) e os campos `AD_`: o Sankhya se descobre
  pelo dicionário; uma API igual para todos tem catálogo fixo; um CRM fixa tabelas e descobre
  colunas (`conexus-descoberta-catalogo`).
- omnigraph, auto-ontology da NVIDIA, ERPNext, Odoo, G4 OS, Dify e LobeChat: referências de padrão,
  nenhuma adotada.

## Superado

- O inventário lido ao ligar (`conexus-inventory-critique`, `-generality`, `-provenance`) e as
  páginas Conhecimento prototipadas: o cartão "A Ontologia da empresa" foi aposentado em 2026-11-15
  e o PR 1030 não entrou.
- O lugar do dado na `conexus-proposta-dados-contexto-memoria`: caiu com a [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) e a [0079](../decisions/0079-the-agent-reads-the-lake-neon-serves-apps.md).

## Aberto

- A issue 1108: o exemplo do agente cita uma tabela que não existe, e a descoberta não devolve o
  nome qualificado (`conexus-agente-ferramentas-de-dados-referencias`).
- O fluxo da empresa (processo, estados) ficou para uma etapa seguinte (`conexus-company-flow-study`).
- O Brain e a Ontologia voltam depois do marco `D4` da [Trilha Dados](../steps/trilhas/dados.md).

## Estudos de origem

Uma linha por estudo, da data mais nova para a mais velha. "Virou" é o registro, a aprovação, o cartão ou o PR em que o estudo deu.

| Data | Estudo | Estado | Virou | Em uma frase |
| --- | --- | --- | --- | --- |
| 2026-11-19 | `conexus-descoberta-catalogo` | decidido | [0080](../decisions/0080-copy-declared-per-table-raw-appends.md) | API igual para todos tem catálogo fixo; CRM fixa tabelas e descobre colunas; o Sankhya é um banco por baixo e se descobre pelo dicionário, com os campos AD_. |
| 2026-11-16 | `conexus-ontologia-knowledge-desenho` | decidido | [0064](../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md), [0065](../decisions/0065-brain-on-mastra-knowledge-behind-our-isolation.md) | O Knowledge é um grafo de páginas com acesso por regra separada; a Ontologia fica em tabelas do Hub e chega ao Knowledge como espelho. |
| 2026-11-16 | `conexus-ontologia-dentro-ou-fora-knowledge` | decidido | [0064](../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md) | Ontologia e Knowledge são complementares: o Knowledge 1.82 não tem tipos, campos, validação nem aprovação; o veredito não muda a [0064](../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md). |
| 2026-11-16 | `conexus-lab-eval-ontologia-knowledge` | aberto | - | Lab de eval com ERP sintético, 300 conceitos, 400 páginas e 520 perguntas com gabarito por SQL; 2 milhões de pedidos gerados em 193 s; o piloto espera dois logins. |
| 2026-11-16 | `conexus-agente-ferramentas-de-dados-referencias` | aberto | issue 1108 | O desenho de acesso segue as referências; o defeito é nosso: o exemplo cita uma tabela inexistente e a descoberta não devolve o nome qualificado. |
| 2026-11-15 | `conexus-proposta-dados-contexto-memoria` | superado, por [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md); [0079](../decisions/0079-the-agent-reads-the-lake-neon-serves-apps.md) | - | Proposta única de dados, contexto e memória; a Nekt não tem Ontologia, só uma camada de contexto em prosa; o fundador aprovou O1c, O2a, O3a, O4a e a M1. |
| 2026-11-15 | `conexus-omnigraph-study` | decidido | [0064](../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md), [0067](../decisions/0067-ontology-metamodel-palantir-core-roles-and-named-links.md) | O omnigraph é banco em grafo que guarda o dado; recomenda manter só o significado e usá-lo como referência de padrão, sem adotá-lo. |
| 2026-11-15 | `conexus-criterio-17-testes` | decidido | [a-pergunta-respondida-com-a-origem](../approvals/a-pergunta-respondida-com-a-origem.md) (emenda 2026-11-15) | Na Nekt a tabela seguiu consultável com a fonte ativa, inativa e arquivada; no Databricks privilégio de conexão e de tabela são objetos separados. |
| 2026-11-15 | `conexus-criterio-17-referencias` | decidido | [a-pergunta-respondida-com-a-origem](../approvals/a-pergunta-respondida-com-a-origem.md) (emenda 2026-11-15) | Nenhuma referência torna ilegível uma tabela já copiada quando a conexão cai; o agente lê a cópia e diz a origem pelo registro gravado. |
| 2026-11-15 | `conexus-auto-ontology-check` | aberto | - | O auto-ontology da NVIDIA vale só como fonte de padrões pontuais, como a ligação inferida com prova barata; não serve de forma nem fluxo. |
| 2026-11-14 | `conexus-inventory-provenance` | superado, por a-ontologia-da-empresa (cartão aposentado em 2026-11-15) | PR 1030 | Vinte produtos lidos: ler metadados da fonte é comum e escrito pelo autor do conector como ação comum; nenhum kit tem espaço próprio de inventário. |
| 2026-11-14 | `conexus-inventory-critique` | superado, por a-ontologia-da-empresa (cartão aposentado em 2026-11-15) | PR 1030 | O inventário ao ligar só copiava 27 operações já declaradas no código; nenhuma referência guarda isso por conexão; recomenda nada lido ao ligar. |
| 2026-11-14 | `conexus-databricks-rea` | decidido | conexus-data-layer-synthesis | O agente do Databricks desce pelo catálogo (busca, descreve, amostra, consulta) com a permissão de quem pergunta; o Unity Catalog aberto não tem linhagem, tags nem auditoria. |
| 2026-11-13 | `conexus-ontology-health-study` | decidido | [metodo](../approvals/metodo.md) (referências da mesma situação, 2026-11-13) | O Mastra 1.82 não marca conhecimento velho; Dify, LobeChat e as memory stores controlam envelhecimento, e nenhuma refaz a prova todo dia. |
| 2026-11-13 | `conexus-inventory-generality` | superado, por a-ontologia-da-empresa (cartão aposentado em 2026-11-15) | PR 1030 | O Airbyte tem quatro jeitos de saber o que a fonte tem, pelo tipo da fonte; 533 de 540 conectores de API declaram os campos à mão. |
| 2026-11-12 | `conexus-ontology-visual-study` | superado, por a-ontologia-da-empresa (cartão aposentado em 2026-11-15) | - | O protótipo anterior só mostrava o esquema; faltavam objetos, ligações percorríveis e ações; a página Conhecimento v3 acrescenta a tela do objeto. |
| 2026-11-12 | `conexus-ontology-metamodel-study` | decidido | [0067](../decisions/0067-ontology-metamodel-palantir-core-roles-and-named-links.md) | Existe um metamodelo consolidado, o do Palantir, e o cartão já seguia quase todo: conceito, campo, ligação com dois lados, estado, proposta e revisão. |
| 2026-11-12 | `conexus-ontology-alignment-study` | decidido | [0067](../decisions/0067-ontology-metamodel-palantir-core-roles-and-named-links.md) | O desenho modelava as coisas, não papéis, fluxos e estados; o ERP já guarda papéis e fluxo espalhados em códigos e perfis. |
| 2026-11-12 | `conexus-ontologia-study` | decidido | [0064](../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md) | A Ontologia é o dicionário aprovado do negócio: o que existe, campos, códigos, ligações e de onde ler; guarda nomes e códigos, nunca valores. |
| 2026-11-12 | `conexus-ontologia-example-study` | decidido | [0064](../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md), [0067](../decisions/0067-ontology-metamodel-palantir-core-roles-and-named-links.md) | Um CRM sobre o Sankhya com três conceitos rodou de ponta a ponta; o exemplo pediu trinta escolhas, treze que o Builder adivinharia, agora decididas. |
| 2026-11-12 | `conexus-knowledge-prototype` | superado, por conexus-knowledge-page-prototype | - | Protótipo descartável da camada de conhecimento em passos, com quatro vistas sincronizadas: conversa, telas, banco e código. |
| 2026-11-12 | `conexus-knowledge-page-prototype` | superado, por a-ontologia-da-empresa (cartão aposentado em 2026-11-15) | - | Protótipo da página Conhecimento no menu, depois de Cópias: memória da empresa, conceitos e sistemas, no jeito da tela Knowledge do Mastra Studio. |
| 2026-11-12 | `conexus-knowledge-layers-study` | decidido | [0065](../decisions/0065-brain-on-mastra-knowledge-behind-our-isolation.md) (áreas, emenda de 2026-11-13) | Das cinco coisas que o Assistente precisa saber, o Conexus tinha três; recomenda só área e responsável, sem cadeia de gestores. |
| 2026-11-12 | `conexus-g4os-memory-study` | decidido | [0064](../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md) | O G4 OS guarda a memória da pessoa em fichas que ela confirma, e a da empresa em documentos com pedido de mudança; a pessoal nunca vira fato da empresa. |
| 2026-11-12 | `conexus-company-flow-study` | aberto | - | ERPNext e Odoo guardam estado por documento com ligações; só o Palantir Machinery modela processo, guardando log de mudanças; o fluxo da empresa ficou como etapa seguinte. |
| 2026-11-12 | `conexus-brain-study` | decidido | [0064](../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md); [0065](../decisions/0065-brain-on-mastra-knowledge-behind-our-isolation.md) | A Ontologia entra logo depois do Sync, o aprendido da empresa passa por aprovação, e documentos usam só busca por palavra no Brasil. |
| 2026-11-12 | `conexus-brain-lifecycle-study` | decidido | [0064](../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md); [0065](../decisions/0065-brain-on-mastra-knowledge-behind-our-isolation.md) | O dono aprova a primeira revisão da Ontologia; a implantação propõe e revisa como administradora convidada, sem papel novo. |
| 2026-11-12 | `conexus-brain-intake-study` | decidido | [0064](../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md) | O intake pergunta só o que vale para a empresa inteira e deixa as regras de cada área para a primeira demanda. |
| 2026-11-12 | `conexus-brain-discovery-study` | decidido | [0064](../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md) | O dono aprova sozinho a primeira proposta da Ontologia, com inventário automático e rascunho do Builder; a equipe acompanha sem acesso. |
| 2026-11-10 | `conexus-unity-catalog-study` | superado, por [0078](../decisions/0078-how-the-lake-knows-who-reads.md) | - | O Unity Catalog gerenciado aplica a regra no motor; o aberto só entrega a tabela inteira; provou que um app com SQL livre troca o set_config e lê vendas alheias. |
| 2026-11-04 | `conexus-mastra-knowledge-study` | decidido | [0065](../decisions/0065-brain-on-mastra-knowledge-behind-our-isolation.md) | O Knowledge do Mastra é alfa e não garante isolamento entre áreas; no teste com duas empresas, a segunda não viu nada da primeira. |
