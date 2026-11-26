# Etapa R2: a casca nova

Trilho: desenho

A etapa da casca da [trilha Redesenho](trilhas/redesenho.md): a navegação do pedido e do objeto, que o
fundador escolheu em 2026-11-26 (decisão 1 do estudo do redesenho). O estudo desta etapa fica fora do
repositório (delivery L21), na pasta `redesenho-r2-cartao`; a sua tabela de referência está abaixo, com a
unidade de cada linha. O código foi lido na ponta do segundo grupo da R1, `feat/redesenho-r1-g2` em
`6067d718` (ainda fora de `main`): `@base-ui/react` 1.9.0, `@tanstack/react-router` 1.170.44,
`@tanstack/router-plugin` 1.168.46, `tailwindcss` 4.3.3. Referências, nos mesmos commits do cartão da R1:
Mastra (`mastra@252efe1`), shadcn base (`ui@0e5b2e6`), Supabase (`supabase@3089aa3`), Dify
(`dify@fce5d30`). A vaga do trilho `desenho` está ocupada, e o cartão da
[R1](redesenho-r1-a-base-visual-e-o-movimento.md) é o da trilha: este cartão espera num pull request de
rascunho até a vez dele (delivery L5), e a trilha ainda põe a R3 e o teste com cinco pessoas antes dele
(decisão E).

## A página do fundador

**No fim desta etapa** você acha qualquer área do Hub pelo nome, entra num projeto e vê as seções dele,
volta com um clique, e chega em qualquer página pelo Ctrl+K. A coluna de conversas, que hoje aparece ao
lado de quase toda área, some: a barra é uma só.

**O roteiro de uso.** No Hub da nuvem, sem terminal.

1. Abra o Hub. A barra tem o nome de cada lugar: Início; **Dados e contexto** (Integrações, Dados);
   **Agentes** (Agentes, Automações); **Apps** (Projetos); no pé, Notificações, Configurações e a sua
   conta. Clique em Dados: as camadas Negócio, Bruto e Apps são abas no alto da página, e não há
   coluna ao lado.
2. Recolha a barra pelo botão do alto (ou Ctrl+B): ficam só os ícones. Passe o mouse, e depois o Tab,
   por eles: cada um diz o nome. Recarregue a página: a barra continua recolhida.
3. Abra Projetos e entre num projeto. A barra troca pela dele: "← Todos os projetos", o nome do projeto
   e as seções (Construir; Conversas, Agentes, Automações; Integrações, Dados; Quem usa o app, Sobre).
   Abra Agentes e um agente; volte com "← Todos os projetos": você cai na lista, com "Projetos"
   marcado na barra.
4. Aperte Ctrl+K em qualquer tela, digite "integ" e Enter: abre Integrações. Aperte de novo e digite um
   pedaço do título de uma conversa: ela aparece em "Conversas recentes". Esc fecha e devolve o foco
   para onde estava.
5. No Início, em "Continuar", clique em "Ver todas as conversas": é a lista por dia, com a busca e o
   filtro, que antes ficava na coluna. Abra Configurações: a barra troca pelo índice, com "← Voltar".
6. No celular, o botão do alto abre a gaveta com a mesma barra (a do Hub, a do projeto ou o índice), e
   "Buscar ou ir para…" abre a busca. Se você tem duas empresas, o nome da empresa no alto da barra
   abre a troca.

**O que você faz, e quando.** Antes: nada a fornecer. No começo: responde as cinco decisões abaixo e
aprova esta página; o pull request de método da decisão D entra em `main` antes da primeira unidade.
No fim: faz o roteiro, diz o que viu e aprova os textos ("Buscar ou ir para…", "Ver todas as conversas",
"← Todos os projetos", "Nada encontrado.", "Recolher a barra lateral").

**A visão.** "Na tela elas se chamam Dados e contexto, Agentes e Apps": são os três títulos da barra.
"Cada pessoa vê o que usa" e "Uma ação fora do papel fica à vista, desligada, e diz quem pode": uma área
que o papel não usa não aparece na barra nem na busca; a regra tem um dono só. "Tudo que nasce numa
conversa ganha uma linha numa lista, com estado e dono, e se abre sem reler a conversa": a lista de
conversas ganha a página dela. "Cada capacidade do Conexus tem uma lógica só, que serve toda conversa e
toda tela": a barra, a gaveta e a busca leem a mesma lista de lugares.

**Fica de fora.**

- **A barra própria do agente** (Visão geral, Instruções, Ferramentas e dados, Testar, Execuções,
  Publicar): essas páginas não existem. Hoje o agente mora dentro de um projeto e a página dele é uma
  só, com duas abas. Vai com a R5 (decisão A).
- **Conhecimento na barra.** O mapa de 2026-11-17 decidiu o lugar, mostrando o que hoje é "Memória da
  empresa" nas Configurações. Mudar essa tela de endereço mexe no contrato de páginas
  (`packages/hub-api/src/pages.ts`), que é das outras trilhas. Quando a tela existir, entrar na barra é
  uma linha de dados.
- **As sugestões, o bloco de estado em números e o checklist de primeiro valor no Início.** O Início de
  hoje já é a caixa do pedido com Continuar, Projetos e Ligações. O redesenho dele usa as peças da R3
  e vai com a etapa do Início (R6).
- **A caixa de Avisos única** para agentes, automações e projetos: decisão sua ainda aberta, da R6.
  Aqui o sino de hoje só muda de lugar: vira a linha "Notificações" no pé da barra.
- **Achar pela busca uma conversa antiga**, fora das 30 mais recentes: a página Conversas tem a busca
  completa.
- **Os nomes repetidos** entre o Hub e o projeto (Agentes, Automações, Integrações e Dados nos dois): as
  oito seções do projeto são as que você aprovou em 2026-10-30; mudar é da etapa de Projetos (R6).
- **Levar o foco do teclado ao lugar atual quando a barra troca.** Nenhum produto de referência faz, e o
  Hub de hoje não faz em nenhuma troca de tela. Aqui o navegador segue o Tab de onde o link estava, no
  alto da barra (critério 11). Código nosso para isso seria uma decisão sua à parte (delivery L28).
- **O terceiro grupo "Dados" nas Configurações** e a barra que cada pessoa arruma: sem cartão.

**As decisões suas nesta etapa.**

- **A. Os agentes na casca.** O protótipo das jornadas deixou aberto se o agente mora na barra ou numa
  galeria, e o protótipo de navegação desenhou uma barra só do agente.
  - **A-a (recomendada).** "Agentes" é um lugar da barra e abre a lista. Abrir um agente continua dentro
    do projeto dele: a barra é a do projeto, com "Agentes" marcado. A barra do agente nasce na R5, com as
    páginas dela. Exemplo: você abre o Agente de Compras e vê "← Todos os projetos", "Pedidos de
    encomenda" e as seções do projeto. Por quê: nos produtos de dados com agentes vistos (Databricks,
    WRITER, Mistral, Customer.io), o agente é um lugar da barra, não uma linha por agente; e uma barra
    de agente com seis seções que não existem seria um "em breve". Nativo: uma linha na lista de
    lugares.
  - **A-b.** Cada agente é uma linha da barra, com avatar e estado, como nos Galts do G4 OS e na
    Langdock. Custa: a barra cresce sem limite e passa a ler os agentes em toda tela. Nativo, mas outra
    navegação que a escolhida.
  - **A-c.** A barra do agente já agora, com as duas partes que a página tem (Configuração, Conversas).
    Custa: mexe na página do agente antes de a R5 a redesenhar.
- **B. Os títulos dos grupos.**
  - **B-a (recomendada).** Três, com os nomes da visão: "Dados e contexto", "Agentes", "Apps". Uma
    empresa sem Apps simplesmente não vê o grupo. Nativo: dados.
  - **B-b.** Dois, como no protótipo de navegação que você viu: "Dados e contexto" e "Agentes e apps". Um título a
    menos; perde a correspondência com as três Solutions.
- **C. Onde mora a lista inteira de conversas**, que sai da coluna.
  - **C-a (recomendada).** Uma página "Conversas", aberta por "Ver todas as conversas" no Início e pela
    busca do Ctrl+K, como a página Chats do Claude. O Início continua curto. Nativo: a mesma lista de
    hoje, desenhada na folha.
  - **C-b.** A lista inteira dentro do Início, embaixo da caixa. Sem página nova; o Início fica longo e
    os blocos Projetos e Ligações descem.
  - **C-c.** As três conversas mais recentes na barra, sob Início, com "Ver todas", como o Dropbox Dash.
    Volta a pôr conversa na barra, que a navegação escolhida tirou.
- **D. As regras dos guias.** A casca nova contraria o que os guias dizem hoje.
  - **D-a (recomendada).** Um pull request de método, só de documentos, depois desta aprovação e antes
    da primeira unidade (delivery L20), como o #1428 da R1. Ele reescreve: web W30 (trilho de ícones e
    coluna do lugar viram a barra com grupos; as conversas saem da coluna; as camadas de Dados vão
    para a página); web W31 (a barra do projeto ganha "← Todos os projetos"); design V56 (a gaveta leva
    a barra); design V34 (o ícone de 20 px era do trilho); o mapa, seções 3, 4, 5.3 e 7; a árvore de
    web W1; e acrescenta uma regra: a navegação é declarada em dados num arquivo só, e a barra, a
    gaveta e a busca leem dele.
  - **D-b.** Mudar os guias no fechamento da etapa. A etapa seria construída e revista contra regras que
    dizem o contrário.
- **E. A vez da R2 na trilha.**
  - **E-a (recomendada).** Como a trilha diz: R1, R3, o teste com cinco pessoas, e então a R2. Este
    cartão espera pronto e é emendado pelo que o teste mostrar. É o processo que você aprovou (decisão 4).
  - **E-b.** A R2 logo depois da R1. Ela não usa nenhuma peça da R3, e o teste passa a usar a casca de
    verdade. Custa: construir a navegação antes de cinco pessoas a provarem.

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 As listas saem da coluna | a página Conversas e "Ver todas as conversas"; as camadas de Dados em abas; a coluna deixa de mostrar conversas e árvore | `apps/web/src/agents/assistant/`, `apps/web/src/hub/copies/`, `apps/web/src/routes/_app/companies/$companyId/`, `docs/reference/screens.md` | web | a R1 em `main`; o pull request de método da decisão D em `main`; nenhuma unidade aberta das outras trilhas nesses arquivos (delivery L1) |
| G1 | U2 A barra com grupos e a barra do objeto | a navegação em dados; a barra de 240 px com grupos, o botão de recolher e a escolha guardada; a barra do projeto com "← Todos os projetos"; Configurações e Central na moldura nova | `apps/web/src/ui/`, `apps/web/src/routes/_app/`, `apps/web/src/hub/projects/`, `apps/web/src/hub/identity/`, `apps/web/src/platform/`, `apps/web/src/brand/`, `DESIGN.md` | design | U1 |
| G2 | U3 A paleta de comando | Ctrl+K sobre o Base UI, com as páginas saídas da navegação, as conversas e os projetos recentes; o gatilho na barra | `apps/web/src/ui/`, `apps/web/src/routes/_app/`, `DESIGN.md` | design | U2 |
| G2 | U4 A gaveta e a troca de empresa | a gaveta do celular com a barra do lugar e a busca; a troca de empresa pela peça `Picker` | `apps/web/src/ui/`, `apps/web/src/hub/identity/`, `apps/web/src/hub/operations/` | design | U3 |

Dois pull requests (delivery L9): G1 e G2.

**Orçamento de código alterado.** U1: 450 linhas. U2: 950. U3: 500. U4: 300. Total da etapa: cerca de
2.200, abaixo do teto de 4.000 (delivery L2).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `/companies/<e>/conversations` mostra as conversas da pessoa por dia, 30 por página com o paginador, a busca pelo título, o filtro por lugar e a aba Projetos, tudo no endereço (`q`, `place`, `tab`, `conversations`); recusa: um `place` que não é um lugar abre a lista inteira | `apps/web/src/agents/assistant/conversations-page.test.tsx`, "a lista por dia, a busca e o filtro no endereço" e "um lugar inválido abre a lista inteira" | must |
| 2 | U1 | No Início, "Continuar" tem "Ver todas as conversas", que abre a página; sem nenhuma conversa a frase de hoje fica e o link não aparece | `apps/web/src/agents/assistant/day.test.tsx`, "Continuar leva à lista inteira" | must |
| 3 | U1 | Dados mostra Negócio, Bruto e Apps como abas com a contagem; a camada segue no endereço (`layer`); recusa: nenhuma coluna de Dados ao lado da barra | `apps/web/src/hub/copies/data-page.test.tsx`, "as camadas são abas e a camada fica no endereço" | must |
| 4 | U2 | A barra do Hub mostra, com nome, na ordem: Início; Dados e contexto (Integrações, Dados); Agentes (Agentes, Automações); Apps (Projetos); no pé Notificações, Configurações e a conta. Nenhuma lista de conversas em Integrações, Agentes, Automações, Projetos ou Dados | `apps/web/src/routes/_app/companies/$companyId/route.test.tsx`, "a barra com grupos" e "nenhuma área lista conversas na barra" | must |
| 5 | U2, U3 | Quem não gerencia agentes nem automações não vê "Agentes" nem "Automações" na barra nem na paleta, e o grupo sem item não mostra o título; recusa: o endereço `/agents` segue respondendo não encontrado (S10) | `route.test.tsx`, "o membro não vê Agentes nem Automações"; `apps/web/src/routes/_app/-navigation.test.ts`, "um grupo vazio some com o título"; `-destinations.test.tsx`, "o membro não acha o que não vê" | must |
| 6 | U2 | Cada destino das três listas (`HUB_NAV`, `PROJECT_NAV`, `CENTRAL_NAV`) é um endereço que o roteador conhece, e nenhum nome se repete na mesma barra; recusa: um endereço que não existe deixa o teste vermelho dizendo qual | `-navigation.test.ts`, "cada destino existe no roteador" | must |
| 7 | U2 | A partir de 768 px a barra tem 240 px aberta e 56 px recolhida; o botão "Recolher a barra lateral" está no Tab e Ctrl+B faz o mesmo; a largura troca de uma vez (o critério 3 da R1 segue verde) | `apps/web/shell.layout.test.ts`, "a barra aberta e recolhida"; `motion.layout.test.ts`, "nada estica" (existente) | must |
| 8 | U2 | Recolhida, cada ícone tem nome acessível e mostra a dica no mouse e no foco do teclado, na barra do Hub, na do projeto e no índice das Configurações; o item atual tem `aria-current="page"` | `shell.layout.test.ts`, "recolhida, cada ícone diz o nome pelo teclado" | must |
| 9 | U2 | A escolha de recolher volta depois de recarregar; com o armazenamento do navegador bloqueado a barra recolhe e abre do mesmo jeito, só não lembra; entre 768 e 1023 px, sem escolha guardada, abre recolhida | `shell.layout.test.ts`, "a escolha volta depois de recarregar" e "sem armazenamento a barra funciona" | should |
| 10 | U2 | Dentro de um projeto a barra é a dele: "← Todos os projetos", o nome com o seletor de projeto, e as oito seções de hoje nos quatro grupos, cada uma só para quem pode; a página de um agente mantém "Agentes" marcado | `route.test.tsx`, "a barra do projeto" e "o agente aberto marca Agentes" | must |
| 11 | U2 | Só pelo teclado: depois de Enter em "← Todos os projetos", o Tab seguinte cai num controle da barra do Hub, e "Projetos" tem `aria-current="page"`; recusa: o Tab não recomeça no corpo da folha nem fica preso fora da tela | `apps/web/keyboard.test.ts`, "depois de voltar, o Tab segue na barra" | should |
| 12 | U2 | Configurações e Central usam a mesma moldura: a linha do alto com "← Voltar" (Configurações) ou o nome (Central), o botão de recolher, e os mesmos estados; o índice, a busca e os grupos das Configurações ficam como hoje | `apps/web/src/routes/_app/companies/$companyId_/settings/settings.test.tsx` (existente) e `shell.layout.test.ts`, "a mesma linha do alto em toda barra" | must |
| 13 | U2 | O texto e o ícone do item atual passam 3:1 sobre o fundo dele, e o título de grupo passa 4,5:1 sobre a moldura, nos dois temas | `apps/web/contrast.layout.test.ts`, os pares novos | must |
| 14 | U3 | Ctrl+K e ⌘K abrem a paleta em qualquer tela com sessão (empresa, projeto, Configurações, Central), também com o foco num campo de texto; Esc fecha e o foco volta ao elemento de antes; recusa: na entrada e na primeira entrada a tecla não abre nada | `apps/web/palette.layout.test.ts`, "abre de qualquer tela e devolve o foco" e "sem moldura não abre" | must |
| 15 | U3 | Digitar "integ" deixa Integrações em primeiro e destacada, Enter navega e fecha, as setas mudam o destaque; "configuracoes", sem acento, acha Configurações; sem resultado diz "Nada encontrado."; cada página diz o grupo dela | `palette.layout.test.ts`, "achar, escolher e não achar" | must |
| 16 | U3 | A paleta lista, nesta ordem: Conversas recentes (as 30 da primeira página), Ir para (as páginas da barra do lugar, as do Hub, as seções das Configurações que a pessoa vê, Central para quem opera) e Projetos; dentro de um projeto, as seções dele levam o nome do projeto. Se a leitura das conversas ou dos projetos falha, o grupo some e o resto funciona | `apps/web/src/routes/_app/-destinations.test.tsx`, "os grupos e a ordem" e "uma leitura que falha não derruba a paleta" | must |
| 17 | U3 | A paleta é um diálogo com nome, a lista é uma `listbox`, o Tab não sai dela, não há violação de CSP, a 390 px não há rolagem lateral e as dicas de tecla somem no toque; sob reduzir movimento ela aparece sem animar | `palette.layout.test.ts`, "o diálogo e o celular"; `motion.layout.test.ts`, "com reduzir, nada anima" (caso acrescentado) | must |
| 18 | U4 | A 390 e a 320 px a gaveta traz a barra do lugar inteira (Hub, projeto ou índice das Configurações) com a conta; seguir um link fecha a gaveta; "Buscar ou ir para…" fecha a gaveta e abre a paleta; sem rolagem lateral | `apps/web/phone-menu.layout.test.ts`, "a gaveta leva a barra do lugar" e "a busca sai da gaveta"; `phone.layout.test.ts` (existente) | must |
| 19 | U4 | Com uma empresa, o alto da barra mostra só o nome; com duas ou mais, abre a lista "Suas empresas"; a partir de sete, com busca; escolher leva ao Início da outra; o nome acessível diz "Trocar de empresa. Agora: <nome>" | `apps/web/src/hub/identity/company-switcher.test.tsx`, "uma, duas e sete empresas" | must |
| 20 | todas | Cada peça nova (`nav`, `command-palette`, `kbd`) tem entrada na vitrine; a vitrine abre sem violação de CSP nos dois temas a 1366 e 390 px; o foco é visível em toda peça | `apps/web/showcase.layout.test.ts`, `pieces.layout.test.ts`, `focus.layout.test.ts` (existentes) | must |
| 21 | todas | A catraca do lint de design não sobe (303 na ponta da R1) | `npm run lint:design -w @conexus/web` | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A barra do Hub | aberta a partir de 1024 px, recolhida entre 768 e 1023 | um grupo sem item não aparece | a barra desenha na hora; o nome da empresa é um esqueleto | a barra fica; o erro é da folha (W34) | · | Agentes e Automações somem para quem não gerencia; o endereço responde não encontrado | sessão vencida: a entrada, como hoje (W15) |
| A barra do projeto | "Construir" marcado | · | o nome do projeto é um esqueleto | o nome vira "Projeto" e as seções seguem (como hoje) | a folha diz não encontrado; a barra do Hub volta | cada seção só para quem pode (`manageAgents`, `manageAutomations`, `viewAppData`) | · |
| A paleta | Conversas recentes vazia: o grupo não aparece; "Ir para" primeiro | "Nada encontrado." | os grupos lidos entram quando chegam; "Ir para" já está | o grupo que falhou some | · | o que a barra não mostra a paleta não acha | · |
| Conversas | sem conversa: a frase de hoje e "Nova conversa" | busca ou filtro sem resultado: as frases de hoje | três linhas de esqueleto | a frase da leitura e "Tentar de novo" | · | todo papel vê as suas | · |
| Dados (as abas) | a aba Bruto | as frases de hoje por camada | a contagem entra quando a leitura chega | a aba fica; o erro é da camada | · | o que cada papel vê hoje, sem mudança | · |
| A gaveta (celular) | fechada | · | · | · | · | igual à barra | · |
| A troca de empresa | uma empresa: só o nome | · | esqueleto no nome | a lista some; o nome fica | · | só as empresas que o Hub lista | · |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `NavSection[]` (`HUB_NAV`, `PROJECT_NAV`, `CENTRAL_NAV`) | U2, em `routes/_app/-navigation.ts` | a barra (`SidebarNav`), a gaveta, a paleta (`useHubDestinations`), `-navigation.test.ts` |
| `NavItem.needs` | U2 | `seen()`, o único filtro de permissão da barra e da paleta |
| `NavItem.places` | U2 | `SidebarNav`, para marcar o lugar num endereço mais fundo; lê `staticData.place` da rota |
| a escolha `conexus-sidebar` no navegador | `Frame`, por `platform/sidebar.ts` | `Frame`, ao montar |
| `PaletteGroup[]` | U3, em `routes/_app/-destinations.tsx` | `ui/command-palette.tsx` |

Os desenhos de caixas. A 1280 px, a barra do Hub e a do projeto:

```text
+--------------------------+------------------------------------------------+
| [C] Conexus         [<<] |                                                |
| [ Buscar ou ir para… ⌃K ]|   a folha, encaixada na moldura grafite        |
| [P] Padaria Sol       v  |                                                |
|  Início                  |   Dados                                        |
| Dados e contexto         |   [ Negócio 0 ][ Bruto 12 ][ Apps 3 ]          |
|  Integrações             |   ...                                          |
|  Dados              <--  |                                                |
| Agentes                  |                                                |
|  Agentes                 |                                                |
|  Automações              |                                                |
| Apps                     |                                                |
|  Projetos                |                                                |
|                          |                                                |
|  Notificações        (2) |                                                |
|  Configurações           |                                                |
|  (MS) Marina Souza    v  |                                                |
+--------------------------+------------------------------------------------+

+--------------------------+     recolhida        a 390 px
| <- Todos os projetos [<<]|     +----+          +---------------------+
| [ Buscar ou ir para… ⌃K ]|     |[>>]|          | [=] Conexus   Dados |
| [P] Pedidos de enc.   v  |     | Q  |          +---------------------+
| O app                    |     | o  |          |   a folha           |
|  Construir          <--  |     | -- |          |                     |
| Agentes                  |     | o  |          +---------------------+
|  Conversas               |     | o  |          a gaveta: a mesma barra
|  Agentes                 |     | -- |          do lugar, de cima a
|  Automações              |     | o  |          baixo, com a busca e a
| Dados                    |     | o  |          conta
|  Integrações             |     | -- |
|  Dados                   |     | o  |
| O Projeto                |     |    |
|  Quem usa o app          |     | o  |
|  Sobre                   |     | o  |
|  ...o mesmo pé           |     |(MS)|
+--------------------------+     +----+
```

A paleta, a 1280 px, centrada no alto da folha, com 36 rem de largura no máximo; a 390 px ocupa a
largura menos 8 px de cada lado:

```text
+----------------------------------------------+
| Q  Buscar ou ir para…                        |
+----------------------------------------------+
| Conversas recentes                           |
|   Quanto vendemos de pão francês?     há 2 h |
| Ir para                                      |
| > Integrações            Dados e contexto    |
|   Dados                  Dados e contexto    |
|   Pessoas e convites     Configurações       |
| Projetos                                     |
|   Pedidos de encomenda                       |
+----------------------------------------------+
| ↑↓ escolher   Enter abrir   Esc fechar       |
+----------------------------------------------+
```

As capturas que a etapa segue ficam fora do repositório, com o estudo: as 32 capturas `n4-*` do
protótipo de navegação (Início, Dados aberta e recolhida, projeto, Configurações, paleta vazia e
filtrada, as três gavetas a 390 px) e o Hub de hoje. As telas do Mobbin que apoiam cada peça, da coleção
"Conexus redesenho" e de quatro buscas novas (visto, 2026-11-26):

| Peça | Telas |
| --- | --- |
| Barra com grupos titulados | [Databricks](https://mobbin.com/screens/c02170fd-f44b-42c0-8fd2-59a04b9ad0b0), [WRITER](https://mobbin.com/screens/12b0cb54-3641-4133-9d7c-d96f6d68aa58), [Vercel](https://mobbin.com/screens/8e385d03-bd42-4376-b1de-62263908900a), [Customer.io](https://mobbin.com/screens/0ca9f73c-0002-4c69-a0b4-83666a66add5), [Whop](https://mobbin.com/screens/c7a429c8-a0cd-4460-b9ca-1a5e265f83b9) (barra escura), [Dropbox Dash](https://mobbin.com/screens/3695f322-3bac-43a3-8e96-e589434c3031) (barra escura, "Search ⌘K" no alto) |
| Recolhida em ícones | [n8n](https://mobbin.com/screens/f248416d-fdae-4cb5-918f-50709158cf82), [Airtable](https://mobbin.com/screens/e110986b-0ea3-46f0-bc68-68cdbdf7f1ea) |
| A barra do objeto, com a volta no alto | [Intercom, "← Customize"](https://mobbin.com/screens/67498dfd-0079-4b66-9cd4-2ce6d41fc87a), [Intercom Fin](https://mobbin.com/screens/16c18036-56a1-4ea3-9bba-561c7da42cdc), [Cursor, "Back to Agents"](https://mobbin.com/screens/cf9a5441-7462-4d39-af22-5d52cec1a0ed), [Lovable](https://mobbin.com/screens/f89924d9-2ea2-4c9e-98dc-05001f4d4bd5), [GitLab](https://mobbin.com/screens/3a76a592-1c75-44ec-867c-72aefcec845d) |
| Paleta de comando | [Vapi](https://mobbin.com/screens/593d7acd-2e16-4365-bcd6-02ce52f48f3b) (cada página com a área), [Mistral](https://mobbin.com/screens/8450c1c7-7c10-40a3-9af3-c9c234ac4b53), [Base44](https://mobbin.com/screens/675ecfd2-b7fc-4e8d-9078-3eeeaddda7c7) (objetos e páginas), [incident.io](https://mobbin.com/screens/907900ee-1dca-4726-ae50-9e043eecfbe4), [n8n](https://mobbin.com/screens/28338d7a-25d5-4fd0-8357-9a770b30ac00), [Mintlify](https://mobbin.com/screens/7c7ad31f-9dfe-4be7-83d7-6002fe31d4d0) |
| Troca de empresa | [Vercel, "Find Team…"](https://mobbin.com/screens/7be05ea5-e875-439d-bd1f-7aef97281d3b), [Postman](https://mobbin.com/screens/1ecfc49b-a8f1-49dc-9d10-da70f8d9315f), [Air](https://mobbin.com/screens/fa59dedd-7f78-48a1-b5bc-a628f154af8e) |
| A conversa como lugar | [Claude](https://mobbin.com/screens/ef4dc71f-9d6e-4b35-89d7-26c2393c58c0), [ChatGPT](https://mobbin.com/screens/efb593c5-be61-47d5-a2bd-87aab6056cd2), [Langdock](https://mobbin.com/screens/fe015a4f-7142-45d9-a899-4a724d011d0e) |

A crítica da forma (Impeccable `critique`, por um leitor de outro modelo, só sobre as capturas) deu
22 de 40 ao protótipo de navegação e cinco achados; cada um virou critério: a volta leva ao pai imediato e o
projeto mostra as seções reais (10); a troca de empresa, a conta e o sino continuam na barra (4, 19); a
mesma linha do alto em toda barra, e a barra do objeto também recolhe (8, 12); a paleta acha conversas,
projetos e seções das Configurações, e esconde as teclas no toque (16, 17); um filtro só de permissão
(5). O detector não achou nada na página do protótipo, mas ela é montada por script e ele leu só o
arquivo; a conferência no navegador é do ponto de conferência de cada grupo.

As peças de `ui/` que a etapa usa: `sidebar`, `sidebar-selector`, `sidebar-trigger`, `frame`,
`tooltip`, `dialog`, `tabs`, `picker`, `pager`, `skeleton`, `settings-index`. Sai:
`sidebar-rail-button`. Novas, cada uma com a sua linha da tabela de referência, a entrada na vitrine e
a linha do `DESIGN.md` (V62): `nav` (linhas 1 e 2), `command-palette` (linha 10), `kbd` (linha 13).

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| guardar a escolha de recolher no navegador (`localStorage`, chave `conexus-sidebar`) | duas abas: vale a última; cada aba segue com a sua até recarregar | o navegador recusa gravar (modo privado, cota): a barra recolhe e abre, só não lembra | nenhuma: não chama o Hub | nada | 9 |

A etapa não acrescenta gravação no Hub: a paleta e a barra só leem.

## A tabela de referência

Siglas: MA Mastra, `packages/playground/src` e MA-ui `packages/playground-ui/src`; SH shadcn base,
`apps/v4/registry/bases/base`; SB Supabase, `apps/studio/components/layouts`; BU Base UI 1.9.0,
`node_modules/@base-ui/react/docs/react/components`. "Hoje" é `feat/redesenho-r1-g2` em `6067d718`, com
os caminhos a partir de `apps/web/src`. "A navegação" é a do pedido e do objeto, que o fundador escolheu em 2026-11-26.

| # | Peça | Unidade | O que o fundador já decidiu | Hoje | Referência | Como a referência faz | Veredito | Prova | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A navegação em dados | U2 | a navegação; "Cada capacidade ... uma lógica só" | `routes/_app/companies/$companyId/route.tsx:44-96` (`RailPlaces`, à mão); `hub/projects/project-rail.tsx:73-145` (`RAIL`); `routes/_app/operations/route.tsx:19-26` | MA `lib/nav/nav-items.tsx:24-39` e `components/ui/app-sidebar.tsx:83-108,143-145` (mesma situação) | `NavSection[]` com `NavItem`; a barra filtra e desenha as seções **lido** | nativo | · | D | `routes/_app/-navigation.ts` |
| 2 | Os grupos com título | U2 | a navegação; a visão ("Na tela elas se chamam ..."); mapa 3 (2026-11-17) | `ui/sidebar.tsx:245-266` (`SidebarGroup`, `SidebarGroupLabel`, já existem) | SH `ui/sidebar.tsx:389-425`; SH `blocks/sidebar-07/components/nav-main.tsx:20-37` (mesma situação) | um grupo, o rótulo e o menu por seção **lido** | nativo | · | B | `ui/nav.tsx` |
| 3 | Recolher para ícones, com a dica | U2 | mapa 5.3, itens 3 e 4 (2026-11-17); decisão 2 (a largura troca na hora) | `ui/sidebar.tsx:144-175,304-328` | SH `ui/sidebar.tsx:152-163,212,508-560` (mesma situação) | `data-collapsible="icon"`; a dica só aparece recolhida e fora do celular **lido** | nativo | · | não precisa | · |
| 4 | O botão de recolher à vista | U2 | mapa 5.3, item 3 | `ui/sidebar.tsx:178-192` (uma borda de 12 px, fora do Tab) | SH `ui/sidebar.tsx:254-285` (`SidebarTrigger`); MA `app-sidebar.tsx:112-125` (no cabeçalho, ao lado da marca) | um botão que chama `toggleSidebar` **lido** | nativo | · | não precisa | · |
| 5 | A escolha guardada | U2 | mapa 5.3, item 4: "fica guardada no navegador" | `ui/frame.tsx:131-133,152` (só `useState`) | SH `ui/sidebar.tsx:28-29,86` (cookie); `platform/theme.ts:16,35,52-53` (o tema, em `localStorage`) | grava ao trocar e lê ao montar **lido** | embrulhado: a nossa guarda em `localStorage`, sem cookie, como o tema | · | não precisa | `platform/sidebar.ts` |
| 6 | A largura | U2 | mapa 5.3, item 1 ("perto de 240"); a navegação | `brand/tokens.css:116,118` (56 e 328 px); `DESIGN.md:160,162` | SH `ui/sidebar.tsx:30,32` (16 e 3 rem) | troca de valor | nativo | · | não precisa | · |
| 7 | A linha do alto: a marca ou a volta, a busca, recolher | U2 | mapa 5.3, item 2 (a marca e o nome na mesma linha) | `ui/frame.tsx:155-165` (a marca no trilho) | MA `app-sidebar.tsx:112-125` (`Header` com `Brand`, `SearchTrigger`, `Trigger`) (mesma situação) | uma faixa fixa no alto de toda barra **lido** | nativo | · | não precisa | · |
| 8 | A barra do objeto (projeto) | U2 | a navegação; W31 (as oito seções, 2026-10-30) | `hub/projects/project-rail.tsx:38-71,153-183`; `route.tsx:122-143` | MA `domains/agent-builder/layouts/agent-builder-sidebar.tsx:68-99` (mesma situação: a barra troca pela do lugar, com a volta ao Studio) | a mesma peça `Sidebar` com outros links e o link de volta no alto **lido** | nativo | · | A | · |
| 9 | Configurações como lugar | U2 | W32 | `routes/_app/companies/$companyId_/settings/route.tsx:30-45,52-103` | MA (idem linha 8) | fica; muda só a moldura | nativo (fica) | · | não precisa | · |
| 10 | A paleta de comando | U3 | a navegação (Ctrl+K) | nenhum | BU `autocomplete.md:3204-3324` ("Command palette") (mesma situação); MA-ui `ds/components/CommandPalette/`, sobre `cmdk` (situação diferente: dependência que o Hub não tem) | `Dialog` com `Autocomplete.Root open inline autoHighlight="always" keepHighlight`, itens em grupos, `Autocomplete.Empty` (`:3242-3248,3266-3299`) **lido** | nativo, sem dependência nova | · | não precisa | `ui/command-palette.tsx` |
| 11 | As páginas da paleta saem da navegação | U3 | a navegação | nenhum | MA `lib/command/navigation-command.tsx:463-490,511-534` (mesma situação) | as seções da paleta são `mainNav` com o mesmo filtro da barra **lido**; lá o filtro está escrito duas vezes, aqui é um (`seen`) | nativo | · | não precisa | `routes/_app/-destinations.tsx` |
| 12 | A tecla Ctrl+K | U3 | a navegação | `ui/sidebar.tsx:56-66` (o mesmo padrão, para Ctrl+B) | MA `lib/command/use-navigation-command.ts:42-54` | um ouvinte de `keydown` em `document` com `metaKey` ou `ctrlKey` **lido** | nativo | · | não precisa | · |
| 13 | A tecla desenhada | U3 | · | nenhum | SH `ui/kbd.tsx:3-14` | um `kbd` com classe **lido** | nativo (cópia) | · | não precisa | `ui/kbd.tsx` |
| 14 | O gatilho "Buscar ou ir para…" | U3 | a navegação | nenhum | MA `app-sidebar.tsx:59-62,117-123` (mesma situação; lá some no celular, aqui fica na gaveta, como o protótipo de navegação) | um botão na barra com o atalho escrito, que abre a paleta e fecha a gaveta **lido** | nativo | · | não precisa | · |
| 15 | A lista de conversas numa página | U1 | a navegação; mapa 4 (conversas só no Início) | `agents/assistant/sidebar-conversations.tsx:115-232`; `agents/assistant/day.tsx:23-78` | [Claude](https://mobbin.com/screens/ef4dc71f-9d6e-4b35-89d7-26c2393c58c0) (mesma situação) **visto**; o código é o de hoje | a lista como um lugar, fora da barra | nativo | · | C | `agents/assistant/conversations-page.tsx` |
| 16 | As camadas de Dados em abas | U1 | a navegação (uma barra só); o mapa 4 punha a árvore na coluna | `hub/copies/data-tree.tsx:33-58,104-113` | [Databricks](https://mobbin.com/screens/c02170fd-f44b-42c0-8fd2-59a04b9ad0b0) (a árvore é painel do catálogo) **visto**; BU `tabs.md` | três abas que mudam o `layer` do endereço | nativo | · | D | · |
| 17 | A gaveta do celular | U4 | V56 (2026-11-01); mapa 7 | `ui/sidebar.tsx:124-142`; `ui/frame.tsx:88-127` | SH `ui/sidebar.tsx:182-205` (a mesma barra dentro da `Sheet`) **lido** | no celular os filhos da barra vão para a gaveta | nativo (fica) | · | D | · |
| 18 | A troca de empresa | U4 | W30 ("Suas empresas") | `hub/identity/company-switcher.tsx:17-42`; `ui/picker.tsx:25,132` | SB `AppLayout/OrganizationDropdown.tsx:60-101` (lista com busca num popover; sobre `cmdk`: situação diferente na fundação); [Vercel](https://mobbin.com/screens/7be05ea5-e875-439d-bd1f-7aef97281d3b) **visto** | a lista com busca, aberta do nome | nativo: a peça `Picker` do Hub (Base UI Combobox, busca a partir de 7 itens) | · | não precisa | · |
| 19 | O sino e a conta no pé | U2 | W30 (2026-11-02, "Opção 1") | `route.tsx:109-120`; `hub/notifications/bell.tsx:35-43`; `hub/identity/account-menu.tsx:36-124` | SH `blocks/sidebar-07/components/nav-user.tsx` (a conta no pé) | ficam; saem as variantes do trilho (`compact`) e o sino ganha o nome à vista | nativo (fica) | · | não precisa | · |
| 20 | O teclado na troca de barra | U2 | V30 | nenhum código de foco em `ui/frame.tsx` nem nas rotas | MA `domains/agent-builder/layouts/agent-builder-sidebar.tsx:68-99` (mesma situação) | troca a barra sem código de foco **lido**; o link some com a barra e o navegador segue o Tab do ponto onde ele estava | nativo | · | não precisa | · |
| 21 | A vitrine e a CSP | todas | W22, V17, V62 | `ui/showcase/navigation.tsx`; `showcase.layout.test.ts` | · | o harness já abre a vitrine com a CSP | nativo | · | não precisa | · |
| 22 | A barra do agente | fica de fora: R5 (decisão A) | nada registrado | `agents/saved-agent/agent-page.tsx:87-94,177-181` | [Intercom Fin](https://mobbin.com/screens/16c18036-56a1-4ea3-9bba-561c7da42cdc) **visto** | · | nativo (dados), fora | · | A | · |
| 23 | Conhecimento na barra | fica de fora: sem tela; o endereço está no contrato | mapa 3.1 (2026-11-17) | `packages/hub-api/src/pages.ts:52`; `routes/.../settings/company-memory.tsx` | · | · | nativo (uma linha de dados), fora | · | · | · |
| 24 | A busca de conversas no servidor pela paleta | fica de fora | · | · | BU `autocomplete.md:414` ("Async search") | · | nativo, fora | · | · | · |

**A medida do transplante.** Nenhuma parte trazida do produto antigo. Duas peças de hoje mudam de
lugar sem mudar de dono: a lista de conversas (232 linhas, cerca de 60 mudam) e as camadas de Dados.

**A dívida.** As seções das Configurações seguem declaradas em cada rota (`staticData.section`), ao lado
do arquivo de navegação: juntar é da etapa de Configurações. A paleta acha só as 30 conversas mais
recentes. O rótulo de um lugar existe no arquivo de navegação e no `staticData.place` da rota, que o
alto do celular lê; o critério 6 confere os endereços, não os nomes.

## As decisões do firstmate

| # | Decisão reversível (delivery L6) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | A navegação num arquivo de dados em `routes/_app/-navigation.ts`, e não no `staticData` de cada rota | duas formas comparadas. Um arquivo: MA e SH fazem assim, a ordem e os grupos se leem de uma vez, e a paleta lê a mesma lista. Em cada rota: é como as Configurações fazem hoje, mas espalha a ordem por trinta arquivos. Só as rotas desenham a moldura, e um assunto não importa rota (W8); o gerador ignora arquivo que começa com `-` (`@tanstack/router-generator` 1.167.44, `config.js:23`) | mover o arquivo; os tipos ficam em `ui/nav.tsx` |
| 2 | A escolha de recolher guardada por navegador, na chave `conexus-sidebar`, como o tema (`conexus-theme`) | um dono por fato e a mesma forma do que já existe (`platform/theme.ts:16`) | trocar a chave |
| 3 | A paleta lista as 30 conversas da primeira página, sem buscar no Hub | a leitura já está em cache pelo Início; a busca completa mora na página Conversas | ligar o exemplo "Async search" do Base UI |
| 4 | A troca de barra é de uma vez; só a folha esmaece | a folha de movimento: "a barra não pisca" (`DESIGN.md:581-582`) | um `view-transition-name` na barra |
| 5 | "← Voltar" das Configurações segue levando ao Início da empresa | é o que W32 e o código fazem hoje; voltar à última tela do Hub pede guardar o lugar | um cartão das Configurações |

## U1 As listas saem da coluna

**Base e modelo.** `main` com a R1 e o pull request de método da decisão D. Sonnet: mover uma lista e
trocar uma árvore por abas, dentro de dois assuntos.

### As linhas da tabela

15 e 16. Ler `agents/assistant/sidebar-conversations.tsx` inteiro, `list-view.ts`, `day.tsx:23-78,125-150`,
`conversation-row.tsx`, `place-filter.tsx`, `projects-tab.tsx`, `text.ts`; a rota do Início
(`routes/_app/companies/$companyId/index.tsx:33-45`, o `validateSearch`); `hub/copies/data-tree.tsx`
inteiro e `data-page.tsx`; `route.tsx:132-143` (onde a coluna as desenha hoje). Seguir as telas do
Claude e do Databricks da tabela do Mobbin.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `agents/assistant/sidebar-conversations.tsx` e os seus dois testes | apaga | `agents/assistant/public.ts`, `route.tsx` |
| `agents/assistant/conversations-page.tsx` e o teste | cria | `public.ts`, a rota nova |
| `agents/assistant/day.tsx`, `text.ts`, `public.ts` | muda | o Início |
| `routes/_app/companies/$companyId/conversations/index.tsx` | cria | o roteador; `routeTree.gen.ts` (gerado) |
| `routes/_app/companies/$companyId/index.tsx` | muda: `q`, `place`, `tab` e `conversations` saem do `validateSearch` do Início | os links para o Início |
| `routes/_app/companies/$companyId/route.tsx` | muda: a coluna não recebe mais conversas nem a árvore | · |
| `hub/copies/data-tree.tsx` e o teste | apaga | `hub/copies/public.ts`, `route.tsx` |
| `hub/copies/data-page.tsx` e o teste | muda | a rota de Dados |
| `docs/reference/screens.md` | muda: a linha de Conversas no andar Empresa (W29) | · |
| `apps/web/phone-list.layout.test.ts`, `sweep-house-states.ts`, `home.layout.test.ts` | muda: a lista está na página | `test:browser`, `test:sweep` |

### Os contratos que a unidade cria

Em `agents/assistant/conversations-page.tsx`, exportado por `public.ts`:

```ts
export function ConversationsPage(props: { companyId: CompanyId }): ReactNode
export const ConversationsSearch: z.ZodType<{ conversations?: string; q?: string; place?: string; tab?: 'projects' }>
```

A rota `/_app/companies/$companyId/conversations/` tem `staticData: { place: 'Conversas' }`,
`validateSearch: ConversationsSearch.catch({})` (C27: o endereço é entrada externa, lido uma vez) e
desenha `ConversationsPage`. O estado da lista segue o de hoje, `ListView` de `list-view.ts` (a aba
separa `tab: 'PROJECTS' | undefined`, C22); os ids são `CompanyId`, `ProjectId` e `ConversationId` do
`hub-api`, conferidos nos parâmetros da rota (C23). A lista segue em páginas de 30 com o paginador
(C44). O dono das frases é `text.ts`; entra `ALL_CONVERSATIONS = 'Ver todas as conversas'` (C26).
`NewConversation` continua exportado: a página o mostra no alto. O arquivo modelo é o próprio
`sidebar-conversations.tsx`: cumpre C22, C23 e C26.

Em `hub/copies/data-page.tsx`, `DataPage` ganha as abas das camadas no alto, com `Tabs` de `ui/tabs.tsx`
e `DataLayer` de `search.ts` como valor; a contagem de cada aba é a que a árvore mostra hoje.

### As skills e a leitura

As linhas de `docs/reference/stack.md` de `@tanstack/react-router` (as skills `router-core`),
`@tanstack/react-query` e `@base-ui/react`. Ler primeiro web W18, W29 e design V58 e V59.

### A ordem do trabalho

1. **A página Conversas.** Critérios: 1.
   - **Arquivos:** cria `conversations-page.tsx`, o teste e a rota; apaga `sidebar-conversations.tsx`.
   - **O que sai:** `SidebarConversations` e os dois testes dela, cujos casos passam para o teste novo.
   - **O que entra:** a mesma lista, na largura do eixo do Início (V59), sem as peças `Sidebar*`: o
     título "Conversas", "Nova conversa", a busca sempre à vista, o filtro por lugar, as abas e os dias.
     Regras: W18, V58, V59.
   - **Testes:** `conversations-page.test.tsx`, pela porta da rota (`createConexus` com histórico em
     memória e o Hub dublado, como `old-copy-addresses.test.tsx`).
   - **Mutações à mão:** tirar o `.catch({})` do `validateSearch`: "um lugar inválido abre a lista
     inteira" fica vermelho.
   - **Pronto quando:** `/companies/<e>/conversations?q=pão` abre com a busca preenchida.
2. **Continuar leva à lista.** Critérios: 2.
   - **Arquivos:** muda `day.tsx` (a `action` do bloco "Continuar", como a do bloco Ligações em
     `day.tsx:133-143`), `text.ts`, `index.tsx` do Início.
   - **Testes:** `day.test.tsx`, "Continuar leva à lista inteira".
3. **As camadas em abas.** Critérios: 3.
   - **Arquivos:** muda `data-page.tsx`; apaga `data-tree.tsx` e o teste; muda `route.tsx:132-143`.
   - **O que sai:** `DataTree` e o ramo `inData` da moldura.
   - **Testes:** `data-page.test.tsx`, "as camadas são abas e a camada fica no endereço".
   - **Mutações à mão:** trocar o `layer` da aba Apps por `raw`: o teste fica vermelho.
4. **A linha em `screens.md`.** Critérios: 1.

### Como se prova

`npm run test:unit -w @conexus/web` e `npm run test:browser -w @conexus/web`. Hoje os critérios 1 a 3
falham: o endereço `/conversations` não existe e Dados não tem abas.

### Parar se

Uma unidade das trilhas Dados ou Agentes e Apps estiver aberta em `hub/copies/` ou em
`agents/assistant/`: espere por ela (delivery L1). O fundador responder C-b ou C-c: a unidade muda de
forma; volte ao cartão.

## U2 A barra com grupos e a barra do objeto

**Base e modelo.** O commit da U1. Opus: a unidade cruza a moldura de `ui/`, as três rotas que a
desenham, o assunto Projetos e a conta.

### As linhas da tabela

1 a 9, 19 e 20. Ler `ui/sidebar.tsx`, `ui/frame.tsx`, `ui/sidebar-rail-button.tsx`,
`ui/sidebar-selector.tsx` e `ui/settings-index.tsx` inteiros; as três rotas de moldura
(`routes/_app/companies/$companyId/route.tsx`, `.../$companyId_/settings/route.tsx`,
`routes/_app/operations/route.tsx`); `hub/projects/project-rail.tsx`; `hub/identity/account-menu.tsx:36-73`;
`hub/notifications/bell.tsx`; `main.tsx:27-40` (o `staticData`); `brand/tokens.css:111-118`;
`DESIGN.md:160-162,272-277,332-334,493-499,527-528`; `platform/theme.ts`. Seguir MA
`lib/nav/nav-items.tsx:24-39`, `components/ui/app-sidebar.tsx:64-125,143-159`,
`domains/agent-builder/layouts/agent-builder-sidebar.tsx:68-99`; SH `ui/sidebar.tsx:152-163,254-285,389-425,508-560`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `ui/nav.tsx` | cria | as três rotas de moldura; `ui/showcase/navigation.tsx` |
| `routes/_app/-navigation.ts` e o teste | cria | as três rotas; a U3 |
| `platform/sidebar.ts` | cria | `ui/frame.tsx` |
| `ui/sidebar.tsx` | muda: saem `RailColumn`, `RailContent`, a propriedade `rail` e `SidebarRail`; entra o botão de recolher | `ui/frame.tsx`, as peças que usam `useSidebar` |
| `ui/frame.tsx` | muda: a assinatura de `Frame`; sai `FrameLink` | as três rotas, `ui/settings-index.tsx`, a vitrine |
| `ui/sidebar-rail-button.tsx` | apaga | `route.tsx`, a vitrine |
| `ui/settings-index.tsx` | muda: desenha por `SidebarNav` | a rota das Configurações |
| `hub/projects/project-rail.tsx`, `public.ts` | muda: ficam `ProjectRailHead` e o seletor; saem `RAIL` e `ProjectRailNav` | `route.tsx` |
| `hub/identity/account-menu.tsx`, `hub/notifications/bell.tsx` | muda: sai `compact`; o sino vira uma linha com nome e contagem | as rotas de moldura |
| `brand/tokens.css`, `DESIGN.md` | muda: `sidebar` 15 rem; saem `rail-tile` e a prosa do trilho | o Impeccable, `brand/tokens.test.ts` |
| `apps/web/shell.layout.test.ts` | cria | `apps/web/package.json` (`test:browser`) |
| `route.test.tsx`, `frame.layout.test.ts`, `frame-inset.layout.test.ts`, `focus.layout.test.ts`, `contrast.layout.test.ts`, `keyboard.test.ts`, `layout.test.ts`, `motion*.layout.test.ts`, `workbench.layout.test.ts`, `picker-places.ts`, `sweep-*-states.ts`, os três testes `hub/projects/project-{bar,rail,phone}.test.tsx`, `account-menu.test.tsx`, `bell.test.tsx` | muda: os seletores do trilho passam aos da barra | `test:unit`, `test:browser`, `test:sweep` |

### Os contratos que a unidade cria

Em `ui/nav.tsx` (a peça é dona dos tipos, como `SectionMeta` em `ui/settings-index.tsx`):

```ts
export type NavItem = {
  to: LinkProps['to']
  label: string
  icon: LucideIcon
  /** What the Hub must say the person may do for the item to show (web W34). */
  needs?: keyof CompanyMay
  /** Current only at its own address (Início, Construir). */
  exact?: true
  /** Also current while a route with one of these `staticData.place` shows. */
  places?: readonly string[]
}
export type NavSection = { key: string; title?: string; items: readonly NavItem[] }
/** The sections a person sees: items the role lacks leave, and a section left empty leaves with its title. */
export function seen(sections: readonly NavSection[], may: CompanyMay | undefined): NavSection[]
export function SidebarNav(props: { sections: readonly NavSection[]; params?: LinkProps['params'] }): ReactNode
```

Em `routes/_app/-navigation.ts`, o dono de cada nome, ordem, ícone e permissão da barra (C26):

```ts
export const HUB_NAV: readonly NavSection[]      // Início; Dados e contexto; Agentes; Apps
export const PROJECT_NAV: readonly NavSection[]  // O app; Agentes; Dados; O Projeto (o RAIL de hoje)
export const CENTRAL_NAV: readonly NavSection[]  // Clientes, Estado do Hub
```

`HUB_NAV`: Início (`exact`, `places: ['Início', 'Conversas']`); "Dados e contexto": Integrações, Dados;
"Agentes": Agentes (`needs: 'manageAgents'`), Automações (`needs: 'manageAutomations'`); "Apps":
Projetos. Os títulos e a divisão são os da decisão B; `PROJECT_NAV` copia `project-rail.tsx:81-145`
sem mudar item, grupo nem permissão.

Em `ui/frame.tsx`:

```ts
export function Frame(props: {
  /** The way out of an inner place, in the top line instead of the mark: "← Todos os projetos", "← Voltar". */
  back?: Pick<LinkProps, 'to' | 'params'> & { label: string }
  /** Under the top line: the company's or the Projeto's name with its switcher. */
  header?: ReactNode
  nav: ReactNode
  footer: ReactNode
  menuNote?: string
  compact: boolean
  children: ReactNode
}): ReactNode
```

Em `platform/sidebar.ts`: `readSidebarChoice(): 'collapsed' | 'expanded' | undefined` e
`keepSidebarChoice(choice: 'collapsed' | 'expanded'): void`, com a chave `conexus-sidebar`; o valor lido
passa por `z.enum(['collapsed', 'expanded'])` com `.catch(undefined)` (C27), e uma gravação que o
navegador recusa não lança. O estado da barra é a união `'expanded' | 'collapsed'` que `useSidebar` já
tem (C21). Os ids são os do `hub-api`, conferidos nos parâmetros das rotas (C23). O arquivo modelo é
`ui/settings-index.tsx`: recebe dados prontos com `needs` e cumpre C21, C23 e C26.

### As skills e a leitura

As linhas de `docs/reference/stack.md` de `@base-ui/react`, `@shadcn/react` (a skill `shadcn`) e
`@tanstack/react-router`. Ler primeiro web W30, W31, W32 e W34 e design V5, V19, V30, V34 e V56, como
o pull request de método da decisão D os deixou.

### A ordem do trabalho

1. **Tirar o trilho.** Critérios: 4.
   - **Arquivos:** apaga `ui/sidebar-rail-button.tsx`; muda `ui/sidebar.tsx`, `account-menu.tsx`,
     `tokens.css`, `DESIGN.md`.
   - **O que sai:** `RailColumn`, `RailContent`, `rail`, `SidebarRail`, `compact` da conta, `rail-tile`.
   - **Pronto quando:** nenhum `sidebar-rail-column` no DOM.
2. **A navegação em dados e a peça.** Critérios: 4, 5, 6.
   - **Arquivos:** cria `ui/nav.tsx`, `-navigation.ts` e o teste.
   - **Referência a seguir:** MA `nav-items.tsx:24-39`; SH `nav-main.tsx:20-37`.
   - **O que entra:** `SidebarNav` desenha cada seção com `SidebarGroup`, `SidebarGroupLabel` e
     `SidebarMenuButton` (a dica já vem de `ui/sidebar.tsx:304-328`); o lugar atual sai do `Link` do
     roteador e de `places`. Regras: W34, V5, V35.
   - **Testes:** `-navigation.test.ts`: "cada destino existe no roteador" (confere cada `to` contra
     `routesById` do roteador de `createConexus`) e "um grupo vazio some com o título".
   - **Mutações à mão:** trocar `/companies/$companyId/data` por `/companies/$companyId/dados`:
     vermelho, dizendo o endereço.
3. **A moldura nova e recolher.** Critérios: 7, 8, 9, 13.
   - **Arquivos:** muda `ui/frame.tsx`, `ui/sidebar.tsx`; cria `platform/sidebar.ts`,
     `shell.layout.test.ts`.
   - **Referência a seguir:** MA `app-sidebar.tsx:112-125`; SH `sidebar.tsx:254-285`.
   - **O que entra:** a linha do alto (a marca e "Conexus", ou `back`), o botão "Recolher a barra
     lateral" / "Abrir a barra lateral"; `opensWide` (`frame.tsx:131-133`) vale só sem escolha guardada.
     Regras: V26, V30, V31, V32.
   - **Mutações à mão:** tirar a dica do `SidebarMenuButton` recolhido: "cada ícone diz o nome pelo
     teclado" fica vermelho.
4. **As três molduras.** Critérios: 4, 10, 12.
   - **Arquivos:** muda as três rotas, `project-rail.tsx`, `settings-index.tsx`, `bell.tsx`.
   - **Referência a seguir:** MA `agent-builder-sidebar.tsx:68-99`.
   - **O que entra:** a empresa passa `SidebarNav` com `seen(HUB_NAV, may)`; com `projectId`,
     `back` "Todos os projetos", `ProjectRailHead` e `seen(PROJECT_NAV, may)`; o pé é Notificações,
     Configurações e a conta nas três. Regras: W30, W31, W32.
   - **Testes:** `route.test.tsx`, os casos dos critérios 4, 5 e 10.
5. **O teclado na troca.** Critérios: 11.
   - **O que entra:** nenhum código de foco (linha 20). A linha do alto vem primeiro e o menu depois,
     na mesma ordem nas duas barras, e a barra vem antes da folha no documento. Regras: V30.
   - **Testes:** `keyboard.test.ts`, "depois de voltar, o Tab segue na barra".
6. **A vitrine e o `DESIGN.md`.** Critérios: 20, 21.
   - **Arquivos:** `ui/showcase/navigation.tsx` (a barra aberta, recolhida e a do objeto); `DESIGN.md`
     ganha "Barra", "Barra do objeto" e perde o trilho.

### Como se prova

`npm run test:unit -w @conexus/web`, `npm run test:browser -w @conexus/web`, `npm run lint:design -w
@conexus/web`. Hoje os critérios 4 a 13 falham: a barra é um trilho de ícones sem nome e o botão de
recolher não está no Tab.

### Parar se

- O fundador responder A-b, A-c ou B-b: `HUB_NAV` e o critério 4 mudam; volte ao cartão.
- Um título de grupo ou um ícone não passar o contraste do critério 13: mande o par ao fundador; nunca
  ajuste a cor.
- Uma peça de outra trilha depender de `FrameLink` ou de `SidebarRailButton`: liste e pare (delivery
  L7).
- O teste do critério 11 mostrar o Tab recomeçando fora da barra: não escreva código de foco; relate
  com o que o navegador fez, porque a saída é decisão do fundador (delivery L28).
- O pull request de método da decisão D não estiver em `main`: a unidade não começa.

## U3 A paleta de comando

**Base e modelo.** O commit da U2. Sonnet: uma peça sobre a receita do Base UI e um gancho que junta
leituras que já existem.

### As linhas da tabela

10 a 14 e 21. Ler `node_modules/@base-ui/react/docs/react/components/autocomplete.md:3204-3324` e
`dialog.md`; `ui/dialog.tsx`, `ui/picker.tsx` (a outra peça de lista com busca), `ui/sidebar.tsx:56-66`;
`routes/_app/-navigation.ts` da U2; `routes/.../settings/route.tsx:30-45`; `agents/assistant/day.tsx:23-30`
(a leitura das conversas); `route.tsx:38-39` (a leitura dos projetos). Seguir MA
`lib/command/navigation-command.tsx:463-490,511-534`, `lib/command/use-navigation-command.ts:31-57` e
`components/ui/app-sidebar.tsx:59-62,117-123`; SH `ui/kbd.tsx:3-14`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `ui/command-palette.tsx`, `ui/kbd.tsx` | cria | `ui/frame.tsx`, a vitrine |
| `routes/_app/-destinations.tsx` e o teste | cria | as três rotas de moldura |
| `routes/_app/-navigation.ts` | muda: ganha `settingsSections`, que a rota das Configurações passa a usar | a rota das Configurações, `-destinations.tsx` |
| `ui/frame.tsx` | muda: `search`, o gatilho e a tecla | as três rotas |
| `agents/assistant/public.ts` | muda: exporta a leitura da primeira página de conversas | `-destinations.tsx` |
| `ui/showcase/`, `DESIGN.md` ("Paleta") | muda | a vitrine, o Impeccable |
| `apps/web/palette.layout.test.ts` | cria | `apps/web/package.json` (`test:browser`) |
| `apps/web/motion.layout.test.ts` | muda: a paleta no caso do reduzir | `test:browser` |

### Os contratos que a unidade cria

Em `ui/command-palette.tsx`:

```ts
export type PaletteItem =
  | { kind: 'page'; id: string; label: string; hint?: string; icon?: LucideIcon; keywords?: readonly string[]
      to: LinkProps['to']; params?: LinkProps['params']; search?: LinkProps['search'] }
  | { kind: 'action'; id: string; label: string; hint?: string; icon?: LucideIcon; keywords?: readonly string[]
      run: () => void }
export type PaletteGroup = { label: string; items: readonly PaletteItem[] }
export function CommandPalette(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: readonly PaletteGroup[]
}): ReactNode
```

`PaletteItem` é uma união separada por `kind` (C21, C22). `Frame` ganha `search?: readonly
PaletteGroup[]`: com ele, a moldura é dona do estado aberto, da tecla e do gatilho; sem ele (a primeira
entrada), nada abre. Em `routes/_app/-destinations.tsx`:

```ts
export function useHubDestinations(scope: {
  companyId: CompanyId
  projectId?: ProjectId
  may: CompanyMay
  operator: boolean
}): PaletteGroup[]
```

Os ids são os do `hub-api` (C23). O filtro de permissão é o `seen` da U2 e mais nenhum (C26). As frases
("Buscar ou ir para…", "Nada encontrado.", "Conversas recentes", "Ir para", "Projetos") têm um dono, a
peça. Nenhuma entrada externa nova: as leituras já passam pelo esquema da operação (W9). O arquivo
modelo é `ui/picker.tsx`: cumpre C21, C23 e C26.

### As skills e a leitura

As linhas de `docs/reference/stack.md` de `@base-ui/react` e `@tanstack/react-query`. Ler primeiro web
W21 e W22 e design V17, V26, V30 e V31, e "Motion" do `DESIGN.md` (a paleta segue a janela).

### A ordem do trabalho

1. **A peça.** Critérios: 15, 17, 20.
   - **Arquivos:** cria `ui/command-palette.tsx`, `ui/kbd.tsx`, a entrada na vitrine.
   - **Referência a seguir:** BU `autocomplete.md:3231-3324`: `Dialog.Root`, `Dialog.Popup` com nome,
     `Autocomplete.Root open inline autoHighlight="always" keepHighlight`, `Autocomplete.Input`,
     `Autocomplete.Empty`, `Autocomplete.List` com `Group`, `GroupLabel`, `Collection` e `Item`.
   - **O que entra:** a janela pela peça `ui/dialog.tsx` (o véu e os tempos da R1); a lista rola por
     `overflow-auto`, sem a `ScrollArea` nem o `style=` do exemplo (V17); o filtro por
     `Autocomplete.useFilter({ sensitivity: 'base' })`, que ignora acento (`autocomplete.md:2475`); a
     linha das teclas some em `pointer: coarse`. Regras: V17, V26, V31.
   - **Testes:** `palette.layout.test.ts`, "achar, escolher e não achar" e "o diálogo e o celular", na
     vitrine.
   - **Mutações à mão:** tirar `autoHighlight`: Enter depois de "integ" não navega e o teste fica
     vermelho.
2. **Os destinos.** Critérios: 5, 16.
   - **Arquivos:** cria `-destinations.tsx` e o teste; muda `-navigation.ts`, a rota das Configurações,
     `agents/assistant/public.ts`.
   - **Referência a seguir:** MA `navigation-command.tsx:511-534`.
   - **O que entra:** "Conversas recentes" da primeira página (o título por `titleOf`, a idade como
     `hint`); "Ir para" com `seen(PROJECT_NAV, may)` quando há projeto (o `hint` é o nome dele),
     `seen(HUB_NAV, may)` (o `hint` é o título do grupo), as seções das Configurações (o `hint` é
     "Configurações") e Central para quem opera; "Projetos" da primeira página. Uma leitura pendente ou
     com erro não entra.
   - **Testes:** `-destinations.test.tsx`, os três casos dos critérios 5 e 16.
3. **A tecla e o gatilho.** Critérios: 14.
   - **Arquivos:** muda `ui/frame.tsx` e as três rotas.
   - **Referência a seguir:** MA `use-navigation-command.ts:42-54`; `ui/sidebar.tsx:56-66`.
   - **O que entra:** o botão "Buscar ou ir para…" com a tecla na linha do alto da barra (recolhida,
     só a lupa com a dica); a tecla escrita é "⌘K" no Mac e "Ctrl K" no resto.
   - **Testes:** `palette.layout.test.ts`, "abre de qualquer tela e devolve o foco" e "sem moldura não
     abre".
4. **O reduzir.** Critérios: 17.

### Como se prova

`npm run test:unit -w @conexus/web` e `npm run test:browser -w @conexus/web`. Hoje os critérios 14 a 17
falham: Ctrl+K não faz nada.

### Parar se

- O `Autocomplete` do Base UI, dentro do `Dialog`, escrever um elemento `style` que a CSP recuse
  (`page.problems` na vitrine): pare, com o erro; a saída é a decisão sobre `cmdk`, que é do fundador
  (delivery L28).
- Ctrl+K já tiver dono em alguma tela (o compositor, o editor de código): pare e diga onde.

## U4 A gaveta e a troca de empresa

**Base e modelo.** O commit da U3. Sonnet.

### As linhas da tabela

17 e 18. Ler `ui/sidebar.tsx:124-142`, `ui/frame.tsx:88-127`, `ui/sidebar-trigger.tsx`,
`ui/sidebar-selector.tsx`, `ui/picker.tsx:25-45,132`, `hub/identity/company-switcher.tsx`,
`hub/identity/use-companies.ts`, `hub/operations/central-header.tsx`, `hub/projects/project-picker.tsx:20-37`
(como um assunto usa a `Picker`). Seguir SH `ui/sidebar.tsx:182-205` e SB
`AppLayout/OrganizationDropdown.tsx:60-101`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `hub/identity/company-switcher.tsx` e o teste | muda | a rota da empresa |
| `hub/operations/central-header.tsx` | muda: a mesma peça | a rota da Central |
| `ui/sidebar-selector.tsx` | muda: fica `SidebarSwitch`, a cabeça que abre uma lista; sai `SidebarSelector` com o menu | os dois acima, `project-rail.tsx`, a vitrine |
| `ui/frame.tsx`, `ui/sidebar.tsx` | muda: o gatilho da busca fecha a gaveta | · |
| `phone-menu.layout.test.ts`, `phone.layout.test.ts`, `project-phone.test.tsx` | muda | `test:browser`, `test:unit` |

### Os contratos que a unidade cria

Nenhum tipo novo. `CompanySwitcher({ current: CompanyId })` mantém a assinatura e passa a desenhar a
`Picker` de `ui/picker.tsx` com um grupo "Suas empresas", a busca a partir de `SEARCH_FROM` (7) e
`SidebarSwitch` como gatilho; com uma empresa só, a cabeça sem botão, como hoje
(`company-switcher.tsx:27`). O id é `CompanyId` (C23); o dono da lista é `useCompanies` (C26).

### As skills e a leitura

As linhas de `docs/reference/stack.md` de `@base-ui/react` e `@shadcn/react`. Ler primeiro design V18,
V32 e V56 e web W30.

### A ordem do trabalho

1. **A troca de empresa.** Critérios: 19.
   - **O que sai:** o menu `DropdownMenu` de `SidebarSelector` (`ui/sidebar-selector.tsx:39-70`).
   - **Testes:** `company-switcher.test.tsx`, "uma, duas e sete empresas".
   - **Mutações à mão:** tirar o filtro `others.length === 0`: com uma empresa aparece o botão e o
     teste fica vermelho.
2. **A gaveta.** Critérios: 18.
   - **O que entra:** a gaveta desenha a mesma barra do lugar; o gatilho da busca chama
     `setOpenMobile(false)` antes de abrir a paleta (MA `app-sidebar.tsx:59-62`); o alto do celular
     segue dizendo o lugar (`frame.tsx:88-110`).
   - **Testes:** `phone-menu.layout.test.ts`, os dois casos, a 390 e a 320 px.

### Como se prova

Os critérios 18 e 19 falham hoje em parte: dentro de um projeto a gaveta não traz as seções dele (mapa
7) e a troca de empresa não tem busca.

### Parar se

A `Picker` precisar de uma propriedade nova para a cabeça da barra: pare e descreva; ela é a peça que
cinco telas usam (V62).

## G1 O ponto de conferência

Depois da U2: `npm run test:unit`, `test:browser`, `test:sweep` e `lint:design` em `@conexus/web`; o Hub
local com os dublês, a 1366 e a 390 px, nos dois temas, com e sem reduzir movimento: a barra aberta e
recolhida, a troca para o projeto e a volta só pelo teclado, Configurações, Central, a página
Conversas e as abas de Dados, como dono e como membro; cada captura ao lado da `n4-*` do protótipo;
`impeccable detect` nos arquivos mudados e no Hub rodando.

## G2 O ponto de conferência

Depois da U4: os mesmos comandos; a paleta aberta de cada moldura, com o teclado e com o toque, vazia,
filtrada e sem resultado, como dono, membro e operador; a gaveta nas três barras a 390 e a 320 px; a
troca de empresa com uma, duas e sete empresas; o roteiro de uso inteiro, item por item.
