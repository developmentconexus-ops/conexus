# Credenciais

O login de cada sistema ligado, o selo que guarda a credencial, a renovação, a revogação e como a
credencial chega à tarefa de cópia. As regras de segredo estão no guia [security](../guides/security.md);
a troca das chaves do selo, em [seal keys](../how-to/seal-keys.md).

## Decidido

- [0057](../decisions/0057-connections-by-oauth.md), proposto em 2026-10-30: a ligação por OAuth, com uma linha de autorização, a renovação sob
  lease e o app de login num lugar só.
- [0069](../decisions/0069-connectors-one-source-the-kit.md): o login, a guarda do token e a renovação ficam no kit, com o nosso app de login em cada
  sistema.
- [0077](../decisions/0077-how-a-credential-reaches-the-copy-task.md), aceito para a classe compartilhável e proposto para a exclusiva: o Hub grava a credencial da
  rodada num parâmetro cifrado, um por rodada, apagado a cada fim. Quem renova depende do que a
  renovação mata, uma classe que o kit declara por conector. Uma credencial é exclusiva até uma
  medida provar o contrário.
- [0043](../decisions/0043-app-logins-derived-from-one-key.md): os logins dos apps derivam de uma chave. Substituiu a [0022](../decisions/0022-app-logins-as-dispatcher-secrets.md).
- [0049](../decisions/0049-model-accounts-keys-sign-ins-queues.md), aceito em 2026-10-19, e [0060](../decisions/0060-openai-subscription-sign-in.md), aceito em 2026-11-05: as contas de modelo, por chave de
  qualquer provedor ou por assinatura.

## Provado

| O que | O número | Estudo |
| --- | --- | --- |
| Dois logins do mesmo usuário de integração do Sankhya | convivem; o Sankhya serializa por token, não por usuário; o logout de um não derruba o outro; o token vale 300 s | `conexus-v17-sonda` |
| De onde veio a renovação presa ao Hub | do Mercado Livre, cuja renovação serve uma vez; no Sankhya, dois logins convivem | `conexus-copia-nativa-causa-raiz` |
| O OAuth escrito à mão no kit | cerca de 100 linhas, campo por campo iguais às da `oauth4webapi`; trocar daria de 0 a 20 linhas | `conexus-credenciais-framework` |
| As sessões do Sankhya | cada `/authenticate` abre uma sessão nova; o logout só funciona com o token vivo | `conexus-sankhya-sessions` |

## Lido

- Nango: o grátis é "for hobby projects", só login e proxy; o produto inteiro nos nossos servidores é
  o plano Enterprise, pago por ano. n8n proíbe recolher credenciais dos clientes; Pipedream proíbe uso
  comercial. Composio, Mastra Connect (sobre a Nango) e Paragon são serviços, e os tokens ficariam
  com eles. Activepieces e Airbyte prendem a parte que importa a uma plataforma paga. Supaglue,
  Revert e Panora pararam. Cinco de seis referências construíram a sua, a Nekt entre elas
  (`conexus-credenciais-framework`, 2026-11-20).
- `oauth4webapi` serve como conferência num teste, não em produção (o mesmo estudo).

## Superado

- A renovação só pelo Hub em todo conector: a [0077](../decisions/0077-how-a-credential-reaches-the-copy-task.md) separou as classes compartilhável e exclusiva.
- O catálogo alugado, que guardaria a chave no fornecedor (`conexus-connector-architecture-study`):
  caiu com a [0069](../decisions/0069-connectors-one-source-the-kit.md).

## Aberto

- Por onde a tarefa pede ao Hub a credencial exclusiva: chega no estudo da etapa 5 do lago.
- A ligação por pessoa, cada funcionário com o próprio Gmail ligado ao agente: chega no estudo da
  etapa do Google.

## Estudos de origem

Uma linha por estudo, da data mais nova para a mais velha. "Virou" é o registro, a aprovação, o cartão ou o PR em que o estudo deu.

| Data | Estudo | Estado | Virou | Em uma frase |
| --- | --- | --- | --- | --- |
| 2026-11-20 | `conexus-credenciais-framework` | decidido | [0071](../decisions/0071-connectors-kit-live-copies-singer.md); [0077](../decisions/0077-how-a-credential-reaches-the-copy-task.md) | Nenhum framework aberto e livre faz a portaria de credenciais; o kit já é cofre e renovação, e o tap do Meltano sai do kit por um adaptador único. |
| 2026-11-20 | `conexus-copia-nativa-causa-raiz` | decidido | [0076](../decisions/0076-a-copy-runs-as-a-fargate-task-ending-by-a-queue.md); [0077](../decisions/0077-how-a-credential-reaches-the-copy-task.md) | A renovação presa ao Hub nasceu do Mercado Livre, cuja renovação serve uma vez; no Sankhya dois logins convivem (medido), então a tarefa recebe a credencial e renova sozinha. |
| 2026-11-19 | `conexus-v17-sonda` | decidido | [0077](../decisions/0077-how-a-credential-reaches-the-copy-task.md) | Dois logins do mesmo usuário de integração convivem; o Sankhya serializa por token, não por usuário; o logout de um não derruba o outro, e o token vale 300 s. |
| 2026-10-30 | `conexus-sankhya-sessions` | decidido | [e20-app-com-dados](../approvals/e20-app-com-dados.md) | Cada /authenticate abre uma sessão nova e o logout só funciona com o token vivo; o Conexus deixava uma sessão pendurada por Testar e precisava de cache e logout. |
