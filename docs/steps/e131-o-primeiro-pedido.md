# Etapa 13.1: O primeiro pedido

## A página do fundador

**No fim desta etapa** você entra no Conexus e cai no Início com o cursor na caixa de pedido, a
mesma caixa da conversa (com **+** e microfone). Escreve o app que quer, envia, dá o nome do
Projeto, e o Projeto abre com o seu pedido já na conversa e o Builder trabalhando. Um dono novo faz
o mesmo no passo 4 da primeira entrada.

**O roteiro de uso.** Padaria Sol, com Ana (dona), no computador e no celular.

1. Ana entra com e-mail e senha. Cai no Início: em cima, o cartão **Termine de preparar a empresa**
   quando falta algo; depois **O que vamos construir?**, a caixa com o cursor dentro, e embaixo três
   exemplos; mais abaixo, os cartões dos **Projetos**. O título não tem contorno laranja.
2. Ana escreve "Um app de encomendas com cliente, data de entrega e valor", anexa
   `tabela-de-precos.pdf` pelo **+** (ou dita pelo microfone) e toca **Enviar**.
3. A caixa dá lugar ao pedido dela, como ela escreveu, com a etiqueta do arquivo, e embaixo o campo
   **Nome do projeto**, vazio e com o cursor. Ela digita "Encomendas" e vê, enquanto digita,
   "Endereço do app: encomendas--padaria-sol.…". Toca **Criar e começar**. (**Voltar** devolve o
   pedido à caixa, com o arquivo.)
4. Abre o Projeto **Encomendas** na conversa: a bolha dela com o texto e a etiqueta, e o Builder
   trabalhando.
5. Ana volta ao Início: o cartão **Encomendas** está lá. Não existe mais **Criar projeto** sem
   pedido.
6. Um dono novo, no **passo 4 de 4** da primeira entrada ("O que vamos construir primeiro?"), faz o
   mesmo: caixa, exemplos, nome, e cai na conversa. Ou toca **Ir para o início sem pedir nada**.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. No fim: faz o roteiro no
computador e no celular, diz o que viu e aprova os textos das telas.

**Fica de fora.**
- O estado nos cartões dos Projetos ("Builder trabalhando", "Rascunho", "Publicado"): fica para
  depois (sua palavra `C. C1`, 2026-10-26). O cartão continua com o nome e "Criado em".
- A aba **Alterações**: fora desde a 14.1 (sua "B1", 2026-10-25).
- Trocar o nome de um Projeto: não existe, e o endereço continua fixo para sempre (decisão 0024).
- Das issues `next-card`, nenhuma toca as pastas desta etapa; a #167 e a #170 já entram na 14.3.
  A #253 (o primeiro turno de um Projeto novo depende do R2 responder) fica na fila: o roteiro passa
  por um primeiro turno, mas a issue só acontece com o R2 fora e o conserto é na máquina do Builder,
  não aqui.

**As decisões suas nesta etapa.** Todas dadas, em 2026-10-26:
- **A**, nativo: quem dá o nome é a pessoa, digitando. Nem o modelo nem um sorteio dão o nome, e o
  campo não vem preenchido. "A. O cliente tem que colocar o nome do projeto".
- **B1**, nativo: saem o **+ Novo projeto** e o campo de nome sozinho de hoje; todo Projeto nasce de
  um pedido, no Início ou no passo 4. "B. B1".
- **C**, nativo: o estado nos cartões fica para depois. `C. C1`.

**Onde o nome é digitado** (escolha deste cartão, não uma decisão nova): depois do **Enviar**, no
lugar da caixa, como fazia o seu Conexus OS, que pedia o nome antes de criar. A caixa do Início
fica igual à da conversa e ao desenho `wf-h1` que você aprovou; o nome só aparece quando importa,
com o endereço ao lado. A outra forma, um campo de nome acima da caixa o tempo todo, não aparece em
nenhuma referência nem no desenho aprovado.

Nenhuma linha remendo.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | A conversa nova aceita o raciocínio junto com o modelo | `packages/hub-api/src/`, `apps/server/src/builder/conversation/` | dados | 14.3 inteira |
| U2 | O Início: a caixa da 14.3, os exemplos, o passo do nome, a passagem do pedido à conversa; sai o campo de nome sozinho | `apps/web/src/builder/conversation/`, `apps/web/src/hub/projects/`, `apps/web/src/routes/_app/companies/$companyId/` | web | U1 |
| U3 | O passo 4 com a mesma caixa | `apps/web/src/routes/_app/companies/$companyId_/welcome/`, `apps/web/src/hub/identity/` | web | U2 |
| U4 | O foco depois de entrar vai à caixa, e o título não ganha contorno | `apps/web/src/hub/identity/`, `apps/web/src/brand/`, `apps/web/src/routes/_app/` | design | U2 |

**A entrega.** Cada unidade é o seu próprio pull request, sobre o `main` com as anteriores já
dentro ([entrega L9](../guides/delivery.md)): o CI verde, uma revisão por um revisor Opus e então o
firstmate a junta ao `main`, uma de cada vez ([L13](../guides/delivery.md)). A ordem é U1, U2, U3,
U4: a U2 usa o corpo da U1; a U3 põe no passo 4 a peça da U2; a U4 prova o foco sobre a caixa do
Início da U2. A U1 começa só depois que a última unidade da 14.3 entrou no `main`, porque a caixa,
os arquivos e o rascunho são os dela.

**Orçamento de código alterado.** U1 25; U2 260 (sai ~60 de `create-project-form.tsx` e
`home.tsx`); U3 25; U4 15. Total da etapa: ~325 linhas sem testes, teto 4.000 (L2).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `POST /api/companies/{c}/projects/{p}/conversations` com `{ model, effort }` cria a conversa nesse modelo e raciocínio, e a leitura da sessão do Mastra os devolve; um raciocínio que o modelo não tem responde 422 `EFFORT_UNSUPPORTED` e nenhuma conversa nasce; sem `effort`, como hoje | `apps/server/src/builder/conversation/conversations.test.ts`, "o raciocínio pedido vale desde a criação" e "um raciocínio que o modelo não tem é recusado" | must |
| 2 | U1 | A mesma chave de tentativa com outro `effort` responde 409 `IDEMPOTENCY_CONFLICT` | `conversations.test.ts`, "a mesma chave com outro raciocínio é outro pedido" | must |
| 3 | U2 | O Início do dono com conta de modelo mostra, nesta ordem: o cartão de preparo (quando falta algo), "O que vamos construir?", a caixa da 14.3 com o modelo do padrão da pessoa (`Defaults.start`), três exemplos, os Projetos. Nenhum "Criar projeto", nenhum "+ Novo projeto", nenhum anel de memória | `apps/web/src/hub/projects/home.test.tsx`, "Início: o título, a caixa, os exemplos e os Projetos" | must |
| 4 | U2 | Tocar num exemplo põe o texto na caixa e não envia | `apps/web/src/builder/conversation/start.test.tsx`, "o exemplo vai para a caixa e nada sai" | must |
| 5 | U2 | Sem conta de modelo (`Defaults.start` nulo), o aviso de hoje (`NoAccount`) fica no lugar da caixa e dos exemplos | `start.test.tsx`, "sem conta, o aviso no lugar da caixa" | must |
| 6 | U2 | **Enviar** com texto ou arquivo troca a caixa pelo pedido (texto e etiquetas) e o campo **Nome do projeto** vazio, com o foco; o endereço do app se monta enquanto se digita; nenhum pedido ao Hub sai até **Criar e começar**. **Voltar** devolve texto e arquivos à caixa | `start.test.tsx`, "enviar pede o nome, vazio, e nada sai" e "Voltar devolve o pedido à caixa" | must |
| 7 | U2 | **Criar e começar** com nome vazio não sai: a frase no campo. Com nome: `createProject` com `{ name }` e uma chave, depois `createConversation` com `{ model, effort }` e outra chave, e a tela abre `…/projects/<p>/conversations/<c>` | `start.test.tsx`, "o nome vazio fica no campo" e "criar leva o nome, o modelo e as chaves, e abre a conversa" | must |
| 8 | U2 | Na conversa aberta, o pedido sai **uma vez** pela rota do Mastra, com `{ content, files }` como a 14.3 manda, e a bolha da pessoa mostra texto e etiqueta | `apps/web/src/builder/conversation/panel.test.tsx`, "o pedido do Início sai uma vez ao abrir" | must |
| 9 | U2 | `PROJECT_NAME_TAKEN`, `PROJECT_ADDRESS_TAKEN`, `PROJECT_NAME_NO_ADDRESS`: a frase no campo do nome, o pedido fica. `COMPANY_DATABASE_PREPARING`, `COMPANY_DATABASE_UNAVAILABLE`: a frase e **Tentar de novo**. Resposta cortada, 502 ou 503: "Não confirmamos a criação. Tente de novo.", e a nova tentativa leva as mesmas chaves | `start.test.tsx`, um caso por grupo, como os de hoje em `home.test.tsx` | must |
| 10 | U2 | O Projeto criado e a conversa recusada (`MODEL_NO_ACCOUNT`, `MODEL_UNKNOWN`, ou resposta cortada): a frase fica no passo do nome, o nome fica travado, e **Tentar de novo** cria só a conversa; o Projeto não nasce duas vezes | `start.test.tsx`, "a conversa recusada depois do Projeto: tentar de novo não cria outro Projeto" | must |
| 11 | U2 | O envio na conversa recusado (a frase `UNCONFIRMED_SEND` ou a do código): texto e arquivos voltam à caixa da conversa, como na 14.3; recarregar a conversa antes de o envio terminar põe o texto na caixa com "Não confirmamos o envio do seu pedido. Confira a conversa antes de enviar de novo." e não reenvia sozinho | `panel.test.tsx`, "o pedido recusado volta à caixa" e "recarregar não reenvia" | must |
| 12 | U2 | O rascunho do Início guarda o texto na aba por empresa; sair e voltar ao Início o devolve; um envio que abriu a conversa o esvazia | `start.test.tsx`, "o rascunho do Início volta e some depois de criar" | must |
| 13 | U2 | A empresa que o Hub não acha ao criar: a página de "não encontrado", como hoje | `start.test.tsx`, "Criar numa empresa que o Hub já não acha" | must |
| 14 | U3 | O passo 4 de 4 mostra "O que vamos construir primeiro?", a mesma caixa, os exemplos e **Ir para o início sem pedir nada**; criar abre a conversa como no Início; o link abre o Início | `apps/web/src/hub/identity/welcome-steps.test.tsx`, "Passo 4: a caixa cria e abre a conversa" e "Passo 4: Ir para o início sem pedir nada" | must |
| 15 | U4 | Depois de entrar com Enter, o foco vai ao primeiro campo de texto da página de destino quando ela tem um (a caixa do Início), senão ao título; o título focado não desenha contorno | `apps/web/src/routes/_app/index.test.tsx`, o caso #32-4 reescrito: "depois de entrar, o foco vai à caixa"; e "numa página sem campo, o título recebe o foco"; o contorno, a QA | must |
| 16 | U4 | A regra global de `:focus-visible` não pinta um elemento com `tabindex="-1"`; botões, abas e links seguem com o contorno (V28) | `apps/web/layout.test.ts`, "o contorno não vai ao título focado pelo programa" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Início, caixa (U2) | a caixa com o foco, "Descreva o app que você quer", três exemplos | **Enviar** desabilitado, como na 14.3 | a página espera os Projetos, como hoje; a caixa espera `accountsQuery` | a leitura das contas falha: a página de falha da área, com **Tentar de novo** (W34) | a empresa: a página de "não encontrado" | o membro vê a mesma caixa e cria (`createProject` é de membro, `admission.ts:43`); sem o cartão de preparo | sem conta de modelo: o aviso `NoAccount` no lugar da caixa e dos exemplos |
| Início, passo do nome (U2) | o pedido, o campo vazio com o foco, **Criar e começar**, **Voltar** | nome vazio: a frase no campo, nada sai | "Criando…"; sem banco da empresa: "Preparando o banco da empresa…" | a frase do código no campo do nome ou no alerta; resposta cortada: "Não confirmamos a criação. Tente de novo." | a empresa: a página de "não encontrado" | — | conversa recusada depois do Projeto: a frase, o nome travado, **Tentar de novo** |
| Passo 4 (U3) | o título, a caixa, os exemplos, **Ir para o início sem pedir nada** | igual ao Início | igual | igual | — | só o dono vê a primeira entrada (W33) | sem conta (o passo 2 pulado): o aviso no lugar da caixa, e o link para o Início fica |
| Conversa aberta com o pedido (U2) | a bolha pendente e o Builder trabalhando | — | o envio em curso, como na 14.3 | o envio recusado: texto e arquivos na caixa e a frase | `CONVERSATION_NOT_FOUND`: como hoje | — | recarregar no meio: o texto na caixa e a frase de não confirmado; os arquivos saem, como na 14.3 |
| Cartões dos Projetos | "Nenhum projeto ainda." | igual | como hoje | como hoje | — | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `createConversation` `body.effort` (U1) | web, `start.tsx`, do seletor do Início | server, `created` em `routes.ts`, que o passa ao `switchModel` |
| `createProject` `body.name` | web, o passo do nome (`NameStep`) | server, `projects.create`, como hoje |
| `Handoff` `{ outgoing, pending }` (U2) | web, `start.tsx`, antes de navegar | web, `Screen` da conversa, ao abrir; o recarregar lê só a cópia `pending` |
| `DraftKey` (U2) | web, `start.tsx` (`start:<empresa>`) e `panel.tsx` (a conversa) | web, `useDraft` |
| `Defaults.start` | server, como hoje | web, `start.tsx`: o valor inicial do seletor, ou o aviso quando nulo |

**Desenho de caixas.** Segue o `wf-h1` e o `wf-o4` aprovados ("Aprovado tudo", 2026-10-19), com a
caixa de uma linha da 14.3, e o passo do nome do Conexus OS (`prompt-box.tsx:129-144`, captura
`os-11-home-projects-1280.png` do estudo de 2026-10-19, fora do repositório), sem o nome preenchido.

```text
1280 px, Início, antes de enviar
┌ Termine de preparar a empresa  ✓ Empresa · ○ Conta de modelo · ○ Convidar equipe  [Continuar] ┐
O que vamos construir?
┌──────────────────────────────────────────────────────────────┐
│ [▤ tabela-de-precos.pdf ×]                                   │
│ Um app de encomendas com cliente, data de entrega e valor    │
│ Claude Sonnet · Alto ▾                          [+] [mic] [↑] │
└──────────────────────────────────────────────────────────────┘
              Não cole senhas ou chaves na conversa.
(Controle de encomendas) (Pedidos de férias) (Cadastro de visitas)
Projetos
[ Encomendas      ] [ Pedidos de férias ] [ Checklist de loja ]

1280 px, Início, depois de Enviar
O que vamos construir?
┌──────────────────────────────────────────────────────────────┐
│ Um app de encomendas com cliente, data de entrega e valor    │
│ [▤ tabela-de-precos.pdf]                                     │
└──────────────────────────────────────────────────────────────┘
Nome do projeto
┌──────────────────────────────┐
│ Encomendas|                  │
└──────────────────────────────┘
Endereço do app: encomendas--padaria-sol.<domínio>
[Criar e começar]  [Voltar]

390 px, Início, depois de Enviar
O que vamos construir?
┌─────────────────────────────────┐
│ Um app de encomendas com        │
│ cliente, data de entrega e valor│
│ [▤ tabela-de-precos.pdf]        │
└─────────────────────────────────┘
Nome do projeto
┌─────────────────────────────────┐
│ Encomendas|                     │
└─────────────────────────────────┘
Endereço do app:
encomendas--padaria-sol.<domínio>
[Criar e começar]
[Voltar]
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `createProject` (de hoje, sem mudança) | a chave de tentativa (W24, C37): o mesmo Projeto; dois cliques, um pedido | resposta cortada, 502 ou 503: a frase de não confirmado e a mesma chave na nova tentativa; a preparação do banco da empresa como hoje (data D22) | o banco do Hub: `DATABASE_UNAVAILABLE`; o Neon: `COMPANY_DATABASE_UNAVAILABLE` com **Tentar de novo** | `PROJECT_CREATED`, `COMPANY_DATABASE_CREATED`, como hoje | 7, 9, 13 |
| `createConversation` com `effort` (U1) | a chave: a mesma conversa; outra `effort` com a mesma chave, 409 | o índice gravado antes do fio (data D17); a repetição põe o modelo e o raciocínio que faltam (`created`, `routes.ts:84-101`) | o banco: `DATABASE_UNAVAILABLE`; o armazenamento do Mastra: a falha de hoje, e a repetição conserta | `CONVERSATION_CREATED`, como hoje | 1, 2, 10 |
| Projeto criado e conversa não (U2, a sequência no navegador) | — | o Projeto fica, sem conversa, e o passo do nome tenta só a conversa; quem sai da página deixa um Projeto vazio, que abre em "Nenhuma conversa" com **Nova conversa**, como hoje | as do `createConversation` | nada novo | 10 |
| O envio do pedido na conversa (rota do Mastra, a da 14.3) | sai uma vez: a passagem é lida e apagada ao abrir | resposta cortada, 502 ou 503: `UNCONFIRMED_SEND`, texto e arquivos voltam à caixa (14.3); recarregar no meio: o texto da cópia `pending` volta à caixa com a frase, sem reenviar | o banco e a Anthropic: como na 14.3 | como na 14.3 | 8, 11 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Início: "O que vamos construir?" com a caixa | U2 | `hub/projects/home.tsx:16-37` (título + `CreateProjectForm`) | Factory `mastra-1.78@6a465f9d` `mastracode/factory-ui/src/ui/pages/NewPage.tsx:145-156`; Dyad `902829f` `src/pages/home.tsx:183-214`; vibesdk `9da158d` `src/routes/home.tsx:125-218`; Conexus OS `e0353c36` `apps/web/src/features/project/components/prompt-box.tsx:110-155`; Lovable (captura `builder-lovable-01`, 2026-10-19) | Lido: um `h1` e o mesmo compositor da conversa, nada mais acima | nativo | | "Aprovado tudo", 2026-10-19 (`wf-h1`) | |
| O compositor no Início e no passo 4 | U2, U3 | `builder/conversation/composer.tsx`, o da 14.3 | Factory `Composer.tsx:49, 219-224` (`onUserDraft`: o mesmo componente cria a sessão no envio) | Lido | embrulhado: `answering=false`, sem `memory`, sem `taskPanel`; `onSend` abre o passo do nome; `picker` é o `ModelPicker` com estado local | Teste de tela (critérios 3, 6) | roadmap :83 | `apps/web/src/builder/conversation/start.tsx` |
| Onde a pessoa digita o nome | U2 | `hub/projects/create-project-form.tsx:66-93` (campo sozinho, endereço enquanto digita) | Conexus OS `e0353c36` `prompt-box.tsx:81-97, 129-144` (enviar abre "Nome do Projeto" com **Criar e começar** e **Voltar**, a caixa parada); Factory `NewPage.tsx:144-158` (só a caixa, sem nome); `wf-h1`, `wf-o4` (só a caixa) | Lido | nativo: a forma do OS, o nome depois do **Enviar** e antes de criar, sem o nome sugerido (A); a caixa fica como no `wf-h1`. O campo acima da caixa o tempo todo não tem referência | | "A. O cliente tem que colocar o nome do projeto", 2026-10-26 | |
| O passo do nome: campo, endereço, recusas | U2 | `create-project-form.tsx:29-96` (o formulário, `hostLabelOf`, `ON_THE_NAME`, `RETRYING`, chave W24) | o mesmo arquivo; OS `prompt-box.tsx:86-97` | Lido | nativo: o formulário de hoje vira o passo do nome (`NameStep`), devolvendo o Projeto em vez de navegar | | "B. B1", 2026-10-26 | |
| O nome do Projeto vindo do pedido | fica de fora (A) | nenhum | `@mastra/core@1.79.0` `generateTitleFromUserMessage`; vibesdk `worker/agents/schemas.ts:85-87`; Dyad `generateCuteAppName`; OS `project-name.ts` | Lido | nativo, fora: a pessoa digita o nome | | "A. O cliente tem que colocar o nome do projeto" | |
| Criar o Projeto e a conversa | U2 | `createProject` (`hub-api/src/projects.ts:80-103`) e `createConversation` (`conversations.ts:93-107`), cada um com sua chave | Factory `useCreateUserSessionFromDraft.ts:38-41` (cria a sessão, depois navega e envia); Dyad `902829f` `src/first_prompt/FirstPromptProvider.tsx:135-157` (`createApp` → `createChat` → `submit`); OS `start-project.ts:13-33` (chamadas em sequência, chave por entrada) | Lido | nativo: as duas operações de hoje, em sequência no navegador, cada uma com sua chave guardada até o Hub decidir (W24). O estudo propunha uma operação nova numa transação: com o nome digitado (A) ela não tem mais o que fazer além das duas, e a conversa nasce em duas casas (o índice do Hub e o fio do Mastra, `routes.ts:84-101`), que nenhuma transação junta; o Hub também não importa o Builder (C4) | | não precisa | |
| Modelo e raciocínio escolhidos antes da conversa | U1, U2 | `createConversation` aceita `model` (`conversations.ts:100`); o raciocínio só pela `setConversationModel` | Factory `useHandoffPrompt.ts` (`handoffModelId`, `switchModel` antes do envio); OS `start-project.ts:26-28` | Lido | nativo: `effort` opcional no corpo de `createConversation`, conferido com `effortsOf` como `setConversationModel` (`routes.ts:116-129`) | | não precisa | |
| O valor inicial do seletor | U2 | `Defaults.start` em `listModelAccounts` (`model-accounts.ts:115`), lido por `my-defaults.tsx` | decisão 0054 | Lido | nativo | | não precisa | |
| A mensagem passada à conversa | U2 | nenhum | Factory `useHandoffPrompt.ts` (`promptHandoffState`, `storePendingHandoff` no `sessionStorage`), `services/handoffFiles.ts:3-17` (`takeHandoffFiles`, um `Map` em memória) | Lido: os arquivos ficam em memória ("can exceed browsers' history state size limits, and a reload never auto-resends"); depois de recarregar, devolve o texto à caixa e avisa | nativo: o mesmo padrão | | não precisa | `apps/web/src/builder/conversation/handoff.ts` |
| Rascunho do Início | U2 | `builder/conversation/draft.ts` (por conversa; a 14.3 o muda para `take`/`restore` com arquivos) | Factory `ComposerImagesContext` e o rascunho por rota | Lido | embrulhado: a chave do rascunho é a conversa ou `start:<empresa>` | Teste de tela (critério 12) | não precisa | |
| Sem conta de modelo | U2 | `NoAccount` (`model-choice.tsx:21`) na conversa | Factory `NewPage.tsx:126-142` (`MissingCredentialState` no lugar do compositor) | Lido | nativo | | "Sem conta de modelo, um aviso no lugar do compositor", 2026-10-19 | |
| Três exemplos | U2 | nenhum | OS `prompt-box.tsx:16-21, 99, 147-155`; Dyad e Lovable (sugestões) | Lido: tocar põe o texto na caixa, não envia | nativo | | `wf-h1`, 2026-10-19; os textos no fim | |
| Passo 4 da primeira entrada | U3 | `routes/_app/companies/$companyId_/welcome/build.tsx:5-18` (só "Ir para o início") | `wf-o4`; Linear `onb-linear-07` (termina dentro do produto) | Documentado | nativo | | W33; `wf-o4` | |
| "+ Novo projeto" e o campo Nome sozinho | U2 (sai) | `create-project-form.tsx`, `home.tsx:25` | Lovable, vibesdk: nenhum; Factory: "New session" abre a página da caixa (`SessionsSection.tsx:93`) | Lido | nativo: sai, todo Projeto nasce de um pedido | | "B. B1", 2026-10-26 | |
| Estado nos cartões | fica de fora (decisão C) | `project-cards.tsx:8-31` ("Criado em …") | OS `os-11`; Lovable (miniatura) | Documentado | nativo, fora: o cartão fica com o nome e "Criado em" | | `C. C1`, 2026-10-26 | |
| Foco depois de entrar e o contorno | U4 | `hub/identity/sign-in-form.tsx:50-65`; `brand/tokens.css:271-273` | Factory `ComposerInput` foca o campo na página nova; V28 nomeia botões, abas, links e campos | Lido | nativo: o foco vai ao primeiro campo de texto do destino quando há um, senão ao título; a regra global segue V28 (`:focus-visible` sem `[tabindex="-1"]`) | | "tá até com o subliado lá em cima", 2026-10-25 | |
| Aba Alterações | fica de fora (14.1 B1) | nenhum | Factory `routes/fs.ts:157-188` | Lido na 14.1 | nativo, fora | | "Ok, pode ser então A1 e B1", 2026-10-25 | |

As referências fora do `node_modules`: Mastra na estante `mastra-1.78` em `6a465f9d` (a Factory em
`mastracode/factory-ui/src/ui/`), vibesdk `9da158d`, Dyad `902829f`, Conexus OS `e0353c36`.

**A medida do transplante.** Nenhum código do Conexus OS. Do OS vem só a forma do passo do nome
(enviar, nome, criar e começar, voltar); o `suggestProjectName` não entra (A).

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
formulário do Hub e a rota) e entrega a mensagem de uma tela à outra sem reenviar.

### As linhas da tabela

**Início com a caixa**, **O compositor no Início**, **Onde a pessoa digita o nome**, **O passo do
nome**, **Criar o Projeto e a conversa**, **Modelo e raciocínio** (a parte da web), **O valor
inicial do seletor**, **A mensagem passada à conversa**, **Rascunho do Início**, **Sem conta de
modelo**, **Três exemplos**, **"+ Novo projeto" e o campo Nome sozinho**. As linhas citadas estão
na tabela; a passagem copia o jeito da Factory (`useHandoffPrompt.ts`, `handoffFiles.ts:3-17`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/projects/create-project-form.tsx` | Muda para `name-step.tsx`: `NameStep`, devolve o Projeto em vez de navegar, botões **Criar e começar** e **Voltar** | `start.tsx` |
| `apps/web/src/hub/projects/home.tsx` | Muda: sai o formulário; entra o nó `start` | a rota do Início |
| `apps/web/src/hub/projects/project-cards.tsx` | Muda: sai a frase "The state on the card comes with step 14" (decisão C, nenhum passo a tem) | `home.tsx`, `projects.tsx` |
| `apps/web/src/hub/projects/public.ts` | Muda: exporta `NameStep` | `start.tsx` |
| `apps/web/src/builder/conversation/start.tsx` | Cria: a caixa, os exemplos, o passo do nome, a sequência de criação | a rota do Início; a U3 |
| `apps/web/src/builder/conversation/handoff.ts` | Cria | `start.tsx`, `panel.tsx` |
| `apps/web/src/builder/conversation/draft.ts` | Muda: a chave | `panel.tsx`, `start.tsx` |
| `apps/web/src/builder/conversation/panel.tsx` | Muda: `Screen` lê a passagem ao abrir | — |
| `apps/web/src/builder/conversation/text.ts` | Muda: os exemplos, o texto do campo, a frase do recarregar | `start.tsx`, `panel.tsx` |
| `apps/web/src/builder/conversation/public.ts` | Muda: exporta `Start` | a rota; a U3 |
| `apps/web/src/routes/_app/companies/$companyId/index.tsx` | Muda: passa `<Start companyId />` ao `Home` | — |
| testes: `start.test.tsx` (cria), `home.test.tsx`, `panel.test.tsx` (mudam) | | |

### Os contratos que a unidade cria

```ts
// builder/conversation/handoff.ts
/** O pedido do Início, de uma tela à outra; os arquivos só em memória (Factory `handoffFiles.ts`). */
export type Handoff = { outgoing: Outgoing }
export function putHandoff(conversationId: ConversationId, outgoing: Outgoing): void
/** O pedido para enviar agora, uma vez; ou só o texto, quando a página recarregou antes de enviar. */
export function takeHandoff(conversationId: ConversationId):
  | { kind: 'SEND'; outgoing: Outgoing }
  | { kind: 'UNCONFIRMED'; text: string }
  | { kind: 'NONE' }
/** O envio decidiu (aceito, ou devolvido à caixa): some a cópia do sessionStorage. */
export function settleHandoff(conversationId: ConversationId): void

// builder/conversation/draft.ts
export type DraftKey = ConversationId | `start:${CompanyId}`
export function useDraft(key: DraftKey): Draft // o resto como a 14.3 o deixou

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
  /** Travado quando o Projeto já nasceu e falta a conversa. */
  locked: string | null
  onCreated: (project: Project) => Promise<void>
  onBack: () => void
}): ReactNode

// hub/projects/home.tsx
export function Home(props: { companyId: CompanyId; aside?: ReactNode; start: ReactNode })
```

- `Phase` é a união do Início (C21); `kind` separa. `STARTING` guarda o Projeto para que **Tentar de
  novo** crie só a conversa (critério 10).
- As chaves: `useAttemptKey` de hoje, uma para o Projeto, outra para a conversa, cada uma guardada
  até o Hub decidir (W24, `keepsAttemptKey`).
- `handoff.ts`: um `Map` de módulo com o `Outgoing` por conversa e, no `sessionStorage`
  (`pageStorage('session')`), só o texto, com a chave `conexus-handoff:<conversa>`. `SEND` quando o
  `Map` tem a entrada; `UNCONFIRMED` quando só a cópia existe (a página recarregou); a leitura apaga
  a entrada do `Map`. Um dono do texto do recarregar: `text.ts` (C26).
- O `Screen` da conversa, ao montar: `SEND` chama o `send` da 14.3 com o `Outgoing` e, ao decidir,
  `settleHandoff`; numa recusa a 14.3 já devolve à caixa. `UNCONFIRMED` põe o texto no rascunho da
  conversa, mostra a frase e chama `settleHandoff`. Em modo estrito o efeito roda duas vezes: a
  leitura que apaga garante um envio.
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
3. `draft.ts`: `DraftKey`. `handoff.ts` com os três casos.
4. `start.tsx`: a caixa da 14.3 (`answering=false`, sem `memory` nem `taskPanel`), o seletor, os
   exemplos; `onSend` passa a `NAMING`; `NameStep` com o pedido acima (texto e as etiquetas de
   `ui/attachment.tsx`, da 14.3); `onCreated` cria a conversa com `{ model, effort }`, chama
   `putHandoff` e navega. Regras: W24, C21, C26, C48.
5. `panel.tsx`: a passagem no `Screen`. Regras: V30 para o foco (a caixa da conversa, como hoje).
6. A rota do Início e `Home`.

### Como se prova

Critérios 3 a 13. `start.test.tsx` com MSW, como `home.test.tsx` hoje; o critério 8 em
`panel.test.tsx` com a rota do Mastra vista pelo MSW, como os testes de envio da 14.3. Hoje o
critério 3 falha (o campo sozinho). A QA faz o roteiro a 1280 e 390 px, nos dois temas, e lê o
console.

### Parar se

- O compositor da 14.3, como entrou no `main`, não recebe `answering=false` sem `memory` sem mudar
  a sua forma: relatar a linha; a mudança volta ao cartão (L7).
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

Nenhum: `Start` da U2. O título do passo já vem de `staticData.place` ("O que vamos construir
primeiro?"). Apaga o comentário "until step 13" de `build.tsx:4`.

### As skills e a leitura

React, TanStack Router.

### A ordem do trabalho

1. Apagar antes: o botão sozinho e o comentário.
2. `<Start companyId />` e, embaixo, o `Link` "Ir para o início sem pedir nada" em `text-label`.

### Como se prova

Critério 14 em `welcome-steps.test.tsx`; hoje o caso "Passo 4: a caixa cria e abre a conversa"
falha.

### Parar se

Nada que só o teste revele.

## U4 O foco depois de entrar

**Base e modelo.** `main` com a U2. Sonnet: uma função e uma regra de CSS.

### As linhas da tabela

**Foco depois de entrar e o contorno**: `hub/identity/sign-in-form.tsx:50-65`
(`focusTitleWhenRendered`); `brand/tokens.css:271-273`; o teste
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

React; o guia de design (V28) e o de web.

### A ordem do trabalho

1. O teste do critério 15 primeiro: hoje o foco vai ao título.
2. `focusWhenRendered`; o comentário cita #32-4.
3. `tokens.css` e o caso de `layout.test.ts`.

### Como se prova

Critérios 15 e 16; a QA entra com Enter e olha o título sem contorno, a 1280 e 390 px.

### Parar se

- O Chrome desenha o contorno do título mesmo com a regra nova (estilo do navegador, não o nosso):
  relatar a captura; não esconder o foco.
