# Alinhamento do Assistente

Trilho: assistente

O fundador, em 2026-11-11, depois de ler o diagnóstico técnico do Assistente: "Viu nessa análise do
assistente para o System Prompt vimos gaps de má implementação nossa que poderia ser melhor. Como a
parte da de Ferramentas, por exemplo, contexto, conectores, máquina e web. Então queria analisar
baseado em referencias, repositórios e /mastra para verificar de alinhar isso profundamente antes de
seguir." Três estudos traçaram as referências (fora do repositório, base `6b36487f`): Ferramentas e
web, Contexto e instruções do sistema, Conectores e máquina. Aos onze itens de engenharia que o
firstmate somou deles: "Proposta sua concordo". Às escolhas de memória e de busca, no mesmo dia: "1.
B e D 2. B e C 3. A gente via implementar o Knowledge que é um grande passo nosso e acho que já teria
que vir, por exemplo 4. A". Depois, ao ler o estudo do harness do Claude Code (como o Claude Code
monta o seu agente, fora do repositório, base `7c8b156f`), sobre o ajudante de pesquisa, quem escreve
as perguntas da prova e os itens novos: "A1, porém estudar profudanmente vendo referencias e
documentação usar context7 /mastra e o que precisar B2 Sim inclua vamos deixar nossa harness o mais
alinhada possivel".

É o segundo cartão do trilho do Assistente (delivery L1). Espera no seu rascunho até O Assistente do
dia a dia fechar (L5); o roteiro de cima segue o fluxo da construção dos apps, que não muda. Cada linha
do `main` citada foi lida em `7c8b156f` (com o PR 963 no `main`), com `@mastra/core` 1.82.0,
`@mastra/memory` 1.41.0, `@mastra/pg` 1.35.0, `@mastra/e2b` 0.16.1, `ai` 6.0.309,
`@ai-sdk/anthropic` 3.0.133, `@ai-sdk/openai` 3.0.130 e `better-auth` 1.7.8. A prateleira:
`mastra-1.82@6e8dfcb8` (Mastra Code e Factory em `mastracode/`), `codex@970111f`,
`librechat@e6567c7`, `open-webui@f7ac7ee`, `lobe-chat@c29ef407`, `assistant-ui@437b410`,
`activepieces@f34c43cd`, `supabase-mcp@5ab9a98`, `nango@e6c6131`, `cloudflare-agents@786d30e3`,
`vibesdk@9da158d`, `claude-code@0ed9469` (o CHANGELOG), e os tipos públicos do
`@anthropic-ai/claude-agent-sdk@0.3.322` com as páginas públicas de code.claude.com lidas em
2026-11-11 (salvas pelo estudo do harness; na tabela, `D/` é essa pasta, `docs-2026-11-11/`). O Context7 `/mastra-ai/mastra` lê o `main` do Mastra, não
a 1.82: serve só para conferir a doc instalada, e conferiu (`maxSteps` padrão 50, `resolveSubagentModel`
com a cópia do contexto).

## A página do fundador

**No fim desta etapa** o Assistente segue as instruções que a empresa escreveu, sabe quem você é
(cargo, área e o que aprendeu com você), lembra o que a empresa guardou e o que você conversou em
outras conversas, mostra as fontes de uma pesquisa na web, lê um PDF de um link, e os arquivos de uma
conversa não somem mais quando o Conexus é atualizado. Você vê e corrige na tela tudo o que ele
guarda. Cada comando que ele roda na máquina aparece numa frase em português, e não no comando cru;
uma pergunta que pede muitas leituras vai para um ajudante de pesquisa, que só lê e devolve o resumo
com os números. E o Conexus passa a ter uma prova com perguntas como as da sua equipe e um placar por
pergunta, para medir se cada mudança no Assistente melhora ou piora as respostas.

**O roteiro de uso.** Você é dono da empresa, no Hub no ar, com uma conexão Sankhya.

1. Em **Configurações › Memória da empresa**, escreva nas **Instruções da empresa**: "Valores em
   reais com duas casas. A semana comercial começa na segunda. Chame cliente pelo nome fantasia."
   Salve. Em **Configurações › Sua conta**, preencha **Cargo** e **Área**.
2. No Início, abra uma conversa nova e pergunte: "que dia da semana é hoje, e o que você sabe de
   mim?". Ele responde com o dia da semana, o seu cargo e a sua área, e segue as instruções da empresa.
   Diga: "lembre que eu acompanho principalmente a linha de bebidas". Em **Sua conta › O que o
   Assistente lembra de você**, a frase aparece; corrija uma palavra ali e salve.
3. Diga: "guarde para a empresa: o campo CODTIPOPER 1100 é a venda de balcão". Em **Memória da
   empresa**, a página aparece. Entre com um membro de teste (sem papel de dono ou administrador):
   ele vê a página e as instruções, sem os botões de editar; numa conversa dele, pergunte o que é a
   operação 1100, e o Assistente sabe.
4. Na sua conta, abra outra conversa nova: "na conversa de antes sobre bebidas, o que eu tinha dito
   que acompanho?". Ele acha a conversa antiga pela lista das suas conversas e responde.
5. Pergunte: "qual a alíquota do ICMS em São Paulo para bebidas frias, e cite a fonte". A resposta
   tem links perto de cada afirmação e, embaixo da mensagem, a linha **Fontes** com o título e o
   domínio de cada página. Mande um link de um PDF público e peça um resumo: ele lê o PDF.
6. Escolha a conexão Sankhya e pergunte: "quantos pedidos de venda tivemos em outubro, por
   vendedor?". Ele busca a leitura certa, com os campos certos, diz quantas linhas vieram e responde
   do arquivo inteiro. Onde ele roda uma conta na máquina, a linha diz o que faz ("Somando os
   pedidos de outubro por vendedor"), e o comando só aparece ao abrir a linha. Depois do próximo
   Release, volte a essa conversa: o arquivo da leitura continua lá.
7. Escolha também a conexão da outra filial e pergunte: "compare as vendas de outubro das duas
   filiais por linha de produto e diga o que mudou". Aparece a linha **Pesquisando:** com o que ele
   pediu ao ajudante; quando termina, a linha vira **Pesquisou:**, e ao abri-la você lê o resumo que
   o ajudante devolveu. A resposta vem desse resumo, com os números.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. Antes da U11: revisa a
lista de perguntas da prova (na U11, marcada "para revisão do fundador"), tirando, trocando ou
acrescentando perguntas do jeito que a sua equipe pergunta. Durante a U2: autoriza,
quando o firstmate pedir, duas chamadas pagas pequenas: a prova da busca do Google pela sua conta
(CLIProxy), que libera a busca na web para quem conversa com o Gemini, e uma busca de página
(`web_fetch`) do Anthropic pela assinatura Claude, que confirma que ela funciona por assinatura e
quanto custa. No fim: faz o roteiro, diz o que viu e aprova os textos das telas.

**Uma consequência que você vai ver.** A memória da empresa usa o `Knowledge` do Mastra, que na
versão instalada é **experimental**: o Mastra pode mudar a API sem aviso, e o armazenamento dele não
tem migração (um Mastra novo que mude o formato pede apagar as tabelas da memória da empresa). O
cartão contém isso: só um arquivo do Conexus fala com o `Knowledge`; um teste prende a versão do
formato, e o pull request que subir o Mastra e mudá-la falha até exportar as páginas pelo próprio
`Knowledge` e regravá-las; as rotas de navegação do Mastra continuam desligadas (o Hub só expõe as
suas). As instruções da empresa e as páginas continuam suas: você as vê e corrige na tela.

**Outra consequência: o ajudante custa chamadas de modelo.** Cada pesquisa do ajudante faz as suas
próprias chamadas ao modelo, na mesma conta e no mesmo modelo da conversa, como o título da conversa
já faz: até 50 passos por pesquisa, o padrão do Mastra e do Mastra Code. As leituras dele contam nas
mesmas 50 chamadas aos sistemas da empresa por resposta que já existem. O log do turno conta quantas
pesquisas e quantas leituras do ajudante houve; os tokens dele ainda não, porque o Mastra não os
informa nem o Mastra Code os conta: fica como dívida, e a prova da U11 diz se as respostas com o
ajudante usam mais ou menos passos.

**Fica de fora.**

- **A busca por significado nas conversas antigas** (busca semântica). O Assistente acha a conversa
  pela lista das suas conversas (título e data) e a lê; a busca por significado pede um modelo de
  embeddings pago e a extensão de vetores no banco. Entra se o uso mostrar que a lista não basta.
- **A memória de cada Projeto.** A memória da empresa vale para a empresa toda; cada conexão já tem o
  seu caderno.
- **Um fornecedor de busca próprio** (Tavily ou outro), igual para todo modelo. A sua resposta "4.
  A": a busca é a do provedor do modelo; se a prova do Google falhar, quem conversa com o Gemini
  continua sem busca, e o firstmate lhe traz a escolha.
- **Ler página convertida para quem conversa com o OpenAI ou o Gemini.** A busca de página nativa
  existe só no Anthropic; nos outros, o `web_fetch` do Mastra continua como hoje. Uma ferramenta
  nossa de conversão é código novo; entra quando o uso mostrar quanto passa por eles.
- **A skill de cada conector sem os parâmetros repetidos.** Com as leituras tipadas (U6), o campo
  vem do esquema; a skill, que é do trilho de molde (`packages/connectors`), pode encurtar num cartão
  dele.
- **Todas as ferramentas do Assistente sob busca.** Só as leituras de conector vão sob demanda; as 28
  do núcleo pesam cerca de 4,5% da janela, abaixo do ponto em que as referências adiam ferramentas.
- **As skills abertas voltando depois que a memória observa** (o item 5 do estudo do harness: o
  Claude Code devolve ao modelo o texto das skills que ele abriu). Só se constrói se o placar da U11
  mostrar respostas erradas depois de uma observação; até lá é hipótese.
- **O ajudante escrevendo, pesquisando na web ou chamando outro ajudante.** Ele só lê as conexões da
  conversa e os arquivos da máquina; não roda comando (um comando pode gravar), não grava, não anota
  no caderno e não abre outro ajudante. **Um modelo mais barato para o ajudante** também fica de
  fora: ele usa o da conversa até o placar mostrar o custo.
- **Os avisos guardados para um cartão** (`next-card`). Este cartão toma o #971 (a máquina que morria
  a cada Release, U1), a linha "uma resposta errada porque o modelo não abriu o arquivo" do #540 (U5)
  e a linha "a base de conhecimento da empresa" do #541, na parte das definições (U9). Os outros que
  tocam o Assistente esperam o seu gatilho: o #778 (quanto tempo uma conversa parada guarda os
  arquivos), o #814 (quem grava no caderno), o #143 (o `web_fetch` do Mastra e os endereços NAT64,
  que fica para os provedores sem a busca nativa) e o resto do #540 e do #541.

**As decisões desta etapa já têm a sua palavra.** Nenhuma nova.

- **Memória e busca** (acima): "1. B e D 2. B e C 3. A gente via implementar o Knowledge … 4. A".
- **Os campos da conta e a permissão no banco**, em 2026-11-11, nesta página: "Decisões: A - A".
  - A primeira **A**: a sua conta ganha **Cargo** e **Área** (exemplo: "Diretor comercial",
    "Vendas"). O "sobre você" vem pela memória que o Assistente aprende e que você corrige na tela (a
    sua escolha "c"), e não por um texto livre na conta. Constrói a U8.
  - A segunda **A**: a regra D11 recebe a sua palavra para uma permissão nova no banco, `UPDATE` só
    das colunas de cargo e área do membro, para as rotas da empresa, como o apelido da empresa; a
    própria pessoa grava os seus pela mesma porta. Vai num pull request só dela, antes da U8.
- **O estudo do harness do Claude Code**, em 2026-11-11: "A1, porém estudar profudanmente vendo
  referencias e documentação usar context7 /mastra e o que precisar B2 Sim inclua vamos deixar nossa
  harness o mais alinhada possivel".
  - **A1**: o ajudante de pesquisa entra agora, um tipo só, que só lê (U12). O estudo profundo que
    você pediu está na U12 e na tabela de referência: a documentação instalada do Mastra 1.82, o
    Context7, o código do Mastra Code e os tipos do Agent SDK do Claude Code. Ele achou três coisas
    que o cartão resolve sem a sua palavra: o ajudante do Mastra nasce sem a escolha de conta do
    Conexus, e passa a usar a conta da conversa, como o título; as ferramentas dele precisam ser
    montadas com a conversa de quem pergunta, porque ele não a enxerga; e a numeração dos arquivos
    das leituras sobrescreveria a do turno, e passa a contar pelo turno.
  - **B2**: o firstmate escreveu as perguntas da prova a partir dos roteiros dos cartões e dos usos
    do Assistente (U11); você revisa a lista antes da U11.
  - **"Sim inclua"**: a frase de cada comando (U10), a prova e o placar (U11), o modelo da memória
    por pessoa (dentro da U7) e o ajudante (U12). O item 5 fica condicionado ao placar (acima).

Quem escreve a memória e as instruções da empresa, como cada um vê e corrige o que é guardado, e a
separação por empresa não pedem a sua palavra: seguem o modelo de papéis que você já aprovou e as
referências convergem. Dono e administrador escrevem, por uma permissão nova, "Memória da empresa",
como toda escrita que vale para a empresa inteira (conexões, contas de modelo, cópias); todo membro
lê. Cada pessoa vê e corrige só o que o Assistente aprendeu dela. Uma
empresa nunca lê a memória de outra.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 A máquina fica, e o caminho certo | A máquina de uma conversa do Assistente é retomada pelo id, de qualquer molde; a morte por molde fica no Builder, nos agentes do Projeto e no Construtor, que rodam as ferramentas do molde; a frase do sistema de arquivos diz a regra real dos caminhos | `apps/server/src/builder/machine/`, `apps/server/src/builder/assistant/{assistant,machine.test,file.test,test-files}.ts`, `apps/server/src/builder/{agents/controller,construtor/construtor}.ts` | [testing](../guides/testing.md) | esta página aprovada |
| U2 Ferramentas em paralelo e a web do provedor | `toolCallConcurrency: { strategy: 'called' }` para todo agente; `web_search` pela fábrica do provedor, com país e fuso; `web_fetch` do Anthropic pela ferramenta do provedor, com citações; a troca de modelo tira as duas; o Google ganha a busca se a prova paga passar | `apps/server/src/builder/controller-kit/`, `apps/server/src/builder/model-accounts/processors.ts` | [security](../guides/security.md) | U1 |
| U3 As fontes embaixo da mensagem | A linha "Fontes" com título e domínio de cada parte `source` da mensagem, só `http(s)` | `apps/web/src/builder/conversation/` | [web](../guides/web.md) | esta página aprovada |
| U4 O contexto do Assistente | A lista de tarefas como estado (`TaskSignalProvider`); as frases de ferramenta que dependem do papel saem do texto fixo para o bloco da conversa; o dia da semana na data; o Observador com foco de negócio; o texto pede links perto de cada afirmação | `apps/server/src/builder/assistant/` | [testing](../guides/testing.md) | U2 |
| U5 A leitura grande | A resposta cortada diz quantas linhas e quantos bytes vieram; a descrição manda abrir o arquivo e não reler; a razão própria dos 20 em `cut.ts` e dos 50 em `builder-port.ts` | `apps/server/src/hub/connectors/`, `apps/server/src/builder/connectors/connector-tools.ts` | [data](../guides/data.md) | esta página aprovada |
| U6 As leituras tipadas sob demanda | Uma ferramenta por leitura das conexões escolhidas, com o Zod da operação; atrás do `ToolSearchProcessor` (`search_tools`, carga automática); `connector_read` sai do Assistente | `apps/server/src/builder/connectors/`, `apps/server/src/builder/assistant/` | [security](../guides/security.md) | U4, U5 |
| U7 As conversas antigas e o que ele aprende de você | `recall` em todas as conversas do Assistente da mesma pessoa na empresa; memória de trabalho por pessoa; a seção "O que o Assistente lembra de você" em Sua conta, com editar e apagar | `apps/server/src/builder/assistant/`, `apps/server/src/builder/controller-kit/memory.ts`, `packages/hub-api/src/`, `apps/web/src/builder/assistant/`, `apps/web/src/routes/_app/companies/$companyId_/settings/account.tsx` | [web](../guides/web.md) | U4 |
| U8 Cargo e área na conta | Os campos do membro (Better Auth), a migração, as rotas; a pessoa edita os seus em Sua conta, o administrador os de outro em Pessoas; o bloco da conversa os diz | `apps/server/src/hub/identity/`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `packages/hub-api/src/`, `apps/web/src/hub/identity/`, `apps/web/src/routes/_app/companies/$companyId_/settings/{account,people}.tsx`, `apps/server/src/builder/assistant/instructions.ts` | [data](../guides/data.md) | U7 (a mesma tela de Sua conta); o pull request da permissão no banco, com a palavra do fundador (D11) |
| U9 A memória e as instruções da empresa | O `Knowledge` do Mastra no Assistente, escopo da empresa, instruções da empresa como página fixada; a permissão "Memória da empresa"; a página Configurações › Memória da empresa | `apps/server/src/builder/assistant/`, `apps/server/src/hub/identity/{admission,roles}.ts`, `packages/hub-api/src/`, `apps/web/src/builder/assistant/`, `apps/web/src/routes/_app/companies/$companyId_/settings/` | [security](../guides/security.md) | U7, U8 |
| U10 A frase de cada comando | `requireDescription` no comando da máquina, para o Assistente e o Builder; a linha da conversa mostra a frase e guarda o comando para quando abre; os dois textos fixos pedem a frase em português | `apps/server/src/builder/machine/`, `apps/server/src/builder/assistant/prompt/assistant.md`, `apps/server/src/builder/conversation/prompt/builder.md`, `apps/web/src/builder/conversation/` | [web](../guides/web.md) | U1 (a mesma pasta `machine/`) |
| U11 A prova e o placar | As perguntas revisadas pelo fundador, cada uma numa conversa nova sobre os dados de teste; o placar por pergunta (certo, chamadas, erros, repetidas, tokens do primeiro passo), com o dublê sempre e com o modelo de verdade quando o firstmate liga | `apps/server/src/builder/assistant/` (só testes e dados de teste) | [testing](../guides/testing.md) | U5; a lista revisada pelo fundador |
| U12 O ajudante de pesquisa | O tipo `pesquisar` do `subagent` do controlador: só lê as conexões escolhidas e os arquivos da máquina; usa a conta da conversa; a linha "Pesquisando:" com o resumo; o log do turno conta as pesquisas | `apps/server/src/builder/assistant/`, `apps/server/src/builder/controller-kit/`, `apps/server/src/builder/model-accounts/processors.ts`, `apps/server/src/builder/conversation/turn-line.ts`, `packages/hub-api/src/tools.ts`, `apps/web/src/builder/conversation/` | [security](../guides/security.md) | U6 (o `connector_read` sai do agente), U11 (o placar conta o ajudante) |

U1, U3 e U5 não dividem pasta e correm em paralelo; U10 vem logo depois da U1, porque as duas mudam
`machine/`, e é pequena; U2 vem depois da U1 (o pull request as junta em ordem) e a U4 depois da U2,
porque o bloco da conversa e o texto fixo leem as ferramentas que a U2 deixa. A U11 vem antes da U6:
o placar mede o Assistente antes das leituras tipadas e do ajudante, e cada unidade seguinte se
compara com ele. U6 lê a U4 e a U5; a U12 vem depois da U6, porque o `connector_read` que o ajudante
recebe precisa já ter saído das ferramentas do agente principal; U7, U8 e U9 vão em fila, porque
dividem o agente, a memória e a tela de Sua conta. A ordem do pull request: U1, U10, U2, U3, U4, U5,
U11, U6, U12, U7, U8, U9. Os números das unidades ficam os de quando o cartão nasceu, para não
desencontrar os critérios já lidos.

**Os trilhos.** O trilho do Assistente é dono de `apps/server/src/builder/assistant/` e de
`apps/web/src/builder/assistant/`. As outras pastas são de uso comum: `machine/` (U1) e
`controller-kit/` (U2) mudam também para o Builder e os agentes, de propósito: a frase dos caminhos e
as ferramentas em paralelo valem para todos, e a máquina do Builder continua morrendo por molde,
porque a razão dela vale; a U10 muda o comando da máquina e a linha dele para todos, também de
propósito (a frase serve a quem não programa, no Builder como no Assistente); a U12 só acrescenta em
`controller-kit/` e `model-accounts/` uma opção que o Builder não liga (`subagents` vazio, o
`subagent` desligado como hoje); `hub/connectors/` e `builder/connectors/` (U5, U6) são do
Builder também, e a U5 só acrescenta campos e troca uma frase; `hub/identity/`, `migrations/` e as
telas de Configurações (U8, U9) são da fronteira e esperam as unidades dela que as tocam (a
Capacidade 4 mexe nas pessoas do app, não nas da empresa; a ordem segue L1).

**Orçamento de código alterado.** U1: 40. U2: 140. U3: 180. U4: 165. U5: 60. U6: 320. U7: 450 (com o
modelo da memória). U8: 430. U9: 880. U10: 40. U11: 0 (cerca de 300 linhas, todas de teste e dados de
teste). U12: 160. Total da etapa: cerca de 2.865, sem testes nem gerados (delivery L2).

**Onde o cartão fica no roteiro.** No roteiro, o Assistente está em "Depois desta frente"; o trilho
dele anda ao lado, um cartão por vez (L1). Este é o segundo: espera em rascunho até O Assistente do
dia a dia fechar (L5), e não muda a ordem do roteiro.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Uma conversa do Assistente cuja máquina foi feita de outro molde é retomada com os arquivos: o arquivo gravado antes continua no mesmo caminho e nenhuma máquina é morta. Falha hoje: a máquina é morta e o arquivo some | `apps/server/src/builder/assistant/machine.test.ts`, "a máquina de outro molde é retomada com os arquivos" (troca o caso "é morta" de `:198`) | must |
| 2 | U1 | A máquina de um agente do Projeto, a do Construtor e a do Builder feitas de outro molde continuam sendo mortas e refeitas | `apps/server/src/builder/machine/machine.test.ts:260` (o Builder, o de hoje) e `apps/server/src/builder/machine/conversation-machines.test.ts`, "com `replace`, a de outro molde é morta" | must |
| 3 | U1 | O download de um arquivo acha a máquina da conversa de qualquer molde; numa conversa sem máquina, `FILE_GONE` como hoje | `apps/server/src/builder/assistant/file.test.ts`, "o arquivo de uma máquina de outro molde baixa" | must |
| 4 | U1 | A frase do sistema de arquivos que o modelo recebe diz que caminho absoluto fora da pasta entra nela (`/tmp/x` vira `<pasta>/tmp/x`) e não traz `/src/index.ts` | `apps/server/src/builder/machine/sandbox-filesystem/filesystem.test.ts`, "a frase diz a regra dos caminhos" | must |
| 5 | U2 | Duas leituras pedidas pelo modelo no mesmo passo rodam juntas: com duas ferramentas de 300 ms, o passo termina em menos de 450 ms; `ask_user` pedido sozinho continua sozinho. Falha hoje: 667 ms | `apps/server/src/builder/controller-kit/concurrency.test.ts`, "as ferramentas de um passo rodam juntas" | must |
| 6 | U2 | Com o Anthropic, o pedido ao modelo leva `web_search_20250305` com `user_location` (`BR`, `America/Sao_Paulo`) e `web_fetch_20250910` com `citations.enabled`; com o OpenAI, `web_search` com `user_location`; com o xAI, a busca nativa sem argumentos como hoje | `apps/server/src/builder/controller-kit/model.test.ts`, "as ferramentas de web do provedor com argumentos" | must |
| 7 | U2 | Numa troca automática de modelo no meio do turno, o `web_search` do provedor anterior sai do pedido seguinte, e o `web_fetch` sai só quando o anterior era o Anthropic (a única leitura de página do provedor); vindo de outro, o `web_fetch` do Mastra, uma função, fica | `apps/server/src/builder/model-accounts/processors.test.ts`, "a troca de modelo tira a busca e a leitura de página" | must |
| 8 | U2 | O teste prende o que a prova paga do Google decidiu: passada, o pedido ao Gemini (CLIProxy) leva `google_search`; não passada, continua sem busca, como hoje | `model.test.ts`, "o Google segue a prova" | must |
| 9 | U3 | Uma mensagem com partes `source` mostra embaixo a linha "Fontes" com o título (ou o endereço) e o domínio de cada uma, sem repetir a mesma URL; um `source` que não é `http(s)` não vira link; sem `source`, nada aparece | `apps/web/src/builder/conversation/sources.test.tsx`, os três casos | must |
| 10 | U3 | A linha "Fontes" passa nas capturas a 1366 e 390 px, nos dois temas, sem estouro horizontal, e cada link abre em aba nova com `rel="noopener noreferrer"` | `apps/web/src/builder/conversation/conversation.layout.test.tsx`, "as fontes" | must |
| 11 | U4 | Depois de um `task_write`, o pedido seguinte ao modelo leva `<current-task-list>`; depois de uma observação, a lista continua no pedido. Falha hoje: some | `apps/server/src/builder/assistant/context.test.ts`, "a lista de tarefas como estado" | must |
| 12 | U4 | A mensagem fixa continua os mesmos bytes para um dono e para um membro; a frase de que não pode guardar nota no caderno aparece só no bloco do membro, e a de automação só no de quem não pode automatizar | `apps/server/src/builder/assistant/instructions.test.ts`, "as frases de ferramenta vão no bloco, com o papel" | must |
| 13 | U4 | O bloco da conversa diz o dia da semana em inglês junto da data (`Today: 2026-11-11 (Wednesday), America/Sao_Paulo.`) | `instructions.test.ts`, "o dia da semana" | must |
| 14 | U4 | O pedido ao Observador do Assistente leva a instrução de negócio (números com a origem, códigos ensinados, filtros e períodos, arquivos, passagens ao Builder) e a do título; o do Builder não muda | `apps/server/src/builder/assistant/assistant.test.ts`, "o Observador com foco de negócio" | must |
| 15 | U5 | Uma leitura cortada devolve ao modelo `rows` (as linhas da resposta) e `bytes` (o tamanho dela) junto de `complete: false`; a descrição de `connector_read` manda abrir o arquivo e não reler; uma leitura sem máquina (`saved: false`) continua mandando filtrar | `apps/server/src/hub/connectors/cut.test.ts`, "o corte diz linhas e bytes"; `apps/server/src/builder/connectors/connector-tools.test.ts`, "a frase do arquivo" | must |
| 16 | U6 | Com uma conexão Sankhya escolhida, o primeiro pedido ao modelo leva `search_tools` e nenhuma ferramenta de leitura; depois de uma busca por "pedidos", o pedido seguinte leva `sankhya_<leitura>` com o esquema da operação; uma entrada fora do esquema volta como erro de validação antes de chegar ao Hub | `apps/server/src/builder/assistant/typed-reads.test.ts`, "a leitura achada sob demanda" e "a entrada fora do esquema" | must |
| 17 | U6 | Uma leitura que o papel não permite não aparece na busca nem pode ser carregada; a porta do Hub continua recusando-a (S36); o teto de 50 chamadas conta as leituras tipadas | `typed-reads.test.ts`, "a leitura fora do papel não existe" e "as 50 contam" | must |
| 18 | U6 | O mesmo roteiro do critério 16 depois de reiniciar o Hub: a ferramenta carregada continua carregada enquanto a busca está nas mensagens (`storage: 'context'`) | `typed-reads.test.ts`, "a carga sobrevive ao reinício" | should |
| 19 | U7 | Numa conversa nova, o modelo chama `recall` no modo de lista e recebe as outras conversas do Assistente da mesma pessoa na empresa, e as lê; nunca as de outra pessoa, nem as do Builder, nem as de outra empresa (o recall recusa uma conversa de outro `resource`) | `apps/server/src/builder/assistant/recall.test.ts`, "lê as suas conversas" e "não lê a de outro" | must |
| 20 | U7 | O modelo grava na memória de trabalho da pessoa, e numa conversa nova ela está no pedido; a mensagem fixa não muda de bytes | `apps/server/src/builder/assistant/profile-memory.test.ts`, "o que aprendeu vale na conversa seguinte" | must |
| 21 | U7 | `GET` da memória da pessoa devolve o texto; `PUT` troca; `DELETE` apaga; outra pessoa da empresa recebe `NOT_FOUND`, e quem não está na empresa também | `profile-memory.test.ts`, "a pessoa vê, corrige e apaga" e "ninguém mais" | must |
| 22 | U7 | Em Sua conta, "O que o Assistente lembra de você" mostra o texto, o editor e "Apagar tudo" com confirmação; vazio, a frase do vazio | `apps/web/src/builder/assistant/profile-memory.test.tsx`, os estados da matriz | must |
| 23 | U8 | A pessoa grava o seu cargo e a sua área; o administrador grava os de outro membro; um membro sem a permissão de mudar papel recebe `NOT_IN_ROLE` ao gravar os de outro; acima de 80 caracteres, `REQUEST_MALFORMED` | `apps/server/src/hub/identity/member-profile.test.ts`, os quatro casos | must |
| 24 | U8 | O bloco da conversa diz `Person: <nome> (<papel>; <cargo>, <área>)` quando há cargo ou área; sem eles, a linha de hoje | `apps/server/src/builder/assistant/instructions.test.ts`, "o cargo e a área" | must |
| 25 | U8 | As telas Sua conta e Pessoas mostram e editam os campos nos estados da matriz | `apps/web/src/hub/identity/member-profile.test.tsx` | must |
| 26 | U9 | As instruções da empresa gravadas pela tela estão em todo pedido de toda conversa do Assistente da empresa, depois da mensagem fixa (que não muda de bytes); numa conversa de outra empresa, não | `apps/server/src/builder/assistant/company-memory.test.ts`, "as instruções valem para a empresa toda" e "não passam de empresa" | must |
| 27 | U9 | Numa conversa de quem tem a permissão "Memória da empresa", o modelo cria uma página da empresa; numa conversa de um membro sem ela, a mesma escrita volta recusada pelo `Knowledge` e o bloco diz que ele não guarda memória da empresa; o membro lê a página | `company-memory.test.ts`, "quem escreve" e "o membro lê" | must |
| 28 | U9 | As rotas da memória da empresa: todo membro lista e lê; gravar e apagar pedem a permissão (`NOT_IN_ROLE`); instruções acima de 2.000 caracteres: `REQUEST_MALFORMED`; apagar com outra gravação no meio: `COMPANY_MEMORY_CHANGED`; outra empresa: `NOT_FOUND` | `apps/server/src/builder/assistant/company-memory-routes.test.ts` | must |
| 29 | U9 | O teste prende `KNOWLEDGE_STORAGE_SCHEMA_VERSION` em 4: um Mastra que o mude falha este teste | `company-memory.test.ts`, "o formato do Knowledge" | must |
| 30 | U9 | A página Memória da empresa nos estados da matriz, a 1366 e 390 px, nos dois temas; o membro não vê os botões de editar | `apps/web/src/builder/assistant/company-memory.test.tsx` e o seu layout | must |
| 31 | U9 | A permissão "Memória da empresa" nasce no dono e no administrador; um papel próprio da empresa (que só recebe conectores) não a tem, e quem o tem recebe `NOT_IN_ROLE` ao gravar | `apps/server/src/hub/identity/roles.test.ts`, "a memória da empresa" | must |
| 32 | U10 | Na máquina do Assistente e na do Builder, o esquema de `mastra_workspace_execute_command` que chega ao modelo exige `description` e a lista antes de `command`; uma chamada sem ela volta como erro de validação. Falha hoje: o esquema não tem `description` | `apps/server/src/builder/machine/command-description.test.ts`, "a frase vem antes do comando, nas duas máquinas" | must |
| 33 | U10 | A linha de um comando mostra a frase ("Somando os pedidos por vendedor") em vez do comando; ao abrir, o comando e a saída como hoje; uma chamada guardada sem `description` (conversas antigas) mostra "Rodou um comando" e o comando, como hoje | `apps/web/src/builder/conversation/tool-registry.test.ts`, "a frase do comando" | must |
| 34 | U10 | O texto fixo do Assistente e o do Builder pedem a frase do comando em português do Brasil; o do Assistente continua os mesmos bytes para um dono e para um membro (critério 12) | `apps/server/src/builder/assistant/instructions.test.ts` e `apps/server/src/builder/conversation/prompt.test.ts`, "a frase do comando em português" | must |
| 35 | U11 | Com o modelo dublê, cada pergunta da lista roda numa conversa nova sobre os seus dados de teste e o placar sai certo: um turno roteirizado com uma leitura repetida e uma ferramenta que falhou dá `repeated: 1` e `errors: 1`; o placar é um JSON por pergunta gravado fora do repositório | `apps/server/src/builder/assistant/assistant.scorecard.test.ts`, "o placar conta o turno" e "cada pergunta tem os seus dados" | must |
| 36 | U11 | Com `CONEXUS_EVAL_REAL_MODEL` ligado, as perguntas rodam no modelo de verdade, cada uma numa conversa nova, e o placar sai com os tokens do primeiro passo (`usage.promptTokens` do primeiro `usage_update`); uma resposta errada não falha o teste, só conta no placar | `assistant.scorecard.test.ts`, "o modelo de verdade, a lista inteira" | should |
| 37 | U12 | No primeiro pedido de uma conversa do Assistente, `subagent` está entre as ferramentas com um tipo só, `pesquisar`; no do Builder e no de um agente do Projeto, não. Falha hoje: o Assistente não oferece `subagent` | `apps/server/src/builder/assistant/research.test.ts`, "o ajudante existe só no Assistente" | must |
| 38 | U12 | O pedido do ajudante ao modelo leva exatamente `connector_read` e as quatro leituras da máquina (`mastra_workspace_read_file`, `mastra_workspace_list_files`, `mastra_workspace_file_stat`, `mastra_workspace_grep`); nenhuma escrita, comando, anotação, proposta, passagem ao Builder, `subagent` nem `ask_user`; o pedido do agente principal não leva `connector_read` | `research.test.ts`, "o ajudante só lê" | must |
| 39 | U12 | A leitura do ajudante passa pela porta do Hub com o escopo de quem pergunta: uma leitura que o papel não permite volta `NOT_IN_ROLE`; as leituras dele contam nas 50 do turno (49 do principal e 1 dele: a segunda dele volta `CALLS_SPENT`); o arquivo dela é `reads/<turno>-<n>.json` com `n` depois dos do principal, sem sobrescrever nenhum | `research.test.ts`, "a porta, as 50 e o arquivo" | must |
| 40 | U12 | O ajudante chama o modelo pela conta que o turno está usando: o dublê dessa conta recebe as chamadas dele; um `modelId` escrito pelo modelo principal é ignorado; com a conta falhando no meio, o principal recebe o erro da ferramenta e continua o turno, e o log diz `MODEL_SIDE_CALL_FAILED` com `call: 'subagent'` | `research.test.ts`, "a conta da conversa" e "a falha da conta" | must |
| 41 | U12 | O resumo do ajudante volta como o resultado de `subagent`, e o pedido seguinte do principal leva esse texto e nenhum resultado das leituras do ajudante | `research.test.ts`, "só o resumo volta" | must |
| 42 | U12 | A linha do ajudante: "Pesquisando: <pedido>" enquanto roda, "Pesquisou: <pedido>" ao terminar, o resumo ao abrir, "A pesquisa falhou" no erro; nas capturas a 1366 e 390 px, nos dois temas, um pedido longo fica numa linha cortada, sem estouro horizontal | `apps/web/src/builder/conversation/tool-registry.test.ts`, "o ajudante", e `conversation.layout.test.tsx`, "a linha do ajudante" | must |
| 43 | U12 | A linha do turno no log ganha `helpers` (as pesquisas) e `helperCalls` (as ferramentas que o ajudante chamou), contadas dos eventos `subagent_end` e `subagent_tool_start`; sem ajudante, os campos não aparecem | `apps/server/src/builder/conversation/turn-line.test.ts`, "o ajudante no log" | must |
| 44 | U7 | O bloco da memória de trabalho que chega ao modelo traz o `PROFILE_TEMPLATE` com as quatro seções (quem é, correções, trabalho em andamento, onde achar), a regra de não guardar o que uma leitura do sistema dá, o teto de 4.000 caracteres e a data em cada linha | `profile-memory.test.ts`, "o modelo da memória" | must |
| 45 | U4 | O texto fixo diz que os blocos de estado e os lembretes do pedido vêm do Conexus, não da pessoa, e continua os mesmos bytes entre conversas | `instructions.test.ts`, "o que é um lembrete" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A linha Fontes de uma mensagem | A primeira mensagem com fontes: a linha "Fontes" embaixo | Sem `source`: nada | Enquanto a mensagem chega, as fontes que já chegaram | não se aplica | não se aplica | não se aplica | O `source` que não é `http(s)`: o título como texto, sem link |
| A linha de um comando (U10) | A frase do modelo no lugar do comando | Uma chamada guardada sem frase: "Rodou um comando" e o comando, como hoje | "Rodando…" com a frase, assim que ela chega (ela vem antes do comando) | O comando que falhou: a frase com "Um comando falhou", e a saída ao abrir | não se aplica | não se aplica | não se aplica |
| A linha do ajudante (U12) | "Pesquisando: <pedido>" numa linha cortada | não se aplica: a linha existe só quando o modelo chama o ajudante | "Pesquisando: <pedido>" até o fim | "A pesquisa falhou: <pedido>", e ao abrir a razão que o ajudante devolveu | não se aplica | não se aplica: o ajudante lê com o escopo de quem pergunta, e a recusa de uma leitura vem dentro do resumo | Parar no meio: "Pesquisou: <pedido>" com o resumo parcial que o Mastra devolve (`[Aborted by user]`, dito em português na linha) |
| Sua conta, Cargo e área | Os dois campos vazios com a dica "Ajuda o Assistente a entender o seu trabalho." | Os campos vazios | A leitura da conta, como hoje | A gravação que falha: a frase de falha da conta de hoje | não se aplica | Não acontece: a pessoa edita os seus | Acima de 80 caracteres: a frase do campo |
| Sua conta, O que o Assistente lembra de você | A frase "O Assistente ainda não guardou nada sobre você. Ele guarda o que você pedir para lembrar, e o que aprender nas conversas." | A mesma frase | O texto carregando | A leitura que falha: "Não foi possível ler a memória." com Tentar de novo; a gravação que falha: a frase de falha de hoje | não se aplica | Não acontece: a pessoa vê a sua | Acima do teto de texto: a frase do campo |
| Configurações › Pessoas, Cargo e área de outro | Os campos de cada membro, vazios | Os campos vazios | Como a lista de hoje | Como a lista de hoje | O membro que saiu: a frase de hoje | Sem a permissão de mudar papel: os campos só para ler | Acima de 80 caracteres: a frase do campo |
| Configurações › Memória da empresa | "As instruções e as páginas que o Assistente segue em toda conversa da empresa." e as Instruções vazias | Instruções vazias e "Nenhuma página guardada ainda." | A lista carregando | "Não foi possível ler a memória da empresa." com Tentar de novo | A página apagada por outro: "Esta página não existe mais." | O membro sem a permissão: tudo para ler, sem editar nem apagar | Instruções acima de 2.000 caracteres: a frase com a contagem; apagar uma página que outro mudou ao mesmo tempo: "A página mudou enquanto você apagava." e a lista relida |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `ShapedRead.rows`, `ShapedRead.bytes` | `hub/connectors/cut.ts` (U5) | o modelo, pela resposta de `connector_read` e das leituras tipadas |
| `member.jobTitle`, `member.department` | a rota da pessoa e a do administrador (U8) | o bloco da conversa (U8), Sua conta e Pessoas |
| `ProfileMemory.text` | o modelo (`updateWorkingMemory`) e a rota `PUT` da pessoa (U7) | o pedido ao modelo (Mastra), a tela de Sua conta |
| `CompanyMemoryPage.{path,name,body,updatedAt}` | o modelo de quem tem a permissão (`knowledge_page`, `knowledge_note`) e a rota `PUT` (U9) | todo membro pela tela; o modelo de toda conversa da empresa (`knowledge_read`, `knowledge_search`, `knowledge_list`) |
| `CompanyInstructions.body` | a rota `PUT` (U9) e o modelo de quem tem a permissão | o pedido de toda conversa da empresa (página fixada), a tela |
| `execute_command.args.description` | o modelo (U10, esquema nativo do Mastra) | a linha do comando |
| `subagent.args.task`, `subagent.result.content` | o modelo principal (o pedido) e o ajudante (o resumo), U12, esquema nativo do Mastra | a linha do ajudante; o pedido seguinte do principal leva o resumo |
| a linha do turno, `helpers`, `helperCalls` | `conversation/turn-line.ts` (U12) | o log (S41: contagens, nunca o pedido nem o resumo) |
| o placar, por pergunta | `assistant.scorecard.test.ts` (U11) | o firstmate e o fundador, fora do repositório |

**As telas.** O produto antigo não tinha nenhuma destas telas (no `e0353c36`, só o estado da
memória no compositor). As caixas seguem as telas vizinhas de hoje (Sua conta, Pessoas e a
transcrição); as palavras são as desta página, que o fundador aprova no fim.

A linha de um comando e a do ajudante, a 1280 e a 390 px (fechadas; abertas, o comando com a saída e
o resumo do ajudante, na caixa que a linha de um comando já abre hoje):

```text
1280                                                     390
| >_ Somando os pedidos de outubro por vendedor   [v] |  | >_ Somando os pedidos de ... [v] |
| ⌕  Pesquisando: compare as vendas de outubro d… [v] |  | ⌕  Pesquisando: compare a... [v] |
| ⌕  Pesquisou: compare as vendas de outubro da…  [v] |  | ⌕  Pesquisou: compare as ... [v] |
```

A linha Fontes, a 1280 e a 390 px:

```text
1280                                               390
| Texto da resposta [sefaz.sp.gov.br]...  |        | Texto da resposta ...   |
|                                         |        |                         |
| Fontes                                  |        | Fontes                  |
| · ICMS: alíquotas — sefaz.sp.gov.br     |        | · ICMS: alíquotas       |
| · Lei 6.374/89 — al.sp.gov.br           |        |   sefaz.sp.gov.br       |
                                                   | · Lei 6.374/89          |
                                                   |   al.sp.gov.br          |
```

Sua conta, a 1280 e a 390 px:

```text
1280                                                    390
| Sua conta                                    |        | Sua conta              |
| Nome ........ [Ana Souza          ]          |        | Nome [Ana Souza      ] |
| Cargo ....... [Diretora comercial ]          |        | Cargo [Diretora ...  ] |
| Área ........ [Vendas             ] [Salvar] |        | Área [Vendas         ] |
|                                              |        | [Salvar]               |
| O que o Assistente lembra de você            |        | O que o Assistente     |
| +------------------------------------------+ |        | lembra de você         |
| | Acompanha a linha de bebidas.            | |        | +--------------------+ |
| +------------------------------------------+ |        | | Acompanha a linha  | |
| [Salvar]                     [Apagar tudo]   |        | +--------------------+ |
                                                        | [Salvar] [Apagar tudo] |
```

Configurações › Memória da empresa, a 1280 e a 390 px:

```text
1280                                                       390
| Memória da empresa                                |      | Memória da empresa     |
| As instruções e as páginas que o Assistente ...   |      | Instruções da empresa  |
| Instruções da empresa                  312 / 2000 |      | +--------------------+ |
| +-----------------------------------------------+ |      | | Valores em reais...| |
| | Valores em reais com duas casas. ...          | |      | +--------------------+ |
| +-----------------------------------------------+ |      | 312 / 2000  [Salvar]   |
|                                         [Salvar]  |      | Páginas                |
| Páginas                                           |      | CODTIPOPER 1100        |
| CODTIPOPER 1100   Ana · 11/11/2026   [Ver] [⋯]    |      |  Ana · 11/11/2026  [⋯] |
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Retomar a máquina da conversa (`E2BSandbox.start` pelo id, sem matar a de outro molde) | Uma conversa tem uma rodada por vez; a retomada é a de hoje | Uma retomada cortada: a próxima mensagem retoma de novo; nenhuma máquina é criada a mais porque nada mais mata a antiga | A E2B fora: `MACHINE_UNAVAILABLE`, como hoje; a máquina sumida no download: `FILE_GONE` | `MACHINE_STARTED`, como hoje; `killStale` some do caminho das conversas | 1, 3 |
| `updateWorkingMemory` pelo modelo, `PUT` e `DELETE` da pessoa | Os dois gravam o texto inteiro: o último vence; a tela mostra o que ficou ao recarregar | Cortada antes do `COMMIT` do Mastra: nada mudou, e a pessoa reenvia (o `PUT` e o `DELETE` são idempotentes); um 502 ou 503 na resposta: a tela relê e mostra o que ficou | O banco do Mastra fora: `DATABASE_UNAVAILABLE` na rota; no turno, a falha de memória de hoje | nada novo; nunca o texto da memória (S41) | 20, 21 |
| Gravar cargo e área (comando do Hub, trava do membro) | A trava do membro ordena as duas; o último vence | Transação inteira ou nada; a resposta cortada: o `PUT` é idempotente e a tela relê | O banco do Hub fora: `DATABASE_UNAVAILABLE` | nada novo | 23 |
| `Knowledge.upsertPage` e `removePage` pela rota; `knowledge_page`, `knowledge_note` e `knowledge_pin` pelo modelo | Duas gravações na mesma página: o último vence (`upsertPage` não leva versão, `dist/knowledge/host-writes.d.ts:8-26`), e a tela relê depois de salvar; um `removePage` com outra gravação no meio lança `KnowledgeConflictError` (`dist/knowledge/index.d.ts:89-92`), que vira `COMPANY_MEMORY_CHANGED` (409), e a tela relê; o modelo recebe o erro da ferramenta e relê | `upsertPage` grava a página e a versão juntas; `unchanged` não grava; uma resposta cortada: o `PUT` do mesmo corpo é idempotente pelo caminho | O banco do Mastra fora: `DATABASE_UNAVAILABLE`; o armazenamento do `Knowledge` que pede reset (um Mastra novo): o teste do critério 29 falha antes de chegar ao `main` | `COMPANY_MEMORY_CHANGED` com o caminho da página, nunca o corpo (S41) | 26, 27, 28, 29 |
| A chamada paga de busca e de leitura de página pelo provedor | Cada chamada é do provedor, dentro do turno | O turno parado corta a chamada, como hoje | O provedor fora: o erro da ferramenta vai ao modelo, como hoje | nada novo | 6, 8 |
| A leitura tipada (a mesma porta de `connector_read`) | O contador das 50 é síncrono (`builder-port.ts:102-112`), também com as ferramentas em paralelo | Como `connector_read` hoje | Como `connector_read` hoje | nada novo | 16, 17 |
| A pesquisa do ajudante (`subagent`, as leituras dele e o arquivo de cada uma) | Dois ajudantes no mesmo passo (as ferramentas em paralelo da U2): cada um com o seu agente; o contador das 50 é o do turno, síncrono, e conta os dois; a numeração dos arquivos conta pelo turno, não pelo contexto (U12), e dois nunca pegam o mesmo número | Parar: o Mastra corta o ajudante pelo mesmo sinal do turno e devolve o texto parcial (`@mastra/core@1.82.0` `dist/agent-controller-BDds1y5w.js:6933-6948`); uma leitura cortada é a de hoje | A conta do modelo falha: o ajudante devolve erro ao principal (`:6963-6993`), que segue o turno sem trocar de conta; o sistema da empresa fora: o erro da leitura vai dentro do resumo | `MODEL_SIDE_CALL_FAILED` com `call: 'subagent'` (o `watched` de hoje); nunca o pedido nem o resumo (S41) | 38, 39, 40, 41 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Máquina da conversa e molde novo | U1 | `apps/server/src/builder/machine/conversation.ts:176` (`killStale` antes da partida); `machine/e2b.ts:84-96` (`find` filtra por `MARK.template`), `:100-101` | `mastra-1.82@6e8dfcb8` `mastracode/factory/src/workspace.ts:841-857`, `:930-944`; `workspaces/e2b/src/factory-sandbox.ts:144-155`; `@mastra/e2b@0.16.1` `dist/index.js:1432-1470` | A sessão religa a máquina pelo id gravado; o molde só conta no `create()`; uma sessão antiga fica na máquina dela | nativo (tirar o nosso) | — | issue 971; "Proposta sua concordo" | — |
| Frase do sistema de arquivos | U1 | `machine/sandbox-filesystem/filesystem.ts:371`; `resolveAgainst` `:144-160` | `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/sandbox-filesystem.ts:1120-1122`, `:273-290`; Factory `factory/src/session/environment-state-processor.ts:138-150` | O Mastra Code diz "workspace paths" porque lá a pasta é a raiz do repositório; o Factory diz o diretório absoluto real | embrulhado: a nossa cópia do arquivo do Mastra Code, só a frase muda | o script do estudo: `/tmp/chart.png` → `/home/user/work/tmp/chart.png` | não precisa | — |
| Ferramentas de um passo em paralelo | U2 | `controller-kit/factories.ts:65` (sem `toolCallConcurrency`); `ask_user` com `suspendSchema` (`conversation/plan-tools.ts:51`) | `@mastra/core@1.82.0` `dist/loop/types.d.ts:43-53`; `dist/agent-BP9OWM6D.js:15211-15226`, `:15248-15270`; `codex@970111f` `codex-rs/core/src/tools/handlers/mcp.rs:174-185` | A estratégia `called` faz só a ferramenta chamada decidir a fila; o Codex roda em paralelo o que declara | nativo | o laboratório do estudo: 667 ms → 311 ms | "Proposta sua concordo" | `apps/server/src/builder/controller-kit/concurrency.test.ts` |
| `web_search` com argumentos | U2 | `controller-kit/model.ts:8-10`, `:31-36` (`webSearchTool` sem argumentos; sem Google) | `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/tools.ts:135-148`; `@ai-sdk/anthropic@3.0.133` `dist/index.js:1490-1497` (`webSearch_20250305`); `@ai-sdk/openai@3.0.130` `dist/index.js:2753-2754`; `@mastra/core@1.82.0` `dist/tools-BVDic2bB.js:857-860` (Google) | O Mastra Code usa a fábrica do provedor do AI SDK | nativo | a prova paga do Google, na U2 | "4. A" | — |
| `web_fetch` do provedor | U2 | `controller-kit/model.ts:33` (`webFetchTool`: HTML cru, PDF ilegível, `dist/tools-BVDic2bB.js:609-791`) | `@ai-sdk/anthropic@3.0.133` `dist/index.js:1559-1612` (`webFetch_20250910`, saída com `application/pdf` em `:1582`), `:1829-1840` (o cabeçalho beta `web-fetch-2025-09-10`); a versão `webFetch_20260209` (`:1552`, `:1847-1864`) pede o beta de execução de código, e não entra; `cloudflare-agents@786d30e3` `packages/agents/src/web/fetch/contract.ts:119-126` | O provedor devolve texto ou PDF como documento, com citações; a cloudflare converte para Markdown | nativo no Anthropic; nos outros, o de hoje | a chamada paga pela assinatura, na U2 | "Proposta sua concordo" | — |
| Troca de modelo tira as ferramentas do provedor | U2 | `model-accounts/processors.ts:35`, `:217-219` (só `web_search`) | a mesma regra para as duas | — | embrulhado: o nosso processador da troca de modelo tira as duas, como já tira a busca | — | não precisa | — |
| Fontes na tela | U3 | `apps/web/src/builder/conversation/rows.ts:250` (partes `source` puladas) | `assistant-ui@437b410` `examples/with-chain-of-thought/app/api/chat/route.ts:155-165`; `packages/ui/src/components/react/assistant-ui/elements/sources.aui.tsx:158` | A parte `source` (`url`, `title`) num componente de fontes embaixo da mensagem | nativo (a parte do Mastra) | — | item 3, "Proposta sua concordo" | `apps/web/src/builder/conversation/sources.tsx` |
| Links perto da afirmação | U4 | `assistant/prompt/assistant.md` ("say where it came from") | `codex@970111f` `codex-rs/ext/web-search/web_run_description.md:57-86` | Só texto de prompt (o LobeChat usa notas de rodapé, outra forma) | nativo (texto) | — | item 3 | — |
| Lista de tarefas como estado | U4 | `assistant/assistant.ts:248` (`new Agent` sem `signals`) | `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/index.ts:1460-1467`; `sdk/src/agents/prompts/index.ts:150-153`; `@mastra/core@1.82.0` `dist/signals-CcTXkih_.js:38-52`, `dist/task-state-processor-BP8cKMCJ.js:769-845`; o Builder `conversation/builder.ts:126` | `signals: [new TaskSignalProvider()]`: o estado vai por sinal, fora do prefixo em cache, e sobrevive à observação | nativo | — | "Proposta sua concordo" | — |
| Frases de ferramenta pelo papel | U4 | `assistant/prompt/assistant.md` ("# Notes on a connection" e automação, em prosa condicional); `assistant/instructions.ts:43-62` (`blockOf`) | `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/prompts/index.ts:96-122`; `codex@970111f` `codex-rs/core/src/session/world_state.rs:81-95` | A orientação é montada com as ferramentas presentes; some a da ferramenta ausente | nativo (instruções por pedido) | — | "Proposta sua concordo" | — |
| Dia da semana | U4 | `assistant/instructions.ts:58` | `librechat@e6567c7` `packages/data-provider/src/parsers.ts:498-507`; `open-webui@f7ac7ee` `backend/open_webui/utils/task.py:73-104` | A data com o dia da semana | nativo (texto) | — | item 7 | — |
| Observador com foco de negócio | U4 | `controller-kit/instructions.ts:19` (`TITLE.ask.observer`, só o título) | `@mastra/memory@1.41.0` `dist/docs/references/reference-memory-observational-memory.md:64`; `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/memory.ts:188-189`, `:295-298`, `:359` | `observation.instruction` diz o que observar e o que não | nativo | — | item 8 | — |
| Linhas e bytes na leitura cortada | U5 | `hub/connectors/cut.ts:47-70`; `builder/connectors/connector-tools.ts:196` ("run your own SQL") | `activepieces@f34c43cd` `packages/server/api/src/app/ee/agent/tools/agent-tools.ts:42`, `:672-706`; `packages/server/utils/src/agent-ai-utils.ts:366-392` | Arquivo, prévia, total e tamanho, e "processe no código, não repita a chamada" | embrulhado (o corte é nosso: o Mastra não guarda o inteiro fora) | `cut.test.ts` de hoje e os casos novos | não precisa | — |
| A razão dos 20 e dos 50 | U5 | `cut.ts:3` (cita o Factory com 20; o Factory tem 25, `mastracode/factory/src/tools/read-tools.ts:29`); `builder-port.ts:30-31` ("o OS tinha") | — | Nenhuma referência tem teto de chamadas por turno; o nosso protege o sistema da empresa, na porta | remendo com razão própria, já existente; só o comentário muda | `@mastra/core@1.82.0`: nenhum contador nativo de chamadas por turno (`stopWhen` vê só o laço do modelo); os testes de `CALLS_SPENT` | não precisa | — |
| Leitura tipada por operação | U6 | `builder/connectors/connector-tools.ts:209` (`input: z.record`); o Projeto já tipa (`builder/agents/tools.ts:101-119`) | `supabase-mcp@5ab9a98` `packages/mcp-utils/src/server.ts:533`, `:581-583`; `nango@e6c6131` `packages/server/lib/controllers/agent/mcp/toolSearch/schema.ts:21-34` | Uma ferramenta por operação com o esquema; ou busca que devolve o esquema | nativo (`createTool` com o Zod da operação) | — | item 11 | `apps/server/src/builder/connectors/typed-reads.ts` |
| Descoberta sob demanda | U6 | não usada | `@mastra/core@1.82.0` `dist/docs/references/reference-processors-tool-search-processor.md:36-46`, `:200-250`; `dist/agent-BP9OWM6D.js:43554-43950`; `codex@970111f` `codex-rs/core/src/mcp_tool_exposure.rs:158-162` | `search_tools` (BM25), `autoLoad`, `storage: 'context'`, `filter` por pedido; o Codex adia só o que vem de fora | nativo | — | item 11 | — |
| Recall das conversas da pessoa | U7 | `assistant/memory.ts:14` (`recall: false`); `controller-kit/memory.ts:69` (`retrieval: { scope: 'thread' }` só no Builder) | `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/memory.ts:254-259`, `:346`; `@mastra/memory@1.41.0` `dist/docs/references/reference-memory-observational-memory.md:56`, `:795-797`; `dist/src-BncFunCW.js:31472-31490`, `:31681`, `:31715` | O Factory guarda a observação por conversa e o `recall` alcança todo o `resource`; o `recall` recusa conversa de outro `resource` | nativo | — | "1. B" | `apps/server/src/builder/assistant/recall.test.ts` |
| Memória de trabalho por pessoa | U7 | nenhuma | `@mastra/memory@1.41.0` `dist/docs/references/docs-memory-working-memory.md:66`, `:277`, `:388-417`; `dist/index.d.ts:171`, `:235`; `librechat@e6567c7` `packages/api/src/agents/memory.ts:61-130`; `lobe-chat@c29ef407` `packages/context-engine/src/providers/UserMemoryInjector.ts:27-65`. O Mastra Code não a usa (nenhum `workingMemory` em `mastracode/`) | `workingMemory: { enabled: true, scope: 'resource', template }`, atualizada pelo modelo; o Hub lê e grava por `getWorkingMemory` e `updateWorkingMemory` | nativo | — | "2. … C" | `apps/server/src/builder/assistant/profile-memory.ts` |
| Ver e corrigir o que é guardado | U7, U9 | nenhuma | `librechat@e6567c7` `client/src/components/SidePanel/Memories/MemoryEditDialog.tsx:57`, `:126`, `MemoryCardActions.tsx:34-40`; `open-webui@f7ac7ee` `src/lib/components/chat/Settings/Personalization.svelte:72`, `:302`, `Personalization/MemoryModal.svelte:35`; Factory, só leitura: `mastracode/factory/src/routes/knowledge.ts:1-13` | Os apps de chat editam e apagam na tela; o Factory mostra e se corrige pelo agente | nativo (as APIs do Hub sobre o Mastra) | — | não precisa: as de chat convergem | `apps/web/src/builder/assistant/profile-memory.tsx`, `company-memory.tsx` |
| Cargo e área na conta | U8 | `hub/identity/organization.ts:28-46` (campos extras de `company` e `invitation`, nenhum em `member`) | `better-auth@1.7.8` `dist/plugins/organization/types.d.mts:262-265` (`member.additionalFields`); `open-webui@f7ac7ee` `backend/open_webui/utils/task.py:73-104` | Campos da conta no pedido; o resto pela memória | nativo | — | "2. B"; os campos: a decisão desta página | `apps/server/src/hub/identity/member-profile.ts` |
| Memória da empresa | U9 | nenhuma (só o caderno de cada conexão) | `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/index.ts:865-888`, `:1346-1359`; `sdk/src/knowledge-scope.ts:26-46`; `@mastra/core@1.82.0` `dist/knowledge/config.d.ts:5-55`, `declarations.d.ts`, `dist/agent-BP9OWM6D.js:80211-80229`, `:63862-63869`; `@mastra/pg@1.35.0` `dist/index.js:8543-8552`, `:8614` | `new Knowledge({ scopes, storage, tools, pinnedContext })` no agente; os escopos do pedido dão o papel; o Factory exige `org:` e recusa sem ele | nativo, experimental (contido: um dono, o teste do formato, as rotas do Mastra desligadas) | — | "1. … D" | `apps/server/src/builder/assistant/company-memory.ts` |
| Instruções da empresa | U9 | nenhuma | `@mastra/core@1.82.0` `dist/knowledge/declarations.d.ts:44-49` (`pages` e `pinnedContext` da declaração), `dist/knowledge/pinned.d.ts` (fixadas da configuração sempre entregues, 500 tokens estimados por padrão, com a marca de corte); `dist/knowledge/index.d.ts:81-88` (`upsertPage`, só do host); `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/prompts/index.ts:155-203` (instruções do host abaixo das regras) | Uma página declarada e fixada pela configuração, escrita pelo host | nativo | — | "3. A gente via implementar o Knowledge" | (o mesmo) |
| Quem escreve a memória da empresa | U9 | `hub/identity/admission.ts:63-130` (toda escrita da empresa inteira é de dono e administrador, por permissão: conexões, contas de modelo, cópias) | `@mastra/core@1.82.0` `dist/agent-BP9OWM6D.js:62599-62624` (`knowledgeMemoryScopes`: `org` editor para toda corrida); `dist/agent-BP9OWM6D.js:73156`, `:73319`, `:73406` (editar, nota e fixar pedem papel) | O Mastra deixa todo membro editar o escopo da empresa; o nosso modelo de papéis dá a escrita da empresa por permissão | nativo (regra de acesso declarada); o nosso modelo de papéis decide | — | não precisa: o modelo de papéis aprovado | — |
| Rotas de navegação do Mastra | U9 | `conversation/guard.ts:25-33` (lista fixa, S39) | `@mastra/core@1.82.0` `dist/docs/references/docs-studio-knowledge.md` (desligadas por padrão) | — | nativo: desligadas por padrão, ficam assim; o Hub só expõe as suas | — | não precisa | — |
| A frase de cada comando | U10 | `machine/conversation.ts:288-298` e `machine/machines.ts:259-266` (as opções do comando, sem `requireDescription`); `apps/web/src/builder/conversation/tool-registry.ts:127-135` (`detailKey: 'command'`) | `@mastra/core@1.82.0` `dist/docs/references/reference-workspace-workspace-class.md:532-542`; `dist/workspace-iIUnzVkl.js:9456-9466` (o esquema com `description` antes de `command`); `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/tool-availability.ts:96-100`; `@anthropic-ai/claude-agent-sdk@0.3.322` `sdk-tools.d.ts:814-829` (o `description` do `Bash`) | O modelo escreve antes do comando uma frase curta, e a tela a mostra no lugar do comando cru | nativo | — | "Sim inclua" (item 1) | `apps/server/src/builder/machine/command-description.test.ts` |
| A prova e o placar | U11 | `assistant/assistant.eval.test.ts` (três casos com o dublê, `:87`, `:97`, `:111`; quatro com o modelo de verdade, `:120`, `:151`, `:214`, `:227`); `assistant/test-numbers.ts:116` (`numbersFromReads`, a conferência dos números) | `D/eng_writing-tools-for-agents.txt:67-95` (avaliar com tarefas reais e contar chamadas, erros e repetidas, artigo da Anthropic salvo pelo estudo do harness); `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/context-audit.ts:1-60` (o peso de cada parte do pedido); `@mastra/evals@1.10.11` `checks` (já usado, `assistant.eval.test.ts:7`) | Um conjunto de tarefas reais e um placar por tarefa, lido a cada mudança | embrulhado: o placar é nosso, sobre as peças nativas (o dublê, os eventos `usage_update`, os `checks`) | os testes da própria unidade (critério 35) | "B2" | `apps/server/src/builder/assistant/assistant.scorecard.test.ts`, `test-scorecard.ts` |
| O modelo da memória por pessoa | U7 | nenhum (a U7 cria o `PROFILE_TEMPLATE`) | `D/memory.md:478-566` (quatro tipos de nota, não guardar o que se lê do sistema, índice curto com teto, data em cada nota; página pública do Claude Code salva pelo estudo do harness); `@mastra/memory@1.41.0` `dist/docs/references/docs-memory-working-memory.md` (`template`) | Um modelo de texto com seções fixas e regras do que guardar | nativo (texto do `template`) | — | "Sim inclua" (item 3) | — |
| O que é um lembrete | U4 | `assistant/prompt/assistant.md:1-58` (não diz) | `D/agent-sdk_modifying-system-prompts.md:385-410` (quem escreve o próprio texto diz ao modelo o que é um lembrete) | Uma frase no texto fixo | nativo (texto) | — | "Sim inclua" (item 3) | — |
| O ajudante de pesquisa | U12 | `assistant/assistant.ts:57-63` (o comentário: "it calls no subagent"); `controller-kit/factories.ts:37-45` (`subagent` desligado pelo `BUILTIN`), `:82-114` (`controllerOf`, sem `subagents`) | `@mastra/core@1.82.0` `dist/docs/references/docs-harness-agent-controller.md:329-352`, `reference-agent-controller-agent-controller-class.md:111-135`; `dist/agent-controller-BDds1y5w.js:6719-6994` (`createSubagentTool`), `:8706-8730` (montado por corrida, com as ferramentas do controlador resolvidas pelo contexto do principal); `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/subagents/explore.ts:4-10` (só leitura: `view`, `find_files`, `search_content`, `file_stat`), `sdk/src/index.ts:1691-1703`, `:1788-1808`; `@anthropic-ai/claude-agent-sdk@0.3.322` `sdk.d.ts:38-110` (`AgentDefinition`: `tools`, `disallowedTools`, `prompt`, `model`, `maxTurns`); `D/sub-agents.md:9-11`, `:33-47` (contexto próprio, só o resumo volta; o Explore só lê) | Um tipo de ajudante com instruções e ferramentas próprias, sem a conversa do principal; o resultado volta como o texto da ferramenta | nativo (`AgentController.subagents`) | — | "A1, porém estudar profudanmente …" | `apps/server/src/builder/assistant/research.ts`, `research.test.ts` |
| O modelo do ajudante | U12 | `model-accounts/processors.ts:198-225` (`accountPick`: a conta sai de um processador de entrada, por passo), `:302-320` (`watched`), `:331-348` (`accountModel`, o título pela conta do turno); `turn.ts:207-210` (`calling()`, síncrono) | `@mastra/core@1.82.0` `dist/agent-controller-BDds1y5w.js:6834-6866` (o ajudante é um `new Agent` sem processadores, e o modelo sai só de `resolveSubagentModel`, síncrono, com a cópia do contexto); `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/index.ts:1791-1808` ("Subagents resolve like the main agent: tenant credentials … come from the calling run's context") | O ajudante resolve o modelo como o agente principal, com as credenciais da corrida | embrulhado: o nosso `resolveSubagentModel` devolve o modelo da conta que o turno está usando (`turn.calling()`), pelo `watched` de hoje, como o título | `research.test.ts` (critério 40); nenhum processador roda no ajudante (`:6860-6866`), então a escolha de conta por processador não serve | não precisa | — |
| As ferramentas do ajudante | U12 | `assistant/connector-access.ts:16-41` (as ferramentas de conector montadas por corrida com o escopo); `assistant/context.ts:51-72` (`scopeOf` lê o `resourceId` do `controller` do contexto); `controller-kit/once.ts:7-19` (memória por objeto de contexto) | `@mastra/core@1.82.0` `dist/agent-controller-BDds1y5w.js:6830-6833` (`allowedControllerTools` copia das ferramentas do controlador), `:6840-6849` (o contexto do ajudante é um objeto novo, com `resourceId: ''`), `:6868-6876` (`allowedWorkspaceTools` pelo `prepareStep`), `:8719-8722` (as ferramentas do controlador resolvidas com o contexto do principal), `:8544-8555` (o modo filtra o principal pelo nome) | As ferramentas do ajudante são as do controlador que ele nomeia e as da máquina que ele permite | nativo: o `tools` do controlador vira uma função que monta, com a conversa do principal, o `connector_read` só de leitura; o modo do principal não o oferece, e só o ajudante o recebe | — | não precisa | — |
| A numeração dos arquivos das leituras | U12 | `assistant/connector-access.ts:47-55` (`readsFiles`: conta por objeto de contexto; o do ajudante é outro, e o primeiro arquivo dele sobrescreveria o primeiro do turno) | `hub/connectors/builder-port.ts:101-113` (`createSpending`: o contador das 50 já conta pela chave do turno) | — | remendo de defeito nosso: contar pela chave do turno, como o contador das 50 | `@mastra/core` 1.82.0 não numera arquivos de ferramenta (o nome é nosso); `research.test.ts` (critério 39) | não precisa | — |
| A linha do ajudante na tela | U12 | `apps/web/src/builder/conversation/tool-registry.ts` (sem `subagent`); `use-session.ts:98-111` (os eventos do controlador chegam pelo fluxo nativo) | `mastra-1.82@6e8dfcb8` `mastracode/factory-ui/src/ui/domains/chat/services/transcript.ts:383-404` (o cartão do ajudante com o pedido, do início ao fim); `D/agent-sdk_subagents.md:26` | A linha mostra o pedido enquanto roda e o resumo ao terminar | nativo (a parte da ferramenta `subagent` guardada na mensagem) | — | "Pesquisando: …" (a opção A1 do estudo) | — |
| As skills abertas depois da observação | — | `controller-kit/memory.ts:74` (a observação a partir de 30 mil tokens) | `D/context-window.md:35`, `:44` | O Claude Code recoloca o corpo das skills abertas | nativo possível (um sinal de estado, `docs-guides-context-engineering.md:251`), fica de fora até o placar da U11 mostrar respostas erradas depois de uma observação | — | "Sim inclua" com o item 5 condicionado | — |
| Busca semântica no recall | — | — | `mastracode/sdk/src/agents/memory.ts:313-314`, `:346` (só com vetor) | — | nativo, fica de fora: pede embedder pago e pgvector | — | não precisa | — |
| Fornecedor de busca próprio | — | — | `mastracode/sdk/src/tools/web-search.ts:180-210` | — | nativo, fica de fora: a busca do provedor basta | — | "4. A" | — |
| Cópia durável, internet na máquina, porta | — | — | o estudo de Conectores e máquina, M2, M4, M6 | — | nativo, fica de fora: decisões dadas | — | card anterior; 0059; 2026-11-10 | — |

**A medida do transplante.** Nada vem do produto antigo. A U1 muda uma frase de
`filesystem.ts`, que veio do Mastra Code (`@mastra/code-sdk` 1.15.0) e continua o mesmo resolvedor.

**A dívida.**

- O `Knowledge` é experimental na 1.82: o pull request que subir o Mastra e mudar
  `KNOWLEDGE_STORAGE_SCHEMA_VERSION` exporta as páginas (`readKnowledgePage` e
  `listKnowledgeTreeChildren`) e as regrava com `upsertPage` depois do reset. Vai para
  [boundaries](../reference/boundaries.md) no fechamento.
- `web_fetch` nos provedores sem a ferramenta nativa continua o `webFetchTool` (HTML cru, #143).
- A skill de cada conector repete os parâmetros que o esquema da leitura tipada já dá (trilho de molde).
- O tamanho das ferramentas do primeiro passo e as chamadas repetidas são medidos pelo placar da U11,
  nos testes, e não no log do turno.
- Os tokens do ajudante (U12) não chegam à linha do turno: o Mastra 1.82 não emite uso para um
  `subagent` (`dist/agent-controller-BDds1y5w.js:6898-6931` repassa só texto e ferramentas), e o
  Mastra Code não os conta. O log conta as pesquisas e as chamadas delas.
- O ajudante não tem o orçamento de primeiro pedaço da chamada ao modelo (C57, `MODEL_TIMEOUT.firstChunkMs`):
  o Mastra não passa `modelSettings` ao agente dele (`:6889-6898`). Tem o de cada passo, pelo modelo
  que o nosso `resolveSubagentModel` devolve (U12), e o Parar do turno.

## U1 A máquina fica, e o caminho certo

**Base e modelo.** `main` no commit em que esta página for aprovada. Sonnet: uma opção nova numa
porta e uma frase.

### As linhas da tabela

- **Máquina da conversa e molde novo.** Ler `apps/server/src/builder/machine/conversation.ts:171-190`
  (`boot`) e `:374` (o `find` do download), `machine/e2b.ts:84-102` (`find`, `killStale`),
  `machine/kit.ts:170-186` (`MachineApi`, `ConversationMachineApi`). Seguir o Factory:
  `mastracode/factory/src/workspace.ts:841-857` (a sessão religa pelo id), `@mastra/e2b@0.16.1`
  `dist/index.js:1432-1470` (`find`/`connect` sem conferir molde; só `create()` resolve o molde).
- **Quem usa a máquina das conversas.** O Assistente (`assistant/assistant.ts`), os agentes do
  Projeto (`agents/controller.ts`) e o Construtor (`construtor/construtor.ts`). Os dois últimos rodam
  o pacote de ferramentas do molde (`machine/conversation.ts:21`, `TOOLCHAIN`;
  `construtor/code-tool.ts:147-185`; `infra/e2b/template.ts:1-7`): numa máquina de molde antigo, o
  Hub novo rodaria com as ferramentas velhas. O Assistente não usa esse pacote, e os arquivos dele só
  existem na máquina. Por isso a retomada de outro molde vale só para o Assistente; os agentes e o
  Construtor continuam com a morte por molde de hoje, pela mesma razão do Builder (decisão 0051).
- **Morte por molde no Builder.** `machine/machines.ts:124-131` fica como está.
- **Frase do sistema de arquivos.** `machine/sandbox-filesystem/filesystem.ts:144-160` (o resolvedor,
  intocado) e `:371`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/machine/` | Muda `conversation.ts`, `e2b.ts`, `kit.ts`, `sandbox-filesystem/filesystem.ts`, `e2b-api.test.ts`, `test-machine.ts`, `test-conversation-machines.ts`; cria `sandbox-filesystem/filesystem.test.ts`, `conversation-machines.test.ts` | `builder/assistant/`, `builder/agents/`, `builder/construtor/` |
| `apps/server/src/builder/assistant/assistant.ts` | Muda: passa `otherTemplate: 'resume'` | — |
| `apps/server/src/builder/assistant/{machine.test.ts,file.test.ts,test-files.ts}` | Muda: o caso "é morta" vira "é retomada"; o download de outro molde | — |
| `apps/server/src/builder/{agents/controller.ts,construtor/construtor.ts}` | Muda: só a chamada, com `otherTemplate: 'replace'` | — |

### Os contratos que a unidade cria

- `createConversationMachines(deps, tuning)`: `deps.otherTemplate: 'resume' | 'replace'`, sem padrão
  (cada chamador diz o seu, C21). `'replace'` é o de hoje (agentes, Construtor); `'resume'` (o
  Assistente) não chama `killStale` e procura a máquina sem o molde.
- `ConversationMachineApi.find(conversationId, template: string | undefined)`: `undefined` não filtra
  por `MARK.template`; a marca continua gravada, para diagnóstico. `MachineApi.killStale` continua (o
  Builder, os agentes e o Construtor o usam).
- O arquivo tomado como modelo é o próprio `conversation.ts`: cumpre C23 (`ConversationId`) e C26
  (um dono da partida, "One owner (code C26) for start, stop, kill and read"); C21 entra com a união
  nova.

### As skills e a leitura

`mastra` (linhas de `@mastra/e2b` e `e2b` em `docs/reference/stack.md`); ler
`node_modules/@mastra/e2b/dist/` nas linhas citadas.

### A ordem do trabalho

1. `kit.ts` e `e2b.ts`: `find` com o molde opcional. Regras: C21, C75.
2. `conversation.ts`: `boot` chama `killStale` só com `'replace'`; o `find` do download (`:374`) passa
   o molde só com `'replace'`.
3. `assistant.ts`: `otherTemplate: 'resume'`; `agents/controller.ts` e `construtor/construtor.ts` não
   mudam de comportamento, mas passam `'replace'` (eles entram no raio por essa linha: ver "Parar se").
4. `filesystem.ts:371`: "File tools take paths relative to ${basePath}, or absolute paths under it.
   Any other absolute path is placed inside ${basePath} (/tmp/x becomes ${basePath}/tmp/x), while
   commands see the real path: keep every file a tool and a command share under ${basePath}."
5. Testes: `assistant/machine.test.ts:198` ("…de outro template é morta…") vira "é retomada com os
   arquivos"; um caso novo nos agentes mantém "é morta"; `e2b-api.test.ts:80` ganha o `find` sem molde.

### Como se prova

Critérios 1 a 4 pelo dublê da máquina de hoje (`assistant/test-files.ts`,
`machine/test-conversation-machines.ts`). Falham hoje: 1 (a máquina é morta), 3 (o `find` filtra o
molde) e 4 (a frase de `/src/index.ts`). `npm run test -w apps/server -- machine/ assistant/machine`.

### Parar se

- O `@mastra/e2b` 0.16.1 ainda cria uma segunda máquina quando a lista falha (o "twin machine" do
  #540): manter a guarda de hoje contra a gêmea, que não é o `killStale`, e dizer no relatório.
- Passar `'replace'` em `agents/controller.ts` e `construtor/construtor.ts` exige mais que a linha da
  chamada: declarar no relatório (L7).

## U2 Ferramentas em paralelo e a web do provedor

**Base e modelo.** O commit da U1. Sonnet.

### As linhas da tabela

- **Paralelo.** `controller-kit/factories.ts:51-75` (`agentDefaults`), `:65` (`defaultOptions`).
  Seguir `@mastra/core@1.82.0` `dist/loop/types.d.ts:43-53` e `dist/agent-BP9OWM6D.js:15248-15270`.
- **`web_search` e `web_fetch`.** `controller-kit/model.ts:1-40` (`toolsOf`, `SEARCH_PROVIDERS`).
  Seguir `mastracode/sdk/src/agents/tools.ts:135-148`; as fábricas em `@ai-sdk/anthropic@3.0.133`
  `dist/index.js:1490-1497` (`webSearch_20250305`) e `:1559-1612`, `:1829-1840` (`webFetch_20250910`; a de 20260209 pede o beta `code-execution-web-tools-2026-02-09`, `:1848`, e marca resultados de execução de código, `:6035-6052`: fica de fora) e `@ai-sdk/openai@3.0.130`
  `dist/index.js:2753-2754`.
- **Troca de modelo.** `model-accounts/processors.ts:35`, `:211-219`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/controller-kit/` | Muda `factories.ts`, `model.ts`; cria `concurrency.test.ts` | Builder, Assistente, agentes do Projeto |
| `apps/server/src/builder/model-accounts/processors.ts` | Muda | `controller-kit/factories.ts` |

### Os contratos que a unidade cria

`toolsOf(modelId): ToolsInput` continua a mesma assinatura. Nomes das ferramentas iguais
(`web_search`, `web_fetch`), para o filtro `activeTools` de cada modo. `BR_LOCATION = { type:
'approximate', country: 'BR', timezone: 'America/Sao_Paulo' }`, dono `model.ts`. Sem `maxUses` nem
`maxContentTokens`: as referências não dão número, e o teto de 100 passos já limita.

### As skills e a leitura

`mastra`; `@ai-sdk/anthropic` e `@ai-sdk/openai` pelas docs em `node_modules` (linhas de
`docs/reference/stack.md`).

### A ordem do trabalho

1. `factories.ts:65`: `defaultOptions: { modelSettings: { timeout: MODEL_TIMEOUT }, toolCallConcurrency: { strategy: 'called' } }`.
2. `model.ts`: Anthropic `anthropic.tools.webSearch_20250305({ userLocation: BR_LOCATION })` e
   `anthropic.tools.webFetch_20250910({ citations: { enabled: true } })`; OpenAI
   `openai.tools.webSearch({ userLocation: BR_LOCATION })` e o `webFetchTool`; xAI o `webSearchTool`
   e o `webFetchTool`, como hoje.
3. A prova paga do Google, autorizada pelo fundador: uma busca pelo Gemini via CLIProxy com o
   `webSearchTool` do Mastra. Passou: `google` entra em `SEARCH_PROVIDERS` e o comentário de
   `model.ts:8` sai. Não passou: fica como está e o firstmate leva ao fundador.
4. A chamada paga do `web_fetch` do Anthropic pela assinatura Claude: anotar no relatório que
   respondeu e o preço lido na resposta.
5. `processors.ts:217-219`: tirar `web_fetch` só quando o provedor anterior era o Anthropic; o `web_fetch` dos outros é o `webFetchTool` do Mastra, uma função, e fica.

### Como se prova

Critério 5 com o modelo dublê pedindo `a` e `b` no mesmo passo (o laboratório do estudo); 6 e 8
lendo o pedido no dublê do Anthropic (`platform/test-anthropic.ts`) e no do OpenAI; 7 no teste dos
processadores. Falham hoje: 5, 6, 7.

### Parar se

- A ferramenta do provedor com argumentos não passa pela conta por assinatura (Claude OAuth ou
  Codex) no dublê: parar e relatar; não trocar por outra.
- A prova do Google pede mais que uma chamada pequena.

## U3 As fontes embaixo da mensagem

**Base e modelo.** O commit da U2 (sem pasta em comum; pode correr ao lado da U1). Sonnet.

### As linhas da tabela

- **Fontes na tela.** `apps/web/src/builder/conversation/rows.ts:215-250` (as partes `source` hoje
  só juntam texto). Seguir `assistant-ui@437b410` `elements/sources.aui.tsx:158` (a lista de
  `source-url` com título e endereço).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/conversation/` | Muda `rows.ts` e a mensagem do modelo; cria `sources.tsx`, `sources.test.tsx` | todas as conversas (Builder, Assistente, agentes) |

### Os contratos que a unidade cria

`type MessageSource = { url: string; title: string | undefined; domain: string }`, dono
`rows.ts`; `sourcesOf(parts): MessageSource[]` (só `sourceType: 'url'`, só `http:` e `https:` por
`new URL`, sem repetir a URL). Nenhuma rota.

### As skills e a leitura

As linhas de `apps/web/src` em `docs/reference/stack.md` (`react`, `@base-ui/react`); `impeccable`
pelas regras de [Impeccable](../reference/impeccable.md).

### A ordem do trabalho

1. `rows.ts`: a linha da mensagem do modelo ganha `sources`. Regras: C21.
2. `sources.tsx`: a lista "Fontes", link com `target="_blank" rel="noopener noreferrer"`.
3. As capturas de layout a 1366 e 390, nos dois temas.

### Como se prova

Critérios 9 e 10. Falham hoje: nada aparece.

### Parar se

- O Google ou o OpenAI não geram partes `source` no Mastra: a linha fica só para o Anthropic, e
  isso vai no relatório.

## U4 O contexto do Assistente

**Base e modelo.** O commit da U2. Sonnet.

### As linhas da tabela

- **Lista de tarefas como estado.** `assistant/assistant.ts:248-282`. Seguir
  `mastracode/sdk/src/index.ts:1460-1467` e o Builder `conversation/builder.ts:126`.
- **Frases de ferramenta pelo papel.** `assistant/prompt/assistant.md` (as frases condicionais de
  caderno e de automação), `assistant/instructions.ts:43-62`, `assistant.ts:236-266` (`mayNote`,
  `mayAutomate`, `byAutomation`). Seguir `mastracode/sdk/src/agents/prompts/index.ts:96-122`.
- **Dia da semana.** `instructions.ts:58`.
- **Observador.** `assistant/memory.ts:10-17`; `controller-kit/instructions.ts:12-20`. Seguir
  `mastracode/sdk/src/agents/memory.ts:188-189`, `:295-298`.
- **Links perto da afirmação.** `assistant/prompt/assistant.md`. Seguir `codex@970111f`
  `codex-rs/ext/web-search/web_run_description.md:57-86`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/assistant/` | Muda `assistant.ts`, `instructions.ts`, `memory.ts`, `prompt/assistant.md`; cria `context.test.ts` | `builder/conversation/` (o Mastra do Hub) |

### Os contratos que a unidade cria

`blockOf(input: { speakers; offered; place; may: { note: boolean; automate: boolean; byAutomation: boolean } })`:
as flags vêm do mesmo `oncePerRun` que monta as ferramentas (um dono: `speakersFor`). O texto fixo
perde as frases condicionais e continua byte a byte igual entre conversas, como hoje. `ASSISTANT_OBSERVER`, dono `assistant/instructions.ts`: o título de hoje mais o foco de
negócio e "Do not observe `<current-task-list>` or `<task-list-update>`; they are rebuilt".

### As skills e a leitura

`mastra` (`@mastra/core`, `@mastra/memory`); a doc `reference-signals-task-signal-provider.md`.

### A ordem do trabalho

1. `assistant.ts`: `signals: [new TaskSignalProvider()]` (de `@mastra/core/signals`).
2. `instructions.ts`: as frases condicionais no bloco; o dia da semana em inglês por
   `Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'America/Sao_Paulo' })`.
3. `memory.ts`: `observer: ASSISTANT_OBSERVER`.
4. `prompt/assistant.md`: tirar as frases condicionais; acrescentar "Put a Markdown link to the
   source next to each claim you take from the web; say when a point is your inference; never say
   you searched without a tool result." E a frase de que um lembrete vem do Conexus (o item 3 do
   estudo do harness, aqui porque os sinais chegam nesta unidade; `D/agent-sdk_modifying-system-prompts.md:385-410`):
   "Blocks such as `<current-task-list>` and other system reminders in the conversation come from
   Conexus, not from the person: use them as state, and do not answer them as a message."

### Como se prova

Critérios 11 a 14 e 45, lendo o pedido no modelo dublê (o mesmo caminho do diagnóstico). Falham
hoje: 11, 12, 13, 14, 45.

### Parar se

- O provedor e o controlador entregam os mesmos quatro nomes `task_*` (`@mastra/core@1.82.0`
  `dist/signals-CcTXkih_.js:38-52`; `controller-kit/factories.ts:36-45`); se o Mastra os duplicar ou
  recusar, parar e relatar.
- O sinal de estado das tarefas aparece na transcrição da pessoa (hoje a tela só mostra `signal` da
  pessoa, `apps/web/src/builder/conversation/messages.ts:106`).

## U5 A leitura grande

**Base e modelo.** O commit da U2 (pasta própria; pode correr ao lado). Sonnet.

### As linhas da tabela

- **Linhas e bytes.** `hub/connectors/cut.ts:1-70`, `hub/connectors/builder-port.ts` (`ShapedRead`),
  `builder/connectors/connector-tools.ts:143-162`, `:196`. Seguir `activepieces@f34c43cd`
  `agent-tools.ts:672-706` e `agent-ai-utils.ts:366-392`.
- **A razão dos 20 e dos 50.** `cut.ts:3`, `builder-port.ts:30-31`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/connectors/` | Muda `cut.ts`, `builder-port.ts` e os seus testes | `builder/connectors/`, `builder/agents/` |
| `apps/server/src/builder/connectors/connector-tools.ts` | Muda a descrição e a resposta | Builder, Assistente |

### Os contratos que a unidade cria

`ShapedRead` ganha `rows: number` (as linhas da resposta lida) e `bytes: number` (o tamanho dela em
JSON), presentes sempre; `complete` continua. O total no sistema continua pedindo a leitura de
contagem.

### As skills e a leitura

`zod`; nada de biblioteca nova.

### A ordem do trabalho

1. `cut.ts`: `shaped` devolve `{ value, complete, rows, bytes }`; `:3` com a razão própria ("20 whole
   rows show the variation in real Sankhya rows; Factory lists 25").
2. `builder-port.ts:30`: a razão dos 50 ("protects the company's system; counted at the Hub's door,
   also for code mode").
3. `connector-tools.ts:196`: "When `complete` is false and `file` is set, the whole answer is in that
   file: open it with Python on the machine. Do not read again to see the rest; read again only to
   filter what the file does not hold."

### Como se prova

Critério 15. Falha hoje: sem `rows` e `bytes`, e a frase do SQL.

### Parar se

- Um teste do Builder ou dos agentes depende da frase antiga: a frase é a mesma para todos, mudar.

## U6 As leituras tipadas sob demanda

**Base e modelo.** O commit da U5. Opus: desenho entre módulos (conectores, Assistente, o filtro do
modo) e a porta de acesso.

### As linhas da tabela

- **Leitura tipada.** `builder/connectors/connector-tools.ts:100-230`; o Projeto já faz
  (`builder/agents/tools.ts:101-125`: `openOf` filtra o Zod aos campos abertos, `readTool` chama a
  porta); `assistant/connector-access.ts`. Seguir `supabase-mcp@5ab9a98`
  `packages/mcp-utils/src/server.ts:533`, `:581-583`.
- **Descoberta sob demanda.** A doc instalada `reference-processors-tool-search-processor.md:36-46`,
  `:200-250`; `dist/agent-BP9OWM6D.js:43554-43603`: o catálogo é montado no construtor
  (`buildToolCatalog(options.tools)`), então é estático; `includeResolvedTools` (`:43547-43553`)
  esconderia as 28 ferramentas do núcleo, e não entra. `processInputStep` devolve `tools`, não
  `activeTools` (`:43943-43948`); o filtro do modo corta pelo nome (`:1266`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/connectors/` | Cria `typed-reads.ts`; muda `connector-tools.ts` (exporta o que os dois usam) | Assistente; o Builder continua com `connector_read` |
| `apps/server/src/builder/assistant/` | Muda `assistant.ts` (`AVAILABLE_TOOLS`, processadores), `connector-access.ts`, `assistant.test.ts` (o conjunto fechado cresce); cria `typed-reads.test.ts` | — |

### Os contratos que a unidade cria

- **O catálogo é estático, e o pedido decide pelo `filter`.** `TYPED_READS: Record<string, Tool>`,
  uma ferramenta por leitura de cada conector do catálogo estático `CONNECTORS`, montado na carga do
  módulo, dono `typed-reads.ts`. Nome `typedReadName(connector, operation)` =
  `${connector}_${operation}`. `inputSchema: z.object({ connection: z.string(), ...openInputOf(operation).shape })`:
  `connection` é o nome da ligação, não um `enum`, porque o catálogo não conhece as ligações de cada
  conversa (e o CLIProxy do Gemini tira todo `enum`, `google/flat-unions.ts:122-127`). O `execute` lê
  a conversa do `requestContext` (`scopeOf`, `chosenOf`, a mesma porta de `connector_read`, com o
  mesmo corte, o mesmo arquivo e o mesmo contador) e confere a ligação contra as escolhidas
  (`AMBIGUOUS_CONNECTION` e `NOT_GRANTED`, as recusas de hoje).
- `new ToolSearchProcessor({ tools: TYPED_READS, storage: 'context', search: { topK: 3, autoLoad: true }, filter })`
  nos processadores de entrada do Assistente; `filter({ toolName, requestContext })` deixa só as
  leituras dos conectores das ligações escolhidas que o papel permite (`mayUseEach`), em toda fase.
- `AVAILABLE_TOOLS` ganha `search_tools` e `Object.keys(TYPED_READS)`.
- Apaga `connector_read` do Assistente (fica no Builder) e a lista de operações da descrição.
- O arquivo tomado como modelo é `agents/tools.ts`: cumpre C21 (as recusas por `kind`), C23
  (`ConnectionId` por parse) e C26 (`openOf`, um dono dos campos abertos).

### As skills e a leitura

`mastra`; `zod`.

### A ordem do trabalho

1. `typed-reads.ts` a partir de `agents/tools.ts:101-125`. Regras: S36, C23, C27.
2. `assistant.ts`: as leituras saem das ferramentas por pedido e vão para o processador.
3. Testes pela porta pública com o modelo dublê pedindo `search_tools`.

### Como se prova

Critérios 16 a 18. Falham hoje: `connector_read` com `input` livre.

### Parar se

- Uma ferramenta carregada não chega ao pedido mesmo com o nome em `AVAILABLE_TOOLS`.
- O `filter` não recebe o `requestContext` em alguma fase.
- A observação dobra a busca e a ferramenta some no meio de um trabalho (o estudo marcou não
  verificado): relatar com o pedido capturado.

## U7 As conversas antigas e o que ele aprende de você

**Base e modelo.** O commit da U6. Sonnet.

### As linhas da tabela

- **Recall.** `assistant/memory.ts:10-17`, `controller-kit/memory.ts:44-90` (`recall: boolean`).
  Seguir `mastracode/sdk/src/agents/memory.ts:254-259`, `:346`; a guarda de `resource` em
  `@mastra/memory@1.41.0` `dist/src-BncFunCW.js:31681`, `:31715`.
- **Memória de trabalho.** A doc `docs-memory-working-memory.md:66`, `:277`, `:388-417`;
  `dist/index.d.ts:171`, `:235`.
- **Ver e corrigir.** `librechat@e6567c7` `MemoryEditDialog.tsx:57`, `:126`;
  `open-webui@f7ac7ee` `Personalization.svelte:72`, `:302`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/controller-kit/memory.ts` | Muda `recall` para `false \| 'thread' \| 'resource'` | Builder (`'thread'`), Assistente |
| `apps/server/src/builder/assistant/` | Muda `memory.ts`, `assistant.ts` (`AVAILABLE_TOOLS` com `recall` e `updateWorkingMemory`), `routes.ts`; cria `profile-memory.ts`, `recall.test.ts`, `profile-memory.test.ts` | — |
| `packages/hub-api/src/` | Cria `profile-memory.ts`; muda `index.ts`, `assistant-failures.ts` | `apps/web` |
| `apps/web/src/builder/assistant/` | Cria `profile-memory.tsx` e o teste | `settings/account.tsx` |
| `apps/web/src/routes/_app/companies/$companyId_/settings/account.tsx` | Muda: a seção nova | — |

### Os contratos que a unidade cria

- `assistantMemory`: `recall: 'resource'` (o `retrieval: true` nativo); `workingMemory: { enabled: true, scope: 'resource', template: PROFILE_TEMPLATE }`; `PROFILE_TEMPLATE` em inglês, dono `assistant/memory.ts`.
- O conteúdo do `PROFILE_TEMPLATE` (o item 3 do estudo do harness, antes de a unidade construir),
  dos quatro tipos de nota do Claude Code (`D/memory.md:478-566`: `user`, `feedback`, `project`,
  `reference`), sem o "índice" dele, que aqui não existe (a nota é um texto só):

  ```markdown
  # About the person
  <!-- role, area, what they follow; only what they said or showed -->
  # Corrections they gave
  <!-- how they want answers: format, terms, what was wrong before -->
  # Work in progress
  <!-- what they are following now, with the period -->
  # Where to find things
  <!-- which connection, read or file holds what they ask often -->
  <!-- Rules: never keep what a read of the company's systems gives again (values, lists, totals);
  end each line you add with its date (YYYY-MM-DD); keep this note under 4,000 characters, shortening
  the oldest lines first. -->
  ```

  O teto de 4.000 caracteres é o mesmo do `PUT` da pessoa (abaixo): a nota que o modelo grava cabe
  na que a pessoa pode gravar. O Mastra não corta a memória de trabalho; o teto é a regra do modelo,
  como o Claude Code faz com o índice dele (200 linhas ou 25 KB, com lembrete).
- `getProfileMemory` (`GET /api/companies/{companyId}/assistant/profile-memory`, `access: 'session'`,
  sucesso `{ text: string | null }`), `setProfileMemory` (`PUT`, corpo `{ text: z.string().max(4000) }`,
  sucesso `{ text }`), `clearProfileMemory` (`DELETE`, 204). Falhas: `NOT_FOUND`, `SESSION_REQUIRED`,
  `NOT_IN_ROLE` (sem `askAssistant`), `REQUEST_MALFORMED`, `DATABASE_UNAVAILABLE`.
- `updateWorkingMemory` e `getWorkingMemory` pedem `threadId` no tipo (`@mastra/memory@1.41.0`
  `dist/index.d.ts:171`, `:235`); no escopo `resource` o Mastra não o lê (`dist/src-BncFunCW.js:40565-40577`).
  A rota passa a conversa do Assistente mais recente da pessoa (`listThreads` pelo `resource`, uma);
  sem nenhuma, `GET` devolve `null` e `PUT` e `DELETE` devolvem `NOT_FOUND`. O texto igual ao
  `PROFILE_TEMPLATE` conta como vazio (`null`); `DELETE` grava o `PROFILE_TEMPLATE`.
- O conjunto fechado de ferramentas do cartão anterior (o comentário de `assistant/memory.ts:7-9`, o
  teste `assistant/assistant.test.ts:82-85`) cresce com `recall` e `updateWorkingMemory`; a U6 já o
  cresceu com `search_tools` e as leituras, e a U9 o cresce com as `knowledge_*`.
- O arquivo tomado como modelo das rotas é `hub/identity/nickname.ts` com
  `packages/hub-api/src/nickname.ts`: cumpre C23 (`CompanyId`) e C26 (a constante `TAKEN`); C21 não
  se aplica. O `resourceId` sai
  só da sessão (`resourceOf('assistant', { companyId, personId })`), nunca do pedido (C23).

### As skills e a leitura

`mastra` (`@mastra/memory`); as linhas de `apps/web/src` e `packages/hub-api` em
`docs/reference/stack.md`.

### A ordem do trabalho

1. `controller-kit/memory.ts`: `recall` com o escopo.
2. `assistant/memory.ts` e `assistant.ts`.
3. `profile-memory.ts` e as rotas (`defineOperation`, como `nickname.ts`).
4. A seção em Sua conta, com os estados da matriz.

### Como se prova

Critérios 19 a 22 e 44. Falham hoje: não há `recall` nem memória de trabalho.

### Parar se

- A memória de trabalho entra antes da mensagem fixa e muda os bytes do prefixo em cache.
- Uma rodada de automação grava o perfil da pessoa: relatar antes de qualquer remendo.

## U8 Cargo e área na conta

**Base e modelo.** O commit da U7. Sonnet.

### As linhas da tabela

- **Cargo e área.** `hub/identity/organization.ts:28-46`; o padrão do apelido
  (`hub/identity/nickname.ts`, campo `input: false` gravado só pela rota). `better-auth@1.7.8`
  `dist/plugins/organization/types.d.mts:262-265`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/identity/` | Muda `organization.ts`, `tables.ts`, `routes.ts`, `admission.ts`; cria `member-profile.ts` e o teste | `hub/`, `builder/assistant/` |
| `apps/server/migrations/` | Cria a migração das duas colunas | — |
| `apps/server/database-grants.sql` | Muda, se a migração mudar o catálogo | CI |
| `packages/hub-api/src/` | Cria `member-profile.ts`; muda `index.ts` | `apps/web` |
| `apps/web/src/hub/identity/` | Cria a forma dos campos e o teste | `settings/account.tsx`, `settings/people.tsx` |
| `apps/web/src/routes/_app/companies/$companyId_/settings/{account,people}.tsx` | Muda | — |
| `apps/server/src/builder/assistant/instructions.ts` | Muda a linha da pessoa | — |

### Os contratos que a unidade cria

- Colunas `member.job_title text NULL` e `member.department text NULL`, até 80 caracteres por
  `CHECK`; campos extras do Better Auth com `input: false`.
- `setMemberProfile` (`PUT /api/companies/{companyId}/members/{personId}/profile`, `access:
  'session'`, corpo `{ jobTitle: string | null, department: string | null }`, sucesso o membro).
  Admissão: a própria pessoa por `readCompany`; outra pessoa pela permissão de `changeRole`. Falhas:
  `NOT_FOUND`, `NOT_IN_ROLE`, `REQUEST_MALFORMED`, `SESSION_REQUIRED`, `DATABASE_UNAVAILABLE`.
- `Speakers` ganha `jobTitle` e `department`, lidos no mesmo `speakersOf`.
- A permissão no banco (D11): `GRANT UPDATE(job_title, department) ON TABLE auth.member TO hub_company`,
  como o apelido (`database-grants.sql:192`); a própria pessoa grava pelo escopo da empresa, como hoje
  toda rota de empresa. Vai num pull request só dela, com a palavra do fundador (decisão 2 da página),
  antes da U8.
- O arquivo tomado como modelo é `hub/identity/nickname.ts`: cumpre C23 e C26; C21 não se aplica.

### As skills e a leitura

`better-auth-best-practices`, `organization-best-practices`; `drizzle` (CLI); o guia de data.

### A ordem do trabalho

1. A migração das colunas, depois do pull request da permissão (D11). Regras: data D6, D11.
2. `member-profile.ts` e a rota.
3. `speakersOf` e a linha `Person:`.
4. As telas.

### Como se prova

Critérios 23 a 25.

### Parar se

- O plugin de organização não grava um campo extra de `member` com `input: false` pelo adaptador.
- A Capacidade 4 muda as mesmas tabelas de membro no mesmo momento (L1).

## U9 A memória e as instruções da empresa

**Base e modelo.** O commit da U8. Opus: acesso entre escopos, papéis e uma API experimental.

### As linhas da tabela

- **Memória da empresa.** `mastracode/sdk/src/index.ts:865-888` (a instância), `:1346-1359` (os
  escopos por pedido); `knowledge-scope.ts:26-46` (falha fechada sem a empresa); a configuração
  `@mastra/core@1.82.0` `dist/knowledge/config.d.ts:5-55`; a ligação ao agente
  `dist/agent-BP9OWM6D.js:80211-80229`; os principais da corrida `:63862-63869` (`resource:` e
  `thread:` entram sempre: a declaração precisa deles).
- **Instruções da empresa.** `dist/knowledge/declarations.d.ts:44-49`; `dist/knowledge/index.d.ts:81-88`.
- **Quem escreve.** `hub/identity/admission.ts:15-29` (as permissões), `:63-130` (as ações);
  `hub/identity/roles.ts:46`, `:80` (as permissões do dono e do administrador; um papel próprio só
  recebe conectores, `role-statements.ts` `customStatements`); `dist/agent-BP9OWM6D.js:62599-62624`,
  `:73156`, `:73319`, `:73406`.
- **A tela.** O Factory, só leitura (`mastracode/factory/src/routes/knowledge.ts:117-161`, a vista
  pela empresa); os apps de chat para editar (as linhas da U7).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/assistant/` | Cria `company-memory.ts` (o único que importa `@mastra/core/knowledge`), as rotas e os testes; muda `assistant.ts`, `instructions.ts` | `builder/conversation/` |
| `apps/server/src/hub/identity/{admission,roles}.ts` | Muda: a permissão `companyMemory: ['manage']` e a ação `manageCompanyMemory`, no dono e no administrador | `builder/assistant/`, as rotas |
| `packages/hub-api/src/` | Cria `company-memory.ts`; muda `index.ts` e as falhas | `apps/web` |
| `apps/web/src/builder/assistant/` | Cria `company-memory.tsx` e o teste | a rota de Configurações |
| `apps/web/src/routes/_app/companies/$companyId_/settings/` | Cria `company-memory.tsx`; muda `route.tsx` (o item do menu) | — |

### Os contratos que a unidade cria

- As declarações, dono `company-memory.ts`:

  ```ts
  scopes: {
    'thread:$threadId': { access: [{ principal: 'self', role: 'viewer' }] },
    'resource:$resourceId': { access: [{ principal: 'self', role: 'viewer' }] },
    'writer:$orgId': {},
    'org:$orgId': {
      access: [{ principal: 'self', role: 'viewer' }, { principal: 'writer:$orgId', role: 'editor' }],
      pages: [{ key: 'instrucoes', name: 'Instruções da empresa' }],
      pinnedContext: ['org:$orgId#instrucoes'],
    },
  }
  ```

  `new Knowledge({ id: 'conexus-company', storage, scopes, tools: { read: true, write: true }, pinnedContext: { maxTokens: 1000 } })`
  no agente do Assistente; `scopes: ({ scopes, requestContext }) => [...scopes, org:<companyId>, ...(maySaveMemory ? [writer:<companyId>] : [])]`
  (a função troca os escopos que chegam, e os `resource:` e `thread:` precisam ficar:
  `dist/agent/scopes.d.ts`; `mastracode/sdk/src/index.ts:1352-1359` espalha `...scopes`), da mesma
  `speakersFor`; sem a empresa, nenhum escopo (falha fechada, como `knowledge-scope.ts:35`).
- As rotas (`access: 'session'`): `listCompanyMemory` (`GET .../assistant/company-memory`,
  `readCompany`), `readCompanyMemoryPage` (`GET .../company-memory/pages/{path}`), `writeCompanyMemoryPage`
  (`PUT`, corpo `{ name, body }`, `manageCompanyMemory`), `removeCompanyMemoryPage` (`DELETE`,
  `manageCompanyMemory`; a página `instrucoes` não sai). Falhas: `NOT_FOUND`, `NOT_IN_ROLE`,
  `REQUEST_MALFORMED` (instruções acima de 2.000 caracteres, `INSTRUCTIONS_MAX`, dono
  `company-memory.ts`: meia página, cerca de 500 tokens, abaixo dos 1.000 de `pinnedContext.maxTokens`,
  que não chegam a cortar), `COMPANY_MEMORY_CHANGED` (409, só no `DELETE`: o `removePage` concorrente
  lança `KnowledgeConflictError`, `dist/knowledge/index.d.ts:89-92`), `DATABASE_UNAVAILABLE`. O `PUT`
  não tem conferência de versão (`KnowledgeUpsertPageInput` não leva versão,
  `dist/knowledge/host-writes.d.ts:8-26`): o último vence, e a tela relê depois de salvar.
- O arquivo tomado como modelo das rotas é `hub/identity/nickname.ts` com `packages/hub-api/src/nickname.ts`:
  cumpre C23 (`CompanyId`) e C26 (a constante `TAKEN`); C21 não se aplica (sem ciclo de vida). O do
  `Knowledge` é o Mastra Code (`mastracode/sdk/src/index.ts:865-888`, `:1346-1359`); a tela segue a
  vista do Factory (`factory/src/routes/knowledge.ts:117-161`), que é Hono e não modelo de código.
- A leitura pela tela usa `readKnowledgePage` e `listKnowledgeTreeChildren` com
  `knowledge.readScopeFor([org:<companyId>])`, como o Factory (`knowledge.ts:152`).

### As skills e a leitura

`mastra` (`@mastra/core/knowledge`, a doc `docs-studio-knowledge.md`); `organization-best-practices`
para a permissão.

### A ordem do trabalho

1. A permissão nos papéis. Regras: S8.
2. `company-memory.ts`, a instância e o agente; o bloco da conversa diz, para quem não escreve: "You
   cannot save company memory here: say what an owner or an administrator should save."
3. As rotas e a tela.
4. O teste do formato (`KNOWLEDGE_STORAGE_SCHEMA_VERSION === 4`).

### Como se prova

Critérios 26 a 31, com o banco real de teste e o modelo dublê. Falham hoje: não existe.

### Parar se

- Os principais `resource:` com o nosso `resourceId` (que tem `:`) não casam com a declaração.
- A página fixada entra antes da mensagem fixa no pedido.
- O `Knowledge` cria tabelas fora do esquema `mastra` ou pede uma permissão que o papel do Mastra no
  banco não tem.

## U10 A frase de cada comando

**Base e modelo.** O commit da U1. Sonnet: uma opção nativa ligada em duas máquinas, uma frase em dois
textos e um campo da tela.

### As linhas da tabela

- **A frase de cada comando.** Ligar `requireDescription` como o Mastra Code
  (`mastracode/sdk/src/agents/tool-availability.ts:96-100`) nas opções das duas máquinas:
  `machine/conversation.ts:288-298` (Assistente, agentes do Projeto, Construtor) e
  `machine/machines.ts:259-266` (Builder). O esquema que o Mastra monta: `dist/workspace-iIUnzVkl.js:9456-9466`;
  a doc: `reference-workspace-workspace-class.md:532-542`. A tela:
  `apps/web/src/builder/conversation/tool-registry.ts:127-135`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/machine/` | Muda `conversation.ts`, `machines.ts`; cria `command-description.test.ts` | todas as conversas |
| `apps/server/src/builder/assistant/prompt/assistant.md`, `apps/server/src/builder/conversation/prompt/builder.md` | Muda: uma frase cada | — |
| `apps/web/src/builder/conversation/` | Muda `tool-registry.ts` e a linha do comando; muda os testes dela | todas as conversas |

### Os contratos que a unidade cria

- `[WORKSPACE_TOOLS.SANDBOX.EXECUTE_COMMAND]: { requireDescription: true }` nas duas máquinas; nada de
  esquema nosso: o argumento `description` é o do Mastra.
- A linha do comando: `detailKey: 'description'`, e o corpo `command` continua mostrando o comando e
  a saída ao abrir; sem `description` (chamadas guardadas antes), o `detailKey` de hoje.
- A frase nos dois textos fixos, em inglês como o resto deles: "Write each command's `description` in
  Brazilian Portuguese, in a few words a colleague who does not program understands; never the
  command itself."

### As skills e a leitura

`mastra` (`@mastra/core/workspace`); as linhas de `apps/web/src` em `docs/reference/stack.md`.

### A ordem do trabalho

1. As opções das duas máquinas. Regras: C75.
2. As duas frases.
3. A linha do comando e os seus testes.

### Como se prova

Critérios 32 a 34. Falham hoje: 32 (o esquema não tem `description`), 33 (a linha mostra o comando
cru) e 34 (os textos não pedem a frase).

### Parar se

- O CLIProxy do Gemini recusa o esquema com o campo novo: relatar com o pedido capturado.
- Um teste do Builder depende da linha com o comando cru: a linha é a mesma para todos, mudar o teste.

## U11 A prova e o placar

**Base e modelo.** O commit da U5, com a lista abaixo revisada pelo fundador. Sonnet.

### As linhas da tabela

- **A prova e o placar.** O que já existe: `assistant/assistant.eval.test.ts` (o dublê `reader`,
  `:43-85`; os casos `:87`, `:97`, `:111`; os de modelo de verdade `:120`, `:151`, `:214`, `:227`),
  `assistant/test-real-model.ts` (`REAL_MODEL`, `checked`, `subscribed`), `assistant/test-numbers.ts:116`
  (`numbersFromReads`), `conversation/turn-line.ts:13-40` (`TurnTally`, que já ouve `usage_update`).
  Seguir o método do artigo (`D/eng_writing-tools-for-agents.txt:67-95`) e o `context-audit.ts` do
  Mastra Code (`mastracode/sdk/src/agents/context-audit.ts:1-60`) para o peso de cada parte do
  primeiro pedido.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/assistant/` | Cria `assistant.scorecard.test.ts`, `test-scorecard.ts` (as perguntas, os dados de cada uma e a contagem) e a planilha de teste gerada no próprio teste | — |

### Os contratos que a unidade cria

- `type Scorecard = { question: number; right: boolean; calls: number; errors: number; repeated: number; firstStepTokens: number | undefined; helpers: number }`,
  dono `test-scorecard.ts`. `calls`: as chamadas de ferramenta do turno, as do ajudante incluídas
  (os eventos `subagent_tool_start`, a partir da U12). `errors`: as que voltaram com erro ou recusa.
  `repeated`: a mesma ferramenta com os mesmos argumentos mais de uma vez no turno.
  `firstStepTokens`: o `usage.promptTokens` do primeiro `usage_update` (só no modelo de verdade; no
  dublê, `undefined`). `right`: o juiz de cada pergunta (a coluna "Certo quando").
- O placar é gravado num JSON por rodada na pasta temporária do teste, fora do repositório; o
  firstmate o anexa ao pull request de cada unidade seguinte como a medida de antes e depois.
- Uma resposta errada não falha o teste no modelo de verdade: o placar é medida. Com o dublê, o teste
  prova a contagem (critério 35).

### As perguntas, para revisão do fundador

Tiradas dos roteiros dos cartões (24.1, 24.3.2, O Assistente do dia a dia e este) e dos usos do
Assistente, do jeito que a equipe pergunta, sem dado de empresa: os dados são os dublês de teste.
Dados: **SV** as vendas de teste do Sankhya, duas filiais, setembro de 2026 (`salesSankhya`,
`hub/connectors/test-sales.ts:42`); **SC** o cadastro do dublê do Sankhya, com estoque e grupos
(`registerOn`, `packages/connectors/src/sankhya/fake-register.ts:106`); **ML** o dublê do Mercado
Livre (`packages/connectors/src/mercado-livre/fake.ts`, `fake-data.ts`, `fake-routes-more.ts`);
**AQ** os anexos de teste (`assistant/test-files.ts`); **PL** uma planilha de metas de 3 colunas e 200
linhas, gerada no teste; **WEB** nenhum dado: só o modelo de verdade, com a busca do provedor.

| # | Pergunta | Dados | Certo quando |
| --- | --- | --- | --- |
| 1 | Quanto a gente vendeu em setembro, por vendedor? | SV | cada total igual ao do dublê (`numbersFromReads`) |
| 2 | Qual vendedor vendeu mais em setembro na filial? | SV | o nome e o total do maior |
| 3 | Compara as vendas de setembro das duas filiais e me diz a diferença | SV | os dois totais e a diferença certos (o caso do ajudante, a partir da U12) |
| 4 | Quais os cinco produtos que mais venderam em setembro? | SV | os cinco, na ordem |
| 5 | Quanto gastou o cliente que mais comprou em setembro? | SV | o cliente e o total |
| 6 | Vendemos mais na primeira ou na segunda quinzena de setembro? | SV | a quinzena e os dois totais |
| 7 | Qual foi o ticket médio dos pedidos de setembro? | SV | o valor com duas casas |
| 8 | Quantos pedidos de venda tivemos em setembro, e quantos itens em média por pedido? | SV | as duas contas |
| 9 | Quais produtos estão com estoque zerado? | SC | a lista inteira, nenhum a mais |
| 10 | Quanto tem de estoque em cada grupo de produto? | SC | o total por grupo |
| 11 | Tem produto com mais reservado do que em estoque? | SC | os produtos, ou "nenhum" se não houver |
| 12 | Quantos anúncios ativos a gente tem no Mercado Livre? | ML | o número |
| 13 | Quais vendas do Mercado Livre ainda não foram enviadas? | ML | as vendas sem envio |
| 14 | Tem pergunta de comprador sem resposta no Mercado Livre? | ML | as perguntas abertas |
| 15 | Tem reclamação aberta no Mercado Livre? Do que se trata? | ML | a reclamação e o motivo |
| 16 | Quanto o Mercado Livre cobrou de tarifa no último faturamento? | ML | o valor |
| 17 | Qual anúncio teve mais visitas? | ML | o anúncio |
| 18 | Algum anúncio está em promoção agora? | ML | os anúncios, ou "nenhum" |
| 19 | Resume esse PDF em cinco pontos | AQ | cinco pontos do texto do PDF, nenhum inventado (os `checks` de hoje) |
| 20 | Nessa planilha, qual a soma da coluna de meta por vendedor? | PL | a soma de cada um |
| 21 | Cruza essa planilha de metas com as vendas de setembro e diz quem bateu a meta | PL, SV | os vendedores certos (o caso do ajudante, a partir da U12) |
| 22 | O que você consegue fazer por mim aqui? | nenhum | cita só o que as ferramentas da conversa fazem; nenhuma leitura |
| 23 | Quanto a gente vendeu em setembro? (numa conversa sem conexão escolhida) | nenhum | diz para escolher a conexão; nenhum `connector_read` (o caso de `:111`) |
| 24 | Monta um app para eu acompanhar as metas dos vendedores | nenhum | propõe passar ao Builder (o conjunto `EVAL_SET` de hoje) |
| 25 | Qual a alíquota de ICMS em São Paulo para bebidas? Cita a fonte | WEB | um link de um domínio `gov.br` perto da alíquota |
| 26 | Na conversa de antes, o que eu falei que acompanho? (entra com a U7) | uma conversa anterior gravada no teste | a frase da conversa anterior, achada pelo `recall` |
| 27 | O que é a operação 1100 da empresa? (entra com a U9) | uma página da memória da empresa gravada no teste | a definição da página |

### As skills e a leitura

`mastra` (`@mastra/evals`); o guia de testes.

### A ordem do trabalho

1. `test-scorecard.ts`: o tipo, a contagem de um turno e os dados de cada pergunta. Regras: o guia de
   testes (dublês, nenhum dado de empresa).
2. `assistant.scorecard.test.ts`: o caso do dublê que prova a contagem, e o caso de modelo de verdade,
   ligado só com `CONEXUS_EVAL_REAL_MODEL`, como os de hoje.
3. Uma rodada com o modelo de verdade, ligada pelo firstmate pela conta que ele já usa nos casos de
   hoje, e o placar no relatório como a medida de partida.

### Como se prova

Critérios 35 e 36. Falham hoje: não existe placar.

### Parar se

- Uma pergunta da lista revisada pede um dado que nenhum dublê tem: a pergunta sai da rodada, e o
  relatório diz qual e por quê; nunca um dado de empresa.
- A rodada com o modelo de verdade pede uma conta paga que o firstmate não tem autorizada.

## U12 O ajudante de pesquisa

**Base e modelo.** O commit da U6. Opus: o modelo da conta fora do processador, as ferramentas
montadas com a conversa de outro contexto e a porta de acesso.

### As linhas da tabela

- **O ajudante de pesquisa.** A doc instalada `docs-harness-agent-controller.md:329-352`,
  `reference-agent-controller-agent-controller-class.md:111-135`; o código
  `dist/agent-controller-BDds1y5w.js:6719-6994` (`createSubagentTool`) e `:8706-8730` (montado em cada
  corrida). O modelo a seguir: `mastracode/sdk/src/agents/subagents/explore.ts:4-10` (só leitura) e a
  ligação `mastracode/sdk/src/index.ts:1691-1703`, `:1788-1808`. Do Claude Code, a forma do tipo
  (`AgentDefinition`, `sdk.d.ts:38-110`: `description`, `tools`, `prompt`, `model`, `maxTurns`) e o
  porquê (`D/sub-agents.md:9-11`: "the subagent does that work in its own context and returns only the
  summary"; `:33-47`: o Explore só lê).
- **O modelo do ajudante.** `model-accounts/processors.ts:198-225`, `:302-320`, `:331-348`;
  `turn.ts:207-210`. O Mastra: `dist/agent-controller-BDds1y5w.js:6834-6866`.
- **As ferramentas do ajudante.** `assistant/connector-access.ts:16-41`, `assistant/context.ts:51-72`,
  `controller-kit/once.ts:7-19`; o Mastra: `:6830-6833`, `:6840-6849`, `:6868-6876`, `:8719-8722`,
  `:8544-8555`.
- **A numeração dos arquivos.** `assistant/connector-access.ts:47-55`; `hub/connectors/builder-port.ts:101-113`.
- **A linha do ajudante.** `apps/web/src/builder/conversation/tool-registry.ts`; a Factory UI,
  `mastracode/factory-ui/src/ui/domains/chat/services/transcript.ts:383-404`.

### O que o estudo achou, e como a unidade o resolve

1. **O ajudante do Mastra nasce sem a escolha de conta.** O `subagent` cria um `new Agent` só com
   instruções, modelo, ferramentas e a máquina (`:6860-6866`): nenhum processador roda nele. No
   Conexus, a conta do modelo sai de um processador por passo (`accountPick`), então o ajudante iria
   ao roteador de modelos sem a credencial da empresa. O gancho nativo é `resolveSubagentModel`, que
   recebe a cópia do contexto do principal (`:6853`), como o Mastra Code faz para as credenciais da
   corrida (`index.ts:1791-1808`). O nosso devolve o modelo da conta que o turno está usando
   (`turn.calling()`, síncrono; o turno vai na cópia do contexto), pelo `watched` de hoje, como o
   título da conversa: sem rodízio de conta e sem aviso; uma falha vira o erro da ferramenta ao
   principal.
2. **O ajudante não enxerga a conversa.** A cópia do contexto leva o `controller` com `resourceId: ''`
   (`:6842-6849`), e o nosso `scopeOf` lê a dona da conversa desse campo, guardado por objeto de
   contexto (`once.ts`): dentro do ajudante, toda ferramenta que lê o escopo pelo contexto não acha a
   conversa. As ferramentas do controlador, porém, são montadas em cada corrida com o contexto do
   principal (`:8719-8722`) e chegam ao ajudante por `allowedControllerTools` (`:6830-6833`). Então o
   `tools` do controlador do Assistente vira uma função que monta o `connector_read` com o escopo da
   conversa já fechado nele; o modo do principal não oferece `connector_read` (a U6 o tirou), e o
   filtro do modo, pelo nome (`:8544-8555`), o deixa fora do pedido do principal.
3. **Os arquivos das leituras se sobrescreveriam.** `readsFiles` numera por objeto de contexto
   (`connector-access.ts:47-55`); o do ajudante é outro, e a primeira leitura dele gravaria
   `reads/<turno>-1.json` por cima da primeira do turno. A numeração passa a contar pela chave do
   turno, como o contador das 50 já conta (`builder-port.ts:101-113`). O contador das 50 já é o do
   turno: a chave vai na cópia do contexto, e as leituras do ajudante contam nas mesmas 50.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/assistant/` | Cria `research.ts` (o tipo e as ferramentas do ajudante), `research.test.ts`; muda `assistant.ts` (o comentário de `:57-63`, `AVAILABLE_TOOLS` com `subagent`, o `tools` do controlador como função, `subagents`), `connector-access.ts` (`readsFiles` pela chave do turno), `prompt/assistant.md` (quando delegar) e `assistant.test.ts` (o conjunto fechado cresce com `subagent`) | — |
| `apps/server/src/builder/controller-kit/factories.ts` | Muda: `controllerOf` aceita `subagents` e `resolveSubagentModel`, repassados ao `AgentController`; sem eles, nada muda | Builder, Assistente, agentes do Projeto |
| `apps/server/src/builder/model-accounts/processors.ts` | Cria `subagentModel(deps)`; `SideCall` ganha `'subagent'` | `controller-kit/`, `assistant/` |
| `apps/server/src/builder/conversation/turn-line.ts` | Muda: `TurnTally` ouve `subagent_end` e `subagent_tool_start`; a linha ganha `helpers` e `helperCalls` | Builder, Assistente |
| `packages/hub-api/src/tools.ts` | Cria `SUBAGENT_TOOL = 'subagent'` | `apps/server`, `apps/web` |
| `apps/web/src/builder/conversation/` | Muda `tool-registry.ts` (a linha do ajudante e o corpo com o resumo) e os testes | todas as conversas |

### Os contratos que a unidade cria

- `RESEARCH: AgentControllerSubagent`, dono `assistant/research.ts`:
  `id: 'pesquisar'`, `name: 'Pesquisa'`;
  `description: 'Reads the company systems chosen in this conversation and the files on its machine to answer one focused question, and returns the findings with where each number came from. Writes nothing.'`;
  `instructions` (em inglês, como os outros textos): "You answer one research task for Conexus's
  Assistant and only read. Use `connector_read` with the connection, the reads, the fields, the period
  and the codes the task gives; filter and count at the system (WHERE, COUNT, SUM) rather than reading
  every row; open the saved file of a long read with the file tools. Return, in Brazilian Portuguese,
  the findings first, then each number with the read or file it came from; say what you could not
  read and why; mark what is your inference. You cannot see the conversation: work only from the task.";
  `allowedControllerTools: [BUILDER_TOOL.connectorRead]`;
  `allowedWorkspaceTools: [WORKSPACE_TOOL.readFile, WORKSPACE_TOOL.listFiles, WORKSPACE_TOOL.fileStat, WORKSPACE_TOOL.grep]`,
  as quatro do `explore` do Mastra Code com os nossos nomes; `defaultModelId: TURN_ACCOUNT`; sem
  `maxSteps`, `forked` nem `tools`.
- **O teto e o custo, com a base de cada número.** Passos: os 50 do Mastra quando o tipo não diz
  (`:6874`), os mesmos do `explore` do Mastra Code, que não diz, e do Mastra Code documentado ("defaults
  to `50` unless `stopWhen` is set", o Context7); o Claude Code deixa `maxTurns` sem padrão no tipo.
  Leituras: as 50 por turno de hoje (`CONNECTOR_CALLS_PER_TURN`), as mesmas para o principal e o
  ajudante. Ajudantes por turno: nenhum teto novo; o turno já tem 100 passos (`TURN_STEPS`), e cada
  chamada ao ajudante é um passo dele. Aninhamento: nenhum, porque as ferramentas do ajudante são só as
  que o tipo nomeia (`:6830-6833`), e `subagent` não está entre elas; o Claude Code permite três
  níveis por padrão (`D/agent-sdk_subagents.md`, a tabela dos limites), e aqui não é preciso. Custo:
  as chamadas do ajudante vão na conta da conversa, a mesma do título; quanto custam, a prova da U11
  mede em passos e chamadas.
- `TURN_ACCOUNT = 'conexus/turn-account'`, dono `model-accounts/processors.ts`: o nome que o Mastra
  exige para chegar ao `resolveSubagentModel` (`:6835-6840` recusa sem nenhum); o nosso resolvedor
  ignora o nome que chega, inclusive um `modelId` que o modelo principal escreva.
- `subagentModel(deps: QueueDeps): (modelId: string, options: { requestContext?: RequestContext }) => LanguageModel`,
  dono `model-accounts/processors.ts`: `turnIn(requestContext)?.calling()`; com a conta,
  `watched(deps, turn, account, 'subagent')` com o orçamento de cada passo (`MODEL_TIMEOUT.stepMs`,
  um `AbortSignal.timeout` somado ao sinal da chamada); sem turno ou sem conta, `noAccountModel` da
  conversa (falha na hora, sem chamar ninguém).
- O `tools` do controlador do Assistente: `async ({ requestContext }) => ({ [ASK_USER_TOOL]: askUser, ...researchReads(requestContext) })`,
  com `researchReads` montando, pela mesma `assistantConnectorTools` (`mayNote: false`), só o
  `connector_read` das conexões escolhidas, com o escopo de `scopeOf(requestContext)` do principal; sem
  escopo, só o `ask_user`.
- `readsFiles`: a contagem por `turnKey.of(requestContext)` num `Map`, esquecendo o mais antigo depois
  de `TURNS_KEPT`, como `createSpending`.
- `AVAILABLE_TOOLS` ganha `SUBAGENT_TOOL`; o comentário de `assistant.ts:57-63` troca "and it calls no
  subagent" por "and one subagent type, `pesquisar` (`research.ts`), which only reads".
- O texto fixo do Assistente, em inglês: "When an answer needs several reads whose rows you will not
  need again (two branches, two periods, a file against a system), give it to the `pesquisar`
  subagent. Write `task` in Brazilian Portuguese, starting with what you want to know, because the
  person reads it as 'Pesquisando: …'; put in it the connection, the reads and fields, the period and
  the codes from the notes, since the subagent does not see this conversation. Answer from its
  findings, and say where each number came from."
- A linha da tela: `running: 'Pesquisando'`, `done: 'Pesquisou'`, `failed: 'A pesquisa falhou'`,
  `detailKey: 'task'` numa linha cortada, corpo o `content` do resultado como texto da mensagem; o
  texto `[Aborted by user]` do Mastra dito "Parada no meio".
- O arquivo tomado como modelo é `assistant/connector-access.ts` com `controller-kit/factories.ts`:
  cumpre C21 (`'subagent'` entra na união de `SideCall`), C26 (`turnKey`, um dono da chave do turno) e
  C27 (`SUBAGENT_TOOL` no `hub-api`, o mesmo nome no servidor e na tela).

### As skills e a leitura

`mastra` (`@mastra/core/agent-controller`: as docs `docs-harness-agent-controller.md` e
`reference-agent-controller-agent-controller-class.md`); as linhas de `apps/web/src` em
`docs/reference/stack.md`.

### A ordem do trabalho

1. `processors.ts`: `subagentModel` e `TURN_ACCOUNT`. Regras: C57, C75.
2. `factories.ts`: `controllerOf` com `subagents` e `resolveSubagentModel`.
3. `connector-access.ts`: `readsFiles` pela chave do turno, com o seu teste (critério 39).
4. `research.ts` e `assistant.ts`: o tipo, o `tools` do controlador como função, `AVAILABLE_TOOLS`, o
   comentário e a frase do texto fixo. Regras: S36, S41.
5. `turn-line.ts`: `helpers` e `helperCalls`.
6. A linha da tela e as capturas a 1366 e 390, nos dois temas.

### Como se prova

Critérios 37 a 43, pelo modelo dublê que pede `subagent` e, dentro do ajudante, `connector_read` e
`mastra_workspace_read_file`; o dublê da conta guarda as chamadas do ajudante (critério 40). Falham
hoje: todos (o Assistente não oferece `subagent`).

### Parar se

- O `connector_read` montado pelo `tools` do controlador aparece no pedido do principal: o filtro do
  modo não o cortou; relatar com o pedido capturado, sem trocar o nome.
- `turn.calling()` está vazio quando o ajudante começa (o passo do principal já soltou a conta):
  relatar; não abrir uma escolha de conta nova fora do processador.
- O `watched` não serve a um modelo que não é `v3`, e uma conta da empresa usa esse modelo: relatar.
- Uma ferramenta do ajudante tem união no esquema, e a conta é do CLIProxy do Gemini (o
  `forCliProxy` roda só no processador do principal): relatar.
- O `prepareStep` do ajudante deixa passar uma ferramenta da máquina fora das quatro.
