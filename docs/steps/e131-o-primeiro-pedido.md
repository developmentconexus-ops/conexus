# Etapa 13.1: O primeiro pedido

## A página do fundador

**No fim desta etapa** você entra no Conexus e cai no Início com o cursor na caixa de pedido, a
mesma caixa da conversa (com **+** e microfone). Escreve o app que quer, envia, dá o nome do
Projeto, e o Projeto abre com o seu pedido já na conversa e o Builder trabalhando. Um dono novo faz
o mesmo no passo 4 da primeira entrada. E a aba **Código** de um Projeto mostra o app como código de
verdade: as pastas fechadas, menos o caminho até o arquivo aberto, a setinha certa, ícones, o código
com cores e números de linha.

**O roteiro de uso.** Padaria Sol, com Ana (dona), no computador e no celular.

1. Ana entra com e-mail e senha. Cai no Início, tudo centrado: em cima, **Termine de preparar a
   empresa** quando falta algo, uma faixa fina de uma linha com o **Continuar** discreto à direita;
   depois o título **O que vamos construir?**, a caixa com o cursor e o texto de espera "Descreva o
   app que você quer…", e logo embaixo três exemplos em etiquetas redondas (tocar num deles põe o
   texto na caixa e não envia); mais abaixo, **Projetos** com a contagem ao lado ("Projetos 3") e os
   cartões, três por linha no computador, cada um com uma faixa cinza de prévia com a inicial do
   nome, o nome e "Criado em". O título não tem contorno laranja.
2. Ana escreve "Um app de encomendas com cliente, data de entrega e valor", anexa
   `tabela-de-precos.pdf` pelo **+** (ou dita pelo microfone) e toca **Enviar**.
3. A caixa dá lugar a um quadro só: em cima o pedido dela, como ela escreveu, com a etiqueta do
   arquivo; embaixo de uma linha fina, o campo **Nome do projeto**, vazio e com o cursor, o
   endereço do app numa linha inteira e **Criar e começar** com **Voltar** ao lado (no celular, os
   dois botões ocupam a largura toda, um embaixo do outro). Ela digita "Encomendas" e vê, enquanto
   digita, "Endereço do app: encomendas--padaria-sol.…". Toca **Criar e começar**. (**Voltar**
   devolve o pedido à caixa, com o arquivo.)
4. Abre o Projeto **Encomendas** na conversa: a bolha dela com o texto e a etiqueta, e o Builder
   trabalhando. De volta ao Início, o cartão **Encomendas** está lá. Não existe mais **Criar
   projeto** sem pedido.
5. Quando o Builder termina e guarda a primeira versão, Ana abre a aba **Código** do Encomendas. À esquerda, as pastas fechadas com o ícone de pasta,
   menos o caminho até o arquivo aberto; à direita, o arquivo com cores, números de linha e o nome
   em cima. Ela abre `src` e depois `routes`, fecha `routes`, e a setinha volta para a direita. No
   celular, toca **Arquivos**, a lista rola até o fim, ela escolhe outro arquivo e o vê colorido.
6. Um dono novo, no **passo 4 de 4** da primeira entrada ("O que vamos construir primeiro?"), faz o
   mesmo: caixa, exemplos, nome, e cai na conversa. Ou toca **Ir para o início sem pedir nada**.
   Uma empresa nova, sem Projetos, vê só a frase "Nenhum projeto ainda." embaixo de **Projetos**.
   Quem ainda não tem conta de modelo vê, no lugar da caixa e dos exemplos, "Você ainda não tem uma
   conta de modelo. Peça a quem administra a empresa ou ligue a sua." e o botão **Minhas contas de
   modelo**.

**O desenho do Início.** Você aprova esta página olhando o Início redesenhado, centrado como você
pediu, rodando com as peças reais (a caixa da 14.3, as etiquetas de arquivo, os botões e campos de
sempre), com as cores e letras do Conexus. As capturas ficam fora do repositório, na pasta
`conexus-e131-home-design/shots/`, uma por estado, a 1366 e 390 px, claro e escuro, no nome
`<estado>-<largura>-<claro|escuro>-centro.png`:
`1-inicio-…-centro.png` (o Início com o cartão de preparo e três Projetos),
`2-texto-pdf-…-centro.png` (o pedido escrito, com o PDF),
`3a-nome-vazio-…-centro.png` e `3b-nome-digitado-…-centro.png` (o passo do nome, vazio e digitado),
`4-empresa-nova-…-centro.png` (sem Projetos) e `x-membro-sem-conta-1366-claro-centro.png` (sem conta
de modelo). A aba **Código** tem o seu desenho também, do mesmo jeito:
`codigo-1366-claro.png`, `codigo-1366-escuro.png`, `codigo-390-claro.png`, `codigo-390-escuro.png`
e, com a lista **Arquivos** aberta no celular, `codigo-390-arquivos-claro.png` e
`codigo-390-arquivos-escuro.png`.

**As capturas `*-centro.png` são anteriores às suas respostas 3, 4 e 5.** Nelas a caixa ainda diz
"Escreva sua mensagem" (no lugar de "Descreva o app que você quer…"), o botão do modelo ainda diz
"· Desligado" e o aviso sem conta ainda traz o texto antigo, com um link sublinhado no lugar do
botão. O roteiro acima é a referência dos textos e do botão; as capturas valem para o layout.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. No fim: faz o roteiro no
computador e no celular, diz o que viu e aprova os textos das telas.

**Fica de fora.**
- O estado nos cartões dos Projetos ("Builder trabalhando", "Rascunho", "Publicado"): fica para
  depois (sua palavra `C. C1`, 2026-10-26). O cartão continua com o nome e "Criado em".
- A aba **Alterações**: fora desde a 14.1 (sua "B1", 2026-10-25).
- Trocar o nome de um Projeto: não existe, e o endereço continua fixo para sempre (decisão 0024).
- Copiar o arquivo e buscar dentro dele, na aba **Código**: ninguém pediu.
- Das issues `next-card`, nenhuma toca as pastas desta etapa; a #167 e a #170 já entram na 14.3.
  A #253 (o primeiro turno de um Projeto novo depende do R2 responder) fica na fila: o roteiro passa
  por um primeiro turno, mas a issue só acontece com o R2 fora e o conserto é na máquina do Builder,
  não aqui.

**As decisões suas nesta etapa.** Todas dadas, em 2026-10-26 e 2026-10-27:
- **A**, nativo: quem dá o nome é a pessoa, digitando. Nem o modelo nem um sorteio dão o nome, e o
  campo não vem preenchido. "A. O cliente tem que colocar o nome do projeto".
- **B1**, nativo: saem o **+ Novo projeto** e o campo de nome sozinho de hoje; todo Projeto nasce de
  um pedido, no Início ou no passo 4. "B. B1".
- **C**, nativo: o estado nos cartões fica para depois. `C. C1`.
- **`D2`**, embrulhado: a aba **Código** arrumada e colorida com Shiki. Sua palavra `D2`, 2026-10-26. A árvore
  arrumada (pastas fechadas, setinha certa, ícones, nome do arquivo em cima, a lista do celular
  rolando), os números de linha e as cores, nos dois temas, guardadas na marca como as outras. É o
  que a Mastra, a AI Elements e o Streamdown usam. A caixa do código, com o nome em cima e os números
  de linha, é a peça pronta do shadcn, a biblioteca de peças que o Conexus já usa: o leitor de tela
  lê o código sem os números. Não mexe na política de segurança da página (provado no navegador, sem
  nenhum erro). O Shiki só baixa ao abrir o primeiro arquivo, cerca de 67 kB; a página inicial
  cresce 1,7 kB. ~260 linhas. Embrulhado: o nosso acrescenta só a tabela que liga cada cor do Shiki
  a uma cor da marca. Capturas do estudo da aba Código, fora do repositório:
  `proto/desktop-file-light.png`, `proto/desktop-file-dark.png`, `proto/phone-file-light.png`.
  - `D1`, arrumar sem colorir: o código de uma cor só (~120 linhas). Não escolhida.
  - `D3`, colorir com CodeMirror, como o Conexus OS: afrouxa a política de segurança da página e
    traz dobra e busca que ninguém pediu. Não escolhida.
- **O Início redesenhado**, nativo (as respostas às cinco perguntas do desenho, 2026-10-27). Você
  disse que a página inicial "ficou muito feia" e que o título, a caixa e os Projetos "não foram
  conforme a gente tinha combinado"; o desenho refeito olhou Lovable, bolt, v0, Base44, Mastra
  Factory, Dyad e vibesdk (a tela do Mitra só aparece com login). Suas respostas:
  1. **Centrado.** "a tela de início eu prefiro ela centralizada". O título, a caixa e os exemplos
     ficam no centro, como em todas as referências; isto troca a forma à esquerda do `wf-h1`.
  2. **A área de prévia dos cartões** mostra agora a inicial do nome, e a imagem de verdade do app
     num passo de depois. "Escolhas 2. A depois C".
  3. **O texto da caixa vazia no Início** é "Descreva o app que você quer…". "3. Descreva o app que
     você quer".
  4. **O botão do modelo** nomeia o raciocínio só quando ele não está desligado. "4. Primeiro porque
     o padrão está desligado? porque eu não configurei?"; a resposta dada a você foi a opção C. Isto
     chega pelo pull request https://github.com/developmentconexus-ops/conexus/pull/379 na 14.3:
     não se constrói aqui.
  5. **Sem conta de modelo**, o Início tem um aviso só dele, "Você ainda não tem uma conta de
     modelo. Peça a quem administra a empresa ou ligue a sua.", com o botão **Minhas contas de
     modelo**. "5. Okay"; a conversa fica com o aviso de hoje.

**Não é decisão sua, já está decidido:**
- **Onde o nome é digitado**: depois do **Enviar**, no lugar da caixa, como fazia o seu Conexus OS,
  que pedia o nome antes de criar. A caixa do Início é a da conversa, centrada, com o texto de espera
  do `wf-h1` que você aprovou; o nome só aparece quando importa, com o endereço logo embaixo. A outra forma, um
  campo de nome acima da caixa o tempo todo, não aparece em nenhuma referência nem no desenho
  aprovado.
- **Pastas fechadas** na aba Código: abre só o caminho até o arquivo aberto, como o Conexus OS
  fazia. Isto muda a 14.2, que abria tudo menos `components/ui`. Sua palavra de 2026-10-26: "elas
  vêm expandidas já e não contraídas".
- **No celular**, **Arquivos** continua abrindo a lista por cima, como a 14.2 aprovou. Ganha o
  ícone de pastas, passa a rolar até o fim, e o botão de fechar diz "Fechar arquivos".
- **Nomes compridos** de arquivo continuam quebrando a linha em vez de serem cortados (correção 7
  da QA da 14.2).
- **Os ícones das pastas** ficam em cinza. O dourado da marca continua só no arquivo escolhido
  (regra V5); a Mastra pinta as pastas de âmbar e a AI Elements de azul.

**Se o Projeto nasce e a conversa não.** O nome fica travado, porque o Projeto já existe. Numa falha
de rede ou do banco, **Tentar de novo** cria só a conversa. Se o Hub recusa o modelo (sem conta, ou
um modelo que ele não conhece), tentar de novo daria a mesma recusa: o Projeto abre sem conversa,
com a frase "O Projeto foi criado, mas o seu pedido não saiu", a do motivo e "Comece uma Nova
conversa e escreva de novo", como fazia o seu Conexus OS. Nesse meio, **Voltar** vira **Abrir o
Projeto**. Quem fecha a página nesse meio também deixa o Projeto criado, sem conversa, nos cartões;
digitar o mesmo nome de novo no Início dá "Já existe um Projeto com esse nome nesta empresa."

Nenhuma linha remendo.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | A conversa nova aceita o raciocínio junto com o modelo | `packages/hub-api/src/`, `apps/server/src/builder/conversation/` | dados | 14.3 inteira |
| U2 | O Início centrado: a caixa da 14.3 com o seu texto de espera, os exemplos, o passo do nome, a passagem do pedido à conversa, os cartões com a prévia, o aviso sem conta e a faixa de preparo; sai o campo de nome sozinho | `apps/web/src/builder/conversation/`, `apps/web/src/hub/projects/`, `apps/web/src/hub/identity/preparation-card.tsx`, `apps/web/src/brand/tokens.css`, `apps/web/src/routes/_app/companies/$companyId/` | web | U1 |
| U3 | O passo 4 com a mesma caixa | `apps/web/src/routes/_app/companies/$companyId_/welcome/`, `apps/web/src/hub/identity/` | web | U2 |
| U4 | O foco depois de entrar vai à caixa, e o título não ganha contorno | `apps/web/src/hub/identity/`, `apps/web/src/brand/`, `apps/web/src/routes/_app/` | design | U2 |
| U5 | A aba Código legível: pastas fechadas menos o caminho do arquivo, a seta e o ícone de pasta que seguem o estado, ícone de arquivo, o código com cores (Shiki, `D2`), números de linha e o nome em cima, a árvore com rolagem própria; o celular com o `Sheet` de hoje, que passa a rolar até a última linha e diz "Fechar arquivos" | `apps/web/src/builder/source/`, `apps/web/src/brand/`, `apps/web/src/ui/sheet.tsx` (o rótulo de fechar), `apps/web/src/ui/code-block.tsx`, `docs/reference/stack.md` | design | 14.3 inteira |

**A entrega.** Cada unidade é o seu próprio pull request, sobre o `main` com as anteriores já
dentro ([entrega L9](../guides/delivery.md)): o CI verde, uma revisão por um revisor Opus e então o
firstmate a junta ao `main`, uma de cada vez ([L13](../guides/delivery.md)). A ordem é U1, U2, U3,
U4, U5: a U2 usa o corpo da U1; a U3 põe no passo 4 a peça da U2; a U4 prova o foco sobre a caixa do
Início da U2. A U5 não usa nada das outras quatro e vem por último, sobre o `main` com a U4, para
que nenhuma unidade corra ao lado de outra. A U1 começa só depois que a última unidade da 14.3
entrou no `main`, porque a caixa, os arquivos e o rascunho são os dela.

**Orçamento de código alterado.** U1 25; U2 490 (o protótipo do Início redesenhado, +312 / -60, mais ~120 que faltam: a passagem, as falhas da
sequência e a prop do texto de espera; L2 conta também as ~60 linhas que saem de `create-project-form.tsx` e `home.tsx`); U3 25;
U4 15; U5 260 (o protótipo do estudo: 234, mais a rolagem e o rótulo do `Sheet`). Total da etapa: ~815
linhas sem testes, teto 4.000 (L2).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `POST /api/companies/{c}/projects/{p}/conversations` com `{ model, effort }` cria a conversa nesse modelo e raciocínio, e a leitura da sessão do Mastra os devolve; um raciocínio que o modelo não tem responde 422 `EFFORT_UNSUPPORTED` e nenhuma conversa nasce; sem `effort`, como hoje | `apps/server/src/builder/conversation/conversations.test.ts`, "o raciocínio pedido vale desde a criação" e "um raciocínio que o modelo não tem é recusado" | must |
| 2 | U1 | A mesma chave de tentativa com outro `effort` responde 409 `IDEMPOTENCY_CONFLICT` | `conversations.test.ts`, "a mesma chave com outro raciocínio é outro pedido" | must |
| 3 | U2 | O Início do dono com conta de modelo mostra, nesta ordem: o cartão de preparo (quando falta algo), "O que vamos construir?", a caixa da 14.3 com o modelo do padrão da pessoa (`Defaults.start`), três exemplos, os Projetos com a contagem. Nenhum "Criar projeto", nenhum "+ Novo projeto", nenhum anel de memória | `apps/web/src/hub/projects/home.test.tsx`, "Início: o título, a caixa, os exemplos e os Projetos" | must |
| 4 | U2 | Tocar num exemplo põe o texto na caixa e não envia | `apps/web/src/builder/conversation/start.test.tsx`, "o exemplo vai para a caixa e nada sai" | must |
| 5 | U2 | Sem conta de modelo (`Defaults.start` nulo), o aviso do Início fica no lugar da caixa e dos exemplos (só o lugar do aviso; o texto e o botão são os do critério 28) | `start.test.tsx`, "sem conta, o aviso no lugar da caixa" | must |
| 6 | U2 | **Enviar** com texto ou arquivo troca a caixa pelo pedido (texto e etiquetas) e o campo **Nome do projeto** vazio, com o foco; o endereço do app se monta enquanto se digita; nenhum pedido ao Hub sai até **Criar e começar**. **Voltar** devolve texto e arquivos à caixa | `start.test.tsx`, "enviar pede o nome, vazio, e nada sai" e "Voltar devolve o pedido à caixa" | must |
| 7 | U2 | **Criar e começar** com nome vazio não sai: a frase no campo. Com nome: `createProject` com `{ name }` e uma chave, depois `createConversation` com `{ model, effort }` e outra chave, e a tela abre `…/projects/<p>/conversations/<c>` | `start.test.tsx`, "o nome vazio fica no campo" e "criar leva o nome, o modelo e as chaves, e abre a conversa" | must |
| 8 | U2 | Na conversa aberta, o pedido sai **uma vez** pela rota do Mastra, com `{ content, files }` como a 14.3 manda, e a bolha da pessoa mostra texto e etiqueta; renderizada dentro de `StrictMode`, como `main.tsx:79`, sai uma vez e nenhuma frase de não confirmado aparece; o endereço fica sem o estado da passagem | `apps/web/src/builder/conversation/panel.test.tsx`, "o pedido do Início sai uma vez ao abrir" e "em modo estrito, uma vez e sem aviso" | must |
| 9 | U2 | `PROJECT_NAME_TAKEN`, `PROJECT_ADDRESS_TAKEN`, `PROJECT_NAME_NO_ADDRESS`: a frase no campo do nome, o pedido fica. `COMPANY_DATABASE_PREPARING`, `COMPANY_DATABASE_UNAVAILABLE`: a frase e **Tentar de novo**. Resposta cortada, 502 ou 503: "Não confirmamos a criação. Tente de novo.", e a nova tentativa leva as mesmas chaves | `start.test.tsx`, um caso por grupo, como os de hoje em `home.test.tsx` | must |
| 10 | U2 | O Projeto criado e a conversa não. Resposta cortada, 502, 503 ou `DATABASE_UNAVAILABLE`: a frase fica no passo do nome, o nome travado, e **Tentar de novo** cria só a conversa, com a mesma chave; o Projeto não nasce duas vezes; **Voltar** dá lugar a **Abrir o Projeto**, que abre a página do Projeto sem conversa. `MODEL_NO_ACCOUNT`, `MODEL_UNKNOWN` ou `EFFORT_UNSUPPORTED`: nenhuma nova tentativa; a tela abre `…/projects/<p>` e a página sem conversa mostra a frase do Projeto criado sem pedido, com a do código | `start.test.tsx`, "a conversa cortada depois do Projeto: tentar de novo não cria outro Projeto" e "o modelo recusado depois do Projeto abre o Projeto com a frase" | must |
| 11 | U2 | O envio na conversa recusado (a frase `UNCONFIRMED_SEND` ou a do código): texto e arquivos voltam à caixa da conversa, como na 14.3; recarregar a conversa antes de o envio terminar (a página aberta sem o estado da passagem e com a cópia no `sessionStorage`) põe o texto na caixa com "Não confirmamos o envio do seu pedido. Confira a conversa antes de enviar de novo." e não reenvia sozinho; a cópia some depois de lida | `panel.test.tsx`, "o pedido recusado volta à caixa" e "recarregar não reenvia" | must |
| 12 | U2 | O rascunho do Início guarda o texto na aba por empresa; sair e voltar ao Início o devolve; um envio que abriu a conversa o esvazia | `start.test.tsx`, "o rascunho do Início volta e some depois de criar" | must |
| 13 | U2 | A empresa que o Hub não acha ao criar: a página de "não encontrado", como hoje | `start.test.tsx`, "Criar numa empresa que o Hub já não acha" | must |
| 14 | U3 | O passo 4 de 4 mostra "O que vamos construir primeiro?", a mesma caixa, os exemplos e **Ir para o início sem pedir nada**; criar abre a conversa como no Início; o link abre o Início | `apps/web/src/hub/identity/welcome-steps.test.tsx`, "Passo 4: a caixa cria e abre a conversa" e "Passo 4: Ir para o início sem pedir nada" | must |
| 15 | U4 | Depois de entrar com Enter, o foco vai ao primeiro campo de texto da página de destino quando ela tem um (a caixa do Início), senão ao título; o título focado não desenha contorno | `apps/web/src/routes/_app/index.test.tsx`, o caso #32-4 reescrito: "depois de entrar, o foco vai à caixa"; e "numa página sem campo, o título recebe o foco"; o contorno, a QA | must |
| 16 | U4 | A regra global de `:focus-visible` não pinta um elemento com `tabindex="-1"`; botões, abas e links seguem com o contorno (V28) | `apps/web/layout.test.ts`, "o contorno não vai ao título focado pelo programa" | must |
| 17 | U5 | Ao abrir Código, só as pastas do caminho até o arquivo mostrado estão abertas; as outras, `components/ui` incluída, fechadas | `apps/web/src/builder/source/source.test.tsx`, o caso `:116` reescrito: "só o caminho do arquivo aberto" | must |
| 18 | U5 | Fechar uma pasta dentro de outra aberta põe a seta para a direita e o ícone de pasta fechada; abrir volta a seta para baixo e o ícone de pasta aberta; vale para o clique e para as setas do teclado (V30) | `apps/web/workbench.layout.test.ts` (navegador: `rotate` calculado `none` contra `90deg`) | must |
| 19 | U5 | Um `.tsx` aberto mostra palavras-chave, textos, comentários e funções nas cores dos tokens `--color-code-*`, nos dois temas; nenhum erro de console nem relatório de CSP | `workbench.layout.test.ts` (cor calculada por tema; `page.problems` vazio, T23) | must |
| 20 | U5 | Um arquivo sem gramática (`.gitignore`), acima de 256 KiB, ou cuja gramática falha ao carregar aparece em texto simples, com números de linha, sem erro | `source.test.tsx`, "sem gramática, texto simples" e "acima do teto, texto simples" | must |
| 21 | U5 | Os números de linha não entram na seleção nem na cópia, e o leitor de tela não os lê: a árvore de acessibilidade do navegador não tem nenhum texto que seja só um número de linha | `workbench.layout.test.ts` (navegador: o `innerText` do código sem os números; `Accessibility.getFullAXTree` pelo CDP, nenhum `StaticText` só de dígitos; o contador sem `/ ""` falha este caso) | must |
| 22 | U5 | A 390 px e a 200 %: a página não rola para o lado; o código rola dentro da caixa; **Arquivos** abre o `Sheet` e escolher um arquivo o fecha, como hoje | `apps/web/phone.layout.test.ts`, `apps/web/sweep.test.ts` (o estado "Projeto, Código com a árvore") | must |
| 23 | U5 | No celular, com `components/ui` aberta (50 linhas), a lista do **Arquivos** rola até a última linha; o botão de fechar diz "Fechar arquivos" | `phone.layout.test.ts`, "a lista longa do Sheet rola até o fim" | must |
| 24 | U5 | A linha do arquivo escolhido mantém o fundo ipê com o ponteiro em cima | `source.test.tsx`, nenhum `hover:` que troque o fundo da escolhida; ou a QA | should |
| 25 | U5 | Nada do Shiki chega na primeira página: no manifesto do Vite, o pedaço de entrada não importa nenhum módulo do Shiki, e o Shiki só aparece em `dynamicImports` | `apps/web/vite.config.test.ts`, "o Shiki só chega por import dinâmico" (o build com `manifest: true`) | must |
| 26 | U2 | O Início é centrado: o título, a caixa e os exemplos têm o centro no centro da coluna da página, a caixa com no máximo `46rem` e os exemplos centrados sob ela; a faixa de preparo e os cartões ocupam a largura da página; a 1366 e a 390 px a página não rola para o lado | `apps/web/layout.test.ts`, "o Início é centrado" (navegador, o `createHarness` de `layout-harness.ts` com respostas simuladas: o centro do título, da caixa e dos exemplos igual ao da coluna, `scrollWidth` 390; a recusa é um título à esquerda) | must |
| 27 | U2 | A caixa vazia do Início diz "Descreva o app que você quer…" e a da conversa continua dizendo "Escreva sua mensagem"; o texto vem de uma só prop do `Composer`, sem cópia do componente | `start.test.tsx`, "a caixa do Início tem o seu texto de espera"; `composer.test.tsx`, "sem a prop, a caixa diz Escreva sua mensagem" | must |
| 28 | U2 | Sem conta de modelo, o Início diz "Você ainda não tem uma conta de modelo. Peça a quem administra a empresa ou ligue a sua." e mostra o botão **Minhas contas de modelo** (um `Link` com `buttonVariants()`, não o texto sublinhado), que abre `…/settings/my-model-accounts`; a conversa sem conta continua com a frase `MODEL_NO_ACCOUNT` de hoje, sem "Peça a quem administra" | `start.test.tsx`, "sem conta, o aviso do Início"; `conversation.test.tsx`, o caso do aviso sem conta, que segue como hoje | must |
| 29 | U2 | Depois de um exemplo (critério 4), o foco está na caixa e tocar em outro exemplo troca o texto; a empresa sem Projetos mostra só "Nenhum projeto ainda."; o cartão de um Projeto mostra a inicial do nome na faixa de prévia, o nome e "Criado em", sem estado | `start.test.tsx`, "o foco fica na caixa e outro exemplo troca o texto"; `home.test.tsx`, "Início: o cartão com a prévia e a empresa sem Projetos" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Início, caixa (U2) | a caixa, centrada, com o foco e o texto de espera "Descreva o app que você quer…" (a conversa fica com "Escreva sua mensagem", `composer.tsx:243`), três exemplos | **Enviar** desabilitado, como na 14.3 | a página espera os Projetos, como hoje; a caixa espera `accountsQuery` | a leitura das contas falha: a página de falha da área, com **Tentar de novo** (W34) | a empresa: a página de "não encontrado" | o membro vê a mesma caixa e cria (`createProject` é de membro, `admission.ts:43`); sem o cartão de preparo | sem conta de modelo: o aviso do Início ("Você ainda não tem uma conta de modelo. Peça a quem administra a empresa ou ligue a sua.") e **Minhas contas de modelo**, no lugar da caixa e dos exemplos, no mesmo quadro |
| Início, passo do nome (U2) | o pedido, o campo vazio com o foco, **Criar e começar**, **Voltar** | nome vazio: a frase no campo, nada sai | "Criando…"; sem banco da empresa: "Preparando o banco da empresa…" | a frase do código no campo do nome ou no alerta; resposta cortada: "Não confirmamos a criação. Tente de novo." | a empresa: a página de "não encontrado" | — | a conversa cortada depois do Projeto: a frase, o nome travado, **Tentar de novo** e **Abrir o Projeto**; o modelo recusado: a página do Projeto sem conversa, com a frase |
| Passo 4 (U3) | o título, a caixa, os exemplos, **Ir para o início sem pedir nada** | igual ao Início | igual | igual | — | só o dono vê a primeira entrada (W33) | sem conta (o passo 2 pulado): o aviso no lugar da caixa, e o link para o Início fica; o dono lê "Peça a quem administra a empresa", e o texto volta à sua aprovação dos textos no fim da etapa |
| Conversa aberta com o pedido (U2) | a bolha pendente e o Builder trabalhando | — | o envio em curso, como na 14.3 | o envio recusado: texto e arquivos na caixa e a frase | `CONVERSATION_NOT_FOUND`: como hoje | — | recarregar no meio: o texto na caixa e a frase de não confirmado; os arquivos saem, como na 14.3 |
| Cartões dos Projetos | só a frase "Nenhum projeto ainda.", em `Empty`, como hoje | igual | como hoje | como hoje | — | — | — |
| Código (U5) | só o caminho do primeiro arquivo aberto; o arquivo em texto simples e, em seguida, colorido | "Este app ainda está vazio" | a lista: `Loading`; o arquivo: `Loading`, depois texto simples até a cor chegar | a leitura falha: `ReadFailure` com **Tentar de novo**; o arquivo: a frase do código; a gramática falha: texto simples, sem frase | o Projeto: como hoje | o membro lê o código como hoje | o arquivo grande demais ou não texto: a frase de hoje (`SOURCE_FILE_*`) |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `createConversation` `body.effort` (U1) | web, `start.tsx`, do seletor do Início | server, `created` em `routes.ts`, que o passa ao `switchModel` |
| `createProject` `body.name` | web, o passo do nome (`NameStep`) | server, `projects.create`, como hoje |
| `HistoryState.handoff` `{ content }` (U2) | web, `start.tsx`, no `navigate({ state })` para a conversa | web, `useHandoff` no `Screen` da conversa, ao abrir; tira-o com `replace` |
| Arquivos da passagem (U2) | web, `start.tsx`, `stashHandoffFiles` antes de navegar | web, `useHandoff`, `takeHandoffFiles` |
| Cópia `conexus-handoff:<conversa>` no `sessionStorage` (U2) | web, `useHandoff`, ao tomar a passagem | web, `useHandoff`, só quando a página abre sem `HistoryState.handoff` |
| `HistoryState.refused` (U2) | web, `start.tsx`, no `navigate({ state })` para o Projeto | web, `EmptyPanel` |
| `DraftKey` (U2) | web, `start.tsx` (`start:<empresa>`) e `panel.tsx` (a conversa) | web, `useDraft` |
| `Defaults.start` | server, como hoje | web, `start.tsx`: o valor inicial do seletor, ou o aviso quando nulo |

**Desenho de caixas.** Segue o `wf-h1` e o `wf-o4` aprovados ("Aprovado tudo", 2026-10-19) no que
eles fixam (a caixa da 14.3, os exemplos, os cartões com área de prévia), centrado como o fundador
pediu em 2026-10-27, e o passo do nome do Conexus OS (`prompt-box.tsx:129-144`, captura
`os-11-home-projects-1280.png` do estudo de 2026-10-19, fora do repositório), sem o nome
preenchido. O Início está desenhado com as peças reais do Conexus (a caixa da 14.3, `PreparationCard`,
`ProjectCards`) e os tokens de `brand/tokens.css`, capturado a 1366 e 390 px, claro e escuro (as
capturas `*-centro.png` da página do fundador, fora do repositório). O que o desenho fixa e a
unidade cumpre: a caixa em `46rem`, centrada, com o título e os exemplos; a faixa de preparo e os
cartões na largura da página; sem sombra e sem degradê.

```text
1280 px, Início, antes de enviar
┌ Termine de preparar a empresa  ✓ Empresa · ✓ Conta de modelo · ○ Convidar equipe   Continuar ┐
                        O que vamos construir?
            ┌──────────────────────────────────────────────┐
            │ Descreva o app que você quer…                │
            │ ✳ Claude Sonnet 4.5 · Alto ▾        [+] [mic] [↑] │  (a ordem muda com a 14.3: + à esquerda, microfone e enviar à direita, https://github.com/developmentconexus-ops/conexus/pull/379)
            └──────────────────────────────────────────────┘
                 Não cole senhas ou chaves na conversa.  (só no computador, composer.tsx:277)
      (Controle de encomendas) (Pedidos de férias) (Cadastro de visitas)
Projetos 3
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ C   (prévia)    │ │ C               │ │ P               │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ Checklist de loja│ │ Controle de caixa│ │ Pedidos de férias│
│ Criado em 27/10 │ │ Criado em 27/10 │ │ Criado em 27/10 │
└─────────────────┘ └─────────────────┘ └─────────────────┘

1280 px, Início, depois de Enviar
                        O que vamos construir?
            ┌──────────────────────────────────────────────┐
            │ [▤ tabela-de-precos.pdf]                     │
            │ Um app de encomendas com cliente, data de    │
            │ entrega e valor                              │
            ├──────────────────────────────────────────────┤
            │ Nome do projeto                              │
            │ Encomendas|                                  │
            │ Endereço do app: encomendas--padaria-sol.<domínio> │
            │ [Criar e começar]  [Voltar]                  │
            └──────────────────────────────────────────────┘

390 px, Início, depois de Enviar
O que vamos construir?   (display estreito, V13)
┌─────────────────────────────────┐
│ [▤ tabela-de-precos.pdf]        │
│ Um app de encomendas com        │
│ cliente, data de entrega e valor│
├─────────────────────────────────┤
│ Nome do projeto                 │
│ Encomendas|                     │
│ Endereço do app:                │
│ encomendas--padaria-sol.<domínio>│
│ [Criar e começar]               │
│ [Voltar]                        │
└─────────────────────────────────┘

1280 px, Início, sem conta de modelo, e empresa sem Projetos
                        O que vamos construir?
            ┌──────────────────────────────────────────────┐
            │ Você ainda não tem uma conta de modelo. Peça │
            │ a quem administra a empresa ou ligue a sua.  │
            │ Minhas contas de modelo                      │
            └──────────────────────────────────────────────┘
Projetos
Nenhum projeto ainda.
```

A aba **Código** (U5), na mesma forma, e desenhada em HTML com os tokens de `brand/tokens.css` e as
cores `--color-code-*` do protótipo, capturada a 1366 e 390 px, claro e escuro, e a 390 px com
**Arquivos** aberto (as seis capturas `codigo-*.png` da página do fundador, fora do repositório).
A visão de código do Conexus OS não tem captura (estudo da aba Código, `report.md:288-289`).

```text
1280 px, Projeto, aba Código (a conversa à direita, como hoje)
Encomendas   [Prévia|Código]                               [Abrir app] │ conversa
Versão 1, guardada em 26/10 às 15:42                                   │
┌ árvore, rola sozinha ─┐ ┌ ▤ src/routes/encomendas.tsx ──────────────┐ │
│ ⌄ ▱ src               │ │  1  import { useState } from 'react'      │ │
│   › ▭ components      │ │  2  import { Button } from '../comp…'     │ │
│   › ▭ lib             │ │  3                                        │ │
│   ⌄ ▱ routes          │ │  4  // Uma encomenda: quem pediu, …       │ │
│       ▤ index.tsx     │ │  5  type Encomenda = { cliente: string …  │ │
│     [▤ encomendas.tsx] │ │  …  (cores --color-code-*, rola na caixa)│ │
│     ▤ main.tsx        │ │                                           │ │
│ ▤ index.html          │ │                                           │ │
│ ▤ package.json        │ │                                           │ │
└───────────────────────┘ └───────────────────────────────────────────┘ │

390 px, Projeto, aba Código
Encomendas  [Prévia|Código]  [Abrir app]
Versão 1, guardada em 26/10 às 15:42
[▭ Arquivos]  src/routes/encomendas.tsx
┌ ▤ src/routes/encomendas.tsx ────┐
│  1  import { useState } from 'r…│  (o código rola dentro da caixa)
│  2  import { Button } from '../…│
│  …                              │
└─────────────────────────────────┘

390 px, Arquivos aberto (o Sheet de hoje)
┌ Arquivos do app             [×] ┐  × = "Fechar arquivos"
│ ⌄ ▱ src                         │
│   › ▭ components                │
│   ⌄ ▱ routes                    │
│      [▤ encomendas.tsx]         │  a lista rola até a última linha
└─────────────────────────────────┘
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `createProject` (de hoje, sem mudança) | a chave de tentativa (W24, C37): o mesmo Projeto; dois cliques, um pedido | resposta cortada, 502 ou 503: a frase de não confirmado e a mesma chave na nova tentativa; a preparação do banco da empresa como hoje (data D22) | o banco do Hub: `DATABASE_UNAVAILABLE`; o Neon: `COMPANY_DATABASE_UNAVAILABLE` com **Tentar de novo** | `PROJECT_CREATED`, `COMPANY_DATABASE_CREATED`, como hoje | 7, 9, 13 |
| `createConversation` com `effort` (U1) | a chave: a mesma conversa; outra `effort` com a mesma chave, 409 | o índice gravado antes do fio (data D17); a repetição põe o modelo e o raciocínio que faltam (`created`, `routes.ts:84-101`) | o banco: `DATABASE_UNAVAILABLE`; o armazenamento do Mastra: a falha de hoje, e a repetição conserta | `CONVERSATION_CREATED`, como hoje | 1, 2, 10 |
| Projeto criado e conversa não (U2, a sequência no navegador) | — | o Projeto fica, sem conversa. Resposta cortada, 502, 503 ou `DATABASE_UNAVAILABLE`: o passo do nome tenta só a conversa, com a mesma chave. `MODEL_NO_ACCOUNT`, `MODEL_UNKNOWN`, `EFFORT_UNSUPPORTED`: a mesma recusa voltaria, e a tela abre o Projeto com a frase (OS `start-project.ts:22-34`). Quem sai da página deixa o Projeto, que abre em "Nenhuma conversa" com **Nova conversa**, como hoje; o mesmo nome no Início dá `PROJECT_NAME_TAKEN` | as do `createConversation` | nada novo | 9, 10 |
| O envio do pedido na conversa (rota do Mastra, a da 14.3) | sai uma vez: o `ref` do `useHandoff` segura a segunda volta do efeito em modo estrito, e a navegação com `replace` tira o estado | resposta cortada, 502 ou 503: `UNCONFIRMED_SEND`, texto e arquivos voltam à caixa pelo `restore` do rascunho (`draft.ts:57-60`), que já guarda o texto na aba, e a cópia sai; recarregar no meio: a página abre sem o estado, o texto da cópia volta à caixa com a frase, sem reenviar | o banco e a Anthropic: como na 14.3 | como na 14.3 | 8, 11 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Início: "O que vamos construir?" com a caixa | U2 | `hub/projects/home.tsx:16-37` (título + `CreateProjectForm`) | Factory `mastra-1.78@6a465f9d` `mastracode/factory-ui/src/ui/pages/NewPage.tsx:145-156`; Dyad `902829f` `src/pages/home.tsx:183-214`; vibesdk `9da158d` `src/routes/home.tsx:125-218`; Conexus OS `e0353c36` `apps/web/src/features/project/components/prompt-box.tsx:110-155`; Lovable (captura `builder-lovable-01`, 2026-10-19) | Lido: um `h1` e o mesmo compositor da conversa, nada mais acima | nativo | | "Aprovado tudo", 2026-10-19 (`wf-h1`) | |
| Início centrado: título, caixa e exemplos no centro | U2 | `home.tsx:16-37` (tudo à esquerda) | Dyad `902829f` `src/pages/home.tsx:179-185` (título `text-4xl`, centrado) e `:181` (coluna `max-w-3xl`); vibesdk `9da158d` `src/routes/home.tsx:200-252`; Factory `NewPage.tsx:98-155` (`max-w-xl` centrado); Lovable ("Ready to build, {name}?", `ref-lovable-docs.png` do desenho); v0 (`ref-v0.png`); bolt e Base44 (capturas do desenho) | Lido, e visto: todas centram o título e a caixa, uma pergunta e uma caixa acima da dobra; Mitra só tem o site público (a tela de dentro pede login) | nativo: título, caixa (`46rem`, `mx-auto`) e exemplos (`justify-center`) centrados; a faixa de preparo e os cartões na largura da página; nada de degradê, sombra, aviso promocional nem galeria de modelos (as referências que o desenho não tomou) | `*-centro.png`, 1366 e 390 px, claro e escuro; critério 26 | "a tela de início eu prefiro ela centralizada", 2026-10-27 | |
| O cartão do Projeto com área de prévia | U2 | `project-cards.tsx:8-31` (nome e "Criado em", sem área) | Lovable (miniatura, nome e selo, `ref-lovable-docs.png`); v0 (miniatura 16:10 e nome, `ref-v0.png`); vibesdk `9da158d` `src/routes/home.tsx:285-345` (grade de 3 colunas, `sm:2 lg:3`); Dyad `FeaturedAppShowcase.tsx:10-36` | Lido: a prévia em cima, o nome e uma linha de meta embaixo | nativo: grade 1 / 2 / 3 colunas, uma faixa `bg-surface-3` de `h-28` com a inicial do nome em `text-display`, depois o nome e "Criado em", sem estado (decisão C); no celular, uma lista compacta com a prévia quadrada; a imagem de verdade do app fica para um passo de depois | `4-empresa-nova-…` e `1-inicio-…-centro.png`; critério 29 | "Escolhas 2. A depois C", 2026-10-27; `wf-h1` | |
| "Projetos" com a contagem e "Nenhum projeto ainda." | U2 | `home.tsx:27-35` (título e "Todos os projetos" embaixo); `project-cards.tsx:15` (`Empty`, a peça compartilhada de `ui/states.tsx:116-119`) | vibesdk `9da158d` `src/routes/home.tsx:285-345` ("View all" à direita do cabeçalho) e `:119-123` (a seção some sem apps); Dyad `FeaturedAppShowcase.tsx:10-36` (`null` sem apps); Lovable (cabeçalho com "Browse all →") | Lido: o cabeçalho da seção leva uma ação de texto à direita; sem itens, a seção cala | nativo: o cabeçalho "Projetos 3" com "Todos os projetos" à direita só havendo mais; sem Projetos, a frase "Nenhum projeto ainda." em `Empty`, como hoje e como as outras telas | critério 29 | não precisa | |
| A faixa de preparo da empresa | U2 | `hub/identity/preparation-card.tsx:48-66` (cartão cheio que pesa tanto quanto a caixa) | sem referência direta: o desenho, "ficou muito feia" | Lido | nativo: uma faixa sem fundo, `py-sm`, o título no tamanho do rótulo, os passos na mesma linha a partir de `lg`, **Continuar** discreto (com contorno abaixo de `md`) e o "feito" em `success` | `1-inicio-…-centro.png` | "ficou muito feia", 2026-10-27 | |
| O compositor no Início e no passo 4 | U2, U3 | `builder/conversation/composer.tsx`, o da 14.3 | Factory `Composer.tsx:49, 219-224` (`onUserDraft`: o mesmo componente cria a sessão no envio) | Lido | embrulhado: as props de `composer.tsx:175-186`, com `answering=false`, sem `memory` nem `taskPanel` (a linha de estado fica só com o seletor); `onSend` abre o passo do nome e devolve `true`; `onStop` nunca é chamado sem `answering`; `picker` é o `ModelPicker` com estado local; e uma prop opcional `placeholder` (o texto de espera do Início, critério 27), acrescentada uma vez no `Composer`, que sem ela diz "Escreva sua mensagem" | Teste de tela (critérios 3, 6, 27) | roadmap :83; "3. Descreva o app que você quer", 2026-10-27 | `apps/web/src/builder/conversation/start.tsx` |
| Onde a pessoa digita o nome | U2 | `hub/projects/create-project-form.tsx:66-93` (campo sozinho, endereço enquanto digita) | Conexus OS `e0353c36` `prompt-box.tsx:81-97, 129-144` (enviar abre "Nome do Projeto" com **Criar e começar** e **Voltar**, a caixa parada); Factory `NewPage.tsx:144-158` (só a caixa, sem nome); `wf-h1`, `wf-o4` (só a caixa) | Lido | nativo: a forma do OS, o nome depois do **Enviar** e antes de criar, sem o nome sugerido (A); a caixa fica como no `wf-h1`. O campo acima da caixa o tempo todo não tem referência | | "A. O cliente tem que colocar o nome do projeto", 2026-10-26 | |
| O passo do nome: campo, endereço, recusas | U2 | `create-project-form.tsx:29-96` (o formulário, `hostLabelOf`, `ON_THE_NAME`, `RETRYING`, chave W24) | o mesmo arquivo; OS `prompt-box.tsx:86-97` | Lido | nativo: o formulário de hoje vira o passo do nome (`NameStep`), devolvendo o Projeto em vez de navegar | | "B. B1", 2026-10-26 | |
| O nome do Projeto vindo do pedido | fica de fora (A) | nenhum | `@mastra/core@1.79.0` `generateTitleFromUserMessage`; vibesdk `worker/agents/schemas.ts:85-87`; Dyad `generateCuteAppName`; OS `project-name.ts` | Lido | nativo, fora: a pessoa digita o nome | | "A. O cliente tem que colocar o nome do projeto" | |
| Criar o Projeto e a conversa | U2 | `createProject` (`hub-api/src/projects.ts:80-103`) e `createConversation` (`conversations.ts:93-107`), cada um com sua chave | Factory `useCreateUserSessionFromDraft.ts:38-41` (cria a sessão, depois navega e envia); Dyad `902829f` `src/first_prompt/FirstPromptProvider.tsx:135-157` (`createApp` cria o app e o chat numa chamada e devolve o `chatId`; `createChat` é o caminho de um app já escolhido e da nova tentativa, `commands.ts:142-166`); OS `start-project.ts:13-33` (chamadas em sequência, chave por entrada) | Lido | nativo: as duas operações de hoje, em sequência no navegador, cada uma com sua chave guardada até o Hub decidir (W24). O estudo propunha uma operação nova numa transação: com o nome digitado (A) ela não tem mais o que fazer além das duas, e a conversa nasce em duas casas (o índice do Hub e o fio do Mastra, `routes.ts:84-101`), que nenhuma transação junta; o Hub também não importa o Builder (C4) | | não precisa | |
| Modelo e raciocínio escolhidos antes da conversa | U1, U2 | `createConversation` aceita `model` (`conversations.ts:100`); o raciocínio só pela `setConversationModel` | Factory `useHandoffPrompt.ts` (`handoffModelId`, `switchModel` antes do envio); OS `start-project.ts:26-28` | Lido | nativo: `effort` opcional no corpo de `createConversation`, conferido com `effortsOf` como `setConversationModel` (`routes.ts:116-129`) | | não precisa | |
| A conversa recusada depois do Projeto | U2 | nenhum (hoje o Projeto nasce sozinho) | OS `e0353c36` `start-project.ts:22-34` (o Projeto fica, o primeiro pedido `REFUSED`) e `prompt-box.tsx:37-44` (abre o Projeto com o aviso "escreva de novo"); Dyad `commands.ts:142-166` (a falha do chat confirma o app e tenta só o chat) | Lido | nativo: uma falha que pode passar (resposta cortada, 502, 503, `DATABASE_UNAVAILABLE`) tenta só a conversa, como a Dyad; uma recusa do modelo abre o Projeto com a frase, como o OS | | não precisa | |
| O valor inicial do seletor | U2 | `Defaults.start` em `listModelAccounts` (`model-accounts.ts:115`), lido por `my-defaults.tsx` | decisão 0054 | Lido | nativo | | não precisa | |
| A mensagem passada à conversa | U2 | nenhum | Factory `mastra-1.78@6a465f9d` `domains/chat/hooks/useHandoffPrompt.ts:21-30, 91-133` e `useCreateUserSessionFromDraft.ts:63`; `services/handoffFiles.ts:3-17`; TanStack Router 1.170.44 `navigate({ state })` (`@tanstack/router-core` `link.d.ts:126`, `HistoryState` de `@tanstack/history` 1.162.5 `index.d.ts:43`) | Lido: o "envie agora" vai no estado da navegação (`:93`); ao tomá-lo, grava a cópia no `sessionStorage` e tira o estado com `replace` (`:111-116`); recupera só quando não há estado (`:101-109`); dois `ref` seguram a segunda volta do efeito (`:91-92, 100-103`); os arquivos cruzam num `Map` em memória ("base64 images can exceed browsers' history state size limits", `handoffFiles.ts:3-5`) | nativo: o mesmo mecanismo, com o estado do TanStack Router no lugar do `react-router`; a cópia sai quando o `send` da 14.3 volta, e depois de lida no recarregar | | não precisa | `apps/web/src/builder/conversation/handoff.ts` |
| Rascunho do Início | U2 | `builder/conversation/draft.ts:25-62` (por conversa: o texto em memória com um espelho no `sessionStorage`, os arquivos só em memória; `take` e `restore`) | Factory `ComposerImagesContext` e o rascunho por rota | Lido | embrulhado: a chave do rascunho é a conversa ou `start:<empresa>` | Teste de tela (critério 12) | não precisa | |
| Sem conta de modelo | U2 | `NoAccount` (`model-choice.tsx:21`) na conversa, com a frase `MODEL_NO_ACCOUNT` ("Escolha outro modelo"), que no Início não tem seletor | Factory `NewPage.tsx:126-142` (`MissingCredentialState` no lugar do compositor) | Lido | nativo: o aviso no lugar da caixa e dos exemplos, no mesmo quadro; `NoAccount` ganha um texto e uma `action` opcionais (`'button'`: o `Link` com `buttonVariants()`, como Factory `NewPage.tsx:173` e `ui/states.tsx:106`), `START_NO_ACCOUNT` em `text.ts`, e a conversa segue com o de hoje | critério 28 | "Sem conta de modelo, um aviso no lugar do compositor", 2026-10-19; "5. Okay" ao texto do Início, 2026-10-27 | |
| Três exemplos | U2 | nenhum | OS `prompt-box.tsx:16-21, 99, 147-155`; Dyad `902829f` `src/pages/home.tsx:249-273` (três etiquetas redondas sob a caixa; o clique faz `setInputValue(item.prompt)` e não envia); v0 (quatro etiquetas com ícone sob a caixa, `ref-v0.png` do desenho) | Lido: tocar põe o texto na caixa, não envia | nativo | | `wf-h1`, 2026-10-19; os textos no fim | |
| Passo 4 da primeira entrada | U3 | `routes/_app/companies/$companyId_/welcome/build.tsx:5-18` (só "Ir para o início") | `wf-o4`; Linear `onb-linear-07` (termina dentro do produto) | Documentado | nativo | | W33; `wf-o4` | |
| "+ Novo projeto" e o campo Nome sozinho | U2 (sai) | `create-project-form.tsx`, `home.tsx:25` | Lovable, vibesdk: nenhum; Factory: "New session" abre a página da caixa (`SessionsSection.tsx:93`) | Lido | nativo: sai, todo Projeto nasce de um pedido | | "B. B1", 2026-10-26 | |
| Estado nos cartões | fica de fora (decisão C) | `project-cards.tsx:8-31` ("Criado em …") | OS `os-11`; Lovable (miniatura) | Documentado | nativo, fora: o cartão fica com o nome e "Criado em" | | `C. C1`, 2026-10-26 | |
| Foco depois de entrar e o contorno | U4 | `hub/identity/sign-in-form.tsx:50-65`; `brand/tokens.css:281-284` | Factory `ComposerInput` foca o campo na página nova; V28 nomeia botões, abas, links e campos | Lido | nativo: o foco vai ao primeiro campo de texto do destino quando há um, senão ao título; a regra global segue V28 (`:focus-visible` sem `[tabindex="-1"]`) | | "tá até com o subliado lá em cima", 2026-10-25 | |
| Cor do código (o realce) | U5 | `builder/source/source.tsx:27` (`<pre>` cru) | `shiki@4.5.0` (`docs/guide/regex-engines.md:42-62`, `best-performance.md:36-56`, shiki `f7d0167`); Mastra `mastra-1.78@6a465f9d` `packages/playground-ui/src/ds/components/CodeEditor/highlight.ts:51-95`, `Code/code.tsx:67`; shadcn `ui@8f04138` `apps/v4/registry/bases/base/lib/highlighter.tsx:2-48`; Streamdown `c6f5905` `packages/streamdown-code/index.ts:16-18, 303-307`; AI Elements `ca8be60` `packages/elements/src/code-block.tsx:30, 158-161, 213-219` | Lido: `shiki/core` com `createJavaScriptRegexEngine` (sem wasm) e um `import()` por gramática; `codeToTokens` desenhado como `span` do React, nunca `dangerouslySetInnerHTML`. Só a AI Elements usa o `shiki` inteiro com o wasm Oniguruma | embrulhado: o nosso liga cada variável de cor do tema a uma classe da marca (`COLOURS`, 8 linhas), porque `noInlineStyles` (`biome.json:118`) proíbe o `style` que a Mastra e a AI Elements usam | estudo da aba Código, `runs/proto.out`: palavra-chave `rgb(207,34,46)` no claro e `rgb(255,123,114)` no escuro; nenhum erro de console nem relatório de CSP a 1366 e 390, nos dois temas | "colorir o código, interpretador de código", 2026-10-26; `D2`, 2026-10-26 | `apps/web/src/builder/source/highlight.ts` |
| Cores nos dois temas | U5 | nenhum | `@shikijs/core@4.5.0` `createCssVariablesTheme` (`dist/index.d.mts:133-164`); Mastra `index.css:150-158` (`--shiki-light`/`--shiki-dark`) | Lido: o tema escreve `var(--shiki-token-keyword)` e afins, 14 nomes; a página os define | nativo: a marca define 7 tokens `--color-code-*` por tema em `brand/tokens.css` (V3), sem tema duplo | `runs/proto.out`, as cores por tema | não precisa | |
| Carregar só ao abrir um arquivo | U5 | nenhum | Mastra `highlight.ts:51-75`; shadcn `highlighter.tsx:10-24` | Lido: `import('shiki/langs/tsx.mjs')` e afins, um pedaço cada | nativo (divisão de código do Vite) | `runs/build-*-chunks.txt`: o pedaço principal +1,7 kB comprimido; o primeiro `.tsx` baixa núcleo 29,7 + motor 20,3 + tsx 16,6 kB | não precisa | |
| Teto de tamanho do realce | U5 | o Hub lê até 1 MiB (`hub-api/src/source.ts:40`) | Mastra `packages/playground-ui/src/ds/components/Code/use-highlight.ts:14, 19` (75 ms de intervalo); AI Elements `code-block.tsx:316-319` (`content-visibility`) | Lido: cada um limita o custo na linha principal do seu jeito | embrulhado: acima de 256 KiB, texto simples com números de linha (C73: custo medido) | `runs/time.mjs`: 1 MiB de tsx 1.119 ms; 256 KiB 361 ms; 64 KiB 145 ms. O maior arquivo real é o `package-lock.json` do modelo inicial, 84 KB | não precisa | |
| Árvore fechada, menos o caminho do arquivo | U5 | `builder/source/file-tree.tsx:67` (`defaultOpen={!KIT.test(…)}`: tudo aberto menos `components/ui`) | AI Elements `file-tree.tsx:43, 51` (`defaultExpanded = new Set()`); Mastra `factory-ui/…/WorkspaceFileBrowser.tsx:157` (`openFolders[node.path] ?? false`); Conexus OS `e0353c36` `apps/web/src/features/builder/construir/lens-code.tsx:33, 40, 65` (abre só `ancestors(path)`); Dyad `902829f` `FileTree.tsx:694`. Ao contrário: vibesdk `file-explorer.tsx:71` (`useState(true)`), bolt.diy `353b44c` `FileTree.tsx:46` | Lido: fechadas em 4 de 6; o OS abre os ancestrais do arquivo escolhido | nativo: `defaultOpen` do Base UI a partir dos ancestrais do arquivo escolhido, como o OS | | "elas vêm expandidas já e não contraídas", 2026-10-26 | |
| Seta que segue o estado | U5 | `file-tree.tsx:67, 71` (`group/folder` com `group-data-open/folder:rotate-90`: a seta de uma pasta fechada dentro de uma aberta lê o `data-open` da de cima) | `@base-ui/react@1.9.0` `docs/react/components/collapsible.md`, a demonstração Tailwind (`group` no `Collapsible.Trigger`, `group-data-panel-open:rotate-90`); `CollapsibleTriggerDataAttributes.js:10` (`data-panel-open`); AI Elements `file-tree.tsx:183-188`; Mastra `Tree/tree-folder-trigger.tsx:54`. O `sidebar-11` do shadcn usa `data-state`, que o Base UI 1.9 nunca escreve | Lido; provado | nativo: o exemplo da própria biblioteca | `runs/today.out` (o defeito) e `runs/proto.out` (consertado) | "mesmo você contraindo ele não volta a setinha certa", 2026-10-26 | |
| Ícone de pasta aberta e fechada | U5 | nenhum | AI Elements `file-tree.tsx:197-202` (`FolderOpenIcon`/`FolderIcon`); Mastra `WorkspaceFileBrowser.tsx:47-52`; Dyad `FileTree.tsx:741`; OS `lens-code.tsx:34` | Lido | nativo: `FolderIcon` e `FolderOpenIcon` do lucide, trocados por `group-data-panel-open:` (nenhum estado nosso) | `shots/proto/desktop-tree-nested-closed-*.png` | "colocar símbolo de pastinha", 2026-10-26 | |
| Ícone de arquivo | U5 | nenhum | AI Elements `file-tree.tsx` (um `FileIcon`); Mastra `WorkspaceFileBrowser.tsx:22-44` e vibesdk `file-explorer.tsx:27-43` (um ícone por tipo) | Lido | nativo: um `FileIcon` do lucide, como a AI Elements; um ícone por tipo ninguém pediu | | não precisa | |
| Caixa do código, cabeçalho e números de linha | U5 | `source.tsx:23-28` (`<pre>` cru) | shadcn base-nova `code-block` (registro `ui.shadcn.com/r/styles/base-nova/code-block.json`, lido em 2026-10-27): `CodeBlock`, `CodeBlockHeader`, `CodeBlockTitle` (`code-block.tsx:27-69`), `CodeBlockContent lineNumbers` (`:149-191`), `CodeBlockLine` (`:193-235`), o contador `content: counter(line) / ''` atrás de um `supports-` (`:194`); a skill `shadcn`, `rules/chat.md:405-424` ("`lineNumbers` for source") | Lido; provado | embrulhado: copiado para `ui/code-block.tsx` como o `attachment` (`ui/attachment.tsx:5`), pintado com os tokens; o `style={{ counterReset }}` de `CodeBlockContent` (`:169`) vira a classe `[counter-reset:line]` (`noInlineStyles`); ficam de fora `CodeBlockActions`, `CodeBlockCopyButton` e `CodeBlockFooter` (copiar ficou de fora) e o `use-highlighted-code`, porque o realce é o `highlight.ts` | revisão do delta do cartão, 2026-10-27, Chromium 153: `content: counter(line)` põe `"1","2"` nos `StaticText` da árvore de acessibilidade; `counter(line) / ""` não | não precisa | `apps/web/src/ui/code-block.tsx` |
| Números de linha | U5 | nenhum | shadcn base-nova `code-block.tsx:194` (contador com texto alternativo vazio); AI Elements `code-block.tsx:80-91, 282` (o mesmo contador, sem o texto alternativo: o leitor de tela lê os números); vibesdk `main-content-panel.tsx:379-381`; OS `code-surfaces.tsx:31` | Lido; provado | nativo: o `CodeBlockLine` da linha acima | | não precisa | |
| Nome do arquivo em cima do código | U5 | só no celular (`source.tsx:57`) | shadcn base-nova `CodeBlockHeader` e `CodeBlockTitle` (`code-block.tsx:45-69`); OS `lens-code.tsx:69` (`cx-file-head`); Mastra `WorkspaceFileViewer.tsx`, o cabeçalho | Lido | nativo: o cabeçalho da caixa do código | | não precisa | |
| Árvore com rolagem própria no computador | U5 | nenhum: a página inteira rola (`source.tsx:67-69`) | OS `construir.css:53` (`.cx-files { overflow: auto }`); vibesdk `file-explorer.tsx:187-194` | Lido | nativo (CSS) | | não precisa | |
| Celular | U5 | `source.tsx:52-64` (`Sheet` a partir de **Arquivos**) | OS `construir.css:158-160`; Mastra `WorkspaceFilesToggle.tsx:36-52` (um `Popover` abaixo de 68 rem); vibesdk e Dyad: nenhum | Lido | nativo: fica o `Sheet`; **Arquivos** ganha o ícone; o código rola na sua caixa | `shots/proto/phone-*.png`; `scrollWidth` 390 | critério 13 da 14.2 ("o `Sheet` a 390 px"), aprovado | |
| A lista do celular rola | U5 | `ui/sheet.tsx:26-30` (`fixed … h-full flex-col`, sem `overflow`); `file-tree.tsx:113` | shadcn `Sheet` (o conteúdo decide a rolagem); OS `construir.css:53, 160` | Lido; provado o defeito | nativo: `min-h-0 overflow-y-auto` no invólucro da árvore dentro do `Sheet` | `runs/sheet.out`: 50 linhas, a última em y=1339 de 844, `scrollTop` fica 0 | "Ainda mais no celular", 2026-10-26 | |
| O botão de fechar do `Sheet` dos arquivos | U5 | `ui/sheet.tsx:41` (`aria-label="Fechar navegação"` fixo) | V31 | Lido | nativo: o `Sheet` recebe o rótulo de fechar; aqui "Fechar arquivos" | | não precisa | |
| A seleção sob o ponteiro | U5 | `file-tree.tsx:50, 62` (`hover:bg-surface-3` cobre `bg-accent-soft`) | V5 (o ipê marca a escolha) | Lido | nativo: a linha escolhida não troca de fundo no hover | | não precisa | |
| Copiar o arquivo | fica de fora: ninguém pediu | nenhum | AI Elements `code-block.tsx:471-498` | Lido | nativo, fora | | não precisa | |
| Editor completo (CodeMirror, Monaco) | fica de fora (`D1` e `D3` não escolhidas) | nenhum | OS `code-surfaces.tsx:1-46` e `apps/hub/src/http/app.ts:56-71` (nonce de estilo, `styleSrcAttr: ["'unsafe-inline'"]`); vibesdk `worker/config/security.ts:186-190`, `monaco-editor ^0.56.0` | Lido | nativo, fora | | `D2`, 2026-10-26 | |
| Aba Alterações | fica de fora (14.1 B1) | nenhum | Factory `routes/fs.ts:157-188` | Lido na 14.1 | nativo, fora | | "Ok, pode ser então A1 e B1", 2026-10-25 | |

As referências fora do `node_modules`: Mastra na estante `mastra-1.78` em `6a465f9d` (a Factory em
`mastracode/factory-ui/src/ui/`), vibesdk `9da158d`, Dyad `902829f`, Conexus OS `e0353c36`; para a
U5 também bolt.diy `353b44c`, AI Elements `ca8be60`, Streamdown `c6f5905`, shadcn/ui `8f04138` e
Shiki `f7d0167` (4.5.0). As provas `runs/` e `shots/` são do estudo da aba Código, de 2026-10-26,
fora do repositório.

**A medida do transplante.** Nenhum código do Conexus OS. Do OS vem só a forma do passo do nome
(enviar, nome, criar e começar, voltar); o `suggestProjectName` não entra (A). Na U5, do OS vem só
a regra de abrir os ancestrais do arquivo (`lens-code.tsx:33, 40, 65`); o protótipo do estudo
(`runs/prototype.diff`) é lido como prova, não copiado.

**A dívida.** Nenhuma.

## U1 A conversa nova aceita o raciocínio

**Base e modelo.** `main` com a 14.3 inteira. Sonnet: um campo opcional num contrato e um teste.

### As linhas da tabela

- **Modelo e raciocínio escolhidos antes da conversa**: `packages/hub-api/src/conversations.ts:93-107`
  (`createConversation`); `apps/server/src/builder/conversation/routes.ts:84-101` (`created`), que
  hoje toma o raciocínio de `conversationStart` (`builder/model-accounts/defaults.ts:92-111`); a
  conferência que já existe em `setConversationModel` (`routes.ts:116-129`: `effortsOf(model)`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/conversations.ts` | Muda: `effort` opcional no corpo; `EFFORT_UNSUPPORTED` nas falhas | `routes.ts` do servidor; `queries.ts` da web (`sendCreation`) |
| `apps/server/src/builder/conversation/routes.ts` | Muda: `created` usa o `effort` pedido | `registerConversationRoutes` |
| `apps/server/src/builder/conversation/conversations.test.ts` | Muda: os casos dos critérios 1 e 2 | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/conversations.ts
input: { params: InProject, body: z.object({ model: ModelId.optional(), effort: Effort.optional() }) },
failures: [...READ_FAILURES, 'IDEMPOTENCY_CONFLICT', 'MODEL_UNKNOWN', 'MODEL_NO_ACCOUNT', 'EFFORT_UNSUPPORTED'],

// apps/server/src/builder/conversation/routes.ts
async function created(
  deps: Deps,
  input: InProject & { attemptKey: string; body: { model?: ModelId; effort?: Effort } },
): Promise<{ id: ConversationId; createdAt: Date; created: boolean; model: ModelId }>
```

- O raciocínio pedido vale só com o modelo pedido ou com o do padrão; `effortsOf(model)` sem ele é
  `EFFORT_UNSUPPORTED`, antes de gravar o índice. Um dono: `effortsOf` (C26).
- A resposta não muda: a leitura da sessão do Mastra já devolve o raciocínio (`sessionReadQuery`).
- `bodyHashOf(body)` já cobre o campo novo: outra `effort` com a mesma chave é outro pedido (C37).

### As skills e a leitura

`mastra` (a linha de `@mastra/core` em `docs/reference/stack.md`), `fastify-best-practices`; o guia
de dados para D17.

### A ordem do trabalho

1. O teste primeiro, pela porta pública (`test-hub.ts`, T5): hoje o Zod tira o `effort` do corpo
   (`z.object` descarta chaves que não conhece); o caso "o raciocínio pedido vale desde a criação" falha.
2. `conversations.ts`: o campo e a falha. Regras: C27, C37.
3. `routes.ts`: em `created`, depois de `conversationStart`, `effort = body.effort ?? start.effort`,
   e `effortsOf(model).includes(effort)` ou `EFFORT_UNSUPPORTED`, antes de `store.create`.

### Como se prova

Critérios 1 e 2 em `conversations.test.ts`. Hoje o caso 1 falha (o raciocínio é o do padrão).

### Parar se

Nada que só o teste revele.

## U2 O Início

**Base e modelo.** `main` com a U1. Opus: a peça cruza três módulos da web (a caixa do Builder, o
formulário do Hub e a rota) e entrega a mensagem de uma tela à outra sem reenviar. O desenho do Início
(centrado, 2026-10-27) parte do protótipo `prototype.diff` do desenho, fora do repositório, que é a base à esquerda (sem
`mx-auto`, `46rem` nem `justify-center`); o centrado vem do contrato desta unidade e das capturas
`*-centro.png`. O protótipo guarda as classes de layout que não centram, não é um pedido a juntar (ver "O que o protótipo ainda deve").

### As linhas da tabela

**Início com a caixa**, **O compositor no Início**, **Onde a pessoa digita o nome**, **O passo do
nome**, **Criar o Projeto e a conversa**, **A conversa recusada depois do Projeto**, **Modelo e raciocínio** (a parte da web), **O valor
inicial do seletor**, **A mensagem passada à conversa**, **Rascunho do Início**, **Sem conta de
modelo**, **Três exemplos**, **Início centrado**, **O cartão do Projeto com área de prévia**,
**"Projetos" com a contagem e "Nenhum projeto ainda."**, **A faixa de preparo da empresa**,
**"+ Novo projeto" e o campo Nome sozinho**. As linhas citadas estão
na tabela; a passagem copia o jeito da Factory (`useHandoffPrompt.ts`, `handoffFiles.ts:3-17`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/projects/create-project-form.tsx` | Muda para `name-step.tsx`: `NameStep`, devolve o Projeto em vez de navegar, botões **Criar e começar** e **Voltar** | `start.tsx` |
| `apps/web/src/hub/projects/home.tsx` | Muda: sai o formulário; entra o nó `start`; o título centrado (`text-display`, `max-md:text-display-narrow`); "Projetos" com a contagem e "Todos os projetos" à direita | a rota do Início |
| `apps/web/src/hub/projects/project-cards.tsx` | Muda: sai a frase "The state on the card comes with step 14" (decisão C, nenhum passo a tem); entra a faixa de prévia com a inicial do nome (`h-28`, `bg-surface-3`, `text-display`), a grade de 1 / 2 / 3 colunas e `Empty` com "Nenhum projeto ainda." (a peça compartilhada fica) | `home.tsx`, `projects.tsx` |
| `apps/web/src/hub/identity/preparation-card.tsx` | Muda: a faixa fina sem fundo, os passos na mesma linha a partir de `lg`, **Continuar** discreto, o "feito" em `success` | `Preparation` da rota do Início |
| `docs/reference/components.md` | Muda: `project-card` (a faixa de prévia, o espaçamento) e `example-chip` (peça nova: `surface`, filete, `h-8`, 44 px a 390) | — |
| `apps/web/src/brand/tokens.css` | Muda: `--text-display-narrow: 1.6rem` (o tamanho de V13 no celular, que não tinha token) | toda a web |
| `apps/web/src/hub/projects/public.ts` | Muda: exporta `NameStep` | `start.tsx` |
| `apps/web/src/builder/conversation/start.tsx` | Cria: a caixa, os exemplos, o passo do nome, a sequência de criação | a rota do Início; a U3 |
| `apps/web/src/builder/conversation/handoff.ts` | Cria | `start.tsx`, `panel.tsx` |
| `apps/web/src/builder/conversation/draft.ts` | Muda: a chave | `panel.tsx`, `start.tsx` |
| `apps/web/src/builder/conversation/panel.tsx` | Muda: `Screen` chama `useHandoff`; `EmptyPanel` mostra `HistoryState.refused` | — |
| `apps/web/src/builder/conversation/composer.tsx` | Muda: a prop opcional `placeholder`, acrescentada uma vez (sem ela, "Escreva sua mensagem") | `panel.tsx`, `start.tsx` |
| `apps/web/src/builder/conversation/model-choice.tsx` | Muda: `NoAccount` aceita um texto e uma `action` opcionais (o texto e o link sublinhado da conversa continuam o padrão) | `panel.tsx`, `start.tsx` |
| `apps/web/src/builder/conversation/text.ts` | Muda: os exemplos, a frase do recarregar, `START_PLACEHOLDER` e `START_NO_ACCOUNT` | `start.tsx`, `panel.tsx` |
| `apps/web/src/builder/conversation/public.ts` | Muda: exporta `Start` | a rota; a U3 |
| `apps/web/src/routes/_app/companies/$companyId/index.tsx` | Muda: passa `<Start companyId />` ao `Home` | — |
| testes: `start.test.tsx` (cria), `home.test.tsx`, `panel.test.tsx`, `composer.test.tsx`, `conversation.test.tsx`, `apps/web/layout.test.ts` (mudam) | | |

### Os contratos que a unidade cria

```ts
// builder/conversation/handoff.ts
/** O que a navegação leva (TanStack Router `navigate({ state })`), pela fusão de `HistoryState` que a biblioteca documenta. */
interface HistoryState {
  /** "Envie agora", só o texto (Factory `promptHandoffState`). */
  handoff?: { content: string }
  /** O Projeto nasceu e o Hub recusou o modelo da conversa. */
  refused?: 'MODEL_NO_ACCOUNT' | 'MODEL_UNKNOWN' | 'EFFORT_UNSUPPORTED'
}
/** Os arquivos cruzam em memória: a 14.3 aceita até 28 MiB de data URL (`LIMITS.total`, `attachments.ts:8`; Factory `handoffFiles.ts`). */
export function stashHandoffFiles(conversationId: ConversationId, files: readonly MessageFile[]): void
export function takeHandoffFiles(conversationId: ConversationId): readonly MessageFile[]
/** No `Screen` da conversa: envia o pedido do Início uma vez, ou recupera o texto depois de recarregar. */
export function useHandoff(
  conversationId: ConversationId,
  on: { send: (outgoing: Outgoing) => Promise<boolean>; recover: (text: string) => void },
): void

// builder/conversation/draft.ts
export type DraftKey = ConversationId | `start:${CompanyId}`
export function useDraft(key: DraftKey): Draft // o resto como a 14.3 o deixou

// builder/conversation/composer.tsx
/** Uma prop a mais no `Composer`; sem ela, "Escreva sua mensagem" (`composer.tsx:243`). */
placeholder?: string

// builder/conversation/model-choice.tsx
export function NoAccount(props: {
  companyId: CompanyId
  text?: string
  /** `button`: o `Link` com `buttonVariants()` (Início); `link`: o sublinhado de hoje (conversa). */
  action?: 'link' | 'button'
}): ReactNode

// builder/conversation/text.ts
export const START_PLACEHOLDER = 'Descreva o app que você quer…'
export const START_NO_ACCOUNT =
  'Você ainda não tem uma conta de modelo. Peça a quem administra a empresa ou ligue a sua.'

// builder/conversation/start.tsx
export function Start(props: { companyId: CompanyId }): ReactNode
type Phase =
  | { kind: 'WRITING' }
  | { kind: 'NAMING'; outgoing: Outgoing }
  | { kind: 'STARTING'; outgoing: Outgoing; project: Project } // o Projeto existe; falta a conversa

// hub/projects/name-step.tsx (era create-project-form.tsx)
export function NameStep(props: {
  company: CompanyDetail
  databaseReady: boolean
  /** Travado quando o Projeto já nasceu e falta a conversa; **Voltar** vira **Abrir o Projeto**. */
  locked: string | null
  onCreated: (project: Project) => Promise<void>
  onBack: () => void
  onOpenProject: () => void
}): ReactNode

// hub/projects/home.tsx
export function Home(props: { companyId: CompanyId; aside?: ReactNode; start: ReactNode })
```

- **O layout centrado** (este contrato e as capturas `*-centro.png`; o protótipo é a base à esquerda): `Home` centra o título; `Start` põe a
  caixa e o passo do nome numa coluna `mx-auto` de no máximo `46rem` e os exemplos com
  `justify-center`; a faixa de preparo, "Projetos" e os cartões ficam na largura de `max-w-page`.
  Os exemplos são o `Button` (`variant="default"`, `rounded-pill`), sem `<button>` à mão (W21). Nada de sombra nem degradê; a 390 px os exemplos e os botões do nome têm 44 px de alto.
- **O texto de espera** é a prop `placeholder` do `Composer`, acrescentada uma vez: `start.tsx` passa
  `START_PLACEHOLDER`; a conversa não passa e fica com o de hoje. Copiar o `Composer` para o Início
  não é o caminho (C26, C75).
- **Sem conta**, `start.tsx` mostra `<NoAccount text={START_NO_ACCOUNT} action="button" />` no quadro da caixa; o
  `Notice` é o de hoje; **Minhas contas de modelo** é um `Link` desenhado com `buttonVariants()` (o botão que você escolheu, como `ui/states.tsx:106` e `preparation-card.tsx` já fazem), por `action="button"`; a conversa não passa a prop e fica com o link sublinhado de hoje.
- **O cartão do Projeto**: a faixa de prévia leva `project.name.charAt(0).toLocaleUpperCase('pt-BR')`
  (decorativa, `aria-hidden`); a imagem do app é de um passo de depois. O estado não volta (decisão C).
- `Phase` é a união do Início (C21); `kind` separa. `STARTING` guarda o Projeto para que **Tentar de
  novo** crie só a conversa (critério 10). Em `STARTING` o `NameStep` troca **Voltar** por **Abrir
  o Projeto**: o nome não muda mais (decisão 0024), e o Projeto já está nos cartões.
- O pedido sai do rascunho do Início no **Enviar** (`draft.take`, `composer.tsx:201`) e fica em
  `NAMING`; **Voltar** o devolve com `draft.restore` (`draft.ts:57-60`).
- As chaves: `useAttemptKey` de hoje, uma para o Projeto, outra para a conversa, cada uma guardada
  até o Hub decidir (W24, `keepsAttemptKey`).
- `start.tsx`, depois de a conversa nascer: `stashHandoffFiles` e
  `navigate({ to: …/conversations/<c>, state: { handoff: { content } } })`. Numa recusa do modelo:
  `navigate({ to: …/projects/<p>, state: { refused: code } })`.
- `useHandoff` segue `useHandoffPrompt.ts:91-133` da Factory, na mesma ordem: dois `useRef`,
  `handedOff` e `recovered`, que sobrevivem à segunda volta do efeito em modo estrito
  (`main.tsx:79`). Com `HistoryState.handoff` e `handedOff` falso: marca `handedOff`, toma os
  arquivos, grava a cópia do texto no `sessionStorage` (`pageStorage('session')`, chave
  `conexus-handoff:<conversa>`), tira o estado com `navigate({ replace: true, state: {} })` e chama
  `send`, o de `useSending` (`panel.tsx:88-109`), que devolve `true` aceito e `false` recusado ou
  não confirmado, com a frase já posta. A cópia sai quando o `send` volta: `false` põe o pedido no
  rascunho com `draft.restore` (`draft.ts:57-60`), como o `Composer` faz (`composer.tsx:204`), e o
  rascunho já espelha o texto no `sessionStorage`. Só um recarregar no meio do envio a encontra. Sem `HistoryState.handoff`, com `handedOff` falso e `recovered` falso: marca
  `recovered`; havendo cópia, `recover(texto)` põe o texto no rascunho e a frase, e a cópia sai.
  Nunca reenvia sozinho. Um dono do texto do recarregar: `text.ts` (C26).
- `EmptyPanel` com `HistoryState.refused`: a frase do Projeto criado sem pedido e a do código
  (`sentenceOfCode`), acima de "Nenhuma conversa".
- O seletor: `ModelPicker` (`builder/model-accounts/model-picker.tsx:40`) com estado local, começando
  em `accountsQuery(companyId).data.defaults.start`; nulo mostra `NoAccount`.
- `NameStep` mantém `ON_THE_NAME`, `RETRYING`, `UNCONFIRMED`, o endereço por `hostLabelOf` e os
  textos de espera de hoje; muda o botão para **Criar e começar** e ganha **Voltar**.
- Modelo de arquivo: `create-project-form.tsx` de hoje (cumpre C23 com `CompanyDetail` e a chave;
  C26 com `ON_THE_NAME`; não tem estado em união, e `start.tsx` traz a sua, C21).
- Apaga: o comentário "até a 13" de `home.tsx:11-15`; o formulário sozinho no Início; a frase da
  etapa 14 em `project-cards.tsx:10`.

### As skills e a leitura

`shadcn`, `impeccable` pelas regras de `docs/reference/impeccable.md`; React, TanStack Router e
Query pelas linhas de `docs/reference/stack.md`; Factory `useHandoffPrompt.ts` e `handoffFiles.ts`
lidos inteiros antes de escrever `handoff.ts`.

### A ordem do trabalho

1. Apagar antes: o `CreateProjectForm` do `Home` e os casos de `home.test.tsx` que provam o campo
   sozinho (`:85-291`, os que viram casos de `start.test.tsx` trocam de arquivo, não somem); a frase
   de `project-cards.tsx:10`.
2. `create-project-form.tsx` → `name-step.tsx`, com `onCreated`, `onBack`, `locked`.
3. `draft.ts`: `DraftKey`. `handoff.ts`: `HistoryState`, os arquivos e `useHandoff`, com o teste
   de modo estrito do critério 8 primeiro.
4. `start.tsx`: a caixa da 14.3 (`answering=false`, sem `memory` nem `taskPanel`), o seletor, os
   exemplos; `onSend` passa a `NAMING`; `NameStep` com o pedido acima (texto e as etiquetas `FileChip`
   de `person-turn.tsx:17`, com `chipOf` de `messages.ts:117`, como as da caixa, `composer.tsx:47`); `onCreated` cria a conversa com `{ model, effort }`, guarda os
   arquivos e navega com o estado. Regras: W24, C21, C26, C48.
5. `panel.tsx`: `useHandoff` no `Screen`; `refused` no `EmptyPanel`. Regras: V30 para o foco (a
   caixa da conversa, como hoje).
6. A rota do Início e `Home`.

### O que o protótipo ainda deve

O `prototype.diff` do desenho (11 arquivos, +312 / -60 em `apps/web`) é a referência visual: guarda-se
as classes de layout e troca-se o atalho de criação pela passagem e pelos contratos de falha deste
cartão. Falta nele: `handoff.ts` e `useHandoff` (e a cópia no `sessionStorage`); a sequência com
`effort` (depende da U1) e as fases `STARTING` e `refused`; a prop `placeholder` e o texto do
Início sem conta; o rascunho em `start:<empresa>` provado; e os testes (os casos de `home.test.tsx` do
campo sozinho falham de propósito e se mudam para `start.test.tsx`). Nada sai do protótipo como está.

### Como se prova

Critérios 3 a 13 e 26 a 29. `start.test.tsx` com MSW, como `home.test.tsx` hoje; o critério 8 em
`panel.test.tsx` com a rota do Mastra vista pelo MSW, como os testes de envio da 14.3. Hoje o
critério 3 falha (o campo sozinho). A QA faz o roteiro a 1280 e 390 px, nos dois temas, abre cada captura `*-centro.png` ao lado da tela e lê o
console.

### Parar se

- O compositor da 14.3, como entrou no `main`, não recebe `answering=false` sem `memory` sem mudar
  a sua forma, ou o `sticky bottom-0` do seu formulário (`composer.tsx:23-24`) prende a caixa ao pé
  do Início quando os Projetos rolam: relatar a linha e a captura; a mudança volta ao cartão (L7).
- O `send` da 14.3 não aceita ser chamado ao montar o `Screen` (o fluxo do Mastra ainda não abriu):
  relatar o que o Mastra faz, sem esperar com um temporizador.

## U3 O passo 4

**Base e modelo.** `main` com a U2. Sonnet: a mesma peça noutra rota.

### As linhas da tabela

**Passo 4 da primeira entrada**: `routes/_app/companies/$companyId_/welcome/build.tsx:5-18`; `wf-o4`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/routes/_app/companies/$companyId_/welcome/build.tsx` | Muda: `Start` e o link "Ir para o início sem pedir nada" | — |
| `apps/web/src/hub/identity/welcome-steps.test.tsx` | Muda: o caso do passo 4 (`:127`) | — |

### Os contratos que a unidade cria

Nenhum: `Start` da U2, com o seu texto de espera, o aviso sem conta e a coluna de `46rem` centrada,
tudo dentro de `Start`. O título do passo já vem de `staticData.place` ("O que vamos construir
primeiro?"); o centrado do título do Início é de `Home` e não vem junto: o título do passo 4 fica
como está (`welcome/`). Apaga o comentário "until step 13" de `build.tsx:4`.

### As skills e a leitura

React, TanStack Router.

### A ordem do trabalho

1. Apagar antes: o botão sozinho e o comentário.
2. `<Start companyId />` (a caixa centrada na coluna do passo, a 1366 e a 390 px sem rolagem para o lado) e, embaixo, o `Link` "Ir para o início sem pedir nada" em `text-label`.

### Como se prova

Critério 14 em `welcome-steps.test.tsx`, que também confere o texto de espera "Descreva o app que você
quer…" (critério 27) e o aviso sem conta (critério 28) no passo 4; hoje o caso "Passo 4: a caixa cria e abre a conversa"
falha.

### Parar se

Nada que só o teste revele.

## U4 O foco depois de entrar

**Base e modelo.** `main` com a U2. Sonnet: uma função e uma regra de CSS.

### As linhas da tabela

**Foco depois de entrar e o contorno**: `hub/identity/sign-in-form.tsx:50-65`
(`focusTitleWhenRendered`); `brand/tokens.css:281-284`; o teste
`routes/_app/index.test.tsx:127-137`; V28.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/identity/sign-in-form.tsx` | Muda: o foco vai ao primeiro campo, senão ao título | `SignInForm` |
| `apps/web/src/brand/tokens.css` | Muda: `:focus-visible:not([tabindex="-1"])` | toda a web |
| `apps/web/src/routes/_app/index.test.tsx` | Muda: o caso #32-4 | — |
| `apps/web/layout.test.ts` | Muda: o caso do critério 16 | — |

### Os contratos que a unidade cria

```ts
// sign-in-form.tsx
function focusWhenRendered(router: ReturnType<typeof useRouter>): () => void
// `main textarea, main input:not([type=hidden])` primeiro; senão `main h1` com tabIndex -1.
```

### As skills e a leitura

React; o guia de design (V28) e o de web. O título do Início agora é centrado e menor no celular
(`--text-display-narrow`, que a U2 define); o foco do `main h1` e a regra `:not([tabindex="-1"])` não
dependem disso, e a QA da U4 olha o título centrado sem contorno.

### A ordem do trabalho

1. O teste do critério 15 primeiro: hoje o foco vai ao título.
2. `focusWhenRendered`; o comentário cita #32-4.
3. `tokens.css` e o caso de `layout.test.ts`.

### Como se prova

Critérios 15 e 16; a QA entra com Enter e olha o título centrado sem contorno, a 1280 e 390 px;
o foco vai à caixa, que agora é a do Início centrado, com o texto de espera do critério 27.

### Parar se

- O Chrome desenha o contorno do título mesmo com a regra nova (estilo do navegador, não o nosso):
  relatar a captura; não esconder o foco.

## U5 A aba Código legível

**Base e modelo.** `main` com a U4. Sonnet: uma biblioteca nova pelo jeito que ela documenta, um
mapa de cores e duas correções de classe, numa pasta só; o estudo já rodou o protótipo.

### As linhas da tabela

**Cor do código**, **Cores nos dois temas**, **Carregar só ao abrir um arquivo**, **Teto de tamanho
do realce**, **Árvore fechada, menos o caminho do arquivo**, **Seta que segue o estado**, **Ícone de
pasta aberta e fechada**, **Ícone de arquivo**, **Caixa do código, cabeçalho e números de linha**, **Números de linha**, **Nome do arquivo em
cima do código**, **Árvore com rolagem própria no computador**, **Celular**, **A lista do celular
rola**, **O botão de fechar do `Sheet` dos arquivos**, **A seleção sob o ponteiro**. Os arquivos de
hoje: `builder/source/source.tsx` (`FileText` :16-30, `Files` com o `Sheet` :32-72, `Source`
:78-98), `builder/source/file-tree.tsx` (`treeOf` :13-30, `firstShown` :39-47, `Nodes` :52-84,
`walk` :87-101, `FileTree` :103-118), `ui/collapsible.tsx` (shadcn base-nova sobre
`@base-ui/react@1.9.0`), `ui/sheet.tsx`; a rota em
`routes/_app/companies/$companyId/projects/$projectId.tsx:28`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/source/highlight.ts` | Cria: o realçador preguiçoso e as classes das cores | `source.tsx` |
| `apps/web/src/builder/source/source.tsx` | Muda: o cabeçalho do arquivo, os números de linha, o teto, o realce, a rolagem da árvore, o ícone de **Arquivos** | a rota do Projeto |
| `apps/web/src/builder/source/file-tree.tsx` | Muda: `group` no gatilho, `defaultOpen` dos ancestrais, os ícones, o hover da escolhida | `source.tsx` |
| `apps/web/src/ui/sheet.tsx` | Muda: o rótulo de fechar vem de quem abre; "Fechar navegação" fica o padrão | `source.tsx`, a navegação do celular |
| `apps/web/src/ui/code-block.tsx` | Cria: o `code-block` do shadcn base-nova, copiado e pintado com os tokens | `source.tsx` |
| `apps/web/src/brand/tokens.css` | Muda: 7 `--color-code-*` por tema | toda a web |
| `apps/web/package.json`, `package-lock.json` | Muda: `shiki@4.5.0` | — |
| `docs/reference/stack.md` | Muda: a linha do `shiki` (o `check-docs` recusa uma dependência sem linha) | — |
| testes: `source.test.tsx`, `workbench.layout.test.ts`, `phone.layout.test.ts`, `sweep.test.ts` (mudam) | | |

### Os contratos que a unidade cria

```ts
// builder/source/highlight.ts
/** Um trecho de uma linha, já com a classe da marca; nunca `style`, nunca HTML. */
export type Token = { text: string; className: string }
/** As linhas pintadas, ou `null` quando o arquivo fica em texto simples (sem gramática, acima do teto, ou a gramática falhou). */
export function highlighted(path: string, text: string): Promise<Token[][] | null>
```

- Um `createHighlighterCore` preguiçoso, criado no primeiro arquivo, com
  `createCssVariablesTheme({ name: 'conexus' })` e `createJavaScriptRegexEngine()`, o
  padrão estrito, como a Mastra (`highlight.ts:74`) (sem wasm: a página fica com `script-src 'self'`, sem `'wasm-unsafe-eval'`). As gramáticas por
  `import()`, uma por extensão: tsx e jsx, ts, js e mjs, json, css, html, sql, md. Gramáticas
  pré-compiladas, nunca (a documentação as dá por não suportadas, `regex-engines.md:89-92`).
- `codeToTokens` devolve `token.color` como `var(--shiki-…)` e `fontStyle` como bits (itálico 1);
  `COLOURS` liga cada variável a uma classe `text-code-*`, e o itálico a `italic`. Um dono das cores:
  `brand/tokens.css` (V3); os valores do protótipo são as paletas clara e escura do GitHub.
- O teto: acima de 256 KiB, `null` sem chamar o Shiki. Um `import()` que falha rejeita
  `loadLanguage`, e o arquivo fica em texto simples, sem frase (C50: nenhuma falha sai da página).
- `FileText` mostra o texto simples primeiro e pinta num `useEffect` quando `highlighted` volta,
  como o OS (`code-surfaces.tsx:10-24`) e a AI Elements (`code-block.tsx:168-181`); sem `useQuery`,
  porque W11 proíbe escrever uma chave de consulta.
- A caixa do código é o `CodeBlock` de `ui/code-block.tsx`: `CodeBlockHeader` com `CodeBlockTitle`
  (o caminho), `CodeBlockContent lineNumbers` e um `CodeBlockLine` por linha, com os `span` do
  realce dentro. O contador `counter(line) / ''` tira os números da seleção e do leitor de tela
  (critério 21); o texto simples usa a mesma caixa.
- `file-tree.tsx`: `group` no `CollapsibleTrigger`, a seta e o ícone de pasta por
  `group-data-panel-open:` (o exemplo do Base UI); `defaultOpen` quando a pasta é ancestral do
  arquivo escolhido. `KIT` fica só em `firstShown`, para que o primeiro arquivo mostrado nunca seja
  do kit. O ícone de arquivo é um `FileIcon` do lucide; os ícones em `text-text-2`.
- `Sheet`: `SheetContent` ganha `closeLabel`, e `source.tsx` passa "Fechar arquivos"; o invólucro da
  árvore dentro dele é `min-h-0 overflow-y-auto`.
- Apaga: `group/folder` e `group-data-open/folder` (`file-tree.tsx:67, 71`), o próprio defeito; a
  regra de abrir tudo menos `KIT` em `Nodes`; o `<pre>` cru sobre `bg-surface-3`
  (`source.tsx:23-28`); o `hover:bg-surface-3` que cobre a escolhida.

### As skills e a leitura

O guia de design (V3, V5, V18, V30, V31). As linhas de `docs/reference/stack.md` para
`apps/web/src/builder`, `apps/web/src/brand` e `apps/web/src/ui` (a skill `shadcn`, para o
`code-block` do base-nova), e a nova do `shiki`: "Read first" `shiki.style/guide/regex-engines` e
`shiki.style/guide/best-performance`; skill nenhuma; a armadilha: "o motor JavaScript, nunca o wasm padrão; `codeToTokens` para classes, nunca
`codeToHtml`". O CI lista a dependência nova (entrega L16).

### A ordem do trabalho

1. Apagar antes: o `group/folder`, a regra de abertura e o caso `source.test.tsx:116`, reescrito
   para o critério 17, que falha hoje.
2. `file-tree.tsx`: `defaultOpen` dos ancestrais, a seta e os ícones; o caso do critério 18 em
   `workbench.layout.test.ts`, que hoje lê `rotate: 90deg` numa pasta fechada.
3. `ui/code-block.tsx`, copiado do registro base-nova com a data e a versão do `shadcn` no
   comentário, como `ui/attachment.tsx:5`; o caso do critério 21 em `workbench.layout.test.ts`, que
   falha com o contador sem `/ ""`.
4. `tokens.css` e `highlight.ts`, com a linha do `stack.md`; `source.tsx`: o `CodeBlock`, o realce,
   o teto; o caso do critério 25 em `vite.config.test.ts`. Regras: V3, C73, W11, W22.
5. `ui/sheet.tsx` e a rolagem da lista; os casos de `phone.layout.test.ts` e `sweep.test.ts`.

### Como se prova

Critérios 17 a 25. O 18, o 19, o 22 e o 23 no navegador, pelos testes de layout, que servem a web
sob a política de segurança dos apps, mais estrita que a do Hub; o 25 pelos tamanhos do build. A QA
abre a aba a 1366 e 390 px, nos dois temas, e lê o console.

### Parar se

- O motor JavaScript recusa uma gramática que o estudo listou: relatar a gramática; ela fica em
  texto simples, sem trocar de motor.
- Desenhar ~7.000 linhas pintadas num arquivo de 256 KiB trava a página no teste de layout (o
  estudo mediu só o tempo do Shiki, não o do desenho): relatar o tempo; o teto volta ao cartão.
