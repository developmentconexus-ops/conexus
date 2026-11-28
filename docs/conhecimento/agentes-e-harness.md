# Agentes e harness

O Assistente, o Supervisor, os agentes do Projeto, a ficha de cada agente, as ferramentas, a escrita
com aprovação, os gatilhos, o rastreio e as evals. O código dessa frente saiu do `main` na
remoção do harness antigo; o que está aqui é o histórico do que se decidiu. O Builder tem página própria,
[Builder](builder.md).

## Decidido

- [0027](../decisions/0027-mastra-builder-engine.md): o Mastra é o motor do Builder e dos agentes; o motor da execução é nosso.
- [0050](../decisions/0050-conversation-on-the-agent-controller.md), aceito em 2026-10-19: a conversa no controlador de agente do Mastra, a fila em dois
  processadores.
- [0061](../decisions/0061-turn-carries-its-activation-as-a-scope.md), aceito em 2026-11-08: o turno leva a sua ativação como escopo do agente do Mastra.
- [0062](../decisions/0062-a-write-declares-its-provider-facts.md), aceito em 2026-11-08: a escrita declara o que só o fornecedor sabe.
- [0068](../decisions/0068-mastra-tracing-in-its-own-database.md), aceito em 2026-11-13: o rastreio nativo do Mastra, no banco do Mastra. Substituiu a [0052](../decisions/0052-one-tracing-path-builder-to-grafana.md).
- [0054](../decisions/0054-model-defaults-and-served-models.md) e [0059](../decisions/0059-assistant-machine-reaches-package-registries.md): os modelos padrão e a máquina do Assistente que chega aos registros de pacotes.
- Aprovações: [um-escopo-e-a-fabrica-de-ferramentas](../approvals/um-escopo-e-a-fabrica-de-ferramentas.md),
  [uma-ficha-por-agente](../approvals/uma-ficha-por-agente.md) (fechada: no ar de v0.24.111 a v0.24.116, usada pelo fundador em 2026-11-23, https://github.com/developmentconexus-ops/conexus/pull/1288),
  [e241-supervisor](../approvals/e241-supervisor.md),
  [e243-agentes-do-projeto](../approvals/e243-agentes-do-projeto.md),
  [e245-os-agentes-escrevem](../approvals/e245-os-agentes-escrevem.md),
  [papeis-da-empresa](../approvals/papeis-da-empresa.md) e as do Assistente
  ([alinhamento](../approvals/assistente-alinhamento-do-assistente.md),
  [dia a dia](../approvals/assistente-o-assistente-do-dia-a-dia.md),
  [texto fixo](../approvals/assistente-o-texto-fixo-do-assistente.md)).

## Provado

| O que | O número | Estudo |
| --- | --- | --- |
| A chamada perdida na aprovação automática | defeito do Mastra: a suspensão gravada duas vezes, com carimbos diferentes, gera um falso "já retomado" | `conexus-mastra-race-rca` |
| O arquivo enviado ao Assistente | o `FileUploadProcessor` nativo grava na máquina e manda ao modelo só a nota com o caminho; provado com um PDF | `conexus-assistant-files-html-study` |
| O mermaid sob `style-src 'self'` | muda o desenho em 10 de 12 tipos, com 14 a 80 erros | `conexus-diagram-csp-study` |
| A variação de uma eval | até 15% entre rodadas iguais | `conexus-lab-metodo-evals` |
| O canal do Telegram do Mastra | rodou com Telegram e modelo falsos | `conexus-e247-card` |
| A auditoria de arquitetura | nenhuma violação de dependência em 2.030 módulos; 0,35% de código clonado | `conexus-architecture-audit` |

## Lido

- `@mastra/core` 1.79, 1.82 e 1.83, `@mastra/memory` 1.41, Mastra Code e Factory (`mastra@6e8dfcb8`
  e `mastra@d60ba71b`): a base dos quatro agentes é nativa, a montagem não
  (`conexus-ia-harness-redesenho`, `conexus-harness-estudo-2`).
- Claude Code (`claude-code@0ed9469`): cinco hábitos públicos explicam a qualidade
  (`conexus-claude-code-harness-study`). Codex (`openai/codex@970111f6`) e G4 OS: um agente só, com
  prompt grande (`conexus-session-ecosystem-study`).
- Stripe e AWS: a chave e o hash da escrita são gravados antes do envio, nunca repetição cega
  (`conexus-e245-write-refs`).
- Activepieces, n8n, Kestra, Zapier, Composio, Nango e Pipedream: nenhum liga webhook e polling num
  gatilho só; a deduplicação mora no motor (`conexus-t2-study`).
- AgentCore da AWS: não agora (`conexus-bedrock-study`).

## Superado

- O caminho de rastreio da [0052](../decisions/0052-one-tracing-path-builder-to-grafana.md): a [0068](../decisions/0068-mastra-tracing-in-its-own-database.md) pôs o rastreio no banco do Mastra.
- O desenho de passos com código (`conexus-code-steps-study`): a etapa 24.6 está congelada.

## Aberto

- A etapa 24.6, workflows e automações, está congelada no [roteiro](../roadmap.md): os gatilhos
  (`conexus-triggers-study`, `conexus-t2-study`), o `conexus-e246-card` e a escrita pela ferramenta de
  código (`conexus-code-tool-writes`) esperam por ela.
- A rodada de uma automação chega ao modelo como se a pessoa tivesse digitado; o Mastra 1.79 tem
  `session.sendSignal` com a origem da mensagem. Conferir na versão instalada quando a 24.6 descongelar
  (`conexus-automation-run-study`, 2026-11-02).
- A etapa 24.7, o agente no Telegram (`conexus-e247-card`).
- Voltar e Ramificar uma conversa (`conexus-rewind-analysis`): duas perguntas ao fundador.
- A causa da falha do observador da memória pelo CLIProxy (`conexus-assistant-om-gemini`).

## Estudos de origem

Uma linha por estudo, da data mais nova para a mais velha. "Virou" é o registro, a aprovação, o cartão ou o PR em que o estudo deu.

| Data | Estudo | Estado | Virou | Em uma frase |
| --- | --- | --- | --- | --- |
| ? | `conexus-assistant-om-gemini` | aberto | - | O observador da memória falhou em todo turno pelo CLIProxy; a conversa chegou a 215,8 mil tokens; a causa do observador ficou por provar. |
| 2026-11-23 | `conexus-1275-revisao` | em curso | PR 1275; [uma-ficha-por-agente](../approvals/uma-ficha-por-agente.md) | Revisão da U4 (o agente salvo na ficha) sem relatório; só os logs dos testes e das mutações. |
| 2026-11-22 | `conexus-harness-ficha-cartao` | decidido | PR 1254; [uma-ficha-por-agente](../approvals/uma-ficha-por-agente.md) | Cartão Uma ficha por agente: oito unidades em sete PRs, 18 critérios, só servidor; a prova é o pedido de cada agente ao modelo igual byte a byte. |
| 2026-11-22 | `conexus-harness-estudo-2` | decidido | [uma-ficha-por-agente](../approvals/uma-ficha-por-agente.md) | Os quatro agentes rodam na mesma peça do Mastra, mas cada um se monta à mão; proposta: uma ficha por agente e uma montagem só; nomes na etapa 2. |
| 2026-11-22 | `conexus-harness-estudo` | superado, por conexus-harness-estudo-2 | - | Parou num reinício do ambiente antes de escrever qualquer coisa; continuou em outra pasta. |
| 2026-11-16 | `conexus-lab-metodo-evals` | decidido | skill conexus-eval | Eval é experimento: gabarito do estado final, nota por código antes do juiz, várias tentativas e intervalo pareado; até 15% de variação entre rodadas iguais. |
| 2026-11-16 | `conexus-ia-harness-redesenho` | decidido | [um-escopo-e-a-fabrica-de-ferramentas](../approvals/um-escopo-e-a-fabrica-de-ferramentas.md) | A base dos quatro agentes é nativa, a montagem não: seis formas de dizer de quem é a execução, quatro políticas de aprovação; MCP para fora depois, para dentro não. |
| 2026-11-16 | `conexus-ferramentas-unicas-estudo` | decidido | [um-escopo-e-a-fabrica-de-ferramentas](../approvals/um-escopo-e-a-fabrica-de-ferramentas.md) | Cada agente lista as conexões do seu jeito sem razão de produto; só data_describe passava pela porta hub/access; proposta: uma fábrica monta as ferramentas de todos. |
| 2026-11-14 | `conexus-folder-structure-study` | decidido | resposta do fundador A1 (2026-11-14) | O que deixa um agente novo entrar sem mexer nos outros é o kit, não a pasta; o fundador escolheu A1: o módulo vira agents/, cada agente numa pasta irmã. |
| 2026-11-14 | `conexus-architecture-decision-board` | decidido | palavras do fundador 2026-11-14 | O fundador aceitou todas as recomendações da auditoria: Ontologia como fonte de significado, modos plano e conversa, Knowledge do Projeto e um Estúdio no Projeto. |
| 2026-11-14 | `conexus-architecture-audit` | decidido | conexus-architecture-decision-board | Nenhuma violação de dependência em 2030 módulos e 0,35% de código clonado; quatro perguntas ao fundador e quatro passos técnicos. |
| 2026-11-12 | `conexus-rewind-analysis` | aberto | - | Voltar e Ramificar como uma primitiva só do núcleo da conversa, pelo cloneThread do Mastra limpando a memória observacional do clone; duas perguntas ao fundador seguem abertas. |
| 2026-11-11 | `conexus-diagram-csp-study` | decidido | [assistente-o-assistente-do-dia-a-dia](../approvals/assistente-o-assistente-do-dia-a-dia.md) | Sob style-src 'self' o mermaid.render muda o desenho em 10 de 12 tipos, com 14 a 80 erros; nenhuma opção nativa resolve; referências afrouxam a CSP ou trocam de desenhador. |
| 2026-11-11 | `conexus-claude-code-harness-study` | decidido | [assistente-alinhamento-do-assistente](../approvals/assistente-alinhamento-do-assistente.md) | A qualidade do Claude Code vem de cinco hábitos públicos: pedido em camadas, ferramenta que devolve pouco, subagente, frase simples e ajuste medido. |
| 2026-11-11 | `conexus-assistant-diagnostic` | decidido | [assistente-alinhamento-do-assistente](../approvals/assistente-alinhamento-do-assistente.md); [assistente-o-texto-fixo-do-assistente](../approvals/assistente-o-texto-fixo-do-assistente.md) | Um Agent do Mastra só, num AgentController, resolvido a cada execução por empresa, pessoa e lugar, com máquina E2B por conversa. |
| 2026-11-11 | `conexus-assistant-align-tools` | decidido | [assistente-alinhamento-do-assistente](../approvals/assistente-alinhamento-do-assistente.md) | Fontes da pesquisa numa lista abaixo da mensagem e busca na web só do provedor do modelo por agora. |
| 2026-11-11 | `conexus-assistant-align-ctx` | decidido | [assistente-alinhamento-do-assistente](../approvals/assistente-alinhamento-do-assistente.md) | Contexto do Assistente: cinco ajustes pequenos sem decisão e a escolha do escopo da memória entre conversas, que o fundador respondeu. |
| 2026-11-11 | `conexus-assistant-align-conn` | decidido | [assistente-alinhamento-do-assistente](../approvals/assistente-alinhamento-do-assistente.md) | Conectores e máquina do Assistente: nada pede decisão nova; a cópia durável dos arquivos, se reaberta, vai do Hub ao R2. |
| 2026-11-10 | `conexus-assistant-files-html-study` | decidido | [assistente-o-assistente-do-dia-a-dia](../approvals/assistente-o-assistente-do-dia-a-dia.md) | O FileUploadProcessor nativo grava o arquivo na máquina e manda ao modelo só a nota com o caminho; provado com um PDF. |
| 2026-11-09 | `conexus-write-return-study` | decidido | [e245-os-agentes-escrevem](../approvals/e245-os-agentes-escrevem.md) (emenda, PR 915) | As plataformas mandam a resposta crua ao agente, sem tabela de erros por conector; o nosso erro era assimetria: o modelo nada via quando o Hub não sabia ler. |
| 2026-11-08 | `conexus-turn-version-arch` | decidido | [0061](../decisions/0061-turn-carries-its-activation-as-a-scope.md) | O turno diz ao Mastra a versão e quem a ativou, pelos scopes da execução, e o Mastra os devolve até o fim, sem o remendo do PR 852. |
| 2026-11-08 | `conexus-t2-study` | aberto | - | Nenhuma plataforma liga webhook e polling juntos num gatilho; a deduplicação mora no motor e ninguém confia só no webhook; o fundador escolheu `T2` c; 24.6 congelada. |
| 2026-11-08 | `conexus-e247-card` | aberto | - | O Mastra tem o canal do Telegram pronto, medido com Telegram e modelo falsos; a pessoa se liga pelo link t.me com código (A1); a etapa 24.7 espera. |
| 2026-11-08 | `conexus-e211-card` | decidido | [0068](../decisions/0068-mastra-tracing-in-its-own-database.md) | Corrigiu a premissa da [0052](../decisions/0052-one-tracing-path-builder-to-grafana.md): o passo a passo fica no banco do Mastra, sem texto, mais o Grafana no Brasil; o fundador escolheu A2, B1 e E1. |
| 2026-11-08 | `conexus-code-tool-writes` | aberto | - | A ferramenta de código grava pedindo ao Hub por data.write, pelo mesmo funil de toda escrita; a versão declara escritas e teto; cartão próprio depois da 24.6.1, decisões pendentes. |
| 2026-11-08 | `conexus-code-steps-study` | superado, por 24.6 congelada (docs/roadmap.md) | - | Um balão nunca guarda código: mapping e Se nativos do Mastra, cálculo por ferramenta de código, leitura por conector e escrita pelo funil. |
| 2026-11-07 | `conexus-triggers-study` | aberto | - | O conector declara o que pode avisar; o motor guarda o cursor, deduplica e roda a cadência; a agenda do Mastra 1.82 dispara a volta; a 24.6 congelou. |
| 2026-11-07 | `conexus-obs-agents-study` | decidido | [0068](../decisions/0068-mastra-tracing-in-its-own-database.md) | Recomenda uma linha do tempo por turno que junte o rastro do agente com o que só o Hub sabe, como aprovação e escrita, com o conteúdo das ferramentas. |
| 2026-11-07 | `conexus-mastra-tracing-study` | decidido | [0068](../decisions/0068-mastra-tracing-in-its-own-database.md); [pattern-o-rastreio-do-mastra](../approvals/pattern-o-rastreio-do-mastra.md) | O rastreio nativo do Mastra traz árvore completa com tokens e custo estimado e estava desligado pela [0052](../decisions/0052-one-tracing-path-builder-to-grafana.md); o estudo pôs a escolha em opções. |
| 2026-11-07 | `conexus-e246-card` | aberto | - | No Mastra 1.82 workflow estático e dinâmico viram o mesmo grafo; o fundador escolheu A1, D1, E1, F2a, G1 e H1, mas a etapa 24.6 está congelada. |
| 2026-11-07 | `conexus-e245-write-refs` | decidido | [e245-os-agentes-escrevem](../approvals/e245-os-agentes-escrevem.md) | O registro connector_write segue Stripe e AWS: chave e hash gravados antes do envio, nunca repetição cega; o Mastra 1.82 pode rodar a ferramenta de novo numa retomada. |
| 2026-11-06 | `conexus-mastra-race-rca` | decidido | [papeis-da-empresa](../approvals/papeis-da-empresa.md) | A chamada perdida na aprovação automática é defeito do Mastra: a suspensão gravada duas vezes com carimbos diferentes gera um falso já retomado. |
| 2026-11-06 | `conexus-agent-tools-one-list` | decidido | [papeis-da-empresa](../approvals/papeis-da-empresa.md) (E4) | Ferramentas é o único lugar onde o agente recebe as leituras de um conector; a seção Ligações duplicava o acesso. |
| 2026-11-03 | `conexus-bedrock-study` | aberto | - | O Conexus não deve rodar no AgentCore nem usar Gateway, Identity e Policy como serviço agora; modelos pelo Bedrock só depois. |
| 2026-11-02 | `conexus-construtor-study` | decidido | [e243-agentes-do-projeto](../approvals/e243-agentes-do-projeto.md) | O agente do Construtor fica guardado como dados com versões, cada uma vira um Agent do Mastra; o fundador escolheu A1, `C1`, D1, E1 e pediu estudo para B. |
| 2026-11-01 | `conexus-mastra-solutions-study` | decidido | [e243-agentes-do-projeto](../approvals/e243-agentes-do-projeto.md) | As páginas Solutions do Mastra são vitrine; seis templates servem de referência, e os agentes das empresas seguem como fichas rodando no Hub. |
| 2026-10-31 | `conexus-session-ecosystem-study` | decidido | [e241-supervisor](../approvals/e241-supervisor.md) | A sessão do G4 é um agente só, com prompt de 120 KB e 35 ferramentas, contexto em arquivos de texto; compara Claude Code, Codex e Mastra para o Conexus. |
| 2026-10-31 | `conexus-assistant-harness-study` | decidido | [e241-supervisor](../approvals/e241-supervisor.md) | Não é preciso harness nova: o mesmo motor duas vezes, com texto, ferramentas e máquina próprios, não um modo do Builder. |
| 2026-10-30 | `conexus-agents-structure` | decidido | [e241-supervisor](../approvals/e241-supervisor.md); [e243-agentes-do-projeto](../approvals/e243-agentes-do-projeto.md) | O Início vira a conversa da empresa com um Supervisor; agentes e workflows moram no Projeto, mesmo sem app (E1, F4, G1, J1, K2). |
