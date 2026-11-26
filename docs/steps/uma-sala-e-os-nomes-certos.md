# Uma sala e os nomes certos

Trilho: harness

Trilha Agentes e Apps, etapa 2 do harness, o passo 3 e o passo 8 da auditoria de arquitetura na
[página da trilha](trilhas/agentes-e-apps.md): a casca única de conversa na web, com o registro de
cartões por ferramenta, e os nomes que dizem o que cada coisa é. A ordem é a do fundador em
2026-11-22 ("A: Sua recomendacao"): depois do `A1` e antes do `A3`. Em 2026-11-23 ele deu ao harness
trilho próprio, e em 2026-11-24, na entrevista deste cartão, decidiu que a parte da tela anda já e a
do servidor espera o fechamento do `A1` (a decisão 4 abaixo). As palavras dele estão no
[arquivo de aprovação da etapa 1](../approvals/uma-ficha-por-agente.md) e vão para o arquivo deste
cartão quando ele aprovar.

Lido em `main` `d3535848` (2026-11-24, depois do pull request 1324 do Lago 2, que trouxe o Caderno
que pergunta por suspensão). O cartão foi escrito sobre `2a16091d` (depois do G2 do `A1`, pull
request 1318, e do GC1 e GC2 do Lago 2) e o mapa desta etapa sobre `547b53ab`; cada `arquivo:linha`
foi relido em `d3535848`. Entre `547b53ab` e `2a16091d`, `apps/web/` não mudou; em
`apps/server/src/builder/` só mudaram as pastas do juiz do `A1` (`runs/`, `machine/`,
`conversation/processors.ts` e os dublês novos `test-check.ts` e `test-cloud-hub.ts`);
`.dependency-cruiser.cjs` ganhou 24 linhas, e a regra W7 foi de `:182-184` para `:187-191`. Entre
`2a16091d` e `d3535848`, o pull request 1324 mudou na web `Wb/conversation/room.ts`, `rows.ts`,
`session.ts`, `builder-turn.tsx`, `panel.tsx`, `question-card.tsx`, `approval-card.tsx` e
`Wb/assistant/conversation.tsx`, e criou `note-card.tsx` e `note-parse.ts` (o cartão do Caderno, um
cartão do transcrito como a pergunta e o plano); as linhas citadas desses arquivos estão no número
de hoje. No servidor, só mudaram `connectors/`, os retratos `inicio-com-ligacao` e
`ajudante-pesquisar` do Assistente e `conversation/test-questions.ts`; `controller-kit/`,
`model-accounts/`, `mastra/`, `assistant/routes.ts`, `conversation/guard.ts`, `stream.ts` e
`turn-of.ts` estão iguais, e `.dependency-cruiser.cjs` e `biome.json` também. O G3 do `A1`, o que
falta dele, só muda documentos (`docs/steps/`, `docs/approvals/`, `docs/architecture.md`). Versões
lidas: `@mastra/core` 1.83.0, `@mastra/server` 1.83.0,
`@mastra/client-js` 1.60.0, `@mastra/e2b` 0.17.0, `@tanstack/react-router` 1.170.44. A prateleira do
Mastra é a 1.83 (commit `d60ba71b`), com o Mastra Code e a Factory em `mastracode/`. Abreviações:
`B/` = `apps/server/src/builder/`, `Wb/` = `apps/web/src/builder/`, `FU/` =
`mastracode/factory-ui/src` e `TUI/` = `mastracode/tui/src/tui` na prateleira, `LC/` = LibreChat
(`d4e85d22`).

Os estudos reusados, fora do repositório (delivery L21): o mapa desta etapa e a entrevista de
2026-11-24, o estudo de rotas (U-a, U-b), a auditoria do harness (U-c a U-j, seção 6) e o estudo 2
do harness (seções 2.7, 2.8, 4.1 e 4.2, com a árvore de pastas aprovada).

## A página do fundador

**Linhas sem referência, para você ver antes de tudo.** Três peças desta etapa não têm um produto
de referência que faça igual; cada uma está na tabela de referência com o motivo. O que cada uma segue é diferente: a sala tipada
segue o guia de código (C21 e C22); a árvore de pastas da web é a decisão 2 do firstmate, que você
pode trocar; e o lugar de Renomear é o do protótipo, que você aprova.

1. **A sala como um tipo por agente** (a U1). A Factory do Mastra tem um agente só e fixa o
   controlador numa constante (`FU/ui/domains/chat/services/constants.ts:2`); o LibreChat junta
   vários agentes numa sala, mas sem tipo por agente. O Conexus tem quatro. A forma vem do guia de
   código (um estado é uma união com o campo que separa as variantes), não de uma referência.
2. **A árvore de pastas da web** (a U3). Nenhum estudo a propôs; ela espelha a do servidor, que você
   aprovou no estudo 2. É a decisão 2 do firstmate.
3. **Onde fica Renomear nas duas conversas que se trocam por uma lista suspensa** (o Construtor de
   apps e o agente salvo; a U4 desenha, a U13 liga). Na Factory, o menu fica em cada linha da lista
   lateral (`FU/ui/domains/workspaces/components/SessionMenuItems.tsx:54-72`); nenhuma referência
   tem lista suspensa com menu. O protótipo mostra onde, e você aprova com ele.

**No fim desta etapa** você conversa com os quatro agentes numa sala só. Nas três conversas da
plataforma (Construir, Agentes e Conversas), quem responde é o Conexus, com a marca; o lugar diz o
que ele faz ali. O agente que a empresa cria responde com o próprio nome e o ícone de agente. Onde
hoje está "Builder", "Construtor" ou "Assistente" como quem fala, está "Conexus". O menu do Projeto aparece em quatro
grupos com título. Você renomeia uma conversa nas quatro conversas, e apaga só onde já apaga hoje,
no Assistente.

**O roteiro de uso.**

1. No Hub da nuvem, abra um Projeto de teste. O menu à esquerda tem quatro grupos, cada um com o seu
   título em letra pequena, como a Nekt e o Databricks fazem:

   ```text
   O app        Construir
   Agentes      Conversas · Agentes · Automações
   Dados        Integrações · Dados
   O Projeto    Quem usa o app · Sobre
   ```

   Num celular (390 px), o mesmo menu abre pela gaveta, com os mesmos grupos.
2. Abra **Construir** e peça uma mudança pequena no app. A resposta vem assinada "Conexus", com a
   marca. A linha de trabalho diz "Conexus trabalhando".
3. Abra **Agentes**. A caixa do topo diz "Peça ao Conexus um agente…", e o bloco embaixo se chama
   "Conversas sobre agentes". Comece uma conversa: a resposta vem assinada "Conexus". Abra um agente
   salvo e teste: a resposta vem assinada com o nome dele e o ícone de agente.
4. Em cada uma das quatro conversas (Construtor de apps, Assistente, Construtor de agentes e o
   Testar de um agente salvo), abra o menu da conversa e use **Renomear**. O nome novo aparece na
   lista daquela conversa, e continua depois de recarregar a página. **Apagar** aparece só no
   Assistente, como hoje.
5. Abra o endereço antigo de uma conversa com o Construtor de agentes, que você tenha salvo antes
   (`…/agents/construtor/…`). Ele leva à mesma conversa no endereço novo.
6. Abra **Configurações, Contas de modelo**. O texto diz que o Conexus e os agentes da empresa tentam
   as contas nesta ordem.

O que você não vê, e muda: a pasta `builder/` do código, que hoje guarda os quatro agentes, se
divide em `harness/` (o que é comum às conversas) e `agents/` (um por agente), na web e no
servidor. O que **não** muda: o que cada agente responde, as conversas guardadas e o pedido que
cada agente manda ao modelo, que segue igual byte a byte, como na etapa 1. Três exceções. A
primeira e a segunda são da parte do servidor (a U15): a frase da ferramenta do Assistente que
cita o botão "Mandar ao Builder" passa a citar o botão "Mandar para Construir", o texto que a U4 põe no botão
(`Wb/assistant/text.ts:105`; a decisão 6 do firstmate); e o agendador das automações deixa de
apagar sozinho uma automação cujo fluxo ele não acha registrado na terceira falta seguida, e só
apaga na quinta. Cada tique do agendador dura 10 segundos (`DEFAULT_TICK_INTERVAL_MS` da 1.83.0),
então são uns 30 segundos hoje e uns 50 depois. Hoje isso acontece quando um fluxo muda de nome.
Entre a parte da tela e a U15, o Assistente ainda cita o botão pelo nome velho; o botão que a
pessoa toca já diz "Mandar para Construir". A terceira entra no fechamento (emenda de
2026-11-25): a skill `conexus`, que o Assistente carrega para passar um pedido ao Builder, troca
"Mandar ao Builder" por "Mandar para Construir".

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. Depois: vê o protótipo
dos nomes, do menu do Projeto e do lugar de Renomear, a 1366 e a 390 px, e o aprova (a sua
decisão B pede o protótipo antes do código). A parte da tela começa com a sua aprovação desta
página; a parte do servidor começa quando o `A1` fechar. No fim: faz o roteiro, diz o que viu e
aprova os textos novos das telas.

**A visão.** A etapa serve o princípio E7 do conceito ("uma coisa, um nome, um lugar"; "a mesma
escolha usa a mesma peça em toda tela") e a linha da visão em que os agentes e os apps leem o mesmo
contexto pela mesma porta: os quatro agentes passam a dividir uma sala e um registro, e nenhum
ganha comportamento novo. Ela não encosta em nenhuma recusa da visão: não abre dado e não muda
permissão de tabela. Na segurança, muda uma coisa: duas rotas do próprio Mastra passam a ficar
abertas atrás do guarda do Hub, a de trocar o modelo e a de renomear (hoje são sete; ficam nove,
`B/conversation/guard.ts:33-41`). Nas nove, o guarda confere o que já confere nas sete
(`guard.ts:174-200` e `:263-288`): que a conversa é da pessoa que pergunta; que as marcas do fio
nomeiam a mesma empresa e a mesma pessoa; que o agente do caminho é o agente do fio; e que esse
agente ainda admite a pessoa agora. O guarda não compara o Projeto por conta própria. A resposta a
quem não pode ver a conversa é a mesma "não achada" (security S10).

**Fica de fora.**

- **O `A2`**: a identidade de design da empresa e a skill de design do Construtor de apps.
- **O `A3`** (a sua decisão C): o modo plano, o juiz de fim de turno no Assistente, no Construtor de
  agentes e nos agentes salvos, uma ordem de instruções para os quatro, as frases que saem dos
  prompts e os defeitos de comportamento que a auditoria pôs lá (TURN-2, FERR-2, AGT-7, PROMPT-1).
  Também a issue 1327 (o Builder escreve em inglês entre as ferramentas): é frase de prompt.
- **Apagar fora do Assistente** (a sua resposta 3, b): apagar uma conversa do Construtor de apps
  solta a máquina, as cópias e a trava do Projeto, e nenhum estudo fez essa regra.
- **Os ids guardados**: o id de cada agente (`builder`, `assistant`, `agents`, `construtor`), os
  prefixos e as marcas das conversas estão em cada conversa salva. Mudar qualquer um seria migrar
  dado. Pelo mesmo motivo, o nome interno que cada agente tem no Mastra (`Builder`, `Construtor`)
  fica: ele entra no pedido ao modelo, e o pedido segue igual.
- **O esquema `builder` do banco do Hub** (`pgSchema('builder')`, `B/schema/tables.ts`): é o nome das tabelas guardadas; a pasta muda, o esquema fica. O `drizzle.config.ts` lê `./src/**/tables.ts` e acha as tabelas na pasta nova sem mudança, e nenhuma migração nasce.
- **O nome da máquina nos commits** ("Conexus Builder", a identidade do git na máquina da conversa):
  ninguém o vê no Hub, e mudá-lo mexe no histórico que a máquina compara.
- **O título de cada página com o nome do Projeto** (a regra do nível do mapa, seção 5): é outra
  parte do mapa, que esta etapa não toca.
- **A issue 655** (o título da primeira resposta pode apagar um Renomear feito durante ela): o
  título automático do Mastra não olha a marca de título fixado. Com Renomear nas quatro, a janela
  vale para as quatro, mas o caso é o mesmo de hoje no Assistente; o gatilho dela é a primeira
  queixa ou a próxima subida do `@mastra/core`.
- Dos itens abertos com o rótulo `next-card` cujo gatilho é uma pasta que esta etapa move, entram:
  o 808 (o dublê das máquinas com o nome do Assistente, renomeado no codemod do servidor), o 235 (os
  donos repetidos da máquina, que a U5 apaga), o 1287 (a troca de modelo do Assistente sem teste da
  marca, que a U12 refaz), o 1286 (a lista de ferramentas do Builder sem teste, U10 e U11), o 1285
  (a ordem do `researchOnly` do Assistente, U6) e, do 753, o item 3 (o nome do teste de
  `hub/projects/new-project.test.tsx`, U4), o item 6 (um comentário em `Wb/assistant/day.tsx`, U3)
  e o item 2 (uma troca de `grants.may` em `B/assistant/handoff.test.ts`, U7). Esperam: o 1164 e o
  1326 (a máquina que recusa ou expira no meio do turno) são comportamento da máquina, e a U5 e a
  U9 só tiram o caminho morto e juntam a montagem; o 1175 (as gravações do Mastra de 1.79 e 1.82),
  o 741, o 339 e o 282, que não mudam com uma pasta trocada de nome; o 1016, o 1017 e o 1018, que
  são comportamento dos agentes (`A3`).

**As decisões suas nesta etapa.** Respondidas em 2026-11-24, no quadro da entrevista: "1 Pode ser
A Pergunte 3: b", e antes 1 a ("Mas queria detalhes e exemplos para entender melhor"), 2 a e 4 a.

- **1. O menu do Projeto: (a) os grupos do mapa, com os nomes novos.** Os oito itens de hoje, na
  ordem do mapa aprovado em 17/11 (`docs/explanation/mapa.md:126-134`), em quatro grupos com título:
  "O app" (Construir), "Agentes" (Conversas, Agentes, Automações), "Dados" (Integrações, Dados) e
  "O Projeto" (Quem usa o app, Sobre). Não nasce um grupo Estúdio, e a página da trilha deixa de
  falar em "a área Estúdio". Os detalhes que você pediu: hoje os oito itens ficam numa lista só,
  sem título, nesta ordem: Construir, Conversas, Agentes, Automações, Sobre, Quem usa o app,
  Integrações, Dados (`apps/web/src/hub/projects/project-rail.tsx:84-152`). Com a resposta (a), o
  que muda é: os quatro títulos aparecem, e Sobre e Quem usa o app descem para o fim, no grupo
  "O Projeto". Um membro que não gerencia agentes vê o grupo "Agentes" só com Conversas, e quem não
  vê os dados do app vê o grupo "Dados" só com Integrações; nenhum grupo fica com o título sozinho,
  porque Conversas e Integrações aparecem para todos. O título do grupo é a peça que a coluna
  de conversas do Início e o índice de Configurações já usam (`SidebarGroupLabel`, `apps/web/src/ui/sidebar.tsx:252`).
  Veredito: nativo.
- **2. Quem responde: o Conexus nas três conversas da plataforma, e o agente da empresa pelo próprio
  nome.** A resposta (a) de 2026-11-24 (cada agente pelo próprio nome) foi trocada no mesmo dia, no
  protótipo e no estudo "um agente Conexus com modos": a nota no protótipo ("prefiro que seja
  Conexus, quem sabe não pode virar Modos do mesmo agente da plataforma") e, no estudo, "a: Conexus
  com a marca nas três conversas da plataforma; o agente da empresa com o próprio nome e o ícone de
  agente" e "a: um nome na tela, as quatro fichas separadas, o lugar faz o papel do modo". "Conexus"
  assina, com a marca, as respostas de Construir, Agentes e Conversas; o agente salvo assina com o
  nome e o ícone de agente. O lugar faz o papel do modo; as quatro fichas seguem separadas no
  servidor. Referência: Onyx (`AgentAvatar.tsx:25-41`, a marca do produto no agente padrão) e
  LibreChat (`MessageParts.tsx:57-58`, o nome do agente salvo). Veredito: nativo.
- **3. O menu da conversa: (b) Renomear nas quatro, Apagar só onde já existe.** Renomear passa
  pela rota do próprio Mastra (`PUT …/sessions/:sessionId/threads/:threadId`, `@mastra/server`
  1.83.0), atrás do guarda de hoje, para os quatro agentes. Apagar segue só no Assistente.
  Veredito: nativo.
- **4. Quando a etapa anda: (a) a tela já, o servidor depois do `A1`.** As unidades U1 a U4 (só
  `apps/web/` e os textos de `packages/hub-api/`) começam com a aprovação desta página. As U5 a U15
  (o servidor, e as duas peças da web que dependem dele: a troca de modelo e Renomear nas outras
  três conversas) começam quando o G3 do `A1` entrar no `main`.

## As unidades

**A parte da tela, que começa com a aprovação.**

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 | O registro inteiro e a sala por agente: cada cartão desenhado pelo resultado de uma ferramenta (app proposto, automação, memória da empresa, rascunho do agente, arquivo mostrado) vira uma linha do registro; a pergunta, o plano e o cartão do Caderno seguem cartões do transcrito, num lugar só, como hoje; o `Room` vira uma união com `kind` por agente, e os treze campos opcionais saem | `Wb/conversation/`, `Wb/assistant/`, `Wb/agents/` | web | nada |
| G1 | U2 | Um começo de conversa e um menu de conversa: os seis começos usam uma peça com o tipo de conversa como parâmetro; o menu da conversa sai do Assistente para a sala, com cada item existindo só onde a sala o liga | `Wb/conversation/`, `Wb/assistant/`, `Wb/agents/` | web | U1 |
| G2 | U3 | O codemod da web: `Wb/` se divide em `apps/web/src/harness/` e `apps/web/src/agents/<agente>/` pelo dono de cada arquivo, por um script que o revisor roda de novo, depois de dois commits que não mudam o comportamento (a sessão comum sem o ramo do Construtor de apps; os arquivos misturados divididos por dono); o endereço `agents/construtor/$conversationId` vira `agents/agent-builder/$conversationId`, e o antigo redireciona; as regras do `dependency-cruiser` e do Biome que citam `builder/` mudam junto; as regras W1, W4 e W7 do guia da web mudam no fechamento (U14) | `apps/web/src/`, `.dependency-cruiser.cjs`, `biome.json`, `scripts/`, os documentos que citam `apps/web/src/builder`, fora `docs/guides/` | web | U2 |
| G3 | U4 | Os nomes na tela e o menu do Projeto em grupos, depois do protótipo aprovado | `apps/web/src/`, `apps/web/sweep-*.ts`, `packages/hub-api/src/*-failures.ts`, `tests/e2e/` (as asserções dos textos) | design | U3, o protótipo |

**A parte do servidor, que começa quando o G3 do `A1` entrar no `main`.**

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G4 | U5 | A máquina sem o caminho morto (U-c da auditoria: MACH-1, 5 e 7) | `B/machine/`, `B/git/` | testing | o fechamento do `A1` |
| G4 | U6 | A ficha sem o que repete o Mastra (U-d: SPEC-1, 2 e 3) | `B/controller-kit/`, os quatro arquivos de agente | testing | o fechamento do `A1` |
| G4 | U15 | Dois consertos fora do codemod: a frase da ferramenta do Assistente que cita o botão, com o retrato dele regravado; o agendador que não apaga uma automação cujo fluxo ele não acha registrado (`missesBeforeDelete`, a U-i da auditoria), com a linha de log da poda que não terminou | `B/assistant/`, `B/mastra/`, `docs/explanation/agents-and-automations.md` | testing | o fechamento do `A1` |
| G5a a G5f | U7 | O codemod do servidor, em dois pull requests (o G5-harness, uma área por commit de G5a a G5e, e o G5-agents, o G5f): `harness/mastra`, `harness/model-accounts` (com a lista do MA-8), `harness/machine`, `harness/spec` com `turn`, `memory`, `prompt` e `routes`, `harness/tools`, e por fim os quatro `agents/` | `apps/server/src/`, `packages/hub-api/src/` e `apps/web/src/` (as constantes que mudam de nome), `.dependency-cruiser.cjs`, `biome.json`, `scripts/`, os documentos que citam `apps/server/src/builder` | testing | U5, U6, U15 |
| G6 | U8 | As marcas da conversa por um esquema só (U-e: SPEC-4) | `harness/spec/` | testing | G5d |
| G6 | U9 | A máquina montada uma vez (U-f: MACH-3, AGT-1) | `harness/machine/`, `harness/spec/`, `agents/*/` | testing | G5c, G5f, U8 |
| G6 | U10 | Uma lista de ferramentas e um "nunca pergunta" (U-g: FERR-3, FERR-9) | `harness/tools/`, `harness/spec/`, `harness/machine/`, `agents/app-builder/`, `agents/saved-agent/`, `packages/hub-api/src/tools.ts` | testing | G5d, G5e, G5f |
| G6 | U11 | O turno sem ler texto de erro (U-h: TURN-3, TURN-4) | `agents/app-builder/` | testing | G5d, G5f |
| G7 | U12 | A troca de modelo pela rota nativa (U-a), e uma `ModelChoice` só na web | `harness/routes/`, `agents/*/`, `packages/hub-api/src/`, `apps/web/src/harness/` | testing | G5d |
| G7 | U13 | Renomear nas quatro conversas pela rota nativa (U-b e a sua resposta 3): o guarda abre `PUT …/threads/:threadId`; a rota do Assistente sai; o menu da conversa liga Renomear nas outras três | `harness/routes/`, `agents/assistant/`, `packages/hub-api/src/assistant.ts`, `apps/web/src/harness/`, `apps/web/src/agents/` | testing | U12, U2 |
| G8 | U14 | O fechamento: DOC-1 e MACH-8 da auditoria, `docs/explanation/harness.md`, `boundaries.md`, as regras W1, W4 e W7 do guia da web com a árvore nova, a página da trilha sem "a área Estúdio", o cartão apagado | `docs/` | delivery | o uso |

G1, G2 e G3 correm em sequência: a U3 move os arquivos que a U1 e a U2 mudam, e a U4 escreve já
nas pastas novas (`names.test.ts` e `CONEXUS` moram em `apps/web/src/harness/`). O G3 espera
também o protótipo, que pode ser feito enquanto G1 e G2 andam. G4 junta U5, U6 e U15, antes do
movimento (Subtract Before You Add, a ordem da auditoria): U5 e U6 só apagam, a U15 muda duas
coisas pequenas, e as três tocam pastas diferentes e correm em paralelo. Os dois pull requests do G5 só movem, cada um provado
pelos mesmos testes e pelos quatro retratos `request.test.ts` iguais; G5a a G5e são os commits do
G5-harness, um por área, na ordem do cartão, e G5f, que move os quatro agentes, vem por último, no
G5-agents, sobre o G5-harness. G6 constrói já nas pastas finais; U10 e U11 correm em paralelo com U8 e U9, porque não
dividem pasta. G7 vem por último no servidor: a U12 apaga o molde da troca de modelo de três rotas,
e a U13 reusa a entrada que a U12 abre no guarda.

**Orçamento de código alterado.** Hipótese, das estimativas dos três estudos, sem testes nem
retratos nem o movimento puro. U1: 350 (o registro ganha sete linhas, a união e os quatro
embrulhos; saem `specialRow`, os três ganchos e os dois `if` de `rows.ts`). U2: 300 (seis começos
viram um; o menu sai do Assistente). U3: o script, cerca de 150, mais o movimento. U4: 200 (textos,
o menu em grupos, a rota antiga). U5: menos 310. U6: menos 100. U7: o script, cerca de 200, mais
o movimento. U8: 120. U9: 250 (menos 150 nos agentes). U10: 150. U11: 80. U12: mais 150 e menos 250.
U13: mais 80 e menos 90. U15: 20. U14: só documento. Total das parcelas: 2.800 linhas mudadas, ou
2.450 sem os dois scripts de movimento (U3, 150, e U7, 200). Das 2.800, 900 são as que as parcelas
dizem que saem (U5, 310; U6, 100; U9, 150; U12, 250; U13, 90), perto de um terço; a U1 também
apaga, mas sem número. Fica dentro das 4.000 de delivery L2; o movimento dos dois codemods não
conta, porque cada arquivo movido sai igual.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Cada cartão desenhado pelo resultado de uma ferramenta sai de uma linha do registro, e a tabela de quem desenha o quê é esta: app proposto, automação e memória da empresa só no Assistente; rascunho do agente só no Construtor de agentes; arquivo mostrado no Assistente e no agente salvo. Numa sala que não desenha aquele cartão, a chamada cai na linha comum, como hoje. A pergunta e o plano seguem desenhados nas quatro salas | `harness/room/tool-registry.test.ts` (hoje `Wb/conversation/tool-registry.test.ts`): os vinte pares (cinco cartões, quatro salas) escritos no teste como este critério os diz, e não lidos de `CARDS` | must |
| 2 | U1 | As quatro conversas desenham o mesmo que hoje em cada estado de cada cartão: os testes de tela de hoje passam sem mudar uma asserção | `cards.test.tsx`, os `card-*.test.tsx`, `agent-line.test.tsx`, `construtor-rows.test.tsx`, `write-rows.test.tsx`, `memory-proposal.test.tsx`, os `propose*.test.tsx`, `question-card.test.tsx`, sem mudar asserção | must |
| 3 | U1 | Um resultado que não passa no esquema do cartão (um `proposal` sem `name`; um `shown` com `SHOW_REFUSED`, que `ShownFile` aceita e a linha de `CARDS.shown` recusa por um refinamento, como `specialRow` faz hoje em `tool-row.tsx:276`) desenha a linha comum e não quebra a conversa | `tool-registry.test.ts`, um caso por cartão com resultado inválido | must |
| 4 | U1 | O `Room` não tem campo opcional que diga "este agente não tem": cada sala tem só os seus campos, e um cartão do Assistente desenhado numa sala de outro tipo não compila | `npm run check`; `room.test.ts`: `// @ts-expect-error` em `room.proposals` numa sala `APP_BUILDER` e numa `AGENT_BUILDER`, e em `room.openAgent` numa `ASSISTANT`; o acesso a `room.proposals.app` numa sala estreitada por `room.kind === 'ASSISTANT'` compila sem `?.` | must |
| 5 | U2 | Os seis começos de conversa mandam o mesmo pedido de hoje e vão para o mesmo endereço: Construtor de apps (Início de uma empresa nova, a primeira mensagem de um Projeto e **Nova conversa**), Assistente (Início e Conversas do Projeto), Construtor de agentes e o Testar do agente salvo | `start.test.tsx`, `handoff.test.tsx`, `home.test.tsx`, `area.test.tsx`, os `agent-page*.test.tsx`, sem mudar asserção | must |
| 6 | U2 | Um começo recusado por `MODEL_NO_ACCOUNT` faz o que cada lugar faz hoje: o Início de uma empresa nova abre o Projeto, o Construtor de agentes mostra "comece sem conta"; um começo cuja resposta não chega mostra a frase de `UNCONFIRMED_CREATION` e não cria duas conversas no segundo clique | `start-failures.test.tsx`, `area.test.tsx`, os casos de hoje | must |
| 7 | U2 | O menu da conversa mora na sala: na lista do Assistente, cada linha tem **Renomear** e **Apagar**, como hoje; nas outras três listas ainda não há menu (a U13 liga) | `sidebar-conversations.test.tsx` e os testes do menu, sem mudar asserção | must |
| 8 | U3 | Depois do codemod, `apps/web/src/builder/` não existe; o script, rodado de novo sobre a base do pull request, dá a mesma árvore; os mesmos testes da web passam, com o mesmo número de casos; `npm run deps` passa com a regra W7 sobre as pastas novas | `npm run test -w @conexus/web` (contagem antes e depois no pull request); `npm run deps`; o script de novo, `git diff --exit-code` | must |
| 9 | U3 | O endereço antigo `…/projects/$projectId/agents/construtor/$conversationId` leva, sem nova entrada no histórico, a `…/agents/agent-builder/$conversationId`, a mesma conversa; uma conversa que não é da pessoa dá a mesma tela de "não achada" de hoje nos dois endereços | `agents/agent-builder/route.test.tsx`, um caso de cada | must |
| 10 | U4 | A resposta das três conversas da plataforma (Construir, Agentes e Conversas) vem assinada "Conexus", com a marca; a de um agente salvo, com o nome dele e o ícone de agente, sem a marca. Nenhuma resposta vem assinada "Builder", "Construtor de apps", "Construtor de agentes" ou "Assistente". A linha de trabalho diz "Conexus trabalhando" | a cabeça da resposta, um caso por sala; `panel.test.tsx` | must |
| 11 | U4 | Nenhum texto da tela diz "Builder", "Construtor" ou "Assistente" como quem fala: os textos de `apps/web/src` e as frases de `packages/hub-api/src/*-failures.ts`. Os ids, os caminhos e os nomes no código não contam | `apps/web/src/harness/names.test.ts`, que lê os módulos de texto e as frases de falha e recusa as três palavras | must |
| 12 | U4 | O menu do Projeto tem quatro grupos com título, nesta ordem: "O app" (Construir), "Agentes" (Conversas, Agentes, Automações), "Dados" (Integrações, Dados) e "O Projeto" (Quem usa o app, Sobre). Um membro sem `manageAgents`, `manageAutomations` e `viewAppData` vê "Agentes" só com Conversas e "Dados" só com Integrações; nenhum título aparece sem item | `apps/web/src/hub/projects/project-rail.test.tsx`, um caso de dono e um de membro | must |
| 13 | U4 | Os textos das contas de modelo dizem que os agentes tentam as contas, não "o Builder": a fila, a reserva e a página de Configurações | `names.test.ts` (critério 11); `model-accounts.test.ts` do e2e, sem mudar a jornada | must |
| 14 | U15 | O pedido do Assistente ao modelo muda só na frase da ferramenta que cita o botão: o retrato regravado mostra "Mandar para Construir" no lugar de "Mandar ao Builder" e nada mais; os retratos dos outros três agentes não mudam. No fechamento, a skill `conexus` (`B/assistant/skills/conexus/SKILL.md`), que não está em nenhum retrato, troca o mesmo nome (emenda de 2026-11-25) | `B/assistant/request.test.ts` com `--test-update-snapshots` no commit da U15; `B/assistant/propose.test.ts:95,110` e `instructions.test.ts:165` com a frase nova; o diff do retrato no pull request | must |
| 15 | U4 | A tela de cada parte bate com o protótipo aprovado, elemento por elemento, a 1366 e a 390 px, nos dois temas: o menu do Projeto e a cabeça das quatro respostas | QA (testing T25) | must |
| 16 | U5 | A máquina da conversa roda só pelo caminho nativo do Mastra: o caminho por shell, a opção `instructions` nunca lida e os donos repetidos de `quoted`, `CANDIDATE_REF` e `IDENTITY` saem; os testes da máquina passam com `native: true` como padrão do dublê; os quatro retratos não mudam | `B/machine/machine*.test.ts`; `request.test.ts` dos quatro | must |
| 17 | U6 | A ficha não tem `base`, `ended`, nem os campos que só repassam o que o `AgentConfig` do Mastra já tem; o Construtor de apps ganha os sinais de tarefa pela própria ficha; os quatro retratos não mudam | `controller-kit/spec.test.ts`; `request.test.ts` dos quatro | must |
| 18 | U7 | Cada área do codemod do servidor só move: o script roda de novo e dá a mesma árvore, os mesmos testes passam com o mesmo número de casos, os quatro `request.test.ts` passam sem regravar, `npm run deps` passa com as regras novas no mesmo pull request; no fim, `apps/server/src/builder/` não existe e o dublê das máquinas se chama `conversationMachines` (issue 808); nenhuma migração nasce, e o retrato do catálogo do banco não muda | por pull request: a contagem dos testes antes e depois, `npm run deps`, `npm run migrations -- --base origin/main`, o script de novo com `git diff --exit-code` | must |
| 19 | U15 | O agendador das automações não apaga uma agenda cujo fluxo ele não acha registrado (`isTargetReady` falso, `@mastra/core` 1.83.0 `dist/worker-DCnErilX.js:342-348`): `schedulerOf` passa `missesBeforeDelete`, e a agenda de um fluxo ausente sobrevive a quatro tiques seguidos e é apagada na quinta falta seguida, com um aviso do Mastra na primeira (um tique dura 10 segundos, `DEFAULT_TICK_INTERVAL_MS`, `dist/scheduler-DOueSa7x.js:7`: uns 50 segundos). Hoje ela é apagada na terceira, uns 30 segundos (`DEFAULT_MISSES_BEFORE_DELETE`, `dist/scheduler-DOueSa7x.js:9`; `scheduler.ts:12` na prateleira). A poda diária que não terminou (`prune` devolve `done: false`, `B/mastra/retention.ts:26-29`) grava a linha nova `RETENTION_STILL_DRAINING`, sem dado | `B/mastra/mastra.test.ts`, o caso da agenda órfã com o relógio do agendador; `retention.test.ts`, o caso `done: false` | must |
| 20 | U8 | As marcas de uma conversa gravada com as chaves de hoje (Assistente, Construtor de agentes, agente salvo, automação) são lidas igual por um esquema só; uma marca que falta ou tem outro tipo é recusada como hoje (`CONVERSATION_NOT_FOUND`) | `harness/spec/run.test.ts`, uma conversa de cada tipo gravada antes da mudança | must |
| 21 | U9 | Cada agente abre, usa e solta a máquina pelo `workspace` da ficha, montado por um construtor só e numa montagem só do `Workspace`; o Assistente solta as máquinas ao apagar uma conversa, como hoje | um teste por agente em `agents/*/machine.test.ts`; `agents/assistant/routes.test.ts`, o apagar de hoje | must |
| 22 | U10 | A lista de ferramentas de cada agente vem de uma lista só, e "nunca pergunta" de um lugar só; os quatro retratos não mudam; o teste da lista fechada lê a ficha (issue 1286) | `harness/tools/*.test.ts`; `request.test.ts` dos quatro | must |
| 23 | U11 | Um turno recusado porque o Projeto está ocupado responde o mesmo `RUN_BUSY` de hoje, com o mesmo status, sem que o código leia o texto do erro | `agents/app-builder/turn.test.ts`, o caso de hoje sem mudar a asserção | must |
| 24 | U12 | Trocar o modelo de uma conversa do Construtor de apps, do Assistente ou do Construtor de agentes passa pela rota nativa `POST …/sessions/:id/model` e fica gravado na conversa; recarregar mostra o modelo novo. Recusas, as mesmas de hoje: um modelo sem conta que a pessoa possa usar recebe `MODEL_NO_ACCOUNT`, um modelo que não existe `MODEL_UNKNOWN`, um esforço que o modelo não oferece `EFFORT_UNSUPPORTED` (os três 422), um corpo sem `thinkingLevel` ou com campo a mais `REQUEST_MALFORMED` (400); outra pessoa, outra empresa ou outro Projeto recebe `CONVERSATION_NOT_FOUND` (404), e o agente salvo também, porque a ficha dele diz que o modelo é o da versão. Uma recusa não muda o modelo lido depois. As linhas `CONVERSATION_MODEL_SET`, `ASSISTANT_MODEL_SET` e `CONSTRUTOR_MODEL_SET` saem só depois do `{ ok: true }` do Mastra. As três rotas `…/model` de hoje respondem 404. A marca do Assistente passa à sessão recuperada (issue 1287) | `harness/routes/guard.test.ts`, um caso por recusa; `harness/controller-kit/lines.test.ts` para as linhas; o teste da marca depois de um reinício, no lugar de `B/construtor/routes.test.ts:198-213`; `assistant/model.test.tsx` na web | must |
| 25 | U13 | Renomear uma conversa de qualquer dos quatro agentes passa pela rota nativa `PUT …/sessions/:sessionId/threads/:threadId`: o título fica gravado com a marca de título fixado (`titlePinned`), e a lista mostra o nome novo depois de recarregar. Recusas: um título vazio depois de aparar, ou com mais de 120 caracteres, recebe `REQUEST_MALFORMED`; outra pessoa recebe `CONVERSATION_NOT_FOUND`; um `threadId` diferente do `sessionId` recebe `CONVERSATION_NOT_FOUND` antes de o Mastra trocar a conversa ativa. Depois de reiniciar o Hub, sem a sessão na memória, Renomear grava igual: a rota recupera a sessão presa à conversa de mesmo id (`@mastra/server` 1.83.0 `agent-controller.js:94-106`). A rota `PATCH` do Assistente responde 404 | `harness/routes/guard.test.ts`, um caso por agente, um por recusa e um depois de um reinício, como o caso da troca de modelo | must |
| 26 | U13 | O menu da conversa tem **Renomear** nas quatro listas, no lugar que o protótipo aprovou, e **Apagar** só na do Assistente | os testes de tela das quatro listas; QA (T25) | must |
| 27 | U11 | O turno recusado chega ao fim do turno pelo campo nativo `finishReason === 'tripwire'` (`@mastra/core` 1.83.0 `agent-controller-BhkzVgCi.js:738-746`, que o emite, e `:1189-1197`, que o atribui) e pelo código que o próprio processador gravou ao recusar; nenhuma linha de `apps/server/src` compara o texto `Processor "…" stopped the run` | `agents/app-builder/turn.test.ts`; `rg 'stopped the run' apps/server/src -g '!*.test.ts'` vazio, no ponto de conferência do G6 | must |
| 28 | U6 | A pesquisa do Assistente (`researchOnly`) roda antes da escolha da conta de modelo, como hoje (issue 1285) | `B/assistant/research.test.ts`, o caso novo, pela ordem dos processadores que a montagem do Assistente entrega | must |
| 29 | U11 | O turno do Construtor de apps acha o Projeto da conversa uma vez, pelo `projectOfRun`, sem reler o índice (TURN-4); um turno numa conversa sem Projeto recusa como hoje | `agents/app-builder/turn.test.ts`, os casos de hoje e um que conta as leituras do índice pelo dublê | must |

Os critérios 1 a 13 e 15 são da parte da tela; o 14 e os 16 a 29, da do servidor.

## A matriz de estados

A etapa não cria tela. Muda três coisas que a pessoa vê: o menu do Projeto, a cabeça da resposta e
o menu da conversa. O resto de cada conversa fica como está, e os critérios 2, 5 e 7 provam isso
com os testes de tela de hoje.

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O menu do Projeto | os quatro grupos, com Construir marcado num Projeto novo | não existe: Construir, Conversas, Sobre, Quem usa o app e Integrações aparecem sempre | sem mudança: o menu não espera leitura, só `may` | sem mudança | sem mudança (o Projeto que não existe) | o membro vê os grupos sem os itens que não pode (critério 12); nenhum título sozinho | sem mudança |
| A cabeça da resposta, nas quatro conversas | o nome do agente na primeira resposta | não existe sem resposta | "Conexus trabalhando" e a linha de cada agente com o nome dele | a falha do turno de hoje, com o nome do agente | sem mudança | sem mudança | sem mudança |
| O menu da conversa, nas quatro listas | aparece na primeira conversa | uma lista vazia não tem menu | o botão desligado enquanto Renomear grava, como no Assistente hoje | a frase de `writeFailureText` de hoje, no diálogo; uma resposta que não chega diz `UNCONFIRMED_WRITE` | a conversa que já foi apagada fecha o diálogo e some da lista, como o Assistente faz hoje com `CONVERSATION_NOT_FOUND` | outra pessoa nunca vê a conversa na lista; a rota recusa com 404 (critério 25) | um título vazio ou com mais de 120 caracteres fica no campo com a recusa do formulário, antes de ir ao Hub |

O desenho de caixas, a 1280 e a 390 px, é o do protótipo que o fundador aprovou (a decisão B dele),
na seção "O protótipo aprovado" logo abaixo. As capturas que o protótipo segue para o menu são a Nekt (`home-3.png`, os grupos Context e Activate)
e o Databricks (`app-genie-3.png`, os grupos Analytics, Lakehouse e Data Engineering), que este
cartão comparou peça por peça com o menu de hoje:

| Elemento | Nekt | Databricks | O menu de hoje | Com a resposta 1 (a) |
| --- | --- | --- | --- | --- |
| Título do grupo | texto pequeno e cinza, sem caixa alta, acima dos itens | o mesmo | nenhum | `SidebarGroupLabel` (`ui/sidebar.tsx:252`, um `h2` em `text-eyebrow`), como a coluna de conversas do Início (`Wb/assistant/sidebar-conversations.tsx:201`) |
| Grupo que dobra | não | não | não há grupo | não |
| Item fora de grupo, no topo | Overview | Home, Learn, Workspace | todos | nenhum: Construir mora em "O app" |
| Ícone em cada item | sim | sim | sim (`project-rail.tsx`, um ícone por `FrameLink`) | sim, os mesmos |
| Espaço entre grupos | maior que entre itens | maior que entre itens | não há | o de `SidebarGroup` |

As peças de `ui/` que a etapa usa: `SidebarGroup`, `SidebarGroupLabel`, `SidebarMenu`,
`SidebarMenuItem` e `SidebarMenuButton` (`ui/sidebar.tsx:242-300`), `DropdownMenu` e os diálogos
que o menu da conversa já usa (`Wb/assistant/conversation-menu.tsx`). Nenhuma peça nova; se o
protótipo pedir uma para o menu dentro da lista suspensa, ela entra com a sua linha da tabela de
referência, a vitrine e a linha do `DESIGN.md` (design V62) na U4.

### O protótipo aprovado (emenda, 2026-11-24)

O fundador aprovou o protótipo em duas rodadas no quadro, em 2026-11-24. Na primeira, o menu do
Projeto: "a: aprovo como está no protótipo"; Renomear: "A: o ⋮ ao lado da lista, para a conversa
aberta"; e, na pergunta 2, a nota: "Cara colocar construtor de agentes, cosntrutor de apps como nome
do agente é muiot ruim, prefiro que seja Conexus, quem sabe não pode virar Modos do mesmo agente da
plataforma o que ajudaria muito, pensei nisso agora não sei como não pensei antes". No estudo do
agente Conexus, cartão 1: "a: Conexus com a marca nas três conversas da plataforma; o agente da
empresa com o próprio nome e o ícone de agente"; cartão 5: "a: emendar só a U4 (assinatura, nomes,
textos com uma rodada curta do protótipo, DESIGN.md); G2 e G4 entram como estão". Na rodada curta do
Conexus: a assinatura e a linha `mark` do `DESIGN.md`, "a: aprovo"; os textos, "a: aprovo os
textos"; a emenda do cartão, "a: aprovo a emenda". As capturas, a 1366 e a 390 px nos dois temas,
ficam na pasta da tarefa `conexus-harness2-prototipo` (delivery L21); cada tela da U4 e da U13 bate
com elas no QA (critérios 15 e 26).

**O menu do Projeto, a 1280 px (o dono).** Quatro `SidebarGroup`, cada um com o seu
`SidebarGroupLabel` (a peça como está: 12 px, `text-2`, a altura de uma linha), e os itens de hoje
com os ícones de hoje.

    ┌────┬──────────────────────────┬──────────────────────────────
    │ ▣  │ [P] Projeto ...       ⇵  │
    │ ⌂  │                          │
    │▌▢  │ O app                    │   (a folha da página aberta)
    │ ⏚  │ ▌⚒ Construir             │
    │ ◷  │                          │
    │ ⚙  │ Agentes                  │
    │ ⛁  │   ▭ Conversas            │
    │    │   ☺ Agentes              │   ← só com manageAgents
    │    │   ◷ Automações           │   ← só com manageAutomations
    │    │                          │
    │    │ Dados                    │
    │    │   ⏚ Integrações          │
    │    │   ⛁ Dados                │   ← só com viewAppData
    │    │                          │
    │    │ O Projeto                │
    │    │   ☷ Quem usa o app       │
    │    │   ⓘ Sobre                │
    │ ⚙  │                          │
    │ 🔔 │                          │
    │ AL │                          │
    └────┴──────────────────────────┴──────────────────────────────

O membro sem as três permissões vê "Agentes" só com Conversas e "Dados" só com Integrações; nenhum
título aparece sem item.

**O menu do Projeto, a 390 px.** A mesma lista, na gaveta (V56):

    ┌──────────────────────────────────┐
    │                              ✕   │
    │ ▣  [P] Projeto com um no...  ⇵   │
    │ ⌂  O app                         │
    │▌▢  ▌⚒ Construir                  │
    │ ⏚  Agentes                       │
    │ ◷    ▭ Conversas                 │
    │ ☺    ☺ Agentes                   │
    │ ⛁    ◷ Automações                │
    │    Dados                         │
    │      ⏚ Integrações               │
    │      ⛁ Dados                     │
    │    O Projeto                     │
    │      ☷ Quem usa o app            │
    │      ⓘ Sobre                     │
    │ ⚙                                │
    │ AL                               │
    └──────────────────────────────────┘

**O lugar de Renomear (a U13 liga).** Numa lista, o "⋮" de cada linha, como o Assistente hoje
(`ConversationMenu` na linha): a coluna e a página do Assistente, o bloco "Conversas sobre agentes"
(a idade some no hover, como em `conversation-row.tsx`) e a lista do Construtor de apps que sobe de
baixo no celular. Numa lista suspensa (o topo da conversa do Construtor de apps a partir de 768 px e
o Testar do agente salvo), um "⋮" ao lado da lista, que age na conversa aberta: o mesmo
`ConversationMenu`, com o gatilho fora da linha (um `Button` ghost `icon` sempre à vista).

    a 1280 px, o topo da conversa do Construtor de apps:
    ┌───────────────────────────────────────────────┐
    │ [Comparação de dois apps de enc… ⌄]  ⋮   ✎    │   ⋮ = Ações da conversa
    │                                ┌────────────┐ │
    │                                │ Renomear   │ │
    │                                └────────────┘ │

    a 390 px, o Testar do agente salvo:
    ┌──────────────────────────────────┐
    │ [Metas de ontem            ⌄] ⋮  │
    │ (Nova conversa) (Testar rascunho)│
    └──────────────────────────────────┘

O "⋮" dentro de cada opção da lista suspensa foi construído e recusado: a `ComboboxItem` não aceita
controle dentro dela (o clique não abre o menu, e o botão cai sobre o ✓). Ele pediria uma peça nova.
Apagar segue só no Assistente; quando vier para as outras, entra no mesmo menu.

**A cabeça da resposta e os textos (a rodada do Conexus).** A cabeça da resposta tem o sinal, o nome
em `label` 600 e o modelo numa pílula, como hoje. Nas três conversas da plataforma o sinal é a marca
e o nome é "Conexus"; no agente salvo, o ícone de agente (`BotIcon`, o do item Agentes) e o nome dele.

    ▣ Conexus              (Claude Sonnet 4)    ← Construir, Agentes, Conversas
    ☺ Conferente de metas  (Claude Sonnet 4)    ← um agente salvo

A linha `mark` do `DESIGN.md` passa a dizer: "the Conexus mark on the rail and beside "Conexus" at
the head of an answer in the platform's three conversations (Construir, Agentes, Conversas); nothing
else. A company's agent signs with its own name and the agent icon in `text-2`".

Onde um texto citava o Construtor de apps, o Construtor de agentes ou o Assistente, ele passa a dizer
"Conexus" e, quando o lugar importa, o lugar (Construir, Agentes, Conversas). Nenhum texto cita
"modo". Os textos aprovados:

| Onde | Hoje | Fica |
| --- | --- | --- |
| Cabeça da resposta, Construir · Agentes · Conversas | Conexus · Construtor · Assistente | Conexus, nos três |
| Linha de trabalho | Builder trabalhando · Builder esperando sua resposta. | Conexus trabalhando · Conexus esperando sua resposta. |
| Caixa da conversa em Construir | Escreva para orientar o Builder | Escreva para orientar o Conexus |
| Agentes, a caixa | Peça ao Construtor… | Peça ao Conexus um agente… |
| Agentes, o bloco embaixo | Conversas com o Construtor | Conversas sobre agentes |
| Agentes, o bloco vazio | Nenhuma conversa com o Construtor ainda. | Nenhuma conversa sobre agentes ainda. |
| Ferramentas, vazio | Nenhuma ferramenta ainda. O Construtor faz as primeiras quando monta um agente. | … O Conexus faz as primeiras quando monta um agente. |
| Ferramenta em código | Uma ferramenta em código só o Construtor muda. | Uma ferramenta em código só o Conexus muda, numa conversa em Agentes. |
| Cartão do app proposto em Conversas | Mandar ao Builder · Abrir a conversa do Builder | Mandar para Construir · Abrir em Construir |
| O pedido que chega em Construir | via Assistente · Enviado pelo Assistente | via Conversas · Enviado de uma conversa com o Conexus |
| A proposta que não chega | O Builder não recebeu a proposta. | A proposta não chegou a Construir. |
| Prévia com erro | Pedir ao Builder para corrigir | Pedir ao Conexus para corrigir |
| Dados do app, sem app | Este Projeto ainda não tem app. Peça um ao Builder. | … Peça um ao Conexus em Construir. |
| Versões, vazio | Cada versão que o Builder monta aparece aqui… | Cada versão que o Conexus monta aparece aqui… |
| Liberar uma ligação ao Projeto | O app, o Builder e os agentes poderão usar… | O app, o Conexus e os agentes poderão usar… |
| Registro de dados, quem leu | Assistente · Construtor de apps · Construtor de agentes | Conexus em Conversas · Conexus em Construir · Conexus em Agentes |
| Minha conta, a memória | O que o Assistente lembra de você · O Assistente ainda não guardou nada… | O que o Conexus lembra de você · O Conexus ainda não guardou nada… |
| Minha conta, cargo e área | Ajuda o Assistente a entender o seu trabalho. | Ajuda o Conexus a entender o seu trabalho. |
| Memória da empresa | … que o Assistente segue em toda conversa da empresa. · O Assistente deixa de ler esta nota… | … que o Conexus segue … · O Conexus deixa de ler esta nota… |
| Contas de modelo (página, fila, reserva) | As contas que o Builder usa… · o Builder tenta nesta ordem · O Builder tenta as contas nesta ordem… | As contas que o Conexus e os agentes da empresa usam, na ordem em que tentam cada uma. · o Conexus e os agentes tentam nesta ordem · O Conexus e os agentes da empresa tentam as contas nesta ordem… |
| Primeira conta de modelo | O Builder usa a conta da empresa para trabalhar. | O Conexus usa a conta da empresa para trabalhar. |
| Falhas da conversa e do app (Hub) | Peça de novo ao Builder. · O Builder está mudando este app para {pessoa}. · A próxima versão do Builder… | Peça de novo ao Conexus. · O Conexus está mudando este app para {pessoa}. · A próxima versão do Conexus… |
| Rascunho do agente mudou (Hub) | Outra pessoa ou o Construtor mudou este rascunho. | Outra pessoa ou o Conexus mudou este rascunho. |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Room.kind` (`APP_BUILDER`, `ASSISTANT`, `AGENT_BUILDER`, `SAVED_AGENT`) | o embrulho de cada agente (U1) | `CARDS` (as linhas do registro que só desenham numa sala) e `specOf` |
| `Room.agent` | o embrulho de cada agente | a cabeça da resposta e a linha de trabalho (U4) |
| `AssistantRoom.proposals` (app, automação, memória) | `useAssistantRoom` | as três linhas de `CARDS` do Assistente |
| `AgentBuilderRoom.openAgent`, `openedAgent` | o embrulho do Construtor de agentes | a linha `agent` de `CARDS` |
| `SavedAgentRoom.writeOf`, `connectorOf`, `writes`, `refreshWrites`, `toolDescription` | o embrulho do agente salvo | `specOf` e o cartão de aprovação, como hoje |
| `ConversationKind` (`APP_BUILDER`, `ASSISTANT`, `AGENT_BUILDER`, `SAVED_AGENT`) | quem monta o começo e a lista (U2) | `useStartConversation`, `ConversationMenu` |
| `ConversationActions.rename`, `ConversationActions.remove` | a lista de cada agente (U2, U13) | `ConversationMenu`: cada item existe só se a ação existe |
| O corpo `{ title }` de `PUT …/threads/:threadId` | a ação `rename` da web (U13) | o guarda, que apara e confere 1 a 120 caracteres, e o Mastra, que grava `title` e `titlePinned` |
| O corpo `{ modelId, thinkingLevel }` de `POST …/model`: o guarda exige `thinkingLevel`, que o corpo nativo deixa opcional (`agent-controller.js:224-233`), porque a escolha de hoje leva sempre o esforço (`{ model, effort }`, `packages/hub-api/src/conversations.ts:140`) | a `ModelChoice` (U12) | o guarda e o Mastra (`session.model.switch`) |
| `BoxWords` (o nome do agente e o tipo de arquivo) | o lugar que monta a caixa de começar (U1) | a caixa e `StartBox` |
| `AppBuilderRoom.notebook`, `AssistantRoom.notebook` (`{ companyId }`) | `builderRoomOf` hoje e `useAssistantRoom` | o cartão do Caderno (`note-card.tsx`), que pergunta se a pessoa gerencia as ligações da empresa |
| `AssistantProposals` (`app`, `automation`, `companyMemory`) | `useAssistantRoom` (U1) | as linhas `proposal`, `automation` e `companyMemory` de `CARDS` |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Renomear pela rota nativa (`session.thread.rename`, `@mastra/core` 1.83.0 `agent-controller-BhkzVgCi.js:2592-2615`: um `saveThread` com `title` e `titlePinned`, depois o evento `thread_title_updated`) | os dois gravam; fica o último, e a lista mostra o último depois de reler. É a regra de hoje no Assistente (`B/assistant/routes.ts:233-235`, um `updateThread`) | o `saveThread` é uma escrita só: grava tudo ou nada; o evento sai depois dela, e uma conexão cortada entre os dois deixa o título gravado e a outra aba sem o evento até reler | o banco do Hub fora: a falha de hoje do guarda para o Mastra que não responde, e a web diz a frase de `writeFailureText` | `CONVERSATION_RENAMED` com a conversa e o agente, nunca o título (pode trazer dado da empresa) | 25, 26 |
| O título automático do Mastra contra um Renomear durante a primeira resposta (issue 655) | o título automático grava se o fio não tinha título quando a volta começou, e não olha `titlePinned`: o Renomear pode perder | não se aplica | não se aplica | nada novo | fica de fora (página do fundador) |
| Trocar o modelo pela rota nativa (`session.model.switch`, `@mastra/server` 1.83.0 `agent-controller.js:869-890`) | fica o último; é a regra de hoje das três rotas (`answerModelChange`, `B/controller-kit/routes.ts:16`) | uma troca é uma escrita na conversa; recusada antes dela pelo guarda, nada muda | o banco do Hub fora: a falha de hoje | `CONVERSATION_MODEL_SET`, `ASSISTANT_MODEL_SET` ou `CONSTRUTOR_MODEL_SET`, as linhas de hoje, só depois do `{ ok: true }`; uma recusa não escreve linha | 24 |
| Começar uma conversa pela peça única (as rotas de criar de hoje, que não mudam) | a chave de tentativa de hoje: o segundo clique não cria outra conversa | sem mudança: a rota de hoje | sem mudança: `UNCONFIRMED_CREATION` | sem mudança | 5, 6 |
| Os dois codemods e a rota antiga que redireciona | não gravam | não se aplica | não se aplica | nada | 8, 9, 18 |
| Apagar uma conversa do Assistente | sem mudança: a rota de hoje (`B/assistant/routes.ts:243-257`), que solta a sessão e as máquinas antes do fio | sem mudança | sem mudança | sem mudança | 7, 21 |
| O agendador das automações com `missesBeforeDelete` (`@mastra/core` 1.83.0 `dist/scheduler-DOueSa7x.js:217-240`; na prateleira, `workflows/scheduler/scheduler.ts:282-335`) | um disparo por agenda por tique, como hoje | uma agenda cujo fluxo não está registrado é contada a cada tique, avisada uma vez e pulada; na falta que chega ao limite, é apagada, como hoje na terceira | o banco fora: o tique falha e tenta no próximo, como hoje | o aviso do Mastra na primeira falta; `RETENTION_STILL_DRAINING` quando a poda devolve `done: false` | 19 |
| O registro da recusa do turno (U11), gravado pelo processador por conversa, em memória | duas recusas da mesma conversa: fica a última, e o fim do turno lê a do seu turno, porque um turno por Projeto corre por vez (`Runs.take`) | o processador grava antes de `abort`; um corte entre os dois deixa o registro sem turno, que o próximo turno da conversa sobrescreve | não depende de banco | nada novo: a linha `RUN_BUSY` de hoje | 23, 27 |

## A tabela de referência

Commits da prateleira: Mastra 1.83 `d60ba71b` (Mastra Code e Factory em `mastracode/`), LibreChat
`d4e85d22`, Dify `484404f0`, n8n `7a384b35`. Cada linha foi lida na versão instalada ou na
prateleira desta versão; as capturas da Nekt e do Databricks são as dos estudos anteriores,
reabertas aqui. O vibesdk não entra: ele cobre construir e publicar na Cloudflare, que esta etapa
não toca.

| Peça | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Unidade | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Uma sala para as quatro conversas | a `Chat` única (`Wb/conversation/chat.tsx`) e seis `RoomContext.Provider`: os quatro embrulhos, `Wb/agents/area.tsx:85` e `Wb/assistant/home.tsx:111` | Factory, **situação diferente: um agente só**. `FU/ui/domains/chat/components/SessionChatSurface.tsx:17-28`, um chamador (`FU/ui/pages/ThreadPage.tsx:105-117`) | a sala recebe só encaixes (cabeçalho, vazio, rótulo da caixa); o controlador é uma constante (`FU/ui/domains/chat/services/constants.ts:2`) | embrulhado: a sala recebe encaixes; o tipo por agente é nosso | critérios 2 e 4 | U1 | nenhum: muda `room.ts` |
| A sala tipada por agente | o `Room` com 18 campos, 13 opcionais (`Wb/conversation/room.ts:42-81`) | **sem referência**: a Factory fixa um controlador; o LibreChat escolhe pelo objeto do agente (`LC/packages/chat/src/components/messages/MessageParts.tsx:51-62`), sem tipo por agente | — | embrulhado: a união com `kind` é o guia de código (C21, C22) | critério 4 | U1 | nenhum |
| Os cartões especiais | `specialRow` com três ganchos `room.*Card?.` (`Wb/conversation/tool-row.tsx:272-303`) e dois `if` em `rows.ts` (`CARD_TOOLS.question` `:134`, `CARD_TOOLS.plan` `:154`) | LibreChat, **mesma situação** (vários agentes numa sala): `LC/client/src/components/Chat/Messages/Content/Part.tsx:211-214`, `matchTool` `:410-420`, `wrapTool` `:427`. Factory, **mesma situação** nos cartões: `FU/ui/domains/chat/components/ToolFactory.tsx:86-156`, uma sequência de `if` (`ask_user` `:86`, tarefas fora `:105`, `submit_plan` `:128`, suspensão com forma de pergunta `:140-154`, o resto em `fallback()` `:156`) | o LibreChat: um mapa pelo nome da ferramenta, e qualquer outro nome desenha o cartão comum; a Factory: os cartões decididos num lugar | nativo da forma do LibreChat (a decisão 1 do firstmate) | — | U1 | nenhum: `CARDS` em `tool-registry.ts` |
| A linha comum pelo nome | `TOOLS` (`Wb/conversation/tool-registry.ts:30`) e `specOf` (`:120-127`) | Factory, **mesma situação**: `packages/playground-ui/src/ds/components/ai/tool-call/tool-styles.ts:11`, lido por `presentTool` (`tool-presentation.ts:60`), chamado por `FU/ui/domains/chat/components/tool/ToolCard.tsx:22` | uma tabela por nome | nativo; fica | — | nenhuma | — |
| A mesma conversa para testar e para usar | o Testar do agente salvo é a `Chat` | Dify, **situação parecida** (um app por vez): `web/app/components/app/configuration/debug/debug-with-single-model/index.tsx:9,183` e `web/app/components/base/chat/chat-with-history/chat-wrapper.tsx:29,428` | o mesmo `<Chat>` em dois embrulhos | nativo; fica | — | nenhuma | — |
| Começar uma conversa | seis começos: `Wb/conversation/start.tsx:99` e `:267`, `first-message.tsx:36`, `conversation-switch.tsx:33-58`, `Wb/assistant/home.tsx:61`, `Wb/agents/area.tsx:55`, `Wb/agents/open-conversation.ts:16-19` | Factory, **situação parecida** (sem Projeto, sem arquivos passados adiante): `FU/hooks/useAgentControllerThreadMutations.ts:26-34` | uma mutação de criar, `session.createThread(title)` | embrulhado: uma peça com o tipo de conversa como parâmetro; criar segue pelas rotas nossas, porque gravam as marcas e o Projeto | critérios 5 e 6 | U2 | `apps/web/src/harness/room/start-conversation.ts` (escrito em `Wb/conversation/` e movido pela U3) |
| Listar as conversas | quatro famílias: `conversation-switch.tsx:158`, `Wb/assistant/sidebar-conversations.tsx:115` e `home.tsx:181`, `Wb/agents/area.tsx:105`, `Wb/agents/test-panel.tsx:30` | Factory, **situação parecida**: `FU/hooks/useAgentControllerThreads.ts:21-44`, `listThreads` com filtro por marca | uma leitura por agente; a lista é um componente do lugar | nativo da forma: cada lista fica no seu lugar (a decisão 5 do firstmate) | — | nenhuma | — |
| O menu da conversa | `Wb/assistant/conversation-menu.tsx:136`, único uso em `conversation-row.tsx:55` | Factory, **mesma situação** na forma: `FU/ui/domains/workspaces/components/SessionMenuItems.tsx:54-72`, num menu suspenso e num menu de contexto (`SessionNavRow.tsx:220-251`). A Factory não tem Renomear digitado ("Regenerate title" e "Delete"); a referência de Renomear é a linha abaixo | os mesmos itens nos dois menus; cada item existe só se a ação dele existe | nativo da forma | — | U2, U13 | `apps/web/src/harness/room/conversation-menu.tsx` (movido) |
| Renomear numa lista suspensa | o Construtor de apps e o agente salvo trocam de conversa por `Combobox` (`conversation-switch.tsx:192-220`, `test-panel.tsx:50-74`) | **sem referência**: nenhuma lista suspensa com menu nas referências lidas | — | nativo da peça: o `ConversationMenu` de hoje com o gatilho ao lado da lista; o lugar foi aprovado com o protótipo em 2026-11-24 | critério 15 | U13 | — |
| Renomear | só o Assistente, pela rota nossa `PATCH` (`B/assistant/routes.ts:227-241`, operação `packages/hub-api/src/assistant.ts:254`) | Mastra Code, **mesma situação**: `TUI/setup.ts:450-451` (`/name`, `/rename`), `TUI/commands/name.ts:3-15`; a sessão remota chama a rota nativa (`mastracode/sdk/src/factory/remote-session.ts:259-261`). `@mastra/server` 1.83.0 `dist/server/handlers/agent-controller.js:1243-1269` (`PUT …/sessions/:sessionId/threads/:threadId`, corpo `{ title }` em `:237`); `@mastra/core` 1.83.0 `agent-controller-BhkzVgCi.js:2592-2615` (`rename` grava `title` e `titlePinned` e emite `thread_title_updated`); `@mastra/client-js` 1.60.0 `renameThread` (`dist/index.js:7576-7581`) | a rota recupera a sessão (`getSession`, `agent-controller.js:94-106`, que numa sessão fria a prende à conversa de mesmo id), troca a conversa ativa se o `threadId` for outro (`:1259-1262`) e renomeia a ativa | embrulhado: a rota nativa atrás do guarda. Duas diferenças, as duas do guarda: ele já recusa um `threadId` diferente da sessão (`B/conversation/guard.ts:185-187`), então a troca de conversa nunca roda; e confere o título de 1 a 120 caracteres depois de aparar (`CONVERSATION_TITLE_MAX`, `packages/hub-api/src/assistant.ts:252`), que o corpo nativo não confere | critério 25 | U13 | nenhum: muda `guard.ts` |
| Trocar o modelo | três rotas `…/model` (`B/conversation/routes.ts:113-128`, `B/assistant/routes.ts:295-316`, `B/construtor/routes.ts:85-109`), o molde `answerModelChange` (`B/controller-kit/routes.ts:16-36`) e `changeModel` (`B/controller-kit/open.ts:95-117`) | Factory, **mesma situação**: `FU/hooks/useAgentControllerStateMutations.ts:43-61`. `@mastra/server` 1.83.0 `agent-controller.js:869-890` (corpo `:224-233`); `@mastra/client-js` 1.60.0 `switchModel` (`dist/index.js:7533-7541`) | `session.switchModel(modelId, { thinkingLevel })` e invalida duas leituras | embrulhado: a rota nativa atrás do guarda, que confere a conta e o esforço (`conversationModel`, `B/model-accounts/queue.ts:144-157`) | o estudo de rotas, P1 a P4, **provado**: as recusas pela porta do Hub e os quatro retratos iguais | U12 | nenhum: muda `guard.ts` |
| Quem assina a resposta | "Conexus" para o Construtor de apps e o nome para os outros (`Wb/conversation/builder-turn.tsx:128`) | LibreChat, **mesma situação**: `LC/packages/chat/src/components/messages/MessageParts.tsx:51-62`, `AuthorHeader.tsx:11-29`. Factory, **situação diferente**: a resposta não tem cabeça com nome, só o modelo (`FU/.../MessageBubble.tsx:182-196`, `:129-138`) | o nome do agente na cabeça de cada resposta | nativo: a marca do produto no agente padrão (Onyx, `AgentAvatar.tsx:25-41`) e o nome do agente salvo (LibreChat, `MessageParts.tsx:57-58`); a decisão 2 foi trocada em 2026-11-24 | — | U4 | — |
| Os nomes dos construtores | "Builder" e "Construtor" | n8n, **mesma situação no nome**: `packages/frontend/@n8n/i18n/src/locales/en.json:599-604` ("AI Builder"); LibreChat: `client/src/locales/en/translation.json:1284-1285` ("Agent Builder", "Assistant Builder") | o construtor se chama pelo que constrói | nativo (a decisão B do fundador) | — | U4 | — |
| O menu do Projeto em grupos | oito itens numa lista sem título (`apps/web/src/hub/projects/project-rail.tsx:84-152`) | Nekt (`data/conexus-refs/nekt/rea/home-3.png`) e Databricks (`databricks/app-genie-3.png`), **mesma situação**, vistas; Dify (`web/app/components/main-nav/routes.ts:44-116`) e LibreChat (`client/src/hooks/Nav/useSideNavLinks.ts:122-243`), **situação diferente**: listas sem título | grupos com título pequeno acima dos itens | nativo: a peça já existe em `ui/` (`SidebarGroupLabel`, `apps/web/src/ui/sidebar.tsx:252`) | — | U4 | — |
| O endereço antigo leva ao novo | `…/agents/construtor/$conversationId` (`routes/_app/companies/$companyId/projects/$projectId_.agents.construtor.$conversationId.tsx:8`) | `@tanstack/router-core` (instalado com `@tanstack/react-router` 1.170.44) `src/redirect.ts:102-122`, `src/route.ts:1020-1025`, `src/load-client.ts:1723-1755` (o `followRedirect` navega com `replace: true` em todo redirect); o mesmo caso no Conexus, `routes/_app/companies/$companyId/data.$copyId.tsx:3-10` | `beforeLoad` lança `redirect({ to, params })`; a opção `replace` não se repete, porque o router já a força | nativo | — | U3 | o arquivo da rota nova; o antigo fica só com o `beforeLoad` |
| A árvore da web | `Wb/` com os quatro agentes, e o Construtor de apps em `Wb/conversation/` | **sem referência**: nenhum estudo propôs; Mastra Code junta o comum em `sdk/src/agents/*.ts` e as variantes em `agents/modes/`, `agents/subagents/`; a Factory divide por assunto | — | embrulhado, sem referência própria: espelha a árvore do servidor (a decisão 2 do firstmate) | critério 8 | U3 | `apps/web/src/harness/`, `apps/web/src/agents/` |
| A árvore do servidor | `B/` com os quatro agentes e o comum; `B/conversation/` é o Construtor de apps e também o guarda dos quatro | a árvore aprovada do estudo 2, seção 2.8, e os nomes da decisão B. Mastra Code, **situação diferente** (um agente com modos): `sdk/src/agents/` e o resto por assunto; nenhuma referência chama uma pasta de `harness/` | o comum por assunto, as variantes por pasta | nativo da forma: a divisão por assunto segue a Factory; o nome `harness/` é do fundador (estudo 2 aprovado) | critério 18 | U7 | `apps/server/src/harness/`, `apps/server/src/agents/` |
| A máquina só pelo caminho nativo | o caminho por shell de `SandboxFilesystem` (`B/machine/sandbox-filesystem/copy.ts`, `files.ts`, `listing.ts`, e os ramos de `filesystem.ts` `:189-342`); o dublê com `native: false` (`B/machine/test-machine.ts:111`) | Factory, **mesma situação** (E2B com `SandboxFilesystem`): `mastracode/factory/src/workspace.ts:1806-1830`; `mastracode/sdk/src/agents/sandbox-filesystem.ts:434-440` (lê pelo nativo quando a sandbox tem `filesystem`); `@mastra/e2b` 0.17.0 `dist/index.js:764-800` e `:1588-1591` (o `filesystem` da `E2BSandbox` existe sempre) | o caminho nativo; o de shell fica para provedores sem `filesystem` | embrulhado depois de apagar o shell: o nativo, mais o nosso limite de pastas, `walk` e `grep`. A diferença: o Mastra Code guarda o shell para outros provedores, e o Conexus só tem a E2B | critério 16 | U5 | nenhum: só apaga |
| A opção `instructions` da máquina | `B/machine/kit.ts:103`, `e2b.ts:47`, `machines.ts:239`, `conversation.ts:261`, nunca lida | `@mastra/core` 1.83.0 `workspace/workspace.ts:638` na prateleira (`instructions.dynamicSandbox`) | o texto vem do `dynamicSandbox` | nativo; a opção nossa sai | — | U5 | — |
| A ficha sem `base` | `base` (`B/controller-kit/spec.ts:87-88`), `agentOfBase` (`mount.ts:137-145`), um uso (`B/conversation/builder.ts:139`) | Mastra Code, **mesma situação** para os sinais: `mastracode/sdk/src/index.ts:1304` (`new TaskSignalProvider()`), `:1496-1500`; `@mastra/core` 1.83.0 `dist/coding-agent/index.js:219-243`; `TaskSignalProvider` em `@mastra/core/signals` (`dist/signals/index.d.ts:3`) | `new Agent({ signals: [new TaskSignalProvider()] })` | nativo | — | U6 | — |
| A ficha sem os campos que só repassam | `description`, `skills`, `signals`, `scopes`, `knowledge` (`spec.ts:86,96-99`, `mount.ts:163,172-175`); `ended` (`turns.ts:80`, nunca passado); `ONE_STRING` e `DELEGATED` (`spec.ts:28-38`) | `@mastra/core` 1.83.0 `dist/agent/types.d.ts:955` (`AgentConfig`); na prateleira, `packages/core/src/agent/types.ts:640`, `:834`, `:873`, `:931`, `:1010` | os cinco campos já são do `AgentConfig` | nativo: `Pick<AgentConfig, …>` | — | U6 | — |
| As marcas da conversa | três esquemas (`B/controller-kit/run.ts:80`, `:99`, `:113`) e um quarto leitor (`B/assistant/open.ts:65-79`) | Factory, **situação parecida**: `mastracode/factory/src/tools/scope.ts:52-80` confere a marca contra a linha guardada; o Mastra Code lê as marcas à mão | — | nativo: um esquema Zod sobre `RUN_MARKS` (C27); as marcas são dado nosso, e nenhuma referência tem um esquema delas | critério 20 | U8 | — |
| A máquina montada uma vez | duas montagens de `Workspace` (`B/machine/machines.ts:268`, `B/machine/conversation.ts:288`) e três chamadas de `createConversationMachines` (`B/agents/controller.ts:233`, `B/construtor/construtor.ts:300`, `B/assistant/assistant.ts:276`) | Mastra Code, **situação parecida**: um `Workspace` por controlador, `mastracode/sdk/src/index.ts:1801-1802`, `:1852`; reusado pelo id em `sdk/src/agents/workspace.ts:226-256`. Factory: `mastracode/factory/src/workspace.ts:1798-1830` | uma montagem por escopo, com o contexto como parâmetro | embrulhado: o `Workspace` nativo e o nosso kit; a ficha segue com o `workspace` nativo, e o `MachineSpec` é o parâmetro do construtor, porque o Conexus tem três agentes com máquina de conversa (emenda de 2026-11-25) | critério 21 | U9 | `harness/machine/spec.ts` |
| Uma lista de ferramentas | quatro `Set` em `B/conversation/permissions.ts`, `TOOLS_OF` (`B/company-tools/names.ts:18-39`), `B/assistant/available-tools.ts:23-39`, `B/construtor/construtor.ts:69-77` | Mastra Code, **mesma situação**: `mastracode/sdk/src/agents/tool-availability.ts:140`, `:166`; `agents/modes/plan.ts:48`. `@mastra/core` 1.83.0 na prateleira, `agent-controller/agent-controller.ts:2160-2215` (`availableTools` vira a lista de `activeTools`), `:2575-2579` (`disableBuiltinTools`) | uma constante por modo, espalhada no modo | nativo: `availableTools = [...CLOSED_TOOLS]` | — | U10 | — |
| Um "nunca pergunta" | `NEVER_ASKS` (`B/controller-kit/mount.ts:87`, `:99-110`), a cópia em `B/agents/tools.ts:96` e `requireApproval: () => false` (`B/machine/conversation.ts:296`) | `@mastra/core` 1.83.0 na prateleira, `loop/workflows/agentic-execution/tool-approval-verdict.ts:85-93` | sem função, vale `global` ou `tool.requireApproval`; só uma função vence a sessão | embrulhado: a função de `mount.ts` fica; as duas cópias saem | critério 22 | U10 | — |
| O turno recusado | o texto do erro lido (`B/conversation/turn-of.ts:11`, `:111-114`; `end.ts:64-73`) | `@mastra/core` 1.83.0 `agent-controller-BhkzVgCi.js:738-746` e `:1186-1200`: o controlador junta o motivo num texto (`Processor "<id>" stopped the run: <reason>`) e guarda só `finishReason: 'tripwire'`; `processorId` e `metadata` não chegam ao evento `error`. `docs-agents-processors.md:1045-1063` (`abort(reason, { metadata })`) vale só fora do controlador | — | embrulhado: `finishReason` é nativo; o código vem de um registro nosso, que o processador grava ao recusar. O que a referência deixa aberto tem o seu teste: o caso que mostra que o evento `error` do controlador não traz `processorId` na 1.83.0 | critérios 23 e 27 | U11 | nenhum |
| O agendador que não apaga | `schedulerOf` sem `missesBeforeDelete` (`B/mastra/mastra.ts:14-21`) | `@mastra/core` 1.83.0 na prateleira, `workflows/scheduler/types.ts:147-154`, `scheduler.ts:12`, `:282-335`; instalado, `dist/scheduler-DOueSa7x.js:217-240` | a opção pública; conta os tiques em que o alvo da agenda não está registrado (`dist/worker-DCnErilX.js:342-348`), e um número maior troca "apaga depois de 3 tiques" por "avisa e pula" por mais tempo | nativo | — | U15 | — |
| A fila de contas de modelo vale para os quatro | os textos dizem "o Builder tenta" (`Wb/model-accounts/model-fallback.tsx:83`, `queue.tsx:62`, `routes/_app/companies/$companyId_/settings/model-accounts.tsx:18`) | o próprio código: `B/controller-kit/mount.ts:156-159` e `factories.ts:57-76` põem `accountPick(queue)` em todo agente; a reserva é por empresa (`B/model-accounts/fallback.ts:10-27`) | — | nativo: a fila já vale para os quatro no código; só o texto muda, sem referência a seguir | critério 13 | U4 | — |

**A medida do transplante.** Nada vem do repositório velho; nenhuma parte é trazida.

**A dívida.** O comentário de `B/conversation/permissions.ts` que cita
`mastracode/sdk/src/index.ts:858,1331` aponta linhas velhas; os lugares na 1.83 são `:1149` e
`:1832` (a U10 o corrige ao apagar os quatro `Set`). A issue 655 fica aberta (página do fundador).

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | Os cartões especiais são linhas de um mapa pelo nome do corpo (`CARDS`), e não um `if` num arquivo | é a forma do LibreChat (`Part.tsx:211-214`), que tem vários agentes numa sala; o mapa por nome já existe no código (`TOOLS`); um cartão novo é uma linha e não toca a lógica de escolha. A pergunta e o plano ficam fora do mapa: são cartões do transcrito com estado de suspensão, num lugar só (`rows.ts:134-179`), como a Factory os trata (`ToolFactory.tsx:86-138`) | trocar `CARDS` por uma sequência de `if` em `specialRow`, a forma da Factory |
| 2 | A árvore da web espelha a do servidor: `apps/web/src/harness/` (a sala, os cartões, a sessão, o registro) e `apps/web/src/agents/<agente>/` | um nome para cada coisa nos dois lados; nenhuma referência propõe outra | `git mv` pelo mesmo script |
| 3 | O endereço `agents/construtor` passa a `agents/agent-builder`, e o antigo redireciona | o endereço segue o nome no código (a decisão B); o Conexus já redireciona endereços velhos assim (`data.$copyId.tsx:3-10`) | manter o endereço antigo e apagar o novo |
| 4 | A ordem dos grupos e a ordem dentro do G5 seguem a auditoria e o estudo de rotas | apagar antes de mover; mover antes de construir | trocar as linhas da tabela das unidades |
| 5 | As quatro listas ficam no lugar de cada uma (a lista suspensa do Construtor de apps e do Testar, a coluna e a página do Assistente, o bloco do Construtor de agentes); a etapa une o menu e o começo | as listas estão em lugares diferentes da tela, e a Factory também desenha a lista no lugar (`SessionNavRow.tsx`) e une só os itens do menu (`SessionMenuItems.tsx`); unir a lista mudaria o que a pessoa vê, e nenhuma resposta do fundador pediu isso | uma peça de lista com o tipo como parâmetro, com protótipo |
| 6 | A U15 muda a frase da ferramenta do Assistente que cita o botão "Mandar ao Builder" (`B/assistant/propose.ts:36-42`), com o retrato do Assistente regravado, logo no começo da parte do servidor | sem ela, o Assistente manda a pessoa a um botão que mudou de nome; a decisão C deixa no `A3` o que muda o comportamento, não o nome de um botão; e a resposta 4 do fundador põe todo arquivo do servidor depois do `A1`, então a frase fica velha entre a U4 e a U15 (a página do fundador diz isso) | deixar a frase para o `A3` |
| 7 | Os textos das contas de modelo dizem "o Conexus e os agentes da empresa", e não "o Builder" | a fila e a reserva valem para as quatro fichas (`mount.ts:156-159`, `factories.ts:57-76`, `fallback.ts:10-27`); trocar só o nome deixaria o texto errado para três agentes | o nome de um agente só, se o fundador preferir, nos textos que ele aprova no fim |
| 8 | A caixa de começar lê só o nome do agente e o tipo de arquivo (`BoxWords`), e não a sala inteira | os dois lugares que montam uma sala só para a caixa (`area.tsx:85`, `home.tsx:111`) não têm conversa; com a sala tipada, teriam de inventar os campos de uma sala | um quinto tipo de sala, "antes da conversa" |
| 9 | Renomear nas três conversas novas entra na parte do servidor (U13), e não na da tela | a rota nativa e a conferência do título são do servidor; a resposta 4 do fundador põe o servidor depois do `A1`. Até a U13, só o Assistente renomeia, como hoje | uma rota nossa de renomear por agente, na parte da tela, que a U13 apagaria |
| 10 | A linha de log de Renomear passa a `CONVERSATION_RENAMED`, com o tipo de agente, no lugar de `ASSISTANT_CONVERSATION_RENAMED` | uma rota para os quatro; o guarda grava a linha como já grava as da troca de modelo | uma linha por agente, pela ficha |
| 11 | O registro de leituras de dados (`apps/web/src/hub/data/text.ts:14-15`) diz "Conexus em Conversas", "Conexus em Construir" e "Conexus em Agentes" | é texto que a pessoa lê; os ids `BUILDER` e `CONSTRUTOR` que ele traduz ficam | — |
| 12 | O agendador só apaga uma automação cujo fluxo não está registrado na quinta falta seguida (`MISSES_BEFORE_DELETE = 5`), e a U15 entra antes do codemod | é o número do teste da auditoria (FERR-7); três faltas, o padrão do Mastra, são uns 30 segundos (um tique dura 10), menos que um reinício com um fluxo renomeado, e cinco são uns 50; e a mudança é de comportamento, então não vai num pull request que só move (G5a) | voltar ao padrão do Mastra, tirando a opção |

## U1 O registro inteiro e a sala por agente

**Base e modelo.** `main` no commit em que G1 começa (o cartão leu `2a16091d`; `apps/web/` está
igual desde `547b53ab`). Opus: a união muda um tipo que seis lugares montam e que o registro, as
linhas e os cartões leem, entre três pastas.

### As linhas da tabela

- **Uma sala para as quatro conversas.** Na base: `Wb/conversation/room.ts:42-112` (o tipo, as três
  bases e `agentRoom`); os seis `RoomContext.Provider`: `Wb/conversation/panel.tsx:42`,
  `Wb/assistant/conversation.tsx:88` (com `useAssistantRoom` `:33-76`),
  `Wb/agents/construtor-chat.tsx:84` (`:67-82`), `Wb/agents/agent-chat.tsx:126` (`:28-54`),
  `Wb/agents/area.tsx:85`, `Wb/assistant/home.tsx:111`. Na referência:
  `FU/ui/domains/chat/components/SessionChatSurface.tsx:17-28` (a sala recebe encaixes).
- **A sala tipada por agente.** Sem referência; guia de código C21 e C22.
- **Os cartões especiais.** Na base: `Wb/conversation/tool-row.tsx:272-303` (`specialRow`),
  `:196-204` (`ShownLine` com `room.openFile?.`), `:228-235` (`AgentLine` com `room.openAgent?.`);
  `tool-spec.ts:36-48` (`ToolBody`). Na referência: `LC/client/src/components/Chat/Messages/Content/Part.tsx:211-214`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `Wb/conversation/room.ts` | Muda: `Room` vira união; `BUILDER_ROOM`, `ASSISTANT_ROOM` e `agentRoom` viram um construtor por tipo | os quatro embrulhos, `tool-registry.ts`, `tool-row.tsx`, a caixa |
| `Wb/conversation/tool-registry.ts` | Muda: ganha `CARDS`; `specOf` lê `writeOf` e `toolDescription` só na sala que os tem | `tool-row.tsx` |
| `Wb/conversation/tool-row.tsx` | Muda: `specialRow` lê `CARDS`; saem os três ganchos | `rows` da conversa |
| `Wb/conversation/start.tsx`, a caixa da conversa | Muda: a caixa recebe `BoxWords` (a decisão 8 do firstmate) | os seis começos |
| `Wb/assistant/conversation.tsx` | Muda: `useAssistantRoom` devolve uma `AssistantRoom` com `proposals` | a página do Assistente |
| `Wb/agents/construtor-chat.tsx`, `agent-chat.tsx`, `area.tsx` | Muda: cada um monta a sua sala | as páginas do Construtor de agentes e do agente salvo |
| `Wb/assistant/home.tsx`, `Wb/agents/area.tsx` | Muda: deixam de montar uma sala para a caixa | o Início, a área Agentes |

### Os contratos que a unidade cria

Em `Wb/conversation/room.ts` (a U3 o move para `apps/web/src/harness/room/room.ts`):

```ts
type RoomBase = {
  agent: string
  connectors: ConnectorWords
  overrides: Partial<Record<RowTool, ToolSpec>>
  failures: Partial<Record<FailureCode, string>>
  files: FilesGo
}
type Opened = { openFile: (file: OpenedFile) => void; openedPath: string | undefined }
type AgentTools = { toolDescription: (slug: string) => string | undefined }
type Notebook = { notebook: { companyId: CompanyId } }
export type AssistantProposals = {
  app: (proposal: { proposed: ProposedApp; toolCallId: string; closed: boolean }) => ReactNode
  automation: (proposal: { proposed: ProposedAutomation; toolCallId: string }) => ReactNode
  companyMemory: (proposal: { proposed: ProposedCompanyMemory; toolCallId: string }) => ReactNode
}
export type Room =
  | (RoomBase & Notebook & { kind: 'APP_BUILDER' })
  | (RoomBase & Opened & Notebook & { kind: 'ASSISTANT'; proposals: AssistantProposals })
  | (RoomBase & AgentTools & {
      kind: 'AGENT_BUILDER'
      openAgent: (agentId: AgentId, by: 'CALL' | 'TAP') => void
      openedAgent: AgentId | undefined
    })
  | (RoomBase & Opened & AgentTools & {
      kind: 'SAVED_AGENT'
      writeOf: (toolName: string) => WriteTool | undefined
      connectorOf: (toolName: string) => string | undefined
      writes: WritesRead
      refreshWrites: () => void
    })
export type RoomKind = Room['kind']
export type BoxWords = Pick<RoomBase, 'agent' | 'files'>
```

Em `Wb/conversation/tool-registry.ts`:

```ts
type CardBody = Extract<ToolBody, 'shown' | 'proposal' | 'automation' | 'companyMemory' | 'agent'>
type CardCall = { toolCallId: string; toolName: string; live: boolean; closed: boolean }
type CardRow<K extends RoomKind, T> = {
  rooms: readonly K[]
  result: z.ZodType<T>
  draw: (value: T, call: CardCall, room: Extract<Room, { kind: K }>) => ReactNode
}
export const CARDS: { [B in CardBody]: CardRow<RoomKind, unknown> }  // cada linha com o seu K e T, por `satisfies`
```

- **Cada estado** como união: `Room` por `kind` (C21, C22). Nenhum campo opcional que queira dizer
  "este agente não tem".
- **Cada id**: `AgentId` e `ToolCallId` com as marcas de `@conexus/hub-api`, conferidas onde a
  conversa as lê, como hoje (C23).
- **O dono de cada fato**: a tabela "que cartão desenha em que sala" é `CARDS` e só ela (C26); os
  textos ficam em `text.ts` de cada pasta.
- **O esquema Zod de cada entrada externa**: os resultados das ferramentas, pelos esquemas de hoje
  de `@conexus/hub-api` (`ProposedApp`, `ProposedAutomation`, `ProposedCompanyMemory`, `ShownFile`,
  `DraftRef`) (C27).
- **O arquivo modelo**: `tool-registry.ts` depois da unidade, que cumpre C21 (o mapa por corpo), C23
  e C26.

Sai: `Room` com treze opcionais, `BUILDER_ROOM`, `ASSISTANT_ROOM`, `agentRoom`, `builderRoomOf`, os
três ganchos `appCard`, `automationCard`, `companyMemoryCard`, e os `?.` de `tool-row.tsx`.

### As skills e a leitura

As linhas de `docs/reference/stack.md` de `apps/web/src`: `@mastra/client-js` (skill `mastra`),
`@tanstack/react-router` (as skills de `router-core` no pacote), `@tanstack/react-query`, `react`,
`zod`. Mais `pstack:typescript-best-practices`. Ler primeiro `docs/guides/web.md` e as regras
C21 a C27 do guia de código.

### A ordem do trabalho

1. **A união.** Critérios: 4.
   - **Arquivos:** muda `room.ts`.
   - **Referência a seguir:** `SessionChatSurface.tsx:17-28` (a sala recebe encaixes); C21.
   - **O que sai:** `BUILDER_ROOM`, `ASSISTANT_ROOM`, `agentRoom`, `builderRoomOf`, com cada
     chamador: os seis `Provider`.
   - **O que entra:** o tipo acima e um construtor por tipo (`appBuilderRoom(words, companyId)`,
     `assistantRoom(...)`, `agentBuilderRoom(...)`, `savedAgentRoom(...)`).
   - **Testes:** `room.test.ts` com `// @ts-expect-error` nos três acessos de hoje numa sala
     `APP_BUILDER`.
   - **Pronto quando:** `npm run typecheck -w @conexus/web` passa.
2. **A caixa sem sala.** Critérios: 5.
   - **Arquivos:** a caixa da conversa e `StartBox` (`start.tsx:190`) recebem `BoxWords`;
     `area.tsx:85` e `home.tsx:111` deixam de montar `RoomContext.Provider`.
   - **Testes:** `start.test.tsx`, `home.test.tsx`, `area.test.tsx`, sem mudar asserção.
3. **O registro dos cartões.** Critérios: 1, 3.
   - **Arquivos:** `tool-registry.ts` ganha `CARDS`; `tool-row.tsx` troca `specialRow` por uma
     leitura de `CARDS[body]`: se a sala está em `rooms` e `result` passa, `draw`; se não, a linha
     comum.
   - **Referência a seguir:** `Part.tsx:211-214`.
   - **O que sai:** os três ganchos e os `?.` de `tool-row.tsx:276-298`.
   - **Testes:** `tool-registry.test.ts`, um caso por par (corpo, sala) e um por resultado inválido.
   - **Mutações à mão:** tirar `'SAVED_AGENT'` de `CARDS.shown.rooms` deixa vermelho o caso do
     arquivo mostrado no agente salvo; trocar `result` de `proposal` por `z.unknown()` deixa
     vermelho o caso do resultado inválido.
4. **Os quatro embrulhos.** Critérios: 2.
   - **Arquivos:** `panel.tsx`, `Wb/assistant/conversation.tsx` (`useAssistantRoom` devolve
     `proposals`), `construtor-chat.tsx`, `agent-chat.tsx`.
   - **Testes:** os da coluna "Teste" do critério 2, sem mudar asserção.
   - **Pronto quando:** as quatro conversas abrem no Hub local com os dublês, e cada cartão aparece
     como antes.

### Como se prova

Critério 1 e 3: `tool-registry.test.ts`, que hoje não tem o par (corpo, sala) e falha na base
porque `CARDS` não existe. Critério 2: os testes de tela de hoje, sem mudar uma asserção; o diff do
pull request não toca nenhum deles. Critério 4: `npm run typecheck`, com o `@ts-expect-error` que
fica vermelho se alguém devolver um campo opcional.

### Parar se

- A caixa da conversa ler da sala mais que o nome e o tipo de arquivo: a decisão 8 não basta;
  parar e dizer quais campos.
- Algum teste de tela precisar mudar uma asserção para passar: o que a pessoa vê mudou, e isso não
  é desta unidade.

## U2 Um começo e um menu de conversa

**Base e modelo.** O commit de U1. Sonnet: junta seis chamadas iguais numa peça e move um
componente.

### As linhas da tabela

- **Começar uma conversa.** Na base: `start.tsx:74` (`usePicked`), `:99` e `:267` (`Start`),
  `first-message.tsx:29-36`, `conversation-switch.tsx:33-58` (`useNewConversation`),
  `Wb/assistant/home.tsx:51-97` (`useBegin`, com `connections` e `projectId`),
  `Wb/agents/area.tsx:39-103`, `Wb/agents/open-conversation.ts:16-42` (`{ draft }`, sem modelo).
  Na referência: `FU/hooks/useAgentControllerThreadMutations.ts:26-34`.
- **O menu da conversa.** Na base: `Wb/assistant/conversation-menu.tsx` (136 linhas até o
  componente; `RenameForm`, o diálogo de apagar, `isGone`), `conversation-row.tsx:55`. Na
  referência: `FU/ui/domains/workspaces/components/SessionMenuItems.tsx:54-72`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `Wb/conversation/start-conversation.ts` | Cria: `useStartConversation` | os seis começos |
| `Wb/conversation/start.tsx`, `first-message.tsx`, `conversation-switch.tsx` | Muda: chamam a peça | o Construtor de apps |
| `Wb/assistant/home.tsx`, `Wb/agents/area.tsx`, `Wb/agents/open-conversation.ts` | Muda: chamam a peça | o Assistente, o Construtor de agentes, o Testar |
| `Wb/conversation/conversation-menu.tsx` | Cria, movido de `Wb/assistant/`: o menu com ações opcionais | `Wb/assistant/conversation-row.tsx` |

### Os contratos que a unidade cria

```ts
// Wb/conversation/start-conversation.ts
export type ConversationKind = Room['kind']
type StartOf = {
  APP_BUILDER: { companyId: CompanyId; projectId: ProjectId; picked: ModelPick }
  ASSISTANT: { companyId: CompanyId; projectId?: ProjectId; picked: ModelPick; connections: readonly ConnectionId[] }
  AGENT_BUILDER: { companyId: CompanyId; projectId: ProjectId; picked: ModelPick }
  SAVED_AGENT: { companyId: CompanyId; projectId: ProjectId; agentId: AgentId; draft: boolean }
}
export function useStartConversation<K extends ConversationKind>(kind: K): {
  start: (input: StartOf[K], handoff: Handoff) => Promise<void>
  pending: boolean
  failure: StartFailure | undefined
}

// Wb/conversation/conversation-menu.tsx
export type ConversationActions = {
  rename?: (title: string) => Promise<void>
  remove?: () => Promise<void>
}
export function ConversationMenu(props: { title: string; actions: ConversationActions }): ReactNode
```

- `ConversationActions` tem campos opcionais por desenho, como a Factory (`SessionMenuItems.tsx`:
  cada item existe só se a ação existe): a lista diz o que liga, e o menu sem nenhuma ação não
  aparece. Os tipos de entrada de `StartOf` são os corpos de hoje das quatro operações de criar.
- **O dono de cada fato**: o destino de cada tipo de conversa (o endereço para onde vai depois de
  criar) mora numa tabela só, em `start-conversation.ts` (C26).

Sai: os seis `useMutation` de criar, `useNewConversation`, `useBegin`, a criação dentro de
`area.tsx` e de `open-conversation.ts`; `Wb/assistant/conversation-menu.tsx`, que vira o arquivo
movido.

### As skills e a leitura

As da U1. Ler primeiro `docs/guides/web.md`.

### A ordem do trabalho

1. **A peça de começar.** Critérios: 5, 6.
   - **Arquivos:** cria `start-conversation.ts`; muda os seis lugares.
   - **Referência a seguir:** `useAgentControllerThreadMutations.ts:26-34`.
   - **O que sai:** os seis `useMutation` e as navegações repetidas.
   - **O que entra:** a tabela de destino e a chave de tentativa de hoje, uma vez; o que é só de um
     lugar (o `NameStep` do Início novo, `StartWithoutAccount` do Construtor de agentes) fica no
     lugar.
   - **Testes:** os da coluna do critério 5 e 6, sem mudar asserção; um caso novo por tipo em
     `start-conversation.test.tsx`, com a operação chamada e o destino.
   - **Mutações à mão:** trocar o destino de `AGENT_BUILDER` deixa vermelho `area.test.tsx`.
2. **O menu na sala.** Critérios: 7.
   - **Arquivos:** move `conversation-menu.tsx` para `Wb/conversation/`, com `ConversationActions`;
     `conversation-row.tsx` passa `rename` e `remove` do Assistente.
   - **Referência a seguir:** `SessionMenuItems.tsx:54-72`.
   - **Testes:** `sidebar-conversations.test.tsx`, sem mudar asserção; um caso novo: sem `remove`,
     o menu não tem **Apagar**.

### Como se prova

Os testes de tela de hoje, sem mudar asserção, mais `start-conversation.test.tsx` e o caso do menu
sem `remove`, que falham na base porque as peças não existem.

### Parar se

- Um dos seis começos fizer algo que a tabela de destino não diz (um segundo destino além dos dois
  do Assistente): parar e listar.

## G1 O ponto de conferência

Depois da U2, antes do pull request: o Hub local com os dublês, as quatro conversas abertas, um
cartão de cada tipo em cada sala que o desenha, e os seis começos; `npm run quality`, `npm run
check` e os testes da web que a unidade toca; capturas das quatro conversas antes e depois a 1366
px, no pull request.

## U3 O codemod da web

**Base e modelo.** O commit de G1 no `main`. Sonnet: um script que move arquivos e corrige
importações, sem mudar lógica, depois de dois commits pequenos que não mudam o comportamento.

**A emenda de 2026-11-24.** A revisão do primeiro pull request desta unidade achou que a regra de
divisão por quem importa cada arquivo levava para a árvore nova a posse errada que o código já
tinha: os arquivos de `Wb/agents/` que misturam o Construtor de agentes com o agente salvo iam
inteiros para `agents/saved-agent/`, e as consultas da Prévia e do código iam para `harness/room/`
por causa de um ramo do Construtor de apps dentro da sessão comum. O fundador, no mesmo dia, às
duas perguntas (os dois desvios eram gambiarra; a regra de divisão passa a ser por dono, e o guia
da web muda só no fechamento): "sIM NAS duas e revisão tem que pegar essas coisas". A segunda
revisão do mesmo pull request achou restos da mesma família: três casos do Construtor de agentes
nos testes do agente salvo, a tela de conversa não achada e o teste do catálogo no Assistente, e o
painel do Construtor de apps lendo a forma crua do evento do Mastra. Esta seção é a emendada, já
com eles; a árvore de topo (a decisão 2 do firstmate) fica.

### As linhas da tabela

- **A árvore da web.** Na base: `apps/web/src/builder/`, com nove pastas: `conversation/`,
  `assistant/`, `agents/`, `automations/`, `model-accounts/`, `observational-memory/`, `preview/`,
  `source/` e `tools/`. Sem referência; a decisão 2 do firstmate. O destino de cada pasta está na
  tabela abaixo.
- **As regras que citam a pasta.** `.dependency-cruiser.cjs:187-191` (W7), `:266-273`
  (`web-tree-shape`, que só aceita `routes|hub|builder|ui|platform|brand` em `apps/web/src`),
  `:283-285` (`web-support-does-not-import-subject`); `biome.json:14`, `:123`, `:228-240`;
  `scripts/rules.test.ts:60`; `scripts/test-rules.ts:134`; o link do endereço antigo em
  `apps/web/src/hub/data/read-detail.tsx:54`. As regras W1 (`docs/guides/web.md:25`), W4 (`:38`) e
  W7 (`:42`) nomeiam `builder/` até o fechamento: um guia muda só no fechamento de uma etapa
  ([delivery L19, L20](../guides/delivery.md)), e quem segura a regra enquanto isso é o
  `.dependency-cruiser.cjs`, que muda nesta unidade.
- **O endereço antigo leva ao novo.** Na base:
  `routes/_app/companies/$companyId/projects/$projectId_.agents.construtor.$conversationId.tsx:8`.
  Na referência: `routes/_app/companies/$companyId/data.$copyId.tsx:3-10`; `@tanstack/router-core`
  `src/redirect.ts:102-122` e `src/load-client.ts:1723-1755`.
- **A sessão comum e o Construtor de apps.** Na base: `Wb/conversation/use-session.ts:102-109`, o
  `if (ids.controller === BUILDER_CONTROLLER)` que relê os arquivos do Projeto depois de uma versão
  salva e a Prévia depois de uma Prévia pronta. Sem referência de fora; a forma é a da U1: a
  variante `APP_BUILDER` do `Room` leva o que o agente faz com a mudança, como a variante
  `SAVED_AGENT` leva `writes`, que `chat.tsx:249-250` lê.
- **Os arquivos que misturam dois donos.** Na base: `Wb/agents/queries.ts`
  (`construtorConversationsQuery`, `sendConstrutorModel`), `loader.ts`
  (`loadConstrutorConversation`), `text.ts` (os `CONSTRUTOR_*`, `NO_CONSTRUTOR_CONVERSATIONS`,
  `DRAFT_PANEL`), `area.tsx` (a caixa e as conversas anteriores do Construtor) e `area.test.tsx`
  (os casos delas); as peças que outros agentes leem do Assistente: `Wb/assistant/choice-list.tsx:11`
  (`ROW`), `plus-menu.tsx:115` (`Logo`), `connector-names.ts` (uma passagem de
  `useConnectorCatalog`), e das automações `Wb/automations/page.tsx` (`Page`) e `place.tsx`
  (`PlaceName`). Na referência: o servidor, onde `B/construtor/` importa `B/agents/public.ts` e
  `B/agents/` não importa o Construtor.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `Wb/conversation/use-session.ts`, `room.ts`, `chat.tsx`, `panel.tsx` | Muda, antes do movimento: a sessão perde o ramo `BUILDER_CONTROLLER` e traduz o evento do Mastra no que a corrida mudou; a variante `APP_BUILDER` ganha `changed`, que o painel do Construtor de apps preenche | as quatro conversas |
| `Wb/agents/construtor-queries.ts`, `construtor-loader.ts`, `construtor-text.ts`, `construtor-area.tsx`, `construtor-area.test.tsx`, `construtor-chat.test.tsx` | Cria, antes do movimento, com o que sai de `queries.ts`, `loader.ts`, `text.ts`, `area.tsx` e `area.test.tsx` (os casos da caixa e das conversas anteriores, e os da conversa do Construtor no seu endereço); depois do movimento, recebe os três casos do Construtor de `clean.test.tsx` e `conector-rows.test.tsx` | a conversa do Construtor, a rota da área |
| `routes/.../$projectId_.agents.index.tsx` | Muda, antes do movimento: passa a caixa e as conversas do Construtor à área como encaixe | — |
| `apps/web/src/ui/block.tsx` | Muda, antes do movimento: recebe `ROW` de `choice-list.tsx`, como `choiceRow`, ao lado de `listRow` e `blockRow`: uma classe sem assunto (W5) | o Assistente, o agente salvo |
| `apps/web/src/ui/page.tsx` | Cria, antes do movimento, por `git mv` de `Wb/automations/page.tsx`: a coluna de uma página, sem assunto; `scrolls` diz se ela mesma rola, num quadro compacto | Automações, Agentes do Início |
| `apps/web/src/hub/projects/place-name.tsx` | Cria, antes do movimento: `PlaceName` (o nome do Projeto, ou "Início") sai de `Wb/automations/place.tsx` para o assunto que lê o Projeto | Automações, Agentes do Início |
| `Wb/conversation/logo.tsx` | Cria, antes do movimento: `Logo` sai de `plus-menu.tsx` para perto do catálogo de conectores (`connector-catalog.ts`) | o menu do **+**, as ligações do agente, o chip da ferramenta |
| `Wb/assistant/connector-names.ts` | Apaga, antes do movimento: quem usa o catálogo o importa da porta da sala; o teste dele vai, depois do movimento, para `harness/room/connector-catalog.test.tsx` | — |
| `apps/web/src/harness/room/gone.tsx` | Cria, depois do movimento, por `git mv` de `agents/assistant/gone.tsx`, com o texto `CONVERSATION_GONE`: a tela de conversa não achada é das quatro conversas | as rotas das quatro conversas |
| `apps/web/src/builder/conversation/`, cerca de 70 arquivos fora os testes | Divide pela regra abaixo: para `apps/web/src/harness/room/` (a sala, as linhas, os cartões, a sessão, o registro, os textos comuns) e para `apps/web/src/agents/app-builder/` (o painel, a bancada, a primeira mensagem, a troca de conversa) | todos os embrulhos; a rota de Construir |
| `apps/web/src/builder/preview/`, `source/` | Move inteiras para `apps/web/src/agents/app-builder/preview/` e `source/` | a página de Construir |
| `apps/web/src/builder/assistant/` | Move para `apps/web/src/agents/assistant/`, sem as peças comuns, que saíram antes | as rotas do Assistente |
| `apps/web/src/builder/automations/` | Move para `apps/web/src/agents/assistant/automations/`, como no servidor, sem `Page` e `PlaceName` | a página Automações |
| `apps/web/src/builder/agents/` | Divide pela regra abaixo: para `apps/web/src/agents/agent-builder/` (o Construtor de agentes: a conversa, o painel do rascunho, a caixa e as conversas da área, e as consultas, o carregador e os textos dele) e `apps/web/src/agents/saved-agent/` (a página do agente, o Testar, a lista, e o registro do agente salvo: ler, publicar, apagar) | as rotas de Agentes |
| `apps/web/src/builder/tools/` | Move para `apps/web/src/agents/saved-agent/tools/`, como no servidor (a biblioteca dos agentes salvos) | a aba Ferramentas |
| `apps/web/src/builder/model-accounts/`, `observational-memory/` | Move para `apps/web/src/harness/model-accounts/` e `apps/web/src/harness/memory/` | Configurações |
| `.dependency-cruiser.cjs` `:266-273`, `:283-285` | Muda: `web-tree-shape` aceita `harness/` e `agents/` no lugar de `builder/`; `web-support-does-not-import-subject` lista `hub|harness|agents|routes` | `npm run deps` |
| `.dependency-cruiser.cjs` `subject-only-through-public` | Muda: a isenção vale só para os ajudantes `test-*` da web; um teste lê outro assunto pela porta dele ou por um ajudante (T5) | `npm run deps` |
| `biome.json` `:14`, `:123`, `:228-240`; `scripts/rules.test.ts:60`; `scripts/test-rules.ts:134` | Muda: os caminhos | `npm run lint`, `npm run test:scripts` |
| Os documentos que citam `apps/web/src/builder`, fora `docs/guides/` e os registros (`docs/steps/`, `docs/approvals/`, `docs/decisions/`) | Muda: o caminho | `npm run docs` |
| `docs/guides/web.md` W1, W4, W7 | Não muda nesta unidade: muda no fechamento (U14) | — |
| `apps/web/src/hub/data/read-detail.tsx:54` | Muda: o link aponta para o endereço novo | o Registro de dados |
| `routes/.../$projectId_.agents.construtor.$conversationId.tsx` | Muda: só o `beforeLoad` que redireciona | — |
| `routes/.../$projectId_.agents.agent-builder.$conversationId.tsx` | Cria: a rota com o conteúdo da antiga | os links do Construtor de agentes |
| `packages/hub-api/src/pages.ts` | Muda: o endereço novo entra na lista das páginas que o Hub abre (`PAGES`), ao lado do antigo | o Hub, o `pages.layout.test.ts` |
| `.dependency-cruiser.cjs` | Muda: a regra W7 (`mastra-only-in-builder`, `:187-191`) passa a valer para `apps/web/src/harness/` | `npm run deps` |
| `scripts/codemod-web.ts` e os seus módulos | Cria: o script | o revisor |

O nome de cada arquivo que já diz o que ele é fica; o script não renomeia arquivo, só move e
corrige importações. **A regra da divisão.** Um arquivo vai para o dono do seu assunto, e não para
o lugar de quem o importa. O assunto de um agente mora na pasta dele, mesmo quando outro agente o
usa; só o que os quatro agentes rodam por cima (a sala, as linhas, os cartões, a sessão, o
registro, os textos comuns) mora em `harness/room/`. Um arquivo que mistura dois donos se divide
antes do movimento, num commit que não muda o comportamento; por isso o script só move. Um agente
lê a porta de outro numa direção só: o Construtor de agentes lê a do agente salvo, como no
servidor; o agente salvo nunca lê o Construtor, nenhum outro par de agentes se lê, e `harness/`
nunca lê um agente. Uma peça sem assunto vai para `ui/` (W5). Um teste fica com o assunto que
testa, sem exceção: um arquivo de testes que mistura dois donos se divide como um de código.

O script lê o dono numa tabela: a linha de uma pasta leva os seus arquivos, a linha de um arquivo
leva o arquivo cujo dono não é o da pasta, e vale a linha mais longa. Ele escreve a lista arquivo
por arquivo em `scripts/codemod-web.json`, e o pull request a traz. O grafo das importações é lido
nome a nome pelo compilador do TypeScript (`typescript`, já instalado): cada nome que passa por uma
porta `public.ts` é seguido até o arquivo que o declara, o que o grafo de arquivos do `depcruise
--output-type json` não faz. Com ele o script reescreve cada importação, refaz cada `public.ts` com
os nomes que a cruzam e recusa uma tabela que deixe uma importação de código contra a direção,
listando-a. Cada pasta nova tem o seu `public.ts`, como cada pasta de assunto tem hoje: a regra W4
passa a valer entre `agents/<agente>/`, `harness/` e `hub/`, e a W6 entre `routes/` e as pastas
novas. A direção entre agentes vira regra do `dependency-cruiser` no fechamento, com a W4 nova
(delivery L20). O item 6 do 753 (o comentário de `Wb/assistant/day.tsx:122`) vai num commit à parte
da U3, depois do movimento.

### Os contratos que a unidade cria

Um campo: a variante `APP_BUILDER` do `Room` ganha `changed`, o que o Construtor de apps faz quando a
sua corrida muda algo além do transcrito. A mudança é o tipo `RunChange`: `VERSION_SAVED` relê os
arquivos do Projeto, e `PREVIEW_READY` relê a Prévia. A sessão comum lê o evento do Mastra e o
traduz; o painel recebe só a mudança, nunca a forma do evento (W7). O script: `node
scripts/codemod-web.ts` lê a tabela dos donos, move com `git mv` e reescreve as importações
relativas; roda duas vezes e dá a mesma árvore.

### As skills e a leitura

As da U1, mais `router-core` (`auth-and-guards` para o `beforeLoad`).

### A ordem do trabalho

1. **A sessão sem o ramo do Construtor de apps.** Um commit antes do movimento, sem mudar o
   comportamento. Critérios: 8.
   - **Arquivos:** `use-session.ts`, `room.ts`, `chat.tsx`, `panel.tsx`.
   - **Testes:** o de hoje que prova que uma Prévia pronta relê o Projeto
     (`preview-line.test.tsx`), sem mudar, e um caso novo em `workbench.test.tsx`: a versão que a
     resposta salva relê o código do Projeto, que nenhum teste provava.
   - **Mutações à mão:** a sessão sem a chamada de `changed` deixa esses casos vermelhos.
2. **A divisão por dono.** Um commit antes do movimento, sem mudar o comportamento. Critérios: 8.
   - **Arquivos:** os que o raio marca "antes do movimento", fora os do passo 1.
   - **Testes:** os mesmos casos da web, no mesmo número.
3. **O script e o movimento.** Critérios: 8.
   - **Arquivos:** cria `scripts/codemod-web.ts` e a lista `scripts/codemod-web.json`; move as
     pastas; muda as regras e os caminhos da tabela acima no mesmo commit.
   - **Testes:** a contagem dos testes da web antes e depois, no pull request; `npm run deps`.
4. **A rota nova e a antiga.** Critérios: 9.
   - **Referência a seguir:** `data.$copyId.tsx:3-10`, sem `replace`, que o router já força.
   - **Testes:** `agents/agent-builder/route.test.tsx`.
5. **A regra W7.** Critérios: 8.
   - **Mutações à mão:** importar `@mastra/client-js` em `apps/web/src/agents/assistant/` deixa
     `npm run deps` vermelho.

### Como se prova

O script rodado de novo sobre a base do movimento (o commit da divisão por dono) dá a mesma árvore
(`git diff --exit-code`); os testes da web passam com o mesmo número de casos; `npm run deps` passa
e fica vermelho com a mutação.

### Parar se

- Um arquivo não couber em nenhuma linha da tabela, ou o script recusar uma importação contra a
  direção: parar e listar, com o que o arquivo importa e quem o importa. A tabela muda pelo cartão;
  o script nunca ganha uma exceção.

## G2 O ponto de conferência

O script rodado pelo revisor; `npm run check`; o Hub local abre as quatro conversas e o endereço
antigo.

## U4 Os nomes na tela e o menu do Projeto

**Base e modelo.** O commit de G2 no `main`. Sonnet: textos e um menu em grupos.

**O protótipo.** Feito e aprovado pelo fundador em 2026-11-24 (a seção "O protótipo aprovado", na
matriz de estados). A U4 refaz as telas pelo cartão, e o QA as compara com as capturas aprovadas.

### As linhas da tabela

- **Quem assina a resposta.** `Wb/conversation/builder-turn.tsx:128`. Na referência:
  `LC/packages/chat/src/components/messages/MessageParts.tsx:51-62`.
- **Os nomes dos construtores.** Os textos: `room.ts:84` (`agent: 'Builder'`),
  `preview-line.tsx:44`, `Wb/agents/text.ts:9,11,34,123`, `Wb/agents/area.tsx:109`,
  `Wb/tools/text.ts:5`, `Wb/assistant/text.ts:105,111,113`, `apps/web/src/hub/apps/data.tsx:13`,
  `apps/web/src/hub/apps/versions.tsx:92`, `apps/web/src/hub/data/text.ts:14-15`,
  `apps/web/src/hub/connectors/text.ts:219,224`,
  `routes/_app/companies/$companyId_/welcome/model-account.tsx:20`, as vitrines
  `apps/web/src/ui/showcase/ai-cards.tsx:12,74,260` e `ai-lines.tsx:209,225,232`; as frases de
  `packages/hub-api/src/conversation-failures.ts:66,74,81,106,122,138,147,155`,
  `app-failures.ts:54,62,70,79,88,96,132`, `assistant-failures.ts:44`, `agent-failures.ts:23`. Os
  caminhos são os da base de G1; a U3 os move.
- **O menu do Projeto em grupos.** `apps/web/src/hub/projects/project-rail.tsx:84-152`;
  `apps/web/src/ui/sidebar.tsx:242-300`; o mapa, `docs/explanation/mapa.md:126-134`.
- **A fila de contas de modelo vale para os quatro.** `Wb/model-accounts/model-fallback.tsx:83`,
  `queue.tsx:62`, `routes/_app/companies/$companyId_/settings/model-accounts.tsx:18`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| os arquivos de texto acima | Muda: os nomes | as telas |
| `packages/hub-api/src/*-failures.ts` | Muda: as frases | a web, que as mostra |
| `apps/web/src/hub/projects/project-rail.tsx` | Muda: quatro `SidebarGroup` com `SidebarGroupLabel`, na ordem do mapa | o quadro do Projeto |
| `apps/web/src/hub/projects/new-project.test.tsx:79` | Muda: o nome do teste (item 3 do 753) | — |
| `apps/web/src/harness/names.test.ts` | Cria | — |
| os testes de tela que afirmam os textos velhos (entre eles `cards.test.tsx`, os `propose*.test.tsx`, `start.test.tsx`, `model-accounts.test.tsx`, `preview-line.test.tsx`, `data.test.tsx`, `data-reads.test.tsx`, `tools-tab.test.tsx`) | Muda: a asserção passa ao texto novo, e só ela | — |
| `tests/e2e/conversation.test.ts:206,223,233,249,288`, `tests/e2e/conversation-journey.ts:172,249`, `tests/e2e/model-accounts.test.ts` | Muda: os textos que a jornada procura ("Mensagem para o Builder", "Conversa com o Builder", "Builder trabalhando") | o e2e |
| `apps/web/sweep-*.ts` que procuram os textos velhos | Muda: os textos | as varreduras de tela |

### Os contratos que a unidade cria

Nenhum tipo novo. Os grupos do menu numa constante, a dona da ordem (C26):

```ts
// apps/web/src/hub/projects/project-rail.tsx
const RAIL: readonly { group: 'O app' | 'Agentes' | 'Dados' | 'O Projeto'; items: readonly RailItem[] }[]
```

O nome de quem fala num lugar só: `apps/web/src/harness/room/text.ts` ganha `CONEXUS = 'Conexus'`,
lido pelos construtores das três salas da plataforma (`APP_BUILDER`, `ASSISTANT`, `AGENT_BUILDER`) e
pelos textos que citam quem responde (C26). A sala `SAVED_AGENT` usa o nome do agente. A cabeça da
resposta escolhe o sinal pelo `kind`: a marca nas três, o ícone de agente no `SAVED_AGENT`. A linha
`mark` do `DESIGN.md` muda no mesmo commit (V62).

### As skills e a leitura

As da U1, mais `shadcn` (a peça `Sidebar`), e `docs/guides/design.md` (V61 para o título do grupo,
V62) e [Impeccable](../reference/impeccable.md).

### A ordem do trabalho

1. **Os nomes num lugar.** Critérios: 10, 11.
   - **Arquivos:** `CONEXUS`; os textos da lista acima e da tabela aprovada; `builder-turn.tsx:128`
     passa a mostrar `room.agent` sem o caso do "Conexus", e a cabeça da resposta escolhe a marca ou o
     ícone de agente pelo `kind`; a linha `mark` do `DESIGN.md`.
   - **Testes:** a cabeça da resposta, um caso por sala; `names.test.ts`, que lê os módulos de texto
     da web e as frases de falha e recusa "Builder", "Construtor" e "Assistente".
   - **Mutações à mão:** pôr a marca no lugar do ícone de agente no `SAVED_AGENT` deixa vermelho o
     caso do agente salvo; deixar um "Builder" em `app-failures.ts` deixa `names.test.ts` vermelho.
2. **As contas de modelo.** Critérios: 13.
   - **Arquivos:** os três textos dizem "os agentes" (a decisão 7 do firstmate).
3. **O menu em grupos.** Critérios: 12, 15.
   - **Arquivos:** `project-rail.tsx`; o teste novo `project-rail.test.tsx`.
   - **Referência a seguir:** `sidebar-conversations.tsx:201` (o uso de `SidebarGroupLabel` que já
     existe).
   - **Testes:** um caso de dono (quatro títulos, oito itens na ordem) e um de membro sem as três
     permissões (nenhum título sozinho).
   - **Mutações à mão:** trocar a ordem de "Dados" e "O Projeto" em `RAIL` deixa vermelho o caso
     de dono; mostrar "Automações" a quem não tem `manageAutomations` deixa vermelho o de membro.
4. **Os testes que afirmam os textos.** Critérios: 11, 13. Cada asserção de texto velho passa ao
   novo; nenhuma outra asserção muda. `rg -l 'Builder' apps/web/src tests/e2e apps/web/sweep-*.ts`
   lista o que falta.
5. **O protótipo, lado a lado.** Critérios: 15.
   - **Testes:** QA (T25), a 1366 e a 390 px, nos dois temas, cada tela ao lado da caixa aprovada.

### Como se prova

`names.test.ts` falha na base (os textos listados em "As linhas da tabela"); o teste do menu falha
na base (sem títulos); o QA compara com o protótipo. Nenhum retrato do servidor muda nesta unidade:
a frase da ferramenta do Assistente é da U15.

### Parar se

- Um texto que cita um agente não couber no nome novo (um botão que passa da largura a 390 px):
  voltar ao protótipo.
- Um teste precisar mudar mais que a asserção do texto.

## G3 O ponto de conferência

O Hub local com os dublês: o menu do Projeto de um dono e de um membro, as quatro conversas com a
cabeça da resposta, as contas de modelo; QA (T25) com o protótipo ao lado; `npm run check`; o e2e
das jornadas de conversa e de contas de modelo, que o CI roda.

## A parte do servidor

Começa quando o G3 do `A1` entrar no `main`. O G3 só muda documentos, então as linhas abaixo,
lidas em `2a16091d`, valem no começo do G4; quem abre o G4 roda de novo o script que compara cada
`arquivo:linha` desta parte entre `2a16091d` e o commit base, e relê à mão cada linha que mudou.
Todas as unidades desta parte têm a mesma prova de fundo: os cinco `request.test.ts`
(`B/conversation/`, `B/assistant/`, `B/construtor/`, `B/agents/`, `B/controller-kit/`) passam
sem regravar, salvo onde o critério diz outra coisa.

## U5 A máquina sem o caminho morto

**Base e modelo.** O commit do `main` com o G3 do `A1`. Sonnet: só apaga e troca um padrão de
dublê.

### As linhas da tabela

- **A máquina só pelo caminho nativo.** Na base: `B/machine/sandbox-filesystem/copy.ts` (98
  linhas), `files.ts` (148), `listing.ts` (157), os ramos de shell de `filesystem.ts` (`readShell`
  `:189`, `writeShell` `:199`, `deleteShell` `:225`, `copyShell` `:237`, `moveShell` `:249`,
  `readdirShell` `:294`, `statShell` `:342`), `B/machine/test-machine.ts:77,111` (`native: false`)
  e o ramo `:144`. Na referência: `mastracode/sdk/src/agents/sandbox-filesystem.ts:434-440`;
  `@mastra/e2b` 0.17.0 `dist/index.js:1588-1591`.
- **A opção `instructions`.** `B/machine/kit.ts:103`, `e2b.ts:47`, `machines.ts:239`,
  `conversation.ts:261`.
- **Os donos repetidos (issue 235).** `B/machine/scripts.ts:17` (`CANDIDATE_REF`), `:19`
  (`quoted`), `:24` (`IDENTITY`); `B/machine/sandbox-filesystem/shell.ts:73` (`shellQuote`);
  `B/git/repository.ts:27-28`; `readCapped` em `kit.ts:52` e a cópia em `conversation.ts`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `B/machine/sandbox-filesystem/` | Apaga o caminho por shell; `filesystem.ts` fica com o nativo, o limite de pastas, `walk` e `grep` | `B/machine/machines.ts`, `conversation.ts` |
| `B/machine/kit.ts`, `e2b.ts`, `machines.ts`, `conversation.ts` | Muda: sai `instructions` | os quatro agentes, pela máquina |
| `B/machine/scripts.ts`, `B/git/repository.ts` | Muda: um dono para `quoted`, `CANDIDATE_REF` e `IDENTITY` | a máquina e o git |
| `B/machine/test-machine.ts` | Muda: `native: true` por padrão | os testes da máquina |

### Os contratos que a unidade cria

Nenhum. Sai a opção `instructions` de `KitOptions`.

### As skills e a leitura

`@mastra/core`, `@mastra/e2b`, `e2b` em `docs/reference/stack.md`: skill `mastra`; ler primeiro
`node_modules/@mastra/e2b/dist/` e a decisão 0051. A issue 1326 (a máquina que expira no meio do
turno) é contexto, não trabalho desta unidade.

### A ordem do trabalho

1. **O dublê no caminho nativo.** Critérios: 16.
   - **Testes:** `B/machine/machine*.test.ts` com `native: true`; o que só passava pelo shell
     muda de alvo ou sai, e o pull request lista cada caso.
2. **O shell sai.** Critérios: 16.
   - **O que sai:** os três arquivos e os ramos de `filesystem.ts`, com cada chamador.
   - **Mutações à mão:** devolver `native: false` ao dublê faz os testes que leem pelo shell
     falharem por falta do ramo.
3. **`instructions` e os donos repetidos.** Critérios: 16.
   - **Pronto quando:** `rg 'instructions' apps/server/src/builder/machine` não acha a opção, e
     cada um dos três fatos tem um dono.

### Como se prova

Os testes da máquina e os cinco retratos. O critério 16 falha na base porque o dublê ainda roda
pelo shell.

### Parar se

- Um caminho de produção (não de teste) ainda passar pelo shell: a E2B sem `filesystem` não existe
  na 0.17.0 (`dist/index.js:1588-1591`); se aparecer, parar.

## U6 A ficha sem o que repete o Mastra

**Base e modelo.** O mesmo commit da U5. Sonnet: apaga campos e troca um uso por um sinal nativo.

### As linhas da tabela

- **A ficha sem `base`.** `B/controller-kit/spec.ts:87-88`, `mount.ts:137-145` e `:178`,
  `B/conversation/builder.ts:139`, `spec.test.ts:265`; o sinal do Assistente em
  `B/assistant/assistant.ts:244`. Na referência: `mastracode/sdk/src/index.ts:1304`, `:1496-1500`.
- **A ficha sem os campos que só repassam.** `spec.ts:28-38`, `:86`, `:96-99`; `mount.ts:51-61`,
  `:162`, `:171-174`; `turns.ts:73,80,124`. Na referência: `packages/core/src/agent/types.ts:640`,
  `:834`, `:873`, `:931`, `:1010` na prateleira.
- **A ordem do `researchOnly` do Assistente (issue 1285).** `B/assistant/assistant.ts`
  (`processors.beforePick`): um teste que falha se a pesquisa sair de antes da escolha de conta.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `B/controller-kit/spec.ts`, `mount.ts`, `turns.ts` | Muda: saem `base`, `agentOfBase`, `ended`, `ONE_STRING`, `DELEGATED` e o repasse | os quatro agentes |
| `B/conversation/builder.ts`, `B/agents/controller.ts`, `B/assistant/assistant.ts`, `B/construtor/construtor.ts` | Muda: as fichas | `mount` |

### Os contratos que a unidade cria

```ts
// B/controller-kit/spec.ts
export type AgentSpec = Pick<AgentConfig, 'description' | 'skills' | 'signals' | 'scopes' | 'knowledge'> & {
  // os campos que são do Conexus, como hoje, menos `base` e o `Prompt` de três formas
}
```

O `Prompt` fica com uma forma de cada fonte (C21); `OF_RUN` absorve `ONE_STRING` e `DELEGATED`
se o retrato provar que o texto é o mesmo.

### As skills e a leitura

`mastra`; ler primeiro `node_modules/@mastra/core/dist/docs/` (agentes, sinais).

### A ordem do trabalho

1. **`base` sai.** Critérios: 17. O Construtor de apps ganha `signals: [new TaskSignalProvider()]`
   na ficha; o retrato dele não muda.
2. **`ended` e o repasse saem.** Critérios: 17.
3. **A ordem do `researchOnly`.** O teste da issue 1285.
   - **Mutações à mão:** pôr a pesquisa depois de `accountPick` deixa o teste novo vermelho.

### Como se prova

`spec.test.ts` e os cinco retratos; o teste da 1285, que hoje não existe.

### Parar se

- Um retrato mudar: o repasse não era só repasse; parar e mostrar o diff.

## U15 A frase do botão e o agendador que não apaga

**Base e modelo.** O mesmo commit da U5, depois do fechamento do `A1`. Sonnet: duas mudanças
pequenas, cada uma num commit, com um retrato regravado.

### As linhas da tabela

- **A frase da ferramenta do Assistente.** `B/assistant/propose.ts:36-42`: as duas descrições
  citam o botão "Mandar ao Builder" (`description` e `next` de `change`). Só o nome do botão muda,
  para o texto novo, "Mandar para Construir";
  o resto do texto que o modelo lê, "Builder" incluído, fica igual byte a byte (a etapa não muda o
  pedido de nenhum agente, e o nome do agente no pedido é do `A3`). Só a skill `conexus` troca o
  nome do botão no fechamento, com a asserção em `instructions.test.ts` (emenda de 2026-11-25). Os
  testes que afirmam a frase:
  `B/assistant/propose.test.ts:95,110`, `B/assistant/instructions.test.ts:165`.
- **O agendador que não apaga.** `schedulerOf` (`B/mastra/mastra.ts:14-21`) não passa
  `missesBeforeDelete`. Na referência: `@mastra/core` 1.83.0 `dist/worker-DCnErilX.js:342-348`
  (`isTargetReady`: falso quando o fluxo não está registrado), `dist/scheduler-DOueSa7x.js:217-240`
  (conta as faltas seguidas, avisa na primeira e apaga ao chegar ao número); `dist/scheduler-DOueSa7x.js:7`
  (`DEFAULT_TICK_INTERVAL_MS`, 10 000 ms) e `:9` (`DEFAULT_MISSES_BEFORE_DELETE = 3`); na prateleira,
  `workflows/scheduler/types.ts:147-154`, `scheduler.ts:12` e `:282-335`. O caso real é o de
  `B/automations/run.ts:22-27`: renomear um fluxo apaga as automações dele na terceira falta, uns 30
  segundos.
- **A poda que não terminou.** `B/mastra/retention.ts:26-29` devolve `done: false` sem deixar
  rastro (RET-1 da auditoria).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `B/assistant/propose.ts` | Muda: "Mandar ao Builder" vira "Mandar para Construir", nas duas frases de `change` | o Assistente |
| `B/assistant/requests/*.snapshot` | Muda: regravados | `B/assistant/request.test.ts` |
| `B/assistant/propose.test.ts`, `instructions.test.ts` | Muda: a frase afirmada | — |
| `B/mastra/mastra.ts` | Muda: `schedulerOf` passa `missesBeforeDelete` | `createMastra` |
| `B/mastra/retention.ts` | Muda: a linha `RETENTION_STILL_DRAINING` quando `done` é falso | o fluxo da poda |
| `docs/explanation/agents-and-automations.md` | Muda: a frase do contrato de que renomear um fluxo não apaga as automações em segundos | — |

### Os contratos que a unidade cria

```ts
// B/mastra/mastra.ts
/** Ticks an automation whose workflow is missing survives before Mastra deletes it. */
const MISSES_BEFORE_DELETE = 5
```

Uma constante com um dono (C26). O valor 5 é o do teste da auditoria (FERR-7); um valor maior só
adia o apagamento; o firstmate o registra na decisão 12. A linha nova `RETENTION_STILL_DRAINING`
leva só o nome do passo, nunca um dado (security S40).

### As skills e a leitura

`mastra`; ler primeiro `node_modules/@mastra/core/dist/docs/` (o agendador de fluxos).

### A ordem do trabalho

1. **A frase do botão.** Critérios: 14.
   - **Arquivos:** `propose.ts`; os retratos com `--test-update-snapshots`; os dois testes.
   - **Pronto quando:** o diff dos retratos mostra só as duas frases, e
     `git diff -- 'apps/server/src/builder/{conversation,construtor,agents,controller-kit}/requests'`
     está vazio.
2. **O agendador.** Critérios: 19.
   - **Testes:** `B/mastra/mastra.test.ts`, uma agenda cujo fluxo não está registrado sobrevive a
     quatro tiques e é apagada no quinto, com o relógio do agendador; `retention.test.ts`, o caso
     `done: false`.
   - **Mutações à mão:** tirar `missesBeforeDelete` deixa vermelho o caso dos cinco tiques; tirar a
     linha de log deixa vermelho o caso `done: false`.

### Como se prova

O retrato do Assistente muda só nas duas frases; os outros quatro não mudam; os dois casos novos
falham na base.

### Parar se

- O retrato do Assistente mudar em mais que as duas frases.
- O agendador da 1.83.0 não deixar o teste controlar o tique (`tickIntervalMs`) sem dormir: parar
  e dizer o que o teste precisa.

## G4 O ponto de conferência

`npm run quality`, `npm run check`, os testes da máquina, de `controller-kit`, de `B/mastra/` e de
`B/assistant/`, os cinco retratos; um turno de cada agente no Hub local com os dublês.

## U7 O codemod do servidor

**Base e modelo.** O commit de G4 no `main`. Sonnet: um script por área, sem mudar lógica.

### As linhas da tabela

- **A árvore do servidor.** A árvore aprovada (estudo 2, seção 2.8):

  ```text
  apps/server/src/
    harness/   spec/ turn/ memory/ prompt/ routes/ tools/ mastra/ model-accounts/ machine/
    agents/    app-builder/ (hoje conversation, runs, git)  assistant/ (com automations)
               agent-builder/ (hoje construtor)  saved-agent/ (hoje agents e tools)
  ```

  O guarda e o stream (`B/conversation/guard.ts`, 366 linhas; `stream.ts`, 191) servem os quatro
  (`guard.ts:69-73`) e vão para `harness/routes/`. As constantes com o nome de quem chegou
  primeiro mudam de nome: `BUILDER_ROUTES` (`packages/hub-api/src/conversations.ts:11`),
  `BuilderSession` (o do servidor, `B/assistant/handoff.ts:30`, e o da web, já movido pela U3),
  `BUILDER_TOOL` (`packages/hub-api/src/tools.ts`); o id que o modelo vê não muda
  (`connector_read` fica).
- **O agendador que não apaga.** `B/mastra/mastra.ts:14-21`, usado em `:42`. Na referência:
  `packages/core/src/workflows/scheduler/types.ts:147-154` e `scheduler.ts:282-335` na prateleira.
- **Os pré-requisitos do MA-8.** `biome.json:182-184` (as três exceções do relógio),
  `scripts/record-models.ts:15`, `scripts/record-provider.ts:36`, `docs/reference/boundaries.md`
  e o choque de nome `Turn` (`B/model-accounts/turn.ts`).
- **As regras do `dependency-cruiser`.** `.dependency-cruiser.cjs:23` (`AGENTS_AND_APPS`, sem
  `machine`, `model-accounts`, `mastra`, `runs`, `git`) e `:187-191` (W7); a página da trilha diz
  que `builder/mastra/` e `builder/model-accounts/` são da Plataforma
  (`docs/steps/trilhas/agentes-e-apps.md:86-87`): com a árvore nova eles moram em `harness/`, e a
  regra e a página mudam juntas.

### O raio da mudança

| Pull request | Move | Muda junto |
| --- | --- | --- |
| G5a | `B/mastra/` para `harness/mastra/` | nada além dos caminhos: o agendador mudou antes, na U15 |
| G5b | `B/model-accounts/` para `harness/model-accounts/` | os caminhos do MA-8; `Turn` vira `AccountTurn` |
| G5c | `B/machine/` para `harness/machine/` | o dublê `assistantMachines` vira `conversationMachines` (issue 808) |
| G5d | `B/controller-kit/`, `B/controller-context/` e o comum de `B/conversation/` (o guarda, o stream, o turno, a memória, o prompt) para `harness/spec/`, `turn/`, `memory/`, `prompt/`, `routes/`; `B/schema/` (o `pgSchema('builder')` e os escopos das tabelas) para `harness/schema/`. `B/conversation/end.ts` divide-se num commit antes do movimento: o que é comum aos quatro (o vigia, a falha comum, o pensamento, a fase, a espera do desligamento) e `turn-line.ts` vão para `harness/turn/end.ts`, com a porta `TurnEnds` que o agente preenche | `BUILDER_ROUTES` e `BuilderSession` com nomes novos |
| G5e | `B/company-tools/`, `B/data-tools/`, `B/connectors/` e `B/app-data/` para `harness/tools/` (a árvore aprovada: "as ferramentas em comum"); `B/tools/`, a biblioteca dos agentes salvos, vai com o agente salvo no G5f | — |
| G5f | os quatro agentes para `agents/app-builder/` (com `runs/` e `git/`, e o `end.ts` com `builderEnds`, o que preenche a porta `TurnEnds`), `agents/assistant/` (com `automations/`), `agents/agent-builder/`, `agents/saved-agent/` (com `tools/`) | o item 2 do 753 (`handoff.test.ts:285-288`), num commit à parte |

Cada área muda também `.dependency-cruiser.cjs`, `biome.json` (`:180-184`, `:198-214`) e
os documentos que citam o caminho que ele move (47 arquivos de documento e configuração citam
`apps/server/src/builder` hoje). O G5d renomeia `BUILDER_ROUTES` e o `BuilderSession` do servidor,
e o G5e renomeia `BUILDER_TOOL`: os arquivos de `packages/hub-api/src/` e de `apps/web/src/` que os
importam mudam no mesmo pull request, só no nome importado.

### Os contratos que a unidade cria

Um tipo novo: a porta `TurnEnds` de `harness/turn/end.ts`, que o commit de divisão do G5d cria
antes do movimento e que o Construtor de apps preenche com `builderEnds(runs)`. O script:
`node scripts/codemod-server.ts <área>` lê a tabela da área, move com `git mv`, reescreve as
importações e os caminhos citados em `docs/`; rodado duas vezes, dá a mesma árvore. Ele segue a regra da divisão da U3: cada arquivo vai para o dono do seu assunto, um
arquivo que mistura dois donos se divide num commit antes do movimento, e o grafo das importações
é lido nome a nome pelo compilador do TypeScript.

### As skills e a leitura

`mastra`, `fastify-best-practices` (o guarda muda de pasta), `pstack:typescript-best-practices`.
Ler primeiro `docs/guides/testing.md` (T26, os retratos).

### A ordem do trabalho

1. **O script.** Critérios: 18. Um commit, com a tabela das seis áreas.
2. **G5a a G5e, um commit por área no G5-harness, e G5f no G5-agents.** Critérios: 18, 19.
   - **Testes:** a contagem antes e depois; os cinco retratos sem regravar; `npm run deps`.
   - **Mutações à mão:** na G5a, tirar `missesBeforeDelete` deixa vermelho o caso novo de
     `harness/mastra/mastra.test.ts`; em cada área, importar `@mastra/*` de fora das pastas que a
     regra nova permite deixa `npm run deps` vermelho.

### Como se prova

Por área: o script de novo com `git diff --exit-code`, a contagem dos testes, os retratos
sem regravar, `npm run deps`. No fim: `ls apps/server/src/builder` falha.

### Parar se

- Um arquivo for comum a dois agentes e não estiver na árvore aprovada, ou o script recusar uma
  importação contra a direção da U3: parar e listar, com quem o importa; o script nunca ganha uma
  exceção.
- Mover um arquivo mudar um retrato: um caminho entrou no texto que o modelo lê; parar.

## G5 O ponto de conferência

Em cada um dos dois pull requests: `npm run check`, os testes do servidor da área, o script rodado
pelo revisor. Depois do G5f: um turno de cada agente no Hub local.

## U8 As marcas da conversa por um esquema só

**Base e modelo.** O commit do G5f. Sonnet.

### As linhas da tabela

- **As marcas.** Na base (caminhos de antes do G5): `B/controller-kit/run.ts:50` (`RUN_MARKS`),
  `:80` (`ASSISTANT_MARK`), `:99` (`CONSTRUTOR_MARK`), `:113` (`AGENT_MARK`), `:134` (`MARKS`),
  `:142` (`marksOf`); o quarto leitor, `B/assistant/open.ts:65-79` (`AutomationMarks`). Na
  referência: `mastracode/factory/src/tools/scope.ts:52-80` (a marca conferida contra a linha
  guardada).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `harness/spec/run.ts` | Muda: um `markSchema` sobre `RUN_MARKS`; saem os três esquemas | `held` do guarda, os quatro agentes |
| `agents/assistant/open.ts` | Muda: sai `AutomationMarks` | as automações |

### Os contratos que a unidade cria

```ts
// harness/spec/run.ts
export function markSchema<K extends ControllerKind>(kind: K): z.ZodType<MarksOf<K>>
```

As chaves gravadas não mudam (são dado). C27.

### As skills e a leitura

`zod`; `mastra` (a memória e os metadados do fio).

### A ordem do trabalho

1. **O teste antes.** Critérios: 20. Uma conversa de cada tipo gravada com as chaves de hoje, lida
   pelo esquema novo e pelo de hoje, com o mesmo resultado.
2. **O esquema.** Critérios: 20.
   - **Mutações à mão:** tirar uma chave obrigatória do esquema do Construtor de agentes deixa
     vermelho o caso da marca que falta.

### Como se prova

`harness/spec/run.test.ts`; o critério falha na base porque o teste não existe.

### Parar se

- Uma conversa gravada tiver uma chave que nenhum esquema de hoje lê: é dado, não se apaga; parar.

## U9 A máquina montada uma vez

**Base e modelo.** O commit de U8. Sonnet: a forma já está decidida abaixo, e a unidade só move
linhas que três agentes repetem. Subir para Opus só se a montagem do `Workspace` pedir mexer na
concorrência da máquina (`inLane`), e dizer por quê.

**A emenda de 2026-11-25.** A U9 ficou fora do G6 (pull request 1368) porque o texto da primeira
versão não fechava: o `MachineSpec` usava `FilesGo`, um tipo da web
(`apps/web/src/harness/room/attachments.ts:10`) que o servidor não tem e que diz para onde vai um
anexo, não o que é a máquina; `network: 'CHECK'` não tinha leitor, porque a conferência do `A1`
(`closeAgain`, `networkOpen`) vive no ciclo do Projeto em `harness/machine/machines.ts`; o
`mountAgent` devolve só `{ agent, controller }` e não alcança o que a AGT-1 quer tirar dos agentes
(`ends.onPhase`, `close`, `each`), que mora no `Part` de `harness/mastra/hub-mastra.ts`; e o agente
salvo cria a máquina entre o registro e o `mountAgent`. A revisão do G6 e a proposta da U9 (fora do
repositório, delivery L21) deram três caminhos, e o fundador escolheu o (b), a proposta sem a
quarta peça (a máquina como campo da ficha), em 2026-11-25: "3. Okay, mas quero entender", ao item
"A emenda do cartão do harness, U9 e U10: a revisão recomenda a proposta sem a quarta peça (a
máquina como parâmetro do construtor, e a ficha com o workspace nativo do Mastra)". Esta seção é a
emendada. A ficha segue com o campo nativo `workspace` (`harness/spec/spec.ts`, o
`AgentControllerConfig['workspace']` do Mastra), que os três agentes já preenchem; `MachineSpec` não
entra na `ConversationSpec`, e `harness/spec` não importa `harness/machine` (sem ciclo, porque
`harness/machine` já importa `NEVER_ASKS` de `harness/spec`). O `Workspace` por sessão no Construtor
de apps fica de fora: muda a sonda de busca a cada turno, é mudança de comportamento e não de
forma, e vem depois, com medida.

### As linhas da tabela

- **A máquina montada uma vez.** Na base (caminhos de antes do G5): `B/machine/machines.ts:268`
  (o `new Workspace` do Construtor de apps, `new SandboxFilesystem` em `:273`, `workspaceFor` em
  `:258`), `B/machine/conversation.ts:288` (o dos outros três) e `:296`; as três chamadas de
  `createConversationMachines` (`B/agents/controller.ts:233`, `B/construtor/construtor.ts:300`,
  `B/assistant/assistant.ts:276`); as três `machineMarks`; as três linhas do `part` de cada agente
  (`ends.onPhase`, `close`, o `each` do release); `B/assistant/release.ts`. Na referência:
  `mastracode/sdk/src/index.ts:1801-1802`, `:1852`; `mastracode/sdk/src/agents/workspace.ts:226-256`;
  `mastracode/factory/src/workspace.ts:1798-1830`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `harness/machine/workspace.ts` | Cria: `workspaceOf`, a única montagem do `Workspace` | `machines.ts`, `conversation.ts` |
| `harness/machine/part.ts` | Cria: `machinePart(machines)` | os três agentes |
| `harness/machine/spec.ts` | Cria: `MachineSpec`, o parâmetro do construtor | os três agentes |
| `harness/machine/marks.ts` | Cria: `machineMarksOf` | os três agentes |
| `harness/machine/machines.ts`, `conversation.ts` | Muda: chamam `workspaceOf`; `createConversationMachines(spec, deps)` | os agentes |
| `agents/{assistant,saved-agent,agent-builder}/` | Muda: a chamada leva o `MachineSpec`, o `part` leva `...machinePart(machines)`, as marcas saem por `machineMarksOf`; `agents/assistant/release.ts` sai | — |
| `agents/app-builder/runs/runs.ts` | Sem mudança: `#openWorkspace` chama `workspaceFor`, que passa a chamar `workspaceOf` | — |

### Os contratos que a unidade cria

```ts
// harness/machine/spec.ts: o parâmetro do único construtor, sem variante PROJECT e sem campo da ficha
export type MachineSpec = {
  hosts: readonly string[]
  otherTemplate: 'resume' | 'replace'
  readMedia?: readonly string[]
  /** A função de cada agente: o agente salvo devolve `undefined` quando a versão não tem Computador. */
  marks(requestContext: RequestContext): Promise<Record<string, string> | undefined>
}
// harness/machine/conversation.ts
export function createConversationMachines(spec: MachineSpec, deps: ..., tuning?: MachineTuning): ConversationMachines
// harness/machine/workspace.ts
export function workspaceOf(parts: { name; ensure; instructions; filesystem; neverAsks; readMedia? }): Workspace
// harness/machine/part.ts
export function machinePart(machines: ConversationMachines): { ends: { onPhase }; close; each }
// harness/machine/marks.ts
export function machineMarksOf(where: { companyId; projectId?; agentId? }): Record<string, string>
```

Sem `FilesGo`, sem `network: 'CHECK'` e sem `ConversationSpec.machine`. O `RunScope` não ganha
`agentId`: as marcas do agente salvo vão como a função do `MachineSpec`. A conferência do `A1`
continua no ciclo do Projeto; se o fundador quiser que a ficha diga "esta máquina fecha a rede na
conferência", é outra emenda.

### As skills e a leitura

`mastra`, `@mastra/e2b`; ler primeiro a decisão 0051 e o cartão do `A1` no histórico (a conferência
na máquina). `WorkspaceConfig` e `AgentControllerConfig['workspace']` no `@mastra/core` instalado
(`dist/workspace`, `dist/agent-controller`).

### A ordem do trabalho

1. **O teste antes.** Critérios: 21. Um teste por agente que abre, usa e solta a máquina pela
   montagem.
2. **Uma montagem.** Critérios: 21. `workspaceFor` e a montagem de `conversation.ts` viram uma,
   `workspaceOf`; o que as duas diferem (`verifySymlinks`, `neverAsks`, `readMedia`, o texto das
   instruções) entra como parte.
3. **O `part` dos agentes.** Critérios: 21. `machinePart(machines)` no lugar das três linhas;
   `agents/assistant/release.ts` sai e o Assistente chama `releaseByMarks`, como os outros dois.
   - **Mutações à mão:** esquecer de soltar a máquina no apagar do Assistente deixa vermelho
     `agents/assistant/routes.test.ts`.
4. **As marcas.** Critérios: 21. As três `machineMarks` passam por `machineMarksOf`, e a chamada de
   cada agente leva o `MachineSpec`.

### Como se prova

Os testes por agente de `agents/*/machine.test.ts`, os cinco retratos sem regravar, e um turno do
Construtor de apps com a conferência no navegador do `A1` no Hub local.

### Parar se

- A conferência do `A1` precisar de um estado da máquina que `workspaceOf` não diga: parar.
- Um retrato mudar, ou a ordem das chaves das ferramentas do `Workspace` mudar: parar.

## U10 Uma lista de ferramentas e um "nunca pergunta"

**Base e modelo.** O commit do G5f (que vem depois do G5d e do G5e). Sonnet.

### As linhas da tabela

- **Uma lista de ferramentas.** Na base (antes do G5): `B/conversation/permissions.ts` (os quatro
  `Set` e `TOOL_CLOSURE`, usados em `B/conversation/builder.ts:165`), `B/company-tools/names.ts:18-39`,
  `B/assistant/available-tools.ts:23-39`, `B/construtor/construtor.ts:69-77` (passado em `:281`),
  `B/controller-kit/factories.ts:106-139` (`off` em `:120-125`); `CLOSED_TOOLS`
  (`packages/hub-api/src/tools.ts:65`). Na referência: `mastracode/sdk/src/agents/tool-availability.ts:140`,
  `:166`; `packages/core/src/agent-controller/agent-controller.ts:2160-2215`, `:2575-2579`.
- **Um "nunca pergunta".** `B/controller-kit/mount.ts:87`, `:99-110`; `B/agents/tools.ts:96`;
  `B/machine/conversation.ts:296`. Na referência:
  `packages/core/src/loop/workflows/agentic-execution/tool-approval-verdict.ts:85-93`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `harness/tools/` | Muda: uma lista por agente, de `CLOSED_TOOLS` (Construtor de apps) e de `TOOLS_OF[seat]` mais as ferramentas próprias (os outros) | a ficha |
| `agents/app-builder/permissions.ts` | Apaga os quatro `Set` e o teste de igualdade (`permissions.test.ts:261`) | — |
| `agents/saved-agent/tools.ts`, `harness/machine/conversation.ts` | Muda: as duas cópias do "nunca pergunta" saem | — |

### Os contratos que a unidade cria

**A emenda de 2026-11-25.** A revisão do G6 achou que `availableTools: readonly ClosedTool[]` em
toda ficha não cabe no Assistente nem no Construtor de agentes, porque as listas deles têm
ferramentas que não são `ClosedTool` (`CONSTRUTOR_TOOL`, `ASSISTANT_TOOL`, `DATA_TOOL`, as da
memória). O contrato passa a ser: a lista de cada agente é montada de `CLOSED_TOOLS` (Construtor de
apps) e de `TOOLS_OF[seat]` mais as ferramentas próprias (os outros), sem repetir um nome; o
Construtor de apps tem `[...CLOSED_TOOLS]`. `disableBuiltinTools` fica só para as ferramentas
nativas trocadas pelo mesmo id (`ask_user`, `submit_plan`). O fundador, em 2026-11-25: "3. Okay, mas
quero entender", ao item "A emenda do cartão do harness, U9 e U10". C26.

### As skills e a leitura

`mastra`.

### A ordem do trabalho

1. **O teste da lista fechada lê a ficha (issue 1286).** Critérios: 22.
2. **Uma lista.** Critérios: 22. O comentário velho de `permissions.ts` que cita
   `mastracode/sdk/src/index.ts:858,1331` sai junto.
   - **Mutações à mão:** tirar `submit_plan` de `disableBuiltinTools` deixa vermelho o retrato do
     Construtor de apps.
3. **Um "nunca pergunta".** Critérios: 22.

### Como se prova

Os cinco retratos sem regravar e o teste da 1286.

### Parar se

- Um retrato mudar: a lista nova tem uma ferramenta a mais ou a menos; parar.

## U11 O turno sem ler texto de erro

**Base e modelo.** O commit do G5f. Sonnet.

### As linhas da tabela

- **O turno recusado.** Na base (antes do G5): `B/conversation/turn-of.ts:11`, `:46`, `:111-114`
  (`busyIn`); `B/conversation/end.ts:64-73` (`failureOf`); `B/runs/runs.ts:116-119`. TURN-4:
  `turn-of.ts:20-30`, `:41-43`, `:95-104`. Na referência: `@mastra/core` 1.83.0
  `agent-controller-BhkzVgCi.js:738-746`, `:1186-1200`; `dist/docs/references/docs-agents-processors.md:1045-1063`.
  O campo nativo que chega ao fim do turno já é lido hoje em `B/conversation/turn-line.ts:40`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `agents/app-builder/turn-of.ts`, `end.ts` | Muda: um registro de recusa por conversa, gravado pelo processador, lido pelo fim do turno; sai `busyIn` e o prefixo | o turno do Construtor de apps |

### Os contratos que a unidade cria

```ts
// agents/app-builder/turn-of.ts
type Refused = { code: 'RUN_BUSY' | 'CONVERSATION_NOT_FOUND' | 'CONVERSATION_DELETED'; person?: PersonId }
// o processador grava `Refused` por conversa antes de `abort(code)`; o fim do turno lê quando `finishReason === 'tripwire'`
```

### As skills e a leitura

`mastra`; ler primeiro `docs-agents-processors.md` e `docs-agents-guardrails.md` no pacote instalado.

### A ordem do trabalho

1. **O teste do que a referência deixa aberto.** Critérios: 27. Um caso que mostra que o evento
   `error` do controlador, na 1.83.0, traz `finishReason: 'tripwire'` e não traz `processorId`: se
   uma subida do Mastra passar o campo, o teste avisa e o registro pode sair.
2. **O registro.** Critérios: 23, 27.
   - **Mutações à mão:** gravar o registro depois do `abort` deixa vermelho o caso `RUN_BUSY`.
3. **TURN-4.** Critérios: 29. `projectTurn` usa `projectOfRun`, sem reler o índice.
   - **Mutações à mão:** devolver a releitura de `conversationOf` deixa vermelho o caso que conta
     as leituras do índice.

### Como se prova

O caso `RUN_BUSY` de hoje, sem mudar asserção; `rg 'stopped the run' apps/server/src -g '!*.test.ts'`
vazio; o caso que conta as leituras do índice, que falha na base.

### Parar se

- O registro precisar sobreviver a um reinício do Hub: hoje a recusa é do turno vivo; parar.

## G6 O ponto de conferência

`npm run quality`, `npm run check`, os testes das pastas tocadas e os cinco retratos; um turno
recusado por Projeto ocupado no Hub local; `rg 'stopped the run' apps/server/src -g '!*.test.ts'`
vazio.

## U12 A troca de modelo pela rota nativa

**Base e modelo.** O commit de G6. Sonnet: o estudo de rotas provou o rascunho (P1 a P4).

### As linhas da tabela

- **Trocar o modelo.** Na base (antes do G5): as três rotas `B/conversation/routes.ts:113-128`,
  `B/assistant/routes.ts:295-316`, `B/construtor/routes.ts:85-109`; `answerModelChange`
  (`B/controller-kit/routes.ts:16-36`); `changeModel` (`B/controller-kit/open.ts:95-117`); a lista
  fixa do guarda (`B/conversation/guard.ts:33-41`). Na web: `Wb/conversation/panel.tsx:51-54`,
  `Wb/assistant/conversation.tsx:114-125`, `Wb/agents/construtor-chat.tsx:110-120` (caminhos de
  antes da U3). Na referência: `@mastra/server` 1.83.0 `agent-controller.js:869-890`;
  `FU/hooks/useAgentControllerStateMutations.ts:43-61`; `@mastra/client-js` 1.60.0
  `dist/index.js:7533-7541`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `harness/routes/guard.ts` | Muda: `POST …/model` na lista fixa; o ramo da troca, como o de `tool-approval` | o Mastra |
| `harness/spec/` | Muda: a ficha diz se o modelo é da sessão ou da versão, e a linha de log de cada agente | o guarda |
| `harness/spec/routes.ts`, `open.ts` | Apaga `answerModelChange` e `changeModel` | — |
| as três rotas `…/model` dos agentes | Apaga | — |
| `packages/hub-api/src/conversations.ts`, `assistant.ts`, `construtor.ts` | Apaga as três operações | — |
| `apps/web/src/harness/room/session.ts`, `model-choice.tsx` e os três embrulhos | Muda: uma `ModelChoice` que chama `session.switchModel`; saem as três mutações | as três conversas |

### Os contratos que a unidade cria

```ts
// harness/routes/guard.ts
const ModelChoiceBody = z.strictObject({ modelId: ModelId, thinkingLevel: Effort })
// harness/spec/spec.ts
type ModelOf = 'SESSION' | 'VERSION'   // o agente salvo é 'VERSION' e recebe CONVERSATION_NOT_FOUND
```

Os códigos: `MODEL_NO_ACCOUNT`, `MODEL_UNKNOWN`, `EFFORT_UNSUPPORTED`, `REQUEST_MALFORMED`,
`CONVERSATION_NOT_FOUND`, os de hoje. O guarda é mais estrito que o corpo nativo
(`agent-controller.js:224-233` deixa `thinkingLevel` opcional): exige o esforço, porque a escolha de
hoje sempre o leva (`{ model, effort }`, `packages/hub-api/src/conversations.ts:140`), e um campo a
mais é recusado. Os outros quatro pontos do modelo de contrato: o estado é `ModelOf`, uma união
(C21); `ModelId` e `ConversationId` com as marcas de `@conexus/hub-api`, conferidas no guarda (C23);
a linha de log de cada agente mora na ficha (C26); o corpo é o esquema acima (C27).

### As skills e a leitura

`mastra`, `fastify-best-practices`; ler primeiro o estudo de rotas (a seção 3.3 e o apêndice A, com
o rascunho do guarda).

### A ordem do trabalho

1. **Os testes de hoje apontados para a rota nativa.** Critérios: 24. Os casos `…/model` de
   `conversations.test.ts`, `routes.test.ts` do Assistente e do Construtor de agentes,
   `database-down.test.ts`, `assistant.test.ts` e `lines.test.ts`, com as mesmas recusas.
2. **O ramo do guarda.** Critérios: 24.
   - **Mutações à mão:** tirar `conversationModel` do ramo deixa vermelho `MODEL_NO_ACCOUNT`; a
     linha de log antes da resposta deixa vermelho "a recusa não escreve linha".
3. **A web.** Critérios: 24. Uma `ModelChoice`.
4. **O que sai.** As três rotas, o molde e as três operações; `boundaries.md` ganha a rota a mais
   atrás do guarda. A issue 1287 fecha com o teste da marca depois de um reinício.

### Como se prova

O estudo de rotas rodou o rascunho pela porta do Hub com Postgres próprio, **provado**: as três
recusas 422 e o 404 do agente salvo; os quatro retratos iguais (11 de 11). A unidade repete isso
nos testes.

### Parar se

- A troca nativa gravar no fio uma chave que `changeModel` não gravava (`currentModelId`,
  `modelPersistenceVersion`, `thinkingLevel` são as de hoje): parar.

## U13 Renomear nas quatro conversas pela rota nativa

**Base e modelo.** O commit de U12. Sonnet.

### As linhas da tabela

- **Renomear.** Na base (antes do G5): `B/assistant/routes.ts:227-241`;
  `packages/hub-api/src/assistant.ts:252` (`CONVERSATION_TITLE_MAX`), `:254-268`; o guarda,
  `B/conversation/guard.ts:185-187` (recusa `threadId` diferente da sessão). Na referência:
  `@mastra/server` 1.83.0 `agent-controller.js:1244-1269`, `:237`; `@mastra/core` 1.83.0
  `agent-controller-BhkzVgCi.js:2592-2615`; `TUI/commands/name.ts:3-15`;
  `mastracode/sdk/src/factory/remote-session.ts:259-261`; `@mastra/client-js` 1.60.0
  `dist/index.js:7576-7581`.
- **O menu nas quatro listas.** `apps/web/src/harness/room/conversation-menu.tsx` (da U2); as
  listas: `apps/web/src/agents/app-builder/conversation-switch.tsx`,
  `apps/web/src/agents/agent-builder/area.tsx` (o bloco de conversas),
  `apps/web/src/agents/saved-agent/test-panel.tsx`, no lugar que o protótipo aprovou.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `harness/routes/guard.ts` | Muda: `PUT …/threads/:threadId` na lista fixa; o ramo que apara e confere o título; a linha `CONVERSATION_RENAMED` depois do `{ ok: true }` | o Mastra |
| `agents/assistant/routes.ts` | Apaga a rota `PATCH` | — |
| `packages/hub-api/src/assistant.ts` | Apaga `renameAssistantConversation`; `CONVERSATION_TITLE_MAX` fica, lido pelo guarda e pelo formulário | — |
| `apps/web/src/harness/room/session.ts` | Muda: `rename` pelo `session.renameThread` | `ConversationMenu` |
| as três listas acima | Muda: passam `rename` ao menu | — |

### Os contratos que a unidade cria

```ts
// harness/routes/guard.ts
const RenameBody = z.strictObject({ title: z.string().trim().min(1).max(CONVERSATION_TITLE_MAX) })
```

O corpo nativo aceita qualquer texto (`agent-controller.js:237`, `{ title: z.string() }`): o guarda
confere o título aparado e troca `request.body` pelo corpo aparado antes de o Mastra ler, para que
o nome gravado seja o mesmo que a pessoa vê no campo. A linha de log: `CONVERSATION_RENAMED` com
`companyId`, `traceId`, `conversationId` e o tipo de agente, nunca o título. `ConversationId` com
a marca de `@conexus/hub-api`, conferida no guarda (C23); `CONVERSATION_TITLE_MAX` tem um dono,
`packages/hub-api/src/assistant.ts:252` (C26).

### As skills e a leitura

`mastra`, `fastify-best-practices`.

### A ordem do trabalho

1. **Os testes.** Critérios: 25. Um caso por agente, um por recusa, um com espaços em volta do
   título (grava aparado) e um depois de um reinício do Hub, sem a sessão na memória.
2. **O ramo do guarda.** Critérios: 25.
   - **Mutações à mão:** tirar o `trim()` deixa vermelho o caso do título só de espaços; tirar a
     recusa de `threadId` diferente da sessão deixa vermelho o caso em que a conversa ativa
     trocaria.
3. **A web.** Critérios: 26. O menu ganha `rename` nas três listas.
4. **O que sai.** A rota `PATCH` e a operação.

### Como se prova

Os testes do guarda pela porta do Hub e os testes de tela das quatro listas; QA (T25).

### Parar se

- O título automático do Mastra apagar um Renomear num teste que não é o caso da issue 655: parar.
- O adaptador do Mastra no Fastify ler o corpo de outro lugar que não `request.body`, e o título
  gravado sair sem aparar: parar e dizer o que o adaptador lê.

## G7 O ponto de conferência

`npm run quality`, `npm run check`, os testes do guarda e das quatro listas; no Hub local, trocar o
modelo nas três conversas e renomear nas quatro; QA (T25) das quatro listas a 1366 e 390 px.

## U14 O fechamento

Depois do uso do fundador (delivery L17, L19): `docs/explanation/harness.md` com a versão
instalada do `@mastra/core` e a árvore nova (DOC-1); a decisão 0051 com as versões instaladas e o
`closeAgain` e o `networkOpen` do `A1` (MACH-8); `docs/reference/boundaries.md` com as duas rotas
nativas atrás do guarda e o registro da recusa do turno (U11); a página da trilha sem "a área
Estúdio" e com os passos 3 e 8 fechados; `docs/explanation/conceito.md` sem "o rótulo Estúdio" na
lista do plano do harness; as regras W1, W4 e W7 de `docs/guides/web.md` com a árvore nova da web
(`harness/` e `agents/<agente>/`) e a direção entre agentes da U3, com a regra do
`dependency-cruiser` que segura a direção (delivery L19, L20; o fundador, 2026-11-24, na emenda da
U3); a linha de uso no arquivo de aprovação; o cartão apagado.
