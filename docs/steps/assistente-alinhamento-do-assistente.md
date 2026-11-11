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
que vir, por exemplo 4. A".

É o segundo cartão do trilho do Assistente (delivery L1). Espera no seu rascunho até O Assistente do
dia a dia fechar (L5); o roteiro de cima segue o fluxo da construção dos apps, que não muda. Cada linha
do `main` citada foi lida em `7c8b156f` (com o PR 963 no `main`), com `@mastra/core` 1.82.0,
`@mastra/memory` 1.41.0, `@mastra/pg` 1.35.0, `@mastra/e2b` 0.16.1, `ai` 6.0.309,
`@ai-sdk/anthropic` 3.0.133, `@ai-sdk/openai` 3.0.130 e `better-auth` 1.7.8. A prateleira:
`mastra-1.82@6e8dfcb8` (Mastra Code e Factory em `mastracode/`), `codex@970111f`,
`librechat@e6567c7`, `open-webui@f7ac7ee`, `lobe-chat@c29ef407`, `assistant-ui@437b410`,
`activepieces@f34c43cd`, `supabase-mcp@5ab9a98`, `nango@e6c6131`, `cloudflare-agents@786d30e3`,
`vibesdk@9da158d`.

## A página do fundador

**No fim desta etapa** o Assistente segue as instruções que a empresa escreveu, sabe quem você é
(cargo, área e o que aprendeu com você), lembra o que a empresa guardou e o que você conversou em
outras conversas, mostra as fontes de uma pesquisa na web, lê um PDF de um link, e os arquivos de uma
conversa não somem mais quando o Conexus é atualizado. Você vê e corrige na tela tudo o que ele
guarda.

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
   do arquivo inteiro. Depois do próximo Release, volte a essa conversa: o arquivo da leitura
   continua lá.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. Durante a U2: autoriza,
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
- **Os avisos guardados para um cartão** (`next-card`). Este cartão toma o #971 (a máquina que morria
  a cada Release, U1), a linha "uma resposta errada porque o modelo não abriu o arquivo" do #540 (U5)
  e a linha "a base de conhecimento da empresa" do #541, na parte das definições (U9). Os outros que
  tocam o Assistente esperam o seu gatilho: o #778 (quanto tempo uma conversa parada guarda os
  arquivos), o #814 (quem grava no caderno), o #143 (o `web_fetch` do Mastra e os endereços NAT64,
  que fica para os provedores sem a busca nativa) e o resto do #540 e do #541.

**As decisões suas nesta etapa.** As de memória e busca já têm a sua palavra (acima). Uma nova:

- **Quais campos a sua conta ganha para o Assistente** (a sua escolha "b": campos preenchidos pela
  pessoa ou pelo administrador).
  - **A.** Cargo e área. Exemplo: "Diretor comercial", "Vendas".
  - **B.** Cargo, área e um texto curto "sobre você".
  - **C.** Cargo, área, telefone e região.

  Recomendação: **A**. É o que as referências de chat põem no pedido a partir da conta (nome, grupo,
  às vezes local: o Open WebUI); o "sobre você" já vem pela memória que o Assistente aprende e que você
  corrige na tela (a sua escolha "c"), e um texto livre na conta seria um segundo lugar para a mesma
  coisa. Veredito: nativo (campos do membro no Better Auth, como o apelido da empresa).

Quem escreve a memória e as instruções da empresa, como cada um vê e corrige o que é guardado, e a
separação por empresa não pedem a sua palavra: seguem o modelo de papéis que você já aprovou e as
referências convergem. Dono e administrador escrevem, por uma permissão nova, "Memória da empresa",
como toda escrita que vale para a empresa inteira (conexões, contas de modelo, cópias); todo membro
lê. Cada pessoa vê e corrige só o que o Assistente aprendeu dela. Uma
empresa nunca lê a memória de outra.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 A máquina fica, e o caminho certo | A máquina de uma conversa é retomada pelo id, de qualquer molde; a morte por molde fica só na do Builder; a frase do sistema de arquivos diz a regra real dos caminhos | `apps/server/src/builder/machine/` | [testing](../guides/testing.md) | esta página aprovada |
| U2 Ferramentas em paralelo e a web do provedor | `toolCallConcurrency: { strategy: 'called' }` para todo agente; `web_search` pela fábrica do provedor, com país e fuso; `web_fetch` do Anthropic pela ferramenta do provedor, com citações; a troca de modelo tira as duas; o Google ganha a busca se a prova paga passar | `apps/server/src/builder/controller-kit/`, `apps/server/src/builder/model-accounts/processors.ts` | [security](../guides/security.md) | U1 |
| U3 As fontes embaixo da mensagem | A linha "Fontes" com título e domínio de cada parte `source` da mensagem, só `http(s)` | `apps/web/src/builder/conversation/` | [web](../guides/web.md) | esta página aprovada |
| U4 O contexto do Assistente | A lista de tarefas como estado (`TaskSignalProvider`); as frases de ferramenta que dependem do papel saem do texto fixo para o bloco da conversa; o dia da semana na data; o Observador com foco de negócio; o texto pede links perto de cada afirmação | `apps/server/src/builder/assistant/` | [testing](../guides/testing.md) | U2 |
| U5 A leitura grande | A resposta cortada diz quantas linhas e quantos bytes vieram; a descrição manda abrir o arquivo e não reler; a razão própria dos 20 em `cut.ts` e dos 50 em `builder-port.ts` | `apps/server/src/hub/connectors/`, `apps/server/src/builder/connectors/connector-tools.ts` | [data](../guides/data.md) | esta página aprovada |
| U6 As leituras tipadas sob demanda | Uma ferramenta por leitura das conexões escolhidas, com o Zod da operação; atrás do `ToolSearchProcessor` (`search_tools`, carga automática); `connector_read` sai do Assistente | `apps/server/src/builder/connectors/`, `apps/server/src/builder/assistant/` | [security](../guides/security.md) | U4, U5 |
| U7 As conversas antigas e o que ele aprende de você | `recall` em todas as conversas do Assistente da mesma pessoa na empresa; memória de trabalho por pessoa; a seção "O que o Assistente lembra de você" em Sua conta, com editar e apagar | `apps/server/src/builder/assistant/`, `apps/server/src/builder/controller-kit/memory.ts`, `packages/hub-api/src/`, `apps/web/src/builder/assistant/`, `apps/web/src/routes/_app/companies/$companyId_/settings/account.tsx` | [web](../guides/web.md) | U4 |
| U8 Cargo e área na conta | Os campos do membro (Better Auth), a migração, as rotas; a pessoa edita os seus em Sua conta, o administrador os de outro em Pessoas; o bloco da conversa os diz | `apps/server/src/hub/identity/`, `apps/server/migrations/`, `apps/server/database-grants.sql`, `packages/hub-api/src/`, `apps/web/src/hub/identity/`, `apps/web/src/routes/_app/companies/$companyId_/settings/{account,people}.tsx`, `apps/server/src/builder/assistant/instructions.ts` | [data](../guides/data.md) | U7 (a mesma tela de Sua conta) |
| U9 A memória e as instruções da empresa | O `Knowledge` do Mastra no Assistente, escopo da empresa, instruções da empresa como página fixada; a permissão "Memória da empresa"; a página Configurações › Memória da empresa | `apps/server/src/builder/assistant/`, `apps/server/src/hub/identity/{admission,roles}.ts`, `packages/hub-api/src/`, `apps/web/src/builder/assistant/`, `apps/web/src/routes/_app/companies/$companyId_/settings/` | [security](../guides/security.md) | U7, U8 |

U1, U3 e U5 não dividem pasta e correm em paralelo; U2 vem depois da U1 (o pull request as junta em
ordem) e a U4 depois da U2, porque o bloco da conversa e o texto fixo leem as ferramentas que a U2
deixa. U6 lê a U4 e a U5; U7, U8 e U9 vão em fila, porque dividem o agente, a memória e a tela de
Sua conta. A ordem do pull request: U1, U2, U3, U4, U5, U6, U7, U8, U9.

**Os trilhos.** O trilho do Assistente é dono de `apps/server/src/builder/assistant/` e de
`apps/web/src/builder/assistant/`. As outras pastas são de uso comum: `machine/` (U1) e
`controller-kit/` (U2) mudam também para o Builder e os agentes, de propósito: a frase dos caminhos e
as ferramentas em paralelo valem para todos, e a máquina do Builder continua morrendo por molde,
porque a razão dela vale; `hub/connectors/` e `builder/connectors/` (U5, U6) são do
Builder também, e a U5 só acrescenta campos e troca uma frase; `hub/identity/`, `migrations/` e as
telas de Configurações (U8, U9) são da fronteira e esperam as unidades dela que as tocam (a
Capacidade 4 mexe nas pessoas do app, não nas da empresa; a ordem segue L1).

**Orçamento de código alterado.** U1: 40. U2: 140. U3: 180. U4: 160. U5: 60. U6: 320. U7: 420. U8:
430. U9: 880. Total da etapa: cerca de 2.630, sem testes nem gerados (delivery L2).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Uma conversa do Assistente cuja máquina foi feita de outro molde é retomada com os arquivos: o arquivo gravado antes continua no mesmo caminho e nenhuma máquina é morta. Falha hoje: a máquina é morta e o arquivo some | `apps/server/src/builder/machine/conversation.test.ts`, "a máquina de outro molde é retomada com os arquivos" (troca o caso "é morta") | must |
| 2 | U1 | A máquina do Builder feita de outro molde continua sendo morta e refeita | `apps/server/src/builder/machine/machines.test.ts`, "a máquina do Builder de outro molde é refeita" (o de hoje, mantido) | must |
| 3 | U1 | O download de um arquivo acha a máquina da conversa de qualquer molde; numa conversa sem máquina, `FILE_GONE` como hoje | `apps/server/src/builder/machine/file-route.test.ts`, "o arquivo de uma máquina de outro molde baixa" | must |
| 4 | U1 | A frase do sistema de arquivos que o modelo recebe diz que caminho absoluto fora da pasta entra nela (`/tmp/x` vira `<pasta>/tmp/x`) e não traz `/src/index.ts` | `apps/server/src/builder/machine/sandbox-filesystem/filesystem.test.ts`, "a frase diz a regra dos caminhos" | must |
| 5 | U2 | Duas leituras pedidas pelo modelo no mesmo passo rodam juntas: com duas ferramentas de 300 ms, o passo termina em menos de 450 ms; `ask_user` pedido sozinho continua sozinho. Falha hoje: 667 ms | `apps/server/src/builder/controller-kit/concurrency.test.ts`, "as ferramentas de um passo rodam juntas" | must |
| 6 | U2 | Com o Anthropic, o pedido ao modelo leva `web_search_20250305` com `user_location` (`BR`, `America/Sao_Paulo`) e `web_fetch_20260209` com `citations.enabled`; com o OpenAI, `web_search` com `user_location`; com o xAI, a busca nativa sem argumentos como hoje | `apps/server/src/builder/controller-kit/model.test.ts`, "as ferramentas de web do provedor com argumentos" | must |
| 7 | U2 | Numa troca automática de modelo no meio do turno, as duas ferramentas do provedor anterior saem do pedido seguinte | `apps/server/src/builder/model-accounts/processors.test.ts`, "a troca de modelo tira a busca e a leitura de página" | must |
| 8 | U2 | O Google (CLIProxy) ganha `web_search` só se a prova paga passar; sem ela, o pedido ao Gemini continua sem busca, como hoje | `model.test.ts`, "o Google segue a prova" | must |
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
| 28 | U9 | As rotas da memória da empresa: todo membro lista e lê; gravar e apagar pedem a permissão (`NOT_IN_ROLE`); instruções acima do teto: `REQUEST_MALFORMED`; outra empresa: `NOT_FOUND` | `apps/server/src/builder/assistant/company-memory-routes.test.ts` | must |
| 29 | U9 | O teste prende `KNOWLEDGE_STORAGE_SCHEMA_VERSION` em 4: um Mastra que o mude falha este teste | `company-memory.test.ts`, "o formato do Knowledge" | must |
| 30 | U9 | A página Memória da empresa nos estados da matriz, a 1366 e 390 px, nos dois temas; o membro não vê os botões de editar | `apps/web/src/builder/assistant/company-memory.test.tsx` e o seu layout | must |
| 31 | U9 | A permissão "Memória da empresa" nasce no dono e no administrador; um papel próprio da empresa (que só recebe conectores) não a tem, e quem o tem recebe `NOT_IN_ROLE` ao gravar | `apps/server/src/hub/identity/roles.test.ts`, "a memória da empresa" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A linha Fontes de uma mensagem | A primeira mensagem com fontes: a linha "Fontes" embaixo | Sem `source`: nada | Enquanto a mensagem chega, as fontes que já chegaram | não se aplica | não se aplica | não se aplica | O `source` que não é `http(s)`: o título como texto, sem link |
| Sua conta, Cargo e área | Os dois campos vazios com a dica "Ajuda o Assistente a entender o seu trabalho." | Os campos vazios | A leitura da conta, como hoje | A gravação que falha: a frase de falha da conta de hoje | não se aplica | Não acontece: a pessoa edita os seus | Acima de 80 caracteres: a frase do campo |
| Sua conta, O que o Assistente lembra de você | A frase "O Assistente ainda não guardou nada sobre você. Ele guarda o que você pedir para lembrar, e o que aprender nas conversas." | A mesma frase | O texto carregando | A leitura que falha: "Não foi possível ler a memória." com Tentar de novo; a gravação que falha: a frase de falha de hoje | não se aplica | Não acontece: a pessoa vê a sua | Acima do teto de texto: a frase do campo |
| Configurações › Pessoas, Cargo e área de outro | Os campos de cada membro, vazios | Os campos vazios | Como a lista de hoje | Como a lista de hoje | O membro que saiu: a frase de hoje | Sem a permissão de mudar papel: os campos só para ler | Acima de 80 caracteres: a frase do campo |
| Configurações › Memória da empresa | "As instruções e as páginas que o Assistente segue em toda conversa da empresa." e as Instruções vazias | Instruções vazias e "Nenhuma página guardada ainda." | A lista carregando | "Não foi possível ler a memória da empresa." com Tentar de novo | A página apagada por outro: "Esta página não existe mais." | O membro sem a permissão: tudo para ler, sem editar nem apagar | Instruções acima do teto: a frase com a contagem; a gravação que perde para outra ao mesmo tempo: "A página mudou enquanto você editava." com a versão nova |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `ShapedRead.rows`, `ShapedRead.bytes` | `hub/connectors/cut.ts` (U5) | o modelo, pela resposta de `connector_read` e das leituras tipadas |
| `member.jobTitle`, `member.department` | a rota da pessoa e a do administrador (U8) | o bloco da conversa (U8), Sua conta e Pessoas |
| `ProfileMemory.text` | o modelo (`updateWorkingMemory`) e a rota `PUT` da pessoa (U7) | o pedido ao modelo (Mastra), a tela de Sua conta |
| `CompanyMemoryPage.{path,name,body,updatedAt}` | o modelo de quem tem a permissão (`knowledge_page`, `knowledge_note`) e a rota `PUT` (U9) | todo membro pela tela; o modelo de toda conversa da empresa (`knowledge_read`, `knowledge_search`, `knowledge_list`) |
| `CompanyInstructions.body` | a rota `PUT` (U9) e o modelo de quem tem a permissão | o pedido de toda conversa da empresa (página fixada), a tela |

**As telas.** O produto antigo não tinha nenhuma destas telas (no `e0353c36`, só o estado da
memória no compositor). As caixas seguem as telas vizinhas de hoje (Sua conta, Pessoas e a
transcrição); as palavras são as desta página, que o fundador aprova no fim.

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
| `updateWorkingMemory` pelo modelo e `PUT` da pessoa | Os dois gravam o texto inteiro: o último vence; a tela mostra o que ficou ao recarregar | Cortada antes do `COMMIT` do Mastra: nada mudou, e a pessoa reenvia o mesmo texto (o `PUT` é idempotente); um 502 ou 503 na resposta: a tela relê e mostra o que ficou | O banco do Mastra fora: `DATABASE_UNAVAILABLE` na rota; no turno, a falha de memória de hoje | nada novo; nunca o texto da memória (S41) | 20, 21 |
| Gravar cargo e área (comando do Hub, trava do membro) | A trava do membro ordena as duas; o último vence | Transação inteira ou nada; a resposta cortada: o `PUT` é idempotente e a tela relê | O banco do Hub fora: `DATABASE_UNAVAILABLE` | nada novo | 23 |
| `Knowledge.upsertPage` e `removePage` pela rota; `knowledge_page`, `knowledge_note` e `knowledge_pin` pelo modelo | Duas gravações na mesma página: o `removePage` concorrente lança (`dist/knowledge/index.d.ts:91`), e o `KnowledgeConflictError` vira `COMPANY_MEMORY_CHANGED` (409) e a tela relê; se o teste mostrar que o `upsertPage` não recusa, o último vence e a tela relê ao salvar; o modelo recebe o erro e relê | `upsertPage` grava a página e a versão juntas; `unchanged` não grava; uma resposta cortada: o `PUT` do mesmo corpo é idempotente pelo caminho | O banco do Mastra fora: `DATABASE_UNAVAILABLE`; o armazenamento do `Knowledge` que pede reset (um Mastra novo): o teste do critério 29 falha antes de chegar ao `main` | `COMPANY_MEMORY_CHANGED` com o caminho da página, nunca o corpo (S41) | 26, 27, 28, 29 |
| A chamada paga de busca e de leitura de página pelo provedor | Cada chamada é do provedor, dentro do turno | O turno parado corta a chamada, como hoje | O provedor fora: o erro da ferramenta vai ao modelo, como hoje | nada novo | 6, 8 |
| A leitura tipada (a mesma porta de `connector_read`) | O contador das 50 é síncrono (`builder-port.ts:102-112`), também com as ferramentas em paralelo | Como `connector_read` hoje | Como `connector_read` hoje | nada novo | 16, 17 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Máquina da conversa e molde novo | U1 | `apps/server/src/builder/machine/conversation.ts:176` (`killStale` antes da partida); `machine/e2b.ts:84-96` (`find` filtra por `MARK.template`), `:100-101` | `mastra-1.82@6e8dfcb8` `mastracode/factory/src/workspace.ts:841-857`, `:930-944`; `workspaces/e2b/src/factory-sandbox.ts:144-155`; `@mastra/e2b@0.16.1` `dist/index.js:1432-1470` | A sessão religa a máquina pelo id gravado; o molde só conta no `create()`; uma sessão antiga fica na máquina dela | nativo (tirar o nosso) | — | issue 971; "Proposta sua concordo" | — |
| Frase do sistema de arquivos | U1 | `machine/sandbox-filesystem/filesystem.ts:371`; `resolveAgainst` `:144-160` | `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/sandbox-filesystem.ts:1120-1122`, `:273-290`; Factory `factory/src/session/environment-state-processor.ts:138-150` | O Mastra Code diz "workspace paths" porque lá a pasta é a raiz do repositório; o Factory diz o diretório absoluto real | embrulhado: a nossa cópia do arquivo do Mastra Code, só a frase muda | o script do estudo: `/tmp/chart.png` → `/home/user/work/tmp/chart.png` | não precisa | — |
| Ferramentas de um passo em paralelo | U2 | `controller-kit/factories.ts:65` (sem `toolCallConcurrency`); `ask_user` com `suspendSchema` (`conversation/plan-tools.ts:51`) | `@mastra/core@1.82.0` `dist/loop/types.d.ts:43-53`; `dist/agent-BP9OWM6D.js:15211-15226`, `:15248-15270`; `codex@970111f` `codex-rs/core/src/tools/handlers/mcp.rs:174-185` | A estratégia `called` faz só a ferramenta chamada decidir a fila; o Codex roda em paralelo o que declara | nativo | o laboratório do estudo: 667 ms → 311 ms | "Proposta sua concordo" | `apps/server/src/builder/controller-kit/concurrency.test.ts` |
| `web_search` com argumentos | U2 | `controller-kit/model.ts:8-10`, `:31-36` (`webSearchTool` sem argumentos; sem Google) | `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/tools.ts:135-148`; `@ai-sdk/anthropic@3.0.133` `dist/index.js:1404-1500`; `@ai-sdk/openai@3.0.130` `dist/index.js:2753-2754`; `@mastra/core@1.82.0` `dist/tools-BVDic2bB.js:857-860` (Google) | O Mastra Code usa a fábrica do provedor do AI SDK | nativo | a prova paga do Google, na U2 | "4. A" | — |
| `web_fetch` do provedor | U2 | `controller-kit/model.ts:33` (`webFetchTool`: HTML cru, PDF ilegível, `dist/tools-BVDic2bB.js:609-791`) | `@ai-sdk/anthropic@3.0.133` `dist/index.js:1502-1552`, `:1829-1840`; `cloudflare-agents@786d30e3` `packages/agents/src/web/fetch/contract.ts:119-126` | O provedor devolve texto ou PDF como documento, com citações; a cloudflare converte para Markdown | nativo no Anthropic; nos outros, o de hoje | a chamada paga pela assinatura, na U2 | "Proposta sua concordo" | — |
| Troca de modelo tira as ferramentas do provedor | U2 | `model-accounts/processors.ts:35`, `:217-219` (só `web_search`) | a mesma regra para as duas | — | embrulhado: o nosso processador da troca de modelo tira as duas, como já tira a busca | — | não precisa | — |
| Fontes na tela | U3 | `apps/web/src/builder/conversation/rows.ts:250` (partes `source` puladas) | `assistant-ui@437b410` `examples/with-chain-of-thought/app/api/chat/route.ts:155-165`; `packages/ui/src/components/react/assistant-ui/elements/sources.aui.tsx:158` | A parte `source` (`url`, `title`) num componente de fontes embaixo da mensagem | nativo (a parte do Mastra) | — | item 3, "Proposta sua concordo" | `apps/web/src/builder/conversation/sources.tsx` |
| Links perto da afirmação | U4 | `assistant/prompt/assistant.md` ("say where it came from") | `codex@970111f` `codex-rs/ext/web-search/web_run_description.md:57-86`; `lobe-chat@c29ef407` `packages/builtin-tool-web-browsing/src/systemRole.ts:52-54` | Só texto de prompt | nativo (texto) | — | item 3 | — |
| Lista de tarefas como estado | U4 | `assistant/assistant.ts:248` (`new Agent` sem `signals`) | `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/index.ts:1460-1467`; `sdk/src/agents/prompts/index.ts:150-153`; `@mastra/core@1.82.0` `dist/signals-CcTXkih_.js:38-52`, `dist/task-state-processor-BP8cKMCJ.js:769-845`; o Builder `conversation/builder.ts:126` | `signals: [new TaskSignalProvider()]`: o estado vai por sinal, fora do prefixo em cache, e sobrevive à observação | nativo | — | "Proposta sua concordo" | — |
| Frases de ferramenta pelo papel | U4 | `assistant/prompt/assistant.md` ("# Notes on a connection" e automação, em prosa condicional); `assistant/instructions.ts:43-62` (`blockOf`) | `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/prompts/index.ts:96-122`; `codex@970111f` `codex-rs/core/src/session/world_state.rs:81-95` | A orientação é montada com as ferramentas presentes; some a da ferramenta ausente | nativo (instruções por pedido) | — | "Proposta sua concordo" | — |
| Dia da semana | U4 | `assistant/instructions.ts:58` | `librechat@e6567c7` `packages/data-provider/src/parsers.ts:498-507`; `open-webui@f7ac7ee` `backend/open_webui/utils/task.py:73-104` | A data com o dia da semana | nativo (texto) | — | item 7 | — |
| Observador com foco de negócio | U4 | `controller-kit/instructions.ts:19` (`TITLE.ask.observer`, só o título) | `@mastra/memory@1.41.0` `dist/docs/references/reference-memory-observational-memory.md:64`; `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/memory.ts:188-189`, `:295-298`, `:359` | `observation.instruction` diz o que observar e o que não | nativo | — | item 8 | — |
| Linhas e bytes na leitura cortada | U5 | `hub/connectors/cut.ts:47-70`; `builder/connectors/connector-tools.ts:196` ("run your own SQL") | `activepieces@f34c43cd` `packages/server/api/src/app/ee/agent/tools/agent-tools.ts:42`, `:672-706`; `packages/server/utils/src/agent-ai-utils.ts:366-392` | Arquivo, prévia, total e tamanho, e "processe no código, não repita a chamada" | embrulhado (o corte é nosso: o Mastra não guarda o inteiro fora) | `cut.test.ts` de hoje e os casos novos | não precisa | — |
| A razão dos 20 e dos 50 | U5 | `cut.ts:3` (cita o Factory com 20; o Factory tem 25, `mastracode/factory/src/tools/read-tools.ts:29`); `builder-port.ts:30-31` ("o OS tinha") | — | Nenhuma referência tem teto de chamadas por turno; o nosso protege o sistema da empresa, na porta | remendo com razão própria, já existente; só o comentário muda | `@mastra/core@1.82.0`: nenhum contador nativo de chamadas por turno (`stopWhen` vê só o laço do modelo); os testes de `CALLS_SPENT` | não precisa | — |
| Leitura tipada por operação | U6 | `builder/connectors/connector-tools.ts:209` (`input: z.record`); o Projeto já tipa (`builder/agents/tools.ts:101-119`) | `supabase-mcp@5ab9a98` `packages/mcp-utils/src/server.ts:533`, `:581-583`; `nango@e6c6131` `packages/server/lib/controllers/agent/mcp/sessionServer.ts:38-49` | Uma ferramenta por operação com o esquema; ou busca que devolve o esquema | nativo (`createTool` com o Zod da operação) | — | item 11 | `apps/server/src/builder/connectors/typed-reads.ts` |
| Descoberta sob demanda | U6 | não usada | `@mastra/core@1.82.0` `dist/docs/references/reference-processors-tool-search-processor.md:36-46`, `:200-250`; `dist/agent-BP9OWM6D.js:43554-43950`; `codex@970111f` `codex-rs/core/src/mcp_tool_exposure.rs:158-162` | `search_tools` (BM25), `autoLoad`, `storage: 'context'`, `filter` por pedido; o Codex adia só o que vem de fora | nativo | — | item 11 | — |
| Recall das conversas da pessoa | U7 | `assistant/memory.ts:14` (`recall: false`); `controller-kit/memory.ts:69` (`retrieval: { scope: 'thread' }` só no Builder) | `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/memory.ts:254-259`, `:346`; `@mastra/memory@1.41.0` `dist/docs/references/reference-memory-observational-memory.md:56`, `:795-797`; `dist/src-BncFunCW.js:31472-31490`, `:31681`, `:31715` | O Factory guarda a observação por conversa e o `recall` alcança todo o `resource`; o `recall` recusa conversa de outro `resource` | nativo | — | "1. B" | `apps/server/src/builder/assistant/recall.test.ts` |
| Memória de trabalho por pessoa | U7 | nenhuma | `@mastra/memory@1.41.0` `dist/docs/references/docs-memory-working-memory.md:66`, `:277`, `:388-417`; `dist/index.d.ts:171`, `:235`; `librechat@e6567c7` `packages/api/src/agents/memory.ts:61-130`; `lobe-chat@c29ef407` `packages/context-engine/src/providers/UserMemoryInjector.ts:27-65`. O Mastra Code não a usa (nenhum `workingMemory` em `mastracode/`) | `workingMemory: { enabled: true, scope: 'resource', template }`, atualizada pelo modelo; o Hub lê e grava por `getWorkingMemory` e `updateWorkingMemory` | nativo | — | "2. … C" | `apps/server/src/builder/assistant/profile-memory.ts` |
| Ver e corrigir o que é guardado | U7, U9 | nenhuma | `librechat@e6567c7` `client/src/components/SidePanel/Memories/MemoryEditDialog.tsx:57`, `:126`, `MemoryCardActions.tsx:34-40`; `open-webui@f7ac7ee` `src/lib/components/chat/Settings/Personalization.svelte:72`, `:302`, `Personalization/MemoryModal.svelte:35`; Factory, só leitura: `mastracode/factory/src/routes/knowledge.ts:1-13` | Os apps de chat editam e apagam na tela; o Factory mostra e se corrige pelo agente | nativo (as APIs do Hub sobre o Mastra) | — | não precisa: as de chat convergem | `apps/web/src/builder/assistant/profile-memory.tsx`, `company-memory.tsx` |
| Cargo e área na conta | U8 | `hub/identity/organization.ts:28-46` (campos extras de `company` e `invitation`, nenhum em `member`) | `better-auth@1.7.8` `dist/plugins/organization/types.d.mts:262-265` (`member.additionalFields`); `open-webui@f7ac7ee` `backend/open_webui/utils/task.py:73-104` | Campos da conta no pedido; o resto pela memória | nativo | — | "2. B"; os campos: a decisão desta página | `apps/server/src/hub/identity/member-profile.ts` |
| Memória da empresa | U9 | nenhuma (só o caderno de cada conexão) | `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/index.ts:865-888`, `:1346-1359`; `sdk/src/knowledge-scope.ts:26-46`; `@mastra/core@1.82.0` `dist/knowledge/config.d.ts:5-55`, `declarations.d.ts`, `dist/agent-BP9OWM6D.js:80211-80229`, `:63862-63869`; `@mastra/pg@1.35.0` `dist/index.js:8543-8552`, `:8614` | `new Knowledge({ scopes, storage, tools, pinnedContext })` no agente; os escopos do pedido dão o papel; o Factory exige `org:` e recusa sem ele | nativo, experimental (contido: um dono, o teste do formato, as rotas do Mastra desligadas) | — | "1. … D" | `apps/server/src/builder/assistant/company-memory.ts` |
| Instruções da empresa | U9 | nenhuma | `@mastra/core@1.82.0` `dist/knowledge/declarations.d.ts:44-49` (`pages` e `pinnedContext` da declaração), `dist/knowledge/pinned.d.ts` (fixadas da configuração sempre entregues, 500 tokens estimados por padrão, com a marca de corte); `dist/knowledge/index.d.ts:81-88` (`upsertPage`, só do host); `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/prompts/index.ts:155-203` (instruções do host abaixo das regras) | Uma página declarada e fixada pela configuração, escrita pelo host | nativo | — | "3. A gente via implementar o Knowledge" | (o mesmo) |
| Quem escreve a memória da empresa | U9 | `hub/identity/admission.ts:63-130` (toda escrita da empresa inteira é de dono e administrador, por permissão: conexões, contas de modelo, cópias) | `@mastra/core@1.82.0` `dist/agent-BP9OWM6D.js:62599-62624` (`knowledgeMemoryScopes`: `org` editor para toda corrida); `dist/agent-BP9OWM6D.js:73156`, `:73319`, `:73406` (editar, nota e fixar pedem papel) | O Mastra deixa todo membro editar o escopo da empresa; o nosso modelo de papéis dá a escrita da empresa por permissão | nativo (regra de acesso declarada); o nosso modelo de papéis decide | — | não precisa: o modelo de papéis aprovado | — |
| Rotas de navegação do Mastra | U9 | `conversation/guard.ts:25-33` (lista fixa, S39) | `@mastra/core@1.82.0` `dist/docs/references/docs-studio-knowledge.md` (desligadas por padrão) | — | nativo: desligadas por padrão, ficam assim; o Hub só expõe as suas | — | não precisa | — |
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
- O tamanho das ferramentas do primeiro passo e as chamadas repetidas não são medidos no log do turno.

## U1 A máquina fica, e o caminho certo

**Base e modelo.** `main` no commit em que O Assistente do dia a dia fechar. Sonnet: duas mudanças
pequenas numa pasta.

### As linhas da tabela

- **Máquina da conversa e molde novo.** Ler `apps/server/src/builder/machine/conversation.ts:171-190`
  (`boot`), `machine/e2b.ts:84-102` (`find`, `killStale`), `machine/kit.ts:176-186`. Seguir o Factory:
  `mastracode/factory/src/workspace.ts:841-857` (a sessão religa pelo id), `@mastra/e2b@0.16.1`
  `dist/index.js:1432-1470` (`find`/`connect` sem conferir molde; só `create()` resolve o molde).
- **Morte por molde no Builder.** `machine/machines.ts:124-131` fica como está: a máquina do Builder
  é refeita do Git e precisa do SDK da versão (decisão 0051, `infra/e2b/template.ts:1-7`).
- **Frase do sistema de arquivos.** `machine/sandbox-filesystem/filesystem.ts:144-160` (o resolvedor,
  intocado) e `:371`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/machine/` | Muda `conversation.ts`, `e2b.ts`, `kit.ts`, `sandbox-filesystem/filesystem.ts` e os seus testes | `builder/assistant/`, `builder/agents/`, `builder/conversation/` |

### Os contratos que a unidade cria

Apaga `killStale` da porta das conversas (`ConversationMachinesApi` em `kit.ts:176-185` perde o
método; `MachinesApi` do Builder o mantém). `find(conversationId)` deixa de receber o molde: a marca
`MARK.template` continua gravada, para diagnóstico. Nenhum tipo novo.

### As skills e a leitura

`mastra` (linhas de `@mastra/e2b` em `docs/reference/stack.md`); ler `node_modules/@mastra/e2b/dist/`
nas linhas citadas.

### A ordem do trabalho

1. `conversation.ts:176`: tirar `killStale`; a partida é `session.kit.sandbox.start?.()`. Regras: C75.
2. `e2b.ts:84-96`: `find` sem `MARK.template`; `kit.ts`: a assinatura da porta das conversas sem o
   molde e sem `killStale`.
3. `filesystem.ts:371`: "File tools take paths relative to ${basePath}, or absolute paths under it.
   Any other absolute path is placed inside ${basePath} (/tmp/x becomes ${basePath}/tmp/x), while
   commands see the real path: keep every file a tool and a command share under ${basePath}."
4. Testes: trocar "é morta" por "é retomada com os arquivos" com o dublê da máquina.

### Como se prova

Critérios 1 a 4, pelo dublê da máquina de hoje (`test-files.ts`), que hoje falham em 1 e 4 (o 1
espera a morte). `npm run test -w apps/server -- machine/`.

### Parar se

- O `@mastra/e2b` 0.16.1 ainda cria uma segunda máquina quando a lista falha (o "twin machine" do
  #540): manter a guarda de hoje contra a gêmea, que não é o `killStale`, e dizer no relatório.

## U2 Ferramentas em paralelo e a web do provedor

**Base e modelo.** O commit da U1. Sonnet.

### As linhas da tabela

- **Paralelo.** `controller-kit/factories.ts:51-75` (`agentDefaults`), `:65` (`defaultOptions`).
  Seguir `@mastra/core@1.82.0` `dist/loop/types.d.ts:43-53` e `dist/agent-BP9OWM6D.js:15248-15270`.
- **`web_search` e `web_fetch`.** `controller-kit/model.ts:1-40` (`toolsOf`, `SEARCH_PROVIDERS`).
  Seguir `mastracode/sdk/src/agents/tools.ts:135-148`; as fábricas em `@ai-sdk/anthropic@3.0.133`
  `dist/index.js:1404-1552` (`webSearch_20250305`, `webFetch_20260209`) e `@ai-sdk/openai@3.0.130`
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
   `anthropic.tools.webFetch_20260209({ citations: { enabled: true } })`; OpenAI
   `openai.tools.webSearch({ userLocation: BR_LOCATION })` e o `webFetchTool`; xAI o `webSearchTool`
   e o `webFetchTool`, como hoje.
3. A prova paga do Google, autorizada pelo fundador: uma busca pelo Gemini via CLIProxy com o
   `webSearchTool` do Mastra. Passou: `google` entra em `SEARCH_PROVIDERS` e o comentário de
   `model.ts:8` sai. Não passou: fica como está e o firstmate leva ao fundador.
4. A chamada paga do `web_fetch` do Anthropic pela assinatura Claude: anotar no relatório que
   respondeu e o preço lido na resposta.
5. `processors.ts:217-219`: tirar `web_fetch` do provedor anterior, como já tira `web_search`.

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
   you searched without a tool result."

### Como se prova

Critérios 11 a 14, lendo o pedido no modelo dublê (o mesmo caminho do diagnóstico). Falham hoje:
11, 12, 13, 14.

### Parar se

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
  (`builder/agents/tools.ts:101-119`, filtra o Zod aos campos abertos); `assistant/connector-access.ts`.
  Seguir `supabase-mcp@5ab9a98` `packages/mcp-utils/src/server.ts:533`, `:581-583`.
- **Descoberta sob demanda.** A doc instalada `reference-processors-tool-search-processor.md:36-46`,
  `:200-250`; `dist/agent-BP9OWM6D.js:43554-43950` (`processInputStep` devolve `tools`, não
  `activeTools`, `:43943-43948`); o filtro do modo corta pelo nome
  (`dist/agent-BP9OWM6D.js:1266`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/connectors/` | Cria `typed-reads.ts`; muda `connector-tools.ts` (exporta o que os dois usam) | Assistente; o Builder continua com `connector_read` |
| `apps/server/src/builder/assistant/` | Muda `assistant.ts` (`AVAILABLE_TOOLS`, processadores), `connector-access.ts`; cria `typed-reads.test.ts` | — |

### Os contratos que a unidade cria

- `typedReadName(connector, operation): string` = `${connector}_${operation}`, dono `typed-reads.ts`;
  `TYPED_READ_NAMES: readonly string[]` derivado do catálogo estático `CONNECTORS` na carga do
  módulo, que entra em `AVAILABLE_TOOLS` com `search_tools` (o filtro do modo corta pelo nome).
- `typedReads(deps, { scope, chosen, savedAt }): Record<string, Tool>`: uma por leitura que o papel
  permite (`mayUseEach`), `inputSchema: z.object({ connection: <enum das conexões daquele conector>, ...openInputOf(operation).shape })`, `execute` pela mesma porta de `connector_read`, com o mesmo corte e o mesmo arquivo.
- `new ToolSearchProcessor({ tools: <as leituras>, storage: 'context', search: { topK: 3, autoLoad: true }, filter })`
  nos processadores de entrada do Assistente.
- Apaga `connector_read` do Assistente (fica no Builder) e a lista de operações da descrição.

### As skills e a leitura

`mastra`; `zod`.

### A ordem do trabalho

1. `typed-reads.ts` a partir do caminho do Projeto (`agents/tools.ts:101-119`). Regras: S36, C27.
2. `assistant.ts`: as leituras saem das ferramentas e vão para o processador; `AVAILABLE_TOOLS`
   ganha `search_tools` e `TYPED_READ_NAMES`.
3. Testes pela porta pública com o modelo dublê pedindo `search_tools`.

### Como se prova

Critérios 16 a 18. Falham hoje: `connector_read` com `input` livre.

### Parar se

- Uma ferramenta carregada não chega ao pedido mesmo com o nome em `AVAILABLE_TOOLS`.
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
- `getProfileMemory` (`GET /api/companies/{companyId}/assistant/profile-memory`, `access: 'session'`,
  sucesso `{ text: string | null }`), `setProfileMemory` (`PUT`, corpo `{ text: z.string().max(4000) }`,
  sucesso `{ text }`), `clearProfileMemory` (`DELETE`, 204). Falhas: `NOT_FOUND`, `SESSION_REQUIRED`,
  `NOT_IN_ROLE` (sem `askAssistant`), `REQUEST_MALFORMED`, `DATABASE_UNAVAILABLE`. O `resourceId` sai
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

Critérios 19 a 22. Falham hoje: não há `recall` nem memória de trabalho.

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

### As skills e a leitura

`better-auth-best-practices`, `organization-best-practices`; `drizzle` (CLI); o guia de data.

### A ordem do trabalho

1. A migração e `database-grants.sql`. Regras: data D6, D11.
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

  `new Knowledge({ id: 'conexus-company', storage, scopes, tools: { read: true, write: true }, pinnedContext: true })`
  no agente do Assistente; `scopes: ({ requestContext }) => [org:<companyId>, ...(maySaveMemory ? [writer:<companyId>] : [])]`,
  da mesma `speakersFor`; sem a empresa, nenhum escopo (falha fechada, como `knowledge-scope.ts:35`).
- As rotas (`access: 'session'`): `listCompanyMemory` (`GET .../assistant/company-memory`,
  `readCompany`), `readCompanyMemoryPage` (`GET .../company-memory/pages/{path}`), `writeCompanyMemoryPage`
  (`PUT`, corpo `{ name, body }`, `manageCompanyMemory`), `removeCompanyMemoryPage` (`DELETE`,
  `manageCompanyMemory`; a página `instrucoes` não sai). Falhas: `NOT_FOUND`, `NOT_IN_ROLE`,
  `REQUEST_MALFORMED` (instruções acima do teto de `pinnedContext.maxTokens`, estimado),
  `COMPANY_MEMORY_CHANGED` (409, `KnowledgeConflictError`), `DATABASE_UNAVAILABLE`.
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
