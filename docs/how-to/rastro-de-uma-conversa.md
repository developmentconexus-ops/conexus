# Ler o rastro de uma conversa

Como ver, no banco do Mastra, cada passo de uma conversa do Hub: as chamadas ao modelo, as
ferramentas, a conta que atendeu e o erro do provedor, quando houver. Decisão:
[0068](../decisions/0068-mastra-tracing-in-its-own-database.md).

## O que você precisa

O id da conversa: o trecho final do endereço dela no Hub, por exemplo `a1b2c3d4-…`.

## Abrir o SQL Editor

1. No Neon, abra o projeto do Hub e, nele, o banco do Mastra (não o do Hub).
2. No menu lateral, clique em **SQL Editor**.
3. Cole a consulta abaixo, troque `<id-da-conversa>` pelo id copiado e clique em **Run**.

```sql
SELECT
  "startedAt",
  "spanType",
  "name",
  "model",
  "metadataRaw"->>'accountKind'                                     AS conta,
  ROUND(EXTRACT(EPOCH FROM ("endedAt" - "startedAt")) * 1000)::int AS ms,
  ("attributes"->'usage'->>'inputTokens')::int                      AS tokens_entrada,
  ("attributes"->'usage'->>'outputTokens')::int                     AS tokens_saida,
  "error"->'details'->>'statusCode'                                 AS erro_status,
  "error"->'details'->'responseBody'->'error'->>'message'           AS erro_motivo,
  left("inputPreview", 200)                                         AS entrada,
  left("outputPreview", 200)                                        AS saida
FROM mastra.mastra_span_events
WHERE "traceId" IN (
    SELECT "traceId" FROM mastra.mastra_span_events WHERE "threadId" = '<id-da-conversa>'
  )
  AND NOT "isPending"
ORDER BY "startedAt"
```

Cada linha é um passo, em ordem. `model_step` é uma chamada ao modelo, com os tokens dela;
`tool_call` é uma ferramenta; `conta` aparece na linha `conexus-account-pick` e diz qual conta
atendeu (`api_key` ou a assinatura). Quando o provedor recusou, `erro_status` traz o número, por
exemplo `400`, e `erro_motivo` o texto que ele mandou.

Para ver tudo o que uma linha guarda (o pedido inteiro, a resposta, o corpo do erro), troque a
lista de colunas por `*` e clique na célula.

## As conversas de uma empresa

O id da empresa é o trecho depois de `/companies/` no endereço do Hub.

```sql
SELECT "threadId", min("startedAt") AS inicio, count(*) AS passos,
       count(*) FILTER (WHERE "error" IS NOT NULL) AS com_erro
FROM mastra.mastra_span_events
WHERE "resourceId" LIKE '%company:<id-da-empresa>:%' AND NOT "isPending"
GROUP BY "threadId"
ORDER BY inicio DESC
LIMIT 50
```

## Notas

- O rastro guarda o que a pessoa escreveu e o que o modelo leu das ligações. Não copie esses
  valores para fora do banco.
- O Mastra apaga, todo dia às 03:30, os rastros com mais de 14 dias.
- Um turno em andamento aparece com as linhas já terminadas; as outras chegam em até 5 segundos
  depois de cada passo.
