# Etapa 14.2: Correção de tudo

## A página do fundador

**No fim desta etapa** você vê o Builder trabalhar como na Factory do Mastra (ferramentas que abrem,
raciocínio, tarefas fixas, memória), e um turno com tarefa aberta não vira "montou".

**O roteiro.** Padaria Sol, Ana (dona), Gemini 3.8 Flash, **Raciocínio** alto.

1. "Crie um app de encomendas com cliente, data de entrega e valor." "Pensou por 6 s" abre no texto
   do modelo; "Usou a skill **conexus-build**", nas instruções; "Leu `src/router.tsx`", no arquivo;
   uma falha, no motivo.
2. Acima da caixa, "Tarefas · 2 de 5", fixas enquanto o Builder trabalha; abaixo, os anéis da memória. No fim, "Versão 1 guardada, montou", com todas as tarefas feitas.
3. *Em espera (U6, U7):* data, dinheiro e histórico.
4. "Mostre as entregas num calendário"; **Parar** com o plano aberto: nenhuma versão nova. De novo,
   aprovado: em **Código**, numa árvore, o plano novo ao lado do primeiro, intacto.
5. Ana recarrega: tudo abre igual.
6. Em **Configurações › Memória observacional** você escolhe o modelo do Observador; quem não tem conta
   nele segue o da conversa, sem aviso.
7. Com a pergunta aberta, Ana escreve outra coisa: a mensagem espera a resposta ou o **Parar**, e então
   vai. O servidor atualiza ou cai: o cartão some, o turno fica parado e a próxima mensagem funciona.
8. Enquanto o Builder trabalha, Ana escreve "Só eu cadastro." e aperta Enter: a mensagem aparece
   embaixo com "Vai ao Builder no próximo passo" e o Builder a lê no passo seguinte, sem parar a
   ferramenta em curso. Ana aperta Esc: o turno para, como em **Parar**, e a mensagem que o Builder
   não leu volta para o campo.

**O que você faz.** Aprova esta página; firstmate faz a prova ao vivo da U5 (raciocínio
do Gemini pela sua conta Google); no fim, você faz o roteiro e aprova os textos.

**As suas palavras que a etapa cumpre** (2026-10-22): "14.2 e pra vir correcao de tudo"; "A" (o fio do
Mastra, a tela como a Factory) e "o simbolo de memoria observacional"; "2 a"; "tudo recomendado,
Plano A, sem Pasta"; "Aprovado tudo" (Coding e Memória). Mudam duas regras: V39 passa a mostrar o
raciocínio recolhido; a 0050 deixa argumentos e resultados irem à tela, cortados. Sem máscara: você
a tirou em 2026-10-22 (`9fd478b`). Na bancada: "aprovado esse estudo, tá bom? Pode seguir", "a
harness inicial, ela tem que ser totalmente funcional".

**A emenda de 2026-10-24.** Entram as suas decisões depois da aprovação: sem LSP; sem trava de leitura;
nenhum processador nosso novo; a recusa do Mastra nas duas trilhas; a escolha do modelo do Observador e
do Reflector, no formato da Factory, com critério e teste (U11), e sem conta para a pessoa ele segue a
conversa; `run_event` sai nesta etapa, em migração própria depois que nenhum código o lê (D30), e o piso da volta entra na arquitetura; a permissão da tabela nova, em migração própria e em pull request próprio para a branch da etapa, com a sua palavra ("1. Aprovo 2. Aprovado", D11); o plano é a pasta, sem regra de falha.

**A segunda emenda de 2026-10-24.** Entram as suas respostas às seis perguntas das auditorias: "1. A" o
Claude guarda o prompt em cache, como o Mastra Code (U4); "2. A" a linha "Editou um arquivo" abre no antes e
depois, como a Factory (U3); "3. A" a tela da conversa ganha a forma do zero, um redutor só, já nesta etapa
(U3); "4. B" a pergunta ou o plano aberto atravessa a atualização do servidor e, com o seu "A", também a
queda, sem marca de saída limpa (U14); "6. B" recusa do modelo e resposta cortada ganham frase e ação
próprias (U2). Na "5.", o steering, as suas palavras: "Aqui tem que ter é o steering e isso é nativo do
factory e do code que eu ja usei, tem no claude e etc é função que tem que ter. E muito bem estudada".
Enquanto o Builder trabalha, você escreve e ele lê no próximo passo, como no Mastra Code, na Factory e no
Claude ("1. A"); Esc faz o mesmo que **Parar** ("2. A"), que tira o que ele ainda não leu (U12, U13); o
steering entra nesta etapa ("2. Sim"). E "A" (2026-10-23): os anéis da memória leem o `omProgress` do
Mastra. Também entram dois defeitos que a revisão achou: a mensagem com cartão aberto não segura o envio
(U12), e o turno do servidor vira um estado só (U2).

**A terceira emenda de 2026-10-24.** Entra o que a noite construiu, para o cartão dizer o que o código faz.
Pedido por você antes de dormir: "Aí você termina a 14.2, então. Depois, né, eu faço merge." Nada do
escopo foi cortado; as suas palavras de antes seguem as mesmas: as seis chamadas ("1. A 2. A 3. A 4. B
5. [steering] 6. B"), o steering ("1. A 2. A"), a segunda emenda ("2. Sim"), a queda ("A"), a linha de
edição no antes e depois ("2. A"), a tela da conversa do zero ("3. A") e o progresso da memória ("A").
Ficam no cartão: o modelo recusa ou corta e a tela diz qual (U2); a releitura mostra as mesmas partes do
ao vivo (U2); o turno do servidor é um estado só e toda saída da execução do Mastra o termina uma vez
(U2); uma tabela de ferramentas, a linha de edição no antes e depois e o cartão aberto só enquanto
espera a pessoa (U3); o Claude guarda o prompt em cache (U4); o servidor entrega a mensagem no turno que
roda (U12) e a tela deixa a pessoa escrever enquanto o Builder trabalha (U13); a pergunta ou o plano
aberto atravessa a atualização e a queda (U14). O que o código fez diferente do que a segunda emenda
escreveu está em cada unidade, em "Como foi construído", e o que ainda espera a sua palavra está logo
abaixo.

**A quarta emenda de 2026-10-24.** O Builder passa a ser o Mastra, com só o necessário do Conexus. As suas
palavras: "Nosso builder inteiro foi construido e arquiteturado sob uma arquitetura muito ma feita e sem
reaproveita o que a framework de agents ja tem ... implementar o builder dentro do conexus apenas com o
necessario o resto tudo mastra." A regra: "se realmente não tem isso no master, não tem na factory, não tá
utilizado, a gente não vai ter ... Talvez se um dia precisar no futuro ... Não agora." Sobre o desenho
provado: "1. C sendo o mais simples possivel 2. Okay 3. Aceito 4. Esse pode manter e como se fosse uma tool
nossa, claude code tem e ir um por um e ruim, usava no conexus os e dava super certo 5. Aprovado 6.
Aprovado". Quer dizer: a trava do Projeto fica, na forma mais simples (41); o arquivo da máquina é o nativo
do E2B (16, 0051); o stream vai como o Mastra manda, sem corte no servidor (3 a 5); o cartão de 1 a 4
perguntas fica, como ferramenta nossa (12, 27); a mensagem com cartão aberto espera a resposta ou o
**Parar**, como no Mastra (44); o turno que roda quando o servidor cai fica parado (49). Antes, você já
tinha tirado o critério 30: mandar é o `sendMessage` do Mastra, com a janela do primeiro passo aceita. As
rotas do Mastra entram atrás do guarda do Hub (0050), e o Fim passa ao `isTaskComplete` (15). Não agora:
o cartão depois do reinício (a U14 sai, 47), o prazo de uma hora do turno, fechar sessões paradas e a nossa
regra da mensagem pendente no fim do turno. As unidades M1 a M4 fazem isso.

**A quinta emenda de 2026-10-24.** A máquina passa a ser da conversa. As suas palavras: "eu acho que não
faz sentido ser uma por projeto, é uma por conversa. Porque a gente vai estar rodando aquela conversa."
Sobre onde guardar: "não faz sentido criar mais uma tabela para isso, né? ... isso daí tá dentro do escopo
de uma sessão, da thread ... Não faz sentido querer criar uma lógica paralela de novo", e "3aproco". Quer
dizer: sem tabela e sem coluna; a máquina tem o nome da conversa e o E2B a acha por ele, como no exemplo do
Mastra de uma máquina por thread; `builder.machine` sai; como na Factory, sem a varredura de 7 dias, e a
máquina é morta pelo nome quando a conversa, a pessoa, o Projeto ou a empresa saem (M5, 52 a 54). A trava
do Projeto fica: "1. A por agora, pra manter" (41). Os arquivos: "B", o `SandboxFilesystem` do Mastra Code
(`@mastra/code-sdk`), como a Factory o usa, preso à pasta do app; ele substitui o nativo do E2B que o "2.
Okay" escolheu antes de se saber que o nativo resolve um caminho relativo a partir de `/` (16, 0051 Z2). O
R2 montado na máquina: "1 A", não agora. Os arquivos ficam no disco da máquina da conversa, as versões no
nosso Git no Hub e a cópia de cada versão no R2, como hoje, sem montagem. Para a Ana e o Diego: cada
conversa liga a sua máquina; a frase "A máquina anterior sumiu; refiz a partir do que está guardado." sai,
porque sem id guardado nada diz que havia outra máquina antes.

**Em espera.** U6 e U7 esperam a bancada e voltam numa emenda com a sua palavra; os critérios 21 a 26
ficam como proposta.

**Fica de fora.** "Pasta" e "SDK". Issues `next-card`: entram 236, 268, 271, 272; as outras esperam a
fila de defeitos (L4).

**Decisão pedida.** Aprovar esta página e responder o que está em "Pendente da palavra do fundador".

## Pendente da palavra do fundador

Escolhas que firstmate fez à noite e que ainda são suas:

- **U14.** Sai na quarta emenda (o cartão depois do reinício, "Não agora"); o prazo do cartão e o teste
  que mudou de sentido fecham com ela.
- **Critério 37, a escolha lateral e o rótulo "unsaid".** A conta de assinatura recusada quando a
  chamada lateral abre ainda põe o rótulo dela em `unsaid`, e o próximo aviso do turno pode citá-la.
  Recomendação: o critério 37 proíbe; hoje não proíbe.
- **U3, as nove frases de falha novas** (L23), para a sua leitura: estão em "U3 … Como foi construído".
- **U2, os desvios do 6e e do 6f.** Um sétimo estado, `closing` ("fechando"); nenhum teste puro de
  `turn-state.ts` no repositório, porque T5 proíbe; a saída por Parar espera o desmonte só quando o
  Mastra roda uma volta aqui.
- **M4, o peso do `@mastra/code-sdk`** (medido em 2026-10-24, sem chamada paga). O pacote pede o
  `@mastra/core` 1.79.0 exato, e fica uma cópia só do core e do `zod`. Mas traz 506 pacotes ao
  desenvolvimento e, na imagem do Hub (`infra/hub.Dockerfile:50`), leva de 332 a 805 pacotes e de 368 MB
  a 967 MB; 1,3 GB quando roda o script do `onnxruntime-node`, que baixa bibliotecas de GPU. O arquivo do
  `SandboxFilesystem` só importa `path` e `@mastra/core/workspace`. Recomendação: instalar, como a Factory
  importa (`@mastra/code-sdk/agents/sandbox-filesystem`), e aceitar a imagem maior. A outra saída é trazer
  só esse arquivo, 801 linhas com o cabeçalho Apache 2.0, como o cache de prompt foi trazido.
- **M5, as máquinas por Projeto de hoje.** Têm linha em `builder.machine` e ficam pausadas no E2B. Depois
  que a M5 entra em produção, firstmate as mata uma vez pela marca desta instalação (uma chamada paga, com
  a sua palavra), antes da migração que apaga a tabela.
- **M5, as máquinas pausadas crescem.** Uma por conversa usada, até a conversa sair. O limite de máquinas
  pausadas do plano do E2B não foi lido.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | V39, 0050 e 0055 emendadas | `docs/` | design | — |
| U2 | Um registro da conversa (a 14.0) e o fio do Mastra, com tarefas e memória | `builder/conversation/{wire,live,history,turn-log,sessions,parts,cards,check-row,shell,kept,catch-up,turn-state,turn-exits,turn-parts,turn-events,turn-end,wire.check}.ts`, `builder/runs/`, `hub-api/` | segurança | U1 |
| U3 | A transcrição, o painel de tarefas e os anéis, na forma do zero (um redutor) | `apps/web/src/builder/conversation/`, `builder/conversation/permissions.ts`, `hub-api/` (`tools.ts`) | web | U2, U4 |
| U4 | O motor: Coding, Recusa, Fim, Memória, Cache, Trava, Registro | `builder/conversation/{builder,processors,turn-line}.ts`, `builder/machine/machines.ts`, `builder/model-accounts/{queue,turn,processors}.ts`, `builder/model-accounts/claude/` | testes | U1 |
| U5 | Níveis e o raciocínio do Gemini | `builder/model-accounts/`, `apps/web/src/builder/model-accounts/`, `platform/recordings/` | testes | U1 |
| U6 (em espera) | O que o app aprende: Contrato, Datas, Dinheiro, Histórico, Hora, Regras, Falha | `packages/app/{starter,skills,src/skills.test.ts}` | dados | a bancada |
| U7 (em espera) | Arquivos de migração e Fuso | `packages/app-contract/`, `packages/app/src/check/`, `platform/company-postgres.ts` | dados | a bancada |
| U8 | Plano A e "2 a" | `builder/conversation/plan-tools.ts`, `packages/app/skills/conexus-plan-*`, `builder/machine/scripts.ts` | dados | U1 |
| U9 | Árvore na aba Código | `apps/web/src/builder/source/` | web | — |
| U10 | Dublês e percurso | `tests/e2e/`, `platform/test-*` | testes | as em curso |
| U11 | A escolha do Observador e do Reflector | `builder/model-accounts/`, `builder/conversation/`, `hub-api/`, `apps/web/src/builder/observational-memory/`, `migrations/` | dados | U4 |
| U12 | Orientar o Builder enquanto ele trabalha (o servidor) | `builder/conversation/{sessions,live,cards,steer,tell,deliver,wire}.ts`, `hub-api/` | testes | Frente 4 |
| U13 | Orientar o Builder enquanto ele trabalha (a tela) | `apps/web/src/builder/conversation/`, `apps/web/src/platform/attempt-key.ts`, `builder/conversation/record.ts`, `hub-api/` (`questionIdOf`) | web | U12, U3 |
| U14 (sai na quarta emenda) | O cartão aberto atravessa a atualização e a queda | `builder/conversation/{cards,sessions,turn-run,public,routes}.ts`, `builder/runs/{runs,driven,settle,store,context,public}.ts`, `main.ts` | — | U2 |
| M1 | Conta, máquina e trava pela conversa | `builder/model-accounts/{processors,turn}.ts`, `builder/runs/`, `builder/conversation/{builder,sessions}.ts` | segurança | — |
| M2 | As rotas do Mastra atrás do guarda, a tela pelo `@mastra/client-js`, o contrato e as remoções, numa unidade | `builder/conversation/`, `builder/runs/`, `apps/web/src/builder/conversation/`, `hub-api/` | segurança, web | M1 |
| M3 | O Fim pelo `isTaskComplete` | `builder/conversation/{builder,processors}.ts` | testes | M1 |
| M4 | O arquivo do Mastra Code, `SandboxFilesystem`, preso à pasta do app | `builder/machine/`, `apps/server/package.json` | testes | M5 |
| M5 | A máquina da conversa: sem tabela, morta pelo nome ao sair, sem varredura | `builder/machine/`, `builder/runs/`, `builder/conversation/{builder,public}.ts`, `migrations/`, `hub-api/` (`MachinePhase`), `apps/web/src/builder/conversation/{machine-line.tsx,fold.ts}` | dados, segurança | M1 |

`builder/`, `platform/`: `apps/server/src/`; `hub-api/`: `packages/hub-api/src/`. A 14.0 é a primeira parte da U2
("C"; "1. Sim … 2.B"). Em paralelo: U2, U4, U5, U8, U9 (arquivos
distintos). U3 depois de U2 e U4; U11 depois de U4; U10 por último; QA antes das
revisões (L9). Como se constrói: U12 primeiro, sobre a Frente 4 (o fundador a escolheu primeiro, e ela corrige o
defeito do envio com cartão aberto); depois as limpezas da sessão; depois a U14, que tem de manter
`steerCards` achando o cartão frio que ela adota; depois o turno como um estado só (U2); U13 depois da
U12 e da U3. Na quarta emenda: M1 primeiro, pelas rotas de hoje; depois a M2; a M3 e a M4 depois da M1,
em paralelo com a M2 (arquivos distintos). A M2 apaga o que a U2, a U12, a U13 e a U14 fizeram e o Mastra
já faz; a tela da U3 passa a ler o stream do Mastra. Na quinta emenda: a M5 depois da M1, em três partes
que terminam funcionando (a máquina pela conversa; a morte pelo nome e o fim da varredura; a migração que
apaga `builder.machine`, em pull request próprio, D11); a M4 depois da primeira parte da M5, porque então a
máquina existe quando a workspace nasce e o `SandboxFilesystem` a recebe direto, na forma da Factory.

**Orçamento de código alterado** (apagado conta; sem testes nem texto de skill). U2 1.600; U3 950;
U4 150; U5 150; U8 80; U9 150; U10 60; U11 150. Total **3.290**, teto 4.000 (L2); U6 350 e U7 450 voltam com a
emenda.

**Orçamento depois da segunda emenda de 2026-10-24.** U2 1.800 (era 1.600: a recusa e o corte 30, o
estado do turno 170); U3 950; U4 260 (era 150: o cache de prompt 110); U5 150; U8 80; U9 150; U10 60;
U11 150; U12 160 (120 escritas e 40 apagadas); U13 150 (140 na tela e 10 no `hub-api`); U14 260. Total
**4.170**, 170 acima do "deveria" de 4.000 (L2); U6 350 e U7 450 seguem fora da conta. A razão é a sua
palavra "2. Sim": o steering entra nesta etapa, sem corte de escopo. O que passa do teto é o que você
pediu, e a conta fica à vista para a revisão.

**Orçamento medido depois da terceira emenda de 2026-10-24.** Cada parte medida no seu pull request,
contra a sua própria base, em linhas de código alteradas (escritas mais apagadas; sem testes, sem
texto de skill, sem os roteiros de varredura nem os dados de teste da tela):

| Parte | Unidade | Pull request | Medido | Estimado |
| --- | --- | --- | --- | --- |
| Códigos de recusa e corte | U2 | [#292](https://github.com/developmentconexus-ops/conexus/pull/292) | 51 | 30 |
| U6a a U6d: o corte do shell, o aviso de reinício, o registro de sessões, `live.ts` repartido | U2 | [#295](https://github.com/developmentconexus-ops/conexus/pull/295) | 944 (490 escritas, 454 apagadas; cerca de 300 só mudam de arquivo) | — |
| Releitura igual ao vivo | U2 | [#297](https://github.com/developmentconexus-ops/conexus/pull/297) | 44 | — |
| U6e e U6f: o turno como um estado, toda saída o termina | U2 | [#301](https://github.com/developmentconexus-ops/conexus/pull/301) | 777 (477 escritas, 300 apagadas) | 170 |
| Uma tabela de ferramentas, a linha de edição, o painel a 390 px | U3 | [#298](https://github.com/developmentconexus-ops/conexus/pull/298) | 1.307 (734 escritas, 573 apagadas) | — |
| Cache de prompt do Claude | U4 | [#296](https://github.com/developmentconexus-ops/conexus/pull/296) | 130 | 110 |
| Orientar durante a volta, o servidor | U12 | [#293](https://github.com/developmentconexus-ops/conexus/pull/293) | 384 (278 escritas, 106 apagadas) | 160 |
| Orientar durante a volta, a tela | U13 | [#299](https://github.com/developmentconexus-ops/conexus/pull/299) | 316 (257 escritas, 59 apagadas) | 150 |
| O cartão aberto atravessa a atualização e a queda | U14 | [#300](https://github.com/developmentconexus-ops/conexus/pull/300) | 524 (363 escritas, 161 apagadas) | 260 |

Soma medida das nove partes: **4.477**, 477 acima do "deveria" de 4.000 (L2). A soma não conta o que
a U1 a U11 mudaram antes destas emendas, que não foi medido de novo aqui. As razões estão nas suas
palavras: "2. Sim" (o steering entra nesta etapa, sem corte de escopo), as seis chamadas de
2026-10-24 ("1. A 2. A 3. A 4. B 5. [steering] 6. B") e "A" (a queda como a atualização). Não houve corte
de escopo para caber no teto, e a conta fica à vista para a revisão. A medida conta o código que muda de
arquivo duas vezes (apagado num, escrito noutro), o que pesa na U6a a U6d (cerca de 300 linhas) e na
U3 (a tabela nova de 324 linhas substitui `tool-presentation.ts`, de 307).

**Orçamento da quarta emenda.** Cada unidade M é medida no seu pull request. A direção é apagar: o estudo
conta perto de 1,9 mil linhas a menos no servidor, e o interrogatório acha a conta otimista.

## Os critérios de aceite

Pelas rotas e a tela; `Machines` dublê, modelo gravado (T24). Todos must.

| # | U | Critério, observável de fora, com a recusa | Teste |
| --- | --- | --- | --- |
| 1 | U1 | V39, 0050 e 0055 com a regra trocada e a frase do fundador; na quarta emenda, 0050 ("Mastra's routes") e 0051 Z2; na quinta, 0051 (a máquina da conversa, Z2 de novo) e a nota da 0028 | `check-docs` |
| 2 | U2 | `readConversation` devolve as partes como o Mastra as guarda (`text`, `reasoning` com texto, `tool-invocation` com nome, `args`, `result`, `state`, `data-*`); o tipo do Mastra cabe no esquema | `conversation-wire.test.ts`, tipo |
| 3 | M2 | O stream é a rota do Mastra como ele manda (fundador: "3. Aceito"): os eventos do `AgentController`, `display_state_changed` com o `omProgress`, e as partes `data-conexus-*` gravadas; sem lista nossa nem `turn` | `conversation-stream.test.ts` |
| 4 | M2 | Ao vivo e relido (`threads/:threadId/messages`), a mesma parte, para cada ferramenta do conjunto fechado e uma desconhecida; um turno que define tarefas e depois usa uma ferramenta do espaço de trabalho não perde ao recarregar o raciocínio, o primeiro `task_write` nem o texto do começo (as partes por id de mensagem ao vivo são iguais depois do `turnEnd`) | idem, `conversation-tasks.test.ts`, `tests/e2e/builder-native.test.ts` |
| 5 | M2 | Nenhum corte no servidor: o texto vai como o Mastra manda e a tela corta em 800 (8); saem `wire.ts`, `wire.check.ts` e `WIRE_LIMITS` | remoção (CI) |
| 6 | U2 | `Conversation.tasks` é a lista do armazenamento do Mastra; `Conversation.memory`, o `omProgress` da sessão ou `null` | idem |
| 7 | U2 | Saem `ToolDetail`, `KINDS`, `subjectOf`, `detailOf`, `toolOf`, `cardOf`, `fileOf`, `partOf`, `eventOf`, `withHeard`, `exitHeard`, `toldTool` e os testes que os afirmam | remoção (CI) |
| 8 | U3 | Toda linha com argumentos ou resultado abre, pelo corpo da tabela de ferramentas: leitura no começo, `list_files` e `grep` no resultado, `skill` no nome e nas instruções, a edição (`edit_file`) na mudança, o que saiu e o que entrou, e a escrita (`write_file`) no arquivo escrito, no antes e depois como a Factory, cada texto cortado em 800 (fundador, 2026-10-24: "2. A"), desconhecida no nome legível, argumentos e resultado; falha, vermelha, no motivo, ao vivo e relida (a edição e a escrita que falham mostram também a mudança) | `tool-row.test.tsx` |
| 9 | U3 | Raciocínio: "Pensando…", depois "Pensou por N s", fechado, abre no texto; grupo de 3 ou mais, sem `skill`, `ask_user`, `submit_plan`; `task_*` sem linha | `transcript.test.tsx` |
| 10 | U3 | Painel "Tarefas · N de M" acima da caixa enquanto o turno roda; some com tudo feito ou com o turno no fim; nenhum "em andamento" girando depois (#271); relido, do `Conversation.tasks`; a 390 px uma linha, a tarefa em andamento, cortada | `task-panel.test.tsx` |
| 11 | U3 | Anéis da memória do `om_progress` (fundador, 2026-10-23: "A"), o quadro ao abrir, "Guardando a memória…" ou "Reorganizando a memória…" enquanto segura o turno, a marca de falha sem o texto do fornecedor (C48, C51) | `memory-status.test.tsx` |
| 12 | U3 | Cartões de pergunta (de 1 a 4 perguntas, ferramenta nossa), plano e tarefas lidos da `tool-invocation` pelo nome, num decodificador por ferramenta; aberto é estar em `suspended` (as suspensões do Mastra), não um palpite pelo estado; o plano recusado lê "recusado" e o pedido; resposta livre em várias linhas (#272); o cartão da versão: montou, não montou, pela metade; aberto só enquanto a chamada espera a pessoa; parado ou expirado: fechado, e a expiração na linha de falha; a chamada sem resultado depois de um reinício, pergunta que ficou sem resposta | `cards.test.tsx` |
| 13 | U3, U9 | 1280 e 390 px, 200 %, dois temas, teclado (V30, V31), CSP limpo; a árvore com papéis ARIA, o `Sheet` a 390 px, o vazio | T23, `source.test.tsx` |
| 14 | U4 | O Builder sai de `createCodingAgent` com `workspace: undefined`: não tem workspace próprio, a máquina E2B segue emprestada por volta; a lista volta ao modelo depois que a chamada sai da janela | `conversation-tasks.test.ts` (novo) |
| 15 | M3 | Fim pelo `isTaskComplete` do Mastra: o avaliador `conexus-check` reprova o turno que acaba com tarefa aberta e o texto "N tarefas abertas: …" volta ao modelo, no limite de `CHECK_LIMITS`; no limite, "Versão N guardada, pela metade"; parado, nada disso; a tela recebe `task_complete_evaluation`; sai `checkGate` | `conversation-check.test.ts` |
| 16 | M4 | Sem `requireReadBeforeWrite`: duas escritas seguidas no mesmo arquivo passam; as ferramentas de arquivo são o `SandboxFilesystem` de `@mastra/code-sdk` (fundador, 2026-10-24: "B"), preso à pasta do app como a Factory o usa: `src/a.ts`, `/src/a.ts` e `/home/user/app/src/a.ts` são o mesmo arquivo da pasta do app; um caminho fora dela, recusado pela ferramenta ("Path escapes workspace root"); o comando segue livre; saem `MachineFilesystem` e `in-machine.ts`; uma cópia só do `@mastra/core` | `conversation-machine.test.ts`, `npm ls @mastra/core`, prova ao vivo no E2B (firstmate) |
| 17 | U4 | A linha `CONVERSATION_TURN_ENDED` leva `finishReason`, a ferramenta que falhou, o código, o maior `inputTokens` de um passo, `cachedInputTokens` e as rodadas da conferência; nenhum texto livre (S41) | `turn-line.test.ts` |
| 18 | U4 | **Fora**, por palavra do fundador (2026-10-23 13:02): sem LSP; a prova ao vivo falhou e a issue [#282](https://github.com/developmentconexus-ops/conexus/issues/282) a guarda | — |
| 19 | U5 | Gemini é um modelo só, com **Raciocínio**; a escolha chega ao CLIProxy pelo pedido provado no 20, também para o padrão; Claude segue `summarized` | `thinking.test.ts`, `served-recordings.test.ts` |
| 20 | U5 | **Ao vivo**, firstmate: uma chamada pela conta Google do fundador devolve `reasoning_content` e diz se o nível vai no nome ou em `reasoning_effort`; a gravação entra em `platform/recordings/`; falha: 19 e a parte Gemini do 28 param, a etapa volta a ele | registro da U5 |
| 27 | U8 | Cada plano em `.conexus/plans/<nome>.md`; `submit_plan` fora dessa pasta, recusado; o plano aprovado não é sobrescrito (#268); turno que só mudou planos, parado ou não: sem versão, sem conferência; nenhuma outra regra de escrita | `conversation-plan.test.ts` |
| 30 | M2 | Mandar é o `sendMessage` do Mastra; a pergunta não é gravada antes do turno (fundador: a janela do primeiro passo, aceita: o servidor caindo na primeira chamada ao modelo, ou um cartão no passo 0 seguido de reinício, perde a mensagem, e a tela a devolve ao campo, 46); versão, falha e máquina voltam como `data-conexus-*`, gravadas pelo `onBeforeAgentEnd`, sem ir ao modelo | `conversation-recorded.test.ts` |
| 31 | M2 | O stream abre com a semente do estado da sessão do Mastra; a reconexão relê a transcrição pela rota `threads/:threadId/messages`, como a Factory UI | `conversation-stream.test.ts` |
| 32 | U2 | Saem `catch-up.ts`, `kept.ts` e as listas; `run_event` sai em migração própria, depois que nenhum código o lê (D30: sem dados de empresa; fundador: "Porque manter tabela antiga se estamso apenas em estado de desenvolvimento, não quero amnter legacy"); nenhuma imagem anterior roda depois dela, e `architecture.md` "Roll back" ganha esse piso | remoção (CI), `check-migrations` |
| 28 | U10 | Percurso no Chromium nas sequências da exportação do Mastra, só das unidades em curso: cada linha abre; recarregar dá o mesmo | `tests/e2e/builder-native.test.ts` |
| 29 | U10 | QA (T25) com o conjunto fechado e o Gemini; o roteiro pelo fundador (L17) | `conexus-qa`, fundador |
| 33 | U4 | `CyberRefusalHandler` primeiro em `errorProcessors` e em `outputProcessors`; a recusa não gira a conta do turno | `conversation-refusal.test.ts` (novo) |
| 34 | U11 | A rota guarda o Observador e o Reflector da empresa, `null` segue a conversa; `MODEL_UNKNOWN`, `MODEL_NO_ACCOUNT`; quem não gerencia as contas, recusado; a tela mostra e muda | `observational-memory-settings.test.ts`, `settings.test.tsx` |
| 35 | U11 | Observador no Groq: a chamada dele chega ao dublê do Groq, não ao da conversa; o modelo do turno não muda | `conversation-tasks.test.ts` (lê o dublê do Groq) |
| 36 | U11 | Pessoa sem conta no modelo escolhido, ou a leitura falha: o Observador segue a conversa, sem aviso, passando de `blockAfter`; a escolha é lida uma vez por turno | idem |
| 37 | U11 | Conta do Observador falha e o modelo do turno bate no limite: o turno troca de conta como sem o Observador, sem aviso nascido da chamada lateral | idem |
| 38 | U11 | As permissões `SELECT, INSERT, UPDATE (observer, reflector)` vão numa migração só delas, em pull request próprio para a branch da etapa, com a palavra do fundador (D11) | `catalog.test.ts` |
| 39 | U4 | Cada passo do turno no Claude manda `cache_control` 1 h no último sistema e na última mensagem; título e Observador, só no sistema, 5 min; pela chave e pela assinatura; outro provedor, nada | `conversation.test.ts`, `claude-refresh.test.ts`, `prompt-cache.test.ts` |
| 40 | U2 | Recusa do modelo: "O modelo recusou este pedido. Reescreva a mensagem de outro jeito ou peça outra coisa ao Builder."; resposta cortada: "A resposta do modelo ficou grande demais e foi cortada. Peça ao Builder uma parte de cada vez."; falha de chamada segue `MODEL_CALL_FAILED`; nenhum texto do fornecedor | `turn-line.test.ts`, `stream.test.tsx` |
| 41 | M1, M2 | Mensagem durante a resposta: `{ok: true}` da rota do Mastra; entra no próximo passo da mesma execução, sem parar a ferramenta em curso; a conta e a máquina vêm da conversa em toda execução (mensagem, orientar, fila). A trava (fundador: "1. C sendo o mais simples possivel"): outra conversa do mesmo Projeto é recusada no começo da execução com `RUN_BUSY` e o nome de quem trabalha, que chega como `error` no stream e `agent_end`, sem chamada ao modelo e sem guardar a mensagem; a mesma conversa não é recusada | `conversation-steer.test.ts`, `conversation-turns.test.ts` |
| 42 | M2 | A mensagem sai no stream como a da pessoa onde o Mastra a pôs (`message_start`, `role: 'user'`), e a releitura a mostra uma vez depois do fim | `conversation-steer.test.ts` |
| 43 | U12 | **Parar** tira as mensagens que o Builder não leu: nenhuma chega ao modelo, nenhuma volta nova começa | `conversation-steer.test.ts` |
| 44 | M2 | Mensagem com pergunta ou plano aberto (fundador: "5. Aprovado"): a rota responde `{ok: true}` e o Mastra a segura até a resposta ou o **Parar**; no **Parar**, o cartão é cancelado e a mensagem roda logo depois; a tela a mostra como na fila | `conversation-steer.test.ts`, `conversation-waiting.test.ts` |
| 45 | M2 | Enquanto o Builder trabalha a caixa fica aberta: Enter manda, Esc para, **Parar** e **Enviar** lado a lado; a mensagem aparece embaixo com "Vai ao Builder no próximo passo" e entra na volta quando o stream traz o `message_start` dela, casada pela ordem, como a Factory UI | `composer.test.tsx`, `panel.test.tsx`, `live.test.tsx` |
| 46 | M2 | Mensagem que o Builder não leu quando a volta acaba (Parar sem cartão aberto, falha, reinício) volta para o campo com "O Builder parou antes de ler sua mensagem. Ela voltou para o campo."; recarregar mostra a mensagem lida uma vez, no lugar dela | `panel.test.tsx`, `tests/e2e/builder-native.test.ts` |
| 47 | M2 | Não agora (quarta emenda): o cartão não atravessa a atualização nem a queda. Depois do reinício o cartão some e a próxima mensagem funciona, sem erro do fornecedor (o Mastra tira do pedido a chamada sem resposta); saem `restoreCards` e a adoção da U14 | `conversation-update.test.ts` |
| 48 | M2 | O fim é o do Mastra: `onBeforeAgentEnd` chama `runs.finish` pela conversa uma vez por execução, também na recusada, e solta só a trava da sua conversa; saem o turno como estado nosso e o prazo de uma hora | `conversation-run-ends.test.ts` |
| 49 | M2 | Turno que roda quando o servidor cai fica parado (fundador: "6. Aprovado"): depois do reinício a sessão volta sem execução e sem cartão, e a reconexão relê a transcrição; sem retomada automática | `conversation-resume.test.ts` |
| 50 | U3 | Uma tabela de ferramentas, chaveada pelos nomes do conjunto fechado do `hub-api`, iguais aos do Mastra e ao fecho do Builder; nenhum nome de ferramenta testado fora dela; sem apelidos | `permissions.test.ts`, tipos |
| 51 | U3 | O relógio de uma ferramenta conta desde que a tela ouviu a chamada; não volta a zero quando ela entra num grupo | `tool-row.test.tsx`, `live.test.tsx` |
| 52 | M5 | A máquina é da conversa (fundador: "é uma por conversa", "3aproco"): o nome é `conexus-<instalação>-<conversa>`, sem o Projeto; o E2B a acha por esse nome, sem id guardado (nenhuma tabela nem coluna); duas conversas do mesmo Projeto ligam duas máquinas, e a segunda começa do `main` com a versão que a primeira guardou; a execução recusada com `RUN_BUSY` não liga máquina; cada turno começa do `main`; a máquina que some entre turnos volta nova, do `main`, sem frase; a que some no meio do turno segue `MACHINE_LOST` | `runs.test.ts`, `machine.test.ts`, `conversation-turns.test.ts`, prova ao vivo no E2B (firstmate) |
| 53 | M5 | Soltar a conversa, a pessoa, o Projeto ou a empresa mata pelo nome, com a marca da instalação, as máquinas das conversas soltas, também as que nenhum processo segura, antes de apagar a thread; um `kill` que falha não esconde os outros, e nada é apagado: a remoção fica pendente (`PERSON_REMOVAL_PENDING`, `PROJECT_DELETION_PENDING`, `CLIENT_DELETION_PENDING`) e pode ser repetida; uma conversa sem máquina passa; sem varredura: saem `daily.ts`, `Runs.sweep` e `MACHINE_SWEPT` | `runs-removal.test.ts`, remoção (CI) |
| 54 | M5 | Nenhum código lê `builder.machine`; ela sai numa migração própria depois disso (D30), em pull request próprio, com a palavra do fundador (D11), depois que firstmate matou as máquinas por Projeto de hoje | `check-migrations`, `catalog.test.ts`, remoção (CI) |

**Em espera** (a bancada): os critérios 21 a 26 (U6, U7) estão no cartão de `917b5e4` e voltam com a emenda.

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Linha de ferramenta | fechada, frase e assunto; a edição abre no antes e depois | sem argumentos nem resultado: nada a abrir | rodando, a saída cresce, o relógio desde a chamada | vermelha, abre no motivo; edição: o motivo e a mudança | — | — (só o dono) | fora do conjunto: "Não pôde …", abre no motivo |
| Raciocínio | "Pensou por N s" | sem texto: "Pensou" | "Pensando…" | — | — | — | parado: o texto até ali |
| Painel de tarefas | some sem tarefas | idem | "Tarefas · N de M"; a 390 px só a tarefa em andamento | — | — | — | turno no fim: some |
| Anéis da memória | `0/30k` | `memory: null`: esperam o primeiro `om_status` | giram | marca de falha | — | — | — |
| Árvore do Código | pastas do app abertas, `components/ui` fechada | "Este app ainda está vazio" | o da 13 | o da 13 | — | — | — |
| Cartão da versão | "montou" | — | — | "não montou" | — | — | "pela metade" |
| Memória observacional | "Segue o modelo da conversa" | idem | o da 13 | o da 13 | — | só quem gerencia as contas muda | modelo desconhecido ou sem conta: a recusa |
| Cartão depois da atualização ou da queda | o cartão como antes | — | a cópia nova adota | sem cartão no Mastra: o reinício de antes | — | — | vencido em 30 min contados da adoção, nunca depois da hora do turno; Parar ou mensagem: fecha, como antes |
| Mensagem durante a resposta | — | — | "Vai ao Builder no próximo passo" | o envio falha: o balão sai, o texto fica, "Não confirmamos o envio. Envie de novo." | — | — | não lida no fim da volta: volta para o campo, com a frase |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Message.parts: MastraPart[]`, `cuts` | U2 | U3 |
| `Message.suspended` (o plano aberto) | U2 | U3 (cartão do plano) |
| `ConversationEvent` (a lista do 3) | U2 | U3 |
| `Conversation.tasks`, `Conversation.memory` | U2 | U3 |
| `VersionCheck` ganha `{state: 'unfinished', open}` | U4 | U3, 14.1 |
| `WIRE_LIMITS` (`hub-api/src/wire-limits.ts`) | U2 | `wire.ts` |
| campos da linha de fim de turno | U4 | quem lê o registro |
| `PLAN_DIR` | U8 | `plan-tools.ts`, `scripts.ts`, skills |
| `ObservationalMemoryModels` | U11 | a tela, `sessions.ts` (a abertura do turno) |
| `TurnFailureCode` ganha `MODEL_REFUSED`, `MODEL_ANSWER_CUT` | U2 | U3 (a frase pelo catálogo) |
| `TurnState` (`turn-state.ts`: ocioso, rodando, esperando a pessoa, conduzido, fechando, terminando, terminado) | U2 | `sessions.ts`, `turn-run.ts`, `steer.ts`, `answers.ts`, `shell.ts`, o stream |
| Os 30 min do cartão adotado, na memória da cópia que adota (sem coluna) | U14 | `turn-run.ts`, `runs/` |
| `WORKSPACE_TOOL`, `BUILDER_TOOL`, `CLOSED_TOOLS`, `questionIdOf` (`hub-api`) | U3, U13 | `tool-registry.ts`, `permissions.ts`, `record.ts` |
| `message_start` da pessoa (a mensagem que entrou no turno) | U12 | U13 |
| `MachinePhase` sem `waking` e `replaced` | M5 | `machine-line.tsx`, `fold.ts` |

**Os desenhos** (Factory `ToolCard.tsx`, `SessionChatSurface.tsx`; OS `construir.tsx`):

```text
1280 Conversa                                   390 Conversa
🧠 Pensou por 6 s ›                              🧠 Pensou por 6 s ›
📘 Usou a skill conexus-build ›                  📘 Usou a skill conexus-build ›
▸ 3 ferramentas: listou, procurou, leu ›         ▸ 3 ferramentas ›
⚠ Não conseguiu escrever ../x.ts ›               ⚠ Não conseguiu escrever ›
✎ Editou um arquivo src/router.tsx ⌄             ✎ Editou um arquivo src/rou… ⌄
  - const rotas = [inicio]                          - const rotas = [inicio]
  + const rotas = [inicio, encomendas]              + const rotas = [inicio, en…
┌ Tarefas · 2 de 5 ───────────────────┐         ┌ Tarefas · 2 de 5 ─┐
│ ✓ Tabela  ▸ Tela de encomendas  ○ … │         │ ▸ Tela de encom… │
└─────────────────────────────────────┘         └──────────────────┘
[mensagem…]                                      [mensagem…]
◔ 14,9/30k ◔ 2,1/40k 🧠 Guardando a memória…    ◔ 14,9/30k ◔ 2,1/40k
Código: árvore | arquivo                         Código: arquivo; [Arquivos] abre o Sheet
```

Com o Builder trabalhando, a caixa fica aberta (Factory `Composer.tsx:154-165,228-240`; Mastra Code `mastra-tui.ts:616-640`):

```text
1280                                             390
                         Só eu cadastro. ┐       Só eu cadastro. ┐
              Vai ao Builder no próximo passo     Vai ao Builder no…
[Escreva para orientar o Builder]  ■ ↑           [Escreva para orientar…] ■ ↑
Enter orienta o Builder · Esc para               Enter orienta o Builder · Esc para
```

## A tabela de falhas

| Gravação ou comando | Duas vezes | Recusada no meio | Dependência fora | Imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Fim: volta ao modelo | uma por fim de passo | a retentativa da 14 | o banco do Mastra: a volta termina | `APP_CHECK_FAILED` ou `RUN_UNFINISHED` | 15 |
| Coleta da versão sem `.conexus/plans/` na comparação | a da 13 | a da 13 | a máquina | `VERSION_SAVED` ou nada | 27 |
| `submit_plan` em `.conexus/plans/` | a da 14 | a chamada fica aberta | a máquina | — | 27 |
| `setObservationalMemoryModel` | o último vale | uma transação | `DATABASE_UNAVAILABLE` | — | 34 |
| Pedido de raciocínio (U5), ao vivo | um por firstmate | — | CLIProxy fora: a prova falha e o critério cai como dito | o registro | 20 |
| Memória: observador e `threadTitle` | nativo | a volta segue | o modelo do observador: `om_*_failed`, a marca; sem conta ou sem leitura, segue a conversa | — | 11, 14, 36, 37 |
| O que o modelo escreve: planos | a 13 | a 13 | a máquina | — | 27 |
| Leitura e stream (corte, 502, 503: repetem pelo `Last-Event-ID` da 12) | só leitura | — | o banco | — | 2 a 6 |
| Fim do modelo fora do normal | o da 14 | — | o modelo: recusa ou corte | `MODEL_REFUSED` ou `MODEL_ANSWER_CUT` | 40 |
| Reinício com cartão aberto | — | — | o banco do Mastra: o cartão some, a próxima mensagem segue | — | 47 |
| Trava do Projeto no começo da execução | a mesma conversa passa | `RUN_BUSY` antes do modelo, nada guardado | — | `error` no stream | 41 |
| Fim da execução (`onBeforeAgentEnd`) | um por execução | a execução recusada não solta a trava de outra conversa | o banco do Mastra | a linha do turno | 48 |
| Mensagem durante a volta, com ou sem cartão aberto | o Mastra a entrega uma vez | com cartão, espera a resposta ou o **Parar** | o banco do Mastra | — | 41, 44 |

## O que nasce novo e o que é trazido

| Mecanismo | Nativo, nosso ou trazido | Arquivo | Refatorado | Decisões que carrega | Como Mastra, vibesdk e Conexus OS fazem, `file:line` |
| --- | --- | --- | --- | --- | --- |
| Fio do Mastra | nativo | `mastra-parts.ts`, `live.ts` | novo | 0050, "Mastra's routes" | `AgentControllerWireEvent` (`agent-controller/wire.d.ts:30-36`); Factory `services/transcript.ts:202-300`; OS `transcript.ts:1-9`; vibesdk: nenhuma faz |
| Cortes | sai (M2); era nosso; o nativo, `getDisplayTransform` (`stream-content.d.ts:9`), transforma por ferramenta e não limita tamanho | `wire.ts`, `wire-limits.ts` | de `DETAIL_LIMITS` | limites da 14 (`tool-detail.ts:6-12`) | Factory corta na tela, 800 (`ToolCard.tsx:41,54,64`); OS `OUTPUT_LIMIT` 800 |
| Redutor, linha por nome | nativo na forma | `transcript.ts`, `tool-registry.ts` (no lugar de `tool-presentation.ts`) | uma porta viva e relida; uma tabela por ferramenta com o corpo; a edição na mudança | conjunto fechado (`permissions.ts`) | Factory `transcript.ts:423-437,696-726`, `ToolFactory.tsx:78-117`, `ToolCard.tsx:32-67`; playground `tool-presentation.ts:70-119,121-137`, `tool-call-edit.tsx:46-78`; OS `tool-sentences.ts:21-71` |
| Raciocínio recolhido | nativo | `thinking-line.tsx` | o tempo é nosso (12.1) | V39 emendada | Factory `MessageBubble.tsx:180-185`; OS `builder-conversation.tsx:159-172` |
| Painel de tarefas | nativo | `task-panel.tsx` | some no fim do turno, do OS | — | Factory `SessionChatSurface.tsx:67-72`, `TaskPanel.tsx:7-9`; OS `construir.tsx:128,362-368` |
| Anéis da memória | nativo | `memory-status.tsx` | marca de falha, do OS | `observationalMemory` | Factory `runtime.ts:194-207`, `OperationalMemoryStatus.tsx:11-90`; OS `memory-status.tsx:35-77` |
| `createCodingAgent`, `CyberRefusalHandler` | nativo | `builder.ts` | `workspace: undefined`; a recusa também em `errorProcessors` | fila e conferência (0049, 0050, 0055) | `coding-agent/index.ts:90-136` (a recusa na trilha de erro, `:113-129`); Mastra Code `sdk/src/index.ts:1216-1223,1338,1357-1360`; OS `controller.ts:3,223,238` |
| Fim | nativo: `isTaskComplete` com o avaliador de código `conexus-check` (M3); o `goal` julga por modelo, não a lista (`agent/goal/scorer.ts:14-28`) | `builder.ts` | o portão da 14 | `abort(…, {retry})` | vibesdk `completion-signals.ts:14-28`; OS `controller.ts:159-178` |
| Memória (3 opções) | nativo | `builder.ts` | — | — | Mastra Code `agents/memory.ts:355-417`; OS `memory.ts:50` |
| Modelo do Observador e do Reflector | nativo na forma (lido uma vez por turno); a rota e a tela, nossas | `model-accounts/`, `sessions.ts` | de uma leitura por chamada | `null` segue a conversa | Factory `memory-settings-hydration.ts:49-53`; Mastra Code `agents/memory.ts:95-135`, `observer-runner.ts:190-196`; OS: nenhuma |
| Trava fora | nativo | `machines.ts` | sai `requireReadBeforeWrite` (fundador, 2026-10-23) | prompt `builder.md:19` | Mastra Code e OS sem ela |
| Registro | nativo (o controle já tem `finishReason`) | `turn-line.ts` | escalares | S41 | `finish` do controle (`agent-controller-DRiP9C5v.js:1053`) |
| Níveis | nativo | `providers.ts`, `thinking.ts`, `model-picker.tsx` | variantes do CLIProxy viram níveis | 0049 | `AgentControllerThinkingLevel` e `model_changed {thinkingLevel}` (`types.d.ts:613,626-632`); OS `model-picker.tsx:132` |
| Raciocínio do Gemini | nativo | `thinking.ts` | pelo modelo compatível com OpenAI | 0050 (CLIProxy) | `llm-DtX483Xc.js:8463-8474`; `dist-Btgwa9QY.js:3322-3326,3484` |
| Plano A | nativo na forma | `plan-tools.ts` | `.conexus/plans/` | um plano por mudança | Mastra Code `utils/plans.ts:17,33-35,94` |
| Árvore | nativo | `source/` | — | — | shadcn `sidebar-11`; OS `lens-code.tsx:2,14-38` |
| Cache de prompt do Claude | trazido | `model-accounts/claude/prompt-cache.ts` | por escopo na fila, não por provedor do Mastra Code | 0049 (a fila monta o modelo) | Mastra Code `providers/claude-max.ts:80-153,262-276`, `agents/mastracode-gateway.ts:150-162`, `agents/memory.ts:103,394`; OS: nenhuma |
| Cartão entre cópias | sai (M2, "Não agora"); era nativo: `detachFromCurrent`, `listSuspendedRuns`, a retomada fria; a adoção da linha, nossa | `cards.ts`, `sessions.ts`, `turn-run.ts`, `runs/` | de `denyParked` | D25 (lease), C62 | `agent-controller/session.ts:991-999,4516-4517,5552-5595`; teste `agent-controller-ask-user.test.ts:294-313,728-868`; servidor do Mastra `handlers/agent-controller.ts:756-781`; OS: nenhuma |
| Turno como estado | sai (M2); era nosso, nos eventos do Mastra | `turn-state.ts` | de oito campos soltos (`turn`, `asked`, `runs`, `unclaimed`, `carry`, `ending`, `run`, `saveFailure`) | C21, C26 | Factory `live-sessions.ts:43-110`; `agent-controller/session.ts:4282-4338` |
| Edição antes e depois | nativo na forma | `tool-presentation.ts`, `tool-row.tsx` | de "Argumentos:" | V39 emendada | Factory `tool/ToolCard.tsx:144-184` |
| Orientar durante a volta | nativo | `steer.ts`, `tell.ts`, `sessions.ts` | `RUN_BUSY` só entre conversas; o `steer` do Mastra sai (aborta e espera a volta) | D25 (uma linha por turno) | `sendSignal` com `ifActive` `deliver` (`agent-controller/session.ts:4897-4994`, `agent/thread-stream-runtime.ts:5641,5762-5774`); Mastra Code `tui/src/tui/mastra-tui.ts:616-640`; Factory `handlers/agent-controller.ts:672-706`; OS: nenhuma |
| Caixa aberta durante a volta | nativo na forma | `composer.tsx`, `panel.tsx`, `live.ts`, `steers.ts`, `steer-screen.ts` | o balão pendente e a volta ao campo | V30, V31 | Factory `Composer.tsx:154-165,228-240`, `MessageBubble.tsx:51-56`; Mastra Code `mastra-tui.ts:616-640`, `render-messages.ts:279-298`, `setup.ts:42-87`; Claude Code (Esc para, o texto volta ao campo); OS: nenhuma |
| Saída da execução do Mastra | sai (M2); era nativo: espelha as esperas públicas de `waitForAcceptedRunCompletion`; o fim do turno, nosso | `turn-exits.ts` | de só `agent_end` | C75 (nota no arquivo), C21, C26 | `agent-controller/session.ts:4282-4338,2226-2232`, `session-run-engine.ts:602,1741,1787` (Mastra `6a465f9d`); OS: nenhuma |
| Rotas do Mastra | nativo: `@mastra/server` 1.79.0 por `@mastra/fastify` 1.5.23, lista fixa (M2) | `guard.ts` | o escopo encapsulado do OS | 0050, S39 | servidor do Mastra `handlers/agent-controller.js:493,568,650,684,758,795,1274,1337`; `@mastra/fastify` `index.js:391-470,664-685`; OS `mastra-session-routes.ts:266-367` |
| Guarda da conversa | nosso: as rotas de agent-controller não usam o `resourceId` mapeado | `guard.ts` | — | 0050, S10 | Factory `routes/session-access.ts`; OS `mastra-session-routes.ts:279,311-323` |
| Conta, máquina e trava pela conversa | nosso na forma da Factory; a trava, nossa (fundador: "1. C") | `model-accounts/processors.ts`, `runs/` | o `Turn` nasce na execução, não no pedido (M1) | 0049, 0051 | Factory `session/credential-policy.ts:37-39`, `sandbox/session-sandbox.ts:29-36`; Mastra Code `agents/memory.ts:101-140` |
| Fim da execução | nativo: `onBeforeAgentEnd` | `end.ts` | de `turn-end.ts` | 0051 (a versão) | core `agent-controller-DO6rGsQm.js:4836-4859` |
| Arquivo da máquina | nativo: `SandboxFilesystem` de `@mastra/code-sdk` 1.15.0, sobre a `E2BSandbox` (M4) | `machine/` | sai `MachineFilesystem` | 0051 Z2 | `@mastra/code-sdk` `dist/agents/sandbox-filesystem.d.ts:38-61`, `.js:154-161`; Factory `factory/src/workspace.ts:4,1482-1509` (Mastra `ceb2e7b0`); OS `sandbox.ts:3,205-215` |
| Máquina da conversa | nativo: o nome lógico do `E2BSandbox` (`mastra-sandbox-id`), achado ou criado no `start()`; a morte pela marca e pela conversa, nossa (S36) | `machine/`, `runs/removal.ts` | sai `builder.machine` e a varredura | 0051 | `@mastra/e2b` 0.15 `dist/index.js:1757-1791,1836-1848`; core `workspace-BR4DJXoq.js:4055-4063`; Factory `sandbox/session-sandbox.ts:29-36`, `integrations/github/sandbox-release.ts:46-65`, `sandbox/session-retirement.ts:69-77`; docs `mastra.ai/docs/sandbox/overview.md` ("Sandboxes per user or thread") |
| Releitura igual ao vivo | nativo | `history.ts`, `processors.ts` (`workspaceMetadataLive`) | de `turnsOf`, que colava os passos | C21 | `llm-execution-step.ts:2916-2925`, `message-list.ts:865`; issue do Mastra #21940 (o pedaço `data-workspace-metadata` não é salvo) |

Citações em `.ts` do Mastra: a fonte em `6a465f9d`. Cada "nosso" entra em `boundaries.md`; do
steering, a parte nossa é o conjunto pendente e a passagem do turno por uma volta que sobrou (o Mastra
dá a volta, não o turno que a cobre): `steer.ts`, uma linha em `boundaries.md`, pela razão de uma linha
`builder.run` e um lease por turno (D25). Copiado: o cache de prompt (Apache 2.0, cabeçalho no arquivo).
Dívida: nenhuma.

## U1 Regras

**Raio.** `docs/guides/design.md`, `docs/decisions/{0050,0055}-*.md`: muda, regras trocadas. V39:
"not exposed reasoning" vira "reasoning shown collapsed, in the model's words; each tool row opens
on what it received and returned". 0050: "which our parts keep server-side" vira "the Hub sends
Mastra's own messages and events, cut". 0055: `server/migrations/`, `.conexus/plans/`. **Prova.** 1.

## U2 O fio do Mastra

**Raio.** `kept.ts`, `catch-up.ts`: apaga; `run_event` (`builder/runs/`): o código sai e, em migração própria depois dele, a tabela (D30; piso da volta em `architecture.md`, "Roll back"); `sessions.ts`: muda. `hub-api/{conversations,questions,index}.ts`: muda; `mastra-parts.ts`, `wire-limits.ts`: cria;
`tool-detail.ts`: apaga. `builder/conversation/wire.ts`: cria; `parts.ts`, `check-row.ts`: apaga; `cards.ts`,
`shell.ts`: perdem a tradução; `live.ts`, `history.ts`, `turn-log.ts`: muda. Chama: web, OpenAPI,
`sessions.ts`, `routes.ts`.

**Contratos.**
- **Um registro (14.0)**: a pergunta vai por `memory.saveMessages` antes do sinal; versão, falha, máquina e reinício, uma mensagem `data-conexus-*` após o fim; o stream abre com a foto do turno vivo.
- `MastraPart`: união por `type` com os nomes do Mastra (C21): `text`, `reasoning {reasoning, details}`,
  `tool-invocation {toolInvocation: {state, toolCallId, toolName, args, result?}}`, `data-${string}`;
  `args`, `result`, `data` são `unknown`; cada variante ganha só `cuts?: string[]`. O servidor prova em
  tipo que `MastraMessagePart` cabe em `z.input<typeof MastraPart>` (C27).
- `Message = {id, role, parts, suspended, model, createdAt}`; `suspended` vem de
  `metadata.suspendedTools` (hoje `withPlan`, `parts.ts:301-307`).
- `Conversation` ganha `tasks: TaskItemSnapshot[]` (o armazenamento que `task_check` lê,
  `task-tools.ts:612-626`) e `memory: OMProgressState | null` (`session.d.ts:1303`), cada um com esquema
  Zod (C27). Os nomes `data-conexus-*` são da 14.0.
- `ConversationEvent`: `turn`, `turnEnd` e os eventos do critério 3, tipados por
  `AgentControllerWireEvent`; sem os textos livres `observations` e `error` dos `om_*`. As nossas partes
  vão como `data-conexus-*`.
- `cutPart`, `cutEvent` em `wire.ts`, único corte. `WIRE_LIMITS = {text: 2000, outputLines: 20,
  outputBytes: 4096}` (a base da 14, `tool-detail.ts:6-12`).
- Ids: o redutor da U3 lê `ToolCallId` e `MessageId` na entrada (C23).
- **Recusa e corte**: o `finishReason` que o Mastra manda no `error` decide o código: `content-filter`
  ou `tripwire`, `MODEL_REFUSED`; `length`, `MODEL_ANSWER_CUT`; o resto, `MODEL_CALL_FAILED`. Frase e
  ação nossas; o texto do fornecedor nunca vai à tela nem ao registro (S41). Fundador, 2026-10-24: "6. B".
- Modelo: o turno é um estado só (`turn-state.ts`: ocioso, rodando, esperando a pessoa, conduzido,
  fechando, terminando, terminado), movido pelos eventos do Mastra; a falha é decidida uma vez; toda
  saída da execução do Mastra, não só `agent_end`, termina o turno (`turn-exits.ts`) (C21, C26);
  `turn-log.ts` guarda o registro; `parts.ts` não (o `KINDS` fecha o que o Mastra deixa aberto).
- **Releitura**: `historyOf` devolve as mensagens do Mastra como salvas, uma por passo, com os ids das
  mensagens ao vivo (`turnsOf`, que as colava, sai), para o tempo de raciocínio achar o seu
  `${message.id}.${index}` depois de recarregar; o pedaço `data-workspace-metadata` do Mastra vai ao
  stream e não é salvo (`workspaceMetadataLive`, `processors.ts`).

**Leitura.** skill `mastra`; `agent-controller/{types,wire,session}.d.ts`. **Ordem.** Apagar `parts.ts`, `ToolDetail` e os testes de "não abre" (`conversation-parts.test.ts:65,92`,
`tool-row.test.tsx:94`); depois o contrato, `wire.ts`, `live.ts`, `history.ts`, OpenAPI.
Regras: C21, C23, C26, C27, C75, D25, T5, T24. **Prova.** 2 a 7, 30 a 32, 40, 48, 49.

**Como foi construído.** `FINISHES` (o `finishReason` que decide o código) mora em `turn-line.ts`,
exportado ao lado de `TurnTally.finishReason`, e não em `live.ts`, que está no teto de 300 linhas do Biome;
`failureOf` lê dele. A U6a a U6d: o corte da saída do comando está em `wire.ts` (`cutTail`) e `shell.ts` só
guarda o ritmo, o que torna verdade o critério 5; o aviso de reinício passa por `say()` e fica guardado
para a reconexão (critério 49); o registro de sessões usa o `createSession` do Mastra, que acha ou cria;
`live.ts` se reparte em `live`, `turn-parts` (`newTurn`, `openTurn`, `tellRestarted`, `tellMachine`,
`tellFailure`, `tellVersion`), `turn-events` e `turn-end`; `tell.ts` (U12) guarda `tell`, `tellExtra`,
`settleThinking` e `startThinking`; `Ending` fica em `live.ts` porque o tipo `Live` o nomeia, e em
`turn-end.ts` `live.ts` e `turn-end.ts` se importariam. `wire.check.ts` confere os eventos contra o tipo do
Mastra. A U6e e a U6f: o estado tem sete tipos, com `fechando` (`closing`) entre rodando e terminando, para a
mensagem esperar o fim do turno desde que a volta começa a acabar, antes de `beforeAgentEnd` salvar, e
`steered` entra como transição; `deciding(s, outcome)` decide a falha uma vez, na ordem: escrita recusada ou
expiração, o resultado do salvamento, como o modelo acabou (`FINISHES`, `MODEL_NO_ACCOUNT`,
`MODEL_CALL_FAILED`). `turn-exits.ts` espera `run.waitForAbortRequest`, `stream.waitForTeardown` e
`stream.waitForConsumerFailure`; a saída por Parar espera `run.waitForTeardown` só quando o Mastra roda
uma volta aqui (`session.run.getRunId() !== null`), porque sem laço nada chama `run.reset()` e o fecho do
Hub esperaria para sempre; o desmonte durante `parked` ou `steering` não termina o turno, porque o Mastra
liga o stream de novo para a retomada; `detach` para a vigia, para o turno estacionado ir à próxima cópia.
Uma mensagem que o Mastra aceita sem volta (`persist` ou `discard`) termina o turno com `error` e
`INTERNAL_UNEXPECTED`. Diferença conhecida entre o vivo e a releitura, não corrigida: o passo só de texto
que acaba com tarefa aberta é abortado com retentativa por `checkGate` e o Mastra o tira do seu
armazenamento (`llm-execution-step.ts:2916-2925`, `message-list.ts:865`), então o vivo mostra esse texto e
a releitura não; o percurso `builder-native` nomeia o passo. Não provado: o início da mensagem orientada
falhar dentro de `steerCards` (nenhum teste alcança um Parar dentro da aceitação); uma volta rodando cujo
laço pendura sem falhar, seguida de Parar, ainda espera `run.reset()`.

## U3 A transcrição, o painel e os anéis

**Raio.** `apps/web/src/builder/conversation/`: `transcript.ts`, `tool-presentation.ts`,
`task-panel.tsx`, `memory-status.tsx`: cria; `tool-row.tsx`, `tool-group.tsx`, `transcript.tsx`, `machine-line.tsx`, `builder-turn.tsx`, `fold.ts`,
`thinking-line.tsx`, `use-live.ts`, `live.ts`, `question-card.tsx`, `plan-card.tsx`, `composer.tsx`:
muda; `tool-text.ts`, `task-list.tsx`: apaga. Chama: `panel.tsx`, `workbench.tsx`.

**Contratos.** `reduce(transcript, event)` e `fromMessages(messages)`, um redutor, como a Factory;
item por `kind` (C21): `text`, `reasoning`, `tool`, `card`, `conexus`. `presentTool(toolName)`: dono
das frases (C26), uma por ferramenta do conjunto fechado e a volta (nome legível, argumentos,
resultado). `TaskPanel` lê `task_updated` e `Conversation.tasks`. `MemoryStatus`: fase `idle |
buffering | observing | reflecting` pela regra da Factory (`runtime.ts:194-207`), anéis de `om_status`,
marca de falha do OS. Frases em português (L23). **Forma do zero** (fundador, 2026-10-24: "3. A"): um
estado `{messages por id, tools, prompts, tasks, memory}`, como o `TranscriptState` da Factory
(`services/transcript.ts:105-117,202-320`); as linhas saem de uma tabela por ferramenta; cada cartão tem
um decodificador; aberto é estar em `prompts`. A edição abre no antes e depois ("2. A").

**Leitura.** `stack.md` (`react-markdown`, `remend`), `components.md`. Regras: C21, C23, C26, V19, V29 a V31, V39, V54, W22, W31. **Prova.** 8 a 13, 50, 51.

**Como foi construído.** Uma tabela de ferramentas (`tool-registry.ts`), chaveada pelos nomes do conjunto
fechado do `hub-api` (`WORKSPACE_TOOL`, `BUILDER_TOOL`, `CLOSED_TOOLS`, provados iguais às constantes do
Mastra e ao fecho do Builder em `permissions.ts`), no lugar de `tool-presentation.ts`, dos oito apelidos
mortos e da floresta de ramos por nome; `CHECK_TOOL` passou a `BUILDER_TOOL.check`. A linha de edição abre
na mudança (o que saiu, depois o que entrou) e a de escrita no arquivo escrito, cada lado cortado em 800
caracteres; a falha abre primeiro no motivo (`errorText`, senão o resultado). O cartão só abre enquanto a
chamada espera a pessoa: `output-denied` agora lê fechado (antes lia aberto) e o estado `expired` saiu,
porque a linha de falha já o diz. O relógio da ferramenta conta desde que a tela ouviu a chamada
(`Turn.heard`), não desde que a linha monta; o relógio depois de recarregar no meio de um comando fica fora.
O painel de tarefas mostra só a tarefa em andamento a 390 px. A varredura de QA ganhou quatro estados.
Frases de falha novas, em português (L23), para a sua leitura: `fileStat` "Não conseguiu consultar";
`mkdir` "Não conseguiu criar a pasta"; `getProcessOutput` "Não conseguiu ler a saída"; `killProcess` "Não
conseguiu parar o processo"; `recall` "Não conseguiu reler as conversas"; `check` "Não conseguiu conferir o
app"; `skill` "Não conseguiu usar a skill", "Não conseguiu ler a skill" e "Não conseguiu procurar a skill".
Os grupos de campos usam `fieldset` ("Mudança no arquivo", "Arquivo escrito"), porque o Biome proíbe
`role=group` e `aria-label` em `div` e `pre`.

## U4 O motor

**Raio.** `builder/conversation/{builder,processors,turn-line}.ts`, `builder/machine/machines.ts`: muda.

**Contratos.**
- **Coding**: `createCodingAgent({…os campos de hoje…, workspace: undefined, outputProcessors: [new
  CyberRefusalHandler(), checkGate], errorProcessors: [new CyberRefusalHandler(), …a fila]})`: passar
  `errorProcessors` troca a lista do Mastra, onde a recusa vinha primeiro (`coding-agent/index.ts:113-129`); sem `signals` à mão (com `memory` no agente, o
  `TaskSignalProvider` já vem, `coding-agent/index.ts:101-102`).
- **Memória**: `activateAfterIdle: {default: 'auto', anthropic: '1h'}`, `previousObserverTokens: 1000`,
  `threadTitle: true` com instrução em português, como Mastra Code e OS; o modelo do Observador e do Reflector vem da U11.
- **Fim**: `checkGate` lê as tarefas abertas do mesmo armazenamento; abertas: `abort("N tarefas
  abertas: …", {retry: true})`, contado em `CHECK_LIMITS.checks`; no limite, a versão leva `check:
  {state: 'unfinished', open}`. Pega o passo final vazio do Gemini.
- **Trava**: sai `requireReadBeforeWrite` (`machines.ts:200-201`).
- **Cache**: todo modelo do Claude, por chave ou assinatura, sai da fila com as marcas de cache do
  Mastra Code: o turno marca o último sistema e a última mensagem por 1 h; título, Observador e
  Reflector, só o sistema, por 5 min. `anthropic: '1h'` do `activateAfterIdle` fica, porque agora o
  cache existe. Fundador, 2026-10-24: "1. A".
- **Registro**: os campos do 17, escalares; `finishReason` do `finish` do controle.
- Modelo: `processors.ts` da 14 (C21, C26).

**Leitura.** skill `mastra`, referências `create-coding-agent`, `task-signal-provider`. Regras: C50, C57, C75, S41, T14. **Prova.** 14 a 17, 33, 39.

**Como foi construído.** `promptCacheMiddleware` (`claude/prompt-cache.ts`, copiado do Mastra Code, Apache
2.0, cabeçalho no arquivo) marca o modelo do Claude por escopo na fila (`queue.ts`), pela chave
(`claude/api-key-model.ts`) e pela assinatura (`subscription-model.ts`); sai também de `model-accounts/
public.ts`, porque T5 faz o teste do servidor entrar por uma porta pública. O corpo do pedido do dublê da
Anthropic foi para `platform/test-anthropic-body.ts` (o arquivo passava do teto de 300 linhas) e `Sent`
continua exportado de `test-anthropic.ts`. `scripts/record-provider.ts` passa o escopo `'conversation'` a
`subscriptionModel`. O `errorCode` do exemplo do critério 17 passa a `MODEL_ANSWER_CUT`
(`turn-line.test.ts`).

## U5 Níveis e o raciocínio do Gemini

**Raio.** `builder/model-accounts/{providers,thinking,served}.ts`,
`apps/web/src/builder/model-accounts/model-picker.tsx`, `platform/{recordings/,test-cliproxy.ts}`: muda.

**O fato.** O Gemini passa pelo CLIProxy no modelo compatível com OpenAI do Mastra
(`llm-DtX483Xc.js:8463-8474`): manda `reasoning_effort` (`dist-Btgwa9QY.js:3326`), lê
`reasoning_content` (`:3484`). O nome do CLIProxy carrega o nível (`gemini-3.8-flash-high`), fora do
registro: `providerOptionsOf` não manda nada (`thinking.ts:150-152`) e o seletor esconde o
**Raciocínio** (`thinking.ts:125-130`, `model-picker.tsx:62-64`). **Ordem.** O 20 primeiro; depois as
variantes viram um modelo com os níveis que o CLIProxy serve. Regras: T14, T24, S40. **Prova.** 19, 20.

## U6 e U7 (em espera)

O raio, os contratos e as partes trazidas estão no cartão de `917b5e4` e voltam com a emenda da bancada.

## U8 Plano A e "2 a"

**Raio.** `builder/conversation/plan-tools.ts`, `packages/app/skills/conexus-plan-{new,change}/`,
`builder/machine/scripts.ts`: muda.

**Contratos.** `PLAN_DIR = '.conexus/plans'` (C26) no lugar de `PLAN_PATH`; `submit_plan` aceita um
`.md` direto nessa pasta, como Mastra Code (`utils/plans.ts:57`); reescrever o arquivo de um plano
aprovado é recusado ao modelo. Só essas regras: o plano é uma pasta, escrita e lida; a escrita que falha não leva regra (fundador). `treeOf` (`scripts.ts:43-53`) segue escrevendo a árvore inteira; só o
teste de "sem mudança" (`:52`) e a contagem (`:73`) deixam `PLAN_DIR` de fora (pathspec). **Prova.** 27.

## U9 Árvore

**Raio.** `apps/web/src/builder/source/{source,file-tree}.tsx`: muda, cria. **Contrato.** Árvore sobre o
`Collapsible` (shadcn `sidebar-11`); pastas do app primeiro, `components/ui` fechada; os estados de
#236. Regras: V30, V31, W22. **Prova.** 13.

## U10 Dublês e percurso

**Raio.** `tests/e2e/builder-native.test.ts`: cria; `platform/test-{anthropic,cliproxy}.ts`: muda.
As sequências vêm da exportação do Mastra que firstmate guardou (execuções 1, 2, 3, a do fundador),
com conteúdo inventado (S40, T24): a lista que sai da janela, o passo final vazio, `skill`,
`list_files`, `grep`, a escrita recusada. **Prova.** 28, 29.

## U11 A escolha do Observador e do Reflector

**Raio.** `builder/model-accounts/`: ganha `observational-memory-settings.ts` (hoje em `conversation/`),
muda `processors.ts`, `turn.ts`; `conversation/{sessions,builder,tables}.ts`, `hub-api/observational-memory.ts`,
`apps/web/src/builder/observational-memory/`: muda; o `GRANT` sai da migração da tabela para
`…_observational_memory_models_grants` (D5, D11), em pull request próprio para a branch da etapa, com a palavra do fundador em `approvals.md`.

**Contratos.** `observational_memory_models(companyId, observer, reflector)`, `null` segue a conversa;
`GET` e `PUT …/observational-memory-models` (`session`). **Forma da Factory:**
`sessions.ts` lê as duas escolhas na transação que abre o turno e as guarda no `Turn`, como a Factory
as põe no contexto do pedido (`memory-settings-hydration.ts:49-53`) e o Mastra Code resolve o modelo do
papel (`agents/memory.ts:95-135`). `accountModel` pede à fila esse modelo; sem conta para a pessoa, ou sem
a leitura, devolve o da conversa, sem aviso; nenhuma leitura de banco por chamada. Saem os `WeakMap`
laterais, o `allowFallback` e o `Turn` lateral: a falha da chamada é do `failurePolicy: 'continue'`.
Regras: C26, C75, D5, D11. **Prova.** 34 a 38.

## U12 Orientar o Builder enquanto ele trabalha (o servidor)

**Raio.** `steer.ts`: cria; `live.ts`: `steering` vira `carry` e ganha `pending`, `ending`, `cancel`;
`cards.ts`: perde `steerCards` (vai para `steer.ts`) e a chamada a `session.steer`; `deliver.ts`:
ganha `ifIdle`; `wire.ts`: `message_start` da pessoa; `sessions.ts`: muda; `hub-api/`: só os comentários
do contrato.

**Contratos.** Um **turno** é a mensagem admitida da pessoa e toda volta do Mastra que a leva ao fim; uma
**orientação** é a mensagem que entra no turno que roda agora: não tem linha `builder.run`, lease nem
`turnEnd` próprios. Ela está **enviada** (o POST no ar), **pendente** (o Mastra a aceitou com `deliver` e
ainda não a leu) ou **lida** (o `message_start` dela saiu); o servidor guarda só as pendentes. O POST
responde 202 assim que o Mastra aceita, no lugar de `RUN_BUSY`, que fica só entre conversas do mesmo
Projeto. **Parar** tira as pendentes (`cancelQueuedMessages`) antes de abortar. Com cartão aberto, a mensagem
fecha o cartão e acorda a volta seguinte do mesmo turno, e responde quando o Mastra aceita (auditoria
da sessão). Uma linha, um lease, um `turnEnd` por turno (D25). Fundador, 2026-10-24, decisão 5: "Aqui tem que ter é
o steering e isso é nativo do factory e do code que eu ja usei, tem no claude e etc é função que tem que
ter. E muito bem estudada".

**Leitura.** skill `mastra`; `agent-controller/session.ts:4897-4994`. Regras: C21, C26, D25, S41, T24.
**Prova.** 41 a 44.

**Como foi construído.** `steer.ts` guarda o conjunto pendente e a passagem do turno por uma volta que
sobrou; o Mastra dá a volta, não o turno que a cobre, e daí a razão de uma linha `builder.run` e um lease
por turno (D25), que entra em `boundaries.md` em uma linha. `tell.ts` guarda `tell`, `tellExtra`,
`settleThinking` e `startThinking`. Com pergunta ou plano aberto, o POST responde 202 quando o Mastra aceita
a volta seguinte; a pergunta aberta é abortada e o Mastra espera o fim da abortada, até 5 s (auditoria da sessão).

## U13 Orientar o Builder enquanto ele trabalha (a tela)

**Raio.** `apps/web/src/builder/conversation/{live,composer,panel,text}.ts(x)`: muda;
`apps/web/src/platform/attempt-key.ts`: `useAttemptKeys` por escopo; `hub-api/` (`questionIdOf`): muda.

**Contratos.** A caixa não bloqueia o envio enquanto o turno roda; **Enviar** e **Parar** lado a lado;
Esc faz o mesmo que **Parar** (fundador, 2026-10-24: "1. A 2. A"). A orientação aparece como balão
pendente com "Vai ao Builder no próximo passo" até o stream trazer o `message_start` da pessoa; a que
não foi lida quando a volta acaba volta para o campo, com a frase do critério 46. Frases em português
(L23). Regras: V30, V31, V54, W22. **Prova.** 45, 46.

**Como foi construído.** As orientações pendentes moram no turno (`Turn.steers`), com `returned` no estado
terminado; a tela mostra a mensagem salva da pessoa uma vez, no turno, enquanto a resposta está na tela
(`withoutTold`); `Transcript` recebe `steers` como propriedade opcional. Esc e o segundo botão da volta
seguem só `answering`, não `resuming`. `useAttemptKeys` dá uma chave por conteúdo, e a `questionId` do
servidor chama `questionIdOf` do `hub-api`. A peça `steer-events.json` é o `message_start` real da pessoa,
impresso do teste `conversation-steer` da U12. Não visto: o balão a 390 px num navegador; o cabeçalho
"Conexus" vazio para uma mensagem do Builder só de partes escondidas (visto no percurso depois de uma
orientação) é do comportamento de antes.

## U14 O cartão aberto atravessa a atualização e a queda

**Quarta emenda.** Sai: o cartão depois do reinício é "Não agora", e a M2 apaga o que esta unidade fez.

**Raio.** `cards.ts`: sai `denyParked`, entram `detach` e `adoptCards`; `sessions.ts`: `adopt`, e o
`drain` solta o turno estacionado; `turn-run.ts`: o turno de uma mensagem e o turno adotado, com o mesmo
fim; `runs/`: `drive`, `onAdopt`, `settleConversation`, `attach` com `lost`, e `finish` acorda a máquina
de uma volta vinda de outra cópia antes de guardar. Sem coluna e sem migração (opção C, em "Pendente da
palavra do fundador").

**Contratos.** No desligamento, o turno com cartão aberto sai por `thread.detachFromCurrent()` do
Mastra, sem negar; a linha fica `waiting` com o lease cedido. A cópia que toma a linha (no boot, no fim do
lease ou ao admitir) adota a volta: registra de novo o cartão que o Mastra guardou (`listSuspendedRuns`),
arma a hora do turno (`deadline_at`) e um prazo novo de 30 min para o cartão, e segue como se fosse dela.
Uma resposta ou um Parar que chega antes do boot assentar assenta a conversa primeiro
(`settleConversation`). A cópia velha que perde o lease com o cartão aberto solta sem negar. A queda segue o
mesmo caminho da atualização, pelo fim do lease: o boot não distingue um lease cedido de um morto, e não há
marca de saída limpa. Sem cartão estacionado no Mastra, vale o reinício de antes. Fundador, 2026-10-24: "4.
B" e, sobre a queda, "A". Regras: C62, D25. **Prova.** 47.

**O prazo do cartão.** Os 30 min recomeçam na cópia que adota: uma atualização perto do minuto 29 dá ao
cartão até mais 30 min, nunca além da hora do turno. O Mastra não guarda um instante estável da pergunta:
`AgentRun.suspendedAt` é a última escrita do snapshot (`agent/agent.ts:9691`), que a cópia nova reescreve ao
tomar a thread, antes de `listSuspendedRuns` lê-lo (visto ao recuar a data das duas linhas do snapshot). A
coluna `builder.run.waiting_until` guardaria os 30 min exatos, mas o `GRANT UPDATE` de `builder.run` é por
coluna (`e13_runs_grants`), e um grant novo pede o seu pull request e a sua palavra (D11).

**Como foi construído.** O ouvinte da cópia sai antes do `detachFromCurrent`, porque o abort do Mastra
ainda emite `tool_suspension_cancelled` mesmo com `keepParked`. Na cópia nova, `finish` acorda a máquina
antes de guardar, como o caminho de reinício (`endTurn`) já faz; sem isso um Parar ou uma expiração ali
guardaria `unchanged` e perderia o escrito, porque `machines.touched` vive na memória. O código do turno
foi de `sessions.ts` para `turn-run.ts` (`answerTurn`, `adoptTurn`, um fim só) e o registro `Driven` para
`runs/driven.ts`, para ficar sob o teto de 300 linhas do Biome. Não provado: `hubBeside` é um segundo Hub
no mesmo processo do Node, não um segundo processo do sistema; o cartão aparece uma vez no quadro do stream
e a tela unida não foi vista num navegador; uma linha `open` com snapshot velho (a corrida 6edddc96 do
Mastra) seria adotada como cartão. Fora: manter um turno rodando, não estacionado, numa atualização
(roteiro, etapa 16).

## M1 Conta, máquina e trava pela conversa

**Raio.** `model-accounts/processors.ts`: um processador primeiro, `turnOf`, cria o `Turn` em `processInput`
pela conversa; `accountPick` recusa sem `Turn` (`NO_TURN`), em vez de `{}`; `accountModel` acha a conta pela
conversa quando ainda não há `Turn`, porque o Observador roda antes. `runs/`: a máquina pela conversa; saem
`context.ts`, `keys.ts` (`conexus.run`) e o prazo de uma hora (`deadline.ts`). `sessions.ts`: sai o `Turn`
do pedido.

**Contratos.** A conversa de uma execução é `requestContext.get('controller').sessionId`, em toda execução
que o Mastra abre (mensagem, orientar, fila), como a Factory e o Mastra Code. A trava, na forma mais
simples: um Projeto, uma conversa escrevendo; `turnOf` recusa outra conversa com `abort` e `RUN_BUSY`; o
`onBeforeAgentEnd` solta só a trava da sua conversa. Pelas rotas de hoje; a tela não muda. Regras: C26,
S39, T24. **Prova.** 35 a 37, 41.

## M2 As rotas do Mastra, a tela e as remoções

**Raio.** Servidor: cria `guard.ts` (o escopo das rotas, 0050) e `end.ts`; apaga `routes.ts` (mandar,
Parar, cartão, stream), `sessions.ts`, `deliver.ts`, `steer.ts`, `answers.ts`, `cards.ts`, `listen.ts`,
`live.ts`, `tell.ts`, `turn-log.ts`, `turn-state.ts`, `turn-events.ts`, `turn-end.ts`, `turn-parts.ts`,
`wire.ts`, `wire.check.ts` e a gravação da pergunta em `record.ts`; `runs/driven.ts` sai. Tela: saem
`use-live.ts`, `timeline.ts`, `parts.ts`, `steer-screen.ts`, `steers.ts`, `steer-events.json`. `hub-api/`:
saem o stream próprio, `mastra-parts.ts` e `wire-limits.ts`.

**Contratos.** A lista fixa: `GET …/stream`, `POST …/messages`, `POST …/abort`, `POST …/tool-suspension`,
`POST …/steer`, `POST …/follow-up`, `GET …/threads/:threadId/messages`; o resto do Mastra dá 404. A sessão
nasce na rota "nova conversa" do Hub, `createSession({ id, resourceId, threadId: id })`. `end.ts`:
`onBeforeAgentEnd` chama `runs.finish` pela conversa (versão, bundle, `data-conexus-version`). Tela: o
`MastraClient` (`baseUrl: '/api/builder'`, `credentials: 'include'`), `subscribe` com `reconnect`, o redutor
sobre `display_state_changed` e `message_*` na forma da Factory UI. Regras: C21, C26, S10, S39, S41, T23,
T24. **Prova.** 3 a 5, 30, 31, 41 a 49.

## M3 O Fim pelo `isTaskComplete`

**Raio.** `processors.ts`: sai `checkGate`; `builder.ts`: `defaultOptions.isTaskComplete` com o avaliador
`conexus-check` (`createScorer`), que acha a máquina pela conversa em `customContext.controller`. Regras:
C26, T24. **Prova.** 15.

## M4 O arquivo do Mastra Code

**Quinta emenda.** Era o `E2BSandboxFilesystem` nativo; passa ao `SandboxFilesystem` (fundador: "B").

**Raio.** `machine/`: saem `MachineFilesystem` (`filesystem.ts`) e `in-machine.ts`; entra o
`SandboxFilesystem` de `@mastra/code-sdk` 1.15.0 (versão exata, que pede o `@mastra/core` 1.79.0), importado
de `@mastra/code-sdk/agents/sandbox-filesystem` como a Factory, com `workdir` a pasta do app, sobre a
`E2BSandbox` da conversa que a M5 já cria com a workspace (0051 Z2). Na E2B ele usa o arquivo nativo da
máquina; no dublê, o comando. `apps/server/package.json` ganha o pacote; `stack.md` ganha a linha dele.
Regras: T24. **Prova.** 16.

## M5 A máquina da conversa

**Raio.** `machine/`: o nome e a marca pela conversa; saem `rows.ts`, `tables.ts` (`machine`),
`reattach: 'required'`, `isGone`, a segunda partida que esquecia a linha, `list`, `rowOf`, `forget` e
`projectsOf`; a API do E2B mata pela conversa. `runs/`: a workspace por conversa; saem `daily.ts`, `sweep` e
`writing`; a remoção mata pela conversa. `conversation/builder.ts`: a conversa da execução chega ao
resolvedor; `conversation/public.ts`: as conversas soltas antes da remoção. `hub-api/` e a tela: saem as
fases `waking` e `replaced` (as partes velhas são `data` sem esquema na leitura, `mastra-parts.ts:133-137`).
`architecture.md`, a linha "One E2B key", sem a varredura. Migração própria, em pull request próprio
(D11): sai `builder.machine` e a sua permissão.

**Contratos.** O nome da máquina é `conexus-<instalação>-<conversa>`; a marca leva a origem, a empresa, o
Projeto e a conversa. A `E2BSandbox` nasce com a workspace da conversa, sem `sandboxId`: no `start()` o
Mastra a acha pelo nome ou cria outra, e o `onStart` diz `connected` ou `created`. A trava do M1 fica por
Projeto. Ao soltar, a remoção lista no E2B pela marca e pela conversa e mata cada uma, antes das threads.
Os arquivos ficam no disco da máquina, as versões no nosso Git no Hub e a cópia de cada versão no R2,
sem montagem (fundador: "1 A"). Regras: C26, D11, D30, S36, T24. **Prova.** 41, 52 a 54.

## Por que a 14 deixou passar

Para o fechamento (L19): a revisão leu um cartão que permitia "não abre"; a QA usou dublês parciais,
só Anthropic (T24); o ao vivo da 13 viu "Usou uma ferramenta" sem virar critério.
