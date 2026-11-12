# A entrada conversada

Trilho: assistente

O fundador, em 2026-11-12, ao pedir este cartão: "Cara, quero sim, mas vai ser um card bem grande,
velho. A gente falou de muita coisa, a gente pegou muitas referências, muitos estudos e tem que ter
tudo isso, tá? Tem que ter, senão a gente perde as informações. E verificar como que a gente vai
implementar isso, né? Que é uma parte. A gente conversou mais a parte teórica."

É a primeira etapa do Brain e da Ontologia que se constrói, e o terceiro cartão do trilho do
Assistente (delivery L1). Espera no seu rascunho até o Alinhamento do Assistente fechar (L5); por isso a
verificação `second-card` fica vermelha no pull request dele, como no PR 973. No roteiro, é o item 2
da lista "O Brain e a Ontologia", depois do U7 e do U9 do Alinhamento e antes da Ontologia da empresa.

Quatro estudos, fora do repositório (delivery L21), traçaram as referências: o do Brain e da
Ontologia, o do começo e da vida deles, o da descoberta, da tela, dos segmentos e da manutenção, e o
do intake. O que vale para todas as etapas seguintes está nas decisões
[0064](../decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md),
[0065](../decisions/0065-brain-on-mastra-knowledge-behind-our-isolation.md) e
[0066](../decisions/0066-intake-is-the-assistant-with-a-staged-skill.md); o que vale para esta etapa
está aqui. Cada linha do `main` citada foi lida em `795d0265` (2026-11-12), com `@mastra/core` 1.82.0,
`@mastra/memory` 1.41.0, `@mastra/pg` 1.35.0, `drizzle-orm` 1.0.0-rc.4 e `zod` 4.6.5. A prateleira:
`mastra-1.82@6e8dfcb8` (Mastra Code e Factory em `mastracode/`), `twenty@b76d0217`,
`appsmith@fd78f12`, `dify-latest@208a2489`, `langfuse@8ee97c4`, e a pesquisa do Mitra no
`conexus-os` congelado em `e0353c36`; as páginas públicas do Palantir foram lidas em 2026-11-12. O
Mitra e o Kiro ensinam só estrutura: nenhum texto deles entra aqui. O builder de cada unidade parte do
commit que fechar o Alinhamento e relê, nele, as linhas que o Alinhamento muda (`assistant.ts`,
`instructions.ts`, `assistant.md`, as leituras tipadas da U6 dele e o `company-memory.ts` da U9 dele).

## As palavras do fundador e as decisões

Todas de 2026-11-12, na ordem em que vieram.

- Ao primeiro estudo: `"A1 B1 C1"` (`A1`: a Ontologia entra logo depois do Sync, antes da Capacidade 4;
  `B1`: o que os agentes aprendem para a empresa passa por aprovação antes de valer; `C1`: documentos
  da empresa no Brain só com busca por palavra e os testes de ataque, enquanto o Mastra Knowledge for
  alfa). No mesmo dia: "Parte muito importante que eu quero que você estuda essa parte, que é como que a
  gente vai, tipo, a gente ter todo um workflow de início de como a gente poderia construir isso.
  Vamos supor que entrou alguém zero, né? Empresa zero, a gente tá cadastrando."
- Ao segundo estudo: "E1" (o Conexus redeclara o acesso aos documentos por pasta e por área). Sobre a
  decisão D, ele contou que pensava em algo "muito mais automatizado" e, logo depois: "Não, não é eu
  que quero. Isso aí foi tipo assim, não sugestões, foi tipo assim, dúvidas que vêm na minha cabeça se
  as referências, essas grandes referências, por exemplo, Palantir, essas outras empresas, Master
  Knowledge, se é utilizado dessa maneira, entendeu? É mais uma instigação do que definição."
- Ao terceiro estudo: "F1" (ao ligar um sistema, só o inventário mecânico; a proposta nasce com a
  primeira demanda, recortada por ela). Sobre a D: "O que eu queria montar é, tipo, um intake de
  informação, entendeu? Porque pensa, a pessoa começa na empresa e não tem nada, zero. E aí esse intake
  ajudaria a coletar essas informações." E: "o workflow ele seria mais funcionando como etapas que
  guiariam o que o agente teria que fazer. [...] sEJA CRÍTICo".
- À leitura crítica do intake: "D Aprovado" (o mesmo intake serve ao dono sozinho e ao dono com a
  nossa pessoa de implantação; o dono aprova a primeira revisão; quando o cliente compra a
  implantação, o dono convida a nossa pessoa como administradora, sem código novo).
- Ao quarto estudo: "H1" (a conversa da entrada pergunta só o que vale para a empresa inteira, e logo a
  primeira demanda) e "I1" (uma pergunta que o dono não sabe responder fica em aberto, mostrando o que
  ela desliga, no Início, sem código novo além dessa lista).
- E o que ele quer: "um intake de informação para uma empresa que começa do zero, guiado em etapas,
  que se adapte a qualquer conector", com o Conexus oferecendo implantação como serviço, à moda dos
  Forward-Deployed Engineers do Palantir.

## A página do fundador

**No fim desta etapa** uma empresa nova liga os seus sistemas na própria entrada; o Assistente diz o
que leu deles, pergunta só o que eles não dizem e vale para a empresa inteira, propõe as instruções da
empresa para você salvar com um toque, e entrega ao Builder a primeira demanda com tudo o que já se
sabe e o que ficou em aberto. No Início, você vê cada pergunta que ficou sem resposta e o que ela
desliga, e a responde quando souber. Cada conversa de entrada deixa um registro que você baixa e lê.

**O roteiro de uso.** No Hub no ar, numa empresa de teste que o firstmate registra na Central para
você.

1. Aceite o convite de dono, dê o apelido, ligue a conta de modelo e convide alguém. O passo 4,
   **Ligue seus sistemas**, mostra os conectores; ligue o Sankhya com o usuário de leitura e teste.
   O botão vira **Continuar**.
2. No passo 5, **O que vamos construir primeiro?**, aparece **Começar a conversa**. Toque: abre a
   conversa com o Assistente, que diz em poucas linhas o que leu do sistema e faz a primeira pergunta
   num cartão, em palavras do negócio, sem nome de tabela, de campo ou de código.
3. Responda as perguntas; numa delas, diga que não sabe. O Assistente mostra o rascunho das instruções
   da empresa num cartão com **Salvar nas instruções da empresa**; toque. Em **Configurações › Memória
   da empresa**, o texto está lá.
4. Diga a primeira demanda ("um CRM dos meus clientes"). O Assistente mostra **Criar app**; toque. O
   Projeto nasce com o sistema liberado, e a primeira mensagem do Builder traz o briefing com a parte
   **Em aberto** da entrada; o Builder planeja sem repetir o que você já respondeu.
5. Volte ao Início: o cartão **Termine de preparar a empresa** tem **Sistemas: feito**, e a região
   **Em aberto** mostra a pergunta que você não soube, com **Desliga:** e **Responder**. Toque em
   **Responder**: abre a conversa da entrada; responda ali. A pergunta sai da lista.
6. No menu da conversa da entrada, **Baixar o registro da entrada**: o arquivo diz cada pergunta e a
   sua resposta, as leituras feitas antes de cada uma, o que ficou em aberto e o tamanho da conversa,
   sem nenhum valor dos seus dados.
7. O seu fechamento: o mesmo na sua empresa, pelo endereço da entrada que o firstmate manda, com o
   registro lido junto com ele.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página e dá as duas palavras abaixo
(`J` e `K`). No fim: faz o roteiro, diz o que viu e aprova os textos das telas.

**Fica de fora.**

- **O inventário dos sistemas** (`F1`), a Ontologia e a aprovação da primeira revisão pelo dono (`D`):
  são a etapa seguinte, A Ontologia da empresa. Até lá o Assistente lê cada sistema como já faz, pela
  skill do conector, consulta a consulta. Isso custa tokens a cada entrada (o Mitra gastou 173,5 mil
  tokens de entrada num só turno de descoberta); o inventário é o que corta esse custo.
- **Mandar uma pergunta a um colega, com prazo** (`I2`): só se o registro das primeiras entradas
  mostrar perguntas que o dono não sabia responder.
- **Documentos e fontes de documento** (`C1`, `E1`): etapa Fontes de conhecimento.
- **Conhecimento por segmento** e **a revisão semanal**: não agora; a revisão vem depois da fila Para
  revisar.
- **Um papel de implantação**: a `D` dispensa. A nossa pessoa entra como administradora, por um convite
  comum, e conduz a conversa com você; o muro da Central não muda.
- **Os avisos guardados para um cartão** (`next-card`): o #814 (quem grava no caderno) e o #815 (a
  memória do app copiando códigos que o caderno prova) são da Ontologia, que troca o caderno por
  propostas (`B1`); esperam por ela. Nenhum outro toca a entrada.

**Duas consequências que você vai ver.**

- A conversa da entrada começa com uma frase sua, "Quero preparar a empresa no Conexus.", que o toque
  em **Começar a conversa** manda por você. No Twenty o agente fala primeiro, sem frase da pessoa; no
  Conexus a conversa sempre nasce de uma mensagem da pessoa, e este é o caminho que já existe.
- As instruções da empresa só mudam pelo seu toque no cartão (`B1`). A U9 do Alinhamento deixa o
  modelo gravar páginas da memória da empresa direto, quando quem conversa tem a permissão. O firstmate
  leva essa diferença a você antes da U9 ser construída; nesta etapa, a entrada nunca grava sem o
  toque.

**As decisões suas nesta etapa.**

- **`J`. A entrada ganha o passo "Ligue seus sistemas".** Hoje o guia diz que a entrada tem quatro
  passos (web W33), e mudar um guia pede a sua palavra (delivery L20).
  - **`J1` (recomendo).** Cinco passos: o novo é o quarto, pode ser pulado com **Fazer depois**, e o
    que for pulado vira **Sistemas: falta** no cartão do Início, como a conta de modelo e a equipe.
    Exemplo: quem não tem o usuário do ERP à mão segue e liga depois. Veredito: nativo; o como: o
    passo reusa a janela **Ligar** das Integrações, e o cartão conta as conexões ativas, como já conta
    contas e convites. Referências: a lista do Appsmith começa por "conectar uma fonte de dados"; o
    Twenty e o Conexus calculam a entrada do estado, sem bandeira guardada.
  - **`J2`.** Quatro passos; os sistemas só pelo cartão do Início. A conversa da entrada aparece só
    para quem já ligou algo.
- **`K`. Uma permissão nova no banco para a lista "Em aberto".** A lista precisa de uma tabela nova,
  e a lista de permissões do banco só muda num pull request próprio, com a sua palavra (dados D11).
  - **`K1` (recomendo).** O Hub lê e acrescenta perguntas, e muda só o estado, a resposta e quem
    respondeu. Exemplo: a pergunta "quem decide os descontos no comercial?" entra quando você diz "não
    sei" e sai quando você responde. Veredito: nativo (uma tabela e uma rota do Hub, como as outras);
    nenhuma biblioteca guarda perguntas em aberto.
  - **`K2`.** Sem tabela: as perguntas ficam só no briefing, e o Início não as mostra. Contraria a
    `I1`.

As outras escolhas desta etapa já têm a sua palavra (`A1`, `B1`, `C1`, `E1`, `F1`, `D`, `H1`, `I1`) ou
são técnicas, onde as referências convergem (a seção seguinte).

## O que os estudos deixaram para esta etapa

### O intake em sete etapas, para qualquer fonte

Cada etapa diz **o que aprender**, nunca "analisar a tabela": a boa prática do Palantir é entender o
domínio, desenhar o modelo e só depois mapear a fonte, e o Notion e o Drive nem têm tabela. O **como**
de cada sistema já mora na skill do conector (a do Sankhya começa por "Name the concept in the
person's words", `packages/connectors/src/sankhya/skill/SKILL.md:58`). As fontes de cada etapa são
três: o que a fonte declara de si, a pessoa (o que nenhuma fonte diz) e os documentos (o que a empresa
escreveu).

| # | Etapa | Quem faz | O que sai | Acaba quando | Nesta etapa |
| --- | --- | --- | --- | --- | --- |
| 1 | Ligar os sistemas | o dono, na entrada | as conexões | ao menos uma ativa, ou "Fazer depois" | U1 |
| 2 | Inventário | a máquina, sem modelo | o que cada fonte declara | cada conexão com inventário datado, ou erro visível | fica para a Ontologia; até lá, a leitura do Assistente pela skill do conector |
| 3 | A conversa da empresa | o Assistente, com o dono | rascunho das instruções, perguntas em aberto, a primeira demanda | a primeira demanda tem nome, cada item está sabido, em aberto ou "não se aplica", ou o dono vai para o Início | U2, U3, U4, U5 |
| 4 | O recorte da demanda | o Builder | os conceitos candidatos, cada um com a prova | todo dado do app tem fonte, ou virou pergunta | o plano de hoje (`conexus-plan-new`, etapa 2); a descoberta com prova é da Ontologia |
| 5 | As perguntas da área | o Builder, com o dono | as regras da área e o significado dos códigos | cada decisão respondida, ou deixada em aberto com o que desliga | o plano de hoje, mais a lista "Em aberto" (U6) |
| 6 | Proposta e aprovação | o dono | a revisão 1 da Ontologia e as páginas do Brain | aprovada, ou itens recusados | as instruções pelo cartão (U5); a revisão 1 é da Ontologia |
| 7 | Construção | o Builder | o app | fora do intake | o de hoje |

A conversa da empresa aprende, e só isto (`H1`): o que a empresa faz e para quem; as áreas e quem
decide em cada uma; as palavras da casa (os sinônimos, o que "pedido" e "venda" querem dizer ali); a
primeira demanda e por que ela vem primeiro. As regras de uma área ficam para a demanda dela.

### Como roda de novo, curto

| Etapa | Primeira demanda | Nova demanda, mesma área | Nova demanda, área nova |
| --- | --- | --- | --- |
| 1 Ligar | sim | só se precisar de outro sistema | só se precisar de outro sistema |
| 2 Inventário | ao ligar | não; a diferença roda todo dia | não |
| 3 Conversa da empresa | sim, curta | não | só sobre a área: quem decide e as palavras dela |
| 4 Recorte | tudo o que a demanda toca | só o que falta | só o que falta |
| 5 Perguntas | as da área | só as que a demanda abriu | as da área nova |
| 6 Aprovação | revisão 1, pelo dono | revisão nova, quem tem a permissão | idem |

O que torna o intake curto é o reuso: as instruções do Kiro uma vez e a especificação por
funcionalidade; o "each round shorter than the last" do Twenty. O Mitra refazia a descoberta a cada
turno, e o estudo dele pede que ela vire "artefato reutilizável e cacheado".

### Fixo ou agente

A ordem das etapas é fixa; o que acontece dentro da 3, da 4 e da 5 é do agente. O Mastra instalado diz:
"Use agents when the task is open-ended and the steps aren't known in advance"
(`node_modules/@mastra/core/dist/docs/references/docs-agents-overview.md:133`) e "Use workflows for
tasks that are clearly defined upfront" (`docs-workflows-overview.md:13`). O Mastra Code (os modos
`plan`, `build` e `explore` são o mesmo laço com outro texto), o Factory (cada fase de um cartão chama
uma skill), o agente de configuração do Twenty e as fases do Kiro conduzem trabalho guiado com uma
pessoa assim: etapas escritas, perguntas em cartão, um portão de aprovação. Nenhum roda a conversa
dentro de um workflow; o workflow fica com o mecânico (o inventário, na Ontologia). A conversa não
tem número de rodadas conhecido: cada cartão nasce de uma resposta ("Another card exists only because a
decision is still the person's", `packages/app/skills/conexus-plan-new/SKILL.md:59`).

A ordem mora em dois lugares: na skill, como as etapas do `conexus-plan-new`, e no estado calculado
do banco (conexões, conversa da entrada, instruções, Projetos), como o `preparationOf`. Nenhuma
bandeira guardada.

**Quando revisitar.** Se as perguntas passarem a ir para outras pessoas, com prazo (`I2`), a forma é o
nó "Human Input" do Dify (destinatários, prazo de 36 horas, expira), e um workflow com `suspend` ganha.

### O dono sozinho e o dono com a nossa pessoa (`D`)

| Pergunta ou ato | Dono sozinho | Dono com a nossa pessoa, administradora |
| --- | --- | --- |
| Ligar os sistemas | o dono | ela, pela permissão de administradora, ou o dono |
| O que os sistemas já dizem | ninguém responde: o agente lê | idem |
| O que a empresa faz, as áreas, quem decide | o dono, na conversa da empresa | ela conduz; quem responde é o dono |
| As palavras da casa | o dono | ela propõe do que viu nos dados; o dono confirma |
| As regras de uma área | o dono, ou fica em aberto (`I1`) | ela pergunta ao dono ou a quem ele indicar, e escreve a resposta |
| A forma de uma tela, a ordem, as palavras do app | o agente escolhe ("Yours to choose") | idem |
| Salvar as instruções da empresa | o dono, pelo cartão | quem tiver a permissão Memória da empresa, ela inclusive |
| Aprovar a revisão 1 da Ontologia | o dono | o dono (`D`; etapa da Ontologia) |

A nossa pessoa não é a empresa: uma regra de negócio que ela escreve entra como proposta, com o nome
dela. "Business rules and company facts belong to the person"
(`apps/server/src/builder/conversation/prompt/builder.md:64`) e "Never infer a company fact"
(`conexus-plan-new/SKILL.md:63`) já valem. O Palantir faz o mesmo movimento: desde março de 2026 o AI
FDE "build and maintain your ontology" por linguagem natural, com mudanças validadas num ramo "before
merging"; a pessoa FDE fica do lado de quem revisa.

### Começar antes de congelar

A entrada roda primeiro na sua empresa, com o que existe, e cada uma fica registrada (U7). Uma etapa
congela quando o caminho dela, escrito depois de uma entrada, prevê o que o agente fez na seguinte: uma
leitura que se repete igual vira parte do inventário; uma pergunta que se repete em toda empresa vira
pergunta fixa da skill, ainda feita pelo agente; uma regra que o agente sempre descobre do mesmo jeito
vira uma verificação em código. Nenhuma referência dá um número de entradas; o teste não precisa dele.
O que registrar de cada entrada: o caminho (que fontes e leituras, em que ordem); as perguntas, que no
fechamento você e o firstmate marcam como "só a pessoa sabia", "estava nos dados" (falha) ou "o
agente podia escolher" (falha); os valores que o agente supôs, marcados como hipótese (lição do
Mitra); o que ficou em aberto e o que desligou; o tamanho; e, numa segunda demanda, o que foi reusado e
o que se perguntou de novo (falha).

### As afirmações sobre o Palantir

| Afirmação | Veredito | Evidência |
| --- | --- | --- |
| Forward-Deployed Engineers trabalham dentro do cliente | confirmada | página da comunidade "Who are Palantir FDEs": "a hybrid of software engineer and consultant who works directly with clients" |
| Elas "mapeiam a realidade em objetos da Ontologia" | não encontrada com essas palavras | a página não fala da Ontologia |
| Bootcamp: um caso de uso em poucos dias | só a alegação do Palantir | o relatório anual fala em "within days"; "one to five days" vem de terceiros |
| Um agente faz o papel da FDE | confirmada | AI FDE, anúncios de março de 2026 |
| Existe o OMCP | confirmada | "Ontology MCP (OMCP) is a Developer Console feature"; serve a quem consome a Ontologia, não a quem a desenha |
| O OMCP é interno e usado para planejar | contradita em parte | é público; quem desenha tipos é o Palantir MCP, que "cannot write ontology data" e passa toda mudança por proposta |
| Action Types e write-back | confirmada | o write-back roda antes de gravar e, se falha, nada se aplica |
| Os "quatro pilares" | não encontrada | o Palantir divide em elementos semânticos e cinéticos |
| Integração automática de ERP | em parte | `"Currently, HyperAuto V2 supports SAP data sources only"`; a criação automática era da primeira versão, encerrada |

### Correções aos estudos, contra o `main` de hoje

1. **Não existe trilha de auditoria no Hub.** Os estudos põem o registro do intake "na trilha de
   Atividade da decisão 0052"; a 0052 promete essa tabela para a etapa 21.1, e nenhuma tabela de
   atividade existe hoje (nenhum `audit` nem `activity` em `apps/server/src` fora de testes). O
   registro desta etapa sai do que o Mastra já guarda da conversa (as chamadas, as respostas dos
   cartões, as leituras), sem tabela nova (U7).
2. **A skill não "abre a conversa".** O estudo do intake diz que o passo de conversa "abre a conversa
   do Assistente com a skill". No Mastra, a skill é carregada pelo modelo, sob demanda (`skill`,
   `skill_read`: `docs-skills.md:49`). O caminho certo: a conversa da entrada fica marcada no Hub, o
   bloco da conversa diz o lugar, e o texto fixo manda carregar a skill nesse lugar (U3).
3. **A entrada tem uma regra de guia.** Os estudos põem o passo "Sistemas" sem notar que o web W33 fixa
   quatro passos: a mudança pede a palavra do fundador (`J`) e um pull request de documentos antes da
   U1 (L20).
4. **A frase do Builder** que o estudo cita em `builder.md:62` está em `:64`.
5. **O critério da pergunta respondível pelos dados** não se prova com o modelo dublê: o dublê diz o que
   o roteiro manda. Vira um caso `should` no placar do Alinhamento (U11 dele), com o modelo de
   verdade; o `must` prova que o registro guarda cada pergunta (U7).
6. **A lista "Em aberto"** fica no Início, como a `I1` diz, e não em "Conhecimento › Para revisar", tela
   que só nasce com a saúde da Ontologia.
7. **`listSuspendedRuns`** não é usado no Conexus (nenhuma chamada em `apps/server/src`). A pergunta
   parada num cartão já volta pela conversa, que o Mastra guarda; nada a construir.
8. **O exemplo da abertura** do estudo usa contagens do ERP do fundador; o cartão usa números
   inventados.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 Ligue seus sistemas | O passo 4 da entrada, com a janela **Ligar** de hoje; o passo "O que vamos construir" vira o 5; `preparationOf` ganha `systems`; o cartão do Início ganha **Sistemas** | `apps/web/src/routes/_app/companies/$companyId_/welcome/`, `apps/web/src/hub/identity/`, `apps/web/src/hub/connectors/public.ts` (só exporta) | [web](../guides/web.md) | a palavra `J1` e o pull request de documentos que muda o W33 |
| U2 A skill da entrada | `conexus-intake`, ao lado de `conexus`, nas skills do Assistente: as etapas 3 e a volta curta, com "done when", sobre o que aprender | `apps/server/src/builder/assistant/skills/`, `apps/server/src/builder/assistant/assistant.ts` | [testing](../guides/testing.md) | o Alinhamento fechado |
| U3 A conversa da entrada | A marca `entry` na conversa, uma por pessoa e empresa; a rota que a acha; o bloco diz o lugar e o texto fixo manda carregar a skill; o passo 5 abre ou continua a conversa | `apps/server/src/builder/assistant/`, `apps/server/migrations/`, `packages/hub-api/src/`, `apps/web/src/builder/assistant/`, `apps/web/src/routes/_app/companies/$companyId_/welcome/build.tsx` | [data](../guides/data.md) | U1 (o passo 5), U2 |
| U4 Em aberto | A tabela das perguntas em aberto; `leave_open` e `settle_open` no Assistente; a rota da lista; a região **Em aberto** do Início; o hand-off leva as perguntas abertas ao Builder | `apps/server/src/builder/assistant/`, `apps/server/migrations/`, `packages/hub-api/src/`, `apps/web/src/builder/assistant/`, `apps/web/src/routes/_app/companies/$companyId/index.tsx` | [security](../guides/security.md) | U3; o pull request da permissão no banco, com a palavra `K1` (D11) |
| U5 As instruções pelo cartão | `propose_company_instructions` e o cartão **Salvar nas instruções da empresa**; a rota que grava pelo módulo da U9 do Alinhamento | `apps/server/src/builder/assistant/`, `packages/hub-api/src/`, `apps/web/src/builder/assistant/`, `apps/web/src/builder/conversation/assistant-specs.ts` | [security](../guides/security.md) | U4 (a mesma pasta e as perguntas que a resposta fecha) |
| U6 Em aberto no Builder | O Builder ganha `leave_open` e `settle_open`; a skill do plano manda usá-los | `apps/server/src/builder/conversation/builder.ts`, `packages/app/skills/conexus-plan-new/SKILL.md` | [testing](../guides/testing.md) | U4; as unidades do trilho de fronteira em construção que tocarem essas duas pastas (L1) |
| U7 O registro da entrada | A rota que monta o registro de uma conversa da entrada e o item **Baixar o registro da entrada** no menu dela | `apps/server/src/builder/assistant/`, `packages/hub-api/src/`, `apps/web/src/builder/assistant/` | [testing](../guides/testing.md) | U4, U5 (o registro lê as chamadas delas) |

U1 e U2 não dividem pasta e correm em paralelo. U3, U4, U5 e U7 vão em fila, porque dividem o agente,
as rotas e o contrato do Assistente. U6 vem depois da U4 e espera o trilho de fronteira nos seus dois
arquivos. A ordem do pull request: U1, U2, U3, U4, U5, U6, U7.

**Os trilhos.** O trilho do Assistente é dono de `apps/server/src/builder/assistant/` e de
`apps/web/src/builder/assistant/`. A entrada (`welcome/`, `hub/identity/`) e a pasta das migrações são
da fronteira; a U1, a U3 e a U4 esperam as unidades dela que as tocarem, e só acrescentam. A U6 muda o
Builder de propósito: a pergunta que o dono não sabe responder nasce, na maioria, no plano do Builder,
e a `I1` quer todas no Início.

**Orçamento de código alterado.** U1: 260. U2: 100 (a skill, cerca de 85 linhas, e o registro dela).
U3: 280. U4: 450. U5: 280. U6: 40. U7: 220. Total da etapa: cerca de 1.630, sem testes nem gerados
(delivery L2). A base: os quatro passos da entrada e o cartão somam 300 linhas (`wc -l` de `welcome/`,
`preparation.ts`, `enter-company.ts`); o `propose_app` e o hand-off, 94 e 330; a skill
`conexus-plan-new`, 77.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | O dono sem conexão ativa, depois da equipe, cai em "Ligue seus sistemas", passo 4 de 5; **Fazer depois** leva ao passo 5; com uma conexão `ACTIVE`, o botão diz **Continuar**. Uma conexão `NEW` ou `NEEDS_REAUTH` não conta. Falha hoje: o passo não existe | `apps/web/src/hub/identity/welcome-steps.test.tsx`, "o passo dos sistemas" | must |
| 2 | U1 | A entrada abre no passo que falta, nesta ordem: conta de modelo, equipe, sistemas, e o passo 5; **Voltar** do 5 leva ao 4, e do 4 ao 3 | `welcome-steps.test.tsx`, "a ordem dos cinco passos" | must |
| 3 | U1 | **Ligar** no passo abre a janela das Integrações, com o mesmo formulário; depois de ligar e testar, a conexão aparece ligada no passo | `apps/web/src/hub/identity/welcome-systems.test.tsx`, "liga pelo passo" | must |
| 4 | U1 | O cartão **Termine de preparar a empresa** mostra **Sistemas: falta** até haver uma conexão `ACTIVE`; com só os sistemas faltando, **Continuar** leva às Integrações; com tudo feito, some | `apps/web/src/hub/identity/preparation.test.tsx`, "os sistemas" | must |
| 5 | U1 | O passo 4 nas capturas a 1366 e 390 px, nos dois temas, sem estouro horizontal | `welcome-systems.test.tsx` e o seu layout | must |
| 6 | U2 | A skill `conexus-intake` passa na validação do Mastra (`skillOf`) e está na lista de skills de toda conversa do Assistente, ao lado de `conexus` | `apps/server/src/builder/assistant/intake-skill.test.ts`, "a skill existe e vale" | must |
| 7 | U2 | Com o modelo de verdade, sobre o Sankhya de teste, numa conversa da entrada: nenhuma pergunta de cartão nomeia uma tabela, um campo ou um código do dublê, e nenhuma pergunta pede o que as leituras feitas antes dela responderam | as perguntas da entrada no placar do Alinhamento (`assistant.scorecard.test.ts`, com `CONEXUS_EVAL_REAL_MODEL`) | should |
| 8 | U3 | O dono cria a conversa com `entry: true`: 201; uma segunda: 409 `ENTRY_EXISTS` com o id da primeira nos detalhes; duas ao mesmo tempo: uma 201 e a outra 409; `entry` com `projectId`: `REQUEST_MALFORMED`; um membro sem a permissão Memória da empresa: `NOT_IN_ROLE` | `apps/server/src/builder/assistant/entry.test.ts`, "uma por pessoa", "ao mesmo tempo", "só no Início", "quem abre" | must |
| 9 | U3 | `GET` da conversa da entrada devolve a da própria pessoa; outra pessoa da mesma empresa recebe `null`; quem não está na empresa, `NOT_FOUND` | `entry.test.ts`, "cada um acha a sua" | must |
| 10 | U3 | O pedido ao modelo numa conversa da entrada leva no bloco `Place: Início, the company's entry conversation.`; numa conversa comum do Início, `Place: Início.` como hoje; a mensagem fixa tem os mesmos bytes nas duas | `apps/server/src/builder/assistant/instructions.test.ts`, "o lugar da entrada" | must |
| 11 | U3 | O passo 5, com uma conexão ativa e conta de modelo: **Começar a conversa** cria a conversa com todas as conexões ativas escolhidas, abre e manda "Quero preparar a empresa no Conexus." uma vez; ao voltar, **Continuar a conversa** abre a mesma; sem conexão ativa ou sem conta, a caixa de hoje | `apps/web/src/builder/assistant/entry.test.tsx`, os três estados | must |
| 12 | U4 | `leave_open` numa conversa do Assistente grava a pergunta e o que ela desliga e devolve o id; a mesma pergunta de novo na mesma conversa devolve o mesmo id, sem linha nova; acima de 300 caracteres, o erro de validação volta ao modelo | `apps/server/src/builder/assistant/open-questions.test.ts`, "deixa em aberto" e "a mesma pergunta" | must |
| 13 | U4 | `settle_open` com o id de uma pergunta desta conversa a fecha com a resposta e quem respondeu; com o id de outra conversa, `NOT_FOUND` e nada muda; a segunda vez não muda nada | `open-questions.test.ts`, "fecha a sua" e "não fecha a de outra" | must |
| 14 | U4 | A lista: dono e administrador recebem as perguntas abertas da empresa, da mais nova para a mais velha, com quem as deixou e a conversa; um membro sem a permissão Memória da empresa, `NOT_IN_ROLE`; outra empresa, `NOT_FOUND`; as fechadas não vêm | `apps/server/src/builder/assistant/open-questions-routes.test.ts` | must |
| 15 | U4 | A empresa B não lê, não fecha e não lista uma pergunta da A, pela rota e pelo banco com as outras camadas desligadas (testing T13) | `apps/server/src/platform/isolation-open-questions.test.ts` | must |
| 16 | U4 | A região **Em aberto** do Início, para dono e administrador: cada pergunta com **Desliga:** e, quando a conversa é de quem vê, **Responder**, que a abre; sem perguntas, a região não aparece; para o membro, nunca; nos estados da matriz, a 1366 e 390 px, nos dois temas | `apps/web/src/builder/assistant/open-questions.test.tsx` e o seu layout | must |
| 17 | U4 | O toque em **Criar app** de uma conversa com perguntas abertas: a primeira mensagem do Builder traz, depois do briefing, o bloco "Em aberto na conversa com o Assistente" com cada pergunta e o que ela desliga, lidos da tabela; as fechadas não vêm; sem perguntas, nenhum bloco | `apps/server/src/builder/assistant/handoff.test.ts`, "o que ficou em aberto vai junto" | must |
| 18 | U5 | `propose_company_instructions` existe só para quem tem a permissão Memória da empresa e fora de uma automação; para um membro, não está entre as ferramentas | `apps/server/src/builder/assistant/instructions-proposal.test.ts`, "quem pode propor" | must |
| 19 | U5 | A ferramenta não grava nada: a página das instruções continua como era até o toque. O toque grava o texto do cartão; um segundo toque não cria versão nova; acima de 2.000 caracteres, a ferramenta recusa antes do cartão; quem perdeu a permissão entre o cartão e o toque recebe `NOT_IN_ROLE`; o cartão de outra pessoa, `NOT_FOUND` | `instructions-proposal.test.ts`, "só o toque grava", "duas vezes", "o teto", "a permissão de agora", "o cartão de outro" | must |
| 20 | U5 | Depois do toque, uma conversa nova do Assistente da empresa leva as instruções gravadas no pedido (o critério 26 do Alinhamento, atravessando U5 e U9) | `instructions-proposal.test.ts`, "vale na conversa seguinte" | must |
| 21 | U5 | O cartão nos estados da matriz: o texto, o botão para quem pode, "Salvo nas instruções da empresa" com o caminho de Configurações depois do toque, e a falha com **Tentar de novo**; a 1366 e 390 px, nos dois temas | `apps/web/src/builder/assistant/instructions-proposal.test.tsx` e o seu layout | must |
| 22 | U6 | O Builder tem `leave_open` e `settle_open`; uma pergunta que ele deixa aparece na lista com a conversa do Builder e o Projeto; **Responder** abre essa conversa | `apps/server/src/builder/conversation/open-questions.test.ts`, "o Builder também deixa em aberto" | must |
| 23 | U6 | A skill do plano diz, na entrevista, para deixar em aberto pela ferramenta e fechar quando a pessoa responder | `apps/server/src/builder/conversation/prompt.test.ts`, "a skill do plano usa a lista" | must |
| 24 | U7 | O dono da conversa da entrada baixa `registro-da-entrada.md`: cada pergunta de cartão com a resposta ou "sem resposta", as leituras feitas antes dela (a conexão, a leitura e quantas linhas), as perguntas deixadas e fechadas, as propostas feitas e se foram tocadas, e quantos turnos e cartões; um valor plantado nas linhas do dublê não aparece; outra pessoa, ou uma conversa que não é da entrada, `NOT_FOUND` | `apps/server/src/builder/assistant/entry-record.test.ts`, "o registro diz o caminho", "nenhum valor", "só o seu" | must |
| 25 | U7 | O item **Baixar o registro da entrada** aparece só no menu da conversa da entrada | `apps/web/src/builder/assistant/conversation-menu.test.tsx`, "o registro da entrada" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Entrada, passo 4 "Ligue seus sistemas" | a lista dos conectores com **Ligar**, e **Fazer depois** | sem conector no catálogo: "Nenhum sistema para ligar ainda." e **Fazer depois** | o quadro dos passos na hora e a lista em esqueleto (W34) | a falha da leitura com **Tentar de novo** (W17) | a empresa que o Hub não acha: a página de não encontrado de hoje | quem não é dono nunca vê a entrada (`enterWelcome`) | conexão recusada no teste: a frase da janela de hoje, e o botão continua **Fazer depois** |
| Entrada, passo 5 "O que vamos construir primeiro?" | **Começar a conversa**, a frase do que acontece e "Ir para o início sem pedir nada" | sem conexão ativa ou sem conta: a caixa de hoje | o quadro e o botão desligado | a criação que falhou: a frase de hoje com **Tentar de novo**, a chave guardada (W24) | — | quem não é dono nunca vê | `ENTRY_EXISTS`: abre a que existe |
| Início, região **Em aberto** | não aparece (nenhuma pergunta) | não aparece | não aparece até ler | não aparece; a falha vai ao log da tela, como o cartão de preparação | — | o membro não a vê; a rota diz `NOT_IN_ROLE` e a tela não desenha nada | — |
| Conversa, cartão das instruções | o texto e **Salvar nas instruções da empresa** | — | o botão em espera depois do toque | a frase da falha e **Tentar de novo** | o cartão que o Hub não acha: "Este cartão não existe mais." | quem não pode salvar vê o texto e "Peça a um dono ou administrador para salvar." | `NOT_IN_ROLE` depois do toque: a mesma frase |
| Menu da conversa, **Baixar o registro da entrada** | o item no menu | — | o download do navegador | a frase da falha | `NOT_FOUND`: "O registro não existe mais." | só a própria pessoa vê a conversa | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `assistant_conversation.entry` | a criação, uma vez (U3) | o bloco da conversa (U3), a rota da entrada (U3), o registro (U7), o menu (U7) |
| `AssistantConversation.entry` | a rota das conversas (U3) | o menu da conversa (U7) |
| `readEntryConversation.conversation` | a rota (U3) | o passo 5 (U3) |
| `OpenQuestion.question`, `.leavesOff` | `leave_open` (U4, U6) | a lista (U4), o hand-off (U4), o registro (U7) |
| `OpenQuestion.state`, `.answer`, `.settledBy` | `settle_open` (U4, U6) | a lista (as fechadas saem, U4), o registro (U7) |
| `OpenQuestion.conversation`, `.mine` | a rota da lista (U4) | o **Responder** (U4) |
| `ProposedInstructions.text` | `propose_company_instructions`, guardado com a chamada (U5) | o cartão (U5), a rota do toque (U5), o registro (U7) |
| `Preparation.systems` | `preparationOf` (U1) | o passo 4, o redirecionamento da entrada e o cartão do Início (U1) |

### Os desenhos de caixas

Nenhuma tela do produto antigo é parecida: o antigo não tinha entrada guiada nem lista de perguntas
abertas. Os desenhos seguem as telas de hoje que cada uma estende: o passo 2 da entrada (a conta de
modelo, com `LinkAccount` e o botão do fim), o cartão de preparação do Início e o cartão **Criar app**
da conversa. As perguntas da entrevista `shape` vão ao fundador pelo firstmate, em português, antes da
U1 (delivery L23); o resumo dela entra aqui numa emenda.

Passo 4, a 1280 px:

```text
┌─────────────────────────────────────────────── Passo 4 de 5 ─── [Sair] ┐
│ [Voltar]   Ligue seus sistemas                                          │
│ O Assistente lê os sistemas que você ligar para perguntar só o que eles │
│ não dizem. Eles ficam em Integrações.                                   │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [logo] Sankhya        ERP: pedidos, clientes, estoque       [Ligar] │ │
│ │ [logo] Mercado Livre  Vendas e perguntas da loja            [Ligar] │ │
│ │        ✓ Sankhya da matriz — ligada                                 │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                              [Fazer depois | Continuar] │
└─────────────────────────────────────────────────────────────────────────┘
```

Passo 4, a 390 px: a mesma coluna; cada conector em duas linhas (logo e nome; resumo), **Ligar**
embaixo à direita, o botão do fim em largura inteira.

Passo 5, a 1280 px, com sistema e conta:

```text
┌─────────────────────────────────────────────── Passo 5 de 5 ─── [Sair] ┐
│ [Voltar]   O que vamos construir primeiro?                              │
│ O Assistente conversa com você: diz o que leu dos seus sistemas,        │
│ pergunta só o que eles não dizem e leva o seu primeiro pedido ao        │
│ Builder.                                                                │
│                                    [Começar a conversa]                 │
│                      Ir para o início sem pedir nada                    │
└─────────────────────────────────────────────────────────────────────────┘
```

Início, a região **Em aberto**, a 1280 px, no lado, abaixo do cartão de preparação:

```text
┌ Em aberto ────────────────────────────────────────────┐
│ Quem decide os descontos no comercial?                │
│ Desliga: o desconto por vendedor no app      [Responder]│
│ ───────────────────────────────────────────────────── │
│ A meta conta a venda de balcão?                       │
│ Desliga: a meta do app de vendedores                  │
│ Na conversa de Ana                                    │
└───────────────────────────────────────────────────────┘
```

A 390 px: a região vem depois do cartão de preparação, em largura inteira; **Responder** embaixo de
cada pergunta.

O cartão das instruções na conversa, como o **Criar app**:

```text
┌ Instruções da empresa ────────────────────────────────┐
│ A Empresa Exemplo vende material elétrico para        │
│ construtoras. "Pedido" é o que o cliente fecha; …     │
│ [Salvar nas instruções da empresa]                    │
└───────────────────────────────────────────────────────┘
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Criar a conversa da entrada (U3), `INSERT` em `assistant_conversation` com `entry` | o índice único parcial deixa uma; a outra recebe `ENTRY_EXISTS` com o id, e a tela abre essa | a linha nasce antes da conversa (`chosen.ts:29-55`); a mesma chave de tentativa acha a primeira (C37) | `DATABASE_UNAVAILABLE`; a tela guarda a chave (W24) | a linha de criação de hoje, com `entry: true` | 8, 11 |
| `leave_open` (U4, U6), `INSERT` em `assistant_open_question` | a chave única (conversa, pergunta) deixa uma; as duas chamadas devolvem o mesmo id | a resposta cortada ao modelo: a linha pode existir; a mesma chamada de novo devolve o mesmo id | o erro volta ao modelo como resultado da ferramenta, e o turno segue; nada é engolido | `OPEN_QUESTION_LEFT` com empresa, conversa e id, sem o texto | 12, 22 |
| `settle_open` (U4, U6), `UPDATE` do estado e da resposta | a segunda não acha linha aberta e devolve `settled: true` sem mudar nada | idem; refazer não muda | idem | `OPEN_QUESTION_SETTLED` com empresa, conversa, id e quem | 13 |
| Toque em **Salvar nas instruções da empresa** (U5), `upsertPage` do `Knowledge` pelo módulo da U9 | o `upsertPage` pula o igual (`@mastra/core@1.82.0` `dist/knowledge/host-writes.d.ts:8-26`); textos diferentes: o último vence, como o `PUT` da U9 | a resposta cortada: a tela tenta de novo e o resultado é o mesmo | o banco do Mastra fora: `DATABASE_UNAVAILABLE`, nada gravado no Hub | `COMPANY_INSTRUCTIONS_SAVED` com quem, empresa e conversa, sem o texto | 19, 20 |
| O hand-off que lê as perguntas abertas (U4) | só leitura; o hand-off de hoje já é chaveado | a leitura falha antes do envio: nada enviado, a chave guardada | `DATABASE_UNAVAILABLE` antes de criar o Projeto | as linhas de hoje do hand-off | 17 |
| O registro (U7) | só leitura | — | `DATABASE_UNAVAILABLE` | nenhuma | 24 |
| Ligar no passo 4 (U1) | a janela de hoje, sem mudança | idem | idem | idem | 3 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A entrada calculada do estado | U1 | `apps/web/src/hub/identity/preparation.ts:17-23` (`preparationOf`: conta e equipe); `welcome/index.tsx:12-35` (vai ao passo que falta) | `twenty@b76d0217` `packages/twenty-server/src/engine/core-modules/onboarding/onboarding.service.ts:108-177`; `appsmith@fd78f12` `app/client/src/pages/Editor/FirstTimeUserOnboarding/Utils.ts:1-6`, `Checklist.tsx:158-212` | O passo é lido do estado real a cada vez, nunca guardado; o Appsmith começa por "conectar uma fonte de dados" | nativo (o padrão de hoje, com um campo a mais) | — | `J1` | `apps/web/src/routes/_app/companies/$companyId_/welcome/systems.tsx` |
| Ligar um sistema dentro da entrada | U1 | `apps/web/src/hub/connectors/link-dialog.tsx:272-299` (`LinkDialog`); `integrations.tsx:94-176` | o mesmo `LinkDialog`; o passo 2 da entrada reusa `LinkAccount` do mesmo jeito (`welcome/model-account.tsx:23-32`) | A janela das Integrações, com os mesmos campos e o mesmo login por OAuth | nativo | — | `J1` | `apps/web/src/hub/identity/welcome-systems.tsx` |
| Quem conduz a conversa da empresa | U2, U3 | `apps/server/src/builder/assistant/skills/conexus/SKILL.md:10` ("Each Projeto holds one app, built by the Builder in a conversation of its own"); `builder/conversation/builder.ts:136-157` (o Builder nasce das conexões do Projeto) | `twenty@b76d0217` `.../ai/ai-chat/services/workspace-setup-chat.service.ts:65-100` (o mesmo chat do produto, só para quem criou o espaço) | O agente de sempre, com outro texto; nenhum agente novo | nativo (o Assistente de hoje) | — | `D`, `H1` | — |
| Etapas escritas com "done when" | U2 | `packages/app/skills/conexus-plan-new/SKILL.md:10`, `:46-65` | `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/modes/plan.ts:12-16`; `mastracode/factory/factory-skills/factory-plan/SKILL.md:8-14`; `twenty@b76d0217` `.../ai/ai-chat/constants/workspace-setup-system-prompt.constant.ts:23-72` | O mesmo laço de agente com etapas num texto; cada etapa termina numa condição; o Twenty tem "First reply", a proposta, "After approval", "What comes next" e "Ending the setup" | nativo (`createSkill`, `@mastra/core@1.82.0` `dist/docs/references/docs-skills.md:24-49`) | — | — | `apps/server/src/builder/assistant/skills/conexus-intake/SKILL.md` |
| O que aprender, nunca a tabela | U2 | `packages/connectors/src/sankhya/skill/SKILL.md:56-62` (o como de cada sistema) | Palantir, "Ontology best practices" (domínio, modelo, só depois a fonte), lido em 2026-11-12; a regra de suficiência e as hipóteses do estudo do Mitra (só estrutura) | A etapa pede o domínio; a fonte vem depois; a conversa acaba por suficiência, não por número de perguntas | nativo (texto da skill) | — | `H1` | — |
| Pouco e curto | U2 | — | `twenty@b76d0217` `workspace-setup-system-prompt.constant.ts:9` ("When in doubt, propose less"), `:41-43`, `:53-63` ("so each round is shorter than the last") | Propõe o mínimo; cada rodada é menor que a anterior | nativo (texto da skill) | — | `H1` | — |
| Perguntas em cartão | U2 | `apps/server/src/builder/conversation/plan-tools.ts:26-71` (`ask_user`, 1 a 4 perguntas, `suspend` nativo) | `@mastra/core@1.82.0` `askUserTool` de `@mastra/core/agent-controller` | Suspende com as perguntas e retoma com uma resposta por pergunta | nativo (já ligado no Assistente, `assistant.ts:64-75`, `:312-315`) | — | — | — |
| A lista de tarefas como roteiro | U2 | `apps/server/src/builder/controller-kit/factories.ts:40-43` (`task_write`, `task_check`) | `mastra-1.82@6e8dfcb8` `mastracode/sdk/src/agents/prompts/tool-guidance.ts:154-215` | "Use when a task requires 3 or more distinct steps"; conferir antes de terminar | nativo | — | — | — |
| Uma conversa da entrada por pessoa | U3 | `apps/server/src/builder/assistant/tables.ts:15-43` (`assistant_conversation`); `chosen.ts:29-55` (a criação chaveada) | `twenty@b76d0217` `.../ai/ai-chat/services/workspace-setup-chat.service.ts:168-173`, `:209-228` (id determinístico da conversa de configuração; nada se refaz se ela já tem mensagens) | Uma conversa de configuração por pessoa; a segunda tentativa acha a primeira | embrulhado (a marca e o índice único são nossos; a criação é a de hoje) | `entry.test.ts` | — | `apps/server/migrations/<data>_assistant_entry/` |
| O lugar no bloco e a skill carregada | U3 | `apps/server/src/builder/assistant/instructions.ts:43-62` (`blockOf`: empresa, pessoa, data, lugar, conexões) | `@mastra/core@1.82.0` `dist/docs/references/docs-skills.md:49`, `:97-120` (skills sob demanda, por pedido) | A skill é carregada pelo modelo; o pedido diz onde ele está | nativo (o bloco de hoje e o texto fixo) | — | — | — |
| A primeira mensagem | U3 | `apps/web/src/builder/assistant/home.tsx:51-97` (`useBegin`: cria, abre e manda a pergunta uma vez) | `twenty@b76d0217` `.../ai/ai-chat/services/agent-chat-streaming.service.ts:207-251` (`startOpeningTurn`: o agente fala primeiro, de um contexto que a pessoa não escreveu) | No Twenty, o servidor abre o turno; aqui, a conversa nasce da mensagem da pessoa, mandada pelo toque | nativo (o hand-off de hoje, com uma frase fixa) | — | consequência na página | `apps/web/src/builder/assistant/entry.tsx` |
| As perguntas em aberto, com o que desligam | U4, U6 | `conexus-plan-new/SKILL.md:61`, `:65` ("left open in the plan with what it leaves off") | os "Pontos em Aberto" contados do estudo do Mitra (só estrutura); `dify-latest@208a2489` `api/core/workflow/nodes/human_input_v2/entities.py:88-108` (a forma da `I2`, fora) | Uma lista contada do que falta, com o que cada item trava | nativo (Drizzle e uma rota do Hub, como `hub/identity/nickname.ts`); nenhuma biblioteca guarda perguntas em aberto | — | `I1`, `K1` | `apps/server/src/builder/assistant/open-questions.ts` |
| O hand-off leva o que está em aberto | U4 | `apps/server/src/builder/assistant/handoff.ts:170-193` (`contentsOf`: o resumo, o briefing cercado, os arquivos) | o próprio `contentsOf` | Cada bloco de texto vai como uma parte da mensagem do Builder | embrulhado (um bloco a mais, lido da tabela) | `handoff.test.ts` | — | — |
| O portão das instruções no código | U5 | `apps/server/src/builder/assistant/propose.ts:66-94` (a ferramenta não cria; a saída fica com a chamada); `handoff.ts:92-111` (o toque lê a chamada pelo id, só da conversa da pessoa) | `twenty@b76d0217` `workspace-setup-system-prompt.constant.ts:47-51` ("never create, update, or delete anything before approval", só no texto); Palantir, propostas de Ontologia revisadas antes de valer; o padrão "runbooks" do Mastra Knowledge (o agente `contributor`, o líder `editor`) | No Twenty, o portão é do texto; no Conexus, como o `propose_app`, só a rota do toque grava | embrulhado (o padrão do `propose_app`, para uma página da memória da empresa) | `instructions-proposal.test.ts` | `B1` | `apps/server/src/builder/assistant/instructions-proposal.ts` |
| Gravar as instruções da empresa | U5 | o `company-memory.ts` da U9 do Alinhamento (o único que importa `@mastra/core/knowledge`) | `@mastra/core@1.82.0` `dist/knowledge/host-writes.d.ts:8-26` (`upsertPage`) | Grava a página pelo servidor; o igual é pulado | nativo (pela porta da U9) | — | — | — |
| O registro da entrada | U7 | `handoff.ts:97-101` (`memory.recall` da conversa, `perPage: false`); `builder/conversation/turn-line.ts:43-60` (a linha do turno no log) | `langfuse@8ee97c4` `packages/shared/prisma/schema.prisma:754-781` (o item ligado ao rastro de onde veio) | O que se mede fica ligado à conversa real de onde saiu | embrulhado (uma leitura nossa sobre o que o Mastra guarda) | `entry-record.test.ts` | — | `apps/server/src/builder/assistant/entry-record.ts` |
| O inventário dos sistemas | fica de fora | — | Palantir HyperAuto; `airbyte@8aed3123` `docs/platform/using-airbyte/configuring-schema.md:21-23` | Lê tudo o que a fonte declara, sem modelo; a pessoa escolhe | nativo (um workflow do Mastra, na Ontologia) | — | `F1` | — |
| A nossa pessoa como administradora | fica de fora | `docs/reference/boundaries.md:139-141` ("Conexus never becomes one") | Palantir AI FDE e a página das FDE, lidos em 2026-11-12 | A pessoa do fornecedor revisa; o trabalho de mapear vira agente | nativo (o convite de hoje) | — | `D` | — |
| A pergunta a um colega, com prazo | fica de fora | — | `dify-latest@208a2489` `api/core/workflow/nodes/human_input_v2/entities.py:88-108` | Destinatários, prazo de 36 horas, expira | nativo (um workflow com `suspend`, quando vier) | — | `I1` (a `I2` espera) | — |
| A conversa parada numa pergunta depois de reiniciar | fica de fora | o cartão volta pela conversa guardada | `@mastra/core@1.82.0` `dist/docs/references/reference-agents-listSuspendedRuns.md` | Acha as corridas suspensas nos instantâneos | nativo (nada a construir) | — | — | — |

**A medida do transplante.** Nada vem do repositório antigo: ele não tinha entrada guiada nem lista de
perguntas abertas.

**A dívida.**

- O Builder só lê as instruções da empresa pelo briefing; ler a memória da empresa direto é da etapa
  "O Brain do Builder e dos Projetos".
- Os tokens de uma entrada ficam só na linha do turno do log (`turn-line.ts:43-60`), até a etapa 21.1
  dar a Atividade.
- A diferença entre a U9 e a `B1` (a página, "Duas consequências") volta ao fundador antes da U9.

## U1 Ligue seus sistemas

**Base e modelo.** O commit que fecha o Alinhamento, com o pull request que muda o W33 já no `main`.
Sonnet: uma tela que reusa a janela de hoje e um campo a mais num cálculo.

### As linhas da tabela

- **A entrada calculada do estado.** Ler `apps/web/src/hub/identity/preparation.ts:1-23`,
  `welcome/index.tsx:12-35`, `welcome/route.tsx:5-35` (o mapa `BACK` e o quadro) e
  `preparation-card.tsx:43-83`. A referência: o Twenty `onboarding.service.ts:108-177` e a lista do
  Appsmith: nada guardado, tudo contado.
- **Ligar um sistema.** Ler `apps/web/src/hub/connectors/integrations.tsx:94-176` e
  `link-dialog.tsx:272-299`; o passo 2, `welcome/model-account.tsx:12-44`, é o modelo do passo novo.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/routes/_app/companies/$companyId_/welcome/` | Cria `systems.tsx`; muda `route.tsx` (o `BACK` de 4 e 5), `index.tsx` (o redirecionamento), `build.tsx` (o passo 5) | o roteador |
| `apps/web/src/hub/identity/` | Cria `welcome-systems.tsx` e o teste; muda `preparation.ts`, `preparation-card.tsx`, `public.ts` | as rotas da entrada, o Início |
| `apps/web/src/hub/connectors/public.ts` | Muda: exporta `LinkDialog` | `hub/identity/welcome-systems.tsx` |
| `docs/guides/web.md` (W33) | Muda, num pull request de documentos antes, com a palavra `J1` | — |

### Os contratos que a unidade cria

- `preparationOf(input: { companyAccounts: number; members: readonly Member[]; invitations: readonly
  Pick<ListedInvitation, 'state'>[]; connections: readonly Pick<Connection, 'state'>[] }): {
  modelAccount: boolean; team: boolean; systems: boolean }`, com `systems` verdadeiro quando há uma
  conexão `ACTIVE` (`CONNECTION_STATES`, `packages/hub-api/src/connectors.ts:7`). Dono do fato
  "sistemas ligados": `preparation.ts`.
- A rota `welcome/systems.tsx`: `staticData: { place: 'Ligue seus sistemas', step: 4 }`, `loader` com
  `connectionsQuery`; `build.tsx` passa a `step: 5`; `BACK` fica `{ 3: model-account, 4: team, 5:
  systems }`.
- O cartão do Início ganha `<Step done={done.systems} label="Sistemas" />`; com só os sistemas
  faltando, **Continuar** leva a `/companies/$companyId/integrations`.
- Nenhuma rota do Hub muda. O arquivo tomado como modelo é `welcome/model-account.tsx`: cumpre C23
  (`CompanyId` dos parâmetros); C21 e C26 não se aplicam.

### As skills e a leitura

`router-core` (as skills de `@tanstack/router-core`) e as linhas de `docs/reference/stack.md` de
`apps/web/src`; `impeccable` pelas regras de `docs/reference/impeccable.md`, para a tela.

### A ordem do trabalho

1. `preparation.ts`: o campo `systems`. O `index.tsx` e o cartão leem as conexões (`connectionsQuery`)
   junto das contas e da equipe.
2. `welcome-systems.tsx`: a lista dos conectores com **Ligar** (o `LinkDialog` de hoje), as ligadas
   com o estado, e o botão do fim como o do passo 2 (**Continuar** com uma `ACTIVE`, senão **Fazer
   depois**), que leva ao passo 5.
3. `route.tsx`, `index.tsx`, `build.tsx`: o passo novo na ordem. Regras: W17, W24, W33 (como emendado),
   W34.
4. O cartão do Início: o item e o destino de **Continuar**.

### Como se prova

Critérios 1 a 5, com o Hub de teste da tela (`test-hub.tsx`). Falham hoje: o passo não existe.

### Parar se

- O login por OAuth de um conector volta à página das Integrações e não ao passo 4
  (`apps/web/src/hub/connectors/sign-in-return.tsx`): a volta ao passo é contrato novo; pare e
  descreva.
- Uma unidade da fronteira mudou `welcome/` ou `hub/identity/` no meio: espere-a (L1).

## U2 A skill da entrada

**Base e modelo.** O commit que fecha o Alinhamento. Opus: é o texto que conduz a conversa inteira, e
cada frase muda o que o modelo pergunta.

### As linhas da tabela

- **Etapas com "done when".** Ler `packages/app/skills/conexus-plan-new/SKILL.md:1-77` inteiro (a
  forma, as três espécies de decisão e o "Never infer a company fact"); `mastracode/factory/factory-skills/factory-plan/SKILL.md:8-14`;
  `twenty@b76d0217` `workspace-setup-system-prompt.constant.ts:1-72` (a "First reply" de `:23-31`, a
  proposta curta de `:39-45`, o fim de `:65-72`).
- **O como fica no conector.** `packages/connectors/src/sankhya/skill/SKILL.md:56-62`.
- **Os cartões e a lista de tarefas.** `plan-tools.ts:26-71`; `controller-kit/factories.ts:40-43`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/assistant/skills/` | Cria `conexus-intake/SKILL.md` | `assistant.ts` |
| `apps/server/src/builder/assistant/assistant.ts` | Muda: a constante `INTAKE_SKILL` ao lado de `CONEXUS_SKILL` (`:77-82`) e a lista de `skills` (`:277-282`) | — |

### Os contratos que a unidade cria

A skill, em inglês como a `conexus`, com `name: conexus-intake` e uma `description` que diz quando
ler: na conversa da entrada da empresa, ou quando um dono ou um administrador pede para preparar a
empresa ou trazer uma área nova. O corpo, abaixo de 90 linhas, nesta ordem:

1. **Read what the systems say.** Para cada conexão escolhida, ler pela skill dela o que ela guarda, em
   termos do negócio; dizer o que leu num parágrafo curto, para a pessoa corrigir; nunca perguntar o
   que uma leitura responde. Done when: cada conexão está dita, ou a leitura dela falhou e isso foi
   dito.
2. **The company.** O que a empresa faz e para quem. Done when: sabido, ou em aberto pela ferramenta.
3. **Its areas and who decides.** Done when: cada área nomeada tem quem decide, ou está em aberto.
4. **The house words.** Os sinônimos; o que "pedido" e "venda" querem dizer ali. Done when: cada
   palavra que a primeira demanda usa está dita.
5. **The first demand.** O que é e por que vem primeiro. Done when: tem nome, ou a pessoa foi para o
   Início.
6. **Hand off.** As instruções da empresa pelo `propose_company_instructions` (U5), começando do texto
   atual; o que ficou sem resposta pelo `leave_open` (U4), com o que desliga; o briefing (o que a
   pessoa quer e por quê, a empresa, o que as leituras acharam com a forma das consultas e os códigos,
   nunca os valores, e as hipóteses marcadas como tais); depois `propose_app`.

As regras do corpo: cartões de até quatro perguntas, em palavras do negócio, nunca uma tabela, um
campo ou um código; a conversa acaba por suficiência, não por número; uma regra de área não se pergunta
(`H1`), vai no briefing como pergunta para o Builder; um valor que o modelo supôs vai marcado
"hipótese"; `task_write` com as seis etapas no começo e `task_check` antes do `propose_app`; numa área
nova, só as etapas 3 e 4 para ela, e depois a 6.

### As skills e a leitura

`mastra` (`@mastra/core/skills`, a doc instalada `docs-skills.md`).

### A ordem do trabalho

1. O `SKILL.md`, pela forma acima. Regras: delivery L23 (o texto para o modelo fica em inglês; o que a
   pessoa lê, em português).
2. O registro em `assistant.ts`, pelo `skillOf` de hoje (`conversation/instructions.ts:73-89`), que
   recusa uma skill inválida.

### Como se prova

O critério 6, com o dublê: a lista de skills do primeiro pedido traz `conexus-intake`. O critério 7 é
`should`: entra nas perguntas do placar do Alinhamento, com o modelo de verdade, quando o firstmate o
liga. Falha hoje: a skill não existe.

### Parar se

- A skill passa de 90 linhas para caber as etapas: diga qual etapa pede mais e por quê.
- O `skillOf` recusa um campo da `description`.

## U3 A conversa da entrada

**Base e modelo.** O commit da U2. Sonnet: uma coluna, uma rota e um passo de tela, sobre caminhos que
existem.

### As linhas da tabela

- **Uma por pessoa.** Ler `apps/server/src/builder/assistant/tables.ts:15-43`, `chosen.ts:25-100`,
  `routes.ts:116-130` (`created`) e `:248` (a rota); a referência, `twenty@b76d0217`
  `workspace-setup-chat.service.ts:168-173`, `:209-228`.
- **O lugar no bloco.** `instructions.ts:43-62`; o texto fixo, `prompt/assistant.md:36-44`.
- **A primeira mensagem.** `apps/web/src/builder/assistant/home.tsx:51-97`; o passo 5 de hoje,
  `welcome/build.tsx:5-24`, e `builder/conversation/start.tsx:267-299` (`Start`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/migrations/` | Cria `<data>_assistant_entry`: a coluna e o índice único parcial | o `migrate` |
| `apps/server/src/builder/assistant/` | Muda `tables.ts`, `chosen.ts` (`keep` e `of` levam `entry`), `routes.ts` (a criação e a rota nova), `instructions.ts` (`blockOf`), `prompt/assistant.md` (uma frase); cria `entry.ts` e o teste | `builder/conversation/` |
| `packages/hub-api/src/assistant.ts` | Muda `createAssistantConversation` e `AssistantConversation`; cria `readEntryConversation`; a falha `ENTRY_EXISTS` no registro de falhas | `apps/web` |
| `apps/web/src/builder/assistant/` | Cria `entry.tsx` e o teste; muda `queries.ts` | `welcome/build.tsx` |
| `apps/web/src/routes/_app/companies/$companyId_/welcome/build.tsx` | Muda: `<EntryStart>` no lugar de `<Start>`; o `loader` lê também a entrada e as conexões | o roteador |

### Os contratos que a unidade cria

- A coluna, dono `tables.ts`: `entry: boolean('entry').notNull().default(false)`, e
  `uniqueIndex('assistant_conversation_entry_key').on(table.companyId, table.personId).where(sql\`entry\`)`.
  A permissão de hoje (`GRANT SELECT,INSERT ON TABLE builder.assistant_conversation`,
  `apps/server/database-grants.sql:252`) já cobre a coluna nova: nenhuma permissão muda.
- `createAssistantConversation`, o corpo ganha `entry: z.literal(true).optional()`; as falhas ganham
  `ENTRY_EXISTS` (409, `details: { conversationId: ConversationId }`) e `NOT_IN_ROLE`. `entry` com
  `projectId` é `REQUEST_MALFORMED`. Só quem pode `manageCompanyMemory` (a ação da U9 do Alinhamento)
  abre uma conversa da entrada.
- `readEntryConversation`: `GET /api/companies/{companyId}/assistant/entry`, `access: 'session'`,
  200 `{ conversation: { id: ConversationId } | null }`, falhas `NOT_FOUND`, `SESSION_REQUIRED`,
  `DATABASE_UNAVAILABLE`. Só a da própria pessoa.
- `AssistantConversation` ganha `entry: boolean`.
- `Kept` (`chosen.ts`) ganha `entry: boolean`; `blockOf` diz `Place: Início, the company's entry
  conversation.` quando é a entrada. O texto fixo ganha, uma vez para todos: "In the company's entry
  conversation, load the skill conexus-intake before your first answer and follow its stages."
- A tela: `ENTRY_OPENING = 'Quero preparar a empresa no Conexus.'`, dono `entry.tsx`; `EntryStart({
  companyId })` desenha **Começar a conversa**, **Continuar a conversa** ou o `<Start>` de hoje.
- O arquivo tomado como modelo é `chosen.ts` com `routes.ts`: cumpre C23 (`ConversationId`,
  `CompanyId`) e C26 (a criação chaveada tem um dono); C21: a conversa não tem ciclo de vida novo.

### As skills e a leitura

`mastra`; `fastify-best-practices` para a rota; `drizzle` (de `drizzle-kit`) para a migração;
`router-core` para a tela.

### A ordem do trabalho

1. A migração e a coluna. Regras: D6 (só acrescenta), D7. Rodar o `check-migrations` local.
2. A criação: `keep` grava `entry`; a violação do índice único vira `ENTRY_EXISTS` com o id lido;
   a admissão confere a permissão antes de criar (S8). Regras: C37, C48, S10.
3. `readEntryConversation`.
4. `blockOf` e a frase do texto fixo; o bloco continua sem regra de como responder.
5. `EntryStart`: conexões `ACTIVE` (até `CONNECTIONS_MAX`, 50) escolhidas na criação; o
   `useBegin` de hoje como modelo, com a frase fixa no lugar da pergunta; `ENTRY_EXISTS` navega para o
   id dos detalhes. Regras: W24.

### Como se prova

Critérios 8 a 11, com o banco real de teste e o modelo dublê. Falham hoje: a marca não existe.

### Parar se

- O retrato do catálogo do banco (decisão 0038) muda com a coluna ou o índice: a mudança é do
  pull request da permissão (D11); pare.
- A criação de hoje não deixa ler a violação do índice sem engolir o erro: descreva.

## U4 Em aberto

**Base e modelo.** O commit da U3, com o pull request da permissão no banco já no `main`. Opus: uma
tabela nova, duas ferramentas, uma rota, o hand-off e uma tela, com isolamento entre empresas.

### As linhas da tabela

- **As perguntas em aberto.** `conexus-plan-new/SKILL.md:59-65`; o modelo de rota,
  `apps/server/src/hub/identity/nickname.ts` com `packages/hub-api/src/nickname.ts`; a política por
  linha da tabela irmã, `assistant/tables.ts:41`; os testes de isolamento,
  `apps/server/src/platform/isolation*.test.ts`.
- **O hand-off.** `handoff.ts:170-193` (`contentsOf`), `:280-330` (`handOff`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/database-grants.sql` | Muda, num pull request próprio antes da unidade (D11, `K1`) | o `migrate` |
| `apps/server/migrations/` | Cria `<data>_assistant_open_question` | o `migrate` |
| `apps/server/src/builder/assistant/` | Cria `open-questions.ts` (a tabela, as ferramentas, a rota) e os testes; muda `tables.ts`, `assistant.ts` (as ferramentas e `AVAILABLE_TOOLS`), `handoff.ts`, `routes.ts` | `builder/conversation/` (U6) |
| `apps/server/src/platform/` | Cria `isolation-open-questions.test.ts` | — |
| `packages/hub-api/src/` | Cria `open-questions.ts` (`OpenQuestionId`, `OpenQuestion`, `listOpenQuestions`, as entradas das ferramentas); muda `assistant.ts` (`ASSISTANT_TOOL`), `index.ts` | `apps/web`, `apps/server` |
| `apps/web/src/builder/assistant/` | Cria `open-questions.tsx` e os testes; muda `queries.ts`, `public.ts` | o Início |
| `apps/web/src/routes/_app/companies/$companyId/index.tsx` | Muda: a região no lado, com o cartão de preparação | o roteador |

### Os contratos que a unidade cria

- A tabela, dono `open-questions.ts`, no esquema `builder`: `assistant_open_question` com `id uuid`
  (chave), `company_id text`, `person_id text` (quem a deixou), `conversation_kind text` (`'ASSISTANT'
  | 'BUILDER'`, com `CHECK`), `conversation_id uuid`, `project_id text` (nulo no Início), `question
  text` (até 300), `leaves_off text` (até 300), `state text` (`'OPEN' | 'SETTLED'`, `CHECK`), `answer
  text` (até 1.000, nula enquanto aberta), `settled_by text`, `created_at` e `settled_at
  timestamptz`; único (`conversation_id`, `question`); as chaves de empresa, de membro e de Projeto com
  `ON DELETE CASCADE`, como `assistant_conversation` (D17); a política por linha da empresa, a mesma
  da tabela irmã.
- As permissões (o pull request próprio): `GRANT SELECT, INSERT ON TABLE
  builder.assistant_open_question TO hub_company;` e `GRANT UPDATE(state, answer, settled_by,
  settled_at) ON TABLE builder.assistant_open_question TO hub_company;`.
- `OpenQuestionId = z.uuid().brand('OpenQuestionId')`, conferido na leitura da linha (C23).
- O estado como união (C21): `{ state: 'OPEN' } | { state: 'SETTLED'; answer: string; settledBy:
  PersonId; settledAt: string }`.
- As ferramentas, ids em `ASSISTANT_TOOL`: `leave_open` (entrada `{ question: string 1..300;
  leavesOff: string 1..300 }`, saída `{ id: OpenQuestionId }`) e `settle_open` (entrada `{ id:
  OpenQuestionId; answer: string 1..1000 }`, saída `{ settled: true } | { kind: 'NOT_FOUND' }`). A
  conversa, a empresa, a pessoa e o Projeto vêm do escopo do turno, nunca da entrada (S9).
  `openQuestionTools(deps, place: { kind: 'ASSISTANT' } | { kind: 'BUILDER'; projectId: ProjectId })`
  monta as duas para os dois agentes.
- `listOpenQuestions`: `GET /api/companies/{companyId}/open-questions`, `access: 'session'`, admissão
  `manageCompanyMemory`; 200 `{ questions: OpenQuestion[] }` (até `OPEN_QUESTIONS_SHOWN = 100`, as
  abertas, da mais nova), com `OpenQuestion = { id; question; leavesOff; createdAt; by: { personId;
  name }; conversation: { kind: 'ASSISTANT' | 'BUILDER'; id: ConversationId; projectId: ProjectId |
  null }; mine: boolean }`. Falhas `NOT_IN_ROLE`, `NOT_FOUND`, `SESSION_REQUIRED`,
  `DATABASE_UNAVAILABLE`.
- O hand-off: `contentsOf` recebe as perguntas abertas da conversa e acrescenta um bloco de texto
  "Em aberto na conversa com o Assistente:" com uma linha por pergunta, `- <pergunta> (desliga:
  <o que desliga>)`; sem perguntas, nenhum bloco.
- A tela: `OpenQuestions({ companyId })`, a região "Em aberto"; **Responder** leva à conversa da
  pergunta quando `mine`, senão "Na conversa de <nome>".
- O arquivo tomado como modelo é `hub/identity/nickname.ts`: cumpre C23 e C26; o C21 entra pela união
  acima.

### As skills e a leitura

`mastra` (`createTool`); `fastify-best-practices`; `drizzle`; `organization-best-practices` para a
admissão; `router-core` e `impeccable` para a região.

### A ordem do trabalho

1. O pull request da permissão no banco, antes, com a palavra `K1` (D11).
2. A migração e a tabela. Regras: D6, D17.
3. As ferramentas, com o `onConflictDoNothing` na chave única e a leitura do id que existe (como
   `chosen.ts:38-54`); o erro do banco volta ao modelo como resultado da ferramenta, com o código, e o
   log diz o código (nenhum erro engolido).
4. A rota da lista. Regras: S7, S10.
5. O hand-off: a leitura das perguntas antes de criar o Projeto; uma falha não envia nada.
6. A região do Início, no lado, abaixo do cartão de preparação. Regras: W17, W34.

### Como se prova

Critérios 12 a 17, com o banco real de teste, as duas empresas semeadas dos testes de isolamento e o
modelo dublê. Falham hoje: a tabela não existe.

### Parar se

- A política por linha da tabela irmã não deixa o dono ler as linhas de outra pessoa da mesma
  empresa: a lista precisa de outra política; pare e descreva.
- O id da conversa do Builder não é o id da conversa que a tela abre: diga qual campo a tela usa.

## U5 As instruções pelo cartão

**Base e modelo.** O commit da U4. Sonnet: o padrão do `propose_app` e a porta da U9, com o contrato
fixo aqui; a única regra sutil, a permissão relida no toque, está escrita.

### As linhas da tabela

- **O portão no código.** `apps/server/src/builder/assistant/propose.ts:66-94` e `handoff.ts:92-111`;
  na tela, `apps/web/src/builder/assistant/propose.tsx:126-260` (`useHandOff`, os botões).
- **Gravar.** O `company-memory.ts` e as rotas da U9 do Alinhamento (o cartão dele, U9, "Os contratos
  que a unidade cria"): `INSTRUCTIONS_MAX`, a página `instrucoes`, o `upsertPage`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/assistant/` | Cria `instructions-proposal.ts` (a ferramenta e a rota) e o teste; muda `assistant.ts` (a ferramenta para quem pode, e `AVAILABLE_TOOLS`), `routes.ts` | — |
| `packages/hub-api/src/assistant.ts` | Muda: `ASSISTANT_TOOL.proposeInstructions`, `ProposedInstructions`, `saveProposedInstructions` | `apps/web` |
| `apps/web/src/builder/assistant/` | Cria `instructions-proposal.tsx` e os testes | o registro de cartões |
| `apps/web/src/builder/conversation/assistant-specs.ts` | Muda: a linha `propose_company_instructions` com `body: 'instructions'` | a linha da conversa |

### Os contratos que a unidade cria

- A ferramenta `propose_company_instructions`, entrada `{ text: string 1..INSTRUCTIONS_MAX }`, saída
  guardada com a chamada `ProposedInstructions = { text: string }`; ao modelo, só `{ proposed: true,
  next: 'The person sees Salvar nas instruções da empresa. Do not propose again unless the text
  changes.' }`. A descrição diz: escreva o texto inteiro, partindo das instruções de agora; nada muda
  até o toque.
- `saveProposedInstructions`: `POST /api/companies/{companyId}/assistant/conversations/{conversationId}/instructions`,
  `access: 'session'`, corpo `{ toolCallId: ToolCallId }`; lê a chamada da conversa da própria pessoa
  como `proposalOf` (S10), relê a permissão `manageCompanyMemory` agora (S8) e grava pelo
  `company-memory.ts` da U9. 200 `{ saved: true }`. Falhas `NOT_FOUND`, `NOT_IN_ROLE`,
  `REQUEST_MALFORMED`, `DATABASE_UNAVAILABLE`, `HUB_UPDATING`.
- Nenhum import de `@mastra/core/knowledge` fora do `company-memory.ts` (o contrato da U9).
- O arquivo tomado como modelo é `propose.ts` com `handoff.ts`: cumpre C23 (`ToolCallId`,
  `ConversationId`) e C26 (o id da ferramenta em `ASSISTANT_TOOL`); C21: não há ciclo de vida.

### As skills e a leitura

`mastra` (`createTool`, `toModelOutput`); `fastify-best-practices`; `organization-best-practices`.

### A ordem do trabalho

1. A ferramenta, só para quem pode e fora de uma automação, como `mayNote` em `assistant.ts:244-247`.
2. A rota. Regras: S8, S10, C48.
3. O cartão na conversa, como o `AppProposalCard`. Regras: W24 (o toque tenta de novo com a mesma
   chamada), W34.

### Como se prova

Critérios 18 a 21. O 20 atravessa U5 e a U9 do Alinhamento: grava pelo toque e lê no pedido de uma
conversa nova. Falham hoje: a ferramenta não existe.

### Parar se

- A U9 não expõe a gravação das instruções fora da rota dela: a porta é contrato da U9; pare e
  descreva o que falta.
- O `upsertPage` cria versão nova com o mesmo texto.

## U6 Em aberto no Builder

**Base e modelo.** O commit da U5, depois das unidades da fronteira que tocarem `builder.ts` e
`conexus-plan-new`. Sonnet: duas ferramentas que já existem, ligadas em outro agente, e uma frase.

### As linhas da tabela

- `apps/server/src/builder/conversation/builder.ts:136-157` (as ferramentas do Builder) e
  `:173-180` (as do controlador); `packages/app/skills/conexus-plan-new/SKILL.md:59-65`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/conversation/builder.ts` | Muda: `openQuestionTools(deps, { kind: 'BUILDER', projectId })` | — |
| `packages/app/skills/conexus-plan-new/SKILL.md` | Muda: a entrevista manda deixar em aberto pela ferramenta e fechar quando a pessoa responder | o Builder |

### Os contratos que a unidade cria

Nenhum novo: os da U4.

### As skills e a leitura

`mastra`.

### A ordem do trabalho

1. As ferramentas no Builder.
2. A frase da skill, na entrevista, junto de "left open in the plan with what it leaves off".

### Como se prova

Critérios 22 e 23. Falham hoje: o Builder não tem as ferramentas.

### Parar se

- A lista de ferramentas do Builder é fechada por modo (`TOOL_CLOSURE`) e a ferramenta nova pede
  mudar o modo de outra fase: descreva.

## U7 O registro da entrada

**Base e modelo.** O commit da U6. Sonnet: uma leitura do que o Mastra guarda e um item de menu.

### As linhas da tabela

- `handoff.ts:92-111` (a leitura das partes das mensagens); as chamadas de leitura: `connector_read`
  e, depois da U6 do Alinhamento, as leituras tipadas `<conector>_<leitura>`; `ask_user`
  (`plan-tools.ts:37-71`: o resultado guarda `answers`); a linha do turno, `turn-line.ts:43-60`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/assistant/` | Cria `entry-record.ts` e o teste; muda `routes.ts` | — |
| `packages/hub-api/src/assistant.ts` | Cria `readEntryRecord` | `apps/web` |
| `apps/web/src/builder/assistant/` | Muda `conversation-menu.tsx` e o teste | — |

### Os contratos que a unidade cria

- `readEntryRecord`: `GET /api/companies/{companyId}/assistant/conversations/{conversationId}/record`,
  `access: 'session'`, 200 `text/markdown; charset=utf-8` com `Content-Disposition: attachment;
  filename="registro-da-entrada.md"`. Só a conversa da entrada da própria pessoa; qualquer outra,
  `NOT_FOUND` (S10).
- O texto, em português, nesta ordem: as perguntas de cartão, cada uma com a resposta ou "sem
  resposta" e as leituras feitas antes dela (a conexão, a leitura e quantas linhas); as perguntas
  deixadas em aberto e as fechadas; as propostas (`propose_company_instructions`, `propose_app`) e se
  foram tocadas; quantos turnos e quantos cartões. De uma leitura, só o nome e a contagem: nenhum
  valor de linha.

### As skills e a leitura

`mastra` (`memory.recall`); `fastify-best-practices`.

### A ordem do trabalho

1. A montagem do texto a partir das partes das mensagens, em ordem. Regras: S40 (nenhum valor).
2. A rota.
3. O item do menu, só na conversa da entrada (`AssistantConversation.entry`).

### Como se prova

Critérios 24 e 25, com o dublê do Sankhya e um valor plantado nas linhas dele. Falham hoje: a rota não
existe.

### Parar se

- O Mastra guarda os tokens de cada passo na mensagem: o registro pode trazê-los; diga onde estão
  antes de usar.
- Uma leitura tipada guarda as linhas no resultado da chamada sem a contagem: a contagem vem do
  arquivo da leitura; descreva.
