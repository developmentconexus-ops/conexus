# Trilha Dados

O fundador, em 2026-11-14, ao parecer do conselheiro de produto: "1A. Duas trilhas" e "2A. Catálogo
primeiro, Ontologia por cima". Esta página não é um cartão de etapa (delivery L5). Ela diz o que
a trilha possui, qual é o primeiro marco e como a outra trilha conversa com ela. Os marcos, em ordem,
estão no [roteiro](../../roadmap.md).

## O que a trilha entrega, e para quem

A trilha Dados entrega para a trilha Agentes e Apps e para a pessoa que liga os sistemas da empresa.
Ela é dona do contrato de acesso e mede o sucesso em sistemas reais que passam na mesma prova.

## O primeiro marco

| Marco | O que a pessoa vê | Pronto quando |
| --- | --- | --- |
| **`D1`. O primeiro sistema de catálogo** | Liga o HubSpot ou o Gmail pela tela do Conexus, sem colar chave | Numa empresa de teste, a conexão nasce pelo login do nosso kit. O Construtor lê. Uma escrita mostra o cartão. Sankhya e Mercado Livre seguem funcionando. As duas perguntas abertas do estudo de custo estão respondidas com a conta grátis |

Antes de `D1`, as duas trilhas desenham juntas o contrato, uma vez: um arquivo com os três verbos e um
teste de conformidade verde contra um conector falso. Esse arquivo é de outra tarefa. Depois de `D1`, a
trilha segue o método leve da fila do molde (delivery L27).

## O cartão de hoje

O cartão desta trilha em `docs/steps/` é `a-ontologia-da-empresa.md`, a Ontologia da empresa. Ele
espera o estudo do contrato, que decide o destino do PR 1030: o inventário passa a ler do catálogo,
ou o PR entra como está. O primeiro marco a construir é `D1`.

## O que a trilha possui

- `packages/connectors/`, o nosso kit de conectores.
- `apps/server/src/hub/connectors/`, `apps/server/src/hub/copies/` e `apps/server/src/hub/ontology/`.
- `apps/server/src/builder/copy-clock/` e `apps/server/src/platform/copy-sql.ts`.
- As telas de Integrações, Dados (que toma o lugar de Cópias, resposta E1a) e Conhecimento.
- O contrato de acesso, com o teste de conformidade dele.

A Plataforma (identidade, Projetos, publicação, `apps/server/src/platform/` menos `copy-sql.ts`, e
`apps/edge/`) não é trilha. É manutenção: um defeito ali entra na frente da fila da trilha que o
achou (delivery L4). Toda pasta que nenhuma página de trilha nomeia é da Plataforma.

## A interface: o contrato de acesso

O Assistente, o Builder, os agentes da empresa e os apps publicados chegam ao dado da empresa por um
contrato só, com três verbos. Ele virá num arquivo de `packages/hub-api/`, com o teste de
conformidade, em outra tarefa.

| Verbo | O que responde | De onde vem |
| --- | --- | --- |
| **Descrever** | Quais sistemas estão ligados, quais tabelas e ações existem, o que cada coluna significa, quando cada cópia rodou e se foi parcial | Um catálogo que a plataforma monta sozinha de cada cópia. A Ontologia acrescenta o significado aprovado por cima |
| **Ler** | Linhas | Do banco da empresa quando há cópia. Do sistema ao vivo quando não há. Quem decide é o contrato, pelo catálogo, nunca uma frase de prompt |
| **Agir** | O resultado de uma escrita ou de uma ação ao vivo | Sempre pelo funil de escrita, com o cartão de aprovação |

Ler não espera a Ontologia. A Ontologia continua a única fonte de significado (decisão
[0064](../../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md)), e um sistema
ligado hoje já serve pelo catálogo.

Uma regra do `dependency-cruiser` virá com o arquivo do contrato e proibirá a trilha Agentes e Apps
de importar de dados qualquer coisa que não seja o contrato.

## A spec da camada de dados

A spec do armazenar e do interagir, no formato do Kiro (`requirements.md`, `design.md` e `tasks.md`
por parte), está em [dados-spec/](dados-spec/README.md). Ela cobre as partes 1 a 4: o dado guardado e
o catálogo, o conector, a leitura para análise e a governança mínima. O fundador aprovou o escopo
em 2026-11-14 ("Aprovado", E1a a E5a) e respondeu às três perguntas da spec: P1 ("P1 OKAY"), P2 ("P2
Okay") e P3, a fonte única de conectores, o kit (decisão
[0069](../../decisions/0069-connectors-one-source-the-kit.md)). A entrada conversada entra pelo
cartão em rascunho do PR 982 (E2a). A consulta fica visível a quem lê a tabela, recolhida (E3a). O
Registro de dados é do dono e do administrador, sem prazo por ora (E4a), e o documento do cliente não
fica na cópia (E5a).

## Como a outra trilha pede uma mudança no contrato

1. A trilha Agentes e Apps abre uma issue com o rótulo `contrato`. A issue diz o que a pessoa veria,
   qual verbo muda e traz um exemplo.
2. A trilha Dados responde com um pull request pequeno que muda só o contrato e o teste de
   conformidade.
3. O consumidor entra depois, em outro pull request da trilha Agentes e Apps.

## Os sistemas de `D3`

Os dez sistemas de `D3` saem da antiga fila do molde (2026-10-30: "1. Sim 2. Sim 3. Sim"). Há uma
fonte só de conectores, o nosso kit (decisão
[0069](../../decisions/0069-connectors-one-source-the-kit.md)). A Fábrica de conectores gera
declarações do kit, escritas pela IA a partir da documentação do sistema e conferidas com uma leitura
de teste.

1. Os sistemas das quatro empresas.
2. Bling, Omie (login por chave fixa) e Conta Azul, todos declarações do kit.
3. Shopee, Nuvemshop, Google Sheets, NF-e recebida, extratos de banco. A Jet (20.3) quando alguém a
   usar.

Em espera: 19.2 Central de Ajuda.

## O Brain e a Ontologia, depois de `D4`

A ordem de 2026-11-12 (`"A1 B1 C1"`, `"E1"`, `"F1"`, "D Aprovado", `"H1"`, `"I1"`, "1. A"; decisões
[0064](../../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md),
[0065](../../decisions/0065-brain-on-mastra-knowledge-behind-our-isolation.md) e
[0067](../../decisions/0067-ontology-metamodel-palantir-core-roles-and-named-links.md)). A Ontologia
da empresa, o item 1, tem cartão em `docs/steps/` e passa a ler do catálogo em `D4`. Os itens 5 a 7 são
consumidos pela trilha Agentes e Apps.

1. **A Ontologia da empresa**: os conceitos de cada demanda, provados e aprovados na página Conhecimento.
2. **O fluxo da empresa**: os estados e as passagens, lidos dos documentos ou do histórico; entre dois sistemas, sem ligação.
3. **A saúde da Ontologia**: a prova refeita todo dia e o aviso no Início.
4. **Ligações e duas fontes**; sobe antes da saúde se o próximo cliente tiver dois sistemas no fluxo principal.
5. **O Brain do Builder e dos Projetos**, com o Mapa da página Conhecimento ("2 Okay").
6. **A entrada conversada**, o onboarding que aprende o começo: "quando tiver definido a ontologia, o brand".
7. **Os agentes da empresa nos dois**, com a Capacidade 6.
8. **Fontes de conhecimento**: arquivos, depois pastas por conector.
9. **A revisão semanal**, que só propõe.
10. **A busca por significado**, quando a medida pedir.
