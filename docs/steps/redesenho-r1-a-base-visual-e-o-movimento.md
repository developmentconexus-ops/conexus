# Etapa R1: a base visual e o movimento

Trilho: desenho

A primeira etapa da [trilha Redesenho](trilhas/redesenho.md), a fase 6 do processo em oito fases que
o fundador aprovou em 2026-11-26 (decisão 4 do estudo do redesenho). O estudo desta etapa fica fora do
repositório (delivery L21), na pasta `redesenho-r1`; a sua tabela de referência está abaixo, com a
unidade de cada linha. Lido no `main` em `b2db2c3e` (v0.24.132): `@base-ui/react` 1.9.0,
`tailwindcss` 4.3.3, `@tanstack/react-router` 1.170.44. Referências: Mastra playground-ui
(`mastra@252efe1`), Dify dify-ui (`dify@fce5d30`), shadcn base (`ui@0e5b2e6`), Craft Agents
(`craft-agents-oss@ce04aa3`). A vaga do trilho `desenho` ainda é do cartão
[publicar pelo merge da nota](publicar-pelo-merge-da-nota.md): este cartão espera num pull request de
rascunho até aquele fechar (delivery L5).

## A página do fundador

**No fim desta etapa** você abre o Hub claro e escuro e vê a direção B em grafite que você fechou em
2026-11-26 ("Fecha"): a moldura grafite nos dois temas, a folha encaixada nela, o ipê aceso só no que
está ligado ou é a ação principal, e a borda trocada por sombra. Cada peça responde no tempo curto
medido no G4 OS, e nada se estica.

**O roteiro de uso.** No Hub da nuvem, sem terminal.

1. Abra o Hub no tema claro e depois no escuro (Configurações › Aparência). A barra e a moldura são
   grafite nos dois; a folha é quase branca no claro e um degrau acima da moldura no escuro; o botão
   principal é ipê com a letra escura.
2. Passe o mouse nas linhas da barra (a cor muda em 75 ms) e num botão (160 ms). Aperte um botão: ele
   cede e volta.
3. Abra um menu, uma dica, uma gaveta (no celular) e uma janela: cada um entra com opacidade e uma
   escala curta, e sai mais rápido. Recolha a barra e abra um passo do rastro de uma conversa: os dois
   trocam de tamanho de uma vez, sem esticar. Troque de área pela barra: a folha esmaece em 160 ms.
4. Ligue "reduzir movimento" no sistema e repita 2 e 3: nada anima; tudo aparece no estado final.
5. Em Configurações › Modelos, escolha outro modelo padrão e salve: um aviso escuro, de uma linha,
   diz "Padrão salvo" no canto e some sozinho.

**O que você faz, e quando.** Antes: nada a fornecer. No começo: aprova esta página (as quatro
decisões abaixo já têm a sua resposta); o pull request de método da decisão B entra em `main`
antes da U1. No fim: faz o roteiro, diz o que viu e aprova os textos ("Padrão salvo").

**A visão.** "O estado de um trabalho é o do servidor ... nenhuma tela diz 'pronto' antes de o servidor
confirmar": o aviso só aparece depois que o servidor salvou. "O Hub é de quem prepara a empresa e de
quem monta": a base serve as duas pessoas igualmente (decisão 7b do estudo).

**Fica de fora.**

- A casca nova (barra com grupos, barra do objeto, Ctrl+K): é a R2.
- As peças novas que a direção mostrou (abas com pílula deslizante, número que rola, tique que se
  desenha, botão que diz "fazendo" e "feito", identidade do agente): são da R3 e da R5. O protótipo
  anima a largura de duas delas; lá elas voltam por `transform`.
- O brilho sincronizado entre esqueletos: a única referência o faz por estilo inline, que o Hub
  proíbe (V17). Fica o pulso de hoje.
- Os gestos próprios dos ícones da barra do G4 OS: dez animações sob medida, fora de propósito
  (estudo 6.4).
- As decisões que o protótipo das jornadas abriu e que não são desta etapa: o agente na barra lateral
  ou na galeria; o rascunho do agente testado conversando, com as ações desligadas; uma caixa de
  Avisos única para agentes, automações e projetos; e as oito regras da seção 3 do relatório dos
  protótipos. Elas voltam nos cartões da R2, da R5 e da R6.

**As decisões suas nesta etapa.** Respondidas em 2026-11-26, pelo firstmate: "A A-b / B. B-a / C.
Recomendado / D. Sim".

- **A. As molas: A-b.** A escala curta mais as duas molas do protótipo: o toque cede e volta em 420 ms
  (encolhe para 96%), e a mudança de estado da chave e da caixa assenta em 560 ms. A navegação
  continua curta: hover, menu, dica, janela, gaveta e troca de tela seguem a escala da decisão 2.
  Nativo: CSS `transition` com a mola como curva `linear()`, como o Craft Agents faz em
  `tokens.css:131-136`; voltar à escala curta pura são duas variáveis.
- **B. As regras do guia: B-a.** Um pull request de método, só de documentos, à parte deste cartão,
  depois desta aprovação e antes da U1 (delivery L20: uma etapa em curso guarda as regras com que
  começou), reescreve V5, V19, V22 e V28 como a direção B: o ipê aceso no botão principal, na chave e
  na caixa ligadas, no progresso, no enviar e no selo "Novo"; a borda como sombra e a folha encaixada
  com canto de 16 px; os raios 10, 14, 16 e 22; o foco em tinta no claro e em ipê no escuro. O mesmo
  pull request põe o nome da trilha Redesenho na delivery L1.
- **C. O primeiro aviso: o recomendado.** "Salvar padrão" em Configurações › Modelos, que hoje não diz
  nada quando salva, mostra "Padrão salvo"; um erro continua escrito embaixo do campo, como hoje,
  porque erro não anima nem some sozinho.
- **D. A trilha Redesenho: sim.** A terceira trilha do roteiro, ao lado da decisão "1A. Duas trilhas"
  de 2026-11-14, só do Hub (casca e peças), com uma etapa em construção por vez, na vaga `desenho`
  que o código já conhece (`scripts/cli.ts:9-23`); as outras duas seguem construindo função e usam as
  peças desta (V62).

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 Tokens de movimento e reduzir | a escala curta com nome no `tokens.css`; com reduzir, nada anima; a barra e o rastro sem esticar; hover e toque | `apps/web/src/brand/`, `apps/web/src/ui/`, `DESIGN.md`, `docs/reference/movimento.md` | design | nada |
| G1 | U2 Entradas e saídas | menu, popover, seletor, combobox, dica, janela, gaveta e painel pelos tokens; a troca de tela | `apps/web/src/ui/`, `apps/web/src/main.tsx`, `apps/web/src/brand/` | design | U1 |
| G2 | U3 A direção visual nos tokens | a B em grafite nas cores, sombras, raios, título e foco; a moldura; o ipê aceso; o `DESIGN.md` pelo `document`; o teste de contraste | `apps/web/src/brand/`, `apps/web/src/ui/`, `DESIGN.md`, `PRODUCT.md`, `docs/reference/impeccable.md` | design | U1, o pull request da decisão B |
| G2 | U4 Aviso e esqueleto | o aviso sobre o Base UI, com o primeiro uso; o esqueleto nos tokens | `apps/web/src/ui/`, `apps/web/src/main.tsx`, `apps/web/src/harness/model-accounts/` | design | U1, U3 |

Dois pull requests (delivery L9): G1 e G2.

**Orçamento de código alterado.** U1: 220 linhas. U2: 160. U3: 600. U4: 220. Total da etapa: cerca de
1.200, abaixo do teto de 4.000 (delivery L2).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Na vitrine, a linha da barra tem `transition-duration` 75 ms e o botão e a linha de tabela 160 ms; a lista `transition-property` de cada um tem só cores, sombra e (no botão) `scale` | `apps/web/motion.layout.test.ts`, "o mouse muda só a cor, no tempo da escala" | must |
| 2 | U1 | O botão apertado encolhe para `scale` .96 e volta na mola de 420 ms (`--ease-spring-press`); a chave e a caixa mudam de estado em 560 ms na mola `--ease-spring-state`; nada muda de tamanho de leiaute | `motion.layout.test.ts`, "o toque cede e volta" | must |
| 3 | U1 | A barra recolhida e o passo do rastro trocam de largura e de altura de uma vez: no `sidebar-container`, no `sidebar-gap` e no `trace-collapsible-content`, nenhum par de `transition-property` e `transition-duration` junta `width`, `height` ou `all` a uma duração acima de 0 s; recusa: devolver `transition-[width]` a `ui/sidebar.tsx:152` deixa o teste vermelho | `motion.layout.test.ts`, "nada estica" | must |
| 4 | U1, U2, U4 | Sob `prefers-reduced-motion: reduce`, toda duração de transição computada na vitrine é 0 s e `document.getAnimations()` fica vazio depois de abrir menu, dica, gaveta, janela e aviso e de trocar de tela; os laços de trabalho param (a marca, o arco, o brilho). A U1 cria o caso com a gaveta e a janela de hoje; a U2 e a U4 acrescentam o menu, a dica, a troca de tela e o aviso ao mesmo caso | `motion.layout.test.ts`, "com reduzir, nada anima" | must |
| 5 | U2 | Menu, popover, seletor, combobox e dica entram de opacidade 0 e escala .96 em 120 ms e saem mais rápido que entram; ao passar de uma dica para outra, a segunda abre sem transição | `motion.layout.test.ts`, "o menu e a dica entram curtos" | must |
| 6 | U2 | A janela entra em 150 ms só por opacidade; a gaveta e o painel entram em 200 ms com deslocamento curto e saem em 150 ms; com `data-swiping` a duração da gaveta é 0 s | `motion.layout.test.ts`, "a janela e a gaveta" | must |
| 7 | U2 | Trocar de área pela barra esmaece só a folha, em 160 ms; a barra não pisca | `motion.layout.test.ts`, "a troca de tela esmaece a folha" | should |
| 8 | U3 | O Hub pinta, nos dois temas, os valores da tabela de cores da U3 ("Os contratos que a unidade cria"); `DESIGN.md` e `tokens.css` dizem o mesmo valor por nome | `apps/web/src/brand/tokens.test.ts` (existente) e `apps/web/tokens.layout.test.ts`, "o tema" | must |
| 9 | U3 | Todo par de texto e fundo dos tokens passa 4,5:1 nos dois temas; o ponto e o ícone de estado passam 3:1; recusa: um par abaixo falha nomeando o par e o tema | `apps/web/contrast.layout.test.ts`, "cada par se lê nos dois temas" | must |
| 10 | U3 | A moldura e a barra são grafite nos dois temas; a folha tem 8 px de margem e canto de 16 px a partir de 768 px; a 390 px não há rolagem lateral | `apps/web/frame.layout.test.ts`, caso novo "a folha encaixada na moldura" | must |
| 11 | U3 | O botão principal, a chave e a caixa ligadas são ipê com a tinta escura; nenhum título, hover ou ação de repouso usa o ipê | `apps/web/pieces.layout.test.ts`, caso novo "o ipê acende só o que está ligado" | must |
| 12 | U3 | O foco do teclado é visível em toda peça da vitrine nos dois temas | `apps/web/focus.layout.test.ts` (existente, com a cor nova) | must |
| 13 | U4 | Salvar o padrão em Configurações › Modelos mostra "Padrão salvo" num aviso com `role="status"`, só depois da resposta do servidor; um erro do servidor não mostra aviso e continua no campo | `apps/web/notice.layout.test.ts`, "salvar o padrão avisa" e "o erro fica no campo" | must |
| 14 | U4 | O aviso some sozinho em 5 s, fecha pelo botão e pela tecla Esc, e o foco não sai de onde estava | `notice.layout.test.ts`, "o aviso some e não rouba o foco" | must |
| 15 | todas | A vitrine abre sem violação de CSP nos dois temas, a 1366 e 390 px; cada peça nova tem entrada na vitrine | `apps/web/showcase.layout.test.ts` e `pieces.layout.test.ts` (existentes) | must |
| 16 | todas | A catraca do lint de design desce de 325 para 311, a contagem de hoje, e não sobe | `npm run lint:design -w @conexus/web`, com `--max-warnings 311` | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Vitrine `/pieces` | as peças nos dois temas | · | o esqueleto pulsa (parado com reduzir) | · | · | · | · |
| Configurações › Modelos, salvar o padrão | nenhum padrão: o botão "Salvar padrão" | · | "Salvando…" no botão, como hoje | a frase de hoje embaixo do campo, sem aviso | · | quem não pode mudar o padrão da empresa vê o que vê hoje (sem mudança) | · |
| Toda tela (a moldura) | a moldura grafite e a folha encaixada | · | · | · | · | · | · |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| os nomes de duração e de curva em `brand/tokens.css` | U1 | U2, U3, U4, todas as peças de `ui/` |
| os valores de cor, sombra, raio, título e foco em `brand/tokens.css` e no front matter do `DESIGN.md` | U3 | `brand/tokens.test.ts`, `contrast.layout.test.ts`, `ui/notice.tsx` (`notice`, `on-notice`), o Impeccable |
| o aviso (`ui/notice.tsx`, `useNotice`) | U4 | `harness/model-accounts/default-choice.tsx` |

As capturas que esta etapa segue estão fora do repositório, com o estudo: a direção B em grafite, claro
e escuro, a 1366 e 390 px (14 capturas `b-*` e as oito opções de cor), e o Hub de hoje. A etapa não
cria tela; as peças de `ui/` que muda: `button`, `switch`, `checkbox`, `meter`, `badge`, `input`,
`input-group`, `card`, `sidebar`, `frame`, `tooltip`, `popover`, `dropdown-menu`, `select`,
`combobox`, `dialog`, `alert-dialog`, `sheet`, `drawer`, `trace`, `table`, `attachment`, `skeleton`;
nova: `notice`, com a linha 20.

## A tabela de falhas

Nenhuma. A etapa não acrescenta gravação nem comando: o aviso só lê a resposta que a gravação de hoje
(`sendMyDefault`, `sendDefaultModel`) já devolve.

## A tabela de referência

Siglas: MA Mastra playground-ui, DF Dify dify-ui, SH shadcn base, CR Craft Agents, nos commits do
cabeçalho. MA-ds `packages/playground-ui/src/ds/components`; DF-ui `packages/dify-ui/src`; SH-ui
`apps/v4/registry/bases/base/ui`; CR `packages/ui/src/styles/tokens.css`. Base UI lido em
`node_modules/@base-ui/react` 1.9.0. "Fecha" é a palavra do fundador de 2026-11-26 à direção B em
grafite; "decisão 2" é a dele do mesmo dia ao movimento.

| # | Peça | Unidade | O que o fundador já decidiu | Hoje no main | Referência | Como a referência faz | Veredito | Prova | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Durações e curvas com nome | U1 | decisão 2: hover 75 e 160 ms, pressionar 100, menu e dica 100 a 150, janela 150, troca de tela 160 | `DESIGN.md:499-506` (nomes sem token); `brand/tokens.css:158-159` | MA `theme/motion.css:2-10,30-40` (mesma situação); CR `tokens.css:123-130` (situação diferente: Electron sem CSP) | durações em `@theme static` e `@utility duration-*`; saída menor que a entrada **lido** | nativo | · | não precisa | · |
| 2 | Com reduzir, nada anima | U1 | decisão 2; V26 | um `motion-reduce:` por peça; `ui/table.tsx:37`, `ui/attachment.tsx:12` sem guarda | CR `tokens.css:276-287,312` (situação diferente: mantém um fade; serve a técnica) | um `@media` em `:root` troca as variáveis; `--default-transition-duration` segue o token **lido** | nativo | · | não precisa | · |
| 3 | A barra recolhe sem esticar | U1 | decisão 2: nada anima largura | `ui/sidebar.tsx:152,158` | SH `sidebar.tsx:233` (anima a largura: o contrário) | tirar a classe | nativo | · | não precisa | · |
| 4 | O rastro dobra sem esticar | U1 | decisão 2: nem altura | `ui/trace.tsx:104` | Base UI `docs/react/components/collapsible.md` (`--collapsible-panel-height`) **documentado** | a altura vem por variável; sem transição, abre na hora | nativo | · | não precisa | · |
| 5 | Passar o mouse | U1 | decisão 2 | `ui/button.tsx`, itens da `ui/sidebar.tsx` sem transição | MA `theme/motion.css:3` (mesma situação) | só a cor do controle anima no hover **lido** | nativo | · | não precisa | · |
| 6 | Apertar e mudar de estado | U1 | decisão A-b, 2026-11-26: o toque em 420 ms e a mudança de estado em 560 ms, nas molas | `ui/button.tsx` sem `:active`; `ui/switch.tsx:11,18`, `ui/checkbox.tsx:13` | CR `tokens.css:131-136` (molas em `linear()`, situação diferente); protótipo `carater.css:12-19` **herdado** | `:active` com `scale` e a curva do token | nativo | · | A-b | · |
| 7 | Menu, popover, seletor, combobox | U2 | decisão 2: opacidade e escala | `ui/popover.tsx`, `ui/dropdown-menu.tsx`, `ui/select.tsx`, `ui/combobox.tsx` sem transição | Base UI `docs/react/handbook/animation.md:19-24` e `docs/react/components/tooltip.md:79` (mesma situação) | `data-starting-style`/`data-ending-style`, `origin-[var(--transform-origin)]`, transição que se cancela no meio **lido** | nativo | · | não precisa | · |
| 8 | Dica | U2 | decisão 2 | `ui/tooltip.tsx:4-7` | MA-ds `Tooltip/tooltip.tsx:106-110` (mesma situação) | escala .95 e opacidade 0 nos dois atributos; `data-instant` sem transição **lido** | nativo | · | não precisa | · |
| 9 | Janela | U2 | decisão 2: 150 ms | `ui/dialog.tsx:53,58`, `ui/alert-dialog.tsx:31,36` | Base UI `animation.md` | opacidade nos dois atributos | nativo | · | não precisa | · |
| 10 | Gaveta e painel | U2 | estudo 13.2: 200 a 250 ms; folha de 17/11: sai em 150 | `ui/sheet.tsx:22,24,57,62`, `ui/drawer.tsx:30,36` | SH-ui `sheet.tsx:31,56` e DF-ui `drawer/index.tsx:57,90-98` (mesma situação) | deslocamento curto nos dois atributos; `data-swiping:duration-0` **lido** | nativo | · | não precisa | · |
| 11 | Troca de tela | U2 | decisão 2: fade de 160 ms | `main.tsx:84` sem `defaultViewTransition` | `@tanstack/router-core` `router.d.ts:156`, `router.js:491-506` | o roteador chama `document.startViewTransition`; o CSS nomeia só a folha **lido**; passa na CSP com folha externa (estudo 6.3) **provado** | nativo | · | não precisa | · |
| 12 | As cores | U3 | "Fecha"; decisão 3 | `brand/tokens.css:50-80`; `DESIGN.md` front matter; `brand/tokens.test.ts` | protótipo `b-noites.css:7,16-35` e a tabela "A paleta final" **herdado** | os valores medidos em `light-dark()` | nativo | · | "Fecha" | · |
| 13 | A moldura grafite e a folha encaixada | U3 | "Fecha": 8 px de margem, canto de 16 px | `ui/frame.tsx`, `ui/sidebar.tsx:198` | SH-ui `sidebar.tsx:154,162,224-235` (variante `inset`, mesma situação) **lido** | a moldura pinta o grafite; a folha ganha margem e raio | embrulhado: a nossa `sidebar` ganha a variante `inset` | · | B-a | · |
| 14 | A borda é sombra | U3 | "Fecha" | `border border-line` em `ui/input.tsx:19`, `ui/card.tsx:11`, `ui/input-group.tsx:18`; `tokens.css:155-156` | CR `tokens.css:120` (a borda dentro da sombra) **lido** | um token de sombra por camada | nativo | · | B-a | · |
| 15 | O ipê aceso | U3 | "Fecha": botão principal, chave e caixa ligadas, progresso, enviar, selo "Novo" | `ui/button.tsx:17` (`bg-ink`), `ui/switch.tsx:11`, `ui/checkbox.tsx:13` | protótipo `carater.css:20-27` **herdado** | gradiente de dois tokens a 135°, tinta escura em cima | nativo | · | B-a | · |
| 16 | Raios e título | U3 | "Fecha": 10, 14, 16, 22; título 1,875 rem, 700 | `tokens.css:86-89,120-126` | tabela "Os outros tokens da direção" **herdado** | troca de valor | nativo | · | B-a | · |
| 17 | O foco | U3 | "Fecha": tinta no claro, ipê no escuro | `tokens.css:308` | protótipo `b-noites.css:30` **herdado** | um token `focus` próprio | nativo | · | B-a | · |
| 18 | O contraste dos pares | U3 | V8 | nenhum teste | nenhuma referência mede em teste **não achado** | · | remendo | o próprio teste, `playwright-core@1.63.0` com a fórmula da WCAG 2.2 | não precisa | `apps/web/contrast.layout.test.ts` |
| 19 | O `DESIGN.md` pelo `document` | U3 | decisão 3: "abrir"; `document` só depois da direção | `docs/reference/impeccable.md:33-35` (proibido) | o Impeccable instalado **documentado** | lê o código e escreve o `DESIGN.md` | nativo | · | decisão 3 | · |
| 20 | O aviso | U4 | estudo 6.3: o Toast do Base UI (o Sonner fere a W22); "Fecha": invertido, uma linha | nenhum (`DESIGN.md:638`) | Base UI `toast/` e `docs/react/components/toast.md:418-560,3781-3783` (mesma situação); DF-ui `toast/index.tsx:150-177` (mesma situação) **lido** | `Toast.Provider`, `useToastManager().add`; pilha e gesto pelas variáveis que o Base UI escreve | nativo | · | C | `apps/web/src/ui/notice.tsx` |
| 21 | O esqueleto | U4 | estudo 6.3: o pulso de hoje | `ui/skeleton.tsx:10` | SH-ui `skeleton.tsx:3-12` | `animate-pulse` | nativo (fica, no token) | · | não precisa | · |
| 22 | A vitrine e a CSP | todas | W22, V17 | `pieces.layout.test.ts:72-96`, `showcase.layout.test.ts` | · | o harness já abre a vitrine com a CSP e com a preferência | nativo | · | não precisa | · |
| 23 | O brilho sincronizado | fica de fora: só o MA, por `style=` (V17) | nada registrado | · | MA-ds `Skeleton/skeleton.tsx:5-20` **lido** | · | nativo (CSS), fora | · | · | · |
| 24 | Os gestos dos ícones | fica de fora (estudo 6.4) | · | · | G4 OS ao vivo **não oficial** | · | nativo (CSS), fora | · | · | · |
| 25 | Pílula das abas, número que rola, tique, botão que diz | fica de fora: R3 | "Fecha", linha 5 | `ui/tabs.tsx`, `ui/checkbox.tsx` | protótipo `carater.css:311-313,531` (anima `left` e `width`) **herdado** | · | nativo (`transform`), na R3 | · | · | · |

**A medida do transplante.** Nenhuma parte trazida: a etapa troca valores e acrescenta uma peça.

**A dívida.** A cópia do toast do protocolo do Base UI anima a altura da pilha (`toast.md:69`); aqui a
altura troca na hora. O contraste dos selos de estado nunca foi medido um a um; a U3 mede.

## As decisões do firstmate

| # | Decisão reversível (delivery L6) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | Nomes dos tokens em inglês: `duration-row`, `-control`, `-press`, `-menu`, `-window`, `-move`, `-page`; `ease-enter`, `ease-exit`, `ease-fit` | o `tokens.css` nomeia tudo em inglês (delivery L23: código em inglês); a folha de 17/11 já tinha `duration-move`, `ease-enter`, `ease-exit` | renomear num commit |
| 2 | Menu e dica em 120 ms, no meio da faixa de 100 a 150 da decisão 2 | o Base UI escreve 100 (`components/tooltip.md:79`), o MA 150 (`tooltip.tsx:106`); o protótipo, 120 (`movimento.css:10`) | trocar o valor do token |
| 3 | O aviso some em 5 s, até três na pilha | o padrão do Base UI (`toast.md:3781-3783`) | trocar a opção do `Toast.Provider` |
| 4 | Os nomes novos do protótipo fundem com os do Hub onde há um (`--ok` em `success`, `--perigo` em `danger`, `--atencao` em `warning`) | um fato, um dono (C26) | separar o token |

## U1 Tokens de movimento e reduzir

**Base e modelo.** `main` em `b2db2c3e`. Sonnet: valores e classes em arquivos de peça, sem desenho
entre módulos.

### As linhas da tabela

1 a 6. Ler `apps/web/src/brand/tokens.css` (o `@theme`, linhas 47-176, e os `@utility`), `DESIGN.md`
"Motion" (`:499-506`), `docs/reference/movimento.md` inteiro, `ui/sidebar.tsx:150-160`,
`ui/trace.tsx:85-110`, `ui/button.tsx:10-40`, `ui/table.tsx:37`, `ui/attachment.tsx:12`,
`ui/switch.tsx:11,18`, `ui/checkbox.tsx:13`. Seguir MA `theme/motion.css:2-10,30-40` e CR
`tokens.css:123-137,276-287,312`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/brand/tokens.css` | muda | todo `apps/web/src` pelo Tailwind |
| `apps/web/src/ui/` (`sidebar`, `trace`, `button`, `table`, `attachment`, `switch`, `checkbox`) | muda | as telas |
| `DESIGN.md` "Motion", `docs/reference/movimento.md` | muda | o Impeccable, a U2 e a U3 |
| `apps/web/motion.layout.test.ts` | cria | `apps/web/package.json` `test:browser` |
| `apps/web/package.json` | muda: `test:browser` ganha o teste; `lint:design` desce para `--max-warnings 311` | CI |

### Os contratos que a unidade cria

Os nomes, em `@theme` do `tokens.css`, cada um dono do seu número (C26):

```css
--duration-row: 75ms;      /* linha da barra, do menu, da paleta */
--duration-control: 160ms; /* botão, aba, linha de tabela, campo */
--duration-press: 420ms;   /* o toque, na mola --ease-spring-press */
--duration-state: 560ms;   /* chave e caixa, na mola --ease-spring-state */
--duration-menu: 120ms;    /* menu, popover, seletor, combobox, dica */
--duration-window: 150ms;  /* janela, véu, saída da gaveta */
--duration-move: 200ms;    /* entrada da gaveta e do painel */
--duration-page: 160ms;    /* troca de tela */
--ease-enter: cubic-bezier(0.22, 1, 0.36, 1);
--ease-exit: ease-in;
--default-transition-duration: var(--duration-control);
```

As duas molas da decisão A-b, as curvas `linear()` do protótipo (`carater.css:12,14`), copiadas:

```css
--ease-spring-press: linear(0, 0.061, 0.201, 0.371, 0.539, 0.687, 0.808, 0.898, 0.962, 1.003, 1.026, 1.036, 1.038, 1.035, 1.029, 1.023, 1.016, 1.011, 1.007, 1.003, 1.001, 1, 0.999, 0.999, 0.999, 1);
--ease-spring-state: linear(0, 0.043, 0.143, 0.268, 0.397, 0.519, 0.627, 0.719, 0.793, 0.853, 0.898, 0.933, 0.958, 0.975, 0.987, 0.995, 1, 1.003, 1.005, 1.005, 1.005, 1.004, 1.004, 1.003, 1.003, 1);
```
 `--ease-arrive` some: `--ease-enter` é o mesmo
valor; `--animate-fit-a/b` passam a usar `--ease-enter`. Sob `@media (prefers-reduced-motion: reduce)`,
um bloco em `:root` põe todas as `--duration-*` em `0ms`. O Tailwind 4 instalado lê o utilitário `duration-*` de `--transition-duration-*`, não de `--duration-*`: cada nome ganha o seu `@utility`, como o MA faz (`motion.css:30-40`):

```css
@utility duration-row { transition-duration: var(--duration-row); }
/* e o mesmo para control, press, state, menu, window, move e page */
```

O `ease-*` lê `--ease-*`: `ease-enter`, `ease-exit` e `ease-fit` saem do `@theme` sem `@utility`.

### As skills e a leitura

As linhas de `docs/reference/stack.md` para `apps/web/src/ui/` e `apps/web/src/brand/` (Tailwind 4,
shadcn, Base UI). Ler primeiro `docs/guides/design.md` V17, V26 e V28.

### A ordem do trabalho

1. **Tirar o que estica.** Critérios: 3.
   - **Arquivos:** muda `ui/sidebar.tsx:152,158` e `ui/trace.tsx:104`.
   - **Referência a seguir:** folha de 17/11, linhas "Barra lateral" e "Painel que dobra".
   - **O que sai:** `transition-[width] duration-200 ease-linear` e `motion-safe:transition-[height]
     motion-safe:duration-200`; nenhum chamador muda.
   - **Testes:** `motion.layout.test.ts`, "nada estica": lê `transitionProperty` e `transitionDuration`
     do `sidebar-container`, do `sidebar-gap` e do `trace-collapsible-content` e recusa `width`, `height`
     ou `all` com duração acima de 0 s (sem classe, o navegador diz `all` e `0s`, e passa).
   - **Mutações à mão:** devolver `transition-[width]` à linha 152: o teste fica vermelho.
   - **Pronto quando:** recolher a barra na vitrine troca a largura de uma vez.
2. **Os tokens e o reduzir.** Critérios: 4.
   - **Arquivos:** muda `brand/tokens.css`.
   - **Referência a seguir:** MA `motion.css:2-10`; CR `tokens.css:276-287,312`.
   - **O que sai:** `--ease-arrive` (os dois usos em `tokens.css:160-161` passam a `--ease-enter`); os
     `motion-reduce:transition-none` das peças que passam ao token (o token já é 0 ms sob reduzir).
     Ficam os `motion-safe:`/`@media (prefers-reduced-motion: no-preference)` dos laços de trabalho.
   - **Testes:** "com reduzir, nada anima": `page.emulateMedia({ reducedMotion: 'reduce' })`, como
     `pieces.layout.test.ts:72-96`; abre menu, dica, gaveta, janela; lê `transitionDuration` de cada
     um e `document.getAnimations().length`.
   - **Mutações à mão:** tirar o bloco `@media` do `:root`: o teste fica vermelho.
3. **Hover e toque.** Critérios: 1, 2.
   - **Arquivos:** muda `ui/button.tsx`, itens de `ui/sidebar.tsx`, `ui/table.tsx:37`,
     `ui/attachment.tsx:12`, `ui/switch.tsx`, `ui/checkbox.tsx`.
   - **O que entra:** `transition-colors duration-row` nas linhas da barra; `transition-[color,background-color,box-shadow,scale] duration-control` no botão, com `active:scale-96` em `duration-press ease-spring-press`; a chave e a caixa em `duration-state ease-spring-state`. Regras: V17, V26.
   - **Testes:** "o mouse muda só a cor, no tempo da escala" (o estado `data-preview="hover"` da
     vitrine, `tokens.css:15-25`); "o toque cede e volta" (`data-preview="active"`).
4. **A folha e o `DESIGN.md`.** Critérios: 1 a 4.
   - **Arquivos:** reescreve `docs/reference/movimento.md` seções 3, 4 e 6 com os nomes acima e a
     decisão 2 (o estado diz "aprovado em 2026-11-17, revisto em 2026-11-26"); `DESIGN.md` "Motion"
     com os mesmos nomes, sem "Instant: hover, press, ... menus, popovers, ... tooltips".

### Como se prova

`npm run test:browser -w @conexus/web` com `motion.layout.test.ts` acrescentado à lista do script.
Hoje os critérios 1 a 4 falham: a barra anima a largura e o botão não tem transição.

### Parar se

Uma peça copiada do Base UI ou do shadcn escreve a duração por estilo inline: pare e diga qual.

## U2 Entradas e saídas

**Base e modelo.** O commit da U1. Sonnet.

### As linhas da tabela

7 a 11. Ler `ui/popover.tsx`, `ui/dropdown-menu.tsx`, `ui/select.tsx`, `ui/combobox.tsx`,
`ui/tooltip.tsx`, `ui/dialog.tsx:50-60`, `ui/alert-dialog.tsx:28-38`, `ui/sheet.tsx:20-64`,
`ui/drawer.tsx:28-38`, `main.tsx:80-105`, `ui/pieces-fixture.tsx:84`. Seguir Base UI
`docs/react/handbook/animation.md:19-24` e `docs/react/components/tooltip.md:79`, MA-ds `Tooltip/tooltip.tsx:106-110`, SH-ui
`sheet.tsx:31,56`, DF-ui `drawer/index.tsx:57,90-98`, `@tanstack/router-core` `router.js:491-506`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/ui/` (as nove peças acima) | muda | as telas |
| `apps/web/src/main.tsx`, `apps/web/src/ui/pieces-fixture.tsx` | muda (`defaultViewTransition`) | o Hub e a vitrine |
| `apps/web/src/brand/tokens.css` | muda (a regra `::view-transition` da folha) | · |
| `apps/web/src/ui/sidebar.tsx:198` (`sidebar-inset`) | muda só se o seletor da regra pedir uma classe | `ui/frame.tsx` |
| `apps/web/motion.layout.test.ts` | muda: os casos dos critérios 4 a 7 | `test:browser` |

### Os contratos que a unidade cria

Nenhum tipo. Uma classe por peça e a regra da troca de tela:

```css
[data-slot="sidebar-inset"] { view-transition-name: sheet; }
::view-transition-old(sheet), ::view-transition-new(sheet) { animation-duration: var(--duration-page); }
::view-transition-old(root), ::view-transition-new(root) { animation: none; }
```

### A ordem do trabalho

1. **Menu, popover, seletor, combobox, dica.** Critérios: 5.
   - **Referência a seguir:** `components/tooltip.md:79`: `origin-(--transform-origin) transition-[scale,opacity]
     duration-menu ease-enter data-starting-style:scale-96 data-starting-style:opacity-0
     data-ending-style:scale-96 data-ending-style:opacity-0 data-ending-style:duration-row` e, na
     dica, `data-instant:transition-none` (MA `tooltip.tsx:110`).
   - **O que sai:** a nota de `ui/tooltip.tsx:4-5` que diz que a entrada foi tirada.
   - **Testes:** "o menu e a dica entram curtos".
2. **Janela, gaveta, painel.** Critérios: 6.
   - **O que entra:** `duration-window` no véu e na janela; na gaveta e no painel,
     `duration-move ease-enter` na entrada e `data-ending-style:duration-window ease-exit`; as curvas
     soltas (`ease-in-out`, `ease-out`) saem; `data-swiping:duration-0` fica.
   - **Testes:** "a janela e a gaveta".
3. **A troca de tela.** Critérios: 7.
   - **O que entra:** `defaultViewTransition: true` nos dois `createRouter`; a regra acima em
     `tokens.css`. Sob reduzir, a duração já é 0.
   - **Testes:** "a troca de tela esmaece a folha": navega pela barra e lê
     `document.getAnimations()` filtrando `pseudoElement` `::view-transition-new(sheet)`.

### Como se prova

Os critérios 5 a 7 falham hoje: menu e dica não têm transição e o roteador não usa View Transitions.

### Parar se

A View Transition fizer a barra piscar ou mover o foco: pare, com a captura; o critério 7 é should e
pode sair para a R2.

## U3 A direção visual nos tokens

**Base e modelo.** O commit da U2; o pull request de método da decisão B-a entrou em `main` antes da U1. Opus: o
`document` do Impeccable reescreve o `DESIGN.md` inteiro e a unidade cruza tokens, peças e o teste de
paridade.

### As linhas da tabela

12 a 19. Ler a seção "Fechamento" do relatório dos protótipos (a paleta final, os outros tokens, o
contraste medido) e `fase5-direcoes-v2/b-noites.css`, `carater.css:1-60`, que o estudo guarda; no
`main`, `brand/tokens.css` inteiro, o front matter do `DESIGN.md`, `brand/tokens.test.ts`,
`ui/frame.tsx`, `ui/sidebar.tsx:140-200`, `ui/button.tsx`, `ui/switch.tsx`, `ui/checkbox.tsx`,
`ui/meter.tsx`, `ui/badge.tsx`, `ui/input.tsx`, `ui/input-group.tsx`, `ui/card.tsx`,
`docs/reference/impeccable.md`, `PRODUCT.md`. Seguir SH-ui `sidebar.tsx:154,162,224-235`, CR
`tokens.css:120`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/brand/tokens.css`, `DESIGN.md` front matter e prosa | muda | todo `apps/web/src`; `brand/tokens.test.ts`; o Impeccable |
| `apps/web/src/ui/` (as peças da linha da matriz) | muda | as telas |
| `docs/reference/impeccable.md`, `PRODUCT.md` | muda | o Impeccable, as skills |
| `apps/web/contrast.layout.test.ts` | cria | `test:browser` |
| `apps/web/package.json` | muda: `test:browser` ganha o teste | CI |
| `apps/web/src/brand/tokens.test.ts`, `apps/web/tokens.layout.test.ts`, `frame.layout.test.ts`, `pieces.layout.test.ts`, `focus.layout.test.ts` | muda: os valores e os casos dos critérios 8, 10, 11 e 12 | `test:browser`, `test:unit` |

### Os contratos que a unidade cria

Os tokens que entram (o resto troca só o valor): `--color-frame` (a moldura, o `--noite` do protótipo),
`--color-raised` (o que flutua, `--elevado`), `--color-accent-from`, `--color-accent-to` (o ipê aceso,
`--ipe-a`, `--ipe-b`), `--color-on-accent` com o valor de `--sobre-ipe`, `--color-focus`,
`--color-notice`, `--color-on-notice`; `--shadow-1`, `--shadow-2`, `--shadow-ring` (as camadas
`--sombra-1`, `--sombra-2`, `--aro`). Cada um no front matter do `DESIGN.md` com o mesmo nome, que o
`tokens.test.ts` confere. Os valores, copiados da tabela "A paleta final" do fechamento (lidos no navegador; nunca escolhidos
aqui), em claro / escuro:

| Token | Claro | Escuro |
| --- | --- | --- |
| `frame` (moldura e barra) | #181818 | #101010 |
| `canvas` (mesa) | #f1f1f1 | #141414 |
| `surface` (folha) | #fcfcfc | #191919 |
| `surface-3` (azulejo, áreas recuadas) | #f1f1f1 | #222222 |
| `raised` (o que flutua) | #ffffff | #282828 |
| `surface-4` | #e6e6e6 | #2f2f2f |
| `line` | #e2e2e2 | #303030 |
| `line-strong` | #808080 | #7a7a7a |
| `text`, `ink` | #1d1d1d | #f0f0f0 |
| `text-2` | #585858 | #b1b1b1 |
| `on-ink` | #ffffff | #191919 |
| `accent-from` / `accent-to` (o ipê) | #f5ab0e / #ffd445 | #f0ad27 / #ffd766 |
| `on-accent` (tinta sobre o ipê) | #1f1600 | #1f1600 |
| `accent-soft` | #f8e8bd | #2b2a1c |
| `focus` | #1d1d1d | #ffd766 |
| `notice` / `on-notice` (aviso) | #191919 / #f2f2f2 | #f2f2f2 / #191919 |
| `success` | #1f9d5c | #55d394 |
| `warning` | #d97a06 | #f5a742 |
| `danger` | #d93a4a | #ff7d8a |

O item ativo da barra é a moldura com 14% de branco (#333333 / #2b2b2b). As sombras `shadow-1`,
`shadow-2` e `shadow-ring` seguem `b-noites.css:31-33` do protótipo, com o grafite (força de cor 0).
`accent`, `accent-text`, `mark`, `memory` e as cores de código não estão na tabela: ficam como estão,
e um par deles abaixo de 4,5:1 sobre a folha nova para a unidade (Parar se).

### A ordem do trabalho

1. **Liberar o `document`.** Critérios: nenhum.
   - **Arquivos:** `docs/reference/impeccable.md`: `document` sai da lista proibida, com a decisão 3
     do fundador (2026-11-26, "abrir"); `live` e `generate` continuam fora (não servem a uma unidade de
     código). `PRODUCT.md`: o anti-alvo "parecer feito por IA" e o alvo "premium em UI e UX, como os
     apps de grandes empresas", com a decisão 7 do estudo.
2. **Os tokens.** Critérios: 8, 12.
   - **O que entra:** os valores da paleta final em `light-dark()`; raios 10, 14, 16 e 22; título 1,875
     rem, peso 700; o aro de foco de `tokens.css:308` em `outline-focus`.
   - **Testes:** `tokens.test.ts`, `tokens.layout.test.ts` "o tema" com os valores novos.
3. **A moldura e a folha.** Critérios: 10.
   - **Referência a seguir:** SH-ui `sidebar.tsx:224-235` (a variante `inset`: margem e raio na folha).
   - **Testes:** `frame.layout.test.ts`, "a folha encaixada na moldura".
4. **A sombra no lugar do filete e o ipê aceso.** Critérios: 11.
   - **O que sai:** `border border-line` das peças brancas; `bg-ink` do botão principal, da chave e da
     caixa ligadas.
   - **Testes:** `pieces.layout.test.ts`, "o ipê acende só o que está ligado".
5. **O contraste.** Critérios: 9.
   - **O que entra:** `contrast.layout.test.ts` lê a cor computada de cada par de token (texto, texto
     de apoio e tinta sobre folha, azulejo, moldura, ipê e aviso) nos dois temas e calcula a razão da
     WCAG 2.2.
   - **Mutações à mão:** trocar `--color-text-2` do claro por `#9a9a9a`: o teste falha nomeando o par.
6. **O `DESIGN.md`.** Critérios: 8.
   - **O que entra:** o `document` do Impeccable sobre o código desta unidade; a prosa perde "Pauta" e
     ganha a direção B; o "Motion" da U1 fica.

### Como se prova

Os critérios 8 a 12 falham hoje: os valores são os da Pauta e não há teste de contraste.

### Parar se

Um par da paleta final passa abaixo de 4,5:1 numa peça real: pare e mande o par ao fundador; nunca
ajuste a cor. O pull request da decisão B-a não está em `main`: a etapa não começa (vale para a U1).

## U4 Aviso e esqueleto

**Base e modelo.** O commit da U3. Sonnet.

### As linhas da tabela

20 e 21. Ler `node_modules/@base-ui/react/docs/react/components/toast.md:418-560`,
`harness/model-accounts/default-choice.tsx:40-110`, `main.tsx:95-105`, `ui/pieces-fixture.tsx`,
`ui/showcase/feedback.tsx`, `ui/skeleton.tsx`. Seguir DF-ui `toast/index.tsx:150-177`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/ui/notice.tsx` | cria | `default-choice.tsx` |
| `apps/web/src/main.tsx`, `apps/web/src/ui/pieces-fixture.tsx` | muda: montam o `NoticeProvider` | o Hub e a vitrine |
| `apps/web/package.json` | muda: `test:browser` ganha `notice.layout.test.ts` | CI |
| `apps/web/motion.layout.test.ts` | muda: o aviso no caso do critério 4 | `test:browser` |
| `apps/web/src/ui/showcase/feedback.tsx` | muda (entrada nova) | a vitrine |
| `apps/web/src/harness/model-accounts/default-choice.tsx` | muda | `company-defaults.tsx`, `my-defaults.tsx` |
| `apps/web/src/ui/skeleton.tsx` | muda | as telas que carregam |
| `DESIGN.md` "Toast" | muda | o Impeccable |
| `apps/web/notice.layout.test.ts` | cria | `test:browser` |

### Os contratos que a unidade cria

Em `apps/web/src/ui/notice.tsx`:

```ts
export function NoticeProvider(props: { children: ReactNode }): ReactNode
export type Notice = { title: string; description?: string }
export function useNotice(): (notice: Notice) => void
```

Um só tipo de aviso, o de feito: o erro não vai para aviso (folha de movimento, "Erro, aviso,
validação: nunca"). `NoticeProvider` monta `Toast.Provider` (`timeout` 5000, `limit` 3),
`Toast.Portal` e `Toast.Viewport` uma vez, em `main.tsx` e em `pieces-fixture.tsx`.

### A ordem do trabalho

1. **A peça.** Critérios: 14, 15.
   - **Referência a seguir:** DF-ui `toast/index.tsx:150-177` sem a transição de altura
     (`height_150ms`, `:154`); a cor `--color-notice` e `--color-on-notice` da U3; entrada em
     `duration-move ease-enter`, saída em `duration-window`.
   - **O que entra:** a entrada na vitrine (`ui/showcase/feedback.tsx`) e a linha "Toast" do
     `DESIGN.md`, que perde "None exists". Regras: V17, V26, V62.
2. **O primeiro uso.** Critérios: 13.
   - **O que entra:** o tipo `Callbacks` de `default-choice.tsx:42` (`{ onError, onSettled }`) ganha
     `onSuccess: () => void`, que `useOneWrite` (`:48-66`) passa adiante; o `onSuccess` de `save()`
     (os dois envios do botão "Salvar padrão", `mineSend` e `companySend`) chama
     `notice({ title: 'Padrão salvo' })`. "Usar o da empresa" (`clear`) não avisa; o `onError` e o
     `onSettled` não mudam, e o aviso nunca vai no `onSettled`, que corre também no erro.
   - **Testes:** `notice.layout.test.ts`, "salvar o padrão avisa" (resposta 200 dublada) e "o erro
     fica no campo" (resposta de recusa dublada).
3. **O esqueleto.** Critérios: 4.
   - **O que entra:** o pulso de `ui/skeleton.tsx:10` fica; sai o `motion-reduce:animate-none` só se a
     U1 tiver parado o `animate-pulse` pelo token; senão fica.

### Como se prova

Os critérios 13 e 14 falham hoje: salvar o padrão não mostra nada.

### Parar se

O `Toast.Viewport` do Base UI escrever estilo inline que a CSP recuse (`page.problems` na vitrine):
pare, com o erro.

## G1 O ponto de conferência

Depois da U2: `npm run test:browser -w @conexus/web` e `npm run lint:design -w @conexus/web`; a vitrine
aberta a 1366 e 390 px nos dois temas, com e sem reduzir; capturas de menu, dica, gaveta e janela no
meio da entrada.

## G2 O ponto de conferência

Depois da U4: os mesmos comandos; `impeccable detect` nos arquivos mudados; capturas do Hub claro e
escuro ao lado das capturas `b-*` da direção, peça por peça; o aviso de "Padrão salvo" em
Configurações › Modelos.
