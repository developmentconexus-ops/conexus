# A primeira cópia chega ao lago

Trilha Dados, a etapa 2 do lago, na ordem de [trilhas/dados.md](trilhas/dados.md). A pergunta:
"Uma tabela de um sistema ligado chega inteira, a mudança de hoje aparece na rodada seguinte, e eu
vejo isso na página Dados?" Entre a parte 0 e a parte 1 deste cartão corre a etapa **O conector no
padrão novo**, que o roteiro nomeia como etapa própria (decisão C do conector, T.21).

Os estudos ficam fora do repositório (delivery L21). São cinco, todos de 2026-11-23:

- o estudo `conexus-lago2-estudo`;
- o reestudo `conexus-lago2-reestudo`, que o fundador pediu depois de recusar a decisão B da primeira
  versão e aprovou no mesmo dia;
- o estudo do conector no estilo novo, `conexus-conector-estilo-novo-estudo` (os nomes NT1 a NT4 e o
  legado);
- o estudo das duas ligações do mesmo sistema, `conexus-n5-duas-ligacoes` (a NT5);
- o estudo do ao vivo, `conexus-ao-vivo-estudo` (as decisões A, B e C do conector e os conectores do
  `D3`).

O fundador decidiu nas palavras da página abaixo. Este cartão cita dos estudos só o que a construção
precisa. O código de hoje entra só como inventário do que sai. A página ainda não está aprovada.

Cada linha do `main` citada foi lida em `538b0562`. Nas pastas da cópia e dos conectores ela é igual
à do `main` em `f9f58673`, a base deste cartão: `git diff --stat 538b0562 f9f58673 -- packages apps`
não toca essas pastas. `EST/<nome>:N` é a linha `N` do relatório `data/conexus-<nome>/report.md` do
firstmate; `INV §n` é a seção `n` do inventário do legado, em
`data/conexus-conector-estilo-novo-estudo/notas/inventario-legado.md`.

As versões que a construção instala são as que o estudo leu e rodou:

- `meltano` 4.4.1, `singer-sdk` 0.54.9, `pyiceberg` 0.12.0, `pyarrow` 26.0.1 e Python 3.13;
- `@aws-sdk/client-ecs`, `client-sqs`, `client-ssm` e `client-athena` 3.1175.0, a versão que o
  `main` fixa para o `client-cloudformation` e o `client-s3tables` (o `client-s3` de hoje fica em
  3.1146.0);
- `@mastra/core` 1.83.0, a do `main`.

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
4. **O L.2 à mão**, antes de qualquer unidade da parte 1. O firstmate, com a palavra do fundador, sobe na conta de laboratório
   uma tarefa avulsa na forma da prova (`conexus-lab-trilho/fases2a4/plataforma.py:80-90`), que faz o
   login e lê uma página do Sankhya do fundador. Se o gateway recusar o endereço da AWS, nenhuma
   unidade da parte 1 começa e a etapa volta ao fundador (0071). O critério 33 repete o teste com a
   imagem e a plataforma da U6.

Se a mudança de método mesclar com outra forma, a unidade segue a forma mesclada e o firstmate relê
esta seção.

## A página do fundador

**No fim desta etapa** você abre a ligação do Sankhya em **Integrações**, marca **Notas e pedidos**
numa seção nova, **Tabelas no lago**, e a tabela chega inteira ao lago da empresa. Ela se chama
`sankhya_notas`, vem da `TGFCAB` e traz todas as colunas da sua instalação.

Na página **Dados** você vê que tipo de rodada foi. A nota que você alterar hoje aparece na rodada
seguinte. Quando a cópia da ligação para, chega um e-mail e um lembrete por dia até ela voltar.

Antes disso, tudo o que hoje copia para o banco da empresa e lê dele sai. As pastas do Sankhya e do
Mercado Livre são refeitas no padrão novo, e o Assistente continua lendo os dois ao vivo durante a
troca. O lago é a única fonte.

**O que mudou desde a versão que você viu** (PR https://github.com/developmentconexus-ops/conexus/pull/1260,
commit `65c65aef`). Você disse em 2026-11-23: "o que a gente tem atualmente... do Legacy, de Sunk,
Mercado Livre, tem que ser desfeito para entrar o novo jeito", "O ao vivo vai ser refeito também" e
"Eu quero refazer, eu não quero utilizar nada que está feito como atual". Depois respondeu aos dois
estudos novos. O cartão mudou assim:

- **O nome no lago é de negócio** (NT1, NT2, NT4). A tabela se chama `sankhya_notas`, com o rótulo
  **Notas e pedidos** e a `TGFCAB` ao lado, como origem. As colunas ficam com os nomes do Sankhya em
  minúsculas (`nunota`, `dtneg`), cada uma com a descrição do dicionário da sua instalação. Uma
  tabela que o kit não declara fica com o código (`sankhya_ad_metavenda`); ela chega na etapa 6.
- **Uma tabela por ligação** (NT5). Duas lojas do Mercado Livre dão duas tabelas. A segunda leva o
  nome da ligação: `mercado_livre_loja_sul_pedidos`. Nesta etapa só há uma ligação do Sankhya, e a
  segunda ligação do mesmo sistema continua recusada até a etapa 5, que grava o nome dela.
- **A parte 0 cresceu** (NT3). Além do que cria cópia, sai também o que lê o banco da empresa:
  - o catálogo das cópias, a **Amostra**, **Quem lê** e a liberação a Projetos;
  - os logins por papel, o esquema `sync` e os logins `conexus_sync` e `conexus_read`;
  - a ferramenta `copy_runs` do Assistente;
  - as tabelas das cópias no banco do Hub.

  Antes, esse pedaço saía nas etapas 3 e 4.
- **Uma etapa nova entre a parte 0 e a parte 1: O conector no padrão novo** (A, B e C do conector).
  As pastas do Sankhya e do Mercado Livre são refeitas do zero, na forma do kit, com os mesmos nomes
  de leitura e de escrita, um pull request por conector. O kit ganha:
  - a classe da credencial;
  - a sessão que renova;
  - o número exato;
  - a skill com uma parte gerada da definição.

  As peças do Hub que já seguem o que você decidiu ficam (o executor, o login por autorização, as
  leituras como ferramentas e a escrita com o cartão). O Caderno passa a pedir o sim de quem
  gerencia a ligação.
- **A parte 1 ficou menor.** A sessão, a classe e o número exato foram para a etapa do conector. A
  parte 1 leva a declaração das tabelas, com os nomes novos.
- **A página Dados é refeita** para as tabelas do lago, na parte 1. A lista de hoje sai com as
  tabelas das cópias na parte 0.

**Como a etapa chega até você: em cinco partes.** A parte 0, a etapa do conector e as partes 1 a 3.
Cada parte tem os seus pull requests e é usada por você quando entra no ar. A etapa fecha na parte 3.

- A parte 0 tem uns 8.000 linhas mudadas, quase todas tiradas, em três pull requests.
- A etapa do conector tem umas 3.300, um pull request por conector e um para o Caderno.
- As partes 1 a 3 têm umas 5.200.

O cartão é um só porque as decisões valem para as cinco e você aprova uma vez (T.9 e T.21).

**O roteiro de uso.** No Hub da nuvem, na sua empresa, que já tem lago (etapa 1) e as ligações do
Sankhya e do Mercado Livre.

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

*Parte 1, a carga chega.*

6. Em **Integrações**, abra a ligação do Sankhya. Aparece a seção **Tabelas no lago** com a tabela
   que o Conexus recomenda nesta etapa: **Notas e pedidos**, com `TGFCAB` ao lado. Ela traz a
   descrição e o número de colunas do dicionário da sua instalação. Nada vem marcado.
7. Marque **Notas e pedidos** e clique **Salvar**. Nesta parte, a cópia roda uma vez por dia; os
   intervalos menores chegam na parte 2.
8. Em **Dados**, **Notas e pedidos** aparece com `sankhya_notas` embaixo e "Rodando…". Quando a
   primeira carga termina, ela diz **Em dia**, com o número de linhas e a hora. Quanto tempo a
   primeira carga leva não foi medido.
9. Abra a tabela e vá em **Rodadas**: a primeira diz "Completa · inteira" e quantas linhas leu. Em
   **Colunas** estão todas as da sua `TGFCAB`, com a descrição de cada uma, as criadas pela sua
   empresa (`ad_…`) incluídas.
10. O firstmate mostra na sua frente, no console da AWS, a tabela `sankhya_notas` dentro do lago da
    sua empresa, com o mesmo número de linhas na última passada. O Hub ainda não lê o lago para
    ninguém; isso é a etapa 3.

Até a parte 2, cada rodada relê a tabela inteira e a guarda ao lado da anterior na camada bruta. Por
isso a cópia roda no máximo uma vez por dia, para não pesar no seu Sankhya. A parte 2 passa a ler só
o que mudou, monta a camada atual e limpa as passadas antigas (T.29).

*Parte 2, a mudança aparece.*

11. Lance ou altere uma nota no Sankhya. Clique **Rodar agora** na ligação, ou espere o intervalo.
12. A rodada seguinte diz "Completa · só o que mudou" e mostra poucas linhas lidas.
13. O firstmate mostra no console a nota alterada na tabela do lago, com o valor de hoje.

*Parte 3, o aviso.*

14. O firstmate quebra de propósito a senha da ligação de teste. Na rodada seguinte a cópia da
    ligação passa a **Parada**, e chega um e-mail a você e à lista de e-mails da empresa, com as
    tabelas que ela levava. No dia seguinte chega um lembrete. Ele conserta a senha, e na rodada
    seguinte ela volta a **Em dia**, sem e-mail.

**O que você faz, e quando.**

- **No começo:** aprova esta página.
- **Antes de a parte 0 entrar no ar:** dá a palavra para o firstmate fazer o reajuste. Ele roda o
  inventário só de leitura em todas as empresas e apaga, pelo botão Apagar, cada cópia que achar.
- **Antes do último pull request da parte 0:** dá a palavra para a mudança de permissões que tira as
  tabelas das cópias do banco do Hub (data D11). Com a versão da parte 0 no ar, dá também a palavra
  para o firstmate tirar o esquema `sync` e os logins de cada empresa.
- **Antes da parte 1:** dá a palavra para a mudança de método, para a segunda preparação da conta
  (E) e para o L.2, o primeiro teste de uma tarefa contra o seu Sankhya de dentro da AWS. Se o
  Sankhya recusar o endereço da AWS, nada da parte 1 é construído e a etapa volta a você.
- **Na parte 1 e na parte 3:** dá a palavra para as permissões novas no banco do Hub (data D11): o
  login da empresa ler a linha do próprio lago (H), e as tabelas novas da cópia e do aviso.
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
- **A janela Ligar em quatro passos, a descrição do sistema e o link de 30 minutos** (spec 02, `C1`, `C4`
  e `C5`). O passo "o que copiar" dessa janela é a seção **Tabelas no lago**, que só nasce na parte 1;
  por isso a janela não cabe na etapa do conector. Pela recomendação da decisão L, ela vem numa
  etapa própria da trilha, logo depois desta (T.23).
- **Refazer o executor, o login por autorização, as leituras como ferramentas e a escrita com o
  cartão.** Eles já são o que você decidiu (0056, 0057, 0062) e ficam (A a).
- **O Caderno sair.** As anotações viram propostas da Ontologia, e o Caderno sai, na etapa do Negócio
  (0064; B a).
- **A Fábrica de conectores.** Ela é provada no TOTVS, depois da etapa 7 do lago. As pastas desta
  etapa são escritas à mão, da documentação e das gravações.
- **O Builder propor uma tabela.** Volta com a escolha de tabelas, na etapa 6, se alguém pedir.
- **Mais tabelas do Sankhya, a busca no dicionário e a escolha de campos** (etapa 6). Nesta etapa a
  lista recomendada tem só **Notas e pedidos**.
- **O que sumiu da fonte some do lago** (etapa 7). Nesta etapa a rodada é inteira só na primeira vez,
  quando o estado se perdeu e numa tabela sem coluna de alteração (o critério 60); a
  passada inteira de domingo do motor de hoje não vem.
- **Pausar a cópia de uma ligação.** Desmarcar todas as tabelas para a cópia. Pausar entra se alguém
  pedir.
- **O histórico ligado por tabela** (decisão A). Nenhuma tabela pediu ainda.
- **A segunda classe de credencial na cópia** (etapa 5). A seção **Tabelas no lago** aparece só nas
  ligações cuja credencial a tarefa pode renovar sozinha: nesta etapa, o Sankhya. O Mercado Livre
  declara a classe exclusiva já na etapa do conector.
- **Atualizar a receita de um lago que já tem dado.** Os lagos de hoje estão vazios: o firstmate os
  apaga e cria de novo pelo botão da Central depois da segunda preparação.
- **O custo por rodada.** A conta de laboratório não separa a fatura por empresa (registro 0072).
- **O botão Seguir uma cópia.** Você decidiu em 2026-11-21 que ele só entra se alguém pedir.
- **As issues `next-card` das pastas da etapa.**
  - Entram:
    - a #940 (a linha sem data de alteração), na primeira rodada inteira;
    - a #942 (o relógio visto rodar sozinho), no passo 11 do roteiro;
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

**As suas decisões nesta etapa.** Uma nova, a L, no fim da tabela. As outras estão respondidas, em
2026-11-23:

- ao reestudo: "Lago 2 aprovo os recomendados";
- aos nomes: "okay", "okay", "sim" e "sim", às letras que aqui são NT1 a NT4 (o estudo as chama pela
  letra N e o número, um nome que a conferência de documentos reserva);
- ao estudo do ao vivo, na página https://claude.ai/artifact/Lpb1H6fUwea7U3FTnmaQpQ: "Aprovado suas
  recomendacoes conector".

A lista dos onze sistemas do `D3` ("Conector eu quero: - Sankhya - Mercado Livre - Hubspot - TOTVS -
Gmail com Agenda - Outlook email - Outlook Calendar - google drive - Sharepoint - NF-e - Sicoob") é
da trilha e está na página dela. O que cada decisão faz no cartão:

| # | A decisão | A sua resposta | O que faz no cartão |
| --- | --- | --- | --- |
| A | Por quanto tempo a bruta guarda o histórico | (a) só até entrar na atual | A parte 2 limpa da bruta o que já entrou na atual; a AWS ainda guarda as fotos da tabela por 5 dias. Veredito: remendo (a limpeza é nossa); como nativo, um `DELETE` do Athena depois de cada atualização |
| B | Como a cópia no lago é ligada e aparece | Cai; vale a K2 de 2026-11-19 | Escolher na página da ligação, nada marcado. Veredito: embrulhado (a página da ligação de hoje, com uma seção) |
| C | Quando uma cópia conta como parada | (a) na primeira rodada da ligação que termina com erro | Um e-mail por parada, com as tabelas da rodada; um lembrete por dia. Veredito: remendo (as referências avisam por rodada) |
| D | A D4, as senhas por empresa | (a) sai | Nenhuma unidade da D4; os logins saem na parte 0, com o `sync` (NT3). Veredito: nativo (`DROP ROLE`) |
| E | A segunda preparação da conta e os poderes novos | (a) pelo mesmo passo a passo, com a mesma trava | O robô cria o papel que escreve de cada empresa; o teto sobe; a Release cria a plataforma da cópia; o Hub inicia e para a tarefa. Veredito: nativo (IAM, CloudFormation) |
| F | Qual tabela do Sankhya prova a etapa | (a) a `TGFCAB` inteira | Todas as colunas, as da empresa incluídas, `dtalter` e dinheiro. Veredito: nativo nas pontas (o `--discover` do Singer, o dicionário do Sankhya), embrulhado no kit (a lista recomendada) |
| G | Uma tarefa por tabela ou por sistema | (b) uma rodada por ligação | O relógio, a rodada e o intervalo são da ligação. Veredito: nativo (a seleção do `meltano run`; o gatilho por fonte das referências) |
| H | O login da empresa lê a linha do próprio lago | (a) só lê a própria linha, num pull request próprio | O G3 |
| I | Onde a empresa escreve a lista de e-mails do aviso | (a) Configurações, seção Avisos | A U13 |
| J | O app que lê uma cópia, entre a etapa 2 e a 4 | (a) fica sem a tabela até a etapa 4 | Os Projetos que liam uma cópia leem uma tabela que não existe; na etapa 4 o app declara a `sankhya_notas`, e a regra de venda passa para o app ou para a camada Negócio |
| NT1 | O nome técnico de uma tabela do Sankhya no lago | (a) o nome de negócio declarado no kit para as recomendadas; o código para as que o kit não declara | `sankhya_notas`; a `TGFCAB` como origem, ao lado. Veredito: embrulhado (a lista no kit, sobre o `stream` e o `table_name` do Singer) |
| NT2 | A língua do nome técnico | (a) português | `sankhya_notas`, `mercado_livre_pedidos` |
| NT3 | Quando sai o que lê o `sync` | (a) na parte 0 | O G0b e o G0c; os Projetos e o Assistente ficam só com o ao vivo até as etapas 3 e 4 |
| NT4 | Os nomes da lista recomendada | (a) `sankhya_notas`, "Notas e pedidos" | A U3; as próximas da mesma regra (`sankhya_notas_itens`, `sankhya_parceiros`) entram na etapa 6, cada nome quando a tabela entrar |
| NT5 | Duas ligações do mesmo sistema | (a) uma tabela por ligação | `<conector>_<ligação>_<tabela>` para a segunda ligação, gravado quando a tabela nasce; nesta etapa a segunda continua recusada (T.16), e a etapa 5 grava o nome |
| A do conector | O alcance do "refeito" | (a) refazer do zero as pastas do Sankhya e do Mercado Livre e cada peça do Hub que diverge do decidido; as que já são o decidido ficam; a Fábrica é provada no TOTVS | A U16 a U19. Veredito: embrulhado (a forma do kit, conferida pela conformidade e pelos dublês) |
| B do conector | Quando o Caderno sai | (a) na etapa nova, gravar pede o sim de quem gerencia a ligação; o Caderno sai na etapa do Negócio | A U19. Veredito: nativo (o `requireApproval` do Mastra, como na escrita) |
| C do conector | Onde a troca entra no roteiro | (a) uma etapa própria entre a parte 0 e a parte 1, um pull request por conector, sem o Assistente perder as leituras ao vivo | O GC1, o GC2 e o GC3, entre o G0c e o G1 |
| L (nova) | Onde entra a janela Ligar em quatro passos, a descrição do sistema e o link de 30 minutos, que o estudo do ao vivo punha na etapa do conector | **Recomendo (a): uma etapa própria logo depois desta.** O passo "o que copiar" da janela é a seção **Tabelas no lago**, que só nasce na parte 1, então ela não cabe entre a parte 0 e a parte 1; nada do lago precisa dela; o próprio estudo a tirava da etapa se ela passasse do teto (`EST/ao-vivo-estudo:187`). (b) Na parte 1, numa unidade depois da U9: a parte 1 passa de 4.000 linhas, e o gatilho tira a parte 3 do cartão | Com a (a), nada neste cartão (T.23). Veredito: embrulhado (spec 02, `C4` e `C5`; o `connect_link` da Nango) |

## As unidades

Os números das unidades e dos critérios da versão anterior ficam; as unidades novas seguem da U14,
e os critérios novos, do 70.

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
| G1 O kit declara tabelas (um PR, parte 1) | U3 O kit declara as tabelas | A declaração por tabela, com o nome de negócio, o rótulo, a descrição, o grupo e a origem; o gancho do dicionário do Sankhya; **Notas e pedidos** recomendada; a página em linhas e bytes; a lista de tabelas na parte gerada da skill; os dublês que mudam um registro | o raio da U3 | testing (T5, T29) | a etapa do conector usada |
| G1 | U4 O adaptador | `apps/extraction/tap/`, o leitor Singer único, que lê só a declaração do kit e copia numa rodada as tabelas escolhidas | o raio da U4 | testing (T26) | U3; a mudança de método |
| G2 A tarefa e a plataforma (um PR, parte 1) | U5 A tarefa | `apps/extraction/`: o projeto `uv`, o `meltano.yml`, o gravador do lago, a entrada da tarefa, a imagem; o L.1, o L.3 e o L.5 | o raio da U5 | security (S31, S41) | G1 e G3 mesclados; a mudança de método |
| G2 | U6 A plataforma da cópia | Em `infra/aws/`: a fila, a regra, o cluster, a tarefa, o depósito de imagens e a rede; o papel que escreve; o teto; os poderes do Hub; a preparação; a Release monta a imagem; o L.2 e o L.6 | o raio da U6 | security (S36, S40) | U5; a segunda preparação (E) |
| G3 As tabelas da cópia do lago (um PR, data D11, parte 1) | U7 A migração e a permissão | `lake_copy`, `lake_table`, `lake_run`, `lake_table_run`; os ids e códigos do fio da cópia; a leitura da linha do lago pela empresa (H) | o raio da U7 | data (D6, D10, D11, D15) | a etapa do conector usada |
| G4 A cópia pelo Hub (um PR, parte 1) | U8 O disparo e o fim | Marcar na ligação; o relógio da ligação; o disparo; o fim pela fila; a varredura; desmarcar e apagar o lago com tabela; as rotas da lista e das rodadas de Dados; a #1265, a #1266 e a #1267 | o raio da U8 | data (D25, D27); security (S8, S41) | G2 e G3 mesclados |
| G4 | U9 A tela | A seção **Tabelas no lago** na página da ligação; a lista e a página de uma tabela do lago em Dados | o raio da U9 | web, design | U8 |
| G5 A mudança aparece (um PR, parte 2) | U10 Só o que mudou | O ponto de parada do Meltano no `S3`; o modo incremental; o atualizar; a limpeza da bruta (A); o L.4 e o L.7 | o raio da U10 | data (D25) | a parte 1 usada |
| G6 As tabelas do aviso (um PR, data D11, parte 3) | U11 As tabelas da parada | A parada na cópia da ligação e o aviso no sino | o raio da U11 | data (D6, D11, D15) | a parte 2 usada |
| G7 O aviso (um PR, parte 3) | U12 O aviso de cópia parada | O e-mail por parada, a linha no sino, o lembrete por dia, a marca **Parada** | o raio da U12 | web; security (S41) | G6 mesclado |
| G7 | U13 A lista de e-mails (I) | As rotas de listar, acrescentar e tirar um e-mail, e a seção **Avisos** de Configurações | o raio da U13 | web, design; security (S8) | G6 mesclado |

São treze grupos, um pull request cada ([delivery L9](../guides/delivery.md)), com um commit por
unidade. No G0a, a U2 entra antes da U1, que apaga o que a U2 deixa sem chamador. No GC1, a U16
entra antes da U17.

- **A linha principal.** Tirar antes de pôr: primeiro o G0a, o G0b e o G0c, nessa ordem.
  - O G0c espera o G0b publicado, porque um `DROP` só entra quando nenhum código no ar lê a tabela
    (data D6).
  - A etapa do conector começa depois de o fundador usar a parte 0. O GC1 vem primeiro. Depois dele,
    o GC2 e o GC3 correm em paralelo: o GC3 divide pastas com o GC1 (`hub/connectors/`,
    `builder/conversation/`), e não com o GC2.
  - A parte 1 começa depois de o fundador usar a etapa do conector. O G1 e o G3 correm em paralelo;
    o G2 parte dos dois mesclados, porque a imagem leva o adaptador e o contrato da tarefa usa os ids
    do G3; o G4 parte do G2 e do G3.
- **As cinco partes.** Cada uma começa depois de o fundador usar a anterior e publica uma versão,
  com o nome que o firstmate dá pela delivery L17. A etapa fecha com a parte 3. Publicar e usar no
  meio da etapa é leitura deste cartão, com a palavra do fundador ao aprová-lo.

  | Parte | Grupos | Passos do roteiro |
  | --- | --- | --- |
  | 0 | G0a, G0b, G0c | 1 |
  | A etapa do conector | GC1, GC2, GC3 | 2 a 5, depois de cada versão que troca um conector |
  | 1 | G1 a G4 | 6 a 10 |
  | 2 | G5 | 11 a 13 |
  | 3 | G6, G7 | 14 |
- **Um pull request por conector** (C do conector). A versão que publica o GC1 tem a pasta nova do
  Sankhya inteira, e a do GC2, a do Mercado Livre. Nenhuma versão publica só a remoção: entre duas
  versões, o Assistente lê os dois sistemas ao vivo sem interrupção.
- **Só o G0c, o G3 e o G6 criam ou tiram permissão no banco do Hub** (data D11).
- **O que toca a outra trilha.**
  - A U2, a U14 e a U19 mudam arquivos da trilha Agentes e Apps: `builder/connectors/`,
    `builder/company-tools/`, `builder/conversation/`, `builder/assistant/`, `builder/app-data/`,
    `builder/data-tools/`, `packages/hub-api/src/tools.ts`, `assistant.ts` e
    `apps/web/src/builder/conversation/`. Pela delivery L1, cada uma espera as unidades da outra
    trilha que estejam nesses arquivos.
  - Arquivos da Plataforma ou do contrato compartilhado:
    - `packages/hub-api` (U1, U2, U7, U8, U12, U13, U14);
    - `platform/copy-sql.ts`, `copy-reader.ts`, `company-postgres.ts`, `aws.ts`, `config-aws.ts` e
      `test-aws.ts` (U1, U8, U10, U14);
    - `hub/apps/` (U14), `hub/lake/` (U7, U8) e `hub/notifications/` (U11, U12, U13, U15).
  - Os pull requests do G0a, do G0b, do G0c, do GC3, do G3, do G4, do G6 e do G7 avisam a outra
    trilha (delivery L27).
- **A QA** ([testing T25](../guides/testing.md)) roda no Hub local com o servidor de respostas
  gravadas depois do G0b, do GC2, do GC3, do G4, do G5 e do G7.

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
| 1 | U3 | ~400 (o dicionário, sobre a sonda de 286) |
| 1 | U4 | ~400 (344) |
| 1 | U5 | ~560 (o gravador, 165) |
| 1 | U6 | ~480 |
| 1 | U7 | ~200 |
| 1 | U8 | ~1.050 (os fechadores, de 172 a 312; as rotas de Dados) |
| 1 | U9 | ~900: a seção ~380 e Dados refeita ~520 |
| 2 | U10 | ~420 (o atualizar, 144) |
| 3 | U11 | ~90 |
| 3 | U12 | ~480 |
| 3 | U13 | ~200 |

O total da etapa é de cerca de 16.500 linhas, das quais umas 8.000 são tiradas na parte 0. Por
parte: a parte 0, ~8.050; a etapa do conector, ~3.240; a parte 1, ~3.990; a parte 2, ~420; a parte
3, ~770. Nenhum pull request de construção passa de ~4.000 (delivery L2). A razão de não cortar em
cartões está no T.9.

Dois gatilhos dizem quando o plano muda:

- Se a parte 1 medir acima de 4.000 no fim do G4, a parte 3 sai deste cartão e vira um cartão
  próprio, com as mesmas unidades; o firstmate diz ao fundador antes de começar a parte 2.
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
| 83 | U19 | `connector_note_save` pede aprovação antes de gravar: a conversa mostra o cartão com o conceito, o mapeamento e a consulta da prova, e nada é gravado no Caderno antes do sim | `apps/server/src/builder/assistant/note-save.test.ts`, "pede o sim", pela conversa com as gravações do Mastra | must |
| 84 | U19 | O sim de um membro que gerencia ligações grava a anotação com o nome de quem aprovou; o de quem não gerencia é recusado com `NOT_GRANTED`, e nada é gravado; a recusa no cartão não grava nada; a página da ligação mostra quem aprovou, e uma anotação de antes desta etapa mostra "Gravada sem aprovação". O cartão mostra a quem não gerencia ligações a frase da matriz, sem os botões, e a ligação que saiu antes do sim dá a frase dela | `note-save.test.ts`, "quem aprova" e "a recusa"; `apps/web/src/hub/connectors/notes.test.tsx`, "quem aprovou"; `apps/web/src/builder/conversation/approval-card.test.tsx` (novo), "o Caderno" | must |

### Parte 1, a carga chega

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 9 | U3 | O Sankhya declara a tabela recomendada `notas`: o nome no lago `sankhya_notas`, o rótulo "Notas e pedidos", a descrição, o grupo `vendas`, a origem `TGFCAB`, a chave `NUNOTA`, a alteração por `DTALTER` e as colunas descobertas. O gancho `descobrirTabelas` devolve, do dicionário do dublê, a descrição da tabela e cada coluna com nome, tipo e descrição; uma tabela que o dicionário não tem volta ausente, nunca inventada | `packages/connectors/src/sankhya/copy-tables.test.ts`, com o dublê | must |
| 10 | U3 | A conformidade recusa: dois nomes iguais num conector; um nome fora do padrão (português, minúsculas, até 40); a mesma origem duas vezes; uma chave ou coluna de alteração fora das colunas declaradas; uma tabela de colunas descobertas num conector sem gancho; uma tabela de operação sem colunas; um grupo que não é assunto do conector | `packages/connectors/src/kernel/conformance.test.ts` (novo), "a declaração por tabela" | must |
| 11 | U3 | A leitura de uma tabela pede no máximo as linhas da página do conector; quando a resposta passa dos bytes da página, a próxima página pede menos linhas; uma tabela de 450 colunas do dublê lê inteira, sem teto de colunas | `packages/connectors/src/sankhya/copy-tables.test.ts`, "a página em bytes" | must |
| 16 | U3 | Entre duas leituras, o dublê do Sankhya altera, cria e apaga uma nota, e o do HubSpot altera e remove um negócio, por rotas que só o dublê tem; o modo real não as tem | `packages/connectors/src/sankhya/fake.test.ts` e `hubspot/fake.test.ts` (novo), "o registro muda entre duas leituras" | must |
| 86 | U3 | `readTablePage` lê uma página de qualquer tabela declarada, pelas duas origens: a da tabela, pela leitura do conector (o Sankhya), e a da operação, pela paginação `list` da operação (o negócio do HubSpot, as listas do Mercado Livre); a última página diz que acabou, e uma recusa da fonte volta como um dos quatro códigos de `TABLE_SOURCE_FAILURES`, nunca o corpo | `packages/connectors/src/kernel/tables.test.ts` (novo), contra os dublês do Sankhya e do HubSpot | must |
| 85 | U3 | A parte gerada da skill lista as tabelas recomendadas de cada conector: o nome no lago, o rótulo, a descrição e a origem (`sankhya_notas`, "Notas e pedidos", `TGFCAB`), e diz que a tabela de cada ligação traz só aquela ligação | `packages/connectors/src/kernel/skill.test.ts` (novo), "as tabelas" | must |
| 17 | U4 | `tap --about` e `tap --discover` respondem para todo conector que declara uma tabela. No `--discover`, cada entrada tem `stream` com o nome no lago (`sankhya_notas`), `table_name` com a origem (`TGFCAB`) e `selected: false`; as colunas vêm com o nome da fonte em minúsculas e a descrição, as do Sankhya pelo dicionário, as do HubSpot pela declaração. A bateria padrão do singer-sdk passa sobre a saída crua dos dois | `apps/extraction/tap/src/tap.test.ts`; `apps/extraction/tests/test_tap_battery.py` | must |
| 18 | U4 | Uma rodada com duas tabelas escolhidas no catálogo lê as duas, uma depois da outra, e só elas; cada uma emite SCHEMA, RECORD com a versão da passada, STATE a cada página e ACTIVATE_VERSION no fim; a primeira passada lê tudo, a linha sem `DTALTER` incluída (#940); nenhum campo da credencial aparece na saída | `apps/extraction/tap/src/tap.test.ts`, "duas tabelas numa rodada", "a linha sem data" e "nada do segredo na saída" | must |
| 19 | U4 | Um login recusado faz o adaptador sair com código diferente de zero e escrever no arquivo de resultado o código da fonte (`COPY_SOURCE_NEEDS_REAUTH`, `COPY_SOURCE_REFUSED`, `COPY_SOURCE_UNREACHABLE` ou `COPY_SOURCE_UNREADABLE`) e a tabela em que parou, nunca o corpo | `apps/extraction/tap/src/tap.test.ts`, "a fonte recusa" | must |
| 20 | U4 | A regra de máquina da mudança de método recusa um import de `packages/connectors/src/sankhya/` e um nome de conector plantados no adaptador | o check da regra, em `npm run deps`, com o caso plantado no teste da regra | must |
| 21 | U5 | Pelo `meltano run`, o gravador acrescenta numa tabela Iceberg local as linhas do dublê do Sankhya, com `_sdc_sequence` e `_sdc_table_version`, o dinheiro em `decimal(38,9)`, e a soma bate com a da fonte; `1234567890123.123456` chega igual; as 450 colunas do dublê chegam | `apps/extraction/tests/test_target.py`, "a passada inteira chega à bruta" e "a tabela larga" | must |
| 22 | U5 | Um valor que não cabe em `decimal(38,9)` termina a rodada com `COPY_LAKE_WRITE_FAILED`, sem gravar o lote | `apps/extraction/tests/test_target.py`, "o valor que não cabe" | must |
| 23 | U5 | A entrada lê o parâmetro da rodada, grava o segredo num arquivo `0600` e só o caminho vai à configuração do Meltano; nenhuma variável de ambiente do leitor e do gravador, nem linha do registro da tarefa, tem um campo do segredo | `apps/extraction/tests/test_entry.py`, "o segredo fica no arquivo" | must |
| 24 | U5 | A entrada manda à fila um resultado só por rodada, na forma `CopyTaskResult`, com as contagens de cada tabela e o código; nunca o conteúdo de uma linha. Uma falha do leitor dá o código dele; do gravador, `COPY_LAKE_WRITE_FAILED` | `apps/extraction/tests/test_entry.py`, "um resultado por rodada", contra a gravação da fila | must |
| 25 | U5 | Com o parâmetro da rodada apagado no meio, a tarefa para no lote seguinte, sem gravar mais e sem mandar resultado | `apps/extraction/tests/test_entry.py`, "a rodada fechada para a tarefa" | must |
| 26 | U5, U6 | A imagem (Node 24, Python 3.13, Meltano, o adaptador e o gravador, x86) responde a `tap --about` e a `meltano --version` antes de ser publicada; no Fargate (L.1), contra o dublê do Sankhya, as linhas chegam à bruta do `S3 Tables` e a soma bate | `scripts/workflows.test.ts`, "a imagem responde antes de sair"; Lab, no pull request do G2 | must |
| 27 | U5 | Na AWS (L.3), o fim normal, a falha do leitor, a falha do gravador e um `StopTask` chegam à fila com o motivo certo nos quatro | Lab, no pull request do G2 | must |
| 28 | U5 | Na AWS (L.5), a soma de `decimal(38,9)` lida pelo Athena bate com a da fonte | Lab, no pull request do G2 | must |
| 29 | U6 | A plataforma tem a fila e a fila de mortos, a regra que manda à fila a parada das tarefas do cluster da cópia, o cluster, a definição de tarefa única (2 vCPU, x86, sem segredo no ambiente), o depósito de imagens e a rede de sub-redes públicas sem NAT | `infra/aws/test/platform.test.ts`, "a plataforma da cópia" | must |
| 30 | U6 | A receita do lago cria o papel `conexus-<lago>-escritor`, com o teto, confiando só nas tarefas do ECS da conta, com as concessões de escrita nas duas áreas do lago daquela empresa, a leitura dos parâmetros da empresa, a leitura e a escrita do prefixo dela no depósito do estado e o grupo de consultas do Athena | `infra/aws/test/lake.test.ts`, "o papel que escreve" | must |
| 31 | U6 | Na AWS (L.6), o papel que escreve de A grava nas duas áreas de A e é recusado nas de B, e não lê o parâmetro de uma rodada de B | Lab, no pull request do G2 | must |
| 32 | U6 | O papel do Hub pode iniciar e parar só a tarefa da cópia, entregar só papéis `conexus-*-escritor` às tarefas do ECS, gravar e apagar só parâmetros `/conexus/copia/*`, ler e apagar mensagens só da fila da cópia, e listar e apagar tabelas só de depósitos `conexus-*`; nada além | `infra/aws/test/platform.test.ts`, "os poderes do Hub" | must |
| 33 | U6 | Na AWS (L.2), uma tarefa faz o login e lê uma página do Sankhya do fundador. Se o gateway recusar, a etapa para e volta ao fundador | Lab, no pull request do G2, com a imagem e a plataforma da U6; o L.2 à mão já rodou antes da parte 1 | must |
| 34 | U6 | A preparação deixa a Release criar as peças do 29 e nada além do que já deixava; a Release monta a imagem, publica-a e só então publica a plataforma, com a tarefa apontando para a imagem pelo digest | `infra/aws/test/preparation.test.ts`, "a segunda preparação"; `scripts/workflows.test.ts`, "a imagem da cópia antes da plataforma" | must |
| 35 | U7 | As quatro tabelas existem com as conferências do banco: uma cópia por ligação; uma tabela marcada por fonte e ligação, e um nome por empresa; uma rodada aberta por ligação; o código do sistema com teto (#1135) | `apps/server/src/hub/copies/lake-tables.test.ts`; `catalog.test.ts` | must |
| 36 | U7 | O login da empresa lê, da linha do lago, só a da própria empresa e só as colunas nomeadas; gravar, mudar ou apagar é recusado; a foto do catálogo muda só nisso e nas tabelas novas | `apps/server/src/hub/lake/tables.test.ts`, "a empresa lê a sua linha"; `catalog.test.ts` | must |
| 37 | U8 | `GET` das tabelas no lago de uma ligação do Sankhya devolve **Notas e pedidos**, com o nome `sankhya_notas`, a origem `TGFCAB`, a descrição e o número de colunas do dicionário, desmarcada, e o estado do lago. Numa ligação de credencial exclusiva ou de um conector sem tabela declarada, a seção não vem: o campo `lake` é `UNAVAILABLE`, com o motivo. Para quem não lê a ligação, 404 (S10). Com o dicionário fora do ar, a tabela vem com o rótulo e a descrição do kit, sem o número de colunas | `apps/server/src/hub/copies/lake-routes.test.ts`, "a lista da ligação" | must |
| 38 | U8 | Salvar a marca de **Notas e pedidos** cria a cópia da ligação, a linha `sankhya_notas` com a origem `TGFCAB`, o relógio da ligação e dispara a primeira rodada, inteira; salvar de novo o mesmo conjunto não muda nada. Numa empresa sem lago pronto responde 409 `COPY_LAKE_NOT_READY` sem criar nada; uma tabela que o kit não declara, 422; quem não gerencia cópias, 403; a mesma tabela de outra ligação do mesmo sistema, 409 `COPY_NAME_TAKEN` | `lake-routes.test.ts`, "marcar" | must |
| 39 | U8 | A cada disparo, pelo relógio da ligação ou por **Rodar agora** (`POST .../lake-copy/run`), o Hub abre uma rodada da ligação, lê o dicionário para as colunas da tela, grava o parâmetro e inicia a tarefa com o papel da empresa e o `clientToken` de rodada e tentativa, levando as tabelas marcadas, cada uma com o seu `whole`; com rodada aberta, o disparo responde "já está rodando" e não grava nada | `apps/server/src/hub/copies/lake-run.test.ts`, "o disparo", pela rota e pelo passo do relógio, contra as gravações da AWS | must |
| 40 | U8 | **Rodar agora** duas vezes ao mesmo tempo inicia uma tarefa só | `lake-run.test.ts`, "dois disparos juntos" | must |
| 41 | U8 | O resultado da tarefa fecha a rodada uma vez, com o resultado, as contagens de cada tabela, `rows` e o código; na parte 1, toda rodada é inteira e `rows` é o `written` da passada; a parada do ECS que chega depois não muda nada; quem chega primeiro fecha; ficam as 100 rodadas mais novas de cada ligação | `apps/server/src/hub/copies/lake-queue.test.ts`, "o resultado e a parada" e "as 100 mais novas" | must |
| 42 | U8 | Uma parada do ECS sem resultado fecha a rodada como `ERROR` `COPY_TASK_LOST`; uma tarefa parada pelo Hub fecha como `INTERRUPTED` | `lake-queue.test.ts`, "a tarefa que morreu" | must |
| 43 | U8 | No disparo, uma rodada aberta cuja tarefa a AWS diz parada ou não conhece, ou aberta há mais de 6 horas, é fechada antes de abrir a nova | `lake-run.test.ts`, "a varredura" | must |
| 44 | U8 | Toda rodada fechada apaga o parâmetro dela; um parâmetro que a AWS não tem conta como apagado | `lake-queue.test.ts`, "o parâmetro sai no fim" | must |
| 45 | U8 | Um `RunTask` recusado fecha a rodada como `ERROR` `COPY_LAKE_UNAVAILABLE` e apaga o parâmetro; um `RunTask` sem resposta é repetido com o mesmo `clientToken`, e a AWS não inicia duas | `lake-run.test.ts`, "a AWS recusa" e "a AWS não responde" | must |
| 46 | U8 | Dez disparos de dez ligações no mesmo segundo (L.9): o parâmetro recusado por cota é refeito, e as dez rodadas abrem | Lab, no pull request do G4 | should |
| 47 | U8 | Desmarcar uma tabela apaga as tabelas dela nas duas áreas do lago e a linha; desmarcar a última apaga também a cópia da ligação e o relógio; desmarcar com a rodada aberta responde 409 `COPY_RUN_OPEN` e não muda nada. Desligar a ligação não é recusado pelo estado da cópia: para a tarefa aberta, fecha a rodada `INTERRUPTED`, apaga as tabelas do lago e só então a linha da ligação, que leva a cópia em cascata. Com a AWS fora, desmarcar e desligar respondem 503 e nada muda. Na AWS (L.8), nada sobra | `lake-routes.test.ts`, "desmarcar"; Lab | must |
| 48 | U8 | Apagar o lago de uma empresa com tabelas apaga as tabelas, depois as áreas e a pilha, e leva as cópias do lago da empresa; na AWS (L.8), nada sobra | `apps/server/src/hub/lake/lake-remove.test.ts`, "o lago com tabela"; Lab | must |
| 87 | U8 | Remover uma empresa tira os relógios das ligações dela; depois da subida, `mastra.schedules` tem um relógio por cópia de ligação e nenhum de uma ligação que saiu | `apps/server/src/builder/mastra/mastra.test.ts`, "o relógio da ligação" | must |
| 49 | U8 | `GET .../lake-tables` da empresa devolve cada tabela marcada, agrupada pela ligação, com o rótulo, o nome no lago, a origem, o estado, as linhas, a hora e o intervalo da ligação (`LakeTableSummary`); as rodadas de uma tabela (`GET .../lake-tables/{id}/runs`) são as da ligação que a levaram, com as contagens dela; quem não lê a ligação não vê a tabela | `apps/server/src/hub/copies/lake-routes.test.ts`, "a lista de Dados" | must |
| 50 | U8 | O registro do Hub mostra `COPY_RUN_ENDED` com as contagens e a ligação; nem ele nem a fila levam o conteúdo de uma linha ou do segredo | `lake-queue.test.ts`, "o que o registro leva" | must |
| 51 | U8 | Sem cópia de ligação, o Hub não chama a AWS; com cópias, o consumidor da fila não abre conexão com o banco enquanto não chega mensagem (data D27) | `lake-queue.test.ts`, "o banco que dorme", na forma de `apps/server/src/builder/automations/scheduler.test.ts` | must |
| 52 | U8 | Uma tabela do lago não cria nada no banco da empresa (nem esquema, nem login, nem tabela) e não entra no catálogo que o Assistente e os Projetos leem | `lake-routes.test.ts`, "a tabela do lago fica fora do banco"; o teste de conformidade do contrato | must |
| 53 | U8 | O servidor de respostas gravadas responde `DescribeStackEvents` e as chamadas do `S3 Tables` (#1265); nenhuma gravação fica sem teste que a leia, e os ids de laboratório saem delas (#1266); o roteiro que grava está no repositório (#1267) | `apps/server/src/platform/recordings.test.ts`, "toda gravação tem leitor"; `aws.test.ts`, pelo servidor de respostas gravadas | must |
| 54 | U9 | Na página da ligação, a seção **Tabelas no lago** lista **Notas e pedidos** com `TGFCAB` ao lado, a descrição e as colunas, desmarcada, o intervalo e **Salvar**; na parte 1, o intervalo oferece só 24 h (T.29); marcar e salvar mostra a tabela marcada e "Rodando…"; quem não gerencia cópias vê a lista sem as marcas; sem lago pronto, a frase da matriz | `apps/web/src/hub/connectors/lake-tables.test.tsx` | must |
| 55 | U9 | Em **Dados**, a tabela aparece pelo rótulo, com o nome no lago e "<sistema> · <origem>" embaixo. A página dela tem **Visão geral**, **Colunas** (o nome e a descrição de cada uma), **Rodadas** e **Detalhes**. Em **Rodadas**, o resultado diz "Completa · inteira" ou "Completa · só o que mudou"; em **Detalhes**, "As linhas ficam no lago da empresa."; não há **Amostra**, **Quem lê** nem Projetos, que chegam nas etapas 3 e 4. Cada código novo tem a sua frase | `apps/web/src/hub/copies/lake-list.test.tsx` e `lake-detail.test.tsx` | must |

### Parte 2, a mudança aparece

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 56 | U10 | Pelo `meltano run`, a segunda rodada de uma ligação do Sankhya lê, de cada tabela, só o que mudou desde o ponto de parada dela, guardado no depósito do estado com o prefixo da empresa; uma tabela sem coluna de alteração (o negócio do HubSpot) lê tudo | `apps/extraction/tests/test_state.py`, "a segunda rodada" | must |
| 57 | U10 | Na AWS (L.4): uma rodada morta no meio retoma lendo menos que o total; o estado salvo nunca está adiante das linhas gravadas; o papel de A não lê o prefixo de B | Lab, no pull request do G5 | must |
| 58 | U10 | Pela entrada da tarefa (`meltano run` e a atualização depois), depois de uma rodada inteira e uma só do que mudou, a atual tem uma linha por chave, igual à fonte, com o valor de hoje; o `MERGE` roda um caso por instrução e passa com as 450 colunas do dublê | `apps/extraction/tests/test_update.py`, pela entrada, contra as gravações do Athena; Lab (L.7) | must |
| 59 | U10 | Depois de cada atualização, a bruta não tem mais as linhas que já entraram na atual, nem as passadas inteiras anteriores, as da parte 1 incluídas; a atual não muda com a limpeza (decisão A) | `test_update.py`, "a limpeza"; Lab (L.7) | must |
| 60 | U10 | O Hub pede `whole` para uma tabela recém-marcada; a tarefa lê inteira também a tabela sem ponto de parada no estado e a sem coluna de alteração, e o resultado diz `whole` por tabela; as outras leem só o que mudou; **Rodar agora** segue o mesmo. O intervalo passa a oferecer de 15 min a 24 h | `apps/extraction/tests/test_state.py`, "o modo por tabela"; `lake-run.test.ts`, "a tabela nova é inteira" | must |
| 61 | U10 | Desmarcar uma tabela apaga também o ponto de parada dela | `lake-routes.test.ts`, "o ponto de parada sai" | must |

### Parte 3, o aviso

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 62 | U11 | Existem a parada na cópia da ligação e o aviso no sino, com as conferências do banco; a foto do catálogo muda só nisso | `apps/server/src/hub/notifications/tables.test.ts`; `catalog.test.ts` | must |
| 63 | U12 | A primeira rodada com erro de uma ligação que não estava parada anota a parada, com a hora e o código; sai um e-mail ao Dono, a cada Administrador e à lista de e-mails da empresa, com as tabelas da rodada, e uma linha no sino de cada Dono e Administrador | `apps/server/src/hub/notifications/copy-stop.test.ts`, "a primeira falha" | must |
| 64 | U12 | Duas rodadas com erro da mesma ligação, uma depois da outra, dão um e-mail e uma linha no sino por pessoa | `copy-stop.test.ts`, "a segunda falha não avisa" | must |
| 65 | U12 | A primeira rodada completa tira a parada, e desmarcar a última tabela ou desligar a ligação também; o relógio do lembrete sai, sem e-mail | `copy-stop.test.ts`, "a volta" | must |
| 66 | U12 | Um lembrete por dia, na hora do T.15, por ligação ainda parada, com as tabelas dela; nenhum lembrete depois que ela volta, e nenhum no dia em que ela parou | `copy-stop.test.ts`, "o lembrete" | must |
| 67 | U12 | Na página Dados e na seção da ligação, a cópia parada mostra **Parada** e o motivo; quem não é Dono nem Administrador não recebe o aviso no sino | `apps/web/src/hub/copies/lake-list.test.tsx`, "parada"; `copy-stop.test.ts`, "quem recebe" | must |
| 68 | U12 | Um e-mail que não sai não desfaz a parada e é registrado; o próximo lembrete do dia vai | `copy-stop.test.ts`, "o e-mail que não sai" | must |
| 69 | U13 | O Dono e o Administrador listam, acrescentam e tiram um e-mail da lista; o mesmo e-mail com outra caixa é recusado (409 `ALERT_RECIPIENT_EXISTS`); quem não é Dono nem Administrador recebe 403 e não vê a seção; um e-mail acrescentado recebe o próximo aviso | `apps/server/src/hub/notifications/routes.test.ts` (novo), "a lista de e-mails"; `apps/web/src/hub/identity/alert-recipients.test.tsx` | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dados, a página (U1, U14) | Parte 0: a árvore dos sistemas e a camada dos apps; "Nenhuma tabela copiada." | O mesmo da primeira vez | O de hoje | O de hoje | O endereço antigo de uma cópia leva à página Dados | Como hoje | — |
| Dados, a lista do lago (U9, U12) | Parte 1: "Nenhuma tabela copiada. Para copiar, abra a ligação em Integrações." | O mesmo da primeira vez | O de hoje da página | O de hoje da página | Uma tabela desmarcada noutra aba some na próxima leitura | Quem não lê a ligação não vê as tabelas dela | A última rodada com erro: o selo de hoje, com a frase do código; parte 3: **Parada**, com o motivo |
| A ligação, a seção Tabelas no lago (U9, U12) | A lista do kit, nada marcado, o intervalo padrão, **Salvar** desligado até mudar algo | Conector sem tabela declarada ou de credencial exclusiva: a seção não aparece | "Lendo o dicionário do Sankhya…" | O dicionário fora do ar: a tabela com o rótulo do kit e "Não deu para ler o dicionário agora."; `COPY_LAKE_NOT_READY`: "O lago desta empresa não está pronto. Peça ao operador do Conexus."; `COPY_RUN_OPEN`: "A ligação está copiando agora. Desmarque quando a rodada terminar."; `COPY_NAME_TAKEN`: "Outra ligação deste sistema já copia esta tabela." | A ligação desligada: a frase de hoje da página | Quem não gerencia cópias vê as tabelas marcadas, sem caixas nem **Salvar** | Parte 3: a cópia parada mostra **Parada** e o motivo ao lado do intervalo |
| A tabela do lago, Visão geral, Colunas, Rodadas e Detalhes (U9) | A primeira rodada aberta: "Rodando…", sem linhas | Nenhuma rodada ainda: "Esta tabela ainda não rodou." | O de hoje da página | `COPY_LAKE_UNAVAILABLE`: "A AWS não iniciou a cópia. A próxima rodada tenta de novo." `COPY_TASK_LOST`: "A cópia parou antes de terminar. A próxima rodada tenta de novo." `COPY_LAKE_WRITE_FAILED`: "Não deu para gravar no lago. A próxima rodada tenta de novo." `COPY_SOURCE_NEEDS_REAUTH`: "<sistema> recusou o login da ligação. Reconecte a ligação." `COPY_SOURCE_REFUSED`: "<sistema> recusou a leitura." `COPY_SOURCE_UNREACHABLE`: "<sistema> não respondeu. A próxima rodada tenta de novo." `COPY_SOURCE_UNREADABLE`: "<sistema> respondeu algo que o Conexus não entende. A próxima rodada tenta de novo." Uma rodada com erro diz em que tabela parou | A tabela desmarcada: "Esta tabela não é mais copiada." | Quem não lê a ligação: o "não encontrado" (S10) | A rodada interrompida: "Interrompida." |
| O cartão do Caderno na conversa (U19) | "Gravar no Caderno?", com o conceito, o mapeamento, a consulta da prova e o número de linhas, e **Aprovar** e **Recusar** | — | O de hoje do cartão de escrita | A ligação saiu antes do sim: "Esta ligação não existe mais. Nada foi gravado." | — | Quem não gerencia ligações vê o cartão sem os botões e "Peça a quem gerencia a ligação." | Recusado: "Não gravado." |
| A ligação, o Caderno (U19) | A lista de hoje, com "Aprovada por <nome>" em cada anotação | O vazio de hoje | O de hoje | O de hoje | — | Como hoje | Uma anotação de antes desta etapa: "Gravada sem aprovação" |
| O sino, a linha da parada (U12) | "A cópia de <ligação> parou: <tabelas>." | Sem parada: nenhuma linha | O de hoje | O de hoje | A ligação desligada depois do aviso: a linha fica, com o nome guardado | Só Dono e Administrador recebem a linha | — |
| Configurações, a seção Avisos (U13) | A lista vazia: "Só o Dono e os Administradores recebem os avisos." e o campo de e-mail | O mesmo da primeira vez | O de hoje da página | Um e-mail já na lista: "Este e-mail já recebe os avisos." | Um e-mail tirado noutra aba some na próxima leitura | Quem não é Dono nem Administrador não vê a seção | — |
| O e-mail da parada e o lembrete (U12) | "A cópia de <ligação> parou", com as tabelas, o motivo e o link para a ligação | — | — | Um e-mail que não sai fica no registro do Hub (critério 68) | — | Vai só ao Dono, aos Administradores e à lista | — |

A etapa do conector não muda tela para quem usa, além do cartão e do Caderno da U19: as telas de
Integrações leem o kit pelo mesmo índice, e os ids não mudam.

As caixas, a 1280 e a 390 px, seguem a organização A do reestudo (uma seção na página da ligação, a
K2), porque a TD2 já pede "o que a ligação entrega, quais cópias e Projetos a usam, quando cada cópia
rodou" (`C/docs/reference/telas.md:392`). O nome em Dados segue a Nekt: o rótulo primeiro, o nome no
lago e a origem embaixo (`EST/conector-estilo-novo-estudo:105`). As capturas que o desenho segue são
do estudo anterior: `capturas/hoje/` da página Dados e da ligação, a 1440 e 390 px, e a do Airbyte,
`capturas/referencias/cloud-status-page.png`.

```text
1280 px, a página da ligação                          390 px, a página da ligação
+--------------------------------------------------+  +------------------------------+
| Sankhya · Matriz                   Funcionando   |  | Sankhya · Matriz             |
| Último teste 10:02 · Testar                      |  | Funcionando · Testar         |
| A ligação ...                                    |  | Tabelas no lago              |
| Tabelas no lago                                  |  | [x] Notas e pedidos          |
|  [x] Notas e pedidos   TGFCAB   312 colunas      |  |     TGFCAB · 312 colunas     |
|      Cabeçalho de toda nota e pedido do Sankhya  |  |     Em dia · 02/11 10:00     |
|      Em dia · 02/11 10:00                        |  | Intervalo [30 min v]         |
|  Intervalo [30 min v]   Rodar agora   [Salvar]   |  | Rodar agora      [Salvar]    |
| Caderno ...                                      |  +------------------------------+
+--------------------------------------------------+
1280 px, Dados                                        390 px, Dados
+--------------------------------------------------+  +------------------------------+
| Tabela             Atualizada    Linhas Intervalo|  | Notas e pedidos     Em dia   |
| Sankhya · Matriz · 1 tabela                      |  | sankhya_notas                |
| Notas e pedidos    Em dia 02/11  118.402  30 min |  | 02/11 10:00 · 118.402        |
|  sankhya_notas · Sankhya · TGFCAB                |  +------------------------------+
+--------------------------------------------------+
```

As peças de `ui/`: a seção e o título que a página da ligação já usa, a caixa de marcar, o seletor de
intervalo, a tabela, as abas, o botão e o selo de hoje, e o cartão de aprovação de
`apps/web/src/ui/ai/approval.tsx`; nenhuma peça nova. A interface do Impeccable roda na QA de cada
parte com tela ([Impeccable](../reference/impeccable.md)).

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `credentialClass` de cada login do kit | U16, a definição de cada conector | U8, a seção (`EXCLUSIVE_CREDENTIAL`); a etapa 5 |
| A parte gerada da skill (os assuntos, a escrita, as tabelas) | U16 e U3, `kernel/skill.ts`, da definição | o Assistente, o Builder e os agentes, pela skill da ligação |
| `Note.approvedBy` no Caderno | U19, `hub/connectors/notes.ts`, depois do sim | U19, `notes.tsx`; os agentes, pelo `connector_notes` |
| `LakeTablesOfConnection.lake` (`READY`, `NOT_READY` ou `UNAVAILABLE` com o motivo) | U8, `hub/copies/lake-routes.ts`, da linha do lago e da classe da credencial | U9, `lake-tables.tsx` |
| `LakeTablesOfConnection.tables[]` (`source`, `name`, `label`, `description`, `columns`, `marked`, `lastRun`) | U8, do kit, do dicionário e de `lake_table` | U9 |
| `LakeTablesOfConnection.interval` e `lastRun` | U8, de `lake_copy` e `lake_run` | U9 |
| `TableDeclaration.group` | U3, a declaração do kit | U3, a parte gerada da skill (as tabelas por assunto); U9, a seção agrupa por assunto |
| `LakeTableSummary.next` | U8, a próxima hora do relógio da ligação | U9, a Visão geral ("Próxima rodada") |
| `LakeRun.failedTable` | U8, de `lake_run.failed_table`, que o resultado da U5 traz | U9, a frase da rodada com erro |
| `SetLakeCopy` (`tables`, `interval`) | U9, `lake-tables.tsx` | U8, `lake-copy.ts` |
| As falhas `COPY_LAKE_NOT_READY`, `COPY_RUN_OPEN`, `COPY_NAME_TAKEN`, `COPY_TABLE_NOT_DECLARED` | U8 | U9, `text.ts` |
| `LakeTableSummary` (`connection`, `label`, `name`, `source`, `interval`, `rows`, `columns`, o último resultado) | U8, `hub/copies/lake-list.ts`, de `lake_table` e `lake_run` | U9, `lake-list.tsx`, `lake-detail.tsx` |
| `LakeRun.whole` e as contagens da tabela | U8 (sempre `true` na parte 1); U10 pelo modo | U9, a coluna Resultado |
| `LakeRunFailureCode` | U7 (a lista); U8 no fim; U5 no resultado | U9, `text.ts`; U12 |
| `CopyTaskSpec`, no parâmetro da rodada | U8, `lake-run.ts` | U5, `entry.py` |
| `CopyTaskResult`, na fila | U5, `entry.py` | U8, `lake-queue.ts` |
| O evento de parada do ECS, na fila | a regra do EventBridge (U6) | U8, `lake-queue.ts` |
| `lake_run.task_arn`, `lake_run.attempt` | U8, no disparo | U8, a varredura e o fim |
| `lake_table.columns` | U8, do dicionário, ao marcar e a cada disparo | U9, a aba Colunas |
| A linha do lago, lida pela empresa | o módulo do lago de hoje | U8, `lake-copy.ts` e `lake-run.ts` |
| `lake_copy.stopped_since`, `stopped_code`, `told_at` | U12 | U12, a lista, a seção e o lembrete |
| O aviso de parada no sino | U12 | U12, a lista do sino |
| A lista de e-mails | U13, as rotas | U12, quem recebe o e-mail |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| O Apagar do reajuste (a rota de hoje, antes da parte 0) | A segunda acha a cópia apagada: a mesma resposta (S10) | O `REVOKE` feito e a transação não: a cópia fica; clicar de novo termina | O banco da empresa fora: 503 sem mudar nada, como hoje | `COPY_DELETED` de hoje | 8 |
| A migração que tira as tabelas das cópias (U15) | O `migrate` roda uma vez por subida, com a trava de hoje | Uma instrução por tabela, numa transação: ou todas saem, ou nenhuma | O banco do Hub fora: a subida falha antes de servir, como hoje | o do `migrate` | 76 |
| As migrações que acrescentam (U7, U11) | O `migrate` roda uma vez por subida, com a trava de hoje | Numa transação: ou tudo entra, ou nada | O banco do Hub fora: a subida falha antes de servir, como hoje | o do `migrate` | 35, 36, 62 |
| Tirar o `sync` e os logins de uma empresa (o passo 4 do reajuste) | Cada instrução tem `IF EXISTS`: a segunda vez não acha nada e termina | Um login tirado e o esquema não: repetir termina | O banco da empresa fora: a empresa fica para depois; a consulta do passo 4 diz qual | a saída do `psql` do firstmate, fora do repositório (S40) | 77 |
| Gravar no Caderno depois do sim (U19) | Duas aprovações da mesma chamada: o Mastra retoma a chamada uma vez; o mesmo conceito duas vezes fica com a última, como hoje | A ligação saiu entre o sim e a gravação: `GONE`, nada gravado | O banco fora: a ferramenta responde a falha de hoje, e nada é gravado | `CONNECTION_NOTE_SAVED`, com quem aprovou; `CONNECTION_NOTE_REFUSED` | 83, 84 |
| A sessão do kit renova (U16) | Duas leituras da mesma ligação usam a mesma sessão; a renovação é uma por vez, pela fila de hoje da ligação | A renovação recusada: a sessão fecha, e a leitura termina em `NEEDS_REAUTH` | O sistema fora: a leitura termina com a recusa de hoje da ligação | `CONNECTION_SESSION_RENEWED`, sem o token | 12, 13 |
| Salvar as tabelas marcadas (`PUT` da cópia da ligação) | A chave da ligação: as duas gravam o mesmo conjunto, o último vence, e cada uma devolve o que ficou | A transação desfaz as linhas; o relógio é criado depois dela, e o próximo salvar o cria se faltar | O lago lido em outro estado: 409 `COPY_LAKE_NOT_READY`; o dicionário fora: a marca grava, sem colunas | `LAKE_COPY_SET` com as tabelas | 38, 47 |
| O relógio da ligação, criado e apagado (`mastra.schedules`) | O id do relógio é o da ligação: a criação que perde a corrida acha o relógio feito, como fazia o relógio de hoje (`C/apps/server/src/builder/copy-clock/clock.ts:70-79`, no histórico) | Linhas gravadas e relógio não: o próximo salvar cria; **Rodar agora** funciona sem ele | O banco fora: o salvar responde a frase de hoje | `LAKE_CLOCK_FAILED` | 38, 47 |
| Abrir a rodada (`INSERT` em `lake_run`) | O índice de uma rodada aberta por ligação recusa a segunda: "já está rodando" | — (uma instrução) | Banco fora: o disparo não abre nada; o próximo tenta | `COPY_RUN_SKIPPED` com o motivo | 39, 40 |
| Gravar o parâmetro da rodada (`PutParameter`) | Um nome por rodada, sem disputa | A rodada fecha `COPY_LAKE_UNAVAILABLE` | Cota (3 por segundo): refeito com espera, depois `COPY_LAKE_UNAVAILABLE` | `COPY_LAKE_START_FAILED` com o código da AWS | 45, 46 |
| Iniciar a tarefa (`RunTask`) | O `clientToken` de rodada e tentativa: a AWS devolve a mesma tarefa | Sem resposta: repetido com o mesmo token; recusado: a rodada fecha e o parâmetro sai | A AWS fora: `COPY_LAKE_UNAVAILABLE` | `COPY_LAKE_START_FAILED` | 39, 45 |
| O resultado e a parada na fila (o fim) | Quem chega primeiro fecha (`UPDATE ... WHERE ended_at IS NULL`); o segundo não muda nada | A mensagem só sai da fila depois do fim gravado; três entregas falhas vão à fila de mortos | Banco fora: a mensagem volta à fila e é lida de novo | `COPY_RUN_ENDED`; uma mensagem ilegível, `COPY_QUEUE_UNREADABLE`, apagada da fila | 41, 42, 50 |
| Apagar o parâmetro no fim | Apagar duas vezes: a segunda acha nada e conta como apagado | A rodada já está fechada; a tarefa que ainda roda para no lote seguinte | A AWS fora: a varredura do próximo disparo apaga | `COPY_PARAMETER_LEFT` | 25, 44 |
| Gravar `lake_run.task_arn` depois do `RunTask` | Uma rodada só grava (a linha dela) | O Hub cai entre o `RunTask` e a gravação: a varredura acha a tarefa pelo `startedBy` da rodada (`ListTasks`), ou fecha a rodada pelas 6 horas | Banco fora: o mesmo | `COPY_TASK_UNRECORDED` | 43 |
| A varredura no disparo | Duas varreduras fecham a mesma rodada uma vez (o mesmo `UPDATE`) | — | A AWS fora: a rodada aberta há mais de 6 h fecha mesmo assim, como `COPY_TASK_LOST` | `COPY_RUN_SWEPT` | 43 |
| O gravador acrescenta na bruta (`append` do PyIceberg) | Uma rodada aberta por ligação (o índice); o PyIceberg refaz o commit em conflito 4 vezes | Um lote sem commit não aparece; o estado não sai antes dele | O catálogo responde 429 e o PyIceberg não refaz: a rodada termina `COPY_LAKE_WRITE_FAILED` | A linha `METRIC` do SDK e o resultado; nunca uma linha de dado | 21, 22, 24 |
| A entrada grava o segredo num arquivo `0600`, e o adaptador grava `result_path` | Uma tarefa por rodada; cada uma no seu disco | O arquivo não grava: a tarefa termina sem resultado, e a parada do ECS fecha a rodada como `COPY_TASK_LOST` | — (o disco da tarefa) | `SECRET_NOT_WRITTEN` ou `RESULT_FILE_NOT_WRITTEN`, sem o conteúdo | 19, 23 |
| A tarefa manda o resultado à fila (`SendMessage`) | Um resultado por rodada; uma entrega repetida acha a rodada fechada e não muda nada | O resultado não sai: a tarefa termina, e a parada do ECS fecha a rodada como `COPY_TASK_LOST` | A fila fora: o mesmo | `RESULT_NOT_SENT` no registro da tarefa | 24, 42 |
| A poda das rodadas além das 100 mais novas (no fim) | Duas pelas mesmas linhas: a segunda acha nada | Na transação do fim: desfaz com ele | O banco fora: o fim não grava, e a mensagem volta à fila | — (dentro de `COPY_RUN_ENDED`) | 41 |
| As colunas do dicionário em `lake_table.columns` (ao marcar e no disparo) | O último a gravar vence; as duas leram o mesmo dicionário | Gravadas e rodada não aberta: a próxima rodada regrava | O dicionário fora: as colunas guardadas ficam, e a rodada segue | `COPY_COLUMNS_KEPT` | 37, 39 |
| A tarefa confere a rodada a cada lote | — | Parâmetro apagado: para sem mandar resultado; a parada do ECS fecha o que sobrou | A AWS fora na conferência: conta como fechada e para | `RUN_CLOSED` no registro da tarefa | 25 |
| Parar a tarefa aberta ao desligar (`StopTask`) | A segunda acha a tarefa parada e conta como parada | Recusada: a parada do ECS fecha a rodada `INTERRUPTED` pelo fim de sempre | A AWS fora: desligar responde 503 e nada muda | `COPY_TASK_STOPPED` | 47 |
| Desmarcar uma tabela e desligar a ligação (as tabelas das duas áreas e, na parte 2, o prefixo do estado no `S3`) | A segunda acha a linha apagada e responde o conjunto de agora; desligar com a rodada aberta para a tarefa primeiro | Tabelas do lago ou estado apagados e linha não: a tabela que a AWS não tem conta como apagada; repetir termina. A linha da ligação sai só depois das tabelas, e a cópia dela vai em cascata | A AWS fora: 503, nada muda, e a tela diz a frase de hoje de tentar de novo | `COPY_LAKE_TABLE_LEFT` | 47, 61 |
| Apagar o lago com tabelas | A trava do lago de hoje (etapa 1) | Tabelas apagadas e pilha não: o próximo **Apagar o lago** termina | A AWS fora: o estado `delete_failed` de hoje | o de hoje do lago | 48 |
| A Release publica a imagem e a plataforma | O grupo de concorrência da Release de hoje | Imagem publicada e plataforma não: a próxima Release publica a mesma versão | O ECR fora: a Release falha antes do `deploy` | o do workflow | 26, 34 |
| O ponto de parada do Meltano (parte 2) | Uma rodada por ligação; o Meltano grava a cada linha de estado | Morte no meio: o estado é o do último lote gravado | O `S3` fora: o Meltano falha, e a rodada termina com o código do gravador | o de hoje do Meltano | 56, 57 |
| O atualizar e a limpeza (parte 2, três `MERGE`, um `DELETE` na passada inteira e um da limpeza) | Uma rodada por ligação | Entre duas instruções a atual fica num estado do meio; a próxima rodada refaz | O Athena fora: a rodada termina `COPY_LAKE_WRITE_FAILED`; a bruta guarda as linhas | `UPDATE_FAILED` com o código do Athena | 58, 59 |
| Anotar a parada e avisar (parte 3) | Duas rodadas da mesma ligação não fecham juntas (uma aberta por ligação); a parada é uma coluna, gravada só se estava vazia | O e-mail sai depois da transação; um e-mail que não sai não a desfaz | O envio fora: registrado, e o lembrete do dia seguinte vai | `COPY_STOP_MAILED` ou `COPY_STOP_MAIL_FAILED` | 63, 64, 68 |
| O relógio do lembrete, criado com a parada e apagado com a volta (parte 3) | O id do relógio é o da ligação: a criação que perde a corrida acha o relógio feito | Parada gravada e relógio não: a próxima rodada com erro da ligação cria | O banco fora: a rodada fecha sem a parada, e a próxima anota | `COPY_STOP_CLOCK_FAILED` | 65, 66 |
| O lembrete do dia (parte 3) | O relógio do Mastra dispara um por vez; a coluna `told_at` guarda o último | — | O banco fora: o lembrete do dia não sai, e o do dia seguinte sim | `COPY_STOP_REMINDED` | 66 |
| Acrescentar e tirar um e-mail da lista (U13) | O índice `alert_recipient_key` recusa o segundo: 409 `ALERT_RECIPIENT_EXISTS` | — (uma instrução) | Banco fora: a frase de hoje de tentar de novo | o de hoje das rotas | 69 |

## A tabela de referência

A tabela dos estudos, com a unidade e o arquivo novo de cada linha. As linhas 1 a 38 são do estudo e
do reestudo; as 39 a 45, do estudo do conector no estilo novo e do das duas ligações (`T<n>` lá); as
46 a 55, do estudo do ao vivo (`R<n>` e a seção 1.3 lá). `C/` é o `main` em `538b0562`; as siglas são
as dos estudos: `AB` airbyte `8b40981a`, `AP` airbyte-platform `c46502e`,
`CDK` airbyte-python-cdk `bde4377`, `DLT` dlt `efaf0e3`, `TRM` tap-rest-api-msdk `071b540`,
guardados em `data/conexus-credenciais-framework/refs/`, e `NK` o texto da Nekt guardado em
2026-11-19. A coluna "Muda" diz o que os estudos de 2026-11-23 mudaram: **fica**, **sai** ou **refeita**. A unidade
de cada linha remendo (11, 12, 13, 21, 22, 28, 29, 34) acrescenta a sua entrada em
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
| 7 | Apagar a cópia do banco, para o reajuste | fica até o reajuste; sai com a parte 0 | `deleteCopy`, `C/apps/server/src/hub/copies/leave.ts:196-233`; o fim e o `DROP`, `:161-178`, `:282-300` | — | embrulhado: herdado, já em produção | — | o reajuste | o reajuste; U1 | — |
| 8 | A declaração da tabela no kit: a tabela da fonte, a chave, o modo, a página | refeita | `C/packages/connectors/src/kernel/copy.ts:66-92` (`QUERY`, até 100 colunas `:73`, chave só `bigint` `:81-87`); `PAGE_ROWS = 500` `:6`; `CopyModel` `:184` | 0080, `C/docs/decisions/0080-copy-declared-per-table-raw-appends.md:10-13`; Nekt API, por tabela, `primary_keys`, `replication_key`, `sync_type` (`NK:20888-20897`); `CDK .../declarative_component_schema.yaml:2244-2271` (`page_size` por paginador) | embrulhado: a lista recomendada do kit sobre o `--discover` | O dicionário no dublê, 286 linhas (`EST/descoberta-catalogo:75-80`). Não provado: 450 colunas, a página em bytes (critérios 11, 21) | F; NT1, NT4 | U3 | `packages/connectors/src/kernel/tables.ts`; `packages/connectors/src/sankhya/copy-tables.ts` |
| 9 | A descoberta das colunas pelo dicionário (`TDDTAB`, `TDDCAM`) | nova | nenhuma na cópia; a skill do agente já lê o dicionário (`C/packages/connectors/src/sankhya/skill/SKILL.md:49`) | o `--discover` do Singer; tap-oracle lê `all_tab_columns` (`EST/descoberta-catalogo:135`); Nekt Protheus, os nomes do dicionário (`NK:177778`) | nativo | Medido antes, no dublê (`EST/descoberta-catalogo:75-80`). Não provado no Sankhya real: o passo 6 do roteiro | D1, 2026-11-19 | U3, U4 | — (em `copy-tables.ts`) |
| 10 | O prefixo do conector no nome do lago | fica | `copyPrefixOf`, `C/packages/connectors/src/kernel/copy.ts:16-18` | Nekt, "`hubspot_deals`" (`NK:12217-12218`); `AP .../Mapper.kt:171-179` | nativo | — | não precisa | U3, U4, U8 | — (`lakeNameOf` em `kernel/tables.ts`) |
| 11 | O adaptador: do kit a um leitor Singer, um só | fica | nenhum; o laço mora no Hub, `C/apps/server/src/hub/copies/source-pass.ts:194-212`, `hub/connectors/copy-port.ts:243-315` | `TRM tap.py:455`, `:506-540`; `CDK .../concurrent_declarative_source.py:165` | remendo: TypeScript que fala Singer, porque o kit é TypeScript (0074) | 344 linhas, duas classes, 34 e 24 testes da bateria do singer-sdk 0.54.9 (estudo) | 0071 | U4 | `apps/extraction/tap/src/tap.ts` |
| 12 | A sessão do kit, no Hub e na tarefa: reusar, renovar antes do fim, deslogar | fica; vai para a etapa do conector | `C/apps/server/src/hub/connectors/limits.ts:127`; `read.ts:109-115`, `check.ts:43-48` | `singer-sdk@0.54.9 singer_sdk/authenticators.py:526-527`, `:609-619` | remendo: a peça é do kit | A P2: 87 linhas, 4 renovações em 100 s, nenhuma sessão pendurada; o autenticador lido no singer-sdk 0.54.9 | 0077; A do conector | U16 | `packages/connectors/src/kernel/session.ts` |
| 13 | A classe da credencial, compartilhável ou exclusiva | fica; vai para a etapa do conector | nenhum | nenhuma faz como dado | remendo | O Sankhya: o token vence aos 300 s em uso, e duas sessões convivem (`docs/decisions/0077-how-a-credential-reaches-the-copy-task.md`) | 0077 | U16, U8 | — (muda `kernel/auth.ts`) |
| 14 | O número exato, do provedor ao lago | fica; o leitor vai para a etapa do conector | `C/apps/server/src/hub/connectors/wire.ts:71`; `kernel/list.ts:53-62` | `JSON.parse` com `context.source`, do Node 24; `singer-sdk@0.54.9 singerlib/json.py:40-44`; `DLT dlt/common/arithmetics.py:18-19` | nativo nas pontas; embrulhado no meio | `1234567890123.123456` igual em `decimal(38,9)` (estudo, `numero-exato.txt`) | 0071; T.4 | U16, U5 | `packages/connectors/src/kernel/exact-json.ts` |
| 15 | O gravador: só acrescenta na bruta, em Iceberg | fica | nenhum | `singer-sdk@0.54.9 target_base.py:479-492`, `sinks/core.py:135`, `:475-506`; `pyiceberg@0.12.0 table/__init__.py:1705-1724`, `:1123-1158` | embrulhado | 165 linhas, 183 e 230 linhas gravadas, soma igual (estudo). Não provado no `S3 Tables`: L.1 | 0071 | U5 | `apps/extraction/src/conexus_extraction/target.py` |
| 16 | A marca da passada inteira | fica | `_pass`, `C/apps/server/src/platform/copy-sql.ts:287-301` | `singer-sdk@0.54.9 target_base.py:430-448`, `sinks/core.py:723-736`; `AP .../CatalogGenerationSetter.kt:36-47` | embrulhado | Local (estudo); na AWS, a fase 4 | 0080 | U4, U5 | — |
| 17 | O projeto do Meltano e o comando da rodada, com as tabelas escolhidas | refeita (uma rodada leva as tabelas marcadas) | nenhum | `meltano@4.4.1 meltano/schemas/meltano.schema.json:335-337`; `core/plugin/singer/tap.py:147` (a seleção), `:211-214`; `cli/run.py:48-126`, `:297-311` | nativo | A P1: 30 tabelas numa tarefa, 180 s (0076) | G | U5 | `apps/extraction/meltano.yml` |
| 18 | A cópia por ligação: as tabelas marcadas e um intervalo; uma rodada aberta por ligação | refeita | `copies.copy` uma por tabela, com o relógio dela: `C/apps/server/src/hub/copies/tables.ts:39`, `C/apps/server/src/builder/copy-clock/clock.ts:14-25`; `copy_run_open_key`, `tables.ts:139` | Nekt: `trigger` da source, `sync_type` por tabela (`NK:20874-20897`, `NK:140802`); `AP .../schema_dump.txt:194-217` | nativo (a seleção do `meltano run`) | A P1, 30 tabelas, 180 s (0076); os fechadores da P3 | G (b) | U7, U8 | `apps/server/src/hub/copies/lake-tables.ts` |
| 19 | Escolher o que copiar, na página da ligação, nada marcado | refeita (sai de Dados) | `C/apps/web/src/hub/copies/new-copy.tsx:66-118`; a ligação, `C/apps/web/src/hub/connectors/connection-page.tsx:275` | `AP .../CatalogConverter.kt:389-397`; Nekt, `NK:7341-7346`, `NK:12200-12202` | embrulhado (a página da ligação de hoje, uma seção) | — | K2, 2026-11-19 | U8, U9 | `apps/web/src/hub/connectors/lake-tables.tsx` |
| 20 | O "Onde guardar" e a marca **No lago** | sai do cartão | nenhum no main | nenhuma guarda a mesma tabela em dois lugares por escolha da pessoa | nativo, ao sair: um lugar só | — | Fundador, 2026-11-23 | nenhuma | — |
| 21 | O disparo | fica, por ligação | `C/apps/server/src/builder/copy-clock/clock.ts:12-25`; `hub/copies/run.ts:41-47` | `@aws-sdk/client-ecs@3.1175.0 dist-types/models/models_1.d.ts:3243-3343`, `:2858`; `AP .../ConnectionManagerUtils.kt:286` | remendo, do 0076 | A P3, 22 testes; a P4, 19 cenários na AWS; `@aws-sdk/client-ecs` 3.1175.0 | 0076; G | U8 | `apps/server/src/hub/copies/lake-run.ts` |
| 22 | O fim: o resultado e a parada numa fila; a varredura | fica | `ended`, `C/apps/server/src/hub/copies/run.ts:116-165` | a regra do EventBridge até a fila (P4); `@aws-sdk/client-sqs@3.1175.0 dist-types/models/models_0.d.ts:1373` | remendo, do 0076 | A P4 na AWS, aviso em 23,6 s na mediana. Não provado com o Meltano 4.4.1: L.3 | 0076 | U5, U8 | `apps/server/src/hub/copies/lake-queue.ts` |
| 23 | O segredo da rodada dentro da tarefa | fica | security S31, `C/docs/guides/security.md:120-125` | `meltano@4.4.1 core/plugin_invoker.py:276`; 0077 | embrulhado | O que o Meltano exporta (estudo); a P4 | 0077 | U5, U8 | `apps/extraction/src/conexus_extraction/entry.py` |
| 24 | A imagem da tarefa e quem a publica | fica | a imagem do Hub vai ao `ghcr.io`, `C/.github/workflows/publish.yml:73-110` | a imagem da P1: `python:3.13-slim`, Meltano 4.4.1, x86 | nativo | Não provado: Node e Python juntos: L.1 | 0074 | U5, U6 | `apps/extraction/Dockerfile` |
| 25 | A rede da tarefa até o sistema | fica | nenhum | as provas: sub-rede pública, IP público, sem NAT | nativo | Não provado: o Sankhya do fundador de dentro da AWS: L.2 | T.6 | U6 | `infra/aws/lib/copy.ts` |
| 26 | A plataforma da cópia: fila, tarefa, imagens, regra, rede | fica | nenhum | `aws-cdk-lib@2.278.0` `aws-ecs/lib/fargate/fargate-task-definition.d.ts`, `aws-sqs/lib/queue.d.ts`, `aws-events/lib/rule.d.ts`, `aws-ecr/lib/repository.d.ts` | nativo | À mão, `conexus-lab-trilho/fases2a4/plataforma.py:80-90` | 0073, 0076 | U6 | `infra/aws/lib/copy.ts` |
| 27 | A receita muda: o papel que escreve, as três travas, os lagos já criados | fica | `C/infra/aws/lib/platform.ts:114-123`, `:127`, `:139-144`; `preparation.ts:209-262`; `hub.ts:14-20` | 0073: "A change to every company is one `UpdateStack` each" | nativo | Não provado: o papel dentro da pilha, L.6 | E; T.5 | U6 | — |
| 28 | A camada atual: o atualizar, um caso por instrução | fica | nenhum | `AB .../JdbcSqlGenerator.kt:219-238`; `DLT dlt/destinations/sql_jobs.py:1120-1139` | remendo, do 0080 | 449 de 449 tabelas com diferença zero; a forma do airbyte 2.0.0 (`AB`) lida; o `MERGE` de dois casos falha de ~230 a ~337 colunas, o de um caso passa com 450 (`EST/achados-auditoria:49`, `:321`). Não medido na `TGFCAB` real: L.7 | 0080 | U10 | `apps/extraction/src/conexus_extraction/update.py` |
| 29 | O histórico da bruta | fica | nenhum | nenhuma faz a limpeza: na Nekt o histórico é um módulo opcional por tabela (`NK:8635`); o Airbyte guardava tudo; o `S3 Tables` guarda 120 h de fotos | remendo (a limpeza) | Não provado: L.7 (`docs/decisions/0080-copy-declared-per-table-raw-appends.md`) | A | U10 | — (em `update.py`) |
| 30 | Onde fica o ponto de parada | fica | `C/apps/server/src/hub/copies/tables.ts:274-312` | `meltano@4.4.1 core/plugin/singer/target.py:100-120`; `core/state_store/filesystem.py:45`, `:191-228` | nativo | Local, em arquivo. Não provado no `S3`: L.4 | T.1 | U10 | — (muda `meltano.yml`) |
| 31 | A página Dados: lista, Visão geral, Colunas, Rodadas | refeita: a de hoje sai na parte 0 e a nova lê as tabelas do lago | `C/apps/web/src/hub/copies/` (3.389 linhas sem os testes); `copy-detail.tsx:105-109`, `:170-305`; `text.ts:88-89` | `AP .../locales/en.json:1088-1094`, `:577-578`; Nekt, `NK:22429-22431`; a captura `cloud-status-page.png` | embrulhado | As capturas do estudo | NT3; não precisa | U14, U8, U9 | `apps/web/src/hub/copies/lake-list.tsx`, `lake-detail.tsx` |
| 32 | Apagar o lago que tem tabela | fica | `C/apps/server/src/platform/aws.ts:279-296`; a AWS recusa a área com tabela (`C/docs/steps/trilhas/dados.md:78-80`) | `@aws-sdk/client-s3tables@3.1175.0` `ListTablesCommand.d.ts`, `DeleteTableCommand.d.ts` | nativo | Não provado: L.8 | o cartão da etapa 1 | U6, U8 | — |
| 33 | O login da empresa lê a linha do lago | fica | `C/apps/server/src/hub/lake/tables.ts:48-56`: só o operador | `GRANT SELECT (colunas)` e `CREATE POLICY` do PostgreSQL | nativo (data D10, D11) | — | H | U7 | a migração da U7 |
| 34 | O aviso de cópia parada | refeita (a parada é da ligação); as duas tabelas sem uso saem na parte 0 | três tabelas sem uso, `C/apps/server/src/hub/notifications/tables.ts:154-234`; o e-mail, `mail.ts`, `automation-email.tsx` | `AP .../JobsHandler.kt:55-76`; `AP .../application.yml:434-437`; Nekt, `NK:12403-12404`, `NK:22357-22360`; nenhuma manda lembrete | remendo: um aviso por parada e um lembrete por dia | Lido no airbyte-platform 2.0.0 (`AP`): nenhum lembrete nos dois módulos de aviso | C; fundador, "R1 a R2 a" | U15, U11, U12 | `apps/server/src/hub/notifications/copy-stop.ts` |
| 35 | A lista de e-mails que recebe o aviso | fica | `alert_recipient`, `C/apps/server/src/hub/notifications/tables.ts:153-172`, sem rota nem tela; `C/docs/reference/telas.md:311` | Nekt, `NK:22357-22360` | embrulhado | — | I | U13 | `apps/web/src/hub/identity/alert-recipients.tsx` |
| 36 | O esquema `sync`, os logins `conexus_sync`, `conexus_read` e os por papel, e a D4 | sai na parte 0 (NT3) | `C/packages/hub-api/src/app-login.ts:30-40`; `C/apps/server/src/platform/copy-reader.ts:51-82` | PostgreSQL `DROP SCHEMA ... CASCADE` e `DROP ROLE` | nativo | — | D (a); NT3 | U14 (o código); o reajuste, passo 4 (as empresas) | — |
| 37 | As gravações das formas nativas | fica | 33 gravações em `C/apps/server/src/platform/recordings/aws/` | testing T14 e T29, `C/docs/guides/testing.md:57-70`, `:85-91` | nativo | Faltam: `RunTask`, a fila, o parâmetro, o Athena | — | U5, U8, U10 | `apps/server/src/platform/recordings/aws/ecs-*.json` e os outros |
| 38 | O método para Python | fica | nenhum | não estudado | nativo | — | 0074 | fica de fora: a mudança de método antes da construção | — |
| 39 | O nome técnico de uma tabela recomendada | nova | `modelCopyName` e `copyPrefixOf` (`C/apps/server/src/hub/copies/naming.ts`; `C/packages/connectors/src/kernel/copy.ts:16-18`); a versão anterior deste cartão: `sankhya_tgfcab` | Nekt Protheus, ERP brasileiro por API sobre as tabelas, mesma situação: `SC5` vira `sales_orders`, com "SC5 - Pedidos de Venda" ao lado (`NK:177792-177806`); Nekt TOTVS RM, `movements` para a `TMOV` (`NK:178492`); o nome não muda depois de criado (`NK:12220`) | embrulhado: o nome no kit, sobre o `stream` do Singer | — | NT1, NT2, NT4 | U3, U4, U8 | — (em `kernel/tables.ts` e `sankhya/copy-tables.ts`) |
| 40 | O nome de uma tabela que o kit não declara | nova | nenhum | Nekt TOTVS RM, `dataserver_<name>` (`NK:178310`), mesma situação; Nekt Dynamics F&O, a entidade em snake_case (`NK:64505`) | nativo: o código da fonte | — | NT1 | fica de fora: etapa 6 (a regra está decidida) | — |
| 41 | A origem ao lado do nome | nova | nenhum | Singer: `table_name` no catálogo (`singer-sdk@0.54.9 singer_sdk/singerlib/catalog.py:310-324`, `:342`), que o SDK preenche só nos conectores de banco (`sql/connector.py:1081`; um fluxo de API escreve `None`, `streams/core.py:671`); Nekt, "SC5 - Pedidos de Venda" na doc (`NK:177792-177806`) | embrulhado: o adaptador escreve `table_name` com a origem | — | não precisa | U4 | — (em `tap.ts`) |
| 42 | O rótulo e a descrição da tabela | nova | o `label` do `CopyModel` e a `description` da v1 (`C/packages/connectors/src/kernel/copy.ts:66-79`, `:184`) | Nekt: "Add descriptions to tables and important fields" (`NK:405`); a doc de cada conector descreve cada fluxo (Protheus, `NK:177812`); Airbyte e Singer não têm descrição de tabela (`AP .../AirbyteStream.kt:35-52`) | embrulhado: do kit para as recomendadas, da `DESCRTAB` para as outras | — | não precisa | U3, U8, U9 | — |
| 43 | O nome e a descrição das colunas | nova | os nomes da consulta do modelo (`C/packages/connectors/src/sankhya/copies.ts:135-147`) | Nekt Protheus: "Column names are the Protheus field names in lower case" (`NK:177778`), mesma situação | nativo: o `TDDCAM` no `--discover` | Medido antes no dublê (`EST/descoberta-catalogo:75-80`) | D4 de 2026-11-19 | U3, U4 | — |
| 44 | Agrupar as tabelas | nova | `subjects` das operações (`C/packages/connectors/src/sankhya/operations/index.ts:68-75`) | Nekt: pasta "by source, business domain" (`NK:76`); Airbyte agrupa por namespace (`AP .../streamUtils.ts:95-106`) | embrulhado: o `group` da tabela usa os assuntos do kit | — | não precisa | U3 | — |
| 45 | Duas ligações do mesmo sistema | nova | `copies.copy_source`, uma cópia lendo várias contas (INV §2.1) | Airbyte: um prefixo por conexão (`AP .../Mapper.kt:171-179`) e "Don't configure more than one Airbyte connection to sync to the same destination stream"; Nekt: uma fonte por conta (`NK:131385`), o nome por fonte (`NK:177751`); Fivetran: um esquema por conexão (`EST/n5-duas-ligacoes`, seção 2) | embrulhado: uma tabela por ligação, `<conector>_<ligação>_<tabela>` para a segunda | — | NT5 | U8 (a recusa e a regra escrita); a gravação do nome na etapa 5 | — |
| 46 | A definição única do conector | refeita | `C/packages/connectors/src/kernel/definition.ts:42-71` | Nango `e6c6131`, situação diferente: funções num executor (`EST/kit-vs-nango-study`, `EST/kit-nango:113-117`); "Um tap Singer é só um segundo executor das mesmas funções" (`EST/kit-nango:116`) | embrulhado (herdado, decidido) | Os 198 testes do kit (`EST/conector-estilo-novo-estudo`, seção 5) | 0056, 0069, 0071 | U16, U17, U18 | — |
| 47 | As leituras como ferramentas | fica | `C/apps/server/src/builder/connectors/typed-reads.ts:27-35`; `C/apps/server/src/builder/company-tools/search.ts:28-43` | `@mastra/core@1.83.0` `ToolSearchProcessor`, "gives the agent two meta-tools (`search_tools` and `load_tool`)", com `filter` por pedido; Nekt `discover_live_tools` e `run_live_tool` | nativo | — | não precisa | fica (a U17 e a U18 provam que as pastas novas as mantêm) | — |
| 48 | A escrita com o cartão | fica | `C/apps/server/src/hub/connectors/write.ts`, `write-record.ts`, `approval.ts` | `@mastra/core@1.83.0` `requireApproval` (`reference-tools-create-tool.md:79-81`), mesma situação; Nekt, "your agent confirms", situação diferente: quem confirma é o agente | embrulhado (o registro é nosso) | A etapa 24.5, fechada | 0062; e245 | fica (a U17 prova `lancarPedido`) | — |
| 49 | O Caderno | refeita: pede o sim; sai na etapa do Negócio | `C/apps/server/src/hub/connectors/notes.ts`; `C/apps/server/src/builder/connectors/connector-tools.ts:307-333` | Nekt: o agente "will typically offer to save a context document", e a pessoa aceita (`EST/ao-vivo-estudo:114`), situação diferente: a Nekt guarda o roteamento, e não um significado que todos os agentes usam | nativo: o `requireApproval` do Mastra para a ferramenta, como na escrita | — | 0064 (`:30`); B do conector | U19 | — |
| 50 | A skill do conector | refeita em parte | `C/packages/connectors/src/kernel/skill.ts`; `sankhya/skill/SKILL.md` à mão, que diz "There is no operation that writes" (`:14`) contra `lancarPedido` (`sankhya/operations/index.ts:62`) | Nekt: os nomes das ferramentas "can change, so an agent should resolve them at run time rather than hardcoding them into a skill" (`NK:12598-12600`), mesma situação | embrulhado: a parte gerada da definição, a escrita guarda o saber | O defeito lido | técnica (T.25) | U16, U17, U18, U3 | — (muda `kernel/skill.ts`) |
| 51 | A janela Ligar em quatro passos, a descrição do sistema e o link de 30 minutos | refeita, numa etapa própria | `C/apps/web/src/hub/connectors/link-dialog.tsx:272` | Nango `connect_link`, 30 minutos (spec 02, `design.md:48`), mesma situação | embrulhado | — | spec 02 (`C1`, `C4`, `C5`), aprovada no escopo | fica de fora: a etapa própria logo depois desta (T.23) | — |
| 52 | A segunda forma, pelo servidor MCP do fornecedor | fica de fora | nenhum; `@mastra/mcp` não instalado | AWS AgentCore Gateway, Nekt, Databricks (`EST/registro-vs-lago-e-ao-vivo:505-512`) | embrulhado, na etapa própria | — | `C1` (a), `C2` (a) de 2026-11-21 | fica de fora: a etapa "A ferramenta ao vivo, por pessoa e por MCP" | — |
| 53 | As pastas do Sankhya e do Mercado Livre | refeita do zero | `C/packages/connectors/src/sankhya/`, `mercado-livre/` (INV §1.3, §1.4) | A Nekt tem Protheus, RM, Omie e Mercado Livre feitos por ela (`EST/connector-catalog-study:156`); nenhuma referência tem o Sankhya | embrulhado: a forma do kit | Os testes de hoje pela porta pública, sem mudar o que esperam | A do conector | U17, U18 | — (as mesmas pastas, escritas de novo) |
| 54 | As peças do Hub que já são o decidido: o executor, o envio, o teto, o login por autorização, **Testar**, o funil de escrita, o app e a ferramenta em código lendo ao vivo | fica | `C/apps/server/src/hub/connectors/executor.ts`, `send.ts`, `read.ts`, `sign-ins.ts`, `connections.ts`, `testing.ts`, `check.ts`, `app-calls.ts`, `tool-door.ts` | 0056, 0057, 0058 (herdado); "O funil de escrita do Conexus é mais completo que o de qualquer plataforma de ferramentas lida" (`EST/registro-vs-lago-e-ao-vivo:487`) | embrulhado (herdado, decidido) | O CI do `main` | A do conector | fica (a U16 muda só a sessão e o número exato nelas) | — |
| 55 | A Fábrica de conectores | fica de fora | nenhum | — | embrulhado, na etapa do TOTVS | "Not proved" (`C/docs/decisions/0069-connectors-one-source-the-kit.md:29`) | A do conector: provada no TOTVS | fica de fora: a etapa do TOTVS | — |

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
| T.6 | A tarefa em sub-redes públicas, IP público, sem NAT; x86; 2 vCPU | A forma medida: 30 tabelas em 180 s com 2 vCPU, 588 s com 1 (P1) | Trocar a sub-rede e a arquitetura na definição |
| T.7 | O gravador sobre a base do singer-sdk | A base já dá o laço, o lote, o estado depois de gravar, as colunas `_sdc_*` e o decimal | Voltar ao laço escrito à mão das provas |
| T.8 | O `clientToken` é a rodada e a tentativa, até 64 caracteres; o `startedBy` leva a rodada | O limite de 36 é de `StartTask` (`@aws-sdk/client-ecs@3.1175.0 dist-types/models/models_1.d.ts:3315`, `:3330`, `:3407`) | — |
| T.9 | Um cartão em cinco partes, cada uma usada pelo fundador, e não cinco cartões | O total, ~16.500, passa a delivery L2 ("should"). Mas ~8.000 são linhas tiradas na parte 0, nenhum pull request de construção passa de ~4.000, e cada parte é usada sozinha (a maior com código novo, a parte 1, ~3.990), que é o que a L2 pede de um lote. As decisões valem para as cinco, respondidas juntas em 2026-11-23 | Dividir o arquivo em cartões, com as mesmas unidades; os gatilhos estão no orçamento |
| T.10 | O adaptador mora em `apps/extraction/tap/`, um pacote TypeScript do espaço de trabalho, ao lado do projeto Python | A trilha diz que `apps/extraction/` guarda "o tap gerado do kit" (`C/docs/steps/trilhas/dados.md:135-136`) | Mover para `packages/` |
| T.11 | O parâmetro da rodada leva a especificação inteira (`CopyTaskSpec`), no nível padrão, até 4 KB; as colunas não vão nele, a tarefa as descobre | Um lugar só para o que a tarefa recebe, cifrado; as colunas de uma tabela larga não cabem em 4 KB | Passar a especificação pelo ambiente da tarefa e só o segredo pelo parâmetro |
| T.12 | Uma rodada aberta há mais de 6 horas é fechada pela varredura como `COPY_TASK_LOST` | A primeira carga não foi medida; 6 horas é teto de folga (code C26), e o critério 26 mede a primeira | Mudar a constante |
| T.13 | Os códigos novos: de rodada, `COPY_LAKE_UNAVAILABLE`, `COPY_TASK_LOST`, `COPY_LAKE_WRITE_FAILED`; de marcar, `COPY_LAKE_NOT_READY`, `COPY_RUN_OPEN`, `COPY_NAME_TAKEN`, `COPY_TABLE_NOT_DECLARED` | Cada um tem uma frase diferente na tela e um dono diferente | Fundir códigos |
| T.14 | A mensagem que falha três vezes vai à fila de mortos, lida só pelo firstmate | A forma da P4; um fim perdido é fechado pela varredura | Mudar o `maxReceiveCount` |
| T.15 | O lembrete sai às 8h de São Paulo, o fuso dos relógios das cópias (`clock.ts:11-12`) | Nenhuma referência manda lembrete; o fundador disse "um lembrete por dia" sem hora | Mudar a constante |
| T.16 | Um nome por empresa: a mesma tabela de uma segunda ligação do mesmo sistema é recusada (`COPY_NAME_TAKEN`) até a etapa 5 | A regra do nome da segunda ligação está decidida (NT5: `<conector>_<ligação>_<tabela>`), mas o corte do trecho da ligação não foi provado (`EST/n5-duas-ligacoes`, seção 5), e o Lago 2 tem uma ligação do Sankhya só; a etapa 5 é a primeira com duas lojas e decide qual ligação fica com o nome sem o trecho (a primeira a existir, pelo estudo, ou a primeira a marcar a tabela, como este cartão faz) | Gravar o nome da NT5 já nesta etapa, com o corte |
| T.17 | Sem a passada inteira de domingo: a rodada é inteira só na primeira vez, quando o estado se perdeu e numa tabela sem coluna de alteração | A passada de domingo existe só porque o motor de hoje a tinha (`clock.ts:24-25`); o que sumiu da fonte é a pergunta da etapa 7 | Um relógio semanal da ligação com `whole` |
| T.18 | Desmarcar com a rodada aberta é recusado (`COPY_RUN_OPEN`), em vez de parar a rodada das outras tabelas | Uma rodada leva as tabelas da ligação (G); parar uma para tirar outra perde a carga das que ficam | Parar a tarefa e reabrir a rodada sem a tabela |
| T.19 | A linha do lago em `ready` é relida da AWS antes de marcar a primeira tabela de uma empresa, pelo estado da pilha | É a primeira etapa que usa o lago, e a trilha manda escolher quando reler (`C/docs/steps/trilhas/dados.md:84-88`); reler antes de agir é a forma do exemplo serverless da AWS | Reler por um relógio |
| T.20 | As tabelas das cópias de hoje saem num pull request próprio, o G0c, depois de a versão do G0b estar no ar | Um `DROP` só entra quando nenhum código no ar lê a tabela (data D6), e a mudança de permissões vai num pull request só dela, com a palavra do fundador (data D11). A NT3 manda tirá-las na parte 0 | Deixar as tabelas vazias até a etapa 4 |
| T.21 | A etapa O conector no padrão novo é uma seção deste cartão, com os seus grupos, critérios e passos do roteiro, e não um cartão próprio; o roteiro da trilha a nomeia como etapa | `docs/steps/` guarda um cartão por trilha (delivery L5), e a etapa fica entre a parte 0 e a parte 1 desta: um cartão próprio pararia este no meio da construção, e a L1 pede uma etapa em construção por trilha. As decisões A, B e C do conector e as NT1 a NT5 valem para as duas, respondidas no mesmo dia | Tirar a seção para um cartão próprio, num rascunho, com as mesmas unidades |
| T.22 | O esquema `sync` e os logins de cada empresa saem pelo firstmate, com a palavra do fundador, no passo 4 do reajuste, e não por código do Hub | A U14 tira todo código que abre esses logins. Um código que os tirasse teria de abrir o banco de cada empresa ao subir, contra a data D27, e só roda uma vez. A forma é a da consulta do reajuste, que o firstmate já roda, e cada instrução tem `IF EXISTS` | Uma rota do operador na Central que faça o mesmo por empresa |
| T.23 | A recomendação da decisão L: a janela Ligar em quatro passos, a descrição do sistema e o link de 30 minutos (spec 02, `C1`, `C4`, `C5`) saem da etapa do conector e vão para uma etapa própria, logo depois deste cartão. É mudança de escopo do que o fundador aprovou, por isso é dele (delivery L7) | O passo "o que copiar" da janela é a seção **Tabelas no lago**, que só nasce na U9; o estudo do ao vivo já dizia que a janela sai da etapa se ela passar do teto (`EST/ao-vivo-estudo:187`); nada do lago precisa dela | Pôr a janela na parte 1, depois da U9 |
| T.24 | A lista e a página de uma tabela em Dados são escritas de novo sobre um contrato novo (`LakeTableSummary`, `LakeRun`), e não sobre o `CopySummary` | O contrato das cópias sai com as tabelas dele na parte 0 (NT3), e nenhum código pode ler uma tabela tirada (data D6) | Manter o contrato das cópias até a parte 1 e tirar as tabelas depois da U8 |
| T.25 | A skill de cada conector tem uma parte gerada da definição (os assuntos, se escreve, as tabelas) e uma escrita à mão (o saber); nenhuma das duas nomeia ferramenta | A frase escrita à mão se desencontrou da definição (`C/packages/connectors/src/sankhya/skill/SKILL.md:14` contra `operations/index.ts:62`); a Nekt manda achar as ferramentas na hora (`NK:12598-12600`) | Voltar ao texto à mão |
| T.26 | O sim do Caderno vem pelo cartão de aprovação da conversa, e quem aprova precisa gerenciar ligações (`manageConnections`), conferido na mesma transação da gravação | É a regra que `notes.ts` já usa para o Assistente (`C/apps/server/src/hub/connectors/notes.ts:71-80`), agora sobre quem aprova; o cartão é o da escrita (e245) | Aprovar pela página da ligação, fora da conversa |
| T.27 | Os dublês e as gravações do Sankhya e do Mercado Livre ficam e não são reescritos com as pastas; mudam só onde um critério pede (o 15, o 16 e a `TGFCAB` larga da U3) | São a prova de que a pasta nova se comporta como a de hoje; reescrever os dois juntos não provaria nada | Reescrever os dublês num pull request depois |
| T.28 | O GC1 leva as peças do kit (U16) e o Sankhya (U17) num pull request só; o GC2, o Mercado Livre; o GC3, o Caderno | Um pull request por conector (C do conector); a sessão, a classe e o número exato nascem com o primeiro conector que os usa (code C75) | Separar a U16 num pull request próprio (o gatilho do orçamento) |
| T.29 | Na parte 1, o intervalo da ligação oferece só 24 h; a U10 abre os de 15 min a 24 h | Antes da U10, cada rodada é uma passada inteira, que a bruta guarda ao lado da anterior (o gravador só acrescenta, linha 15), e relê a tabela inteira no Sankhya do fundador. Uma vez por dia limita as duas coisas até a parte 2, que lê só o que mudou e limpa as passadas antigas (critério 59) | Abrir todos os intervalos já na parte 1 |

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
  que `hub/data/test-world.ts:17`, `:63` planta; nenhum código novo a escreve, e ela sai com a tabela
  na etapa 4.
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
  `takeReadAway` (`leave.ts:86-195`), `copiesOf` e `leave` de `service.ts:104-106`, e a chamada em
  `hub/connectors/rows.ts:51-55`; `hub/connectors/connection-copies.ts` sai com a lista "o que some"
  do diálogo de Desligar que só ela alimenta.
- **Linha 7.** `deleteCopy` e `dropEndedCopies` (`leave.ts:196-300`) saem com a rota; o reajuste já
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
  `database-grants.sql`. Fica `notifications.alert_recipient`, que a U13 usa. O esquema `copies`
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
| 7 | A descrição do sistema | Entra numa etapa própria | T.23 |
| 8 | A janela Ligar em um passo | Refeita numa etapa própria | T.23 |
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

- **Linha 49.** Ler `C/apps/server/src/hub/connectors/notes.ts` (`save`, que já confere
  `manageConnections` com `manage`; `provedAndSaved`), `C/apps/server/src/builder/connectors/connector-tools.ts:307-333`
  (`noteSaveTool`) e `builder/company-tools/factory.ts:132-137` (quem recebe a ferramenta). Seguir a
  escrita com o cartão: `builder/agents/tools.ts:188-230` (`requireApproval`, `approvedCallOf`) e
  `hub/connectors/approval.ts` (`mayApprove`). `@mastra/core@1.83.0`, `requireApproval`: "Input is
  validated against inputSchema first: if it is invalid, the validation error is returned to the model
  and no approval is requested" (`reference-tools-create-tool.md:79`).
- **A decisão.** 0064 (`:30`): as anotações viram propostas e o Caderno sai, na etapa do Negócio.
  Até lá, gravar pede o sim (B do conector).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/connectors/connector-tools.ts` | Muda: `requireApproval` na ferramenta; o `execute` grava com quem aprovou | o Assistente e o Builder |
| `apps/server/src/builder/conversation/` | Muda: a aprovação de `connector_note_save` confere `manageConnections` de quem aprova | a rota de aprovar |
| `apps/server/src/hub/connectors/notes.ts`, `packages/hub-api/src/project-connections.ts` (`ConnectionNote`) | Muda: `approvedBy` | a tela |
| `apps/web/src/builder/conversation/` (o cartão), `apps/web/src/hub/connectors/notes.tsx`, `text.ts` | Muda: o cartão do Caderno; "Aprovada por" | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/connectors/notes.ts — the stored note gains who approved; a note from before reads as null
approvedBy: z.string().nullable().default(null)
// packages/hub-api/src/project-connections.ts — ConnectionNote gains
approvedBy: z.string().nullable()   // the approver's name; null: "Gravada sem aprovação"
```

- **Quem aprova**: um membro com `manageConnections`, conferido na transação da gravação (T.26); uma
  recusa é `NOT_GRANTED`, com o motivo só no registro (S8, S10).
- **O cartão**: o da escrita (`approval-card.tsx`), com o título "Gravar no Caderno?" e as frases da
  matriz em `approval-text.ts` (C26).
- **O arquivo modelo**: `builder/agents/tools.ts`, `writeTool` (C21: a resposta por `kind`).

### As skills e a leitura

As linhas de `@mastra/core` e `react` do `stack.md`: a skill `mastra`. A security S8 e S10.

### A ordem do trabalho

1. **A ferramenta pede o sim.** Critério: 83.
   - **Mutações à mão:** `requireApproval: false`: o 83 fica vermelho.
2. **Quem aprova e o que fica gravado.** Critério: 84.
   - **Mutações à mão:** conferir `manageConnections` de quem pediu, e não de quem aprova: o 84 fica
     vermelho.
3. **A tela.** Critério: 84.

### Como se prova

Por uma conversa do Assistente com as gravações do Mastra de aprovação (`platform/recordings/mastra/approval*.jsonl`)
e um PostgreSQL local; pela tela com o Hub falso. Hoje o 83 falha: a ferramenta grava sem pedir.

### Parar se

- Uma unidade da trilha Agentes e Apps está nesses arquivos (delivery L1): espera.
- A aprovação de hoje não distingue a ferramenta e pediria mudar a rota de aprovar para todas.

## GC3 O ponto de conferência

Depois da U19: os testes do Hub, do Builder e da tela; o Hub local com o dublê do Sankhya: uma
anotação aprovada, uma recusada, a página da ligação; a QA. Na nuvem, o firstmate faz o passo 4 do
roteiro antes de chamar o fundador.

## U3 O kit declara as tabelas

**Base e modelo.** A etapa do conector usada. Opus: a declaração é o contrato entre o kit, o Hub e o
adaptador, e nasce desenhada para as duas origens, a tabela e a leitura que pagina.

### As linhas da tabela

- **Linha 8.** A declaração de cada tabela: 0080 (`C/docs/decisions/0080-copy-declared-per-table-raw-appends.md:10-13`,
  a descoberta "por um gancho ou por uma lista declarada"); a forma por tabela da Nekt
  (`NK:20888-20897`); o tamanho de página como dado da declaração, com padrão
  (`CDK .../declarative_component_schema.yaml:2244-2271`). A forma escrita do zero é a de
  `EST/conector-estilo-novo-estudo:295-322`.
- **Linhas 39, 42, 44.** O nome de negócio, o rótulo, a descrição e o grupo: Nekt Protheus
  (`NK:177792-177806`), o nome fixo depois de criado (`NK:12220`), "Add descriptions to tables"
  (`NK:405`), a pasta por domínio (`NK:76`).
- **Linhas 9, 43.** O gancho do dicionário: a sonda de `EST/descoberta-catalogo:75-80` (286 linhas, no
  dublê), o que a skill do agente já sabe do dicionário e a porta de consulta da pasta nova do
  Sankhya (U17). O mapa dos tipos do dicionário para o tipo da coluna é o da sonda. As colunas no
  lago levam o nome da fonte em minúsculas (`NK:177778`).
- **Linha 50.** A lista de tabelas entra na parte gerada da skill (`connectorSkill`, U16).
- **Os dublês.** Ler `C/packages/connectors/src/sankhya/fake.ts:226-227` e
  `hubspot/fake-data.ts:13-68`: hoje não deixam mudar um registro. O dublê do Sankhya ganha a `TGFCAB`
  larga, de 450 colunas inventadas, algumas `AD_`, e o dicionário dela.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Cria `tables.ts` e o teste; apaga o que sobrou de `copy.ts` (`CopyDefinition`, que a U14 deixou sem leitor), `list.ts`, `conformance-list.ts` e `list-fixture.ts`; muda `definition.ts`, `conformance.ts`, `skill.ts`, o índice | o adaptador (U4), `hub/copies/` (U8) |
| `packages/connectors/src/sankhya/` | Cria `copy-tables.ts` e o teste; muda `definition.ts`, `fake.ts`, `fake-sales.ts`, o dicionário do dublê | o kit |
| `packages/connectors/src/hubspot/` | Muda: declara a tabela `negocios` por operação; a rota de teste do dublê | o kit |

O `processo` lê um arquivo de `packages/connectors/src/<pasta>/` como da trilha do molde
(`scripts/tracks.ts`, `trackOfFile`); o pull request do G1 responde pelas duas trilhas.

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/tables.ts
/** The lake name after the connector prefix: Portuguese, snake_case, fixed once created (NK:12220; NT1, NT2). */
export const TableName = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/).brand('TableName')
/** A table of the source as the source names it: `TGFCAB`. */
export const SourceTable = z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,59}$/).brand('SourceTable')
export const TableColumn = z.object({ name: z.string(), type: TableColumnType, description: z.string().max(200).nullable() })
export type TableSource =
  | Readonly<{ kind: 'TABLE'; table: SourceTable }>                                    // Sankhya, by the query door
  | Readonly<{ kind: 'OPERATION'; operation: OperationId; input: Readonly<Record<string, string | number | boolean>> }>  // a paged read
export type TableDeclaration = Readonly<{
  name: TableName            // 'notas' -> sankhya_notas
  label: string              // 'Notas e pedidos'
  description: string        // one or two sentences; the screen and the agent read it
  group: string              // a key of the connector's subjects ('vendas')
  source: TableSource
  key: readonly string[]     // the source's key columns, in page order
  changedSince: Readonly<{ column: string }> | null
  columns: { kind: 'DISCOVERED' } | { kind: 'DECLARED'; columns: readonly (TableColumn & { path: string })[] }
}>
export const DiscoveredTable = z.object({ table: SourceTable, description: z.string().nullable(), columns: z.array(TableColumn).min(1) })
export const TablePageInput = z.object({
  table: SourceTable, columns: z.array(TableColumn).min(1), key: z.array(z.string()).min(1),
  changedSince: z.string().nullable(), after: z.array(z.string()).nullable(), since: Instant.nullable(),
  limit: z.int().min(1),
})
export const TABLE_PAGE_DEFAULT = { rows: 500, bytes: 1_048_576 } as const      // 0063's 1 MiB stop rule
export type ConnectorTables = Readonly<{
  recommended: readonly TableDeclaration[]
  page?: Readonly<{ rows: number; bytes: number }>                 // default TABLE_PAGE_DEFAULT
  discover?: Operation<{ tables: SourceTable[] }, { tables: DiscoveredTable[] }, 'read'>
  readTable?: Operation<TablePageInput, TablePage, 'read'>         // required by a TABLE source
}>
/** The one owner of the lake name: the connector's prefix and the declared name (`sankhya_notas`). */
export function lakeNameOf(connector: ConnectorId, table: TableName): string
/** What a source answers when it stops a table's read: the code, never the body. */
export const TABLE_SOURCE_FAILURES = ['COPY_SOURCE_NEEDS_REAUTH', 'COPY_SOURCE_REFUSED', 'COPY_SOURCE_UNREACHABLE', 'COPY_SOURCE_UNREADABLE'] as const
export type TableSourceFailure = Readonly<{ code: (typeof TABLE_SOURCE_FAILURES)[number]; system: Readonly<{ status: number; code: string | null; message: string | null }> | null }>
/** One page of any declared table: a TABLE source through `readTable`, an OPERATION source through the operation's `list` paging. */
export function readTablePage(
  input: Readonly<{ connector: Connector; table: TableDeclaration; columns: readonly TableColumn[]; after: TablePosition | null; session: Session; signal: AbortSignal }>,
): Promise<{ kind: 'PAGE'; rows: readonly Record<string, string | null>[]; next: TablePosition | null } | ({ kind: 'FAILED' } & TableSourceFailure)>
// Connector gains: tables?: ConnectorTables
```

- **Cada estado** como união: `columns` e `source` por `kind` (C21).
- **Cada id** com a sua marca: `TableName` e `SourceTable`, conferidos pela conformidade contra a
  declaração (C23).
- **O dono de cada fato** (C26):
  - a lista recomendada do Sankhya, só em `sankhya/copy-tables.ts`: nesta etapa, `notas`,
    "Notas e pedidos", "Cabeçalho de toda nota e pedido do Sankhya: venda, compra, devolução e
    transferência. O tipo de cada uma vem em TIPMOV.", o grupo `vendas`, a origem `TGFCAB`, a chave
    `NUNOTA` e a alteração `DTALTER`;
  - o padrão da página, em `tables.ts`;
  - a página do Sankhya, na declaração dele, em linhas e bytes: 5.000 linhas, o teto medido do
    gateway (`C/docs/decisions/0080-copy-declared-per-table-raw-appends.md:17`), e 1 MiB, a regra de
    parada da 0063 (`C/docs/decisions/0063-copy-models-proof.md:22`), abaixo do teto de 2 MiB do
    executor (0056);
  - o nome no lago, só em `lakeNameOf`.
- **A leitura de uma página tem um dono**, `readTablePage`, que o adaptador (U4) chama para as duas
  origens. A de operação segue a paginação `list` da operação (`kernel/operation.ts:148-167`,
  `ListPaging`, `ListRead`), escrita de novo aqui; `kernel/list.ts` e `conformance-list.ts` saem.
- **O tamanho do nome**: `lakeNameOf` dá até 60 caracteres (o `LakeTableName` do fio, U7); o prefixo
  mais longo de hoje, `mercado_livre_`, tem 14, e o nome até 40. A conformidade recusa um prefixo
  acima de 20.
- **O esquema de cada entrada externa** (C27): a resposta do dicionário, com Zod, antes de virar
  `DiscoveredTable`; uma coluna de tipo que o mapa não conhece vem como `text`, com o tipo do
  dicionário na descrição.
- **A página em bytes**: o leitor pede `limit` linhas; se a resposta passou dos `bytes`, a próxima
  pede `floor(limit * bytes / tamanho)`, nunca menos que 1; sem teto de colunas.
- **As rotas de teste dos dublês**: `POST /__teste/notas/<id>` no Sankhya e `POST /__teste/negocios/<id>`
  no HubSpot, só no modo dublê (T29).
- **O arquivo modelo**: nenhum declarado; a unidade segue C21, C23 e C26 direto.

### As skills e a leitura

As linhas de `packages/connectors` do `stack.md`. O guia de testes, T5 e T29.

### A ordem do trabalho

1. **A declaração, a leitura de página e a conformidade.** Critérios: 10, 86.
   - **Arquivos:** cria `kernel/tables.ts`; muda `definition.ts`, `conformance.ts`; apaga o resto de
     `copy.ts`.
   - **Testes:** `conformance.test.ts`, "a declaração por tabela".
2. **O Sankhya.** Critérios: 9, 11.
   - **Arquivos:** cria `sankhya/copy-tables.ts`: a lista, `descobrirTabelas` (uma consulta a
     `TDDTAB` e `TDDCAM` pela porta de consulta), `lerTabela` (a página pela porta de consulta da
     pasta nova).
   - **Referência a seguir:** a sonda do dicionário; `EST/descoberta-catalogo:75-80`.
   - **Testes:** `copy-tables.test.ts` com o dublê, a `TGFCAB` larga e uma tabela que o dicionário
     não tem.
   - **Mutações à mão:** tirar a redução da página: a resposta larga passa dos bytes e o 11 fica
     vermelho.
3. **A skill.** Critério: 85. As tabelas entram na parte gerada.
4. **Os dublês.** Critério: 16. O HubSpot declara `negocios` por operação, com as colunas
   declaradas, para a bateria da U4.

### Como se prova

O 9 e o 11 pelo índice do kit contra o dublê; o 10 pela conformidade; o 85 pela skill gerada; o 16
pelas rotas de teste. Hoje nada disso existe.

### Parar se

- O dicionário do dublê não tem a forma da sonda, ou a sonda não trouxe o mapa de um tipo.
- A página do Sankhya de 1 MiB não cabe numa linha larga do dublê: o builder mede e diz ao
  firstmate.

## U4 O adaptador

**Base e modelo.** A U3 e a mudança de método. Opus: é o contrato entre o kit e o Singer, e a 0071 o
quer sem nome de conector.

### As linhas da tabela

- **Linha 11.** Ler o laço de páginas que o adaptador substitui: `C/apps/server/src/hub/copies/source-pass.ts:194-212`
  e `hub/connectors/copy-port.ts:243-315`, no histórico (a U1 os tirou). Seguir `TRM tap.py:455` e
  `:506-540` e `CDK .../concurrent_declarative_source.py:165`. Ponto de partida: a sonda
  `sondas/adaptador-duas-classes/` (344 linhas).
- **Linha 9.** `--discover`: para uma tabela `DISCOVERED`, o gancho do kit; para uma `DECLARED`, as
  colunas da declaração.
- **Linhas 39, 41, 43.** O `stream` é o nome no lago, por `lakeNameOf`; o `table_name` é a origem
  (`singer-sdk@0.54.9 singer_sdk/singerlib/catalog.py:310-324`, `:342`); as colunas, com o nome da
  fonte em minúsculas e a descrição. Toda entrada sai com `selected: false`, porque o singer-sdk marca
  tudo por padrão (`streams/core.py:102`) e a K2 diz nada marcado.
- **Linha 16.** A versão da passada em cada linha e o `ACTIVATE_VERSION` no fim:
  `singer-sdk@0.54.9 singer_sdk/target_base.py:430-448`.
- **Linha 17.** A seleção do catálogo: o Meltano entrega o catálogo com as tabelas escolhidas
  (`meltano@4.4.1 meltano/core/plugin/singer/tap.py:147`); o adaptador lê só as escolhidas.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/extraction/tap/` | Cria: `package.json`, `src/tap.ts`, `src/messages.ts`, `src/tap.test.ts` | a imagem (U5); o `meltano.yml` (U5) |
| `package.json`, `package-lock.json` da raiz | Muda: o espaço de trabalho novo | a CI |

### Os contratos que a unidade cria

```ts
// apps/extraction/tap/src/tap.ts — the command line, Singer's
//   tap --about | --discover --config <file> | --config <file> --catalog <file> [--state <file>]
// config: { connector: ConnectorId, account: AccountRef | null, secret_path: string, result_path: string, whole: boolean }
// apps/extraction/tap/src/messages.ts
export type SingerMessage =
  | { type: 'SCHEMA'; stream: string; schema: JsonSchema; key_properties: string[] }
  | { type: 'RECORD'; stream: string; record: Record<string, unknown>; version?: number }
  | { type: 'STATE'; value: TapState }
  | { type: 'ACTIVATE_VERSION'; stream: string; version: number }
/** What the tap writes to result_path when the source stops it: the kit's code and the table, never a body. */
export type TapFailure = TableSourceFailure & { table: string }   // the lake name of the table it stopped on
```

- **O nome do fluxo** é o nome no lago, de `lakeNameOf` (`sankhya_notas`); o adaptador não monta
  nome. O `table_name` de cada entrada é a origem (`TGFCAB`).
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

1. **`--about` e `--discover`.** Critério: 17. Do índice do kit, para cada declaração.
   - **Mutações à mão:** deixar `selected` de fora: a entrada sai marcada e o 17 fica vermelho.
2. **A leitura.** Critérios: 18, 19, 86. A sessão do kit (U16), as tabelas escolhidas em ordem, uma
   página por vez pela leitura de página do kit (`readTablePage`, U3), com a página do conector, `STATE` depois de cada página, a versão da passada,
   `ACTIVATE_VERSION` no fim de cada tabela. Uma passada inteira não filtra pela coluna de alteração.
   A recusa da fonte escreve `TapFailure` e sai com código 1.
   - **Testes:** `tap.test.ts` contra os dublês; `test_tap_battery.py` roda a bateria do singer-sdk.
   - **Mutações à mão:** emitir o `STATE` antes do `RECORD` da página: a bateria fica vermelha.
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
   um local nos testes. Regras: C50, C26.
   - **Mutações à mão:** gravar o número por `float`: a soma fica diferente e o 21 fica vermelho.
3. **A entrada.** Critérios: 23, 24, 25. Lê o parâmetro, valida, grava o segredo num arquivo `0600`,
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

- O catálogo REST do `S3 Tables` recusa a forma que o PyIceberg 0.12 manda (L.1).
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
- **O que a parte 2 usa já nasce aqui**, para a U10 não mudar a receita de um lago que já tem dado
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
- A preparação precisa de um poder da Release além das peças do critério 29.

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
| `apps/server/migrations/`, `database-grants.sql`, a foto do catálogo | Cria a migração (só acrescenta); muda as permissões | `migrate`; `apps/server/src/platform/catalog.test.ts` |
| `packages/hub-api/src/lake-copies.ts`, `index.ts` | Cria: os ids e os códigos do fio da cópia | U5, U8, U9, U12 |

### Os contratos que a unidade cria

| Tabela | Coluna | Tipo | Restrição | Ao apagar |
| --- | --- | --- | --- | --- |
| `copies.lake_copy` | `company_id`, `connector_id`, `connection_id`, `interval`, `created_at` | `text`, `text`, `uuid`, `text`, `timestamptz` | chave `(company_id, connection_id)`; `interval` em `LakeInterval`; política da empresa | a ligação (`company_id, connector_id, connection_id`): `cascade`; a empresa: `cascade` |
| `copies.lake_table` | `id`, `company_id`, `connection_id`, `source_table`, `name`, `label`, `columns`, `rows`, `last_run_id` | `uuid`, `text`, `uuid`, `text`, `text`, `text`, `jsonb`, `bigint`, `uuid` | `UNIQUE (company_id, connection_id, source_table)`; `UNIQUE (company_id, name)`; `name` pelo padrão de `LakeTableName`; `columns` um array JSON | a cópia da ligação (`company_id, connection_id`): `cascade`; `last_run_id`: `set null` |
| `copies.lake_run` | `id`, `company_id`, `connection_id`, `started_at`, `ended_at`, `outcome`, `whole`, `code`, `failed_table`, `system_code`, `system_message`, `task_arn`, `attempt` | `uuid`, `text`, `uuid`, `timestamptz`, `timestamptz`, `text`, `boolean`, `text`, `text`, `text`, `text`, `text`, `integer` | `ended_at` e `outcome` nulos juntos; `outcome` em `COMPLETE`, `ERROR`, `INTERRUPTED`; código só com `ERROR`; `system_code` até `SYSTEM_CODE_MAX`; `task_arn` nulo ou `arn:aws:ecs:%`; `attempt >= 1`; índice único `lake_run_open_key` em `connection_id` onde `ended_at IS NULL` | a cópia da ligação: `cascade` |
| `copies.lake_table_run` | `run_id`, `table_id`, `company_id`, `read`, `written`, `rows`, `whole` | `uuid`, `uuid`, `text`, `integer`, `integer`, `bigint`, `boolean` | chave `(run_id, table_id)`; contagens `>= 0` | a rodada: `cascade`; a tabela: `cascade` |
| `lake.company_lake` | — | — | política `select` para o login da empresa, `company_id = <empresa da sessão>`; `GRANT SELECT (company_id, lake_id, state, account, region)` | — |

```ts
// packages/hub-api/src/lake-copies.ts — the wire of the lake copy; hub-api does not import the kit (0056)
export const LakeRunId = z.uuid().brand('LakeRunId')
export const LakeTableId = z.uuid().brand('LakeTableId')
export const LakeTableName = z.string().regex(/^[a-z][a-z0-9_]{0,59}$/).brand('LakeTableName')  // `sankhya_notas`
export const SourceTableId = z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,59}$/).brand('SourceTableId') // `TGFCAB`, the kit's SourceTable
export const LakeInterval = z.enum(['15m', '30m', '1h', '2h', '6h', '24h'])
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

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/aws.ts`, `config-aws.ts`, `test-aws.ts`, `recordings/aws/`, `scripts/` (o roteiro de gravação) | Muda: as portas `CopyTasks`, `CopyQueue`, `LakeTables`, os nomes da U6, as saídas na configuração; os dublês; as gravações | `hub/copies/`, `hub/lake/`, a QA |
| `apps/server/src/hub/copies/` | Cria `lake-copy.ts`, `lake-run.ts`, `lake-queue.ts`, `lake-list.ts`, `lake-routes.ts`, `public.ts` | `hub/connectors/` (desligar), `main.ts` (a subida) |
| `apps/server/src/builder/copy-clock/`, `builder/mastra/hub-mastra.ts`, `conversations-of.ts`, `main.ts` | Cria de novo o relógio da ligação; liga a subida e a remoção da empresa | `hub/copies/` |
| `apps/server/src/hub/lake/lake.ts` | Muda: apagar o lago apaga as tabelas e as cópias do lago | `hub/operations/` |
| `apps/server/src/hub/connectors/` | Muda: desligar a ligação leva a cópia dela | — |
| `packages/hub-api/src/lake-copies.ts`, `failures.ts`, `index.ts` | Muda: as rotas da ligação e de Dados, os códigos de marcar | U9 |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/lake-copies.ts
export const LakeRun = z.object({
  id: LakeRunId, startedAt: z.iso.datetime(), endedAt: z.iso.datetime().nullable(),
  outcome: z.enum(['RUNNING', 'COMPLETE', 'ERROR', 'INTERRUPTED']), whole: z.boolean(),
  read: z.int().min(0).nullable(), written: z.int().min(0).nullable(),
  code: LakeRunFailureCode.nullable(), failedTable: LakeTableName.nullable(), system: SystemMessage.nullable(),
})
export const LakeTablesOfConnection = z.object({
  lake: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('READY') }),
    z.object({ kind: z.literal('NOT_READY') }),
    z.object({ kind: z.literal('UNAVAILABLE'), reason: z.enum(['NO_TABLES', 'EXCLUSIVE_CREDENTIAL']) }),
  ]),
  interval: LakeInterval.nullable(),
  tables: z.array(z.object({
    source: SourceTableId, name: LakeTableName, label: z.string(), description: z.string().nullable(),
    columns: z.int().min(0).nullable(), marked: z.boolean(), lastRun: LakeRun.nullable(),
  })),
  lastRun: LakeRun.nullable(),
})
export const SetLakeCopy = z.object({ tables: z.array(SourceTableId).max(50), interval: LakeInterval })
export const LakeTableSummary = z.object({
  id: LakeTableId, connection: z.object({ id: ConnectionId, name: z.string(), connector: z.string() }),
  name: LakeTableName, label: z.string(), source: SourceTableId, interval: LakeInterval,
  rows: z.int().min(0).nullable(), columns: z.array(z.object({ name: z.string(), type: z.string(), description: z.string().nullable() })),
  lastRun: LakeRun.nullable(), next: z.iso.datetime().nullable(),
})
// GET  /api/companies/{companyId}/connections/{connectionId}/lake-tables     -> LakeTablesOfConnection
// PUT  /api/companies/{companyId}/connections/{connectionId}/lake-copy        SetLakeCopy -> LakeTablesOfConnection
//      409 COPY_LAKE_NOT_READY | COPY_RUN_OPEN | COPY_NAME_TAKEN; 422 COPY_TABLE_NOT_DECLARED; 403 FORBIDDEN (manageCopies)
// POST /api/companies/{companyId}/connections/{connectionId}/lake-copy/run    -> 202 | 200 { already: true }
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
- **O dono de cada fato** (C26): os nomes, em `infra/aws/lib/names.ts`; o teto de 6 horas e o de
  4 KB em `lake-run.ts`; o `clientToken` `<rodada>-<tentativa>` só em `lake-run.ts` (T.8); a regra do
  nome em `lakeNameOf` (U3).
- **O esquema Zod de cada entrada externa** (C27): a mensagem da fila, o evento do ECS, a resposta de
  cada chamada da AWS, a resposta do dicionário.
- **Marcar** (`lake-copy.ts`): no `PUT`, numa transação, a cópia da ligação, as linhas novas e as
  desmarcadas; antes dela, a linha do lago relida (T.19) e o dicionário para as colunas; depois, o
  relógio e, se nasceu uma tabela, um disparo. Desmarcar apaga as tabelas da AWS primeiro e a linha
  depois.
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
2. **A lista da ligação e marcar.** Critérios: 37, 38, 52.
   - **Arquivos:** cria `lake-copy.ts`, `lake-routes.ts`.
   - **Testes:** `lake-routes.test.ts`, "a lista da ligação", "marcar", "a tabela do lago fica fora do
     banco".
3. **O relógio, o disparo e a varredura.** Critérios: 39, 40, 43, 45, 46, 87.
   - **Arquivos:** cria `builder/copy-clock/` (o relógio da ligação) e `lake-run.ts`.
   - **O que entra:** a varredura das rodadas abertas da ligação; o `INSERT` recusado pelo índice; o
     dicionário para as colunas; a especificação com o selo aberto; o `PutParameter`, refeito na cota;
     o `RunTask` com o papel da empresa e o token; `task_arn` gravado. Regras: D25; S8; C50.
   - **Mutações à mão:** tirar a varredura: o 43 fica vermelho.
4. **O fim.** Critérios: 41, 42, 44, 50, 51. Cria `lake-queue.ts`. A mensagem só sai da fila depois
   do fim gravado.
   - **Mutações à mão:** tirar o `ended_at IS NULL`: a parada que chega depois reescreve o resultado e
     o 41 fica vermelho.
5. **A lista de Dados.** Critério: 49. Cria `lake-list.ts`: a lista e as rodadas de uma tabela, pelas
   ligações que quem pede lê.
6. **Desmarcar, desligar e apagar o lago.** Critérios: 47, 48.
7. **Os testes na AWS.** Critérios: 46, 47, 48 (L.8, L.9).

- **A entrada em `docs/reference/boundaries.md`** das linhas 21 e 22, remendo, com a prova de cada
  uma, no commit da unidade.

### Como se prova

Pelas rotas de listar, marcar, rodar agora e desmarcar, e pela fila do servidor de respostas
gravadas, com um PostgreSQL local; a varredura por um disparo com uma rodada aberta antiga. Hoje nada
disso existe.

### Parar se

- O tempo que a AWS guarda o `clientToken`, lido no tipo instalado, é menor que a espera da
  repetição.
- O selo aberto de uma credencial passa dos 4 KB com a especificação.
- O evento de parada do ECS não traz o `startedBy`.
- O papel do Hub não lê o estado da pilha para o T.19.
- A lista de Dados precisa de um campo que a página de hoje mostrava e o `LakeTableSummary` não tem:
  o builder diz ao firstmate antes de acrescentar.

## U9 A tela

**Base e modelo.** A U8. Sonnet: uma seção numa página que existe, e a lista e a página de uma tabela
em Dados, escritas de novo sobre o contrato da U8.

### As linhas da tabela

- **Linha 19.** Ler `C/apps/web/src/hub/connectors/connection-page.tsx:207-222` (`Facts`, a seção que a
  nova segue) e `:275`; o seletor de intervalo do histórico (`apps/web/src/hub/copies/interval.tsx`,
  que a U1 tirou), só como leitura; seguir `AP .../CatalogConverter.kt:389-397` (nada marcado) só na
  ideia.
- **Linhas 31, 39, 42.** A lista e a página de uma tabela: as capturas `capturas/hoje/` da página
  Dados e a do Airbyte (`cloud-status-page.png`); `AP .../locales/en.json:1088-1094` para as frases
  da rodada; o rótulo primeiro, o nome no lago e a origem embaixo (`EST/conector-estilo-novo-estudo:105`).
  A página de hoje (`C/apps/web/src/hub/copies/copy-detail.tsx`, `copy-facts.tsx`, que a U14 tirou)
  é só leitura.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/connectors/` | Cria `lake-tables.tsx` e o teste; muda `connection-page.tsx`, `text.ts`, `queries.ts` | a página da ligação |
| `apps/web/src/hub/copies/` | Cria `lake-list.tsx`, `lake-detail.tsx`, `lake-queries.ts` e os testes; muda `data-page.tsx`, `data-tree.tsx` (a camada do lago), `text.ts`, `test-hub.tsx` | a página Dados |
| `apps/web/src/routes/_app/companies/$companyId/` | Cria `data.lake.$tableId.tsx` (`/data/lake/<id>`), ao lado do endereço antigo de uma cópia, que a U14 leva à página Dados | o roteador |

### Os contratos que a unidade cria

- Nenhum contrato novo: a tela lê `LakeTablesOfConnection`, `LakeTableSummary` e `LakeRun` da U8.
- Os textos, todos em `text.ts` de cada pasta (C26): "Tabelas no lago", "Salvar", "Rodar agora",
  "Completa · inteira", "Completa · só o que mudou", "As linhas ficam no lago da empresa.", "Próxima
  rodada" e as frases da matriz de estados, as dos códigos `COPY_SOURCE_*` incluídas.
- **O arquivo modelo**: `apps/web/src/hub/connectors/connection-page.tsx`, a seção `Facts` (`:207-222`),
  na forma; nenhum estado nem id novo na tela (C21, C23 não se aplicam).

### As skills e a leitura

As linhas de `react`, `@tanstack/react-router` e das peças de `apps/web/src/ui/` do `stack.md`. O guia
de web e o de desenho; o `DESIGN.md`.

### A ordem do trabalho

1. **A seção.** Critério: 54. A lista, as caixas, o intervalo (na parte 1, só 24 h, T.29), **Salvar**
   e **Rodar agora**, com os estados da matriz.
2. **Dados.** Critério: 55. A lista agrupada pela ligação, a página da tabela com as quatro abas, o
   tipo da rodada pelo `whole` e a frase do lugar.
   - **Testes:** com o Hub falso de `test-hub.tsx`.
   - **Mutações à mão:** mostrar o nome no lago no lugar do rótulo: o 55 fica vermelho.

### Como se prova

Pela tela com o Hub falso; na QA, pelo Hub local com o servidor de respostas gravadas, a 1366 e
390 px, claro e escuro.

### Parar se

- O texto de um estado precisa de uma decisão que a matriz não traz.
- A lista precisa de uma peça de `ui/` que Dados não usa.

## G4 O ponto de conferência

Depois da U9: o Hub local com o servidor de respostas gravadas; marcar **Notas e pedidos** na
ligação, rodar agora, o fim pela fila, a varredura de uma rodada antiga, a lista e a página da tabela
em Dados, desmarcar, apagar o lago; a QA da parte 1; na nuvem, depois da publicação, o firstmate faz o
roteiro 6 a 10 antes de chamar o fundador.

## U10 Só o que mudou

**Base e modelo.** O `main` depois da parte 1 usada. Opus: o estado, a atual e a limpeza mudam
juntos, e entre duas instruções a tabela fica num estado do meio.

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
- **Linha 8.** O modo incremental da declaração do kit, já lido pelo adaptador (U4).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/extraction/` | Cria `src/conexus_extraction/update.py`; muda `entry.py`, `meltano.yml`, `tests/` | a imagem |
| `apps/extraction/tap/` | Muda: a retomada pelo `--state` e o modo incremental | o `meltano.yml` |
| `infra/aws/lib/` | Muda `copy.ts` (o depósito do estado) e `platform.ts` (o Hub apaga o prefixo de uma tabela); a receita do lago não muda: o prefixo e o grupo de consultas nasceram na U6 | o Hub, pela Release |
| `apps/server/src/hub/copies/` | Muda `lake-run.ts` (`whole` pelo modo), `lake-copy.ts` (desmarcar apaga o estado) | — |
| `apps/web/src/hub/connectors/lake-tables.tsx`, `text.ts` | Muda: o intervalo passa a oferecer de 15 min a 24 h (T.29) | — |
| `apps/server/src/platform/aws.ts`, `recordings/aws/` | Muda: apagar o prefixo do estado; as gravações do Athena | — |

### Os contratos que a unidade cria

- **O estado** de uma ligação mora em `s3://<depósito do estado>/<empresa>/<ligação>/state.json`, na
  forma do Meltano, com o ponto de cada fluxo; só o papel da empresa lê e escreve o prefixo dela.
- **`CopyTaskResult.tables[].rows`** passa a ser a contagem da atual depois da atualização.
- **`CopyTaskSpec.tables[].whole`**: o Hub o pede verdadeiro só na primeira rodada de uma tabela
  recém-marcada; a tarefa lê inteira também a tabela sem ponto de parada no estado (o Hub não lê o
  estado) e a sem coluna de alteração, e diz no resultado, por tabela, se a passada foi inteira (T.17).
- `update.py`: `update(table, whole) -> UpdateCounts` com as três instruções, o `DELETE` da passada
  inteira e a limpeza; uma falha termina a rodada `COPY_LAKE_WRITE_FAILED`.
- **O arquivo modelo**: `conexus_extraction/target.py` (U5).

### As skills e a leitura

As linhas do Meltano e do PyIceberg do `stack.md`; a de `@aws-sdk/client-athena`. O guia de dados,
D25.

### A ordem do trabalho

1. **O estado.** Critérios: 56, 57. Testes: `test_state.py` com um depósito local.
2. **A atual e a limpeza.** Critérios: 58, 59.
   - **Mutações à mão:** limpar antes do `MERGE`: a atual perde as linhas da rodada e o 58 fica
     vermelho.
3. **O modo por tabela e os intervalos.** Critério: 60. O Hub pede; a tarefa decide pelo estado e
   diz. A seção da ligação passa a oferecer de 15 min a 24 h.
4. **Desmarcar.** Critério: 61.
5. **Os testes na AWS.** Critérios: 57, 58, 59 (L.4, L.7), na `sankhya_notas` do dublê de 450 colunas.

- **A entrada em `docs/reference/boundaries.md`** das linhas 28 e 29, remendo, com a prova de cada
  uma, no commit da unidade.

### Como se prova

Pelo `meltano run` com o depósito local e o dublê do Sankhya que muda uma nota (U3); na AWS, pela
conta de laboratório. Hoje a segunda rodada relê tudo.

### Parar se

- O `MERGE` do Athena sobre o `S3 Tables` recusa a forma medida, ou falha nas 450 colunas com um caso
  por instrução.
- O Meltano grava o estado antes de o gravador confirmar um lote.

## G5 O ponto de conferência

Depois da U10: o `meltano run` local com duas rodadas; o L.4 e o L.7 na conta de laboratório; a QA da
parte 2; na nuvem, o firstmate faz o roteiro 11 a 13 antes de chamar o fundador.

## U11 As tabelas da parada

**Base e modelo.** O `main` depois da parte 2 usada. Sonnet: colunas, uma tabela e permissões
nomeadas.

### As linhas da tabela

- **Linha 34.** Ler `C/apps/server/src/hub/notifications/tables.ts:125-150` (`request_notice`, a forma
  da linha no sino que a parada segue) e `:153-172` (`alert_recipient`, que fica).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/notifications/tables.ts`, `hub/copies/lake-tables.ts` | Muda | `hub/notifications/`, `hub/copies/` |
| `apps/server/drizzle/`, `database-grants.sql`, a foto do catálogo | Cria a migração; muda as permissões | `migrate`; `catalog.test.ts` |

### Os contratos que a unidade cria

| Tabela | Coluna | Tipo | Restrição | Ao apagar |
| --- | --- | --- | --- | --- |
| `copies.lake_copy` | `stopped_since`, `stopped_code`, `told_at` | `timestamptz`, `text`, `timestamptz` | `stopped_since` e `stopped_code` nulos juntos; o código em `LakeRunFailureCode`; `told_at` só com parada | — |
| `notifications.copy_stop_notice` | `id`, `company_id`, `person_id`, `connection_name`, `tables`, `code`, `created_at`, `read_at` | `uuid`, `text`, `text`, `text`, `text[]`, `text`, `timestamptz`, `timestamptz` | `tables` com ao menos um nome; o código em `LakeRunFailureCode`; as políticas da pessoa, como `request_notice` | o membro: `cascade`; nenhuma chave para a ligação, que pode sair antes (data D17) |

- As permissões do login da empresa na tabela nova; em `alert_recipient` ele já tem `SELECT`,
  `INSERT` e `DELETE` (`C/apps/server/database-grants.sql:456`).
- **O dono do fato**: os códigos, `LakeRunFailureCode` de `hub-api` (C26).
- **O arquivo modelo**: `request_notice`, em `C/apps/server/src/hub/notifications/tables.ts:125-150`
  (as políticas da pessoa, as conferências nomeadas).

### As skills e a leitura

A skill `drizzle`. O guia de dados, D6, D11, D15, D17.

### A ordem do trabalho

1. **A migração e as permissões.** Critério: 62, com a palavra do fundador (data D11).

### Como se prova

Pelo `migrate` num PostgreSQL local.

### Parar se

- A parada precisa de uma coluna que a U12 descubra só no teste.

## G6 O ponto de conferência

Depois da U11: o `migrate` num PostgreSQL local, a foto do catálogo, o `catalog.test.ts`.

## U12 O aviso de cópia parada

**Base e modelo.** O G6 mesclado. Opus: uma ligação que falha duas vezes não pode dar dois e-mails, e
uma que volta não pode dar nenhum.

### As linhas da tabela

- **Linha 34.** Ler `C/apps/server/src/hub/notifications/notifications.ts:104-180` (`recorded`,
  `mailed`), `:282-322`, `mail.ts`, `automation-email.tsx` e `request-notices.ts`. As referências
  avisam por rodada (`AP .../JobsHandler.kt:55-76`; `NK:12403-12404`); o aviso por parada, com
  lembrete, é nosso (C).
- **Linha 21.** O lembrete usa o relógio do Mastra, como o da ligação (U8).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/notifications/` | Cria `copy-stop.ts` (as linhas do sino e o e-mail) e `copy-stop-email.tsx`; muda `notifications.ts`, `notification-render.d.mts` | `hub/copies/lake-stop.ts` |
| `apps/server/src/hub/copies/` | Cria `lake-stop.ts`, o dono da parada em `lake_copy` (code C8); muda `lake-queue.ts`, `lake-copy.ts`, `lake-list.ts`: `closeLakeRun` chama a parada e a volta; a lista e a seção mostram a parada | — |
| `apps/server/src/builder/copy-clock/` | Muda: o relógio do lembrete | — |
| `apps/server/package.json` (o `build` dos e-mails com `esbuild`), `.gitignore` | Muda: o segundo modelo de e-mail | a Release |
| `packages/hub-api/src/lake-copies.ts`, `notifications.ts` | Muda: `stopped`; o aviso no sino | a tela |
| `apps/web/src/hub/copies/`, `hub/connectors/lake-tables.tsx`, `hub/notifications/bell.tsx` | Muda: a marca **Parada**; a linha no sino | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/lake-copies.ts
LakeTableSummary, LakeTablesOfConnection // gain: stopped: z.object({ since: z.iso.datetime(), code: LakeRunFailureCode }).nullable()
// packages/hub-api/src/notifications.ts — the bell gains one kind
z.object({ kind: z.literal('COPY_STOPPED'), connection: z.string(), tables: z.array(LakeTableName).min(1), code: LakeRunFailureCode })
// apps/server/src/hub/copies/lake-stop.ts — the owner of lake_copy's stop; called inside closeLakeRun's transaction
export function stopped(tx: CommandTx, run: { companyId: CompanyId; connectionId: ConnectionId; tables: LakeTableName[]; code: LakeRunFailureCode }): Promise<'OPENED' | 'ALREADY_OPEN'>
export function recovered(tx: CommandTx, run: { companyId: CompanyId; connectionId: ConnectionId }): Promise<'CLOSED' | 'WAS_RUNNING'>
// apps/server/src/hub/notifications/copy-stop.ts — the bell rows in the same transaction; the mail after the commit
export function copyStopNotices(tx: CommandTx, stop: { companyId: CompanyId; connectionName: string; tables: LakeTableName[]; code: LakeRunFailureCode }): Promise<readonly MailTo[]>
```

- **Quem abre a parada**: `UPDATE lake_copy SET stopped_since = ... WHERE ... AND stopped_since IS NULL
  RETURNING`; só a transação que recebe a linha grava as linhas do sino e manda o e-mail.
- **O lembrete**: um relógio por ligação parada, criado com a parada e apagado quando ela fecha,
  diário na hora do T.15; a primeira hora dele é o dia seguinte. Desmarcar a última tabela ou
  desligar a ligação apaga a cópia da ligação e o relógio.
- **Quem recebe**: os membros com papel de Dono ou Administrador e a lista `alert_recipient`; o
  e-mail nunca leva uma linha de dado nem a mensagem crua do sistema (S41).
- **O arquivo modelo**: `hub/notifications/request-notices.ts`, na forma.

### As skills e a leitura

As linhas de `react-email`, `@react-email/render` e `@mastra/core` do `stack.md`: a skill `mastra`.
O guia de web; a security S41.

### A ordem do trabalho

1. **A parada e a volta.** Critérios: 63, 64, 65.
   - **Mutações à mão:** tirar o `stopped_since IS NULL`: o 64 dá dois e-mails e fica vermelho.
2. **O e-mail e o sino.** Critérios: 63, 67, 68.
3. **O lembrete.** Critério: 66.
4. **A tela.** Critério: 67.

- **A entrada em `docs/reference/boundaries.md`** da linha 34, remendo, com a prova da linha, no
  commit da unidade.

### Como se prova

Pela fila do servidor de respostas gravadas com resultados de erro e de sucesso, um PostgreSQL local
e o e-mail de teste de hoje; o lembrete pelo disparo do relógio. Hoje nenhum aviso de cópia existe.

### Parar se

- O sino de hoje não aceita um tipo novo sem mudar a forma de todos.
- A lista de Donos e Administradores não se lê no escopo da empresa.

## U13 A lista de e-mails

**Base e modelo.** O G6 mesclado. Sonnet: três rotas e uma seção de Configurações.

### As linhas da tabela

- **Linha 35.** Ler `C/apps/server/src/hub/notifications/tables.ts:153-172` (`alert_recipient`, único
  por empresa sem caixa) e `C/docs/reference/telas.md:311`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/notifications.ts` | Muda: as três operações | a tela |
| `apps/server/src/hub/notifications/` | Muda `routes.ts`; cria `alert-recipients.ts` | U12 lê a lista |
| `apps/web/src/hub/identity/` | Cria `alert-recipients.tsx`, a seção **Avisos**, ao lado de `company-general.tsx`; muda o índice de Configurações (web W32) | — |

### Os contratos que a unidade cria

- `GET /api/companies/{companyId}/alert-recipients`, `POST` (corpo `{ email }`, 201; 409
  `ALERT_RECIPIENT_EXISTS`; 403 `FORBIDDEN`) e `DELETE .../{recipientId}` (204; 404
  `ALERT_RECIPIENT_NOT_FOUND`), só para Dono e Administrador (S8). O e-mail com o esquema Zod de hoje
  (C27); `AlertRecipientId` com marca (C23).
- **O arquivo modelo**: as rotas de `hub/notifications/routes.ts`.

### As skills e a leitura

As linhas de `fastify` e `react` do `stack.md`. O guia de web e o de desenho.

### A ordem do trabalho

1. **As rotas.** Critério: 69.
2. **A seção Avisos.** Critério: 69.

### Como se prova

Pelas rotas com um PostgreSQL local e pela tela com o Hub falso.

### Parar se

- A seção precisa de uma peça de `ui/` que Configurações não usa.

## G7 O ponto de conferência

Depois da U13: o Hub local com o servidor de respostas gravadas; uma rodada com erro, o e-mail, o
sino, a volta, o lembrete pelo disparo do relógio, a lista de e-mails; a QA da parte 3; na nuvem, o
firstmate faz o roteiro 14 antes de chamar o fundador, e a etapa fecha (delivery L19).
