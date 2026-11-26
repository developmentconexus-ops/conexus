# Etapa R2: a casca nova

Trilho: desenho

A etapa da casca da [trilha Redesenho](trilhas/redesenho.md): a navegação do pedido e do objeto, que o
fundador escolheu em 2026-11-26 (decisão 1 do estudo do redesenho), na forma da versão 2 dos protótipos
das jornadas, a que ele aprovou. O estudo desta etapa fica fora do repositório (delivery L21), na pasta
`redesenho-r2-cartao`, com o quadro das decisões em imagem; a sua tabela de referência está abaixo, com
a unidade de cada linha. O código foi lido no segundo grupo da R1, `feat/redesenho-r1-g2` em `6067d718`,
que entrou em `main` em `301ee9b5` sem mudar nenhum arquivo citado:
`@base-ui/react` 1.9.0, `@tanstack/react-router` 1.170.44, `@tanstack/router-plugin` 1.168.46,
`tailwindcss` 4.3.3. Referências, nos mesmos commits do cartão da R1: Mastra (`mastra@252efe1`), shadcn
base (`ui@0e5b2e6`), Supabase (`supabase@3089aa3`), Dify (`dify@fce5d30`). A vaga do trilho `desenho` é
do cartão da [R1](redesenho-r1-a-base-visual-e-o-movimento.md), aprovado em 2026-11-26: este cartão
espera num pull request de rascunho até a R1 fechar (delivery L5). O fundador pôs a R2 logo depois da
R1 ("Concordo", 2026-11-26) e respondeu as seis decisões desta página no mesmo dia; as palavras dele
estão na página da trilha.

## A página do fundador

**No fim desta etapa** você acha qualquer área do Hub pelo nome, entra num projeto e vê as seções dele,
volta com um clique, e chega pelo Ctrl+K em qualquer área, seção das Configurações, projeto ou conversa
recente. A coluna de conversas, que hoje aparece ao lado de quase toda área, some: a barra é uma só, e
é nela que você começa uma conversa nova ou abre uma das últimas, de qualquer tela. É a moldura da
versão 2 dos protótipos; o que está dentro de cada tela (a galeria de agentes, os cartões
de ligação, a galeria de projetos) chega nas etapas seguintes.

**O roteiro de uso.** No Hub da nuvem, sem terminal.

1. Abra o Hub. A barra tem o nome de cada lugar: Início; **Dados e contexto** (Integrações, Dados,
   Conhecimento); **Agentes** (Agentes, Automações); **Apps** (Projetos); no pé, Avisos, Configurações
   e a sua conta, com o nome da empresa embaixo do seu. No alto fica "Nova conversa"; depois de Início,
   "Conversas"; no fim, "Recentes", com as suas últimas conversas. Clique em Conhecimento: são as instruções e as
   páginas da empresa, que saíram das Configurações. Clique em Dados: as camadas Negócio, Bruto e Apps
   são abas no alto da página, e não há coluna ao lado.
2. Recolha a barra pelo botão do alto (ou Ctrl+B): ficam só os ícones. Passe o mouse, e depois o Tab,
   por eles: cada um diz o nome. Recarregue a página: a barra continua recolhida.
3. Abra Projetos e entre num projeto. A barra troca pela dele: "← Todos os projetos", o nome do projeto
   com o estado do app embaixo, e as seções (Construir; Conversas, Agentes, Automações; Integrações,
   Dados; Quem usa o app, Sobre). Abra Agentes e um agente; volte com "← Todos os projetos": você cai
   na lista, com "Projetos" marcado na barra.
4. Aperte Ctrl+K em qualquer tela, digite "integ" e Enter: abre Integrações. Aperte de novo e digite um
   pedaço do título de uma conversa: ela aparece em "Conversas recentes". Esc fecha e devolve o foco
   para onde estava.
5. Clique em Conversas, na barra: é a lista por dia, com a busca e o filtro, que antes ficava na
   coluna. Abra uma conversa: ela fica marcada em Recentes. De Integrações, clique em outra conversa de
   Recentes e depois em "Nova conversa": você cai no Início, na caixa do pedido. Abra Configurações: a
   barra troca pelo índice, com "← Voltar".
6. No celular, o botão do alto abre a gaveta com a mesma barra (a do Hub, a do projeto ou o índice), e
   "Buscar ou ir para…" abre a busca. Se você tem duas empresas, o menu da sua conta lista "Suas
   empresas".

**O que você faz, e quando.** Antes: nada a fornecer. No começo: aprova esta página; as seis decisões
abaixo você já respondeu, vendo as opções no quadro da etapa. A mudança dos guias (decisão D) entra
antes da primeira unidade. No fim: faz o roteiro, vê o quadro do fim (cada tela do Hub ao lado da captura da
versão 2), diz o que viu e aprova os textos ("Buscar ou ir para…", "Conversas", "Recentes", "← Todos
os projetos", "Nada encontrado.", "Recolher a barra lateral", "Avisos", "Conhecimento").

**A visão.** "Na tela elas se chamam Dados e contexto, Agentes e Apps": os títulos da barra são esses
três nomes (decisão B). "Cada pessoa vê o que usa" e "Uma ação fora do papel fica à vista, desligada, e
diz quem pode": uma área que o papel não usa não aparece na barra nem na busca; a regra tem um dono só.
"Cada capacidade do Conexus tem uma lógica só, que serve toda conversa e toda tela": a barra, a gaveta
e a busca leem a mesma lista de lugares.

**O que mudou neste cartão por causa da versão 2.** A primeira escrita seguia o primeiro protótipo de
navegação e, em quatro pontos, fugia dele; agora segue o que você aprovou.

- O nome da empresa sai do alto da barra e vai para o pé, embaixo do seu nome; a troca de empresa passa
  ao menu da conta.
- Conhecimento entra na barra, mostrando o que hoje é "Memória da empresa" nas Configurações (sua
  decisão de 2026-11-17: "o item nasce com o que já existe").
- A linha do sino se chama "Avisos", e o nome do projeto na barra leva o estado do app.
- Os títulos dos grupos, a barra do projeto, a barra do agente e o Início viraram decisões em imagem
  (B, F, A e G), que você respondeu em 2026-11-26. A vez da R2 já estava decidida (E).
- As conversas: você perguntou se não valia manter a segunda coluna no Início, ou um "nova conversa"
  à mão. O estudo está no quadro e virou a decisão C, refeita, com quatro opções; você escolheu a C-a.
- As camadas de Dados viram abas no alto da página. A árvore ao lado, que você aprovou em 2026-11-15,
  morava na coluna que some; a versão 2 não desenha as camadas.

**Fica de fora.**

- **O que está dentro de cada tela da versão 2**: a galeria de colegas, os cartões de ligação, a galeria
  de projetos, a coluna de leitura no centro da folha. Vai com a R4 (Dados e Integrações), a R5
  (agentes) e a R6. Na R2 cada lugar da barra abre a tela de hoje.
- **A barra própria do agente** (Conversa, Entregas, Rotinas, Ficha, Execuções): três dessas páginas
  não foram desenhadas, e hoje o agente é uma tela só, dentro de um projeto. Vai com a R5 (decisão A).
- **A barra do projeto com as cinco seções da versão 2**, e "Arquivos", que não tem tela: tirar
  Agentes, Automações, Integrações e Dados do projeto muda a regra de onde o agente mora (decisão F).
- **O título em pergunta, o "Continuar" com agentes e projetos e os três números de "Estado" no
  Início** (decisão G). O Início de hoje já tem a caixa do pedido, as sugestões, Continuar, Projetos e
  Ligações.
- **A segunda coluna de conversas**, no Início ou em toda tela: você escolheu a barra (decisão C).
- **Levar o foco à caixa do pedido quando você clica em "Nova conversa" já estando no Início.** Hoje o
  botão leva ao Início e, no próprio Início, não faz nada novo; fica assim, e vai com a etapa do Início
  (R6).
- **A caixa de Avisos única** para agentes, automações e projetos: decisão sua ainda aberta, da R6.
  Aqui a linha "Avisos" abre o painel do sino de hoje.
- **Achar pelo Ctrl+K uma conversa antiga**, fora das 30 mais recentes, ou uma automação, uma ligação
  ou um agente pelo nome: a página Conversas tem a busca completa, e cada lista tem a sua.
- **Os nomes repetidos** entre o Hub e o projeto (Agentes, Automações, Integrações e Dados nos dois):
  seguem a decisão F.
- **Levar o foco do teclado ao lugar atual quando a barra troca.** Nenhum produto de referência faz, e o
  Hub de hoje não faz em nenhuma troca de tela. O esperado é que o navegador siga o Tab de onde o link
  estava, no alto da barra; só o teste do critério 11 confirma. Código nosso para isso seria uma decisão
  sua à parte.
- **O terceiro grupo "Dados" nas Configurações** e a barra que cada pessoa arruma: sem cartão.

**As decisões suas nesta etapa.** Cada opção está desenhada no quadro da etapa, ao lado das capturas da
versão 2 e das telas do Mobbin.

- **A. Ao abrir um agente, que barra aparece. Decidida: A-a** (2026-11-26). Na R2, abrir um agente
  mostra a barra do projeto dele, como hoje, com "Agentes" marcado; a barra própria do agente nasce na
  R5, com as cinco páginas dela. O que você aceitou: quem chega num agente pela lista "Agentes" do Hub
  volta por "← Todos os projetos", e não por uma volta para Agentes, até a R5. Ficaram de fora: A-b (a
  barra do agente já, sem seções) e A-c (cada agente uma linha da barra).
- **B. Os títulos dos grupos. Decidida: B-b** (2026-11-26). Três títulos: "Dados e contexto",
  "Agentes" e "Apps", um por Solution, como a visão os chama e como a sua decisão de 2026-11-02 os
  dividiu. O que você aceitou: o título "Agentes" fica em cima do item "Agentes", e "Apps" em cima de
  um item só, Projetos. Quem não gerencia agentes nem automações não vê o grupo Agentes. Ficou de fora:
  B-a (os dois títulos da versão 2, que era a recomendada).
- **C. Como você chega nas conversas de antes e começa uma nova. Decidida: C-a** (2026-11-26). Você
  perguntou se não valia deixar a segunda coluna no Início, "para facilitar", ou algo como um "nova
  conversa"; o estudo olhou dezenove produtos no Mobbin, desenhou quatro opções sobre o protótipo da
  versão 2 e passou as quatro pela crítica do Impeccable. Você escolheu: na barra, em toda tela, o
  botão "Nova conversa", o lugar "Conversas" (a lista inteira, por dia, com a busca e o filtro) e, no
  fim, "Recentes", com as últimas conversas que couberem, até oito. É o que fazem os produtos com uma
  barra larga como a nossa (Claude, ChatGPT, Gemini, Langdock, WRITER, Dropbox Dash). O que você
  aceitou: com três títulos de grupo, a 768 px de altura cabem três recentes (oito numa tela alta, uma
  na gaveta do celular), e a barra recolhida e a do projeto não as mostram. Ficaram de fora: C-b (a
  coluna de conversas só no Início e numa conversa aberta), C-c (a barra sem "Recentes") e C-d (a
  coluna em toda tela, como hoje).
- **D. As regras escritas dos guias. Decidida: D-a** (2026-11-26). Os guias mudam antes de construir,
  num pull request só de documentos, logo depois da aprovação desta página, como foi na R1. Entra uma
  regra nova: os lugares do Hub são declarados num arquivo só, e a barra, a gaveta e a busca leem dele;
  assim um lugar novo não entra na barra e fica esquecido na busca. A lista do que muda está em "O que
  a aprovação muda nos documentos".
- **E. A vez da R2 na trilha. Decidida** ("Concordo", 2026-11-26): a R2 logo depois da R1, a R3 em
  seguida, e um quadro em imagem no começo e no fim de cada etapa. O teste com cinco pessoas passa a
  usar a casca de verdade.
- **F. A barra do projeto. Decidida: F-a** (2026-11-26). A forma da versão 2 (a volta no alto, o nome
  com o estado), com as oito seções de hoje nos quatro grupos. O que você aceitou: a barra do projeto
  ainda não é a da versão 2. Onde o agente mora continua uma regra sua, que o cartão da R5 traz; quando
  ela mudar, tirar uma seção da barra é uma linha. Ficou de fora: F-b (as cinco seções da versão 2 já).
- **G. O Início. Decidida: G-a** (2026-11-26). Na R2 o Início só ganha a barra nova, com o que a
  decisão C pôs nela. O título em pergunta, o "Continuar" com agentes e projetos e os três
  números vão com a etapa do Início (R6), depois da R3, que traz a peça dos números. Ficou de fora: G-b
  (o título e o "Continuar" misto numa unidade a mais da R2).

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 As listas saem da coluna e Conhecimento ganha o lugar | a página Conversas, com a lista inteira; a lista ao lado vira "Recentes", curta; as camadas de Dados em abas; a tela "Memória da empresa" muda de endereço e vira Conhecimento; a coluna deixa de mostrar a árvore | `apps/web/src/agents/assistant/`, `apps/web/src/hub/copies/`, `apps/web/src/routes/_app/companies/`, `apps/web/` (os testes de moldura que leem a lista), `packages/hub-api/src/pages.ts`, `docs/reference/screens.md`, `docs/reference/telas.md` | web | a R1 em `main`; o pull request de método da decisão D em `main`; nenhuma unidade aberta das outras trilhas nesses arquivos (delivery L1) |
| G1 | U2 A barra com grupos e a barra do objeto | a navegação em dados; a barra de 240 px com grupos, o botão de recolher e a escolha guardada; "Nova conversa", o lugar "Conversas" e "Recentes" na barra do Hub; a barra do projeto com "← Todos os projetos" e o estado; a conta com a empresa e "Suas empresas" no menu dela; Configurações e Central na moldura nova | `apps/web/src/ui/`, `apps/web/src/routes/_app/`, `apps/web/src/hub/projects/`, `apps/web/src/hub/identity/`, `apps/web/src/hub/notifications/`, `apps/web/src/platform/`, `apps/web/src/brand/`, `DESIGN.md` | design | U1 |
| G2 | U3 A paleta de comando | Ctrl+K sobre o Base UI, com as páginas saídas da navegação, os projetos, as conversas recentes e as empresas de quem tem mais de uma; o gatilho na barra | `apps/web/src/ui/`, `apps/web/src/routes/_app/`, `apps/web/src/agents/assistant/` (o que `public.ts` exporta), `DESIGN.md` | design | U2 |
| G2 | U4 A gaveta | a gaveta do celular com a barra do lugar, a busca e a conta, a 390 e a 320 px | `apps/web/` (os testes de celular), `apps/web/src/ui/` | design | U3 |

Dois pull requests (delivery L9): G1 e G2.

**Orçamento de código alterado.** U1: 650 linhas. U2: 1.080. U3: 580. U4: 120. Total da etapa: cerca de
2.430, abaixo do teto de 4.000 (delivery L2).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `/companies/<e>/conversations` mostra as conversas da pessoa por dia, 30 por página com o paginador, a busca pelo título, o filtro por lugar e a aba Projetos, tudo no endereço (`q`, `place`, `tab`, `conversations`); o Hub responde a página nesse endereço; recusa: um `place` que não é um lugar abre a lista inteira | `apps/web/src/agents/assistant/conversations-page.test.tsx`, "a lista por dia, a busca e o filtro no endereço" e "um lugar inválido abre a lista inteira"; `apps/web/src/routes/__root.test.tsx`, "cada endereço do roteador é uma página que o Hub abre" (existente) | must |
| 2 | U1 | A lista de conversas ao lado passa a ser "Recentes": as oito conversas mais recentes da pessoa, cada uma abre a sua, e a conversa aberta fica marcada; a busca, o filtro por lugar, as abas, os dias e o paginador não estão mais ali (estão na página, critério 1). Sem nenhuma conversa o grupo não aparece; recusa: se a leitura das conversas falha, o grupo some e "Nova conversa" segue | `apps/web/src/agents/assistant/sidebar-conversations.test.tsx`, "as oito mais recentes", "sem conversa o grupo não aparece" e "a leitura que falha não derruba a lista" | must |
| 3 | U1 | Dados mostra as camadas como abas: Negócio e Bruto com a contagem, Apps só para quem vê os dados dos apps; a camada segue no endereço (`layer`) e a nota do Bruto fica sob as abas; recusa: nenhuma coluna de Dados ao lado da barra | `apps/web/src/hub/copies/data-page.test.tsx`, "as camadas são abas e a camada fica no endereço" e "a nota do Bruto fica na página" | must |
| 4 | U2 | A barra do Hub mostra, com nome, na ordem: Início; Conversas; Dados e contexto (Integrações, Dados, Conhecimento); Agentes (Agentes, Automações); Apps (Projetos); no pé Avisos, com a contagem do que não foi lido, Configurações e a conta. O alto da barra é a marca e o botão de recolher, sem o nome da empresa (a busca entra na U3, critério 14). Depois dos grupos vem "Recentes" (critérios 2 e 23) | `apps/web/src/routes/_app/companies/$companyId/route.test.tsx`, "a barra com grupos" | must |
| 5 | U2, U3 | Quem não gerencia agentes nem automações não vê "Agentes" nem "Automações" na barra nem na paleta: o grupo Agentes some com o título, e Apps segue com Projetos; um grupo sem nenhum item não mostra o título; recusa: o endereço `/agents` segue respondendo não encontrado (S10) | `route.test.tsx`, "o membro não vê o grupo Agentes"; `apps/web/src/routes/_app/-navigation.test.tsx`, "um grupo vazio some com o título"; `-destinations.test.tsx`, "o membro não acha o que não vê"; a recusa, `apps/web/src/agents/saved-agent/agent-list.test.tsx`, "o membro: a página dá não encontrado e a entrada não aparece" (existente) | must |
| 6 | U2 | Cada destino das três listas (`HUB_NAV`, `PROJECT_NAV`, `CENTRAL_NAV`) é um endereço que o roteador conhece, e nenhum nome se repete na mesma barra; recusa: um endereço que não existe deixa o teste vermelho dizendo qual | `-navigation.test.tsx`, "cada destino existe no roteador" e "nenhum nome se repete na mesma barra" | must |
| 7 | U2 | A partir de 768 px a barra tem 240 px aberta e 56 px recolhida; o botão "Recolher a barra lateral" está no Tab e Ctrl+B faz o mesmo; a largura troca de uma vez (o critério 3 da R1 segue verde) | `apps/web/shell.layout.test.ts`, "a barra aberta e recolhida"; `motion.layout.test.ts`, "nada estica" (existente) | must |
| 8 | U2 | Recolhida, cada ícone tem nome acessível e mostra a dica no mouse e no foco do teclado, na barra do Hub, na do projeto e no índice das Configurações; o item atual tem `aria-current="page"` | `shell.layout.test.ts`, "recolhida, cada ícone diz o nome pelo teclado" | must |
| 9 | U2 | A escolha de recolher volta depois de recarregar; com o armazenamento do navegador bloqueado a barra recolhe e abre do mesmo jeito, só não lembra; entre 768 e 1023 px, sem escolha guardada, abre recolhida | `shell.layout.test.ts`, "a escolha volta depois de recarregar" e "sem armazenamento a barra funciona" | should |
| 10 | U2 | Dentro de um projeto a barra é a dele: "← Todos os projetos", o nome com o seletor de projeto e, sob o nome, o estado do app nas palavras da lista de Projetos ("Em construção · v1", "Publicado · v2", "Ainda sem app"), e as oito seções de hoje nos quatro grupos, cada uma só para quem pode; a página de um agente mantém "Agentes" marcado, e uma conversa do Construir mantém "Construir" | `route.test.tsx`, "a barra do projeto", "o agente aberto marca Agentes" e "a conversa do Construir marca Construir" | must |
| 11 | U2 | Só pelo teclado: depois de Enter em "← Todos os projetos", o Tab seguinte cai num controle da barra do Hub, e "Projetos" tem `aria-current="page"`; recusa: o Tab não recomeça no corpo da folha nem fica preso fora da tela | `apps/web/keyboard.test.ts`, "depois de voltar, o Tab segue na barra" | should |
| 12 | U2 | Configurações e Central usam a mesma moldura: a linha do alto com "← Voltar" (Configurações) ou a marca (Central) e o botão de recolher. O pé das Configurações é Avisos e a conta; o da Central, que não tem empresa, é só a conta, com o e-mail no lugar da empresa; o índice, a busca e os grupos das Configurações ficam como hoje | `apps/web/src/routes/_app/companies/$companyId_/settings/settings.test.tsx` (existente) e `shell.layout.test.ts`, "a mesma linha do alto em toda barra" | must |
| 13 | U2 | O texto e o ícone do item atual passam 3:1 sobre o fundo dele, e o título de grupo passa 4,5:1 sobre a moldura, nos dois temas | `apps/web/contrast.layout.test.ts`, os pares novos | must |
| 14 | U3 | "Buscar ou ir para…" está na linha do alto de toda barra (Hub, projeto, Configurações, Central) e abre a paleta; Ctrl+K e ⌘K a abrem em qualquer tela com sessão, também com o foco num campo de texto; Esc fecha e o foco volta ao elemento de antes; recusa: na entrada e na primeira entrada a tecla não abre nada | `apps/web/palette.layout.test.ts`, "a busca está em toda barra", "abre de qualquer tela e devolve o foco" e "sem moldura não abre" | must |
| 15 | U3 | Digitar "integ" deixa a página Integrações em primeiro e destacada, mesmo havendo uma conversa chamada "Integração com o ERP"; Enter navega e fecha, as setas mudam o destaque; "configuracoes", sem acento, acha Configurações; sem resultado diz "Nada encontrado."; cada página diz o grupo dela | `palette.layout.test.ts`, "achar, escolher e não achar" | must |
| 16 | U3 | Numa empresa a paleta lista, nesta ordem: Ir para (as seções do projeto, quando dentro de um, com o nome dele; as páginas do Hub, Conversas entre elas; as seções das Configurações que a pessoa vê; Central para quem opera), Projetos (a primeira página), Conversas recentes (as 30 da primeira página) e Empresas (as outras empresas de quem tem mais de uma). Na Central: Ir para (Clientes, Estado do Hub) e Empresas (as de quem opera). Se a leitura das conversas ou dos projetos falha, o grupo some e o resto funciona | `apps/web/src/routes/_app/-destinations.test.tsx`, "os grupos e a ordem", "as empresas só para quem tem mais de uma", "na Central" e "uma leitura que falha não derruba a paleta" | must |
| 17 | U3 | A paleta é um diálogo com nome, a lista é uma `listbox`, o Tab não sai dela, não há violação de CSP, a 390 px não há rolagem lateral e as dicas de tecla somem no toque; sob reduzir movimento ela aparece sem animar | `palette.layout.test.ts`, "o diálogo e o celular"; `motion.layout.test.ts`, "com reduzir, nada anima" (caso acrescentado) | must |
| 18 | U4 | A 390 e a 320 px a gaveta traz a barra do lugar inteira (Hub, projeto ou índice das Configurações) com Avisos e a conta com a empresa; a do Hub traz "Nova conversa", Conversas e Recentes; seguir um link fecha a gaveta; "Buscar ou ir para…" fecha a gaveta e abre a paleta; o menu da conta, com "Suas empresas", cabe na tela; sem rolagem lateral | `apps/web/phone-menu.layout.test.ts`, "a gaveta leva a barra do lugar" e "a busca sai da gaveta"; `phone.layout.test.ts` (existente) | must |
| 19 | U2 | No pé da barra, a linha da conta mostra o nome da pessoa e, embaixo, o da empresa; o nome acessível diz "Conta de <pessoa>, em <empresa>". Com uma empresa, o menu da conta não tem "Suas empresas"; com duas ou mais, lista as empresas e escolher outra leva ao Início dela. Na Central, sem empresa, a segunda linha é o e-mail, como hoje; recusa: se a lista de empresas não chega, o menu fica sem "Suas empresas" e o resto dele funciona | `apps/web/src/hub/identity/account-menu.test.tsx`, "a conta mostra a empresa", "uma e duas empresas", "na Central, o e-mail" e "sem a lista de empresas o menu segue" | must |
| 20 | todas | Cada peça nova (`nav`, `command-palette`, `kbd`) tem entrada na vitrine; a vitrine abre sem violação de CSP nos dois temas a 1366 e 390 px; o foco é visível em toda peça | `apps/web/showcase.layout.test.ts`, `pieces.layout.test.ts`, `focus.layout.test.ts` (existentes) | must |
| 21 | todas | A catraca do lint de design não sobe (303 na ponta da R1) | `npm run lint:design -w @conexus/web` | must |
| 22 | U1 | `/companies/<e>/knowledge` mostra, sob o título "Conhecimento", as instruções e as páginas que hoje estão em Configurações › Memória da empresa: todo papel lê, e só quem gerencia a memória salva, como hoje. As Configurações deixam de listar "Memória da empresa"; recusa: o endereço antigo, `/companies/<e>/settings/company-memory`, responde não encontrado | `apps/web/src/agents/assistant/company-memory.test.tsx`, os casos de hoje no endereço novo e "o endereço antigo não existe"; `apps/web/src/routes/_app/companies/$companyId_/settings/settings.test.tsx`, as listas sem a seção; `apps/web/src/routes/__root.test.tsx`, "cada endereço do roteador é uma página que o Hub abre" (existente) | must |
| 23 | U2 | Em toda tela da empresa fora de um projeto, a barra tem "Nova conversa" sob a linha do alto, que abre o Início, e "Recentes" depois dos grupos. Numa conversa aberta e na lista, o lugar atual é Conversas, e não Início. Recolhida, "Nova conversa" é um ícone com a dica e "Recentes" não aparece; recusa: a barra do projeto, a das Configurações e a da Central não têm "Nova conversa" nem "Recentes" | `route.test.tsx`, "a barra tem Nova conversa e Recentes" e "numa conversa o lugar é Conversas"; `settings.test.tsx` e `hub/projects/project-bar.test.tsx`, "a barra do objeto não lista conversas"; `apps/web/shell.layout.test.ts`, "recolhida, Recentes some" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A barra do Hub | aberta a partir de 1024 px, recolhida entre 768 e 1023 | um grupo sem item não aparece; sem conversa, "Recentes" não aparece | a barra desenha na hora: a entrada na empresa já leu o nome dela | a barra fica; o erro é da folha (W34) | · | Agentes e Automações somem para quem não gerencia; o endereço responde não encontrado | sessão vencida: a entrada, como hoje (W15) |
| A barra do projeto | "Construir" marcado | · | o nome do projeto é um esqueleto, e o estado não aparece | o nome vira "Projeto", sem estado, e as seções seguem (como hoje) | a folha diz não encontrado; a barra do projeto fica, com "Projeto" no nome e "← Todos os projetos" | cada seção só para quem pode (`manageAgents`, `manageAutomations`, `viewAppData`) | · |
| A barra das Configurações | "← Voltar", a busca do índice e os grupos de hoje | a busca do índice sem resultado: a frase de hoje | como hoje | como hoje | · | cada seção só para quem pode (`needs`), como hoje | · |
| A barra da Central | Clientes marcado | · | · | · | · | quem não opera recebe não encontrado (S11), como hoje | · |
| A paleta | sem conversa e sem projeto: só "Ir para" | "Nada encontrado." | "Ir para" já está; Projetos e Conversas recentes entram quando chegam | o grupo que falhou some | · | o que a barra não mostra a paleta não acha | · |
| Recentes (na barra) | sem conversa: o grupo não aparece | · | as linhas de esqueleto de hoje (`SidebarMenuSkeleton`) | o grupo some; "Nova conversa" e os lugares seguem | · | todo papel vê as suas | · |
| Conversas | sem conversa: "Nenhuma conversa ainda." (`NO_CONVERSATIONS_BLOCK`) | busca ou filtro sem resultado: as frases de hoje (`NO_CONVERSATION_FOUND`, `NO_CONVERSATION_IN_PLACE`) | três linhas de esqueleto | a frase da leitura e "Tentar de novo" (`ReadFailure`) | · | todo papel vê as suas | · |
| Dados (as abas) | a camada que o endereço diz; sem `layer`, a de hoje | as frases de hoje por camada | a contagem entra quando a leitura chega | a aba fica; o erro é da camada | · | Apps só com `viewAppData`; a nota do Bruto diz a quem não copia o que diz hoje | · |
| A gaveta (celular) | fechada | · | · | · | · | igual à barra | · |
| A conta e a empresa | uma empresa: o nome dela sob o da pessoa, e o menu sem "Suas empresas" | · | o nome da empresa já chegou com a entrada; "Suas empresas" entra quando a lista chega | a lista de empresas falha: o menu fica sem "Suas empresas" | · | só as empresas que o Hub lista | · |
| Conhecimento | sem página: "Nenhuma página guardada ainda." (como hoje) | · | os três esqueletos de hoje | a frase da leitura e "Tentar de novo" (como hoje) | · | quem não gerencia a memória lê, sem "Salvar", com a frase de hoje (`ONLY_MANAGERS_MEMORY`) | "A página mudou enquanto você salvava" (como hoje) |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `NavSection[]` (`HUB_NAV`, `PROJECT_NAV`, `CENTRAL_NAV`) | U2, em `routes/_app/-navigation.ts` | a barra (`SidebarNav`), a gaveta, a paleta (`useHubDestinations`), `-navigation.test.tsx` |
| `NavItem.needs` | U2 | `seen()`, o único filtro de permissão da barra e da paleta |
| `NavItem.to`, `label`, `icon` | U2 | `SidebarNav` (o link, o nome e a dica); a paleta (o destino e o nome) |
| `NavItem.exact`, `NavItem.places` | U2 | `SidebarNav`, para marcar o lugar atual: `exact` só no próprio endereço, `places` também quando a rota à vista tem um desses `staticData.place` |
| `PAGES` (os endereços que o Hub responde) | U1, em `packages/hub-api/src/pages.ts`: entram `/companies/$companyId/conversations` e `/companies/$companyId/knowledge`, sai `/companies/$companyId/settings/company-memory` | `apps/server/src/platform/screens.ts` (o Hub abre a página em cada um); `routes/__root.test.tsx` (prende o roteador à lista) |
| `Head.note` da cabeça da barra | U2, em `ui/sidebar-selector.tsx` | `ProjectRailHead`, com o estado do app |
| a escolha `conexus-sidebar` no navegador | `Frame`, por `platform/sidebar.ts` | `Frame`, ao montar |
| `PaletteGroup[]` | U3, em `routes/_app/-destinations.tsx` | `ui/command-palette.tsx` |

Os desenhos de caixas. A 1280 px, a barra do Hub e a do projeto:

```text
+--------------------------+------------------------------------------------+
| [C] Conexus         [<<] |                                                |
| [ Buscar ou ir…  Ctrl K ]|   a folha, encaixada na moldura grafite        |
| [ + Nova conversa       ]|                                                |
|  Início                  |   Dados                                        |
|  Conversas               |   [ Negócio 0 ][ Bruto 12 ][ Apps ]            |
| Dados e contexto         |   ...                                          |
|  Integrações             |                                                |
|  Dados              <--  |                                                |
|  Conhecimento            |                                                |
| Agentes                  |                                                |
|  Agentes                 |                                                |
|  Automações              |                                                |
| Apps                     |                                                |
|  Projetos                |                                                |
| Recentes                 |                                                |
|  Quanto vendemos de pã…  |                                                |
|  Quais encomendas venc…  |                                                |
|                          |                                                |
|  Avisos              (2) |                                                |
|  Configurações           |                                                |
|  (MS) Marina Souza    v  |                                                |
|       Padaria Sol        |                                                |
+--------------------------+------------------------------------------------+

+--------------------------+     recolhida        a 390 px
| <- Todos os projetos [<<]|     +----+          +---------------------+
| [ Buscar ou ir…  Ctrl K ]|     |[>>]|          | [=] Conexus   Dados |
| [P] Pedidos de enc.   v  |     | Q  |          +---------------------+
|     Em construção · v1   |     | o  |          |   a folha           |
| O app                    |     | -- |          |                     |
|  Construir          <--  |     | o  |          +---------------------+
| Agentes                  |     | o  |          a gaveta: a mesma barra
|  Conversas               |     | o  |          do lugar, de cima a
|  Agentes                 |     | -- |          baixo, com a busca,
|  Automações              |     | o  |          Avisos e a conta
| Dados                    |     | o  |
|  Integrações             |     | o  |
|  Dados                   |     |    |
| O Projeto                |     | o  |
|  Quem usa o app          |     | o  |
|  Sobre                   |     |(MS)|
|  ...o mesmo pé           |     +----+
+--------------------------+
```

A paleta, a 1280 px, centrada no alto da folha, com 36 rem de largura no máximo; a 390 px ocupa a
largura menos 8 px de cada lado:

```text
+----------------------------------------------+
| Q  Buscar ou ir para…                        |
+----------------------------------------------+
| Ir para                                      |
| > Integrações            Dados e contexto    |
|   Dados                  Dados e contexto    |
|   Pessoas e convites     Configurações       |
| Projetos                                     |
|   Pedidos de encomenda                       |
| Conversas recentes                           |
|   Quanto vendemos de pão francês?     há 2 h |
+----------------------------------------------+
| ↑↓ escolher   Enter abrir   Esc fechar       |
+----------------------------------------------+
```

As capturas que a etapa segue ficam fora do repositório, com o estudo. A barra, o pé e a barra do
projeto seguem as capturas `fase4-v2` dos protótipos das jornadas, a versão que o fundador aprovou
(`j2-01-inicio`, `j3-01-agentes`, `j4-02-pj-construir`, `j4-08-projetos`, `j1-09-integracoes`, a 1366 e
a 390 px). A barra recolhida, a paleta vazia e filtrada, as Configurações e as três gavetas a 390 px
seguem as capturas `n4-*` do primeiro protótipo de navegação, que a versão 2 não redesenhou. O quadro
das decisões (`quadro.html`, na pasta do estudo) põe cada opção ao lado delas. As telas do Mobbin que
apoiam cada peça, da coleção "Conexus redesenho" e de seis buscas novas (visto, 2026-11-26):

| Peça | Telas |
| --- | --- |
| Barra com grupos titulados | [Databricks](https://mobbin.com/screens/c02170fd-f44b-42c0-8fd2-59a04b9ad0b0), [WRITER](https://mobbin.com/screens/12b0cb54-3641-4133-9d7c-d96f6d68aa58), [Vercel](https://mobbin.com/screens/8e385d03-bd42-4376-b1de-62263908900a), [Customer.io](https://mobbin.com/screens/0ca9f73c-0002-4c69-a0b4-83666a66add5), [Whop](https://mobbin.com/screens/c7a429c8-a0cd-4460-b9ca-1a5e265f83b9) (barra escura), [Dropbox Dash](https://mobbin.com/screens/3695f322-3bac-43a3-8e96-e589434c3031) (barra escura, "Search ⌘K" no alto) |
| Recolhida em ícones | [n8n](https://mobbin.com/screens/f248416d-fdae-4cb5-918f-50709158cf82), [Airtable](https://mobbin.com/screens/e110986b-0ea3-46f0-bc68-68cdbdf7f1ea) |
| A barra do objeto, com a volta no alto | [Gumloop](https://mobbin.com/screens/490f3e5a-96c0-487a-b1fa-bd9fe707f8c0) (a seta de volta, o nome do agente e as seções dele, com a busca e o recolher no alto), [Intercom, "← Customize"](https://mobbin.com/screens/67498dfd-0079-4b66-9cd4-2ce6d41fc87a), [Intercom Fin](https://mobbin.com/screens/16c18036-56a1-4ea3-9bba-561c7da42cdc), [Cursor, "Back to Agents"](https://mobbin.com/screens/cf9a5441-7462-4d39-af22-5d52cec1a0ed), [Lovable](https://mobbin.com/screens/f89924d9-2ea2-4c9e-98dc-05001f4d4bd5), [GitLab](https://mobbin.com/screens/3a76a592-1c75-44ec-867c-72aefcec845d) |
| As conversas de antes e a nova conversa (decisão C) | as recentes dentro da barra larga, com "New chat" no alto: [Claude](https://mobbin.com/screens/7f488e21-04bc-4523-8ac5-b2038e7977fd), [ChatGPT](https://mobbin.com/screens/efb593c5-be61-47d5-a2bd-87aab6056cd2), [Gemini](https://mobbin.com/screens/9d72be69-e520-4406-9cb7-b8c7b7cb7c73), [Langdock](https://mobbin.com/screens/c4e7cdc1-9038-449d-8787-cd5889e08e94), [WRITER](https://mobbin.com/screens/c3f8b744-4ff6-4f1c-8d95-5d9f56da86a3), [Dropbox Dash](https://mobbin.com/screens/824a3c3d-e26f-4916-9df1-963eb0eca8f5); a segunda coluna só na área do assistente: [Remote](https://mobbin.com/screens/9effb1a2-c07f-4697-b046-99a47370714f) (com a barra larga), [ClickUp](https://mobbin.com/screens/0464978f-1b51-41d4-81a3-3c09084fd7a2), [Plane](https://mobbin.com/screens/567b285a-8208-4b65-b8fb-fd37b2c11237) e [Productboard](https://mobbin.com/screens/2de4d34c-149a-4bf8-bcbf-3c0938fe2501) (com um trilho fino); só o botão e um lugar, com as recentes na página inicial: [Gumloop](https://mobbin.com/screens/077b229c-378b-45fd-a9da-19db94513771), [SchoolAI](https://mobbin.com/screens/9f4e0804-c3ff-4456-aa14-07c8d7ad852f), [Notion](https://mobbin.com/screens/176a7fae-1de4-4d50-a28b-cb14eef8b18b). Nenhum dos dezenove produtos vistos põe a lista ao lado de toda área |
| Agentes como um lugar, ou na barra | [Jasper, "Agent Library"](https://mobbin.com/screens/0d8f01c3-fc8a-4fe1-ac4a-d5468914ab31) (um lugar), [Langdock](https://mobbin.com/screens/fe015a4f-7142-45d9-a899-4a724d011d0e) (uma árvore na barra); os Galts do G4 OS, abertos no computador (cada um uma linha, com o estado) |
| Paleta de comando | [Vapi](https://mobbin.com/screens/593d7acd-2e16-4365-bcd6-02ce52f48f3b) (cada página com a área), [Mistral](https://mobbin.com/screens/8450c1c7-7c10-40a3-9af3-c9c234ac4b53), [Base44](https://mobbin.com/screens/675ecfd2-b7fc-4e8d-9078-3eeeaddda7c7) (objetos e páginas), [incident.io](https://mobbin.com/screens/907900ee-1dca-4726-ae50-9e043eecfbe4), [n8n](https://mobbin.com/screens/28338d7a-25d5-4fd0-8357-9a770b30ac00), [Mintlify](https://mobbin.com/screens/7c7ad31f-9dfe-4be7-83d7-6002fe31d4d0) |
| A conta com a empresa, e a troca | no pé, pela conta: [hilos](https://mobbin.com/screens/392e6413-c649-4ff9-82fd-65ec02979ebc), [Snowflake](https://mobbin.com/screens/41e8b27f-bbca-4be6-9136-a536e37c17b4) (a troca de conta no menu do usuário); no alto: [Vercel, "Find Team…"](https://mobbin.com/screens/7be05ea5-e875-439d-bd1f-7aef97281d3b), [Contra](https://mobbin.com/screens/90be82ab-baa4-4743-9546-3089d12a763e), [Postman](https://mobbin.com/screens/1ecfc49b-a8f1-49dc-9d10-da70f8d9315f). As duas formas existem; a etapa segue a versão 2 |
| A conversa como lugar | [Claude](https://mobbin.com/screens/ef4dc71f-9d6e-4b35-89d7-26c2393c58c0), [ChatGPT](https://mobbin.com/screens/efb593c5-be61-47d5-a2bd-87aab6056cd2), [Langdock](https://mobbin.com/screens/fe015a4f-7142-45d9-a899-4a724d011d0e) |

A crítica da forma (Impeccable `critique`, por um leitor de outro modelo, só sobre as capturas) deu
22 de 40 ao primeiro protótipo de navegação e cinco achados; cada um virou critério: a volta leva ao
pai imediato e o projeto mostra as seções reais (10); a troca de empresa, a conta e o sino continuam
na barra (4, 19); a mesma linha do alto em toda barra, e a barra do objeto também recolhe (8, 12); a
paleta acha conversas, projetos e seções das Configurações, e esconde as teclas no toque (16, 17); um
filtro só de permissão (5). A versão 2 tem a mesma barra do primeiro protótipo (os mesmos grupos, o
mesmo pé) e mudou o que está dentro das telas, que a crítica não julgou; por isso os cinco achados
seguem valendo, e a crítica não foi refeita sobre a versão 2. O detector não achou nada na página do protótipo, mas ela é montada por script e ele leu só o
arquivo; a conferência no navegador é do ponto de conferência de cada grupo.

As peças de `ui/` que a etapa usa: `sidebar`, `sidebar-selector`, `sidebar-trigger`, `frame`,
`tooltip`, `dialog`, `dropdown-menu`, `popover`, `tabs`, `pager`, `skeleton`, `block`, `states`,
`page-header`, `settings-index`, `settings-section`. Sai:
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
os caminhos a partir de `apps/web/src`. "A navegação" é a do pedido e do objeto, que o fundador
escolheu em 2026-11-26; "a v2" é a versão 2 dos protótipos das jornadas, que ele aprovou no mesmo dia.

| # | Peça | Unidade | O que o fundador já decidiu | Hoje | Referência | Como a referência faz | Veredito | Prova | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A navegação em dados | U2 | a navegação; "Cada capacidade ... uma lógica só" | `routes/_app/companies/$companyId/route.tsx:44-96` (`RailPlaces`, à mão); `hub/projects/project-rail.tsx:73-145` (`RAIL`); `routes/_app/operations/route.tsx:19-26` | MA `lib/nav/nav-items.tsx:24-39` e `components/ui/app-sidebar.tsx:83-108,143-145` (mesma situação) | `NavSection[]` com `NavItem`; a barra filtra e desenha as seções **lido** | nativo | · | D | `routes/_app/-navigation.ts` |
| 2 | Os grupos com título | U2 | o fundador, 2026-11-26: B-b, três títulos; a navegação; a v2 (dois títulos); a visão ("Na tela elas se chamam ..."); mapa 3 (2026-11-17, três grupos num trilho sem título escrito) | `ui/sidebar.tsx:245-266` (`SidebarGroup`, `SidebarGroupLabel`, já existem) | SH `ui/sidebar.tsx:389-425`; SH `blocks/sidebar-07/components/nav-main.tsx:20-37` (mesma situação) | um grupo, o rótulo e o menu por seção **lido** | nativo | · | B | `ui/nav.tsx` |
| 3 | Recolher para ícones, com a dica | U2 | mapa 5.3, itens 3 e 4 (2026-11-17); decisão 2 (a largura troca na hora) | `ui/sidebar.tsx:144-175,304-328` | SH `ui/sidebar.tsx:152-163,212,508-560` (mesma situação) | `data-collapsible="icon"`; a dica só aparece recolhida e fora do celular **lido** | nativo | · | não precisa | · |
| 4 | O botão de recolher à vista | U2 | mapa 5.3, item 3 | `ui/sidebar.tsx:178-192` (uma borda de 12 px, fora do Tab) | SH `ui/sidebar.tsx:254-285` (`SidebarTrigger`); MA `app-sidebar.tsx:112-125` (no cabeçalho, ao lado da marca) | um botão que chama `toggleSidebar` **lido** | nativo | · | não precisa | · |
| 5 | A escolha guardada | U2 | mapa 5.3, item 4: "fica guardada no navegador" | `ui/frame.tsx:131-133,152` (só `useState`) | SH `ui/sidebar.tsx:28-29,86` (cookie); `platform/theme.ts:16,35,52-53` (o tema, em `localStorage`) | grava ao trocar e lê ao montar **lido** | embrulhado: a nossa guarda em `localStorage`, sem cookie, como o tema | · | não precisa | `platform/sidebar.ts` |
| 6 | A largura | U2 | mapa 5.3, item 1 ("perto de 240"); a navegação | `brand/tokens.css:116,118` (56 e 328 px); `DESIGN.md:160,162` | SH `ui/sidebar.tsx:30,32` (16 e 3 rem) | troca de valor | nativo | · | não precisa | · |
| 7 | A linha do alto: a marca ou a volta, a busca, recolher | U2 | mapa 5.3, item 2 (a marca e o nome na mesma linha) | `ui/frame.tsx:155-165` (a marca no trilho) | MA `app-sidebar.tsx:112-125` (`Header` com `Brand`, `SearchTrigger`, `Trigger`) (mesma situação) | uma faixa fixa no alto de toda barra **lido** | nativo | · | não precisa | · |
| 8 | A barra do objeto (projeto) | U2 | a navegação; a v2 (a volta, o nome com o estado, cinco seções); W31 (as oito seções, 2026-10-30) | `hub/projects/project-rail.tsx:38-71,153-183`; `route.tsx:122-143` | MA `domains/agent-builder/layouts/agent-builder-sidebar.tsx:68-99` (mesma situação: a barra troca pela do lugar, com a volta ao Studio); [Gumloop](https://mobbin.com/screens/490f3e5a-96c0-487a-b1fa-bd9fe707f8c0) **visto** | a mesma peça `Sidebar` com outros links e o link de volta no alto **lido** | nativo | · | F | · |
| 9 | Configurações como lugar | U2 | W32 | `routes/_app/companies/$companyId_/settings/route.tsx:30-45,52-103` | MA (idem linha 8) | fica; muda só a moldura | nativo (fica) | · | não precisa | · |
| 10 | A paleta de comando | U3 | a navegação (Ctrl+K) | nenhum | BU `autocomplete.md:3204-3324` ("Command palette") (mesma situação); MA-ui `ds/components/CommandPalette/`, sobre `cmdk` (situação diferente: dependência que o Hub não tem) | `Dialog` com `Autocomplete.Root open inline autoHighlight="always" keepHighlight`, itens em grupos, `Autocomplete.Empty` (`:3242-3248,3266-3299`) **lido** | nativo, sem dependência nova | · | não precisa | `ui/command-palette.tsx` |
| 11 | As páginas da paleta saem da navegação | U3 | a navegação | nenhum | MA `lib/command/navigation-command.tsx:463-490,511-534` (mesma situação) | as seções da paleta são `mainNav` com o mesmo filtro da barra **lido**; lá o filtro está escrito duas vezes, aqui é um (`seen`) | nativo | · | não precisa | `routes/_app/-destinations.tsx` |
| 12 | A tecla Ctrl+K | U3 | a navegação | `ui/sidebar.tsx:56-66` (o mesmo padrão, para Ctrl+B) | MA `lib/command/use-navigation-command.ts:42-54` | um ouvinte de `keydown` em `document` com `metaKey` ou `ctrlKey` **lido** | nativo | · | não precisa | · |
| 13 | A tecla desenhada | U3 | · | nenhum | SH `ui/kbd.tsx:3-14` | um `kbd` com classe **lido** | nativo (cópia) | · | não precisa | `ui/kbd.tsx` |
| 14 | O gatilho "Buscar ou ir para…" | U3 | a navegação | nenhum | MA `app-sidebar.tsx:59-62,117-123` (mesma situação; lá some no celular, aqui fica na gaveta, como o protótipo de navegação) | um botão na barra com o atalho escrito, que abre a paleta e fecha a gaveta **lido** | nativo | · | não precisa | · |
| 15 | A lista de conversas numa página | U1 | o fundador, 2026-11-26: C-a; a navegação; mapa 4 (conversas só no Início) | `agents/assistant/sidebar-conversations.tsx:115-232`; `agents/assistant/day.tsx:23-78` | [Claude, "Chats"](https://mobbin.com/screens/ef4dc71f-9d6e-4b35-89d7-26c2393c58c0) (mesma situação) e [SchoolAI, "Session history"](https://mobbin.com/screens/9f4e0804-c3ff-4456-aa14-07c8d7ad852f) **visto**; o código é o de hoje | a lista inteira como um lugar | nativo | · | C | `agents/assistant/conversations-page.tsx` |
| 16 | As camadas de Dados em abas | U1 | a navegação (uma barra só); o mapa 4 punha a árvore na coluna | `hub/copies/data-tree.tsx:33-58,104-113` | [Databricks](https://mobbin.com/screens/c02170fd-f44b-42c0-8fd2-59a04b9ad0b0) (a árvore é painel do catálogo) **visto**; BU `tabs.md` | três abas que mudam o `layer` do endereço | nativo | · | D | · |
| 17 | A gaveta do celular | U4 | V56 (2026-11-01); mapa 7 | `ui/sidebar.tsx:124-142`; `ui/frame.tsx:88-127` | SH `ui/sidebar.tsx:182-205` (a mesma barra dentro da `Sheet`) **lido** | no celular os filhos da barra vão para a gaveta | nativo (fica) | · | D | · |
| 18 | A conta com a empresa, e a troca | U2 (a paleta, U3) | a v2 (a empresa sob o nome, no pé); W30 ("Suas empresas") | `hub/identity/company-switcher.tsx:17-42` (a lista, num menu no alto); `hub/identity/account-menu.tsx:36-124` (o nome e o e-mail) | SH `blocks/sidebar-07/components/nav-user.tsx:41-52,68-79` (a conta no pé, com duas linhas e o menu); [hilos](https://mobbin.com/screens/392e6413-c649-4ff9-82fd-65ec02979ebc) e [Snowflake](https://mobbin.com/screens/41e8b27f-bbca-4be6-9136-a536e37c17b4) **visto** (a troca pelo menu da conta); SB `AppLayout/OrganizationDropdown.tsx:60-101` (situação diferente: no alto, com busca, sobre `cmdk`) | a linha da conta com o lugar embaixo do nome, e a lista de lugares no menu dela | nativo (fica): o grupo "Suas empresas" muda do menu do alto para o da conta, sem peça nova; quem tem muitas acha pela paleta | · | não precisa | · |
| 19 | O sino e a conta no pé | U2 | W30 (2026-11-02, "Opção 1"); a v2 (a linha "Avisos") | `route.tsx:109-120`; `hub/notifications/bell.tsx:182-213` (um botão de ícone com a contagem, "Notificações"); `hub/identity/account-menu.tsx:36-124` | SH `blocks/sidebar-07/components/nav-user.tsx` (a conta no pé) | ficam; sai a variante `compact` da conta, e o sino passa de botão de ícone a linha com o nome "Avisos" e a contagem | nativo (fica) | · | não precisa | · |
| 20 | O teclado na troca de barra | U2 | V30 | nenhum código de foco em `ui/frame.tsx` nem nas rotas | MA `domains/agent-builder/layouts/agent-builder-sidebar.tsx:68-99` (mesma situação) | troca a barra sem código de foco **lido**; o link some com a barra e o navegador segue o Tab do ponto onde ele estava | nativo | · | não precisa | · |
| 21 | A vitrine e a CSP | todas | W22, V17, V62 | `ui/showcase/navigation.tsx`; `showcase.layout.test.ts` | · | o harness já abre a vitrine com a CSP | nativo | · | não precisa | · |
| 22 | A barra do agente | fica de fora: R5 (decisão A) | a v2 (Conversa, Entregas, Rotinas, Ficha, Execuções; três sem desenho) | `agents/saved-agent/agent-page.tsx:87-94,177-181` (uma tela, com a volta "← Agentes" para o projeto) | [Gumloop](https://mobbin.com/screens/490f3e5a-96c0-487a-b1fa-bd9fe707f8c0) e [Intercom Fin](https://mobbin.com/screens/16c18036-56a1-4ea3-9bba-561c7da42cdc) **visto** | a barra troca pelas seções do agente | nativo (dados), fora | · | A | · |
| 23 | Conhecimento na barra | U1 (a tela) e U2 (a linha da barra) | mapa 3.1 (2026-11-17: "o item nasce com o que já existe"); mapa 6.1 ("vai para Conhecimento"); a v2 | `routes/_app/companies/$companyId_/settings/company-memory.tsx:5-18`; `agents/assistant/company-memory.tsx:17,98-152`; `packages/hub-api/src/pages.ts:52` | MA `lib/nav/nav-items.tsx:24-39` (mesma situação: um lugar é uma linha de dados) | a tela de hoje no endereço novo, com uma linha na navegação **lido** | nativo (fica): a tela muda de endereço, não de conteúdo | · | não precisa | `routes/_app/companies/$companyId/knowledge.tsx` |
| 24 | A busca de conversas no servidor pela paleta | fica de fora | · | · | BU `autocomplete.md:414` ("Async search") | · | nativo, fora | · | · | · |
| 25 | O estado sob o nome do projeto | U2 | a v2 ("Projeto · Em construção" sob o nome) | `hub/projects/project-rail.tsx:38-71`; `hub/projects/project-state.ts:9-17,33-44` (as palavras do estado, já usadas na lista); `ui/sidebar-selector.tsx:6-22` (a cabeça só tem o título) | SH `blocks/sidebar-07/components/team-switcher.tsx:43-56` (a cabeça com duas linhas: o nome e o plano); [Gumloop](https://mobbin.com/screens/490f3e5a-96c0-487a-b1fa-bd9fe707f8c0) **visto** | uma segunda linha na cabeça da barra | nativo: um campo opcional na cabeça, com as palavras que já têm dono | · | não precisa | · |
| 26 | Os endereços novos na lista do Hub | U1 | web W1 | `packages/hub-api/src/pages.ts:6-67`; `apps/server/src/platform/screens.ts:22-31`; `routes/__root.test.tsx:53-56` | o próprio Hub: cada tela nova entrou assim | uma linha por endereço, e o teste prende o roteador à lista | nativo | · | não precisa | · |
| 27 | A barra do projeto com as cinco seções da v2, e "Arquivos" | fica de fora (decisão F) | a v2; mapa 1 e 5 (o Projeto como a casa dos agentes e das automações, J1, 2026-10-30) | `hub/projects/project-rail.tsx:81-145` | [Lovable](https://mobbin.com/screens/f89924d9-2ea2-4c9e-98dc-05001f4d4bd5) **visto** (lista curta, sem grupos) | · | nativo (dados), fora: depende da regra de onde o agente mora | · | F | · |
| 28 | "Nova conversa" na barra | U2 | o fundador, 2026-11-26 ("alguma coisa como new chat"; C-a) | `agents/assistant/sidebar-conversations.tsx:41-53` (`NewConversation`, hoje no alto da coluna); `route.tsx:136-139` | [Claude](https://mobbin.com/screens/7f488e21-04bc-4523-8ac5-b2038e7977fd), [ChatGPT](https://mobbin.com/screens/efb593c5-be61-47d5-a2bd-87aab6056cd2), [Gemini](https://mobbin.com/screens/9d72be69-e520-4406-9cb7-b8c7b7cb7c73), [Langdock](https://mobbin.com/screens/c4e7cdc1-9038-449d-8787-cd5889e08e94), [Gumloop](https://mobbin.com/screens/077b229c-378b-45fd-a9da-19db94513771) **visto** | o botão no alto da barra, antes dos lugares | nativo (fica): o mesmo link, na barra nova | · | C | · |
| 29 | As conversas recentes na barra | U1 (a lista curta) e U2 (o lugar na barra) | o fundador, 2026-11-26 ("para facilitar"; C-a) | `agents/assistant/sidebar-conversations.tsx:183-232`; `agents/assistant/conversation-row.tsx` | SH `blocks/sidebar-07/components/nav-projects.tsx:32-46` (um grupo de itens da barra, escondido quando recolhida); [Claude](https://mobbin.com/screens/7f488e21-04bc-4523-8ac5-b2038e7977fd), [ChatGPT](https://mobbin.com/screens/efb593c5-be61-47d5-a2bd-87aab6056cd2), [Gemini](https://mobbin.com/screens/9d72be69-e520-4406-9cb7-b8c7b7cb7c73), [Langdock](https://mobbin.com/screens/c4e7cdc1-9038-449d-8787-cd5889e08e94), [WRITER](https://mobbin.com/screens/c3f8b744-4ff6-4f1c-8d95-5d9f56da86a3), [Dropbox Dash](https://mobbin.com/screens/824a3c3d-e26f-4916-9df1-963eb0eca8f5) **visto** | as recentes num grupo no fim da barra, sem busca nem abas | nativo (fica): a lista de hoje, mais curta | · | C | · |
| 30 | "Conversas" como lugar da barra | U2 | o fundador, 2026-11-26: C-a | `routes/_app/companies/$companyId/conversations/` (hoje só a conversa aberta) | [Claude, "Chats"](https://mobbin.com/screens/7f488e21-04bc-4523-8ac5-b2038e7977fd) e [SchoolAI, "Session history"](https://mobbin.com/screens/9f4e0804-c3ff-4456-aa14-07c8d7ad852f) **visto**; MA `lib/nav/nav-items.tsx:24-39` | a lista inteira é uma linha da navegação | nativo: uma linha de dados | · | C | · |
| 31 | A segunda coluna de conversas, só onde se conversa ou em toda tela | fica de fora (decisão C: o fundador escolheu a C-a) | o fundador, 2026-11-26 (a pergunta, e a escolha) | `route.tsx:132-143` (a coluna de hoje, em quase toda área) | [Remote](https://mobbin.com/screens/9effb1a2-c07f-4697-b046-99a47370714f), [ClickUp](https://mobbin.com/screens/0464978f-1b51-41d4-81a3-3c09084fd7a2), [Plane](https://mobbin.com/screens/567b285a-8208-4b65-b8fb-fd37b2c11237), [Productboard](https://mobbin.com/screens/2de4d34c-149a-4bf8-bcbf-3c0938fe2501) **visto**: só na área do assistente, e em três dos quatro ao lado de um trilho fino | · | nativo (fica), fora: a moldura voltaria a ter duas colunas | · | C | · |

**A medida do transplante.** Nenhuma parte trazida do produto antigo. Três peças de hoje mudam de
lugar sem mudar de dono: a lista de conversas (232 linhas, cerca de 60 mudam), as camadas de Dados e a
tela da memória da empresa (152 linhas, cerca de 25 mudam).

**A dívida.** As seções das Configurações seguem declaradas em cada rota (`staticData.section`), ao lado
do arquivo de navegação, que só ganha o gancho que as lê: juntar é da etapa de Configurações. A paleta
acha as páginas, os projetos da primeira página e as 30 conversas mais recentes; não acha um agente, uma
automação nem uma ligação pelo nome. O rótulo de um lugar existe no arquivo de navegação e no
`staticData.place` da rota, que o alto do celular lê; o critério 6 confere os endereços, não os nomes.

**As issues `next-card`.** A #1235 tem gatilho na próxima mudança de `ui/picker.tsx`: a etapa não muda
o arquivo (a troca de empresa fica no menu da conta, e o seletor de projeto segue como está), e os
itens dela esperam. Nenhuma outra issue `next-card` aberta fala da moldura, da barra ou da gaveta.

## As decisões do firstmate

| # | Decisão reversível (delivery L6) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | A navegação num arquivo de dados em `routes/_app/-navigation.ts`, e não no `staticData` de cada rota | duas formas comparadas. Um arquivo: MA e SH fazem assim, a ordem e os grupos se leem de uma vez, e a paleta lê a mesma lista. Em cada rota: é como as Configurações fazem hoje, mas espalha a ordem por trinta arquivos. Só as rotas desenham a moldura, e um assunto não importa rota (W8); o gerador ignora arquivo que começa com `-` (`@tanstack/router-generator` 1.167.44, `config.js:23`) | mover o arquivo; os tipos ficam em `ui/nav.tsx` |
| 2 | A escolha de recolher guardada por navegador, na chave `conexus-sidebar`, como o tema (`conexus-theme`) | um dono por fato e a mesma forma do que já existe (`platform/theme.ts:16`) | trocar a chave |
| 3 | A paleta lista as 30 conversas da primeira página, sem buscar no Hub | a leitura já está em cache pelo Início; a busca completa mora na página Conversas | ligar o exemplo "Async search" do Base UI |
| 4 | A troca de barra é de uma vez; só a folha esmaece | a folha de movimento: "a barra não pisca" (`DESIGN.md:581-582`) | um `view-transition-name` na barra |
| 5 | "← Voltar" das Configurações segue levando ao Início da empresa | é o que W32 e o código fazem hoje; voltar à última tela do Hub pede guardar o lugar | um cartão das Configurações |
| 6 | Na paleta as páginas vêm antes das conversas | o primeiro trabalho da paleta é ir a um lugar: "integ" e Enter abre Integrações mesmo com uma conversa de nome parecido (critério 15) | trocar a ordem dos grupos em `-destinations.tsx` |
| 7 | Na Central a paleta lista Clientes, Estado do Hub e as empresas de quem opera | a Central não tem empresa, então não tem conversas, projetos nem Configurações; as empresas são o que o alto da Central já oferece (`hub/operations/central-header.tsx:15-35`) | tirar o grupo Empresas |
| 8 | A troca de empresa é a lista "Suas empresas" no menu da conta, sem busca; quem tem muitas acha a empresa pela paleta | a v2 põe a empresa sob o nome, no pé; a lista já existe como grupo de menu (`hub/identity/company-switcher.tsx:28-38`) e muda de menu sem peça nova; hilos e Snowflake trocam pela conta | voltar a `CompanySwitcher` para o alto da barra, pela propriedade `header` da moldura |
| 9 | O endereço antigo da Memória da empresa deixa de existir, sem redirecionar | nenhuma tela, notificação ou ferramenta aponta para ele: a busca por `settings/company-memory` em `9803bb90` só acha a rota e os testes dela | uma rota de redirecionamento e a linha de volta em `PAGES` |
| 10 | "Buscar ou ir para…" fica em toda barra, também na do projeto e no índice das Configurações, embora a v2 só o desenhe na barra do Hub | a crítica da forma pediu a mesma linha do alto em toda barra; no celular não há Ctrl+K; o Gumloop mantém a busca dentro do agente | tirar o gatilho das barras de objeto em `ui/frame.tsx` |
| 11 | Sob o nome do projeto vai `projectStateText`, como está ("Em construção · v1"), sem a palavra "Projeto ·" da v2 | um dono por frase (`hub/projects/project-state.ts:33-44`); a volta, logo acima, já diz "Todos os projetos" | trocar a frase em `ProjectRailHead` |
| 12 | O nome do projeto na barra mantém o seletor de projeto de hoje, que a v2 não desenha | trocar de projeto sem voltar à lista já existe (`hub/projects/project-rail.tsx:38-71`) e tirar seria perder uma função numa etapa de moldura | passar só o nome e o estado, sem `SidebarSwitch` |
| 13 | O lugar se chama "Conhecimento"; as frases da conversa e da tela que dizem "memória da empresa" (`agents/assistant/text.ts:103-111`) ficam como estão | a tela é da trilha Dados (ficha TD11), e o nome do que o Assistente guarda é assunto dela; a R2 só dá o lugar na barra | trocar as frases em `text.ts`, numa etapa da trilha Dados |
| 14 | A linha da conta lê a empresa como `CompanySwitcher` lê hoje (`useSuspenseQuery`), sem estado de carregando nem de erro próprio | `enterHouse` lê a empresa antes de a moldura montar (`hub/identity/enter-company.ts`); um esqueleto ali nunca apareceria pela porta pública | · |
| 15 | "Recentes" mostra até oito conversas, sem os dias; quando não cabem, a barra rola | a primeira página que a lista já lê tem trinta; os dias, a busca e o filtro estão na página Conversas; Claude e Gemini listam as recentes sem dias | mudar o número em `sidebar-conversations.tsx` |
| 16 | A página Conversas não repete "Nova conversa" no alto | o botão está na barra em toda tela; a crítica da forma apontou os dois na mesma tela | passar o botão em `actions` do `PageHeader` |
| 17 | Entre a U1 e a U2 a página Conversas e Conhecimento só abrem pelo endereço | as duas unidades saem no mesmo pull request (G1); nenhuma versão publicada fica sem a porta | levar o passo 4 da U1 para a U2 |
| 18 | As telas das opções da decisão C usam o miolo do Início da versão 2, que a R2 não constrói (G-a) | o fundador escolhe a moldura vendo-a sobre o protótipo que aprovou | · |

## O que a aprovação muda nos documentos

O pull request de método da decisão D, só de documentos (delivery L20), antes da U1:

- web W30: o trilho de ícones e a coluna do lugar viram a barra com grupos; os três grupos de
  2026-11-02 ganham título escrito (decisão B); a lista de conversas sai da coluna: "Nova conversa", o lugar
  "Conversas" e "Recentes" ficam na barra do Hub (decisão C); as camadas de Dados e a lista de páginas de
  Conhecimento vão para a página; a escolha de recolher fica no navegador; a empresa fica na linha da
  conta, e "Suas empresas" passa ao menu dela.
- web W31: a barra do projeto leva "← Todos os projetos" no alto e o estado do app sob o nome.
- design V56: a gaveta leva a barra do lugar, e não o trilho com a coluna.
- design V34: o ícone de 20 px era do trilho; a barra usa o do menu.
- `docs/explanation/mapa.md`, seções 1 (a moldura), 3, 4, 5.3 e 7; a árvore de web W1, se
  `routes/_app/-navigation.ts` pedir.
- Uma regra nova em web: a navegação é declarada em dados num arquivo só, e a barra, a gaveta e a
  paleta leem dele com um filtro só de permissão.

A página da trilha já traz, com as palavras do fundador: a ordem das etapas (a R2 logo depois da R1),
o quadro no começo e no fim de cada etapa e as seis respostas de 2026-11-26. Por elas, a frase da R2
perdeu "num agente ou" (A-a) e a linha da R6 perdeu "a casa do pedido (Início) vai com `R2`" (G-a).

## U1 As listas saem da coluna e Conhecimento ganha o lugar

**Base e modelo.** `main` com a R1 e o pull request de método da decisão D. Sonnet: mover uma lista,
trocar uma árvore por abas e mudar uma tela de endereço, dentro de dois assuntos.

### As linhas da tabela

15, 16, 23, 26 e 29 (a lista curta). Ler `agents/assistant/sidebar-conversations.tsx` inteiro, `list-view.ts`,
`day.tsx:23-78,125-150`, `conversation-row.tsx`, `place-filter.tsx`, `projects-tab.tsx`, `text.ts`,
`ui/block.tsx`; a rota do Início (`routes/_app/companies/$companyId/index.tsx:33-45`, o
`validateSearch`); `hub/copies/data-tree.tsx` inteiro e `data-page.tsx`; `route.tsx:132-143` (onde a
coluna as desenha hoje); `agents/assistant/company-memory.tsx` inteiro,
`routes/_app/companies/$companyId_/settings/company-memory.tsx`, `ui/page.tsx`, `ui/page-header.tsx`;
`packages/hub-api/src/pages.ts:6-67` e `routes/__root.test.tsx:53-56`. Seguir as telas do Claude e do
Databricks da tabela do Mobbin.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `agents/assistant/sidebar-conversations.tsx` e os seus dois testes | muda: `SidebarConversations` vira a lista curta "Recentes" (as oito primeiras da primeira página, sem busca, filtro por lugar, abas, dias nem paginador); `NewConversation` fica; os casos de busca, filtro, abas e paginador dos dois testes passam para o teste da página | `agents/assistant/public.ts`, `route.tsx` |
| `agents/assistant/conversations-page.tsx` e o teste | cria | `public.ts`, a rota nova |
| `agents/assistant/conversation-row.tsx` | fica: é a linha de "Recentes", com as peças `Sidebar*` de hoje | `sidebar-conversations.tsx` |
| `agents/assistant/projects-tab.tsx` | muda: sai da coluna para a página; as linhas são as da folha (`blockRow` de `ui/block.tsx`, como "Continuar") e o esqueleto é `Skeleton` | `conversations-page.tsx` |
| `agents/assistant/text.ts`, `public.ts` | muda: `public.ts` passa a exportar `ConversationsPage` e `ConversationsSearch`; `SidebarConversations` e `NewConversation` seguem exportados; `text.ts` ganha `RECENT_CONVERSATIONS = 'Recentes'` | a rota nova, `route.tsx` |
| `routes/_app/companies/$companyId/conversations/index.tsx` | cria | o roteador; `routeTree.gen.ts` (gerado) |
| `routes/_app/companies/$companyId/index.tsx` | muda: `q`, `place`, `tab` e `conversations` saem do `validateSearch` do Início | os links para o Início |
| `routes/_app/companies/$companyId/route.tsx` | muda: sai o ramo `inData`, da árvore; fora de um projeto a coluna segue com `NewConversation` e `SidebarConversations`, agora a lista curta, até a U2 levá-los para a barra (as duas unidades saem no mesmo pull request) | · |
| `hub/copies/data-tree.tsx` e o teste | apaga | `hub/copies/public.ts`, `route.tsx` |
| `hub/copies/data-page.tsx` e o teste | muda | a rota de Dados |
| `packages/hub-api/src/pages.ts` | muda: entram `/companies/$companyId/conversations` e `/companies/$companyId/knowledge`; sai `/companies/$companyId/settings/company-memory` | `apps/server/src/platform/screens.ts`, `routes/__root.test.tsx` |
| `routes/_app/companies/$companyId/knowledge.tsx` | cria | o roteador; `routeTree.gen.ts` (gerado) |
| `routes/_app/companies/$companyId_/settings/company-memory.tsx` | apaga | o índice das Configurações, que lê o `staticData.section` de cada rota |
| `agents/assistant/company-memory.tsx` e o teste | muda: a rota de `getRouteApi` (linha 17) e o alto da página | a rota nova |
| `routes/_app/companies/$companyId_/settings/settings.test.tsx` | muda: as listas das linhas 75 e 141 perdem "Memória da empresa", e as contagens das linhas 77, 111 e 195 passam de 10 a 9 | `test:unit` |
| `docs/reference/screens.md` | muda: entra a linha de Conversas no andar Empresa (W29); a do Início (linha 18) perde "the recent conversations" como lista; a de Dados (linha 24) troca "a tree beside the rail" pelas abas; a da Memória da empresa (linha 35) vira Conhecimento, no endereço novo | · |
| `docs/reference/telas.md` | muda: a ficha TD11 troca o caminho e perde "O lugar no trilho" de "Hoje falta" | · |
| `apps/web/phone-list.layout.test.ts`, `sweep-house-states.ts`, `home.layout.test.ts`, `company-memory.layout.test.ts` | muda: a lista inteira está na página; o endereço da memória (`sweep-house-states.ts:110,116`, `company-memory.layout.test.ts:21`) | `test:browser`, `test:sweep` |
| `apps/web/frame.layout.test.ts:53`, `frame-inset.layout.test.ts:52-54` | muda: o rótulo do grupo que os dois esperam passa de "Conversas" a "Recentes" | `test:browser` |
| `apps/web/axis.layout.test.ts:73-84` | muda: o caso dos rótulos espera só o rótulo de grupo da barra; os rótulos de dia (`sidebar-day-label`) saem da barra, e a mesma conferência (V61) passa para a página Conversas | `test:browser` |
| `apps/web/motion-screen.layout.test.ts:215-237` | muda: "a letra na busca da barra" e "a aba da barra" passam a abrir `/conversations` e a usar a busca e a aba da página | `test:browser` |
| `routes/_app/companies/$companyId/route.test.tsx:67-109`, `hub/projects/project-bar.test.tsx:93-111` | muda: onde o caso lê o grupo "Conversas" ou a busca na coluna, passa a ler "Recentes"; "Nova conversa" segue | `test:unit` |

### Os contratos que a unidade cria

Em `agents/assistant/conversations-page.tsx`, exportado por `public.ts`:

```ts
export function ConversationsPage(props: { companyId: CompanyId }): ReactNode
export const ConversationsSearch: z.ZodType<{ conversations?: string; q?: string; place?: string; tab?: 'projects' }>
```

A rota `/_app/companies/$companyId/conversations/` tem `staticData: { place: 'Conversas' }`,
`validateSearch: ConversationsSearch.catch({})` (C27: o endereço é entrada externa, lido uma vez) e
desenha `ConversationsPage`. O esquema só garante a forma; quem recusa um valor é `viewOf` de
`list-view.ts`, como hoje: `placeOf` (`list-view.ts:18-22`) devolve `undefined` para um lugar que não é
`HOME`, `AUTOMATIONS` nem um `ProjectId`. O estado da lista é `ListView` (a aba é
`tab: 'PROJECTS' | undefined`, C21); os ids são `CompanyId`, `ProjectId` e `ConversationId` do `hub-api`
(C23). A lista segue em páginas de 30 com o paginador (C44). O dono das frases é `text.ts`; entra
`RECENT_CONVERSATIONS = 'Recentes'`, e o vazio usa `NO_CONVERSATIONS_BLOCK`, que já existe
(C26). `NewConversation` (`sidebar-conversations.tsx:41-53`) fica onde está, sem mudar, e a página não
o repete (decisão 16 do firstmate). `SidebarConversations` mantém a assinatura
(`props: { companyId: CompanyId }`) e passa a ler só a primeira página sem filtro,
`assistantConversationsQuery(companyId, undefined, 1, {})`, a mesma chave que a página usa sem busca
(um dono, C26); desenha as oito primeiras com `ConversationRow`, sob o rótulo `RECENT_CONVERSATIONS`, e
devolve `null` sem conversa ou se a leitura falha. O arquivo modelo é o próprio `sidebar-conversations.tsx`: cumpre C21,
C23 e C26.

Em `hub/copies/data-page.tsx`, `DataPage` ganha as abas das camadas no alto, com `Tabs` de `ui/tabs.tsx`
e `DataLayer` de `search.ts` como valor. A contagem é a que a árvore mostra hoje (`data-tree.tsx:60-71,104-113`):
Negócio 0, Bruto o número de tabelas do lago, Apps sem número e só com `viewAppData`. A nota do Bruto
(`RawNote`, `data-tree.tsx:73-101`) vai para a página, sob as abas, quando a aba é Bruto, com os mesmos
textos e estados, sem as peças `Sidebar*`.

A rota `/_app/companies/$companyId/knowledge` tem `staticData: { place: 'Conhecimento' }` e desenha
`CompanyMemory`, que não muda de assinatura: lê `companyId` da rota nova
(`getRouteApi('/_app/companies/$companyId/knowledge')`) e ganha o alto de página que a moldura das
Configurações lhe dava: `Page` e `PageHeader` com o título "Conhecimento" e, de `intro`, a frase que hoje
é o `summary` da seção ("As instruções e as páginas que o Conexus segue em toda conversa da empresa.").
As duas partes (`SettingsSection` "Instruções da empresa" e "Páginas"), os estados e quem pode salvar
(`memory.mayManage`) ficam como estão. `PAGES` (`packages/hub-api/src/pages.ts`) é o dono dos endereços
que o Hub responde (C26): os dois endereços novos entram e o antigo sai no mesmo commit da rota, porque
`routes/__root.test.tsx:53-56` prende o roteador à lista.

### As skills e a leitura

As linhas de `docs/reference/stack.md` de `@tanstack/react-router` (as skills `router-core`),
`@tanstack/react-query` e `@base-ui/react`. Ler primeiro web W1, W18, W29 e design V58 e V59.

### A ordem do trabalho

1. **A página Conversas.** Critérios: 1.
   - **Arquivos:** cria `conversations-page.tsx`, o teste e a rota; muda `sidebar-conversations.tsx`,
     `projects-tab.tsx` e `packages/hub-api/src/pages.ts` (a linha do endereço novo).
   - **O que sai da coluna:** a busca, o filtro por lugar, as abas, os dias e o paginador, com os casos
     de teste deles, que passam para o teste novo.
   - **O que entra:** a mesma lista, na largura do eixo do Início (V59), sem as peças `Sidebar*`: o
     título "Conversas", a busca sempre à vista, o filtro por lugar, as abas e os dias, com as linhas de
     `ui/block.tsx` e o mesmo menu de linha que `conversation-row.tsx` tem hoje. Sem nenhuma conversa a
     página diz "Nenhuma conversa ainda.". Regras: W18, V58, V59.
   - **Testes:** `conversations-page.test.tsx`, pela porta da rota (`createConexus` com histórico em
     memória e o Hub dublado, como `old-copy-addresses.test.tsx`).
   - **Mutações à mão:** em `list-view.ts`, fazer `placeOf` devolver o valor sem conferir: "um lugar
     inválido abre a lista inteira" fica vermelho.
   - **Pronto quando:** `/companies/<e>/conversations?q=pão` abre com a busca preenchida.
2. **A lista curta.** Critérios: 2.
   - **Arquivos:** muda `sidebar-conversations.tsx` e os dois testes, `text.ts`, `index.tsx` do Início
     (o `validateSearch`) e os testes de moldura do raio.
   - **Referência a seguir:** SH `blocks/sidebar-07/components/nav-projects.tsx:32-46`.
   - **O que entra:** o grupo com o rótulo "Recentes" e até oito linhas de `ConversationRow`; a
     conversa aberta fica marcada, como hoje. Regras: W30, V61.
   - **Testes:** `sidebar-conversations.test.tsx`, os três casos do critério 2.
   - **Mutações à mão:** tirar o corte em oito: "as oito mais recentes" fica vermelho.
   - **Pronto quando:** a coluna mostra "Nova conversa" e "Recentes", sem lupa, filtro nem abas.
3. **As camadas em abas.** Critérios: 3.
   - **Arquivos:** muda `data-page.tsx`; apaga `data-tree.tsx` e o teste; muda `route.tsx:132-143`.
   - **O que sai:** `DataTree` e o ramo `inData` da moldura.
   - **Testes:** `data-page.test.tsx`, "as camadas são abas e a camada fica no endereço" e "a nota do
     Bruto fica na página" (os casos de `data-tree.test.tsx` passam para cá).
   - **Mutações à mão:** trocar o `layer` da aba Apps por `raw`: o teste fica vermelho.
4. **Conhecimento no endereço novo.** Critérios: 22.
   - **Arquivos:** cria `routes/_app/companies/$companyId/knowledge.tsx`; apaga
     `settings/company-memory.tsx`; muda `agents/assistant/company-memory.tsx`,
     `packages/hub-api/src/pages.ts`, `settings.test.tsx`, `company-memory.test.tsx`,
     `company-memory.layout.test.ts`, `sweep-house-states.ts`.
   - **O que sai:** a seção "Memória da empresa" das Configurações e o endereço dela.
   - **O que entra:** a mesma tela sob o título "Conhecimento", na largura de página (`Page`), com
     `PageHeader`. A linha da barra é da U2: até lá chega-se pelo endereço. Regras: W1, W29.
   - **Testes:** `company-memory.test.tsx`, os casos de hoje com a entrada no endereço novo e "o
     endereço antigo não existe" (a rota antiga dá a tela de não encontrado); `settings.test.tsx`, as
     duas listas sem a seção.
   - **Mutações à mão:** deixar a linha antiga em `PAGES`: "cada endereço do roteador é uma página que
     o Hub abre" fica vermelho, dizendo o endereço.
   - **Pronto quando:** `/companies/<e>/knowledge` abre as instruções e as páginas, e o índice das
     Configurações não lista mais a seção.
5. **As linhas em `screens.md` e em `telas.md`.** Critérios: 1, 3, 22 (as telas que mudaram, W29).
   - **Arquivos:** `docs/reference/screens.md`, as linhas 18, 24 e 35 e a linha nova de Conversas;
     `docs/reference/telas.md`, a ficha TD11.

### Como se prova

`npm run test:unit -w @conexus/web`, `npm run test:browser -w @conexus/web` e `npm run lint:design -w
@conexus/web` (critério 21). Hoje os critérios 1 a 3 e o 22 falham: os endereços `/conversations`
sem id e `/knowledge` não existem, a coluna traz a lista inteira com a busca, e Dados não tem abas.

### Parar se

Uma unidade das trilhas Dados ou Agentes e Apps estiver aberta em `hub/copies/` ou em
`agents/assistant/`: espere por ela (delivery L1); a tela Conhecimento é da trilha Dados (ficha TD11),
e a U1 só a muda de endereço. O menu da linha não sair de `conversation-row.tsx` para a página sem ser copiado: pare e
descreva (seria uma segunda implementação). Um caso dos testes de moldura do raio não couber no destino
que a tabela dá: pare e diga qual. Uma tela, notificação ou ferramenta apontar para o endereço antigo da memória: pare e diga
qual (a decisão 9 do firstmate supõe que nenhuma aponta).

## U2 A barra com grupos e a barra do objeto

**Base e modelo.** O commit da U1. Opus: a unidade cruza a moldura de `ui/`, as três rotas que a
desenham, o assunto Projetos e a conta.

### As linhas da tabela

1 a 9, 18 a 20, 23 (a linha da barra), 25 e 28 a 30. Ler `ui/sidebar.tsx`, `ui/frame.tsx`,
`ui/sidebar-rail-button.tsx`, `ui/sidebar-selector.tsx` e `ui/settings-index.tsx` inteiros; as três
rotas de moldura (`routes/_app/companies/$companyId/route.tsx`, `.../$companyId_/settings/route.tsx`,
`routes/_app/operations/route.tsx`); `hub/projects/project-rail.tsx` e `project-state.ts`;
`hub/identity/account-menu.tsx` e `company-switcher.tsx` inteiros;
`agents/assistant/sidebar-conversations.tsx` (como a U1 o deixou); `hub/notifications/bell.tsx`; `main.tsx:27-40` (o `staticData`); `brand/tokens.css:111-118`;
`DESIGN.md:160-162,272-277,332-334,493-499,527-528`; `platform/theme.ts`. Seguir MA
`lib/nav/nav-items.tsx:24-39`, `components/ui/app-sidebar.tsx:64-125,143-159`,
`domains/agent-builder/layouts/agent-builder-sidebar.tsx:68-99`; SH
`ui/sidebar.tsx:152-163,254-285,389-425,508-560`, `blocks/sidebar-07/components/nav-user.tsx:41-52,68-79`,
`team-switcher.tsx:43-56` e `nav-projects.tsx:32-46`. As capturas `fase4-v2` da barra (`j2-01-inicio`,
`j4-02-pj-construir`) e, para "Nova conversa", Conversas e Recentes, as capturas `c2-*` do quadro.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `ui/nav.tsx` | cria | as três rotas de moldura; `ui/showcase/navigation.tsx` |
| `routes/_app/-navigation.ts` e `-navigation.test.tsx` (o Vitest do pacote só roda `src/**/*.test.tsx`) | cria | as três rotas; a U3 |
| `platform/sidebar.ts` | cria | `ui/frame.tsx` |
| `ui/sidebar.tsx` | muda: saem `RailColumn`, `RailContent`, a propriedade `rail` e `SidebarRail`; entra o botão de recolher | `ui/frame.tsx`, as peças que usam `useSidebar` |
| `ui/frame.tsx` | muda: a assinatura de `Frame`; sai `FrameLink` | as três rotas, `ui/settings-index.tsx`, a vitrine |
| `ui/sidebar-rail-button.tsx` | apaga | `route.tsx`, a vitrine |
| `ui/settings-index.tsx` | muda: desenha por `SidebarNav` | a rota das Configurações |
| `hub/projects/project-rail.tsx`, `public.ts` | muda: ficam `ProjectRailHead` e o seletor, com o estado do app sob o nome; saem `RAIL`, `ProjectRailNav` e `BUILD_ROUTE` | `route.tsx` |
| `agents/assistant/sidebar-conversations.tsx` | muda: o grupo "Recentes" some com a barra recolhida, e `NewConversation` vira ícone com a dica | `route.tsx` |
| `ui/sidebar-selector.tsx` | muda: a cabeça ganha a segunda linha opcional (`note`) | `ProjectRailHead`, `hub/operations/central-header.tsx` (sem `note`) |
| `hub/identity/account-menu.tsx` e o teste | muda: sai a variante `compact`; entra `companyId`, a empresa na segunda linha e o grupo "Suas empresas" no menu | as rotas de moldura |
| `hub/identity/company-switcher.tsx` e o teste, `public.ts` | apaga: o grupo "Suas empresas" (`company-switcher.tsx:28-38`) muda para o menu da conta | `route.tsx` |
| `hub/notifications/bell.tsx` | muda: o gatilho de `NotificationBell` (`bell.tsx:182-213`) passa de botão de ícone a `SidebarMenuButton` com o nome "Avisos", a contagem e a dica quando recolhida; o título do painel e o nome acessível passam de "Notificações" a "Avisos"; o painel e a assinatura ficam | a rota da empresa e a das Configurações |
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

`HUB_NAV`: Início (`exact`) e Conversas (`/companies/$companyId/conversations`, o ícone
`MessageSquareIcon`, `places: ['Conversas']`, sem `needs`), numa seção sem título; "Dados e contexto": Integrações, Dados,
Conhecimento (`/companies/$companyId/knowledge`, o ícone `BookOpenIcon`, sem `needs`: todo papel lê);
"Agentes": Agentes (`needs: 'manageAgents'`), Automações (`needs: 'manageAutomations'`); "Apps":
Projetos. Os títulos e a divisão são os da decisão B (B-b, 2026-11-26); `PROJECT_NAV` copia `project-rail.tsx:81-145`
sem mudar item, grupo nem permissão (decisão F). O `holdsConversations` de Construir vira `exact` com
`places: ['Projeto']`: só a rota de Construir e a das conversas dele têm esse `staticData.place`
(`$projectId.index.tsx:8` e `$projectId.conversations.$conversationId.tsx:10`, em
`routes/_app/companies/$companyId/projects/`), o que dispensa `BUILD_ROUTE`. `CENTRAL_NAV`: uma seção sem título, com Clientes e Estado do Hub
(`operations/route.tsx:22-23`).

Em `ui/frame.tsx`:

```ts
export function Frame(props: {
  /** The way out of an inner place, in the top line instead of the mark: "← Todos os projetos", "← Voltar". */
  back?: Pick<LinkProps, 'to' | 'params'> & { label: string }
  /** Under the top line: the Projeto's name with its switcher, or the Central's head. The company's frame gives none. */
  header?: ReactNode
  nav: ReactNode
  footer: ReactNode
  menuNote?: string
  compact: boolean
  children: ReactNode
}): ReactNode
```

Em `platform/sidebar.ts`: `readSidebarChoice(): 'collapsed' | 'expanded' | undefined` e
`keepSidebarChoice(choice: 'collapsed' | 'expanded'): void`, com a chave `conexus-sidebar` sobre
`pageStorage('local')`, como `platform/theme.ts:16-17`; o valor lido passa por `z.enum(['collapsed', 'expanded'])` com `.catch(undefined)` (C27), e uma gravação que o
navegador recusa não lança. O estado da barra é a união `'expanded' | 'collapsed'` que `useSidebar` já
tem (C21). Os ids são os do `hub-api`, conferidos nos parâmetros das rotas (C23). O arquivo modelo é
`ui/settings-index.tsx`: recebe dados prontos com `needs` e cumpre C21, C23 e C26.

Em `ui/sidebar-selector.tsx`, a cabeça ganha uma linha: `type Head = { icon: ReactNode; title:
ReactNode; note?: ReactNode }`, desenhada sob o título em `text-fact text-text-2`, como a segunda linha
da conta (`account-menu.tsx:67-70`). `ProjectRailHead` passa
`note={projectStateText(projectStateOf(read.data.project))}` quando a leitura chegou, e nada enquanto
carrega ou se falha; as palavras têm um dono, `hub/projects/project-state.ts` (C26).

Em `hub/identity/account-menu.tsx`:

```ts
/** The account at the foot of the sidebar. Inside a company, its name sits under the person's and the menu lists the person's companies. */
export function AccountMenu(props: { person: Person; companyId?: CompanyId }): ReactNode
```

Com `companyId`, a segunda linha é o nome da empresa, lido com `useSuspenseQuery(companyQuery(companyId))`
como `CompanySwitcher` lê hoje (`company-switcher.tsx:18`): `enterHouse` já leu a empresa antes de a
moldura montar, então a linha não tem estado de carregando nem de erro. O nome acessível do botão é
"Conta de <pessoa>, em <empresa>". O menu
ganha, depois do nome e do e-mail e antes do Tema, o grupo "Suas empresas" quando `useCompanies` traz
mais de uma: é o `DropdownMenuGroup` de `company-switcher.tsx:28-38`, com os mesmos links. Sem
`companyId` (a Central), a segunda linha é o e-mail, como hoje. O id é `CompanyId` (C23); o dono da
lista é `useCompanies` (C26).

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
   - **Arquivos:** cria `ui/nav.tsx`, `-navigation.ts` e `-navigation.test.tsx`.
   - **Referência a seguir:** MA `nav-items.tsx:24-39`; SH `nav-main.tsx:20-37`.
   - **O que entra:** `SidebarNav` desenha cada seção com `SidebarGroup`, `SidebarGroupLabel` e
     `SidebarMenuButton` (a dica já vem de `ui/sidebar.tsx:304-328`); o lugar atual sai do `Link` do
     roteador e de `places`. Regras: W34, V5, V35.
   - **Testes:** `-navigation.test.tsx`: "cada destino existe no roteador" (confere cada `to` contra o
     `fullPath` das rotas do roteador de `createConexus`, sem a barra final; `settings/route.tsx:44` já
     monta um `to` de `route.fullPath`), "nenhum nome se repete na mesma barra" e "um grupo vazio some
     com o título".
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
4. **As três molduras e o pé.** Critérios: 4, 10, 12, 19, 23.
   - **Arquivos:** muda as três rotas, `project-rail.tsx`, `ui/sidebar-selector.tsx`,
     `settings-index.tsx`, `bell.tsx`, `account-menu.tsx`; apaga `company-switcher.tsx`.
   - **Referência a seguir:** MA `agent-builder-sidebar.tsx:68-99`; SH `nav-user.tsx:41-52,68-79` e
     `team-switcher.tsx:43-56`.
   - **O que sai:** `CompanySwitcher` e o nome da empresa no alto da barra.
   - **O que entra:** a empresa passa `NewConversation` como `header` e, em `nav`, `SidebarNav` com
     `seen(HUB_NAV, may)` seguido de `SidebarConversations`; com `projectId`, `back` "Todos os
     projetos", `ProjectRailHead` com o estado e só `seen(PROJECT_NAV, may)`, sem conversas;
     o pé dela é `NotificationBell` ("Avisos"), o link Configurações e `AccountMenu` com `companyId`. As
     Configurações: `back` "Voltar", o índice de hoje, e no pé `NotificationBell` e `AccountMenu` com
     `companyId`, sem link para si mesmas. A Central, que não tem empresa: a marca no alto,
     `CentralHeader`, `SidebarNav` com `CENTRAL_NAV` e só `AccountMenu`, sem `companyId`, no pé, como
     hoje. Regras: W30, W31, W32.
   - **Testes:** `route.test.tsx`, os casos dos critérios 4, 5, 10 e 23; `account-menu.test.tsx`, os
     quatro casos do critério 19 (os casos de `company-switcher.test.tsx` passam para cá); `settings.test.tsx`
     e `shell.layout.test.ts`, "a mesma linha do alto em toda barra" (critério 12).
   - **Mutações à mão:** tirar a condição de mais de uma empresa do grupo "Suas empresas": com uma
     empresa o grupo aparece e "uma e duas empresas" fica vermelho.
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

- Um item da barra pedir um grupo ou um título fora dos três de B-b, ou uma seção do projeto fora das
  oito de F-a: pare e descreva.
- "Recentes" empurrar um lugar para fora da barra aberta a 768 px de altura: os lugares ficam, e as
  recentes é que rolam ou somem; se não der sem código de medida, pare e descreva.
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
| `routes/_app/-navigation.ts` | muda: ganha `useSettingsSections`, a `useSections` de hoje mudada de lugar | a rota das Configurações, `-destinations.tsx` |
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
export type Destinations =
  | { place: 'company'; companyId: CompanyId; projectId?: ProjectId; may: CompanyMay }
  | { place: 'central' }
export function useHubDestinations(scope: Destinations): PaletteGroup[]
```

`Destinations` separa a empresa da Central por `place` (C21): a Central não tem empresa, e a paleta dela
lista `CENTRAL_NAV` e as empresas de `useCompanies` (o que `hub/operations/central-header.tsx` já
oferece). Numa empresa, "Central" entra para quem opera, pela mesma condição do menu da conta
(`companies?.mayOperate`, `hub/identity/account-menu.tsx:96`). Em `routes/_app/-navigation.ts` entra:

```ts
/** The sections of Configurações a person sees, read from each route's `staticData.section` (web W32). */
export function useSettingsSections(companyId: CompanyId): SettingsSection[]
```

É a `useSections` de `settings/route.tsx:30-45`, com o mesmo corpo e `companyId` como argumento;
`SettingsSection` é o tipo de `ui/settings-index.tsx`, e as seções continuam declaradas em cada rota.
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
   - **O que entra:** numa empresa, nesta ordem: "Ir para" com `seen(PROJECT_NAV, may)` quando há
     projeto (o `hint` é o nome dele), `seen(HUB_NAV, may)` (o `hint` é o título do grupo), as seções de
     `useSettingsSections` (o `hint` é "Configurações") e Central para quem opera; "Projetos" da primeira
     página; "Conversas recentes" da primeira página (o título por `titleOf`, a idade como `hint`);
     "Empresas", com as outras empresas de `useCompanies`, só quando há mais de uma (cada uma leva ao
     Início dela). Na Central: "Ir para" com `CENTRAL_NAV` e "Empresas". Uma leitura pendente ou com
     erro não entra.
   - **Testes:** `-destinations.test.tsx`, os casos dos critérios 5 e 16.
3. **A tecla e o gatilho.** Critérios: 14.
   - **Arquivos:** muda `ui/frame.tsx` e as três rotas.
   - **Referência a seguir:** MA `use-navigation-command.ts:42-54`; `ui/sidebar.tsx:56-66`.
   - **O que entra:** o botão "Buscar ou ir para…" com a tecla na linha do alto da barra (recolhida,
     só a lupa com a dica); a tecla escrita é "⌘K" no Mac e "Ctrl K" no resto. No celular o botão chama
     `setOpenMobile(false)` antes de abrir a paleta (MA `app-sidebar.tsx:59-62`). Cada rota de moldura
     passa `search` com `useHubDestinations`: a da empresa e a das Configurações com
     `place: 'company'`, a da Central com `place: 'central'`.
   - **Testes:** `palette.layout.test.ts`, "abre de qualquer tela e devolve o foco" e "sem moldura não
     abre".
4. **O reduzir.** Critérios: 17.
   - **Arquivos:** muda `apps/web/motion.layout.test.ts`: a paleta entra no caso "com reduzir, nada
     anima".

### Como se prova

`npm run test:unit -w @conexus/web`, `npm run test:browser -w @conexus/web` e `npm run lint:design -w
@conexus/web` (critério 21). Hoje os critérios 14 a 17 falham: Ctrl+K não faz nada.

### Parar se

- O `Autocomplete` do Base UI, dentro do `Dialog`, escrever um elemento `style` que a CSP recuse
  (`page.problems` na vitrine): pare, com o erro; a saída é a decisão sobre `cmdk`, que é do fundador
  (delivery L28).
- Ctrl+K já tiver dono em alguma tela (o compositor, o editor de código): pare e diga onde.

## U4 A gaveta

**Base e modelo.** O commit da U3. Sonnet.

### As linhas da tabela

17. Ler `ui/sidebar.tsx:124-142`, `ui/frame.tsx:88-127`, `ui/sidebar-trigger.tsx`,
`hub/projects/project-phone.test.tsx`, `apps/web/phone-menu.layout.test.ts` e `phone.layout.test.ts`.
Seguir SH `ui/sidebar.tsx:182-205` e as capturas `n4-gaveta-390`, `n4-gaveta-config-390` e
`j2-01-inicio-normal-390`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `phone-menu.layout.test.ts`, `phone.layout.test.ts`, `project-phone.test.tsx` | muda | `test:browser`, `test:unit` |
| `ui/sidebar.tsx`, `ui/frame.tsx` | muda só se um caso do critério 18 falhar | as três rotas de moldura |

### Os contratos que a unidade cria

Nenhum tipo novo. A gaveta é a `Sheet` que `ui/sidebar.tsx:124-142` já desenha no celular com os filhos
da barra; depois da U2 e da U3 esses filhos são a linha do alto, a busca, a navegação do lugar e o pé,
com Avisos e a conta. O arquivo modelo é `hub/projects/project-phone.test.tsx`, que já prova a gaveta
dentro de um projeto.

### As skills e a leitura

As linhas de `docs/reference/stack.md` de `@base-ui/react` e `@shadcn/react`. Ler primeiro design V18,
V32 e V56 e web W30.

### A ordem do trabalho

1. **A gaveta nas três barras.** Critérios: 18.
   - **O que entra:** só o que os testes pedirem: a gaveta já desenha a barra do lugar
     (`ui/sidebar.tsx:124-142`) e a U3 já fez o gatilho da busca fechá-la; o alto do celular segue
     dizendo o lugar (`frame.tsx:88-110`). O menu da conta abre para cima (`account-menu.tsx:74`) e
     cabe a 320 px com "Suas empresas".
   - **Testes:** `phone-menu.layout.test.ts`, "a gaveta leva a barra do lugar" e "a busca sai da
     gaveta", a 390 e a 320 px, na empresa, no projeto e nas Configurações.
   - **Mutações à mão:** tirar o `setOpenMobile(false)` do gatilho da busca: "a busca sai da gaveta"
     fica vermelho.

### Como se prova

`npm run test:unit -w @conexus/web`, `npm run test:browser -w @conexus/web` e `npm run lint:design -w
@conexus/web` (critério 21). Hoje a gaveta já traz as seções do projeto
(`hub/projects/project-phone.test.tsx`); o critério 18 falha pela busca, que não existe na gaveta, e
pela conta, que hoje é só o avatar no trilho.

### Parar se

Um caso do critério 18 pedir uma mudança que não seja da moldura (`ui/sidebar.tsx`, `ui/frame.tsx`):
pare e descreva.

## G1 O ponto de conferência

Depois da U2: `npm run test:unit`, `test:browser`, `test:sweep` e `lint:design` em `@conexus/web`; o Hub
local com os dublês, a 1366 e a 390 px, nos dois temas, com e sem reduzir movimento: a barra aberta e
recolhida, a troca para o projeto e a volta só pelo teclado, Configurações, Central, a página
Conversas, Conhecimento e as abas de Dados, como dono e como membro, com uma e com duas empresas; cada
captura ao lado da `fase4-v2` da mesma tela (ou da `n4-*`, onde a versão 2 não redesenhou);
`impeccable detect` nos arquivos mudados e no Hub rodando.

## G2 O ponto de conferência

Depois da U4: os mesmos comandos; a paleta aberta de cada moldura, com o teclado e com o toque, vazia,
filtrada e sem resultado, como dono, membro e operador; a gaveta nas três barras a 390 e a 320 px; o
menu da conta com uma e com duas empresas; o roteiro de uso inteiro, item por item. O quadro do fim,
para o fundador ("Concordo", 2026-11-26): uma página com cada tela do Hub de verdade ao lado da captura
da versão 2, fora do repositório (delivery L21).
