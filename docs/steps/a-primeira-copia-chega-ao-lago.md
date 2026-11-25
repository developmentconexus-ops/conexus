# A primeira cópia chega ao lago

Trilha Dados, a etapa 2 do lago, na ordem de [trilhas/dados.md](trilhas/dados.md). A pergunta: "Eu
ligo o Sankhya numa janela só, escolho as tabelas e quando copiar, elas chegam inteiras ao lago, a
mudança de hoje aparece na rodada seguinte, e eu vejo isso na página Dados?" Entre a parte 0 e a
parte 1 deste cartão corre a etapa **O conector no padrão novo**, que o roteiro nomeia como etapa
própria (decisão C do conector, T.21).

Os estudos ficam fora do repositório (delivery L21). São doze, dez de 2026-11-23 e dois de 2026-11-24:

- o estudo `conexus-lago2-estudo` e o reestudo `conexus-lago2-reestudo`;
- o estudo do conector no estilo novo, `conexus-conector-estilo-novo-estudo` (os nomes NT1 a NT4 e o
  legado), e o das duas ligações do mesmo sistema, `conexus-n5-duas-ligacoes` (a NT5);
- o estudo do ao vivo, `conexus-ao-vivo-estudo` (as decisões A, B e C do conector);
- **o mapa do desenho**, `conexus-lago2-fluxo-nekt`: o fluxo de ligar da Nekt e do Databricks, tela
  a tela, contra as decisões antigas. O fundador o confirmou na página
  https://claude.ai/artifact/NPjMLzXJeMDM62E1ATqGkA: "Não, eu confirmo o desenho";
- o Sankhya completo, `conexus-sankhya-tabelas-completo` (as 42 tabelas, o modo de cada uma e a
  primeira carga);
- os arquivos no lago, `conexus-arquivos-no-lago` (o XML da NF-e);
- o relógio das cópias, `conexus-agendador-copias`;
- o lakehouse com arquivos, `conexus-lakehouse-arquivos` (as perguntas F1 e F2 de lá);
- a data inicial da cópia, `conexus-lago2-data-inicial-estudo`, e a conferência dela,
  `conexus-lago2-data-certeza` (as linhas 71 a 73 da tabela de referência), de 2026-11-24.

O fundador decidiu nas palavras da página abaixo, todas de uma entrevista em 2026-11-23, menos as da Data,
de 2026-11-24. Este cartão cita dos estudos só o que a construção precisa. O código de hoje entra só como
inventário do que sai. A página ainda não está aprovada.

Cada linha do `main` citada foi lida em `538b0562`. Nas pastas da cópia e dos conectores ela é igual
à do `main` em `9e05c9b8`, a base deste cartão: `git diff --stat 538b0562 9e05c9b8 -- packages apps`
não toca essas pastas. `EST/<nome>:N` é a linha `N` do relatório `data/conexus-<nome>/report.md` do
firstmate; `MAPA` é `EST/lago2-fluxo-nekt`, `SK` é `EST/sankhya-tabelas-completo`, `ARQ` é
`EST/arquivos-no-lago`, `REL` é `EST/agendador-copias` e `LAK` é `EST/lakehouse-arquivos`; `INV §n` é a seção `n` do inventário do
legado, em `data/conexus-conector-estilo-novo-estudo/notas/inventario-legado.md`.

As versões que a construção instala são as que o estudo leu e rodou:

- `meltano` 4.4.1, `singer-sdk` 0.54.9, `pyiceberg` 0.12.0, `pyarrow` 26.0.1 e Python 3.13;
- `@aws-sdk/client-ecs`, `client-sqs`, `client-ssm` e `client-athena` 3.1175.0, a versão que o
  `main` fixa para o `client-cloudformation` e o `client-s3tables` (o `client-s3` de hoje fica em
  3.1146.0);
- `@mastra/core` 1.83.0 e o `@mastra/pg` do mesmo `package-lock.json`.

**Antes da construção.**

1. **A mudança de método para Python** (registro 0074). Ela ainda não entrou: o `main` não tem
   `apps/extraction/` nem linha do Meltano no `docs/reference/stack.md`. Ela traz:
   - as linhas do `stack.md` para o Meltano, o singer-sdk, o PyIceberg, o pyarrow, o `uv` e os quatro
     clientes novos da AWS;
   - um job de Python na CI (formatação, tipos e testes de `apps/extraction/`);
   - a conferência de documentos lendo as dependências de Python;
   - a regra de máquina do adaptador: ele importa só o índice do kit e não nomeia conector (0071);
   - uma frase na testing T26 para as formas do Singer e do Meltano.

   É um pull request de método só de documentos e configuração, com a palavra do fundador (delivery
   L20). A parte 0 e a etapa do conector não esperam por ele; a U4 e a U5 não começam antes dele.
2. **O reajuste das empresas**, antes de a parte 0 ser publicada (a seção do mesmo nome, abaixo).
3. **A segunda preparação da conta de laboratório** (decisão E), pelo firstmate, com a palavra do
   fundador, antes de a U6 publicar a plataforma.
4. **O L.2 à mão**, antes de qualquer unidade da parte 1. O firstmate, com a palavra do fundador, sobe
   na conta de laboratório uma tarefa avulsa na forma da prova
   (`conexus-lab-trilho/fases2a4/plataforma.py:80-90`), que faz o login e lê uma página do Sankhya do
   fundador. Se o gateway recusar o endereço da AWS, nenhuma unidade da parte 1 começa e a etapa
   volta ao fundador (0071). O critério 33 repete o teste com a imagem e a plataforma da U6.
5. **As sondas do Sankhya completo**, só de leitura, no Sankhya do fundador, com a palavra dele,
   antes da U3 (`SK` seção 4; `ARQ` seção 5). Cada uma é uma consulta ao dicionário ou poucas
   páginas, na janela em que as sondas de 2026-11-20 rodaram, menos a P6:
   - **P1**: a `DESCRTAB` e a `NUM_ROWS` das 42 tabelas e das oito candidatas (`SK` 1.4). Uma
     candidata entra na lista só se existir numa instalação padrão.
   - **PS1, as colunas de arquivo** (`LAK` seção 5): as colunas `BLOB`, `CLOB`, `NCLOB`, `LONG`,
     `LONG RAW`, `RAW` e `BFILE` das 42 tabelas e das candidatas, com o maior valor de cada uma; o
     nome e o tipo da coluna do XML na `TGFNFE`; e a tabela de anexos do Sankhya, com as colunas e o
     maior anexo. Com o resultado, antes da U3, o firstmate fixa o teto da coluna binária na linha,
     do maior valor medido e do limite de 32 MB da PS4 (`LAK` 1.1: "o teto sai da PS1 e do limite de
     32 MB"). Uma coluna binária abaixo do teto vai na linha, no tipo binário (T.36). Uma acima dele,
     a coluna do XML se não for de texto, e uma `BFILE` (um ponteiro para um arquivo fora do banco)
     param a U3 naquela tabela, e o firstmate leva ao fundador a coluna e o maior valor (T.41). A
     tabela de anexos não entra nesta etapa: é o alvo da etapa 3a.
   - **P2**: a chave, as colunas de alteração, as datas e os índices das tabelas que nenhuma sonda
     leu (a `TGFDIN`, a `TCBLAN`, a `TGFFIN` e as outras de `SK:283`).
   - **P3**: páginas cronometradas de 1 MiB na `TGFDIN`, `TGFITE`, `TCBLAN`, `TGFCAB`, `TGFFIN` e
     `TGFNFE`, com o plano.
   - **P4**: quantas linhas da `TGFITE` têm `DTALTER` nulo, e se elas mudam.
   - **P5**: a contagem por mês das datas da `TCBLAN` candidatas à janela.
   - **PS2**: uma página da `TGFNFE` com a coluna do XML, pela porta de consulta: se o XML vem
     inteiro, cortado ou vazio, quanto pesa a página e o maior XML.
   - **PS3**: se o `NUNOTA` só cresce e se o XML muda depois da autorização.
   - **PS4, o limite do Athena para o texto longo**: o Athena lê no máximo 32 MB numa linha ou numa
     coluna, um limite fixo do serviço ("Athena has a limit of 32 MB for the size of a row or its
     columns", https://docs.aws.amazon.com/athena/latest/ug/other-notable-limitations.html; e "a practical
     limit of 32MB for all of the data in a single row" para os tipos sem tamanho,
     https://docs.aws.amazon.com/athena/latest/ug/data-types-considerations.html, lidos em 2026-11-23).
     Na conta de laboratório, uma linha da `sankhya_notas_nfe` do dublê com um texto do tamanho do maior
     XML que a PS2 mediu, e uma linha de 31 MB, leem pelo Athena inteiras; uma de 33 MB falha. Se a PS1
     ou a PS2 acharem uma linha da `TGFNFE` perto de 32 MB, a U3 para (T.36).
   - **P6, a guarda da primeira carga "na hora"** (F1): uma página da EFD e uma da `TGFCTE` num dia
     útil, com o ERP em uso. Se a página do dia útil custar mais que o dobro da do feriado, a
     pergunta volta ao fundador com o número, antes da U3.

   Os resultados ficam na pasta da tarefa do firstmate (security S40). A U3 declara cada tabela pelo
   que elas mediram, e o "Parar se" dela diz o que volta. As respostas da P1, da P3, da P5 e da PS2
   viram as gravações do dublê do Sankhya, com os valores trocados por inventados (testing T29;
   security S40).
6. **O registro de decisão da porta nova do link**, "proposto", com o critério dela, antes de o G4 ser
   construído (spec 02, `design.md:229`): a página pública sem sessão, a função `connectors.link_of` e o
   papel `hub_links`.

Se a mudança de método mesclar com outra forma, a unidade segue a forma mesclada e o firstmate relê
esta seção.

## A página do fundador

**No fim desta etapa** você liga o Sankhya numa janela só, como na Nekt. Em **Integrações** você
clica **Ligar** no sistema, põe o acesso (ou manda um link para quem tem a senha), o Conexus
testa e lê o que o Sankhya oferece, você marca as tabelas, escolhe quando copiar e clica **Ligar e
copiar agora**. A primeira carga sai na hora. Em **Dados** você vê cada tabela chegar ao lago da
empresa, e a nota que você alterar hoje aparece na rodada seguinte. Depois, na página da ligação, você
marca outra tabela, muda o intervalo ou clica **Rodar agora**.

O Sankhya vem completo: o núcleo, o fiscal e o contábil, 49 tabelas (as 42 do estudo e sete das oito candidatas da P1: `TGFCUS`,
`TGFICM`, `TGFIPI`, `TGFCFO`, `TGFAJA`, `TGFCTS` e `TCBSALEMP`; o número é o de `sankhyaTables.declared`), com o XML de cada NF-e na
tabela dos dados da NF-e. Cada tabela traz um nome de negócio sugerido, que você pode trocar ao ligar, e todas as
colunas da sua instalação.

Antes disso, tudo o que hoje copia para o banco da empresa e lê dele sai. As pastas do Sankhya e do
Mercado Livre são refeitas no padrão novo, e o Assistente continua lendo os dois ao vivo durante a
troca. O lago é a única fonte.

**O que mudou desde a versão que você recusou** (PR https://github.com/developmentconexus-ops/conexus/pull/1260,
commit `6c159a4d`). Você disse em 2026-11-23: "isso você tá se baseado em decisões antigas, em
estrutura antiga e me trazendo para eu decidir baseado nisso. O que a gente tinha combinado é que a
gente tá reformulando tudo para seguir conforme a gente fez todo o estudo da Next". O firstmate montou
o mapa do desenho, entrevistou você, e você confirmou o desenho. O cartão mudou assim:

- **A janela de ligar está nesta etapa, com o fluxo da Nekt** ("Sim, é esse"). Sai a decisão L, que
  a punha numa etapa própria, e sai a seção para voltar depois como lugar de escolher. A seção
  **Tabelas no lago** da página da ligação fica, como o lugar de mudar depois de ligado, como o
  "Details" da Nekt. Ela só abre a escolha numa ligação ainda sem cópia, para quem fechou a janela no
  meio ou ligou pelo link, e abre a mesma janela (T.33).
- **O link de 30 minutos** para quem tem a senha entra já ("Já no Lago 2").
- **Quando copiar**: 24 h já escolhido, de 15 min a 24 h, ou **Só manual** ("24 h, como a Nekt").
  Ler só o que mudou entra na mesma parte, e sai o "uma vez por dia" da parte 1.
- **O nome da tabela é sugestão** ("Aprovo"). A janela sugere o nome do kit, `sankhya_notas`, com o
  prefixo `sankhya_` para todas; você troca ao ligar, e o nome fica fixo depois. Um nome repetido é
  recusado, e a segunda ligação do mesmo sistema vem sugerida com o nome dela. Cada tabela guarda no
  catálogo a origem (`TGFCAB`) e o rótulo do kit, para os agentes acharem a tabela pela origem. A
  parte gerada da skill usa os nomes reais.
- **O Sankhya completo** ("Sim, núcleo+fiscal+contábil"): 49 tabelas, cada uma num modo que o
  conector fixa: só o que mudou, janela por mês ou inteira.
- **O XML da NF-e** entra já, como na Nekt ("Já no Lago 2, como a Nekt"), como uma coluna de texto da
  tabela dos dados da NF-e, `sankhya_notas_nfe` (a `TGFNFE`), e não numa tabela própria ("E, não,
  beleza"). Vale para todo conector uma regra só, pelo tipo que a descoberta lê: texto longo vira texto,
  e binário vira o tipo binário do Iceberg; ninguém marca arquivo à mão. Nenhuma tabela guarda histórico, a dos dados da NF-e
  incluída: o fundador disse em 2026-11-24, às 16:19Z, "Outra coisa sobre o histórico de NFE, vamos deixar sem o histórico, porque eu acho que o jeito que você está querendo montar o histórico não é como as referências fazem." A nota mudada ou apagada no Sankhya
  sai do lago como em qualquer tabela inteira. Ler o XML
  em `nfe_notas` e `nfe_itens` é uma etapa própria, depois da 3 ("Etapa própria, depois da 3").
- **A máquina**: 2 vCPU na primeira carga e 1 vCPU com 2 GB nas rodadas seguintes ("2 vCPU na
  primeira carga").
- **O que a máquina gastou**, em cada rodada, como a Nekt mostra ("igual a NECT tem"): o tamanho
  dela, o pico de memória e o pico de CPU, cada pico com a fração do tamanho, e a duração. A tarefa
  mede a si mesma a cada 5 segundos e manda a medida junto do resultado; a rodada que morre não tem
  medida, e a frase da AWS diz por quê. Os gráficos ao longo da rodada chegam na etapa seguinte do
  lago, das medidas que já ficam gravadas.
- **O relógio das cópias** fica no Hub e só diz "quando" ("(a) Hub, só o 'quando'"). A rodada do
  relógio e o **Rodar agora** são a mesma chamada; o intervalo conta da hora em que você ligou; o Hub
  apaga o rastro que o relógio deixa; e as tarefas partem uma por vez.
- **O aviso de cópia parada é por ligação**, com os e-mails no passo Quando copiar, já com quem liga
  ("Por ligação, na janela"). Pelo tamanho, ele vem num cartão próprio logo depois deste, com as mesmas
  unidades (T.30). A seção **Avisos** de Configurações, com a lista da empresa, sai.
- **A primeira carga sai na hora**, com a P6 de guarda ("Na hora, com prova antes"). O usuário de
  integração do Sankhya segue como está ("Seguir como está").
- **Os arquivos no lakehouse** ("F1. A F2. A"). O lago guarda tabelas e arquivos, como a Nekt e o
  Databricks: o arquivo mora num depósito de arquivos da empresa, ligado à sua linha numa tabela do
  lago. Eles entram numa etapa própria, a 3a, "O arquivo chega ao lago, ligado à sua linha", logo
  depois da 3 e antes do XML lido em linhas. Esta etapa fica no seu escopo, sem fechar porta para
  eles: a sonda PS1 mede antes da U3 as colunas de arquivo das 42 tabelas, e uma coluna binária
  grande demais para a linha espera você ver o número (T.41). O desenho está no registro 0082, novo
  neste pull request, que emenda a 0070, a 0071, a 0073, a 0078 e a 0080. Os poderes de `S3` só no depósito de cada empresa entram
  na 3a.

**O que mudou desde a versão que você aprovou** (commit `bcd72da1`, 2026-11-23). Você perguntou em
2026-11-24: "eu poderia escolher se quero um sync completo ou não? Nekt tem isso? Entende meu ponto?
Vamos supor que quero de 5 anos, por exemplo." O firstmate estudou como a Nekt e os repositórios de
referência fazem, você escolheu "A bem estudado, baseado em nosso metodo, /pstack:poteto-mode e
repositórios referencia" e respondeu "1. Okay", "2. Ver referencia e ter certeza" e "3. Como Nekt
faz, mas ter certeza". O cartão mudou assim:

- **A data inicial.** No passo **Acesso**, depois do X-Token, você escolhe
  **Desde**: a data a partir da qual a cópia lê. Vazio, o padrão, é todo o histórico, como antes. Como na
  Nekt, a data compara com a coluna pela qual cada tabela segue: nas de movimento, a de alteração ("as
  linhas criadas ou alteradas desde essa data"); nas de janela, os meses. Os cadastros (parceiros,
  produtos, vendedores, tabelas de preço) e as tabelas inteiras vêm sempre inteiros. Na seção **Tabelas
  no lago** você muda a data: ela vale das próximas rodadas e nada roda sozinho. Para trazer o passado
  de uma data mais antiga, ou tirar do lago o que ficou antes de uma mais nova (nas tabelas de janela, os
  meses anteriores ficam), você clica **Ler de novo desde a data**, como o "full sync" da Nekt.

**Como a etapa chega até você: em três partes.** A parte 0, a etapa do conector e a parte 1. Cada
parte tem os seus pull requests e é usada por você quando entra no ar.

- A parte 0 tem umas 8.000 linhas mudadas, quase todas tiradas, em três pull requests.
- A etapa do conector tem umas 3.300, um pull request por conector e um para o Caderno.
- A parte 1 tem umas 6.550, em cinco pull requests. Ela passa das ~4.000 linhas que a delivery L2
  pede de uma parte usada sozinha, porque a janela e o "só o que mudou" vêm juntos, como no desenho
  que você confirmou, para a primeira ligação já poder rodar de 15 min a 24 h. Nenhum pull request
  passa de ~4.000 (T.9).

**O roteiro de uso.** No Hub da nuvem, na sua empresa, que já tem lago (etapa 1) e as ligações de
hoje do Sankhya e do Mercado Livre.

*Parte 0, o legado sai do banco da empresa.*

1. Em **Dados** não há mais as cópias de hoje. Também saíram o
   botão **Ligar uma cópia**, a **Amostra**, **Quem lê** e a liberação de cópias a um Projeto. Num
   Projeto, o Builder não oferece mais propor uma cópia. Pergunte ao Assistente sobre as vendas: ele
   responde lendo o Sankhya ao vivo, como já faz quando não há cópia. As pessoas, os papéis, a
   Memória, as ligações e os Projetos estão como estavam.

*O conector no padrão novo.*

2. Depois de cada versão que troca um conector, pergunte ao Assistente algo de cada sistema. Por
   exemplo: os pedidos de ontem no Sankhya, as perguntas sem resposta no Mercado Livre. Ele responde
   ao vivo, como antes da troca.
3. Pergunte ao Assistente o que ele consegue fazer no Sankhya. Ele diz que lê e que lança um pedido
   com a sua aprovação. Antes, o texto dele negava a escrita que existe.
4. Peça ao Assistente que descubra o que é uma venda na sua empresa. Antes de gravar no **Caderno**,
   aparece um cartão pedindo o seu sim, com o que ele provou e a consulta da prova. Aprove: a
   anotação aparece na página da ligação, com o seu nome. Recuse outra: nada é gravado.
5. Em **Integrações**, as duas ligações estão como estavam: **Testar** funciona, e a reconexão do
   Mercado Livre também.

*Parte 1, a carga chega e a mudança aparece.*

6. Em **Integrações**, na lista de sistemas para ligar, clique **Ligar** em "Sankhya". Dê um
   nome à ligação, por exemplo "Sankhya · Lago". A ligação de hoje continua como está, com as
   leituras ao vivo.
7. **Acesso.** No alto, a barra de passos mostra Acesso, Testando e lendo, O que copiar e Quando
   copiar. Preencha o Client ID, o Client Secret e o X-Token. Depois do X-Token, **Desde** vem vazio,
   "todo o histórico": ponha uma data de cinco anos atrás. Clique **Continuar**. A janela diz
   "Testando a ligação…" e depois "Lendo o que o Sankhya oferece". Se o Sankhya recusar a chave, ela
   diz "O Sankhya recusou as chaves", com a resposta dele por extenso, e os campos para corrigir.
8. **O que copiar.** Aparecem as tabelas que o kit declara, agrupadas por assunto, com busca e a
   marca do grupo inteiro, como na Nekt, e nada marcado. Cada
   uma traz o rótulo, a origem ao lado (**Notas e pedidos**, `TGFCAB`), a descrição e o número de
   colunas do dicionário da sua instalação, o nome sugerido no lago (`sankhya_notas`) e o modo que o
   conector fixa: "só o que mudou", "janela por mês" ou "inteira". Em cima, o prefixo `sankhya_`
   vale para todas. Marque, por exemplo, **Notas e pedidos**, **EFD: média
   diária do ICMS-ST** e **Dados da NF-e**, uma de cada modo; a última traz o XML de cada nota e não é
   limitada pela data. O rodapé conta as tabelas marcadas e quantas a data limita. Troque o nome sugerido de uma delas.
9. **Quando copiar.** Vem 24 h escolhido; há de 15 min a 24 h e **Só manual**. Embaixo, a revisão:
   as tabelas marcadas, com o nome de cada uma no lago, o intervalo e a data inicial ("Desde <data> nas tabelas que a data limita."). Clique **Ligar e copiar
   agora**. Os e-mails do aviso de parada entram neste passo com o cartão do aviso, logo depois deste
   (T.30).
10. **Ligado.** A janela diz que a primeira carga começou, com **Ver em Dados**. Em **Dados**, cada
    tabela marcada aparece pelo rótulo, com o nome no lago e a origem embaixo, e "Rodando…"; quando a
    carga termina, **Em dia**, com as linhas e a hora. Em **Rodadas**, "Completa · inteira"; em
    **Detalhes**, a de **Notas e pedidos** diz "Desde <data>" e a de **Dados da NF-e**, "Todo o histórico";
    em **Colunas**, todas as da sua instalação, as criadas pela sua empresa (`ad_…`) incluídas. Quanto a
    primeira carga leva no seu Sankhya não foi medido: a das 42 juntas foi estimada entre 6 e 17
    horas (`SK` 3.3).
11. Quando a primeira carga terminar (**Em dia**), abra a página da ligação, na aba **Tabelas**: a seção **Tabelas no
    lago** mostra o que a ligação copia. Marque **Parceiros**, com o nome sugerido ou outro, e salve:
    ela começa inteira na hora, numa rodada só dela. O nome das que já existem não muda mais. Mude o
    intervalo para 15 min. Mude **Desde** para dez anos atrás e salve: nada roda, e a seção diz que as
    próximas rodadas continuam de onde pararam. Clique **Ler de novo desde a data**: o diálogo lista
    **Notas e pedidos** e as outras que a data limita, e não **Parceiros**. Confirme: em **Rodadas**,
    "Completa · inteira" só nessas tabelas, e **Notas e pedidos** tem mais linhas que antes. Os
    e-mails do aviso entram nesta seção com o cartão do aviso.
12. Quando a rodada de **Parceiros** terminar, lance ou altere uma nota no Sankhya e clique **Rodar
    agora**. A rodada diz "Completa · só o que
    mudou" e mostra poucas linhas lidas. Passe a ligação a **Só manual**: ela não roda mais sozinha, e
    **Rodar agora** continua funcionando.
13. Em **Integrações**, comece outra ligação do Sankhya e clique **Enviar link**. Marque os campos
    que a outra pessoa preenche e gere o link: aparecem o endereço e o prazo, 30 minutos. Abra o
    endereço numa janela anônima: aparecem quem pediu, o sistema e só os campos marcados. Não
    envie; passados 30 minutos, o mesmo endereço diz que o link venceu.
14. O firstmate mostra no console da AWS, na sua frente, as tabelas no lago da sua empresa: a
    `sankhya_notas` com a nota alterada e o valor de hoje, a origem e o rótulo nas propriedades de
    cada tabela, e o XML de uma nota na coluna dele da `sankhya_notas_nfe`. O Hub ainda não lê o lago para
    ninguém; isso é a etapa 3.

No Mercado Livre, que tem a credencial exclusiva até a etapa 5, a janela vai do login direto ao
**Ligado**, sem O que copiar e Quando copiar (spec 02, requisito 4.10).

**O que você faz, e quando.**

- **No começo:** aprova esta página.
- **Antes de a parte 0 entrar no ar:** dá a palavra para o firstmate fazer o reajuste. Ele roda o
  inventário só de leitura em todas as empresas e apaga, pelo botão Apagar, cada cópia que achar.
- **Antes do último pull request da parte 0:** dá a palavra para a mudança de permissões que tira as
  tabelas das cópias do banco do Hub (data D11). Com a versão da parte 0 no ar, dá também a palavra
  para o firstmate tirar o esquema `sync` e os logins de cada empresa.
- **Antes da parte 1:** dá a palavra para a mudança de método, para a segunda preparação da conta
  (E), para o L.2, o primeiro teste de uma tarefa contra o seu Sankhya de dentro da AWS, e para as
  sondas só de leitura do Sankhya completo, a P6 num dia útil. Se o Sankhya recusar o endereço da
  AWS, nada da parte 1 é construído e a etapa volta a você. Se a P6 der mais que o dobro, a primeira
  carga "na hora" volta a você com o número. Se a PS1 achar numa das 42 tabelas uma coluna binária acima
  do teto, ou a coluna do XML não for de texto, você vê a coluna e o maior valor antes de essa tabela
  entrar.
- **Na parte 1:** dá a palavra para as permissões novas no banco do Hub (data D11): o login da
  empresa ler a linha do próprio lago (H), as tabelas novas da cópia e a do link.
- **No fim de cada parte:** faz o roteiro dela, diz o que viu e aprova os textos novos da tela, que
  o pull request daquela parte lista.

**O reajuste das empresas.** Não é preciso apagar a sua empresa. O firstmate já rodou, com a sua
palavra, o inventário só de leitura no banco do Hub de produção (2026-11-23). O que ele achou na sua
empresa (as cópias, as liberações a Projetos e as propostas) fica fora do repositório, na pasta da
tarefa do firstmate (security S40). Os passos
estão na seção "O reajuste, os passos do firstmate":

1. O firstmate roda a mesma consulta em **todas** as empresas, porque a versão da parte 0 não sabe
   mais rodar nem apagar uma cópia do banco.
2. Com a sua palavra, ele clica **Apagar** em cada cópia achada, na versão que está no ar hoje. O
   Apagar tira a leitura dos apps e apaga a cópia, com as rodadas, as liberações e as marcas de
   quem lê. Também derruba a tabela do `sync` e o relógio dela.
3. A mesma consulta mostra zero cópias e zero relógios de cópia. As pessoas, os papéis, a Memória, as
   ligações e os Projetos estão iguais. Só então a parte 0 é publicada.
4. Com a versão da parte 0 no ar e a sua palavra, ele tira de cada empresa o esquema `sync`, já vazio,
   e os logins dele. Uma consulta só de leitura mostra que nada sobrou.

O que se perde:

- as linhas copiadas no `sync`, que voltam do Sankhya pelo lago;
- o histórico das rodadas dessas cópias;
- as liberações a Projetos.

Tudo o mais fica. Os Projetos que liam uma cópia ficam sem a tabela até a etapa 4 (a sua J). A busca por
`sync.` nos arquivos publicados dos apps não rodou (eles moram no armazenamento de Git do Hub, fora
do banco); as liberações já dizem quais Projetos leem.

**A visão.** A etapa serve a estas linhas da `VISION.md`:

- "o lago é a única fonte dele: nenhum caminho paralelo copia o mesmo dado para outro lugar"
  (`VISION.md:51`): a parte 0 e a cópia;
- "Há uma fonte só de conectores, o kit" (`:54`) e "uma capacidade nova nasce desenhada com duas
  classes de conector" (`:56`): o Sankhya e o Mercado Livre refeitos juntos;
- "o que um agente aprendeu aparece como proposta, não como fato" (`:58`) e "A memória de um agente
  não aprende sozinha" (`:64`): o Caderno pede o sim;
- "Um agente escreve no sistema com a aprovação de uma pessoa" (`:29`): a escrita com o cartão, que
  fica.

Nada cruza a visão.

**Fica de fora.**

- **O Hub ler o lago**, para o Assistente (etapa 3) e para os apps (etapa 4). Da parte 0 até a etapa
  3, o Assistente lê o Sankhya e o Mercado Livre só ao vivo.
- **Os arquivos no lago** (a etapa 3a): o depósito de arquivos na pilha da empresa e os poderes de
  `S3` nele (F2), a linha de origem e a leitura que baixa no kit, a regra de tamanho, o arquivo no
  registro do Singer, e abrir o arquivo de uma linha pelo Hub. A tabela de anexos do Sankhya vem com
  ela.
- **O XML lido em linhas** (`nfe_notas` e `nfe_itens`): a etapa própria logo depois da 3a, que a
  trilha ganha nesta mudança.
- **O aviso de cópia parada**, com os e-mails no passo Quando copiar: o cartão próprio logo depois
  deste (T.30).
- **Refazer o executor, o login por autorização, as leituras como ferramentas e a escrita com o
  cartão.** Eles já são o que você decidiu (0056, 0057, 0062) e ficam (A a).
- **O Caderno sair.** As anotações viram propostas da Ontologia, e o Caderno sai, na etapa do Negócio
  (0064; B a).
- **A Fábrica de conectores.** Ela é provada no TOTVS, depois da etapa 7 do lago. As pastas desta
  etapa são escritas à mão, da documentação e das gravações.
- **O Builder propor uma tabela.** Volta com a escolha de tabelas, na etapa 6, se alguém pedir.
- **A busca no dicionário das tabelas que o kit não declara e a escolha de campos** (etapa 6). Nesta
  etapa a lista é a que o kit declara ("So as que o kit declara"), com todas as colunas.
- **O que sumiu da fonte some do lago** (etapa 7). As tabelas inteiras já trocam tudo a cada rodada, e
  as de janela trocam a janela; numa tabela só do que mudou, a linha apagada no Sankhya fica no lago
  até a etapa 7. A passada inteira de domingo do motor de hoje não vem (T.17).
- **A data pela emissão, os títulos abertos fora da data e a data nas tabelas inteiras** (T.43). A data
  compara com a coluna pela qual a tabela segue, como no SAP Business One da Nekt; a emissão e os
  abertos são a forma de quem não tem coluna de alteração (WK Radar, Protheus).
- **Reler sozinho ao gravar uma data mais antiga** (T.45). Nenhuma referência de extração de ERP faz.
- **O binário muito grande no depósito** (imagem, PDF anexado): a regra de tamanho entra na 3a
  (`LAK` 1.1). Nesta etapa o binário fica na linha, no tipo binário do Iceberg, abaixo do limite de
  32 MB do Athena (PS4), e abaixo do teto que sai da PS1 (T.41).
- **O histórico** (decisão A): nenhuma tabela o guarda nesta etapa, a dos dados da NF-e incluída (o fundador,
  2026-11-24, 16:19Z: "Outra coisa sobre o histórico de NFE, vamos deixar sem o histórico, porque eu acho que o jeito que você está querendo montar o histórico não é como as referências fazem."). O campo `history` da declaração fica, falso em todas.
- **A descrição do sistema** (spec 02, `C1`): o fluxo que você confirmou não a usa; ela entra com a
  etapa que a pedir.
- **A segunda classe de credencial na cópia** (etapa 5). O Mercado Livre declara a classe exclusiva
  já na etapa do conector, e a janela dele vai direto ao **Ligado**.
- **Atualizar a receita de um lago que já tem dado.** Os lagos de hoje estão vazios: o firstmate os
  apaga e cria de novo pelo botão da Central depois da segunda preparação.
- **O custo por rodada.** A conta de laboratório não separa a fatura por empresa (registro 0072).
- **O botão Seguir uma cópia.** Você decidiu em 2026-11-21 que ele só entra se alguém pedir.
- **As issues `next-card` das pastas da etapa.**
  - Entram:
    - a #940 (a linha sem data de alteração), na primeira rodada inteira;
    - a #942 (o relógio visto rodar sozinho), no passo 11 do roteiro, com o intervalo de 15 min;
    - a #1135 (o código do sistema sem corte), na tabela nova da rodada;
    - a #1265, a #1266 e a #1267 (o servidor de respostas gravadas da QA, as gravações sem leitor e o
      roteiro de gravação fora do repositório), na U8;
    - a #929 e a #930 (o escape do `LIKE` e o 20 da página das buscas do Sankhya), na pasta refeita
      (U17).
  - Fecham com o código que sai na parte 0, e o pull request dela diz por quê:
    - a #943, a #944 e a #946, das cópias do banco;
    - a #960, das liberações a Projetos;
    - a #988, das dívidas do `sync`;
    - a #1136 e a #1140, do `copy_runs`;
    - a #1139, de **Quem lê**.
  - Esperam:
    - a #1116 e a #1126 (o placar do dado copiado e a Amostra), pela etapa 3, que lê o lago;
    - a #961 (o app declara o que lê), pela etapa 4;
    - a #819 (o SQL ao vivo do Assistente no dublê) e a #882 (as escritas que a 24.5 deixou);
    - a #998 (os dados pessoais dos conectores), cujos gatilhos são um conector escrito pelo
      Builder;
    - a #1124 e a #1125, da origem e das linhas da conversa, que são da outra trilha;
    - a #1263 e a #1264, do lago da etapa 1, cujo gatilho esta etapa não toca;
    - a #994 e a #895, das dívidas do Assistente e do cartão da 24.6, que são da outra trilha;
    - a #1175, das gravações do Mastra de versões antigas, que a U19 não regrava.

**As suas decisões nesta etapa.** Uma nova, a Data (2026-11-24); as outras estão respondidas, em
2026-11-23:

- ao reestudo: "Lago 2 aprovo os recomendados";
- aos nomes: "okay", "okay", "sim" e "sim", às letras que aqui são NT1 a NT4 (o estudo as chama pela
  letra N e o número, um nome que a conferência de documentos reserva);
- ao estudo do ao vivo, na página https://claude.ai/artifact/Lpb1H6fUwea7U3FTnmaQpQ: "Aprovado suas
  recomendacoes conector";
- à entrevista do Lago 2 e ao desenho, na página https://claude.ai/artifact/NPjMLzXJeMDM62E1ATqGkA:
  "Sim, é esse", "2 vCPU na primeira carga", "Sim, núcleo+fiscal+contábil", "24 h, como a Nekt",
  "Aprovo", "Já no Lago 2", "Por ligação, na janela", "Não, eu confirmo o desenho", "(a) Hub, só o
  'quando'", "Na hora, com prova antes", "Seguir como está", "Já no Lago 2, como a Nekt", "Etapa
  própria, depois da 3" e "Okay";
- ao estudo do lakehouse com arquivos (`conexus-lakehouse-arquivos`): "F1. A F2. A";
- à data inicial da cópia, em 2026-11-24: a pergunta dele, "eu poderia escolher se quero um sync
  completo ou não? Nekt tem isso? Entende meu ponto? Vamos supor que quero de 5 anos, por exemplo."; a
  escolha, "A bem estudado, baseado em nosso metodo, /pstack:poteto-mode e repositórios referencia"; e
  as respostas às três perguntas do estudo, "1. Okay", "2. Ver referencia e ter certeza" e "3. Como
  Nekt faz, mas ter certeza".

A lista dos onze sistemas do `D3` ("Conector eu quero: - Sankhya - Mercado Livre - Hubspot - TOTVS -
Gmail com Agenda - Outlook email - Outlook Calendar - google drive - Sharepoint - NF-e - Sicoob") é
da trilha e está na página dela. O que cada decisão faz no cartão:

| # | A decisão | A sua resposta | O que faz no cartão |
| --- | --- | --- | --- |
| Fluxo | Como se liga um sistema e se escolhe o que copiar | "Sim, é esse": uma janela só, como a Nekt; depois, mudar na página da ligação | A U9 (a janela e a seção de mudar), a U20 (o link). Veredito: embrulhado (spec 02, `C4`, `C5`, sobre as rotas da U8) |
| Link | Quando entra o link de 30 minutos | "Já no Lago 2" | A U20 e o passo 13. Veredito: embrulhado (o `connect_link` da Nango, 30 minutos) |
| Intervalo | O padrão e as escolhas | "24 h, como a Nekt"; de 15 min a 24 h, ou **Só manual** | A U8 e a U9; a parte 2 de antes entra na parte 1. Veredito: nativo (o gatilho Schedule e o Manual da Nekt) |
| Nome | Quem dá o nome da tabela no lago | "Aprovo": sugerido do kit, trocável ao ligar, com prefixo, fixo depois; a origem e o rótulo no catálogo; a skill com os nomes reais; repetido recusado | A U3, a U5, a U8 e a U9. **Emenda a NT1**: o nome do kit é sugestão, não regra. Veredito: nativo (a Nekt, `NK:12217-12220`) |
| Completo | Quais tabelas do Sankhya o kit declara | "So as que o kit declara [...] vamos fazer ele completo"; "Sim, núcleo+fiscal+contábil" | As 49 tabelas da U3 (as 42 de `SK` e sete candidatas da P1), cada uma com o modo. **Emenda a F (a)**: a `TGFCAB` continua a tabela que prova, e o kit declara as 42. Veredito: embrulhado (a lista do kit sobre o `--discover`) |
| Data | Se a cópia lê todo o histórico ou desde uma data, onde se escolhe, o que mudar faz e que data conta | "A bem estudado" (2026-11-24, à pergunta dele: "eu poderia escolher se quero um sync completo ou não? Nekt tem isso? [...] Vamos supor que quero de 5 anos, por exemplo."); "1. Okay" (em O que copiar), e no protótipo da janela o campo passou ao Acesso, "Aprovo" (2026-11-25); "2. Ver referencia e ter certeza": mudar só grava, e **Ler de novo desde a data** relê as tabelas que ela limita, como o full sync da Nekt, o Refresh do Airbyte e o `--full-refresh` do Meltano, e nenhuma relê sozinha; "3. Como Nekt faz, mas ter certeza": a data compara com a coluna pela qual a tabela segue, a de alteração no movimento, como os documentos do SAP Business One da Nekt | A U3 (o cadastro na declaração), a U4 (a `start_date` do tap), a U5, a U7, a U8 (gravar, recusar, reler pela porta do **Rodar agora**), a U9 (o campo, o aviso, o botão), a U10 (a releitura troca). Veredito: nativo (a `start_date` do Singer, `singer-sdk@0.54.9 singer_sdk/streams/_state.py:156-167`), embrulhado na janela por mês (linha 66) e no botão (linha 73) |
| XML | O XML da NF-e e as colunas de arquivo | "Já no Lago 2, como a Nekt"; "Etapa própria, depois da 3"; o histórico: "Okay" e depois, em 2026-11-24, 16:19Z, "Outra coisa sobre o histórico de NFE, vamos deixar sem o histórico, porque eu acho que o jeito que você está querendo montar o histórico não é como as referências fazem."; sem tabela própria: "E, não, beleza" | O XML como coluna de texto da `sankhya_notas_nfe`, sem histórico (U3, U10); a regra pelo tipo para todo conector (U3, U4, U5); a leitura em linhas na etapa nova da trilha. **Emenda a regra de 2026-11-19**: sai a parte dos anexos; índices, logs e cópias de backup datadas continuam fora. Veredito: nativo (o tipo que a descoberta lê, a forma da Nekt e do Airbyte para o Oracle, `NK:132602`) |
| Arquivos | Em que etapa os arquivos entram (F1) e os poderes de `S3` que eles pedem (F2) | "F1. A F2. A" | Nada constrói os arquivos nesta etapa; a PS1 antes da U3 e a T.41 guardam a porta. A trilha ganha a etapa 3a, e os poderes de `S3` só no depósito de cada empresa entram nela. **O registro 0082 emenda a 0070, a 0071, a 0073, a 0078 e a 0080**. Veredito: fica de fora (a 3a); o desenho é o volume da Nekt e do Databricks (`LAK` 1.7) |
| Máquina | O tamanho da tarefa | "2 vCPU na primeira carga"; 1 vCPU e 2 GB nas seguintes | A U6 e a U8 (T.6). A 0076 fica como está, e a linha das seguintes se acrescenta |
| Medida | O que a rodada mostra da máquina | "igual a NECT tem" (2026-11-24) | A U5, a U8 e a U9. Veredito: nativo (o endpoint de metadados v4 do Fargate, lido de dentro da tarefa; o Container Insights fica de fora, por minuto e fora do banco do Hub) |
| Relógio | Onde mora o relógio das cópias | "(a) Hub, só o 'quando'" | A U8: uma chamada só para o relógio e o **Rodar agora**, o intervalo contado da hora de ligar, a poda do rastro, uma partida por vez. **Emenda o relógio da 0076**. Veredito: nativo no relógio (o agendador do Hub, como as oito referências de `REL` seção 3); a partida pela tarefa continua remendo, da 0076 (linha 21) |
| Aviso | Onde moram os e-mails do aviso de parada | "Por ligação, na janela" | O cartão do aviso, logo depois deste. **Substitui a I (a)** de 2026-11-21 e de 2026-11-23 |
| F1 | A primeira carga, que agora dura horas | "Na hora, com prova antes" | A P6 antes da U3 |
| F3 | Pedir à Sankhya um usuário só de leitura | "Seguir como está" | Nada muda; a cópia só lê, pelo filtro do kit |
| A | Por quanto tempo a bruta guarda o histórico | (a) só até entrar na atual | A U10 limpa da bruta o que já entrou na atual, em todas as tabelas. Veredito: remendo (a limpeza é nossa); como nativo, um `DELETE` do Athena depois de cada atualização |
| B | Como a cópia no lago é ligada e aparece | Cai; vale a K2 de 2026-11-19, lida como a Nekt: dentro do fluxo de ligar, nada marcado, o modo sem escolha | A janela da U9 |
| C | Quando uma cópia conta como parada | (a) na primeira rodada da ligação que termina com erro | O cartão do aviso |
| D | A D4, as senhas por empresa | (a) sai | Nenhuma unidade da D4; os logins saem na parte 0, com o `sync` (NT3). Veredito: nativo (`DROP ROLE`) |
| E | A segunda preparação da conta e os poderes novos | (a) pelo mesmo passo a passo, com a mesma trava | O robô cria o papel que escreve de cada empresa; o teto sobe; a Release cria a plataforma da cópia; o Hub inicia e para a tarefa. Veredito: nativo (IAM, CloudFormation) |
| G | Uma tarefa por tabela ou por sistema | (b) uma rodada por ligação | O relógio, a rodada e o intervalo são da ligação. Veredito: nativo (a seleção do `meltano run`; o gatilho por fonte das referências) |
| H | O login da empresa lê a linha do próprio lago | (a) só lê a própria linha, num pull request próprio | O G3 |
| J | O app que lê uma cópia, entre a etapa 2 e a 4 | (a) fica sem a tabela até a etapa 4 | Os Projetos que liam uma cópia leem uma tabela que não existe; na etapa 4 o app declara a `sankhya_notas`, e a regra de venda passa para o app ou para a camada Negócio |
| NT2 | A língua do nome técnico | (a) português | `sankhya_notas`, `mercado_livre_pedidos` |
| NT3 | Quando sai o que lê o `sync` | (a) na parte 0 | O G0b e o G0c; os Projetos e o Assistente ficam só com o ao vivo até as etapas 3 e 4 |
| NT4 | Os nomes sugeridos | (a) `sankhya_notas`, "Notas e pedidos"; com o completo, os 49 da mesma regra (`SK` seção 1) | A U3 |
| NT5 | Duas ligações do mesmo sistema | (a) uma tabela por ligação | A segunda ligação vem sugerida com o nome dela, `sankhya_<ligação>_notas`, trocável (T.16) |
| A do conector | O alcance do "refeito" | (a) refazer do zero as pastas do Sankhya e do Mercado Livre e cada peça do Hub que diverge do decidido; as que já são o decidido ficam; a Fábrica é provada no TOTVS | A U16 a U19. Veredito: embrulhado (a forma do kit, conferida pela conformidade e pelos dublês) |
| B do conector | Quando o Caderno sai | (a) na etapa nova, gravar pede o sim de quem gerencia a ligação; o Caderno sai na etapa do Negócio | A U19. Veredito: nativo (a suspensão do Mastra, como o `ask_user` e o `submit_plan`) |
| C do conector | Onde a troca entra no roteiro | (a) uma etapa própria entre a parte 0 e a parte 1, um pull request por conector, sem o Assistente perder as leituras ao vivo | O GC1, o GC2 e o GC3, entre o G0c e o G1 |

**As emendas, uma por uma.** Cada uma muda uma decisão aceita, pela sua palavra mais nova:

- **A I (a)** (a lista de e-mails da empresa em Configurações) é substituída: os e-mails são da
  ligação, no passo Quando copiar.
- **A NT1** deixa de ser regra: o nome do kit é a sugestão.
- **A regra de 2026-11-19** ("Anexos, índices, logs e cópias de backup datadas ficam fora") perde os
  anexos: anexos e colunas de arquivo entram no lago.
- **O relógio da 0076** ("The Hub's clock starts a Fargate task per run") passa a dizer só "quando":
  a rodada parte de uma chamada só, a mesma do **Rodar agora**, com o intervalo contado da hora de
  ligar. O fechamento da etapa corrige o texto da 0076 (a dívida).
- **A F (a)** e a etapa 6 da trilha: a lista do kit passa de uma tabela para 42; a etapa 6 fica com a
  busca no dicionário e os campos.
- **A spec 02**: o intervalo padrão de 30 min passa a 24 h, e "Ligar e copiar agora" grava a cópia da
  ligação num pedido só (G b), em vez de um `enableCopy` por tabela.
- **A trilha** ganha duas etapas depois da 3: a 3a, "O arquivo chega ao lago, ligado à sua linha", e
  "O XML lido em linhas"; as fiscais e as contábeis da etapa 7 entram já nesta.
- **Os registros 0070, 0071, 0073, 0078 e 0080** ("F1. A F2. A"), pelo registro 0082, escrito
  nesta mudança: o lago guarda tabelas e arquivos, no depósito de arquivos da empresa (0070), com o
  arquivo no registro do Singer e a regra de tamanho (0071), o depósito e os poderes de `S3` na pilha
  (0073), o arquivo aberto pela tabela dele, só pelo Hub (0078), e a linha de origem e a leitura que
  baixa na declaração (0080). Tudo isso é construído na 3a.

## As unidades

Os números das unidades e dos critérios da versão anterior ficam. As unidades novas seguem da U20, e
os critérios novos, do 88. A U11, a U12 e a U13 e os critérios 62 a 69 vão para o cartão do aviso
(T.30).

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G0a O que cria cópia sai (um PR, parte 0) | U2 O Builder deixa de propor cópia | Sai `copy_propose`, com o cartão dele na conversa e a sua linha nas listas de ferramentas | o raio da U2 | testing (T5) | o `main`; entra antes da U1 |
| G0a | U1 O motor que cria cópia sai | Saem os modelos do kit, a definição por consulta, ligar e aceitar, a rodada com posse, o relógio por cópia, o SQL que escreve no `sync`, o diálogo **Ligar uma cópia**, as propostas na página Dados, a lista do Desligar | o raio da U1 | data (D6) | U2; o reajuste feito antes da publicação |
| G0b O que lê o banco da empresa sai (um PR, parte 0) | U14 O que lê o `sync` sai | Saem o catálogo das cópias em Descrever, Ler e Consultar, a Amostra, Quem lê, a liberação a Projetos e aos apps, os logins por papel, `copy_runs`, o texto do `sync` no `app_data_read`, a lista e o detalhe de uma cópia em Dados, e o contrato das cópias | o raio da U14 | data (D6) | G0a mesclado |
| G0c As tabelas das cópias saem (um PR, data D11, parte 0) | U15 A migração que tira as cópias | Saem as tabelas `copies.*` de hoje e `notifications.copy_follower` e `copy_notice`, com as permissões | o raio da U15 | data (D6, D11) | G0b publicado (data D6); o reajuste feito |
| GC1 O Sankhya no padrão novo (um PR, etapa do conector) | U16 O kit ganha a classe, a sessão, o número exato e a skill gerada | A classe da credencial em todo login; a sessão do kit, que o Hub usa; o leitor de número exato; a skill em duas partes, a gerada da definição e a escrita | o raio da U16 | testing (T5, T29) | a parte 0 usada |
| GC1 | U17 A pasta do Sankhya, refeita | A pasta nova na forma do kit, com os mesmos ids; a pasta velha sai no mesmo commit | o raio da U17 | testing (T5) | U16 |
| GC2 O Mercado Livre no padrão novo (um PR, etapa do conector) | U18 A pasta do Mercado Livre, refeita | A pasta nova, com a classe exclusiva; a velha sai no mesmo commit | o raio da U18 | testing (T5) | GC1 mesclado |
| GC3 O Caderno pede o sim (um PR, etapa do conector) | U19 O Caderno pede o sim | Gravar no Caderno pede, no cartão da conversa, o sim de quem gerencia a ligação | o raio da U19 | testing (T5); security (S8) | GC1 mesclado |
| G1 O kit declara tabelas (um PR, parte 1) | U3 O kit declara as tabelas | A declaração por tabela, com o nome sugerido, o rótulo, a descrição, o grupo, a origem, a chave, o modo e o histórico; as 49 tabelas do Sankhya, com o XML como coluna de texto e o binário pelo tipo; a descoberta única; a página em linhas e bytes; a skill com os nomes reais; os dublês que mudam um registro; o cadastro na declaração de uma tabela só do que mudou (a data não o limita) | o raio da U3 | testing (T5, T29) | a etapa do conector usada; as sondas do Sankhya completo |
| G1 | U4 O adaptador | `apps/extraction/tap/`, o leitor Singer único, que lê só a declaração do kit e copia numa rodada as tabelas escolhidas, nos três modos; a `start_date` da rodada, como o Singer a lê | o raio da U4 | testing (T26) | U3; a mudança de método |
| G2 A tarefa e a plataforma (um PR, parte 1) | U5 A tarefa | `apps/extraction/`: o projeto `uv`, o `meltano.yml`, o gravador do lago (com a origem e o rótulo nas propriedades da tabela), a entrada da tarefa, a imagem; o L.1, o L.3 e o L.5; a data da cópia na configuração do tap | o raio da U5 | security (S31, S41) | G1 e G3 mesclados; a mudança de método |
| G2 | U6 A plataforma da cópia | Em `infra/aws/`: a fila, a regra, o cluster, a tarefa de 1 vCPU e 2 GB e a rede; o papel que escreve; o teto; os poderes do Hub; a preparação, com o depósito de imagens; a Release monta a imagem; o L.2 e o L.6 | o raio da U6 | security (S36, S40) | U5; a segunda preparação (E) |
| G3 As tabelas da cópia do lago (um PR, data D11, parte 1) | U7 A migração e a permissão | `lake_copy`, `lake_table`, `lake_run`, `lake_table_run`, `connection_link`; os ids e códigos do fio da cópia; a leitura da linha do lago pela empresa (H); a data inicial em `lake_copy` | o raio da U7 | data (D6, D10, D11, D15) | a etapa do conector usada |
| G4 A cópia pelo Hub e a janela (um PR, parte 1) | U8 O disparo e o fim | A lista da ligação com os nomes sugeridos; gravar a cópia com os nomes e o intervalo; o relógio que só diz "quando"; `iniciarRodada`, uma partida por vez; o tamanho da máquina por rodada; a poda do rastro do Mastra; o fim pela fila; a varredura; desmarcar e apagar o lago com tabela; as rotas de Dados; gravar a data, recusar a de depois de hoje e pedir `whole` das tabelas que a data limita pelo **Rodar agora**; a máquina de cada rodada, gravada do resultado em lake_run (a migração nova), e o motivo da parada do ECS na rodada perdida; a #1265, a #1266 e a #1267 | o raio da U8 | data (D25, D27); security (S8, S41) | G2 e G3 mesclados |
| G4 | U20 O link de 30 minutos | Criar o link, a página pública dele e o envio que cria a ligação | o raio da U20 | security (S10, S41) | U8 |
| G4 | U9 A janela e a tela | A janela Ligar, com a barra de passos (peça nova de `ui/`), Acesso (com o campo **Desde**), Testando e lendo, O que copiar, Quando copiar e Ligado; a seção **Tabelas no lago**, na aba **Tabelas** da ligação, como o lugar de mudar; a lista e a página de uma tabela do lago em Dados; o campo **Desde** no Acesso e na seção, o aviso do efeito e **Ler de novo desde a data**; a máquina da rodada na aba Rodadas | o raio da U9 | web, design | U8, U20 |
| G5 A mudança aparece (um PR, parte 1) | U10 Só o que mudou | O ponto de parada do Meltano no `S3`; o modo incremental e a janela por mês; o atualizar; a limpeza da bruta (A), em todas as tabelas; o L.4 e o L.7; a releitura desde a data troca a tabela pela passada inteira de sempre | o raio da U10 | data (D25) | G4 mesclado |

São onze grupos, um pull request cada ([delivery L9](../guides/delivery.md)), com um commit por
unidade. No G0a, a U2 entra antes da U1, que apaga o que a U2 deixa sem chamador. No GC1, a U16
entra antes da U17. No G4, a U8, a U20 e a U9, nessa ordem.

- **A linha principal.** Tirar antes de pôr: primeiro o G0a, o G0b e o G0c, nessa ordem.
  - O G0c espera o G0b publicado, porque um `DROP` só entra quando nenhum código no ar lê a tabela
    (data D6).
  - A etapa do conector começa depois de o fundador usar a parte 0. O GC1 vem primeiro. Depois dele,
    o GC2 e o GC3 correm em paralelo: o GC3 divide pastas com o GC1 (`hub/connectors/`,
    `builder/conversation/`), e não com o GC2.
  - A parte 1 começa depois de o fundador usar a etapa do conector. O G1 e o G3 correm em paralelo;
    o G2 parte dos dois mesclados, porque a imagem leva o adaptador e o contrato da tarefa usa os ids
    do G3; o G4 parte do G2 e do G3; o G5 parte do G4.
- **As três partes.** Cada uma começa depois de o fundador usar a anterior e publica uma versão, com o
  nome que o firstmate dá pela delivery L17. Os grupos da parte 1 se publicam só quando o G5 entra: a
  janela não chega à pessoa antes de a rodada seguinte ler só o que mudou. A etapa fecha com a parte
  1. Publicar e usar no meio da etapa é leitura deste cartão, com a palavra do fundador ao aprová-lo.

  | Parte | Grupos | Passos do roteiro |
  | --- | --- | --- |
  | 0 | G0a, G0b, G0c | 1 |
  | A etapa do conector | GC1, GC2, GC3 | 2 a 5, depois de cada versão que troca um conector |
  | 1 | G1 a G5 | 6 a 14 |
- **Um pull request por conector** (C do conector). A versão que publica o GC1 tem a pasta nova do
  Sankhya inteira, e a do GC2, a do Mercado Livre. Nenhuma versão publica só a remoção: entre duas
  versões, o Assistente lê os dois sistemas ao vivo sem interrupção.
- **Só o G0c e o G3 criam ou tiram permissão no banco do Hub** (data D11).
- **O que toca a outra trilha.**
  - A U2, a U14 e a U19 mudam arquivos da trilha Agentes e Apps: `builder/connectors/`,
    `builder/company-tools/`, `builder/conversation/`, `builder/assistant/`, `builder/app-data/`,
    `builder/data-tools/`, `packages/hub-api/src/tools.ts`, `assistant.ts` e
    `apps/web/src/builder/conversation/`. Pela delivery L1, cada uma espera as unidades da outra
    trilha que estejam nesses arquivos.
  - Arquivos da Plataforma ou do contrato compartilhado:
    - `packages/hub-api` (U1, U2, U7, U8, U14, U20);
    - `platform/copy-sql.ts`, `copy-reader.ts`, `company-postgres.ts`, `aws.ts`, `config-aws.ts` e
      `test-aws.ts` (U1, U8, U10, U14);
    - `builder/mastra/` e `builder/conversation/storage.ts`, a poda (U8);
    - `hub/apps/` (U14), `hub/lake/` (U7, U8) e `hub/notifications/` (U15).
  - Os pull requests do G0a, do G0b, do G0c, do GC3, do G3 e do G4 avisam a outra trilha (delivery
    L27).
- **A QA** ([testing T25](../guides/testing.md)) roda no Hub local com o servidor de respostas
  gravadas depois do G0b, do GC2, do GC3, do G4 e do G5.

**Orçamento de código alterado.** São linhas mudadas, as tiradas também, sem testes nem gerados. O
`lake.template.json` e a foto do catálogo são gerados; os dublês e as gravações não contam; o Python
conta. É estimativa do cartão, sobre o `wc -l` das pastas (INV) e as medidas dos estudos, entre
parênteses.

| Parte | Unidade | Linhas |
| --- | --- | --- |
| 0 | U1 | ~3.400, quase todas tiradas: `hub/copies/` cria e roda em ~1.600, `builder/copy-clock/` 300, `platform/copy-sql.ts` ~250, `hub/connectors/copy-port.ts` e as provas das propostas ~600, os modelos e a leitura por consulta do kit ~400, as telas ~550 |
| 0 | U2 | ~500, quase todas tiradas |
| 0 | U14 | ~4.000, quase todas tiradas: o que lê em `hub/copies/` ~1.400, `copy-reader.ts` e o resto de `copy-sql.ts` ~500, os contratos ~650, as telas de Dados das cópias ~1.200, as ferramentas e os textos ~250 (`EST/conector-estilo-novo-estudo:367-374`) |
| 0 | U15 | ~150, mais a migração gerada |
| A etapa do conector | U16 | ~400: a sessão, 87 na sonda; a classe; o número exato; a skill gerada, ~100 |
| A etapa do conector | U17 | ~1.700, sobre as 1.698 da pasta de hoje sem a cópia, os dublês e os testes |
| A etapa do conector | U18 | ~990, sobre as 990 de hoje |
| A etapa do conector | U19 | ~150 |
| 1 | U3 | ~780: o dicionário, sobre a sonda de 286; as 49 declarações, ~260; os três modos e a janela por mês, ~120; o cadastro e a data, ~30 |
| 1 | U4 | ~520 (344, mais os modos e a data, ~40) |
| 1 | U5 | ~610 (o gravador, 165; a data na configuração, ~10) |
| 1 | U6 | ~490 |
| 1 | U7 | ~265 |
| 1 | U8 | ~1.400 (os fechadores, de 172 a 312; as rotas de Dados; o relógio ancorado, a fila de partidas e a poda, ~200; a data e a releitura, ~50) |
| 1 | U20 | ~400: as rotas, ~200, sobre a forma de `sign-ins.ts:145-193`; a página pública, ~200 |
| 1 | U9 | ~1.700: a janela ~640 (`EST/ao-vivo-estudo:185`), a seção de mudar ~460 (a data, o aviso e o botão com o diálogo), Dados refeita ~520 |
| 1 | U10 | ~565 (o atualizar, 144; a janela por mês; a releitura da data, ~5) |

O total da etapa é de cerca de 17.840 linhas, das quais umas 8.000 são tiradas na parte 0. Por
parte: a parte 0, ~8.050; a etapa do conector, ~3.240; a parte 1, ~6.550. Por pull request da parte
1: o G1, ~1.300; o G2, ~1.100; o G3, ~265; o G4, ~3.750; o G5, ~565. Nenhum pull request de
construção passa de ~4.000 (delivery L2). A razão de não cortar em cartões está no T.9.

Três gatilhos dizem quando o plano muda:

- Se o G4 medir acima de 4.000, a U9 vira um pull request à parte, depois do da U8 e da U20.
- Se o GC1 medir acima de 4.000, a U16 vira um pull request à parte, antes da U17; a pasta velha do
  Sankhya continua saindo no mesmo commit que traz a nova.
- Se o G0b medir acima de 4.000, ele se divide em dois pull requests, o do servidor e o das telas,
  nessa ordem.

## Os critérios de aceite

Os testes entram pela porta pública de cada peça ([testing T5](../guides/testing.md)): a rota do
Hub; o índice do kit (`@conexus/connectors`) e a sua conformidade; a ferramenta do agente pela
conversa; a linha de comando do adaptador; a entrada da tarefa pelo `meltano run`; o `cdk synth`
com as asserções da receita. "Lab" é a conta de laboratório, com a palavra do fundador; o resultado
vai no pull request, e não no CI (T14). Um teste marcado "(novo)" não existe no `main` e nasce com a
unidade. "Os testes de hoje sem mudar o que esperam" quer dizer: os
casos ficam, e só muda o caminho de importação de um teste que lia um arquivo de dentro da pasta
velha, que passa ao índice do kit.

### Parte 0, o legado sai do banco da empresa

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Nenhuma rota cria, aceita, roda, pausa, retoma, muda o intervalo ou apaga uma cópia no banco da empresa: `POST /copies`, a recusa de proposta, `pause`, `resume`, `interval`, `run` e `DELETE` de uma cópia respondem 404 de rota; `listCopyModels` não existe no contrato | `apps/server/src/hub/copies/routes.test.ts`, "o que cria cópia saiu", contra o servidor de teste | must |
| 2 | U1 | O kit não tem modelo de cópia, nem `PAGE_ROWS`, nem `PageInput`, nem a leitura `lerPagina`; a conformidade recusa um conector que ainda declare `models`. `CopyDefinition`, nas versões 1 e 2, fica só como a forma da linha guardada que os leitores leem até o G0b, sem quem a escreva | `packages/connectors/src/kernel/conformance.test.ts` (novo), "nenhum modelo"; `npm run typecheck` | must |
| 3 | U1 | O Hub não registra nenhum relógio de cópia: depois da subida e depois de remover uma empresa, `mastra.schedules` não tem linha do fluxo `conexus-copy-run`, e a remoção não chama o relógio das cópias | `apps/server/src/builder/mastra/mastra.test.ts`, "nenhum relógio de cópia", que lê `mastra.schedules` depois da subida e da remoção; hoje a subida de uma empresa com cópia tem a linha | must |
| 4 | U1 | A página **Dados** não mostra **Ligar uma cópia**, as propostas, **Pausar**, **Retomar**, **Intervalo**, **Rodar agora** nem **Apagar** de uma cópia do banco; o diálogo de **Desligar** não lista cópias | `apps/web/src/hub/copies/copy-list.test.tsx` e `copy-detail.test.tsx`, "sem o motor de hoje"; `apps/web/src/hub/connectors/unlink-dialog.test.tsx`, "sem a lista de cópias" | must |
| 5 | U1 | Entre o G0a e o G0b, o que lê continua: com uma cópia do banco plantada pelo `plantCopy` de `hub/data/test-world.ts`, Descrever, Ler e Consultar a leem, a Amostra a mostra, e a liberação a um Projeto e as marcas de quem lê funcionam como hoje | os testes de hoje de `hub/data/`, `hub/apps/copy-data.test.ts` e de `hub/copies/` (`catalog-view`, `readers`, `sample`, `grants`), com a cópia plantada em lugar de `on.copies.enable`, sem mudar o que esperam | must |
| 6 | U2 | O Builder não tem a ferramenta `copy_propose`: ela não está na lista de ferramentas de nenhum agente, a conformidade das ferramentas passa sem ela, e o texto de contexto do Builder num Projeto não manda mais propor cópia nem fala de proposta | `apps/server/src/builder/company-tools/tool-sets.test.ts` e `conformance.test.ts`, "sem copy_propose"; `apps/server/src/builder/app-data/context.test.ts`, "sem proposta" | must |
| 7 | U2, U14 | Uma conversa antiga que tem uma chamada de `copy_propose` ou de `copy_runs` abre e mostra a linha da ferramenta com o nome dela, como uma ferramenta que não existe mais, sem o cartão de proposta e sem erro | `apps/web/src/builder/conversation/tool-row.test.tsx`, "a ferramenta que saiu", na forma do caso "desconhecida no nome legível" de hoje | must |
| 8 | U1 | A versão do G0a só é publicada com a consulta do reajuste em zero cópias, zero tabelas que ficaram e zero relógios do fluxo `conexus-copy-run`, em todas as empresas; o resultado vai no pull request do G0a | a consulta da seção do reajuste, pelo firstmate, com a palavra do fundador | must |
| 70 | U14 | Nenhuma rota lê uma cópia do banco da empresa: `listCopies`, `listCopyRuns`, `sampleCopy`, `listCopyReaders`, `setRoleCopies` e as de liberar e tirar uma cópia de um Projeto respondem 404 de rota, e nenhuma delas está no contrato | `apps/server/src/hub/copies/routes.test.ts`, "o que lê saiu", contra o servidor de teste | must |
| 71 | U14 | O contrato de acesso não tem fonte de cópia: Descrever devolve as ligações e as leituras ao vivo, sem tabela copiada; Consultar uma tabela que não está no catálogo responde a recusa de hoje para uma tabela fora do catálogo; a conformidade do contrato passa sem a fonte das cópias | `packages/hub-api/src/company-data-conformance.ts`, pelo mundo de teste de `hub/data/test-world.ts` sem cópia; `apps/server/src/hub/data/query.test.ts`, "sem cópia" | must |
| 72 | U14 | Nenhum agente tem `copy_runs`; o texto de `app_data_read` e o contexto do Builder num Projeto não falam de `sync` nem de cópia liberada; com uma ligação do Sankhya e nenhuma cópia, o Assistente responde uma pergunta de vendas pela leitura ao vivo, com a origem ao vivo | `apps/server/src/builder/company-tools/tool-sets.test.ts`, "sem copy_runs"; `builder/app-data/context.test.ts`, "sem cópia"; `builder/assistant/assistant.test.ts`, "sem cópia, ao vivo" | must |
| 73 | U14 | A página **Dados** mostra a árvore dos sistemas e a camada dos apps, sem a camada das cópias, sem a lista e sem a página de uma cópia; o endereço antigo de uma cópia (`/data/<id>`) leva à página Dados, e a página de uma tabela do lago mora em `/data/lake/<id>` (U9); numa empresa sem tabela, o vazio diz a frase da matriz | `apps/web/src/hub/copies/data-page.test.tsx`, "sem cópias"; `apps/web/src/routes/`, o teste do endereço antigo | must |
| 74 | U14 | Um Projeto não lista nem libera cópia: a seção de cópias de **Integrações** do Projeto saiu, o banco do app não recebe permissão de leitura de um `sync`, e as tabelas que o app guarda continuam lidas como hoje | `apps/server/src/hub/apps/app-data.test.ts`, "sem liberação de cópia"; `apps/web/src/hub/projects/project-integrations.test.tsx`, "sem cópias" | must |
| 75 | U14 | Nenhum código do Hub abre o banco de uma empresa com o login `conexus_sync`, `conexus_read` ou `conexus_role_*`: a porta do banco da empresa não tem mais `ensureSync` nem `syncAddress`, a de leitura não tem `readerAddress`, e `platform/copy-sql.ts` e `copy-reader.ts` não existem | `npm run typecheck`; `apps/server/src/platform/company-postgres.test.ts`, "a porta sem o sync" | must |
| 76 | U15 | A migração tira as nove tabelas de `copies` de hoje, o esquema `copies` e `notifications.copy_follower` e `copy_notice`, com as permissões deles; a foto do catálogo muda só nisso; a arquitetura ganha a linha nas exceções do roll-back, com a versão do G0b | `apps/server/src/platform/catalog.test.ts`; a conferência de migrações (`npm run migrations`) | must |
| 77 | U15 | Com a palavra do fundador e a versão do G0b no ar, o passo 4 do reajuste deixa cada empresa sem o esquema `sync` e sem os logins `conexus_sync`, `conexus_read` e `conexus_role_*`, e a consulta só de leitura do passo 4 mostra zero; o resultado vai no pull request do G0c | a consulta da seção do reajuste, pelo firstmate | must |

### A etapa do conector

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 12 | U16 | Numa leitura que dura mais que o token, a sessão do kit renova antes do fim e desloga a velha, e no fim não sobra sessão aberta; uma leitura recusada por sessão vencida renova e repete uma vez, e a segunda recusa termina em `NEEDS_REAUTH` | `packages/connectors/src/kernel/session.test.ts`, com o dublê do Sankhya e o relógio de teste | must |
| 13 | U16 | O Hub lê, escreve e confere uma ligação pela sessão do kit; o "renova e repete uma vez" sai de `hub/connectors/` | `apps/server/src/hub/connectors/connections-refresh.test.ts`, `connections-sessions.test.ts` e `write-lost.test.ts`, os casos de hoje, verdes sem mudar o que esperam | must |
| 14 | U16 | Todo login do kit declara a classe da credencial: o Sankhya, compartilhável; o Mercado Livre e o HubSpot, exclusiva; a conformidade recusa um conector sem a classe | `packages/connectors/src/kernel/conformance.test.ts` (novo), "a classe da credencial" | must |
| 15 | U16 | O número `12345678901234567890` num corpo JSON chega ao Hub como `"12345678901234567890"` quando o conector declara números exatos; `wire.ts` não chama mais `JSON.parse` sem o leitor do kit. O dublê do Sankhya guarda `VLRNOTA` como texto (hoje `REAL`, `fake-sales.ts:131`) e ganha uma nota de `1234567890123.123456` | `packages/connectors/src/kernel/exact-json.test.ts`; `apps/server/src/hub/connectors/wire.test.ts` (novo), "o número grande"; `sankhya/fake.test.ts`, "o valor de 19 dígitos" | must |
| 78 | U16, U17, U18 | A skill de cada conector tem duas partes. A gerada sai da definição: os assuntos, com o rótulo, e uma frase que diz se a ligação escreve, com a aprovação de uma pessoa, ou só lê. A escrita guarda o saber que a definição não tem. Nenhuma das duas nomeia uma ferramenta (`<conector>_<operação>`) nem diz quais existem. A do Sankhya diz que ele escreve; a frase "There is no operation that writes" não existe | `packages/connectors/src/kernel/skill.test.ts` (novo), "a parte gerada", pelo índice do kit; `sankhya/sankhya.test.ts` e `mercado-livre/mercado-livre.test.ts`, "a skill" | must |
| 79 | U17 | A pasta nova do Sankhya, lida pelo índice do kit, declara o mesmo conector de hoje: o id `sankhya`, a origem, os campos do login, as duas portas (`consultar`, `carregar`), as 27 leituras, a escrita `lancarPedido` com as três declarações da 0062 (incerto, marca, id), os assuntos, as recusas gravadas e a leitura de **Testar**, com os mesmos ids e a resposta `{ linhas, temMais }`. O commit apaga cada arquivo da pasta velha que não é dublê, gravação nem teste. A conformidade e os testes de hoje do Sankhya passam sem mudar o que esperam | `packages/connectors/src/sankhya/*.test.ts` de hoje, pelo índice do kit; `kernel/conformance.test.ts` (novo), com o dublê; a lista dos arquivos apagados e criados do commit (`git show --stat`), no pull request | must |
| 80 | U17 | Pelo Hub, nada muda para quem usa o Sankhya: as ferramentas tipadas `sankhya_*` têm os mesmos nomes e entradas, a busca de ferramentas as acha, um app e uma ferramenta salva leem pela mesma operação, o papel `connector_sankhya` admite as mesmas, e a escrita passa pelo cartão como hoje | os testes de hoje de `apps/server/src/builder/connectors/` (`typed-reads`), `builder/company-tools/` (`search`), `hub/connectors/` (`app-calls`, `tool-door`, `write`, `approval`) e os de hoje dos papéis em `hub/identity/`, sem mudar o que esperam | must |
| 81 | U17 | As buscas do Sankhya escapam `[` e `]` no `LIKE` do SQL Server (#929), e o 20 da página padrão tem um dono só, a busca (#930) | `packages/connectors/src/sankhya/search.test.ts`, "o colchete na busca" e "a página padrão" | must |
| 82 | U18 | A pasta nova do Mercado Livre, lida pelo índice do kit, declara o mesmo conector de hoje: o id `mercado-livre`, o login por autorização com PKCE, a renovação de uso único, a conta informada pelo sistema, a classe exclusiva, as 27 leituras com os mesmos ids e as listas que paginam (`pedidos`, `anuncios`, `perguntas`, `reclamacoes`, `periodosDeFaturamento`). O commit apaga cada arquivo da pasta velha que não é dublê, gravação, leitura da documentação nem teste. Os testes de hoje do Mercado Livre e do Hub passam sem mudar o que esperam | `packages/connectors/src/mercado-livre/*.test.ts` de hoje, pelo índice do kit; `apps/server/src/hub/connectors/sign-ins.test.ts` e os de reconectar, sem mudar o que esperam; a lista do commit (`git show --stat`), no pull request | must |
| 83 | U19 | `connector_note_save` pede o sim antes de gravar, suspendendo a chamada como o `ask_user`: a conversa mostra o cartão com o conceito, o mapeamento e a consulta da prova, e nada é provado nem gravado no Caderno antes do sim; no Assistente e no Builder, que seguem sem pedir aprovação a nenhuma outra ferramenta (0053) | `apps/server/src/builder/assistant/note-save.test.ts`, "pede o sim"; `apps/server/src/builder/conversation/conversation-connectors.test.ts`, "o caderno"; `apps/server/src/builder/connectors/connector-tools-scope.test.ts`, "o caderno pede o sim" | must |
| 84 | U19 | O sim de um membro que gerencia ligações grava a anotação com o nome de quem aprovou; o de quem não gerencia é recusado com `NOT_GRANTED`, e nada é gravado; a recusa no cartão não grava nada; a página da ligação mostra quem aprovou, e uma anotação de antes desta etapa mostra "Gravada sem aprovação". O cartão mostra a quem não gerencia ligações a frase da matriz, sem os botões, e a ligação que saiu antes do sim dá a frase dela | `note-save.test.ts`, "quem aprova" e "a recusa"; `apps/web/src/hub/connectors/notes.test.tsx`, "quem aprovou"; `apps/web/src/builder/conversation/note-card.test.tsx` (novo), "o Caderno" | must |

### Parte 1, a carga chega e a mudança aparece

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 9 | U3 | O Sankhya declara as tabelas que as sondas fecharam (as 42 de `SK` seção 1 e as candidatas que a P1 achou), cada uma com o nome sugerido, o rótulo, a descrição, o grupo, a origem, a chave e o modo. `notas`: `sankhya_notas`, "Notas e pedidos", o grupo `vendas`, a origem `TGFCAB`, a chave `NUNOTA`, só o que mudou por `DTALTER`. `parceiros`: só o que mudou por `DTALTER`, cadastro (a data inicial não a limita); o mesmo para `produtos`, `vendedores` e `precos_tabelas`. A data inicial compara com a coluna pela qual cada tabela segue: `DTALTER` em `notas`, `notas_itens` e `financeiro`, `DHALTER` em `notas_impostos`, a coluna da janela nas de janela. `efd_st_media_diaria`: janela por mês de `DTREF`. `notas_nfe`: inteira, sem histórico, a coluna do XML descoberta como texto e o significado dela declarado como metadado (`NFE_XML`). O gancho `descobrirTabelas` devolve, do dicionário do dublê, a descrição da tabela e cada coluna com nome, tipo e descrição; uma tabela que o dicionário não tem volta ausente, nunca inventada | `packages/connectors/src/sankhya/copy-tables.test.ts`, com o dublê | must |
| 10 | U3 | A conformidade recusa: dois nomes sugeridos iguais num conector; um nome fora do padrão (português, minúsculas, até 40); a mesma origem duas vezes com uma coluna em comum que não seja da chave; uma chave, coluna de alteração ou coluna de janela fora das colunas; uma janela sem coluna de data; uma tabela de colunas descobertas num conector sem gancho; uma tabela de operação sem colunas; um grupo que não é assunto do conector; uma coluna declarada que começa por `_`, que é do motor (T.41) | `packages/connectors/src/kernel/conformance.test.ts` (novo), "a declaração por tabela" | must |
| 11 | U3 | A leitura de uma tabela pede no máximo as linhas da página do conector; quando a resposta passa dos bytes da página, a próxima página pede menos linhas; uma tabela de 450 colunas do dublê lê inteira, sem teto de colunas | `packages/connectors/src/sankhya/copy-tables.test.ts`, "a página em bytes" | must |
| 16 | U3 | Entre duas leituras, o dublê do Sankhya altera, cria e apaga uma nota e muda o XML de uma NF-e, e o do HubSpot altera e remove um negócio, por rotas que só o dublê tem; o modo real não as tem | `packages/connectors/src/sankhya/fake.test.ts` e `hubspot/fake.test.ts` (novo), "o registro muda entre duas leituras" | must |
| 86 | U3 | `readTablePage` lê uma página de qualquer tabela declarada, pelas duas origens: a da tabela, pela leitura do conector (o Sankhya), e a da operação, pela paginação `list` da operação (o negócio do HubSpot); a última página diz que acabou, e uma recusa da fonte volta como um dos quatro códigos de `TABLE_SOURCE_FAILURES`, nunca o corpo | `packages/connectors/src/kernel/tables.test.ts` (novo), contra os dublês do Sankhya e do HubSpot | must |
| 85 | U3, U8 | A parte gerada da skill de uma ligação lista as tabelas que ela copia com o nome que a empresa deu (`sankhya_vendas`, se a pessoa trocou), o rótulo, a descrição e a origem; numa tabela que a data limita, "desde <data>"; uma tabela não marcada não aparece; a frase diz que a tabela traz só aquela ligação | `packages/connectors/src/kernel/skill.test.ts` (novo), "as tabelas com o nome da empresa"; `apps/server/src/hub/copies/lake-routes.test.ts`, "a skill com os nomes reais" | must |
| 88 | U3, U4, U8 | Uma descoberta só: a lista que a janela mostra (`GET .../lake-tables`) e o catálogo do `tap --discover` saem da mesma função do kit, `discoverTables`, com as mesmas tabelas, origens, chaves, modos e colunas, no dublê do Sankhya e no do HubSpot | Uma lista esperada em comum, em `packages/connectors/src/kernel/tables-fixture.ts` (novo): `lake-routes.test.ts`, "a lista da ligação é a descoberta", pela rota; `apps/extraction/tap/src/tap.test.ts`, "o catálogo é a descoberta", pela linha de comando | must |
| 17 | U4 | `tap --about` e `tap --discover` respondem para todo conector que declara uma tabela. No `--discover`, cada entrada tem `stream` com o nome no lago, `table_name` com a origem (`TGFCAB`; numa tabela por operação, o id da operação, `negocios`), nos metadados o modo, a chave, o histórico e o rótulo, e `selected: false`; as colunas vêm com o nome da fonte em minúsculas e a descrição, as do Sankhya pelo dicionário, as do HubSpot pela declaração. A bateria padrão do singer-sdk passa sobre a saída crua dos dois | `apps/extraction/tap/src/tap.test.ts`; `apps/extraction/tests/test_tap_battery.py` | must |
| 18 | U4 | Uma rodada com duas tabelas escolhidas no catálogo lê as duas, uma depois da outra, e só elas, cada uma com o nome que o catálogo dá; cada uma emite SCHEMA, RECORD com a versão da passada, STATE a cada página e ACTIVATE_VERSION no fim; a primeira passada lê tudo, a linha sem `DTALTER` incluída (#940); nenhum campo da credencial aparece na saída | `apps/extraction/tap/src/tap.test.ts`, "duas tabelas numa rodada", "a linha sem data" e "nada do segredo na saída" | must |
| 89 | U3, U4 | A primeira passada de uma tabela de janela lê mês a mês os meses que a contagem por mês acha, as datas fora do calendário incluídas; com a data inicial, só os meses a partir do mês dela, e o mês fora do calendário anterior a ela fica fora. A passada seguinte relê só o mês corrente e o anterior, nunca um mês anterior ao da data. Uma tabela inteira lê tudo a cada rodada, com ou sem data | `apps/extraction/tap/src/tap.test.ts`, "a janela por mês", "a janela desde a data" e "a inteira"; `sankhya/copy-tables.test.ts`, "os meses da contagem" | must |
| 19 | U4 | Um login recusado faz o adaptador sair com código diferente de zero e escrever no arquivo de resultado o código da fonte (`COPY_SOURCE_NEEDS_REAUTH`, `COPY_SOURCE_REFUSED`, `COPY_SOURCE_UNREACHABLE` ou `COPY_SOURCE_UNREADABLE`) e a tabela em que parou, nunca o corpo | `apps/extraction/tap/src/tap.test.ts`, "a fonte recusa" | must |
| 20 | U4 | A regra de máquina da mudança de método recusa um import de `packages/connectors/src/sankhya/` e um nome de conector plantados no adaptador | o check da regra, em `npm run deps`, com o caso plantado no teste da regra | must |
| 21 | U5 | Pelo `meltano run`, o gravador acrescenta numa tabela Iceberg local as linhas do dublê do Sankhya, com `_sdc_sequence` e `_sdc_table_version`, o dinheiro em `decimal(38,9)`, e a soma bate com a da fonte; `1234567890123.123456` chega igual; as 450 colunas do dublê chegam | `apps/extraction/tests/test_target.py`, "a passada inteira chega à bruta" e "a tabela larga" | must |
| 90 | U5 | Ao criar uma tabela no lago, o gravador grava nas propriedades da tabela Iceberg a origem e o rótulo (`conexus.origem` `TGFCAB`, `conexus.rotulo` "Notas e pedidos"), nas duas áreas; um XML de 1 MiB do dublê chega como texto, igual | `apps/extraction/tests/test_target.py`, "a origem e o rótulo no catálogo" e "o XML inteiro" | must |
| 22 | U5 | Um valor que não cabe em `decimal(38,9)` termina a rodada com `COPY_LAKE_WRITE_FAILED`, sem gravar o lote | `apps/extraction/tests/test_target.py`, "o valor que não cabe" | must |
| 23 | U5 | A entrada lê o parâmetro da rodada, grava o segredo num arquivo `0600` e só o caminho vai à configuração do Meltano; nenhuma variável de ambiente do leitor e do gravador, nem linha do registro da tarefa, tem um campo do segredo | `apps/extraction/tests/test_entry.py`, "o segredo fica no arquivo" | must |
| 24 | U5 | A entrada manda à fila um resultado só por rodada, na forma `CopyTaskResult`, com as contagens de cada tabela e o código; nunca o conteúdo de uma linha. Uma falha do leitor dá o código dele; do gravador, `COPY_LAKE_WRITE_FAILED` | `apps/extraction/tests/test_entry.py`, "um resultado por rodada", contra a gravação da fila | must |
| 116 | U5 | O resultado leva `machine`: o tamanho, de `/task`, e os picos de CPU e de memória, das leituras de `/task/stats` a cada 5 s, com a memória sem o cache de arquivos e a CPU pelo tempo gasto; sem o endpoint, ou com ele falhando, `machine` é nulo e a rodada termina igual | `apps/extraction/tests/test_machine.py`, "o pico da rodada" e "medir não derruba a rodada" | must |
| 25 | U5 | Com o parâmetro da rodada apagado no meio, a tarefa para no lote seguinte, sem gravar mais e sem mandar resultado | `apps/extraction/tests/test_entry.py`, "a rodada fechada para a tarefa" | must |
| 26 | U5, U6 | A imagem (Node 24, Python 3.13, Meltano, o adaptador e o gravador, x86) responde a `tap --about` e a `meltano --version` antes de ser publicada; no Fargate (L.1), contra o dublê do Sankhya, as linhas chegam à bruta do `S3 Tables` e a soma bate, com 1 vCPU e com 2 vCPU | `scripts/aws-platform.test.ts`, "a imagem responde antes de sair"; Lab, no pull request do G2 | must |
| 27 | U5 | Na AWS (L.3), o fim normal, a falha do leitor, a falha do gravador e um `StopTask` chegam à fila com o motivo certo nos quatro | Lab, no pull request do G2 | must |
| 28 | U5 | Na AWS (L.5), a soma de `decimal(38,9)` lida pelo Athena bate com a da fonte, e um texto de 1 MiB lido pelo Athena chega inteiro | Lab, no pull request do G2 | must |
| 29 | U6 | A plataforma tem a fila e a fila de mortos, a regra que manda à fila a parada das tarefas do cluster da cópia, o cluster, a definição de tarefa única (1 vCPU e 2 GB, x86, sem segredo no ambiente) e a rede de sub-redes públicas sem NAT; o depósito de imagens não é dela, é da preparação (34) | `infra/aws/test/copy.test.ts`, "a plataforma da cópia" | must |
| 30 | U6 | A receita do lago cria o papel `conexus-<lago>-escritor`, com o teto, confiando só nas tarefas do ECS da conta, com as concessões de escrita nas duas áreas do lago daquela empresa, a leitura dos parâmetros da empresa, a leitura e a escrita do prefixo dela no depósito do estado e o grupo de consultas do Athena | `infra/aws/test/lake.test.ts`, "o papel que escreve" | must |
| 31 | U6 | Na AWS (L.6), o papel que escreve de A grava nas duas áreas de A e é recusado nas de B, e não lê o parâmetro de uma rodada de B | Lab, no pull request do G2 | must |
| 32 | U6 | O papel do Hub pode iniciar e parar só a tarefa da cópia, entregar só papéis `conexus-*-escritor` às tarefas do ECS, gravar e apagar só parâmetros `/conexus/copia/*`, ler e apagar mensagens só da fila da cópia, e listar e apagar tabelas só de depósitos `conexus-*`; nada além | `infra/aws/test/platform.test.ts`, "os poderes do Hub" | must |
| 33 | U6 | Na AWS (L.2), uma tarefa faz o login e lê uma página do Sankhya do fundador. Se o gateway recusar, a etapa para e volta ao fundador | Lab, no pull request do G2, com a imagem e a plataforma da U6; o L.2 à mão já rodou antes da parte 1 | must |
| 34 | U6 | A preparação cria o depósito de imagens `conexus-copia` (etiquetas imutáveis, retido) e deixa a Release só publicar nele; deixa a Release criar as peças do 29 e nada além do que já deixava; a Release monta a imagem, publica-a e só então publica a plataforma, com a tarefa apontando para `conexus-copia@<digest>` | `infra/aws/test/preparation.test.ts`, "a segunda preparação" e "o depósito das imagens da cópia nasce na preparação, e a Release só publica nele"; `scripts/aws-platform.test.ts`, "a imagem da cópia antes da plataforma" | must |
| 35 | U7 | As quatro tabelas da cópia existem com as conferências do banco: uma cópia por ligação, com o intervalo em `LakeInterval` (`MANUAL` incluído); a data inicial nula ou uma data; uma tabela marcada por fonte e ligação, e um nome por empresa, qualquer que seja a caixa; uma rodada aberta por ligação; o código do sistema com teto (#1135) | `apps/server/src/hub/copies/lake-tables.test.ts`; `catalog.test.ts` | must |
| 36 | U7 | O login da empresa lê, da linha do lago, só a da própria empresa e só as colunas nomeadas; gravar, mudar ou apagar é recusado; a foto do catálogo muda só nisso e nas tabelas novas | `apps/server/src/hub/lake/tables.test.ts`, "a empresa lê a sua linha"; `catalog.test.ts` | must |
| 91 | U7 | `connectors.connection_link` existe com as conferências da spec 02 (`C5`): o resumo do segredo, nunca o segredo; os campos pedidos; os selados com a chave; o prazo; a política da empresa | `apps/server/src/hub/connectors/tables.test.ts`, "o link"; `catalog.test.ts` | must |
| 37 | U8 | `GET` das tabelas no lago de uma ligação do Sankhya devolve as tabelas declaradas, desmarcadas, cada uma com a origem, o rótulo, a descrição, o grupo, o modo, se a data inicial a limita, o número de colunas do dicionário e o nome sugerido: o do kit (`sankhya_notas`) ou, se outra ligação da empresa já usa esse nome, `sankhya_<ligação>_notas`, cortado para caber. Numa ligação de credencial exclusiva ou de um conector sem tabela declarada, o campo `lake` é `UNAVAILABLE`, com o motivo. Para quem não lê a ligação, 404 (S10). Com o dicionário fora do ar, as tabelas vêm com o rótulo e a descrição do kit, sem o número de colunas. A resposta traz a data inicial da cópia, nula sem cópia ou sem data | `apps/server/src/hub/copies/lake-routes.test.ts`, "a lista da ligação" e "a segunda ligação" | must |
| 38 | U8 | Gravar a cópia da ligação (`PUT .../lake-copy`) com as tabelas, o nome de cada uma no lago, o intervalo e a data inicial (nula, todo o histórico) cria a cópia, uma linha por tabela com o nome dado e a origem, o relógio (menos em `MANUAL`) e dispara a primeira rodada, inteira; gravar de novo o mesmo conjunto não muda nada. Recusas, sem gravar nada: empresa sem lago pronto, 409 `COPY_LAKE_NOT_READY`; tabela que o kit não declara, 422 `COPY_TABLE_NOT_DECLARED`; nome fora do padrão, 422 `COPY_NAME_INVALID`; nome que outra tabela da empresa já tem, em qualquer caixa, 409 `COPY_NAME_TAKEN`; outro nome para uma tabela já marcada, 409 `COPY_NAME_FIXED`; data inicial depois de hoje, no fuso de São Paulo, 422 `COPY_START_DATE_INVALID`; quem não gerencia cópias, 403 | `lake-routes.test.ts`, "gravar a cópia" e "o nome" | must |
| 96 | U8 | Na cópia que existe, gravar com uma tabela a mais cria a linha dela com o nome dado e dispara na hora uma rodada que pede `whole` só para ela; as outras ficam como estavam; mudar o intervalo não muda o horário de partida | `lake-routes.test.ts`, "marcar depois" | must |
| 39 | U8 | Todo disparo, do relógio ou de **Rodar agora** (`POST .../lake-copy/run`), passa por `iniciarRodada`: abre uma rodada da ligação, lê o dicionário para as colunas da tela, grava o parâmetro e inicia a tarefa com o papel da empresa e o `clientToken` de rodada e tentativa, levando as tabelas marcadas com o nome de cada uma e o seu `whole`. A tarefa pede 2 vCPU e 4 GB quando a rodada leva uma tabela na primeira carga, e 1 vCPU e 2 GB nas outras. Com rodada aberta, o disparo responde "já está rodando" e não grava nada | `apps/server/src/hub/copies/lake-run.test.ts`, "o disparo" e "o tamanho da máquina", pela rota e pelo passo do relógio, contra as gravações da AWS | must |
| 92 | U8 | O relógio conta da hora em que a cópia da ligação nasceu, no fuso de São Paulo: uma cópia de 10:07 roda a 15 min em `7,22,37,52 * * * *` e a 24 h em `7 10 * * *`; uma de 11:07 roda a 2 h em `7 1-23/2 * * *`. `MANUAL` não deixa linha do relógio; **Rodar agora** funciona nela; voltar a um intervalo recria a linha com o mesmo horário | `apps/server/src/builder/copy-clock/clock.test.ts` (novo), pela rota de gravar e por `mastra.schedules` | must |
| 93 | U8 | O passo do relógio só chama `iniciarRodada`; nenhuma cópia roda dentro do workflow, e não há recusa `NO_SCHEDULE` | `clock.test.ts`, "o relógio só diz quando", que confere a chamada e o fim do passo antes de a tarefa terminar | must |
| 94 | U8 | A poda diária apaga do banco do Hub os disparos do relógio (a política `triggers`) e as execuções do workflow da cópia, mais velhos que a idade da 0068; a execução de uma automação do Assistente, da mesma idade, fica | `apps/server/src/builder/conversation/storage.test.ts`, "a poda do relógio", com as linhas plantadas das duas | must |
| 95 | U8 | Uma partida por vez: vinte disparos de vinte ligações no mesmo segundo abrem as vinte rodadas, e o dublê do parâmetro nunca recebe mais de 3 gravações por segundo | `lake-run.test.ts`, "uma partida por vez", com o relógio de teste | must |
| 40 | U8 | **Rodar agora** duas vezes ao mesmo tempo inicia uma tarefa só | `lake-run.test.ts`, "dois disparos juntos" | must |
| 41 | U8 | O resultado da tarefa fecha a rodada uma vez, com o resultado, as contagens de cada tabela, `rows` e o código; a parada do ECS que chega depois não muda nada; quem chega primeiro fecha; ficam as 100 rodadas mais novas de cada ligação | `apps/server/src/hub/copies/lake-queue.test.ts`, "o resultado e a parada" e "as 100 mais novas" | must |
| 117 | U8 | O resultado com `machine` grava em `lake_run` o tamanho, os picos e as amostras; sem `machine`, nada disso; a parada do ECS sem resultado grava o motivo dela na rodada | `lake-queue.test.ts`, "a máquina da rodada" | must |
| 118 | U8 | Na AWS (L.1), uma rodada grava o corpo de `/task/stats` (testing T26), e o pico de memória fica entre o RSS do target e o pico bruto do cgroup | Lab, no pull request do G4 | should |
| 42 | U8 | Uma parada do ECS sem resultado fecha a rodada como `ERROR` `COPY_TASK_LOST`; uma tarefa parada pelo Hub fecha como `INTERRUPTED` | `lake-queue.test.ts`, "a tarefa que morreu" | must |
| 43 | U8 | No disparo, uma rodada aberta cuja tarefa a AWS diz parada ou não conhece, ou aberta há mais de 48 horas, é fechada antes de abrir a nova | `lake-run.test.ts`, "a varredura" | must |
| 44 | U8 | Toda rodada fechada apaga o parâmetro dela; um parâmetro que a AWS não tem conta como apagado | `lake-queue.test.ts`, "o parâmetro sai no fim" | must |
| 45 | U8 | Um `RunTask` recusado fecha a rodada como `ERROR` `COPY_LAKE_UNAVAILABLE` e apaga o parâmetro; um `RunTask` sem resposta é repetido com o mesmo `clientToken`, e a AWS não inicia duas | `lake-run.test.ts`, "a AWS recusa" e "a AWS não responde" | must |
| 46 | U8 | Dez disparos de dez ligações no mesmo segundo (L.9): as dez rodadas abrem, sem gravação de parâmetro recusada por cota | Lab, no pull request do G4 | should |
| 47 | U8 | Desmarcar uma tabela apaga as tabelas dela nas duas áreas do lago e a linha; desmarcar a última apaga também a cópia da ligação e o relógio; desmarcar com a rodada aberta responde 409 `COPY_RUN_OPEN` e não muda nada. Desligar a ligação não é recusado pelo estado da cópia: para a tarefa aberta, fecha a rodada `INTERRUPTED`, apaga as tabelas do lago e só então a linha da ligação, que leva a cópia em cascata. Com a AWS fora, desmarcar e desligar respondem 503 e nada muda. Na AWS (L.8), nada sobra | `lake-routes.test.ts`, "desmarcar"; Lab | must |
| 48 | U8 | Apagar o lago de uma empresa com tabelas apaga as tabelas, depois as áreas e a pilha, e na mesma passada as cópias do lago da empresa (as linhas de `lake_copy`, que levam as tabelas e as rodadas) e os relógios das ligações dela; na AWS (L.8), nada sobra | `apps/server/src/hub/lake/lake-remove.test.ts`, "o lago com tabela", que lê também `mastra.schedules`; Lab | must |
| 87 | U8 | Remover uma empresa tira os relógios das ligações dela; depois da subida, `mastra.schedules` tem um relógio por cópia de ligação fora de `MANUAL` e nenhum de uma ligação que saiu | `apps/server/src/builder/mastra/mastra.test.ts`, "o relógio da ligação" | must |
| 49 | U8 | `GET .../lake-tables` da empresa devolve cada tabela marcada, agrupada pela ligação, com o rótulo, o nome no lago, a origem, o modo, o estado, as linhas, a hora e o intervalo da ligação (`LakeTableSummary`); as rodadas de uma tabela (`GET .../lake-tables/{id}/runs`) são as da ligação que a levaram, com as contagens dela; quem não lê a ligação não vê a tabela | `apps/server/src/hub/copies/lake-routes.test.ts`, "a lista de Dados" | must |
| 50 | U8 | O registro do Hub mostra `COPY_RUN_ENDED` com as contagens e a ligação; nem ele nem a fila levam o conteúdo de uma linha ou do segredo | `lake-queue.test.ts`, "o que o registro leva" | must |
| 51 | U8 | Sem cópia de ligação, o Hub não chama a AWS; com cópias, o consumidor da fila não abre conexão com o banco enquanto não chega mensagem (data D27) | `lake-queue.test.ts`, "o banco que dorme", na forma de `apps/server/src/builder/automations/scheduler.test.ts` | must |
| 52 | U8 | Uma tabela do lago não cria nada no banco da empresa (nem esquema, nem login, nem tabela) e não entra no catálogo que o Assistente e os Projetos leem | `lake-routes.test.ts`, "a tabela do lago fica fora do banco"; o teste de conformidade do contrato | must |
| 53 | U8 | O servidor de respostas gravadas responde `DescribeStackEvents` e as chamadas do `S3 Tables` (#1265); nenhuma gravação fica sem teste que a leia, e os ids de laboratório saem delas (#1266); o roteiro que grava está no repositório (#1267) | `apps/server/src/platform/recordings.test.ts`, "toda gravação tem leitor"; `aws.test.ts`, pelo servidor de respostas gravadas | must |
| 97 | U20 | O Dono ou um Administrador cria o link de uma ligação nova de acesso por campos: o Hub responde o endereço uma vez e o prazo, 30 minutos depois; num sistema de acesso por autorização, 409 `LINK_NOT_FOR_SIGN_IN`; um Membro recebe 404 `NOT_FOUND` (S10; spec 02, 5.10) | `apps/server/src/hub/connectors/connection-links.test.ts` (novo), "criar o link" | must |
| 98 | U20 | Abrir o link, sem sessão, mostra quem pediu, o sistema e só os campos pedidos, nunca um valor que quem pediu já preencheu; um link gasto, vencido ou de segredo errado responde 404 e registra `CONNECTION_LINK_REFUSED` sem o segredo; o segredo não está em linha do banco do Hub nem do registro (S41) | `connection-links.test.ts`, "abrir o link" e "o segredo fica fora" | must |
| 99 | U20 | Enviar pelo link junta os campos com os já selados, cria a ligação em nome de quem pediu e testa uma vez; se o sistema recusa as chaves, a resposta dele volta por extenso e o link vale até o prazo; se o teste lança, a ligação sai (`CONNECTION_LINK_UNDONE`); dois envios ao mesmo tempo criam uma ligação só; o mesmo endereço além do limite de tentativas recebe 429 `SIGN_IN_ATTEMPTS_EXCEEDED`; quem pediu e perdeu `manageConnections` faz o envio responder 404, sem ligação (spec 02, 5.3, 5.7, 5.11 e 5.12) | `connection-links.test.ts`, "enviar pelo link", "dois envios", "as tentativas" e "quem pediu saiu" | must |
| 54 | U9 | A janela Ligar: em **Integrações**, **Ligar** num sistema de acesso por campos abre a janela com a barra de passos no alto (Acesso, Testando e lendo, O que copiar e Quando copiar: os feitos com visto e o atual com `aria-current="step"`; a 390 px a barra some e o diálogo diz "Passo n de 4 · <nome>"), os campos, **Desde** depois do X-Token (vazio, com "Todo o histórico"; a data depois de hoje mostra "A data não pode ser depois de hoje." e desliga **Continuar**) e **Enviar link**; **Continuar** mostra "Testando a ligação…" e, com o teste aprovado, "Lendo o que o <sistema> oferece"; a chave recusada mostra "O <sistema> recusou as chaves", com a resposta por extenso e os campos; o sistema que não responde mostra a frase da matriz | `apps/web/src/hub/connectors/link-window.test.tsx` (novo), "acesso", "a data inicial", "testando" e "a recusa"; `apps/web/src/ui/step-bar.test.tsx` (novo), o teclado e o leitor de tela | must |
| 100 | U9 | **O que copiar** mostra as tabelas agrupadas por assunto, nada marcado, cada uma com o rótulo, a origem, a descrição, as colunas, o modo sem escolha e o nome sugerido, que se troca; o prefixo vale para todas; o rodapé conta as tabelas marcadas e quantas a data limita ("2 tabelas marcadas, 2 limitadas pela data"); quando a janela abre em **O que copiar** pela seção de uma ligação sem cópia (T.33), **Desde** aparece no alto do passo, vazio, com "Todo o histórico", o mesmo texto de ajuda do Acesso e a recusa da data depois de hoje, que desliga **Continuar**; um nome recusado mostra a frase do código ao lado da tabela. **Quando copiar** vem em 24 h, com os seis intervalos e **Só manual**, e a revisão lista as tabelas com o nome no lago, o intervalo e a data inicial ("Desde <data> nas tabelas que a data limita."). **Ligar e copiar agora** grava a cópia num pedido só e mostra **Ligado**, com "A primeira carga começou." e **Ver em Dados**. Na ligação de credencial exclusiva ou sem tabela, a janela vai do teste ao **Ligado**. Fechar antes de **Ligar e copiar agora** deixa a ligação sem cópia | `link-window.test.tsx`, "o que copiar", "quando copiar", "ligado", "a exclusiva" e "fechar no meio" | must |
| 101 | U9 | A página da ligação do Sankhya tem duas abas, **Visão geral** (os fatos e o Caderno, como hoje; a aba padrão) e **Tabelas**; as ligações dos outros sistemas seguem sem abas. Na aba **Tabelas**, a seção **Tabelas no lago** mostra as tabelas copiadas com o nome fixo, o intervalo, a última rodada e **Rodar agora**; marcar outra mostra o nome sugerido, que se troca; desmarcar, mudar o intervalo (**Só manual** incluído) e mudar **Desde** gravam por **Salvar**; **Ler de novo desde a data** pede a releitura (114). Numa ligação sem cópia, a seção mostra **Escolher o que copiar**, que abre a janela em **O que copiar**, com o **Desde** no alto (T.33). Quem não gerencia cópias vê a lista sem caixas, sem **Salvar** e sem **Rodar agora**; sem lago pronto, a frase da matriz | `apps/web/src/hub/connectors/lake-tables.test.tsx` | must |
| 102 | U9 | A página do link mostra quem pediu, o sistema e os campos pedidos, e **Enviar**; o sistema que recusa mostra a resposta dele; o link vencido ou gasto mostra a frase da matriz; a página cabe a 390 px sem rolagem lateral | `apps/web/src/hub/connectors/link-page.test.tsx` (novo) | must |
| 55 | U9 | Em **Dados**, a tabela aparece pelo rótulo, com o nome no lago e "<sistema> · <origem>" embaixo, e **Em dia** quando a última rodada dela terminou completa. A página dela tem **Visão geral**, **Colunas** (o nome, o tipo e a descrição de cada uma, que a descoberta do dicionário dá), **Rodadas** e **Detalhes**. Em **Rodadas**, cada rodada diz, para aquela tabela, "Completa · inteira" ou "Completa · só o que mudou"; uma rodada com erro diz a frase do código e, quando o sistema respondeu, a resposta dele por extenso; em **Detalhes**, o modo, "Desde <data>" numa tabela que a data limita ou "Todo o histórico", uma linha **Histórico** ("Guarda a versão antiga de cada nota mudada ou apagada" numa tabela com histórico e "Só a versão de hoje" numa sem) e "As linhas ficam no lago da empresa."; não há **Amostra**, **Quem lê** nem Projetos, que chegam nas etapas 3 e 4 | `apps/web/src/hub/copies/lake-list.test.tsx` e `lake-detail.test.tsx` | must |
| 119 | U9 | Em **Rodadas**, cada rodada abre **Máquina** com o tamanho, a duração, "<pico> MB · <n>% de <tamanho>" e "<pico> vCPU · <n>%", e "Da rodada inteira, com as <n> tabelas dela."; a rodada sem medida diz "Sem medida da máquina nesta rodada." | `apps/web/src/hub/copies/lake-detail.test.tsx` | must |
| 56 | U10 | Pelo `meltano run`, a segunda rodada de uma ligação do Sankhya lê, de cada tabela só do que mudou, só o que mudou desde o ponto de parada dela, guardado no depósito do estado com o prefixo da empresa; uma tabela sem coluna de alteração (o negócio do HubSpot) lê tudo | `apps/extraction/tests/test_state.py`, "a segunda rodada" | must |
| 57 | U10 | Na AWS (L.4): uma rodada morta no meio retoma lendo menos que o total; o estado salvo nunca está adiante das linhas gravadas; o papel de A não lê o prefixo de B | Lab, no pull request do G5 | must |
| 58 | U10 | Pela entrada da tarefa (`meltano run` e a atualização depois), depois de uma rodada inteira e uma só do que mudou, a atual tem uma linha por chave, igual à fonte, com o valor de hoje; o `MERGE` roda um caso por instrução e passa com as 450 colunas do dublê | `apps/extraction/tests/test_update.py`, pela entrada, contra as gravações do Athena; Lab (L.7) | must |
| 103 | U10 | Numa tabela de janela, depois da passada da janela, a atual tem nos meses da janela exatamente as linhas da fonte, e a linha que saiu da janela na fonte sai da atual; os meses fora da janela ficam. Numa tabela inteira, a atual é a última passada | `test_update.py`, "a janela troca o que leu" e "a inteira troca tudo" | must |
| 59 | U10 | Depois de cada atualização, a bruta não tem mais as linhas que já entraram na atual, nem as passadas inteiras anteriores; a atual não muda com a limpeza (decisão A) | `test_update.py`, "a limpeza"; Lab (L.7) | must |
| 106 | U3, U4, U5 | Uma regra só, para todo conector, pelo tipo que a descoberta lê: `CLOB`, `NCLOB` e `LONG` viram texto; `BLOB`, `RAW` e `LONG RAW` viram o tipo binário do Iceberg, com os bytes iguais aos da fonte; nenhuma coluna se marca como arquivo à mão. O significado declarado de uma coluna (`NFE_XML`) vai às propriedades da tabela (`conexus.significado.<coluna>`) e não muda a cópia | `sankhya/copy-tables.test.ts`, "o tipo da coluna"; `tap.test.ts`, "o binário"; `test_target.py`, "o binário chega igual" | must |
| 115 | U4 | Uma página que responde 5xx, 429 (`BUSY`, esperando o `waitMs` que o provedor pediu) ou cai por erro de rede e depois responde é lida e emitida uma vez, sem `TapFailure`; a que falha cinco vezes escreve `COPY_SOURCE_UNREACHABLE` e a tabela em que parou e sai com código diferente de zero, com a espera crescendo entre as tentativas (relógio de teste); um 4xx que não é 429 não é repetido | `apps/extraction/tap/src/tap.test.ts`, "a página que cai e volta" | must |
| 104 | U10 | Nenhuma tabela guarda histórico nesta etapa (o fundador, 2026-11-24, 16:19Z: "Outra coisa sobre o histórico de NFE, vamos deixar sem o histórico, porque eu acho que o jeito que você está querendo montar o histórico não é como as referências fazem."): a limpeza lê o `history` da declaração e roda também na tabela dos dados da NF-e, com o XML. Depois de duas passadas que leem a mesma nota com XML diferente (a segunda forçada inteira no teste), a atual tem a versão nova e a bruta não guarda mais as linhas que já entraram nela; uma nota apagada no dublê sai da atual na passada inteira. Numa tabela de teste com `history: true`, a limpeza não roda | `test_update.py`, "o XML sem histórico" e "a limpeza pula o histórico", pela entrada da tarefa com o modo da declaração | must |
| 105 | U5, U10 | Todas as colunas, atuais e futuras: uma coluna que aparece na fonte depois da primeira carga (o dublê acrescenta uma `AD_` entre duas rodadas) entra na rodada seguinte na bruta e na atual, com as linhas antigas nulas nela, e na aba **Colunas**; uma coluna que some da fonte fica no lago, nula nas linhas novas | `apps/extraction/tests/test_target.py`, "a coluna nova"; `test_update.py`, "a coluna nova na atual"; `lake-run.test.ts`, "as colunas de novo" | must |
| 60 | U10 | O Hub pede `whole` para uma tabela recém-marcada; a tarefa lê inteira também a tabela sem ponto de parada no estado e a sem coluna de alteração, e o resultado diz `whole` por tabela; as outras leem só o que mudou ou a janela; **Rodar agora** segue o mesmo | `apps/extraction/tests/test_state.py`, "o modo por tabela"; `lake-run.test.ts`, "a tabela nova é inteira" | must |
| 61 | U10 | Desmarcar uma tabela apaga também o ponto de parada dela | `lake-routes.test.ts`, "o ponto de parada sai" | must |
| 107 | U3 | O Sankhya declara cada tabela só do que mudou como cadastro ou movimento: `parceiros`, `produtos`, `vendedores` e `precos_tabelas` são cadastro; `notas`, `notas_itens`, `financeiro` e `notas_impostos` são movimento. Pelo índice do kit, as tabelas que a data inicial limita são as de movimento e as de janela, e nenhuma inteira; a coluna que a data compara é a do modo, e a declaração não tem outra | `packages/connectors/src/sankhya/copy-tables.test.ts`, "o que a data limita" | must |
| 108 | U4 | Com `start_date` na configuração, a primeira passada de uma tabela de movimento lê só as linhas com a coluna do modo a partir da data; com o ponto salvo depois da data, lê do ponto; com o ponto salvo antes da data, lê da data (o maior dos dois); uma data anterior ao ponto não muda o início. Um cadastro e uma tabela inteira leem tudo. Sem `start_date`, a primeira passada lê tudo, a linha sem `DTALTER` incluída (#940); com ela, essa linha fica fora | `apps/extraction/tap/src/tap.test.ts`, "a data inicial", "o ponto e a data" e "o cadastro inteiro" | must |
| 109 | U5 | A entrada passa a data da rodada ao tap como `start_date`, e a configuração não a tem quando a data é nula | `apps/extraction/tests/test_entry.py`, "a data vai ao leitor" | must |
| 110 | U8 | Gravar a cópia mudando só a data só grava: nenhuma rodada começa, e a resposta traz a data; a mesma data não muda nada. `POST .../lake-copy/run` com `whole: true` abre a rodada pela porta de sempre, com `whole` só nas tabelas marcadas que `startDateLimits` limita e a data da cópia na especificação; com rodada aberta, com ou sem `whole`, responde "já está rodando" e não grava nada (39); quem não gerencia cópias recebe 403 | `apps/server/src/hub/copies/lake-routes.test.ts`, "a data só grava" e "ler de novo desde a data"; `lake-run.test.ts`, "a data na tarefa" | must |
| 111 | U9 | Na aba **Tabelas** da ligação, na seção **Tabelas no lago**, **Desde** mostra a data da cópia ou "Todo o histórico" e grava por **Salvar**. Depois de salvar uma data mais nova, a seção diz "A data nova vale a partir da próxima rodada. As linhas de antes dela continuam no lago até você ler de novo desde a data."; uma mais antiga, ou vazia, "As próximas rodadas continuam de onde pararam. Para trazer as linhas desde <data>, clique **Ler de novo desde a data**." Quem não gerencia cópias vê a data sem o campo e sem o botão | `apps/web/src/hub/connectors/lake-tables.test.tsx`, "a data inicial" | must |
| 112 | U10 | Pela entrada da tarefa: depois de uma rodada desde uma data e outra, inteira, desde uma data mais antiga, a atual é igual à fonte desde a data mais antiga, uma linha por chave; depois de uma inteira desde uma data mais nova, as linhas anteriores a ela saíram da atual; depois de uma só do que mudou com a data mais nova, nenhuma linha sai; numa tabela de janela, só os meses desde o mês da data se trocam, e os anteriores ficam | `apps/extraction/tests/test_update.py`, "a data mais antiga relida", "a data mais nova relida", "a data mais nova não apaga" e "a janela relida desde a data" | must |
| 113 | U3, U4, U8 | A data inicial tem um dono de cada lado: a regra do que ela limita, só em `kernel/tables.ts` (`startDateLimits`); a data da cópia, só em `lake_copy.start_date`; a lista que a janela mostra (a marca "desde") e o filtro do tap saem da mesma `startDateLimits` | `packages/connectors/src/kernel/tables.test.ts`, "o que a data limita"; o caso da lista em `kernel/tables-fixture.ts`, lido por `lake-routes.test.ts` e por `tap.test.ts` | must |
| 114 | U9 | **Ler de novo desde a data** abre um diálogo que lista as tabelas marcadas que a data limita, tem o título "Ler de novo desde <data>?" ("desde o começo" sem data) e a linha "O lago troca o que tem destas tabelas:", e, para cada uma, "Só o que mudou: o que veio antes da data, ou foi apagado no <sistema>, sai do lago." ou "Janela por mês: trocam-se só os meses desde o mês da data.", e "As outras tabelas seguem como sempre."; **Ler de novo** é a variante `danger-confirm` (V55); **Ler de novo** chama a rota do 110 com `whole: true` e mostra "Rodando…" nessas tabelas; **Cancelar** não chama nada; sem tabela que a data limite, o botão não aparece; com a resposta `already`, nada muda e as tabelas seguem mostrando "Rodando…" | `apps/web/src/hub/connectors/lake-tables.test.tsx`, "ler de novo desde a data" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dados, a página (U1, U14) | Parte 0: a árvore dos sistemas e a camada dos apps; "Nenhuma tabela copiada." | O mesmo da primeira vez | O de hoje | O de hoje | O endereço antigo de uma cópia leva à página Dados | Como hoje | — |
| Integrações, a lista para ligar (U9) | As ligadas e os sistemas para ligar | — | O de hoje | O de hoje | — | Membro: "Só o dono ou um administrador liga, testa e desliga.", sem **Ligar** (spec 02, 4.15) | — |
| A janela Ligar, Acesso e Testando (U9) | O nome da ligação (o do sistema sugerido, como hoje), os campos do kit, "Onde achar" de cada um, **Desde** depois do X-Token (vazio, "Todo o histórico"), **Enviar link** (só no acesso por campos) e **Continuar**; no acesso por autorização, **Entrar com <sistema>** | — | "Testando a ligação…", depois "Lendo o que o <sistema> oferece" | "O <sistema> não respondeu. Tente de novo em alguns minutos."; o dicionário fora: a lista segue com o rótulo do kit e "Não deu para ler o dicionário agora."; **Desde** depois de hoje: "A data não pode ser depois de hoje.", e **Continuar** fica desligado | — | — | "O <sistema> recusou as chaves", com a resposta por extenso, os campos e **Enviar link** |
| A janela Ligar, O que copiar (U9) | As tabelas por assunto, nada marcado; o prefixo e a busca das tabelas; a linha de cada tabela diz o modo; o rodapé conta as marcadas e as limitadas pela data; pela seção de uma ligação sem cópia (T.33), **Desde** no alto do passo; **Continuar** desligado até marcar uma | Nenhuma tabela declarada ou credencial exclusiva: a janela pula para **Ligado** | — | `COPY_NAME_INVALID`: "Use letras minúsculas sem acento, números e _, até 60."; `COPY_NAME_TAKEN`: "Outra tabela da empresa já tem este nome."; pelo caminho da seção (T.33), **Desde** depois de hoje: "A data não pode ser depois de hoje." | — | — | — |
| A janela Ligar, Quando copiar e Ligado (U9) | 24 h escolhido; a revisão com as tabelas, os nomes e o intervalo; **Ligar e copiar agora** | — | "Ligando…" no botão | `COPY_LAKE_NOT_READY`: "O lago desta empresa não está pronto. Peça ao operador do Conexus." A ligação fica feita, sem cópia | — | Quem gerencia ligações e não gerencia cópias: a janela vai do teste ao **Ligado**, com "Peça a quem gerencia as cópias para escolher o que copiar." | — |
| O envio do link, na janela (U9, U20) | Os campos para marcar o que a outra pessoa preenche e **Gerar o link** | — | "Gerando…" | A frase de hoje de tentar de novo | — | — | Depois de gerado: o endereço, **Copiar** e "Vale até <hora>." |
| A página do link, sem sessão (U9, U20) | "<pessoa> pediu o acesso do <sistema> para <empresa>.", os campos pedidos e **Enviar** | — | "Testando a ligação…" | O sistema recusou: a resposta dele por extenso, e os campos de novo | Gasto, vencido ou segredo errado: "Este link venceu ou já foi usado. Peça um novo a quem enviou." | — | — |
| A ligação, a seção Tabelas no lago (U9) | Sem cópia: "Nada desta ligação é copiado para o lago." e **Escolher o que copiar** | Conector sem tabela declarada ou de credencial exclusiva: a seção não aparece | "Lendo o dicionário do <sistema>…" | O dicionário fora: as tabelas com o rótulo do kit e "Não deu para ler o dicionário agora."; `COPY_RUN_OPEN`: "A ligação está copiando agora. Desmarque quando a rodada terminar."; `COPY_NAME_TAKEN`, `COPY_NAME_INVALID` e `COPY_START_DATE_INVALID`, como na janela; a AWS fora ao desmarcar ou desligar (503): "Não deu para falar com a AWS agora. Tente de novo em alguns minutos." | A ligação desligada: a frase de hoje da página | Quem não gerencia cópias vê as tabelas copiadas, sem caixas, sem **Salvar** e sem **Rodar agora** | — |
| Dados, a lista do lago (U9) | "Nenhuma tabela copiada. Para copiar, ligue um sistema em Integrações." | O mesmo da primeira vez | O de hoje da página | O de hoje da página | Uma tabela desmarcada noutra aba some na próxima leitura | Quem não lê a ligação não vê as tabelas dela | A última rodada com erro: o selo de hoje, com a frase do código |
| A tabela do lago, Visão geral, Colunas, Rodadas e Detalhes (U9) | A primeira rodada aberta: "Rodando…", sem linhas | Nenhuma rodada ainda: "Esta tabela ainda não rodou." | O de hoje da página | `COPY_LAKE_UNAVAILABLE`: "A AWS não iniciou a cópia. A próxima rodada tenta de novo." `COPY_TASK_LOST`: "A cópia parou antes de terminar. A próxima rodada tenta de novo." `COPY_LAKE_WRITE_FAILED`: "Não deu para gravar no lago. A próxima rodada tenta de novo." `COPY_SOURCE_NEEDS_REAUTH`: "<sistema> recusou o login da ligação. Reconecte a ligação." `COPY_SOURCE_REFUSED`: "<sistema> recusou a leitura." `COPY_SOURCE_UNREACHABLE`: "<sistema> não respondeu. A próxima rodada tenta de novo." `COPY_SOURCE_UNREADABLE`: "<sistema> respondeu algo que o Conexus não entende. A próxima rodada tenta de novo." Uma rodada com erro diz em que tabela parou e, quando o sistema respondeu, a resposta dele por extenso | A tabela desmarcada: "Esta tabela não é mais copiada." | Quem não lê a ligação: o "não encontrado" (S10) | A rodada interrompida: "Interrompida." |
| O cartão do Caderno na conversa (U19) | "Gravar no Caderno?", com o conceito, o mapeamento e a consulta da prova (o número de linhas só se sabe depois da prova, e a página da ligação o mostra), e **Aprovar** e **Recusar** | — | O de hoje do cartão de escrita | A ligação saiu antes do sim: "Esta ligação não existe mais. Nada foi gravado." | — | Quem não gerencia ligações vê o cartão sem os botões e "Peça a quem gerencia a ligação." | Recusado: "Não gravado." |
| A ligação, o Caderno (U19) | A lista de hoje, com "Aprovada por <nome>" em cada anotação | O vazio de hoje | O de hoje | O de hoje | — | Como hoje | Uma anotação de antes desta etapa: "Gravada sem aprovação" |

**Em dia** quer dizer que a última rodada da tabela terminou completa; "Rodando…", que há rodada aberta da
ligação. Os modos na tela: "Só o que mudou, por <coluna>", "Janela por mês, por <coluna>" e "Inteira". A
data na tela: "Todo o histórico" sem data; com data, a linha de cada tabela que ela limita, na aba **Tabelas** da
ligação e em **Detalhes**, diz "Desde <data>", e na janela o efeito aparece na contagem do rodapé de **O que
copiar** ("2 tabelas marcadas, 2 limitadas pela data") e na Revisão ("Desde 24/11/2021 nas tabelas que a
data limita."). Depois de salvar outra data, a seção diz o efeito: se for mais nova, "A data nova vale a partir da
próxima rodada. As linhas de antes dela continuam no lago até você ler de novo desde a data."; se for mais
antiga, ou vazia onde havia data, "As próximas rodadas continuam de onde pararam. Para trazer as linhas
desde <data>, clique **Ler de novo desde a data**." (vazia: "desde o começo"). O diálogo de **Ler de novo
desde a data**: o título "Ler de novo desde <data>?" ("desde o começo" sem data); a linha "O lago troca o que tem
destas tabelas:"; uma linha por tabela que a data limita e que está copiada, com o rótulo e, embaixo, "Só o que
mudou: o que veio antes da data, ou foi apagado no <sistema>, sai do lago." (modo `CHANGED` com coluna de
alteração que não é cadastro) ou "Janela por mês: trocam-se só os meses desde o mês da data." (modo
`WINDOW`); a frase "As outras tabelas seguem como sempre."; e os botões **Ler de novo** (variante
`danger-confirm`, V55) e **Cancelar**. A tabela de cadastro e as inteiras não entram na lista. Os intervalos: "15 min", "30 min", "1 h", "2 h",
"6 h", "24 h" e "Só manual".

A etapa do conector não muda tela para quem usa, além do cartão e do Caderno da U19: as telas de
Integrações leem o kit pelo mesmo índice, e os ids não mudam.

A janela segue o assistente da Nekt, tela a tela (`MAPA` 1.1): o catálogo (sem busca nesta etapa), o acesso com o
link, a validação que descobre, a escolha dos fluxos com o nome sugerido e o prefixo, o gatilho e o
salvar que já roda; sem a camada e a pasta, porque cada empresa tem um lago (spec 02, `T2`). Os
passos são os da spec 02 (`p2-04` a `p2-14`), com O que copiar antes de Quando copiar, e a revisão
dentro de Quando copiar. A seção da ligação segue a TD2 ("o que a ligação entrega, quais cópias e
Projetos a usam, quando cada cópia rodou", `C/docs/reference/telas.md:392`) e o "Details" da Nekt
(`MAPA` 1.3). O nome em Dados segue a Nekt: o rótulo primeiro, o nome no lago e a origem embaixo
(`EST/conector-estilo-novo-estudo:105`). As capturas que o desenho segue são do estudo anterior:
`capturas/hoje/` da página Dados e da ligação, a 1440 e 390 px, e a do Airbyte,
`capturas/referencias/cloud-status-page.png`.

```text
1280 px, a janela, O que copiar                       390 px, a janela, O que copiar
+--------------------------------------------------+  +------------------------------+
| Ligar Sankhya · Lago                      [x]     |  | Sankhya · Lago               |
| v Acesso  v Testando  3 O que copiar  4 Quando   |  | Passo 3 de 4 · O que copiar  |
| Prefixo [sankhya_      ]                         |  | Prefixo [sankhya_    ]       |
| Vendas                                           |  | Vendas                       |
|  [ ] Notas e pedidos  TGFCAB  450 colunas        |  | [ ] Notas e pedidos          |
|      Cabeçalho de toda nota e pedido ...         |  |     TGFCAB · 450 colunas     |
|      Só o que mudou, por DTALTER                 |  |     Só o que mudou, DTALTER  |
|      Nome no lago [sankhya_notas         ]       |  |     [sankhya_notas      ]    |
| Fiscal                                           |  | Fiscal                       |
|  [ ] Dados da NF-e    TGFNFE  27 colunas         |  | [ ] Dados da NF-e            |
|                          [Voltar] [Continuar]    |  | [Voltar]       [Continuar]   |
+--------------------------------------------------+  +------------------------------+
1280 px, a janela, Quando copiar                      390 px, a janela, Quando copiar
+--------------------------------------------------+  +------------------------------+
| Quando copiar                                    |  | Quando copiar                |
| (o) 24 h ( ) 6 h ( ) 2 h ( ) 1 h ( ) 30 min      |  | Intervalo [24 h        v]    |
| ( ) 15 min ( ) Só manual                         |  | Revisão                      |
| Revisão                                          |  | Notas e pedidos              |
|  Notas e pedidos     sankhya_notas               |  |  sankhya_notas               |
|  Dados da NF-e       sankhya_notas_nfe           |  | Dados da NF-e                |
|  A cada 24 h, a partir de agora                  |  |  sankhya_notas_nfe           |
|                [Voltar] [Ligar e copiar agora]   |  | [Ligar e copiar agora]       |
+--------------------------------------------------+  +------------------------------+
1280 px, a página da ligação                          390 px, a página da ligação
+--------------------------------------------------+  +------------------------------+
| Sankhya · Lago                     Funcionando   |  | Sankhya · Lago               |
| Último teste 10:02 · Testar                      |  | Funcionando · Testar         |
| Visão geral  [Tabelas]                           |  | Visão geral  [Tabelas]       |
| Tabelas no lago                                  |  | Tabelas no lago              |
|  [x] Notas e pedidos   sankhya_notas   Em dia    |  | [x] Notas e pedidos  Em dia  |
|  [ ] Parceiros         [sankhya_parceiros   ]    |  |     sankhya_notas            |
|  Intervalo [24 h v]   Rodar agora   [Salvar]     |  | Intervalo [24 h v]           |
|  Desde [24/11/2021]   Ler de novo desde a data   |  | Desde [24/11/2021]           |
| Caderno ...                                      |  | Ler de novo desde a data     |
|                                                  |  | Rodar agora      [Salvar]    |
+--------------------------------------------------+  +------------------------------+
1280 px, Dados                                        390 px, Dados
+--------------------------------------------------+  +------------------------------+
| Tabela             Atualizada    Linhas Intervalo|  | Notas e pedidos     Em dia   |
| Sankhya · Lago · 4 tabelas                       |  | sankhya_notas                |
| Notas e pedidos    Em dia 02/11  118.402  24 h   |  | 02/11 10:00 · 118.402        |
|  sankhya_notas · Sankhya · TGFCAB                |  +------------------------------+
+--------------------------------------------------+
```

As peças de `ui/`: o diálogo e o campo de busca que a janela Ligar de hoje já usa
(`apps/web/src/hub/connectors/link-dialog.tsx`), a seção e o título da página da ligação, a caixa de
marcar, o campo de texto, o seletor de intervalo, a tabela, as abas, o botão (com a variante `danger-confirm`, V55, para confirmar **Ler de novo**) e o selo de hoje, e o
cartão de aprovação de `apps/web/src/ui/ai/approval.tsx`. A célula da duração, na aba Rodadas, quebra no
celular (`whitespace-normal`). Uma peça nova, a **barra de passos** (`StepBar`), com a linha 74 da tabela de
referência e a regra no `DESIGN.md` (V62). A interface do
Impeccable roda na QA da parte 1 ([Impeccable](../reference/impeccable.md)).

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `credentialClass` de cada login do kit | U16, a definição de cada conector | U8, a seção e a janela (`EXCLUSIVE_CREDENTIAL`); a etapa 5 |
| A parte gerada da skill (os assuntos, a escrita, as tabelas com os nomes reais) | U16 e U3, `kernel/skill.ts`, da definição e das tabelas da ligação que a U8 passa | o Assistente, o Builder e os agentes, pela skill da ligação |
| `Note.approvedBy` no Caderno | U19, `hub/connectors/notes.ts`, depois do sim | U19, `notes.tsx`; os agentes, pelo `connector_notes` |
| `LakeTablesOfConnection.lake` (`READY`, `NOT_READY` ou `UNAVAILABLE` com o motivo) | U8, `hub/copies/lake-routes.ts`, da linha do lago e da classe da credencial | U9, a janela e `lake-tables.tsx` |
| `LakeTablesOfConnection.tables[]` (`source`, `label`, `description`, `group`, `mode`, `columns`, e `limited`, e `copy`: `UNMARKED` com o `suggested`, ou `MARKED` com o `name` e o `lastRun`) | U8, da descoberta do kit (U3), do dicionário, de `lake_table` e de `startDateLimits` | U9 |
| `LakeTablesOfConnection.interval`, `startDate` e `lastRun` | U8, de `lake_copy` e `lake_run` | U9 |
| `TableDeclaration.group` | U3, a declaração do kit | U3, a parte gerada da skill; U9, a janela e a seção agrupam por assunto |
| `TableDeclaration.mode` | U3, a declaração do kit | U4, a leitura; U10, a atualização; U8, a lista; U9, a frase do modo |
| `TableDeclaration.history` | U3, a declaração do kit | U10, a limpeza |
| `LakeTableSummary.next` | U8, a próxima hora do relógio da ligação | U9, a Visão geral ("Próxima rodada") |
| `LakeRun.failedTable` e `system` | U8, de `lake_run.failed_table`, `system_code` e `system_message`, que o resultado da U5 traz | U9, a frase da rodada com erro e a resposta do sistema por extenso |
| `SetLakeCopy` (`tables[]` com `source` e `name`, `interval`, `startDate`) | U9, a janela e `lake-tables.tsx` | U8, `lake-copy.ts` |
| `RunLakeCopy.whole` (`POST .../lake-copy/run`) | U9, **Ler de novo desde a data** | U8, `lake-run.ts`: `whole` nas tabelas que `startDateLimits` limita |
| As falhas `COPY_LAKE_NOT_READY`, `COPY_RUN_OPEN`, `COPY_NAME_TAKEN`, `COPY_NAME_INVALID`, `COPY_NAME_FIXED`, `COPY_TABLE_NOT_DECLARED`, `COPY_START_DATE_INVALID` | U8 | U9, `text.ts` |
| `LakeTableSummary` (`connection`, `label`, `name`, `source`, `mode`, `interval`, `startDate`, `rows`, `columns`, o último resultado) | U8, `hub/copies/lake-list.ts`, de `lake_table` e `lake_run`, o `mode` da declaração do kit e, de `lake_copy` e `startDateLimits`, a `startDate` (nula numa tabela que a data não limita) | U9, `lake-list.tsx`, `lake-detail.tsx` |
| `LakeRun.whole` e as contagens da tabela | U8; U10 pelo modo | U9, a coluna Resultado |
| `LakeRunFailureCode` | U7 (a lista); U8 no fim; U5 no resultado | U9, `text.ts`; o cartão do aviso |
| `CopyTaskSpec`, no parâmetro da rodada | U8, `lake-run.ts` | U5, `entry.py` |
| `CopyTaskSpec.startDate` | U8, `lake-run.ts`, em toda rodada | U5, `entry.py`, que a escreve como `start_date` na configuração do tap |
| `TableMode.CHANGED.registry` | U3, a declaração do kit | U3, `startDateLimits`; U4, o filtro; U8, a lista; U9, a marca "desde" |
| `startDateLimits(mode)` | U3, `kernel/tables.ts` | U4, o filtro; U8, a lista e a releitura com `whole` |
| `lake_copy.start_date` | U8, `lake-copy.ts`, pelo `PUT` | U8, a lista, a especificação e a releitura |
| `CopyTaskResult`, na fila | U5, `entry.py` | U8, `lake-queue.ts` |
| `CopyTaskResult.machine` (`allocated`, `peak`, `everySeconds`, `samples`) | U5, `machine.py` e `entry.py` | U8, `lake-queue.ts`; U9, a aba Rodadas |
| O evento de parada do ECS, na fila | a regra do EventBridge (U6) | U8, `lake-queue.ts` |
| `lake_run.task_arn`, `lake_run.attempt` | U8, no disparo | U8, a varredura e o fim |
| `lake_table.columns` | U8, do dicionário, ao marcar e a cada disparo | U9, a aba Colunas |
| `lake_copy.created_at`, a hora de partida | U8, ao gravar a cópia pela primeira vez | U8, o relógio ancorado |
| `conexus.origem` e `conexus.rotulo`, nas propriedades da tabela Iceberg | U5, ao criar a tabela | o firstmate no passo 14; o Descrever do lago na etapa 3 |
| `conexus.significado.<coluna>` (`NFE_XML`), nas propriedades da tabela | U3 declara, U5 grava | a etapa do XML lido em linhas |
| A linha do lago, lida pela empresa | o módulo do lago de hoje | U8, `lake-copy.ts` e `lake-run.ts` |
| `ConnectionLink` (`url`, `expiresAt`) e a página do link (`askedBy`, `system`, `fields`) | U20 | U9, o envio na janela e a página do link |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| O Apagar do reajuste (a rota de hoje, antes da parte 0) | A segunda acha a cópia apagada: a mesma resposta (S10) | O `REVOKE` feito e a transação não: a cópia fica; clicar de novo termina | O banco da empresa fora: 503 sem mudar nada, como hoje | `COPY_DELETED` de hoje | 8 |
| A migração que tira as tabelas das cópias (U15) | O `migrate` roda uma vez por subida, com a trava de hoje | Uma instrução por tabela, numa transação: ou todas saem, ou nenhuma | O banco do Hub fora: a subida falha antes de servir, como hoje | o do `migrate` | 76 |
| As migrações que acrescentam (U7) | O `migrate` roda uma vez por subida, com a trava de hoje | Numa transação: ou tudo entra, ou nada | O banco do Hub fora: a subida falha antes de servir, como hoje | o do `migrate` | 35, 36, 91 |
| Tirar o `sync` e os logins de uma empresa (o passo 4 do reajuste) | Cada instrução tem `IF EXISTS`: a segunda vez não acha nada e termina | Um login tirado e o esquema não: repetir termina | O banco da empresa fora: a empresa fica para depois; a consulta do passo 4 diz qual | a saída do `psql` do firstmate, fora do repositório (S40) | 77 |
| Gravar no Caderno depois do sim (U19) | Duas aprovações da mesma chamada: o Mastra retoma a chamada uma vez; o mesmo conceito duas vezes fica com a última, como hoje | A ligação saiu entre o sim e a gravação: `GONE`, nada gravado | O banco fora: a ferramenta responde a falha de hoje, e nada é gravado | `CONNECTION_NOTE_SAVED`, com quem aprovou; `CONNECTION_NOTE_REFUSED` | 83, 84 |
| A sessão do kit renova (U16) | Duas leituras da mesma ligação usam a mesma sessão; a renovação é uma por vez, pela fila de hoje da ligação | A renovação recusada: a sessão fecha, e a leitura termina em `NEEDS_REAUTH` | O sistema fora: a leitura termina com a recusa de hoje da ligação | `CONNECTION_SESSION_RENEWED`, sem o token | 12, 13 |
| Gravar a cópia da ligação, com os nomes (`PUT`, da janela ou da seção) | A chave da ligação: as duas gravam o mesmo conjunto, o último vence, e cada uma devolve o que ficou; duas ligações que dão o mesmo nome ao mesmo tempo: o índice do nome por empresa recusa a segunda, 409 `COPY_NAME_TAKEN` | A transação desfaz as linhas; o relógio é criado depois dela, e o próximo salvar o cria se faltar | O lago lido em outro estado: 409 `COPY_LAKE_NOT_READY`; o dicionário fora: a marca grava, sem colunas | `LAKE_COPY_SET` com as tabelas, os nomes e a data | 38, 47, 96, 110 |
| Ler de novo desde a data (`POST .../lake-copy/run` com `whole`) | O índice da rodada aberta deixa uma só; com uma aberta, o disparo responde "já está rodando" e não grava nada, como o **Rodar agora** (39), e a pessoa clica de novo quando ela terminar | A rodada e a tarefa seguem as de sempre: a que falha no meio fecha pela fila e pela varredura, e clicar de novo pede de novo; a troca da atual é o atualizar da passada inteira de hoje (linha 28) | O banco fora: a frase de hoje de tentar de novo, nada muda | `COPY_RUN_QUEUED` com `whole` | 110, 114 |
| O relógio da ligação, criado, mudado e apagado (`mastra.schedules`; `MANUAL` apaga a linha) | O id do relógio é o da ligação: a criação que perde a corrida acha o relógio feito, como fazia o relógio de hoje (`C/apps/server/src/builder/copy-clock/clock.ts:70-79`, no histórico); o horário sai de `lake_copy.created_at`, que não muda | Linhas gravadas e relógio não: o próximo salvar cria; **Rodar agora** funciona sem ele | O banco fora: o salvar responde a frase de hoje | `LAKE_CLOCK_FAILED` | 38, 47, 92 |
| Abrir a rodada (`INSERT` em `lake_run`) | O índice de uma rodada aberta por ligação recusa a segunda: "já está rodando" | — (uma instrução) | Banco fora: o disparo não abre nada; o próximo tenta | `COPY_RUN_SKIPPED` com o motivo | 39, 40 |
| Gravar o parâmetro da rodada (`PutParameter`) | Um nome por rodada, sem disputa | A rodada fecha `COPY_LAKE_UNAVAILABLE` | Cota (3 por segundo): a fila de partidas não passa dela; uma recusa por cota é refeita com espera, depois `COPY_LAKE_UNAVAILABLE` | `COPY_LAKE_START_FAILED` com o código da AWS | 45, 46, 95 |
| Iniciar a tarefa (`RunTask`) | O `clientToken` de rodada e tentativa: a AWS devolve a mesma tarefa | Sem resposta: repetido com o mesmo token; recusado: a rodada fecha e o parâmetro sai | A AWS fora: `COPY_LAKE_UNAVAILABLE` | `COPY_LAKE_START_FAILED` | 39, 45 |
| O resultado e a parada na fila (o fim) | Quem chega primeiro fecha (`UPDATE ... WHERE ended_at IS NULL`); o segundo não muda nada | A mensagem só sai da fila depois do fim gravado; três entregas falhas vão à fila de mortos | Banco fora: a mensagem volta à fila e é lida de novo | `COPY_RUN_ENDED`; uma mensagem ilegível, `COPY_QUEUE_UNREADABLE`, apagada da fila | 41, 42, 50 |
| Apagar o parâmetro no fim | Apagar duas vezes: a segunda acha nada e conta como apagado | A rodada já está fechada; a tarefa que ainda roda para no lote seguinte | A AWS fora: a varredura do próximo disparo apaga | `COPY_PARAMETER_LEFT` | 25, 44 |
| Gravar `lake_run.task_arn` depois do `RunTask` | Uma rodada só grava (a linha dela) | O Hub cai entre o `RunTask` e a gravação: a varredura acha a tarefa pelo `startedBy` da rodada (`ListTasks`), ou fecha a rodada pelas 48 horas | Banco fora: o mesmo | `COPY_TASK_UNRECORDED` | 43 |
| A varredura no disparo | Duas varreduras fecham a mesma rodada uma vez (o mesmo `UPDATE`) | — | A AWS fora: a rodada aberta há mais de 48 h fecha mesmo assim, como `COPY_TASK_LOST` | `COPY_RUN_SWEPT` | 43 |
| O gravador acrescenta na bruta (`append` do PyIceberg) | Uma rodada aberta por ligação (o índice); o PyIceberg refaz o commit em conflito 4 vezes | Um lote sem commit não aparece; o estado não sai antes dele | O catálogo responde 429 e o PyIceberg não refaz: a rodada termina `COPY_LAKE_WRITE_FAILED` | A linha `METRIC` do SDK e o resultado; nunca uma linha de dado | 21, 22, 24 |
| A entrada grava o segredo num arquivo `0600`, e o adaptador grava `result_path` | Uma tarefa por rodada; cada uma no seu disco | O arquivo não grava: a tarefa termina sem resultado, e a parada do ECS fecha a rodada como `COPY_TASK_LOST` | — (o disco da tarefa) | `SECRET_NOT_WRITTEN` ou `RESULT_FILE_NOT_WRITTEN`, sem o conteúdo | 19, 23 |
| A tarefa manda o resultado à fila (`SendMessage`) | Um resultado por rodada; uma entrega repetida acha a rodada fechada e não muda nada | O resultado não sai: a tarefa termina, e a parada do ECS fecha a rodada como `COPY_TASK_LOST` | A fila fora: o mesmo | `RESULT_NOT_SENT` no registro da tarefa | 24, 42 |
| A poda das rodadas além das 100 mais novas (no fim) | Duas pelas mesmas linhas: a segunda acha nada | Na transação do fim: desfaz com ele | O banco fora: o fim não grava, e a mensagem volta à fila | — (dentro de `COPY_RUN_ENDED`) | 41 |
| As colunas do dicionário em `lake_table.columns` (ao marcar e no disparo) | O último a gravar vence; as duas leram o mesmo dicionário | Gravadas e rodada não aberta: a próxima rodada regrava | O dicionário fora: as colunas guardadas ficam, e a rodada segue | `COPY_COLUMNS_KEPT` | 37, 39 |
| A tarefa confere a rodada a cada lote | — | Parâmetro apagado: para sem mandar resultado; a parada do ECS fecha o que sobrou | A AWS fora na conferência: conta como fechada e para | `RUN_CLOSED` no registro da tarefa | 25 |
| Parar a tarefa aberta ao desligar (`StopTask`) | A segunda acha a tarefa parada e conta como parada | Recusada: a parada do ECS fecha a rodada `INTERRUPTED` pelo fim de sempre | A AWS fora: desligar responde 503 e nada muda | `COPY_TASK_STOPPED` | 47 |
| Desmarcar uma tabela e desligar a ligação (as tabelas das duas áreas e o prefixo do estado no `S3`) | A segunda acha a linha apagada e responde o conjunto de agora; desligar com a rodada aberta para a tarefa primeiro | Tabelas do lago ou estado apagados e linha não: a tabela que a AWS não tem conta como apagada; repetir termina. A linha da ligação sai só depois das tabelas, e a cópia dela vai em cascata | A AWS fora: 503, nada muda, e a tela diz a frase de hoje de tentar de novo | `COPY_LAKE_TABLE_LEFT` | 47, 61 |
| A fila de partidas, uma por vez (`iniciarRodada`) | Dois disparos da mesma ligação: o índice da rodada aberta recusa o segundo; de ligações diferentes: esperam a vez, em ordem | O Hub cai com partidas na fila: elas se perdem, e o próximo disparo do relógio de cada ligação parte; **Rodar agora** responde 202 só depois de a partida entrar na fila | O banco ou a AWS fora: a partida fecha a rodada como `COPY_LAKE_UNAVAILABLE`, e a próxima segue | `COPY_RUN_QUEUED` com a espera | 39, 95 |
| A poda do rastro do Mastra (os disparos do relógio e as execuções do workflow da cópia, só as dele) | A poda diária roda uma por vez, como a de hoje (`C/apps/server/src/builder/mastra/retention.ts:36-41`); duas pelas mesmas linhas: a segunda acha nada | Linhas apagadas em parte: a do dia seguinte termina | O banco fora: a poda do dia não roda, e a do dia seguinte apaga o mesmo | o de hoje da poda | 94 |
| As propriedades da tabela Iceberg, ao criar (`conexus.origem`, `conexus.rotulo`) | Uma rodada aberta por ligação; a tabela nasce uma vez, com as propriedades no mesmo `create_table` | A tabela não nasce sem elas: é um pedido só ao catálogo | O catálogo fora: a rodada termina `COPY_LAKE_WRITE_FAILED`, e a próxima cria | o de hoje do gravador | 90 |
| Criar o link (`INSERT` em `connection_link`) | Dois links da mesma pessoa: dois, cada um com o seu segredo e o seu prazo | — (uma instrução) | O banco fora: a frase de hoje de tentar de novo, nenhum endereço | `CONNECTION_LINK_CREATED`, sem o segredo | 97 |
| Enviar pelo link (a ligação e o teste) | Dois envios: a trava pelo id do link deixa um só; o segundo responde 404, como um link gasto (`design.md:217`) | O teste lança: a ligação nova sai, com `CONNECTION_LINK_UNDONE`, e o link continua valendo | O sistema fora: a frase de hoje do teste, e o link vale até o prazo; o banco fora: a frase de tentar de novo | `CONNECTION_LINK_ANSWERED`, `CONNECTION_LINK_UNDONE` ou `CONNECTION_LINK_REFUSED`, sem o segredo nem os campos | 98, 99 |
| Apagar o lago com tabelas, as cópias do lago e os relógios | A trava do lago de hoje (etapa 1) | Tabelas apagadas e pilha não: o próximo **Apagar o lago** termina; as linhas de `lake_copy` e os relógios saem depois das tabelas, e repetir termina | A AWS fora: o estado `delete_failed` de hoje | o de hoje do lago | 48 |
| A Release publica a imagem e a plataforma | O grupo de concorrência da Release de hoje | Imagem publicada e plataforma não: a próxima Release publica a mesma versão | O ECR fora: a Release falha antes do `deploy` | o do workflow | 26, 34 |
| O ponto de parada do Meltano | Uma rodada por ligação; o Meltano grava a cada linha de estado | Morte no meio: o estado é o do último lote gravado | O `S3` fora: o Meltano falha, e a rodada termina com o código do gravador | o de hoje do Meltano | 56, 57 |
| O atualizar e a limpeza (três `MERGE`, um `DELETE` na passada inteira e na janela, e um da limpeza, que a tabela dos dados da NF-e pula) | Uma rodada por ligação | Entre duas instruções a atual fica num estado do meio; a próxima rodada refaz | O Athena fora: a rodada termina `COPY_LAKE_WRITE_FAILED`; a bruta guarda as linhas | `UPDATE_FAILED` com o código do Athena | 58, 59, 103, 104 |

## A tabela de referência

A tabela dos estudos, com a unidade e o arquivo novo de cada linha. As linhas 1 a 38 são do estudo e do
reestudo; as 39 a 45, do estudo do conector no estilo novo e do das duas ligações (`T<n>` lá); as 46 a 55,
do estudo do ao vivo (`R<n>` e a seção 1.3 lá); as 56 a 69, do mapa do desenho e dos três estudos que ele
chamou (`MAPA`, `SK`, `ARQ`, `REL`); a 70, do estudo do lakehouse com arquivos (`LAK`); as 71 a 73, do
estudo da data inicial (`EST/lago2-data-inicial-estudo`) e da conferência dele (`EST/lago2-data-certeza`),
que leram e rodaram `singer-sdk@0.54.9`, `meltano@4.4.1` e `airbyte-cdk@6.61.6`, e leram o Airbyte em
`82db089b` (`AB@82db089b`, e não o `AB` abaixo) e os docs da Nekt de 2026-11-24 (`NKH:<n>` é a linha `n`
do `llms-full.txt` baixado nesse dia; `NKT` é a página `platform-api/sources/trigger` da API). `C/` é o
`main` em `538b0562`; as siglas são as dos estudos: `AB` airbyte `8b40981a`, `AP` airbyte-platform
`c46502e`, `CDK` airbyte-python-cdk `bde4377`, `DLT` dlt `efaf0e3`, `TRM` tap-rest-api-msdk `071b540`, `M` mastra `d60ba71b`
(`@mastra/core` 1.83.0), guardados em `data/conexus-credenciais-framework/refs/`, e `NK` o texto da Nekt guardado em 2026-11-19. A
coluna "Muda" diz o que os estudos de 2026-11-23 mudaram: **fica**, **sai** ou **refeita**. A unidade de
cada linha remendo (11, 12, 13, 21, 22, 28, 29, 66) acrescenta a sua entrada em
`docs/reference/boundaries.md`, com a prova da linha, no mesmo commit.

Os testes de laboratório são os do estudo: L.1, a carga no Fargate até o `S3 Tables`; L.2, o Sankhya
do fundador de dentro da AWS; L.3, os quatro fins chegando à fila; L.4, o ponto de parada no `S3`;
L.5, o decimal lido pelo Athena; L.6, o papel que escreve isolado por empresa; L.7, o atualizar e a
limpeza; L.8, apagar sem sobra; L.9, a cota do parâmetro.

| # | Peça | Muda | Hoje no main | Referência | Veredito | Prova, se não for nativo | Decisão | Unidade | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Os modelos de cópia do Sankhya | sai | `C/packages/connectors/src/sankhya/copies.ts:85-170`: consultas com o filtro de venda (`:11`), junções, 4 a 11 colunas, janela de 30 dias (`:83`) | Nekt Protheus, `NK:177802`, mesma situação; Nekt Postgres e Oracle, `NK:140823`, `NK:132600`, e `AB .../JdbcMetadataQuerier.kt:70-80`, `:120`, situação diferente (banco direto) | nativo, ao sair: a tabela da fonte inteira toma o lugar (linha 8) | — | Fundador, 2026-11-19 (D1, D4); 2026-11-23 | U1 | — |
| 2 | A regra "o que é uma venda" | sai da cópia; volta na camada Negócio | `copies.ts:6-7`, `:11` | `NK:22279`, `NK:22335`; `AP .../RowFilteringMapper.kt:35-40` | nativo, ao sair: a regra mora depois do pouso, como nas referências | — | `C/docs/steps/trilhas/dados.md:111-112` | U1 | — |
| 3 | A janela de 30 dias e a passada inteira de domingo | sai | `C/packages/connectors/src/sankhya/copy-read.ts:36-40`; `C/apps/server/src/platform/copy-sql.ts:287-301`; `C/apps/server/src/builder/copy-clock/clock.ts:24-25` | Nekt: nenhuma janela genérica (`notas/notas-nekt.md`, questão 5); Airbyte: nenhum modo de janela (`notas/notas-airbyte.md`, questão 4) | nativo, ao sair: nenhuma referência guarda uma janela | — | F | U1 | — |
| 4 | O motor que cria cópia no banco da empresa: ligar, aceitar, a rodada com posse, o relógio por cópia, o SQL que escreve | sai na parte 0 | `C/apps/server/src/hub/copies/` (`enable.ts`, `accept.ts`, `propose.ts`, `run.ts`, `source-pass.ts`, `sources.ts`, `whole.ts`, `schedule.ts`), `builder/copy-clock/`, `platform/copy-sql.ts` | nenhuma faz: é a nossa mudança de casa | nativo, ao sair: o lago das linhas 15 a 30 toma o lugar | — | J | U1 | — |
| 5 | O que lê o banco da empresa: o catálogo, Ler e Consultar, a Amostra, Quem lê, a liberação a Projetos e aos apps, os logins por papel, `copy_runs`, a lista e a página de uma cópia | sai na parte 0 (NT3) | `C/packages/hub-api/src/company-data.ts:48-57`; `C/apps/server/src/hub/data/rows.ts:10-43`; `query.ts:79-110`; `C/apps/server/src/platform/copy-reader.ts:219-235`, `:51-82`; `hub/copies/` (INV §3.3); `builder/company-tools/copy-runs.ts:87` | nenhuma faz: é a nossa mudança de casa (`EST/conector-estilo-novo-estudo`, linha `T15`) | nativo, ao sair: a leitura do lago das etapas 3 e 4 toma o lugar (0079) | — | NT3; D, J | U14, U15 | — |
| 6 | O Builder propõe uma cópia (`copy_propose`) | sai na parte 0 | `C/apps/server/src/builder/connectors/copy-propose.ts`; `C/apps/server/src/hub/copies/propose.ts:215` | Nekt TOTVS RM: uma consulta da empresa como tabela, opcional (`NK:178309`) | nativo, ao sair: nenhuma referência propõe por padrão | — | volta, se pedir, na etapa 6 | U2 | — |
| 7 | Apagar a cópia do banco, para o reajuste | fica até o reajuste; sai com a parte 0 | `deleteCopy`, `C/apps/server/src/hub/copies/leave.ts:210`; o fim e o `DROP`, `endCopies` `:166` e `dropEndedCopies` `:287` | — | embrulhado: herdado, já em produção | — | o reajuste | o reajuste; U1 | — |
| 8 | A declaração da tabela no kit: a tabela da fonte, a chave, o modo (só o que mudou, janela por mês ou inteira), o histórico, a página | refeita | `C/packages/connectors/src/kernel/copy.ts:66-92` (`QUERY`, até 100 colunas `:73`, chave só `bigint` `:81-87`); `PAGE_ROWS = 500` `:6`; `CopyModel` `:184` | 0080, `C/docs/decisions/0080-copy-declared-per-table-raw-appends.md:10-19`; Nekt API, por tabela, `primary_keys`, `replication_key`, `sync_type` (`NK:20888-20897`); Nekt Protheus, o modo fixado pelo conector (`NK:177752`, "Every stream is FULL_TABLE"); `CDK .../declarative_component_schema.yaml:2244-2271` (`page_size` por paginador; lida numa cópia guardada que a estante de hoje não tem, e não conferida aqui) | embrulhado: a lista do kit sobre o `--discover` | O dicionário no dublê, 286 linhas (`EST/descoberta-catalogo:75-80`); as 42 e o modo de cada uma em `SK` seção 1. Não provado: 450 colunas, a página em bytes (critérios 11, 21); as sondas P1 a P5 | Completo; F; NT1, NT4 | U3 | `packages/connectors/src/kernel/tables.ts`; `packages/connectors/src/sankhya/copy-tables.ts` |
| 9 | A descoberta das colunas pelo dicionário (`TDDTAB`, `TDDCAM`) | nova | nenhuma na cópia; a skill do agente já lê o dicionário (`C/packages/connectors/src/sankhya/skill/SKILL.md:49`) | o `--discover` do Singer; tap-oracle lê `all_tab_columns` (`EST/descoberta-catalogo:135`); Nekt Protheus, os nomes do dicionário (`NK:177778`) | nativo | Medido antes, no dublê (`EST/descoberta-catalogo:75-80`). Não provado no Sankhya real: a P1 e o passo 8 do roteiro | D1, 2026-11-19 | U3, U4 | — (em `copy-tables.ts`) |
| 10 | O prefixo do conector no nome do lago | fica | `copyPrefixOf`, `C/packages/connectors/src/kernel/copy.ts:16-18` | Nekt, "`hubspot_deals`" (`NK:12217-12218`); `AP .../Mapper.kt:171-179` | nativo | — | não precisa | U3, U4, U8 | — (`lakeNameOf` em `kernel/tables.ts`) |
| 11 | O adaptador: do kit a um leitor Singer, um só | fica | nenhum; o laço mora no Hub, `C/apps/server/src/hub/copies/source-pass.ts:194-212`, `hub/connectors/copy-port.ts:243-315` | `TRM tap.py:455`, `:506-540`; `CDK .../concurrent_declarative_source.py:165` | remendo: TypeScript que fala Singer, porque o kit é TypeScript (0074) | 344 linhas, duas classes, 34 e 24 testes da bateria do singer-sdk 0.54.9 (estudo) | 0071 | U4 | `apps/extraction/tap/src/tap.ts` |
| 12 | A sessão do kit, no Hub e na tarefa: reusar, renovar antes do fim, deslogar | fica; vai para a etapa do conector | `C/apps/server/src/hub/connectors/limits.ts:127`; `read.ts:109-115`, `check.ts:43-48` | `singer-sdk@0.54.9 singer_sdk/authenticators.py:526-527`, `:609-619`, que sustenta só renovar quando o token não vale mais; a margem de 60 s, o logout da velha e a repetição vêm do Sankhya medido (P2), e não dele | remendo: a peça é do kit | A P2: 87 linhas, 4 renovações em 100 s, nenhuma sessão pendurada; o autenticador lido no singer-sdk 0.54.9 | 0077; A do conector | U16 | `packages/connectors/src/kernel/session.ts` |
| 13 | A classe da credencial, compartilhável ou exclusiva | fica; vai para a etapa do conector | nenhum | nenhuma faz como dado | remendo | O Sankhya: o token vence aos 300 s em uso, e duas sessões convivem (`docs/decisions/0077-how-a-credential-reaches-the-copy-task.md`) | 0077 | U16, U8 | — (muda `kernel/auth.ts`) |
| 14 | O número exato, do provedor ao lago | fica; o leitor vai para a etapa do conector | `C/apps/server/src/hub/connectors/wire.ts:71`; `kernel/list.ts:53-62` | `JSON.parse` com `context.source`, do Node 24; `singer-sdk@0.54.9 singerlib/json.py:40-44`; `DLT dlt/common/arithmetics.py:18-19` (o tipo `decimal(38, 9)` do destino: serve à U5, não ao leitor) | nativo nas pontas; embrulhado no meio | `1234567890123.123456` igual em `decimal(38,9)` (estudo, `numero-exato.txt`) | 0071; T.4 | U16, U5 | `packages/connectors/src/kernel/exact-json.ts` |
| 15 | O gravador: só acrescenta na bruta, em Iceberg | fica | nenhum | `singer-sdk@0.54.9 target_base.py:479-492`, `sinks/core.py:135`, `:475-506`; `pyiceberg@0.12.0 table/__init__.py:1705-1724`, `:1123-1158` | embrulhado | 165 linhas, 183 e 230 linhas gravadas, soma igual (estudo). Não provado no `S3 Tables`: L.1 | 0071 | U5 | `apps/extraction/src/conexus_extraction/target.py` |
| 16 | A marca da passada inteira | fica | `_pass`, `C/apps/server/src/platform/copy-sql.ts:287-301` | `singer-sdk@0.54.9 target_base.py:430-448`, `sinks/core.py:723-736`; `AP .../CatalogGenerationSetter.kt:36-47` | embrulhado | Local (estudo); na AWS, a fase 4 | 0080 | U4, U5 | — |
| 17 | O projeto do Meltano e o comando da rodada, com as tabelas escolhidas | refeita (uma rodada leva as tabelas marcadas) | nenhum | `meltano@4.4.1 meltano/schemas/meltano.schema.json:335-337`; `core/plugin/singer/tap.py:147` (a seleção), `:211-214`; `cli/run.py:48-126`, `:297-311` | nativo | A P1: 30 tabelas numa tarefa, 180 s (0076) | G | U5 | `apps/extraction/meltano.yml` |
| 18 | A cópia por ligação: as tabelas marcadas, o nome de cada uma e um intervalo; uma rodada aberta por ligação | refeita | `copies.copy` uma por tabela, com o relógio dela: `C/apps/server/src/hub/copies/tables.ts:39`, `C/apps/server/src/builder/copy-clock/clock.ts:14-25`; `copy_run_open_key`, `tables.ts:139` | Nekt: `trigger` da source, `sync_type` por tabela (`NK:20874-20897`, `NK:140802`); Nango, `tasks_one_active_per_schedule` (`REL` seção 3); `AP .../schema_dump.txt:194-217` | nativo (a seleção do `meltano run`) | A P1, 30 tabelas, 180 s (0076); os fechadores da P3 | G (b) | U7, U8 | `apps/server/src/hub/copies/lake-copy.ts` |
| 19 | Escolher o que copiar dentro do fluxo de ligar, nada marcado, e mudar depois na página da ligação | refeita (sai de Dados; entra na janela) | `C/apps/web/src/hub/copies/new-copy.tsx:66-118`; a janela, `C/apps/web/src/hub/connectors/link-dialog.tsx:202-221`; a ligação, `C/apps/web/src/hub/connectors/connection-page.tsx:275` | Nekt, Select streams e Customize streams (`MAPA` 1.1; `NK:12200-12215`), e o `update_source_streams` depois (`NK:12233-12236`); Databricks, Source no assistente (`MAPA` 1.2); `AP .../CatalogConverter.kt:389-397` | embrulhado (a janela de hoje, com os passos da spec 02) | — | K2, 2026-11-19; o fluxo, 2026-11-23 | U8, U9 | `apps/web/src/hub/connectors/link-window.tsx`, `lake-tables.tsx` |
| 20 | O "Onde guardar" e a marca **No lago** | sai do cartão | nenhum no main | nenhuma guarda a mesma tabela em dois lugares por escolha da pessoa | nativo, ao sair: um lugar só | — | Fundador, 2026-11-23 | nenhuma | — |
| 21 | O disparo: `iniciarRodada`, a mesma chamada do relógio e do **Rodar agora** | fica, por ligação | `C/apps/server/src/builder/copy-clock/clock.ts:12-25`; `workflow.ts:46-87`, que roda a cópia dentro do passo; `hub/copies/schedule.ts:84-86` (`NO_SCHEDULE`); `hub/copies/run.ts:41-47` | `@aws-sdk/client-ecs@3.1175.0 dist-types/models/models_1.d.ts:3243-3343`, `:2858`; as oito referências guardam a agenda no plano de controle (`REL` seção 3); `AP .../ConnectionManagerUtils.kt:286` | remendo, do 0076 | A P3, 22 testes; a P4, 19 cenários na AWS; `@aws-sdk/client-ecs` 3.1175.0 | 0076; G; Relógio | U8 | `apps/server/src/hub/copies/lake-run.ts` |
| 22 | O fim: o resultado e a parada numa fila; a varredura | fica | `ended`, `C/apps/server/src/hub/copies/run.ts:116-165` | a regra do EventBridge até a fila (P4); `@aws-sdk/client-sqs@3.1175.0 dist-types/models/models_0.d.ts:1373` | remendo, do 0076 | A P4 na AWS, aviso em 23,6 s na mediana. Não provado com o Meltano 4.4.1: L.3 | 0076 | U5, U8 | `apps/server/src/hub/copies/lake-queue.ts` |
| 23 | O segredo da rodada dentro da tarefa | fica | security S31, `C/docs/guides/security.md:120-125` | `meltano@4.4.1 core/plugin_invoker.py:276`; 0077 | embrulhado | O que o Meltano exporta (estudo); a P4 | 0077 | U5, U8 | `apps/extraction/src/conexus_extraction/entry.py` |
| 24 | A imagem da tarefa e quem a publica | fica | a imagem do Hub vai ao `ghcr.io`, `C/.github/workflows/publish.yml:73-110` | a imagem da P1: `python:3.13-slim`, Meltano 4.4.1, x86 | nativo | Não provado: Node e Python juntos: L.1 | 0074 | U5, U6 | `apps/extraction/Dockerfile` |
| 25 | A rede da tarefa até o sistema | fica | nenhum | as provas: sub-rede pública, IP público, sem NAT | nativo | Não provado: o Sankhya do fundador de dentro da AWS: L.2 | T.6 | U6 | `infra/aws/lib/copy.ts` |
| 26 | A plataforma da cópia: fila, tarefa, regra, rede; o depósito de imagens, na preparação | fica | nenhum | `aws-cdk-lib@2.278.0` `aws-ecs/lib/fargate/fargate-task-definition.d.ts`, `aws-sqs/lib/queue.d.ts`, `aws-events/lib/rule.d.ts`, `aws-ecr/lib/repository.d.ts` | nativo | À mão, `conexus-lab-trilho/fases2a4/plataforma.py:80-90` | 0073, 0076 | U6 | `infra/aws/lib/copy.ts`; o depósito, `infra/aws/lib/copy-preparation.ts` |
| 27 | A receita muda: o papel que escreve, as três travas, os lagos já criados | fica | `C/infra/aws/lib/platform.ts:114-123`, `:127`, `:139-144`; `preparation.ts:209-262`; `hub.ts:14-20` | 0073: "A change to every company is one `UpdateStack` each" | nativo | Não provado: o papel dentro da pilha, L.6 | E; T.5 | U6 | — |
| 28 | A camada atual: o atualizar, um caso por instrução | fica | nenhum | `AB .../JdbcSqlGenerator.kt:219-238`; `DLT dlt/destinations/sql_jobs.py:1120-1139` | remendo, do 0080 | 449 de 449 tabelas com diferença zero; a forma do airbyte 2.0.0 (`AB`) lida; o `MERGE` de dois casos falha de ~230 a ~337 colunas, o de um caso passa com 450 (`EST/achados-auditoria:49`, `:321`). Não medido na `TGFCAB` real: L.7 | 0080 | U10 | `apps/extraction/src/conexus_extraction/update.py` |
| 29 | O histórico da bruta: limpa até entrar na atual, em todas as tabelas, a dos dados da NF-e incluída | fica | nenhum | nenhuma faz a limpeza: na Nekt o histórico é um módulo opcional por tabela (`NK:8635`); no Databricks, SCD 2 por tabela (`MAPA` 1.2); o Airbyte guardava tudo; o `S3 Tables` guarda 120 h de fotos | remendo (a limpeza) | Não provado: L.7 (`docs/decisions/0080-copy-declared-per-table-raw-appends.md`) | A; o histórico do XML: sem histórico, 2026-11-24 | U10 | — (em `update.py`) |
| 30 | Onde fica o ponto de parada | fica | `C/apps/server/src/hub/copies/tables.ts:274-312` | `meltano@4.4.1 core/plugin/singer/target.py:100-120`; `core/state_store/filesystem.py:45`, `:191-228` | nativo | Local, em arquivo. Não provado no `S3`: L.4 | T.1 | U10 | — (muda `meltano.yml`) |
| 31 | A página Dados: lista, Visão geral, Colunas, Rodadas | refeita: a de hoje sai na parte 0 e a nova lê as tabelas do lago | `C/apps/web/src/hub/copies/` (3.389 linhas sem os testes); `copy-detail.tsx:105-109`, `:170-305`; `text.ts:88-89` | `AP .../locales/en.json:1088-1094`, `:577-578`; Nekt, `NK:22429-22431`; a captura `cloud-status-page.png` | embrulhado | As capturas do estudo | NT3; não precisa | U14, U8, U9 | `apps/web/src/hub/copies/lake-list.tsx`, `lake-detail.tsx` |
| 32 | Apagar o lago que tem tabela | fica | `C/apps/server/src/platform/aws.ts:279-296`; a AWS recusa a área com tabela (`C/docs/steps/trilhas/dados.md:78-80`) | `@aws-sdk/client-s3tables@3.1175.0` `ListTablesCommand.d.ts`, `DeleteTableCommand.d.ts` | nativo | Não provado: L.8 | o cartão da etapa 1 | U6, U8 | — |
| 33 | O login da empresa lê a linha do lago | fica | `C/apps/server/src/hub/lake/tables.ts:48-56`: só o operador | `GRANT SELECT (colunas)` e `CREATE POLICY` do PostgreSQL | nativo (data D10, D11) | — | H | U7 | a migração da U7 |
| 34 | O aviso de cópia parada, por ligação | fica de fora: o cartão do aviso (T.30); as duas tabelas sem uso saem na parte 0 | três tabelas sem uso, `C/apps/server/src/hub/notifications/tables.ts:154-234` | Databricks, o e-mail de falha no passo da agenda, por pipeline (`MAPA` 1.2); Nekt, "Email alerts" por fonte | remendo: um aviso por parada e um lembrete por dia, no cartão do aviso | Lido no airbyte-platform 2.0.0 (`AP`): nenhum lembrete nos dois módulos de aviso; o cartão do aviso traz o resto | C; o aviso, 2026-11-23 | U15 (as tabelas sem uso); o cartão do aviso | — |
| 35 | A lista de e-mails da empresa que recebe o aviso | sai: os e-mails passam a ser da ligação, no cartão do aviso | `alert_recipient`, `C/apps/server/src/hub/notifications/tables.ts:153-172`, sem rota nem tela | — | nativo, ao sair: os e-mails da ligação tomam o lugar | — | o aviso, 2026-11-23, substitui a I (a) | o cartão do aviso | — |
| 36 | O esquema `sync`, os logins `conexus_sync`, `conexus_read` e os por papel, e a D4 | sai na parte 0 (NT3) | `C/packages/hub-api/src/app-login.ts:30-40`; `C/apps/server/src/platform/copy-reader.ts:51-82` | PostgreSQL `DROP SCHEMA ... CASCADE` e `DROP ROLE` | nativo | — | D (a); NT3 | U14 (o código); o reajuste, passo 4 (as empresas) | — |
| 37 | As gravações das formas nativas | fica | 33 gravações em `C/apps/server/src/platform/recordings/aws/` | testing T14 e T29, `C/docs/guides/testing.md:57-70`, `:85-91` | nativo | Faltam: `RunTask`, a fila, o parâmetro, o Athena | — | U5, U8, U10 | `apps/server/src/platform/recordings/aws/ecs-*.json` e os outros |
| 38 | O método para Python | fica | nenhum | não estudado | nativo | — | 0074 | fica de fora: a mudança de método antes da construção | — |
| 39 | O nome de uma tabela no lago: sugerido do kit, trocável ao ligar, com prefixo, fixo depois | nova | `modelCopyName` e `copyPrefixOf` (`C/apps/server/src/hub/copies/naming.ts`; `C/packages/connectors/src/kernel/copy.ts:16-18`) | Nekt: o nome sugerido com o prefixo do conector, editável na criação ("We suggest a name, but feel free to customize it", `NK:177751`) e fixo depois ("a table name cannot be changed after it is created", `NK:12217-12220`), mesma situação; Nekt Protheus, `SC5` vira `sales_orders` (`NK:177792-177806`) | nativo: a forma da Nekt | — | Nome ("Aprovo"); NT2, NT4 | U3, U8, U9 | — (em `kernel/tables.ts` e `hub/copies/lake-copy.ts`) |
| 40 | O nome de uma tabela que o kit não declara | nova | nenhum | Nekt TOTVS RM, `dataserver_<name>` (`NK:178310`), mesma situação; Nekt Dynamics F&O, a entidade em snake_case (`NK:64505`) | nativo: o código da fonte | — | NT1 | fica de fora: etapa 6 (a regra está decidida) | — |
| 41 | A origem ao lado do nome | nova | nenhum | Singer: `table_name` no catálogo (`singer-sdk@0.54.9 singer_sdk/singerlib/catalog.py:310-324`, `:342`), que o SDK preenche só nos conectores de banco (`sql/connector.py:1081`; um fluxo de API escreve `None`, `streams/core.py:671`); Nekt, "SC5 - Pedidos de Venda" na doc (`NK:177792-177806`) | embrulhado: o adaptador escreve `table_name` com a origem | — | não precisa | U4 | — (em `tap.ts`) |
| 42 | O rótulo e a descrição da tabela | nova | o `label` do `CopyModel` e a `description` da v1 (`C/packages/connectors/src/kernel/copy.ts:66-79`, `:184`) | Nekt: "Add descriptions to tables and important fields" (`NK:405`); a doc de cada conector descreve cada fluxo (Protheus, `NK:177812`); Airbyte e Singer não têm descrição de tabela (`AP .../AirbyteStream.kt:35-52`) | embrulhado: do kit para as declaradas, da `DESCRTAB` para as outras | — | não precisa | U3, U8, U9 | — |
| 43 | O nome e a descrição das colunas | nova | os nomes da consulta do modelo (`C/packages/connectors/src/sankhya/copies.ts:135-147`) | Nekt Protheus: "Column names are the Protheus field names in lower case" (`NK:177778`), mesma situação | nativo: o `TDDCAM` no `--discover` | Medido antes no dublê (`EST/descoberta-catalogo:75-80`) | D4 de 2026-11-19 | U3, U4 | — |
| 44 | Agrupar as tabelas | nova | `subjects` das operações (`C/packages/connectors/src/sankhya/operations/index.ts:68-75`) | Nekt: pasta "by source, business domain" (`NK:76`); Airbyte agrupa por namespace (`AP .../streamUtils.ts:95-106`) | embrulhado: o `group` da tabela usa os assuntos do kit | — | não precisa | U3 | — |
| 45 | Duas ligações do mesmo sistema | nova | `copies.copy_source`, uma cópia lendo várias contas (INV §2.1) | Airbyte: um prefixo por conexão (`AP .../Mapper.kt:171-179`); Nekt: uma fonte por conta (`NK:131385`), o nome por fonte (`NK:177751`); Fivetran: um esquema por conexão (`EST/n5-duas-ligacoes`, seção 2) | embrulhado: uma tabela por ligação; a segunda vem sugerida com o nome dela, e o repetido é recusado | — | NT5; Nome | U8 | — |
| 46 | A definição única do conector | refeita | `C/packages/connectors/src/kernel/definition.ts:42-71` | Nango `c607ff39` (o da estante; o estudo `kit-vs-nango-study` leu `d6c912eb`, e o commit `e6c6131` que esta linha citava não foi achado), situação diferente: funções num executor (`EST/kit-vs-nango-study`, `EST/kit-nango:113-117`); "Um tap Singer é só um segundo executor das mesmas funções" (`EST/kit-nango:116`) | embrulhado (herdado, decidido) | Os 198 testes do kit (`EST/conector-estilo-novo-estudo`, seção 5) | 0056, 0069, 0071 | U16, U17, U18 | — |
| 47 | As leituras como ferramentas | fica | `C/apps/server/src/builder/connectors/typed-reads.ts:27-35`; `C/apps/server/src/builder/company-tools/search.ts:28-43` | `@mastra/core@1.83.0` `ToolSearchProcessor`, "gives the agent two meta-tools (`search_tools` and `load_tool`)", com `filter` por pedido; Nekt `discover_live_tools` e `run_live_tool` | nativo | — | não precisa | fica (a U17 e a U18 provam que as pastas novas as mantêm) | — |
| 48 | A escrita com o cartão | fica | `C/apps/server/src/hub/connectors/write.ts`, `write-record.ts`, `approval.ts` | `@mastra/core@1.83.0` `requireApproval` (`reference-tools-create-tool.md:79-81`), mesma situação; Nekt, "your agent confirms", situação diferente: quem confirma é o agente | embrulhado (o registro é nosso) | A etapa 24.5, fechada | 0062; e245 | fica (a U17 prova `lancarPedido`) | — |
| 49 | O Caderno | refeita: pede o sim; sai na etapa do Negócio | `C/apps/server/src/hub/connectors/notes.ts`; `C/apps/server/src/builder/connectors/connector-tools.ts:307-333` | Nekt: o agente "will typically offer to save a context document", e a pessoa aceita (`EST/ao-vivo-estudo:114`), situação diferente: a Nekt guarda o roteamento, e não um significado que todos os agentes usam | nativo: a suspensão do Mastra, `suspend()` e `resumeData` da própria ferramenta, como `askUserTool` (`M/packages/core/src/tools/builtin/ask-user.ts:98-122`) e `submitPlanTool` (`submit-plan.ts:78-128`), `@mastra/core@1.83.0`. O `requireApproval` não serve ao Assistente nem ao Builder: com `yolo: true` (0053) o controlador aprova sozinho toda porta de aprovação (`M/packages/core/src/agent-controller/session.ts:4815`, `:6638-6642`; `session-run-engine.ts:910`), e ligar `yolo: false` faria pedir toda ferramenta que o Mastra injeta fora de `spec.tools` (medido: `search_tools` trava o turno) e traria de volta a perda de retomada no Postgres que a 0053 evita | — | 0064 (`:30`); B do conector; o firstmate, 2026-11-24 ("B") | U19 | — |
| 50 | A skill do conector | refeita em parte | `C/packages/connectors/src/kernel/skill.ts`; `sankhya/skill/SKILL.md` à mão, que diz "There is no operation that writes" (`:14`) contra `lancarPedido` (`sankhya/operations/index.ts:62`) | Nekt: os nomes das ferramentas "can change, so an agent should resolve them at run time rather than hardcoding them into a skill" (`NK:12598-12600`), mesma regra: a Nekt resolve o nome na hora, e o kit gera a parte da skill | embrulhado: a parte gerada da definição, a escrita guarda o saber | O defeito lido | técnica (T.25) | U16, U17, U18, U3 | — (muda `kernel/skill.ts`) |
| 51 | A janela Ligar com a barra de passos, o acesso com a data inicial, testando e lendo, o que copiar, quando copiar e Ligado; o link de 30 minutos | refeita, nesta etapa | `C/apps/web/src/hub/connectors/link-dialog.tsx:272`; `integrations.tsx:94` | Nekt, o assistente e o Share link (`MAPA` 1.1, `EST/nekt-rea:83`); Databricks, "Save and run pipeline" (`MAPA` 1.2); Nango `connect_link`, 30 minutos (spec 02, `design.md:48`) | embrulhado | — | o fluxo e o link, 2026-11-23; spec 02 (`C4`, `C5`) | U9, U20 | `apps/web/src/hub/connectors/link-window.tsx`, `link-page.tsx`; `apps/server/src/hub/connectors/connection-links.ts` |
| 52 | A segunda forma, pelo servidor MCP do fornecedor | fica de fora | nenhum; `@mastra/mcp` não instalado | AWS AgentCore Gateway, Nekt, Databricks (`EST/registro-vs-lago-e-ao-vivo:505-512`) | embrulhado, na etapa própria | — | `C1` (a), `C2` (a) de 2026-11-21 | fica de fora: a etapa "A ferramenta ao vivo, por pessoa e por MCP" | — |
| 53 | As pastas do Sankhya e do Mercado Livre | refeita do zero | `C/packages/connectors/src/sankhya/`, `mercado-livre/` (INV §1.3, §1.4) | A Nekt tem Protheus, RM, Omie e Mercado Livre feitos por ela (`EST/connector-catalog-study:156`); nenhuma referência tem o Sankhya | embrulhado: a forma do kit | Os testes de hoje pela porta pública, sem mudar o que esperam | A do conector | U17, U18 | — (as mesmas pastas, escritas de novo) |
| 54 | As peças do Hub que já são o decidido: o executor, o envio, o teto, o login por autorização, **Testar**, o funil de escrita, o app e a ferramenta em código lendo ao vivo | fica | `C/apps/server/src/hub/connectors/executor.ts`, `send.ts`, `read.ts`, `sign-ins.ts`, `connections.ts`, `testing.ts`, `check.ts`, `app-calls.ts`, `tool-door.ts` | 0056, 0057, 0058 (herdado); "O funil de escrita do Conexus é mais completo que o de qualquer plataforma de ferramentas lida" (`EST/registro-vs-lago-e-ao-vivo:487`) | embrulhado (herdado, decidido) | O CI do `main` | A do conector | fica (a U16 muda só a sessão e o número exato nelas) | — |
| 55 | A Fábrica de conectores | fica de fora | nenhum | — | embrulhado, na etapa do TOTVS | "Not proved" (`C/docs/decisions/0069-connectors-one-source-the-kit.md:29`) | A do conector: provada no TOTVS | fica de fora: a etapa do TOTVS | — |
| 56 | A primeira carga ao salvar | nova | `enable.ts:166-170`, no histórico: a primeira rodada sai sozinha | Nekt: a fonte rodou sozinha ao ser criada, vista duas vezes (`MAPA` 1.1, linha 8); Databricks, "Save and run pipeline" | nativo | — | o fluxo; F1 | U8, U9 | — |
| 57 | Só manual | nova | `clock.ts:140-144`, a linha pausada, no histórico | Nekt, o gatilho Manual, "Runs only when you start it manually" (`NK:22519`); Airbyte guarda o Manual como um tipo de agenda (`REL` seção 3) | nativo | — | Intervalo | U7, U8, U9 | — |
| 58 | O intervalo: 24 h de padrão, de 15 min a 24 h | refeita | `COPY_INTERVAL_DEFAULT = '30m'`, `C/packages/hub-api/src/copies.ts:20-22` | Nekt: o gatilho vem em Schedule, todo dia (`EST/referencias-testes-nekt:140`) | nativo | — | Intervalo | U7, U9 | — |
| 59 | O tamanho da máquina por rodada | nova | nenhum | `@aws-sdk/client-ecs@3.1175.0`, `TaskOverride` `cpu` e `memory` no `RunTask`; Nekt, 1 vCPU e 2 GB por fonte (`EST/nekt-velocidade`, `resultado.md:5`) | nativo | A P1: 588 s com 1 vCPU, 180 s com 2 (0076) | Máquina | U6, U8 | — |
| 60 | A poda do rastro do Mastra | nova | `C/apps/server/src/builder/conversation/storage.ts:22-28`, só a observabilidade | `@mastra/pg`, a política `triggers` do domínio `schedules` (`REL` seção 1, `NM/@mastra/pg/dist/index.js:23150-23152`); a política `workflowSnapshot` não filtra pelo workflow (`NM/@mastra/core/dist/storage/retention.d.ts:144`, `:149`) e apagaria as execuções das automações, que o Hub lê (`C/apps/server/src/builder/automations/runs.ts:150`): as do workflow da cópia saem pelo nome | nativo nos disparos; embrulhado nas execuções | — | Relógio | U8 | — |
| 61 | O intervalo contado da hora de ligar | nova | o mapa fixo `clock.ts:15-22` (`*/15`, `0 3 * * *`), que só se apoia em "implementado assim" | Nango, `starts_at + k × frequency`; Airbyte, da última rodada (`REL` seção 3) | embrulhado: o cron do Mastra com o minuto e a hora da ligação | — | Relógio | U8 | — (em `builder/copy-clock/`) |
| 62 | Uma partida por vez | nova | nenhum | Prefect, `concurrency_limit` com `ENQUEUE`; Dagster, a fila por etiqueta (`REL` Apêndice A); a cota de 3 `PutParameter` por segundo (`REL` seção 2) | embrulhado: uma fila no Hub antes do `PutParameter` | Não provado: 1.100 disparos contra o dublê do SSM (`REL` seção 4); L.9 | Relógio | U8 | — (em `lake-run.ts`) |
| 63 | O texto longo e o binário pelo tipo que a descoberta lê, para todo conector; o XML da NF-e como coluna de texto | nova | `copy-read.ts` lê só as colunas declaradas; a A0d excluía LOB (`EST/a0d-sankhya-kit-mes:42`) | Nekt, fonte Oracle: o `CLOB` "as standard strings" e o binário em hexadecimal (`NK:132602`); Airbyte Oracle, `clob` e `blob` viram `string` (`ARQ` seção 0); Iceberg, o tipo `binary` (`pyiceberg@0.12.0`, `BinaryType`); o Athena lê até 32 MB numa linha (PS4) | nativo | Não provado: PS1, PS2, PS4 | XML; "E, não, beleza" | U3, U4, U5 | — (no mapa dos tipos de `sankhya/copy-tables.ts` e em `target.py`) |
| 64 | A origem e o rótulo no catálogo do lago | nova | nenhum | Iceberg, as propriedades da tabela (`pyiceberg@0.12.0`, `create_table(properties=...)`); Nekt, "Add descriptions to tables" (`NK:405`) | nativo | — | Nome | U5 | — (em `target.py`) |
| 65 | Uma descoberta só, para a janela e para o catálogo da tarefa | nova | nenhum | Nekt: a validação descobre os streams, e a escolha é o `selected` do catálogo (`MAPA` 1.1, 3b e 4; `NK:12198-12203`); Singer `--discover` | nativo (o `--discover`); a janela chama a mesma função | — | o fluxo | U3, U4, U8 | — (`discoverTables` em `kernel/tables.ts`) |
| 66 | A janela por mês | nova | só a janela junto da coluna de alteração (`EST/a0-alteracao-fiscais:66-68`) | singer-sdk: sem chave de replicação, passada inteira; a skill da AWS: trocar a partição (`EST/a0-alteracao-fiscais:166`, `:169`) | remendo (a extensão nossa da 0080) | A A0D: 3.140 linhas/s por mês, contra 442 sem janela (`EST/a0d-sankhya-kit-mes:93-106`); `singer-sdk@0.54.9` não tem modo de janela, e o `meltano@4.4.1` guarda o ponto de cada fluxo | Completo; A0-n, A0-c | U3, U4, U10 | — |
| 67 | As 49 tabelas do Sankhya, núcleo, fiscal e contábil | nova | cinco modelos de consulta, `C/packages/connectors/src/sankhya/copies.ts:89-155` | Nekt: uma lista fixa por ERP de API, Protheus e TOTVS RM (`EST/conector-estilo-novo-estudo:44-51`) | embrulhado: a lista do kit | As 42 contadas no dicionário (`SK` seção 3.1); faltam a P1 e a P2 | Completo | U3 | — (em `sankhya/copy-tables.ts`) |
| 68 | Ler o XML em linhas (`nfe_notas`, `nfe_itens`) | fica de fora | nenhum | Databricks, `read_files(format => 'xml')` (`ARQ` seção 7) | embrulhado, na etapa nova, com uma biblioteca do XSD oficial | — | XML: "Etapa própria, depois da 3" | fica de fora: a etapa nova da trilha | — |
| 69 | Todas as colunas, atuais e futuras | nova | nenhum | Databricks: "By default, managed connectors in Lakeflow Connect ingest all current and future columns" (`MAPA` 1.2); Nekt, "Auto-add fields" ligado (`MAPA` 1.1); `pyiceberg@0.12.0`, `update_schema().union_by_name`; o `SCHEMA` novo do Singer a cada rodada | nativo | — | o desenho, área 4; K3 | U5, U10 | — (em `target.py` e `update.py`) |
| 70 | O arquivo no lago, ligado à sua linha | fica de fora | nenhum | Nekt, o volume ao lado das tabelas (`NK:441-460`) e a tabela de metadados por fonte; Databricks, o volume e `binaryFile`; Airbyte, `file_reference` (`LAK` 1.7, 2.2) | embrulhado, na etapa 3a | PF1 a PF6 e PM1 (`LAK` seção 5); a PS1 nesta etapa | Arquivos: "F1. A F2. A" | fica de fora: a etapa 3a | — |
| 71 | A data inicial da cópia: vazia é todo o histórico; onde se escolhe | nova | nenhum: o `main` não tem data inicial; o cartão de antes copiava tudo | Nekt: vazio é todo o histórico nos ERPs (`NK:177729`, `NK:152856`); a data no passo do acesso (`NK:177721-177729`); Airbyte: na especificação da fonte (`AB@82db089b source-netsuite/source_netsuite/spec.yaml:54-60`, `source-xero/manifest.yaml:505-530`); as fontes de banco do Airbyte não têm data (`source-postgres/.../PostgresSourceConfigurationSpecification.kt:69-482`) | embrulhado: a data se escolhe no Acesso e na seção de mudar, e é gravada na cópia, e não na ligação, porque o acesso vai pelo link (U20) e a ligação serve também às leituras ao vivo (T.42) | — | Data | U7, U8, U9 | — (`lake_copy.start_date`) |
| 72 | O que a data limita e por qual coluna | nova | nenhum | `singer-sdk@0.54.9 singer_sdk/streams/_state.py:145-150` (a passada inteira ignora), `:156-167` (a semente da chave), `sql/stream.py:195-206` (`>=`); Nekt SAP Business One, a mesma situação: documentos "created or changed on or after", pagamentos e lançamentos "posted on or after" porque "have no update date" (`NKH:156072`, `:156133`); a alteração em Omie, Nomus, BomControle, Sienge, Bling, Varejo Online (`NKH:134107`, `:127753`, `:39735`, `:162837`, `:38373`, `:186780`); a data do documento só sem coluna de alteração: WK Radar (`NKH:192194`), Protheus inteiro (`NKH:180968`); Omie, os cadastros inteiros (`NKH:134107`) | nativo (a `start_date` do Singer, na coluna do modo), com o cadastro da Nekt; a janela por mês desde a data segue a linha 66 | — | Data | U3, U4 | — (`startDateLimits` em `kernel/tables.ts`) |
| 73 | Mudar a data numa ligação que copia, e ler de novo desde ela | nova | nenhum | `singer-sdk@0.54.9 streams/core.py:441-462` (o maior; rodado: a mais antiga não muda o início); `meltano@4.4.1 meltano/core/plugin/singer/tap.py:276-281` (`--full-refresh`), `cli/state.py:439-470` (`state clear`), e o guia: "you need to perform a full refresh"; `AB@82db089b docs/platform/using-airbyte/getting-started/add-a-source.md:32-42` (editar só testa), `operator-guides/refreshes.md:7`, `:26`, `:36-48`, `docs/integrations/sources/linear-migrations.md:25`; `airbyte-cdk@6.61.6 .../concurrent/state_converters/datetime_stream_state_converter.py:79-94` (rodado: o estado sequencial não relê; o Salesforce, não sequencial, relê a fatia, `source-salesforce/source_salesforce/streams.py:99`); Nekt: "moving it back changes nothing while a newer bookmark exists. To backfill older data, run a **Full Sync**" (`NKH:150766`), o full sync troca a tabela (`NKH:22494`, `:117134`), o disparo com `full_sync` e `selected_streams` (`NKT:92-102`) | embrulhado: gravar só grava; **Ler de novo desde a data** pede `whole` das tabelas que a data limita pela porta do **Rodar agora** (T.39); a passada inteira troca a atual (linha 28) | — | Data | U8, U9, U10 | — |
| 74 | A barra de passos da janela Ligar | nova, a única peça nova de `ui/` | nenhum: a janela de hoje não mostra os passos | Nekt, a barra de passos do assistente ("Setup access / Select streams / …", `MAPA` 1.1; a captura `nekt-01-acesso-oauth-e-data-inicial.png`); Databricks, a coluna de 5 passos (`MAPA` 1.2) | embrulhado: a peça `StepBar` de `ui/`, só a barra, com o visto, o aro do passo atual e `aria-current="step"`; a 390 px vira "Passo n de 4 · <nome>" | O protótipo da janela, 172 capturas a 1366 e 390 px nos dois temas. Não provado: o teclado e o leitor de tela, que a U9 prova (critério 54) | O protótipo, "Aprovo" (2026-11-25); a regra V62 no `DESIGN.md` | U9 | `apps/web/src/ui/step-bar.tsx` |

**A medida do transplante.** Nenhum código do repositório antigo entra, e nenhum código de hoje
das pastas que saem é trazido (o fundador, 2026-11-23: "Eu quero refazer, eu não quero utilizar nada
que está feito como atual").

- O adaptador e o gravador da sonda do estudo (`sondas/adaptador-duas-classes/`) e a sonda do
  dicionário (`EST/descoberta-catalogo:75-80`) são ponto de partida, e não transplante: cada um foi
  escrito do zero sobre a base da sua biblioteca, e a unidade os reescreve contra os contratos deste
  cartão.
- As pastas do Sankhya e do Mercado Livre (U17, U18) são escritas de novo, na forma do kit, da
  documentação de cada sistema e das gravações. A pasta de hoje é lida só como inventário: os ids, as
  entradas, as respostas e as recusas que os testes de hoje esperam. Ficam, sem reescrever, os
  dublês e as gravações, que são a prova (T.27).
- A leitura de uma tabela do Sankhya (U3) é escrita sobre a porta de consulta da pasta nova. O
  `copy-read.ts` de hoje, que a U1 tira, fica no histórico só como leitura.

**A dívida.**

- A imagem em ARM, para medir depois (T.6).
- A bateria não renova a chave do dublê do HubSpot, que invalida a anterior a cada renovação: a
  renovação na tarefa fica provada só no Sankhya até a etapa 5.
- O texto da 0076 sobre o token de 32 caracteres e a frase da 0078 sobre quem tem credencial da AWS
  (T.3, T.8); a 0063, cujos modelos saem na parte 0: o fechamento da etapa os corrige.
- O Caderno sai na etapa do Negócio (0064, B do conector); até lá, as anotações de antes desta etapa
  ficam, marcadas "Gravada sem aprovação".
- O `connector_read` genérico do ajudante de pesquisa, do Builder e do Construtor fica ao lado das
  leituras tipadas do Assistente (`EST/ao-vivo-estudo:149`); a H2b da outra trilha segue aberta.
- O texto da 0076 sobre o relógio e o tamanho da máquina: o fechamento acrescenta que o relógio só
  diz "quando", com o intervalo contado da hora de ligar, e que as rodadas seguintes à primeira carga
  rodam com 1 vCPU e 2 GB (Relógio, Máquina).
- A regra de 2026-11-19 sobre os anexos, que o XML no lago mudou: o fechamento corrige o texto (`ARQ`
  seção 6). A frase da 0065 "Connector data never enters the Brain" e "abrir o arquivo de uma linha"
  na 0079 entram com o cartão da 3a (`LAK` seção 3).
- Um `RunTask` sem resposta repete com o mesmo token. Por quanto tempo a AWS guarda o token não foi
  lido: a U8 lê no tipo instalado e, se for menor que a espera da repetição, para.

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| T.1 | O ponto de parada no depósito `S3` nativo do Meltano, num depósito da plataforma, com um prefixo por empresa que só o papel dela lê e escreve | A peça nativa: salva a cada linha de estado (`meltano@4.4.1 core/plugin/singer/target.py:100-120`) | Trocar `state_backend.uri` e passar o estado pelo parâmetro e pelo resultado |
| T.2 | A cópia do lago mora em quatro tabelas novas do esquema `copies` (`lake_copy`, `lake_table`, `lake_run`, `lake_table_run`), escritas do zero | As de hoje saem na parte 0 (NT3), e a forma delas é a de uma cópia por tabela, com o relógio dela. As quatro novas são a forma do Airbyte: a conexão, o fluxo e a rodada (`AP .../schema_dump.txt:194-217`, `:629-639`) | Uma migração que renomeie as tabelas |
| T.3 | Quem roda o atualizar é a tarefa, depois da carga, com o papel que escreve | Um ator e um papel; o papel do Hub continua sem escrever no lago. A frase da 0078 (`C/docs/decisions/0078-how-the-lake-knows-who-reads.md:12`) fala de quem lê; o fechamento acrescenta a linha | Mover a chamada para o Hub, com o Athena no papel dele |
| T.4 | O dinheiro sem precisão declarada vira `decimal(38, 9)`; um valor que não cabe derruba a rodada | O padrão do dlt (`DLT dlt/common/arithmetics.py:18-19`) | Mudar o padrão recria a coluna |
| T.5 | Os lagos que já existem são apagados e criados de novo pelo botão da Central, depois da segunda preparação | Estão vazios; não há `UpdateStack`, e o papel do Hub o nega (`C/infra/aws/lib/hub.ts:14-20`) | Construir o `UpdateStack` nesta etapa |
| T.6 | A tarefa em sub-redes públicas, IP público, sem NAT; x86. A definição tem 1 vCPU e 2 GB; o Hub pede 2 vCPU e 4 GB pelos `overrides` do `RunTask` quando a rodada leva uma tabela recém-marcada; uma tabela cujo ponto de parada se perdeu relê inteira com 1 vCPU, porque o Hub não lê o estado | A 0076: "2 vCPU starts the first load"; o fundador: "2 vCPU na primeira carga", e 1 vCPU e 2 GB nas seguintes, o tamanho da Nekt. A forma medida: 30 tabelas em 180 s com 2 vCPU, 588 s com 1 (P1). A cota de vCPU do Fargate da conta de laboratório é 4 (`EST/fases-2a4:66`): duas primeiras cargas de uma vez | Trocar a sub-rede, a arquitetura ou os números na definição e em `lake-run.ts` |
| T.7 | O gravador sobre a base do singer-sdk | A base já dá o laço, o lote, o estado depois de gravar, as colunas `_sdc_*` e o decimal | Voltar ao laço escrito à mão das provas |
| T.8 | O `clientToken` é a rodada e a tentativa, até 64 caracteres; o `startedBy` leva a rodada | O limite de 36 é de `StartTask` (`@aws-sdk/client-ecs@3.1175.0 dist-types/models/models_1.d.ts:3315`, `:3330`, `:3407`) | — |
| T.9 | Um cartão em três partes, cada uma usada pelo fundador, e não três cartões; a parte 1 inteira se publica junta, no fim do G5 | O total, ~17.840, passa a delivery L2 ("should"), mas ~8.000 são linhas tiradas na parte 0 e nenhum pull request de construção passa de ~4.000. A parte 1, ~6.550, passa das ~4.000 de uma parte usada sozinha: o desenho confirmado põe a janela e o "só o que mudou" juntos, para a primeira ligação já rodar de 15 min a 24 h, e a janela sozinha mostraria uma cópia que relê tudo a cada rodada. O aviso sai para o cartão seguinte (T.30). As decisões valem para as três, respondidas juntas em 2026-11-23 | Dividir o arquivo em cartões, com as mesmas unidades; os gatilhos estão no orçamento |
| T.10 | O adaptador mora em `apps/extraction/tap/`, um pacote TypeScript do espaço de trabalho, ao lado do projeto Python | A trilha diz que `apps/extraction/` guarda "o tap gerado do kit" (`C/docs/steps/trilhas/dados.md:135-136`) | Mover para `packages/` |
| T.11 | O parâmetro da rodada leva a especificação inteira (`CopyTaskSpec`), com o nível `Intelligent-Tiering` do Parameter Store: padrão até 4 KB, avançado até 8 KB; as colunas, a chave, o modo e o rótulo não vão nele, a tarefa os descobre | Um lugar só para o que a tarefa recebe, cifrado. Com as 42 tabelas marcadas, a especificação vai de ~3,0 a ~4,7 KB (a leitura independente fez a conta); o nível que escolhe sozinho é a forma nativa, e o parâmetro avançado vive só durante a rodada | Passar a lista das tabelas pelo ambiente da tarefa e só o segredo pelo parâmetro |
| T.12 | Uma rodada aberta há mais de 48 horas é fechada pela varredura como `COPY_TASK_LOST`, mesmo sem resposta da AWS | A primeira carga das 42 tabelas foi estimada entre 5,7 e 17,2 h, com um pior caso de ~42 h (`SK` 3.3); 48 h é teto de folga (code C26), e a varredura fecha antes pelo estado da tarefa na AWS | Mudar a constante |
| T.13 | Os códigos novos: de rodada, `COPY_LAKE_UNAVAILABLE`, `COPY_TASK_LOST`, `COPY_LAKE_WRITE_FAILED`; de gravar a cópia, `COPY_LAKE_NOT_READY`, `COPY_RUN_OPEN`, `COPY_NAME_TAKEN`, `COPY_NAME_INVALID`, `COPY_NAME_FIXED`, `COPY_TABLE_NOT_DECLARED`, `COPY_START_DATE_INVALID`; do link, `LINK_NOT_FOR_SIGN_IN` (spec 02) | Cada um tem uma frase diferente na tela e um dono diferente | Fundir códigos |
| T.14 | A mensagem que falha três vezes vai à fila de mortos, lida só pelo firstmate | A forma da P4; um fim perdido é fechado pela varredura | Mudar o `maxReceiveCount` |
| T.16 | O nome sugerido é o do kit com o prefixo do conector (`sankhya_notas`); se outra tabela da empresa já tem esse nome, a sugestão leva o nome da ligação, `<conector>_<ligação>_<nome>`, com a ligação em minúsculas sem acento e cortada para o todo caber em 60. A pessoa troca a parte depois do prefixo; o prefixo vale para todas as tabelas novas da janela | O fundador: "a segunda ligação já vem sugerida com o nome dela e nome repetido é recusado" (2026-11-23). O corte que o estudo das duas ligações não provou (`EST/n5-duas-ligacoes`, seção 5) deixa de pesar, porque o nome é sugestão e a pessoa o troca. A recusa da segunda ligação até a etapa 5 cai | Mudar a regra da sugestão em `lakeNameOf` |
| T.17 | Sem a passada inteira de domingo: a tabela só do que mudou lê inteira, desde a data inicial quando há uma e a tabela é de movimento, só na primeira vez, quando o estado se perdeu, quando ela não tem coluna de alteração e quando alguém clica **Ler de novo desde a data** (T.45); a de janela relê o mês corrente e o anterior; a inteira lê tudo a cada rodada (0080) | A passada de domingo existe só porque o motor de hoje a tinha (`clock.ts:24-25`); o que sumiu da fonte numa tabela só do que mudou é a pergunta da etapa 7 | Um relógio semanal da ligação com `whole` |
| T.18 | Desmarcar com a rodada aberta é recusado (`COPY_RUN_OPEN`), em vez de parar a rodada das outras tabelas | Uma rodada leva as tabelas da ligação (G); parar uma para tirar outra perde a carga das que ficam | Parar a tarefa e reabrir a rodada sem a tabela |
| T.19 | A linha do lago em `ready` é relida da AWS antes de marcar a primeira tabela de uma empresa, pelo estado da pilha | É a primeira etapa que usa o lago, e a trilha manda escolher quando reler (`C/docs/steps/trilhas/dados.md:84-88`); reler antes de agir é a forma do exemplo serverless da AWS | Reler por um relógio |
| T.20 | As tabelas das cópias de hoje saem num pull request próprio, o G0c, depois de a versão do G0b estar no ar | Um `DROP` só entra quando nenhum código no ar lê a tabela (data D6), e a mudança de permissões vai num pull request só dela, com a palavra do fundador (data D11). A NT3 manda tirá-las na parte 0 | Deixar as tabelas vazias até a etapa 4 |
| T.21 | A etapa O conector no padrão novo é uma seção deste cartão, com os seus grupos, critérios e passos do roteiro, e não um cartão próprio; o roteiro da trilha a nomeia como etapa | `docs/steps/` guarda um cartão por trilha (delivery L5), e a etapa fica entre a parte 0 e a parte 1 desta: um cartão próprio pararia este no meio da construção, e a L1 pede uma etapa em construção por trilha. As decisões A, B e C do conector e as NT1 a NT5 valem para as duas, respondidas no mesmo dia | Tirar a seção para um cartão próprio, num rascunho, com as mesmas unidades |
| T.22 | O esquema `sync` e os logins de cada empresa saem pelo firstmate, com a palavra do fundador, no passo 4 do reajuste, e não por código do Hub | A U14 tira todo código que abre esses logins. Um código que os tirasse teria de abrir o banco de cada empresa ao subir, contra a data D27, e só roda uma vez. A forma é a da consulta do reajuste, que o firstmate já roda, e cada instrução tem `IF EXISTS` | Uma rota do operador na Central que faça o mesmo por empresa |
| T.24 | A lista e a página de uma tabela em Dados são escritas de novo sobre um contrato novo (`LakeTableSummary`, `LakeRun`), e não sobre o `CopySummary` | O contrato das cópias sai com as tabelas dele na parte 0 (NT3), e nenhum código pode ler uma tabela tirada (data D6) | Manter o contrato das cópias até a parte 1 e tirar as tabelas depois da U8 |
| T.25 | A skill de cada conector tem uma parte gerada da definição (os assuntos, se escreve, as tabelas) e uma escrita à mão (o saber); nenhuma das duas nomeia ferramenta | A frase escrita à mão se desencontrou da definição (`C/packages/connectors/src/sankhya/skill/SKILL.md:14` contra `operations/index.ts:62`); a Nekt manda achar as ferramentas na hora (`NK:12598-12600`) | Voltar ao texto à mão |
| T.26 | O sim do Caderno vem pelo cartão de aprovação da conversa, e quem aprova precisa gerenciar ligações (`manageConnections`), conferido na mesma transação da gravação | É a regra que `notes.ts` já usa para o Assistente (`C/apps/server/src/hub/connectors/notes.ts:71-80`), agora sobre quem aprova; o cartão é o da escrita (e245) | Aprovar pela página da ligação, fora da conversa |
| T.27 | Os dublês e as gravações do Sankhya e do Mercado Livre ficam e não são reescritos com as pastas; mudam só onde um critério pede (o 15, o 16 e a `TGFCAB` larga da U3) | São a prova de que a pasta nova se comporta como a de hoje; reescrever os dois juntos não provaria nada | Reescrever os dublês num pull request depois |
| T.28 | O GC1 leva as peças do kit (U16) e o Sankhya (U17) num pull request só; o GC2, o Mercado Livre; o GC3, o Caderno | Um pull request por conector (C do conector); a sessão, a classe e o número exato nascem com o primeiro conector que os usa (code C75) | Separar a U16 num pull request próprio (o gatilho do orçamento) |
| T.30 | O aviso de cópia parada sai deste cartão para um cartão próprio, escrito logo depois deste ser aprovado, com as unidades U11 a U13 e os critérios 62 a 69 refeitos por ligação, e os e-mails no passo Quando copiar da janela | O gatilho do próprio cartão: a parte 1 passa de 4.000 (orçamento). O desenho que o fundador confirmou já dizia "o aviso vira um cartão próprio logo depois, com as mesmas unidades". A decisão C (a) e o "Por ligação, na janela" vão com ele | Trazer as unidades de volta como parte 2 deste cartão |
| T.31 | As 49 declarações do Sankhya moram na U3, com o contrato da declaração, e não na U17 | O contrato entra com o seu primeiro implementador (`conexus-scope`, passo 4); a U17 refaz a pasta com as leituras ao vivo, e o contrato da declaração nasce na parte 1. O desenho descrevia a etapa do conector crescendo com o completo; a mudança é de ordem das unidades, sem tela nem escolha da pessoa | Mover a lista para a U17, com o contrato antes dela |
| T.32 | Uma partida por vez: `iniciarRodada` põe a partida numa fila do Hub, que grava os parâmetros a no máximo 3 por segundo | A cota de `PutParameter` é de 3 por segundo por conta (`REL` seção 2), e o fundador aprovou "uma partida por vez" no Relógio | Gravar em paralelo com a repetição na cota, a forma da versão anterior |
| T.33 | A seção de uma ligação sem cópia abre a mesma janela em **O que copiar**, para quem fechou a janela no meio ou ligou pelo link; nesse caminho, que pula o Acesso, o campo **Desde** aparece no alto de **O que copiar**, com o mesmo texto de ajuda e a mesma recusa de data depois de hoje (o fundador, 2026-11-25: "3. A") | A spec 02: "Fechar no meio deixa a ligação feita e nenhuma cópia: a pessoa retoma" (`design.md:179`); uma janela só para os dois caminhos | Retomar só pela seção, sem a janela |
| T.34 | A `sankhya_notas_nfe` é inteira, pela A0-c, sem histórico (o fundador, 2026-11-24, 16:19Z: "Outra coisa sobre o histórico de NFE, vamos deixar sem o histórico, porque eu acho que o jeito que você está querendo montar o histórico não é como as referências fazem."): cada passada entra na bruta, e a limpeza roda nela como nas outras. Antes da U3, o firstmate leva ao fundador o tamanho que a PS1 e a PS2 medirem e quanto a bruta dessa tabela cresce por mês com a passada diária; o cartão não decide isso | A A0-c pôs a `TGFNFE` em passada inteira ("passada inteira nas cinco"); o XML soma de 0,8 a 5 GB à tabela (`ARQ` 4.4, inferido), e a bruta, sem limpeza, guarda cada passada. Ler só as notas novas pelo `NUNOTA` perderia o cancelamento, que muda a nota depois | Declarar a tabela só do que mudou pelo `NUNOTA`, com uma passada inteira rara |
| T.35 | A `TCBLAN` vai em janela por mês de uma data dela, se a P5 achar uma; senão, inteira, como a 0080 manda | Inteira, ela custa de 0,3 a 2,4 h por rodada (`SK` 1.3); a janela é um dos modos da 0080 | Declarar a `TCBLAN` inteira |
| T.36 | O tipo da coluna sai da descoberta, para todo conector: `CLOB`, `NCLOB` e `LONG` como texto; `BLOB`, `RAW` e `LONG RAW` como o tipo binário do Iceberg (o leitor manda o binário em base64 com `contentEncoding`, e o gravador o grava como bytes). O kit pode declarar o significado de uma coluna só como metadado (`NFE_XML`). Uma linha perto do limite de 32 MB do Athena (PS4) para a U3; o binário muito grande vai ao depósito de arquivos por uma regra de tamanho, na etapa 3a (0071) | A forma da Nekt e do Airbyte para o Oracle (`ARQ` 4.2), com o tipo binário do Iceberg no lugar do hexadecimal, que dobra o tamanho; o firstmate, com a palavra do fundador, 2026-11-23 ("E, não, beleza") | Copiar o binário como hexadecimal na linha |
| T.37 | O intervalo tem os seis valores de hoje mais **Só manual** (`MANUAL`), e o padrão é 24 h | Os valores são os de `CopyInterval` (`C/packages/hub-api/src/copies.ts:20`); o padrão é a palavra do fundador | Mudar a lista em `LakeInterval` |
| T.38 | A hora de partida é `lake_copy.created_at`, a hora em que a pessoa clicou **Ligar e copiar agora**; mudar o intervalo não a muda | O fundador: "o intervalo contado de quando a ligação foi feita" (Relógio); a cópia da ligação nasce nesse clique | Ancorar em `connection.created_at` |
| T.39 | Gravar a cópia com uma tabela nova dispara na hora uma rodada da ligação, que lê inteira só a nova; a página de uma tabela mostra o tipo da rodada daquela tabela (`lake_table_run.whole`) | A Nekt aplica a tabela nova na fonte viva, e ela começa lendo tudo (`MAPA` 1.3); disparar na hora é o "a primeira carga sai na hora" da janela, para a tabela nova | Esperar o relógio |
| T.40 | A U3 acrescenta ao Sankhya os assuntos `fiscal` e `contabil`, com o rótulo e a parte da skill; as tabelas usam os assuntos de hoje (`cadastros`, `produtos`, `vendas`, `estoque`, `financeiro`, `precos`, `logistica`, `C/packages/connectors/src/sankhya/operations/index.ts:68-75`) e esses dois | O grupo de uma tabela é um assunto do conector (critério 10), e o completo traz o fiscal e o contábil ("Sim, núcleo+fiscal+contábil") | Agrupar as fiscais e contábeis num assunto de hoje |
| T.41 | Esta etapa não fecha porta para os arquivos. Antes da U3, o firstmate fixa o teto da coluna binária na linha, do maior valor que a PS1 medir e do limite de 32 MB da PS4. Uma coluna acima do teto, uma `BFILE` ou a coluna do XML que não for de texto param a U3 naquela tabela, e o firstmate leva ao fundador a coluna e o maior valor, como na T.34; o cartão não decide. A tabela de anexos do Sankhya fica para a 3a. O resto deixa a porta aberta: as colunas `_` continuam do motor (`C/packages/connectors/src/kernel/copy.ts:145-151`, que a U3 leva para `tables.ts`, critério 10); as propriedades `conexus.*` já estão no catálogo; a 3a acrescenta `parent?` e `file?` à `TableDeclaration` sem tocar `TableMode` (a U3 não os cria), e as colunas `_arquivo_*` entram como coluna nova (critério 105). O depósito de arquivos entra na pilha de cada lago pela 3a: hoje o Hub não tem `UpdateStack` (T.5, `C/infra/aws/lib/hub.ts:13-19`), e somar o depósito a um lago que existe não foi provado (`LAK` PF4); se não der, os lagos da etapa 2 são criados de novo e refazem a primeira carga | Uma coluna binária grande na linha é a única porta que esta etapa pode fechar: acima do teto, o arquivo mora no depósito, e trocar a forma de uma coluna que já tem linhas pede refazer a tabela (`LAK` 1.1, seção 4, inferido). Abaixo do teto, o binário na linha é a regra do fundador ("E, não, beleza"); o fundador, "F1. A F2. A" | Declarar a coluna grande na linha; na 3a, apagar a tabela das duas áreas e refazer a primeira carga dela |
| T.42 | A data inicial é da cópia da ligação (`lake_copy.start_date`), mas se escolhe no passo **Acesso**, depois do X-Token, como a Nekt (`NK:177721-177729`), e na seção **Tabelas no lago**, na aba **Tabelas** da ligação | A ligação serve também às leituras ao vivo e o Acesso vai pelo link a quem tem a senha (U20): por isso a coluna fica na cópia, e não na ligação, e a página do link não leva o campo. O fundador viu o protótipo e aprovou o campo no Acesso ("Aprovo", 2026-11-25), depois de "1. Okay" em **O que copiar** | Mover a coluna para a ligação |
| T.43 | A data compara com a coluna pela qual a tabela segue: a de alteração numa só do que mudou de movimento, a da janela numa de janela; um cadastro e uma tabela inteira a ignoram. Não há segunda coluna de data | A regra dos ERPs da Nekt: o SAP Business One, a mesma situação, compara documentos com a alteração e pagamentos e lançamentos com o lançamento porque "have no update date" (`NKH:156072`, `:156133`); onze conectores comparam com a alteração; os que usam a data do documento não têm a de alteração (WK Radar `NKH:192194`; Protheus, inteiro, `NKH:180968`). A palavra do fundador: "3. Como Nekt faz, mas ter certeza" | Acrescentar `startColumn` à declaração e trocar de coluna no tap entre a passada inteira e a incremental |
| T.44 | Uma data inicial depois de hoje é recusada (`COPY_START_DATE_INVALID`); a data é um dia, sem hora, no fuso de São Paulo, o do relógio (`clock.ts:12`) | A Nekt aceita e entrega a tabela vazia (`NK:25794`); recusar poupa a rodada vazia e a pergunta "por que está vazia" | Aceitar e deixar a primeira passada vazia |
| T.45 | Gravar outra data só grava; ler de novo desde ela é **Ler de novo desde a data**, que a pessoa clica, e pede `whole` só para as tabelas que a data limita, pela porta do **Rodar agora**. Com a rodada aberta, essa chamada responde "já está rodando", como o **Rodar agora** (39) | Nenhuma referência de extração relê ao gravar: o singer-sdk e o CDK usam o maior entre o ponto e a data (rodado), o Meltano manda usar `--full-refresh`, o Airbyte relê por Refresh pedido na tela, a Nekt por full sync pedido (`NKH:150766`). A palavra do fundador: "2. Ver referencia e ter certeza" | Disparar a releitura ao gravar uma data mais antiga |

## O reajuste, os passos do firstmate

Com a palavra do fundador em cada passo que muda dado. Os resultados ficam fora do repositório, na
pasta da tarefa do firstmate (security S40); o pull request diz só as contagens em zero.

**Antes de o G0a ser publicado.** No banco do Hub de produção, com o login do operador, só leitura:

```sql
SELECT c.company_id, c.name, c.model, c.rows,
       (SELECT count(*) FROM copies.project_copy p WHERE p.copy_id = c.id) AS projetos,
       (SELECT count(*) FROM copies.copy_reader r WHERE r.copy_id = c.id) AS papeis
FROM copies.copy c ORDER BY c.company_id, c.name;
SELECT company_id, state, count(*) FROM copies.copy_proposal GROUP BY 1, 2;
SELECT count(*) FROM copies.copy_table_left;
SELECT count(*) FROM mastra.schedules WHERE workflow_id = 'conexus-copy-run';
```

1. A consulta acima, em todas as empresas. O resultado da empresa do fundador já está na pasta da
   tarefa do firstmate.
2. Cada cópia achada sai pelo **Apagar** da página Dados, na versão no ar. Uma resposta "tabela que
   ficou" do Apagar é repetida até sair.
3. A consulta de novo: zero cópias, zero tabelas que ficaram, zero relógios do fluxo
   `conexus-copy-run`. As contagens de pessoas, papéis, ligações, Projetos e Memória ficam iguais às de
   antes. O resultado vai no pull request do G0a (critério 8).

**Depois de a versão do G0b estar no ar, antes do G0c.** Em cada empresa com banco
(`projects.company_database`), com o login dono do banco dela:

4. Só leitura, primeiro:

   ```sql
   SELECT count(*) FROM pg_namespace WHERE nspname = 'sync';
   SELECT rolname FROM pg_roles
   WHERE rolname IN ('conexus_sync', 'conexus_read') OR rolname LIKE 'conexus\_role\_%';
   ```

   Com a palavra do fundador, para cada empresa que tiver algo:

   ```sql
   DROP SCHEMA IF EXISTS sync CASCADE;
   -- para cada login achado acima:
   REASSIGN OWNED BY <login> TO <o login dono do banco>;
   DROP OWNED BY <login>;
   DROP ROLE IF EXISTS <login>;
   ```

   A consulta só de leitura de novo, em zero em todas as empresas; o resultado vai no pull request do
   G0c (critério 77). Os logins dos apps (`app_<projeto>_run`, `_migrate`, `_read`) não são tocados: o banco do app fica (a J).

## U2 O Builder deixa de propor cópia

**Base e modelo.** O `main` no commit em que o G0a começa; entra antes da U1, que apaga o que esta
unidade deixa sem chamador. Sonnet: remoção de uma ferramenta, em arquivos da outra trilha.

### As linhas da tabela

- **Linha 6.** Apagar `C/apps/server/src/builder/connectors/copy-propose.ts` e o seu teste; a entrada
  dela em `builder/connectors/connector-tools.ts`, `builder/company-tools/names.ts`, `factory.ts`,
  `builder/conversation/permissions.ts` e `builder.ts`; a forma dela em `packages/hub-api/src/tools.ts`;
  `propose` e `provedPage` de `C/apps/server/src/hub/connectors/builder-port.ts`, com `copy-proof.ts`,
  `list-proof.ts` e `packages/hub-api/src/copy-proof.ts`, que só eles usam. O texto de contexto do
  Builder num Projeto: a frase que manda propor a cópia que falta com `copy_propose`
  (`C/apps/server/src/builder/app-data/context.ts:17`) e a de "uma proposta sua" (`:24`), com as
  propostas que `hub/copies/project-view.ts:20` lê para ela. Na tela,
  `apps/web/src/builder/conversation/copy-proposal-card.tsx` e a sua linha em `builder-turn.tsx`,
  `connector-specs.ts` e `tool-row-states`.
- **Os testes que rodam o motor, da outra trilha.** `builder/assistant/copy-runs.test.ts`,
  `assistant.scorecard-copy.test.ts`, `overview-reach.test.ts`, `builder/app-data/context.test.ts`,
  `builder/conversation/data-turn.test.ts` e `apps/web/data-rows.layout.test.ts` passam à cópia
  plantada (o `plantCopy` local de `hub/data/test-world.ts:74`, que esta unidade exporta; o de
  `hub/copies/test-copies.ts:252`, de outra assinatura, sai com a U1) e, onde precisam de
  rodadas, a linhas de `copies.copy_run` plantadas pelo mesmo ajudante.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/connectors/`, `company-tools/`, `conversation/`, `app-data/` | Apaga e muda | o Builder |
| `apps/server/src/builder/assistant/` (testes) | Muda: a cópia e as rodadas plantadas | — |
| `apps/server/src/hub/connectors/builder-port.ts`, `copy-proof.ts`, `list-proof.ts` | Muda e apaga | `builder/connectors/` |
| `apps/server/src/hub/copies/project-view.ts`, `hub/data/test-world.ts` | Muda: sem as propostas; `plantCopy` exportado, com as rodadas | `builder/app-data/` |
| `packages/hub-api/src/tools.ts`, `copy-proof.ts` | Muda e apaga | a tela do Builder |
| `apps/web/src/builder/conversation/`, `apps/web/data-rows.layout.test.ts` | Apaga o cartão; muda a linha da ferramenta | a conversa |

### Os contratos que a unidade cria

- Nenhum. A linha de uma ferramenta que saiu: a conversa antiga mostra o nome guardado da chamada
  com a forma de ferramenta desconhecida que `tool-row.tsx` já tem (o caso "desconhecida no nome
  legível" de `tool-row.test.tsx:111`); se não tiver, a unidade para.
- **O arquivo modelo**: nenhum; é remoção.

### As skills e a leitura

As linhas de `@mastra/core` e `react` do `stack.md`: a skill `mastra`. O guia de testes, T5.

### A ordem do trabalho

1. **A ferramenta e o texto.** Critério: 6. Testes: `tool-sets.test.ts` e `conformance.test.ts`, "sem
   copy_propose"; `context.test.ts`, "sem proposta".
   - **Mutações à mão:** deixar a frase do `copy_propose` no contexto: o 6 fica vermelho.
2. **A conversa antiga.** Critério: 7. Testes: `tool-row.test.tsx`, "a ferramenta que saiu".
3. **Os testes que rodavam o motor.** Critério: 5 (a parte deles), com a cópia plantada.

### Como se prova

Pela lista de ferramentas de cada agente, pelo texto de contexto de um Projeto e pela tela da
conversa com uma chamada antiga gravada.

### Parar se

- Uma unidade da trilha Agentes e Apps está nesses arquivos (delivery L1): espera.
- A tela não tem forma para uma ferramenta desconhecida.
- Um teste do Assistente precisa de uma rodada que só o motor produz e o ajudante não planta.

## U1 O motor que cria cópia sai

**Base e modelo.** A U2, no mesmo pull request, o G0a. Opus: a remoção atravessa o kit, o Hub e a
tela, e o que lê o banco da empresa tem de continuar verde até o G0b, sem o caminho que o semeava.

### As linhas da tabela

- **Linha 1, 2, 3.** Apagar `C/packages/connectors/src/sankhya/copies.ts` inteiro e a sua entrada em
  `sankhya/definition.ts:88`; `C/packages/connectors/src/sankhya/copy-read.ts` inteiro; em
  `C/packages/connectors/src/kernel/copy.ts`, `PAGE_ROWS` (`:6`), `CopyModel` (`:184`), `PageInput`
  (`:187-199`) e `ConnectorCopy` (`:208-212`, que a U3 escreve de novo). A conformidade
  (`kernel/definition.ts:132`) deixa de conferir modelos. **Fica** `CopyDefinition`, nas versões 1 e 2
  (`copy.ts:66-169`): é a forma da linha guardada em `copies.copy`, que `store.ts:140` e `:309` leem e
  que `hub/data/test-world.ts:17`, `:63` planta; nenhum código novo a escreve, a U14 tira os seus
  leitores, e a U3 a apaga com o resto de `copy.ts`.
- **Linha 4.** Apagar de `C/apps/server/src/hub/copies/`: `enable.ts`, `accept.ts`, `propose.ts`,
  `run.ts`, `source-pass.ts`, `sources.ts`, `whole.ts`, `schedule.ts`, `describe.ts`, `naming.ts`, e o
  que deles só eles usam em `store.ts` (`modelOf`, `sourcesNamed`, e `proposalsOf`, que a lista deixa
  de ler e a U2 já tirou de `project-view.ts`) e em `column-state.ts`.
  **Fica** `mode.ts` (`copyModeOf`, que `list.ts:27`, `store.ts:42`, `project-view.ts:17` e `leave.ts:9`
  leem da linha guardada). Apagar `C/apps/server/src/builder/copy-clock/` inteiro e quem o liga:
  `copyClockOf` e o `releaseFirst` das cópias em `C/apps/server/src/conversations-of.ts:240-261`,
  `builder/mastra/hub-mastra.ts:86` e o uso em `main.ts`. De `C/apps/server/src/platform/copy-sql.ts`,
  o que escreve (`writePage`, `closePass`, `dropAccountRows`, `dropForeignRows`, `accountRows`,
  `dropCopyTable`), e as mesmas portas em `platform/company-postgres.ts` e `platform/test-app-ports.ts`.
  **Fica** `ensureCopyTable`, que o `plantCopy` dos testes usa; se o `knip` recusar uma exportação
  usada só por testes, o `plantCopy` cria a tabela do `sync` com o SQL dela, e `ensureCopyTable` sai.
  De `C/apps/server/src/hub/connectors/`: `copy-port.ts`, `copy-system.ts` e, de `list-read.ts`,
  `sourceIssuesOf` e `listIssuesOf` (só `copy-port.ts` os usa).
- **Linha 4, o Desligar.** Desligar uma ligação deixa de acabar com cópias do banco (não há como haver
  uma): saem `leaveCopies`, `lockedCopiesOf`, `endedSourceless`, `endCopies`, `removeSchedules` e
  `takeReadAway` (`leave.ts:86-115`), `copiesOf` e `leave` de `service.ts:104-106`, e a chamada em
  `hub/connectors/rows.ts:51-55`; `hub/connectors/connection-copies.ts` sai com a lista "o que some"
  do diálogo de Desligar que só ela alimenta.
- **Linha 7.** `deleteCopy` e `dropEndedCopies` (`leave.ts:210-241`, `:287`) saem com a rota; o reajuste já
  os usou.
- **Linha 5.** Fica até o G0b, que a U14 tira: `list.ts` (a lista, sem modelos, sem propostas e sem o
  relógio), `readers.ts`, `grants.ts`, `catalog-view.ts`, `role-copies.ts`, `project-view.ts` (sem
  as propostas, que a U2 tira), `sample.ts`, `read-table.ts`, `access-source.ts`, `mode.ts`,
  `platform/copy-reader.ts` e, de `copy-sql.ts`, `ensureSync`, `syncAddress` e os nomes dos logins e
  do esquema.
- **Na tela.** Apagar `C/apps/web/src/hub/copies/new-copy.tsx`, `copy-proposal.tsx`,
  `copy-delete.tsx`, `interval.tsx` (que a U9 traz de volta na ligação, pelo histórico) e as ações
  de pausar, retomar, intervalo e rodar de `copy-list.tsx` e `copy-detail.tsx`; `data-page.tsx:9` deixa
  de importar `NewCopy`. Antes, `QueryBlock` sai de `copy-proposal.tsx` para um arquivo seu,
  `apps/web/src/hub/copies/query-block.tsx`, porque `hub/data/read-detail.tsx:6`, `:94` o usa.
- **No contrato.** `packages/hub-api/src/copies.ts`: `listCopyModels`, `enableCopy`,
  `dismissCopyProposal`, `pauseCopy`, `resumeCopy`, `changeCopyInterval`, `runCopy`, `deleteCopy` e as
  formas que só eles usam.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/`, `sankhya/` | Apaga e muda (acima) | `apps/server/src/hub/connectors/`, `hub/copies/`, `hub/data/test-world.ts` |
| `apps/server/src/hub/copies/` | Apaga e muda (acima); muda `test-copies.ts` (o `copiesOn` sem o relógio nem o motor) e apaga `test-sources.ts`, `test-routes.ts`, `test-proposals.ts`, `test-list-proposals.ts` e os testes do que sai (`enable`, `delete`, `propose`, `run`, `sources`, `whole`) | `hub/data/`, `hub/apps/`, `hub/access/`, `hub/projects/`, `conversations-of.ts` |
| `apps/server/src/hub/data/test-world.ts` | Usa o `plantCopy` que a U2 exporta, o único jeito de os testes terem uma cópia do banco; as duas lojas de teste (`STORE_A`, `STORE_B`, hoje em `hub/copies/test-sources.ts`, `test-world.ts:28`) passam para ele antes de `test-sources.ts` sair | os testes dos leitores |
| `apps/server/src/builder/copy-clock/`, `builder/mastra/hub-mastra.ts`, `conversations-of.ts`, `main.ts` | Apaga o relógio; muda a subida e a remoção da empresa | — |
| `apps/server/src/platform/copy-sql.ts`, `company-postgres.ts`, `test-app-ports.ts` | Muda | `hub/copies/`, `platform/copy-reader.ts` |
| `apps/server/src/hub/connectors/` | Apaga `copy-port.ts`, `copy-system.ts`, `connection-copies.ts`; muda `list-read.ts`, `rows.ts`, `builder-port.ts`, `public.ts`, `unlink-copies.test.ts`, `copy-lane.test.ts` | a tela de Desligar |
| `packages/hub-api/src/copies.ts`, `index.ts`, `failures.ts` | Apaga e muda | a tela |
| `apps/web/src/hub/copies/`, `apps/web/src/hub/connectors/` (o diálogo de Desligar) | Apaga e muda; cria `query-block.tsx`; `text.ts` perde as frases que ficam sem tela | a página Dados; `hub/data/read-detail.tsx` |
| `apps/web/sweep-copies-states.ts`, `sweep-copy-proposal-states.ts`, `scripts/server-test-seconds.json` | Muda e apaga | a QA, o `rerun-list` |

### Os contratos que a unidade cria

- Nenhuma rota, coluna nem código novo. O que se apaga está acima, com cada chamador. Nada do que
  sai é refeito: a parte 1 escreve a cópia do lago do zero.
- `CopySummary` não muda de forma nesta unidade: os campos que vinham do relógio (`schedule`) passam a
  `MISSING`, a forma que o contrato já tem para uma cópia sem relógio (`C/packages/hub-api/src/copies.ts:25-30`).
- Os testes que hoje ligam uma cópia por `on.copies.enable`, pelas rotas ou pelo `copiesOn` e só
  querem um leitor passam ao `plantCopy` (testing T5: a porta pública dos leitores é a mesma); os que
  provam o que sai saem com ele. Os testes de `builder/assistant/` e do placar que rodam o motor são
  da U2.
- **O arquivo modelo**: nenhum; é remoção.

### As skills e a leitura

As linhas de `packages/connectors`, `drizzle-orm` e `@mastra/core` do `stack.md`. O guia de dados,
D6 (nenhuma tabela sai nesta unidade; elas saem na U15, T.20).

### A ordem do trabalho

1. **O kit.** Critério: 2. Apagar os modelos, `PAGE_ROWS`, `PageInput` e `lerPagina`; ficam as versões 1 e
   2 da definição. Uma exportação do kit que o `knip` acuse sem chamador sai; a U3 traz do histórico o que
   precisar.
   - **Testes:** `conformance.test.ts`, "nenhum modelo".
2. **O Hub.** Critérios: 1, 3, 5.
   - **O que sai:** as rotas e os serviços da linha 4, o relógio, o Desligar das cópias, a parte que
     escreve de `copy-sql.ts` e das portas, a porta das cópias de `hub/connectors/`.
   - **O que entra:** os testes dos leitores passam ao `plantCopy` (U2).
   - **Testes:** `routes.test.ts`, "o que cria cópia saiu"; `mastra.test.ts`, "nenhum relógio de
     cópia"; os testes de hoje dos leitores, sem mudar o que esperam.
   - **Mutações à mão:** deixar a rota de `runCopy` registrada: o 1 fica vermelho; deixar o
     `releaseFirst` das cópias: o 3 fica vermelho.
3. **A tela.** Critérios: 4, 5. `QueryBlock` no seu arquivo; `copy-list.tsx` sem o botão, as
   propostas e o Apagar; `copy-detail.tsx` sem as ações; o vazio da matriz.
4. **O reajuste conferido.** Critério: 8, pelo firstmate, antes da publicação.

### Como se prova

O 1 pelas rotas do servidor de teste; o 2 pela conformidade e pelo `typecheck`; o 3 por
`mastra.schedules` depois da subida e da remoção, que hoje tem a linha; o 4 pela tela com o Hub
falso; o 5 pelos testes dos leitores de hoje, verdes com a cópia plantada até a U14 tirá-los. Hoje o
1 falha: as rotas existem.

### Parar se

- Um leitor que fica depende de um campo que só a rodada escrevia (`watermark`, `position`,
  `column_state`) de um jeito que o `plantCopy` não reproduz.
- O `knip` ou o `depcruise` acusam um chamador fora do raio.
- A consulta do reajuste acha uma cópia ou um relógio que o Apagar não tira.

## G0a O ponto de conferência

Depois da U1: os testes do kit, do Hub e da tela; o Hub local com o servidor de respostas gravadas,
a página Dados sem as ações do motor, uma conversa antiga do Builder; a consulta do reajuste em zero
no ar antes da publicação.

## U14 O que lê o `sync` sai

**Base e modelo.** O G0a mesclado. Opus: a remoção atravessa o contrato de acesso, as ferramentas de
quatro agentes, o banco do app e cinco telas, e o contrato de acesso tem de continuar inteiro sem a
fonte das cópias.

### As linhas da tabela

- **Linha 5.** O que lê uma cópia do banco da empresa sai inteiro. O inventário arquivo por arquivo
  está em INV §3.3 a §5; a unidade relê cada chamador na base.
  - **De `apps/server/src/hub/copies/`:** sai tudo o que não é tabela. São `public.ts`, `service.ts`,
    `routes.ts`, `store.ts`, `list.ts`, `leave.ts`, `grants.ts`, `readers.ts`, `role-copies.ts`,
    `read-table.ts`, `sample.ts`, `catalog-view.ts`, `project-view.ts`, `access-source.ts` e
    `mode.ts`, com os ajudantes de teste (`test-copies.ts`, `test-readers.ts`, `test-released.ts`) e
    os testes deles. **Ficam** `tables.ts`, `readers/tables.ts` e `public-tables.ts`, que a U15 tira
    com a migração.
  - **Da plataforma:** `apps/server/src/platform/copy-sql.ts` e `copy-reader.ts` inteiros, e as
    portas `ensureSync`, `ensureCopyTable` e `syncAddress` de `platform/company-postgres.ts` e de
    `platform/test-app-ports.ts`.
  - **Do contrato de acesso (`apps/server/src/hub/data/`):** sai a fonte das cópias.
    - `query.ts` (`queryOf`, o SQL sobre as cópias) e `rows.ts` saem.
    - `catalog.ts`, `recorded.ts` e `deps.ts` perdem a `CopyService`.
    - A leitura ao vivo (`live.ts`), o funil (`funnel.ts`) e o Registro (`record.ts`, `reads.ts`)
      ficam.
    - O `plantCopy` de `hub/data/test-world.ts` sai, e o mundo de teste do contrato fica sem cópia.
  - **Do banco do app (`apps/server/src/hub/apps/`):** saem a liberação de uma cópia aos logins do
    app (`app-database.ts`, o que usa `copy-sql.ts`) e `copy-data.test.ts`; as tabelas que o app
    guarda ficam.
  - **Das ferramentas:**
    - `copy_runs` sai (`apps/server/src/builder/company-tools/copy-runs.ts`), com a sua linha em
      `names.ts` e `factory.ts`.
    - `data_describe` e `data_query` ficam, sem cópia até a etapa 3
      (`apps/server/src/builder/data-tools/`).
    - O texto de `app_data_read` e o contexto do Builder num Projeto (`builder/app-data/context.ts`,
      `ProjectCopiesView`) perdem o `sync` e a cópia liberada.
    - Os testes do Assistente e do placar que a U2 passou à cópia plantada (`builder/assistant/`)
      passam a provar a leitura ao vivo, ou saem quando só provavam a cópia.
  - **O contrato (`packages/hub-api/src/`):** saem `copies.ts`, `connection-copies.ts`
    (`sampleCopy`), `copy-readers.ts`, `copy-shown.ts`, `copy-failures.ts` e o que deles
    `assistant.ts` e `company-data.ts` leem. A origem de um dado no Assistente (`DataOrigin`) fica só
    com a leitura ao vivo até a etapa 3. Os códigos `COPY_SOURCE_*` voltam na U7, no fio da cópia do
    lago.
  - **As telas:**
    - de `apps/web/src/hub/copies/` saem `copy-list.tsx`, `copy-detail.tsx`, `copy-facts.tsx`,
      `copy-readers.tsx`, `copy-sample.tsx`, `raw-layer.tsx`, `source.ts`, `run-requests.ts`,
      `queries.ts` (o que é das cópias) e as frases deles em `text.ts`;
    - ficam `data-page.tsx`, `data-tree.tsx` (sem a camada das cópias), `data-systems.ts` (os sistemas
      pelas ligações), `apps-layer.tsx`, `column-type.tsx`, `search.ts` e `member.ts`;
    - saem também `apps/web/src/hub/projects/project-copies.tsx` e a seção dele, as cópias de
      `hub/apps/data.tsx` e `data-rows.tsx`, as tabelas de um papel em
      `hub/identity/role-tables.tsx` e o bloco das cópias de `routes/.../settings/roles.tsx`;
    - a rota `data.$copyId.tsx` e as antigas `copies.*` passam a levar à página Dados;
    - as varreduras de tela `apps/web/sweep-copies-states.ts` e `sweep-table-states.ts` saem ou
      perdem os estados das cópias.
- **Linha 36.** Nenhum código abre o banco de uma empresa com os logins do `sync`; tirá-los das
  empresas é o passo 4 do reajuste (T.22).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/` | Apaga todo arquivo que não é tabela | `main.ts`, `conversations-of.ts`, `hub/data/`, `builder/` |
| `apps/server/src/hub/data/` | Muda: sem a fonte das cópias | `builder/data-tools/`, `builder/assistant/`, `hub/apps/` |
| `apps/server/src/hub/apps/` | Muda: sem a liberação de cópia | o Builder, a Prévia |
| `apps/server/src/platform/copy-sql.ts`, `copy-reader.ts`, `company-postgres.ts`, `test-app-ports.ts` | Apaga e muda | `hub/apps/` |
| `apps/server/src/builder/company-tools/`, `data-tools/`, `app-data/`, `assistant/`, `conversation/` | Muda: sem `copy_runs` nem o texto das cópias | os agentes |
| `apps/server/src/main.ts`, `conversations-of.ts` | Muda: sem `createCopies` | — |
| `packages/hub-api/src/` | Apaga os contratos das cópias; muda `assistant.ts`, `company-data.ts`, `index.ts`, `failures.ts`, `tools.ts` e a conformidade do contrato | a tela; a outra trilha |
| `apps/web/src/hub/copies/`, `hub/projects/`, `hub/apps/`, `hub/identity/`, `builder/conversation/` (a origem), `routes/` | Apaga e muda | a página Dados, o Projeto, os papéis |
| `apps/web/sweep-*.ts`, `scripts/server-test-seconds.json` | Muda e apaga | a QA, o `rerun-list` |
| `docs/explanation/sync.md`, `docs/reference/boundaries.md` (as entradas das cópias), a parte 01 de `dados-spec/`, `docs/guides/data.md` (a D31) | Apaga ou reescreve o que descreve o que saiu | — |

### Os contratos que a unidade cria

- Nenhuma rota, coluna nem código novo. O que se apaga está acima, com cada chamador.
- **O contrato de acesso sem a fonte das cópias**: Descrever devolve as ligações e as leituras ao
  vivo; Ler e Consultar uma tabela que não está no catálogo respondem a recusa que o contrato já tem
  para isso. A conformidade do contrato (`company-data-conformance*.ts`) roda sobre o mundo sem cópia;
  uma lei que só valia para a cópia sai com ela, e o pull request lista cada uma.
- **A origem de um dado** (`DataOrigin`, `MessageSource`): só `LIVE` até a etapa 3. A união perde o
  caso da cópia; a tela da conversa perde o ramo dele.
- **O endereço antigo** de uma cópia leva à página Dados, como os endereços `copies.*` já levam.
- **O arquivo modelo**: nenhum; é remoção.

### As skills e a leitura

As linhas de `drizzle-orm`, `@mastra/core`, `react` e `@tanstack/react-router` do `stack.md`: as
skills `mastra` e `drizzle`. O guia de dados, D6: nenhuma tabela sai nesta unidade.

### A ordem do trabalho

1. **O contrato de acesso e a plataforma.** Critérios: 71, 75.
   - **O que sai:** a fonte das cópias de `hub/data/`; `copy-sql.ts`, `copy-reader.ts` e as portas.
   - **Testes:** a conformidade do contrato sem cópia; `query.test.ts`, "sem cópia";
     `company-postgres.test.ts`, "a porta sem o sync".
   - **Mutações à mão:** deixar a fonte das cópias no catálogo: o 71 fica vermelho.
2. **O Hub das cópias e o banco do app.** Critérios: 70, 74.
   - **Testes:** `routes.test.ts`, "o que lê saiu"; `app-data.test.ts`, "sem liberação de cópia".
3. **As ferramentas e o texto.** Critérios: 7, 72.
   - **Testes:** `tool-sets.test.ts`, "sem copy_runs"; `context.test.ts`, "sem cópia";
     `assistant.test.ts`, "sem cópia, ao vivo"; `tool-row.test.tsx`, "a ferramenta que saiu".
4. **As telas.** Critérios: 73, 74.
5. **Os documentos** que descrevem o que saiu.

### Como se prova

O 70 pelas rotas do servidor de teste; o 71 pela conformidade do contrato; o 72 pela lista de
ferramentas de cada agente e por uma conversa do Assistente com a ligação do dublê do Sankhya; o 73 e
o 74 pela tela com o Hub falso; o 75 pelo `typecheck`. Hoje o 70 falha: as rotas existem.

### Parar se

- Uma lei da conformidade do contrato só se prova com uma fonte copiada e não é só da cópia.
- Uma unidade da trilha Agentes e Apps está nos arquivos de `builder/` (delivery L1): espera.
- O `knip` ou o `depcruise` acusam um chamador fora do raio.
- Uma tela fora do raio lê uma forma das cópias.

## G0b O ponto de conferência

Depois da U14: os testes do Hub, do contrato e da tela; o Hub local com o servidor de respostas
gravadas: a página Dados com a árvore e os apps, um Projeto sem cópias, uma pergunta de vendas ao
Assistente respondida ao vivo pelo dublê; a QA da parte 0; na nuvem, o firstmate faz o passo 1 do
roteiro antes de chamar o fundador.

## U15 A migração que tira as cópias

**Base e modelo.** O G0b publicado: a versão no ar não lê nenhuma das tabelas (data D6). Sonnet:
uma migração que só tira, com as permissões.

### As linhas da tabela

- **Linha 5 e 34.** As nove tabelas de `copies` de hoje (`copy`, `copy_run`, `project_copy`,
  `copy_reader`, `copy_proposal`, `copy_source`, `copy_table_left`, `copy_proposal_source`,
  `copy_reader_turn`; `C/apps/server/src/hub/copies/tables.ts:39`, `:98`, `:146`, `:173`, `:206`,
  `:274`, `:319`, `:343`; `readers/tables.ts:12`) e `notifications.copy_follower` e `copy_notice`
  (`C/apps/server/src/hub/notifications/tables.ts:176`, `:207`), com as linhas delas em
  `database-grants.sql`. Fica `notifications.alert_recipient`, sem uso; o cartão do aviso o tira ou o usa, agora que os e-mails são da ligação. O esquema `copies`
  sai junto, com as permissões dele: `pgSchema('copies')` mora em `hub/copies/tables.ts:28`, que
  sai; a U7 o cria de novo com as tabelas do lago.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/tables.ts`, `readers/tables.ts`, `public-tables.ts` | Apaga | `hub/notifications/tables.ts` |
| `apps/server/src/hub/notifications/tables.ts` | Muda: sem `copy_follower` e `copy_notice` | — |
| `apps/server/migrations/`, `database-grants.sql`, a foto do catálogo | Cria a migração; muda as permissões | `migrate`; `apps/server/src/platform/catalog.test.ts` |
| `docs/architecture.md` | Muda: a linha nas exceções do roll-back, com a versão do G0b (data D6) | — |

### Os contratos que a unidade cria

- Nenhum. A migração só tira; cada `DROP TABLE` sem `CASCADE` (data D13), na ordem das chaves.
- **O arquivo modelo**: a migração `20261123013112_previa_environment_drop`, a última que só tira.

### As skills e a leitura

A skill `drizzle`. O guia de dados, D6, D11 e D13.

### A ordem do trabalho

1. **A migração e as permissões.** Critério: 76, com a palavra do fundador (data D11).
   - **Mutações à mão:** deixar `copy_notice` no esquema: a foto do catálogo fica diferente e o
     teste fica vermelho.
2. **O passo 4 do reajuste**, pelo firstmate. Critério: 77.

### Como se prova

Pelo `migrate` num PostgreSQL local e pela foto do catálogo; o 77 pela consulta do reajuste.

### Parar se

- Um código no ar ainda lê uma das tabelas (a conferência de migrações ou o `knip` o acusa).
- Uma chave de outra tabela aponta para uma delas sem estar no raio.

## G0c O ponto de conferência

Depois da U15: o `migrate` num PostgreSQL local, a foto do catálogo, o `catalog.test.ts`; o passo 4
do reajuste em zero.

## A etapa O conector no padrão novo

A pergunta que o fundador responde na tela: "O Assistente continua lendo o Sankhya e o Mercado Livre
enquanto cada conector é refeito, e cada um nasce de uma definição só, com a sua skill e a classe da
credencial?" Ela segue o que já foi decidido e provado (0056, 0057, 0062, 0069, 0071, 0077; as etapas
19, 19.1 e 24.5). O código de hoje das pastas é só o inventário (`EST/ao-vivo-estudo:134-151`). Os
passos 2 a 5 do roteiro são dela.

O que o código de hoje tem de diferente do decidido, peça por peça, e onde cada peça entra
(`EST/ao-vivo-estudo`, seção 1.3):

| # | Peça | O que acontece | Onde |
| --- | --- | --- | --- |
| 1 | A cópia dentro do kit | Sai | U1 |
| 2 | A classe da credencial | Entra | U16 |
| 3 | A renovação e o "renova e repete uma vez" no Hub | Refeita: a sessão do kit | U16 |
| 4 | O número exato | Refeito: o leitor do kit | U16 |
| 5 | A skill escrita à mão | Refeita em parte: a parte gerada | U16, U17, U18, U3 |
| 6 | O Caderno que grava sem sim | Refeito: pede o sim; sai na etapa do Negócio | U19 |
| 7 | A descrição do sistema (spec 02, `C1`) | Fica de fora: o fluxo confirmado não a usa | — |
| 8 | A janela Ligar em um passo | Refeita na parte 1: a janela do fluxo confirmado | U9, U20 |
| 9 | O Desligar que lista cópias | Sai | U1 |
| 10 | As pastas do Sankhya e do Mercado Livre | Refeitas do zero | U17, U18 |
| 11 a 15 | O executor, o envio, o login por autorização, **Testar**, o funil de escrita, as leituras como ferramentas, o app e a ferramenta em código lendo ao vivo | Ficam: já são o decidido (A do conector) | — |
| 16 | As peças da cópia em `hub/connectors/` | Saem | U1, U2 |

**O que prende a troca.** Os ids das operações (`pedidos`, `lancarPedido`) e a forma da resposta
(`{ linhas, temMais }`) são contrato de cinco lugares: o app publicado, a ferramenta salva, o papel
(`connector_<id>: [operação]`, `C/apps/server/src/hub/identity/may-use.ts:114`), o Caderno e o nome da
ferramenta tipada. A pasta nova mantém os ids, e os testes de hoje passam por ela sem mudar o que
esperam (`EST/ao-vivo-estudo:158`).

## U16 O kit ganha a classe, a sessão, o número exato e a skill gerada

**Base e modelo.** A parte 0 usada. Opus: a sessão muda quem renova no Hub, e a skill passa a sair
da definição que três agentes leem.

### As linhas da tabela

- **Linha 12.** Ler `C/apps/server/src/hub/connectors/limits.ts:126-135` (`createEndings`, o fim de
  cada token), `read.ts:105-117` e `check.ts:40-50` (o "renova e repete uma vez"),
  `tokens.ts` (262 linhas). Seguir `singer-sdk@0.54.9 singer_sdk/authenticators.py:526-527`,
  `:609-619`, e a sessão da P2 (`EST/p2-adaptador-sankhya:35-37`, `:153`: 87 linhas, 4 renovações em
  100 s).
- **Linha 13.** A classe da credencial como dado do login (0077:11-16): compartilhável no Sankhya,
  medida (dois logins convivem, `conexus-v17-sonda`); exclusiva no Mercado Livre, cuja renovação serve
  uma vez, e no HubSpot, cuja renovação invalida a anterior, até medir.
- **Linha 14.** Ler `C/apps/server/src/hub/connectors/wire.ts:66-75` (o `JSON.parse`). Seguir o
  `JSON.parse` com `context.source` do Node 24 e `singer-sdk@0.54.9 singer_sdk/singerlib/json.py:40-44`.
- **Linha 50.** Ler `C/packages/connectors/src/kernel/skill.ts` (`readSkill`, só o texto) e os três
  que leem a skill: `C/apps/server/src/hub/connectors/builder-port.ts:239`,
  `builder/assistant/assistant.ts:252`, `builder/conversation/builder.ts:179`.
- **Os dublês.** `C/packages/connectors/src/sankhya/fake-sales.ts:131` guarda `VLRNOTA` como `REAL`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Cria `session.ts`, `exact-json.ts` e testes; muda `auth.ts`, `oauth.ts`, `definition.ts`, `conformance.ts`, `skill.ts`, o índice | `apps/server/src/hub/connectors/`, o adaptador (U4) |
| `packages/connectors/src/sankhya/definition.ts`, `fake-sales.ts`, `fake.ts` | Muda: a classe e os números exatos na definição de hoje (a U17 a refaz); `VLRNOTA` como texto, a nota de 19 dígitos | os testes |
| `packages/connectors/src/hubspot/`, `mercado-livre/definition.ts` | Muda: a classe exclusiva e a skill na forma nova (o Mercado Livre é refeito na U18) | o kit |
| `apps/server/src/hub/connectors/` | Muda `read.ts`, `check.ts`, `limits.ts`, `tokens.ts`, `wire.ts`, `builder-port.ts`: a sessão, o leitor do kit e a skill | `hub/data/`, `builder/` |
| `apps/server/src/builder/assistant/assistant.ts`, `builder/conversation/builder.ts` | Muda: leem a skill pela função do kit | — |

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/auth.ts — every login declares it (0077); no default
export type CredentialClass = 'SHAREABLE' | 'EXCLUSIVE'
// ClientCredentialsAuth and OAuth2CodeAuth gain: credentialClass: CredentialClass
// Not the account's `exclusive` (`kernel/definition.ts:20-23`, one connection per account): that one stays as it is
// packages/connectors/src/kernel/session.ts
export type SessionState = { kind: 'NONE' } | { kind: 'OPEN'; token: string; expiresAt: number } | { kind: 'CLOSED' }
export type SessionFailure = { kind: 'NEEDS_REAUTH' } | { kind: 'UNREACHABLE' } | { kind: 'REFUSED'; native: unknown }
export type Session = {
  token(signal: AbortSignal): Promise<string | SessionFailure>
  call<T>(work: (token: string) => Promise<T | { kind: 'TOKEN_EXPIRED' }>, signal: AbortSignal): Promise<T | SessionFailure>
  close(signal: AbortSignal): Promise<void>
}
export function openSession(input: Readonly<{ auth: Auth; credential: Credential; send: ProviderSend; now: () => number }>): Session
// packages/connectors/src/kernel/exact-json.ts — a connector gains numbers: 'EXACT' | 'DOUBLE'
export function parseExact(text: string): unknown   // a number past 2^53 or with a fraction comes back as its source text
// packages/connectors/src/kernel/skill.ts
export type ConnectorSkill = Readonly<{ content: string; references: Readonly<Record<string, string>> }>
/** The skill the agents read: the part generated from the definition, then the written part. */
export function connectorSkill(connector: Connector): ConnectorSkill
// Connector.skill becomes the written part only: Readonly<{ written: ConnectorSkill }>
```

- **Cada estado** como união: `SessionState` e `SessionFailure` por `kind` (C21).
- **O dono de cada fato** (C26):
  - a classe, no login de cada conector;
  - a margem de renovação, em `session.ts`;
  - as frases da parte gerada, em `skill.ts`, em português: "Esta ligação lê e escreve; cada escrita
    pede a aprovação de uma pessoa." ou "Esta ligação só lê.", e a lista dos assuntos pelo rótulo.
- **A parte gerada não nomeia ferramenta.** Nem `<conector>_<operação>` nem a lista das operações: o
  agente as acha pelo `search_tools` (T.25). A conformidade recusa uma parte escrita que contenha o
  nome de uma ferramenta do conector.
- **O que se apaga**: o "renova e repete" de `read.ts:111` e `check.ts:44`, e o `JSON.parse` de
  `wire.ts:71`. O fim de cada token de `limits.ts` passa a ser o `close` da sessão.
- **O arquivo modelo**: nenhum declarado; a unidade segue C21, C23 e C26 direto.

### As skills e a leitura

As linhas de `packages/connectors` e de `@mastra/core` do `stack.md`. O guia de testes, T5 e T29.

### A ordem do trabalho

1. **A classe e a conformidade.** Critério: 14.
   - **Arquivos:** muda `kernel/auth.ts`, `oauth.ts`, `definition.ts`, `conformance.ts`; a classe nos
     três conectores.
   - **Testes:** `conformance.test.ts`, "a classe da credencial".
2. **A sessão.** Critérios: 12, 13.
   - **Arquivos:** cria `session.ts`; muda `limits.ts`, `read.ts`, `check.ts`, `tokens.ts`.
   - **Mutações à mão:** tirar o logout: o teste conta uma sessão aberta e fica vermelho.
3. **O número exato.** Critério: 15. Cria `exact-json.ts`; muda `wire.ts`; o dublê guarda `VLRNOTA`
   como texto.
4. **A skill.** Critério: 78 (a parte da U16).
   - **Arquivos:** muda `skill.ts`, `builder-port.ts`, `assistant.ts`, `builder.ts`.
   - **Mutações à mão:** gerar a frase "só lê" para um conector com escrita: o 78 fica vermelho.

- **A entrada em `docs/reference/boundaries.md`** das linhas 12 e 13, remendo, com a prova de cada
  uma, no commit da unidade.

### Como se prova

O 12 pela sessão contra o dublê com o relógio de teste; o 13 pelas rotas de leitura, de escrita e de
**Testar** do Hub, com os casos de hoje; o 14 pela conformidade; o 15 por `parseExact` com o corpo em
bytes, que hoje o `JSON.parse` corta; o 78 pelo índice do kit. Hoje o 14 e o 78 falham: a classe não
existe, e a skill do Sankhya nega a escrita.

### Parar se

- Um conector de hoje depende do "repete uma vez" no Hub de um jeito que a sessão não cobre.
- A renovação do Mercado Livre, de uso único, não cabe na sessão sem a trava do Hub de hoje: a
  sessão do conector exclusivo fica no Hub, e o builder diz ao firstmate.

## U17 A pasta do Sankhya, refeita

**Base e modelo.** A U16, no mesmo pull request. Opus: a pasta é contrato de cinco lugares do Hub, e
a nova tem de responder igual sem ser cópia da velha.

### As linhas da tabela

- **Linha 53.** O inventário da pasta de hoje (INV §1.3): a definição (`sankhya/definition.ts:25`),
  as duas portas (`door.ts:70`, `:130`), o filtro de leitura (`read-only-sql.ts:106`, `:112`), as
  respostas (`answers.ts:119`, `:146`), as recusas gravadas (`refusals.ts:9`, `:24`), as buscas
  (`search-sql.ts`, `search-read.ts`, `operations/buscas*.ts`), as 27 leituras e a escrita
  (`operations/`, `lancarPedido` em `vendas.ts:182`), a skill (`skill/`). A pasta nova é escrita da
  forma do kit (`kernel/definition.ts`, `operation.ts`), da documentação pública do Sankhya
  (`sankhya/spec-source.ts`, lida na hora) e dos dublês.
- **Linha 48.** A escrita declara o que só o fornecedor sabe (0062:12-20): incerto, marca e id.
- **Linha 50.** A parte escrita da skill guarda o saber: o que é uma TOP, como ler o dicionário, os
  estágios de investigação, a página de cada rota. Nada sobre quais ferramentas existem.
- **As issues.** A #929 (`search-sql.ts`, o `LIKE` do SQL Server) e a #930 (o 20 da página com dois
  donos, `search-read.ts` e o corte do servidor).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/sankhya/` | Apaga e cria de novo todo arquivo que não é dublê, gravação nem teste: `definition.ts`, `door.ts`, `read-only-sql.ts`, `answers.ts`, `refusals.ts`, `search-*.ts`, `operations/**`, `skill/**`. Os testes mudam só o caminho de importação | o índice do kit; `apps/server/src/hub/connectors/`, `builder/connectors/`, `hub/identity/` (os ids), `packages/connectors/src/calls.ts` |
| `packages/connectors/src/calls.ts` | Muda só se o caminho do tipo das leituras mudar | `packages/app` |

O `processo` lê um arquivo de `packages/connectors/src/<pasta>/` como da trilha do molde
(`scripts/tracks.ts`, `trackOfFile`); o pull request do GC1 responde pelas duas trilhas.

### Os contratos que a unidade cria

- **Nenhum id muda.** O conector `sankhya`, as portas `consultar` e `carregar`, as 27 leituras e
  `lancarPedido`, com as mesmas entradas e a resposta `{ linhas, temMais }`. O índice do kit é o
  dono da lista (C26); `calls.ts` a lê de lá.
- **O login**: os campos colados de hoje, `credentialClass: 'SHAREABLE'`, `numbers: 'EXACT'`.
- **A skill**: só a parte escrita, em `skill/`; a gerada vem de `connectorSkill` (U16).
- **O arquivo modelo**: a forma de `kernel/definition.ts` e `operation.ts` (C21: as classes
  `read`, `write` e `destructive`; C23: `OperationId`; C26: a definição como dado).

### As skills e a leitura

As linhas de `packages/connectors` do `stack.md`. O guia de testes, T5.

### A ordem do trabalho

1. **A pasta nova, a velha fora, num commit.** Critérios: 79, 80.
   - **O que sai:** cada arquivo da pasta velha que não é dublê, gravação nem teste.
   - **O que entra:** a pasta nova, escrita da forma do kit, conferida pela conformidade e pelos
     dublês. Regras: C21, C23, C26.
   - **Testes:** os de hoje do Sankhya, pelo índice; os do Hub do critério 80, sem mudar o que
     esperam.
   - **Mutações à mão:** trocar o id `pedidos` por `listarPedidos`: os testes do Hub e o papel ficam
     vermelhos.
2. **As buscas.** Critério: 81.
3. **A skill escrita.** Critério: 78.

### Como se prova

O 79 pela conformidade e pelos testes de hoje do kit; o 80 pelos do Hub, pela porta pública; o 81
pela busca com um colchete, que hoje casa demais. Hoje o 78 falha.

### Parar se

- Um teste de hoje espera um detalhe da pasta velha que nenhuma documentação nem dublê sustenta: o
  builder o lista ao firstmate, e não o copia.
- Manter um id pede uma forma que o kit não tem.

## GC1 O ponto de conferência

Depois da U17: os testes do kit, do Hub e do Builder; o Hub local com o servidor de respostas
gravadas e o dublê do Sankhya: uma pergunta ao Assistente respondida ao vivo, uma escrita com o
cartão, **Testar**; a skill que o Assistente lê, com a frase da escrita. Na nuvem, depois da
publicação, o firstmate faz os passos 2 e 3 do roteiro para o Sankhya.

## U18 A pasta do Mercado Livre, refeita

**Base e modelo.** O GC1 mesclado. Sonnet: a mesma forma da U17, num conector sem escrita nem porta.

### As linhas da tabela

- **Linha 53.** O inventário da pasta de hoje (INV §1.4): a definição
  (`mercado-livre/definition.ts:17`, o login por autorização com PKCE, `:24-37`; a conta informada e
  exclusiva, `:38-46`; `callLimit: APP`, `:52`), as respostas (`answers.ts`), as leituras e as listas
  que paginam (`operations/shared.ts:66-78`, `vendas.ts:8`, `:26-28`), a skill (`skill/`).
- **Linha 13.** A classe exclusiva até a etapa 5 medir (0077).
- **Linha 50.** A parte escrita guarda a paginação por deslocamento e por varredura e a conta do
  vendedor; a frase "say that this connection only reads" sai, porque a parte gerada a diz.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/mercado-livre/` | Apaga e cria de novo todo arquivo que não é dublê, gravação, leitura da documentação (`docs-source.ts`) nem teste | o índice do kit; `apps/server/src/hub/connectors/` (`sign-ins.ts`, `tokens.ts`) |

### Os contratos que a unidade cria

- **Nenhum id muda**: `mercado-livre`, as 27 leituras, as cinco listas que paginam, com o `list` da
  operação (`kernel/operation.ts:164-167`), que a U3 usa como origem de uma tabela.
- **O login**: o de hoje, `credentialClass: 'EXCLUSIVE'`, `numbers: 'EXACT'`.
- **O arquivo modelo**: a pasta do Sankhya da U17.

### As skills e a leitura

As linhas de `packages/connectors` do `stack.md`. O guia de testes, T5.

### A ordem do trabalho

1. **A pasta nova, a velha fora, num commit.** Critérios: 78, 82.
   - **Mutações à mão:** tirar o `list` de `pedidos`: o teste das listas fica vermelho.

### Como se prova

Pelos testes de hoje do Mercado Livre pelo índice do kit e pelos do login e da reconexão do Hub.

### Parar se

- A renovação de uso único pede uma peça que a sessão da U16 não tem.

## GC2 O ponto de conferência

Depois da U18: os testes do kit e do Hub; o Hub local com o dublê do Mercado Livre: o login, uma
pergunta ao Assistente, a reconexão; a QA da etapa do conector. Na nuvem, o firstmate faz os passos 2
e 5 do roteiro para o Mercado Livre.

## U19 O Caderno pede o sim

**Base e modelo.** A parte 0 usada. Sonnet: uma aprovação a mais pelo cartão que já existe.

### As linhas da tabela

- **Linha 49.** Ler `C/apps/server/src/hub/connectors/notes.ts` (`save`, que confere
  `manageConnections` de quem aprova, no Assistente e no Builder; `provedAndSaved`), `C/apps/server/src/builder/connectors/connector-tools.ts:307-333`
  (`noteSaveTool`) e `builder/company-tools/factory.ts:132-137` (quem recebe a ferramenta). Seguir a
  pergunta com o cartão: `builder/controller-kit/ask-user.ts` (`createAskUserTool`: `suspendSchema`,
  `resumeSchema`, `execute` que suspende sem `resumeData` e responde com ele) e `builder/conversation/plan-tools.ts`
  (`createSubmitPlanTool`). `@mastra/core@1.83.0`: `ask-user.ts:98-122` e `submit-plan.ts:78-128` fazem o
  mesmo, e o cartão responde pela rota `tool-suspension`, já na lista fixa do guarda
  (`builder/conversation/guard.ts:38`). O `requireApproval` não é o caminho: no Assistente e no Builder
  o controlador roda em `yolo` (0053), e `session.ts:4815` (`if (state.yolo === true) return 'allow'`)
  aprova sozinho toda porta de aprovação.
- **A decisão.** 0064 (`:30`): as anotações viram propostas e o Caderno sai, na etapa do Negócio.
  Até lá, gravar pede o sim (B do conector).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/connectors/connector-tools.ts` | Muda: a ferramenta suspende com o pedido e grava só com o sim (`suspendSchema`, `resumeSchema`); o não devolve `NOT_SAVED`; no Builder, o sim retomado abre uma corrida só dele (`RunId` novo), porque a retomada roda antes de a corrida tomar o Projeto | o Assistente e o Builder |
| `apps/server/src/hub/connectors/assistant-port.ts`, `builder-port.ts` | Muda: quem responde o cartão é quem aprova (`approvedBy`), e a gravação o confere | a ferramenta |
| `apps/server/src/hub/connectors/notes.ts`, `packages/hub-api/src/connectors.ts` (`ConnectionNote`, `NoteApproval`) | Muda: `approvedBy` | a tela |
| `apps/web/src/builder/conversation/` (o cartão: `note-card.tsx`, `note-parse.ts`, `rows.ts`), `apps/web/src/hub/connectors/notes.tsx`, `text.ts` | Muda: o cartão do Caderno, que responde pela suspensão; "Aprovada por" | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/connectors/notes.ts — the stored note gains who approved; a note from before has none
approvedBy: z.string().optional()
// packages/hub-api/src/connectors.ts — ConnectionNote gains who said yes, by kind (C21)
approval: { kind: 'NONE' } | { kind: 'PERSON', name: string | null }   // NONE: "Gravada sem aprovação"; name null: the person left the company
```

- **Quem aprova**: a pessoa que responde o cartão, dona da conversa (o guarda só deixa a dona
  responder); um membro com `manageConnections` agora, conferido na transação da gravação (T.26), e
  não quando pediu, no Assistente e no Builder igualmente; uma recusa é `NOT_GRANTED`, com o motivo só no
  registro (S8, S10). `approvedBy` e `writtenBy` são hoje a mesma pessoa, porque só a dona responde: o que a
  unidade acrescenta é a conferência no momento do sim, e não um segundo papel.
- **O cartão**: a peça `Approval` de `ui/ai/`, com o título "Gravar no Caderno?" e as frases da
  matriz em `approval-text.ts` (C26), respondido por `tool-suspension` com `{ approved }`.
- **O arquivo modelo**: `builder/agents/tools.ts`, `writeTool` (C21: a resposta por `kind`).

### As skills e a leitura

As linhas de `@mastra/core` e `react` do `stack.md`: a skill `mastra`. A security S8 e S10.

### A ordem do trabalho

1. **A ferramenta pede o sim.** Critério: 83.
   - **Mutações à mão:** a ferramenta gravar sem suspender (o `execute` chamar `save` direto): o 83 fica
     vermelho.
2. **Quem aprova e o que fica gravado.** Critério: 84.
   - **Mutações à mão:** tirar a conferência de `manageConnections` da transação da gravação, ou
     conferi-la quando o cartão abre e não quando o sim chega: o 84 fica vermelho.
3. **A tela.** Critério: 84.

### Como se prova

Por uma conversa do Assistente e uma do Builder com o dublê do modelo e um PostgreSQL local (a suspensão
é a do `ask_user`, que o Mastra retoma na mesma rota); pela tela com o Hub falso. Hoje o 83 falha: a
ferramenta grava sem pedir.

O desvio do cartão: a aprovação é a suspensão do Mastra, e não o `requireApproval`. O motivo, medido: em
`yolo` o controlador aprova toda porta de aprovação sem perguntar. Para perguntar, o Assistente e o
Builder teriam de sair de `yolo`, e então toda ferramenta que o Mastra injeta (a busca de ferramentas, as
leituras tipadas) pediria também. A suspensão pergunta só no Caderno e deixa a 0053 como está.

### Parar se

- Uma unidade da trilha Agentes e Apps está nesses arquivos (delivery L1): espera.
- A suspensão de hoje não deixa a ferramenta retomar com o sim sem mudar a rota de responder.

## GC3 O ponto de conferência

Depois da U19: os testes do Hub, do Builder e da tela; o Hub local com o dublê do Sankhya: uma
anotação aprovada, uma recusada, a página da ligação; a QA. Na nuvem, o firstmate faz o passo 4 do
roteiro antes de chamar o fundador.

## U3 O kit declara as tabelas

**Base e modelo.** A etapa do conector usada e as sondas do Sankhya completo feitas. Opus: a
declaração é o contrato entre o kit, o Hub e o adaptador, e nasce desenhada para as duas origens, a
tabela e a leitura que pagina, e para os três modos.

### As linhas da tabela

- **Linhas 8, 66 e 67.** A declaração de cada tabela: 0080 (`C/docs/decisions/0080-copy-declared-per-table-raw-appends.md:10-19`,
  a descoberta "por um gancho ou por uma lista declarada", e os três modos); a forma por tabela da Nekt
  (`NK:20888-20897`) e o modo fixado pelo conector num ERP por API (`NK:177752`, "Every stream is FULL_TABLE"); o tamanho de página
  como dado da declaração, com padrão (`CDK .../declarative_component_schema.yaml:2244-2271`, lida numa cópia guardada que a estante de hoje não tem, e não conferida aqui). A lista
  é a de `SK` seção 1 (o nome sugerido, o rótulo, a origem, a chave, a coluna e o modo de cada uma),
  fechada pelas sondas P1 a P5. A janela por mês segue a A0D (`EST/a0d-sankhya-kit-mes:93-121`): as
  janelas vêm da contagem por mês, porque há datas fora do calendário.
- **Linhas 39, 42, 44.** O nome sugerido, o rótulo, a descrição e o grupo: Nekt Protheus
  (`NK:177792-177806`), o nome sugerido e fixo depois de criado (`NK:12217-12220`), "Add descriptions
  to tables" (`NK:405`), a pasta por domínio (`NK:76`).
- **Linhas 9, 43 e 65.** O gancho do dicionário: a sonda de `EST/descoberta-catalogo:75-80` (286 linhas,
  no dublê), o que a skill do agente já sabe do dicionário e a porta de consulta da pasta nova do
  Sankhya (U17). O mapa dos tipos do dicionário para o tipo da coluna é o da sonda, com o `CLOB` em
  texto (T.36). As colunas no lago levam o nome da fonte em minúsculas (`NK:177778`). A descoberta é
  uma função só, que a U8 chama para a janela e a U4 para o `--discover` (`MAPA` seção 6).
- **Linha 63.** O tipo da coluna pela descoberta (T.36), o XML como coluna de texto da `TGFNFE`, com a
  coluna e o tipo que a PS1 achou e o limite da PS2 e da PS4.
- **Linha 50.** A lista de tabelas entra na parte gerada da skill (`connectorSkill`, U16), com os
  nomes da ligação.
- **Os dublês.** Ler `C/packages/connectors/src/sankhya/fake.ts:226-227` e
  `hubspot/fake-data.ts:13-68`: hoje não deixam mudar um registro. O dublê do Sankhya ganha a `TGFCAB`
  larga, de 450 colunas inventadas, algumas `AD_`, o dicionário dela, uma tabela de janela com datas
  fora do calendário, a `TGFNFE` com um XML de 1 MiB numa coluna de texto e uma coluna `BLOB` pequena.
- **Linha 72.** O cadastro e a data: `singer-sdk@0.54.9 singer_sdk/streams/_state.py:145-167` (a passada
  inteira ignora a data; a chave a recebe como semente) e o cadastro inteiro da Nekt (`NKH:134107`). A
  coluna que a data compara é a do modo, como nos documentos do SAP Business One da Nekt
  (`NKH:156072`): `DTALTER` em `notas`, `notas_itens` e `financeiro`, `DHALTER` em `notas_impostos`, a
  da janela nas de janela. Os cadastros (`parceiros`, `produtos`, `vendedores`, `precos_tabelas`) e as
  inteiras não.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Cria `tables.ts` e o teste; apaga o que sobrou de `copy.ts` (`CopyDefinition`, que a U14 deixou sem leitor), `list.ts`, `conformance-list.ts` e `list-fixture.ts`; muda `definition.ts`, `conformance.ts`, `skill.ts`, o índice | o adaptador (U4), `hub/copies/` (U8) |
| `packages/connectors/src/sankhya/` | Cria `copy-tables.ts` e o teste; muda `definition.ts`, `operations/index.ts` (os assuntos `fiscal` e `contabil`, T.40), `skill/` (as partes deles), `fake.ts`, `fake-sales.ts`, o dicionário do dublê e as gravações das sondas | o kit |
| `packages/connectors/src/hubspot/` | Muda: declara a tabela `negocios` por operação; a rota de teste do dublê | o kit |
| `docs/reference/boundaries.md` | Muda: a entrada da linha 66, a janela por mês, com a prova | — |

O `processo` lê um arquivo de `packages/connectors/src/<pasta>/` como da trilha do molde
(`scripts/tracks.ts`, `trackOfFile`); o pull request do G1 responde pelas duas trilhas.

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/tables.ts
/** The suggested lake name after the connector prefix: Portuguese, snake_case (NT2; a suggestion, founder 2026-11-23). */
export const TableName = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/).brand('TableName')
/** A table of the source as the source names it: `TGFCAB`. */
export const SourceTable = z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,59}$/).brand('SourceTable')
export const TableColumn = z.object({ name: z.string(), type: TableColumnType, description: z.string().max(200).nullable() })
export type TableSource =
  | Readonly<{ kind: 'TABLE'; table: SourceTable }>                                    // Sankhya, by the query door
  | Readonly<{ kind: 'OPERATION'; operation: OperationId; input: Readonly<Record<string, string | number | boolean>> }>  // a paged read; its origin on the wire is the operation id ('negocios')
/** How a table is read each run, fixed by the connector (0080; NK:177752). */
export type TableMode =
  | Readonly<{ kind: 'CHANGED'; column: string; registry: boolean }>                         // rows past the saved point of a column that only grows: a date (DTALTER) or a number (NUNOTA), as a Singer replication key; registry: master data, which the start date never limits (NKH:134107)
  | Readonly<{ kind: 'WINDOW'; column: string; step: 'MONTH'; reread: number }>  // rereads the last `reread` months, replaces them; the start date limits its months
  | Readonly<{ kind: 'FULL' }>                                           // the whole table every run; the start date never limits it (singer-sdk _state.py:145-150)
/** The one owner of what a start date limits (T.43): a CHANGED table that is not a registry, and a WINDOW table. */
export function startDateLimits(mode: TableMode): boolean
export type TableDeclaration = Readonly<{
  name: TableName            // 'notas' -> suggested sankhya_notas
  label: string              // 'Notas e pedidos'
  description: string        // one or two sentences; the window, Dados and the agent read it
  group: string              // a key of the connector's subjects ('vendas', 'fiscal', 'contabil')
  source: TableSource
  key: readonly string[]     // the source's key columns, in page order
  mode: TableMode
  history: boolean           // true keeps every version in raw (sankhya_notas_nfe); default false (decision A)
  meanings?: Readonly<Record<string, 'NFE_XML'>>   // what a column means, metadata only, for the step that reads the XML in rows
  columns:
    | Readonly<{ kind: 'DISCOVERED'; exclude: readonly string[] }>       // the dictionary's, less `exclude`; the type comes from the dictionary (T.36)
    | Readonly<{ kind: 'DECLARED'; columns: readonly (TableColumn & { path: string })[] }>  // path: the field in an OPERATION row; the column itself in a TABLE source
}>
export const DiscoveredTable = z.object({ table: SourceTable, description: z.string().nullable(), columns: z.array(TableColumn).min(1) })
export type TableFilter =
  | Readonly<{ kind: 'ALL' }>
  | Readonly<{ kind: 'SINCE'; column: string; after: string }>          // the saved point, as the source writes it
  | Readonly<{ kind: 'MONTH'; column: string; month: string }>             // '2026-11', or an out-of-calendar month the count found
export const TABLE_PAGE_DEFAULT = { rows: 500, bytes: 1_048_576 } as const      // 0063's 1 MiB stop rule
export type ConnectorTables = Readonly<{
  declared: readonly TableDeclaration[]
  page?: Readonly<{ rows: number; bytes: number }>                 // default TABLE_PAGE_DEFAULT
  discover?: Operation<{ tables: SourceTable[] }, { tables: DiscoveredTable[] }, 'read'>
  months?: Operation<{ table: SourceTable; column: string }, { months: string[] }, 'read'>  // required by a WINDOW table
  readTable?: Operation<TablePageInput, TablePage, 'read'>         // required by a TABLE source
}>
/** The one discovery: what the window lists (U8) and what `tap --discover` writes (U4). */
export function discoverTables(
  input: Readonly<{ connector: Connector; session: Session; signal: AbortSignal }>,
): Promise<readonly Readonly<{ declaration: TableDeclaration; columns: readonly TableColumn[] | null }>[]>  // null: the dictionary did not answer
/** The one owner of the lake name rule: the prefix plus the name, at most 60 (T.16). */
export function lakeNameOf(prefix: string, name: string): string
export function suggestedLakeName(input: Readonly<{ connector: ConnectorId; table: TableName; connectionName: string; taken: (name: string) => boolean }>): string
/** What a source answers when it stops a table's read: the code, never the body. */
export const TABLE_SOURCE_FAILURES = ['COPY_SOURCE_NEEDS_REAUTH', 'COPY_SOURCE_REFUSED', 'COPY_SOURCE_UNREACHABLE', 'COPY_SOURCE_UNREADABLE'] as const
export type TableSourceFailure = Readonly<{ code: (typeof TABLE_SOURCE_FAILURES)[number]; system: Readonly<{ status: number; code: string | null; message: string | null }> | null }>
/** One page of any declared table: a TABLE source through `readTable`, an OPERATION source through the operation's `list` paging. */
export function readTablePage(
  input: Readonly<{ connector: Connector; table: TableDeclaration; columns: readonly TableColumn[]; filter: TableFilter; after: TablePosition | null; session: Session; signal: AbortSignal }>,
): Promise<{ kind: 'PAGE'; rows: readonly Record<string, string | null>[]; next: TablePosition | null } | ({ kind: 'FAILED' } & TableSourceFailure)>
// Connector gains: tables?: ConnectorTables
// kernel/skill.ts: connectorSkill(definition, tables: readonly { name: string; label: string; description: string; source: string; since: string | null }[])  // since: the start date, only on a table it limits (criterion 85)
```

- **Cada estado** como união: `columns`, `source`, `mode` e o filtro por `kind` (C21).
- **Cada id** com a sua marca: `TableName` e `SourceTable`, conferidos pela conformidade contra a
  declaração (C23).
- **O dono de cada fato** (C26):
  - a lista do Sankhya, só em `sankhya/copy-tables.ts`: as tabelas de `SK` seção 1 que as sondas
    fecharam, cada uma com o nome, o rótulo, a descrição, o grupo (um assunto do Sankhya: os de hoje,
    `cadastros`, `produtos`, `vendas`, `estoque`, `financeiro`, `precos`, `logistica`, e os dois que a
    U3 acrescenta, `fiscal` e `contabil`, T.40), a origem, a chave e o modo; `notas` é
    "Notas e pedidos", "Cabeçalho de toda nota e pedido do Sankhya: venda, compra, devolução e
    transferência. O tipo de cada uma vem em TIPMOV.", grupo `vendas`, origem `TGFCAB`, chave
    `NUNOTA`, só o que mudou por `DTALTER`; `notas_nfe` é "Dados da NF-e", grupo `fiscal`, origem
    `TGFNFE`, inteira, `history: false` (T.34), com o significado `NFE_XML` declarado na coluna do XML;
  - o padrão da página, em `tables.ts`;
  - a página do Sankhya, na declaração dele, em linhas e bytes: 5.000 linhas, o teto medido do
    gateway (`C/docs/decisions/0080-copy-declared-per-table-raw-appends.md:17`), e 1 MiB, a regra de
    parada da 0063 (`C/docs/decisions/0063-copy-models-proof.md:22`), abaixo do teto de 2 MiB do
    executor (0056);
  - a regra do nome no lago, só em `lakeNameOf` e `suggestedLakeName`;
  - o que a data inicial limita, só em `startDateLimits`; `registry: true` em `parceiros`, `produtos`,
    `vendedores` e `precos_tabelas`, e `false` nas outras só do que mudou.
- **A leitura de uma página tem um dono**, `readTablePage`, que o adaptador (U4) chama para as duas
  origens e os três filtros. A de operação segue a paginação `list` da operação
  (`kernel/operation.ts:148-167`, `ListPaging`, `ListRead`), escrita de novo aqui; `kernel/list.ts` e
  `conformance-list.ts` saem.
- **O tamanho do nome**: o nome sugerido tem até 40, e `lakeNameOf` dá até 60 (o `LakeTableName` do
  fio, U7); o prefixo mais longo de hoje, `mercado_livre_`, tem 14. A conformidade recusa um prefixo
  acima de 20.
- **O esquema de cada entrada externa** (C27): a resposta do dicionário e a da contagem por mês, com
  Zod, antes de virar `DiscoveredTable`; uma coluna de tipo que o mapa não conhece vem como `text`,
  com o tipo do dicionário na descrição.
- **A página em bytes**: o leitor pede `limit` linhas; se a resposta passou dos `bytes`, a próxima
  pede `floor(limit * bytes / tamanho)`, nunca menos que 1; sem teto de colunas.
- **As rotas de teste dos dublês**: `POST /__teste/notas/<id>`, `POST /__teste/nfe/<id>` e
  `POST /__teste/colunas` (acrescenta uma coluna `AD_`) no Sankhya e `POST /__teste/negocios/<id>` no
  HubSpot, só no modo dublê (T29). O dicionário, a contagem por mês e a página da `TGFNFE` com o XML
  do dublê respondem com as gravações das sondas P1, P3, P5 e PS2, com os valores inventados (S40).
- **A origem de uma tabela por operação** é o id da operação (`negocios`), no fio e no `table_name`.
- **As colunas `_` são do motor** (T.41): a regra de hoje (`C/packages/connectors/src/kernel/copy.ts:145-151`)
  passa para a conformidade de `tables.ts` antes de `copy.ts` sair. Assim o `_sdc_*` de hoje e as
  colunas `_` que a 3a acrescentar não colidem com uma coluna declarada. No Oracle, um nome sem aspas
  começa por letra; se a descoberta do Sankhya achar uma coluna que começa por `_`, a U3 para.
- **O arquivo modelo**: nenhum declarado; a unidade segue C21, C23 e C26 direto.

### As skills e a leitura

As linhas de `packages/connectors` do `stack.md`. O guia de testes, T5 e T29.

### A ordem do trabalho

1. **A declaração, a descoberta, a leitura de página e a conformidade.** Critérios: 10, 86, 88, 113.
   - **Arquivos:** cria `kernel/tables.ts`; muda `definition.ts`, `conformance.ts`; apaga o resto de
     `copy.ts`.
   - **Testes:** `conformance.test.ts`, "a declaração por tabela"; `tables.test.ts`.
2. **O Sankhya.** Critérios: 9, 11, 89, 106, 107.
   - **Arquivos:** cria `sankhya/copy-tables.ts`: a lista, `descobrirTabelas` (uma consulta a
     `TDDTAB` e `TDDCAM` pela porta de consulta), `contarMeses` (a contagem por mês de uma coluna),
     `lerTabela` (a página pela porta de consulta da pasta nova, com o filtro).
   - **Referência a seguir:** a sonda do dicionário, `EST/descoberta-catalogo:75-80`; a janela da
     A0D, `EST/a0d-sankhya-kit-mes:93-121`.
   - **Testes:** `copy-tables.test.ts` com o dublê, a `TGFCAB` larga, a tabela de janela, a `TGFNFE`
     com o XML e uma tabela que o dicionário não tem.
   - **Mutações à mão:** tirar a redução da página: a resposta larga passa dos bytes e o 11 fica
     vermelho; enumerar os meses do mínimo ao máximo: o mês fora do calendário some e o 89 fica
     vermelho; fazer `startDateLimits` devolver verdadeiro para um cadastro: o 107 fica vermelho.
3. **A skill.** Critério: 85. As tabelas entram na parte gerada, com os nomes que a U8 passa.
4. **Os dublês.** Critério: 16. O HubSpot declara `negocios` por operação, com as colunas
   declaradas, para a bateria da U4.

- **A entrada em `docs/reference/boundaries.md`** da linha 66, remendo, com a prova, no commit da
  unidade.

### Como se prova

O 9, o 11, o 89 e o 107 pelo índice do kit contra o dublê; o 10 pela conformidade; o 113 por
`tables.test.ts`; o 85 pela skill gerada; o 16 pelas rotas de teste; o 88 junto com a U4. Hoje nada disso
existe.

### Parar se

- As sondas não fecharam a lista, a chave ou o modo de uma tabela: a tabela fica fora da lista, e o
  builder diz ao firstmate qual.
- A PS2 mostrou que a porta de consulta não devolve o XML inteiro, ou a PS1, a PS2 ou a PS4 acharam uma
  linha perto do limite de 32 MB do Athena (T.36).
- A PS1 achou numa das 42 tabelas uma coluna binária acima do teto, uma `BFILE`, ou a coluna do XML
  da `TGFNFE` que não é de texto, e o fundador ainda não viu a coluna e o maior valor (T.41): essa
  tabela fica fora da lista até a palavra dele.
- O fundador ainda não viu o tamanho da bruta da `sankhya_notas_nfe` (T.34).
- O dicionário do dublê não tem a forma da sonda, ou a sonda não trouxe o mapa de um tipo.
- A descoberta do Sankhya achou uma coluna que começa por `_` (T.41).
- A página do Sankhya de 1 MiB não cabe numa linha larga do dublê: o builder mede e diz ao
  firstmate.
- A P4 achou linhas de `DTALTER` nulo depois de uma data que o fundador usaria: o builder diz ao
  firstmate antes de limitar a `TGFITE`.
- Uma tabela de movimento segue por uma coluna que não é data, como `NUNOTA`: a data não compara com
  ela, e o builder diz ao firstmate qual.

## U4 O adaptador

**Base e modelo.** A U3 e a mudança de método. Opus: é o contrato entre o kit e o Singer, e a 0071 o
quer sem nome de conector.

### As linhas da tabela

- **Linha 11.** Ler o laço de páginas que o adaptador substitui: `C/apps/server/src/hub/copies/source-pass.ts:194-212`
  e `hub/connectors/copy-port.ts:243-315`, no histórico (a U1 os tirou). Seguir `TRM tap.py:455` e
  `:506-540` e `CDK .../concurrent_declarative_source.py:165`. Ponto de partida: a sonda
  `sondas/adaptador-duas-classes/` (344 linhas).
- **Linhas 9 e 65.** `--discover`: a mesma `discoverTables` da U3 que a janela usa pela U8; para uma
  tabela `DISCOVERED`, o gancho do kit; para uma `DECLARED`, as colunas da declaração.
- **Linha 66.** A janela por mês: a contagem por mês do kit (`months`) e um filtro `MONTH` por página.
- **Linha 63.** O binário sai em base64, com `contentEncoding: base64` no esquema do fluxo (T.36).
- **Linhas 39, 41, 43.** O `stream` é o nome no lago: no `--discover`, o sugerido; na rodada, o que o
  catálogo da rodada traz, o nome que a pessoa deu (U8). O `table_name` é a origem
  (`singer-sdk@0.54.9 singer_sdk/singerlib/catalog.py:310-324`, `:342`); as colunas, com o nome da
  fonte em minúsculas e a descrição. Toda entrada sai com `selected: false`, porque o singer-sdk marca
  tudo por padrão (`streams/core.py:102`) e a K2 diz nada marcado.
- **Linha 16.** A versão da passada em cada linha e o `ACTIVATE_VERSION` no fim:
  `singer-sdk@0.54.9 singer_sdk/target_base.py:430-448`.
- **Linha 17.** A seleção do catálogo: o Meltano entrega o catálogo com as tabelas escolhidas
  (`meltano@4.4.1 meltano/core/plugin/singer/tap.py:147`); o adaptador lê só as escolhidas.
- **Linha 72.** A `start_date` na configuração, como o Singer a lê: `singer-sdk@0.54.9
  singer_sdk/streams/_state.py:156-167` (sem ponto, a data; com ponto, o maior dos dois,
  `streams/core.py:441-462`) e o filtro `>=` (`sql/stream.py:195-206`). O Meltano a entrega como
  qualquer configuração (`meltano@4.4.1 meltano/core/plugin/singer/base.py:126-138`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/extraction/tap/` | Cria: `package.json`, `src/tap.ts`, `src/messages.ts`, `src/tap.test.ts` | a imagem (U5); o `meltano.yml` (U5) |
| `package.json`, `package-lock.json` da raiz | Muda: o espaço de trabalho novo | a CI |

### Os contratos que a unidade cria

```ts
// apps/extraction/tap/src/tap.ts — the command line, Singer's
//   tap --about | --discover --config <file> | --config <file> --catalog <file> [--state <file>]
// config: { connector: ConnectorId, account: AccountRef | null, secret_path: string, result_path: string,
//           start_date: string | null,   // 'YYYY-MM-DD', São Paulo; null: the whole history (Singer's name)
//           tables: { source: SourceTable; name: string; whole: boolean }[] }   // the run's names and whole, from CopyTaskSpec
// apps/extraction/tap/src/messages.ts
export type SingerMessage =
  | { type: 'SCHEMA'; stream: string; schema: JsonSchema; key_properties: string[] }
  | { type: 'RECORD'; stream: string; record: Record<string, unknown>; version?: number }
  | { type: 'STATE'; value: TapState }
  | { type: 'ACTIVATE_VERSION'; stream: string; version: number }
/** What the tap writes to result_path when the source stops it: the kit's code and the table, never a body. */
export type TapFailure = TableSourceFailure & { table: string }   // the lake name of the table it stopped on
```

- **O nome do fluxo** é o nome no lago: o sugerido no `--discover`, e o da configuração na rodada; o
  adaptador não monta nome. O `table_name` de cada entrada é a origem (`TGFCAB`, ou o id da operação),
  e os metadados da entrada levam o modo, a chave, o histórico e o rótulo, que a entrada da tarefa
  passa ao gravador (U5).
- **O filtro de cada tabela** sai do modo, do estado e da data (só onde `startDateLimits` diz que ela
  limita): `CHANGED` com ponto de parada lê `SINCE` do maior entre o ponto e a data; a passada inteira
  de `CHANGED` lê `SINCE` da data, ou `ALL` sem data ou num cadastro; `WINDOW` lê `MONTH` mês a mês
  (os meses da contagem a partir do mês da data na passada inteira, os `reread` últimos depois, nunca
  um anterior ao da data); `FULL` lê `ALL`.
- **O esquema Zod de cada entrada externa** (C27): a configuração, o catálogo e o estado que o
  Meltano entrega em arquivos.
- **O dono do fato**: os nomes das mensagens Singer, só em `messages.ts`; os códigos de falha são os
  do kit.
- **O que o adaptador não faz**: não lê variável de ambiente para o segredo; não importa nada fora do
  índice de `@conexus/connectors`; não nomeia conector.
- **O arquivo modelo**: nenhum declarado; a unidade segue C21, C26 e C27 direto.

### As skills e a leitura

As linhas do Meltano e do singer-sdk que a mudança de método acrescenta ao `stack.md`; a
especificação do Singer que ela cita.

### A ordem do trabalho

1. **`--about` e `--discover`.** Critérios: 17, 88. Pela `discoverTables` do kit, para cada declaração.
   - **Testes:** `tap.test.ts`, "o catálogo é a descoberta", contra a lista esperada de
     `kernel/tables-fixture.ts`, a mesma que `lake-routes.test.ts` (U8) usa pela rota.
   - **Mutações à mão:** deixar `selected` de fora: a entrada sai marcada e o 17 fica vermelho.
2. **A leitura.** Critérios: 18, 19, 86, 89, 106, 108, 113, 115. A sessão do kit (U16), as tabelas escolhidas
   em ordem, uma página por vez pela leitura de página do kit (`readTablePage`, U3), com a página do
   conector, `STATE` depois de cada página, a versão da passada, `ACTIVATE_VERSION` no fim de cada tabela.
   O filtro de cada tabela segue o modo, como acima. A recusa da fonte escreve `TapFailure` e sai com
   código 1. Antes dela, uma página que dá `UNREACHABLE` (um 5xx ou um erro de rede) é repetida pelo
   adaptador, e a repetição é dele, e não da sessão nem do executor do Hub: até 5 tentativas no total,
   com espera crescente de `backoff.expo(factor=2)` e jitter, como o `RESTStream` do singer-sdk
   (`singer-sdk@0.54.9 singer_sdk/streams/rest.py:334-340`, o 5xx e o 429, pois `extra_retry_statuses` é
   `[429]` em `:158`; `:397-409`, os erros de rede e `max_tries`; `:867-875`, a espera e as 5 tentativas;
   `:894`, o jitter). No kit o 429 é `BUSY` (`kernel/operation.ts:76-79`): entra nas mesmas 5 tentativas,
   esperando o que o provedor pediu (`waitMs`) quando pediu. Um 4xx que não é 429 não é repetido
   (`:341-347`). Só a quinta falha escreve o `TapFailure`. Com `STATE` por página, a rodada seguinte
   retoma do ponto, e uma página repetida não duplica dado.
   - **Testes:** `tap.test.ts` contra os dublês; `test_tap_battery.py` roda a bateria do singer-sdk.
   - **Mutações à mão:** emitir o `STATE` antes do `RECORD` da página: a bateria fica vermelha; comparar o
     ponto e a data pelo menor: o 108 fica vermelho. Repetir também o 4xx, ou escrever o `TapFailure` na
     primeira falha: o 115 fica vermelho.
3. **A regra.** Critério: 20.

- **A entrada em `docs/reference/boundaries.md`** da linha 11, remendo, com a prova da linha e a
  versão do pacote, no commit da unidade.

### Como se prova

Pela linha de comando, com os arquivos que o Meltano entregaria, contra os dublês; a saída crua
passa na bateria do singer-sdk. Hoje nada disso existe.

### Parar se

- Uma declaração do kit precisa de algo que o adaptador só faria nomeando o conector.
- A bateria do singer-sdk recusa uma forma que o kit declara de propósito (a chave do Sankhya, a
  conta do HubSpot).

## G1 O ponto de conferência

Depois da U4: os testes do kit, do Hub (`hub/connectors/`) e do adaptador; `tap --discover` e uma
passada com duas tabelas pela linha de comando contra os dois dublês.

## U5 A tarefa

**Base e modelo.** O G1 e o G3 mesclados e a mudança de método. Opus: a tarefa é o outro lado do fim da
rodada (0076), e o segredo atravessa o Meltano (S31).

### As linhas da tabela

- **Linha 15.** `singer-sdk@0.54.9 singer_sdk/target_base.py:479-492`, `sinks/core.py:135`,
  `:475-506`; `pyiceberg@0.12.0 pyiceberg/table/__init__.py:1705-1724`, `:1123-1158`. Ponto de
  partida: o gravador da sonda (165 linhas).
- **Linha 16.** A propriedade da tabela que diz qual versão da passada está completa
  (`target_base.py:430-448`).
- **Linha 17.** `meltano@4.4.1 meltano/schemas/meltano.schema.json:335-337`;
  `core/plugin/singer/tap.py:147`, `:211-214`; `cli/run.py:48-126`, `:297-311` (o código 1 para
  toda falha: quem diz o motivo é a entrada).
- **Linha 23.** `meltano@4.4.1 meltano/core/plugin_invoker.py:276`, `:429-439`; a saída da sonda,
  `env-names-seen-by-tap.txt`.
- **Linha 14.** `singer-sdk@0.54.9 singer_sdk/singerlib/json.py:40-44`.
- **Linha 24.** A imagem da P1: `python:3.13-slim`, Meltano 4.4.1, x86.
- **Linha 22.** A tarefa manda o próprio resultado; a parada do ECS fecha o que sobrar (0076).
- **Linhas 63 e 64.** O texto longo na linha, o binário no tipo `binary` do Iceberg (T.36), e as
  propriedades da tabela Iceberg (a origem, o rótulo e o significado das colunas), no
  mesmo `create_table` (`pyiceberg@0.12.0`, `catalog/__init__.py`, o argumento `properties`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/extraction/` | Cria: `pyproject.toml`, `uv.lock`, `meltano.yml`, `Dockerfile`, `src/conexus_extraction/{entry,target,contract}.py`, `contract/copy-task.schema.json` (gerado), `tests/` | a Release (U6); a CI de Python |
| `apps/server/src/hub/copies/lake-task.ts` | Cria: `CopyTaskSpec` e `CopyTaskResult`, donos do contrato | U8; o gerador do esquema JSON |
| `apps/server/src/platform/recordings/aws/` | Cria: `SendMessage` e `GetParameter` | os testes da U5 e da U8 |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/copies/lake-task.ts — the owner; contract/copy-task.schema.json is generated from it
export const CopyTaskSpec = z.object({
  version: z.literal(1),
  runId: LakeRunId, attempt: z.int().min(1), companyId: CompanyId,
  connector: ConnectorId, connectionId: ConnectionId, account: AccountRef.nullable(),
  startDate: z.iso.date().nullable(),   // lake_copy.start_date; entry.py writes it as the tap's start_date
  credential: z.record(z.string(), z.string()),   // the opened seal; only here
  tables: z.array(z.object({ source: SourceTableId, name: LakeTableName, whole: z.boolean() })).min(1),  // whole: asked by the Hub
  lake: z.object({ bucketArn: z.string(), region: AwsRegion }),
  queueUrl: z.url(),
})
export const CopyTaskResult = z.object({
  type: z.literal('RESULT'), version: z.literal(1), runId: LakeRunId, attempt: z.int().min(1),
  outcome: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('COMPLETE') }),
    z.object({ kind: z.literal('ERROR'), code: LakeRunFailureCode, table: LakeTableName.nullable(), system: SystemMessage.nullable() }),
  ]),
  tables: z.array(z.object({ name: LakeTableName, read: z.int().min(0), written: z.int().min(0), rows: z.int().min(0).nullable(), whole: z.boolean() })),
})
```

- **Cada estado** como união: `outcome` por `kind` (C21). Uma rodada parada porque o parâmetro sumiu
  não manda resultado.
- **Cada id** com a sua marca: `LakeRunId`, `CompanyId`, `SourceTableId`, `LakeTableName` (C23), que
  a U7 cria em `packages/hub-api/src/lake-copies.ts`, conferidos pela U8.
- **O dono do fato**: `lake-task.ts`; o Python valida contra o esquema gerado (C26);
  `lake-task.test.ts` compara o arquivo gerado com o que o Zod gera hoje.
- **O esquema de cada entrada externa** (C27): a especificação lida do parâmetro, validada antes de
  tudo; uma inválida termina a tarefa sem resultado, e a parada do ECS fecha a rodada.
- **O ambiente da tarefa** tem só `CONEXUS_RUN_PARAMETER` e a região.
- **O que a tarefa sabe de cada tabela** além da origem, do nome e do `whole` (o rótulo, a chave, o
  modo, o histórico) vem do `tap --discover`, que a entrada roda antes do `meltano run`; o parâmetro
  leva só o que o Hub decide (T.11), e o gravador recebe o resto pela configuração dele.
- **As propriedades da tabela no lago**: `conexus.origem` e `conexus.rotulo`, gravadas ao criar a
  tabela nas duas áreas; uma tabela que já existe não as regrava.
- **O arquivo modelo**: nenhum declarado.

### As skills e a leitura

As linhas do Meltano, do singer-sdk, do PyIceberg, do pyarrow e do `uv` que a mudança de método
acrescenta ao `stack.md`; as de `@aws-sdk/client-sqs` e `client-ssm`. A security S31 e S41.

### A ordem do trabalho

1. **O projeto.** Critério: 21. `pyproject.toml` com as versões do cabeçalho, `uv.lock`,
   `meltano.yml` com `tap-conexus` e `target-conexus`.
2. **O gravador.** Critérios: 21, 22. O `Target` e o `BatchSink` do singer-sdk; o esquema Arrow do
   `SCHEMA` de cada fluxo, o número em `decimal(38, 9)` pelo texto exato (T.4), `append` por lote, a
   propriedade da versão no `ACTIVATE_VERSION`. O catálogo é o REST do `S3 Tables` com SigV4 na AWS e
   um local nos testes. Ao criar a tabela, a origem e o rótulo nas propriedades; o texto longo sem
   corte. Um `SCHEMA` com uma coluna nova acrescenta a coluna na bruta (`update_schema().union_by_name`);
   uma coluna que sumiu fica. O binário em base64 vira bytes. Regras: C50, C26. Critérios: 90, 105, 106.
   - **Mutações à mão:** ignorar a coluna que não está na tabela: o 105 fica vermelho.
   - **Mutações à mão:** gravar o número por `float`: a soma fica diferente e o 21 fica vermelho.
3. **A entrada.** Critérios: 23, 24, 25, 109. Lê o parâmetro, valida, grava o segredo num arquivo `0600`,
   monta o catálogo com as tabelas da especificação escolhidas, chama `meltano run` (sem o estado
   das tabelas com `whole`), lê o resultado do leitor e as contagens do gravador por fluxo,
   manda um `CopyTaskResult`. O gravador confere o parâmetro antes de cada `append`. Regras: S31,
   S41, C51.
   - **Mutações à mão:** pôr o segredo na configuração do Meltano: o 23 fica vermelho.
4. **A imagem.** Critério: 26. `Dockerfile` em dois estágios: o adaptador com o Node 24; o Python
   3.13 com `uv sync --frozen`; `x86_64`.
5. **Os testes na AWS.** Critérios: 26, 27, 28 (L.1, L.3, L.5), com a imagem que a U6 publica; fecham
   no ponto de conferência do G2.

### Como se prova

O 21 e o 22 pelo `meltano run` com o catálogo local; o 23 a 25 pela entrada, com as gravações da
AWS; o 26 a 28 só na AWS. Hoje nenhum existe.

### Parar se

- O catálogo REST do `S3 Tables` recusa a forma que o PyIceberg 0.12 manda (L.1), ou as propriedades da
  tabela no `create_table`.
- A especificação de uma rodada com todas as tabelas declaradas passa dos 8 KB do parâmetro avançado (T.11).
- O Meltano passa ao gravador algo do leitor pelo ambiente que inclua o segredo.
- A conferência do parâmetro a cada lote, somada ao lote do SDK, não para a tarefa antes de 5
  minutos: o builder mede e diz ao firstmate.

## U6 A plataforma da cópia

**Base e modelo.** A U5 e a segunda preparação. Opus: são poderes novos de três papéis, e um erro
abre o lago de uma empresa a outra.

### As linhas da tabela

- **Linha 27.** Ler `C/infra/aws/lib/platform.ts:114-123` (o teto), `:126-193` (o papel do robô),
  `C/infra/aws/lib/lake.ts:116-180` (o papel que lê, a forma que o que escreve segue),
  `preparation.ts:209-262` e `hub.ts:14-20`.
- **Linha 26.** `aws-cdk-lib@2.278.0`, os quatro módulos, lidos na versão instalada; a forma medida,
  `conexus-lab-trilho/fases2a4/plataforma.py:80-90`.
- **Linha 25.** Sub-redes públicas, IP público, sem NAT (T.6).
- **Linha 24.** A Release monta a imagem; a do Hub continua no `ghcr.io`.
- **Linha 32.** O Hub ganha `s3tables:ListTables` e `DeleteTable` nos depósitos de lago
  (`C/infra/aws/test/platform.test.ts:74-86` mostra que hoje não tem).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `infra/aws/lib/` | Cria `copy.ts`; muda `platform.ts`, `lake.ts`, `names.ts`, `preparation.ts` | `infra/aws/bin/`; `apps/server/src/platform/aws.ts` lê os nomes |
| `infra/aws/lake.template.json` | Gerado de novo | o Hub, pela Release |
| `infra/aws/test/` | Muda | — |
| `.github/workflows/aws-platform.yml` | Muda: monta, confere e publica a imagem antes da plataforma | a Release |
| `docs/how-to/aws-conta-de-laboratorio.md` | Muda: a segunda preparação | o firstmate |

### Os contratos que a unidade cria

- **Os nomes** (`infra/aws/lib/names.ts`, C26): `WRITER_SUFFIX = '-escritor'`;
  `COPY_CLUSTER`, `COPY_TASK_FAMILY` e `COPY_REPOSITORY = 'conexus-copia'`;
  `COPY_QUEUE = 'conexus-copia-fim'` e `conexus-copia-fim-mortos`;
  `RUN_PARAMETER_PREFIX = '/conexus/copia/'` (`/conexus/copia/<empresa>/<rodada>`);
  `COPY_EXECUTION_ROLE = 'conexus-copia-execucao'`, em `PLATFORM_ROLES`.
- **As saídas da plataforma** que o Hub lê: o ARN do cluster, da definição de tarefa, da fila, e as
  sub-redes e o grupo de segurança.
- **O que a U10 usa já nasce aqui**, para ela não mudar a receita de um lago que já tem dado
  (T.5): o prefixo da empresa no depósito do estado e o grupo de consultas do Athena do papel que
  escreve.
- **O papel que escreve**, na receita: `conexus-<lago>-escritor`, com o teto, a etiqueta da empresa,
  confiando só em `ecs-tasks.amazonaws.com` com `aws:SourceAccount`; grava nas duas áreas do lago da
  empresa pelas concessões do Lake Formation; lê só `/conexus/copia/<empresa>/*`; manda mensagem só
  à fila da cópia.
- **O teto**: a escrita nas tabelas das duas áreas (`raw` e `current`) dos depósitos `conexus-*`, a
  leitura de parâmetros sob `/conexus/copia/` e o envio à fila; continua sem `iam:*`.
- **O papel do Hub**: `ecs:RunTask` só na definição da cópia, com `ecs:cluster`; `ecs:StopTask`,
  `DescribeTasks`, `ListTasks` só no cluster; `iam:PassRole` só em `role/conexus-*-escritor` com
  `iam:PassedToService` e no papel de execução; `ssm:PutParameter`, `DeleteParameter` em
  `parameter/conexus/copia/*`; `sqs:ReceiveMessage`, `DeleteMessage` na fila; `s3tables:ListTables`,
  `DeleteTable` nos depósitos de lago.
- **A regra**: o evento "ECS Task State Change" com `lastStatus` `STOPPED` do cluster da cópia vai à
  fila; a fila só aceita mensagem dessa regra e dos papéis que escrevem.
- **A definição de tarefa**: 1 vCPU e 2 GB, x86 (T.6); a primeira carga sobe pelos `overrides` do
  `RunTask`, que o papel do Hub já pode pedir na mesma ação.
- **O arquivo modelo**: `infra/aws/lib/lake.ts`, o papel que lê.

### As skills e a leitura

As linhas de `aws-cdk-lib`, `aws-cdk` e `constructs` do `stack.md`: as skills `aws-cdk` e `aws-iam`.
A security S36 e S40.

### A ordem do trabalho

1. **Os nomes e a plataforma da cópia.** Critério: 29.
2. **O papel que escreve e o teto.** Critério: 30. O robô ganha `iam:CreateRole` em
   `role/conexus-*-escritor` com a condição do teto, como faz com os que leem (`platform.ts:139-144`),
   e as ações de `TendReaders` (`platform.ts:145-149`).
   - **Mutações à mão:** tirar a condição do teto na criação: o teste fica vermelho.
3. **Os poderes do Hub.** Critério: 32.
4. **A preparação e a Release.** Critério: 34.
5. **Os testes na AWS.** Critérios: 33, 31 (L.2 primeiro, depois L.6). Se o L.2 falhar, a unidade
   para.

### Como se prova

O 29, o 30, o 32 e o 34 pelo `cdk synth` com as asserções e pelo teste dos workflows; o 31 e o 33 só
na conta de laboratório. Hoje nenhum existe.

### Parar se

- O L.2 falha: volta ao fundador (0071).
- O Lake Formation não aceita a concessão de escrita ao papel novo dentro da pilha (L.6).
- A preparação precisa de um poder da Release além das peças do critério 29 e da publicação no depósito de imagens (34).

## G2 O ponto de conferência

Depois da U6: `cdk synth` com as asserções; a imagem montada pela Release na conta de laboratório; o
L.2 antes de tudo, depois o L.1, o L.3, o L.5 e o L.6, cada um com a saída no pull request; os testes
de Python pela CI.

## U7 A migração e a permissão

**Base e modelo.** A etapa do conector usada. Sonnet: uma migração que acrescenta tabelas e uma
permissão nomeada, e os ids do fio da cópia.

### As linhas da tabela

- **Linha 18.** A forma das referências: a conexão com a agenda, o fluxo, a rodada e as contagens
  por fluxo (`AP .../schema_dump.txt:194-217`, `:629-639`); o índice de uma rodada aberta por
  cópia que a U15 tirou (`C/apps/server/src/hub/copies/tables.ts:139`, no histórico), agora por
  ligação (0076); o teto de `system_code` (#1135) ao lado do de `system_message`
  (`tables.ts`, `copy_run_system_message`, no histórico).
- **Linha 71.** A data inicial em `lake_copy`, uma coluna `date` nula como o `interval`: a Nekt a pede
  com o acesso e vazia é todo o histórico (`NK:177721-177729`), o Airbyte a põe na especificação da
  fonte (`AB@82db089b source-netsuite/source_netsuite/spec.yaml:54-60`); fica na cópia, e não na
  ligação (T.42).
- **Linha 33.** Ler `C/apps/server/src/hub/lake/tables.ts:48-56`: hoje só o operador alcança a
  linha. Seguir a política e a permissão por coluna que `database-grants.sql` já usa.
- **O fio da cópia.** Os ids e os códigos que a tarefa, o Hub e a tela dividem nascem aqui, com a
  primeira tabela que os confere: as formas de hoje (`CopyRunId`, `CopyInterval`,
  `CopyRunFailureCode`, `CopySystemMessage`, em `C/packages/hub-api/src/copies.ts:16-43` e
  `copy-shown.ts:48`, no histórico) são só leitura; os nomes novos são do lago.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/lake-tables.ts` | Cria o esquema `copies`, de novo, e as quatro tabelas | U8 |
| `apps/server/src/hub/lake/tables.ts` | Muda: a política de leitura da empresa | `hub/lake/`; U8 |
| `apps/server/src/hub/connectors/tables.ts` | Cria `connection_link` | U20 |
| `apps/server/migrations/`, `database-grants.sql`, a foto do catálogo | Cria a migração (só acrescenta); muda as permissões | `migrate`; `apps/server/src/platform/catalog.test.ts` |
| `packages/hub-api/src/lake-copies.ts`, `index.ts` | Cria: os ids e os códigos do fio da cópia | U5, U8, U9 |

### Os contratos que a unidade cria

| Tabela | Coluna | Tipo | Restrição | Ao apagar |
| --- | --- | --- | --- | --- |
| `copies.lake_copy` | `company_id`, `connector_id`, `connection_id`, `interval`, `start_date`, `created_at` | `text`, `text`, `uuid`, `text`, `date`, `timestamptz` | chave `(company_id, connection_id)`; `interval` em `LakeInterval`, `MANUAL` incluído; `start_date` nula (todo o histórico) ou um dia (T.42); `created_at` é a hora de partida do relógio (T.38); política da empresa | a ligação (`company_id, connector_id, connection_id`): `cascade`; a empresa: `cascade` |
| `copies.lake_table` | `id`, `company_id`, `connection_id`, `source_table`, `name`, `label`, `columns`, `rows`, `last_run_id` | `uuid`, `text`, `uuid`, `text`, `text`, `text`, `jsonb`, `bigint`, `uuid` | `UNIQUE (company_id, connection_id, source_table)`; índice único `(company_id, lower(name))`; `name` pelo padrão de `LakeTableName`; `columns` um array JSON | a cópia da ligação (`company_id, connection_id`): `cascade`; `last_run_id`: `set null` |
| `copies.lake_run` | `id`, `company_id`, `connection_id`, `started_at`, `ended_at`, `outcome`, `whole`, `code`, `failed_table`, `system_code`, `system_message`, `task_arn`, `attempt` | `uuid`, `text`, `uuid`, `timestamptz`, `timestamptz`, `text`, `boolean`, `text`, `text`, `text`, `text`, `text`, `integer` | `ended_at` e `outcome` nulos juntos; `outcome` em `COMPLETE`, `ERROR`, `INTERRUPTED`; código só com `ERROR`; `system_code` até `SYSTEM_CODE_MAX`; `task_arn` nulo ou `arn:aws:ecs:%`; `attempt >= 1`; índice único `lake_run_open_key` em `connection_id` onde `ended_at IS NULL` | a cópia da ligação: `cascade` |
| `copies.lake_table_run` | `run_id`, `table_id`, `company_id`, `read`, `written`, `rows`, `whole` | `uuid`, `uuid`, `text`, `integer`, `integer`, `bigint`, `boolean` | chave `(run_id, table_id)`; contagens `>= 0` | a rodada: `cascade`; a tabela: `cascade` |
| `connectors.connection_link` | as colunas da spec 02 (`C5`, `design.md:189-205`): `id`, `company_id`, `connector_id`, `name`, `secret_hash`, `asked`, `sealed`, `key_id`, `created_by`, `expires_at` | `uuid`, `text`, `text`, `text`, `text`, `text[]`, `bytea`, `text`, `text`, `timestamptz` | `secret_hash` único, 64 caracteres hexadecimais; `expires_at` 30 minutos depois da criação; `name` com a conferência de `connection_name`; política da empresa, e a de leitura do papel dono, como `connection_seals_select` (`C/apps/server/src/hub/connectors/tables.ts:111-115`) | a empresa: `cascade` |
| `lake.company_lake` | — | — | política `select` para o login da empresa, `company_id = <empresa da sessão>`; `GRANT SELECT (company_id, lake_id, state, account, region)` | — |

```ts
// packages/hub-api/src/lake-copies.ts — the wire of the lake copy; hub-api does not import the kit (0056)
export const LakeRunId = z.uuid().brand('LakeRunId')
export const LakeTableId = z.uuid().brand('LakeTableId')
export const LakeTableName = z.string().regex(/^[a-z][a-z0-9_]{0,59}$/).brand('LakeTableName')  // `sankhya_notas`
export const SourceTableId = z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,59}$/).brand('SourceTableId') // `TGFCAB`, the kit's SourceTable
export const LakeInterval = z.enum(['15m', '30m', '1h', '2h', '6h', '24h', 'MANUAL'])
export const LAKE_INTERVAL_DEFAULT = '24h' satisfies LakeInterval   // founder, 2026-11-23: "24 h, como a Nekt"
export const LakeRunFailureCode = z.enum([
  'COPY_SOURCE_NEEDS_REAUTH', 'COPY_SOURCE_REFUSED', 'COPY_SOURCE_UNREACHABLE', 'COPY_SOURCE_UNREADABLE',
  'COPY_LAKE_UNAVAILABLE', 'COPY_TASK_LOST', 'COPY_LAKE_WRITE_FAILED',
])
export const SYSTEM_CODE_MAX = 64
export const SYSTEM_MESSAGE_MAX = 1000                     // today's, `C/packages/hub-api/src/copy-shown.ts:45`
/** What the source system said when it refused a read. */
export const SystemMessage = z.object({ status: z.int(), code: z.string().max(SYSTEM_CODE_MAX).nullable(), message: z.string().max(SYSTEM_MESSAGE_MAX).nullable() })
```

- O login da empresa tem `SELECT`, `INSERT`, `UPDATE` e `DELETE` nas quatro tabelas, com a política
  da empresa, como as de `copies` hoje.
- Quem marcou e quando vai no registro do Hub (`LAKE_COPY_SET`), e não numa coluna: nenhuma tela o
  mostra.
- **O arquivo modelo**: `apps/server/src/hub/lake/tables.ts`, da etapa 1 (C26: as conferências
  nomeadas e a política da empresa; C23: os ids conferidos na leitura). As tabelas de `copies` de hoje
  (`C/apps/server/src/hub/copies/tables.ts`, no histórico) são só leitura.
- **O dono do fato**: o teto do código ao lado do da mensagem, e a lista dos códigos, só em
  `lake-copies.ts` (C26); o índice de `lake_run` confere o código contra a mesma lista.
- **O padrão de `SourceTableId`** é o de `SourceTable` do kit; `lake-routes.test.ts` (U8) confere que
  todo id declarado no kit passa nele.

### As skills e a leitura

A skill `drizzle`. O guia de dados, D6, D10, D11, D15.

### A ordem do trabalho

1. **As tabelas e o fio.** Critério: 35. A migração cria as quatro; `lake-copies.ts` nasce com elas.
   Testes: `lake-tables.test.ts`: a segunda cópia da mesma ligação, a
   mesma fonte duas vezes, o mesmo nome em duas ligações e a segunda rodada aberta são recusados pelo
   banco; o código longo também.
   - **Mutações à mão:** tirar o índice da rodada aberta: o teste fica vermelho.
2. **A leitura da linha do lago.** Critério: 36.
   - **Mutações à mão:** tirar a condição da empresa na política: o teste fica vermelho.
3. **A tabela do link.** Critério: 91. `connectors.connection_link` com as conferências e as políticas
   da spec 02 (`C5`); a função `connectors.link_of(secret_hash)`, `SECURITY DEFINER`, só para a linha
   viva, dona do papel novo `hub_links` (`NOLOGIN`, `NOBYPASSRLS`), na forma de
   `projects.project_of_host` e de `hub_connection_seals` (`design.md:224`); a U20 a usa. É permissão no
   banco do Hub (data D11), neste pull request.

### Como se prova

Pelo `migrate` num PostgreSQL local e pelas leituras e gravações com o login da empresa. Hoje as
tabelas não existem e a empresa não vê a linha do lago.

### Parar se

- Uma conferência do banco pede um código fora de `LakeRunFailureCode`.

## G3 O ponto de conferência

Depois da U7: o `migrate` num PostgreSQL local, a foto do catálogo, o `catalog.test.ts`.

## U8 O disparo e o fim

**Base e modelo.** O G2 e o G3 mesclados. Opus: concorrência entre o relógio, a fila e a varredura,
e o fim de uma rodada que roda fora do Hub.

### As linhas da tabela

- **Linha 18 e 21.** O relógio da ligação na forma do de hoje, no histórico
  (`C/apps/server/src/builder/copy-clock/clock.ts:59-104`: a criação que tolera a corrida, `:70-79`;
  os intervalos, `:14-21`), com o id da ligação; o disparo pelo `RunTaskRequest`
  (`@aws-sdk/client-ecs@3.1175.0 dist-types/models/models_1.d.ts:3243-3343`, `:2858`); a forma da P3
  e da P4.
- **Linha 71.** A data viaja da cópia à rodada: o `PUT` a grava em `lake_copy.start_date` e a
  especificação da rodada a leva (`AB@82db089b source-netsuite/source_netsuite/spec.yaml:54-60`, a
  data na configuração da fonte).
- **Linha 73.** Gravar a data só grava, e reler é pedido: o Meltano manda `--full-refresh`
  (`meltano@4.4.1 meltano/core/plugin/singer/tap.py:276-281`) e `state clear` (`cli/state.py:439-470`),
  o Airbyte o Refresh que a pessoa pede (`AB@82db089b
  docs/platform/using-airbyte/getting-started/add-a-source.md:32-42`, `operator-guides/refreshes.md:7`,
  `:26`, `:36-48`) e a Nekt o Full Sync (`NKH:150766`, `NKT:92-102`). A porta é a do **Rodar agora**
  (T.39).
- **Linha 22.** O fim de hoje, no histórico (`run.ts:116-165`); `WaitTimeSeconds`
  (`@aws-sdk/client-sqs@3.1175.0 dist-types/models/models_0.d.ts:1373`); o evento da regra (campos
  em `EST/p4-fim-na-aws:151`).
- **Linha 23.** O parâmetro da rodada, gravado pelo Hub, lido pela tarefa, apagado no fim (0077).
- **Linhas 19, 10, 39 e 45.** Marcar na ligação: a lista do kit (U3), o dicionário pelo gancho, a
  classe da credencial (U16); o nome por `lakeNameOf` (U3); a segunda ligação do mesmo sistema
  recusada com `COPY_NAME_TAKEN` (T.16).
- **Linha 31.** As rotas da lista e das rodadas de Dados, novas, sobre `lake_table` e `lake_run`; a
  lista de hoje, que a U14 tirou (`C/apps/server/src/hub/copies/list.ts`, no histórico), é só
  leitura.
- **Linha 32.** Ler `C/apps/server/src/platform/aws.ts:279-296` e `C/apps/server/src/hub/lake/lake.ts:149-160`,
  `:273-315`; seguir `@aws-sdk/client-s3tables@3.1175.0` `ListTablesCommand.d.ts`,
  `DeleteTableCommand.d.ts`.
- **Linha 37.** As gravações novas e as issues #1265, #1266 e #1267.
- **Linhas 21, 56 a 62.** O relógio que só diz "quando" e o resto do Relógio, de `REL` seção 4: o passo do
  workflow chama `iniciarRodada`, e o **Rodar agora** chama o mesmo, sem `schedules.run`; o cron
  ancorado no minuto e na hora da ligação, no fuso de `clock.ts:12`, no lugar do mapa fixo
  `clock.ts:15-22`; as políticas de poda `triggers` e `workflowSnapshot` do `@mastra/pg` na poda diária
  de `storage.ts:22-28`, com a idade da 0068; uma partida por vez antes do `PutParameter`. O tamanho
  da máquina pelos `overrides` do `RunTask` (linha 59). `MANUAL` sem linha do relógio (linha 57).
- **Linhas 39 e 45.** O nome: o sugerido por `suggestedLakeName` (U3), o recebido no `PUT` conferido
  por `lakeNameOf`, e o índice do nome por empresa.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/aws.ts`, `config-aws.ts`, `test-aws.ts`, `recordings/aws/`, `scripts/` (o roteiro de gravação) | Muda: as portas `CopyTasks`, `CopyQueue`, `LakeTables`, os nomes da U6, as saídas na configuração; os dublês; as gravações | `hub/copies/`, `hub/lake/`, a QA |
| `apps/server/src/hub/copies/` | Cria `lake-copy.ts`, `lake-run.ts`, `lake-queue.ts`, `lake-list.ts`, `lake-routes.ts`, `public.ts` | `hub/connectors/` (desligar), `main.ts` (a subida) |
| `apps/server/src/builder/copy-clock/`, `builder/mastra/hub-mastra.ts`, `conversations-of.ts`, `main.ts` | Cria de novo o relógio da ligação, que só chama `iniciarRodada`, com `cronOf`; liga a subida e a remoção da empresa | `hub/copies/` |
| `apps/server/src/builder/conversation/storage.ts`, `builder/mastra/retention.ts` | Muda: a poda diária liga as políticas `triggers` e `workflowSnapshot` | a subida do Hub |
| `apps/server/src/hub/connectors/` (a skill da ligação) | Muda: a skill gerada recebe as tabelas da ligação, com os nomes de `lake_table` | o Assistente |
| `apps/server/src/hub/lake/lake.ts` | Muda: apagar o lago apaga as tabelas e as cópias do lago | `hub/operations/` |
| `apps/server/src/hub/connectors/` | Muda: desligar a ligação leva a cópia dela | — |
| `packages/hub-api/src/lake-copies.ts`, `failures.ts`, `index.ts` | Muda: as rotas da ligação e de Dados, os códigos de marcar | U9 |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/lake-copies.ts
const LakeRunBase = { id: LakeRunId, startedAt: z.iso.datetime(), whole: z.boolean() }  // whole: the table's, from lake_table_run, on a table's runs (T.39)
const LakeRunCounts = { endedAt: z.iso.datetime(), read: z.int().min(0), written: z.int().min(0) }
export const LakeRun = z.discriminatedUnion('outcome', [
  z.object({ ...LakeRunBase, outcome: z.literal('RUNNING') }),
  z.object({ ...LakeRunBase, ...LakeRunCounts, outcome: z.literal('COMPLETE') }),
  z.object({ ...LakeRunBase, ...LakeRunCounts, outcome: z.literal('ERROR'),
    code: LakeRunFailureCode, failedTable: LakeTableName.nullable(), system: SystemMessage.nullable() }),
  z.object({ ...LakeRunBase, ...LakeRunCounts, outcome: z.literal('INTERRUPTED') }),
])
const LakeMode = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('CHANGED'), column: z.string(), registry: z.boolean() }),
  z.object({ kind: z.literal('WINDOW'), column: z.string() }),
  z.object({ kind: z.literal('FULL') }),
])
export const LakeTablesOfConnection = z.object({
  lake: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('READY') }),
    z.object({ kind: z.literal('NOT_READY') }),
    z.object({ kind: z.literal('UNAVAILABLE'), reason: z.enum(['NO_TABLES', 'EXCLUSIVE_CREDENTIAL']) }),
  ]),
  interval: LakeInterval.nullable(),
  startDate: z.iso.date().nullable(),   // the copy's; null: the whole history
  tables: z.array(z.object({
    source: SourceTableId, label: z.string(), description: z.string().nullable(), group: z.string(),
    mode: LakeMode, columns: z.int().min(0).nullable(), limited: z.boolean(),   // limited: startDateLimits
    copy: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('UNMARKED'), suggested: LakeTableName }),   // the kit's, or with the connection's name when taken (T.16)
      z.object({ kind: z.literal('MARKED'), name: LakeTableName, lastRun: LakeRun.nullable() }),  // the name is fixed
    ]),
  })),
  lastRun: LakeRun.nullable(),
})
export const SetLakeCopy = z.object({
  tables: z.array(z.object({ source: SourceTableId, name: LakeTableName })).max(60),
  interval: LakeInterval,
  startDate: z.iso.date().nullable(),   // null: the whole history; after today: 422 COPY_START_DATE_INVALID; saving never starts a run (T.45)
})
export const RunLakeCopy = z.object({ whole: z.boolean().default(false) })  // true: Ler de novo desde a data, whole only where startDateLimits (T.45)
export const LakeTableSummary = z.object({
  id: LakeTableId, connection: z.object({ id: ConnectionId, name: z.string(), connector: z.string() }),
  name: LakeTableName, label: z.string(), source: SourceTableId, mode: LakeMode, interval: LakeInterval,
  startDate: z.iso.date().nullable(),   // null when the date does not limit the table
  rows: z.int().min(0).nullable(), columns: z.array(z.object({ name: z.string(), type: z.string(), description: z.string().nullable() })),
  lastRun: LakeRun.nullable(), next: z.iso.datetime().nullable(),
})
// GET  /api/companies/{companyId}/connections/{connectionId}/lake-tables     -> LakeTablesOfConnection
// PUT  /api/companies/{companyId}/connections/{connectionId}/lake-copy        SetLakeCopy -> LakeTablesOfConnection
//      409 COPY_LAKE_NOT_READY | COPY_RUN_OPEN | COPY_NAME_TAKEN | COPY_NAME_FIXED; 422 COPY_TABLE_NOT_DECLARED | COPY_NAME_INVALID | COPY_START_DATE_INVALID; 403 FORBIDDEN (manageCopies)
// POST /api/companies/{companyId}/connections/{connectionId}/lake-copy/run    RunLakeCopy -> 202 | 200 { already: true }   (works under MANUAL)

// apps/server/src/hub/copies/lake-run.ts — the one start, for the clock and for Rodar agora (Relógio)
export function iniciarRodada(
  at: CompanyScope, connection: ConnectionId, cause: 'CLOCK' | 'NOW', whole = false,   // whole: only from Ler de novo desde a data (T.45)
): Promise<{ kind: 'QUEUED'; run: LakeRunId } | { kind: 'ALREADY_RUNNING' } | { kind: 'NO_COPY' }>
// apps/server/src/builder/copy-clock/clock.ts — only "when"
export function cronOf(interval: Exclude<LakeInterval, 'MANUAL'>, anchor: Date): string   // São Paulo; 10:07 + '15m' -> '7,22,37,52 * * * *'
// GET  /api/companies/{companyId}/lake-tables                                -> LakeTableSummary[]  (only the connections the viewer reads)
// GET  /api/companies/{companyId}/lake-tables/{tableId}/runs                 -> LakeRun[]  (the connection's runs that carried it, with its counts); 404 NOT_FOUND (S10)

// apps/server/src/platform/aws.ts — the one adapter (C56)
export const TaskArn = z.string().startsWith('arn:aws:ecs:').brand('TaskArn')
export const RunParameter = z.string().startsWith('/conexus/copia/').brand('RunParameter')
export type CopyTasks = {
  putRun(at: Where, run: { name: RunParameter; spec: string }): Promise<AwsAnswer<void>>
  deleteRun(at: Where, name: RunParameter): Promise<AwsAnswer<void>>       // missing counts as deleted
  start(at: Where, run: { token: string; startedBy: LakeRunId; writer: string; parameter: RunParameter }): Promise<AwsAnswer<TaskArn>>
  stop(at: Where, task: TaskArn): Promise<AwsAnswer<void>>
  state(at: Where, task: TaskArn): Promise<AwsAnswer<'RUNNING' | 'STOPPED' | 'MISSING'>>
}
export type CopyQueue = {
  receive(signal: AbortSignal): Promise<AwsAnswer<readonly { handle: string; body: string }[]>>  // one long poll, never the database
  acknowledge(handle: string): Promise<AwsAnswer<void>>
}
export type LakeTables = {
  list(at: Where, lake: LakeId): Promise<AwsAnswer<readonly { namespace: 'raw' | 'current'; name: string }[]>>
  drop(at: Where, lake: LakeId, table: { namespace: 'raw' | 'current'; name: string }): Promise<AwsAnswer<void>>  // missing counts as dropped
}
// apps/server/src/hub/copies/lake-queue.ts
export const CopyQueueMessage = z.discriminatedUnion('type', [
  CopyTaskResult,
  z.object({ type: z.literal('ECS_STOPPED'), runId: LakeRunId, task: TaskArn, stopCode: z.string(), exitCode: z.int().nullable() }),
])
```

- **Onde nasce cada tipo do fio** (decisão 0056: `hub-api` não importa o kit): os ids nascem em
  `packages/hub-api/src/lake-copies.ts` (U7). `lake-routes.ts` passa cada nome e origem do kit pelo
  esquema do `hub-api` na porta, e `lake-routes.test.ts`, "o id da tabela", confere que todo nome e
  origem declarados no kit passam nele (C26: o kit é dono da declaração; o `hub-api`, do fio).
- **`LakeTableSummary`**, escrito do zero (T.24): a ligação da tabela, o rótulo, o nome no lago e a
  origem; o intervalo e a próxima hora do relógio da ligação, ou `null` sem relógio; as linhas da
  última rodada completa; as colunas guardadas; a última rodada, `RUNNING` para a aberta.
- **A poda**: `closeLakeRun` apaga, na mesma transação, as rodadas da ligação além das 100 mais
  novas, como `C/apps/server/src/hub/copies/run.ts:25-26` faz por cópia; as contagens vão em cascata.
- **Cada estado** como união: `lake` por `kind`; a mensagem por `type`; o resultado por `kind`; o
  estado da tarefa como três literais (C21).
- **Cada id** com a sua marca: `TaskArn`, `RunParameter`, `LakeRunId`, conferido contra `lake_run.id`
  antes de fechar; `SourceTableId` conferido contra a declaração do kit no `PUT` (C23).
- **O dono de cada fato** (C26): os nomes, em `infra/aws/lib/names.ts`; o teto de 48 horas, o de
  8 KB (T.11), o tamanho da máquina (1 vCPU e 2 GB; 2 vCPU e 4 GB na primeira carga, T.6) e as 3 gravações
  por segundo da fila de partidas (T.32) em `lake-run.ts`; o padrão de 24 h em `LAKE_INTERVAL_DEFAULT`; o `clientToken` `<rodada>-<tentativa>` só em `lake-run.ts` (T.8); a regra do
  nome em `lakeNameOf` (U3).
- **O esquema Zod de cada entrada externa** (C27): a mensagem da fila, o evento do ECS, a resposta de
  cada chamada da AWS, a resposta do dicionário.
- **Gravar a cópia** (`lake-copy.ts`): no `PUT`, numa transação, a cópia da ligação, as linhas novas
  com o nome dado e as desmarcadas; antes dela, a linha do lago relida (T.19), cada nome conferido
  (`COPY_NAME_INVALID`, `COPY_NAME_FIXED`; `COPY_NAME_TAKEN` pelo índice) e o dicionário para as
  colunas; depois, o relógio (nenhum em `MANUAL`) e, se nasceu uma tabela, um disparo. Desmarcar
  apaga as tabelas da AWS primeiro e a linha depois. O `GET` da ligação passa a lista de
  `discoverTables` (U3) pelo esquema do fio, com a sugestão de `suggestedLakeName` contra os nomes da
  empresa.
- **A data inicial** (T.42, T.45): o `PUT` grava `lake_copy.start_date` como grava o intervalo, sem
  disparar nada. Uma data depois de hoje é recusada, 422 `COPY_START_DATE_INVALID`; o dono do "hoje" é
  `lake-copy.ts`, no fuso de `clock.ts:12`. `POST .../lake-copy/run` com `whole: true` (**Ler de novo
  desde a data**) chama `iniciarRodada` com `whole`, que marca `whole` nas tabelas marcadas que
  `startDateLimits` limita, e as outras seguem como sempre; com a rodada aberta responde 200
  `already` e não grava nada, como o **Rodar agora** (39). A especificação da rodada leva `startDate`
  em toda rodada.
- **As rodadas de uma tabela** (`GET .../lake-tables/{id}/runs`) trazem o `whole` e as contagens
  daquela tabela, de `lake_table_run`; a rodada que uma tabela nova dispara lê inteira só ela (T.39).
- **A poda do rastro**: a política `triggers` do domínio `schedules` na poda diária; as execuções do
  workflow da cópia saem pelo nome dele, uma a uma, mais velhas que a idade da 0068. A política
  `workflowSnapshot` não entra, porque não filtra pelo workflow e levaria as execuções das automações
  (`C/apps/server/src/builder/automations/runs.ts:150`).
- **Apagar o lago** apaga, depois das tabelas e das áreas, as linhas de `lake_copy` da empresa e os
  relógios das ligações dela, na mesma passada (critério 48).
- **`iniciarRodada`** é a única porta de partida: a varredura, a rodada aberta, a fila de partidas, o
  parâmetro, o `RunTask` com o tamanho da rodada. O passo do workflow do relógio termina quando ela
  responde, sem esperar a cópia; `NO_SCHEDULE` não existe.
- **As frases e o registro de falhas**: cada `LakeRunFailureCode` e cada código de marcar tem a sua
  entrada no registro de falhas de `packages/hub-api/src/failures.ts`, escrita de novo (as de hoje,
  `C/packages/hub-api/src/copy-failures.ts:69`, no histórico, são só leitura); as frases da tela são
  as da matriz, em `text.ts` (U9). `lake-routes.test.ts`, "os códigos da fonte", confere que todo
  código de `TABLE_SOURCE_FAILURES` do kit está em `LakeRunFailureCode` (C26: um dono de cada lado,
  uma prova que cruza).
- **Desligar**: a rota de hoje de `hub/connectors/` chama a cópia do lago antes de apagar a linha:
  para a tarefa aberta, apaga as tabelas da AWS e só então a linha da ligação, cuja chave leva
  `lake_copy` em cascata; com a AWS fora, 503 e nada muda.
- **O relógio** sai com a empresa: a remoção da empresa apaga o relógio de cada ligação dela.
- **Quem fecha**: uma função só, `closeLakeRun`, chamada pela fila e pela varredura; fecha com
  `UPDATE lake_run ... WHERE id = $1 AND ended_at IS NULL RETURNING`, e só quem recebe a linha grava
  as contagens, `lake_table.rows` e `last_run_id`, apaga o parâmetro e registra `COPY_RUN_ENDED`.
- **O consumidor** só lê a fila enquanto há rodada aberta que o Hub conhece; ao subir, lê uma vez as
  rodadas abertas (data D27).
- **A varredura sem `task_arn`**: acha a tarefa pelo `startedBy` (`ListTasks`); sem tarefa, fecha como
  `COPY_TASK_LOST`.
- **O arquivo modelo**: nenhum declarado; a unidade segue C21, C23 e C26 direto.

### As skills e a leitura

As linhas de `@aws-sdk/client-ecs`, `client-sqs`, `client-ssm`, `client-s3tables`,
`@smithy/node-http-handler` e `@mastra/core` do `stack.md`: as skills `aws-sdk-js-v3-usage` e
`mastra`. O guia de dados, D25 e D27; a security S8 e S41.

### A ordem do trabalho

1. **O adaptador da AWS e as gravações.** Critérios: 39, 44, 45, 53. As três portas em `aws.ts`; as
   gravações de `PutParameter`, `DeleteParameter`, `RunTask`, `StopTask`, `DescribeTasks`,
   `ListTasks`, `ReceiveMessage`, `DeleteMessage`, `ListTables` e `DeleteTable`, feitas na conta de
   laboratório pelo roteiro que entra em `scripts/` (#1267); `test-aws.ts` responde também
   `DescribeStackEvents` e o `S3 Tables` (#1265); as gravações sem leitor ganham o seu ou saem, e os
   ids de laboratório saem delas (#1266).
2. **A lista da ligação e gravar a cópia.** Critérios: 37, 38, 52, 85, 88, 96, 105 (as colunas
   relidas do dicionário a cada disparo), 110, 113.
   - **Arquivos:** cria `lake-copy.ts`, `lake-routes.ts`.
   - **Testes:** `lake-routes.test.ts`, "a lista da ligação", "marcar", "a tabela do lago fica fora do
     banco", "a data só grava" e "ler de novo desde a data".
   - **Mutações à mão:** disparar uma rodada ao gravar uma data mais antiga: o 110 fica vermelho.
3. **O relógio, o disparo e a varredura.** Critérios: 39, 40, 43, 45, 46, 87, 92, 93, 95, 110.
   - **Arquivos:** cria `builder/copy-clock/` (o relógio da ligação, `cronOf`) e `lake-run.ts`
     (`iniciarRodada` e a fila de partidas).
   - **O que entra:** a varredura das rodadas abertas da ligação; o `INSERT` recusado pelo índice; o
     dicionário para as colunas; a especificação com o selo aberto; o `PutParameter`, refeito na cota;
     o `RunTask` com o papel da empresa e o token; `task_arn` gravado. Regras: D25; S8; C50.
   - **Mutações à mão:** tirar a varredura: o 43 fica vermelho; voltar ao cron fixo `*/15`: o 92 fica
     vermelho; gravar os parâmetros sem a fila: o 95 fica vermelho.
4. **A poda do rastro do Mastra.** Critério: 94. A política `triggers` e as execuções do workflow da
   cópia pelo nome.
   - **Mutações à mão:** ligar a política `workflowSnapshot`: a execução da automação some e o 94 fica
     vermelho.
5. **O fim.** Critérios: 41, 42, 44, 50, 51. Cria `lake-queue.ts`. A mensagem só sai da fila depois
   do fim gravado.
   - **Mutações à mão:** tirar o `ended_at IS NULL`: a parada que chega depois reescreve o resultado e
     o 41 fica vermelho.
6. **A lista de Dados.** Critério: 49. Cria `lake-list.ts`: a lista e as rodadas de uma tabela, pelas
   ligações que quem pede lê.
7. **Desmarcar, desligar e apagar o lago.** Critérios: 47, 48.
8. **Os testes na AWS.** Critérios: 46, 47, 48 (L.8, L.9).

- **A entrada em `docs/reference/boundaries.md`** das linhas 21 e 22, remendo, com a prova de cada
  uma, no commit da unidade.

### Como se prova

Pelas rotas de listar, marcar, rodar agora e desmarcar, e pela fila do servidor de respostas
gravadas, com um PostgreSQL local; a varredura por um disparo com uma rodada aberta antiga. Hoje nada
disso existe.

### Parar se

- O tempo que a AWS guarda o `clientToken`, lido no tipo instalado, é menor que a espera da
  repetição.
- O `@mastra/pg` instalado não tem a política `triggers` que `REL` seção 1 leu, ou não apaga uma
  execução de workflow pelo id.
- O selo aberto de uma credencial passa dos 4 KB com a especificação.
- O evento de parada do ECS não traz o `startedBy`.
- O papel do Hub não lê o estado da pilha para o T.19.
- A lista de Dados precisa de um campo que a página de hoje mostrava e o `LakeTableSummary` não tem:
  o builder diz ao firstmate antes de acrescentar.

## U20 O link de 30 minutos

**Base e modelo.** A U8. Sonnet: uma porta pública na forma de duas que existem.

### As linhas da tabela

- **Linha 51.** A spec 02, `C5` (`C/docs/steps/trilhas/dados-spec/02-conector/design.md:181-215`) e
  o requisito 5 (`requirements.md:96-113`), com as regras de `design.md:216-229`: o contrato, o prazo
  de 30 minutos do `connect_link` da Nango, as recusas, a trava do link, a contagem de tentativas e a
  rota sem sessão pela função `connectors.link_of` (U7). A forma a seguir é a da resposta a um convite
  (`C/apps/server/src/hub/identity/invitation-response.ts`), uma página pública guardada por um
  segredo de um uso, e a do login em curso, gasto com `DELETE … RETURNING`
  (`C/apps/server/src/hub/connectors/sign-ins.ts:145-193`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/connectors/` | Cria `connection-links.ts` e o teste; muda o registro das rotas | a janela e a página do link (U9) |
| `packages/hub-api/src/connection-links.ts`, `index.ts`, `failures.ts` | Cria as três rotas e `LINK_NOT_FOR_SIGN_IN` | U9 |
| `apps/server/src/hub/identity/` (`auth.ts`, `routes.ts`) | Muda: o caminho de contagem `CONNECTION_LINK_PATH` e a porta `countConnectionLinkAttempt` | `connection-links.ts` |

### Os contratos que a unidade cria

Os da spec 02 (`C5`, `design.md:181-229`) e do requisito 5, sem mudança: `createConnectionLink`,
`readConnectionLink` e `answerConnectionLink`, com `CONNECTION_LINK_MINUTES = 30` em
`packages/hub-api/src/connection-links.ts` (C26); o Membro recebe 404; as rotas sem sessão contam
tentativas (429 `SIGN_IN_ATTEMPTS_EXCEEDED`); a ligação nasce pelo código de `link`
(`C/apps/server/src/hub/connectors/connections.ts:102-154`), com a chave de tentativa igual ao id do
link e `linked_by` de quem pediu. A tabela, a função `link_of` e o papel `hub_links` nascem na U7; o
registro de decisão da porta é de antes da construção (item 6).

- **Cada id** com a sua marca: o segredo nunca é id; a linha se acha pelo resumo SHA-256 dele (C23).
- **O esquema de cada entrada externa** (C27): os campos do envio, pelo esquema dos campos do login
  do kit para aquele conector.
- **Gastar o link**: como `design.md:217-220` diz: a trava pelo id do link, a ligação criada e testada
  uma vez, `CONNECTION_LINK_UNDONE` se o teste lançar, o link gasto por `DELETE … RETURNING` quando a
  ligação nasce, e valendo até o prazo se o sistema recusar as chaves.
- **O registro**: `CONNECTION_LINK_CREATED`, `CONNECTION_LINK_ANSWERED` e `CONNECTION_LINK_REFUSED`,
  sem o segredo nem os campos (S41).
- **O arquivo modelo**: `sign-ins.ts`, o login em curso (C21: o estado do link; C23: o resumo).

### As skills e a leitura

As linhas de `apps/server` do `stack.md`. A security S10 e S41.

### A ordem do trabalho

1. **Criar e abrir.** Critérios: 97, 98.
   - **Arquivos:** cria `hub/connectors/connection-links.ts`.
   - **Testes:** `connection-links.test.ts`, "criar o link", "abrir o link", "o segredo fica fora".
   - **Mutações à mão:** gravar o segredo em vez do resumo: o 98 fica vermelho.
2. **Enviar.** Critério: 99. O teste antes de gastar; dois envios ao mesmo tempo.

### Como se prova

Pelas três rotas contra o servidor de teste, com o dublê do Sankhya; o prazo pelo relógio de teste.
Hoje não há link.

### Parar se

- A rota sem sessão do link não cabe no molde da resposta a um convite: o builder diz ao firstmate.

## U9 A janela e a tela

**Base e modelo.** A U8 e a U20. Sonnet: a janela de hoje ganha os passos da spec 02, a página da
ligação ganha uma seção, e Dados é escrita de novo sobre o contrato da U8.

### As linhas da tabela

- **Linhas 19 e 51.** A janela: a de hoje (`C/apps/web/src/hub/connectors/link-dialog.tsx:202-221`,
  `:272`), que cola as chaves e leva à página da ligação; os passos da spec 02 (`design.md:157-179`,
  `requirements.md:72-94`); o assistente da Nekt tela a tela (`MAPA` 1.1, `NK:12127-12139`,
  `NK:12217-12220`) e o "Save and run pipeline" do Databricks (`MAPA` 1.2). A primeira página é a de
  hoje, `C/apps/web/src/hub/connectors/integrations.tsx:94`, sem busca nesta etapa (o fundador, no protótipo: "9. Fora").
- **Linha 71.** O campo **Desde** no passo **Acesso**, depois do X-Token, onde a Nekt o pede
  (`NK:177721-177729`, o passo das chaves), e na seção de mudar; a data fica na cópia (T.42).
- **Linha 73.** **Ler de novo desde a data** e o aviso que diz o efeito de gravar: o Refresh que a
  pessoa pede na tela do Airbyte (`AB@82db089b operator-guides/refreshes.md:26`, `:36-48`) e o Full
  Sync da Nekt (`NKH:150766`).
- **Linha 19.** A seção de mudar: `C/apps/web/src/hub/connectors/connection-page.tsx:207-222` (`Facts`,
  a seção que a nova segue) e `:275`; o seletor de intervalo do histórico
  (`apps/web/src/hub/copies/interval.tsx`, que a U1 tirou), só como leitura; o "Details" e o "Edit
  trigger" da Nekt (`MAPA` 1.3).
- **Linhas 31, 39, 42.** A lista e a página de uma tabela: as capturas `capturas/hoje/` da página
  Dados e a do Airbyte (`cloud-status-page.png`); `AP .../locales/en.json:1088-1094` para as frases
  da rodada; o rótulo primeiro, o nome no lago e a origem embaixo (`EST/conector-estilo-novo-estudo:105`).
  A página de hoje (`C/apps/web/src/hub/copies/copy-detail.tsx`, `copy-facts.tsx`, que a U14 tirou)
  é só leitura.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/connectors/` | Cria `link-window.tsx`, `lake-tables.tsx`, `link-page.tsx` e os testes; muda `link-dialog.tsx` (sai o que leva à página da ligação com `?testar=true`; o acesso passa à janela), `integrations.tsx` (**Ligar** abre a janela), `connection-page.tsx`, `text.ts`, `queries.ts` | Integrações e a página da ligação |
| `apps/web/src/hub/copies/` | Cria `lake-list.tsx`, `lake-detail.tsx`, `lake-queries.ts` e os testes; muda `data-page.tsx`, `data-tree.tsx` (a camada do lago), `text.ts`, `test-hub.tsx` | a página Dados |
| `apps/web/src/ui/`, `DESIGN.md` | Cria `step-bar.tsx` (`StepBar`) e o teste; a regra da barra no `DESIGN.md` (V62) | a janela |
| `apps/web/src/routes/` | Cria `_app/companies/$companyId/data.lake.$tableId.tsx` (`/data/lake/<id>`) e `_public/connection-links/$secret.tsx`, ao lado de `_public/invitations/`, a página pública do convite | o roteador |

### Os contratos que a unidade cria

- Nenhum contrato novo: a tela lê `LakeTablesOfConnection`, `LakeTableSummary` e `LakeRun` da U8,
  grava `SetLakeCopy`, pede a releitura por `RunLakeCopy` e chama as rotas da U20.
- **A janela é uma só**, com o passo no estado dela, como uma união pelo passo (C21): `ACCESS`,
  `TESTING`, `REFUSED`, `CHOOSE`, `WHEN`, `LINKED`. Ela abre em `CHOOSE` pela seção de uma ligação sem
  cópia (T.33), e só nesse caminho o `CHOOSE` mostra o **Desde**, que nos outros o `ACCESS` já mostrou.
- **O nome no lago**: a tela mostra o sugerido da U8 e deixa trocar a parte depois do prefixo; o
  prefixo vale para todas as tabelas novas da janela; quem confere é o servidor (os códigos de nome,
  U8).
- Os textos, todos em `text.ts` de cada pasta (C26): "O que copiar", "Quando copiar", "Só manual",
  "Ligar e copiar agora", "A primeira carga começou.", "Ver em Dados", "Escolher o que copiar",
  "Tabelas no lago", "Salvar", "Rodar agora", "Completa · inteira", "Completa · só o que mudou", "As
  linhas ficam no lago da empresa.", "Próxima rodada", as frases dos modos e as da matriz de estados,
  as dos códigos `COPY_SOURCE_*` incluídas.
- Os textos da data, também em `text.ts`: "Desde", "Todo o histórico", "desde <data>", "desde o começo",
  "A data não pode ser depois de hoje.", os dois avisos do 111, "Ler de novo desde a data", o texto do
  diálogo do 114, as duas frases por modo e "Ler de novo". O campo de data e o diálogo são os de hoje de `ui/`; a única peça nova é a barra de passos.
- **O arquivo modelo**: `apps/web/src/hub/connectors/link-dialog.tsx`, a janela de hoje, na forma;
  `connection-page.tsx`, a seção `Facts` (`:207-222`), para a seção.

### As skills e a leitura

As linhas de `react`, `@tanstack/react-router` e das peças de `apps/web/src/ui/` do `stack.md`. O guia
de web e o de desenho; o `DESIGN.md`.

### A ordem do trabalho

1. **A janela até o teste.** Critério: 54. A barra de passos (`StepBar`, em `ui/`), o Acesso com o
   **Desde**, **Enviar link** com a U20, Testando e lendo, a recusa.
2. **O que copiar, Quando copiar e Ligado.** Critério: 100. As tabelas por assunto, o nome e o
   prefixo, o modo, o intervalo, a revisão, um `PUT` só, o **Ligado**; a exclusiva pula.
   - **Mutações à mão:** marcar a primeira tabela por padrão: o 100 fica vermelho.
3. **A seção de mudar, na aba Tabelas.** Critérios: 101, 111, 114. O campo **Desde**, o aviso do efeito e **Ler de novo
   desde a data** com o diálogo.
   - **Mutações à mão:** chamar a rota sem `whole`: o 114 fica vermelho.
4. **A página do link.** Critério: 102.
5. **Dados.** Critério: 55. A lista agrupada pela ligação, a página da tabela com as quatro abas, o
   tipo da rodada pelo `whole` e a frase do lugar.
   - **Testes:** com o Hub falso de `test-hub.tsx`.
   - **Mutações à mão:** mostrar o nome no lago no lugar do rótulo: o 55 fica vermelho.

### Como se prova

Pela tela com o Hub falso; na QA, pelo Hub local com o servidor de respostas gravadas, a 1366 e
390 px, claro e escuro, cada passo da janela e cada estado da matriz.

### Parar se

- O texto de um estado precisa de uma decisão que a matriz não traz.
- A janela precisa de uma peça de `ui/` que a janela de hoje não usa, além da barra de passos.
- Um passo da janela precisaria divergir da ordem do roteiro (6 a 10): volta ao firstmate, que leva
  ao fundador.

## G4 O ponto de conferência

Depois da U9: o Hub local com o servidor de respostas gravadas; a janela inteira com o dublê do Sankhya,
do **Ligar** ao **Ligado**; trocar um nome e ver o repetido recusado; o link criado, aberto e vencido; a
seção de mudar, a data e **Ler de novo desde a data**, **Rodar agora** e **Só manual**; o fim pela fila, a
varredura de uma rodada antiga, a lista e a página da tabela em Dados, desmarcar, apagar o lago. A versão
ainda não se publica: espera o G5.

## U10 Só o que mudou

**Base e modelo.** O G4 mesclado. Opus: o estado, a atual e a limpeza mudam juntos, e entre duas
instruções a tabela fica num estado do meio.

### As linhas da tabela

- **Linha 30.** `meltano@4.4.1 meltano/core/plugin/singer/target.py:100-120` e
  `core/state_store/filesystem.py:45`, `:191-228`, com o depósito `S3` nativo (T.1); a opção
  `state_backend.uri` (`meltano/core/bundle/settings.yml:18-19`, `:54-68`). Não depender de
  `lock_retry_seconds` (`state_store/base.py:160`): quem garante uma rodada por ligação é o Hub.
- **Linha 28.** A forma medida na AWS, `conexus-lab-trilho/fases2a4/atualizar.py:66-127`: três `MERGE`
  do Athena, um caso por instrução, e um `DELETE` para a passada inteira; `DLT
  dlt/destinations/sql_jobs.py:1120-1139`; um caso por instrução passou com 450 colunas
  (`EST/achados-auditoria:321`).
- **Linha 29.** A limpeza da bruta (A): um `DELETE` do Athena das linhas que já entraram na atual.
- **Linha 8.** O modo da declaração do kit, já lido pelo adaptador (U4).
- **Linha 66.** A janela por mês na atual: um `DELETE` do Athena dos meses relidos e o `INSERT` deles,
  como a passada inteira faz com a tabela toda.
- **Linha 73.** A releitura desde a data troca a tabela como o Full Sync da Nekt troca a dela
  (`NKH:22494`, `:117134`): é a passada inteira da linha 28, lida desde a data.
- **Linha 29.** A limpeza lê o `history` da declaração e roda em todas as tabelas, a dos dados da NF-e incluída: nenhuma guarda
  histórico nesta etapa (T.34).
- **Linha 69.** A coluna nova na atual: o `MERGE` lê as colunas da bruta, e a atual ganha a coluna pelo
  mesmo `update_schema().union_by_name` antes dele.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/extraction/` | Cria `src/conexus_extraction/update.py`; muda `entry.py`, `meltano.yml`, `tests/` | a imagem |
| `apps/extraction/tap/` | Muda: a retomada pelo `--state` e o modo incremental | o `meltano.yml` |
| `infra/aws/lib/` | Muda `copy.ts` (o depósito do estado) e `platform.ts` (o Hub apaga o prefixo de uma tabela); a receita do lago não muda: o prefixo e o grupo de consultas nasceram na U6 | o Hub, pela Release |
| `apps/server/src/hub/copies/` | Muda `lake-run.ts` (`whole` pelo modo), `lake-copy.ts` (desmarcar apaga o estado) | — |
| `apps/server/src/platform/aws.ts`, `recordings/aws/` | Muda: apagar o prefixo do estado; as gravações do Athena | — |

### Os contratos que a unidade cria

- **O estado** de uma ligação mora em `s3://<depósito do estado>/<empresa>/<ligação>/state.json`, na
  forma do Meltano, com o ponto de cada fluxo; só o papel da empresa lê e escreve o prefixo dela.
- **`CopyTaskResult.tables[].rows`** passa a ser a contagem da atual depois da atualização.
- **`CopyTaskSpec.tables[].whole`**: o Hub o pede verdadeiro só na primeira rodada de uma tabela
  recém-marcada e em **Ler de novo desde a data**, nas tabelas que a data limita (T.45); a tarefa lê
  inteira também a tabela sem ponto de parada no estado (o Hub não lê o estado) e a sem coluna de
  alteração, e diz no resultado, por tabela, se a passada foi inteira (T.17).
- **A releitura desde a data** é a passada inteira de sempre, lida desde a data: numa tabela só do que
  mudou, o `DELETE` troca a atual, e o que é anterior à data, ou foi apagado na fonte, sai; numa de
  janela, os meses desde o mês da data se trocam, e os anteriores ficam.
- `update.py`: `update(table, mode, whole, history) -> UpdateCounts` com as três instruções, o
  `DELETE` da passada inteira, a troca dos meses da janela e a limpeza, que não roda numa tabela de
  histórico; uma falha termina a rodada `COPY_LAKE_WRITE_FAILED`.
- **O arquivo modelo**: `conexus_extraction/target.py` (U5).

### As skills e a leitura

As linhas do Meltano e do PyIceberg do `stack.md`; a de `@aws-sdk/client-athena`. O guia de dados,
D25.

### A ordem do trabalho

1. **O estado.** Critérios: 56, 57. Testes: `test_state.py` com um depósito local.
2. **A atual e a limpeza.** Critérios: 58, 59.
   - **Mutações à mão:** limpar antes do `MERGE`: a atual perde as linhas da rodada e o 58 fica
     vermelho.
3. **O modo por tabela.** Critérios: 60, 103, 112. O Hub pede; a tarefa decide pelo estado e pelo modo e
   diz.
   - **Mutações à mão:** trocar só as linhas lidas da janela sem o `DELETE` dos meses: a linha que
     saiu da fonte fica e o 103 fica vermelho.
4. **O XML sem histórico.** Critério: 104. A limpeza roda na tabela dos dados da NF-e e pula uma de `history: true`.
   **A coluna nova.** Critério: 105. A atual ganha a coluna antes do `MERGE`.
5. **Desmarcar.** Critério: 61.
6. **Os testes na AWS.** Critérios: 57, 58, 59 (L.4, L.7), na `sankhya_notas` do dublê de 450 colunas.

- **A entrada em `docs/reference/boundaries.md`** das linhas 28 e 29, remendo, com a prova de cada
  uma, no commit da unidade; a da linha 66 ganha a troca dos meses na atual.

### Como se prova

Pelo `meltano run` com o depósito local e o dublê do Sankhya que muda uma nota (U3); na AWS, pela
conta de laboratório. Hoje a segunda rodada relê tudo.

### Parar se

- O `MERGE` do Athena sobre o `S3 Tables` recusa a forma medida, ou falha nas 450 colunas com um caso
  por instrução.
- O Meltano grava o estado antes de o gravador confirmar um lote.

## G5 O ponto de conferência

Depois da U10: o `meltano run` local com duas rodadas, nos três modos; o L.4 e o L.7 na conta de
laboratório; a QA da parte 1 inteira, com o G4; a versão da parte 1 é publicada, e o firstmate faz na
nuvem o roteiro 6 a 14 antes de chamar o fundador. A etapa fecha com o uso dele (delivery L19).
