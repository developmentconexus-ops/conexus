# A política de dados pessoais dos conectores

O cartão parte do estudo "dados pessoais de terceiros nos conectores" (seções 1, 7 e 9) e do estudo
anterior do caminho dos dados (seções 5, 8 e 9), com as respostas do fundador de 2026-11-11 (a política de papéis, o app declarando tipos e o `GRANT` por coluna foram simplificados em 2026-11-12, "P2"): "A1, mas
seria uma capabilidade para criar e selecionar POR EXEMPLO PARA DAR PARA OUTRO cargo"; "B1, okay, mas
como vamos tratar isso [...] Qual que seria a lógica [...] Vale a pena? É uma gambiarra? Referências
fazem?"; "`C1` porém mesma coisa de B"; "`D1`"; "E Só vai vir depois". Cada linha do `main` foi lida em
`7c8b156f`, e as que o Sync mexeu foram lidas de novo em `22702f99` (2026-11-12, `main` depois do fechamento do Sync), com `better-auth` 1.7.8, `@mastra/core` 1.82.0, `zod` 4.6.5,
`@brazilian-utils/brazilian-utils` 2.5.0 e PostgreSQL 18. As referências: n8n `2e855356`, twenty
`b76d0217`, Airbyte `8aed3123`, PostgREST `d42ae9d`.

Nenhuma peça do Hub, das telas ou do Builder fala de um conector pelo nome. O que é de um sistema (em
que caminho da resposta mora o comprador, que coluna do Sankhya é o CPF) mora na pasta do conector,
escrito por quem escreve o conector.


## A página do fundador

**No fim desta etapa** você pergunta ao Assistente "quem mais comprou este mês?" e ele responde com
nomes, sem nunca mandar CPF ao modelo. O Builder, quando lê os pedidos para montar um app, também não
recebe CPF. Uma cópia de pedidos guarda o apelido e a cidade do comprador, e **não guarda documento**:
se a proposta do Builder trouxer uma coluna de CPF, o Ligar recusa e diz por quê. O app que você
publica e abre continua lendo ao vivo, e recebe tudo o que a leitura traz, como hoje.

**A regra, em uma frase.** Quem vê é o **papel, por leitura**, como já é hoje: quem não tem a leitura
Pedidos não vê pedido. O tipo de dado pessoal **não é** permissão de papel. A única regra nova: o
**documento** (CPF) nunca vai a um modelo (Assistente, Builder) nem a uma cópia (que o Builder lê
depois), qualquer que seja o papel da pessoa. Contato e endereço passam.

**O que mudou desde a primeira versão desta página (decisão "P2", 2026-11-12).** O estudo das
referências (relatório de 2026-11-12) mostrou que nenhuma plataforma de IA corta campo por tipo de
dado pessoal por papel: o bloqueio delas mora no sistema de origem, com a conta de cada pessoa
(HubSpot no ChatGPT, Salesforce). No Conexus a ligação é um login só da empresa. Quem tem login
compartilhado restringe **qual leitura** o papel usa, não qual campo: o Mastra Connect (`mastra-1.82@6e8dfcb8
docs/.../connect/overview.mdx:30` e `tools.mdx:91-101`) e o Airbyte AI Agents (`airbyte@8aed3123
docs/ai-agents/interfaces/ui/add-connector.md:113,135` e `concepts/governance.md:24`, a entidade inteira
ou nada), e é o que o `main` já tem (`mayUse`, `roles.ts`). O HubSpot deixa as "Sensitive Data
Properties" fora dos conectores de IA até um administrador liberar: é o nosso "documento nunca ao
modelo". O Mercado Livre pede o "registro de acesso" (práticas requeridas em
developers.mercadolivre.com.br/seguranca-de-aplicacoes): fica o registro com os tipos, sem o valor.
Saíram: a marcação de tipos por papel e a tela de Papéis, o app declarando tipos, o `GRANT` por coluna
na cópia. Ficou o que serve às duas respostas que você deu: B1 (o documento nunca vai ao modelo) e a
cópia sem documento (a sua resposta "A").

**As quatro peças, iguais para todo conector:**

1. **Uma lista fixa de tipos**, no kit: contato, endereço, documento, sensível. Ninguém inventa um tipo
   por conector.
2. **Cada leitura declara os seus caminhos pessoais**, escritos por quem escreve o conector: "nos
   pedidos, `buyer` é contato; `buyer.billing_info` é documento". É só dado; o conector não corta nada.
3. **Uma conferência automática no CI**: cada caminho declarado existe nas respostas do dublê, e se
   aparece nelas um CPF, um e-mail ou um telefone num caminho **não** declarado, o teste falha. O
   conector novo que esquece o CPF não passa.
4. **Um ponto só de aplicação**, a leitura comum (`readThrough`): para um leitor que é modelo ou cópia,
   o caminho de tipo documento sai da resposta (o twenty tira, não mascara:
   `common-select-fields-builder.ts:46-52` em `b76d0217`); o registro `CONNECTOR_CALLED` anota quais
   tipos foram entregues e quais tirados, nunca o valor.

**Exemplo (inventado).** A Loja Exemplo liga o Mercado Livre. Ana é dona; Beto é do papel "Estoque",
com a leitura Pedidos.

| | Hoje | No fim desta etapa |
| --- | --- | --- |
| Ana pergunta ao Assistente "quem comprou 3 vezes?" | "não tenho o comprador" | "Maria Fictícia (3 pedidos)"; o CPF não vai ao modelo |
| Beto pergunta o mesmo | o mesmo | o mesmo que Ana: o papel dele tem a leitura |
| O app "Quem comprou" que Ana publica | só "pedido 123, R$ 89,90" | "Maria Fictícia, Campinas/SP", e o CPF se a leitura o traz (o app não é um modelo) |
| Clientes do Sankhya (`buscarParceiros`) pelo Assistente | CPF e nome | nome, sem CPF; a porta SQL fica como hoje (G) |
| O Builder propõe uma cópia de pedidos com a coluna do CPF | guardaria | o Ligar recusa: "Uma cópia não guarda Documento" |
| O registro | só escalares | mais `personal: ['contato']` e `withheld: ['documento']`, nunca o valor |

**O que se perde, sem rodeio.** "O Estoque vê o pedido sem o nome" não existe: quem tem a leitura vê o
que ela traz, menos o documento no modelo. O Airbyte Agents aceita a mesma perda (a entidade inteira, ou
nada). Se a empresa precisar de um papel que não veja o comprador, ele não recebe a leitura Pedidos.

**O roteiro de uso.** Você é dono, com o Mercado Livre e o Sankhya ligados.

1. Pergunte ao Assistente "quais clientes compraram hoje no Mercado Livre?": ele responde com nomes e
   cidades. Pergunte o CPF de um cliente do Sankhya: a resposta vem sem o CPF.
2. Peça ao Builder uma cópia dos pedidos com o CPF do comprador: o Ligar recusa, com a frase da tela.
   Peça sem o CPF (com o apelido): liga.
3. Abra o registro de uma leitura: ele diz `personal: contato` e `withheld: documento`, sem nenhum valor.

**O que você faz, e quando.** Aprova esta página, que muda o que o cartão de 2026-11-12 prometia (o texto
da tela do Ligar entre eles); no fim, faz o roteiro e aprova o texto da recusa.

**Fica de fora.**

- **E, o advogado** (contrato de operador, suboperadores, cláusulas para o modelo no exterior): vem
  depois, como você disse.
- **Sensível (`D1`)**: o tipo existe no kit e na regra; a leitura declarada como sensível não é cortada
  por papel nenhum nesta etapa, só pela frase da skill, como hoje.
- **Tipos de dado pessoal por papel, o app declarando tipos e o `GRANT` por coluna na cópia**: saíram em
  2026-11-12 (P2). Voltam, se voltarem, num cartão próprio, quando houver o que as referências fazem
  (um login por pessoa no sistema de origem).
- **Agentes publicados**: leem como hoje, sem a regra de papel (o `personal: []` que o PR trazia saiu).
  A regra do documento vale para eles pelo `readThrough`, como leitor modelo.
- **Prazo de guarda escolhido pela empresa** e **apagar um titular a pedido**: cartão próprio.
- **G. A porta genérica do Sankhya** (`consultar`, `carregar`): fora da política por decisão sua; nenhuma
  trava nova.
- **Máscara** no lugar de tirar o campo: o twenty tira; nós também.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 A declaração e a aplicação num ponto | a lista `PERSONAL_KINDS`; `personal` na operação; `findUndeclared`; a conformidade; as declarações do Mercado Livre e do Sankhya, com o `omit`, o `BUYER` e o `without` apagados; `shapePersonal` em `readThrough`; a regra única `withheldKinds`; os escalares em `CONNECTOR_CALLED` | `packages/connectors/src/{kernel,mercado-livre,sankhya}/`, `packages/connectors/package.json`, `apps/server/src/hub/connectors/` | [security](../guides/security.md) | a U2b do Sync, já em `main` |
| U2 A cópia não guarda documento | Ligar recusa a coluna de tipo documento com `COPY_PERSONAL_NOT_KEPT`; a rodada de uma cópia antiga grava a coluna sem valor | `apps/server/src/hub/copies/accept.ts`, `apps/server/src/hub/connectors/{copy-personal,copy-port}.ts`, `packages/hub-api/src/{copies,copy-failures}.ts` | [data](../guides/data.md) | U1 |

**Orçamento de código alterado.** U1: 360. U2: 80. Total: cerca de 440 linhas, abaixo de delivery L2.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Uma operação que declara um caminho pessoal ausente da resposta do dublê falha a conformidade, com o id e o caminho | `kernel/personal.test.ts`, "caminho declarado que não existe" | must |
| 2 | U1 | Uma resposta do dublê com um CPF válido, um e-mail ou um telefone num caminho não declarado falha a conformidade, com o caminho e o tipo, nunca o valor | `kernel/personal.test.ts`, "forma conhecida não declarada" | must |
| 3 | U1 | O Mercado Livre e o Sankhya passam a conformidade com as declarações; tirar `buyer` de `pedidos` a faz falhar | `mercado-livre/mercado-livre.test.ts`, `sankhya/sankhya.test.ts` | must |
| 4 | U1 | Um `kind` fora dos quatro não compila nem passa em `defineOperation` | `kernel/kernel.test.ts`, "tipo desconhecido" | must |
| 5 | U1 | Pelo Assistente e pelo Builder, `pedidos` traz o comprador (contato) e `envio` traz `destination` e `receiver_name`, sem `billing_info` | `connectors/personal-read.test.ts`, "Assistente e Builder recebem contato e endereço, e perdem o documento" | must |
| 6 | U1 | Nem `pedidos` (`buyer.billing_info`) nem `notaFiscalDoPedido` (`recipient`) trazem o CPF plantado ao Assistente nem ao Builder, nem para o dono (B1); a leitura do app o traz | `connectors/personal-read.test.ts`, "o documento não vai ao modelo, nem para o dono", "o documento vai ao app e não ao Assistente" | must |
| 7 | U1 | `buscarParceiros` pelo Assistente traz o nome e não traz o `documento`, para o dono e para o membro | `connectors/personal-read.test.ts`, "Sankhya: o membro com a leitura recebe o parceiro, sem o documento" | must |
| 8 | U1 | A porta genérica do Sankhya (`consultar`, `carregar`) responde como hoje: as mesmas linhas para o dono e para o membro (G) | `connectors/personal-read.test.ts`, "a porta fica como hoje" | must |
| 9 | U1 | Cada `CONNECTOR_CALLED` de uma leitura que declara tipos traz `personal` (os entregues) e `withheld` (os tirados), e nenhuma linha do registro traz o valor plantado | `connectors/personal-read.test.ts`, "o registro sem o valor" | must |
| 10 | U1 | `grep -rn "omit" packages/connectors/src/mercado-livre` não acha nada | revisão | must |
| 11 | U1 | A busca do agente publicado traz o nome, como em `main` | `builder/agents/agent-search.test.ts` | must |
| 12 | U2 | Ligar uma proposta v2 de `pedidos` com a coluna `buyer.billing_info.doc_number` é recusado com `COPY_PERSONAL_NOT_KEPT` (409); com a coluna `buyer.nickname`, liga | `copies/accept-v2.test.ts`, "uma cópia não guarda documento" | must |
| 13 | U2 | Uma página de cópia (`by: 'copy'`) de `pedidos` traz o apelido do comprador (contato) e nunca o CPF; uma cópia antiga com coluna de documento grava a coluna sem valor | `connectors/copy-port.test.ts`, "a cópia com o tipo da coluna", "uma cópia antiga com coluna de documento" | must |

Os critérios de 2026-11-11 que falavam de papéis, da tela, do manifesto e do `GRANT` por coluna (5 a 7,
15 a 19) saíram com a decisão P2; o 13 antigo ("a cópia sem tipo") mudou de forma porque a cópia agora
guarda contato e endereço.

## A matriz de estados

Nenhuma tela muda nesta etapa. A recusa do Ligar aparece no `FormAlert` que a tela de Cópias já tem,
com a frase da falha.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Operation.personal` | o autor do conector | a conformidade, `readThrough`, o Ligar (`personalColumns`) |
| `CONNECTOR_CALLED.personal`, `.withheld` | `readThrough` | quem lê o registro (o "registro de acesso" que o Mercado Livre pede) |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio | Uma dependência fora | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Ligar com coluna de documento (`COPY_PERSONAL_NOT_KEPT`, 409) | a trava da proposta de hoje | recusa antes de a cópia existir: nada gravado, a transação desfaz | `DATABASE_UNAVAILABLE` de hoje | a falha, com o conector e o tipo nos detalhes, nunca o valor | 12 |

As leituras não gravam nada novo; o escalar do registro não é gravação. O texto da falha é "Uma cópia não
guarda Documento." e a ação "Tire essa coluna da cópia; o app que precisa dele lê direto do sistema.":
**texto que o fundador aprova** (delivery L23); o nome do tipo está escrito na frase porque o documento é
o único tipo que uma cópia nunca recebe.

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A lista fixa de tipos | U1 | nada | Shopify (níveis de campo do cliente, documentado); LGPD art. 5º II e art. 11 | poucos níveis fixos | embrulhado: `PERSONAL_KINDS` no kit | conformidade (crit. 4) | A1 (simplificada em P2) | `packages/connectors/src/kernel/personal.ts` |
| O conector declara caminho e tipo | U1 | `mercado-livre/operations/shared.ts:67` (`omit`, sem tipo); o Sankhya sem nada | n8n `packages/workflow/src/interfaces.ts:3245-3251` em `2e855356` (forma: caminhos com ponto declarados no nó; ali é para credencial) | o nó declara caminhos | embrulhado: `personal` na `Operation` no lugar do `omit` | crit. 1, 3 | B1 | — |
| A conferência das formas não declaradas | U1 | nada | nenhuma (procurado em n8n, Airbyte, nango, twenty) | — | remendo: só no teste, com `isValidCpf`, `isValidEmail`, `isValidPhone` da biblioteca instalada | crit. 2, com `@brazilian-utils/brazilian-utils@2.5.0`; entrada em `docs/reference/boundaries.md` | B1 | — |
| Aplicação num ponto | U1 | o corte dentro de `mercado-livre/answers.ts:101-126`, antes do papel | twenty `common-select-fields-builder.ts:46-52` em `b76d0217` | um filtro único sobre o resultado | embrulhado: `shapePersonal`, função pura, chamada em `readThrough` depois de `answerOf` | crit. 5 | — | `apps/server/src/hub/connectors/personal.ts` |
| Documento nunca ao modelo nem à cópia | U1 | `cut.ts` (só tamanho) | HubSpot "Sensitive Data Properties" (fora dos conectores de IA até um administrador liberar); LGPD art. 33 | propriedade sensível fora da IA | embrulhado: `withheldKinds(by)`, a regra única | crit. 6, 13 | B1, "A" | — |
| O registro sem o valor | U1 | `read.ts` (`CONNECTOR_CALLED`, escalares) | Mercado Livre "registro de acesso" (documentado) | um evento por leitura | embrulhado: dois escalares na linha que já existe (security S41) | crit. 9 | — | — |
| Quem vê é o papel, por leitura | U1 | `mayUse`, `roles.ts` | Mastra Connect `mastra-1.82@6e8dfcb8 docs/.../connect/overview.mdx:30`, `tools.mdx:91-101`; Airbyte AI Agents `airbyte@8aed3123 docs/ai-agents/interfaces/ui/add-connector.md:113,135`, `concepts/governance.md:24` | restringe por leitura ou entidade, nunca por campo | nativo: não muda | — | P2 | — |
| A cópia recusa documento | U2 | `copies/accept.ts` (`mayReadSources`, a recusa de hoje no Ligar) | PostgREST `d42ae9d` (o que não é dado a um papel não é lido) | — | nativo: a mesma forma de recusa do Ligar, com `personalColumns` | crit. 12 | "A" | — |

**Ficam fora da tabela, com a razão.** RH e dados sensíveis (`SKILL.md:21`, LGPD art. 11): `D1`, só pela
frase da skill. A porta genérica do Sankhya (`sankhya/door.ts:69-145`): fora da política (G). A detecção
por modelo (o `PIIDetector` do Mastra): a declaração é determinística e mais barata.

**A medida do transplante.** Nada vem do repositório antigo.

**A dívida.** O corpo de uma recusa do provedor vai inteiro ao modelo (`read.ts:37-40`); se um provedor
devolver dado pessoal numa recusa, ele passa. Fica para a seção 11 da arquitetura. Uma cópia v2 ligada
antes desta etapa com coluna de documento passa a gravar a coluna sem valor, sem recusa retroativa.

## U1 A declaração e a aplicação num ponto

**Base e modelo.** A U2b do Sync no `main` (pasta do Mercado Livre, L1). Opus: desenho entre
módulos (kit e leitores) e a porta. A declaração e a aplicação são uma unidade porque a
conformidade lê o valor que `operation.answer` devolve (`conformance-session.ts:134-139`), e esse
valor já sai sem o `omit` (`mercado-livre/answers.ts:124-126`): enquanto o `omit` corta, um caminho
declarado não existe no valor; e tirar o `omit` sem a aplicação entregaria o comprador a todos.

### As linhas da tabela

A declaração; a conferência das formas não declaradas; a aplicação num ponto; documento nunca ao
modelo nem à cópia; o registro.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | muda `personal.ts` (`PersonalField`, `findUndeclared`), `operation.ts`, `conformance.ts`, `index.ts` | todo conector; o servidor |
| `packages/connectors/src/mercado-livre/` | apaga `omit`, `BUYER` de `vendas.ts`, `without` e o corte de `rows()` (`answers.ts:78-126`, `shared.ts:67,76-82`); declara `personal`; troca os `summary` que dizem que o comprador não vem (`envios.ts:12`, `faturamento.ts:59`) e a skill; planta a cidade da entrega no dublê, e troca o teste do `omit` do Sync (`operations-list.test.ts:272`) | o kit |
| `packages/connectors/src/sankhya/` | declara `personal` em `operations/{buscas,cadastros}.ts`; `door.ts` e `read-only-sql.ts` não mudam (G) | o kit |
| `packages/connectors/package.json` | acrescenta `@brazilian-utils/brazilian-utils` (já no lock, pelo `hub-api`) | — |
| `apps/server/src/hub/connectors/` | cria `personal.ts`; muda `read.ts` e `public.ts` | `assistant-port.ts`, `builder-port.ts`, `app-calls.ts`, `copy-port.ts` |

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/personal.ts
/** Um caminho com ponto relativo a cada linha de `linhas`, ou ao valor quando ele não tem `linhas`. */
export type PersonalField = Readonly<{ path: string; kind: PersonalKind }>
/** As formas conhecidas achadas num valor fora dos caminhos dados: caminho e tipo, nunca o valor. */
export function findUndeclared(value: unknown, declared: readonly PersonalField[]): readonly Readonly<{ path: string; kind: 'documento' | 'contato' }>[]
// operation.ts, em Operation: personal?: readonly PersonalField[]
// apps/server/src/hub/connectors/personal.ts
export function shapePersonal(value: unknown, personal: readonly PersonalField[], allowed: ReadonlySet<PersonalKind>): Readonly<{ value: unknown; given: PersonalKind[]; withheld: PersonalKind[] }>
/** Os tipos que um leitor nunca recebe: documento para um modelo ou uma cópia, nenhum para o app. */
export function withheldKinds(by: ReadBy): readonly PersonalKind[]
```

`defineOperation` confere cada `kind` com `z.enum(PERSONAL_KINDS)`. **O caminho mais específico
vence:** `buyer` contato e `buyer.billing_info` documento quer dizer que quem tem contato e não tem
documento recebe `buyer` sem `billing_info`; `shapePersonal` anda os caminhos do mais fundo ao mais
raso e tira cada um cujo tipo não está em `allowed` (o twenty tira, não mascara). Em `readThrough`,
depois de `answerOf` (`read.ts:181`) e só para `OK`. `by: 'assistant' | 'builder'` tira
`documento`, e `by: 'copy'` também (a cópia é lida depois por um modelo); `by: 'app'` recebe todos os tipos. A porta genérica do Sankhya não declara nada e passa como hoje (G); a conferência das formas não
roda nas operações de `readDoor`, cuja resposta depende da consulta. `findUndeclared` olha textos e inteiros (um CPF pode vir como
número JSON: o inteiro vira texto de 11 dígitos com zeros à esquerda antes de `isValidCpf`), e
`isValidPhone` só em texto de 10 a 13 dígitos, para não pegar ids. Modelo: `read.ts` cumpre C21
(`ReadAnswer`), C23 (`ConnectorId.parse` na entrada) e C26 (um `readThrough`).

### As skills e a leitura

`stack.md` para `packages/connectors` (`zod`; `@brazilian-utils/brazilian-utils`, README) e para
`apps/server/src/hub` (`better-auth-best-practices`).

### A ordem do trabalho

1. `personal.ts` do kit: `PersonalField` e `findUndeclared`. Regras: C21, C26.
2. `operation.ts`: `personal`.
3. `conformance.ts`: para cada probe com resposta, cada caminho declarado existe em ao menos uma
   linha (`valueAt`, `operation.ts:103`), e `findUndeclared` volta vazio.
4. Mercado Livre, apagando antes de somar (C75): o `omit` sai de `rows()`; `pedidos` e `pedido`
   declaram `buyer` contato e `buyer.billing_info` documento; `envio` declara `destination` endereço
   e `destination.receiver_name`, `destination.receiver_phone` contato (assim `receiver_id` e
   `comments`, que o `omit` de hoje escondia, ficam sob endereço); `perguntas` `from` contato;
   `mensagensDoPacote` `from.email`, `from.name`, `to.email`, `to.name` contato; `notaFiscalDoPedido`
   `recipient` documento; `conta` `email`, `phone`, `alternative_phone`, `first_name`, `last_name` e
   `address` como contato e endereço e `identification` documento (são dados do vendedor, pessoa:
   o dono os vê, o Membro não). As leituras sem `omit` (`pacote`, `mensagensNaoLidas`,
   `reclamacoes`) passam pela conformidade: se o dublê não planta nada, nada se declara. Os `summary`
   e a skill deixam de dizer que o comprador não vem.
5. Sankhya: `buscarParceiros` `documento` documento e `nome`, `razaoSocial` contato; `clientes` pelos
   nomes que o dublê traz. A porta (`door.ts`) não muda.
6. Servidor: `personal.ts`; `readThrough` com `withheldKinds` e `shapePersonal`, e os escalares `personal` e `withheld` em `CONNECTOR_CALLED`.
Regras: S40, S41, C21, T5.

### Como se prova

Critérios 1 a 4 com `node --test` nos arquivos do kit (o crit. 3 tira `buyer` de `pedidos` num teste
e espera a falha); critérios 8 a 14 pelas portas públicas do Assistente, do Builder e da cópia, com o
dublê que planta o comprador (`mercado-livre/fake-data.ts:24-32`). Falha hoje: `personal` não existe,
e o membro e o dono recebem a mesma linha.

### Parar se

O dublê de uma leitura que declara um caminho não o planta: plantar no dublê (T29), nunca tirar a
declaração. Uma forma pega um id que não é pessoal: estreitar a forma e dizer no relatório. Uma porta
chama `readThrough` sem uma pessoa nem uma versão: parar. O teste "o comprador não chega à cópia" do Sync quebra por
outro motivo que não o `omit`: parar e relatar.


## U2 A cópia não guarda documento

**Base e modelo.** U1. Sonnet: a recusa tem a forma da que o Ligar já faz.

### As linhas da tabela

A cópia recusa documento.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/connectors/copy-personal.ts`, `copy-port.ts` | `personalColumnsOf` (o tipo de cada coluna, pelo caminho declarado mais específico) e `personalColumns` na porta das cópias | o Ligar |
| `apps/server/src/hub/copies/accept.ts` | `mayKeepPersonal`, chamado em `acceptedIn`: se algum tipo das colunas está em `withheldKinds('copy')`, lança `COPY_PERSONAL_NOT_KEPT` | a página Cópias, o Builder |
| `packages/hub-api/src/{copies,copy-failures}.ts` | a falha nova na lista de `enableCopy` e a sua linha | a tela de Cópias |

### Os contratos que a unidade cria

```ts
/** O tipo de cada coluna da definição versão 2: o do caminho pessoal mais específico que contém o `path` dela, ou nenhum. */
export function personalColumnsIn(kit: Connector | undefined, definition: CopyDefinitionV2): ReadonlyMap<string, PersonalKind>
/** Os tipos que um leitor nunca recebe (a regra única de `readThrough`, que o Ligar lê). */
export function withheldKinds(by: ReadBy): readonly PersonalKind[]
```

A rodada de uma cópia não ganha filtro próprio: `readThrough` com `by: 'copy'` já tira o documento
(`withheldKinds`), e o `forModel` da prova do Builder some. Uma cópia v2 ligada antes, com coluna de
documento, grava a coluna sem valor.

### As skills e a leitura

[data](../guides/data.md); [security](../guides/security.md).

### A ordem do trabalho

1. `personalColumnsIn` e a porta. 2. `mayKeepPersonal`. 3. A falha. Regras: C26, C48.

### Como se prova

Critérios 12 e 13, pelo Ligar e pela página de cópia (`copy-port.test.ts`).

### Parar se

O `path` de uma coluna de `CopyDefinitionV2` (`kernel/copy.ts:114-130`) não cobre o caminho pessoal que a
contém: parar; a U2 volta ao cartão.
