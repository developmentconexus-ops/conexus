# Prévia e apps

A Prévia que o Builder mostra, o app publicado, o endereço, o cookie e o login dentro do app. O
desenho está em [app](../explanation/app-package.md), [contrato](../explanation/app-contract-and-dispatcher.md)
e [Hub e apps](../explanation/hub-apps.md).

## Decidido

- [0018](../decisions/0018-apps-on-workers-for-platforms.md): os apps rodam no Cloudflare Workers for Platforms. [0019](../decisions/0019-handler-contract.md) e [0055](../decisions/0055-apps-on-the-platform-contract.md): o contrato do app.
- [0021](../decisions/0021-one-neon-project-per-company.md), [0040](../decisions/0040-company-database-through-neon.md) e [0048](../decisions/0048-company-neon-project-named-by-nickname-and-id.md): um projeto Neon por empresa, um esquema e um login por app. A [0079](../decisions/0079-the-agent-reads-the-lake-neon-serves-apps.md) mantém o Neon
  da empresa para servir os apps.
- [0023](../decisions/0023-second-domain-for-apps.md) e [0024](../decisions/0024-app-address-one-host-per-app.md): um segundo domínio para os apps, um host por app.
- [0041](../decisions/0041-app-session-check-through-workers-vpc.md): a sessão do app é conferida no Hub pelo Workers VPC.
- [0045](../decisions/0045-app-reads-by-query-writes-by-one-batch.md), que substituiu a [0020](../decisions/0020-one-statement-one-transaction.md): a consulta do app só lê; as escritas vão num lote.
- [0046](../decisions/0046-version-worker-first-migrations-in-one-transaction.md) e [0047](../decisions/0047-one-call-limits-in-the-dispatcher.md): o Worker da versão antes das migrações; os limites de uma chamada no dispatcher.
- Aprovação: [a-previa-em-endereco-proprio](../approvals/a-previa-em-endereco-proprio.md), com o
  endereço `--previa` no mesmo domínio.

## Provado

| O que | O número | Estudo |
| --- | --- | --- |
| O laço de redirecionamento do app | os redirecionamentos seguiam o OAuth padrão; o erro era o cookie particionado na aba, herdado da Prévia e do publicado num host só | `conexus-app-auth-desenho` |
| O app que pergunta ao Sankhya a cada clique | 10 s por resposta | `conexus-capabilities-study` |

## Lido

- oauth2-proxy, Supabase, Pomerium e vibesdk: o login dentro do app (`conexus-app-auth-desenho`).
- Cloudflare Workers previews e vibesdk: Prévia e publicado em hosts diferentes, cada um com cookie
  de forma fixa (`conexus-previa-estudo`).
- Databricks Apps (`databricks/appkit@52ba630`, 0.96.0): hospeda o app num contêiner com identidade
  própria e não tem construtor (`conexus-databricks-apps-rd`).

## Superado

- A Capacidade 1 (o banco do app) e o pedido de copiar dados do ERP por app: a cópia passou a ser da
  empresa, e depois do lago ([0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md)).

## Aberto

- O app lê o que foi publicado no lago: etapa 4 da [Trilha Dados](../steps/trilhas/dados.md).

## Estudos de origem

Uma linha por estudo, da data mais nova para a mais velha. "Virou" é o registro, a aprovação, o cartão ou o PR em que o estudo deu.

| Data | Estudo | Estado | Virou | Em uma frase |
| --- | --- | --- | --- | --- |
| 2026-11-22 | `conexus-previa-cartao` | decidido | [a-previa-em-endereco-proprio](../approvals/a-previa-em-endereco-proprio.md); PR 1229 | Cartão da Prévia com a marca --previa no mesmo domínio: 4 unidades em 2 PRs e 21 critérios, dizendo o que fica dos PRs 1211, 1213, 1214 e da S24. |
| 2026-11-21 | `conexus-previa-estudo` | decidido | [a-previa-em-endereco-proprio](../approvals/a-previa-em-endereco-proprio.md) | Prévia e app publicado devem morar em hosts diferentes do mesmo domínio, cada um com cookie de forma fixa; o fundador escolheu o endereço --previa ("2.a 3.b 4a 5a"). |
| 2026-11-21 | `conexus-app-auth-desenho` | decidido | PR 1213; PR 1214; [a-previa-em-endereco-proprio](../approvals/a-previa-em-endereco-proprio.md) | Os redirecionamentos seguem o OAuth padrão; o erro era o cookie particionado na aba, herdado da Prévia e do publicado num host só. |
| 2026-11-16 | `conexus-databricks-apps-rd` | aberto | - | O Databricks Apps hospeda app Node ou Python num contêiner ligado com identidade própria; não tem construtor de apps e entrega o trabalho ao agente de código. |
| 2026-11-09 | `conexus-capabilities-study` | superado, por conexus-cap2-study | [capacidade-1-o-banco-do-app](../approvals/capacidade-1-o-banco-do-app.md) | O que mais falta aos apps é copiar dados do ERP de tempos em tempos; o app hoje pergunta ao Sankhya a cada clique, com 10 s. |
