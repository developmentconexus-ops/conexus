# Cartão curto: as buscas do Sankhya

Trilho: pattern (L27). Vem do mapa de leituras do Sankhya (escolha B do fundador, 2026-11-09). Pedidos por número ficam para um segundo cartão; nenhum outro conector, nenhum Sync.

## O que a Ana recebe

Quem pergunta ao Assistente, ao Construtor ou a um agente do Projeto por "o cliente que tem Silva no nome", "os produtos 100 a 150", "o fornecedor com este CNPJ" ou "o estoque destes dez itens" recebe a resposta numa chamada só, em vez de varrer páginas. Cada busca devolve até 20 linhas em ordem de código e diz se há mais; para ver as próximas, o agente pede "depois do código tal". O nome vale sem diferença de maiúscula e sem acento ("São" acha "Sao"). Os apps da empresa usam as mesmas buscas pelo cliente tipado. Nada disso é SQL livre: a consulta de cada busca é escrita por nós, e o agente só preenche campos.

Junto vai a correção do diagnóstico de nomes: `clientes`, `produtos` e as outras leituras prontas deixam de jogar fora, sem aviso, um campo que não têm. Recusam com o nome do campo, e o texto das duas listas diz o que elas filtram de verdade e aponta a busca certa.

## A página do fundador

O que o fundador escolheu e aprovou (palavras dele, 2026-11-09):

- "Cara, é a B ... Qualquer um poderia utilizar, né? Não tem lógica paralela aí": a busca fica no conector, e o agente do Projeto, os apps e o Assistente usam a mesma.
- "Não uma tool tão simples que, por exemplo, pra ver 10 produtos ... ele teria que chamar ela 10 vezes. Eu acho isso fraco": uma chamada devolve várias linhas, com filtros combináveis.
- "Aprovo": o conjunto de quatro leituras e a correção.

Os nomes que ele vai ver no Hub, nesta ordem: **Buscar parceiros**, **Buscar produtos**, **Buscar vendedores**, **Estoque de vários produtos**. Cada busca sem filtro lista tudo em ordem de código; "ativo" sem valor traz os dois. O papel do parceiro é **cliente** ou **fornecedor** nesta etapa: transportadora e vendedor como papel esperam o nome da coluna no dicionário da empresa (ver o que não se prova aqui). Decisão aberta dele: nenhuma.

## O roteiro de uso

1. No Assistente, perguntar "qual o código do cliente que tem 'sao' no nome?": aparecem os clientes, "São" incluídos, até 20, com o código de cada um.
2. Pedir "os produtos de 100 a 150": uma resposta com os produtos da faixa, em ordem; pedir "mais": vem o resto, sem repetir nem pular um.
3. Pedir "o estoque desses dez produtos": uma resposta com o saldo de cada um por empresa e local.
4. Num agente do Projeto com a leitura de clientes marcada, pedir um cliente por nome: o agente usa Buscar parceiros e não varre a lista.
5. Pedir à ferramenta Clientes um filtro por nome: a resposta recusa e diz o campo que ela não tem.

## As unidades

| Unidade | O que entrega | Pastas | Depende de |
| --- | --- | --- | --- |
| U1 | A correção: `z.strictObject` nas 23 leituras prontas, o texto honesto de `clientes` e `produtos`, e o mesmo no embrulho `openOf` do agente do Projeto | `packages/connectors/src/sankhya/operations/`, `apps/server/src/builder/agents/tools.ts` (frontier: declarado, L27) | nada |
| U2 | As quatro buscas, o montador de SQL e o dublê que o roda, as linhas da skill | `packages/connectors/src/sankhya/` | U1 (os textos de `clientes`/`produtos` apontam para a busca) |

Estimativa: U1 cerca de 120 linhas; U2 cerca de 900, com testes.

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Entrada que recusa campo desconhecido | U1 | 23 `z.object` em `operations/*.ts`, que descartam o campo em silêncio | Zod 4.6.5: `z.strictObject` recusa e nomeia a chave; `@mastra/core` 1.82.0 descarta o campo de um `z.object` antes de executar (medido no mapa, §4) | a recusa vem da própria validação | nativo | — | "Aprovo", 2026-11-09 | — |
| Embrulho do agente do Projeto | U1 | `openOf` em `apps/server/src/builder/agents/tools.ts` reconstrói a entrada com `z.object` | o mesmo `z.strictObject` | sem ele o embrulho descarta o campo antes de a operação o ver | nativo | — | "Aprovo" | — |
| As quatro operações | U2 | `door.ts` (`consultar`, `gatewayAnswer`) e `operations/index.ts` | Mitra: uma consulta fixa por necessidade, filtros opcionais, `limit`; Pipedream `search-crm.mjs:90-100,229-237` filtra no cliente depois de ler uma página, o contra-exemplo | o filtro vai ao banco, a consulta é do conector | embrulhado | — | "Cara, é a B ... Não tem lógica paralela aí" | `operations/buscas.ts` |
| Montador de SQL e literal | U2 | `read-only-sql.ts` filtra, `door.ts:134` manda só `{ sql }` | o DbExplorer, na requisição do kit, não leva parâmetros vinculados (se leva, é não verificado) | texto do SQL constante nosso; número só inteiro; texto por uma função que recusa e escapa | remendo | Zod 4.6.5 valida inteiros e texto; Oracle 19.0.0.0.0 mediu `TRANSLATE`, `LIKE ... ESCAPE` e `OFFSET/FETCH`; a prova é a entrada hostil e a remoção (critérios 5 e 9); entra em `docs/reference/boundaries.md` no fechamento | "Aprovo" | `search.ts` |
| Dublê que roda a busca | U2 | `fake-sales.ts` (`salesDatabase`), `fake-data.ts`, `fake.ts` | Node 24 `DatabaseSync.function` registra `TRANSLATE`; o trecho `OFFSET 0 ROWS FETCH NEXT n ROWS ONLY` vira `LIMIT n` | o SQLite roda o SQL que chega | embrulhado | — | "Aprovo" | — |

O que o kit já cobre fica de fora: papéis fixos recebem toda leitura de `operations` sozinhos (`hub/identity/roles.ts:56-64`).

## A forma das buscas

Todas pela requisição do `consultar`, `class: 'read'`, `idempotent: true`, `z.strictObject`, todos os filtros opcionais e somados com E.

- `buscarParceiros`: `nome` (2 a 60 caracteres; `NOMEPARC` ou `RAZAOSOCIAL`), `documento` (11 ou 14 dígitos; `CGC_CPF`), `codigos` (1 a 100 inteiros), `deCodigo`/`ateCodigo`, `papel` (`cliente`|`fornecedor`; coluna `= 'S'`), `ativo`, `depoisDe`, `limite` (1 a 100, padrão 20). Linha: `codigoParceiro`, `nome`, `razaoSocial`, `documento`, `tipoPessoa`, `ativo`, `cliente`, `fornecedor`.
- `buscarProdutos`: `nome` (`DESCRPROD`), `referencia`, `codigos`, `deCodigo`/`ateCodigo`, `grupos` (1 a 50 códigos de grupo), `ativo`, `depoisDe`, `limite`. Linha: código, nome, referência, código e nome do grupo (junção com `TGFGRU`), unidade, marca, ativo.
- `buscarVendedores`: `nome` (`APELIDO`), `codigos`, `ativo`, `depoisDe`, `limite`. Linha: código, apelido, ativo.
- `estoqueDosProdutos`: `codigos` (obrigatório, 1 a 50), `codigoEmpresa`, `codigoLocal`. Linha de `TGFEST`: produto, empresa, local, controle, tipo, parceiro, estoque, reservado, disponível (a diferença, feita no banco). Sem cursor: a lista de códigos é o recorte; até 200 linhas por chamada, com `temMais`.

Regras do molde: ordem sempre por código; o cursor é o último código lido, para resistir ao corte de 20 linhas que o modelo vê; o SQL pede uma linha numerada a mais e marca nela `EXTRA`, e a resposta a descarta e diz `temMais`. O nome é dobrado igual nos dois lados (a mesma tabela de acentos em `TRANSLATE(UPPER(coluna), ...)` e no valor, em TypeScript). O SQL montado passa de novo por `isOneReadStatement` antes de sair. A entrada do texto recusa quebra de linha, `--`, `/*`, `*/`, `;` e o que o filtro de leitura recusaria; escapa `\`, `%` e `_` (`ESCAPE '\'`) e dobra a aspa simples.

## Os critérios de aceite

1. Buscar parceiro e produto por parte do nome, com ou sem acento e em qualquer caixa, numa chamada (dublê: "sao" acha "SÃO …").
2. Dez produtos por lista de códigos, e por faixa, numa chamada; o estoque dos dez em outra.
3. Paginar com `depoisDe` até o fim, sem perder nem repetir linha, também através do corte de 20 linhas do modelo, pelo `connector_read` e pela ferramenta do agente do Projeto.
4. Um campo que a leitura não tem é recusado com o nome do campo: em `clientes` e `produtos` pelo `connector_read` (`INPUT_INVALID`) e pela ferramenta do agente do Projeto; o mesmo nas quatro novas.
5. Entrada hostil (aspas, `%`, `_`, `\`, `--`, `/*`, `;`, quebra de linha, palavra de escrita no nome, `q'`) ou fora de faixa (nome de 1 ou 61 caracteres, documento de 12 dígitos, `limite` 0 ou 101, mais de 100 códigos): recusada antes de qualquer chamada, nunca vira SQL. Uma aspa simples legítima (`D'AGUA`) acha o nome.
6. Toda consulta montada passa em `isOneReadStatement`; uma consulta recusada pelo Sankhya (`status` 0) volta como `REFUSED`, nunca como lista vazia.
7. A resposta tem `temMais` verdadeiro só quando há linha depois da última devolvida, e nunca devolve a linha a mais.
8. A conformidade do kit passa com as quatro: cada uma tem sonda no dublê e uma linha na skill da sua parte; `spec.test.ts` confere só as requisições REST.
9. A remoção do montador (T12): sem a função de literal, o teste de entrada hostil falha.

## O que não se prova aqui

Nenhuma chamada ao Sankhya real. Ficam para um ensaio autorizado, só leitura e com contagens: se o DbExplorer aceita parâmetros vinculados (então o literal some); o nome das colunas de papel de transportadora e vendedor; o formato guardado em `CGC_CPF` (só dígitos?); os valores `S`/`N` das colunas de papel; se `TGFEST` tem as mesmas linhas que `estoqueDoProduto` (por isso a linha traz `tipo` e `parceiro`, e nada é filtrado); o tempo de `LIKE '%x%'`; o comportamento em SQL Server; e a janela `ROW_NUMBER()` com `OFFSET/FETCH` no Oracle 19c, que o mapa mediu só sem a janela.

## Segundo cartão (anotado)

`buscarPedidos` e notas por número, sobre `TGFCAB`: depende do que cada empresa chama de pedido (TOP e `TIPMOV`).
