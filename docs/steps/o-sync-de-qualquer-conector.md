# O Sync de qualquer conector

O roteiro diz: "**O Sync de qualquer conector.** Logo depois da Capacidade 3 e antes da 4: a cópia de
conectores de API, com a definição versão 2 do motor sobre as leituras que o conector declara." Este
cartão parte do estudo "o Builder escreve o Sync de qualquer conector" (a opção B: o Builder declara a
cópia como dado sobre uma leitura que o conector declara, e o motor a executa), com os fatos do
Mercado Livre do estudo do Sync como serviço e as palavras do fundador de 2026-11-09 e 2026-11-10.
Esta capacidade estende a Capacidade 3, fechada em 2026-11-11 (https://github.com/developmentconexus-ops/conexus/pull/962; o cartão dela, no commit
`20a1fb81`, foi apagado no fechamento e é citado abaixo como "cartão da 3"): a ferramenta `copy_propose`, a tabela
`copy_proposal`, o cartão da proposta com **Ligar** na conversa e `copyModeOf`. A U3 da Capacidade 3
(propor cópia) entrou no `main` pelo https://github.com/developmentconexus-ops/conexus/pull/948 (lido
em `e7f68cb7`, antes de entrar); o que este cartão cita dela são os contratos do cartão da
3, e o construtor de cada unidade reabre as linhas no `main` do dia. Cada linha do `main` citada foi
lida em `3c6472e6`, com `@mastra/core` 1.82.0, `@neondatabase/serverless` 1.2.0, `zod` 4.6.5,
`drizzle-orm` 1.0.0-rc.4, `better-auth` 1.7.8, `@tanstack/react-query` 5.104.0 e PostgreSQL 18.

Nenhuma peça do Hub, do Builder, do motor ou das telas fala de um sistema pelo nome. O que é de um
sistema mora na pasta do conector dele: como cada leitura de lista pagina e por qual entrada filtra o
que mudou. O Mercado Livre é o primeiro conector a declarar isso, e por isso o roteiro de uso é dele.

## A página do fundador

**No fim desta capacidade** você pede ao Builder um app sobre o Mercado Livre, e ele mesmo escreve a
cópia que falta (de pedidos, de perguntas, do que o conector souber ler em lista), prova com uma
página de teste quantas linhas vieram e quantas chamadas uma passada gasta, e a propõe na conversa
para você ligar. Ninguém da equipe escreve um modelo por conector: a equipe escreve, uma vez por
leitura, como aquele sistema pagina; o Builder decide o que copiar.

**O roteiro de uso.** Você é dono da empresa. Em Integrações estão ligadas as suas lojas do Mercado
Livre (no exemplo, duas: "Loja Centro" e "Loja Norte"; com uma, o roteiro é o mesmo), liberadas a um
Projeto novo, "Vendas ML", sem app e sem cópia.

1. No Projeto "Vendas ML", peça ao Builder: "quero um painel das vendas do mês das minhas duas
   lojas". Ele já sabe que a empresa não tem cópia do Mercado Livre e que a leitura **Pedidos** do
   conector diz como pagina e que sabe pedir só o que mudou.
2. Ele investiga com umas leituras de pedidos, sem guardar nada, e propõe a cópia `ml_pedidos`: sobre
   a leitura Pedidos, as duas lojas na mesma tabela, as colunas que o painel usa (id, status, total,
   criado em, alterado em, os itens), a chave id e o modo **só o alterado**. Ele diz por quê: um pedido
   não some da API enquanto tem menos de 12 meses, só muda de status, e a leitura filtra pela data de
   alteração, então cada rodada lê só o que mudou; e a cópia só o alterado guarda os pedidos mais
   velhos, que o Mercado Livre deixa de mostrar. Na conversa aparece o cartão da proposta: o nome,
   "Pedidos · Mercado Livre", as duas lojas, a chave, o modo, quantas linhas a página de teste trouxe
   e quantas chamadas uma passada inteira gasta ("cerca de 6 chamadas por passada"), e o botão **Ligar**.
3. Toque **Ligar**, escolha o intervalo (30 minutos já vem marcado) e a cópia começa a rodar, já
   liberada ao Projeto. Na página **Cópias**, `ml_pedidos` mostra a fonte "Pedidos · Mercado Livre",
   as duas lojas, o modo e, no detalhe, a descrição que o Builder escreveu para a tabela e para cada
   coluna. O comprador (nome, apelido, contato) não está em coluna nenhuma: a leitura do conector já o
   corta.
4. O app mostra as vendas do mês por loja, com o nome que você deu a cada loja em Integrações, lendo
   `sync.ml_pedidos`; até a primeira passada terminar, ele diz que os dados ainda estão chegando.
5. Em outro Projeto, peça: "só quero ver os pedidos de hoje da Loja Centro". O Builder vê que a
   empresa já tem `ml_pedidos` e pede que você a libere a esse Projeto, em vez de propor uma segunda
   cópia do mesmo dado.

**O que você faz, e quando.** Antes: as suas lojas do Mercado Livre ligadas em Integrações (já
estão). No começo: aprova esta página. A gravação de quatro respostas reais do Mercado Livre com uma
loja sua (pedidos pedidos pela data de alteração, a primeira e a segunda página da varredura de
anúncios e a de perguntas), só leitura, feita pelo firstmate pelo Hub no ar, você já autorizou em
2026-11-10: "Pode". Os valores são trocados por inventados antes de entrar no repositório, que é a
regra dos dublês ([testing T29](../guides/testing.md)); a U2 entra no `main` com essas respostas, porque
pela mesma regra uma página da documentação não vale como resposta gravada, e o conector do Mercado
Livre não tem nenhuma resposta medida no serviço real que possa ficar no lugar. Os parâmetros novos
(`order.date_last_updated.from`, `search_type=scan`, `scroll_id`) são conferidos à mão na
documentação: o teste automático de hoje confere só que a rota de cada leitura está na página.
Quando a lista de permissões do banco do Conexus ganhar as duas tabelas novas: diz sim nesse pull
request, que vem sozinho ([data D11](../guides/data.md)). No fim: faz o roteiro, diz o que viu e
aprova os textos das telas.

**Fica de fora.**

- **Uma leitura que o conector ainda não tem** (o preço para ganhar de um anúncio, por exemplo). O
  Builder copia o que alguma leitura do conector alcança; uma leitura que falte entra no conector,
  mais adiante, pela fila do molde. Sua resposta abaixo.
- **Uma chamada por linha de outra cópia** (para cada anúncio, ler o detalhe dele). A busca de
  anúncios do Mercado Livre devolve só os ids; copiar o anúncio inteiro pede ler o detalhe de cada um.
  Entra num cartão próprio; nesta capacidade a busca de anúncios passa a ler mais de 1.000, mas a
  cópia dela guarda só os ids.
- **O histórico** (guardar o preço de cada dia). É um quarto modo, que acrescenta e nunca apaga, e pede
  uma decisão sua de quanto tempo guardar. Cartão próprio.
- **Mudar uma cópia já ligada**, acrescentando uma coluna ou uma conta. Como na Capacidade 2, uma cópia
  ligada não muda; o caminho das referências é a mudança só aditiva seguida de uma passada inteira, e
  entra num cartão próprio. Uma conta nova pede uma cópia nova, ou desligar e ligar de novo.
- **A janela de dias numa cópia de API.** Uma leitura de API recebe um filtro por chamada e não sabe
  pedir "o que mudou ou o que é dos últimos 30 dias" de uma vez; e o que a janela faz no Sankhya (tirar
  o que sumiu da fonte nos últimos dias) não acontece com pedidos, que não somem antes dos 12 meses, só
  mudam de status (depois disso saem da busca do Mercado Livre, e a cópia os guarda).
  A cópia de API é **inteira** ou **só o alterado**; a janela continua nas cópias do Sankhya.
- **O Mercado Livre avisando que algo mudou** (as notificações dele como "rode agora"). É da etapa dos
  avisos do fornecedor (20.2).
- **Os defeitos já anotados para depois.** Seis tocam este assunto. Dois entram. Uma linha do Sankhya
  sem data de alteração nunca é copiada na primeira leitura (#940); esta capacidade faz a primeira
  leitura sem filtro de data, e o conserto vale para o Sankhya também. E desligar uma conexão hoje
  deixa no banco da empresa a tabela da cópia e a leitura do app sobre ela
  (https://github.com/developmentconexus-ops/conexus/issues/953); esta capacidade a tira, pela decisão
  de apagar na hora abaixo. Os outros quatro esperam: um é da
  Capacidade 3 (#946), dois são conferências da Capacidade 2 no Hub no ar (#942, #943) e um pede uma
  decisão sua de outro assunto (#944).

**As decisões suas nesta capacidade.** Nove, todas respondidas por você, escritas como você decidiu. Nas peças do motor a palavra é **conta do conector** (cada conexão em Integrações: uma loja
do Mercado Livre, uma empresa no Sankhya, uma conta do HubSpot), como você disse em 2026-11-10: "Mas
nesse caso não é uma loja, seria uma conta do conector." A loja aparece só no exemplo.

- **O Builder cria a cópia sozinho, como uma declaração que o motor executa.** Em 2026-11-10, sobre
  as cópias escritas pela equipe: "aí eu tenho que fazer cópia para cada conector, não fica meio
  estranho isso, entendeu? ... não é o builder que vai construir, é a gente que vai tá fazendo. Tipo,
  é isso que tá me pegando." E sobre o que pedia: "A gente tá meio que querendo montar esse data
  warehouse, né? Nossa, dos conectores ... como que a gente vai fazer com que a gente tenha esse
  serviço de sync no nosso aplicativo, mas sem restringir muito. Tipo, como que o Mitra, por exemplo,
  também faria". A resposta que você recebeu sobre o Mitra: o nosso também deixa o Builder criar a
  cópia sozinho, mas como uma declaração que o motor executa, então paginar, esperar o fornecedor, não
  duplicar e não apagar numa passada pela metade são do motor, não da memória do agente. O Airbyte
  faz igual: quem escreve o conector declara como cada lista pagina, e a plataforma executa.
- **O Builder lê só o que o conector declara (1).** Em 2026-11-10: "1. A price to win foi um exemplo
  deveria estar no coinector e vai estar mais para frente". Uma leitura que falte entra no conector
  mais adiante.
- **Ligar pelo botão na conversa (2).** Em 2026-11-10: "2. B". É o cartão da proposta da Capacidade
  3, que nesta capacidade passa a mostrar também a leitura, as contas e as chamadas por passada.
- **A ordem (3).** Em 2026-11-10: "3. a": a Capacidade 3 como está, e esta logo depois, antes da 4.
- **O que der, em paralelo.** Em 2026-11-10: "Tô querendo executar em paralelo o que der." O que a
  regra deixa correr junto: uma etapa irmã só começa a construir depois que a anterior entra no
  `main`, e então as unidades dela correm ao lado do uso, dos consertos e do fechamento da anterior
  ([delivery L1](../guides/delivery.md)). Por isso a U1 e a U2 começam quando o pull request de U1 a U3 da
  Capacidade 3 (o 948) entrar no `main`, ao lado do uso da Capacidade 3: só mudam
  `packages/connectors`, e a U1 deixa a definição de cópia de hoje como está, então não tocam os
  arquivos do servidor que os consertos da Capacidade 3 podem mudar (conferido: o contrato novo da U1
  aplicado ao `main` passa no typecheck do servidor e do pacote dos conectores). A U2 entra no `main`
  só com a gravação acima. A U3 e a U4 vêm depois (veja "Como as unidades viram pull requests").
- **Várias contas do conector sem a plataforma decidir.** Em 2026-11-10, sobre uma tabela ou várias
  para as lojas: "a gente já tá querendo limitar como que ele vai fazer". O Builder escolhe em cada
  cópia: as contas numa tabela, ou uma cópia por conta. A plataforma só garante a coluna da conta, com
  o código que o sistema dá a ela e o nome que você deu à conexão, e que o fim de uma passada de uma
  conta nunca apaga linha de outra. As cópias continuam da empresa, não do app, como você disse em
  2026-11-09: "da empresa faz mais sentido".
- **Três peças do motor que são nossas.** Em 2026-11-10: "Okay aprovado". O motor das cópias já é
  nosso (a Capacidade 2 registrou por quê: nenhuma biblioteca instalada guarda onde uma cópia parou
  entre uma rodada e outra), e as três peças que você aprovou valem para qualquer conector:
  - (a) **cada conta do conector lembra onde parou.** Uma cópia de duas contas lembra, para cada uma,
    até onde já leu.
  - (b) **quando o fornecedor pede para esperar, a cópia espera.** Hoje esse pedido vira erro. Com
    (b), a rodada para, lembra a página em que estava e continua na próxima rodada. Quando o
    fornecedor diz quanto esperar, a cópia não chama antes disso; quando não diz (o Mercado Livre não
    diz; a página dele manda esperar um pouco mais a cada tentativa), a cópia continua na rodada
    seguinte do intervalo. Uma leitura cuja senha de página vence (a varredura do Mercado Livre vale 5
    minutos) recomeça do zero, só naquela conta, quando a senha venceu.
  - (c) **o conector declara onde o fornecedor conta o limite.** Ou pelo aplicativo do Conexus, um só
    para todas as empresas, ou por conta. Pelo aplicativo, as cópias de todas as empresas naquele
    conector fazem uma chamada por vez, na fila: se a vez demora mais que o prazo de uma chamada, a
    rodada para sem chamar, guarda onde estava e continua na seguinte, com a mesma frase de (b) na
    tela. Por conta, nada novo: vale a fila de hoje, uma chamada por vez em cada conexão (decisão
    0058), e as empresas não esperam umas pelas outras. O Mercado Livre declara "pelo aplicativo"
    (ele conta "per Client ID (application)", e o Conexus usa um aplicativo só para todas as
    empresas). O Sankhya declara "por conta": cada empresa tem o seu Sankhya e as suas chaves. O
    HubSpot, a Shopify, o Pipedrive e o WooCommerce também contariam por conta (a tabela abaixo).

  Exemplo: a Loja Norte recebe "espere" no meio da primeira leitura; a página Cópias diz "Esperando o
  fornecedor; a próxima rodada continua de onde parou", nada é apagado; a rodada seguinte continua da
  página em que parou, e nenhuma linha fica repetida. O jeito pronto lá fora: para (a) e (b), o
  Airbyte e o Nango fazem dentro da plataforma deles (o Nango guarda onde cada conexão parou; os dois
  esperam e repetem quando o fornecedor pede); para (c), o Airbyte limita as chamadas de uma conexão
  por janela, e nenhuma referência lida soma as chamadas de várias empresas num aplicativo só. Nenhum
  dos dois é uma peça que o Conexus instala, e nenhuma biblioteca instalada limita chamadas.
- **Uma conta do conector apagada em Integrações: nenhuma conta é a primeira (C).** Em 2026-11-10:
  "Não, beleza, eu concordo." Hoje (Capacidade 2) uma cópia pende de uma conexão: apagada a conexão, a
  cópia acaba. Com duas contas numa cópia, apagar qualquer uma tira só ela da cópia, e a outra segue;
  a cópia acaba só quando sai a sua última conta, e então acaba no mesmo instante, como hoje, mesmo
  pausada ou sem horário. Uma cópia de uma conta só (todas as de hoje) acaba como hoje, quando a conta
  sai. Os outros dois caminhos deixavam a cópia pendurada na primeira conta com que foi ligada:
  apagar a Loja Centro acabaria também a cópia da Loja Norte, e uma cópia nova da Loja Norte não
  traria de volta do Mercado Livre os pedidos dela com mais de 12 meses, que ele tira da busca. Custa
  à U3 uma peça a mais: a cópia deixa de pender de uma conexão e passa a acabar junto com a sua
  última conta.
- **Apagar na hora, e o diálogo diz antes o que vai sumir.** Você lembrou de sistemas que não apagam
  na hora: "Eles tinham uma política por trás, né? Caso tenha erro, pra recuperar." E escolheu em
  2026-11-10: "1 apagar na hora". Quando você
  aperta **Desligar** numa conta, as linhas dela saem na hora das cópias que seguem com outras
  contas, e a cópia de que ela era a última conta acaba no mesmo instante: a tabela sai do banco da
  empresa e o app perde a leitura dela, de modo que uma cópia nova com o mesmo nome começa limpa (hoje
  a tabela e a leitura do app ficam, que é a #953). Antes do clique, o diálogo **Desligar** diz o que
  vai sumir: quais cópias perdem as linhas daquela conta, com quantas quando o Hub sabe; que a cópia
  de que ela é a última conta acaba; e, numa cópia só o alterado, que o que o sistema já não mostra
  não volta se você ligar a conta de novo (no Mercado Livre, os pedidos com mais de 12 meses). O botão
  **Desligar** só se acende depois que o diálogo sabe o que some, ou sabe que não conseguiu saber. É o que
  a maioria das plataformas lidas faz com uma conta conectada: confirmar, dizer o que some e apagar
  (Activepieces, n8n, Budibase; o Nango guarda os registros por 1 dia, escondidos e sem desfazer). A
  volta de um engano é a restauração do banco da empresa a um instante passado, que o Neon faz e o
  operador pede, dentro da janela do plano ([arquitetura](../architecture.md), "Restore"). A
  restauração volta o banco inteiro, não uma tabela; nenhum botão novo. Antes de fechar esta
  capacidade, a janela do plano contratado é conferida: a arquitetura diz um número e uma referência
  do Neon para plataformas diz outro (veja "A dívida").

**O mesmo motor em outros conectores.** O que um conector declara para uma leitura virar cópia é
pouco: como a lista pagina (por deslocamento, por um cursor que a resposta devolve, ou numa resposta
só), por qual entrada ela pede só o que mudou desde um instante, e onde o fornecedor conta o limite.
Abaixo, o Mercado Livre (o primeiro a declarar, na U2), o Sankhya de hoje e quatro conectores do
Airbyte (`airbyte@8aed3123`), que esta capacidade não constrói; servem para ver se as declarações
cabem.

| Conector | Como a lista pagina | Como sabe o que mudou | Onde o limite é contado | Cabe nas declarações? |
| --- | --- | --- | --- | --- |
| Mercado Livre, pedidos (U2) | Deslocamento: `offset` e `limit` (`mercado-livre/operations/vendas.ts:16-25`) | `order.date_last_updated.from`, campo `date_last_updated` (a documentação de pedidos) | Pelo aplicativo do Conexus: "per Client ID (application)" (a página de limite do Mercado Livre); um aplicativo para todas as empresas (`mercado-livre/definition.ts:26`) | Sim |
| Sankhya (hoje, versão 1) | Pela chave: o Conexus escreve `ORDER BY` a chave e "depois da última chave" (`sankhya/copy-read.ts:44-63`) | A coluna que a definição escolhe, em SQL (`sankhya/copy-read.ts:37-41`) | Por conta: cada empresa entra com as suas chaves (`sankhya/definition.ts:30-37`) e tem o seu Sankhya | Sim, como hoje: a consulta SQL continua a versão 1; o Sankhya declara "por conta" |
| HubSpot | Cursor: `after`, que vem em `paging.next.after` (`source-hubspot/manifest.yaml:249-261`) | Só pela busca, `POST …/search` com a data de alteração entre dois instantes no corpo (`manifest.yaml:1696-1727`) | Por conta: o pico por aplicativo em cada conta HubSpot e a cota do dia da conta, os dois pelo plano da conta (`docs/integrations/sources/hubspot.md:406-412`) | Em parte: a lista inteira sim (cursor, modo inteira). Só o alterado não, numa conta grande: a busca para em 10.000 resultados por consulta, e o Airbyte recomeça a busca pelo último id com código próprio (`source-hubspot/components.py:835-858`); o kit não declara isso |
| Shopify | Cursor no cabeçalho `Link` da resposta (`source-shopify/source_shopify/streams/base_streams.py:70-75`); produtos por uma operação em massa do GraphQL (`streams/streams.py:172`) | `updated_at_min`, campo `updated_at` (`base_streams.py:43-44`) | Por loja: o cabeçalho `X-Shopify-Shop-Api-Call-Limit` (`source_shopify/utils.py:183-196`) | Não, hoje: o kit dá à leitura só o status e o corpo da resposta (`kernel/operation.ts:24`), e o cursor da Shopify vem num cabeçalho; a operação em massa é um trabalho que se pede, espera e baixa, não uma lista |
| Pipedrive | Cursor: `start`, que vem em `additional_data.pagination.next_start` (`source-pipedrive/manifest.yaml:124-131`) | `updated_since`, campo `update_time` (`manifest.yaml:37-51`) | Por conta: a cota diária é da empresa no Pipedrive e o pico é por chave (`docs/integrations/sources/pipedrive.md:129`) | Sim |
| WooCommerce | Deslocamento: `offset` e `per_page` (`source-woocommerce/manifest.yaml:33-44`) | `modified_after`, campo `date_modified_gmt` (`manifest.yaml:100-110`) | Por conta: a API não tem limite próprio, quem limita é o servidor da loja (`docs/integrations/sources/woocommerce.md:99`) | Sim |

O que não cabe fica de fora desta capacidade, sem peça inventada: ler o cursor num cabeçalho e
recomeçar uma busca que tem teto pelo último id entram no kit quando o primeiro conector que precisa
deles for construído.

**Como as unidades viram pull requests.** A U1 (o contrato da leitura de lista, no kit) e a U2 (as
leituras do Mercado Livre declaram a lista) vão num pull request de construção, um commit por
unidade, e começam agora que a página está aprovada (o 948, U1 a U3 da Capacidade 3, e o fechamento já estão no `main`; [delivery L1](../guides/delivery.md)): só mudam `packages/connectors`,
e a U1 não muda a definição de cópia que o servidor lê de hoje. A U4 opcional da Capacidade 3, se você
a autorizar, muda `packages/app-contract`, `packages/app`, `hub/{apps,copies}`, `main.ts` e
`packages/hub-api`, nenhum arquivo da U1 ou da U2, então elas não esperam por ela. Esse pull request entra no `main` quando a gravação da U2
estiver nele; se a gravação demorar, a U1 entra sozinha e a U2 segue num pull request seu. A lista
de permissões das duas tabelas novas vai num pull request só dela, depois da da Capacidade 3,
que já está no `main`. A U3 (o motor) e a U4 (o Builder e as telas) vão num segundo pull request de
construção, depois do 948, que já está no `main`, porque mudam os mesmos arquivos de `hub/copies` que
a U3 da Capacidade 3 muda; é a U3 que junta as duas versões da definição numa só, que o servidor lê. Ao aprovar esta página você aprova também esse agrupamento.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 O contrato da leitura de lista | `list` na operação do kit (como pagina: `OFFSET`, `CURSOR` ou `NONE`; por qual entrada filtra o que mudou; o teto); `Rows` ganha `seguinte` e `total`; a `CopyDefinitionV2` ao lado da `CopyDefinition` de hoje, que não muda (fonte `OPERATION`, coluna com `path` e o tipo `json` só no enum da versão 2, chave `bigint` ou `text`, descrições, sem janela); o texto canônico de cada tipo, do kit; `callLimit` na declaração do conector, com o Sankhya `ACCOUNT`; a posição opaca `CopyPosition`; a leitura de cópia genérica (`listInputOf`, `listPageOf`); a conformidade que anda todas as páginas do dublê; `PageInput.since` nulo na primeira passada, com a leitura do Sankhya sem filtro de data nesse caso (#940) | `packages/connectors/src/kernel/`, `packages/connectors/src/sankhya/copy-read.ts` e o seu teste, `packages/connectors/src/sankhya/definition.ts`, `packages/connectors/src/index.ts` | [testing](../guides/testing.md) | esta página aprovada; o 948 no `main` (delivery L1) |
| U2 As leituras do Mercado Livre declaram a lista | `pedidos` com `list` de `OFFSET` e o filtro de alteração (`order.date_last_updated.from`); `anuncios` e `perguntas` com `list` de `CURSOR` (`search_type=scan`, `scroll_id`), sem o teto falso de 1.000; `reclamacoes` e `periodosDeFaturamento` com `list` de `OFFSET` (`mensagensDoPacote` não: pede um pacote); `callLimit` `APP` na declaração do conector; o dublê pagina as cinco e anda pela conformidade; as respostas gravadas (sem elas, a U2 não entra no `main`); a skill do conector corrigida | `packages/connectors/src/mercado-livre/` | [testing](../guides/testing.md) | U1 |
| U3 O motor versão 2 | `copies.copy_source` (cada conexão de uma cópia com a sua conta, a sua posição, a sua passada, a sua marca e a sua espera) e a migração que dá a cada cópia de hoje a sua fonte; a rodada que anda as fontes; a página de uma `OPERATION` por `readThrough` com a leitura genérica; o 429 como `PARTIAL` `WAIT`; o cursor vencido recomeça a passada da fonte; o teto como `ERROR` `COPY_SOURCE_CEILING`; a fila de uma chamada de cópia por vez por conector que declara o limite contado pelo aplicativo; no banco da empresa, o tipo `json`, a chave de texto, `_account` e `_account_name`, o fim de passada só da conta da fonte e as descrições como `COMMENT ON`; a primeira passada sem filtro de alteração (#940); a união das duas versões em `CopyDefinition`, lida pelo servidor; o Desligar que tira na hora as linhas da conta das cópias que seguem e encerra no mesmo instante, pausada ou não, a cópia de que ela era a última fonte, com a tabela apagada depois do `DELETE` no Hub e, com ela, a leitura do app (#953), ou, se o banco da empresa calar nesse meio, anotada em `copies.copy_table_left` e apagada no próximo Desligar da empresa ou no Ligar seguinte; a leitura das cópias de uma conexão (`listConnectionCopies`) | `packages/connectors/src/kernel/copy.ts`, `apps/server/src/hub/copies/`, `apps/server/src/hub/connectors/`, `apps/server/src/main.ts`, `apps/server/src/platform/copy-sql.ts`, `apps/server/src/platform/company-postgres.ts`, `apps/server/src/platform/test-company-postgres.ts`, `apps/server/migrations/`, `packages/hub-api/src/{copies,copy-failures,connectors}.ts`, `apps/web/src/hub/copies/text.ts`, `docs/reference/boundaries.md` | [data](../guides/data.md) | U1; o 948 no `main`; a lista de permissões, num pull request só dela (D11) |
| U4 O Builder propõe de qualquer conector | `copy_propose` numa conexão cujo conector declara uma leitura de lista, com a definição versão 2, várias conexões e a prova maior; `copy_proposal_source` e `proved_calls`; ligar a proposta cria as fontes; `CopySummary` e `CopyProposalSummary` com as fontes, a origem e a descrição; a página Cópias, a linha Proposta, o diálogo e o cartão da conversa com a leitura, as contas e as chamadas por passada; o bloco "## Data" com a origem, as descrições e as colunas da conta; a regra da fonte sem "hoje, o Mercado Livre"; as seis perguntas na descrição de `copy_propose` e em `conexus-data`; o diálogo **Desligar** que diz antes do clique o que vai sumir | `apps/server/src/hub/{copies,connectors}/`, `apps/server/src/builder/{connectors,app-data,conversation}/`, `apps/server/src/{main,conversations-of}.ts`, `packages/hub-api/src/`, `packages/app/skills/conexus-data/`, `apps/web/src/hub/copies/`, `apps/web/src/hub/connectors/`, `apps/web/src/builder/conversation/`, `docs/reference/{screens,builder-prompt}.md`, `docs/explanation/builder-turn.md` | [security](../guides/security.md) | U3 |

**A ordem.** A U1 e a U2 vão num pull request de construção, um commit cada, nessa ordem; começam
agora que a página está aprovada (o 948 e o fechamento da Capacidade 3 já estão no `main`;
[delivery L1](../guides/delivery.md)), sem tocar os arquivos dela (só `packages/connectors/`, e a
`CopyDefinition` que o servidor lê fica igual até a U3). Conferido no `main` em `3c6472e6`: a `CopyDefinitionV2` ao lado
da de hoje, `PageInput.since` nulo, `Rows.seguinte` e `Rows.total`, `Operation.list` e o Sankhya sem
filtro com `since` nulo passam no `tsc` de `packages/connectors` e de `apps/server`; a união das duas
versões no lugar da `CopyDefinition` quebra `hub/copies/{list,run,enable}.ts` e `routes.test.ts`,
arquivos que o 948 muda, e por isso é da U3. A lista de permissões de
`copies.copy_source`, `copies.copy_table_left`, `copies.copy_proposal_source` e da coluna `proved_calls` vai num pull request só
dela, com a palavra do fundador ([data D11](../guides/data.md)), depois da da Capacidade 3 (a tabela
`copy_proposal`, já no `main`), porque as duas mudam `apps/server/database-grants.sql` e o
`snapshot.json`. A U3 e a U4 vão num segundo pull request de construção, um commit cada, nessa ordem,
depois do 948, que já está no `main`: mudam `hub/copies/tables.ts`, `enable.ts`, `mode.ts`, `store.ts`,
`hub/connectors/copy-port.ts` e `builder-port.ts`, que a U3 da Capacidade 3 muda. Nenhuma unidade
corre em paralelo com outra do mesmo pull request: cada uma lê o contrato da anterior.

**Os trilhos.** A U2 muda `packages/connectors/src/mercado-livre/`, a pasta do trilho do molde
([delivery L27](../guides/delivery.md)); nenhuma etapa do molde está em construção (`docs/steps/` não
tem cartão `pattern-`), então ela não espera; e como implementa o contrato do kit, é revista como
unidade da fronteira. A U1 muda uma linha de `packages/connectors/src/sankhya/copy-read.ts` (a #940), da
mesma pasta, pelo mesmo motivo. Nenhuma unidade muda `apps/web/src/{brand,ui}/`; se uma precisar, para
e espera a unidade de desenho.

**Orçamento de código alterado.** U1: ~650 linhas (a declaração e as suas conferências ~120, a
definição versão 2 e a posição ~150, a leitura genérica ~200, a conformidade ~100, `Rows`, `PageInput`
e o Sankhya ~80). U2: ~300 (as seis declarações e as entradas ~110, o dublê com a varredura e o filtro
~120, a skill ~70). U3: ~1.250 (a tabela das fontes, a migração e o estado ~180, a rodada por fonte
~260, a página de `OPERATION`, a espera e o cursor ~180, a fila por conector ~80, o SQL da conta, do
`json`, do `timestamptz` e das descrições ~180, o fim de passada por conta ~60, os contratos, as falhas e o texto ~160, o Desligar que apaga na hora e
a leitura das cópias de uma conexão ~150).
U4: ~1.120 (propor e provar a versão 2 ~280, as várias conexões e a tabela delas ~150, ligar com as
fontes ~100, os contratos da lista e da proposta ~120, as telas e o cartão ~250, o bloco, o prompt, a
skill e os documentos ~150, o diálogo Desligar ~70). Total da capacidade: ~3.320 linhas, abaixo do orçamento de
[delivery L2](../guides/delivery.md).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `defineOperation` aceita `list` numa leitura com `paging` `OFFSET` (as entradas do deslocamento e do tamanho, o máximo, o teto ou nulo), `CURSOR` (a entrada do cursor, a do tamanho, o máximo, a entrada fixa da primeira página, a validade em milissegundos) ou `NONE`, e `changed` (a entrada e o campo da linha) ou nulo; `defineConnector` aceita `callLimit: { countedBy: 'APP' | 'ACCOUNT' }` (onde o fornecedor conta o limite); recusa, lançando com o nome: `list` numa operação que não é `read`; um conector com uma leitura de `list` e sem `callLimit`; uma entrada nomeada em `paging` ou `changed` que não é chave do `z.object` da entrada da operação | `packages/connectors/src/kernel/list.test.ts`, "a declaração da lista" | must |
| 2 | U1 | `CopyDefinitionV2` aceita a versão 2: fonte `{ kind: 'OPERATION', operation, input }`, colunas com `path` e o tipo `json`, chave de 1 a 4 colunas `bigint` ou `text`, `changedSince` com uma coluna `date` ou `timestamp`, a descrição da tabela e a de cada coluna; recusa, com o caminho: chave numa coluna `json`, `numeric`, `date`, `timestamp` ou `boolean`; uma coluna cujo nome começa por `_`; uma coluna ou uma chave repetida; `window` na versão 2; a `CopyDefinition` de hoje não muda: os casos de hoje passam iguais e uma coluna `json` nela é recusada | `packages/connectors/src/kernel/copy.test.ts`, os casos de hoje sem mudar e "a versão 2" | must |
| 3 | U1 | `listInputOf` monta a entrada da operação: a entrada fixa da definição; numa `OFFSET`, o deslocamento da posição (0 sem posição) e o tamanho no máximo declarado; numa `CURSOR`, a entrada fixa da primeira página sem posição e o cursor com posição; a entrada de `changed` com `since` só quando a definição tem `changedSince` e `since` não é nulo; a entrada sai pelo esquema da própria operação (`requestOf`), e uma entrada fixa que nomeia uma entrada de `paging` ou de `changed` é recusada | `list.test.ts`, "a entrada de cada página" | must |
| 4 | U1 | `listPageOf` dá as células na ordem das colunas, cada uma o texto canônico do tipo, que casa com o padrão do kit para o tipo (`CANONICAL_CELL`; `bigint` inteiro, `numeric` decimal, `boolean` `true` ou `false`, `date` `AAAA-MM-DD`, `timestamp` ISO 8601, `json` o texto JSON, `text` como veio), nulo onde o caminho não existe; um valor que não cabe no tipo devolve `MISFIT` com a coluna e o caminho, nunca nulo; a próxima posição (`OFFSET` somado às linhas; `CURSOR` com `Rows.seguinte` e o instante); `more` vem de `Rows.temMais`, e `temMais` nulo devolve `UNREADABLE` `NO_MORE_SIGNAL` (o fim da passada só por evidência); `OFFSET` com teto que chegaria ao teto com mais páginas devolve `CEILING` | `list.test.ts`, "a página na forma da cópia" | must |
| 5 | U1 | A conformidade anda, para cada leitura com `list` de um conector, todas as páginas do dublê por `listInputOf` e `listPageOf`: cada linha do dublê aparece uma vez, nenhuma falta nem repete; com `changed`, a página pedida com `since` traz só as linhas alteradas desde então; uma declaração de paginação errada (o tamanho trocado pelo deslocamento) falha a conformidade | `packages/connectors/src/kernel/conformance.ts` (`assertListsWalk`), chamado por `kernel.test.ts` com um conector de teste e um plantio errado | must |
| 6 | U1 | Com `PageInput.since` nulo, a leitura do Sankhya monta a consulta sem filtro de data de alteração, e a linha com a data vazia vem; com `since`, o filtro de hoje; cada célula dos cinco modelos casa com o padrão do kit para o tipo (`CANONICAL_CELL`, no lugar do `CANONICAL` local do teste) | `packages/connectors/src/sankhya/copy-read.test.ts`, "a primeira passada lê tudo" | must |
| 7 | U2 | `pedidos` aceita `changedFrom` e manda `order.date_last_updated.from`; declara `OFFSET` (`offset`, `limit`, 50, teto nulo) e `changed` (`changedFrom`, `date_last_updated`); as leituras e os pedidos de hoje continuam iguais | `packages/connectors/src/mercado-livre/operations.test.ts`, "pedidos pelo que mudou" | must |
| 8 | U2 | `anuncios` e `perguntas` declaram `CURSOR`: a primeira página manda `search_type=scan` e o tamanho, as seguintes mandam `scroll_id`; `Rows.seguinte` vem do `scroll_id` da resposta e falta na última; o resumo de cada uma e a skill não dizem mais "no máximo 1000"; o dublê com 1.300 anúncios inventados entrega todos pela conformidade; recusa: uma página com linhas e sem `scroll_id` dá `UNREADABLE` `NO_CURSOR` | `operations.test.ts`, "a varredura passa de mil"; a conformidade do conector | must |
| 9 | U2 | `reclamacoes` e `periodosDeFaturamento` declaram `OFFSET`; `mensagensDoPacote` não declara `list` (pede o `packId` de um pacote; uma cópia dela seria de um pacote só); `Rows.total` vem de `paging.total` (ou do total no topo) nas leituras de lista; a conformidade anda as cinco | `packages/connectors/src/mercado-livre/mercado-livre.test.ts`, a conformidade | must |
| 10 | U2 | Por uma definição versão 2 sobre cada leitura com `list` que tem `omit` (`pedidos`, `perguntas`), nenhuma célula de nenhuma página traz o texto pessoal que o dublê planta, nem por uma coluna `json` do objeto inteiro: o `omit` da leitura vale para a cópia | `operations.test.ts`, "o comprador não chega à cópia" | must |
| 11 | U2 | O dublê responde as quatro formas novas (pedidos pelo que mudou, a primeira e a segunda página da varredura de anúncios, a de perguntas) com respostas gravadas do serviço real, os valores inventados, com o serviço, a data e a rota ao lado ([testing T29](../guides/testing.md)); sem a gravação, a U2 não entra no `main` (não há envelope medido do Mercado Livre que fique no lugar) | `fake.test.ts`, "as respostas gravadas" | must |
| 12 | U3 | Uma cópia versão 2 de uma fonte `OFFSET`: a primeira passada lê todas as páginas sem filtro de alteração, grava cada linha com `_account` e `_account_name`, e fecha; a passada seguinte manda o filtro com a marca menos um dia e lê só o que mudou; nenhuma linha duplica; recusa: uma célula que não cabe no tipo (`MISFIT`) ou uma página sem sinal de fim (`UNREADABLE`) termina `ERROR` `COPY_SOURCE_UNREADABLE`, a posição fica e a marca não anda | `apps/server/src/hub/copies/run-v2.test.ts`, "a passada de uma leitura de lista" | must |
| 13 | U3 | Uma página respondida `BUSY` termina a rodada `PARTIAL` `WAIT`, guarda a posição da fonte e, quando o fornecedor disse quanto esperar, a hora até a qual não se chama; nada é apagado e a marca não anda; uma rodada antes dessa hora não chama e termina `PARTIAL` `WAIT`; depois, continua da posição; com dois 429 no meio, as linhas saem sem repetição; numa cópia de duas fontes, um 429 da primeira num conector que declara `countedBy: 'APP'` termina a rodada sem chamar a segunda, e num que declara `ACCOUNT` a rodada segue para a segunda, que lê as suas páginas, e termina `PARTIAL` `WAIT` | `run-v2.test.ts`, "o fornecedor pede para esperar" | must |
| 14 | U3 | Uma fonte `CURSOR` cuja posição passou da validade declarada recomeça a passada dela do começo, com o mesmo número de passada, e o registro diz `COPY_PASS_RESTARTED`; a passada fecha certa; um cursor dentro da validade continua | `run-v2.test.ts`, "o cursor vencido recomeça" (o relógio injetado, T20) | must |
| 15 | U3 | `listPageOf` com `CEILING` termina a rodada `ERROR` `COPY_SOURCE_CEILING`, sem apagar nem andar a marca, com a posição guardada; a página Cópias diz a frase da falha | `run-v2.test.ts`, "o teto da leitura" | must |
| 16 | U3 | Uma cópia com duas fontes (duas contas do mesmo conector) tem uma tabela com chave primária `(_account, <chave>)`; o mesmo id em duas contas dá duas linhas; cada fonte tem a sua posição, a sua passada e a sua marca; recusa: uma segunda fonte com a mesma conta na mesma cópia viola `(copy_id, account_ref)`; o fim de uma passada inteira da fonte A apaga só as linhas de A que a passada não gravou, e as de B ficam | `run-v2.test.ts`, "duas contas numa tabela" | must |
| 17 | U3 | O fim de uma passada de uma fonte põe em `_account_name` o nome que a conexão tem agora; renomear a conexão aparece na tabela depois da passada seguinte daquela fonte | `run-v2.test.ts`, "o nome da conta segue a conexão" | must |
| 18 | U3 | Duas cópias de duas empresas sobre um conector que declara `callLimit: { countedBy: 'APP' }` nunca têm duas chamadas de cópia abertas ao mesmo tempo (o contador de chamadas abertas do dublê nunca passa de 1); duas cópias de duas empresas sobre um conector que declara `countedBy: 'ACCOUNT'` podem se sobrepor, cada conexão na sua fila de hoje (0058); uma chamada que passa do prazo esperando a vez termina a rodada `PARTIAL` `WAIT`, sem chamar e sem `wait_until`, e a posição fica | `apps/server/src/hub/connectors/copy-lane.test.ts`, "uma chamada de cópia por vez por conector" | must |
| 19 | U3 | No banco da empresa, uma coluna `json` é `jsonb` e se lê com `jsonb_array_elements`; uma `timestamp` da versão 2 é `timestamptz` e guarda o instante com o deslocamento que veio; uma chave `text` grava `MLB1`; a descrição da tabela e a de cada coluna estão em `obj_description` e `col_description` | `apps/server/src/platform/copy-sql.test.ts`, "json, chave de texto e descrições" | must |
| 20 | U3 | Na primeira passada (sem marca), a leitura manda `since` nulo, nas cópias versão 1 e 2 (#940) | `run-v2.test.ts`, "a primeira passada sem filtro"; `run.test.ts`, o mesmo caso na versão 1 | must |
| 21 | U3 | Depois da migração, cada cópia de hoje tem uma fonte com a sua conexão, a sua posição (`{ kind: 'KEY', after }`), a sua passada e a sua marca; a primeira rodada continua da posição guardada; a `CopyDefinition` é a união das duas versões (`discriminatedUnion` por `version`), a versão 1 de hoje lida igual; os testes de hoje do motor passam sem mudar o que veem | `apps/server/src/hub/copies/run.test.ts`, os casos de hoje; `migrate-copy-source.test.ts`, "a fonte de cada cópia de hoje"; `copy.test.ts`, "as duas versões" | must |
| 22 | U3 | Pela decisão C da página: apagar qualquer conexão de uma cópia de duas tira só a fonte dela e a cópia continua com a outra; apagar a última conexão encerra a cópia no mesmo instante, como a cascata da Capacidade 2 (a linha da cópia sai, com as rodadas e as liberações), sem esperar rodada nenhuma, também numa cópia pausada e numa cópia sem horário; recusa: depois do apagar, nenhuma linha de `copies.copy` fica sem fonte; uma cópia de uma conexão só acaba como hoje; uma página que a rodada gravou da conta que saiu depois do Desligar sai no começo da rodada seguinte, e as linhas da outra conta ficam | `run-v2.test.ts`, "a conta desligada" | must |
| 23 | U3 | O registro de cada rodada e de cada página leva só ids, contagens, o código e o motivo (`WAIT`, `CAP`, `STOPPED`, `COPY_PASS_RESTARTED`), nunca o cursor, a entrada da leitura, uma célula nem uma linha (S41) | `run-v2.test.ts`, "o registro não leva dado" | must |
| 24 | U3 | A página Cópias diz a rodada `PARTIAL` `WAIT` como "Esperando o fornecedor; a próxima rodada continua de onde parou" | `apps/web/src/hub/copies/copy-list.test.tsx`, "a rodada que esperou" | must |
| 25 | U4 | `copy_propose` existe no turno quando uma conexão liberada ao Projeto é de um conector com `copy` e `readDoor` (versão 1) ou com uma leitura que declara `list` (versão 2); num Projeto só com outra conexão, não; `GrantedConnection.reads` leva, de cada leitura com `list`, a paginação, o campo de alteração e o teto | `apps/server/src/builder/connectors/copy-propose.test.ts`, "a ferramenta onde há leitura de lista" | must |
| 26 | U4 | Propor a versão 2 confere a definição contra a leitura: a operação é uma leitura do conector com `list`; `changedSince` só com `changed`, e a coluna dela tem o `path` igual ao campo de `changed`; a entrada fixa passa pelo esquema da operação e não nomeia entrada de `paging` nem de `changed`; cada recusa é `MALFORMED` com o caminho, e nada é gravado | `apps/server/src/hub/copies/propose-v2.test.ts`, "a definição contra a leitura" | must |
| 27 | U4 | A prova da versão 2 lê, por conexão, até 2 páginas e 100 linhas (os tetos do estudo, "como os do Airbyte"): a primeira sem filtro e, com `changedSince`, uma com a alteração do último dia; devolve só contagens (`rows`, `more`, a chave nula, a chave repetida, por coluna os nulos e os que não couberam no tipo, o total que a leitura informa, as chamadas por passada, as linhas alteradas no último dia ou nulo); recusa `KEY_NOT_UNIQUE` com chave nula ou repetida e `TYPE_MISFIT` com a coluna; cada chamada conta na conta de 50; nenhuma linha vai ao modelo nem à tabela | `propose-v2.test.ts`, "a prova conta e não mostra" | must |
| 28 | U4 | `connections` com duas conexões do mesmo conector, liberadas ao Projeto, de um papel que usa a leitura, dá uma proposta com duas fontes; recusa: uma conexão de outro conector ou duas num conector de conta `none` (`MALFORMED`); uma não liberada (`NOT_GRANTED`); um papel que não usa a leitura (`NOT_IN_ROLE` com o nome dela) | `propose-v2.test.ts`, "várias contas" | must |
| 29 | U4 | `enableCopy` `{ from: 'PROPOSAL' }` de uma proposta versão 2 liga a cópia com a definição igual byte a byte e uma fonte por conexão da proposta, libera ao Projeto e começa a primeira rodada; uma conexão que não está `ACTIVE` dá `COPY_CONNECTION_NOT_READY`; um papel que não usa a leitura numa delas, `NOT_IN_ROLE` | `apps/server/src/hub/copies/accept-v2.test.ts`, "ligar a proposta de uma leitura de lista" | must |
| 30 | U4 | `listCopies` traz em cada cópia `sources` (a conexão com o nome e o conector), `shown.source` (`QUERY` com a consulta, ou `OPERATION` com a leitura, o rótulo dela e a entrada fixa) e a descrição; e em cada proposta o mesmo, com `proved.calls` | `apps/server/src/hub/copies/routes.test.ts`, "a lista com a origem" | must |
| 31 | U4 | A página Cópias mostra na linha de uma cópia versão 2 a fonte "<leitura> · <conector>" e as contas; no detalhe, a descrição da tabela e das colunas e os filtros fixos; a linha **Proposta** e o diálogo **Ligar** dizem as contas e "cerca de N chamadas por passada", ou "a leitura não informa o total"; a 390 px nada rola de lado (V18) | `apps/web/src/hub/copies/copy-list.test.tsx`, "a origem da cópia"; `copy-proposal.test.tsx`, "a proposta de uma leitura de lista" | must |
| 32 | U4 | O cartão da proposta na conversa mostra a leitura, as contas, a chave, o modo, as linhas da prova e as chamadas por passada, do resultado de `copy_propose`; **Ligar** como no cartão da 3 | `apps/web/src/builder/conversation/copy-proposal-card.test.tsx`, "o cartão de uma leitura de lista" | must |
| 33 | U4 | O bloco "## Data" diz de cada cópia liberada a origem (a leitura, o conector e a entrada fixa, ou "a consulta"), a descrição, as colunas com a descrição de cada uma e, numa cópia de contas, `"_account" text` e `"_account_name" text`, dentro dos 8 KB; duas montagens com uma rodada entre elas dão o mesmo texto | `apps/server/src/builder/app-data/context.test.ts`, "a origem e as descrições" | must |
| 34 | U4 | O pedido ao modelo leva a regra da fonte, igual no bloco, no prompt e em `conexus-data`: onde o conector copia ou declara uma leitura de lista, o app lê a cópia e o Builder propõe a que falta; ao vivo só para um conector sem nenhuma das duas e para gravar; a frase "hoje, o Mercado Livre" não está em nenhum dos três | `apps/server/src/builder/conversation/data-turn.test.ts`, "o app lê a cópia de qualquer conector" | must |
| 35 | U4 | A descrição de `copy_propose` e `conexus-data` trazem as seis perguntas: guardar ou ler na hora; já existe; de qual leitura e com qual filtro; qual chave; qual modo (sem `changed` inteira; com `changed`, só o alterado, salvo mais de 10% mudando por rodada); de quanto em quanto tempo, pelas chamadas por passada | `copy-propose.test.ts`, "as seis perguntas" | must |
| 36 | U4 | Um turno com o modelo dublê, numa conexão do dublê do Mercado Livre, chama `copy_propose` com a versão 2 e argumentos tirados só do que o turno mostrou ao modelo (T28), e a conversa mostra o cartão da proposta | `data-turn.test.ts`, "o Builder propõe uma cópia de pedidos" | must |
| 37 | U4 | O registro de propor leva só ids, as contagens da prova e o código, nunca a entrada fixa, um caminho, uma célula nem uma linha (S41) | `propose-v2.test.ts`, "o registro não leva dado" | must |
| 38 | U4 | QA percorre o roteiro de uso nos dois temas, a 1366 e a 390 px, com o modelo dublê e o dublê do Mercado Livre | relatório de QA ([testing T25](../guides/testing.md)) | should |
| 39 | U3 | Pela decisão "1 apagar na hora" e a #953: quando `unlinkConnection` responde 200, numa cópia que segue com outra conta as linhas cuja `_account` é da conta que saiu já não estão em `sync.<cópia>` e as da outra ficam, sem esperar rodada; numa cópia de que ela era a última fonte (uma cópia de hoje, de uma conexão, liberada a um Projeto), o login do app desse Projeto lendo `sync.<cópia>` é recusado, a tabela não existe, e uma cópia nova ligada com o mesmo nome começa vazia e sem a leitura do app até ser liberada de novo; também numa cópia pausada; numa cópia de duas contas desligadas uma depois da outra, a primeira deixa a cópia só com as linhas da outra e a segunda a acaba, com a tabela apagada; recusa: com o banco da empresa calado antes do `DELETE` no Hub, `unlinkConnection` responde 503 `COPY_DATABASE_UNAVAILABLE`, a conexão continua, nada saiu do Hub, e o Desligar repetido com o banco de volta termina; com o banco calado só depois do `DELETE`, `unlinkConnection` responde 200 com `tablesLeft` trazendo o nome da cópia que acabou, a conexão e a cópia já não existem no Hub, `copies.copy_table_left` guarda a tabela, e, com o banco de volta, o Desligar de outra conexão da empresa ou o Ligar de uma cópia apaga a tabela e a linha | `apps/server/src/hub/connectors/unlink-copies.test.ts`, "desligar tira as linhas e a leitura do app" (escrito primeiro; hoje falha) | must |
| 40 | U3 | `listConnectionCopies` dá, de cada cópia que tem a conexão como fonte, o id, o nome, o modo (`copyModeOf`), se ela é a última fonte e as linhas daquela conta (`copy.rows` quando é a última; a contagem por `_account` no banco da empresa quando há outra; nulo quando o banco da empresa não responde); uma conexão sem cópia dá a lista vazia; recusa: sem `manageConnections`, a recusa de admissão de hoje; uma conexão de outra empresa, `CONNECTION_NOT_FOUND` | `apps/server/src/hub/connectors/connection-copies.test.ts`, "as cópias que o Desligar apaga" | must |
| 41 | U4 | O diálogo **Desligar** de uma conexão que é fonte diz, antes do clique, de cada cópia que segue "A cópia `<nome>` perde as N linhas desta conta" (sem o número quando a contagem é nula), de cada cópia de que ela é a última fonte "A cópia `<nome>` acaba", e, quando alguma dessas cópias é só o alterado, "O que o `<conector>` já não mostra não volta se você ligar esta conta de novo", com o nome que o conector dá a si; uma conexão sem cópia mostra o diálogo de hoje; enquanto a leitura não chega, **Desligar** está desabilitado, e se habilita quando ela chega ou falha; a leitura que falha diz que não conseguiu ler as cópias e deixa **Desligar**; um Desligar que responde com `tablesLeft` diz "A conexão foi removida. A tabela da cópia `<nome>` ainda não saiu do banco da empresa; o Conexus a apaga no próximo Desligar ou quando uma cópia for ligada", e não diz que a conexão continua; a 390 px nada rola de lado (V18) | `apps/web/src/hub/connectors/unlink-dialog.test.tsx`, "o que o Desligar apaga" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A linha de `copy_propose` (versão 2) | "Propondo uma cópia" | não se aplica | O mesmo | "Não conseguiu propor a cópia", o detalhe com a recusa do sistema, o erro da definição, `KEY_NOT_UNIQUE` ou `TYPE_MISFIT` com a coluna | `NOT_GRANTED` como falha | `NOT_IN_ROLE` como falha, com o nome da leitura | `EXISTS` como falha, com a frase de pedir a liberação; `CALLS_SPENT` como falha |
| O cartão da proposta na conversa | O cartão do cartão da 3, mais a leitura ("Pedidos · Mercado Livre"), as contas e "cerca de N chamadas por passada" | não se aplica | Como no cartão da 3 | Como no cartão da 3 | Como no cartão da 3 | Como no cartão da 3 | Como no cartão da 3 |
| Cópias, a linha de uma cópia versão 2 (`…/copies`) | Uma cópia e nenhuma outra: a linha, sem frase de primeira vez | A lista da Capacidade 2 | O esqueleto de hoje | A falha de leitura de hoje | não se aplica | Membro: a página não aparece (Capacidade 2) | A rodada `PARTIAL` `WAIT`: "Esperando o fornecedor; a próxima rodada continua de onde parou"; `COPY_SOURCE_CEILING`: a frase da falha |
| Cópias, o detalhe de uma cópia versão 2 | A fonte, as contas, o modo, a descrição da tabela, cada coluna com o tipo e a descrição, os filtros fixos | Uma coluna sem descrição: só o nome e o tipo | Como hoje | Como hoje | Como hoje | Como hoje | Como hoje |
| Cópias, a linha **Proposta** de uma leitura de lista | A linha do cartão da 3, mais as contas e as chamadas por passada | não se aplica | Como no cartão da 3 | Como no cartão da 3 | Como no cartão da 3 | Como no cartão da 3 | Como no cartão da 3 |
| Desligar uma conexão (o diálogo, Integrações) | Uma conexão que é fonte: além de "O Conexus apaga as chaves que guardou.", "A cópia `<nome>` perde as N linhas desta conta" (sem N quando a contagem é nula), "A cópia `<nome>` acaba" e, numa só o alterado, "O que o `<conector>` já não mostra não volta se você ligar esta conta de novo" | Uma conexão sem cópia: o diálogo de hoje | O diálogo de hoje enquanto a leitura das cópias não chega, com **Desligar** desabilitado até ela chegar ou falhar | "Não conseguiu ler as cópias desta conta"; **Desligar** continua | `CONNECTION_NOT_FOUND`: como hoje | Sem `manageConnections`: o botão não aparece, como hoje | `COPY_DATABASE_UNAVAILABLE` ao desligar (o banco da empresa calado antes do apagar): a frase da falha de `copy-failures.ts`, e a conexão continua; a resposta com `tablesLeft` (o banco calado só depois do apagar): "A conexão foi removida. A tabela da cópia `<nome>` ainda não saiu do banco da empresa; o Conexus a apaga no próximo Desligar ou quando uma cópia for ligada" |
| Ligar a proposta (o diálogo) de uma leitura de lista | A leitura e o conector no lugar da consulta, a entrada fixa, a chave, as contas, "cerca de N chamadas por passada", o intervalo (30 minutos marcado) | não se aplica | Como no cartão da 3 | Como no cartão da 3 | Como no cartão da 3 | `NOT_IN_ROLE` com o nome da leitura | Como no cartão da 3; uma conta não `ACTIVE`: `COPY_CONNECTION_NOT_READY` |

As frases entre aspas são a proposta do cartão; o fundador aprova os textos das telas no fim
([delivery L23](../guides/delivery.md)). A linha de `copy_propose` é uma linha `generic`: o detalhe
abre os argumentos, o resultado e a recusa ([screens](../../.agents/skills/conexus-scope/references/screens.md),
item 5); nenhuma célula declara "sem detalhe".

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Operation.list` (`paging`, `changed`) | U1, o kit; U2, as leituras do Mercado Livre | U1, `listInputOf`, `listPageOf` e a conformidade; U3, a rodada (a validade do cursor); U4, `GrantedConnection.reads[].list` e a conferência de propor |
| `Connector.callLimit` (`countedBy`) | U1, o kit e o Sankhya; U2, o Mercado Livre | U1, `defineConnector`; U3, a fila de `limits.ts` |
| `Rows.seguinte`, `Rows.total` | U2, `mercado-livre/answers.ts` | U1, `listPageOf` (a próxima posição, o total); U4, a prova (as chamadas por passada) |
| `CopyDefinition` versão 2 | U4, o Builder por `copy_propose`, guardada na proposta e na cópia | U1, `listInputOf` e `listPageOf`; U3, a rodada e `copy-sql.ts`; U4, a lista, o bloco e as telas |
| `CopyPosition` (`KEY`, `OFFSET`, `CURSOR`) | U3, a rodada, em `copy_source.position` | U3, a rodada e a validade do cursor |
| `copy_source` (`connection_id`, `account_ref`, `pass`, `position`, `watermark`, `wait_until`) | U3, a migração e a rodada; U4, ligar a proposta | U3, a rodada; U4, a lista (`sources`) |
| `copy_table_left` (`company_id`, `copy_id`, `name`) | U3, o apagar da cópia sem fonte | U3, `dropEndedCopies` (no Desligar e no Ligar) |
| `_account`, `_account_name` (colunas do motor na tabela da cópia) | U3, `writePage` e `closePass` | O app, pelo `db`; U4, o bloco "## Data" |
| `CopyRun.outcome` `PARTIAL` `WAIT`, `ERROR` `COPY_SOURCE_CEILING` | U3, a rodada | U3, `text.ts` da página Cópias |
| `CopySummary.sources`, `shown.source`, `description` | U4, `hub/copies/list.ts` | U4, a lista, o detalhe e o diálogo |
| `CopyProposalSummary.sources`, `proved.calls` | U4, `hub/copies/store.ts` | U4, a linha Proposta, o diálogo e o cartão da conversa |
| `ProposeAnswer.PROPOSED` na versão 2 (mais `sources`, `source`, `calls`) | U4, `hub/copies/propose.ts` | U4, a ferramenta e o cartão da conversa |
| `CopyOfConnection` (`listConnectionCopies`: o nome, o modo, `last`, `rows`) | U3, `hub/copies/sources.ts` | U4, o diálogo **Desligar** |
| `ProjectCopiesView.released[].origin`, `description`, as descrições das colunas | U4, `hub/copies/project-view.ts` | U4, `builder/app-data/context.ts` |

**O desenho de caixas.** O produto antigo não tinha Sync (estudo da Capacidade 2, `e0353c36`), então
não há captura a seguir. A linha de uma cópia versão 2 e o cartão seguem os da Capacidade 3; muda o
que se lê na fonte e o que se acrescenta (as contas e as chamadas por passada).

```
1280 px, conversa do Builder                   390 px, quem não gerencia cópias
┌──────────────────────────────────────────┐   ┌──────────────────────────┐
│ Propus a cópia ml_pedidos; ela aparece   │   │ Propus a cópia ml_pedidos│
│ aqui e na página Cópias.                 │   │ ┌──────────────────────┐ │
│ ┌──────────────────────────────────────┐ │   │ │ ml_pedidos           │ │
│ │ ml_pedidos · Pedidos · Mercado Livre │ │   │ │ Pedidos · Mercado    │ │
│ │ Loja Centro, Loja Norte              │ │   │ │ Livre                │ │
│ │ só o alterado · chave id             │ │   │ │ Loja Centro, Loja    │ │
│ │ teste: mais de 50 · cerca de 6       │ │   │ │ Norte                │ │
│ │ chamadas por passada                 │ │   │ │ só o alterado        │ │
│ │                          [ Ligar ]   │ │   │ │ cerca de 6 chamadas  │ │
│ └──────────────────────────────────────┘ │   │ │ por passada          │ │
└──────────────────────────────────────────┘   │ │ Um dono, administra- │ │
                                               │ │ dor ou desenvolvedor │ │
                                               │ │ liga na página Cópias│ │
                                               │ └──────────────────────┘ │
                                               └──────────────────────────┘
```

```
1280 px, …/copies
┌ ⌂ ─┬────────────────────┬──────────────────────────────────────────────────────────────────┐
│    │ Nova conversa      │ Cópias                                         [ Ligar uma cópia ] │
│    │                    │ Dado          Fonte                Estado     Última rodada Linhas  │
│    │                    │ ml_pedidos    Pedidos · Mercado L. Em dia     14:30, 8 s    1.274   │
│    │                    │   Loja Centro, Loja Norte · só o alterado          Vendas ML      │
│    │                    │ ml_perguntas  Perguntas · Merc. L. Esperando  14:15         —       │
│    │                    │   Esperando o fornecedor; a próxima rodada continua de onde parou  │
└────┴────────────────────┴──────────────────────────────────────────────────────────────────┘

390 px, …/copies                         Ligar a proposta (diálogo)
┌──────────────────────────┐            ┌──────────────────────────────┐
│ ☰  Cópias  [Ligar]       │            │ Ligar a cópia ml_pedidos     │
│ ml_pedidos   Em dia      │            │ Leitura  Pedidos · Mercado L.│
│ Pedidos · Mercado Livre  │            │ Filtros  nenhum              │
│ Loja Centro, Loja Norte  │            │ Chave    id                  │
│ só o alterado · 1.274    │            │ Contas   Loja Centro, Norte  │
│ Vendas ML                │            │ cerca de 6 chamadas/passada  │
└──────────────────────────┘            │ Intervalo [ 30 minutos ▾ ]   │
                                        │ Libera ao Projeto Vendas ML  │
                                        │        [ Cancelar ] [ Ligar ]│
                                        └──────────────────────────────┘
```

"Loja Centro", "Loja Norte" e "Vendas ML" no desenho são nomes que a empresa dá, dados; nada da tela os
escreve. "Mercado Livre" e "Pedidos" vêm do conector (o nome dele e o rótulo da leitura).

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| A migração que dá a cada cópia de hoje a sua fonte (`INSERT … SELECT … WHERE NOT EXISTS`) | `migrate` roda uma vez antes do Hub (D9); a condição faz a segunda não inserir | Uma transação só: tudo ou nada | O banco do Hub fora: o Hub não sobe (D9) | A linha de `migrate` de hoje | 21 |
| Propor a versão 2: as páginas de prova de cada conexão, depois a proposta e as fontes dela, numa transação | O índice único parcial de `copy_proposal` da 3: a segunda recebe `EXISTS` | A prova leu e a gravação falhou: nada fica, `DATABASE_UNAVAILABLE`; nenhuma linha guardada em lugar algum; a prova da segunda conexão recusada: nada é gravado, a recusa volta inteira (C79) | O sistema recusando ou calado: a resposta dele inteira ao modelo; `BUSY`: a recusa com a espera; o banco do Hub: `DATABASE_UNAVAILABLE` | `COPY_PROPOSED` com ids e as contagens | 26, 27, 28, 37 |
| Ligar a proposta versão 2: na transação do Hub, a proposta travada, a cópia, as fontes, a proposta `ACCEPTED`, o `project_copy`; depois os passos da Capacidade 2 (a tabela com `_account`, as descrições) e o `GRANT` | A trava da proposta, como na 3 | A transação do Hub é tudo ou nada (D22); os passos de fora retomam pela chave de tentativa; `ensureCopyTable` e `COMMENT ON` são repetíveis | O banco da empresa: como no cartão da 3 (o critério dele de ligar a proposta) | `COPY_ENABLED` com a origem e ids | 29 |
| Uma página da rodada versão 2: a chamada, a página gravada no banco da empresa, a posição da fonte salva no Hub | A trava da cópia (Capacidade 2): uma rodada por vez | A página gravada e a posição não salva: a próxima relê a página e o `ON CONFLICT` absorve; a chamada respondida e a gravação falhou: nada anda, `COPY_DATABASE_UNAVAILABLE` | `BUSY`: `PARTIAL` `WAIT` (13); recusa, `UNREADABLE`, `MISFIT`: `ERROR` com o código, a posição fica; o banco da empresa: `COPY_DATABASE_UNAVAILABLE` | `COPY_RUN_ENDED` com o motivo | 12, 13, 15, 23 |
| A espera de uma fonte (`wait_until` salvo com a posição) | Só a rodada que tem a trava escreve | Uma instrução só, com a posição | O banco do Hub fora: a rodada termina `COPY_DATABASE_UNAVAILABLE`, nada anda | `COPY_RUN_ENDED` `WAIT` | 13 |
| O recomeço da passada de uma fonte de cursor vencido (posição nula) | Só a rodada que tem a trava | Uma instrução só; o número da passada não muda, então nada é apagado por engano | Como acima | `COPY_PASS_RESTARTED` | 14 |
| O fim da passada de uma fonte: `DELETE` só da conta dela, o `UPDATE` de `_account_name`, a contagem; depois a passada e a marca da fonte no Hub | Só a rodada que tem a trava | As instruções do banco da empresa numa transação; a marca só anda depois; se o Hub falha entre as duas, a próxima rodada refaz a passada daquela fonte e o `DELETE` repete sem efeito novo | O banco da empresa ou o do Hub: `COPY_DATABASE_UNAVAILABLE`, a marca não anda | `COPY_RUN_ENDED` `COMPLETE` | 16, 17 |
| A fila de uma chamada de cópia por conector (em processo, decisão 0058) | Uma por vez, as outras na ordem de chegada até o prazo delas | Uma rodada parada (o sinal) sai da fila sem chamar | Uma chamada que passa do prazo na fila: `DEADLINE`, a rodada termina `PARTIAL` `WAIT` sem chamar, e a posição fica | o registro de hoje da chamada; `COPY_RUN_ENDED` `WAIT` | 18 |
| O Desligar no banco da empresa, antes do `DELETE` no Hub (`leaveCopies`): em toda cópia da conexão que tem `_account`, `DELETE` das linhas da conta; nenhuma tabela apagada aqui, porque quem acaba só se sabe no `DELETE`; antes da retirada no fornecedor | Dois Desligar da mesma conexão: as instruções são repetíveis, o segundo não acha linha; duas conexões de uma mesma cópia desligadas juntas: cada uma tira só as suas linhas, e quem acaba a cópia é o `DELETE` que a deixa sem fonte (a linha "Encerrar a cópia sem fonte"); uma rodada gravando no meio: a página que ficou sai no começo da rodada seguinte (a rede abaixo) | Fora de transação, cada instrução repetível (D22); parado no meio: a conexão continua, e o Desligar repetido termina o que faltou | O banco da empresa fora: 503 `COPY_DATABASE_UNAVAILABLE`, a conexão continua, nada sai do Hub nem do fornecedor | `CONNECTION_REMOVED` de hoje (`routes.ts:98`), mais `COPIES_LEFT` com os ids das cópias de que a conexão saiu e, de cada uma, se acabou, nunca uma linha (S41) | 39 |
| Apagar a tabela das cópias que acabaram (`dropEndedCopies`: para cada linha da empresa em `copies.copy_table_left`, `dropCopyTable`, `DROP TABLE IF EXISTS sync.<cópia>` no banco da empresa, e depois a linha sai), depois do `DELETE` de todo Desligar da empresa e antes de `ensureCopyTable` em todo Ligar | Cada linha travada (`SELECT … FOR UPDATE SKIP LOCKED`) na transação do Hub que a apaga, do `DROP` até sair: dois que drenam juntos nunca apagam a mesma tabela duas vezes, e um Ligar que acha a linha do seu nome travada espera e só então cria a tabela | Uma instrução por cópia, repetível; o privilégio do app mora na tabela e sai com ela, sem `REVOKE`; a linha só sai depois do `DROP`, então parar no meio deixa a linha e o próximo dreno refaz | O banco da empresa fora depois do `DELETE`: a conexão e a cópia já saíram do Hub, a linha de `copy_table_left` fica, a tabela fica (sem as linhas da conta, que `leaveCopies` já tirou), e o Desligar responde 200 com `tablesLeft` (veja "A dívida"); num Ligar, a recusa dele de hoje com o banco fora | `COPY_TABLES_LEFT` com os ids das cópias cuja tabela ficou | 39 |
| Ler as cópias de uma conexão (`listConnectionCopies`) | Só leitura | Só leitura | O banco da empresa fora: a contagem de uma cópia que segue vem nula; o banco do Hub fora: `DATABASE_UNAVAILABLE` | nada | 40, 41 |
| Apagar uma conexão que é fonte de uma cópia (a cascata da chave estrangeira de `copy_source`; `copy_connection_fkey` não existe mais) | A cascata do PostgreSQL | Uma instrução da Capacidade 2 | Como hoje | Como hoje | 22 |
| A rede do Desligar: tirar da tabela as linhas de uma conta sem fonte (`DELETE … WHERE _account <> ALL($refs)`, no banco da empresa, no começo da rodada) | Só a rodada que tem a trava | Uma instrução numa transação; repetível: a segunda não acha linha | O banco da empresa fora: `COPY_DATABASE_UNAVAILABLE`, nenhuma marca anda | `COPY_RUN_ENDED` com o motivo | 22 |
| Encerrar a cópia sem fonte: a linha da cópia sai do Hub no mesmo instante em que sai a sua última fonte, como a cascata da Capacidade 2, pausada ou não; o `unlink` fica sabendo quais acabaram (o `RETURNING` do apagar das cópias sem fonte, ou, com o gatilho, as cópias da conexão lidas antes que já não existem depois) | A mesma transação trava antes as linhas `copies.copy` das cópias da conexão (`SELECT … FOR UPDATE`), e só então olha se sobrou fonte: de duas conexões da mesma cópia desligadas juntas, a segunda espera a primeira e vê a cópia sem fonte. A forma (a mesma transação do `DELETE` da conexão, ou um gatilho no `DELETE` de `copy_source`, com a mesma trava) é do construtor da U3 | Junto com o `DELETE` da fonte, tudo ou nada, com a linha de cada cópia que acabou em `copies.copy_table_left` (a empresa, o id e o nome da tabela) gravada na mesma transação; a cascata leva as rodadas e as liberações, como hoje | O banco do Hub fora: o apagar da conexão falha inteiro e nada sai do Hub; o banco da empresa já perdeu as linhas da conta nas cópias que têm `_account` e nenhuma tabela, e o Desligar repetido termina | Como hoje | 22, 39 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A leitura de lista declara como pagina e como filtra o que mudou | U1 | `packages/connectors/src/kernel/operation.ts:139-159` (`Operation` sem declaração de lista); `mercado-livre/operations/vendas.ts:16-25` (`offset` e `limit` como entrada, sem dizer que são a paginação); `mercado-livre/answers.ts:43-59` (`moreOf`) | `airbyte@8aed3123` `docs/platform/connector-development/connector-builder-ui/pagination.md:22-62` (Offset Increment), `:239-313` (Cursor Pagination); `airbyte-integrations/connectors/source-ebay-fulfillment/manifest.yaml:19-58` (`OffsetIncrement` e `DatetimeBasedCursor` em `lastModifiedDate`) | Quem escreve o conector declara, por lista, o paginador e o campo de alteração; a plataforma executa | embrulhado: `list` na `Operation` do kit (a entrada de [boundaries](../reference/boundaries.md) "Connectors (step 19)" registra `defineOperation`; a U1 acrescenta a ela a declaração `list`), com `OFFSET`, `CURSOR` e `NONE` e `changed`; o que acrescentamos é só a declaração, sem motor declarativo | | 2026-11-10: "1. A price to win foi um exemplo deveria estar no coinector" | `packages/connectors/src/kernel/list.ts` |
| Uma leitura de cópia genérica, no lugar de cada conector escrever a sua | U1 | `kernel/copy.ts:87-91` (`ConnectorCopy.read`, uma por conector); `sankhya/copy-read.ts` | `airbyte@8aed3123` `source-ebay-fulfillment/manifest.yaml:23-54` (`SimpleRetriever`, `DpathExtractor` por `field_path`, o paginador) | Uma rotina da plataforma lê qualquer stream pela declaração | embrulhado: `listInputOf` e `listPageOf`, funções puras do kit; a chamada continua pela operação e por `readThrough` | O laboratório do estudo (fora do repositório): a mesma rotina copiou pedidos e uma leitura por anúncio só lendo duas declarações | 2026-11-10 (as cópias escritas pela equipe): "não é o builder que vai construir, é a gente que vai tá fazendo" | `packages/connectors/src/kernel/list.ts` |
| A definição versão 2: fonte `OPERATION`, `path`, `json`, chave de texto, descrições | U1 | `kernel/copy.ts:22-60` (só `QUERY`; chave só `bigint`, `:41-48`); `:16` (os tipos) | `airbyte@8aed3123` `source-ebay-fulfillment/manifest.yaml:21-22` (`primary_key`); `nango@e6c6131` `docs/guides/functions/syncs/records-cache.mdx:23-28` (o registro identificado pelo `id` que o autor dá) | A chave é de quem define; o formato não é da plataforma | nativo: Zod, `discriminatedUnion` por `version`; a versão 1 fica como está | | 2026-11-10 ("sem restringir muito") | — |
| A posição opaca | U1, U3 | `kernel/copy.ts:69` (`after: number[]`); `hub/copies/run.ts:199-205` (`Number(...)` da chave); `hub/copies/tables.ts:64` (`position` já é `jsonb`) | `airbyte@8aed3123` `pagination.md:239-279` (o cursor que a API devolve vai na página seguinte) | A posição é o que a API devolve | remendo já aprovado ([boundaries](../reference/boundaries.md), "How far a pass has read"), com a forma nova: a união `CopyPosition` | nenhuma biblioteca instalada faz (`@mastra/core` 1.82.0 guarda o estado só dentro de uma rodada; `drizzle-orm` 1.0.0-rc.4 só grava); `run-v2.test.ts` (12, 14) | 2026-11-10, as três peças: "Okay aprovado" (a) | — |
| Cada conta com o seu ponto, numa tabela só | U3 | `hub/copies/tables.ts:37-90` (uma conexão por cópia; `copy_company_id_name_key`, `:71`); `platform/copy-sql.ts:146-172` (o fim de passada sem conta) | `nango@e6c6131` `docs/guides/functions/syncs/sync-partitioning.mdx:7-17` (uma definição; cada execução com o seu checkpoint e os seus registros) | Uma definição, o estado por conexão | remendo: `copies.copy_source` e o fim de passada por `_account`; a cópia não pende de uma conexão | nenhuma biblioteca instalada faz (`@mastra/core` 1.82.0 guarda o estado só dentro de uma rodada; `drizzle-orm` 1.0.0-rc.4 só grava); `run-v2.test.ts` (16, 22) | 2026-11-10, as três peças: "Okay aprovado" (a); 2026-11-10: "a gente já tá querendo limitar como que ele vai fazer" | migração de `copy_source` |
| O Desligar apaga na hora e diz antes o que some | U3, U4 | `hub/connectors/connections.ts:294-312` (`unlink` apaga a conexão e a cascata `copy_connection_fkey`, `hub/copies/tables.ts:81-86`, leva a cópia); nenhum `REVOKE` nem `DROP TABLE` no caminho (`hub/copies/grants.ts:90-135` só ao tirar uma liberação); `platform/copy-sql.ts:93` (`CREATE TABLE IF NOT EXISTS` reaproveita a tabela velha); `apps/web/src/hub/connectors/unlink-dialog.tsx:69-70` (o diálogo não fala de cópia) | `activepieces@f34c43cd` `packages/web/src/app/routes/connections/index.tsx:360`; `n8n@2e855356` `packages/frontend/@n8n/i18n/src/locales/en.json:1305,1413`; `budibase@624d68a` `packages/builder/src/components/backend/modals/DeleteDataConfirmationModal.svelte:240-261`; `nango@e6c6131` `packages/utils/lib/environment/parse.ts:346` (os registros saem depois de 1 dia, sem desfazer) | Confirmar dizendo o que quebra ou some, e apagar; nenhuma dá a dado sincronizado um prazo com desfazer | nativo: `DROP TABLE` leva a tabela e os privilégios (medido num PostgreSQL 17: recriada com o mesmo nome, o login do app tem zero privilégios e recebe `permission denied`); o diálogo é o `AlertDialog` de hoje | — | 2026-11-10: "Não, beleza, eu concordo." (C); 2026-11-10: "1 apagar na hora" | `unlink-copies.test.ts`, `connection-copies.test.ts`, `unlink-dialog.test.tsx` |
| O nome da conta na tabela | U3 | `packages/app/skills/conexus-data/SKILL.md:50` ("never write a store's name in the code"); `hub/connectors/tables.ts:67-70` (`account_ref`, `account_label`) | — | — | nativo: `_account_name` é o nome da conexão, escrito pelo motor no fim de cada passada da fonte | | não precisa | — |
| O 429 como espera | U3 | `hub/connectors/copy-port.ts:141-144` (`BUSY` vira `COPY_SOURCE_UNREACHABLE`); `hub/copies/run.ts:253-258` (vira `ERROR`); decisão 0058 | `airbyte@8aed3123` `connector-builder-ui/error-handling.md:15,107` (repete o 429 e pausa pelo `Retry-After`); `nango@e6c6131` `docs/guides/functions/rate-limits.mdx:15-38` (repete com espera, ou pelo cabeçalho) | A plataforma espera e retoma | remendo: `PARTIAL` `WAIT`, a posição guardada e `wait_until` por fonte; a espera dentro do prazo da chamada continua do executor (0058) | nenhuma biblioteca instalada faz (`@mastra/core` 1.82.0 guarda o estado só dentro de uma rodada; `drizzle-orm` 1.0.0-rc.4 só grava); `run-v2.test.ts` (13) | 2026-11-10, as três peças: "Okay aprovado" (b) | — |
| O cursor de varredura que expira | U3 | nenhum | A documentação do Mercado Livre (estudo do Sync como serviço, 1.3): `scroll_id` vale 5 minutos | — | remendo: a validade declarada em `paging.ttlMs`; a rodada nunca manda um cursor vencido e recomeça a passada da fonte, sem precisar ler a recusa de um cursor vencido, que ninguém gravou | nenhuma biblioteca instalada faz (`@mastra/core` 1.82.0 guarda o estado só dentro de uma rodada; `drizzle-orm` 1.0.0-rc.4 só grava); `run-v2.test.ts` (14) | 2026-11-10, as três peças: "Okay aprovado" (b) | — |
| O conector declara onde o limite é contado, e uma chamada de cópia por vez no que conta pelo aplicativo | U1, U2, U3 | `hub/connectors/limits.ts:16-60` (uma chamada por vez por conexão, em processo, 0058); `packages/connectors/src/kernel/definition.ts:42-69` (`Connector`, sem dizer onde o limite é contado); `mercado-livre/definition.ts:26` (um aplicativo para todas as empresas) | `airbyte@8aed3123` `docs/platform/connector-development/config-based/understanding-the-yaml-file/rate-limit-api-budget.md:3-30` (`HTTPAPIBudget`, as políticas de chamadas) | A plataforma limita as chamadas de uma conexão por janela; nada no texto soma as chamadas de várias conexões de clientes num aplicativo OAuth só | remendo: `callLimit` (`countedBy` `APP` ou `ACCOUNT`) na declaração do conector (o Mercado Livre `APP`, pela página de limite dele, "per Client ID (application)"; o Sankhya `ACCOUNT`); a mesma fila de `limits.ts`, com a chave do conector, para as leituras de cópia dos que declaram `APP`; nenhum número inventado (o Mercado Livre não publica o seu) | nenhum limitador instalado (`node_modules` não tem `p-limit`, `p-queue` nem `bottleneck`; só `p-retry` 7.1.1, de outro pacote, que repete e não limita); `copy-lane.test.ts` (18) | 2026-11-10, as três peças: "Okay aprovado" (c) | `apps/server/src/hub/connectors/copy-lane.test.ts` |
| O teto de deslocamento de uma leitura | U1, U3 | `mercado-livre/operations/anuncios.ts:9-10` (o resumo diz 1000) | — | — | nativo no kit: `paging.ceiling`; alcançado com mais páginas, a rodada termina `ERROR` e nunca fecha | | não precisa | — |
| As leituras do Mercado Livre dizem a verdade: pedidos pelo que mudou, a varredura que passa de mil | U2 | `mercado-livre/operations/vendas.ts:29-38` (só `order.date_created`); `anuncios.ts:22-28`, `perguntas.ts:28-36` (só `offset`) | https://developers.mercadolivre.com.br/pt_br/gerenciamento-de-vendas/gerenciamento-de-vendas (`order.date_last_updated.from`); https://developers.mercadolivre.com.br/pt_br/gerenciamento-de-vendas/itens-e-buscas (`search_type=scan`, `scroll_id`, 5 minutos, até 100) | Os parâmetros da própria API | nativo: as entradas da API; a rota de cada uma conferida pelo `docs.test.ts` de hoje, que procura só o método e o caminho na página (`mercado-livre/docs.test.ts:12-17`); os parâmetros conferidos à mão na página citada | | 2026-11-10: "1. A price to win ... deveria estar no coinector" | — |
| O comprador fora da cópia | U2 | `mercado-livre/operations/vendas.ts:6-7` (`BUYER`); `answers.ts:61-70` (`without`) | — | — | nativo: a cópia lê pela operação, e o `omit` vale | | a decisão de 2026-10 do conector, que corta o comprador | — |
| As descrições da tabela e das colunas | U3, U4 | `platform/copy-sql.ts:85-103` (`ensureCopyTable` sem comentário) | PostgreSQL 18, `COMMENT ON TABLE`, `COMMENT ON COLUMN`, `obj_description`, `col_description` | O catálogo guarda a descrição | nativo | | 2026-11-10 ("esse data warehouse ... dos conectores") | — |
| A prova da versão 2 | U4 | cartão da 3, U3 (`provePage`: uma página, só a contagem) | `nango@e6c6131` `docs/guides/functions/functions-guide.mdx:235-262` (o agente roda a seco numa conexão real antes de publicar) | Uma leitura pequena contra o sistema real, antes de ligar | embrulhado: `provePage` lê até 2 páginas e 100 linhas por conexão e devolve só contagens | `propose-v2.test.ts` (27) | 2026-11-10: "como que ele vai avaliar" | — |
| As seis perguntas do Builder | U4 | cartão da 3, U3 (a descrição de `copy_propose` com a regra dos 10%); `packages/app/skills/conexus-data/SKILL.md` | `nango@e6c6131` `docs/guides/functions/syncs/sync-functions.mdx:88-92` ("For agents": paginação, filtro incremental, apagado, frequência) | O agente levanta as mesmas perguntas antes de gerar | nativo: texto da ferramenta e da skill | | 2026-11-10: "como que o builder vai construir isso, sabe, como que ele vai avaliar" | — |
| Propor e ligar a cópia de uma leitura de lista | U4 | cartão da 3, U3 (`copy_propose`, `copy_proposal`, `accept.ts`; "a variante de API traz a sua condição e a sua conferência no dia em que entrar") | `airbyte@8aed3123` `connector-builder-ui/ai-assist.md:12-20` (a IA preenche paginação, chave e seleção; a pessoa confere) | O agente declara, a pessoa confere e liga | embrulhado: a condição (uma leitura com `list`), a conferência do papel sobre a leitura da fonte (`mayUseEach`), várias conexões por `copy_proposal_source` | | 2026-11-10: "2. B" | `apps/server/src/hub/copies/propose-v2.test.ts`, `accept-v2.test.ts` |
| O app lê a cópia também num conector de API | U4 | https://github.com/developmentconexus-ops/conexus/pull/948 em `e7f68cb7`, `apps/server/src/builder/app-data/context.ts:19` e `packages/app/skills/conexus-data/SKILL.md:47` ("today, Mercado Livre") | cartão da 3, a regra da fonte (a cópia para o que se repete, ao vivo para o resto) | A regra já aprovada, sem o nome do sistema | nativo: a frase da fonte, sem nome de sistema | | o alcance "a", 2026-11-10 | — |
| A primeira passada sem filtro de alteração (#940) | U1, U3 | `sankhya/copy-read.ts:35-41`; `hub/copies/run.ts:21-22,190-197` (`FIRST_SINCE`) | — | — | nativo: `since` nulo na primeira passada | | não precisa | — |

Ficam de fora da tabela, sem linha, as peças que a página do fundador deixa de fora: uma chamada por linha de outra cópia
(`each`; referência `airbyte@8aed3123` `source-calendly`, `SubstreamPartitionRouter`), o modo histórico (pede a decisão de
retenção), mudar a definição depois de ligada (`nango@e6c6131` `sync-efficiency.mdx:99`, `reset`) e as leituras que faltam
ao conector (2026-11-10: "vai estar mais para frente").

**A medida do transplante.** Nenhuma peça vem do produto antigo: ele não tinha Sync (estudo da
Capacidade 2, `e0353c36`).

**A dívida.**

- A fila por conector vive no processo, como a de 0058; ela vai para o banco antes de um segundo
  processo do Hub. O número de chamadas por minuto do Mercado Livre não é publicado e não foi medido:
  a fila serializa, não conta.
- O teto de deslocamento de `/orders/search` não foi verificado (os dois estudos); `pedidos` declara
  teto nulo. Se existir, a primeira passada grande recebe a recusa do Mercado Livre, termina `ERROR`
  sem apagar nada, e o teto entra na declaração.
- A paginação por deslocamento com o dado mudando no meio pode pular uma linha numa passada; a marca
  menos um dia a relê na seguinte. A ordem estável do Mercado Livre não foi medida.
- As colunas `connection_id`, `pass`, `pass_started_at`, `position` e `watermark` de `copies.copy`
  deixam de ser lidas pela U3 e continuam escritas só na criação (a primeira conexão); a migração que as
  tira vem depois, numa etapa seguinte ([data D6](../guides/data.md)). Pela decisão C, a migração da U3
  tira a chave estrangeira `copy_connection_fkey`, para que apagar a primeira conexão não apague a
  cópia; a coluna fica, sem ser lida, e sai com as outras depois. A migração leva a linha
  `-- contract: <motivo>` que `scripts/check-migrations.ts` (`:17`, `:51`) exige de todo `DROP`
  ([data D6](../guides/data.md)); o motivo: nenhuma consulta depende da restrição, só a cascata que
  a decisão C troca, e [data D17](../guides/data.md) é o porquê: a chave impediria guardar o que o dono não
  removeu. `drizzle-orm` 1.0.0-rc.4 não exprime `SET NULL` de uma coluna só de uma chave
  composta (`pg-core/foreign-keys.d.ts:6`), por isso a chave sai em vez de mudar.
- Um anúncio copiado por esta capacidade é só o id; o detalhe pede `each` (fica de fora).
- Se o banco da empresa cair entre o `DELETE` no Hub e `dropEndedCopies`, a tabela da cópia que acabou
  fica no banco da empresa, com a leitura do app, até o próximo Desligar da empresa ou o próximo Ligar
  de uma cópia nela; numa cópia com `_account`, já sem as linhas da conta. `copies.copy_table_left`
  guarda quais e o `COPY_TABLES_LEFT` do registro as diz; numa empresa onde ninguém mais desliga nem
  liga, nada a apaga sozinho.
- A janela de restauração do plano Neon contratado é conferida antes do fechamento; se divergir de
  `architecture.md` ("Restore"), a arquitetura é corrigida no pull request de fechamento.

## U1 O contrato da leitura de lista

**Base e modelo.** O `main` em `3c6472e6`. Opus: o desenho do contrato que o motor, o Builder e cada
conector vão ler, e a conformidade que prova uma declaração.

### As linhas da tabela

- **A declaração.** Ler `packages/connectors/src/kernel/operation.ts:139-192` (`Operation`,
  `defineOperation`) e `:194-225` (`get`, `requestOf`); `kernel/definition.ts:42-69,80-106`
  (`Connector`, `defineConnector`); `mercado-livre/operations/shared.ts:33-59` (`ReadSpec`, `readOf`,
  que passará `list` adiante na U2). Referência: `airbyte@8aed3123`
  `docs/platform/connector-development/connector-builder-ui/pagination.md:22-62,239-313`.
- **A definição versão 2 e a posição.** `kernel/copy.ts:1-91` inteiro. Referência:
  `nango@e6c6131` `docs/guides/functions/syncs/records-cache.mdx:23-28`.
- **A leitura genérica.** `kernel/rows.ts:17-21` (`Rows`); `mercado-livre/operations/shared.ts:66-73`
  (`valueAt`, o modelo do caminho pontuado); `sankhya/copy-read.ts:81-110` (o texto canônico de cada
  tipo, `canonical`, o modelo das células). Referência: `airbyte@8aed3123`
  `source-ebay-fulfillment/manifest.yaml:23-54`.
- **A conformidade.** `kernel/conformance.ts` (`runConformance`, `:308`) e
  `kernel/conformance-declared.ts`.
- **A #940.** `sankhya/copy-read.ts:35-41` (`dates`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Cria `list.ts`, `list.test.ts`; muda `operation.ts` (`list`), `copy.ts` (`CopyDefinitionV2` ao lado da de hoje, `CANONICAL_CELL`, `CopyPosition`, `PageInput.since` nulo), `rows.ts` (`seguinte`, `total`), `conformance.ts` (`assertListsWalk`), `kernel.test.ts`, `copy.test.ts` | os conectores, `apps/server/src/hub/{connectors,copies}`, `packages/app` (os tipos das leituras) |
| `packages/connectors/src/index.ts` | Muda (exporta o que é novo) | `apps/server` |
| `packages/connectors/src/kernel/definition.ts`, `packages/connectors/src/sankhya/definition.ts` | Muda (`Connector.callLimit`, opcional no tipo e exigido por `defineConnector` quando há leitura de `list`; o Sankhya declara `ACCOUNT`, cada empresa com o seu Sankhya e as suas chaves) | os conectores, `apps/server/src/hub/connectors` (a fila, na U3) |
| `packages/connectors/src/sankhya/copy-read.ts` e `copy-read.test.ts` | Muda (`since` nulo, sem filtro; o teste confere as células contra `CANONICAL_CELL`) | a leitura de cópia do Sankhya |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** nada; a versão 1 fica como está.

`packages/connectors/src/kernel/list.ts`:

```ts
/** How a list read pages: by an offset, by a cursor the provider returns, or in one answer. */
export type ListPaging =
  | Readonly<{ kind: 'OFFSET'; offset: string; limit: string; max: number; ceiling: number | null }>
  | Readonly<{ kind: 'CURSOR'; cursor: string; limit: string; max: number; start: Readonly<Record<string, string | number | boolean>>; ttlMs: number }>
  | Readonly<{ kind: 'NONE' }>
/** What a list read declares (Airbyte's paginator and cursor field): the paging, and the input that asks only the rows changed since an instant, with the row's field that shows the change. */
export type ListRead = Readonly<{ paging: ListPaging; changed: Readonly<{ input: string; field: string }> | null }>

export function listInputOf(a: { list: ListRead; definition: CopyDefinitionV2; position: CopyPosition | null; since: string | null }): Record<string, unknown>
export type ListPage =
  | Readonly<{ kind: 'PAGE'; rows: readonly (readonly (string | null)[])[]; more: boolean; next: CopyPosition | null; total: number | null }>
  | Readonly<{ kind: 'MISFIT'; column: string; path: string }>
  | Readonly<{ kind: 'UNREADABLE'; reason: 'NO_MORE_SIGNAL' | 'NO_CURSOR' }>
  | Readonly<{ kind: 'CEILING'; ceiling: number }>
export function listPageOf(a: { list: ListRead; definition: CopyDefinitionV2; position: CopyPosition | null; rows: Rows; at: Date }): ListPage
```

`Operation` (`operation.ts`) ganha `list?: ListRead`; `defineOperation` recusa `list` numa operação que
não é `read` e uma entrada de `paging` ou `changed` que não é chave do `z.object` da entrada (quando a
entrada não é um `z.object`, recusa `list`). A entrada da operação continua a única porta: `listInputOf`
devolve um objeto, e quem chama passa por `requestOf`, que o parseia (`operation.ts:217-225`).

`Connector` (`definition.ts`) ganha `callLimit?: Readonly<{ countedBy: 'APP' | 'ACCOUNT' }>`: onde o
fornecedor conta o limite de chamadas, pelo aplicativo do Conexus (um só para todas as empresas) ou por
conta. Opcional no tipo, para que o servidor e os conectores sem leitura de lista compilem iguais;
`defineConnector` recusa uma leitura com `list` num conector sem ele. Nenhum número de chamadas entra
na declaração: os fornecedores lidos não o publicam (o Mercado Livre) ou o mudam por plano (o
Pipedrive, o HubSpot).

`packages/connectors/src/kernel/copy.ts`:

```ts
// CopyColumnType, CopyDefinition and PageInput.definition stay as they are: the server reads them until U3.
export const CopyColumnTypeV2 = z.enum([...CopyColumnType.options, 'json'])
/** The canonical text of each type's cell, the one owner: list.ts and Sankhya's copy read convert to it, each tested against it. */
export const CANONICAL_CELL: Readonly<Record<z.infer<typeof CopyColumnTypeV2>, RegExp>>
  // text any; numeric -?\d+(\.\d+)?; bigint -?\d+; date YYYY-MM-DD; boolean true|false; json any JSON text;
  // timestamp YYYY-MM-DDTHH:MM:SS, with fraction and offset optional (version 1 has neither, version 2 keeps the offset)
const Dotted = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)*$/).max(200)
const Scalar = z.union([z.string().max(200), z.number(), z.boolean()])
export const CopyDefinitionV2 = z.object({
  version: z.literal(2),
  source: z.object({ kind: z.literal('OPERATION'), operation: OperationId, input: z.record(z.string(), Scalar).default({}) }),
  description: z.string().trim().min(1).max(500),
  columns: z.array(z.object({ name: CopyColumnName, type: CopyColumnTypeV2, path: Dotted, description: z.string().trim().max(200).optional() })).min(1).max(100),
  key: z.array(CopyColumnName).min(1).max(4),   // bigint or text columns
  changedSince: z.object({ column: CopyColumnName }).nullable(), // none: every pass reads the whole source
}) // superRefine: repeated column or key, key type, changedSince type, a name starting with "_" (the engine's)
// The union CopyDefinition = discriminatedUnion('version', [V1, V2]) is U3's, after PR 948.
export const CopyPosition = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('KEY'), after: z.array(z.int()) }),           // version 1
  z.object({ kind: z.literal('OFFSET'), offset: z.int().min(0) }),
  z.object({ kind: z.literal('CURSOR'), cursor: z.string().min(1).max(4000), at: z.iso.datetime() }),
])
// PageInput.since becomes z.iso.date().nullable(): null on a pass with no watermark (#940)
```

A `CopyDefinition` de hoje, o `CopyColumnType` dela e `PageInput.definition` não mudam nesta unidade:
o servidor os lê em `hub/copies/{list,run,enable}.ts`, que o 948 muda, e a união no lugar deles quebra o
typecheck desses arquivos (a leitura do cartão rodou). `PageInput.since` nulo só alarga a entrada: o
servidor monta `since` como texto e nada nele lê o campo (conferido com o `tsc` de `apps/server`). Uma
definição versão 2 não tem `window` (a página do fundador diz por quê).

`kernel/rows.ts`: `Rows` ganha `seguinte: z.string().min(1).max(4000).optional()` (o cursor da página
seguinte, quando a rota o devolve) e `total: z.int().min(0).optional()` (o total que a rota informa).

A forma de cada coisa:

- **Estados.** `ListPaging`, `CopyPosition` e `ListPage` discriminam por um literal
  (C21, C22); um `switch` sobre eles termina em `satisfies never`.
- **Ids.** `OperationId` com marca na fonte (C23), parseado pela `CopyDefinition`.
- **Donos.** A paginação de cada leitura, da declaração `list` dela; o texto canônico de cada tipo, de
  `CANONICAL_CELL` em `copy.ts`: `list.ts` converte o JSON da rota e `sankhya/copy-read.ts:81-110`
  converte o SQL, e cada conversor tem um teste contra os padrões (o `CANONICAL` de
  `copy-read.test.ts:251` passa a ser o do kit); os nomes de coluna proibidos (começados por
  `_`), da `CopyDefinitionV2` (C26).
- **Entrada externa.** A definição, pela `CopyDefinition` (C27); a resposta da rota, pelo `answer` da
  operação, como hoje.
- **Modelo.** `kernel/operation.ts` (`defineOperation` e `requestOf`) cumpre C21, C23 e C26.

### As skills e a leitura

Das linhas de [stack](../reference/stack.md) dos pacotes que a unidade toca, cada skill carregada
inteira pelo construtor e pelo revisor.

- `zod` (todo pacote): `zod.dev/llms.txt` para `discriminatedUnion`, `superRefine` e a forma de
  `z.object` (`shape`).
- Nenhuma outra linha: `packages/connectors` só usa `zod`.

### A ordem do trabalho

1. `rows.ts`: `seguinte` e `total`. Regras: C26.
2. `copy.ts`: `CopyColumnTypeV2`, `CopyDefinitionV2`, `CANONICAL_CELL`, `CopyPosition`,
   `PageInput.since` nulo; a `CopyDefinition` de hoje fica. Regras: C21, C24, C26, C27.
3. `list.ts`: os tipos, `listInputOf` e `listPageOf`, convertendo para `CANONICAL_CELL`; um valor que
   não cabe é `MISFIT`, nunca nulo. Regras: C22, C26.
4. `operation.ts`: `list` e as recusas de `defineOperation`. Regras: C21.
5. `conformance.ts`: `assertListsWalk`, chamado por `runConformance` para cada leitura com `list`:
   anda as páginas do dublê até `more` falso e confere que nenhuma linha (pelo texto JSON da linha
   inteira, porque nem toda leitura tem `id`) falta ou repete; com
   `changed`, uma página com `since`. Regras: T6, T29.
6. `sankhya/copy-read.ts`: com `since` nulo, nenhum filtro de alteração. Regras: C26.
7. O índice do pacote.

### Como se prova

- Critérios 1, 3 e 4: `list.test.ts`, com um conector de teste definido no próprio teste por
  `defineConnector` (T5: o kit é a porta pública do pacote).
- Critério 2: `copy.test.ts`, os casos de hoje e os da versão 2.
- Critério 5: `kernel.test.ts`, chamando a conformidade sobre um conector de teste com um dublê de
  137 linhas em memória, e sobre um plantio com o tamanho e o deslocamento trocados, que precisa falhar.
- Critério 6: `copy-read.test.ts`.
- Falha hoje: não há `list` nem versão 2; `copy-read` com `since` nulo não compila.
- Local: os testes tocados, `npm run typecheck`, `npm run lint`, `npm run docs`.

### Parar se

- A entrada de uma leitura que precisa declarar `list` não for um `z.object` (um `z.preprocess`, um
  `z.union`): parar e dizer qual; a conferência das chaves muda de forma.
- O `tsc` de `apps/server` falhar depois de uma mudança desta unidade: parar e dizer o arquivo; a U1
  não muda nada que o servidor lê, e um arquivo do servidor a mudar é da U3.

## U2 As leituras do Mercado Livre declaram a lista

**Base e modelo.** O commit da U1. Sonnet: aplica o contrato da U1 às leituras do conector, com o
dublê e a skill.

### As linhas da tabela

- **Pedidos pelo que mudou.** `mercado-livre/operations/vendas.ts:9-39`. Referência:
  https://developers.mercadolivre.com.br/pt_br/gerenciamento-de-vendas/gerenciamento-de-vendas
  (`order.date_last_updated.from`; o filtro usa até a hora). O `docs.test.ts` de hoje
  (`mercado-livre/docs.test.ts`, [boundaries](../reference/boundaries.md), "Connectors (step 19.1)")
  confere só a rota (o método e o caminho, `docs.test.ts:12-17`) na página citada; os parâmetros novos
  (`order.date_last_updated.from`, `search_type=scan`, `scroll_id`) o construtor confere à mão na página e
  o revisor também.
- **A varredura.** `mercado-livre/operations/anuncios.ts:6-29`, `perguntas.ts:5-37`;
  `skill/references/anuncios.md` e `perguntas.md` (o teto falso). Referência:
  https://developers.mercadolivre.com.br/pt_br/gerenciamento-de-vendas/itens-e-buscas
  (`search_type=scan`, `scroll_id`, 5 minutos, até 100 por página).
- **As outras listas.** `reclamacoes.ts:6-36`, `faturamento.ts:9-31`; `mensagens.ts:25` (a entrada pede `packId`, por isso sem `list`).
- **O total e o cursor da resposta.** `mercado-livre/answers.ts:29-59` (`Counts`, `moreOf`) e
  `:84-135` (`rows`).
- **O dublê.** `fake-data.ts:69-83` (`paging`, `pageOf`), `fake-routes.ts:17-31` (anúncios),
  `fake-routes.ts:80-90` (pedidos), `fake-routes-more.ts` (perguntas, reclamações).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/mercado-livre/operations/` | Muda `shared.ts` (`ReadSpec.paged`), `vendas.ts`, `anuncios.ts`, `perguntas.ts`, `reclamacoes.ts`, `faturamento.ts` | o conector, o Hub |
| `packages/connectors/src/mercado-livre/answers.ts` | Muda (`seguinte` e `total` em `rows`) | as leituras |
| `packages/connectors/src/mercado-livre/definition.ts` | Muda (`callLimit: { countedBy: 'APP' }`: o limite é "per Client ID (application)", e o Conexus usa um aplicativo só, `:26`) | o Hub (a fila, na U3) |
| `packages/connectors/src/mercado-livre/{fake-data,fake-routes,fake-routes-more}.ts` | Muda (o filtro de alteração, a varredura com 1.300 anúncios inventados, o `scroll_id`) | `fake.ts`, os testes e o Hub de teste |
| `packages/connectors/src/mercado-livre/recordings/` | Cria (as quatro respostas, os valores inventados); sem a gravação, a U2 não entra no `main` | o dublê, a conformidade |
| `packages/connectors/src/mercado-livre/skill/` | Muda `SKILL.md`, `references/anuncios.md`, `perguntas.md`, `vendas.md` | o Builder |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** a frase de teto de 1.000 dos resumos de `anuncios` e
`perguntas` e de `skill/references/anuncios.md` ("there is no way past 1000") e `perguntas.md`.

As declarações, na forma da U1. `ReadSpec` já tem um campo `list` (`shared.ts:40`, onde estão as
linhas no corpo), que fica como está; a declaração nova entra como `ReadSpec.paged` e `readOf` a passa
a `defineOperation` como `list`:

| Leitura | `paging` | `changed` | Entradas novas |
| --- | --- | --- | --- |
| `pedidos` | `OFFSET` (`offset`, `limit`, 50, teto nulo) | `{ input: 'changedFrom', field: 'date_last_updated' }` | `changedFrom: Instant.optional()` → `order.date_last_updated.from` |
| `anuncios` | `CURSOR` (`scrollId`, `limit`, 100, `start: { scan: true }`, `ttlMs: 300_000`) | nulo | `scan: z.literal(true).optional()` → `search_type=scan`; `scrollId: z.string().max(4000).optional()` → `scroll_id`; `offset` passa a opcional |
| `perguntas` | `CURSOR` (`scrollId`, `limit`, 50, `start: { scan: true }`, `ttlMs: 300_000`) | nulo | as mesmas de `anuncios` |
| `reclamacoes` | `OFFSET` (`offset`, `limit`, 30, teto nulo) | nulo | nenhuma |
| `periodosDeFaturamento` | `OFFSET` (`offset`, `limit`, 12, teto nulo) | nulo | nenhuma |

`answers.ts`: `rows` põe em `Rows.seguinte` o `scroll_id` do corpo quando há linhas, e em `Rows.total`
o total de `paging` (ou do topo, ou de `filters`), pelo mesmo `moreOf`. Numa varredura, uma regra só:
página sem linhas é `temMais` falso; página com linhas e `scroll_id` é verdadeiro, com o `scroll_id` em
`seguinte`; página com linhas e sem `scroll_id` é `temMais` verdadeiro sem `seguinte`, que `listPageOf`
recusa como `UNREADABLE` `NO_CURSOR`. Uma rota sem contagem continua `temMais` nulo, e por isso não declara `list` (a U1 a recusaria
na leitura de cópia).

A forma de cada coisa:

- **Donos.** Cada parâmetro da API, da operação que o manda (C26); o corte do comprador, de `BUYER`.
- **Entrada externa.** A resposta pela `answer` de hoje (C27).
- **Modelo.** `vendas.ts` (`pedidos`) cumpre C26: a rota e o corte num lugar só.

### As skills e a leitura

- `zod` (`packages/connectors`): `zod.dev/llms.txt`.
- O `docs.test.ts` do conector, à mão, num computador ([boundaries](../reference/boundaries.md),
  "Connectors (step 19.1)"): a página citada de cada leitura nova continua tendo a rota; os parâmetros
  novos, lidos à mão na mesma página.

### A ordem do trabalho

1. `answers.ts`: `seguinte` e `total`. Regras: C26.
2. As entradas novas e as declarações das cinco leituras; os resumos sem o teto falso. Regras: C26.
3. O dublê: pedidos com 120 pedidos inventados (hoje `fake-routes.ts:80-90` devolve um) e o filtro de
   alteração, a varredura em anúncios e perguntas com `scroll_id`, 1.300 anúncios inventados. Regras: S40, T29.
4. A skill: a varredura, o filtro de alteração, e que uma leitura com lista pode virar cópia.
5. A gravação, condição para a U2 entrar no `main`: as quatro respostas em `recordings/`, cada uma com o serviço, a rota,
   a data e os valores trocados por inventados; o dublê e a conformidade as importam. Regras: S40, T29.

### Como se prova

- Critérios 7 a 10: `operations.test.ts` e `mercado-livre.test.ts` (a conformidade com a U1).
- Critério 11: `fake.test.ts`, com a gravação; sem ela o critério falha e a U2 não entra no `main`.
- Falha hoje: `pedidos` não aceita `changedFrom`; a busca de anúncios para em 1.000.
- Local: os testes tocados, `npm run typecheck`, `npm run lint`, `npm run docs`; o `docs.test.ts` à
  mão, com `MERCADO_LIVRE_DOCS_ONLINE=1`.

### Parar se

- A página da documentação de pedidos ou de itens não tiver mais `order.date_last_updated.from`,
  `search_type=scan` ou `scroll_id`: parar e dizer; a leitura muda de fonte.
- A gravação autorizada mostrar uma forma diferente da documentada (o `scroll_id` noutro lugar, a
  última página com linhas): parar e dizer; a resposta gravada vence (T29).

## U3 O motor versão 2

**Base e modelo.** O `main` com o pull request 948 inteiro (U1 a U3 da Capacidade 3) e a lista de
permissões das tabelas novas; o commit da U1. Opus: a rodada por fonte, a corrida da trava, o fim de
passada por conta e a fila entre empresas.

### As linhas da tabela

- **A rodada.** Ler `apps/server/src/hub/copies/run.ts` inteiro (`claim` `:37-70`, `saved` `:77-99`,
  `passed` `:102-117`, `datesOf` `:190-197`, `lastKey` `:199-205`, `pageOf` `:237-274`, `closedPass`
  `:277-288`, `runCopy` `:296-321`); `store.ts:40-70` (`CopyOutcome`, `CopyTuning`); `tables.ts:37-151`;
  `enable.ts:44-131`. [Boundaries](../reference/boundaries.md), "the company's copies (Capacidade 2)".
- **A página de uma leitura de lista.** `hub/connectors/copy-port.ts:72-150` (`openedForCopy`,
  `readPage`, o `switch` de `:133-149`); `hub/connectors/read.ts:17-44,139-206` (`ReadRequest`,
  `readThrough`, `BUSY` com `waitMs`). Decisão 0058.
- **A fila por conector.** `hub/connectors/limits.ts:13-60` (`inTurn`, `createLanes`);
  `packages/connectors/src/kernel/definition.ts` (`Connector.callLimit`, da U1); a condição da fila é
  `connector.callLimit?.countedBy === 'APP'`, e um conector sem `callLimit` (sem leitura de lista) fica só na
  fila da conexão, como hoje.
- **O banco da empresa.** `platform/copy-sql.ts:11-12,30-37,85-172`.
- **A #940.** `run.ts:21-22,190-197`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/copy.ts` e `copy.test.ts` | Muda (`CopyDefinitionV1` com o nome da de hoje; `CopyDefinition` passa a ser a união das duas versões; `PageInput.definition` continua `CopyDefinitionV1`, porque a leitura de cópia de um conector é da versão 1) | `apps/server/src/hub/copies`, `hub/connectors/copy-port.ts` |
| `apps/server/src/hub/copies/` | Cria `sources.ts` (ler e salvar as fontes, `copiesOfConnection`, `leaveCopies`), `run-v2.test.ts`, `migrate-copy-source.test.ts`; muda `tables.ts` (tira `copy_connection_fkey`; `copySource` e `copyTableLeft` vêm do pull request da D11), `run.ts` (a rodada por fonte), `routes.test.ts` (a união lida por `version`), `store.ts` (`CopyOutcome` com `WAIT`; a cópia lida com as fontes), `list.ts` (`Reason`, `:31`, ganha `WAIT`, ou `runOf` recusa a rodada guardada), `enable.ts` (a fonte da cópia de um modelo; `dropEndedCopies` antes de `ensureCopyTable`), `mode.ts` (a união de versões), `test-copies.ts` | o relógio (`builder/copy-clock`), `main.ts` |
| `apps/server/src/hub/connectors/` | Muda `copy-port.ts` (a página de `OPERATION`, `BUSY` como `WAIT`, a fila), `limits.ts` (`inCopyTurn`), `connections.ts` (`unlink`, `:294-312`: `leaveCopies` antes da retirada no fornecedor, a trava das cópias e, se o construtor escolher a mesma transação, a cópia sem fonte apagada junto com a conexão, e `dropEndedCopies` depois do `DELETE`), `rows.ts` (a porta preguiçosa `copies` nos `Deps`) e `routes.ts` (`listConnectionCopies`); cria `copy-lane.test.ts`, `unlink-copies.test.ts` e `connection-copies.test.ts` | `hub/copies` pela porta, `conversations-of.ts` |
| `apps/server/src/main.ts` | Muda (liga a porta `copies: () => …` de `createConnectors` às cópias, preguiçosa, como `main.ts:162`) | — |
| `apps/server/src/platform/copy-sql.ts`, `company-postgres.ts`, `test-company-postgres.ts` | Muda (`json`, `timestamptz` na versão 2, `_account`, `_account_name`, o fim de passada da conta, `COMMENT ON`, `dropAccountRows`, `dropCopyTable`); cria `copy-sql.test.ts` | `hub/copies` |
| `apps/server/migrations/` | Cria a migração que dá a cada cópia de hoje a sua fonte (dados; as tabelas e as permissões vêm no pull request da D11), a que tira `copy_connection_fkey` (com `-- contract: <motivo>`, data D6) e, se o construtor escolher o gatilho, o gatilho no `DELETE` de `copy_source` que apaga a cópia sem fonte | `migrate` |
| `packages/hub-api/src/copies.ts`, `copy-failures.ts`, `connectors.ts` | Muda (`CopyRun.outcome` `PARTIAL` com `WAIT`; `COPY_SOURCE_CEILING`; `listConnectionCopies` e `CopyOfConnection`; `COPY_DATABASE_UNAVAILABLE` e `tablesLeft` em `unlinkConnection`) | `apps/server`, `apps/web` |
| `apps/web/src/hub/copies/text.ts` | Muda (a frase de `WAIT`) | a página Cópias |
| `docs/reference/boundaries.md` | Muda (as três peças novas na seção das cópias) | — |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** `FIRST_SINCE` (`run.ts:21-22`): a primeira passada manda
`since` nulo; a leitura da posição, da passada e da marca em `copies.copy` (passam a `copy_source`); o
mapeamento de `BUSY` para `COPY_SOURCE_UNREACHABLE` (`copy-port.ts:143`).

A tabela, no pull request da D11, em `hub/copies/tables.ts`, esquema `copies`, com a política por
linha (decisão 0039):

| Coluna | Tipo e restrição |
| --- | --- |
| `company_id` | `text`, a empresa |
| `copy_id` | `uuid` → `copies.copy` `(company_id, id)`, em cascata |
| `connector_id`, `connection_id` | → `connectors.connection` `(company_id, connector_id, id)`, em cascata |
| `account_ref` | `text null`, o `AccountRef` da conexão; nulo num conector de conta `none` |
| `pass` | `integer not null default 0` |
| `pass_started_at`, `watermark`, `wait_until` | `timestamptz null` |
| `position` | `jsonb null`, a `CopyPosition` |
| `created_at` | `timestamptz not null` |

Restrições: chave primária `(copy_id, connection_id)`; único `(copy_id, account_ref)`; `check
(position is null or jsonb_typeof(position) = 'object')`. A migração de dados (U3) insere uma fonte
por cópia de hoje, `WHERE NOT EXISTS`, com `connection_id`, `pass`, `pass_started_at`, `watermark` e
`position` vindos da cópia (`{ "kind": "KEY", "after": <position> }` quando havia posição).

`apps/server/src/hub/copies/store.ts`:

```ts
export type CopyOutcome =
  | { kind: 'COMPLETE' }
  | { kind: 'PARTIAL'; reason: 'CAP' | 'STOPPED' | 'WAIT' } // WAIT: the provider answered 429; the source keeps its position
  | { kind: 'ERROR'; code: CopyRunFailureCode }               // gains COPY_SOURCE_CEILING
  | { kind: 'INTERRUPTED' }
```

`apps/server/src/hub/copies/sources.ts` (camada de loja, [code C13](../guides/code.md)):

```ts
export type StoredSource = Readonly<{
  connectionId: ConnectionId; accountRef: AccountRef | null; pass: number
  passStartedAt: Date | null; watermark: Date | null; waitUntil: Date | null; position: CopyPosition | null
}>
export function sourcesOf(tx: ReadTx, ids: { companyId: CompanyId; copyId: CopyId }): Promise<StoredSource[]> // in created_at order
// saved, passed, waiting and restarted write one source WHERE the copy's claim_token is the run's (`held`)
```

`apps/server/src/hub/connectors/copy-port.ts`:

```ts
export type CopyRead =
  | Readonly<{ kind: 'PAGE'; page: CopyPage; next: CopyPosition | null; total: number | null }>
  | Readonly<{ kind: 'WAIT'; waitMs: number | null }> // the provider answered 429 (decision 0058), or the connector's lane passed its deadline (waitMs null)
  | Readonly<{ kind: 'FAILED'; code: CopySourceFailure | 'COPY_SOURCE_CEILING' }>
  | Readonly<{ kind: 'NO_CONNECTION' }>
// readPage takes { companyId, connectionId, enabledBy, definition, position, since, windowFrom, signal }:
// version 1 reads `connector.copy.read` with PageInput as today; version 2 reads the source operation
// with listInputOf and listPageOf, speaking as a VERSION that declares that operation, through readThrough.
```

`limits.ts`: `inCopyTurn(connector: ConnectorId, deadlineMs, work, signal)`, as mesmas filas de
`createLanes` com a chave do conector, chamada por `readPage` só quando o conector declara
`callLimit.countedBy === 'APP'`; a fila da conexão continua por dentro (`readThrough`).

`platform/copy-sql.ts`:

```ts
/** The columns of a copy of accounts, the engine's own beside COPY_PASS_COLUMN: the provider's account and the company's name for its connection. */
export const COPY_ACCOUNT_COLUMN = '_account'
export const COPY_ACCOUNT_NAME_COLUMN = '_account_name'
// CopyTable gains `accounts: boolean` (true when the connector's `account` is not `none`, so a copy of
// one account writes `_account` too), `instants: 'LOCAL' | 'OFFSET'` (OFFSET for a version 2 copy:
// `timestamp` is `timestamptz`, a provider's instant keeps its offset; LOCAL keeps `timestamp`, a
// database's local hour), `description: string | null` and each column's `description`; the
// platform's column type gains 'json' (jsonb). ensureCopyTable: with accounts, both columns text NOT NULL and
// PRIMARY KEY (_account, <key>); COMMENT ON TABLE and COMMENT ON COLUMN from the descriptions.
// writePage takes `account: { ref: string; name: string } | null`; a json cell is parsed into the jsonb.
// closePass takes the same `account`: the DELETE carries `AND _account = $ref`, then
// UPDATE … SET _account_name = $name WHERE _account = $ref AND _account_name IS DISTINCT FROM $name.
// dropAccountRows(sync, { copy, ref }): DELETE FROM sync.<copy> WHERE _account = $ref; repeatable.
// dropCopyTable(sync, { copy }): DROP TABLE IF EXISTS sync.<copy>; the app logins' SELECT goes with the table; repeatable.
```

**O Desligar e o fim de uma cópia** (a decisão "1 apagar na hora" e a
https://github.com/developmentconexus-ops/conexus/issues/953). Começa pelo teste que hoje falha: liga
uma cópia de uma conexão, libera a um Projeto, desliga a conexão e lê `sync.<cópia>` com o login do
app, que precisa ser recusado (critério 39). `apps/server/src/hub/copies/sources.ts`:

```ts
/** Each copy that has the connection as a source, as Desligar shows it before the click and as unlink ends it. */
export type CopyOfConnection = Readonly<{
  copyId: CopyId; name: string; mode: CopyMode // copyModeOf, from the Capacidade 3
  last: boolean        // the connection is the copy's only source: Desligar ends the copy
  rows: number | null  // that account's rows: copy.rows when last; else the count in the company database; null when it does not answer
}>
export function copiesOfConnection(deps: CopiesDeps, input: OfConnection): Promise<CopyOfConnection[]>
/**
 * Before the provider's revoke and the Hub's DELETE in `unlink`, outside any transaction (data D22):
 * dropAccountRows in every copy of the connection that has `_account`. It drops no table: which copies
 * end is known only in the DELETE. A silent company database refuses Desligar with
 * COPY_DATABASE_UNAVAILABLE and nothing changed in the Hub; Desligar again finds nothing left to do there.
 */
export function leaveCopies(deps: CopiesDeps, input: OfConnection): Promise<SqlAnswer>
/**
 * Drains the company's rows of copies.copy_table_left, written in the transaction that ended each copy:
 * each row locked (FOR UPDATE SKIP LOCKED), dropCopyTable, then the row deleted. No REVOKE, the
 * privileges go with the table. Called after every Desligar's DELETE and before ensureCopyTable in
 * every Ligar; a silent company database leaves the rows for the next call and answers their names.
 */
export function dropEndedCopies(deps: CopiesDeps, input: InCompany): Promise<{ tablesLeft: string[] }>
```

`unlink` (`hub/connectors/connections.ts:294-312`) chama `leaveCopies` pela porta das cópias depois de
admitir e antes da retirada no fornecedor; o `DELETE` da conexão leva as fontes em cascata, e a cópia
que fica sem fonte sai na mesma transação ou no gatilho, sob a trava das linhas das cópias (a escolha
do construtor, veja a tabela de falhas); a mesma transação grava em `copies.copy_table_left` a empresa, o id e o nome da tabela de
cada cópia que acabou; depois do `DELETE`, `unlink` chama `dropEndedCopies`, que apaga essas tabelas
e as que um Desligar anterior deixou. Nenhuma tabela sai por uma decisão tomada antes do `DELETE`. A porta é
preguiçosa nos `Deps` de `hub/connectors` (`rows.ts:17-30`), `copies: () => …` com `leaveCopies`,
`dropEndedCopies` e `copiesOfConnection`, ligada em `main.ts` como as de `main.ts:162`, porque os
conectores nascem antes das cópias (`main.ts:192-195`); `hub/connectors` não importa `hub/copies`
(`.dependency-cruiser.cjs:22-26` recusa o ciclo). Uma página que uma rodada grave entre `leaveCopies` e o `DELETE` sai no começo da rodada
seguinte, pela rede de "as linhas cuja `_account` não é de fonte nenhuma". A página Cópias de hoje
pausa e retoma, mas não apaga uma cópia; quando apagar existir, ela usa o mesmo fim.

`packages/hub-api/src/connectors.ts`: `listConnectionCopies` (`GET
/api/companies/{companyId}/connections/{connectionId}/copies`, `access: 'session'`, admitida por
`manageConnections`, a mesma admissão do Desligar, porque mostra a quem vai apertar o que o clique
dele apaga), que responde `{ copies: CopyOfConnection[] }`, e `CONNECTION_NOT_FOUND` como
`getConnection`; `unlinkConnection` ganha a recusa `COPY_DATABASE_UNAVAILABLE` (503, de
`copy-failures.ts`), só quando `leaveCopies` não chega ao banco da empresa, e a sua resposta 200 ganha
`tablesLeft: string[]`, os nomes das tabelas que `dropEndedCopies` não conseguiu apagar (vazio no
caminho de sempre): o estado do Hub já é final, e o diálogo diz que a conexão saiu e a tabela ainda
não. A tabela `copies.copy_table_left`, no pull request da D11: `company_id text`, `copy_id uuid`
(sem chave estrangeira: a cópia já saiu), `name text`; chave primária `(company_id, copy_id)`; a
política por linha da decisão 0039.

A rodada (`run.ts`): a trava continua da cópia (uma rodada por vez, [boundaries](../reference/boundaries.md));
depois dela, as fontes (uma cópia nunca chega à rodada sem fonte: ela sai do Hub no mesmo
instante em que sai a sua última fonte, no apagar da conexão, pausada ou não, veja a tabela de
falhas); primeiro as de passada aberta (posição não nula), depois as outras na ordem
de criação; antes delas, as linhas cuja `_account` não é de fonte nenhuma saem da tabela (a rede do
Desligar: o Desligar já as tirou, e isto pega uma página gravada no meio dele); uma fonte com `wait_until` no futuro termina a rodada `PARTIAL`
`WAIT` sem chamar; uma fonte `CURSOR` cuja posição tem `at` mais velho que `paging.ttlMs` volta a
posição nula, com o registro `COPY_PASS_RESTARTED`; página a página como hoje, cada uma salva na fonte;
`WAIT` salva `wait_until` (agora mais `waitMs`, quando veio) na fonte; num conector que declara
`callLimit.countedBy: 'APP'`, termina `PARTIAL` `WAIT` sem tentar as outras fontes (o limite do
aplicativo vale para todas as contas, então a outra receberia o mesmo pedido); num que declara
`ACCOUNT`, passa à fonte seguinte (o limite de uma conta não diz nada da outra), e a rodada termina
`PARTIAL` `WAIT` se alguma fonte ficou esperando; o prazo vencido na fila do conector termina `PARTIAL` `WAIT` sem `wait_until`; uma fonte que fechou a passada antes do `WAIT` começa uma passada nova na rodada seguinte,
depois da que ficou aberta; `more` falso
fecha a passada da fonte (o `closePass` da conta, depois `pass + 1`, a marca no início da passada, a
posição nula) e passa à fonte seguinte; a última fonte fechada termina `COMPLETE`. Os tetos de 200
páginas e 10 minutos valem para a rodada inteira. `copy.rows` é a contagem da tabela no fim da última
passada fechada. `since` da fonte é a marca menos um dia, em instante ISO na versão 2 e em dia na
versão 1; sem marca, nulo.

A forma de cada coisa:

- **Estados.** `CopyOutcome`, `CopyRead` e `CopyPosition` por `kind` (C21, C22); "a fonte espera" é
  `wait_until`, não um estado inventado.
- **Ids.** `CopyId`, `ConnectionId`, `CompanyId` com marca; `AccountRef` parseado ao ler a fonte (C23).
- **Donos.** A trava, de `run.ts`; o estado de cada fonte, de `sources.ts`; as duas colunas da conta,
  de `copy-sql.ts` (C26); a fila por conector, de `limits.ts`.
- **Entrada externa.** A definição e a posição lidas do banco do Hub, pela `CopyDefinition` e pela
  `CopyPosition` (C27).
- **Modelo.** `run.ts` da Capacidade 2 cumpre C21, C23 e C26.

### As skills e a leitura

Das linhas de [stack](../reference/stack.md) dos pacotes que a unidade toca, cada skill carregada
inteira pelo construtor e pelo revisor.

- `drizzle` (`drizzle-kit`, `apps/server`, `node_modules/drizzle-kit/skills/`): a migração de dados e a
  chave estrangeira tirada de `tables.ts`.
- `neon:neon-postgres` (`@neondatabase/serverless`, `apps/server/src/platform`): `COMMENT ON`, `jsonb` e
  as instruções da página, pela porta `SqlTransport`.
- `mastra` (`@mastra/core`): o relógio das cópias não muda; ler `builder/copy-clock` só para saber
  que `runNow` continua o caminho do teto.
- `fastify-best-practices` (`fastify`): a rota nova `listConnectionCopies` e a recusa nova de
  `unlinkConnection`.
- `zod.dev/llms.txt` para `discriminatedUnion`.
- `organization-best-practices` não se aplica: nenhuma admissão muda.

### A ordem do trabalho

1. `copy.ts`: `CopyDefinitionV1` e a união; o servidor lê por `version` (`list.ts`, `run.ts`,
   `enable.ts`, `mode.ts`, `routes.test.ts`). Regras: C21, C22.
2. A migração de dados das fontes (a tabela e `copySource` em `tables.ts` vêm do pull request da D11);
   `copy_connection_fkey` sai de `tables.ts` e a migração gerada a tira. Regras: D5, D6, D7, D17,
   D30.
3. `unlink-copies.test.ts` primeiro, vermelho no `main` (#953); depois `sources.ts`, a rodada por fonte
   em `run.ts`, com a trava de hoje; `FIRST_SINCE` sai; a cópia que perde a última fonte encerrada no
   mesmo apagar (em `unlink` ou no gatilho); a linha de `copy_table_left` gravada no mesmo apagar; `leaveCopies` antes do `DELETE` e `dropEndedCopies` depois, em `unlink`, e antes de `ensureCopyTable`, em `enable.ts`, pela porta ligada em
   `main.ts`; `copiesOfConnection` e `listConnectionCopies`. Regras: C21, C65, D22, D25.
4. `copy-port.ts`: a página de `OPERATION` por `listInputOf`, `readThrough` e `listPageOf`; `WAIT`;
   `COPY_SOURCE_CEILING`. Regras: C26, C49, C57.
5. `limits.ts`: `inCopyTurn`. Regras: C57, C63 (dito em 0058: só enquanto houver um processo).
6. `copy-sql.ts`: `json`, `instants`, as colunas da conta, o fim de passada da conta, `COMMENT ON`,
   `dropAccountRows`, `dropCopyTable`. Regras: D20
   (os valores ligados; os nomes por `quoted`).
7. `CopyRun` e `COPY_SOURCE_CEILING` em `hub-api`; a frase de `WAIT` em `text.ts`. Regras: C45, C48.
8. [Boundaries](../reference/boundaries.md): as três peças novas na seção das cópias (a fonte por
   conta, a espera e o cursor, a fila por conector), cada uma com a linha da biblioteca, a peça, o
   porquê e a prova.

### Como se prova

- Critérios 12 a 17, 20, 22 e 23: `run-v2.test.ts`, pela porta de `hub/copies` com o Hub de teste, o
  banco da empresa local (`test-company-postgres.ts`) e um conector de teste com `list` e um dublê em
  memória que conta as chamadas, responde 429 com e sem `Retry-After` e devolve cursores (T5, T20: o
  relógio e a validade injetados).
- Critério 18: `copy-lane.test.ts`, duas empresas e dois conectores de teste, um que declara `countedBy:
  'APP'` e um `'ACCOUNT'`, com o dublê segurando a resposta para contar as chamadas abertas.
- Critério 19: `copy-sql.test.ts`, no PostgreSQL local.
- Critério 21: `run.test.ts` sem mudar o que vê, `copy.test.ts` (as duas versões pela união) e `migrate-copy-source.test.ts`, que aplica as
  migrações até a da Capacidade 3, cria uma cópia com posição e aplica a da fonte.
- Critério 24: `copy-list.test.tsx`, pelo roteador de teste da web com o Hub dublê.
- Critérios 39 e 40: `unlink-copies.test.ts` e `connection-copies.test.ts`, pela porta HTTP do Hub de
  teste, com o banco da empresa local e os logins do app de verdade (o `SELECT` do login do app é a
  prova da #953), e o banco da empresa calado pelo dublê de `SqlTransport`.
- Falha hoje: `BUSY` termina `ERROR`; não há fonte nem conta; desligar a conexão deixa a tabela e o
  `SELECT` do app (#953).
- Local: os testes tocados, `npm run typecheck`, `npm run lint`, `npm run docs`, `npm run deps`.

### Parar se

- A U3 da Capacidade 3 entrar no `main` com outra forma para a leitura de cópia (`readPage`) ou para a
  tabela `copy_proposal`: parar e reler o contrato; esta unidade estende o dela.
- Uma cópia de hoje tiver a posição numa forma que não é uma lista de inteiros: parar; a migração não
  sabe convertê-la.
- `readThrough` não devolver `BUSY` com `waitMs` para um 429 de uma leitura (0058): parar; a espera
  muda de fonte.

## U4 O Builder propõe de qualquer conector

**Base e modelo.** O commit da U3. Opus: a proposta cruza `hub/copies`, `hub/connectors`, o Builder e
duas telas, com várias conexões e a conferência do papel por conexão.

### As linhas da tabela

- **Propor.** O cartão da 3, U3 inteira (`provePage`, `ProposeAnswer`, `copy_propose`, `accept.ts`),
  e o código dela no `main` depois do 948; `hub/connectors/builder-port.ts:20-35`
  (`CONNECTOR_CALLS_PER_TURN`, `GrantedConnection`), `:169-216` (a conta de 50 e `readThrough`);
  `hub/connectors/publish-check.ts:35-60` (`ungrantedBy`, que resolve uma conexão por conector, `:50`,
  e por isso não serve a várias contas; a U4 chama `identity.mayUseEach` direto, uma entrada por conexão). Referência: `nango@e6c6131`
  `docs/guides/functions/functions-guide.mdx:235-262`.
- **As seis perguntas.** A descrição de `copy_propose` da 3; `packages/app/skills/conexus-data/SKILL.md`.
  Referência: `nango@e6c6131` `docs/guides/functions/syncs/sync-functions.mdx:88-92`.
- **O bloco e a regra da fonte.** `builder/app-data/context.ts` e `hub/copies/project-view.ts` (948,
  `e7f68cb7`), a frase de `context.ts:19` e `conexus-data/SKILL.md:47`.
- **As telas.** `apps/web/src/hub/copies/copy-list.tsx`, `copy-detail.tsx`, `copy-proposal.tsx`,
  `text.ts`; `apps/web/src/builder/conversation/copy-proposal-card.tsx` (da 3).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/` | Cria `propose-v2.test.ts`, `accept-v2.test.ts`; muda `propose.ts` (a versão 2, várias conexões, a prova), `accept.ts` (as fontes), `store.ts` e `list.ts` (as fontes, a origem, a descrição), `project-view.ts` (a origem e as descrições), `public.ts` | `hub/connectors` (`propose`), `conversations-of.ts`, `main.ts` |
| `apps/server/src/hub/connectors/` | Muda `builder-port.ts` (`GrantedConnection.copies` e `reads[].list`; `provePage` da versão 2) | `builder/connectors`, `conversations-of.ts` |
| `apps/server/src/builder/connectors/` | Muda `copy-propose.ts` (a entrada com `connections`, as seis perguntas) e o teste | `builder/conversation` |
| `apps/server/src/builder/app-data/context.ts` e o teste | Muda (a origem, as descrições, as colunas da conta; a regra da fonte) | o turno |
| `apps/server/src/builder/conversation/` | Muda `prompt/builder.md` (a regra da fonte) e `data-turn.test.ts` | o controlador |
| `apps/server/src/{main,conversations-of}.ts` | Muda (as dependências novas de propor) | — |
| `packages/hub-api/src/copies.ts` | Muda (`CopySummary.sources`, `shown.source`, `description`; `CopyProposalSummary.sources`, `proved.calls`) | `apps/server`, `apps/web` |
| `packages/app/skills/conexus-data/SKILL.md` | Muda (as seis perguntas; a regra da fonte; `_account` e `_account_name`) | o Builder |
| `apps/web/src/hub/copies/` | Muda `copy-list.tsx`, `copy-detail.tsx`, `copy-proposal.tsx`, `text.ts` e os testes | a rota `…/copies` |
| `apps/web/src/builder/conversation/` | Muda `copy-proposal-card.tsx` e o teste | a conversa |
| `apps/web/src/hub/connectors/` | Muda `unlink-dialog.tsx` (lê `listConnectionCopies` ao abrir e diz o que vai sumir; `COPY_DATABASE_UNAVAILABLE` pela frase de `copy-failures.ts`; `tablesLeft` pela frase da conexão removida com a tabela que ficou); cria `unlink-dialog.test.tsx` | Integrações |
| `docs/reference/screens.md`, `docs/reference/builder-prompt.md`, `docs/explanation/builder-turn.md` | Muda | — |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** `CopySummary.connection`, `CopyProposalSummary.connection` e
`ProposeAnswer.PROPOSED.connection` (viram `sources`); `CopySummary.shown.query` (vira `shown.source`); a frase "today, Mercado Livre" de
`context.ts` e "today, the Mercado Livre" de `conexus-data`; a condição de oferecer `copy_propose` só
com `copy` e `readDoor`.

No pull request da D11, em `hub/copies/tables.ts`: `copy_proposal` ganha `proved_calls integer null`
(as chamadas por passada somadas das conexões; nulo quando alguma leitura não informa o total);
`copies.copy_proposal_source` (`company_id`, `proposal_id` → `copy_proposal` em cascata,
`connector_id`, `connection_id` → `connectors.connection` em cascata; chave primária `(proposal_id,
connection_id)`; a política por linha). A coluna `connection_id` de `copy_proposal` continua a primeira
conexão; apagá-la apaga a proposta, como na 3; apagar outra tira só a fonte dela, e o diálogo **Ligar**
mostra as contas que sobraram.

`packages/hub-api/src/copies.ts`:

```ts
const CopySource = z.object({ connection: z.object({ id: ConnectionId, name: z.string(), connector: ConnectorId }) })
const Shown = z.object({
  source: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('QUERY'), query: z.string() }),
    z.object({ kind: z.literal('OPERATION'), operation: z.string(), label: z.string(), input: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])) }),
  ]),
  key: z.array(z.string()),
  changedSince: z.object({ column: z.string() }).nullable(),
  window: z.object({ column: z.string(), days: z.int() }).nullable(),
  description: z.string().nullable(),
  columns: z.array(z.object({ name: z.string(), type: z.string(), description: z.string().nullable() })),
})
// CopySummary: `sources: CopySource[]` (min 1) in place of `connection`; `shown: Shown`.
// CopyProposalSummary: the same, and `proved: { rows, more, calls: z.int().min(0).nullable() }`.
```

`hub/copies/propose.ts`, a entrada da 3 com `connections: ConnectionId[]` (1 ou mais, sem repetir) no
lugar de `connectionId`, e `ProposeAnswer`:

```ts
export type ProveCounts = Readonly<{
  rows: number; more: boolean; keyNull: number; keyRepeated: number
  nulls: Readonly<Record<string, number>>; misfits: Readonly<Record<string, number>>
  total: number | null; callsPerPass: number | null; changedLastDay: number | null
}>
export type ProposeAnswer =
  | { kind: 'PROPOSED'; proposalId: CopyProposalId; name: CopyName; source: Shown['source']; sources: { name: string; connector: ConnectorId }[]; key: CopyColumnName[]; mode: CopyMode; rows: number; more: boolean; calls: number | null; counts: ProveCounts[] }
  | { kind: 'KEY_NOT_UNIQUE'; connection: string; keyNull: number; keyRepeated: number }
  | { kind: 'TYPE_MISFIT'; connection: string; column: string; count: number }
  | (the 3's EXISTS, MALFORMED and provePage refusals)
```

A ordem de propor, sobre a da 3: a definição pela `CopyDefinition`; na versão 2, a operação é uma
leitura do conector das conexões com `list`, `changedSince` só com `changed` e com a coluna cujo `path`
é o `changed.field`, a entrada fixa passa por `listInputOf` e `requestOf` sem erro e não nomeia entrada
de `paging` nem de `changed`; as conexões do mesmo conector, uma só num conector de conta `none`; cada
uma liberada ao Projeto e de um papel que usa a leitura da fonte (`identity.mayUseEach` com uma entrada
por conexão, `{ connectionId, connectorId, operationId }`, nunca `ungrantedBy`); o nome; a prova de
cada conexão; a proposta e as fontes numa transação. `mode` sai de `copyModeOf` (a 3); as chamadas por
passada de uma conexão são `ceil(total / max)`, nulo sem total.

`provePage` da versão 2 (`builder-port.ts`): por conexão, a primeira página da leitura com `since`
nulo e no máximo 100 linhas; com `changedSince`, uma segunda com `since` = agora menos um dia; cada
chamada gasta uma da conta de 50 (`spend`); as contagens por `listPageOf` e pelas colunas; nenhuma linha
sai de `provePage`.

`GrantedConnection` (da 3): `copies: boolean` é verdadeiro com `copy` e `readDoor` ou com uma leitura
de `list`; `reads[]` ganha `list: { paging: 'OFFSET' | 'CURSOR' | 'NONE'; changed: string | null;
ceiling: number | null } | null`.

`copy_propose` (`builder/connectors/copy-propose.ts`): a entrada `{ connections: string[], connector,
name, label, definition }` (os nomes das conexões como o turno os mostra; o Hub resolve, como
`connector_read`). A descrição diz as seis perguntas, na ordem: (1) guardar ou ler na hora (lista,
histórico, soma, cruzamento: cópia; gravar, consulta com parâmetro que não é dado guardado: ao vivo);
(2) já existe (o bloco "## Data"; liberada, use; não liberada, peça; nunca proponha o que existe); (3) de
qual leitura e com qual filtro (a leitura de lista mais estreita que cobre o app; filtro fixo só quando
o app nunca vai querer o resto); (4) qual chave (o id que o sistema dá à linha; a prova recusa nula ou
repetida); (5) qual modo (sem `changed`, inteira; com `changed`, só o alterado, salvo mais de 10% das
linhas mudando por rodada, que pede a inteira; a janela é só da consulta); (6) de quanto em quanto
tempo (o maior intervalo que a tela aguenta; a prova devolve as chamadas por passada, e uma cópia cara
pede intervalo maior). E: os campos que o app usa viram colunas; os vizinhos óbvios (datas, status,
ids de ligação) podem entrar; um pedaço aninhado entra como `json` só quando o app o lê; escreva a
descrição da tabela e das colunas; o nome diz o sistema e o dado (`<sistema>_<dado>`); as contas de um
mesmo conector numa cópia só, salvo quando o app pede separadas.

A forma de cada coisa:

- **Estados.** `ProposeAnswer`, `Shown.source` por `kind` (C21, C22).
- **Ids.** `CopyProposalId`, `ConnectionId` com marca, conferidos pela linha da empresa (C23).
- **Donos.** A origem e as colunas mostradas, da definição guardada, por `list.ts` e `project-view.ts`
  (C26); as chamadas por passada, de `propose.ts`; o modo, de `copyModeOf`.
- **Entrada externa.** A entrada da ferramenta pela `CopyDefinition` no Hub (C27).
- **Modelo.** `hub/copies/propose.ts` da 3 (C21, C23, C26 pelo cartão dela).

### As skills e a leitura

Das linhas de [stack](../reference/stack.md) dos pacotes que a unidade toca, cada skill carregada
inteira pelo construtor e pelo revisor.

- `mastra` (`@mastra/core`, `apps/server/src/builder`): `createTool` e a descrição que o pedido leva.
- `fastify-best-practices` (`fastify`): `listCopies` com a forma nova.
- `better-auth-best-practices`, `better-auth-security-best-practices` e
  `organization-best-practices` (`better-auth`, `apps/server/src/hub`): `mayUseEach` por conexão e
  `manageCopies`, que não mudam.
- `drizzle` (`drizzle-kit`): ler a tabela das fontes da proposta, que vem com a migração do pull request da D11.
- `router-core` e `router-plugin`: a rota `…/copies` não muda.
- `shadcn` (`apps/web/src/ui`, usado, não mudado): a linha, o detalhe e o diálogo.
- `tanstack.com/query/latest/llms.txt` (a consulta da lista); `zod.dev/llms.txt`.

### A ordem do trabalho

1. Os contratos de `hub-api` e `list.ts` com as fontes, a origem e as colunas; a web lê a forma nova
   (Fonte, contas). Regras: C26, C45.
2. `provePage` da versão 2 e `propose.ts` com várias conexões e as recusas. Regras: S2, S7, C79, D20,
   D22.
3. `accept.ts`: as fontes ao ligar, a conferência do papel por conexão. Regras: C37, C65, S8.
4. `copy_propose`: a condição, a entrada, as seis perguntas. Regras: C26.
5. O bloco, `project-view.ts`, o prompt e `conexus-data`: a origem, as descrições, as colunas da conta,
   a regra da fonte. Regras: C26.
6. As telas: a linha, o detalhe, a linha Proposta, o diálogo, o cartão da conversa e o diálogo
   **Desligar**. Regras: W10, W12,
   W24, V18, V29, V35.
7. Os documentos.

### Como se prova

- Critérios 25 a 28, 35 e 37: `copy-propose.test.ts` e `propose-v2.test.ts`, pelo turno de teste do
  Builder e pela porta do Hub, com o dublê do Mercado Livre da U2 (T29) e um conector de teste de conta
  `none`.
- Critério 29: `accept-v2.test.ts`, pela porta HTTP do Hub de teste.
- Critério 30: `routes.test.ts`.
- Critérios 31, 32 e 41: os testes da web, pelo roteador de teste com o Hub dublê.
- Critérios 33 e 34: `context.test.ts` e `data-turn.test.ts`, lendo o texto montado e a descrição das
  ferramentas que o pedido ao modelo leva.
- Critério 36: `data-turn.test.ts`, com o modelo dublê (T24) que chama `copy_propose` com o nome da
  conexão e da leitura que o turno mostrou (T28).
- Critério 38: QA ([testing T25](../guides/testing.md)).
- Falha hoje: `copy_propose` não aparece numa conexão do Mercado Livre.
- Local: os testes tocados, `npm run typecheck`, `npm run lint`, `npm run docs`.

### Parar se

- A U3 da Capacidade 3 entrar no `main` sem `copy_proposal`, `provePage` ou o cartão da conversa na
  forma do cartão da 3: parar e reler; esta unidade estende os dela.
- `mayUseEach` não aceitar uma leitura comum (fora da porta de leitura) para o papel de quem propõe:
  parar e dizer; a conferência do papel muda de fonte.
- O bloco passar dos 8 KB com as descrições numa empresa de teste com três cópias de 25 colunas: parar
  e dizer o tamanho; as descrições das colunas saem do bloco e ficam no detalhe.
