# Publicar pelo merge da nota

Trilho: assistente

Cartão curto, fora da ordem do roteiro. Ocupa a vaga do Assistente só porque nenhuma etapa do
Assistente está em construção; não muda tela, e a marca existe para a verificação `second-card`
(`scripts/cli.ts`, `trackOf`) não pô-lo ao lado do Registro, na vaga de Dados. A palavra do fundador,
em 2026-11-22, ao estudo "publicar a release pelo merge de uma nota": "`A1 B1 C1 D1`". O estudo fica
fora do repositório (delivery L21); a sua tabela de referência está abaixo, com a unidade de cada
linha. Lido no `main` em `4d143a99`. Desde o estudo, `v0.24.109` saiu pela tela, sobre esse commit:
a próxima versão é `v0.24.110`. Ferramentas: `gh` 2.89.0 e actionlint 1.7.12 (os do estudo).

## A página do fundador

**No fim desta etapa** a versão vai ao ar sem ninguém abrir a tela de Releases do GitHub. O
firstmate abre um PR pequeno que traz só a nota da versão; a CI confere o nome; ele mescla; e o
mesmo workflow de publicação cria a tag e a Release com essa nota no commit do merge e publica o
Hub e a borda, numa execução só, como fazem o executor do GitHub (`actions/runner`), o
release-please e o changesets.

**O roteiro de uso.** Sem tela do Hub nova; é tudo na página do GitHub e no Estado do Hub.

1. Abra o PR da nota da `v0.24.110`. Ele muda um arquivo só, `releases/note.md`, que começa com
   `# v0.24.110` e traz embaixo o texto da nota. A CI está verde, com o passo que confere a nota.
2. Depois do merge, abra Actions: a execução de Publish começou no próprio merge, com os trabalhos
   `version`, `release`, `image`, `template`, `apps`, `apps-release`, `deploy` e `edge`, e fica
   verde em cinco a oito minutos, o tempo das últimas cinco publicações.
3. Abra Releases: a `v0.24.110` está lá, com o texto da nota, criada por `github-actions[bot]`, no
   commit do merge.
4. No Hub, abra a Central e o Estado do Hub: a versão é `v0.24.110`.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. Logo depois, se a prova
da regra de tags mostrar que o robô não cria a tag `v*`: desmarca "Restrict creations" na regra de
tags (é a sua `D1`, já dada; "Restrict updates" e "Restrict deletions" ficam). Depois do merge: abre a
porta 22 para o firstmate instalar o gancho novo no servidor e a fecha em seguida (a sua `A1`). No
fim: faz o roteiro e diz o que viu.

**Fica de fora, e por quê.**

- **A Release pela tela como reserva.** Você escolheu fechar essa porta (`B1`): ela sai do workflow e
  do gancho do servidor. "Voltar atrás" e "Reiniciar o Hub" continuam como hoje.
- **A regra `v*` do ambiente `production`.** Com `B1` nenhum trabalho roda mais numa tag, e tirá-la
  apertaria o portão. É uma mudança sua, na tela, e a publicação funciona sem ela.
- **`queue: max` na fila `hub-server`**, para que uma publicação à espera não seja cancelada por
  outra: o actionlint fixado recusa a chave. Fica como Issue futura, com o gatilho da primeira
  publicação cancelada na fila ou da troca do pino do actionlint.
- **release-please, changesets, semantic-release, token pessoal, App do GitHub, revisor no
  ambiente e regra de ramo no `main`**: o estudo os rejeitou (a versão sai dos commits, dois merges
  por versão, ou um segredo novo).

**As decisões suas nesta etapa.** As quatro do estudo já estão dadas ("`A1 B1 C1 D1`"). Fica uma.

**E. Como o texto novo da regra L17 entra.** A L17 diz hoje "Publishing is a GitHub Release
firstmate creates after the merge". Passa a dizer que publicar é o merge de um PR que muda só
`releases/note.md`, e que o workflow cria a tag e a Release com a nota. Guia muda só com a sua
palavra (L20), e a verificação `method-freeze` recusa mudar um guia enquanto o Registro está em
construção, porque este PR mexe em `infra/`, que é da trilha Dados.

| Opção | O que acontece |
| --- | --- |
| **E3. O texto novo da L17 vai no PR de método, mesclado antes deste** (recomendo) | O PR desta etapa não mexe em `docs/guides/` e passa no `method-freeze` sem rótulo. A regra nova chega antes do código: entre o merge do PR de método e a visita ao servidor, a L17 já descreve o PR da nota, e nenhuma nota sai nesse intervalo (a tabela de falhas), então ninguém segue a regra antes de a porta existir. |
| E1. Você põe o rótulo `emergência` no PR desta etapa (não recomendo) | O código e a regra entram juntos. Mas não é emergência: nada está quebrado em produção, e a L20 guarda o rótulo para isso. |
| E2. A L17 espera um PR de método depois deste | O PR entra sem mexer em `docs/guides/`. Até lá a L17 descreve a porta antiga, e só a decisão 0081 e os como-fazer dizem a nova. |

Veredito: nativo nas três (o PR de método e a exceção da L20 são regras nossas já escritas); a escolha
é só de quando e por qual PR.

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 | A prova: o `GITHUB_TOKEN` cria uma tag `v*` sob a regra de tags | `.github/workflows/` | delivery | — |
| G1 | U2 | A nota: o script que lê e confere `releases/note.md`, e o passo da CI que o roda no PR | `scripts/`, `.github/workflows/ci.yml`, `package.json` | delivery | U1 |
| G1 | U3 | O Publish no push do `main` que muda a nota, com a tag e a Release como primeiro ato | `.github/workflows/publish.yml`, `scripts/workflows.test.ts` | delivery | U2 |
| G1 | U4 | O gancho do servidor: aceita push no `main`, deixa de aceitar Release | `infra/`, `scripts/runner-hook.test.ts` | security | — |
| G1 | U5 | Os documentos da porta nova: a decisão 0081 e os como-fazer; a L17 conforme a decisão E | `docs/` | delivery | U3, U4 |

Um pull request só (G1), um commit por unidade; U1 tem dois (um workflow precisa ser empurrado para
rodar, e sai no commit seguinte). U4 não divide arquivo com U2 e U3 e pode correr ao lado delas.

**Orçamento de código alterado.** U1: 25 linhas, que saem. U2: 70. U3: 40. U4: 10. U5: 0 (só
documento). Total da etapa: 120.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Um workflow temporário, num push do ramo desta etapa, com `permissions: contents: write`, cria `refs/tags/vprova-regra` pela API com o `GITHUB_TOKEN` e imprime o código da resposta: 201 segue; 422 com "Repository rule violations" para a etapa até a `D1`, e depois de desmarcado roda de novo e dá 201. O resultado vai num comentário do PR, a tag é apagada pelo firstmate e o workflow não fica no diff final | o log da execução, colado no comentário do PR | must |
| 2 | U2 | Num PR que muda só `releases/note.md`, com a primeira linha `# v<n>.<n>.<n>` de uma tag que ainda não existe e texto embaixo, o passo da nota passa e imprime a versão | `scripts/release-note.test.ts`, "uma nota nova passa" | must |
| 3 | U2 | O passo recusa, com o código na saída e o job vermelho: primeira linha fora do formato (`note-version`), versão com tag já criada (`note-published`), outro arquivo no mesmo PR (`note-not-alone`), nota sem texto embaixo (`note-empty`), nota apagada (`note-version`). Um PR que não toca a nota passa com "no note in this change" | `scripts/release-note.test.ts`, um caso por recusa | must |
| 4 | U3 | Um push no `main` que muda `releases/note.md` roda Publish: `version` lê a nota pelo mesmo script e entrega a versão; `release` cria a tag e a Release com o texto no `GITHUB_SHA`; só depois vêm `image`, `template`, `apps`, `apps-release`, `deploy` e `edge`. Com a tag já criada, `version` falha com `note-published` e nada publica | `scripts/workflows.test.ts`, a ordem e o trabalho `release`; o roteiro, passo 2 | must |
| 5 | U3 | O trabalho `release` tem `contents: write`, nem checkout nem npm, e é o único, com `apps-release`, que escreve no repositório | `scripts/workflows.test.ts`, "nenhum trabalho que instala dependências tem um token que escreve" | must |
| 6 | U3 | Nenhum workflow tem o gatilho `release` nem lê `github.event.release`; o único gatilho de Publish é `push` no `main` com o caminho da nota; o merge deste PR, que não toca a nota, não roda Publish | `scripts/workflows.test.ts`, "só o push da nota no main e o disparo manual chegam ao runner do servidor"; a lista de Actions depois do merge | must |
| 7 | U3 | Cada checkout de Publish usa `github.sha` | `scripts/workflows.test.ts`, "cada trabalho do Publish usa o commit que o gancho conferiu" | must |
| 8 | U4 | O gancho aceita push em `refs/heads/main` de um commit do `main`, também um que o espelho ainda não tinha, e o disparo manual do `main`; recusa push de outro ramo, push de tag, commit fora do `main`, `release`, `pull_request` e evento sem nome, cada um com a sua linha `refused:` | `scripts/runner-hook.test.ts` | must |
| 9 | U5 | `check-docs` verde; nenhum documento manda criar uma Release na tela; a decisão 0081 emenda a 0035 e a 0044 | `npm run docs`; leitura da revisão | must |
| 10 | todas | Depois da visita ao servidor, o roteiro de uso: `v0.24.110` no ar pelo PR da nota, em até oito minutos do merge | o roteiro, feito pelo firstmate e depois pelo fundador (L17) | should |

O critério 8 vale no servidor só depois da visita; até ela, o gancho antigo recusa o push do `main`,
e por isso nenhuma nota sai antes (a tabela de falhas). Uma Release pela tela depois da visita não é
tentada ao vivo: gastaria um nome da L17. Fica provada pelo teste do critério 8.

## A matriz de estados

Nenhuma tela do Hub. O que uma pessoa lê é o PR da nota, a execução de Publish e a página de
Releases.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| A primeira linha de `releases/note.md`, `# v<n>.<n>.<n>` | o firstmate, no PR da nota | `scripts/release-note.ts`, na CI e no trabalho `version` |
| O texto da nota, as linhas depois da primeira | o firstmate | `release-note.ts`, que o grava num arquivo; o trabalho `release`, como corpo da Release |
| `needs.version.outputs.version` | o trabalho `version` | `release`, `image`, `apps-release`, `deploy` |
| A tag `v<n>.<n>.<n>` no commit do merge | o trabalho `release` | `rollback.yml` (`ref: inputs.version`), `infra/releases.sh record` |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio | Uma dependência fora | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `gh release create` no trabalho `release` (a tag e a Release numa chamada) | dois merges de nota: a fila `hub-server` põe um à espera; dois PRs de nota mudam a mesma linha e dão conflito, então não entram juntos; o mesmo nome duas vezes é recusado na CI e, se chegar, `version` falha com `note-published` | a tag e a Release criadas e um trabalho seguinte vermelho: a Release fica na página sem estar no ar; rodar de novo os trabalhos que falharam, ou a nota seguinte com o próximo nome, publica o mesmo código | a API do GitHub fora: o trabalho falha antes de criar, nada se grava, roda-se de novo | o endereço da Release | 4, 5 |
| `POST /repos/…/git/refs` da prova (U1) | um segundo push recebe 422 "Reference already exists"; o firstmate apaga a tag antes de repetir | não há meio: uma chamada | a API fora: a execução falha; repete-se o push | o código da resposta e a mensagem | 1 |
| O apagamento de `refs/tags/vprova-regra` pelo firstmate, com a conta que passa pela regra | o segundo recebe 422 ou 404, e a tag já não existe | uma chamada | repete-se | a resposta da API | 1 |
| `infra/setup-runner-hook.sh` na visita ao servidor (sem mudança de comportamento) | um root por vez, sem trabalho rodando (`docs/how-to/apps-edge.md`) | o `.env` já nomeia o gancho antes do espelho: um passo falho deixa o gancho recusando tudo | sem rede, o espelho não atualiza e o gancho recusa tudo | `runner hook ready` | 8 |

O merge deste PR antes da visita: o `publish.yml` novo só roda numa nota, e este PR não traz nota;
o gancho antigo ainda aceita uma Release pela tela, sobre o `publish.yml` antigo, até a visita.
Ninguém cria uma nesse intervalo. Depois da visita, a primeira nota.

## A tabela de referência

Rótulos e pinos do estudo: `actions/runner@7e211dc6`, `googleapis/release-please-action@0b6b3fc0`,
`googleapis/release-please@ea20bc26`, `changesets/action@615034bb`, `semantic-release/github@339ebdf2`
e `semantic-release/semantic-release@bf47e7aa`, e a fonte da documentação do GitHub,
`github/docs@d7487f5d` ("docs").

| # | Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | O gatilho: a nota entra no `main` e o Publish começa | U3 | `.github/workflows/publish.yml:3-5` (`on: release: types: [published]`) | `actions/runner`, `.github/workflows/release.yml:3-7`: um arquivo de versão muda num push e o workflow de release roda. **mesma situação.** | `on: push: paths: - releaseVersion` (`release.yml:5-7`); o primeiro trabalho só roda no `main` e em ramos `releases/` (`release.yml:11`). O filtro de caminhos usa a diferença entre a ponta antiga e a nova do push (docs `data/reusables/actions/workflows/triggering-a-workflow-paths5.md:5`); com `branches`, os dois filtros valem (`triggering-a-workflow-paths1.md:11`). **documentado.** | nativo | | não precisa | |
| 2 | Achar a versão da nota e conferir o nome `v0.N.P` | U2, U3 | `publish.yml:39-46` | `actions/runner`, `release.yml:10-43`: lê a versão do arquivo e falha se já existe Release com essa tag. **mesma situação.** | Lê `releaseVersion` (`release.yml:24-30`), chama `getReleaseByTag` e falha com "Release with same tag already created" (`release.yml:31-43`). O filtro de caminhos às vezes roda sempre (docs `triggering-a-workflow-paths5.md:10-12`), então o trabalho confere por si. **lido, documentado.** | embrulhado: `scripts/release-note.ts` lê a primeira linha e aplica a regex de `publish.yml:43` | Seis casos no estudo (seção 4.3). **provado.** | não precisa | `scripts/release-note.ts` |
| 3 | Criar a tag e a Release com a nota | U3 | nenhum: a tela cria | `googleapis/release-please`, `src/github-api.ts:700-709`; `actions/runner`, `release.yml:170,192-201`. **mesma situação.** | `createRelease({tag_name, body, target_commitish: release.sha})`. `gh release create --help` (2.89.0): a tag nasce se não existe, `--target` aceita o SHA, `--notes-file` lê a nota. **provado.** O trabalho declara `contents: write` (changesets `README.md:24-28`). | nativo | | não precisa | |
| 4 | Encadear "criou a Release" e "publica" | U3 | nenhum | `release-please-action`, `README.md:281-315`; `changesets/action`, `.github/workflows/publish.yml:3-98`; `actions/runner`, `release.yml:122-124,264-265`. **mesma situação.** | Tudo numa execução, no push ao `main`, com `needs`. O que se cria com o `GITHUB_TOKEN` "will not trigger future GitHub actions workflows" (`release-please-action` `README.md:106-108`; `semantic-release/github` `README.md:66`). **lido.** | nativo | | do firstmate: um workflow só | |
| 5 | O gancho do executor no servidor | U4 | `infra/runner-job-started.sh:20-28`, `:30-37`; `scripts/runner-hook.test.ts:121-126` | nenhuma faz: peça nossa (0035, 0044, S36). Mecanismo nativo: `ACTIONS_RUNNER_HOOK_JOB_STARTED` (docs `content/actions/how-tos/manage-runners/self-hosted-runners/run-scripts.md:46,58`). | O evento visto num push é `push` (docs `reusing-workflow-configurations.md:120`). **documentado.** | remendo (herdado, 0035) | A variante com `push` só no `main` e sem `release` aceita e recusa como o critério 8 (estudo, seção 4.3). **provado.** A peça é da decisão `docs/decisions/0035-publish-through-a-runner-on-the-server.md`; a 0081 a emenda. | Fundador, 2026-11-22: `A1`, `B1` | |
| 6 | O portão do ambiente `production` | fica de fora: sem mudança | `publish.yml:155,186`; `docs/how-to/hub-server.md:23` | Nativo. `changesets/action` `publish.yml:75`. **mesma situação.** | Compara o `GITHUB_REF` (docs `deployments-and-environments.md:62`); num push, `refs/heads/main` (docs `events-that-trigger-workflows.md:844`). **documentado.** | nativo | | não precisa | |
| 7 | A regra de tags `v*` e o robô | U1 | Regra 25348345 em `refs/tags/v*` (**provado**, API só leitura); `docs/how-to/apps-edge.md:50-52` | Nativo. Quem passa: docs `data/reusables/repositories/rulesets-bypass-step.md:3-11`; "Restrict creations": `available-rules-for-rulesets.md:25-27`. `changesets/action` `publish.yml:87-92` usa um App, não o `GITHUB_TOKEN`, para passar regras de tag. **situação diferente.** | A documentação não cita o `GITHUB_TOKEN`: silêncio, não prova. **não verificado.** | nativo; aberto | O teste de plataforma de U1 (L28): `refs/tags/vprova-regra` casa com `v*` e não gasta nome da L17. | Fundador, 2026-11-22: `D1` | `.github/workflows/prova-regra-de-tag.yml`, que sai |
| 8 | O gatilho antigo `on: release` | U3, U4 | `publish.yml:3-5,25`; `github.event.release.tag_name` em `:41,63,64,149,176` | nenhuma mantém as duas entradas. | Cada execução usa o workflow do commit do evento (docs `about-triggers.md:18`); o `release` roda no commit da tag (docs `events-that-trigger-workflows.md:945`). **documentado.** | nativo: o gatilho sai | | Fundador: `B1` | |
| 9 | A conferência no PR da nota | U2 | nenhum; `ci.yml:112-175` (`check`) | `actions/runner`, `release.yml:16-43`. **situação diferente: confere depois do push.** | Nenhuma referência confere no PR; nenhuma configuração nativa expressa "o nome é versão e a tag não existe" (L20). | remendo: um script | `releases/` não casa com a regex de documentos (`ci.yml:66`), então as suítes rodam no PR da nota (estudo, 4.3). **provado.** A tag é buscada com `git ls-remote` (git 2.43.0 no laboratório; a imagem `ubuntu-24.04` traz a sua). | Fundador: `C1` | `scripts/release-note.test.ts` |
| 10 | Onde mora a nota | U2 | nenhum | `actions/runner`: arquivos fixos reescritos a cada versão (`release.yml:25,170`). **mesma situação.** | O histórico fica no Git e na página de Releases. **lido.** | nativo | Detecção por "a tag ainda não existe". **provado.** | do firstmate: arquivo fixo | `releases/note.md`, no primeiro PR de nota |
| 11 | A fila `hub-server` | fica de fora: Issue futura | `publish.yml:10-12` | `changesets/action` `publish.yml:10-13` (`queue: max`). | docs `actions-group-concurrency.md:3,15-18`. | nativo, sem mudança | actionlint 1.7.12 recusa `queue`. **provado.** | não precisa | |
| 12 | O segredo da E2B e as permissões | U3 (os testes ficam) | `publish.yml:96-97,137-150`; `scripts/workflows.test.ts:66-79` | Nativo. | Num workflow só, nada muda. | nativo | O trabalho que cria a Release não faz checkout. **provado.** | não precisa | |
| 13 | "Voltar atrás" e "Reiniciar o Hub" | fica de fora: não muda | `rollback.yml`, `restart.yml` | — | A tag continua existindo (`rollback.yml:66`). **herdado.** | nativo | | não precisa | |
| 14 | A espera da L17 | U5 (o texto) | `docs/guides/delivery.md:103-113` | regra nossa. | O PR da nota roda as suítes sobre o merge com a ponta do `main` (`ci.yml:28-32,66`). **herdado.** | nativo: a CI de hoje, sem mudança | | não precisa | |

**A medida do transplante.** Nenhuma parte trazida.

**A dívida.** Nenhuma. As duas linhas de remendo, 5 (o gancho, que `docs/reference/boundaries.md`
ainda não tem) e 9 (a conferência da nota), entram em `boundaries.md` no fechamento (L19).

## As decisões do firstmate

| # | Decisão reversível (delivery L6) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | Um workflow só, `version` e `release` na frente de Publish, sem `workflow_call` | É a forma das três referências (linha 4); sem repasse de segredo nem teto de permissões (estudo, 4.4) | reverter o PR |
| 2 | A nota é um arquivo fixo, `releases/note.md`, reescrito a cada versão, com a versão na primeira linha | A forma de `actions/runner` (linha 10); não acumula um arquivo por versão (L21); dois PRs de nota dão conflito, o que os põe em fila (estudo, 4.5) | trocar por um arquivo por versão, no script e no filtro de caminhos |
| 3 | A conferência da nota fica no trabalho `check` da CI, não no `processo` | Um nome errado é código quebrado, e o `processo` guarda só os portões de L5, L6 e L20 (L15); pô-la no `processo` mudaria a L15 também | mover o passo |
| 4 | Um dono para o formato do nome, `scripts/release-note.ts`, que a CI e o trabalho `version` chamam; a regex de `publish.yml:43` sai | C26: um fato, um dono | voltar a regex ao workflow |
| 5 | A conferência "o commit está no `main`" do trabalho `image` (`publish.yml:47-50`) sai, com o `fetch-depth: 0` dele | O gatilho só roda num push do `main` e o gancho confere o commit no servidor; a 0081 emenda a frase da 0044 | devolver o passo |

## U1 A prova da regra de tags

**Base e modelo.** A ponta deste ramo. Sonnet: um workflow de um passo.

### As linhas da tabela

Linha 7. Ler `docs/how-to/apps-edge.md:50-52` e a regra pela API (`gh api repos/developmentconexus-ops/conexus/rulesets/25348345`, só leitura).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `.github/workflows/prova-regra-de-tag.yml` | Cria, e apaga no commit seguinte | o GitHub, no push do ramo |

### Os contratos que a unidade cria

Nenhum que fique.

### As skills e a leitura

Nenhuma linha de `docs/reference/stack.md` cobre GitHub Actions; a fonte é a documentação do GitHub no commit do estudo.

### A ordem do trabalho

1. **O workflow.** Critérios: 1.
   - **Arquivos:** cria `.github/workflows/prova-regra-de-tag.yml`: `on: push: branches: [feat/conexus-release-pelo-merge-cartao]`, `permissions: {}` no topo, um trabalho em `ubuntu-24.04` com `contents: write`, sem checkout, um passo que roda `gh api --method POST repos/$GITHUB_REPOSITORY/git/refs -f ref=refs/tags/vprova-regra -f sha="$GITHUB_SHA"` com `GH_TOKEN: ${{ github.token }}` e imprime o código e a mensagem, sem falhar o trabalho por 422.
   - **Pronto quando:** a execução no push mostra 201 ou 422. Com 422, o status `needs-decision` pede ao fundador que faça a `D1`, e o passo roda de novo depois.
2. **A tag sai e o workflow sai.** Critérios: 1.
   - O firstmate apaga `refs/tags/vprova-regra` com a conta que passa pela regra (`current_user_can_bypass: always`); um commit apaga o workflow. O log vai num comentário do PR.

### Parar se

A resposta não for 201 nem 422 de regra, ou for 422 depois da `D1`: o motivo vai ao firstmate.

## U2 A nota

**Base e modelo.** U1. Sonnet.

### As linhas da tabela

Linhas 2, 9 e 10. Seguir `actions/runner` `release.yml:24-43` (ler a versão do arquivo, recusar a que já tem Release). A regex é a de `publish.yml:43`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `scripts/release-note.ts` | Cria | `ci.yml` (`check`), `publish.yml` (`version`) |
| `scripts/release-note.test.ts` | Cria | `npm run test:scripts` |
| `.github/workflows/ci.yml` | Muda | — |
| `package.json` | Muda: o script `release-note` | `ci.yml` |

### Os contratos que a unidade cria

- `node scripts/release-note.ts check --base <ref>`: sem `releases/note.md` no diff `<ref>...HEAD`, imprime `release-note: no note in this change` e sai 0. Com ela, sai 1 com uma linha `<código>: <detalhe>`, códigos `note-version`, `note-published`, `note-not-alone`, `note-empty`; senão imprime a versão e sai 0.
- `node scripts/release-note.ts publish <arquivo>`: lê a nota em `HEAD`, aplica `note-version`, `note-empty` e `note-published`, grava o texto em `<arquivo>` e imprime `version=<v>` para `$GITHUB_OUTPUT`.
- A tag existe quando `git ls-remote --exit-code --tags origin refs/tags/<v>` acha a referência. Só módulos do Node: o trabalho `version` não faz `npm ci`.
- O dono do formato do nome é este arquivo (C26).

### A ordem do trabalho

1. **O script e o teste.** Critérios: 2, 3.
   - **Testes:** `scripts/release-note.test.ts`, pela porta do processo (`spawnSync`), num repositório temporário com um `origin` nu que tem a tag `v0.1.0`, como `scripts/runner-hook.test.ts:22-48` monta o seu: um caso por critério e por recusa.
   - **Mutações à mão:** trocar a regex por `^v` deixa vermelho o caso `note-version`; tirar a busca da tag, o caso `note-published`.
2. **O passo da CI.** Critérios: 2, 3.
   - **Arquivos:** em `ci.yml`, trabalho `check`, depois de `npm run docs`: `- name: The release note names a new version and comes alone`, `if: github.event_name == 'pull_request'`, `env: BASE_REF`, `run: npm run release-note -- check --base "origin/$BASE_REF"`.
   - **Pronto quando:** a CI deste PR passa com "no note in this change".

### Parar se

O `check` não tiver as tags do `origin` no checkout: a busca usa `ls-remote`, então isso só para se a rede do executor recusar o GitHub.

## U3 O Publish no push da nota

**Base e modelo.** U2. Sonnet.

### As linhas da tabela

Linhas 1, 2, 3, 4, 8 e 12. Seguir `actions/runner` `release.yml:3-11,122-124,170,192-201` e `release-please` `src/github-api.ts:700-709`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `.github/workflows/publish.yml` | Muda | o GitHub |
| `scripts/workflows.test.ts` | Muda | `npm run test:scripts` |

### Os contratos que a unidade cria

Os trabalhos `version` (saída `version`) e `release`, e o gatilho `on: push: branches: [main], paths: [releases/note.md]`.

### A ordem do trabalho

1. **O que sai.** Critérios: 6.
   - `on: release`, o `if: !github.event.release.prerelease` (`:25`), o passo `:39-50` e o `fetch-depth: 0` de `image`, e os usos de `github.event.release.tag_name` (`:41,63,64,149,176`).
2. **O que entra.** Critérios: 4, 5, 7.
   - `version`, em `ubuntu-24.04`, `contents: read`: checkout de `github.sha` sem credenciais, `actions/setup-node` com `.nvmrc`, `node scripts/release-note.ts publish note.md >> "$GITHUB_OUTPUT"`, e `actions/upload-artifact` de `note.md`, como `apps` faz (`publish.yml:129-135`).
   - `release`, `needs: version`, `contents: write`, sem checkout: `actions/download-artifact`, depois `gh release create "$VERSION" --target "$GITHUB_SHA" --title "$VERSION" --notes-file note.md --repo "$GITHUB_REPOSITORY"`.
   - `image` passa a `needs: release`; os outros leem `needs.version.outputs.version` no lugar da tag (um trabalho que lê precisa de `version` no seu `needs`).
   - **Testes:** em `scripts/workflows.test.ts`, os testes de `:54`, `:59`, `:87`, `:95` e `:190` reescritos para a porta nova; o de `:190` passa a exigir que `push` traga `branches: [main]`. Nenhum some.
   - **Pronto quando:** `test:scripts`, actionlint e zizmor verdes.

### Parar se

O zizmor achar algo que não seja o `self-repository` já ignorado.

## U4 O gancho do servidor

**Base e modelo.** A ponta deste ramo. Sonnet.

### As linhas da tabela

Linhas 5 e 8. A variante do estudo, seção 4.3.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `infra/runner-job-started.sh` | Muda | o runner do servidor, por `infra/setup-runner-hook.sh` |
| `infra/setup-runner-hook.sh` | Muda: só o comentário | o firstmate, como root |
| `scripts/runner-hook.test.ts` | Muda | `npm run test:scripts` |

### A ordem do trabalho

1. **O gancho.** Critérios: 8.
   - **O que sai:** o caso `release) ;;` (`:24`).
   - **O que entra:** um caso `push)` que recusa `refused: a push to <ref> is not main` fora de `refs/heads/main`; o resto do arquivo fica. Os comentários de `runner-job-started.sh:2-10` e `setup-runner-hook.sh:1-6` dizem "a push or a manual run of main".
   - **Testes:** os quatro casos com `release` passam a `push` em `refs/heads/main`; "um push é recusado, mesmo em main" vira "um Release é recusado"; casos novos: push de outro ramo e push de tag.
   - **Mutações à mão:** tirar a conferência do ramo no caso `push` deixa vermelho o caso de outro ramo.

### Parar se

Nada: a variante já rodou no estudo.

## U5 Os documentos da porta nova

**Base e modelo.** U3 e U4. Sonnet.

### As linhas da tabela

Linhas 8 e 14.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `docs/guides/delivery.md` | Muda a L17 só com a E1; com a E3 o texto vai no PR de método, e com a E2 num depois | — |
| `docs/decisions/0081-publish-on-the-merge-of-a-release-note.md` | Cria | `docs/index.md` |
| `docs/decisions/0035-publish-through-a-runner-on-the-server.md`, `docs/decisions/0044-release-image-built-on-a-github-hosted-machine.md` | Muda: a linha State, "Amended by [0081]" | — |
| `docs/architecture.md`, `docs/how-to/hub-server.md`, `docs/how-to/apps-edge.md`, `docs/index.md` | Muda | — |

### A ordem do trabalho

1. **Os textos.** Critérios: 9.
   - A L17 (no PR de método com a E3, aqui só com a E1): "Publishing is the merge of a pull request that changes only `releases/note.md`, whose first line names the version; Publish then creates the tag and the Release with the note on the merge commit and puts it live, in one run." A espera e os nomes ficam; o colchete diz "CI for the names and the note alone".
   - A 0081, até 350 palavras: o push no `main` que muda a nota publica; a Release pela tela não; o gancho aceita push e disparo manual do `main`; a prova de U1 é o seu critério; base: as três referências e "`A1 B1 C1 D1`".
   - `architecture.md:164`, `hub-server.md:71-73`, `apps-edge.md:38,55,62,66-70`: a porta nova e `--event push` no passo 5.
   - **Pronto quando:** `npm run docs` verde.

## G1 O ponto de conferência

Antes do pull request: `npm run test:scripts`, `npm run lint`, `npm run docs`, actionlint e zizmor
pelas imagens de `ci.yml`, e o gancho rodado à mão nos sete casos do critério 8. Nada roda no
servidor de produção: a visita é do firstmate com o fundador, depois do merge, com
`infra/setup-runner-hook.sh` como root de um checkout do `main` e o passo 6 de
`docs/how-to/apps-edge.md` dizendo `refused` a um `release`.
