# Etapa 22: Ensaio geral

O roteiro chama esta etapa de "22 Ensaio geral. Restaura tudo junto, pelo procedimento." Ela vem
depois da 16 e pede "O lugar da cópia fora do Neon"; o conhecimento trazido é "Ensaios das etapas 2,
7, 9, 12 e 13. Carga de um painel e de uma rotina". Este cartão foi escrito sobre o `main` em
`44fb4040` (2026-11-09), com `@mastra/core` 1.82.0, `@mastra/pg` 1.35.0, `@neon/sdk` 7.3.0, `pg`
8.23.1 e PostgreSQL 18, enquanto a 24.6 constrói. Nesse commit a 24.5 ainda não fechou, e a 24.6, a
24.7, a 21.1 e a 16 existem só nos seus cartões. Cada linha que este cartão cita de um desses cartões
diz o commit lido; a construção da 22 relê cada uma no `main` do dia e para se o nome mudou (seção
"Parar se" de cada unidade).

## A página do fundador

**No fim desta etapa** você restaura o Conexus inteiro a um minuto que escolheu, seguindo uma página
só, e vê que o que era de antes voltou, que o que veio depois sumiu e que nada foi feito duas vezes.
Vê também, toda manhã, que a cópia da noite está guardada fora do Neon, e manda o Conexus provar que
ela volta.

**O roteiro de uso.**

1. No GitHub, em Actions, abra "Copiar para fora do Neon": a rodada desta noite está verde e diz
   quantos bancos copiou (o do Hub, o das conversas e um por empresa) e o tamanho de cada um. No
   console do lugar da cópia (decisão `A`), a pasta do dia tem esses arquivos e um `manifesto.json`.
2. Rode "Conferir a cópia". Em até 15 minutos ela fica verde e diz o que voltou num banco
   descartável: a última migração (a mesma do manifesto), as empresas, as conversas, as automações
   ativas e os cartões que esperavam resposta.
3. Prepare o ensaio na empresa de teste: comece uma conversa; peça ao agente uma escrita e deixe o
   "Aprovar?" sem responder; crie uma automação para daqui a 10 minutos; ligue o seu Telegram ao
   agente. **Anote a hora.** Depois dela: comece outra conversa, aprove o cartão (o pedido vai ao
   Sankhya), espere a automação rodar e ligue o Telegram de outra pessoa.
4. Restaure tudo pela página "Restaurar tudo" do repositório. Em Actions, "Parar o Hub": o Hub e os
   apps publicados ficam fora do ar até o passo seguinte acabar. No console do Neon, restaure o
   projeto do Hub e o da empresa de teste à hora anotada. Em Actions, "Reiniciar o Hub" com a caixa
   "Depois de restaurar" marcada e a hora anotada no campo dela. Anote quanto tempo levou, do
   "Parar o Hub" até o Hub voltar.
5. Entre de novo (toda sessão acabou). Na página de status do Hub, abaixo de "Último início", a
   linha "Última restauração" mostra a hora anotada. A primeira conversa está lá, a segunda não. O
   cartão "Aprovar?" aparece encerrado, com "Restaurado: peça de novo se ainda precisar", e o Sankhya
   tem um pedido só. A automação não rodou de novo e mostra o próximo horário. O seu Telegram
   responde; o da outra pessoa pede para ligar de novo.
6. Rode "Medir a carga" em Actions. Ela diz quanto tempo o painel levou para 95% das respostas com 25
   pessoas ao mesmo tempo, e se as 30 execuções da rotina terminaram, cada uma uma vez (decisão `E`).

**O que você faz, e quando.** Antes: a sua letra na decisão `A` e, depois dela, a conta e o bucket
no lugar escolhido, com a chave de gravação entregue ao firstmate (a página "Copiar para fora do
Neon" diz como, sem colar a chave em lugar nenhum). No começo: aprova esta página; a aprovação vale
também como a sua palavra para a tabela nova `hub.restores` e a leitura dela pelo Hub, num pull
request próprio dentro da U3 (regra D11), e para a exceção da cópia na regra D27 (decisão `F`). No
fim: faz o roteiro, diz o que viu e aprova os textos da tela.

**Fica de fora.**
- O plano pago do Neon, com 7 dias de volta no tempo: é a etapa 23 ("O plano pago"). Até lá o
  histórico do Neon é de 6 horas, e a cópia da noite é o que cobre um erro visto no dia seguinte.
- Restaurar o Conexus noutro servidor, do zero: o ensaio restaura no servidor de hoje. A página da
  cópia descreve o caminho de desastre (um projeto Neon novo a partir da cópia), e "Conferir a cópia"
  prova toda noite que a cópia volta, mas um servidor novo não é ensaiado aqui.
- Os rastros no Grafana (21.1): ficam com o que já mandaram; não voltam no tempo, e não precisam.
- Os itens marcados `next-card`: são do próximo cartão da trilha, que não é este. Nenhum é sobre
  cópia, restauração ou carga.

**As decisões suas nesta etapa.**

- **A. Onde fica a cópia fora do Neon.** Caso real: o Neon perde o projeto do Hub, ou a conta é
  bloqueada; sem cópia fora, perde-se tudo, e hoje não existe nenhuma. Exemplo: a cópia de uma noite
  com o Hub, as conversas e cada empresa, uns poucos GB.
  - **A1. Cloudflare R2**, um bucket novo na conta que você já tem: US$ 0,015 por GB por mês, os
    primeiros 10 GB grátis, saída grátis. Fica fora do Brasil (o R2 não tem região na América do
    Sul) e na mesma conta que guarda os apps e o túnel.
  - **A2. Amazon `S3` em São Paulo**: US$ 0,0405 por GB por mês; para trazer de volta, US$ 0,15 por GB
    (uma restauração de 2 GB custa US$ 0,30). Os dados ficam no Brasil, numa conta separada do Neon e
    da Cloudflare, com o bloqueio "compliance": nem a conta principal apaga a cópia antes do prazo.
    Conta nova.
  - **A3. Magalu Cloud**, região Sudeste ou Nordeste: R$ 0,10 por GiB por mês e R$ 0,10 por GiB para
    trazer de volta, impostos inclusos. No Brasil, compatível com `S3`. Não consegui ler como é o
    bloqueio contra apagar (a página estava fora do ar). Conta nova.
  - **Recomendo A2.** Os dados das empresas ficam no Brasil: com A1, a decisão 0032 pede avisar cada
    empresa de que a cópia sai do país; com A2 e A3, nada sai. A cópia não divide conta com o que ela
    protege, e o bloqueio é o único dos três com texto lido que diz que ninguém apaga.
    Com 4 empresas e 30 noites, entre US$ 0,20 e US$ 6 por mês (o maior número supõe cada banco no
    teto de 1 GB do plano grátis). Como nativo: o `S3` é o destino que o próprio Neon ensina, com
    `pg_dump` toda noite numa Action do GitHub; o Conexus já fala `S3` com o R2.
- **B. O que a restauração faz com o que estava marcado ou esperando.** Caso real: a automação das 8h
  lançou um pedido no Sankhya às 8h; às 9h você restaura às 7h55. Exemplo: um "Aprovar?" que você já
  tinha aprovado volta a aparecer aberto. Hoje, na 24.5, o cartão de um agente não volta depois de um
  reinício; ele passa a voltar com a etapa 16 (a `A1` dela, recomendada), e o do Telegram (24.7) e o
  de um workflow (24.6) voltam sempre. A restauração termina num reinício, então é esse cartão que
  ela traria aberto.
  - **B1. O que volta é passado.** Toda automação volta no próximo horário dela, sem rodar o que
    passou; quem quiser roda agora pelo botão que já existe. Todo "Aprovar?" que estava aberto aparece
    encerrado, com "Restaurado: peça de novo se ainda precisar". Nada se faz duas vezes; um disparo
    pode faltar. Os vínculos do Telegram feitos antes do minuto continuam: cada mensagem confere de
    novo quem escreve, pela conta do Telegram.
  - **B2. O que o Mastra faz sozinho.** Cada automação atrasada roda uma vez ao subir, e os cartões
    continuam abertos. Nada falta, mas o que já tinha sido feito pode ser feito de novo: medi aqui a
    automação rodando de novo 47 milésimos depois de o Hub subir, com a mesma identidade do disparo
    que já tinha acontecido.
  - **B3. Tudo pausado.** Toda automação fica pausada até a pessoa religar; os cartões ficam abertos.
  - **Recomendo B1**, a regra S46 do guia de segurança: o que volta de uma restauração é passado até
    alguém confirmar. Como nativo: o próprio Mastra, ao retomar uma automação pausada, calcula o
    próximo horário a partir de agora e não roda os atrasados; o Conexus pausa e retoma cada uma uma
    vez, ao subir depois de uma restauração.
- **E. Qual painel e qual rotina a carga mede, e quanto.** Caso real: dez pessoas abrem o painel de
  vendas às 8h, enquanto as automações das 8h rodam. Nenhuma etapa fixou um número.
  - **E1. Um app de painel e um workflow agendado, na empresa de teste.** O painel: um app publicado
    que lê o banco da empresa, aberto por 25 pessoas ao mesmo tempo durante 5 minutos; passa com 95%
    das respostas abaixo de 2 segundos e nenhum erro. A rotina: 30 workflows (o limite de uma
    empresa) marcados para o mesmo minuto, sem modelo; passa se os 30 terminam em até 5 minutos, cada
    um uma vez.
  - **E2. As telas do Hub.** O painel é a Atividade e o Uso da etapa 21.1; a rotina, uma automação
    que conversa com o modelo.
  - **Recomendo E1.** A arquitetura liga o teste de carga desta etapa aos limites de processamento
    dos apps, e o painel que uma pessoa abre todo dia é um app. Sem modelo, a medida não gasta a sua
    assinatura e mede o Conexus, não o fornecedor. Os números são uma proposta: são seus.
- **F. Quanto tempo a cópia guarda.** Caso real: um erro visto só na segunda-feira.
  - **F1. Uma cópia por noite, às 3h, guardada 30 dias.**
  - **F2. Uma por noite, guardada 7 dias**, como no exemplo do Neon.
  - **Recomendo F1.** Uma regra só, fácil de conferir; com A2, 30 noites custam poucos dólares. O
    Documenso, uma das referências, recomenda guardar mais tempo em degraus (7 diárias, 4 semanais,
    12 mensais); isso cabe na etapa 23, com o plano pago.
  - Em qualquer letra, a cópia acorda o banco do Hub, o das conversas e o de cada empresa uma vez por
    noite, por poucos minutos. A regra D27 hoje só deixa a agenda das automações acordar o banco: ela
    ganha essa exceção, com a sua palavra, num pull request próprio do guia.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 A cópia da noite | O comando `copy`, o cliente do PostgreSQL 18 na imagem, a Action "Copiar para fora do Neon", a página `copia-fora-do-neon.md` | `apps/server/src/platform/copy/`, `apps/server/src/main.ts`, `apps/server/src/platform/config.ts`, `infra/`, `.github/workflows/copy.yml`, `.github/workflows/ci.yml`, `package.json`, `docs/reference/stack.md`, `docs/how-to/`, `docs/guides/data.md` (D27, pull request próprio) | data | A letra `A` e a `F` |
| U2 Conferir a cópia | O comando `copy-check` e a Action "Conferir a cópia" | `apps/server/src/platform/copy/`, `apps/server/src/main.ts`, `infra/copy-check.sh`, `scripts/copy-check.test.ts`, `.github/workflows/copy-check.yml` | testing | U1 |
| U3 Depois de restaurar | A tabela `hub.restores`, o comando `after-restore`, a Action "Parar o Hub", a caixa "Depois de restaurar" do "Reiniciar o Hub", o cartão encerrado e a linha "Última restauração" | `apps/server/migrations/`, `apps/server/database-grants.sql`, `packages/hub-api/src/`, `apps/server/src/hub/status/`, `apps/server/src/hub/identity/`, `apps/server/src/builder/automations/`, `apps/server/src/builder/agents/`, `apps/server/src/builder/conversation/`, `apps/server/src/builder/workflows/`, `apps/server/src/main.ts`, `apps/web/src/hub/status/`, `apps/web/src/builder/conversation/`, `infra/deploy.sh`, `.github/workflows/restart.yml`, `.github/workflows/stop.yml` | security | U1 (o `main.ts`), a letra `B`, a 16 e a 24.6 no `main` |
| U4 O procedimento numa página | `docs/how-to/restaurar-tudo.md`; sai `hub-database-restore.md`; a seção de restauração de `hub-company-databases.md` passa a apontar para ela; arquitetura §7 | `docs/` | delivery | U1, U2, U3 |
| U5 A medição de carga | `scripts/load/`, a Action "Medir a carga", a empresa de teste com o painel e os 30 workflows | `scripts/load/`, `.github/workflows/load.yml`, `package.json`, `docs/reference/stack.md` | testing | A letra `E`; a 24.6 no `main` |

U1 e U5 correm ao mesmo tempo: não dividem pasta. U2 e U3 vêm depois de U1, porque mexem no mesmo
`main.ts` e na mesma pasta `infra/`; entre si, U2 e U3 dividem só a tabela `COMMANDS` de `main.ts`,
uma linha cada, e a segunda a chegar faz o merge. U4 vem por último. O ensaio ao vivo é o uso da
etapa, não uma unidade.

A migração e os grants da U3 entram num pull request próprio, antes do resto da unidade (regra D11).

**Orçamento de código alterado.** U1: 600 linhas. U2: 400. U3: 800. U4: 0 (só documentos). U5: 400.
Total da etapa: 2.200, dentro das 4.000 da regra L2.

## Os critérios de aceite

Os testes da U1 e da U2 rodam o comando por processo, como `apps/server/src/platform/migrate.test.ts`
roda `migrate` (testing T5), sobre PostgreSQL 18 de teste (T19) e um bucket dublê que guarda em
memória cada chamada `S3`.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `node apps/server/src/main.ts copy` grava, sob `copias/<AAAA-MM-DD>/`, um `.dump` no formato próprio do `pg_dump` por banco (o do Hub, o do Mastra, um por empresa com banco pronto), um `globais.sql` e, por último, um `manifesto.json`; o manifesto lista cada arquivo com tamanho e sha256, a versão do Conexus, a última migração e, por Projeto, a versão mais nova no bucket do Git; o processo sai 0 e imprime `COPY_DONE` com a contagem | `apps/server/src/platform/copy/copy.test.ts`, "uma cópia com o Hub, o Mastra e duas empresas" | must |
| 2 | U1 | Uma empresa cujo banco não responde não para a cópia das outras: o manifesto a lista com `FAILED` e o motivo, o processo sai 1 e imprime `COPY_PARTIAL` com o id da empresa, nunca o endereço | `copy.test.ts`, "uma empresa fora" (`unreachableDatabaseUrl`) | must |
| 3 | U1 | Sem a chave do lugar da cópia, ou com ela legível por outros, o comando recusa com `CONFIG_INVALID` nomeando `HUB_COPY_KEY_FILE`, antes de abrir qualquer banco; o Hub (servidor) sobe sem ela | `copy.test.ts`, "sem chave"; `apps/server/src/boot.test.ts`, "o Hub sobe sem a chave da cópia" | must |
| 4 | U1 | A mesma data copiada duas vezes no mesmo dia não sobrescreve a primeira: a segunda vai para `copias/<data>/<hora>/`; o comando nunca chama apagar | `copy.test.ts`, "duas no mesmo dia" (o dublê não registra nenhum `DeleteObject`) | must |
| 5 | U1 | Bucket fora: sai 1 com `COPY_UPLOAD_FAILED`; a pasta fica sem `manifesto.json` | `copy.test.ts`, "bucket fora" | must |
| 6 | U1 | Nenhum endereço de banco, senha ou id de projeto Neon aparece no que o comando imprime nem no manifesto; a empresa é nomeada pelo id do Conexus | `copy.test.ts`, "o que sai não tem segredo" | must |
| 7 | U1 | A Action "Copiar para fora do Neon" roda às 06:00 UTC e por botão, no executor do servidor, no grupo de concorrência `hub-copy`, e escreve no resumo da rodada a linha `COPY_DONE` | `scripts/workflows.test.ts`, um caso para `copy.yml` | must |
| 8 | U1 | **Ao vivo**: a primeira rodada no servidor copia o Hub, o Mastra e as empresas; o tempo e os tamanhos ficam no pull request da unidade | Firstmate, depois do Release | must |
| 9 | U2 | `copy-check` restaura a cópia mais nova num PostgreSQL 18 descartável: confere o sha256 de cada arquivo contra o manifesto, restaura os globais, o Hub e o Mastra com os nomes de origem e cada empresa num banco `empresa_<id>`, roda `migrate` no Hub restaurado (zero migrações a aplicar), imprime `COPY_CHECKED` com empresas, conversas, agendas ativas e execuções suspensas, e sai 0 | `apps/server/src/platform/copy/copy-check.test.ts`, "a cópia volta" | must |
| 10 | U2 | Um arquivo cujo sha256 não bate: sai 1 com `COPY_CORRUPT` e o nome do arquivo, sem restaurar o resto | `copy-check.test.ts`, "um arquivo trocado" | must |
| 11 | U2 | Uma cópia cuja última migração a imagem não tem: sai 1 com `COPY_NEWER_THAN_IMAGE` | `copy-check.test.ts`, "cópia mais nova" | must |
| 12 | U2 | Bucket fora, ou nenhuma pasta com manifesto: sai 1 com `COPY_UNREACHABLE` ou `COPY_NONE` | `copy-check.test.ts`, "sem cópia" | must |
| 13 | U2 | Uma execução suspensa antes da cópia está suspensa no banco restaurado e retoma até `success` por uma instância do Mastra apontada para ele (a prova do estudo, agora como teste; o comando só conta, o teste retoma) | `copy-check.test.ts`, "o Mastra volta" | must |
| 14 | U2 | A Action "Conferir a cópia" roda só por botão, no executor do servidor, no grupo `hub-copy`; o banco descartável sai com `docker stop` também quando a conferência falha | `scripts/workflows.test.ts`, um caso para `copy-check.yml`; `scripts/copy-check.test.ts` (o script com um `docker` dublê) | must |
| 15 | U2 | **Ao vivo**: "Conferir a cópia" fica verde em até 15 minutos com a cópia da noite | Firstmate | must |
| 16 | U3 | A Action "Parar o Hub" para o Hub com a espera de saída dele (`stop_grace_period`, 210 s), sob o limite de 240 s, imprime "stopped" e sai 0; um Hub já parado imprime "already stopped" e sai 0. "Reiniciar o Hub" com "Depois de restaurar" sobe o Hub parado com a imagem e o modelo que o contêiner parado guarda (`compose ps --all`); sem a caixa, um Hub parado continua recusado ("no Hub is running") | `scripts/deploy.test.ts`, "--stop", "--stop parado" e "--restart --restored com o Hub parado"; `scripts/workflows.test.ts`, um caso para `stop.yml` | must |
| 17 | U3 | "Depois de restaurar" pede a hora restaurada; `deploy.sh --restart --restored <instante> [<template>]` roda `migrate`, depois `after-restore <instante>`, depois sobe o Hub; `after-restore` falhando para o reinício antes de subir, com "after-restore failed". Com um Hub de pé, `--restored` recusa antes de tudo, com "stop the Hub first: run Parar o Hub" | `scripts/deploy.test.ts`, "--restart --restored"; `scripts/workflows.test.ts`, a entrada `restored_to` de `restart.yml` | must |
| 18 | U3 | `after-restore <instante>` grava uma linha em `hub.restores` com o instante e o id da rodada da Action, e imprime `RESTORE_APPLIED`; a mesma rodada repetida não grava outra | `apps/server/src/hub/status/restores.test.ts`, "uma linha por rodada" | must |
| 19 | U3 | `after-restore` recusa, sem mudar nada, quando o banco tem um `hub.starts` depois do instante dado (`RESTORE_POINT_MISMATCH`: a restauração não aconteceu, ou a hora está errada), quando não tem nenhum (`RESTORE_POINT_UNKNOWN`) e quando o instante está no futuro. A recusa cobre a caixa marcada sem restauração só quando o Hub iniciou depois daquela hora; no outro caso, `after-restore` encerra sessões e cartões e move agendas, o que é seguro, e a página "Restaurar tudo" diz para marcar a caixa só depois de uma restauração | `restores.test.ts`, "a caixa marcada sem restauração", "sem início", "no futuro" | must |
| 20 | U3 | Depois de `after-restore`, toda sessão acabou: a chamada com o cookie antigo responde 401, e entrar de novo funciona; imprime `RESTORE_SESSIONS_ENDED` com a contagem | `apps/server/src/hub/identity/restore-sessions.test.ts`, pela porta pública | must |
| 21 | U3 | Decisão `B1`: depois de `after-restore`, nenhuma execução com `runId` `sched_<id>_<nextFireAt>` de um `nextFireAt` anterior à linha de `hub.restores` roda quando o Hub sobe; os disparos seguintes rodam no horário; uma agenda pausada pela pessoa continua pausada; imprime `RESTORE_SCHEDULES_MOVED` com a contagem. Sem `after-restore`, o mesmo teste mostra o disparo repetido | `apps/server/src/builder/automations/after-restore.test.ts`, "a agenda vencida não roda de novo" | must |
| 22 | U3 | Decisão `B1`, com a `A1` da 16 (com a `A2`, o cartão não volta e este critério sai): uma espera "Aprovar?" cuja execução estava suspensa quando `after-restore` rodou volta como `RESTORED`, sem botões; responder a ela pela rota da conversa recebe 409 `RESTORED_WAIT_CLOSED` e nada vai ao Sankhya; uma espera criada depois da subida aprova normalmente | `apps/server/src/builder/conversation/restored-wait.test.ts`, pela rota da conversa | must |
| 23 | U3 | Decisão `B1`, na 24.6: uma execução que estava suspensa num balão de aprovação quando `after-restore` rodou aparece como `RESTORED`, e a decisão dela recebe 409 `RESTORED_WAIT_CLOSED` | o teste da rota de decisão da 24.6, `apps/server/src/builder/workflows/runs.test.ts`, caso novo | must |
| 24 | U3 | Decisão `B1`, na 24.7: o botão Aprovar de um cartão do Telegram cuja execução estava suspensa quando `after-restore` rodou responde "Restaurado: peça de novo se ainda precisar" e nada vai ao Sankhya | o teste do canal da 24.7, caso novo | must |
| 25 | U3 | `GET /api/status` traz `lastRestore` (`{ state: 'NONE' }` ou `{ state: 'RESTORED', restoredTo, appliedAt }`); a página de status mostra "Última restauração: 09/11/2026 07:55" abaixo de "Último início", ou nada | `apps/server/src/hub/status/status.test.ts`; `apps/web/src/hub/status/status-page.test.tsx` | must |
| 26 | U4 | `docs/how-to/restaurar-tudo.md` existe, em português, abaixo de 800 palavras, com a ordem: "Parar o Hub"; restaurar o ramo do Hub; restaurar cada empresa ao mesmo minuto; "Reiniciar o Hub" com "Depois de restaurar" e a hora; conferir; apagar os ramos `_old_`; conferir o Git dos Projetos mexidos depois do minuto; `hub-database-restore.md` saiu e nenhum link aponta para ele | `npm run docs` | must |
| 27 | U4 | **Ao vivo**, o ensaio: o roteiro de uso, passos 3 a 5, na empresa de teste, com o tempo de cada passo no livro de aprovações; o Sankhya tem um pedido só | Fundador, com o firstmate | must |
| 28 | U4 | **Ao vivo**, os ensaios trazidos, no mesmo dia: a empresa de teste apagada e recuperada pelo SDK (etapa 7); o Git de um Projeto refeito do bucket (etapa 13); os dois bancos do Hub no mesmo minuto (etapa 12) | Firstmate | must |
| 29 | U5 | `node scripts/load/painel.ts --url <endereço> --duration <s>` abre o painel com 25 conexões e imprime p50, p95, p99, a taxa e os erros; sai 1 se o p95 passa de 2 s ou há erro (os números da decisão `E`) | `scripts/load/painel.test.ts`, contra um servidor local de teste, `--duration 2` | must |
| 30 | U5 | `node scripts/load/rotina.ts --minute <instante>` lê pela API do Hub as execuções dos workflows marcados para aquele minuto e imprime quantas terminaram, a duração de cada e se algum `runId` aparece duas vezes; sai 1 se falta uma das 30, se passou de 5 minutos ou se uma repetiu | `scripts/load/rotina.test.ts`, contra um Hub de teste | must |
| 31 | U5 | A Action "Medir a carga" roda num executor do GitHub, fora do servidor, só por botão, com as entradas `minute` e `url`; o cookie da pessoa de teste e o id da empresa de teste vêm de segredos do ambiente `load`; outra empresa é recusada antes de medir | `scripts/workflows.test.ts`, um caso para `load.yml` | must |
| 32 | U5 | **Ao vivo**: "Medir a carga" verde ou vermelha, com os números no pull request da unidade e no livro | Fundador | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Página de status, linha "Última restauração" | Nada (`NONE`) | Nada | Como as linhas de início | A página já trata o status fora; a linha não aparece | — | — | — |
| Cartão "Aprovar?" na conversa | — | — | — | — | — | — | `RESTORED`: "Restaurado: peça de novo se ainda precisar", sem botões |
| Execução de workflow parada | — | — | — | — | — | — | `RESTORED`, o mesmo texto, sem Aprovar |
| Cartão no Telegram | — | — | — | — | — | — | o botão responde o mesmo texto |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `hub.restores.restored_to` | `after-restore` (U3) | `lastRestore` (status) |
| `hub.restores.applied_at` | `after-restore` | `lastRestore` |
| `hub.restores.run_id` | `after-restore` (o id da rodada da Action) | `after-restore` (uma linha por rodada) |
| `hub.restores.paused` | `after-restore`, antes de pausar | `after-restore` da rodada seguinte, quando `resumed` é falso |
| `hub.restores.resumed` | `after-restore`, depois de retomar todas | `after-restore` da rodada seguinte |
| `hub.restores.closed_runs` | `after-restore`: os `runId` de toda execução suspensa no Mastra | o leitor das esperas guardadas da 16, o leitor das execuções da 24.6, o canal da 24.7 |
| `HubStatus.lastRestore` | `status.ts` | `apps/web/src/hub/status/status-page.tsx` |
| `RESTORED` no estado da espera | o leitor das esperas guardadas da 16 (`RestoredWait`) | o cartão "Aprovar?" |
| `manifesto.json` | `copy` (U1) | `copy-check` (U2), quem restaura à mão (página da cópia) |
| A entrada `restored_to` de `restart.yml` | quem roda "Reiniciar o Hub" | `infra/deploy.sh`, `after-restore` |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `copy`: `pg_dump` de um banco e envio ao bucket | O grupo `hub-copy` enfileira; à mão, a segunda vai para `<data>/<hora>/` | Envio cortado: o objeto por partes não se completa e o bucket não o mostra; o manifesto, o último a subir, não existe, e `copy-check` ignora a pasta sem manifesto | Banco da empresa fora: segue as outras, `COPY_PARTIAL`; bucket fora: sai 1, `COPY_UPLOAD_FAILED`, nada apagado | `COPY_DONE`, `COPY_PARTIAL`, `COPY_UPLOAD_FAILED` | 1, 2, 4, 5, 6 |
| `copy-check`: restaurar no banco descartável | Mesmo grupo `hub-copy` | Cortada: o contêiner `--rm` some com o que tinha; a rodada sai 1 | Bucket fora: `COPY_UNREACHABLE`; sha256 errado: `COPY_CORRUPT` | `COPY_CHECKED`, `COPY_CORRUPT`, `COPY_NEWER_THAN_IMAGE`, `COPY_UNREACHABLE`, `COPY_NONE` | 9 a 14 |
| `deploy.sh --stop` | O grupo `hub-server` enfileira | Parada cortada: o Compose termina a parada sozinho; rodar de novo para um Hub já parado sai 0 | Docker fora: sai 1 | "stopped", "already stopped" | 16 |
| `deploy.sh --restart --restored` inteiro | O grupo `hub-server` enfileira | Queda entre `migrate` e `after-restore`: o Hub não sobe; rodar de novo repete `migrate` (nada a aplicar) e `after-restore` (seguro de repetir) | Banco fora: `migrate` e `after-restore` saem 75 e o script tenta de novo, como hoje | "after-restore failed", "restarted" | 17, 19 |
| `after-restore`: linha em `hub.restores` | `run_id` único: a mesma rodada não grava duas vezes (`ON CONFLICT DO NOTHING`) | Gravada e queda antes das agendas: a rodada seguinte acha a linha e continua dela | Banco fora: sai 75 | `RESTORE_APPLIED`, `RESTORE_POINT_MISMATCH`, `RESTORE_POINT_UNKNOWN` | 18, 19 |
| `after-restore`: apagar sessões | Apagar duas vezes não muda nada | — | Banco fora: sai 75 | `RESTORE_SESSIONS_ENDED` | 20 |
| `after-restore`: gravar `closed_runs` e `paused`, `schedules.pause` e `resume` do Mastra, gravar `resumed` | `pause` e `resume` do Mastra são seguros de repetir (`schedules-D8PrAbVN.js:664-698`) | Pausadas e sem `resumed`: a rodada seguinte retoma toda agenda de `paused` antes de tudo | Banco do Mastra fora: sai 75 | `RESTORE_SCHEDULES_MOVED` | 21 |
| Responder a uma espera `RESTORED` (conversa, workflow, Telegram) | Dois toques: os dois recusados | — | — | nada (409 para a pessoa) | 22, 23, 24 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cópia dos bancos fora do Neon | U1 | nenhum | Guia do Neon "Automate pg_dump to `S3`", `neon.com/docs/manage/backups-aws-s3-backup-part-2` (documentado, 2026-11-09); Documenso `cd0cc5f` (lido); Twenty `b76d0217` (lido) | `pg_dump` noturno por banco numa Action do GitHub, enviado a um bucket, guardado N dias, pela conexão direta | nativo (`pg_dump` 18, `@aws-sdk/client-s3`) | Estudo: 1,3 GB em 6,0 s, 97 MB (provado, local) | precisa: `A`, `F` | `apps/server/src/platform/copy/copy.ts` |
| Lista dos bancos das empresas | U1 | `platform/neon.ts:41-51` (`list`, `ownerConnection`) | `@neon/sdk` 7.3.0 | Lista os projetos da organização das empresas e dá o endereço do dono para um ato | nativo | — | não precisa | — |
| Papéis no destino | U1, U2 | `platform/migrate.ts:217-250`; migração `20261014145224_hub_runtime_login` | PostgreSQL 18 `pg_dumpall --globals-only --no-role-passwords`; Windmill `5d3f239` (dump do cluster) | Papéis à parte, sem senha; a senha volta pelo programa | nativo | Estudo: `migrate` no destino em 92 ms, 90 migrações (provado, local) | não precisa | — |
| Bloqueio contra apagar, e o prazo | U1 | nenhum | `S3` Object Lock "compliance", `docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html` (documentado, 2026-11-09); R2 bucket locks (documentado) | O provedor recusa apagar antes do prazo; a retenção padrão do bucket vale para todo objeto; uma regra de ciclo de vida apaga depois do prazo | nativo (do provedor) | — | precisa: `A`, `F` | `docs/how-to/copia-fora-do-neon.md` |
| Um registro que liga tudo | U1 | nenhum | `neon-for-agent-platforms@028b69b`, `skills/neon-postgres-agent-platforms/references/COMPOUND_CHECKPOINTS_FOR_AGENT_PLATFORMS.md:7-18,43` (lido) | Uma linha do plano de controle liga banco, commit, segredos e deploy, restaurados numa ordem fixa | nativo na forma: aqui o registro é o manifesto no bucket, porque ele precisa sobreviver ao Neon | — | não precisa | `apps/server/src/platform/copy/manifest.ts` |
| Conferir a cópia | U2 | nenhum | Documenso `cd0cc5f` (teste mensal e `pg_restore --list`, lido) | Restaurar num banco descartável e conferir | nativo (`pg_restore` 18) | Estudo: restauração em 11,4 s, espera retoma (provado, local) | não precisa | `apps/server/src/platform/copy/copy-check.ts` |
| Restaurar o Hub a um minuto | U4 | `docs/how-to/hub-database-restore.md`; `infra/deploy.sh:161-171` | Neon instant restore, `neon.com/docs/introduction/branch-restore` (documentado, 2026-11-09) | Sobrescreve a linha do tempo do ramo raiz; todos os bancos do ramo voltam juntos; deixa `{ramo}_old_{hora}` | nativo | Etapa 2, critérios 21 e 22 | "Deu certo" (etapa 2) | `docs/how-to/restaurar-tudo.md` |
| Restaurar uma empresa | U4 | `hub-company-databases.md` "Restore a company"; `hub/apps/repair.ts:218` | Neon instant restore por projeto (documentado) | Um projeto por vez, à mesma hora; o Hub refaz Worker, logins e migrações ao subir | nativo + embrulhado (o conserto) | Etapa 9, critério 23 | "Restaurei" (etapa 9) | `docs/how-to/restaurar-tudo.md` |
| Recuperar empresa apagada | U4 | decisão 0040, verificação 3 | `@neon/sdk` 7.3.0 `recover` | Recupera o projeto apagado | nativo | 0040: "the row returned" | "T4A" (etapa 7) | — |
| Restaurar o Git de um Projeto | U4 | `docs/how-to/hub-git-restore.md`; `builder/git/copy/copy.ts` | `git bundle` | Um bundle por versão; `fetch` num repositório vazio | nativo | 0051: "um segundo" | "13 sim" | — |
| Agenda depois de restaurar | U3 | `builder/automations/automations.ts:166-224`; `builder/mastra/hub-mastra.ts:101-104` | `@mastra/core` 1.82.0 `dist/scheduler-Me4rCjO2.js:340-360`; `dist/schedules-D8PrAbVN.js:664-698` (`schedules.pause`, `resume`); `dist/docs/references/docs-workflows-scheduled-workflows.md:150-151` (lido) | O vencido roda uma vez com `runId` `sched_<id>_<nextFireAt>`; `resume` recalcula a partir de agora, é seguro de repetir e não liga o agendador | nativo (`schedules.pause`, `schedules.resume`) | Estudo: disparo repetido 47 ms após subir, mesmo `runId` (provado, local); o conserto por `pause` e `resume`: lido, provado pelo critério 21 | precisa: `B` | `apps/server/src/builder/automations/after-restore.ts` |
| Espera de aprovação depois de restaurar | U3 | 24.5: o guarda só responde a um portão vivo (`builder/conversation/guard.ts:217`, `session.approval.isArmed`), e o cartão não volta depois de um reinício (cartão da 24.5, linhas 465 e 467); a 16 (`A1`, cartão `405b67f6`, linhas 74-86) passa a trazê-lo de volta pelo `RestoredWait` | `@mastra/server` 1.82.0 `dist/server/handlers/agent-controller.js:194-207,709-760` (`respondToPersistedToolApproval`, lido pela 24.5) | O Mastra guarda a espera e a responde depois de um reinício | embrulhado: o Mastra guarda a espera; o Conexus fecha a guardada antes de `hub.restores` | Não provado aqui: o estudo provou a retomada de um workflow suspenso (`agent-BP9OWM6D.js:11300-11332`), não a de uma espera de ferramenta; a 16 a mede | precisa: `B` | `apps/server/src/builder/conversation/restored.ts` |
| Execuções da 24.6 depois de restaurar | U3 | nada no `main` (cartão da 24.6, `b3218fd4`, linhas 1807-1822 e 1914-1921) | `@mastra/core` 1.82.0 `dist/mastra-D4MXu5BN.js:2886-2896` (`restartAllActiveWorkflowRuns`, lido) | Reinicia toda execução RUNNING ou WAITING (WAITING é espera de tempo); uma execução parada num "Aprovar?" está `suspended` e não é reiniciada | embrulhado, como a espera | Não rodado: a 24.6 não está no `main` | precisa: `B` | o leitor das execuções da 24.6 |
| Sessões depois de restaurar | U3 | how-to, passo 3 (segredo trocado à mão pelo firstmate) | Better Auth 1.7.8, sessões em `auth.session`; regra S46 | Apagar as sessões fecha toda entrada | embrulhado | Critério 20 | não precisa | `apps/server/src/hub/identity/restore-sessions.ts` |
| Parar o Hub antes de restaurar | U3 | `infra/deploy.sh:148-150` recusa `--restart` sem um Hub de pé; nenhuma Action para o Hub | Docker Compose `stop` com o `stop_grace_period` de `infra/compose.yaml` (o mesmo que a publicação usa) | Para o contêiner esperando a saída limpa | nativo | Critério 16 | não precisa | `.github/workflows/stop.yml` |
| Telegram depois de restaurar | U4 | nada no `main` (cartão da 24.7, `ffd94c4c`) | Telegram Bot API (o cartão da 24.7, linha 273: reentrega sem 200) | O webhook vive no Telegram; o vínculo vive no Hub e volta no tempo | nativo | Critério 22, ao vivo | não precisa | — |
| Carga de um painel | U5 | nenhuma ferramenta | autocannon (MIT, Node; documentado; versão fixada na construção) | Conexões simultâneas por um tempo; percentis e taxa | nativo | — | precisa: `E` | `scripts/load/painel.ts` |
| Carga de uma rotina | U5 | laboratório do firstmate de 2026-11-02 (local, modelo dublê) | `@mastra/core` 1.82.0, `mastra_schedule_triggers` e o retrato da execução | Mede pelas execuções que o Mastra grava | nativo | — | precisa: `E` | `scripts/load/rotina.ts` |

**A medida do transplante.** Nada vem do Conexus OS: ele não tinha cópia nem ensaio. A técnica do
seu `conexus-applications-backup` (globais sem senha e `pg_dump -Fc`, restaurados num PostgreSQL
descartável) coincide com a das referências e entra pelas referências, não pelo código antigo.

**A dívida.**
- O plano grátis do Neon guarda 6 horas: a cópia cobre o dia seguinte até a etapa 23.
- Um servidor novo, do zero, não é ensaiado (fica de fora).
- O `restartAllActiveWorkflowRuns` do Mastra não é chamado no `main`; quem o ligar (24.6 ou 16) relê
  o critério 23.

## U1 A cópia da noite

**Base e modelo.** O `main` do dia em que a 16 fechar. Sonnet: um comando novo, com um envio de
arquivo por partes; nada atravessa módulos.

### As linhas da tabela

"Cópia dos bancos fora do Neon", "Lista dos bancos das empresas", "Papéis no destino", "Bloqueio
contra apagar, e o prazo", "Um registro que liga tudo". Ler na base: `apps/server/src/main.ts:311-315`
(a tabela `COMMANDS`), `apps/server/src/platform/migrate.ts:217-250` (o modelo de um comando de uma
vez), `apps/server/src/platform/neon.ts:41-58,179-192` (`list`, `ownerConnection`, `OWNER_ROLE`,
`COMPANY_DATABASE`), `apps/server/src/hub/projects/company-database.ts:103` (`readyDatabaseOf`),
`apps/server/src/builder/git/copy/copy.ts` (o modelo do cliente `S3`: `CALL_MS`, um `abortSignal`
por chamada), `infra/compose.yaml:92-107` (o serviço `migrate`), `infra/hub.Dockerfile:30-40`, e o
guia do Neon de `pg_dump` (pela conexão direta, nunca a agrupada).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/copy/` | Cria | `main.ts` |
| `apps/server/src/main.ts` | Muda (uma linha em `COMMANDS`) | a imagem |
| `apps/server/src/platform/config.ts` | Muda: `HUB_COPY_*`, lidos só pelo comando | `copy.ts` |
| `infra/hub.Dockerfile` | Muda: `postgresql-client-18` | a imagem |
| `infra/compose.yaml` | Muda: serviço `copy` (perfil, de uma vez) e o segredo `hub_copy_key` | `infra/copy.sh` |
| `infra/copy.sh` | Cria | `.github/workflows/copy.yml` |
| `.github/workflows/copy.yml` | Cria | o GitHub |
| `.github/workflows/ci.yml` | Muda: o cliente do PostgreSQL 18 no executor dos testes do servidor | o CI |
| `package.json`, `package-lock.json`, `docs/reference/stack.md`, a lei de importação (`.dependency-cruiser.cjs`) | Muda: `@aws-sdk/lib-storage`, com a sua linha | — |
| `docs/how-to/copia-fora-do-neon.md`, `docs/index.md` | Cria, muda | — |
| `docs/guides/data.md` (D27) | Muda num pull request próprio, com a palavra do fundador (decisão `F`) | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/platform/copy/manifest.ts
export const COPY_PREFIX = 'copias' // uma pasta por dia, AAAA-MM-DD; a segunda do dia ganha /HHmmss
export type CopyTarget =
  | { kind: 'HUB' }
  | { kind: 'MASTRA' }
  | { kind: 'COMPANY'; companyId: CompanyId }
export type CopiedFile = { name: string; bytes: number; sha256: string }
export type TargetResult =
  | ({ kind: 'COPIED'; target: CopyTarget } & CopiedFile)
  | { kind: 'FAILED'; target: CopyTarget; reason: 'UNREACHABLE' | 'DUMP_FAILED' | 'UPLOAD_FAILED' }
export const Manifest = z.object({ ... }) // C27: copy-check o lê de fora
export type Manifest = {
  version: 1
  conexus: Version           // de @conexus/hub-api
  lastMigration: string      // a mais nova de drizzle.__drizzle_migrations
  startedAt: string          // RFC 3339, C40
  endedAt: string
  globals: CopiedFile
  targets: TargetResult[]
  gitNewest: { companyId: CompanyId; projectId: ProjectId; version: number }[]
}
// apps/server/src/platform/copy/copy.ts
export async function runCopy(deps: { config: CopyConfig; log: FailureLog; now?: () => Date }): Promise<Manifest>
```

Falhas novas, todas de comando (saída do processo, sem rota): `COPY_UPLOAD_FAILED`, `COPY_PARTIAL`, e
`CONFIG_INVALID` com `HUB_COPY_KEY_FILE`, `HUB_COPY_BUCKET`, `HUB_COPY_URL` ou `HUB_COPY_REGION`. O
dono de cada fato: `COPY_PREFIX` e o formato da pasta em `manifest.ts`; a lista de bancos em
`copy.ts`. Modelo de arquivo: `builder/git/copy/copy.ts`, que cumpre C23 (ids marcados) e C26; o
resultado por banco é união por `kind` (C21).

### As skills e a leitura

`@aws-sdk/client-s3` (a linha da `stack.md`: README; a armadilha do `abortSignal` por chamada); o
envio por partes é `Upload` de `@aws-sdk/lib-storage`, pacote novo; `@neon/sdk` (skills `neon:neon`
e `neon-postgres-agent-platforms`).

### A ordem do trabalho

1. Nada a apagar. Acrescentar `postgresql-client-18` à imagem pelo repositório do PostgreSQL (o
   `apt` do `node:24-slim` não traz a 18), com a chave do repositório fixada; o build confere
   `pg_dump --version`. O mesmo cliente no executor dos testes do servidor em `ci.yml`.
2. `config.ts`: `HUB_COPY_URL` (https), `HUB_COPY_REGION`, `HUB_COPY_BUCKET`, `HUB_COPY_KEY_FILE`
   (dono 1000, modo 0400, como `HUB_GIT_COPY_KEY_FILE`), lidos só pelo comando `copy`; o servidor não
   os exige (critério 3).
3. `copy.ts`: o Hub pela conexão de migração (`HUB_MIGRATION_DATABASE_URL_FILE`), o Mastra pela dele
   (`HUB_MASTRA_DATABASE_URL_FILE`); cada empresa com banco pronto (`readyDatabaseOf`) pelo
   `ownerConnection`. Um processo filho `pg_dump -Fc -Z zstd:3` por banco, com a senha em
   `PGPASSWORD` no ambiente do filho e nunca na linha de comando; a saída vai direto ao `Upload` por
   partes, sem arquivo no disco, contando bytes e sha256 no caminho. Os globais: `pg_dumpall
   --globals-only --no-role-passwords` pela conexão de migração. O manifesto sobe por último. O Hub e
   o Mastra primeiro, depois uma empresa por vez. Regras: C50, C57, S40, D27 (com a exceção da
   decisão `F`).
4. `infra/copy.sh` e `compose.yaml`: o serviço `copy` com o perfil `copy`, como `migrate`, e as
   chaves que ele lê; `copy.sh` faz `compose run --rm copy` sob `timeout 1800`.
5. `.github/workflows/copy.yml`: `schedule: cron '0 6 * * *'` e `workflow_dispatch`, `runs-on:
   [self-hosted, hub]`, `concurrency: hub-copy`, `timeout-minutes: 40`; o resumo da rodada recebe a
   linha `COPY_DONE`.
6. `docs/how-to/copia-fora-do-neon.md` (português): como o fundador cria o bucket da letra `A`, com
   versões, o bloqueio pelo prazo da letra `F` e uma regra de ciclo de vida que apaga depois dele, e
   uma chave que só grava e lê nesse bucket; como entregar a chave ao firstmate; o caminho de
   desastre: um projeto Neon novo, `pg_restore` dos dois bancos, as chaves do servidor apontadas para
   ele, "Reiniciar o Hub" com "Depois de restaurar".

### Como se prova

Critérios 1 a 7, pelo comando rodado por processo; "uma empresa fora" usa `unreachableDatabaseUrl`
(`platform/test-database.ts:284`). O critério 8 é ao vivo, depois do Release. O teste que falha hoje:
o comando `copy` não existe.

### Parar se

- O Neon recusa `pg_dumpall --globals-only` (ele esconde `pg_authid`; `--no-role-passwords` lê
  `pg_roles`; hipótese não rodada): pare e traga ao firstmate; a saída é gerar os papéis a partir das
  migrações, e isso muda a U2.
- O `pg_dump` 18 recusa o servidor do Neon por versão.
- A primeira rodada ao vivo passa de 20 minutos.

## U2 Conferir a cópia

**Base e modelo.** Depois da U1. Sonnet.

### As linhas da tabela

"Conferir a cópia", "Papéis no destino". Ler: `manifest.ts` (U1), `migrate.ts:217-250`,
`apps/server/src/platform/test-database.ts` (como os testes já montam um PostgreSQL 18), e o fluxo da
prova do estudo (globais, `pg_restore`, `migrate`, retomar a espera, ler a agenda).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/copy/copy-check.ts` | Cria | `main.ts` |
| `apps/server/src/main.ts` | Muda (uma linha) | a imagem |
| `infra/copy-check.sh` e `scripts/copy-check.test.ts` | Cria: uma rede própria, PostgreSQL 18 com `--rm`, `compose run --rm copy-check` nela, `docker stop` no fim, também na falha | `copy-check.yml` |
| `.github/workflows/copy-check.yml` | Cria | o GitHub |

### Os contratos que a unidade cria

```ts
export type CheckResult =
  | { kind: 'CHECKED'; migrations: number; companies: number; threads: number; activeSchedules: number; suspendedRuns: number }
  | { kind: 'CORRUPT'; file: string }
  | { kind: 'NEWER_THAN_IMAGE'; lastMigration: string }
  | { kind: 'UNREACHABLE' }
  | { kind: 'NONE' }
export async function runCopyCheck(deps: { config: CopyConfig; scratchUrl: DatabaseUrl; log: FailureLog }): Promise<CheckResult>
```

`scratchUrl` vem de `HUB_COPY_SCRATCH_URL_FILE`, que `copy-check.sh` escreve com a senha aleatória do
contêiner descartável. Cada `kind` tem a sua linha impressa (`COPY_CHECKED`, `COPY_CORRUPT`,
`COPY_NEWER_THAN_IMAGE`, `COPY_UNREACHABLE`, `COPY_NONE`).

### A ordem do trabalho

1. Achar a pasta mais nova com `manifesto.json`, contando as de `copias/<data>/<hora>/` (critério 4), e validá-lo com `Manifest` (critério 12 sem nenhuma).
2. Baixar cada arquivo e conferir o sha256 (critério 10); uma `lastMigration` que a imagem não tem é
   `NEWER_THAN_IMAGE` (critério 11).
3. Restaurar os globais; o Hub e o Mastra com `pg_restore -C -j 4`, nos nomes de origem; cada empresa
   com `pg_restore --no-owner --no-privileges -d empresa_<id>`, num banco criado antes, porque todo
   projeto de empresa chama o banco `neondb` e o dono `neondb_owner` (`neon.ts:56-58`). Rodar
   `migrate` no Hub restaurado com senhas aleatórias de uma vez: zero migrações a aplicar.
4. Contar: `auth.company`, as conversas e as agendas ativas do Mastra, as execuções suspensas;
   imprimir `COPY_CHECKED`.
5. `copy-check.sh` sempre faz `docker stop` do descartável. Regras: S40, T19.

### Como se prova

Critérios 9 a 14, com uma cópia feita pela U1 no próprio teste. O critério 13 é a prova do estudo:
uma execução suspensa antes da cópia retoma até `success` por um Mastra apontado para o banco
restaurado.

### Parar se

- Restaurar uma empresa sem dono nem permissões deixa uma tabela ilegível para a contagem: pare; a U1
  passa a guardar também os globais de cada projeto.

## U3 Depois de restaurar

**Base e modelo.** Depois da U1, com a 24.6, a 24.7 e a 16 no `main`. Opus: atravessa identidade,
automações, conversa, workflows, canal, status e o deploy.

### As linhas da tabela

"Agenda depois de restaurar", "Espera de aprovação depois de restaurar", "Execuções da 24.6 depois
de restaurar", "Sessões depois de restaurar", "Parar o Hub antes de restaurar". Ler:
`builder/automations/automations.ts:166-224`, `builder/mastra/hub-mastra.ts:80-110` (`prepare`,
`start`, `settle`), `hub/status/` inteiro, `packages/hub-api/src/status.ts` (`Start`, `HubStatus`),
`packages/hub-api/src/failures.ts` (o modelo de linha de falha), `infra/deploy.sh:1-30,140-175`,
`.github/workflows/restart.yml`, o leitor das esperas guardadas da 16 (`RestoredWait`, cartão
`405b67f6`, linha 173), o leitor das execuções da 24.6 (cartão `b3218fd4`, linhas 1807-1822 e
1914-1921) e o tratamento do botão Aprovar no canal da 24.7 (cartão `ffd94c4c`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/migrations/<ts>_e22_restores/`, `apps/server/database-grants.sql` | Cria, muda: `hub_runtime` com `SELECT` em `hub.restores`; o comando grava pela conexão de migração. Pull request próprio (D11) | `migrate`, o retrato do catálogo |
| `packages/hub-api/src/status.ts` | Muda: `HubStatus.lastRestore` | o servidor, a web |
| `packages/hub-api/src/failures.ts` (ou o arquivo de falhas da conversa) | Muda: `RESTORED_WAIT_CLOSED` | as rotas |
| `apps/server/src/hub/status/` | Muda: `restores.ts`, `lastRestore` | `main.ts`, `public.ts` |
| `apps/server/src/hub/identity/restore-sessions.ts` | Cria | `after-restore` |
| `apps/server/src/builder/automations/after-restore.ts` | Cria | `after-restore` |
| `apps/server/src/builder/conversation/restored.ts` e o leitor `RestoredWait` da 16 | Cria, muda | a rota da conversa |
| `apps/server/src/builder/workflows/` (24.6) | Muda: o leitor das execuções e a rota de decisão | as rotas dos workflows |
| o canal do Telegram (24.7) | Muda: o botão Aprovar | o webhook |
| `apps/server/src/main.ts` | Muda: comando `after-restore` | `deploy.sh` |
| `apps/web/src/hub/status/status-page.tsx`, o cartão "Aprovar?" | Muda | — |
| `infra/deploy.sh`, `.github/workflows/restart.yml`, `.github/workflows/stop.yml` | Muda, muda, cria | o GitHub |

### Os contratos que a unidade cria

```sql
-- hub.restores (D5, D6; grants em database-grants.sql, D10 a D12)
id bigint generated always as identity primary key,
run_id text not null unique,                 -- o id da rodada da Action
restored_to timestamptz not null,            -- a hora que a pessoa restaurou
applied_at timestamptz not null default now(),
paused text[] not null default '{}',          -- as agendas que esta rodada pausou
resumed boolean not null default false,
closed_runs text[] not null default '{}'      -- os runId suspensos no Mastra quando a rodada rodou
```

```ts
// packages/hub-api/src/status.ts
export const LastRestore = z.discriminatedUnion('state', [
  z.object({ state: z.literal('RESTORED'), restoredTo: z.iso.datetime(), appliedAt: z.iso.datetime() }),
  z.object({ state: z.literal('NONE') }),
]) // como `Start`, C22 e C40
// HubStatus ganha lastRestore: LastRestore
// apps/server/src/hub/status/restores.ts
export async function closedRuns(tx: ReadTx): Promise<ReadonlySet<string>> // a união de closed_runs
// apps/server/src/builder/conversation/restored.ts
export function isRestoredWait(runId: string, closed: ReadonlySet<string>): boolean
```

O estado `RESTORED` entra na união que o leitor `RestoredWait` da 16 devolve ao cartão, e na do
estado da execução da 24.6; é uma consequência direta deste contrato nos contratos daqueles cartões
(delivery L7), declarada no relatório da construção. A linha de falha de `RESTORED_WAIT_CLOSED`:
categoria `USER`, status 409, `settles: true`, frase "Este pedido foi restaurado e já não vale.",
ação "Peça de novo se ainda precisar.", `actionKind: 'NONE'` (C48); os textos vão à rodada do
fundador. Falhas de comando: `RESTORE_POINT_MISMATCH`, `RESTORE_POINT_UNKNOWN` (saída 1). Os textos
da tela: "Restaurado: peça de novo se ainda precisar." e "Última restauração: <data e hora de
Brasília>".

### A ordem do trabalho

1. O pull request da migração e dos grants, sozinho (D11).
2. `stop.yml` (`timeout-minutes: 10`) e `deploy.sh --stop`: `compose stop hub` no grupo `hub-server`,
   sob `bounded 240` (o `stop_grace_period` é 210 s). `--restart --restored <instante>
   [<template>]`: as opções antes do modelo, que continua o último argumento; com `--restored`, um Hub
   de pé é recusado, e o parado sobe com a imagem e o modelo que o contêiner parado guarda
   (`running_id`, `deploy.sh:37-39`, passa a usar `ps --all --quiet`, e `running_template` lê o contêiner parado como lê o de pé). A
   entrada `restored_to` de `restart.yml` é texto ("AAAA-MM-DD HH:MM", hora de Brasília); vazia, o
   reinício é o de hoje.
3. `after-restore <instante>` em `main.ts`, pela conexão de migração e a do Mastra: converte a hora
   de Brasília para RFC 3339; recusa (`RESTORE_POINT_MISMATCH`, `RESTORE_POINT_UNKNOWN`, futuro) sem
   mudar nada; com um Hub de pé, `deploy.sh` já recusou antes; grava `hub.restores` (`ON CONFLICT
   (run_id) DO NOTHING`); apaga `auth.session`; abre o Mastra sem `startWorkers`; grava em
   `closed_runs` os `runId` de `listWorkflowRuns({ status: 'suspended' })` (`@mastra/pg` 1.35.0
   `dist/index.js:26227`, todas as páginas); grava em `paused` as agendas de `schedules.list({ status: 'active' })`,
   faz `pause` e `resume` de cada uma e marca `resumed`. Uma linha achada com `resumed` falso retoma
   as de `paused` antes de tudo. Funções: `@mastra/core` 1.82.0 `mastra.schedules.pause`, `resume`
   (`schedules-D8PrAbVN.js:664-698`). Regras: S46, C50, D20.
4. O leitor `RestoredWait` da 16, o da 24.6 e o canal da 24.7 recebem `lastRestore` e marcam
   `RESTORED` toda espera cujo `runId` está em `closedRuns`; cada resposta a uma delas é recusada
   antes de qualquer chamada ao Mastra. O `RestoredWait` da 16 já traz o `runId` (cartão `405b67f6`,
   linha 173).
5. `status.ts` e `apps/web/src/hub/status/status-page.tsx:53` (uma linha a mais): `lastRestore`.

### Como se prova

Critérios 16 a 25. O 21 repete a prova do estudo como teste: uma agenda com cron de seis campos
dispara, o banco é copiado, o Hub vivo dispara de novo, a cópia é restaurada, `after-restore` roda e
nenhum `runId` de horário anterior roda na subida; sem `after-restore`, o mesmo teste mostra o
disparo repetido (o teste que falha hoje). O 22 entra pela rota da conversa (T5), com o agente dublê
da 24.5 (`builder/agents/test-approval.ts`).

### Parar se

- A espera de ferramenta de um agente não aparece em `listWorkflowRuns({ status: 'suspended' })`
  (a 16 a lê por `listSuspendedRuns`): use a mesma leitura da 16 para `closed_runs`; se ela não der o
  `runId`, pare.
- A 24.6 ou a 16 ligou `restartAllActiveWorkflowRuns`: uma execução que corria no minuto restaurado
  volta a correr; pare e traga ao firstmate antes do critério 23.
- O canal da 24.7 responde ao botão por um caminho que não lê o banco do Hub: pare.

## U4 O procedimento numa página

**Base e modelo.** Depois de U1, U2 e U3. Opus: texto para o fundador.

### As linhas da tabela

"Restaurar o Hub a um minuto", "Restaurar uma empresa", "Recuperar empresa apagada", "Restaurar o
Git de um Projeto", "Telegram depois de restaurar".

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/how-to/restaurar-tudo.md` | Cria | `docs/index.md` |
| `docs/how-to/hub-database-restore.md` | Apaga | os links em `docs/` |
| `docs/how-to/hub-company-databases.md` | Muda: "Restore a company" vira um link; sai o "architecture §8" errado (o conserto vive em `hub/apps/repair.ts`) | — |
| `docs/how-to/hub-server.md` | Muda: o link da restauração e o passo do segredo das sessões | — |
| `docs/architecture.md` §7 "Restore" | Muda: a cópia fora do Neon, "Parar o Hub" e "Depois de restaurar" | — |

### A ordem do trabalho

1. Apagar `hub-database-restore.md` e trocar cada link (`grep -rn hub-database-restore docs`).
2. Escrever `restaurar-tudo.md` na ordem do critério 26, com o que cada passo mostra; a hora em
   Brasília e em UTC; o que conferir no Sankhya e no Telegram; o Git dos Projetos com versão depois
   do minuto (`hub-git-restore.md`; quando o bucket tem versão mais nova que o banco, a próxima versão
   segue a do bucket e nunca refaz por cima). Regras: L23, L24, S46.
3. O ensaio ao vivo (critérios 27 e 28), com o firstmate; os tempos e as palavras do fundador vão ao
   livro de aprovações.

### Parar se

- O ensaio mostra um passo que só funciona com terminal: volta ao cartão.

## U5 A medição de carga

**Base e modelo.** Com a 24.6 no `main` (a rotina é um workflow). Sonnet.

### As linhas da tabela

"Carga de um painel", "Carga de uma rotina". Ler: o laboratório de carga do firstmate (2026-11-02)
pelos números (o agendador dispara no máximo 600 por minuto; 200 execuções ao mesmo tempo usam meio
núcleo), e a rota da 24.6 que lista execuções.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `scripts/load/painel.ts`, `scripts/load/rotina.ts` e testes | Cria | `load.yml` |
| `package.json`, `package-lock.json`, `docs/reference/stack.md` | Muda: `autocannon` como dependência de desenvolvimento, com a sua linha | — |
| `.github/workflows/load.yml` | Cria: `runs-on: ubuntu-latest`, `environment: load`, só `workflow_dispatch`, entradas `url` e `minute` | o GitHub |

### A ordem do trabalho

1. `painel.ts`: `autocannon({ url, connections: 25, duration })`, com o cookie da pessoa de teste do
   segredo `LOAD_COOKIE`; imprime p50, p95, p99, taxa e erros; sai 1 fora dos números da letra `E`.
2. `rotina.ts`: com o mesmo cookie, lê pela API do Hub as execuções dos workflows marcados para
   `--minute`, espera até 5 minutos e confere que cada `runId` aparece uma vez.
3. A empresa de teste ganha, pelo próprio Hub, o app de painel e os 30 workflows marcados para um
   minuto que o firstmate escolhe e passa na entrada `minute`. Regras: S40 (nenhum dado de empresa no
   repositório), T14.

### Parar se

- O painel derruba outro app da mesma empresa (o risco da arquitetura §11): pare e leve os números
  ao fundador antes de qualquer conserto.
