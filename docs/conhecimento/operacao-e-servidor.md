# Operação e servidor

O servidor do Hub, a publicação de uma versão, as migrações, o CI e o acesso ao servidor. Como
operar está em [hub-server](../how-to/hub-server.md) e em [ci-health](../how-to/ci-health.md).

## Decidido

- [0007](../decisions/0007-one-server-compose-tunnel.md): um servidor em São Paulo, com Compose e o Tunnel. [0025](../decisions/0025-published-apps-stop-with-server.md): os apps publicados param com o
  servidor.
- [0026](../decisions/0026-release-and-publish-one-act.md), [0035](../decisions/0035-publish-through-a-runner-on-the-server.md), [0036](../decisions/0036-runner-token-in-one-call-environment.md), [0042](../decisions/0042-cloudflare-token-in-one-call-environment.md) e [0044](../decisions/0044-release-image-built-on-a-github-hosted-machine.md): Release e Publish num ato só, pelo executor no servidor, com os
  tokens no ambiente de uma chamada e a imagem feita numa máquina do GitHub.
- [0037](../decisions/0037-postgresql-18-and-drizzle-1-for-the-hub-database.md): PostgreSQL 18 e Drizzle 1.0 no banco do Hub.
- [0081](../decisions/0081-publish-on-the-merge-of-a-release-note.md), proposto em 2026-11-22: publicar pelo merge de uma nota de versão. Aprovação:
  [publicar-pelo-merge-da-nota](../approvals/publicar-pelo-merge-da-nota.md).

## Provado

| O que | O número | Estudo |
| --- | --- | --- |
| O tempo fora do ar numa atualização | de 6 a 17 s, medido em dez publicações | `conexus-e16-card` |
| A cópia de segurança do Hub | o `pg_dump` dos dois bancos, restaurado noutro PostgreSQL 18, volta com as 90 migrações | `conexus-e22-card` |
| PRs vermelhos | caíram de 43% para 23%; dos 46 vermelhos, 35% só esperavam o fundador e 28% o `npm run check` pegaria em 3 minutos | `conexus-ci-saudavel-estudo` |
| O teste de teclado que falhava | corrida de um quadro no próprio teste; 3 linhas levaram a falha de até 37 para 0 em 100 | `conexus-web-teclado-diag` |
| O erro de migração escondido | o Postgres manda `25P04`, mas o rollback do Drizzle esconde o erro | `conexus-deploy-migrate-deepen` |
| A porta sem SSH | o executor do GitHub no servidor rodou 8 vezes pelo workflow do laboratório | `conexus-servidor-acesso-estudo` |

## Lido

- `actions/runner`, release-please e changesets: publicar pelo merge de um PR da nota
  (`conexus-release-pelo-merge`).
- Neon contra Aurora DSQL: o Neon é de 2 a 16 vezes mais barato com até 15 empresas
  (`conexus-arquitetura-cloud`).

## Aberto

- O Hub novo não sobe sem as variáveis da AWS no ambiente do servidor (`conexus-hub-env-aws`, em
  curso).
- As etapas 16 (atualizar sem cair) e 22 (cópia e restauração do Hub) têm cartão sem aprovação.
- O cartão de visita ao servidor sem SSH foi cancelado pelo fundador.

## Estudos de origem

Uma linha por estudo, da data mais nova para a mais velha. "Virou" é o registro, a aprovação, o cartão ou o PR em que o estudo deu.

| Data | Estudo | Estado | Virou | Em uma frase |
| --- | --- | --- | --- | --- |
| 2026-11-23 | `conexus-hub-env-aws` | em curso | - | A primeira publicação pela nota parou: o Hub novo não sobe sem as variáveis da AWS no ambiente do servidor; um script de laboratório as preenche fora do Git. |
| 2026-11-23 | `conexus-cartao-visita-sem-ssh` | superado, por cancelado pelo fundador | - | Cancelado pelo fundador antes de qualquer resultado, por não ter relação com o desenvolvimento do produto. |
| 2026-11-22 | `conexus-servidor-acesso-estudo` | aberto | - | A porta sem SSH já existe: o executor do GitHub no servidor rodou 8 vezes pelo lab.yml, e seu usuário está no grupo docker; propõe um cartão de visita. |
| 2026-11-22 | `conexus-release-pelo-merge-cartao` | decidido | [publicar-pelo-merge-da-nota](../approvals/publicar-pelo-merge-da-nota.md); PR 1228 | Cartão curto com cinco unidades e dez critérios: prova da tag pelo GITHUB_TOKEN, conferência da nota, Publish no push, gancho que aceita push e recusa Release, decisão [0081](../decisions/0081-publish-on-the-merge-of-a-release-note.md). |
| 2026-11-22 | `conexus-release-pelo-merge` | decidido | [0081](../decisions/0081-publish-on-the-merge-of-a-release-note.md); [publicar-pelo-merge-da-nota](../approvals/publicar-pelo-merge-da-nota.md) | Publicar pelo merge de um PR da nota, num workflow só como actions/runner, release-please e changesets; o gancho do servidor recusava todo push e precisava mudar. |
| 2026-11-19 | `conexus-web-teclado-diag` | decidido | PR 1205 | A falha do teste de teclado é corrida de um quadro no próprio teste, não do produto; 3 linhas levam a falha de até 37 para 0 em 100. |
| 2026-11-19 | `conexus-arquitetura-cloud` | decidido | [0075](../decisions/0075-how-the-hub-reaches-aws.md); [0079](../decisions/0079-the-agent-reads-the-lake-neon-serves-apps.md) | O banco de cada empresa fica na Neon, de 2 a 16 vezes mais barata com até 15 empresas; DSQL não serve; o Hub fica. |
| 2026-11-17 | `conexus-ci-saudavel-estudo` | decidido | [metodo](../approvals/metodo.md) (2026-11-17) | PRs vermelhos caíram de 43% para 23%; dos 46 vermelhos, 35% só esperavam o fundador e 28% o npm run check pegaria em 3 minutos. |
| 2026-11-14 | `conexus-test-ci-strategy-study` | decidido | [metodo](../approvals/metodo.md) (2026-11-14) | 43% das execuções de PR terminaram vermelhas; um quarto dos jobs vermelhos é regra de processo; 186 execuções só passaram ao rodar de novo, por testes de relógio. |
| 2026-11-09 | `conexus-e22-card` | aberto | - | Uma cópia por pg_dump dos dois bancos do Hub, restaurada noutro PostgreSQL 18, volta com as 90 migrações; o Neon não restaura vários projetos no mesmo instante. |
| 2026-11-09 | `conexus-e16-card` | aberto | - | Etapa 16: o teste 9 já passa e o 10 passa pela metade; uma atualização deixa o Conexus fora do ar de 6 a 17 s, medido em dez publicações. |
| 2026-10-22 | `conexus-deploy-migrate-deepen` | decidido | data D25; apps/server/src/platform/migrate.ts | O Postgres manda 25P04 e o pg o recebe, mas o rollback do Drizzle esconde o erro; o Neon manda repetir quando reinicia; a forma C se mantém. |
