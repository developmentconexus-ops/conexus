# A primeira cópia chega ao lago

Trilha Dados, a etapa 2 do lago, na ordem de [trilhas/dados.md](trilhas/dados.md). A pergunta:
"Uma tabela de um sistema ligado chega inteira, a mudança de hoje aparece na rodada seguinte, e eu
vejo isso na página Dados?" O estudo da etapa fica fora do repositório (delivery L21); este cartão
cita dele só o que a construção precisa. Em 2026-11-23 o fundador pediu o cartão escrito à noite
("termina o estudo do Lago 2 e escreve o cartão"); esta página ainda não está aprovada, e as
decisões dela estão abertas.

Cada linha do `main` citada foi lida em `b2406e07` (v0.24.110). As versões que a construção
instala são as que o estudo leu e rodou: `meltano` 4.4.1, `singer-sdk` 0.54.9, `pyiceberg` 0.12.0,
`pyarrow` 26.0.1, Python 3.13, e `@aws-sdk/client-ecs`, `client-sqs`, `client-ssm` e
`client-athena` 3.1175.0, a versão que o `main` fixa para o `client-cloudformation` e o
`client-s3tables` (o `client-s3` de hoje fica em 3.1146.0).

**Antes da construção.** Três coisas no `main`:

1. **O fechamento da etapa 1 do lago**, ou, pela delivery L1, só as unidades que não tocam os
   arquivos dos consertos dela.
2. **A mudança de método para Python** (registro 0074; o estudo achou que ela não entrou): as linhas
   do `docs/reference/stack.md` para o Meltano, o singer-sdk, o PyIceberg, o pyarrow, o `uv` e os
   quatro clientes novos da AWS; um job de Python na CI (formatação, tipos e testes de
   `apps/extraction/`); a conferência de documentos lendo as dependências de Python; a regra de
   máquina do adaptador (importa só o índice do kit e não nomeia conector, 0071); e uma frase na
   testing T26 para as formas do Singer e do Meltano. É um pull request de método só de documentos e
   configuração, com a palavra do fundador (delivery L20). A U3 e a U4 não começam antes dele.
3. **A segunda preparação da conta de laboratório** (decisão E), pelo firstmate, com a palavra do
   fundador, antes de a U5 publicar a plataforma.
4. **O L.2 à mão**, antes do G1: o firstmate, com a palavra do fundador, sobe na conta de laboratório
   uma tarefa avulsa na forma da prova (`conexus-lab-trilho/fases2a4/plataforma.py:80-90`), que faz o
   login e lê uma página do Sankhya do fundador. Se o gateway recusar o endereço da AWS, nenhuma
   unidade começa e a etapa volta ao fundador (0071). O critério 29 repete o teste com a imagem e a
   plataforma da U5.

Se a mudança de método mesclar com outra forma, a unidade segue a forma mesclada e o firstmate relê
esta seção.

## A página do fundador

**No fim desta etapa** você liga, na página **Dados**, uma cópia de uma tabela do Sankhya que vai
para o lago da empresa. Ela chega inteira, você vê na tela onde ela mora e que tipo de rodada foi, a
venda que você lançar hoje aparece na rodada seguinte, e, quando a cópia para, você recebe um e-mail
e um lembrete por dia até ela voltar.

**Como a etapa chega até você: em três partes.** A etapa é grande, no limite de um cartão (a conta
está em "As unidades"). O estudo recomendou cortá-la em três, e cada parte responde a um pedaço da
sua pergunta. O cartão é um só, porque as decisões valem para as três partes e você aprova uma
vez; cada parte você usa quando ela entra no ar, e a etapa fecha na terceira. Se preferir três
cartões, cada um com a sua aprovação, o conteúdo não muda: só o número de aprovações.

**O roteiro de uso.** No Hub da nuvem, na sua empresa, que já tem lago (etapa 1) e a conexão do
Sankhya ligada.

*Parte 1, a carga chega.*

1. Em **Dados**, clique **Ligar uma cópia**. Escolha a conexão do Sankhya, o modelo **Vendas** e o
   intervalo. Aparece um campo novo, **Onde guardar**; escolha **No lago**.
2. A linha `vendas` aparece na lista com a marca **No lago** e "Rodando…". Quando a primeira carga
   termina, ela diz **Em dia**, com o número de linhas e a hora. O modelo Vendas traz as vendas dos
   últimos 30 dias (decisão F), então "inteira" quer dizer a janela inteira. Quanto tempo a primeira
   carga leva não foi medido.
3. Abra a tabela e vá em **Rodadas**: a primeira diz "Completa · inteira" e quantas linhas leu. Em
   **Detalhes**, a frase diz "As linhas ficam no lago da empresa."
4. O firstmate mostra na sua frente, no console da AWS, a tabela `vendas` dentro do lago da sua
   empresa, com o mesmo número de linhas. Nesta etapa o Hub ainda não lê o lago para ninguém; isso é
   a etapa 3.

*Parte 2, a mudança aparece.*

5. Lance ou altere uma venda dos últimos 30 dias no Sankhya. Clique **Rodar agora**, ou espere o
   intervalo. A cópia acha a venda alterada pela data de alteração dela; que o Sankhya da sua empresa
   a muda numa alteração não foi verificado, e o firstmate confere antes do roteiro.
6. A rodada seguinte diz "Completa · só o que mudou" e mostra poucas linhas lidas. O total de linhas
   sobe ou fica igual.
7. O firstmate mostra no console a venda alterada na tabela do lago, com o valor de hoje.

*Parte 3, o aviso.*

8. O firstmate quebra de propósito a senha da conexão de teste. Na rodada seguinte a cópia passa a
   **Parada**, e chega um e-mail a você e à lista de e-mails da empresa. No dia seguinte chega um
   lembrete. Ele conserta a senha, e na rodada seguinte ela volta a **Em dia**, sem e-mail.

**O que você faz, e quando.** Antes: nada; a conexão do Sankhya da sua empresa já está ligada. No
começo: aprova esta página e responde as decisões A, B, C, E, F, G, H e I, e dá a palavra para o
primeiro teste de uma tarefa contra o seu Sankhya de dentro da AWS (o L.2 do estudo), que roda à
mão antes de qualquer unidade: se o Sankhya recusar o endereço da AWS, nada é construído e a etapa
volta a você. Na construção da parte 1: dá a palavra para a segunda preparação da conta (decisão
E). No começo da parte 3: dá a palavra para o login da empresa ler e gravar as duas tabelas novas
do aviso (data D11, a mesma regra da H). No fim de cada parte: faz o roteiro dela, diz o que viu e
aprova os textos novos da tela, que o pull request daquela parte lista.

**Fica de fora.**

- **O Hub ler o lago** para o Assistente (etapa 3) e para os apps (etapa 4). Até lá o motor de hoje
  continua copiando para o banco da empresa o que os apps usam, e a cópia que já existe no banco não
  muda.
- **Mudar de casa as cópias de hoje.** Elas continuam no banco da empresa até a etapa 7, sem aviso
  de parada (decisão C).
- **O histórico ligado por tabela** (decisão A). Nenhuma tabela pediu ainda.
- **A segunda classe de credencial**, a que uma renovação derruba: é da etapa 5. Nesta só o Sankhya,
  cuja renovação não derruba nada, renova dentro da tarefa.
- **Escolher campos e tabelas** (etapa 6) e **a tabela grande sem coluna de alteração** (etapa 7).
- **Atualizar a receita de um lago que já tem dado.** Os lagos de hoje estão vazios: o firstmate os
  apaga e cria de novo pelo botão da Central depois da segunda preparação.
- **O custo por rodada.** A conta de laboratório não separa a fatura por empresa (registro 0072).
- **O botão Seguir uma cópia.** Você decidiu em 2026-11-21 que ele só entra se alguém pedir.
- **As issues `next-card` das pastas da etapa.** A #1135 (o código do sistema sem corte) entra, porque
  a rodada do lago também grava esse código. A #942 (o relógio não visto rodar sozinho no ar) é
  provada pelo passo 5 do roteiro para a cópia do lago. A #940, a #1136, a #1140 e a #819 são do
  motor de hoje ou do dublê de SQL, e esperam a etapa que muda aquele código; nenhuma trata do lago.

**As decisões suas nesta etapa.** Nove: as seis que o estudo trouxe (A, B, C, E, F, G), a D, que
você já respondeu, e duas que o cartão precisou e o estudo não tinha (H e I). Em cada uma, a
primeira opção é a que o cartão já está escrito.

- **A. Por quanto tempo a camada bruta guarda o histórico.** Em 2026-11-18 você escolheu
  "histórico desligado por padrão, ligado por tabela". O lago tem duas camadas: a **bruta**, que
  acrescenta o que cada rodada leu, e a **atual**, com uma linha por venda. Falta dizer o que
  "desligado" faz com a bruta. Exemplo: o preço de um produto muda três vezes na semana; a atual
  mostra o de hoje, a bruta tem as três versões. Por quanto tempo as duas antigas ficam?
  - **(a)** Só até entrarem na atual. Depois que uma rodada entra na tabela atual, as linhas dela
    saem da bruta. A AWS ainda guarda as fotos da tabela por 5 dias, pelo padrão dela, e tira os
    arquivos depois. **Recomendo a.** É a sua frase de 18/11 e o que faz a referência mais próxima,
    a Nekt: lá a tabela tem uma linha por chave, e o histórico é um módulo que se liga à parte. O
    Airbyte guardava tudo na bruta e está abandonando isso, porque ela crescia sem parar. Veredito:
    remendo (a limpeza é nossa); como nativo, um `DELETE` do Athena depois de cada atualização.
  - **(b)** Um prazo fixo, por exemplo 30 dias. Nenhuma referência dá esse número.
  - **(c)** Guardar tudo, sempre.
  - *Se não for a (a):* com a (b), a limpeza da parte 2 passa a apagar pela idade da linha, e o
    prazo vira uma constante; com a (c), a parte 2 perde a limpeza e o critério dela, e a dívida
    registra que a bruta cresce 48 cópias por dia numa tabela sem coluna de alteração.

- **B. Como a cópia no lago é ligada e aparece.** Exemplo: a sua empresa já copia `vendas` para o
  banco da empresa, e um app lê dali. Você liga `vendas` também no lago.
  - **(a)** No mesmo diálogo de hoje, com um campo a mais, **Onde guardar**: "No banco da empresa"
    ou "No lago". O campo só aparece se a empresa tem lago pronto. A lista mostra duas linhas
    `vendas`, a do lago com a marca **No lago**. **Recomendo a.** É a pergunta da etapa, "eu vejo
    isso na página Dados?". No Airbyte cada par de origem e destino é uma conexão com a sua página;
    na Nekt a pessoa escolhe a camada onde a fonte grava. Nenhuma das duas guarda a mesma tabela em
    dois lugares: isso é da nossa mudança de casa, e o campo some quando o motor de hoje sair, na
    etapa 7. Veredito: embrulhado (a lista e o diálogo de hoje, com um campo e uma marca).
  - **(b)** Só o operador liga, pela Central. A empresa não vê a cópia do lago até a etapa 3.
  - **(c)** Empresa com lago copia tudo para o lago, sem perguntar. O app que lê `vendas` do banco
    da empresa ficaria sem a tabela até a etapa 4.
  - *Se não for a (a):* com a (b), a U8 muda de tela (a Central, na página do cliente), a rota de
    ligar ganha a versão do operador e a H sai; com a (c), o campo sai, ligar numa empresa com lago
    deixa de criar a tabela no banco, e o cartão ganha o critério de que nenhum app quebra, que hoje
    ele não sabe cumprir.

- **C. Quando uma cópia conta como parada.** Você decidiu em 2026-11-21: um aviso quando a cópia
  para, e um lembrete por dia enquanto ela continuar parada. Exemplo: o Sankhya fica fora do ar das
  3h00 às 3h20; a cópia de 30 em 30 minutos falha às 3h00 e dá certo às 3h30.
  - **(a)** Parada na primeira rodada que termina com erro. Às 3h00 sai um e-mail. Às 3h30 ela volta
    sozinha, sem e-mail. Ela nunca para de tentar. **Recomendo a.** As duas referências avisam já na
    primeira falha. Veredito: remendo (um aviso por parada, com lembrete, é nosso; as referências
    avisam por rodada).
  - **(b)** Parada só na segunda falha seguida. No exemplo, nenhum e-mail; uma senha trocada na
    sexta às 18h avisa às 18h30.
  - **(c)** Como as referências: um aviso a cada rodada que falha, e a cópia desligada depois de
    muitas falhas (no Airbyte, 30 seguidas ou 7 dias sem sucesso).
  - O que o estudo já decidiu dentro da C, porque a página da trilha mandou: a parada é anotada por
    tabela e avisada por conexão (dez tabelas de uma conexão quebrada dão um e-mail, e não dez);
    quem recebe é o Dono, o Administrador e a lista de e-mails da empresa; das três tabelas paradas
    no `main`, fica a lista de e-mails e saem a de quem segue e a de um aviso por rodada.
  - *Se não for a (a):* com a (b), a U10 conta as falhas seguidas numa coluna e o critério do
    primeiro e-mail passa a esperar a segunda; com a (c), a U10 manda um e-mail por rodada, guarda a
    tabela de um aviso por rodada em vez de tirá-la, e ganha o desligamento depois de N falhas.

- **D. As senhas por empresa.** Você respondeu "D4 sim" em 2026-11-22; não há escolha nova. Hoje os
  dois logins que o Hub usa no banco de toda empresa, o que copia e o que lê a Amostra, têm a mesma
  senha em toda empresa, porque ela é calculada só do nome do login. A U1 põe a empresa na conta, e o
  Hub troca a senha sozinho na primeira vez que usa o login depois da versão nova. Provado num
  PostgreSQL local; pela Neon é o primeiro teste da U1. A cópia do lago não usa esses logins: a D
  entra aqui porque você mandou trazer junto. Veredito: embrulhado (a conta do registro 0043, com um
  dado a mais).

- **E. A segunda preparação da conta e os poderes novos.** Na etapa 1 você aprovou a preparação
  feita uma vez pelo firstmate ("9a") e a trava do robô que monta os lagos (a F: ele só monta
  receitas guardadas num depósito em que só a Release escreve). A cópia pede quatro mudanças. As três
  primeiras o estudo listou; a quarta o cartão acrescentou.
  1. O robô passa a poder criar também o papel que escreve no lago de cada empresa.
  2. O teto dos papéis de empresa sobe: o que escreve grava nas tabelas do lago daquela empresa, lê
     o segredo da rodada dela e manda o resultado à fila.
  3. A Release passa a poder criar a fila, a tarefa, o depósito de imagens, a regra que avisa a
     parada da tarefa e a rede. Essa permissão mora na preparação, que a Release não muda sozinha.
  4. **O Hub** passa a poder iniciar e parar a tarefa, entregar a ela só papéis de escrita de
     empresa, gravar e apagar o segredo de cada rodada, ler a fila e apagar as tabelas de um lago.
  - Exemplo: sem a 1, o botão **Criar o lago** falha no papel novo; sem a 3, a Release falha ao
    publicar a plataforma; sem a 4, o relógio não consegue iniciar a cópia.
  - **(a)** Sim, pelo mesmo passo a passo guardado, com a mesma trava. O robô continua só montando
    receitas do depósito da Release; o papel que escreve nasce com o teto; o Hub só entrega à tarefa
    papéis com o nome de papel de escrita de empresa. **Recomendo a.** O registro 0073 já põe o
    papel que escreve dentro do lago de cada empresa, e a chamada da AWS que inicia a tarefa aceita o
    papel por rodada. Veredito: nativo (papéis e teto do IAM, receita do CloudFormation).
  - **(b)** Um papel só que escreve, da plataforma, para todas as empresas, separado por etiqueta.
    O robô não ganha poder novo. O isolamento da escrita passa a depender da etiqueta que o Hub
    escolhe, que é o ponto fraco que o estudo de acesso apontou.
  - *Se não for a (a):* com a (b), o papel que escreve sai da receita do lago (U5) e vai para a
    plataforma, a tarefa assume esse papel com a etiqueta da empresa, e o critério de isolamento da
    escrita passa a se apoiar na etiqueta que o Hub escreve.

- **F. Qual tabela do Sankhya prova a etapa.** O kit oferece cinco modelos com coluna de alteração.
  - **(a)** **Vendas**, o cabeçalho das notas de venda. Tem dinheiro, então prova o valor exato
    dentro da AWS, que o registro 0071 lista como não provado. Cada venda lançada é uma linha nova,
    então "a mudança de hoje" aparece com uma venda de verdade. **Recomendo a.** O que o estudo não
    disse e o cartão acrescenta: o modelo Vendas de hoje tem uma janela, as vendas dos últimos 30
    dias pela data da negociação (`C/packages/connectors/src/sankhya/copies.ts:83`, `:151-152`).
    Então a cópia no lago guarda essa janela, como a cópia no banco guarda hoje: uma venda que sai da
    janela sai da tabela atual na passada seguinte. O cartão constrói a leitura e a atualização da
    janela (U3 e U9), que o estudo deixava para a etapa 7. A tabela de notas da sua empresa tem 719
    mil linhas; quantas caem em 30 dias ninguém contou.
  - **(b)** **Clientes.** É menor e mais fácil de alterar à mão, mas não tem dinheiro.
  - *Se não for a (a):* o roteiro troca Vendas por Clientes, que não tem janela; a leitura e a
    atualização da janela saem da U3 e da U9 e voltam para a etapa 7; e o critério do valor exato
    dentro da AWS sai desta etapa e vai para a dívida, até a primeira tabela com dinheiro.

- **G. Uma tarefa por tabela ou uma por sistema.** Hoje cada tabela tem o seu relógio e a sua
  rodada, e a página mostra o **Intervalo** por tabela. Exemplo: daqui a algumas etapas a sua
  empresa copia 30 tabelas do Sankhya de 30 em 30 minutos.
  - **(a)** Por tabela agora, como hoje; agrupar por sistema na etapa 6, que traz muitas tabelas.
    Com uma tabela, as duas formas são iguais na tela e na AWS. **Recomendo a.** As provas do fim
    da rodada rodaram no modelo de hoje, e mudar agora custa linhas numa etapa no limite. Veredito:
    remendo (o relógio por tabela é nosso; as três referências agrupam por sistema), e fica escrito
    que elas divergem do nosso modelo (delivery L28).
  - **(b)** Por sistema já: uma tarefa copia as tabelas daquela conexão que estão na hora. São 48
    tarefas por dia, e não 1.440.
  - *Se não for a (a):* o relógio, a rodada e o intervalo passam a ser da conexão (U6, U7 e U8
    mudam), o contrato da lista muda de forma, e a conta passa das 4.000 linhas: a parte 3 sairia
    deste cartão.

- **H. O login da empresa lê a linha do próprio lago** (o cartão precisou; o estudo não tinha). Hoje
  só a Central vê a linha do lago de uma empresa: o login da empresa não vê nenhuma (a sua G da
  etapa 1, "2. A"). Para mostrar o campo **Onde guardar** e para iniciar a cópia, o Hub, agindo pela
  empresa, precisa saber se ela tem lago pronto e qual é. Exemplo: você abre **Ligar uma cópia**; o
  Hub lê a linha do lago da sua empresa, e de nenhuma outra, para saber se mostra **No lago**.
  - **(a)** O login da empresa passa a só ler a linha do próprio lago: as colunas de qual lago, em
    que conta e região e em que estado; nunca a de outra empresa, e nunca gravar. Num pull request
    só dele, como a regra de permissões pede (data D11). **Recomendo a.** Veredito: nativo (a
    permissão e a regra por linha do PostgreSQL).
  - **(b)** O login da empresa continua sem ver a linha, e o Hub guarda na própria cópia, ao ligar,
    o lago da empresa, lido por uma rota da Central. Custa: duas cópias do mesmo fato, e um lago
    apagado e criado de novo deixa as cópias apontando para o velho.
  - *Se não for a (a):* a U6 perde a permissão nova e ganha a coluna do lago na cópia; a U7 lê o
    lago da cópia, e apagar o lago passa a ter de atualizar cada cópia.

- **I. Onde a empresa escreve a lista de e-mails que recebe o aviso** (o cartão precisou; o estudo
  não tinha). Você decidiu em 2026-11-21 que o aviso vai a quem pode consertar e "à lista de e-mails
  da empresa". A tabela dessa lista existe no `main`, mas nenhuma tela nem rota a preenche. O mapa
  de telas já a põe em Configurações, na seção **Avisos** da empresa, "a etapa 2 do lago"
  (`docs/reference/telas.md:311`; `docs/explanation/mapa.md:212`). Exemplo: a sua empresa quer que o aviso chegue também ao
  `ti@empresa.com.br`, que não é login de ninguém.
  - **(a)** Em Configurações, a seção **Avisos**, como o mapa de telas prevê, que só o Dono e o
    Administrador veem: a lista, um campo para acrescentar um e-mail e o botão de tirar.
    **Recomendo a**: sem ele a sua decisão de 21/11 fica pela metade. Custa umas 200 linhas na parte
    3. Veredito: embrulhado (a lista e o campo de `ui/` que Configurações já usa). A Nekt também manda o
    aviso a uma lista de e-mails da empresa (`NK:22357-22360`).
  - **(b)** Nesta etapa o aviso vai só ao Dono e aos Administradores; a lista espera uma etapa
    própria.
  - *Se não for a (a):* a U12 sai, o critério da lista sai, e o roteiro do passo 8 diz só "chega um
    e-mail a você".

**O que muda em relação ao estudo, e por quê.** Cinco coisas:

- **Um cartão em três partes, e não três cartões** (acima). O estudo recomendou três cartões.
- **O Hub ganha poderes na AWS** que o estudo não listou: é o item 4 da E.
- **O login da empresa lê a linha do lago**: é a H.
- **A lista de e-mails ganha onde ser escrita**: é a I.
- **A janela de 30 dias do Vendas entra nesta etapa**, e não na 7: está na F. Ela e a I são as
  duas que mudam o que você vê.

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 A senha por empresa (um PR, parte 1) | U1 A D4 | A empresa entra na conta da senha de `conexus_sync` e `conexus_read`; a senha é posta a cada preparação do login; o L.10 na Neon | o raio da U1 | data (D10) | o `main` |
| G2 O kit serve a cópia (um PR, parte 1) | U2 O kit para a cópia | `kernel/session.ts`; a classe da credencial; o tamanho de página por conector; a leitura exata do corpo; os dois dublês que mudam um registro; o Hub usando a sessão do kit | o raio da U2 | testing (T5, T29) | o `main` |
| G2 | U3 O adaptador | `apps/extraction/tap/`, o leitor Singer único, que lê só a declaração de cópia do kit | o raio da U3 | testing (T26) | U2; a mudança de método |
| G3 A tarefa e a plataforma (um PR, parte 1) | U4 A tarefa | `apps/extraction/`: o projeto `uv`, o `meltano.yml`, o gravador do lago, a entrada da tarefa e a imagem; o L.1, o L.3 e o L.5 | o raio da U4 | security (S31, S41) | G2 mesclado; a mudança de método |
| G3 | U5 A plataforma da cópia | Em `infra/aws/`: a fila, a regra, o cluster, a tarefa, o depósito de imagens e a rede; o papel que escreve na receita do lago; o teto; os poderes do Hub; a preparação; a Release monta a imagem; o L.2 e o L.6 | o raio da U5 | security (S36, S40) | U4; a segunda preparação (decisão E) |
| G4 A cópia sabe onde mora (um PR, data D11, parte 1) | U6 A migração e a permissão | `copy.place`, as colunas da tarefa em `copy_run`, o nome único por lugar, a leitura da linha do lago pelo login da empresa (decisão H), a foto do catálogo | o raio da U6 | data (D6, D10, D11, D15) | o `main` |
| G5 A cópia pelo Hub (um PR, parte 1) | U7 O disparo e o fim | O adaptador da AWS ganha a tarefa, o parâmetro, a fila e as tabelas; ligar no lago; o disparo; o fim pela fila; a varredura; apagar a cópia e o lago com tabela; a #1135 | o raio da U7 | data (D25, D27); security (S8, S41) | G3 e G4 mesclados |
| G5 | U8 A tela | O campo **Onde guardar**, a marca **No lago**, o tipo da rodada, a frase do lugar e as frases dos códigos novos | o raio da U8 | web, design | U7 |
| G6 A mudança aparece (um PR, parte 2) | U9 Só o que mudou | O ponto de parada do Meltano no depósito `S3`; o modo incremental; o atualizar; a limpeza da bruta (decisão A); a passada inteira de domingo; o L.4 e o L.7 | o raio da U9 | data (D25) | a parte 1 usada |
| G7 A tabela do aviso (um PR, data D11, parte 3) | U10 As tabelas da parada | A parada na cópia, a parada da conexão, o aviso no sino; saem `copy_follower` e `copy_notice` | o raio da U10 | data (D6, D11, D15) | a parte 2 usada |
| G8 O aviso (um PR, parte 3) | U11 O aviso de cópia parada | A parada anotada por tabela, o e-mail por conexão, a linha no sino, o lembrete por dia, a marca **Parada** na lista | o raio da U11 | web; security (S41) | G7 mesclado |
| G8 | U12 A lista de e-mails (decisão I) | As rotas de listar, acrescentar e tirar um e-mail da lista, e a seção **Avisos** de Configurações | o raio da U12 | web, design; security (S8) | G7 mesclado |

Oito grupos, um pull request cada ([delivery L9](../guides/delivery.md)), um commit por unidade.

- **A linha principal.** G1, G2 e G4 em paralelo: não dividem pasta. G3 parte do G2 mesclado,
  porque a imagem leva o adaptador. G5 parte do G3 e do G4 mesclados.
- **As três partes.** A parte 1 (G1 a G5) termina no roteiro 1 a 4. A parte 2 (G6) e a parte 3 (G7 e
  G8) começam cada uma depois de o fundador usar a anterior; cada parte publica uma versão, com o
  nome que o firstmate dá pela delivery L17 (a parte 1, a da etapa; as outras, as seguintes), e a
  etapa fecha com a parte 3. Publicar e usar no meio da etapa é leitura deste cartão, com a palavra
  do fundador ao aprová-lo.
- **Só o G4 e o G7 criam ou tiram permissão no banco do Hub** (data D11).
- **O que toca a outra trilha.** Nenhum arquivo de `builder/` além de `builder/copy-clock/` (U7, U9),
  que a trilha Dados possui. Da Plataforma ou do contrato compartilhado: `packages/hub-api` (U1, U6,
  U7, U11, U12), `platform/app-sql.ts`, `copy-reader.ts`, `aws.ts`, `config-aws.ts` (U1, U7, U9),
  `hub/lake/` (U6, U7) e `hub/notifications/` (U10, U11, U12). Os pull requests do G1, do G4, do
  G5, do G7 e do G8 avisam a outra trilha (delivery L27).
- **A QA** ([testing T25](../guides/testing.md)) roda depois do G5, do G6 e do G8, no Hub local com o
  servidor de respostas gravadas.

**Orçamento de código alterado.** Linhas mudadas, as tiradas também, sem testes nem gerados (o
`lake.template.json` é gerado; os dublês e as gravações não contam; o Python conta). As medidas do
estudo estão entre parênteses. U1: ~90. U2: ~380 (a sessão, 87). U3: ~410 (344, mais a janela). U4:
~520 (o gravador, 165). U5: ~480. U6: ~90. U7: ~740 (os fechadores, de 172 a 312). U8: ~230. U9: ~460
(o atualizar, 144, mais a janela). U10: ~90. U11: ~480. U12: ~200. Total da etapa: cerca de 4.170
linhas, uns 4% acima das 4.000 da delivery L2 (3.970 com a decisão I (b)). Parte 1: ~2.940; parte 2:
~460; parte 3: ~770. A razão de não cortar já está em T.9. Se a parte 1 medir acima de 3.300 no
fim do G5, a parte 3 sai deste cartão e vira um cartão próprio, com as mesmas unidades; o firstmate
diz ao fundador antes de começar a parte 2.

## Os critérios de aceite

Os testes entram pela porta pública de cada peça ([testing T5](../guides/testing.md)): a rota do Hub;
a linha de comando do adaptador; a entrada da tarefa pelo `meltano run`; o `cdk synth` com as
asserções da receita. "Lab" é a conta de laboratório, com a palavra do fundador; o resultado vai no
pull request, e não no CI (T14).

### Parte 1, a carga chega

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | A senha de `conexus_sync` e a de `conexus_read` da empresa A diferem das da empresa B; a de um login de app (`app_<projeto>_run`) não muda | `packages/hub-api/src/app-login.test.ts`, "a empresa entra só na conta dos dois logins da empresa" | must |
| 2 | U1 | Numa empresa que já existia, a primeira rodada da cópia do banco depois da versão nova entra com a senha nova; uma conexão nova com a senha antiga é recusada (28P01); a sessão já aberta com a antiga continua; repetir a preparação não muda nada | `apps/server/src/hub/copies/run.test.ts`, "a senha antiga é trocada antes da primeira rodada" (PostgreSQL local) | must |
| 3 | U1 | A Amostra de uma cópia entra com a senha nova do login de leitura, pelo mesmo caminho | `apps/server/src/hub/copies/sample.test.ts`, "a Amostra depois da troca" | must |
| 4 | U1 | Pela Neon (L.10), num projeto de teste: depois da troca, a conexão com a senha nova entra na primeira tentativa; com a antiga, não | Lab, no pull request do G1 | should |
| 5 | U2 | Numa cópia que dura mais que o token, a sessão do kit renova antes do fim, desloga a velha, e no fim não sobra sessão aberta; uma leitura recusada por sessão vencida renova e repete uma vez, e a segunda recusa termina em `COPY_SOURCE_NEEDS_REAUTH` | `packages/connectors/src/kernel/session.test.ts`, com o dublê do Sankhya e o relógio de teste | must |
| 6 | U2 | O Hub lê e confere uma conexão pela sessão do kit; o "renova e repete uma vez" sai de `hub/connectors/` | `apps/server/src/hub/connectors/connections-refresh.test.ts`, `connections-sessions.test.ts` e `write-lost.test.ts`, os casos de hoje, verdes sem mudar o que esperam | must |
| 7 | U2 | Todo login do kit declara a classe da credencial; o Sankhya declara compartilhável; os outros, exclusiva; a conformidade recusa um conector sem a classe | `packages/connectors/src/kernel/conformance.test.ts`, "a classe da credencial" | must |
| 8 | U2 | O Sankhya lê páginas de 5.000 linhas; um conector que não declara usa 500; `PAGE_ROWS` não existe mais | `packages/connectors/src/kernel/copy.test.ts`, "o tamanho de página é do conector" | must |
| 9 | U2 | O número `12345678901234567890` num corpo JSON chega ao Hub e ao adaptador como `"12345678901234567890"` quando o conector declara números exatos; `wire.ts` não chama mais `JSON.parse` sem o leitor do kit. O dublê do Sankhya passa a guardar `VLRNOTA` como texto (hoje `REAL`, `fake-sales.ts:131`, que perde dígitos) e ganha uma venda de `1234567890123.123456` | `packages/connectors/src/kernel/exact-json.test.ts`, com o corpo em bytes; `apps/server/src/hub/connectors/wire.test.ts`, "o número grande"; `sankhya/fake.test.ts`, "o valor de 19 dígitos" | must |
| 10 | U2 | Entre duas leituras, o dublê do Sankhya altera, cria e apaga uma nota, e o do HubSpot altera e remove um negócio, por rotas que só o dublê tem; o modo real não as tem | `packages/connectors/src/sankhya/fake.test.ts` e `hubspot/fake.test.ts`, "o registro muda entre duas leituras" | must |
| 11 | U3 | `tap --about` e `tap --discover` respondem para todo conector que declara uma tabela; a bateria padrão do singer-sdk passa sobre a saída crua do Sankhya e do HubSpot (34 e 24 na sonda do estudo; a U3 os refaz sobre o adaptador dela) | `apps/extraction/tap/src/tap.test.ts`; `apps/extraction/tests/test_tap_battery.py` | must |
| 12 | U3 | Uma passada inteira emite SCHEMA, RECORD com a versão da passada, STATE a cada página e ACTIVATE_VERSION no fim; nenhum campo da credencial aparece na saída | `apps/extraction/tap/src/tap.test.ts`, "a passada inteira" e "nada do segredo na saída" | must |
| 13 | U3 | Um login recusado faz o adaptador sair com código diferente de zero e escrever no arquivo de resultado o código do kit (`COPY_SOURCE_NEEDS_REAUTH`, `COPY_SOURCE_REFUSED`, `COPY_SOURCE_UNREACHABLE` ou `COPY_SOURCE_UNREADABLE`), nunca o corpo | `apps/extraction/tap/src/tap.test.ts`, "a fonte recusa" | must |
| 14 | U3 | A regra de máquina da mudança de método recusa um import de `packages/connectors/src/sankhya/` e um nome de conector plantados no adaptador | o check da regra, rodado em `npm run deps` com o caso plantado no teste da regra | must |
| 15 | U4 | Pelo `meltano run`, o gravador acrescenta numa tabela Iceberg local as linhas do dublê do Sankhya, com `_sdc_sequence` e `_sdc_table_version`, o dinheiro em `decimal(38,9)`, e a soma bate com a da fonte; `1234567890123.123456` chega igual | `apps/extraction/tests/test_target.py`, "a passada inteira chega à bruta" | must |
| 16 | U4 | Um valor que não cabe em `decimal(38,9)` termina a rodada com `COPY_LAKE_WRITE_FAILED`, sem gravar o lote | `apps/extraction/tests/test_target.py`, "o valor que não cabe" | must |
| 17 | U4 | A entrada lê o parâmetro da rodada, grava o segredo num arquivo `0600` e só o caminho vai à configuração do Meltano; nenhuma variável de ambiente do leitor e do gravador, nem linha do registro da tarefa, tem um campo do segredo | `apps/extraction/tests/test_entry.py`, "o segredo fica no arquivo" | must |
| 18 | U4 | A entrada manda à fila um resultado só por rodada, na forma `CopyTaskResult`, com as contagens e o código; nunca o conteúdo de uma linha. Uma falha do leitor dá o código dele; do gravador, `COPY_LAKE_WRITE_FAILED` | `apps/extraction/tests/test_entry.py`, "um resultado por rodada", contra a gravação da fila | must |
| 19 | U4 | Com o parâmetro da rodada apagado no meio, a tarefa para no lote seguinte, sem gravar mais e sem mandar resultado | `apps/extraction/tests/test_entry.py`, "a rodada fechada para a tarefa" | must |
| 20 | U4 | A imagem (Node 24, Python 3.13, Meltano, o adaptador e o gravador, x86) responde a `tap --about` e a `meltano --version` antes de ser publicada; no Fargate (L.1), contra o dublê do Sankhya, as linhas chegam à bruta do `S3 Tables` e a soma bate | `scripts/workflows.test.ts`, "a imagem responde antes de sair"; Lab, no pull request do G3 | must |
| 21 | U4 | Na AWS (L.3), o fim normal, a falha do leitor, a falha do gravador e um `StopTask` chegam à fila com o motivo certo nos quatro | Lab, no pull request do G3 | must |
| 22 | U4 | Na AWS (L.5), a soma de `decimal(38,9)` lida pelo Athena bate com a da fonte | Lab, no pull request do G3 | must |
| 23 | U5 | A plataforma tem a fila e a fila de mortos, a regra que manda à fila a parada das tarefas do cluster da cópia, o cluster, a definição de tarefa única (2 vCPU, x86, sem segredo no ambiente), o depósito de imagens e a rede de sub-redes públicas sem NAT | `infra/aws/test/platform.test.ts`, "a plataforma da cópia" | must |
| 24 | U5 | A receita do lago cria o papel `conexus-<lago>-escritor`, com o teto, confiando só nas tarefas do ECS da conta, com as concessões de escrita nas duas áreas do lago daquela empresa e a leitura dos parâmetros da empresa | `infra/aws/test/lake.test.ts`, "o papel que escreve" | must |
| 25 | U5 | Na AWS (L.6), o papel que escreve de A grava nas duas áreas de A e é recusado nas de B, e não lê o parâmetro de uma rodada de B | Lab, no pull request do G3 | must |
| 26 | U5 | O papel do Hub pode iniciar e parar só a tarefa da cópia, entregar só papéis `conexus-*-escritor` às tarefas do ECS, gravar e apagar só parâmetros `/conexus/copia/*`, ler e apagar mensagens só da fila da cópia, e listar e apagar tabelas só de depósitos `conexus-*`; nada além | `infra/aws/test/platform.test.ts`, "os poderes do Hub" | must |
| 27 | U5 | A preparação deixa a Release criar as peças do 23 e nada além do que já deixava | `infra/aws/test/preparation.test.ts`, "a segunda preparação" | must |
| 28 | U5 | A Release monta a imagem, publica-a no depósito de imagens e só então publica a plataforma, com a tarefa apontando para a imagem pelo digest | `scripts/workflows.test.ts`, "a imagem da cópia antes da plataforma" | must |
| 29 | U5 | Na AWS (L.2), uma tarefa faz o login e lê uma página do Sankhya do fundador. Se o gateway recusar, a etapa para e volta ao fundador | Lab, no pull request do G3, antes de qualquer outro teste da parte 1 | must |
| 30 | U6 | Duas cópias `vendas` da mesma empresa, uma em cada lugar, coexistem; uma segunda no mesmo lugar é recusada pelo banco; `copy_follower` e `copy_notice` não existem mais, e com elas a conferência que repete `CopyRunFailureCode` no banco | `apps/server/src/hub/copies/tables.test.ts`, "o nome é único por lugar" | must |
| 31 | U6 | O login da empresa lê, da linha do lago, só a da própria empresa e só as colunas nomeadas; gravar, mudar ou apagar é recusado; a foto do catálogo muda só nisso e nas colunas novas | `apps/server/src/hub/lake/tables.test.ts`, "a empresa lê a sua linha"; `catalog.test.ts` | must |
| 32 | U7 | `listCopyModels` oferece `LAKE` só numa empresa com lago pronto; `enableCopy` com `place: LAKE` numa empresa sem lago pronto responde 409 `COPY_LAKE_NOT_READY` e não cria nada | `apps/server/src/hub/copies/routes.test.ts`, "ligar no lago" | must |
| 33 | U7 | A cada disparo de uma cópia do lago, o Hub abre uma rodada, grava o parâmetro dela e inicia a tarefa com o papel da empresa e o `clientToken` de rodada e tentativa; com rodada aberta, o disparo responde "já está rodando" e não grava nada | `apps/server/src/hub/copies/lake-run.test.ts`, "o disparo", contra as gravações da AWS | must |
| 34 | U7 | **Rodar agora** duas vezes ao mesmo tempo inicia uma tarefa só | `lake-run.test.ts`, "dois disparos juntos" | must |
| 35 | U7 | O resultado da tarefa fecha a rodada uma vez, com o resultado, as contagens, `rows` e o código; a parada do ECS que chega depois não muda nada; quem chega primeiro fecha | `apps/server/src/hub/copies/lake-queue.test.ts`, "o resultado e a parada" | must |
| 36 | U7 | Uma parada do ECS sem resultado fecha a rodada como `ERROR` `COPY_TASK_LOST`; uma tarefa parada pelo Hub fecha como `INTERRUPTED` | `lake-queue.test.ts`, "a tarefa que morreu" | must |
| 37 | U7 | No disparo, uma rodada aberta cuja tarefa a AWS diz parada ou não conhece, ou aberta há mais de 6 horas, é fechada antes de abrir a nova | `lake-run.test.ts`, "a varredura" | must |
| 38 | U7 | Toda rodada fechada apaga o parâmetro dela; um parâmetro que a AWS não tem conta como apagado | `lake-queue.test.ts`, "o parâmetro sai no fim" | must |
| 39 | U7 | Um `RunTask` recusado fecha a rodada como `ERROR` `COPY_LAKE_UNAVAILABLE` e apaga o parâmetro; um `RunTask` sem resposta é repetido com o mesmo `clientToken`, e a AWS não inicia duas | `lake-run.test.ts`, "a AWS recusa" e "a AWS não responde" | must |
| 40 | U7 | Dez disparos no mesmo segundo (L.9): o parâmetro recusado por cota é refeito, e as dez rodadas abrem | Lab, no pull request do G5 | should |
| 41 | U7 | Apagar uma cópia do lago para a tarefa aberta, apaga a tabela dela no lago, o relógio e a linha; na AWS (L.8), nada sobra | `apps/server/src/hub/copies/delete.test.ts`, "apagar a cópia do lago"; Lab | must |
| 42 | U7 | Apagar o lago de uma empresa com tabelas apaga as tabelas, depois as áreas e a pilha, e leva as cópias do lago da empresa; na AWS (L.8), nada sobra | `apps/server/src/hub/lake/lake-remove.test.ts`, "o lago com tabela"; Lab | must |
| 43 | U7 | O registro do Hub mostra `COPY_RUN_ENDED` com as contagens e o lugar; nem ele nem a fila levam o conteúdo de uma linha ou do segredo | `lake-queue.test.ts`, "o que o registro leva" | must |
| 44 | U7 | O `system_code` de uma rodada passa a ter teto e conferência no banco (#1135) | `run.test.ts`, "o código do sistema com teto" | must |
| 45 | U7 | Sem cópia do lago, o Hub não chama a AWS; com cópias, o consumidor da fila não abre conexão com o banco enquanto não chega mensagem (data D27) | o teste do banco que dorme de hoje (data D27, "sleeping-database test"), com o consumidor ligado | must |
| 64 | U7 | Uma cópia do lago não cria nada no banco da empresa (nem o esquema `sync`, nem o login, nem a tabela), não entra no catálogo que o Assistente e os Projetos leem, não se libera a um Projeto nem a um papel, e a Amostra dela responde 409 `COPY_IN_LAKE`; a cópia do banco com o mesmo nome continua como hoje | `apps/server/src/hub/copies/routes.test.ts`, "a cópia do lago fica fora do banco"; `catalog-view` pelo teste de conformidade do contrato | must |
| 65 | U8 | Na tabela de uma cópia do lago, as abas **Amostra** e **Colunas** e a liberação a Projetos dizem "As linhas ficam no lago. A leitura delas chega numa próxima etapa." e não chamam o Hub | `apps/web/src/hub/copies/copy-detail.test.tsx`, "o que a cópia do lago não mostra" | must |
| 66 | U9 | Uma cópia do lago com janela (Vendas) lê, numa passada, as linhas mudadas dentro dos 30 dias; a atualização tira da atual as linhas da janela que não voltaram e as que saíram dela, como a cópia do banco faz hoje (`copy-sql.ts:287-301`) | `apps/extraction/tests/test_update.py`, "a janela"; `apps/extraction/tap/src/tap.test.ts`, "a janela" | must |
| 46 | U8 | Em **Ligar uma cópia**, **Onde guardar** aparece só quando a empresa oferece o lago, com "No banco da empresa" escolhido; a escolha vai na criação | `apps/web/src/hub/copies/new-copy.test.tsx`, "onde guardar" | must |
| 47 | U8 | A lista mostra a linha do lago com a marca **No lago**, ao lado da do banco com o mesmo nome | `apps/web/src/hub/copies/copy-list.test.tsx`, "duas linhas vendas" | must |
| 48 | U8 | Em **Rodadas**, o resultado diz "Completa · inteira" ou "Completa · só o que mudou"; em **Detalhes**, "As linhas ficam no lago da empresa."; cada código novo tem a sua frase | `apps/web/src/hub/copies/copy-detail.test.tsx`, "a cópia do lago" | must |

### Parte 2, a mudança aparece

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 49 | U9 | Pelo `meltano run`, a segunda rodada de uma cópia do Sankhya lê só o que mudou desde o ponto de parada, guardado no depósito do estado com o prefixo da empresa; a de uma tabela sem filtro de alteração (o HubSpot) lê tudo | `apps/extraction/tests/test_state.py`, "a segunda rodada" | must |
| 50 | U9 | Na AWS (L.4): uma rodada morta no meio retoma lendo menos que o total; o estado salvo nunca está adiante das linhas gravadas; o papel de A não lê o prefixo de B | Lab, no pull request do G6 | must |
| 51 | U9 | Depois de uma rodada inteira, uma só do que mudou e uma inteira com uma exclusão, a atual tem uma linha por chave, igual à fonte, e o que sumiu da fonte sumiu da atual | `apps/extraction/tests/test_update.py`, contra as gravações do Athena; Lab (L.7) | must |
| 52 | U9 | Depois de cada atualização, a bruta não tem mais as linhas que já entraram na atual, e a atual não muda com a limpeza (decisão A) | `test_update.py`, "a limpeza"; Lab (L.7) | must |
| 53 | U9 | A rodada de domingo de uma cópia do lago é inteira; as outras, só o que mudou; **Rodar agora** segue o modo da cópia | `apps/server/src/builder/copy-clock/clock-whole.test.ts`, "a cópia do lago" | must |
| 54 | U9 | Apagar uma cópia do lago apaga também a tabela atual e o ponto de parada dela | `apps/server/src/hub/copies/delete.test.ts`, "o ponto de parada sai" | must |

### Parte 3, o aviso

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 55 | U10 | Existem a parada na cópia, a parada da conexão e o aviso no sino, com as conferências do banco; a foto do catálogo muda só nisso | `apps/server/src/hub/notifications/tables.test.ts`; `catalog.test.ts` | must |
| 56 | U11 | A primeira rodada com erro de uma cópia do lago anota a parada da tabela, com a hora e o código; se a conexão não tinha parada aberta, sai um e-mail ao Dono, a cada Administrador e à lista de e-mails da empresa, e uma linha no sino de cada Dono e Administrador | `apps/server/src/hub/notifications/copy-stop.test.ts`, "a primeira falha" | must |
| 57 | U11 | Dez tabelas da mesma conexão que param uma depois da outra dão um e-mail e uma linha no sino por pessoa | `copy-stop.test.ts`, "dez tabelas, um aviso" | must |
| 58 | U11 | A primeira rodada completa tira a parada da tabela, e apagar a cópia ou a conexão também; quando nenhuma tabela da conexão continua parada, a parada da conexão fecha, o relógio do lembrete sai, sem e-mail | `copy-stop.test.ts`, "a volta" | must |
| 59 | U11 | Um lembrete por dia, na hora de T.15, por conexão ainda parada, com as tabelas paradas dela; nenhum lembrete depois que ela volta, e nenhum no dia em que ela parou | `copy-stop.test.ts`, "o lembrete" | must |
| 60 | U11 | Uma cópia do banco da empresa que falha não anota parada nem avisa | `copy-stop.test.ts`, "a cópia do banco não avisa" | must |
| 61 | U11 | Na página Dados, a cópia parada mostra **Parada** e o motivo; quem não é Dono nem Administrador não recebe o aviso no sino | `apps/web/src/hub/copies/copy-list.test.tsx`, "parada"; `copy-stop.test.ts`, "quem recebe" | must |
| 62 | U11 | Um e-mail que não sai não desfaz a parada e é registrado; o próximo lembrete do dia vai | `copy-stop.test.ts`, "o e-mail que não sai" | must |
| 63 | U12 | O Dono e o Administrador listam, acrescentam e tiram um e-mail da lista; o mesmo e-mail com outra caixa é recusado (409 `ALERT_RECIPIENT_EXISTS`); quem não é Dono nem Administrador recebe 403 e não vê a seção; um e-mail acrescentado recebe o próximo aviso | `apps/server/src/hub/notifications/routes.test.ts`, "a lista de e-mails"; `apps/web/src/hub/identity/alert-recipients.test.tsx` | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dados, a lista (U8, U11) | A empresa com lago e nenhuma cópia no lago: a lista de hoje, sem marca | Nenhuma cópia: o vazio de hoje, sem mudança | O de hoje | O de hoje | Uma cópia apagada noutra aba some na próxima leitura, como hoje | Quem não gerencia cópias vê a lista sem **Ligar uma cópia**, como hoje; a marca **No lago** aparece para todos que leem a lista | A última rodada com erro: o selo de hoje, com a frase do código; parte 3: **Parada**, com o motivo |
| Ligar uma cópia, o diálogo (U8) | Empresa com lago pronto: **Onde guardar** aparece, com "No banco da empresa" escolhido | Empresa sem lago pronto: o campo não aparece, e a cópia vai ao banco, como hoje | Os modelos carregando, como hoje | `COPY_LAKE_NOT_READY` (o lago foi apagado ou está mudando entre abrir e confirmar): "O lago desta empresa não está pronto. Ligue no banco da empresa ou tente quando o lago estiver pronto." | A conexão apagada: a frase de hoje | O botão não aparece, como hoje | O nome já ligado naquele lugar: a frase de hoje do nome repetido |
| A tabela de uma cópia do lago, Amostra, Colunas e Projetos (U8) | "As linhas ficam no lago. A leitura delas chega numa próxima etapa." | O mesmo | — | — | — | Como hoje | — |
| A tabela, Rodadas e Detalhes (U8) | A primeira rodada aberta: "Rodando…", sem linhas | Nenhuma rodada ainda: o vazio de hoje | O de hoje | `COPY_LAKE_UNAVAILABLE`: "A AWS não iniciou a cópia. A próxima rodada tenta de novo." `COPY_TASK_LOST`: "A cópia parou antes de terminar. A próxima rodada tenta de novo." `COPY_LAKE_WRITE_FAILED`: "Não deu para gravar no lago. A próxima rodada tenta de novo." | A tabela apagada: a frase de hoje | Como hoje | A rodada interrompida: a frase de hoje de `INTERRUPTED` |
| O sino, a linha da parada (U11) | A primeira parada: "A cópia de <conexão> parou: <tabelas>." | Sem parada: nenhuma linha | O de hoje | O de hoje | A conexão apagada depois do aviso: a linha fica, com o nome guardado | Só Dono e Administrador recebem a linha | — |
| Configurações, a seção Avisos (U12) | A lista vazia: "Só o Dono e os Administradores recebem os avisos." e o campo de e-mail | O mesmo da primeira vez | O de hoje da página | Um e-mail já na lista: "Este e-mail já recebe os avisos." | Um e-mail tirado noutra aba some na próxima leitura | Quem não é Dono nem Administrador não vê a seção | — |
| O e-mail da parada e o lembrete (U11) | "A cópia de <conexão> parou", com as tabelas, o motivo e o link para Dados | — | — | Um e-mail que não sai fica no registro do Hub (critério 62) | — | Vai só ao Dono, aos Administradores e à lista | — |

As caixas, a 1280 e a 390 px, seguem a organização A do estudo (uma linha a mais, com a marca), que
é a decisão B (a). As capturas que o desenho segue são do estudo: `capturas/hoje/01-dados-a-lista`,
`04-ligar-uma-copia-o-dialogo` e `05-a-tabela-a-consulta-e-as-rodadas`, a 1440 e 390 px, e a do
Airbyte, `capturas/referencias/cloud-status-page.png`.

```text
1280 px, a lista                                     390 px, a lista
+------------------------------------------------+   +----------------------------+
| Tabela      Atualizada        Linhas  Intervalo |   | vendas            Em dia   |
| sankhya · Matriz · 5 tabelas                    |   | 02/11 10:00 · 118.402      |
| vendas      Em dia 02/11 10:00 118.402  30 min  |   | vendas [No lago]  Em dia   |
| vendas      Em dia 02/11 10:02 118.402  30 min  |   | 02/11 10:02 · 118.402      |
|  [No lago]                                      |   +----------------------------+
+------------------------------------------------+
1280 px, o diálogo                                   390 px, o diálogo
+------------------------------------------------+   +----------------------------+
| Conexão  [sankhya · Matriz           v]         |   | Conexão   [sankhya v]      |
| Modelo   [Vendas                     v]         |   | Modelo    [Vendas  v]      |
| Intervalo[30 min                     v]         |   | Intervalo [30 min  v]      |
| Onde guardar (o) No banco da empresa            |   | Onde guardar               |
|              ( ) No lago                        |   | (o) No banco da empresa    |
+------------------------------------------------+   | ( ) No lago                |
                                                     +----------------------------+
```

As peças de `ui/`: a lista, o diálogo e o selo que a página Dados já usa, e a escolha de duas opções
(`toggle-group.tsx`, que já existe em `ui/`, ou o `ChoiceSelect` do diálogo, o que o catálogo de
`ui/` mandar). A marca **No lago** é o selo de hoje com outro texto; nenhuma peça nova. A interface do Impeccable roda na
QA de cada parte com tela ([Impeccable](../reference/impeccable.md)).

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `CopySummary.place` (`DATABASE` ou `LAKE`) | U7, `hub/copies/list.ts`, da coluna `copy.place` | U8, `copy-list.tsx` e `copy-detail.tsx` |
| `listCopyModels`: `places` | U7, `hub/copies/routes.ts`, do estado da linha do lago | U8, `new-copy.tsx` |
| `EnableCopyFromModel.place` | U8, `new-copy.tsx` | U7, `hub/copies/enable.ts` |
| As falhas de rota `COPY_LAKE_NOT_READY` (ligar) e `COPY_IN_LAKE` (Amostra) | U7, `enable.ts` e `sample.ts` | U8, `text.ts` |
| `connection_stop.told_at`, a hora do último e-mail da parada | U11, no primeiro e-mail e em cada lembrete | U11, o lembrete não sai duas vezes no mesmo dia |
| `CopyRunFailureCode`: `COPY_LAKE_UNAVAILABLE`, `COPY_TASK_LOST`, `COPY_LAKE_WRITE_FAILED` | U7 no fim da rodada; U4 no resultado | U8, `text.ts` |
| `CopyRun.whole` | U7 (sempre `true` na parte 1); U9 pelo modo | U8, a coluna Resultado |
| `CopySummary.rows` de uma cópia do lago | U7, do `rows` do resultado | U8, a coluna Linhas |
| `CopyTaskSpec`, no parâmetro da rodada | U7, `hub/copies/lake-run.ts` | U4, `apps/extraction/src/conexus_extraction/entry.py` |
| `CopyTaskResult`, na fila | U4, `entry.py` | U7, `hub/copies/lake-queue.ts` |
| O evento de parada do ECS, na fila | a regra do EventBridge (U5) | U7, `lake-queue.ts` |
| `copy_run.task_arn`, `copy_run.attempt` | U7, no disparo | U7, a varredura e o fim |
| A linha do lago, lida pela empresa | o módulo do lago de hoje | U7, `enable.ts` e `lake-run.ts` |
| `CopySummary.stopped` | U11, `list.ts` | U11, `copy-list.tsx` |
| O aviso de parada no sino | U11 | U11, a lista do sino |
| A lista de e-mails | U12, as rotas | U11, quem recebe o e-mail |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| A senha posta a cada preparação do login (`ALTER ROLE`) | As duas põem a mesma senha; o `ROLES_LOCK` de hoje as enfileira | A transação desfaz; a próxima preparação põe de novo | A rodada termina `COPY_DATABASE_UNAVAILABLE`, como hoje | `COPY_DATABASE_FAILED` com o código, nunca a senha | 2, 3 |
| Ligar uma cópia no lago (`enableCopy`) | A chave de tentativa de hoje (C37) devolve a mesma cópia | A transação desfaz a linha; o relógio é criado depois, como hoje | O lago lido em outro estado: 409 `COPY_LAKE_NOT_READY` | o de hoje | 30, 32 |
| Abrir a rodada (`INSERT` em `copy_run`) | O índice `copy_run_open_key` recusa a segunda: "já está rodando" | — (uma instrução) | Banco fora: o disparo não abre nada; o próximo tenta | `COPY_RUN_SKIPPED` com o motivo | 33, 34 |
| Gravar o parâmetro da rodada (`PutParameter`) | Um nome por rodada, sem disputa | A rodada fecha `COPY_LAKE_UNAVAILABLE` | Cota (3 por segundo): refeito com espera, depois `COPY_LAKE_UNAVAILABLE` | `COPY_LAKE_START_FAILED` com o código da AWS | 39, 40 |
| Iniciar a tarefa (`RunTask`) | O `clientToken` de rodada e tentativa: a AWS devolve a mesma tarefa | Sem resposta: repetido com o mesmo token; recusado: a rodada fecha e o parâmetro sai | A AWS fora: `COPY_LAKE_UNAVAILABLE` | `COPY_LAKE_START_FAILED` | 33, 39 |
| O resultado e a parada na fila (o fim) | Quem chega primeiro fecha (`UPDATE ... WHERE ended_at IS NULL`); o segundo não muda nada | A mensagem só sai da fila depois do fim gravado; três entregas falhas vão à fila de mortos | Banco fora: a mensagem volta à fila e é lida de novo | `COPY_RUN_ENDED`; uma mensagem ilegível, `COPY_QUEUE_UNREADABLE`, apagada da fila | 35, 36, 43 |
| Apagar o parâmetro no fim | Apagar duas vezes: a segunda acha nada e conta como apagado | A rodada já está fechada; a tarefa que ainda roda para no lote seguinte | A AWS fora: a varredura do próximo disparo apaga | `COPY_PARAMETER_LEFT` | 19, 38 |
| Gravar `copy_run.task_arn` depois do `RunTask` | Uma rodada só grava (a linha dela) | O Hub cai entre o `RunTask` e a gravação: a varredura acha a tarefa pelo `startedBy` da rodada (`ListTasks`), ou fecha a rodada pelas 6 horas | Banco fora: o mesmo | `COPY_TASK_UNRECORDED` | 37 |
| A varredura no disparo | Duas varreduras fecham a mesma rodada uma vez (o mesmo `UPDATE`) | — | A AWS fora: a rodada aberta há mais de 6 h fecha mesmo assim, como `COPY_TASK_LOST` | `COPY_RUN_SWEPT` | 37 |
| O gravador acrescenta na bruta (`append` do PyIceberg) | Uma rodada aberta por cópia (o índice); o PyIceberg refaz o commit em conflito 4 vezes | Um lote sem commit não aparece; o estado não sai antes dele | O catálogo responde 429 e o PyIceberg não refaz: a rodada termina `COPY_LAKE_WRITE_FAILED` | A linha `METRIC` do SDK e o resultado; nunca uma linha de dado | 15, 16, 18 |
| A tarefa confere a rodada a cada lote | — | Parâmetro apagado: para sem mandar resultado; a parada do ECS fecha o que sobrou | A AWS fora na conferência: conta como fechada e para | `RUN_CLOSED` no registro da tarefa | 19 |
| O ponto de parada do Meltano (parte 2) | Uma rodada por cópia; o Meltano grava a cada linha de estado | Morte no meio: o estado é o do último lote gravado | O `S3` fora: o Meltano falha, e a rodada termina com o código do gravador | o de hoje do Meltano | 49, 50 |
| O atualizar e a limpeza (parte 2, três `MERGE` e um `DELETE`) | Uma rodada por cópia | Entre duas instruções a atual fica num estado do meio; a próxima rodada refaz | O Athena fora: a rodada termina `COPY_LAKE_WRITE_FAILED`; a bruta guarda as linhas | `UPDATE_FAILED` com o código do Athena | 51, 52 |
| Apagar uma cópia do lago | A segunda acha a cópia apagada: 404 de hoje | Tarefa parada e tabela apagada antes da linha: a tabela que a AWS não tem conta como apagada; repetir termina | A AWS fora: a linha fica, e a tela diz a frase de hoje de tentar de novo | `COPY_LAKE_TABLE_LEFT` | 41, 54 |
| Apagar o lago com tabelas | A trava do lago de hoje (etapa 1) | Tabelas apagadas e pilha não: o próximo **Apagar o lago** termina | A AWS fora: o estado `delete_failed` de hoje | o de hoje do lago | 42 |
| A Release publica a imagem e a plataforma | O grupo de concorrência da Release de hoje | Imagem publicada e plataforma não: a próxima Release publica a mesma versão | O ECR fora: a Release falha antes do `deploy` | o do workflow | 20, 28 |
| Anotar a parada e avisar (parte 3) | Duas rodadas da mesma conexão que falham juntas: a parada da conexão é uma linha com chave; só a que a cria manda e-mail | O e-mail sai depois da transação; um e-mail que não sai não a desfaz | O envio fora: registrado, e o lembrete do dia seguinte vai | `COPY_STOP_MAILED` ou `COPY_STOP_MAIL_FAILED` | 56, 57, 62 |
| Acrescentar e tirar um e-mail da lista (U12) | O índice `alert_recipient_key` recusa o segundo: 409 `ALERT_RECIPIENT_EXISTS` | — (uma instrução) | Banco fora: a frase de hoje de tentar de novo | o de hoje das rotas | 63 |
| O relógio do lembrete, criado com a parada e apagado com a volta (parte 3) | O id do relógio é o da parada: a criação que perde a corrida acha o relógio feito, como `clock.ts:70-79` | Parada gravada e relógio não: a próxima rodada com erro da conexão cria | O banco fora: a rodada fecha sem a parada, e a próxima anota | `COPY_STOP_CLOCK_FAILED` | 58, 59 |
| O lembrete do dia (parte 3) | O relógio do Mastra dispara um por vez; a linha guarda o dia do último lembrete | — | O banco fora: o lembrete do dia não sai, e o do dia seguinte sim | `COPY_STOP_REMINDED` | 59 |

## A tabela de referência

A tabela do estudo, com a unidade e o arquivo novo de cada linha. `C/` é o `main` em `b2406e07`; as
siglas das referências são as do estudo (`AB` airbyte `8b40981a`, `AP` airbyte-platform `c46502e`,
`CDK` airbyte-python-cdk `bde4377`, `DLT` dlt `efaf0e3`, `TRM` tap-rest-api-msdk `071b540`, `NK` o
texto da Nekt guardado em 2026-11-19), guardadas em `data/conexus-credenciais-framework/refs/`.

| # | Peça | Hoje no main | Referência | Veredito | Prova, se não for nativo | Decisão | Unidade | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A declaração de cópia por tabela: chave, paginação, tamanho de página, modo | `C/packages/connectors/src/kernel/copy.ts:66-97`, `:129-165`; `kernel/operation.ts:148-167`; `PAGE_ROWS = 500`, `copy.ts:6` | `CDK .../declarative_component_schema.yaml:1896-1951`, `:4046-4070`, `:2244-2271`, `:1147-1155`; a fábrica, `model_to_component_factory.py:2136-2150`: um bloco por tabela com `primary_key`, paginador com `page_size` e `incremental_sync`. Mesma situação numa API REST; diferente num ERP por SQL (`:4453-4457`). `TRM tap.py:506-540`, paginação por leitor (`:519-522`) | remendo: a declaração é do kit; acrescenta o tamanho de página por conector | O adaptador copiou duas classes lendo só a declaração (estudo, Apêndice B, com singer-sdk 0.54.9 e Meltano 4.4.1) | 0080 | U2 | — (muda `kernel/copy.ts`) |
| 2 | O adaptador: do kit a um leitor Singer, um só | nenhum; o laço mora no Hub, `C/apps/server/src/hub/copies/source-pass.ts:194-212`, `hub/connectors/copy-port.ts:243-315` | `TRM tap.py:455` e `CDK .../concurrent_declarative_source.py:165`: um leitor genérico configurado por dado; as tabelas nascem num laço sobre a configuração. `singer-sdk@0.54.9 singer_sdk/streams/core.py`: um código por sistema, situação diferente | remendo: TypeScript que fala Singer, porque o kit é TypeScript (0074) | 344 linhas, duas classes, 34 e 24 testes da bateria do singer-sdk 0.54.9 (estudo); a P2, 68 testes | 0071 | U3 | `apps/extraction/tap/src/tap.ts` |
| 3 | A sessão dentro da tarefa: reusar, renovar antes do fim, deslogar | `C/apps/server/src/hub/connectors/limits.ts:127` (`createEndings`, o logout antes de o token vencer); "renova e repete uma vez", `read.ts:109-115`, `check.ts:43-48` | `singer-sdk@0.54.9 singer_sdk/authenticators.py:526-527`, `:609-619`: confere a validade antes de cada pedido e renova quando venceu | remendo: a peça é do kit | A P2: 87 linhas, 4 renovações em 100 s, nenhuma sessão pendurada; o autenticador lido no singer-sdk 0.54.9 | 0077 | U2 | `packages/connectors/src/kernel/session.ts` |
| 4 | A classe da credencial, compartilhável ou exclusiva | nenhum | nenhuma faz como dado: as referências renovam sempre no processo que copia | remendo | O Sankhya: o token vence aos 300 s em uso, e duas sessões convivem (`docs/decisions/0077-how-a-credential-reaches-the-copy-task.md`) | 0077 | U2 | — (muda `kernel/auth.ts`) |
| 5 | O número exato, do provedor ao lago | `C/apps/server/src/hub/connectors/wire.ts:71` (`JSON.parse`); `kernel/list.ts:53-62` | `JSON.parse` com `context.source`, do Node 24; `singer-sdk@0.54.9 singerlib/json.py:40-44` (`parse_float=decimal.Decimal`); `DLT dlt/common/arithmetics.py:18-19`, decimal (38, 9); `AB .../AirbyteTypeToIcebergSchema.kt:70`, `double`, que a 0071 recusou | nativo nas pontas; embrulhado no meio | `1234567890123.123456` igual em `decimal(38,9)`; a função devolve o inteiro de 20 dígitos (estudo, `numero-exato.txt`) | 0071; T.4 | U2, U4 | `packages/connectors/src/kernel/exact-json.ts` |
| 6 | O gravador: só acrescenta na bruta, em Iceberg | nenhum | `singer-sdk@0.54.9 target_base.py:479-492` (o estado depois dos lotes), `sinks/core.py:135`, `:475-506`; `pyiceberg@0.12.0 table/__init__.py:1705-1724` (`append`), `:1123-1158` (refaz o commit 4 vezes). `AB .../S3DataLakeStreamLoader.kt:105`: sem bruta, situação diferente | embrulhado: o esquema Arrow, o decimal e a marca da passada | 165 linhas, 183 e 230 linhas gravadas, soma igual (estudo). Não provado no `S3 Tables`: L.1 | 0071 | U4 | `apps/extraction/src/conexus_extraction/target.py` |
| 7 | A marca da passada inteira | no motor de hoje, `_pass`, `C/apps/server/src/platform/copy-sql.ts:287-301` | `singer-sdk@0.54.9 target_base.py:430-448`, `sinks/core.py:723-736`; `AP .../CatalogGenerationSetter.kt:36-47` | embrulhado: uma propriedade da tabela diz qual versão está completa | Local (estudo); na AWS, a fase 4 | 0080 | U3, U4 | — |
| 8 | O projeto do Meltano e o comando da rodada | nenhum | `meltano@4.4.1 meltano/schemas/meltano.schema.json:335-337`; `core/plugin/singer/tap.py:211-214`; `cli/run.py:48-126` (`--full-refresh`) | nativo, com três limites: código de saída único, nenhuma contagem, configuração no ambiente | — | 0071 | U4 | `apps/extraction/meltano.yml` |
| 9 | Onde fica o ponto de parada | no motor de hoje, `C/apps/server/src/hub/copies/tables.ts:274-312` | `meltano@4.4.1 core/plugin/singer/target.py:100-120`; `core/state_store/filesystem.py:45`, `:191-228`; `AP .../AirbyteMessageTracker.kt:69-78`; `DLT dlt/common/schema/typing.py:42` | nativo | Local, em arquivo. Não provado no `S3`: L.4 | T.1 | U9 | — (muda `meltano.yml`) |
| 10 | O segredo da rodada dentro da tarefa | security S31, `C/docs/guides/security.md:120-125` | `meltano@4.4.1 core/plugin_invoker.py:276`: toda configuração vai ao ambiente. 0077: um parâmetro cifrado por rodada | embrulhado: só o caminho do arquivo é configuração | O que o Meltano exporta (estudo); a P4 leu o parâmetro com o papel da empresa | 0077 | U4, U7 | `apps/extraction/src/conexus_extraction/entry.py` |
| 11 | A imagem da tarefa e quem a publica | a imagem do Hub vai ao `ghcr.io`, `C/.github/workflows/publish.yml:73-110` | a imagem da P1: `python:3.13-slim`, Meltano 4.4.1, x86 | nativo (Docker e ECR) | Não provado: Node e Python juntos, a Release montando: L.1 | 0074 | U4, U5 | `apps/extraction/Dockerfile` |
| 12 | A rede da tarefa até o sistema | nenhum | as provas: a sub-rede pública da VPC padrão, IP público, sem NAT | nativo | Não provado: o Sankhya do fundador de dentro da AWS: L.2 | T.6 | U5 | `infra/aws/lib/copy.ts` |
| 13 | O disparo; uma rodada aberta por cópia | `C/apps/server/src/builder/copy-clock/clock.ts:12-25`; a posse, `hub/copies/run.ts:41-47`; `copy_run_open_key`, `tables.ts:139` | `@aws-sdk/client-ecs@3.1175.0 dist-types/models/models_1.d.ts:3243-3343` (`RunTaskRequest`), `:2858` (`taskRoleArn`); `AP .../ConnectionManagerUtils.kt:286`, uma por conexão | remendo, do 0076 | A P3, 22 testes; a P4, 19 cenários na AWS; `@aws-sdk/client-ecs` 3.1175.0 | 0076; G | U7 | `apps/server/src/hub/copies/lake-run.ts` |
| 14 | O fim: o resultado e a parada numa fila; a varredura | no motor de hoje, `ended`, `C/apps/server/src/hub/copies/run.ts:116-165` | a regra do EventBridge até a fila (P4); `@aws-sdk/client-sqs@3.1175.0 dist-types/models/models_0.d.ts:1373` (`WaitTimeSeconds`); Prefect, Dagster, Airflow e Temporal: o trabalho escreve o próprio resultado e a infraestrutura fecha o que sobrou | remendo, do 0076 | A P4 na AWS, aviso em 23,6 s na mediana, `@aws-sdk/client-sqs` 3.1175.0. Não provado com o Meltano 4.4.1: L.3 | 0076 | U4, U7 | `apps/server/src/hub/copies/lake-queue.ts` |
| 15 | A camada atual: o atualizar | nenhum | `AB .../JdbcSqlGenerator.kt:219-238`, bruta e SQL num armazém; `DLT dlt/destinations/sql_jobs.py:1120-1139`, `MERGE INTO`; Nekt, sem bruta | remendo, do 0080 | 449 de 449 tabelas com diferença zero, 8 falhas plantadas; a forma do airbyte v2.0.0 (`AB`) lida | 0080; T.3 | U9 | `apps/extraction/src/conexus_extraction/update.py` |
| 16 | O histórico da bruta | nenhum | nenhuma faz a limpeza: a Nekt não tem bruta com histórico (`NK:8635`); o Airbyte guardava tudo e está saindo; o `S3 Tables` guarda 120 h de fotos | remendo (a limpeza) | Não provado: L.7 (`docs/decisions/0080-copy-declared-per-table-raw-appends.md`) | A | U9 | — (em `update.py`) |
| 17 | A linha da cópia e da rodada; o contrato da lista | `copies.copy`, `copy_run`, `C/apps/server/src/hub/copies/tables.ts:39-143`; `CopySummary`, `C/packages/hub-api/src/copies.ts:73-93`; `TableKept`, `company-data.ts:48-57` | `AP .../schema_dump.txt:629-639`: uma linha de estado por tabela, as rodadas à parte | nativo (Drizzle, data D4, D11) | Os fechadores da P3 rodaram sobre as tabelas de hoje | T.2 | U6, U7 | a migração da U6 |
| 18 | Ligar no lago; a marca **No lago** | `C/apps/web/src/hub/copies/new-copy.tsx:98-118`; `copy-list.tsx:230-263`; `text.ts` | `AP .../StreamStatusIndicator.tsx:9-21`; a captura `cloud-status-page.png` | embrulhado | As capturas do estudo | B | U8 | — |
| 19 | A tabela: o tipo da rodada e onde as linhas ficam | `C/apps/web/src/hub/copies/copy-detail.tsx:105-109`, `:170-305`; `copy-facts.tsx:104-112`; `text.ts:88-89` | `AP .../locales/en.json:1088-1094`, `:577-578`; Nekt, `NK:22429-22431` | embrulhado: duas frases e uma coluna | — | — | U8 | — |
| 20 | Rodar agora, pausar e apagar uma cópia do lago | `C/apps/server/src/hub/copies/routes.ts:47-118` | o "Sync now" do Airbyte (captura) | embrulhado | Não provado: L.8 | — | U7, U9 | — |
| 21 | Apagar o lago que tem tabela | `C/apps/server/src/platform/aws.ts:279-296`; a AWS recusa a área com tabela, `C/docs/reference/stack.md:24` | `@aws-sdk/client-s3tables@3.1175.0` `ListTablesCommand.d.ts`, `DeleteTableCommand.d.ts` (parâmetros não lidos) | nativo | Não provado: L.8. O papel do Hub não tem a permissão (`C/infra/aws/test/platform.test.ts:74-86`) | cartão da etapa 1, `o-lago-da-empresa-nasce-e-some.md:100-101` | U5, U7 | — |
| 22 | A receita muda: o papel que escreve, as três travas, os lagos já criados | `C/infra/aws/lib/platform.ts:114-123`, `:127`, `:139-144`; `preparation.ts:209-262`; `hub.ts:14-20` | 0073: "A change to every company is one `UpdateStack` each" | nativo | Não provado: o papel dentro da pilha, L.6 | E; T.5 | U5 | — |
| 23 | A plataforma da cópia: fila, tarefa, imagens, regra, rede | nenhum | `aws-cdk-lib@2.278.0` `aws-ecs/lib/fargate/fargate-task-definition.d.ts`, `aws-sqs/lib/queue.d.ts`, `aws-events/lib/rule.d.ts`, `aws-ecr/lib/repository.d.ts` (não lidos linha a linha) | nativo | À mão, `conexus-lab-trilho/fases2a4/plataforma.py:80-90` | 0073, 0076 | U5 | `infra/aws/lib/copy.ts` |
| 24 | O aviso de cópia parada | três tabelas sem uso, `C/apps/server/src/hub/notifications/tables.ts:154-234`; o e-mail, `mail.ts` e `automation-email.tsx` | `AP .../JobsHandler.kt:55-76` (por rodada); `AP .../application.yml:434-437` (desliga aos 30 e 7); Nekt, `NK:12403-12404`, `NK:22357-22360`; nenhuma manda lembrete | remendo: um aviso por parada e um lembrete por dia | Lido no airbyte-platform v2.0.0 (`AP`): nenhum lembrete nos dois módulos de aviso | C; fundador, "R1 a R2 a" | U10, U11 | `apps/server/src/hub/notifications/copy-stop.ts` |
| 25 | A D4: as senhas por empresa | `C/packages/hub-api/src/app-login.ts:30-40`; `C/apps/server/src/platform/copy-sql.ts:150-179`; `copy-reader.ts:51-82`; `app-sql.ts:72-87` | PostgreSQL 18, `ALTER ROLE ... PASSWORD`; registro 0043 | embrulhado | Local (estudo, `sondas/d4-senhas/`). Não provado pela Neon: L.10 | D | U1 | — |
| 26 | O método para Python | nenhum | não estudado | nativo (as ferramentas de Python que a mudança de método escolher) | — | 0074 | fica de fora: é a mudança de método antes da construção | — |
| 27 | As gravações das formas nativas | 33 gravações em `C/apps/server/src/platform/recordings/aws/` | testing T14 e T29, `C/docs/guides/testing.md:57-70`, `:85-91` | nativo (o servidor de respostas gravadas da etapa 1) | Gravadas, locais: as mensagens Singer, o estado do Meltano, o resumo do PyIceberg, as linhas `METRIC`. Faltam: `RunTask`, a fila, o parâmetro, o Athena | — | U4, U7, U9 | `apps/server/src/platform/recordings/aws/ecs-*.json` e os outros |
| 28 | O login da empresa lê a linha do lago | `C/apps/server/src/hub/lake/tables.ts:48-56`: só o operador | as permissões por coluna e a regra por linha do PostgreSQL (`GRANT SELECT (colunas)`, `CREATE POLICY`) | nativo (data D10, D11) | — | H | U6 | a migração da U6 |
| 29 | O nome único por lugar | `copy_company_id_name_key`, `C/apps/server/src/hub/copies/tables.ts:78` | o índice único do PostgreSQL sobre três colunas | nativo (data D15) | — | B | U6 | a migração da U6 |
| 30 | A lista de e-mails que recebe o aviso | `alert_recipient`, `C/apps/server/src/hub/notifications/tables.ts:153-172`, sem rota nem tela; o lugar, Configurações, Avisos, `C/docs/reference/telas.md:311` | Nekt: a lista de e-mails da empresa recebe o aviso (`NK:22357-22360`) | embrulhado (a lista e o campo de `ui/`) | — | I | U12 | `apps/web/src/hub/identity/alert-recipients.tsx` |

**A medida do transplante.** Nenhum código do repositório antigo entra. O adaptador e o gravador da
sonda do estudo (`sondas/adaptador-duas-classes/`) são ponto de partida, e não transplante: cada um
foi escrito do zero sobre a base da sua biblioteca, e a unidade os reescreve contra os contratos deste
cartão.

**A dívida.**

- A imagem em ARM, para medir depois (T.6).
- A bateria não renova a chave do dublê do HubSpot, que invalida a anterior a cada renovação: a
  renovação na tarefa fica provada só no Sankhya até a etapa 5.
- O texto da 0076 sobre o token de 32 caracteres e a frase da 0078 sobre quem tem credencial da AWS
  (T.3, T.8): o fechamento da etapa os corrige.
- A tabela sem chave e a tabela com mais de 231 colunas no atualizar: etapa 7. A janela de datas entra
  nesta etapa (decisão F (a)).
- Um `RunTask` sem resposta repete com o mesmo token. Por quanto tempo a AWS guarda o token não
  foi lido: a U7 lê no tipo instalado e, se for menor que a espera da repetição, para (o "Parar se"
  dela).

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| T.1 | O ponto de parada no depósito `S3` nativo do Meltano, num depósito da plataforma, com um prefixo por empresa que só o papel dela lê e escreve | É a peça nativa: salva a cada linha de estado (`meltano@4.4.1 core/plugin/singer/target.py:100-120`). No banco da plataforma, como o Airbyte, pediria um canal da tarefa ao Hub; no destino, como o dlt, código nosso nas duas pontas | Trocar `state_backend.uri` e passar o estado pelo parâmetro e pelo resultado |
| T.2 | A cópia do lago mora em `copies.copy` e `copies.copy_run`, com a coluna `place` e as colunas da tarefa | Os fechadores da P3 rodaram sobre elas; a lista, os leitores e os Projetos já leem dali | Uma migração para tabelas próprias no esquema `lake` |
| T.3 | Quem roda o atualizar é a tarefa, depois da carga, com o papel que escreve | Um ator e um papel; o papel do Hub continua sem escrever no lago. A frase da 0078 ("nobody else gets an AWS credential", `C/docs/decisions/0078-how-the-lake-knows-who-reads.md:12`) fala de quem lê; o fechamento acrescenta a linha | Mover a chamada para o Hub, com o Athena no papel dele |
| T.4 | O dinheiro sem precisão declarada vira `decimal(38, 9)`; um valor que não cabe derruba a rodada | O padrão do dlt (`DLT dlt/common/arithmetics.py:18-19`); o kit não guarda precisão (`copy.ts:22`) | Mudar o padrão recria a coluna |
| T.5 | Os lagos que já existem são apagados e criados de novo pelo botão da Central, depois da segunda preparação | Estão vazios; não há `UpdateStack`, e o papel do Hub o nega (`C/infra/aws/lib/hub.ts:14-20`) | Construir o `UpdateStack` nesta etapa |
| T.6 | A tarefa em sub-redes públicas, IP público, sem NAT; x86; 2 vCPU | A forma medida: 30 tabelas em 180 s com 2 vCPU, 588 s com 1 (P1) | Trocar a sub-rede e a arquitetura na definição |
| T.7 | O gravador sobre a base do singer-sdk | A base já dá o laço, o lote, o estado depois de gravar, as colunas `_sdc_*` e o decimal (premissa 7 do estudo) | Voltar ao laço escrito à mão das provas |
| T.8 | O `clientToken` é a rodada e a tentativa, até 64 caracteres; o `startedBy` leva a rodada | O limite de 36 é de `StartTask` (`@aws-sdk/client-ecs@3.1175.0 dist-types/models/models_1.d.ts:3315`, `:3330`, `:3407`); a P4 casou identificadores de 40 caracteres. O fechamento corrige a 0076 | — |
| T.9 | Um cartão em três partes, cada uma usada pelo fundador, e não três cartões | O total, ~4.170, passa uns 4% das 4.000 da delivery L2, que é "should": a razão é que cada parte é usada e fechada sozinha (a maior, ~2.940), que é o que a L2 pede de um lote, e as decisões são as mesmas para as três; o corte do estudo fica, como as partes | Dividir o arquivo em três cartões, com as mesmas unidades; o gatilho está no orçamento |
| T.10 | O adaptador mora em `apps/extraction/tap/`, um pacote TypeScript do espaço de trabalho, ao lado do projeto Python | A trilha diz que `apps/extraction/` guarda "o tap gerado do kit" (`C/docs/steps/trilhas/dados.md`, "O que a trilha possui"); a imagem leva os dois | Mover para `packages/` |
| T.11 | O parâmetro da rodada leva a especificação inteira (`CopyTaskSpec`), no nível padrão, até 4 KB; uma especificação maior é recusada antes do `RunTask` | Um lugar só para o que a tarefa recebe, cifrado; as cinco declarações do Sankhya cabem com folga (`copies.ts:85-170`) | Passar a declaração pelo ambiente da tarefa e só o segredo pelo parâmetro |
| T.12 | Uma rodada aberta há mais de 6 horas é fechada pela varredura como `COPY_TASK_LOST` | A primeira carga estimada leva uns 27 minutos; 6 horas é teto de folga (code C26) | Mudar a constante |
| T.13 | Três códigos novos de rodada: `COPY_LAKE_UNAVAILABLE`, `COPY_TASK_LOST`, `COPY_LAKE_WRITE_FAILED`; um de ligar, `COPY_LAKE_NOT_READY`; e um da Amostra, `COPY_IN_LAKE` | Cada um tem uma frase diferente na tela e um dono do fim diferente | Fundir códigos |
| T.14 | A mensagem que falha três vezes vai à fila de mortos, lida só pelo firstmate | A forma da P4; um fim perdido é fechado pela varredura | Mudar o `maxReceiveCount` |
| T.15 | O lembrete sai às 8h de São Paulo, o fuso dos relógios das cópias (`clock.ts:11-12`), no começo do dia de trabalho | Nenhuma referência manda lembrete; o fundador disse "um lembrete por dia" sem hora | Mudar a constante do relógio do lembrete |

## U1 A D4

**Base e modelo.** O `main` no commit em que o G1 começa. Sonnet: uma conta com um dado a mais e
uma instrução a mais, num módulo.

### As linhas da tabela

- **Linha 25.** Ler na base: `appLoginPassword`, `C/packages/hub-api/src/app-login.ts:24-40`;
  `syncAddress`, `C/apps/server/src/platform/copy-sql.ts:174-179`; `ensureSync`, `:150-170`;
  `missingLogins`, `C/apps/server/src/platform/app-sql.ts:72-90`; `loginAddress` e a lista de
  logins de leitura, `C/apps/server/src/platform/copy-reader.ts:51-84`, `:155-168`. A referência:
  `ALTER ROLE ... PASSWORD` do PostgreSQL 18, e a prova do estudo em `sondas/d4-senhas/`
  (`d4-senhas.json`, `d4-troca.txt`): a sessão aberta com a senha antiga continua; uma conexão nova
  com ela é recusada; com a nova, entra; repetir não muda nada.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/app-login.ts` | Muda | `platform/copy-sql.ts`, `copy-reader.ts`, `app-sql.ts`, `company-postgres.ts`, `app-read.ts`, o despachante de `apps/edge/` (só `appLoginPassword`, que não muda) |
| `apps/server/src/platform/copy-sql.ts`, `copy-reader.ts`, `app-sql.ts` | Muda | `hub/copies/run.ts`, `hub/copies/sample.ts`, `platform/company-postgres.ts` |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/app-login.ts
/** The two logins every company's database has, the same names in every company (decision 0043). */
export const COMPANY_LOGINS = ['conexus_sync', 'conexus_read'] as const
export type CompanyLogin = (typeof COMPANY_LOGINS)[number]
/** HMAC-SHA-256(key, `${company}/${login}`) in base64url: the company makes it differ between companies. */
export function companyLoginPassword(input: Readonly<{ key: string; company: CompanyId; login: CompanyLogin }>): Promise<string>
```

- `appLoginPassword` não muda: os logins de app e de papel já levam um identificador no nome, e o
  despachante calcula a mesma senha.
- `syncAddress(context, host, company: CompanyId)` e o endereço do `conexus_read` ganham a empresa.
- **O dono do fato**: `COMPANY_LOGINS` é a lista única dos dois nomes; `SYNC_LOGIN` e `READ_LOGIN`
  passam a ser os seus membros (C26). Nenhuma coluna, rota ou código de falha novo.
- **O arquivo modelo**: `app-login.ts` (C21 não se aplica; C23, o `CompanyId` de marca; C26, a
  lista).

### As skills e a leitura

As linhas de `@neondatabase/serverless` e `pg` do `stack.md`: a skill `neon:neon-postgres`.

### A ordem do trabalho

1. **A conta com a empresa.** Critério: 1.
   - **Arquivos:** muda `packages/hub-api/src/app-login.ts`.
   - **O que entra:** `companyLoginPassword`, `COMPANY_LOGINS`. Regras: C26, C23.
   - **Testes:** `app-login.test.ts`, "a empresa entra só na conta dos dois logins da empresa":
     A e B dão senhas diferentes para cada um dos dois; `appLoginPassword` de um login de app dá o
     mesmo valor de hoje.
   - **Mutações à mão:** tirar a empresa da mensagem do HMAC: o teste fica vermelho.
2. **A senha posta a cada preparação.** Critérios: 2, 3.
   - **Arquivos:** muda `copy-sql.ts` (`ensureSync`, `syncAddress`), `copy-reader.ts`
     (`ensureReader`, `loginAddress` para o `conexus_read`), `app-sql.ts` (`missingLogins` usa a conta
     da empresa para os dois logins da empresa).
   - **O que entra:** quando o login existe, a transação de `ensureSync` e a de `ensureReader` levam
     `ALTER ROLE <login> PASSWORD '<senha da empresa>'`, depois do `ROLES_LOCK`; quando falta, o
     `CREATE ROLE` já nasce com ela. A rodada de hoje já chama as duas antes de ler
     (`C/apps/server/src/hub/copies/run.ts:181-192`), então a troca acontece antes de qualquer
     conexão com a senha nova. Regras: data D10; S40 (a senha nunca no registro).
   - **Testes:** `run.test.ts`, "a senha antiga é trocada antes da primeira rodada", num PostgreSQL
     local, com o login criado pela conta antiga; `sample.test.ts`, "a Amostra depois da troca".
   - **Mutações à mão:** tirar o `ALTER ROLE`: o 2 fica vermelho.
   - **Pronto quando:** a cópia de hoje roda numa empresa criada antes da mudança.
3. **O L.10.** Critério: 4. Num projeto de teste da Neon, com a palavra do fundador: o login criado
   pela conta antiga, a troca, a conexão com a nova na primeira tentativa, a recusa da antiga. O
   `ALTER ROLE` roda como o dono, que recebeu o login só com `SET` (`copy-sql.ts:158-161`): o L.10
   confere que a Neon deixa o dono que o criou trocar a senha. A
   saída vai no pull request.

### Como se prova

O 1 é uma função pura pelo índice do pacote. O 2 e o 3 entram pela rota de rodar agora e pela de
Amostra, com o PostgreSQL local; hoje o 2 falha, porque o login de A entra com a senha de B.

### Parar se

- Pela Neon a sessão aberta com a senha antiga cai na troca: a rodada que estava lendo termina; a
  unidade para e o firstmate decide se a troca espera a cópia aberta.
- Um terceiro lugar calcula a senha dos dois logins fora dos três arquivos do raio.

## U2 O kit para a cópia

**Base e modelo.** O `main` no commit em que o G2 começa. Opus: a sessão muda quem renova no Hub e
na tarefa, e erra em silêncio.

### As linhas da tabela

- **Linha 1.** Ler na base `C/packages/connectors/src/kernel/copy.ts:6` (`PAGE_ROWS`), `:66-97`,
  `:129-165`, e `kernel/operation.ts:148-167`. Seguir a forma do `page_size` por paginador de
  `CDK airbyte_cdk/sources/declarative/declarative_component_schema.yaml:2244-2271`: o tamanho é
  dado da declaração, com um padrão.
- **Linha 3.** Ler na base `C/apps/server/src/hub/connectors/limits.ts:127` (`createEndings`),
  `read.ts:111`, `check.ts:44`. Seguir `singer-sdk@0.54.9 singer_sdk/authenticators.py:526-527` e
  `:609-619` (a validade conferida antes de cada pedido; renova quando venceu). A forma é a da P2
  (87 linhas), refeita contra este contrato.
- **Linha 4.** A classe da credencial como dado do login (0077). Nenhuma referência a tem como dado;
  é remendo, com a medida do Sankhya (o token vence aos 300 s em uso, duas sessões convivem).
- **Linha 5.** Ler `C/apps/server/src/hub/connectors/wire.ts:71` e `kernel/list.ts:53-62`. Seguir o
  `JSON.parse` com `context.source` do Node 24 (o leitor recebe o texto de cada número) e
  `singer-sdk@0.54.9 singer_sdk/singerlib/json.py:40-44`, que faz o mesmo do lado do gravador.
- **O achado 4 do estudo.** Ler `C/packages/connectors/src/sankhya/fake.ts:226-227` e
  `hubspot/fake-data.ts:13-68`: os dublês não deixam mudar um registro.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Cria `session.ts`, `exact-json.ts` e os testes `session.test.ts`, `exact-json.test.ts`, `conformance.test.ts`; muda `copy.ts`, `auth.ts`, `list.ts`, `conformance.ts`, o índice | `apps/server/src/hub/connectors/`, `hub/copies/`, o adaptador (U3) |
| `packages/connectors/src/sankhya/`, `hubspot/`, `mercado-livre/` | Muda: a classe da credencial, o tamanho de página do Sankhya, as rotas de teste dos dois dublês | o kit; `hub/copies/test-sources.ts` |
| `apps/server/src/hub/connectors/` | Muda `read.ts`, `check.ts`, `limits.ts`, `wire.ts`, `copy-port.ts`: usam a sessão e o leitor do kit | `hub/copies/`, `hub/data/` |
| `apps/server/src/hub/copies/run.ts` | Muda: `RUN_DEFAULTS.pageRows` passa a vir do conector | `builder/copy-clock/` |

O `processo` lê um arquivo em `packages/connectors/src/<pasta>/` como da trilha do molde
(`scripts/tracks.ts`, `trackOfFile`); o pull request do G2 responde pelas duas trilhas.

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/auth.ts
/** What a renewal kills (0077): nothing, or the previous token; exclusive until a measurement says otherwise. */
export type CredentialClass = 'SHAREABLE' | 'EXCLUSIVE'
// ClientCredentialsAuth and OAuth2CodeAuth (`Auth`, auth.ts:21-40) gain: credentialClass: CredentialClass

// packages/connectors/src/kernel/session.ts
export type SessionState =
  | { kind: 'NONE' }
  | { kind: 'OPEN'; token: string; expiresAt: number }
  | { kind: 'CLOSED' }
export type Session = {
  /** The open token, renewed first when it ends within the margin; one renewal at a time. */
  token(signal: AbortSignal): Promise<string>
  /** One call, renewed and repeated once when the provider says the session ended. */
  call<T>(work: (token: string) => Promise<T>, signal: AbortSignal): Promise<T>
  /** Logs out what is open; repeatable. */
  close(signal: AbortSignal): Promise<void>
}
/** `send` is the caller's door to the provider: the Hub's in the Hub, the tap's in the task. */
export function openSession(input: Readonly<{ auth: Auth; credential: Credential; send: ProviderSend; now: () => number }>): Session

// packages/connectors/src/kernel/copy.ts
// a connector's copy declaration gains: pageRows?: number   (default COPY_PAGE_ROWS_DEFAULT = 500)
// packages/connectors/src/kernel/exact-json.ts
/** JSON.parse keeping each number's source text when it does not survive as a double. */
export function parseExact(text: string): unknown
// a connector gains: numbers: 'EXACT' | 'DOUBLE'
```

- **Cada estado** como união: `SessionState` por `kind` (C21).
- **O dono de cada fato**: o tamanho padrão `COPY_PAGE_ROWS_DEFAULT` em `copy.ts`; o 5.000 do
  Sankhya na declaração dele (C26); a margem de renovação, uma constante de `session.ts`.
- **O que se apaga**: `PAGE_ROWS`; o "renova e repete" de `read.ts:111` e `check.ts:44`; o
  `JSON.parse` de `wire.ts:71`.
- `ProviderSend` é a assinatura que `tokenRequest` e `logoutRequest` já pressupõem
  (`auth.ts:69`, `:88`): um `ProviderRequest` entra, um `ProviderAnswer` sai. Se o kit já tiver esse
  tipo com outro nome, a unidade usa o dele.
- **O arquivo modelo**: nenhum declarado; o cartão não conferiu C21 e C26 num arquivo do kit, e a
  unidade segue as regras direto.
- As rotas de teste dos dublês: `POST /__teste/notas/<id>` (alterar, criar, apagar) no Sankhya e
  `POST /__teste/negocios/<id>` no HubSpot, só no modo dublê (T29); o modo real não as registra.

### As skills e a leitura

As linhas de `packages/connectors` do `stack.md`. O guia de testes, T5 e T29.

### A ordem do trabalho

1. **O que sai.** Critério: 8. Apagar `PAGE_ROWS` e a cópia de `RUN_DEFAULTS.pageRows`; o tamanho
   passa a ser lido da declaração.
2. **A classe da credencial.** Critério: 7. `credentialClass` em cada login do kit; a conformidade
   recusa um login sem ela. Testes: `conformance.test.ts`, "a classe da credencial".
3. **A sessão.** Critérios: 5, 6.
   - **Arquivos:** cria `kernel/session.ts`; muda `hub/connectors/limits.ts`, `read.ts`, `check.ts`.
   - **Referência a seguir:** `singer_sdk/authenticators.py:609-619`.
   - **O que entra:** uma renovação por vez (a promessa em curso é reusada), a margem antes do fim,
     o logout do token velho depois de trocar, `call` que repete uma vez. Regras: C21, C50.
   - **Testes:** `session.test.ts` com o dublê do Sankhya e o relógio de teste: uma cópia de 400 s
     renova duas vezes e não deixa sessão aberta; uma recusa de sessão vencida repete uma vez.
   - **Mutações à mão:** tirar o logout: o teste conta uma sessão aberta e fica vermelho.
4. **O número exato.** Critério: 9. `parseExact` com `context.source`; `wire.ts` passa a chamá-lo
   pelo índice do kit para o conector com `numbers: 'EXACT'` (o Sankhya).
5. **Os dublês.** Critérios: 9, 10. As rotas de teste mudam o banco em memória do Sankhya e os dados
   do HubSpot entre duas leituras; o modo real não as tem. O dublê do Sankhya guarda `VLRNOTA` como
   texto (hoje `REAL`, `C/packages/connectors/src/sankhya/fake-sales.ts:131`) e ganha uma venda de
   `1234567890123.123456`, que os critérios 15 e 22 somam. Testes: `sankhya/fake.test.ts` e
   `hubspot/fake.test.ts`, que a unidade cria.

### Como se prova

O 5 entra pela sessão do índice do kit contra o dublê; o 6 pelas rotas de leitura e conferência do
Hub, com os casos de hoje; o 9 por `parseExact` com o corpo em bytes e por `wire.ts` com um corpo
gravado de número de 20 dígitos, que hoje o `JSON.parse` corta, e pela venda de 19 dígitos do dublê,
que hoje o `REAL` corta.

### Parar se

- Um conector de hoje depende do "repete uma vez" no Hub de um jeito que a sessão não cobre (uma
  recusa que não é de sessão vencida): o builder lista o caso e para.
- O dublê do HubSpot precisaria de uma resposta que a gravação não tem (T29).

## U3 O adaptador

**Base e modelo.** O G2 mesclado e a mudança de método. Opus: é o contrato entre o kit e o Singer,
e a 0071 o quer sem nome de conector.

### As linhas da tabela

- **Linha 2.** Ler na base o laço de páginas que o adaptador substitui na tarefa:
  `C/apps/server/src/hub/copies/source-pass.ts:194-212` e `hub/connectors/copy-port.ts:243-315`.
  Seguir `TRM tap_rest_api_msdk/tap.py:455` e `:506-540` (as tabelas nascem num laço sobre a
  configuração) e `CDK .../concurrent_declarative_source.py:165`. O ponto de partida é a sonda do
  estudo, `sondas/adaptador-duas-classes/` (344 linhas), reescrita contra este contrato.
- **Linha 7.** O leitor manda a versão da passada em cada linha e o `ACTIVATE_VERSION` no fim:
  `singer-sdk@0.54.9 singer_sdk/target_base.py:430-448`.
- **Linha 1.** A declaração de cada tabela é a do kit (U2), lida pelo índice.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/extraction/tap/` | Cria: `package.json`, `src/tap.ts`, `src/messages.ts`, `src/tap.test.ts` | a imagem (U4); o `meltano.yml` (U4) |
| `package.json`, `package-lock.json` da raiz | Muda: o espaço de trabalho novo | a CI |

### Os contratos que a unidade cria

```ts
// apps/extraction/tap/src/tap.ts — the command line, Singer's
//   tap --about | --discover --config <file> | --config <file> --catalog <file> [--state <file>]
// config: { connector: ConnectorId, definition: CopyDefinition, account: AccountRef | null,
//           secret_path: string, result_path: string, whole: boolean }
// apps/extraction/tap/src/messages.ts
export type SingerMessage =
  | { type: 'SCHEMA'; stream: string; schema: JsonSchema; key_properties: string[] }
  | { type: 'RECORD'; stream: string; record: Record<string, unknown>; version?: number }
  | { type: 'STATE'; value: TapState }
  | { type: 'ACTIVATE_VERSION'; stream: string; version: number }
/** What the tap writes to result_path when the source stops it: the kit's code, never a body. */
export type TapFailure = { code: CopySourceFailureCode; system: CopySystemMessage | null }
```

- **O esquema Zod de cada entrada externa** (C27): a configuração, o catálogo e o estado que o
  Meltano entrega em arquivos, lidos com Zod antes de qualquer chamada.
- **O dono do fato**: os nomes das mensagens Singer, só em `messages.ts`; os códigos de falha são os
  do kit.
- **O que o adaptador não faz**: não lê variável de ambiente para o segredo (lê `secret_path`); não
  importa nada fora do índice de `@conexus/connectors`; não nomeia conector (a regra de máquina da
  mudança de método).
- **O arquivo modelo**: nenhum declarado; a unidade segue C21, C26 e C27 direto.

### As skills e a leitura

As linhas do Meltano e do singer-sdk que a mudança de método acrescenta ao `stack.md`; a
especificação do Singer que ela cita.

### A ordem do trabalho

1. **`--about` e `--discover`.** Critério: 11. Do índice do kit, para cada declaração de tabela.
2. **A leitura.** Critérios: 12, 13, 66. A sessão do kit (U2), uma página por vez com o tamanho do
   conector, `STATE` depois de cada página, a versão da passada inteira, `ACTIVATE_VERSION` no fim; a
   recusa da fonte escreve `TapFailure` em `result_path` e sai com código 1. A janela da declaração
   (`window`) dá o começo da leitura como o motor de hoje (`C/apps/server/src/hub/copies/source-pass.ts:37-46`,
   `datesOf`): numa passada inteira, a janela inteira; numa só do que mudou (parte 2), as mudadas
   dentro dela.
   - **Testes:** `tap.test.ts` contra os dublês do Sankhya e do HubSpot; `test_tap_battery.py` roda a
     bateria padrão do singer-sdk sobre a saída gravada.
   - **Mutações à mão:** emitir o `STATE` antes do `RECORD` da página: a bateria fica vermelha.
3. **A regra.** Critério: 14. O caso plantado no teste da regra da mudança de método.

### Como se prova

Pela linha de comando, com os arquivos que o Meltano entregaria, contra os dublês; a saída crua
passa na bateria do singer-sdk. Hoje nada disso existe.

### Parar se

- Uma declaração do kit precisa de algo que o adaptador só faria nomeando o conector.
- A bateria do singer-sdk recusa uma forma que o kit declara de propósito (a chave composta do
  Sankhya, a conta do HubSpot).

## G1 O ponto de conferência

Depois da U1: a cópia de hoje rodada no Hub local numa empresa criada antes da mudança, e a Amostra
dela; o L.10 num projeto de teste da Neon.

## G2 O ponto de conferência

Depois da U3: os testes do kit, do Hub (`hub/connectors/`, `hub/copies/`) e do adaptador; uma cópia
do banco de hoje rodada no Hub local contra o dublê do Sankhya, que lê páginas de 5.000 e termina
**Em dia**; `tap --discover` e uma passada inteira pela linha de comando contra os dois dublês.

## U4 A tarefa

**Base e modelo.** O G2 mesclado e a mudança de método. Opus: a tarefa é o outro lado do fim da
rodada (0076), e o segredo atravessa o Meltano (S31).

### As linhas da tabela

- **Linha 6.** Seguir `singer-sdk@0.54.9 singer_sdk/target_base.py:479-492` (o estado só sai depois
  dos lotes gravados), `sinks/core.py:135` e `:475-506` (as colunas `_sdc_*`, com
  `add_record_metadata` ligado), e `pyiceberg@0.12.0 pyiceberg/table/__init__.py:1705-1724`
  (`append`, uma transação, uma foto) e `:1123-1158` (o commit refeito 4 vezes). O ponto de partida é
  o gravador da sonda (165 linhas).
- **Linha 7.** A propriedade da tabela que diz qual versão da passada está completa, escrita no
  `ACTIVATE_VERSION` (`target_base.py:430-448`).
- **Linha 8.** `meltano@4.4.1 meltano/schemas/meltano.schema.json:335-337` (um `executable` basta);
  `core/plugin/singer/tap.py:211-214` (os três arquivos da rodada); `cli/run.py:48-126`
  (`--full-refresh`); `cli/run.py:297-311` (o código 1 para toda falha: quem diz o motivo é a
  entrada).
- **Linha 10.** `meltano@4.4.1 meltano/core/plugin_invoker.py:276`, `:429-439`: toda configuração
  vai ao ambiente; só o caminho do arquivo do segredo é configuração. A saída da sonda,
  `env-names-seen-by-tap.txt`.
- **Linha 5.** `singer-sdk@0.54.9 singer_sdk/singerlib/json.py:40-44` (`parse_float=decimal.Decimal`).
- **Linha 11.** A imagem da P1: `python:3.13-slim`, Meltano 4.4.1, x86.
- **Linha 14.** A tarefa manda o próprio resultado; a parada do ECS fecha o que sobrar (0076).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/extraction/` | Cria: `pyproject.toml`, `uv.lock`, `meltano.yml`, `Dockerfile`, `src/conexus_extraction/{entry,target,contract}.py`, `contract/copy-task.schema.json` (gerado), `tests/` | a Release (U5); a CI de Python da mudança de método |
| `apps/server/src/hub/copies/lake-task.ts` | Cria: os esquemas `CopyTaskSpec` e `CopyTaskResult`, donos do contrato | U7; o gerador do esquema JSON |
| `apps/server/src/platform/recordings/aws/` | Cria: a gravação de `SendMessage` e de `GetParameter` | os testes da U4 e da U7 |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/copies/lake-task.ts — the owner; contract/copy-task.schema.json is generated
// from it with z.toJSONSchema, and the task validates against the generated file.
export const CopyTaskSpec = z.object({
  version: z.literal(1),
  runId: CopyRunId,
  attempt: z.int().min(1),
  companyId: CompanyId,
  connector: ConnectorId,
  definition: CopyDefinition,          // the kit's, as the copy row keeps it
  account: AccountRef.nullable(),
  credential: z.record(z.string(), z.string()),  // the opened seal; only here, never in the task's environment
  whole: z.boolean(),
  lake: z.object({ bucketArn: z.string(), region: AwsRegion, table: CopyName }),
  queueUrl: z.url(),
})
export const CopyTaskResult = z.object({
  type: z.literal('RESULT'),
  version: z.literal(1),
  runId: CopyRunId,
  attempt: z.int().min(1),
  outcome: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('COMPLETE'), rows: z.int().min(0) }),
    z.object({ kind: z.literal('ERROR'), code: CopyRunFailureCode, system: CopySystemMessage.nullable() }),
  ]),
  read: z.int().min(0),
  written: z.int().min(0),
  pages: z.int().min(0),
  whole: z.boolean(),
})
```

- **Cada estado** como união: `outcome` por `kind` (C21). Uma rodada parada porque o parâmetro sumiu
  não manda resultado.
- **Cada id** com a sua marca: `CopyRunId`, `CompanyId` (C23), conferidos pela U7 ao ler.
- **O dono do fato**: `lake-task.ts`; o Python não redeclara a forma, só valida contra o esquema
  gerado (C26). `lake-task.test.ts` compara o arquivo gerado com o que o Zod gera hoje.
- **O esquema de cada entrada externa** (C27): a especificação lida do parâmetro, validada antes de
  qualquer outra coisa; uma inválida termina a tarefa com código de saída e sem resultado, e a parada
  do ECS fecha a rodada (`COPY_TASK_LOST`).
- **O ambiente da tarefa** tem só `CONEXUS_RUN_PARAMETER` (o nome do parâmetro) e a região.
- **O arquivo modelo**: nenhum declarado; a unidade segue C21, C23 e C26 direto.

### As skills e a leitura

As linhas do Meltano, do singer-sdk, do PyIceberg, do pyarrow e do `uv` que a mudança de método
acrescenta ao `stack.md`; as linhas de `@aws-sdk/client-sqs` e `client-ssm`. A security S31 e S41.

### A ordem do trabalho

1. **O projeto.** Critério: 15. `pyproject.toml` com as versões do cabeçalho deste cartão, `uv.lock`,
   `meltano.yml` com `tap-conexus` (o `executable` do adaptador) e `target-conexus`.
2. **O gravador.** Critérios: 15, 16.
   - **Arquivos:** cria `target.py`.
   - **Referência a seguir:** `target_base.py:479-492`; `table/__init__.py:1705-1724`.
   - **O que entra:** o `Target` e o `BatchSink` do singer-sdk; o esquema Arrow da declaração, o
     número em `decimal(38, 9)` pelo texto exato (T.4), `append` por lote, a propriedade da versão no
     `ACTIVATE_VERSION`. Um valor que não cabe levanta antes do `append`. O catálogo é o REST do `S3`
     Tables com SigV4 na AWS e um catálogo local nos testes. Regras: C50, C26.
   - **Testes:** `test_target.py` com o catálogo local e as linhas do dublê do Sankhya gravadas.
   - **Mutações à mão:** gravar o número por `float`: a soma fica diferente e o 15 fica vermelho.
3. **A entrada.** Critérios: 17, 18, 19.
   - **Arquivos:** cria `entry.py`, `contract.py`; cria `lake-task.ts` e o esquema gerado.
   - **O que entra:** lê o parâmetro, valida, grava o segredo num arquivo `0600`, monta a
     configuração do leitor e do gravador só com caminhos, chama `meltano run` (com `--full-refresh`
     quando `whole`), lê o resultado do leitor e as contagens do gravador, manda um `CopyTaskResult`.
     O gravador confere o parâmetro antes de cada `append` e, sem ele, sai sem gravar o lote.
     Regras: S31, S41, C51.
   - **Testes:** `test_entry.py` com a gravação do `GetParameter` e do `SendMessage`: o ambiente que
     o leitor e o gravador recebem não tem um campo do segredo; um resultado por rodada; o parâmetro
     apagado no meio para a tarefa sem resultado.
   - **Mutações à mão:** pôr o segredo na configuração do Meltano: o 17 fica vermelho.
4. **A imagem.** Critério: 20. `Dockerfile` em dois estágios: o adaptador em um arquivo só, com o
   Node 24; o Python 3.13 com `uv sync --frozen`; `x86_64`.
5. **Os testes na AWS.** Critérios: 20, 21, 22 (L.1, L.3, L.5), na conta de laboratório, com a imagem
   que a U5 publica; a saída vai no pull request do G3. O commit da U4 fecha com os critérios 15 a 19;
   o 20 a 22 fecham no ponto de conferência do G3, depois da U5.

### Como se prova

O 15 e o 16 entram pelo `meltano run` com o catálogo local. O 17 a 19 entram pela entrada, com as
gravações da AWS. O 20 a 22 só na AWS; hoje nenhum existe.

### Parar se

- O catálogo REST do `S3 Tables` recusa a forma que o PyIceberg 0.12 manda (L.1).
- O Meltano passa ao gravador algo do leitor pelo ambiente que inclua o segredo.
- A conferência do parâmetro a cada lote, somada ao lote do SDK (10.000 linhas ou 5 minutos), não
  para a tarefa antes de 5 minutos: o builder mede e diz ao firstmate.

## U5 A plataforma da cópia

**Base e modelo.** A U4 e a segunda preparação. Opus: são poderes novos de três papéis, e um erro
abre o lago de uma empresa a outra.

### As linhas da tabela

- **Linha 22.** Ler na base `C/infra/aws/lib/platform.ts:114-123` (o teto), `:126-193` (o papel do
  robô, que só cria `conexus-*-leitor`), `C/infra/aws/lib/lake.ts:116-180` (o papel que lê, a forma
  que o que escreve segue), `C/infra/aws/lib/preparation.ts:209-262` e `C/infra/aws/lib/hub.ts:14-20`.
- **Linha 23.** `aws-cdk-lib@2.278.0`: `aws-ecs/lib/fargate/fargate-task-definition.d.ts`,
  `aws-sqs/lib/queue.d.ts`, `aws-events/lib/rule.d.ts`, `aws-ecr/lib/repository.d.ts`, lidos pelo
  builder na versão instalada; a forma medida à mão, `conexus-lab-trilho/fases2a4/plataforma.py:80-90`.
- **Linha 12.** Sub-redes públicas, IP público, sem NAT (T.6).
- **Linha 11.** A Release monta a imagem; a do Hub continua no `ghcr.io` (`C/.github/workflows/publish.yml:73-110`).
- **Linha 21.** O Hub ganha `s3tables:ListTables` e `DeleteTable` nos depósitos de lago
  (`C/infra/aws/test/platform.test.ts:74-86` mostra que hoje não tem).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `infra/aws/lib/` | Cria `copy.ts`; muda `platform.ts` (o teto, o papel do robô, o do Hub), `lake.ts` (o papel que escreve), `names.ts`, `preparation.ts` | `infra/aws/bin/`; `apps/server/src/platform/aws.ts` lê os nomes pelos testes |
| `infra/aws/lake.template.json` | Gerado de novo | o Hub, pela Release |
| `infra/aws/test/` | Muda | — |
| `.github/workflows/aws-platform.yml` | Muda: monta, confere e publica a imagem antes da plataforma | a Release |
| `docs/how-to/aws-conta-de-laboratorio.md` | Muda: o passo a passo da segunda preparação | o firstmate |

### Os contratos que a unidade cria

- **Os nomes** (`infra/aws/lib/names.ts`, o dono, C26): `WRITER_SUFFIX = '-escritor'`;
  `COPY_CLUSTER = 'conexus-copia'`; `COPY_TASK_FAMILY = 'conexus-copia'`;
  `COPY_REPOSITORY = 'conexus-copia'`; `COPY_QUEUE = 'conexus-copia-fim'` e a de mortos
  `conexus-copia-fim-mortos`; `RUN_PARAMETER_PREFIX = '/conexus/copia/'` (o parâmetro de uma rodada é
  `/conexus/copia/<empresa>/<rodada>`); `COPY_EXECUTION_ROLE = 'conexus-copia-execucao'`, que entra
  em `PLATFORM_ROLES`.
- **As saídas da plataforma** que o Hub lê da configuração: o ARN do cluster, da definição de tarefa,
  da fila, e as sub-redes e o grupo de segurança da tarefa.
- **O papel que escreve**, na receita: `conexus-<lago>-escritor`, com o teto, a etiqueta da empresa,
  confiando só em `ecs-tasks.amazonaws.com` com `aws:SourceAccount`; grava nas duas áreas do lago da
  empresa pelas concessões do Lake Formation por nome; lê só `/conexus/copia/<empresa>/*`; manda
  mensagem só à fila da cópia.
- **O teto**: acrescenta a escrita nas tabelas das duas áreas (`raw` e `current`) dos depósitos `conexus-*`, a leitura de parâmetros sob
  `/conexus/copia/` e o envio à fila; continua sem `iam:*`.
- **O papel do Hub**: `ecs:RunTask` só na definição da cópia, com `ecs:cluster` igual ao cluster;
  `ecs:StopTask`, `ecs:DescribeTasks` e `ecs:ListTasks` só no cluster; `iam:PassRole` só em `role/conexus-*-escritor`
  com `iam:PassedToService` igual a `ecs-tasks.amazonaws.com`, e no papel de execução;
  `ssm:PutParameter`, `ssm:DeleteParameter` em `parameter/conexus/copia/*`; `sqs:ReceiveMessage`,
  `sqs:DeleteMessage` na fila; `s3tables:ListTables`, `s3tables:DeleteTable` nos depósitos de lago.
- **O estado, o id e a entrada**: nenhuma união nem id novo no código da plataforma; os nomes são
  constantes; o CDK valida as entradas. Arquivo modelo: `infra/aws/lib/lake.ts`, o papel que lê.
- **A regra**: o evento "ECS Task State Change" com `lastStatus` `STOPPED` do cluster da cópia vai à
  fila; a fila só aceita mensagem dessa regra e dos papéis que escrevem.

### As skills e a leitura

As linhas de `aws-cdk-lib`, `aws-cdk` e `constructs` do `stack.md`: as skills `aws-cdk` e `aws-iam`.
A security S36 e S40.

### A ordem do trabalho

1. **Os nomes e a plataforma da cópia.** Critério: 23. Cria `copy.ts` e o chama de `PlatformStack`.
   Testes: `platform.test.ts`, "a plataforma da cópia", pelas asserções do `aws-cdk-lib`.
2. **O papel que escreve e o teto.** Critério: 24. Em `lake.ts` e `platform.ts`; o robô ganha
   `iam:CreateRole` em `role/conexus-*-escritor` com a condição do teto, como faz hoje com os que
   leem (`platform.ts:139-144`), e as ações de cuidar deles, as mesmas de `TendReaders`
   (`platform.ts:145-149`), para apagar e etiquetar o papel. Testes: `lake.test.ts`, "o papel que
   escreve".
   - **Mutações à mão:** tirar a condição do teto na criação: o teste fica vermelho.
3. **Os poderes do Hub.** Critério: 26. Testes: `platform.test.ts`, "os poderes do Hub", que lista
   cada ação e cada recurso e recusa qualquer outro.
4. **A preparação e a Release.** Critérios: 27, 28. O passo a passo da segunda preparação; o workflow
   monta a imagem, roda `tap --about` e `meltano --version` nela, publica no depósito de imagens e
   passa o digest ao `cdk deploy`.
5. **Os testes na AWS.** Critérios: 29, 25 (L.2 primeiro, depois L.6). Se o L.2 falhar, a unidade para.

### Como se prova

O 23, o 24, o 26 e o 27 pelo `cdk synth` com as asserções; o 28 pelo teste dos workflows; o 25 e o
29 só na conta de laboratório. Hoje nenhum existe.

### Parar se

- O L.2 falha: o gateway do Sankhya recusa o endereço da AWS. Volta ao fundador (0071).
- O Lake Formation não aceita a concessão de escrita ao papel novo dentro da pilha (L.6): a forma da
  etapa 1 para o que lê pediu o robô administrador; o builder para e o firstmate leva ao fundador.
- A preparação precisa de um poder da Release além das peças do critério 23.

## G3 O ponto de conferência

Depois da U5: `cdk synth` com as asserções; a imagem montada pela Release na conta de laboratório; o
L.2 antes de tudo, depois o L.1, o L.3, o L.5 e o L.6, cada um com a saída no pull request; os testes de
Python pela CI da mudança de método.

## U6 A migração e a permissão

**Base e modelo.** O `main` no commit em que o G4 começa. Sonnet: uma migração que só acrescenta e
uma permissão nomeada.

### As linhas da tabela

- **Linha 17.** Ler `C/apps/server/src/hub/copies/tables.ts:39-143` (`copy`, `copy_run`) e `:78`
  (`copy_company_id_name_key`).
- **Linha 28.** Ler `C/apps/server/src/hub/lake/tables.ts:48-56`: hoje só o operador alcança a
  linha. Seguir a forma de política e a permissão por coluna do PostgreSQL que `database-grants.sql`
  já usa.
- **Linha 29.** O índice único sobre `(company_id, place, name)`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/tables.ts` | Muda: `place`; `task_arn`, `attempt`; o teto de `system_code` | todo `hub/copies/` |
| `apps/server/src/hub/lake/tables.ts` | Muda: a política de leitura da empresa | `hub/lake/`; U7 |
| `apps/server/src/hub/notifications/tables.ts`, `docs/architecture.md` (as exceções do roll-back) | Apaga `copy_follower` e `copy_notice`; uma linha nas exceções (data D6) | nenhum código as lê |
| `apps/server/drizzle/`, `database-grants.sql`, a foto do catálogo | Cria duas migrações; muda as permissões | `migrate`; `catalog.test.ts` |
| `packages/hub-api/src/copies.ts` | Muda: `CopyPlace` | U7, U8 |

### Os contratos que a unidade cria

| Tabela | Coluna | Tipo | Restrição | Ao apagar |
| --- | --- | --- | --- | --- |
| `copies.copy` | `place` | `text` | `NOT NULL DEFAULT 'DATABASE'`, `CHECK (place IN ('DATABASE', 'LAKE'))` | — |
| `copies.copy` | — | — | `UNIQUE (company_id, place, name)`, `copy_company_id_place_name_key`; a `copy_company_id_name_key` sai na segunda migração (data D6) | — |
| `copies.copy_run` | `task_arn` | `text` | nulo; `CHECK (task_arn IS NULL OR task_arn LIKE 'arn:aws:ecs:%')` | — |
| `copies.copy_run` | `attempt` | `integer` | `NOT NULL DEFAULT 1`, `CHECK (attempt >= 1)` | — |
| `copies.copy_run` | `system_code` | `text` | `CHECK (char_length(system_code) <= SYSTEM_CODE_MAX)` (#1135) | — |
| `lake.company_lake` | — | — | política `select` para o login da empresa, `company_id = <empresa da sessão>`; `GRANT SELECT (company_id, lake_id, state, account, region)` | — |

```ts
// packages/hub-api/src/copies.ts
export const CopyPlace = z.enum(['DATABASE', 'LAKE'])
export type CopyPlace = z.infer<typeof CopyPlace>
// packages/hub-api/src/copy-shown.ts, beside SYSTEM_MESSAGE_MAX
export const SYSTEM_CODE_MAX = 64
```

- Nenhuma chave estrangeira nova. Saem `notifications.copy_follower` e `notifications.copy_notice`,
  que nenhum código lê, nesta migração e não na U10: a conferência `copy_notice_code` repete
  `CopyRunFailureCode` no banco (`C/apps/server/src/hub/notifications/tables.ts:35`, `:230`), e a U7
  acrescenta códigos a ela.
- **O arquivo modelo**: `apps/server/src/hub/lake/tables.ts`.
- **O dono do fato**: `CopyPlace` em `hub-api`; o teto do código ao lado do da mensagem (C26).

### As skills e a leitura

As linhas de `drizzle-orm`, `drizzle-kit` e `pg` do `stack.md`: a skill `drizzle`. O guia de dados,
D6, D10, D11, D15.

### A ordem do trabalho

1. **As colunas e o nome por lugar.** Critérios: 30, 44 (a conferência do teto). A primeira migração
   acrescenta e tira as duas tabelas sem uso; a segunda tira a restrição antiga. Testes: `tables.test.ts`, "o nome é único por lugar".
2. **A leitura da linha do lago.** Critério: 31. A política e a permissão por coluna; a foto do
   catálogo. Testes: `lake/tables.test.ts`, "a empresa lê a sua linha": lê a própria, não acha a de
   outra, é recusada ao gravar, mudar e apagar.
   - **Mutações à mão:** tirar a condição da empresa na política: o teste fica vermelho.

### Como se prova

Pelo `migrate` num PostgreSQL local e pelas leituras com o login da empresa. Hoje a segunda cópia
`vendas` é recusada e a empresa não vê a linha do lago.

### Parar se

- A conferência de migrações recusa tirar a restrição na mesma etapa: a segunda migração vai para o
  primeiro pull request depois, e o firstmate diz ao fundador.
- Uma leitura de hoje depende de `copy_company_id_name_key` (um `ON CONFLICT` por nome).
- Um código de hoje ainda lê `copy_follower` ou `copy_notice`.

## G4 O ponto de conferência

Depois da U6: o `migrate` num PostgreSQL local, a foto do catálogo, o `catalog.test.ts`; o Hub local
lista as cópias de hoje sem mudança.

## U7 O disparo e o fim

**Base e modelo.** O G3 e o G4 mesclados. Opus: concorrência entre o relógio, a fila e a varredura,
e o fim de uma rodada que roda fora do Hub.

### As linhas da tabela

- **Linha 13.** Ler `C/apps/server/src/builder/copy-clock/clock.ts:12-25`, `workflow.ts:25-78` (o
  passo que chama a rodada), `C/apps/server/src/hub/copies/run.ts:37-75` (a posse, que a cópia do
  lago não usa) e `tables.ts:139` (o índice de uma rodada aberta). Seguir
  `@aws-sdk/client-ecs@3.1175.0 dist-types/models/models_1.d.ts:3243-3343` (`RunTaskRequest`) e
  `:2858` (`taskRoleArn` em `TaskOverride`); a forma da P3 e da P4 (`EST/p4-fim-na-aws`).
- **Linha 14.** Ler `run.ts:116-165` (`ended`: a linha fechada, as 100 mais novas, o registro);
  seguir `@aws-sdk/client-sqs@3.1175.0 dist-types/models/models_0.d.ts:1373` (`WaitTimeSeconds`) e o
  evento da regra (campos em `EST/p4-fim-na-aws:151`).
- **Linha 10.** O parâmetro da rodada, gravado pelo Hub, lido pela tarefa, apagado no fim (0077).
- **Linha 20.** Ler `C/apps/server/src/hub/copies/routes.ts:47-118` e `leave.ts:210-285`
  (`deleteCopy`, `droppedTable`, `removeSchedules`).
- **Linha 21.** Ler `C/apps/server/src/platform/aws.ts:279-296` (`clearLeftover`) e
  `C/apps/server/src/hub/lake/lake.ts:149-160`, `:273-315` (`sendDelete`, `remove`, `release`);
  seguir `@aws-sdk/client-s3tables@3.1175.0` `ListTablesCommand.d.ts`, `DeleteTableCommand.d.ts`,
  lidos pelo builder.
- **Linha 27.** As gravações novas no servidor de respostas gravadas da etapa 1.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/aws.ts`, `config-aws.ts`, `test-aws.ts`, `recordings/aws/` | Muda: as portas `CopyTasks` e `LakeTables`, os nomes da U5, as saídas da plataforma na configuração; os dublês | `hub/copies/`, `hub/lake/`, a QA |
| `apps/server/src/hub/copies/` | Cria `lake-run.ts`, `lake-queue.ts`; muda `service.ts`, `enable.ts`, `list.ts`, `routes.ts`, `leave.ts`, `run.ts` (o teto do código), `catalog-view.ts`, `role-copies.ts`, `readers.ts`, `project-view.ts`, `sample.ts` (a cópia do lago fica de fora) | `builder/copy-clock/`, `hub/data/`, `hub/projects/` |
| `apps/server/src/hub/lake/lake.ts` | Muda: apagar o lago apaga as tabelas e as cópias do lago | `hub/operations/` |
| `apps/server/src/builder/copy-clock/workflow.ts` | Muda: o passo aceita `STARTED` | o relógio |
| `packages/hub-api/src/copies.ts`, `copy-failures.ts`, `failures.ts` | Muda: `place`, `places`, os códigos novos | U8; a outra trilha lê `CopySummary` |
| a subida do servidor | Muda: o consumidor da fila | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/copies.ts
CopySummary            // gains: place: CopyPlace
EnableCopyFromModel    // gains: place: CopyPlace.default('DATABASE'); the PROPOSAL variant stays DATABASE
listCopyModels         // success body gains: places: z.array(CopyPlace).min(1)
CopyRunFailureCode     // gains: 'COPY_LAKE_UNAVAILABLE' | 'COPY_TASK_LOST' | 'COPY_LAKE_WRITE_FAILED'
enableCopy             // failures gain: 'COPY_LAKE_NOT_READY' (409)

// apps/server/src/platform/aws.ts — the one adapter (C56)
export const TaskArn = z.string().startsWith('arn:aws:ecs:').brand('TaskArn')
export const RunParameter = z.string().startsWith('/conexus/copia/').brand('RunParameter')
export type CopyTasks = {
  putRun(at: Where, run: { name: RunParameter; spec: string }): Promise<AwsAnswer<void>>
  /** A parameter AWS no longer has counts as deleted. */
  deleteRun(at: Where, name: RunParameter): Promise<AwsAnswer<void>>
  start(at: Where, run: { token: string; startedBy: CopyRunId; writer: string; parameter: RunParameter }): Promise<AwsAnswer<TaskArn>>
  stop(at: Where, task: TaskArn): Promise<AwsAnswer<void>>
  state(at: Where, task: TaskArn): Promise<AwsAnswer<'RUNNING' | 'STOPPED' | 'MISSING'>>
}
export type CopyQueue = {
  /** One long poll of up to 20 s; never touches the database. */
  receive(signal: AbortSignal): Promise<AwsAnswer<readonly { handle: string; body: string }[]>>
  acknowledge(handle: string): Promise<AwsAnswer<void>>
}
export type LakeTables = {
  list(at: Where, lake: LakeId): Promise<AwsAnswer<readonly { namespace: 'raw' | 'current'; name: string }[]>>
  /** A table AWS no longer has counts as dropped. */
  drop(at: Where, lake: LakeId, table: { namespace: 'raw' | 'current'; name: string }): Promise<AwsAnswer<void>>
}

// apps/server/src/hub/copies/lake-queue.ts
export const CopyQueueMessage = z.discriminatedUnion('type', [
  CopyTaskResult,                          // lake-task.ts (U4)
  z.object({ type: z.literal('ECS_STOPPED'), runId: CopyRunId, task: TaskArn, stopCode: z.string(), exitCode: z.int().nullable() }),
])
// built from the EventBridge event by one parser; the raw event never leaves the file
```

- **Cada estado** como união: a mensagem por `type`, o resultado por `kind`; o estado da tarefa
  como três literais (C21).
- **Cada id** com a sua marca: `TaskArn`, `RunParameter`, `CopyRunId`, conferido contra
  `copy_run.id` antes de fechar; uma mensagem de rodada que não existe é apagada da fila com
  `COPY_QUEUE_UNREADABLE` (C23).
- **O dono de cada fato** (C26): os nomes, em `infra/aws/lib/names.ts`, conferidos por `aws.test.ts`
  contra `lake.template.json`, como hoje; o teto de 6 horas e o de 4 KB em `lake-run.ts`; o
  `clientToken` `<rodada>-<tentativa>` só em `lake-run.ts` (T.8).
- **O esquema Zod de cada entrada externa** (C27): a mensagem da fila, o evento do ECS, a resposta
  de cada chamada da AWS.
- **Quem fecha**: uma função só, `closeLakeRun`, chamada pela fila e pela varredura; fecha com
  `UPDATE copy_run ... WHERE id = $1 AND ended_at IS NULL RETURNING`, e só quem recebe a linha muda
  `copy.last_run_id` e `copy.rows`, apaga o parâmetro e registra `COPY_RUN_ENDED`.
- **O consumidor** só lê a fila enquanto há rodada do lago aberta que o Hub conhece: o disparo o
  acorda; ao subir, o Hub lê uma vez as rodadas abertas do lago (data D27).
- **A cópia do lago fora do banco**: `enable.ts` não chama `ensureSync`, `ensureReader`,
  `ensureCopyTable` nem `released` para `place: LAKE` (`C/apps/server/src/hub/copies/enable.ts:158-196`);
  `catalog-view.ts`, `role-copies.ts`, `readers.ts` e `project-view.ts` leem só `place = 'DATABASE'`;
  a Amostra responde 409 `COPY_IN_LAKE`.
- **A varredura sem `task_arn`**: uma rodada aberta sem `task_arn` acha a tarefa pelo `startedBy`
  (`ListTasks`); sem tarefa, fecha como `COPY_TASK_LOST`.
- **O arquivo modelo**: nenhum declarado; a unidade segue C21, C23 e C26 direto.

### As skills e a leitura

As linhas de `@aws-sdk/client-ecs`, `client-sqs`, `client-ssm`, `client-s3tables` e
`@smithy/node-http-handler` do `stack.md`: a skill `aws-sdk-js-v3-usage`. O guia de dados, D25 e
D27; a security S8 e S41.

### A ordem do trabalho

1. **O adaptador.** Critérios: 33, 38, 39. As três portas em `aws.ts`, com os prazos e o teto de
   resposta de hoje; as gravações de `PutParameter`, `DeleteParameter`, `RunTask`, `StopTask`,
   `DescribeTasks`, `ReceiveMessage`, `DeleteMessage`, `ListTables` e `DeleteTable`, feitas na conta de
   laboratório (T29); os dublês em `test-aws.ts`.
2. **Ligar no lago.** Critério: 32. `enable.ts` lê a linha do lago da empresa (U6) e recusa
   `COPY_LAKE_NOT_READY` quando ela não está `ready`; `listCopyModels` devolve `places`.
3. **O disparo e a varredura.** Critérios: 33, 34, 37, 39, 40.
   - **Arquivos:** cria `lake-run.ts`; muda `service.ts` (a rodada de uma cópia `LAKE` vai a
     `lake-run.ts`) e `workflow.ts`.
   - **O que entra:** a varredura das rodadas abertas da cópia; o `INSERT` da rodada, recusado pelo
     índice; a especificação (`CopyTaskSpec`, com o selo aberto); o `PutParameter`, refeito na cota;
     o `RunTask` com o papel que escreve da empresa e o token; `task_arn` gravado. Regras: data D25;
     S8; C50.
   - **Testes:** `lake-run.test.ts` contra o servidor de respostas gravadas e um PostgreSQL local.
   - **Mutações à mão:** tirar a varredura: o 37 fica vermelho.
4. **O fim.** Critérios: 35, 36, 38, 43, 45. Cria `lake-queue.ts`: o consumidor, o parser do
   evento, `closeLakeRun`. A mensagem só é apagada da fila depois do fim gravado.
   - **Testes:** `lake-queue.test.ts`: o resultado e depois a parada; a parada sozinha; a mesma
     mensagem duas vezes; a mensagem ilegível.
   - **Mutações à mão:** tirar o `ended_at IS NULL`: a parada que chega depois reescreve o resultado e
     o 35 fica vermelho.
5. **A cópia do lago fora do banco.** Critério: 64. Testes: `routes.test.ts`, "a cópia do lago fica
   fora do banco".
6. **Apagar.** Critérios: 41, 42. A cópia: parar a tarefa, fechar a rodada `INTERRUPTED`, apagar a
   tabela, o relógio e a linha, nessa ordem; a conexão que sai leva as cópias do lago dela pelo mesmo
   caminho. O lago: as tabelas das duas áreas, as cópias do lago da empresa, depois o fluxo da etapa 1.
7. **A #1135.** Critério: 44. O código do sistema cortado em `SYSTEM_CODE_MAX` antes de gravar.
8. **Os testes na AWS.** Critérios: 40, 41, 42 (L.8, L.9).

### Como se prova

Pelas rotas de ligar, rodar agora e apagar, e pela fila do servidor de respostas gravadas, com um
PostgreSQL local; a varredura por um disparo com uma rodada aberta antiga. Hoje nada disso existe.

### Parar se

- O tempo que a AWS guarda o `clientToken`, lido no tipo instalado, é menor que a espera da
  repetição.
- O selo aberto de uma credencial passa dos 4 KB com a declaração.
- O evento de parada do ECS não traz o `startedBy`, e a rodada não se acha pela tarefa.

## U8 A tela

**Base e modelo.** A U7. Sonnet: duas frases, um campo e uma marca em telas que existem.

### As linhas da tabela

- **Linha 18.** Ler `C/apps/web/src/hub/copies/new-copy.tsx:98-118` e `copy-list.tsx:230-263`;
  seguir a captura do Airbyte (`cloud-status-page.png`) só na ideia de mostrar o destino por linha.
- **Linha 19.** Ler `C/apps/web/src/hub/copies/copy-detail.tsx:105-109`, `:170-305`,
  `copy-facts.tsx:104-112` e `text.ts:88-89`; seguir `AP .../locales/en.json:1088-1094`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/copies/` | Muda `new-copy.tsx`, `copy-list.tsx`, `copy-detail.tsx`, `copy-facts.tsx`, `copy-sample.tsx`, `copy-readers.tsx`, `text.ts`, `test-hub.tsx` | a página Dados |

### Os contratos que a unidade cria

- Nenhum contrato novo. Os textos, todos em `text.ts` (C26): "Onde guardar", "No banco da empresa",
  "No lago", a marca "No lago", "Completa · inteira", "Completa · só o que mudou", "As linhas ficam
  no lago da empresa.", e as frases dos quatro códigos novos da matriz de estados. A cópia do banco
  continua com o Resultado de hoje.

### As skills e a leitura

As linhas de `react` e das peças de `apps/web/src/ui/` do `stack.md`. O guia de web e o de desenho;
o `DESIGN.md`.

### A ordem do trabalho

1. **O diálogo.** Critério: 46. A escolha entre duas opções com a peça que o catálogo de `ui/` dá para
   isso (`apps/web/src/ui/toggle-group.tsx`, ou o `ChoiceSelect` que o diálogo já usa,
   `new-copy.tsx:98-118`), só quando `places` tem `LAKE`.
2. **A lista e a tabela.** Critérios: 47, 48, 65. As abas Amostra e Colunas e a liberação a Projetos de
   uma cópia do lago mostram a frase da matriz e não chamam o Hub. O selo de hoje com o texto novo; o Resultado com o tipo
   da rodada pelo `whole`; a frase do lugar.
   - **Testes:** os três arquivos de teste da tela, com o Hub falso de `test-hub.tsx`.

### Como se prova

Pela tela com o Hub falso; na QA, pelo Hub local com o servidor de respostas gravadas, a 1366 e
390 px, claro e escuro.

### Parar se

- O texto de um estado precisa de uma decisão que a matriz não traz.

## G5 O ponto de conferência

Depois da U8: o Hub local com o servidor de respostas gravadas; ligar uma cópia no lago, rodar
agora, o fim pela fila, a varredura de uma rodada antiga, apagar a cópia e o lago; a QA da parte 1; na
nuvem, depois da publicação, o firstmate faz o roteiro 1 a 4 antes de chamar o fundador.

## U9 Só o que mudou

**Base e modelo.** O `main` depois da parte 1 usada. Opus: o estado, a atual e a limpeza mudam
juntos, e entre duas instruções a tabela fica num estado do meio.

### As linhas da tabela

- **Linha 9.** Seguir `meltano@4.4.1 meltano/core/plugin/singer/target.py:100-120` (o estado salvo a
  cada linha que o gravador devolve) e `core/state_store/filesystem.py:45`, `:191-228`
  (`<prefixo>/<id>/state.json`), com o depósito `S3` nativo do Meltano (T.1); a opção
  `state_backend.uri` (`meltano/core/bundle/settings.yml:18-19`, `:54-68`). Não depender de
  `lock_retry_seconds` (`state_store/base.py:160`): quem garante uma rodada por cópia é o Hub.
- **Linha 15.** Seguir a forma medida na AWS, `conexus-lab-trilho/fases2a4/atualizar.py:66-127`:
  três `MERGE` do Athena, um por caso, e um `DELETE` para a passada inteira; `DLT
  dlt/destinations/sql_jobs.py:1120-1139` para o `MERGE INTO`.
- **Linha 16.** A limpeza da bruta (decisão A): um `DELETE` do Athena das linhas que já entraram na
  atual, depois de cada atualização; a manutenção do `S3 Tables` tira os arquivos depois.
- **Linha 1.** O modo incremental da declaração do kit, já lido pelo adaptador (U3).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/extraction/` | Cria `src/conexus_extraction/update.py`; muda `entry.py`, `meltano.yml`, `tests/`; a atualização da janela (critério 66) | a imagem |
| `apps/extraction/tap/` | Muda: a retomada pelo `--state` e o modo incremental | o `meltano.yml` |
| `infra/aws/lib/` | Muda `copy.ts` (o depósito do estado), `lake.ts` (o prefixo do estado da empresa e o grupo de consultas do lago para o papel que escreve), `platform.ts` (o Hub apaga o prefixo de uma cópia) | o Hub, pela Release |
| `apps/server/src/hub/copies/` | Muda `lake-run.ts` (`whole` pelo modo), `leave.ts` (apagar a atual e o estado) | — |
| `apps/server/src/platform/aws.ts`, `recordings/aws/` | Muda: apagar o prefixo do estado; as gravações do Athena | — |

### Os contratos que a unidade cria

- **O estado** de uma cópia mora em `s3://<depósito do estado>/<empresa>/<cópia>/state.json`, na
  forma do Meltano (`{"completed": {"singer_state": …}, "partial": {}}`); a entrada da tarefa passa o
  URI ao Meltano pela configuração; só o papel da empresa lê e escreve o prefixo dela.
- **`CopyTaskResult.outcome.rows`** passa a ser a contagem da atual depois da atualização.
- **`CopyTaskSpec.whole`**: verdadeiro na rodada de domingo e na primeira; falso nas outras de uma
  cópia incremental.
- `update.py`: `update(table, whole) -> UpdateCounts` com as três instruções e a limpeza; cada
  instrução espera o fim no Athena e uma falha termina a rodada `COPY_LAKE_WRITE_FAILED`.
- **A janela** (decisão F (a)): o atualizar de uma cópia com `window` tira da atual as linhas da
  janela que a passada não trouxe e as que saíram da janela, a forma de hoje no banco
  (`C/apps/server/src/platform/copy-sql.ts:287-301`). Critério: 66.
- **O arquivo modelo**: `conexus_extraction/target.py` (U4).

### As skills e a leitura

As linhas do Meltano e do PyIceberg do `stack.md`; a de `@aws-sdk/client-athena` para as
gravações. O guia de dados, D25.

### A ordem do trabalho

1. **O estado.** Critérios: 49, 50. O depósito e o prefixo; o `meltano.yml` com o `state_backend`;
   a retomada no adaptador. Testes: `test_state.py` com um depósito de arquivo local, que tem a mesma
   forma.
2. **A atual e a limpeza.** Critérios: 51, 52. `update.py` e a chamada no fim da carga.
   - **Testes:** `test_update.py` contra as gravações do Athena; o L.7 na conta de laboratório.
   - **Mutações à mão:** limpar antes do `MERGE`: a atual perde as linhas da rodada e o 51 fica
     vermelho.
3. **O modo no Hub.** Critério: 53. O relógio de hoje já cria a rodada de domingo de uma cópia
   incremental (`clock.ts:24-25`, `:110-116`); `lake-run.ts` passa `whole` ao parâmetro.
4. **Apagar.** Critério: 54. A atual e o prefixo do estado saem com a cópia.
5. **Os testes na AWS.** Critérios: 50, 51, 52 (L.4, L.7).

### Como se prova

Pelo `meltano run` com o depósito de estado local e o dublê do Sankhya que muda uma nota (U2); na
AWS, pela conta de laboratório. Hoje a segunda rodada relê tudo.

### Parar se

- O `MERGE` do Athena sobre o `S3 Tables` recusa a forma medida na fase 4 (que rodou numa fonte
  gerada).
- O Meltano grava o estado antes de o gravador confirmar um lote (o contrário de `target_base.py:479-492`).

## G6 O ponto de conferência

Depois da U9: o `meltano run` local com duas rodadas; o L.4 e o L.7 na conta de laboratório; a QA da
parte 2; na nuvem, o firstmate faz o roteiro 5 a 7 antes de chamar o fundador.

## U10 As tabelas da parada

**Base e modelo.** O `main` depois da parte 2 usada. Sonnet: tabelas e permissões nomeadas.

### As linhas da tabela

- **Linha 24.** Ler `C/apps/server/src/hub/notifications/tables.ts:154-234` (`alert_recipient`, que
  fica; `copy_follower` e `copy_notice`, que a U6 já tirou) e `:125-150` (`request_notice`, a forma da linha
  no sino que a parada segue).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/notifications/tables.ts`, `hub/copies/tables.ts` | Muda | `hub/notifications/`, `hub/copies/` |
| `apps/server/drizzle/`, `database-grants.sql`, a foto do catálogo | Cria a migração; muda as permissões | `migrate`; `catalog.test.ts` |

### Os contratos que a unidade cria

| Tabela | Coluna | Tipo | Restrição | Ao apagar |
| --- | --- | --- | --- | --- |
| `copies.copy` | `stopped_since`, `stopped_code` | `timestamptz`, `text` | os dois nulos ou os dois não; o código em `CopyRunFailureCode` | — |
| `notifications.connection_stop` | `company_id`, `connector_id`, `connection_id`, `since`, `told_at` | `text`, `text`, `uuid`, `timestamptz NOT NULL`, `timestamptz` | chave `(company_id, connection_id)` | a conexão (`company_id, connector_id, connection_id`): `cascade`; a empresa: `cascade` |
| `notifications.copy_stop_notice` | `id`, `company_id`, `person_id`, `connection_name`, `tables`, `code`, `created_at`, `read_at` | `uuid`, `text`, `text`, `text`, `text[]`, `text`, `timestamptz`, `timestamptz` | `tables` com ao menos um nome; o código em `CopyRunFailureCode`; as políticas da pessoa, como `request_notice` | o membro: `cascade`; nenhuma chave para a conexão, que pode sair antes (data D17) |

- As permissões do login da empresa nas duas tabelas novas; em `alert_recipient` ele já tem
  `SELECT`, `INSERT` e `DELETE` (`C/apps/server/database-grants.sql:456`).
- `told_at`: a hora do último e-mail daquela parada, o primeiro ou um lembrete.
- **O dono do fato**: os códigos, `CopyRunFailureCode` de `hub-api` (C26).

### As skills e a leitura

A skill `drizzle`. O guia de dados, D6, D11, D15, D17.

### A ordem do trabalho

1. **A migração e as permissões.** Critério: 55, com a palavra do fundador (data D11), pedida no
   começo da parte 3.
   - **Testes:** `tables.test.ts` das notificações e `catalog.test.ts`.

### Como se prova

Pelo `migrate` num PostgreSQL local.

### Parar se

- A parada precisa de uma coluna que a U11 descubra só no teste.

## G7 O ponto de conferência

Depois da U10: o `migrate` num PostgreSQL local, a foto do catálogo, o `catalog.test.ts`.

## U11 O aviso de cópia parada

**Base e modelo.** O G7 mesclado. Opus: duas rodadas de uma conexão que falham juntas não podem dar
dois e-mails, e uma que volta não pode dar nenhum.

### As linhas da tabela

- **Linha 24.** Ler `C/apps/server/src/hub/notifications/notifications.ts:104-180` (`recorded`,
  `mailed`: o aviso de automação gravado e o e-mail depois), `:282-322`, `mail.ts`,
  `automation-email.tsx`, e `request-notices.ts` (a linha no sino por pessoa). As referências avisam
  por rodada (`AP .../JobsHandler.kt:55-76`; `NK:12403-12404`); o aviso por parada, com lembrete, é
  nosso (decisão C).
- **Linha 13.** O lembrete usa o relógio do Mastra como a cópia (`C/apps/server/src/builder/copy-clock/clock.ts:59-104`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/notifications/` | Cria `copy-stop.ts`, `copy-stop-email.tsx`; muda `notifications.ts` (a lista do sino), `notification-render.d.mts` | `hub/copies/lake-queue.ts`, `hub/copies/leave.ts` |
| `apps/server/src/hub/copies/lake-queue.ts`, `list.ts` | Muda: `closeLakeRun` anota e tira a parada; `CopySummary.stopped` | — |
| `apps/server/src/builder/copy-clock/` | Muda: o relógio do lembrete de uma parada | — |
| `apps/server/package.json` (o `build` que compila os e-mails com `esbuild`), `.gitignore` | Muda: o segundo modelo de e-mail | a Release |
| `packages/hub-api/src/copies.ts`, `notifications.ts` | Muda: `stopped`; o aviso de parada no sino | U11 na tela |
| `apps/web/src/hub/copies/`, `apps/web/src/hub/notifications/bell.tsx` | Muda: a marca **Parada**; a linha no sino | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/copies.ts
CopySummary // gains: stopped: z.object({ since: z.iso.datetime(), code: CopyRunFailureCode }).nullable()
// packages/hub-api/src/notifications.ts — the bell gains one kind
z.object({ kind: z.literal('COPY_STOPPED'), connection: z.string(), tables: z.array(CopyName).min(1), code: CopyRunFailureCode })
// apps/server/src/hub/notifications/copy-stop.ts
/** Called inside closeLakeRun's transaction; the mail goes after the commit. */
export function stopped(tx: CommandTx, run: { companyId: CompanyId; copyId: CopyId; connectionId: ConnectionId; code: CopyRunFailureCode }): Promise<'OPENED' | 'ALREADY_OPEN'>
export function recovered(tx: CommandTx, run: { companyId: CompanyId; copyId: CopyId; connectionId: ConnectionId }): Promise<'CLOSED' | 'STILL_STOPPED'>
```

- **Quem abre a parada da conexão**: o `INSERT ... ON CONFLICT DO NOTHING RETURNING` em
  `connection_stop`; só a transação que recebe a linha grava as linhas do sino e manda o e-mail.
- **O lembrete**: um relógio por parada de conexão, criado com ela e apagado quando ela fecha,
  diário na hora de T.15, no `mastra.schedules` (data D27); a primeira hora dele é o dia
  seguinte. Apagar a cópia ou a conexão chama `recovered` (de `leave.ts`), e a última tabela que sai
  fecha a parada e o relógio.
- **Quem recebe**: os membros com papel de Dono ou Administrador da empresa, e a lista
  `alert_recipient`; o texto do e-mail nunca leva uma linha de dado nem a mensagem crua do sistema
  (S41).
- **O arquivo modelo**: nenhum declarado; a unidade segue C21 e C26 direto, com a forma de
  `hub/notifications/request-notices.ts`.

### As skills e a leitura

As linhas de `react-email`, `@react-email/render` e `@mastra/core` do `stack.md`: a skill `mastra`.
O guia de web; a security S41.

### A ordem do trabalho

1. **A parada e a volta.** Critérios: 56, 57, 58, 60. `copy-stop.ts`, chamado por `closeLakeRun`
   só para cópias do lago.
   - **Testes:** `copy-stop.test.ts`, com duas rodadas da mesma conexão que fecham juntas.
   - **Mutações à mão:** tirar o `ON CONFLICT`: o 57 dá dois e-mails e fica vermelho.
2. **O e-mail e o sino.** Critérios: 56, 61, 62. O modelo do e-mail; a linha do sino; o e-mail
   que não sai, registrado.
3. **O lembrete.** Critério: 59. O relógio por parada.
4. **A tela.** Critério: 61. A marca **Parada** com o motivo; a linha no sino.

### Como se prova

Pela fila do servidor de respostas gravadas com resultados de erro e de sucesso, um PostgreSQL local
e o e-mail de teste de hoje; o lembrete pelo disparo do relógio. Hoje nenhum aviso de cópia existe.

### Parar se

- O sino de hoje não aceita um tipo novo sem mudar a forma de todos.
- A lista de Donos e Administradores de uma empresa não se lê no escopo da empresa.

## U12 A lista de e-mails

**Base e modelo.** O G7 mesclado. Sonnet: uma lista de três rotas e uma seção de Configurações.

### As linhas da tabela

- **Linha 30.** Ler `C/apps/server/src/hub/notifications/tables.ts:153-172` (`alert_recipient`,
  único por empresa sem caixa) e `C/docs/reference/telas.md:311` (o lugar: Configurações, Avisos,
  "a etapa 2 do lago"). A Nekt manda o aviso a uma lista de e-mails da empresa (`NK:22357-22360`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/notifications.ts` | Muda: as três operações | a tela |
| `apps/server/src/hub/notifications/` | Muda `routes.ts`; cria `alert-recipients.ts` | U11 lê a lista |
| `apps/web/src/hub/identity/` | Cria `alert-recipients.tsx`, a seção **Avisos** de Configurações, ao lado de `company-general.tsx`; muda o índice de Configurações (web W32) | — |

### Os contratos que a unidade cria

- `GET /api/companies/{companyId}/alert-recipients`, `POST` (corpo `{ email }`, 201, falhas
  `ALERT_RECIPIENT_EXISTS` 409, `FORBIDDEN` 403) e `DELETE .../{recipientId}` (204; 404
  `ALERT_RECIPIENT_NOT_FOUND`), só para Dono e Administrador (S8). O e-mail com o esquema Zod de
  e-mail de hoje (C27); `AlertRecipientId` com marca (C23).
- **O arquivo modelo**: as rotas de `hub/notifications/routes.ts`.

### As skills e a leitura

As linhas de `fastify` e `react` do `stack.md`. O guia de web e o de desenho.

### A ordem do trabalho

1. **As rotas.** Critério: 63. Testes: `routes.test.ts`, "a lista de e-mails".
2. **A seção Avisos.** Critério: 63. Testes: `alert-recipients.test.tsx`.

### Como se prova

Pelas rotas com um PostgreSQL local e pela tela com o Hub falso.

### Parar se

- A decisão I não for a (a): a unidade sai.

## G8 O ponto de conferência

Depois da U12: o Hub local com o servidor de respostas gravadas; uma rodada com erro, o e-mail, o
sino, a volta, o lembrete pelo disparo do relógio, a lista de e-mails; a QA da parte 3; na nuvem, o
firstmate faz o roteiro 8 antes de chamar o fundador, e a etapa fecha (delivery L19).
