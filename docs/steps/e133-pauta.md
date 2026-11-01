# Etapa 13.3: a Pauta

O visual novo do Hub, "Pauta", e as primeiras unidades da auditoria do front-end. O número segue as
telas da casa (12.2 a casa, 13.1 o primeiro pedido, 13.2 as configurações); o lugar no roteiro é a
sua decisão A, abaixo.

## A página do fundador

**No fim desta etapa** o Hub tem o visual que você aprovou em 2026-11-01. À esquerda, um trilho
fino de ícones e a lista das suas conversas por dia. No meio, uma coluna só, com uma medida só.
Toda lista usa a mesma linha de 32 px, como as linhas de um talão de pedidos. Uma fonte só, em 7
tamanhos. O dourado só marca onde você está, o foco e a marca. A caixa da conversa tem uma linha só,
na mesma ordem em toda tela: à esquerda o "+", a pasta do Projeto e as ferramentas; à direita o
modelo, a memória, o microfone e o enviar. Dentro de uma conversa do Assistente você troca o modelo,
como no Builder.

**O roteiro de uso.** Padaria Sol, como na 24.1: Ana (dona), Bia (administradora), Bruno (membro).
Sankhya em "Matriz" e "Filial", Mercado Livre em "Loja"; o Projeto "Vendas" recebeu só a Matriz.

1. A Ana abre o Início no computador. À esquerda, o trilho (Início, Projetos, Integrações,
   Configurações, ela) e a lista Conversas, em Hoje, Ontem, Esta semana e Antes. No meio, numa
   coluna: a saudação, a caixa, Continuar, e Projetos ao lado de Ligações, cada estado em palavras
   ("Publicado · v3", "Pede para conectar de novo").
2. Ela toca no "+": Anexar arquivo e as três ferramentas, ligadas. Desliga a Loja. Na pasta, escolhe
   Vendas: o menu passa a mostrar só a Matriz. Pergunta, e a conversa abre no Projeto.
3. Na conversa, a linha da caixa é a mesma: "+", a pasta "Vendas" fixa, "1 ferramenta"; à direita o
   modelo, a Memória, o microfone e o enviar. Ela troca o modelo; a próxima resposta vem do novo.
4. Ela abre uma conversa sem Projeto: a pasta fica apagada, no mesmo lugar. Liga a Loja no "+", e a
   próxima pergunta lê a Loja.
5. No celular, o mesmo: a navegação abre pelo botão do topo, o "+" e a pasta abrem de baixo para
   cima, as palavras encurtam e nenhum botão muda de lado.
6. No tema escuro, o mesmo. O Bruno (membro) vê o Início dele, no visual novo.

**O que você faz, e quando.**
- **No começo:** aprova esta página e responde A e B.
- **No fim:** faz o roteiro no computador e no celular, diz o que viu e aprova os textos das telas.

**O que muda no cartão da 24.1.** A barra embaixo da caixa sai. A escolha das ferramentas e a do
Projeto passam para o "+" e para a pasta, dentro da caixa. No cartão da 24.1, cada trecho da barra
ganha um aviso apontando para este cartão: a matriz, os critérios 23 a 24, a linha "A barra", os
passos 1, 4 e 5 do roteiro e a regra W30. O cartão da 24.1 não perde o que dizia. O que a 24.1
exige da barra continua valendo no "+": liga e desliga por ferramenta, tudo começa ligado, e na
conversa de Projeto aparecem só as ferramentas liberadas a ele.

**O critério 8 da 24.1 continua.** A conversa nasce com o modelo que você escolheu ou com o seu
padrão. A troca vale da resposta seguinte em diante; a resposta em andamento termina no modelo em
que começou.

**Fica de fora.**
- As unidades U6 a U9 da auditoria: carregar as três telas pelo `loader`, apagar as atualizações
  repetidas, as limpezas pequenas e o texto dos guias. Elas não dependem do visual e vão em fila
  própria.
- O resto da lista de fechamento da 24.1.
- Peças da AffectUI que esta etapa não usa (aprovação, plano, aviso flutuante). Cada uma entra com
  a sua etapa, sempre redesenhada sobre as nossas peças, nunca copiada.
- Um aviso flutuante (toast). O Hub ainda não tem nenhum; fica especificado no DESIGN.md.
- **Das pendências marcadas para o próximo cartão:** a #272 (a resposta livre de uma pergunta tem
  uma linha só) entra na U9, que troca justamente essa caixa. A #384 (no celular, um Projeto sem
  conversa não mostra a caixa), a #382 (a fila de anexos esconde arquivos) e a #513 (o carregador
  das mensagens antigas sem palavras) são da conversa do Builder, que a Pauta não redesenha; cada
  uma espera a etapa dessa conversa.

**As decisões suas nesta etapa.**

**A. Onde a etapa entra no roteiro.**
- **A1 (recomendo):** logo depois da 24.2. As telas da 24.2 (as Automações e o sino, no pull request
  https://github.com/developmentconexus-ops/conexus/pull/533) já estão prontas e mexem nos mesmos
  arquivos que a Pauta troca: a caixa, a barra, o Início e a barra lateral. Com a A1, elas entram
  como estão, e a Pauta leva o sino e as Automações para o trilho uma vez só. As unidades U1 e U2
  (as cores e as medidas) não tocam esses arquivos e já podem ser construídas durante a 24.2.
- **A2:** logo depois do fechamento da 24.1, antes das telas da 24.2. Você vê a Pauta antes. Mas a
  24.2 inteira espera a Pauta fechar, e as telas dela são refeitas sobre o trilho e a caixa nova.
- Veredito: nativo nos dois (a regra L1, uma etapa por vez). Exemplo da A1: a 24.2 é usada por você
  no visual de hoje; dias depois, a Pauta troca o visual inteiro, sino incluído.

**B. Onde mora o DESIGN.md.** Hoje o `DESIGN.md` da raiz é só um atalho para o guia de desenho. O
guia só pode mudar entre duas etapas (regra L20). Mas as cores dele têm de mudar junto com o código
das cores, e a U1 cria uma conferência que recusa qualquer diferença entre os dois.
- **B1 (recomendo):** o `DESIGN.md` da raiz vira o documento completo da Pauta, como o Claude
  Design faz: cores, fontes, medidas, sombras e cada peça. Ele muda junto com o código, conferido.
  O guia fica só com as regras e aponta para ele. A lista de peças de hoje
  (`docs/reference/components.md`) entra no `DESIGN.md` e sai, para haver um lugar só.
- **B2:** tudo continua no guia. As cores novas só entram nele no fechamento, e a conferência da U1
  fica desligada até lá.
- Veredito: nativo nos dois. Exemplo da B1: amanhã alguém escurece o cinza de fundo; muda o
  `DESIGN.md` e o código no mesmo pull request, e o teste recusa se mudar só um.

**A sua palavra já dada.** "Aprovo", à Pauta revisada; "A", à troca do modelo dentro da conversa;
e a ordem da linha da caixa. Estão no registro de aprovações, seção "Etapa 13.3".

**O tamanho.** Cerca de **1.900 linhas** de código, abaixo do teto de 4.000 (regra L2).

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U0 | O `DESIGN.md` da Pauta na raiz, com as cores, os tipos, as medidas e as peças; o guia de desenho só com as regras, emendadas à Pauta; a W30 com o trilho; `components.md` dentro do `DESIGN.md` | `DESIGN.md`, `docs/guides/design.md`, `docs/guides/web.md`, `docs/reference/components.md`, `docs/reference/impeccable.md`, `docs/index.md`, `PRODUCT.md` | [delivery](../guides/delivery.md) | a decisão B1 e a janela entre duas etapas (L20) |
| U1 | Os tokens com uma fonte: `tokens.css` igual ao `DESIGN.md`, com um teste que recusa a diferença; o escuro escrito uma vez; os valores da Pauta; Hanken Grotesk em 7 tamanhos, a Bricolage sai (auditoria U1) | `apps/web/src/brand/` | [web](../guides/web.md) | U0 |
| U2 | Os tokens de medida: controle 32 e 28, a linha 32, o celular 390; as peças os usam (auditoria U2) | `apps/web/src/brand/`, `apps/web/src/ui/`, `apps/web/src/builder/preview/`, `apps/web/src/hub/projects/recent-projects.tsx`, `DESIGN.md` | [web](../guides/web.md) | U1 |
| U3 | A moldura da Pauta: o trilho de ícones e a lista Conversas por dia, o eixo de 720/880, os blocos do Início (Continuar, Projetos, Ligações) com o estado em palavras; `ProjectSummary` com as versões | `apps/web/src/ui/` (`sidebar.tsx`, `frame.tsx`), `apps/web/src/routes/_app/companies/$companyId/`, `apps/web/src/builder/assistant/`, `apps/web/src/hub/projects/`, `apps/web/src/hub/identity/account-menu.tsx`, `packages/hub-api/src/projects.ts`, `apps/server/src/hub/projects/` | [web](../guides/web.md) | U2 |
| U4 | A linha da caixa: uma peça, uma ordem, nas três telas; `useComposerTools` como a única fonte; a memória ausente no Início; a pasta apagada sem Projeto; as regras do celular; a barra de hoje sai, e a escolha das ferramentas e do Projeto continua funcionando pela contagem e pela pasta | `apps/web/src/builder/conversation/` (`composer.tsx`, `memory-status.tsx`, `public.ts`, `start.tsx`, `chat.tsx`), `apps/web/src/builder/assistant/`, `apps/web/src/builder/model-accounts/model-picker.tsx` | [web](../guides/web.md) | U3 |
| U5 | O menu "+": Anexar arquivo, um interruptor por ferramenta, a busca a partir de 7, "Conectar outra ferramenta"; a pasta do Projeto no Início; "N ferramentas" | `apps/web/src/builder/assistant/` | [web](../guides/web.md) | U4 |
| U6 | O modelo dentro da conversa do Assistente: a rota de troca, como a do Builder, e o botão do modelo na linha da caixa | `packages/hub-api/src/assistant.ts`, `apps/server/src/builder/assistant/`, `apps/web/src/builder/assistant/` | [testing](../guides/testing.md) | o servidor, nenhuma; a tela, U5 |
| U7 | A peça Alerta: os 30 erros escritos à mão passam a ela (auditoria U3) | `apps/web/src/ui/`, as telas com `role="alert"` | [web](../guides/web.md) | U5 |
| U8 | O seletor da barra lateral numa peça só, para empresa, Central e Projeto, e `useCompanies` (auditoria U4) | `apps/web/src/ui/`, `apps/web/src/hub/identity/`, `apps/web/src/hub/operations/`, `apps/web/src/hub/projects/project-rail.tsx` | [web](../guides/web.md) | U3 |
| U9 | O `Card` e a `Textarea` de `ui/` onde hoje se desenha à mão (auditoria U5) | `apps/web/src/builder/conversation/`, `apps/web/src/hub/projects/`, `apps/web/src/hub/identity/`, `apps/web/src/builder/model-accounts/` | [web](../guides/web.md) | U3 |

A fila é U0, U1, U2, U3, U4, U5. O servidor da U6 não depende de nenhuma e pode ser feito a
qualquer momento; a tela da U6 vem depois da U5, porque as duas mudam `builder/assistant/` e
`conversation.test.tsx`. A U8 e a U9 correm juntas depois da U3; a U7, depois da U5,
porque troca o erro da caixa.

**Quando cada uma pode começar** (delivery L1, L20). A U0 é só de documentos e muda guias: entra na
janela em que nenhum cartão do trilho de fronteira está em `docs/steps/`, entre o fechamento da etapa
de antes e a entrada deste cartão. A U1 e a U2 não tocam nenhum arquivo de código da 24.1 nem da 24.2
(conferido em 2026-11-01 contra os pull requests 532, 533 e 535); como a 533 muda
`apps/web/layout.test.ts` e `apps/web/phone.layout.test.ts`, os casos da U1 vão num arquivo novo,
`apps/web/tokens.layout.test.ts`, e os da U2 em `pieces.layout.test.ts`, que nenhuma delas toca: constroem-se nos seus ramos assim
que esta página for aprovada, e entram depois da U0.

**Orçamento de código alterado.** U0: 0 (só documentos). U1: ~150. U2: ~60. U3: ~660. U4: ~350, mais
as ~270 linhas da barra que saem. U5: ~260. U6: ~90. U7: ~70. U8: ~95. U9: ~35. Total da etapa:
~1.900, com a barra apagada. A hipótese vem do laboratório da Pauta (21 arquivos, +1.132 −164, e o
`composer-tools.tsx` com 440 linhas, dividido aqui entre a U4 e a U5) e da contagem da auditoria
(U1 a U5: −150, +145). Testes e gerados ficam fora da conta.

## Os critérios de aceite

O aceite da etapa: o roteiro, a 1366 e a 390 px, nos dois temas, com as medidas dos critérios 5, 7 e
13 conferidas no navegador, e a troca de modelo do critério 24.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Cada cor, raio, espaço, largura e tipo do `DESIGN.md` é o mesmo valor em `tokens.css`; mudar um só dos lados faz o teste falhar com o nome do token; um token de `tokens.css` que o `DESIGN.md` não tem também falha (os `code-*` entram no `DESIGN.md`) | `apps/web/src/brand/tokens.test.ts` | must |
| 2 | U1 | O tema escuro está escrito uma vez: com `data-theme="dark"`, e com o sistema escuro sem `data-theme="light"`, o fundo da moldura é `#121417` e a folha `#181b1f`; com `data-theme="light"` num sistema escuro, `#f5f6f7` e `#ffffff` | `apps/web/tokens.layout.test.ts`, "o tema" (novo) | must |
| 3 | U1 | Nenhuma fonte além de Hanken Grotesk e JetBrains Mono é declarada ou baixada; a saudação do Início tem 28 px com linha de 36 (24/32 abaixo de 640 px), e toda altura de linha de texto é múltipla de 4 | `apps/web/pieces.layout.test.ts`, "a fonte" | must |
| 4 | U2 | Um botão tem 32 px de altura e o de uma linha 28; um item de menu, de seleção e de barra lateral, 32; num toque (`pointer: coarse`) cada um alcança 44 × 44 sem desenhar maior (V32); o celular desenhado da Prévia mede 390 | `pieces.layout.test.ts` | must |
| 5 | U3 | A 1366 px, a dona vê o trilho de 56 px (Início, Projetos, Integrações, Configurações no alto; ela no pé) e a lista de 272 px com "Nova conversa" e "Conversas"; cada linha da lista mede 32; o lugar atual tem o traço dourado de 2 px no trilho e na lista, com `aria-current="page"` | `apps/web/home.layout.test.ts`, "a moldura" | must |
| 6 | U3 | A lista agrupa as conversas da pessoa por dia, no fuso do navegador, como toda data da tela (`platform/dates.ts:1`): Hoje, Ontem, Esta semana (até 7 dias), Antes; cada linha com a idade à direita; uma conversa de Projeto leva o nome dele; sem conversas, só "Nova conversa"; a lista mostra a primeira página (50) e o `Pager` de hoje para as seguintes; o membro vê na lista os Projetos recentes, como hoje | `apps/web/src/builder/assistant/sidebar-conversations.test.tsx`, com o relógio e o fuso fixados (`vi.setSystemTime`, `TZ=America/Sao_Paulo`) | must |
| 7 | U3 | No Início, a saudação, a caixa, Continuar e o par Projetos e Ligações têm o mesmo centro e a mesma largura: 720 px a 1366 (cada metade 352, vão 16) e 880 a 1920 (432) | `home.layout.test.ts`, "o eixo" | must |
| 8 | U3 | Os blocos do Início: Continuar com as 5 últimas conversas; Projetos com o estado em palavras ("Publicado · v3", "Em construção · v2", "Ainda sem app"); Ligações com a palavra de `stateBadge` (`hub/connectors/text.ts:34-44`: "Funcionando", "Pede para conectar de novo", "Chaves recusadas"), sem palavra para uma ainda não testada, como em Integrações; no máximo 5 linhas e "Mais N"; cada bloco vazio com a sua frase; uma falha de leitura com a frase do código e Tentar de novo | `apps/web/src/builder/assistant/day.test.tsx` | must |
| 9 | U3 | `GET /api/companies/{c}/projects` dá, em cada Projeto, `appVersion` e `publishedVersion`, `null` antes da primeira versão e da primeira publicação, os mesmos números que `getProject` | `apps/server/src/hub/projects/projects.test.ts`, "as versões na lista" | must |
| 10 | U3 | A 390 px, o trilho e a lista abrem juntos na gaveta de "Abrir navegação"; a barra do topo tem 52 px; nada rola de lado a 390 nem a 200% de zoom (V18, V56) | `phone.layout.test.ts`, "a gaveta" | must |
| 11 | U3 | Dentro de um Projeto o trilho continua, e a lista é a do Projeto (o nome com o seletor, Construir, Conversas, Sobre, Quem usa o app, Integrações); sair do Projeto devolve a lista de Conversas | `apps/web/workbench.layout.test.ts`, "o trilho no Projeto" | must |
| 12 | U3 | O dourado aparece só no traço do lugar, no foco, no cursor de texto, na aba ativa e na marca: o enviar, ao passar o mouse, fica no cinza de destaque (`surface-3`), não dourado | `apps/web/focus.layout.test.ts`, "o dourado" | should |
| 13 | U4 | A linha da caixa tem a mesma ordem no Início, na conversa e na conversa de Projeto: à esquerda "+", pasta, ferramentas; à direita modelo, memória (onde existe conversa), microfone, enviar. Sem Projeto, a 1366, medido da borda da caixa, "+" em 13, pasta em 49, ferramentas em 85, enviar em 675, e a 390 os mesmos três da esquerda; com o nome do Projeto na pasta, a mesma ordem, com as ferramentas depois do nome. Até a U6, na conversa do Assistente o modelo aparece só para leitura (o botão desabilitado com o modelo da sessão) | `apps/web/assistant.layout.test.ts`, "a linha da caixa" | must |
| 14 | U4 | No Início a memória não aparece; na conversa, "Memória N%" aparece no mesmo lugar | `apps/web/src/builder/assistant/home.test.tsx`, `conversation.test.tsx`, "a memória" | must |
| 15 | U4 | Numa conversa sem Projeto, a pasta fica apagada, com o nome acessível "Conversa sem Projeto", e não abre nada; numa conversa de Projeto, a pasta mostra o nome dele e não abre nada | `conversation.test.tsx`, "a pasta" | must |
| 16 | U4 | Abaixo de 416 px saem as palavras, nunca os controles, nesta ordem: "N ferramentas" vira o número, o nome do Projeto vira a pasta, "Memória" vira o anel e a porcentagem, o modelo perde "Claude "; abaixo de 320 px o grupo da esquerda ganha uma linha própria; nenhum controle troca de lado | `phone.layout.test.ts`, "a linha no celular" | must |
| 17 | U4 | A barra embaixo da caixa (as etiquetas, **Ajustar**, "Sem Projeto") não aparece mais em nenhuma tela; a caixa do Builder mostra o modelo à direita e nada mais muda nela | `home.test.tsx`, `apps/web/src/builder/conversation/composer.test.tsx` | must |
| 18 | U5 | O "+" abre, a partir de 768 px num menu e abaixo numa folha de baixo para cima ("Anexar e ferramentas"): Anexar arquivo; "Ferramentas da conversa" com "N de M ligadas"; um interruptor por ferramenta que o lugar oferece, todos ligados ao abrir uma conversa nova (a contagem e a pasta da U4 passam a abrir este menu); e "Conectar outra ferramenta" (Integrações) ou, num Projeto, "Liberar outra ferramenta ao Projeto" (Integrações do Projeto) | `apps/web/src/builder/assistant/composer-tools.test.tsx`, "o menu" | must |
| 19 | U5 | Com 7 ferramentas ou mais aparece a busca; "loja" filtra pelo nome; sem resultado, "Nenhuma ferramenta com esse nome."; com 6, nenhuma busca | `composer-tools.test.tsx`, "a busca" (com 11 e com 6) | must |
| 20 | U5 | Antes da primeira pergunta, um interruptor muda só o rascunho; depois, cada um manda `PUT …/connections` e mostra o que o Hub respondeu; os interruptores ficam parados enquanto a troca anda; uma troca recusada volta à escolha de antes, com a frase do código num alerta (o 23a da 24.1, agora no "+") | `conversation.test.tsx`, "o +" | must |
| 21 | U5 | No Início, a pasta abre "Sem Projeto" e os Projetos (busca a partir de 7); escolher Vendas faz o "+" mostrar só as ferramentas liberadas a ele; enviar cria a conversa com o Projeto e as ferramentas escolhidas e abre o endereço do Projeto (o 23 e o 24 da 24.1) | `home.test.tsx`, "a pasta" | must |
| 22 | U5 | "N ferramentas" mostra até 3 logos e o número; com nenhuma, "Sem ferramentas"; tocar nele abre o "+"; sem ferramenta no lugar, o menu diz "Nenhuma ferramenta ligada à empresa" (Início) ou a frase do Projeto da 24.1, com o caminho | `composer-tools.test.tsx`, "a contagem" | must |
| 23 | U6 | `PUT /api/companies/{c}/assistant/conversations/{id}/model` pela dona da conversa, com `model` e `effort`, responde 200 com o modelo e o esforço guardados; um modelo sem conta: `MODEL_NO_ACCOUNT`; um modelo que o Hub não serve: `MODEL_UNKNOWN`; um esforço que o modelo não tem: `EFFORT_UNSUPPORTED`; nada muda numa recusa; a conversa de outra pessoa, ou pedida por um membro: a mesma resposta de `readAssistantConversation`; duas trocas seguidas: a segunda vale; o log `ASSISTANT_MODEL_SET` sai uma vez por troca aceita; o banco do Mastra fora: `DATABASE_UNAVAILABLE` | `apps/server/src/builder/assistant/routes.test.ts`, "o modelo" | must |
| 24 | U6 | Depois da troca, a resposta seguinte usa o modelo novo; uma resposta em andamento termina no modelo em que começou (V54); a leitura da sessão (`sessionReadQuery` com `ASSISTANT_CONTROLLER`, a rota de estado do Mastra) mostra o modelo novo; a criação continua como o critério 8 da 24.1 | `apps/server/src/builder/assistant/assistant.test.ts`, "a troca do modelo" | must |
| 25 | U6 | Na conversa do Assistente, o botão do modelo troca o modelo pela rota; uma recusa mostra a frase do código embaixo e volta ao de antes; depois de recarregar, o botão mostra o modelo que a leitura da sessão dá | `conversation.test.tsx`, "o modelo" | must |
| 26 | U7 | O erro da caixa, o de um formulário e o de uma leitura são a mesma peça Alerta, no mesmo tamanho e cor; cada tela que lia `getByRole('alert')` continua lendo | `apps/web/src/ui/alert.test.tsx`; os testes das telas tocadas | must |
| 27 | U8 | Trocar de empresa, abrir a Central e trocar de Projeto funcionam como hoje, por uma peça só; a lista de empresas é lida uma vez por tela | `apps/web/src/hub/identity/company-switcher.test.tsx`, `apps/web/src/hub/projects/project-bar.test.tsx`, `workbench.layout.test.ts` | must |
| 28 | U9 | O cartão do plano, os de Projeto, o de preparação e o da troca automática são o `Card` de `ui/`; a resposta livre de uma pergunta é a `Textarea` de `ui/`, com o foco na borda (V28), e cresce em várias linhas (a #272) | `focus.layout.test.ts`, "a resposta livre"; os testes das telas tocadas | must |
| 29 | U3 a U6 | A QA faz o roteiro no computador e no celular, nos dois temas, e abre cada captura ao lado das capturas da Pauta (T25) | a QA | must |
| 30 | U3 a U9 | `impeccable detect` nos arquivos mudados não acha nada novo, ou cada achado tem o veredito da regra L12 no pull request | a unidade, no seu pull request | should |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A moldura (trilho e lista) | a lista com "Nova conversa" e "Conversas" vazia | sem conversas: só "Nova conversa" | a lista em esqueleto, nas linhas de 32 | a frase da falha (`DATABASE_UNAVAILABLE`) com Tentar de novo, na lista | — | o membro: a lista dos Projetos recentes, como hoje | — |
| O Início da dona e da administradora | a saudação, a caixa, os três exemplos da 24.1, e os blocos vazios | Continuar: "Nenhuma conversa ainda."; Projetos: a frase de hoje; Ligações: "Ligue um sistema em Integrações." | cada bloco em esqueleto de 96 px | a frase do código com Tentar de novo, por bloco | — | o membro: o Início dele, no visual novo | uma ligação que pede para conectar de novo: a palavra de `stateBadge` no bloco |
| A linha da caixa | Início: "+", pasta vazia, "N ferramentas", modelo, microfone, enviar | sem ferramenta: "Sem ferramentas" | as ferramentas: "Lendo as ferramentas…" | — (cada parte mostra o seu erro) | — | — (o membro não chega a ela) | sem conta de modelo: a frase da 11 no lugar do modelo |
| O menu "+" | as ferramentas que o lugar oferece, ligadas | "Nenhuma ferramenta ligada à empresa" (Início) ou a frase do Projeto da 24.1, com o caminho | "Lendo as ferramentas…"; um interruptor parado enquanto a troca anda | a troca recusada volta à escolha de antes, com a frase do código | busca sem resultado: "Nenhuma ferramenta com esse nome." | — | uma ferramenta que pede para conectar de novo, ou deixou de ser liberada, sai do menu (critério 3 da 24.1) |
| A pasta do Projeto (Início) | "Sem Projeto" escolhido | sem Projetos: só "Sem Projeto" | a lista em esqueleto | a frase do código | um Projeto apagado some da lista | — | — |
| O modelo na conversa do Assistente | o modelo da conversa | — | o botão ocupado enquanto a troca anda | a recusa (`MODEL_NO_ACCOUNT`, `MODEL_UNKNOWN`, `EFFORT_UNSUPPORTED`) embaixo, e o botão volta ao de antes | a conversa apagada: a página de não encontrado da casa | — | `HUB_UPDATING`: a frase da U0 da 24.1 |
| O Alerta (U7) | — | — | — | a frase, em vermelho de perigo, no tamanho `label` | — | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| a frente do `DESIGN.md` (cores, tipos, raios, espaços, larguras) | U0, U1, U2 | `tokens.test.ts` (U1); o Impeccable |
| `ProjectSummary.appVersion`, `ProjectSummary.publishedVersion` | U3 (servidor) | U3 (o bloco Projetos do Início) |
| `useComposerTools` (o "+", a pasta e a contagem de um lugar) | U4, U5 | as três telas do Assistente |
| `AssistantConversation.connections` (24.1) | a rota da 24.1 | U5 (o menu "+" e a contagem) |
| `setAssistantModel` (a troca) | U6 (servidor) | U6 (o botão do modelo) |
| o modelo da conversa no fio (`session.model.switch`) | a criação da 24.1; U6 | o turno seguinte; a leitura da sessão |

**O desenho de caixas.** Os blocos seguem as capturas da Pauta (claro, 1366 e 390: o Início, o "+"
aberto, a pasta, a conversa, a conversa de Projeto, 11 ferramentas com a busca, o Início da
administradora), que ficam fora do repositório (delivery L21) e vão com o firstmate à QA e à
revisão. Medidas do laboratório a 1366: trilho 56, lista 271 + 1 de linha, linha 32, caixa 720.

```text
1280 px, o Início da Ana                                       390 px, o Início
 ┌──┬────────────────┬─────────────────────────────────────┐   ┌──────────────────────────┐
 │◆ │ Padaria Sol ⌄  │          Boa tarde, Ana              │   │ ☰  ◆  Início             │
 │▌⌂│ [Nova conversa]│ ┌─────────────────────────────────┐ │   │  Boa tarde, Ana          │
 │ ▤│ Conversas      │ │ Pergunte ou peça um app          │ │   │ ┌──────────────────────┐ │
 │ ⚇│ Hoje           │ │ + ▭ ◎◎ 2 ferramentas  Sonnet 5.5 🎙 ↑│ │   │ │ ...                  │ │
 │  │▌Vendas semana 2h│ └─────────────────────────────────┘ │   │ │ + ▭ ◎2   Sonnet 🎙 ↑  │ │
 │  │ Ontem          │ Continuar                  Todos →   │   │ └──────────────────────┘ │
 │  │  Metas Matriz  │  Vendas da semana             2 h    │   │ Continuar                │
 │  │ Esta semana    │  Metas da Matriz · Vendas  ontem     │   │ Projetos                 │
 │ ⚙│  Encomendas    │ Projetos        │ Ligações           │   │ Ligações                 │
 │ A│                │  Vendas · v3    │  Matriz Funcionando │   └──────────────────────────┘
 └──┴────────────────┴─────────────────┴────────────────────┘
1280 px, a conversa de Projeto, com o "+" aberto
 ┌──┬────────────────┬───────────────────────────────────────┐
 │◆ │ Padaria Sol ⌄  │            Metas da Matriz             │
 │ ⌂│ ...            │  … a transcrição, no eixo de 720 …     │
 │▌▤│▌Metas Matriz   │  ┌ Anexar arquivo ─────────────────┐   │
 │  │                │  │ Ferramentas da conversa  1 de 1 │   │
 │  │                │  │ ◎ Sankhya · Matriz         [on] │   │
 │  │                │  │ Liberar outra ferramenta ao Projeto│ │
 │  │                │  └─────────────────────────────────┘   │
 │  │                │  [+ ▭Vendas ◎1 ferramenta  Sonnet ◔ 12% 🎙 ↑]│
 └──┴────────────────┴───────────────────────────────────────┘
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Trocar o modelo da conversa do Assistente (U6: a conferência da conversa, `conversationModel`, `effortsOf`, `session.model.switch` no fio) | duas trocas: a última gravada vale, e cada resposta diz o que ficou (23) | uma recusa antes do `switch`: nada muda (23); um corte depois do `switch`: o fio já tem o modelo novo, e repetir a troca grava o mesmo (24) | banco do Mastra fora: `DATABASE_UNAVAILABLE`, o botão volta ao de antes (23, 25) | `ASSISTANT_MODEL_SET` (empresa, conversa) (23) | 23, 24, 25 |
| Trocar as ferramentas pelo "+" (`PUT …/connections`, a rota da 24.1, sem mudança) | a da 24.1 | a da 24.1 | a da 24.1; o interruptor volta | `ASSISTANT_CONNECTIONS_CHANGED` (24.1) | 20 |
| Criar a conversa com o Projeto da pasta (a rota da 24.1, sem mudança) | a da 24.1 | a da 24.1 | a da 24.1 | `ASSISTANT_CONVERSATION_CREATED` (24.1) | 21 |

O resto da etapa só lê: os tokens, a moldura, os blocos e a lista não gravam nada.

## A tabela de referência

Referências: o G4 OS pelas telas 13, 14 e 15 do estudo da Pauta (2026-11-01); o Linear e o Claude
pelas páginas públicas, lidas no estudo; a AffectUI (`affectui.com/components/<peça>`) só pelo
padrão, nunca o código Pro; o Vercel ai-chatbot `c2f8235`, o assistant-ui `36ca755`, o LibreChat
`f4154b6`, o Open WebUI `f7ac7ee` e o ai-elements `ca8be60` por cópias rasas do estudo da linha da
caixa ("relay": a unidade reabre antes de usar); a Mastra na estante `mastra-1.78` `6a465f9d` (`M:`,
lido); o shadcn `base-nova` pela skill `shadcn`; o Conexus em `main` `fed480c3`.

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O DESIGN.md | U0 | `DESIGN.md` é atalho para `docs/guides/design.md` (`docs/reference/impeccable.md:10-11`); as peças em `docs/reference/components.md` | o formato DESIGN.md (`github.com/google-labs-code/design.md`): um arquivo na raiz com a frente de tokens, as peças e a prosa; o Impeccable lê o `DESIGN.md` da raiz | um documento com valores e peças, lido por pessoas e ferramentas | nativo | — | "definir o design.md completo, igual o Cloud Design faz"; B | `DESIGN.md` |
| Uma fonte para os tokens | U1 | as cores à mão em três lugares: a frente do guia, o claro de `tokens.css:44-140` e o escuro duas vezes, `:251-284` e `:286-317` (auditoria A1) | CSS `light-dark()` com `color-scheme` (MDN); a Mastra separa os tokens do desenho (`M:packages/playground-ui/src/ds/tokens/`, relay da auditoria) | um valor por token, claro e escuro juntos | nativo: `light-dark()`, o tema pelo `color-scheme` do `data-theme`; um teste lê a frente do `DESIGN.md` e `tokens.css` | critério 1 | — | `apps/web/src/brand/tokens.test.ts` |
| Uma fonte, 7 tamanhos | U1 | Bricolage no título (`tokens.css:78`) e Hanken no texto; alturas de linha fora da grade de 4 (15 × 1,55) | Linear: uma família, 13 px, peso 510; G4: uma família | uma família para título e texto | nativo | critério 3 | "Aprovo" à Pauta | — |
| As medidas de controle | U2 | `h-[34px]` em `ui/select.tsx:87`, `ui/sidebar.tsx:261,299`, `ui/dropdown-menu.tsx:59`; `h-8`/`h-7` em `ui/button.tsx:27-28`; `md:w-[390px]` em `builder/preview/preview.tsx:131,176,214` | Mastra `M:packages/playground-ui/src/ds/primitives/control-size.ts` (relay da auditoria) | o tamanho do controle é um token | nativo | critério 4 | V32, "Aprovado" (2026-10-27) | — |
| A linha de 32 px | U2, U3 | 34 a 40 px, variável | Linear: linhas de 30 px; G4, tela 13: 32 | uma altura para toda lista | nativo: `--spacing-row` 32, 44 no toque | critérios 4, 5 | "Aprovo" à Pauta | — |
| O trilho de ícones | U3 | uma barra de 256 px, sem trilho (`ui/sidebar.tsx`) | G4, tela 13: trilho de 60 e lista de 300, o traço dourado na linha atual; o `Sidebar` do shadcn com `collapsible="icon"` | ícones dos lugares num trilho, a lista do lugar ao lado | embrulhado: um `SidebarRailButton` no `Sidebar` de `ui/`, 56 + 272 | critério 5 | "Ficou boa a versão do layout" | — |
| As conversas por dia | U3 | as recentes no Início (`builder/assistant/home.tsx`), sem grupo | G4, tela 13: as sessões na lista ao lado | a lista do lugar à esquerda, mais nova no alto | embrulhado: `listAssistantConversations` agrupada por `platform/dates.ts` | critério 6 | "Ficou boa a versão do layout" | `apps/web/src/builder/assistant/sidebar-conversations.tsx` |
| O eixo de 720/880 | U3 | a coluna da caixa com 736 px (`START_COLUMN`) | G4, tela 13: caixa e Recentes com 880, o cartão de 560 (0,64 de 880) | um eixo e uma largura; o bloco secundário é fração dela | nativo: `--container-axis` 45rem, `--container-axis-wide` 55rem a partir de 1600 px, metades de 352 | critério 7 | "Aprovo" à Pauta | — |
| Os blocos do Início e o estado em palavras | U3 | `ProjectCards` e as recentes (`hub/projects/home.tsx`, `builder/assistant/home.tsx`) | G4, tela 13: Recentes na mesma coluna; AffectUI `integration-picker`: "3 de 10 ligadas"; regra V35 | linhas na pauta, o estado escrito | embrulhado: um `Block` de linhas, o `Stamp` com a gramática de `ui/badge.tsx` | critério 8 | "Ficou boa a versão do layout" | `apps/web/src/builder/assistant/day.tsx` |
| As versões na lista de Projetos | U3 | `ProjectSummary` sem versão (`packages/hub-api/src/projects.ts:20-24`); `Project` com `appVersion` e `publishedVersion` (`:31-38`) | o próprio `getProject` do Hub | o mesmo campo, lido uma vez | nativo: os dois campos sobem para `ProjectSummary` | critério 9 | — | — |
| A linha da caixa | U4 | `Composer` com `picker` e `memory` à esquerda (`builder/conversation/composer.tsx:183-208,280-281`) e a barra embaixo (`builder/assistant/context-bar.tsx`) | G4, telas 13 e 15: anexo e pasta à esquerda, modelo junto do enviar; Open WebUI `MessageInput.svelte:2415-2771` (esquerda) e `:2790-2949` (direita); LibreChat `Chat/Input/Composer/Bar.tsx:397-439,487-526`; Vercel `components/chat/multimodal-input.tsx:546-576`; assistant-ui `thread.aui.tsx:226-309`; Mastra `M:packages/playground/src/lib/ai-ui/thread.tsx:284-310` (lido) | a mesma caixa no Início e na conversa; o enviar sempre o último, o microfone antes dele | embrulhado: os encaixes `plus` e `context` à esquerda, `picker` e `memory` à direita, no `InputGroup` de `ui/`, preenchidos por `useComposerTools` | critério 13 | a ordem da linha, 2026-11-01 | `apps/web/src/builder/assistant/composer-tools.tsx` |
| A memória só onde há conversa | U4 | o anel com a porcentagem (`builder/conversation/memory-status.tsx`) | Claude e ChatGPT mostram o uso do contexto só dentro da conversa (relay, não verificado nesta rodada) | sem conversa, nada a medir | nativo: o encaixe vazio no Início | critério 14 | "Aprovo" à Pauta revisada | — |
| A pasta sem Projeto | U4 | `FixedProject` na conversa de Projeto (`context-bar.tsx:154`) | G4, telas 13 e 15: a pasta na caixa | a pasta sempre no mesmo lugar | embrulhado: `NoProjectChip` apagado, `FixedProjectChip` com o nome | critério 15 | "Aprovo" à Pauta revisada | — |
| A linha no celular | U4 | o modelo e o anel encolhem sem ordem | Open WebUI `MessageInput.svelte:2791`; Vercel `multimodal-input.tsx:815`: só limitam a largura do modelo; nenhuma esconde controle | as palavras saem, os controles ficam | nativo: `max-[26rem]` e `max-[20rem]` do Tailwind | critério 16 | "Aprovo" à Pauta revisada | — |
| O menu "+" com interruptores | U5 | **Ajustar** abre um `Popover` com uma chave por ligação (`context-bar.tsx:59-94` em `fed480c3`) | Claude: os conectores no "+" (página pública); LibreChat: ferramentas dentro do "+" (`Bar.tsx:397-439`); AffectUI `integration-picker`, só o padrão | um menu no "+", uma chave por ferramenta | embrulhado: `Popover`, `Drawer` e `Switch` de `ui/` | critério 18 | "Aprovo" à Pauta | — |
| A busca a partir de 7 | U5 | nenhuma | AffectUI `integration-picker` (busca na lista); a lista do menu tem até 256 px, 8 linhas de 32 | busca quando a lista passa da altura | nativo: um `InputGroup` local ao menu | critério 19 | "Aprovo" à Pauta revisada, que diz 7, testada com 11 | — |
| "N ferramentas" | U4, U5 | uma etiqueta por ligação (`context-bar.tsx:94-143` em `fed480c3`) | G4, tela 13: a linha de ferramentas na caixa; AffectUI `chat-composer` (a pilha de logos) | o que está ligado, numa peça | embrulhado: um botão com até 3 logos sobre `logo-plate` | critério 22 | "Aprovo" à Pauta | — |
| O modelo na conversa do Assistente | U6 | o Builder troca: `setConversationModel` (`packages/hub-api/src/conversations.ts:132-142`), `switchModel` (`apps/server/src/builder/conversation/routes.ts:33-44,121-134`), `ModelChoice` (`apps/web/src/builder/conversation/model-choice.tsx:57-100`); o Assistente só escolhe ao nascer (`apps/server/src/builder/assistant/routes.ts:160-187`) | `AgentController`, `session.model.switch` (os dois controladores já o usam); Mastra Studio: o seletor de modelo na caixa (`M:packages/playground/src/lib/ai-ui/thread.tsx:302-307`, `hideModelSwitcher`) | o modelo troca no fio, para as próximas respostas | nativo: `session.model.switch` do controlador `assistant` | critérios 23, 24 | "A" | — |
| O Alerta | U7 | 30 `role="alert"` à mão em 4 estilos (auditoria A2) | shadcn `alert` do `base-nova`; cal.com `packages/ui/components/alert/Alert.tsx:9`; Documenso `packages/ui/primitives/alert.tsx:7`; Mastra `ds/components/Notice/notice-root.tsx:8` (relay da auditoria) | uma peça para o aviso e o erro | nativo: `alert` do shadcn em `ui/` | critério 26 | — | `apps/web/src/ui/alert.tsx` |
| O seletor da barra lateral | U8 | `hub/identity/company-switcher.tsx:30-83`, `hub/operations/central-header.tsx:18-72`, `hub/projects/project-rail.tsx:60-80`, quase iguais (auditoria A5) | shadcn, o bloco `sidebar-07` (o seletor de times no topo da barra) | uma peça de seletor no cabeçalho da barra | embrulhado: um `SidebarSelector` em `ui/`, o conteúdo de cada um por quem chama | critério 27 | — | — |
| O Card e a Textarea | U9 | `ui/card.tsx` usado por 1 arquivo; cartões à mão em `plan-card.tsx:119`, `project-cards.tsx:24`, `preparation-card.tsx:54`, `model-fallback.tsx:138`; a resposta livre à mão em `question-card.tsx:137,149` (auditoria A7) | shadcn `card` e `textarea` | as peças da biblioteca | nativo | critério 28 | — | — |
| O aviso flutuante (toast) | fica de fora | nenhum | Base UI Toast (`@base-ui/react` instalado) | — | nativo | — | — | — |

**A medida do transplante.** Nada vem do código antigo. O laboratório da Pauta (ramos `b2` e
`composer-row`, locais, nunca enviados) é só referência de forma: cada unidade escreve o seu código
de novo, com os testes pela porta pública.

**A dívida.** Os avisos de complexidade que o laboratório deixou em `PlusMenu` e `ProjectControl`
não entram: a U4 e a U5 dividem a peça em funções curtas desde o começo.

## U0 O DESIGN.md e o guia

**Base e modelo.** `main` na janela entre a etapa de antes e este cartão (L20). Sonnet: texto.
Só documentos; leva a palavra do fundador da decisão B.

### As linhas da tabela

- **O DESIGN.md.** A fonte é o `DESIGN.md` do estudo da Pauta (fora do repositório, L21), já
  corrigido para a linha da caixa; o firstmate o entrega a quem constrói.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `DESIGN.md` | Troca o atalho por um arquivo | o Impeccable; `tokens.test.ts` (U1) |
| `docs/guides/design.md` | Muda: sai a frente; as regras emendadas | os builders e revisores |
| `docs/guides/web.md` | Muda: W30 | os builders e revisores |
| `docs/reference/components.md` | Apaga (entra no `DESIGN.md`) | `docs/index.md`, `design.md` V23 |
| `docs/reference/impeccable.md`, `docs/index.md`, `PRODUCT.md` | Muda: o `DESIGN.md` é arquivo; "Pauta" no lugar de "Grafite e Ipê" | — |

### Os contratos que a unidade cria

- **`DESIGN.md`**, em inglês (L23), no formato DESIGN.md: a frente com `colors`, `typography`,
  `rounded`, `spacing`, `containers`, `shadows` e `components`; depois Overview, Colors, Typography,
  Layout, Elevation & Depth, Shapes, Components. Os nomes dos tokens são os do código
  (`canvas`, `surface`, `surface-3`, `surface-4`, `line`, `text`, `text-2`, `accent`, `accent-text`
  …); os papéis da Pauta (chrome, sheet, raised, selected, hairline, ipê) ficam na prosa, numa
  tabela papel → token. Entram os tokens que o estudo deixou de fora: `code-*`, `preview-paper`,
  `phone-frame`, `on-accent`. As peças de `components.md` e as da Pauta viram uma lista só.
- **Saem do texto do estudo:** as "Named Rules" e os "Do's and Don'ts" (cada um é uma regra V do
  guia, abaixo; o `DESIGN.md` cita o identificador), a seção da AffectUI (estudo, L21), a seção
  "Changes in apps/web" (laboratório) e as divergências com o `system.md`.
- **O guia de desenho:** sem frente; a abertura aponta o `DESIGN.md` como dono dos valores e das
  peças. Emendas, com "Founder, 2026-11-01: \"Aprovo\"":
  - Overview: "Pauta" no lugar de "Grafite e Ipê"; sai a frase "This method change does not
    redesign the product".
  - **V5**: o ipê marca só o lugar atual (o traço do trilho e da lista, a aba ativa), o foco, o
    cursor e a marca; sai "The send hover keeps its current accent".
  - **V13**: os mínimos passam a 12 px no texto e na legenda; o título de 28/36 a 24/32 abaixo de
    640 px.
  - **V19**: a moldura (chrome) e a folha branca, separadas por linha; sombra só no que flutua: o
    menu, o popover e a caixa.
  - **V22**: `control` 8, `object` 12, `card` 12, `composer` 16, `pill`, e `phone` 36.
  - **V23**: "Hanken Grotesk for display and prose" no lugar de "Bricolage headings, Hanken prose".
  - **V34**: 20 px no trilho, 16 ao lado de um rótulo, 14 nas barras de ferramenta.
  - **V56**: a gaveta do celular leva o trilho e a lista juntos.
  - As três regras novas levam os próximos identificadores V livres do guia.
  - **Nova, a pauta**: toda linha de lista tem 32 px num ponteiro e 44 no toque; listas lado a lado
    dividem a altura. [`home.layout.test.ts`, review]
  - **Nova, o eixo**: no Início e na conversa, todo bloco tem o centro e a largura da caixa (720, 880 a
    partir de 1600 px); um bloco secundário é metade menos o vão. [`home.layout.test.ts`, review]
  - **Nova, a linha da caixa**: a linha da caixa é uma peça com uma ordem em toda tela: à esquerda o que a
    mensagem leva ("+", pasta, ferramentas), à direita quem responde e como (modelo, memória,
    microfone, enviar); um lugar fica vazio só quando não há fato a mostrar; abaixo de 416 px saem
    palavras, nunca controles. Founder, 2026-11-01, a ordem da linha. [`assistant.layout.test.ts`,
    review]
- **W30**: a moldura é o trilho de ícones (Início, Projetos, Integrações, Configurações, a conta) e a
  lista do lugar ao lado; na empresa, Nova conversa e Conversas por dia (o membro: os Projetos
  recentes); dentro de um Projeto o trilho fica, e a lista é a do Projeto (o nome com o seletor,
  Construir, Conversas, Sobre, Quem usa o app, Integrações). Founder, 2026-11-01: "Ficou boa a versão
  do layout".
- **`impeccable.md`**: "`DESIGN.md` at the root holds the values and the pieces; the design guide
  holds the rules"; `document` e `extract` continuam proibidos (escrevem o `DESIGN.md`).
- **`docs/index.md`**: a linha de `components.md` sai, uma linha `DESIGN.md` entra; o teto de 500
  palavras vale.

### As skills e a leitura

`impeccable` só para conferir o formato; [delivery](../guides/delivery.md) L20, L23, L24.

### A ordem do trabalho

1. `DESIGN.md`: trocar o atalho pelo arquivo, a partir do texto do estudo, com os cortes acima.
2. `docs/guides/design.md`: tirar a frente; as emendas; conferir o teto de 2.500 palavras.
3. `web.md` W30; `components.md` apagado; `impeccable.md`, `index.md`, `PRODUCT.md`.
4. `npm run docs`.

### Como se prova

`npm run docs` e `npm run method-freeze` na janela (nenhum cartão de fronteira em `docs/steps/`);
um leitor só (L9).

### Parar se

- A janela não existir quando a U1 estiver pronta: mostrar ao firstmate; a U1 espera.
- O guia passar de 2.500 palavras: cortar a prosa do `DESIGN.md`, nunca uma regra.

## U1 Os tokens com uma fonte

**Base e modelo.** `main` depois da U0. Sonnet.

### As linhas da tabela

- **Uma fonte para os tokens; uma fonte, 7 tamanhos.** `apps/web/src/brand/tokens.css` inteiro
  (o `@custom-variant dark`, `:1-12`; as fontes, `:14-42`; o `@theme`, `:44-140`; o escuro,
  `:251-317`); `DESIGN.md` da U0; a auditoria, achado A1.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/brand/` | Muda `tokens.css`; apaga `fonts/BricolageGrotesque-latin.woff2`; cria `tokens.test.ts` | todo o `apps/web` |
| `apps/web/package.json`, `package-lock.json` | Muda: `yaml` em `devDependencies` | — |
| `apps/web/src/platform/theme.test.tsx`; `apps/web/tokens.layout.test.ts` | Muda o primeiro (o tema pelo `color-scheme`); cria o segundo (critério 2) | — |

### Os contratos que a unidade cria

- Cada token de cor: `--color-<nome>: light-dark(<claro>, <escuro>)`; `:root { color-scheme: light
  dark }`, `:root[data-theme="light"] { color-scheme: light }`, `:root[data-theme="dark"] {
  color-scheme: dark }`. O `@custom-variant dark` continua, para as classes `dark:` que existem.
- Os valores da Pauta, como o `DESIGN.md` da U0: as cores claras e escuras, `--font-display` =
  Hanken, a escala de 7 tamanhos com `--text-heading` e `--text-reading`, raios 8/12/12/16,
  `spacing` 4 a 64 com `2xl` 32, `3xl` 48, `4xl` 64, `row` 32; larguras `sidebar` 20,5rem,
  `sidebar-icon` 3,5rem, `list` 17rem, `axis` 45rem, `axis-wide` 55rem, `half` 22rem; sombras
  `float` e `composer`.
- `tokens.test.ts`: lê a frente do `DESIGN.md` com `yaml` e os tokens de `tokens.css` com um leitor
  de CSS do próprio teste; compara nome a nome, nos dois sentidos. O `yaml` está só no
  `package.json` da raiz: a U1 o declara em `devDependencies` de `apps/web`, na mesma versão, com o
  `package-lock.json` (knip). É um teste do Vitest ao lado do dono, não uma conferência nova da
  regra L20.

### As skills e a leitura

`shadcn` (o tema), `tailwindcss.com/docs/theme`; [web](../guides/web.md) e o `DESIGN.md`.

### A ordem do trabalho

1. `tokens.test.ts`, que falha hoje contra o `DESIGN.md` da U0.
2. `tokens.css`: o escuro uma vez por `light-dark()`; os valores da Pauta; a Bricolage sai.
3. O caso do tema no navegador (critério 2).

### Como se prova

Critérios 1 a 3: `npm test -w @conexus/web -- tokens`, os testes de layout do tema e da fonte;
mudar uma cor num lado só e ver o teste falhar.

### Parar se

- `light-dark()` dentro de `color-mix()` (as classes com `/50` do Tailwind) não pintar a cor no
  Chromium da conferência: mostrar e parar; a saída é o escuro num bloco só pelo `@custom-variant`,
  sem `light-dark()`.

## U2 Os tokens de medida

**Base e modelo.** `main` depois da U1. Sonnet.

### As linhas da tabela

- **As medidas de controle; a linha de 32 px.** `ui/button.tsx:27-28`, `ui/select.tsx:87`,
  `ui/sidebar.tsx:211,257,261,299`, `ui/dropdown-menu.tsx:59`, `hub/projects/recent-projects.tsx:61`,
  `builder/preview/preview.tsx:131,176,214`; a auditoria, achado A6.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/brand/tokens.css`, `DESIGN.md` | Muda: `--spacing-control` 32, `--spacing-control-sm` 28, `--spacing-row` 32, `--container-phone` 390 | as peças |
| `apps/web/src/ui/` | Muda `button.tsx`, `select.tsx`, `dropdown-menu.tsx`, `sidebar.tsx` | as telas |
| `apps/web/src/hub/projects/recent-projects.tsx`, `apps/web/src/builder/preview/preview.tsx` | Muda: o token no lugar do número | — |

### Os contratos que a unidade cria

Os quatro tokens acima, no `DESIGN.md` e em `tokens.css` juntos (o teste da U1). O item de menu e a
linha da barra lateral passam de 34 a 32 (`h-row`).

### As skills e a leitura

`shadcn`; [design](../guides/design.md) V32.

### A ordem do trabalho

1. Os tokens nos dois arquivos.
2. As peças e as duas telas.

### Como se prova

Critério 4: `pieces.layout.test.ts`.

### Parar se

- Um teste de layout de hoje medir 34 num item: mudar o teste para 32 só onde a Pauta diz 32.

## U3 A moldura da Pauta

**Base e modelo.** `main` depois da U2. Sonnet: telas sobre peças prontas, um campo de contrato.

### As linhas da tabela

- **O trilho.** `apps/web/src/ui/sidebar.tsx`, `ui/frame.tsx`,
  `routes/_app/companies/$companyId/route.tsx`, `hub/identity/account-menu.tsx`; G4, tela 13.
- **As conversas por dia.** `builder/assistant/home.tsx` (as recentes), `queries.ts`
  (`assistantConversationsQuery`), `platform/dates.ts:24` (`dayOf`).
- **O eixo; os blocos.** `hub/projects/home.tsx`, `routes/_app/companies/$companyId/index.tsx`,
  `hub/projects/project-cards.tsx`, `hub/connectors/` (`connectionsQuery` pela `public.ts`).
- **As versões na lista.** `packages/hub-api/src/projects.ts:20-38`, a rota de `listProjects` em
  `apps/server/src/hub/projects/`.
- **O trilho no Projeto.** `hub/projects/project-rail.tsx`,
  `routes/_app/companies/$companyId/projects/$projectId.tsx`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/ui/sidebar.tsx`, `ui/frame.tsx` | Muda: a coluna do trilho, `SidebarRailButton`, linhas de 32 com o traço; `frame` recebe `rail`; a barra do topo do celular com 52 | todas as rotas da empresa e do Projeto |
| `apps/web/src/routes/_app/companies/$companyId/` | Muda `route.tsx` (os lugares no trilho; a lista) e `index.tsx` (a saudação; os blocos) | o roteador |
| `apps/web/src/builder/assistant/` | Cria `sidebar-conversations.tsx`, `day.tsx`; muda `home.tsx` (as recentes saem), `public.ts` | as rotas |
| `apps/web/src/hub/projects/` | Muda `home.tsx` (o eixo, o encaixe `below`), `project-rail.tsx` (a lista do Projeto ao lado do trilho) | `index.tsx`, a moldura do Projeto |
| `apps/web/src/hub/identity/account-menu.tsx` | Muda: o avatar compacto no pé do trilho | `route.tsx` |
| `packages/hub-api/src/projects.ts`, `apps/server/src/hub/projects/` | Muda: `ProjectSummary` com as duas versões; a lista as lê | a tela, `getProject` |
| `apps/server/src/hub/apps/` (`versionNumbersOf`), `apps/server/src/hub/projects/ports.ts`, `apps/server/src/main.ts` | Muda: uma porta em lote, `appVersionsOfMany(tx, ids)`, uma consulta para a página de até 50 Projetos, sem uma por Projeto (`appVersionsOf` hoje é por Projeto, `projects.ts:22,157,296`) | `listProjects` |

### Os contratos que a unidade cria

- `ProjectSummary = z.object({ id, name, createdAt, appVersion: z.int().positive().nullable(),
  publishedVersion: z.int().positive().nullable() })`; `Project` estende o novo `ProjectSummary` e
  perde a cópia dos dois campos (C26: um dono).
- `SidebarRailButton(props: { to; label: string; icon: LucideIcon; current: boolean })` em
  `ui/sidebar.tsx`; o traço e `aria-current` vêm de `current`.
- `SidebarConversations(props: { companyId })` e `NewConversation(props: { companyId })`; o grupo
  é `type DayGroup = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'BEFORE'`, calculado por uma função de
  `platform/dates.ts` no fuso do navegador, como as outras datas da tela (`dates.ts:1`).
- `AssistantDay(props: { companyId })` com `Block` e `Stamp`; o estado do Projeto é uma união
  (C21): `{ kind: 'PUBLISHED'; version } | { kind: 'BUILDING'; version } | { kind: 'NO_APP' }`.
- O modelo de arquivo: `builder/assistant/home.tsx` cumpre C21 e C26 (as frases em `text.ts`) e
  C23 (os ids são as marcas `CompanyId` e `ProjectId` de `@conexus/hub-api`). As palavras das
  ligações são de `stateBadge` (`hub/connectors/text.ts:34-44`), pela `public.ts` (C26).

### As skills e a leitura

`shadcn` (sidebar), `router-core`, `impeccable` (`layout`, `adapt`); [web](../guides/web.md) W29,
W30 (emendada na U0), W34; [design](../guides/design.md) V18, V56 e as regras novas da pauta e do eixo (U0).

### A ordem do trabalho

1. `projects.ts` e a rota; o teste do critério 9.
2. `ui/sidebar.tsx` e `ui/frame.tsx`: o trilho; `route.tsx` com os lugares.
3. `sidebar-conversations.tsx` e a função dos dias.
4. `day.tsx`, `hub/projects/home.tsx`, `index.tsx`: o eixo e os blocos.
5. `project-rail.tsx`: a lista do Projeto ao lado do trilho.
6. Os testes de layout; `impeccable detect` nos arquivos mudados.

### Como se prova

Critérios 5 a 12: `sidebar-conversations.test.tsx`, `day.test.tsx`, `projects.test.ts` dos Projetos,
`home.layout.test.ts`, `phone.layout.test.ts`, `workbench.layout.test.ts`, `focus.layout.test.ts`.

### Parar se

- As telas da 24.2 já estiverem no `main` (decisão A1): o sino e Automações entram no trilho como
  lugares; se pedirem um lugar que a W30 emendada não diz, mostrar e parar.
- O membro precisar de um lugar no trilho que hoje não vê: mostrar e parar.

## U4 A linha da caixa

**Base e modelo.** `main` depois da U3. Sonnet.

### As linhas da tabela

- **A linha da caixa.** `builder/conversation/composer.tsx:101-120,183-208,270-290`; `start.tsx`,
  `chat.tsx`; `builder/assistant/home.tsx`, `conversation.tsx`, `context-bar.tsx` (o que sai);
  Mastra `M:packages/playground/src/lib/ai-ui/thread.tsx:284-310`; as do Open WebUI, LibreChat,
  Vercel e assistant-ui da tabela, reabertas.
- **A memória; a pasta; o celular.** `builder/conversation/memory-status.tsx`,
  `builder/model-accounts/model-picker.tsx`, `context-bar.tsx:154-188` (`FixedProject`,
  `useDraftChoice`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/conversation/` | Muda `composer.tsx` (os grupos), `memory-status.tsx` (a palavra sai abaixo de 416), `start.tsx`, `chat.tsx`, `public.ts` (exporta `ComposerModelPicker`) | o Builder, o Assistente |
| `apps/web/src/builder/assistant/` | Cria `composer-tools.tsx` (`useComposerTools`, `ToolsCount`, `ProjectControl` com a lista simples, `FixedProjectChip`, `NoProjectChip`); muda `home.tsx`, `conversation.tsx`, `project.tsx`; apaga de `context-bar.tsx` o `ContextBar`, o `DraftBar`, o `Bar`, o `FixedProject` e os testes deles; o `Adjust` vira o conteúdo do popover de `ToolsCount`; ficam `useDraftChoice`, `CutBadge` e o tipo `DraftChoice` | as rotas |
| `apps/web/src/builder/model-accounts/model-picker.tsx` | Muda: o rótulo curto abaixo de 768 | o `Composer` |

### Os contratos que a unidade cria

- `Composer(props: { …; plus: ReactNode; context?: ReactNode; picker: ReactNode; memory?:
  ReactNode })`: à esquerda `plus` e `context`, que não encolhem; à direita `picker`, `memory`,
  microfone e enviar; o modelo trunca no espaço livre.
- `useComposerTools(place: ComposerPlace): { plus: ReactNode; context: ReactNode }`, com
  `type ComposerPlace = { kind: 'HOME'; draft: DraftChoice } | { kind: 'CONVERSATION';
  conversation: AssistantConversation }` (C21), com `export type DraftChoice =
  ReturnType<typeof useDraftChoice>` em `context-bar.tsx`.
- Entre a U4 e a U5 a escolha continua: tocar em "N ferramentas" abre a lista de interruptores de
  hoje (o `Adjust`), e a pasta do Início abre "Sem Projeto" e os Projetos, sem busca; a U5 leva a
  lista para o "+" e acrescenta a busca, a folha e os caminhos.
- Até a U6, na conversa do Assistente, `ComposerModelPicker` aparece desabilitado com o modelo de
  `sessionReadQuery(id, ASSISTANT_CONTROLLER)`.
- O modelo de arquivo: `builder/assistant/home.tsx` (C21, C23, C26, como na U3). É a única fonte do "+", da pasta e da contagem; a
  pasta é a única parte que varia (menu no Início, fixa ou apagada na conversa).

### As skills e a leitura

`shadcn` (input-group), `impeccable` (`adapt`); [design](../guides/design.md) V18, V30 e a regra nova da linha da caixa (U0).

### A ordem do trabalho

1. `composer.tsx`: os dois grupos; o Builder passa o mesmo.
2. `composer-tools.tsx` com a contagem (abre o `Adjust`) e as pastas; o "+" ainda o anexo de hoje
   (o menu é a U5).
3. `home.tsx`, `conversation.tsx`, `project.tsx` pelo `useComposerTools`; apagar a barra e os
   testes dela antes de escrever os novos.
4. `memory-status.tsx`, `model-picker.tsx`; os testes de layout.

### Como se prova

Critérios 13 a 17: `assistant.layout.test.ts`, `phone.layout.test.ts`, `home.test.tsx`,
`conversation.test.tsx`, `composer.test.tsx`.

### Parar se

- Alguém pedir uma troca de modelo só na tela antes da U6: nunca; o botão fica desabilitado.
- `memory-status.test.tsx` achar "Memória" duas vezes (o laboratório viu): o teste lê o nome
  acessível, não o texto.

## U5 O menu "+"

**Base e modelo.** `main` depois da U4. Sonnet.

### As linhas da tabela

- **O menu "+"; a busca; "N ferramentas".** `builder/assistant/context-bar.tsx` em `fed480c3`
  (`Adjust`, `:59-94`; a troca ao vivo), que a U4 move para `composer-tools.tsx`; `queries.ts` (`setAssistantConnections`,
  `listAssistantConnections`); `ui/popover.tsx`, `ui/drawer.tsx`, `ui/switch.tsx`,
  `ui/input-group.tsx`; `hub/connectors/` (o logo e o catálogo pela `public.ts`); AffectUI
  `integration-picker`, só o padrão.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/assistant/` | Muda `composer-tools.tsx` (`PlusMenu`, `ProjectControl` aberto, `useLiveChoice`), `context-bar.tsx` (sobra só o que o menu usa), `text.ts` | `useComposerTools` |

### Os contratos que a unidade cria

- `PlusMenu(props: { place: ComposerPlace })`: `Popover` a partir de 768 px, `Drawer` abaixo; a
  busca só com 7 ou mais linhas (`SEARCH_FROM = 7`, constante com a palavra do fundador no
  comentário); a lista com no máximo 256 px.
- `useLiveChoice(conversation)`: a troca de uma ferramenta por `PUT …/connections`, pelo
  `queries.ts` (W10) e pelo `MutationCache` (W12); a resposta do Hub é o que o interruptor mostra.
- O modelo de arquivo: `builder/assistant/home.tsx` (C21, C23, C26); `SEARCH_FROM` tem um dono só.
- As frases em `text.ts`: "Anexar e ferramentas", "Ferramentas da conversa", "N de M ligadas",
  "Conectar outra ferramenta", "Liberar outra ferramenta ao Projeto", "Nenhuma ferramenta com esse
  nome.", "Nenhuma ferramenta ligada à empresa", "Sem ferramentas", "Conversa sem Projeto".

### As skills e a leitura

`shadcn` (popover, drawer, switch), `impeccable` (`harden`, `clarify`); [web](../guides/web.md)
W10, W12, W23; [design](../guides/design.md) V30, V31.

### A ordem do trabalho

1. `PlusMenu` com a lista e os interruptores; `useLiveChoice`.
2. A busca; a folha do celular.
3. `ProjectControl` aberto no Início, com a busca a partir de 7.
4. Os testes pela porta (o dublê `test-hub.tsx` com 11 e com 6 ligações).

### Como se prova

Critérios 18 a 22: `composer-tools.test.tsx`, `conversation.test.tsx`, `home.test.tsx`.

### Parar se

- O menu precisar de uma ferramenta que o Hub não lista (por exemplo, uma ainda não testada):
  mostrar e parar; o menu só mostra o que `listAssistantConnections` dá.

## U6 O modelo dentro da conversa do Assistente

**Base e modelo.** O servidor, sobre `main` a qualquer momento; a tela, depois da U5. Sonnet.

### As linhas da tabela

- **O modelo na conversa do Assistente.** O Builder: `packages/hub-api/src/conversations.ts:132-142`,
  `apps/server/src/builder/conversation/routes.ts:33-44,121-134`,
  `apps/web/src/builder/conversation/model-choice.tsx:57-100`; o Assistente:
  `apps/server/src/builder/assistant/routes.ts:160-187` (a criação), `:299-312`
  (`setAssistantConnections`, o modelo da conferência), `packages/hub-api/src/assistant.ts:183-207`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/assistant.ts` | Cria `setAssistantModel` | o servidor, a tela |
| `apps/server/src/builder/assistant/routes.ts` | Muda: a rota | — |
| `apps/web/src/builder/assistant/` | Muda `queries.ts` (`sendAssistantModel`), `conversation.tsx` (o botão do modelo troca) | — |
| `apps/web/src/builder/conversation/model-choice.tsx` | Muda: `ModelChoice` recebe a mutação de quem chama, para os dois controladores | o Builder, o Assistente |

### Os contratos que a unidade cria

```ts
export const setAssistantModel = defineOperation({
  id: 'setAssistantModel',
  summary: 'Changes the model of an Assistant conversation and its effort, for its next answers.',
  access: 'session',
  method: 'PUT',
  path: `${BASE}/{conversationId}/model`,
  bodyLimit: 1024,
  input: { params: OfConversation, body: z.object({ model: ModelId, effort: Effort }) },
  success: { status: 200, body: z.object({ model: ModelId, effort: Effort }) },
  failures: [...READ_FAILURES, 'CONVERSATION_NOT_FOUND', 'MODEL_UNKNOWN', 'MODEL_NO_ACCOUNT',
    'EFFORT_UNSUPPORTED'],
})
```

A rota: `admitted` (o `askAssistant` da 24.1), `ownThread`, `conversationModel(deps.queue, owner,
body.model)`, `effortsOf`, depois `createSession({ id, resourceId: assistantOwner(owner), threadId:
id, tags })`, com as mesmas marcas `SESSION_MARK` da criação (`assistant/routes.ts:172-178`,
`context.ts:8,19`), e `session.model.switch(model, { thinkingLevel: effort })`; o log
`ASSISTANT_MODEL_SET`. É uma função local de `assistant/routes.ts`, escrita como o `switchModel`
privado do Builder (`conversation/routes.ts:33-44`), que não é exportado. O `@mastra/core` instalado
(1.79.0) aceita `resumeOnly` no `createSession` (`agent-controller-DO6rGsQm.js:7311`); a unidade
escolhe entre os dois lendo esse código, e uma sessão nunca nasce sem marcas. A criação (critério 8
da 24.1) não muda.

O modelo de arquivo: `apps/server/src/builder/assistant/routes.ts` (C21 nos `Failure`, C23 com
`ConversationId`, C26 com `READ_FAILURES` de `hub-api`).

### As skills e a leitura

`mastra` (o `AgentController` instalado, `session.model.switch`), `fastify-best-practices`;
[testing](../guides/testing.md) T5; [design](../guides/design.md) V54.

### A ordem do trabalho

1. `setAssistantModel` e o teste da rota (critério 23), que falha hoje.
2. A rota.
3. Antes do critério 24, a prova: ler no `@mastra/core` 1.79.0 instalado o `switch`
   (`agent-controller-DO6rGsQm.js:3436-3460`, onde o `switch` aplica o modelo e o esforço à sessão) e escrever o
   teste com o modelo dublê: uma troca durante um turno não muda o turno.
4. `ModelChoice` com a mutação de quem chama; `conversation.tsx` (critério 25).

### Como se prova

Critérios 23 a 25: `routes.test.ts`, `assistant.test.ts`, `conversation.test.tsx`.

### Parar se

- O `switch` durante um turno mudar o modelo do turno em andamento no Mastra instalado: mostrar e
  parar; a V54 diz que não pode.

## U7 O Alerta

**Base e modelo.** `main` depois da U5. Sonnet.

### As linhas da tabela

- **O Alerta.** Os 30 `role="alert"` da auditoria (A2), entre eles `hub/identity/invitation.tsx:173`,
  `hub/identity/people.tsx:143`, `hub/projects/access.tsx:95`, `builder/conversation/composer.tsx`,
  `builder/source/source.tsx:64`, `builder/conversation/conversation-switch.tsx:145,226`;
  `ui/form.tsx:98-107` (`FormAlert`), `ui/states.tsx:74-83` (`ReadFailure`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/ui/` | Cria `alert.tsx` (do `base-nova`); muda `form.tsx`, `states.tsx` | as telas |
| as 27 telas da auditoria | Muda: o `<p role="alert">` vira `Alert` | — |

### Os contratos que a unidade cria

`Alert(props: { tone: 'danger' | 'neutral'; children })`, no tamanho `label`, com `role="alert"`.

### As skills e a leitura

`shadcn` (alert); [web](../guides/web.md) W21, W22.

### A ordem do trabalho

1. `alert.tsx` e o seu teste.
2. `FormAlert` e `ReadFailure` sobre ele.
3. As telas, uma pasta por vez.

### Como se prova

Critério 26: `alert.test.tsx` e os testes das telas tocadas.

### Parar se

- Uma tela usar o vermelho para algo que não é erro: deixar como está e anotar no pull request.

## U8 O seletor da barra lateral

**Base e modelo.** `main` depois da U3. Sonnet.

### As linhas da tabela

- **O seletor.** `hub/identity/company-switcher.tsx:30-83`, `hub/operations/central-header.tsx:18-72`,
  `hub/projects/project-rail.tsx:60-80`; `companiesQuery` em `company-switcher.tsx:34`,
  `account-menu.tsx:38`, `central-header.tsx:21`; `ui/dropdown-menu.tsx:48-55`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/ui/sidebar.tsx` | Cria `SidebarSelector` | os três seletores |
| `apps/web/src/hub/identity/` | Cria `useCompanies` (`public.ts`); muda `company-switcher.tsx`, `account-menu.tsx` | a moldura |
| `apps/web/src/hub/operations/central-header.tsx`, `apps/web/src/hub/projects/project-rail.tsx` | Muda: sobre a peça | a moldura |
| `apps/web/src/ui/dropdown-menu.tsx` | Muda: o rótulo de grupo é a legenda, sem maiúsculas (`DropdownMenuLabel`) | os menus |

### Os contratos que a unidade cria

`SidebarSelector(props: { icon: ReactNode; title: string; caption?: string; children })`;
`useCompanies(): UseQueryResult<…>` com `refetchOnMount: false`, a única leitura das empresas na
moldura.

### As skills e a leitura

`shadcn` (sidebar, dropdown-menu); [web](../guides/web.md) W8, W10.

### A ordem do trabalho

1. `useCompanies`; os três leitores passam a ele.
2. `SidebarSelector`; os três seletores sobre ele.

### Como se prova

Critério 27: `company-switcher.test.tsx`, `project-bar.test.tsx`, `workbench.layout.test.ts`.

### Parar se

- A Central precisar de um comportamento que os outros dois não têm: fica no conteúdo dela, nunca
  como opção da peça.

## U9 O Card e a Textarea

**Base e modelo.** `main` depois da U3. Sonnet.

### As linhas da tabela

- **O Card e a Textarea.** `ui/card.tsx`, `ui/textarea.tsx:10`; `builder/conversation/plan-card.tsx:119`,
  `hub/projects/project-cards.tsx:24`, `hub/identity/preparation-card.tsx:54`,
  `builder/model-accounts/model-fallback.tsx:138`, `builder/conversation/question-card.tsx:137,149`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| os cinco arquivos acima | Muda: o `Card` e a `Textarea` de `ui/` | — |

### Os contratos que a unidade cria

Nenhum. As pílulas feitas à mão ficam de fora: uma variante de `Badge` seria uma peça nova, e a
Pauta não a pede.

### As skills e a leitura

`shadcn` (card, textarea); [design](../guides/design.md) V28.

### A ordem do trabalho

1. Os quatro cartões; 2. a resposta livre; 3. o caso de foco.

### Como se prova

Critério 28: `focus.layout.test.ts` e os testes das telas tocadas.

### Parar se

- O `Card` mudar a medida de um cartão do Início que a U3 já mediu: o teste de layout da U3 decide.

## Depois

As unidades U6 a U9 da auditoria, cada uma um pull request que se verifica sozinho, em fila própria,
fora desta etapa: a leitura principal pelo `loader` nas telas Versões, Quem usa o app e Integrações
do Projeto (W17); apagar as atualizações repetidas depois de uma escrita (W12); as limpezas pequenas
(`dayAndHour`, `writeFailureText`, `useSecondsSince`, um `loadModelAccounts`, `retry: false`,
`defaultPreloadStaleTime: 0`); e o texto dos guias (W1 com a árvore real, a regra do Alerta, a V3
com a conferência da U1, a W17 reforçada), que vai num fechamento (L20).
