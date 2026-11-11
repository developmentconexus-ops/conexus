# O Assistente do dia a dia

Trilho: assistente

O fundador, em 2026-11-10: "Já queria fazer para liberar para o pessoal utilizar o a gente deixar a
harness do assistente funcional. [...] eu gostaria de, simplificar, pegar um system prompt que já
funciona, colocar nele. Principalmente a parte de arquivos. Arquivos e de visualização. A parte de
arquivos é, atualmente, quando você manda arquivos, ele não consegue ler. [...] a gente já viu que o
problema é nosso, como a gente considera os arquivos." E, no mesmo dia: "Eu estou falando só essas
features de chat que ajudam no trabalho, né? No dia a dia, de, por exemplo, das pessoas que vão estar
utilizando para pegar informações, para fazer análise de dados, né? [...] eu estou querendo fazer o
básico bem feito. [...] E mudar o sistema prompt, porque eu acho que ele ficou muito específico, né?
[...] tudo ele ficava gerando já output no Excel, em documento, sem eu pedir, sabe? Então, ter uma
solução melhor e verificar como isso é feito na indústria. Então, eu só quero deixar ela funcional
para o pessoal, enquanto a gente foca no builder, igual a gente está fazendo." E: "Usando tudo que
conseguirmos de /mastra nativo e do resto".

Este cartão escreve a seção 3 do estudo "O Assistente do dia a dia" (fora do repositório, base
`2e588732`), que partiu do estudo da harness de 2026-11-09 e o rodou de novo. É o primeiro cartão do
trilho do Assistente, que o fundador abriu em 2026-11-10 com "A" (delivery L1 e L5, em
https://github.com/developmentconexus-ops/conexus/pull/955). Cada linha do `main` citada foi lida em
`2e588732`, com `@mastra/core` 1.82.0, `@mastra/memory` 1.41.0, `@mastra/e2b` 0.16.1,
`@mastra/server` 1.82.0, `ai` 6.0.309, `react-markdown` 10.1.0 e `remark-gfm` 4.0.1. A prateleira
de referência: `mastra-1.82@6e8dfcb8`, `codex@970111f`, `open-webui@f7ac7ee`,
`anthropic-skills@2c5958e`, `claude-code@0ed9469`.

**O que se perdia, provado.** O estudo rodou contra o `main` uma conversa do Assistente com um PDF
de 200 KB e um texto, pelo Hub de verdade e um modelo dublê: o modelo recebe o PDF nos passos 0 e 1
e o perde no passo 2, quando a memória observacional resume a mensagem que o trazia; o observador
recebe o PDF inteiro; o Builder, na passagem, nem sabe que houve um arquivo. Hoje o arquivo vai como
parte da mensagem, inteiro, a cada chamada (`apps/web/src/builder/conversation/attachments.ts:28-35`),
e nenhuma peça o põe na máquina da conversa.

## A página do fundador

**No fim desta etapa** você manda ao Assistente um PDF grande, uma planilha e um documento Word, e
ele os lê de verdade, por partes, na máquina da conversa, como o Claude Code lê um arquivo grande:
responde na própria mensagem, com tabela quando ajuda, e acha os arquivos de novo dias depois;
quando você pede um fluxo, o diagrama aparece desenhado na conversa; e um Excel ou um Word só
aparece quando você pede um.

**O roteiro de uso.** Você é dono da empresa. No Início, abra uma conversa nova com o Assistente.

1. Anexe três arquivos: um PDF de umas 80 páginas com a política comercial, uma planilha `.xlsx` de
   preços e um contrato `.docx`. Pergunte: "quais são as regras de desconto?". O Assistente diz
   numa linha que vai ler os documentos por partes; aparecem as linhas das ferramentas (converter o
   PDF em texto, procurar, ler um trecho); a resposta vem na mensagem, com uma tabela das regras e de
   qual documento e página saiu cada uma. Nenhum arquivo Excel ou Word aparece.
2. Pergunte: "qual o maior desconto que a planilha permite para a linha de bebidas?". Ele calcula
   na máquina, sobre a planilha, e responde na mensagem, dizendo de onde veio o número.
3. No dia seguinte, na mesma conversa, pergunte: "o contrato fala de multa por atraso?". Ele acha
   o contrato na máquina da conversa, lê e responde, sem pedir que você mande de novo.
4. Peça: "mostre o fluxo de aprovação de um desconto". O diagrama aparece desenhado na mensagem, no
   tema claro e no escuro, no computador e no celular.
5. Peça: "me dê as regras de desconto em Excel". Só agora vem o arquivo `.xlsx`, ao lado da
   conversa, para baixar.
6. Diga: "quero um app para aprovar descontos". Toque **Criar app**: a primeira mensagem do Builder
   traz o resumo, o briefing e a lista dos três arquivos que você mandou, pelo nome.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. Antes do uso, depois do
merge: autoriza a chamada paga que refaz o molde da máquina das conversas, porque os conversores de
PDF e de Word (`poppler-utils` e `pandoc`) entram nele; se a U4 da Capacidade 3 também pedir o molde,
as duas mudanças vão numa chamada só. Se quiser, autoriza também uma bancada curta com modelo de
verdade na sua assinatura (as três perguntas do roteiro que só um modelo real prova, abaixo). No
fim: faz o roteiro, diz o que viu e aprova os textos das telas.

**Uma consequência que você vai ver.** Quando o molde muda, a máquina de cada conversa antiga
recomeça vazia na primeira mensagem seguinte: os arquivos que o Assistente escreveu nela antes
somem uma vez. Os arquivos que você mandou voltam sozinhos enquanto a mensagem que os trouxe ainda
não foi resumida pela memória; os de uma conversa já longa, você manda de novo. O molde é o mesmo
para toda conversa: as conversas com o Construtor e com os agentes do Projeto também recomeçam com
a máquina vazia, uma vez.

**Fica de fora.**

- **O HTML aberto ao lado da conversa.** Fica para uma etapa própria, com a emenda da regra de
  segurança S24: provou-se que, na política de segurança do Hub, um HTML com script só abre servido
  de um endereço separado. É a sua palavra de 2026-11-10: "eu não estou querendo complicar agora, eu
  estou querendo fazer o básico bem feito", e o HTML "foi só um exemplo de facilidade". Hoje o HTML
  continua indo para baixar.
- **Os arquivos nas conversas com o Builder e com os agentes do Projeto.** Nelas, o arquivo continua
  indo inteiro na mensagem, como hoje, e some quando a memória resume a mensagem que o trazia. Este
  cartão conserta a conversa do Assistente, a que o seu pedido nomeia; as outras pedem um cartão
  próprio.
- **A cópia durável dos arquivos fora da máquina (no R2).** A máquina pausa e guarda os arquivos
  enquanto a conversa existir; a cópia fora dela cobre o caso raro de a máquina ser perdida depois
  que a memória resumiu a mensagem. Fica como dívida medida.
- **O Assistente reler as mensagens antigas palavra por palavra** (`recall`). Continua desligado,
  como hoje: os arquivos ficam na máquina e não dependem disso.
- **Gráfico desenhado a partir de um bloco na mensagem (Vega-Lite).** O gráfico continua sendo uma
  imagem feita na máquina e mostrada ao lado, como hoje; o modelo faz melhor em Python.
- **Uma skill de arquivos** (receitas por tipo). Duas frases no texto do Assistente bastam agora; a
  skill entra se o uso mostrar falta.
- **Os avisos guardados para um cartão** (`next-card`, 147 abertos em 2026-11-11). Este cartão toma
  a linha "Diagrams (Mermaid)" do #541, que dizia "a shown file, drawn by the screen": o diagrama
  passa a ser desenhado na própria mensagem, como as referências fazem. Os outros que tocam o assunto
  esperam o seu gatilho: o #778 (quanto tempo uma conversa que ninguém abre guarda os arquivos) é
  uma decisão sua para quando a primeira conta do E2B pesar; o #382 (a fileira de anexos com muitos
  arquivos) não muda com três arquivos; o #540 guarda o corte de 20 linhas de uma leitura, que não
  muda aqui.

**As decisões suas nesta etapa.** Todas já têm a sua palavra ou a do firstmate sobre o estudo; uma
muda uma resposta sua anterior.

- **O Assistente ganha um trilho próprio e anda ao lado do Builder.** Em 2026-11-10, à pergunta se
  o Assistente constrói ao lado da frente do Builder (A) ou espera por ela (B): "A".
- **O arquivo vai para a máquina da conversa, e o Assistente o lê por partes.** É como o Claude
  Code, o Codex e o próprio Mastra fazem: o arquivo grande mora no disco, e o agente converte, procura
  e lê o trecho que precisa; nunca o documento inteiro na conversa. O Mastra instalado já tem a peça
  (`FileUploadProcessor`), e o Conexus só a liga à máquina de cada conversa. A base: "a gente já viu
  que o problema é nosso, como a gente considera os arquivos" e "Usando tudo que conseguirmos de
  /mastra nativo", em 2026-11-10. As imagens continuam indo ao modelo, que as vê. Um `.csv`, um
  `.txt` ou um `.md` mandado ao Assistente também vai para a máquina, como arquivo, e não inteiro
  na conversa.
- **O Mastra Code e a Factory são a referência, e o Assistente segue a forma deles.** Em 2026-11-11:
  "vamos fazer igualzinho o Master Code faz, o Factor faz ... utilizar bem como referência e ver como
  eles fazem o código e utilizam os recursos nativos do Mastra." Abri o código deles na versão que o
  Conexus instala. Neles, a pessoa só anexa imagem: a imagem vai na mensagem e o modelo a vê; um
  arquivo grande mora no disco da máquina, e o agente o lê com as ferramentas nativas, por partes;
  a memória escolhe, por uma opção nativa, que anexos o resumo vê; e os arquivos do primeiro pedido
  passam do Início para a conversa guardados na tela, o que o Conexus já faz igual. O Assistente faz
  o mesmo, com uma diferença só, que vem do seu pedido de 2026-11-10: lá não se anexa PDF, planilha
  nem Word, e aqui sim. Para esses, a peça é a do próprio Mastra (`FileUploadProcessor`), que põe o
  arquivo no disco da máquina; dali em diante o caminho é o do Mastra Code.
- **O texto do Assistente passa a dizer como responder: na mensagem, e arquivo só quando pedido.**
  Isto muda a sua resposta A de 2026-10-31 ao estudo do prompt (sem regras de como responder). O
  texto de hoje empurra para arquivo em cinco lugares e nunca diz que a mensagem é o lugar normal da
  resposta; você viu o efeito: "tudo ele ficava gerando já output no Excel, em documento, sem eu
  pedir", e pediu "ter uma solução melhor e verificar como isso é feito na indústria" (2026-11-10).
  Os textos abertos que funcionam (o do Codex e o do Mastra Code) respondem na mensagem e fazem o
  arquivo quando o trabalho é o arquivo. A regra nova: responder na mensagem, com tabela para
  comparar, diagrama para fluxo, gráfico como imagem quando um número muda no tempo ou entre grupos;
  fazer Excel, Word ou PowerPoint só quando a pessoa pede um arquivo ou quando o resultado é um
  documento para levar adiante. Recomendo; ao aprovar esta página, você aprova a troca.
- **O texto novo é escrito em palavras nossas, com a estrutura do Codex e do Mastra Code.** Decidido
  pelo firstmate sobre o estudo: os dois são abertos (Apache-2.0), mas são textos de programador em
  inglês, e adaptá-los a uma empresa brasileira muda quase toda frase; o repositório é público e não
  guarda texto de terceiros. A base: "pegar um system prompt que já funciona" (2026-11-10): pega-se a
  forma que funciona, não as palavras.
- **O diagrama é desenhado na mensagem.** Em 2026-10-31, ao estudo do ecossistema, você respondeu
  "B1" (o Mermaid, então na 24.5); em 2026-11-10: "ele gera, ele, para me explicar, gera diagramas".
  O desenho vale para toda conversa que usa a mesma tela, a do Builder e a dos agentes incluídas.
  Ele depende de uma prova que a U3 faz primeiro: se a política de segurança da página recusar o
  desenho, a U3 para e o firstmate traz as opções, e o passo 4 do roteiro espera a sua escolha.
- **O HTML ao lado fica para depois.** Decidido pelo firstmate sobre o estudo, com a sua palavra de
  2026-11-10 acima ("fazer o básico bem feito").

**Só um modelo de verdade prova.** Que o modelo, com o texto novo, converte e lê por partes; que acha
o arquivo dias depois; e com que frequência ainda faz um arquivo sem pedido. Os testes provam a
mecânica com um modelo dublê; a sua assinatura prova o comportamento, na bancada se você autorizar,
e no seu uso no fim.

**Como as unidades viram pull requests.** U1, U2, U3 e U4 vão num só pull request de construção, um
commit por unidade, nessa ordem, depois que esta página for aprovada e o pull request do trilho
(https://github.com/developmentconexus-ops/conexus/pull/955) estiver no `main`. A chamada paga do
molde vem depois do merge, antes do uso. Ao aprovar esta página, você aprova também esse agrupamento.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 Arquivos lidos | O processador nativo `FileUploadProcessor`, construído a cada passo com a máquina do passo, que ele liga antes; as imagens ficam com o modelo, como no Mastra Code; nenhum teto próprio (o da rota vale); `observeAttachments: ['image/*']` na memória do Assistente; a estimativa de tokens da parte de arquivo; `read_file` sem PDF entre os tipos de mídia; xlsx, docx e csv aceitos no compositor do Assistente, e só nele, e todo arquivo que não é imagem mandado dali como arquivo, não como texto; `poppler-utils` e `pandoc` no molde; a lista dos arquivos na passagem ao Builder | `apps/server/src/builder/assistant/`, `apps/server/src/builder/controller-kit/memory.ts`, `apps/server/src/builder/machine/conversation.ts`, `infra/e2b/template.ts`, `apps/web/src/builder/conversation/{attachments,room,composer}.ts(x)`, `apps/web/src/builder/conversation/messages.test.tsx`, `docs/explanation/harness.md` | [security](../guides/security.md) | esta página aprovada; https://github.com/developmentconexus-ops/conexus/pull/955 no `main` |
| U2 O texto do Assistente | `prompt/assistant.md` novo, em seções; os cinco empurrões para arquivo fora; a frase de `uploads/`; a descrição de `show_file` sem empurrão | `apps/server/src/builder/assistant/prompt/`, `apps/server/src/builder/assistant/instructions.test.ts`, `apps/server/src/builder/machine/show-file.ts` | [testing](../guides/testing.md) | U1 (a frase de `uploads/` só é verdade com ela) |
| U3 O diagrama na mensagem | O pacote `mermaid`, carregado só quando um bloco `mermaid` fechado aparece, com `securityLevel: 'strict'`, mostrado como imagem SVG se a prova de CSP pedir; o erro de sintaxe mostra o código; a linha de `mermaid` em `stack.md` | `apps/web/src/builder/conversation/{markdown,diagram}.tsx`, `apps/web/package.json`, `package-lock.json`, `apps/web/diagram.layout.test.ts`, `docs/reference/stack.md` | [web](../guides/web.md) | esta página aprovada; o pull request https://github.com/developmentconexus-ops/conexus/pull/948 no `main` (ele muda `apps/web/package.json`) |
| U4 O roteiro como teste | O roteiro desta página pela porta pública com o modelo dublê: a regressão do estudo (nenhum passo recebe os bytes do PDF; o arquivo achado depois da observação; o Builder com a lista), e o caso de modelo de verdade, opcional, com `opt-in:` | `apps/server/src/builder/assistant/files-journey.test.ts`, `apps/server/src/platform/recordings/mastra/` | [testing](../guides/testing.md) | U1, U2, U3 |

U1 e U3 não dividem arquivo e podem ser construídas em paralelo, em ramos; o pull request as junta
na ordem U1, U2, U3, U4. A U2 lê o que a U1 deixou; a U4 lê as três.

**Os trilhos.** O trilho do Assistente é dono de `apps/server/src/builder/assistant/`. Outros
arquivos que a U1, a U2 e a U3 mudam são de pastas que o Builder e os agentes também usam:
`controller-kit/memory.ts` e `machine/conversation.ts` ganham um parâmetro que só o Assistente passa,
e `attachments.ts`, `room.ts` e `composer.tsx` ganham a lista por sala, que deixa a do Builder e a
dos agentes como está (nenhum deles muda de comportamento); `machine/show-file.ts` muda só a
descrição da ferramenta, que os agentes também leem; `markdown.tsx` desenha o diagrama em toda
conversa. Nenhum
deles está no pull request de construção da Capacidade 3
(https://github.com/developmentconexus-ops/conexus/pull/948, lido em 2026-11-11), que muda
`apps/web/package.json`: a U3 espera ele entrar no `main` ([delivery L1](../guides/delivery.md)).
`infra/e2b/template.ts` é o molde de toda máquina de conversa; a U4 da Capacidade 3, se o fundador a
autorizar, também o refaz, e a chamada paga é uma só. Nenhuma unidade muda `apps/web/src/{brand,ui}/`
(o trilho de desenho): se a ficha de um anexo xlsx ou docx precisar mudar `ui/attachment.tsx`, a U1
para e espera a unidade de desenho.

**Orçamento de código alterado.** U1: ~390 linhas (o processador embrulhado, a tradução da falha e a estimativa ~120, a
memória e a máquina ~20, a passagem ~60, o compositor por sala ~80, o molde ~5, as ligações ~40, o
documento ~20, a gravação nativa da mensagem com arquivo, gerada, fora da conta). U2: ~220 (o texto
~190, a descrição e as ligações ~30). U3: ~230 (o diagrama ~170, o Markdown ~30, a linha de
`stack.md` ~5, o resto das ligações ~25). U4: só testes. Total da etapa: ~840 linhas, abaixo do
orçamento de [delivery L2](../guides/delivery.md).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Uma conversa do Assistente que recebe um PDF: nenhuma chamada do Assistente ao modelo, em nenhum passo e em nenhum turno, leva os bytes do PDF (parte `document`); cada chamada até a observação leva a nota nativa (`[File uploaded to the sandbox]`, com o caminho absoluto sob `uploads/<conversa>/`, o nome, o tipo e o tamanho) | `apps/server/src/builder/assistant/files.test.ts`, "o PDF vai para a máquina: nenhum passo recebe os bytes" | must |
| 2 | U1 | O arquivo está na máquina da conversa no caminho que a nota diz, com o SHA-256 dos bytes enviados; mandar os mesmos bytes de novo não grava um segundo arquivo | `files.test.ts`, "o arquivo na máquina: o mesmo caminho para os mesmos bytes" | must |
| 3 | U1 | A chamada do observador da memória não recebe parte de arquivo que não seja imagem, e o seu texto leva `[File #1: <nome>]` para o PDF; uma imagem PNG continua chegando a ele, como hoje | `files.test.ts`, "o observador vê o marcador, não o arquivo" | must |
| 4 | U1 | Uma imagem PNG enviada continua chegando ao modelo como imagem, e nenhuma nota é feita para ela | `files.test.ts`, "a imagem fica com o modelo" | must |
| 5 | U1 | Um arquivo de 11.000.000 bytes (acima dos 10.485.760 do padrão do Mastra e abaixo do teto da rota) vai para a máquina, e o turno não para; a recusa acima do teto continua sendo a do compositor (`too-large`) | `files.test.ts`, "o teto é o da rota"; `apps/web/src/builder/conversation/attachments.test.tsx`, o caso de hoje | must |
| 6 | U1 | `read_file` sem `encoding` sobre um PDF na máquina do Assistente devolve só os metadados (caminho, tamanho, tipo), não uma parte de mídia; sobre um PNG, a imagem; a ferramenta dos agentes e do Construtor fica como hoje | `files.test.ts`, "read_file: o PDF só por metadados" | must |
| 7 | U1 | O compositor do Assistente aceita `.xlsx`, `.docx` e `.csv`, também quando o navegador deixa o tipo vazio ou dá `application/vnd.ms-excel` a um `.csv`; ele manda `.csv`, `.txt` e `.md` com o tipo `application/octet-stream`, para que a rota do Mastra não os ponha inteiros como texto (`createMessageInput`), e eles chegam à máquina como os outros; o compositor do Builder e o dos agentes recusam os três com a frase de tipo de hoje e mandam texto como hoje | `attachments.test.tsx`, "o Assistente aceita planilha, documento e csv; o Builder e os agentes não" | must |
| 8 | U1 | A primeira chamada do Builder depois de uma passagem leva, além do resumo e do briefing, uma parte de texto em português, que começa com "Arquivos que a pessoa mandou ao Assistente:", com a lista dos arquivos que a pessoa mandou na conversa do Assistente (nome, tipo dito em palavras e tamanho) e nenhum byte de arquivo; sem arquivo, nenhuma parte nova. A primeira mensagem da conversa do Builder, na tela, mostra essa parte como veio, em português, e nenhuma palavra em inglês | `apps/server/src/builder/assistant/handoff.test.ts`, "a passagem leva a lista dos arquivos"; `apps/web/src/builder/conversation/messages.test.tsx`, "a lista da passagem aparece como veio" | must |
| 9 | U1 | Com a mensagem do PDF já observada, a chamada seguinte leva a observação com `[File #1: <nome>]`, e o arquivo continua em `uploads/<conversa>/` na máquina, onde `execute_command` com `ls` o acha | `files.test.ts`, "o arquivo achado depois da observação" | must |
| 10 | U1 | Com o PDF de 200 KB e o texto do roteiro do estudo, a observação acontece no mesmo ponto em que aconteceria sem o arquivo (a parte conta como a sua nota, não como os seus bytes); sem o carimbo, ela vem antes | `files.test.ts`, "o arquivo conta como a nota" | must |
| 11 | U1 | O molde instala `poppler-utils` e `pandoc`: na máquina refeita, `pdftotext -v` e `pandoc --version` terminam com 0 | conferido ao vivo pelo firstmate depois da chamada paga ([delivery L17](../guides/delivery.md)) | must |
| 12 | U1 | A máquina que não liga com um arquivo no pedido, ou que liga e recusa a gravação do arquivo do turno: o turno termina com a falha `MACHINE_UNAVAILABLE` que a tela já diz, nunca com `MODEL_REFUSED`, e o arquivo não chega ao modelo | `files.test.ts`, "a máquina fora: o turno falha e o arquivo não vaza" e "a gravação recusada: o turno falha e o arquivo não vaza" | must |
| 13 | U2 | A mensagem fixa do Assistente tem seções com título; diz que a resposta é a mensagem, com tabela para comparar, diagrama `mermaid` para fluxo ou estrutura e gráfico como imagem pelo `show_file`; diz que xlsx, docx e pptx são feitos só quando a pessoa pede um arquivo ou quando o resultado é um documento para levar adiante; diz que os arquivos da pessoa ficam em `uploads/` e que se lista antes de dizer que um arquivo não existe; a seção de como responder vem antes da que descreve o computador e as bibliotecas instaladas (hoje a lista de bibliotecas de escritório abre o texto); e não traz "The person sees only your messages and the files you show with show_file", "compute on your machine and show files" nem "A question, a table, a chart or a file is yours to answer" | `apps/server/src/builder/assistant/instructions.test.ts`, "o texto novo: responder na mensagem, arquivo só quando pedido" | must |
| 14 | U2 | A mensagem fixa continua os mesmos bytes em toda conversa de toda empresa, com a sua marca de cache, antes do bloco da conversa | `instructions.test.ts`, o caso de hoje "a mensagem fixa: a mesma em toda conversa" | must |
| 15 | U2 | A descrição de `show_file` diz só o que a ferramenta faz (abre ao lado um arquivo da pasta, para ler ou baixar) e não manda mostrar | `apps/server/src/builder/assistant/show-file.test.ts`, "a descrição diz o que a ferramenta faz" | must |
| 16 | U2 | Nenhuma sequência de seis palavras do texto novo é igual a uma do prompt do Codex (`gpt_5_2_prompt.md`) ou dos prompts do Mastra Code | o relatório do construtor, com a contagem (zero) e o comando, rodado fora do repositório | should |
| 17 | U3 | Uma resposta acabada com um bloco ` ```mermaid ` fechado mostra o diagrama desenhado, como imagem com nome acessível "Diagrama", a 1366 e a 390 px, no tema claro e no escuro, sem erro no console e sem recusa da política de segurança | `apps/web/diagram.layout.test.ts`, "o diagrama desenhado, nos dois temas e nas duas larguras" | must |
| 18 | U3 | Enquanto a resposta chega, o último bloco, mesmo com a cerca fechada pelo `remend`, mostra o código e não desenha; quando o turno acaba, desenha uma vez | `apps/web/src/builder/conversation/markdown.test.tsx`, "o bloco mermaid em andamento fica código" | must |
| 19 | U3 | Um bloco `mermaid` com erro de sintaxe mostra o código como hoje e uma linha que diz que o diagrama não pôde ser desenhado, sem erro não tratado | `markdown.test.tsx`, "o mermaid inválido mostra o código"; `diagram.layout.test.ts`, o mesmo no navegador | must |
| 20 | U3 | Um rótulo com `<img src=x onerror=…>`, uma diretiva `click`, uma imagem de endereço de fora ou um `url()` ou `@import` de fora num estilo: nenhum script roda e nenhum pedido sai da página (a CSP do Hub recusa a busca durante o desenho, e a imagem SVG não busca nada); o diagrama sai desenhado sem o endereço, ou fica código | `diagram.layout.test.ts`, "o diagrama não roda nem busca nada"; `harness.unanswered` vazio | must |
| 21 | U3 | O pacote `mermaid` não está no pedaço de entrada da tela: é baixado só quando a primeira resposta com um bloco `mermaid` fechado é desenhada | `apps/web/vite.config.test.ts`, "mermaid fica num pedaço próprio"; `diagram.layout.test.ts`, os pedidos da página antes e depois | must |
| 22 | U3 | As cores do diagrama saem dos tokens do tema; trocar o tema desenha de novo com as cores do outro | `diagram.layout.test.ts`, "o diagrama segue o tema" | should |
| 23 | U4 | O roteiro desta página pela porta pública, com o modelo dublê: os três arquivos enviados, a pergunta, a observação, a pergunta do dia seguinte, o pedido do diagrama, o pedido do Excel e a passagem; em cada chamada do Assistente, nenhum byte de arquivo que não seja imagem; o Builder recebe a lista. Falha hoje (o estudo: o PDF nos passos 0 e 1, perdido no 2, o observador com o PDF, o Builder sem o nome) | `files-journey.test.ts`, "o roteiro do Assistente do dia a dia" | must |
| 24 | U4 | Com `REAL_MODEL` e a palavra do fundador: na assinatura dele, a pergunta das regras converte e lê por partes, a pergunta do dia seguinte acha o arquivo, e nenhuma das perguntas sem pedido de arquivo faz um xlsx ou docx; sem a variável, o caso pula com `opt-in:` | `files-journey.test.ts`, "o roteiro com modelo de verdade" | should |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O compositor do Assistente, os anexos | A fileira de fichas de hoje, agora também com `.xlsx`, `.docx` e `.csv`, cada um com o nome | Sem anexo: o compositor de hoje | A leitura do arquivo no navegador, como hoje | O arquivo que o navegador não lê: a frase `unread` de hoje | não se aplica | Não acontece: quem conversa com o Assistente anexa | Tipo fora da lista: a frase `type` de hoje; acima do teto: `too-large` e `too-large-together` de hoje |
| O compositor do Builder e o dos agentes | Como hoje | Como hoje | Como hoje | Como hoje | não se aplica | Como hoje | `.xlsx`, `.docx` e `.csv` recusados com a frase `type` de hoje |
| A mensagem da pessoa com arquivos | As fichas do que ela mandou, como hoje (a mensagem guardada mantém o arquivo) | não se aplica | não se aplica | não se aplica | não se aplica | não se aplica | não se aplica |
| A linha da ferramenta que lê ou converte | A linha de hoje de `execute_command` e de `read_file`, com os argumentos e o resultado no detalhe | não se aplica | A linha rodando, como hoje | A falha no detalhe, como hoje | O arquivo que não existe: a recusa da ferramenta no detalhe | não se aplica | não se aplica |
| O turno quando a máquina não liga, ou não grava o arquivo, com um arquivo no pedido | não se aplica | não se aplica | "Ligando o computador", a fase de hoje | A falha de turno de hoje (`MACHINE_UNAVAILABLE`) | não se aplica | não se aplica | não se aplica |
| O diagrama na mensagem | O primeiro bloco `mermaid`: o código enquanto o pacote chega, depois a imagem | não se aplica | Enquanto a resposta chega, e até o desenho ficar pronto: o bloco de código de hoje | Sintaxe inválida, ou o pacote que não carrega: o bloco de código e a linha "Não foi possível desenhar este diagrama." | não se aplica | não se aplica | O rótulo com HTML ou `click`: sai como texto, desenhado |
| A primeira mensagem do Builder depois da passagem | O resumo, o briefing e, com arquivo, a lista "Arquivos que a pessoa mandou ao Assistente:", com a frase "Eles ficam na conversa do Assistente; este Projeto não os tem. O que o briefing diz deles é o que o Assistente leu." (a mesma parte que o Builder lê, um dono só) | Sem arquivo: o resumo e o briefing, como hoje | não se aplica | A passagem que falha: a de hoje | não se aplica | não se aplica | não se aplica |

As frases entre aspas são a proposta do cartão; o fundador aprova os textos das telas no fim
([delivery L23](../guides/delivery.md)). Nenhuma célula declara "sem detalhe": as linhas de
ferramenta abrem os argumentos, o resultado e a recusa, como hoje.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| A nota `[File uploaded to the sandbox]` no pedido ao modelo | U1, o `FileUploadProcessor` nativo, por `machineUploads` | o modelo do Assistente |
| `providerMetadata.mastra.tokenEstimate` na parte de arquivo guardada | U1, `machineUploads().processInput` | o contador de tokens da memória observacional |
| `Room.files` (`MODEL` ou `MACHINE`) | U1, `room.ts` (`ASSISTANT_ROOM` `MACHINE`; `BUILDER_ROOM` e `agentRoom` `MODEL`) | U1, `composer.tsx` e `attachments.ts` (a lista aceita) |
| `SentFile` (`name`, `mediaType`, `bytes`) | U1, `assistant/files.ts` `sentFilesOf`, das partes `file` guardadas | U1, `handoff.ts` `contentsOf` |
| `readMedia` das máquinas de conversa | U1, `assistant.ts`, ao criar as suas máquinas | U1, `machine/conversation.ts`, a opção `mediaTypes` de `read_file` |
| `Drawn` (`DRAWING`, `DRAWN` com `src` e `title`, `NOT_DRAWN`) | U3, `diagram.tsx` | U3, `diagram.tsx` (a imagem ou o código) |

**O desenho de caixas.** O produto antigo não desenhava diagrama nem lia arquivo na máquina
(`conexus-os@e0353c36` não tinha máquina de conversa), então não há captura a seguir. O diagrama
ocupa a largura do bloco de código de hoje, com rolagem lateral quando é mais largo, como a tabela
(`markdown.tsx:73-77`); no celular, o mesmo, com a rolagem.

```
1280 px, conversa do Assistente                390 px
┌──────────────────────────────────────────┐   ┌──────────────────────────┐
│ O fluxo de aprovação de um desconto:     │   │ O fluxo de aprovação:    │
│ ┌──────────────────────────────────────┐ │   │ ┌──────────────────────┐ │
│ │ [Pedido] → [Vendedor] → [Gerente] ─┐ │ │   │ │ [Pedido] → [Vende… ◀▶│ │
│ │                 acima de 10% ──────┘ │ │   │ │  (rola para o lado)  │ │
│ │                → [Diretor] → [Ok]    │ │   │ └──────────────────────┘ │
│ └──────────────────────────────────────┘ │   │ Quem aprova acima de 10% │
│ Quem aprova acima de 10% é o diretor.    │   │ é o diretor.             │
└──────────────────────────────────────────┘   └──────────────────────────┘

O erro de sintaxe (as duas larguras)
┌──────────────────────────────────────────┐
│ ┌ código ──────────────────────────────┐ │
│ │ flowchart LR                         │ │
│ │   A[Pedido] --> B[[Vendedor          │ │
│ └──────────────────────────────────────┘ │
│ Não foi possível desenhar este diagrama. │
└──────────────────────────────────────────┘
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Pôr o arquivo na máquina (`FileUploadProcessor.processLLMRequest`: `writeFiles` com nome temporário, depois `mv`), antes de cada chamada ao modelo | Uma conversa tem uma rodada por vez (o controlador do Mastra); dentro dela, o estado do processador grava cada arquivo uma vez (doc `:136`), e os mesmos bytes vão ao mesmo caminho, que a segunda vez só confere | O nome temporário e o `mv` (doc `:151`): uma gravação cortada nunca fica no caminho final. Para um arquivo do turno, o nativo para o turno pelo `abort` (`UPLOAD_FAILED` ou `NO_WRITE_CAPABILITY`, `file-upload.ts:157,166-168`); o embrulho troca esse `abort` pela falha `MACHINE_UNAVAILABLE`, e o turno acaba com ela; o turno seguinte grava de novo, porque a mensagem ainda está no pedido. Para um arquivo só do histórico, o nativo deixa uma nota e segue (`noteSandboxFailures`, `file-upload.ts:157`) | A máquina que não liga: o embrulho a liga antes de chamar o nativo (`workspace.resolveSandbox`), e a falha `MACHINE_UNAVAILABLE` da partida (`machine/conversation.ts:178-187`) sobe e o turno falha com ela, também por um arquivo só do histórico. Sem isso, o nativo troca a falha por `FileUploadError` `NO_SANDBOX` (`@mastra/core@1.82.0` `dist/agent-BP9OWM6D.js:1656-1664`), o `abort` vira um `TripWire`, e a tela diria `MODEL_REFUSED` (`conversation/turn-line.ts:8`) | `MACHINE_STARTED` e `MACHINE_UNAVAILABLE`, os de hoje; a gravação recusada imprime `MACHINE_UNAVAILABLE` com `reason: 'UPLOAD'` e o código do Mastra, nunca o nome de um arquivo (S41) | 1, 2, 5, 12 |
| Carimbar a estimativa na parte de arquivo (`processInput`, antes de o Mastra guardar a mensagem; `processInputStep` para um arquivo que chega por um sinal no meio da rodada) | Nenhuma gravação própria: vai na gravação da mensagem que o Mastra já faz | Como a gravação da mensagem de hoje | O banco do Mastra: a falha de turno de hoje | nada novo | 10 |
| A passagem ao Builder com a lista dos arquivos (`handoff.ts`) | Nenhuma gravação nova: a mesma mensagem da passagem de hoje, com uma parte de texto a mais | Como a passagem de hoje (a chave de tentativa, `HANDOFF_NOT_DELIVERED`) | Como a passagem de hoje | os de hoje | 8 |
| Refazer o molde da máquina (`infra/e2b`, chamada paga, pelo firstmate, com a palavra do fundador) | Um nome de molde só: a segunda construção substitui a primeira | A construção que falha deixa o molde anterior no ar, e as máquinas seguem sem os conversores: o texto do Assistente cita `pypdf` e `python-docx`, que já estão no molde | O E2B fora: nada muda nas máquinas | o registro da construção, fora do Hub | 11 |
| A primeira máquina de uma conversa antiga depois do molde novo (`killStale`, `machine/conversation.ts:174`) | Uma partida por conversa (a fila da conversa, `conversation.ts:126-157`) | A máquina antiga morre antes da nova ligar; os arquivos dela somem uma vez; os da pessoa voltam enquanto a mensagem que os trouxe está no pedido | O E2B fora: `MACHINE_UNAVAILABLE`, como hoje | `MACHINE_STARTED` | a página do fundador |
| Desenhar o diagrama (U3, só no navegador) | Nenhuma gravação | — | O pacote que não carrega: o código e a frase do erro | nada no servidor | 17, 19 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O arquivo vai para a máquina; o modelo recebe uma nota com o caminho | U1 | `apps/web/src/builder/conversation/attachments.ts:28-35` (o arquivo inteiro como URL de dados); `apps/server/src/builder/controller-kit/factories.ts:51-75` (`agentDefaults`, nenhum processador de arquivo); `assistant/assistant.ts:304` (a máquina escolhida por pedido) | `@mastra/core@1.82.0` `dist/docs/references/reference-processors-file-upload-processor.md:7,89,128-136,150-158`; `mastra-1.82@6e8dfcb8` `packages/core/src/processors/processors/file-upload.ts:96-170`; `@mastra/core@1.82.0` `dist/processors/index.d.ts:348-349` (`ProcessLLMRequestArgs.workspace`, a máquina do passo); `claude-code@0ed9469` `CHANGELOG.md:1288`; `codex@970111f` `codex-rs/protocol/src/user_input.rs:16-52`; `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/workspace.ts:243-262` e `tool-availability.ts:92-120` (no Mastra Code o arquivo grande mora no disco da máquina e o agente o lê com as ferramentas nativas); nenhum `FileUploadProcessor` nem `uploadPromptFiles` em `mastracode/` (busca no código) (ele não anexa arquivo que não seja imagem, então não precisa da peça) | O Mastra grava o arquivo na máquina, `uploads/<conversa>/<sha256>.<ext>`, e troca a parte pela nota, só no pedido; o Claude Code deixou de guardar os bytes do PDF na conversa; o Codex só põe na mensagem texto, imagem e áudio | embrulhado: o processador nativo construído a cada `processLLMRequest` com `args.workspace`, a máquina do passo. O que segura o embrulho é a falha: a máquina que não liga ou não grava precisa sair como `MACHINE_UNAVAILABLE`, e o nativo troca qualquer erro do resolvedor por `NO_SANDBOX` e para o turno por `abort`, que a tela lê como `MODEL_REFUSED` (`@mastra/core@1.82.0` `dist/agent-BP9OWM6D.js:1656-1664`, `conversation/turn-line.ts:8`). A outra forma, o processador nativo inteiro sobre um `Workspace` fixo criado com o agente, cujo resolvedor delega a `machines.workspace(requestContext)` (o `Workspace` de hoje já usa um resolvedor, `machine/conversation.ts:277-279`), traria as conferências de `processInput` e `processInputStep`, mas não deixa trocar a falha: o `abort` é do nativo. Com um embrulho de qualquer jeito, construir o nativo a cada chamada com a máquina do passo é o menor; o nosso são ~30 linhas: a partida antes e o `abort` traduzido | O estudo, rodado em `2e588732` com o embrulho: chamadas 1 e 2 com `pdf:0 note:true`, o caminho sob `uploads/<conversa>/` | 2026-11-10: "a gente já viu que o problema é nosso, como a gente considera os arquivos"; "Usando tudo que conseguirmos de /mastra nativo" | `apps/server/src/builder/assistant/files.ts` |
| O que fica com o modelo: as imagens | U1 | `attachments.ts:9-10` (PNG, JPEG, GIF e WebP aceitos) | doc `:93-107` (`filter`, o exemplo que deixa ao modelo o que ele lê); `mastra-1.82@6e8dfcb8` `mastracode/factory-ui/src/ui/domains/chat/components/useComposerImages.ts:10-11,31` e `Composer.tsx:138-148,289` (a Factory anexa só imagem, até 10 MB cada e 20 MB juntas, e a manda como parte `file` na mensagem); `packages/core/src/agent-controller/session.ts:4912-4946` (`createMessageInput`, a parte `file` como veio) | Um filtro por arquivo, chamado de novo a cada chamada, com a mesma resposta; no Mastra Code e na Factory, a imagem vai ao modelo na mensagem | nativo: `filter: ({ mimeType }) => !mimeType.startsWith('image/')` | | não precisa | (o mesmo) |
| O teto de um arquivo | U1 | `attachments.ts:8` (`LIMITS.data`, 14.680.064 caracteres da URL de dados) | doc `:77` (`maxFileSize`, 10 MB por padrão); `@mastra/server@1.82.0` `dist/server/handlers/agent-controller.js:170-183` (o teto da rota) | O processador para o turno acima do teto | nativo: `maxFileSize: () => Number.POSITIVE_INFINITY`, porque a rota já limita todo arquivo e o nativo aceita qualquer número ≥ 0 (`mastra-1.82@6e8dfcb8` `file-upload.ts:604`); nenhuma constante nossa repete o teto da rota, que hoje já vive na rota e em `attachments.ts:8` | | não precisa | (o mesmo) |
| O observador sem o binário | U1 | `controller-kit/memory.ts:79-92` (a observação, sem a opção) | `@mastra/memory@1.41.0` `dist/docs/references/docs-memory-observational-memory.md:299,446-467` | `observeAttachments` escolhe que anexos o observador vê; o padrão é `['image/*', 'application/pdf']` (`@mastra/core@1.82.0` `dist/memory/types.d.ts:574-584`); fora da lista, o anexo sai e `[File #1: nome]` fica no texto, também nos resultados de ferramenta. O Mastra Code passa a opção, `'auto'` por padrão, e a Factory a deixa trocar por pessoa (`mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/memory.ts:284-287,360`, `sdk/src/schema.ts:223`) | nativo: `observeAttachments: ['image/*']`, só pela memória do Assistente: a imagem continua chegando ao observador, como hoje e como no Mastra Code, e o PDF sai | O estudo: a chamada do observador com `pdf:0` e o marcador | não precisa | — |
| A contagem de tokens da parte de arquivo | U1 | nenhuma: a parte guardada pesa como o arquivo | `docs-memory-observational-memory.md:793-823` (`providerMetadata.mastra.tokenEstimate`, `source: 'client'`); `@mastra/memory@1.41.0` `dist/src-BncFunCW.js:28357-28395,28928-28944` (sem estimativa, uma parte de arquivo pesa os bytes divididos por 3 ou 4) | Quem manda a parte dá a estimativa, que o contador usa como vem | embrulhado: `processInput` e `processInputStep` carimbam nas partes de arquivo novas que não são imagem a estimativa da nota (`NOTE_TOKENS`) | Um PDF de 200 KB pesa de 50 a 67 mil tokens contra os 30 mil da observação (`controller-kit/memory.ts:87`); critério 10 | não precisa | (o mesmo) |
| O PDF nunca inteiro por `read_file` | U1 | `machine/conversation.ts:283-296` (as ferramentas da máquina, sem `mediaTypes`) | `@mastra/core@1.82.0` `dist/docs/references/reference-workspace-workspace-class.md:488-505`; `mastra-1.82@6e8dfcb8` `packages/core/src/workspace/tools/read-file.ts:160-199`; `@mastra/e2b@0.16.1` `dist/index.js:479` (o `stat` nativo dá o tipo pelo nome) | Fora de `mediaTypes`, um binário volta só com os metadados; o Mastra Code deixa o padrão, com o PDF (`mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/tool-availability.ts:101`, sem `mediaTypes`; `packages/core/src/workspace/tools/read-file.ts:17`) | nativo: `mediaTypes: ['image/png', 'image/jpeg', 'image/webp']`, o padrão sem o PDF, só nas máquinas do Assistente. A diferença do Mastra Code: lá um PDF lido por `read_file` é um arquivo do projeto, de vez em quando; aqui o PDF da pessoa é o caso de todo dia, e inteiro como mídia ele voltaria a pesar na conversa e a se perder na observação, como o estudo provou | | não precisa | — |
| Achar o arquivo depois da observação | U2 | `prompt/assistant.md` (não diz onde ficam os arquivos da pessoa) | doc do `FileUploadProcessor` `:128` (o caminho); `docs-memory-observational-memory.md:299` (o marcador fica); `claude-code@0ed9469` `CHANGELOG.md:1288` (os bytes do PDF citado saem da conversa) | O arquivo fica fora da conversa e o agente o abre quando precisa | embrulhado: as ferramentas nativas da máquina de hoje (`list_files`, `execute_command`), e a frase nossa do texto que diz onde ficam os arquivos da pessoa | O critério 9 (o arquivo na máquina depois da observação) | 2026-11-10: "a gente já viu que o problema é nosso" | — |
| Aceitar xlsx, docx e csv, só onde o arquivo vai para a máquina | U1 | `attachments.ts:9-21` (uma lista para toda conversa); `room.ts:39-85` (a sala de cada conversa) | `@mastra/server@1.82.0` `agent-controller.js:170-183` (a rota aceita qualquer tipo); `@mastra/core@1.82.0` `dist/agent-controller-BDds1y5w.js:5280-5296` (`createMessageInput` põe todo `text/*` inteiro como texto); `room.ts:88` (`agentRoom` herda a sala do Assistente) | A lista é da tela, por conversa; o tipo decide se vira texto ou arquivo | embrulhado: `Room.files` escolhe a lista; o Assistente leva a da máquina e manda os de texto como `application/octet-stream`, para virarem arquivo | | não precisa | — |
| Os arquivos do primeiro pedido, do Início à conversa | U1 | `apps/web/src/builder/conversation/handoff.ts:51` (`stashHandoffFiles`), chamado de `apps/web/src/builder/assistant/home.tsx:76` | `mastra-1.82@6e8dfcb8` `mastracode/factory-ui/src/ui/domains/chat/services/handoffFiles.ts:5-9` (um mapa na memória da tela, porque o base64 passa do limite do histórico do navegador), `hooks/useHandoffPrompt.ts:131-170` (lê os arquivos e manda com o primeiro pedido) | Os arquivos do primeiro pedido ficam na tela e vão com a primeira mensagem da conversa | nativo da Factory, já copiado: nada muda; o `.xlsx`, o `.docx` e o `.csv` passam por ele como a imagem, com o tipo que `mediaTypeOf` deu | | não precisa | — |
| Os conversores na máquina | U1 | `infra/e2b/template.ts:81` (`git` e `python3-pip`) | `anthropic-skills@2c5958e` `skills/pdf/SKILL.md:191-200` (`pdftotext -f 1 -l 5`), `skills/docx/SKILL.md:15` (`pandoc -t markdown`) | Converter por comando, não ler o binário | nativo: `poppler-utils` e `pandoc` no `aptInstall` | O critério 11, ao vivo, depois da chamada paga | a chamada paga, a pedir | — |
| A lista dos arquivos na passagem ao Builder | U1 | `assistant/handoff.ts:90-110` (`proposalOf` lê as mensagens guardadas com `recall`), `:166-180` (`contentsOf`, o resumo e o briefing) | `@mastra/core@1.82.0` `recall` (as partes guardadas mantêm o arquivo, doc do `FileUploadProcessor` `:9`); a passagem por sinal de hoje | A mensagem guardada guarda o arquivo como veio | embrulhado: `sentFilesOf` lê as partes `file` das mesmas mensagens que `proposalOf` já lê, e `contentsOf` põe uma parte de texto com nome, tipo e tamanho; nenhum byte | O estudo: `builder: mentionsPdfName:false` hoje | 2026-11-10, o roteiro | — |
| O texto do Assistente: responder na mensagem, arquivo só quando pedido | U2 | `prompt/assistant.md` (um parágrafo; os cinco empurrões) | `codex@970111f` `codex-rs/core/gpt_5_2_prompt.md:152-158` (fazer o que foi pedido, sem extras que ninguém pediu), `:160-168` ("Presenting your work": a mensagem como resposta, oferecer o passo seguinte em vez de fazê-lo), `:172-230` (a forma da resposta); `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/prompts/index.ts:152` (o começo estável, pelo cache) | A resposta é a mensagem; o arquivo existe quando o trabalho é o arquivo; seções curtas | nativo: texto nosso com a estrutura dos dois, na mensagem fixa e com a marca de cache de hoje (`fixedSystem`) | O critério 16 (nenhuma sequência de seis palavras igual) | 2026-11-10: "mudar o sistema prompt"; muda a resposta A de 2026-10-31 ao estudo do prompt (sem regras de como responder) | — |
| A descrição de `show_file` | U2 | `machine/show-file.ts:63` ("Show the table, chart or document you made; the person sees nothing of your machine otherwise") | `mastra-1.82@6e8dfcb8` `packages/core/src/workspace/tools/write-file.ts:11` (a descrição de uma ferramenta nativa diz o que ela faz, sem mandar usá-la) | A ferramenta diz o que faz | nativo: a descrição diz o que a ferramenta faz | | 2026-11-10: "sem eu pedir" | — |
| A tabela na mensagem | fica de fora | `apps/web/src/builder/conversation/markdown.tsx:31,73-85` (`remark-gfm`) | `remark-gfm@4.0.1` README | Tabela do GitHub | nativo: já desenha; nada muda | | não precisa | — |
| O diagrama na mensagem | U3 | `markdown.tsx:65-72` (`code` e `pre`: o bloco `mermaid` sai como código) | `open-webui@f7ac7ee` `src/lib/utils/index.ts:2155-2165` (`mermaid` carregado sob demanda, `securityLevel: 'loose'`), `:2313` (`mermaid.parse` antes), `:2314-2330` (a recusa de imagem e estilo de fora por `mermaid.mermaidAPI.getDiagramFromText` e `diagram.db`, internos de cada tipo de diagrama: não entra), `:2334-2337` (a limpeza dos elementos temporários de um erro), `src/lib/components/chat/Messages/CodeBlock.svelte:365-377` (desenha só o bloco fechado); `open-webui@f7ac7ee` `package.json:134` (`mermaid` 11) | O bloco `mermaid` fechado vira o desenho na mensagem | embrulhado: `mermaid` sob demanda, só pela API pública (`parse`, `render`), `securityLevel: 'strict'`, desenhado só no bloco fechado de uma resposta acabada, com as cores dos tokens, e mostrado como imagem SVG; a busca de fora fica com a CSP do Hub; o nosso é o pedaço que lê o bloco e escolhe imagem ou código | A prova de CSP da U3 no Chromium, a primeira coisa da unidade (critério 17) | 2026-10-31: "B1"; 2026-11-10: "gera diagramas" | `apps/web/src/builder/conversation/diagram.tsx` |
| O gráfico | fica de fora | `machine/show-file.ts:38` (`INLINE_MEDIA`: PNG, JPEG e SVG ao lado) | o estudo, a captura do gráfico do matplotlib ao lado | Uma imagem feita por código | nativo: já mostra; o texto da U2 diz quando usar | | não precisa | — |
| O HTML aberto ao lado | fica de fora | `security.md` S24 ("The browser leaves the Hub's origin only for an app") | `open-webui@f7ac7ee` `src/lib/components/chat/Artifacts.svelte:253-272` (`srcdoc` sem `allow-same-origin`) | Toda referência põe o HTML do agente em outra origem | nativo: nada muda; fica para uma etapa própria, com a emenda de S24 | | 2026-11-10: "fazer o básico bem feito" | — |
| A cópia durável dos arquivos (R2) | fica de fora | `builder/git/copy` (a cópia do Builder no R2) | doc do `FileUploadProcessor` `:135` (grava de novo só enquanto a mensagem está no pedido) | — | nativo: nada muda; dívida medida | | não precisa | — |
| Reler as mensagens antigas (`recall`) | fica de fora | `assistant/memory.ts:13` (`recall: false`) | `docs-memory-observational-memory.md` (a recuperação por thread) | — | nativo: nada muda | | não precisa | — |
| Gráfico de um bloco na mensagem (Vega-Lite) | fica de fora | nenhum | `open-webui@f7ac7ee` `CodeBlock.svelte:389` | O bloco vira gráfico | nativo: nada muda; o matplotlib serve | | não precisa | — |
| Uma skill de arquivos | fica de fora | `assistant/skills/conexus/` (a única skill do Assistente) | `anthropic-skills@2c5958e` `skills/pdf/`, `skills/docx/`, `skills/xlsx/` (Apache-2.0) | Receitas por tipo numa skill | nativo: nada muda; duas frases no texto bastam agora | | não precisa | — |
| O roteiro como teste de regressão | U4 | nenhum: a prova do estudo vive fora do repositório | `apps/server/src/builder/assistant/test-assistant.ts:47-135` (`assisting`, `created`, `talking`); [testing T24, T26](../guides/testing.md) | O Hub de verdade, o modelo dublê e as formas gravadas da biblioteca | nativo: as portas de teste de hoje | | não precisa | `apps/server/src/builder/assistant/files-journey.test.ts` |

**A medida do transplante.** Nenhuma peça vem do produto antigo: ele não tinha máquina de conversa
nem desenho de diagrama (`conexus-os@e0353c36`).

**A dívida.**

- Depois que a memória resume a mensagem que trouxe um arquivo, o processador não o grava mais; se
  a máquina for perdida depois disso (não pausada: perdida, ou morta por um molde novo), o arquivo
  some de `uploads/`. A cópia durável fora da máquina (R2) cobre isso, numa etapa própria.
- A cada turno em que um arquivo ainda está no pedido, o processador liga a máquina antes da primeira
  chamada ao modelo, para conferir que o arquivo está lá (doc `:134`): um turno sem ferramenta paga a
  partida da máquina enquanto a mensagem do arquivo não foi resumida.
- `read_file` com `encoding: 'base64'` ainda devolve o PDF inteiro ao modelo
  (`mastra-1.82@6e8dfcb8` `packages/core/src/workspace/tools/read-file.ts:187-195`); o texto da U2
  manda converter, e o critério 6 só cobre a chamada sem `encoding`.
- O embrulho liga a máquina antes de toda chamada com um arquivo no pedido, um do histórico
  incluído: com a máquina fora, o turno falha mesmo sem precisar do arquivo, onde o nativo deixaria
  uma nota e seguiria.
- O embrulho traduz o `abort` do nativo pelo código que o Mastra põe no `metadata` (`code`,
  `file-upload.ts:168`): se uma versão nova mudar os códigos, a tradução para; a gravação nativa da
  U1 e o critério 12 guardam esse contrato.
- O embrulho delega só `processLLMRequest`: as duas conferências antecipadas do processador nativo
  (`processInput`, `processInputStep`, `file-upload.ts:103-111`) olham só o filtro e o teto, que o
  compositor e a rota já garantem; o arquivo do turno que não puder ir à máquina ainda para o turno em
  `processLLMRequest`.
- Que o modelo converte, lê por partes, acha o arquivo e só faz arquivo quando pedido, só um modelo
  real prova (critério 24 e o uso do fundador).

## U1 Arquivos lidos

**Base e modelo.** `main` em `2e588732`, com o pull request do trilho no `main`. Opus: liga um
processador do Mastra à máquina escolhida por pedido, com a ordem dos processadores e o momento em
que o Mastra guarda a mensagem como premissas a provar, e cruza servidor, memória, máquina, molde,
passagem e tela.

### As linhas da tabela

- **O arquivo vai para a máquina; o que fica com o modelo; o teto.** Ler
  `node_modules/@mastra/core/dist/docs/references/reference-processors-file-upload-processor.md`
  inteiro; `node_modules/@mastra/core/dist/processors/index.d.ts:330-360` (`ProcessLLMRequestArgs`,
  `workspace`, `state`); na prateleira `mastra-1.82@6e8dfcb8`,
  `packages/core/src/processors/processors/file-upload.ts:96-170` (o construtor, as três fases, a
  falha que para o turno). No `main`: `assistant/assistant.ts:206-279` (o agente, `agentDefaults`),
  `:288-307` (as máquinas e o `workspace` por pedido), `controller-kit/factories.ts:51-75`.
- **A referência, o Mastra Code e a Factory.** Na prateleira `mastra-1.82@6e8dfcb8`:
  `packages/core/src/agent-controller/session.ts:4912-4946` (`createMessageInput`: o texto inteiro
  como `[File: …]`, o resto como parte `file`); `mastracode/factory-ui/src/ui/domains/chat/components/useComposerImages.ts`
  e `Composer.tsx:124-148,289` (só imagem); `services/handoffFiles.ts` e
  `hooks/useHandoffPrompt.ts:131-170` (os arquivos do primeiro pedido); `mastracode/sdk/src/agents/memory.ts:284-287,360`
  e `sdk/src/schema.ts:223` (`observeAttachments`); `sdk/src/agents/workspace.ts:243-262` e
  `tool-availability.ts:92-120` (a máquina e as ferramentas nativas, sem `mediaTypes`). Ler para a
  forma: a U1 segue a mesma, e a única peça a mais é o `FileUploadProcessor`, porque lá não se anexa
  o que não é imagem.
- **O observador sem o binário; a contagem.** `controller-kit/memory.ts:59-101`,
  `assistant/memory.ts`; `node_modules/@mastra/memory/dist/docs/references/docs-memory-observational-memory.md:299,446-467,793-823`.
- **`read_file` sem PDF.** `machine/conversation.ts:268-300` (`workspace`, o `tools` do `Workspace`),
  `:407` (`createConversationMachines`); `reference-workspace-workspace-class.md:488-505`;
  `mastra-1.82@6e8dfcb8` `packages/core/src/workspace/tools/read-file.ts:41-51,160-199`;
  `node_modules/@mastra/e2b/dist/index.js:479`.
- **O compositor.** `apps/web/src/builder/conversation/attachments.ts` inteiro, `room.ts:30-95`,
  `composer.tsx:238-270`, `apps/web/src/builder/assistant/home.tsx` (o Início do Assistente: `:111`
  põe a `ASSISTANT_ROOM`, `:76` guarda os arquivos para a conversa com `stashHandoffFiles`).
- **Os conversores.** `infra/e2b/template.ts:60-95`.
- **A passagem.** `assistant/handoff.ts:74-200`; `handoff.test.ts` (o modelo de caso).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/assistant/` | Cria `files.ts`, `files.test.ts`; muda `assistant.ts` (o processador nos `inputProcessors`, `readMedia` nas máquinas), `memory.ts` (`observeAttachments: ['image/*']`), `handoff.ts` (`contentsOf` com a lista), `handoff.test.ts` | `builder/mastra/`, `conversations-of.ts` (como hoje) |
| `apps/server/src/builder/controller-kit/memory.ts` | Muda: `conversationMemory` ganha `observeAttachments?: readonly string[]` | `assistant/memory.ts`; o Builder e os agentes não passam a opção |
| `apps/server/src/builder/machine/conversation.ts` | Muda: `createConversationMachines` ganha `readMedia?: readonly string[]` | `assistant/assistant.ts`; o Construtor e os agentes não passam a opção |
| `apps/server/src/platform/recordings/mastra/` | Cria a gravação nativa de uma mensagem guardada com arquivo (`npm run record`) | `files.test.ts`, `handoff.test.ts` |
| `infra/e2b/template.ts` | Muda o `aptInstall` | a construção do molde, pelo firstmate |
| `apps/web/src/builder/conversation/{attachments,room,composer}.ts(x)` | Muda: a lista aceita vem da sala | a conversa, o Início |
| `apps/web/src/builder/conversation/attachments.test.tsx` | Muda: os casos por sala (toda sala dos testes de hoje espalha `BUILDER_ROOM` ou `agentRoom`, então nenhum outro teste muda) | — |
| `apps/web/src/builder/conversation/messages.test.tsx` | Muda: o caso do critério 8 na tela | — |
| `apps/server/src/builder/assistant/test-assistant.ts` | Muda: `talking().say` aceita arquivos, como `conversation/conversation-files.test.ts:51,114` os manda pela rota | `files.test.ts`, `files-journey.test.ts`, os testes de hoje |
| `docs/explanation/harness.md` | Muda a seção da máquina: os arquivos da pessoa em `uploads/` | — |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** a constante única `ACCEPT` de `attachments.ts` como
lista de toda conversa (vira duas listas, escolhidas pela sala). Nada mais sai: o caminho do
arquivo inteiro como parte da mensagem continua sendo o do Builder e dos agentes.

`apps/server/src/builder/assistant/files.ts`:

```ts
/** What the model reads itself and keeps receiving as a part: images. */
const SEEN_BY_MODEL = 'image/'
/** What a placed file weighs in the memory's count: its note, not its bytes (Mastra counts bytes/3 or bytes/4). */
const NOTE_TOKENS = 100
/** The image types `read_file` hands the model as media; a PDF is read on the machine, by its text. */
export const READ_MEDIA = ['image/png', 'image/jpeg', 'image/webp'] as const
/** The attachments the memory's observer still sees: images, as today and as Mastra Code; a PDF leaves its marker. */
export const OBSERVED = ['image/*'] as const

/**
 * Mastra's `FileUploadProcessor`, built for each model call with that step's machine
 * (`ProcessLLMRequestArgs.workspace`), since the Hub picks the machine per request; a call without a
 * machine with a sandbox changes nothing. Starts the machine first, and turns the native stop on a
 * file it could not write into the machine's failure, so the screen says MACHINE_UNAVAILABLE.
 * Stamps the note's estimate on the new file parts that are not images (`processInput`,
 * `processInputStep`; criterion 10).
 */
export function machineUploads(): InputProcessor

/** A file the person sent, as the stored message keeps it. */
export type SentFile = { name: string; mediaType: string; bytes: number }
/** The files of the person's messages, in order, once each (by content), from Mastra's stored parts. */
export function sentFilesOf(messages: readonly MastraDBMessage[]): SentFile[]
```

O começo do embrulho, porque o passo não é óbvio:

```ts
async processLLMRequest(args) {
  const machine = args.workspace
  if (machine?.hasSandboxConfig() !== true || !hasPlacedFile(args.prompt)) return undefined
  // Started here, so a machine that does not start fails the turn as MACHINE_UNAVAILABLE, not as
  // the native NO_SANDBOX tripwire that the screen reads as MODEL_REFUSED.
  await machine.resolveSandbox({ requestContext: args.requestContext })
  // The route already caps every file; the native check stays, with no second copy of that cap.
  const native = new FileUploadProcessor({ workspace: machine, filter, maxFileSize: () => Number.POSITIVE_INFINITY })
  // A file of this turn the machine could not take stops the turn as the machine's failure.
  const abort: typeof args.abort = (reason, options) =>
    MACHINE_SIDE.has(options?.metadata?.code) ? machineUnavailable('UPLOAD', options.metadata.code) : args.abort(reason, options)
  return native.processLLMRequest({ ...args, abort })
}
```

`MACHINE_SIDE` são os códigos do Mastra em que a falha é da máquina (`NO_SANDBOX`,
`NO_WRITE_CAPABILITY`, `UPLOAD_FAILED`, `mastra-1.82@6e8dfcb8`
`packages/core/src/processors/processors/file-upload-errors.ts:2-17`); `machineUnavailable` lança a
mesma `Failure('MACHINE_UNAVAILABLE')` da partida (`machine/conversation.ts:178-187`) e imprime o
motivo e o código, nunca o nome do arquivo (S41). Os outros códigos (`INVALID_*`, `FILE_TOO_LARGE`)
são erro nosso de configuração e seguem pelo `abort` nativo.

`args.state` é o estado do processador para todo o pedido (`index.d.ts:354-355`): o processador
nativo guarda nele o que já gravou, e a instância nova a cada chamada não grava duas vezes.

`controller-kit/memory.ts`: `conversationMemory(deps & { observeAttachments?: readonly string[] })`,
e `observation` leva `observeAttachments: [...observeAttachments]` só quando a opção vem; sem ela,
o padrão do Mastra de hoje (`['image/*', 'application/pdf']`) fica para o Builder e os agentes. `machine/conversation.ts`:
`createConversationMachines(deps & { readMedia?: readonly string[] }, tuning)`, e o `tools` do
`Workspace` leva `[WORKSPACE_TOOLS.FILESYSTEM.READ_FILE]: { mediaTypes: [...readMedia] }` só quando
a opção vem.

`handoff.ts`: `contentsOf(proposal: ProposedApp, files: readonly SentFile[])`; com arquivos, uma
terceira parte de texto, em português, como o resumo: a tela mostra como palavras da pessoa toda
parte de texto do sinal que não é um `[File: …]` cercado (`apps/web/src/builder/conversation/messages.ts:64-80`,
`:130-149`), então esta parte tem um dono só, a frase da matriz, e o Builder a lê como lê o resumo:

```text
Arquivos que a pessoa mandou ao Assistente:
- politica-comercial.pdf (PDF, 3,1 MB)
- precos.xlsx (planilha, 48 KB)
Eles ficam na conversa do Assistente; este Projeto não os tem. O que o briefing diz deles é o que o Assistente leu.
```

O nome do tipo sai de `sentFilesOf` por uma tabela pequena (PDF, planilha, documento, texto,
imagem; o resto, "arquivo"), nunca o tipo MIME, que a pessoa não lê.

`apps/web/src/builder/conversation/room.ts` e `attachments.ts`:

```ts
/** Where a file the person sends goes: to the model as a part, or to the conversation's machine. */
export type FilesGo = 'MODEL' | 'MACHINE'
// Room gains `files: FilesGo`: ASSISTANT_ROOM 'MACHINE'; BUILDER_ROOM and agentRoom 'MODEL'
export function acceptOf(files: FilesGo): string   // the input's `accept`
export function useAttachments(draft: Draft, files: FilesGo): Attachments
// 'MACHINE' adds text/csv, .csv, the xlsx and docx types and their extensions to today's list,
// maps them by extension when the browser types them empty (or a .csv as application/vnd.ms-excel),
// and sends every text type (csv, txt, md) as application/octet-stream: Mastra's route inlines any
// text/* whole (createMessageInput), and a file part is what goes to the machine
// 'MODEL' keeps today's list and types
```

A forma de cada coisa:

- **Estados.** `FilesGo` é uma união de literais, e o `switch` sobre ela termina em `satisfies never`
  (C21). O resultado do processador é o do Mastra.
- **Ids.** Nenhum id novo; a conversa e o dono vêm do `requestContext` como hoje (C23).
- **Donos.** `READ_MEDIA`, `OBSERVED`, `NOTE_TOKENS`, `MACHINE_SIDE` e o filtro em `files.ts`; o teto de um arquivo, só na rota do Mastra e em `attachments.ts` (`LIMITS.data`), como hoje; a lista
  aceita só em `attachments.ts`, por `FilesGo`; o que é um arquivo enviado só em `sentFilesOf` (C26).
- **Entrada externa.** A parte `file` guardada pelo Mastra, lida por um esquema Zod em
  `sentFilesOf` (tipo, dados como URL de dados ou base64, nome opcional), conferido contra a
  gravação nativa (C27, T26); o tamanho em bytes vem dos dados decodificados.
- **Modelo.** Nenhum processador de entrada do repositório faz `processLLMRequest`; a forma é a do
  próprio nativo (`mastra-1.82@6e8dfcb8` `packages/core/src/processors/processors/file-upload.ts:85-170`:
  `id` literal, uma falha só pelo `abort`), que cumpre C21 e C26; C23 não se aplica (nenhum id).

### As skills e a leitura

- `mastra` (`@mastra/core`, `@mastra/memory`, `@mastra/e2b`, `apps/server/src/builder`): ler primeiro
  a doc do `FileUploadProcessor`, a de processadores (`docs-agents-processors.md`) e a da memória
  observacional, no `node_modules`; depois a skill.
- `e2b` (`infra/e2b`): `node_modules/e2b/dist/index.d.ts`, `Template.aptInstall`; a construção do
  molde é chamada paga, e o construtor não a faz.
- `zod.dev/llms.txt` para o esquema da parte guardada (`zod` não tem skill).
- Sem skill de rota nem de formulário: a tela muda só a lista do compositor.

### A ordem do trabalho

1. **A gravação.** `npm run record` de um cenário com uma mensagem do Assistente com um PDF e um
   PNG, guardada pelo Mastra instalado, em `platform/recordings/mastra/`. Regras: T26, S40.
2. **A regressão primeiro.** O caso do critério 1 em `files.test.ts`, que falha hoje (o PDF nas
   chamadas 1 e 2). Regras: T5, T24.
3. **O embrulho.** `files.ts` `machineUploads` e a ligação em `assistant.ts` (os `inputProcessors`
   de `agentDefaults` com ele no fim). Funções: `@mastra/core@1.82.0`: `FileUploadProcessor({
   workspace, filter, maxFileSize })`, `processLLMRequest`. Regras: C56 (nenhum `fetch`), C57 (o
   prazo é o da partida da máquina, 120 s, `conversation.ts:24`).
4. **O observador.** `observeAttachments` em `memory.ts` dos dois lugares, com `OBSERVED`. Critério 3.
5. **A contagem.** O critério 10 primeiro, que falha sem o carimbo (o PDF adianta a observação);
   depois `processInput` e `processInputStep` carimbam as partes novas que não são imagem. Funções:
   `providerMetadata.mastra.tokenEstimate` `{ v: 0, source: 'client', key: 'client', tokens }`.
6. **`read_file`.** `readMedia` em `conversation.ts` e `READ_MEDIA` passado por `assistant.ts`.
   Critério 6.
7. **A passagem.** `sentFilesOf` e `contentsOf`; o caso de `messages.test.tsx` com a mensagem da
   passagem como o Mastra a guarda. Critério 8. Regras: S41 (nenhum nome em log), L23.
8. **O compositor.** `FilesGo` em `room.ts`, `acceptOf`, `useAttachments` e o tipo mandado por
   `mediaTypeOf` em `attachments.ts`,
   `composer.tsx` lendo `useRoom().files`. Critério 7. Regras: W21, C21.
9. **O molde.** `aptInstall(['git', 'python3-pip', 'poppler-utils', 'pandoc'])`. Nenhuma construção.
10. **Documento.** `docs/explanation/harness.md`, a seção da máquina: os arquivos que a pessoa manda
    ficam em `uploads/<conversa>/`, pelo processador nativo.

### Como se prova

- Critérios 1 a 6, 9, 10 e 12: `files.test.ts`, os arquivos mandados pela rota de mensagens como
  `conversation/conversation-files.test.ts:51,114` faz, pelo Hub de teste com o modelo dublê e a máquina dublê
  (`assisting`, `created`, `talking` de `test-assistant.ts`, T5), as respostas do dublê vindas das
  gravações do provedor (T24); o PDF de 200 KB e o texto de 530 linhas do estudo; o observador
  respondido pelo dublê como no estudo. O critério 12 com a máquina dublê que não liga
  (`test-conversation-machines.ts`, como `file.test.ts:114` faz para o download) e com a máquina
  dublê que liga sobre uma pasta de trabalho só de leitura, para a gravação ser recusada.
- Critério 7: `attachments.test.tsx`, pelas salas, com os papéis de hoje.
- Critério 8: `handoff.test.ts`, a passagem com dois arquivos e sem arquivo; `messages.test.tsx`, a
  mesma mensagem na tela.
- Critério 11: ao vivo, depois da chamada paga.
- O critério 1 falha hoje: a chamada 1 leva o PDF. O critério 7 falha hoje: `.xlsx` é recusado.
- Local: os testes tocados, `npm run typecheck`, `npm run lint`, `node scripts/check-docs.ts`.

### Parar se

- A falha `MACHINE_UNAVAILABLE` lançada pelo embrulho não chegar à tela com esse código (o
  controlador a trocar por outra): parar e dizer o que chega.
- O `abort` trocado pelo embrulho não ser o que o nativo chama, ou o `metadata.code` não vir com o
  código do Mastra (a gravação nativa da U1 mostra): parar e dizer o que chega; o critério 12 da
  gravação recusada depende disso.
- A máquina dublê não conseguir recusar a gravação sem mudar `test-conversation-machines.ts`: parar;
  o arquivo é da pasta das máquinas e entra no raio só por emenda.
- A rota ou o provedor recusar um arquivo `application/octet-stream`, ou o Mastra deixar de guardar
  o nome dele: parar.
- O Mastra não guardar a mensagem depois de `processInput`, e o carimbo não chegar à parte guardada:
  parar e dizer o que guarda; o critério 10 muda de caminho.
- O caso do critério 10 passar sem o carimbo (com o PDF de 200 KB e o texto do estudo, a observação
  acontece no mesmo ponto com e sem o arquivo): a hipótese do estudo (§2.1, a parte guardada pesa na
  contagem) não vale para esse roteiro, e o critério não tem forma que falhe hoje. Parar e dizer em
  que ponto a observação acontece nos dois casos; a troca proposta é o critério 10 conferir a
  estimativa na parte guardada (`providerMetadata.mastra.tokenEstimate` com `NOTE_TOKENS`, lida da
  mensagem que o Mastra guardou), com o tamanho de arquivo que faz a diferença aparecer.
- A máquina dublê ou a de verdade não tiver `writeFiles` nem `executeCommand` que o processador
  aceite (doc `:151`): parar; é a premissa do embrulho.
- O `stat` da máquina vier sem `mimeType` (o caminho de `statShell`, sem o sistema de arquivos
  nativo): `read_file` leria o PDF como texto; parar.
- A ficha de um anexo xlsx ou docx precisar mudar `apps/web/src/ui/attachment.tsx`: parar e esperar
  a unidade de desenho ([delivery L1](../guides/delivery.md)).

## U2 O texto do Assistente

**Base e modelo.** O commit da U1. Opus: é texto que decide o comportamento do modelo, julgamento e
prosa.

### As linhas da tabela

- **O texto.** `apps/server/src/builder/assistant/prompt/assistant.md` (hoje), `instructions.ts`
  (a mensagem fixa e o bloco), `instructions.test.ts` inteiro, `conversation/prompt/conexus.md` (o
  começo comum, que não muda), `skills/conexus/SKILL.md` (o que não se repete no texto),
  `propose.ts:29-44` (o que as passagens já dizem).
- **A estrutura de referência.** `codex@970111f` `codex-rs/core/gpt_5_2_prompt.md:152-230`;
  `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/prompts/index.ts:140-160`. Ler para a forma;
  nenhuma frase entra.
- **`show_file`.** `machine/show-file.ts:52-90`, `assistant/show-file.test.ts`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/assistant/prompt/assistant.md` | Reescreve | `instructions.ts` |
| `apps/server/src/builder/assistant/instructions.test.ts` | Muda: o caso novo do critério 13 | — |
| `apps/server/src/builder/machine/show-file.ts` | Muda a descrição | o Assistente, os agentes e o Construtor, que a leem |
| `apps/server/src/builder/assistant/show-file.test.ts` | Muda: o caso do critério 15 | — |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** o parágrafo único de `assistant.md`, com os cinco
empurrões: a lista de bibliotecas de escritório como abertura ("pandas, numpy, matplotlib, openpyxl,
xlsxwriter, python-docx, python-pptx, pypdf and reportlab installed"), "The person sees only your
messages and the files you show with show_file" (também falsa: a tela mostra cada ferramenta),
"compute on your machine and show files", "A question, a table, a chart or a file is yours to
answer", e o fim da descrição de `show_file`.

O texto novo, em inglês ([o `L1` de 2026-10-31](../approvals.md)), em seções com título `#`, nesta
ordem e com estas afirmações; as frases são do construtor, em palavras próprias:

| Seção | O que diz | Estrutura de |
| --- | --- | --- |
| Who you are | Um colega que responde com os dados da empresa e tem um computador; como usá-lo, ele decide; o trabalho acaba quando a pessoa tem o que pediu, sobre o que foi lido de verdade | Codex, o começo |
| How you answer | A resposta é a mensagem. Tabela para comparar, diagrama em bloco `mermaid` para fluxo ou estrutura, gráfico como imagem feita na máquina e mostrada com `show_file` quando um número muda no tempo ou entre grupos. Tamanho do tamanho do caso; o resultado primeiro; português do Brasil; as palavras do negócio, sem caminhos nem nomes de ferramenta | Codex, "Presenting your work" e "Final answer structure" |
| When a file helps | xlsx, docx ou pptx só quando a pessoa pede um arquivo, ou quando o resultado é um documento para levar adiante (mandar, editar, imprimir); então faz, mostra com `show_file` e diz numa linha o que tem. Na dúvida, responde na mensagem e oferece o arquivo | Codex, `gpt_5_2_prompt.md:152-158` (sem extras não pedidos) e `:168` (oferecer o passo seguinte) |
| Files the person sends | Ficam em `uploads/` da sua máquina, um por mensagem, com uma nota do caminho e do nome. Converta (`pdftotext`, `pandoc`; `pypdf` e `python-docx` também estão lá) e leia por partes (`read_file` com linhas, `grep`); nunca o documento inteiro na conversa. Liste `uploads/` antes de dizer que um arquivo não está lá. Chame o arquivo pelo nome que a pessoa deu | o Claude Code e as skills `pdf` e `docx` (só a forma) |
| How you work | Diga numa linha o que vai fazer antes de um grupo de ferramentas; confira o número antes de afirmar e diga de onde veio; mantenha a lista de tarefas em trabalho de vários passos | Codex, "Autonomy" e "Validating" |
| What the person sees | Suas mensagens, cada ferramenta que você usa com o resultado, a lista de tarefas, os cartões de pergunta e os arquivos que você mostra | corrige a frase falsa de hoje |
| Your computer | Linux, Python 3 e Node 24, as bibliotecas de análise e de documentos instaladas, pip e npm pela rede só dos registros de pacotes, `web_search` e `web_fetch` para a web; as leituras de conector salvas inteiras em `reads/` | as frases de hoje, sem o empurrão |
| What is yours and what is the Builder's | As frases de hoje sobre o Builder, o briefing e as passagens, sem "A question, a table, a chart or a file is yours to answer" | `assistant.md` de hoje |
| Notes on a connection; Automations; Questions; Trust | As frases de hoje, sem mudar o sentido | `assistant.md` de hoje |

`show-file.ts`, a descrição nova diz só: abre ao lado da conversa um arquivo da pasta, para ler (Markdown, texto ou CSV de até 64 KB), ver (imagem) ou baixar (o resto).

A forma de cada coisa:

- **Estados, ids, entradas.** Nenhum novo.
- **Donos.** O texto fixo só em `assistant.md`; `instructions.ts` o lê como hoje (C26).
- **Modelo.** `instructions.ts` como está.

### As skills e a leitura

- `mastra` (`@mastra/core`): instruções como lista de mensagens de sistema; ler
  `node_modules/@mastra/core/dist/docs/references/docs-guides-context-engineering.md` (o estável
  primeiro).
- `pstack:unslop` e `pstack:technical-writing` para o texto (frases curtas, sem caixa alta de ordem,
  como `instructions.test.ts:129` já exige).

### A ordem do trabalho

1. **Os testes primeiro.** O caso do critério 13 e o do 15, que falham hoje.
2. **O texto.** Reescrever `assistant.md` pelas seções acima. Regras: L23 (o texto do modelo em
   inglês, a resposta dele em português), C70 (o texto não promete o que a máquina não faz).
3. **A descrição.** `show-file.ts`.
4. **A conferência das palavras.** Fora do repositório, comparar o texto novo com
   `codex@970111f` `codex-rs/core/gpt_5_2_prompt.md` e `mastra-1.82@6e8dfcb8`
   `mastracode/sdk/src/agents/prompts/`, por sequências de seis palavras; o relatório dá a contagem
   e o comando. Nenhum caminho de máquina no repositório (S40).

### Como se prova

- Critérios 13 e 14: `instructions.test.ts`, pela mensagem que o modelo dublê recebe na primeira
  chamada (T5, T24), como os casos de hoje.
- Critério 15: `show-file.test.ts`, pela descrição que o modelo dublê recebe.
- Critério 16: o relatório do construtor.
- O critério 13 falha hoje: a mensagem tem a frase "The person sees only your messages".

### Parar se

- O texto novo precisar de uma frase que prometa algo que a U1 não entregou (por exemplo, um
  arquivo achado sem a máquina): parar.
- Uma frase de hoje sobre o Builder, as passagens, as automações ou as notas não couber sem mudar o
  sentido: parar; o sentido delas é de cartões anteriores aprovados.

## U3 O diagrama na mensagem

**Base e modelo.** O commit da U2, com https://github.com/developmentconexus-ops/conexus/pull/948 no
`main`. Sonnet: um pedaço de tela com uma biblioteca, depois de uma prova de navegador que decide a
forma.

### As linhas da tabela

- **O diagrama.** `apps/web/src/builder/conversation/markdown.tsx` inteiro, `markdown-blocks.ts`,
  `markdown.test.tsx`; `apps/web/src/platform/theme.ts` (o tema resolvido);
  `apps/web/src/brand/tokens.css` (os nomes dos tokens de cor e de fonte); `apps/web/layout-harness.ts`
  (a CSP do arnês, `:28`, e os erros do console, `:114`); `apps/server/src/platform/http.ts:31-49` (a
  CSP do Hub, que a prova reproduz). Referência: `open-webui@f7ac7ee`
  `src/lib/utils/index.ts:2155-2165,2305-2313`, `CodeBlock.svelte:365-377`; o README do pacote
  `mermaid` na versão instalada.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/conversation/` | Cria `diagram.tsx`; muda `markdown.tsx` (o bloco `mermaid` de uma resposta acabada vira `Diagram`), `markdown.test.tsx` | toda conversa que desenha Markdown |
| `apps/web/package.json` | Muda: `mermaid` 11, versão exata; `diagram.layout.test.ts` na lista de `test:browser` | — |
| `package-lock.json` | Muda: `mermaid` 11 e as suas dependências | — |
| `apps/web/diagram.layout.test.ts` | Cria | o arnês dos navegadores |
| `apps/web/vite.config.test.ts` | Muda: o pedaço próprio do `mermaid` | — |
| `docs/reference/stack.md` | Muda: a linha de `mermaid` | `check-docs` |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** nada; o bloco `mermaid` deixa de cair no `pre` genérico
só quando a resposta acabou.

`apps/web/src/builder/conversation/diagram.tsx`:

```ts
/** What a mermaid block became: drawing, drawn as an image, or left as its code. */
type Drawn =
  | { kind: 'DRAWING' }
  | { kind: 'DRAWN'; src: string; title: string } // src: the SVG as a data URL, img-src allows data:
  | { kind: 'NOT_DRAWN' }                          // a syntax error, or the package did not load

/** A closed ```mermaid block of a settled answer: the code until it is drawn, then the image; the code and one line when it cannot be. */
export function Diagram(props: { code: string }): ReactNode
```

`markdown.tsx`: `Block` recebe `settled` (falso no último bloco enquanto a resposta chega); o `pre`
cujo `code` tem `language-mermaid` desenha `Diagram` só com `settled`, e o código de hoje no resto.

A configuração do `mermaid`: `startOnLoad: false`, `securityLevel: 'strict'`, `theme: 'base'`,
`themeVariables` lidas dos tokens no momento do desenho: os tokens são `light-dark(…)`
(`brand/tokens.css`), que o `mermaid` não lê, então a cor vem do `color` e do `background-color`
calculados de um elemento de prova com as classes dos tokens (nenhum valor de cor no código, V3), `fontFamily` a família genérica `sans-serif` (a imagem não tem as fontes da
página, então a medida e o desenho usam a mesma), `flowchart.htmlLabels: false` (texto SVG, que uma
imagem desenha em todo navegador). O pacote vem por `import('mermaid')` na primeira vez. Antes de desenhar,
só pela API pública do `mermaid` (`mermaid.parse` e `mermaid.render`): `mermaid.parse` (o erro vira
`NOT_DRAWN`); num erro, a remoção dos elementos temporários que o `mermaid` deixa na página, como o
Open WebUI (`utils/index.ts:2334-2337`). A recusa prévia do Open WebUI a imagens e estilos de fora
(`utils/index.ts:2314-2330`) não entra: ela lê `mermaid.mermaidAPI.getDiagramFromText` e
`diagram.db.getVertices`, `getActors` e `getClasses`, internos de cada tipo de diagrama e fora da
API documentada; aqui a CSP do Hub (`img-src 'self' data:`, `style-src 'self'`) recusa a busca
durante o desenho, e o SVG mostrado como imagem não busca nada (critério 20).

A forma de cada coisa:

- **Estados.** `Drawn`, discriminado por `kind`, com `switch` terminado em `satisfies never` (C21).
- **Donos.** A configuração e a leitura dos tokens só em `diagram.tsx`; o tema, de
  `platform/theme.ts` (C26).
- **Entrada externa.** O texto do bloco é do modelo: vai só ao `mermaid` com `strict`, e o SVG só
  como imagem, que não roda script (C27, S2).
- **Modelo.** `markdown.tsx` `Anchor` (uma entrada do modelo tratada na borda) cumpre C21, C23 e C26.

### As skills e a leitura

- `react-markdown`, `remark-gfm` e `remend`: os READMEs (sem skill), como a linha de `stack.md`.
- `mermaid`: a linha nova de `stack.md`, o README do pacote e a página de uso da configuração na
  versão instalada; sem skill.
- `playwright-cli` (`playwright-core`, o arnês dos navegadores) para a prova e o teste.
- `impeccable` não se aplica: nenhum desenho novo de tela além do bloco.

### A ordem do trabalho

1. **A prova de CSP, primeiro.** No arnês (`layout-harness.ts`), com a CSP do Hub de `http.ts`
   (`style-src 'self'`, `img-src 'self' data:`, `script-src 'self'`): desenhar um fluxo pequeno com
   `mermaid.render` e olhar o console. O `mermaid` desenha numa página viva (`open-webui@f7ac7ee`
   `utils/index.ts:2312`) e, pela leitura do estudo, põe um `<style>` dentro do SVG; a hipótese é que
   a CSP recusa esse estilo durante a medida. Duas saídas, porque `style-src 'self'` vale para o
   documento inteiro, visível ou não, e a W22 proíbe estilo injetado:
   - nenhuma recusa: o SVG entra como imagem (`<img src="data:image/svg+xml,…">`) e segue-se;
   - uma recusa: parar (abaixo); nenhum contêiner escondido nem troca de política dentro da unidade.
   O relatório da unidade guarda a saída do console de cada tentativa.
2. **O pacote.** `mermaid` 11 em `apps/web/package.json`, versão exata, e a linha de `stack.md`
   (`Used in` `apps/web/src/builder/conversation`, a referência do Open WebUI, a armadilha que a prova
   achou). Regras: L16.
3. **O teste primeiro.** `markdown.test.tsx`, critérios 18 e 19 (no jsdom o `mermaid` não mede, então
   o caso do código e o do erro são observáveis ali); `diagram.layout.test.ts`, critérios 17, 19, 20,
   21 e 22; `diagram.layout.test.ts` entra na lista explícita de `test:browser` em
   `apps/web/package.json`, sem a qual os critérios 17 e 19 a 22 não rodam no CI (T12).
4. **`diagram.tsx` e `markdown.tsx`.** Regras: W22, V3, V26 (nada se anima), T23.
5. **O pedaço próprio.** Conferir no `vite build` que `mermaid` não está no pedaço de entrada.

### Como se prova

- Critérios 17, 19 a 22: `diagram.layout.test.ts` no arnês dos navegadores, a 1366 e a 390 px, nos
  dois temas, com os erros do console e os pedidos sem resposta (`harness.unanswered`) vazios (T23).
- Critérios 18 e 19: `markdown.test.tsx`.
- Critério 21: `vite.config.test.ts` e os pedidos da página no arnês.
- O critério 17 falha hoje: o bloco sai como código.
- Local: os testes tocados, `npm run typecheck`, `npm run lint`, `node scripts/check-docs.ts`.

### Parar se

- A prova mostrar uma recusa da CSP que só uma mudança da política do Hub tira: parar. A política é
  a de `platform/http.ts:31-49`, sob a W22 (nenhum estilo injetado), e o firstmate leva ao fundador as opções: (A) `style-src` aceitar estilos em
  linha; (B) o diagrama feito como imagem na máquina e mostrado ao lado por `show_file`, como o
  gráfico; (C) o bloco continua código até a etapa do HTML ao lado.
- O `mermaid` precisar de `unsafe-eval` ou de um pedido para fora da página: parar.
- O `vite build` puser `mermaid` no pedaço de entrada mesmo com `import()`: parar e dizer por quê.

## U4 O roteiro como teste

**Base e modelo.** O commit da U3. Sonnet: um teste pela porta pública com as portas que existem.

### As linhas da tabela

- **O roteiro.** `assistant/test-assistant.ts:47-135`, `test-real-model.ts` (`REAL_MODEL`,
  `subscribed`), `conversation/test-conversation.ts` (`endOf`, `messagesOf`, `sessionUrl`),
  `conversation/test-questions.ts` (os passos do dublê), `handoff.test.ts` (a passagem).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/assistant/files-journey.test.ts` | Cria | — |
| `apps/server/src/platform/recordings/mastra/` | Cria a gravação do turno com a observação, se a da U1 não servir | `files-journey.test.ts` |

### Os contratos que a unidade cria

Nenhum contrato. O teste guarda, chamada por chamada, as linhas que o estudo media: as partes de
arquivo que não são imagem (`0` em toda chamada do Assistente e do observador), a nota (até a
observação), o marcador `[File #1: …]` (na observação) e a lista na primeira chamada do Builder.

### As skills e a leitura

- `mastra`: a memória observacional e o controlador, para entender quando a observação dispara.
- [testing T24 e T26](../guides/testing.md): as gravações do provedor e da biblioteca.

### A ordem do trabalho

1. **O roteiro com o dublê.** Os três arquivos (o PDF de 200 KB, um xlsx e um docx pequenos,
   inventados, S40); a pergunta das regras; o dublê converte (`execute_command` com `pdftotext`) e lê
   um trecho; a observação; a pergunta do dia seguinte, com o dublê listando `uploads/`; o pedido do
   diagrama (a resposta com um bloco `mermaid`); o pedido do Excel (`write_file` e `show_file`); a
   passagem. Os argumentos do dublê usam só o que a chamada mostrou ao modelo, o caminho da nota
   incluído (T28).
2. **O caso de modelo de verdade.** O mesmo roteiro, curto, com `REAL_MODEL`, que pula com `opt-in:`
   sem a variável (T4); roda só com a palavra do fundador.

### Como se prova

- Critério 23: `files-journey.test.ts`, que falha no `main` de hoje nas mesmas linhas do estudo.
- Critério 24: o mesmo arquivo, com `REAL_MODEL`, pelo firstmate, com a palavra do fundador; o
  relatório guarda o que o modelo fez, sem texto da empresa.

### Parar se

- O roteiro com o dublê só passar com um argumento que o modelo não viu: parar (T28).
- A observação não disparar no roteiro com o texto do estudo: parar e dizer o tamanho que dispara.
