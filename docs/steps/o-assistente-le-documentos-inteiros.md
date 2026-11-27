# O Assistente lê documentos inteiros

Trilho: harness

O pedido do fundador, em 2026-11-27: "Pelo que eu utilizei já do próprio assistente, como ele é
hoje, ele é muito inferior ao Claude Code. Quando eu quero fazer análises, quando eu mando, por
exemplo, um documento ... Não adianta você pegar um modelo de frontier e se você não tiver uma
harness muito bem estruturada, ele não vai ter um bom resultado. Até um modelo mais barato com uma
harness melhor tem resultado melhor." O estudo `conexus-assistente-laco` (2026-11-27) fica fora do
repositório (delivery L21). Ele rodou o Assistente e o Claude Code no mesmo modelo, Sonnet 5.5 em
medium, sobre três tarefas com documentos públicos: o Relatório de Inflação do Banco Central de
dez/2024 (73 páginas), a série semanal de preços da ANP por estado e uma pergunta de vendas ao dublê
de um ERP. O §5 dele é a proposta deste cartão. As falas do fundador vêm do registro de decisões do
firstmate, com a data de cada uma.

Lido no `main` em `57400a0c2` (2026-11-27, v0.24.136). O estudo foi feito sobre `c87b82040`, e entre
os dois nada mudou em `apps/` nem em `packages/`. Cada `arquivo:linha` abaixo foi relido em
`57400a0c2`. A conferência corrigiu o estudo em três pontos, e o cartão segue o código:

- o teto de um anexo (14 680 064 caracteres do data URL, cerca de 10,5 MB do arquivo) é do Mastra,
  não do Conexus. Ele está no esquema da rota de mensagem do `@mastra/server` 1.83.0, e o Conexus só
  o repete na web;
- o PDF de 73 páginas entrou com 242 561 tokens. Ele não cabe no limiar de 200 mil que o estudo
  propôs. O que a rodada v5 provou foi 400 mil;
- o arquivo da pessoa fica na mensagem guardada (`Ag/assistant/files.ts:146-171` lê os bytes de lá).
  O PDF que o `read_file` devolve como mídia também fica no resultado da ferramenta. Acima do limiar
  de 30 mil, a memória relê o que não observou a cada passo, e o egresso do banco foi a razão dos 30
  mil (`H/spec/memory.ts:37-48`). O laboratório rodou num Postgres local e não mediu isso.

Versões: `@mastra/core` 1.83.0, `@mastra/server` 1.83.0, `@mastra/memory` 1.41.1, `@ai-sdk/anthropic`
3.0.133. Prateleira: `mastra-1.83` em `d60ba71b` (Mastra Code em `mastracode/`). Abreviações: `S/` =
`apps/server/src/`, `H/` = `S/harness/`, `Ag/` = `S/agents/`, `W/` = `apps/web/src/`, `NMC/` =
`node_modules/@mastra/core/dist/`, `NMS/` = `node_modules/@mastra/server/dist/`, `M/` = a prateleira
`mastra-1.83`, `MW/` = `M/packages/core/src/workspace/tools/`.

## A página do fundador

**No fim desta etapa** você manda ao Assistente um PDF de umas 70 páginas e pede uma análise, e ele
lê o documento inteiro, gráficos e tabelas incluídos, como o Claude Code lê, e responde com as
páginas. Quando lê só uma parte, ele diz qual. A tela não cai quando você anexa arquivos grandes.

**O roteiro de uso.** Na nuvem, numa empresa de teste, como dono, com o Sonnet.

1. Em **Conversas**, abra uma conversa nova, anexe o Relatório de Inflação do Banco Central de
   dez/2024 e peça: um resumo, a tabela do IPCA com as probabilidades de estourar o teto, a revisão
   do PIB e os riscos, cada um com a página. A resposta vem sem a tela recarregar, com números certos
   e páginas de todo o documento.
2. Pergunte "você leu o documento inteiro?". Ele diz a verdade, e a verdade é "sim".
3. Na mesma conversa, anexe dois arquivos grandes, cada um com menos de 10 MB e somando uns 20 MB
   (a planilha semanal da ANP e outro PDF público), e peça o ranking dos estados. A conversa segue viva enquanto os arquivos sobem, e a resposta vem.
4. Anexe um PDF de umas 150 páginas e peça um número dele. Ele responde pelo texto do documento e diz
   que não o leu página por página.
5. Abra uma conversa que lê um sistema ligado e faça duas perguntas seguidas. As duas respondem,
   como hoje.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página e responde às três decisões
abaixo. No fim: faz o roteiro, diz o que viu e diz se o custo do passo 1 cabe. Não há texto novo de
tela.

**A ordem.** Esta etapa vem depois de "A harness única de verdade" (o cartão do pull request
[#1494](https://github.com/developmentconexus-ops/conexus/pull/1494)), que junta a máquina num lugar
só. As unidades daqui mexem na ficha da máquina (`H/machine/spec.ts`, `workspace.ts`) e na busca de
ferramentas, e aquele cartão move as duas coisas (as U6, U7 e U9 dele). Feita depois, cada mudança
cai uma vez, no lugar novo. A posição frente ao `A2` e ao `A3` segue a que você der àquela etapa na
decisão B dela: esta vem logo depois da harness única. Se quiser outra, diga na aprovação.

**A visão.** "Cada capacidade do Conexus tem uma lógica só, que serve toda conversa e toda tela, e
nunca uma cópia por Solution." A memória, a máquina e o stream continuam um harness só; o que muda é
um valor da ficha de cada agente. Nas suas palavras, de 2026-10-31: construir em volta do modelo, com
as ferramentas, a memória e a área de trabalho nativas do Mastra, e sem regra de forma de resposta.
Esta etapa tira do prompt a proibição de usar uma ferramenta nativa. Ela não acrescenta uma regra de
resposta. Nenhuma linha da `VISION.md` é cruzada.

**Fica de fora, e por quê.**

- **O Assistente lendo o lago** (`data_query` e `data_describe` com catálogo). Hoje respondem
  `NOT_IN_CATALOG`. É da trilha Dados, na ordem que você fixou em 2026-11-25 ("tratamento antes do
  acesso"). Sem isso, uma pergunta ao lago no Assistente segue sem resposta.
- **Arquivos acima do teto do Mastra** (cerca de 10,5 MB cada, 20 arquivos e cerca de 21 MB numa
  mensagem). Subir esse teto pede uma porta de envio nossa ao lado da rota do Mastra (a decisão C).
  Sem referência traçada, ela volta ao estudo antes de qualquer build.
- **Uma skill de gráficos para o Assistente.** O gráfico do Claude Code saiu melhor, com rótulos,
  eixo em R$ e fonte. É qualidade, não acerto, e pede um estudo próprio.
- **O cache reescrito depois do observador** (issue
  [#1490](https://github.com/developmentconexus-ops/conexus/issues/1490)). É do Construtor de apps e
  tem a issue própria.
- **A transcrição relida com os bytes do arquivo.** Ao reabrir a conversa, a tela lê a mensagem
  guardada, que ainda leva o arquivo. Só o stream ao vivo cai hoje. A releitura é uma vez por
  abertura.
- **As issues `next-card`.** A
  [#1285](https://github.com/developmentconexus-ops/conexus/issues/1285) entra na U5, porque o
  gatilho dela é a próxima unidade que mexe na busca do Assistente. As outras são de outras trilhas
  ou de partes que esta etapa não toca.

**As decisões suas nesta etapa.** Três, todas à espera da sua palavra. O cartão está escrito com a
opção (a) de cada uma; se você escolher outra, a unidade que ela toca muda antes do build.

**A. A memória a 30 mil vale para o Assistente?** Você aceitou o limiar de 30 mil pelo egresso do
Construtor. Para ler um documento inteiro, o limiar precisa caber o documento. Exemplo: no
laboratório, o PDF de 73 páginas entrou com 242 561 tokens no passo 3; no passo 4 a memória o
comprimiu, o contexto caiu para 31 408 tokens, e o Assistente voltou a ler trechos. Com o limiar a
400 mil, ele leu as 73 páginas e respondeu em 3 passos.

| Opção | O que acontece |
| --- | --- |
| a) **Recomendada, à espera da sua palavra** | O limiar vem da ficha de cada agente: 400 mil no Assistente, 30 mil nos outros. É o que a v5 provou. O egresso a mais do banco se mede no build (critério 6), e os números vêm a você antes do pull request quando passam de dez vezes o de hoje. |
| b) | 30 mil para todos. O Assistente lê o texto em blocos e cita, como o Claude Code, mas perde o que leu a cada compressão. A U2 sai, e a U3 só tira a proibição do prompt. |
| c) | Ligar o buffer assíncrono, como o Mastra Code faz (`M/mastracode/sdk/src/agents/memory.ts:350-354`). Isso revê a decisão do egresso. |

Veredito: nativo. `observation.messageTokens` é configuração do Mastra, e o Mastra Code já guarda um
limiar por conversa (`M/mastracode/sdk/src/constants.ts:35-36`, "per-thread overrides").

**B. Quanto pode custar uma análise de documento?** Medido no PDF de 73 páginas: o Assistente de
hoje US$ 0,26 (leitura parcial), o Claude Code US$ 0,62 (o texto inteiro), o Assistente com o PDF
lido como documento US$ 0,91.

| Opção | O que acontece |
| --- | --- |
| a) **Recomendada, à espera da sua palavra** | Aceitar até cerca de US$ 1 por documento grande. É o que entrega a leitura inteira, gráficos incluídos. Pede a opção (a) da decisão A: com a memória a 30 mil, a rodada v4 leu o PDF por US$ 1,17 e o perdeu no passo seguinte. |
| b) | Só o texto em blocos, perto de US$ 0,60, sem ver gráficos. A U3 lê o texto, não o PDF. |
| c) | Manter o de hoje. A etapa fica só com a U1, a U4 e a U5. |

Veredito: gasto, decisão sua. Nenhuma referência decide quanto uma análise pode custar.

**C. O teto de um anexo.** Hoje é cerca de 10,5 MB por arquivo e cerca de 21 MB numa mensagem. O
teto é da rota de mensagem do Mastra (`NMS/server/handlers/agent-controller.js:179-192`), e o
Conexus não o muda sem uma porta própria. O PDF original do Banco Central, de 11,9 MB, voltou com
HTTP 400.

| Opção | O que acontece |
| --- | --- |
| a) **Recomendada pelo estudo, à espera da sua palavra** | Subir para 32 MB por arquivo, o tamanho de um pedido à Anthropic. Pede uma porta de envio nossa, que põe o arquivo na máquina antes e manda à rota só a nota. Ela não entra nesta etapa: volta ao estudo, que traça como o Claude.ai e a Files API da Anthropic recebem o arquivo à parte, e vira um cartão próprio. Esta etapa faz o que vale nos dois casos: o arquivo dentro do teto não derruba mais a conversa (U4). |
| b) | Manter o teto do Mastra. A U4 fica igual, e não há estudo novo. |

Veredito: (a) é remendo até ter referência (delivery L28): uma porta ao lado da rota nativa. O nativo
é o teto do Mastra.

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 A saída de um comando em 8 mil tokens | `execute_command` e `read_file` do Assistente devolvem até 8 mil tokens, e não 2 mil | `H/machine/`, `Ag/assistant/` (só a montagem) | testing | a harness única fechada (U6 e U7 dela movem a máquina) |
| G1 | U2 O limiar da memória pela ficha | `conversationMemory` recebe o limiar do agente; o Assistente usa 400 mil, os outros 30 mil | `H/spec/`, `Ag/assistant/` | testing | a harness única fechada (a U1 dela muda a memória na montagem); a decisão A |
| G1 | U3 O PDF lido como documento | O `read_file` do Assistente devolve o PDF como mídia, e a seção de arquivos do prompt deixa de proibir isso | `Ag/assistant/` (`files.ts`, `assistant.ts`, `prompt/assistant.md`) | testing | U2 (sem o limiar, o PDF some no passo seguinte); a decisão B |
| G2 | U4 O anexo pela nota no stream | O evento da mensagem da pessoa sai sem os bytes do arquivo que não é imagem; o stream não cai dentro do teto | `H/routes/` | testing | nenhuma unidade; entra depois do G1 pela ordem do trilho |
| G2 | U5 A busca de ferramentas sem reescrever o cache | As ferramentas que `search_tools` carrega não mudam o prefixo do pedido, e a ordem da busca na ficha tem teste | `Ag/assistant/` (a busca, que a harness única move para lá) | testing | a U9 da harness única (move a busca) |

**Os grupos.** Dois pull requests, um commit por unidade. O G1 é a leitura de documentos: a U3 só
funciona com a U2, e a U1 vem antes porque é a menor e já corta custo. O G2 é o stream e o cache, e não divide arquivo com o G1.

**Orçamento de código alterado.** U1: 25. U2: 30. U3: 40, prompt incluído. U4: 50. U5: 90. Total da
etapa: cerca de 235 linhas, sem testes nem gerados.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Um comando do Assistente cuja saída passa de 2 mil tokens chega ao modelo inteiro até 8 mil; acima de 8 mil, chega cortado com a marca nativa do Mastra | um caso novo em `Ag/assistant/files-machine.test.ts`: "a saída de um comando chega até 8 mil tokens", com um comando que imprime cerca de 6 mil tokens e outro de cerca de 12 mil, ambos em menos de 200 linhas (o `tail` nativo de `MW/execute-command.ts:27-32` fica, e a descrição da ferramenta já diz "Use 0 for no limit"), lidos no resultado da ferramenta que o modelo dublê recebe | must |
| 2 | U1 | O Construtor de apps, o Construtor de agentes e o agente salvo seguem com o limite nativo de 2 mil | os pedidos gravados desses três (`Ag/*/requests/*.snapshot`) iguais; o mesmo caso do critério 1 no agente salvo, em `Ag/saved-agent/machine.test.ts`, com o corte em 2 mil | must |
| 3 | U2 | A memória do Assistente só observa acima de 400 mil tokens; a do Construtor de apps segue observando acima de 30 mil | um caso novo em `Ag/assistant/recall.test.ts`: "uma resposta de 50 mil tokens não aciona o observador"; `Ag/app-builder/conversation.test.ts` (linha 257) segue verde | must |
| 4 | U3 | Um PDF anexado ao Assistente, de até 10 MiB, volta do `read_file` como mídia; acima de 10 MiB, volta só com os metadados, como o Mastra faz | `Ag/assistant/files-machine.test.ts`: o caso "read_file: o PDF só por metadados" (linha 66) vira "read_file: o PDF como documento", com um PDF dublê de 3 páginas; um caso novo com um arquivo de 10 MiB e 1 byte | must |
| 5 | U3 | O prompt do Assistente não diz mais "Never load a whole document" nem "never comes into the conversation" | os cinco pedidos gravados do Assistente que levam o prompt (`Ag/assistant/requests/` `ajudante-pesquisar`, `automacao`, `inicio-com-ligacao`, `luna` e `projeto`), regravados na unidade com a seção nova; `grep` dessas duas frases em `Ag/assistant/prompt/` e `Ag/assistant/requests/` não acha nada | must |
| 6 | U2, U3, U4 | O turno com o PDF de 73 páginas lido por `read_file`, e o turno com os dois anexos de 10 MB, têm medidos os bytes que o banco manda ao Hub, contra os mesmos turnos com o limiar a 30 mil; acima de dez vezes, os números vão ao fundador antes do pull request | a medição de "Como se prova" da U3, com os números no relatório do build e no pull request | should |
| 7 | U3 | Com o modelo de verdade e o PDF do Banco Central, o Assistente lê as 73 páginas, acerta os quatro pontos do gabarito do estudo e não diz que leu o que não leu; o custo fica no teto da decisão B | `Ag/assistant/files-journey.test.ts`, "o roteiro com modelo de verdade" (linha 194), com o PDF e as perguntas do roteiro; opt-in, com a chave da instalação | should |
| 8 | U3 | Com o modelo de verdade, um PDF de 150 páginas é lido pelo texto, sem `read_file` como mídia,, e a resposta diz que não foi lido página por página | o mesmo arquivo do critério 7, um segundo caso opt-in | should |
| 9 | U4 | Uma mensagem com dois arquivos que não são imagem, somando cerca de 20 MB, mantém o stream aberto: nenhuma linha `BUILDER_STREAM_ENDED` com `reason BEHIND`; os arquivos chegam inteiros à máquina | um caso novo em `Ag/assistant/files-machine.test.ts`, com a máquina dublê de lá: "dois anexos de 10 MB não derrubam o stream", que abre o stream da conversa pela rota e lê o hash de cada arquivo em `uploads/` | must |
| 10 | U4 | No stream, a parte de arquivo da mensagem da pessoa guarda `mediaType` e `filename` e perde `data` quando não é imagem; a imagem segue com `data`, e a tela mostra a miniatura | o caso do critério 9 lê o evento `message_start`; `W/harness/room/messages.test.tsx`, um caso novo: "o arquivo sem bytes vira um chip com o nome" | must |
| 11 | U4 | Uma página que de fato fica 8 MiB atrás segue perdendo o stream, como hoje | `H/routes/conversation-stream-paced.test.ts`, o caso da linha 203 | must |
| 12 | U5 | Numa conversa com conexão, o bloco de ferramentas do pedido do passo seguinte a um `search_tools` começa com os mesmos bytes do pedido anterior | um pedido gravado novo, `Ag/assistant/requests/busca-carrega.snapshot`, com dois passos, e um caso em `Ag/assistant/request.test.ts` que compara o começo dos dois | must |
| 13 | U5 | A busca das leituras e `profileReadOnlyInRuns` ficam antes da escolha da conta; movê-las para depois deixa um teste vermelho (issue #1285) | um caso novo em `Ag/assistant/research.test.ts`, pelo caminho achatado do CLIProxy, como a issue pede | must |
| 14 | U5 | Com o modelo de verdade, a pergunta de vendas do estudo tem leituras de cache a partir do segundo passo | `Ag/assistant/assistant.eval.test.ts`, um caso opt-in que lê `cacheRead` dos spans | should |
| 15 | U3 | O provedor que recusa o pedido com o PDF (páginas demais, tipo não aceito) encerra o turno com a mesma falha de modelo de hoje, e a mensagem seguinte da conversa responde | um caso novo em `Ag/assistant/files-machine.test.ts`, com o modelo dublê que recusa o pedido que leva um PDF: "o provedor recusa o PDF, e a conversa segue" | must |

## A matriz de estados

Nenhuma tela nova e nenhum estado novo. A sala de conversa mantém cada estado de hoje. O chip de um
arquivo que não é imagem já mostra só o nome (`W/harness/room/messages.ts:132-134`); a U4 só tira os
bytes que ele não lia.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `MachineSpec.maxOutputTokens` (U1) | a ficha do Assistente (`Ag/assistant/assistant.ts`) | `workspaceOf` (`H/machine/workspace.ts`) |
| `conversationMemory` `observeAt` (U2) | as fichas dos quatro agentes | a `Memory` do Mastra (`observation.messageTokens`) |
| A parte `file` do `message_start` sem `data` (U4) | `slim` (`H/routes/stream.ts`) | `userText` e `chipOf` (`W/harness/room/messages.ts`) |

## A tabela de falhas

Nenhuma gravação nova, e nenhuma tabela, coluna ou migração nova. As duas linhas são gravações do
Mastra que a etapa muda de tamanho.

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| O resultado do `read_file` com o PDF como mídia, guardado pelo Mastra na mensagem (U3) | como hoje: cada chamada guarda o seu resultado | como hoje: um turno parado guarda o que chegou | banco fora: o turno falha como hoje, com `DATABASE_UNAVAILABLE` | o mesmo `TURN_ENDED` de hoje | 4, 6 |
| O pedido ao modelo com o PDF como mídia (U3) | como hoje: cada passo é um pedido | o provedor recusa o PDF: o turno falha com a falha de modelo de hoje | o provedor fora: como hoje | a linha de falha do turno de hoje, com o código do provedor | 15 |
| A observação da memória acima do limiar (U2) | como hoje: o Mastra observa uma vez por conversa | como hoje: `failurePolicy: 'continue'` segue o turno | o modelo do observador fora: o turno segue sem observar, como hoje | a mesma linha de hoje do observador | 3, 6 |

## A tabela de referência

Rótulos: **lido** (o código aberto), **provado** (uma rodada do laboratório no pacote instalado).

| # | Peça | Unidade | O que o fundador já decidiu | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A saída de um comando | U1 | — | `H/machine/workspace.ts:31-43`, sem `maxOutputTokens`; o padrão do Mastra vale (2 mil tokens, 200 linhas) | `MW/output-helpers.ts:7,10`; `MW/execute-command.ts:27-32` (o `tail` de 200, "Use 0 for no limit") e `:168-169` (o corte em sanduíche); `MW/tools.ts:133,185-186` (`maxOutputTokens` por ferramenta), **lido**; o Bash do Claude Code devolve 30 mil caracteres, **provado** (o estudo, rodada cc t1) | um limite por ferramenta na configuração do workspace | nativo | a rodada v1: mesmo acerto, de US$ 0,26 e 81 s para US$ 0,11 e 38 s | — | — |
| 2 | O limiar da memória | U2 | o limiar de 30 mil e o buffer desligado, pelo egresso (`H/spec/memory.ts:37-48`) | `H/spec/memory.ts:85-86`, fixo para os quatro | `M/mastracode/sdk/src/constants.ts:35-36` e `agents/memory.ts:349-354` (30 mil com buffer, por conversa), **lido**; o Claude Code compacta perto da janela, **provado** (o estudo) | um limiar de configuração, por conversa no Mastra Code | nativo | as rodadas v4 (o PDF some em um passo) e v5 (lido até o fim a 400 mil) | A | — |
| 3 | O PDF como documento | U3 | 2026-10-31: em volta do modelo, sem regra de resposta | `Ag/assistant/files.ts:26-27` (`READ_MEDIA` só com imagens); `Ag/assistant/assistant.ts:297`; `prompt/assistant.md:123-131` | `MW/read-file.ts:18` (o PDF no padrão), `:253-262` (a mídia até `maxMediaBytes`); `MW/media.ts:44` (10 MiB), **lido** | o `read_file` devolve o PDF ao modelo como mídia | nativo: apagar `READ_MEDIA` devolve o padrão do Mastra | as rodadas v2 e v3 (a linha nova sozinha não muda nada) e v4 e v5 (a seção reescrita muda) | B | — |
| 4 | O eco do anexo no stream | U4 | — | `H/routes/stream.ts:14` (8 MiB) e `:31-38` (`slim` já enxuga o estado da tela); o evento vem de `NMC/agent-controller-BhkzVgCi.js:1439-1452` (`message_start` da `data-user-message`, com os bytes) | a Files API da Anthropic e o Claude.ai mandam o arquivo à parte e o citam por id; o Conexus já guarda o arquivo na máquina (`FileUploadProcessor`, `Ag/assistant/files.ts:122-141`), **lido** | a mensagem leva uma referência, não os bytes | embrulhado: o mesmo `slim` que já enxuga o stream | o estudo: 25 468 454 bytes num evento, contra 8 MiB; toda rodada com anexo reabriu o stream | — | — |
| 5 | O teto de um anexo | fica de fora: a decisão C | — | `NMS/server/handlers/agent-controller.js:179-192`; a cópia na web em `W/harness/room/attachments.ts:7-8`; `H/routes/guard.ts:66-70` (o corpo de 30 MiB) | o mesmo esquema da rota, **lido** | o teto da rota nativa | nativo | — | C | — |
| 6 | A busca de ferramentas e o cache | U5 | — | `H/tools/company/search.ts:28-44` (vai para `Ag/assistant/` na U9 da harness única) | `M/packages/core/src/processors/processors/tool-search.ts:823-827` (acrescentar no fim "preserva o cache"), **lido**, e desmentido para a Anthropic pela rodada t3; `@ai-sdk/anthropic` 3.0.133 `dist/index.mjs:1689` e `:1769` (`defer_loading`) e `:2450`, `:6474` (as buscas nativas da Anthropic), **lido** | a Anthropic carrega a ferramenta adiada sem mudar o prefixo | nativo: uma das duas formas nativas, pela prova do passo 1 da U5 | a rodada t3: três escritas de cache (103 mil tokens) em três passos | — | — |
| 7 | A afirmação de leitura | U3 | 2026-10-31: sem regra de forma de resposta | `prompt/assistant.md:82` ("say "all" only when you read all") | — | quando a leitura inteira é possível, a frase vira verdade | nativo: nenhuma linha nova de prompt | as rodadas t1 e v1 (disseram "Li o relatório inteiro" sem ter lido) e v5 (leu) | — | — |

**A medida do transplante.** Nenhuma parte trazida do repositório antigo.

**A dívida.** O teto de anexo repetido na web (`W/harness/room/attachments.ts:7-8`, "which it does
not export") cita o `@mastra/server` 1.79.0; o número é o mesmo na 1.83.0. A citação se corrige no
fechamento.

## As decisões do firstmate

| # | Decisão reversível (delivery L6) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | O limite de 8 mil tokens só no Assistente, pela ficha da máquina | o laboratório só mediu o Assistente; o Construtor de apps lê saídas de build, e mudar o dele mudaria os pedidos gravados que a harness única compara | pôr o valor em `workspaceOf` para todos |
| 2 | O PDF lido como documento até 10 MiB, o padrão do Mastra (`MW/media.ts:44`), e o caminho do texto acima de 80 páginas, dito no prompt | 3 300 tokens por página, medido (242 561 em 73): 80 páginas são cerca de 265 mil tokens, que cabem em 400 mil com o prompt e ficam perto do custo medido em 73 (decisão B); a página [PDF support](https://platform.claude.com/docs/en/build-with-claude/pdf-support) da Anthropic dá 100 páginas por pedido como o menor dos seus limites, para janelas abaixo de 1 milhão | outro número de páginas na seção |
| 3 | A U4 tira só os bytes de quem não é imagem | a tela lê os bytes da imagem para a miniatura (`W/harness/room/messages.ts:132-134`); os outros arquivos só mostram o nome | tirar todos e pedir a miniatura à máquina |
| 4 | A U5 começa por uma prova, e o desenho fica entre duas formas | o comentário do Mastra e a medição divergem, e as duas formas (as ferramentas da conexão carregadas desde o primeiro passo, ou o `defer_loading` da Anthropic) mudam coisas diferentes | o "Parar se" da U5 |

## U1 A saída de um comando em 8 mil tokens

**Base e modelo.** `main` depois do fechamento da harness única. Sonnet: um campo e um repasse.

### As linhas da tabela

Linha 1. Ler na base: `H/machine/spec.ts:8-27` (`MachineSpec`, o `readMedia` das linhas 20-21);
`H/machine/workspace.ts:7-22` (`WorkspaceParts`) e `:31-43`; o repasse de `readMedia` em
`H/machine/conversation.ts:291-298` (ou o lugar para onde a U6 da harness única o levou);
`Ag/assistant/assistant.ts:293-302`. Referência: `MW/tools.ts:133` e `:185-186`;
`MW/execute-command.ts:168-169`; `MW/read-file.ts:302`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/machine/` | Muda `spec.ts`, `workspace.ts` e o repasse da máquina da conversa | os três agentes de conversa e a máquina do Projeto, por `workspaceOf` |
| `Ag/assistant/` | Muda `assistant.ts` | — |

### Os contratos que a unidade cria

```ts
// H/machine/spec.ts, em MachineSpec, e o mesmo campo em WorkspaceParts
/** The tokens `execute_command` and `read_file` hand the model; absent, Mastra's default (2,000). */
maxOutputTokens?: number
```

O valor do Assistente é uma constante nomeada em `Ag/assistant/assistant.ts` (C26), ao lado de
`readMedia`. C21 e C23 não se aplicam: não há estado nem id novo. `workspaceOf` passa `maxOutputTokens` às duas ferramentas só quando o campo existe.

### As skills e a leitura

`mastra` (`node_modules/@mastra/core/dist/docs/`, a referência do `Workspace` e das ferramentas da
área de trabalho); `pstack:typescript-best-practices`.

### A ordem do trabalho

1. **O teste antes.** Critérios: 1, 2.
   - **Arquivos:** `Ag/assistant/files-machine.test.ts`, `Ag/saved-agent/machine.test.ts`.
   - **Testes:** os casos novos, vermelhos no do Assistente e verdes no do agente salvo.
2. **O campo e o repasse.** Critérios: 1, 2.
   - **Arquivos:** `H/machine/spec.ts`, `H/machine/workspace.ts`, a máquina da conversa,
     `Ag/assistant/assistant.ts`.
   - **Referência a seguir:** `MW/tools.ts:185-186`.
   - **Mutações à mão:** tirar o repasse em `workspaceOf`, e o critério 1 fica vermelho.
   - **Pronto quando:** os pedidos gravados dos quatro agentes ficam iguais.

### Como se prova

O critério 1 passa pela porta do Hub: a conversa manda uma mensagem, o modelo dublê pede o comando, e
o teste lê o resultado da ferramenta no pedido seguinte. Hoje o comando de 6 mil tokens chega cortado.

### Parar se

- O resultado do comando chega ao modelo dublê por outro caminho que o da ferramenta da área de
  trabalho: o critério 1 não alcança o corte. Pare e diga.

## U2 O limiar da memória pela ficha

**Base e modelo.** Depois da U1. Sonnet.

### As linhas da tabela

Linha 2. Ler na base: `H/spec/memory.ts:37-48` (o porquê dos 30 mil), `:49-64` (as entradas) e
`:82-93`; as quatro chamadas: `Ag/assistant/memory.ts:40-49`, `Ag/app-builder/builder.ts:130`,
`Ag/agent-builder/construtor.ts:252`, `Ag/saved-agent/controller.ts:227`. Referência:
`M/mastracode/sdk/src/agents/memory.ts:349-354`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/spec/` | Muda `memory.ts` | as quatro fichas |
| `Ag/assistant/` | Muda `memory.ts` | `assistant.ts` |
| `Ag/app-builder/`, `Ag/agent-builder/`, `Ag/saved-agent/` | Mudam a chamada, com o valor de hoje | — |

### Os contratos que a unidade cria

```ts
// H/spec/memory.ts, nas entradas de conversationMemory: obrigatório, para cada ficha dizer o seu
/** The tokens of unobserved messages past which the Observer runs (Mastra's `observation.messageTokens`). */
observeAt: number
```

O número dos 30 mil vira uma constante exportada de `H/spec/memory.ts` (o dono, C26), e as três
fichas que não leem documentos a usam. O comentário das linhas 37-48 passa a dizer que o valor vem
da ficha e por que o do Assistente é maior. A constante do Assistente vive em `Ag/assistant/memory.ts`. C21 e C23 não se aplicam.

### As skills e a leitura

`mastra` (`node_modules/@mastra/memory/dist/docs/`, a memória observacional); `node`.

### A ordem do trabalho

1. **O teste antes.** Critério: 3.
   - **Testes:** o caso novo em `Ag/assistant/recall.test.ts`, vermelho.
2. **O campo, as quatro fichas.** Critérios: 2, 3.
   - **O que sai:** o `30_000` literal de `H/spec/memory.ts:85`.
   - **Mutações à mão:** pôr 30 mil no Assistente, e o critério 3 fica vermelho.
   - **Pronto quando:** `Ag/app-builder/conversation.test.ts` segue verde, e os pedidos gravados
     ficam iguais.

### Parar se

- Algum modelo da lista de partida (`H/model-accounts/providers.ts:109-114`) tem janela menor que
  400 mil mais o prompt, pelo registro de modelos do Mastra instalado: o limiar por agente não basta,
  e ele teria de vir do modelo. Pare e diga, com a janela de cada um.

## U3 O PDF lido como documento

**Base e modelo.** Depois da U2. Sonnet.

### As linhas da tabela

Linhas 3 e 7. Ler na base: `Ag/assistant/files.ts:16-29`; `Ag/assistant/assistant.ts:297`;
`Ag/assistant/prompt/assistant.md:82` e `:123-131`; `Ag/assistant/files-machine.test.ts:66`.
Referência: `MW/read-file.ts:18` e `:253-262`; `MW/media.ts:44`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `Ag/assistant/` | Muda `files.ts`, `assistant.ts`, `prompt/assistant.md`, o pedido gravado | — |

### Os contratos que a unidade cria

Nenhum. Sai `READ_MEDIA` e o seu comentário ("a PDF is read on the machine"), e a ficha do Assistente
deixa `readMedia` ausente, o que devolve o padrão do Mastra (`MW/read-file.ts:18`: png, jpeg, webp e
PDF). `OBSERVED` fica: o observador segue vendo só imagens.

A seção "Files the person sends" é a da rodada v5 do estudo:

- o arquivo vai para `uploads/`, com a nota;
- um PDF de até 80 páginas se lê primeiro com `read_file`, que entrega cada página como o leitor a
  vê; o `pdftotext` só vale acima de 80 páginas ou para procurar uma palavra;
- Word com pandoc, planilha com pandas;
- um texto longo se procura com grep ou se lê por linhas;
- o nome em disco é o hash, e o arquivo se chama pelo nome que a pessoa deu.

Saem a frase "That file itself never comes into the conversation", "Never load a whole document into
the conversation" e a linha que manda ignorar a mídia do PDF.

### As skills e a leitura

`mastra` (`node_modules/@mastra/core/dist/docs/`, `read_file` e a mídia); `pstack:technical-writing`
para a seção do prompt.

### A ordem do trabalho

1. **O teste antes.** Critério: 4.
   - **Testes:** o caso da linha 66 invertido e o caso de 10 MiB e 1 byte, vermelhos.
2. **Apagar `READ_MEDIA` e reescrever a seção.** Critérios: 4, 5.
   - **Mutações à mão:** devolver `READ_MEDIA` só com imagens, e o critério 4 fica vermelho.
   - **Pronto quando:** o pedido gravado do Assistente, regravado, mostra só a seção nova.
3. **A recusa do provedor.** Critério: 15.
   - **Testes:** o caso novo com o modelo dublê que recusa.
4. **A medição do egresso.** Critério: 6.
5. **As rodadas com modelo de verdade.** Critérios: 7, 8. Até duas rodadas pagas, com a palavra do
   fundador no pedido do build.

### Como se prova

O critério 6 roda no Hub local, com o Postgres num contêiner Docker do builder (`docker run --rm`),
o turno do PDF de 73 páginas e o turno dos dois anexos de 10 MB, cada um duas vezes: uma com a U2 e
outra com o limiar a 30 mil. Conta os bytes que o banco manda ao Hub em cada turno pela diferença do
`NET I/O` de saída em `docker stats --no-stream` antes e depois do turno, e põe os números no
relatório do build e no pull request. Hoje o PDF não entra no contexto, e não há o que medir.

### Parar se

- O turno com o PDF lê do banco mais de dez vezes os bytes do mesmo turno a 30 mil: leve os dois
  números ao fundador antes do pull request, pela decisão A.
- O custo do critério 7 passa do teto da decisão B: pare, e diga o custo de cada rodada.
- Antes do passo 2: o provedor do AI SDK instalado de um modelo da lista de partida
  (`H/model-accounts/providers.ts:109-114`) não aceita um PDF como mídia no resultado de uma
  ferramenta. O laboratório só rodou o Sonnet. Pare e diga qual, com a linha do provedor.
- O turno seguinte à recusa do critério 15 também falha, porque o PDF ficou na conversa: pare e diga.

## G1 O ponto de conferência

Depois da U3, antes do pull request: os pedidos gravados dos quatro agentes, os testes de
`Ag/assistant/` e `H/machine/`, o Hub local com o PDF do Banco Central anexado na tela (o caminho do
roteiro, passos 1 e 2), e a medição do critério 6 no pull request.

## U4 O anexo pela nota no stream

**Base e modelo.** `main` depois do fechamento da harness única. Sonnet. Esta unidade fecha a issue
[#1493](https://github.com/developmentconexus-ops/conexus/issues/1493).

### As linhas da tabela

Linha 4. Ler na base: `H/routes/stream.ts:8-38` (`STREAM_BEHIND_BYTES` e `slim`) e `:90-101`
(`kept`); `NMC/agent-controller-BhkzVgCi.js:1439-1452`; `W/harness/room/messages.ts:42-54` e
`:65-82` (o que a tela lê da `data-user-message`) e `:132-134` (`chipOf`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/routes/` | Muda `stream.ts` | as rotas de stream dos quatro agentes |

### Os contratos que a unidade cria

Nenhum tipo exportado. `slim` passa a enxugar também o `message_start` cuja mensagem tem a parte
`data-user-message`: em cada arquivo de `contents` que não é imagem, `data` vira a cadeia vazia, e
`mediaType` e `filename` ficam. A regra "imagem" é a de `Ag/assistant/files.ts:17`
(`SEEN_BY_MODEL`), e o `H/routes/` não importa de `Ag/`: o prefixo `image/` é o tipo MIME, e não uma
regra do Assistente, então a constante entra em `H/routes/stream.ts`. A web não muda: `UserContent`
já aceita `data` como cadeia (`W/harness/room/messages.ts:46-51`).

### As skills e a leitura

`mastra` (`node_modules/@mastra/core/dist/docs/`, os eventos do `AgentController`); `fastify-best-practices`.

### A ordem do trabalho

1. **O teste antes.** Critérios: 9, 10.
   - **Testes:** o caso novo em `H/routes/conversation-stream-paced.test.ts`, vermelho com
     `BEHIND`; o caso novo em `W/harness/room/messages.test.tsx`, verde hoje.
2. **O `slim` da mensagem da pessoa.** Critérios: 9, 10, 11.
   - **Mutações à mão:** tirar o ramo novo de `slim`, e o critério 9 fica vermelho; tirar os bytes da
     imagem também, e o critério 10 fica vermelho.
   - **Pronto quando:** o stream do caso novo chega ao fim do turno sem `BEHIND`.

### Como se prova

O caso do critério 9 manda pela porta do Hub uma mensagem com dois arquivos de 10 MB cada, abaixo do
teto do Mastra, e lê o stream inteiro. Hoje o stream fecha com `BEHIND`, e o estudo mediu 25 468 454
bytes num evento.

### Parar se

- Outro evento, além do `message_start`, leva os bytes (o estudo mediu cerca de duas vezes o data
  URL): enxugue-o pelo mesmo `slim` e diga qual era.
- A tela precisa dos bytes de um arquivo que não é imagem em algum lugar: pare e diga onde.

## U5 A busca de ferramentas sem reescrever o cache

**Base e modelo.** Depois da U4. Opus: o desenho depende da ordem do prefixo de três camadas (o
processador do Mastra, o AI SDK e a Anthropic), e o cartão não decide entre duas formas sem a prova.

### As linhas da tabela

Linha 6. Ler na base: a busca das leituras (`companyReadSearch`, hoje `H/tools/company/search.ts:28-44`,
movida para `Ag/assistant/` na U9 da harness única); o lugar dela na ficha do Assistente
(`processors.beforePick`); a issue #1285. Referência:
`M/packages/core/src/processors/processors/tool-search.ts:823-835`; `@ai-sdk/anthropic` 3.0.133
`dist/index.mjs:1689`, `:1769`, `:2450` e `:6474`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `Ag/assistant/` | Muda a busca e o teste de pesquisa; cria o pedido gravado | a ficha do Assistente |

### Os contratos que a unidade cria

Nenhum fora do Assistente. A forma sai do passo 1.

### As skills e a leitura

`mastra` (`node_modules/@mastra/core/dist/docs/`, `reference-processors-tool-search-processor.md`);
`claude-api` (o cache de prompt e a busca de ferramentas da Anthropic).

### A ordem do trabalho

1. **A prova do prefixo.** Critério: 12.
   - **Testes:** o pedido gravado de dois passos, com um `search_tools` no primeiro. Mostra onde o
     bloco de ferramentas muda.
   - **Pronto quando:** o relatório diz qual byte do prefixo muda e por quê.
2. **A forma que mantém o prefixo.** Critérios: 12, 14. Uma das duas: as leituras da conexão escolhida
   entram carregadas desde o primeiro passo (pelo `filter` e pela lista da conversa), ou elas vão à
   Anthropic com `defer_loading`. A escolhida é a que mantém o prefixo nos três provedores da lista de
   partida, ou, se nenhuma mantém, a que mantém na Anthropic sem mudar os outros.
3. **A ordem dos processadores.** Critério: 13.
   - **Mutações à mão:** mover a busca e `profileReadOnlyInRuns` para `afterPick`, e o critério 13
     fica vermelho.

### Parar se

- Nenhuma das duas formas mantém o prefixo no pedido gravado: volte ao estudo, com o pedido.
- A forma escolhida muda o pedido de um provedor que não é a Anthropic: diga o que muda antes do
  pull request.

## G2 O ponto de conferência

Depois da U5, antes do pull request: os testes de `H/routes/` e de `Ag/assistant/`, os pedidos
gravados, o teste de `W/harness/room/`, e o Hub local com os dois anexos grandes na tela (o passo 3
do roteiro).
