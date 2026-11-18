# A fundação do front-end

Trilho: assistente

Trilha Agentes e Apps, etapa de fundação de todo o front-end do Conexus. A palavra do fundador, em
2026-11-17, ao estudo do front-end: "A b" (a etapa de fundação na trilha Agentes e Apps, mais a
regra "peça antes de tela" nas duas trilhas) e "B 1" (manter a Pauta e terminá-la). Ele disse
também: "não é só de agentes, porque é tudo do front-end" e "É o Connexus inteiro". A marca
`Trilho: assistente` é a que a verificação `second-card` lê para esta trilha (`scripts/cli.ts`,
`trackOf`), como no último cartão dela. As verificações `approval` e `method-freeze` leem os pull
requests de G1 a G3 pelas pastas que eles mudam (`scripts/tracks.ts:9-12`), e `apps/web/` cai nas
marcas `design` e `frontier`, não nesta: o firstmate confere à mão a aprovação deste cartão antes de
cada build. Lido em `main` `f4ccc150`, com `@base-ui/react` 1.9.0,
`@shadcn/react` 0.3.1, `@tanstack/react-query` 5.104.0, `tailwindcss` 4.3.3. O estudo fica fora do
repositório (delivery L21). Ele mediu em `e24ad499`, e cada linha de `main` citada aqui foi relida
em `f4ccc150`. As referências foram clonadas num laboratório descartável, nos commits de cada
linha: `mastra@6e8dfcb` (a tag `@mastra/core@1.82.0`, com o `playground-ui`), `dify@44b073d`,
`supabase@a0a17e1`, `shadcn-ui@e62c943`, `craft-agents@4932ebb`. O pacote `@shadcn/lint@0.2.5` foi
lido pelo `npm pack`. A emenda de 2026-11-17, depois das respostas A e B, relê em `main` `ebfd4aa1`
cada linha que a U3 cita, com `drizzle-orm` 1.0.0-rc.4 e `@tanstack/query-core` 5.104.0; nenhum
arquivo da U3 mudou entre `f4ccc150` e `ebfd4aa1`.

## A página do fundador

**No fim desta etapa** você escolhe um Projeto do mesmo jeito em todo lugar do Hub: uma lista com
busca, que mostra todos os Projetos da empresa, e não só os 50 primeiros. As telas que você já
conhece não mudam de cara. O que muda é por baixo. As peças que toda tela repete passam a morar
num lugar só, com uma página que mostra cada uma. Uma ferramenta recusa a peça refeita. E as
próximas etapas com tela, nas duas trilhas, seguem a regra "peça antes de tela".

**A emenda de 2026-11-17.** Os contratos das peças de IA (U5) foram reescritos a partir do código de
hoje, antes da construção, porque os da primeira versão não cabiam nele, e seguem as referências.
A conversa continua igual, e o roteiro de uso é o mesmo. Uma coisa muda no celular: o aviso de que
o agente espera a sua resposta passa a ser a mesma linha do computador, no mesmo lugar do cartão,
com a cor dela. As fontes ficam como estão, e vão para a forma nova na etapa das telas da conversa.

**O roteiro de uso.**

1. No Início, abra **Agentes** e clique no filtro **Todos os Projetos**. Abre uma lista com busca.
   Digite parte do nome de um Projeto: só os que batem ficam, também os que ainda não tinham
   aparecido, porque a busca pergunta ao Hub. Escolha um: a lista de agentes passa a ser a dele.
2. Ainda em Agentes, clique em **Novo agente**. Abre a mesma lista, com a pergunta "em qual
   Projeto?". Escolha um: você vai para os agentes daquele Projeto. Numa empresa sem Projeto, a
   lista diz isso e oferece **Criar um Projeto**.
3. Volte ao Início e clique na pasta do Projeto, na caixa da conversa. É a mesma lista, com
   **Sem Projeto** no alto e um sinal no Projeto escolhido.
4. Na lista de conversas, abra o filtro. É a mesma lista, com **Todas**, **Início** e
   **Automações** ao lado dos Projetos.
5. Entre num Projeto e clique no nome dele, no alto da barra. É a mesma lista, com os recentes
   primeiro e a busca. Escolha outro Projeto: você vai para ele.
6. Se a lista de agentes não carrega, o título, o filtro e **Novo agente** continuam na tela, com a
   frase do erro embaixo.
7. Abra a página do pull request da última unidade e veja as capturas da vitrine de peças, nos dois
   temas, a 1366 e a 390 px.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página e responde às decisões
abaixo. No fim: faz o roteiro no Hub da nuvem, diz o que viu e aprova o único texto novo: **Criar um
Projeto**. Os outros já existem e passam a valer nos 5 lugares: **Mais Projetos**, **Buscar
Projeto**, **Nenhum Projeto com esse nome.**

**Fica de fora.**

- A cor, a fonte e o contraste. Você decidiu manter a Pauta ("B 1").
- O redesenho das telas, área por área. Ele vem depois desta etapa, numa etapa de telas por área.
  As decisões D, E e F do estudo (onde entram essas etapas, a primeira área e a referência paga)
  não estão neste cartão.
- A tabela de dados (busca, filtro, ordem e o tipo de cada coluna). Ela é da primeira etapa de
  telas. Os 60 avisos de restilo no `TableCell` ficam para ela, contados na catraca.
- As 9 peças do `DESIGN.md` ainda marcadas "(target)": o Composer, o menu "+" e as outras. Cada
  uma nasce na etapa da tela que a usa, já dentro da regra.
- Os itens abertos com o rótulo `next-card`. Esta etapa leva dois, porque muda os arquivos que os
  disparam: o 708 ("Crie um Projeto primeiro" sem ação, em `new-agent.tsx`) e o 705 (o erro de
  Agentes some com o título, o filtro e **Novo agente**, em `agent-list.tsx`). O 709 (o endereço
  com um Projeto apagado dá "não encontrado" de página inteira) espera: o Hub responde
  `NOT_FOUND` igual para o Projeto apagado e para o que a pessoa não pode ver
  (`packages/hub-api/src/agents.ts:182`), e separar os dois quebraria a regra de mesma resposta
  (security S10). O 706 (a linha do
  agente cortada a 390 px) espera: o gatilho dele é a linha do agente, que esta etapa não muda. Os
  outros são de Dados, do Assistente ou de telas que esta etapa não muda, e esperam o cartão que
  tocar os arquivos deles.

**As decisões suas nesta etapa.** As duas estão respondidas, no quadro, em 2026-11-17. As suas
palavras vão para o arquivo de aprovação deste cartão quando você aprovar a página.

- **A. A ordem na trilha.** A sua palavra "R2 a" pôs a etapa Um escopo e a fábrica de ferramentas
  antes de `A1`. Esta fundação precisava de um lugar nessa fila. A trilha constrói uma etapa por
  vez (delivery L1). As opções eram (a) a fundação primeiro, e a fábrica logo depois, e (b) a
  fábrica primeiro, e a fundação depois dela, antes de `A1`.

  **A sua resposta:** "A. A ordem na trilha: a". O que mudou desde a pergunta: a fábrica já tem
  cartão no `main` (pull request 1158) e foi construída (pull requests 1162 e 1173), e fechou em 2026-11-17 (pull request
  1176). Com a (a), a fundação é a próxima etapa da trilha.
- **B. A busca com mais de 50 Projetos.** O Hub devolve os Projetos 50 por vez. As opções eram (a)
  a busca procura nos que já vieram, como a pasta do Projeto faz hoje, e (b) a busca pergunta ao
  Hub.

  **A sua resposta:** "B. A busca com mais de 50 Projetos: b. Observação: Pra mim por boas prátivas
  busca, paginação, filtra é server side, verifique isso, e nã ocomo remendo usando /poteto-mode
  par aimplementar corretamente e ver código de refencias".

  **A verificação, no código.** As referências buscam no servidor. O Supabase manda o texto ao
  servidor junto da página (`apps/studio/data/projects/org-projects-infinite-query.ts:47-53`) e
  desliga o filtro local da lista
  (`apps/studio/components/ui/OrganizationProjectSelector.tsx:225`, `shouldFilter={false}`).
  O Dify escapa `%` e `_` e filtra no banco, no mesmo pedido da página
  (`api/services/knowledge/dataset_service.py:236-238`, `:264`). O Base UI 1.9 tem o modo para isso:
  `filter={null}` e a lista que vem do servidor (`combobox.md:1176`, `:3457`). O Hub já pagina os
  Projetos por nome no banco (`apps/server/src/hub/projects/projects.ts:290-320`). A busca entra
  nessa mesma consulta. A U3 diz como, e a construção dela usa `/poteto-mode`. A busca continua
  sem ignorar acento, como hoje: "acao" não acha "Ação". A etapa cresce cerca de 110 linhas de código, fora os testes.

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 | O lint de design: `@shadcn/lint` no Oxlint, só no `apps/web`, com a catraca de avisos; a CLI do shadcn ligada (`components.json`); as 5 classes que não existem, tiradas | `apps/web/`, `package.json`, `package-lock.json`, `docs/reference/stack.md` | design | — |
| G2 | U2 | A vitrine: a página de peças de chat vira a página de todas as peças de `ui/`, em cada estado, nos dois temas, sob a política real | `apps/web/src/ui/`, `apps/web/` (a página e o teste) | design | U1 |
| G2 | U3 | Escolher da lista: a busca de Projetos no Hub (o parâmetro `q` de `listProjects`), a peça `Picker` sobre o Combobox no modo de busca no servidor, a `ProjectPicker` com a leitura paginada e buscada de Projetos, e os 5 seletores de Projeto trocados por ela | `packages/hub-api/src/projects.ts`, `apps/server/src/hub/projects/`, `apps/web/src/ui/`, `apps/web/src/hub/projects/`, `apps/web/src/builder/assistant/`, `apps/web/src/builder/agents/`, `apps/web/` (testes de layout), `DESIGN.md` | web | U2 |
| G2 | U4 | As peças compostas: `Separator`, `Spinner`, `PageHeader`, `SearchField`; as cópias à mão trocadas por elas | `apps/web/src/ui/`, os assuntos de `apps/web/src/` onde estão as cópias, `DESIGN.md` | design | U3 |
| G3 | U5 | As peças de IA: linha de ferramenta, grupo, raciocínio, trabalhando, plano, tarefas, aprovação, pergunta e fontes como peças de apresentação em `ui/ai/`; a conversa só liga os dados | `apps/web/src/ui/ai/`, `apps/web/src/builder/conversation/`, `DESIGN.md` | web | U4 |
| G4 | U6 | A regra "peça antes de tela" no método: a regra nova do guia de design, um passo em `conexus-build`, `conexus-review`, `conexus-scope` (com os modelos de cartão das duas trilhas), `conexus-qa`; as marcas de V3, V16 e V22; o cartão apagado e a linha de uso | `docs/guides/design.md`, `.agents/skills/`, `docs/steps/`, `docs/approvals/` | delivery | U5 e o uso |

Um pull request por grupo (delivery L9). G1 vem sozinho e primeiro, porque uma verificação nova
entra num pull request próprio antes da etapa que a usa (delivery L20). G2 junta a vitrine e as
duas unidades de peças, porque cada peça nova entra na vitrine no mesmo commit. G3 fica à parte,
porque mexe na conversa, a área com mais testes. G4 é o pull request de fechamento, só de documentos, depois
do uso (delivery L17, L19): uma regra do método só muda no fechamento (delivery L20), e a etapa em
construção segue a regra com que começou. Nenhuma unidade corre em paralelo: U2 a U5 dividem `apps/web/src/ui/`.

**Orçamento de código alterado.** U1: 150. U2: 550. U3: 580 somadas e 520 apagadas (com a 705, a
busca no Hub, cerca de 40 no contrato e no servidor e 70 no front e no harness, e o modo `Select`
da peça, cerca de 40; os testes não contam). U4: 420 somadas e 320 apagadas. U5: 800, a maior parte movida. U6: só documento. Total
da etapa: cerca de 2.500 linhas somadas, dentro das 4.000 de delivery L2. São estimativas do
estudo, relidas em `f4ccc150`; as da U3, em `ebfd4aa1`.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `npm run lint` roda o Biome e depois o Oxlint com as regras do `@shadcn/lint` em `apps/web/src`. Um aviso a mais que o número escrito no script falha o comando, com a mensagem do Oxlint, e o job `ci` fica vermelho | à mão, sem teste guardado (é configuração): `npm run lint` com um restilo plantado em `builder/agents/new-agent.tsx`, tirado depois; o pull request de G1 mostra o `ci` verde | must |
| 2 | U1 | Um `<Button className="rounded-full bg-[#ff0000]">` fora de `ui/` recebe `no-restyle` ("owns its shape. Use a variant: …") e `no-arbitrary-values`. Dentro de `ui/` o `no-restyle` não roda | à mão, o mesmo plantio nas duas pastas | must |
| 3 | U1 | `no-unknown-classes` é erro, com zero ocorrências. As 5 classes que não existem saem: `gap-y-xxs`, `gap-xxs` (duas), `gap-2xs`, `bg-surface-2`. O que a pessoa vê não muda, porque uma classe que não existe não pinta nada. O `stroke="white"` de `builder/conversation/memory-status.tsx:61` fica, contado na catraca: é a máscara do arco, não uma cor que se vê | `npm run lint` verde; plantar `gap-xxs` falha com erro | must |
| 4 | U1 | `npx shadcn@latest info -c apps/web` devolve `base: "base"`, `style: "base-nova"` e os caminhos de `src/ui`. `npx shadcn@latest add badge --diff badge.tsx -c apps/web` mostra a diferença entre a peça e o original | rodar os dois comandos; a saída vai no pull request | must |
| 5 | U1 | `oxlint` e `@shadcn/lint` têm linha em `docs/reference/stack.md`, e a lista de dependências novas do CI as mostra (delivery L16) | `npm run docs` (`stack-row-missing`); o comentário do CI no pull request | must |
| 6 | U2 | `/pieces` mostra cada peça exportada por `ui/` e suas subpastas, com o exemplo típico e os estados que a peça tem, nos temas claro e escuro. Uma peça sem entrada falha o teste com o nome do arquivo | `apps/web/pieces.layout.test.ts`, caso "toda peça de ui/ tem entrada na vitrine", que lê `ui/**/*.tsx`; plantar um `ui/x.tsx` e um `ui/ai/x.tsx` sem entrada | must |
| 7 | U2 | A vitrine abre sob a política real do Hub sem erro no console e sem violação da política, a 1366, 390 e 320 px, nos dois temas, sem rolagem lateral | `pieces.layout.test.ts`, caso "a vitrine sob a política do Hub"; `layout.test.ts` passa a cobrir `/pieces` | must |
| 8 | U2 | `npm run build` não leva a vitrine: `dist/` não tem `pieces.html` | `vite.config.test.ts`, caso novo | must |
| 9 | U3 | Numa empresa com 60 Projetos, cada um dos 5 lugares mostra 50, e **Mais Projetos** traz os outros 10. Enquanto a página vem, **Mais Projetos** fica desligado e um segundo clique não pede outra. Se a segunda página falha, as 50 ficam, a frase do Hub aparece e **Mais Projetos** volta a ligar | `apps/web/project-picker.layout.test.ts`, um caso por lugar com as duas páginas no harness, e um caso com a segunda página em falha | must |
| 10 | U3 | A busca aparece quando a lista sem texto tem 7 linhas ou mais, itens fixos incluídos, ou quando o Hub diz que há mais página. O texto vai ao Hub, e a lista mostra só os Projetos cujo nome o contém, sem diferenciar maiúscula e sem ignorar acento (como o `matches` de hoje), 50 por vez, com **Mais Projetos** dentro da mesma busca. Numa empresa com 60 Projetos, buscar o 58º o acha sem apertar **Mais Projetos**. Os itens fixos do lugar (Todas, Início, Sem Projeto) filtram com `matches`, no navegador. Enquanto a resposta vem, a lista anterior fica, sem esqueleto a cada letra. Sem resultado: "Nenhum Projeto com esse nome." A busca reaberta começa vazia | `apps/web/src/ui/picker.test.tsx` (Vitest, a peça pela sua porta: o texto sai por `onText` e a peça não filtra); `project-picker.layout.test.ts`, caso com 60 Projetos e a resposta de `?q=` com o 58º, que confere o `q` pedido | must |
| 11 | U3 | Pelo teclado: abrir com Enter ou seta, andar com as setas, escolher com Enter, fechar com Esc. O foco volta ao gatilho. O leitor de tela ouve o nome da lista e o item escolhido | `apps/web/keyboard.test.ts`, caso novo por lugar | must |
| 12 | U3 | As linhas da lista têm 32 px com ponteiro e 44 px ao toque (design V58). A 390 px a lista cabe na largura, sem rolagem lateral | `project-picker.layout.test.ts` a 1366 e 390 | must |
| 13 | U3 | Se a primeira leitura falha, a lista mostra a frase do Hub (`sentenceOf`) e os itens fixos (Todas, Início, Sem Projeto) continuam escolhíveis | `project-picker.layout.test.ts`, resposta de falha | must |
| 14 | U3 | O filtro de Agentes com o endereço de um Projeto que não está nas páginas lidas mostra o nome dele no gatilho, lido à parte | `apps/web/src/builder/agents/agent-list.test.tsx`, o caso do filtro nomeado (`:79`), com os papéis da lista nova | must |
| 15 | U3 | **Novo agente** numa empresa sem Projeto mostra "Crie um Projeto primeiro: os agentes nascem num Projeto." e **Criar um Projeto**, que leva à página de Projetos (issue 708) | `agent-list.test.tsx`, caso novo | must |
| 16 | U3 | O nome do Projeto na barra abre a lista com até 5 recentes primeiro. Um recente que não está nas páginas lidas aparece com o nome lido à parte; um recente que o Hub não acha mais (apagado) não aparece | `apps/web/frame.layout.test.ts`, caso novo, com um id lembrado fora da primeira página e a resposta de `getProject`, e outro com `NOT_FOUND` | should |
| 17 | U3 | Os 5 lugares chamam `ProjectPicker`; nenhum deles importa `ui/dropdown-menu.tsx`, `ui/popover.tsx` ou `ui/select.tsx` para escolher Projeto. `SEARCH_FROM` e `matches` têm um dono só, `ui/picker.tsx` | a leitura do diff na revisão; `npm run knip` sem export solto | must |
| 18 | U3 | Agentes no Início com `listAgents` em falha que não é `NOT_FOUND` (por exemplo `DATABASE_UNAVAILABLE`) mostra o título, o filtro e **Novo agente**, e a frase com **Tentar de novo** no lugar da lista (issue 705). Um `NOT_FOUND` continua "não encontrado" de página inteira (security S10) | `apps/web/agents.layout.test.ts`, dois casos novos: `DATABASE_UNAVAILABLE` e `NOT_FOUND` | must |
| 19 | U4 | As cópias à mão contadas no estudo dão lugar à peça: as linhas `border-t`/`border-b` de separação viram `Separator`, os 3 giros viram `Spinner`, os 8 cabeçalhos de página viram `PageHeader`, os campos de busca com lupa viram `SearchField`. As telas ficam iguais à captura de antes, a 1366 e 390 | os testes de layout e as varreduras de estados existentes passam sem mudar; capturas antes e depois no relatório | must |
| 20 | U4 | O número de avisos da catraca cai, e o número novo fica escrito no script | `npm run lint`; o diff do `package.json` | must |
| 21 | U5 | As peças de `ui/ai/` não importam `builder/`, `hub/`, `@conexus/hub-api` nem `@mastra/*`: recebem só dados prontos. Nenhuma peça tem frase própria: nenhum texto com letra entre as tags do JSX e nenhum literal com letra em `aria-label`, `placeholder`, `title`, `alt` ou `label`; cada frase chega por prop | `npm run deps` (regras `web-support-does-not-import-subject`, W5, `ui-ai-takes-ready-data`, deste critério, e `mastra-only-in-builder`, W7), plantando um import de `builder/` e um de `@conexus/hub-api` numa peça; `apps/web/src/ui/ai/pieces.test.ts`, caso "nenhuma peça de ui/ai/ tem frase própria", que lê cada `ui/ai/*.tsx` pela árvore do TypeScript e nomeia o arquivo e a linha, plantando um `<h3>Fontes</h3>` e um `aria-label="Fontes"` em `sources.tsx` | must |
| 22 | U5 | A conversa se comporta como antes: os testes da conversa e as varreduras passam sem mudar nenhuma asserção | `conversation.layout.test.ts`, `tool-row.layout.test.ts`, `tools.layout.test.ts`, `proposal-card.layout.test.ts`, `sources.layout.test.ts`, `sweep-conversation-states.ts`, os testes Vitest de `builder/conversation/` | must |
| 23 | U5 | Cada peça de IA tem entrada na vitrine, e a entrada mostra cada membro de cada união por `kind` que o arquivo da peça exporta (os estados, `ToolLineBeside`, `ApprovalOutcome`, `SourceView`), cada um com o rótulo `Tipo.KIND`. A lista a seguir é o mínimo, com os campos que mudam o desenho: a linha de ferramenta executando, feita e com falha, com detalhe, com relógio e sem nada ao lado, com e sem corpo; o grupo trabalhando, feito e feito com falha; o raciocínio pensando, pensado com corpo e pensado sem corpo; a linha de trabalho trabalhando, com e sem contagem, e esperando; o plano aberto, com erro, aprovado, substituído e fechado; as tarefas pendente, em andamento e feita; a aprovação aberta, apagada, enviando, com erro, com falha de leitura e com escrita aberta, aprovada por você e sem ser por você, recusada, interrompida e parada, com nota e com recusa; a pergunta aberta, respondida e fechada; as fontes de página, com e sem link, e de tabela. | `apps/web/src/ui/ai/pieces.test.ts`, caso "cada membro de cada união de ui/ai/ tem estado na vitrine", que lê as uniões exportadas pela árvore do TypeScript e compara com os rótulos de `SHOWCASE`, plantando um membro novo numa união; o caso do critério 6, que lê `ui/ai/` | must |
| 24 | U6 | O guia de design tem a regra nova "peça antes de tela". `conexus-build`, `conexus-review`, `conexus-scope` (com o modelo do cartão e o cartão padrão da trilha Dados) e `conexus-qa` têm o passo dela, e cada arquivo fica no seu teto de palavras | `npm run docs` | must |
| 25 | U6 | V3, V16 e V22 passam a nomear o que o lint cobre delas, em aviso sob a catraca, sem tirar o "review" | `npm run docs`; leitura do diff | should |
| 26 | U3 | `GET /api/companies/{companyId}/projects?q=` devolve só os Projetos da empresa cujo nome contém o texto, sem diferenciar maiúscula (`ÇÃO` acha `Ação`), na ordem por nome, 50 por vez; o `next` dessa resposta, mandado com o mesmo `q`, traz a página seguinte da mesma busca. `%` e `_` valem como letra: `50%` não acha `500`. O texto chega sem os espaços das pontas e na forma NFC; um `q` vazio depois disso, ou com mais de 100 caracteres, é 400 `REQUEST_MALFORMED`. Quem não é membro continua com 404 `NOT_FOUND`, com ou sem `q` | `apps/server/src/hub/projects/projects.test.ts`, caso novo no Postgres real, com 60 Projetos; `apps/server/src/openapi-contract.test.ts` passa com o parâmetro novo | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A lista de Projetos (5 lugares) | igual a Vazio | os itens fixos do lugar; sem itens fixos, "Nenhum projeto ainda." (o texto de `hub/projects/project-state.ts:20`); em **Novo agente**, a frase de 708 e **Criar um Projeto** | a lista abre com 3 linhas de esqueleto; **Mais Projetos** desligado enquanto vem | a frase do Hub numa linha de alerta; itens fixos escolhíveis | o Projeto do endereço que não está nas páginas: o nome lido à parte; se a leitura dele falha, "Projeto" (como hoje) | o lugar não aparece para quem não pode (o que já vale hoje: Agentes só com `manageAgents`) | não se aplica: nenhuma escrita |
| A busca da lista | não aparece abaixo de 7 linhas sem mais página | "Nenhum Projeto com esse nome." | a lista da letra anterior fica até a resposta (o `placeholderData` de `builder/assistant/queries.ts:51-57`); a primeira busca, sem lista anterior, mostra as 3 linhas de esqueleto | a frase do Hub numa linha de alerta; os itens fixos que batem continuam escolhíveis | não se aplica | não se aplica | não se aplica: nenhuma escrita |
| A vitrine (`/pieces`, só nos testes e no computador de quem constrói) | não se aplica | não se aplica | cada peça mostra o seu carregando, se tem | cada peça mostra o seu erro, se tem | não se aplica | não se aplica: não está no build | não se aplica |
| As telas com peça composta trocada (U4) | sem mudança | sem mudança | o `Spinner` no lugar do giro à mão | sem mudança | sem mudança | sem mudança | sem mudança |
| As peças de IA na conversa (U5) | sem mudança: os estados de hoje, que a varredura `sweep-conversation-states.ts` já cobre | sem mudança | sem mudança | sem mudança | sem mudança | sem mudança | sem mudança |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `PickerGroup.items` | `ProjectPicker` (U3), com os Projetos lidos e os itens fixos do lugar | `Picker` |
| `PickerMore` | `ProjectPicker`, do `useInfiniteQuery` da busca atual | `Picker` (a linha **Mais Projetos**) |
| `PickerSearch` (`text`, `onText`) | `ProjectPicker`, que guarda o texto e o põe na chave da leitura | `Picker` (o campo de busca do Combobox) |
| `listProjects` `query.q` | `projectsPagedQuery(companyId, q)` (U3) | o servidor, `list` em `hub/projects/projects.ts`, no mesmo `where` da paginação |
| `PickerRead` | `ProjectPicker`, do estado da leitura | `Picker` (esqueleto, alerta) |
| `ProjectPicker.value` | cada um dos 5 lugares, do endereço ou do estado local | `ProjectPicker` (o sinal no escolhido; o nome lido à parte) |
| `ProjectPicker.onPick` | cada lugar (navegar, filtrar, escolher a pasta) | `Picker` chama |
| `--max-warnings` do `lint:design` | U1, e cada unidade que baixa a contagem | o Oxlint, no `npm run lint` do CI |
| A entrada da vitrine (`SHOWCASE`: `file`, `name`, `group`, `when`, `typical`, `states`) | quem cria ou muda uma peça de `ui/` | `pieces-fixture.tsx` (todos os campos) e `pieces.layout.test.ts` (`file`) |
| `ProjectPicker.before`, `after` | cada lugar: Todas, Início, Sem Projeto, Todos os Projetos, Automações | `ProjectPicker`, que os põe em grupos do `Picker` |
| `ProjectPicker.recentFor` | a barra do Projeto (`ProjectRailHead`), com a pessoa da rota | `ProjectPicker`, que chama `useRecentProjects` |
| `ProjectPicker.empty`, `Picker.empty` | cada lugar (em **Novo agente**, a frase de 708 e **Criar um Projeto**) | `Picker`, quando nenhum grupo tem item |
| `Picker.searchLabel`, `noMatch`, `PickerMore.label` | `ProjectPicker`, de `hub/projects/text.ts` | `Picker` |
| As uniões de estado de `ui/ai/` (U5) | a ligação em `builder/conversation/`, a partir dos eventos | cada peça de `ui/ai/` e a sua entrada na vitrine |

**O desenho de caixas.** A lista é o mesmo popup nos 5 lugares; muda só o gatilho.

```text
1280 px, gatilho no meio da tela              390 px, gatilho na caixa da conversa
┌──────────────────────────┐                  ┌──────────────────────────────────┐
│ [gatilho do lugar ▾]     │                  │ [▭ pasta]                         │
└──────────────────────────┘                  └──────────────────────────────────┘
┌ 288 px ──────────────────┐                  ┌ largura da tela menos 2×16 px ───┐
│ Projetos                 │  rótulo          │ Projetos                          │
│ ┌──────────────────────┐ │                  │ ┌──────────────────────────────┐ │
│ │ 🔍 Buscar Projeto    │ │  a partir de 7   │ │ 🔍 Buscar Projeto            │ │
│ └──────────────────────┘ │                  │ └──────────────────────────────┘ │
│ Sem Projeto              │  itens fixos     │ Sem Projeto              44 px    │
│ Comercial             ✓  │  32 px           │ Comercial                ✓        │
│ Financeiro               │                  │ Financeiro                        │
│ … até 256 px, rola       │                  │ … até 256 px, rola                │
│ Mais Projetos            │  se houver mais  │ Mais Projetos                     │
└──────────────────────────┘                  └──────────────────────────────────┘
```

A vitrine, nas duas larguras: um índice por grupo no alto (Ações, Campos, Navegação, Dados,
Retorno, Sobreposições, Conversa, IA), e cada peça como um bloco com o nome, uma linha de quando
usar, o exemplo típico e a fileira de estados lado a lado, com o tema escuro numa faixa abaixo. A
390 px a fileira de estados quebra em coluna. É o esqueleto da página de design system da skill
`shadcn` (`design-system-page.md`, "Page Outline" e "Block anatomy").

Não há produto antigo para esta etapa. As capturas das telas de hoje estão no estudo, fora do
repositório.

## A tabela de falhas

A etapa não acrescenta escrita no banco nem rota nova no Hub: a lista de Projetos ganha só o
parâmetro de leitura `q`. As linhas são essa leitura e os comandos da biblioteca que as unidades
chamam.

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `fetchNextPage` do TanStack Query (**Mais Projetos**) | a linha fica desligada enquanto `isFetchingNextPage`; um segundo clique não pede outra página | a página que falhou não entra; as já lidas ficam; a frase do Hub aparece | o Hub fora: a frase de falha de rede de `sentenceOf`, e **Mais Projetos** volta a ligar | nada no console; o Hub registra a leitura como hoje | 9, 13 |
| `listProjects` com `q`, a cada letra | uma leitura por texto; a da letra anterior, sem observador, é cancelada pelo TanStack Query, porque o `hubQuery` usa o `signal` (`platform/hub.ts:226`; `@tanstack/query-core` `src/query.ts:523-537`) | uma leitura cancelada não entra na lista; a lista mostra a resposta do último texto | o Hub ou o banco fora: a frase de `sentenceOf`, a lista anterior sai, os itens fixos que batem ficam | o Hub registra cada leitura como hoje, pela rota e não pelo endereço: o texto buscado não vai ao registro (`platform/http.ts:137`, `:171`) | 10, 13, 26 |
| `navigate` do TanStack Router ao escolher | não se aplica: escolher fecha a lista, então não há segundo escolher na mesma abertura | não se aplica | não se aplica | nada | 9, 14 |
| `oxlint` no `npm run lint` | não se aplica (lê arquivos) | um aviso acima do número para o comando com saída diferente de zero | o pacote não instalado: o `npm ci` do CI já falha antes | a contagem e cada aviso com arquivo e linha | 1, 2, 3, 20 |
| `shadcn add` e `--diff` (só no computador de quem constrói) | não se aplica | um `add` sem `--dry-run` sobrescreveria a peça; o cartão só usa `--dry-run`, `--diff` e `add` de peça nova | sem rede, o comando falha e nada muda | o diff ou o erro | 4 |

## A tabela de referência

| Peça | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Unidade | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Lint de design que ensina | Biome (tamanho, `noInlineStyles`), GritQL só para larguras (`scripts/w25.grit`) | `@shadcn/lint@0.2.5` no Oxlint 1.94.0, rodado num retrato de `apps/web/src` (348 avisos, zero falso positivo nos tokens, 1,7 s); Dify `packages/tooling/lint.config.ts:279-358` (`dify@44b073d`); Supabase `packages/eslint-config-supabase/shadcn.js:6-17` (`supabase@a0a17e1`) | regras por peça com mensagem que aponta a variante, em aviso | nativo | — | U1 | `apps/web/.oxlintrc.json` |
| A catraca de avisos | a C76 conta as supressões em arquivo (`scripts/check-suppressions.ts`) | `oxlint --max-warnings <n>`; Supabase `ratchet-rules.json:1`, aplicada pelo script `ratchet-eslint-rules.ts` | o Oxlint falha acima do número; o Supabase usa script | nativo (a opção do Oxlint, sem script) | — | U1 | o script `lint:design` em `apps/web/package.json` |
| CLI do shadcn | ausente: `shadcn info -c apps/web` devolve `"config": null` | shadcn `components.json`; os aliases pelo campo `imports` do `package.json` (provado: `info`, `add --dry-run` e `add --diff` funcionam) | `add`, `--diff`, registros | nativo | — | U1 | `apps/web/components.json` |
| Vitrine | `apps/web/pieces.html` e `ui/pieces-fixture.tsx:53-54`, 15 peças de chat, só nos testes (`layout-served.ts:13-17`) | skill `shadcn` `design-system-page.md` (esqueleto e anatomia do bloco); Craft Agents `renderer/playground/registry/` (40 arquivos, `craft-agents@4932ebb`); Mastra stories (`mastra@6e8dfcb`) | cada peça num registro, em cada estado | embrulhado: a página que já existe, crescida, e o registro é nosso | critérios 6 a 8 | U2 | `apps/web/src/ui/showcase.ts` |
| Escolher um item de uma lista longa | 5 seletores, 4 peças diferentes (a seção de U3) e `builder/assistant/choice-list.tsx` | `@base-ui/react@1.9.0` Combobox, "Input inside popup" (`docs/react/components/combobox.md:1873-1875`) e "Grouped" (`:2777-2779`); Dify `web/features/tag-management/components/tag-selector.tsx:1-12` (`dify@44b073d`) | Combobox com a busca dentro do popup, grupos, vazio; o Dify importa as peças e lê os dados do contrato | nativo, no modo de busca no servidor: `filter={null}` e a lista que vem do Hub (`combobox.md:1176`, `:3457`); **Mais Projetos** é embrulhado (a linha no fim chama `fetchNextPage`) | critério 9 (Mais Projetos) | U3 | `apps/web/src/ui/picker.tsx` |
| Uma leitura de Projetos para escolher | `projectsPagedQuery` em 4 lugares, `projectsQuery` (só a primeira página) em `place-filter.tsx:46,84` e `recent-projects.tsx:27`; a busca filtra só as páginas lidas (`project-choice.tsx:61`) | TanStack Query `infiniteQueryOptions` (já em `hub/projects/queries.ts:25-36`); Supabase `apps/studio/data/projects/org-projects-infinite-query.ts:79-82` (o texto na chave e no pedido, `supabase@a0a17e1`); Dify `web/app/components/api-key/dataset-scope-dialog.tsx:177-186` (`keyword` no pedido de cada página, `dify@44b073d`); a lista anterior na tela enquanto o texto novo responde, `builder/assistant/queries.ts:51-57` | uma função por recurso, o texto na chave, as telas só chamam | nativo | — | U3 | `apps/web/src/hub/projects/project-picker.tsx` |
| A busca de Projetos no Hub | nenhuma: `listProjects` recebe só `page` (`packages/hub-api/src/projects.ts:55`); a única busca do Hub é a dos títulos de conversa, que lê as conversas do Mastra e filtra na memória do servidor (`apps/server/src/builder/assistant/search.ts:35-57`), porque o Mastra não busca por título | Dify `api/services/knowledge/dataset_service.py:236-238` (`escape_like_pattern` e `ilike` com `escape`) e `:264` (a página na mesma consulta, `dify@44b073d`); Supabase `org-projects-infinite-query.ts:47-53` (`limit`, `offset`, `sort`, `search` num pedido só); `drizzle-orm` `ilike` (`sql/expressions/conditions.d.ts:366`, sem argumento de escape: vale o `\` padrão do Postgres); o contrato com busca que o Hub já tem, `packages/hub-api/src/assistant.ts:216-220` (`Page.extend` com `q`) | o texto no `where` da mesma consulta paginada, com `%`, `_` e `\` escapados | nativo | — | U3 | nenhum: muda `apps/server/src/hub/projects/projects.ts` e `packages/hub-api/src/projects.ts` |
| Separador, carregando | 32 linhas `border-t`/`border-b` soltas fora de `ui/`; 3 `animate-spin` à mão | shadcn base-nova `separator`, `spinner` (`npx shadcn@latest add separator spinner --dry-run` com o `components.json` de U1) | peça copiada e pintada com os tokens | nativo | — | U4 | `ui/separator.tsx`, `ui/spinner.tsx` |
| Busca | 7 campos com lupa, de 4 jeitos; o `Search` de `choice-list.tsx` | `ui/input-group.tsx` (já existe); skill `shadcn` `rules/forms.md` ("Buttons inside inputs use InputGroup") | uma peça só sobre o `InputGroup` | nativo | — | U4 | `ui/search-field.tsx` |
| Cabeçalho de página | `flex flex-wrap items-… justify-between gap-md` em `agent-list.tsx`, `projects.tsx`, `roles.tsx`, `clients.tsx`, `data-page.tsx`, `connection-page.tsx`, `my-accounts.tsx`, `company-accounts.tsx` | Supabase `packages/ui-patterns` `PageHeader` (`supabase@a0a17e1`) | composto de título e ações | embrulhado (só composição) | critério 19 | U4 | `ui/page-header.tsx` |
| Vazio, chip | `ui/states.tsx:125` (`Empty`) e `ui/badge.tsx` já existem | shadcn `empty`, `badge` | — | nativo | — | fica de fora: já são as peças; U4 só troca as cópias que o lint apontar | — |
| Peças de IA (apresentação) | em `builder/conversation/`, desenho e leitura do stream juntos: `tool-row.tsx` (376 linhas), `tool-group.tsx`, `thinking-line.tsx`, `working-line.tsx`, `plan-card.tsx`, `task-panel.tsx`, `approval-card.tsx`, `question-card.tsx`, `sources.tsx` | shadcn `apps/v4/content/docs/ai-elements/base/` (21 receitas sobre `Trace`, `shadcn-ui@e62c943`); Mastra `packages/playground-ui/src/ds/components/ai/{activity,plan,task-list,tool-approval,tool-call,ask-user}` e a ligação em `domains/chat/` (`mastra@d60ba71`, a tag `@mastra/core@1.83.0`, a versão que o Conexus instala) | o desenho no pacote de peças; a ligação com os eventos na área do assunto | nativo (receitas do shadcn); a ligação com os eventos do Mastra é embrulhada e fica em `builder/conversation/` | critérios 22 e 23 (a ligação) | U5 | `apps/web/src/ui/ai/*.tsx` |
| Estados de vários agentes | `handoff.ts` | shadcn `ai-elements/base/subagent.mdx` (Trace aninhado) | uma linha por subagente que abre nas chamadas dele | nativo | — | fica de fora: nenhuma tela de hoje mostra vários agentes; entra na etapa que mostrar | — |
| A regra no método | nenhuma skill manda procurar em `ui/` antes de criar | Supabase `AGENTS.md:51` ("Check `packages/ui/index.tsx` before creating new primitives"), `apps/studio/AGENTS.md:42`; Dify `packages/dify-ui/AGENTS.md:12-13` | texto curto que o agente lê, com o lint atrás | nativo | — | U6 | — |

**A medida do transplante.** Nada vem do repositório antigo. U5 move código de `main` para `ui/ai/`:
cada arquivo movido conta as linhas que mudam na entrada. Passado um terço delas, a peça é escrita
de novo a partir da receita do shadcn (a regra do estudo, `conexus-study`).

**A dívida.**

- A aba Projetos da lista de conversas (`builder/assistant/projects-tab.tsx:82`) mostra só os 50
  primeiros Projetos, como grupos. É lista, não escolha, e fica para a etapa de telas das conversas.
- Os 60 avisos de restilo no `TableCell` ficam para a etapa da tabela de dados.
- A busca de Projetos não ignora acento, e a de conversas ignora (a decisão 10 do firstmate).
- Os 33 avisos de `require-static-classes` ficam em aviso; cada um some quando a peça ganhar a
  variante, na etapa da tela dela.
- As fontes (`ui/ai/sources.tsx`) ficam na forma de hoje, fora da receita `Trace` do shadcn. A etapa
  que refaz as telas da conversa as leva à receita, com a fonte de tabela do Conexus como uma linha
  dela (o fundador, 2026-11-17, "a").

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | Oxlint ao lado do Biome, só para o `@shadcn/lint`, e não ESLint | O Biome não roda plugin JS; o Dify roda o `@shadcn/lint` no Oxlint (`packages/tooling/package.json:8`); rodado aqui, 1,7 s em todo o `src` | trocar o script por `eslint` com o mesmo plugin |
| 2 | `no-inline-styles` do `@shadcn/lint` desligada | o Biome `noInlineStyles` já é o dono da V17; dois donos de uma regra é Bloqueia (delivery L12) | ligar a regra e tirar a do Biome |
| 3 | A catraca é o `--max-warnings` do Oxlint, total, e não uma contagem por regra | nativo (C75); a contagem por regra do Supabase pede um script próprio | trocar por um script como `ratchet-eslint-rules.ts` |
| 4 | Os aliases do `components.json` pelo campo `imports` do `package.json` (`#ui/*`), e o código continua com import relativo; o que o `shadcn add` escrever com `#ui/` é reescrito relativo | a CLI recusa um `components.json` sem alias que resolva (rodado: "Could not resolve the following aliases"); com `imports`, `info`, `add --dry-run` e `--diff` funcionaram; o resto do Hub usa import relativo | tirar o campo `imports` e o `components.json` |
| 5 | A vitrine cresce da página de peças de chat, sem Storybook | já é servida aos testes com a política real (`layout-served.ts`); o Storybook é um segundo build e não roda sob `style-src 'self'` | instalar o Storybook e apagar a página |
| 6 | A regra nova mora no guia de design, não no `web.md` | o guia de design é o dono do reuso de estilo (`web.md`, "Design V23 owns style reuse"); o `web.md` está no teto de 2.000 palavras | mover a regra |
| 7 | U6 entra no pull request de fechamento, depois do uso, que apaga este cartão | uma skill ou um guia só muda no fechamento (delivery L20); com o cartão ainda em `docs/steps/`, o `method-freeze` recusa um diff só de documentos (`scripts/tracks.ts:24-26`) | a regra entra no pull request de métodos da semana, com a palavra do fundador |
| 8 | As 5 classes que não existem saem, em vez de virar um token próximo | uma classe inexistente não pinta nada: tirá-la mantém o que a pessoa vê hoje, e trocar por `gap-xs` seria inventar um valor | trocar pelo token que o desenho pedir, na etapa da tela |
| 9 | A vitrine fica só no computador de quem constrói e nos testes; o fundador a vê nas capturas do QA no pull request | as referências convergem: o Mastra e o Dify a servem pelo Storybook, o Supabase num site à parte, todas fora do produto; `layout-served.ts:13-17` já serve `/pieces` só aos testes | servir a página numa rota da Central, só para quem opera |
| 10 | A busca de Projetos no Hub não ignora acento: `ILIKE` no nome, como o `matches` de hoje no navegador | ignorar acento no banco pede a extensão `unaccent` no Postgres do Hub, que ele não tem, numa migração nova (raio maior que esta etapa); a busca de títulos de conversa ignora acento porque filtra na memória do servidor (`builder/assistant/search.ts:14-17`), um caminho que não pagina no banco; os nomes de Projeto já são gravados em NFC (`packages/hub-api/src/projects.ts:9-16`) e o texto chega em NFC pelo contrato | uma migração com `unaccent` e a coluna buscada, numa etapa própria |
| 11 | Sem espera entre letras: cada texto é uma leitura, a anterior cancelada pelo `signal`, e a lista anterior fica na tela até a resposta | é o que a busca de conversas do Hub já faz (`sidebar-conversations.tsx:68-86`, `builder/assistant/queries.ts:51-57`), e o TanStack Query cancela a leitura sem observador que usou o `signal` (`query-core` `src/query.ts:523-537`); o Supabase espera 500 ms (`OrganizationProjectSelector.tsx:90-91`) e o Base UI cancela à mão com `AbortController` (`combobox.md:3481-3492`): os dois resolvem o que a biblioteca de leitura já faz aqui | esperar 300 ms depois da última letra antes de pôr o texto na chave, como o Supabase |
| 12 | O `Picker` é o `Select` do Base UI abaixo de `SEARCH_FROM` e o `Combobox` com campo a partir dele, atrás de um contrato só | o Base UI manda usar o `Select` quando não há campo, pelo que o leitor de tela ouve (`combobox.md:533`); o fundador decidiu a busca só a partir de 7 linhas; a pessoa vê a mesma lista nos dois modos | o `Combobox` com o campo sempre, se o fundador quiser a busca em toda lista |
| 13 | Os nove contratos da U5 reescritos a partir dos arquivos de `main` `da21543c` (emenda de 2026-11-17), com cada estado e cada frase por prop, o Markdown e o corpo da ferramenta como `ReactNode` já desenhado pela ligação, as duas formas de fonte, a linha de espera numa peça só (a `WorkingLine`) e a regra `ui-ai-takes-ready-data`; e não estreitar a U5 às peças de linha | o construtor parou antes de mover código: nenhum dos nove contratos cabia no que o arquivo desenha (a lista, peça por peça, está no pull request da emenda); a escolha é técnica e não muda o que a pessoa vê nem o escopo, e estreitar a unidade cortaria escopo, que só o fundador corta; o Mastra 1.83 dá à peça dados prontos e um `ReactNode` onde o desenho é do assunto (`playground-ui` `ds/components/ai/tool-approval/tool-approval.tsx:77-82`, `tool-call/tool-call-group.tsx:31-36`) | voltar aos contratos da primeira versão e ampliar só o que um teste pedir |

## U1 O lint de design e a CLI do shadcn

**Base e modelo.** `main` no commit em que G1 começa (o cartão leu `f4ccc150`). Sonnet: configuração
e cinco classes tiradas.

### As linhas da tabela

- **Lint de design que ensina.** Na base: `biome.json` (o que o Biome já cobre), `scripts/w25.grit`,
  `package.json` (`lint`: `biome check .`), `.github/workflows/ci.yml:126` (`npm run lint`). Na
  referência: o README de `@shadcn/lint@0.2.5` (no `node_modules` depois da instalação), as regras
  `no-restyle`, `no-raw-colors`, `no-arbitrary-values`, `no-unknown-classes`,
  `require-static-classes`, `no-inline-styles`; Dify `packages/tooling/lint.config.ts:279-358`.
- **A catraca.** `oxlint --help`, opção `--max-warnings`.
- **CLI do shadcn.** A skill `shadcn` (`cli.md`, comando `info`; "Key Fields": `aliases`,
  `resolvedPaths`, `base`).

A configuração provada fora do repositório, que U1 copia para `apps/web/.oxlintrc.json`:

```json
{
  "jsPlugins": ["@shadcn/lint"],
  "categories": { "correctness": "off" },
  "rules": {
    "shadcn/no-restyle": ["warn", { "allow": ["layout"] }],
    "shadcn/no-raw-colors": "warn",
    "shadcn/no-arbitrary-values": "warn",
    "shadcn/no-unknown-classes": "error",
    "shadcn/require-static-classes": "warn"
  },
  "overrides": [{ "files": ["src/ui/**"], "rules": { "shadcn/no-restyle": "off" } }]
}
```

O plugin acha o tema pelo `components.json` (`tailwind.css`, relativo a ele). Com
`src/brand/tokens.css`, `no-unknown-classes` aceitou `bg-surface` (122 usos), `text-text-2` (365),
`gap-md` (104).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/.oxlintrc.json`, `apps/web/components.json` | Cria | o Oxlint; a CLI do shadcn |
| `apps/web/package.json` | Muda: `devDependencies` (`oxlint`, `@shadcn/lint`, versões exatas), script `lint:design`, campo `imports` | o `npm run lint` da raiz |
| `package.json`, `package-lock.json` | Muda: `lint` passa a `biome check . && npm run lint:design -w @conexus/web` | o CI (`ci.yml:126`), `verify`, `check` |
| `docs/reference/stack.md` | Muda: as duas linhas novas | `npm run docs` (`stack-row-missing`) |
| `apps/web/src/builder/agents/versions.tsx`, `apps/web/src/builder/agents/draft-panel.tsx`, `apps/web/src/builder/conversation/tool-bodies.tsx`, `apps/web/src/builder/assistant/company-memory.tsx`, `apps/web/src/hub/copies/raw-layer.tsx` | Muda: sai a classe que não existe (linhas 67, 119, 34, 71 e 59) | — |

### Os contratos que a unidade cria

Nenhum tipo nem rota. A forma de cada coisa:

- **O dono do número da catraca**: o script `lint:design` em `apps/web/package.json`, um só número
  (C26). Cada unidade que baixa a contagem baixa o número no mesmo commit.
- **O dono do tema que o lint lê**: `components.json` → `src/brand/tokens.css`.

### As skills e a leitura

`shadcn` (a skill, `cli.md` e `rules/styling.md`); as linhas de `stack.md` de `tailwindcss` e
`@shadcn/react`; o README de `@shadcn/lint` no `node_modules`; `oxlint --help`.

### A ordem do trabalho

1. **As 5 classes que não existem.** Critério: 3. Primeiro, para que o lint nasça verde com
   `no-unknown-classes` em erro.
   - **Arquivos:** os cinco do raio.
   - **O que sai:** `gap-y-xxs`, `gap-xxs` (duas), `gap-2xs`, `bg-surface-2`. O `stroke="white"` da
     máscara em `memory-status.tsx:61` fica: um token mudaria com o tema e apagaria o arco no escuro.
   - **Pronto quando:** as 5 classes saíram (`grep`); o passo 2 confere com o lint.
2. **O lint e a catraca.** Critérios: 1, 2.
   - **Arquivos:** cria `apps/web/.oxlintrc.json`; muda `apps/web/package.json`, `package.json`,
     `package-lock.json`.
   - **Referência a seguir:** `@shadcn/lint@0.2.5` README; `oxlint@1.94.0` `--max-warnings`.
   - **O que entra:** `"lint:design": "oxlint --max-warnings <n> src"`, com `<n>` o que o Oxlint
     contar com as 5 classes já tiradas (a prova contou 348 com elas; espere cerca de 343). Regras: C76 (a contagem num arquivo que o CI compara), L16.
   - **Testes:** plantar o restilo do critério 2 em `builder/agents/new-agent.tsx` e em
     `ui/button.tsx`; rodar; tirar.
   - **Mutações à mão:** baixar `<n>` em 1 → `npm run lint` falha; desligar o `overrides` → `ui/`
     ganha avisos de `no-restyle`; recolocar `gap-xxs` → erro de `no-unknown-classes`.
   - **Pronto quando:** `npm run lint` verde na raiz, com a contagem impressa: zero em
     `no-unknown-classes` e um aviso em `no-raw-colors`, o da máscara.
3. **A CLI do shadcn.** Critério: 4.
   - **Arquivos:** cria `apps/web/components.json` (`style: "base-nova"`, `rsc: false`,
     `tailwind.css: "src/brand/tokens.css"`, `iconLibrary: "lucide"`, aliases `#web`, `#ui`,
     `#ui/cn`, `#web/platform`, `#ui`); `apps/web/package.json` ganha
     `"imports": { "#ui/*": "./src/ui/*", "#web/*": "./src/*" }`.
   - **O que sai:** nada.
   - **Pronto quando:** `npx shadcn@latest info -c apps/web --json` mostra `config.base: "base"`; o
     `--diff` de `badge` imprime a diferença.
4. **As linhas de `stack.md`.** Critério: 5. `oxlint` (Used in `apps/web`, Read first `oxlint
   --help`, Skill none) e `@shadcn/lint` (Read first o README do pacote, Trap: a pasta de trabalho
   precisa estar num repositório git, senão o Oxlint segue o `.gitignore` de cima e diz "No files
   found to lint").

### Como se prova

Critérios 1 a 3: `npm run lint` com e sem o plantio; a saída vai no relatório. Critério 4: os dois
comandos. Critério 5: `npm run docs` e o comentário de dependências do CI. Hoje o
`npm run lint` não olha restilo nenhum: o plantio passa. Os critérios 1 e 2 não ganham teste
guardado: são configuração, e o `ci` de cada pull request seguinte os exercita. O que nenhum teste
guarda é o número acima da contagem real; quem baixa a contagem baixa o número no mesmo commit.

### Parar se

- O Oxlint instalado não carrega o plugin, ou conta longe de 343 avisos no passo 2 (a prova
  rodou num retrato de `f4ccc150`, com 348 antes do passo 1; uma diferença pequena vem dos commits
  novos: anote).
- O `shadcn add` escreve `import { cn } from "cn"` (visto na prova com o alias `#ui/cn`): procure o
  alias de `utils` que gera o import certo; sem um, anote e siga, porque o código não usa os
  aliases.
- O `knip` ou o `dependency-cruiser` recusam o campo `imports`.

## G1 O ponto de conferência

`npm run check`, `npm run lint` com o plantio e sem ele, os dois comandos do shadcn. Nenhuma tela
muda: as capturas não se aplicam. O pull request lista as dependências novas (delivery L16).

## U2 A vitrine

**Base e modelo.** A cabeça de G1 já em `main`. Sonnet: uma página e um registro.

### As linhas da tabela

- **Vitrine.** Na base: `apps/web/pieces.html`; `apps/web/src/ui/pieces-fixture.tsx` (185 linhas,
  as 15 peças de chat); `apps/web/layout-served.ts:13-17` (`/pieces` só nos testes);
  `apps/web/layout-harness.ts:17` (`BUILT`); `apps/web/pieces.layout.test.ts`. Na referência: skill
  `shadcn` `design-system-page.md`, seções "Page Outline", "Components: Tiers and Block Anatomy",
  "States Without Interaction" (o `data-preview` que fixa foco e passar do mouse sem interação);
  Craft Agents `renderer/playground/registry/` (`craft-agents@4932ebb`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/ui/showcase.ts` | Cria: o registro | `pieces-fixture.tsx`, `pieces.layout.test.ts` |
| `apps/web/src/ui/pieces-fixture.tsx` | Muda: renderiza o registro, por grupo | `pieces.html` |
| `apps/web/src/brand/tokens.css` | Muda: as variantes `hover`, `focus-visible`, `active` aceitam `[data-preview~=…]` | todas as peças |
| `apps/web/pieces.layout.test.ts`, `apps/web/layout.test.ts`, `apps/web/vite.config.test.ts` | Muda: os casos dos critérios 6 a 8 | `npm run test:browser` |

### Os contratos que a unidade cria

Em `apps/web/src/ui/showcase.ts`:

```ts
export type ShowcaseGroup =
  | 'Ações' | 'Campos' | 'Navegação' | 'Dados' | 'Retorno' | 'Sobreposições' | 'Conversa' | 'IA'

export type PreviewState = 'default' | 'hover' | 'focus' | 'active' | 'disabled' | 'invalid'
  | 'loading' | 'empty' | 'error'

export type ShowcaseEntry = {
  /** O arquivo de `ui/` que a entrada mostra, como `button.tsx`; o teste confere que existe. */
  file: `${string}.tsx`
  name: string
  group: ShowcaseGroup
  /** Uma linha de quando usar, tirada do `DESIGN.md` quando ele tem. */
  when: string
  typical: () => ReactElement
  states: readonly [PreviewState, () => ReactElement][]
}

export const SHOWCASE: readonly ShowcaseEntry[]
```

- **O dono da lista de peças**: `SHOWCASE` (C26). O teste lê `ui/**/*.tsx` (fora
  `pieces-fixture.tsx` e `*.test.tsx`) e falha com o nome de cada arquivo sem entrada.
- **Cada estado**: `PreviewState` é uma união de literais; cada entrada mostra só os que a peça tem.
- **O arquivo modelo**: nenhum. Nenhum arquivo de `ui/` tem estado com união nem id, então nenhum
  cumpre C21 e C23.

### As skills e a leitura

`shadcn` (`design-system-page.md`, `rules/composition.md`); `playwright-cli`, pela linha de
`playwright-core` em `stack.md`; o guia de testes T23 e T25.

### A ordem do trabalho

1. **O registro e as peças de hoje.** Critério: 6.
   - **Arquivos:** cria `ui/showcase.ts`; muda `ui/pieces-fixture.tsx`.
   - **O que sai:** as seções escritas à mão de `pieces-fixture.tsx`, que viram entradas.
   - **O que entra:** uma entrada por arquivo `.tsx` de `ui/`, fora os testes e a própria página. Textos de exemplo em português, sem lorem ipsum (`design-system-page.md`, princípio 6).
   - **Testes:** `pieces.layout.test.ts`, "toda peça de ui/ tem entrada na vitrine".
   - **Mutações à mão:** tirar a entrada de `badge.tsx` → o teste nomeia `badge.tsx`.
   - **Pronto quando:** `/pieces` mostra todas as peças.
2. **Os estados fixos e os dois temas.** Critérios: 6, 7.
   - **Arquivos:** `brand/tokens.css`, `ui/pieces-fixture.tsx`.
   - **Referência a seguir:** `design-system-page.md`, "States Without Interaction"
     (`@custom-variant hover`, `focus-visible`, `active` com `data-preview`).
   - **Testes:** `pieces.layout.test.ts`, "a vitrine sob a política do Hub", a 1366, 390 e 320, nos
     dois temas; `layout.test.ts` com `/pieces` na lista de rotas que ele varre.
   - **Mutações à mão:** pôr um `style={…}` numa entrada → o teste vê a violação da política.
   - **Pronto quando:** zero erro de console e zero violação.
3. **Fora do build.** Critério: 8. `vite.config.test.ts`, caso "o build não leva a vitrine".

### Como se prova

O teste da vitrine abre `/pieces` no harness, com a política real, e conta as entradas contra os
arquivos de `ui/`. Hoje a página mostra 15 peças e nenhum teste confere as outras.

### Parar se

- Uma peça de `ui/` não renderiza fora do seu contexto (o `Sidebar`, que pede o provedor): mostre
  dentro de um quadro com o provedor, como a skill manda para o Shell (`collapsible="none"`); se
  nem assim, anote a peça e pergunte.
- As variantes com `data-preview` mudam o que uma tela real mostra.

## U3 Escolher da lista

**Base e modelo.** A cabeça de U2. Opus: um parâmetro novo num contrato do Hub e a consulta dele,
uma peça genérica de `ui/`, um dono em `hub/projects/`, cinco chamadores em três assuntos, e a
página de Agentes com o seu carregador. A construção usa `/poteto-mode` (a palavra do fundador na
decisão B): o desenho dos tipos antes do código, e a prova no Postgres real e no navegador.

### As linhas da tabela

- **Escolher um item de uma lista longa.** Na base, os cinco, lidos em `f4ccc150`:
  `builder/assistant/place-filter.tsx:45` (`DropdownMenu` com rádio, `projectsQuery`, só 50);
  `builder/assistant/project-choice.tsx:52` (`Popover` e botões com `aria-pressed`, busca à mão,
  pagina); `builder/agents/agent-list.tsx:149` (`ChoiceSelect` com o item falso `MORE`, pagina;
  `NamedFilter` lê o Projeto do endereço à parte); `builder/agents/new-agent.tsx:24`
  (`DropdownMenu` de links, pagina); `hub/projects/project-rail.tsx:39` (`SidebarSelector` com os
  recentes de `recent-projects.tsx:27-35`, que lê só a primeira página). O kit
  `builder/assistant/choice-list.tsx` (41 linhas), que tem outros usuários além dos seletores:
  `plus-menu.tsx:19` (`LIST`, `matches`, `ROW`, `SEARCH_FROM`, `Search`, na lista de ligações do
  menu "+"), `composer-tools.tsx:12` (`CHIP`, `WORDS`), `builder/assistant/public.ts:2` (`ROW`, para
  `builder/agents/chooser.tsx:9` e `tools-section.tsx:8`). A peça `ui/combobox.tsx` (149 linhas). Na
  referência: Base UI `docs/react/components/combobox.md:1873-1875` (input dentro do popup),
  `:2777-2779` (grupos), `:1174-1178` (itens com ids estáveis); Dify `tag-selector.tsx:1-12`.
- **Uma leitura de Projetos para escolher.** `hub/projects/queries.ts:25-36`
  (`projectsPagedQuery`, `getNextPageParam` pelo `next.kind`); `packages/hub-api/src/companies.ts:81`
  (`PAGE_SIZE = 50`); a busca de hoje, só nas páginas lidas: `project-choice.tsx:57-61`. Na
  referência: Supabase `apps/studio/data/projects/org-projects-infinite-query.ts:79-82` (o texto na
  chave e no pedido); Dify `web/app/components/api-key/dataset-scope-dialog.tsx:177-186`; o dono que
  o Hub já tem para "a lista anterior fica enquanto o texto novo responde",
  `builder/assistant/queries.ts:28-30` (`withoutText`) e `:51-57` (`placeholderData`).
- **A busca de Projetos no Hub.** Na base, lidos em `ebfd4aa1`: o contrato
  `packages/hub-api/src/projects.ts:47-65` (`listProjects`, `query: Page`); a rota
  `apps/server/src/hub/projects/routes.ts:54-56`; a consulta `apps/server/src/hub/projects/projects.ts:290-320`
  (`list`: `where` com `companyId`, `deletingSince` e `after` por `(name, id)`, `limit(PAGE_SIZE + 1)`);
  `apps/server/src/platform/pages.ts:12-53` (`pageOf`, `pageKey`, `after`). O modelo de contrato
  com busca: `packages/hub-api/src/assistant.ts:216-220` (`Page.extend` com `q`, `trim`, `min(1)`,
  `max`), e o modelo de teste: `apps/server/src/builder/assistant/list-search.test.ts:45-51`. Na
  referência: Dify `api/services/knowledge/dataset_service.py:236-238` (o padrão escapado e o
  `ilike` com `escape`) e `:264` (a página na mesma consulta); `drizzle-orm` 1.0.0-rc.4
  `sql/expressions/conditions.d.ts:366` (`ilike(column, value)`, sem escape próprio: vale o `\`
  padrão do Postgres no `LIKE`).
- **O Combobox no modo de busca no servidor.** Base UI 1.9 `combobox.md:1176` (`items` são os
  conhecidos, `filteredItems` a janela que o servidor mandou), `:3377` (o escolhido fica em
  `items` enquanto chegam resultados), `:3406-3412`, `:3457` (`filter={null}`), `:3458-3462`
  (`onOpenChangeComplete`), `:3468-3479` (`onInputValueChange`, que ignora o `reason`
  `item-press`). O Supabase faz o mesmo com o cmdk: `OrganizationProjectSelector.tsx:225`
  (`shouldFilter={false}`) e `:111-112` (`search` na leitura, `keepPreviousData`).
- **A página de Agentes (705).** `builder/agents/loader.ts:27-33` e `:94-96` (`readOrGone`
  vira a recusa de `listAgents` em página inteira); `agent-list.tsx:123-125`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/projects.ts` (`listProjects`) | Muda: `query: Page` passa a `Page.extend({ q })`; a frase de `summary` diz a busca | `apps/server/src/hub/projects/routes.ts`, `apps/web/src/hub/projects/queries.ts`, `scripts/emit-openapi.ts` e `apps/server/src/openapi-contract.test.ts` (sem mudança de código) |
| `apps/server/src/hub/projects/routes.ts`, `apps/server/src/hub/projects/projects.ts` | Muda: a rota passa `query.q`; `list` recebe `q` e põe o nome no mesmo `where` | `ProjectStore` (`projects.ts:347`, o tipo vem de `createProjectStore`; nenhum outro chamador de `list`) |
| `apps/server/src/hub/projects/projects.test.ts` | Muda: um caso novo (critério 26) | `npm run test:server` |
| `apps/web/layout-harness.ts` | Muda: uma resposta pode ter a chave com o endereço inteiro (`GET /caminho?page=…&q=…`, o `url.search` como o navegador o manda, que o teste monta com `URLSearchParams`), que vale antes da chave só do caminho (`layout-harness.ts:161-169`); nenhum teste de hoje muda | todos os `*.layout.test.ts` |
| `apps/web/src/ui/picker.tsx`, `apps/web/src/ui/picker.test.tsx` | Cria; a peça importa `ui/combobox.tsx` e `ui/select.tsx` | `apps/web/src/hub/projects/project-picker.tsx`, `apps/web/src/builder/assistant/plus-menu.tsx` (só `SEARCH_FROM` e `matches`) |
| `apps/web/src/ui/showcase.ts` | Muda: a entrada do `Picker` | a vitrine |
| `apps/web/src/hub/projects/project-picker.tsx`, `apps/web/src/hub/projects/text.ts` | Cria | os 5 lugares, por `apps/web/src/hub/projects/public.ts` |
| `apps/web/src/hub/projects/queries.ts`, `apps/web/src/hub/projects/public.ts`, `apps/web/src/hub/projects/recent-projects.tsx`, `apps/web/src/hub/projects/project-rail.tsx` | Muda: `projectsPagedQuery` recebe o texto | o quadro do Projeto; os 4 chamadores de hoje de `projectsPagedQuery`, que passam a chamar `ProjectPicker` |
| `apps/web/src/builder/assistant/place-filter.tsx`, `apps/web/src/builder/assistant/project-choice.tsx`, `apps/web/src/builder/assistant/text.ts` | Muda; sai `MORE_PROJECTS`, `SEARCH_PROJECT` e `NO_PROJECT_MATCH` de `text.ts` | a lista de conversas; a caixa da conversa |
| `apps/web/src/builder/assistant/choice-list.tsx`, `apps/web/src/builder/assistant/plus-menu.tsx` | Muda: saem `SEARCH_FROM` e `matches`, que `plus-menu.tsx` passa a importar de `ui/picker.tsx`; ficam `ROW`, `LIST`, `Search`, `CHIP`, `WORDS` | `composer-tools.tsx`, `builder/assistant/public.ts` (sem mudança) |
| `apps/web/src/builder/agents/agent-list.tsx`, `apps/web/src/builder/agents/new-agent.tsx`, `apps/web/src/builder/agents/loader.ts`, `apps/web/src/builder/agents/text.ts` | Muda; sai `MORE_PROJECTS` de `text.ts` | a rota de Agentes do Início |
| `apps/web/src/builder/agents/agent-list.test.tsx`, `apps/web/src/builder/assistant/sidebar-search.test.tsx`, `apps/web/src/builder/assistant/home.test.tsx` | Muda: as asserções dos seletores passam dos papéis de menu (`menuitem`, `menuitemradio`, o botão **Mais Projetos** do popover) aos da lista (`combobox`, `option`); nenhum outro caso muda | `npm run test:unit` |
| `apps/web/project-picker.layout.test.ts`, `apps/web/package.json` | Cria o teste; muda a lista de `test:browser` | `npm run test:browser` |
| `apps/web/agents.layout.test.ts`, `apps/web/frame.layout.test.ts`, `apps/web/keyboard.test.ts` | Muda: casos novos | — |
| `DESIGN.md` | Muda: a linha do `Picker` em Components e a do Projeto folder | `tokens.test.ts` lê só os valores |

Fica como está: `hub/copies/apps-layer.tsx`, com o seu **Mais Projetos** (`hub/copies/text.ts:55`).
É uma lista, não uma escolha.

### Os contratos que a unidade cria

Em `packages/hub-api/src/projects.ts`, no modelo de `assistant.ts:216-220`:

```ts
/** O texto que a pessoa busca nos nomes dos Projetos: não maior que um nome. */
export const ProjectSearch = z.string().trim().normalize('NFC').min(1).max(PROJECT_NAME_MAX_LENGTH)

export const listProjects = defineOperation({
  // id, access, method, path, bodyLimit, success e failures como hoje
  summary:
    'Lists the Projects of a company the person belongs to, all of them or those whose name holds a text, without case, and whether its database exists.',
  input: { params: InCompany, query: Page.extend({ q: ProjectSearch.optional() }) },
})
```

Em `apps/server/src/hub/projects/projects.ts`, a consulta de hoje com uma condição a mais no mesmo
`and(...)`, antes do `after(...)`:

```ts
function list(
  deps: Deps,
  input: { person: Person; companyId: CompanyId; page: string | undefined; q: string | undefined },
)

/** O texto como letras de um `LIKE`: `\`, `%` e `_` valem como eles mesmos (o escape padrão do Postgres). */
function likeText(text: string): string

// no where: input.q === undefined ? undefined : ilike(project.name, `%${likeText(input.q)}%`)
```

A ficha da página continua o id da última linha (`pageOf`); a linha seguinte é a seguinte que bate,
porque o `after` e a busca estão no mesmo `where`. Uma ficha de outra busca não abre outra empresa:
o `after` já filtra por `companyId` (`projects.ts:310-314`), e o C44 não pede mais.

Em `apps/web/src/hub/projects/queries.ts`:

```ts
/** Os Projetos da empresa uma página por vez, todos ou os que batem com o texto (code C44). */
export function projectsPagedQuery(companyId: CompanyId, q: string | undefined)
// queryKey: [...hubQueryPrefix(listProjects, { companyId }), 'paged', { q }]
// placeholderData: a página da letra anterior da mesma empresa, como `builder/assistant/queries.ts:51-57`
```

Em `apps/web/src/ui/picker.tsx`, sem import de assunto:

```ts
/** A busca aparece a partir deste número de linhas, itens fixos incluídos (o fundador: "7 ou mais"). */
export const SEARCH_FROM = 7
export function matches(text: string, query: string): boolean

export type PickerItem<V extends string> = { value: V; label: string }
export type PickerGroup<V extends string> = { label: string | undefined; items: readonly PickerItem<V>[] }

export type PickerMore =
  | { kind: 'END' }
  | { kind: 'MORE'; loading: boolean; label: string; onMore: () => void }

export type PickerRead =
  | { kind: 'LOADING' }
  | { kind: 'READY' }
  | { kind: 'FAILED'; sentence: string }

/**
 * A busca de quem usa a peça: o texto volta por `onText`, e a peça mostra os grupos como vêm, sem
 * filtrar. Ao fechar, a peça chama `onText('')` (`onOpenChangeComplete`, `combobox.md:3458-3462`).
 */
export type PickerSearch = { text: string; onText: (text: string) => void }

export function Picker<V extends string>(props: {
  /** O nome da lista e do gatilho para o leitor de tela. */
  label: string
  /** O gatilho do lugar, dado ao `render` do `Combobox.Trigger`. */
  trigger: ReactElement
  groups: readonly PickerGroup<V>[]
  value: V | undefined
  /** O item escolhido, que fica nos `items` do Combobox mesmo fora da janela (`combobox.md:3377`, `:3406-3412`). */
  chosen: PickerItem<V> | undefined
  onPick: (value: V) => void
  more: PickerMore
  read: PickerRead
  /**
   * Com busca, o `Combobox` com o `Combobox.Input` no popup e `filter={null}`; sem, o `Select` do
   * Base UI com os mesmos grupos, porque um Combobox sem campo perde o que o leitor de tela ouve de
   * uma lista sem campo (`combobox.md:533`).
   */
  search: PickerSearch | undefined
  searchLabel: string
  noMatch: string
  /** O vazio do lugar, quando nenhum grupo tem item: uma frase e, se houver, uma ação. */
  empty: ReactElement
}): ReactElement
```

Em `apps/web/src/hub/projects/project-picker.tsx`:

```ts
export function ProjectPicker<Fixed extends string>(props: {
  companyId: CompanyId
  label: string
  trigger: ReactElement
  value: ProjectId | Fixed | undefined
  onPick: (value: ProjectId | Fixed) => void
  /** Os itens do lugar antes dos Projetos: Todas, Início, Sem Projeto, Todos os Projetos. */
  before: readonly PickerItem<Fixed>[]
  /** Os itens depois dos Projetos: Automações, Todos os projetos. */
  after: readonly PickerItem<Fixed>[]
  /** Com uma pessoa, o grupo Recentes no alto (a barra do Projeto); sem, nenhum. */
  recentFor: PersonId | undefined
  empty: ReactElement
}): ReactElement
```

`ProjectPicker` guarda o texto da busca (`useState`, vazio a cada abertura) e lê
`useInfiniteQuery(projectsPagedQuery(companyId, texto || undefined))`. O texto vai inteiro ao Hub,
que tira os espaços das pontas; um texto só de espaços não vai (o `trim` do contrato o recusaria).
Os itens fixos e os recentes filtram com `matches`, no navegador, porque não vêm do Hub. Um
Projeto que está nos Recentes não se repete no grupo dos Projetos (um id por lista,
`combobox.md:1174-1178`). O campo de busca depende só da leitura sem texto,
`projectsPagedQuery(companyId, undefined)`, que a `ProjectPicker` lê ao montar, como
`project-choice.tsx:57` já faz, e que fica no cache enquanto a pessoa busca: o campo aparece quando
ela, mais os itens fixos, tem `SEARCH_FROM` linhas ou mais, ou quando tem mais página. Com texto, a
lista mostra a leitura do texto, e o campo fica. Se a leitura sem texto chega com o popup já aberto,
o modo vale na abertura seguinte. O `chosen` é o item do valor: das páginas lidas ou, fora delas, o
nome lido por `projectQuery`.

E em `apps/web/src/hub/projects/recent-projects.tsx`, no lugar do `useRecentProjects` de hoje:

```ts
/** Até 5 ids lembrados neste navegador, cada um com o nome das páginas lidas ou de `projectQuery`; um `NOT_FOUND` sai. */
export function useRecentProjects(companyId: CompanyId, personId: PersonId, loaded: readonly ProjectSummary[]):
  readonly { id: ProjectId; name: string }[]
```

- **Cada estado** como união: `PickerMore` por `kind` (`END`, `MORE`), `PickerRead` por `kind`
  (`LOADING`, `READY`, `FAILED`) (C21, C22).
- **Cada id**: `ProjectId`, `CompanyId` e `PersonId`, marcas de `@conexus/hub-api`, conferidas pelo
  Zod do contrato na leitura (C23). O valor escolhido chega tipado do próprio item: não há parse no
  `onPick`.
- **O dono de cada fato** (C26): `SEARCH_FROM` e `matches` em `ui/picker.tsx`; **Mais Projetos**,
  **Buscar Projeto** e **Nenhum Projeto com esse nome.** em `hub/projects/text.ts`, com os valores
  de hoje (saem as cópias de `builder/assistant/text.ts:35,36,41` e `builder/agents/text.ts:27`);
  o nome do Projeto do endereço fora das páginas, lido por `projectQuery` dentro de `ProjectPicker`
  (sai o `NamedFilter`); o nome de um recente fora das páginas, lido em `useRecentProjects`.
- **Esquema Zod**: a única entrada nova é `ProjectSearch`, no contrato, que o Hub confere na borda
  (`trim`, `normalize('NFC')`, de 1 a 100 caracteres); o servidor confia no tipo dali para dentro
  (C27). As leituras do front usam `listProjects` e `getProject`.
- **O arquivo modelo**: `hub/projects/queries.ts`, para a leitura (cumpre C26: uma função por
  leitura; C21 e C23 não se aplicam); `builder/assistant/queries.ts:28-57`, para o texto na chave e
  a lista anterior na tela; `packages/hub-api/src/assistant.ts:216-220`, para o parâmetro de busca.
  Para a peça, nenhum.

### As skills e a leitura

pstack `poteto-mode` primeiro, com `architect` para os tipos desta seção antes do código (a
palavra do fundador na decisão B); `pstack:typescript-best-practices`; `shadcn`
(`rules/composition.md`, `rules/base-vs-radix.md`: o `render` do Base UI);
`node_modules/@base-ui/react/docs/react/components/combobox.md`, seções "Async search (single)"
e "Displaying a window of async results"; `router-core` (em
`node_modules/@tanstack/router-core/skills/`), para o `navigate`, o `Link` e o carregador;
`tanstack.com/query/latest/llms.txt`, seções de consultas infinitas, `placeholderData` e
cancelamento; `fastify-best-practices`, para a rota; `orm.drizzle.team/llms.txt`, seção de
operadores (`ilike`); `zod.dev/llms.txt`. O guia além do de código é o `web`; a parte do servidor
segue o guia `data` só na consulta (o `where` e a ordem).

### A ordem do trabalho

1. **A busca no Hub.** Critério: 26.
   - **Arquivos:** muda `packages/hub-api/src/projects.ts`, `apps/server/src/hub/projects/routes.ts`,
     `apps/server/src/hub/projects/projects.ts`, `apps/server/src/hub/projects/projects.test.ts`.
   - **Referência a seguir:** Dify `dataset_service.py:236-238` (o texto escapado antes do `ilike`)
     e `:264` (a página na mesma consulta); `assistant.ts:216-220` (o parâmetro);
     `list-search.test.ts:45-51` (o teste da busca e do texto longo).
   - **O que entra:** `ProjectSearch` e o `q` do contrato; a rota passa `query.q`; `likeText` e o
     `ilike` no `and(...)` de `list`, sem índice novo (a consulta já lê só a empresa, por nome).
     Regras: C44 (o filtro é declarado no contrato), C27.
   - **Testes:** o caso do critério 26, com 60 Projetos: `q` de uma letra em maiúscula, a segunda
     página da mesma busca pelo `next`, `50%` contra `500` e `5_0` contra `500`, o texto com
     espaços nas pontas, 101 caracteres, outra empresa. Os nomes com `%` e `_` (por exemplo "Meta
     50% vendas" e "Lote 5_0 norte") passam primeiro pelo `createProject`, que deriva o endereço do
     nome; se ele os recusar, o caso usa outros nomes com os mesmos sinais, e o builder anota.
     O caso grava o `lc_ctype` do banco do teste no relatório.
   - **Mutações à mão:** tirar `likeText` → o caso de `50%` falha; trocar `ilike` por `like` → o
     caso da maiúscula falha; tirar o `q` do `where` → o caso dos 60 falha.
2. **O `Picker`, sozinho, com a entrada na vitrine.** Critérios: 10, 11, 12, 17.
   - **Arquivos:** cria `ui/picker.tsx`, `ui/picker.test.tsx`; muda `ui/showcase.ts`,
     `choice-list.tsx`, `plus-menu.tsx` (o import de `SEARCH_FROM` e `matches`).
   - **Referência a seguir:** `combobox.md:1873` (o `Combobox.Input` dentro do `Combobox.Popup`, o
     gatilho como controle); `:2777` (`Combobox.Group`, `Combobox.GroupLabel`); `:3457`
     (`filter={null}`), `:3458-3462` e `:3468-3479` (o texto pelo `onInputValueChange`, sem o
     `reason` `item-press`; a busca vazia ao fechar).
   - **O que entra:** o popup de 288 px (`DESIGN.md`, Projeto folder), a busca a partir de
     `SEARCH_FROM` linhas, as linhas `list-row` de 32 e 44 px (V58), a linha **Mais Projetos**
     desligada enquanto `loading`. Regras: V28 (foco), V57 (o escolhido em `accent-text`), W22.
   - **Testes:** `ui/picker.test.tsx`: com `search`, o campo aparece; o que se digita sai por
     `onText` e a peça mostra os grupos como vieram, sem filtrar; o `chosen` fora dos grupos segue
     com o sinal de escolhido; vazio com texto dá `noMatch`; fechar chama `onText('')`; sem
     `search`, a peça é o `Select`, com os papéis dele; teclado nos dois modos. `matches` continua de `ui/picker.tsx`, para os itens fixos da
     `ProjectPicker` e a lista de ligações de `plus-menu.tsx`, que filtra igual a hoje.
   - **Mutações à mão:** tirar o `filter={null}` → o caso "mostra os grupos como vieram" falha;
     tirar o `onText('')` do fechamento → o caso da busca reaberta falha;
     tirar o `disabled` de **Mais Projetos** → o segundo clique pede outra página e o caso falha.
   - **Pronto quando:** a peça aparece na vitrine com vazio, carregando, erro e cheia.
3. **A `ProjectPicker` e as leituras.** Critérios: 9, 10, 13, 14, 16.
   - **Arquivos:** cria `hub/projects/project-picker.tsx`, `hub/projects/text.ts`; muda
     `queries.ts`, `recent-projects.tsx`, `public.ts`, `apps/web/layout-harness.ts` (a chave com a
     busca).
   - **O que entra:** `projectsPagedQuery(companyId, q)` com o texto na chave e o `placeholderData`
     da mesma empresa; o texto, `SEARCH_FROM` e `matches` dos itens fixos, como a seção dos contratos
     diz; os recentes com `useQueries` de `projectQuery` para os ids fora das páginas, no máximo 5; o
     nome do valor fora delas por `projectQuery`. Regras: W10, W11, C44.
   - **Testes:** `project-picker.layout.test.ts` com duas páginas no harness (50 e 10), com a
     segunda em falha, e com a resposta de `?q=` que traz o 58º; o caso confere o `q` que o
     navegador pediu (o `search` que o harness guarda); o caso novo de `frame.layout.test.ts`.
   - **Mutações à mão:** `getNextPageParam` devolvendo `undefined` → o caso dos 60 falha; tirar o
     texto da chave → o caso do 58º falha; tirar o filtro de `NOT_FOUND` dos recentes → o caso do
     Projeto apagado falha.
4. **Os cinco lugares.** Critérios: 9, 13, 14, 15, 17; o roteiro de uso 1 a 5.
   - **O que sai:** de `place-filter.tsx`, o `DropdownMenuRadioGroup` e o `projectsQuery` (o
     `PlaceLabel` continua, e lê o nome do Projeto por `projectQuery`); de `project-choice.tsx`, o
     `Popover`, o `ProjectRow` e a busca à mão; de `agent-list.tsx`, o `FilterBox`, o `NamedFilter`,
     o item `MORE`; de `new-agent.tsx`, o `DropdownMenu`; de `project-rail.tsx`, o menu de
     `SidebarSelector` (o gatilho fica).
   - **O que entra:** cada lugar passa o seu gatilho, os seus itens fixos e o seu `onPick`. O
     **Novo agente** vazio ganha **Criar um Projeto** (`Link` para `/companies/$companyId/projects`),
     que fecha a issue 708.
   - **Testes:** os casos novos de `agent-list.test.tsx`, `keyboard.test.ts`; os casos de
     `agent-list.test.tsx`, `sidebar-search.test.tsx` e `home.test.tsx` que tocam os seletores mudam
     só os papéis que procuram (o raio diz quais).
   - **Mutações à mão:** trocar o `onPick` do filtro de Agentes por um que não navega → o caso do
     filtro falha.
5. **A página de Agentes com erro.** Critério: 18 (issue 705).
   - **Arquivos:** `builder/agents/loader.ts`, `agent-list.tsx`.
   - **O que entra:** uma falha de `listAgents` que não é `NOT_FOUND` fica na área da lista,
     embaixo do título, do filtro e de **Novo agente**. O `NOT_FOUND` continua "não encontrado" de
     página inteira (`loader.ts:95`, security S10).
   - **Testes:** os dois casos novos de `agents.layout.test.ts`.
   - **Mutações à mão:** devolver o `readOrGone` de página inteira → o caso de 705 falha.
   - **Pronto quando:** o roteiro de uso 1 a 6 roda no Hub local com 60 Projetos de teste.
6. **A linha do `DESIGN.md`.** O `Picker` em Components, ao lado do Combobox; a linha "Projeto
   folder" passa a dizer que o menu é o `Picker`.

### Como se prova

A busca no Hub se prova no Postgres real, pela porta da rota (`projects.test.ts`, critério 26). Os
casos de layout usam o harness com as respostas de `listProjects` em duas páginas e com `?q=`, e as
de `getProject` e `listAgents`; nenhum toca o servidor. Hoje, com 60 Projetos, o filtro de conversas e
os recentes da barra mostram só os 50 primeiros (lido em `place-filter.tsx:46` e
`recent-projects.tsx:27`), a busca da pasta procura só nas páginas lidas (`project-choice.tsx:61`),
e qualquer falha de `listAgents` apaga a página inteira (`loader.ts:94-96`).

### Parar se

- O Combobox do Base UI 1.9 não aceita o gatilho de um lugar no `render` (a `SidebarMenuButton`
  da barra, o botão primário de **Novo agente**): anote qual e pergunte, sem escrever um popup à mão.
- Um caso de teste fora dos que o raio nomeia precisa mudar uma asserção para passar.
- Um lugar pede um comportamento que o contrato não tem (por exemplo, escolher vários).
- O `ILIKE` do Postgres do Hub não iguala maiúscula e minúscula acentuadas (`ÇÃO` e `ção`) no caso
  do critério 26: anote a ordenação do banco e pergunte, sem trocar por `lower()` à mão. Passar no
  Postgres do teste não prova o banco da nuvem, cuja ordenação esta etapa não lê (nenhuma chamada
  ao Neon): o relatório diz "não provado na nuvem" e o roteiro de uso 1, com um nome acentuado,
  é a prova.
- O `Select` do Base UI não aceita os mesmos grupos, o gatilho no `render` ou a linha **Mais
  Projetos**: anote o que falta e pergunte, sem escrever um popup à mão.
- A ficha de página de uma busca traz, no Postgres real, uma linha que não bate ou pula uma que bate.

## U4 As peças compostas

**Base e modelo.** A cabeça de U3. Sonnet: peças copiadas do shadcn e trocas mecânicas.

### As linhas da tabela

- **Separador, carregando.** `npx shadcn@latest add separator spinner -c apps/web --dry-run`, depois
  `add`, com o `components.json` de U1; skill `shadcn` `rules/composition.md` ("Use `Separator`",
  "Button has no `isPending`/`isLoading`. Compose with `Spinner`").
- **Busca.** `builder/assistant/choice-list.tsx` (o `Search`, que a lista de ligações de
  `plus-menu.tsx` usa e que sai daqui para `ui/search-field.tsx`); os campos com `SearchIcon` em `builder/assistant/sidebar-conversations.tsx`,
  `builder/model-accounts/model-picker.tsx`, `hub/copies/data-tree.tsx`, e os outros fora de `ui/` que `grep -rln SearchIcon apps/web/src` listar.
- **Cabeçalho de página.** Os oito arquivos da tabela de referência.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/ui/separator.tsx`, `apps/web/src/ui/spinner.tsx`, `apps/web/src/ui/search-field.tsx`, `apps/web/src/ui/page-header.tsx`, `apps/web/src/ui/states.test.tsx` | Cria as peças; o teste do `Spinner` junta-se ao das outras peças de estado | os assuntos |
| `apps/web/src/ui/showcase.ts` | Muda: as quatro entradas | a vitrine |
| `apps/web/src/builder/`, `apps/web/src/hub/` | Muda: os arquivos com as cópias (a lista que o passo 1 grava no relatório); `builder/assistant/choice-list.tsx` perde o `Search` | — |
| `apps/web/package.json` | Muda: o número da catraca | `npm run lint` |
| `DESIGN.md` | Muda: as quatro linhas em Components | — |

### Os contratos que a unidade cria

```ts
// ui/separator.tsx: a base-nova do shadcn sobre o Separator do Base UI, com a cor `line`.
export function Separator(props: { orientation?: 'horizontal' | 'vertical'; className?: string }): ReactElement
// ui/spinner.tsx: o Loader2 do lucide com `motion-safe:animate-spin` e `role="status"`.
export function Spinner(props: { label: string }): ReactElement
// ui/search-field.tsx: InputGroup com a lupa e um input `type="search"`.
export function SearchField(props: { label: string; value: string; onChange: (query: string) => void }): ReactElement
// ui/page-header.tsx: o título da página (`PageTitle`) e as ações à direita, que quebram embaixo.
export function PageHeader(props: { title: string; actions: ReactNode }): ReactElement
```

- **O dono de cada fato**: o espaço do cabeçalho (`gap-md`, `justify-between`, `flex-wrap`) só em
  `page-header.tsx`; a lupa da busca só em `search-field.tsx` (C26).
- **O arquivo modelo**: nenhum para estado ou id (as peças não têm); para a forma de uma cópia do
  shadcn, o cabeçalho de `ui/combobox.tsx`, que diz de onde veio e o que mudou.

### As skills e a leitura

`shadcn` (`rules/composition.md`, `rules/forms.md`, `rules/icons.md`); o `DESIGN.md`, Components.

### A ordem do trabalho

1. **Listar as cópias.** Critério: 19. Rodar o lint e os `grep` (`border-t`, `border-b`,
   `animate-spin`, `SearchIcon`, o `justify-between gap-md` do cabeçalho) fora de `ui/` e gravar a
   lista no relatório, com a decisão por linha: é separador ou é borda de região (uma borda de
   região fica).
2. **As quatro peças, com a entrada na vitrine.** Critério: 19.
   - **Testes:** `ui/states.test.tsx`, caso novo: o `Spinner` tem `role="status"` e o nome dado.
   - **Mutações à mão:** tirar o `role="status"` do `Spinner` → esse caso falha.
3. **As trocas, uma peça por vez.** Critérios: 19, 20.
   - **O que sai:** cada cópia da lista.
   - **Testes:** os testes de layout e as varreduras existentes, sem mudar.
   - **Pronto quando:** as capturas antes e depois, das telas trocadas, a 1366 e 390, são iguais à
     vista; o número da catraca caiu.

### Como se prova

As capturas antes e depois vão no relatório, lado a lado. Os testes existentes passam sem mudar.
Hoje a busca tem 4 formas e o lint aponta cada restilo.

### Parar se

- Uma troca muda o que a tela mostra (altura, cor, espaço) e a peça não tem variante para o que a
  tela fazia: anote a tela e a diferença e pergunte; não crie variante sem desenho.
- A lista do passo 1 passa de 60 trocas: a unidade cresce além do orçamento.

## G2 O ponto de conferência

`npm run check`; `npm run test:browser` e `npm run test:sweep` do `apps/web`; o roteiro de uso 1 a
6 no Hub local com 60 Projetos de teste; as capturas da vitrine e dos 5 lugares a 1366 e 390, nos
dois temas, no relatório; `npm run lint` com o número novo da catraca.

## U5 As peças de IA

**Base e modelo.** A cabeça de G2 em `main`. Opus: separar o desenho da leitura do stream sem
mudar o que a conversa faz.

### As linhas da tabela

- **Peças de IA (apresentação).** Na base, em `builder/conversation/`: `tool-row.tsx` (376),
  `tool-group.tsx` (93), `thinking-line.tsx` (61), `working-line.tsx` (62), `plan-card.tsx` (146),
  `task-panel.tsx` (104), `approval-card.tsx` (247), `question-card.tsx` (222), `sources.tsx` (122).
  Na referência: shadcn `apps/v4/content/docs/ai-elements/base/` (`tool`, `reasoning`, `plan`,
  `task`, `confirmation`, `sources`, `subagent.mdx`: "Subagent is built with `Trace` with a
  `TraceCollapsible` for the run"); Mastra `packages/playground-ui/src/ds/components/ai/` e
  `domains/chat/` (`mastra@d60ba71`, a tag `@mastra/core@1.83.0`), onde a peça recebe dados prontos e a ligação mora no assunto.
  A skill `shadcn` `rules/chat.md` ("Assistant activity uses `Trace`").

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/ui/ai/` | Cria: `tool-line.tsx`, `tool-group.tsx`, `reasoning-line.tsx`, `working-line.tsx`, `plan.tsx`, `task-list.tsx`, `approval.tsx`, `question.tsx`, `sources.tsx` | `builder/conversation/` |
| `apps/web/src/builder/conversation/` | Muda: os nove arquivos ficam só com a ligação (do evento à forma da peça) e as ações | o resto da conversa |
| `apps/web/src/ui/showcase.ts`, `apps/web/src/ui/showcase/` | Muda: o grupo IA, num arquivo `showcase/ai.tsx`; em `showcase/types.ts`, o rótulo de um estado aceita também `Tipo.KIND` (`` `${string}.${Uppercase<string>}` ``), ao lado de `PreviewState` | a vitrine, `ui/ai/pieces.test.ts` |
| `apps/web/src/ui/ai/pieces.test.ts` | Cria: os casos dos critérios 21 (frase própria) e 23 (cada membro de cada união) | `npm run test` do `apps/web` |
| `.dependency-cruiser.cjs` | Muda: a regra nova `ui-ai-takes-ready-data`, que recusa `@conexus/hub-api` em `ui/ai/`. A fonte é o critério 21 deste cartão, não o W5: o W5 (`docs/guides/web.md:39`) fala de assunto e rota, e `ui/` já importa `@conexus/hub-api` em `pager.tsx`, `form.tsx`, `states.tsx` e `settings-index.tsx`; `web-support-does-not-import-subject` (W5) já cobre `builder/` e `hub/` na subpasta, porque casa `ui/` e o que está abaixo (`.dependency-cruiser.cjs:281-286`), e `mastra-only-in-builder` (W7) já recusa `@mastra/*` fora de `builder/` (`:209-215`) | `npm run deps` |
| `DESIGN.md` | Muda: as linhas das peças de IA | — |

### Os contratos que a unidade cria

Emenda de 2026-11-17 (a decisão 13 do firstmate): o construtor leu os nove arquivos antes de mover
código, e nenhum dos nove contratos da primeira versão cabia no que o arquivo desenha (o ícone e o
relógio da linha de ferramenta, a falha do grupo, o Markdown do raciocínio, a espera da linha de
trabalho, o erro e os estados a mais dos três cartões, os dois tipos de fonte, e as frases fixas
de cada arquivo). Os contratos abaixo foram reescritos a partir de `main` `da21543c`, linha a linha
dos nove arquivos, na forma das peças do Mastra 1.83 (`mastra@d60ba71`, a tag `@mastra/core@1.83.0`,
`packages/playground-ui/src/ds/components/ai/`): a peça recebe dados prontos e, onde o desenho é
do assunto, um `ReactNode` já desenhado, como o `children` de `ToolApproval`
(`tool-approval/tool-approval.tsx:77-82`), o `leading` de `ToolCallGroup`
(`tool-call/tool-call-group.tsx:31-36`) e o `footer` de `AskUser` (`ask-user/ask-user-card.tsx:16-23`).

Cada peça recebe uma forma de apresentação, sem tipo do Mastra nem do Hub. Cada frase que a peça
mostra chega por prop: um `text` com as frases fixas e, no estado, as frases que a ligação compõe
(com o nome do agente, uma contagem, um tempo).

```ts
// ui/ai/tool-line.tsx, de tool-row.tsx (Since 49-57, ToolLine 316-349, ToolRow 355-376)
export type ToolLineState = { kind: 'RUNNING' } | { kind: 'DONE' } | { kind: 'FAILED' }
/** Ao lado da frase: o detalhe da chamada, cortado, ou, enquanto roda sem detalhe, o relógio que a ligação desenha. */
export type ToolLineBeside =
  | { kind: 'DETAIL'; text: string }
  | { kind: 'CLOCK'; clock: ReactNode }
  | { kind: 'NONE' }
export function ToolLine(props: {
  icon: LucideIcon
  sentence: string
  state: ToolLineState
  beside: ToolLineBeside
  /** O corpo que abre a linha, já desenhado pela ligação; `undefined` é a linha que não abre. */
  body: ReactNode | undefined
}): ReactElement

// ui/ai/tool-group.tsx, de tool-group.tsx (24-93)
export type ToolGroupState =
  | { kind: 'WORKING'; icon: LucideIcon; sentence: string; progress: string }
  | { kind: 'DONE'; failed: boolean; short: string; full: string; icons: readonly LucideIcon[]; tally: string }
export function ToolGroup(props: { state: ToolGroupState; children: ReactNode }): ReactElement

// ui/ai/reasoning-line.tsx, de thinking-line.tsx (27-61)
export type ReasoningState =
  | { kind: 'THINKING' }
  /** `body` é o raciocínio já desenhado em Markdown pela ligação; `undefined` quando veio vazio, e a linha não abre. */
  | { kind: 'DONE'; body: ReactNode | undefined }
export function ReasoningLine(props: { label: string; state: ReasoningState }): ReactElement

// ui/ai/working-line.tsx, de working-line.tsx (26-62; o relógio, o minuto quieto e as frases ficam na ligação).
// Mastra: as palavras saem prontas do domínio (`domains/chat/activity/model/activity-words.ts:55-62`, `liveWords`)
// e a linha só as desenha, com o tempo já medido (`domains/chat/activity/activity-stretch-line.tsx:10-15`, `elapsedMs`).
// WAITING não tem par no Mastra: é a decisão do fundador de 2026-10-22, "Aprovo" (`working-line.tsx:7`).
// É a única linha de espera, nas duas telas (o fundador, 2026-11-17, "Aprovo"): no computador, no fim da
// conversa, como hoje (`chat.tsx:200-204`); no celular, no alto do cartão aberto, onde o aviso
// `WaitingCaption` está hoje (`question-card.tsx:50-59`), que deixa de existir. A ligação decide o lugar e
// a frase: a do celular continua sem ponto final, como hoje, porque cada teste confere a sua.
export type WorkingState =
  /** `since` é o tempo já escrito, com o separador (" · há 12 s", ou " há 1 min" no minuto quieto); `undefined` sem contagem. */
  | { kind: 'WORKING'; sentence: string; since: string | undefined }
  | { kind: 'WAITING'; sentence: string }
export function WorkingLine(props: { state: WorkingState }): ReactElement

// ui/ai/plan.tsx, de plan-card.tsx (108-146; `useAnswer` e o envio de `useDecision`, 86-100, ficam na ligação).
// O rascunho segue o `AskUser` do Mastra, que o guarda na peça (`ds/components/ai/ask-user/ask-user-root.tsx:53-55`),
// e não o `Plan`, cujas ações moram na ligação (`domains/chat/tools/submit-plan-tool.tsx:163-164`): o campo da razão
// e o "Pedir ajustes" que primeiro o abre são desenho, e as duas respostas aparecem no cartão e no diálogo.
export type PlanState =
  /** A peça guarda o campo da razão e qual botão foi apertado; a ligação diz se envia e o erro. */
  | { kind: 'OPEN'; waiting: ReactNode | undefined; busy: boolean; error: string | undefined; onApprove: () => void; onReject: (reason: string) => void }
  | { kind: 'APPROVED' }
  | { kind: 'REJECTED' }
  | { kind: 'CLOSED' }
export type PlanText = {
  readAll: string; reasonLabel: string; approve: string; reject: string; sending: string
  approved: string; rejected: string; closed: string
}
export function Plan(props: { title: string; body: ReactNode; state: PlanState; text: PlanText }): ReactElement

// ui/ai/task-list.tsx, de task-panel.tsx (OpenTasks 35-103; quando o painel some fica na ligação, `TaskPanel` 24-29)
/** `text` é o `activeForm` da tarefa em andamento, quando ela tem, e o conteúdo nas outras. */
export type TaskView = { id: string; text: string; status: 'PENDING' | 'IN_PROGRESS' | 'DONE' }
export type TaskListText = { region: string; heading: string; done: string; running: string; pending: string }
export function TaskList(props: { tasks: readonly TaskView[]; text: TaskListText }): ReactElement

// ui/ai/approval.tsx, de approval-card.tsx (189-247; `useReply`, a releitura das escritas e `failureText` ficam na ligação)
export type ApprovalField = { label: string; lines: readonly string[] }
/** O que a escrita fez, como a peça mostra: uma nota, ou a recusa com o seu aviso. */
export type ApprovalOutcome =
  | { kind: 'NOTE'; text: string }
  | { kind: 'REFUSAL'; alert: string; text: string | undefined }
export type ApprovalState =
  | {
      kind: 'OPEN'
      waiting: ReactNode | undefined
      /** Os botões respondem só enquanto a sessão segura a chamada e a leitura das escritas abertas respondeu. */
      lit: boolean
      sending: 'APPROVE' | 'DECLINE' | undefined
      error: string | undefined
      /** A leitura das escritas abertas falhou: a frase e o **Tentar de novo**. */
      readFailure: { text: string; onRetry: () => void } | undefined
      /** Outra escrita igual ainda aberta: a frase do aviso. */
      openWrite: string | undefined
      onApprove: () => void
      onDecline: () => void
    }
  /** `byYou`: o registro guarda o **Aprovar** da pessoa, e o cartão diz "Aprovado por você". */
  | { kind: 'APPROVED'; byYou: boolean; outcome: ApprovalOutcome | undefined }
  | { kind: 'DECLINED'; outcome: ApprovalOutcome | undefined }
  | { kind: 'INTERRUPTED'; outcome: ApprovalOutcome | undefined }
  | { kind: 'STOPPED'; outcome: ApprovalOutcome | undefined }
export type ApprovalText = {
  approve: string; decline: string; approving: string; declining: string
  approved: string; declined: string; interrupted: string; stopped: string; steer: string
}
export function Approval(props: {
  title: string
  /** A conexão já com o separador (" · Vendas"), depois do título; `undefined` quando a escrita não é conhecida. */
  connection: string | undefined
  /** O logo da conexão, desenhado pela ligação (`ConnectorLogo` é de `hub/`). */
  logo: ReactNode | undefined
  fields: readonly ApprovalField[]
  state: ApprovalState
  text: ApprovalText
}): ReactElement

// ui/ai/question.tsx, de question-card.tsx (Ask 109-146, QuestionCard 162-222; `useAnswer` fica na ligação).
// A peça lê o próprio formulário (`answersOf`, 99-107, entra nela, e o nome de cada campo é dela) e entrega
// a resposta tipada, como o `AskUser` do Mastra (`ask-user/ask-user-card.tsx:21`, `ask-user-types.ts:2`).
/** Uma resposta por pergunta: as escolhas de uma múltipla, ou a única dada (`''` quando nenhuma). */
export type QuestionAnswer = string | readonly string[]
export type QuestionView = {
  id: string
  text: string
  multiple: boolean
  choices: readonly { value: string; label: string; hint: string | undefined }[]
}
export type QuestionState =
  | { kind: 'OPEN'; waiting: ReactNode | undefined; busy: boolean; onSubmit: (answers: readonly QuestionAnswer[]) => void }
  /** `row` é a linha recolhida ("Respondeu 2 perguntas"); `answers`, uma por pergunta, quando a conversa as guarda. */
  | { kind: 'ANSWERED'; row: string; answers: readonly string[] | undefined }
  /** Fechada ou parada: `said` é a frase de por quê, quando há. */
  | { kind: 'CLOSED'; row: string; said: string | undefined }
export type QuestionText = {
  previous: string; next: string; submit: string; sending: string
  other: string; otherLabel: string; answerLabel: string; answerPlaceholder: string; required: string
}
export function Question(props: {
  questions: readonly QuestionView[]
  state: QuestionState
  /** O erro do envio, que aparece em qualquer estado, como hoje. */
  error: string | undefined
  text: QuestionText
}): ReactElement

// ui/ai/sources.tsx, de sources.tsx (DataLine 57-84, Sources 87-122; `stampOf`, `nameOf` e o crachá ficam na ligação).
// Fica a forma de hoje, uma `section` com título e lista, e não a receita do shadcn, em que as fontes são um
// `TraceCollapsible` com um `Trace` (`rules/chat.md`): o critério 22 manda a conversa se comportar como antes
// (o fundador, 2026-11-17, "a"). A fonte de tabela não tem par em nenhuma referência: é do Conexus.
export type SourceView =
  /** `href` só quando a página tem link. */
  | { kind: 'PAGE'; key: string; title: string; href: string | undefined; domain: string }
  | {
      kind: 'TABLE'
      key: string
      name: string
      /** O logo e o crachá de autorizar de novo, desenhados pela ligação (`ConnectorLogo` e `stateBadge` são de `hub/`). */
      logo: ReactNode | undefined
      badge: ReactNode | undefined
      table: string
      stamp: { tone: 'neutral' | 'success' | 'warning' | 'danger'; text: string }
    }
export function Sources(props: { label: string; sources: readonly SourceView[] }): ReactElement
```

- **Cada estado** como união por `kind` (C21, C22). O `TaskView.status` traduz o estado do contrato
  do Hub na ligação; o `ApprovalState` traduz o `Decision` e o `Outcome` de `approval-item.ts`; a
  peça não conhece nenhum dos dois.
- **Cada id**: nenhum id de marca entra em `ui/ai/`; `id` e `key` são só chaves de lista (C23 fica
  na ligação, que recebe `ToolCallId` e os outros).
- **O dono de cada fato**: a frase de cada estado continua onde está hoje, em
  `builder/conversation/` (`text.ts`, `approval-text.ts`, `CARD_TEXT` e as frases de cada
  arquivo); a peça não tem texto próprio (C26, delivery L23). O que fica desenhado na
  ligação, e não na peça: o corpo de cada ferramenta (`tool-bodies.tsx`, `Block`, `Change`,
  `Reconnect`), as linhas especiais (`ShownLine`, `AgentLine`, os cartões de proposta), o
  Markdown (`markdown.tsx`), o logo e o crachá da conexão, e o relógio (`elapsed.ts`).
- **A espera no cartão aberto**: o `waiting` de `Plan`, `Approval` e `Question` é a `WorkingLine` no
  estado `WAITING`, que a ligação passa só no celular e a peça desenha no alto do cartão; no computador
  é `undefined`. No celular, a linha de espera passa a ter a cor e o espaço da `WorkingLine`, e não
  o acento do aviso de hoje: é a mudança que "uma peça só" traz.
- **O separador**: um `·` entre duas partes de uma frase chega sempre da ligação, dentro do texto
  (`WorkingState.since`, `Approval.connection`); a peça não escreve separador.
- **O arquivo modelo**: `ui/trace.tsx` para a forma da peça de chat copiada do shadcn; cumpre C26
  (o cabeçalho diz a origem); C21 e C23 não se aplicam, porque não tem estado nem id.

Uma forma que a leitura do arquivo contradiz (um estado a mais, uma ação que a peça precisa) é
caso de parar, não de ajuste.

### As skills e a leitura

`shadcn` (`rules/chat.md`); `mastra` (só para ler os eventos que a ligação traduz, sem mudar a
ligação); a linha de `@mastra/client-js` em `stack.md`.

### A ordem do trabalho

1. **As formas.** Critério: 21. Para cada arquivo, separar o que desenha do que lê o evento, e
   conferir a forma da peça contra a do contrato acima.
2. **Uma peça por vez: mover, ligar, entrar na vitrine.** Critérios: 21, 22, 23.
   - **O que sai:** o desenho de cada arquivo de `builder/conversation/`, que passa a chamar a peça.
   - **Testes:** os do critério 22, sem mudar; `ui/ai/pieces.test.ts` (critérios 21 e 23); a
     entrada da vitrine com cada membro de cada união.
   - **Mutações à mão:** trocar `FAILED` por `DONE` na ligação da linha de ferramenta →
     `tool-row.test.tsx` falha (Critério 8).
   - **Pronto quando:** cada arquivo de `builder/conversation/` desses nove só traduz e passa props.

### Como se prova

Os testes da conversa passam sem mudar nenhuma asserção, e a vitrine mostra cada estado. Hoje uma
peça de IA só se vê numa conversa com stream.

### Parar se

- Um teste da conversa só passa com uma asserção mudada.
- Uma peça precisa de um estado, de uma frase ou de um `ReactNode` que o contrato emendado não
  tem: pare de novo e mostre a linha do arquivo; o contrato não se amplia no build.
- Uma peça precisa do evento cru do Mastra para desenhar: a fronteira está no lugar errado;
  pergunte.
- Um arquivo movido muda mais de um terço das suas linhas: escreva a peça de novo pela receita do
  shadcn, e diga no relatório.

## G3 O ponto de conferência

`npm run check`; `npm run test:browser` e `npm run test:sweep` do `apps/web`; a vitrine aberta nos
dois temas; as capturas da conversa antes e depois.

## U6 A regra "peça antes de tela"

**Base e modelo.** O pull request de fechamento (delivery L19), só de documentos, depois do uso
(L17), com G3 em `main`. Ele apaga este cartão e leva a linha de uso ao arquivo de aprovação. Opus:
texto do método, que muda o que os próximos agentes fazem.

### As linhas da tabela

- **A regra no método.** Na base: `.agents/skills/conexus-build/SKILL.md` (passo 2a),
  `.agents/skills/conexus-review/SKILL.md`, `.agents/skills/conexus-scope/SKILL.md` (passo 5), o
  modelo do cartão `.agents/skills/conexus-scope/references/card.md` e o de tela
  `references/screens.md`, o cartão da trilha Dados `references/pattern-card.md` (delivery L27),
  `.agents/skills/conexus-qa/SKILL.md`; `docs/guides/design.md`, Components (V23), Colors (V3), o
  espaço (V16), o raio (V22). Na referência: Supabase `AGENTS.md:51`, `apps/studio/AGENTS.md:42`;
  Dify `packages/dify-ui/AGENTS.md:12-13`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/guides/design.md` | Muda: a regra nova; as marcas de V3, V16, V22 | todas as skills |
| `.agents/skills/conexus-build/SKILL.md` | Muda: um passo antes de escrever uma tela | quem constrói |
| `.agents/skills/conexus-review/SKILL.md` | Muda: a revisão procura peça refeita e abre a vitrine | quem revisa |
| `.agents/skills/conexus-scope/SKILL.md`, `.agents/skills/conexus-scope/references/card.md`, `.agents/skills/conexus-scope/references/screens.md`, `.agents/skills/conexus-scope/references/pattern-card.md` | Muda: o cartão com tela lista as peças de `ui/` que usa e as novas, cada nova com a sua linha na tabela de referência, nas duas trilhas | quem escreve o cartão |
| `.agents/skills/conexus-qa/SKILL.md` | Muda: o QA captura também a vitrine nos dois temas | o QA |
| `docs/steps/fundacao-do-front-end.md`, `docs/approvals/fundacao-do-front-end.md` | Apaga o cartão; muda a aprovação, que o firstmate cria quando o fundador aprovar esta página, com a linha de uso | `second-card`, `approval` |

### Os contratos que a unidade cria

A regra, que U6 escreve em inglês (delivery L23) com estas partes:

- **A regra nova** (o próximo número livre de V no guia). Antes de escrever uma tela, procure a
  peça em `ui/` e na vitrine. Uma peça de aparência nasce só em `ui/`, de uma fonte nativa (W21),
  com a sua entrada na vitrine e a sua linha no `DESIGN.md`, no mesmo commit da tela que a usa.
  Falha: a mesma escolha feita cinco vezes, com quatro peças, em 14 dias (o seletor de Projeto).
  [oxlint `shadcn/no-restyle` em aviso sob a catraca, o teste da vitrine, review]

### As skills e a leitura

`pstack:technical-writing` e `pstack:unslop`; o teto de palavras de cada arquivo (delivery L24: 600
por skill, 1.500 por referência, 2.500 no guia de design).

### A ordem do trabalho

1. **A regra nova e as marcas.** Critérios: 24, 25. V3 ganha "[oxlint `shadcn/no-raw-colors` em
   aviso, review]"; V16 e V22, "[oxlint `shadcn/no-arbitrary-values` em aviso, review]". O lint
   não prova a grade de 4px da V16 nem as sombras da V3: o "review" fica.
2. **Um passo em cada skill, trocando palavras.** Critério: 24. As skills estão perto de 600
   palavras: cada passo novo entra no lugar de palavras que já não mudam o que o agente faz.
3. **Os modelos de cartão.** O mesmo passo em `card.md` e `screens.md` (a trilha Agentes e Apps) e
   em `pattern-card.md` (a trilha Dados).

### Como se prova

`npm run docs` verde, com cada arquivo no teto; `method-freeze` verde. A leitura do diff por um
leitor que não o escreveu (delivery L9, documentos).

### Parar se

- A verificação `method-freeze` recusa o pull request. Com este cartão apagado nele, o diff conta
  para a marca dele (`scripts/tracks.ts:36-49`), e ela só recusa quando outro cartão com
  `Trilho: assistente` está em construção em `docs/steps/`. Então a regra espera: ou o pull request
  de métodos da semana, com a palavra do fundador, entre duas etapas (delivery L20), ou o rótulo de
  emergência, que só ele põe. O firstmate leva a escolha a ele.
- Uma skill não cabe no teto sem tirar um passo que muda o que o agente faz.

## G4 O ponto de conferência

O fechamento da etapa (delivery L19): `npm run docs`, `npm run check`; a linha de uso no arquivo de
aprovação; o cartão apagado; a dívida acima, como issues.
