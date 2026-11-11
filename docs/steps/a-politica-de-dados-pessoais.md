# A política de dados pessoais dos conectores

O cartão parte do estudo "dados pessoais de terceiros nos conectores" (seções 1, 7 e 9) e do estudo
anterior do caminho dos dados (seções 5, 8 e 9), com as respostas do fundador de 2026-11-11: "A1, mas
seria uma capabilidade para criar e selecionar POR EXEMPLO PARA DAR PARA OUTRO cargo"; "B1, okay, mas
como vamos tratar isso [...] Qual que seria a lógica [...] Vale a pena? É uma gambiarra? Referências
fazem?"; "`C1` porém mesma coisa de B"; "`D1`"; "E Só vai vir depois". Cada linha do `main` foi lida em
`7c8b156f`, com `better-auth` 1.7.8, `@mastra/core` 1.82.0, `zod` 4.6.5,
`@brazilian-utils/brazilian-utils` 2.5.0 e PostgreSQL 18. As referências: n8n `2e855356`, twenty
`b76d0217`, Airbyte `8aed3123`, PostgREST `d42ae9d`.

Nenhuma peça do Hub, das telas ou do Builder fala de um conector pelo nome. O que é de um sistema (em
que caminho da resposta mora o comprador, que coluna do Sankhya é o CPF) mora na pasta do conector,
escrito por quem escreve o conector.

## A página do fundador

**No fim desta etapa** você abre **Papéis**, marca no papel **Vendas** que ele vê **contato** e
**endereço** dos clientes, e pede ao Builder um app "quem comprou da gente" do Mercado Livre: o app
mostra nome e cidade do comprador. Pergunta ao Assistente "quem mais comprou este mês?" e ele responde
com nomes, sem nunca mandar CPF ao modelo. Uma pessoa do papel **Membro** pergunta o mesmo e recebe os
pedidos sem nome.

**A lógica, em uma frase.** O conector diz **onde** está cada dado pessoal e de **que tipo** ele é; a
empresa diz, por papel, **quem** vê cada tipo; o Hub aplica isso **num ponto só**, a leitura comum que
serve ao app, ao Assistente, ao Builder e à cópia; e cada leitura com dado pessoal fica registrada,
sem o valor.

**A sua primeira pergunta (A1): "uma capabilidade para criar e selecionar, para dar para outro
cargo".** É isso. Os quatro tipos (**contato**, **endereço**, **documento**, **sensível**) viram
permissões do papel, no mesmo editor de **Papéis** onde você já marca "usa a leitura Pedidos". Você
marca em qualquer papel, inclusive num papel que você criou ("Vendas", "Financeiro"). Dono e
Administrador já vêm com contato, endereço e documento, e não mudam; Desenvolvedor, Membro e os
papéis novos começam sem nenhum; **sensível** não aparece para ninguém (`D1`). Como: o better-auth já
guarda a permissão de cada papel como "recurso: ações" e já responde "este papel pode?" a cada
leitura (`apps/server/src/hub/identity/roles.ts:68-82`, `may-use.ts:88-112`); os tipos entram como
mais um recurso, igual ao "publicar agente que escreve sozinho" que você aprovou na 24.5
(`company-roles.ts:237-244`). É nativo, sem tabela nova.

**A sua segunda pergunta (B1 e `C1`): "qual seria a lógica para vários conectores? Vale a pena? É
gambiarra? Referências fazem?"** A lógica não é marcar o CPF campo a campo na mão. São quatro peças,
iguais para todo conector:

1. **Uma lista pequena e fixa de tipos**, no kit dos conectores: contato (nome, e-mail, telefone),
   endereço, documento (CPF), sensível (saúde, salário, sindicato). Ninguém inventa um tipo por
   conector.
2. **Cada leitura declara os seus caminhos pessoais**, escritos por quem escreve o conector (a equipe,
   ou o Builder quando ele escrever um): "nos pedidos, `buyer` é contato"; "no envio,
   `destination.shipping_address` é endereço"; "na busca de parceiros do Sankhya, `documento` é
   documento". É o que o n8n faz: cada nó declara os caminhos sensíveis da saída dele
   (`packages/workflow/src/interfaces.ts:3245-3251`, declarado no próprio nó,
   `FormTriggerV2.node.ts:100`, provado em `FormTriggerV2.node.test.ts:651-661`); e o que a Shopify
   faz com os níveis de campo do cliente (nome, endereço, telefone e e-mail num nível à parte, que só
   vem a quem tem a liberação; documentado).
3. **Uma conferência automática** que não deixa um conector entrar errado: cada caminho declarado tem
   de existir nas respostas do dublê e nas gravadas; e se aparecer nelas um CPF, um e-mail ou um
   telefone num caminho que **não** foi declarado, o teste falha. Assim, o conector novo que esquece o
   CPF não passa no CI.
4. **Um ponto só de aplicação**, a leitura comum (`readThrough`, `apps/server/src/hub/connectors/read.ts:139`):
   quem não tem o tipo recebe a linha sem aquele campo. É o que o twenty faz: tira do resultado o campo
   que o papel não lê, num lugar só (`common-select-fields-builder.ts:46-52`).

Com isso, **B1** é uma linha da regra: o tipo documento nunca vai a quem é um modelo (Assistente,
Builder), mesmo que a pessoa tenha. **`C1`** é a mesma regra na cópia: a cópia só guarda a coluna
pessoal de um tipo que quem a liga pode ver, e a apaga ao desligar.

**Vale a pena?** Sim. O corte de hoje (`omit` no Mercado Livre) já é um mecanismo por caminho; a
política troca a lista fixa por "caminho + tipo" e põe a decisão no papel. São cerca de 1.150 linhas,
e o Sankhya, que hoje entrega CPF e nome de clientes a todo papel e ao modelo
(`sankhya/operations/buscas.ts:30-34`, `cadastros.ts:35`), entra na mesma regra.

**É gambiarra? O que as referências fazem e o que é nosso, sem rodeio.**

- Declarar no conector: o n8n faz, mas para dados que equivalem a credencial (cabeçalho de
  autorização), sempre ocultos e nunca revelados; ele não tem tipos nem liberação por papel. Usar a
  declaração para dado pessoal de cliente, com tipo, é extensão nossa.
- Liberar por papel e por campo: o twenty faz, em campos do próprio CRM; não em respostas de
  conector, e sem tipos.
- Tipos liberados à parte: a Shopify faz, por app, não por papel.
- A conferência que acha CPF, e-mail ou telefone não declarado numa resposta gravada: **nenhuma
  referência faz**. É nossa, roda só no teste e usa os validadores da biblioteca que já instalamos
  (`isValidCpf`, `isValidEmail`, `isValidPhone`).
- A detecção por modelo de IA (o `PIIDetector` do Mastra, `strategy` e `redactionMethod`,
  `@mastra/core/dist/processors/processors/pii-detector.d.ts:97,105`) fica de fora: nós **sabemos**
  onde o dado está; o detector é caro e não determinístico. Ele só faria sentido para texto livre
  (mensagens), e fica como rede de segurança opcional, depois.
- A combinação (tipos fixos + declaração no conector + liberação no papel + um ponto + registro) não
  existe pronta em nenhuma referência; cada peça existe em uma. Não é gambiarra: é a forma do n8n, do
  twenty e da Shopify juntas, e nenhuma peça é um corte escondido.

**Exemplo (inventado).** A Loja Exemplo liga o Mercado Livre. Ana é dona; Beto é do papel
"Estoque", sem tipos.

| | Hoje | No fim desta etapa |
| --- | --- | --- |
| Ana pergunta ao Assistente "quem comprou 3 vezes?" | "não tenho o comprador" | "Maria Fictícia (3 pedidos)"; o CPF não vai ao modelo |
| Beto pergunta o mesmo | o mesmo | pedidos sem nome |
| App "Quem comprou", publicado pela Ana com contato | só "pedido 123, R$ 89,90" | "Maria Fictícia, Campinas/SP" para quem você deu acesso ao app |
| Clientes do Sankhya, perguntados pelo Beto | CPF e nome | sem CPF e sem nome |
| O registro | só escalares | mais `personal: ['contato']`, nunca o valor |

**O roteiro de uso.** Você é dono, com o Mercado Livre e o Sankhya ligados.

1. Em **Papéis**, abra **Membro**: a seção nova **Dados pessoais de clientes** mostra contato,
   endereço e documento, desmarcados. Abra **Dono**: os três marcados, sem poder mudar.
2. Crie o papel **Vendas**, marque **contato** e **endereço**, salve, e dê esse papel a um segundo
   e-mail seu.
3. Com o segundo e-mail, pergunte ao Assistente "quais clientes compraram hoje no Mercado Livre?":
   ele responde com nomes e cidades. Pergunte o CPF de um cliente do Sankhya: a resposta vem sem o
   CPF, porque documento nunca chega ao Assistente.
4. Com o seu e-mail, peça ao Builder um app "quem comprou da gente" do Mercado Livre e publique: a
   publicação diz que o app mostra contato e endereço; o app mostra o nome do comprador (dos pedidos) e
   a cidade da entrega (dos envios).
5. Volte o papel do segundo e-mail para **Membro** e repita a pergunta do passo 3: os pedidos vêm sem
   nome.

**O que você faz, e quando.** Antes: nada novo. No começo: aprova esta página e responde F, G e H.
No fim: faz o roteiro, diz o que viu e aprova os textos da tela de Papéis.

**Fica de fora.**

- **E, o advogado** (contrato de operador, suboperadores, cláusulas para o modelo no exterior): vem
  depois, como você disse. Não bloqueia o código.
- **Sensível (`D1`)**: o tipo existe no kit e na regra, mas nenhum papel o recebe e a tela não o
  mostra; as tabelas de RH do Sankhya ficam recusadas pela porta genérica (G).
- **Agentes publicados**: a 24.6 está congelada; hoje um agente publicado só escreve pelos conectores,
  não lê. Quando os agentes voltarem, a versão deles declara tipos como a do app.
- **Prazo de guarda escolhido pela empresa** (a parte opcional de `C1`) e **apagar um titular a
  pedido**: cartão próprio, com a decisão do prazo.
- **Máscara** ("M***a F***a") no lugar de tirar o campo: o twenty e a Shopify tiram; nós também.

**As decisões suas nesta etapa.** O estudo não as trouxe; elas aparecem ao desenhar o app e a porta.

- **F. Num app, de quem é o "pode ver"?** Hoje o app usa as leituras que a versão declara, conferidas
  contra o papel de quem publica (sua decisão `C1` da etapa 20, `app-calls.ts:103-109`), e quem abre o
  app é quem você deu acesso.
  - **F1 (recomendada):** igual para os tipos. A versão declara "mostro contato e endereço"; publicar
    confere que quem publica tem esses tipos; quem abre o app vê o que ele mostra. Você controla quem
    vê pelo acesso ao app. Exemplo: o vendedor da Capacidade 4, que entra só no app e não tem papel
    na empresa, vê os clientes dele com nome. É a forma do Retool, do Appsmith e da Shopify (a
    liberação é do app); vale igual para a cópia lida pelo app, que não pode filtrar por pessoa (o
    Projeto lê o banco com um login só). Veredito: nativo (estende a `C1`).
  - **F2:** o tipo segue o papel de quem abre. O Beto não vê nome no app da Ana; o vendedor da
    Capacidade 4, sem papel na empresa, nunca vê nome; e uma cópia com coluna pessoal não pode ser
    liberada a Projeto nenhum.
- **Os apps já publicados**, de antes desta etapa, não declaram tipos. Eles passam a ler com os tipos
  do papel de quem os enviou, lidos a cada clique: um app que você enviou continua mostrando os clientes
  do Sankhya, e passa a mostrar também o comprador do Mercado Livre. Se quem enviou sair da empresa, o
  app deixa de mostrar dado pessoal até ser publicado de novo. Não é uma decisão nova: segue F1. Se
  escolher F2, esta linha some.
- **G. A porta genérica do Sankhya** (`consultar`, SQL livre; `carregar`). Ela lê qualquer coluna de
  qualquer tabela, com qualquer apelido, então não dá para declarar caminhos.
  - **G1 (recomendada):** três travas: (1) o conector declara as colunas pessoais do dicionário do
    Sankhya pelo nome (`CGC_CPF` documento, `NOMEPARC` contato e as de endereço e contato que o
    construtor achar no dicionário); (2) para quem não tem o tipo, cada célula da porta que for um CPF
    válido, um e-mail ou um telefone sai, mesmo com outro nome de coluna; (3) a consulta que nomeia
    uma tabela de RH (`TFP...`) é recusada (`D1`). O que ainda passa, dito: um nome ou endereço com
    apelido inventado; uma tabela de RH lida por uma visão ou por `carregar` (a entidade do
    dicionário não tem o nome `TFP`); os campos `AD_` que cada empresa cria, que o conector não conhece. Veredito: remendo (nenhuma referência tem SQL livre com política de campo; o
    nativo seria o `GRANT` de coluna do banco, que no Sankhya não é nosso).
  - **G2:** a porta não entrega nada a quem não tem os três tipos: o Assistente do Membro perde a
    porta.
- **H. Onde entra no roteiro.** Pelo método (delivery L5), esta etapa é da trilha principal e espera
  o Sync fechar, num pull request rascunho.
  - **H1 (recomendada):** logo depois do Sync e **antes da Capacidade 4**, porque a 4 traz pessoas
    que só entram no app e veem clientes, e hoje o Sankhya entrega CPF a todo papel. O Sync não precisa
    esperar: a cópia já nasce certa (veja "O Sync" abaixo).
  - **H2:** depois da Capacidade 4.

**O Sync.** O cartão do Sync supõe o corte: a linha 47 ("a leitura do conector já o corta") e o
critério 10 ("o `omit` da leitura vale para a cópia"). Com esta política, a cópia lê pela mesma
leitura comum como uma versão que não declara tipo nenhum, então continua sem dado pessoal: o critério
10 passa a ser "a cópia sem tipo liberado não recebe valor pessoal" e muda de dono na U2 desta etapa
(delivery L7). A coluna pessoal na cópia (`C1`) entra na U5, depois do motor do Sync.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 Os tipos nos papéis | a lista `PERSONAL_KINDS` no kit; o recurso `personal` nos `Statements`; dono e administrador com três tipos; `RoleView.personal`, `RoleCreate.personal`, `RoleChange.personal`; `personalKinds` na identidade; o registro da troca | `packages/connectors/src/kernel/`, `apps/server/src/hub/identity/`, `apps/server/src/hub/connectors/role-kit.ts`, `apps/server/src/main.ts`, `packages/hub-api/src/{company-roles,failures}.ts` | [security](../guides/security.md) | esta página |
| U2 A declaração e a aplicação num ponto | `personal` na operação e `personalColumns` na porta; `findUndeclared`; a conformidade; as declarações do Mercado Livre e do Sankhya, com o `omit`, o `BUYER` e o `without` apagados; `shapePersonal` em `readThrough`; `Speaker` `VERSION` com `personal`; menos documento para `assistant` e `builder`; os escalares em `CONNECTOR_CALLED`; a porta do Sankhya (G1) | `packages/connectors/src/{kernel,mercado-livre,sankhya}/`, `packages/connectors/package.json`, `apps/server/src/hub/connectors/`, `apps/server/src/hub/identity/may-use.ts`, `apps/server/src/builder/agents/` | [security](../guides/security.md) | U1; a U2b do Sync no `main` (pasta do Mercado Livre, L1); entra junto com a U3 |
| U3 O app declara os tipos | `personal` no manifesto por conector; a conferência de Publicar; `sentBy` na chamada do app e a versão anterior ao campo; a skill `conexus-data` | `packages/app-contract/src/manifest.ts`, `packages/hub-api/src/{apps,failures}.ts`, `apps/server/src/hub/apps/`, `apps/server/src/hub/connectors/{publish-check,app-calls}.ts`, `packages/app/skills/conexus-data/` | [security](../guides/security.md) | U2 |
| U4 A tela de Papéis | a seção **Dados pessoais de clientes** no editor, criar e abrir | `apps/web/src/hub/identity/` | [web](../guides/web.md) | U1 |
| U5 A coluna pessoal na cópia | o tipo de cada coluna, derivado do caminho; Ligar confere o papel; o `GRANT SELECT (colunas)` ao Projeto; Desligar apaga as colunas pessoais | `apps/server/src/hub/copies/`, `apps/server/src/hub/connectors/copy-port.ts`, `apps/server/src/platform/copy-sql.ts` | [data](../guides/data.md) | U2; as U3 e U4 do Sync no `main` |

U4 corre ao lado de U2 e U3, porque não divide pasta com elas. U5 espera o Sync. Todas entram no
mesmo pull request da etapa, então o `main` nunca vê a U2 sem a U3.

**Orçamento de código alterado.** U1: 200. U2: 430. U3: 160. U4: 150. U5: 200. Total:
cerca de 1.140 linhas, abaixo de delivery L2.

## Os critérios de aceite

Cada um falha hoje: não há `personal` no kit, nem recurso `personal` nos papéis, nem conferência.

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U2 | Uma operação que declara um caminho pessoal ausente da resposta do dublê falha a conformidade, com o id e o caminho | `kernel/personal.test.ts`, "caminho declarado que não existe" | must |
| 2 | U2 | Uma resposta do dublê com um CPF válido, um e-mail ou um telefone num caminho não declarado falha a conformidade, com o caminho e o tipo, nunca o valor | `kernel/personal.test.ts`, "forma conhecida não declarada" | must |
| 3 | U2 | O Mercado Livre e o Sankhya passam a conformidade com as declarações; tirar `buyer` de `pedidos` a faz falhar | `mercado-livre/mercado-livre.test.ts`, `sankhya/sankhya.test.ts` | must |
| 4 | U2 | Um `kind` fora dos quatro não compila nem passa em `defineOperation` | `kernel/kernel.test.ts`, "tipo desconhecido" | must |
| 5 | U1 | `GET /api/companies/{companyId}/roles` dá a dono e administrador `personal: ['contato','endereco','documento']`, e a desenvolvedor, membro e papel novo `[]` | `identity/roles-personal.test.ts`, "os tipos de cada papel" | must |
| 6 | U1 | `PUT .../roles/member` com `personal: ['contato']` é 200, e a leitura seguinte do membro recebe contato; com `['sensivel']` é 422 `REQUEST_MALFORMED` (`PERSONAL_KIND_UNKNOWN`); em `owner` é 409 `ROLE_FIXED` | `identity/roles-personal.test.ts`, "marcar contato no membro", "sensível recusado" | must |
| 7 | U1 | `POST .../roles` cria "Vendas" com `personal: ['contato','endereco']` e a resposta os traz | `identity/roles-personal.test.ts`, "papel novo com tipos" | must |
| 8 | U2 | Pela porta do Assistente, a mesma leitura `pedidos` do dublê: o dono recebe `buyer` com o nome plantado e sem `billing_info`; o membro recebe a linha sem `buyer`; em `envio`, o membro não recebe `destination` (nem `receiver_id` nem `comments`) | `connectors/personal-read.test.ts`, "dois papéis, duas respostas" | must |
| 9 | U2 | Pelo Assistente e pelo Builder, nem `pedidos` (`buyer.billing_info`) nem `notaFiscalDoPedido` (`recipient`) trazem o CPF plantado, nem para o dono (B1); pelo app de uma versão que declara documento, trazem | `connectors/personal-read.test.ts`, "documento não vai ao modelo" | must |
| 10 | U2 | `buscarParceiros` pelo Assistente de um membro não traz `documento` nem `nome` | `connectors/personal-read.test.ts`, "Sankhya pelo membro" | must |
| 11 | U2 | `consultar` com `SELECT CGC_CPF AS X FROM TGFPAR` pelo Assistente de um membro não traz o CPF plantado; com `FROM TFPFUN` é recusado (`REFUSED`, `INPUT_INVALID`) antes da chamada | `connectors/personal-read.test.ts`, "porta com apelido", "RH recusado" | must |
| 12 | U2 | Cada `CONNECTOR_CALLED` de uma leitura que declara tipos traz `personal` (os tipos entregues) e `withheld` (os tirados), e nenhuma linha do registro traz o valor plantado | `connectors/personal-read.test.ts`, "o registro sem o valor" | must |
| 13 | U2 | Uma página de cópia (`by: 'copy'`) de `pedidos` não traz o nome plantado em célula nenhuma (o critério 10 do Sync, na forma nova) | `connectors/copy-port.test.ts`, "a cópia sem tipo" | must |
| 14 | U2 | `grep -rn "omit" packages/connectors/src/mercado-livre` não acha nada | revisão | must |
| 15 | U3 | Publicar uma versão que declara `personal: ['contato']` num conector, por quem não tem contato, é recusado com o tipo; por quem tem, publica | `connectors/publish.test.ts`, "tipo que o papel não tem" | must |
| 16 | U3 | Uma versão publicada antes do campo lê com os tipos do papel de quem a enviou (`sentBy`), lido a cada chamada; se essa pessoa saiu da empresa, sem tipo nenhum | `connectors/app-calls.test.ts`, "versão anterior ao campo" | must |
| 17 | U4 | Em Papéis, Membro mostra os três tipos desmarcáveis; Dono mostra os três marcados e travados; salvar marca o tipo e a lista seguinte o mostra; sensível não aparece | `apps/web/src/hub/identity/roles-personal.test.tsx` | must |
| 18 | U5 | Uma cópia ligada por quem tem contato guarda a coluna `buyer.nickname`; o Projeto liberado por quem não tem contato não lê essa coluna (42501); desligar a ligação apaga a coluna | `copies/personal-columns.test.ts` | must |
| 19 | U5 | Ligar uma proposta com coluna de um tipo que o papel de quem liga não tem é recusado com o tipo | `copies/accept-v2.test.ts`, "tipo que quem liga não tem" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Papéis, seção Dados pessoais de clientes | os três desmarcados em Desenvolvedor, Membro e papel novo | não existe: os três tipos sempre aparecem | a do editor de hoje | o `FormAlert` de hoje, com `PERSONAL_KIND_UNKNOWN` | `ROLE_NOT_FOUND` de hoje | quem não gere papéis não chega (`manageRoles`) | Dono e Administrador: marcados e travados |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Operation.personal` | o autor do conector | a conformidade (U2), `readThrough` (U2), a cópia (U5) |
| `ReadDoor.personalColumns` | o autor do conector (U2) | `shapeDoor` (U2) |
| `ConnectorCall.sentBy` | `handoff.ts` (U3) | `app-calls.ts` (U3), só para a versão anterior ao campo |
| `RoleView.personal` | `readRoles` (U1) | a tela de Papéis (U4) |
| `RoleCreate.personal`, `RoleChange.personal` | a tela (U4) | `permissionOf` (U1) |
| `Speaker` `VERSION` `.personal` | `app-calls.ts` pela versão (U3); `copy-port.ts` pela cópia (U5, `[]` antes) | `personalKindsOf` (U2) |
| manifesto `connectors[].personal` | o Builder | Publicar (U3), `app-calls.ts` (U3) |
| `CONNECTOR_CALLED.personal`, `.withheld` | `readThrough` (U2) | quem lê o registro (o "registro de acesso" que o Mercado Livre pede) |

A tela muda uma seção de um editor que existe; o desenho segue `role-unattended.tsx`, a seção
"Agentes" do mesmo editor, com uma caixa por tipo.

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio | Uma dependência fora | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `updateOrgRole` e `createOrgRole` com `personal` (better-auth) | a trava da empresa de hoje (`lockCompany`) | a biblioteca recusa: nada gravado, a transação desfaz | `DATABASE_UNAVAILABLE` de hoje | `ROLE_UPDATED` (`company-routes.ts:257-265`), com os tipos em `added`/`removed` | 6, 7 |
| `GRANT SELECT (colunas)` ao Projeto (U5) | repete sem efeito | a liberação desfeita, como `undoRelease` (`copies/grants.ts:33-48`) | `COPY_DATABASE_UNAVAILABLE` | `COPY_GRANT_FAILED` de hoje | 18 |
| `ALTER TABLE ... DROP COLUMN` das colunas pessoais ao Desligar (U5) | a trava da cópia | a coluna fica e é apagada no próximo Desligar ou Ligar, como `copy_table_left` do Sync | anotada para depois | `COPY_PERSONAL_DROP_FAILED` | 18 |

As leituras não gravam nada novo; o escalar do registro não é gravação.

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A lista fixa de tipos | U1 | nada | Shopify (níveis de campo do cliente, documentado); LGPD art. 5º II e art. 11 (sensível à parte) | poucos níveis fixos, liberados à parte | embrulhado: `PERSONAL_KINDS` no kit | conformidade (crit. 4) | A1, `D1` | `packages/connectors/src/kernel/personal.ts` |
| O conector declara caminho e tipo | U2 | `mercado-livre/operations/shared.ts:47` (`omit`, sem tipo); o Sankhya sem nada | n8n `interfaces.ts:3245-3251`, `FormTriggerV2.node.ts:100`, `FormTriggerV2.node.test.ts:651-661` | o nó declara caminhos com ponto; a plataforma oculta | embrulhado: `personal` na `Operation` no lugar do `omit` | crit. 1, 3 | B1 ("a lógica") | — |
| A conferência das formas não declaradas | U2 | nada | nenhuma (procurado em n8n, Airbyte, nango, twenty) | — | remendo: só no teste, com `isValidCpf`, `isValidEmail`, `isValidPhone` da biblioteca instalada | crit. 2, com `@brazilian-utils/brazilian-utils@2.5.0`; entrada em `docs/reference/boundaries.md` | B1 ("vale a pena? referências fazem?"): esta página | — |
| Os tipos como permissão do papel | U1 | `identity/roles.ts:68-82` (recursos e ações), `role-statements.ts`, `company-roles.ts:237-244` | better-auth 1.7.8 `createAccessControl`, `hasPermission`, `createOrgRole`/`updateOrgRole` (o editor de hoje); twenty `field-permission.entity.ts:65-66` | uma ação no papel, lida a cada chamada | nativo: recurso `personal` com as ações `contato`, `endereco`, `documento`, `sensivel` | — | A1 ("para dar para outro cargo") | — |
| Aplicação num ponto | U2 | o corte dentro de `mercado-livre/answers.ts:101-126`, antes do papel | twenty `common-select-fields-builder.ts:46-52`; n8n `node-defined-field-redaction.strategy.ts:44-69` | um filtro único sobre o resultado | embrulhado: `shapePersonal`, função pura, chamada em `readThrough` depois de `answerOf` | crit. 8 | — | `apps/server/src/hub/connectors/personal.ts` |
| Documento nunca ao modelo | U2 | `cut.ts` (só tamanho) | Mastra `PIIDetector` (`pii-detector.d.ts:97,105`), por modelo; LGPD art. 33 | detecção por LLM | embrulhado: o leitor `assistant`/`builder` perde `documento` | crit. 9 | B1 | — |
| A porta genérica do Sankhya | U2 | `sankhya/door.ts:69-145` (qualquer coluna); `sankhya/skill/SKILL.md:21` (RH só por texto) | n8n `unknownNodes` oculta tudo do que não conhece (`node-defined-field-redaction.strategy.ts:52-58`); Postgres `GRANT SELECT (colunas)` (PostgREST `test/spec/fixtures/privileges.sql:55`) | fechar o que não se conhece; ou o banco libera por coluna | remendo: colunas pelo nome, formas conhecidas nas células, `TFP` recusado | crit. 11, com `@brazilian-utils/brazilian-utils@2.5.0`; entrada em `docs/reference/boundaries.md` | G | — |
| O registro sem o valor | U2 | `read.ts:189-204` (`CONNECTOR_CALLED`, escalares) | n8n `execution-redaction.service.ts:250` (o evento da revelação; as recusas em `:133,145,168`); Mercado Livre "registro de acesso" (documentado) | um evento por revelação | embrulhado: dois escalares na linha que já existe (security S41) | crit. 12 | — | — |
| O app declara os tipos | U3 | `app-contract/src/manifest.ts:46-57`; `publish-check.ts:35-61` (`C1`) | Shopify (a liberação é do app); a `C1` da etapa 20 | o app pede o nível; a plataforma confere | nativo: estende o manifesto e a conferência de Publicar | — | F | — |
| A tela de Papéis | U4 | `apps/web/src/hub/identity/role-editor.tsx:152`, `role-unattended.tsx` | a seção Agentes do mesmo editor | uma caixa por ação | nativo | — | A1 | `apps/web/src/hub/identity/role-personal.tsx` |
| A cópia guarda só o liberado | U5 | o critério 10 do Sync; `copies/grants.ts` (`GRANT` da tabela) | Airbyte `docs/platform/using-airbyte/mappings.md:7` (por conexão); PostgREST `privileges.sql:55` | por conexão; coluna liberada por `GRANT` | nativo: `GRANT SELECT (colunas)` | — | `C1` | — |
| Apagar ao desligar | U5 | o Desligar do Sync U3 (`copy_table_left`) | Mercado Livre (termos e segurança, documentado) | apagar as cópias e a PII | embrulhado: no mesmo Desligar | crit. 18 | `C1` | — |

**Ficam fora da tabela, com a razão.** RH e dados sensíveis (`SKILL.md:21`, LGPD art. 11): `D1`; a porta recusa `TFP` (G, U2). A detecção por modelo (o `PIIDetector` do Mastra): a declaração é determinística e mais barata; o detector fica como rede opcional para texto livre, num cartão futuro.

**A medida do transplante.** Nada vem do repositório antigo.

**A dívida.** O corpo de uma recusa do provedor vai inteiro ao modelo (`read.ts:37-40`); se um
provedor devolver dado pessoal numa recusa, ele passa. Fica para a seção 11 da arquitetura.

## U1 Os tipos nos papéis

**Base e modelo.** `main` do dia. Sonnet: segue o padrão de `UNATTENDED`.

### As linhas da tabela

A lista fixa de tipos (só a constante); os tipos como permissão do papel.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/personal.ts`, `index.ts` | cria a lista `PERSONAL_KINDS` | o servidor, pelo `RoleKit` |
| `apps/server/src/hub/identity/` | muda `roles.ts`, `role-statements.ts`, `company-roles.ts`, `may-use.ts`, `public.ts` | `connectors/read.ts` (U2), `publish-check.ts` (U3) |
| `apps/server/src/hub/connectors/role-kit.ts`, `apps/server/src/main.ts` | o kit entrega os tipos à identidade (S36) | a identidade |
| `packages/hub-api/src/{company-roles,failures}.ts` | `personal` em `RoleView`, `RoleCreate`, `RoleChange`; o texto de `PERSONAL_KIND_UNKNOWN` | a tela (U4) |

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/personal.ts (dono dos tipos, C26)
export const PERSONAL_KINDS = ['contato', 'endereco', 'documento', 'sensivel'] as const
export type PersonalKind = (typeof PERSONAL_KINDS)[number]
// roles.ts: RoleKit ganha `personalKinds: readonly string[]` (do kit, pelo main.ts)
// createAccessControl({... , personal: ['contato','endereco','documento','sensivel'] })
// owner e admin: personal: ['contato','endereco','documento']; developer, member: nada
// hub-api company-roles.ts
RoleView: { ...; personal: z.array(PersonalKindText) }          // dono e admin, sempre os três
RoleCreate, RoleChange: { ...; personal: z.array(PersonalKindText).max(3).optional() }
// may-use.ts
personalKinds(companyId: CompanyId, speaker: PersonSpeaker): Promise<readonly PersonalKind[]>
```

`PersonalKindText` é `z.string().regex(/^[a-z]{1,20}$/)`: o id de tipo é texto com forma nos
contratos e é conferido contra o kit no servidor, como `ConnectorId` (`hub-api/src/company-roles.ts:7`,
C23); `permissionOf` recusa `sensivel` e o desconhecido com `malformed('PERSONAL_KIND_UNKNOWN')`.
`personalKinds` faz uma leitura de `hasPermission` por tipo, com `useMemoryCache` como `mayUseEach`
(`may-use.ts:88-112`). `actionsOf` passa a somar os tipos dados e tirados. Nenhuma migração: os
papéis guardados não têm o recurso e respondem "não" (A1); os de dono e administrador vêm do código.
Modelo: `company-roles.ts` cumpre C21 (`RoleView.kind`), C23 (`Role`, `ConnectorId`) e C26
(`UNATTENDED_ACTION` num dono).

### As skills e a leitura

`better-auth-best-practices`, `organization-best-practices` (`stack.md`, linha `better-auth`).

### A ordem do trabalho

1. `personal.ts` com a lista. 2. `roles.ts`: o recurso e os papéis fixos. 3. `role-statements.ts`
e `company-roles.ts` (`permissionOf`, `readRoles`, `actionsOf`). 4. `may-use.ts`: `personalKinds`.
5. `hub-api`. Regras: C23, C26, S36, S41.

### Como se prova

Critérios 5 a 7, pela rota pública (T5). Falha hoje: `RoleView` não tem `personal`.

### Parar se

A biblioteca recusa criar um papel com um recurso que o criador não tem e o dono não tiver
`sensivel`: é o comportamento esperado (`D1`); se recusar `contato`, parar e relatar.

## U2 A declaração e a aplicação num ponto

**Base e modelo.** U1, e a U2b do Sync no `main` (pasta do Mercado Livre, L1). Opus: desenho entre
módulos (kit, identidade, leitores) e a porta. A declaração e a aplicação são uma unidade porque a
conformidade lê o valor que `operation.answer` devolve (`conformance-session.ts:134-139`), e esse
valor já sai sem o `omit` (`mercado-livre/answers.ts:124-126`): enquanto o `omit` corta, um caminho
declarado não existe no valor; e tirar o `omit` sem a aplicação entregaria o comprador a todos.

### As linhas da tabela

A declaração; a conferência das formas não declaradas; a aplicação num ponto; documento nunca ao
modelo; a porta do Sankhya (G1); o registro.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | muda `personal.ts` (`PersonalField`, `findUndeclared`), `operation.ts`, `definition.ts` (`ReadDoor.personalColumns`), `conformance.ts`, `index.ts` | todo conector; o servidor |
| `packages/connectors/src/mercado-livre/` | apaga `omit`, `BUYER` de `vendas.ts`, `without` e o corte de `rows()` (`answers.ts:78-126`, `shared.ts:47,56-61`); declara `personal`; troca os `summary` que dizem que o comprador não vem (`envios.ts:12`, `faturamento.ts:55`) e a skill; planta a cidade da entrega no dublê | o kit |
| `packages/connectors/src/sankhya/` | declara `personal` em `operations/{buscas,cadastros}.ts` e `personalColumns` em `door.ts`; a recusa de `TFP` em `read-only-sql.ts` | o kit |
| `packages/connectors/package.json` | acrescenta `@brazilian-utils/brazilian-utils` (já no lock, pelo `hub-api`) | — |
| `apps/server/src/hub/connectors/` | cria `personal.ts`; muda `read.ts`, `rows.ts` (`Deps.identity`), `test-write.ts:113` | `app-calls.ts`, `builder-port.ts`, `assistant-port.ts`, `copy-port.ts`, `notes.ts` |
| `apps/server/src/hub/identity/may-use.ts` | `Speaker` `VERSION` ganha `personal: readonly PersonalKind[]` | passam `[]`: `builder/agents/tools.ts:184`, `agent.ts:207,242`, `frozen.ts:145,234` (escritas de agente), `copy-port.ts:145`, e os testes `role-doors.test.ts`, `code-tool.test.ts`, `publish.test.ts`, `registry-line.test.ts`; `app-calls.ts:105` muda na U3 |

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/personal.ts
/** Um caminho com ponto relativo a cada linha de `linhas`, ou ao valor quando ele não tem `linhas`. */
export type PersonalField = Readonly<{ path: string; kind: PersonalKind }>
/** As formas conhecidas achadas num valor fora dos caminhos dados: caminho e tipo, nunca o valor. */
export function findUndeclared(value: unknown, declared: readonly PersonalField[]): readonly Readonly<{ path: string; kind: 'documento' | 'contato' }>[]
// operation.ts, em Operation: personal?: readonly PersonalField[]
// definition.ts, em ReadDoor: personalColumns?: readonly Readonly<{ column: string; kind: PersonalKind }>[]
// apps/server/src/hub/connectors/personal.ts
export function shapePersonal(value: unknown, personal: readonly PersonalField[], allowed: ReadonlySet<PersonalKind>): Readonly<{ value: unknown; given: PersonalKind[]; withheld: PersonalKind[] }>
export function shapeDoor(value: unknown, columns: readonly Readonly<{ column: string; kind: PersonalKind }>[], allowed: ReadonlySet<PersonalKind>): ReturnType<typeof shapePersonal>
/** Os tipos de quem a resposta serve: o papel da pessoa, ou o que a versão declara; menos documento para um modelo. */
async function personalKindsOf(deps: Deps, a: ReadRequest): Promise<ReadonlySet<PersonalKind>>
```

`defineOperation` confere cada `kind` com `z.enum(PERSONAL_KINDS)`. **O caminho mais específico
vence:** `buyer` contato e `buyer.billing_info` documento quer dizer que quem tem contato e não tem
documento recebe `buyer` sem `billing_info`; `shapePersonal` anda os caminhos do mais fundo ao mais
raso e tira cada um cujo tipo não está em `allowed` (o twenty tira, não mascara). Em `readThrough`,
depois de `answerOf` (`read.ts:181`) e só para `OK`. `by: 'assistant' | 'builder'` tira
`documento`; `sensivel` nunca está num papel. A porta: `shapeDoor` tira as colunas declaradas e as
células que `findUndeclared` acha. `findUndeclared` olha textos e inteiros (um CPF pode vir como
número JSON: o inteiro vira texto de 11 dígitos com zeros à esquerda antes de `isValidCpf`), e
`isValidPhone` só em texto de 10 a 13 dígitos, para não pegar ids. Modelo: `read.ts` cumpre C21
(`ReadAnswer`), C23 (`ConnectorId.parse` na entrada) e C26 (um `readThrough`).

### As skills e a leitura

`stack.md` para `packages/connectors` (`zod`; `@brazilian-utils/brazilian-utils`, README) e para
`apps/server/src/hub` (`better-auth-best-practices`).

### A ordem do trabalho

1. `personal.ts` do kit: `PersonalField` e `findUndeclared`. Regras: C21, C26.
2. `operation.ts` e `definition.ts`: `personal` e `personalColumns`.
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
   nomes que o dublê traz; `sankhyaDoor` com `personalColumns`.
6. Servidor: `personal.ts`; `Speaker` `VERSION` com `personal`, todo construtor passa `[]` (um
   caminho que esquece não compila); `readThrough` com `personalKindsOf`, `shapePersonal` ou
   `shapeDoor`, e os escalares `personal` e `withheld` em `CONNECTOR_CALLED`.
7. `read-only-sql.ts`: recusar `\bTFP\w*` no texto de `consultar`. Regras: S40, S41, C21, T5.

### Como se prova

Critérios 1 a 4 com `node --test` nos arquivos do kit (o crit. 3 tira `buyer` de `pedidos` num teste
e espera a falha); critérios 8 a 14 pelas portas públicas do Assistente, do Builder e da cópia, com o
dublê que planta o comprador (`mercado-livre/fake-data.ts:21-29`). Falha hoje: `personal` não existe,
e o membro e o dono recebem a mesma linha.

### Parar se

O dublê de uma leitura que declara um caminho não o planta: plantar no dublê (T29), nunca tirar a
declaração. Uma forma pega um id que não é pessoal: estreitar a forma e dizer no relatório. Uma porta
chama `readThrough` sem uma pessoa nem uma versão: parar. O teste do critério 10 do Sync quebra por
outro motivo que não o `omit`: parar e relatar.

## U3 O app declara os tipos

**Base e modelo.** U2, no mesmo pull request (sem ela, os apps do Sankhya publicados perderiam
nomes). Sonnet.

### As linhas da tabela

O app declara os tipos.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/app-contract/src/manifest.ts` | `personal` em cada `connectors[]` | o Builder, `hub-api` |
| `packages/hub-api/src/{apps,failures}.ts` | o motivo `PERSONAL_NOT_IN_ROLE` (`apps.ts:191`) e o seu texto | Publicar, a tela de Publicar |
| `apps/server/src/hub/apps/{handoff,versions}.ts` | `ConnectorCall` ganha `sentBy` (`handoff.ts:204-209`; a coluna é `tables.ts:155`) | `app-calls.ts` |
| `apps/server/src/hub/connectors/{publish-check,app-calls}.ts` | a conferência e o `Speaker` | Publicar, o clique do app |
| `packages/app/skills/conexus-data/` | a frase de quando declarar | o Builder |

### Os contratos que a unidade cria

```ts
// manifest.ts, em cada connectors[]: personal: z.array(z.string().regex(/^[a-z]{1,20}$/)).max(3).optional()
// UngrantedBy ganha reason 'PERSONAL_NOT_IN_ROLE' com `kind`
// handoff.ts, ConnectorCall: sentBy: PersonId
```

Uma versão sem o campo lê com os tipos do papel de quem a enviou (`sentBy`, a única pessoa que a
versão guarda), lidos a cada chamada; se essa pessoa saiu da empresa, sem tipo nenhum (como
`builder/agents/tools.ts:221` trata o campo novo de uma versão antiga). Esta regra está na página do
fundador. Uma versão com o campo lê com o que declara, conferido em Publicar contra quem publica.

### As skills e a leitura

`stack.md` para `apps/server/src/hub` e `packages/app`.

### A ordem do trabalho

1. O manifesto. 2. `publish-check.ts`: depois das operações, os tipos contra `personalKinds` de quem
publica. 3. `handoff.ts`: `sentBy`. 4. `app-calls.ts`: o `Speaker` com os tipos da versão, ou os de
`sentBy`. 5. `hub-api`. 6. A skill. Regras: C23, S10.

### Como se prova

Critérios 15 e 16, pela rota de Publicar e pelo clique do app.

### Parar se

Quem publica e quem enviou divergem numa versão antiga e o teste mostra um caso em que isso abre um
tipo que quem publicou não tinha: parar e relatar.

## U4 A tela de Papéis

**Base e modelo.** U1. Sonnet.

### As linhas da tabela

A tela de Papéis.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/identity/` | cria `role-personal.tsx`; muda `role-editor.tsx`, `role-text.ts` | Papéis |

### Os contratos que a unidade cria

Nenhum: lê `RoleView.personal` e manda `personal` em `RoleCreate` e `RoleChange`. Textos: título
"Dados pessoais de clientes"; "Contato (nome, e-mail, telefone)", "Endereço", "Documento (CPF)"; a
dica "Quem tem o papel vê esse tipo de dado nas leituras dos conectores. Documento nunca vai ao
Assistente nem ao Builder."

### As skills e a leitura

`stack.md` para `apps/web/src`: `react-hook-form`, `@base-ui/react`, `shadcn`; [Impeccable](../reference/impeccable.md).

### A ordem do trabalho

1. `role-personal.tsx` no modelo de `role-unattended.tsx`, um `Checkbox` por tipo. 2. No editor de
criar e de abrir, para todo papel; travado em Dono e Administrador. Regras: W23.

### Como se prova

Critério 17; capturas a 1366 e 390 px, nos dois temas (conexus-qa).

### Parar se

Um texto da tela muda o sentido da página: volta ao fundador.

## U5 A coluna pessoal na cópia

**Base e modelo.** U2 e as U3 e U4 do Sync no `main`. Opus: banco da empresa, `GRANT` de coluna e
Desligar.

### As linhas da tabela

A cópia guarda só o liberado; apagar ao desligar.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/` | `accept.ts` (Ligar), `grants.ts` (liberar), o Desligar | a página Cópias, o Builder |
| `apps/server/src/hub/connectors/copy-port.ts` | o `Speaker` da cópia com os tipos dela | a rodada |
| `apps/server/src/platform/copy-sql.ts` | `GRANT SELECT (colunas)`, `DROP COLUMN` | `grants.ts` |

### Os contratos que a unidade cria

```ts
/** O tipo de cada coluna da definição versão 2: o do caminho pessoal que contém o `path` dela, ou nenhum. */
export function personalColumnsOf(definition: CopyDefinitionV2, operation: Operation<unknown, unknown, 'read'>): ReadonlyMap<string, PersonalKind>
```

Ligar confere os tipos das colunas contra `personalKinds` de quem liga (recusa com o tipo). A rodada
fala como `VERSION` com esses tipos. Liberar ao Projeto dá `GRANT SELECT` nas colunas sem tipo e nas
de tipo que quem libera tem. O Desligar apaga as colunas pessoais (o resto segue a regra do Sync).

### As skills e a leitura

[data](../guides/data.md); `@neondatabase/serverless` pelo `stack.md`.

### A ordem do trabalho

1. `personalColumnsOf`. 2. Ligar. 3. `copy-port.ts`. 4. `grants.ts` e `copy-sql.ts`. 5. Desligar.
Regras: D11, D22.

### Como se prova

Critérios 18 e 19, com o PostgreSQL de teste (o login do Projeto lê e recebe 42501 na coluna negada).

### Parar se

O motor do Sync no `main` não guarda o `path` de cada coluna: parar; a U5 volta ao cartão.
