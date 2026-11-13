# O texto fixo do Assistente, no molde das referências

Trilho: assistente

Cartão curto, fora da ordem do roteiro. O pedido do fundador, em 2026-11-12: "E já vamos mudar o
sistema prompt do assistente, mesmo que não é o final. Vamos mudar ele. Eu quero uma coisa bem mais
parecida com aquele system prompt leaks. [...] Ele tem que investigar, não assumir, tem que saber onde
está como usar as tools sobre conexus, mas não quero que invete como vai escrever quero que siga o
padrão dessas referencias, somente adicionando do conexus mas mesma maneira de escrever e orientar o
assistente, sem deixar ele frouxo. tem que agir como especialista, fatos evidencias ser pro ativo] e
ter o especifoc do codex como mastra code e factory tem". Ele se apoia no pull request
https://github.com/developmentconexus-ops/conexus/pull/996 (o Assistente no Luna não desiste na
primeira falha de leitura), que já trouxe o `instructions` de agente para os modelos da OpenAI. As
referências foram lidas em: `mastra-1.82@6e8dfcb8` (o `@mastra/core` instalado, o Mastra Code e o
Mastra Factory em `mastracode/`), `codex@970111f`, e os textos de sistema publicados de Anthropic,
OpenAI, Cursor, Perplexity e Notion na pasta de estudo (fora do repositório; na tabela, `L/`). Esses
últimos ensinam só a forma: nenhuma frase deles entra aqui. O texto do Codex e o do Mastra são
Apache-2.0; o nosso usa palavras próprias no mesmo molde.

## A página do fundador

**No fim desta etapa** você pergunta ao Assistente, no ChatGPT, algo que pede várias leituras, e ele
investiga em vez de supor: lê a skill do Sankhya e o caderno da conexão antes de confiar num código,
procura em mais de um lugar, refaz a leitura que falhou de outro jeito, confere o número antes de
dizer, e diz de onde ele veio. Ele só pergunta o que nenhuma leitura resolve, e antes de perguntar faz o
trabalho que não depende da resposta. O texto fixo passa a ter as seções que as referências têm, na ordem delas: quem ele
é, onde está, cada ferramenta e quando usar, como trabalha, evidência, autonomia, o que fazer quando
uma chamada falha, quando perguntar, como responder. E os modelos Luna, na assinatura do ChatGPT,
recebem um bloco próprio, escolhido pelo nome exato do modelo, no texto que acompanha toda chamada
dessa assinatura.

**O roteiro de uso.**

1. No Hub no ar, com o ChatGPT como modelo do Assistente e o Sankhya escolhido na conversa, pergunte:
   "Quanto tem de estoque em cada grupo de produto?".
2. Veja as ferramentas que ele usa: a skill do Sankhya, as leituras, o cálculo na máquina. Se uma
   leitura falhar, ele corrige e tenta outra via em vez de parar.
3. A resposta vem com o total por grupo e diz de onde cada número saiu; se faltar algo, diz o que
   faltou e o que tentou.
4. Numa conversa nova, pergunte "Quais os cinco produtos que mais venderam em setembro?" e confira
   que vêm os cinco, na ordem.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. No fim: faz o roteiro e
diz o que viu.

**Fica de fora.** O código das ferramentas e dos conectores, a escolha do modelo, a volta atrás na
conversa. O texto do Builder (sua palavra de 2026-10-31). Um bloco próprio para os modelos da
Anthropic: as referências não têm (o Mastra Code só tem blocos para modelos da OpenAI). Um bloco para
o Sol: a conta de avaliação não o atende, então não dá para medir.

**As decisões suas nesta etapa.** Nenhuma. Este texto ainda não é o final, como você disse.

**O que foi medido.** No Opus, o placar inteiro subiu de 11 para 18 certas em 25, e nenhuma pergunta
que acertava passou a errar. As que ganharam são as de vendas de setembro: antes o Assistente desistia
dizendo que o Sankhya se contradizia; agora lê o mesmo fato de outro jeito e responde. No ChatGPT
(Luna), a pergunta dos cinco mais vendidos falha antes e depois, nas seis vezes, pelo mesmo motivo: o
dublê do Sankhya recusa toda consulta escrita para o Oracle e devolve pedidos de outubro com o filtro de
setembro. A piora que a primeira medição mostrou não se repetiu na segunda, com o rastro de cada
chamada. A medição é sobre os dublês do Sankhya e do Mercado Livre, como a avaliação do repositório
roda; nenhum sistema real da empresa é lido. Os números estão na seção "A medição".

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | O texto fixo reescrito no molde das referências, o bloco por modelo do Luna escolhido pelo nome exato, os testes do contrato do texto | `apps/server/src/builder/assistant/`, `apps/server/src/builder/model-accounts/openai/`, `apps/server/src/builder/connectors/connector-tools.ts`, `apps/server/src/builder/connectors/connector-tools.test.ts`, `packages/connectors/src/sankhya/skill/SKILL.md` | testing | https://github.com/developmentconexus-ops/conexus/pull/996 |

**Orçamento de código alterado.** U1: cerca de 30 linhas de código em `models.ts` e 120 linhas de
texto em `assistant.md`, fora os testes.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | O texto fixo tem, nesta ordem, Who you are, Environment, Tools, How you work, Evidence, Autonomy and persistence, When a call fails, When to ask the person, How you answer, e continua sem ordens em maiúsculas | `assistant/instructions.test.ts`, "o texto novo: responder na mensagem, arquivo só quando pedido" | must |
| 2 | U1 | O texto fixo diz que ler é sempre permitido, que diante de uma leitura que falhou se faz o que o resultado dela diz, que uma recusa de acesso é a resposta, e o teste antes de perguntar; o resultado da leitura que falhou diz que ela não mostra recusa de acesso | o mesmo teste | must |
| 3 | U1 | O texto fixo continua os mesmos bytes para um dono e para um membro; o que o papel não permite segue no bloco da conversa | `assistant/instructions.test.ts`, "as frases de ferramenta vão no bloco, com o papel" | must |
| 4 | U1 | Uma chamada ao `gpt-6-luna` pela assinatura do ChatGPT leva o texto comum e depois o bloco `<autonomy_and_persistence>` do Luna; o `gpt-5.2` leva só o texto comum; um nome que só começa como o do Luna não leva o bloco | `model-accounts/openai/codex.test.ts`, "o bloco de cada modelo vai pelo id exato…" | must |
| 5 | U1 | O pedido ao Codex continua com `Autonomy and persistence` e `Reading is always allowed` no `instructions` | `model-accounts/openai/codex.test.ts`, "o pedido que sai" | must |
| 6 | U1 | No modelo de verdade, `openai/gpt-6-luna` e `anthropic/claude-opus-5-5` altos, P10 e P4 em três repetições cada, contadas as desistências e as chamadas, e o placar inteiro, antes e depois. Aberto: o depois do Luna, sem cota | o placar (`assistant.scorecard.test.ts`, com `CONEXUS_EVAL_REAL_MODEL`), números em "A medição" | should |

## A matriz de estados

Nenhuma tela nova nem mudada.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `instructions` do pedido ao Codex | `codexInstructions(name)`, `model-accounts/openai/models.ts` | o endpoint do ChatGPT |

## A tabela de falhas

Nenhuma escrita nova.

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Quem é, com o padrão do resultado | U1 | `assistant/prompt/assistant.md:1-3` ("colleague … has a computer") | `mastra-1.82@6e8dfcb8` `packages/core/src/coding-agent/prompt.ts:36`; `codex@970111f` `codex-rs/models-manager/models.json:524` (`gpt-6-luna`, `instructions_template`, linha 1 do molde, e "Personality" 3-5); `L/Notion/notion-ai.md:1-5`; `L/Perplexity/perplexity-search.md:3-5`; `L/Anthropic/claude-code/claude-code-opus-5.5.md:12-14` | Uma ou duas frases: o papel, com quem trabalha e até onde vai o trabalho; depois a postura (julgamento próprio, discorda com evidência) | nativo (texto) | — | "tem que agir como especialista" | — |
| Onde está | U1 | o bloco da conversa (`assistant/instructions.ts:100-121`), sem explicação no texto fixo | `prompt.ts:38-44` (`# Environment`, montado por pedido); `L/Anthropic/claude-cowork/claude-cowork.md:604-617`; `L/Perplexity/perplexity-search.md:99`, `:229-272` | O ambiente vem por pedido, e o texto fixo diz o que cada linha significa e o que o agente não vê | nativo (texto) | — | "tem que saber onde está" | — |
| Cada ferramenta, quando usar | U1 | espalhado: `assistant.md:29`, `:41`, `:62`, `:66`, `:70` | `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/prompts/tool-guidance.ts:25-30` (nomes exatos), `:167`, `:198`, `:209`, `:244` (um bloco `**nome** — para quê` por ferramenta); `L/Notion/notion-ai.md:498-515`; `L/Anthropic/claude-opus-5.5.md:1364-1368` (as ferramentas internas antes da web para dados da empresa) | Uma linha por ferramenta, com o nome exato, para quê e quando, e a ordem entre as fontes | nativo (texto) | — | "como usar as tools sobre conexus" | — |
| Como trabalha: entender, achar, ler, calcular, conferir, responder | U1 | `assistant.md:29` ("Check a number before you state it") | `mastracode/sdk/src/agents/prompts/build.ts:46-56` (o laço Understand, Implement, Verify, Prove); `prompt.ts:54-59` ("Start by Understanding"), `:116-119` (nunca adivinhar); `L/Anthropic/claude-for-excel.md:19-57` | Um laço numerado, um passo verificado antes do próximo | nativo (texto) | — | "Ele tem que investigar, não assumir" | — |
| Evidência | U1 | `assistant.md:29` (fonte da web, inferência) | `L/Anthropic/claude-for-excel.md:55-57` (relatar só o que conferiu; "todos" só se leu todos); `L/OpenAI/gpt-5.6-sol.md:1655` (o que a fonte não sustenta); `L/Perplexity/perplexity-search.md:133-145`, `:186`; `L/Anthropic/claude-cowork/claude-cowork.md:232-238` | Todo fato com a sua fonte, o que é inferência marcado, o que falta dito | nativo (texto) | — | "fatos evidencias" | — |
| Autonomia e persistência | U1 | `model-accounts/openai/models.ts:29-42` (só nos modelos da OpenAI, pelo pull request 996) | `codex@970111f` `models.json:524` (molde do Luna, "Autonomy and persistence", linhas 31-41); `codex-rs/core/gpt_5_2_prompt.md:29-31`, `:111`; `prompt.ts:125-158` ("Autonomy First") | Ir até o fim no mesmo turno, sem resposta parcial; agir com o padrão sensato e dizer o que supôs | nativo (texto) | — | "ser pro ativo", "sem deixar ele frouxo" | — |
| Quando uma chamada falha | U1 | `models.ts:33` (só OpenAI); `packages/connectors/src/sankhya/skill/SKILL.md:10` | `mastracode/sdk/src/agents/prompts/build.ts:69-76` ("Error Recovery": ler o erro inteiro, a causa, corrigir, rodar de novo, só depois explicar o bloqueio); `L/Anthropic/claude-code/claude-code-opus-5.5.md:21` (não repetir igual) | Passos numerados; a recusa de acesso é o fim | nativo (texto) | — | "ser pro ativo" | — |
| Quando perguntar | U1 | `assistant.md:68-70` ("# Questions") | `prompt.ts:139-171` (as quatro perguntas antes de perguntar; quando deve e quando não deve); `models.json:524` (molde do Luna, "When to ask the user for permission", 19-29, e "Working with the user", 49); `L/OpenAI/chatgpt-gpt-5-agent-mode.md:75-90`; `L/Anthropic/claude-for-excel.md:23-41` | Um teste curto antes de perguntar; perguntar só o que bloqueia, continuar o trabalho independente | nativo (texto) | — | "Ele tem que investigar, não assumir" | — |
| Como responder | U1 | `assistant.md:5-11` | `models.json:524` (molde do Luna, "Writing style" 7-17, "Final answer" 67-94); `prompt.ts:173-178`; `L/Perplexity/perplexity-search.md:177-206`; `L/Notion/notion-ai.md:360-427` | O resultado primeiro, palavras simples, um ponto por parágrafo, tabela para comparar | nativo (texto) | — | — | — |
| Bloco por modelo, pelo nome exato | U1 | `models.ts:29-42` (um texto só para todo modelo da OpenAI) | `mastracode/sdk/src/agents/prompts/model.ts:1-18` (`modelSpecificPrompts`, blocos para `openai/gpt-5.4` e `openai/gpt-5.5`, nenhum da Anthropic); `prompts/index.ts:146-148` (escolhido por id exato, com o provedor), `:207-213` (no prompt do agente, depois do texto do host); `codex@970111f` `models.json:177`, `:524` (um molde por modelo); `codex-rs/core/src/client.rs:1032-1040` | Um mapa do id exato do modelo para o seu bloco; o modelo sem bloco recebe só o texto comum | embrulhado: a escolha por id exato é a da referência, o lugar não. Aqui o bloco vai no `instructions` da assinatura do ChatGPT (`models.ts`), escolhido pelo nome sem provedor, antes do texto do Hub, que segue em `input`, e em toda chamada dessa assinatura: Assistente, Builder, Construtor, título, observador e refletor. Uma conta da OpenAI por chave de API não o recebe. Onde o bloco mora é decisão do fundador, pendente | o teste do id exato em `codex.test.ts` | "ter o especifoc do codex como mastra code e factory tem" | — |
| O resultado da leitura que falhou, dono único | U1 | `connectors/connector-tools.ts` (`failedRead`), `packages/connectors/src/sankhya/skill/SKILL.md:10` | `mastracode/sdk/src/agents/prompts/build.ts:69-76` (o agente lê o erro e corrige) | Uma regra, um dono: o resultado diz que a falha não mostra recusa de acesso e o que fazer; o texto fixo, o do ChatGPT e a skill mandam ler esse resultado (Fechamentos 3 e 4 da revisão do pull request 996) | nativo (texto) | — | — | — |
| O texto do produto acima do motor | U1 | `assistant/instructions.ts:20-25` (`conexus.md` e `assistant.md`, os mesmos bytes para todos) | `mastra-1.82@6e8dfcb8` `mastracode/factory/src/factory.ts:1464` (`hostInstructions`, o que o produto acrescenta ao agente do Mastra Code), `prompts/index.ts:205-209` | O produto acrescenta só o que é dele, sobre o mesmo molde | nativo | — | "somente adicionando do conexus" | — |

## U1 O texto fixo e o bloco por modelo

### As linhas da tabela

Todas as linhas da tabela de referência.

### O raio da mudança

| Arquivo | O que muda | Fora |
| --- | --- | --- |
| `apps/server/src/builder/assistant/prompt/assistant.md` | Reescrito nas seções das referências; as regras de antes que continuam valendo (arquivos, Builder, memória, caderno, automações, confiança) ficam com as mesmas frases | `conversation/prompt/conexus.md` (é do Builder também) |
| `apps/server/src/builder/model-accounts/openai/models.ts` | `codexInstructions(name)`: o texto comum e o bloco do modelo pelo id exato; o middleware é feito por modelo | o resto da ligação com o Codex |
| `apps/server/src/builder/connectors/connector-tools.ts`, `packages/connectors/src/sankhya/skill/SKILL.md` | A frase do resultado da leitura que falhou, dono único da regra; a skill manda ler esse resultado | o resto das ferramentas e do conector |
| `apps/server/src/builder/assistant/instructions.test.ts`, `apps/server/src/builder/assistant/prompt-tools.test.ts`, `apps/server/src/builder/model-accounts/openai/codex.test.ts`, `apps/server/src/builder/connectors/connector-tools.test.ts` | O contrato do texto novo, os nomes da seção Tools contra as ferramentas oferecidas, o bloco por modelo e a frase do resultado | — |

### Como se prova

Os testes dos critérios 1 a 5, `npm run typecheck`, `npm run lint`, e o placar do modelo de verdade
(critério 6), rodado pelo firstmate com a conta de avaliação, com os resultados guardados fora do
repositório.

### Parar se

Um critério só fica verde mudando o código de uma ferramenta ou de um conector: isso vai como nota no
pull request, não como código.

## A medição

O placar do modelo de verdade (`assistant.scorecard.test.ts` com `CONEXUS_EVAL_REAL_MODEL`), esforço
alto, sobre os dublês. "Antes" é o commit de antes da reescrita (`a360f4bc`). O "depois" de cada série diz
o commit medido: a primeira série do Luna, `fde69ba4` com duas linhas de `assistant.md` ainda sem
commit; o P4 e o P10 do Opus, `1d25d22f`; os placares inteiros e a segunda série do Luna, `4245bef3`.
A rodada de conserto da revisão do pull request 1002 mudou depois duas linhas do texto fixo (a linha das
conexões sem o rótulo do bloco, e as leituras tipadas no lugar de `connector_read`, que o Assistente não
tem) e não foi medida. As chamadas vêm dos eventos do turno
(`tool_start`), porque no ChatGPT as mensagens guardadas não trazem as chamadas (ver "Achados").
"Completa" é uma resposta com o ranking ou o total pedido; "desistiu" é "não consegui" sem ranking.

**ChatGPT, `openai/gpt-6-luna`, primeira série, três repetições, sem rastro.** O "depois" desta série
é a primeira versão do texto, sem a regra de leituras que se contradizem.

| Pergunta | Antes | Depois |
| --- | --- | --- |
| P4, cinco mais vendidos | 2 completas, 1 desistiu; 0 certas pelo juiz | 0 completas, 3 desistiram; 0 certas |
| P10, estoque por grupo | 2 completas, 1 desistiu; 0 certas | 2 completas, 1 desistiu; 0 certas |

O placar inteiro antes deu 3 certas em 24 (a 25ª parou no limite da conta). A conta de avaliação do
plano `go` respondeu então `429 usage_limit_reached`, e a do plano `free` também; a segunda série
rodou numa conta paga.

**ChatGPT, `openai/gpt-6-luna`, segunda série, três repetições, com o rastro de cada chamada.** O
"depois" é o texto final deste cartão.

| Pergunta | Antes | Depois |
| --- | --- | --- |
| P4, cinco mais vendidos | 0 certas, 3 desistiram; 14 a 43 chamadas | 0 certas, 3 desistiram; 26 a 47 chamadas |
| P10, estoque por grupo | 0 certas; 22 a 29 chamadas | 1 certa; 28 a 52 chamadas |

**O placar inteiro no Luna, uma rodada.** Antes (primeira série): 3 certas em 24 (P18, P20, P22). Depois,
com o texto final: 7 certas em 25 (P8, P11, P21 a P25). P18 e P20 acertaram antes e erraram depois;
P8, P11, P21, P23, P24 e P25 o contrário. Uma rodada de cada lado, então a troca de perguntas mostra o
quanto o Luna varia de uma rodada para outra; o placar não piorou.

**Claude, `anthropic/claude-opus-5-5`, três repetições.**

| Pergunta | Antes | Depois |
| --- | --- | --- |
| P4, cinco mais vendidos | 0 completas, 3 desistiram; 21 a 23 chamadas | 1 completa, 1 desistiu, 1 parou no meio do trabalho sem resposta final; 28 a 37 chamadas |
| P10, estoque por grupo | 3 certas; 18 a 23 chamadas | 2 certas, 1 errada; 25 a 29 chamadas |

**O placar inteiro no Opus, uma rodada.** Antes: 11 certas em 25 (P8, P10, P11, P13, P18, P20 a P25),
249 chamadas. Depois: 18 certas em 25 (P1 a P8, P10, P11, P13, P18, P20 a P25), 269 chamadas. Nenhuma
pergunta certa antes ficou errada depois. As sete que mudaram (P1 a P7) são as de vendas de setembro:
antes, nas sete, o Opus diz que o Sankhya devolve dados que se contradizem e desiste; depois, lê o mesmo
fato de outro jeito e responde com o número. Uma rodada só, então a diferença de uma pergunta pode ser
acaso; a de sete, na mesma família, não parece. O que dispara a regra nessas sete são defeitos do
próprio dublê: os grupos com nomes diferentes entre a leitura pronta e a tabela, e pedidos de outubro
com o filtro de setembro. O ganho mede em parte o contorno de um dublê que se contradiz, pode encolher
quando o dublê for consertado, e não foi medido no Sankhya de verdade.

**O que o rastro prova sobre o P4.** A porta de consulta do dublê recusa toda consulta com sintaxe do
Oracle: `SELECT 1 FROM DUAL`, `TO_DATE`, `TO_CHAR`, `ROWNUM` e `FETCH FIRST` voltam `ORA-00933`, porque
o dublê roda SQLite. Na segunda série do Luna, cada rodada do P4 teve de 4 a 7 consultas recusadas, de
5 a 7 antes e de 4 a 6 depois, e a leitura pronta de pedidos devolveu linhas de 1º de outubro com o
filtro de setembro em cinco das seis rodadas. As seis respostas desistem, e as que dizem por quê citam uma das duas coisas.
Provado: o P4 do Luna falha pelo dublê, antes e depois. Refutado: a hipótese de que o texto novo faz o
Luna escrever mais SQL do Oracle. A piora da primeira série (2 completas para 0) não se repetiu, e as
duas "completas" de antes traziam um produto só e foram julgadas erradas. No Opus, o mesmo dublê
derruba o P4 antes; depois, o Opus lê o erro, isola a parte recusada, traz as linhas sem filtro e
filtra na máquina, que é o comportamento que o texto pede.

**Achados fora deste cartão.** O dublê do Sankhya se contradiz: a leitura pronta de grupos dá "Grupo
Um/Dois" e a tabela da porta de consulta dá PADARIA, MERCEARIA e BEBIDAS; a leitura pronta de pedidos
devolve 1º de outubro com o filtro de setembro; a porta de consulta só aceita SQL do SQLite, onde o
Sankhya de verdade é Oracle. E `scoreOf` conta as chamadas pelas partes das mensagens, que no ChatGPT
não as guardam.
