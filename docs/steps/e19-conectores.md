# Etapa 19: Conectores, o kit e a primeira ligação

## A página do fundador

**No fim desta etapa** a Ana liga o Sankhya da empresa dela em **Integrações**, na barra lateral, e
aperta **Testar**: o Conexus mostra, assunto por assunto, o que o usuário de integração consegue ler
(cadastros, produtos, vendas e notas fiscais, estoque, financeiro, preços, logística e a porta de
leitura), sem que ninguém da equipe veja as chaves. Por trás, o **kit de conectores** nasce como um
pacote nosso, com o Sankhya como primeiro conector: 23 leituras prontas da API pública, a porta de
leitura para o resto, o seu dublê, o teste que todo conector passa e a conferência de cada leitura
contra a documentação publicada pelo Sankhya.

**O roteiro de uso.** Padaria Sol: Ana (dona) e Bruno (membro). No computador e no celular, com o
usuário só de leitura do Sankhya de uma empresa (o que você fornece antes).

1. A Ana abre **Integrações**, na barra lateral da empresa, entre os Projetos e as Configurações. Vê
   o Sankhya em "Para ligar", com **Ligar**.
2. Ela toca **Ligar**, cola o Client ID, o Client Secret e o X-Token do usuário de integração e
   confirma. O Sankhya passa para "Ligadas", com "Ligada por Ana em 29/10, ainda não testada". Os
   campos nunca mais aparecem.
3. Ela toca **Testar**. Em menos de um minuto e meio (o Conexus testa as 23 leituras e a porta, uma
   por vez, como o Sankhya exige) aparece "Ligação funcionando" e uma linha por assunto: **Porta de
   leitura**, **Cadastros**, **Produtos**, **Vendas**, **Estoque**, **Financeiro**, **Preços** e
   **Logística**. Um assunto que lê inteiro diz "lê"; senão diz quantas leem e nomeia as outras, cada
   uma com "recusado pelo Sankhya", "resposta que o Conexus não entendeu", "nada para ler" (sem nota
   ou pedido para olhar) ou "não testado: o Sankhya demorou, teste de novo".
4. A sonda de escrita, fora do Conexus. Você entra no Sankhya como o usuário de integração, abre a
   tela do DB Explorer e roda, na tabela de sonda, um de cada vez, comandos que mudariam a tabela
   sem tocar em linha nenhuma: um `UPDATE` e um `DELETE` com `WHERE 1=0`, um
   `INSERT … SELECT … WHERE 1=0` e dois comandos de uma vez. Cada um tem de ser recusado. Só com a
   sua palavra na hora, um `UPDATE` de verdade troca a Descrição da linha de teste para "conexus";
   depois, uma leitura da linha mostra se a escrita passou (se passou, a consulta estruturada
   volta). Isso prova a guarda do próprio Sankhya e a permissão do usuário, o mesmo serviço que a
   porta de leitura chama, sem passar pelo Conexus. Nunca a `TGFPAR` nem outra tabela do negócio.
5. O Bruno abre **Integrações**: vê o Sankhya e o seu estado, sem **Ligar**, **Testar** nem
   **Desligar**, e a frase "Só o dono ou um administrador liga, testa e desliga."
6. A Ana toca **Desligar** e confirma. O Sankhya volta para "Para ligar"; as chaves saem do Hub.

**O que você faz, e quando.** Antes: o usuário só de leitura no Sankhya de uma empresa, com o Client
ID, o Client Secret e o X-Token (o roadmap, linha 19); e, no Construtor de Telas desse Sankhya, uma
tabela de estoque simples para a sonda (por exemplo "Conexus Sonda Estoque", com Código e
Descrição) com uma linha de teste (1, "teste"). No começo: aprova esta página; a sua aprovação
é também a palavra que a regra de dados D11 pede para a lista de permissões do banco ganhar a tabela
da ligação (a U2). No fim: faz o roteiro no computador e no celular com o usuário de verdade, diz o
que viu e aprova os textos da tela.

**Fica de fora.**
- Um app que lê o Sankhya, a liberação por Projeto, a barra do Projeto e o caderno da ligação (`J1`):
  a etapa 20. Nesta etapa as operações prontas e a porta de leitura existem no kit e são usadas só
  pelo **Testar**.
- O Mercado Livre e o OAuth: a 19.1. A Jet: a 20.3. Escrever no Sankhya: nenhuma operação de escrita
  nesta etapa (`M1`: uma escrita do Sankhya vem só como operação pronta, quando uma empresa pedir).
  O "só lê" da porta de leitura é um esforço em duas camadas, não uma garantia: o filtro do
  Conexus (recusa comentários, uma segunda instrução e as palavras de escrita) e a guarda do DB
  Explorer do Sankhya (uma conferência de palavras, não documentada). O usuário de integração não
  impede uma escrita.
- A consulta estruturada, montada pelo Conexus (ou um ORM), no lugar do SQL livre do agente: você
  escolheu começar básico. Volta quando a sonda do passo 4 mostrar uma escrita passando, ou quando
  você pedir.
- "Trocar as chaves" de uma ligação: com as chaves recusadas, a Ana desliga e liga de novo. Volta
  com o "Conectar de novo" da 19.1, que serve a todos os tipos.
- Duas ligações do mesmo conector numa empresa (dois Sankhya): uma por empresa. Volta quando uma
  empresa tiver duas.
- O ambiente de testes do Sankhya (`sandbox`): só o de produção. Volta quando uma empresa der um
  usuário de testes.
- O RH do Sankhya: as 40 leituras de funcionários, salários, férias e faltas. São dados pessoais e
  pedem uma decisão sua sobre eles (a LGPD). Volta quando uma empresa pedir; até lá a skill manda
  não ler as tabelas de RH pela porta.
- As outras leituras da API que ficam de fora das 23 (o caixa e o PDV, cidades, bairros e
  logradouros, TEF, moedas, veículos, motoristas, sugestões, as versões "um por código" que uma lista
  com filtro já responde, e os PDFs da DANFE e do boleto): pouco valor ou só escrita. A porta de
  leitura chega a elas. Uma entra como leitura pronta quando uma empresa precisar.
- A coluna da pessoa na ligação (a sua `C1` recomendava o modelo já com ela): ninguém a escreveria
  nesta etapa, e acrescentar uma coluna vazia depois é uma migração que só adiciona. Entra com as
  ligações pessoais, na 24.
- A conferência de que um conector mudado subiu de versão (a regra do Pipedream, `L1`): com um
  conector só, na versão 1.0.0, não há o que comparar. Entra com a primeira mudança de um conector
  já no `main`.
- Das pendências marcadas para o próximo cartão: nenhuma toca os conectores. As #194, #195 e #197
  (a barra lateral sem botão visível de abrir, sem o atalho de pular, e os rótulos em maiúsculas)
  passam perto e esperam: a 19 só acrescenta uma entrada à barra, sem mudar a moldura.

**As decisões suas nesta etapa.**

Dadas em 2026-10-28, ao primeiro estudo dos conectores: `C1` (a ligação é da empresa), `D` (ligar e
desligar é a capacidade `connection: manage`, da dona e do administrador), `E1` com escrita, `F1` e
`G1`; Integrações na barra lateral, não em Configurações. `A1` (um catálogo de conectores escrito por nós, como um kit). Ao estudo fundo: `I1` (o Sankhya com
operações prontas e a porta de leitura, skill em todos), `J1`, `K1` (o kit é um pacote neste
repositório, com uma parede), `L1` (a ligação guarda a versão do conector), `M1` (cada operação
declara leitura, escrita ou destrutiva), `N` na primeira opção (o executor no Hub, em São Paulo), `O1` e o roteiro
`H`. Sobre o Sankhya, as suas palavras: "ele tem documentação que é API que serve para todos [...]
pedidos, produtos, cadastro de parceiro, impostos e muito mais", e a porta do DB Explorer para o que
cada empresa tem de próprio.

Dadas em 2026-10-29, a esta página:
- **`Q1`**: a empresa cola os três (Client ID, Client Secret e X-Token), como o Conexus OS fazia; o
  Conexus não se registra como parceiro do Sankhya (`Q2`). As suas palavras: "Q1, porque ainda não
  temos tamanho para ser o Q2, até o mitra que é do filho do dono da sankhya é assim". Passar para
  `Q2` depois é tirar dois campos da definição e pôr os dois valores na configuração da instalação.
- **O SQL livre do agente fica** (a consulta livre e a leitura genérica), sabendo que o usuário de
  integração não impede uma escrita e que a guarda do DB Explorer é uma conferência de palavras. As
  suas palavras: "Para mim, isso só vai travar o agente. [...] Vamos começar básico, qualquer coisa
  depois a gente melhora, a gente pode acrescentar um ORM, que aí a gente tem mais controle também,
  entendeu? Mas por agora, não gostaria de querer complicar, não."
- **A sonda de escrita** do passo 4, numa tabela simples de estoque que você cria no Construtor de
  Telas: "vamos escolher uma tabela mais simples, pode ser uma que criar de estoque no construtor de
  telas".
- **As frases do membro** ("5. Aprovado"): "Só o dono ou um administrador liga, testa e desliga." e,
  com as chaves recusadas, "As chaves foram recusadas pelo Sankhya. Peça ao dono ou a um
  administrador para ligar de novo." (o dono e o administrador leem "Desligue e ligue de novo com
  chaves novas.").

Dada em 2026-10-29, ao estudo do catálogo do Sankhya. A sua pergunta: "Uma coisa, no Conector
Sankhya que você falou pedidos, produtos, clientes, impostos, por que somente isso? Você lê a
documentação inteira do Sankhya para criar o integrador e o conector certo? Entende meu ponto? Ou foi
só porque eu tinha falado isso? Porque isso daí foi alguns exemplos que eu dei, mas tem muito mais."
O estudo leu a API pública inteira (171 operações, 121 de leitura) e ofereceu A (uma etapa 19.2
antes da 20) ou B (dentro da 19, agora, antes de juntar). A sua resposta: **"B"**. As leituras
prontas passam de 5 para 23, escritas à mão; um teste confere cada uma contra a documentação que o
Sankhya publica; a skill ganha um mapa de cada assunto para a sua leitura ou, quando a API não tem,
para a tabela que a porta lê; o RH fica de fora até uma empresa pedir.

A decisão nova, que é sua (`R`): **a etapa passa do teto de tamanho.** A regra de entrega L2 pede
cerca de 4.000 linhas de código por etapa, sem contar testes, e manda dividir antes de construir
quando passa. Medidas hoje nos pull requests abertos, as unidades já somam cerca de 3.180 linhas
(acima das 2.780 estimadas); as 23 leituras somam cerca de 1.340. A etapa fica com **cerca de 4.520,
uns 520 acima do teto**.
- **R1 (recomendada):** aceitar a 19 com cerca de 4.520 linhas. Você escolheu B sabendo que chegava
  ao teto; o teto é de planejamento, não uma trava de juntar; e dividir agora é voltar à A.
- **R2:** manter o teto: as 18 leituras novas saem para uma etapa 19.2 (a A), e esta revisão volta
  ao cartão de antes.

O que mudou nesta revisão: a pergunta e o B; as 23 leituras com os seus assuntos; a conferência
contra a documentação do Sankhya; a skill em partes por assunto; o Testar com prazo inteiro e o
resultado por assunto; o RH e as outras leituras em "Fica de fora"; a decisão `R`. Na revisão
anterior: `Q1` decidida; o "só lê" da porta escrito como esforço em duas camadas; a consulta
estruturada em "Fica de fora"; a sonda no roteiro (passo 4, no DB Explorer do próprio Sankhya, sem
tela nova no Conexus) e a tabela de sonda no "Antes"; as duas frases do membro.

**Onde ficam as leituras, e como o agente as aprende.** No pacote de conectores, o Sankhya continua
sendo um conector só, com uma definição; as leituras ficam em arquivos por assunto (cadastros,
produtos, vendas, estoque, financeiro, preços, logística), como gavetas de um mesmo armário. A
skill também é uma só por conector, mas em partes: um texto curto que o agente lê sempre (as regras
que toda leitura segue, a porta de leitura e o índice dos assuntos) e um arquivo por assunto, mais o
mapa das tabelas, que o agente só abre quando a pergunta toca aquele assunto. É o que o Mastra já
faz com as skills de hoje do Construtor: ele mostra ao agente só o nome e a descrição de cada skill;
o agente abre a skill quando precisa, vê a lista das partes e lê só a parte que serve. Assim, perguntar
de estoque não enche a cabeça do agente com o financeiro. Nesta etapa ninguém do Construtor usa isso
ainda: na 20, cada Projeto que libera o Sankhya recebe a skill e as leituras como ferramentas. Lá,
23 ferramentas a mais é um custo de contexto que a 20 mede antes de escolher como entregá-las.

O que a escrita do cartão escolheu dentro do que você já aprovou, para você ver:
- As 23 operações prontas usam a API REST pública do Sankhya, a mesma para todas as empresas, e são
  só de leitura. Os impostos não têm leitura própria na API: vêm nos itens de cada pedido e na nota
  fiscal com itens. A API não tem compras, fornecedores, custos, contabilidade, produção, contratos
  nem comissões: esses vêm pela porta de leitura, e a skill diz em que tabela está cada um. A
  consulta livre (DB Explorer) e a leitura genérica (`loadRecords`) são a porta de leitura, para o
  que cada empresa tem de próprio.
- **A conferência contra a documentação do Sankhya.** O código das leituras é escrito à mão, como
  fazem Nango, Pipedream, Airbyte e os outros; o que se gera da documentação é a conferência. Um
  teste confere que cada leitura pede uma rota que o Sankhya publica, só com os filtros que ele
  aceita, e que a resposta do dublê tem a forma que ele documenta. Para isso o repositório guarda um
  recorte da documentação pública (só as 23 rotas: os filtros e a forma da resposta). A documentação
  diz "Licença Sankhya"; guardar um recorte da documentação pública para conferir o nosso código nos
  parece aceitável, e a alternativa é não guardar e só conferir onde o recorte for baixado, que é
  mais fraco. Se você preferir não guardar, diga na aprovação.
- **O Testar com 23 leituras.** O Sankhya aceita uma chamada por vez em cada sessão, e a Cloudflare
  corta uma resposta aos 100 s. Com 26 chamadas em fila, de até 10 s cada uma, o pior caso passaria
  de 4 minutos. As referências testam a ligação com uma leitura só (o `check` do Airbyte lê um
  fluxo; o Nango chama um endereço de verificação; o n8n faz um pedido de teste), mas você quer ver o
  que o usuário de integração lê, e o Sankhya libera tela por tela, então uma leitura por assunto
  esconderia uma recusa. A escolha: o Testar chama todas, em fila, com **um prazo de 80 s para o
  teste inteiro**; o que não couber no prazo aparece como "não testado: o Sankhya demorou, teste de
  novo". Se cada chamada levar até 3 s, tudo cabe (o tempo real do Sankhya ainda não foi medido: o
  seu Testar no passo 3 o mede); num Sankhya lento, a resposta chega a tempo e diz o que faltou. A porta de leitura vai primeiro, porque é a que o agente mais usa. A
  tela mostra uma linha por assunto. Os valores lidos não saem do Hub: a tela vê só o resultado.
- Quem testa é quem liga (`D`): o dono e o administrador. O membro vê o estado.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U0 | A parede do kit: o kit não importa o Hub nem um driver, e só o executor do Hub importa o kit | `.dependency-cruiser.cjs` | código C75 | `main` |
| U1 | O kit `packages/connectors`: o núcleo (definição, operação com classe e assunto, porta de leitura, login por chave, o pedido montado na origem fixa, o teste comum) e o Sankhya (definição, 23 operações prontas em arquivos por assunto, a porta de leitura, o dublê, a conferência contra a documentação do Sankhya, a skill em partes por assunto) | `packages/connectors/`, `package.json`, `package-lock.json`, `knip.json`, `docs/reference/stack.md` | testes | U0 |
| U2 | A tabela `connectors.connection`, o papel e a função que leem o selo, as permissões e as políticas de linha (D11) | `apps/server/migrations/`, `apps/server/src/hub/connectors/tables.ts`, `apps/server/database-grants.sql`, `apps/server/src/platform/catalog.test.ts` | dados | `main` |
| U3 | A ligação no Hub: o selo `connection`, a capacidade `connection: manage`, o executor (abre o selo, pede o token, uma chamada por vez, prazo por chamada, prazo do Testar inteiro e teto), as rotas Ligar, Testar, Desligar e a lista, o `reseal`, a origem do dublê na configuração, a decisão 0056 | `apps/server/src/hub/connectors/`, `apps/server/src/hub/identity/{roles,admission}.ts`, `apps/server/src/platform/{seal,config}.ts`, `apps/server/src/main.ts`, `apps/server/package.json`, `packages/hub-api/src/`, `docs/decisions/`, `docs/index.md` | segurança | U1, U2 e a U3 da 18 no `main` |
| U4 | A tela **Integrações**: a entrada na barra da empresa, a lista, o Ligar, o Testar com o resultado por assunto, o Desligar, o membro que só lê | `apps/web/src/hub/connectors/`, `apps/web/src/routes/_app/companies/$companyId/`, `docs/reference/screens.md` | web | U3 |

**A entrega.** Cada unidade é o seu próprio pull request sobre o `main` com as anteriores dentro
([entrega L9](../guides/delivery.md)), juntada pelo firstmate ([L13](../guides/delivery.md)). A U0 é
uma conferência nova e entra antes, sozinha ([L20](../guides/delivery.md)); as suas regras passam
vazias até a U1 existir. A U1 e a U2 correm ao mesmo tempo: não dividem pasta. A U2 é o único pull
request que muda a lista de permissões do banco ([D11](../guides/data.md)). A U3 começa quando a U3
da 18 entrar no `main`: as duas mudam `roles.ts` e `admission.ts` ([L1](../guides/delivery.md)).
A ampliação do B (2026-10-29) chega com as unidades já em revisão: ela entra como um commit novo em
cada pull request aberto que muda (U1, depois U3, depois U4, cada um trazendo o anterior), na seção
"A ampliação do B" de cada unidade, sem refazer o que já está lá.

**Orçamento de código alterado.** Medido em 2026-10-29 nos pull requests abertos, sem testes,
migrações geradas nem texto de skill (a estimativa da primeira revisão era ~2.780), mais a
ampliação do B, estimada pelo tamanho da U1 (5 operações, 225 linhas; o dublê, 261):

| Unidade | Hoje no pull request | A ampliação do B | Total |
| --- | ---: | ---: | ---: |
| U0 | ~20 | — | ~20 |
| U1 | ~1.440 | ~1.240: 18 operações ~800, as respostas do dublê ~360, o script da conferência ~60, o assunto no núcleo e a skill em partes ~15, o `carregar` com `H` e `F` ~5 | ~2.680 |
| U2 | ~100 | — | ~100 |
| U3 | ~1.050 | ~40: o prazo do Testar inteiro, `NOT_TESTED`, o assunto no `TestCheck`, a porta primeiro | ~1.090 |
| U4 | ~570 | ~60: o resultado por assunto | ~630 |
| **Etapa** | **~3.180** | **~1.340** | **~4.520** |

Teto 4.000 ([L2](../guides/delivery.md)): **a etapa passa uns 520**, e isso é a decisão `R` do
fundador. Fora da conta: o recorte da documentação do Sankhya (`spec.json`, gerado, ~43 KB) e o
texto da skill (~60 linhas hoje, ~400 com as partes por assunto). Um pacote novo do repositório
(`@conexus/connectors`), nenhuma dependência de fora nova (`z.fromJSONSchema` vem no `zod` 4.6.5
instalado). As linhas da ampliação são hipótese.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U0 | `npm run deps` recusa um arquivo de `packages/connectors/` que importe `apps/`, outro pacote do repositório, `pg`, `drizzle-orm`, `fastify` ou `@mastra/*` (o kit importa só `zod` e o Node); e recusa um arquivo de fora de `apps/server/src/hub/connectors/` e de `tests/` que importe `@conexus/connectors` | `scripts/rules.test.ts`, um arquivo plantado por regra, como as outras | must |
| 2 | U1 | `defineOperation` sem `class`, ou com uma classe fora de `read`, `write`, `destructive`, não compila; a porta de leitura só aceita operações `read` | `packages/connectors/src/kernel/kernel.test.ts`, "a classe é obrigatória" (com `// @ts-expect-error`) | must |
| 3 | U1 | `toRequest` monta o pedido só na origem fixa do conector: um caminho absoluto (`https://…`), com `//` no começo, com `..` ou com `@` lança antes de qualquer `fetch`; a consulta e o corpo vão como o conector os monta | `kernel.test.ts`, "o pedido fica na origem fixa" | must |
| 4 | U1 | `runConformance(sankhya, fake)` passa: ids únicos, versão semver, cada operação com classe, assunto, resumo e `probe`, e cada `read` com `idempotent: true`; cada assunto declarado na definição tem operação e a sua parte da skill (`skill/references/<assunto>.md`); os `probe` em ordem, cada um respondido pelo dublê, passam no esquema de saída; o pedido de token com a chave errada dá `AUTH_REFUSED`; nenhum pedido montado leva um valor da credencial fora do pedido de token e do cabeçalho; o `SKILL.md` nomeia cada assunto e cada entrada da porta, e cada operação é nomeada na parte do seu assunto; o `SKILL.md` fica abaixo das 500 linhas que o Mastra recomenda | `packages/connectors/src/sankhya/sankhya.test.ts`, "o Sankhya passa no teste comum" | must |
| 5 | U1 | A porta de leitura do Sankhya só lê por esforço, em duas camadas, não por garantia (fundador, 2026-10-29): o filtro do Conexus e a guarda do DB Explorer do Sankhya; o usuário de integração não impede uma escrita. O filtro, provado aqui: o esquema de entrada de `consultar` aceita um `SELECT` ou `WITH` e recusa, antes de montar o pedido, um comentário, duas instruções, `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `EXEC`, a citação `q'` do Oracle, também com `WHERE 1=0` e em `INSERT … SELECT`; `carregar` só chama `CRUDServiceProvider.loadRecords`, e o seu critério aceita os cinco tipos que o Sankhya documenta (`D`, `H`, `F`, `I`, `S`) e recusa outro; nenhum outro serviço sai do kit | `sankhya.test.ts`, "a porta de leitura só lê" | must |
| 6 | U1 | Cada uma das 23 operações prontas (a lista em U1, "A API do Sankhya") faz um `GET` na API REST e devolve linhas tipadas, e `tiposOperacao` aceita a lista ou o objeto único que a documentação mostra; um 403 que não é de token vira `REFUSED` (`NO_PERMISSION`); um 400 `RetornoErro`, `REFUSED` (`INPUT`); no login, 400, 401 ou 403 dão `AUTH_REFUSED` (como o OS, `gateway.ts:47`); numa operação, um 401 ou 403 `4303` ou `4405`, `AUTH_REFUSED`; um 403 `GTW3403` (token vencido), `TOKEN_EXPIRED`; na porta, um envelope com `status` diferente de `"1"`, ou um 200 com `[CORE_E…]`, vira `REFUSED` (`VENDOR`); uma resposta fora do esquema, `UNREADABLE`; nunca linhas vazias no lugar de uma recusa | `sankhya.test.ts`, "as operações prontas leem o envelope" | must |
| 7 | U2 | `connectors.connection` guarda uma por (empresa, conector): a segunda dá `23505`; apagar a empresa leva a linha; o login de uma empresa não lê a de outra (RLS); `hub_company` não lê a coluna `sealed`; `connectors.sealed_of(id)` devolve o selo só na empresa da transação | `apps/server/src/hub/connectors/tables.test.ts`, "a ligação: uma por conector, cada empresa a sua, o selo só pela função", por SQL no banco de teste (`createTestDatabase`, como `platform/isolation-model-accounts.test.ts`) | must |
| 8 | U2 | A lista de permissões do banco é a de `database-grants.sql` com as linhas novas, e nenhuma outra muda | `apps/server/src/platform/catalog.test.ts` | must |
| 9 | U3 | `POST /api/companies/{c}/connections` com `{ connector: 'sankhya', credential }`, da dona ou do administrador: 201, a ligação com `state: 'NEW'` e sem nenhum campo da credencial; o membro recebe 404 `NOT_FOUND` (S10); um conector que o kit não tem, 404 `CONNECTOR_UNKNOWN`; uma credencial fora do esquema, 422 `CONNECTION_CREDENTIAL_INVALID`; um segundo Sankhya, 409 `CONNECTION_EXISTS`; a mesma chave de tentativa com outra credencial, 409 `IDEMPOTENCY_CONFLICT`, e com a mesma, a mesma ligação | `apps/server/src/hub/connectors/connections.test.ts`, "ligar: quem pode, e as recusas" | must |
| 10 | U3 | `POST …/connections/{id}/test` com o dublê: 200 `{ result: 'WORKING', checks }`, 25 itens, as duas entradas da porta primeiro e depois as 23 operações na ordem da definição, cada um com o seu assunto e `READS`, `REFUSED`, `UNREADABLE` (a resposta fora do esquema ou acima de 256 KB: aquela linha só), `NOTHING_TO_READ` (o `probe` sem o que ler, como os impostos sem pedido nenhum) ou `NOT_TESTED`; a ligação passa a `ACTIVE` com `testedAt`; com o dublê recusando um serviço, aquele item dá `REFUSED` e os outros `READS` | `connections.test.ts`, "testar: cada parte, com a sua resposta" | must |
| 11 | U3 | Testar com a chave recusada pelo dublê: 200 `{ result: 'AUTH_REFUSED' }` e a ligação passa a `NEEDS_REAUTH`; com o dublê fora do ar, ou mudo além do prazo por chamada (o prazo vem das dependências do Hub, 10 s, e o teste o põe em 200 ms): 200 `{ result: 'UNREACHABLE' }` e o estado não muda; o token que o dublê dá por vencido (403 `GTW3403`) é pedido de novo uma vez, e a segunda vez dá `AUTH_REFUSED`; o membro recebe 404 | `connections.test.ts`, "testar: chave recusada, fornecedor fora" | must |
| 12 | U3 | Uma ligação desligada durante o Testar: o Testar responde 404 `CONNECTION_NOT_FOUND` e nenhuma linha volta; dois Testar ao mesmo tempo pedem um token cada um, os dois dão `WORKING`, e o dublê nunca vê dois pedidos no mesmo token ao mesmo tempo (o envelope "4" do Sankhya: o Testar chama em fila, nunca em paralelo, e o dublê responde "4" a um segundo pedido em curso) | `connections.test.ts`, "testar e desligar juntos; um serviço por token" | must |
| 13 | U3 | `DELETE …/connections/{id}`: 204, também quando a ligação já não existe; depois, a lista não a mostra e um Testar dela dá 404; o membro recebe 404 | `connections.test.ts`, "desligar, e de novo" | must |
| 14 | U3 | `GET /api/companies/{c}/connections`: todo membro lê o catálogo (o Sankhya com os rótulos dos campos) e as ligações (estado, quem ligou, quando, `testedAt`, a versão do conector) e `mayManage`; nenhuma resposta, log ou erro leva um valor da credencial; quem não é membro recebe 404 | `connections.test.ts`, "a lista: o membro lê, nada da credencial sai" | must |
| 15 | U3 | O selo da ligação abre só com o seu contexto: copiado para outra linha, outra empresa ou outro conector, `SEAL_REFUSED`; `reseal` move as ligações seladas com uma chave antiga para a atual e conta `moved` e `refused`, como as contas de modelo (`reseal.ts:73`); uma ligação de um conector que o kit não tem mais conta `refused` | `apps/server/src/hub/connectors/connection-seal.test.ts`, "o selo da ligação e o reseal": o selo copiado por SQL cru no banco de teste, e o `reseal` pelo processo (`spawnHub`, como `model-accounts/reseal.test.ts`) | must |
| 16 | U3 | O executor pede o pedido só à origem do conector, ou à do dublê que a configuração nomeia, que só pode ser `http://127.0.0.1` ou `localhost` (`HUB_CONNECTOR_ORIGINS`); qualquer outra recusa o Hub de subir; um redirecionamento do fornecedor dá `UNREACHABLE`; uma resposta acima de 256 KB é cortada e aquela linha dá `UNREADABLE`; o Hub com uma origem para um conector que o kit não tem não sobe | `apps/server/src/hub/connectors/executor.test.ts`, "a origem, o redirecionamento e o teto", pela rota do Testar com os interruptores do dublê; `apps/server/src/platform/config.test.ts`, "a origem do dublê é só local" | must |
| 17 | U4 | Em **Integrações**, a dona vê "Ligadas" e "Para ligar"; **Ligar** abre o formulário com os três campos, sem mostrar o que foi colado depois de ligar; cada recusa mostra a frase do código no campo ou no formulário; **Testar** mostra "Testando…" e depois o resultado, uma linha por assunto na ordem que o Hub manda: "lê" quando todos os itens do assunto leem, senão "lê n de m" e o rótulo de cada item que não lê com a frase do seu resultado; **Desligar** pede confirmação | `apps/web/src/hub/connectors/integrations.test.tsx`, "a dona liga, testa e desliga" | must |
| 18 | U4 | O membro vê a página, as ligações e o estado, sem **Ligar**, **Testar** nem **Desligar**, e a frase de quem pode (W34, V29); sem ligação nenhuma, "Nenhuma integração ligada ainda."; a lista que não carrega mostra o erro com "Tentar de novo" | `integrations.test.tsx`, "o membro lê; vazio e erro" | must |
| 19 | U4 | A barra da empresa tem **Integrações** entre os Projetos e as Configurações, ativa na página; no celular, na gaveta (V56) | `apps/web/src/routes/_app/companies/$companyId/route.test.tsx`, "Integrações na barra" | must |
| 20 | U4 | Num navegador de verdade (Chrome e WebKit, 1366 e 390 px, os dois temas), o roteiro inteiro com o dublê do Sankhya | o teste das telas (`conexus-qa`) | must |
| 21 | U3 | No Hub de verdade, com o usuário só de leitura que você fornece, o Testar dá `WORKING`; na sonda, no DB Explorer do Sankhya com o usuário de integração, só na tabela de sonda, as quatro escritas sem linha são recusadas, e a leitura depois do `UPDATE` de verdade (só com a palavra do fundador) diz se ele passou: passou, a consulta estruturada volta. Prova a guarda do Sankhya e a permissão do usuário, sem o Conexus | o roteiro de uso, passos 3 e 4, por você (não roda em CI: nenhum Sankhya de verdade em teste, S40) | must |
| 22 | U1 | Cada operação pronta confere com o recorte da documentação do Sankhya guardado em `src/sankhya/spec.json`: o método e o caminho do seu `probe` são uma rota do recorte; cada chave de consulta que ela manda é um parâmetro declarado da rota; a resposta do dublê ao `probe` passa em `z.fromJSONSchema` do esquema 200 da rota; nenhuma rota do recorte fica sem operação. Recusa: o dublê dos clientes sem o endereço que a documentação exige falha (o estudo achou esse desvio na U1 de hoje) | `packages/connectors/src/sankhya/spec.test.ts`, "cada leitura confere com a documentação do Sankhya" | must |
| 23 | U3 | O Testar inteiro tem um prazo, 80 s no Hub (o teste o põe em 1 s): cada chamada tem o prazo menor entre os 10 s e o que falta; quando acaba o prazo, os itens que faltam dão `NOT_TESTED`, o resultado continua `WORKING` e a resposta sai antes do prazo mais uma folga; o login que não cabe no prazo dá `UNREACHABLE` | `connections.test.ts`, "testar: o prazo do teste inteiro", com o interruptor do dublê que demora cada resposta | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Integrações (U4) | nenhuma ligada: "Nenhuma integração ligada ainda." e o Sankhya em "Para ligar" | a mesma frase | a moldura na hora e o esqueleto só na lista (W34) | `ReadFailure` com "Tentar de novo", como Contas de modelo | a empresa que sumiu: a rota da empresa já trata, como hoje | o membro: a lista sem botões e "Só o dono ou um administrador liga, testa e desliga." (V29) | `NEEDS_REAUTH`: ao dono e ao administrador, "As chaves foram recusadas pelo Sankhya. Desligue e ligue de novo com chaves novas."; ao membro, "As chaves foram recusadas pelo Sankhya. Peça ao dono ou a um administrador para ligar de novo."; `UNREACHABLE` no Testar: "O Sankhya não respondeu. Tente de novo em alguns minutos."; a ligação desligada por outra pessoa: a frase de `CONNECTION_NOT_FOUND` e a lista relida |
| Ligar (U4, o diálogo) | os três campos vazios, com o rótulo do catálogo | — | **Ligar** ocupado, os campos travados | a frase do código no campo (`CONNECTION_CREDENTIAL_INVALID`) ou no formulário; "Não confirmamos a ligação. Tente de novo." numa resposta cortada (W24) | `CONNECTOR_UNKNOWN`: a frase, e a lista relida | o membro não abre | `CONNECTION_EXISTS`: a frase, e a lista relida |
| O resultado do Testar (U4) | "Ainda não testada" | — | "Testando…", **Testar** ocupado | `WORKING` com uma linha por assunto, e no assunto que não lê inteiro, os itens `REFUSED` ("recusado pelo Sankhya"), `UNREADABLE` ("resposta que o Conexus não entendeu"), `NOTHING_TO_READ` ("nada para ler") ou `NOT_TESTED` ("não testado: o Sankhya demorou, teste de novo"); `AUTH_REFUSED`; `UNREACHABLE`; cada um com a sua frase | `CONNECTION_NOT_FOUND`: a frase, e a lista relida | o membro vê só o estado e `testedAt` | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `connectors.connection` (a linha, o selo, `connector_version`) | o Ligar (U3) | o Testar; a lista; o `reseal`; na 20, a liberação e o executor dos apps |
| `connection.state` (`NEW`, `ACTIVE`, `NEEDS_REAUTH`) | o Ligar (`NEW`); o Testar (`ACTIVE` ou `NEEDS_REAUTH`) | a lista e a tela |
| `connection.tested_at` | o Testar que obteve `WORKING` ou `AUTH_REFUSED` | a lista e a tela ("testada em 29/10, 14:02") |
| `connection.connector_version` | o Ligar, da definição (`L1`) | a lista; na 20, a liberação compara a versão |
| `ConnectorEntry` (id, nome, versão, campos com rótulo) | a lista, do kit | a tela: "Para ligar" e o formulário |
| `TestResult` (`result`, `checks`, cada um com `subject`) | o Testar | a tela, só no momento: não se guarda (os valores lidos não saem do executor) |
| `Operation.subject`, `Connector.subjects` (id e rótulo do assunto) | o kit (U1) | a conformidade (cada assunto com a sua parte da skill); o Testar (o rótulo em cada item); na 20, a skill e as ferramentas |
| `src/sankhya/spec.json` (o recorte da documentação do Sankhya) | `scripts/sankhya-spec.ts`, rodado à mão | `spec.test.ts` |
| `ConnectionList.mayManage` | a lista, por `allows(role, 'manageConnections')` | a tela: os botões |
| `Operation.class`, `idempotent`, `probe` | o kit (U1) | o teste comum; o Testar (`probe`); na 20 e 24, a liberação e a aprovação |

**Desenho de caixas.** Do estudo fundo, 4.5, aprovado com `O1`. Não há captura do produto antigo: o
OS tinha Integrações na barra do Projeto (`apps/web/src/app/shell.tsx:91-104` em `e0353c36`), sem
página de ligar por chave que um estudo tenha rodado. As peças são as de Contas de modelo (a tabela,
o diálogo de ligar, o `AlertDialog`).

```text
1280 px, Integrações (a dona)
+------------------------+--------------------------------------------------------------+
| Padaria Sol      v     |  Integrações                                                 |
|  Início                |  Ligadas                                                     |
|  Projetos          +   |  [S] Sankhya   Funcionando · testada em 29/10, 14:02         |
|    Encomendas          |                Ligada por Ana em 29/10      [Testar] [Desligar]|
|  Integrações   <       |      Porta de leitura: lê 1 de 2 · Consulta livre recusado   |
|                        |      Cadastros: lê        Produtos: lê                       |
|                        |      Vendas: lê 5 de 6 · Notas canceladas recusado           |
|                        |      Estoque: lê   Financeiro: lê   Preços: lê               |
|                        |      Logística: lê                                           |
|  Configurações         |  Para ligar                                                  |
|  Ana Lima        v     |  (nenhum outro conector ainda)                               |
+------------------------+--------------------------------------------------------------+

Ligar Sankhya (diálogo)
  Client ID      [______________________]
  Client Secret  [______________________]
  X-Token        [______________________]
  As chaves ficam guardadas no Hub e não aparecem de novo.      [Cancelar] [Ligar]

390 px
  [=] Integrações
  Sankhya
  Funcionando · testada em 29/10
  [Testar]                [Desligar]
  Porta de leitura: lê
  Cadastros: lê
  Vendas: lê 5 de 6
    Notas canceladas recusado
  …
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Ligar (`POST …/connections`) | a trava da linha do membro (`locks`, S8) e a chave de tentativa (C37): a segunda com a mesma chave devolve a mesma ligação; duas pessoas com chaves diferentes não se travam (cada uma trava a sua linha de membro), e a segunda dá `23505` em `connection_connector_key`, que `connections.ts` traduz para `CONNECTION_EXISTS`; uma resposta cortada, 502 ou 503, repetida com a mesma chave, dá a mesma ligação | uma transação: a linha com o selo, ou nada | o banco fora: `DATABASE_UNAVAILABLE`, como hoje | `CONNECTION_LINKED` com `by`, `companyId`, `connectionId`, `connector` | 9 |
| Testar (`POST …/test`), três passos: ler o selo; o login e as chamadas ao Sankhya; gravar o estado | dois Testar: cada um pede o seu token (nesta etapa nenhum token é guardado) e as chamadas de cada token vão uma por vez; o último estado gravado vale | o selo lido numa transação curta, sem conexão do banco presa durante as chamadas (D22); o estado gravado só se a linha ainda é a mesma (`id` e `linked_at`), senão 404 `CONNECTION_NOT_FOUND` e nada muda; o selo que não abre: 500 `SEAL_REFUSED` (a de hoje, `model-account-failures.ts:5`), antes de chamar o Sankhya | o banco fora no primeiro ou no último passo: `DATABASE_UNAVAILABLE`, e o estado não muda; o Sankhya fora ou mudo além de 10 s por chamada: `UNREACHABLE`, o estado não muda; o Sankhya lento além dos 80 s do teste inteiro: os itens que faltam dão `NOT_TESTED` e a resposta sai antes dos 100 s da Cloudflare; repetir é seguro (só leitura) | `CONNECTION_TESTED` com `by`, `connectionId`, `result` e a contagem de cada `outcome`; nunca um valor lido, um SQL ou um corpo (S41) | 10, 11, 12, 23 |
| Desligar (`DELETE …/connections/{id}`) | a trava do membro: o segundo dá 204 | uma instrução; um Testar em curso termina em 404 | o banco fora: a frase; nada mudou | `CONNECTION_REMOVED` com `by`, `connectionId` | 12, 13 |
| O login no Sankhya (`POST /authenticate`, do executor) | um por Testar | a chave recusada (400, 401 ou 403): `AUTH_REFUSED` | o Sankhya fora: `UNREACHABLE` | nada além da linha do Testar | 11 |
| `reseal` das ligações (o comando de hoje, que passa a cobrir as ligações) | o comando roda sozinho, como hoje | uma transação por empresa, como as contas de modelo | um selo que não abre fica e é contado `refused`; nenhum abre: o comando falha, como hoje | as contagens de hoje, com as das ligações | 15 |
| As migrações da U2 | o Hub sobe um por vez | uma transação | o Hub não sobe, como hoje | como hoje | 7, 8 |

## A tabela de referência

As referências estão na estante de estudo nos commits do estudo fundo (`~/conexus-study/refs/`,
`MANIFEST.md`): Activepieces `f34c43cd`, Nango `e6c6131`, Pipedream `05b24f0e`, n8n `2e855356`,
Airbyte `8aed3123`, Mastra 1.79 instalado; o OS em `e0353c36`. A documentação do Sankhya foi lida em
2026-10-28 pelo Context7 e por `developer.sankhya.com.br` (U1, "A API do Sankhya") e, inteira, em
2026-10-29 pelo estudo do catálogo: as 186 páginas do `llms.txt`, 171 com o seu OpenAPI embutido.

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A parede do kit | U0 | `.dependency-cruiser.cjs` (regras `mastra-only-in-builder`, `driver-only-in-the-database-modules`) | Activepieces `packages/pieces/framework` (o núcleo sem servidor); dependency-cruiser 18.4 `forbidden` | o núcleo de conector não conhece o servidor | nativo: duas regras `forbidden` | o critério 1 | `K1` | — |
| O núcleo do kit (definição) | U1 | nenhum | Activepieces `packages/pieces/framework/src/lib/piece-metadata.ts:61-66`; Nango `packages/providers/providers.yaml:9368-9400` (a entrada de provedor: modo de login, URL do token, base fixa, campos); nenhuma faz a peça para o nosso executor e o nosso selo | uma definição por conector, com o login declarado e a base fixa | remendo: nenhuma biblioteca serve ao nosso executor e ao selo; a forma é a do Activepieces e do Nango, o código é nosso | o critério 4 (o teste comum); `docs/decisions/0056` | `A1`, `K1` | `packages/connectors/src/kernel/definition.ts` |
| A classe da operação | U1 | nenhum | Activepieces `ActionClassification = READ, SEARCH, WRITE, DESTRUCTIVE` (`piece-metadata.ts:61`); Pipedream `components/github/actions/create-issue/create-issue.mjs:8-12` (`annotations`) | uma classe por ação | embrulhado: campo obrigatório, sem padrão (o "sem classe vale escrita" do Activepieces é a armadilha evitada) | o critério 2 | `M1` | `packages/connectors/src/kernel/operation.ts` |
| A versão do conector | U1, U2 | nenhum | Activepieces `community/github/package.json:3` (semver por conector) | versão por conector | embrulhado: `version` na definição, guardada na ligação | o critério 4 (semver) e 9 (a ligação a guarda) | `L1` | — |
| O pedido na origem fixa | U1, U3 | nenhum | OS `apps/hub/src/connectors/native.ts` `pinnedUrl`; OS `sankhya/gateway.ts:12,39-43` (as duas origens publicadas, `redirect: 'error'` em `:55`) | a URL é montada da origem fixa, nunca do texto de quem chama | embrulhado: `toRequest(connector, request, token)` no kit, a única montagem de URL; o executor só envia | o critério 3 | não precisa | `packages/connectors/src/kernel/request.ts` |
| O login por chave (`client_credentials`) | U1, U3 | nenhum | Sankhya `POST /authenticate` (U1, "A API do Sankhya"); OS `sankhya/gateway.ts:139-151` | o pedido de token declarado; o executor o envia | embrulhado: o kit declara o login e monta o pedido de token como função pura; abrir o selo, enviar e guardar o token é só do executor (S36) | os critérios 4 e 11 | não precisa | `packages/connectors/src/kernel/auth.ts` |
| Uma chamada por token | U3 | nenhum | OS `connectors/token-cache.ts:22-30` (`inLane`: um token do Sankhya é uma sessão, e uma segunda chamada em curso cancela a primeira, envelope "4") | uma fila por token | embrulhado (herdado do OS): `oneRequestAtATime` na definição; nesta etapa só o Testar chama, em fila; a fila por token do executor entra com a 20, quando um token for reusado | o critério 12 | não precisa | — |
| O teste comum e o dublê | U1 | nenhum | Airbyte CAT (um teste para todos, **relay**); Nango `NangoActionMock` (**relay**); OS `scripts/builder-eval/sankhya-sim.mjs` (o simulador de `loadRecords`) | um harness por conector, contra respostas gravadas | embrulhado: `runConformance` puro (sem rede) e `fake.ts` por conector, que serve aos testes, ao Hub local e ao QA | o critério 4 | não precisa | `packages/connectors/src/kernel/conformance.ts`, `packages/connectors/src/sankhya/fake.ts` |
| As operações prontas do Sankhya | U1 | nenhum | Sankhya API REST v1 (as 23 rotas de U1, "A API do Sankhya"); Nango (hubspot 49 ações escritas à mão), Pipedream (109), Airbyte (`source-stripe/manifest.yaml`, 47 fluxos declarados): a operação é escrita à mão, mesmo com OpenAPI publicado | a API pública, a mesma para todas as empresas; as referências escrevem à mão as operações que os clientes usam e deixam uma porta genérica para o resto | nativo: o fornecedor já tem a operação; 23 `read` tipadas, uma por recurso, em arquivos por assunto, e os impostos lidos dos itens do pedido e da nota | os critérios 6 e 22 | `I1`; B (2026-10-29) | `packages/connectors/src/sankhya/operations/{cadastros,produtos,vendas,estoque,financeiro,precos,logistica,shared,index}.ts` |
| A conferência contra a documentação do Sankhya | U1 | nenhum | o OpenAPI 3.0.3 embutido em cada página `developer.sankhya.com.br/reference/<página>.md`; `zod` 4.6.5 `fromJSONSchema` (`node_modules/zod/v4/classic/external.d.ts:12`); Airbyte gera esquemas do OpenAPI, nunca o conector (`docs/platform/connector-development/cdk-python/schemas.md:17`) | o OpenAPI do fornecedor serve para esquemas e conferências; nenhuma referência gera o catálogo dele | nativo: `z.fromJSONSchema` sobre o esquema 200 recortado; o script que baixa e recorta é nosso (~60 linhas), rodado à mão | o critério 22 | B | `packages/connectors/scripts/sankhya-spec.ts`, `src/sankhya/spec.json`, `src/sankhya/spec.test.ts` |
| O teste da ligação (o Testar) | U3 | nenhum | Airbyte `check: CheckStream` com `stream_names` (`source-hubspot/manifest.yaml:5-8`, `source-stripe/manifest.yaml:5-8`): lê um fluxo; Nango `verification.endpoints` (`packages/providers/providers.yaml:11-14`): um endereço; n8n `ICredentialTestRequest` (`credentials/HubspotApi.credentials.ts:41-46`): um pedido; Pipedream: o teste da conta fica na plataforma, fora do repositório (não verificado) | uma leitura só prova a chave; nenhuma prova a permissão por operação | embrulhado: todas as leituras, em fila, sob um prazo do teste inteiro (80 s, abaixo dos 100 s da Cloudflare, `platform/http.ts:24-26`), o que não cabe sai `NOT_TESTED`; o Sankhya libera tela por tela, e o fundador quer ver o que o usuário lê | os critérios 10, 11 e 23 | `D`; B | — |
| A porta de leitura do Sankhya | U1 | nenhum | OS `sankhya/gateway.ts:22-30` (a lista de serviços de leitura), `read-only-sql.ts` (a instrução única), `:34` (o teto de 256 KB); OS `apps/hub/src/builder/handler-kit/sankhya.ts:39-52,84-90` (a leitura das respostas de `loadRecords` e `executeQuery`, que rodou com um Sankhya de verdade); Sankhya `loadRecords` (documentado) | a lista de dois serviços; o SQL conferido | embrulhado: `defineReadDoor` com `consultar` e `carregar`, só `read`; o "só lê" é esforço em duas camadas, o filtro do Conexus e a guarda do DB Explorer, não garantia (fundador, 2026-10-29; o usuário de integração não impede uma escrita) | o critério 5 | `I1` | `packages/connectors/src/sankhya/door.ts`, `read-only-sql.ts` |
| A skill do Sankhya | U1 | `packages/app/skills/*` | OS `builder-skills/conexus-sankhya/SKILL.md` e `references/topics.md`, `traps.md` (o dicionário `TDDCAM`, `TDDOPC`, `AD_`) e Agent Skills (a revelação aos poucos: o `SKILL.md` curto, as partes em `references/`); Mastra 1.79 instalado: o agente vê só nome e descrição (`SkillsProcessor`, `dist/agent-tuAMgHe3.js:20244`), a ferramenta `skill` devolve o `SKILL.md` e a lista das partes (`dist/workspace-BR4DJXoq.js:6198`, `:6225`), `skill_read` lê uma parte quando o agente pede (`:6296-6297`), e `createSkill({ references })` leva as partes de uma skill escrita em código (`dist/docs/references/docs-skills.md:49,74`), como o Construtor já faz (`apps/server/src/builder/conversation/instructions.ts:57-72`) | a skill ensina a descobrir o que cada empresa tem; as partes se leem só quando a pergunta as toca | nativo (as skills já são o meio do Builder, 0055): uma skill por conector, o `SKILL.md` com as regras, a porta e o índice dos assuntos, uma parte por assunto e o mapa das tabelas; o Builder a carrega na 20 com `createSkill` | o critério 4 (cada assunto com a sua parte, cada operação na parte do seu assunto) | `I1`, `J1`; B | `packages/connectors/src/sankhya/skill/SKILL.md`, `skill/references/{cadastros,produtos,vendas,estoque,financeiro,precos,logistica,tabelas}.md` |
| A ligação (a conta da empresa) | U2, U3 | as contas de modelo (`apps/server/src/builder/model-accounts/tables.ts:51-99`) | Mastra Connect `client.ts` (estados `active`, `needs_reauth`, `error`); Nango (a ligação separada da integração) | uma linha por conta, com estado | embrulhado: `connectors.connection`, como `model_account`: empresa, conector, versão, estado, selo, quem ligou | os critérios 7 e 9 | `C1`, `D` | `apps/server/src/hub/connectors/tables.ts` |
| O selo da ligação | U2, U3 | `apps/server/src/platform/seal.ts:41-48` (`SealContext`), `builder.sealed_of` (`migrations/20261019110219_model_accounts_grants`) | n8n `Cipher` (**relay**) | selar com a chave do servidor | embrulhado (herdado das contas de modelo): o propósito `connection`, a função `connectors.sealed_of` do papel `hub_connection_seals`, como `hub_model_seals` | o critério 15 | não precisa | — |
| Quem liga, testa e desliga | U3 | `admission.ts:38-71` `ACTIONS`; `roles.ts:10-37` | better-auth 1.7.8 `plugins/access` | papéis mapeados para capacidades | nativo: `connection: ['manage']` em `ACCESS_CONTROL` e `MANAGE_COMPANY`; as ações `readConnections` e `manageConnections` | os critérios 9, 11, 13 | `D` | — |
| O executor | U3 | nenhum | OS `connectors/broker.ts`, `gateway.ts:52-90` (`send`: `redirect: 'error'`, o corpo do fornecedor nunca sai, o teto lido em pedaços); Mastra Connect (o proxy que guarda a credencial, sem log de argumentos, **relay**); nenhuma faz a peça no Brasil | um só lugar abre a credencial, chama e corta | remendo (0031, emendada pela 0056): o executor no Hub; nenhuma biblioteca o faz no Brasil | os critérios 10 a 16; `docs/decisions/0056` | `N` | `apps/server/src/hub/connectors/executor.ts` |
| A origem do dublê | U3 | `platform/config.ts:64-69` (`NeonApiUrl`, `GitCopyUrl` com `overHttpsOrLoopback`) | — | a configuração aponta para um dublê local | embrulhado (herdado de `NeonApiUrl`): `HUB_CONNECTOR_ORIGINS`, só local; a de produção vem só da definição (S36) | o critério 16 | não precisa | — |
| A decisão do conector | U3 | 0031 ("`connectors.fetch`", base "implemented so") | o estudo fundo, 4.1 e 4.2 | — | embrulhado: a decisão 0056 substitui a 0031: o kit de definições, operações por classe e a porta de leitura, um executor no Hub | — | `I1`, `M1`, `N` | `docs/decisions/0056-connectors-kit-and-one-executor.md` |
| Integrações na barra da empresa | U4 | `routes/_app/companies/$companyId/route.tsx:40-70` (Início, Projetos, Configurações); W32 já diz onde fica | OS `apps/web/src/app/shell.tsx:91-104`; Supabase (o menu da organização, "Integrations"); Mitra (a foto do fundador, não na estante) | uma entrada de primeiro nível | embrulhado: um `FrameLink` entre os Projetos e as Configurações | o critério 19 e o QA | `O1` | — |
| A página Integrações | U4 | Contas de modelo (`web/src/builder/model-accounts/{company-accounts,key-form,accounts-table}.tsx`) | o estudo fundo, 4.5 | a lista de ligadas e para ligar | embrulhado: a página com as peças de Contas de modelo | os critérios 17 e 18 e o QA | `O1` | `apps/web/src/hub/connectors/integrations.tsx` |
| A consulta estruturada (montada pelo Conexus, ou um ORM) no lugar do SQL livre | fica de fora | — | a decisão do fundador de 2026-10-29 | — | nativo quando vier (a consulta montada pelo kit, ou um ORM): volta quando a sonda no DB Explorer (critério 21) mostrar uma escrita passando, ou o fundador pedir | — | `M1` | — |
| Code Mode, busca de ferramentas, ferramentas por liberação, caderno, liberação, OAuth, escrita | fica de fora | — | o estudo fundo, 3 | — | nativo quando vier (Mastra 1.79 `createCodeMode`, `ToolSearchProcessor`, `requireApproval`), nas etapas 19.1, 20, 20.1 e 24, como o roteiro diz | — | `H` | — |

**O que sai do `main`.** Nenhum código: o `main` não tem conectores. A decisão 0031 passa a
"Superseded by 0056" (U3). Fica para o fechamento o que os guias dizem (W30, architecture §3).

**A medida do transplante.** Nenhum arquivo trazido. Do OS em `e0353c36` entram ideias, reescritas:
a lista de serviços de leitura e o arame do SQL (`sankhya/gateway.ts`, `read-only-sql.ts`, 49 e 60
linhas: o arame vem quase inteiro, a regra de palavras e a remoção de comentários e citações, porque
é a parte que um teste prova; muda o lugar, de "o broker aceita um pedido cru" para "a porta monta o
pedido"); a fila por token (`token-cache.ts:22-30`); o teto e o `redirect: 'error'` do `send`; o
simulador de `loadRecords` como forma do dublê; as tabelas e colunas de `topics.md` na skill. Não
entram: o pedido cru do broker (`native.ts`, que é o `fetch` genérico que S36 proíbe), a posse por
espaço de trabalho (`store.ts:80`) e a porta local do handler. A regra do estudo: mais de um terço
muda em cada parte, e nenhuma decisão antiga entra só por ter sido feita.

**A dívida.**
- O teste do Sankhya de verdade é só o do fundador (critério 21); nenhum teste automático o vê.
  Gatilho: uma mudança na resposta do Sankhya que o dublê não acompanhe; a resposta é gravar, sem
  dados da empresa, o que o dublê serve.
- Nesta etapa nenhum token é guardado: cada Testar faz o seu login. O token guardado e a fila por
  token entram com a 20, a primeira com chamadas repetidas.
- O conector não confere a versão subida no CI. Gatilho: a primeira mudança de um conector no `main`.
- O recorte da documentação do Sankhya (`spec.json`) é de 2026-10-29 e só muda quando alguém roda o
  script à mão; o CI não o baixa. Gatilho: o Sankhya publicar uma mudança numa das 23 rotas, ou uma
  leitura falhar com um Sankhya de verdade; a resposta é rodar o script e ler a diferença no pull
  request.
- O tempo de cada chamada ao Sankhya de verdade não foi medido: o prazo de 80 s do Testar cobre 26
  chamadas só se cada uma levar até 3 s. Gatilho: um Testar do fundador (passo 3) com itens
  `NOT_TESTED`; a resposta é medir e, se for o caso, testar por assunto na 20.
- Para a 20: 23 leituras viram 23 ferramentas do agente, um custo de contexto em cada conversa de um
  Projeto que libera o Sankhya. A 20 o mede antes de escolher como entregá-las (todas, por assunto
  liberado, ou pela busca de ferramentas do Mastra, `ToolSearchProcessor`).

**Para o fechamento.** W30 ganha Integrações na lista da barra (W32 já a nomeia);
`docs/architecture.md` §3 "Company system, read only" passa a "Company systems, by grant", com o kit;
o `boundaries.md` recebe as linhas remendo (o núcleo do kit, o executor); `docs/reference/stack.md`
já tem a linha do pacote desde a U1.

## U0 A parede do kit

**Base e modelo.** `main`. Sonnet: duas regras numa configuração que já tem as suas irmãs.

### As linhas da tabela

- **A parede do kit**: `.dependency-cruiser.cjs`, ao lado de `mastra-only-in-builder` e
  `driver-only-in-the-database-modules`, que são o modelo.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `.dependency-cruiser.cjs` | Muda: duas regras `forbidden` | `npm run deps`, o CI |
| `scripts/rules.test.ts` | Muda: um arquivo plantado por regra nova, e o `cruise()` liga `packages/connectors` em `node_modules/@conexus/` como já liga `hub-api` (`:15`) | `npm run test:scripts` |

### Os contratos que a unidade cria

```js
// .dependency-cruiser.cjs, em forbidden
{
  name: 'connectors-kit-stands-alone',
  comment: 'The connector kit knows no Hub, no other program and no driver, so it can leave (K1).',
  severity: 'error',
  from: { path: '^packages/connectors/' },
  to: {
    path: ['^(apps|packages)/', '(^|node_modules/)(pg|drizzle-orm|fastify|@mastra)(/|$)'],
    pathNot: '^packages/connectors/',
  },
},
{
  name: 'connectors-kit-only-in-the-executor',
  comment: 'Only the Hub subject that opens a credential uses the kit (security S36).',
  severity: 'error',
  // tests/ for the local Hub's double (tests/e2e/live-hub.ts) and the QA.
  from: { pathNot: ['^packages/connectors/', '^apps/server/src/hub/connectors/', '^tests/'] },
  to: { path: '^packages/connectors/' },
},
```

O caminho de `to` segue a forma resolvida que as regras de hoje usam (`program-imports-program-by-name`
resolve `@conexus/*` para `packages/<nome>/`); o builder confere no relatório de `npm run deps` com um
arquivo plantado.

### As skills e a leitura

`docs/reference/stack.md`, linha `dependency-cruiser`. Código C75.

### A ordem do trabalho

1. Os dois casos em `scripts/rules.test.ts`, falhando: `packages/connectors/src/x.ts` que importa
   `pg`, e `apps/web/src/hub/x.ts` que importa `@conexus/connectors` (a forma dos casos de hoje,
   `plant(files)` e `cruise`). 2. As duas regras.

### Como se prova

`node --test scripts/rules.test.ts`; `npm run deps` verde no `main` com as regras.

### Parar se

- A regra não casa o caminho resolvido de `@conexus/connectors`: relatar a forma que o relatório
  mostra.

## U1 O kit e o Sankhya

**Base e modelo.** `main` com a U0. Sonnet: os contratos estão aqui, e a parte sutil (o arame do SQL)
já existe no OS para reescrever.

### As linhas da tabela

- **O núcleo do kit**: `src/kernel/definition.ts`, `operation.ts`, `auth.ts`, `request.ts`,
  `conformance.ts`, `index.ts`. A forma da definição segue a entrada de provedor do Nango
  (`providers.yaml:9368-9400`: o modo de login, a URL do token, a base fixa, os campos) e
  `createPiece` do Activepieces (`piece-metadata.ts:61-66`).
- **A classe da operação**: obrigatória (`OPERATION_CLASSES`), sem padrão.
- **O pedido na origem fixa**: `toRequest`, a única montagem de URL do repositório para um conector;
  a ideia de `pinnedUrl` (OS `native.ts`) vira a montagem, não um conferente depois.
- **O login por chave**: `auth.ts`, o pedido de token como dados e uma função pura.
- **O teste comum e o dublê**: `runConformance` chama o `handle` do dublê com o `Request` que
  `toRequest` monta, sem rede; o mesmo dublê serve num endereço local para o Hub (U3) e o QA.
- **As operações prontas**, **a porta de leitura** e **a skill**: `src/sankhya/`.
- **A conferência contra a documentação do Sankhya**: `scripts/sankhya-spec.ts`, `src/sankhya/spec.json`,
  `src/sankhya/spec.test.ts` (a seção "A ampliação do B").

### A ampliação do B

A decisão B do fundador (2026-10-29) chega com o pull request da U1 aberto
(https://github.com/developmentconexus-ops/conexus/pull/449). Ela entra como um commit novo nele:

1. **O assunto no núcleo.** `Operation` ganha `subject: string` (`/^[a-z]+$/`, obrigatório);
   `Connector` ganha `subjects: Readonly<Record<string, string>>` (o id do assunto e o seu rótulo,
   "Vendas"); `defineConnector` lança se uma operação nomeia um assunto que a definição não tem, ou
   se um assunto fica sem operação. As entradas da porta têm o assunto `porta`, rótulo "Porta de
   leitura".
2. **A skill em partes.** `Connector.skill` passa de `string` a `Readonly<{ content: string;
   references: Readonly<Record<string, string>> }>`, a forma que `packages/app/src/skills.ts:16-28`
   já lê e que `createSkill({ name, description, instructions, references })` recebe na 20, como
   `instructions.ts:57-72` faz hoje. A definição do Sankhya lê `skill/SKILL.md` e cada arquivo de
   `skill/references/`.
3. **As 18 operações novas**, na seção "A API do Sankhya", e as cinco de hoje movidas de
   `operations.ts` para os arquivos por assunto (`operations/shared.ts` leva `get`, `maybe`, `Page` e
   as datas; `operations/index.ts` exporta `sankhyaOperations` na ordem da tabela). `operations.ts`
   sai.
4. **O dublê**: uma resposta inventada por rota nova (S40), na forma do esquema 200 do recorte, e o
   endereço completo dos clientes que a documentação exige; um interruptor que demora cada resposta
   um tempo dado (a U3 o usa no critério 23).
5. **A conferência** (critério 22), abaixo.
6. **`carregar`**: o tipo do critério passa a `z.enum(['D', 'H', 'F', 'I', 'S'])` (`door.ts:70`), os
   cinco que `reference/get_criteriosloadrecords` documenta.
7. **A skill**: o `SKILL.md` reescrito como índice e as oito partes (abaixo); a regra "a skill
   nomeia cada operação" de `conformance.ts:45-49` passa a ler as partes (critério 4).

**A conferência contra a documentação.** Gerar o código das leituras do OpenAPI do Sankhya não
compensa: a API tem 8 estilos de paginação, 28 listas sem sinal de fim, uma lista descrita como
objeto (`/v1/tipos-operacao`) e três formatos de data, e cada rota pediria um ajuste à mão. O que se
gera é a conferência:

- `packages/connectors/scripts/sankhya-spec.ts` (~60 linhas), rodado à mão (`node
  packages/connectors/scripts/sankhya-spec.ts`), nunca no CI nem nos testes: para cada página da
  lista do script (uma por rota usada, por exemplo `get_v1-empresas`, `getpedidos`), baixa
  `https://developer.sankhya.com.br/reference/<página>.md`, uma por vez com 3 s entre elas, tira o
  OpenAPI do bloco `# OpenAPI definition`, resolve os `$ref`, troca `nullable: true` por um ramo
  `null` (não o apaga, senão um `null` de verdade falharia), apaga `example` e `description`, e
  escreve `src/sankhya/spec.json`:
  `{ source, fetchedAt, license, routes: { "GET /v1/vendas/nfe/{codigoNota}": { page, query: [nomes], answer: <JSON Schema do 200> } } }`.
  Só as 23 rotas usadas (~43 KB). Nenhuma chamada a um Sankhya: só as páginas públicas da
  documentação.
- **O recorte fica no Git**, gerado, revisado no pull request como diferença. `license` guarda o
  "Licença Sankhya" do `info.license` das páginas (a página do fundador diz por quê). `knip.json`
  ganha o script como entrada de `packages/connectors`; se o `biome` formatar o `spec.json`, ele entra
  nos ignorados como `routeTree.gen.ts`.
- `src/sankhya/spec.test.ts` (`node:test`, como a conformidade): roda os `probe` em ordem contra o
  dublê, como `runConformance`, e para cada operação REST confere (1) que o método e o caminho do
  pedido casam uma rota do recorte, `{param}` casando um segmento; (2) que cada chave de `query` é um
  parâmetro declarado; (3) que a resposta do dublê passa em `z.fromJSONSchema(route.answer)` (zod
  4.6.5, sem dependência nova); e (4) que nenhuma rota do recorte fica sem operação. O estudo mediu:
  os 111 esquemas 200 das leituras REST convertem sem erro.

**A skill em partes** (`src/sankhya/skill/`):

- `SKILL.md`, curto: o que é o Sankhya de cada empresa, as regras que toda leitura segue (só ler,
  uma página por chamada, a primeira página de cada operação, as operações prontas antes da porta,
  confirmar no dicionário desta empresa), a porta de leitura (`consultar`, `carregar`, o dicionário
  `TDDTAB`, `TDDCAM`, `TDDOPC`, `TDDINS`, os tipos `D`, `H`, `F`, `I`, `S`), o RH fora (não ler as
  tabelas de RH pela porta), e o índice: cada assunto com uma linha e o nome da sua parte.
- `references/<assunto>.md`, uma por assunto: cada operação com o resumo, a primeira página, os
  filtros principais e o que a documentação avisa (por exemplo, `estoque` só traz produto que já
  teve movimento: "a API só retorna informações sobre produtos que tiveram movimentação de estoque").
- `references/tabelas.md`, o mapa do que a API não tem, da página `docs/operacoes-comerciais`:
  compras em `TGFCAB` e `TGFITE` pelo tipo de operação (`TGFTOP` por `CODTIPOPER` e `DHTIPOPER =
  DHALTER`); fornecedores em `TGFPAR` com `FORNECEDOR = 'S'`; custos em `TGFCUS` e `TGFCUSITE`; o
  financeiro detalhado em `TGFFIN`; o movimento bancário em `TGFMBC`; pedido, nota e devolução em
  `TGFVAR`; o preço de venda em `TGFTAB` e `TGFEXC`; o estoque com reserva e validade em `TGFEST`.
  Cada linha termina em "confirme no dicionário desta empresa".

O Mastra instalado (1.79) faz a revelação aos poucos sem nada nosso: o `SkillsProcessor` põe no
sistema só o nome e a descrição de cada skill (`dist/agent-tuAMgHe3.js:20244`); a ferramenta `skill`
devolve o `SKILL.md` e a lista "References" (`dist/workspace-BR4DJXoq.js:6198`, `:6225`); a
ferramenta `skill_read` lê uma parte pelo caminho (`:6296-6297`); e `createSkill` leva as partes de
uma skill escrita em código (`dist/docs/references/docs-skills.md:74`: "The `references` field
bundles supporting documents that the agent can read with the `skill_read` tool"). O limite que ele
recomenda ao `SKILL.md` é 500 linhas (`dist/workspace-skills-BCbykfGB.js:1440`). Nesta etapa nenhum
agente carrega a skill: na 20, a liberação por Projeto entrega a skill e as ferramentas.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/` (`package.json`, `tsconfig.json`, `src/kernel/`, `src/sankhya/`, `src/index.ts`) | Cria | U3 (`apps/server/src/hub/connectors/`) |
| `package.json` (raiz), `package-lock.json` | Muda: o espaço de trabalho novo, pelo `npm install` | — |
| `knip.json` | Muda: `packages/connectors` com `ignore: ["src/*/skill/**"]` | `npm run knip` |
| `.github/workflows/ci.yml` (`:166`) | Muda: `-w @conexus/connectors` no `npm test` dos pacotes | o CI |
| `infra/hub.Dockerfile` (`:9-10`, `:45-52`) | Muda: o `COPY` de `packages/connectors/package.json` nas duas fases e o da pasta, como `packages/app-contract` | a imagem do Hub |
| `docs/reference/stack.md` | Muda: nenhuma dependência nova; o pacote usa `zod` (a linha diz "every workspace") | `npm run docs` |
| `packages/connectors/src/sankhya/operations/` (sete assuntos, `shared.ts`, `index.ts`), `skill/references/`, `spec.json`, `packages/connectors/scripts/sankhya-spec.ts` | Cria (o B); `operations.ts` sai | `definition.ts`; o script, só à mão |
| `knip.json`, `biome.json` (se preciso) | Muda: o script como entrada; o `spec.json` gerado | `npm run knip`, `npm run lint` |
| testes: `src/kernel/kernel.test.ts`, `src/sankhya/sankhya.test.ts`, `src/sankhya/read-only-sql.test.ts`, `src/sankhya/spec.test.ts` | Cria | — |

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/operation.ts
/** What an operation does to the provider's data (founder, M1): a grant's ceiling and an agent's approval read it. */
export const OPERATION_CLASSES = ['read', 'write', 'destructive'] as const
export type OperationClass = (typeof OPERATION_CLASSES)[number]

/** A request the connector builds; the executor sends it to the connector's pinned origin, never elsewhere. */
export type ProviderRequest = Readonly<{
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: `/${string}`
  query: Readonly<Record<string, string>>
  body: unknown // JSON, or undefined
}>
/** What came back, already parsed as JSON by the executor; the raw text never reaches the kit. */
export type ProviderAnswer = Readonly<{ status: number; body: unknown }>

/** An operation's outcome as data: a refusal is never an empty list (architecture §1). */
export type Answered<O> = Readonly<
  | { kind: 'OK'; value: O }
  | { kind: 'REFUSED'; reason: 'NO_PERMISSION' | 'INPUT' | 'VENDOR' }
  | { kind: 'AUTH_REFUSED' }
  | { kind: 'TOKEN_EXPIRED' } // the executor asks a new token once and repeats; a second time is AUTH_REFUSED
  | { kind: 'UNREADABLE' }
>

export type Operation<I, O> = Readonly<{
  id: OperationId                 // /^[a-z][a-zA-Z0-9]{1,39}$/, unique in its connector
  class: OperationClass           // required, no default
  subject: string                 // /^[a-z]+$/, a key of the connector's `subjects` (B, 2026-10-29)
  idempotent: boolean
  summary: string                 // one line, Portuguese: the skill and, later, the tool read it
  label: string                   // what Testar shows ("Pedidos")
  input: z.ZodType<I>
  output: z.ZodType<O>
  // The smallest input, for Testar and the conformance, from the values the earlier probes read
  // (pedidos needs a company code); null when there is nothing to read (impostos with no pedido).
  probe(earlier: ReadonlyMap<OperationId, unknown>): I | null
  request(input: I): ProviderRequest
  answer(answer: ProviderAnswer): Answered<O>
}>
/** Takes `id` as a plain string and brands it (throws on a bad one), so a definition writes `id: 'pedidos'`. */
export function defineOperation<I, O>(operation: Omit<Operation<I, O>, 'id'> & { id: string }): Operation<I, O>
export const OperationId = z.string().regex(/^[a-z][a-zA-Z0-9]{1,39}$/).brand('OperationId')
export type OperationId = z.infer<typeof OperationId> // the model: OperationName, app-contract runtime.ts:25-29

// packages/connectors/src/kernel/auth.ts
/** A login by fields the company pastes, exchanged for a bearer token (Sankhya). OAuth comes in 19.1. */
export type ClientCredentialsAuth = Readonly<{
  kind: 'client_credentials'
  fields: Readonly<Record<string, Readonly<{ label: string; maxLength: number }>>>
  credential: z.ZodType<Readonly<Record<string, string>>> // strict, from `fields`
  token: Readonly<{
    path: `/${string}`
    form: Readonly<Record<string, Readonly<{ field: string } | { value: string }>>>
    headers: Readonly<Record<string, Readonly<{ field: string }>>>
  }>
  answer: z.ZodType<Readonly<{ accessToken: string; expiresInSeconds: number }>>
}>
export type Auth = ClientCredentialsAuth
/** The token request, built from the opened values; the executor alone calls it, sends it and drops the values (S36). */
export function tokenRequest(auth: ClientCredentialsAuth, credential: Readonly<Record<string, string>>): ProviderRequest & { form: URLSearchParams; headers: Readonly<Record<string, string>> }

// packages/connectors/src/kernel/definition.ts
export const ConnectorId = z.string().regex(/^[a-z][a-z0-9-]{1,31}$/).brand('ConnectorId')
export type ConnectorId = z.infer<typeof ConnectorId>
export type ReadDoor = Readonly<Record<string, Operation<any, any> & { class: 'read' }>>
export type Connector = Readonly<{
  id: ConnectorId
  name: string
  version: `${number}.${number}.${number}`
  origin: `https://${string}`               // the one published origin
  auth: Auth
  oneRequestAtATime: boolean                // a token is one session (Sankhya's envelope "4")
  subjects: Readonly<Record<string, string>> // subject id → label ("vendas" → "Vendas"), each with operations and a skill reference
  operations: readonly Operation<any, any>[] // typed, the same for every company
  readDoor?: ReadDoor                         // for what each company has of its own
  // What the Builder reads (decision 0055): SKILL.md and its references by file name, the shape
  // createSkill takes in step 20; references are read on demand through Mastra's skill_read.
  skill: Readonly<{ content: string; references: Readonly<Record<string, string>> }>
}>
// Takes `id` as a plain string and brands it; throws on a repeated operation id, a bad version, a door entry not 'read'.
export function defineConnector(connector: Omit<Connector, 'id'> & { id: string }): Connector
export function defineReadDoor<D extends ReadDoor>(door: D): D

// packages/connectors/src/kernel/request.ts
/** The fetch Request on the connector's origin: the one place a connector's URL is built (S36). */
// `origin` is the connector's own, or a local double's that the Hub's configuration names (U3); the
// URL is checked against the origin it was given. A path that does not start with exactly one '/',
// or holds '..', '@', a backslash or a scheme, throws.
export function toRequest(connector: Connector, request: ProviderRequest, bearer: string | null, origin?: string): Request

// packages/connectors/src/kernel/conformance.ts
/** What every connector passes, against its fake, with no network (node:test describe/it). */
export function runConformance(connector: Connector, fake: Fake): void
export type Fake = Readonly<{
  credential: Readonly<Record<string, string>>   // invented values only (S40)
  handle(request: Request): Promise<Response>
  serve(): Promise<Readonly<{ origin: string; close(): Promise<void> }>> // node:http on 127.0.0.1
}>

// packages/connectors/src/index.ts
export const CONNECTORS: readonly Connector[] // [sankhya]: the catalog the Hub lists (one owner, C26)
export function connectorOf(id: string): Connector | undefined
export { sankhyaFake } from './sankhya/fake.ts' // tests, the local Hub and QA
```

- **Cada estado como união**: `Answered` separa por `kind`; o resultado do Testar (U3) também.
- **Cada id com a sua marca**: `ConnectorId` e `OperationId`, conferidos em `defineConnector`
  (C23).
- **O dono de cada fato**: o catálogo é `CONNECTORS`; os rótulos dos campos e das operações vivem na
  definição; o Hub e a tela os leem pela lista (C26).
- **O esquema Zod de cada entrada de fora**: a resposta do token (`auth.answer`), o envelope do
  Sankhya e a saída de cada operação (C27); o kit nunca confia no corpo do fornecedor.
- **O modelo**: nenhum arquivo do repositório tem esta forma; o mais perto em C21 e C26 é
  `packages/app-contract/src/runtime.ts` (`Operations` com esquema de entrada e saída), que cumpre
  C21, C23 e C26 e é o modelo de estilo.

### A API do Sankhya

Lida em 2026-10-28 em `developer.sankhya.com.br` (as páginas `.md` do seu `llms.txt`) e pelo
Context7 (`/websites/developer_sankhya_br_reference`, sem trechos próprios; os trechos "faq-1" com
caminhos `/sankhya/api/...` contradizem as páginas e não valem). Rótulos: **documentado** (lido na
página), **relay** (só num trecho do Context7 ou de busca), **herdado do OS** (o código de
`e0353c36`, que rodou com um Sankhya de verdade), **não verificado**. Nenhum endpoint foi chamado.

**A origem.** Produção `https://api.sankhya.com.br` (documentado). O sandbox
`https://api.sandbox.sankhya.com.br` fica de fora (a página do fundador).

**O login** (documentado, `reference/post_authenticate`). `POST /authenticate`, `Content-Type:
application/x-www-form-urlencoded`, cabeçalho `X-Token: <o token da tela Configurações Gateway>`,
formulário `client_id`, `client_secret`, `grant_type=client_credentials`. Resposta 200:

```json
{ "access_token": "<jwt>", "expires_in": 300, "refresh_expires_in": 0, "token_type": "Bearer",
  "not-before-policy": 0, "scope": "" }
```

Sem token de renovação: pede-se de novo. Erros: 400 (parâmetro errado), 401 (`client_id`,
`client_secret` ou X-Token inválidos), 500. As chamadas levam `Authorization: Bearer <jwt>` (sem
dois-pontos, como o exemplo). O `expires_in` real é lido da resposta, nunca fixado (só o exemplo de
300 s é documentado). O `/login` antigo (`appkey`, usuário e senha) é "legado/descontinuado" e não
entra. O `auth` da definição:

```ts
auth: {
  kind: 'client_credentials',
  fields: {
    clientId: { label: 'Client ID', maxLength: 200 },
    clientSecret: { label: 'Client Secret', maxLength: 200 },
    xToken: { label: 'X-Token', maxLength: 4096 },
  },
  token: {
    path: '/authenticate',
    form: { client_id: { field: 'clientId' }, client_secret: { field: 'clientSecret' }, grant_type: { value: 'client_credentials' } },
    headers: { 'X-Token': { field: 'xToken' } },
  },
  answer: z.object({ access_token: z.string().min(1).max(8192), expires_in: z.number().int().positive() })
    .transform(({ access_token, expires_in }) => ({ accessToken: access_token, expiresInSeconds: expires_in })),
},
oneRequestAtATime: true, // herdado do OS: uma segunda chamada no mesmo token cancela a primeira (envelope "4")
```

Um valor com `\r` ou `\n` é recusado pelo esquema da credencial (o OS, `gateway.ts:141`).

**Os limites** (documentado, `reference/boas-práticas-para-integração`): até 1.000 pedidos por
minuto; 10 MB por pedido; 504 depois de 2 minutos. O prazo de 10 s por chamada do executor fica bem
abaixo. O formato de um 429: não verificado.

**Os erros do gateway** (documentado, `reference/códigos-de-retorno-da-api`, pelo Context7): 401
`GTW2510`, `GTW2511` (cabeçalho), `GTW3501`, `GTW3502`; 403 `GTW3403` "Bearer Token inválido ou
Expirado" (pedir token de novo), `4303` (token inválido ou inativado), `4405` (token e appkey não
associados); 400 `GTW2509` (falta `offsetPage`); 200 com mensagem `[CORE_Exxxxx]` é um erro de regra
do Sankhya, com HTTP 200. A forma do corpo de cada erro: não verificado, salvo o `RetornoErro`
abaixo. O kit lê o código do corpo (`code` ou o texto que começa com `GTW`) por um esquema solto e
nunca o leva para fora do kit além do `kind`.

**As operações prontas** (todas `class: 'read'`, `idempotent: true`, `GET`, uma página por chamada):

| Operação | Pedido | Entrada (Zod) | Saída: os campos que a operação devolve | Probe | Rótulo |
| --- | --- | --- | --- | --- | --- |
| `empresas` | `GET /v1/empresas` (só o título na lista da documentação; os parâmetros não lidos: a ordem do trabalho, passo 6) | `{ page: int ≥ 1 }` | código e nome de cada empresa | `{ page: 1 }` | Empresas |
| `pedidos` | `GET /v1/vendas/pedidos` (documentado, `reference/getpedidos`) | `{ codigoEmpresa: int, page: int ≥ 1, dataNegociacaoInicio?, dataNegociacaoFinal?: 'dd/mm/aaaa', codigoCliente?: int, codigoNota?: int, confirmada?: boolean, pendente?: boolean }` | de `registros[]`: o código e o número da nota, a série, a empresa, o cliente (código e nome), a data de negociação, confirmada, pendente, o vendedor, o valor total, e `itens[]` (sequência, produto, quantidade, unidade, valor unitário, valor total); de `metadados`: `paginaAtual`, `totalPaginas`, `possuiMaisPaginas` | a primeira empresa de `empresas`, `page: 1`; `null` sem empresa | Pedidos |
| `produtos` | `GET /v1/produtos` (documentado, `reference/get_v1-produtos`; `page` começa em 0) | `{ page: int ≥ 0 }` | de `produtos[]`: `codigoProduto`, `nome`, `complemento`, `referencia`, `codigoGrupoProduto`, `nomeGrupoProduto`, `volume`, `marca`, `ativo`, `ncm`, `dataAltercao` (assim escrito na API) | `{ page: 0 }` | Produtos |
| `clientes` | `GET /v1/parceiros/clientes` (documentado, `reference/getcliente`) | `{ page: int ≥ 1, dataHoraAlteracao?: 'dd/mm/aaaa hh:mm' }`, com `sort_by=codigoCliente&sort_order=ASC` sempre | de `clientes[]`: `codigoCliente`, `tipo` (`PF`, `PJ`), `cnpjCpf`, `nome`, `razao`, `email`, `endereco` (`cidade`, `uf`), `camposAdicionais` (os `AD_` da empresa, como registro de texto para texto); `temMaisRegistros` | `{ page: 1 }` | Clientes |
| `impostosDoPedido` | `GET /v1/vendas/pedidos?codigoEmpresa=…&codigoNota=…&page=1` (a API não tem leitura de impostos guardados: só `POST /v1/fiscal/impostos/calculo`, um cálculo, que não entra) | `{ codigoEmpresa: int, codigoNota: int }` | de `registros[0].itens[]`: a sequência, o produto, o CFOP, o NCM, o CST, o ICMS, o IPI e `impostos[]` | o primeiro pedido de `pedidos`; `null` sem pedido | Impostos dos pedidos |

As cinco acima têm os assuntos `cadastros` (`empresas`, `clientes`), `produtos` (`produtos`) e
`vendas` (`pedidos`, `impostosDoPedido`). **As 18 novas do B** (documentado: o OpenAPI de cada página,
lido inteiro em 2026-10-29 pelo estudo do catálogo; a página é a de `reference/`), todas `read`,
`idempotent: true`, `GET`, uma página por chamada, na ordem em que o Testar as chama dentro do
assunto. A saída de cada uma lista só os campos que um app usa, com `maybe()` nos que podem faltar,
como as cinco; o construtor os escolhe no esquema 200 do recorte. O resumo diz a primeira página,
porque a API tem 8 estilos de paginação.

| Operação | Assunto | Pedido (página) | Página e fim da lista | Entrada além da página | Probe | Rótulo |
| --- | --- | --- | --- | --- | --- | --- |
| `vendedores` | cadastros | `GET /v1/vendedores` (`get_v1-vendedores`) | `page` desde 0; sem sinal de fim | `modifiedSince?` | `{ page: 0 }` | Vendedores |
| `tiposOperacao` | cadastros | `GET /v1/tipos-operacao` (`get_v1-tipos-operacao`) | `page` desde 1; sem sinal; o 200 da documentação é um objeto, não uma lista: a saída aceita os dois e devolve lista | `tipoMovimento?` | `{ page: 1 }` | Tipos de operação |
| `naturezas` | cadastros | `GET /v1/naturezas` (`get_v1-naturezas`) | `page` desde 1; lista solta | — | `{ page: 1 }` | Naturezas |
| `centrosResultado` | cadastros | `GET /v1/centros-resultado` (`get_v1-centros-resultado`) | `page` desde 1; lista solta | — | `{ page: 1 }` | Centros de resultado |
| `gruposProduto` | produtos | `GET /v1/grupos-produto` (`get_v1-grupos-produto`) | `page` desde 0; sem sinal | — | `{ page: 0 }` | Grupos de produto |
| `notasFiscais` | vendas | `GET /v1/vendas/nfe` (`getnfe`) | `page` desde 1; `metadados` | `codigoEmpresa`, as datas de negociação, `codigoCliente?`, `codigoNota?`, `statusNFe?` | a primeira empresa, `page: 1`; `null` sem empresa | Notas fiscais |
| `notaFiscal` | vendas | `GET /v1/vendas/nfe/{codigoNota}` (`getnfebycodigo`) | um registro: itens, impostos e parcelas | `codigoNota` (no caminho) | a primeira nota de `notasFiscais`; `null` sem nota | Nota fiscal com itens |
| `devolucoes` | vendas | `GET /v1/vendas/nfe/devolucoes` (`getnfedevolucoes`) | `page` desde 1; `metadados` | `codigoEmpresa`, as datas, `codigoCliente?` | a primeira empresa, `page: 1` | Devoluções |
| `notasCanceladas` | vendas | `GET /v1/vendas/nfe/canceladas` (`getnfecanceladas`) | `page` desde 1; `metadados` | `codigoEmpresa` (obrigatória), as datas de cancelamento | a primeira empresa, `page: 1` | Notas canceladas |
| `estoque` | estoque | `GET /v1/estoque/produtos` (`getestoqueprodutos`) | `page` desde 1; sem sinal; até 50 por página | — | `{ page: 1 }` | Estoque por produto |
| `locaisEstoque` | estoque | `GET /v1/estoque/locais` (`get_v1-estoque-locais`) | `page` desde 0; sem sinal | — | `{ page: 0 }` | Locais de estoque |
| `contasAReceber` | financeiro | `GET /v1/financeiros/receitas` (`getfinanceiros`) | `page` desde 1; `pagination.hasMore` | `codigoEmpresa`, `codigoParceiro?`, `statusFinanceiro?`, as datas de vencimento e de negociação | a primeira empresa, `page: 1` | Contas a receber |
| `contasAPagar` | financeiro | `GET /v1/financeiros/despesas` (`getfinanceirosdespesas`) | `page` desde 1; `pagination.hasMore` | as mesmas | a primeira empresa, `page: 1` | Contas a pagar |
| `tiposPagamento` | financeiro | `GET /v1/financeiros/tipos-pagamento` (`get_v1-financeiros-tipos-pagamento`) | `page` desde 1; sem sinal | `subTipoPagamento?` | `{ page: 1 }` | Tipos de pagamento |
| `precosDoProduto` | precos | `GET /v1/precos/produto/{codigoProduto}` (`getprecoproduto`) | `pagina` desde 1; `temMaisRegistros` | `codigoProduto` (no caminho) | o primeiro produto de `produtos`; `null` sem produto | Preços de um produto |
| `precosDaTabela` | precos | `GET /v1/precos/tabela/{codigoTabela}` (`getprecotabela`) | `pagina` desde 1; `temMaisRegistros` | `codigoTabela` (no caminho) | a primeira tabela que `precosDoProduto` leu; `null` sem tabela | Preços de uma tabela |
| `transportadoras` | logistica | `GET /v1/parceiros/transportadoras` (`gettransportadoras`) | `page` desde 1; `pagination` | `modifiedSince?` | `{ page: 1 }` | Transportadoras |
| `ordensCarga` | logistica | `GET /v1/logistica/ordens-carga` (`getordenscarga`) | `page` desde 1; `pagination` | `codigoEmpresa` | a primeira empresa, `page: 1` | Ordens de carga |

Os assuntos e os seus rótulos, na ordem do Testar depois da porta: `cadastros` "Cadastros",
`produtos` "Produtos", `vendas` "Vendas", `estoque` "Estoque", `financeiro` "Financeiro", `precos`
"Preços", `logistica` "Logística". Dentro de cada um, as cinco de hoje vêm primeiro, depois as novas
na ordem da tabela; `empresas` é a primeira de todas, porque oito `probe` dependem dela. A chave
exata de cada filtro e de cada campo vem do recorte (`spec.json`), e o critério 22 a confere.

Os nomes exatos das chaves de `registros[]` e de `itens[]` e de `impostos[]` não estão no texto da
página (não verificado): o passo 6 os lê no arquivo OpenAPI da página. Os de `produtos[]` e
`clientes[]` estão no texto (documentado). Cada saída é um `z.object` com os campos acima, os de
texto da API como `string`, os números como `number`, os ausentes como `.nullable()`; um campo a mais
na resposta é ignorado (`z.object`, não `strictObject`: o Sankhya acrescenta campos sem aviso).

**Os erros do REST** (documentado): o pedido de venda responde 400 `RetornoErro { code, message,
details }`; clientes 400 `{ statusCode, error, mensagem { code, message, details, help } }`; produtos
não dá esquema. O kit: 2xx no esquema dá `OK`; 400 dá `REFUSED` (`INPUT`); 401, 403 `4303` ou `4405`
dá `AUTH_REFUSED`; 403 `GTW3403`, `TOKEN_EXPIRED`; outro 403, `REFUSED` (`NO_PERMISSION`, o
usuário de integração sem a tela, `reference/camada-de-autorização-para-api`); 404 numa lista,
`OK` com a lista vazia só se o corpo for o esquema da lista, senão `UNREADABLE`; 5xx é do executor
(`UNREACHABLE`).

**A porta de leitura** (`defineReadDoor`), pelo gateway de serviços (documentado,
`reference/requisições-via-gateway`): `POST /gateway/v1/mge/service.sbr?serviceName=<serviço>&outputType=json`,
corpo `{ "serviceName": "<serviço>", "requestBody": { … } }`. O envelope de sucesso (relay, o
exemplo de `CentroResultado`):

```json
{ "serviceName": "CRUDServiceProvider.loadRecords", "status": "1", "pendingPrinting": "false",
  "transactionId": "<id>", "responseBody": { "entities": { "total": "1", "hasMoreResult": "false",
  "offsetPage": "0", "metadata": { "fields": { "field": [ { "name": "CODCENCUS" }, { "name": "DESCRCENCUS" } ] } },
  "entity": { "f0": { "$": "10000" }, "f1": { "$": "Centro Administrativo" } } } } }
```

- `status: "1"` é sucesso (documentado em todos os exemplos; o OS o usou); qualquer outro é
  `REFUSED` (`VENDOR`); os outros valores e o `statusMessage` não estão documentados. Um 200 com
  `[CORE_E…]` também é `REFUSED`.
- **`carregar`**: `CRUDServiceProvider.loadRecords` (documentado, `reference/get_loadrecords`).
  Entrada `{ entidade: /^[A-Z][A-Za-z]{1,60}$/, campos: string[] (1 a 50, /^[A-Z][A-Z0-9_]{0,59}$/),
  criterio?: { expressao: string (até 2.000), parametros: { valor: string, tipo: 'I' | 'S' | 'D' }[] },
  pagina: int ≥ 0 }`, montada como `dataSet { rootEntity, includePresentationFields: "N",
  offsetPage, criteria: { expression: { $ }, parameter: [{ $, type }] }, entity: { fieldset: { list }
  } }`. A saída: `{ linhas: Record<string, string | null>[], temMais: boolean }`, lida como o OS
  (`handler-kit/sankhya.ts:39-52`): os nomes de `metadata.fields.field` em ordem, `f<n>.$` em cada
  linha, `entity` um objeto ou uma lista. O tamanho da página: não verificado. Probe: `{ entidade:
  'Empresa', campos: ['CODEMP'], pagina: 0 }` (o nome da entidade `Empresa` para `TSIEMP`: não
  verificado; o passo 6 o confere no dicionário, `reference` "dicionário de dados").
- **`consultar`**: `DbExplorerSP.executeQuery`. **Não há página da documentação** (relay: "usado
  para executar SQL via JSON; não suporta deletes ou inserts"); a forma vem do OS (herdado,
  `handler-kit/sankhya.ts:84-90`): o corpo `{ "sql": "<texto>" }`; a resposta `responseBody {
  fieldsMetadata: [{ name }], rows: [[…]], burstLimit: boolean }`. Entrada `{ sql: string (até 8.000)
  }`, conferida por `isOneReadStatement` no próprio esquema de entrada (`z.string().max(8000).refine`),
  antes de montar o pedido; saída `{ linhas: Record<string,
  unknown>[], completo: boolean }` (`completo` é `burstLimit !== true`). O limite de linhas e se o
  serviço depende de permissão por usuário: não verificado (o Testar o mostra). Probe: `{ sql:
  'SELECT COUNT(*) AS N FROM TSIEMP' }`.
- A documentação diz que acessar o banco direto é contra as boas práticas; o DB Explorer passa pelo
  gateway e é o que a empresa libera ao usuário. A skill manda usar as operações prontas primeiro.

**O dicionário** (documentado, `docs/dicionário-de-dados`): `TDDTAB` (tabelas, `NOMETAB`), `TDDCAM`
(campos, `NOMETAB` e `NOMECAMPO`), `TDDOPC` (opções, por `NUCAMPO`), `TDDINS` (instâncias, o nome da
entidade do `loadRecords`); a coluna `ADICIONAL` marca o que a empresa criou. O prefixo `AD_` aparece
só nos exemplos (`camposAdicionais`); o OS o usava (`topics.md`). A skill ensina a ler os quatro pela
`consultar`, e nunca a alterá-los.

**O que a documentação não respondeu.** Os valores de `status` além de `"1"` e o corpo de um serviço
que falhou; o tamanho da página do `loadRecords`; tudo do `executeQuery` (a forma vem do OS); como a
empresa cria o usuário só de leitura (o artigo de ajuda deu 403; a empresa o faz no Sankhya dela); o
`expires_in` real; o formato de um 429; os nomes das chaves do pedido de venda (no arquivo OpenAPI,
passo 6); os parâmetros de `/v1/empresas`; fornecedores pela API REST (só clientes).

### As skills e a leitura

`docs/reference/stack.md`, linha `zod` (`zod.dev/llms.txt`). Testes T5 e T12; segurança S36, S40.
A skill do Sankhya do OS (`git show e0353c36:builder-skills/conexus-sankhya/SKILL.md`, 131 linhas,
e `references/topics.md`, `traps.md`) é o ponto de partida do texto.

### A ordem do trabalho

1. `packages/connectors/package.json` como o de `packages/app-contract` (`"exports": { ".":
   "./src/index.ts" }`, `typecheck`, `test` com `node --test`), `tsconfig.json` igual; `npm install`
   para o `package-lock.json`; a entrada no `knip.json`.
2. Os testes dos critérios 2 a 6, falhando.
3. O núcleo: `operation.ts`, `auth.ts`, `definition.ts`, `request.ts`. Regras: C21, C23, C27.
   `toRequest` faz `new URL(path, origin)` e confere `url.origin === connector.origin` depois, além
   da recusa do texto do caminho; põe `authorization: Bearer <token>` quando há token,
   `content-type: application/json` com corpo, `redirect: 'error'`.
4. `conformance.ts`: um `describe(connector.id)` com os itens do critério 4; o `probe` de cada
   operação passa por `toRequest`, pelo `handle` do dublê e pelo `answer`, e o valor pelo esquema de
   saída.
5. `src/sankhya/read-only-sql.ts`, reescrito do OS (`read-only-sql.ts` em `e0353c36`), com os seus
   testes primeiro.
6. Antes do código, ler na documentação (só páginas, nenhuma chamada a um endpoint): o arquivo
   OpenAPI de `reference/getpedidos` (as chaves de `registros[]`, `itens[]`, `impostos[]`) e a
   página de `/v1/empresas` (os parâmetros e as chaves); anotar a página e as chaves no pull
   request. Depois, `src/sankhya/answers.ts` (os erros do REST e o envelope da porta, uma função
   cada), `operations.ts`, `door.ts`, `definition.ts`, pela seção "A API do Sankhya".
7. `src/sankhya/fake.ts`: um conjunto pequeno de registros inventados por recurso (S40), nas formas
   da seção "A API do Sankhya"; o `/authenticate` que confere a credencial do dublê e dá `expires_in`
   configurável; `executeQuery` que responde a `SELECT COUNT(*) AS N FROM TSIEMP`; `loadRecords` sobre
   `Empresa`; uma fila por token que responde o envelope `"4"` (ou 409 no REST) se chegar um segundo
   pedido ao mesmo token antes do primeiro responder; um interruptor por operação para recusar (403
   no REST, `status: "0"` na porta), um para o token vencido (403 `GTW3403`), um para responder fora
   do esquema, um para um corpo acima de 256 KB, um para um redirecionamento (302) e um para não
   responder nunca; `serve()` fechado faz o "fora do ar". A U3 usa os interruptores.
8. `src/sankhya/skill/SKILL.md`: as operações prontas com o resumo, a porta de leitura e quando usar
   cada uma, o dicionário (`TDDTAB`, `TDDCAM`, `TDDOPC`, `AD_`), e o que nunca fazer (escrever, pedir
   valores para guardar); das 131 linhas do OS ficam as etapas de descoberta, reescritas.
9. A ampliação do B, no pull request aberto: (a) o teste do critério 22 e os casos novos dos
   critérios 4, 5 e 6, falhando; (b) `scripts/sankhya-spec.ts`, rodado uma vez à mão, e o
   `spec.json` no commit, com a data; o critério 22 falha no dublê dos clientes, como o estudo viu;
   (c) o assunto no núcleo e a skill como `{ content, references }`; (d) o movimento das cinco
   operações para `operations/` e as 18 novas, assunto por assunto, cada uma com a sua resposta no
   dublê; (e) o `carregar` com `H` e `F`; (f) o `SKILL.md` como índice e as oito partes.

### Como se prova

`npm test -w @conexus/connectors`; `npm run typecheck -w @conexus/connectors`; `npm run deps`;
`npm run knip`; `npm run lint`. O critério 5 falha hoje (o pacote não existe) e, depois, falha se o
arame aceitar `SELECT 1; DELETE FROM TGFPAR`. O critério 22 falha se o dublê dos clientes perder o
endereço, ou se uma operação mandar um filtro que a rota não declara (o teste planta os dois).

### Parar se

- A documentação do Sankhya, lida na hora da construção, contradiz a seção "A API do Sankhya" num
  ponto que um critério usa: relatar o ponto, a página e a linha.
- Uma operação pronta precisa de mais de uma chamada ao Sankhya (paginação que o `loadRecords` não
  dá numa chamada): relatar; a operação lê uma página por chamada.
- Um esquema 200 do recorte não converte em `z.fromJSONSchema`, ou uma rota da tabela não está na
  página que ela nomeia: relatar a rota e a página; nenhuma conversão à mão.
- A ampliação passa das ~1.240 linhas estimadas em mais de um quinto: relatar antes de seguir.

## U2 A tabela da ligação

**Base e modelo.** `main`. Sonnet: uma tabela, um papel e uma função, pelo caminho das contas de
modelo.

### As linhas da tabela

- **A ligação**: `apps/server/src/hub/connectors/tables.ts`, um esquema novo `connectors` (D1), com
  `model_account` (`builder/model-accounts/tables.ts:51-99`) como modelo: a chave para a empresa com
  cascata, as políticas `COMPANY`, a chave de tentativa única por empresa.
- **O selo da ligação**: o papel `hub_connection_seals`, como `hub_model_seals`
  (`migrations/20261019110058_model_seals_role/migration.sql`); a função `connectors.sealed_of(uuid)`
  e `connectors.companies_with_seals()`, como as de `builder`
  (`migrations/20261019110219_model_accounts_grants/migration.sql`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/connectors/tables.ts` | Cria `connectors`, `connection` | U3 |
| `apps/server/migrations/<data>_e19_connection_seals_role/`, `<data>_e19_connection/`, `<data>_e19_connection_grants/` | Cria: o papel (SQL nosso), a tabela (gerada), as permissões e as funções (SQL nosso) | `npm run migrations` |
| `apps/server/database-grants.sql`, `apps/server/src/platform/catalog.test.ts` | Muda: as permissões novas (D10, D11) | o catálogo |
| `packages/hub-api/src/connectors.ts`, `index.ts` | Cria: só `CONNECTION_STATES` e `ConnectionState`; a U3 acrescenta o resto | as tabelas, a U3, a web |
| `apps/server/src/hub/connectors/tables.test.ts` | Cria: critério 7 | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/connectors/tables.ts
// The connectors' own schema in the Hub's database (data D1). A connection belongs to a company and
// leaves with it; its credential is sealed, and only connectors.sealed_of reads it (Grant A, as builder).
export const connectors = pgSchema('connectors')

import { CONNECTION_STATES } from '@conexus/hub-api' // the one owner, created by this unit

/** A company's account in an outside system (founder, C1): one per connector, sealed (S32). */
export const connection = connectors.table('connection', {
  id: uuid('id').primaryKey(),
  companyId: text('company_id').notNull(),
  connectorId: text('connector_id').notNull(),
  // The kit's version at linking (founder, L1): a grant compares it from step 20.
  connectorVersion: text('connector_version').notNull(),
  state: text('state', { enum: CONNECTION_STATES }).notNull(),
  sealed: bytea('sealed').notNull(),
  keyId: text('key_id').notNull(),
  linkedBy: text('linked_by').notNull(),
  linkedAt: instant('linked_at').notNull(),
  testedAt: instant('tested_at'),
  // The creation's Idempotency-Key (code C37).
  attemptKey: text('attempt_key').notNull(),
}, (table) => [
  foreignKey({ name: 'connection_company_id_fkey', columns: [table.companyId], foreignColumns: [company.id] }).onDelete('cascade'),
  unique('connection_connector_key').on(table.companyId, table.connectorId),
  unique('connection_attempt_key').on(table.companyId, table.attemptKey),
  check('connection_state', sql`${table.state} IN ('NEW', 'ACTIVE', 'NEEDS_REAUTH')`),
  check('connection_connector_id', sql`${table.connectorId} ~ '^[a-z][a-z0-9-]{1,31}$'`),
  policy(SCOPE_ROLES.COMPANY, 'all', sql`company_id = ${scoped.companyId}`),
  pgPolicy('connection_seals_select', { for: 'select', to: 'hub_connection_seals', using: sql`true` }),
])
// `linked_by` sem FK para a pessoa, como `model_account.linked_by`: quem ligou pode sair da empresa e
// a ligação fica, porque é da empresa (C1).
```

O `CONNECTION_STATES` é de um dono só: a U2 o declara em `packages/hub-api/src/connectors.ts`
(arquivo novo, só a lista e o tipo), e as tabelas o importam, como `model-accounts/tables.ts:1`
importa `ACCOUNT_STATES`. A U3 acrescenta o resto do contrato nesse arquivo.

- As permissões (D10, D11, D12), todas novas: `hub_company` `USAGE` no esquema `connectors`; `SELECT`
  em todas as colunas de `connection` menos `sealed`, `INSERT`, `DELETE`, e `UPDATE (state,
  tested_at, sealed, key_id)` (o `reseal` e o Testar); `hub_connection_seals` `USAGE` e `SELECT (id,
  company_id, sealed, key_id)`; `connectors.sealed_of(connection uuid) RETURNS TABLE (sealed bytea,
  key_id text)`, `SECURITY DEFINER`, dona `hub_connection_seals`, só na empresa de
  `conexus.company_id`, `EXECUTE` só a `hub_company`; `connectors.companies_with_seals()`,
  `EXECUTE` só a `hub_runtime`, com `USAGE` no esquema.
- Modelo: `model_account` e as suas migrações (cumprem C21 e C26).

### As skills e a leitura

`docs/reference/stack.md`, linhas `drizzle-kit` (a skill `drizzle` do pacote) e `pg`. Dados D1,
D5, D6, D10, D11, D12; segurança S32.

### A ordem do trabalho

1. O teste do critério 7, falhando.
2. A lista de estados em `packages/hub-api/src/connectors.ts` e a exportação em `index.ts`.
3. A tabela; `npx drizzle-kit generate --name e19_connection`.
4. O papel antes (SQL nosso, como `20261019110058_model_seals_role`) e as permissões e funções
   depois (como `20261019110219_model_accounts_grants`).
5. `database-grants.sql` e o instantâneo do catálogo; critério 8. `node scripts/check-migrations.ts`
   (a memória do projeto: ele recusa `SET` solto em qualquer `.ts` mudado, testes também).

### Como se prova

`npm test -w @conexus/server -- src/hub/connectors/tables.test.ts src/platform/catalog.test.ts`;
`npm run migrations`; `node scripts/check-migrations.ts`.

### Parar se

- A migração gerada mexe em outra tabela: parar e relatar.
- A cascata da empresa não leva a ligação quando a Central apaga uma empresa (o caminho de hoje
  apaga por fases): relatar a fase.

## U3 A ligação no Hub

**Base e modelo.** `main` com a U1, a U2 e a U3 da 18. **Opus**: o executor cruza o kit, o selo e o
contrato do Hub, e tem concorrência (o token pedido uma vez, a fila por token, o Desligar durante o
Testar).

### As linhas da tabela

- **O selo da ligação**: `seal.ts:41-48`, `SealContext.purpose` ganha `'connection'` e `rowId`
  ganha `ConnectionId`; o contexto é `{ purpose: 'connection', rowId, companyId, personId: null,
  kind: connector.auth.kind, provider: connector.id }`. O `reseal` das ligações tem a forma de
  `builder/model-accounts/reseal.ts` (uma empresa por vez, abrir, selar de novo só com a chave
  antiga), com `connectors.companies_with_seals()` e `connectors.sealed_of`; uma ligação cujo
  conector o kit não tem conta `refused`; o comando `reseal` de `main.ts:296` soma as duas contagens
  `{ moved, refused }`. É escrito, não copiado: o subject do Hub não importa o do Builder
  (`hub-does-not-import-builder`) e o CI recusa um clone (jscpd, código C26).
- **A credencial selada**: o Ligar confere `credential` pelo `auth.credential` do conector e sela
  `Credential.parse(JSON.stringify(values))` (`seal.ts:52-57`); só o executor faz
  `JSON.parse(credential.reveal())` e o confere de novo pelo mesmo esquema (uma falha é
  `SEAL_REFUSED`), passa os valores a `tokenRequest` e não os guarda (S36).
- **Quem liga, testa e desliga**: `roles.ts`, `connection: ['manage']` em `ACCESS_CONTROL` e em
  `MANAGE_COMPANY`; `admission.ts`, `readConnections: { by: 'MEMBER', statement: undefined, locks:
  false }` e `manageConnections: { by: 'MEMBER', statement: MANAGE_CONNECTIONS, locks: true }`, como
  `readModelAccounts` e `manageModelAccounts`.
- **O executor**: `apps/server/src/hub/connectors/executor.ts`. O envio segue o `send` do OS
  (`gateway.ts:52-90`): `redirect: 'error'`, o corpo de uma resposta de erro cancelado e nunca
  lido para log, a leitura em pedaços até 256 KB, o JSON lido só no fim; o prazo é
  `AbortSignal.timeout(callDeadlineMs)` por chamada, `callDeadlineMs` das dependências do subject
  (10.000 no Hub, 200 nos testes). Nesta etapa só o Testar chama o Sankhya: ele pede um token novo,
  chama o login e as operações uma depois da outra (nunca `Promise.all`, por `oneRequestAtATime`), e
  não guarda o token. O token guardado entre chamadas (reusado até `expires_in − max(60 s, 10 %)`, OS
  `token-cache.ts:55-60`) e a fila por token (`:22-30`) entram com a 20, que tem quem os chame.
- **O teste da ligação** (a ampliação do B, um commit novo no pull request aberto,
  https://github.com/developmentconexus-ops/conexus/pull/453): `probed` em `connections.ts` chama
  primeiro as entradas da porta e depois as operações, na ordem da definição; um prazo do teste
  inteiro, `testDeadlineMs` nas dependências do subject (80.000 no Hub, ao lado de
  `CALL_DEADLINE_MS` em `public.ts:14`; 1.000 nos testes), conta desde o primeiro login; cada chamada
  do executor recebe `min(callDeadlineMs, o que falta)` (o executor ganha o prazo por chamada como
  argumento, não só da dependência); quando o prazo acaba, os itens que sobram dão
  `NOT_TESTED` sem chamar o Sankhya; o login (o primeiro ou o de um token vencido) que não cabe dá
  `UNREACHABLE`, como hoje. 80 s deixa folga para os dois passos do banco e fica abaixo dos 100 s
  com que a borda da Cloudflare corta uma resposta (`platform/http.ts:24-26`). Cada `TestCheck`
  leva `subject`, o rótulo do assunto (`Connector.subjects`, ou "Porta de leitura").
- **A origem do dublê**: `config.ts`, `HUB_CONNECTOR_ORIGINS` (`sankhya=http://127.0.0.1:4180`),
  cada valor só `http://127.0.0.1`, `http://localhost` ou `http://[::1]`, com porta; a
  configuração não conhece o kit (só `hub/connectors/` o importa, U0): é `createConnectors`, ao
  montar o subject, que recusa subir com uma origem de um conector que o kit não tem.
- **A decisão do conector**: `docs/decisions/0056-connectors-kit-and-one-executor.md`, na forma das
  outras (Contexto, Decisão, Critério, Resultado, Consequências, Reabre quando, Estado), com a base
  "o estudo fundo dos conectores e as palavras do fundador de 2026-10-28"; a 0031 passa a
  "Superseded by 0056"; uma linha em `docs/index.md`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/connectors/` (`connections.ts`, `executor.ts`, `routes.ts`, `reseal.ts`, `ids.ts`, `public.ts`) | Cria | `main.ts` |
| `apps/server/src/hub/identity/roles.ts`, `admission.ts`, `public.ts` | Muda: a capacidade e as duas ações | todo o Hub |
| `apps/server/src/platform/seal.ts` | Muda: o propósito e o id | contas de modelo, conectores |
| `apps/server/src/platform/config.ts` | Muda: `HUB_CONNECTOR_ORIGINS` | `main.ts`, `tests/e2e/live-hub.ts` |
| `apps/server/src/main.ts` | Muda: `createHub` ganha o subject nas suas dependências (`:59-70`), as rotas, o `reseal` | — |
| `apps/server/src/platform/test-database.ts` (`testConfig`), `apps/server/src/hub/identity/test-hub.ts` (`subjectsOf`, `hubServing`, `:56-62`) | Muda: a configuração de teste sem origem de dublê por padrão, e o subject novo montado como os outros | todos os testes do servidor |
| `apps/server/package.json` | Muda: `"@conexus/connectors": "*"` | — |
| `packages/hub-api/src/connectors.ts`, `connector-failures.ts`, `failures.ts`, `index.ts` | Cria ou muda: as rotas, os tipos, as falhas | servidor, web |
| `apps/server/src/openapi-contract.test.ts` | Muda: as rotas novas no documento | — |
| `tests/e2e/live-hub.ts` | Muda: sobe o dublê do Sankhya e passa a sua origem | o QA |
| `docs/decisions/0031-connectors-single-executor.md`, `0056-connectors-kit-and-one-executor.md`, `docs/index.md` | Muda, cria | `npm run docs` |
| testes: `connections.test.ts`, `executor.test.ts` (pela rota do Testar, `hubOn` de `test-hub.ts`), `connection-seal.test.ts` (SQL no banco de teste e `spawnHub`), `platform/config.test.ts` (o seu próprio arquivo, como hoje) | Cria ou muda | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/connectors.ts
export const ConnectionId = z.uuid().brand('ConnectionId')
// CONNECTION_STATES and ConnectionState: already here, from U2
export const ConnectorEntry = z.object({
  id: z.string(), name: z.string(), version: z.string(),
  fields: z.array(z.object({ name: z.string(), label: z.string(), maxLength: z.number().int() })),
})
export const Connection = z.object({
  id: ConnectionId, connector: z.string(), connectorVersion: z.string(),
  state: z.enum(CONNECTION_STATES), linkedBy: z.object({ id: PersonId, name: z.string() }).nullable(), // null: who linked left the company
  linkedAt: z.iso.datetime(), testedAt: z.iso.datetime().nullable(),
})
export const ConnectionList = z.object({
  connectors: z.array(ConnectorEntry), connections: z.array(Connection), mayManage: z.boolean(),
})
export const TestCheck = z.object({ id: z.string(), label: z.string(), subject: z.string(), outcome: z.enum(['READS', 'REFUSED', 'UNREADABLE', 'NOTHING_TO_READ', 'NOT_TESTED']) })
export const TestResult = z.discriminatedUnion('result', [
  z.object({ result: z.literal('WORKING'), checks: z.array(TestCheck), connection: Connection }),
  z.object({ result: z.literal('AUTH_REFUSED'), connection: Connection }),
  z.object({ result: z.literal('UNREACHABLE'), connection: Connection }),
])

listConnections:  GET    /api/companies/{companyId}/connections                       session  → 200 ConnectionList
linkConnection:   POST   /api/companies/{companyId}/connections                       session, attemptKey, bodyLimit 16 KB
                  body { connector: string, credential: Record<string, string> }    → 201 { connection }
                  failures READ_FAILURES, CONNECTOR_UNKNOWN 404, CONNECTION_CREDENTIAL_INVALID 422, CONNECTION_EXISTS 409, IDEMPOTENCY_CONFLICT 409
testConnection:   POST   /api/companies/{companyId}/connections/{connectionId}/test   session, bodyLimit 0 → 200 TestResult
                  failures READ_FAILURES, CONNECTION_NOT_FOUND 404, SEAL_REFUSED 500
unlinkConnection: DELETE /api/companies/{companyId}/connections/{connectionId}        session → 204
                  failures READ_FAILURES
```

- As frases (`connector-failures.ts`, na forma de `model-account-failures.ts`):
  `CONNECTOR_UNKNOWN` "Esse conector não existe no Conexus."; `CONNECTION_CREDENTIAL_INVALID` "Confira
  os campos: cole cada chave inteira."; `CONNECTION_EXISTS` "Essa integração já está ligada nesta
  empresa."; `CONNECTION_NOT_FOUND` "Essa integração foi desligada." Os textos da tela, o fundador
  aprova no fim.
- **Cada estado como união**: `TestResult` por `result`; dentro do Hub, a chamada do executor
  devolve `Answered` do kit, e o Testar a traduz: `OK` dá `READS`; `REFUSED` (qualquer motivo) dá `REFUSED`;
  `UNREADABLE` dá `UNREADABLE` naquela linha e o Testar segue; um `probe` que devolve `null` dá
  `NOTHING_TO_READ`; um item que o prazo do teste inteiro não alcança dá `NOT_TESTED`; `AUTH_REFUSED` no login ou numa chamada dá `AUTH_REFUSED` e encerra;
  `TOKEN_EXPIRED` pede um token de novo uma vez e repete, e a segunda vez é `AUTH_REFUSED`; um erro
  de transporte, o prazo, um redirecionamento ou um 5xx dá `UNREACHABLE` e encerra.
- **Cada id com a sua marca**: `ConnectionId` (hub-api), conferido na rota; `ConnectorId` pelo
  `connectorOf` do kit, na entrada do Ligar.
- **O dono de cada fato**: a lista de estados em hub-api; o catálogo no kit (`CONNECTORS`); quem pode
  em `roles.ts`; a origem de produção só na definição.
- **O esquema de cada entrada de fora**: a credencial pelo `auth.credential` do conector (o corpo da
  rota é `Record<string, string>` com até 8 campos de até 4.096 caracteres; o Hub confere com o
  esquema do conector e responde `CONNECTION_CREDENTIAL_INVALID` sem ecoar valor); as respostas do
  Sankhya pelos esquemas do kit.
- **O executor** (`executor.ts`), interno ao subject, para a 20 reusar:

```ts
export type Executor = {
  /** A new token for an opened connection: the login, sent once (no cache in step 19). */
  login(connection: OpenedConnection): Promise<Readonly<{ kind: 'TOKEN'; token: BearerToken } | { kind: 'AUTH_REFUSED' } | { kind: 'UNREACHABLE' }>>
  /** Calls one operation with that token; never logs input, output or credential (S41). Transport,
   *  deadline, redirect and 5xx are UNREACHABLE; the kit's Answered otherwise. */
  call<I, O>(connection: OpenedConnection, token: BearerToken, operation: Operation<I, O>, input: I, deadlineMs: number): Promise<Answered<O> | Readonly<{ kind: 'UNREACHABLE' }>>
}
// login takes the same deadlineMs (B): Testar passes min(callDeadlineMs, what is left of testDeadlineMs).
type OpenedConnection = Readonly<{ id: ConnectionId; linkedAt: string; connector: Connector; credential: Credential }> // Credential: the Secret of seal.ts
type BearerToken = Secret<'BearerToken'> // printed, it shows only its name, as seal.ts's Credential
export function createExecutor(deps: { fetch: typeof fetch; origins: ReadonlyMap<ConnectorId, string>; callDeadlineMs: number }): Executor
```

- **O modelo**: `builder/model-accounts/{routes,store,reseal}.ts` para rotas, comando e `reseal`
  (cumprem C21, C23 e C26); `projects/app-access` da 18 para "o membro lê, a dona muda, a recusa é
  404".

### As skills e a leitura

`docs/reference/stack.md`, linhas `fastify` (skill `fastify-best-practices`), `drizzle-orm`, `zod`;
`node` para `fetch`, `AbortSignal.timeout` e os `ReadableStream`. Segurança S8, S10, S32, S33, S36,
S41, S42; dados D22; código C33, C37, C38.

### A ordem do trabalho

1. Os testes dos critérios 9 a 16 e 23, falhando, pelas portas públicas (`createHub`, `inject`, T5), com
   o dublê do kit servindo num endereço local e a sua origem na configuração de teste.
2. `seal.ts`: o propósito e o id. `roles.ts` e `admission.ts`: a capacidade e as ações.
3. hub-api: os tipos, as rotas, as falhas; `npm run openapi` e o teste do contrato.
4. `executor.ts`: o login e o envio. Funções: Node 24 `fetch(request, { signal })` com o `Request`
   de `toRequest` (a origem do dublê, se a configuração a tem), `AbortSignal.timeout`,
   `response.body.getReader()` até o teto. Nenhum token guardado, nenhuma fila: o Testar chama em
   sequência.
5. `connections.ts`: Ligar (`database.command` com `admitMember('manageConnections')`, a chave de
   tentativa, `seal`, `insert`), Testar (os três passos da tabela de falhas: um `command` curto que
   admite e lê `connectors.sealed_of`; as chamadas fora de transação; um `command` que grava o estado
   `where id = … and linked_at = …`), Desligar, a lista (`database.read` com `readConnections`).
6. `routes.ts`, `public.ts`, `main.ts`; `reseal.ts` e o comando.
7. `tests/e2e/live-hub.ts`: o dublê do Sankhya sobe com o Hub local.
8. A decisão 0056 e a linha da 0031.

### Como se prova

`npm test -w @conexus/server -- src/hub/connectors/ src/platform/config.test.ts`; `npm run openapi
> /dev/null`; `npm run typecheck`; `npm run deps`. O critério 12 falha se o Testar chamar as
operações em paralelo (o dublê responde "4" e a linha sai `REFUSED`); o 14 falha se um teste plantar o Client Secret do dublê e o encontrar no log do Hub
(o teste lê o log, como `model-accounts-log.test.ts`).

### Parar se

- A U3 da 18 ainda não está no `main`: esperar; `roles.ts` e `admission.ts` são das duas.
- O Testar com o Sankhya de verdade leva até 80 s (o prazo do teste inteiro, critério 23): relatar
  se o QA, com o dublê lento, vê a tela sem resposta ou cortada antes do resultado.
- O `reseal` de hoje não tem um lugar para somar outro subject sem mudar a sua saída: relatar a
  forma.

## U4 A tela Integrações

**Base e modelo.** `main` com a U3. Sonnet: uma página com as peças de Contas de modelo.

### As linhas da tabela

- **Integrações na barra da empresa**: `routes/_app/companies/$companyId/route.tsx:40-70`, um
  `FrameLink` com o ícone `PlugIcon` (lucide) e "Integrações", depois de `RecentProjects` e antes do
  rodapé; a rota `routes/_app/companies/$companyId/integrations.tsx`, dentro da moldura da empresa.
- **A página Integrações**: `apps/web/src/hub/connectors/integrations.tsx`, com `queries.ts`,
  `link-dialog.tsx`, `test-result.tsx`, `public.ts`; as peças de
  `builder/model-accounts/company-accounts.tsx` (a lista), `key-form.tsx` (o formulário, a chave de
  tentativa até o Hub responder, W24; os campos limpos depois de ligar) e `AlertDialog` (Desligar).
  Como modelo, não como cópia: `web/src/hub/` não importa `web/src/builder/`, e o CI recusa um clone
  (jscpd, C26); as peças comuns já estão em `web/src/ui/` (`form.tsx`, `TextField`, `SubmitButton`).
- **O resultado por assunto** (a ampliação do B, um commit novo no pull request aberto,
  https://github.com/developmentconexus-ops/conexus/pull/454): `test-result.tsx` agrupa os
  `checks` por `subject`, na ordem em que chegam, numa lista de assuntos; cada assunto diz "lê"
  quando todos os seus itens são `READS`, senão "lê n de m" e, abaixo, cada item que não lê com o
  seu rótulo e a frase do seu resultado (`text.ts` ganha a de `NOT_TESTED`: "não testado: o Sankhya
  demorou, teste de novo"). Nenhum nome de assunto vive na tela: vêm do Hub. A 390 px, um assunto
  por linha e os itens embaixo.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/connectors/` | Cria | a rota |
| `apps/web/src/routes/_app/companies/$companyId/route.tsx`, `integrations.tsx`, `route.test.tsx` | Muda, cria | `routeTree.gen.ts` (gerado) |
| `docs/reference/screens.md` | Muda: a linha `/companies/<c>/integrations`, andar Empresa, dona, administrador, membro (lê) (W29) | `npm run docs` |
| testes: `apps/web/src/hub/connectors/integrations.test.tsx` | Cria | — |

### Os contratos que a unidade cria

Nenhum contrato novo: lê `listConnections` (a linha da ligação mostra também "conector versão
1.0.0", o leitor de `connectorVersion` nesta etapa) e chama `linkConnection`, `testConnection`,
`unlinkConnection` do hub-api. O formulário se monta dos `fields` do catálogo, cada um um
`TextField` de senha (`type="password"`, `autoComplete="off"`), o rótulo do catálogo. O resultado do
Testar vive no estado da página e some ao recarregar; o estado e `testedAt` vêm da lista. O
`NEEDS_REAUTH` mostra a frase do dono
e do administrador ou a do membro por `mayManage` (a matriz de estados).

### As skills e a leitura

`docs/reference/stack.md`, linhas `@tanstack/react-router` (as skills `router-core`),
`@tanstack/react-query`, `@base-ui/react`, `@shadcn/react` (skill `shadcn`); `impeccable` para a
crítica. Web W23, W24, W29, W30, W32, W34; design V29, V56.

### A ordem do trabalho

1. Os testes dos critérios 17 a 19, falhando, com o duplo do Hub da tela (`test-hub.tsx` de Contas de
   modelo como modelo); na ampliação do B, o caso de um assunto que lê inteiro, um com um item
   recusado e um com itens `NOT_TESTED`.
2. A rota e o `FrameLink`. 3. A página, o diálogo, o resultado, o Desligar. 4. A linha de
   `screens.md`. 5. A crítica do Impeccable nas duas larguras e nos dois temas.

### Como se prova

`npm test -w @conexus/web -- src/hub/connectors src/routes/_app/companies`; `npm run typecheck`;
`npm run lint`. O QA (critério 20) roda depois da U4, com `tests/e2e/live-hub.ts`.

### Parar se

- O andar da página (W29) não é o da Empresa porque a moldura recolhe a barra: relatar.
- Uma frase da tela precisa de um código que a U3 não tem: relatar o código.
