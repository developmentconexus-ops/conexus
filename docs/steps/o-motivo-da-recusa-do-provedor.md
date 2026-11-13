# O motivo da recusa do provedor

Trilho: servidor

Cartão curto, fora da ordem do roteiro. O pedido do fundador, em 2026-11-13: "3. Aprovado", sobre o
relatório que achou por que um 400 da Anthropic por saldo acabado termina o turno com "O modelo não
respondeu" em vez de passar para a próxima conta. Lido em `main` `f01afd98`, com `@mastra/core`
1.82.0. Referências: Mastra `6e8dfcb8` (`mastra-1.82`, com o Factory em `mastracode/`). Isto não é a
causa do 400 que o fundador vê hoje; essa causa segue em outra investigação. Esta correção faz toda
recusa do provedor ficar visível e deixa a recusa por saldo ou limite cair na próxima conta.

## A página do fundador

**No fim desta etapa** uma conta de API da Anthropic sem saldo, ou no limite de gasto do workspace,
deixa de derrubar a conversa: a conta fica "no limite" por 6 horas, a próxima conta (a assinatura,
por exemplo) responde no mesmo turno e a pessoa lê o aviso de troca de conta. E, quando um turno
falha por recusa do provedor, o registro do servidor diz de que tipo foi (saldo, formato, contexto
grande…) e traz o número do pedido para o suporte da Anthropic, nunca a frase do provedor.

**Exemplo (inventado).** Ana pede algo ao Assistente. A chave de API da empresa está sem saldo e a
Anthropic responde 400. Antes: "O modelo não respondeu". Depois: "Time 1 no limite até 20h10;
continuei pela Assinatura." e a resposta chega.

**O roteiro de uso.** Com a conta de API sem saldo e a assinatura ligada, peça algo ao Assistente: a
resposta vem da assinatura e a lista de contas mostra a primeira no limite.

**O que você faz, e quando.** No começo: aprova esta página. No fim: faz o roteiro, se tiver uma
conta sem saldo à mão.

**Fica de fora.** Reparar conversas guardadas, betas, cache, o rastreamento e a causa do 400 de hoje.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 O 400 lido pelo Mastra | depois das regras por status, um 400 vira limite (saldo, 6 h; limite de taxa, 15 min), recusa (credencial) ou segue desconhecido; o tipo e o id do pedido vão ao registro | `apps/server/src/builder/model-accounts/`, `builder/mastra/logger.ts`, `platform/test-anthropic.ts` | [testing](../guides/testing.md), [security](../guides/security.md) | nada |

**Orçamento de código alterado:** cerca de 30 linhas; o resto são testes.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Um 400 com a frase de saldo ou a de limite de gasto da Anthropic dá limite de 6 h; um 400 de formato segue desconhecido | `model-accounts/errors.test.ts` | must |
| 2 | U1 | No turno, a conta de API responde 400 de saldo, a próxima responde texto: o turno completa, o aviso de troca aparece, a conta fica no limite por 6 h e o registro traz `kind: quota` sem a frase do provedor | `model-accounts/queue.test.ts`, "400 de saldo" | must |
| 3 | U1 | Um 400 de formato termina o turno como `MODEL_CALL_FAILED`, sem troca, com `kind: invalid_request` no registro e sem o texto do provedor | `model-accounts/queue.test.ts`, "400 de formato" | must |

## A matriz de estados

Nenhuma tela nova nem texto novo: o aviso de troca e o estado "no limite" são os que o 429 e o 402
já mostram.

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ler o 400 | U1 | `errors.ts` `callFailureOf` decide só pelo status; todo 400 é `unknown` | Mastra `packages/core/src/error/provider-error.ts:26-27,165-166` (`classifyProviderError`, "Anthropic reports an exhausted credit balance as a 400"), teste `provider-error.test.ts:131-132` | classifica o erro pelo status, pelos códigos e pela frase, num valor de lista fechada | nativo (`@mastra/core/error`, sem copiar os padrões, C75) | — | "3. Aprovado" | `model-accounts/errors.test.ts` |
| O motivo na tela do Factory | U1 | nenhum | Factory `mastracode/factory/src/run-error.ts:35-46` | `quota` vira "Provider quota exhausted", com a saída "use another credential or model" | nativo (a mesma classificação; o Hub troca de conta em vez de pedir ao usuário) | — | "3. Aprovado" | — |
| O tipo e o id no registro | U1 | `processors.ts` `afterFailure` e `mastra/logger.ts` `fieldsOf` guardam só o tipo de falha da fila | `providerRequestId` em `@mastra/core/error` | o id do pedido que o provedor devolveu | nativo (S41: só valor fechado e id, nunca o texto) | — | "3. Aprovado" | — |
| O dublê com mensagem | U1 | `platform/test-anthropic.ts` responde a recusa com texto fixo | corpo de erro documentado da Messages API | `{ type: 'error', error: { type, message } }` | nativo (o corpo que o SDK lê) | — | — | — |

**A medida do transplante.** Nada vem do repositório antigo.

## U1 O 400 lido pelo Mastra

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `model-accounts/errors.ts` | muda: o 400 passa por `classifyProviderError` | `processors.ts`, `side-calls.ts` |
| `model-accounts/processors.ts` | muda: `kind` e `requestId` em `MODEL_CALL_FAILED` e `MODEL_CALL_REFUSED`; o comentário da fila | — |
| `mastra/logger.ts` | muda: `fieldsOf` soma `kind` e `requestId` | `BuilderLogger` |
| `platform/test-anthropic.ts` | muda: a recusa aceita `message` | os testes de turno |

### Parar se

- Outro teste de recusa muda de resultado por causa da leitura do 400.
